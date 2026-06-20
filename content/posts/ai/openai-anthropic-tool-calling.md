---
title: "OpenAI 和 Anthropic 的工具调用格式"
date: '2026-06-19'
draft: false
description: "对比 OpenAI Responses / Chat Completions 与 Anthropic Messages API 的工具定义、模型请求、工具调用结果回传和多轮执行循环。"
toc: true
tags:
  - AI
  - API
  - OpenAI
  - Anthropic
  - Tool Use
---

# OpenAI 和 Anthropic 的工具调用格式

工具调用（Tool Calling / Function Calling / Tool Use）的本质是：模型不直接执行外部动作，而是在回复里生成一段结构化的“我要调用哪个工具、参数是什么”。应用代码收到后执行真实工具，再把执行结果回传给模型，让模型继续推理或生成最终答案。

这篇文章整理 OpenAI 和 Anthropic 两套 API 的工具调用长什么样，重点看请求格式、模型返回格式、工具结果回传格式，以及两者在 Agent 循环中的差异。

## 一句话对比

| 维度 | OpenAI | Anthropic |
|---|---|---|
| 主推接口 | Responses API | Messages API |
| 工具定义字段 | `tools` | `tools` |
| 工具类型 | `{"type": "function", ...}` | 工具对象直接包含 `name` / `description` / `input_schema` |
| 模型发起调用 | 输出 `function_call` item，参数在 `arguments` 字符串里 | 输出 `tool_use` content block，参数在 `input` 对象里 |
| 工具结果回传 | `function_call_output`，用 `call_id` 对齐 | `tool_result`，用 `tool_use_id` 对齐 |
| 多轮衔接 | 推荐用 `previous_response_id` 串联 Responses | 把上一轮 assistant 的 `tool_use` 和下一轮 user 的 `tool_result` 放进 `messages` |
| 旧接口兼容 | Chat Completions 使用 `tool_calls` / `tool` message | Anthropic 主要是 Messages API 内容块模型 |

## 工具调用的通用循环

无论是哪一家，应用层通常都要实现同一个循环：

1. 把用户问题、可用工具列表发给模型。
2. 模型判断是否需要工具。
3. 如果需要工具，模型返回工具名和参数。
4. 应用代码执行工具。
5. 应用把工具结果回传给模型。
6. 模型基于工具结果继续调用工具，或生成最终答案。

关键点是：工具由你的程序执行，模型只负责“选择工具”和“生成参数”。所以必须在应用层做参数校验、鉴权、权限控制、超时控制和错误处理。

## OpenAI：Responses API 工具调用

OpenAI 当前更推荐在新项目里使用 Responses API。它把一次模型输出拆成多个 output item，工具调用就是其中一种 item。

### 1. 定义工具

OpenAI 的工具定义放在 `tools` 数组里。函数工具的 `type` 是 `function`，函数名、描述和参数 Schema 放在 `name`、`description`、`parameters` 中。

```json
{
  "model": "gpt-4.1",
  "input": "上海今天适合跑步吗？",
  "tools": [
    {
      "type": "function",
      "name": "get_weather",
      "description": "查询指定城市的天气",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "城市名，例如 Shanghai"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"]
          }
        },
        "required": ["city"],
        "additionalProperties": false
      },
      "strict": true
    }
  ]
}
```

`strict: true` 表示启用更严格的结构化参数约束。实际项目里建议尽量把参数 Schema 写清楚，减少工具层收到脏参数的概率。

### 2. 模型返回工具调用

如果模型决定调用工具，Responses API 的输出里会出现 `type: "function_call"` 的 item。

```json
{
  "id": "resp_123",
  "output": [
    {
      "type": "function_call",
      "id": "fc_123",
      "call_id": "call_abc",
      "name": "get_weather",
      "arguments": "{\"city\":\"Shanghai\",\"unit\":\"celsius\"}"
    }
  ]
}
```

这里最重要的是：

- `name`：要调用的工具名。
- `arguments`：JSON 字符串，需要应用层解析。
- `call_id`：本次工具调用的标识，回传结果时要用它对齐。

### 3. 回传工具执行结果

应用执行完工具后，把结果作为 `function_call_output` 发回模型。推荐用 `previous_response_id` 接上上一轮响应。

```json
{
  "model": "gpt-4.1",
  "previous_response_id": "resp_123",
  "input": [
    {
      "type": "function_call_output",
      "call_id": "call_abc",
      "output": "{\"city\":\"Shanghai\",\"temperature\":27,\"condition\":\"cloudy\",\"aqi\":42}"
    }
  ]
}
```

模型收到工具结果后，会继续生成自然语言答案，或继续请求下一个工具。

### 4. OpenAI Chat Completions 旧格式

很多项目仍在使用 Chat Completions。它的工具调用结构与 Responses API 不同：模型消息里会出现 `tool_calls`，工具结果用 `role: "tool"` 回传。

请求示例：

```json
{
  "model": "gpt-4.1",
  "messages": [
    {
      "role": "user",
      "content": "上海今天适合跑步吗？"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "查询指定城市的天气",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"]
        }
      }
    }
  ]
}
```

模型返回：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"city\":\"Shanghai\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

工具结果回传：

```json
{
  "model": "gpt-4.1",
  "messages": [
    {
      "role": "user",
      "content": "上海今天适合跑步吗？"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_abc",
          "type": "function",
          "function": {
            "name": "get_weather",
            "arguments": "{\"city\":\"Shanghai\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_abc",
      "content": "{\"city\":\"Shanghai\",\"temperature\":27,\"condition\":\"cloudy\"}"
    }
  ]
}
```

如果是新项目，优先看 Responses API；如果维护老项目，则重点理解 `tool_calls` 和 `role: "tool"` 的配对关系。

## Anthropic：Messages API Tool Use

Anthropic 的 Claude 使用 Messages API。它的工具调用不是单独的 message role，而是放在 `content` 数组里的结构化 block。

### 1. 定义工具

Anthropic 的工具定义也放在 `tools` 数组里，但没有外层 `type: "function"`。参数 Schema 字段叫 `input_schema`。

```json
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "上海今天适合跑步吗？"
    }
  ],
  "tools": [
    {
      "name": "get_weather",
      "description": "查询指定城市的天气",
      "input_schema": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "城市名，例如 Shanghai"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"]
          }
        },
        "required": ["city"]
      }
    }
  ]
}
```

### 2. 模型返回工具调用

如果 Claude 决定调用工具，assistant 消息的 `content` 里会出现 `type: "tool_use"` 的 block。

```json
{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "我先查询一下上海的天气。"
    },
    {
      "type": "tool_use",
      "id": "toolu_abc",
      "name": "get_weather",
      "input": {
        "city": "Shanghai",
        "unit": "celsius"
      }
    }
  ],
  "stop_reason": "tool_use"
}
```

这里最重要的是：

- `name`：要调用的工具名。
- `input`：已经是 JSON 对象，不是 JSON 字符串。
- `id`：本次工具调用 ID，回传结果时用 `tool_use_id` 对齐。
- `stop_reason: "tool_use"`：说明模型停下来等待工具结果。

### 3. 回传工具执行结果

Anthropic 要求把上一轮 assistant 的 `tool_use` 保留在消息历史中，然后下一条 user message 里放 `tool_result`。

```json
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "上海今天适合跑步吗？"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "tool_use",
          "id": "toolu_abc",
          "name": "get_weather",
          "input": {
            "city": "Shanghai",
            "unit": "celsius"
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_abc",
          "content": "{\"city\":\"Shanghai\",\"temperature\":27,\"condition\":\"cloudy\",\"aqi\":42}"
        }
      ]
    }
  ]
}
```

模型收到 `tool_result` 后，继续生成最终回答，或继续返回新的 `tool_use`。

## 核心差异详解

### 1. 参数是字符串还是对象

OpenAI 的工具参数通常在 `arguments` 字段里，是 JSON 字符串：

```json
{
  "name": "get_weather",
  "arguments": "{\"city\":\"Shanghai\"}"
}
```

Anthropic 的工具参数在 `input` 字段里，是 JSON 对象：

```json
{
  "name": "get_weather",
  "input": {
    "city": "Shanghai"
  }
}
```

这会影响应用层的工具调度器。OpenAI 需要先 `JSON.parse(arguments)`；Anthropic 可以直接读取对象，但仍要做 Schema 校验。

### 2. 工具结果属于谁

OpenAI Responses API 里，工具结果是一种新的 input item：

```json
{
  "type": "function_call_output",
  "call_id": "call_abc",
  "output": "..."
}
```

Anthropic 里，工具结果是 user message 的一个 content block：

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_abc",
  "content": "..."
}
```

这不是语义上的“用户说了工具结果”，而是 Anthropic Messages API 的会话格式设计。

### 3. ID 对齐字段不同

| 场景 | OpenAI | Anthropic |
|---|---|---|
| 模型发起调用时的 ID | `call_id` | `id` |
| 回传工具结果时的 ID | `call_id` | `tool_use_id` |
| Chat Completions 旧接口 | `tool_calls[].id` / `tool_call_id` | 不适用 |

不要用工具名来匹配工具结果。一次响应里可能有多个同名工具调用，必须用调用 ID 对齐。

### 4. 多工具调用

两家都可能在一次模型响应里请求多个工具。应用层应该遍历所有工具调用，逐个执行，并把所有结果回传。

OpenAI Responses API 可能返回多个 `function_call` item：

```json
{
  "output": [
    {
      "type": "function_call",
      "call_id": "call_weather",
      "name": "get_weather",
      "arguments": "{\"city\":\"Shanghai\"}"
    },
    {
      "type": "function_call",
      "call_id": "call_route",
      "name": "get_running_route",
      "arguments": "{\"city\":\"Shanghai\",\"distance_km\":5}"
    }
  ]
}
```

Anthropic 可能返回多个 `tool_use` block：

```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_weather",
      "name": "get_weather",
      "input": { "city": "Shanghai" }
    },
    {
      "type": "tool_use",
      "id": "toolu_route",
      "name": "get_running_route",
      "input": { "city": "Shanghai", "distance_km": 5 }
    }
  ]
}
```

实际工程里可以选择串行执行，也可以对互不依赖的工具并发执行。

## 应用层调度器伪代码

### OpenAI Responses API

```python
response = client.responses.create(
    model="gpt-4.1",
    input=user_input,
    tools=tools,
)

while True:
    calls = [item for item in response.output if item.type == "function_call"]
    if not calls:
        break

    tool_outputs = []
    for call in calls:
        args = json.loads(call.arguments)
        result = run_tool(call.name, args)
        tool_outputs.append({
            "type": "function_call_output",
            "call_id": call.call_id,
            "output": json.dumps(result, ensure_ascii=False),
        })

    response = client.responses.create(
        model="gpt-4.1",
        previous_response_id=response.id,
        input=tool_outputs,
        tools=tools,
    )

print(response.output_text)
```

### Anthropic Messages API

```python
messages = [
    {"role": "user", "content": user_input}
]

response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=messages,
    tools=tools,
)

while response.stop_reason == "tool_use":
    messages.append({
        "role": "assistant",
        "content": response.content,
    })

    tool_results = []
    for block in response.content:
        if block.type != "tool_use":
            continue
        result = run_tool(block.name, block.input)
        tool_results.append({
            "type": "tool_result",
            "tool_use_id": block.id,
            "content": json.dumps(result, ensure_ascii=False),
        })

    messages.append({
        "role": "user",
        "content": tool_results,
    })

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=messages,
        tools=tools,
    )
```

## 工程实践建议

### 工具定义要稳定

工具名、参数名、枚举值一旦进入生产，尽量不要频繁改。模型依赖这些名字理解工具含义，应用层也依赖这些名字做路由。

### Schema 不等于安全边界

Schema 能提升参数质量，但不能代替后端校验。真正执行前仍要检查：

- 用户是否有权限调用该工具。
- 参数是否在允许范围内。
- 是否会造成高成本操作。
- 是否需要二次确认。
- 工具是否超时或失败。

### 工具结果要简洁

不要把数据库整行、网页全文、日志全集都塞回模型。工具结果越长，成本越高，也越容易稀释关键信息。建议回传结构化摘要，并保留必要字段。

### 错误也要结构化

工具失败时，不要只返回 `"failed"`。更好的格式是：

```json
{
  "ok": false,
  "error_code": "WEATHER_TIMEOUT",
  "message": "天气服务超时",
  "retryable": true
}
```

这样模型更容易决定是重试、换工具，还是向用户解释失败原因。

## 最小心智模型

可以把两家的工具调用记成下面这样：

```text
OpenAI Responses:
model -> function_call(name, arguments, call_id)
app   -> function_call_output(call_id, output)

OpenAI Chat Completions:
model -> assistant.tool_calls[]
app   -> tool message(tool_call_id, content)

Anthropic Messages:
model -> assistant.content[].tool_use(id, name, input)
app   -> user.content[].tool_result(tool_use_id, content)
```

如果你只记一个差异：OpenAI 更像“response item 流”，Anthropic 更像“message content block 流”。理解这一点后，多轮工具调用、并行工具调用、错误回传和 Agent 循环都会顺很多。

## 参考资料

- [OpenAI Function calling guide](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Responses API reference](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI Chat Completions API reference](https://platform.openai.com/docs/api-reference/chat)
- [Anthropic Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)
- [Anthropic Implement tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- [Anthropic Messages API reference](https://docs.anthropic.com/en/api/messages)
