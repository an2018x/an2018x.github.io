---
title: "Day 31 · PagedAttention & vLLM"
date: '2026-06-20'
draft: false
description: "学习 PagedAttention 与 vLLM 的核心机制:为什么 KV Cache 会浪费显存,如何用 block table 管理逻辑块到物理块的映射,copy-on-write 如何支撑并行采样和 beam search,以及这些机制如何服务高吞吐 LLM serving。"
toc: true
tags:
  - AI
  - LLM
  - Inference
  - vLLM
  - PagedAttention
  - KV Cache
  - Serving
---

DAY 31 · AI INFRA ROADMAP · 60 DAYS

# 把 KV Cache 变成 _分页内存_

Day 29 解释了 prefill / decode 和 KV Cache,Day 30 看了解码算法。 Day 31 进入 vLLM 的关键思想: **PagedAttention** 。 LLM serving 的吞吐瓶颈不只是算力,还有动态增长的 KV Cache 显存管理。 PagedAttention 借鉴操作系统虚拟内存,把每个请求的 KV Cache 拆成固定大小 block, 用 **block table** 做逻辑块到物理块的映射,再用 **copy-on-write** 让并行采样、beam search 和共享前缀尽量复用内存。

**DURATION** 3 h **PAPER** PagedAttention **CORE** block table · COW **SYSTEM** vLLM serving **OUTPUT** KV paging notes · toy allocator

## 思维导图

OVERVIEW

> **图：Day 31 PagedAttention 与 vLLM 思维导图**
>
> - DAY 31 · PagedAttention & vLLM
> - KV CACHE · BLOCK TABLE · COPY-ON-WRITE · SERVING
> - 01 · PROBLEM
> - KV 显存浪费
> - 02 · PAGE
> - PagedAttention
> - 03 · TABLE
> - block table
> - 04 · SHARE
> - copy-on-write
> - 请求长度动态变化
> - 连续预留造成碎片
> - best\_of / beam 复制
> - batch size 被显存限制
> - 固定 block size
> - 按需分配物理块
> - attention 读非连续块
> - 减少外部碎片
> - logical block id
> - physical block id
> - free block pool
> - ref count
> - 共享 prompt blocks
> - 写入时复制
> - 支持 parallel sampling
> - 支持 prefix caching
> - DELIVERABLES
> - KV cache 显存账
> - block table 图
> - toy allocator
> - COW 过程笔记

FIG · Day 31 全景:把动态 KV Cache 从连续数组改造成按块映射的分页内存

## 问题:KV Cache 为什么难管

30 MIN

LLM serving 中,请求不是整齐的矩阵。 每个用户 prompt 长度不同,decode 输出长度也不同,请求会随时进来、结束、被抢占或扩展。 如果给每个请求预留一大段连续 KV Cache,就会出现内部碎片、外部碎片和重复复制。 当显存被碎片吃掉,系统能放进 batch 的请求数下降,吞吐也随之下降。

KV bytes/token = 2 · layers · kv\_heads · head\_dim · bytes

系数 2 分别代表 K 和 V。GQA/MQA 会减少 kv\_heads,所以同样模型规模下 KV 显存差异很大。

request\_kv = prompt\_tokens + generated\_tokens

prefill 一次性写入 prompt KV;decode 每生成一个 token,每层都追加新的 K/V。

serving\_capacity ≈ free\_gpu\_mem / active\_kv\_bytes

权重加载后,剩余显存基本决定能同时容纳多少活跃请求和多少待生成 token。

### 显存估算脚本

```
def kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_elem=2):
    return 2 * layers * kv_heads * head_dim * bytes_per_elem

def gib(x):
    return x / 2**30

layers = 32
kv_heads = 32
head_dim = 128
tokens = 128 * 4096 # 128 个请求,每个 4K context
total = kv_bytes_per_token(layers, kv_heads, head_dim) * tokens
print(f"KV cache ~= {gib(total):.1f} GiB")
```

内部碎片

### 预留比实际用得多

如果按最大长度预留,短请求会浪费大量 KV 空间。decode 长度越不可预测,浪费越严重。

外部碎片

### 剩余空间不连续

请求结束后释放的显存散落在不同位置。总空闲可能足够,但无法给新请求分配连续大块。

重复复制

### 共享 prompt 被拷贝多份

parallel sampling、beam search 和相同系统提示词会产生大量共享前缀。若每个候选都复制 KV,显存会快速膨胀。

## PagedAttention 的核心类比

40 MIN

PagedAttention 借鉴操作系统分页: 请求看到的是连续的逻辑 token 序列,但底层 KV Cache 可以存放在不连续的物理 blocks 中。 每个请求维护自己的 block table,把第 0 个逻辑块、第 1 个逻辑块映射到具体物理块。 attention kernel 读取 KV 时不再假设 KV 是一段连续内存,而是按 block table 找到每个 token 所在的物理位置。

> **图：PagedAttention block table 示意图**
>
> - LOGICAL TOKENS TO PHYSICAL KV BLOCKS
> - Request A logical blocks
> - L0
> - L1
> - L2
> - Block table
> - [7, 2, 11]
> - Physical KV blocks
> - P0
> - P2
> - P5
> - P7
> - P8
> - P11
> - 逻辑上连续:token 0...N · 物理上可分散:physical block 7,2,11 · attention kernel 通过 block table 间接访问
> - 这就是 vLLM PagedAttention 的内存管理直觉

FIG · block table 让请求拥有连续逻辑视图,底层 KV Cache 则可以按块分散存放

| 概念 | 操作系统类比 | vLLM / PagedAttention 里是什么 | 为什么重要 |
| --- | --- | --- | --- |
| logical block | 虚拟页号 | 某个请求的第 i 个 KV block。 | 请求仍然按自己的 token 顺序增长。 |
| physical block | 物理页框 | GPU KV Cache 池里的真实存储块。 | 可以不连续,由 allocator 按需分配。 |
| block table | 页表 | 每个请求的 logical → physical 映射。 | attention kernel 通过它找到每段 K/V。 |
| ref count | 共享页引用计数 | 物理 KV block 被多少序列共享。 | 支撑共享前缀和 copy-on-write。 |

## block table 怎么工作

35 MIN

设 block size 是 16 tokens。请求当前长度 50,它需要 4 个逻辑 block: 前三个满块各 16 tokens,最后一个只用了 2 tokens。 当 decode 继续生成 token 时,系统先写入最后一个未满块; 如果最后一个块满了,再从 free block pool 分配一个新的物理 block, 把它追加到 block table 里。

### prefill

按 prompt 长度分配若干 physical blocks,填入每层 K/V,并建立 block table。

### decode

每步生成一个 token,把对应层的 K/V 追加到当前最后一个 block。

### block full

最后一个 block 写满后,从 free pool 取一个新块并更新映射。

### request done

请求结束时减少 ref count,无人引用的 physical blocks 归还 free pool。

### toy block allocator

```
class KVBlockPool:
    def __init__ (self, num_blocks):
        self.free = list(range(num_blocks))
        self.ref = [0] * num_blocks

    def alloc(self):
        if not self.free:
            raise RuntimeError("KV cache exhausted")
        block = self.free.pop()
        self.ref[block] = 1
        return block

    def incref(self, block):
        self.ref[block] += 1

    def decref(self, block):
        self.ref[block] -= 1
        if self.ref[block] == 0:
            self.free.append(block)

class SequenceKV:
    def __init__ (self, pool, block_size):
        self.pool = pool
        self.block_size = block_size
        self.block_table = []
        self.length = 0

    def append_token(self):
        if self.length % self.block_size == 0:
            self.block_table.append(self.pool.alloc())
        self.length += 1
```

真实 vLLM 还要处理多层 KV layout、GPU kernels、调度、抢占、prefix caching 和多 GPU,但 block table 是理解入口。

## copy-on-write:共享到真正写入为止

40 MIN

并行采样和 beam search 会从同一个 prompt 分叉出多个候选。 分叉时,这些候选的 prompt KV 完全相同。 PagedAttention 不需要为每个候选复制一份物理 KV blocks, 而是让多个 block table 指向同一批 physical blocks,并增加 ref count。 当某个候选要写入一个仍被共享的 block,才触发 copy-on-write:分配新块、复制旧块内容、更新该候选的 block table。

> **图：copy-on-write 过程示意图**
>
> - COPY-ON-WRITE FOR PARALLEL SAMPLING
> - Before fork
> - P4
> - P9
> - one sequence · ref=1
> - After fork
> - two candidates share P4/P9 · ref=2
> - Candidate B writes
> - P12
> - B copies P9 → P12 before modifying
> - 共享读很便宜;只有写入共享块时才复制,因此 best\_of / beam search 的 KV 内存增长更慢
> - Copy-on-write 是 block table + ref count 的自然结果

FIG · 多个候选共享前缀 KV;真正分叉写入时才复制最后一个共享块

### toy COW append

```
def fork_sequence(src, pool):
    dst = SequenceKV(pool, src.block_size)
    dst.block_table = list(src.block_table)
    dst.length = src.length
    for block in dst.block_table:
        pool.incref(block)
    return dst

def ensure_private_last_block(seq):
    block = seq.block_table[-1]
    if seq.pool.ref[block] == 1:
        return
    new_block = seq.pool.alloc()
    seq.pool.decref(block)
    seq.block_table[-1] = new_block
    # 真实系统还要把旧 block 的有效 KV bytes 复制到 new_block

def append_with_cow(seq):
    if seq.length % seq.block_size == 0:
        seq.block_table.append(seq.pool.alloc())
    else:
        ensure_private_last_block(seq)
    seq.length += 1
```

## vLLM 系统视角

35 MIN

PagedAttention 是 vLLM 的底层能力之一。 它让 serving engine 能更灵活地管理 KV Cache,从而容纳更多并发请求。 但真正的高吞吐还来自调度:请求进入等待队列,调度器根据剩余 KV blocks、 prefill/decode 预算和正在运行的序列,决定这一轮 batch 放哪些请求。

KV manager

### 管理物理块

负责分配、释放、引用计数、共享和抢占。PagedAttention 让 KV 不必连续。

scheduler

### 组织 batch

把不同长度、不同阶段的请求放进每次 GPU 执行,尽量提升吞吐并控制延迟。

attention kernel

### 读取分页 KV

kernel 需要根据 block table 间接读取 K/V,而不是简单访问连续 cache。

prefix cache

### 复用共享前缀

相同 prompt 前缀可复用已计算 KV blocks,降低 TTFT 并减少重复 prefill。

| 场景 | 没有分页 KV | PagedAttention / vLLM 的变化 | 收益 |
| --- | --- | --- | --- |
| 不同长度请求 | 连续预留或频繁搬移,碎片明显。 | 按 block 按需增长,请求结束即回收 blocks。 | 提升并发容量。 |
| parallel sampling | 每个候选复制 prompt KV。 | 共享 prompt blocks,写入时 COW。 | 降低 KV 复制开销。 |
| beam search | beam 分叉/剪枝导致频繁复制和释放。 | 引用计数管理共享块,剪枝时释放引用。 | 复杂解码更省显存。 |
| 共享系统提示词 | 每个请求重复 prefill 同一段 prefix。 | prefix caching 复用 KV blocks。 | 降低 TTFT,提升吞吐。 |

## 动手:把一批请求映射成 block table

35 MIN

今天不用真的部署 7B 模型,先用一个小脚本把“请求长度 → logical blocks → physical blocks” 的关系跑清楚。你要能看到:短请求只浪费最后一个 block 的尾部, 多个候选共享前缀时,物理 block 数不会线性翻倍。

```
import math

def blocks_needed(tokens, block_size):
    return math.ceil(tokens / block_size)

def allocate_requests(lengths, block_size):
    next_block = 0
    tables = {}
    for req_id, length in enumerate(lengths):
        n = blocks_needed(length, block_size)
        tables[req_id] = list(range(next_block, next_block + n))
        next_block += n
    return tables, next_block

lengths = [7, 16, 31, 48, 63]
block_size = 16
tables, physical_blocks = allocate_requests(lengths, block_size)

for req, table in tables.items():
    print(f"request={req} len={lengths[req]} block_table={table}")
print("physical_blocks", physical_blocks)

waste_tokens = sum(blocks_needed(x, block_size) * block_size - x for x in lengths)
print("tail_waste_tokens", waste_tokens)
```

观察 1

### 浪费被限制在最后一页

固定 block size 后,每个请求最多浪费一个 block 的尾部,不再按最大长度预留。

观察 2

### 显存压力转为块池压力

系统不再问“有没有一段连续空间”,而是问 free block pool 里还有多少可用 blocks。

观察 3

### block size 是权衡

block 太大尾部浪费多;block 太小 table 更长,attention 间接访问和调度开销增加。

## 常见误区

20 MIN

| 误区 | 为什么不准确 | 正确理解 |
| --- | --- | --- |
| PagedAttention 让 attention 更少算 | 它主要解决 KV Cache 内存管理,不是改变 attention 数学量。 | 算的 token 依旧要 attend,但系统能装下更多并发请求,减少内存浪费。 |
| block table 免费 | 间接寻址、table 准备和非连续访问都有成本。 | 收益来自显存利用率和调度灵活性,需要 kernel 工程抵消访问成本。 |
| COW 会复制所有历史 KV | copy-on-write 发生在共享且即将写入的 block 上。 | 未修改的前缀 blocks 继续共享;只在分叉写入位置复制必要块。 |
| vLLM 只等于 PagedAttention | vLLM 是 serving engine,还包含调度、API、模型执行、prefix caching 等组件。 | PagedAttention 是关键底座,但高吞吐来自内存管理和调度共同作用。 |

## 常见疑问

FAQ

### Q1 · PagedAttention 和 FlashAttention 是一类东西吗?

A

不是。FlashAttention 重点是 attention 计算的 IO-aware kernel,减少中间 score 写回 HBM。PagedAttention 重点是 serving 时 KV Cache 的分页管理,让 KV 可以按 block 动态分配和共享。

### Q2 · 为什么 block table 能减少碎片?

A

因为请求不再需要一段连续的 KV 内存。它只需要若干物理 blocks,这些 blocks 可以来自 free pool 的任意位置。浪费主要限制在每个请求最后一个未满 block 的尾部。

### Q3 · copy-on-write 主要服务什么场景?

A

最典型是 parallel sampling、beam search 和共享前缀。多个候选共享 prompt KV,只有当候选真正写入共享块时才复制,从而避免把相同前缀 KV 存很多份。

### Q4 · PagedAttention 会改善 TTFT 还是 TPOT?

A

它本身主要通过提高 KV 显存利用率来提升并发和吞吐。若结合 prefix caching,共享前缀可以跳过部分 prefill,TTFT 会明显受益。TPOT 还取决于 decode batch、kernel、调度和带宽。

## 复盘问题

REVIEW

1. KV Cache 的显存大小和 layers、kv\_heads、head\_dim、context length 分别是什么关系?
2. 为什么传统连续 KV 分配会在 LLM serving 里产生严重碎片?
3. block table 中 logical block 和 physical block 的区别是什么?
4. copy-on-write 为什么能降低 parallel sampling 和 beam search 的 KV 内存占用?
5. PagedAttention 解决的是 attention 算法复杂度、kernel IO,还是 serving 内存管理?

## 今日检查清单

CHECKLIST

- 能写出 KV bytes/token 的粗略计算公式,并估算一批请求的 KV 显存。
- 能解释 PagedAttention 为什么像操作系统分页,以及 block table 对应页表的哪部分功能。
- 能画出一个请求的 logical blocks 到 physical blocks 映射。
- 能解释 copy-on-write 的触发条件和引用计数变化。
- 能说清 PagedAttention、prefix caching、continuous batching 在 serving 系统里的关系。
- 完成一个 toy block allocator 或手算一组请求的 block table。

## 推荐阅读

LINKS

Paper

### [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)

SOSP 2023 论文。重点读 KV Cache 浪费来源、PagedAttention 设计和 vLLM 的吞吐实验。

vLLM

### [vLLM Paged Attention 文档](https://docs.vllm.ai/en/latest/design/paged_attention/)

官方设计文档。重点看 paged KV cache 与 attention kernel 如何配合。

Blog

### [vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention](https://vllm.ai/blog/2023-06-20-vllm)

vLLM 官方博客。适合快速理解 PagedAttention、block table 和 copy-on-write 的系统动机。

Prefix

### [vLLM Automatic Prefix Caching](https://docs.vllm.ai/en/stable/design/prefix_caching/)

理解 KV blocks 如何进一步用于共享前缀和缓存复用,为后续 serving 优化做铺垫。

## Day 32 预告

NEXT

vLLM 实战

### 部署一个 7B 模型并开启 OpenAI 兼容 API

下一天会把今天的概念落到命令行: 用 vLLM 启动服务,调用 OpenAI-compatible API, 调整 `--max-num-seqs`、`--gpu-memory-utilization` 和上下文长度,观察吞吐、TTFT、TPOT 与 KV Cache 占用的变化。

PagedAttention 的美感在于:它没有让模型少记忆上下文,而是让显存不再被上下文的形状绑架。

DAY 31 · PAGEDATTENTION & VLLM · AI INFRA ROADMAP
