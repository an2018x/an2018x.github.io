---
title: "OpenAI vs Anthropic API 格式对比"
date: '2026-05-16'
draft: false
description: "端点、认证、请求参数、消息结构、响应解析、Tool Use、Streaming、Thinking、多模态输入、多轮对话——两大 API 体系全维度 HTTP 格式差异详解。"
toc: true
tags:
  - AI
  - API
  - OpenAI
  - Anthropic
---

API FORMAT COMPARISON · REFERENCE

# OpenAI vs Anthropic _HTTP 格式对比_

两套 API 在端点、认证、请求参数、消息结构、响应解析、工具调用、流式传输、推理模式、多模态输入和多轮对话上的核心差异。 同一个意图，两种 JSON——理解差异，才能自由切换。

**OPENAI** /v1/chat/completions **ANTHROPIC** /v1/messages **SECTIONS** 10 **SCOPE** HTTP / JSON

## 总览对比

OVERVIEW

| 维度 | OpenAI | Anthropic |
| --- | --- | --- |
| 端点 | `POST /v1/chat/completions` | `POST /v1/messages` |
| 认证方式 | `Authorization: Bearer sk-...` | `x-api-key: sk-ant-...` |
| 版本头 | —（无需版本头） | `anthropic-version: 2023-06-01` |
| 组织 / 项目头 | `OpenAI-Organization` / `OpenAI-Project` | — |
| System Prompt | 放在 `messages` 中，`role: "system"` | 独立顶层 `system` 字段（字符串或 block 数组） |
| max\_tokens | 可选（有默认值） | **必填** |
| temperature | 0 – 2（默认 1） | 0 – 1（默认 1） |
| top\_k | ✗ 不支持 | ✓ 支持 |
| 多候选（n） | ✓ 支持 n ≥ 1 | ✗ 不支持 |
| 响应取值路径 | `choices[0].message.content` | `content[0].text` |
| 内容格式 | `content` 为字符串（或工具调用时为 null） | `content` 为 block 数组（text / thinking / tool\_use） |
| Tool 定义 key | `type:"function"` 包裹 + `parameters` | 扁平结构 + `input_schema` |
| Tool 参数格式 | `arguments`（JSON 字符串） | `input`（已解析 JSON 对象） |
| Tool 结果角色 | `role: "tool"` | `role: "user"` + `type: "tool_result"` |
| tool\_choice | `"auto" / "none" / "required"` / 指定函数 | `{type:"auto"} / {type:"any"} / {type:"tool"}` |
| Thinking | `<think>` 标签内嵌或 `reasoning_split` | 独立 `thinking` content block + `budget_tokens` |
| Streaming | SSE `data: {"choices":[{"delta":...}]}` | SSE `event: content_block_delta` |
| 流结束标记 | `data: [DONE]` | `event: message_stop` |
| Vision / 图片 | `type: "image_url"` + `detail` | `type: "image"` + `source` |
| 错误格式 | `{"error": {"message":..., "type":...}}` | `{"type":"error", "error": {"type":..., "message":...}}` |
| 停止原因字段 | `finish_reason`（stop / length / tool\_calls） | `stop_reason`（end\_turn / max\_tokens / tool\_use） |
| Token 计量 | `prompt_tokens` / `completion_tokens` | `input_tokens` / `output_tokens` |

## 端点与认证

ENDPOINT

OpenAI

```
POST https://api.openai.com/v1/chat/completions

Content-Type: application/json
Authorization: Bearer sk-...
OpenAI-Organization: org-... ← 可选
OpenAI-Project: proj_... ← 可选
```

Anthropic

```
POST https://api.anthropic.com/v1/messages

Content-Type: application/json
x-api-key: sk-ant-api03-...
anthropic-version: 2023-06-01 ← 必填
anthropic-beta: ... ← Beta 功能时使用
```

### 完整 curl 示例

OpenAI curl

```
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are helpful."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

Anthropic curl

```
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "system": "You are helpful.",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**认证差异：** OpenAI 使用标准 HTTP `Authorization: Bearer` 方案； Anthropic 使用自定义 `x-api-key` header，并要求 `anthropic-version` 版本头。

**组织管理：** OpenAI 通过可选的 `OpenAI-Organization` 和 `OpenAI-Project` 头控制多组织/项目隔离。 Anthropic 目前无对应机制。

## 请求参数

PARAMETERS

| 参数 | OpenAI | Anthropic |
| --- | --- | --- |
| model | required `"gpt-4o"` | required `"claude-sonnet-4-20250514"` |
| max\_tokens | optional 有默认值 | required 必须显式指定 |
| messages | required 含 system / user / assistant / tool | required 仅含 user / assistant |
| system | —（在 messages 数组中传入） | optional 顶层字段，字符串或 block 数组 |
| temperature | optional 范围 0 – 2，默认 1 | optional 范围 0 – 1，默认 1 |
| top\_p | optional 0 – 1 | optional 0 – 1 |
| top\_k | ✗ | optional 整数 |
| n | optional 返回多个候选（1 – 128） | ✗ |
| stop | optional 字符串或数组（最多 4 个） | optional `stop_sequences` 数组 |
| stream | optional boolean | optional boolean |
| tools | optional function 定义数组 | optional tool 定义数组 |
| tool\_choice | optional `"auto"` / `"none"` / `"required"` / 指定函数 | optional `{type:"auto"}` / `{type:"any"}` / `{type:"tool"}` |
| presence\_penalty | optional -2.0 – 2.0 | ✗ |
| frequency\_penalty | optional -2.0 – 2.0 | ✗ |
| logprobs | optional boolean | ✗ |
| response\_format | optional `json_object` / `json_schema` | ✗ |
| seed | optional 整数（尽力复现） | ✗ |
| thinking | —（通过 `reasoning_split` 等参数控制） | optional `{type:"enabled", budget_tokens:N}` |
| metadata | ✗（通过 `user` 字符串追踪） | optional `{user_id: "..."}` |
| stream\_options | optional `{include_usage: true}` | —（usage 默认包含在事件中） |

**参数哲学差异：** OpenAI 提供更多"调味"参数（penalty、logprobs、seed、response\_format），适合精细控制输出分布。 Anthropic 则提供更多"结构化"控制（thinking.budget\_tokens、metadata、system 独立字段），侧重请求语义的明确性。 两者的 `temperature` 范围也不同（0–2 vs 0–1），迁移时需注意。

## 请求体结构

REQUEST BODY

### 基础请求体

OpenAI 请求体

```
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system", ← system 在 messages 中
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hi, how are you?"
    }
  ]
}
```

Anthropic 请求体

```
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024, ← 必填
  "system": "You are a helpful assistant.", ← 顶层字段
  "messages": [
    {
      "role": "user",
      "content": "Hi, how are you?"
    }
  ]
}
```

**关键差异 ①：** System Prompt 在 OpenAI 中是 `messages` 数组的一条消息（`role: "system"`）， Anthropic 将其提升为请求体的顶层字段 `"system"`。

**关键差异 ②：** Anthropic 的 `max_tokens` 是必填字段，OpenAI 则有默认值可省略。

### System Prompt 的高级用法

OpenAI — 多条 system 消息

```
// OpenAI 支持在 messages 中放置多条 system 消息
"messages": [
  {"role": "system",
   "content": "You are a translator."},
  {"role": "system",
   "content": "Always respond in JSON."},
  {"role": "user",
   "content": "Translate: Hello"}
]

// 也可以在对话中间插入 system 消息
```

Anthropic — system block 数组 + 缓存控制

```
// system 支持 block 数组格式（可附加 cache_control）
"system": [
  {
    "type": "text",
    "text": "You are a translator.",
    "cache_control": {"type": "ephemeral"}
  },
  {
    "type": "text",
    "text": "Always respond in JSON."
  }
]
```

Anthropic 的 system 字段可以是字符串或 block 数组，后者支持 cache\_control 实现 prompt caching

### 消息内容的两种写法

OpenAI — 两种写法均可

```
// 简写：content 为字符串
{"role": "user", "content": "Hello"}

// 完整写法：content 为数组（多模态时必须用此格式）
{"role": "user",
 "content": [
   {"type": "text", "text": "Hello"},
   {"type": "image_url", "image_url": {"url": "..."}}
 ]}
```

Anthropic — 两种写法均可

```
// 简写：content 为字符串
{"role": "user", "content": "Hello"}

// 完整写法：content 为 block 数组（多模态时必须用此格式）
{"role": "user",
 "content": [
   {"type": "text", "text": "Hello"},
   {"type": "image", "source": {"type": "url", "url": "..."}}
 ]}
```

## 响应体

RESPONSE BODY

### 完整响应 JSON

OpenAI 响应

```
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-4o-2024-08-06",
  "choices": [{ ← choices 数组包裹
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "I'm doing well!" ← 纯字符串
    },
    "finish_reason": "stop" ← 结束原因在 choice 内
  }],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 8,
    "total_tokens": 20,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0
    }
  }
}
```

Anthropic 响应

```
{
  "id": "msg_abc123",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-20250514",
  "content": [{ ← content block 数组
    "type": "text",
    "text": "I'm doing well!" ← block 中的 text 字段
  }],
  "stop_reason": "end_turn", ← 结束原因在顶层
  "stop_sequence": null,
  "usage": {
    "input_tokens": 12,
    "output_tokens": 8,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```

**结构差异：** OpenAI 用 `choices[]` 数组包裹（支持 n \> 1 多候选），文本在 `message.content`（字符串）。 Anthropic 直接在顶层返回 `content` block 数组，文本在 `content[i].text`。

**用量命名：** `prompt_tokens / completion_tokens` vs `input_tokens / output_tokens`。 Anthropic 额外返回 `cache_creation_input_tokens` 和 `cache_read_input_tokens` 用于 prompt caching 计费。

### 取值路径对比

OpenAI 路径

```
// 文本
response.choices[0].message.content → 字符串

// 结束原因
response.choices[0].finish_reason

// Token 用量
response.usage.prompt_tokens
response.usage.completion_tokens
response.usage.total_tokens
```

Anthropic 路径

```
// 文本
response.content[0].text → 字符串

// 结束原因
response.stop_reason

// Token 用量
response.usage.input_tokens
response.usage.output_tokens
// 无 total，需自行相加
```

### Usage 字段全览对照

| 语义 | OpenAI 字段 | Anthropic 字段 |
| --- | --- | --- |
| 输入 token 总数 | `usage.prompt_tokens` | `usage.input_tokens` |
| 输出 token 总数 | `usage.completion_tokens` | `usage.output_tokens` |
| 总 token | `usage.total_tokens`（API 给出） | —（需 input + output + cache\_\* 自行相加） |
| 缓存命中 | `usage.prompt_tokens_details.cached_tokens` | `usage.cache_read_input_tokens` |
| 缓存写入 | —（自动，不单独计量） | `usage.cache_creation_input_tokens` |
| 缓存细分（多 TTL） | — | `usage.cache_creation.ephemeral_5m_input_tokens`
`usage.cache_creation.ephemeral_1h_input_tokens` |
| 推理 token | `usage.completion_tokens_details.reasoning_tokens` | 计入 `output_tokens`（thinking block 部分） |
| 接受的预测 token | `usage.completion_tokens_details.accepted_prediction_tokens` | — |
| 拒绝的预测 token | `usage.completion_tokens_details.rejected_prediction_tokens` | — |
| 音频输入 token | `usage.prompt_tokens_details.audio_tokens` | —（暂不支持音频输入） |
| 音频输出 token | `usage.completion_tokens_details.audio_tokens` | — |
| Web 搜索请求数 | — | `usage.server_tool_use.web_search_requests` |
| 服务层级 | —（请求体 `service_tier` 控制） | `usage.service_tier`（`"standard" \| "priority" \| "batch"`） |

**计费基本规则：** OpenAI 的 `prompt_tokens` 已经包含缓存命中部分（`cached_tokens` 是其子集），按"原价 × (prompt − cached) + 折扣价 × cached"计费。 Anthropic 的 `input_tokens` 只统计 **未命中缓存且未触发写缓存** 的部分，三类 token（input / cache\_creation / cache\_read） **互不重叠** ，需分别按不同费率计费。

**常见踩坑：** 用 Anthropic 时若简单地 `input + output`，会漏算 `cache_creation_input_tokens`（缓存写入按 1.25× 或 2× 原价计费）和 `cache_read_input_tokens`（按 0.1× 原价计费）。

### 完整 usage 对象（含全部子字段）

OpenAI usage — 全字段示例

```
"usage": {
  "prompt_tokens": 2048, ← 含 cached_tokens
  "completion_tokens": 512, ← 含 reasoning_tokens
  "total_tokens": 2560,

  "prompt_tokens_details": {
    "cached_tokens": 1024, ← 自动命中缓存
    "audio_tokens": 0 ← 音频输入(GPT-4o-audio)
  },

  "completion_tokens_details": {
    "reasoning_tokens": 256, ← o1/o3/o4 思考
    "audio_tokens": 0, ← 音频输出
    "accepted_prediction_tokens": 0,
    "rejected_prediction_tokens": 0
  }
}

// 计费示例（GPT-4o，价格仅示意）：
// 普通输入: (2048 - 1024) × $2.50/M = ...
// 缓存输入: 1024 × $1.25/M = ...
// 输出: 512 × $10.00/M = ...
// (reasoning_tokens 已在 completion_tokens 中)
```

Anthropic usage — 全字段示例

```
"usage": {
  "input_tokens": 512, ← 未命中也未写缓存
  "cache_creation_input_tokens": 1024,
  "cache_read_input_tokens": 2048,

  "cache_creation": { ← 缓存写入按 TTL 拆分
    "ephemeral_5m_input_tokens": 512,
    "ephemeral_1h_input_tokens": 512
  },

  "output_tokens": 768, ← thinking + 正文
  "server_tool_use": { ← 服务端工具计量
    "web_search_requests": 2
  },
  "service_tier": "standard" ← standard/priority/batch
}

// 计费示例（Claude Sonnet 4，价格仅示意）：
// 普通输入: 512 × $3.00/M = ...
// 缓存写入(5m): 512 × $3.75/M (1.25×) = ...
// 缓存写入(1h): 512 × $6.00/M (2.00×) = ...
// 缓存读取: 2048 × $0.30/M (0.10×) = ...
// 输出: 768 × $15.00/M = ...
```

OpenAI 的 cached\_tokens 是 prompt\_tokens 的子集（重叠）；Anthropic 三类输入字段相互独立（不重叠），合计才是实际处理的输入总量

### Prompt Caching 计费机制对比

| 维度 | OpenAI | Anthropic |
| --- | --- | --- |
| 触发方式 | 自动（prefix ≥ 1024 token 时） | 显式，在请求体加 `cache_control: {type: "ephemeral"}` |
| 缓存最小粒度 | 1024 token（不足不缓存） | 取决于模型：Sonnet/Opus 1024、Haiku 2048 |
| 缓存写入费用 | 免费（不额外计费） | 5m TTL: 1.25× 原价；1h TTL: 2.00× 原价 |
| 缓存读取费用 | 0.5× 原价（约 50% 折扣） | 0.1× 原价（约 90% 折扣） |
| TTL 默认 | ~5–10 分钟（不可调整） | 5 分钟（默认）或 1 小时（`ttl: "1h"`） |
| 断点数量 | —（自动 prefix） | 最多 4 个 `cache_control` 断点（system + tools + messages） |
| 响应中的命中量 | `prompt_tokens_details.cached_tokens` | `cache_read_input_tokens` |
| 响应中的写入量 | 不区分（已含在 prompt\_tokens 内） | `cache_creation_input_tokens` + `cache_creation.ephemeral_{5m,1h}_input_tokens` |

**缓存计费公式：**
 ▸ **OpenAI** ：`cost = input × full_price − cached × 0.5 × full_price + output × out_price`
 ▸ **Anthropic** ：`cost = input × full + cache_creation × {1.25 or 2.00} × full + cache_read × 0.10 × full + output × out_price`

 由于 Anthropic 的三类输入 **不重叠** ，统计实际处理的 prompt 总 token 时需 `total_input = input_tokens + cache_creation_input_tokens + cache_read_input_tokens`。

### Reasoning / Thinking Token 计费

OpenAI — reasoning\_tokens（o1/o3/o4 系列）

```
// 思考 token 是 completion 的子集，不可读
"usage": {
  "prompt_tokens": 100,
  "completion_tokens": 1500,
  "completion_tokens_details": {
    "reasoning_tokens": 1200 ← 隐式思考
  }
}

// 关键点：
// 1. reasoning_tokens 已包含在 completion_tokens 中
// 2. 计费时按 output 价计算 (整个 completion)
// 3. 思考内容对用户不可见（仅返回 summary）
// 4. max_completion_tokens 需要预留思考预算
// （而非旧的 max_tokens，o-系列已弃用）
// 5. 通过 reasoning_effort: "low/medium/high"
// 控制思考深度
```

Anthropic — thinking block（Claude 3.7+ / 4.x）

```
// 思考 token 计入 output_tokens，但内容可见
"usage": {
  "input_tokens": 100,
  "output_tokens": 1500 ← thinking + 正文
}

"content": [
  {"type":"thinking","thinking":"Let me ...",
   "signature":"abc..."}, ← 思考块（可见）
  {"type":"text","text":"答案是 42"}
]

// 关键点：
// 1. thinking 文本按 output 价计费
// 2. 通过 thinking.budget_tokens 控制上限
// 3. budget_tokens 必须 < max_tokens
// 4. 多轮回传时需要带回 signature 才会被采信
// 5. 工具调用循环中必须回传 thinking block
```

### 多模态 Token 计算（图片 / 音频）

| 类型 | OpenAI 计费规则 | Anthropic 计费规则 |
| --- | --- | --- |
| 图片（low detail） | 固定 85 tokens / 张 | —（不区分 detail，按尺寸折算） |
| 图片（high detail） | 85 + 170 × tile 数（每 tile = 512×512） | `tokens ≈ (width × height) / 750` |
| 图片建议尺寸上限 | ≤ 2000×768 或 768×2000（自动缩放） | ≤ 1568 px 长边（超出会缩放） |
| 图片 token 归属 | `prompt_tokens`（不单列） | `input_tokens`（不单列） |
| 音频输入 | `prompt_tokens_details.audio_tokens`
（约 25 tokens/秒，gpt-4o-audio） | —（暂不支持） |
| 音频输出 | `completion_tokens_details.audio_tokens` | — |
| PDF / 文档 | 通常先转图片，按图片计费 | 直接传 PDF，按页转 token（约 1500–3000 / 页） |

**图片 token 估算示例：** 一张 1024×768 的图片，OpenAI（high detail）需 `85 + 170 × 6 = 1105` tokens； Anthropic 约 `(1024 × 768) / 750 ≈ 1049` tokens。两者数量级接近，但实际请求可能因预处理差异略有不同。

### 流式（Streaming）中获取 usage

OpenAI — 需显式开启

```
// 请求体必须加 stream_options
{
  "model": "gpt-4o",
  "messages": [...],
  "stream": true,
  "stream_options": {"include_usage": true}
}

// 中间事件 usage 字段为 null
data: {"choices":[{"delta":{...}}],
       "usage": null}

// 倒数第二个 chunk（choices 为空）携带 usage
data: {"choices": [],
       "usage": {
         "prompt_tokens": 12,
         "completion_tokens": 8,
         "total_tokens": 20
       }}

data: [DONE]

// 不加 include_usage 时整个流没有 usage 字段
```

Anthropic — 默认包含，分两次返回

```
// 无需任何额外配置

// 首个事件 message_start 含 input_tokens
event: message_start
data: {"type":"message_start","message":{
  ...,
  "usage":{
    "input_tokens": 12,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "output_tokens": 1 ← 仅占位
  }}}

// 末尾事件 message_delta 含 output_tokens
event: message_delta
data: {"type":"message_delta",
  "delta":{"stop_reason":"end_turn"},
  "usage":{"output_tokens": 8}}

// 需要合并 message_start.usage + message_delta.usage
// 才能拿到完整的 usage 对象
```

OpenAI 在最后一个非 [DONE] 的 chunk 一次性返回完整 usage；Anthropic 把输入和输出 usage 拆到流的两端，需要客户端做合并

### 服务层级（Service Tier）对 usage 的影响

| 层级 | OpenAI | Anthropic |
| --- | --- | --- |
| 标准 | 请求体 `"service_tier": "auto"`（默认） | `usage.service_tier: "standard"` |
| 优先 / Flex | `"service_tier": "flex"`（折扣价、更慢）
`"service_tier": "priority"`（部分模型，溢价、更快） | `usage.service_tier: "priority"`
（请求体加 `"service_tier": "auto"` 或调用 Priority Tier endpoint） |
| 批处理 | 独立 `/v1/batches` 接口，约 0.5× 原价、24h 内完成 | 独立 `/v1/messages/batches`，0.5× 原价；`usage.service_tier: "batch"` |
| 用量字段差异 | 响应里没有 `service_tier`，请求体里指定 | 响应 `usage.service_tier` 明示实际处理层级（可能与请求不一致） |

### 典型场景下的 Token 计算示例

OpenAI — 多轮 + 缓存 + 推理

```
// 场景：o3 模型 + 长 system + 多轮对话
"usage": {
  "prompt_tokens": 5200, ← system + 历史
  "completion_tokens": 800,
  "total_tokens": 6000,
  "prompt_tokens_details": {
    "cached_tokens": 4800 ← 92% 命中
  },
  "completion_tokens_details": {
    "reasoning_tokens": 600 ← 75% 用于推理
  }
}

// 计算（假设 $2/M 输入, $1/M 缓存, $8/M 输出）：
// 非缓存输入: (5200 - 4800) × $2/M = $0.0008
// 缓存输入: 4800 × $1/M = $0.0048
// 输出(含推理): 800 × $8/M = $0.0064
// 合计: ≈ $0.012
```

Anthropic — 多轮 + 缓存 + thinking + 工具

```
// 场景：Sonnet 4 + cache + thinking + 工具调用
"usage": {
  "input_tokens": 120, ← 仅本轮新增
  "cache_creation_input_tokens": 800,
  "cache_read_input_tokens": 4280, ← 83% 复用
  "cache_creation": {
    "ephemeral_5m_input_tokens": 800
  },
  "output_tokens": 900, ← thinking + tool_use + text
  "server_tool_use": {"web_search_requests": 1},
  "service_tier": "standard"
}

// 计算（假设 $3/M 输入, $15/M 输出）：
// 普通输入: 120 × $3/M = $0.00036
// 缓存写入: 800 × $3.75/M (1.25×) = $0.003
// 缓存读取: 4280 × $0.30/M (0.10×) = $0.00128
// 输出: 900 × $15/M = $0.0135
// Web 搜索: 1 × $10/1000 = $0.01
// 合计: ≈ $0.028
// 实际处理输入 = 120 + 800 + 4280 = 5200 tokens
```

### 用量追踪与会话级聚合

OpenAI — 追踪用户与会话

```
// 请求体加 user 字段，便于在 Dashboard / 风控里聚合
{
  "model": "gpt-4o",
  "messages": [...],
  "user": "user_8a3f..." ← 字符串，自由格式
}

// 响应中没有 user 回显，但可在用量报告中按 user 切片
// 项目 / 组织维度通过 OpenAI-Project / OpenAI-Organization
// 请求头自动归类

// 多轮 token 聚合 = 每次响应的 total_tokens 累加
// （已含 cached_tokens，不会重复计费）
```

Anthropic — metadata.user\_id

```
// 请求体加 metadata.user_id 用于滥用检测和报表
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "messages": [...],
  "metadata": {
    "user_id": "user_8a3f..." ← 建议哈希化
  }
}

// 多轮 token 聚合需要分别累加：
// total_input = Σ (input + cache_creation + cache_read)
// total_output = Σ output_tokens
// 否则会漏掉缓存读写的两类输入 token

// 注意：metadata.user_id 不会出现在响应中，
// 仅用于服务端聚合和滥用检测
```

**会话级累加易错点：**
 ▸ OpenAI：直接累加 `total_tokens` 即可（缓存命中已折算在 prompt\_tokens 中，但 dashboard 计费按实际付费 token）。
 ▸ Anthropic：必须三类输入字段都参与累加，否则统计的"实际处理 prompt 长度"会严重偏低（典型场景下可能只统计到真实值的 10–20%）。
 ▸ Streaming：OpenAI 不开 `include_usage` 时 usage 全程缺失；Anthropic 必须合并 `message_start.usage` 与 `message_delta.usage`。

### 停止原因值对照

| 场景 | OpenAI `finish_reason` | Anthropic `stop_reason` |
| --- | --- | --- |
| 正常结束 | `"stop"` | `"end_turn"` |
| 达到 token 上限 | `"length"` | `"max_tokens"` |
| 需要调用工具 | `"tool_calls"` | `"tool_use"` |
| 命中停止序列 | `"stop"`（同正常结束） | `"stop_sequence"`（有独立值） |
| 内容过滤 | `"content_filter"` | —（以错误响应返回） |

### 错误响应格式

OpenAI 错误（HTTP 401）

```
{
  "error": {
    "message": "Incorrect API key provided: sk-...xxxx.",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}

// 错误类型：invalid_request_error, authentication_error,
// permission_error, rate_limit_error, server_error
```

Anthropic 错误（HTTP 401）

```
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  }
}

// 错误类型：invalid_request_error, authentication_error,
// permission_error, not_found_error, rate_limit_error,
// api_error, overloaded_error
```

OpenAI 错误体多一个 param（指向出错参数）和 code（细分错误码）字段；Anthropic 结构更简洁，外层多一个 "type": "error" 标识

## Tool Use

FUNCTION CALLING

### 工具定义（请求体中的 tools 字段）

OpenAI — type + function 包裹

```
"tools": [{
  "type": "function", ← 额外包裹层
  "function": {
    "name": "get_weather",
    "description": "Get weather info",
    "parameters": { ← "parameters"
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "City name"
        }
      },
      "required": ["location"]
    },
    "strict": false ← 可选：强制结构化输出
  }
}]
```

Anthropic — 扁平结构 + input\_schema

```
"tools": [{
  "name": "get_weather", ← 直接平铺
  "description": "Get weather info",
  "input_schema": { ← "input_schema"
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City name"
      }
    },
    "required": ["location"]
  }
}]
```

**差异 ①：** OpenAI 有 `"type":"function"` + `"function":{}` 包裹，Anthropic 直接平铺。
**差异 ②：** Schema key：`"parameters"` vs `"input_schema"`。
**差异 ③：** OpenAI 支持 `"strict": true` 强制结构化输出（Structured Outputs）。

### tool\_choice 对比

OpenAI tool\_choice

```
// 模型自行决定（默认）
"tool_choice": "auto"

// 禁止使用工具
"tool_choice": "none"

// 强制使用工具（不限定哪个）
"tool_choice": "required"

// 指定使用某个工具
"tool_choice": {
  "type": "function",
  "function": {"name": "get_weather"}
}

// 控制并行工具调用
"parallel_tool_calls": false
```

Anthropic tool\_choice

```
// 模型自行决定（默认）
"tool_choice": {"type": "auto"}

// 无 "none" — 不传 tools 即可

// 强制使用工具（不限定哪个）
"tool_choice": {"type": "any"}

// 指定使用某个工具
"tool_choice": {
  "type": "tool",
  "name": "get_weather"
}

// 控制并行工具调用（嵌套在 tool_choice 中）
"tool_choice": {
  "type": "auto",
  "disable_parallel_tool_use": true
}
```

OpenAI 用字符串 "auto"/"none"/"required"，Anthropic 用对象 {type: "auto"/"any"/"tool"}。并行控制位置也不同

### 响应中的工具调用

OpenAI — message.tool\_calls 数组

```
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": null, ← 有工具调用时 content 为 null
      "tool_calls": [{ ← 独立的 tool_calls 字段
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\"location\":\"San Francisco\"}"
        } ↑ arguments 是 JSON 字符串
      }]
    },
    "finish_reason": "tool_calls"
  }]
}
```

Anthropic — content block 中的 tool\_use

```
{
  "role": "assistant",
  "content": [
    {
      "type": "text", ← 可以有文本说明
      "text": "Let me check the weather."
    },
    {
      "type": "tool_use", ← 工具调用也在 content 数组中
      "id": "toolu_abc123",
      "name": "get_weather",
      "input": {"location": "San Francisco"}
    } ↑ input 是已解析的 JSON 对象
  ],
  "stop_reason": "tool_use"
}
```

**核心差异：** OpenAI 将工具调用放在 `message.tool_calls` 独立字段中，`content` 为 null。 Anthropic 将工具调用作为 `content` block 数组中的一个元素（可与 text block 共存）。

**参数格式：** OpenAI 的 `arguments` 是 **JSON 字符串** （需 `JSON.parse()`）， Anthropic 的 `input` 是 **已解析的 JSON 对象** （直接使用）。

### 并行工具调用

OpenAI — 多个 tool\_calls 元素

```
"tool_calls": [
  {
    "id": "call_1",
    "type": "function",
    "function": {
      "name": "get_weather",
      "arguments": "{\"location\":\"SF\"}"
    }
  },
  {
    "id": "call_2",
    "type": "function",
    "function": {
      "name": "get_time",
      "arguments": "{\"timezone\":\"PST\"}"
    }
  }
]
```

Anthropic — 多个 tool\_use blocks

```
"content": [
  {"type": "text",
   "text": "I'll check both for you."},
  {
    "type": "tool_use",
    "id": "toolu_1",
    "name": "get_weather",
    "input": {"location": "SF"}
  },
  {
    "type": "tool_use",
    "id": "toolu_2",
    "name": "get_time",
    "input": {"timezone": "PST"}
  }
]
```

### 回传工具结果

OpenAI — 每个结果一条 role: "tool" 消息

```
// 每个 tool_call 对应一条 tool 消息
{
  "role": "tool",
  "tool_call_id": "call_1",
  "content": "24°C, sunny"
},
{
  "role": "tool",
  "tool_call_id": "call_2",
  "content": "2:30 PM PST"
}
```

Anthropic — 一条 user 消息含多个 tool\_result

```
// 所有结果放在一条 user 消息的 content 数组中
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_1",
      "content": "24°C, sunny"
    },
    {
      "type": "tool_result",
      "tool_use_id": "toolu_2",
      "content": "2:30 PM PST"
    }
  ]
}
```

**角色差异：** OpenAI 用专用 `role: "tool"`，每个结果一条独立消息。 Anthropic 用 `role: "user"` + `tool_result` block，多个结果可合并为一条消息。

**ID 字段：** `tool_call_id`（OpenAI）vs `tool_use_id`（Anthropic）。

**错误回传：** Anthropic 支持在 tool\_result 中添加 `"is_error": true` 标记工具执行失败，OpenAI 无此机制（需在 content 中描述）。

## Streaming

SSE

### 启用流式（请求体加 "stream": true）

OpenAI SSE 事件流

```
// 首个 chunk — 携带 role
data: {"id":"chatcmpl-...","choices":[{
  "delta":{"role":"assistant","content":""},
  "index":0}]}

// 文本增量（逐 token）
data: {"choices":[{"delta":{
  "content":"I'm"},"index":0}]}

data: {"choices":[{"delta":{
  "content":" doing"},"index":0}]}

data: {"choices":[{"delta":{
  "content":" well!"},"index":0}]}

// 结束标记
data: {"choices":[{"delta":{},
  "finish_reason":"stop"}]}

data: [DONE]
```

Anthropic SSE 事件流

```
// 消息开始（含 message 元信息和 usage）
event: message_start
data: {"type":"message_start","message":{
  "id":"msg_...","role":"assistant",
  "usage":{"input_tokens":12,...}}}

// 内容块开始（声明类型 → text）
event: content_block_start
data: {"type":"content_block_start",
  "index":0,
  "content_block":{"type":"text","text":""}}

// 文本增量（逐 token）
event: content_block_delta
data: {"type":"content_block_delta","index":0,
  "delta":{"type":"text_delta",
    "text":"I'm doing well!"}}

// 内容块结束
event: content_block_stop
data: {"type":"content_block_stop","index":0}

// 消息增量（含 stop_reason 和 output usage）
event: message_delta
data: {"type":"message_delta",
  "delta":{"stop_reason":"end_turn"},
  "usage":{"output_tokens":8}}

// 消息结束
event: message_stop
data: {"type":"message_stop"}
```

### SSE 事件生命周期对比

| 阶段 | OpenAI | Anthropic |
| --- | --- | --- |
| 流开始 | 首个 `data:`（含 `delta.role`） | `event: message_start` |
| 内容块开始 | —（无显式事件） | `event: content_block_start`（声明 block 类型） |
| 文本增量 | `delta.content` | `delta.type: "text_delta"` + `delta.text` |
| 内容块结束 | — | `event: content_block_stop` |
| 用量信息 | 需要 `"stream_options": {"include_usage": true}`，最后一个 chunk 携带 | 默认包含：`message_start` 携带 input，`message_delta` 携带 output |
| 流结束 | `data: [DONE]` | `event: message_stop` |

### 工具调用的流式事件

OpenAI — tool\_calls 增量

```
// 工具调用开始（首个 chunk 含完整元信息）
data: {"choices":[{"delta":{
  "tool_calls":[{"index":0,
    "id":"call_abc",
    "type":"function",
    "function":{"name":"get_weather",
      "arguments":""}}]}}]}

// arguments 分段传输（JSON 字符串片段）
data: {"choices":[{"delta":{
  "tool_calls":[{"index":0,
    "function":{"arguments":"{\"lo"}}]}}]}

data: {"choices":[{"delta":{
  "tool_calls":[{"index":0,
    "function":{"arguments":"cation\":\"SF\"}"}}]}}]}

// 结束
data: {"choices":[{"delta":{},
  "finish_reason":"tool_calls"}]}
data: [DONE]
```

Anthropic — tool\_use block 事件

```
// 工具调用块开始（声明 block 类型 + 元信息）
event: content_block_start
data: {"type":"content_block_start",
  "index":1,
  "content_block":{"type":"tool_use",
    "id":"toolu_abc",
    "name":"get_weather",
    "input":{}}}

// input 分段传输（JSON 片段）
event: content_block_delta
data: {"type":"content_block_delta",
  "index":1,
  "delta":{"type":"input_json_delta",
    "partial_json":"{\"location"}}

event: content_block_delta
data: {"delta":{"type":"input_json_delta",
    "partial_json":"\":\"SF\"}"}}

// 工具调用块结束
event: content_block_stop
data: {"type":"content_block_stop","index":1}
```

**Anthropic 的结构化优势：** 每个 content block 有明确的 `start → delta → stop` 生命周期，且 `content_block_start` 事件中声明了 block 类型。 这使得客户端可以在流式中即时知道即将到来的内容是 text、tool\_use 还是 thinking，无需回溯解析。 OpenAI 的 tool\_calls 增量通过 `delta.tool_calls[i].index` 定位，相对扁平。

## Thinking / Reasoning

EXTENDED THINKING

### 请求格式

OpenAI — 默认开启（部分模型）

```
// 思考默认内嵌在 content 中
// 通过 reasoning_split 分离思考和回答
{
  "model": "gpt-4o",
  "messages": [...],
  "reasoning_split": true ← 可选：分离思考内容
}

// 不使用 reasoning_split 时，思考过程
// 以 <think>...</think> 标签嵌入 content 字符串
```

Anthropic — 显式启用 + 预算控制

```
// 通过 thinking 参数显式启用
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 16000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000 ← 思考 token 预算
  },
  "messages": [...]
}

// budget_tokens 控制模型可用于思考的最大 token 数
// 必须小于 max_tokens
```

### 响应格式

OpenAI — \<think\> 标签 / reasoning\_details

```
// 默认：思考嵌入 content 字符串
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "<think>\nLet me analyze this step by step.\n1. First...\n2. Then...\n</think>\n\nThe answer is 42."
    }
  }]
}

// 使用 reasoning_split=true 时：
{
  "choices": [{
    "message": {
      "content": "The answer is 42.",
      "reasoning_details": [{
        "type": "reasoning.text",
        "text": "Let me analyze this step by step.\n1. First...\n2. Then..."
      }]
    }
  }]
}
```

Anthropic — 独立 thinking block

```
// 思考作为独立的 content block
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step.\n1. First...\n2. Then..."
    },
    {
      "type": "text",
      "text": "The answer is 42."
    }
  ]
}

// 多步推理可能产生多个 thinking + text 交错：
// [thinking, text, thinking, tool_use, ...]
```

### Thinking 的流式事件

OpenAI — \<think\> 标签嵌入 delta.content

```
// 默认：思考和回答混在 delta.content 中
data: {"choices":[{"delta":{
  "content":"<think>\nLet me"}}]}
data: {"choices":[{"delta":{
  "content":" analyze..."}}]}
data: {"choices":[{"delta":{
  "content":"</think>\n\nThe answer"}}]}

// 使用 reasoning_split=true 时：
// 思考增量通过 delta.reasoning_details 传输
// 回答增量通过 delta.content 传输
data: {"choices":[{"delta":{
  "reasoning_details":[{
    "type":"reasoning.text",
    "text":"Let me analyze..."}]}}]}
```

Anthropic — 独立的 thinking block 事件

```
// thinking block 开始 — 声明类型
event: content_block_start
data: {"index":0,"content_block":{
  "type":"thinking","thinking":""}}

// thinking 增量（thinking_delta 类型）
event: content_block_delta
data: {"index":0,"delta":{
  "type":"thinking_delta",
  "thinking":"Let me analyze..."}}

event: content_block_stop
data: {"index":0}

// text block 开始 — 声明类型
event: content_block_start
data: {"index":1,"content_block":{
  "type":"text","text":""}}

// text 增量（text_delta 类型）
event: content_block_delta
data: {"index":1,"delta":{
  "type":"text_delta",
  "text":"The answer is 42."}}
```

**流式中的类型区分：** Anthropic 在 `content_block_start` 中声明 block 类型（`"thinking"` / `"text"`）， 后续 delta 分别携带 `"thinking_delta"` 或 `"text_delta"`，无需解析标签边界。 OpenAI 默认情况下需检测 `<think>` 标签来区分，使用 `reasoning_split` 可将二者分离到不同字段。

### 多轮对话中的 Thinking 回传

OpenAI — 保留完整 content / reasoning\_details

```
// 默认格式：原样回传包含 <think> 的 content
{"role": "assistant",
 "content": "<think>...</think>\n\nThe answer is 42."}

// reasoning_split 格式：回传 reasoning_details
{"role": "assistant",
 "content": "The answer is 42.",
 "reasoning_details": [{
   "type": "reasoning.text",
   "text": "Let me analyze..."
 }]}
```

Anthropic — 必须回传 thinking blocks + signature

```
// 必须完整回传 content 数组（含 signature）
{"role": "assistant",
 "content": [
   {
     "type": "thinking",
     "thinking": "Let me analyze...",
     "signature": "WyIxNjk3..." ← 必须保留
   },
   {
     "type": "text",
     "text": "The answer is 42."
   }
 ]}
```

Anthropic 的 thinking block 在回传时必须包含 signature 字段（响应中自动返回），用于验证思考内容的完整性。丢弃 thinking blocks 会导致后续推理质量下降

## Vision / 多模态输入

MULTIMODAL

### 通过 URL 传入图片

OpenAI — image\_url block

```
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "What's in this image?"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/photo.jpg",
        "detail": "auto" ← "low" / "high" / "auto"
      }
    }
  ]
}
```

Anthropic — image block + source

```
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "What's in this image?"
    },
    {
      "type": "image",
      "source": {
        "type": "url",
        "url": "https://example.com/photo.jpg"
      }
    }
  ]
}
```

### 通过 Base64 传入图片

OpenAI — data URI 嵌入 url 字段

```
{
  "type": "image_url",
  "image_url": {
    "url": "data:image/png;base64,iVBORw0KGgo..."
  }
}

// base64 数据嵌入 data URI scheme 中
// 格式：data:{media_type};base64,{data}
// media_type 从 URI 中推断
```

Anthropic — 独立的 source 字段

```
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/png",
    "data": "iVBORw0KGgo..."
  }
}

// media_type 作为独立字段显式声明
// data 为纯 base64 字符串（不含 data URI 前缀）
```

**类型名差异：** OpenAI 用 `"image_url"`（即使传 base64 也用此类型名）， Anthropic 用 `"image"` + `source.type` 区分 `"url"` 和 `"base64"`。

**Base64 传入方式：** OpenAI 将 base64 编码为 `data:` URI 放入 `url` 字段（单字段）。 Anthropic 将 `media_type` 和 `data` 分为独立字段（结构化）。

**精度控制：** OpenAI 支持 `detail` 参数（`"low"` / `"high"` / `"auto"`）控制图片分析精度和 token 消耗。 Anthropic 无对应参数。

### 支持的图片格式

| 特性 | OpenAI | Anthropic |
| --- | --- | --- |
| 支持格式 | PNG, JPEG, GIF, WebP | PNG, JPEG, GIF, WebP |
| 传入方式 | URL 或 data URI（base64） | URL 或 base64（独立字段） |
| 精度控制 | `detail: "low"/"high"/"auto"` | — |
| PDF 支持 | 部分模型支持 | ✓ `type: "document"` + `source` |
| 多图输入 | ✓ 多个 image\_url block | ✓ 多个 image block |

## 多轮对话

CONVERSATION

### 基础多轮对话

OpenAI 第二轮请求体

```
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system",
     "content": "You are a helpful assistant."},
    {"role": "user",
     "content": "What's 2+2?"},
    {"role": "assistant",
     "content": "2 + 2 = 4."},
    {"role": "user",
     "content": "Multiply that by 3"}
  ]
}
```

Anthropic 第二轮请求体

```
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "system": "You are a helpful assistant.",
  "messages": [
    {"role": "user",
     "content": "What's 2+2?"},
    {"role": "assistant",
     "content": [{"type":"text",
       "text":"2 + 2 = 4."}]},
    {"role": "user",
     "content": "Multiply that by 3"}
  ]
}
```

### 含 Tool Use 的多轮对话（完整流程）

OpenAI — 4 条消息完成一次 Tool Use 循环

```
"messages": [
  // ① 用户提问
  {"role": "user",
   "content": "SF weather?"},

  // ② 模型决定调用工具（原样回传）
  {"role": "assistant",
   "content": null,
   "tool_calls": [{
     "id": "call_1",
     "type": "function",
     "function": {
       "name": "get_weather",
       "arguments": "{\"location\":\"SF\"}"
     }
   }]},

  // ③ 工具执行结果
  {"role": "tool",
   "tool_call_id": "call_1",
   "content": "24°C, sunny"},

  // ④ 用户继续对话
  {"role": "user",
   "content": "Will it rain tomorrow?"}
]
```

Anthropic — 3 条消息完成一次 Tool Use 循环

```
"messages": [
  // ① 用户提问
  {"role": "user",
   "content": "SF weather?"},

  // ② 模型决定调用工具（完整 content 回传）
  {"role": "assistant",
   "content": [
     {"type": "text",
      "text": "Let me check."},
     {"type": "tool_use",
      "id": "toolu_1",
      "name": "get_weather",
      "input": {"location": "SF"}}
   ]},

  // ③ 工具结果 + 用户续问（合并为一条 user 消息）
  {"role": "user",
   "content": [
     {"type": "tool_result",
      "tool_use_id": "toolu_1",
      "content": "24°C, sunny"},
     {"type": "text",
      "text": "Will it rain tomorrow?"}
   ]}
]
```

**assistant 内容回传：** OpenAI 回传 assistant 消息时，`content` 和 `tool_calls` 各为独立字段。 Anthropic 的 assistant `content` 需回传完整的 block 数组（包括 thinking / text / tool\_use 所有类型）。

**消息合并：** Anthropic 的 tool\_result 和后续 user 文本可以合并在同一条 `role: "user"` 消息中（因为 block 数组支持混合类型）。 OpenAI 的 `role: "tool"` 必须是独立消息。

### 消息排列规则

| 规则 | OpenAI | Anthropic |
| --- | --- | --- |
| 首条消息角色 | 通常 `system` 或 `user`（灵活） | 必须是 `user`（system 在顶层字段） |
| 末条消息角色 | 通常 `user`（灵活） | 必须是 `user` |
| 角色交替 | 不强制——可连续多条同角色消息 | **强制交替** ——user 和 assistant 必须严格交替 |
| 连续 user 消息 | ✓ 允许 | ✗ 不允许（需合并为一条或插入 assistant） |
| system 位置 | messages 中任意位置（通常首条） | 仅在顶层 system 字段 |

Anthropic 要求 messages 中 user 和 assistant 严格交替，这也是为什么 tool\_result 用 role: "user" 而非独立角色——保持交替规则

## 总结速查

SUMMARY

OPENAI 设计哲学

### choices[] 包裹 · 字符串优先 · 灵活宽松

Bearer token 认证，无需版本头。 响应套在 choices 数组中（支持 n \> 1 多候选）。 content 通常是纯字符串，tool\_calls 作为 message 的独立字段。 参数丰富（penalty / logprobs / seed / response\_format），允许精细控制输出分布。 消息排列灵活，支持连续同角色消息。 temperature 范围 0–2。

ANTHROPIC 设计哲学

### content blocks · 结构化优先 · 严格有序

自定义 header 认证 + 版本控制。 响应顶层 content block 数组，每个 block 有明确 type。 工具参数是已解析对象，工具结果以 user 角色回传。 System Prompt 为独立字段，max\_tokens 必填。 Thinking 有独立 block 和 budget 控制。 消息必须 user / assistant 严格交替。 temperature 范围 0–1。

## 常见问题

FAQ

### Q1 · 两套 API 的请求体可以直接互转吗？

A

不可以直接互转，需要处理多个关键差异： ① `system` 消息需从 messages 中提取为顶层字段（或反向回填）； ② `max_tokens` 在 Anthropic 中必填； ③ Tool 定义的 `"parameters"` 需改为 `"input_schema"`（反之亦然），并去除/添加 `"type":"function"` 包裹； ④ Tool 结果的 role 不同（`"tool"` vs `"user"` + `"tool_result"`）； ⑤ `tool_choice` 格式不同（字符串 vs 对象）； ⑥ 认证 header 完全不同； ⑦ Anthropic 要求消息严格交替，可能需要合并连续同角色消息。 建议编写一个请求适配层做映射。

### Q2 · Anthropic 为什么要把 system 提为独立字段？

A

Anthropic 认为 System Prompt 在语义上与对话消息不同—— 它是对模型行为的 **全局指令** ，而非对话的一部分。 独立字段可以避免 system 消息被意外修改或在多轮对话中丢失， 同时也让请求体结构更清晰：messages 只包含用户和助手的交互。 此外，独立字段支持 `cache_control` 做精细的 prompt caching 控制。

### Q3 · content blocks 相比纯字符串有什么优势？

A

content block 数组使一次响应可以包含 **多种类型的内容** ： text（文本）、thinking（推理过程）、tool\_use（工具调用）等， 每种类型都有明确的 `"type"` 标识和对应的数据结构。 这让客户端可以用标准的遍历逻辑处理混合内容， 而不需要用正则表达式从字符串中解析特殊标记（如 `<think>` 标签）。 在 Agentic 场景（交错思考 + 多次工具调用）中，结构化的优势尤其明显。

### Q4 · 流式 SSE 中如何区分 thinking 和 text 的增量？

A

**OpenAI：** 默认情况下，thinking 和 text 混在 `delta.content` 中（以 `<think>` 标签区分）， 需客户端自行检测标签边界。 如启用 `"reasoning_split": true`，thinking 增量通过 `delta.reasoning_details` 字段发送，text 通过 `delta.content`。

**Anthropic：** 每个 content block 有独立的 `content_block_start` → `content_block_delta` → `content_block_stop` 生命周期。 `content_block_start` 事件中声明 block 类型（`"thinking"` / `"text"`）， 后续 delta 分别携带 `"thinking_delta"` 或 `"text_delta"`，无需额外解析。

### Q5 · 为什么 Anthropic 的 tool 参数 (input) 已经是 JSON 对象，而 OpenAI 是字符串？

A

这反映了两家 API 的不同设计选择。OpenAI 的 `arguments` 是 **JSON 字符串** ， 历史上沿袭了早期 function calling 的设计——在流式传输中，字符串片段更容易拼接。 但这意味着客户端在非流式响应中需要多一步 `JSON.parse()`。

Anthropic 的 `input` 是 **已解析的 JSON 对象** ， 与 content block 的结构化哲学一致——所有数据都已结构化，客户端无需二次解析。 在流式模式下，Anthropic 使用 `input_json_delta`（partial JSON 字符串），客户端在 `content_block_stop` 后拿到完整的 parsed 对象。

### Q6 · Anthropic 的消息交替要求会带来什么影响？

A

Anthropic 要求 `messages` 中 user 和 assistant **严格交替** ，首尾都必须是 user。 这带来几个实际影响：

① 不能连续发送多条 user 消息——需合并为一条（用 content block 数组组合文本和 tool\_result）；
 ② 工具结果必须用 `role: "user"`——因为 tool\_result 必须跟在 assistant 之后，且下一条必须是 user；
 ③ 如果要模拟"系统消息插入对话中间"，需要放在 user 消息的 content 数组里；
 ④ 合并/拆分消息时需要注意 block 类型的兼容性。

OpenAI 没有此限制，消息排列更灵活，但也更容易出现"忘记传 system 消息"等问题。

 "Good APIs are not about being clever;
they are about being clear."

2026 · API FORMAT REFERENCE · AN CHENG
