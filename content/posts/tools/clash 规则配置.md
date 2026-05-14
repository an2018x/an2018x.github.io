---
title: "clash 规则配置"
date: '2026-01-27'
draft: false
description:  clas 规则配置
toc: true
tags:
  - 网络
  - 工具
---

# Clash 规则配置

编辑规则

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/27/20260127212327013.png)

增加规则：

```yaml
rules:
    - 'DOMAIN-KEYWORD,aliyuncs,DIRECT'
    - 'DOMAIN-SUFFIX,bilibili.com,DIRECT'
    - 'DOMAIN-KEYWORD,aliyuncs,DIRECT'
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/27/20260127212538494.png)