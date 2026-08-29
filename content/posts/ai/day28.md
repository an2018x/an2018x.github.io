---
title: "Day 28 · 周复盘 + 小项目"
date: '2026-06-20'
draft: false
description: "阶段 2 收官:复盘分布式训练 Infra 的 NCCL、DDP、ZeRO、TP、PP、SP/CP、DeepSpeed、checkpoint、data pipeline、算子加速与 profiling;在 2 卡或云上 8 卡训练一个约 125M GPT,记录 MFU,并完成 ZeRO-3 vs TP+PP 的硬件取舍笔记。"
toc: true
tags:
  - AI
  - Distributed
  - Training
  - Megatron-LM
  - DeepSpeed
  - MFU
---

DAY 28 · AI INFRA ROADMAP · DISTRIBUTED TRAINING

# 把阶段 2 _跑成证据_

今天是分布式训练 Infra 阶段收官。 前面两周你已经学过 NCCL、DDP、ZeRO、Tensor Parallel、Pipeline Parallel、Sequence/Context Parallel、 DeepSpeed、checkpoint、data pipeline、算子加速和 profiling。 Day28 不再堆新概念,而是把这些知识压成一个可复现实验: 在 2 卡,或云上 8 卡,训练一个约 **125M GPT** ,记录 MFU、step time、显存、通信和数据等待。 最后写一篇工程判断笔记: _ZeRO-3 vs TP+PP 在我的硬件上的取舍_。

**DURATION** 3.5 h **REVIEW** 1 h **PROJECT** 2 h **WRITEUP** 0.5 h **STACK** GPT-125M · MFU · ZeRO-3 · TP · PP

## 思维导图

OVERVIEW

> **图：Day 28 周复盘与小项目思维导图**
>
> - DAY 28 · 周复盘 + 小项目
> - REVIEW · GPT-125M · MFU · ZERO-3 VS TP+PP
> - 01 · REVIEW
> - 阶段复盘
> - 02 · TRAIN
> - 125M GPT
> - 03 · MEASURE
> - MFU 与瓶颈
> - 04 · WRITE
> - 取舍笔记
> - NCCL / DDP
> - ZeRO / TP / PP
> - data / kernels
> - profiling
> - 12L / 768H / 12 heads
> - 2 GPU baseline
> - 8 GPU compare
> - stable loss
> - tokens/sec
> - MFU = achieved / peak
> - compute / comm / bubble
> - nsys evidence
> - ZeRO-3 capacity
> - TP+PP throughput
> - hardware constraints
> - final recommendation
> - DELIVERABLES
> - 阶段知识地图
> - 125M GPT 训练记录
> - MFU 计算表
> - 取舍报告

FIG · Day 28 不是新增知识点,而是把阶段 2 的系统能力落到一次可复现训练和一篇工程决策笔记

## 阶段 2 复盘地图

45 MIN

这两周可以压成一个问题: _当一个模型训练不动、放不下、跑不快、跑不稳时,你从哪一层动手?_ 下面这张表就是阶段 2 的排查入口。

| 主题 | 解决的问题 | 核心证据 | 常见动作 |
| --- | --- | --- | --- |
| NCCL | GPU 间通信是否通、是否快 | `NCCL_DEBUG=INFO`, Ring/Tree, channel, algo/proto | 检查网卡、拓扑、rank 映射、collective mismatch |
| DDP | 数据并行梯度同步是否正确并能 overlap | bucket 时间线、all-reduce 与 backward 重叠 | 调 bucket、`no_sync`、gradient accumulation |
| ZeRO/FSDP | 模型状态太大,单卡放不下 | 参数/梯度/optimizer state 显存占比 | ZeRO-2/3、CPU/NVMe offload、checkpoint 策略 |
| TP/PP/SP/CP | 单层太大、层数太深、序列太长 | GEMM 利用率、pipeline bubble、序列维通信 | 设置 TP/PP size,计算 bubble,按 heads/sequence 切分 |
| Data pipeline | GPU 等数据 | `data_time`, CPU util, iostat, `/dev/shm` | WebDataset/Streaming, worker/prefetch/pin\_memory 调参 |
| Kernel/Profiling | 算子慢、通信空洞、MFU 低 | nsys timeline, TFLOPS, MFU/HFU | FlashAttention, fused kernels, overlap, batch/seq 调整 |

复盘标准:每个主题都能说出一个症状、一个证据、一个调参动作和一个副作用。

## 小项目:训练一个约 125M GPT

2 H

GPT-2 small 量级的模型是很好的阶段项目: `num_layers=12`, `hidden_size=768`, `num_attention_heads=12`, `seq_length=1024`, 参数量约 124M 到 125M,足够暴露训练系统问题,又不会让调试成本过高。 数据可以先用小规模文本数据集或 synthetic token dataset 跑通系统, 再换真实 WebDataset/Streaming pipeline。

2 GPU 路线

### DDP 或 ZeRO baseline

目标是得到最干净的 baseline:不急着上 TP/PP,先看 loss 是否下降、tokens/sec、peak memory、data\_time、NCCL all-reduce。2 卡更适合验证训练脚本和 MFU 计算链路。

8 GPU 路线

### 对比 ZeRO-3 与 TP+PP

8 卡可以做真正取舍:ZeRO-3 以容量和易用为主,TP+PP 以层内/层间并行吞吐为主。建议固定 global batch、seq\_len、数据和训练步数,只换并行策略。

数据路线

### 先 synthetic,后真实数据

第一轮用 synthetic tokens 排除 data pipeline;第二轮换真实文本 pipeline 观察 data\_time。如果两轮 MFU 差距很大,瓶颈很可能在数据侧。

停止条件

### 跑 200 到 1000 step 即可

今天不是训练出好模型,而是拿到系统指标。只要 loss 正常下降、step time 稳定、MFU 可计算、nsys 能抓到一段代表性 timeline,项目就合格。

### 模型配置

```
# GPT-125M training shape
num_layers = 12
hidden_size = 768
num_attention_heads = 12
ffn_hidden_size = 3072
seq_length = 1024
vocab_size = 50257

# tokens_per_step = global_batch_size * seq_length
global_batch_size = 128
tokens_per_step = 128 * 1024
```

### Megatron-LM 风格启动参考

```
# 2 GPU baseline: TP=1, PP=1, DP=2
torchrun --nproc_per_node=2 pretrain_gpt.py \
  --num-layers 12 \
  --hidden-size 768 \
  --num-attention-heads 12 \
  --seq-length 1024 \
  --max-position-embeddings 1024 \
  --micro-batch-size 4 \
  --global-batch-size 128 \
  --tensor-model-parallel-size 1 \
  --pipeline-model-parallel-size 1 \
  --bf16 \
  --log-interval 10 \
  --save-interval 500

# 8 GPU TP+PP 对照: TP=2, PP=2, DP=2
torchrun --nproc_per_node=8 pretrain_gpt.py \
  --num-layers 12 \
  --hidden-size 768 \
  --num-attention-heads 12 \
  --seq-length 1024 \
  --micro-batch-size 2 \
  --global-batch-size 128 \
  --tensor-model-parallel-size 2 \
  --pipeline-model-parallel-size 2 \
  --bf16 \
  --log-interval 10
```

命令是项目骨架,不是唯一答案。关键是固定变量:模型、seq\_len、global batch、数据、训练步数,只改变并行策略。

## MFU 记录方法

35 MIN

MFU(Model FLOPs Utilization) 的目标是回答: _模型理论需要的 FLOPs,有多少比例真正转化成了硬件峰值算力?_ 今天使用近似公式即可: 每 token 训练 FLOPs 约为 `6 * num_params`, 再用实际 tokens/sec 得到 achieved FLOPs/sec。 如果要更精确,再把 attention 的二次项和 embedding/head 等细节加进去。

> **图：MFU 计算流程**
>
> - MFU CALCULATION FLOW
> - Step Time
> - seconds / step
> - Tokens / sec
> - global\_batch \* seq / time
> - Achieved FLOPs
> - tokens/sec \* 6N
> - MFU
> - / peak FLOPs
> - IMPORTANT
> - peak FLOPs 要用你的 GPU、dtype 和是否启用 Tensor Core 的理论峰值;不同硬件不要直接横向比较 MFU。

FIG · MFU 从 step time 和 tokens/sec 开始,再乘模型训练 FLOPs,最后除以硬件峰值

```
def estimate_mfu(num_params, global_batch, seq_len, step_time_s, peak_flops_per_gpu, num_gpus):
    tokens_per_step = global_batch * seq_len
    tokens_per_second = tokens_per_step / step_time_s
    flops_per_token = 6 * num_params
    achieved = tokens_per_second * flops_per_token
    peak = peak_flops_per_gpu * num_gpus
    return achieved / peak

# 示例:125M 参数,global batch 128,seq 1024,step 0.8s
mfu = estimate_mfu(
    num_params=125_000_000,
    global_batch=128,
    seq_len=1024,
    step_time_s=0.8,
    peak_flops_per_gpu=312e12, # 示例:按自己的 GPU BF16/FP16 峰值替换
    num_gpus=2,
)
print(f"MFU={mfu:.2%}")
```

### 记录表

| 配置 | GPU | step time | tokens/s | peak mem | MFU | 瓶颈证据 |
| --- | --- | --- | --- | --- | --- | --- |
| 2 GPU DDP | 2 | \_\_ s | \_\_ | \_\_ GiB | \_\_% | data / compute / comm? |
| 8 GPU ZeRO-3 | 8 | \_\_ s | \_\_ | \_\_ GiB | \_\_% | gather / reduce-scatter / offload? |
| 8 GPU TP=2 PP=2 DP=2 | 8 | \_\_ s | \_\_ | \_\_ GiB | \_\_% | TP all-reduce / PP bubble? |

## ZeRO-3 vs TP+PP 取舍笔记

WRITEUP

这篇笔记的重点不是宣布谁更强,而是说明: **在我的硬件、我的模型、我的数据、我的 batch 约束下,哪个方案更合适** 。 一篇好的 Infra 笔记要能让别人复现实验,也能看懂你的判断边界。

| 维度 | ZeRO-3 | TP+PP | 我的判断 |
| --- | --- | --- | --- |
| 容量 | 参数、梯度、optimizer state 分片,可叠加 offload | 单层和层深度被拆开,但仍要考虑 activation 和 pipeline stage | 谁先解决 OOM? |
| 吞吐 | 通信较频繁,offload 会拖慢 | TP 通信 + PP bubble,但大模型上可能更高效 | 谁的 tokens/s 与 MFU 更高? |
| 调参复杂度 | bucket、prefetch、persistence、checkpoint 复杂 | TP/PP size、microbatch、bubble、rank mapping 复杂 | 谁更容易稳定上线? |
| 硬件依赖 | 依赖网络和内存,offload 依赖 CPU/NVMe | TP 强依赖节点内高速互联,PP 更能跨节点 | 我的机器瓶颈在哪里? |
| 可恢复性 | ZeRO sharded checkpoint 需要额外处理 | 并行维度多,checkpoint mapping 更复杂 | 恢复成本是否可接受? |

```
# 取舍笔记结构
1. 实验环境:GPU 型号、数量、互联、CPU、内存、存储、软件版本
2. 模型与数据:125M GPT 配置、seq_len、global batch、数据格式
3. 三组配置:DDP baseline、ZeRO-3、TP+PP
4. 指标表:step time、tokens/s、MFU、peak memory、data_time、checkpoint time
5. nsys 证据:compute、comm、bubble、data stall 截图或摘要
6. 结论:在这台机器上我会优先选择什么,什么条件下会改选
```

写结论时要带条件:比如"2 卡优先 ZeRO/DDP,8 卡 NVLink 内 TP=2/PP=2 更好,跨节点先减少 TP 跨机"。

## 最终检查清单

DONE

- 完成阶段 2 知识地图,每个主题都有症状、证据、动作和副作用。
- 跑通约 125M GPT 至少 200 个 step,loss 没有异常发散。
- 记录 step time、tokens/s、peak memory、data\_time、NCCL/comm 时间。
- 用近似公式计算 MFU,并注明 GPU 峰值 FLOPs 和 dtype。
- 至少抓一段 nsys 或 profiler timeline,标注 compute、communication、bubble、data stall。
- 完成一篇「ZeRO-3 vs TP+PP 在我的硬件上的取舍」笔记。

## 常见疑问

5 QUESTIONS

### Q1 · 今天一定要训练到模型收敛吗?

ANS

不用。Day28 是系统实验,不是模型质量实验。只要 loss 方向正常、step time 稳定、MFU 和瓶颈可记录,就达到了目标。

### Q2 · 125M GPT 为什么适合作为小项目?

ANS

它足够小,调试不会太痛;也足够大,能暴露通信、显存、data pipeline、kernel 效率和 checkpoint 问题。它是训练系统的好校准物。

### Q3 · MFU 低一定是模型写得差吗?

ANS

不一定。MFU 低可能来自 data stall、NCCL 通信、pipeline bubble、小 batch 导致 GEMM 太小、activation checkpoint 重算、CPU/NVMe offload 或 kernel 没融合。要靠 timeline 找证据。

### Q4 · ZeRO-3 和 TP+PP 可以一起用吗?

ANS

可以,大模型训练经常组合使用。今天为了写清楚取舍,建议先分别测 ZeRO-3 和 TP+PP,再讨论组合方案。否则变量太多,不容易解释结果。

### Q5 · 如果只有 2 张 GPU,还能完成 Day28 吗?

ANS

可以。2 卡重点做 DDP/ZeRO baseline、MFU 计算和数据/通信瓶颈分析。TP+PP 取舍部分可以用小规模模拟和理论推导补足,云上 8 卡只是更完整。

## 复盘问题

REVIEW

1. 如果 step time 变慢,你如何区分 data stall、communication、pipeline bubble 和 kernel compute?
2. ZeRO-3 和 TP 解决的显存问题分别是什么?
3. 为什么 TP 通常优先放在单机高速互联内?
4. MFU 的分子和分母分别是什么?为什么不同 GPU 不能只看 MFU 横向比较?
5. 125M GPT 的训练实验里,哪些变量必须固定才能公平比较并行策略?
6. 如果 ZeRO-3 MFU 低于 TP+PP,你需要哪些证据才能说明原因?
7. 阶段 3 进入推理 Infra 前,你最想补哪一个训练系统短板?

## 参考资料

READING

MEGATRON

### Megatron-LM

参考 Megatron-LM 的 GPT 训练参数、TP/PP 配置和日志字段,用于 8 卡小项目对照。

DEEPSPEED

### ZeRO-3

复用 Day23 的 ZeRO-3 配置模板,重点记录显存节省、通信开销和 checkpoint 复杂度。

PROFILING

### nsys / MFU

复用 Day27 的 timeline 阅读方式:compute、communication、bubble、data stall 四类证据必须能标出来。

NEXT

### 推理 Infra

阶段 3 将转向 prefill/decode、KV cache、PagedAttention、vLLM 与服务化。训练阶段的 profiling 习惯会继续有用。

一份好的系统实验,不是跑出了最快数字,而是解释清楚了数字为什么这样。

DAY 28 COMPLETE · NEXT: LLM INFERENCE BASICS
