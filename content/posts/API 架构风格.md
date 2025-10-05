---
title: "API 架构风格"
date: '2025-10-04'
draft: false
description: API 架构风格
toc: true
---

# SOAP

* 基于 XML
* 成熟全面
* 通常用于金融领域和支付网关
* SOAP 过于复杂和冗杂，不适合高性能应用


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005115359.png)

# Restful

* 基于 JSON
* 基于 HTTP
* 简单，易于实施
* 通常用在 Web 场景
* 不适用于实时、高度关联的数据模型下的操作

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005115632.png)

# GraphQL

* GraphQL 允许客户端只请求他们需要的数据
* 难于学习
* 服务端需要做大量的适配改造

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005115809.png)


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005115921.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120001.png)

# GRPC

* 高性能
* 使用 Protobuf
* 通常用于微服务场景中服务间的通信
* 不适用于浏览器场景，因为浏览器的兼容性不是很好

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120140.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120259.png)

# WebSocket

* 实时、双向、持久连接。
* 适用于 IM 聊天、实时游戏。


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120508.png)


# Webhook

* 事件驱动
* HTTP 回调
* 异步操作

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120603.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120645.png)