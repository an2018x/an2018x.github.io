---
title: "Day 15 · 分布式基础"
date: '2026-06-20'
draft: false
description: "进入 AI Infra 分布式训练阶段:理解进程组、rank/world_size、torchrun 启动模型,掌握 AllReduce、AllGather、ReduceScatter、Broadcast 四类集合通信,并跑通一个 DDP MNIST。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - DDP
  - NCCL
  - AI Infra
---

DAY 15 · AI INFRA ROADMAP · 60 DAYS

# 让一张卡变成 _一队卡_

Day 15 开始进入分布式训练 Infra。今天不急着上 Megatron 或 DeepSpeed, 先把底层坐标系打牢:什么是进程组,什么是 global rank / local rank / world size, `torchrun` 到底帮你注入了哪些环境变量, 以及 AllReduce、AllGather、ReduceScatter、Broadcast 这四个集合通信分别在训练里承担什么角色。 最后的动手目标很朴素:用 **DistributedDataParallel** 跑通一个 MNIST 训练。

**DURATION** 3 h **THEORY** 1 h **HANDS-ON** 1.5 h **DEBUG** 0.5 h **STACK** torchrun · DDP · NCCL · CUDA

## 思维导图

OVERVIEW

> **图：Day 15 分布式基础思维导图**
>
> - DAY 15 · 分布式基础
> - PROCESS GROUP · RANK · TORCHRUN · COLLECTIVES · DDP
> - 01 · MODEL
> - 分布式坐标系
> - 02 · LAUNCH
> - torchrun 启动
> - 03 · COMM
> - 集合通信
> - 04 · DDP
> - DDP MNIST
> - process group
> - rank / world\_size
> - local\_rank / node\_rank
> - backend: nccl / gloo
> - --standalone
> - --nproc\_per\_node
> - MASTER\_ADDR / PORT
> - 环境变量注入
> - AllReduce
> - AllGather
> - ReduceScatter
> - Broadcast
> - DistributedSampler
> - DDP(model)
> - loss.backward()
> - 梯度 AllReduce
> - DELIVERABLES
> - rank 坐标系图
> - 4 个 collective demo
> - DDP MNIST 脚本
> - 分布式排错清单

FIG · Day 15 全景:先建立分布式坐标系,再掌握启动、通信和 DDP 最小闭环

## 分布式训练的坐标系

35 MIN

单机训练只有一个 Python 进程。DDP 的基本形态是 **每张 GPU 一个进程** : 每个进程持有一份完整模型,只吃自己那份数据,反向传播后通过集合通信同步梯度。 所以学习分布式的第一件事,不是模型结构,而是认清"我这个进程是谁,它站在哪张卡上,它和谁通信"。

GLOBAL RANK

### 全局进程序号

从 0 到 `world_size - 1`。日志、checkpoint、主进程判断通常都用 global rank。习惯上 rank 0 负责保存模型和打印全局指标。

LOCAL RANK

### 本机 GPU 序号

当前进程在本节点内对应哪张 GPU。单机 8 卡时 local rank 通常是 0–7,代码里用它调用 `torch.cuda.set_device`。

WORLD SIZE

### 总进程数

等于所有节点上的训练进程总数。单机 4 卡就是 4,双机每机 8 卡就是 16。它决定 collective 里有多少参与者。

PROCESS GROUP

### 通信组

一组可以互相通信的进程。默认组包含所有 rank,后面做 tensor parallel / pipeline parallel 时会创建更小的子组。

### 单机 4 卡的最小图

> **图：单机四卡 rank 映射**
>
> - ONE NODE · FOUR PROCESSES · FOUR GPUS
> - node\_rank = 0 · world\_size = 4
> - rank 0
> - local\_rank 0 · cuda:0
> - rank 1
> - local\_rank 1 · cuda:1
> - rank 2
> - local\_rank 2 · cuda:2
> - rank 3
> - local\_rank 3 · cuda:3
> - default process group: ranks 0,1,2,3

FIG · DDP 推荐一个进程绑定一张 GPU,不要在一个进程里同时驱动多张卡

## torchrun 启动模型

35 MIN

`torchrun` 的职责是把同一个 Python 脚本启动成多个进程, 并为每个进程设置好 `RANK`、`LOCAL_RANK`、 `WORLD_SIZE`、`MASTER_ADDR`、`MASTER_PORT` 等环境变量。 你的脚本只要读取这些变量,初始化进程组,就能进入分布式世界。

```
# 单机 4 卡启动。--standalone 会自动处理 rendezvous 地址和端口
torchrun --standalone --nproc_per_node=4 train.py

# 单机只用第 0、1 张卡
CUDA_VISIBLE_DEVICES=0,1 torchrun --standalone --nproc_per_node=2 train.py

# 双机示意。两台机器必须使用同一个 master 地址、端口和 nnodes
torchrun --nnodes=2 --node_rank=0 --nproc_per_node=8 \
  --master_addr=10.0.0.1 --master_port=29500 train.py

torchrun --nnodes=2 --node_rank=1 --nproc_per_node=8 \
  --master_addr=10.0.0.1 --master_port=29500 train.py
```

### 训练脚本骨架

```
import os
import torch
import torch.distributed as dist

def setup_distributed():
    dist.init_process_group(backend="nccl")
    local_rank = int(os.environ["LOCAL_RANK"])
    rank = int(os.environ["RANK"])
    world_size = int(os.environ["WORLD_SIZE"])
    torch.cuda.set_device(local_rank)
    device = torch.device("cuda", local_rank)
    return rank, local_rank, world_size, device

def cleanup():
    dist.destroy_process_group()

if __name__ == " __main__":
    rank, local_rank, world_size, device = setup_distributed()
    print(f"rank={rank} local_rank={local_rank} world_size={world_size} device={device}")
    cleanup()
```

| 变量 | 含义 | 典型用途 |
| --- | --- | --- |
| RANK | 当前进程在全局通信组里的编号 | 判断是否 rank 0,日志打点,checkpoint 保存 |
| LOCAL\_RANK | 当前进程在本节点上的编号 | `torch.cuda.set_device(local_rank)`,绑定 GPU |
| WORLD\_SIZE | 参与训练的总进程数 | 计算全局 batch size、通信参与者数量 |
| MASTER\_ADDR / PORT | rendezvous 地址和端口 | 所有 rank 通过它找到彼此,端口冲突会直接挂住 |

## 四个集合通信

45 MIN

分布式训练的很多高级技术,都能拆成少数几个 collective。 今天只需要掌握四个:AllReduce 用来同步梯度,AllGather 用来拼完整张量, ReduceScatter 用来"先聚合再切分",Broadcast 用来把 rank 0 的状态发给所有人。

| Collective | 输入输出直觉 | 训练中的位置 |
| --- | --- | --- |
| AllReduce | 每个 rank 有一份张量,先 reduce 求和/平均,再把结果发回每个 rank。 | DDP 梯度同步核心:每张卡算自己的梯度,step 前把梯度平均。 |
| AllGather | 每个 rank 有一块分片,所有 rank 收到拼起来的完整集合。 | 收集不同 rank 的 embedding、logits、参数分片或评估结果。 |
| ReduceScatter | 先对所有 rank 的输入做 reduce,再把结果按块分发给不同 rank。 | ZeRO / FSDP 常用:梯度聚合后每个 rank 只保留自己负责的 shard。 |
| Broadcast | 一个源 rank 持有张量,把它复制给所有 rank。 | 初始化参数、加载 checkpoint、同步配置或随机种子。 |

### collectives\_lab.py

```
import os
import torch
import torch.distributed as dist

dist.init_process_group("nccl")
rank = dist.get_rank()
world_size = dist.get_world_size()
local_rank = int(os.environ["LOCAL_RANK"])
torch.cuda.set_device(local_rank)
device = torch.device("cuda", local_rank)

# 1. AllReduce:所有 rank 最终都拿到 0+1+...+(world_size-1)
x = torch.tensor([float(rank)], device=device)
dist.all_reduce(x, op=dist.ReduceOp.SUM)
print(rank, "all_reduce", x.item())

# 2. AllGather:每个 rank 收集所有 rank 的值
y = torch.tensor([rank], device=device)
gathered = [torch.zeros_like(y) for _ in range(world_size)]
dist.all_gather(gathered, y)
print(rank, "all_gather", [t.item() for t in gathered])

# 3. Broadcast:rank 0 的 2026 发给所有人
z = torch.tensor([2026 if rank == 0 else -1], device=device)
dist.broadcast(z, src=0)
print(rank, "broadcast", z.item())

# 4. ReduceScatter:每个 rank 得到 reduce 后的一块
inp = torch.arange(world_size * 2, device=device, dtype=torch.float32) + rank * 100
out = torch.empty(2, device=device)
dist.reduce_scatter_tensor(out, inp, op=dist.ReduceOp.SUM)
print(rank, "reduce_scatter", out.tolist())

dist.destroy_process_group()
```

```
# 运行
torchrun --standalone --nproc_per_node=4 collectives_lab.py
```

今天先看输入输出形态。Day 16 会打开 NCCL\_DEBUG 日志,看 ring、tree、channel 这些实现细节。

## DDP MNIST 最小闭环

60 MIN

DDP 的关键改动只有四处:初始化进程组、绑定当前 GPU、用 `DistributedSampler` 切数据、用 `DistributedDataParallel` 包住模型。之后你仍然写普通的 forward、loss、backward、optimizer step。

```
import os
import argparse
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader
from torch.utils.data.distributed import DistributedSampler
from torchvision import datasets, transforms

class Net(nn.Module):
    def __init__ (self):
        super(). __init__ ()
        self.conv1 = nn.Conv2d(1, 32, 3, 1)
        self.conv2 = nn.Conv2d(32, 64, 3, 1)
        self.fc1 = nn.Linear(9216, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.max_pool2d(x, 2)
        x = torch.flatten(x, 1)
        x = F.relu(self.fc1(x))
        return self.fc2(x)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=128)
    args = parser.parse_args()

    dist.init_process_group("nccl")
    rank = dist.get_rank()
    local_rank = int(os.environ["LOCAL_RANK"])
    world_size = dist.get_world_size()
    torch.cuda.set_device(local_rank)
    device = torch.device("cuda", local_rank)

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    dataset = datasets.MNIST("./data", train=True, download=True, transform=transform)
    sampler = DistributedSampler(dataset, num_replicas=world_size, rank=rank, shuffle=True)
    loader = DataLoader(
        dataset,
        batch_size=args.batch_size,
        sampler=sampler,
        num_workers=2,
        pin_memory=True
    )

    model = Net().to(device)
    model = DDP(model, device_ids=[local_rank], output_device=local_rank)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

    for epoch in range(args.epochs):
        sampler.set_epoch(epoch)
        model.train()
        total_loss = 0.0
        for step, (data, target) in enumerate(loader):
            data = data.to(device, non_blocking=True)
            target = target.to(device, non_blocking=True)
            optimizer.zero_grad(set_to_none=True)
            logits = model(data)
            loss = F.cross_entropy(logits, target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg = torch.tensor([total_loss / len(loader)], device=device)
        dist.all_reduce(avg, op=dist.ReduceOp.SUM)
        avg = avg.item() / world_size
        if rank == 0:
            print(f"epoch={epoch} avg_loss={avg:.4f}")

    if rank == 0:
        torch.save(model.module.state_dict(), "mnist_ddp.pt")
    dist.destroy_process_group()

if __name__ == " __main__":
    main()
```

```
# 运行。没有 torchvision 时先安装对应 PyTorch 版本的 torchvision
torchrun --standalone --nproc_per_node=2 train_ddp_mnist.py --epochs 2

# 常用调试环境变量
NCCL_DEBUG=INFO TORCH_DISTRIBUTED_DEBUG=DETAIL \
torchrun --standalone --nproc_per_node=2 train_ddp_mnist.py
```

DELIVERABLE

### 今天的交付物

提交一个 `train_ddp_mnist.py` 和一份 `day15_distributed_notes.md`:包含 rank/local\_rank/world\_size 图、四个 collective 的输入输出例子、DDP MNIST 的运行日志、一次打开 `NCCL_DEBUG=INFO` 后的关键日志摘录。

检查点

### 什么算跑通

每个 rank 都能打印自己的坐标,collectives demo 输出符合预期,DDP MNIST 能完成至少 2 个 epoch,且只有 rank 0 保存 checkpoint。出现卡住时能判断是端口、GPU 绑定、数据下载还是 collective 不匹配。

## 排错清单

25 MIN

HANG

### 程序卡住不退出

最常见原因是某些 rank 没有走到同一个 collective。比如 rank 0 调了 `all_reduce`,rank 1 提前 return。所有 rank 的 collective 顺序和次数必须完全一致。

GPU BINDING

### 多个进程挤到同一张卡

检查是否调用 `torch.cuda.set_device(local_rank)`,以及 `CUDA_VISIBLE_DEVICES` 是否让 local rank 和物理 GPU 映射错位。

PORT

### master port 冲突

单机多次实验时 29500 可能被占。换端口: `--master_port=29511`。多机时所有节点必须使用同一个 master 地址和端口。

DATA

### 数据集重复或不均匀

训练集要用 `DistributedSampler`,并在每个 epoch 调 `sampler.set_epoch(epoch)`,否则 shuffle 在各 rank 上可能不一致。

LOGGING

### 日志刷屏

所有 rank 都会执行同一份脚本。保存 checkpoint、打印全局指标、写 TensorBoard 时,默认只让 rank 0 做。

BACKEND

### NCCL / Gloo 选错

GPU 训练用 `nccl`,CPU demo 可用 `gloo`。Apple Silicon 或无 CUDA 环境不要强行用 NCCL。

## 常见疑问

5 QUESTIONS

### Q1 · DDP 是不是把模型切到多张卡上?

ANS

不是。DDP 是数据并行,每个 rank 都有一份完整模型,只是吃不同的数据分片。反向传播后,DDP 用 AllReduce 把各 rank 的梯度平均,这样每个 rank 的参数更新保持一致。

真正把模型参数切开的是 tensor parallel、pipeline parallel、ZeRO/FSDP 等后续主题。

### Q2 · global batch size 怎么算?

ANS

最常见定义是 `global_batch = per_rank_batch * world_size * gradient_accumulation_steps`。如果单卡 batch 不变,从 1 卡扩到 8 卡,全局 batch 会变成 8 倍,学习率和 warmup 可能也要跟着调。

今天 MNIST 可以不深究调参,但训练大模型时这个公式非常重要。

### Q3 · 为什么要 DistributedSampler,不能每个 rank 都读全量数据吗?

ANS

如果每个 rank 都读全量数据,那 8 张卡只是在重复训练同一个 batch,吞吐看似增加,有效数据量没有增加。`DistributedSampler` 会把 dataset 按 rank 切开,让每个进程看到不同样本。

`sampler.set_epoch(epoch)` 用来让每轮 shuffle 的随机种子变化,否则每个 epoch 的样本顺序可能固定。

### Q4 · AllReduce 和 ReduceScatter 有什么关系?

ANS

AllReduce 可以理解成 ReduceScatter 加 AllGather:先 reduce 后每个 rank 拿一块,再把所有块 gather 回每个 rank。DDP 需要每个 rank 都拿到完整平均梯度,所以用 AllReduce。

ZeRO/FSDP 想让每个 rank 只保存一部分梯度或参数,所以更偏好 ReduceScatter / AllGather 的组合。

### Q5 · 为什么只有 rank 0 保存 checkpoint?

ANS

DDP 下每个 rank 的模型参数在 optimizer step 后应该一致,所以单纯数据并行场景让 rank 0 保存一份就够。所有 rank 一起写同一个文件还可能造成覆盖和文件系统压力。

后面学 ZeRO/FSDP 后会遇到分片 checkpoint,那时每个 rank 可能都要保存自己的 shard,这是另一套问题。

## 复盘问题

6 QUESTIONS

1. 画出单机 4 卡和双机每机 4 卡时,global rank、local rank、node rank、world size 的对应关系。
2. 说明 `torchrun --standalone --nproc_per_node=4 train.py` 会启动几个进程,每个进程能读到哪些关键环境变量。
3. 用一个小张量例子解释 AllReduce、AllGather、ReduceScatter、Broadcast 四个 collective 的输入输出。
4. DDP 训练里,为什么 forward 不通信,backward 后却会触发梯度通信?
5. 为什么 DDP 训练集需要 DistributedSampler,验证集和测试集在什么情况下也需要分布式采样?
6. 列出 5 个 DDP 卡住或报错时的排查点,并说明你会先看哪一个日志或环境变量。

## 今日检查清单

10 ITEMS

- 能解释 process group、rank、local rank、world size、backend 的含义
- 能用 `torchrun` 启动单机多进程训练
- 能在脚本里正确读取 `LOCAL_RANK` 并绑定 GPU
- 能跑通 AllReduce、AllGather、ReduceScatter、Broadcast 四个最小 demo
- 知道 AllReduce 为什么是 DDP 梯度同步的核心
- 能把普通 DataLoader 改成 DistributedSampler + DataLoader
- 能用 DDP 包住模型,并理解 `model.module` 的用途
- 能只让 rank 0 打印全局日志和保存 checkpoint
- 能打开 `NCCL_DEBUG=INFO` 和 `TORCH_DISTRIBUTED_DEBUG=DETAIL` 做初步排错
- 能跑通一个 DDP MNIST,并记录每个 rank 的启动日志和最终 loss

## 推荐阅读

5 ITEMS

MUST READ

### PyTorch Distributed Overview

官方分布式总览,重点看 process group、backend、collective communication 和 DDP 的关系。今天所有概念都能在这篇里找到定位。

TUTORIAL

### Getting Started with Distributed Data Parallel

PyTorch 官方 DDP 入门教程。重点关注初始化、模型包装、数据采样、保存 checkpoint 这四个环节。

COMMAND

### torchrun Elastic Launch 文档

理解 `--standalone`、`--nnodes`、`--node_rank`、`--nproc_per_node`、master address/port 的语义。

SOURCE

### torch/csrc/distributed 与 torch/distributed

今天不要求读源码,但可以先知道 Python API 下方连接的是 c10d、ProcessGroupNCCL 和 NCCL 后端。Day 16 再深入。

REVIEW

### Day 07 网络与 NCCL 复盘

回看 NVLink、PCIe、RDMA、NCCL 的基础概念。今天的 collective 是 API 视角,明天会进入 ring/tree 算法和 NCCL 日志。

## Day 16 预告

NEXT

COMING NEXT

### NCCL 深入 — ring · tree · 双二叉树 · NCCL\_DEBUG 日志

今天我们把 collective 当 API 使用。Day 16 会把黑盒打开: AllReduce 为什么可以用 ring,小消息为什么 tree 更快,NCCL 如何选择 channel, `NCCL_DEBUG=INFO` 里每一段 log 应该怎么看。到那时,通信慢不再只是"网络问题"四个字。

"分布式训练的第一步,不是更多 GPU,而是每个进程都知道自己是谁。"

DAY 15 · AI INFRA 60-DAY ROADMAP
