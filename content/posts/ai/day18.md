---
title: "Day 18 · ZeRO 系列（DeepSpeed）"
date: '2026-06-20'
draft: false
description: "理解 ZeRO-1/2/3 分别切分 optimizer state、gradient 和 parameter 的方式，读 ZeRO 论文主线，并用 DeepSpeed 配置把 DDP 的复制显存一步步拆掉。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - DeepSpeed
  - ZeRO
  - Training
---

DAY 18 · AI INFRA ROADMAP · 60 DAYS

# 把复制的状态 _切开_

Day 17 学完 DDP 后,我们知道每张卡都有完整模型、完整梯度、完整 optimizer state。 这很简单,也很浪费:模型越大,复制的显存越快撞墙。 Day 18 进入 ZeRO:它的核心不是发明新的并行维度,而是把数据并行里每张卡重复保存的训练状态 **分片到不同 rank** 。ZeRO-1 切 optimizer state,ZeRO-2 再切 gradient, ZeRO-3 连 parameter 也切。今天把这三刀讲清,再用 DeepSpeed 配置看它们如何落地。

**DURATION** 3 h **THEORY** 1.2 h **PAPER** 0.8 h **HANDS-ON** 1 h **STACK** DeepSpeed · ZeRO · DDP · NCCL

## 思维导图

OVERVIEW

> **图：Day 18 ZeRO 思维导图**
>
> - DAY 18 · ZeRO 系列
> - DDP MEMORY · STAGE 1 · STAGE 2 · STAGE 3 · DEEPSPEED
> - 01 · COST
> - DDP 显存账
> - 02 · STAGES
> - ZeRO 三阶段
> - 03 · COMM
> - 通信变化
> - 04 · DS
> - DeepSpeed 配置
> - parameters
> - gradients
> - optimizer states
> - activation 另算
> - ZeRO-1: O
> - ZeRO-2: O + G
> - ZeRO-3: O + G + P
> - Offload: Day 23
> - AllReduce → RS+AG
> - 参数按需 all-gather
> - 梯度 reduce-scatter
> - prefetch / bucket
> - zero\_optimization
> - stage 1 / 2 / 3
> - memory breakdown
> - ds\_report
> - DELIVERABLES
> - DDP 显存账表
> - ZeRO 三阶段图
> - DeepSpeed config 对照
> - ZeRO 论文笔记

FIG · Day 18 全景:从 DDP 复制成本出发,理解 ZeRO 逐级切分训练状态

## DDP 的显存账

35 MIN

ZeRO 要解决的不是 activation 显存,而是 **模型训练状态** 的复制。 以 BF16/FP16 训练 + AdamW 为例,每个参数通常不只占 2 bytes: 还有梯度、FP32 master weight、Adam 的一阶/二阶动量。 DDP 会把这些状态在每张卡上都保存一份,所以卡数变多主要提升吞吐,并不自动扩大单模型容量。

| 状态 | 常见精度 | 每参数字节数 | DDP 行为 |
| --- | --- | --- | --- |
| 参数 P | FP16 / BF16 | 2 bytes | 每个 rank 都保留完整模型参数。 |
| 梯度 G | FP16 / BF16 或 FP32 | 2–4 bytes | 每个 rank 本地 backward 产生完整梯度,再 AllReduce。 |
| Master weight | FP32 | 4 bytes | 混合精度训练常保留 FP32 参数用于稳定更新。 |
| Adam m / v | FP32 | 8 bytes | AdamW 最重的部分:一阶动量 + 二阶动量。 |
| 合计 | 训练状态 | 约 16 bytes / param | 不含 activation、temporary buffer、fragmentation。 |

### 一个 7B 模型的粗算

```
def gb(params_billion, bytes_per_param):
    return params_billion * 1e9 * bytes_per_param / 1024**3

params = 7
print("params bf16:", gb(params, 2), "GiB")
print("grad bf16:", gb(params, 2), "GiB")
print("master weight fp32:", gb(params, 4), "GiB")
print("adam m/v fp32:", gb(params, 8), "GiB")
print("training states total:", gb(params, 16), "GiB")
```

这就是 ZeRO 的入口:如果 8 张卡各存一份 100+ GiB 训练状态,显然浪费。分片后,每卡只存自己负责的那部分。

## ZeRO-1 / 2 / 3 分别切什么

55 MIN

ZeRO 的全名是 **Zero Redundancy Optimizer** 。名字里的 zero redundancy 很直白: 不要让每个 rank 都重复保存相同训练状态。 三个 stage 是逐级增加切分范围:先切 optimizer state,再切 gradient,最后切 parameter。

> **图：ZeRO 三阶段切分**
>
> - WHAT EACH ZERO STAGE SHARDS
> - DDP
> - P full
> - G full
> - O full
> - 每卡完整复制
> - ZeRO-1
> - O shard
> - 切 optimizer state
> - ZeRO-2
> - G shard
> - 切 optimizer + gradient
> - ZeRO-3
> - P shard
> - 三类状态都切
> - 最简单
> - 显存下降
> - 通信改变
> - 最省显存 · 最复杂

FIG · P = parameters · G = gradients · O = optimizer states

| 阶段 | 切分对象 | 每卡状态显存 | 主要通信变化 | 适合场景 |
| --- | --- | --- | --- | --- |
| DDP | 不切分 | 约 `P + G + O` | 梯度 AllReduce | 模型能放下,追求简单稳定和高吞吐。 |
| ZeRO-1 | Optimizer state | 约 `P + G + O/N` | optimizer step 只更新本 rank shard,再同步参数 | Adam state 很重但参数/梯度还能放下。 |
| ZeRO-2 | Optimizer state + Gradient | 约 `P + G/N + O/N` | 梯度 AllReduce 变成 ReduceScatter + 必要同步 | 中大模型训练的常用折中,显存省得明显。 |
| ZeRO-3 | Optimizer state + Gradient + Parameter | 约 `(P + G + O)/N` | forward/backward 前按层 AllGather 参数,用完释放 | 模型参数本身也放不下,需要最大化模型容量。 |

## 通信视角看 ZeRO

35 MIN

ZeRO 不是免费午餐。省显存的代价是通信和调度更复杂。 Day 15 学的 AllGather / ReduceScatter 在这里第一次变成主角: ZeRO-2 用 ReduceScatter 让每个 rank 只保留梯度分片; ZeRO-3 在每层计算前 AllGather 参数,计算完再释放。

DDP

### 完整梯度 + AllReduce

每个 rank backward 得到完整梯度,AllReduce 后每个 rank 仍然拥有完整平均梯度。简单,但梯度和 optimizer state 都复制。

ZeRO-2

### 梯度 ReduceScatter

梯度聚合后不再复制给所有 rank,而是 scatter 成 shard。每个 rank 只负责自己那份 optimizer update。

ZeRO-3

### 参数按需 AllGather

参数平时是 shard,某一层即将 forward/backward 时 gather 成完整参数,算完就释放。显存省,但对 prefetch 和 bucket 调度更敏感。

### ZeRO-3 一层的生命周期

```
# 概念伪代码:真实 DeepSpeed 内部会做 bucket、prefetch、overlap
for layer in model.layers:
    full_param = all_gather(param_shard[layer]) # 通信:取回本层完整参数
    activation = layer.forward(x, full_param) # 计算:正常 forward
    release(full_param) # 显存:用完释放或缓存

for layer in reversed(model.layers):
    full_param = all_gather(param_shard[layer]) # backward 也需要参数
    grad = layer.backward(full_param)
    grad_shard = reduce_scatter(grad) # 通信:只保留本 rank 梯度分片
    optimizer_update(local_state[layer], grad_shard)
    release(full_param)
```

ZeRO-3 的性能关键在 overlap:下一层参数预取能不能藏在当前层计算后面。否则显存省了,step time 会被通信拖住。

## ZeRO 论文怎么读

45 MIN

RoadMap 指定今天读 **ZeRO: Memory Optimization Toward Training Trillion Parameter Models** 。 不建议从公式一路硬啃。今天的读法是先抓主问题、主表格和主结论: 大模型训练的显存瓶颈来自模型状态复制,ZeRO 用分片状态把数据并行的冗余降下来, 再通过通信调度尽量保住吞吐。

PASS 1 · 20 MIN

### 读摘要 + Introduction

只回答一个问题:论文认为训练大模型的主要显存瓶颈是什么?注意它把 memory 分成 model states、activation、temporary buffer、fragmentation 几类。

PASS 2 · 20 MIN

### 读 ZeRO-DP 三阶段

重点看 optimizer states、gradients、parameters 三类切分。把论文表格改写成自己的中文表:每阶段省什么、需要什么通信。

PASS 3 · 20 MIN

### 读显存公式

不要死背符号,把它翻译成"每卡要存多少 P/G/O"。用 N=8、N=64 两个 world size 代入,看大规模下为什么 ZeRO-3 才能放更大模型。

PASS 4 · 20 MIN

### 读实验图表

关注两个指标:能训练多大模型,吞吐下降多少。ZeRO 的工程价值不只是省显存,而是在可接受通信开销下扩大模型容量。

### 论文笔记模板

```
# ZeRO 论文笔记

## 1. 问题
- DDP 中哪些状态在每个 rank 上重复?
- activation / model states / temporary buffer / fragmentation 的边界是什么?

## 2. 三阶段
- ZeRO-1: 切什么? 每卡剩什么? 通信多了什么?
- ZeRO-2: 切什么? 为什么 ReduceScatter 变重要?
- ZeRO-3: 切什么? 为什么需要参数 all-gather?

## 3. 代价
- 哪些场景 ZeRO-3 会慢?
- prefetch / bucket / overlap 在解决什么?

## 4. 我的结论
- 如果模型能用 DDP 放下,我会不会用 ZeRO?
- 什么时候选 ZeRO-2,什么时候必须 ZeRO-3?
```

## DeepSpeed 最小实验

50 MIN

Day 23 会专门做 DeepSpeed 实战。今天不追求完整训练大模型, 只要能读懂 `zero_optimization` 配置, 并用同一个小模型对比 stage 1/2/3 的显存日志即可。 如果本机没有多卡,先把配置和命令整理好,在有 GPU 的环境执行。

### 三个配置文件

```
// ds_zero1.json
{
  "train_micro_batch_size_per_gpu": 4,
  "gradient_accumulation_steps": 1,
  "bf16": { "enabled": true },
  "zero_optimization": {
    "stage": 1
  },
  "optimizer": {
    "type": "AdamW",
    "params": { "lr": 1e-4 }
  }
}
```

```
// ds_zero2.json
{
  "train_micro_batch_size_per_gpu": 4,
  "gradient_accumulation_steps": 1,
  "bf16": { "enabled": true },
  "zero_optimization": {
    "stage": 2,
    "reduce_scatter": true,
    "allgather_partitions": true,
    "overlap_comm": true,
    "contiguous_gradients": true
  },
  "optimizer": {
    "type": "AdamW",
    "params": { "lr": 1e-4 }
  }
}
```

```
// ds_zero3.json
{
  "train_micro_batch_size_per_gpu": 4,
  "gradient_accumulation_steps": 1,
  "bf16": { "enabled": true },
  "zero_optimization": {
    "stage": 3,
    "overlap_comm": true,
    "contiguous_gradients": true,
    "stage3_prefetch_bucket_size": "auto",
    "stage3_param_persistence_threshold": "auto"
  },
  "optimizer": {
    "type": "AdamW",
    "params": { "lr": 1e-4 }
  }
}
```

### 运行方式

```
# 环境检查
ds_report

# DeepSpeed 启动,等价于替你处理分布式 launcher 和 engine 初始化
deepspeed --num_gpus=4 train_tiny_transformer.py --deepspeed ds_zero1.json
deepspeed --num_gpus=4 train_tiny_transformer.py --deepspeed ds_zero2.json
deepspeed --num_gpus=4 train_tiny_transformer.py --deepspeed ds_zero3.json

# 如果用 HuggingFace Trainer,通常是把 ds_config 传给 TrainingArguments
# deepspeed="ds_zero2.json"
```

DELIVERABLE

### 今天的交付物

一份 `day18_zero_notes.md`:包含 DDP 显存账、ZeRO-1/2/3 对照表、ZeRO 论文 4 段式笔记、三份 DeepSpeed config、以及一次 stage 1/2/3 的显存或日志对比。

检查标准

### 不要只会背 stage

看到一个训练 OOM,你应该能判断是 activation 太大、模型状态太大,还是碎片/临时 buffer 太大。ZeRO 主要解决模型状态,activation 还要靠 checkpointing、sequence parallel、micro batch 调整。

## 怎么选 ZeRO stage

25 MIN

优先 DDP

### 模型轻松放下

如果 DDP 能稳定放下,且吞吐很好,先别为了"高级"上 ZeRO-3。简单系统更好调、更好恢复、更少通信调度问题。

ZeRO-1

### Adam state 是瓶颈

适合 optimizer state 占大头、但完整参数和梯度还能放下的场景。配置简单,通信复杂度相对温和。

ZeRO-2

### 常用折中点

进一步切 gradient,显存收益明显,吞吐通常还比较可控。很多中大模型训练会先试 ZeRO-2。

ZeRO-3

### 参数本身也放不下

当完整模型参数复制都成为问题时,ZeRO-3 才是关键。代价是参数 all-gather、prefetch 和 checkpoint 都更复杂。

OFFLOAD

### GPU 仍然不够

把 optimizer/parameter offload 到 CPU 或 NVMe 可以继续省 GPU 显存,但会明显吃 PCIe/NVMe 带宽。RoadMap Day 23 再展开。

COMBINE

### 和 TP/PP 组合

ZeRO 解决数据并行状态冗余,TP/PP 解决模型计算和参数本身的并行。大模型训练通常是多种并行策略叠加。

## 常见疑问

5 QUESTIONS

### Q1 · ZeRO-3 是不是总比 ZeRO-2 好?

ANS

不是。ZeRO-3 最省模型状态显存,但每层参数都需要按需 AllGather,通信调度更重。如果模型用 ZeRO-2 已经能放下,ZeRO-3 可能只是让 step time 变慢、排错更复杂。

选择原则:先用能放下模型且吞吐最好的最简单方案。显存不够时再逐级上 ZeRO-2、ZeRO-3、offload。

### Q2 · ZeRO 和 FSDP 是什么关系?

ANS

二者目标非常接近:都通过分片参数、梯度和 optimizer state 降低数据并行冗余。DeepSpeed ZeRO 是 DeepSpeed 生态里的实现,FSDP 是 PyTorch 原生实现。

概念上可以把 FSDP FULL\_SHARD 理解成类似 ZeRO-3 的形态。实际工程选择取决于框架生态、checkpoint 格式、调参经验、与 Trainer/Megatron 的集成。

### Q3 · ZeRO 能解决 activation OOM 吗?

ANS

ZeRO 主要解决模型状态:参数、梯度、optimizer state。activation 是 forward 为 backward 保存的中间结果,ZeRO 不会自动把它变小。

activation OOM 通常靠 micro batch 降低、activation checkpointing、sequence/context parallel、FlashAttention、混合精度等手段处理。判断 OOM 来源很重要。

### Q4 · 为什么 ZeRO-2 不是简单把 AllReduce 换掉?

ANS

AllReduce 的结果是每个 rank 都拿到完整聚合梯度。ZeRO-2 的目标是每个 rank 只保留自己负责的梯度 shard,所以更自然的通信是 ReduceScatter。

但 optimizer update、参数同步、bucket 组织、梯度连续化都会受到影响,因此不是替换一个 API 这么简单。

### Q5 · DeepSpeed config 里的 auto 参数可以完全信任吗?

ANS

可以作为起点,不能当终点。`auto` 能帮你快速跑起来,尤其和 HuggingFace Trainer 集成时很方便,但大规模训练还是要看 profiler 和日志调 bucket、prefetch、overlap、micro batch。

今天的目标是读懂配置语义。真正调性能时,你需要把 DeepSpeed 日志、NCCL trace、显存峰值和 step time 放在一起看。

## 复盘问题

6 QUESTIONS

1. 以 BF16 + AdamW 为例,列出每个参数在训练中对应的参数、梯度、master weight、m/v 状态,估算 DDP 每卡模型状态显存。
2. 用一张表说明 ZeRO-1、ZeRO-2、ZeRO-3 分别切分 P/G/O 中的哪些部分,每卡状态显存如何随 world size 变化。
3. 解释为什么 ZeRO-2 更依赖 ReduceScatter,ZeRO-3 更依赖 AllGather。
4. 读 ZeRO 论文后,用自己的话总结 model states、activation、temporary buffer、fragmentation 四类显存的区别。
5. 设计一个实验比较 DDP、ZeRO-1、ZeRO-2、ZeRO-3:你会记录哪些指标,如何判断 stage 选择是否合理?
6. 列出 3 个 ZeRO-3 可能比 ZeRO-2 更慢的原因,并说明如何用 profiler 或 DeepSpeed 日志验证。

## 今日检查清单

10 ITEMS

- 能解释 DDP 为什么不会因为卡数增加而自动放下更大的单模型状态
- 能按参数量估算 BF16 + AdamW 训练状态显存
- 能准确说出 ZeRO-1 / 2 / 3 分别切分 optimizer state、gradient、parameter 中的哪些部分
- 能解释 AllReduce、ReduceScatter、AllGather 在 ZeRO 中的作用变化
- 能说明 ZeRO 主要解决模型状态显存,不是 activation 显存
- 能读懂 DeepSpeed `zero_optimization.stage` 配置
- 能写出 stage 1/2/3 三份最小 DeepSpeed 配置
- 能用 ZeRO 论文的显存分类框架分析一次 OOM
- 知道 ZeRO-3 的性能风险来自参数 all-gather、prefetch 和通信 overlap
- 能给出 DDP / ZeRO-2 / ZeRO-3 / offload 的基本选择原则

## 推荐阅读

5 ITEMS

MUST READ

### ZeRO: Memory Optimization Toward Training Trillion Parameter Models

今天的主论文。重点读摘要、Introduction、ZeRO-DP 三阶段、memory consumption 分析和实验图表。

OFFICIAL

### DeepSpeed ZeRO Optimization 文档

对照 `zero_optimization` 配置项读:stage、overlap\_comm、reduce\_scatter、contiguous\_gradients、offload\_optimizer、offload\_param。

SOURCE

### microsoft/DeepSpeed

先看 examples 和 docs,再看 runtime/zero 目录。今天只需要知道 optimizer state partition 和 parameter partition 的代码入口。

PYTORCH

### FullyShardedDataParallel 文档

作为 ZeRO 的 PyTorch 原生对照。读 FSDP 的 sharding strategy,把 FULL\_SHARD 和 ZeRO-3 建立概念映射。

NEXT

### Megatron-LM Tensor Parallel

Day 19 会从"切训练状态"转向"切模型计算":列并行、行并行、attention/MLP 的参数如何在 GPU 间分布。

## Day 19 预告

NEXT

COMING NEXT

### Tensor Parallel — Megatron-LM 的列并行 / 行并行

ZeRO 仍然属于数据并行家族:每个 rank 处理不同数据,只是训练状态被切分。 Day 19 会进入模型并行:把一个 MLP 或 Attention 层的矩阵乘法本身切到多张 GPU 上。 到那时,AllGather / ReduceScatter 不再只是省显存工具,而会变成每一层计算图的一部分。

"ZeRO 的本质不是魔法压缩,而是把每张卡重复保存的训练状态还给分布式系统。"

DAY 18 · AI INFRA 60-DAY ROADMAP
