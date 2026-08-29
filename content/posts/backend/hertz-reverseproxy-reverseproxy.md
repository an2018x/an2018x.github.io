---
title: "Hertz reverseproxy.ReverseProxy 结构与使用说明"
date: '2026-06-21'
draft: false
description: "系统介绍 hertz-contrib/reverseproxy 中 rp *reverseproxy.ReverseProxy 的含义、字段、ServeHTTP 转发流程、SetDirector、SetModifyResponse、SetErrorHandler、SetClient、ClientBehavior 和常见使用方式。"
toc: true
tags:
  - Backend
  - Go
  - Hertz
  - ReverseProxy
  - CloudWeGo
---

Hertz Contrib · Reverse Proxy

# rp \*reverseproxy.ReverseProxy 是什么

在 Hertz 项目里看到 `rp *reverseproxy.ReverseProxy`，通常表示“一个可挂到 Hertz 路由上的反向代理处理器”。它来自社区扩展包 `github.com/hertz-contrib/reverseproxy`，核心职责是接收当前 Hertz 请求，按规则改写为后端请求，用 Hertz Client 发给目标服务，再把后端响应写回原始客户端。

包：github.com/hertz-contrib/reverseproxy版本核对：v1.0.6核心类型：\*ReverseProxy入口方法：ServeHTTP

### 一句话解释

`rp` 是一个代理对象；`rp.ServeHTTP` 是一个符合 Hertz handler 形态的方法；把它注册到路由上后，请求命中该路由就会被转发到 `rp.Target` 指向的后端服务。

### 最小用法

```
rp, err := reverseproxy.NewSingleHostReverseProxy("http://localhost:8082")
if err != nil {
    panic(err)
}

h.Any("/api/proxy/*path", rp.ServeHTTP)
```

## 类型结构

源码里只有 `Target` 是导出字段，其它字段都通过 Set 方法配置。

```
type ReverseProxy struct {
    client *client.Client

    clientBehavior clientBehavior

    // target is set as a reverse proxy address
    Target string

    transferTrailer bool
    saveOriginResHeader bool

    director func(*protocol.Request)
    modifyResponse func(*protocol.Response) error
    errorHandler func(*app.RequestContext, error)
}
```

## 三个核心钩子

理解这三个钩子，就基本理解了 `ReverseProxy` 的可定制点。

Request
### SetDirector

在发往后端之前修改 `protocol.Request`，常用于重写 URI、Host、请求头、服务发现开关、租户标识和鉴权透传。

Response
### SetModifyResponse

后端有响应时修改 `protocol.Response`，常用于加响应头、改状态码、过滤敏感 Header、统一错误结构。

Error
### SetErrorHandler

后端不可达或 `ModifyResponse` 返回错误时兜底。默认行为是记录错误并返回 `502 Bad Gateway`。

## 字段与配置

这些配置通常在服务启动时设置一次，然后复用同一个 `rp`。

| 成员 / 方法 | 作用 | 典型场景 |
| --- | --- | --- |
| `Target string` | 目标服务地址，`NewSingleHostReverseProxy` 会基于它拼接后端 URL。 | `http://user-service`、`http://localhost:8082/base`。 |
| `SetClient` | 注入自定义 Hertz `client.Client`。 | 共享连接池、配置 TLS Dialer、接入服务发现、统一超时。 |
| `SetClientBehavior` | 指定 client 调用方式：普通 Do、超时、deadline、跟随重定向。 | `ClientDoTimeout`、`ClientDoDeadline`、`ClientDoRedirects`。 |
| `SetTransferTrailer` | 控制是否转发 Trailer 相关 Header。 | 需要 HTTP Trailer 的流式响应或特殊协议场景。 |
| `SetSaveOriginResHeader` | 是否保留代理前 Hertz 响应里已有的 Header。 | 路由中间件已经设置了响应头，希望代理后仍保留。 |

## ServeHTTP 流程

这是源码层面的主线，理解它能帮助你定位代理问题。

### 取当前请求和响应对象

从 `*app.RequestContext` 里取出 `ctx.Request` 和 `ctx.Response`，后续直接在这两个对象上改写。

### 执行 director

如果配置了 `director`，先调用它改写后端请求。默认构造函数会设置 URI，并把 Host 改成目标地址的 Host。

### 清理 hop-by-hop Header

清理 `Connection`、`Proxy-Connection`、`Keep-Alive`、`Transfer-Encoding`、`Upgrade` 等不应该端到端透传的 Header。

### 补充 X-Forwarded-For

根据客户端远端地址追加 `X-Forwarded-For`，保留代理链路上的来源 IP 信息。

### 使用 Hertz Client 请求后端

根据 `clientBehavior` 调用 `Do`、`DoTimeout`、`DoDeadline` 或 `DoRedirects`。

### 处理后端响应

清理响应里的 hop-by-hop Header；如果设置了 `modifyResponse`，再给你一次修改响应的机会。

### 错误兜底

如果后端请求失败，或 `modifyResponse` 返回错误，会走 `errorHandler`；没配置时默认返回 502。

## 完整示例

下面展示一个常见网关代理写法：带超时、请求头透传、响应头注入和错误兜底。

```
package main

import (
    "context"
    "time"

    "github.com/cloudwego/hertz/pkg/app"
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/cloudwego/hertz/pkg/protocol"
    "github.com/cloudwego/hertz/pkg/protocol/consts"
    "github.com/hertz-contrib/reverseproxy"
)

func main() {
    h := server.Default(server.WithHostPorts(":8888"))

    rp, err := reverseproxy.NewSingleHostReverseProxy("http://localhost:8082")
    if err != nil {
        panic(err)
    }

    rp.SetClientBehavior(reverseproxy.ClientDoTimeout(1500 * time.Millisecond))

    rp.SetDirector(func(req *protocol.Request) {
        req.SetRequestURI(string(reverseproxy.JoinURLPath(req, rp.Target)))
        req.Header.SetHostBytes(req.URI().Host())
        req.Header.Set("X-Gateway", "hertz")
        req.Header.Set("X-Forwarded-Proto", "http")
    })

    rp.SetModifyResponse(func(res *protocol.Response) error {
        res.Header.Set("X-Proxied-By", "hertz-reverseproxy")
        return nil
    })

    rp.SetErrorHandler(func(c *app.RequestContext, err error) {
        c.JSON(consts.StatusBadGateway, map[string]interface{}{
            "code": 50201,
            "message": "upstream unavailable",
            "detail": err.Error(),
        })
    })

    h.Any("/proxy/*path", rp.ServeHTTP)
    h.Spin()
}
```

## 常见问题

代理问题多数出在路径、Host、超时、Header 和错误处理。

### NewSingleHostReverseProxy 默认不等于 net/http 的全部行为

它会基于 `Target` 拼接 URL，并设置 Host 为目标 URI 的 Host。需要更复杂的 Host 策略、服务发现、租户路由时，请使用 `SetDirector` 明确改写。

### director 里不要持有 Request 指针异步使用

源码注释说明 director 返回后不应继续访问传入的 `*protocol.Request`。需要异步记录时，把必要字段复制出来。

### WebSocket 代理是另一个类型

普通 HTTP 代理用 `ReverseProxy`；WebSocket 代理使用 `NewWSReverseProxy` 返回的 `WSReverseProxy`。

## 调试清单

遇到代理不通时，可以按这个顺序查。

| 检查点 | 怎么查 | 常见原因 |
| --- | --- | --- |
| 后端 URL | 打印 `req.URI().String()` 或在后端记录请求路径。 | `Target` base path 和代理路由 path 拼接不符合预期。 |
| Host | 后端打印 Host，或在 `SetDirector` 中显式设置。 | 后端按 Host 路由，代理未设置正确 Host。 |
| 超时 | 使用 `ClientDoTimeout` 并记录错误。 | 后端慢、DNS/服务发现异常、连接池耗尽。 |
| Header | 对比客户端请求头、后端收到的请求头、代理响应头。 | hop-by-hop Header 被正常剥离，或自定义 Header 没透传。 |
| 错误响应 | 确认是否进入 `SetErrorHandler`。 | 后端不可达，或 `SetModifyResponse` 返回了错误。 |

## 参考资料

本页依据 reverseproxy v1.0.6 源码和 README 整理。

- [hertz-contrib/reverseproxy GitHub](https://github.com/hertz-contrib/reverseproxy)
- [pkg.go.dev reverseproxy](https://pkg.go.dev/github.com/hertz-contrib/reverseproxy)
- [Hertz 官方文档](https://www.cloudwego.io/docs/hertz/)

资料核对时间：2026-06-21。本地核对版本：`github.com/hertz-contrib/reverseproxy v1.0.6`，依赖 `github.com/cloudwego/hertz v0.6.5`。
