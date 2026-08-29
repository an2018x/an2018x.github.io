---
title: "Day 16 · NCCL 深入"
date: '2026-06-20'
draft: false
description: "进入分布式训练通信层:理解 NCCL 的 ring、tree、双二叉树 AllReduce 算法,看懂 NCCL_DEBUG=INFO 的初始化、拓扑、通道、算法选择日志,并用一个小脚本完整跑通 AllReduce 取证流程。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - NCCL
  - AllReduce
---

DAY 16 · AI INFRA ROADMAP · DISTRIBUTED TRAINING

# 读懂 GPU 之间的 _集体通信_

Day 15 认识了 `rank`、`world_size`、 `torchrun` 和基本 collective。今天往下钻一层: **NCCL** 如何在 GPU 之间完成 AllReduce, 为什么大 tensor 常走 **Ring** ,小/中等 tensor 和大规模集群常受益于 **Tree / Double Binary Tree** ,以及 `NCCL_DEBUG=INFO` 的日志到底应该怎么读。 学完今天,你要能把一次 DDP 梯度同步从 _Python API 调用_讲到_通道、拓扑、算法、协议和日志证据_。

**DURATION** 3 h **THEORY** 1.3 h **HANDS-ON** 1.2 h **REVIEW** 0.5 h **STACK** PyTorch · NCCL · torchrun · AllReduce

## 思维导图

OVERVIEW

> **图：Day 16 NCCL 思维导图**
>
> - DAY 16 · NCCL 深入
> - ALLREDUCE · RING · TREE · LOGS · DEBUG
> - 01 · MODEL
> - 通信模型
> - 02 · ALGO
> - Ring / Tree
> - 03 · TRACE
> - NCCL 日志
> - 04 · DEBUG
> - 故障定位
> - rank / device
> - collective contract
> - AllReduce = RS + AG
> - channel / transport
> - Ring: full bandwidth
> - Tree: log latency
> - double binary tree
> - NCCL\_ALGO
> - INIT / BOOTSTRAP
> - GRAPH / TUNING
> - Ring / Trees lines
> - COLL trace
> - hang / mismatch
> - NIC / IB / socket
> - P2P / SHM / NET
> - TORCH\_DISTRIBUTED\_DEBUG
> - DELIVERABLES
> - Ring / Tree 对比图
> - AllReduce probe 脚本
> - NCCL log 标注笔记
> - 故障排查清单

FIG · Day 16 全景:先建通信模型,再拆 AllReduce 算法,最后用 NCCL 日志把一次通信现场读出来

## NCCL 在训练栈里的位置

25 MIN

在 PyTorch DDP 中,你通常不会直接调用 NCCL C API。 代码里写的是 `torch.distributed.all_reduce()`, DDP 内部在 backward 时把梯度 bucket 交给 **ProcessGroupNCCL** , 后者再把集合通信发到 CUDA stream 上执行。 所以 NCCL 看起来像一个库,但工程上它更像_分布式训练的网络数据平面_。

> **图：PyTorch 到 NCCL 的调用链**
>
> - PYTORCH DISTRIBUTED TO NCCL
> - DDP backward
> - gradient bucket
> - c10d
> - ProcessGroupNCCL
> - NCCL
> - allreduce kernel
> - Transport
> - NVLink · PCIe · IB · TCP
> - THE COLLECTIVE CONTRACT
> - 所有 rank 必须以相同的 collective 语义进入同一次通信:同一种操作、兼容的数据类型、匹配的元素数量和一致的进程组。
> - 某个 rank 少调一次 all\_reduce,或 tensor shape 不一致,结果通常不是优雅报错,而是 hang、crash 或数据错误。
> - PyTorch 的 debug mode 能提前做一致性检查,但你仍然要先理解 collective 的契约。

FIG · DDP 梯度同步会落到 ProcessGroupNCCL,再由 NCCL 按拓扑选择算法和传输路径

### AllReduce 的语义

输入输出

### 每个 rank 最终拿到同一份 reduce 结果

以 sum allreduce 为例,rank 0 到 rank k-1 各自提供一段输入 buffer,最终每个 rank 的输出都是所有输入逐元素相加后的结果。这正好对应 DDP 的梯度平均前置步骤。

等价分解

### AllReduce = ReduceScatter + AllGather

很多高性能实现都可以按这个 mental model 理解:先把 reduce 结果分片散到各 rank,再把每个 rank 持有的结果分片聚合回来。Ring AllReduce 就是这个分解非常经典的实现。

通道

### channels 是并行通信车道

NCCL 会把大 buffer 分块,沿多个 channel 并行推进。日志里看到的 `Channel 00/0`、`Channel 01/0` 代表不同通道的拓扑连接。

拓扑

### 算法不是只看 rank 数

NCCL 会探测 GPU、PCIe、NVLink、NIC、NUMA 等拓扑,再做 graph search。一个 8 卡节点上,rank 顺序、GPU 亲和性、NIC 选择都会影响最终 ring/tree。

今天的核心不是背 API,而是拿到一份 NCCL log 后能说清楚:谁和谁通信、用什么算法、走哪条链路、为什么慢或为什么挂。

## Ring AllReduce:带宽优先的流水线

30 MIN

Ring 的直觉很朴素:把所有 rank 排成一个环,每个 rank 只和左右邻居通信, 大 tensor 被切成多块,沿着环一边传一边 reduce。 它的优势是_每条链路都能被持续喂满_,非常适合大梯度 bucket。 代价是通信要走 `2 * (world_size - 1)` 个逻辑阶段, rank 越多,小消息延迟越吃亏。

> **图：Ring AllReduce 示意**
>
> - RING ALLREDUCE = REDUCE-SCATTER + ALLGATHER
> - R0
> - R1
> - R2
> - R3
> - R4
> - R5
> - COST MODEL
> - 每个 rank 总通信量约为 2 \* (p - 1) / p \* message\_size,接近带宽最优;阶段数随 rank 数线性增长,小消息延迟不占优。

FIG · Ring 让每个 rank 只和相邻 rank 通信,大消息时能把链路带宽打满,但延迟随 rank 数线性增加

### Ring 的执行阶段

| 阶段 | 做什么 | 结果 | 性能特点 |
| --- | --- | --- | --- |
| ReduceScatter | 每个 rank 把一块数据发给下游,从上游接收一块并与本地对应块做 reduce | 每个 rank 拿到最终 reduce 结果的一片 | 数据持续沿环流动,链路利用率高 |
| AllGather | 每个 rank 继续沿环交换已经 reduce 完成的分片 | 所有 rank 都拥有完整 reduce 结果 | 同样是流水线式传输,适合大 tensor |
| 瓶颈 | 任何一段慢链路都会拖慢整个环;rank 多时小消息要等很多 hop | 大消息稳,小消息延迟高 | 适合大 bucket,不一定适合 metadata 或小梯度 |

看日志时,如果 Ring 被选中,你关心的是 channel 数、rank 顺序、跨节点边界和是否有某条慢链路卡住整条环。

## Tree 与双二叉树:延迟优先的扩展路径

35 MIN

Tree AllReduce 可以看成一次 Reduce 加一次 Broadcast: 先沿树把数据规约到根,再从根广播回所有 rank。 树的关键优势是通信阶段数近似随 `log2(world_size)` 增长, 所以在大规模训练和小/中等消息上,它能显著降低启动延迟。 但单棵树有根节点瓶颈,NCCL 引入的 **double binary tree** 用两棵互补二叉树把数据拆成两半,让节点负载更均衡。

> **图：双二叉树示意**
>
> - DOUBLE BINARY TREE: TWO COMPLEMENTARY TREES
> - TREE A · DATA HALF 0
> - R0
> - R1
> - R2
> - R3
> - R4
> - R5
> - R6
> - TREE B · DATA HALF 1
> - LOAD BALANCING IDEA
> - 两棵互补树分别处理一半数据。某个 rank 如果在 Tree A 是内部节点,在 Tree B 往往是叶子,避免所有压力集中在同一批 rank 上。

FIG · 双二叉树用两棵互补树同时工作,兼顾接近 Ring 的带宽和 Tree 的低延迟

### Ring、Tree、双二叉树对比

| 算法 | 核心思想 | 优势 | 代价 / 适用边界 |
| --- | --- | --- | --- |
| Ring | 排成环,分块后做 reduce-scatter + all-gather | 带宽利用率高,大 tensor 很强 | 阶段数随 rank 数线性增长,大规模小消息延迟高 |
| Tree | 树形 reduce,再树形 broadcast | 阶段数近似 log 级,小消息和大规模延迟好 | 单棵树容易有根节点负载和带宽瓶颈 |
| Double Binary Tree | 两棵互补二叉树分别处理半份数据 | 降低 Tree 的根瓶颈,保持低延迟,同时接近满带宽 | 拓扑构造更复杂,最终是否选中由 NCCL 根据消息大小和拓扑自动判断 |

### 如何让 NCCL 选择算法

```
# 默认:不要手动指定,让 NCCL 基于拓扑、消息大小和架构自动选择
torchrun --nproc_per_node=4 allreduce_probe.py

# 实验:只允许 Ring,观察大 tensor 与小 tensor 行为
NCCL_ALGO=Ring torchrun --nproc_per_node=4 allreduce_probe.py --numel 67108864

# 实验:只允许 Tree,观察日志里的 Trees / algorithm line
NCCL_ALGO=Tree torchrun --nproc_per_node=4 allreduce_probe.py --numel 262144

# NCCL 2.24+ 支持按 collective 指定算法,这里只限定 allreduce
NCCL_ALGO="allreduce:ring" torchrun --nproc_per_node=4 allreduce_probe.py
```

生产环境里不要长期固定 NCCL\_ALGO,除非你是在绕过明确的 NCCL bug 或做可复现实验;默认自动选择通常更稳。

## 读一次 NCCL\_DEBUG=INFO 日志

45 MIN

NCCL 日志不是"报错时再打开"的东西。 你应该在健康环境里先看一次完整 AllReduce 日志,建立基准印象: 正常启动会出现哪些初始化行、拓扑行、channel 行、算法/协议选择行。 之后遇到 hang 或慢训练,才知道哪里不正常。

### 推荐的日志环境变量

| 变量 | 用途 | 今天怎么用 |
| --- | --- | --- |
| `NCCL_DEBUG` | 控制日志级别: VERSION、WARN、INFO、TRACE | `NCCL_DEBUG=INFO`,够看初始化、拓扑和调优信息 |
| `NCCL_DEBUG_SUBSYS` | 过滤子系统: INIT、BOOTSTRAP、GRAPH、TUNING、COLL、NET、P2P 等 | `INIT,BOOTSTRAP,GRAPH,TUNING,COLL,ENV` |
| `NCCL_DEBUG_FILE` | 把日志写到文件,支持 `%h` 主机名和 `%p` 进程号 | `/tmp/nccl.%h.%p.log`,避免多 rank 混在 stdout |
| `TORCH_DISTRIBUTED_DEBUG` | PyTorch c10d 层的一致性和详细 debug 信息 | 排查 collective mismatch 时设为 `DETAIL` |

### AllReduce probe 脚本

```
# allreduce_probe.py
import argparse
import os
import time

import torch
import torch.distributed as dist

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--numel", type=int, default=16_777_216) # 64 MiB fp32
    parser.add_argument("--iters", type=int, default=20)
    parser.add_argument("--warmup", type=int, default=5)
    return parser.parse_args()

def main():
    args = parse_args()
    rank = int(os.environ["RANK"])
    local_rank = int(os.environ["LOCAL_RANK"])
    world_size = int(os.environ["WORLD_SIZE"])

    torch.cuda.set_device(local_rank)
    dist.init_process_group(backend="nccl")

    x = torch.full((args.numel,), fill_value=rank + 1, device="cuda", dtype=torch.float32)
    torch.cuda.synchronize()

    for _ in range(args.warmup):
        dist.all_reduce(x, op=dist.ReduceOp.SUM)
    torch.cuda.synchronize()

    start = time.perf_counter()
    for _ in range(args.iters):
        dist.all_reduce(x, op=dist.ReduceOp.SUM)
    torch.cuda.synchronize()
    elapsed_ms = (time.perf_counter() - start) * 1000 / args.iters

    expected = world_size * (world_size + 1) / 2
    ok = torch.isclose(x[0], torch.tensor(expected, device="cuda"))
    print(f"rank={rank} local_rank={local_rank} world={world_size} ms={elapsed_ms:.3f} ok={bool(ok)}")

    dist.barrier()
    dist.destroy_process_group()

if __name__ == " __main__":
    main()
```

### 启动命令

```
# 单机 4 卡,把每个 rank 日志写到独立文件
NCCL_DEBUG=INFO \
NCCL_DEBUG_SUBSYS=INIT,BOOTSTRAP,GRAPH,TUNING,COLL,ENV \
NCCL_DEBUG_FILE=/tmp/nccl.%h.%p.log \
TORCH_DISTRIBUTED_DEBUG=DETAIL \
torchrun --standalone --nproc_per_node=4 allreduce_probe.py --numel 16777216

# 看日志文件
ls -lh /tmp/nccl.*.log
sed -n '1,180p' /tmp/nccl.$(hostname).*log
```

### 日志阅读路线

01 · VERSION / ENV

### 先看 NCCL 版本和变量是否生效

确认不是"以为开了 debug,其实环境变量没传到 worker"。日志里应该能看到 NCCL version、debug level、部分 env 配置和 bootstrap 信息。

02 · BOOTSTRAP

### 看 rank 发现和网络入口

单机多卡通常走本机 bootstrap;多机时要重点看选中的 interface、IP、端口和 rank 互相发现是否完整。这里卡住通常是端口、DNS、防火墙或网卡选择问题。

03 · GRAPH

### 看 topology 和 channels

关注 Channel 行、Ring 行、Trees 行。它们告诉你 NCCL 认为哪些 rank 相邻、每个 channel 走什么连接、tree 的父子关系是什么。

04 · TUNING / COLL

### 看算法和协议选择

关注 AllReduce 对应的 algo/proto: Ring、Tree、NVLS、PAT 等算法以及 LL、LL128、Simple 协议。小消息和大消息被选成不同组合是正常的。

### 示例化日志片段怎么标注

```
# 下面是教学用的结构化片段,真实日志字段会随 NCCL 版本和机器拓扑变化
NCCL INFO Bootstrap : Using eth0:10.0.0.12<0>
NCCL INFO cudaDriverVersion 12080
NCCL INFO NCCL version 2.xx.x+cuda12.x

NCCL INFO Channel 00/04 : 0 1 2 3
NCCL INFO Channel 01/04 : 0 2 1 3
NCCL INFO Trees [0] 1/-1/-1->0->2
NCCL INFO Trees [1] 2/-1/-1->1->3

NCCL INFO AllReduce: opCount 0 sendbuff 0x... recvbuff 0x... count 16777216 datatype 7 op 0 root 0
NCCL INFO 4 coll channels, 4 nvls channels, algo Ring, proto Simple

# 标注思路:
# 1. Bootstrap 说明网络入口选了哪个 interface。
# 2. Channel 行说明每条通信车道的 rank 顺序。
# 3. Trees 行说明 tree 父子关系,可用来判断是否走树算法。
# 4. AllReduce 行确认 count、datatype、op 和最终算法/协议。
```

作业不是只保存日志,而是在日志旁边写注释:本次 AllReduce 选择了什么算法、几个 channel、走了哪些 rank 顺序、有没有异常 warning。

## NCCL 故障排查地图

35 MIN

NCCL 问题最难的一点是:症状经常只是"卡住"。 但 hang 背后可能是 collective 不一致、rank 到 GPU 映射错、网卡选错、IB 权限/驱动问题、 P2P 不通、某个 rank OOM 后其它 rank 等不到它。 排查时要分层,不要一上来乱设一堆环境变量。

| 症状 | 优先怀疑 | 证据 | 下一步 |
| --- | --- | --- | --- |
| init 就 hang | rank 发现、MASTER\_ADDR/PORT、网卡选择、防火墙 | BOOTSTRAP 日志不完整,某些 rank 没出现 | 显式设 `NCCL_SOCKET_IFNAME`,检查 torchrun 参数和网络连通性 |
| 第一轮 all\_reduce hang | 某个 rank 没进入 collective 或 tensor shape 不一致 | PyTorch debug 可能报 collective mismatch;NCCL COLL 日志 opCount 不齐 | 开 `TORCH_DISTRIBUTED_DEBUG=DETAIL`,在 collective 前打印 rank/shape |
| 单机快,多机慢 | 跨节点 NIC、IB/RDMA、rail、PXN、socket fallback | NET/GRAPH 日志显示走 TCP 或选错网卡 | 查 `NCCL_IB_HCA`、`NCCL_SOCKET_IFNAME`、驱动和容器权限 |
| 性能抖动 | 链路争用、CPU 亲和性、通道数变化、其它进程占用 GPU/NIC | 同 shape 多次运行 latency 差距大,channel 或 selected path 不稳定 | 固定进程绑核/绑卡,隔离网络,对比 nccl-tests |
| Ring 慢 Tree 快或反过来 | 消息大小和拓扑不匹配 | 强制 `NCCL_ALGO=Ring/Tree` 后曲线差异明显 | 记录不同 numel 的延迟曲线,不要只测一个点 |

### 常用变量,但别滥用

OBSERVE

### 观察类

`NCCL_DEBUG`、`NCCL_DEBUG_SUBSYS`、`NCCL_DEBUG_FILE`、`TORCH_DISTRIBUTED_DEBUG`。这些适合排查现场,但 INFO/TRACE 会产生大量日志,不要长期带在线上训练脚本里。

SELECT

### 路径选择类

`NCCL_SOCKET_IFNAME` 控制 socket interface; `NCCL_IB_HCA` 控制 RDMA HCA; `CUDA_VISIBLE_DEVICES` 控制 rank 能看到的 GPU。它们适合修正环境拓扑。

DISABLE

### 禁用类

`NCCL_P2P_DISABLE`、`NCCL_SHM_DISABLE`、`NCCL_IB_DISABLE` 可以做二分定位,但会改变通信路径。用完要撤掉,否则可能把训练长期锁在慢路径上。

TUNE

### 调优类

`NCCL_ALGO`、`NCCL_PROTO`、socket 线程数等变量会影响性能模型。NCCL 官方文档也提醒调试类变量不应永久留在生产配置里。

PYTORCH

### c10d 辅助

`TORCH_CPP_LOG_LEVEL=INFO` 加 `TORCH_DISTRIBUTED_DEBUG=DETAIL` 可以让 PyTorch 层输出更详细的 collective mismatch、调用栈和一致性检查信息。

RULE

### 一次只改一个变量

真正的排障要保留对照组。每次只改一个变量,保存命令、日志、机器拓扑和耗时结果,否则你不知道是哪一项改变了现象。

### 最小化二分流程

```
# 1. 先确认 PyTorch collective 语义没错
TORCH_DISTRIBUTED_DEBUG=DETAIL torchrun --standalone --nproc_per_node=4 allreduce_probe.py

# 2. 开 NCCL INFO,确认初始化、拓扑、算法路径
NCCL_DEBUG=INFO NCCL_DEBUG_SUBSYS=INIT,BOOTSTRAP,GRAPH,TUNING,COLL \
torchrun --standalone --nproc_per_node=4 allreduce_probe.py

# 3. 强制算法做对照,只为实验和定位
NCCL_ALGO=Ring torchrun --standalone --nproc_per_node=4 allreduce_probe.py --numel 16777216
NCCL_ALGO=Tree torchrun --standalone --nproc_per_node=4 allreduce_probe.py --numel 16777216

# 4. 逐层禁用做二分,定位 P2P / SHM / NET 问题。不要把这些变量长期留在线上。
NCCL_P2P_DISABLE=1 torchrun --standalone --nproc_per_node=4 allreduce_probe.py
NCCL_SHM_DISABLE=1 torchrun --standalone --nproc_per_node=4 allreduce_probe.py
```

## 动手实验:画出你的 AllReduce 曲线

45 MIN

今天的实验不是追求某个固定结论,而是训练你的通信直觉: 小消息看延迟,大消息看带宽;Ring 与 Tree 的交叉点会随 GPU、NVLink、PCIe、NIC、NCCL 版本变化。 你要做的是在自己的机器上跑出一张曲线,并把曲线和 NCCL 日志对应起来。

### 实验矩阵

| 维度 | 取值 | 观察什么 |
| --- | --- | --- |
| 消息大小 | 1 MiB / 16 MiB / 64 MiB / 256 MiB | 从延迟主导到带宽主导的过渡点 |
| 算法 | 默认 / Ring / Tree | NCCL 自动选择是否符合你的预期 |
| rank 数 | 2 / 4 / 8,有多机则扩到 16+ | Ring 线性延迟和 Tree log 级延迟的差异 |
| 日志 | INIT / GRAPH / TUNING / COLL | 每组曲线对应的 channel、algo、proto 是否变化 |

### 批量运行脚本

```
# run_nccl_day16.sh
set -euo pipefail

export NCCL_DEBUG=INFO
export NCCL_DEBUG_SUBSYS=INIT,GRAPH,TUNING,COLL
export NCCL_DEBUG_FILE=/tmp/nccl.%h.%p.log

for algo in DEFAULT Ring Tree; do
  for numel in 262144 4194304 16777216 67108864; do
    if ["$algo" = "DEFAULT"]; then
      unset NCCL_ALGO
    else
      export NCCL_ALGO=$algo
    fi

    echo "algo=$algo numel=$numel"
    torchrun --standalone --nproc_per_node=4 allreduce_probe.py --numel $numel --iters 50
  done
done
```

### 记录模板

| 算法 | numel | 大小 | 延迟 | 日志证据 | 解释 |
| --- | --- | --- | --- | --- | --- |
| 默认 | 262144 | 1 MiB fp32 | \_\_ ms | algo=\_\_ proto=\_\_ channels=\_\_ | 小消息是否选 Tree / LL 系列协议? |
| Ring | 16777216 | 64 MiB fp32 | \_\_ ms | algo=Ring proto=\_\_ channels=\_\_ | 大消息是否接近带宽上限? |
| Tree | 16777216 | 64 MiB fp32 | \_\_ ms | algo=Tree proto=\_\_ channels=\_\_ | 在大消息下是否输给 Ring?为什么? |

### 交付物检查清单

- 能口头解释 AllReduce 为什么可以拆成 ReduceScatter + AllGather。
- 能画出 Ring AllReduce 的数据流,并说出它为什么适合大 tensor。
- 能解释 Tree / Double Binary Tree 为什么降低大规模小消息延迟。
- 跑通 `allreduce_probe.py`,保存一份 `NCCL_DEBUG=INFO` 日志。
- 在日志上标注 bootstrap、channel、ring/tree、algo/proto、collective count 五类信息。
- 完成默认 / Ring / Tree 至少三组对比,写一句你机器上的结论。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么 DDP 梯度同步常说是 AllReduce?

ANS

数据并行里每个 rank 有一份模型副本和不同 mini-batch。backward 后每个 rank 得到本地梯度,需要把所有 rank 的梯度相加或平均,并让每个 rank 都拿到同一份结果。这个语义正是 AllReduce。

### Q2 · Ring 是不是永远比 Tree 带宽好?

ANS

不能这么绝对。Ring 的经典优势是大消息场景下链路利用率高,但真实 NCCL 会考虑拓扑、channel、协议和新算法。双二叉树可以接近满带宽并显著降低延迟。最终要看你机器上的曲线和 NCCL 日志,不要只凭算法名字下判断。

### Q3 · 为什么所有 rank 都必须调用同一个 collective?

ANS

collective 是一组 rank 协作完成的一次协议。rank 0 以为要 all\_reduce,rank 1 没进来或进了 broadcast,双方等待的消息格式和时序就不一致。底层通信库无法猜出你的意图,轻则 hang,重则 crash 或数据错误。

### Q4 · 我应该长期设置 `NCCL_DEBUG=INFO` 吗?

ANS

不建议。INFO 日志适合排查和学习,但多 rank 长训练会产生大量输出,影响可读性和部分性能。健康基线、故障现场、短压测可以开;生产训练脚本里默认关掉,最多保留 WARN。

### Q5 · NCCL 报错少,是不是只能靠猜?

ANS

不是。正确方式是分层取证:PyTorch 层开 `TORCH_DISTRIBUTED_DEBUG=DETAIL` 检查 collective 一致性,NCCL 层开 INIT/GRAPH/TUNING/COLL 看拓扑和算法,系统层查 GPU/NIC/驱动/容器权限。把问题缩到某一层后,再动对应变量。

## 复盘问题

REVIEW

1. 为什么 AllReduce 可以等价理解成 ReduceScatter + AllGather?
2. Ring AllReduce 的带宽优势和延迟劣势分别来自哪里?
3. Tree AllReduce 为什么在大规模小消息上更有优势?
4. Double Binary Tree 如何缓解单棵树的根节点瓶颈?
5. `NCCL_DEBUG_SUBSYS=GRAPH,TUNING,COLL` 分别帮你看什么?
6. 如果多机训练 init 阶段 hang,你会按什么顺序排查?
7. 为什么不建议在生产配置里长期固定 `NCCL_ALGO`?

## 参考资料

OFFICIAL DOCS

NVIDIA

### NCCL Collective Operations

官方 collective 语义说明,包括 AllReduce、Reduce、Broadcast、AllGather、ReduceScatter。
[docs.nvidia.com · Collective Operations](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html)

NVIDIA

### NCCL Environment Variables

官方环境变量说明,包括 `NCCL_DEBUG`、`NCCL_DEBUG_SUBSYS`、`NCCL_ALGO`、`NCCL_PROTO`。
[docs.nvidia.com · Environment Variables](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/env.html)

NVIDIA BLOG

### NCCL 2.4 Double Binary Trees

NVIDIA 技术博客,讲解 NCCL 2.4 引入双二叉树以获得低延迟和接近满带宽的 AllReduce。
[developer.nvidia.com · NCCL 2.4](https://developer.nvidia.com/blog/massively-scale-deep-learning-training-nccl-2-4/)

PYTORCH

### torch.distributed

PyTorch distributed 官方文档,包括 `init_process_group`、`all_reduce`、NCCL backend 和 debug 说明。
[docs.pytorch.org · torch.distributed](https://docs.pytorch.org/docs/2.12/distributed.html)

分布式训练的性能,常常藏在一行看似平平无奇的 collective 日志里。

DAY 16 COMPLETE · NEXT: DATA PARALLEL / DDP
