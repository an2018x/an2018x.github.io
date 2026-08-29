---
title: "Day 02 · Linux / 容器基础回顾"
date: '2026-05-15'
draft: false
description: "深入 Linux 隔离原语 cgroups 与 namespaces，掌握 Docker GPU 容器的启动链路，动手编写 CUDA Dockerfile 并运行第一个 GPU 容器。"
toc: true
tags:
  - AI
  - Linux
  - Docker
  - GPU
---

DAY 02 · AI INFRA ROADMAP · 60 DAYS

# 容器化你的 _GPU 开发环境_

第二天的目标是理解 Linux 容器隔离的底层机制， 搞懂 GPU 是如何被"穿透"进容器的， 然后亲手写出第一个能跑 CUDA 的 Dockerfile。

**DURATION** 2.5–3 h **THEORY** 1.5 h **HANDS-ON** 1 h **REVIEW** 0.5 h **STACK** Linux · cgroups · Docker · nvidia-container-toolkit

## 思维导图

OVERVIEW

> **图：Day 2 思维导图**
>
> - DAY 02 · Linux / 容器基础
> - ISOLATION · GPU PASSTHROUGH
> - 01 · ISOLATION
> - Linux 隔离原语
> - 02 · AFFINITY
> - 进程 / NUMA 亲和
> - 03 · CONTAINER
> - Docker + GPU
> - 04 · HANDS-ON
> - CUDA Dockerfile
> - cgroups v1 / v2
> - namespaces (6 种)
> - /proc 文件系统
> - 设备隔离 (devices)
> - taskset / CPU 绑核
> - numactl NUMA 拓扑
> - GPU-NUMA 局部性
> - lscpu / lstopo
> - 镜像分层 UnionFS
> - --gpus all 工作原理
> - nvidia-container-toolkit
> - CUDA 基础镜像选择
> - 写 Dockerfile
> - docker build & run
> - 容器内 nvidia-smi
> - 复现 Day01 推理
> - DELIVERABLES
> - Day02.md 笔记
> - 容器隔离架构图
> - CUDA Dockerfile 跑通
> - NUMA 拓扑记录

FIG · Day 02 全景:四个主题 → 从 Linux 隔离原语到 GPU 容器化实践

## Linux 隔离原语

30 MIN

容器不是虚拟机 — 它本质上就是一个 _受 cgroups 限制资源、被 namespaces 隔离视图_ 的普通 Linux 进程。理解这两个原语，是理解 GPU 如何"穿透"进容器的前提。

> **图：容器 = cgroups + namespaces 架构图**
>
> - CONTAINER = CGROUPS + NAMESPACES + ROOTFS
> - HOST KERNEL · LINUX 5.15+
> - CGROUPS
> - 资源限制 — "你能用多少"
> - CPU
> - cpu.cfs\_quota\_us
> - MEMORY
> - memory.limit\_in\_bytes
> - DEVICES
> - devices.allow
> - PIDS
> - pids.max
> - V1 VS V2
> - v1: 每个 controller 独立层级树
> - v2: 统一层级树 (推荐)
> - GPU 关键: devices controller
> - 控制容器能访问哪些 /dev/nvidia\*
> - nvidia-container-toolkit 在这里注入 GPU 设备
> - NAMESPACES
> - 视图隔离 — "你能看到什么"
> - PID
> - 进程号隔离
> - NET
> - 网络栈隔离
> - MNT
> - 文件系统挂载
> - UTS
> - 主机名隔离
> - IPC
> - 进程间通信
> - USER
> - 用户 / 组 ID
> - KEY INSIGHT
> - 容器内 PID 1 = 宿主机某个 PID
> - 容器看不到宿主机进程，但共享内核
> - GPU 关键: /dev/nvidia\* 通过 MNT ns
> - + devices cgroup 双重授权

FIG · 容器隔离双引擎:cgroups 管"用多少"，namespaces 管"看到什么"

 核心认知 — 容器没有独立内核，GPU 容器的秘密就是"把 /dev/nvidia\* 设备节点挂进去 + 允许访问"

## 进程管理与 NUMA 亲和性

20 MIN

多卡服务器上 GPU 与 CPU / 内存的物理距离不同。把进程绑到离 GPU 最近的 NUMA node， 能减少 PCIe 延迟、提高 host-to-device 传输速度。这在训练数据加载时尤为关键。

TOOL 01

### /proc 文件系统

Linux 的"万能窗口"。`/proc/cpuinfo` 看核数频率，`/proc/meminfo` 看内存，`/proc/[pid]/status` 看进程的 cgroup / namespace 归属。

TOOL 02

### numactl

查看 NUMA 拓扑: `numactl -H`。绑定进程到指定 NUMA node: `numactl --cpunodebind=0 --membind=0 python train.py`

TOOL 03

### taskset

CPU 绑核: `taskset -c 0-7 python train.py`。数据加载进程绑到离 GPU 近的核，减少跨 NUMA 访问。

| 命令 | 用途 | AI Infra 场景 |
| --- | --- | --- |
| `lscpu` | CPU 架构、核数、NUMA nodes | 确认 CPU-GPU 亲和关系 |
| `numactl -H` | NUMA 拓扑 + 内存分布 | 找出 GPU 所属 NUMA node |
| `nvidia-smi topo -m` | GPU 间拓扑 + CPU 亲和 | 最后一列 = 最近 NUMA node |
| `taskset -c` | 绑定进程到指定 CPU 核 | DataLoader worker 绑核 |
| `lstopo` | 可视化硬件拓扑图 | 理解 PCIe / NVLink 连接 |

 实际影响 — 跨 NUMA 访问内存延迟可达 1.5–2x，在大规模训练的 DataLoader 上体感明显

## Docker 与 GPU 容器

40 MIN

GPU 不是"天生就能进容器"的 — 需要 `nvidia-container-toolkit` 在容器启动时动态注入驱动库和设备节点。理解这个过程，是后面搭建 K8s GPU 集群的基础。

> **图：GPU 容器启动链路**
>
> - STEP 01
> - docker run --gpus all
> - 用户发起带 GPU 的容器
> - --gpus 触发 OCI hook
> - STEP 02
> - containerd / runc
> - OCI runtime spec 解析
> - 调用 prestart hook
> - STEP 03 · KEY
> - nvidia-container-toolkit
> - 1. 检测宿主机 GPU 驱动版本
> - 2. 注入 /dev/nvidia\* 设备节点
> - 3. 挂载 libcuda.so / libnvidia-ml.so
> - nvidia-container-cli
> - 是实际执行注入的工具
> - 容器内无需安装驱动
> - 只需 CUDA runtime
> - STEP 04
> - 容器进程启动
> - 已在 cgroups + namespaces 中
> - GPU 设备节点已就位
> - RESULT
> - nvidia-smi 正常输出
> - 容器内看到的 GPU 信息
> - 与宿主机一致
> - IMAGE LAYERS (UNIONFS / OVERLAYFS)
> - nvidia/cuda:12.1-base
> - + python / pip
> - + torch / transformers
> - + your code (RW)

FIG · docker run --gpus all 的完整链路:OCI hook → nvidia-container-cli → 设备注入

KEY CONCEPT 01

### 镜像分层 (UnionFS)

每条 Dockerfile 指令生成一层只读层，容器启动时叠加一层可写层。修改文件 = copy-on-write。 **镜像越小，拉取越快** — 生产环境用 `nvidia/cuda:*-base` 而不是 `-devel`。

KEY CONCEPT 02

### 容器内不装驱动

NVIDIA 驱动是内核模块，由宿主机提供。容器只需要 CUDA runtime 库。`nvidia-container-toolkit` 在启动时把宿主机的 `libcuda.so` bind-mount 进容器。

## 动手实践

60 MIN · HANDS-ON

### 4.1 · 观察 Linux 隔离原语

先在宿主机上执行这些命令，理解 cgroups 和 namespaces 的存在:

```
# 1. 查看当前进程所在的 namespaces
ls -la /proc/self/ns/

# 2. 查看 cgroups v1 / v2
mount | grep cgroup
cat /proc/self/cgroup

# 3. NUMA 拓扑
numactl -H # 看 NUMA node 数量 + 内存分布
nvidia-smi topo -m # 最后一列 = GPU 最近的 NUMA node

# 4. CPU 信息
lscpu | grep -E "^CPU\(s\)|NUMA|Thread"
```

### 4.2 · 安装 nvidia-container-toolkit

```
# Ubuntu 22.04 安装 (一次性操作)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
  | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
  | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 验证
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

如果最后一条命令看到了 GPU 信息，说明 toolkit 配置成功

### 4.3 · 写你的第一个 CUDA Dockerfile

创建一个 `Dockerfile.cuda`，把 Day 01 的推理脚本容器化:

```
# Dockerfile.cuda
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# 系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Python 依赖
RUN pip3 install --no-cache-dir \
    torch --index-url https://download.pytorch.org/whl/cu121 && \
    pip3 install --no-cache-dir transformers accelerate sentencepiece

# 工作目录
WORKDIR /workspace
COPY first_infer.py .

# 默认命令
CMD ["python3", "first_infer.py"]
```

### 4.4 · 构建 & 运行

```
# 构建镜像 (首次较慢,PyTorch 约 2GB)
docker build -f Dockerfile.cuda -t aiinfra-day02 .

# 运行 — 注意 --gpus all
docker run --rm --gpus all aiinfra-day02

# 进入容器交互调试
docker run --rm -it --gpus all aiinfra-day02 bash

# 在容器内验证
nvidia-smi # 应该和宿主机看到一样的 GPU
python3 -c "import torch; print(torch.cuda.is_available())"
```

观察 01

### 镜像大小

用 `docker images` 查看。CUDA runtime 基础镜像 ~1.5 GB，加上 PyTorch 后总计 **~6–8 GB** 。生产环境要用多阶段构建瘦身。

观察 02

### 容器内看到多少 GPU？

取决于 `--gpus` 参数。`--gpus all` = 全部GPU，`--gpus '"device=0"'` = 指定第 0 张卡。这由 `NVIDIA_VISIBLE_DEVICES` 控制。

观察 03

### 对比宿主机的推理速度

容器内跑推理的速度应该和宿主机 **几乎一致** — 容器是共享内核的进程隔离，不是虚拟化，没有额外的 GPU 性能开销。

思考题

### 如果去掉 --gpus all？

容器内 `nvidia-smi` 会报错找不到设备。因为没有触发 nvidia-container-toolkit 的 OCI hook，设备节点不会被注入。

## 自测 · Q&A

6 QUESTIONS

不看答案，能讲清楚下面 6 个问题，Day 02 就算过关。 点击 `+` 展开参考答案。

### Q.01 · 容器和虚拟机的本质区别是什么？

A.

虚拟机有独立内核（通过 hypervisor 虚拟化硬件），容器 **共享宿主机内核** ，只通过 namespaces 隔离视图、cgroups 限制资源。

因此容器启动快（毫秒级）、性能几乎无损、但隔离性不如 VM。对 GPU 而言，容器方案（nvidia-container-toolkit）远比 GPU 虚拟化（vGPU / MIG）简单高效。

### Q.02 · cgroups 和 namespaces 各负责什么？

A.

**cgroups** = 资源限制（"你能用多少"）：CPU 时间、内存上限、设备访问、进程数。

**namespaces** = 视图隔离（"你能看到什么"）：PID、网络、文件系统、主机名、IPC、用户。

GPU 容器需要两者配合：`devices` cgroup 允许访问 `/dev/nvidia*`，`mnt` namespace 把设备节点挂进去。

### Q.03 · 为什么容器内不需要安装 NVIDIA 驱动？

A.

NVIDIA 驱动是 **内核模块** （`nvidia.ko`），容器共享宿主机内核，所以驱动已经加载了。

`nvidia-container-toolkit` 在容器启动时把宿主机的 `libcuda.so`、`libnvidia-ml.so` 等用户态库 bind-mount 进容器。容器镜像只需要 CUDA runtime（`libcudart.so`）。

### Q.04 · Docker 镜像分层对 AI 镜像有什么实际影响？

A.

AI 镜像通常很大（PyTorch + CUDA ≈ 6–8 GB），镜像分层意味着：

1. **共享基础层** — 多个镜像共用 `nvidia/cuda:12.1-base`，只拉一次。

2. **缓存加速构建** — 如果只改了代码层，pip install 层不用重跑。所以 Dockerfile 要把 **依赖安装放前面、代码 COPY 放后面** 。

3. **生产用 multi-stage** — 编译阶段用 `-devel`，运行阶段用 `-runtime`，镜像可缩小 50%+。

### Q.05 · NUMA 对 GPU 训练性能有什么影响？

A.

多 socket 服务器上，每个 GPU 通过 PCIe 连接到最近的 CPU socket（NUMA node）。如果训练进程的 DataLoader worker 跑在 **远端 NUMA node** 的 CPU 上，host-to-device 数据传输要跨 NUMA，延迟增加 1.5–2×。

用 `nvidia-smi topo -m` 找到 GPU 0 对应的 NUMA node，然后 `numactl --cpunodebind=0 --membind=0 python train.py` 绑定。大规模训练框架（Megatron、DeepSpeed）内部已处理。

### Q.06 · nvidia/cuda 镜像的 base、runtime、devel 三个版本有什么区别？

A.

**base** — 只有 CUDA runtime 核心库，最小最精简（~120 MB）。适合只跑推理的场景。

**runtime** — base + CUDA math 库（cuBLAS、cuFFT 等）。PyTorch 推理 / 训练通常选这个。

**devel** — runtime + 编译工具链（nvcc、头文件）。需要编译 CUDA kernel（如 FlashAttention）时用，镜像最大（~3.5 GB）。

生产建议： **编译阶段用 devel，运行阶段用 runtime** （multi-stage build）。

## 今日复盘

30 MIN · REVIEW

在你的笔记本里新建 `Day02.md`，回答下面 5 个问题:

1. 容器隔离靠哪两个 Linux 内核特性？它们各管什么？
2. GPU 是如何"穿透"进容器的？画出 docker run --gpus all 的完整链路。
3. 你的服务器有几个 NUMA node？GPU 0 连在哪个 NUMA node 上？
4. nvidia/cuda 镜像的 base / runtime / devel 分别适合什么场景？
5. 容器内跑推理的速度和宿主机对比如何？有没有性能损失？

## 完成标准 / Definition of Done

CHECKLIST

- 能口头解释 cgroups 和 namespaces 的作用，以及 GPU 容器如何利用它们
- 执行 `numactl -H` 和 `nvidia-smi topo -m`，记录了 NUMA 拓扑
- 安装了 `nvidia-container-toolkit` 并通过验证
- 写出了 CUDA Dockerfile，成功在容器内跑通 `nvidia-smi`
- 在容器内复现了 Day 01 的推理脚本，确认性能无明显损失
- `Day02.md` 笔记写完

## 明天预告

DAY 03

DAY 03 · GPU ARCHITECTURE

### GPU 硬件与体系结构

深入 GPU 内部:SM、Warp、Tensor Core、HBM、L2 Cache、SM occupancy。 阅读 NVIDIA Ampere / Hopper Whitepaper，用 nvidia-smi 和 nvtop 观察 GPU 在跑模型时的行为。

 "Containers are not about packing more software, _they're about building repeatable, portable infrastructure._"

 AI INFRA · 60 DAYS · DAY 02 OF 60 · [Next: Day 03 →](#)
