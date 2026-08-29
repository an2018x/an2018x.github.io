---
title: "Hertz server.WithSenseClientDisconnection(true) 配置说明"
date: '2026-06-21'
draft: false
description: "系统介绍 Hertz 中 server.WithSenseClientDisconnection(true) 的作用、默认值、版本支持、源码机制、长请求/SSE/反向代理场景下的用法和注意事项。"
toc: true
tags:
  - Backend
  - Go
  - Hertz
  - CloudWeGo
  - Server
---

Hertz Server · Client Disconnection

# server.WithSenseClientDisconnection(true) 配置说明

`server.WithSenseClientDisconnection(true)` 用来开启“客户端断开连接感知”。开启后，当客户端主动关闭连接时，Hertz 会取消本次请求 handler 收到的 `context.Context`，你的业务代码可以通过 `<-c.Done()` 及时停止慢任务、流式输出、反向代理调用或下游请求。

配置包：github.com/cloudwego/hertz/pkg/app/server默认值：false核对版本：Hertz v0.10.5核心效果：取消 handler context

### 一句话结论

如果接口可能长时间运行，客户端又可能中途断开，建议开启它，并在 handler、下游 RPC、数据库查询、流式写入里传递和监听 `c context.Context`。

### 最小用法

```
h := server.Default(
    server.WithHostPorts(":8888"),
    server.WithSenseClientDisconnection(true),
)
```

## 它解决什么问题

没有断开感知时，客户端走了，服务端 handler 仍可能继续做无意义的工作。

Slow Request
### 慢接口浪费资源

用户关闭页面或网关超时后，服务端还在算报表、查数据库、调用下游服务。开启后可以尽早停止。

Streaming
### 流式接口需要退出

SSE、分块响应、下载等场景里，客户端断开后循环写入应停止，否则容易堆积无效 goroutine。

Gateway
### 代理链路需要取消

反向代理或 BFF 调用下游时，客户端断开应向下游传播取消信号，减少级联资源消耗。

## 配置含义

这是 server option，创建 Hertz 实例时传入。

| 项目 | 说明 | 重点 |
| --- | --- | --- |
| `WithSenseClientDisconnection(true)` | 开启客户端连接断开检测。 | 客户端关闭 TCP 连接后，请求上下文会被取消。 |
| `WithSenseClientDisconnection(false)` | 关闭客户端连接断开检测。 | 这是默认行为；断开连接不会额外取消 handler 的上下文。 |
| `c context.Context` | Hertz handler 的第一个参数。 | 要监听的是它的 `Done()`，不是 `*app.RequestContext`。 |
| `c.Err()` | 上下文取消后的错误。 | 客户端断开触发时通常是 `context.Canceled`。 |

## 版本支持

这个配置经历过一次能力扩展，阅读源码注释时要注意版本。

| 版本 | 变化 | 实践建议 |
| --- | --- | --- |
| `v0.9.1` | 新增 `WithSenseClientDisconnection`，用于 netpoll 传输层的客户端断开检测。 | 如果项目还在较老版本，先确认是否只覆盖 netpoll。 |
| `v0.10.0` | 新增 standard transport，也就是非 netpoll 传输层的支持。 | 使用标准网络库时，建议至少升级到 `v0.10.0`。 |
| `v0.10.5` | 当前核对版本，配置默认值仍为 `false`，netpoll 和 standard transport 都能读取该选项。 | 本文示例与说明基于该版本源码和测试。 |

### 源码注释里可能还有历史痕迹

`option.go` 中的注释仍提示“只适用于 netpoll”，但 `v0.10.0` 的 changelog 和 `network/standard` 源码已经加入了 standard transport 支持。排查时以项目实际依赖版本为准。

## 底层机制

它不是把 handler 强制杀掉，而是发出一个 context 取消信号。

### 创建连接上下文

Hertz 接受连接后，为连接和请求链路准备 `context.Context`，handler 收到的第一个参数来自这条链路。

### 注册断开检测

开启配置后，netpoll transport 会注册 `OnDisconnect` 回调；standard transport 会通过连接状态监听远端关闭。

### 客户端关闭连接

浏览器关闭、`curl` 中断、上游网关断开、移动网络掉线等情况，都可能触发远端关闭。

### 取消请求上下文

Hertz 调用对应的 `cancel`，handler 中的 `<-c.Done()` 变为可读，`c.Err()` 返回取消原因。

### 业务代码自己退出

你的代码需要在循环、下游调用和耗时任务里主动检查 `c.Done()`，或者把 `c` 传给支持 context 的 API。

## 慢接口示例

这个例子模拟一个 10 秒任务；客户端中断后，handler 会提前返回。

```
package main

import (
    "context"
    "log"
    "time"

    "github.com/cloudwego/hertz/pkg/app"
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/cloudwego/hertz/pkg/common/utils"
    "github.com/cloudwego/hertz/pkg/protocol/consts"
)

func main() {
    h := server.Default(
        server.WithHostPorts(":8888"),
        server.WithSenseClientDisconnection(true),
    )

    h.GET("/slow", func(c context.Context, ctx *app.RequestContext) {
        timer := time.NewTimer(10 * time.Second)
        defer timer.Stop()

        select {
        case <-c.Done():
            log.Printf("client disconnected: %v", c.Err())
            return
        case <-timer.C:
            ctx.JSON(consts.StatusOK, utils.H{
                "message": "finished",
            })
        }
    })

    h.Spin()
}
```

## 流式输出示例

SSE、日志 tail、进度推送等循环场景，尤其需要监听 `c.Done()`。

```
import "github.com/cloudwego/hertz/pkg/protocol/sse"

h.GET("/events", func(c context.Context, ctx *app.RequestContext) {
    writer := sse.NewWriter(ctx)
    defer writer.Close()

    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()

    for i := 1; ; i++ {
        select {
        case <-c.Done():
            log.Printf("sse client gone: %v", c.Err())
            return
        case t := <-ticker.C:
            data := []byte(fmt.Sprintf("tick %d at %s", i, t.Format(time.RFC3339)))
            if err := writer.WriteEvent(fmt.Sprintf("id-%d", i), "message", data); err != nil {
                log.Printf("write sse failed: %v", err)
                return
            }
        }
    }
})
```

### 流式写入要同时处理写错误

`c.Done()` 是断开信号，`WriteString`、`Flush` 的错误也是退出信号。生产代码里两个都要处理。

## 怎么验证

最直接的方法是发起慢请求，然后手动中断客户端。

### 实验步骤

1. 启动上面的示例服务。
2. 执行 `curl -v http://127.0.0.1:8888/slow`。
3. 在 10 秒结束前按 `Ctrl-C` 中断 curl。
4. 观察服务端日志，应该能看到类似 `client disconnected: context canceled`。

```
go run .
curl -v http://127.0.0.1:8888/slow
# 等 1-2 秒后按 Ctrl-C
```

## 适用场景

不是所有接口都必须开，但下面这些场景收益很明显。

| 场景 | 为什么适合 | 配套动作 |
| --- | --- | --- |
| 报表、搜索、AI 生成等慢接口 | 用户离开页面后，继续计算没有意义。 | 在 select 中监听 `c.Done()`，并把 `c` 传给下游。 |
| SSE、流式下载、实时日志 | 客户端断开后，服务端循环需要退出。 | 每次写入后检查写错误，并监听 `c.Done()`。 |
| 网关、BFF、反向代理 | 客户端已经断开时，没有必要继续等待上游服务。 | 下游 HTTP/RPC 调用使用同一个 context 或派生 context。 |
| 大文件上传/下载 | 网络中断频繁，资源占用时间长。 | 处理读写错误，结合业务超时和限流策略。 |

## 常见误区

开启配置只是第一步，真正的收益来自业务代码正确响应取消。

### 误区一：开启后 handler 会被强制停止

不会。Go 没有安全地强杀 goroutine 的机制。Hertz 取消 context 后，代码必须主动监听或传递这个 context。

### 误区二：它可以替代超时

不能。客户端不断开时，慢请求仍需要业务超时、下游超时、读写超时和限流保护。

### 误区三：只要监听一次就够

长循环、批处理、多阶段下游调用都要在合适的位置检查取消信号，否则仍会拖到当前阶段结束。

### 误区四：所有版本行为完全一样

低版本可能只覆盖 netpoll。使用 standard transport 的项目请确认 Hertz 版本不低于 `v0.10.0`。

## 生产建议

可以把它当成长请求服务的基础保护之一。

### 推荐组合

- 服务启动时开启 `server.WithSenseClientDisconnection(true)`。
- handler 中始终把第一个参数命名清楚，例如 `func(c context.Context, ctx *app.RequestContext)`。
- 调用数据库、HTTP Client、RPC Client 时优先传递 `c` 或基于它派生的 timeout context。
- 慢循环里使用 `select` 同时监听任务进度和 `c.Done()`。
- 日志里把 `context.Canceled` 和真正的业务错误区分开，避免误报。

## 参考资料

本页基于 Hertz v0.10.5 源码、测试和 changelog 整理。

- [pkg.go.dev: server.WithSenseClientDisconnection](https://pkg.go.dev/github.com/cloudwego/hertz/pkg/app/server#WithSenseClientDisconnection)
- [Hertz v0.10.5: pkg/app/server/option.go](https://github.com/cloudwego/hertz/blob/v0.10.5/pkg/app/server/option.go)
- [Hertz v0.10.5: network/netpoll/transport.go](https://github.com/cloudwego/hertz/blob/v0.10.5/pkg/network/netpoll/transport.go)
- [Hertz v0.10.5: network/standard/transport.go](https://github.com/cloudwego/hertz/blob/v0.10.5/pkg/network/standard/transport.go)
- [Hertz changelog v0.9.1](https://github.com/cloudwego/hertz/blob/v0.10.5/changelog/v0.9.1.md)
- [Hertz changelog v0.10.0](https://github.com/cloudwego/hertz/blob/v0.10.5/changelog/v0.10.0.md)

资料核对时间：2026-06-21。当前 Go 模块源返回的 `github.com/cloudwego/hertz@latest` 为 `v0.10.5`。
