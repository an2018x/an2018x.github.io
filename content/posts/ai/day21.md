---
title: "Day 21 · Sequence Parallel & Context Parallel"
date: '2026-06-20'
draft: false
description: "进入长序列训练的并行策略:解释为什么长上下文会让 activation 和 attention 成为瓶颈,拆开 Sequence Parallel 与 Context Parallel 的切分边界,理解 Ring Attention 如何用块状 attention 和环形 KV 传递扩展上下文长度。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - Sequence Parallel
  - Context Parallel
  - Ring Attention
---

DAY 21 · AI INFRA ROADMAP · 60 DAYS

# 把上下文切进 _序列维度_

Day 19 用 Tensor Parallel 切隐藏维度,Day 20 用 Pipeline Parallel 切模型深度。 但长上下文训练的痛点常常不在参数,而在 **sequence length** : activation 随序列长度线性增长,attention 的依赖范围随序列平方放大。 今天进入序列维度切分:Megatron 风格的 **Sequence Parallel** 主要把某些 activation 沿序列维度切给 TP ranks,减少重算和激活显存; **Context Parallel** 则把长上下文本身分给多卡,让每张卡只常驻一段 tokens。 最后用 **Ring Attention** 看清 KV 块如何沿环流动,计算和通信如何重叠。

**DURATION** 3 h **THEORY** 1.3 h **MATH** 0.5 h **HANDS-ON** 1 h **STACK** Sequence Parallel · Context Parallel · Ring Attention · FlashAttention

## 思维导图

OVERVIEW

> **图：Day 21 思维导图**
>
> - DAY 21 · Sequence / Context Parallel
> - LONG CONTEXT · ACTIVATION · KV RING · BLOCKWISE ATTENTION
> - 01 · WHY
> - 长序列瓶颈
> - 02 · SP
> - Sequence Parallel
> - 03 · CP
> - Context Parallel
> - 04 · RING
> - Ring Attention
> - activation O(SBH)
> - attention O(S²)
> - KV / score / mask
> - FlashAttention 辅助
> - 配合 TP
> - 按 S 切 activation
> - all-gather / reduce-scatter
> - 少存 activation
> - 按 context 切 token
> - 每卡持 S/P
> - attention 需要全局 K/V
> - 通信计算重叠
> - Q 本地,K/V 转圈
> - blockwise softmax
> - overlap send/recv
> - 近似零额外通信
> - DELIVERABLES
> - 长序列显存账
> - SP / CP 对照表
> - Ring Attention 图
> - 配置推导笔记

FIG · Day 21 全景:长序列先撞 activation,再撞 attention;SP 降激活,CP/Ring Attention 扩上下文

## 长序列训练为什么难

30 MIN

训练长上下文时,参数量可能没变,但中间激活急剧变大。 对 GPT 类模型,常见 hidden activation 形状是 `[S, B, H]`。 当序列长度 S 从 4K 变成 128K,这部分显存线性放大 32 倍。 Attention 更麻烦:朴素 attention score 是 `[B, heads, S, S]`, 这就是平方项。FlashAttention 能避免物化完整 score 矩阵,但 K/V、mask、dropout、反向所需状态仍然会让长序列成为系统问题。

| 对象 | 典型形状 | 随 S 增长 | 解决方向 |
| --- | --- | --- | --- |
| hidden activation | [S, B, H] | 线性 O(S) | Sequence Parallel / checkpointing / recompute |
| Q/K/V | [S, B, heads, Dh] | 线性 O(S) | TP + SP + fused attention |
| attention score | [B, heads, S, S] | 平方 O(S²) | FlashAttention / blockwise attention / Ring Attention |
| KV cache | [layers, S, heads, Dh] | 线性 O(S) | Context Parallel / paged KV / cache sharding |
| optimizer state | parameters × 2 | 和 S 无关 | ZeRO/FSDP,不是 Day21 的主战场 |

### 一个显存估算脚本

```
def gib(x):
    return x / 2**30

def hidden_activation_gib(seq, batch, hidden, bytes_per_elem=2, copies=6):
    # copies 粗略表示 layernorm/dropout/residual/qkv 等多份中间状态
    return gib(seq * batch * hidden * bytes_per_elem * copies)

for seq in [4096, 16384, 65536, 131072]:
    mem = hidden_activation_gib(seq, batch=1, hidden=8192)
    print(f"S={seq:6d} hidden activation rough={mem:6.2f} GiB / layer group")
```

参数不是唯一瓶颈

### ZeRO 救不了所有长序列 OOM

ZeRO/FSDP 主要切模型状态:参数、梯度、optimizer state。长序列 OOM 往往来自 activation 和 attention 临时状态,需要 SP/CP/FlashAttention/checkpointing 这组工具。

FlashAttention 不是终点

### 它减少 score 矩阵,不切上下文

FlashAttention 通过 IO-aware 分块避免保存完整 `S×S` score,但单卡仍要持有本地序列相关的 Q/K/V 和中间状态。S 继续增大时,仍需要跨卡切序列。

判断长序列方案前,先问 OOM 来自哪里:模型状态、activation、attention score、KV cache,还是通信 buffer。

## Sequence Parallel — 把激活沿序列维度切给 TP ranks

40 MIN

Megatron 风格的 Sequence Parallel 通常和 Tensor Parallel 一起使用。 Day19 看到 TP 会让 MLP/Attention 的某些中间张量按 hidden/head 维度切分, 但 LayerNorm、Dropout、Residual 这类操作常常仍然在每个 TP rank 上保存完整 `[S, B, H]` activation。 SP 的做法是:在这些不需要完整 hidden 分片通信的区域,把 activation 沿序列维度 S 切开, 每个 TP rank 只保存 `S / TP` 的 tokens。

> **图：Sequence Parallel shape transitions**
>
> - SEQUENCE PARALLEL — shard activations along S inside TP group
> - SP region
> - [S/TP, B, H]
> - all-gather S
> - TP compute region
> - [S, B, H/TP] or full S
> - reduce-scatter S
> - back to SP region
> - WHERE IT HELPS
> - LayerNorm / Dropout / Residual / bias add 这类 token-wise 操作可以只处理本地序列 shard。
> - TP 边界原本的 all-reduce 可重写成 reduce-scatter + all-gather,让中间 activation 不再每卡完整保存。
> - MENTAL MODEL
> - SP 是 activation memory optimization,不是单独把 attention 的全局依赖问题彻底解决。

FIG · Megatron SP 在 TP group 内把部分 activation 沿 S 切分,用 all-gather / reduce-scatter 做边界转换

### SP 的收益和限制

| 问题 | SP 怎么帮忙 | 限制 |
| --- | --- | --- |
| activation 显存 | 按 TP size 近似摊薄部分 token-wise activation | 不是所有 activation 都能切;attention 仍有全局依赖 |
| activation recompute | 显存下降后,可以减少 checkpoint/recompute 范围 | 要和 selective activation recomputation 一起权衡 |
| 通信 | 用 reduce-scatter / all-gather 替代某些 all-reduce | 通信形状改变,不代表通信免费 |
| 使用条件 | 常配合 `--tensor-model-parallel-size` 使用 | TP group 内序列长度最好能整除 TP size |

```
# Megatron-LM 常见配置片段
torchrun --nproc_per_node=8 pretrain_gpt.py \
  --tensor-model-parallel-size 4 \
  --pipeline-model-parallel-size 2 \
  --sequence-parallel \
  --seq-length 8192 \
  --micro-batch-size 1

# 直觉:
# TP=4 时,SP 区域里每个 rank 只常驻约 S/4 的 token activation。
# 需要完整序列参与 TP compute 的边界,再用 all-gather 取回。
```

SP 的定位:在 TP 内减少 activation replication,它是"省显存",不是"让 1M token attention 自动成立"。

## Context Parallel — 把长上下文本身切开

35 MIN

Context Parallel 更直接地面对长上下文: 把完整序列 S 切成多个 context shard,每个 rank 只保存一段 tokens 的 Q/K/V 和中间状态。 但 self-attention 的语义要求每个 query 能看到全局 key/value。 所以 CP 的核心不是简单切数据,而是设计一种方式,让每个 rank 用本地 Q 和其它 rank 的 K/V 分块完成全局 attention,同时不把所有 K/V 永久 all-gather 到本地。

> **图：Context Parallel overview**
>
> - CONTEXT PARALLEL — shard sequence tokens across devices
> - Rank 0
> - tokens 0..S/4
> - local Q0,K0,V0
> - Rank 1
> - tokens S/4..S/2
> - local Q1,K1,V1
> - Rank 2
> - tokens S/2..3S/4
> - local Q2,K2,V2
> - Rank 3
> - tokens 3S/4..S
> - local Q3,K3,V3
> - attention needs remote K/V blocks
> - CP 的关键:每个 rank 保留本地 Q,逐块拿到其它 rank 的 K/V,累积 attention 结果,而不是一次性 all-gather 全部上下文。

FIG · CP 把 token 范围分给多卡;attention 仍要跨 shard 看全局 K/V

### SP vs CP 快速对照

| 维度 | Sequence Parallel | Context Parallel |
| --- | --- | --- |
| 主要目标 | 减少 TP 内 activation replication | 让更长上下文跨设备训练/推理 |
| 切分对象 | 部分 activation 的 sequence 维度 | 完整上下文 tokens / QKV block |
| 典型通信 | all-gather / reduce-scatter | all-gather K/V、ring exchange、all-to-all 等变体 |
| 依赖关系 | 常和 TP 绑定 | 可和 TP/PP/DP 组合,形成 4D parallel |
| 解决边界 | 省激活显存,但不改变 attention 全局依赖 | 直接处理 attention 跨长上下文的 K/V 访问 |

一句话区分:SP 是"把中间激活切薄",CP 是"把上下文切长"。

## Ring Attention 思路

45 MIN

Ring Attention 的核心直觉很漂亮: 每个设备持有一段 query 和一段 key/value。 query 留在本地,key/value block 沿着设备环移动。 每来一个远端 K/V block,本地就做一次 blockwise attention 更新输出和 softmax 统计量。 在下一块 K/V 传输时,当前块的 attention 计算同时进行。 如果 overlap 做得好,通信可以被计算藏起来。

> **图：Ring Attention diagram**
>
> - RING ATTENTION — keep Q local, rotate K/V blocks
> - Rank 0
> - Q0 · K0/V0
> - Rank 1
> - Q1 · K1/V1
> - Rank 2
> - Q2 · K2/V2
> - Rank 3
> - Q3 · K3/V3
> - step t
> - compute Attention(Q\_local, K/V\_current)
> - while sending K/V to next rank
> - 每个 rank 经过 P 轮后看过所有 K/V block,得到与全局 attention 等价的输出;关键是 blockwise softmax 要维护全局归一化统计。

FIG · Ring Attention 中 Q 不动,K/V 沿环流动;每一轮同时进行 block attention 和下一跳通信

### Ring Attention 的四步循环

STEP 1

### 本地初始化

Rank i 持有 `Q_i,K_i,V_i`。输出 accumulator 和 softmax 统计量初始化为空。

STEP 2

### 块状 attention

用本地 Q 和当前 K/V block 做 blockwise attention,更新局部输出、row max、row sum 等稳定 softmax 状态。

STEP 3

### K/V 传下一跳

当前 K/V block 发给环上的下一个 rank,同时接收上一个 rank 的 K/V。通信最好和下一段计算重叠。

STEP 4

### 转满一圈

P 个 rank 转 P 轮后,每个 Q shard 都看过全局 K/V,输出拼起来就是全序列 attention 结果。

### 为什么需要 blockwise softmax

attention 不能简单把每个 K/V block 的 softmax 输出相加。 softmax 的分母是全局所有 key 的指数和。 因此 blockwise attention 需要在线维护每一行的最大值和归一化分母, 类似 FlashAttention 的 online softmax。 这就是 Ring Attention 能保持精确语义的关键。

```
# 心智伪代码:不是可直接运行实现
for step in range(context_parallel_size):
    scores = q_local @ k_block.T
    scores = apply_causal_mask_for_this_block(scores, step)
    out_accum, m_i, l_i = online_softmax_update(
        out_accum, m_i, l_i, scores, v_block
    )
    send_async(k_block, v_block, next_rank)
    k_block, v_block = recv_async(prev_rank)

out_local = out_accum / l_i
```

Ring Attention 的亮点:把全局 attention 拆成多个精确 block attention,用环形 K/V 交换和 online softmax 串起来。

## 动手实践 — 配置推导与通信账

1 H

今天的练习不要求真的训练百万 token,而是能从配置推导每张卡持有什么张量、 哪些边界需要 all-gather / reduce-scatter / ring send-recv, 以及长序列扩展后显存账怎么变化。

```
def sp_activation_per_rank(seq, batch, hidden, tp, bytes_per_elem=2):
    return seq // tp * batch * hidden * bytes_per_elem / 2**30

def cp_tokens_per_rank(seq, cp):
    return seq // cp

seq = 131072
hidden = 8192
batch = 1

for tp in [1, 2, 4, 8]:
    print(f"SP TP={tp}: hidden shard ~= {sp_activation_per_rank(seq, batch, hidden, tp):.2f} GiB")

for cp in [1, 2, 4, 8]:
    print(f"CP={cp}: tokens per rank = {cp_tokens_per_rank(seq, cp)}")
```

### 配置推导模板

| 配置项 | 例子 | 推导问题 |
| --- | --- | --- |
| sequence length | S = 131072 | 单卡完整 activation 是否能放下? |
| tensor parallel | TP = 4 | SP 区域每 rank 持有多少 tokens?哪些边界要 all-gather? |
| context parallel | CP = 8 | 每 rank 本地 Q/K/V 的 token 范围是多少? |
| attention implementation | Flash / Ring | 是否物化 score?K/V 是 all-gather 还是 ring 流动? |
| 并行组合 | TP × PP × CP × DP | 总 GPU 数如何分解?每个 group 内通信是否放在合适链路上? |

练习目标:看到一个长上下文配置,能先画张量分布图,再画通信边界,最后估算每卡 activation/KV 占用。

## 常见疑问

5 QUESTIONS

### Q1 · Sequence Parallel 和 Context Parallel 是同一个东西吗?

ANS

不是。Sequence Parallel 在 Megatron 语境里通常是 TP 内的 activation memory 优化:把某些 token-wise 激活沿序列维度分给 TP ranks。Context Parallel 更面向长上下文本身:把完整上下文 token 范围切给多卡,再解决 attention 需要全局 K/V 的问题。

一句话:SP 主要省中间激活,CP 主要扩上下文长度。两者可以组合,但心智边界不同。

### Q2 · 有了 FlashAttention,为什么还需要 CP / Ring Attention?

ANS

FlashAttention 解决的是单设备或本地块内 attention 的 IO 问题:避免物化完整 `S×S` score,用 online softmax 分块计算。它不自动把超长上下文切到多设备。

当 S 大到单卡连 Q/K/V、mask、activation 都吃不下时,你需要 CP 把上下文分布到多卡。Ring Attention 可以看作把 FlashAttention 的 blockwise 直觉扩展到多设备环形通信上。

### Q3 · Ring Attention 会改变 attention 结果吗?

ANS

目标是不改变。它通过 blockwise attention 和 online softmax 维护全局归一化统计,让每个 query shard 最终看过所有 key/value block。只要 causal mask、数值精度和归一化处理正确,语义应等价于完整 attention。

工程误差可能来自低精度、mask 边界、block 顺序和通信同步,所以真实实现必须有严格的数值对齐测试。

### Q4 · SP / CP 应该放在哪种通信链路上?

ANS

SP 常和 TP group 绑定,通信频繁,优先放在节点内 NVLink/NVSwitch。CP 的 K/V block exchange 也很重,理想情况下同样放在高速组内;如果跨节点,必须依赖较好的 overlap 和网络带宽。

实际 4D 并行布局通常先把最频繁通信的 TP/SP/CP 放在节点内,把 PP/DP 放到更外层。Day22 会把这些 group 组合起来。

### Q5 · 长序列训练第一优先级应该调什么?

ANS

先确认 attention 是否使用 FlashAttention 或等价的 blockwise kernel,否则 score 矩阵会先炸。然后看 activation 是否是瓶颈:如果是,先开 SP/checkpointing/recompute;如果上下文本身单卡放不下,再上 CP/Ring Attention。

不要把所有并行一次性打开。先建立 baseline,逐个加 SP、CP、checkpointing,每一步记录显存、吞吐、loss 对齐和通信 trace。

## 复盘问题

5 QUESTIONS

1. 给定 `S=131072,B=1,H=8192,BF16`,估算一个 `[S,B,H]` activation 的大小,并说明为什么真实训练会有多份 copies。
2. 画出 Megatron Sequence Parallel 的形状流转:SP 区域 `[S/TP,B,H]`、TP compute 边界 all-gather、输出 reduce-scatter。
3. 用一张表区分 SP 和 CP:目标、切分对象、通信模式、适用场景。
4. 画出 4 rank Ring Attention:每个 rank 本地 Q 不动,K/V block 沿环移动,每一轮做什么计算和通信。
5. 解释为什么 blockwise attention 不能简单把每个 K/V block 的 softmax 输出相加,必须维护 online softmax 的全局统计。

## 今日检查清单

8 ITEMS

- 能解释长序列训练里参数显存和 activation/attention 显存的区别
- 能写出 hidden activation `[S,B,H]` 随 S 线性增长的显存估算
- 能解释 Megatron Sequence Parallel 为什么通常和 Tensor Parallel 配合
- 能说明 SP 使用 all-gather / reduce-scatter 的边界直觉
- 能区分 Sequence Parallel 和 Context Parallel 的目标和切分对象
- 能讲清 Ring Attention 中 Q 本地、K/V 沿环流动的计算流程
- 知道 Ring Attention 需要 blockwise / online softmax 保持全局归一化
- 能把 TP、PP、SP、CP、DP 放进同一张 4D 并行布局图里

## 推荐阅读

5 ITEMS

MUST READ

### Reducing Activation Recomputation in Large Transformer Models

Megatron 团队提出 Sequence Parallel 和 selective activation recomputation 的关键论文。重点看为什么 TP 后仍有 activation replication,以及 SP 如何降低重算需求。

RING

### Ring Attention with Blockwise Transformers

理解 CP / 长上下文 attention 的核心论文之一。重点看 blockwise attention、K/V ring exchange、通信计算 overlap 和 online softmax。

CODE

### haoliuhl/ringattention

Ring Attention 的 JAX 实现参考。先看 README 和核心 API 形状,再回到论文图理解 rank 间 K/V block 如何移动。

MEGATRON

### Megatron-LM sequence\_parallel 配置

结合 Day19 的 Tensor Parallel 配置一起看。关注 `--sequence-parallel` 与 TP size、LayerNorm/Dropout/Residual 激活切分的关系。

NEXT

### 3D / 4D 并行实战

Day22 会把 TP、PP、DP、SP/CP 放到一张 Megatron 配置里,跑通单机多卡小 GPT,并改变 TP/PP size 观察 rank group 变化。

## Day 22 预告

NEXT

COMING NEXT

### 3D / 4D 并行实战 — Megatron-LM 小 GPT

今天我们补齐了序列维度切分。明天把 Day17 的 DP、Day19 的 TP、Day20 的 PP、Day21 的 SP/CP 放到同一个 Megatron 配置里,跑一个单机多卡小 GPT,修改 tensor/pipeline parallel size,观察 rank group、张量形状和通信模式如何变化。

"长上下文不是简单把 max\_seq\_len 调大,而是把每一个 token 的位置、激活和 K/V 都重新分配到集群里。"

DAY 21 · AI INFRA 60-DAY ROADMAP
