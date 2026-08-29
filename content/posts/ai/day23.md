---
title: "Day 23 · DeepSpeed 实战"
date: '2026-06-20'
draft: false
description: "实战 DeepSpeed ZeRO-3 + Offload:理解参数、梯度、优化器状态如何分片与换入换出,拆解 ds_config.json 的 zero_optimization、offload_param、offload_optimizer、bucket、overlap 与 NVMe 参数,并给出可运行的训练配置模板。"
toc: true
tags:
  - AI
  - DeepSpeed
  - ZeRO
  - Distributed
  - Offload
  - Training
---

DAY 23 · AI INFRA ROADMAP · DISTRIBUTED TRAINING

# 把模型状态 _搬出 GPU_

Day 18 已经理解了 ZeRO-1/2/3 分别切优化器状态、梯度和参数。 今天进入 DeepSpeed 实战:用 **ZeRO-3** 把参数、梯度、优化器状态都切到 data parallel ranks 上, 再用 **Offload** 把一部分状态搬到 CPU 内存,甚至 NVMe。 这能让更大的模型在更少 GPU 上跑起来,但代价是 PCIe / 内存 / 磁盘 IO 进入训练热路径。 今天的目标不是盲目复制一份 `ds_config.json`, 而是能解释每个关键字段会影响什么:显存、吞吐、通信、IO 还是 checkpoint。

**DURATION** 3 h **THEORY** 1.2 h **HANDS-ON** 1.3 h **REVIEW** 0.5 h **STACK** DeepSpeed · ZeRO-3 · CPU Offload · NVMe

## 思维导图

OVERVIEW

> **图：Day 23 DeepSpeed ZeRO-3 Offload 思维导图**
>
> - DAY 23 · DeepSpeed 实战
> - ZERO-3 · OFFLOAD · CPU · NVME · DS\_CONFIG
> - 01 · MODEL
> - ZeRO-3 运行模型
> - 02 · OFFLOAD
> - CPU / NVMe
> - 03 · CONFIG
> - ds\_config.json
> - 04 · DEBUG
> - 监控与排障
> - param shard
> - gather before layer
> - reduce-scatter grad
> - release after use
> - offload\_optimizer
> - offload\_param
> - pin\_memory
> - nvme\_path
> - stage = 3
> - bucket sizes
> - overlap\_comm
> - save\_16bit\_model
> - nvidia-smi
> - iostat / pidstat
> - wall-clock samples
> - OOM / IO bottleneck
> - DELIVERABLES
> - ZeRO-3 生命周期图
> - CPU/NVMe 配置模板
> - ds\_config 字段表
> - 监控排障清单

FIG · Day 23 全景:先看 ZeRO-3 运行生命周期,再理解 CPU/NVMe offload,最后把 ds\_config.json 每个关键字段和性能现象对上

## ZeRO-3 运行时到底发生了什么

30 MIN

ZeRO-3 的关键不是"参数被切了"这句话,而是 **参数在需要时会被临时 gather 到 GPU 上,用完再释放** 。 每个 data parallel rank 长期只保存参数、梯度、优化器状态的一部分。 forward 到某层前,DeepSpeed 把这一层需要的参数 all-gather 出来; 计算结束后释放完整参数,只保留 shard。 backward 时同理,梯度通过 reduce-scatter 回到各自 shard。

> **图：ZeRO-3 参数生命周期**
>
> - ZERO-3 PARAMETER LIFECYCLE
> - Shard Resident
> - rank owns 1/N params
> - AllGather
> - materialize layer
> - Compute Layer
> - forward / backward
> - Release Full Params
> - keep shard only
> - BACKWARD AND OPTIMIZER
> - Grad ReduceScatter
> - each rank keeps grad shard
> - Optimizer Step
> - update local shard only
> - CPU / NVMe Offload
> - move states out of GPU
> - Checkpoint
> - sharded states

FIG · ZeRO-3 长期只驻留 shard,层计算前 gather,计算后释放;offload 会把 shard 或 optimizer state 再搬到 CPU/NVMe

### ZeRO-3 与 Offload 的收益/代价

| 能力 | 节省什么 | 新增成本 | 适用场景 |
| --- | --- | --- | --- |
| ZeRO-3 | 参数、梯度、优化器状态都按 DP rank 分片 | 每层参数 all-gather / 释放,backward reduce-scatter | 模型状态太大,但仍希望用数据并行扩展 |
| CPU Offload | 把 optimizer state 或参数 shard 从 GPU 搬到 CPU 内存 | PCIe / CPU 内存带宽,CPU optimizer 更新可能更慢 | GPU 显存不足,CPU 内存充足,可接受吞吐下降 |
| NVMe Offload | 把状态进一步放到 SSD | 磁盘 IO 延迟和带宽进入热路径,调参复杂 | 模型极大、只是为了跑起来或做低吞吐实验 |
| 无 Offload | 只靠 ZeRO-3 分片节省 GPU 显存 | 通信成本,但无 CPU/NVMe IO | 首选 baseline;能放下时通常更快更稳 |

实战顺序:先 ZeRO-3 无 offload 跑通,再开 optimizer CPU offload,最后才考虑 param/NVMe offload。

## CPU Offload 配置模板

35 MIN

最常见、也最稳的 offload 入口是先把 optimizer state 放到 CPU。 Adam 的 optimizer state 通常包含 fp32 master weight、momentum、variance, 比模型参数本体还要重。把这部分搬出 GPU,能显著降低显存占用。 但 optimizer step 会吃 CPU 和 PCIe,吞吐会下降。

```
{
  "train_micro_batch_size_per_gpu": 2,
  "gradient_accumulation_steps": 8,
  "steps_per_print": 50,

  "bf16": {
    "enabled": true
  },

  "optimizer": {
    "type": "AdamW",
    "params": {
      "lr": 2e-5,
      "betas": [0.9, 0.95],
      "eps": 1e-8,
      "weight_decay": 0.1
    }
  },

  "zero_optimization": {
    "stage": 3,
    "overlap_comm": true,
    "contiguous_gradients": true,
    "reduce_bucket_size": 500000000,
    "stage3_prefetch_bucket_size": 50000000,
    "stage3_param_persistence_threshold": 100000,
    "stage3_max_live_parameters": 1000000000,
    "stage3_max_reuse_distance": 1000000000,

    "offload_optimizer": {
      "device": "cpu",
      "pin_memory": true
    }
  },

  "gradient_clipping": 1.0,
  "wall_clock_breakdown": true
}
```

### 关键字段解释

| 字段 | 含义 | 调大 / 调小影响 | 经验 |
| --- | --- | --- | --- |
| `stage` | ZeRO stage。3 表示参数、梯度、优化器状态都分片 | stage 越高显存越省,通信和调度越复杂 | Day23 目标固定 stage 3 |
| `overlap_comm` | 尽量把通信和计算重叠 | 开启通常更快,但可能增加显存 buffer | 默认建议开,异常时关掉做对照 |
| `contiguous_gradients` | 把梯度放到连续 buffer,减少碎片 | 更稳定,可能需要额外 buffer | 通常开启 |
| `reduce_bucket_size` | 梯度 reduce / reduce-scatter bucket 大小 | 大 bucket 通信效率好但占显存;小 bucket 更细碎 | OOM 时可适当调小,吞吐低时再调回 |
| `stage3_prefetch_bucket_size` | 预取下一批参数的 bucket 大小 | 调大可提高 overlap,但显存峰值上升 | CPU/NVMe offload 时很关键 |
| `stage3_param_persistence_threshold` | 小于阈值的参数可常驻,减少频繁 gather | 调大更快但更占显存;调小更省显存但通信多 | 小模块参数多的模型可适当调大 |
| `offload_optimizer.device` | optimizer state 放到 CPU 或 NVMe | CPU 比 GPU 慢但比 NVMe 稳 | 先从 CPU optimizer offload 开始 |
| `pin_memory` | 使用 pinned CPU memory 加快 CPU/GPU DMA | 更快,但会占用不可分页内存 | CPU offload 通常开启;内存紧张时评估 |

CPU offload 的第一监控项不是 GPU 利用率,而是 CPU 内存、PCIe 传输和 optimizer step 时间。

## NVMe Offload:能跑起来,但要敬畏 IO

35 MIN

NVMe Offload 是 ZeRO-Infinity 路线里的强力武器: 当 CPU 内存都不够,或想训练远超 GPU/CPU 常驻能力的模型时, 可以把参数或 optimizer state 放到本地 NVMe。 但这不是免费的魔法。SSD 带宽、IOPS、队列深度、文件系统、NUMA、临时目录空间都会进入训练性能模型。 所以它适合"为了放下更大模型"的场景,不适合作为默认高吞吐方案。

```
{
  "train_micro_batch_size_per_gpu": 1,
  "gradient_accumulation_steps": 16,

  "bf16": { "enabled": true },

  "zero_optimization": {
    "stage": 3,
    "overlap_comm": true,
    "contiguous_gradients": true,

    "offload_param": {
      "device": "nvme",
      "nvme_path": "/local_nvme/deepspeed_param",
      "pin_memory": true,
      "buffer_count": 5,
      "buffer_size": 100000000,
      "max_in_cpu": 1000000000
    },

    "offload_optimizer": {
      "device": "nvme",
      "nvme_path": "/local_nvme/deepspeed_optimizer",
      "pin_memory": true,
      "buffer_count": 4,
      "fast_init": true
    },

    "stage3_prefetch_bucket_size": 50000000,
    "stage3_param_persistence_threshold": 10000,
    "stage3_max_live_parameters": 500000000,
    "stage3_max_reuse_distance": 500000000
  },

  "wall_clock_breakdown": true
}
```

### NVMe 字段解释

| 字段 | 含义 | 风险 | 建议 |
| --- | --- | --- | --- |
| `device: "nvme"` | 把参数或 optimizer state 放到 NVMe | 磁盘 IO 变成训练瓶颈 | 只在 CPU/GPU 都放不下时启用 |
| `nvme_path` | 本地 NVMe 临时目录 | 误用网络盘会非常慢;空间不足会崩 | 使用本机 SSD,提前 `df -h` 检查空间 |
| `buffer_count` | IO buffer 数量 | 太少无法 pipeline,太多占 CPU memory | 从 4/5 开始,结合 iostat 调 |
| `buffer_size` | 单个参数 IO buffer 大小 | 太小 IOPS 压力大,太大内存压力高 | 与 SSD 顺序读写特性匹配,不要盲目极大 |
| `max_in_cpu` | 从 NVMe 缓存在 CPU 内存里的参数元素数量 | 调大吃 CPU 内存,调小增加 NVMe 读写 | CPU 内存充足时适当调大 |
| `fast_init` | 优化 NVMe optimizer state 初始化 | 主要影响初始化阶段 | NVMe optimizer offload 可开启 |

> **图：GPU CPU NVMe Offload 路径**
>
> - OFFLOAD DATA PATH
> - GPU HBM
> - active layer params
> - CPU DRAM
> - pinned memory cache
> - Local NVMe
> - param / optimizer files
> - PCIe / DMA
> - SSD IO
> - PERFORMANCE RULE
> - GPU 算得再快,如果参数不能及时从 NVMe → CPU → GPU 预取到位,step time 会被 IO 拉长。offload 的关键是 overlap 和缓存命中。

FIG · NVMe offload 多了一跳 SSD IO,真正性能取决于预取、缓存、PCIe 和磁盘吞吐能否覆盖计算时间

## 启动训练与最小验证

30 MIN

DeepSpeed 集成有两条常见路径: 一条是用 DeepSpeed launcher 和原生训练脚本; 另一条是 HuggingFace Trainer / Accelerate 读取 `ds_config.json`。 不管哪条路径,第一轮都不要追求最大模型。先用小模型、小数据、十几个 step 跑通, 看日志确认 ZeRO stage、offload device、显存曲线和 step time。

### DeepSpeed launcher

```
# 单机 4 卡示例
deepspeed --num_gpus=4 train.py \
  --deepspeed \
  --deepspeed_config ds_zero3_cpu.json \
  --model_name_or_path your-model \
  --per_device_train_batch_size 2 \
  --gradient_accumulation_steps 8

# 多机时使用 hostfile 或调度系统注入的环境变量,并确保每台机器都能访问本地 nvme_path
deepspeed --hostfile hostfile train.py --deepspeed --deepspeed_config ds_zero3_nvme.json
```

### HuggingFace Trainer / Accelerate

```
# Trainer 常见用法
torchrun --nproc_per_node=4 train_hf.py \
  --deepspeed ds_zero3_cpu.json \
  --bf16 true \
  --per_device_train_batch_size 2 \
  --gradient_accumulation_steps 8

# Accelerate 常见用法
accelerate launch --config_file accelerate_config.yaml train_hf.py \
  --deepspeed ds_zero3_cpu.json
```

### 第一次跑只看这几件事

日志确认

### 配置有没有真的生效

DeepSpeed 启动日志会打印 ZeRO stage、offload optimizer/param device、bucket 配置、fp16/bf16 状态。先确认日志和你写的 JSON 一致,再谈性能。

显存确认

### GPU memory 是否下降

对比无 ZeRO、ZeRO-3、ZeRO-3 + CPU offload 三组 `nvidia-smi` 峰值。只看单次截图不够,最好记录每 step 峰值。

吞吐确认

### tokens/sec 和 step time

offload 能省显存,但吞吐会掉。记录前 20 step 的平均时间,并打开 `wall_clock_breakdown` 看 optimizer、communication、forward/backward 的比例。

IO 确认

### CPU/NVMe 是否满载

CPU offload 看 `pidstat`、内存带宽和 swap;NVMe offload 看 `iostat -x 1` 的 util、await、读写吞吐。千万不要用网络盘做 nvme\_path。

## 常见问题与调参顺序

35 MIN

ZeRO-3 + Offload 的问题通常不是单点 bug,而是显存、通信、CPU 内存、磁盘 IO 的多方拉扯。 调参时要保留 baseline,一次只动一类参数。 最坏的方式是看到 OOM 就把所有 bucket 调小、看到慢就全部调大,最后不知道哪一项有效。

| 症状 | 优先怀疑 | 怎么确认 | 调参方向 |
| --- | --- | --- | --- |
| 仍然 GPU OOM | bucket / prefetch 太大,参数持久化太多,activation 太高 | 看 OOM 发生在 forward gather 还是 backward;记录 peak memory | 调小 `reduce_bucket_size`、`stage3_prefetch_bucket_size`、`stage3_param_persistence_threshold`;配合 activation checkpointing |
| 吞吐大幅下降 | CPU/NVMe offload 成瓶颈 | `wall_clock_breakdown`、`iostat`、GPU util 低 | 优先只 offload optimizer;增加 CPU cache;检查是否误用慢盘 |
| CPU 内存爆 | pin\_memory、max\_in\_cpu、buffer 太大 | 看 RSS、page cache、是否 swap | 降低 `max_in_cpu`、buffer\_size/count;关闭部分 pin\_memory 做对照 |
| NVMe await 很高 | 磁盘队列拥塞或文件系统/网络盘问题 | `iostat -x 1` util 接近 100%,await 飙高 | 换本地 SSD;减少 NVMe offload 范围;调 buffer;降低 batch 或模型规模 |
| checkpoint 很慢/很大 | ZeRO-3 sharded checkpoint 合并成本高 | 保存阶段 step time 激增,磁盘写满 | 使用 sharded checkpoint;按需设置 `stage3_gather_16bit_weights_on_model_save` |

### 推荐调参顺序

```
# 0. 无 offload baseline:先确认模型、数据、loss 都正常
ds_zero3_no_offload.json

# 1. 只开 optimizer CPU offload:通常收益/风险比最好
offload_optimizer.device = "cpu"
offload_param = # 不配置

# 2. GPU 仍 OOM,再尝试 param CPU offload
offload_param.device = "cpu"
stage3_prefetch_bucket_size ↓
stage3_param_persistence_threshold ↓

# 3. CPU 内存也不够,最后考虑 NVMe
offload_param.device = "nvme"
offload_optimizer.device = "nvme"
nvme_path = "/local_nvme/..."

# 4. 每一步都记录
peak_gpu_mem, cpu_mem, nvme_util, step_time, tokens_per_sec
```

Offload 是容量工具,不是性能加速器。它的胜利标准通常是"模型能稳定跑起来且吞吐可接受"。

## 动手交付物

45 MIN

今天请输出一份可以复用的 DeepSpeed 实验笔记。 它不需要很长,但必须有三组对照:ZeRO-3 无 offload、ZeRO-3 + optimizer CPU offload、 ZeRO-3 + param/optimizer offload。每组记录显存、吞吐和瓶颈判断。

### 实验记录模板

| 配置 | peak GPU mem | CPU mem | step time | tokens/s | 瓶颈判断 |
| --- | --- | --- | --- | --- | --- |
| ZeRO-3 no offload | \_\_ GiB | \_\_ GiB | \_\_ s | \_\_ | 通信 / 计算 / OOM? |
| ZeRO-3 + CPU optimizer offload | \_\_ GiB | \_\_ GiB | \_\_ s | \_\_ | CPU optimizer / PCIe? |
| ZeRO-3 + CPU/NVMe param offload | \_\_ GiB | \_\_ GiB | \_\_ s | \_\_ | NVMe IO / prefetch? |

### 检查清单

- 能画出 ZeRO-3 参数生命周期: shard resident → all-gather → compute → release。
- 能解释 `offload_optimizer` 和 `offload_param` 的区别。
- 能说清楚 CPU offload 和 NVMe offload 分别省什么、慢在哪里。
- 完成一份 `ds_zero3_cpu.json` 并逐字段注释。
- 知道 `reduce_bucket_size`、`stage3_prefetch_bucket_size`、`stage3_param_persistence_threshold` 如何影响显存和吞吐。
- 记录三组实验的 peak GPU memory、step time、CPU/NVMe 指标,写出最终取舍。

## 常见疑问

5 QUESTIONS

### Q1 · ZeRO-3 已经切参数了,为什么还会 OOM?

ANS

因为 ZeRO-3 计算某层时仍要临时 all-gather 这层完整参数,同时还会有 activation、communication bucket、prefetch buffer 和 CUDA workspace。OOM 往往发生在这些峰值叠加时,不是长期 shard 本身太大。

### Q2 · CPU offload 和 NVMe offload 应该先用哪个?

ANS

先用 CPU,尤其是 optimizer CPU offload。CPU 内存延迟和带宽都比 NVMe 友好得多。NVMe 是容量兜底方案,适合 CPU 内存也不够或模型极大时使用,但吞吐下降和调参复杂度都更高。

### Q3 · bucket size 调大一定更快吗?

ANS

不一定。大 bucket 通信效率通常更好,但会提高显存峰值,还可能影响 overlap 时机。小 bucket 更省显存但通信碎片多。调参要看 peak memory 和 step time 的共同变化,不要只看一个指标。

### Q4 · 为什么不建议把 `nvme_path` 放网络盘?

ANS

NVMe offload 假设是本地高速 SSD,参数和 optimizer state 会频繁读写。网络盘延迟高、带宽共享、抖动大,会把训练热路径拖到不可用。多机训练时每台机器都应该使用自己的本地 NVMe 目录。

### Q5 · ZeRO-3 checkpoint 为什么麻烦?

ANS

因为模型参数、梯度和 optimizer state 都是分片保存的。保存完整 16-bit 模型时需要 gather,这可能非常慢且占显存/内存。生产中通常保存 sharded checkpoint,需要导出完整模型时再做离线合并。

## 复盘问题

REVIEW

1. ZeRO-3 中参数 shard 在 forward 某层前后分别处于什么状态?
2. `offload_optimizer` 与 `offload_param` 分别搬走了什么?
3. CPU Offload 为什么通常比 NVMe Offload 更适合作为第一选择?
4. `stage3_prefetch_bucket_size` 调大和调小分别影响什么?
5. 为什么 `pin_memory` 能加速 CPU/GPU 传输,又可能带来内存压力?
6. 如何判断训练慢是 GPU compute 慢、NCCL 通信慢,还是 NVMe IO 慢?
7. 保存 ZeRO-3 checkpoint 时为什么要区分 sharded checkpoint 和完整 16-bit model?

## 参考资料

OFFICIAL DOCS

DEEPSPEED

### DeepSpeed Configuration JSON

官方配置文档,包含 ZeRO、Offload、bf16/fp16、optimizer、scheduler、wall\_clock\_breakdown 等字段说明。
[deepspeed.ai · config-json](https://www.deepspeed.ai/docs/config-json/)

DEEPSPEED

### ZeRO Tutorial

官方 ZeRO 教程,讲解 ZeRO stages、训练脚本接入和 memory optimization workflow。
[deepspeed.ai · ZeRO tutorial](https://www.deepspeed.ai/tutorials/zero/)

DEEPSPEED

### ZeRO-Offload

官方 ZeRO-Offload 说明,重点介绍 optimizer state 和 compute offload 到 CPU 的使用方式。
[deepspeed.ai · ZeRO-Offload](https://www.deepspeed.ai/tutorials/zero-offload/)

DEEPSPEED

### ZeRO-Infinity / NVMe Offload

官方 ZeRO-Infinity 教程,覆盖 NVMe offload、buffer、路径与大模型容量扩展。
[deepspeed.ai · ZeRO-Infinity](https://www.deepspeed.ai/tutorials/zero-infinity/)

Offload 的本质不是让训练更快,而是用更慢的层级换来更大的容量。

DAY 23 COMPLETE · NEXT: CHECKPOINT & FAULT TOLERANCE
