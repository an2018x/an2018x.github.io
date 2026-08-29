---
title: "Day 24 · Checkpoint 与容错"
date: '2026-06-20'
draft: false
description: "学习分布式训练中的 checkpoint 与容错:理解 DCP 分片保存、异步保存、训练中断恢复、torchrun elastic restart,并建立可恢复训练的状态清单与演练流程。"
toc: true
tags:
  - AI
  - PyTorch
  - Distributed
  - Checkpoint
  - DCP
  - Elastic Training
  - Training
---

DAY 24 · AI INFRA ROADMAP · 60 DAYS

# 让训练 _摔倒后能站起来_

Day 24 进入训练可靠性。大模型训练跑几天甚至几周,中途遇到 OOM、节点故障、网络抖动、抢占、磁盘满都很正常。 Checkpoint 的价值不是"保存一下模型",而是让一个分布式训练任务在中断后 **尽量少丢进度、尽量自动恢复、尽量不阻塞训练热路径** 。 今天学习 PyTorch Distributed Checkpoint(DCP)、异步保存、训练中断恢复和 `torchrun` elastic restart。

**DURATION** 3 h **THEORY** 0.8 h **HANDS-ON** 1.5 h **DRILL** 0.5 h **STACK** PyTorch DCP · torchrun · DDP/FSDP · Object Storage

## 思维导图

OVERVIEW

> **图：Day 24 Checkpoint 与容错思维导图**
>
> - DAY 24 · Checkpoint 与容错
> - DCP · ASYNC SAVE · RESUME · ELASTIC · STORAGE
> - 01 · STATE
> - 保存什么
> - 02 · DCP
> - 分布式保存
> - 03 · ASYNC
> - 异步保存
> - 04 · RECOVER
> - 恢复与弹性
> - model / optimizer
> - scheduler / scaler
> - step / epoch
> - rng / sampler
> - multi-rank save
> - sharded files
> - resharding load
> - stateful wrapper
> - critical path
> - CPU staging
> - future 管理
> - latest 原子指针
> - resume sanity
> - torchrun restart
> - membership changes
> - failure drill
> - DELIVERABLES
> - 状态清单
> - DCP save/load demo
> - async checkpoint 模板
> - 故障恢复演练报告

FIG · Day 24 全景:从"保存什么"到"自动重启后能不能继续训练"

## Checkpoint 到底保存什么

35 MIN

只保存模型权重只能用于推理或微调初始化,不能严格恢复训练。 一个可恢复训练 checkpoint 必须保存所有会影响后续参数更新的状态: 模型、优化器、学习率调度器、混合精度 scaler、训练步数、随机数状态、sampler 进度、数据版本和配置。 少任何一项,都可能让恢复后的 loss 曲线发生微妙偏移。

| 状态 | 为什么要保存 | 漏掉的后果 |
| --- | --- | --- |
| model | 参数本体,ZeRO/FSDP 下可能是 sharded state dict。 | 无法恢复模型,或 rank 间参数不一致。 |
| optimizer | AdamW 的 m/v、step 计数等决定下一次更新。 | 恢复后像重新 warmup optimizer,loss 可能抖动。 |
| scheduler | 学习率与 step/epoch 绑定。 | LR 跳回错误位置,训练曲线断层。 |
| grad scaler | FP16 AMP 的动态 loss scale 状态。 | 恢复后可能连续 overflow 或 scale 过小。 |
| step / epoch | 决定日志、评估、保存、LR、数据位置。 | 重复训练或跳过一段数据。 |
| RNG / sampler | 影响 dropout、数据 shuffle、augmentation。 | 无法复现,数据顺序变化,debug 困难。 |
| config / data version | 恢复时校验模型结构、tokenizer、数据切分一致。 | 静默加载到错误实验,这是最讨厌的一类事故。 |

经验:checkpoint 目录里除了权重,还要有 metadata.json。它记录 git commit、启动命令、world size、parallel size、数据版本和保存完成标记。

## DCP: 分布式 checkpoint

45 MIN

单卡时代常用 `torch.save` 把一个 state dict 写成单文件。 大模型分布式训练不同:参数和 optimizer state 可能被 FSDP/ZeRO 分片,单个 rank 聚合完整权重会慢、占内存、甚至 OOM。 PyTorch Distributed Checkpoint(DCP) 支持多 rank 并行保存和加载,并支持在加载时按当前并行拓扑重新分片。

并行写

### 每个 rank 写自己的 shard

DCP checkpoint 通常是一个目录,里面有多个文件,至少每个 rank 一份。它避免 rank 0 成为保存瓶颈。

原地加载

### 先建模型再 load

DCP load 会利用当前模型 state\_dict 的预分配存储和分片信息,把 checkpoint 加载到当前拓扑。

resharding

### 拓扑变化也能恢复

同一个 checkpoint 可以在不同 world size 或不同 shard 方式下加载,前提是框架和 state dict 语义支持。

### 最小 DCP 状态封装

```
import torch
import torch.distributed.checkpoint as dcp
from torch.distributed.checkpoint.state_dict import get_state_dict, set_state_dict
from torch.distributed.checkpoint.stateful import Stateful

class TrainState(Stateful):
    def __init__ (self, model, optimizer, scheduler, scaler, meta):
        self.model = model
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.scaler = scaler
        self.meta = meta

    def state_dict(self):
        model_sd, optim_sd = get_state_dict(self.model, self.optimizer)
        return {
            "model": model_sd,
            "optim": optim_sd,
            "scheduler": self.scheduler.state_dict(),
            "scaler": self.scaler.state_dict() if self.scaler else {},
            "meta": self.meta,
            "rng_cpu": torch.get_rng_state(),
            "rng_cuda": torch.cuda.get_rng_state_all(),
        }

    def load_state_dict(self, state):
        set_state_dict(
            self.model,
            self.optimizer,
            model_state_dict=state["model"],
            optim_state_dict=state["optim"],
        )
        self.scheduler.load_state_dict(state["scheduler"])
        if self.scaler and state["scaler"]:
            self.scaler.load_state_dict(state["scaler"])
        self.meta.update(state["meta"])
        torch.set_rng_state(state["rng_cpu"])
        torch.cuda.set_rng_state_all(state["rng_cuda"])

def save_checkpoint(path, train_state):
    dcp.save({"app": train_state}, checkpoint_id=path)

def load_checkpoint(path, train_state):
    dcp.load({"app": train_state}, checkpoint_id=path)
```

真实工程中还要保存 tokenizer、dataset fingerprint、parallel config、checkpoint schema version,并在 load 前做严格校验。

## 异步保存:别堵住训练热路径

40 MIN

checkpoint 保存常常是训练 step 的长尾:GPU 算完了,所有 rank 等着权重从 GPU 拷到 CPU,再写本地盘或对象存储。 异步保存的思路是把 checkpoint 从训练关键路径移走: 当前 step 触发保存后继续训练,后台线程/进程做 staging 和 upload。 代价是 CPU 内存、pinned memory 和并发管理更复杂。

> **图：同步保存与异步保存对比**
>
> - SYNC SAVE VS ASYNC SAVE
> - 同步保存
> - train
> - save
> - GPU 等待 checkpoint 完成
> - 简单 · 稳定 · step time 抖动大
> - 异步保存
> - 后台 staging / upload 与训练重叠
> - 快 · 需要 future 和内存控制

FIG · 异步保存把 checkpoint 从训练关键路径移出去,但会引入额外 CPU 内存和并发风险

### 一次只允许一个异步 checkpoint

```
checkpoint_future = None

for step, batch in enumerate(loader, start=start_step):
    loss = train_one_step(batch)

    if should_save(step):
        # 避免异步保存堆积:上一份还没写完,不要再发起下一份
        if checkpoint_future is not None:
            checkpoint_future.result()

        train_state.meta["step"] = step
        tmp_path = f"ckpt/step_{step:08d}.tmp"
        final_path = f"ckpt/step_{step:08d}"
        checkpoint_future = dcp.async_save({"app": train_state}, checkpoint_id=tmp_path)

        # 完成后再把 tmp 标记为 final。可放后台回调或保存管理线程里做。
        checkpoint_future.result()
        os.rename(tmp_path, final_path)
        write_text_atomic("ckpt/latest", final_path)

if checkpoint_future is not None:
    checkpoint_future.result()
```

更高级的 async API 会区分 staging completion 和 upload completion。原则不变:不要让 optimizer 修改状态时,后台还在读未稳定的同一份 GPU state。

## 训练中断恢复流程

40 MIN

恢复训练不是简单 `load checkpoint`。 可靠流程是:启动时发现 latest 指针,校验 checkpoint 完整性和配置一致性, 构建当前并行拓扑下的模型/optimizer,加载分布式状态,恢复 step、scheduler、scaler、RNG 和 sampler, 最后做一个 sanity step 检查 loss 和 LR 是否连续。

| 阶段 | 动作 | 失败时怎么处理 |
| --- | --- | --- |
| 发现 | 读取 `ckpt/latest`,只指向已完成的 checkpoint。 | 没有 latest 就从头训练;latest 指向不存在则回退上一个完整 checkpoint。 |
| 校验 | 检查 metadata、schema version、模型 config、tokenizer、data fingerprint。 | 不一致时拒绝恢复,不要静默继续。 |
| 构建 | 按当前 TP/PP/DP/FSDP/ZeRO 配置先构建模型和 optimizer。 | DCP 需要当前 state\_dict 的存储和分片信息。 |
| 加载 | DCP load 到当前对象,恢复 scheduler、scaler、step、RNG。 | 加载失败就不要删除旧 checkpoint,记录失败目录。 |
| 对齐 | 恢复 sampler epoch/offset,跳到正确 global step。 | 不支持精确 offset 时至少保证 epoch 级恢复并记录重复窗口。 |
| 验证 | 打印恢复前后 LR、loss、global step、data position。 | 异常就停,不要让错误训练继续烧卡。 |

### resume 入口模板

```
def maybe_resume(train_state, ckpt_root):
    latest_file = os.path.join(ckpt_root, "latest")
    if not os.path.exists(latest_file):
        return 0

    ckpt_path = open(latest_file).read().strip()
    meta = read_json(os.path.join(ckpt_path, "metadata.json"))
    assert meta["model_config_hash"] == current_model_config_hash()
    assert meta["data_fingerprint"] == current_data_fingerprint()

    dcp.load({"app": train_state}, checkpoint_id=ckpt_path)
    start_step = int(train_state.meta["step"]) + 1

    if dist.get_rank() == 0:
        print(f"resumed from {ckpt_path}, next step={start_step}")
    return start_step
```

## Elastic training: 自动重启不是自动恢复

35 MIN

`torchrun` elastic 能在 worker 失败后重启进程组,甚至支持节点数量在范围内变化。 但它只负责重新拉起 worker 和 rendezvous,不负责让你的训练状态神奇回来。 你的脚本必须在启动时加载最近 checkpoint,并能处理 rank/world size 变化带来的数据和分片重建。

```
# 固定节点数,允许最多 3 次失败重启
torchrun \
  --nnodes=2 \
  --nproc-per-node=8 \
  --max-restarts=3 \
  --rdzv-id=aiinfra-day24 \
  --rdzv-backend=c10d \
  --rdzv-endpoint=node0:29400 \
  train.py --ckpt-root /mnt/checkpoints/job_001

# 弹性节点数:最少 1 台,最多 4 台。节点加入/离开也算 restart budget。
torchrun \
  --nnodes=1:4 \
  --nproc-per-node=8 \
  --max-restarts=3 \
  --rdzv-id=aiinfra-day24 \
  --rdzv-backend=c10d \
  --rdzv-endpoint=node0:29400 \
  train.py --ckpt-root /mnt/checkpoints/job_001
```

torchrun 负责

### 重启 worker group

失败后重新创建进程、重新 rendezvous、重新分配 rank/world size,受 `--max-restarts` 限制。

训练脚本负责

### 恢复训练状态

脚本启动时读取 latest checkpoint,恢复模型/optimizer/step/RNG/sampler,并重新构建当前并行拓扑。

调度系统负责

### 替换坏节点

K8s/Slurm/Ray 等负责重新分配资源和挂载存储。checkpoint 必须放在新节点也能访问的位置。

## 故障演练

45 MIN

今天必须做一次"故意杀进程"演练。没有故障演练的 checkpoint 都是心理安慰。 目标是证明:训练能从最近完整 checkpoint 恢复,global step 不倒退太多,LR 连续,loss 没有明显跳变, 未完成 checkpoint 不会被 latest 指向。

```
# 1. 启动一个允许重启的单机多卡任务
torchrun --standalone --nproc-per-node=4 --max-restarts=2 \
  train_day24_ckpt.py --ckpt-root ./ckpt_day24 --save-every 50

# 2. 另开终端,随机杀掉一个 rank 对应进程
ps aux | grep train_day24_ckpt.py
kill -9 PID_OF_ONE_WORKER

# 3. 观察 torchrun 是否重启 worker group,脚本是否从 latest 恢复
tail -f logs/train.log

# 4. 检查 checkpoint 目录
find ckpt_day24 -maxdepth 2 -type f | sort
cat ckpt_day24/latest
```

| 检查项 | 通过标准 | 常见失败 |
| --- | --- | --- |
| latest 指针 | 只指向完整 checkpoint,不指向 tmp/incomplete。 | 进程被杀时 latest 已更新,但文件还没写完。 |
| step 连续性 | 最多丢失一个保存间隔内的 step。 | 恢复后 step 从 0 开始或重复大量数据。 |
| LR / scheduler | 恢复后 LR 和保存时一致或自然进入下一步。 | scheduler 没保存,LR 回到 warmup 起点。 |
| optimizer | Adam m/v 恢复,loss 无明显断崖。 | 只加载模型,optimizer 重新初始化。 |
| RNG / data | 可解释数据重复或跳过范围。 | sampler 状态丢失,恢复后 shuffle 完全变化。 |

DELIVERABLE

### 今天的交付物

一份 `day24_checkpoint_fault_tolerance.md`:包含状态清单、DCP save/load 模板、async 保存策略、torchrun elastic 命令、一次 kill -9 恢复演练日志和问题修复记录。

最小可靠标准

### checkpoint 要能被验证

保存后立刻在独立进程里 load 一次,至少验证 model hash、step、LR、optimizer key 数量和一个 tiny batch loss。别等事故发生才第一次恢复。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么 DCP 会保存多个文件,而不是一个大文件?

ANS

因为分布式训练里的参数和 optimizer state 本来就分散在多个 rank 上。让每个 rank 并行写自己的 shard,可以避免 rank 0 聚合导致的内存峰值和写入瓶颈。

代价是 checkpoint 目录成为一个整体。复制、清理、上传时要按目录处理,不能只拿其中一个文件。

### Q2 · 异步保存是不是总比同步保存好?

ANS

不是。异步保存能减少训练关键路径上的等待,但会增加 CPU 内存、pinned memory、后台 IO 和并发状态管理。小模型或保存不频繁时,同步保存更简单可靠。

生产中通常先做同步保存保证正确,再把保存路径拆成 staging、upload 和 latest 原子更新,最后引入异步。

### Q3 · elastic training 会自动从 checkpoint 恢复吗?

ANS

不会。`torchrun` elastic 负责重启 worker 和重新 rendezvous,但训练状态恢复必须由你的脚本实现。脚本启动后要主动读取 latest checkpoint 并恢复状态。

可以把 elastic 看成"自动把进程拉起来",checkpoint/resume 才是"让训练接着走"。

### Q4 · latest 文件为什么要原子更新?

ANS

如果 latest 先指向新 checkpoint,但文件还没写完就崩了,下次恢复会读到半成品。正确做法是先写 tmp 目录,完成校验后再原子 rename 成 final,最后原子更新 latest。

对象存储上没有 POSIX rename 语义时,要用 manifest/complete marker 做类似的两阶段提交。

### Q5 · 能不能改变 world size 后恢复?

ANS

可能可以,但要看 checkpoint 格式和并行策略。DCP 设计上支持按加载时拓扑重分片,这对 FSDP/DCP 很有价值。DeepSpeed/Megatron 的 checkpoint 是否能改 TP/PP/DP 后恢复,要看它们的保存格式和转换工具。

工程上不要默认可行。把"同拓扑恢复"和"异拓扑恢复"分别做演练,并写进 runbook。

## 复盘问题

6 QUESTIONS

1. 列出一个严格恢复训练必须保存的状态清单,说明每项漏掉会造成什么问题。
2. DCP 和 `torch.save` 的差异是什么?为什么分布式训练更适合 DCP?
3. 解释异步 checkpoint 的 staging、upload、latest 更新三步,以及每一步失败时如何恢复。
4. 为什么 DCP load 需要先构建模型和 optimizer,再把 state dict 加载进去?
5. `torchrun --max-restarts` 能解决什么问题?不能解决什么问题?
6. 设计一次故障演练:你会杀哪个进程、观察哪些日志、如何判断恢复成功?

## 今日检查清单

10 ITEMS

- 能区分 inference checkpoint、fine-tune checkpoint 和 full training checkpoint
- 能列出 model、optimizer、scheduler、scaler、step、RNG、sampler、config/data version 的作用
- 能解释 DCP 为什么会产生多文件 checkpoint,以及 load-time resharding 的意义
- 能写出 DCP save/load 的最小 Stateful wrapper
- 知道异步保存的 CPU 内存和 pinned memory 风险
- 能设计 tmp → final → latest 的原子提交流程
- 能用 torchrun 的 `--max-restarts`、`--rdzv-id`、`--rdzv-endpoint` 启动可重启任务
- 知道 elastic restart 不等于训练状态自动恢复
- 能完成一次 kill -9 故障演练并从 latest checkpoint 恢复
- 能写出 checkpoint 存储分层:本地 NVMe staging、共享文件系统、对象存储归档

## 推荐阅读

5 ITEMS

PYTORCH

### Distributed Checkpoint API

PyTorch DCP API 文档,重点看 save/load、FileSystemReader/Writer、planner 与 state\_dict 支持。
[docs.pytorch.org · distributed.checkpoint](https://docs.pytorch.org/docs/2.12/distributed.checkpoint.html)

RECIPE

### Getting Started with DCP

官方 recipe,展示 FSDP 模型如何用 DCP 多 rank 保存/加载,以及 DCP 与 torch.save 的关键差异。
[pytorch.org · DCP recipe](https://docs.pytorch.org/tutorials/recipes/distributed_checkpoint_recipe.html)

ASYNC

### Asynchronous Saving with DCP

官方 async\_save 教程,重点看 future 管理、CPU staging、pinned memory 与一次只跑一个异步 checkpoint 的建议。
[pytorch.org · async DCP recipe](https://docs.pytorch.org/tutorials/recipes/distributed_async_checkpoint_recipe.html)

ELASTIC

### torchrun Elastic Launch

官方 torchrun 文档,看 fault tolerant 和 elastic 模式中的 `--max-restarts`、rdzv 参数和 rank/world size 语义。
[docs.pytorch.org · torchrun](https://docs.pytorch.org/docs/2.12/elastic/run.html)

NEXT

### 数据 Pipeline

Day25 会进入训练输入侧:WebDataset、streaming dataset、prefetch、shared memory。恢复训练时,数据 pipeline 的位置同样要可恢复。

## Day 25 预告

NEXT

COMING NEXT

### 数据 Pipeline — WebDataset · Streaming · IterableDataset · prefetch

今天我们解决"训练中断后怎么回来"。Day25 解决另一个常见瓶颈: GPU 等数据。大规模训练的数据不可能简单放进一个本地目录, 需要 shard、streaming、prefetch、缓存、worker 隔离和可恢复的数据游标。 这两天合在一起,就是训练系统的生命线。

"可靠的训练系统不是不失败,而是失败以后知道从哪里、以什么状态继续。"

DAY 24 · AI INFRA 60-DAY ROADMAP
