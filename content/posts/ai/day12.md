---
title: "Day 12 · 混合精度与 AMP"
date: '2026-05-26'
draft: false
description: "拆开混合精度训练:FP32 / TF32 / FP16 / BF16 / FP8 的数值范围、精度与溢出风险;理解 torch.amp.autocast 的算子选择、GradScaler 的动态 loss scaling,并跑通一个可对比的 AMP benchmark。"
toc: true
tags:
  - AI
  - PyTorch
  - AMP
  - Mixed Precision
  - FP8
---

DAY 12 · AI INFRA ROADMAP · 60 DAYS

# 让数字 _变轻_

Day 11 我们从 allocator 视角节省显存;今天换一个更底层的杠杆: _把每个数字本身变小_。 混合精度训练的目标不是"全部换成半精度",而是让不同算子在不同 dtype 里各司其职: GEMM / Conv 用 Tensor Core 跑低精度,归约 / Softmax / Loss 留在高精度, 反向传播用 loss scaling 避免梯度下溢。 今天你要看清 **FP32 / TF32 / FP16 / BF16 / FP8** 的数值边界, 掌握 `torch.amp.autocast` 与 `GradScaler` 的真实分工。

**DURATION** 3 h **THEORY** 1.5 h **HANDS-ON** 1 h **REVIEW** 0.5 h **STACK** PyTorch · CUDA · AMP · Tensor Core · FP8

## 思维导图

OVERVIEW

> **图：Day 12 思维导图**
>
> - DAY 12 · 混合精度与 AMP
> - DTYPES · AUTOCAST · GRAD SCALER · FP8
> - 01 · DTYPE
> - 数值格式边界
> - 02 · AUTOCAST
> - 算子级 dtype 策略
> - 03 · SCALER
> - 动态 Loss Scaling
> - 04 · FP8
> - H100 时代
> - FP32 / TF32
> - FP16 vs BF16
> - 范围 / 精度 / 溢出
> - Tensor Core 路径
> - 白名单 / 黑名单
> - matmul / conv 降精度
> - softmax / norm 保守
> - 局部禁用 autocast
> - 梯度下溢
> - scale → backward
> - unscale → step
> - inf / nan 检测
> - E4M3 / E5M2
> - amax history
> - TransformerEngine
> - 精度回归测试
> - DELIVERABLES
> - dtype 对照表
> - AMP 训练模板
> - FP32 vs AMP benchmark
> - 数值稳定性 checklist

FIG · Day 12 全景:先理解数字格式,再理解 autocast 怎么选 dtype,最后用 GradScaler 和 FP8 处理边界

## 先看数字格式 — 范围、精度与溢出

35 MIN

半精度训练的第一个坑是把"位数少"理解成"一定不准"。 真正要分清的是两件事: **指数位** 决定能表达多大/多小的数,也就是溢出和下溢; **尾数位** 决定相邻两个数之间的间隔,也就是精度。 FP16 和 BF16 都是 16 位,但性格完全不同。

| 格式 | 位宽结构 | 最大有限值 | 精度特征 | AI Infra 里的角色 |
| --- | --- | --- | --- | --- |
| FP32 | 1 sign · 8 exp · 23 mantissa | ~3.4e38 | 范围大、精度高,最稳但慢/占显存 | 基线;optimizer master weights;敏感归约 |
| TF32 | 8 exp · 10 mantissa | ~3.4e38 | FP32 范围 + 接近 FP16 尾数 | Ampere+ 默认 GEMM 加速路径,通常不改模型代码 |
| FP16 | 1 sign · 5 exp · 10 mantissa | 65504 | 尾数还行,但指数太短,非常容易 overflow / underflow | V100/T4/A10 上常用;通常需要 GradScaler |
| BF16 | 1 sign · 8 exp · 7 mantissa | ~3.4e38 | 范围与 FP32 相同,尾数较粗 | A100/H100 训练默认推荐;通常不需要 GradScaler |
| FP8 E4M3 | 1 sign · 4 exp · 3 mantissa | ~448 | 精度相对更好,范围小 | TransformerEngine 常用于 activation / weight 前向 |
| FP8 E5M2 | 1 sign · 5 exp · 2 mantissa | ~57344 | 范围更大,精度更粗 | TransformerEngine 常用于 gradient 反向 |

### 一张图理解 FP16 vs BF16

> **图：FP16 BF16 数值范围对比**
>
> - FP16 VS BF16 — SAME 16 BITS, DIFFERENT FAILURE MODE
> - FP32
> - sign
> - 8-bit exponent · huge range
> - 23-bit mantissa · high precision
> - FP16
> - 5-bit exp
> - 10-bit mantissa
> - 范围窄: 65504 以上直接 inf
> - BF16
> - 8-bit exponent · FP32 range
> - 7-bit mantissa
> - 范围稳: 很少需要 loss scaling
> - 经验判断
> - A100 / H100 训练 LLM:优先 BF16;旧卡或推理服务:FP16 更常见;FP8 只在硬件和库都准备好时作为下一层优化。

FIG · FP16 的风险是范围窄,BF16 的风险是尾数粗;二者不是简单的"谁更准"

### 为什么 FP16 会炸

```
import torch

x = torch.tensor([1e4], device="cuda", dtype=torch.float16)
print(x * x) # tensor([inf], device='cuda:0', dtype=torch.float16)

g = torch.tensor([1e-8], device="cuda", dtype=torch.float16)
print(g) # tensor([0.], device='cuda:0', dtype=torch.float16) ← 梯度下溢

b = torch.tensor([1e4], device="cuda", dtype=torch.bfloat16)
print(b * b) # 仍然能表达大数,但尾数更粗
```

OVERFLOW

### 前向 / 反向变成 inf

FP16 最大有限值只有 65504。attention score、loss、梯度范数、指数运算一旦超过边界,结果就是 `inf`,接着传播成 `nan`。这就是为什么 softmax、exp、log、norm 通常不能莽撞降到 FP16。

UNDERFLOW

### 小梯度直接变成 0

深层网络反向传播时很多梯度本来就在 `1e-8` 附近。FP16 的可表示小数范围不够,这些梯度会被 flush 到 0。 **GradScaler 的本质就是先把 loss 放大,让梯度落进 FP16 能表达的区间** 。

BF16

### 为什么 LLM 喜欢 BF16

LLM 训练的主要麻烦是梯度范围和 activation 范围大,而不是每个数都需要很细的尾数。BF16 保留 FP32 的 8 位指数,所以稳定性接近 FP32;尾数少一点通常可以靠大 batch 和优化器噪声消化。

TF32

### 不要忘记默认加速

在 Ampere+ GPU 上,很多 FP32 matmul 会走 TF32 Tensor Core:输入按 TF32 乘,累加仍是 FP32。它不是显式 dtype,更像 CUDA/cuBLAS 的计算模式。想要严格可复现时需要关掉,想要吞吐时通常保留。

本节 takeaway:指数位管生死,尾数位管细腻;FP16 需要防溢出/BF16 需要接受粗粒度/FP8 需要额外 scale。

## autocast — 不是全局转 dtype,而是算子级决策

35 MIN

`autocast` 不是把模型参数永久改成半精度。 它只是在一个上下文里拦截算子调用,根据算子的数值风险选择合适 dtype: 大矩阵乘和卷积适合降精度,归约和 softmax 更保守,有些算子会主动提升到 FP32。 这就是 AMP 的核心: **Automatic Mixed Precision** ,自动混合,不是自动半精度。

> **图：autocast 决策路径**
>
> - AUTOCAST DISPATCH — 每个 OP 单独决定计算 dtype
> - Python 调用 op
> - torch.matmul / softmax
> - autocast policy table
> - eligible op? device? target dtype?
> - CUDA: fp16 / bf16 · CPU: bf16
> - 实际 kernel
> - Tensor Core / CUDA kernel
> - THREE POLICY BUCKETS
> - LOW PRECISION SAFE
> - matmul / linear / conv
> - 输入 cast 到 fp16/bf16
> - Tensor Core 执行,吞吐收益最大
> - PROMOTE TO FP32
> - softmax / norm / loss
> - 数值敏感,小误差会被放大
> - 通常保留 FP32 或内部 FP32 accumulate
> - WIDEST INPUT
> - add / cat / where
> - 多个输入 dtype 不一致
> - 提升到最宽 dtype 避免隐式丢精度
> - 重要:
> - autocast 只包 forward 和 loss 计算;backward 会沿用 forward 产生的 dtype 路径,不要单独包 backward。

FIG · autocast 的本质是 op policy table,不是一把梭把所有 Tensor 转成半精度

### 现代 PyTorch 写法

```
import torch

device = "cuda"
model = MyModel().to(device)
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)

# CUDA + fp16 训练:需要 GradScaler
scaler = torch.amp.GradScaler(device)

for x, y in loader:
    x, y = x.to(device), y.to(device)
    optimizer.zero_grad(set_to_none=True)

    # 只包 forward + loss
    with torch.amp.autocast(device_type=device, dtype=torch.float16):
        logits = model(x)
        loss = torch.nn.functional.cross_entropy(logits, y)

    # scale 后 backward,避免 fp16 梯度下溢
    scaler.scale(loss).backward()

    # 如需 gradient clipping,必须先 unscale
    scaler.unscale_(optimizer)
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

    scaler.step(optimizer) # 若发现 inf/nan,自动跳过 optimizer.step()
    scaler.update() # 动态调整 scale
```

### BF16 写法更简单

```
# A100 / H100 上训练 LLM 的常见默认
for x, y in loader:
    optimizer.zero_grad(set_to_none=True)
    with torch.amp.autocast("cuda", dtype=torch.bfloat16):
        loss = model(x).loss
    loss.backward()
    optimizer.step()

# BF16 的指数范围和 FP32 一样,通常不需要 GradScaler
```

### 需要手动接管的场景

局部禁用

### 敏感算子强制 FP32

如果某段计算在 AMP 下不稳定,局部退出 autocast:
`with torch.amp.autocast("cuda", enabled=False):`
在里面把输入显式转回 `float()`。常见对象:自定义 loss、复杂归约、指数/对数链路。

自定义 op

### 别让 autocast 猜

自定义 `autograd.Function` 可以用 `torch.amp.custom_fwd` / `custom_bwd` 标注输入如何 cast。写 CUDA extension 时也要明确 accumulator dtype,否则 forward 看似加速,backward 悄悄不稳。

模型参数

### 不要手动 model.half()

初学者常犯错:直接 `model.half()` 然后训练。这样 LayerNorm、embedding、optimizer 状态都可能进入低精度,稳定性大幅下降。AMP 推荐参数保持 FP32/BF16 策略,由 autocast 决定每个 op 的输入 dtype。

验证习惯

### 永远和 FP32 baseline 比

AMP 不是"开了就算成功"。至少比较三件事:loss 曲线前 100 step 是否贴近、最终指标是否在误差范围、是否出现 inf/nan/scale 回退。生产里还要记录吞吐、显存峰值和数值回归。

API 提醒:新代码优先写 torch.amp.autocast("cuda", ...) 与 torch.amp.GradScaler("cuda"),不要继续传播旧的 torch.cuda.amp 写法。

## GradScaler — 动态 Loss Scaling 的状态机

30 MIN

FP16 最危险的是梯度下溢。解决思路非常朴素: loss 乘一个很大的 scale,反向传播得到的梯度也跟着变大, optimizer.step 前再除回去。 关键是 scale 不能太大,否则梯度又会 overflow。 `GradScaler` 做的就是这个动态平衡。

> **图：GradScaler 状态机**
>
> - DYNAMIC LOSS SCALING — 放大梯度,检测溢出,再调 scale
> - loss
> - e.g. 2.31
> - × scale
> - scaled loss
> - 2.31 × 65536
> - backward
> - scaled gradients
> - 小梯度被抬进 FP16 可表示区间
> - unscale + check
> - grad /= scale · found\_inf?
> - optimizer.step?
> - skip if inf/nan
> - scale update
> - 连续 growth\_interval 次无溢出 → scale × growth\_factor
> - 发现溢出 → scale × backoff\_factor
> - 典型初始 scale=65536,growth\_factor=2,backoff\_factor=0.5,growth\_interval=2000。

FIG · GradScaler 是一个小型反馈控制器:无溢出就增大 scale,有溢出就跳过 step 并减小 scale

### 关键 API 顺序

| 步骤 | API | 为什么顺序不能错 |
| --- | --- | --- |
| 1 | `scaler.scale(loss).backward()` | 放大 loss 后再反传,让小梯度不会被 FP16 吃掉 |
| 2 | `scaler.unscale_(optimizer)` | 如果要梯度裁剪/检查,必须先把梯度除回原尺度 |
| 3 | `clip_grad_norm_` | 在真实梯度尺度上裁剪,否则 max\_norm 没意义 |
| 4 | `scaler.step(optimizer)` | 内部检查 inf/nan;发现溢出会跳过这次 step,避免污染参数 |
| 5 | `scaler.update()` | 根据这一步是否溢出动态调 scale |

### 常见错误

ERROR 1

### clip 前忘记 unscale

如果梯度还乘着 65536 就做 norm clipping,几乎每步都会被错误裁掉,训练会变慢甚至不收敛。固定顺序: `backward → unscale_ → clip → step → update`。

ERROR 2

### 多个 optimizer 混用

GAN、MoE、RLHF 里可能有多个 optimizer。每个 optimizer 都要单独 `unscale_` 和 `step`;但一般共用一个 scaler。跳过某个 optimizer step 时要知道参数更新不同步的影响。

ERROR 3

### 把 scaler 用在 BF16 上

BF16 通常不需要 loss scaling。不是绝对不能用,而是收益很小且会让调试更复杂。A100/H100 上优先 BF16 + no scaler;旧卡 FP16 才用 scaler。

DEBUG

### 看 scale 曲线

如果 `scaler.get_scale()` 一直下降,说明频繁 overflow:学习率过大、loss 本身不稳、某个算子不该进 FP16。如果 scale 长期稳定或缓慢上升,AMP 状态基本健康。

GradScaler 保护的是 FP16 的梯度区间;它不解决 forward 里 softmax 爆炸,那是 autocast policy 或模型数值稳定性的问题。

## 动手实践 — 跑一个 AMP benchmark

1 H

今天的练习目标不是把某个模型训到高分,而是建立一套固定的 AMP 验证手感: 同一个模型分别跑 FP32、FP16 AMP、BF16 AMP, 记录吞吐、显存峰值、loss 是否贴近。 以后你给任何训练脚本开 AMP,都照这个流程验。

```
# amp_bench.py — FP32 / FP16 AMP / BF16 AMP 对比骨架
import argparse, time, torch
import torch.nn as nn
import torch.nn.functional as F

class TinyMLP(nn.Module):
    def __init__ (self, d=4096, layers=8):
        super(). __init__ ()
        self.net = nn.Sequential(*[
            layer for _ in range(layers)
            for layer in (nn.Linear(d, d), nn.GELU())
        ], nn.Linear(d, 1000))

    def forward(self, x):
        return self.net(x)

def run(mode):
    device = "cuda"
    model = TinyMLP().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
    scaler = torch.amp.GradScaler(device, enabled=(mode == "fp16"))
    dtype = {"fp32": None, "fp16": torch.float16, "bf16": torch.bfloat16}[mode]

    torch.cuda.reset_peak_memory_stats()
    torch.cuda.synchronize()
    t0 = time.perf_counter()

    losses = []
    for step in range(80):
        x = torch.randn(32, 4096, device=device)
        y = torch.randint(0, 1000, (32,), device=device)
        opt.zero_grad(set_to_none=True)

        enabled = (dtype is not None)
        with torch.amp.autocast(device_type=device, dtype=dtype, enabled=enabled):
            loss = F.cross_entropy(model(x), y)

        if mode == "fp16":
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
        else:
            loss.backward()
            opt.step()

        losses.append(float(loss.detach()))

    torch.cuda.synchronize()
    dt = time.perf_counter() - t0
    mem = torch.cuda.max_memory_allocated() / 2**30
    print(f"{mode:4s} time={dt:.2f}s peak={mem:.2f}GiB last_loss={losses[-1]:.4f} scale={scaler.get_scale():.0f}")

if __name__ == " __main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["fp32", "fp16", "bf16"], required=True)
    run(parser.parse_args().mode)
```

### 运行方式

```
python amp_bench.py --mode fp32
python amp_bench.py --mode fp16
python amp_bench.py --mode bf16

# 记录这三列:
# 1) time:吞吐收益
# 2) peak:显存峰值
# 3) last_loss / loss 曲线:数值是否明显偏离
```

### 你应该看到什么

| 模式 | 速度 | 显存 | 稳定性 | 解释 |
| --- | --- | --- | --- | --- |
| FP32 | 最慢 | 最高 | 最稳 | 基线,用于对照 loss 与最终指标 |
| FP16 AMP | 通常最快 | 低 | 依赖 scaler | Tensor Core 吞吐高,但需要处理 overflow / underflow |
| BF16 AMP | 接近 FP16 | 低 | 接近 FP32 | LLM 训练默认优先项,前提是 GPU 支持 BF16 Tensor Core |

### 生产检查项

吞吐

### 不要只看 wall time

记录 samples/s 或 tokens/s,并确保 batch size、gradient accumulation、dataloader 都一致。AMP 加速如果被数据加载拖住,你看到的 wall time 可能没有明显变化。

显存

### 看 peak allocated

用 `torch.cuda.max_memory_allocated()` 对比峰值。AMP 会减少 activation / gradient 的字节数,但 optimizer state 仍可能是 FP32,所以整体不一定正好减半。

数值

### 先短跑再长跑

先比前 100 step loss,再跑完整 epoch 指标。短跑偏离代表 dtype 策略或 scale 有问题;长跑偏离可能是随机性、学习率或优化器超参需要重调。

日志

### 把 dtype 写进实验元数据

日志里固定记录:目标 dtype、是否开 TF32、GradScaler 初始值、scale 最小值、是否出现 inf/nan、GPU 型号。否则你以后复现实验会很痛苦。

今日交付物:一份 FP32/FP16/BF16 对比表,外加一句结论:在你的 GPU 和模型上,推荐默认 dtype 是什么。

## FP8 — H100 时代的下一层混合精度

25 MIN

FP8 不是"把 AMP 的 dtype 从 FP16 改成 FP8"这么简单。 8 位太小,必须额外维护 scale / amax history, 把真实数值范围映射进 FP8 可表示区间。 这也是为什么 FP8 在生产里通常通过 NVIDIA TransformerEngine 这类库使用, 而不是手写一堆 `tensor.to(torch.float8_*)`。

> **图：FP8 scale 工作流**
>
> - FP8 TRAINING — dtype + scale + amax history
> - FP16/BF16 tensor
> - 真实训练值
> - ÷ scale
> - quantize to FP8
> - E4M3 / E5M2
> - Tensor Core GEMM
> - FP8 输入,FP16/BF16 累加
> - dequantize
> - × scale
> - update amax history
> - 跟踪近期最大绝对值
> - FORMAT CHOICE
> - E4M3:尾数更多,精度较好,范围较小,适合 forward activation / weight。
> - E5M2:指数更多,范围更大,适合 backward gradient。

FIG · FP8 真正的复杂度在 per-tensor/per-channel scale 与 amax history,不是 dtype 名字本身

### TransformerEngine 的使用形状

```
# 概念示例:真实项目需按 TransformerEngine 版本与硬件配置调整
import torch
import transformer_engine.pytorch as te
from transformer_engine.common import recipe

fp8_recipe = recipe.DelayedScaling(
    margin=0,
    fp8_format=recipe.Format.HYBRID, # forward E4M3, backward E5M2
    amax_history_len=16,
    amax_compute_algo="max",
)

model = te.Linear(4096, 4096).cuda()

with te.fp8_autocast(enabled=True, fp8_recipe=fp8_recipe):
    y = model(x)
    loss = y.float().pow(2).mean()
```

适合

### 大 Transformer 的 Linear/GEMM

FP8 收益主要来自 Linear、Attention projection、MLP projection 这些大 GEMM。模型越大、GEMM 占比越高,收益越明显。小模型或数据瓶颈任务,FP8 可能只增加复杂度。

不适合

### 敏感归约与小算子

LayerNorm、Softmax、loss、复杂 mask、采样逻辑通常继续使用 FP16/BF16/FP32。FP8 的正确用法是把高吞吐 GEMM 降下去,不是让全模型所有数都变成 8 位。

验证

### 精度回归比 FP16 更严格

FP8 需要额外比较收敛曲线、per-layer amax、scale 是否饱和、是否出现大量 clamping。生产上通常先在小规模预训练/微调验证,再扩到大集群。

硬件

### 别脱离 GPU 世代谈 FP8

FP8 的现实价值建立在 H100/H200/B200 这类硬件的 Transformer Engine 与 Tensor Core 上。没有对应硬件时,模拟 FP8 往往只会更慢,适合研究不适合提吞吐。

FP8 是"AMP 的下一阶":dtype 更小,但需要 scale 系统托底;没有 scale,FP8 只是一台数值事故制造机。

## 常见疑问

5 QUESTIONS

### Q1 · FP16 和 BF16 都是 16 位,为什么 BF16 通常更稳定?

ANS

因为稳定性首先看指数范围。FP16 只有 5 位 exponent,最大有限值约 65504;BF16 有 8 位 exponent,范围和 FP32 基本一致。训练里最怕的是 activation、loss、gradient norm 突然变大或变小,这些都由指数位决定。

BF16 的代价是尾数只有 7 位,相邻数间隔更粗。但深度学习训练本来就带噪声,很多模型能接受这点尾数损失。大模型训练里,不 overflow 往往比多几位尾数更重要。

### Q2 · 开 AMP 后 loss 偶尔变 nan,应该先查哪里?

ANS

按顺序查四件事:第一,看 `scaler.get_scale()` 是否频繁下降,如果是 FP16 overflow;第二,把可疑 loss、softmax、normalization 局部禁用 autocast 强制 FP32;第三,检查学习率和梯度裁剪顺序,特别是 clip 前是否 `unscale_`;第四,短跑 FP32 baseline,确认不是模型本身就不稳定。

不要一上来就把整个 AMP 关掉。更好的调试方式是二分定位哪一段 op 在低精度下不稳,然后只把那一段升回 FP32。

### Q3 · 为什么不直接把模型参数保存成 FP16/BF16 来省一半显存?

ANS

推理可以这么做,训练要小心。训练不仅有参数,还有梯度、optimizer state、master weights。AdamW 的 m/v 状态通常仍需要 FP32 或至少更高精度;如果把所有状态都降到 FP16,长跑很容易积累误差。

AMP 的设计是"计算用低精度,关键状态保高精度"。这也是为什么显存不会刚好减半:activation 和 gradient 省了,但 optimizer state 仍然很重。真正想切 optimizer state,要看 ZeRO/FSDP/8-bit optimizer,那是 Day 18 之后的内容。

### Q4 · TF32、FP16 AMP、BF16 AMP 应该怎么选?

ANS

如果你在 Ampere+ 上跑 FP32 baseline,默认就可能已经吃到 TF32 加速,这是最少改动的选项。想进一步省显存和提吞吐,优先看 BF16 AMP,前提是 GPU 支持 BF16 Tensor Core。旧卡或部署环境常见 FP16,就用 FP16 AMP + GradScaler。

粗略规则:A100/H100 训练 LLM 用 BF16;V100/T4/A10 用 FP16 AMP;严格数值对齐或科学计算先关 TF32/AMP 做 baseline。

### Q5 · FP8 会不会很快取代 BF16?

ANS

不会是简单替代,更像是再加一层。BF16 仍然是稳定、通用、易调的训练默认;FP8 更适合大模型里占主导的 GEMM 路径,并且依赖硬件、库和 scale 策略。生产系统很可能是 FP8 GEMM + BF16/FP16 activation 辅助 + FP32 optimizer state 的多层混合。

所以学习顺序也应该是:先懂 BF16/FP16 AMP,再懂 FP8 的 scale 系统。没有前者,直接上 FP8 会很难判断问题来自 dtype、scale、kernel 还是模型本身。

## 复盘问题

5 QUESTIONS

1. 画出 FP32 / FP16 / BF16 的 sign、exponent、mantissa 位宽,解释为什么 FP16 需要 GradScaler 而 BF16 通常不需要。
2. 说明 `autocast` 为什么不能理解成"把所有 op 都转成 FP16",并举出三类算子的 dtype 策略:降精度、升 FP32、跟随最宽输入。
3. 写出 AMP 训练循环的 5 个关键步骤:scale、backward、unscale、step、update,并说明 gradient clipping 应该插在哪一步。
4. 如果 AMP 训练第 20 step 开始出现 nan,设计一个二分排查流程:看哪些日志、禁用哪些局部 autocast、如何和 FP32 baseline 比。
5. 解释 FP8 E4M3 / E5M2 的差异,以及为什么 FP8 必须配合 scale / amax history 才能训练。

## 今日检查清单

8 ITEMS

- 能解释指数位和尾数位分别控制什么,并用这个视角比较 FP16 / BF16
- 能写出新版 `torch.amp.autocast` 与 `torch.amp.GradScaler` 的 AMP 训练模板
- 知道 backward 不需要单独包 autocast,只包 forward 和 loss
- 知道 FP16 下 gradient clipping 前必须先 `scaler.unscale_(optimizer)`
- 能用 `torch.cuda.max_memory_allocated()` 对比 FP32 / FP16 / BF16 的显存峰值
- 能用 loss 曲线和 `scaler.get_scale()` 判断 AMP 是否健康
- 知道 BF16 是 A100/H100 上训练 LLM 的默认优先项,FP16 更依赖 GradScaler
- 能解释 FP8 为什么需要 scale / amax history,以及 TransformerEngine 大致做了什么

## 推荐阅读

5 ITEMS

MUST READ

### PyTorch AMP 官方文档

重点看 `torch.amp.autocast`、`torch.amp.GradScaler`、op eligibility 三块。注意新版 API 已统一到 `torch.amp`,旧的 `torch.cuda.amp` 只应在维护老代码时出现。

OFFICIAL

### PyTorch Automatic Mixed Precision Examples

官方例子覆盖典型训练循环、gradient clipping、gradient accumulation、多 loss / 多 optimizer 场景。今天的实践模板就是从这些模式抽象出来的。

NVIDIA

### Mixed Precision Training Guide

NVIDIA 对 Tensor Core、FP16 accumulation、loss scaling 的解释最直接。适合补硬件视角:为什么矩阵维度对齐、GEMM 大小、累加 dtype 会影响真实吞吐。

FP8

### NVIDIA TransformerEngine 文档

学习 FP8 的入口。重点看 delayed scaling、E4M3/E5M2 hybrid format、FP8 autocast、支持的 layer。不要先读论文,先把工程 API 的形状看懂。

PAPER

### FP8 Formats for Deep Learning

理解 E4M3 / E5M2 为什么这样设计,以及前向和反向为何选择不同格式。读完你会更清楚 FP8 的难点不是位宽,而是动态范围校准。

## Day 13 预告

NEXT

COMING NEXT

### torch.compile / TorchDynamo / Inductor — 从 eager 到图编译

今天我们让单个 op 在更合适的 dtype 上跑得更快;明天继续往上看一层:PyTorch 如何把 Python eager 执行捕获成 FX graph,用 guards 保证语义,再交给 Inductor 做融合与代码生成。你会 benchmark 同一个小模型的 eager vs compile,第一次真正看到"图捕获 + 算子融合"带来的端到端收益。

"混合精度不是少用几位数,而是把每一位都用在最值得的位置。"

DAY 12 · AI INFRA 60-DAY ROADMAP
