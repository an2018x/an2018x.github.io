---
title: "Day 20 · Pipeline Parallel"
date: '2026-06-20'
draft: false
description: "拆开 Pipeline Parallel:理解模型按层切 stage、micro-batch 如何填流水线,对比 GPipe、1F1B 与 Megatron Interleaved 1F1B,掌握 bubble 时间计算与 pipeline 调参方法。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - Pipeline Parallel
  - Megatron
  - Training
---

DAY 20 · AI INFRA ROADMAP · 60 DAYS

# 把模型切成 _流水线_

Day 17 用 DDP 复制模型、同步梯度;Day 18 用 ZeRO 切 optimizer / gradient / parameter; Day 19 用 Tensor Parallel 把单层矩阵乘切到多卡。 今天换一个维度:沿着网络深度把模型切成多个 **pipeline stage** 。 每个 stage 只保存一段层,只和前后 stage 传 activation / activation gradient。 关键问题不再是"怎么 AllReduce",而是_怎么让每个 stage 都别闲着_: GPipe、1F1B、Interleaved 1F1B 的差异,本质上都是在减少 bubble。

**DURATION** 3 h **THEORY** 1.2 h **MATH** 0.6 h **HANDS-ON** 1 h **STACK** Pipeline Parallel · GPipe · 1F1B · Megatron · Bubble

## 思维导图

OVERVIEW

> **图：Day 20 思维导图**
>
> - DAY 20 · Pipeline Parallel
> - STAGES · MICRO-BATCH · GPipe · 1F1B · BUBBLE
> - 01 · PARTITION
> - 按层切 stage
> - 02 · SCHEDULE
> - GPipe / 1F1B
> - 03 · BUBBLE
> - 空泡时间计算
> - 04 · MEGATRON
> - Interleaved 1F1B
> - layers → stages
> - send/recv activation
> - stage balance
> - micro-batch
> - flush all forward
> - all backward
> - warmup / steady / cooldown
> - activation memory
> - p stages
> - m micro-batches
> - (p-1)/(m+p-1)
> - stage imbalance
> - virtual stages
> - smaller chunks
> - less bubble
> - more scheduling complexity
> - DELIVERABLES
> - 三种 schedule 时序图
> - bubble 计算表
> - micro-batch simulator
> - Megatron 参数笔记

FIG · Day 20 全景:按层切 stage,用 micro-batch 填流水线,再用 1F1B / interleaving 降低 bubble

## Pipeline Parallel 的基本模型

25 MIN

Pipeline Parallel,简称 PP,沿着模型深度切分。 如果一个 Transformer 有 80 层,4 个 pipeline stage 可以让每张 GPU 只放 20 层。 stage 之间传的不是参数,而是 micro-batch 的 activation; 反向时再把 activation gradient 反方向传回来。 这让 PP 特别适合跨节点:和 Tensor Parallel 相比,它通信频率低得多。

> **图：Pipeline stage partition**
>
> - PIPELINE PARALLEL PARTITION — layers are split by depth
> - Stage 0
> - Embedding + Layer 0-19
> - GPU 0 / rank 0
> - Stage 1
> - Layer 20-39
> - GPU 1 / rank 1
> - Stage 2
> - Layer 40-59
> - GPU 2 / rank 2
> - Stage 3
> - Layer 60-79 + LM Head
> - GPU 3 / rank 3
> - FORWARD: send activation →
> - BACKWARD: ← send activation gradient
> - 核心约束
> - stage 间只能顺序依赖,所以第一批数据必须一路流到最后一个 stage 后,后面 stage 才有活干。这个等待就是 bubble。

FIG · PP 把层切到不同 stage;前向传 activation,反向传 activation gradient

### 三个基础概念

STAGE

### 一段连续层

stage 是 pipeline 的执行单元。理想情况下每个 stage 的前向+反向时间接近,否则最慢 stage 会决定整条流水线吞吐。Embedding 和 LM head 常造成首尾 stage 不均衡。

MICRO-BATCH

### 把 global batch 切小

如果只把一个大 batch 丢进流水线,大部分 stage 都在等。把 batch 切成 m 个 micro-batch 后,stage 0 处理 micro-batch 1 时,stage 1 可以处理 micro-batch 0,流水线开始填满。

BUBBLE

### 流水线空转时间

启动时后面的 stage 没数据,结束时前面的 stage 没数据。bubble 就是这些空档。PP 的优化目标,就是在显存允许的范围内把 bubble 压到可接受。

## GPipe vs 1F1B vs Interleaved 1F1B

45 MIN

同样是 PP,调度策略会决定显存峰值、bubble、通信复杂度。 GPipe 最好理解:先把所有 micro-batch forward 完,再 backward。 1F1B 更像真实生产默认:填满后每个 stage 交替做一个 forward 和一个 backward。 Megatron 的 Interleaved 1F1B 再把每张卡上的连续层切成多个 virtual stage,缩短 pipeline 单元粒度。

| 策略 | 调度方式 | 优点 | 代价 | 适用 |
| --- | --- | --- | --- | --- |
| GPipe | 所有 micro-batch 先 forward,再统一 backward | 实现简单,依赖清晰,适合教学和早期论文 | activation 要保留到 backward,显存压力大 | 理解 PP 原理、小规模实验 |
| 1F1B | warmup 后每个 stage 一前一后交替执行 | activation 生命周期短,显存更低,生产常用 | 调度复杂,需要精确处理 send/recv 顺序 | Megatron / DeepSpeed pipeline 的基础 |
| Interleaved 1F1B | 每个物理 stage 拆多个 virtual stage,交错执行 | 更细粒度,减少 bubble,缓解 stage 不均衡 | 通信次数增加,调度和内存管理更复杂 | 大模型 + 较深层数 + Megatron 训练 |

### GPipe: all forward, then all backward

> **图：GPipe schedule**
>
> - GPIPE SCHEDULE — p=4, m=4
> - S0
> - S1
> - S2
> - S3
> - F0
> - F1
> - F2
> - F3
> - B0
> - B1
> - B2
> - B3
> - 红色 F: forward 全部先跑完
> - 绿色 B: backward 之后集中发生
> - 缺点:activation 堆积

FIG · GPipe 直观但 activation 峰值高:所有 micro-batch 的前向激活都要等到 backward

### 1F1B: one forward, one backward

WARMUP

### 先填满流水线

最前面的 stage 先连续做 forward,把 micro-batch 一个个送下去。第 k 个 stage 需要等待前面 k 个 micro-batch 到达,所以启动阶段必然有 bubble。

STEADY STATE

### 一前一后交替

流水线填满后,每个 stage 尽量交替做 forward 和 backward。这样 activation 生命周期更短,显存比 GPipe 更友好,也是大模型训练里的常见默认。

COOLDOWN

### 排空剩余 backward

最后没有新的 forward 可做,前面的 stage 只剩 backward。这个尾部也是 bubble 来源之一。micro-batch 越少,首尾空泡占比越高。

MEMORY

### 比 GPipe 省 activation

1F1B 不需要等所有 forward 全跑完才 backward,更早释放 activation。代价是 send/recv 顺序和 micro-batch bookkeeping 更复杂。

理解 schedule 的核心:同一个 stage 同一时刻只能做一件事;优化就是安排它少空转、少存激活、少等通信。

## bubble 时间计算

40 MIN

假设 p 个 pipeline stage,每个 micro-batch 在每个 stage 上的 forward+backward 单位时间相同, 一次 global batch 被切成 m 个 micro-batch。 不考虑通信与 stage 不均衡时,常见的 pipeline bubble fraction 可以近似写成: `(p - 1) / (m + p - 1)`。 这个式子是 Day20 最重要的手算工具。

| p stages | m micro-batches | bubble fraction | 直觉 |
| --- | --- | --- | --- |
| 4 | 4 | 3 / 7 = 42.9% | micro-batch 太少,流水线大半时间在填充/排空 |
| 4 | 16 | 3 / 19 = 15.8% | 常见可接受范围,但 activation 和 batch 约束要看显存 |
| 8 | 16 | 7 / 23 = 30.4% | pipeline stage 增多后,需要更多 micro-batch 才能喂饱 |
| 8 | 64 | 7 / 71 = 9.9% | bubble 降低,但 micro-batch 太小可能影响 kernel efficiency |

### 为什么 micro-batch 不能无限加

算子效率

### micro-batch 太小会让 GEMM 变瘦

m 变大意味着每个 micro-batch 的 batch size 变小。太小会让矩阵乘不够饱满,Tensor Core 利用率下降。bubble 降了,compute efficiency 也可能掉。

激活与调度开销

### 更多 micro-batch = 更多 bookkeeping

每个 micro-batch 都有独立的 activation、通信、调度状态。1F1B 会比 GPipe 省激活,但 micro-batch 极多时 send/recv 和 runtime 调度成本会更明显。

优化器语义

### global batch 不是随便变

global batch = micro\_batch\_size × num\_micro\_batches × data\_parallel\_size。为了改 m 而改变 global batch,会影响学习率、warmup、收敛曲线。最好固定 global batch 后调切分。

经验法则

### 先让 m 远大于 p

如果 m 只比 p 大一点,bubble 会很显眼。生产里通常让 micro-batch 数明显大于 pipeline stage 数,再用 profiler 确认 kernel efficiency 没被打崩。

### 一个小 simulator

```
def bubble_fraction(p, m):
    return (p - 1) / (m + p - 1)

def table(stages=(2, 4, 8), micro_batches=(4, 8, 16, 32, 64)):
    for p in stages:
        print(f"pipeline stages = {p}")
        for m in micro_batches:
            frac = bubble_fraction(p, m)
            print(f" m={m:2d} bubble={frac*100:5.1f}% useful={(1-frac)*100:5.1f}%")
        print()

table()
```

bubble 公式只是一阶估算。真实训练还要乘上 stage imbalance、通信延迟、recompute、data loading 和 optimizer step。

## Interleaved 1F1B — Megatron 的 virtual stage

35 MIN

Interleaved 1F1B 的直觉是:每张物理 GPU 不只负责一段连续的大 stage, 而是负责多个更小的 model chunk,也叫 virtual pipeline stage。 这样 pipeline 深度在调度层面变细,每个 chunk 更早 ready,可以减少 bubble, 也能缓解某个物理 stage 太重的问题。

> **图：Interleaved pipeline virtual stages**
>
> - INTERLEAVED 1F1B — physical stage owns multiple virtual chunks
> - GPU 0
> - virtual stage 0 · layers 0-9
> - virtual stage 4 · layers 40-49
> - GPU 1
> - virtual stage 1 · layers 10-19
> - virtual stage 5 · layers 50-59
> - GPU 2
> - virtual stage 2 · layers 20-29
> - virtual stage 6 · layers 60-69
> - MEGATRON ARGUMENTS
> - --pipeline-model-parallel-size 3
> - --num-layers-per-virtual-pipeline-stage 10
> - 每张物理卡负责多个 chunk,调度时按 virtual stage 交错执行。
> - 收益:减少 bubble;代价:send/recv 次数和调度复杂度增加。

FIG · Interleaving 把物理 stage 拆成多个 virtual stage,让 pipeline 粒度更细

### Megatron 参数形状

```
# 示例:TP=2, PP=4, 每个物理 stage 再拆 virtual chunks
torchrun --nproc_per_node=8 pretrain_gpt.py \
  --tensor-model-parallel-size 2 \
  --pipeline-model-parallel-size 4 \
  --num-layers 48 \
  --num-layers-per-virtual-pipeline-stage 3 \
  --micro-batch-size 2 \
  --global-batch-size 128
```

约束 1

### 层数要能整除

总层数需要能被 pipeline stage 和 virtual stage chunk 合理切分。切不匀会引入 stage imbalance,最慢的 chunk 会拖慢整条流水线。

约束 2

### micro-batch 数要足够

interleaving 增加调度粒度,但如果 micro-batch 数太少,依然喂不饱。先确保 m 明显大于物理 pipeline depth,再考虑 virtual stage。

收益

### 降低 bubble 与不均衡

当每个物理 stage 的连续层太大时,interleaving 能更早交错不同 chunk 的 forward/backward,减少等待。对深层 Transformer 特别有价值。

风险

### 更难 debug

你看到的 rank 不再只对应一段连续层。trace 里会出现更多 send/recv 和 chunk 切换。先把非 interleaved 1F1B 跑稳,再打开 virtual pipeline。

## 动手实践 — 画 schedule + 算 bubble

1 H

今天的交付物是一张 pipeline 实验表: 固定 global batch 和模型层数,改变 pipeline stage 数、micro-batch 数、是否 interleaved, 记录 bubble 估算、显存峰值和 step time。 没有多卡也可以先用纸面公式和 simulator 建立直觉。

```
from dataclasses import dataclass

@dataclass
class PPConfig:
    pp: int
    micro_batches: int
    micro_batch_size: int
    dp: int = 1
    tp: int = 1

    def global_batch(self):
        return self.micro_batches * self.micro_batch_size * self.dp

    def bubble(self):
        return (self.pp - 1) / (self.micro_batches + self.pp - 1)

configs = [
    PPConfig(pp=2, micro_batches=8, micro_batch_size=4),
    PPConfig(pp=4, micro_batches=8, micro_batch_size=4),
    PPConfig(pp=4, micro_batches=32, micro_batch_size=1),
    PPConfig(pp=8, micro_batches=64, micro_batch_size=1),
]

for cfg in configs:
    print(
        f"pp={cfg.pp} m={cfg.micro_batches:2d} "
        f"mbs={cfg.micro_batch_size} global={cfg.global_batch():3d} "
        f"bubble={cfg.bubble()*100:5.1f}%"
    )
```

### 实验记录模板

| 配置 | 要记录 | 观察重点 |
| --- | --- | --- |
| PP=2, m=8 | bubble、step time、max memory | baseline,确认 pipeline 逻辑跑通 |
| PP=4, m=8 | 同上 | stage 变多后 bubble 是否明显变大 |
| PP=4, m=32 | 同上 + kernel efficiency | bubble 降低是否被 micro-batch 太小抵消 |
| PP=4, interleaved | send/recv 数量、trace 复杂度 | virtual stage 是否真的减少通信尾巴和空档 |

真正的 PP 调优要看 trace:空白是 bubble,绿色通信条是 send/recv,红色计算条是否被最慢 stage 拉长。

## 常见疑问

5 QUESTIONS

### Q1 · Pipeline Parallel 和 Tensor Parallel 到底怎么分工?

ANS

Tensor Parallel 切单层矩阵,通信频繁,适合放在节点内 NVLink/NVSwitch 上。Pipeline Parallel 切模型层,通信频率低,传 activation,更适合跨节点扩展。

大模型常用组合是节点内 TP,节点间 PP,外层再套 DP/ZeRO。这样把高频通信留在高速链路,低频通信放到较慢网络上。

### Q2 · 为什么 micro-batch 越多 bubble 越小?

ANS

pipeline 的启动和排空大约各需要 p-1 个阶段的等待,这是固定开销。micro-batch 越多,steady state 的有效工作越多,固定等待被摊薄,所以 bubble fraction 下降。

但 micro-batch 不是越多越好。每个 micro-batch 会变小,可能降低 GEMM 效率,也会增加调度和通信开销。要用 profiler 找平衡点。

### Q3 · 1F1B 为什么比 GPipe 更省显存?

ANS

GPipe 会先跑完所有 micro-batch 的 forward,这些 activation 都要保存到之后 backward 用。1F1B 在流水线填满后更早启动 backward,部分 activation 更早释放,所以峰值更低。

代价是调度更复杂:每个 stage 要在 forward、backward、send、recv 之间严格排序,否则很容易死锁或拿错 micro-batch。

### Q4 · Interleaved 1F1B 什么时候值得开?

ANS

当模型层数足够多、PP stage 较多、普通 1F1B 仍有明显 bubble 或 stage 不均衡时值得尝试。它通过 virtual stage 把 pipeline 粒度切细,能更好填空档。

如果模型很浅、micro-batch 数不够、或者通信链路已经紧张,interleaving 可能只会增加复杂度。先让普通 1F1B 跑稳,再开 interleaved。

### Q5 · PP 会不会影响模型收敛?

ANS

如果是 flush schedule,所有 micro-batch 的梯度累积后再 optimizer step,语义上接近普通大 batch 训练。你需要保证 loss 按 micro-batch 正确缩放、global batch 不变、随机数和 dropout 处理合理。

历史上的 PipeDream 类异步 pipeline 会引入 weight staleness,收敛语义更复杂。今天 Day20 聚焦的是 GPipe / 1F1B 这种同步 flush 训练。

## 复盘问题

5 QUESTIONS

1. 画出 4 个 pipeline stage、4 个 micro-batch 的 GPipe 时序图,标出哪些格子是 bubble。
2. 解释 1F1B 的 warmup、steady state、cooldown 三个阶段,以及为什么它比 GPipe 更省 activation memory。
3. 推导并使用 `(p - 1) / (m + p - 1)` 估算 bubble fraction,分别计算 p=4,m=8 与 p=8,m=64。
4. 说明 Interleaved 1F1B 中 physical stage 与 virtual stage 的区别,以及 Megatron 的 `--num-layers-per-virtual-pipeline-stage` 大概控制什么。
5. 给定一个 48 层 Transformer、8 张 GPU,设计一个 TP×PP×DP 切分方案,解释为什么 TP 更适合节点内、PP 更适合跨节点。

## 今日检查清单

8 ITEMS

- 能解释 PP 是按模型深度切层,stage 间传 activation / activation gradient
- 能区分 pipeline stage、micro-batch、global batch、pipeline bubble 四个概念
- 能画出 GPipe 和 1F1B 的时序差异
- 能用 `(p - 1) / (m + p - 1)` 快速估算 bubble fraction
- 知道 micro-batch 数增加会降低 bubble,但可能降低 kernel efficiency
- 能解释 Interleaved 1F1B / virtual pipeline stage 的基本动机
- 能读懂 Megatron 中 `--pipeline-model-parallel-size` 和 `--num-layers-per-virtual-pipeline-stage` 的含义
- 能用 profiler 识别 compute、send/recv comm 和 bubble 空档

## 推荐阅读

5 ITEMS

MUST READ

### GPipe: Efficient Training of Giant Neural Networks

Pipeline Parallel 的经典论文。重点看 micro-batch、pipeline bubble、activation recomputation 和同步 flush 语义,不必一开始纠结所有实验细节。

MEGATRON

### Megatron-LM Pipeline Parallelism

读 Megatron 的 pipeline schedule、1F1B、interleaved schedule 参数。重点理解 virtual pipeline stage 如何映射到物理 rank。

PAPER

### PipeDream / 1F1B Scheduling

理解 1F1B 从哪里来,以及同步 flush schedule 与异步 weight staleness 的差异。今天只需要掌握同步训练里的 1F1B 直觉。

TOOL

### nsys / torch.profiler trace

PP 调优一定要看时间线。看每个 rank 上计算 kernel、send/recv、空白区间的位置,比只看 step time 更能定位 stage imbalance。

NEXT

### Sequence Parallel / Context Parallel

PP 解决深度维度切分,但长序列会让 activation 和 attention KV 变成新的瓶颈。Day21 会进入序列维度切分。

## Day 21 预告

NEXT

COMING NEXT

### Sequence Parallel & Context Parallel — 长序列训练的切分法

今天我们沿模型深度切 stage,明天把目光转到序列长度。长上下文训练会让 activation、attention score、KV cache 都随 sequence length 膨胀。Day21 会解释 Sequence Parallel 和 Context Parallel 为什么出现,以及 Ring Attention 如何让长序列跨卡流动。

"Pipeline Parallel 的敌人不是通信本身,而是 GPU 明明在线却无事可做的空白时间。"

DAY 20 · AI INFRA 60-DAY ROADMAP
