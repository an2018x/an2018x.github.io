---
title: "Day 22 · 3D / 4D 并行实战"
date: '2026-06-20'
draft: false
description: "把 Day19-21 的 TP、PP、DP、SP/CP 组合起来,在单机多卡上用 Megatron-LM 跑一个小 GPT,并通过调整 tensor-model-parallel-size 与 pipeline-model-parallel-size 理解并行维度的取舍。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - Megatron-LM
  - Tensor Parallel
  - Pipeline Parallel
  - Training
---

DAY 22 · AI INFRA ROADMAP · 60 DAYS

# 把并行维度 _真正跑起来_

Day 19 学 Tensor Parallel,Day 20 学 Pipeline Parallel,Day 21 进入 Sequence / Context Parallel。 Day 22 的任务是把这些维度放进同一个训练命令里: 在单机多卡上用 **Megatron-LM** 跑一个小 GPT, 并通过调整 `--tensor-model-parallel-size` 与 `--pipeline-model-parallel-size` 观察显存、吞吐、通信和 pipeline bubble 的变化。 今天重点不是追求最高性能,而是让你能读懂 TP×PP×DP 这张分布式坐标表。

**DURATION** 3 h **THEORY** 0.7 h **SETUP** 0.6 h **HANDS-ON** 1.4 h **REVIEW** 0.3 h **STACK** Megatron-LM · TP · PP · DP · CP

## 思维导图

OVERVIEW

> **图：Day 22 3D 4D 并行实战思维导图**
>
> - DAY 22 · 3D / 4D 并行实战
> - TP · PP · DP · SP/CP · MEGATRON-LM
> - 01 · MAP
> - 并行坐标系
> - 02 · SETUP
> - Megatron 环境
> - 03 · RUN
> - 小 GPT 训练
> - 04 · SWEEP
> - TP / PP 实验矩阵
> - 3D = TP×PP×DP
> - 4D = + CP/SP
> - world size 约束
> - rank group 映射
> - clone / install
> - tokenizer files
> - preprocess\_data
> - sanity run
> - 8-layer GPT
> - TP=1 PP=1 baseline
> - TP/PP group 日志
> - loss 下降检查
> - TP=2/4
> - PP=2/4
> - micro-batches
> - tokens/s + memory
> - DELIVERABLES
> - TP×PP×DP 坐标图
> - Megatron 小 GPT 日志
> - TP/PP 对照表
> - 调参结论

FIG · Day 22 全景:把前几天的并行概念放进一个可运行的 Megatron 实验

## 3D / 4D 并行坐标系

35 MIN

先定坐标。这里的 **3D parallelism** 指 `Tensor Parallel × Pipeline Parallel × Data Parallel`。 加上长序列维度后,常见 4D 形态是 `TP × PP × DP × CP`。 Sequence Parallel 通常依附在 TP 组内切 activation 序列维度,不一定让 world size 多乘一个新维度; Context Parallel 则常作为独立的 `context_parallel_size` 进入并行乘积。

| 维度 | 切什么 | 典型通信 | Megatron 参数 |
| --- | --- | --- | --- |
| TP | 单层矩阵和 attention heads | 层内 AllReduce / AllGather / ReduceScatter,高频 | `--tensor-model-parallel-size` |
| PP | Transformer 层深度 | stage 间 send / recv activation,频率低于 TP | `--pipeline-model-parallel-size` |
| DP | 数据 batch | 梯度同步或 ZeRO/FSDP 状态切分 | 由 world size 除以其他并行 size 得出 |
| SP | 序列维度上的 activation | TP 组内 reduce-scatter / all-gather | `--sequence-parallel` |
| CP | 长上下文 attention 的 sequence/context | KV / attention 环形或块通信 | `--context-parallel-size` |

### world size 约束

```
world_size = tensor_model_parallel_size
           * pipeline_model_parallel_size
           * data_parallel_size
           * context_parallel_size # 如果启用 CP

# 单机 8 卡例子
TP=2, PP=2, CP=1 => DP = 8 / (2*2*1) = 2
TP=4, PP=2, CP=1 => DP = 8 / (4*2*1) = 1
TP=2, PP=2, CP=2 => DP = 8 / (2*2*2) = 1
```

合法性 1

### GPU 数必须整除

`world_size % (TP * PP * CP) == 0`。否则 Data Parallel 维度无法构造完整 group。

合法性 2

### head 数要能被 TP 整除

Attention 通常按 head 切。比如 `num_attention_heads=8` 时,TP=2/4/8 合法,TP=3 不合法。

合法性 3

### 层数最好能被 PP 整除

`num_layers=8` 配 PP=2/4 很自然。不能整除时需要更复杂的层分配,今天先避开。

## 单机 8 卡 group 怎么分

25 MIN

假设 `world_size=8`、`TP=2`、`PP=2`、`DP=2`。 一个典型 Megatron rank order 下,TP group 是相邻 rank,PP group 跨 pipeline stage, DP group 是同一 TP/PP 位置上的数据副本。你不需要死背顺序,但必须能看出每个 collective 发生在哪个 group。

> **图：TP PP DP rank group 映射**
>
> - 8 GPUS · TP=2 · PP=2 · DP=2
> - Pipeline stage 0
> - r0 r1
> - r2 r3
> - TP groups: [0,1], [2,3]
> - Pipeline stage 1
> - r4 r5
> - r6 r7
> - TP groups: [4,5], [6,7]
> - PP groups: [0,4], [1,5], [2,6], [3,7]
> - DP groups: [0,2], [1,3], [4,6], [5,7]

FIG · 直觉:TP 在层内横切,PP 沿层深纵切,DP 是相同模型位置上的数据副本

## Megatron-LM 环境准备

35 MIN

Megatron-LM 版本迭代很快,命令细节可能随分支变化。 今天使用的是经典 `pretrain_gpt.py` 教学路径: 先准备一个极小文本数据集,用 Megatron 的预处理脚本生成 indexed dataset, 再用 `torchrun` 或 Megatron 启动脚本跑小 GPT。 如果你的分支提供了新的 recipe 脚本,以仓库 README 和脚本参数为准。

```
# 1. 获取代码。官方仓库包含 Megatron-LM 示例和 Megatron Core
git clone https://github.com/NVIDIA/Megatron-LM.git
cd Megatron-LM

# 2. 安装。官方 README 当前推荐 uv pip install -e .
python -m pip install uv
uv pip install -e .

# 3. 检查 GPU 与 PyTorch
python -

    准备一个 tiny corpus
mkdir -p data/tiny
cat > data/tiny/corpus.jsonl # GPT-2 BPE tokenizer files, used by the classic GPT preprocessing path
wget -O data/tiny/gpt2-vocab.json https://huggingface.co/gpt2/resolve/main/vocab.json
wget -O data/tiny/gpt2-merges.txt https://huggingface.co/gpt2/resolve/main/merges.txt

python tools/preprocess_data.py \
  --input data/tiny/corpus.jsonl \
  --output-prefix data/tiny/gpt_text \
  --tokenizer-type GPT2BPETokenizer \
  --vocab-file data/tiny/gpt2-vocab.json \
  --merge-file data/tiny/gpt2-merges.txt \
  --append-eod \
  --json-keys text

    真实训练要用大数据集。今天的数据只用于 smoke test,目标是验证并行配置、rank group、日志和 checkpoint 流程。
```

## 跑通小 GPT baseline

45 MIN

先跑最简单的 DP-only baseline,确认数据、tokenizer、模型配置和 launcher 都没问题。 下面的模型故意很小:8 层、hidden 512、8 个 attention heads。 这样 TP=1/2/4/8 都能整除 head 数,PP=1/2/4 也能整除层数,方便做实验矩阵。

```
cat > run_tiny_gpt.sh # baseline: TP=1, PP=1, DP=8
GPUS=8 TP=1 PP=1 ./run_tiny_gpt.sh
```

观察日志

### 先确认它真的在训练

看初始化日志里的 tensor/pipeline/data parallel size,再看 loss 是否能稳定打印。tiny corpus 很小,loss 质量不重要,关键是 step 能走完。

记录指标

### 每次实验都记同一组数

记录 step time、tokens/s 或 samples/s、每卡 max memory、NCCL 时间、是否有 pipeline bubble、是否 OOM 或 hang。

## 调整 TP / PP 做实验矩阵

55 MIN

RoadMap 点名要求改 `--tensor-model-parallel-size` 和 `--pipeline-model-parallel-size`。 这一步不要只看能不能跑,要写下你的解释: TP 增大后单层 GEMM 被切小,通信更频繁; PP 增大后每卡层数减少,但 pipeline bubble 和 send/recv 增加。

| 实验 | TP | PP | DP | 预期变化 | 命令 |
| --- | --- | --- | --- | --- | --- |
| A | 1 | 1 | 8 | DP-only baseline,最简单,无 TP/PP 额外通信。 | GPUS=8 TP=1 PP=1 ./run\_tiny\_gpt.sh |
| B | 2 | 1 | 4 | 开始层内切分,每层多 TP collective,单卡模型状态下降。 | GPUS=8 TP=2 PP=1 ./run\_tiny\_gpt.sh |
| C | 4 | 1 | 2 | TP 更重,GEMM 更小,如果没有 NVLink 可能变慢明显。 | GPUS=8 TP=4 PP=1 ./run\_tiny\_gpt.sh |
| D | 2 | 2 | 2 | 3D 并行起步:层内切 + 层深切 + 数据副本。 | GPUS=8 TP=2 PP=2 ./run\_tiny\_gpt.sh |
| E | 1 | 4 | 2 | PP 主导,注意 micro-batch 数是否足够填满流水线。 | GPUS=8 TP=1 PP=4 ./run\_tiny\_gpt.sh |
| F | 2 | 2 | 1 | 4D 可选:加入 CP=2,长序列时更有意义。 | GPUS=8 TP=2 PP=2 CP=2 ./run\_tiny\_gpt.sh |

### 自动跑矩阵并保存日志

```
mkdir -p logs/day22

for cfg in "1 1 1" "2 1 1" "4 1 1" "2 2 1" "1 4 1" "2 2 2"; do
  read -r TP PP CP &1 | tee "logs/day22/${name}.log"
done
```

如果 CP 参数在你的 Megatron 分支不可用,先跳过实验 F。Day22 的必做项是 TP/PP sweep,CP/SP 属于 4D 预演。

## 实验结果怎么分析

35 MIN

这类实战最容易变成"跑了一堆命令,然后不知道学到了什么"。 你要把每次配置拆成三层判断: 模型是否能放下,计算是否仍然高效,通信是否被隐藏。 TP/PP 不是越大越好,更不是卡数越多越好。

显存

### 每卡峰值是否下降

TP 切层内权重和激活,PP 切层数,CP 切长序列上下文。记录每个 rank 的 max memory,不要只看 rank 0。

吞吐

### tokens/s 有没有掉

TP 过大可能让 GEMM 太小,PP 过大可能 bubble 太多。小模型上 TP/PP 变慢很正常,重点是解释原因。

通信

### NCCL 是否变成主角

打开 `NCCL_DEBUG=INFO` 或用 nsys 看 NCCL kernel。TP 通信在层内高频出现,PP 通信更多是 send/recv activation。

PP BUBBLE

### micro-batch 是否足够

PP=4 时至少要有足够 micro-batches 填流水线。用 `global_batch / (micro_batch * DP)` 算 micro-batch 数。

合法性

### shape 是否被整除

heads 要能被 TP 整除,layers 最好能被 PP 整除,global batch 要能被 micro batch 和 DP 组合合理拆分。

DELIVERABLE

### 今天的交付物

一份 `day22_megatron_3d4d.md`:包含 group 坐标图、run 命令、6 组实验日志、指标表、以及你对 TP/PP/CP 取舍的结论。

### 记录模板

```
| config | TP | PP | CP | DP | micro-batches | max mem/rank | step time | tokens/s | 观察 |
|--------|----|----|----|----|---------------|--------------|-----------|----------|------|
| A | 1 | 1 | 1 | 8 | | | | | |
| B | 2 | 1 | 1 | 4 | | | | | |
| C | 4 | 1 | 1 | 2 | | | | | |
| D | 2 | 2 | 1 | 2 | | | | | |
| E | 1 | 4 | 1 | 2 | | | | | |
| F | 2 | 2 | 2 | 1 | | | | | |
```

## 常见疑问

5 QUESTIONS

### Q1 · 3D 并行是不是一定比单独 DDP 更快?

ANS

不一定。3D 并行的第一价值是放下更大的模型,第二才是提高吞吐。小模型用 TP/PP 往往会变慢,因为单卡 GEMM 变小、通信变多、pipeline 有 bubble。

如果 DDP 能放下且吞吐很好,它通常是最简单的 baseline。TP/PP 是为更大模型和更复杂集群准备的工具。

### Q2 · TP 和 PP 都能省显存,为什么还要区分?

ANS

TP 切单层矩阵,每层都会通信,适合高速节点内链路。PP 切层深,stage 间只传 activation,通信频率低,更适合跨节点扩展。

换句话说,TP 解决"单层太宽",PP 解决"模型太深/总层数太多"。大模型常常两个都要。

### Q3 · 为什么 PP=4 时要关心 micro-batch 数?

ANS

Pipeline 要靠 micro-batches 填满流水线。micro-batch 数太少时,很多 stage 会等待前后 stage,出现 bubble。Day20 的近似公式 `(p - 1) / (m + p - 1)` 可以快速估算 bubble fraction。

但 micro-batch 太多会让单个 GEMM 变小,也会增加调度开销,所以需要实测。

### Q4 · Sequence Parallel 和 Context Parallel 都算第 4 维吗?

ANS

严格说要看实现。Megatron 里的 Sequence Parallel 常依附在 Tensor Parallel group 内,用于切 activation 的序列维度,不一定让 world size 多乘一个 size。Context Parallel 更像独立并行维度,通常有自己的 `context_parallel_size`。

学习时可以把 4D 理解为在 TP/PP/DP 之外,再加入长序列维度的切分。真正写配置时,以具体框架的 group 定义为准。

### Q5 · Megatron 命令跑不起来时先查哪里?

ANS

先查四类:参数整除关系,tokenizer/data path,CUDA/NCCL 环境,以及具体分支是否支持对应参数。比如 CP 参数在较旧分支可能不存在,数据路径后缀也容易写错。

建议先用 TP=1、PP=1、GPUS=1 或 2 跑 smoke test,再逐步扩大并行维度。不要一上来就开 4D。

## 复盘问题

6 QUESTIONS

1. 给定 world\_size=8、TP=2、PP=2、CP=1,计算 DP size,并画出 TP group、PP group、DP group。
2. 解释 `--tensor-model-parallel-size` 增大后,单层 GEMM、参数显存和通信频率分别如何变化。
3. 解释 `--pipeline-model-parallel-size` 增大后,每卡层数、activation 通信和 pipeline bubble 分别如何变化。
4. 为什么 `num_attention_heads` 要能被 TP size 整除?为什么 `num_layers` 最好能被 PP size 整除?
5. 用 Day20 的 bubble 公式,比较 PP=2 和 PP=4 在 micro-batches=8 时的 bubble fraction。
6. 从实验 A-F 中选出你认为最合理的一组配置,用显存、吞吐、通信、复杂度四个角度说明理由。

## 今日检查清单

10 ITEMS

- 能解释 3D 并行中的 TP、PP、DP 分别切什么
- 知道 SP 与 CP 在长序列训练中的角色差异
- 能用 world size 公式检查 TP/PP/DP/CP 配置是否合法
- 能安装或至少定位 Megatron-LM 的训练脚本和数据预处理脚本
- 能用 tiny corpus 跑通 Megatron-LM 小 GPT smoke test
- 能修改 `--tensor-model-parallel-size` 并解释日志中的 TP group 变化
- 能修改 `--pipeline-model-parallel-size` 并解释 micro-batch 与 bubble 变化
- 能记录并比较至少 4 组 TP/PP 配置的 step time、显存和日志异常
- 知道小模型上的 TP/PP 变慢不代表并行策略没价值
- 能写出一段自己的配置选择原则,说明什么时候用 TP、PP、DP、CP

## 推荐阅读

5 ITEMS

OFFICIAL

### NVIDIA/Megatron-LM GitHub

Megatron-LM 官方仓库,包含训练脚本、Megatron Core、示例和安装说明。
[github.com · NVIDIA/Megatron-LM](https://github.com/NVIDIA/Megatron-LM)

GUIDE

### Megatron Core Parallelism Guide

NVIDIA 官方并行策略文档,覆盖 TP、PP、DP、CP、EP 等组合。
[docs.nvidia.com · Parallelism Strategies Guide](https://docs.nvidia.com/megatron-core/developer-guide/0.16.0/user-guide/parallelism-guide.html)

PAPER

### Efficient Large-Scale Language Model Training Using Megatron-LM

系统讲 TP、PP、DP 组合和 pipeline schedule 的 Megatron 论文。重点看不同并行组合的吞吐差异。
[arxiv.org · 2104.04473](https://arxiv.org/pdf/2104.04473)

SOURCE

### parallel\_state.py

Megatron Core 中创建 TP/PP/DP/CP process groups 的关键代码。对照日志看 group 构造最有效。
[GitHub · parallel\_state.py](https://github.com/NVIDIA/Megatron-LM/blob/main/megatron/core/parallel_state.py)

NEXT

### DeepSpeed 实战

Day23 会切到 DeepSpeed:ZeRO-3、CPU/NVMe offload、ds\_config.json。今天的 Megatron group 思维会继续派上用场。

## Day 23 预告

NEXT

COMING NEXT

### DeepSpeed 实战 — ZeRO-3 + Offload · ds\_config.json

今天我们用 Megatron 把 TP/PP/DP/CP 的坐标系跑起来。Day23 会回到 DeepSpeed, 用 `ds_config.json` 控制 ZeRO-3、CPU/NVMe offload、bucket、prefetch 和混合精度。 一个偏模型并行,一个偏状态切分,两套工具合起来才是大模型训练工程的主菜单。

"3D 并行不是三个参数相乘,而是让每一种通信都发生在它最合适的地方。"

DAY 22 · AI INFRA 60-DAY ROADMAP
