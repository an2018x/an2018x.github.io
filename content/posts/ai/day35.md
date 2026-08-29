---
title: "Day 35 · 量化 (1)：权重量化"
date: '2026-06-20T00:00:00+08:00'
draft: false
description: "学习 LLM 推理中的权重量化:理解 INT8 / INT4、per-channel / group-wise scale、GPTQ 与 AWQ 的核心思想,并用 AutoGPTQ 或 llama.cpp 完成一次模型量化与评估。"
toc: true
tags:
  - AI
  - LLM
  - Inference
  - Quantization
  - GPTQ
  - AWQ
  - AutoGPTQ
  - llama.cpp
---

DAY 35 · AI INFRA ROADMAP · 60 DAYS

# 把模型权重压进 _4 bit_

Day 31-34 讨论了 serving 系统如何管理 KV Cache、调度请求和复用前缀。 Day 35 切到另一条推理优化主线: **权重量化** 。 目标不是让模型“变聪明”,而是把模型权重从 FP16/BF16 压到 INT8/INT4, 让单卡能放下更大的模型,让内存带宽压力下降,并在有合适 kernel 时提升吞吐。 今天重点理解 **INT8 / INT4** 、 **GPTQ** 、 **AWQ** , 最后用 AutoGPTQ 或 llama.cpp 完成一次可复现的量化与评估。

**DURATION** 3 h **THEORY** 1.3 h **HANDS-ON** 1.3 h **METHODS** INT8 · INT4 · GPTQ · AWQ **OUTPUT** quantized model · eval table

## 思维导图

OVERVIEW

> **图：Day 35 权重量化思维导图**
>
> - DAY 35 · Weight Quantization
> - INT8 · INT4 · GPTQ · AWQ · GGUF
> - 01 · WHY
> - 显存与带宽
> - 02 · BASICS
> - scale / zero point
> - 03 · METHODS
> - GPTQ / AWQ
> - 04 · PRACTICE
> - 量化与评估
> - 权重占用下降
> - load / swap 更轻
> - 显存留给 KV cache
> - 速度取决于 kernel
> - symmetric / asymmetric
> - per-channel
> - group-wise
> - 校准数据
> - GPTQ:近似二阶
> - 逐层重构误差
> - AWQ:激活感知
> - 保护 salient channels
> - AutoGPTQ
> - llama.cpp GGUF
> - perplexity / task eval
> - latency / memory
> - DELIVERABLES
> - 量化误差笔记
> - INT4 / INT8 对照表
> - 量化脚本
> - 评估报告

FIG · Day 35 全景:权重量化先压模型体积,再用评估确认质量与性能收益

## 为什么先做权重量化

25 MIN

推理时,模型权重通常是最大的一块静态显存。 对一个 7B 模型,FP16 权重大约 14GB;如果权重压到 4 bit,理论权重主体约 3.5GB, 再加上 scale、zero point、packing metadata 和运行时 buffer。 这会直接影响能否单卡加载、能否留下更多显存给 KV Cache,以及 decode 阶段读权重时的带宽压力。

FP16 size ≈ params · 2 bytes

7B 权重主体约 14GB,13B 约 26GB,70B 约 140GB。实际还要算 tokenizer、buffer 和框架开销。

INT4 size ≈ params · 0.5 bytes + scales

4 bit 不是“精确四分之一总显存”,因为每组权重还需要 scale / zero point 等元数据。

speedup = memory saving × kernel support

量化文件变小不等于一定更快。若 kernel 需要频繁反量化或没有 Tensor Core / SIMD 优化,收益会被吃掉。

容量收益

### 更大模型放进同一张卡

权重量化最直接的收益是降低模型常驻显存,让 7B/13B/34B 在更小设备上运行。

吞吐收益

### decode 更少搬权重

decode 每步 batch 小、读权重频繁,低 bit 权重可降低内存带宽压力,前提是 kernel 真的高效。

质量风险

### 低 bit 会引入误差

量化会改变线性层输出。校准集、group size、保留哪些层高精度,都会影响 perplexity 和下游任务。

## INT8 / INT4 基础

40 MIN

量化的基本动作是把浮点权重映射到整数格点。 反推理时,整数权重需要和 scale 一起恢复为近似浮点值,或在 mixed-precision kernel 中边乘边反量化。 LLM 权重量化常见的是 weight-only quantization:权重低 bit 存储,激活仍用 FP16/BF16。

> **图：权重量化流程图**
>
> - WEIGHT-ONLY QUANTIZATION PIPELINE
> - FP16 / BF16 W
> - float weights
> - calibrate group
> - scale · zero point · group size
> - packed INT4 / INT8
> - weights + scales
> - runtime: activation(fp16/bf16) × dequantized weight ≈ original linear output
> - 质量来自误差控制,速度来自高效 packing 与 mixed precision kernel

FIG · 权重量化不是只改文件后缀,而是 scale、packing 与 kernel 的组合

q = clamp(round(w / s) + z, qmin, qmax)

非对称量化带 zero point。适合范围不以 0 为中心的分布,但硬件实现可能更复杂。

w\_hat = s · (q - z)

反量化后的权重近似原权重。量化误差会通过线性层传到 logits。

group-wise: each group owns scale

group size 越小,scale 越细,质量通常更好;但 metadata 更多,packing / kernel 也更复杂。

### toy symmetric quantization

```
import torch

def quantize_symmetric(x, bits=4, group_size=128):
    qmax = 2 ** (bits - 1) - 1
    qmin = -2 ** (bits - 1)
    flat = x.flatten()
    qs, scales = [], []

    for start in range(0, flat.numel(), group_size):
        g = flat[start:start + group_size]
        scale = g.abs().max().clamp_min(1e-8) / qmax
        q = torch.round(g / scale).clamp(qmin, qmax).to(torch.int8)
        qs.append(q)
        scales.append(scale)

    return torch.cat(qs), torch.stack(scales)

def dequantize_symmetric(q, scales, shape, group_size=128):
    chunks = []
    for i, scale in enumerate(scales):
        chunks.append(q[i * group_size:(i + 1) * group_size].float() * scale)
    return torch.cat(chunks).reshape(shape)
```

| 方式 | 特点 | 优点 | 风险 |
| --- | --- | --- | --- |
| INT8 | 8 bit 权重,通常质量更稳。 | 误差小,部署风险低。 | 压缩率不如 INT4,速度收益依赖 kernel。 |
| INT4 | 4 bit 权重,LLM 本地推理很常见。 | 显存下降明显,适合单卡/边缘设备。 | 质量更依赖校准、group size 和方法。 |
| per-channel | 每个输出通道有独立 scale。 | 比 per-tensor 更能适配不同通道范围。 | metadata 增加,实现复杂一点。 |
| group-wise | 每组若干权重共享 scale,如 group size 128。 | 质量和体积折中较好。 | group size 选错会影响精度或吞吐。 |

## GPTQ 与 AWQ

45 MIN

直接 round-to-nearest 通常不够好。 GPTQ 和 AWQ 都是 post-training quantization,不需要重新训练完整模型, 但会用少量校准数据判断哪些误差更重要。 粗略说,GPTQ 试图逐层最小化量化后的重构误差;AWQ 则用激活分布识别重要通道, 通过缩放保护 salient weights,尽量让 4 bit 权重保留指令模型的质量。

GPTQ

### 用近似二阶信息补偿误差

GPTQ 是 one-shot weight quantization。它用校准样本估计层输入分布,逐层量化权重,并用近似 Hessian 信息补偿已量化权重带来的输出误差。

AWQ

### 用激活识别重要权重通道

AWQ 认为权重本身大小不是唯一信号,应该看真实激活会放大哪些通道。它保护少量 salient channels,常用于 4-bit weight-only 部署。

> **图：GPTQ 与 AWQ 方法对比**
>
> - TWO PTQ IDEAS
> - GPTQ
> - 1. 收集校准输入 X
> - 2. 逐层量化 W
> - 3. 用近似二阶信息补偿重构误差
> - minimize layer output error
> - AWQ
> - 1. 收集激活统计
> - 2. 找 salient channels
> - 3. 缩放通道,降低低 bit 误差
> - activation-aware protection
> - 二者都是 PTQ:少量校准数据 + 不做完整训练 + 量化后必须重新评估

FIG · GPTQ 关心重构误差补偿,AWQ 关心激活感知的重要通道保护

| 方法 | 关键输入 | 典型配置 | 适合场景 |
| --- | --- | --- | --- |
| RTN | 只看权重范围。 | round(w / scale) | 教学、快速基线,质量通常不是最好。 |
| GPTQ | 校准样本的层输入分布。 | bits=4, group\_size=128, act\_order/desc\_act | GPU 侧 4-bit GPTQ 格式,常用于 Transformers / ExLlama / Marlin 路线。 |
| AWQ | 激活统计与重要通道。 | w\_bit=4, q\_group\_size=128 | 指令模型、多模态模型、对泛化稳定性要求较高的部署。 |
| GGUF k-quants | llama.cpp 的 tensor packing 规则,可选 imatrix。 | Q4\_K\_M, Q5\_K\_M, Q8\_0 | CPU / Metal / Vulkan / 边缘设备上的 llama.cpp 生态。 |

## 动手一:AutoGPTQ 路线

35 MIN

AutoGPTQ 是理解 GPTQ 流程的好入口:准备校准样本,配置 bits/group\_size, 加载 FP16 模型,执行 `model.quantize(examples)`,保存量化权重。 真实项目里要注意维护状态、模型支持表、CUDA/PyTorch 版本和推理 kernel 是否匹配。

```
from transformers import AutoTokenizer
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig

pretrained_model_dir = "facebook/opt-125m"
quantized_model_dir = "opt-125m-gptq-4bit"

tokenizer = AutoTokenizer.from_pretrained(pretrained_model_dir, use_fast=True)
examples = [
    tokenizer("Quantization compresses LLM weights for inference."),
    tokenizer("Calibration samples should look like serving prompts."),
]

quantize_config = BaseQuantizeConfig(
    bits=4,
    group_size=128,
    desc_act=False, # True 可能更准,但推理/兼容性需验证
)

model = AutoGPTQForCausalLM.from_pretrained(
    pretrained_model_dir,
    quantize_config,
    device="cuda:0",
)
model.quantize(examples)
model.save_quantized(quantized_model_dir, use_safetensors=True)
tokenizer.save_pretrained(quantized_model_dir)
```

### 选校准集

尽量接近线上 prompt 分布。通用模型可用 C4/WikiText 子集,业务模型用真实脱敏样本。

### 先量小模型

用 125M/1B 级模型跑通流程,再量 7B/13B,避免一次量化卡在环境和显存问题上。

### 记录配置

保存 bits、group\_size、desc\_act、seqlen、校准样本数、CUDA/PyTorch/AutoGPTQ 版本。

### 重新评估

量化后必须跑 perplexity、任务集、人工样例和 latency,不能只看模型能加载。

## 动手二:llama.cpp / GGUF 路线

35 MIN

llama.cpp 的常见流程是两步: 先把 Hugging Face 模型转换为高精度 GGUF,再用 `llama-quantize` 生成 Q4/Q5/Q8 等量化 GGUF。这个路线特别适合本地推理、CPU/Metal/Vulkan 或边缘设备部署。

```
# 1. 安装 Python 依赖
python3 -m pip install -r requirements.txt

# 2. 从 Hugging Face repo 转成高精度 GGUF
python convert_hf_to_gguf.py \
  --outfile model-bf16.gguf \
  --outtype bf16 \
  --remote meta-llama/Llama-3.2-1B-Instruct

# 3. 量化成常用 Q4_K_M
./build/bin/llama-quantize \
  model-bf16.gguf \
  model-Q4_K_M.gguf \
  Q4_K_M

# 4. 运行量化模型
./build/bin/llama-cli \
  -m model-Q4_K_M.gguf \
  -p "Explain weight quantization in one paragraph." \
  -n 128
```

| GGUF 类型 | 大致定位 | 建议 |
| --- | --- | --- |
| Q8\_0 | 接近高质量低风险量化。 | 作为质量对照或空间还够时使用。 |
| Q5\_K\_M | 质量和体积折中偏质量。 | 对回答稳定性要求较高时优先试。 |
| Q4\_K\_M | 本地推理常见 4-bit 折中。 | Day35 推荐先用它跑完整流程。 |
| Q2 / Q3 | 极限压缩。 | 除非设备非常受限,否则要谨慎评估质量下降。 |

## 量化后怎么评估

35 MIN

量化评估要同时看三类指标: 质量有没有明显下降,性能有没有真实提升,资源占用是否达成目标。 只看模型文件变小会漏掉最关键的问题:低 bit 权重可能造成困惑度上升、输出格式不稳, 也可能因为 kernel 不匹配而没有速度收益。

| 维度 | 指标 | 怎么测 | 通过标准 |
| --- | --- | --- | --- |
| 质量 | perplexity、MMLU/GSM8K、业务 golden set、人工样例。 | 同一 tokenizer、同一 prompt、同一 decoding 参数对比 FP16。 | 重要任务下降在可接受范围内,格式和拒答行为无明显异常。 |
| 性能 | TTFT、TPOT、tokens/s、并发吞吐。 | 固定 batch、context、输出长度,分别测 prefill 和 decode。 | 速度收益来自真实 serving workload,不是单条样例偶然变快。 |
| 资源 | 模型文件大小、加载后显存、KV cache 可用空间。 | 记录 nvidia-smi / engine memory report / llama.cpp 日志。 | 权重节省转化为更大 batch、更长 context 或更低硬件成本。 |

### 报告模板

```
model: Llama-3.2-1B-Instruct
baseline: bf16
quantized: Q4_K_M / GPTQ-4bit-g128
calibration:
  samples: 128
  max_seq_len: 2048
  source: mixed chat prompts

quality:
  ppl_fp16: 8.42
  ppl_quant: 8.83
  golden_pass_rate_fp16: 94.0%
  golden_pass_rate_quant: 92.5%

performance:
  peak_vram_fp16: 3.1 GB
  peak_vram_quant: 1.4 GB
  tpot_fp16: 28.4 ms
  tpot_quant: 17.9 ms

decision:
  accept: yes
  reason: quality drop acceptable, memory target met, decode faster
```

## 常见误区

20 MIN

| 误区 | 为什么不准确 | 正确做法 |
| --- | --- | --- |
| 4-bit 一定快 4 倍 | 权重读写减少,但反量化、packing、kernel 和 batch shape 都会影响速度。 | 分别测 prefill、decode、并发吞吐和显存。 |
| 文件能加载就算成功 | 加载成功只说明格式和 kernel 兼容,不说明质量可用。 | 跑 perplexity、golden set 和真实 prompt。 |
| 校准集随便选 | GPTQ/AWQ 都依赖校准样本反映激活或层输入分布。 | 校准集要尽量接近线上场景,并记录采样方式。 |
| 权重量化解决所有显存问题 | 长上下文 serving 的 KV Cache 仍可能是大头。 | Day36 继续看 KV Cache 与激活量化,结合 PagedAttention 管理。 |

## 常见疑问

FAQ

### Q1 · 权重量化和 KV Cache 量化有什么区别?

A

权重量化压的是模型参数,通常是离线完成,模型加载后一直使用。KV Cache 量化压的是推理过程中动态产生的 K/V,会影响长上下文和高并发时的显存。Day35 只讲权重,Day36 会讲 KV 与激活。

### Q2 · GPTQ 和 AWQ 谁更好?

A

没有固定答案。GPTQ 路线成熟,生态里有很多 kernel 和模型格式;AWQ 对 instruction-tuned、多模态和泛化场景常有不错表现。最终取决于模型、校准集、目标硬件和推理引擎支持。

### Q3 · 为什么 group size 常见 128?

A

它是质量、元数据开销和 kernel 实现之间的工程折中。更小 group 通常误差更小,但 scale 更多;更大 group 元数据少,但不同权重分布被迫共享同一 scale,误差可能更大。

### Q4 · 什么时候不应该量化到 INT4?

A

如果任务对细微数值很敏感、模型很小、线上要求严格可复现,或者目标引擎没有高效 INT4 kernel,INT8、FP8 或 BF16 可能更稳。量化是部署选择,不是越低越高级。

## 复盘问题

REVIEW

1. 为什么 weight-only quantization 能降低 decode 阶段的内存带宽压力?
2. scale、zero point、group size 分别控制什么?group size 变小会带来什么代价?
3. GPTQ 为什么需要校准样本?它试图最小化什么误差?
4. AWQ 为什么要看 activation 而不只看 weight magnitude?
5. 量化模型上线前,你会用哪些质量、性能和资源指标做验收?

## 今日检查清单

CHECKLIST

- 能解释 INT8 / INT4 权重量化的 scale、zero point 和反量化公式。
- 能区分 per-tensor、per-channel、group-wise quantization。
- 能说明 GPTQ 的逐层重构误差思路和 AWQ 的激活感知通道保护思路。
- 能用 AutoGPTQ 或 llama.cpp 跑通一次小模型量化。
- 能记录 bits、group\_size、校准集、版本、目标硬件和推理 kernel。
- 能输出一张量化前后质量、延迟、吞吐、显存的对比表。

## 推荐阅读

LINKS

Paper

### [GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers](https://arxiv.org/abs/2210.17323)

GPTQ 原论文。重点读 one-shot、近似二阶信息和 3/4-bit 权重量化实验。

Paper

### [AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration](https://arxiv.org/abs/2306.00978)

AWQ 原论文。重点读 salient weights、activation-aware scaling 和 4-bit weight-only 部署动机。

Tool

### [AutoGPTQ](https://github.com/AutoGPTQ/AutoGPTQ)

GPTQ 工具入口。注意核对当前维护状态、安装方式、支持模型和推理 kernel。

Tool

### [llama.cpp quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)

官方量化说明。核心流程是先转换为 GGUF,再用 `llama-quantize` 生成目标量化格式。

## Day 36 预告

NEXT

量化 (2)

### KV Cache 与激活量化

下一天会从静态权重走向动态数据: FP8 KV Cache、SmoothQuant、per-channel vs per-token activation quantization, 以及为什么长上下文 serving 里 KV Cache 量化和权重量化同样重要。

量化不是把精度一刀砍掉,而是把误差放到模型最能承受的位置。

DAY 35 · WEIGHT QUANTIZATION · AI INFRA ROADMAP
