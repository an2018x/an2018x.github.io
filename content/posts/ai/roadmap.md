---
title: "AI Infra 60 天系统学习路线"
date: '2026-05-14'
draft: false
description: "从 GPU 编程入门到 LLM 训推一体平台：覆盖 CUDA、PyTorch 内部机制、分布式训练、推理引擎、平台调度的全栈 60 天学习路线图。"
toc: true
tags:
  - AI
  - CUDA
  - GPU
  - Infra
  - Roadmap
---

AI INFRA · 60-DAY ROADMAP · FULL STACK

# 从 Prompt 到 _GPU Kernel_ 的六十天

适用于有应用层开发经验、希望系统转向 AI Infra 的工程师。 覆盖 GPU 编程、框架内部机制、分布式训练、推理引擎、平台调度五大板块。 节奏：每天 2–3 小时，理论 1h + 动手 1–2h。 原则—— **先跑通 → 再读代码 → 再读论文 → 再造轮子。**

**TOTAL** 60 Days **PACE** 2–3 h / day **PHASES** 6 **PAPERS** 10 Must-Read **OUTPUT** LLM 训推一体 Demo

## 阶段总览

OVERVIEW

> **图：60 天路线图阶段总览**
>
> - AI INFRA 60-DAY ROADMAP — 6 PHASES
> - PHASE 0
> - 基础与 GPU 编程
> - Day 1 – 7
> - PHASE 1
> - 框架内部机制
> - Day 8 – 14
> - PHASE 2
> - 分布式训练
> - Day 15 – 28
> - PHASE 3
> - 推理与服务化
> - Day 29 – 42
> - PHASE 4
> - 平台与调度
> - Day 43 – 53
> - PHASE 5
> - 综合项目
> - Day 54 – 60
> - KEY DELIVERABLES
> - CUDA kernel
> - mini-autograd
> - Megatron 多卡训练
> - vLLM 推理服务
> - K8s + Prometheus
> - LLM 平台 Demo
> - SKILLS ACQUIRED
> - CUDA
> - PyTorch
> - Profiling
> - NCCL
> - TP/PP
> - ZeRO
> - vLLM
> - 量化
> - K8s
> - 可观测

FIG · 60 天路线总览:从 GPU 编程基础到训推一体平台

## 基础与 GPU 编程入门

DAY 1 – 7

搭建开发环境、理解 GPU 硬件架构、写出第一个 CUDA kernel。 这一周结束时你应该能看懂 `nvidia-smi` 的每一行输出， 并且手写过 vector add 和 tiled GEMM。

**DAY 01 · AI Infra 全景 & 学习环境** — 从 prompt 到 GPU kernel 的完整路径

**DAY 02 · Linux / 容器基础回顾** — cgroups · namespaces · Docker · nvidia-container-toolkit

**DAY 03 · GPU 硬件与体系结构** — SM · Warp · Tensor Core · HBM · L2

**DAY 04 · CUDA 编程入门 (1)** — kernel 启动 · grid/block/thread · vector add · naive GEMM

**DAY 05 · CUDA 编程入门 (2)** — shared memory tiling · bank conflict · tiled GEMM

**DAY 06 · Profiling 工具链** — nsys · ncu · py-spy · torch.profiler

**DAY 07 · 周复盘 + 网络/存储基础** — RDMA · NCCL · NVLink vs PCIe

## 深度学习框架内部机制

DAY 8 – 14

打开 PyTorch 的黑盒——理解 Tensor/Autograd/Dispatcher 的调度路径， 掌握显存管理与混合精度，手写 mini-autograd， 最终理解 `torch.compile` 为什么能加速。

**DAY 08 · PyTorch 核心抽象** — Tensor · Storage · Dispatcher · Autograd Engine

**DAY 09 · Autograd 原理** — 计算图 · 反向传播 · 手写 mini-autograd

**DAY 10 · 算子与后端** — ATen · c10 · CUDA kernel 注册流程

**DAY 11 · 显存管理** — caching allocator · OOM 排查 · 碎片化

**DAY 12 · 混合精度与 AMP** — FP32/FP16/BF16/FP8 · autocast · GradScaler

**DAY 13 · torch.compile / TorchDynamo / Inductor** — 图捕获 · guards · eager vs compile benchmark

**DAY 14 · 周复盘 + 算子融合** — FlashAttention 论文 · IO-aware kernel

## 分布式训练 Infra

DAY 15 – 28

这是最重的两周——从单卡到多机，掌握 DP/TP/PP/ZeRO 四大并行范式， 跑通 Megatron-LM 和 DeepSpeed，理解 MFU/HFU 的计算与优化。

**DAY 15 · 分布式基础** — rank/world\_size · torchrun · AllReduce · DDP MNIST

**DAY 16 · NCCL 深入** — ring/tree 算法 · NCCL\_DEBUG 日志

**DAY 17 · 数据并行 DP/DDP** — 梯度同步 · bucket · overlap

**DAY 18 · ZeRO 系列 (DeepSpeed)** — ZeRO-1/2/3 切分 · 论文精读

**DAY 19 · Tensor Parallel** — Megatron 列并行/行并行 · MLP/Attention 切分图

**DAY 20 · Pipeline Parallel** — GPipe · 1F1B · Interleaved 1F1B · bubble 计算

**DAY 21 · Sequence / Context Parallel** — 长序列训练 · Ring Attention

**DAY 22 · 3D/4D 并行实战** — Megatron-LM 单机多卡训练 GPT

**DAY 23 · DeepSpeed 实战** — ZeRO-3 + Offload · ds\_config.json

**DAY 24 · Checkpoint 与容错** — DCP · 异步保存 · elastic training

**DAY 25 · 数据 Pipeline** — WebDataset · Mosaic Streaming · prefetch

**DAY 26 · 算子层加速** — FlashAttention v2/v3 · xFormers · benchmark MFU

**DAY 27 · 训练性能分析** — MFU/HFU · nsys 分析 compute/comm/bubble

**DAY 28 · 周复盘 + 小项目** — 多卡训 125M GPT · ZeRO-3 vs TP+PP 取舍笔记

## 推理 Infra 与服务化

DAY 29 – 42

从训练转向推理——理解 prefill/decode 两阶段差异， 掌握 PagedAttention、Continuous Batching、量化、Speculative Decoding， 最终部署一个生产级 vLLM 推理服务。

**DAY 29 · LLM 推理基础** — prefill vs decode · KV Cache

**DAY 30 · 解码算法** — greedy · beam · top-k/p · speculative decoding

**DAY 31 · PagedAttention & vLLM** — 论文精读 · block table · copy-on-write

**DAY 32 · vLLM 实战** — 部署 7B 模型 · OpenAI 兼容 API

**DAY 33 · Continuous Batching** — 静态 vs in-flight batching · TGI/vLLM/SGLang 对比

**DAY 34 · SGLang & RadixAttention** — 前缀缓存 · 共享 prefix 调度

**DAY 35 · 量化 (1)：权重量化** — INT8/INT4 · GPTQ · AWQ

**DAY 36 · 量化 (2)：KV Cache 与激活** — FP8 KV · SmoothQuant · per-channel/per-token

**DAY 37 · 推理引擎对比** — TRT-LLM · vLLM · SGLang · lmdeploy · llama.cpp

**DAY 38 · Speculative / Medusa / EAGLE** — 草稿模型 + 验证 · tree attention

**DAY 39 · 长上下文推理** — chunked prefill · prefix caching · disaggregated

**DAY 40 · Serving 层** — 负载均衡 · SSE · prefix-aware routing

**DAY 41 · 性能压测** — TTFT · TPOT · throughput · p50/p99

**DAY 42 · 周复盘 + 推理小项目** — 部署 7B OpenAI API + 性能报告

## 平台化 — 调度、存储、可观测

DAY 43 – 53

把训练和推理搬到 Kubernetes 上——学习 GPU 调度、 数据/模型存储加速、DCGM 监控、故障排查， 理解生产环境中 AI Infra 的运维复杂性。

**DAY 43 · Kubernetes 基础回顾** — Pod · Deployment · nvidia-device-plugin

**DAY 44 · GPU 调度** — gang scheduling · topology-aware · MIG · MPS

**DAY 45 · 训练任务编排** — Kubeflow · Ray · SkyPilot

**DAY 46 · 推理服务编排** — KServe · vLLM Production Stack · HPA

**DAY 47 · 存储 (1) — 训练数据** — S3/OSS · JuiceFS · Fluid · checkpoint 加速

**DAY 48 · 存储 (2) — 模型分发** — P2P · 镜像懒加载 · 大模型加载优化

**DAY 49 · 网络** — RoCE · NCCL 拓扑探测 · IB 配置

**DAY 50 · 可观测 (1)：Metrics** — DCGM Exporter · Prometheus · Grafana

**DAY 51 · 可观测 (2)：Tracing & Logs** — OpenTelemetry · 全链路 trace · loss spike 排查

**DAY 52 · 故障与稳定性** — Xid 错误 · ECC · 慢节点 · 自动重启

**DAY 53 · 周复盘 + 平台小练习** — minikube 跑 vLLM + Prometheus

## 综合项目 + 论文精读 + 复盘

DAY 54 – 60

最后一周把所有学到的串起来——搭一个迷你 LLM 平台， 精读 2 篇核心论文，整理 60 天笔记，选定深耕方向。

**DAY 54 · 综合项目设计** — 训练 + 推理 + 监控 = 迷你 LLM 平台

**DAY 55 · 项目：训练 + Checkpoint** — DeepSpeed/Megatron 微调 1–7B

**DAY 56 · 项目：量化 + 推理部署** — 模型转换 → vLLM 部署

**DAY 57 · 项目：监控 + 压测** — Prometheus 接入 + 性能报告

**DAY 58 · 论文精读 (1)** — Megatron-LM / ZeRO / FlashAttention

**DAY 59 · 论文精读 (2)** — vLLM (PagedAttention) / SGLang (RadixAttention)

**DAY 60 · 总复盘 & 后续路线** — 整理 wiki · 选定深耕方向

DIRECTION 01

### 训练框架研发

Megatron / DeepSpeed 二次开发，设计新的并行策略或优化通信。

DIRECTION 02

### 推理引擎研发

为 vLLM / TRT-LLM 贡献，优化调度器或实现新的量化方案。

DIRECTION 03

### 编译器

Triton / TVM / MLIR，从算子层面优化 GPU 计算效率。

DIRECTION 04

### 平台与调度

K8s + 自研 GPU 调度器，解决大规模集群资源利用率问题。

DIRECTION 05

### 大规模集群运维

万卡稳定性、故障自愈、性能劣化检测、成本优化。

## 关键资源清单

RESOURCES

### 书 / 教程

OFFICIAL

### CUDA C Programming Guide

NVIDIA 官方 CUDA 编程教材，GPU 编程必读。

TEXTBOOK

### Programming Massively Parallel Processors (PMPP)

GPU 并行编程的经典教材，覆盖算法到优化。

BLOG

### ezyang 的 PyTorch internals

深入 PyTorch 内部机制的系列博文，理解 Dispatcher 和 Autograd 的最佳资料。

GUIDE

### HuggingFace Ultra-Scale Playbook

大规模分布式训练的实践指南，从硬件选型到性能调优。

### 必读论文 Top 10

1. **Megatron-LM** — 大模型并行训练的基石，定义了 TP/PP 的标准做法
2. **ZeRO / ZeRO-Infinity** — 显存优化三级切分，DeepSpeed 的核心
3. **GPipe / PipeDream** — Pipeline Parallelism 的两大流派
4. **FlashAttention v1 / v2** — IO-aware attention kernel，改变了 Transformer 训练效率
5. **PagedAttention (vLLM)** — KV Cache 分页管理，推理引擎的里程碑
6. **RadixAttention (SGLang)** — Radix tree 前缀缓存，优化多请求共享前缀
7. **GPTQ / AWQ** — 权重量化的两条主流路线
8. **Speculative Decoding (Google)** — 用小模型草稿 + 大模型验证加速生成
9. **Ring Attention** — 序列并行处理超长上下文
10. **GShard / Switch Transformer** — Mixture-of-Experts 的分布式实现

### 代码仓库（边读边跑）

NVIDIA/Megatron-LMmicrosoft/DeepSpeedvllm-project/vllmsgl-project/sglangDao-AILab/flash-attentionpytorch/pytorch

重点目录：torch/distributed · aten · vllm/engine · megatron/core

### 社区

PyTorch dev-discussvLLM / SGLang Slack知乎「AI Infra」话题HuggingFace 博客

## 学习方法建议

5 PRINCIPLES

01

### 每天写笔记

用 Obsidian / Logseq 建一个 AI-Infra knowledge graph，让知识互相链接。

02

### 代码先跑通再改

永远先 `git clone && 跑 example`，再读源码。不要从论文开始。

03

### 画图

分布式、并行、调度类内容必须自己画一遍。手绘 \> 不画。

04

### Benchmark 习惯

任何"优化"都要有 before/after 数据。没有数据的优化是猜测。

05

### GPU 资源

本地没卡可用 RunPod / Vast.ai / AutoDL 按需租 A100/H100。

"先跑通 → 再读代码 → 再读论文 → 再造轮子"

AI INFRA 60-DAY ROADMAP · FULL STACK: TRAINING + INFERENCE
