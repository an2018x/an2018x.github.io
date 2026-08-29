---
title: "Day 26 · 算子层加速"
date: '2026-06-20'
draft: false
description: "进入 Transformer 算子层加速:理解 FlashAttention v2/v3、PyTorch SDPA、xFormers 与 Apex Fused Kernels 的适用边界,动手替换 attention,并用 TFLOPS / MFU 判断优化是否真的生效。"
toc: true
tags:
  - AI
  - PyTorch
  - CUDA
  - FlashAttention
  - xFormers
  - Apex
  - Performance
---

DAY 26 · AI INFRA ROADMAP · 60 DAYS

# 把慢算子换成 _快路径_

Day 24 解决 checkpoint 与容错,Day 25 让数据 pipeline 不饿 GPU。 Day 26 进入更贴近内核的层面:同样的 Transformer,为什么替换一个 attention 或 LayerNorm, step time 就可能明显下降?今天学习 **FlashAttention v2/v3** 、 **xFormers** 与 **Apex Fused Kernels** ,重点不是背 API,而是建立一套判断: 这个算子是不是瓶颈,替换后有没有走到正确 kernel,速度提升来自更少 HBM 读写、kernel fusion, 还是只是 batch/shape 变化带来的错觉。

**DURATION** 3 h **THEORY** 1 h **HANDS-ON** 1.5 h **METRICS** TFLOPS · MFU · step time **STACK** PyTorch SDPA · FlashAttention · xFormers · Apex

## 思维导图

OVERVIEW

> **图：Day 26 算子层加速思维导图**
>
> - DAY 26 · Operator Acceleration
> - ATTENTION · FUSION · BENCHMARK · MFU
> - 01 · WHY
> - 算子瓶颈
> - 02 · ATTN
> - FlashAttention
> - 03 · LIB
> - xFormers / Apex
> - 04 · MEASURE
> - TFLOPS / MFU
> - kernel launch overhead
> - HBM 读写太多
> - 小算子碎片化
> - attention score 巨大
> - tile 到 SRAM
> - online softmax
> - v2 提升并行度
> - v3 面向 Hopper
> - memory\_efficient\_attention
> - FusedLayerNorm
> - FusedAdam
> - drop-in 但要验证
> - warmup / sync / median
> - tokens/s 与 step time
> - attention TFLOPS
> - MFU 判整体效率
> - DELIVERABLES
> - 算子选型表
> - attention 替换代码
> - benchmark 脚本
> - MFU 解释笔记

FIG · Day 26 全景:先找瓶颈,再替换算子,最后用可复现 benchmark 判断收益

## 为什么要做算子层加速

25 MIN

当数据和并行策略都没有明显问题时,训练速度常常被单个高频算子卡住: attention、LayerNorm/RMSNorm、Adam 更新、dropout + residual、activation + bias。 算子层加速的核心是减少三件事:多余的 HBM 读写、多余的 kernel launch、多余的中间张量。

IO-AWARE

### 少搬数据

FlashAttention 把 attention 分块搬进片上 SRAM,边算边做 online softmax,避免保存完整 `S×S` attention score。

FUSION

### 少发 kernel

LayerNorm、optimizer update、bias + activation 这类小算子如果拆成多个 CUDA kernel,launch 和内存往返会吞掉很多时间。

DISPATCH

### 走对后端

PyTorch SDPA、xFormers、FlashAttention 都可能根据 dtype、mask、dropout、causal、head\_dim 和 GPU 架构选择不同 kernel。

算子优化不是“库名崇拜”:同一个库在不同 shape、dtype、mask、GPU 上可能快,也可能回退。

## FlashAttention v2 / v3

45 MIN

标准 attention 的数学形式没有变: `softmax(QKᵀ / sqrt(d))V`。 FlashAttention 变的是计算组织方式:不把完整 attention matrix 写回 HBM, 而是用 tile、online softmax 和重计算来降低显存占用并提高吞吐。 v2 主要改善工作划分与并行效率;v3 进一步针对 Hopper GPU 的异步能力和 Tensor Core 管线做优化。

> **图：FlashAttention 分块计算示意图**
>
> - HBM
> - Q
> - K
> - V
> - SRAM tile loop
> - Q block
> - K block
> - V block
> - online softmax · update O
> - O
> - 最终输出
> - 不物化完整 S×S attention matrix,把 HBM 往返变成块状流式更新

FIG · FlashAttention 的关键不是近似,而是精确 attention 的 IO-aware 计算重排

| 路径 | 适合场景 | 需要确认 | 常见收益 |
| --- | --- | --- | --- |
| PyTorch SDPA | 希望代码保持 PyTorch 原生,由框架自动选择 math / memory-efficient / flash 后端。 | dtype、head\_dim、mask、dropout、is\_causal、GPU 架构 | 低改造成本,适合作为第一层替换。 |
| FlashAttention v2 | 长序列训练/推理,想直接调用高性能 exact attention kernel。 | qkv layout、contiguous、causal、dropout、版本兼容 | 显存明显下降,attention kernel 时间下降。 |
| FlashAttention v3 | H100/H800 等 Hopper GPU 上测试更激进的 attention 路径。 | Hopper GPU、CUDA 12.3+、beta/接口变化风险 | Hopper 上更高吞吐,尤其关注 FP16/BF16 与 FP8 forward。 |

版本备注

### RoadMap 聚焦 v2 / v3,工程选型要看当前仓库

截至本页整理时,FlashAttention 官方仓库还列出了面向 Hopper / Blackwell 的 FlashAttention-4。 Day26 仍按 RoadMap 学 v2/v3 的核心思想,实际项目落地时应重新核对 GPU 架构、CUDA、PyTorch 和 flash-attn 版本。

## xFormers 与 Apex Fused Kernels

35 MIN

FlashAttention 主要解决 attention 这条热路径。 xFormers 提供 memory-efficient attention、sparse/block-sparse attention 和若干 fused building blocks; Apex 则常用于 FusedAdam、FusedLayerNorm、FusedRMSNorm 等 CUDA 扩展。 这两类库的共同点是:替换看起来像 drop-in,但收益必须用 profiler 和 benchmark 验证。

xFormers

### 更像“优化算子工具箱”

如果模型里 attention mask、cross-attention、diffusion block 或稀疏 attention 形态较多,xFormers 往往比手写 CUDA 更适合快速试验。

```
import xformers.ops as xops

# q, k, v: [B, S, H, D] 或 xFormers 支持的 layout
out = xops.memory_efficient_attention(
    q, k, v,
    attn_bias=None,
    p=0.0,
    op=None, # 让 xFormers 自动 dispatch
)
```

Apex

### 更像“训练热路径替换件”

FusedAdam 把大量逐参数 elementwise update 合成更少 kernel;FusedLayerNorm/RMSNorm 减少 norm 的中间读写。

```
from apex.optimizers import FusedAdam
from apex.normalization import FusedLayerNorm

norm = FusedLayerNorm(hidden_size)
optimizer = FusedAdam(model.parameters(), lr=3e-4)
```

| 算子 | 替换前 | 替换后 | 验证点 |
| --- | --- | --- | --- |
| Attention | matmul + softmax + dropout + matmul | SDPA / FlashAttention / xFormers | 是否使用 flash/mem-efficient kernel,显存峰值是否下降。 |
| LayerNorm | mean/var/sub/div/mul/add | FusedLayerNorm / torch.compile fusion | 小 batch 或短序列时 launch overhead 是否明显下降。 |
| Optimizer | Python loop + many elementwise kernels | FusedAdam / multi\_tensor\_apply | optimizer step 时间是否下降,数值是否和基线一致。 |
| Activation | bias + gelu/swiglu + dropout | fused bias activation / fused dropout add | 吞吐是否提升,以及训练 loss 曲线是否保持。 |

## 动手:替换 attention

45 MIN

实操建议从“最少侵入”开始:先替换成 PyTorch SDPA,确认 dtype、mask、dropout 行为一致; 再尝试 FlashAttention 或 xFormers。每一步都保留 correctness check,否则速度再快也没有意义。

### 固定输入 shape

记录 `B,S,H,D,dtype,is_causal,dropout`,避免 benchmark 中 shape 漂移。

### 先做数值对齐

用小 shape 比较 naive attention 和 fast attention 的最大误差、平均误差。

### 再跑速度

先 warmup,再用 CUDA event 计时,最后 report median / p90。

### 接入模型

看 step time、tokens/s、显存峰值和 loss 曲线,而不是只看单算子。

### 最小 attention wrapper

```
import torch
import torch.nn.functional as F

def attention_sdpa(q, k, v, *, is_causal=True, dropout_p=0.0):
    # q/k/v: [B, heads, S, head_dim]
    return F.scaled_dot_product_attention(
        q, k, v,
        attn_mask=None,
        dropout_p=dropout_p,
        is_causal=is_causal,
    )

def attention_naive(q, k, v, *, is_causal=True):
    scale = q.shape[-1] ** -0.5
    score = (q @ k.transpose(-2, -1)) * scale
    if is_causal:
        s = q.shape[-2]
        mask = torch.ones(s, s, device=q.device, dtype=torch.bool).tril()
        score = score.masked_fill(~mask, float("-inf"))
    prob = score.softmax(dim=-1)
    return prob @ v
```

### FlashAttention 可选路径

```
def attention_flash_attn(q, k, v, *, causal=True, dropout_p=0.0):
    # flash_attn_func 常见 layout: [B, S, heads, head_dim]
    from flash_attn import flash_attn_func
    q = q.transpose(1, 2).contiguous()
    k = k.transpose(1, 2).contiguous()
    v = v.transpose(1, 2).contiguous()
    out = flash_attn_func(q, k, v, dropout_p=dropout_p, causal=causal)
    return out.transpose(1, 2).contiguous()
```

### 数值对齐检查

```
torch.manual_seed(0)
device = "cuda"
q = torch.randn(2, 16, 512, 64, device=device, dtype=torch.float16)
k = torch.randn_like(q)
v = torch.randn_like(q)

ref = attention_naive(q.float(), k.float(), v.float()).half()
out = attention_sdpa(q, k, v)

max_err = (ref - out).abs().max().item()
mean_err = (ref - out).abs().mean().item()
print({"max_err": max_err, "mean_err": mean_err})
```

## Benchmark TFLOPS / MFU

45 MIN

单算子 benchmark 解决“这个 kernel 有没有更快”; MFU 解决“整个模型有没有更接近硬件峰值”。 真实训练里,attention 加速可能被数据等待、通信、pipeline bubble、checkpoint 重算抵消, 所以 Day26 的产出必须同时包含 micro benchmark 和 end-to-end step benchmark。

attention\_tflops ≈ 4 · B · H · S² · D / time / 1e12

粗略统计 QKᵀ 与 PV 两个 matmul 的 FLOPs。用于对比同 shape 下不同 attention backend。

MFU = model\_flops\_per\_step / step\_time / peak\_flops

衡量模型训练整体使用了多少理论峰值。Day27 会系统展开 MFU/HFU 与 profiler。

### CUDA event 计时模板

```
import statistics
import torch

def bench(fn, *args, warmup=20, iters=100):
    for _ in range(warmup):
        fn(*args)
    torch.cuda.synchronize()

    times = []
    for _ in range(iters):
        start = torch.cuda.Event(enable_timing=True)
        end = torch.cuda.Event(enable_timing=True)
        start.record()
        fn(*args)
        end.record()
        torch.cuda.synchronize()
        times.append(start.elapsed_time(end) / 1000.0)

    times.sort()
    return {
        "median_s": statistics.median(times),
        "p90_s": times[int(len(times) * 0.9)],
        "min_s": times[0],
    }

def attention_tflops(batch, heads, seq, head_dim, seconds):
    flops = 4 * batch * heads * seq * seq * head_dim
    return flops / seconds / 1e12
```

### 报告格式

```
shape: B=2, H=16, S=4096, D=64, dtype=bf16, causal=True
gpu: H100-SXM-80GB, torch=..., cuda=...

backend median_ms p90_ms peak_mem_gb attention_tflops
naive eager 132.4 134.8 18.2 1.04
torch sdpa flash 12.8 13.1 3.6 10.76
flash-attn v2 11.9 12.2 3.4 11.57
xformers mem-eff 13.5 13.9 3.8 10.20

end-to-end:
baseline step_time=812 ms, tokens/s=20176, max_mem=71.4 GB
optimized step_time=674 ms, tokens/s=24305, max_mem=63.1 GB
```

报告 benchmark 时必须写 shape、dtype、GPU、CUDA、PyTorch、库版本和是否 causal;没有这些上下文,数字不可比较。

## 排错与诊断

20 MIN

| 现象 | 可能原因 | 检查方式 | 处理 |
| --- | --- | --- | --- |
| 替换后不快 | 没有走 flash/mem-efficient backend,或 shape 太小导致 launch overhead 占比高。 | 打开 PyTorch SDPA kernel 日志,或用 profiler 看 kernel 名。 | 调整 dtype/head\_dim/mask;对小 shape 优先 fusion 而非 attention kernel。 |
| 显存没降 | 外层仍保存了不必要的 attention weight 或 activation。 | 检查 forward 是否返回 attn\_probs;看 max\_memory\_allocated。 | 关闭 output\_attentions,配合 activation checkpoint。 |
| loss 曲线漂移 | dropout、mask、scale、causal 方向或 dtype 累加路径不一致。 | 小 batch 固定 seed 做数值 diff,再跑几十 step 对齐 loss。 | 先只在 eval/no dropout 下对齐,再打开训练特性。 |
| Apex import 失败 | 没有编译 CUDA extension,或 CUDA/PyTorch ABI 不匹配。 | 查看安装日志和 `apex. __file__ `。 | 重新按当前 CUDA/PyTorch 编译,或改用 PyTorch 原生/torch.compile 路径。 |

## 常见疑问

FAQ

### Q1 · PyTorch SDPA、FlashAttention、xFormers 应该先试哪个?

A

先试 PyTorch SDPA,因为接入成本最低,也更容易跟随 PyTorch 版本维护。若 shape 很长、attention 是明确瓶颈,再试 FlashAttention。若模型 attention 形式复杂,例如 cross-attention、特殊 bias 或稀疏模式,再评估 xFormers。

### Q2 · FlashAttention 是近似 attention 吗?

A

不是。FlashAttention 的目标是计算精确 attention,只是改变计算顺序和内存访问方式。数值上会因为浮点累加顺序、dtype 和 kernel 实现产生小误差,但不是 low-rank 或 sparse 近似。

### Q3 · 为什么单算子快了,训练 step time 没怎么变?

A

可能 attention 不是主要瓶颈,也可能加速后瓶颈转移到 dataloader、通信、optimizer 或 pipeline bubble。Day26 要同时看 micro benchmark 和端到端 profiler;只看一个 kernel 的数字容易误判。

### Q4 · Apex 现在还值得学吗?

A

值得理解它解决的问题:FusedAdam、FusedLayerNorm、多 tensor apply 都是训练系统里的经典优化。实际项目中是否使用 Apex,要看当前 PyTorch、CUDA、框架栈是否已有等价或更稳定的实现。

## 复盘问题

REVIEW

1. FlashAttention 为什么能降低显存?它具体少保存了什么中间量?
2. 为什么 attention benchmark 必须固定 dtype、head\_dim、causal、dropout 和 mask?
3. xFormers 的 memory-efficient attention 和 FlashAttention 的关系是什么?什么时候你会选 xFormers?
4. FusedAdam 为什么可能比普通 Adam 快?它减少的是算术量、内存访问,还是 kernel launch?
5. 如果 micro benchmark 快 2 倍,但 end-to-end step 只快 5%,你会如何定位原因?

## 今日检查清单

CHECKLIST

- 能解释 FlashAttention 的 tile、online softmax 和“不物化 S×S score”的核心思想。
- 能说清 PyTorch SDPA、FlashAttention、xFormers、Apex 各自的适用边界。
- 完成一个 attention wrapper,至少支持 naive 与 SDPA 两种实现。
- 完成数值对齐检查,记录 max error 与 mean error。
- 完成 micro benchmark,报告 median/p90、显存峰值与 attention TFLOPS。
- 能把单算子收益和 end-to-end step time / MFU 分开讨论。

## 推荐阅读

LINKS

FlashAttention

### [Dao-AILab / flash-attention](https://github.com/Dao-AILab/flash-attention)

官方仓库。重点看安装说明、FlashAttention-2 接口、FlashAttention-3 beta 对 Hopper 与 CUDA 版本的要求,并留意 FlashAttention-4 的当前状态。

PyTorch

### [scaled\_dot\_product\_attention](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)

PyTorch 原生 SDPA API 文档。关注 dropout 行为、GQA 支持和后端选择。

xFormers

### [xFormers optimized operators](https://facebookresearch.github.io/xformers/components/ops.html)

memory-efficient attention、attention bias 和可用 operator 的官方文档。

Apex

### [NVIDIA / apex](https://github.com/NVIDIA/apex)

了解 FusedAdam、FusedLayerNorm、FusedRMSNorm 等 CUDA extension 的安装和限制。

## Day 27 预告

NEXT

训练性能分析

### MFU / HFU 与 nsys step trace

下一天会把 Day26 的 benchmark 扩展到完整训练 step: 计算 MFU/HFU,用 Nsight Systems 抓一段训练 trace, 识别 compute、communication、pipeline bubble、dataloader stall 和 optimizer hot spot。

算子优化的好习惯:先证明瓶颈存在,再替换实现,最后用同一把尺子量收益。

DAY 26 · OPERATOR ACCELERATION · AI INFRA ROADMAP
