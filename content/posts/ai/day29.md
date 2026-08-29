---
title: "Day 29 · LLM 推理基础"
date: '2026-06-20'
draft: false
description: "进入 LLM 推理 Infra:理解 prefill 与 decode 的阶段差异、KV Cache 为什么是显存大头、吞吐/延迟指标如何拆解,并写出一个最小 generation loop。"
toc: true
tags:
  - AI
  - LLM
  - Inference
  - KV Cache
  - Serving
  - Transformer
---

DAY 29 · AI INFRA ROADMAP · 60 DAYS

# 进入 LLM _推理系统_

Day 29 是阶段 3 的入口:从“把模型训出来”切换到“让模型稳定、低延迟、高吞吐地服务用户”。 今天只抓两个最关键的基础概念: **prefill vs decode** 和 **KV Cache** 。 只要理解这两件事,后面的 PagedAttention、continuous batching、SGLang、量化部署和推理调度都会变得清楚很多。

**DURATION** 2.5-3 h **THEORY** 1 h **HANDS-ON** 1.5 h **METRICS** TTFT · TPOT · tokens/s **STACK** PyTorch · Transformers · vLLM Concepts

## 思维导图

OVERVIEW

> **图：Day 29 LLM 推理基础思维导图**
>
> - DAY 29 · LLM Inference Basics
> - PREFILL · DECODE · KV CACHE · LATENCY
> - 01 · FLOW
> - 请求生命周期
> - 02 · PREFILL
> - 并行吃 prompt
> - 03 · DECODE
> - 逐 token 生成
> - 04 · CACHE
> - KV Cache
> - tokenize / detokenize
> - scheduler 入队
> - prefill 首 token
> - streaming 返回
> - 输入长度 S 较大
> - 矩阵乘更饱满
> - 建立 KV Cache
> - 决定 TTFT
> - 每步 1 个新 token
> - 读全部历史 KV
> - memory bandwidth 敏感
> - 决定 TPOT
> - layers × heads × len
> - K/V 各一份
> - 随 batch 和上下文增长
> - 显存调度核心对象
> - DELIVERABLES
> - 推理生命周期图
> - prefill/decode 对比表
> - KV Cache 显存估算
> - 最小 decode loop

FIG · Day 29 全景:先把一次请求拆成 prefill、decode 和 KV Cache 三个核心对象

## 一次 LLM 请求怎么跑

25 MIN

训练时我们关心一个 batch 的 forward/backward/optimizer step。 推理时我们关心的是一条用户请求从进来到返回 token 的全过程: 它什么时候排队、什么时候拿到 GPU、什么时候返回第一个 token、后续 token 以多快速度流出。

01

### Tokenize & enqueue

HTTP 请求进入服务,文本被 tokenizer 切成 token id,调度器根据长度、优先级和显存预算决定何时进 batch。

02

### Prefill

模型一次性处理 prompt 的全部 token,计算首个 next-token logits,同时为每层 attention 写入历史 K/V。

03

### Decode loop

每一轮只输入上一个新 token,读取已有 KV Cache,采样出下一个 token,再把新的 K/V 追加进 cache。

04

### Stream & finish

服务把 token 增量返回给客户端,直到遇到 stop token、长度上限、用户取消或调度器超时。

推理系统的关键变化:batch 不再是一次性固定大小。请求会不断进入和离开,每条请求的 prompt 长度与输出长度也不同。

## Prefill vs Decode

45 MIN

LLM 推理不是一个均匀过程。prefill 阶段像“读完整段题目”, decode 阶段像“一个字一个字作答”。两者的计算形态、瓶颈和优化方向完全不同。

> **图：Prefill 与 Decode 阶段对比**
>
> - Prefill
> - PROCESS FULL PROMPT
> - prompt tokens 并行进入 Transformer
> - build KV cache + first logits
> - Decode
> - GENERATE ONE TOKEN PER STEP
> - existing KV cache
> - t
> - 只输入上一个新 token,但要读全部历史 K/V
> - sample next token + append KV
> - prefill 更像大矩阵乘,decode 更像反复读取 cache 的小步循环

FIG · prefill 主要决定首 token 延迟,decode 主要决定后续 token 间隔

| 维度 | Prefill | Decode | 工程含义 |
| --- | --- | --- | --- |
| 输入形态 | 一次处理 prompt 的全部 token,序列长度可能很长。 | 每轮只处理一个新 token,循环多次直到结束。 | prefill batch 看 prompt 长度,decode batch 看活跃请求数。 |
| Attention | 新 token 之间也要互相计算 attention,近似有 `S²` 项。 | 新 token query 只对历史 K/V 做 attention,每步随上下文长度线性增长。 | prefill 适合大 GEMM;decode 常被 KV 读取和显存带宽限制。 |
| 性能指标 | TTFT: time to first token。 | TPOT: time per output token。 | 用户体感通常先看 TTFT,长输出体验还要看 TPOT。 |
| 优化方向 | prompt batching、prefix cache、chunked prefill、FlashAttention。 | continuous batching、PagedAttention、KV quantization、speculative decoding。 | 不要用同一套指标评估两个阶段。 |

## KV Cache 为什么是显存大头

45 MIN

自回归生成时,每生成一个 token 都要看历史上下文。 如果每轮都重新计算所有历史 token 的 K/V,decode 会非常慢。 KV Cache 的做法是把每一层 attention 的 key/value 保存下来,下一轮直接复用。 它换来速度,代价是显存会随请求数、上下文长度、层数线性增长。

KV bytes ≈ batch · seq\_len · layers · 2 · kv\_heads · head\_dim · bytes\_per\_elem

`2` 表示 K 和 V 各一份。普通 MHA 中 `kv_heads = num_heads`;GQA/MQA 会减少 KV head 数。

decode working set ≈ model weights + active KV cache + runtime buffers

服务端能并发多少请求,常常不是由权重显存决定,而是由剩余空间能装多少活跃 KV Cache 决定。

随长度增长

### 上下文越长越贵

prompt token 和已生成 token 都要占 KV。长文档问答、多轮对话、代码生成都会迅速推高 cache 占用。

随并发增长

### 每条请求都有状态

训练 batch 的 activation 可以在 backward 后释放;推理请求只要还在生成,对应的 KV Cache 就要留在显存里。

随架构变化

### GQA/MQA 能省 cache

Grouped-query attention 减少 K/V head 数,不改变 query head 数,因此常用于降低长上下文 decode 的 KV 压力。

### 一个粗略估算

```
def kv_cache_gib(batch, seq_len, layers, kv_heads, head_dim, bytes_per_elem=2):
    bytes_total = batch * seq_len * layers * 2 * kv_heads * head_dim * bytes_per_elem
    return bytes_total / (1024 ** 3)

# 例: 32 层,32 个 KV heads,head_dim=128,bf16/fp16
print(kv_cache_gib(batch=16, seq_len=4096, layers=32, kv_heads=32, head_dim=128))
# 约 32 GiB,还没有计算模型权重和运行时 buffer
```

Batch 8 · Seq 2048约 8 GiB

Batch 16 · Seq 4096约 32 GiB

Batch 32 · Seq 4096约 64 GiB

KV Cache 的显存是服务调度的核心资源。Day31 的 PagedAttention 本质上就是在解决 KV Cache 的分配、复用和碎片化问题。

## 动手:最小 generation loop

45 MIN

今天的代码目标不是搭服务,而是看清楚 cache 在 generation loop 中如何流动: 第一次 forward 处理完整 prompt,后续 forward 只喂最后一个 token,并把 `past_key_values` 传回模型。

```
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "Qwen/Qwen2.5-0.5B-Instruct"
device = "cuda"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map=device,
).eval()

prompt = "用三句话解释 LLM 推理中的 KV Cache。"
input_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(device)

generated = input_ids
past = None
max_new_tokens = 64
first_token_time = None
start = time.perf_counter()

with torch.inference_mode():
    for step in range(max_new_tokens):
        # 第 0 步:喂完整 prompt。之后:只喂上一个新 token。
        cur_input = generated if past is None else generated[:, -1:]

        out = model(
            input_ids=cur_input,
            past_key_values=past,
            use_cache=True,
        )
        past = out.past_key_values

        next_token = out.logits[:, -1, :].argmax(dim=-1, keepdim=True)
        generated = torch.cat([generated, next_token], dim=-1)

        if step == 0:
            first_token_time = time.perf_counter() - start

        if next_token.item() == tokenizer.eos_token_id:
            break

elapsed = time.perf_counter() - start
new_tokens = generated.shape[-1] - input_ids.shape[-1]

print({
    "prompt_tokens": input_ids.shape[-1],
    "new_tokens": new_tokens,
    "ttft_s": first_token_time,
    "tpot_s": (elapsed - first_token_time) / max(new_tokens - 1, 1),
    "tokens_per_s": new_tokens / elapsed,
})
print(tokenizer.decode(generated[0], skip_special_tokens=True))
```

### 对比 use\_cache

分别设置 `use_cache=True/False`,观察长输出时 decode 速度差异。

### 改变 prompt 长度

把 prompt 扩到 1K/4K token,观察 TTFT 如何上升。

### 改变输出长度

固定 prompt,改变 `max_new_tokens`,观察 TPOT 和 tokens/s。

### 打印 cache 形状

查看 `past_key_values` 每层 K/V tensor shape,把它代入显存公式。

## 推理指标怎么拆

30 MIN

训练里常看 step time、MFU、loss。推理服务里更常看用户体验和系统吞吐: 首 token 等多久、后续 token 多快、单卡每秒能吐多少 token、请求排队多久、显存还剩多少 cache 空间。

| 指标 | 含义 | 主要受什么影响 | 优化方向 |
| --- | --- | --- | --- |
| TTFT | Time To First Token,从请求进入到第一个 token 返回。 | 排队时间、prompt 长度、prefill batch、模型大小。 | prefix cache、chunked prefill、合理调度长 prompt。 |
| TPOT | Time Per Output Token,后续每个 token 的平均间隔。 | decode batch、KV Cache 读取、采样策略、显存带宽。 | continuous batching、PagedAttention、KV quant、speculative decoding。 |
| Throughput | 单位时间输出 token 数或完成请求数。 | batching 策略、并发数、请求长度分布、GPU 利用率。 | 提高 batch 利用率,但要守住延迟 SLO。 |
| Cache hit | prefix/KV 复用命中率。 | 系统 prompt、RAG 模板、会话复用、请求排序。 | prefix cache、RadixAttention、共享 prompt 调度。 |

权衡

### 吞吐和延迟通常互相拉扯

更大的 batch 往往能提高 tokens/s,但会让部分请求排队更久。 面向在线产品时不能只追求吞吐峰值,还要看 p50/p95/p99 latency 和用户取消率。

## 常见疑问

FAQ

### Q1 · 为什么不能每次 decode 都重新计算整个 prompt?

A

可以,但会非常浪费。第 100 个输出 token 时,如果重新计算全部历史 token,前面 99 步的大部分 K/V 都被重复算了。KV Cache 保存历史 K/V,让每一步只处理新 token,用显存换时间。

### Q2 · prefill 和 decode 哪个更贵?

A

看请求形态。长 prompt、短输出时,prefill 很显眼;短 prompt、长输出时,decode 循环更显眼。在线服务通常两者都要优化,因为用户先感受到 TTFT,长回答又会持续感受到 TPOT。

### Q3 · KV Cache 和模型权重哪个更占显存?

A

模型权重是固定底座,KV Cache 是随并发和上下文动态增长的部分。小并发短上下文时权重占主导;高并发长上下文时,KV Cache 可能成为真正限制吞吐的显存大头。

### Q4 · 为什么 GQA/MQA 能降低推理显存?

A

KV Cache 保存的是 key/value head,不是 query head。GQA/MQA 让多个 query heads 共享较少的 K/V heads,所以 cache 公式中的 `kv_heads` 变小,显存和读取带宽都下降。

### Q5 · 为什么 Day29 不直接上 vLLM?

A

vLLM 是后面几天的重点。今天先把 prefill、decode、KV Cache 和基础指标学清楚,再看 PagedAttention 和 continuous batching 时就能知道它们到底在优化哪一段。

## 复盘问题

6 QUESTIONS

1. 用自己的话画出一次 LLM 请求从 HTTP 进入到 streaming 返回的生命周期。
2. prefill 和 decode 在输入形态、attention 计算、性能瓶颈上有什么不同?
3. 写出 KV Cache 显存估算公式,解释每个变量的含义。
4. 为什么 KV Cache 会随 batch、seq\_len 和 layers 线性增长?
5. TTFT、TPOT、throughput 分别衡量什么?它们之间有哪些常见权衡?
6. 如果一个服务首 token 很慢但后续 token 很快,你会优先检查哪些环节?

## 今日检查清单

10 ITEMS

- 能解释 LLM 推理请求的 tokenize、enqueue、prefill、decode、streaming 流程。
- 能说清 prefill 为什么通常更 compute-heavy,decode 为什么更 memory/cache-heavy。
- 能解释 KV Cache 保存的是每层 attention 的 K/V,而不是完整 hidden states。
- 能写出 KV Cache 显存估算公式,并用一个模型配置做粗略计算。
- 能区分 MHA、GQA、MQA 对 KV Cache 大小的影响。
- 能写出一个使用 `past_key_values` 的最小 generation loop。
- 能记录 TTFT、TPOT、tokens/s 三个基础推理指标。
- 知道高吞吐 batch 可能增加排队延迟,不能只看 tokens/s。
- 能解释为什么 PagedAttention 要管理 KV Cache 的块分配与碎片。
- 为 Day30 的 greedy、top-k、top-p、temperature 解码算法预留实验脚本。

## 推荐阅读

5 ITEMS

Transformers

### [KV cache strategies](https://huggingface.co/docs/transformers/en/kv_cache)

Hugging Face Transformers 关于 KV Cache 的文档。重点看 cache 的基本概念、动态/静态 cache 和生成时的使用方式。

Generation

### [LLM inference tutorial](https://huggingface.co/docs/transformers/en/llm_tutorial)

Transformers 的 LLM 推理教程。结合今天的 generation loop,对照理解 batching、prompt 长度和生成配置。

vLLM

### [vLLM Documentation](https://docs.vllm.ai/)

先粗读概念即可。Day31/Day32 会深入 PagedAttention、block table 和 OpenAI 兼容 API 部署。

Paper

### [PagedAttention](https://arxiv.org/abs/2309.06180)

先读摘要和引言,只抓住一个问题:传统 KV Cache 管理为什么会浪费显存,分页式管理如何缓解。

NEXT

### 解码算法

Day30 会进入 token 选择策略:greedy、beam、top-k、top-p、temperature,以及 speculative decoding 的直觉。

## Day 30 预告

NEXT

COMING NEXT

### 解码算法:从 greedy 到 speculative decoding

今天我们把推理过程拆成 prefill/decode 和 KV Cache。 明天会看“每一步 logits 出来后怎么选下一个 token”: greedy、beam search、top-k、top-p、temperature 会改变输出质量和延迟, speculative decoding 则试图用小模型提前猜 token 来加速大模型 decode。

推理系统的第一课:不是模型会不会生成,而是每个 token 从哪里来、等了多久、占了多少 cache。

DAY 29 · LLM INFERENCE BASICS · AI INFRA ROADMAP
