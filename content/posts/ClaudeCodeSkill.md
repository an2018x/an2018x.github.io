---
title: "ClaudeCode Skill 的实现"
date: '2026-03-07'
draft: false
description:  
toc: true
---

# ClaudeCode Skill 的实现

## 1. 学习主题

我要学习的内容：
ClaudeCode Skill 如何实现的

我为什么要学它：
能够简单描述下 ClaudeCode Skill 的实现原理。


## 2. 我当前的理解

在正式学习前，我认为它是什么：

传入工具的参数，工具拿到 SKILL 的头信息，然后通过头信息可以获取完整的信息。

我已经知道的相关知识：
我目前不清楚的问题：

## 3. 第一轮学习记录

资料来源：

bilibili

<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116181616821740&bvid=BV1yRPWzqEhL&cid=36498573279&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

核心概念提炼：
1. 如何抓包请求
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/07/20260307224628657.png)
    * https 不好抓，需要抓 http，修改自定义模型为 http 协议的
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/07/20260307224714007.png)
    * 设置抓包工具的代理 Charles
2. 查看 SKILLS 的 Tools
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/07/20260307224902700.png)
    提供了一个名字为 SKILLS 的工具
3. 查看 SKILLS 的工具描述
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/07/20260307225014161.png)
4. 查看 SKILLS 的定义
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/07/20260307225114038.png)

关键术语：

术语 1：

术语 2：

术语 3：

## 4. 用“小白能听懂的话”解释

假设我要把这个知识讲给一个完全不懂的人听。

一句话解释它是什么：
SKILLS 的底层也是 function call，只是名字叫 SKILL，描述做了动态的拼接。

它解决了什么问题：

它是怎么工作的：

举一个最简单的例子：

如果让我口头讲 1 分钟，我会怎么讲：

## 5. 找出“讲不清楚”的地方
我在哪些地方卡住了：
哪些概念我一解释就变模糊：
哪些地方只是“背会了”，但没有真正理解：

## 6. 回炉补缺

针对卡点，我重新查到的内容：

问题 1：

重新理解：

问题 2：

重新理解：

问题 3：

重新理解：

新的理解和原来有什么不同：
（写出修正点）

## 7. 压缩成自己的知识表达

最终版通俗解释：
（要求自己能不用资料直接讲清楚）

最终版技术解释：
（适合面试 / 写作 / 项目说明）

核心公式 / 关键流程 / 重点机制：

最容易被问到的问题：
1.
2.
3.
4.
5.

对应回答：

Q1：

Q2：

Q3：

Q4：

Q5：

## 8. 输出检验

我是否能做到以下几点：

 不看资料讲 3 分钟

 用大白话解释清楚

 解释它为什么出现

 解释它和相近概念的区别

 举出一个实际应用场景

 回答常见追问

 写出简单代码 / 例子 / 流程图

如果还不能，卡在哪：
## 9. 一页总结

主题：

一句话本质：

核心作用：

关键原理：
1.
2.
3.

常见误区：

面试中怎么说最合适：
（写成一段完整答题模板）