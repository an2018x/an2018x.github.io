---
title: "Day 04 · Hertz 响应写入、渲染与统一返回结构"
date: '2026-06-21'
draft: false
description: "Hertz HTTP 框架 30 天系统学习路线 Day 04：系统学习响应状态码、Header、Cookie、Redirect、JSON/PureJSON/IndentedJSON/String/Data/XML 渲染、Write/WriteString、AbortWithStatusJSON 和统一响应结构。"
toc: true
tags:
  - Backend
  - Go
  - Hertz
  - CloudWeGo
  - Day 04
---

Hertz Roadmap · Day 04

# Hertz 响应写入、渲染与统一返回结构

Day 04 关注请求链路的另一半：如何把结果写回客户端。你会练习状态码、Header、Cookie、Redirect、JSON/PureJSON/IndentedJSON/String/Data/XML 渲染、Write/WriteString 和 `AbortWithStatusJSON`，并沉淀一个最小统一响应结构。

建议时长：2.5 小时难度：入门进阶前置：Day03 RequestContext产物：响应工作台 + 统一返回结构

### 今天要掌握

- 能区分 `Status`、`JSON`、`String`、`Data`、`Write` 的职责。
- 能设置响应 Header、Content-Type、Cookie 和 Redirect。
- 能解释 `JSON`、`PureJSON`、`IndentedJSON` 的差异。
- 能设计最小统一响应结构和错误响应结构。

### 一句话心智模型

响应不是“把对象返回出去”这么简单，而是状态码、响应头、响应体和缓存/跳转语义的组合。Hertz 的 `RequestContext` 同时提供了低层写入和高层渲染两条路径。

## 时间安排

今天建议用 `curl -i` 看响应头，别只看响应体。

00:00-00:25

### 状态码和响应头

练习 `Status`、`SetStatusCode`、`Header`、`SetContentType` 和 `NotModified`。

00:25-01:05

### 渲染方式

练习 `JSON`、`PureJSON`、`IndentedJSON`、`String`、`Data` 和 `XML`。

01:05-01:35

### Cookie 与 Redirect

练习 `SetCookie` 和 `Redirect`，观察 `Set-Cookie` 与 `Location` 响应头。

01:35-02:05

### 统一返回结构

设计 `APIResponse` 和 `ErrorResponse`，开始为后续错误处理和业务接口打底。

02:05-02:30

### curl 验证与笔记

记录每个接口的状态码、Content-Type、关键 Header 和响应体。

## 核心概念

这三个概念决定了接口是否容易被前端、网关、监控和调用方理解。

Status
### 状态码是协议语义

成功、创建、无内容、未命中、参数错误、未授权、服务错误都应该通过 HTTP 状态码表达，不要只把一切塞进 JSON 的 `code` 字段。

Render
### 渲染负责响应体格式

`JSON`、`String`、`Data`、`XML` 是不同内容类型的输出方式。内容类型要和响应体真实格式一致。

Contract
### 统一结构是接口契约

业务 API 最好形成稳定结构，例如 `{code,message,data,request_id}`。这样调用方处理成功和失败时都有明确规则。

## 响应矩阵

这张表是 Day04 的速查表。今天每一行都至少跑一次。

| 能力 | 常用 API | 适用场景 | 观察点 |
| --- | --- | --- | --- |
| 状态码 | `Status`、`SetStatusCode`、`NotFound`、`NotModified` | 表达请求处理结果。 | `curl -i` 第一行状态码。 |
| 响应头 | `Header`、`SetContentType` | 传递 request id、缓存策略、内容类型。 | `X-Request-ID`、`Content-Type`。 |
| 结构化 JSON | `JSON`、`PureJSON`、`IndentedJSON` | 大多数业务 API。 | HTML 字符是否转义，是否格式化输出。 |
| 文本与字节 | `String`、`Data`、`Write`、`WriteString` | 纯文本、CSV、二进制、小型原始输出。 | Content-Type 是否准确。 |
| Cookie / Redirect | `SetCookie`、`Redirect` | 登录态、跳转、兼容浏览器流程。 | `Set-Cookie`、`Location`。 |
| 中断响应 | `AbortWithStatus`、`AbortWithStatusJSON`、`AbortWithMsg` | 鉴权失败、限流、前置校验失败。 | 后续 handler 是否停止执行。 |

## 实验：响应工作台

在 Day03 项目的基础上替换 `main.go`。这份代码尽量覆盖高频响应方式。

1
### 准备项目

```
cp -R hertz-day03 hertz-day04
cd hertz-day04
```

2
### 替换 main.go

代码包含渲染方式、响应头、Cookie、Redirect、304、手动写 body 和统一错误响应。

```
package main

import (
    "context"
    "encoding/xml"

    "github.com/cloudwego/hertz/pkg/app"
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/cloudwego/hertz/pkg/common/utils"
    "github.com/cloudwego/hertz/pkg/protocol"
    "github.com/cloudwego/hertz/pkg/protocol/consts"
)

type APIResponse struct {
    Code int `json:"code"`
    Message string `json:"message"`
    Data interface{} `json:"data,omitempty"`
    RequestID string `json:"request_id,omitempty"`
}

type ErrorResponse struct {
    Code int `json:"code"`
    Message string `json:"message"`
    Detail string `json:"detail,omitempty"`
    RequestID string `json:"request_id,omitempty"`
}

type ArticleXML struct {
    XMLName xml.Name `xml:"article"`
    ID string `xml:"id"`
    Title string `xml:"title"`
}

func main() {
    h := server.Default(server.WithHostPorts(":8888"))

    v1 := h.Group("/api/v1")
    {
        v1.GET("/render/json", renderJSON)
        v1.GET("/render/pure-json", renderPureJSON)
        v1.GET("/render/pretty-json", renderIndentedJSON)
        v1.GET("/render/text", renderText)
        v1.GET("/render/data", renderData)
        v1.GET("/render/xml", renderXML)
        v1.GET("/render/write", renderWrite)
        v1.GET("/headers", renderHeaders)
        v1.GET("/cookie", renderCookie)
        v1.GET("/redirect", renderRedirect)
        v1.GET("/status/not-modified", renderNotModified)
        v1.GET("/errors/not-found", renderNotFound)
        v1.GET("/errors/abort", renderAbort)
    }

    h.Spin()
}

func requestID(c *app.RequestContext) string {
    rid := string(c.GetHeader("X-Request-ID"))
    if rid == "" {
        return "req-day04-local"
    }
    return rid
}

func ok(c *app.RequestContext, data interface{}) {
    c.Header("X-Request-ID", requestID(c))
    c.JSON(consts.StatusOK, APIResponse{
        Code: 0,
        Message: "ok",
        Data: data,
        RequestID: requestID(c),
    })
}

func fail(c *app.RequestContext, status int, code int, message string, detail string) {
    c.Header("X-Request-ID", requestID(c))
    c.JSON(status, ErrorResponse{
        Code: code,
        Message: message,
        Detail: detail,
        RequestID: requestID(c),
    })
}

func renderJSON(ctx context.Context, c *app.RequestContext) {
    ok(c, utils.H{"framework": "hertz", "day": 4})
}

func renderPureJSON(ctx context.Context, c *app.RequestContext) {
    c.PureJSON(consts.StatusOK, utils.H{"html": "Hertz"})
}

func renderIndentedJSON(ctx context.Context, c *app.RequestContext) {
    c.IndentedJSON(consts.StatusOK, APIResponse{
        Code: 0,
        Message: "ok",
        Data: utils.H{"format": "pretty"},
    })
}

func renderText(ctx context.Context, c *app.RequestContext) {
    c.String(consts.StatusOK, "hello %s", "hertz")
}

func renderData(ctx context.Context, c *app.RequestContext) {
    c.Data(consts.StatusOK, "text/csv; charset=utf-8", []byte("id,name\n1,hertz\n"))
}

func renderXML(ctx context.Context, c *app.RequestContext) {
    c.XML(consts.StatusOK, ArticleXML{ID: "1", Title: "Hertz Day04"})
}

func renderWrite(ctx context.Context, c *app.RequestContext) {
    c.SetContentType("text/plain; charset=utf-8")
    c.Status(consts.StatusOK)
    c.WriteString("hello ")
    c.Write([]byte("hertz"))
}

func renderHeaders(ctx context.Context, c *app.RequestContext) {
    c.Header("X-Request-ID", requestID(c))
    c.Header("Cache-Control", "no-store")
    c.Header("X-Learning-Day", "04")
    ok(c, utils.H{"headers": "set"})
}

func renderCookie(ctx context.Context, c *app.RequestContext) {
    c.SetCookie("session_id", "sess_day04", 3600, "/", "localhost", protocol.CookieSameSiteLaxMode, false, true)
    ok(c, utils.H{"cookie": "session_id"})
}

func renderRedirect(ctx context.Context, c *app.RequestContext) {
    c.Redirect(consts.StatusFound, []byte("/api/v1/render/text"))
}

func renderNotModified(ctx context.Context, c *app.RequestContext) {
    c.NotModified()
}

func renderNotFound(ctx context.Context, c *app.RequestContext) {
    fail(c, consts.StatusNotFound, 40401, "article not found", "id=missing")
}

func renderAbort(ctx context.Context, c *app.RequestContext) {
    c.Header("X-Request-ID", requestID(c))
    c.AbortWithStatusJSON(consts.StatusUnauthorized, ErrorResponse{
        Code: 40101,
        Message: "unauthorized",
        Detail: "missing token",
        RequestID: requestID(c),
    })
}
```

3
### 启动服务

```
go mod tidy
go run .
```

4
### 验证响应

用 `-i` 看响应头，用 `-L` 跟随跳转。

```
curl -i -H 'X-Request-ID: req-001' http://127.0.0.1:8888/api/v1/render/json
curl -i http://127.0.0.1:8888/api/v1/render/pure-json
curl -i http://127.0.0.1:8888/api/v1/render/pretty-json
curl -i http://127.0.0.1:8888/api/v1/render/text
curl -i http://127.0.0.1:8888/api/v1/render/data
curl -i http://127.0.0.1:8888/api/v1/render/xml
curl -i http://127.0.0.1:8888/api/v1/render/write
curl -i -H 'X-Request-ID: req-headers' http://127.0.0.1:8888/api/v1/headers
curl -i http://127.0.0.1:8888/api/v1/cookie
curl -i http://127.0.0.1:8888/api/v1/redirect
curl -i -L http://127.0.0.1:8888/api/v1/redirect
curl -i http://127.0.0.1:8888/api/v1/status/not-modified
curl -i http://127.0.0.1:8888/api/v1/errors/not-found
curl -i http://127.0.0.1:8888/api/v1/errors/abort
```

### 验收标准

能观察到 JSON 统一结构、PureJSON 保留 HTML 字符、IndentedJSON 格式化输出、CSV 的 Content-Type、XML 响应、`Set-Cookie`、`Location`、304 空响应体、404/401 错误结构。

## 容易踩的坑

响应层的问题通常不是语法问题，而是契约和语义问题。

### 不要所有情况都返回 200

业务错误可以有业务 code，但 HTTP 状态码仍然应该表达协议层结果。调用方、网关、监控和重试策略都依赖状态码。

### Content-Type 要和响应体一致

`Data` 需要自己设置 Content-Type。返回 CSV、纯文本、二进制时尤其要明确，避免调用方误解析。

## 学习笔记模板

建议保存为 `notes/day04.md`。今天重点记录状态码、Header、Content-Type 和响应体。

```
# Day 04 · 响应写入、渲染与统一返回结构

## 1. 状态码
- 200:
- 302:
- 304:
- 401:
- 404:

## 2. Header / Cookie / Redirect
- Header:
- SetContentType:
- SetCookie:
- Redirect:

## 3. 渲染方式
- JSON:
- PureJSON:
- IndentedJSON:
- String:
- Data:
- XML:
- Write / WriteString:

## 4. 统一响应结构
- APIResponse:
- ErrorResponse:
- request_id:

## 5. curl 验证结果
- Content-Type:
- X-Request-ID:
- Set-Cookie:
- Location:
- 错误响应:

## 6. 明天想重点搞懂
- 参数绑定:
- 结构体 tag:
- validator 校验:
```

## Day 04 检查清单

全部勾上后，再进入 Day05/Day06 的绑定与校验学习。

### 状态与头

- 能设置状态码和响应头。
- 能观察 Content-Type、Set-Cookie、Location。
- 能解释 304 为什么通常没有响应体。

### 渲染

- 能使用 JSON、PureJSON、IndentedJSON。
- 能使用 String、Data、XML。
- 知道 Data 需要手动指定 Content-Type。

### 错误响应

- 能返回统一错误结构。
- 能用 `AbortWithStatusJSON` 中断请求链。
- 知道 HTTP status 和业务 code 应该同时存在。

### 输出

- 完成 `notes/day04.md`。
- 保存 14 条 curl 验证结果。
- 沉淀自己的 `APIResponse` 结构。

## 参考资料

今天重点读 Response 和 Render。HTML 模板、文件响应、流式响应后续再展开。

- [Hertz Response](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/context/response/)：Header、状态码、Redirect、SetCookie、Abort、Body、File、Flush 等响应 API。
- [Hertz Render](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/render/)：JSON、PureJSON、IndentedJSON、Data、HTML、Protobuf、Text、XML 和自定义 Render。
- [Binding and validate](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/binding-and-validate/)：后续会把请求输入结构化，再配合今天的统一输出结构。

资料核对时间：2026-06-21。官方 Response 文档列出 `SetContentType`、`Status`、`Redirect`、`Header`、`SetCookie`、`AbortWithStatusJSON`、`Write`、`WriteString` 等 API；Render 文档说明 Hertz 支持 JSON、HTML、Protobuf、Data、Text、XML 和自定义渲染。
