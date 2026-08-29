---
title: "Day 01 · Hertz 入门认知与开发环境准备"
date: '2026-06-21'
draft: false
description: "Hertz HTTP 框架 30 天系统学习路线 Day 01：理解 Hertz 的定位、架构特性和适用场景，搭建 Go 开发环境，跑通最小健康检查，为后续路由、上下文和中间件学习建立工作台。"
toc: true
tags:
  - Backend
  - Go
  - Hertz
  - CloudWeGo
  - Day 01
---

Hertz Roadmap · Day 01

# Hertz 入门认知与开发环境准备

Day 01 的目标不是立刻写复杂业务，而是先建立一张清晰地图：Hertz 是什么、它适合解决什么问题、一个最小 Hertz 服务由哪些部件组成，以及你的本地环境是否已经能稳定运行后续 29 天的练习。

建议时长：2 小时难度：入门前置：Go 基础语法产物：环境检查 + 最小服务 + 学习笔记

### 今天要掌握

- 能用一句话说明 Hertz 的定位。
- 能说出 Hertz 的三个关键词：高性能、易用、可扩展。
- 能搭好 Go Module 环境，并跑通 `/ping` 健康检查。
- 能整理一份后续学习用的项目目录和笔记模板。

### 一句话心智模型

Hertz 是 CloudWeGo 体系里的 Go HTTP 框架。你可以把它理解为“面向微服务场景的高性能 Web API 入口”：它负责接住 HTTP 请求、路由到 handler、管理请求上下文、执行中间件链，再把结果写回客户端。

## 时间安排

按 2 小时设计。如果时间不够，优先完成第 2、3、5 段。

00:00-00:20

### 阅读官方入口

快速浏览 Overview 和 Getting Started，先抓定位、架构、特性、最小启动方式，不做细节深挖。

00:20-00:45

### 环境检查

确认 Go 版本、Go Module、GOPATH、PATH、编辑器插件、curl 都可用。

00:45-01:20

### 跑通最小服务

创建 `hertz-day01` 项目，写 `/ping` 接口，用 curl 验证返回。

01:20-01:45

### 建立框架对比

把 Hertz 与 `net/http`、Gin、Echo 做最小对比，明确为什么要学它。

01:45-02:00

### 输出学习笔记

记录环境版本、命令、报错、框架心智模型和明天的问题清单。

## 核心概念

Day 01 只需要先抓主干，不需要背 API。

Framework
### Hertz 是什么

官方把 Hertz 定位为面向 Go 的高性能、易用、可扩展 HTTP 框架。它的入口是 HTTP 请求处理，但目标场景不只是传统 Web，也包括微服务 API、网关入口和内部平台服务。

Runtime
### 一个请求怎么流动

请求进入 server 后，先经过路由匹配，再进入中间件链，最后到业务 handler。handler 通过 `RequestContext` 读取请求、写响应。

Project
### 为什么后面要学 hz

`hz` 是 Hertz 的代码生成工具，可以基于 IDL 生成脚手架、路由和 handler 框架。Day 01 先手写最小服务，Day 15 再正式进入代码生成。

## 实验：跑通最小 Hertz 服务

这不是 Day 02 的完整路由课，只是为了验证环境和形成最小闭环。

1
### 检查本地工具

Hertz 官方文档建议使用最新 Go 版本，至少保证 Go 版本不低于 `1.19`。先确认你的命令行环境可用。

```
go version
go env GOPATH
go env GOMOD
go env GOPROXY
curl --version
```

2
### 创建项目

新建一个独立目录，不要直接写在旧项目里，便于后面每天递进。

```
mkdir hertz-day01
cd hertz-day01
go mod init hertz-day01
```

3
### 编写 main.go

先只保留一个健康检查接口。注意 handler 的两个参数：标准 `context.Context` 和 Hertz 的 `*app.RequestContext`。

```
package main

import (
    "context"

    "github.com/cloudwego/hertz/pkg/app"
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/cloudwego/hertz/pkg/common/utils"
    "github.com/cloudwego/hertz/pkg/protocol/consts"
)

func main() {
    h := server.Default(server.WithHostPorts(":8888"))

    h.GET("/ping", func(ctx context.Context, c *app.RequestContext) {
        c.JSON(consts.StatusOK, utils.H{
            "message": "pong",
            "day": "day01",
        })
    })

    h.Spin()
}
```

4
### 拉取依赖并启动

第一次运行会下载 Hertz 相关依赖。成功后，你应该能看到服务监听 `:8888` 的日志。

```
go mod tidy
go run .
```

5
### 验证接口

另开一个终端执行：

```
curl -i http://127.0.0.1:8888/ping
```

### 验收标准

HTTP 状态码是 `200`，响应体包含 `"message":"pong"` 和 `"day":"day01"`。如果 curl 卡住，优先检查服务是否还在运行、端口是否被占用。

## 框架对比笔记

今天只做轻量对比，避免陷入性能争论。重点是“什么场景下我会选择 Hertz”。

| 对象 | 你需要观察什么 | Day 01 结论模板 |
| --- | --- | --- |
| `net/http` | 标准库、最少依赖、生态兼容强，但路由、中间件、绑定等需要自己组织。 | 适合简单服务或底层库；复杂 API 项目会更依赖团队自建封装。 |
| Gin / Echo | 上手快、社区资料多、Web API 写法成熟。 | 适合常规 Web 服务；对 CloudWeGo 体系和高性能扩展诉求不强时很顺手。 |
| Hertz | 强调高性能、可扩展、微服务场景，配套 `hz`、服务发现、可观测等生态。 | 适合构建微服务 HTTP 入口、API 网关、内部平台服务和需要工程化生成的项目。 |

## 学习笔记模板

建议把这段保存为 `notes/day01.md`，之后每天沿用。

```
# Day 01 · Hertz 入门认知与环境准备

## 1. 环境信息
- Go version:
- GOPATH:
- GOMOD:
- OS:
- Editor:

## 2. 今天读了哪些官方文档
- Overview:
- Getting Started:
- Route / RequestContext / Render 先略读:

## 3. 我对 Hertz 的一句话理解
Hertz 是：

## 4. 最小 demo
- 项目目录:
- 启动命令:
- 验证命令:
- 返回结果:

## 5. 和其它框架的对比
- net/http:
- Gin / Echo:
- Hertz:

## 6. 遇到的问题
- 问题:
- 解决:

## 7. 明天想重点搞懂
- 路由分组:
- 路径参数:
- REST API 组织方式:
```

## Day 01 检查清单

全部勾上后，再进入 Day 02 的路由学习。

### 环境

- 能执行 `go version`，且版本不低于 `1.19`。
- 能正常使用 `go mod init`、`go mod tidy`。
- `curl` 可用，能访问本地服务。

### 代码

- 能解释 `server.Default` 创建了什么。
- 能解释 `h.GET("/ping", handler)` 的作用。
- 能解释为什么 handler 里有 `context.Context` 和 `*app.RequestContext`。

### 认知

- 能说出 Hertz 的核心定位。
- 能说明它与 `net/http` 的差异。
- 知道 `hz` 是后续工程化代码生成工具。

### 输出

- 完成 `notes/day01.md`。
- 保存 curl 验证结果。
- 列出 Day 02 要继续追问的 3 个问题。

## 参考资料

今天只读这些入口就够了，后面的专题文档留到对应日期再深入。

- [Hertz Overview](https://www.cloudwego.io/docs/hertz/overview/)：定位、架构、特性。
- [Hertz Getting Started](https://www.cloudwego.io/docs/hertz/getting-started/)：Go 环境要求、最小 `/ping` 示例、`hz` 安装入口。
- [Route](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/route/)：Day 02 会正式展开。
- [Render](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/render/)：Day 05 会正式展开。
- [hertz-examples](https://github.com/cloudwego/hertz-examples)：后续每天做实验时可以查官方示例。

资料核对时间：2026-06-21。官方 Getting Started 当前建议使用最新 Go 版本，并确保 Go 版本不低于 1.19。
