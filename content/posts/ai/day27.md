---
title: "Day 27 · 训练性能分析"
date: '2026-06-20'
draft: false
description: "学习训练性能分析的最小闭环:计算 MFU / HFU,用 Nsight Systems 抓一段训练 step,通过 NVTX、CUDA kernel、NCCL timeline 识别 compute、communication 与 pipeline bubble。"
toc: true
tags:
  - AI
  - PyTorch
  - CUDA
  - Nsight Systems
  - MFU
  - HFU
  - Distributed
  - Performance
---

DAY 27 · AI INFRA ROADMAP · 60 DAYS

# 从训练 step 里读懂 _时间线_

Day 26 关注单个算子是否走到快路径。 Day 27 进入完整训练 step 的性能分析:先用 **MFU / HFU** 把吞吐变成可比较的效率指标, 再用 **Nsight Systems** 抓一小段 step trace,通过 NVTX range、CUDA kernel、NCCL collective 和 CPU runtime 识别三类问题:GPU 正在算什么,通信有没有暴露,以及 bubble 为什么出现。

**DURATION** 3 h **THEORY** 1 h **HANDS-ON** 1.5 h **TOOLS** nsys · NVTX · torchrun **OUTPUT** MFU report · step trace · bottleneck notes

## 思维导图

OVERVIEW

> **图：Day 27 训练性能分析思维导图**
>
> - DAY 27 · Training Performance Analysis
> - MFU · HFU · NSYS · COMPUTE · COMM · BUBBLE
> - 01 · METRIC
> - MFU / HFU
> - 02 · CAPTURE
> - nsys 抓 step
> - 03 · READ
> - 读 timeline
> - 04 · FIX
> - 定位瓶颈
> - tokens/s
> - model FLOPs
> - peak TFLOPS
> - recompute 影响 HFU
> - NVTX 标 step
> - 只抓 3-5 step
> - cuda,nvtx,nccl
> - 生成 nsys-rep
> - GEMM / attention
> - NCCL exposed time
> - CPU launch gaps
> - dataloader stall
> - compute bound
> - comm bound
> - pipeline bubble
> - host overhead
> - DELIVERABLES
> - MFU/HFU 计算表
> - nsys capture 命令
> - trace 阅读笔记
> - 瓶颈分类清单

FIG · Day 27 全景:指标给方向,nsys 给证据,timeline 把瓶颈分成 compute / comm / bubble

## MFU / HFU 先把问题量化

35 MIN

训练性能分析的第一步不是打开 profiler,而是先问: 我现在每秒完成了多少“有用的模型计算”?这就是 MFU 的价值。 HFU 则更接近硬件实际执行了多少 FLOPs,它可能包含 activation recompute 等额外工作。 所以同一段训练里,HFU 可以高于 MFU,但 MFU 更适合比较算法和并行配置是否高效。

MFU = model\_flops\_per\_step / step\_time / (num\_gpus · peak\_flops)

用“理论上完成一次训练 step 所需的模型 FLOPs”除以硬件峰值。它衡量有用模型计算对峰值的利用率。

HFU = actual\_executed\_flops / step\_time / (num\_gpus · peak\_flops)

用 profiler 或框架估计的实际执行 FLOPs。重计算、padding、额外 kernel 都可能让 HFU 上升。

rough\_model\_flops ≈ 6 · params · tokens\_per\_step

decoder-only dense Transformer 的粗估公式。适合快速 sanity check,不适合严谨论文表格。

tokens\_per\_step = global\_batch\_size · seq\_len

不要混淆 micro batch、global batch、gradient accumulation。MFU 分母用所有 GPU 的总峰值。

### 一个可改的 MFU 计算脚本

```
def dense_transformer_mfu(
    *,
    params,
    global_batch_size,
    seq_len,
    step_time_s,
    num_gpus,
    peak_tflops_per_gpu,
):
    tokens = global_batch_size * seq_len
    model_flops = 6 * params * tokens
    achieved_tflops = model_flops / step_time_s / 1e12
    peak_tflops = num_gpus * peak_tflops_per_gpu
    return {
        "tokens_per_step": tokens,
        "achieved_tflops": achieved_tflops,
        "mfu": achieved_tflops / peak_tflops,
    }

report = dense_transformer_mfu(
    params=125_000_000,
    global_batch_size=64,
    seq_len=1024,
    step_time_s=0.42,
    num_gpus=2,
    peak_tflops_per_gpu=312, # 按你的 dtype 和 GPU 峰值填写
)
print(report)
```

| 指标 | 看什么 | 容易踩坑 | 典型用途 |
| --- | --- | --- | --- |
| tokens/s | 端到端吞吐,最贴近训练进度。 | 不同 seq\_len、batch、packing 策略不可直接比较。 | 训练任务排期和成本估算。 |
| TFLOPS | 每秒完成多少 FLOPs。 | FLOPs 估算口径不同会造成数字漂移。 | 单机/多机性能对比。 |
| MFU | 模型有用计算占理论峰值比例。 | 要选对 dtype 峰值,不要用带稀疏的峰值乱除。 | 判断并行策略和训练栈是否高效。 |
| HFU | 硬件实际执行计算占理论峰值比例。 | 重计算会提高 HFU,但不代表训练更快。 | 理解 GPU 是否真的被喂满。 |

MFU 是指南针,不是法官。它告诉你“值得查”,真正的证据来自 profiler timeline。

## 用 NVTX 标出一个 step

25 MIN

Nsight Systems 能抓到 CUDA kernel、NCCL、CPU runtime,但如果没有 NVTX range, timeline 很容易变成一条密密麻麻的 kernel 河。先给训练循环加上 step、forward、backward、 optimizer、dataloader 标签,再抓 trace,后面阅读会轻松很多。

```
import torch
from torch.cuda import nvtx

def train_one_step(model, batch, optimizer):
    nvtx.range_push("forward")
    loss = model(batch).loss
    nvtx.range_pop()

    nvtx.range_push("backward")
    loss.backward()
    nvtx.range_pop()

    nvtx.range_push("optimizer")
    optimizer.step()
    optimizer.zero_grad(set_to_none=True)
    nvtx.range_pop()
    return loss

for step, batch in enumerate(loader):
    if step == 10:
        torch.cuda.cudart().cudaProfilerStart()

    nvtx.range_push(f"train_step_{step:04d}")
    loss = train_one_step(model, batch, optimizer)
    nvtx.range_pop()

    if step == 14:
        torch.cuda.cudart().cudaProfilerStop()
        break
```

只抓稳态

### 跳过 warmup

编译、缓存、dataloader 预热、CUDA context 初始化都会污染前几个 step。先跑 10-20 step,再抓 3-5 step。

只抓少量

### trace 越短越好读

Nsight Systems 不是日志归档工具。抓太久会生成巨大文件,也更难找到单个 step 的节奏。

每 rank 都要想清楚

### 分布式 trace 很吵

多卡时可以先抓 rank 0 和一个慢 rank。若怀疑 pipeline bubble,需要抓多个 PP stage 对齐看。

## nsys 抓一段训练 step

40 MIN

Nsight Systems 的 CLI 适合在训练机器上直接采集, 生成 `.nsys-rep` 后再用 GUI 打开。 Day27 的目标不是学会所有选项,而是能稳定抓到一段带 NVTX 的训练 step, 并用它回答“时间花在哪里”。

### 单进程最小命令

```
nsys profile \
  --trace=cuda,nvtx,osrt,cublas,cudnn \
  --sample=none \
  --capture-range=cudaProfilerApi \
  --capture-range-end=stop \
  --force-overwrite=true \
  --output=trace_step \
  python train.py
```

### torchrun 多卡命令

```
nsys profile \
  --trace=cuda,nvtx,osrt,cublas,cudnn,nccl \
  --sample=none \
  --capture-range=cudaProfilerApi \
  --capture-range-end=stop \
  --force-overwrite=true \
  --output=trace_rank%q{RANK} \
  torchrun --nproc_per_node=8 train.py
```

### 先用 stats 做文本摘要

```
# 查看当前 nsys 支持哪些 report 名称
nsys stats --help-reports

# 常用摘要:GPU kernel、CUDA API、内存拷贝、NVTX range
nsys stats \
  --report cuda_gpu_kern_sum,cuda_api_sum,cuda_gpu_mem_time_sum,nvtx_sum \
  trace_step.nsys-rep
```

如果不同版本的 nsys report 名称略有差异,先跑 `nsys stats --help-reports` 再选择可用 report。

## 读 timeline:compute / comm / bubble

45 MIN

打开 trace 后,先不要盯着某个 kernel 名字。 从 step 的宏观节奏看:GPU rows 有没有长空白?NCCL 是否和 backward 重叠? GEMM/attention kernel 是否连续?CPU 是否频繁阻塞在同步 API? 这些形态比单个数字更能说明瓶颈。

> **图：训练 step timeline 分析示意**
>
> - ONE TRAINING STEP TIMELINE
> - GPU compute
> - GEMM/ATTN
> - MLP GEMM
> - NCCL comm
> - all\_reduce
> - all\_gather
> - CPU launch
> - idle gap
> - bubble
> - GPU 空白:等通信、等 CPU、等数据或 pipeline stage
> - 核心阅读动作:先看空白和重叠,再看最长 kernel 和最长 collective

FIG · timeline 先分形态:连续计算、暴露通信、GPU 空白、CPU launch 断裂

| 形态 | trace 里怎么看 | 可能原因 | 下一步动作 |
| --- | --- | --- | --- |
| Compute bound | GPU kernel 连续,主要是 GEMM、attention、fused MLP,空白很少。 | 模型计算本身占主导,算子或 shape 还可优化。 | 看 Day26 的 attention/fusion,检查 Tensor Core dtype 和 kernel 选择。 |
| Communication bound | NCCL collective 很长,并且没有被 backward compute 覆盖。 | TP/DP/PP/CP 配置不平衡,网络慢,bucket 太大或太小。 | 调 bucket、overlap、并行维度和拓扑映射,看 NCCL 日志。 |
| Pipeline bubble | PP stage 之间有规律空白,前后 stage 等待 microbatch。 | microbatch 数太少,stage 切分不均,1F1B 调度不充分。 | 增加 microbatch、均衡 layers、评估 interleaved pipeline。 |
| Host overhead | CUDA API 间隔大,CPU 线程忙于 Python、dataloader 或同步。 | DataLoader 慢,Python 控制流碎,频繁 `item()` 或同步。 | 加 dataloader NVTX,移除同步,预取数据,减少小 kernel。 |

## 一个完整分析流程

30 MIN

### 记录基线

保存 batch、seq\_len、dtype、GPU、并行配置、step time、tokens/s、显存峰值。

### 计算 MFU

先粗算是否明显偏低。若 MFU 很低,继续抓 trace;若很高,先确认峰值口径。

### 打 NVTX

给 dataloader、forward、backward、optimizer、checkpoint、step 加 range。

### 采集稳态 step

跳过 warmup,只抓 3-5 个 step,避免 trace 文件过大。

### 先看空白

GPU 空白通常比最长 kernel 更重要,它说明硬件正在等待。

### 形成假设

把瓶颈归类成 compute、comm、bubble、host/data,每次只改一个变量。

### 报告模板

```
experiment: gpt-125m-baseline
hardware: 2x A100-80GB, nvlink, bf16 peak=312 TFLOPS/GPU
config: layers=12, hidden=768, heads=12, seq=1024, global_batch=64
parallel: dp=2, tp=1, pp=1, activation_checkpoint=off

throughput:
  step_time_median: 0.420 s
  tokens_per_step: 65536
  tokens_per_second: 156038
  estimated_mfu: 18.8%

nsys:
  captured_steps: 10-14
  top_kernel: ampere_bf16_s16816gemm...
  top_collective: ncclKernel_AllReduce_RING_LL
  visible_bubble: 6.4 ms / step
  suspected_bottleneck: host dataloader gap before forward

next_action:
  add NVTX around dataloader prefetch
  increase num_workers / persistent_workers
  rerun same 5-step capture
```

## 常见疑问

FAQ

### Q1 · MFU 低一定说明 GPU 没吃满吗?

A

不一定。MFU 低可能是 GPU 空闲,也可能是模型 FLOPs 估算偏保守、峰值选错、或者实际做了很多 MFU 不计入的工作。先用 MFU 发现异常,再用 nsys 判断原因。

### Q2 · 为什么 HFU 可能高于 MFU?

A

因为 HFU 更接近硬件实际执行计算。例如 activation checkpoint 会在 backward 重算 forward,这会增加实际 FLOPs。硬件更忙了,但同样训练进度下有用模型 FLOPs 没变,所以 MFU 不一定提高。

### Q3 · nsys 和 PyTorch profiler 该用哪个?

A

PyTorch profiler 更贴近 PyTorch op 和模块层级;Nsight Systems 更适合看系统级时间线、CUDA API、NCCL、CPU/GPU overlap。Day27 重点是分布式训练 step,优先用 nsys 建立全局视角。

### Q4 · 只抓 rank 0 够不够?

A

单纯数据并行时通常可以先看 rank 0。若有 pipeline parallel、tensor parallel、context parallel,或者怀疑某个 rank straggler,需要至少抓一个慢 rank 和相邻 stage,否则容易漏掉等待关系。

## 复盘问题

REVIEW

1. MFU 和 HFU 的分子分别是什么?为什么 activation recompute 会影响二者关系?
2. 计算 MFU 时,为什么必须写清 GPU 型号、dtype 峰值和是否使用稀疏峰值?
3. 为什么 nsys trace 应该跳过 warmup,并且只抓少量 step?
4. 在 timeline 里,如何区分暴露通信和已经与 backward 重叠的通信?
5. 看到 GPU 中间有一段空白,你会按什么顺序排查 dataloader、CPU sync、pipeline bubble 和 NCCL?

## 今日检查清单

CHECKLIST

- 能用 tokens/s、参数量、step time 和 GPU 峰值粗算 MFU。
- 能解释 MFU 与 HFU 的差异,并说明 activation checkpoint 对 HFU 的影响。
- 能给训练循环加 NVTX range,让 step/forward/backward/optimizer 在 trace 里可见。
- 能用 `nsys profile` 抓一段 3-5 step 的稳态训练 trace。
- 能用 `nsys stats` 导出 kernel、CUDA API、NVTX 的文本摘要。
- 能从 timeline 中把瓶颈初步归类为 compute、comm、bubble 或 host/data overhead。

## 推荐阅读

LINKS

Nsight Systems

### [NVIDIA Nsight Systems User Guide](https://docs.nvidia.com/nsight-systems/UserGuide/index.html)

官方用户指南。重点看 CLI 采集、timeline 视图和统计报告。

Nsight Systems

### [NVIDIA Nsight Systems 产品页](https://developer.nvidia.com/nsight-systems)

了解 Nsight Systems 的定位:用 timeline 检测、理解和解决系统级性能问题。

Megatron

### [NVIDIA Megatron-LM](https://github.com/NVIDIA/Megatron-LM)

大型 Transformer 训练系统参考。README 中包含当前性能基准和 MFU 语境。

DeepSpeed

### [DeepSpeed Flops Profiler](https://www.deepspeed.ai/tutorials/flops-profiler/)

用于理解 FLOPs、latency 和模块级性能报告的工具参考。

## Day 28 预告

NEXT

周复盘 + 小项目

### 在 2 卡或云上 8 卡训练一个约 125M GPT

下一天会把 Day19-27 串起来:选择并行策略,准备数据 pipeline, 训练一个小 GPT,记录吞吐和 MFU,再写一篇笔记比较 ZeRO-3 与 TP+PP 在当前硬件上的取舍。

性能分析不是找一个神奇开关,而是把时间线拆开,让每一段等待都说清楚自己在等什么。

DAY 27 · TRAINING PERFORMANCE ANALYSIS · AI INFRA ROADMAP
