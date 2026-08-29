---
title: "Day 33 · Continuous Batching"
date: '2026-06-20'
draft: false
description: "学习 LLM 推理服务中的 Continuous Batching:理解静态 batching 与 in-flight batching 的差异,prefill/decode 如何混排,以及 TGI、vLLM、SGLang 调度器在吞吐、TTFT、TPOT 与公平性上的取舍。"
toc: true
tags:
  - AI
  - LLM
  - Inference
  - Serving
  - Continuous Batching
  - vLLM
  - TGI
  - SGLang
---

DAY 33 · AI INFRA ROADMAP · 60 DAYS

# 把推理请求装进 _动态车流_

Day 31-32 已经跑通 vLLM 与 PagedAttention。Day 33 进入服务调度: 为什么传统静态 batching 不适合生成式模型,Continuous Batching 如何在每个 decode step 动态加入新请求, 以及 TGI、vLLM、SGLang 这类推理引擎如何围绕吞吐、TTFT、TPOT、公平性和 KV Cache 做取舍。

**DURATION** 2.5 h **THEORY** 60 min **HANDS-ON** 90 min **METRICS** TTFT · TPOT · throughput · queue time **STACK** vLLM · TGI · SGLang · Scheduler

## 思维导图

OVERVIEW

> **图：Day 33 Continuous Batching 思维导图**
>
> - DAY 33 · Continuous Batching
> - STATIC · IN-FLIGHT · SCHEDULER · TTFT · TPOT
> - 01 · MODEL
> - 静态 batching
> - 02 · LOOP
> - in-flight batching
> - 03 · MIX
> - prefill/decode
> - 04 · ENGINE
> - TGI / vLLM / SGLang
> - 收齐一批再跑
> - 等最慢请求结束
> - padding 浪费严重
> - 尾延迟放大
> - 每步重新组 batch
> - 完成即释放 slot
> - 新请求可插入
> - iteration-level scheduling
> - prefill 计算重
> - decode 显存带宽重
> - chunked prefill
> - 抢占与公平性
> - TGI: waiting ratio
> - vLLM: token budget
> - SGLang: policy/cache
> - SLO 驱动调参
> - DELIVERABLES
> - 调度循环图
> - 静态/动态对比表
> - 引擎调度矩阵
> - 压测观察记录

FIG · Continuous batching 的核心:每个 iteration 都重新决定谁进入 GPU,谁等待,谁释放 KV

## 为什么静态 Batching 不够用

25 MIN

传统深度学习服务常把请求攒成固定 batch,一起 forward,一起返回。 对分类、embedding、rerank 这种一次 forward 就结束的任务,这很自然。 但 LLM 生成是多轮 decode:每个请求 prompt 长度不同、输出长度不同、结束时间不同。 如果还用静态 batch,整批请求会被最长输出拖住,短请求已经完成也不能让新请求进来。

Static batchingbatch 形成后固定到结束

req A

PD1D2EOSidleidle

req B

PD1D2D3D4EOS

req C

waitwaitwaitwaitwaitP

Continuous batching完成就释放,等待请求可插入

req A

PD1D2EOSfreefree

req B

PD1D2D3D4EOS

req C

waitwaitwaitPD1D2

P = prefill,D = decode step。Continuous batching 的关键不是“batch 很大”,而是“batch 成员可以在生成过程中变化”。

| 维度 | 静态 batching | Continuous / in-flight batching | 服务影响 |
| --- | --- | --- | --- |
| 组批时机 | 请求到达后等待窗口,收够一批再执行。 | 每个调度 iteration 都重新选活跃序列和等待请求。 | GPU 更少空转,吞吐通常更高。 |
| 请求生命周期 | 一批请求绑定到整段生成结束。 | 某条序列完成后立即释放 slot 与 KV blocks。 | 短请求不必被长输出拖住。 |
| 可变长度 | padding 和等待更明显。 | 按 token budget / sequence budget 动态控制。 | 对聊天场景更友好,但调度器更复杂。 |
| 公平性 | 批内公平,批间可能排队很久。 | 需要策略处理长 prompt、长输出、老请求和新请求。 | 调得不好会牺牲 TTFT 或尾延迟。 |

## 调度循环放在哪里

35 MIN

LLM serving 的执行循环可以简化为:接收请求,分词,为 prompt 做 prefill, 然后一次 decode 一个 token。Continuous batching 把调度器插在每个 iteration 前面: 它看 waiting queue、running set、KV Cache 预算、token budget、SLO 约束,再决定本轮 GPU 做什么。

> **图：Continuous batching scheduler loop**
>
> - HTTP 请求
> - prompt · params
> - 等待队列
> - waiting requests
> - Scheduler
> - seq budget · token budget · KV blocks
> - GPU Forward
> - prefill chunk / decode token
> - Running Set
> - active sequences
> - KV Cache
> - blocks · pages
> - Token Output
> - stream · EOS · stop
> - SCHEDULER QUESTIONS
> - 1. 本轮放多少 prefill token? 2. 已运行请求是否继续 decode? 3. 新请求何时插入? 4. KV 不够时抢占谁?

FIG · 调度器每轮根据队列、运行集合和 KV Cache 状态重建 batch

### 一个最小调度伪代码

```
while server_is_running:
    new_requests = receive_http_requests()
    waiting_queue.extend(tokenize(new_requests))

    # 释放已结束序列的 KV blocks,把 token 流式返回给客户端
    finished = [seq for seq in running if seq.is_finished()]
    free_kv_blocks(finished)
    running.remove(finished)

    token_budget = max_num_batched_tokens
    seq_budget = max_num_seqs - len(running)

    # 选择一部分 waiting 请求做 prefill,也可能只做 chunked prefill
    batch = choose_prefill_requests(waiting_queue, token_budget, seq_budget)

    # 已经 prefill 完的 running 请求每轮通常 decode 1 个 token
    batch += choose_decode_requests(running, token_budget)

    outputs = model_forward(batch)
    update_kv_cache(outputs)
    stream_tokens(outputs)
```

TTFT = queue\_time + prefill\_time + first\_decode\_time

Continuous batching 如果让 waiting queue 等太久,TTFT 会升高;如果频繁插入 prefill,又可能干扰已有 decode。

TPOT ≈ decode\_iteration\_time / active\_decode\_sequences

decode batch 变大通常提升吞吐,但单轮时间也会变长。线上要看 p95/p99 TPOT,不是只看总 tokens/s。

## Prefill 与 Decode 的混排

30 MIN

Continuous batching 真正难的地方在于 prefill 和 decode 的资源画像不同: prefill 是大矩阵计算,一次处理 prompt 中很多 token;decode 每轮只生成一个 token, 但要反复读写 KV Cache,更容易受显存带宽和 cache 管理影响。 调度器必须决定:先让等待请求尽快拿到首 token,还是保护正在输出的请求保持稳定 TPOT。

Prefill Heavy

### 长 prompt 会吃掉 token budget

一个 8K prompt 的 prefill 可能挤占整轮预算,让已经在 decode 的请求等待。chunked prefill 会把长 prompt 切成小块。

Decode Steady

### 稳定输出依赖短 iteration

聊天流式体验主要看 token 是否持续出来。decode iteration 太长,用户会感觉输出一卡一卡。

KV Budget

### 调度不是只算 compute

每个活跃序列都占 KV Cache。新请求能不能进来,不只看 batch size,还看剩余 KV blocks。

| 策略 | 偏向 | 优点 | 风险 |
| --- | --- | --- | --- |
| Prefill-first | 尽快接纳新请求,降低 queue time。 | TTFT 可能更好,等待队列不容易堆积。 | 长 prompt 可能让已有 decode 变慢,TPOT 波动。 |
| Decode-first | 保护已开始输出的请求。 | 流式输出稳定,用户体感更顺。 | 新请求排队更久,TTFT 尾延迟上升。 |
| Chunked prefill | 把长 prompt 切成多个调度片段。 | 更好地混合 prefill 与 decode,降低长 prompt 对短请求的阻塞。 | 调度开销上升,不同引擎参数与默认行为不同。 |
| Preemption | KV 预算不足时暂停或重算部分序列。 | 避免整体 OOM,允许更多请求进入系统。 | 重算会浪费计算,尾延迟可能抖动。 |

判断调度策略好坏时,至少同时看 TTFT、TPOT、E2E latency、tokens/s、queue length 与 KV cache utilization。

## TGI / vLLM / SGLang 调度器对比

45 MIN

RoadMap 要求横向比较三类引擎。不要把它们看成“谁绝对更快”, 而要看各自的抽象:怎样控制批大小,怎样处理等待队列,怎样混排 prefill/decode, 以及有没有围绕 KV Cache、prefix cache、结构化生成做额外优化。

| 引擎 | 调度关键词 | 常见旋钮 | 适合观察什么 |
| --- | --- | --- | --- |
| TGI | continuous batching、waiting/served ratio、batch token limits。 | --max-batch-prefill-tokens
--max-batch-total-tokens
--waiting-served-ratio
--max-waiting-tokens | 观察排队窗口、prefill token 上限和等待请求插入时机如何影响 TTFT。 |
| vLLM | PagedAttention、token budget、sequence budget、chunked prefill、preemption。 | --max-num-seqs
--max-num-batched-tokens
--gpu-memory-utilization
--enable-chunked-prefill | 观察 KV Cache blocks、running/waiting 队列、prompt/generation throughput 与 preemption。 |
| SGLang | runtime scheduler、Radix Cache、prefix-aware workload、chunked prefill。 | --schedule-policy
--max-running-requests
--max-total-tokens
--chunked-prefill-size | 观察共享 prefix、高并发 agent/workflow 请求、cache 命中与调度策略的耦合。 |

TGI

### 参数语义直观

TGI 的 launcher 参数很适合学习 batching 上限与等待策略。重点记录 waiting queue 与 served batch 的关系。

vLLM

### KV 管理与调度深度绑定

vLLM 的调度效果必须结合 PagedAttention 看:KV blocks 是能否接纳新请求的硬约束。

SGLang

### 程序化请求与前缀缓存

SGLang 在复杂 prompt/program、多轮调用、共享 prefix 场景下更值得关注调度与 cache 命中。

注意

### 参数名会随版本变化

这一天的目标不是背参数,而是理解参数背后的资源:序列数量、token 数量、KV Cache、等待队列和 SLO。实际实验前以当前版本官方文档和 `--help` 为准。

## 用 vLLM 做一个小实验

60 MIN

延续 Day32 的 vLLM 服务。今天不追求模型质量,只观察调度: 同一模型、同一 prompt/output 分布下,改变 `max-num-seqs`、 `max-num-batched-tokens` 与 chunked prefill,记录 TTFT、TPOT、吞吐和队列日志。

### 启动三组服务配置

```
# A. 保守:低并发,更容易看清单请求延迟
vllm serve Qwen/Qwen2.5-7B-Instruct \
  --served-model-name qwen2.5-7b \
  --max-model-len 4096 \
  --gpu-memory-utilization 0.85 \
  --max-num-seqs 16 \
  --max-num-batched-tokens 4096

# B. 吞吐:提高活跃序列上限
vllm serve Qwen/Qwen2.5-7B-Instruct \
  --served-model-name qwen2.5-7b \
  --max-model-len 4096 \
  --gpu-memory-utilization 0.90 \
  --max-num-seqs 64 \
  --max-num-batched-tokens 8192

# C. 长 prompt:尝试 chunked prefill,参数名以当前 vLLM 版本为准
vllm serve Qwen/Qwen2.5-7B-Instruct \
  --served-model-name qwen2.5-7b \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.90 \
  --max-num-seqs 64 \
  --max-num-batched-tokens 8192 \
  --enable-chunked-prefill
```

### 压测脚本:混合短/长 prompt

```
import asyncio
import statistics
import time
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key="EMPTY", base_url="http://localhost:8000/v1")

SHORT = "用三句话解释 continuous batching。"
LONG = "请阅读以下模拟日志并总结调度瓶颈。" + (" waiting=12 running=48 kv=82%; " * 220)

async def one(i, prompt, max_tokens):
    t0 = time.perf_counter()
    first = None
    chunks = 0
    stream = await client.chat.completions.create(
        model="qwen2.5-7b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        max_tokens=max_tokens,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            chunks += 1
            if first is None:
                first = time.perf_counter()
    t1 = time.perf_counter()
    return {
        "id": i,
        "ttft_ms": (first - t0) * 1000 if first else None,
        "e2e_ms": (t1 - t0) * 1000,
        "chunks": chunks,
        "tpot_ms": ((t1 - first) * 1000 / max(chunks - 1, 1)) if first else None,
    }

def pct(values, p):
    values = sorted(v for v in values if v is not None)
    return values[int((len(values) - 1) * p)]

async def main(concurrency=32, long_ratio=0.25):
    tasks = []
    for i in range(concurrency):
        is_long = (i / concurrency) < long_ratio
        tasks.append(one(i, LONG if is_long else SHORT, 160))
    res = await asyncio.gather(*tasks)
    print({
        "concurrency": concurrency,
        "p50_ttft_ms": pct([r["ttft_ms"] for r in res], 0.50),
        "p95_ttft_ms": pct([r["ttft_ms"] for r in res], 0.95),
        "p50_tpot_ms": pct([r["tpot_ms"] for r in res], 0.50),
        "p95_e2e_ms": pct([r["e2e_ms"] for r in res], 0.95),
        "avg_chunks": statistics.mean(r["chunks"] for r in res),
    })

asyncio.run(main(concurrency=32, long_ratio=0.25))
```

### 记录模板

```
experiment:
  model: Qwen/Qwen2.5-7B-Instruct
  gpu: "A10 24GB / L40S 48GB / A100 80GB ..."
  engine: vllm
  version: "..."
  workload:
    concurrency: [8, 16, 32, 64]
    long_prompt_ratio: [0.0, 0.25, 0.5]
    max_tokens: 160
  server_args:
    max_num_seqs: 64
    max_num_batched_tokens: 8192
    gpu_memory_utilization: 0.90
    chunked_prefill: true
  metrics:
    p50_ttft_ms:
    p95_ttft_ms:
    p50_tpot_ms:
    p95_e2e_ms:
    output_tokens_per_s:
    kv_cache_usage:
    running_waiting:
    preemption_count:
```

## 常见调度症状

RUNBOOK

| 现象 | 可能原因 | 观察指标 | 处理方向 |
| --- | --- | --- | --- |
| tokens/s 很高,TTFT 也很高 | 调度器为了吞吐攒了太多请求或长 prompt 抢占 prefill 预算。 | queue time、waiting count、p95 prompt length。 | 降低等待窗口或 batch token 上限,启用/调小 chunked prefill。 |
| TTFT 尚可,TPOT 抖动 | prefill 插入过频繁,decode iteration 被长 prompt 打断。 | per-iteration latency、generation throughput。 | 限制单轮 prefill token,给 decode 留稳定预算。 |
| 频繁 preemption | KV Cache 不足,长上下文或高并发超过预算。 | KV cache usage、preemption count、recompute time。 | 降低 max model len / max running seqs,增加显存预算,评估 KV 量化。 |
| 短请求被长请求拖慢 | 缺少长度感知调度或 prefix/cache 预算被长请求占用。 | 按 prompt\_len 分桶的 TTFT/E2E latency。 | 做负载分级、独立实例、短请求优先或 prefix-aware routing。 |
| GPU 利用率低但排队多 | 批 token 上限太低、网络/HTTP 层瓶颈、tokenizer 或客户端压测不足。 | GPU util、CPU util、request rate、batch size。 | 提高 token/seq budget,排除客户端瓶颈,增加 tokenizer worker 或多副本。 |

## 常见疑问

FAQ

### Q1 · Continuous batching 和动态 batch size 是一回事吗?

A

不完全是。动态 batch size 只是 batch 大小可变;Continuous batching 强调生成过程中每个 iteration 都能增删序列。请求不需要等当前整批全部结束,完成的序列释放资源后,新请求可以进入后续 iteration。

### Q2 · 为什么 batch 越大 TTFT 可能越差?

A

更大的 batch 往往意味着请求在队列里等更久,单轮 prefill/decode 也可能更长。吞吐提升和首 token 延迟之间存在经典取舍,线上要用 SLO 限制 batch 上限。

### Q3 · chunked prefill 一定会提升性能吗?

A

不一定。它主要缓解长 prompt 对 decode 的阻塞,但会增加调度次数和一些额外开销。短 prompt 为主的负载里收益可能不明显,长上下文混合负载里更值得测试。

### Q4 · 为什么调度器必须关心 KV Cache?

A

LLM decode 的每个活跃序列都要保留历史 KV。调度器即使有 compute 空闲,如果没有足够 KV blocks 接纳新序列,也不能盲目放入请求,否则会 OOM 或触发昂贵的抢占/重算。

## 今日检查清单

10 ITEMS

- 能解释静态 batching 为什么不适合可变长度生成任务。
- 能画出 Continuous batching 的 iteration-level scheduling 循环。
- 能说明 prefill 与 decode 的资源画像差异。
- 能解释 TTFT、TPOT、E2E latency、tokens/s 分别反映什么。
- 能说明 `max-num-seqs` 与 `max-num-batched-tokens` 的区别。
- 能说明 chunked prefill 解决什么问题,以及可能带来什么开销。
- 能对比 TGI、vLLM、SGLang 在调度参数和优化重点上的差异。
- 能设计短 prompt、长 prompt、混合负载三组压测。
- 能按 prompt 长度分桶分析 TTFT 与 E2E latency。
- 能写出一个调度排错 runbook:排队高、TPOT 抖动、preemption、GPU 低利用率。

## 复盘问题

7 QUESTIONS

1. 用自己的话解释 static batching、dynamic batching、continuous batching 的区别。
2. 为什么生成式服务不能只看平均 latency?TTFT 和 TPOT 各自对应用户体感中的哪一段?
3. prefill-first 与 decode-first 策略分别会牺牲什么?
4. 一个长 prompt 请求进入系统时,它会如何影响短 prompt 请求的 TTFT?
5. 如果 vLLM 日志中 waiting 长期很高,你会优先检查哪些参数?
6. 为什么 prefix cache/RadixAttention 会影响调度策略,而不是单纯的 cache 优化?
7. 给定一个线上聊天服务 SLO,你会怎样设置吞吐优先和延迟优先两套调度配置?

## 推荐阅读

5 ITEMS

Paper

### [Orca: A Distributed Serving System for Transformer-Based Generative Models](https://www.usenix.org/conference/osdi22/presentation/yu)

理解 iteration-level scheduling 和 selective batching 的经典论文,适合把 Continuous Batching 的思想放回系统设计语境。

vLLM

### [vLLM Engine Arguments](https://docs.vllm.ai/en/stable/configuration/engine_args/)

重点看 scheduler/cache 相关参数,如 `max-num-seqs`、`max-num-batched-tokens`、chunked prefill 与 KV 预算。

TGI

### [Text Generation Inference Launcher](https://huggingface.co/docs/text-generation-inference/en/basic_tutorials/launcher)

查看 TGI 的 batching、waiting、prefill token 上限等服务参数,用来对比 vLLM 的调度抽象。

SGLang

### [SGLang Documentation](https://docs.sglang.ai/)

关注 runtime、Radix Cache、调度策略与结构化生成相关能力。Day34 会继续深入 RadixAttention。

Benchmark

### [vLLM Benchmark Examples](https://docs.vllm.ai/en/stable/getting_started/examples/benchmark.html)

用官方 benchmark 思路规范负载分布、并发、prompt/output 长度和指标记录。

Serving 调度的本质,是在 GPU、KV Cache、队列和用户耐心之间做实时资源分配。

DAY 33 · Continuous Batching · AI Infra RoadMap
