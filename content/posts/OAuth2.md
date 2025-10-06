---
title: "OAuth2 流程"
date: '2025-10-04'
draft: false
description: OAuth2 流程
toc: true
---

# 早期授权模式

直接提供用户名和密码给对应的应用，应用则可以访问你的所有信息。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005162628.png)


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005162739.png)

# OAuth2

给某个应用指定的 key，这个 key 允许应用去访问另外一个应用的指定信息。

我们可以控制应用程序访问哪些数据，同时也可以随时撤回这个 key。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005163303.png)


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005163418.png)


StoreServer 是存储我们图片的资源服务器。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005163502.png)

PrintMagic 是想要访问照片的客户端。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005163559.png)

认证服务器可以是 SnapStore 的一部分或者是外部的身份提供商，用于提供 OAuth2 认证。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005163644.png)


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005163926.png)