---
title: "CLAUDE SKILL 实验"
date: '2026-03-14'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：CLAUDE SKILL 实验

日期：Mar 14, 2026

所属领域/标签：例如：#CLAUDECODE

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

我想要实践下 claude code 的 skill 用法

## 实验目标 (Objective)：做完这件事，我想达到什么具体效果？

例：成功抓取20页数据而不报错。

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

如果我创建 `.claude/skills/<skill-name>/SKILL.md` 那么就可以创建一个 skill，并通过自然语言调用它。

# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

Claude Code

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step1 创建项目

```shell
mkdir claude-skills-test
cd claude-skills-test
```

### Step2 创建 skills

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/14/20260314155815956.png)

### Step3 编写 skills 内容

```markdown
---
name: tech-summary
description: Summarize technical content into a simple structured format, used when asked to explain a technique.
---

# Tech Summary Skill

When the user provides technical content, summarize it using the following structure:

## Output format

### 1. Topic
State the main topic in one sentence.

### 2. Core idea
Explain the core idea in 2-3 sentences.

### 3. Key points
List 3 to 5 important points.

### 4. Example
Give one simple example if appropriate.

### 5. Interview answer
If the content is a technical concept, provide a short interview-style answer.

## Rules
- Keep the explanation clear and direct.
- Prefer simple wording over overly academic wording.
- If the input is ambiguous, make the most reasonable interpretation.
- Do not output unnecessary preamble.
```

这个 skill 覆盖了 Claude Skills 最核心的三个点：

* name：skill 的名字
* description：告诉 Claude 这个 skill 适合什么场景
* 正文指令：规定 Claude 怎么做、怎么输出


# 👁️ 实验后：现象与数据 (Check)

## 观察到的现象：

1. 查看生效的 skills: /skills

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/14/20260314161640967.png)

2. 不主动指定 skills

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/14/20260314162814086.png)

3. 主动指定 skills

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/14/20260314162838740.png)

## 产出物的样子（附截图/照片）。


# 🧠 深度复盘：分析与结论 (Act)

这是学习发生的地方。将“经历”转化为“经验”。

## 结果对比：实际结果 vs. 预期假设。

符合预期 / 部分符合 / 完全相反

## 原因分析 (Why?)：

为什么成功了？是运气还是方法对路？

为什么失败了？是假设错了，还是执行出问题了？

(可以使用“5个为什么”法进行深挖)

## 获得的知识点 (Key Learnings)：

1. claude skills 一般放在项目的 .claude/skills/<skill-name>/SKILL.md 下
2. skills 一般有两个关键属性，name 和 description，其中 description 需要描述触发环境
3. skills 可以直接通过自然语言被动触发，也可以通过 `/<skill-name>` 主动触发

# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

🔄 验证失败，修改假设，开启下一次实验（EXP-002）。

❓ 产生新问题：[记录新问题]