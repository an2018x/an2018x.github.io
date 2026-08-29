---
title: "Day 17 · 数据并行 DP/DDP"
date: '2026-06-20'
draft: false
description: "进入分布式训练的第一条主线:从 DataParallel 到 DistributedDataParallel,拆开梯度同步时机、Reducer、bucket、overlap 与 no_sync;阅读 torch/nn/parallel/distributed.py 关键路径,并用 torchrun 跑一个可观测的 DDP 实验。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - DDP
  - NCCL
  - Training
---

DAY 17 · AI INFRA ROADMAP · 60 DAYS

# 梯度的 _集体行动_

Day 15 认识了进程组和集合通信,Day 16 看清了 NCCL 的 ring/tree 路径。 今天把这两块接到真实训练里: **Data Parallel** 的本质是每张卡复制一份模型、吃不同数据、同步梯度; **DDP** 的工程价值,则是把同步拆成 bucket,在 backward 还没结束时就启动 AllReduce, 让通信尽量藏进计算时间里。今天你要读懂 `DistributedDataParallel` 的关键路径,知道什么时候同步、同步什么、为什么会卡住、怎么调 bucket 和 overlap。

**DURATION** 3 h **THEORY** 1.2 h **SOURCE** 0.8 h **HANDS-ON** 1 h **STACK** PyTorch · DDP · NCCL · torchrun · profiler

## 思维导图

OVERVIEW

> **图：Day 17 思维导图**
>
> - DAY 17 · 数据并行 DP/DDP
> - GRADIENT SYNC · BUCKET · OVERLAP · REDUCER
> - 01 · MODEL
> - DP vs DDP
> - 02 · SYNC
> - 梯度同步时机
> - 03 · BUCKET
> - bucket + overlap
> - 04 · SOURCE
> - distributed.py
> - 单进程多卡 vs 多进程
> - DistributedSampler
> - 每 rank 一份模型
> - global batch = local × world
> - autograd hook
> - grad ready → reducer
> - AllReduce(sum / world)
> - optimizer 后各 rank 一致
> - 反向顺序决定 ready
> - bucket\_cap\_mb
> - gradient\_as\_bucket\_view
> - no\_sync accumulation
> - \_\_init\_\_ / forward
> - Reducer 构造
> - prepare\_for\_backward
> - logging data
> - DELIVERABLES
> - DDP 时序图
> - torchrun 训练脚本
> - bucket 实验记录
> - 源码阅读笔记

FIG · Day 17 全景:从数据并行模型到 DDP Reducer,再到 bucket overlap 和源码入口

## DP vs DDP — 为什么生产几乎总选 DDP

25 MIN

数据并行的数学目标很简单:每张卡处理不同 mini-batch,各自算梯度, 然后把梯度平均,让所有 replica 做同一次 optimizer step。 但工程实现有两条路:`nn.DataParallel` 是单进程多线程, `DistributedDataParallel` 是多进程,每个进程绑定一张 GPU。 后者绕开 Python GIL、通信路径更清楚、可跨机扩展,也是今天真正要掌握的对象。

| 维度 | DataParallel | DistributedDataParallel | 工程结论 |
| --- | --- | --- | --- |
| 进程模型 | 单进程控制多 GPU,Python scatter/gather | 每 GPU 一个进程,各 rank 独立 forward/backward | DDP 更接近真实集群形态 |
| 通信对象 | 把输入切给多卡,输出聚回主卡 | 只同步梯度 bucket,参数在 step 后保持一致 | DDP 避免主卡成为瓶颈 |
| 扩展性 | 基本只适合单机 | 单机/多机统一,torchrun 启动 | 从 2 卡到 1024 卡都是同一抽象 |
| 性能 | GIL、主卡聚合、每 step 重复制约明显 | bucket + async AllReduce + overlap | 生产训练优先 DDP |
| 心智负担 | 入口简单,但调试隐性开销多 | 要理解 rank / sampler / collective 对齐 | DDP 更难入门,但更可控 |

### DDP 的三个不变量

INVARIANT 1

### 每个 rank 模型结构一致

参数数量、顺序、shape 必须一致。初始化时 DDP 会做参数/缓冲区同步检查;如果你关闭 `init_sync`,就要自己保证所有 rank 起点完全相同。

INVARIANT 2

### 每个 rank 执行相同通信序列

Collective 是"大家一起到场"的 API。某个 rank 少调一次 AllReduce,其它 rank 就会等它,表现为训练卡住。DDP 调试第一反应永远是:哪条 rank 走了不同分支?

INVARIANT 3

### step 后参数保持一致

DDP 默认同步的是梯度,不是每步广播参数。只要所有 rank 梯度平均一致、optimizer 状态一致、随机行为受控,step 后参数自然一致。

DDP 心智模型:数据不同、模型相同、梯度求平均、参数同轨前进。

## DDP 训练脚本的最小闭环

35 MIN

Day 15 已经跑过 `torchrun`,今天要把训练细节补齐: local rank 绑定 GPU、初始化进程组、用 DistributedSampler 切数据、 包 DDP、每个 epoch 调 `sampler.set_epoch`, 最后只让 rank 0 保存 checkpoint。

```
import os, torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler

def setup():
    local_rank = int(os.environ["LOCAL_RANK"])
    torch.cuda.set_device(local_rank)
    dist.init_process_group(backend="nccl")
    return local_rank, dist.get_rank(), dist.get_world_size()

def main():
    local_rank, rank, world_size = setup()
    device = torch.device("cuda", local_rank)

    model = TinyModel().to(device)
    model = DDP(
        model,
        device_ids=[local_rank],
        bucket_cap_mb=25,
        gradient_as_bucket_view=True,
    )
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)

    dataset = MyDataset()
    sampler = DistributedSampler(dataset, shuffle=True)
    loader = torch.utils.data.DataLoader(
        dataset,
        batch_size=32,
        sampler=sampler,
        num_workers=4,
        pin_memory=True,
    )

    for epoch in range(3):
        sampler.set_epoch(epoch) # 保证各 rank 每个 epoch 的 shuffle 不同但可对齐
        for x, y in loader:
            x = x.to(device, non_blocking=True)
            y = y.to(device, non_blocking=True)
            optimizer.zero_grad(set_to_none=True)
            loss = loss_fn(model(x), y)
            loss.backward() # DDP 在 backward 中触发梯度同步
            optimizer.step()

    if rank == 0:
        torch.save(model.module.state_dict(), "ckpt.pt")
    dist.destroy_process_group()

if __name__ == " __main__":
    main()
```

### 启动与日志

```
# 单机 4 卡
torchrun --standalone --nproc_per_node=4 train_ddp.py

# 打开分布式调试信息
TORCH_DISTRIBUTED_DEBUG=DETAIL NCCL_DEBUG=INFO \
torchrun --standalone --nproc_per_node=4 train_ddp.py

# 多机示意:每台机器都运行同一命令,只改 node_rank
torchrun \
  --nnodes=2 \
  --nproc_per_node=8 \
  --node_rank=0 \
  --master_addr=10.0.0.1 \
  --master_port=29500 \
  train_ddp.py
```

### 梯度累积:正确使用 no\_sync

```
accum = 4
for step, (x, y) in enumerate(loader):
    sync_now = ((step + 1) % accum == 0)
    ctx = model.no_sync() if not sync_now else contextlib.nullcontext()
    with ctx:
        loss = loss_fn(model(x), y) / accum
        loss.backward()
    if sync_now:
        optimizer.step()
        optimizer.zero_grad(set_to_none=True)
```

注意 1

### forward 也要放进 no\_sync

DDP 官方文档特别提醒:如果只把 `backward` 放进 `no_sync`,梯度仍可能同步。正确写法是把 forward + backward 都包在上下文里。

注意 2

### loss 要除以 accum

否则等价于把学习率放大 `accum` 倍。DDP 同步的是当前累积梯度,你要自己保证梯度尺度和不累积时一致。

## 梯度同步时机 — backward 里发生了什么

35 MIN

初学 DDP 最常见误解是"backward 完成后统一 AllReduce"。 如果真这么做,通信完全暴露在计算之后,扩展性会很差。 DDP 真正做的是:给每个参数的梯度 accumulator 挂 hook; 当某个参数梯度 ready,Reducer 记录它所在 bucket 的 ready 状态; bucket 里所有梯度都 ready 后,立刻异步发 AllReduce。

> **图：DDP backward overlap timeline**
>
> - DDP BACKWARD TIMELINE — gradient ready triggers async allreduce
> - t=0
> - optimizer.step
> - BACKWARD COMPUTE
> - layer 6 grad
> - layer 5 grad
> - layer 4 grad
> - layer 3 grad
> - layer 2/1
> - BUCKET READY
> - bucket 2 ready
> - bucket 1 ready
> - bucket 0 ready
> - ASYNC ALLREDUCE
> - NCCL AllReduce bucket 2
> - NCCL AllReduce bucket 1
> - bucket 0
> - 绿色通信条与红色 backward 计算条重叠得越多,DDP scaling 越好;最后露出的绿色尾巴就是通信瓶颈。

FIG · DDP 不等 backward 完整结束;bucket ready 就发异步 AllReduce,目标是让通信藏进反向计算

### 同步的精确语义

| 阶段 | 发生什么 | 常见误区 |
| --- | --- | --- |
| forward | DDP 准备 reducer 状态;必要时同步 buffer,比如 BatchNorm running stats | 以为 forward 完全没有 DDP 逻辑 |
| backward hook | 参数梯度 ready 后通知 Reducer;若参数未使用,需要 find\_unused\_parameters 或 static\_graph 处理 | 以为所有参数都会自然产生梯度 |
| bucket ready | bucket 内所有梯度 ready,把 flat buffer 发给 NCCL AllReduce | 以为每个参数单独 AllReduce |
| AllReduce | 默认语义等价于对各 rank 梯度求和再除以 world\_size | 忘记 global batch 变化会改变优化器超参 |
| optimizer.step | 所有 bucket 通信完成后,每个 rank 使用相同梯度更新本地参数 | 以为 DDP 每步还要广播参数 |

调性能时盯 overlap;调正确性时盯所有 rank 是否执行同样的 forward/backward/collective 序列。

## bucket 与 overlap — DDP 性能的核心旋钮

35 MIN

DDP 的 bucket 是一组参数梯度的扁平 buffer。bucket 太小,AllReduce 次数多、launch overhead 高; bucket 太大,要等很久才 ready,overlap 变差。 默认 `bucket_cap_mb` 常见值是 25 MiB,但最优值取决于模型层大小、网络带宽、反向计算时间和 batch size。

bucket\_cap\_mb

### 控制 bucket 上限

小 bucket 更早 ready,overlap 机会更多,但通信调用变多;大 bucket 带宽利用率更高,但可能等到 backward 尾部才开始同步。调参目标不是"越大越好",而是让通信尾巴最短。

gradient\_as\_bucket\_view

### 减少梯度复制与峰值显存

开启后,参数的 `.grad` 可以成为 bucket buffer 的 view,节省一份梯度大小的峰值显存,并减少 grad 到 bucket 的 copy。代价是不能对 grad 调 `detach_()`。

find\_unused\_parameters

### 动态图的保险,也是开销

如果某些参数并非每轮都参与 loss,DDP 需要遍历 autograd graph 预先标记 unused 参数。静态模型上不要无脑开;能确定图稳定时,优先考虑 `static_graph=True`。

static\_graph

### 告诉 DDP 图不会变

如果每轮使用的参数集合和控制流都不变,DDP 可以跳过部分图搜索,并更好支持 activation checkpointing 等复杂场景。可用 `_get_ddp_logging_data()` 看是否能设置。

### 四组实验记录法

```
# 只改 bucket_cap_mb,其它都固定
for cap in 6 12 25 50; do
  TORCH_DISTRIBUTED_DEBUG=DETAIL NCCL_DEBUG=WARN \
  torchrun --standalone --nproc_per_node=4 train_ddp.py --bucket-cap-mb $cap
done
```

| 记录项 | 怎么拿 | 如何解释 |
| --- | --- | --- |
| step time p50/p95 | 训练 loop 自己打点,前 20 step 预热后统计 | p95 高说明 rank 间不均衡或通信尾巴明显 |
| GPU 利用率 | nvidia-smi dmon / DCGM / profiler | backward 末尾掉利用率通常是等待 AllReduce |
| NCCL 调用数 | NCCL\_DEBUG=INFO 或 profiler trace | bucket 越小调用越多;太多会吃 launch overhead |
| overlap 形状 | torch.profiler + Chrome trace | 看 NCCL kernel 是否嵌在 backward kernel 之间,还是堆在尾部 |
| ddp\_logging\_data | `model._get_ddp_logging_data()` | 看 bucket size、unused 参数、是否可 static\_graph |

```
ddp_data = model._get_ddp_logging_data()
if dist.get_rank() == 0:
    for key in [
        "bucket_sizes",
        "avg_backward_comm_time",
        "avg_backward_compute_comm_overlap_time",
        "can_set_static_graph",
    ]:
        print(key, ddp_data.get(key))
```

bucket 调参不是背默认值,而是在 profiler 里把绿色 NCCL 条尽量塞进红色 backward 条下面。

## 源码阅读路线 — distributed.py 关键路径

45 MIN

`torch/nn/parallel/distributed.py` 是 Python 外壳, 真正高性能同步逻辑在 C++ Reducer 和 c10d/NCCL 后端里。 读源码时不要从第 1 行硬啃,按"构造时做了什么、forward 前后做了什么、backward hook 何时触发、调试信息怎么拿"四条线读。

| 入口 | 读什么 | 带着什么问题读 |
| --- | --- | --- |
| ` __init__ ` | 参数检查、device 约束、process\_group、bucket 参数、是否广播初始权重 | DDP 为什么要求每 rank 参数顺序和 shape 一致? |
| `_ddp_init_helper` | 构建参数列表、bucket assignment、创建 Reducer | bucket 是按什么顺序组织的?为什么和 backward ready 顺序有关? |
| `forward` | 调用 wrapped module 前后对 reducer 状态的准备 | 为什么 no\_sync 要包住 forward? |
| `Reducer` | C++ 侧 autograd hook、mark\_variable\_ready、mark\_bucket\_ready、finalize\_backward | 梯度 ready 后如何触发异步 AllReduce? |
| `no_sync` | 临时设置 require\_backward\_grad\_sync=False | 梯度累积时到底跳过了哪一步? |
| `register_comm_hook` | 用户自定义 bucket 通信策略 | PowerSGD、压缩、debug hook 如何接入? |
| `_get_ddp_logging_data` | DDP 内部统计项 | 如何判断是否能开 static\_graph、通信是否成为瓶颈? |

### 源码心智伪代码

```
# 这不是 PyTorch 原源码,是读 distributed.py 时的心智压缩版
class DistributedDataParallel:
    def __init__ (self, module, bucket_cap_mb=25, ...):
        self.module = module
        self.process_group = default_pg
        self.parameters = list(module.parameters())
        self.reducer = Reducer(
            parameters=self.parameters,
            bucket_bytes_cap=bucket_cap_mb * 1024 * 1024,
            process_group=self.process_group,
        )
        self._register_autograd_hooks()
        self._sync_module_states()

    def forward(self, *args, **kwargs):
        self.reducer.prepare_for_forward()
        out = self.module(*args, **kwargs)
        if self.require_backward_grad_sync:
            self.reducer.prepare_for_backward(out)
        return out

    # autograd 在每个参数 grad ready 时调用
    def on_grad_ready(param):
        bucket = self.reducer.bucket_for(param)
        bucket.mark_ready(param)
        if bucket.all_ready():
            bucket.work = dist.all_reduce(bucket.buffer, async_op=True)

    def finalize_backward(self):
        for bucket in self.buckets:
            bucket.work.wait()
            bucket.buffer.div_(world_size)
            bucket.copy_back_to_param_grads()
```

读源码的目标不是记住每个分支,而是能把 Python wrapper、C++ Reducer、NCCL collective 三层串成一条因果链。

## 常见疑问

5 QUESTIONS

### Q1 · DDP 同步的是参数还是梯度?

ANS

训练热路径同步的是梯度。初始化时 DDP 会让各 rank 参数/缓冲区对齐;之后每个 backward 把梯度 bucket 做 AllReduce 平均。只要 optimizer 和随机行为一致,每个 rank 本地 step 后参数自然一致。

这也是为什么某个 rank 多跑/少跑一步、某个参数没有梯度、或者 optimizer 状态不同,都可能导致参数漂移或直接 hang。

### Q2 · 为什么 DDP 会卡住不报错?

ANS

大概率是 collective 序列不一致:某些 rank 进入了 AllReduce,另一些 rank 没进入。常见原因包括数据条数不均匀、某 rank OOM 后退出、条件分支导致某些参数未参与 loss、只在 rank0 做了本该所有 rank 都做的通信。

排查时打开 `TORCH_DISTRIBUTED_DEBUG=DETAIL` 和 `NCCL_DEBUG=INFO`,再确认每个 rank 每步 batch 数、loss 分支、forward/backward 次数都一致。

### Q3 · bucket 越大是不是带宽利用率越高,所以越好?

ANS

不一定。大 bucket 的确更容易跑满网络带宽,但它需要等更多梯度 ready 才能启动通信,overlap 可能变差。小 bucket 启动早,但调用次数多,launch overhead 和 NCCL 调度开销会变大。

正确做法是 profiler 里看通信尾巴。最好的 bucket 大小不是吞吐最大的一次 AllReduce,而是端到端 step time 最短的那个点。

### Q4 · 什么时候需要 find\_unused\_parameters=True?

ANS

当某些参数在某些 iteration 不参与 loss 时需要。例如多任务模型只激活部分 head、MoE 条件路由、或者 forward 返回里有分支没有用于 loss。DDP 必须知道这些参数本轮不会产生梯度,否则会一直等对应 hook。

代价是每轮遍历 autograd graph。若使用的参数集合固定,优先考虑 `static_graph=True` 或重新整理模型分支。

### Q5 · DDP 和 ZeRO/FSDP 的关系是什么?

ANS

DDP 是数据并行的基础形态:每张卡都有完整模型、完整梯度、完整 optimizer state。它简单、稳定、吞吐好,但显存复制严重。

Day 18 的 ZeRO/FSDP 会把 optimizer state、gradient、parameter 逐级切分到不同 rank,目标是解决 DDP 的显存复制问题。可以把 DDP 理解成"同步策略",ZeRO/FSDP 是在此基础上进一步做"状态切分"。

## 复盘问题

5 QUESTIONS

1. 用一张时序图解释 DDP backward 中的梯度同步:参数 grad ready、bucket ready、异步 AllReduce、copy back、optimizer.step 分别在什么时候发生。
2. 对比 `nn.DataParallel` 和 `DistributedDataParallel`:进程模型、通信对象、性能瓶颈、扩展性分别有什么不同。
3. 解释 `bucket_cap_mb` 太小和太大分别会带来什么问题,并设计一个 profiler 实验找到更好的值。
4. 说明 `no_sync` 的正确使用方式,为什么 forward 必须放进上下文,以及 loss 为什么要除以 accumulation steps。
5. 按源码阅读路线列出 `distributed.py` 的 6 个入口,说明每个入口回答 DDP 的哪个核心问题。

## 今日检查清单

8 ITEMS

- 能解释为什么生产训练优先 DDP 而不是 `nn.DataParallel`
- 能写出 torchrun + init\_process\_group + local\_rank 绑定 GPU 的最小模板
- 能正确使用 `DistributedSampler` 和 `sampler.set_epoch(epoch)`
- 能说清 DDP 在 backward 中通过 autograd hook 触发 bucket AllReduce
- 能解释 bucket、overlap、communication tail 三个概念
- 能用 `no_sync` 做梯度累积,且知道 forward 必须包进去
- 能用 `_get_ddp_logging_data()` 和 profiler 判断是否能开 `static_graph`
- 能按 `distributed.py` → C++ Reducer → NCCL 的层次阅读一次 DDP 关键路径

## 推荐阅读

5 ITEMS

MUST READ

### PyTorch DistributedDataParallel API

重点读构造参数:`bucket_cap_mb`、`find_unused_parameters`、`gradient_as_bucket_view`、`static_graph`、`no_sync`、`register_comm_hook`。

SOURCE

### torch/nn/parallel/distributed.py

按今天的路线读:构造、forward、no\_sync、comm hook、logging data。不要陷入每个兼容分支,先抓住 Python wrapper 与 Reducer 的交界。

OFFICIAL

### PyTorch DDP Communication Hooks

理解 DDP 可扩展点:PowerSGD、fp16/bf16 compression、debug noop hook。先知道 hook 的签名和 Future 语义,后面做通信压缩时会用上。

DEBUG

### TORCH\_DISTRIBUTED\_DEBUG 与 NCCL\_DEBUG

训练 hang、unused param、bucket 重建、collective 对不齐时,这两个环境变量是第一现场。今天至少打开一次,把日志和时序图对应起来。

PRACTICE

### torch.profiler + Chrome Trace

DDP 性能优化必须看 trace:backward kernel、NCCL kernel、optimizer kernel 的相对位置,比单看 step time 更可靠。

## Day 18 预告

NEXT

COMING NEXT

### ZeRO 系列 — 从复制状态到切分状态

DDP 的吞吐模型很漂亮,但它复制了三份大头:参数、梯度、optimizer state。Day 18 进入 ZeRO:ZeRO-1 切 optimizer state,ZeRO-2 再切 gradient,ZeRO-3 连 parameter 也切。理解这三刀之后,你就能看懂 DeepSpeed/FSDP 为什么能训练 DDP 放不下的大模型。

"DDP 的精髓不是把梯度同步做对,而是把同步藏到计算还在进行的时候。"

DAY 17 · AI INFRA 60-DAY ROADMAP
