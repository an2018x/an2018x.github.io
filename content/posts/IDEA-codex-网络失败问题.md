---
title: "Jetbrain codex 插件访问失败问题"
date: '2026-03-17'
draft: false
description:  
toc: true
---

# 问题现象

聊天一直是思考中

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/18/20260318004809866.png)

# 解决方法

配置代理再启动

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/18/20260318005042324.png)

```bash
export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897 all_proxy=socks5://127.0.0.1:7897
open -a "Pycharm"
```

