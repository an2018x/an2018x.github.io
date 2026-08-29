---
title: "Day 30 · 解码算法"
date: '2026-06-20'
draft: false
description: "进入 LLM 解码策略:理解 greedy、beam search、temperature、top-k、top-p 的采样语义与服务化影响;掌握 speculative decoding 的 draft/verify 思想,并用 Transformers 与 vLLM 参数做小型实验。"
toc: true
tags:
  - AI
  - LLM
  - Inference
  - Decoding
  - Sampling
  - Speculative Decoding
---

DAY 30 · AI INFRA ROADMAP · INFERENCE

# 下一个 token _怎么选_

Day29 拆了 prefill、decode 和 KV Cache。今天继续沿着 decode loop 往下看: 模型每一步只给出一组 logits,真正决定输出风格、稳定性和服务成本的, 是你如何把 logits 变成下一个 token。 **greedy** 最确定但容易僵硬, **beam search** 搜索多个候选但成本线性放大, **temperature / top-k / top-p** 控制随机采样空间, **speculative decoding** 则尝试用更便宜的 draft 模型一次猜多个 token,再由大模型验证。 今天要把算法语义和推理系统影响一起记住。

**DURATION** 3 h **THEORY** 1.3 h **HANDS-ON** 1.2 h **REVIEW** 0.5 h **STACK** Transformers · vLLM · Sampling · Spec Decode

## 思维导图

OVERVIEW

> **图：Day 30 解码算法思维导图**
>
> - DAY 30 · 解码算法
> - GREEDY · BEAM · TOP-K · TOP-P · TEMPERATURE · SPECULATIVE
> - 01 · LOOP
> - decode loop
> - 02 · SEARCH
> - greedy / beam
> - 03 · SAMPLE
> - top-k / top-p
> - 04 · SPEED
> - speculative
> - logits
> - processors
> - warpers
> - KV update
> - argmax
> - num\_beams
> - length penalty
> - KV fan-out
> - temperature
> - top\_k
> - top\_p nucleus
> - quality / diversity
> - draft model
> - verify K tokens
> - accept rate
> - latency tradeoff
> - DELIVERABLES
> - 解码策略对比表
> - 采样器伪代码
> - Transformers 实验
> - spec decode 图

FIG · Day 30 全景:先理解每步 logits 如何变 token,再把策略选择落到服务延迟、吞吐和质量上

## Decode Loop 的位置

25 MIN

解码算法只发生在一个很小但极关键的位置: 模型 forward 产出最后一个位置的 logits, 经过一组 logits processor / warper 后,选择下一个 token, 再把 token 追加到序列并更新 KV Cache。 这个循环会重复到 EOS、max\_tokens 或 stop sequence。 所以 decode 策略几乎不改变 TTFT 的 prefill 部分,但会显著影响 inter-token latency、输出长度、KV cache 占用和调度器公平性。

> **图：decode loop**
>
> - ONE TOKEN DECODE LOOP
> - Input Tokens
> - prompt + generated
> - Model Forward
> - uses KV cache
> - Logits
> - vocab scores
> - Decode Rule
> - greedy / sample
> - Token
> - append
> - repeat until EOS / max\_tokens / stop sequence
> - 服务化影响:beam 会复制候选序列和 KV;sampling 参数会改变平均输出长度;speculative decoding 尝试减少 target model forward 次数。

FIG · 解码策略位于 logits 到 next token 的窄口,但它影响整条推理服务的延迟和资源占用

```
def decode_one_step(model, input_ids, past_kv, config):
    logits, past_kv = model(input_ids[:, -1:], past_key_values=past_kv)
    logits = logits[:, -1, :]

    logits = apply_processors(logits, config) # repetition penalty, no-repeat ngram, bad words...
    logits = apply_warpers(logits, config) # temperature, top-k, top-p...
    next_token = select_token(logits, config) # argmax or multinomial sample

    input_ids = append(input_ids, next_token)
    return input_ids, past_kv
```

## Greedy 与 Beam Search

35 MIN

greedy 和 beam search 都属于搜索式解码。 greedy 每步选最大概率 token,成本最低、最可复现,但容易短视。 beam search 保留多个候选序列,按累计 log probability 搜索更高概率的完整序列。 它在翻译、摘要这类目标相对确定的任务中仍有价值, 但在开放式聊天里经常显得重复、保守,并且会把 decode 计算和 KV cache 近似乘以 beam 数。

| 策略 | 下一 token 怎么选 | 优点 | Infra 影响 |
| --- | --- | --- | --- |
| Greedy | 每步 `argmax(logits)` | 最快、确定、容易复现,适合代码补全、分类式生成、测试 baseline | 每请求一条 decode path,KV cache 最省;输出可能重复或陷入局部最优 |
| Beam Search | 保留 `num_beams` 条候选,扩展后选累计分数最高的 beams | 目标明确任务上更稳,能减少单步短视 | decode batch 扩成 beams 倍,KV cache 和计算压力上升;服务系统里要限制 beams |
| Beam + Sampling | 每个 beam 内采样,再保留候选 | 比纯 beam 多样,比纯 sampling 更有搜索约束 | 调参复杂,线上很容易产生长尾延迟 |

### Beam Search 的分数修正

Length Penalty

### 防止偏短或偏长

累计 log probability 天然偏向短序列,所以 beam search 常用 length penalty 修正。机器翻译和摘要里这个参数很重要。

Early Stopping

### 控制什么时候停止搜索

当足够多 beams 生成 EOS 后可以提前结束。不同框架的停止条件略有差异,需要在服务侧明确配置。

Serving Rule

### 线上慎开大 beams

`num_beams=4` 通常意味着单请求占用接近四条序列的 decode 资源。多租户服务中要单独限流或禁用。

## Temperature / Top-k / Top-p

45 MIN

采样式解码先把 logits 变成概率分布,再随机抽 token。 `temperature` 改变分布尖锐程度, `top_k` 只保留概率最高的 k 个 token, `top_p` 又叫 nucleus sampling,保留累计概率达到 p 的最小 token 集。 它们不是"质量按钮",而是对随机空间的约束方式。

> **图：top-k top-p temperature**
>
> - SAMPLING FILTERS
> - Temperature
> - logits / T
> - T 小更尖锐,T 大更随机
> - Top-k
> - keep k highest
> - 固定候选数,简单稳定
> - Top-p
> - keep cumulative p
> - 候选数随分布自适应
> - TOKEN DISTRIBUTION EXAMPLE
> - token 1
> - token 2
> - token 3
> - long tail

FIG · temperature 改分布形状,top-k 固定候选数量,top-p 按累计概率自适应截断长尾

### 参数语义速查

| 参数 | 语义 | 调小 | 调大 |
| --- | --- | --- | --- |
| `temperature` | logits 除以 T 后再 softmax | 更确定、更保守;接近 0 时近似 greedy | 更随机、更发散;过大会胡言乱语 |
| `top_k` | 只在概率最高的 k 个 token 中采样 | 候选更少,输出更稳 | 候选更多,多样性更高 |
| `top_p` | 保留累计概率达到 p 的最小 token 集 | 截断更狠,低概率 token 更少 | 尾部更多,输出更开放 |
| `min_p` | 按最高概率 token 的相对比例过滤低概率 token | 更宽松 | 更严格,长尾更少 |

```
import torch

def sample_next_token(logits, temperature=0.8, top_k=50, top_p=0.95):
    logits = logits / max(temperature, 1e-6)

    if top_k is not None:
        values, _ = torch.topk(logits, top_k)
        logits = logits.masked_fill(logits < values[..., -1, None], float("-inf"))

    if top_p is not None:
        sorted_logits, sorted_idx = torch.sort(logits, descending=True)
        probs = torch.softmax(sorted_logits, dim=-1)
        cumulative = torch.cumsum(probs, dim=-1)
        remove = cumulative > top_p
        remove[..., 1:] = remove[..., :-1].clone()
        remove[..., 0] = False
        sorted_logits = sorted_logits.masked_fill(remove, float("-inf"))
        logits = torch.full_like(logits, float("-inf")).scatter(-1, sorted_idx, sorted_logits)

    probs = torch.softmax(logits, dim=-1)
    return torch.multinomial(probs, num_samples=1)
```

## 服务化视角的策略选择

25 MIN

业务上看,解码策略影响"回答像不像人"。 Infra 上看,它还影响请求长度分布、KV cache 生命周期、decode batch 的形状和长尾延迟。 所以线上系统不应该让所有参数无限开放,而是按场景给出受控的参数模板。

| 场景 | 推荐策略 | 原因 | 服务限制 |
| --- | --- | --- | --- |
| 代码补全 | 低 temperature 或 greedy | 需要稳定、语法正确、可复现 | 限制 max\_tokens,避免无限续写 |
| 开放聊天 | `temperature=0.7~1.0`, `top_p=0.9~0.95` | 平衡多样性和稳定性 | 限制 temperature 上限和 stop sequences |
| 摘要/翻译 | greedy 或小 beam | 目标较确定,不需要过多随机性 | `num_beams` 不宜过大,避免 KV fan-out |
| 高吞吐 API | sampling 模板 + 禁大 beam | 保持调度器可预测,减少长尾 | 限制 max\_tokens、best\_of、num\_beams、并发 |

服务侧参数治理很重要:一次 num\_beams=8 的请求,对调度器来说不是普通的一条序列。

## Speculative Decoding 思想

40 MIN

自回归解码慢,因为 target model 通常一次只能确认一个新 token。 speculative decoding 的想法是: 用一个便宜的 draft 模型先猜多个 token, 再让大的 target 模型一次 forward 验证这串候选。 如果 draft 猜得准,一次 target forward 可以接受多个 token, inter-token latency 就下降。 严格的 speculative sampling 可以保持目标分布不变;工程实现里还会有 n-gram、EAGLE、MTP 等不同 speculator。

> **图：speculative decoding**
>
> - SPECULATIVE DECODING
> - Current Prefix
> - accepted tokens
> - Draft Model
> - propose K tokens
> - Target Model
> - verify in parallel
> - Accept
> - 0..K+1
> - SPEEDUP CONDITION
> - draft 模型必须足够便宜,且接受率足够高。否则多跑一个模型反而增加负载。memory-bound decode 更容易受益。
> - 服务系统还要管理两个模型的 KV cache、batching、调度和回退路径。

FIG · draft 模型先猜多个 token,target 模型一次验证,接受率决定真实加速

### Spec Decode 的工程账本

| 指标 | 为什么重要 | 好现象 | 坏现象 |
| --- | --- | --- | --- |
| acceptance rate | draft 猜中越多,target forward 摊到的 token 越多 | 每次验证接受多个 token | 经常只接受 0 或 1 个 token |
| draft cost | draft 模型不是免费,也要占 GPU/CPU/内存 | draft 很小,延迟可被 target 节省覆盖 | draft 太重,吞吐下降 |
| traffic pattern | 短输出请求不一定能摊薄额外成本 | 长 decode、稳定领域、memory-bound | 短请求、高峰流量、接受率波动大 |
| scheduler complexity | 需要协调 draft/target 两套执行 | 引擎内建支持,监控 acceptance/token latency | 手写服务里难以和 continuous batching 配合 |

## 动手实验

1 H

今天的实验分两层。 第一层用 Transformers 在同一个 prompt 上跑不同 decoding config,观察输出和延迟。 第二层如果你本地有 vLLM 环境,尝试打开 speculative decoding,记录 token latency 与接受率相关日志。

```
from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig
import torch, time

model_id = "gpt2"
tok = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id).cuda().eval()

prompt = "Explain why KV cache matters for LLM serving in three bullets."
inputs = tok(prompt, return_tensors="pt").to("cuda")

configs = {
    "greedy": GenerationConfig(max_new_tokens=80, do_sample=False),
    "beam4": GenerationConfig(max_new_tokens=80, num_beams=4, do_sample=False),
    "top_p": GenerationConfig(max_new_tokens=80, do_sample=True, temperature=0.8, top_p=0.95),
    "top_k": GenerationConfig(max_new_tokens=80, do_sample=True, temperature=0.8, top_k=50),
}

for name, cfg in configs.items():
    torch.cuda.synchronize()
    t0 = time.perf_counter()
    out = model.generate(**inputs, generation_config=cfg)
    torch.cuda.synchronize()
    dt = time.perf_counter() - t0
    print("\\n===", name, f"{dt:.2f}s")
    print(tok.decode(out[0], skip_special_tokens=True))
```

```
# vLLM speculative decoding 示例:参数名会随版本变化,以当前 vLLM 文档为准
vllm serve meta-llama/Llama-2-7b-hf \
  --speculative-config '{"model":"JackFram/llama-160m","num_speculative_tokens":5}'

# 记录:
# 1. baseline inter-token latency
# 2. spec decode inter-token latency
# 3. GPU util / memory
# 4. acceptance rate 或 accepted tokens per verify step
```

### 实验记录表

| 策略 | 参数 | 输出特点 | 延迟 | 资源影响 |
| --- | --- | --- | --- | --- |
| greedy | `do_sample=false` | \_\_ | \_\_ ms/token | baseline |
| beam | `num_beams=4` | \_\_ | \_\_ ms/token | KV / compute 约 beams 倍 |
| top-p | `temperature=0.8 top_p=0.95` | \_\_ | \_\_ ms/token | 输出长度可能变化 |
| spec decode | `draft + num_speculative_tokens` | \_\_ | \_\_ ms/token | 看接受率和 draft 成本 |

## 交付物检查

DELIVERABLE

- 能画出 decode loop: logits → processor/warper → token selection → append → KV update。
- 能解释 greedy、beam、temperature、top-k、top-p 各自改变了什么。
- 能说明 beam search 为什么会放大 KV cache 和 decode 计算。
- 能写出一个最小 top-k/top-p sampler 伪代码。
- 跑同一个 prompt 的 greedy、beam、top-p/top-k 实验,记录输出特点和延迟。
- 能画出 speculative decoding 的 draft/verify/accept 流程,并说明什么时候可能变慢。

## 常见疑问

5 QUESTIONS

### Q1 · temperature=0 等于 greedy 吗?

ANS

概念上接近,但实现上很多框架会要求 temperature 大于 0,并用 `do_sample=false` 表示 greedy。线上配置最好显式区分"采样关闭"和"低温采样"。

### Q2 · top-k 和 top-p 应该同时开吗?

ANS

可以,常见做法是先用 temperature 调分布,再用 top-k/top-p 截断候选空间。top-k 给候选数硬上限,top-p 按概率质量自适应。是否同时开要用任务输出和长尾安全性验证。

### Q3 · beam search 为什么不适合大多数聊天场景?

ANS

聊天是开放式任务,最高概率序列不一定最好。beam search 往往更保守、更重复,同时把 decode 资源和 KV cache 按 beam 数放大。它更适合翻译、摘要等目标相对确定的任务。

### Q4 · speculative decoding 会改变输出质量吗?

ANS

严格的 speculative sampling 可以保持 target model 的分布不变,只是用 draft model 提案并由 target 验证。工程实现和近似 speculator 仍要做质量回归,尤其是工具调用、格式化输出和低温场景。

### Q5 · speculative decoding 什么情况下会变慢?

ANS

draft 模型太慢、接受率低、输出很短、系统已经 compute-bound、或者高峰流量下 draft/target 调度互相抢资源时,都会变慢。上线前必须记录 acceptance rate 和端到端 ms/token。

## 复盘问题

REVIEW

1. decode loop 中 logits processor 和 logits warper 的区别是什么?
2. 为什么 beam search 会增加 KV cache 占用?
3. temperature、top-k、top-p 分别从哪个角度控制随机性?
4. top-p 为什么叫 nucleus sampling?它和 top-k 的候选集合大小有什么不同?
5. 同一个 prompt 下,greedy 和 top-p 输出差异如何解释?
6. speculative decoding 的 speedup 由哪三个因素共同决定?
7. 如果你要给 OpenAI 兼容 API 设置默认采样参数,会如何限制用户输入?

## 参考资料

OFFICIAL DOCS

Hugging Face

### Generation Strategies

Transformers 官方解码策略文档,覆盖 greedy、beam search、sampling、top-k/top-p 等生成策略。
[huggingface.co · generation strategies](https://huggingface.co/docs/transformers/en/generation_strategies)

Hugging Face

### GenerationConfig

Transformers 官方生成参数文档,适合查 `temperature`、`top_k`、`top_p`、`num_beams` 等字段。
[huggingface.co · text generation](https://huggingface.co/docs/transformers/en/main_classes/text_generation)

Paper

### Speculative Decoding

Leviathan、Kalman、Matias 的 speculative decoding 论文,提出用 draft model 并行提案、target model 验证的加速思想。
[arxiv.org · 2211.17192](https://arxiv.org/abs/2211.17192)

vLLM

### Speculative Decoding in vLLM

vLLM 官方 speculative decoding 文档,包含 draft model、EAGLE、n-gram 等实现路线和服务化配置。
[docs.vllm.ai · speculative decoding](https://docs.vllm.ai/en/latest/features/speculative_decoding/)

解码算法不是模型之后的小尾巴,它就是推理服务体验和成本的控制面。

DAY 30 COMPLETE · NEXT: PAGEDATTENTION & VLLM
