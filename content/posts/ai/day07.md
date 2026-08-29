---
title: "Day 07 · 周复盘 + 网络/存储基础"
date: '2026-05-18'
draft: false
description: "Week 1 收官:把 Day 01–06 的 GPU 编程知识串成地图,再补上 AI 集群的网络与存储基础——NVLink 与 PCIe、InfiniBand 与 RoCE、RDMA 原理、NCCL 通信模型、存储分层。为 Phase 1 进入框架内部机制铺路。"
toc: true
tags:
  - AI
  - Infra
  - Network
  - RDMA
  - NCCL
  - Storage
---

DAY 07 · AI INFRA ROADMAP · WEEK 1 RECAP

# 从一张 _卡_ 到一个 _集群_

一周过去——你已经能写 CUDA、用 Nsight 看穿 kernel。 但所有的故事都还发生在_一张 GPU_ 上。 Day 07 做两件事:把第一周知识打成一张可回溯的地图,然后跨过单卡, 认识把多张卡串成集群的 **NVLink / PCIe / IB / NCCL / RDMA / 存储** 这层基础设施。

**WEEK 1 / 6** · 基础与 GPU 编程 · DAY 01 – 07 · 阶段交接日

**DURATION** 2.5 h **RECAP** 0.5 h **NEW THEORY** 1.5 h **HANDS-ON** 0.5 h **STACK** NVLink · PCIe · IB · RDMA · NCCL · S3

## 思维导图

OVERVIEW

> **图：Day 7 思维导图**
>
> - DAY 07 · 周复盘 + 网络/存储基础
> - WEEK 1 RECAP · INTERCONNECT · RDMA · NCCL · STORAGE
> - 01 · RECAP
> - Week 1 知识地图
> - 02 · INTERCONNECT
> - 互连层级与带宽
> - 03 · RDMA + NCCL
> - 通信原理
> - 04 · STORAGE
> - 存储分层
> - D01-03 概念栈
> - D04-05 CUDA 入门
> - D06 Profiling
> - 未解决的问题清单
> - NVLink (节点内)
> - PCIe / NVSwitch
> - InfiniBand / RoCE
> - 带宽阶梯
> - RDMA 三件套
> - Kernel Bypass
> - NCCL 集合通信
> - Ring vs Tree
> - 对象存储 S3/OSS
> - 分布式文件系统
> - 本地 NVMe 缓存
> - Checkpoint 路径
> - DELIVERABLES
> - Week 1 知识地图笔记
> - 带宽阶梯表 (HBM→Disk)
> - nvidia-smi topo 拓扑图
> - Phase 1 学习计划

FIG · Day 07 全景:左半部分复盘 Day 01–06,右半部分铺设进入 Phase 2 所需的网络/存储底座

## Week 1 知识地图复盘

30 MIN

第一周的目标是_把"GPU 编程"这个黑盒打开_。 从硬件抽象到 CUDA 编程模型,再到性能分析工具——所有内容串成一句话: **"GPU 是一台靠延迟隐藏吃饭的并行机器,你的代码必须配合它的访存层次,profiling 是唯一可靠的反馈回路。"**

DAY 01

#### AI Infra 全景与环境

从 prompt 到 GPU kernel 的完整链路,搭好 conda + CUDA + PyTorch 验证环境。

prompt · token · kernel · driver

DAY 02

#### Linux / 容器基础

cgroups/namespaces 给后续 K8s 调度做铺垫,nvidia-container-toolkit 把 GPU 装进容器。

cgroup · namespace · docker · runtime

DAY 03

#### GPU 硬件与体系结构

SM/Warp/Tensor Core/HBM 各自的角色——硬件决定了 grid/block 设计的边界。

SM · warp · HBM · L2 · tensor core

DAY 04

#### CUDA 入门(1):kernel 与启动

grid/block/thread 编程模型,vector add 与 naive GEMM——naive GEMM 比 cuBLAS 慢 50×。

grid · block · thread · vector add · naive gemm

DAY 05

#### CUDA 入门(2):Shared Memory Tiling

SMEM tiling 让数据复用率提高 T 倍,coalesced access + 消除 bank conflict 是配套必备。

tiling · SMEM · coalesced · bank conflict · padding

DAY 06

#### Profiling 工具链

nsys / ncu / py-spy / torch.profiler 四层显微镜,top-down 调查替代盲优化。

nsys · ncu · py-spy · torch.profiler · roofline

### 三条贯穿主线

LINE 01

### 访存优于计算

从 SM 的 latency hiding,到 SMEM tiling 的数据复用,到 ncu 中 memory-bound 的判定—— **性能瓶颈几乎总是访存,不是算力** 。

LINE 02

### 抽象层次清晰

Python → CUDA Runtime → Driver → Hardware,每一层都有对应 profiler。看错层 = 优化错对象。 **Top-Down 是金科玉律** 。

LINE 03

### 测量 ⇒ 假设 ⇒ 验证

所有优化都要 before/after。猜想是廉价的,数据是昂贵的—— **没有数据的"我以为"应该立刻被废除** 。

### 仍然没解决的问题(本周末诚实清单)

- tiled GEMM 仍比 cuBLAS 慢 5–10×——register blocking / double buffering / Tensor Core 尚未掌握
- 所有代码都跑在单卡上,多卡训练完全没接触
- 对 PyTorch 内部如何把 Python op 调到 CUDA kernel 还是黑盒(Day 08-10 会拆开)
- 显存只看过 `nvidia-smi` 那个总数,具体怎么分配/回收不清楚
- FP16/BF16/FP8 听过但没用过(Day 12 解决)

复盘动作: 把今天的 7 张 day-card 打印或抄写在一张 A4 上,作为 60 天路线的第一个 milestone。

## 互连层级与带宽阶梯

25 MIN

多 GPU 训练首先要回答的问题:_这两张卡之间数据怎么走?_ 一个 H100 集群里,数据可能经过四种通路: **HBM 内访问 → NVLink → PCIe → InfiniBand 网络** 。 带宽相差三个数量级,选错通路 = 训练慢 10×。

> **图：带宽阶梯**
>
> - BANDWIDTH HIERARCHY — LOG SCALE · H100 GENERATION
> - 10 TB/s
> - 1 TB/s
> - 100 GB/s
> - 10 GB/s
> - 1 GB/s
> - HBM3
> - 3.35 TB/s
> - 片上显存
> - NVLink 4
> - 900 GB/s
> - 节点内 GPU↔GPU
> - NVLink 3
> - 600 GB/s
> - A100 时代
> - PCIe Gen5
> - 128 GB/s ×16
> - CPU↔GPU
> - PCIe Gen4
> - 64 GB/s ×16
> - A100/H100 主板
> - IB NDR
> - 50 GB/s (400 Gb)
> - 跨节点 RDMA
> - NVMe
> - 7 GB/s
> - 本地盘
> - 每层之间约 5–10× 落差

FIG · 互连带宽阶梯(对数刻度):HBM 与 NVMe 相差近 500×,跨层数据移动的代价

### 三种典型节点拓扑

| 拓扑 | 典型机型 | GPU↔GPU 节点内 | GPU↔GPU 跨节点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 消费/PCIe 节点 | 4090×N · A6000×N | PCIe Gen4 = 64 GB/s | 10 GbE = 1.25 GB/s | 小模型微调、推理 |
| DGX A100 | HGX A100 8× | NVSwitch 全连接 600 GB/s | HDR IB 8×200 Gb/s | 百亿参数训练 |
| DGX H100 / GB200 | HGX H100 8× / NVL72 | NVLink 4 / NVSwitch 900 GB/s | NDR IB / Spectrum-X | 千亿~万亿参数训练 |

RULE

### 节点内 ≠ 跨节点

NVLink 比 IB 快 ~20×,这就是为什么 **Tensor Parallel(高频通信)只能在节点内做**,Pipeline Parallel(低频通信)才能跨节点。Day 19/20 会展开。

NVSWITCH

### NVSwitch 与"全连接"

NVLink 是点对点,NVSwitch 是交换芯片——8 张 GPU 通过 NVSwitch 后 **任意两卡都享有全速带宽** 。没有 NVSwitch 的板子,A↔B 全速但 A↔E 可能要经过中继。

PCIE LANES

### PCIe Lane 数 = 命脉

PCIe 带宽 = 单 lane × lane 数。x16 是"满格",x8 直接腰斩。云上 GPU 实例要确认是否给了 x16,某些"低端"实例只给 x8 甚至 x4——一次性把训练吞吐打折扣。

GDR · GDS

### GPU Direct 家族

**GPU Direct RDMA** :GPU 显存直接走 IB 网卡,不经 CPU 内存。 **GPU Direct Storage** :NVMe → GPU 显存,绕过 CPU。两者都靠"消去 CPU 中转",是大模型训练高吞吐的关键。

实战检查: 在你的机器上跑 nvidia-smi topo -m,会画出 GPU↔GPU 的连接方式 (NV# / SYS / PHB / PXB)。

## RDMA 与 NCCL 通信原理

25 MIN

互连只是物理通路,要把多 GPU 真正用起来,还需要两层软件—— _RDMA_ 把跨节点通信做到接近线速, _NCCL_ 在 RDMA/NVLink 之上提供 PyTorch/Megatron 直接用的集合通信原语。

### RDMA 的三个关键设计

DESIGN 01

### Kernel Bypass

普通 TCP 数据每次都要走内核栈(syscall → IP → TCP),延迟数十微秒。RDMA 通过 `verbs` API 让用户态 **直接和网卡寄存器对话** ,延迟降到 1–2 µs。

DESIGN 02

### Zero Copy

用户预先向网卡 **注册一段内存** (MR, Memory Region),后续 send/recv 网卡直接 DMA 这段内存,不需要任何拷贝。GDR 把这段内存扩展到 GPU 显存。

DESIGN 03

### One-Sided ops

除了传统的 SEND/RECV,RDMA 提供 **READ/WRITE** ——远端 CPU 完全不参与,A 卡可以直接读写 B 卡的显存。这是 RDMA 高吞吐的核心。

### InfiniBand 与 RoCE 之争

| 维度 | InfiniBand | RoCE v2 (RDMA over Ethernet) |
| --- | --- | --- |
| 底层协议 | IB 专用协议栈 | IP/UDP 上承载 IB 帧 |
| 组网设备 | 需 IB 专用网卡 + IB 交换机 | 带 RoCE 能力的以太网卡 + 普通交换机 |
| 延迟 / 吞吐 | 最低(亚微秒),最稳 | 接近 IB,丢包敏感 |
| 无损保证 | 原生 credit-based 流控 | 依赖 PFC + ECN 调优,易出 head-of-line |
| 选型倾向 | NVIDIA DGX / 大规模训练集群 | 云厂自建集群 · 通用性优先 |

### NCCL — 跨 GPU 的集合通信

NCCL 把"多个 GPU 之间交换数据"封装成 6 个原语,自动选择最优路径(NVLink / PCIe / IB)和算法(Ring / Tree)。 PyTorch 的 `torch.distributed` 后端默认就是 NCCL。

| 原语 | 语义 | 训练里的角色 |
| --- | --- | --- |
| AllReduce | 所有 rank 的张量按位 sum,结果每个 rank 都拿到 | DDP 同步梯度,最常用 |
| AllGather | 每个 rank 贡献一份,所有 rank 拿到拼接后完整张量 | ZeRO 取回切分参数 · TP 收集结果 |
| ReduceScatter | 先 reduce,再把结果切分到各 rank | ZeRO 梯度同步 · TP 行并行 |
| Broadcast | 一个 rank 发,所有 rank 收 | 权重初始化分发 |
| Reduce | 所有 rank 贡献,只有一个 rank 拿结果 | 主 rank 做日志/eval |
| SendRecv | 点对点收发 | Pipeline Parallel 跨 stage 传 activation |

### Ring vs Tree AllReduce 直觉图

> **图：Ring vs Tree AllReduce**
>
> - ALLREDUCE TOPOLOGIES — RING vs TREE
> - RING ALLREDUCE
> - R0
> - R1
> - R2
> - R3
> - 每 rank 收发 2·(N-1)·M/N 字节
> - 带宽最优 · 延迟 O(N)
> - → 适合大消息
> - TREE ALLREDUCE (REDUCE 阶段)
> - R4
> - R5
> - R6
> - 每层并发 reduce,共 log₂N 层
> - → 延迟 O(log N),适合小消息

FIG · Ring 适合大消息(带宽最优),Tree 适合小消息(延迟最优),NCCL 会按消息大小自动切换

NCCL DEBUG

### 看 NCCL 在做什么

设 `NCCL_DEBUG=INFO`,日志里会打印每次集合通信选的算法、协议、通路(NVLink/PCI/IB),以及实际带宽。 **诊断通信问题的第一步** ,Day 16 会精读这种日志。

PREVIEW

### Day 16 / Day 17 钩子

下周会真正手写 DDP + 看 NCCL 内部 ring/tree 算法。今天只需要记住: **"AllReduce 是 DDP 的灵魂,Ring 是它的默认实现"** 。

## 训练系统的存储分层

20 MIN

训练系统的存储几乎总是分三层:_远端对象存储_放原始数据集和模型 archive, _分布式文件系统/缓存_做高吞吐读取, _本地 NVMe_做活动 checkpoint 和热数据缓存。 这三层的边界决定了"数据 pipeline 卡不卡"。

> **图：存储分层**
>
> - TRAINING STORAGE STACK — 3 TIERS
> - TIER 1 · OBJECT STORE / 冷存储
> - S3 · OSS · COS · GCS · 自建 Ceph
> - PB 级容量 · 单对象 100ms 级延迟 · 跨可用区可靠 · 按存储量计费
> - 原始数据集 / 模型权重 archive
> - TIER 2 · DISTRIBUTED FILE SYSTEM / CACHE
> - Lustre · GPFS · JuiceFS · Alluxio · Fluid (K8s)
> - POSIX 接口 · GB/s 级吞吐 · 把对象存储缓存到 NVMe · 集群内共享
> - 训练数据热集 / 预处理产物
> - TIER 3 · LOCAL NVMe / SCRATCH
> - /scratch · /local · /dev/nvme\*
> - 本机 7+ GB/s · 微秒级延迟 · 活动 checkpoint / shuffle buffer / 推理 KV 落盘
> - 活动 checkpoint / 临时

FIG · 训练系统三层存储:对象存储兜底容量,DFS/缓存提供吞吐,本地 NVMe 提供延迟

DATA PATH

### 数据走得越短越好

理想路径:Tier 1 → Tier 2 (一次拉取) → Tier 3 (整 epoch 命中) → GPU。 **每个 epoch 都直接打 Tier 1 = 训练拉垮带宽 + 起步极慢** 。Day 25 会专门讲 WebDataset / Mosaic Streaming 等数据 pipeline。

CHECKPOINT

### Checkpoint 写在哪

大模型 ckpt 几十 GB 起步,直接写远端会卡训练。**策略:先写本地 NVMe(快),再异步上传到对象存储(可靠)**。Day 24 会讲 Distributed Checkpoint 和异步保存。

SHUFFLE

### 大规模 shuffle

当数据集大于单机内存时,需要"近似 shuffle"——把数据切成 shard,在 Tier 2 里随机选 shard,shard 内顺序读。完全随机访问 Tier 1 几乎不可行。

PREVIEW

### Day 47 / 48 钩子

本周末只需要建立"存储是分层的"直觉。 **Phase 4 会真正配置 JuiceFS / Fluid,做检查点加速实验** 。今天的认知足以读懂分布式训练论文里所有"data pipeline"段落。

## 动手实践 — 摸清你的机器

30 MIN

光看图不够。今天的实操是**在自己的机器(或一台租来的 GPU 实例)上把拓扑、带宽、存储路径全部摸一遍**, 把抽象概念落到具体数字。无 GPU 也可以在 colab / RunPod 上做。

### ① 看 GPU 互连拓扑

```
# 打印节点内 GPU 之间的连接方式
nvidia-smi topo -m

# 典型输出含义:
# NV# = NVLink + 后面数字表示链路数(NV12 = 12 条链路)
# PIX = 经过单个 PCIe Switch
# PXB = 经过多个 PCIe Switch
# PHB = 经过 CPU 的 PCIe Host Bridge
# SYS = 跨 NUMA / 跨 CPU 的最差路径

# 查看 NVLink 实际链路状态和带宽
nvidia-smi nvlink --status
nvidia-smi nvlink --capabilities
```

### ② 测节点内 GPU↔GPU 带宽

```
# cuda-samples 里的 bandwidthTest / p2pBandwidthLatencyTest
git clone https://github.com/NVIDIA/cuda-samples
cd cuda-samples/Samples/5_Domain_Specific/p2pBandwidthLatencyTest
make && ./p2pBandwidthLatencyTest

# 输出是一张 N×N 矩阵,主对角线是显存内带宽,
# 其它是 GPU↔GPU peer 带宽 — 用来验证 NVLink 是否生效
```

### ③ 测跨节点 RDMA(若有 IB 网卡)

```
# 服务端
ib_send_bw -d mlx5_0

# 客户端(另一台机器)
ib_send_bw -d mlx5_0 192.168.1.10

# 输出 BW 列就是 RDMA send 实测带宽 (MB/s)
# 接近网卡线速(如 NDR 50 GB/s)= 配置正确
# 若远低于线速,通常是 PFC/ECN 没配 或 走了错的 RoCE 优先级
```

### ④ 跑 NCCL 自带的 AllReduce 基准

```
# 安装 nccl-tests
git clone https://github.com/NVIDIA/nccl-tests
cd nccl-tests && make MPI=1

# 单机多卡 AllReduce 测试 (例:8 卡)
./build/all_reduce_perf -b 8M -e 4G -f 2 -g 8

# 关键看 "busbw" 列(busbandwidth),逼近 NVLink 物理带宽即正常
# 同时打开 NCCL_DEBUG=INFO 看 NCCL 选了什么算法/协议
NCCL_DEBUG=INFO ./build/all_reduce_perf -b 8M -e 4G -f 2 -g 8
```

### ⑤ 摸一下存储吞吐

```
# 本地 NVMe 写带宽(避免缓存影响)
dd if=/dev/zero of=/scratch/test.bin bs=1M count=4096 oflag=direct

# 远端对象存储拉取速度(以 s5cmd 为例)
s5cmd cp s3://bucket/dataset.tar /scratch/

# 训练读取模式更真实的 benchmark
fio --name=randread --rw=randread --bs=4k --size=2G \
    --numjobs=8 --direct=1 --filename=/scratch/test.bin
```

DELIVERABLE

### 一张机器画像

把上面 5 个命令的输出整理成一张 markdown 表格:GPU 数 / 互连类型 / 节点内带宽 / 网络带宽 / 本地盘吞吐 / 对象存储吞吐。 **这张画像是 Phase 2 设计并行策略时的输入参数** 。

NO MACHINE?

### 租机器场景

没本地 GPU 的同学:RunPod 选一个 8×A100 实例(约 $11/h),把上面 5 步跑一遍并关机,1 小时内 ~$11 拿到一份真实集群的画像数据,比读文档收益高得多。

提醒: 测试完成立刻关机/释放,GPU 实例闲置费用极易失控。

## 常见疑问

5 QUESTIONS

### Q1 · 没有 NVLink 的消费级多卡机器(比如 4× 4090)能不能训大模型?

ANS

能,但有强约束:

(1) **4090 不支持 NVLink** ,所有 GPU↔GPU 通信走 PCIe Gen4(实际可用 ~50 GB/s),比 H100 NVLink 慢 ~18×。这意味着 Tensor Parallel 几乎不可用——一旦上 TP,通信会成为绝对瓶颈。

(2) 可行的策略: **单卡能放下的小模型用 DDP** (只在 step 末做一次 AllReduce,通信占比低); **大模型用 ZeRO-3 + CPU/NVMe offload** (用 PCIe 带宽换显存)。Day 18/23 会展开。

(3) 真实结论:4090×N 适合 7B 量级模型微调和推理,30B+ 训练就该上 A100/H100 集群了。

### Q2 · RoCE 比 InfiniBand 便宜,选 RoCE 是不是更划算?

ANS

"便宜"是表面,RoCE 的隐性成本在 **调优和稳定性** 上。

RoCE 走 IP/UDP,丢包对 RDMA 是灾难——必须开 PFC + ECN 做无损以太网,而这两个一旦没调好就会出 head-of-line blocking、PFC pause storm 等连环问题,大规模训练时可能 **每天都在排查通信抖动** 。

选择建议: **规模小、运维强、想省钱 → RoCE** (国内很多云厂自建集群走这条路); **规模大、稳定优先、有预算 → InfiniBand** (NVIDIA DGX 默认配 IB)。万卡级集群目前主流仍是 IB。

### Q3 · NCCL 为什么要既有 Ring 又有 Tree?用一个不就行了吗?

ANS

因为 AllReduce 的代价是 **延迟 + 带宽两部分** :`T = α·hops + β·bytes`。两种算法在这两项上各占一头。

**Ring** :每个 rank 只跟左右邻居通信,总跳数 = 2(N-1),延迟随 N 线性增长;但 **带宽利用率最高** ——每条链路双向打满,每 rank 收发量约 2M(M = 张量大小)。大消息选它。

**Tree** :类似 reduce tree,延迟 = O(log N) 跳;但 **带宽利用率低** ——大部分节点只是中转。小消息选它,因为这时延迟主导。

NCCL 内置一个 tuner,会根据消息大小、GPU 数、拓扑自动切换。所以 **NCCL\_DEBUG=INFO 里能看到 "Algo: Ring" 或 "Algo: Tree"** ——不是你选的,是它自己算的。

### Q4 · 为什么不直接把对象存储挂成本地盘当训练数据源?

ANS

因为对象存储的 **延迟特性** 和训练数据的 **访问模式** 完全不匹配。

(1) **延迟** :S3 单次 GET 至少几十 ms,而训练每个 step 要读上百个小样本——延迟累积成主导。

(2) **随机访问** :训练每个 epoch 都要 shuffle,会触发对象存储的高额随机读开销,带宽利用率极差。

(3) **小文件** :对象存储为大文件优化,几万个小图片会让"列举 + 读取"的开销淹没真正的数据传输。

所以工业界标准做法:**把数据集打包成大文件(WebDataset 的 .tar / TFRecord / Mosaic 的 .mds),用 Tier 2 缓存层加速,Tier 3 做最终预取**。Day 25/47 会展开。

### Q5 · 第一周结束,我感觉学得很赶,要不要往回补 ?

ANS

这是非常正常的感觉,但 **不要回炉重做整个第一周** 。理由:

(1) 60 天路线被设计成 **螺旋上升** ——CUDA / SMEM / NCCL 会在后面 Day 17/19/20/26 重复出现,每次都加深一层。第一周只要求"能识别 + 能跑通",不要求"能造轮子"。

(2) 真正应该补的是 **实操短板** ——如果某个 Day 没动手做实验,把那个实验做完就行,不必重读理论。理论再多看一遍效果有限,跑一次实验胜过读三遍论文。

(3) 建议把今天的"未解决问题清单"贴在桌前,在 Phase 1-2 学到对应内容时主动回头划掉。 **压力来自感到"自己不懂",但你已经在以正常节奏建立懂的能力。**

## 复盘问题

5 QUESTIONS

1. 用一张图把 Day 01–06 的关键概念串联起来(可以借鉴本日 mindmap),每个 Day 用一句话总结它的"唯一关键 takeaway"。
2. 画出从一张图片(在远端 S3)被读取、解码、送进 GPU forward 的 **完整数据路径** ,标注每一段的带宽数量级和潜在瓶颈。
3. 解释为什么 Tensor Parallel 不能跨节点,而 Pipeline Parallel 可以——用今天学的 NVLink/IB 带宽差距来论证。
4. 跑一次 `nvidia-smi topo -m`,把你机器的拓扑画成图,标注每条链路的类型(NV# / PIX / SYS)。如果是云实例,记录该规格的官方拓扑文档链接。
5. 写出"你机器/集群的带宽阶梯"——HBM、节点内 GPU↔GPU、跨节点、对象存储——的实测值或文档值,跟今天的标准表对比。

## 今日检查清单

8 ITEMS

- 能用一张图说出 Week 1 六个 Day 的主线和未解决问题
- 能说出 NVLink / PCIe / IB / Ethernet 的典型带宽和适用场景
- 理解 RDMA 的 kernel bypass / zero copy / one-sided 三大设计
- 能区分 InfiniBand 和 RoCE,知道各自的取舍
- 能说出 6 个 NCCL 集合通信原语和它们在训练中的角色
- 理解 Ring vs Tree AllReduce 各自适用的消息大小
- 能画出训练系统的三层存储分层,以及数据/checkpoint 的标准路径
- `nvidia-smi topo -m` 跑过并能解读 NV# / PIX / SYS 含义

## 推荐阅读

5 ITEMS

MUST READ

### NVIDIA DGX H100 系统架构白皮书

官方文档,把 NVLink 4 / NVSwitch / NDR IB 的拓扑、带宽和典型负载数据写得最清楚。读一遍胜过看十篇博客。

OFFICIAL

### NCCL Developer Guide

NCCL 官方手册,重点看 "Algorithm Selection" 和 "Topology Detection" 两章——理解 NCCL 是怎么自动选 Ring/Tree 的。

BLOG

### HuggingFace — The Hardware Lottery

Ultra-Scale Playbook 的第一篇,讲硬件如何决定算法选型,与今天的"互连决定并行策略"互为佐证。

PAPER

### RDMA over Commodity Ethernet at Scale (SIGCOMM '16)

微软 RoCE 大规模部署的经典论文,详细记录了 PFC pause storm、deadlock 等"RoCE 调优地狱",理解为什么 IB 在大规模训练里仍是主流。

REFERENCE

### OpenAI Scaling Kubernetes to 7,500 Nodes

千卡级集群运维的视角,看真实生产环境里网络、存储、调度协同的痛点——Phase 4 之前提前看一遍。

## Day 08 预告

NEXT · PHASE 1 START

COMING NEXT — PHASE 1 BEGINS

### PyTorch 核心抽象 — Tensor · Storage · Dispatcher · Autograd

第二周开始进入 **框架内部机制** 。Day 08 打开 PyTorch 黑盒:一个 `a + b` 是怎么从 Python 一路调到 CUDA kernel 的?Tensor 和 Storage 怎么分离?Dispatcher 是干什么的?把第一周学的"硬件直觉"和后续要写的"分布式代码"中间这一层桥梁建好。

"一张卡看见 GPU 的样子,一万张卡才看见 GPU 的本质。"

DAY 07 · WEEK 1 RECAP · AI INFRA 60-DAY ROADMAP
