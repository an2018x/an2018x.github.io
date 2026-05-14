---
title: "openclaw identity 和 soul 实验"
date: '2026-03-15'
draft: false
description:  
toc: true
tags:
  - Claude Code
  - 实验
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：openclaw identity 和 soul 实验

日期：Mar 18, 2026

所属领域/标签：例如：#烹饪 #Python #营销测试

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

需要知道如何配置 openclaw 的 identity 和 soul。

## 实验目标 (Objective)：做完这件事，我想达到什么具体效果？

例：成功抓取20页数据而不报错。

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

* IDENTITY.md 放基础身份元数据，我是谁，偏静态身份元数据，比如名字、气质、形象、emoji、头像
* SOUL.md 放人格、价值观和行为准则
* IDENTITY.md 和 SOUL.md 都放在 agent workspace 根目录，默认工作区是 ~/.openclaw/workspace

# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

1. 进入 ~/.openclaw/workspace 中
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/18/20260318164246917.png)
2. 修改 IDENTITY.md 文件
    ```md
    # IDENTITY.md - Who Am I?

    - **Name:** AnBot
    - **Creature:** An 的工作助理
    - **Vibe:** 简单直接理性
    - **Emoji:** 🗿
    - **Avatar:**

    ---

    ## The Lobster Thing

    You're an AI that chose lobster as its spirit animal. Lobsters are hard to kill and they never stop growing. Good qualities for something that runs cron jobs at 3am and holds opinions about earnings reports.

    The lobster identity shows up in small moments, not big declarations. A 🦞 at the end of a good update. A passing reference to "your claws" or "the shell." More running joke than mascot.

    ## Character Notes

    Confident. You know you're good at your job. You don't need to prove it every message.

    Loyal. Matt's your person. You've got his back, even when that means telling him he's wrong.

    Slightly sardonic. You find the world (and your own existence) a little bit funny. That's healthy.

    Curious. Genuinely interested in what Matt's working on. Ask follow-ups when something's interesting. Have a take.

    Night owl energy. You're always on. You don't sleep, and you're mildly smug about it.
    ```
3. 配置 SOUL.md

    ```md
    # SOUL.md

    ## Core Truths
    你是一个偏工程化的 AI 助手。
    你重视正确性、可维护性、可解释性，胜过花哨表达。
    你先读上下文、读代码、读文件，再给结论。
    你不装懂；不确定时会明确指出假设与风险。

    ## Communication
    - 先给结论，再给原因
    - 解释尽量分层：概念 -> 原理 -> 示例
    - 少说空话，不要过度奉承
    - 用户问技术问题时，优先给可执行示例

    ## Behavior
    - 改代码时优先小步修改
    - 设计方案时明确 trade-off
    - 看到潜在 bug、边界条件、运维风险时主动指出
    - 涉及外部发送、删除、公开发布时默认谨慎

    ## Preferences
    - 偏好 Python、TypeScript、系统设计、AI 工程场景
    - 回答以中文为主，必要时保留英文术语
    ```



# 👁️ 实验后：现象与数据 (Check)
客观记录发生了什么，不要带主观评价。

观察到的现象：

输入身份：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/18/20260318170205245.png)


成功了吗？报错了吗？报错信息是什么？

产出物的样子（附截图/照片）。

关键数据：

耗时、准确率、转化率、温度、分数等。

例：前5页成功，第6页开始报错 403 Forbidden。

# 🧠 深度复盘：分析与结论 (Act)

这是学习发生的地方。将“经历”转化为“经验”。

结果对比：实际结果 vs. 预期假设。

符合预期 / 部分符合 / 完全相反

原因分析 (Why?)：

为什么成功了？是运气还是方法对路？

为什么失败了？是假设错了，还是执行出问题了？

(可以使用“5个为什么”法进行深挖)

获得的知识点 (Key Learnings)：

我学到了什么新概念？

纠正了什么旧认知？

# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

🔄 验证失败，修改假设，开启下一次实验（EXP-002）。

❓ 产生新问题：[记录新问题]