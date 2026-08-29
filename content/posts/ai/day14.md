---
title: "Day 14 · 周复盘 + 算子融合"
date: '2026-06-20'
draft: false
description: "Phase 1 收官:复盘 PyTorch 核心抽象、Autograd、算子后端、显存管理、AMP 与 torch.compile,再用 FlashAttention 拆开算子融合与 IO-aware kernel 的本质。"
toc: true
tags:
  - AI
  - PyTorch
  - CUDA
  - FlashAttention
  - Kernel Fusion
  - Internals
---

DAY 14 · AI INFRA ROADMAP · 60 DAYS

# 把多次搬运 _压成一次_

Day 14 是 Phase 1 的收官日:先把 Day 08–13 的 PyTorch 内部机制串成一张图, 再进入今天的主题—— **算子融合** 。融合不是玄学加速,它解决的是 GPU 上最朴素的问题: 很多深度学习算子不是算不动,而是数据在 HBM 和 SRAM 之间来回搬太多次。 FlashAttention 是最好的入口:它把 attention 从"写出 N×N 注意力矩阵"改成 **分块、在线 softmax、只写最终结果** ,这就是 IO-aware kernel 的核心味道。

**DURATION** 3 h **REVIEW** 0.5 h **THEORY** 1.2 h **HANDS-ON** 1 h **STACK** PyTorch · torch.compile · FlashAttention · CUDA

## 思维导图

OVERVIEW

> **图：Day 14 思维导图**
>
> - DAY 14 · 算子融合
> - REVIEW · FUSION · IO-AWARE · FLASHATTENTION
> - 01 · REVIEW
> - Phase 1 复盘
> - 02 · FUSION
> - 融合为什么快
> - 03 · FLASH
> - FlashAttention
> - 04 · BENCH
> - 实测与判断
> - Tensor / Storage
> - Autograd / Dispatcher
> - Allocator / AMP
> - Dynamo / Inductor
> - 少 launch
> - 少读写 HBM
> - 中间值留寄存器
> - 内存带宽优先
> - 不落盘 S 矩阵
> - online softmax
> - tiling + SRAM
> - 反向重算
> - torch.utils.benchmark
> - eager vs compile
> - SDPA backend
> - profile kernel 数
> - DELIVERABLES
> - Phase 1 复盘图
> - FlashAttention 读书笔记
> - eager / compile benchmark
> - IO-aware 判断清单

FIG · Day 14 全景:先复盘框架内部机制,再把优化视角落到 HBM 读写次数

## Phase 1 复盘

30 MIN

这一周的目标不是背 PyTorch 源码路径,而是建立一条主线: **Python 表达式如何变成 GPU 上的一串 kernel,这些 kernel 又为什么能被编译器合并。** 今天先把这条链路补齐,后面看分布式训练时才不会只盯着 API。

| 天数 | 核心问题 | 你现在应该能说清 |
| --- | --- | --- |
| Day 08 | PyTorch 的 Tensor 到底是什么 | Tensor 是带 shape/stride/dtype/device 的视图,Storage 才持有真实内存;Dispatcher 根据 DispatchKey 把 op 送到 CPU/CUDA/Autograd 等实现。 |
| Day 09 | 为什么 backward 能自动算 | 前向构建动态计算图,每个节点保存 backward 函数和必要中间值;反向按拓扑序执行链式法则并累积梯度。 |
| Day 10 | 一个 op 在 PyTorch 里怎么落地 | `native_functions.yaml` 定义 schema,codegen 生成注册代码,ATen/CUDA kernel 做实际计算,自定义 op 也沿这条路接入。 |
| Day 11 | 显存为什么看起来会丢 | allocated / reserved / non-releasable / nvidia-smi 是不同层视角;caching allocator 用 Segment + Block 复用显存,也会带来碎片。 |
| Day 12 | 混合精度为什么既快又危险 | FP16/BF16/FP8 牺牲数值范围或精度换 Tensor Core 吞吐和显存;autocast 负责 op 级 dtype 选择,GradScaler 防止 FP16 梯度下溢。 |
| Day 13 | `torch.compile` 为什么能加速 | TorchDynamo 捕获 Python 字节码生成 FX 图,guards 保证假设成立,Inductor 把图下沉为融合后的 Triton/C++ kernel。 |

复盘动作:任选一个小模型,从 Python forward 画到 "Dispatcher → Autograd → ATen → CUDA kernel → allocator"。能画出来,Phase 1 就过关。

## 算子融合为什么快

45 MIN

GPU 的峰值 FLOPS 很吓人,但很多模型片段并不是算力瓶颈,而是 **内存带宽瓶颈** 。 对 pointwise / reduction / softmax 这类算子,每多拆一个 kernel, 就可能多一次 HBM 读写、多一次 kernel launch、多一次中间张量分配。 融合的本质是:把中间值留在寄存器或 shared memory 里,不要写回 HBM。

> **图：融合前后 HBM 访问对比**
>
> - KERNEL FUSION — READ / WRITE LESS
> - 融合前:每个 op 一个 kernel
> - x + bias
> - gelu
> - dropout
> - 每一步都读 HBM → 算 → 写 HBM
> - 中间张量占显存,launch 次数多
> - 3 launches · 3 reads · 3 writes
> - 融合后:一个 kernel 内完成
> - fused\_bias\_gelu\_dropout
> - registers / shared memory
> - 只读一次输入,只写一次最终输出
> - 中间值不落 HBM,allocator 压力也变小
> - 1 launch · 1 read · 1 write
> - FUSE

FIG · 融合收益主要来自减少 HBM 交通和 kernel launch,不是凭空减少数学计算

### 三类常见融合

POINTWISE FUSION

### 逐元素链路融合

`y = dropout(gelu(x + bias))` 这类每个元素独立的计算最容易融合。Inductor / XLA / TVM 都很擅长把它们变成一个 kernel。

REDUCTION FUSION

### 归约 + 后处理

LayerNorm / RMSNorm / Softmax 都有 reduction。难点在于跨线程归约、数值稳定和访存布局,但收益更大,因为中间统计量不用反复写回。

EPILOGUE FUSION

### 矩阵乘尾部融合

GEMM 后接 bias / activation / residual add,可以融合进 matmul 的 epilogue。cuBLASLt、CUTLASS、TransformerEngine 都大量使用这种模式。

## FlashAttention 读法

55 MIN

Roadmap 要求今天读一篇 FlashAttention 论文。不要一上来抠每个 CUDA 细节, 先抓住论文最重要的工程判断: **标准 attention 慢,不是因为公式复杂,而是因为把 N×N 的 attention score 和 probability 写进 HBM。** FlashAttention 用 tiling 把 Q/K/V 分块搬进 SRAM,用 online softmax 保持数值稳定,最后只写输出 O。

| 步骤 | 标准 attention | FlashAttention |
| --- | --- | --- |
| Score | 计算 `S = QK^T`,把完整 N×N 矩阵写到 HBM。 | 按 block 计算 `Q_i K_j^T`,score 块只在 SRAM/寄存器中短暂停留。 |
| Softmax | 读回 S,减 max、exp、sum,再把 P 写到 HBM。 | 用 online softmax 维护每行的 max 和归一化因子,跨 block 逐步更新。 |
| Output | 读回 P 和 V,做 `O = PV`,写最终 O。 | 每处理一个 K/V block 就累积 O 的 partial result,最终只把 O 写回 HBM。 |
| Backward | 保存 P/S 等大中间结果,反向直接用。 | 少保存、多重算:反向重算必要 score,用算力换显存和 HBM IO。 |

### online softmax 的最小直觉

softmax 需要每一行的最大值和指数和。分块后,你看不到完整一行,所以要维护两个状态: `m` 表示到目前为止的最大值,`l` 表示按当前最大值缩放后的 exp 和。 新 block 来了以后,如果最大值变大,旧的 `l` 和输出累积量都要乘一个缩放因子, 这样结果和一次性对整行做 softmax 等价。

```
# 伪代码:一行 attention 的 online softmax 直觉,不是可直接运行实现
m = -inf
l = 0
o = 0

for k_block, v_block in blocks(K, V):
    scores = q @ k_block.T
    m_new = max(m, scores.max())
    alpha = exp(m - m_new)
    p = exp(scores - m_new)
    l_new = alpha * l + p.sum()
    o = (alpha * l * o + p @ v_block) / l_new
    m, l = m_new, l_new
```

核心 1

### IO-aware 不是少算

FlashAttention 仍然要做 QK 和 PV 的数学运算,但它显著减少 HBM 读写。对 attention 这种 IO-bound 片段,这比少几行 Python 更关键。

核心 2

### tiling 服务于层级存储

GPU 的寄存器和 SRAM 快但小,HBM 大但慢。tile size 本质是在 occupancy、shared memory 容量、寄存器压力之间找平衡。

核心 3

### 反向选择重算

保存完整 attention matrix 很贵。FlashAttention 反向阶段宁愿重算一部分 score,也不把巨大中间矩阵从 HBM 读回来。

## 动手实验

60 MIN

今天不用手写 FlashAttention kernel。目标是建立工程直觉: 用 benchmark 看出融合减少了 kernel 数和中间张量压力,再用 PyTorch 的 SDPA 路径体验现代 attention backend 的选择。

### 实验 1:eager vs torch.compile 的 pointwise fusion

```
import torch
from torch.utils.benchmark import Timer

torch.manual_seed(0)
device = "cuda"
x = torch.randn(8192, 8192, device=device, dtype=torch.float16)
bias = torch.randn(8192, device=device, dtype=torch.float16)

def eager_fn(x, bias):
    y = x + bias
    y = torch.nn.functional.gelu(y)
    y = y * 0.5 + 0.1
    return y

compiled_fn = torch.compile(eager_fn, mode="max-autotune")

# warmup
for _ in range(10):
    eager_fn(x, bias)
    compiled_fn(x, bias)
torch.cuda.synchronize()

print(Timer(stmt="eager_fn(x, bias)", globals=globals()).blocked_autorange())
print(Timer(stmt="compiled_fn(x, bias)", globals=globals()).blocked_autorange())
```

观察点:第一次 compile 会慢,正式计时前要 warmup。再用 torch.profiler 看 eager 是多个 kernel,compile 后通常变少。

### 实验 2:检查 attention backend

```
import torch
import torch.nn.functional as F

B, H, N, D = 2, 16, 2048, 64
q = torch.randn(B, H, N, D, device="cuda", dtype=torch.float16)
k = torch.randn(B, H, N, D, device="cuda", dtype=torch.float16)
v = torch.randn(B, H, N, D, device="cuda", dtype=torch.float16)

torch.cuda.reset_peak_memory_stats()
out = F.scaled_dot_product_attention(q, k, v, is_causal=True)
torch.cuda.synchronize()
print(out.shape)
print(torch.cuda.max_memory_allocated() / 1024**2, "MiB peak")

# 可选:打开 profiler,看是否走到 flash / efficient attention backend
# with torch.profiler.profile(activities=[torch.profiler.ProfilerActivity.CUDA]) as prof:
# F.scaled_dot_product_attention(q, k, v, is_causal=True)
# print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=20))
```

### 实验 3:估算 attention 的中间矩阵成本

```
def mib(numel, bytes_per_elem=2):
    return numel * bytes_per_elem / 1024**2

for n in [1024, 2048, 4096, 8192, 16384]:
    score = 2 * 16 * n * n
    print(f"N={n:5d} attention score/prob matrix: {mib(score):8.1f} MiB each")
```

DELIVERABLE

### 今天的交付物

一份 `day14_fusion.md`:包含 Phase 1 复盘图、FlashAttention 摘要 + 算法笔记、eager/compile benchmark 表格、profiler 截图或 kernel 列表、以及你自己的 IO-aware 判断清单。

判断标准

### 看到什么才算学会了

不是"compile 后更快"这一个数字,而是能解释为什么快:kernel launch 变少、中间张量变少、HBM 读写下降、或者 SDPA backend 换成了 flash/efficient attention。

## 什么时候该想融合

25 MIN

YES

### 连续 pointwise

bias add、activation、scale、mask、dropout、residual add 连在一起,通常是编译器最喜欢的模式。先试 `torch.compile`。

YES

### 大中间张量

如果某一步会产生巨大临时张量,尤其是 N×N attention score/probability,要优先怀疑 HBM IO,看看是否有 fused kernel 或 flash backend。

MAYBE

### GEMM 后处理

矩阵乘本身通常已经很优化,但 bias/activation/residual 可以融合进 epilogue。优先用 cuBLASLt/CUTLASS/框架已有 fused op。

MAYBE

### 小 batch 推理

小张量场景里 kernel launch 开销占比高,融合可能很有收益。但如果 shape 变化太频繁,compile 的 guard/cache 成本也要算进去。

NO

### 已经是大 GEMM 瓶颈

如果 profile 显示时间几乎都在大型 matmul,pointwise 融合的边际收益有限。此时更该看 Tensor Core、layout、并行策略和通信。

NO

### 语义阻断融合

动态控制流、数据依赖的 Python side effect、shape 每次变、非连续内存布局、外部库黑盒调用,都会让编译器很难安全融合。

## 常见疑问

5 QUESTIONS

### Q1 · 算子融合是不是一定会更快?

ANS

不一定。融合会减少 HBM IO 和 launch,但也可能增加寄存器压力、降低 occupancy、让 kernel 变复杂,甚至影响数值稳定。尤其是把太多逻辑塞进一个 kernel 时,单线程持有的中间值变多,寄存器 spilled 到 local memory 后反而会慢。

经验法则:pointwise 链路通常值得融合;reduction/softmax 要看实现质量;大 GEMM 本体别轻易自己融合,优先用成熟库的 epilogue fusion。

### Q2 · FlashAttention 和普通 torch.compile 融合是什么关系?

ANS

`torch.compile` 是通用图编译器,擅长把普通 PyTorch 图里的可融合模式下沉成更少的 kernel。FlashAttention 是一个为 attention 结构专门设计的算法 + kernel。

两者都在减少内存往返,但层次不同:compile 做的是通用模式识别和代码生成;FlashAttention 是人类理解了 attention 的数学结构后,重写执行顺序,避免 materialize N×N 中间矩阵。

### Q3 · online softmax 为什么不会改变结果?

ANS

因为它维护的是和完整 softmax 等价的两个充分统计量:当前最大值 `m` 和按当前最大值缩放后的 exp 和 `l`。当新 block 的最大值更大时,旧 block 的贡献会乘上 `exp(m_old - m_new)` 重新缩放。

这和数值稳定 softmax 里"先减全局 max"是同一个思想,只是 max 和 sum 是分块逐步更新的。

### Q4 · 为什么 FlashAttention 反向要重算?重算不是浪费吗?

ANS

这是典型的 compute-for-memory trade-off。保存 attention probability 会吃掉 O(N²) 显存和大量 HBM IO;反向时重新算局部 score 虽然多做 FLOPs,但避免了读写巨大中间矩阵。

在现代 GPU 上,attention 这类场景往往更缺带宽和显存,不缺一点额外算力。所以"多算一点、少搬很多"反而更快。

### Q5 · 我应该先学 Triton 还是先读 FlashAttention CUDA 源码?

ANS

先读算法和 IO 模型,再用 Triton 写小 kernel,最后再啃 CUDA 源码。直接读高度优化的 FlashAttention CUDA 模板会被工程细节淹没:模板参数、warp 分工、shared memory swizzle、pipeline stage 会一起扑过来。

今天的目标是建立判断力:看到一个慢 op,能问出"它是不是在反复搬中间张量"。Day 26 的算子层加速再系统进入 Triton/CUTLASS。

## 复盘问题

6 QUESTIONS

1. 画出从 `y = gelu(x + bias)` 到 CUDA kernel 的路径:Tensor / Dispatcher / ATen / Autograd / allocator 分别在哪一步出现?
2. 解释为什么连续 pointwise op 通常是 memory-bound,并用"读几次、写几次"估算融合前后的 HBM 流量。
3. 用自己的话讲清 FlashAttention 为什么不需要把完整 attention score 矩阵写到 HBM。
4. 写出 online softmax 维护的两个状态,并解释当新 block 最大值变大时旧贡献为什么要缩放。
5. 用 profiler 对比 eager 和 compile 后的 kernel 列表:kernel 数量、总 CUDA 时间、显存峰值分别有什么变化?
6. 列出 3 个不适合盲目融合的场景,说明风险是寄存器压力、shape 动态、数值稳定还是语义 side effect。

## 今日检查清单

10 ITEMS

- 能把 Day 08–13 串成一条"Python op → GPU kernel"执行链路
- 能解释 kernel launch 开销和 HBM 读写为什么会成为瓶颈
- 能区分 pointwise fusion、reduction fusion、epilogue fusion 三类模式
- 知道 `torch.compile` 和 Inductor 在算子融合中的位置
- 能用"融合前后读写 HBM 次数"解释一个实际加速案例
- 读完 FlashAttention 摘要和算法部分,能讲清 tiling + online softmax 的主线
- 能说明 FlashAttention 为什么选择反向重算部分中间量
- 跑通 eager vs compile benchmark,记录 warmup 后的稳定结果
- 用 profiler 或日志确认 SDPA 是否走到 flash / efficient attention backend
- 整理出一份自己的 IO-aware kernel 判断清单,作为 Phase 2 训练优化的前置工具

## 推荐阅读

5 ITEMS

MUST READ

### FlashAttention: Fast and Memory-Efficient Exact Attention

今天的主线论文。先读 abstract、introduction、algorithm,重点抓 IO complexity、tiling、online softmax 和 backward recomputation。

OFFICIAL

### PyTorch scaled\_dot\_product\_attention 文档

了解 PyTorch 如何在 math、memory efficient、flash attention backend 之间选择,以及 dtype、mask、causal、dropout 对 backend 的影响。

SOURCE

### flash-attention GitHub 仓库

先看 README 和 benchmark,再看 csrc 目录。不要一开始陷进模板细节,先确认 Python API 如何接到 CUDA extension。

COMPILER

### PyTorch 2.x compile / Inductor 教程

复习 Day 13:FX graph、guards、graph break、Triton codegen。今天的 pointwise fusion benchmark 可以配合官方 tutorial 读。

NEXT

### Triton Tutorials: Vector Add / Fused Softmax

作为 Day 26 的预习材料。Triton 的 fused softmax 教程和今天的 FlashAttention 主题天然衔接,能看到 block-level 编程模型。

## Day 15 预告

NEXT

COMING NEXT

### 分布式基础 — rank / world\_size · torchrun · 集合通信 · DDP MNIST

Phase 1 解决的是单机单卡内"一个 op 怎么跑快"。Day 15 开始进入分布式训练 Infra: 多进程、多 GPU、进程组、rank、AllReduce、Broadcast、ReduceScatter。理解这些通信原语后, DDP、ZeRO、Tensor Parallel 才不再只是配置项。

"GPU 优化的第一性原理很朴素:别让数据在慢内存里来回旅行。"

DAY 14 · AI INFRA 60-DAY ROADMAP
