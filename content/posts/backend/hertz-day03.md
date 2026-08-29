---
title: "Day 03 · Hertz RequestContext 与请求数据读取"
date: '2026-06-21'
draft: false
description: "Hertz HTTP 框架 30 天系统学习路线 Day 03：系统学习 RequestContext，读取路径参数、Query、Header、Cookie、Form、Body、ClientIP 和上下文元数据，完成 /debug/echo 请求回显工作台。"
toc: true
tags:
  - Backend
  - Go
  - Hertz
  - CloudWeGo
  - Day 03
---

Hertz Roadmap · Day 03

# Hertz RequestContext 与请求数据读取

Day 03 的任务是把 Hertz handler 里的第二个参数 `*app.RequestContext` 拆开。你会手动读取路径参数、Query、Header、Cookie、Form、Body、ClientIP 和上下文元数据，做一个 `/debug/echo` 请求回显工作台。今天先手动读数据，Day06 再进入结构体绑定与校验。

建议时长：2.5 小时难度：入门进阶前置：Day02 路由分组产物：请求回显工作台 + 读取矩阵

### 今天要掌握

- 能解释 `context.Context` 和 `*app.RequestContext` 的职责差异。
- 能读取 `Param`、`Query`、`Header`、`Cookie`、`PostForm` 和原始 Body。
- 能使用 `QueryArgs`、`PostArgs` 遍历多值参数。
- 知道 `RequestContext` 请求结束后会被回收，异步使用要小心。

### 一句话心智模型

`RequestContext` 是 Hertz 对一次 HTTP 请求和响应的操作台：它既能读请求数据，也能写响应、管理 handler 链和存放本次请求范围内的元数据。

## 时间安排

今天建议边写边 curl。读请求数据这类 API，记住一百遍不如打一次请求。

00:00-00:25

### 复盘 handler 签名

理解 `func(ctx context.Context, c *app.RequestContext)`，区分标准库上下文和 Hertz 请求上下文。

00:25-01:00

### 读取路径与 Query

练习 `Path`、`FullPath`、`Param`、`Query`、`DefaultQuery`、`GetQuery` 和 `QueryArgs`。

01:00-01:35

### 读取 Header 与 Cookie

练习 `GetHeader`、`UserAgent`、`ContentType`、`Cookie` 和 `ClientIP`。

01:35-02:10

### 读取 Form 与 Body

练习 `PostForm`、`DefaultPostForm`、`PostArgs`、`FormValue` 和 `c.Request.Body()`。

02:10-02:30

### 整理读取矩阵

把每类请求数据的来源、API、返回值和注意事项写进 `notes/day03.md`。

## 核心概念

这三个概念想清楚，后面写中间件和绑定校验就不会乱。

Context
### 两个上下文

`context.Context` 更偏取消、超时和链路传播；`*app.RequestContext` 更偏 HTTP 请求响应操作。不要把二者混成一个东西。

Request
### 请求数据来源

路径参数来自路由匹配，Query 来自 URL，Header/Cookie 来自请求头，Form/Body 来自请求体。来源不同，读取 API 也不同。

Lifecycle
### 生命周期边界

官方文档提示 `RequestContext` 会在请求结束后被回收。需要异步使用请求数据时，要复制需要的值，不要把整个 `RequestContext` 扔进 goroutine。

## 读取矩阵

先按这张表建立检索路径。Day06 会把这些手动读取升级为结构体绑定。

| 数据来源 | 常用 API | 返回特征 | 注意事项 |
| --- | --- | --- | --- |
| 路径参数 | `c.Param("id")` | 字符串；不存在返回空字符串。 | 只对 `:id`、`*path` 这类路由参数有效。 |
| Query | `Query`、`DefaultQuery`、`GetQuery`、`QueryArgs` | 可以区分不存在和存在但为空。 | `GetQuery` 返回 `(string, bool)`，很适合判断参数是否出现。 |
| Header | `GetHeader`、`UserAgent`、`ContentType` | 多为 `[]byte`，展示时转成 string。 | 业务里要统一大小写、默认值和缺失行为。 |
| Cookie | `Cookie` | `[]byte`；不存在通常为 nil。 | 读取 Cookie 和设置 Cookie 是两件事，设置响应 Cookie 留到响应与认证章节。 |
| Form | `PostForm`、`DefaultPostForm`、`PostArgs`、`FormValue` | 支持 `application/x-www-form-urlencoded` 和 multipart form。 | `FormValue` 会按 Query、PostArgs、MultipartForm 顺序取值。 |
| Body | `c.Request.Body()` | `[]byte`。 | 今天只读小 body。大 body、流式读取和文件上传后面单独学。 |

## 实验：请求回显工作台

在 Day02 的项目基础上替换 `main.go`。这份代码会把请求里的关键数据统一回显出来。

1
### 准备项目

```
cp -R hertz-day02 hertz-day03
cd hertz-day03
```

2
### 替换 main.go

代码包含三个核心接口：路径与 Query 回显、Form 回显、全量 Debug 回显。

```
package main

import (
    "context"

    "github.com/cloudwego/hertz/pkg/app"
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/cloudwego/hertz/pkg/common/utils"
    "github.com/cloudwego/hertz/pkg/protocol"
    "github.com/cloudwego/hertz/pkg/protocol/consts"
)

func main() {
    h := server.Default(server.WithHostPorts(":8888"))

    h.GET("/ping", func(ctx context.Context, c *app.RequestContext) {
        c.JSON(consts.StatusOK, utils.H{"message": "pong", "day": "day03"})
    })

    api := h.Group("/api/v1")
    {
        api.GET("/users/:id", echoPathAndQuery)
        api.POST("/forms", echoForm)
        api.POST("/raw", echoRawBody)
    }

    h.GET("/debug/echo/*rest", echoEverything)
    h.GET("/debug/meta", echoMeta)

    h.Spin()
}

func echoPathAndQuery(ctx context.Context, c *app.RequestContext) {
    name, hasName := c.GetQuery("name")
    empty, hasEmpty := c.GetQuery("empty")

    c.JSON(consts.StatusOK, utils.H{
        "path": string(c.Path()),
        "full_path": c.FullPath(),
        "id": c.Param("id"),
        "name": name,
        "has_name": hasName,
        "empty": empty,
        "has_empty": hasEmpty,
        "page": c.DefaultQuery("page", "1"),
        "raw_query_map": argsToMap(c.QueryArgs()),
    })
}

func echoForm(ctx context.Context, c *app.RequestContext) {
    c.JSON(consts.StatusOK, utils.H{
        "content_type": string(c.ContentType()),
        "name": c.PostForm("name"),
        "role": c.DefaultPostForm("role", "guest"),
        "form_value_name": string(c.FormValue("name")),
        "post_args": argsToMap(c.PostArgs()),
        "body": string(c.Request.Body()),
    })
}

func echoRawBody(ctx context.Context, c *app.RequestContext) {
    c.JSON(consts.StatusOK, utils.H{
        "content_type": string(c.ContentType()),
        "body": string(c.Request.Body()),
        "body_bytes": len(c.Request.Body()),
    })
}

func echoEverything(ctx context.Context, c *app.RequestContext) {
    c.JSON(consts.StatusOK, utils.H{
        "method": string(c.Request.Header.Method()),
        "request_uri": string(c.Request.Header.RequestURI()),
        "path": string(c.Path()),
        "full_path": c.FullPath(),
        "wildcard_rest": c.Param("rest"),
        "query_args": argsToMap(c.QueryArgs()),
        "user_agent": string(c.UserAgent()),
        "content_type": string(c.ContentType()),
        "x_request_id": string(c.GetHeader("X-Request-ID")),
        "session_id": string(c.Cookie("session_id")),
        "client_ip": c.ClientIP(),
    })
}

func echoMeta(ctx context.Context, c *app.RequestContext) {
    c.Set("trace_id", "day03-local-trace")
    traceID, exists := c.Get("trace_id")

    c.JSON(consts.StatusOK, utils.H{
        "trace_id": traceID,
        "exists": exists,
    })
}

func argsToMap(args *protocol.Args) map[string][]string {
    out := make(map[string][]string)
    args.VisitAll(func(key, value []byte) {
        k := string(key)
        out[k] = append(out[k], string(value))
    })
    return out
}
```

3
### 启动服务

```
go mod tidy
go run .
```

4
### 验证请求读取

另开一个终端，按数据来源逐条验证。

```
curl -i 'http://127.0.0.1:8888/api/v1/users/42?name=tom&empty=&tag=go&tag=hertz'

curl -i \
  -H 'X-Request-ID: req-day03-001' \
  -H 'User-Agent: HertzDay03Client/1.0' \
  -b 'session_id=sess_123' \
  'http://127.0.0.1:8888/debug/echo/docs/day03?debug=true'

curl -i \
  -X POST 'http://127.0.0.1:8888/api/v1/forms?name=query-name' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'name=form-name&role=admin&tag=go&tag=hertz'

curl -i \
  -X POST 'http://127.0.0.1:8888/api/v1/raw' \
  -H 'Content-Type: application/json' \
  -d '{"name":"tom","skill":"hertz"}'

curl -i 'http://127.0.0.1:8888/debug/meta'
```

### 验收标准

能在 JSON 响应里看到路径参数 `id=42`、多值 Query `tag=[go,hertz]`、自定义 Header、Cookie、Form 字段、原始 JSON Body 和 `trace_id` 元数据。

## 容易踩的坑

这些坑不复杂，但很常见，早点建立直觉能省很多调试时间。

### Query、Form、Body 不要混读成一团

Query 来自 URL，Form 来自特定 Content-Type 的请求体，原始 Body 是未结构化字节。业务代码里最好先确定接口契约，再决定读取哪一种来源。

### 不要跨请求长期持有 RequestContext

官方文档说明 `RequestContext` 在请求结束后会被回收。需要异步处理时，把 `id`、`trace_id`、用户信息等值复制出来。

## 学习笔记模板

建议保存为 `notes/day03.md`。今天的笔记重点是“来源 - API - 返回值 - curl 证据”。

```
# Day 03 · RequestContext 与请求数据读取

## 1. 两个上下文
- context.Context:
- *app.RequestContext:

## 2. 路径与 Query
- Param:
- Query:
- DefaultQuery:
- GetQuery:
- QueryArgs:

## 3. Header 与 Cookie
- GetHeader:
- UserAgent:
- ContentType:
- Cookie:
- ClientIP:

## 4. Form 与 Body
- PostForm:
- DefaultPostForm:
- PostArgs:
- FormValue:
- c.Request.Body():

## 5. 元数据
- Set:
- Get:
- 生命周期注意事项:

## 6. curl 验证结果
- 路径参数:
- Query 多值:
- Header:
- Cookie:
- Form:
- Raw Body:

## 7. 明天想重点搞懂
- 响应状态码:
- JSON / String / Data:
- Header / Cookie / Redirect:
```

## Day 03 检查清单

全部勾上后，再进入 Day04 的响应写入与渲染。

### 路径与 Query

- 能用 `c.Param` 读取路径参数。
- 能区分 `Query`、`DefaultQuery`、`GetQuery`。
- 能用 `QueryArgs` 读取多值 Query。

### 请求头

- 能读取自定义 Header。
- 能读取 User-Agent 和 Content-Type。
- 能读取 Cookie 与 ClientIP。

### 请求体

- 能读取 urlencoded Form。
- 能读取原始 JSON Body。
- 知道文件上传和流式读取后面单独处理。

### 输出

- 完成 `notes/day03.md`。
- 保存 5 条 curl 验证结果。
- 整理一张请求数据读取矩阵。

## 参考资料

今天重点读 RequestContext 的 Request 部分，Response 留到 Day04。

- [Hertz Request](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/context/request/)：Path、Param、Query、Header、Cookie、PostForm、FormFile、RequestContext Metadata Store、ClientIP。
- [Hertz Response](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/context/response/)：Day04 会深入响应写入与渲染。
- [Binding and validate](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/binding-and-validate/)：Day06 会把手动读取升级为绑定校验。
- [pkg.go.dev protocol](https://pkg.go.dev/github.com/cloudwego/hertz/pkg/protocol)：查看 `protocol.Request.Body()` 和 `protocol.Args` API。

资料核对时间：2026-06-21。官方 Request 文档当前说明了 `FullPath`、`Path`、`Param`、`Query`、`DefaultQuery`、`GetQuery`、`QueryArgs`、Header、Cookie、PostForm、PostArgs、FormValue、metadata store 和 `ClientIP` 等 API。
