---
title: "Day 32 · vLLM 实战"
date: '2026-06-20T00:00:00+08:00'
draft: false
description: "动手部署一个 7B 模型到 vLLM,开启 OpenAI 兼容 API,学习 --max-num-seqs 与 --gpu-memory-utilization 的调参方法,并建立推理服务压测与排错流程。"
toc: true
tags:
  - AI
  - LLM
  - vLLM
  - Inference
  - OpenAI API
  - PagedAttention
  - Serving
---

DAY 32 · AI INFRA ROADMAP · 60 DAYS

# 把 7B 模型部署成 _OpenAI API_

Day 29-31 已经把 LLM 推理拆成 prefill、decode、KV Cache 和 PagedAttention。 Day 32 进入真正的服务化实战:用 **vLLM** 拉起一个 7B 级别模型, 暴露 OpenAI 兼容接口,用 curl 和 OpenAI SDK 验证调用, 再通过 `--max-num-seqs` 与 `--gpu-memory-utilization` 做第一轮吞吐/延迟调参。

**DURATION** 3 h **THEORY** 35 min **HANDS-ON** 2 h **METRICS** TTFT · TPOT · throughput · VRAM **STACK** vLLM · OpenAI SDK · curl · nvidia-smi

## 思维导图

OVERVIEW

> **图：Day 32 vLLM 实战思维导图**
>
> - DAY 32 · vLLM Hands-on
> - 7B MODEL · OPENAI API · TUNING · BENCHMARK
> - 01 · PREP
> - 环境与模型
> - 02 · SERVE
> - vllm serve
> - 03 · API
> - OpenAI 兼容
> - 04 · TUNE
> - 参数调优
> - CUDA / driver
> - vllm / openai
> - 7B 模型下载
> - 显存预算
> - host / port
> - served-model-name
> - max-model-len
> - api-key
> - /v1/models
> - chat completions
> - stream=true
> - OpenAI SDK
> - max-num-seqs
> - gpu-memory-utilization
> - bench serve
> - DELIVERABLES
> - 启动命令
> - OpenAI 调用脚本
> - 调参矩阵
> - 压测记录

FIG · Day 32 全景:从启动 vLLM 到 API 验证,再到并发与显存预算调参

## 今天要跑通什么

15 MIN

01

### 确认 GPU

用 `nvidia-smi` 看显存、驱动、空闲进程。7B BF16 建议至少 24GB 显存。

02

### 安装 vLLM

准备 Python 环境,安装 `vllm` 与 `openai` 客户端。

03

### 启动服务

用 `vllm serve` 加载 7B 模型并监听 `:8000`。

04

### 验证 API

访问 `/v1/models` 和 `/v1/chat/completions`。

05

### 调参压测

改变并发上限和显存占比,记录 TTFT、TPOT、tokens/s 和 OOM 边界。

Day32 不是追求一次跑出最高分,而是建立一套可复现实验流程:参数、负载、指标、日志必须能对应起来。

## 环境与模型选择

25 MIN

RoadMap 写的是“部署一个 7B 模型”。这里用 `Qwen/Qwen2.5-7B-Instruct` 作为默认练习模型: 它是开放模型,适合中文实验,也能走标准 chat template。 如果显存不足,先把 `--max-model-len` 降到 2048/4096, 或暂时换 1.5B 模型把服务链路跑通。

GPU

### 24GB 是舒服起点

7B BF16/FP16 权重约十几 GB,剩余显存要留给 KV Cache、CUDA graph 和运行时 buffer。

MODEL

### 优先选 Instruct

OpenAI Chat API 入口会依赖 tokenizer 的 chat template。Instruct 模型更适合对话式验证。

FALLBACK

### 显存不足先降上下文

先降低 `--max-model-len` 和并发,不要一开始就把问题归因到 vLLM。

### 环境检查

```
nvidia-smi
python --version
pip --version

# 可选:新建虚拟环境
python -m venv .venv-vllm
source .venv-vllm/bin/activate

pip install -U pip
pip install -U vllm openai

# 如果模型需要授权,先登录 Hugging Face
huggingface-cli login
```

| 场景 | 建议模型 | 启动侧重点 | 目的 |
| --- | --- | --- | --- |
| 标准 7B 实战 | Qwen/Qwen2.5-7B-Instruct | 限制 `--max-model-len`,记录 KV cache blocks。 | 贴近 RoadMap 要求,能观察真实 7B 显存压力。 |
| 显存紧张 | Qwen/Qwen2.5-1.5B-Instruct | 先验证 API、SDK、streaming、压测脚本。 | 把服务链路跑通,再换回 7B。 |
| 多卡机器 | Qwen/Qwen2.5-7B-Instruct | 尝试 `--tensor-parallel-size 2`。 | 学习 vLLM 多 GPU 单机模型切分。 |

## 启动 OpenAI 兼容 API

40 MIN

vLLM 的在线服务入口是 `vllm serve`。 它会拉起兼容 OpenAI 协议的 HTTP 服务,默认端口是 `8000`。 生产环境会有反向代理、鉴权、限流和多实例;今天先把单实例跑稳。

### 最小启动命令

```
export MODEL=Qwen/Qwen2.5-7B-Instruct

vllm serve ${MODEL} \
  --host 0.0.0.0 \
  --port 8000 \
  --served-model-name qwen2.5-7b \
  --dtype bfloat16 \
  --max-model-len 4096 \
  --gpu-memory-utilization 0.85 \
  --max-num-seqs 64 \
  --api-key local-dev-key
```

启动成功标志

### 看三类日志

模型权重加载完成;KV cache profiling 完成;Uvicorn/FastAPI 服务开始监听端口。中间若 OOM,先降低 `max-model-len` 或 `gpu-memory-utilization`。

安全提醒

### 公网不要裸奔

`--api-key` 只是一层简单 bearer key。正式服务要放在网关后面,加 TLS、限流、审计和租户隔离。

### 用配置文件启动

```
# config.yaml
model: Qwen/Qwen2.5-7B-Instruct
host: 0.0.0.0
port: 8000
served-model-name: qwen2.5-7b
dtype: bfloat16
max-model-len: 4096
gpu-memory-utilization: 0.85
max-num-seqs: 64
api-key: local-dev-key

# 启动
vllm serve --config config.yaml
```

如果命令行参数和 YAML 同时出现,以命令行为准。调参时建议每组实验都保存完整启动命令和 git/hash/镜像版本。

## API 验证

35 MIN

vLLM 的价值之一是把本地开源模型伪装成一个 OpenAI-compatible endpoint。 上层应用只要把 `base_url` 指向本地服务, 多数 Chat Completions 调用就能复用原来的客户端代码。

### 列出模型

```
curl http://localhost:8000/v1/models \
  -H "Authorization: Bearer local-dev-key"
```

### Chat Completions

```
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local-dev-key" \
  -d '{
    "model": "qwen2.5-7b",
    "messages": [
      {"role": "system", "content": "你是一个简洁的 AI Infra 助教。"},
      {"role": "user", "content": "用三点解释 vLLM 为什么适合 LLM 推理服务。"}
    ],
    "temperature": 0.2,
    "max_tokens": 256
  }'
```

### Streaming

```
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local-dev-key" \
  -d '{
    "model": "qwen2.5-7b",
    "messages": [{"role": "user", "content": "解释 TTFT 和 TPOT 的区别。"}],
    "stream": true,
    "max_tokens": 128
  }'
```

### OpenAI Python SDK

```
from openai import OpenAI
import time

client = OpenAI(
    api_key="local-dev-key",
    base_url="http://localhost:8000/v1",
)

start = time.perf_counter()
stream = client.chat.completions.create(
    model="qwen2.5-7b",
    messages=[
        {"role": "user", "content": "给我一个 vLLM 调参检查清单。"},
    ],
    temperature=0.2,
    max_tokens=256,
    stream=True,
)

first = None
token_count = 0
for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    if delta and first is None:
        first = time.perf_counter()
    token_count += 1 if delta else 0
    print(delta, end="", flush=True)

end = time.perf_counter()
print()
print({"ttft_s": first - start if first else None, "elapsed_s": end - start, "chunks": token_count})
```

## 理解两个核心调参旋钮

45 MIN

RoadMap 点名的两个参数分别控制不同资源: `--gpu-memory-utilization` 决定 vLLM 实例可使用的 GPU 显存预算, 进而影响 KV Cache 可分配空间; `--max-num-seqs` 限制单次调度迭代能处理的序列数量, 影响并发、batching、CUDA graph 捕获规模和延迟。

higher gpu\_memory\_utilization → more KV cache blocks → higher possible concurrency

值太低会浪费显存,值太高可能给 CUDA graph、临时 buffer、其他进程留不出余量。当前 vLLM 稳定文档默认值为 0.92。

higher max\_num\_seqs → larger active decode batch → higher throughput, possible higher latency

并发上限不是越大越好。超出实际请求分布后,可能增加排队、内存压力和 CUDA graph 预热成本。

| 参数 | 控制对象 | 调大可能收益 | 调大可能风险 |
| --- | --- | --- | --- |
| --gpu-memory-utilization | 当前 vLLM 实例可用的 GPU 显存比例,主要影响 KV Cache 预算。 | 更多 cache blocks,更高并发或更长上下文。 | 启动 OOM、运行时 OOM、与其他进程抢显存。 |
| --max-num-seqs | 一次调度迭代最多处理多少条序列。 | decode batch 更大,吞吐可能提升。 | TTFT/TPOT 变差,CUDA graph 内存增加,请求尾延迟上升。 |
| --max-model-len | 模型可接受的 prompt + output 最大长度。 | 支持更长上下文。 | KV Cache 预算压力变大,可服务并发减少。 |
| --max-num-batched-tokens | 一次调度迭代可处理的 token 总数。 | 更好地控制 prefill/decode 混合负载。 | 设置不当会让长 prompt 挤压短请求。 |

### 实验矩阵

```
# 每组只改一个变量,记录启动日志、显存、吞吐、TTFT/TPOT

gpu_memory_utilization: [0.80, 0.85, 0.90, 0.92]
max_num_seqs: [16, 32, 64, 128]
max_model_len: [2048, 4096, 8192]

report:
  model: qwen2.5-7b
  gpu: "A10 24GB / L40S 48GB / A100 80GB ..."
  vllm_version: "..."
  prompt_len: 512
  output_len: 128
  concurrency: [1, 4, 16, 32]
  metrics:
    - p50_ttft_ms
    - p95_ttft_ms
    - p50_tpot_ms
    - output_tokens_per_s
    - gpu_memory_used_gb
    - oom_or_preemption
```

## 压测与观测

35 MIN

上线前至少要压三种负载:短 prompt 短输出、长 prompt 短输出、短 prompt 长输出。 这三类分别压到不同阶段:调度开销、prefill、decode 和 KV Cache。

### 轻量压测脚本

```
import asyncio
import time
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key="local-dev-key", base_url="http://localhost:8000/v1")

async def one_request(i, prompt):
    t0 = time.perf_counter()
    resp = await client.chat.completions.create(
        model="qwen2.5-7b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        max_tokens=128,
    )
    dt = time.perf_counter() - t0
    text = resp.choices[0].message.content
    return {"id": i, "latency_s": dt, "chars": len(text)}

async def main(concurrency=16):
    prompt = "用 5 条 bullet 总结 vLLM 调参方法。"
    tasks = [one_request(i, prompt) for i in range(concurrency)]
    results = await asyncio.gather(*tasks)
    lat = sorted(r["latency_s"] for r in results)
    print({
        "concurrency": concurrency,
        "p50_s": lat[len(lat)//2],
        "p95_s": lat[int(len(lat)*0.95) - 1],
        "max_s": lat[-1],
    })

asyncio.run(main(concurrency=32))
```

日志

### 看 vLLM stats

观察 running、waiting、prompt throughput、generation throughput、KV cache usage 和是否出现 preemption。

显存

### 看 nvidia-smi

记录启动后静态显存和压测峰值显存。调参时保留 1-2GB 安全余量更稳。

接口

### 看 HTTP 错误

区分 401 鉴权、404 模型名不匹配、400 请求参数错误、500/503 服务端压力或 OOM。

可选

### 使用 vLLM 自带 benchmark

如果当前安装版本包含 `vllm bench serve`, 可以用它替代手写脚本做更规范的 serving benchmark。重点仍是同一套负载下比较参数变化,而不是把不同 prompt/output 分布的结果混在一起。

## 排错速查

20 MIN

| 现象 | 可能原因 | 检查 | 处理 |
| --- | --- | --- | --- |
| 启动 OOM | 权重 + KV cache + CUDA graph 超出显存。 | 看启动日志和 `nvidia-smi`。 | 降低 `max-model-len`、`gpu-memory-utilization`、`max-num-seqs`,或换量化模型。 |
| 请求 401 | 设置了 `--api-key`,请求没有带 Bearer token。 | 检查 curl/header/OpenAI SDK api\_key。 | 补上 `Authorization: Bearer ...`。 |
| 请求 404 / model not found | 请求里的 `model` 与 `--served-model-name` 不一致。 | 访问 `/v1/models`。 | 统一服务端 served name 和客户端 model 字段。 |
| TTFT 很高 | 排队、长 prompt prefill、冷启动、batch 太大。 | 看 waiting requests、prompt throughput、p95 prompt length。 | 降低并发上限,启用 prefix cache,拆分长 prompt,调 chunked prefill。 |
| TPOT 很高 | decode batch 太大、KV 读取压力、显存带宽受限。 | 看 generation throughput 与 GPU 利用率。 | 调小 `max-num-seqs`,减少输出长度,评估 KV cache dtype/量化。 |

## 常见疑问

FAQ

### Q1 · 为什么我设置了很高的 gpu-memory-utilization 还是并发不高?

A

显存只是上限之一。并发还受 `max-num-seqs`、prompt/output 长度、KV Cache block 可用数量、调度策略和模型计算吞吐影响。长上下文请求尤其容易把 cache 占满。

### Q2 · max-num-seqs 是不是应该直接设到很大?

A

不是。它提高的是调度迭代中的序列上限,可能改善吞吐,也可能拉高延迟、增加 CUDA graph 相关内存和调度开销。在线服务要以 p95/p99 延迟 SLO 为约束逐步上调。

### Q3 · served-model-name 有什么用?

A

它决定 OpenAI API 中 `model` 字段可使用的名字,也会影响 metrics 中的 model\_name 标签。给服务一个稳定短名,可以避免客户端暴露 Hugging Face 路径。

### Q4 · 为什么要固定 prompt/output 分布再调参?

A

prefill 和 decode 压力完全不同。长 prompt 会拉高 TTFT,长输出会放大 decode TPOT。负载分布变了,参数收益也会变,所以每次实验必须记录 prompt\_len、output\_len 和 concurrency。

## 复盘问题

6 QUESTIONS

1. 写出你今天的 `vllm serve` 启动命令,解释每个关键参数的作用。
2. `--gpu-memory-utilization` 调大后,KV Cache、并发和 OOM 风险分别如何变化?
3. `--max-num-seqs` 和 batch size 是什么关系?为什么它会影响 TPOT?
4. 如何验证 OpenAI 兼容 API 的模型名、鉴权和 streaming 都正常?
5. 设计一个调参实验矩阵:你会固定哪些变量,记录哪些指标?
6. 如果 p95 TTFT 变差但 tokens/s 变高,你会如何判断这个参数配置能不能上线?

## 今日检查清单

10 ITEMS

- 能安装并确认当前 `vllm`、CUDA、GPU 显存环境。
- 能用 `vllm serve` 启动一个 7B Instruct 模型。
- 能访问 `/v1/models` 验证服务存活和模型名。
- 能用 curl 调通 `/v1/chat/completions`。
- 能用 OpenAI Python SDK 指向本地 `base_url`。
- 能解释 `--served-model-name`、`--api-key`、`--max-model-len` 的作用。
- 能解释 `--gpu-memory-utilization` 如何影响 KV Cache 预算。
- 能解释 `--max-num-seqs` 如何影响吞吐和尾延迟。
- 完成至少 3 组调参实验,记录 TTFT、TPOT、tokens/s、显存和错误。
- 能写出一个服务排错 runbook:启动 OOM、401、404、TTFT 高、TPOT 高。

## 推荐阅读

5 ITEMS

vLLM

### [Quickstart](https://docs.vllm.ai/en/stable/getting_started/quickstart/)

官方快速开始。重点看 online serving、默认端口、OpenAI 兼容调用和 chat/completions 示例。

OpenAI API

### [vllm serve CLI](https://docs.vllm.ai/en/stable/cli/serve/)

查看 `--host`、`--port`、`--api-key`、`--served-model-name` 等服务参数。

Tuning

### [Engine Arguments](https://docs.vllm.ai/en/stable/configuration/engine_args/)

重点看 CacheConfig 和 SchedulerConfig,尤其是 `gpu-memory-utilization`、`max-num-seqs`、`max-model-len`。

Benchmark

### [vLLM Docs](https://docs.vllm.ai/en/stable/)

继续阅读 Benchmarking、Metrics、Production Metrics。Day33 会把视角从单实例调参推进到 continuous batching 调度器。

NEXT

### Continuous Batching

Day33 会比较静态 batching 与 in-flight batching,并把 vLLM、TGI、SGLang 的调度思路放到一起看。

## Day 33 预告

NEXT

COMING NEXT

### Continuous Batching:让请求在运行中进出 batch

今天我们把 vLLM 单实例跑起来,并学会调最基础的并发和显存参数。 明天会拆开调度器:为什么静态 batch 浪费 GPU,continuous batching 如何把新请求插入正在运行的 decode loop, 以及 vLLM、TGI、SGLang 在调度策略上的差异。

推理服务调参的第一原则:同一组负载、同一套指标、一次只改一个变量。

DAY 32 · vLLM HANDS-ON · AI INFRA ROADMAP
