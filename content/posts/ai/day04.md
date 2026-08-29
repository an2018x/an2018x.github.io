---
title: "Day 04 · CUDA 编程入门 (1)"
date: '2026-05-16'
draft: false
description: "从 Host 到 Device：理解 kernel 启动、Grid/Block/Thread 线程层级与 Global/Shared Memory 存储模型，动手实现 vector add 与 naive GEMM。"
toc: true
tags:
  - AI
  - CUDA
  - GPU
  - Programming
---

DAY 04 · AI INFRA ROADMAP · 60 DAYS

# 写你的第一行 _Kernel_

第四天的目标是跨越 CPU 与 GPU 的边界—— 理解 CUDA 编程模型中 Host/Device 的分工， 掌握 Grid → Block → Thread 的三级线程层级， 亲手写出 vector add 和 naive 矩阵乘。

**DURATION** 3–3.5 h **THEORY** 1.5 h **HANDS-ON** 1.5 h **REVIEW** 0.5 h **STACK** CUDA C · nvcc · NVIDIA GPU

## 思维导图

OVERVIEW

> **图：Day 4 思维导图**
>
> - DAY 04 · CUDA 编程入门 (1)
> - KERNEL · THREAD · MEMORY · CODE
> - 01 · MODEL
> - 编程模型
> - 02 · THREAD
> - 线程层级
> - 03 · MEMORY
> - 存储模型
> - 04 · PRACTICE
> - 动手写代码
> - Host (CPU) / Device (GPU)
> - \_\_global\_\_ / \_\_device\_\_ / \_\_host\_\_
> - kernel\<\<\<grid, block\>\>\>()
> - cudaMalloc / cudaMemcpy
> - Grid (block 的集合)
> - Block (thread 的集合)
> - threadIdx · blockIdx · blockDim
> - Warp (32 threads)
> - Global Memory (HBM)
> - Shared Memory (SMEM)
> - Register (最快)
> - Constant / Texture
> - vector\_add.cu
> - naive\_gemm.cu
> - nvcc 编译 + 运行
> - 对比 cuBLAS 基线
> - DELIVERABLES
> - vector\_add.cu 通过验证
> - naive\_gemm.cu 跑通
> - 线程索引速查笔记
> - GEMM 性能对比记录

FIG · Day 04 全景:从编程模型到动手写 Kernel → 对比 cuBLAS 基线

## CUDA 编程模型

25 MIN

CUDA 程序的核心思想是_异构计算_—— CPU（Host）负责控制流与数据搬运，GPU（Device）负责大规模并行计算。 一个 ` __global__ ` 函数就是一个 _kernel_， 它会被成千上万个线程同时执行。

> **图：Host-Device 执行流程**
>
> - HOST-DEVICE EXECUTION FLOW
> - HOST (CPU)
> - ①
> - cudaMalloc(&d\_a, size)
> - 分配 GPU 内存
> - ②
> - cudaMemcpy(d\_a, h\_a, …, H2D)
> - 拷数据
> - ③
> - kernel\<\<\<grid, block\>\>\>(d\_a, d\_b, d\_c)
> - 启动!
> - ④
> - cudaMemcpy(h\_c, d\_c, …, D2H)
> - 取结果
> - ⑤
> - cudaFree(d\_a)
> - 释放 GPU 内存
> - DEVICE (GPU)
> - GLOBAL MEMORY (HBM)
> - d\_a, d\_b, d\_c — cudaMalloc 分配的数组
> - KERNEL RUNNING · THOUSANDS OF THREADS
> - Block 0
> - Block 1
> - Block 2
> - Block N
> - 每个 Block 内含 128/256/512/1024 个 thread
> - cudaDeviceSynchronize() — 等待所有 thread 完成

FIG · 五步走:分配 → 拷入 → 启动 Kernel → 拷回 → 释放

CONCEPT 01

### Host vs Device

CPU 和其内存称为 **Host** ；GPU 和其显存称为 **Device** 。两者有独立的内存空间，数据必须通过 `cudaMemcpy` 显式搬运。

CONCEPT 02

### Kernel 函数

用 ` __global__ ` 修饰的函数就是 kernel。调用时用 `<<<grid, block>>>` 语法指定线程数量。 **每个线程执行同一份代码** ，但操作不同的数据（SIMT）。

CONCEPT 03

### 函数修饰符

` __global__ ` = Host 调用、Device 执行（kernel）。` __device__ ` = Device 调用、Device 执行。` __host__ ` = Host 调用、Host 执行（默认）。可组合 ` __host__  __device__ `。

CONCEPT 04

### 异步执行

Kernel 启动是异步的——Host 代码不会等 kernel 跑完就继续执行下一行。需要 `cudaDeviceSynchronize()` 来显式同步。

## Grid / Block / Thread 线程层级

25 MIN

CUDA 的线程组织是一个三级嵌套： 一个 _Grid_ 由多个 Block 构成， 每个 _Block_ 由多个 Thread 构成。 每个 thread 通过内置变量算出自己负责处理数据的哪一个元素。

> **图：Grid-Block-Thread 层级**
>
> - CUDA THREAD HIERARCHY
> - GRID (gridDim.x × gridDim.y)
> - BLOCK (0, 0) — blockIdx=(0,0)
> - THREADS (blockDim.x × blockDim.y)
> - t(0,0)
> - t(1,0)
> - t(2,0)
> - t(3,0)
> - …
> - t(7,0)
> - t(0,1)
> - t(1,1)
> - t(0,3)
> - t(7,3)
> - WARP MAPPING
> - 连续 32 个 thread → 1 个 Warp (硬件调度单位)
> - Block(8×4) = 32 threads = 1 Warp
> - 典型配置: 256 threads/block = 8 warps/block
> - BLOCK (1, 0)
> - blockIdx.x = 1
> - blockIdx.y = 0
> - threads …
> - Shared Memory 独立
> - BLOCK (2, 0)
> - blockIdx.x = 2
> - GLOBAL INDEX (1D)
> - int i = blockIdx.x \* blockDim.x + threadIdx.x;

FIG · Grid → Block → Thread:每个 thread 通过内置变量计算全局索引

| 内置变量 | 类型 | 含义 | 典型用法 |
| --- | --- | --- | --- |
| `threadIdx.x` | uint3 | 当前 thread 在 Block 内的索引（0 ~ blockDim.x-1） | 局部索引 |
| `blockIdx.x` | uint3 | 当前 Block 在 Grid 内的索引（0 ~ gridDim.x-1） | Block 编号 |
| `blockDim.x` | dim3 | 每个 Block 中 thread 的数量 | 计算全局索引 |
| `gridDim.x` | dim3 | Grid 中 Block 的数量 | 计算总 thread 数 |

配置建议:blockDim 通常取 128 或 256 (即 4–8 个 warp)，能在大多数 GPU 上获得良好的 occupancy。

## CUDA 存储模型

20 MIN

GPU 的存储层级与 CPU 截然不同—— _Global Memory_ 容量大但延迟高， _Shared Memory_ 延迟低但容量小， 如何编排数据搬运决定了 kernel 性能的上限。

| 存储类型 | 位置 | 容量 | 延迟 | 可见范围 | 声明方式 |
| --- | --- | --- | --- | --- | --- |
| Register | SM 内部 | 256 KB / SM | ~1 cycle | 单个 thread | 自动分配 |
| Shared Memory | SM 内部 | 48–228 KB / SM | ~20–30 cycles | Block 内所有 thread | ` __shared__ ` |
| L1 / L2 Cache | SM / Chip | 128 KB + 50 MB | ~30–200 cycles | 硬件自动管理 | 自动 |
| Global Memory | HBM (片外) | 24–80 GB | ~400–600 cycles | 所有 thread | `cudaMalloc` |
| Constant Memory | Global (缓存) | 64 KB | 缓存命中 ~4 cycles | 所有 thread (只读) | ` __constant__ ` |

KEY INSIGHT

### Coalesced Access

同一个 Warp 里的 32 个 thread 如果访问 **连续的 Global Memory 地址** ，硬件会合并为一次内存事务（128 bytes）。反之， **散乱访问** 会产生多次事务，带宽利用率暴跌。

KEY INSIGHT

### Shared Memory Tiling

把 Global Memory 中的数据先搬到 Shared Memory（tile），然后在 SMEM 中反复使用。 **减少 Global Memory 访问次数** 是优化 CUDA kernel 的第一原则。Day 05 将实现 tiled GEMM。

## 动手实践

1.5 H

### Lab 1 — vector\_add.cu

最经典的入门 kernel——两个数组逐元素相加。 目标是理解「全局索引 = blockIdx.x \* blockDim.x + threadIdx.x」这一核心公式。

```
// vector_add.cu — 你的第一个 CUDA kernel
#include <stdio.h>

__global__ void vector_add(float *a, float *b, float *c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i // 边界检查：总 thread 数可能大于 n
        c[i] = a[i] + b[i];
    }
}

int main() {
    int n = 1 ; // 1M 个元素
    size_t bytes = n * sizeof(float);

    // 1. Host 内存分配 + 初始化
    float *h_a = (float*)malloc(bytes);
    float *h_b = (float*)malloc(bytes);
    float *h_c = (float*)malloc(bytes);
    for (int i = 0; i // 2. Device 内存分配
    float *d_a, *d_b, *d_c;
    cudaMalloc(&d_a, bytes);
    cudaMalloc(&d_b, bytes);
    cudaMalloc(&d_c, bytes);

    // 3. 拷入
    cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, h_b, bytes, cudaMemcpyHostToDevice);

    // 4. 启动 Kernel
    int block_size = 256;
    int grid_size = (n + block_size - 1) / block_size; // 向上取整
    vector_add<<<grid_size, block_size>>>(d_a, d_b, d_c, n);

    // 5. 拷回 + 验证
    cudaMemcpy(h_c, d_c, bytes, cudaMemcpyDeviceToHost);
    for (int i = 0; i if (h_c[i] != 3.0f) { printf("FAIL at %d\n", i); return 1; }
    }
    printf("PASS: all %d elements correct!\n", n);

    // 6. 清理
    cudaFree(d_a); cudaFree(d_b); cudaFree(d_c);
    free(h_a); free(h_b); free(h_c);
    return 0;
}
```

编译运行: nvcc -o vector\_add vector\_add.cu && ./vector\_add

### Lab 2 — naive\_gemm.cu

矩阵乘是深度学习的核心计算。 先写一个 naive 版本：每个 thread 算输出矩阵 C 的一个元素， 理解为什么这种写法性能很差（Day 05 再优化）。

```
// naive_gemm.cu — C[M×N] = A[M×K] × B[K×N]
__global__ void naive_gemm(float *A, float *B, float *C,
                           int M, int N, int K) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;

    if (row float sum = 0.0f;
        for (int k = 0; k // 启动配置 (2D grid + 2D block)
int main() {
    int M = 1024, N = 1024, K = 1024;
    // ... malloc, cudaMalloc, cudaMemcpy 省略 ...

    dim3 block(16, 16); // 16×16 = 256 threads/block
    dim3 grid((N + 15) / 16, (M + 15) / 16);

    naive_gemm<<<grid, block>>>(d_A, d_B, d_C, M, N, K);
    // ... cudaMemcpy D2H, 验证, 计时 ...
}
```

PERFORMANCE

### Naive GEMM 的问题

1024×1024 矩阵乘，naive 实现约 **~1 TFLOPS** 。而同一块 GPU 用 cuBLAS 能跑到 **~50 TFLOPS** (FP32)。差距 50× 来自：无 tiling、无 register blocking、bank conflict、低 occupancy。

BENCHMARK

### 对比 cuBLAS 基线

用 `cublasSgemm` 跑同样的矩阵乘，记录 GFLOPS。计算公式：**GFLOPS = 2·M·N·K / (time\_ms × 10⁶)**。这个基线是 Day 05 优化的目标参考。

### cuBLAS 基线测量

```
// 使用 cuBLAS 做同样的矩阵乘
#include <cublas_v2.h>

cublasHandle_t handle;
cublasCreate(&handle);

float alpha = 1.0f, beta = 0.0f;

// cuBLAS 使用列主序 → 参数顺序注意!
cublasSgemm(handle, CUBLAS_OP_N, CUBLAS_OP_N,
             N, M, K,
             &alpha,
             d_B, N, // B (列主序)
             d_A, K, // A (列主序)
             &beta,
             d_C, N); // C (列主序)

// 编译: nvcc -o gemm gemm.cu -lcublas
```

对比结果记入笔记:naive GEMM 的 GFLOPS vs cuBLAS 的 GFLOPS，差距即为 Day 05 优化空间。

## 常见疑问

6 QUESTIONS

### Q1 · 为什么 kernel 启动要写 \>\>？不能自动决定吗？

ANS

不同问题的 **最优线程配置** 差异很大。1D 数组用 1D grid/block，矩阵用 2D，3D 卷积用 3D。blockDim 影响 occupancy 和 shared memory 用量，gridDim 决定覆盖全部数据需要的 block 数。CUDA 把这个决策权留给程序员，而不是用一个"通用但低效"的默认值。

### Q2 · blockDim 设成多大最好？

ANS

**128 或 256** 是最常见的选择。原因：(1) 必须是 32 的倍数（Warp 大小）；(2) 太小 → occupancy 低，太大 → 寄存器和 shared memory 被稀释。(3) 每个 SM 最多容纳 1536–2048 个 thread，256 意味着每个 SM 可以跑 6–8 个 block，有利于延迟隐藏。实际优化时用 `Nsight Compute` 的 occupancy calculator 来调。

### Q3 · Kernel 里为什么需要 if (i

ANS

Grid 的总 thread 数 = gridDim.x × blockDim.x，它向上取整到 blockDim 的倍数。如果 n = 1000，blockDim = 256，你会启动 4 × 256 = 1024 个 thread。最后 24 个 thread 没有对应数据， **不加边界检查会越界访问 Global Memory** ，导致 illegal memory access 错误。

### Q4 · \_\_global\_\_ 和 \_\_device\_\_ 函数有什么区别？

ANS

` __global__ ` 函数是 kernel 入口， **只能从 Host 调用** （或从另一个 kernel 调用，即 Dynamic Parallelism），返回值必须是 void。` __device__ ` 函数 **只能从 Device 调用** ，可以有返回值，编译器通常会内联它。把公共逻辑提取为 ` __device__ ` 函数可以保持代码整洁。

### Q5 · 为什么 naive GEMM 比 cuBLAS 慢 50 倍？

ANS

Naive 版本的每个 thread 要读 K 次 Global Memory 来计算 C 的一个元素， **数据复用率为 0** 。cuBLAS 使用多级 tiling（global → shared → register）、向量化 load、double buffering、warp-level MMA 指令等技术， **把访存次数降低了几个数量级** 。这也是 Day 05 要学的优化方向。

### Q6 · cudaMalloc 分配的内存和 malloc 分配的有什么不同？

ANS

`malloc` 分配的是 CPU 可访问的 **主机内存（DRAM）** 。`cudaMalloc` 分配的是 GPU 上的 **显存（HBM）** 。两者地址空间隔离，CPU 不能直接 dereference GPU 指针，反之亦然。必须用 `cudaMemcpy` 在两者之间搬数据。CUDA 也提供 Unified Memory（`cudaMallocManaged`）自动迁移，但性能不如手动管理。

## 复盘问题

5 QUESTIONS

1. 画出一个 CUDA 程序的五步生命周期（malloc → memcpy → kernel → memcpy → free），标注 Host/Device 的切换点。
2. 给定 n = 10000，blockDim = 256，计算 gridDim 和总 thread 数，指出有多少个 thread 不做有效计算。
3. 写出 2D 情况下的全局索引公式：row = ? , col = ?
4. 解释 Register、Shared Memory、Global Memory 三者的延迟差距，以及 coalesced access 为什么重要。
5. 运行你的 naive GEMM 和 cuBLAS，记录 GFLOPS 差距，分析 naive 版本的主要瓶颈。

## 今日检查清单

6 ITEMS

- 能说清 Host、Device、Kernel 三个概念，及 \_\_global\_\_ / \_\_device\_\_ / \_\_host\_\_ 的区别
- 能手写 1D 和 2D 的全局索引公式，理解为什么需要边界检查
- vector\_add.cu 编译通过、运行输出 PASS
- naive\_gemm.cu 跑通，结果与 CPU 版本或 cuBLAS 对比正确
- 记录 naive GEMM 与 cuBLAS 的 GFLOPS 对比数据
- 能画出 Register → Shared Memory → Global Memory 的延迟阶梯图

## 推荐阅读

3 ITEMS

OFFICIAL

### CUDA C Programming Guide

Chapter 1–3：Programming Model、Memory Hierarchy、Heterogeneous Programming。NVIDIA 官方教材，CUDA 编程的第一手资料。

TUTORIAL

### An Even Easier Introduction to CUDA

NVIDIA Developer Blog 上的入门文章，用 vector\_add 讲解 CUDA 基本概念，图文并茂，适合第一次接触的读者。

DEEP DIVE

### CUDA Matrix Multiply

Simon Boehm 的 "How to Optimize a CUDA Matmul Kernel for cuBLAS-like Performance" 系列博客，从 naive 到接近 cuBLAS 的逐步优化。

## Day 05 预告

NEXT

COMING NEXT

### CUDA 编程入门 (2) — Shared Memory Tiling

学习 shared memory tiling、bank conflict 规避、coalesced access 模式。实现 tiled GEMM，用 Nsight Compute 分析 occupancy 和 memory throughput，与 cuBLAS 对比性能。

"The key to efficient GPU programming is not doing more work — it is moving less data."

DAY 04 · AI INFRA 60-DAY ROADMAP
