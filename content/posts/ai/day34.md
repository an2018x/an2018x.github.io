---
title: "Day 34 · SGLang & RadixAttention"
date: '2026-06-20T00:00:00+08:00'
draft: false
description: "学习 SGLang 推理框架与 RadixAttention:理解前缀缓存、共享 prefix 的请求调度、Radix Tree 如何复用 KV Cache,并动手用同一个 system prompt 发多请求观察缓存命中。"
toc: true
tags:
  - AI
  - LLM
  - SGLang
  - RadixAttention
  - Prefix Cache
  - Inference
  - Serving
---

DAY 34 · AI INFRA ROADMAP · 60 DAYS

# 用 _RadixAttention_ 复用前缀 KV Cache

Day 33 关注 continuous batching:请求如何在运行中进出 batch。 Day 34 关注另一个推理服务里的常见收益点: **多个请求共享同一段 prefix** 时, 能不能少做 prefill?SGLang 的答案是 RadixAttention: 把已经处理过的 token prefix 和 KV Cache 放进 radix tree, 新请求到来时自动找最长共享前缀,复用命中的 KV,只计算后面的差异部分。

**DURATION** 3 h **THEORY** 55 min **HANDS-ON** 1.5 h **METRICS** cached tokens · TTFT · throughput **STACK** SGLang · RadixAttention · OpenAI API

## 思维导图

OVERVIEW

> **图：Day 34 SGLang 与 RadixAttention 思维导图**
>
> - DAY 34 · SGLang & RadixAttention
> - PREFIX CACHE · RADIX TREE · SHARED PROMPT · CACHE HIT
> - 01 · WHY
> - 共享前缀
> - 02 · TREE
> - Radix Tree
> - 03 · RUN
> - SGLang Server
> - 04 · OBSERVE
> - 缓存命中
> - system prompt
> - few-shot examples
> - RAG 长文档
> - 多轮对话
> - 最长 prefix match
> - node split
> - reference count
> - LRU eviction
> - launch\_server
> - OpenAI API
> - enable-cache-report
> - disable-radix-cache baseline
> - cached\_tokens
> - TTFT 下降
> - prefill 变短
> - exact token match
> - DELIVERABLES
> - RadixAttention 笔记
> - SGLang 启动命令
> - 共享 system prompt 脚本
> - 缓存命中报告

FIG · Day 34 全景:用 RadixAttention 把重复 prefill 变成 prefix cache hit

## 为什么需要 Prefix Cache

25 MIN

在线 LLM 服务里,请求经常共享大段前缀: 同一套 system prompt、同一组工具定义、同一段 few-shot 示例、同一篇 RAG 文档。 如果每条请求都重新 prefill 这些相同 token,就会浪费 GPU 计算和 TTFT。

SYSTEM PROMPT

### 所有用户共享规则

客服、代码助手、Agent 平台通常有很长的系统提示和工具协议。只要字符串和 chat template 完全一致,就有复用机会。

RAG

### 同文档多问题

多个问题围绕同一篇论文、合同、日志或代码文件时,文档上下文可以作为共享 prefix,后面接不同 query。

MULTI-TURN

### 对话历史递增

多轮对话的后续请求会包含前面轮次,天然形成“旧历史 + 新问题”的树状复用结构。

without cache: N requests × shared\_prefix\_tokens

每条请求都重复 prefill 同一段共享上下文。

with prefix cache: shared\_prefix\_tokens + N × unique\_suffix\_tokens

共享前缀只计算一次,后续请求复用已缓存的 K/V。

Prefix cache 只对“token 序列完全一致”的前缀生效。空格、标点、大小写、chat template、工具定义顺序都可能改变 token 序列。

## RadixAttention 的核心机制

45 MIN

RadixAttention 不是新的注意力数学公式,而是一套 KV Cache 组织和调度机制。 它把已处理过的 token 序列压进 radix tree:公共前缀共享同一个路径, 分叉处拆成不同子节点。新请求进来时先找最长已缓存 prefix, 命中的部分直接拿 KV Cache,未命中的 suffix 再进入 prefill。

> **图：RadixAttention prefix tree 示例**
>
> - Radix Tree 保存共享 Token Prefix
> - ROOT · SHARED SYSTEM PROMPT · BRANCH BY USER QUERY
> - root
> - system prompt + tool schema
> - 用户 A:解释 KV Cache
> - 用户 B:解释 PagedAttention
> - 用户 C:比较 vLLM/SGLang
> - 后续请求只要共享上方路径,就可以跳过这段前缀的重复 prefill

FIG · RadixAttention 用树结构表达“共享前缀 + 不同分支”的请求形态

| 操作 | 发生时机 | 做什么 | 工程含义 |
| --- | --- | --- | --- |
| Prefix match | 请求进入 waiting queue 后。 | 在 radix tree 中找最长已缓存 token prefix。 | 命中越长,prefill 越少,TTFT 越低。 |
| Insertion | 请求完成或生成推进后。 | 把 token 序列和对应 KV cache index 插入树。 | 后续请求可以复用这段路径。 |
| Node split | 新请求在已有节点中间分叉。 | 拆分节点,让公共部分继续共享,差异部分变成子分支。 | 适合多轮对话和树状 Agent 任务。 |
| Eviction | KV Cache 空间不足时。 | 按 LRU/LFU/FIFO 等策略回收可驱逐节点。 | 缓存命中率和显存压力之间需要平衡。 |

## 启动 SGLang Server

30 MIN

SGLang 提供 OpenAI-compatible API,默认常用端口是 `30000`。今天用小模型先跑通观察链路; 如果有足够显存,可以换成 7B/8B Instruct 模型。

### 安装与启动

```
python -m venv .venv-sglang
source .venv-sglang/bin/activate

pip install -U pip
pip install -U "sglang[all]" openai

export MODEL=qwen/qwen2.5-0.5b-instruct

python3 -m sglang.launch_server \
  --model-path ${MODEL} \
  --host 0.0.0.0 \
  --port 30000 \
  --enable-cache-report \
  --log-requests
```

成功标志

### 服务 ready

等待日志出现 server ready 类似信息后,访问 `http://localhost:30000/docs` 或发送 OpenAI API 请求。

对照实验

### 关闭 radix cache

为了做 baseline,可以另起一组服务加 `--disable-radix-cache`,对比相同请求下 cached tokens 和 TTFT。

### OpenAI API 烟测

```
curl http://localhost:30000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen/qwen2.5-0.5b-instruct",
    "messages": [
      {"role": "system", "content": "你是一个简洁的 AI Infra 助教。"},
      {"role": "user", "content": "用一句话解释 RadixAttention。"}
    ],
    "temperature": 0,
    "max_tokens": 96
  }'
```

## 动手:同 system prompt 观察命中

50 MIN

实验设计很简单:保持 system prompt 完全相同,只改变 user question。 第一个请求会把共享前缀放进缓存;后续请求应该能复用这段 prefix。 我们用 `--enable-cache-report` 和 `return_cached_tokens_details` 观察 cached tokens。

```
from openai import OpenAI
import time

MODEL = "qwen/qwen2.5-0.5b-instruct"
client = OpenAI(base_url="http://localhost:30000/v1", api_key="EMPTY")

SYSTEM_PROMPT = """你是一个 AI Infra 助教。
回答必须使用中文。
回答结构固定为:概念、为什么重要、排查建议。
不要输出无关寒暄。"""

questions = [
    "解释 KV Cache 为什么会成为推理显存大头。",
    "解释 PagedAttention 解决了什么问题。",
    "解释 continuous batching 为什么能提高吞吐。",
    "比较 vLLM 和 SGLang 的缓存思路。",
]

def cached_tokens(resp):
    details = getattr(resp.usage, "prompt_tokens_details", None)
    return getattr(details, "cached_tokens", None) if details else None

for i, q in enumerate(questions, 1):
    t0 = time.perf_counter()
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": q},
        ],
        temperature=0,
        max_tokens=128,
        extra_body={"return_cached_tokens_details": True},
    )
    dt = time.perf_counter() - t0
    usage = resp.usage
    print({
        "i": i,
        "latency_s": round(dt, 3),
        "prompt_tokens": usage.prompt_tokens,
        "cached_tokens": cached_tokens(resp),
        "completion_tokens": usage.completion_tokens,
    })
    print(resp.choices[0].message.content[:120], "\n")
```

### 先跑一轮预热

第一次请求通常包括加载、编译、缓存插入等额外开销,不要把它当稳定指标。

### 固定 system prompt

保持字符串完全一致,包括换行、空格、标点和大小写。

### 记录 cached tokens

后续请求如果命中共享 prefix,应该看到 cached tokens 增加。

### 做反例

改一个空格或标点,观察 cached tokens 和延迟是否变化。

### 反例:一个字符也可能破坏命中

```
SYSTEM_PROMPT_A = "你是一个 AI Infra 助教。回答必须使用中文。"
SYSTEM_PROMPT_B = "你是一个AI Infra助教。回答必须使用中文。"

# 对人类看起来差不多,但 tokenizer 看到的是不同 token 序列。
# prefix cache 按 token id 精确匹配,不要依赖“语义相似”。
```

## 共享 Prefix 的请求调度

30 MIN

Prefix cache 不是单纯的“查一下字典”。 调度器要在等待队列里识别哪些请求已经命中缓存、命中多长、哪些 KV 正在被活跃请求引用, 然后把有限的 GPU token budget 分给 prefill 和 decode。

| 调度问题 | 没有 Prefix Cache | 有 RadixAttention | 观测指标 |
| --- | --- | --- | --- |
| 长 system prompt | 每个请求都完整 prefill。 | 首个请求 prefill,后续复用命中 prefix。 | cached\_tokens、TTFT。 |
| RAG 同文档多问 | 同一文档反复占用 prefill 计算。 | 文档部分成为共享路径,问题部分成为分支。 | prompt throughput、cache hit rate。 |
| 缓存满了 | 通常只保留活跃请求 KV。 | 已完成请求的可复用 KV 也可能保留,满时再驱逐。 | protected/evictable cache size。 |
| 请求格式漂移 | 影响不明显。 | 会降低 prefix 命中率。 | cached tokens 突然下降。 |

工程建议

### 把 prompt 模板标准化

如果你希望系统 prompt、工具 schema、few-shot 示例被缓存,就要把它们集中在模板层生成, 不要让各业务方自由拼字符串。缓存命中率经常输在“多了一个换行”。

## 压测与对照实验

30 MIN

Day34 的压测目标不是最大吞吐,而是证明 prefix cache 真的生效。 用相同请求集跑两组:默认 RadixAttention 与 `--disable-radix-cache` baseline。 对比 cached tokens、TTFT、总耗时和 prompt throughput。

### 使用 bench\_serving 随机负载

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --host http://localhost:30000 \
  --dataset-name random \
  --num-prompts 100 \
  --random-input 512 \
  --random-output 128 \
  --request-rate 10 \
  --max-concurrency 32
```

### 更适合 Day34 的自定义负载

```
workload:
  shared_prefix:
    - long_system_prompt
    - tool_schema
    - few_shot_examples
  variable_suffix:
    - user_question_001
    - user_question_002
    - user_question_003

compare:
  A: default radix cache
  B: --disable-radix-cache

metrics:
  - cached_tokens
  - p50_ttft_ms
  - p95_ttft_ms
  - output_tokens_per_s
  - prompt_throughput
  - gpu_memory_used
```

## 常见疑问

FAQ

### Q1 · RadixAttention 和 PagedAttention 是替代关系吗?

A

不是简单替代。PagedAttention 主要解决 KV Cache 的分页管理和碎片问题;RadixAttention 关注跨请求的共享 prefix 复用。两者都围绕 KV Cache,但切入点不同。

### Q2 · 为什么语义相同的 prompt 不能复用?

A

KV Cache 对应的是精确 token 序列的中间状态。语义相似但 token id 不同,attention 的输入就不同,不能直接复用。prefix cache 匹配的是 token,不是自然语言含义。

### Q3 · 缓存命中会不会改变模型输出?

A

正常情况下不会。它复用的是同一 token prefix 已经计算出的 K/V,等价于重新 prefill 那段 prefix。输出差异通常来自采样随机性、并发非确定性或实现细节,不是 prefix cache 的语义变化。

### Q4 · 哪些业务最适合 RadixAttention?

A

长 system prompt、多工具 Agent、同文档多问、few-shot 分类、多轮对话、代码仓库问答都很适合。完全随机的短 prompt 工作负载收益会小很多。

## 复盘问题

6 QUESTIONS

1. 用自己的话解释 RadixAttention 为什么要用 radix tree 保存 KV Cache。
2. Prefix cache 为什么必须做 token 级精确匹配?哪些模板变化会破坏命中?
3. 对比 PagedAttention 和 RadixAttention:它们分别解决 KV Cache 的什么问题?
4. 如果 cached tokens 很少,你会从 prompt 模板、chat template、请求顺序哪些方向排查?
5. 设计一个“同文档多问”的压测负载,说明你会记录哪些指标。
6. 为什么缓存命中能降低 TTFT,但不一定明显降低长输出阶段的 TPOT?

## 今日检查清单

10 ITEMS

- 能解释 SGLang 的定位:高吞吐、低延迟推理框架,支持 OpenAI-compatible API。
- 能用 `python3 -m sglang.launch_server` 启动一个本地服务。
- 能用 OpenAI SDK 请求 `http://localhost:30000/v1`。
- 能解释 prefix cache 与 KV Cache 的关系。
- 能画出共享 system prompt 的 radix tree 分叉示意。
- 能解释 prefix match、node split、insertion、eviction 四个操作。
- 能开启 `--enable-cache-report` 并读取 cached tokens。
- 能用相同 system prompt 多请求观察缓存命中。
- 能做 `--disable-radix-cache` 对照实验。
- 能写出 prompt 模板标准化建议,避免无意破坏 cache hit。

## 推荐阅读

5 ITEMS

SGLang

### [Quickstart](https://docs.sglang.io/docs/get-started/quickstart)

官方快速开始,重点看安装、`launch_server`、OpenAI Python Client 和 streaming 调用。

API

### [OpenAI Compatible API](https://sgl-project-sglang-93.mintlify.app/backend/openai-compatible-api)

查看 Chat Completions、鉴权、cache reporting 和 `return_cached_tokens_details`。

Radix

### [RadixAttention](https://sgl-project-sglang-93.mintlify.app/concepts/radix-attention)

理解 prefix matching、node splitting、eviction policies、page alignment 和限制条件。

Paper

### [SGLang Paper](https://arxiv.org/abs/2312.07104)

论文介绍 SGLang frontend/runtime,以及 RadixAttention 如何在复杂 LLM 程序中复用 KV Cache。

NEXT

### 权重量化

Day35 进入推理成本优化的另一条主线:INT8/INT4、GPTQ、AWQ,以及如何用量化降低模型权重显存。

## Day 35 预告

NEXT

COMING NEXT

### 量化:INT8 / INT4 / GPTQ / AWQ

今天我们通过 prefix cache 复用减少重复 prefill。 Day35 会从另一个角度降低推理成本:把权重用更低 bit 表示, 学习 INT8、INT4、GPTQ、AWQ 的基本原理,并动手量化一个模型。

Prefix cache 的收益,常常不是来自更聪明的答案,而是来自更一致的请求形状。

DAY 34 · SGLANG & RADIXATTENTION · AI INFRA ROADMAP
