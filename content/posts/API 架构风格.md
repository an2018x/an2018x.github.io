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

grpc 是一个开源高性能的 rpc 框架，由谷歌在 2016 年研发。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005143125.png)

gprc 的生态非常完善：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005143413.png)

使用 Protobuf，protobuf 是一个语言无关，平台无关的编码方案

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005143534.png)
    
* protobuf 支持强类型的 schema 定义

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005143737.png)

* grpc 方法也通过 proto 文件定义

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005143905.png)

通常用于微服务场景中服务间的通信
不适用于浏览器场景，因为浏览器的兼容性不是很好


protocolbuf 是一个非常紧凑的二进制编码格式，比 json 速度更快。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120140.png)


grpc 基于 http2 构建，因此性能非常优秀。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005144152.png)


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005120259.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005144009.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005144028.png)


grpc 调用过程：

1. 当订单服务发起一个对于支付服务的 gRpc 调用时，它会调用由 grpc 工具生成的客户端代码，这段被生成的代码被称为 client sub（客户端桩）
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005144421.png)
2. grpc 将传递给客户端桩的数据编码成 Protocol Buffer，并将其送到低层的传输层。
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005144934.png)
3. grpc 将数据作为 http/2 协议的数据帧通过网络发送（由于二进制数据的编码以及网络的优化，grpc 据说比 JSON 快 5 倍）
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005145035.png)
4. Payment 服务接受数据、解码并且调用服务器端代码
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005145217.png)

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