---
title: "Day 05 · CUDA 编程入门 (2)"
date: '2026-05-16'
draft: false
description: "用 Shared Memory Tiling 优化矩阵乘：理解 bank conflict 与 coalesced access，实现 tiled GEMM 并用 Nsight Compute 分析性能瓶颈。"
toc: true
tags:
  - AI
  - CUDA
  - GPU
  - Programming
---

DAY 05 · AI INFRA ROADMAP · 60 DAYS

# 用 _Tiling_ 喂饱 GPU

Day 04 的 naive GEMM 比 cuBLAS 慢 50×—— 今天解决这个问题的第一步：用 Shared Memory Tiling 把数据复用率提上去。 理解 coalesced access 和 bank conflict， 然后用 Nsight Compute 量化你的优化效果。

**DURATION** 3–3.5 h **THEORY** 1.5 h **HANDS-ON** 1.5 h **REVIEW** 0.5 h **STACK** CUDA C · Nsight Compute · cuBLAS

## 思维导图

OVERVIEW

> **图：Day 5 思维导图**
>
> - DAY 05 · CUDA 编程入门 (2)
> - TILING · BANK CONFLICT · COALESCED · NCU
> - 01 · TILING
> - Shared Memory Tiling
> - 02 · ACCESS
> - 访存模式
> - 03 · PROFILING
> - Nsight Compute
> - 04 · PRACTICE
> - Tiled GEMM 实战
> - Global → Shared → Register
> - \_\_shared\_\_ 声明 tile
> - \_\_syncthreads() 同步
> - 数据复用率分析
> - Coalesced Access
> - Bank Conflict
> - 32 banks × 4 bytes
> - Padding 消除冲突
> - Occupancy 分析
> - Memory Throughput
> - Compute Throughput
> - Roofline Model
> - tiled\_gemm.cu
> - naive vs tiled 对比
> - ncu 报告分析
> - cuBLAS 基线对比
> - DELIVERABLES
> - tiled\_gemm.cu 通过验证
> - naive vs tiled GFLOPS 对比
> - Nsight Compute 分析报告
> - Bank Conflict 笔记

FIG · Day 05 全景:Shared Memory Tiling → 访存优化 → Nsight Compute 分析

## Shared Memory Tiling

30 MIN

Naive GEMM 的致命问题：每个 thread 计算 C 的一个元素时， 要从 _Global Memory_ 读 K 次 A 和 K 次 B—— 而相邻 thread 读的数据大量重叠。 Tiling 的核心思想：把数据分块搬进 Shared Memory，让整个 Block 的 thread 复用同一份数据。

> **图：Tiled GEMM 原理**
>
> - TILED GEMM — SHARED MEMORY DATA REUSE
> - A [M × K]
> - tile\_A
> - → 沿 K 方向滑动 →
> - B [K × N]
> - tile\_B
> - ↓ 沿 K 方向滑动
> - SHARED MEMORY (per Block)
> - As[T×T]
> - Bs[T×T]
> - ← tile\_A
> - ← tile\_B
> - T = TILE\_SIZE (通常 16 或 32)
> - TILING LOOP (K/T iterations)
> - 1. 从 Global 加载 tile → SMEM
> - 2. \_\_syncthreads()
> - 3. 从 SMEM 计算部分和
> - 4. \_\_syncthreads() → 下一个 tile

FIG · Tiled GEMM:将 A 和 B 的 tile 加载到 Shared Memory，Block 内所有 thread 复用数据

KEY INSIGHT

### 数据复用率

Naive GEMM 每个 thread 读 2K 次 Global Memory。Tiled GEMM 每个 thread 只读 2K/T 次 Global Memory（T = tile size），剩下的从 Shared Memory 读。 **Global 访存量降为 1/T** ，T=16 时即 1/16。

SYNC BARRIER

### \_\_syncthreads()

所有 thread 必须在两个点同步：(1) tile 加载完毕后、计算前；(2) 计算完毕后、加载下一个 tile 前。 **忘加同步 = 数据竞争 = 随机错误结果** ，这是最常见的 tiling bug。

关键选择: TILE\_SIZE 通常取 16 或 32。取 32 时 tile 大小为 32×32×4B = 4KB，两个 tile 共 8KB，远小于 SMEM 容量。

## Coalesced Access 与 Bank Conflict

25 MIN

Tiling 解决了数据复用问题，但还有两个关键的访存陷阱： Global Memory 的 _coalesced access_ 和 Shared Memory 的 _bank conflict_。 不注意这两点，tiling 的加速效果会大打折扣。

| 问题 | 发生在 | 成因 | 后果 | 解决方案 |
| --- | --- | --- | --- | --- |
| Non-coalesced Access | Global Memory | Warp 内 32 个 thread 访问 **不连续** 地址 | 多次 128B 内存事务，带宽浪费 | 保证连续 thread 访问连续地址 |
| Bank Conflict | Shared Memory | 同一 Warp 的多个 thread 访问 **同一 bank** | 串行化，最坏 32× 延迟 | Padding: ` __shared__ float As[T][T+1]` |

COALESCED ACCESS

### Global Memory 合并访问

GPU 的 Global Memory 以 **128 字节** 为粒度读取。Warp 内 32 个 thread 若访问连续 32×4B = 128B 的地址，硬件合并为一次事务。若 thread 0 访问 A[0]、thread 1 访问 A[100]，则需 32 次事务——带宽利用率仅 1/32。

BANK CONFLICT

### Shared Memory Bank 冲突

Shared Memory 被划分为 **32 个 bank** ，每个 bank 宽 4 字节。地址 addr 对应 bank = (addr/4) % 32。同一 Warp 里有两个 thread 访问同一 bank 的不同地址时产生冲突，访问被串行化。广播（同一地址）不算冲突。

PADDING TRICK

### Padding 消除 Bank Conflict

最简单的方法：声明 ` __shared__ float As[T][T+1]`，多加一列。这样每行起始地址偏移一个 bank，列方向访问时 thread 不再落在同一 bank。代价是浪费少量 SMEM，但几乎总是值得的。

RULE OF THUMB

### 访存优化三原则

① Global Memory 读写保证 coalesced。② Shared Memory 声明加 padding。③ 先用 Nsight Compute 测， **不要凭感觉优化** ——很多"明显"的优化方向实际上不是瓶颈。

## Nsight Compute 性能分析

20 MIN

Nsight Compute（`ncu`）是 NVIDIA 的 kernel-level profiler， 能精确量化 occupancy、memory throughput、compute throughput， 告诉你 kernel 是 compute-bound 还是 memory-bound。

| 指标 | 含义 | 关注点 |
| --- | --- | --- |
| Achieved Occupancy | SM 上实际活跃 Warp 数 / 最大可容纳 Warp 数 | 低 occupancy = 延迟无法隐藏 |
| Memory Throughput | 实际内存吞吐 / 理论峰值带宽的百分比 | 接近峰值 → memory-bound |
| Compute Throughput | 实际计算吞吐 / 理论峰值算力的百分比 | 接近峰值 → compute-bound |
| L1/L2 Hit Rate | 缓存命中率 | tiling 后 L1 命中率应显著提升 |
| Shared Memory Bank Conflicts | bank 冲突导致的额外事务数 | \>0 需要检查 padding |

### 常用命令

```
# 基础 profiling — 收集所有指标
ncu --set full -o report ./tiled_gemm

# 只看 memory 相关指标
ncu --metrics l1tex__t_bytes_pipe_lsu_mem_global_op_ld.sum,\
l1tex__t_sectors_pipe_lsu_mem_global_op_ld.sum,\
smsp__sass_average_data_bytes_per_sector_mem_global_op_ld.pct \
./tiled_gemm

# 对比两个 kernel
ncu --set full -o naive ./naive_gemm
ncu --set full -o tiled ./tiled_gemm
# 用 Nsight Compute GUI 打开 .ncu-rep 文件对比

# 看 occupancy 限制因素
ncu --metrics sm__warps_active.avg.pct_of_peak_sustained_active \
./tiled_gemm
```

ROOFLINE

### Roofline Model

Nsight Compute 内置 Roofline 视图。你的 kernel 落在屋顶线的左侧（memory-bound）还是右侧（compute-bound），决定了下一步优化方向。GEMM 在优化前通常是 memory-bound，tiling 的目标就是把它往右推。

TIP

### Occupancy 不是越高越好

高 occupancy 有助于延迟隐藏，但有时降低 occupancy（用更多寄存器或 SMEM per thread）反而能减少 Global Memory 访问，总性能更好。 **目标是 throughput，不是 occupancy。**

## 动手实践 — Tiled GEMM

1.5 H

### Lab — tiled\_gemm.cu

在 Day 04 的 naive GEMM 基础上，加入 Shared Memory tiling。 每个 Block 负责 C 的一个 TILE\_SIZE×TILE\_SIZE 子矩阵， 通过循环加载 A 和 B 的 tile 到 SMEM，计算部分积，最终累加写回。

```
// tiled_gemm.cu — Shared Memory Tiled Matrix Multiply
#define TILE_SIZE 16

__global__ void tiled_gemm(float *A, float *B, float *C,
                            int M, int N, int K) {
    // Block 内的线程坐标
    int tx = threadIdx.x, ty = threadIdx.y;
    // 全局输出坐标
    int row = blockIdx.y * TILE_SIZE + ty;
    int col = blockIdx.x * TILE_SIZE + tx;

    // Shared Memory (padding 消除 bank conflict)
    __shared__ float As[TILE_SIZE][TILE_SIZE + 1];
    __shared__ float Bs[TILE_SIZE][TILE_SIZE + 1];

    float sum = 0.0f;

    // 沿 K 维度分块循环
    for (int t = 0; t // 1. 协作加载 tile 到 SMEM (coalesced!)
        int aCol = t * TILE_SIZE + tx;
        int bRow = t * TILE_SIZE + ty;
        As[ty][tx] = (row 0.0f;
        Bs[ty][tx] = (bRow 0.0f;

        // 2. 同步：确保 tile 加载完毕
        __syncthreads();

        // 3. 从 SMEM 计算部分积
        for (int k = 0; k // 4. 同步：确保计算完毕再加载下一个 tile
        __syncthreads();
    }

    // 写回结果
    if (row // 启动配置
dim3 block(TILE_SIZE, TILE_SIZE); // 16×16 = 256 threads
dim3 grid((N + TILE_SIZE - 1) / TILE_SIZE,
          (M + TILE_SIZE - 1) / TILE_SIZE);
tiled_gemm<<<grid, block>>>(d_A, d_B, d_C, M, N, K);
```

编译运行: nvcc -O2 -o tiled\_gemm tiled\_gemm.cu && ./tiled\_gemm

### 性能对比实验

用 1024×1024 矩阵，分别跑 naive GEMM、tiled GEMM、cuBLAS，记录 GFLOPS。

| 实现 | 典型 GFLOPS (A100) | 相对 cuBLAS | 主要瓶颈 |
| --- | --- | --- | --- |
| Naive GEMM | ~300–500 | ~2–3% | 零数据复用，memory-bound |
| Tiled GEMM (T=16) | ~2000–4000 | ~15–25% | 无 register blocking，低 ILP |
| cuBLAS (sgemm) | ~15000–19000 | 100% | 接近 compute-bound |

BENCHMARK

### GFLOPS 计算公式

GEMM 的浮点操作数 = 2 × M × N × K（每个元素一次乘法一次加法）。**GFLOPS = 2·M·N·K / (time\_ms × 10⁶)**。对比三个版本的 GFLOPS，量化 tiling 带来的加速倍数。

NEXT OPTIMIZATION

### 还差什么？

Tiled GEMM 比 naive 快 5–8×，但仍比 cuBLAS 慢 5–10×。后续优化方向：register blocking（每 thread 算多个元素）、double buffering（load 和 compute 重叠）、向量化 load（`float4`）、warp-level MMA。

用 ncu 对比 naive 和 tiled 的 Memory Throughput：tiling 后 Global Memory 读取量应降为约 1/T。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么需要两次 \_\_syncthreads()？

ANS

第一次同步发生在 tile 加载后、计算前：确保 Block 内所有 thread 都完成了 SMEM 写入，否则其他 thread 可能读到未初始化的值。第二次同步发生在计算后、加载下一个 tile 前：确保所有 thread 都用完了当前 tile 的数据，否则某些 thread 可能提前覆盖 SMEM。 **少一次 sync 都会导致间歇性计算错误** ，这类 bug 极难调试。

### Q2 · TILE\_SIZE 取多大最好？

ANS

**16 或 32** 是最常见的选择。T=16 时每个 Block 256 threads，两个 tile 共用 16×17×4×2 ≈ 2.2KB SMEM。T=32 时 1024 threads，SMEM 用量约 8.5KB。更大的 T 意味着更好的数据复用，但 Block 内 thread 数增多，可能降低 occupancy。实测两个版本，用 ncu 看哪个 throughput 更高。

### Q3 · Padding 为什么能消除 bank conflict？

ANS

Shared Memory 有 32 个 bank，每个 bank 4 字节宽。`float As[16][16]` 的第 0 列全部落在 bank 0（因为行宽 64B = 16×4B 刚好整除 128B = 32 banks）。当 Warp 内 thread 按列读取时，32 个 thread 全访问同一 bank → **32-way conflict** 。声明 `As[16][17]` 后，每行多出 4 字节，列方向的 thread 落在不同 bank，冲突消失。

### Q4 · Tiled GEMM 已经用了 Shared Memory，为什么还比 cuBLAS 慢那么多？

ANS

cuBLAS 在 tiling 之上还做了大量优化：(1) **Register blocking** ——每个 thread 算 C 的 4×4 或 8×8 子块，进一步减少 SMEM 读取；(2) **Double buffering** ——用两份 SMEM 交替，加载下一个 tile 的同时计算当前 tile，hide latency；(3) **向量化 load** （`float4`、`LDG.128`）提高内存吞吐；(4) 使用 **Tensor Core MMA 指令** 。这些是 GEMM 优化博客（Simon Boehm）后续步骤的核心内容。

### Q5 · 如何确认我的 kernel 是 memory-bound 还是 compute-bound？

ANS

在 Nsight Compute 中看 **Roofline** 图：kernel 的点落在斜线（memory-bound 区域）还是水平线（compute-bound 区域）。或者直接看两个百分比：Memory Throughput 接近 100% → memory-bound；Compute Throughput 接近 100% → compute-bound。Naive GEMM 几乎总是 memory-bound，tiled GEMM 开始往 compute-bound 靠拢，cuBLAS 则接近 compute-bound。

## 复盘问题

5 QUESTIONS

1. 画出 Tiled GEMM 的数据流：Global Memory → Shared Memory → Register → 写回 Global Memory，标注 \_\_syncthreads() 的位置。
2. Naive GEMM (1024×1024) 的 Global Memory 读取量是多少字节？Tiled GEMM (T=16) 呢？计算降低比例。
3. 解释为什么 ` __shared__ float As[16][16]` 列方向读取有 bank conflict，而 `As[16][17]` 没有。
4. 你的 tiled GEMM 在 ncu 中的 Achieved Occupancy 是多少？限制因素是什么（registers / shared memory / block size）？
5. 对比你的 naive、tiled、cuBLAS 三个版本的 GFLOPS，tiling 带来了多少倍加速？距离 cuBLAS 还差多少？

## 今日检查清单

7 ITEMS

- 能解释 Shared Memory Tiling 的原理：为什么能减少 Global Memory 访问
- 能说清 coalesced access 的含义，以及 non-coalesced 时的性能后果
- 能解释 bank conflict 的成因，以及 padding 为什么能消除它
- tiled\_gemm.cu 编译通过，结果与 naive GEMM / cuBLAS 一致
- 记录 naive / tiled / cuBLAS 三版本 GFLOPS 对比数据
- 用 Nsight Compute 跑过 tiled GEMM，能读懂 occupancy 和 memory throughput
- 知道 kernel 是 memory-bound 还是 compute-bound，能用 Roofline 判断

## 推荐阅读

3 ITEMS

MUST READ

### How to Optimize a CUDA Matmul Kernel

Simon Boehm 的系列博客，从 naive 到接近 cuBLAS 的逐步优化。今天对应 Kernel 2 (Shared Memory Tiling)。

OFFICIAL

### CUDA C Programming Guide

Chapter 5: Performance Guidelines —— Memory Coalescing、Shared Memory、Occupancy。NVIDIA 关于性能优化的官方建议。

TEXTBOOK

### PMPP Chapter 5–6

Programming Massively Parallel Processors 第 5 章（Tiled Matrix Multiplication）和第 6 章（Performance Considerations），经典教材讲解 tiling。

## Day 06 预告

NEXT

COMING NEXT

### Profiling 工具链

系统学习 GPU profiling 工具链：nsys（系统级 timeline）、ncu（kernel 级分析）、py-spy（Python 性能分析）、torch.profiler（PyTorch 训练分析）。建立"先测量再优化"的工程习惯。

"Shared Memory is the programmer's L1 cache — use it wisely, and the hardware will reward you."

DAY 05 · AI INFRA 60-DAY ROADMAP
