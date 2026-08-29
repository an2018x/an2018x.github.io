---
title: "Hertz 反向代理中结合 WithSenseClientDisconnection"
date: '2026-06-21'
draft: false
description: "介绍 server.WithSenseClientDisconnection(true) 如何和 hertz-contrib/reverseproxy 的 rp *reverseproxy.ReverseProxy 结合使用，让客户端断开信号传递到代理上游请求。"
toc: true
tags:
  - Backend
  - Go
  - Hertz
  - ReverseProxy
  - CloudWeGo
---

Hertz · Reverse Proxy · Cancellation

# WithSenseClientDisconnection 如何结合 ReverseProxy

在代理网关里，`server.WithSenseClientDisconnection(true)` 和 `rp *reverseproxy.ReverseProxy` 的组合价值很直接：客户端断开后，Hertz 取消 handler 的 `context.Context`；`rp.ServeHTTP(c, ctx)` 再把这个 `c` 传给 Hertz Client 的上游请求，从而让代理链路有机会及时退出。

Hertz：v0.10.5reverseproxy：v1.0.6关键方法：rp.ServeHTTP(c, ctx)核心原则：传递原始 context

### 一句话结论

代理路由可以直接注册 `rp.ServeHTTP`；如果你要包一层自定义 handler，也必须调用 `rp.ServeHTTP(c, ctx)`，不要把第一个参数换成 `context.Background()`。

### 最小组合

```
h := server.Default(
    server.WithHostPorts(":8888"),
    server.WithSenseClientDisconnection(true),
)

rp, _ := reverseproxy.NewSingleHostReverseProxy("http://127.0.0.1:8082")
h.Any("/api/*path", rp.ServeHTTP)
```

## 为什么要结合

反向代理常常是长链路，客户端断开时更应该尽早停止上游等待。

Gateway
### 减少无效上游请求

客户端已经关闭页面，代理仍在等用户服务、订单服务或搜索服务响应，会浪费连接和 goroutine。

Backpressure
### 避免代理层堆积

高并发下，下游慢响应和客户端中断会放大资源占用。取消信号能让代理更快释放请求链路。

Observability
### 区分取消和故障

`context.Canceled` 通常不是上游故障，而是客户端离开。错误处理里应单独记录，避免误报。

## 源码链路

组合生效的关键，在于同一个 context 从 server 传到 reverseproxy，再传给 client。

### server 开启断开感知

`server.WithSenseClientDisconnection(true)` 让 Hertz 在客户端连接关闭时取消 handler 入参 `c context.Context`。

### 路由进入代理 handler

直接注册 `h.Any("/api/*path", rp.ServeHTTP)` 时，Hertz 会把当前请求的 `c` 和 `ctx` 传入 `rp.ServeHTTP`。

### ReverseProxy 改写请求

`rp.ServeHTTP` 执行 `director`，清理 hop-by-hop Header，补充 `X-Forwarded-For`，准备向上游发请求。

### Hertz Client 接收同一个 context

`rp.doClientBehavior(c, req, resp)` 会把 `c` 传给 `r.client.Do`、`DoTimeout`、`DoDeadline` 或 `DoRedirects`。

### 客户端断开后向上游传播取消

一旦客户端断开，`c.Done()` 关闭；代理中的 client 调用可以感知取消，错误会进入 `SetErrorHandler` 或默认 502 逻辑。

## 最小可用代码

这就是组合的基本形态：server option 开启，代理路由传原始 context。

```
package main

import (
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/hertz-contrib/reverseproxy"
)

func main() {
    h := server.Default(
        server.WithHostPorts(":8888"),
        server.WithSenseClientDisconnection(true),
    )

    rp, err := reverseproxy.NewSingleHostReverseProxy("http://127.0.0.1:8082")
    if err != nil {
        panic(err)
    }

    h.Any("/api/*path", rp.ServeHTTP)
    h.Spin()
}
```

## 推荐生产写法

真实网关里通常会加超时、错误区分、请求头透传和上游标识。

```
package main

import (
    "context"
    "errors"
    "log"
    "time"

    "github.com/cloudwego/hertz/pkg/app"
    hclient "github.com/cloudwego/hertz/pkg/app/client"
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/cloudwego/hertz/pkg/common/utils"
    "github.com/cloudwego/hertz/pkg/protocol"
    "github.com/cloudwego/hertz/pkg/protocol/consts"
    "github.com/hertz-contrib/reverseproxy"
)

func main() {
    h := server.Default(
        server.WithHostPorts(":8888"),
        server.WithSenseClientDisconnection(true),
    )

    rp, err := reverseproxy.NewSingleHostReverseProxy(
        "http://127.0.0.1:8082",
        hclient.WithClientReadTimeout(5*time.Second),
    )
    if err != nil {
        panic(err)
    }

    rp.SetClientBehavior(reverseproxy.ClientDoTimeout(3 * time.Second))

    rp.SetDirector(func(req *protocol.Request) {
        req.SetRequestURI(string(reverseproxy.JoinURLPath(req, rp.Target)))
        req.Header.SetHostBytes(req.URI().Host())
        req.Header.Set("X-Gateway", "hertz")
        req.Header.Set("X-Forwarded-Proto", "http")
    })

    rp.SetErrorHandler(func(ctx *app.RequestContext, err error) {
        if errors.Is(err, context.Canceled) {
            log.Printf("client canceled proxy request: %v", err)
            ctx.SetStatusCode(499)
            return
        }

        ctx.JSON(consts.StatusBadGateway, utils.H{
            "code": 50201,
            "message": "upstream unavailable",
            "detail": err.Error(),
        })
    })

    h.Any("/api/*path", func(c context.Context, ctx *app.RequestContext) {
        // Keep this c. It carries client-disconnection cancellation.
        rp.ServeHTTP(c, ctx)
    })

    h.Spin()
}
```

### 为什么还要配置 ReadTimeout

Hertz Client 的 `DoTimeout` 注释说明：超时返回不等于一定终止底层请求本身。代理场景建议同时设置 `WithClientReadTimeout` 或请求级 `config.WithReadTimeout`，给连接池和上游等待一个更硬的边界。

## 不要这样写

下面这些写法会破坏取消传播，或者让取消信号变得不可靠。

### 不要丢掉 handler 的 context

```
h.Any("/api/*path", func(c context.Context, ctx *app.RequestContext) {
    // Wrong: client disconnection cancellation is lost.
    rp.ServeHTTP(context.Background(), ctx)
})
```

### 不要只依赖 502 判断上游故障

客户端主动断开、代理超时、上游连接失败都可能进入 `SetErrorHandler`。要根据 `err`、日志字段和 trace 区分，避免把用户取消误判成服务故障。

## 组合配置矩阵

可以按接口类型选择不同的代理配置。

| 代理场景 | 推荐配置 | 说明 |
| --- | --- | --- |
| 普通 JSON API | `WithSenseClientDisconnection(true)` + `ClientDoTimeout` + `WithClientReadTimeout` | 覆盖客户端取消、业务超时和上游慢响应。 |
| 慢查询 / 报表代理 | 较长 `ReadTimeout` + 明确业务 timeout + 取消日志 | 用户取消和真正超时要分开观测。 |
| 流式响应代理 | `client.WithResponseBodyStream(true)` + 断开感知 + 写错误处理 | 流式响应更依赖连接生命周期，客户端断开后要尽快释放上游。 |
| 多上游网关 | 共享 `*client.Client` + `SetClient` + 统一 `SetErrorHandler` | 统一连接池、超时、TLS、服务发现和错误结构。 |

## 如何验证

用一个慢上游服务，再从代理入口中断客户端请求。

### 实验步骤

1. 启动一个慢上游：`/slow` 延迟 10 秒再返回。
2. 启动代理服务，并开启 `WithSenseClientDisconnection(true)`。
3. 执行 `curl -v http://127.0.0.1:8888/api/slow`。
4. 在上游返回前按 `Ctrl-C` 中断 curl。
5. 观察代理日志，应看到 `context canceled` 或自定义的取消日志。

```
curl -v http://127.0.0.1:8888/api/slow
# 等 1-2 秒后按 Ctrl-C
# 代理日志：client canceled proxy request: context canceled
```

## 源码要点

读源码时抓住这几处就够了。

| 源码位置 | 关键代码 | 意义 |
| --- | --- | --- |
| `server.WithSenseClientDisconnection` | 设置 `Options.SenseClientDisconnection` | 开启连接关闭检测，客户端断开时取消 handler context。 |
| `ReverseProxy.ServeHTTP` | `func (r *ReverseProxy) ServeHTTP(c context.Context, ctx *app.RequestContext)` | 第一个参数就是取消传播的入口。 |
| `rp.doClientBehavior` | `r.client.Do(ctx, req, resp)` | 代理把同一个 context 传给 Hertz Client。 |
| `SetErrorHandler` | 处理 client 调用错误或响应修改错误 | 可以区分客户端取消、上游超时和真正的 5xx 故障。 |

## 实践清单

落到项目里时，可以按这个清单检查。

### server 层

确认创建 Hertz 实例时已开启 `server.WithSenseClientDisconnection(true)`。

### handler 层

直接注册 `rp.ServeHTTP`，或包一层时继续传 `rp.ServeHTTP(c, ctx)`。

### client 层

为反向代理配置合理的 `ClientDoTimeout`、`WithClientReadTimeout` 或自定义 client。

### 观测层

把 `context.Canceled`、超时、上游不可达分开打日志和统计。

## 参考资料

本页基于 Hertz v0.10.5 和 reverseproxy v1.0.6 源码整理。

- [hertz-contrib/reverseproxy v1.0.6: reverse\_proxy.go](https://github.com/hertz-contrib/reverseproxy/blob/v1.0.6/reverse_proxy.go)
- [pkg.go.dev: github.com/hertz-contrib/reverseproxy](https://pkg.go.dev/github.com/hertz-contrib/reverseproxy)
- [Hertz v0.10.5: server option.go](https://github.com/cloudwego/hertz/blob/v0.10.5/pkg/app/server/option.go)
- [Hertz v0.10.5: app/client/client.go](https://github.com/cloudwego/hertz/blob/v0.10.5/pkg/app/client/client.go)

资料核对时间：2026-06-21。当前模块源返回 `github.com/cloudwego/hertz@latest` 为 `v0.10.5`，`github.com/hertz-contrib/reverseproxy@latest` 为 `v1.0.6`。
