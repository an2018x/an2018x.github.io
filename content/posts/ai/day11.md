---
title: "Day 11 · 显存管理"
date: '2026-05-25'
draft: false
description: "拆开 PyTorch 的 caching allocator:Segment / Block 两级结构、small/large pool 分裂、stream 池隔离;掌握 memory_summary / memory_snapshot 工具链,学会 OOM 排查的标准流程,并理解 expandable_segments 如何根治碎片化。"
toc: true
tags:
  - AI
  - PyTorch
  - CUDA
  - Memory
  - Internals
---

DAY 11 · AI INFRA ROADMAP · 60 DAYS

# 显存的 _影子簿_

`nvidia-smi` 上写着 24 GiB 已用, `tensor.numel() * 4` 算出来只有 6 GiB —— _中间那 18 GiB 去哪了?_ 今天把 PyTorch 的 caching allocator 剖到底: **Segment + Block** 两级结构、 **small / large pool** 分裂、 **stream 池** 隔离、 **splitting / coalescing** 机制。 再用 `memory_snapshot` 把 OOM 现场抓下来一格一格读, 最后认识 `expandable_segments` 怎么用虚拟内存根治碎片。

**DURATION** 3 h **THEORY** 1.5 h **HANDS-ON** 1 h **REVIEW** 0.5 h **STACK** CUDA · PyTorch · nvidia-smi · memory\_viz

## 思维导图

OVERVIEW

> **图：Day 11 思维导图**
>
> - DAY 11 · 显存管理
> - ALLOCATOR · POOLS · FRAGMENTATION · OOM
> - 01 · WHY
> - 为什么要 caching
> - 02 · STRUCT
> - Segment + Block
> - 03 · DEBUG
> - OOM 排查工具链
> - 04 · TUNE
> - 配置 + 碎片治理
> - cudaMalloc 太慢
> - cudaFree 同步
> - 复用 = 性能
> - allocated vs reserved
> - small / large pool
> - best-fit + split
> - free → coalesce
> - stream 池隔离
> - memory\_summary()
> - memory\_snapshot()
> - record\_memory\_history
> - \_memory\_viz.html
> - max\_split\_size\_mb
> - expandable\_segments
> - gc\_threshold
> - checkpointing 配合
> - DELIVERABLES
> - allocator 内部结构图
> - 读懂一份 memory\_summary
> - 抓一次 memory snapshot
> - OOM cookbook 笔记

FIG · Day 11 全景:从"为什么不直接用 cudaMalloc"到 OOM 现场取证,再到生产级调优

## 为什么 PyTorch 不直接调 cudaMalloc

25 MIN

训练一个 step 里 PyTorch 会做_成千上万次_显存申请/释放 —— forward 的临时张量、activation、Autograd 保留的中间结果、梯度 buffer…… 如果每次都直接调 `cudaMalloc` / `cudaFree`, **性能会差到训练根本跑不动** 。caching allocator 就是为了把这条路绕开。

### 三个核心痛点

| 问题 | cudaMalloc / cudaFree 的表现 | 对训练的影响 |
| --- | --- | --- |
| 申请慢 | 每次都要进入 driver,查页表、分配物理内存( **毫秒级** ) | 每个 op 的临时张量都付一次这种成本 → 吞吐崩 |
| 隐式同步 | `cudaFree` 是 **device-wide 同步点** —— 等所有 stream 上的工作做完才能返回 | 训练严重依赖 CPU/GPU 异步重叠;一个 free 就杀掉流水线 |
| 粒度不匹配 | 调用方一次申请几 KB,driver 内部按 page(MB 级)分配 | 大量小张量 → 内部碎片爆炸,GPU 表面"用了 24 GiB"但其实只装了 6 GiB 数据 |

### caching allocator 的三条策略

> **图：caching allocator 三条策略**
>
> - WHY CACHING — THREE STRATEGIES
> - ① 批发再零售
> - 向 driver 一次性要大段
> - cudaMalloc 一个 Segment(2 MB / 20 MB)
> - 应用层"申请"只是在 Segment 内切 Block
> - → 申请耗时降到 微秒级
> - ② 释放 = 归还池子
> - free 不还给 driver
> - Block 标 free,放回 allocator 的空闲池
> - 下次同尺寸申请直接命中(O(log n))
> - → 避开 cudaFree 的隐式同步
> - ③ 切分 + 合并
> - 大 Block 可切小,相邻可合
> - 申请小:从大 Block 切出来,剩余留池
> - 释放后:与相邻 free Block 合并
> - → 尽量让大请求也能命中
> - PERFORMANCE COMPARISON — 1000 次申请释放
> - 直接 cudaMalloc / cudaFree
> - ~ 850 ms
> - caching allocator
> - ~ 12 ms (~ 70× 加速)
> - 实测条件
> - A100 · 1024 元素 fp32 张量 · 单 stream · 三种成本差异主要来自避开 driver 路径与同步

FIG · 三条策略合起来才是真正的"caching":批发 + 池化 + 切合并,共同把 GPU 显存分配从毫秒压到微秒

### 两个永远要分清的概念

ALLOCATED

### allocated\_bytes

**当前真正持有的张量字节数** 。这是你 `tensor.numel() * dtype_size` 累加出来的数。GC 走完、引用清零后会回落。 **这个数和你"模型大小 + 中间激活"的直觉对得上** 。

RESERVED

### reserved\_bytes

**allocator 向 driver 要过、还没还的总量** (也叫 cached)。即使你的张量全部释放,只要没主动 `empty_cache()`,这个数也不会降下来。 **nvidia-smi 看到的占用 ≈ reserved + 其它系统开销** 。

关系

### allocated ≤ reserved

不等式永远成立。`reserved − allocated` 是 allocator 当前持有但"借给"任何张量的空闲缓存。如果这个差始终在涨,要么你_泄漏了_,要么_碎片化严重_。第 3 节会教你怎么定位。

RSS / nvidia-smi

### 进程视角更大

nvidia-smi 看到的"已用"通常 **\> reserved** :还要算 CUDA context(几百 MiB)、cuBLAS / cuDNN workspace、NCCL buffer、其它进程。 **OOM 时这三个数都要看,不能只盯一个** 。

本节 takeaway: caching allocator = 自己造的 GPU 内存池,目标是把 cudaMalloc/Free 从训练热路径上彻底拿掉。

## 内部结构 — Segment + Block 两级模型

35 MIN

源码在 `c10/cuda/CUDACachingAllocator.cpp`,是 PyTorch 仓库里 _最难也最重要的几千行 C++ 之一_。 不需要全读,但要在脑子里有清晰的两级模型:Segment 是 driver 那一级粗粒度块,Block 是应用面细粒度块, 二者通过 **有序双向链表** 串起来。

> **图：caching allocator 内部结构**
>
> - INSIDE THE CACHING ALLOCATOR
> - CUDA DRIVER
> - cudaMalloc() · cudaFree() · cudaMallocAsync()
> - 物理显存
> - LEVEL 1 · SEGMENTS — 一次 cudaMalloc 的产物,粗粒度
> - SEGMENT A · 2 MiB · small pool
> - USED 512K
> - FREE 256K
> - USED 768K
> - FREE 512K
> - SEGMENT B · 20 MiB · large pool
> - USED 8 MiB · activation
> - FREE 3 MiB
> - USED 8 MiB · grad
> - LEVEL 2 · BLOCKS — 应用层 alloc 命中的单位,细粒度
> - struct Block
> - size, ptr, stream, segment\*
> - prev, next ← 同 Segment 内双向链表
> - allocated, history ← snapshot 用
> - free pool · std::set\<Block\*\> 按 size 排序
> - alloc(N) = lower\_bound(N) → best-fit
> - 找到的 block 太大 → split,剩余还入池
> - free(block) → 合并相邻 free → 重入池
> - STREAM 隔离 — 每个 CUDA stream 一组 (small\_pool, large\_pool)
> - 同 stream 上 free 的 block 立刻可被该 stream 复用 · 跨 stream 借用需 record\_stream 等同步原语
> - 这是为什么多卡 / 多 stream 场景下,看似"空闲"的显存可能用不上 —— 它属于另一条 stream 的池
> - 实际工作中常见的"莫名其妙 OOM",一半是 stream 池隔离导致

FIG · Driver → Segment(大块)→ Block(细块)→ 应用层张量;每个 stream 又是独立的池

### small / large pool — 1 MiB 的分水岭

为了减少碎片,allocator 把所有 Block 按大小分到 **两个独立的池** 。 界线是 **1 MiB** (`kSmallSize`), Segment 的默认尺寸也对应这个分类。

| 池 | Block 大小 | Segment 默认大小 | 圆整(round-up)规则 |
| --- | --- | --- | --- |
| small pool | \< 1 MiB | `kSmallBuffer` = 2 MiB | 向上对齐到 512 B 倍数 |
| large pool | 1 MiB ≤ size ≤ 10 MiB | `kLargeBuffer` = 20 MiB | 向上对齐到 2 MiB 倍数 |
| large pool | \> 10 MiB | cudaMalloc(_请求大小_) | 不切分,自己一个 Segment |

### alloc / free 一次完整流程

```
// 伪代码:对照 c10/cuda/CUDACachingAllocator.cpp 阅读
Block* alloc(size_t size, cudaStream_t stream) {
  size = round_up(size); // 512B / 2MiB 对齐
  auto& pool = (size < 1_MiB) ? small_pool[stream] : large_pool[stream];

  // ① best-fit:在按 size 排序的 std::set 里找第一个 >= size 的 free block
  auto it = pool.lower_bound(BlockKey{size, stream});
  if (it != pool.end()) {
    Block* b = *it;
    pool.erase(it);
    // ② 命中后如果 block 显著大于请求,就把它切两半
    if (should_split(b, size)) {
      Block* tail = split(b, size); // tail 留在 free pool
      pool.insert(tail);
    }
    return b;
  }

  // ③ 没命中:向 driver 申请新 Segment
  Block* seg = cuda_malloc(segment_size_for(size));
  pool.insert(seg);
  return alloc(size, stream); // 递归 → 这次一定能命中
}

void free(Block* b) {
  // ④ 不还给 driver,只是回池
  auto& pool = pool_for(b);
  // ⑤ 合并:看左右相邻的 block 是不是 free,在同 Segment 内就 merge
  if (b->prev && b->prev->is_free()) b = merge(b->prev, b);
  if (b->next && b->next->is_free()) b = merge(b, b->next);
  pool.insert(b);
}
```

SPLIT 阈值

### 什么时候才切

不是只要"大于请求"就切。如果剩余 tail 太小(默认阈值 1 MiB),切了也用不上,反而加剧碎片。 **只有 tail \> 1 MiB 才会真的切** ;否则整块给你,代价是内部碎片。这条策略由 `max_split_size_mb` 控制(下一节)。

COALESCE 限制

### 合并只在 Segment 内

两个 free block 即使物理上相邻,只要不在同一个 Segment 就 **无法合并** —— 因为 Segment 是 cudaMalloc 的边界,跨边界没意义。这是 caching allocator 最容易产生"明明有空闲却 OOM"的根源:小 block 散落各 Segment,没人能凑出一个连续大块。

STREAM 池

### 每 stream 一组池

同一物理显存属于哪个池,由 **第一次分配它的 stream** 决定。free 后它回到这个 stream 的池,默认 **不会跨 stream 复用** (避免读到旧数据)。多 stream 场景容易出现"A stream 的池满了,B stream 的池一片空"的尴尬。

RECORD\_STREAM

### 跨 stream 怎么办

把 `x.record_stream(other_stream)` 调一下,allocator 就知道这块内存"被另一条 stream 看过",会等到那条 stream 也走完了才肯回收。 **是少数显式介入 allocator 的 API,在 NCCL / pipeline 代码里常见** 。

Segment 是边界,Block 是单位,pool 是索引,stream 是命名空间 —— 四个概念合起来才是 allocator 全貌。

## OOM 排查工具链 — 三件套

35 MIN

OOM 不是"显存不够"那么简单。 绝大多数生产 OOM 都是_"显存够但拿不出连续块"_(碎片)、 _"用完没释放"_(泄漏)、或者_"峰值刚好超线"_(瞬时)。 不同病因要不同药方,不能只看 `nvidia-smi` 拍脑袋。

### 三件套 + 各自的适用场景

| 工具 | 看什么 | 开销 | 适用 |
| --- | --- | --- | --- |
| `memory_stats()` | 当下的计数(allocated / reserved / active / 峰值) | 极低 | 日常监控、加进训练 loop 每 N step 打一次 |
| `memory_summary()` | 同上但格式化成表,带 small / large pool 拆分 | 极低 | OOM 之后第一时间打印,快速判断病因 |
| `memory_snapshot()` | 所有 Segment / Block 的快照,可视化 | 低,但 **需要先开 history** | 定位泄漏、追踪谁分配的 → 真正破案的工具 |

### 第一步 — 读懂 memory\_summary

```
import torch
print(torch.cuda.memory_summary(device=0, abbreviated=False))

|=============================================================================|
| PyTorch CUDA memory summary, device ID 0 |
|-----------------------------------------------------------------------------|
| CUDA OOMs: 0 | cudaMalloc retries: 4 | ← 重试 = 警讯
|=============================================================================|
| Metric | Cur Usage | Peak Usage | Tot Alloc | Tot Freed |
|---------------------------------------------------------------------------|
| Allocated memory | 18.4 GiB | 22.1 GiB | 412.0 GiB | 393.6 GiB |
| Active memory | 18.4 GiB | 22.1 GiB | 412.0 GiB | 393.6 GiB |
| Requested memory | 18.3 GiB | 21.9 GiB | 411.2 GiB | 392.9 GiB |
| GPU reserved memory | 23.8 GiB | 23.8 GiB | 23.9 GiB | 100.0 MiB | ← 一直在涨
| Non-releasable memory | 5436 MiB | 5440 MiB | 200.0 GiB | 194.5 GiB | ← 这就是碎片
| Allocations | 8412 | 9023 | 823541 | 815129 |
| Active allocs | 8412 | 9023 | 823541 | 815129 |
| GPU reserved segments | 145 | 148 | 156 | 11 |
| Non-releasable allocs | 283 | 291 | 7012 | 6729 |
|---------------------------------------------------------------------------|
```

### 每一行的解读

| 指标 | 含义 | 异常信号 |
| --- | --- | --- |
| Allocated | 当前真实持有的张量字节数 | 持续单调上升 → 泄漏 |
| Requested | 应用层请求的字节数(对齐前) | 与 Allocated 差距大 → 大量小张量被 round-up |
| Reserved | allocator 持有(包括空闲缓存) | 远超 Allocated 且不降 → 碎片 |
| Non-releasable | 有 free block,但所在 Segment 不能整段还(因为 Segment 还有其它 used block) | 这个数大 = 碎片严重的 **铁证** |
| cudaMalloc retries | 第一次申请失败,触发 GC 重试的次数 | \> 0 即为预警,马上要 OOM 了 |
| Reserved segments | 从 driver 拿了多少个 Segment | 持续涨 + 总量不大 → 工作集太碎 |

### 第二步 — 抓 snapshot 找元凶

memory\_summary 告诉你_"是泄漏还是碎片"_, 但要回答 **"是谁分配的"** ,只能靠 snapshot。 它会记录每个 Block 的_分配栈_,然后用官方 visualizer 画成时间轴。

```
import torch

# 1) 开启历史记录 —— 训练开始前调一次
torch.cuda.memory._record_memory_history(
    enabled="all", # 'all' = 同时记录 alloc/free 栈
    max_entries=100000,
)

# 2) 跑你的训练 / 推理代码 ...
train_one_epoch(...)

# 3) OOM 之后(或者 finally 里),把快照 dump 出来
torch.cuda.memory._dump_snapshot("snapshot.pickle")

# 4) 关掉记录,避免长跑时拖性能
torch.cuda.memory._record_memory_history(enabled=None)
```

把 `snapshot.pickle` 拖进 `pytorch/torch/cuda/_memory_viz.py` 就生成一个 HTML 文件(也可以直接打开 [pytorch.org/memory\_viz](https://pytorch.org/memory_viz)), 鼠标悬停每个 Block 都能看到 **分配时的 Python 栈** 。

> **图：memory snapshot 时间轴示意**
>
> - MEMORY SNAPSHOT TIMELINE — 一次训练 step
> - t=0
> - forward
> - backward
> - optim.step
> - t=T
> - 24G
> - 12G
> - 0
> - model weights · 6 GiB · 整个训练常驻
> - activations · 峰值 9 GiB
> - ↓ backward 阶段被一层层释放
> - gradients · 6 GiB · backward 期生成
> - optimizer · m+v
> - 峰值在这里!

FIG · 训练一个 step 的显存占用形状:权重常驻 + 激活波峰 + 梯度方块 + optimizer 状态

### 三种典型 OOM 病因 × 对症下药

病因 ①

### 泄漏(allocated 一路上涨)

典型表现:每个 step 结束 allocated 都比上一个 step 多几十 MB,反复 N 步必 OOM。
**常见元凶** :把 tensor 放进 Python list 做日志、保留 loss.item() 之外的 loss 张量、计算图没被 detach。
**药方** :snapshot 看哪些 block 跨 step 没释放 → 追到分配栈 → 加 `.detach()` 或 `.item()`。

病因 ②

### 碎片(reserved 远超 allocated)

典型表现:`allocated=12 GiB` 但 `reserved=22 GiB`,nvidia-smi 显示快满,再申请一个 500 MiB 张量就 OOM。
**常见元凶** :训练中张量大小动态变化(变长 seq、动态 batch)。
**药方** :`PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` 或 `max_split_size_mb:128`(下一节)。

病因 ③

### 峰值过高(瞬时超线)

典型表现:平均 18 GiB,但 backward 时峰值冲到 25 GiB。
**常见元凶** :超长激活、checkpoint 没开。
**药方** :`torch.utils.checkpoint` 牺牲 30% 时间换 1/2 激活内存;或开 AMP / FP8(Day 12)。

误诊提醒

### empty\_cache() 只对碎片有效

把所有 free 的 **完整 Segment** 还给 driver。 **注意是"完整 Segment"** —— Segment 内只要还有一个 used block,整段都还不掉。所以 empty\_cache 对泄漏完全无效,对碎片也只能缓解,不能根治。_它最适合的场景是"训练前先跑了 sanity check 留下一堆空闲 Segment,正式训练前清一下"_。

破案三步走:① memory\_summary 定病因 → ② snapshot 找元凶 → ③ 配置 / 代码改造 → 再走一遍验证。

## 动手实践 — 配置 + 治理碎片

1 H

碎片不是 bug 而是工程取舍,但 PyTorch 给了一组环境变量让你_按场景调优_。 其中 **expandable\_segments** 是 PyTorch 2.1+ 引入的"用虚拟内存根治碎片"的方案, 值得单独花时间理解。

### PYTORCH\_CUDA\_ALLOC\_CONF 速查表

| 选项 | 作用 | 默认 | 什么时候开 |
| --- | --- | --- | --- |
| `expandable_segments` | 用 **cuMemMap** 让一个 Segment 物理上可增长,从根本消除"段间碎片" | False | 2.1+ · 张量大小变化大(变长 seq) · _强烈推荐_ |
| `max_split_size_mb` | 大于此阈值的 block 不再切分,只整块给 | 未设 | 大张量场景 · 想避免大 block 被切碎 |
| `garbage_collection_threshold` | reserved/Allocated 超过这个比例时,在 alloc 失败前主动 GC 一次 | 0.0(关) | 0.8 是常用值,提前给 driver 还块 |
| `backend` | 选择 `native`(默认 caching allocator)或 `cudaMallocAsync` | native | 新驱动 + 多进程共享显存场景 |
| `roundup_power2_divisions` | 请求大小向上对齐到 2 的幂的若干份 | 1 | 小张量极多场景下能略微降碎片 |

### expandable\_segments 的工作原理

> **图：expandable segments 原理**
>
> - EXPANDABLE SEGMENTS — 一段虚拟地址,按需挂载物理页
> - CLASSIC · 一个 Segment 是一整块 cudaMalloc 物理内存
> - Segment A · 20 MiB
> - Segment B · 20 MiB
> - Segment C · 20 MiB
> - ↳ 三块加起来 free 7 MiB,
> - 但你想要 5 MiB 连续 → OOM
> - EXPANDABLE · 一段巨大的虚拟地址 + 按需挂物理页
> - VIRTUAL ADDRESS SPACE · 预留 80 GiB(只占地址,不占物理)
> - ↑ free 区域的物理页可以被 unmap 还给 driver
> - 地址依然保留 → 下次需要还能用同一段连续地址
> - 还能凑出连续 5 MiB → ✓
> - 底层使用 cuMemAddressReserve / cuMemCreate / cuMemMap (CUDA Virtual Memory Management API)

FIG · classic 模式段间不可合;expandable 用虚拟地址连成一片,物理页按需挂卸,根治段间碎片

### 怎么开 expandable\_segments

```
# 方法一:环境变量(最常用,启动前设)
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

# 同时调多个选项,逗号分隔
export PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True,max_split_size_mb:512,garbage_collection_threshold:0.8"

# 方法二:Python 端动态设置(必须在第一次 alloc 之前)
import torch
torch.cuda.memory._set_allocator_settings("expandable_segments:True")
```

### 完整 OOM 排查脚本

```
# oom_probe.py — 一键给训练加监控,出 OOM 自动 dump 现场
import torch, atexit, traceback

# 1. 训练开始就开 history
torch.cuda.memory._record_memory_history(enabled="all", max_entries=200_000)

def dump_on_exit():
    # 总会跑,不管是正常退出还是 OOM
    torch.cuda.memory._dump_snapshot("oom_snapshot.pickle")
    print(torch.cuda.memory_summary())

atexit.register(dump_on_exit)

# 2. 训练 loop 里周期性打印水位
def log_mem(step):
    if step % 100 == 0:
        a = torch.cuda.memory_allocated() / 2**30
        r = torch.cuda.memory_reserved() / 2**30
        print(f"step {step} alloc={a:.2f}G reserved={r:.2f}G frag={r-a:.2f}G")

for step, batch in enumerate(loader):
    loss = model(batch).sum()
    loss.backward()
    optim.step()
    optim.zero_grad(set_to_none=True) # 关键:不要保留梯度内存
    log_mem(step)
```

### 省显存的"标准动作清单"

代码层

### 10 行能省 30% 显存的改动

① `optim.zero_grad(set_to_none=True)` — 不分配零张量,直接置空。
② loss 日志只存 `.item()`,绝不存原张量。
③ `torch.no_grad()` 包住所有验证/推理代码。
④ 自定义 hook 必须 `.detach()`。
⑤ `del` 用完的大中间张量(尤其是 KV cache)。

配置层

### 四件套(2026 年默认推荐)

① `expandable_segments:True` — 最大单项收益。
② `garbage_collection_threshold:0.8` — 提前 GC。
③ `max_split_size_mb:512`(可选) — 大张量场景。
④ Optimizer 用 `foreach=True` + `fused=True` — 少临时张量。

结构层

### 真省显存靠这些

① Activation checkpointing(`torch.utils.checkpoint`)— 时间换空间,1/2 激活。
② AMP / BF16 / FP8(Day 12)— 直接砍半激活和梯度。
③ ZeRO / FSDP(Day 18)— 把 optimizer 和参数切给多卡。
④ Offload 到 CPU(DeepSpeed)— 最后手段,大幅降速。

DELIVERABLE

### 今天的交付物

① 跑一次故意分大小不一的张量,观察 reserved/allocated 比;② 开 `expandable_segments` 再跑同样代码,记录碎片差;③ 故意 OOM,用 `memory_snapshot` + visualizer 把现场抓下来,在 README 里贴一张图 + 一句"病因 + 药方"。

配置一行解决 70% 的碎片问题,代码动一动解决 90% 的泄漏问题,剩下 10% 才需要硬件升级。

## 常见疑问

5 QUESTIONS

### Q1 · 我调了 `torch.cuda.empty_cache()`,为什么 reserved 几乎没降?

ANS

因为 `empty_cache` 只能还 **整段完全空闲的 Segment** 。Segment 是 cudaMalloc 的最小边界,一个 Segment 里只要还有一个 used Block(哪怕只有几 KB),整段都还不掉。

典型场景:训练中你的张量分布得"星罗棋布",每个 Segment 都至少卡着一个长生命周期的 block(权重、optimizer 状态),所以 _整段空闲的 Segment 极少_,empty\_cache 看着没动静。

正确的判断方法:在 `empty_cache` 前后各打一次 `memory_summary`,看 `Non-releasable memory` 行的变化 —— 如果它没动,说明真没有完整空闲段可还。 **这是结构性问题,不是 cache 没清干净** 。开 `expandable_segments` 才是根治办法。

### Q2 · nvidia-smi 显示 GPU 满了,但我把所有 Python 对象 `del` 了,为什么还不降?

ANS

这是混淆了三层视角的经典场景:

(1) **Python 引用降到 0** → 张量析构 → 调用 `free()` → allocated 真的降了;

(2) 但 free 在 caching allocator 看来_只是把 Block 标 free 入池_,并没还给 driver → reserved 不变;

(3) driver 视角依然觉得这段显存属于你 → nvidia-smi 看到的依然满。

所以三个数永远是 `allocated ≤ reserved ≤ nvidia-smi` 的关系。要让 nvidia-smi 也降,需要先 `gc.collect()` 释放 Python 对象,再 `torch.cuda.empty_cache()` 把空闲段还给 driver。 **但这只在 Segment 完整空闲时有效** (见 Q1)。

### Q3 · small / large pool 为什么用 1 MiB 做分界?改大改小会怎样?

ANS

1 MiB 是 PyTorch 团队 **实测出来的折中值** ,不是理论最优。设计意图:小 Block(权重碎片、attention mask、控制张量等)和大 Block(activation、KV cache)的_生命周期模式很不一样_ —— 小张量频繁创建释放,大张量长期持有,如果混在一个池里互相打断,会让大张量找不到连续空间。

分两个池后:小池里的进进出出不会让大池产生空洞;大池里的整块分配也不会被小张量切碎。这是 **"按工作集划分"** 的经典分配器设计。

这个值不可调,但你可以通过 `roundup_power2_divisions` 和 `max_split_size_mb` 间接影响:前者控制 round-up 粒度,后者控制大 Block 切不切。 **除非你在写一个自定义 allocator,否则别动这个分界** 。

### Q4 · 用了 `expandable_segments` 后还会 OOM 吗?有什么副作用?

ANS

当然会 OOM —— 它治_碎片_,不治_真不够_。如果你的工作集本来就超过显卡容量(模型大 + 激活峰值),expandable\_segments 救不了你,只能 checkpointing / 减 batch / 量化。

**副作用主要有三个** :(1) 需要较新的 CUDA driver(515+),老集群可能不支持;(2) `cuMemMap` 比 `cudaMalloc` 多一层 page table 操作,极端高频小分配场景会慢一点(实测一般 \< 1%);(3) 与某些第三方库 / cuMallocAsync backend 不兼容,需要 backend=native。

实际经验: **2.1+ 训 LLM / 变长 seq 任务无脑开** ,推理也开,我从来没遇到过开了反而变慢的情况。这是 PyTorch 近年最值得开的默认。

### Q5 · 为什么 PyTorch 不直接用 CUDA 11.2+ 自带的 `cudaMallocAsync`?那是不是 driver 已经做了 caching?

ANS

`cudaMallocAsync` 是 CUDA 11.2 引入的"stream-ordered memory pool",底层确实做了 caching。PyTorch 也支持把它作为 backend:`PYTORCH_CUDA_ALLOC_CONF=backend:cudaMallocAsync`。

但默认还是 native(自己的 caching allocator),原因:

(1) **历史包袱小** :PyTorch 的 allocator 用了多年,行为可预测;cudaMallocAsync 的池策略是 driver 内部黑盒,出问题难调。

(2) **工具链成熟** :`memory_summary` / `snapshot` / `record_memory_history` 全套调试 API 都是基于 native allocator 的内部状态,换成 cudaMallocAsync 这些工具大多失效。

(3) **expandable\_segments 已经够好** :它在 PyTorch 控制下解决了主要痛点,没必要把所有权交给 driver。

实战中:_除非你有多进程共享显存的特殊需求,默认 native 就好_。

## 复盘问题

5 QUESTIONS

1. 画一张 caching allocator 的两级模型图:标出 Driver / Segment / Block / Pool / Stream 五个层次,以及它们各自的"边界"是什么(为什么不能跨边界合并)。
2. 给出一段会"看起来明显泄漏"的 Python 代码(比如把 loss 张量塞进 list 用作日志),写一段对应的诊断流程:用哪些 API、看哪几个数字、最终怎么定位元凶。
3. 解释 `allocated` / `reserved` / `non-releasable` / nvidia-smi 四个数之间的不等式关系,并举出一种_每两个相邻数都拉开较大差距_的场景。
4. 对比 classic Segment 和 expandable Segment 在"段间合并"上的差异,并解释为什么后者能用同一段虚拟地址消除段间碎片。
5. 给定环境变量 `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True,max_split_size_mb:128,garbage_collection_threshold:0.8`,说明每个选项分别针对什么样的"症状",以及组合起来会带来什么副作用或冲突。

## 今日检查清单

8 ITEMS

- 能用一句话解释 PyTorch 为什么要自己做 caching allocator(避开 cudaMalloc/Free 的高成本和同步)
- 能默写 Driver / Segment / Block / Pool / Stream 的五级模型并说明每个的"边界"
- 能区分 allocated / reserved / non-releasable / nvidia-smi 四个数,知道哪个对应哪一层视角
- 看到 `memory_summary` 输出能在 30 秒内判断是"泄漏 / 碎片 / 峰值"哪种病因
- 用 `record_memory_history` + `_dump_snapshot` 抓出一份 snapshot,在 visualizer 里能找到具体的分配栈
- 能解释 `empty_cache` 在什么情况下有效、什么情况下无效
- 知道 `expandable_segments` 的原理(虚拟地址 + cuMemMap 按需挂物理页),并能给出至少一个适用场景
- 给训练脚本加一个"省显存四件套"(set\_to\_none / .item() / no\_grad / del 中间张量)的 checklist

## 推荐阅读

5 ITEMS

MUST READ

### Understanding GPU Memory(PyTorch 官方博客)

2023 年发布的两篇博客 "Visualizing All Allocations Over Time" 和 "Finding and Removing Reference Cycles",是 `_memory_viz` 工具的作者亲自写的实战指南,带真实 OOM 案例。

OFFICIAL

### CUDACachingAllocator.cpp 源码

`c10/cuda/CUDACachingAllocator.cpp` 约 3000 行,关键看 `DeviceCachingAllocator::malloc` 和 `free_blocks`。带着今天的图去读,半天就能啃下来。

BLOG

### Zach Devito — Expandable Segments 设计文档

PyTorch 团队工程师写的 RFC,详细解释了为什么传统 caching allocator 不够、虚拟内存方案如何落地、性能 trade-off 怎么权衡。理解 expandable\_segments 的最佳一手资料。

TOOL

### pytorch.org/memory\_viz

官方托管的 snapshot visualizer 网页版,把 `snapshot.pickle` 拖进去就能交互式探索。每个 block 都能看到栈,可以按时间播放,对定位"哪一步分配最大"非常直观。

VIDEO

### PyTorch DevCon — Memory Profiling Deep Dive

历年 DevCon 都有讲 memory 工具链的 session,2023 / 2024 两年的内容覆盖 \_record\_memory\_history 设计、Inductor 时代的内存模型变化、与 FSDP 配合的实战。

## Day 12 预告

NEXT

COMING NEXT

### 混合精度与 AMP — FP32 / FP16 / BF16 / FP8 · autocast · GradScaler

今天我们用 allocator 视角省显存,明天换一种思路:_把每个数字本身变小_。Day 12 拆开混合精度训练:FP16 / BF16 / FP8 各自的数值范围与精度取舍、autocast 的 op 黑白名单怎么定、GradScaler 为什么要 dynamic loss scaling、FP8 的两种格式(E4M3 / E5M2)分别在前向反向哪里用。配合 H100 的 TransformerEngine,这是大模型训练最重要的 1.5 倍加速来源。

"显存不够,通常不是 GPU 不够大,而是 allocator 没看穿、配置没调对、代码没写干净。"

DAY 11 · AI INFRA 60-DAY ROADMAP
