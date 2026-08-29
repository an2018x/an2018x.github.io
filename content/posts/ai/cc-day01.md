---
title: "Day 01 · Claude Code 安装与初体验"
date: '2026-05-16'
draft: false
description: "从零开始：安装 CLI / VS Code 扩展 / Desktop App，完成 OAuth 认证，理解工具调用与权限确认机制，完成第一次 AI 辅助编程体验。"
toc: true
tags:
  - AI
  - Claude Code
  - Tooling
  - Tutorial
---

DAY 01 · CLAUDE CODE ROADMAP · 20 DAYS

# 安装你的 AI _结对伙伴_

第一天的目标是把 Claude Code 跑起来—— 完成安装与认证，理解"自然语言 → 工具调用 → 权限确认"的核心交互循环， 亲手让 Claude 读文件、写代码、跑命令， 建立对 AI 辅助编程的第一手体感。

**DURATION** 30–45 min **SETUP** 15 min **HANDS-ON** 20 min **REVIEW** 10 min **PLATFORM** CLI · VS Code · Desktop · Web

## 思维导图

OVERVIEW

> **图：Day 01 思维导图**
>
> - DAY 01 · 安装与初体验
> - INSTALL · AUTH · INTERACT · PRACTICE
> - 01 · INSTALL
> - 安装方式
> - 02 · AUTH
> - 认证与首次对话
> - 03 · INTERACT
> - 交互模式
> - 04 · PRACTICE
> - 动手练习
> - CLI (npm / Homebrew)
> - VS Code Extension
> - Desktop App (Mac / Win)
> - Web (claude.ai/code)
> - claude login (OAuth)
> - API Key 配置
> - 第一条消息
> - 版本确认
> - 自然语言 → 工具调用
> - 权限确认机制
> - /help · /clear · /history
> - Esc 退出 · 对话恢复
> - 让 Claude 读文件
> - 让 Claude 创建文件
> - 让 Claude 跑命令
> - 观察工具调用过程
> - DELIVERABLES
> - Claude Code 安装成功
> - 完成 OAuth 认证
> - 完成三个动手练习
> - 理解工具调用循环

FIG · Day 01 全景: 安装 → 认证 → 理解交互模式 → 动手实操

## 安装 Claude Code

10 MIN

Claude Code 提供四种使用方式：_CLI 终端_、VS Code 扩展、桌面应用和 Web 应用。 推荐从 CLI 开始——它是功能最完整的入口，理解了 CLI 的交互模型，切换到其他平台就是换个壳。

| 平台 | 安装方式 | 适用场景 | 特点 |
| --- | --- | --- | --- |
| CLI 终端 | `npm install -g @anthropic-ai/claude-code` | 日常开发首选 | 功能最完整，支持所有高级模式 |
| VS Code | 扩展商店搜索「Claude Code」安装 | IDE 集成开发 | 编辑器内直接交互，文件引用方便 |
| Desktop App | 官网下载 Mac / Windows 安装包 | 独立窗口体验 | 支持 Computer Use（控制鼠标键盘） |
| Web App | 访问 claude.ai/code | 无需安装、快速体验 | 云端运行，自带 GitHub 集成 |

### CLI 安装（推荐）

```
# macOS / Linux — 使用 npm 全局安装
$ npm install -g @anthropic-ai/claude-code

# 或者使用 Homebrew (macOS)
$ brew install claude-code

# 验证安装
$ claude --version
claude-code v1.x.x

# 查看帮助
$ claude --help
```

PREREQUISITE

### Node.js 18+

CLI 版本基于 Node.js 运行。如果你还没有 Node.js，先运行 `brew install node` 或从 nodejs.org 下载。用 `node --version` 确认版本 ≥ 18。

TIP

### 选哪个？

如果你主要在终端工作——选 **CLI** 。如果你习惯 VS Code——选 **扩展** 。两者可以同时安装、互不冲突。本路线以 CLI 为主讲解，所有概念通用。

安装完成后不要急着用——下一步先完成认证，否则所有命令都会报错。

## 认证与首次对话

10 MIN

Claude Code 需要连接到 Anthropic API 才能工作。 最简单的方式是 _OAuth 登录_—— 一条命令打开浏览器，登录你的 Anthropic 账号，授权完成，回到终端直接开始。

### Step 1 — 认证

```
# OAuth 登录 (推荐) — 浏览器会自动打开
$ claude login

# 或者用 API Key 方式
$ export ANTHROPIC_API_KEY=sk-ant-xxxxx
$ claude
```

### Step 2 — 启动第一次对话

```
# 进入交互模式
$ claude

╭──────────────────────────────────────╮
│ Claude Code v1.x.x │
│ Type your message or /help │
╰──────────────────────────────────────╯

# 试试你的第一条消息:
> 你好，请告诉我当前目录下有哪些文件

# Claude 会调用 Bash 工具执行 ls，然后回答你
```

> **图：交互循环流程**
>
> - INTERACTION LOOP — HOW CLAUDE CODE WORKS
> - STEP 1
> - 用户输入自然语言
> - "帮我修复这个 bug"
> - STEP 2
> - Claude 分析 → 调用工具
> - Read · Edit · Bash · Write
> - STEP 3
> - 用户确认权限
> - Allow / Deny / Always Allow
> - STEP 4
> - 执行并输出结果
> - LOOP — 继续下一轮对话或追问
> - 默认 Prompt 模式: 每次工具调用都需要你确认。随着信任建立，可以切换到 Auto 模式自动执行安全操作。

FIG · 核心交互循环: 自然语言 → 工具调用 → 权限确认 → 执行输出 → 循环

KEY INSIGHT

### Claude 不是聊天机器人

Claude Code 不只是回答问题——它会 **调用工具** 来完成任务。读文件用 Read 工具，改文件用 Edit 工具，跑命令用 Bash 工具。你的角色是 **审核者** ：确认每个工具调用是否合理。

SECURITY

### 权限确认很重要

第一次使用时，每个工具调用都会弹出确认。这是 **Prompt 模式** （默认）。不要嫌麻烦——先理解 Claude 在做什么，等你熟悉后再开放更多自动权限。安全感来自理解、不来自盲信。

OAuth 认证一次即可，token 会缓存到本地。API Key 方式适合 CI/CD 环境或企业部署。

## 理解交互模式

10 MIN

Claude Code 的交互不是"发消息等回复"的聊天模式—— 它是一个_工具驱动的循环_。 理解这个模型，是高效使用 Claude Code 的前提。

### 常用斜杠命令

| 命令 | 说明 | 使用场景 |
| --- | --- | --- |
| `/help` | 查看所有可用命令和基本用法 | 迷路时的第一选择 |
| `/clear` | 清空当前对话，从零开始 | 切换任务、上下文混乱时 |
| `/history` | 查看历史对话列表 | 恢复之前的工作 |
| `/compact` | 压缩对话历史，释放上下文空间 | 对话变长、响应变慢时 |
| `/config` | 查看当前配置信息 | 确认模型、权限设置 |
| `/usage` | 查看当前会话的 token 用量与费用 | 监控成本 |

### 快捷键与退出

```
# 终端交互快捷键
Esc # 中断当前 Claude 的回答
Ctrl+C # 中断或退出
Enter # 发送消息（单行）
Shift+Enter # 多行输入（换行不发送）

# 恢复之前的对话
$ claude --resume # 从上次对话列表中选择
$ claude --continue # 直接继续最近一次对话

# 直接传入任务（非交互模式）
$ claude "解释一下 package.json 里的 scripts"

# 管道输入
$ cat error.log | claude "分析这个错误日志"
```

CONCEPT

### 工具 vs 文字

Claude 的回答分两部分： **文字输出** （你看到的文本）和 **工具调用** （实际执行的操作）。文字是解释和沟通，工具调用才是做事。学会区分这两者是关键。

CONCEPT

### 权限三选一

工具调用时你有三个选择： **Allow** （允许这一次）、 **Always Allow** （以后同类操作自动允许）、 **Deny** （拒绝）。Always Allow 的规则保存在 `settings.json` 中。

CONCEPT

### 上下文窗口

Claude 每次对话有上下文窗口上限。对话越长，前面的内容会被自动压缩。用 `/compact` 主动压缩，或 `/clear` 彻底重置。长时间工作时注意管理上下文。

记住: /help 是你的救生圈——任何时候不确定怎么做，先试 /help。

## 动手练习

15 MIN

理论到此结束——打开终端，亲手体验。 下面三个练习覆盖 Claude Code 最基础的三种能力： _读文件_、_写文件_、_跑命令_。

### Lab 1 — 让 Claude 读文件

进入任意一个项目目录，让 Claude 阅读并理解一个文件。 观察它如何调用 Read 工具，以及返回的内容格式。

```
# 进入你的项目目录
$ cd ~/my-project
$ claude

# 试试这些提示词:
> 读一下 package.json 的内容
> 这个项目的目录结构是什么样的？
> src/index.ts 这个文件在做什么？

# 观察: Claude 会调用 Read 工具读取文件
# 然后用自然语言给你解释文件内容
```

### Lab 2 — 让 Claude 创建文件

让 Claude 用 Write 工具创建一个新文件。 注意权限确认提示——这是你第一次让 AI 修改你的文件系统。

```
# 让 Claude 创建一个文件
> 在当前目录创建一个 hello.py，内容是打印 "Hello from Claude Code!"

# Claude 会:
# 1. 调用 Write 工具 → 你会看到权限确认弹窗
# 2. 你选择 Allow → 文件被创建
# 3. 验证: 看看文件是否真的在那里

> 运行一下 hello.py

# Claude 会调用 Bash 工具执行 python hello.py
Hello from Claude Code!
```

### Lab 3 — 让 Claude 分析与修改

综合练习：让 Claude 分析代码并做一个小修改。 体验 Read → 分析 → Edit 的完整循环。

```
# 给 Claude 一个稍复杂的任务
> 给 hello.py 加上一个 main 函数，并添加当前时间的输出

# Claude 会:
# 1. Read hello.py — 读取当前内容
# 2. Edit hello.py — 用 Edit 工具修改文件（非全量覆盖）
# 3. 可能还会 Bash python hello.py — 验证修改是否正确

# 观察 Edit 工具的输出: 它只展示变更的部分（diff）
# 而不是整个文件，这比 Write 更精确
```

OBSERVATION

### 观察工具调用的规律

完成三个 Lab 后，回顾一下你看到的工具调用模式： **Read → 理解 → Edit/Write → Bash 验证** 。这就是 Claude Code 工作的基本循环。Day 02 你会深入学习每个工具的细节。

CHALLENGE

### 附加挑战

试试用一句话让 Claude 完成一个稍复杂的任务，比如：_"创建一个 Python 脚本，读取当前目录所有 .md 文件并统计总行数"_。观察 Claude 如何把一个模糊需求分解为多步操作。

练习时留意工具调用的"成本": 每次调用都消耗 token。用 /usage 看看三个 Lab 花了多少 token。

## 常见疑问

5 QUESTIONS

### Q1 · Claude Code 和 ChatGPT / Cursor / GitHub Copilot 有什么区别？

ANS

核心区别在于 **代理能力** 。Copilot 做的是"你写代码时给建议"，本质是自动补全。Claude Code 做的是"你说目标，它自己操作"——它能读文件、改文件、跑命令、搜索代码库、创建 PR、管理 Git。它不只是一个补全引擎，而是一个有完整工具链的 **AI 编程代理** 。

### Q2 · Claude Code 是免费的吗？费用怎么算？

ANS

Claude Code 工具本身免费，但调用 Claude API 需要 **按 token 计费** 。你可以通过 Anthropic 个人订阅（Pro/Max 计划包含一定用量）或 API Key 按量付费。用 `/usage` 命令随时查看当前会话的 token 用量和费用。日常开发一般几美分到几美元不等。

### Q3 · Claude Code 会不会误删我的文件或搞坏我的代码？

ANS

默认的 **Prompt 模式** 下，每个工具调用都需要你确认。Claude 不会在你不知情的情况下修改任何文件。即便你开了 Auto 模式，Claude 也有内置的安全规则——它会对危险操作（如 `rm -rf`、`git push --force`）额外警告。另外，用 Git 管理的项目可以随时回滚。 **养成先 commit 再让 Claude 修改的习惯** 是最好的保险。

### Q4 · 我的代码会被发送到 Anthropic 服务器吗？安全吗？

ANS

是的，对话中涉及的文件内容会作为上下文发送到 Anthropic API。Anthropic 承诺 **不使用 API 输入/输出来训练模型** 。企业用户可以选择 Zero-Data Retention (ZDR) 模式，确保数据不被存储。如果你的项目有高度敏感代码（如密钥、专利算法），应使用 `.gitignore` 和权限配置排除这些文件。

### Q5 · 我可以用中文和 Claude Code 交流吗？

ANS

完全可以。Claude 对中文的理解和生成能力很强，日常使用中英混合也没有问题。不过有两点注意：(1) **代码和命令部分建议用英文** ——变量名、commit message 等用英文更规范；(2) 如果你发现 Claude 回复的语言和你的不一致，可以在 CLAUDE.md 中写明「请用中文回复」（Day 03 会学到）。

## 复盘问题

5 QUESTIONS

1. Claude Code 的四大核心工具是哪些？分别对应什么操作？（读、写、改、执行）
2. 描述 Claude Code 的交互循环：从用户输入到得到结果经过了哪几步？
3. Prompt 模式和 Auto 模式的区别是什么？什么时候应该用哪个？
4. 如果你发现 Claude 执行了一个你不想要的操作（比如改错了文件），你有哪些补救方式？
5. 用 `/usage` 查看你今天练习消耗了多少 token，思考哪些操作最"贵"。

## 今日检查清单

7 ITEMS

- Claude Code CLI 安装成功，`claude --version` 输出版本号
- 通过 OAuth 或 API Key 完成认证
- 在终端中启动了 Claude Code 交互会话
- 完成 Lab 1：让 Claude 读取并解释了一个文件
- 完成 Lab 2：让 Claude 创建了一个新文件并运行
- 完成 Lab 3：让 Claude 分析并修改了一个文件
- 能说清"自然语言 → 工具调用 → 权限确认 → 执行输出"的交互循环

## 推荐阅读

3 ITEMS

OFFICIAL

### Claude Code 快速入门

Anthropic 官方文档的 Getting Started 页面，5 分钟过一遍安装、认证、基本用法。本页内容的权威参考源。

TUTORIAL

### Claude Code: Best Practices

Anthropic 官方的最佳实践指南，涵盖 CLAUDE.md 编写、上下文管理、权限配置等进阶话题。可以先浏览目录，后续天数逐步学习。

COMMUNITY

### Claude Code GitHub Issues

github.com/anthropics/claude-code/issues — 社区问题与讨论。遇到安装或使用问题时的排查入口。

## Day 02 预告

NEXT

COMING NEXT

### 四大核心工具 — Read · Edit · Write · Bash

深入学习每个工具的能力边界：Read 的 offset/limit 参数、Edit 的精准替换 vs Write 的全量覆盖、Bash 的超时与后台执行。掌握工具选择的判断标准——什么时候用 Edit 而不是 Write，什么时候用 Bash 而不是专用工具。

"The best way to learn a tool is to use it on a real problem, not a tutorial."

DAY 01 · CLAUDE CODE 20-DAY ROADMAP
