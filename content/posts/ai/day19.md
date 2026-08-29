---
title: "Day 19 · Tensor Parallel"
date: '2026-06-20'
draft: false
description: "深入 Megatron-LM Tensor Parallel:理解列并行与行并行 Linear 的矩阵切分、通信边界、MLP 和 Attention 的 TP 布局;手画 Transformer block 的张量切分图,看懂 tensor_model_parallel_size 如何影响显存、计算与通信。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - Megatron-LM
  - Tensor Parallel
  - Transformer
---

DAY 19 · AI INFRA ROADMAP · DISTRIBUTED TRAINING

# 把一层 Transformer _切进多张 GPU_

Day 17 的 DDP 是把 **完整模型复制到每张 GPU** ,Day 18 的 ZeRO 是把模型状态切给数据并行组。 今天换一个维度:当单层本身太大,或者一个 GEMM 太重,就要把 **层内张量** 切开。 Tensor Parallel(TP) 的核心是把 Linear 权重矩阵沿列或行切分,让多张 GPU 同时算一层里的不同分片。 Megatron-LM 的经典模式是: `ColumnParallelLinear` 先把输出 hidden 切开, `RowParallelLinear` 再吃这些切开的输入并在结尾做一次 reduce。 今天的交付物很明确:能手画 MLP 和 Attention 的 TP 切分图,并能标出每一步的通信。

**DURATION** 3 h **THEORY** 1.4 h **HANDS-ON** 1.1 h **REVIEW** 0.5 h **STACK** Megatron-LM · PyTorch · NCCL · Transformer

## 思维导图

OVERVIEW

> **图：Day 19 Tensor Parallel 思维导图**
>
> - DAY 19 · Tensor Parallel
> - COLUMN · ROW · MLP · ATTENTION · MEGATRON
> - 01 · WHY
> - 为什么要 TP
> - 02 · LINEAR
> - 列并行 / 行并行
> - 03 · BLOCK
> - MLP / Attention
> - 04 · PRACTICE
> - 手画切分图
> - 层内模型并行
> - 切参数 / 激活
> - 降低单卡显存
> - 增加通信边界
> - ColumnParallelLinear
> - RowParallelLinear
> - all-gather / all-reduce
> - tensor model group
> - W1 column split
> - W2 row split
> - QKV head split
> - Output projection reduce
> - shape table
> - communication arrows
> - Megatron flags
> - TP + DP + PP
> - DELIVERABLES
> - 列/行并行对比表
> - MLP TP 切分图
> - Attention TP 切分图
> - TP 通信边界清单

FIG · Day 19 全景:先理解层内切分,再掌握 Megatron 的列并行/行并行组合,最后画出 MLP 与 Attention 的通信边界

## 为什么需要 Tensor Parallel

25 MIN

DDP 解决的是 **样本维度** 扩展:每张 GPU 都有完整模型,只是处理不同数据。 ZeRO/FSDP 解决的是 **模型状态** 切分:参数、梯度、优化器状态不再完整复制。 Tensor Parallel 解决的是另一类问题: _单层矩阵本身太大,或单个 GEMM 太重,需要多张 GPU 一起算同一层_。 对 Transformer 来说,最值得切的是 MLP 的两层大 Linear、Attention 的 QKV projection 和 output projection。

| 并行方式 | 切什么 | 减少什么 | 引入什么通信 |
| --- | --- | --- | --- |
| Data Parallel | batch 维度 | 训练时间,不减少单卡模型显存 | 梯度 AllReduce / ReduceScatter |
| ZeRO / FSDP | 参数、梯度、优化器状态 | 模型状态显存 | 参数 AllGather、梯度 ReduceScatter |
| Tensor Parallel | 单层权重矩阵和激活 hidden 维度 | 单层参数、激活、中间 GEMM 工作量 | 层内 AllGather / AllReduce / ReduceScatter |
| Pipeline Parallel | 层深度 | 每张 GPU 持有的层数 | 相邻 stage 之间的 activation P2P |

### TP 最适合放在哪里

大 hidden

### 4096+ hidden 的大 Linear

Transformer 的 MLP 通常扩展到 `4H` 或 SwiGLU 的近似 `8H/3`。这两层 Linear 参数和 FLOPs 都很大,沿 hidden 切分收益明显。

多头注意力

### 按 attention heads 切

Q/K/V projection 的输出维度天然可以按 head 分片。每张 GPU 处理一部分 heads,local attention 独立完成,直到 output projection 才需要合并。

代价

### TP 吃互联带宽

TP 是层内同步,通信频率比 PP 更高。它最适合放在同一节点 NVLink/NVSwitch 内;跨节点 TP 往往会让网络成为瓶颈,除非硬件互联非常强。

一个实用判断:如果问题是"模型副本太多",先想 ZeRO/FSDP;如果问题是"单层本身太大或 GEMM 太重",再想 TP。

## 两块积木:列并行与行并行 Linear

40 MIN

Megatron-LM 的 TP 可以先抽象成一个矩阵乘法: `Y = X A + b`。 如果把 `A` 沿输出维度切,每张 GPU 算一段 `Y_i = X A_i`,这就是列并行。 如果把 `A` 沿输入维度切,输入 `X` 也被切成 `X_i`,每张 GPU 算 partial sum, 最后 reduce 成完整输出,这就是行并行。

> **图：列并行与行并行 Linear**
>
> - COLUMN PARALLEL VS ROW PARALLEL LINEAR
> - COLUMN PARALLEL · SPLIT OUTPUT FEATURES
> - X
> - [B,S,H]
> - A0
> - A1
> - [H, 4H/TP]
> - Y0
> - Y1
> - sharded output
> - optional all-gather
> - Y = [Y0,Y1]
> - if gather\_output=True
> - ROW PARALLEL · SPLIT INPUT FEATURES
> - X0
> - X1
> - input already split
> - B0
> - B1
> - [4H/TP, H]
> - P0
> - P1
> - partial sums
> - all-reduce
> - Y = P0 + P1

FIG · 列并行切输出,可选择是否 all-gather;行并行切输入,最终需要 reduce partial sums

### Megatron 两种 Linear 的语义

| 模块 | 权重切分 | 输入 / 输出 | 通信 |
| --- | --- | --- | --- |
| `ColumnParallelLinear` | 沿输出维度切: `A = [A_1, ..., A_p]` | 每个 rank 读完整输入 `X`,输出自己的 `Y_i = X A_i` | `gather_output=True` 时 all-gather;Megatron MLP 中通常先不 gather,直接交给下一层 RowParallel |
| `RowParallelLinear` | 沿输入维度切:每个 rank 持有 `A_i` 的一部分行 | 输入通常已经按 hidden 分片;每个 rank 算 partial output | forward 末尾 reduce partial sums,得到完整 hidden 输出;bias 不切分 |
| 组合技巧 | 第一层 column,第二层 row | 中间激活保持分片,避免中间 all-gather | 把通信压到 block 末尾的一次 reduce,这是 Megatron TP 的核心省通信模式 |

```
# 伪代码:Megatron-style MLP 的核心形状
# X: [S, B, H], tensor_model_parallel_size = tp

# 1) 列并行:每张 GPU 算 4H/tp 个 hidden
Y_i = X @ W1_i + b1_i # W1_i: [H, 4H/tp]
Z_i = gelu(Y_i) # activation 在本地做,不通信

# 2) 行并行:输入已经是 Z_i,每张 GPU 算输出 partial sum
P_i = Z_i @ W2_i # W2_i: [4H/tp, H]
O = all_reduce_sum(P_i) + b2 # O: [S, B, H]
```

最重要的记忆点:Column 的输出是分片,Row 的输入吃分片;两者接在一起,中间非线性不需要通信。

## 手画 MLP 的 Tensor Parallel

35 MIN

以标准 FFN/MLP 为例: `MLP(X) = GELU(X W_up) W_down`。 Megatron 的设计很漂亮:第一层 `W_up` 做列并行, 输出的 `4H` 中间维度被切成多份; GELU 是逐元素函数,每张 GPU 在本地做; 第二层 `W_down` 做行并行,用本地中间激活算 partial output, 最后一次 AllReduce 得到完整 hidden。

> **图：MLP Tensor Parallel 切分图**
>
> - MLP TENSOR PARALLEL · TP=2
> - X
> - [S,B,H]
> - W\_up\_0
> - W\_up\_1
> - ColumnParallelLinear · [H, 2H] + [H, 2H]
> - GELU
> - Z0
> - Z1
> - local activation · no communication
> - W\_down\_0
> - W\_down\_1
> - RowParallelLinear · [2H,H] + [2H,H]
> - all-reduce
> - O
> - DRAWING RULE
> - Column 后输出分片,elementwise 本地做;Row 后 partial sum 必须 all-reduce。标图时把通信箭头画在 Row 的输出边界。

FIG · MLP TP=2:W\_up 按列切,中间激活保持分片,W\_down 按行切,最后一次 all-reduce 合并输出

### 形状表:以 TP=4 为例

| 张量 | 全量形状 | 每个 TP rank 形状 | 通信 |
| --- | --- | --- | --- |
| 输入 X | [S, B, H] | [S, B, H] | 每个 TP rank 需要完整 X。结合 sequence parallel 时会有额外切分,Day21 再展开。 |
| W\_up | [H, 4H] | [H, H] | ColumnParallel,forward 通常不 all-gather |
| 中间激活 | [S, B, 4H] | [S, B, H] | GELU/SwiGLU/dropout 可本地完成 |
| W\_down | [4H, H] | [H, H] | RowParallel,forward 末尾 all-reduce partial output |
| 输出 O | [S, B, H] | [S, B, H] | 完整输出供 residual / layernorm / 下一子层使用 |

画 MLP TP 图时,不要漏掉 bias:Column 的 bias 随输出分片切,Row 的 bias 通常不切,在 reduce 后加。

## 手画 Attention 的 Tensor Parallel

35 MIN

Multi-Head Attention 比 MLP 更自然适合 TP: Q/K/V projection 的输出可以按 heads 切分。 如果总共有 `num_heads` 个头,TP size 是 `p`,每个 rank 持有 `num_heads / p` 个头。 每个 rank 在本地完成这些头的 attention softmax 和 value 加权, 然后 output projection 用 RowParallelLinear 把各 rank 的 head 输出合成完整 hidden。

> **图：Attention Tensor Parallel 切分图**
>
> - ATTENTION TENSOR PARALLEL · SPLIT HEADS
> - X
> - [S,B,H]
> - W\_qkv\_0
> - heads 0..h/2
> - W\_qkv\_1
> - heads h/2..h
> - ColumnParallel QKV · output heads are sharded
> - Attention
> - local heads
> - Q0 K0 V0
> - Q1 K1 V1
> - softmax and AV are local per head
> - W\_o\_0
> - W\_o\_1
> - RowParallel output projection
> - all-reduce
> - O
> - ATTENTION RULE
> - QKV projection 按 head 分片;attention score / softmax / AV 都在本地 heads 上完成;output projection 行并行后 reduce。

FIG · Attention TP:QKV 按 heads 分片,本地完成 attention,output projection 通过 row parallel 合并回完整 hidden

### Attention 的通信边界

| 位置 | 切分方式 | 是否通信 | 原因 |
| --- | --- | --- | --- |
| QKV projection | ColumnParallel,输出 heads 被切开 | 通常不 all-gather | 每个 attention head 是独立计算单元,分片 heads 可以直接进入本地 attention |
| QK^T / softmax / AV | 每个 rank 处理自己的 heads | 无 TP 通信 | head 之间没有依赖;attention mask 通常复制或按序列并行规则处理 |
| output projection | RowParallel,输入 hidden/head 维度已分片 | 需要 reduce | 每个 rank 得到的是输出 hidden 的 partial sum,必须合并成完整输出供 residual 使用 |
| KV cache 推理 | cache 也按 heads 分片 | prefill/decode 通信模式不同 | 推理引擎里 TP 影响 KV cache 布局、batching 和跨卡同步,Day30+ 再继续 |

```
# 伪代码:Megatron-style attention TP
# X: [S, B, H], num_heads = A, tp = p

QKV_i = X @ W_qkv_i # ColumnParallel, [S,B,3H/p]
Q_i, K_i, V_i = split_heads(QKV_i) # each rank owns A/p heads

Context_i = attention(Q_i, K_i, V_i) # local heads only, no TP communication
P_i = Context_i @ W_o_i # RowParallel partial output
O = all_reduce_sum(P_i) + b_o # full [S,B,H]
```

画 Attention TP 图时,先按 heads 切 QKV,再问一句:这一段是否需要跨 head 信息?如果不需要,就没有 TP 通信。

## TP 的显存、计算与通信账本

30 MIN

TP 看起来很美:参数和 GEMM 工作量约按 `1 / tp` 分到每张 GPU。 但通信也进入了每个 Transformer layer 内部。 所以 TP size 不是越大越好:太小放不下层,太大每张 GPU 的 GEMM 变碎、通信比例上升、kernel 利用率下降。 这也是为什么实际大模型常把 TP 放在单机高速互联内,再用 PP/DP 扩到多机。

显存收益

### 参数和部分激活按 TP 切

Column/Row Parallel 的权重只保存本 rank 分片;MLP 中间激活和 attention heads 也按 TP 分片。对大 hidden 模型,这是单层能否放进 GPU 的关键。

计算收益

### 大 GEMM 被拆到多卡

每张 GPU 只做部分输出或 partial sum,理论 FLOPs 约按 TP size 分摊。但如果分得太细,每个 GEMM 小到吃不满 Tensor Core,收益会变差。

通信代价

### 每层都有同步点

MLP 和 Attention 的 RowParallel 输出边界都需要 reduce。反向传播中还会出现对应的 all-gather / reduce-scatter / all-reduce。TP 对节点内互联依赖很强。

经验法则

### TP 先放 NVLink/NVSwitch 内

单机 8 卡常见 TP=2/4/8;跨节点优先用 PP/DP 扩展。TP 跨节点不是不能做,但要非常谨慎地用 profile 和 NCCL 日志验证。

### 选择 TP size 的检查表

| 问题 | 判断方法 | 行动 |
| --- | --- | --- |
| 单层能否放下? | 估算最大 Linear 权重 + 激活峰值 + optimizer 状态 | 放不下就提高 TP 或结合 ZeRO/FSDP |
| 每卡 GEMM 是否太小? | 看 hidden/tp、heads/tp 是否仍足够大;用 profiler 看 Tensor Core 利用率 | 太小就降低 TP,改用 PP/DP 扩展 |
| heads 是否能整除? | `num_attention_heads % tensor_model_parallel_size == 0` | 不整除就改 TP size 或模型 head 数 |
| 通信是否拖慢? | 看 NCCL all-reduce 时间、GPU idle gap、跨节点流量 | TP 限制在节点内,或启用 sequence parallel / fused comm 优化 |

## 动手实践:从配置到手画图

45 MIN

今天不要求完整跑 Megatron 训练,那是 Day22 的任务。 今天的重点是能从配置推导出每个 rank 持有哪些权重分片、哪些激活分片、哪些通信边界。 你可以用纸画,也可以把下面模板填成 markdown 表。

### Megatron 关键配置

```
# 典型 Megatron-LM 配置片段
torchrun --nproc_per_node=8 pretrain_gpt.py \
  --tensor-model-parallel-size 4 \
  --pipeline-model-parallel-size 2 \
  --num-layers 32 \
  --hidden-size 4096 \
  --ffn-hidden-size 16384 \
  --num-attention-heads 32 \
  --sequence-parallel \
  ...

# 解释:
# 8 GPUs = TP 4 * PP 2 * DP 1
# 每个 pipeline stage 内有一个 4-GPU tensor parallel group
# 每个 TP rank 持有 32/4 = 8 个 attention heads
```

### 推导模板

| 项目 | 全量值 | TP=4 每 rank | 要画什么 |
| --- | --- | --- | --- |
| hidden size | H = 4096 | Column 输出切成 1024 或按具体投影切 | 标出每个 rank 的 hidden shard 范围 |
| FFN hidden | 4H = 16384 | 4096 | W\_up 四个列分片,W\_down 四个行分片 |
| attention heads | 32 heads | 8 heads | QKV 每 rank 画 8 个 head,本地 attention |
| 通信边界 | 每个 block 里的 row parallel 输出 | 每个 TP group 内 collective | 在 MLP output 和 attention output 处画 AllReduce 箭头 |

### 小型教学模拟:不用 Megatron 也能理解

```
# 这是单进程 shape 模拟,帮助你检查列切/行切的数学等价性
import torch

torch.manual_seed(0)
B, S, H, TP = 2, 3, 8, 2
X = torch.randn(B, S, H)
W1 = torch.randn(H, 4 * H)
W2 = torch.randn(4 * H, H)

# eager full MLP
full = torch.relu(X @ W1) @ W2

# ColumnParallel W1: split output dim
W1_parts = W1.chunk(TP, dim=1)
Z_parts = [torch.relu(X @ w) for w in W1_parts]

# RowParallel W2: split input dim, then reduce partial sums
W2_parts = W2.chunk(TP, dim=0)
partials = [z @ w for z, w in zip(Z_parts, W2_parts)]
tp_out = sum(partials) # distributed version = all_reduce_sum

torch.testing.assert_close(tp_out, full)
print("TP math matches full MLP")
```

### 交付物检查清单

- 画出 `ColumnParallelLinear` 的权重切分、输出分片和可选 all-gather。
- 画出 `RowParallelLinear` 的输入分片、partial sum 和 all-reduce。
- 画出 MLP: W\_up column split, GELU local, W\_down row split, output all-reduce。
- 画出 Attention: QKV 按 heads column split, attention local, output projection row split, output all-reduce。
- 给定 `hidden=4096`、`heads=32`、`TP=4`,能写出每 rank 的 head 数和 FFN shard 大小。
- 写一句 TP size 选择结论:为什么它通常适合放在单机 NVLink/NVSwitch 内。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么 Megatron MLP 要用 Column 后接 Row,而不是两层都 all-gather?

ANS

因为第一层 ColumnParallel 的输出正好是第二层 RowParallel 需要的分片输入。中间 GELU/SwiGLU 是逐元素操作,不需要完整 `4H` 激活。这样可以省掉一个很大的中间 all-gather,只在 block 输出边界做一次 reduce。

### Q2 · Attention 里为什么可以按 head 切?

ANS

多头注意力的每个 head 独立计算自己的 QK softmax 和 AV,head 之间在 output projection 前没有数据依赖。因此 QKV projection 的输出可以按 head 分给不同 TP rank,每个 rank 本地完成一部分 heads,最后通过 output projection 合并。

### Q3 · Tensor Parallel 和 ZeRO/FSDP 能一起用吗?

ANS

能,而且大模型训练经常这么做。TP 在层内切大矩阵,PP 按层深度切 stage,DP/FSDP/ZeRO 在数据并行组内切模型状态。组合时要清楚每个 process group 的维度:TP group 内做层内通信,DP group 内做梯度/参数状态同步。

### Q4 · TP size 越大越好吗?

ANS

不是。TP size 增大后,单卡参数和计算下降,但每层通信更重,每个 GEMM 也更小。小 GEMM 可能吃不满 Tensor Core,通信还会占更多比例。经验上先让 TP 满足单层显存和大 GEMM 分摊需求,再用 PP/DP 扩展全局 GPU 数。

### Q5 · 为什么常说 TP 适合节点内,不适合跨节点?

ANS

因为 TP 的 collective 在每层内部频繁发生,对延迟和带宽都敏感。节点内 NVLink/NVSwitch 通常能承受这种高频通信;跨节点网络即使有 IB/RDMA,延迟和带宽也更容易成为瓶颈。跨节点更常用 PP/DP,通信频率和数据形态更适合网络层。

## 复盘问题

REVIEW

1. Tensor Parallel 和 Data Parallel 分别切的是哪个维度?
2. `ColumnParallelLinear` 为什么切输出维度?它什么时候需要 all-gather?
3. `RowParallelLinear` 为什么需要 reduce partial sums?
4. Megatron MLP 为什么可以把中间激活保持为分片状态?
5. Attention 的 QKV projection 为什么可以按 heads 切?
6. 给定 `num_heads=40`,哪些 TP size 是合法的?为什么?
7. TP size 过大时,性能可能从哪里掉下来?

## 参考资料

OFFICIAL DOCS

PAPER

### Megatron-LM Paper

Megatron-LM 原始论文,提出高效的层内模型并行方法,并说明 MLP 与 Attention 的切分方式。
[arxiv.org · Megatron-LM](https://arxiv.org/abs/1909.08053)

NVIDIA

### Megatron Core Parallelism Guide

NVIDIA 官方 Megatron Core 并行策略说明,介绍 TP/PP/DP/CP/EP 的适用场景和配置。
[docs.nvidia.com · Parallelism Guide](https://docs.nvidia.com/megatron-core/developer-guide/0.16.0/user-guide/parallelism-guide.html)

API

### ColumnParallelLinear / RowParallelLinear

Megatron Core API 文档,定义列并行与行并行 Linear 的权重切分、输出 gather 和输入分片语义。
[docs.nvidia.com · tensor\_parallel.layers](https://docs.nvidia.com/megatron-core/developer-guide/0.15.0/apidocs/core/core.tensor_parallel.layers.html)

PYTORCH

### PyTorch Tensor Parallel Tutorial

PyTorch 官方 Tensor Parallel 教程,展示如何把 Transformer-like 模型用 TP 与 FSDP 组合训练。
[docs.pytorch.org · TP tutorial](https://docs.pytorch.org/tutorials/intermediate/TP_tutorial.html)

Tensor Parallel 的精髓,不是把矩阵随便切开,而是把通信留到最少、最值得的位置。

DAY 19 COMPLETE · NEXT: PIPELINE PARALLEL
