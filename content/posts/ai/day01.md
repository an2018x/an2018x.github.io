---
title: "Day 01 · AI Infra 全景与学习环境"
date: '2026-05-14'
draft: false
description: "AI Infra 60 天学习计划的起点：梳理从用户 prompt 到 GPU kernel 的完整链路，搭建开发环境，理解推理与训练基础设施的全景图。"
toc: true
tags:
  - AI
  - CUDA
  - GPU
---

DAY 01 · AI INFRA ROADMAP · 60 DAYS

# 从一条 prompt，到一颗 _GPU kernel_

第一天的目标不是写代码，而是建立"全局地图"—— 把 AI Infra 这个庞大的领域拆成四层， 把一次推理的完整链路画在脑子里， 然后跑通你人生第一个 LLM 推理脚本。

**DURATION** 2.5–3 h **THEORY** 1.5 h **HANDS-ON** 1 h **REVIEW** 0.5 h **STACK** Linux · CUDA · PyTorch · HuggingFace

## 思维导图

OVERVIEW

> **图：Day 1 思维导图**
>
> - DAY 01 · AI Infra Overview
> - FOUR PILLARS · ONE PIPELINE
> - 01 · OVERVIEW
> - 全景认知
> - 02 · LIFECYCLE
> - Prompt 生命周期
> - 03 · CONTRAST
> - 训练 vs 推理
> - 04 · HANDS-ON
> - 动手实践
> - 硬件层 GPU/HBM/NVLink
> - 系统层 CUDA / K8s
> - 框架层 PyTorch / vLLM
> - 平台层 MLOps / 网关
> - 网关 鉴权 / 限流
> - 推理引擎 vLLM
> - KV Cache (显存大头)
> - CUDA Kernels
> - 显存构成差异
> - 通信模式
> - 优化目标 MFU vs TTFT
> - 故障容忍策略
> - 环境检查 nvidia-smi
> - 装 PyTorch + HF
> - 跑 0.5B 推理
> - 观察显存 / GPU-Util
> - DELIVERABLES
> - Day01.md 笔记
> - Prompt 链路图
> - first\_infer.py 跑通
> - tokens/s 记录

FIG · Day 01 全景:四个主题 → 一次完整的"画图 + 跑代码"实践

## AI Infra 是什么

30 MIN

AI Infra 不是一个单一的东西，而是一整套支撑 _"让模型在合适的硬件上、以合适的成本、稳定地训练和服务用户"_ 的技术栈。可以把它分成四层。

LAYER 01 · HARDWARE

### 硬件层

GPU (H100 / A100 / H20)、TPU、NPU、NVLink、IB / RoCE 网络、NVMe 存储。解决算力、互联带宽、存储吞吐。

物理决定上限

LAYER 02 · SYSTEM

### 系统层

CUDA / ROCm、NCCL、cuDNN、容器、K8s、调度器。让上层框架能跨机跨卡稳定运行。

连接硬件与框架

LAYER 03 · FRAMEWORK

### 框架层

PyTorch / JAX、Megatron-LM / DeepSpeed、vLLM / TRT-LLM、FlashAttention。训练并行策略 + 推理优化。

本课程主战场

LAYER 04 · PLATFORM

### 平台层

训练平台、推理网关、MLOps、可观测、计费。把以上能力产品化、给业务方用。

面向业务的出口

 Day 01 核心认知 — AI Infra 工程师做的事，本质上就是「把硬件的算力榨干，并且让它稳定、可调度、可观测」

## 一条 prompt 的完整生命周期

30 MIN

请你自己在纸上画下面这条链路 — 这是 Day 01 的核心交付物之一。 边画边问自己:prefill 与 decode 阶段的瓶颈在哪？KV Cache 凭什么能占掉显存大头？

> **图：一条 prompt 的完整生命周期 — vertical pipeline**
>
> - INPUT
> - 用户 Prompt
> - HTTPS · SSE · WebSocket
> - 客户端发起请求
> - 期望流式 token 响应
> - 01 · GATEWAY
> - HTTPS / SSE 网关
> - auth · rate-limit · billing
> - JWT 鉴权 / QPS 限流
> - token 计费
> - 02 · ROUTER
> - 路由层
> - load-balance · prefix-aware
> - least-load 副本调度
> - 前缀缓存命中优化
> - 03 · ENGINE
> - 推理引擎 vLLM / SGLang / TRT-LLM
> - SUB · 01
> - Tokenizer
> - BPE · SP
> - prompt → ids
> - SUB · 02
> - Scheduler
> - continuous
> - batching
> - SUB · 03
> - KV Cache
> - PagedAttn
> - block-table
> - SUB · 04
> - Runner
> - forward call
> - sampling
> - 本课程 阶段 03 主题
> - Day 29 — Day 42
> - ↗ Scheduler + KV Cache
> - 是性能关键路径
> - 04 · RUNTIME
> - PyTorch / Triton
> - graph capture · kernel dispatch
> - torch.compile / Inductor
> - Triton 自定义算子
> - 05 · KERNELS
> - CUDA Kernels
> - GEMM
> - Attention
> - Norm
> - Sampling
> - FlashAttention v2 / v3
> - Tensor Core 占算力 90%+
> - 06 · HARDWARE
> - GPU SM + HBM + NVLink
> - Tensor Core · 989 TFLOPS · 3 TB/s HBM
> - H100 SXM 参考值
> - NVLink 900 GB/s
> - OUTPUT
> - Detokenize → 流式返回 token
> - SSE · token-by-token streaming
> - 前端逐字渲染
> - TTFT 与 TPOT 关键指标

FIG · 一条 prompt 从客户端到 GPU 内核的完整链路 · 8 hops · 关键路径标橙

QUESTION 01

### Prefill vs Decode 的瓶颈

Prefill 阶段一次性算所有 prompt token，是 **compute-bound** ;Decode 阶段一次只生成一个 token，KV Cache 一遍遍读，是 **memory-bound** 。

QUESTION 02

### KV Cache 为什么占显存

每个 token、每层、每个 head 都要存 K 与 V。粗算 7B 模型 4K 上下文 ≈ `2 × 32 × 32 × 128 × 4096 × 2B` 约 2 GB,decode 时还在涨。

## 训练 vs 推理 的关键差异

30 MIN

理解这张表，是后面区分 _阶段 2 训练 Infra_ 和 _阶段 3 推理 Infra_ 的基础。

| 维度 | 训练 (TRAINING) | 推理 (INFERENCE) |
| --- | --- | --- |
| 主要负载 | 长时间 dense 计算 | 突发、多并发短请求 |
| 显存大头 | 参数 + 梯度 + 优化器 + 激活 | 参数 + KV Cache |
| 通信模式 | AllReduce / AllGather (同步密集) | 几乎无跨卡通信 (除 TP) |
| 优化目标 | MFU (算力利用率) | TTFT、TPOT、吞吐、p99 |
| 故障容忍 | checkpoint + 续训 | 单请求重试 |
| 典型框架 | Megatron-LM、DeepSpeed、FSDP | vLLM、SGLang、TRT-LLM |

## 动手实践

60 MIN · HANDS-ON

### 4.1 · 环境检查清单

在你的开发机依次执行，每条命令都要能正常输出:

```
# 1. 操作系统
uname -a # 期望 Linux x86_64,推荐 Ubuntu 22.04
cat /etc/os-release

# 2. GPU & 驱动
nvidia-smi # 看到 GPU 型号、驱动版本、CUDA 版本
nvidia-smi topo -m # 看 GPU 间互联拓扑 (NVLink/PCIe)

# 3. CUDA Toolkit
nvcc --version # 没装就先装,建议 12.x

# 4. Python 环境
python --version # 3.10 / 3.11 都可
```

本地没卡 — AutoDL / RunPod / Vast.ai 按小时租一张 RTX 4090 或 A10,别一上来就烧 H100

### 4.2 · 装 PyTorch + transformers

```
conda create -n aiinfra python=3.10 -y
conda activate aiinfra

# PyTorch (按你的 CUDA 版本选,以 CUDA 12.1 为例)
pip install torch torchvision \
  --index-url https://download.pytorch.org/whl/cu121

# 推理常用库
pip install transformers accelerate sentencepiece
```

### 4.3 · 跑通你的第一个 LLM 推理

选一个 **小模型** (千万别第一次就拉 70B),比如 `Qwen2.5-0.5B-Instruct`:

```
# first_infer.py
import time, torch
from transformers import AutoTokenizer, AutoModelForCausalLM

model_id = "Qwen/Qwen2.5-0.5B-Instruct"
tok = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id, torch_dtype=torch.float16, device_map="cuda"
)

prompt = "用一句话解释什么是 KV Cache。"
inputs = tok(prompt, return_tensors="pt").to("cuda")

torch.cuda.synchronize()
t0 = time.time()
out = model.generate(**inputs, max_new_tokens=128, do_sample=False)
torch.cuda.synchronize()
t1 = time.time()

print(tok.decode(out[0], skip_special_tokens=True))
print(f"耗时 {t1-t0:.2f}s, 生成 {out.shape[1]-inputs.input_ids.shape[1]} tokens")
```

边跑边在另一个终端开 watch -n 0.5 nvidia-smi,观察显存与 SM 利用率

观察 01

### 模型加载占了多少显存？

0.5B FP16 ≈ 1 GB 权重，加上 PyTorch / CUDA 上下文，初始就在 **~1.5–2 GB** 。

观察 02

### 生成时显存又涨了多少？

这就是 **KV Cache** 。每多一个 token，cache 就涨一点。这是后面优化的核心战场。

观察 03

### GPU-Util 抖动正常吗？

正常 — Decode 阶段是 memory-bound，SM 经常空等 HBM 数据回来。这是 _continuous batching_ 存在的理由。

输出指标

### 记下你的 tokens/s

这个数字会陪你走完整个 60 天 — 学完每个章节后回来看，理解优化的复利效应。

## 自测 · Q&A

6 QUESTIONS

不看答案，能讲清楚下面 6 个问题，Day 01 就算过关。 点击 `+` 展开参考答案。

### Q.01 · AI Infra 四层中，框架层和系统层的边界在哪里？

A.

系统层是 **"和模型无关"** 的（CUDA、NCCL、K8s 谁都能用），框架层是 **"为深度学习而生"** 的（PyTorch、Megatron、vLLM）。

判断方法： **能不能用来跑非 ML 的 GPU 任务（渲染、HPC）？** 能 → 系统层；不能 → 框架层。

### Q.02 · 为什么 7B 模型 FP16 推理大约需要 14 GB 显存？

A.

模型参数是显存大头。`7B = 7 × 10⁹` 参数，每个 FP16 占 `2 字节` → `7 × 2 = 14 GB`。

实际还要加 **KV Cache** （与上下文长度成正比）+ CUDA 上下文（~1 GB）+ 中间激活，所以单卡跑 7B FP16 通常需要 **≥ 18 GB** 。

### Q.03 · Prefill 和 Decode 哪个阶段适合用大 batch？

A.

**Prefill** — prefill 是 compute-bound，batch 越大越能用满 Tensor Core，几乎线性加速。

**Decode** 是 memory-bound（要把所有权重再读一遍才生成 1 个 token），batch 加大几乎不增加耗时（除非超出显存）。

这就是 `continuous batching` 的核心动机：把不同请求的 decode 步凑在一起， **amortize 权重读取** 。

### Q.04 · nvidia-smi 显示 GPU-Util 100% 是不是代表 GPU 满负荷？

A.

**不是。** GPU-Util 只表示「过去 1 秒内有 kernel 在跑」，不区分 compute-bound 还是 memory-bound。

真正的"满负荷"要看 `SM Active` / `Tensor Core Active` / `DRAM Throughput`（用 nsys 或 DCGM 看）。

典型例子：LLM decode 时 GPU-Util 100%，但 SM 大部分时间在等 HBM 数据， **Tensor Core 利用率 \< 5%** 。

### Q.05 · 同样 7B 模型，A100 和 H100 的推理性能差距来自哪里？

A.

主要差距在 **HBM 带宽** ，不在算力。A100 ≈ `2 TB/s`，H100 ≈ `3 TB/s`，差 1.5×。

LLM decode 是 memory-bound，时间几乎全花在「读 7 GB 权重」上 → 性能基本 1:1 跟带宽走，所以 H100 decode 吞吐 ≈ A100 × 1.5。

FP16 算力上 A100 312 TFLOPS vs H100 989 TFLOPS（差 3×），但 **只在 prefill 阶段才能体现** 。

### Q.06 · 训练为什么要存「梯度 + 优化器状态」？推理为什么不用？

A.

训练需要反向传播 → **梯度** （每个参数 1 份，FP16 占 2 字节）；用 Adam 优化器还要存一阶矩 + 二阶矩（FP32 各 4 字节）。

所以 7B 模型训练显存 ≈ `参数 14 + 梯度 14 + 优化器 56 + 激活 = 100 GB+`。

这就是为什么训练要 **ZeRO / FSDP 切分** ，而推理只需要参数 + KV Cache。

## 今日复盘

30 MIN · REVIEW

在你的笔记本 (推荐 Obsidian / Logseq) 里新建 `Day01.md`，回答下面 5 个问题:

1. AI Infra 的四层分别是什么？我未来 60 天主要在哪一层工作？
2. 用自己的话描述「一条 prompt 的生命周期」，并贴上你画的那张图。
3. 训练 Infra 和推理 Infra 在「显存构成」上的最大差异是什么？
4. 我的开发机配置:GPU 型号 / 显存 / 驱动 / CUDA / PyTorch 版本。
5. 今天跑 0.5B 模型时，显存占用、生成速度 (tokens/s) 分别是多少？

## 完成标准 / Definition of Done

CHECKLIST

- 能口头讲清楚 AI Infra 的四层划分
- 在纸 / 白板上画出了 prompt → GPU kernel 的完整路径
- `nvidia-smi` 正常输出，CUDA / PyTorch 环境就绪
- 成功跑通至少一次小模型推理，并记录了 tokens/s
- `Day01.md` 笔记写完

## 明天预告

DAY 02

DAY 02 · LINUX & CONTAINERS

### 容器化你的 AI Infra 开发环境

进入 Linux & 容器基础回顾:cgroups、namespaces、numactl、nvidia-container-toolkit。 今天装好的环境，明天会被「容器化」一次 — 写出第一个能跑 CUDA 的 Dockerfile。

 "Premature optimization is the root of all evil — _but knowing where to optimize is wisdom._"

 AI INFRA · 60 DAYS · DAY 01 OF 60 · [Next: Day 02 →](#)
