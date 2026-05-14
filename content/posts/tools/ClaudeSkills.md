---
title: "Claude Skills"
date: '2026-03-14'
draft: false
description:  
toc: true
tags:
  - Claude Code
---

# 1. 学习主题

我要学习的内容：

Claude Skills

我为什么要学它：

用于平时的 Vibe Coding

我希望达到的程度：

- [x] 了解基本概念
- [x] 能向别人讲清楚
- [x] 能用于面试回答
- [ ] 能写代码/做项目
- [ ] 能深入分析原理

# 2. 我当前的理解

在正式学习前，我认为它是什么：
一种动态的上下文加载机制，通过描述来加载 Prompt 进入当前的上下文。

我已经知道的相关知识：

我目前不清楚的问题：

# 3. 第一轮学习记录

## 资料来源：

<iframe width="560" height="315" src="https://www.youtube.com/embed/bjdBVZa66oU?si=WFwEAQR9yn9n58C4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


## 核心概念提炼：

1. 痛点
    每次向 Claude 描述开发规范都是重复动作
2. SKILL 是什么
    * SKILL 是一个 markdown 文件，它告诉 Claude 如何一次性做好事情，当识别到任务相关时，会自动应用相关的知识。
    * 从形态上看，是一个带有说明、元数据、可选支持文件的目录。
    * Claude 会在需要的时候动态加载，用来提升任务的完成质量。
3. SKILL 的构成
    * name：SKILL 的名称
    * description：告诉 Claude 是否使用 SKILL。
4. SKILL 存放在哪里
    * 个人的 SKILL，放在 ~/.claude/skills 中
    * project skills 放在项目下的 .claude/skills 中
5. CLAUDE.md 和 SKILL 的差异
    * claude.md 在每次对话时都自动加载
    * SKILL 只在需要的时候加载
6. 什么时候使用 CLAUDE
    * 适用于在特定任务下的知识

## 关键术语：

术语 1：

术语 2：

术语 3：

# 4. 用“小白能听懂的话”解释

假设我要把这个知识讲给一个完全不懂的人听。

一句话解释它是什么：
（尽量不用专业术语）

它解决了什么问题：
（这个知识存在的原因是什么）

它是怎么工作的：
（按步骤写，像讲流程一样）

举一个最简单的例子：
（最好是生活化类比 + 技术例子）

如果让我口头讲 1 分钟，我会怎么讲：
（直接写成可说出口的话）

# 5. 找出“讲不清楚”的地方
我在哪些地方卡住了：
哪些概念我一解释就变模糊：
哪些地方只是“背会了”，但没有真正理解：

# 6. 回炉补缺

针对卡点，我重新查到的内容：

问题 1：

重新理解：

问题 2：

重新理解：

问题 3：

重新理解：

新的理解和原来有什么不同：
（写出修正点）

# 7. 压缩成自己的知识表达

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

# 8. 输出检验

我是否能做到以下几点：

 不看资料讲 3 分钟

 用大白话解释清楚

 解释它为什么出现

 解释它和相近概念的区别

 举出一个实际应用场景

 回答常见追问

 写出简单代码 / 例子 / 流程图

如果还不能，卡在哪：
# 9. 一页总结

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