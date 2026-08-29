---
title: "Day 25 · 数据 Pipeline"
date: '2026-06-20'
draft: false
description: "进入训练数据通路:理解 WebDataset、Mosaic Streaming 与自定义 IterableDataset 的设计取舍;调优 DataLoader 的 num_workers、prefetch_factor、pin_memory、persistent_workers 与 shared memory,定位 GPU starvation。"
toc: true
tags:
  - AI
  - PyTorch
  - DataLoader
  - WebDataset
  - Streaming
  - Training
---

DAY 25 · AI INFRA ROADMAP · TRAINING SYSTEMS

# 别让 GPU _等数据_

训练性能不只取决于 CUDA kernel、NCCL 和并行策略。 如果数据 pipeline 跟不上,GPU 会在每个 step 前干等: 存储读 shard、网络拉对象、解压、解码、tokenize、augment、collate、拷贝到 GPU, 任意一环慢都会把昂贵的算力晾在原地。 今天围绕 RoadMap 的三件事展开: **WebDataset** 、 **Mosaic Streaming** 、自定义 `IterableDataset`; 再把 `num_workers`、`prefetch_factor`、 `pin_memory`、`persistent_workers`、 `/dev/shm` 这些参数和真实吞吐现象对上。

**DURATION** 3 h **THEORY** 1.1 h **HANDS-ON** 1.4 h **REVIEW** 0.5 h **STACK** PyTorch · WebDataset · Mosaic Streaming · DataLoader

## 思维导图

OVERVIEW

> **图：Day 25 数据 pipeline 思维导图**
>
> - DAY 25 · 数据 Pipeline
> - SHARDS · STREAMING · ITERABLEDATASET · PREFETCH · SHM
> - 01 · BOTTLENECK
> - GPU starvation
> - 02 · FORMAT
> - WebDataset / Streaming
> - 03 · LOADER
> - DataLoader tuning
> - 04 · DEBUG
> - 观测与排障
> - data\_time vs step\_time
> - storage / network
> - decode / tokenize
> - H2D copy
> - tar shards
> - remote / local cache
> - shard shuffle
> - resume determinism
> - IterableDataset
> - num\_workers
> - prefetch\_factor
> - pin\_memory / shm
> - iostat / pidstat
> - /dev/shm
> - worker duplicate
> - benchmark matrix
> - DELIVERABLES
> - 数据通路瓶颈图
> - WebDataset 示例
> - IterableDataset 模板
> - DataLoader 调参表

FIG · Day 25 全景:从 GPU 等数据的症状开始,沿存储、流式数据集、DataLoader worker 和共享内存一路定位

## 数据通路里到底哪里会慢

25 MIN

一次训练 step 不是只有 forward/backward。 当 GPU 还在算当前 batch 时,CPU worker 应该已经把下一个 batch 准备好。 如果下一个 batch 没准备好,主进程会卡在 `next(dataloader)`, GPU 利用率掉下去,nsys 里会看到 kernel 之间出现长空洞。 所以优化数据 pipeline 的第一步不是改参数,而是把每个环节拆开计时。

> **图：训练数据 pipeline 通路**
>
> - TRAINING DATA PIPELINE
> - Storage
> - disk / object store
> - Shard Reader
> - tar / mds / jsonl
> - Decode
> - jpg / tokenizer
> - Transform
> - augment / pack
> - Collate
> - batch / pad
> - GPU
> - OBSERVABILITY
> - data\_time = next(dataloader) 等待时间; compute\_time = GPU forward/backward/optim 时间; 如果 data\_time 经常接近或超过 compute\_time,说明数据管线正在喂不饱 GPU。
> - 排查顺序:先看 GPU idle,再看 CPU worker、磁盘/对象存储、/dev/shm、H2D 拷贝,最后再调 batch 和格式。

FIG · 数据 pipeline 是一条流水线;最慢的环节决定 GPU 是否能持续拿到 batch

### 三类典型瓶颈

I/O BOUND

### 存储或网络慢

症状是 CPU 不满、GPU 空、`iostat` await 高或对象存储请求慢。解决方向是 sharding、顺序读、本地 cache、增大 predownload、避免小文件随机读。

CPU BOUND

### 解码/tokenize/augment 慢

症状是 worker CPU 打满,queue 仍空。解决方向是增加 worker 到 CPU 饱和点、把重变换离线化、用更快 decoder/tokenizer、把部分 transform 放 GPU。

TRANSFER BOUND

### CPU 到 GPU 拷贝慢

症状是 dataloader 本身快,但 H2D copy 长。解决方向是 `pin_memory=True`、`non_blocking=True`、batch tensor 连续化、减少 Python 对象嵌套。

经验法则:先测再调。数据 pipeline 的参数没有全局最优,只有在你的数据格式、CPU、存储、GPU 和 batch size 上的局部最优。

## PyTorch DataLoader 调参地图

35 MIN

PyTorch 支持 map-style 和 iterable-style 两类 dataset。 大规模训练的数据常来自 tar shard、远端对象存储、日志流或已经打包好的 token block, 这些场景更适合 `IterableDataset`。 但 IterableDataset 有一个关键坑: 多 worker 时 dataset 对象会被复制到每个 worker,如果不主动切分 worker 的数据范围, 很容易重复读同一份样本。

| 参数 | 作用 | 调大/开启的收益 | 风险 |
| --- | --- | --- | --- |
| `num_workers` | DataLoader 子进程数量。0 表示主进程加载数据 | 并行读取、解码、transform,减少主进程等待 | CPU 争用、内存放大、worker 启动开销、重复数据风险 |
| `prefetch_factor` | 每个 worker 预加载的 batch 数;总预取约为 `num_workers * prefetch_factor` | 平滑慢 I/O 抖动,让 batch queue 不空 | 占更多 CPU 内存和 shared memory;worker 慢时不一定有用 |
| `pin_memory` | 把返回 tensor 放入 page-locked memory | CPU → CUDA 拷贝更快,配合 `non_blocking=True` | 占用 pinned memory;自定义 batch 类型需要实现 `pin_memory()` |
| `persistent_workers` | 一个 epoch 后不销毁 worker | 避免每个 epoch 重启 worker 和重新初始化 dataset/cache | worker 长驻占内存;dataset 状态重置要自己处理 |
| `drop_last` | 丢掉不完整 batch | 分布式训练 shape 稳定,避免最后一批导致不同 rank 不一致 | IterableDataset 多 worker 下可能丢掉超过一个 batch 的样本 |
| `in_order=False` | 允许多 worker batch 不按 FIFO 返回 | 慢样本不会堵住后面的快样本 | 可能伤害复现性,类别不均衡时可能引入分布偏差 |

### 推荐起步配置

```
from torch.utils.data import DataLoader

loader = DataLoader(
    dataset,
    batch_size=global_micro_batch,
    num_workers=8, # 从 4/8 起步,看 CPU 和 data_time 再调
    prefetch_factor=2, # 总预取约 2 * num_workers 个 batch
    pin_memory=True, # CUDA 训练通常开启
    persistent_workers=True, # 长训练建议开启
    drop_last=True,
)

for batch in loader:
    batch = move_to_cuda(batch, non_blocking=True)
    loss = train_step(batch)
```

### /dev/shm 为什么会炸

SHARED MEMORY

### 多 worker batch 需要跨进程传输

DataLoader worker 在子进程里构造 batch,再交给主进程。大 tensor batch、prefetch 多、worker 多时,共享内存和文件描述符压力会上升。Docker 默认 `/dev/shm` 可能很小,很容易出现 worker 被杀或 bus error。

CHECK

### 先看容量,再调参数

用 `df -h /dev/shm` 看 shared memory;容器里常用 `--shm-size=64g` 或 Kubernetes emptyDir memory。OOM 时先降低 `num_workers` 和 `prefetch_factor` 验证。

DataLoader 调参的顺序:先让 worker 不重复、不崩,再增加并行度,最后调 prefetch 和 pinned memory。

## WebDataset:用 tar shards 顺序喂数据

35 MIN

小文件随机读是训练数据系统的大敌。 WebDataset 的核心做法是把样本打进 tar shards: 同一个样本的不同字段共享 basename,例如 `000001.jpg`、`000001.json`。 训练时顺序读取 tar,在样本级做 shuffle、decode、map、batch。 它本质上是 PyTorch `IterableDataset` 风格的数据管线, 特别适合对象存储、分布式训练和大规模 image/text/audio 数据。

> **图：WebDataset shard pipeline**
>
> - WEBDATASET PIPELINE
> - Shard List
> - train-{000000..999999}.tar
> - Split
> - by node / worker
> - Tar Samples
> - jpg + json + txt
> - Decode / Batch
> - map · collate · train
> - WHY IT WORKS
> - 把大量小文件变成少量大 tar shard,让存储和对象存储走顺序读;再通过 shard shuffle + sample shuffle 保持随机性。

FIG · WebDataset 把样本打包成 tar shards,用顺序 I/O 和流式 decode 降低小文件随机读开销

### WebDataset 训练管线示例

```
import webdataset as wds
from torch.utils.data import DataLoader

urls = "s3://bucket/laion/train-{000000..001023}.tar"

dataset = (
    wds.WebDataset(urls, shardshuffle=1000)
    .shuffle(10000) # sample-level shuffle buffer
    .decode("pil")
    .to_tuple("jpg", "json")
    .map(preprocess)
)

loader = DataLoader(
    dataset,
    batch_size=64,
    num_workers=8,
    prefetch_factor=2,
    pin_memory=True,
    persistent_workers=True,
)
```

### WebDataset 调参关注点

| 点位 | 作用 | 风险 | 建议 |
| --- | --- | --- | --- |
| shard size | 决定顺序读效率和 shuffle 粒度 | 太小对象存储请求多;太大下载慢、失败重试代价高 | 图像常见几百 MB 到数 GB;按网络和缓存能力调 |
| `shardshuffle` | 打乱 shard 顺序 | 太小随机性差,太大启动和内存压力高 | 多节点训练必须明确设置,不要依赖默认行为 |
| `shuffle(buffer)` | 样本级内存 shuffle buffer | buffer 太小随机性弱,太大占内存 | 按样本大小选择;文本 token 样本可更大,图像需谨慎 |
| node / worker split | 避免不同 rank/worker 读同一批 shard | 没切分会重复样本,切分错会漏样本 | 使用库提供的 split 或显式按 rank/worker 切 shard |
| resampling | 无限训练流或多数据源混合 | epoch 长度、样本均衡和复现性更复杂 | 记录 seed、epoch\_size、数据源权重 |

WebDataset 的设计取舍:用大 shard 换顺序 I/O,再用双层 shuffle 弥补随机性。

## Mosaic Streaming:远端数据 + 本地缓存 + 可恢复

30 MIN

Mosaic Streaming 的目标是让大规模远端数据像本地 dataset 一样被训练任务消费。 `StreamingDataset` 是一个 PyTorch `IterableDataset`,核心参数是: `remote` 指远端数据目录, `local` 指本地缓存目录, `predownload` 控制每个 worker 提前下载多少样本, `cache_limit` 控制本地缓存上限。 它还强调 deterministic shuffle 和 mid-epoch resume,适合弹性训练和云存储数据集。

### StreamingDataset 示例

```
from streaming import StreamingDataset
from torch.utils.data import DataLoader

dataset = StreamingDataset(
    remote="s3://bucket/mds/train",
    local="/local_nvme/cache/train",
    split="train",
    shuffle=True,
    batch_size=64, # 与 DataLoader per-device batch 对齐
    predownload=1024, # 每 worker 提前缓存的样本目标
    cache_limit="500gb",
)

loader = DataLoader(
    dataset,
    batch_size=64,
    num_workers=8,
    pin_memory=True,
    persistent_workers=True,
)
```

### Mosaic Streaming 字段表

| 字段 | 含义 | 调参信号 | 注意 |
| --- | --- | --- | --- |
| `remote` | 远端数据目录,可来自对象存储 | 网络慢、下载失败、首轮启动慢 | 训练机器需要权限和稳定网络 |
| `local` | 本地缓存目录 | cache 命中率、磁盘空间、本地 IO | 优先本机 NVMe,避免网络盘 |
| `predownload` | 每 worker 提前下载的样本数量目标 | GPU 等数据时调大;磁盘/网络压力过高时调小 | 官方建议值应大于 per-device batch,默认可由 batch\_size 推导 |
| `cache_limit` | 本地 shard cache 上限 | 磁盘快满或频繁 evict | 太小会反复下载,太大可能挤爆本地盘 |
| `epoch_size` | 每 epoch 采样数量 | 多数据源混合、相对权重采样 | 要和训练 steps、resume 语义对齐 |
| `shuffle_block_size` | shuffle 的 block 粒度 | 随机性不足或内存压力 | 块内 shuffle,不是无限全局随机 |
| `batch_size` | 用于确定 dataset 在 worker/rank 间的分区和恢复 | resume 后样本顺序异常 | 应和 DataLoader per-device batch size 保持一致 |

适合

### 云上大数据 + 弹性训练

数据集远大于本地盘,需要边下边训;集群可能扩缩容或中断恢复;希望库处理分区、缓存、shuffle 和 mid-epoch resume。

不适合

### 本地小数据或极简实验

如果数据已经完整放在本地 NVMe,格式简单,且不需要弹性恢复,直接 map-style Dataset 或 WebDataset 可能更轻。

## 自定义 IterableDataset:别重复读样本

35 MIN

当你自己写 `IterableDataset` 时, 最关键的工程问题是:在多机、多 rank、多 worker 下,每个 reader 应该读不同的数据切片。 PyTorch 文档明确提醒:多进程加载时同一个 dataset 对象会在 worker 中复制, 因此需要在 ` __iter__ ()` 里用 `get_worker_info()` 或在 `worker_init_fn` 里改写每个 worker 的范围,避免重复数据。

```
import itertools
import os
import torch
import torch.distributed as dist
from torch.utils.data import IterableDataset, get_worker_info

class ShardedJsonlDataset(IterableDataset):
    def __init__ (self, files, seed=1234):
        self.files = list(files)
        self.seed = seed

    def _rank_info(self):
        if dist.is_available() and dist.is_initialized():
            return dist.get_rank(), dist.get_world_size()
        return 0, 1

    def __iter__ (self):
        rank, world = self._rank_info()
        worker = get_worker_info()
        worker_id = worker.id if worker else 0
        num_workers = worker.num_workers if worker else 1

        # 全局 reader id = rank 内 worker id 组合,确保每个 reader 读不同文件
        reader_id = rank * num_workers + worker_id
        num_readers = world * num_workers

        files = self.files[reader_id::num_readers]
        for path in files:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    sample = parse_jsonl_line(line)
                    yield tokenize_and_pack(sample)
```

### 自定义 IterableDataset 检查表

| 问题 | 为什么重要 | 检查方式 | 常见修复 |
| --- | --- | --- | --- |
| rank/worker 是否去重? | 重复样本会污染 epoch 统计和有效 batch | 打印前 100 个 sample id,按 rank/worker 分组查重 | 按 `rank * num_workers + worker_id` 切 files/shards |
| epoch 边界是否清楚? | IterableDataset 可以是无限流,DataLoader 不一定知道真实长度 | 明确每 epoch samples 或 steps | 使用 `take(n)`、`epoch_size` 或训练循环控制 step |
| shuffle 是否足够? | 顺序文件流会造成数据相关性 | 统计连续 batch 的类别/长度分布 | shard shuffle + buffer shuffle + seed per epoch |
| resume 是否可恢复? | 中断后重复/跳过样本会影响训练 | 保存 epoch、sample offset、shuffle seed | 优先使用支持 mid-epoch resume 的库,或自己记录状态 |
| 异常样本怎么处理? | 坏文件会杀 worker,导致训练中断 | 记录 decode/tokenize error 计数 | 跳过并上报,设置最大错误率阈值 |

自定义 IterableDataset 的底线:多 rank、多 worker 不能重复读,错误样本不能静默吞太多,恢复后样本顺序要可解释。

## 动手实验:画出你的 DataLoader 曲线

50 MIN

今天的交付物是一张调参表:不同 `num_workers`、`prefetch_factor`、 `pin_memory` 组合下的 `data_time`、`h2d_time`、 GPU util 和内存/共享内存占用。 目标不是把 worker 一路加大,而是找到吞吐不再增长、资源开始爆的拐点。

```
# dataloader_probe.py
import argparse
import time
import torch
from torch.utils.data import DataLoader

def move_to_cuda(batch):
    if torch.is_tensor(batch):
        return batch.cuda(non_blocking=True)
    if isinstance(batch, dict):
        return {k: move_to_cuda(v) for k, v in batch.items()}
    if isinstance(batch, (list, tuple)):
        return type(batch)(move_to_cuda(v) for v in batch)
    return batch

def probe(dataset, batch_size, workers, prefetch, pin_memory, steps):
    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        num_workers=workers,
        prefetch_factor=prefetch if workers > 0 else None,
        pin_memory=pin_memory,
        persistent_workers=workers > 0,
        drop_last=True,
    )

    it = iter(loader)
    data_times, h2d_times = [], []
    for _ in range(steps):
        t0 = time.perf_counter()
        batch = next(it)
        t1 = time.perf_counter()
        batch = move_to_cuda(batch)
        torch.cuda.synchronize()
        t2 = time.perf_counter()
        data_times.append(t1 - t0)
        h2d_times.append(t2 - t1)

    print({
        "workers": workers,
        "prefetch": prefetch,
        "pin_memory": pin_memory,
        "data_ms": 1000 * sum(data_times) / len(data_times),
        "h2d_ms": 1000 * sum(h2d_times) / len(h2d_times),
    })
```

### 实验矩阵

| 维度 | 取值 | 观察 | 停止条件 |
| --- | --- | --- | --- |
| `num_workers` | 0 / 2 / 4 / 8 / 16 | data\_time 是否下降,CPU 是否打满 | 吞吐不涨或 CPU/内存开始爆 |
| `prefetch_factor` | 1 / 2 / 4 | queue 是否更稳定,shared memory 是否上升 | /dev/shm 紧张或 batch 延迟无改善 |
| `pin_memory` | False / True | H2D copy 时间是否下降 | pinned memory 压力过高或 batch 类型无法 pin |
| 格式 | 小文件 / WebDataset / Streaming cache | 对象存储请求数、磁盘顺序读、首轮启动时间 | 顺序读格式已能喂满 GPU |

### 系统观测命令

```
# GPU 是否空等
nvidia-smi dmon -s pucm

# 磁盘 await/util 是否高
iostat -xz 1

# worker CPU 是否打满
pidstat -ru -p ALL 1

# shared memory 是否不足
df -h /dev/shm
ipcs -m

# 容器启动时常见修复
docker run --shm-size=64g ...
```

### 记录模板

| workers | prefetch | pin | data\_ms | h2d\_ms | GPU util | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | None | False | \_\_ | \_\_ | \_\_% | 主进程加载 baseline |
| 8 | 2 | True | \_\_ | \_\_ | \_\_% | 常用起步配置 |
| 16 | 4 | True | \_\_ | \_\_ | \_\_% | 观察 CPU/shm 是否过载 |

## 交付物检查

DELIVERABLE

- 画出从 storage → shard reader → decode/tokenize → transform → collate → H2D → GPU 的数据通路图。
- 写出一份 WebDataset 或 Mosaic Streaming 的最小训练读取代码。
- 写出自定义 `IterableDataset` 的 rank/worker sharding 逻辑,并用 sample id 验证不重复。
- 完成 `num_workers` × `prefetch_factor` × `pin_memory` 的三组以上实验。
- 记录 `data_time`、H2D copy 时间、GPU util、CPU util、磁盘 util 和 `/dev/shm` 占用。
- 写一句最终调参结论:当前瓶颈在 storage、CPU transform、H2D copy,还是 shared memory。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么 `num_workers` 不是越大越好?

ANS

worker 多了会增加 CPU 调度、内存、shared memory、文件句柄和存储并发压力。如果瓶颈是磁盘或对象存储,继续加 worker 只会让请求更拥堵。正确做法是看 data\_time 是否继续下降,以及 CPU/iostat/shm 是否已经饱和。

### Q2 · IterableDataset 多 worker 为什么会重复数据?

ANS

因为每个 worker 都会拿到 dataset 对象的一份副本。如果 ` __iter__ ()` 里只是从同一个文件列表从头读,每个 worker 都会读相同样本。必须用 rank、worker\_id、num\_workers 把 shard 或样本范围切开。

### Q3 · WebDataset 为什么比小文件目录更适合大规模训练?

ANS

它把大量小文件打成少量 tar shards,让存储和对象存储走顺序读,减少 metadata lookup 和随机 I/O。随机性通过 shard shuffle 和样本 shuffle buffer 补回来。大规模训练里,顺序吞吐通常比随机小文件访问重要得多。

### Q4 · `pin_memory=True` 为什么有时没效果?

ANS

如果瓶颈不在 H2D copy,而在解码、tokenize 或存储,它不会明显提升吞吐。另一个常见原因是 collate 返回了自定义 batch 类型,默认 pinning 逻辑不认识;这时需要给自定义类型实现 `pin_memory()`。

### Q5 · Mosaic Streaming 和 WebDataset 该怎么选?

ANS

如果你已经有 tar shards,希望简单、高吞吐、顺序读,WebDataset 很直接。如果数据在云对象存储,需要本地 cache、deterministic shuffle、mid-epoch resume、弹性训练,Mosaic Streaming 更贴近完整训练系统。两者都比随机读海量小文件更适合大规模训练。

## 复盘问题

REVIEW

1. `data_time` 和 GPU util 之间是什么关系?
2. Map-style Dataset 和 IterableDataset 在分布式训练中的核心差异是什么?
3. 为什么多 worker IterableDataset 必须显式按 worker/rank 切分?
4. `prefetch_factor` 的总预取量如何计算?它为什么会增加内存压力?
5. `pin_memory=True` 配合 `non_blocking=True` 解决的是哪段瓶颈?
6. WebDataset 的 shard shuffle 和 sample shuffle 分别解决什么问题?
7. Mosaic Streaming 的 `remote`、`local`、`predownload`、`cache_limit` 分别控制什么?

## 参考资料

OFFICIAL DOCS

PYTORCH

### torch.utils.data

PyTorch 官方 DataLoader / Dataset / IterableDataset 文档,包含 `num_workers`、`prefetch_factor`、`pin_memory` 等参数说明。
[docs.pytorch.org · torch.utils.data](https://docs.pytorch.org/docs/2.12/data.html)

WEBDATASET

### WebDataset Repository

WebDataset 官方仓库与说明,介绍 tar shard 格式、IterableDataset 风格管线、shuffle、decode、map 和 batch。
[github.com · webdataset/webdataset](https://github.com/webdataset/webdataset)

MOSAIC

### StreamingDataset API

Mosaic Streaming 官方 API 文档,覆盖 `remote`、`local`、`predownload`、`cache_limit`、shuffle 和 resume 字段。
[docs.mosaicml.com · StreamingDataset](https://docs.mosaicml.com/projects/streaming/en/stable/api_reference/generated/streaming.StreamingDataset.html)

PYTORCH BLOG

### Efficient PyTorch I/O

PyTorch 官方博客对 WebDataset 和大规模 I/O 的背景介绍,适合理解为什么 shard + sequential I/O 对多 GPU 训练重要。
[pytorch.org · Efficient PyTorch I/O](https://pytorch.org/blog/efficient-pytorch-io-library-for-large-datasets-many-files-many-gpus/)

最贵的 GPU 时间,往往浪费在等待下一批数据的沉默里。

DAY 25 COMPLETE · NEXT: OPERATOR-LEVEL ACCELERATION
