---
title: "Day 03 · GPU 硬件与体系结构"
date: '2026-05-15'
draft: false
description: "拆解 GPU 微架构：从 SM、Warp 调度到 Tensor Core，理解 HBM-L2-SMEM 存储层级与算术强度，对比 A100/H100/H20 代际演进。"
toc: true
tags:
  - AI
  - GPU
  - CUDA
  - Hardware
---

DAY 03 · AI INFRA ROADMAP · 60 DAYS

# 走进一颗 GPU 的 _微观世界_

第三天的目标是建立对 GPU 硬件的"物理直觉"—— 搞懂 SM、Warp、Tensor Core 如何协同， 理解 HBM 带宽为什么决定了 LLM 推理的天花板， 并用工具实际观察一颗 GPU 在跑模型时的行为。

**DURATION** 2.5–3 h **THEORY** 1.5 h **HANDS-ON** 1 h **REVIEW** 0.5 h **STACK** NVIDIA GPU · Ampere / Hopper · nvidia-smi · nvtop

## 思维导图

OVERVIEW

> **图：Day 3 思维导图**
>
> - DAY 03 · GPU 硬件与体系结构
> - COMPUTE · MEMORY · INTERCONNECT
> - 01 · COMPUTE
> - SM 与执行模型
> - 02 · MEMORY
> - 存储层级
> - 03 · CONNECT
> - 互联与拓扑
> - 04 · OBSERVE
> - 观察 GPU 行为
> - SM (Streaming Multiprocessor)
> - Warp (32 threads SIMT)
> - Tensor Core (MMA)
> - SM Occupancy
> - HBM (高带宽显存)
> - L2 Cache
> - Shared Memory / L1
> - Register File
> - NVLink 4.0 (900 GB/s)
> - PCIe Gen5 (128 GB/s)
> - NVSwitch (DGX)
> - IB / RoCE 跨机
> - nvidia-smi 详解
> - nvidia-smi topo -m
> - nvtop 实时监控
> - 跑模型时观察
> - DELIVERABLES
> - Day03.md 笔记
> - GPU 架构手绘图
> - GPU 参数速查表
> - 拓扑截图 + 分析

FIG · Day 03 全景:从 SM 微架构到跨机互联 → 用工具验证每个概念

## SM 与执行模型

30 MIN

一颗 GPU 不是一个巨大的计算核心，而是由几十到上百个 _SM (Streaming Multiprocessor)_ 组成的阵列。每个 SM 是一个小型的并行处理器，理解 SM 内部结构是理解 GPU 性能的关键。

> **图：SM 内部微架构 (Hopper)**
>
> - GPU CHIP — H100 SXM · 132 SMs
> - GPU DIE · 80B TRANSISTORS · 814 mm²
> - ONE SM (× 132)
> - WARP SCHEDULERS × 4
> - Scheduler 0
> - Scheduler 1
> - Scheduler 2
> - Scheduler 3
> - FP32 CUDA CORES × 128
> - FP32×32
> - ← 标量 ALU
> - TENSOR CORES × 4 (4TH GEN)
> - TC 0
> - FP16 · FP8 · INT8
> - TC 1
> - TC 2
> - TC 3
> - LOAD/STORE UNITS × 32 + SFU × 16
> - LD/ST × 32 (coalesced access)
> - SFU × 16 (sin/cos)
> - REGISTER FILE · 256 KB
> - 65,536 × 32-bit registers · 每 thread 可用 255 个
> - SHARED MEMORY / L1 CACHE · 228 KB (可配)
> - 程序员可控 · bank 冲突 · tiling GEMM 关键
> - CHIP-LEVEL
> - L2 CACHE
> - 50 MB · 所有 SM 共享
> - HBM3 (高带宽显存)
> - 80 GB · 3.35 TB/s
> - LLM 推理的性能天花板
> - NVLINK 4.0
> - 900 GB/s 双向 · 18 links
> - PCIE GEN5
> - 128 GB/s · CPU↔GPU
> - HIERARCHY
> - GPU Chip
> - GPC (×8)
> - TPC
> - SM (×2 per TPC)
> - SM
> - Warp (32 threads)
> - H100: 8 GPC × ~16 SM = 132 SM

FIG · H100 SM 微架构:4 个 Warp Scheduler · 128 FP32 Cores · 4 Tensor Cores · 228 KB SMEM

CONCEPT 01

### SM — Streaming Multiprocessor

GPU 的基本计算单元。每个 SM 有自己的寄存器、共享内存、调度器。多个 SM 之间 **通过 L2 Cache 和 HBM 共享数据** 。SM 越多，并行能力越强。

CONCEPT 02

### Warp — 32 个线程一起走

GPU 调度的最小单位是 Warp（32 threads）。一个 Warp 内所有线程执行 **同一条指令** （SIMT）。分支发散会导致序列化，效率骤降。

CONCEPT 03

### Tensor Core — 矩阵乘加速器

专门做小矩阵乘（如 16×16×16 MMA）。FP16 算力是 CUDA Core 的 **~16 倍** 。LLM 的 GEMM / Attention 90%+ 的算力来自 Tensor Core。

CONCEPT 04

### SM Occupancy

一个 SM 上"同时驻留的 Warp 数 / 最大可驻留 Warp 数"。occupancy 低 → 无法有效隐藏延迟；过高 → 寄存器/共享内存不够。 **目标不是 100%，而是够用** 。

 关键认知 — SM 是 GPU 上跑代码的地方，Tensor Core 是 LLM 的算力引擎，HBM 是性能天花板

## 存储层级:从寄存器到 HBM

20 MIN

GPU 的存储层级决定了数据能多快送到计算单元。 离 ALU 越近速度越快、容量越小。理解这个金字塔，就理解了为什么 _FlashAttention 要拼命减少 HBM 访问_。

| 层级 | 容量 (H100) | 带宽 | 延迟 | 谁管理 |
| --- | --- | --- | --- | --- |
| Register File | 256 KB / SM | ~20 TB/s (估) | ~1 cycle | 编译器 |
| Shared Memory / L1 | 228 KB / SM | ~19 TB/s (估) | ~20 cycles | 程序员 (显式) |
| L2 Cache | 50 MB (全局) | ~12 TB/s | ~200 cycles | 硬件自动 |
| HBM3 | 80 GB | 3.35 TB/s | ~400 cycles | CUDA malloc |
| Host RAM (CPU) | 512 GB–2 TB | ~0.1 TB/s (PCIe) | ~10K cycles | OS |

WHY THIS MATTERS

### Arithmetic Intensity

= FLOPS / Bytes loaded from HBM。如果一个 kernel 的 AI 低于 GPU 的 "ops:byte 比"（H100 ≈ 989 TFLOPS / 3.35 TB/s ≈ **295 ops/byte** ），那它就是 **memory-bound** ，加更多 SM 也没用。

LLM decode 阶段的 AI ≈ 1–2 ops/byte → 极度 memory-bound

FLASHATTENTION INSIGHT

### IO-Aware Kernel 设计

传统 Attention 把 QKT 写回 HBM 再读回来做 Softmax。FlashAttention 把整个 Attention 融合在 SRAM 里，HBM 访问量从 O(N²) 降到 **O(N)**。这就是"存储金字塔"的工程应用。

## GPU 代际对比

20 MIN

不同 GPU 的"瓶颈"不同。看完这张表，你就能判断： 在你的硬件上，训练是 compute-bound 还是 memory-bound；推理是 HBM 瓶颈还是互联瓶颈。

| 参数 | A100 (80 GB) | H100 SXM | H20 |
| --- | --- | --- | --- |
| 架构 | Ampere (GA100) | Hopper (GH100) | Hopper (GH100, 阉割) |
| SM 数 | 108 | 132 | 78 |
| FP16 Tensor TFLOPS | 312 | 989 | 148 |
| HBM 容量 | 80 GB HBM2e | 80 GB HBM3 | 96 GB HBM3 |
| HBM 带宽 | 2.0 TB/s | 3.35 TB/s | 4.0 TB/s |
| NVLink | 600 GB/s (12 links) | 900 GB/s (18 links) | 900 GB/s |
| Tensor Core 代 | 第 3 代 | 第 4 代 (+ FP8) | 第 4 代 |
| 推理 decode 优势 | 基线 | 1.5× (靠 HBM BW) | 2× (靠 HBM BW) |

 H20 算力弱但 HBM 带宽最大 → 推理 decode 场景性价比高；H100 算力 + 带宽均衡 → 训练首选

## 互联与拓扑

20 MIN

单卡算力有上限，多卡协作靠互联。 NVLink 解决机内通信，InfiniBand / RoCE 解决跨机通信。 互联带宽直接决定了分布式训练的通信开销。

LINK 01

### NVLink

GPU ↔ GPU 的专用高速链路。H100 单方向 450 GB/s（双向 900 GB/s）。同节点 8 卡通过 NVSwitch 实现 **all-to-all 全互联** 。

Tensor Parallel 通信走 NVLink

LINK 02

### PCIe Gen5

CPU ↔ GPU 的通道。x16 = 64 GB/s 双向。用于 host↔device 数据搬运和 NVMe 存储访问。远慢于 NVLink。

DataLoader H2D 传输走 PCIe

LINK 03

### InfiniBand / RoCE

跨机 GPU 通信。IB NDR 400 Gb/s (50 GB/s)。NCCL 的 AllReduce 跨机走 RDMA。RoCE 是以太网上的 RDMA 实现。

Data Parallel 梯度同步走 IB/RoCE

 记住带宽排序:Register \> Shared \> L2 \> HBM \> NVLink \> PCIe \> IB · 每跨一层约 10× 性能下降

## 动手实践

60 MIN · HANDS-ON

### 5.1 · nvidia-smi 详解

逐项读懂 nvidia-smi 输出的每一个字段:

```
# 基础信息
nvidia-smi

# 关键字段解读:
# GPU-Util — 过去 1s 有 kernel 运行的时间占比 (≠ 算力利用率)
# Memory-Usage — 已分配显存 / 总显存 (PyTorch caching allocator 会预分配)
# Temp — 核心温度,持续 > 80°C 可能降频
# Power — 实时功耗 vs TDP
# Perf State — P0 = 最高性能, P8 = 空闲

# 查看详细 GPU 信息
nvidia-smi -q -d MEMORY,UTILIZATION,TEMPERATURE,POWER,CLOCK
```

### 5.2 · 查看 GPU 拓扑

```
# GPU 间互联拓扑
nvidia-smi topo -m

# 输出示例 (DGX A100):
# GPU0 GPU1 GPU2 GPU3 CPU Affinity NUMA
# GPU0 X NV12 NV12 NV12 0-31 0
# GPU1 NV12 X NV12 NV12 0-31 0
# ...
# NV12 = NVLink 12 条, SYS = 跨 NUMA (走 PCIe)

# 查看 NVLink 状态与带宽
nvidia-smi nvlink -s
nvidia-smi nvlink -gt d # 吞吐计数器
```

### 5.3 · nvtop 实时监控

```
# 安装 nvtop (Ubuntu)
sudo apt install nvtop

# 启动实时监控
nvtop

# 在另一个终端跑 Day01 的推理脚本,同时观察:
# — GPU 利用率波形 (prefill 时高, decode 时锯齿)
# — 显存增长曲线 (加载权重 → KV Cache 持续增长)
# — 温度和功耗变化
```

nvtop 比 watch nvidia-smi 好用得多 — 有实时曲线和进程级 GPU 占用

### 5.4 · 边跑模型边观察

在一个终端跑推理，另一个终端观察 GPU 状态:

```
# 终端 1: 跑推理 (用 Day01 的脚本或容器)
python first_infer.py

# 终端 2: 采集 GPU 状态 (每 100ms 一次)
nvidia-smi dmon -s pucm -d 1

# 输出列解读:
# pwr — 功耗 (W)
# gtemp — GPU 温度
# sm — SM 活跃百分比
# mem — 显存控制器活跃百分比 (高 = memory-bound)
# enc/dec — 编解码器利用率 (LLM 不用)
# fb — 已用显存 (MB)
```

观察 01

### Prefill vs Decode 的 SM 利用率差异

Prefill 阶段 SM 利用率高（compute-bound），Decode 阶段 SM 利用率呈锯齿状下降（memory-bound）。用 `nvidia-smi dmon` 的 sm 列可以清楚看到。

观察 02

### Memory Controller 活跃率

`nvidia-smi dmon` 的 mem 列 \> 80% → GPU 在疯狂读 HBM，这就是 memory-bound 的直接证据。Decode 阶段的 mem 往往远高于 sm。

观察 03

### 功耗与温度

满载 H100 约 700W / A100 约 400W。Decode 时功耗通常不到峰值的 50% — 因为 Tensor Core 大部分时间在等 HBM 数据。

记录

### 制作你的 GPU 速查表

把你机器上的 GPU 型号、SM 数、显存、NVLink 拓扑、NUMA 亲和记成一张表。后面做性能分析时 **反复要查** 。

## 自测 · Q&A

6 QUESTIONS

不看答案，能讲清楚下面 6 个问题，Day 03 就算过关。 点击 `+` 展开参考答案。

### Q.01 · SM、Warp、Thread 是什么层级关系？

A.

**GPU Chip → GPC → TPC → SM → Warp → Thread** 。SM 是基本调度单元，Warp（32 threads）是最小执行单位 — 每 cycle SM 的 Warp Scheduler 选一个 ready 的 Warp 发射指令。

程序员定义的是 Thread 和 Block，硬件负责把 Block 分配到 SM 上、把 Block 内的 Thread 分成 Warp。

### Q.02 · 为什么 LLM 推理 decode 阶段是 memory-bound？

A.

Decode 每步只生成 **1 个 token** ，但要读取 **全部模型权重** （7B FP16 = 14 GB）。Arithmetic Intensity ≈ `2 × batch_size / (2 × param_bytes)` ≈ 1–2 ops/byte，远低于 H100 的 295 ops/byte 平衡点。

结论：Tensor Core 算力再多也没用， **HBM 带宽是瓶颈** 。A100→H100 decode 速度提升 ≈ 3.35/2.0 = 1.67×，恰好和 HBM 带宽提升比例吻合。

### Q.03 · Tensor Core 和 CUDA Core 的区别是什么？

A.

**CUDA Core** = 标量 FP32/INT32 ALU，每 cycle 做 1 次 fused multiply-add（2 FLOPS）。适合通用计算。

**Tensor Core** = 矩阵乘加速器（MMA），每 cycle 做一个 `m×n×k` 小矩阵乘（如 16×8×16），FP16 下吞吐是 CUDA Core 的 ~16 倍。

LLM 的 GEMM / Attention 全是矩阵乘 → Tensor Core 贡献 90%+ 算力。 **不用 Tensor Core 的代码，约等于只用了 GPU 6% 的算力。**

### Q.04 · Shared Memory 和 L1 Cache 的关系是什么？

A.

从 Volta 开始，Shared Memory 和 L1 Cache **共享同一块 SRAM** （H100 每 SM 228 KB）。可以通过 API 配置分配比例。

Shared Memory 是 **程序员显式管理** 的（用 ` __shared__ ` 声明），L1 是硬件自动管理的。FlashAttention、tiled GEMM 之所以快，就是因为善用 Shared Memory 减少 HBM 访问。

### Q.05 · NVLink 和 PCIe 在分布式训练中各承担什么角色？

A.

**NVLink** （900 GB/s）→ 机内 GPU↔GPU 通信。Tensor Parallel 的 AllReduce 走 NVLink，延迟 ~μs 级。

**PCIe** （128 GB/s）→ CPU↔GPU 数据搬运。DataLoader 加载数据到 GPU、checkpoint 保存到 NVMe 走 PCIe。

跨机通信走 **InfiniBand/RoCE** （~50 GB/s）。带宽比 NVLink 低 18×，所以分布式训练尽量把 **通信密集的并行维度（TP）放在机内** 。

### Q.06 · nvidia-smi 显示的 GPU-Util 和真实算力利用率的关系？

A.

`GPU-Util` 只表示"过去 1 秒有 kernel 在 SM 上执行"， **不区分 compute-bound 还是 memory-bound** 。

真实算力利用率要看 **MFU** （Model FLOPS Utilization）= 实际 FLOPS / 峰值 FLOPS。LLM 训练 MFU 好的团队做到 50–60%；decode 推理 MFU 通常 \< 5%。

更细粒度用 `nvidia-smi dmon` 的 `sm` 列（SM 活跃率）和 `mem` 列（显存控制器活跃率），或用 Nsight Compute / DCGM 的 `sm __throughput` 和 `dram__ throughput`。

## 今日复盘

30 MIN · REVIEW

在你的笔记本里新建 `Day03.md`，完成以下任务:

1. 画一张 SM 内部结构图:Warp Scheduler → CUDA Core / Tensor Core → Register → Shared Memory。
2. 填写 GPU 存储金字塔:Register → Shared → L2 → HBM → Host，标注每层的容量和带宽量级。
3. 贴上 `nvidia-smi topo -m` 的输出截图，标注哪些 GPU 之间是 NVLink、哪些走 PCIe。
4. 用自己的话解释:为什么 LLM decode 是 memory-bound？HBM 带宽如何决定推理速度？
5. 制作你的 GPU 速查表:型号、SM 数、FP16 TFLOPS、HBM 容量/带宽、NVLink 带宽。

## 完成标准 / Definition of Done

CHECKLIST

- 能口头解释 SM、Warp、Tensor Core 各是什么，以及它们的层级关系
- 能画出 GPU 存储金字塔（Register → Shared → L2 → HBM），并标注量级差异
- 理解 Arithmetic Intensity 和 compute/memory-bound 的判断方法
- 跑过 `nvidia-smi topo -m`，知道自己机器上 GPU 的互联方式
- 用 `nvtop` 或 `nvidia-smi dmon` 观察过推理时的 SM/Memory 活跃率变化
- `Day03.md` 笔记 + GPU 速查表写完

## 阅读推荐

READING LIST

PAPER / WHITEPAPER

### NVIDIA Hopper Architecture Whitepaper

只需读前 3 节（Architecture Overview、SM 结构、Memory Hierarchy）。建议花 30 分钟扫一遍，建立 H100 的硬件心智模型。

PAPER / WHITEPAPER

### NVIDIA Ampere Architecture Whitepaper

如果你用的是 A100 / A10 / RTX 3090，读 Ampere 版本。对比 Hopper 看代际演进 — 重点关注 Tensor Core、HBM、NVLink 的升级。

## 明天预告

DAY 04

DAY 04 · CUDA PROGRAMMING

### CUDA 编程入门 (1)

从今天的"看"到明天的"写" — 理解 kernel 启动、grid/block/thread 模型、global/shared memory。 亲手写 vector add 和 naive 矩阵乘，感受 GPU 并行的力量和陷阱。

 "Understanding the hardware is not optional — _it's the difference between 5% MFU and 50% MFU._"

 AI INFRA · 60 DAYS · DAY 03 OF 60 · [Next: Day 04 →](#)
