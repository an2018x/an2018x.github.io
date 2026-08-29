---
title: "Day 02 · Hertz 路由注册、分组与匹配规则"
date: '2026-06-21'
draft: false
description: "Hertz HTTP 框架 30 天系统学习路线 Day 02：系统学习路由注册、路由分组、静态路由、参数路由、通配路由、404/405 处理和尾斜杠重定向，完成一个 REST API 路由骨架。"
toc: true
tags:
  - Backend
  - Go
  - Hertz
  - CloudWeGo
  - Day 02
---

Hertz Roadmap · Day 02

# Hertz 路由注册、分组与匹配规则

Day 02 的核心任务是把“一个请求如何被命中到一个 handler”讲清楚。今天你会系统练习 HTTP 方法注册、版本化路由分组、路径参数、通配路径、404/405 兜底和尾斜杠重定向，最后得到一个可继续扩展的 REST API 路由骨架。

建议时长：2.5 小时难度：入门进阶前置：Day01 /ping 服务产物：REST 路由骨架 + curl 验证表

### 今天要掌握

- 能用 `GET`、`POST`、`PUT`、`DELETE` 注册资源路由。
- 能用 `Group` 组织 `/api/v1`、`/api/admin` 等路由前缀。
- 能解释静态路由、参数路由、通配路由的匹配差异。
- 能为未知路径和方法错误配置清晰的 JSON 响应。

### 一句话心智模型

路由表就是 Hertz 的“分诊台”：请求方法和路径先被路由器匹配，命中后才进入对应 handler。路由设计越清晰，后续参数绑定、认证中间件、日志和接口文档都会更顺。

## 时间安排

今天以编码练习为主。先把路由跑通，再讨论命名和组织方式。

00:00-00:25

### 复盘 Day01 项目

确认 `/ping` 能启动，理解 `h.GET(path, handler)` 里方法、路径和 handler 的关系。

00:25-00:55

### 注册 HTTP 方法路由

练习 GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS、Any 和 Handle 的使用边界。

00:55-01:25

### 设计路由分组

用 `/api/v1` 管业务资源，用 `/api/admin` 管内部调试或管理接口。

01:25-02:00

### 练习匹配规则

分别验证静态、参数、通配路由，观察优先级：静态路由 \> 参数路由 \> 通配路由。

02:00-02:30

### 补齐兜底与文档

配置 NoRoute、NoMethod，输出路由清单，并把 curl 验证结果写进笔记。

## 核心概念

今天先把路由层的术语统一，后续中间件和绑定都会复用这些概念。

Register
### 路由注册

路由注册把 HTTP 方法、路径模式和 handler 绑定起来。例如 `GET /api/v1/users/:id` 表示只处理 GET 方法，并把路径里的 `:id` 交给 handler。

Group
### 路由分组

`Group` 用来共享路径前缀，也可以配合中间件。今天先用它做版本化和管理端分组，Day08 再深入中间件链。

Match
### 匹配优先级

Hertz 支持静态路由、参数路由和通配路由。官方文档给出的优先级是：静态路由高于参数路由，参数路由高于通配路由。

## 常用注册方法

这张表先作为编码速查。不是每个方法每天都会用，但要知道它们的位置。

**GET** 读取资源，例如列表、详情、健康检查。

**POST** 创建资源或提交动作。

**PUT** 整体更新一个资源。

**DELETE** 删除资源或撤销关系。

**PATCH** 局部更新资源。

**HEAD** 只需要响应头，不需要响应体。

**OPTIONS** 查询服务支持的方法或预检请求。

**Any / Handle** 匹配多个方法，或注册自定义 HTTP 方法。

## 匹配规则

这一段要亲自 curl 验证。只有看到命中和不命中，路由规则才会变成直觉。

| 路由类型 | 示例 | 匹配行为 | 适用场景 |
| --- | --- | --- | --- |
| 静态路由 | `/api/v1/users/profile` | 路径必须完全匹配。 | 固定功能入口，例如当前用户资料、健康检查。 |
| 参数路由 | `/api/v1/users/:id` | `:id` 只匹配一个路径片段，用 `c.Param("id")` 获取。 | 资源详情、更新、删除。 |
| 通配路由 | `/api/v1/files/*filepath` | `*filepath` 匹配后续路径内容，用 `c.Param("filepath")` 获取。 | 文件路径、代理路径、静态资源兜底。 |

### 注意

不要滥用通配路由。它很方便，但容易吞掉后续更明确的接口。业务 API 优先写静态和参数路由，通配路由一般放在边界清晰的路径前缀下。

## 实验：构建 REST 路由骨架

在 Day01 项目的基础上替换 `main.go`。今天重点验证路由，不引入数据库和复杂绑定。

1
### 准备项目

继续使用 Day01 的项目，也可以复制一份新目录。

```
cp -R hertz-day01 hertz-day02
cd hertz-day02
```

2
### 替换 main.go

这份代码包含版本化路由、资源路由、参数路由、通配路由、路由清单和 404/405 处理。

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
    h := server.Default(
        server.WithHostPorts(":8888"),
        server.WithHandleMethodNotAllowed(true),
    )

    h.GET("/ping", func(ctx context.Context, c *app.RequestContext) {
        c.JSON(consts.StatusOK, utils.H{"message": "pong", "day": "day02"})
    })

    v1 := h.Group("/api/v1")
    {
        v1.GET("/users", routeName("list users"))
        v1.POST("/users", routeName("create user"))
        v1.GET("/users/profile", routeName("current user profile"))
        v1.GET("/users/:id", func(ctx context.Context, c *app.RequestContext) {
            c.JSON(consts.StatusOK, utils.H{
                "route": "get user",
                "id": c.Param("id"),
            })
        })
        v1.PUT("/users/:id", func(ctx context.Context, c *app.RequestContext) {
            c.JSON(consts.StatusOK, utils.H{
                "route": "update user",
                "id": c.Param("id"),
            })
        })
        v1.DELETE("/users/:id", func(ctx context.Context, c *app.RequestContext) {
            c.JSON(consts.StatusOK, utils.H{
                "route": "delete user",
                "id": c.Param("id"),
            })
        })
        v1.GET("/files/*filepath", func(ctx context.Context, c *app.RequestContext) {
            c.JSON(consts.StatusOK, utils.H{
                "route": "file wildcard",
                "filepath": c.Param("filepath"),
            })
        })
    }

    admin := h.Group("/api/admin")
    {
        admin.GET("/routes", func(ctx context.Context, c *app.RequestContext) {
            routes := make([]utils.H, 0, len(h.Routes()))
            for _, r := range h.Routes() {
                routes = append(routes, utils.H{
                    "method": r.Method,
                    "path": r.Path,
                    "handler": r.Handler,
                })
            }
            c.JSON(consts.StatusOK, utils.H{"routes": routes})
        })
    }

    h.Any("/debug/any", routeName("any method"))
    h.Handle("LOAD", "/debug/load", routeName("custom LOAD method"))

    h.NoRoute(func(ctx context.Context, c *app.RequestContext) {
        c.JSON(consts.StatusNotFound, utils.H{
            "error": "route not found",
            "path": string(c.Path()),
        })
    })

    h.NoMethod(func(ctx context.Context, c *app.RequestContext) {
        c.JSON(consts.StatusMethodNotAllowed, utils.H{
            "error": "method not allowed",
            "method": string(c.Method()),
            "path": string(c.Path()),
        })
    })

    h.Spin()
}

func routeName(name string) app.HandlerFunc {
    return func(ctx context.Context, c *app.RequestContext) {
        c.JSON(consts.StatusOK, utils.H{"route": name})
    }
}
```

3
### 启动服务

```
go mod tidy
go run .
```

4
### 验证路由

另开一个终端执行下面命令，并记录每条命中了哪个 handler。

```
curl -i http://127.0.0.1:8888/ping
curl -i http://127.0.0.1:8888/api/v1/users
curl -i -X POST http://127.0.0.1:8888/api/v1/users
curl -i http://127.0.0.1:8888/api/v1/users/profile
curl -i http://127.0.0.1:8888/api/v1/users/42
curl -i -X PUT http://127.0.0.1:8888/api/v1/users/42
curl -i -X DELETE http://127.0.0.1:8888/api/v1/users/42
curl -i http://127.0.0.1:8888/api/v1/files/docs/hertz/day02.md
curl -i http://127.0.0.1:8888/api/admin/routes
curl -i http://127.0.0.1:8888/not-exists
curl -i -X PATCH http://127.0.0.1:8888/api/v1/users/42
```

### 验收标准

能看到 `/users/profile` 命中静态路由，`/users/42` 命中参数路由，`/files/docs/hertz/day02.md` 命中通配路由，未知路径返回 404，未注册方法返回 405。

## 路由设计建议

路由设计没有唯一答案，但有一些能长期降低维护成本的习惯。

| 建议 | 示例 | 原因 |
| --- | --- | --- |
| 按资源组织路径 | `/api/v1/users/:id` | 让 URL 表达“操作什么”，把动作交给 HTTP 方法表达。 |
| 显式版本化 | `/api/v1`、`/api/v2` | 后续接口不兼容升级时有迁移空间。 |
| 管理端单独分组 | `/api/admin/routes` | 后面接认证、审计、限流时可以整组处理。 |
| 少用动词路径 | 优先 `POST /users`，少写 `/createUser` | REST API 更容易被文档、测试和网关工具理解。 |

## 学习笔记模板

建议保存为 `notes/day02.md`，重点记录命中结果。

```
# Day 02 · Hertz 路由注册、分组与匹配规则

## 1. 今天新增了哪些路由
- GET /ping:
- GET /api/v1/users:
- POST /api/v1/users:
- GET /api/v1/users/profile:
- GET /api/v1/users/:id:
- GET /api/v1/files/*filepath:
- GET /api/admin/routes:

## 2. 路由分组设计
- /api/v1:
- /api/admin:

## 3. 匹配规则验证
- 静态路由命中结果:
- 参数路由命中结果:
- 通配路由命中结果:
- 优先级结论:

## 4. 404 / 405 验证
- NoRoute:
- NoMethod:
- WithHandleMethodNotAllowed:

## 5. 遇到的问题
- 问题:
- 解决:

## 6. 明天想重点搞懂
- RequestContext:
- Param / Query / Header / Cookie:
- 请求数据和响应数据的边界:
```

## Day 02 检查清单

全部勾上后，再进入 Day03 的 RequestContext 和请求数据学习。

### 编码

- 能注册常用 HTTP 方法路由。
- 能用 `Group` 组织版本化路由。
- 能用 `c.Param` 获取路径参数。

### 规则

- 能解释静态、参数、通配路由差异。
- 能说明匹配优先级。
- 知道尾斜杠可能触发自动重定向。

### 兜底

- 能配置 `NoRoute` 返回统一 404。
- 能配置 `NoMethod` 返回统一 405。
- 知道 405 需要配合 `WithHandleMethodNotAllowed(true)`。

### 输出

- 完成 `notes/day02.md`。
- 保存 curl 验证结果。
- 画出自己的 API 路由树。

## 参考资料

今天重点阅读 Route，RequestContext 可以先略读，留给 Day03 深入。

- [Hertz Route](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/route/)：路由注册、Group、路由类型、NoRoute、NoMethod、尾斜杠重定向。
- [Request](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/request/)：Day03 会深入请求数据读取。
- [Middleware Overview](https://www.cloudwego.io/docs/hertz/tutorials/basic-feature/middleware/)：Day08 会用 Group 串中间件。
- [hertz-examples](https://github.com/cloudwego/hertz-examples)：查找官方示例代码。

资料核对时间：2026-06-21。官方 Route 文档当前列出 GET、POST、DELETE、PUT、PATCH、HEAD、OPTIONS、Handle、Any、StaticFile/Static/StaticFS 等注册方式，并说明路由优先级为静态路由 \> 参数路由 \> 通配路由。
