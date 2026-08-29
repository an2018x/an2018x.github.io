---
title: "Transformer 到底在解决什么？"
date: '2026-07-09'
draft: false
description: "用一个简单例子梳理 Transformer 解决的核心问题。"
slug: transformer-problem
toc: false
tags:
  - 深度学习
  - Transformer
---

> 让每个 token 快速找到对自己最有用的上下文。

## 例子

我喜欢苹果，因为它很甜。

句子中的 token 是：`我`、`喜欢`、`苹果`、`因为`、`它`、`很甜`。

- “它”会更重视“苹果”
- “它”也会参考“很甜”

## 两种思路

| 方式 | 如何处理上下文 |
| --- | --- |
| 旧思路：顺序读 | 一个词一个词传递信息。长句会慢，远距离线索容易变弱。 |
| Transformer：全局看 | 每个 token 同时观察其他 token。重点线索权重大，训练也更容易并行。 |

## 一句话

Transformer 解决的是“每个词如何高效获得全局上下文”，也就是学会该看谁、看多少。
