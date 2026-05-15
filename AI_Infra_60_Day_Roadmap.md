# AI Infra 60 天系统学习路线（全栈：训练 + 推理）

> 适用对象：有应用层开发经验（熟悉 Python / 后端），希望系统转向 AI Infra
> 节奏：每天 2–3 小时（理论 1h + 动手 1–2h）
> 周末可作为缓冲 / 项目日，遇到难点允许顺延
> 学习原则：**先跑通 → 再读代码 → 再读论文 → 再造轮子**

---

## 阶段总览

| 阶段 | 天数 | 主题 | 产出 |
|------|------|------|------|
| 阶段 0 | Day 1–7   | 基础设施与 GPU 编程入门 | 跑通 nvidia-smi / nsys / 第一个 CUDA kernel |
| 阶段 1 | Day 8–14  | 深度学习框架内部机制 | 手写 mini-autograd，读懂 PyTorch 调度 |
| 阶段 2 | Day 15–28 | 分布式训练 Infra | 跑通 Megatron / DeepSpeed 多机训练 |
| 阶段 3 | Day 29–42 | 推理 Infra 与服务化 | 部署 vLLM，理解 PagedAttention |
| 阶段 4 | Day 43–53 | 平台化：调度、存储、可观测 | 在 K8s 上拉起 GPU 训练/推理任务 |
| 阶段 5 | Day 54–60 | 综合项目 + 论文精读 + 复盘 | 一个端到端的 LLM 训推一体 demo |

---

## 阶段 0：基础与 GPU 编程入门（Day 1–7）

### Day 1 — AI Infra 全景 & 学习环境
- 阅读：黄仁勋 GTC 演讲 / 知乎「AI Infra 是什么」综述 2–3 篇
- 画一张图：从一条 prompt 到 GPU kernel 的完整路径
- 配好开发环境：Linux (Ubuntu 22)、CUDA Toolkit、conda、VSCode Remote

### Day 2 — Linux / 容器基础回顾
- cgroups、namespaces、`/proc`、`numactl`、`taskset`
- Docker：镜像分层、`--gpus all`、`nvidia-container-toolkit`
- 动手：写一个带 CUDA 的 Dockerfile 并运行 `nvidia-smi`

### Day 3 — GPU 硬件与体系结构
- 概念：SM、Warp、Tensor Core、HBM、L2、SM occupancy
- 阅读：NVIDIA Ampere / Hopper Whitepaper 的前几节
- 动手：用 `nvidia-smi`、`nvidia-smi topo -m`、`nvtop` 观察设备

### Day 4 — CUDA 编程入门 (1)
- 内核启动、grid/block/thread、global/shared memory
- 写：vector add、矩阵乘 v1（naive）
- 教材：《CUDA C Programming Guide》Ch.1–3

### Day 5 — CUDA 编程入门 (2)
- shared memory tiling、bank conflict、coalesced access
- 写：tiled GEMM，对比 cuBLAS 的性能
- 工具：Nsight Compute 看 occupancy / memory throughput

### Day 6 — Profiling 工具链
- `nsys profile`、`ncu`、`py-spy`、`torch.profiler`
- 动手：profile 一段 PyTorch 训练，找出最耗时 kernel

### Day 7 — 周复盘 + 网络/存储基础速览
- RDMA / NCCL / IB / RoCE 概念
- NVLink vs PCIe 带宽对比
- 写一份「GPU 服务器拓扑速查表」放进笔记

---

## 阶段 1：深度学习框架内部机制（Day 8–14）

### Day 8 — PyTorch 核心抽象
- Tensor、Storage、Dispatcher、Autograd Engine
- 阅读：PyTorch internals (ezyang 博客)

### Day 9 — Autograd 原理
- 计算图、反向传播、`backward()` 调度
- 动手：用 numpy 实现一个支持加/乘/matmul 的 mini-autograd

### Day 10 — 算子与后端
- ATen、c10、CUDA kernel 注册流程
- 阅读 1–2 个简单 op（如 `add`、`relu`）的源码

### Day 11 — 显存管理
- caching allocator、`torch.cuda.memory_summary()`
- OOM 排查、`max_split_size_mb`、内存碎片化

### Day 12 — 混合精度与 AMP
- FP32 / FP16 / BF16 / FP8 数值范围与溢出
- `torch.autocast`、GradScaler 原理

### Day 13 — torch.compile / TorchDynamo / Inductor
- 图捕获（FX）、guards、fallback
- 动手：对一个小模型 benchmark eager vs compile

### Day 14 — 周复盘 + 算子融合
- 阅读一篇 FlashAttention 论文（先看摘要 + 算法部分）
- 理解 IO-aware kernel 设计思想

---

## 阶段 2：分布式训练 Infra（Day 15–28）

### Day 15 — 分布式基础
- 进程组、rank/world_size、`torchrun`
- 集合通信：AllReduce、AllGather、ReduceScatter、Broadcast
- 动手：跑一个 DDP MNIST

### Day 16 — NCCL 深入
- ring、tree、双二叉树算法
- `NCCL_DEBUG=INFO`，看一次 AllReduce 的完整 log

### Day 17 — 数据并行 (DP/DDP)
- 梯度同步时机、bucket、overlap
- 阅读 `torch/nn/parallel/distributed.py` 关键路径

### Day 18 — ZeRO 系列（DeepSpeed）
- ZeRO-1 / 2 / 3 分别切了什么
- 论文：ZeRO: Memory Optimization Toward Training Trillion Parameter Models

### Day 19 — Tensor Parallel
- Megatron-LM 的列并行 / 行并行
- 手画 MLP 与 Attention 的切分图

### Day 20 — Pipeline Parallel
- GPipe vs 1F1B vs Interleaved 1F1B（Megatron）
- bubble 时间计算

### Day 21 — Sequence Parallel & Context Parallel
- 长序列训练为什么需要 SP / CP
- Ring Attention 思路

### Day 22 — 3D / 4D 并行实战
- 跑通 Megatron-LM 在单机多卡上训练一个小 GPT
- 改 `--tensor-model-parallel-size` / `--pipeline-model-parallel-size`

### Day 23 — DeepSpeed 实战
- ZeRO-3 + Offload（CPU / NVMe）
- 配置文件 `ds_config.json` 各项含义

### Day 24 — Checkpoint 与容错
- 分布式 checkpoint（DCP）、异步保存
- 训练中断恢复、elastic training

### Day 25 — 数据 pipeline
- WebDataset / Mosaic streaming / 自定义 IterableDataset
- `num_workers`、prefetch、shared memory

### Day 26 — 算子层加速
- FlashAttention v2 / v3、xFormers、Apex Fused Kernels
- 动手：替换 attention，benchmark TFLOPS / MFU

### Day 27 — 训练性能分析
- MFU / HFU 计算公式
- 用 nsys 抓一段 step，识别 compute / comm / bubble

### Day 28 — 周复盘 + 小项目
- 在 2 卡（或云上 8 卡）训一个 ~125M GPT，记录 MFU
- 写一篇笔记：「ZeRO-3 vs TP+PP 在我的硬件上的取舍」

---

## 阶段 3：推理 Infra 与服务化（Day 29–42）

### Day 29 — LLM 推理基础
- prefill vs decode 阶段差异
- KV Cache 是什么，为什么是显存大头

### Day 30 — 解码算法
- greedy / beam / top-k / top-p / temperature
- speculative decoding 思想

### Day 31 — PagedAttention & vLLM
- 论文：Efficient Memory Management for Large Language Model Serving with PagedAttention
- block table、copy-on-write

### Day 32 — vLLM 实战
- 部署一个 7B 模型，开启 OpenAI 兼容 API
- 调 `--max-num-seqs`、`--gpu-memory-utilization`

### Day 33 — Continuous Batching
- 静态 batching vs in-flight batching
- 对比 TGI / vLLM / SGLang 的调度器

### Day 34 — SGLang & RadixAttention
- 前缀缓存、共享 prefix 的请求调度
- 动手：用同一个 system prompt 发多请求，观察命中

### Day 35 — 量化 (1)：权重量化
- INT8 / INT4 / GPTQ / AWQ 原理
- 动手：用 AutoGPTQ / llama.cpp 量化一个模型

### Day 36 — 量化 (2)：KV Cache 与激活量化
- FP8 KV、SmoothQuant、per-channel vs per-token

### Day 37 — 推理引擎对比
- TensorRT-LLM / vLLM / SGLang / lmdeploy / llama.cpp
- 列一张矩阵：硬件支持、特性、易用性、性能

### Day 38 — Speculative / Medusa / EAGLE
- 草稿模型 + 验证、Medusa heads、tree attention

### Day 39 — 长上下文推理
- chunked prefill、prefix caching、disaggregated prefill/decode

### Day 40 — Serving 层
- 网关：负载均衡、流式 SSE、超时与重试
- 多副本调度：least-load、prefix-aware routing

### Day 41 — 性能压测
- 工具：vLLM benchmarks、`genai-perf`
- 关注指标：TTFT、TPOT、throughput、p50/p99

### Day 42 — 周复盘 + 推理小项目
- 把一个开源 7B 模型，部署成兼容 OpenAI 的服务
- 写性能报告：不同 batch / 上下文长度下的 TTFT / TPS

---

## 阶段 4：平台化 — 调度、存储、可观测（Day 43–53）

### Day 43 — Kubernetes 基础回顾
- Pod / Deployment / Service / PVC
- nvidia-device-plugin、`resources.limits.nvidia.com/gpu`

### Day 44 — GPU 调度
- gang scheduling（Volcano / Kueue）
- topology-aware（NVLink 域）、MIG、MPS

### Day 45 — 训练任务编排
- Kubeflow Training Operator、Ray、SkyPilot
- 动手：用 Ray 起一个多节点任务

### Day 46 — 推理服务编排
- KServe / vLLM Production Stack / Knative
- HPA：基于 QPS / GPU 利用率扩缩容

### Day 47 — 存储 (1)
- 训练数据：对象存储（S3/OSS）+ 缓存（JuiceFS / Alluxio / Fluid）
- checkpoint 存储与加速

### Day 48 — 存储 (2)
- 模型分发：P2P（Dragonfly）、镜像懒加载
- 大模型加载耗时优化

### Day 49 — 网络
- RDMA over Converged Ethernet
- NCCL 拓扑探测、`NCCL_IB_HCA`、`NCCL_SOCKET_IFNAME`

### Day 50 — 可观测 (1)：Metrics
- DCGM Exporter + Prometheus + Grafana
- 关键指标：SM activity、HBM BW、NVLink BW、ECC

### Day 51 — 可观测 (2)：Tracing & Logs
- OpenTelemetry、推理请求全链路 trace
- 训练 loss spike 排查方法论

### Day 52 — 故障与稳定性
- Xid 错误、ECC、链路抖动、慢节点
- 训练任务自动重启与 checkpoint 续训

### Day 53 — 周复盘 + 平台小练习
- 在 minikube / kind 上模拟跑一个 vLLM Deployment + Prometheus

---

## 阶段 5：综合项目 + 论文精读 + 复盘（Day 54–60）

### Day 54 — 综合项目设计
- 目标：搭一个「迷你 LLM 平台」
  - 训练侧：DeepSpeed / Megatron 微调一个 1–7B 模型
  - 推理侧：vLLM 部署 + OpenAI API + Prometheus 监控
  - 平台侧：Docker Compose 或 K8s manifests

### Day 55–57 — 项目实现
- Day 55：训练 + checkpoint 保存
- Day 56：转换 / 量化 + 推理部署
- Day 57：监控接入 + 压测报告

### Day 58 — 论文精读日 (1)
- Megatron-LM、ZeRO、FlashAttention 任选一篇逐段精读

### Day 59 — 论文精读日 (2)
- vLLM (PagedAttention) 或 SGLang (RadixAttention) 精读

### Day 60 — 总复盘 & 后续路线
- 整理这 60 天的笔记成一份 wiki
- 选一个细分方向继续深耕：
  - 训练框架研发（Megatron / DeepSpeed 二次开发）
  - 推理引擎研发（vLLM / TRT-LLM 贡献）
  - 编译器（Triton / TVM / MLIR）
  - 平台与调度（K8s + 自研调度器）
  - 大规模集群运维（万卡稳定性）

---

## 关键资源清单

**书 / 教程**
- 《CUDA C Programming Guide》（NVIDIA 官方）
- 《Programming Massively Parallel Processors》(PMPP)
- ezyang 的 PyTorch internals 系列
- HuggingFace「Ultra-Scale Playbook」

**论文必读 (Top 10)**
1. Megatron-LM
2. ZeRO / ZeRO-Infinity
3. GPipe / PipeDream
4. FlashAttention v1 / v2
5. PagedAttention (vLLM)
6. RadixAttention (SGLang)
7. GPTQ / AWQ
8. Speculative Decoding (Google)
9. Ring Attention
10. Mixture-of-Experts (GShard / Switch Transformer)

**代码仓库（边读边跑）**
- `NVIDIA/Megatron-LM`
- `microsoft/DeepSpeed`
- `vllm-project/vllm`
- `sgl-project/sglang`
- `Dao-AILab/flash-attention`
- `pytorch/pytorch`（重点 `torch/distributed`、`aten`）

**社区**
- PyTorch dev-discuss、vLLM/SGLang Slack、知乎「AI Infra」话题、HuggingFace 博客

---

## 学习方法建议

1. **每天写笔记**：用 Obsidian / Logseq 建一个 AI-Infra knowledge graph
2. **代码先跑通再改**：永远先 `git clone && 跑 example`，再读源码
3. **画图**：分布式 / 并行 / 调度类内容必须自己画一遍
4. **Benchmark 习惯**：任何"优化"都要有 before/after 数据
5. **GPU 资源**：本地没卡可用 RunPod / Vast.ai / AutoDL 按需租 A100/H100
