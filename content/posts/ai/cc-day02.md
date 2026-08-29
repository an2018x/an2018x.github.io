---
title: "Day 02 · 四大核心工具 — Read · Edit · Write · Bash"
date: '2026-05-16'
draft: false
description: "深入掌握 Claude Code 的四把瑞士军刀：Read 的精准阅读、Edit 的外科手术式修改、Write 的全量创建、Bash 的系统操作。建立工具选择的直觉判断。"
toc: true
tags:
  - AI
  - Claude Code
  - Tooling
  - Tutorial
---

DAY 02 · CLAUDE CODE ROADMAP · 20 DAYS

# 四把_瑞士军刀_

Claude Code 的一切操作都通过四个工具实现： Read 读取文件、Edit 精准修改、Write 全量写入、Bash 执行命令。 今天你将深入理解每个工具的参数、能力边界和使用场景， 建立"什么情况用什么工具"的直觉判断。

**DURATION** 40–55 min **THEORY** 20 min **HANDS-ON** 25 min **REVIEW** 10 min **TOOLS** Read · Edit · Write · Bash

## 思维导图

OVERVIEW

> **图：Day 02 思维导图**
>
> - DAY 02 · 四大核心工具
> - READ · EDIT · WRITE · BASH
> - 01 · READ
> - 精准阅读
> - 02 · EDIT
> - 外科手术式修改
> - 03 · WRITE
> - 全量写入
> - 04 · BASH
> - 系统操作
> - file\_path (绝对路径)
> - offset / limit 分段读
> - 图片 / PDF / Notebook
> - 只读，不能读目录
> - old\_string → new\_string
> - replace\_all 批量替换
> - 必须先 Read 才能 Edit
> - old\_string 必须唯一
> - file\_path + content
> - 覆盖写入 / 创建新文件
> - 已有文件必须先 Read
> - 创建新文件的首选
> - command 执行任意命令
> - timeout 超时控制
> - run\_in\_background
> - 工作目录持久化
> - DELIVERABLES
> - 掌握每个工具的参数
> - 理解 Edit vs Write 区别
> - 完成四个动手练习
> - 建立工具选择直觉
> - GOLDEN RULE
> - 专用工具优先于 Bash · Edit 优先于 Write · 只读操作无需确认 · 先 Read 再改

FIG · Day 02 全景: 四大工具的参数、边界与选择策略

## Read — 精准阅读

10 MIN

Read 是 Claude Code 的"眼睛"——它通过读取文件内容来理解你的代码库。 不同于 `cat` 命令的暴力输出，Read 支持 _分段读取_，可以精准读取大文件的某一部分， 还能解析图片、PDF 和 Jupyter Notebook。

### 参数一览

| 参数 | 类型 | 说明 | 示例 |
| --- | --- | --- | --- |
| `file_path` | string (必填) | 文件的绝对路径 | /Users/me/project/src/app.ts |
| `offset` | number (可选) | 从第几行开始读取（从 0 开始） | offset: 100 → 从第 101 行开始 |
| `limit` | number (可选) | 读取多少行，默认 2000 行 | limit: 50 → 只读 50 行 |
| `pages` | string (可选) | PDF 专用，指定页码范围 | pages: "1-5" → 读前 5 页 |

### 使用示例

```
# 基础用法: 读取整个文件
> 读一下 src/index.ts
# Claude 调用 Read(file_path="/abs/path/src/index.ts")
# 返回 cat -n 格式，带行号

# 大文件分段读取: 只读中间部分
> 读 src/utils.ts 的第 200 到 250 行
# Claude 调用 Read(file_path="...", offset=199, limit=51)

# 读取图片 (多模态能力)
> 看看 docs/screenshot.png 里面是什么
# Claude 会视觉解析图片内容并描述

# 读取 PDF (大 PDF 必须指定页码)
> 读一下 paper.pdf 的前 5 页
# Claude 调用 Read(file_path="...", pages="1-5")

# 读取 Jupyter Notebook
> 分析 analysis.ipynb 的内容
# 返回所有 cell 及其输出
```

KEY RULE

### Read 只读文件，不读目录

想看目录结构？用 `ls` 或 `find`（通过 Bash 工具）。Read 只能接受文件路径。如果给了目录路径，会报错。

WHEN NOT TO USE

### 别用 Bash cat 代替 Read

Claude 有内置规则： **能用 Read 就不用 Bash cat** 。Read 工具有格式化输出（行号）、文件缓存、图片解析等专属能力。用 Bash cat 读文件是反模式——效率低、无行号、无法读图片。

Read 是只读操作，不需要权限确认（在 Prompt 模式下自动允许）。这是最安全的工具。

## Edit — 外科手术式修改

10 MIN

Edit 是 Claude Code 最精密的工具——它执行_精确字符串替换_。 不是重写整个文件，而是像外科手术一样，只替换需要改变的部分。 这让代码审查变得容易：你能清楚看到 Claude 到底改了什么。

### 参数一览

| 参数 | 类型 | 说明 | 关键细节 |
| --- | --- | --- | --- |
| `file_path` | string (必填) | 要修改的文件的绝对路径 | 必须已经 Read 过此文件 |
| `old_string` | string (必填) | 要被替换的原文本 | 必须在文件中唯一匹配 |
| `new_string` | string (必填) | 替换后的新文本 | 必须与 old\_string 不同 |
| `replace_all` | boolean (可选) | 是否替换所有匹配项 | 默认 false，用于批量重命名 |

### 工作机制

```
# Edit 的核心逻辑: 精确字符串替换
# 1. Claude 先 Read 文件，获取当前内容
# 2. 在内容中找到 old_string 的精确匹配
# 3. 替换为 new_string
# 4. 写回文件

# 示例: 修改函数名
Edit(
  file_path: "/project/src/utils.ts",
  old_string: "function getCwd()",
  new_string: "function getCurrentWorkingDirectory()"
)

# 示例: 批量替换变量名
Edit(
  file_path: "/project/src/app.ts",
  old_string: "userName",
  new_string: "currentUser",
  replace_all: true
)
```

CRITICAL RULE

### old\_string 必须唯一

如果 old\_string 在文件中出现了多次，Edit 会 **报错而不是执行** 。解决方法：(1) 提供更多上下文让 old\_string 变唯一，(2) 或使用 `replace_all: true` 替换所有匹配项。

PREREQUISITE

### 必须先 Read 再 Edit

Claude 在当前对话中 **必须已经读取过这个文件** 才能 Edit。这是安全机制——防止 Claude 在不了解文件全貌的情况下盲目修改。如果你看到 Edit 失败，通常是因为文件还没被 Read 过。

TIP

### 保留缩进格式

Edit 进行的是精确字符串匹配，包括空格和缩进。如果 old\_string 中的缩进与文件实际内容不一致（比如用了空格但文件用的是 Tab），Edit 会匹配失败。Claude 会自动处理这个问题，但如果你手动构造 Edit，注意保持格式一致。

PATTERN

### 典型 Edit 工作流

**Read → 分析 → Edit → 验证** 。Claude 通常会：(1) Read 文件了解上下文，(2) 分析需要改什么，(3) Edit 只改必要的部分，(4) 可能再 Read 或 Bash 验证结果。这个四步循环是 Edit 的标准模式。

Edit 是修改已有文件的首选工具——它只发送变更部分（diff），比 Write 更高效、更可审查。

## Write — 全量写入

8 MIN

Write 是最直接的工具——给一个路径和内容，_整个文件被覆盖_。 它是创建新文件的首选，但对已有文件来说，通常是 Edit 用不了时的备选方案。

### 参数一览

| 参数 | 类型 | 说明 | 关键细节 |
| --- | --- | --- | --- |
| `file_path` | string (必填) | 要写入的文件的绝对路径 | 已有文件会被完全覆盖 |
| `content` | string (必填) | 要写入的完整内容 | 这是文件的全部内容 |

### Edit vs Write 决策

```
# ✅ 用 Write 的场景:
# 1. 创建全新文件
> 创建一个 src/helpers/format.ts

# 2. 文件需要完全重写 (改动超过 50%)
> 把这个文件从 JavaScript 重写为 TypeScript

# 3. 生成配置文件
> 生成一个 .eslintrc.json 配置文件

# ❌ 不用 Write 的场景:
# 1. 只改几行 → 用 Edit
> 把第 42 行的 bug 修掉
# Claude 应该用 Edit，不是 Write 整个文件

# 2. 重命名变量 → 用 Edit + replace_all
> 把所有 userName 改成 currentUser

# 3. 添加一个导入语句 → 用 Edit
> 在文件顶部加上 import dayjs
```

SAFETY

### 已有文件必须先 Read

和 Edit 一样，Write 也要求 **先 Read 已有文件** 才能覆盖。这是防止误覆盖的安全机制——如果文件不存在（创建新文件），则不需要 Read。

PRINCIPLE

### Edit 优先于 Write

Claude 的内置原则是 **优先使用 Edit** 修改已有文件。Write 整个文件意味着你在代码审查时要检查全部内容，而 Edit 只需要看 diff。如果 Claude 对一个小改动用了 Write，可以在 CLAUDE.md 中强调「prefer Edit over Write」。

Write 的覆盖行为是不可逆的——如果担心，先 git commit 当前状态再让 Claude 修改。

## Bash — 系统操作

12 MIN

Bash 是 Claude Code 的"双手"——它能执行_任何 shell 命令_。 从 `git status` 到 `npm test`， 从 `curl` 到 `python script.py`， 只要终端能跑的，Bash 工具都能执行。

### 参数一览

| 参数 | 类型 | 说明 | 关键细节 |
| --- | --- | --- | --- |
| `command` | string (必填) | 要执行的 shell 命令 | 支持管道、重定向、链式命令 |
| `timeout` | number (可选) | 超时时间（毫秒），最大 600000 | 默认 120000 (2 分钟) |
| `run_in_background` | boolean (可选) | 在后台执行，完成后通知 | 适合长时间运行的任务 |
| `description` | string (可选) | 命令的简要描述 | 显示在权限确认中 |

### 常见用法

```
# 基础: 查看目录结构
> 列出项目的目录结构
# Claude 执行: ls -la 或 find . -type f

# 运行测试
> 跑一下测试看看有没有通过
# Claude 执行: npm test 或 pytest

# 搜索代码
> 在项目里搜索所有用到 getUserId 的地方
# Claude 执行: grep -rn "getUserId" .

# Git 操作
> 查看最近 5 条提交记录
# Claude 执行: git log --oneline -5

# 链式命令 (用 && 连接顺序依赖)
# Claude 执行: npm install && npm run build

# 后台执行 (长时间运行的任务)
# Claude 执行: npm run dev (run_in_background: true)
# 你可以继续工作，完成后 Claude 会通知你
```

### 工作目录与状态

```
# 工作目录在命令之间持久化
> 进入 src 目录
# Claude 执行: cd src
# 之后的 Bash 命令都在 src/ 下执行

# 但 shell 状态不持久化 (环境变量、别名等)
# 每次 Bash 调用都是新的 shell 环境
# 如果需要设置环境变量，要在同一条命令中使用:
Bash("export NODE_ENV=test && npm test")
# ✅ 正确: 同一条命令

Bash("export NODE_ENV=test")
Bash("npm test")
# ❌ 错误: NODE_ENV 在第二条中不存在
```

GOLDEN RULE

### 专用工具优先于 Bash

Claude 的内置原则是： **能用专用工具就不用 Bash** 。读文件用 Read 而非 `cat`，改文件用 Edit 而非 `sed`，写文件用 Write 而非 `echo >`。Bash 只用于 shell-only 操作：git、npm、测试、搜索、构建。

TIMEOUT

### 超时与后台执行

默认 2 分钟超时，最长可设 10 分钟（600000ms）。如果任务会跑很久（启动开发服务器、运行完整测试套件），用 `run_in_background: true`——Claude 会在后台执行并在完成后通知你。

SAFETY

### 危险命令的双重防护

Bash 是最强大也最危险的工具。Claude 对 `rm -rf`、`git push --force`、`DROP TABLE` 等危险命令有额外警告机制。但你仍然是最后一道防线—— **认真读每个 Bash 命令再确认** 。

TIP

### 并行调用

Claude 可以在同一轮中发起多个独立的 Bash 调用（比如同时跑 `git status` 和 `git diff`）。如果你看到 Claude 在等一个命令结果才发下一个，说明它们之间有依赖关系。

Bash 是权限最敏感的工具——在 Prompt 模式下，每条命令都需要你审批。

## 工具选择决策树

DECISION GUIDE

掌握工具不只是知道每个工具能做什么——更重要的是知道 _什么时候用哪个_。 下面的决策树帮你建立直觉。

> **图：工具选择决策树**
>
> - TOOL SELECTION DECISION TREE
> - 你要做什么操作？
> - 读取内容
> - 文件 or 目录?
> - Read
> - 文件
> - Bash ls
> - 目录
> - 修改文件
> - 改动量多大?
> - Edit
> - 局部修改
> - Write
> - 大幅重写
> - 创建新文件
> - 始终用 Write
> - 执行操作
> - Bash
> - git / npm / test / ...
> - SUMMARY
> - Read = 看 · Edit = 改 · Write = 建 · Bash = 跑
> - 能用专用工具就不用 Bash · 能用 Edit 就不用 Write · 改之前先 Read

FIG · 工具选择决策树: 根据操作类型和改动量选择合适的工具

### 四大工具对比总表

| 维度 | Read | Edit | Write | Bash |
| --- | --- | --- | --- | --- |
| 核心能力 | 读取文件内容 | 精确字符串替换 | 覆盖/创建文件 | 执行 shell 命令 |
| 权限需求 | 无需确认 | 需要确认 | 需要确认 | 需要确认 |
| 前置要求 | 无 | 必须先 Read | 已有文件须先 Read | 无 |
| 改动粒度 | 只读 | 行级/片段级 | 文件级（全量） | 系统级 |
| 可逆性 | 天然可逆（无修改） | 高（diff 可见） | 低（覆盖写入） | 取决于命令 |
| 审查难度 | 无需审查 | 低（只看 diff） | 高（检查全文） | 中（检查命令） |
| 典型场景 | 理解代码 | 修 bug、重构 | 新建文件、生成配置 | 测试、构建、Git |

记住这张表——这是你审核 Claude 工具调用时的参考。如果 Claude 用了"错误"的工具，你应该 Deny 并引导它用更合适的工具。

## 动手练习

20 MIN

每个工具配一个练习——观察 Claude 如何选择工具， 思考为什么它选择了这个而不是那个。

### Lab 1 — Read 的分段读取

选一个大文件（100+ 行），测试 offset / limit 参数。

```
# 找一个大文件
> 项目里最长的源码文件是哪个？有多少行？
# Claude 会用 Bash: find + wc -l 来查找

# 分段读取
> 只读那个文件的第 50 到 80 行
# 观察: Claude 使用 Read 的 offset 和 limit 参数

# 对比: 读取整个文件 vs 分段读取的 token 消耗
> /usage
```

### Lab 2 — Edit 的精确替换

创建一个测试文件，练习 Edit 的精确替换和 replace\_all。

```
# 先创建一个测试文件
> 创建 test-edit.js，内容包含三个函数: getUserName、getUserAge、getUserEmail

# 精确替换一个函数名
> 把 getUserName 改成 fetchUserName
# 观察: Claude 用 Edit，只改了一个函数名

# 批量替换
> 把所有 getUser 开头的函数都改成 fetchUser 开头
# 观察: Claude 可能用多次 Edit 或 Edit + replace_all

# 故意测试唯一性约束
> 把所有 return 改成 return /* modified */
# 观察: 如果有多个 return，Claude 如何处理
```

### Lab 3 — Write vs Edit 的边界

让 Claude 做一个大改动，观察它选择 Write 还是 Edit。

```
# 小改动: 应该用 Edit
> 在 test-edit.js 的顶部加一行注释 "// Created for learning"
# 预期: Claude 用 Edit

# 大改动: 可能用 Write
> 把 test-edit.js 从 JavaScript 完全重写为 TypeScript，加上类型注解
# 预期: 如果改动超过 50%，Claude 可能用 Write

# 新建文件: 一定用 Write
> 创建一个 test-edit.test.ts 测试文件
# 预期: Claude 用 Write (新文件)
```

### Lab 4 — Bash 的进阶用法

测试 Bash 工具的超时控制和后台执行。

```
# 基础: 查看 Git 状态
> 查看 git 状态和最近的提交
# Claude 可能并行调用 git status 和 git log

# 链式命令
> 安装依赖然后运行测试
# Claude 执行: npm install && npm test

# 搜索代码 (grep)
> 在项目里搜索所有 TODO 注释
# Claude 执行: grep -rn "TODO" . --include="*.ts"

# 清理测试文件
> 删除我们刚创建的 test-edit.js 和 test-edit.test.ts
# 观察: Claude 会使用 Bash rm，并且要求你确认
```

OBSERVATION

### 观察 Claude 的工具选择

做完四个 Lab，回顾 Claude 的每个工具调用决策。有没有 Claude 选了"不太合适"的工具的情况？在 Day 03 你会学到如何通过 CLAUDE.md 引导 Claude 的工具选择偏好。

CHALLENGE

### 综合挑战

用一句话给 Claude 一个综合任务：_"读取 package.json，在 scripts 中添加一个 lint 命令，然后执行它"_。观察 Claude 如何串联 Read → Edit → Bash 三个工具完成任务。

练习时用 /usage 对比每个 Lab 的 token 消耗，体会哪些操作更"贵"——Read 大文件 vs Read 片段的差距尤其明显。

## 常见疑问

5 QUESTIONS

### Q1 · Claude 选错了工具怎么办？比如该用 Edit 却用了 Write。

ANS

你有三个应对方式：(1) 在权限确认时选择 **Deny** ，然后告诉 Claude「请用 Edit 而不是 Write」；(2) 在 `CLAUDE.md` 中写明偏好规则，比如 _"Always prefer Edit over Write for existing files"_（Day 03 会学到）；(3) 接受这次 Write，但在回复中纠正 Claude，它会在后续调用中学习你的偏好。

### Q2 · Edit 的 old\_string 匹配不到怎么办？

ANS

最常见的原因是 **缩进或空白不一致** ——文件用了 Tab 但 old\_string 用了空格，或者有尾随空格。Claude 通常会自动 Read 文件来获取精确内容，然后构造匹配的 old\_string。如果仍然失败，它会尝试加入更多上下文（比如多包含几行）来确保唯一匹配。极少数情况下，Claude 会退回 Write 整个文件。

### Q3 · Read 能读二进制文件吗？比如图片或编译产物。

ANS

Read 对图片有 **多模态支持** ——可以读取 PNG、JPG 等图片并视觉理解内容。也支持 PDF 文件（大 PDF 需要指定 `pages` 参数，每次最多 20 页）。但对编译产物（.o、.wasm 等）和其他二进制文件，Read 无法解析有意义的内容。如果你需要检查二进制文件，可以通过 Bash 使用 `file`、`xxd` 或 `hexdump` 等工具。

### Q4 · Bash 命令可以交互式输入吗？比如 git rebase -i。

ANS

**不支持交互式输入** 。Bash 工具只能执行非交互式命令——像 `git rebase -i`、`vim`、`git add -i` 这类需要用户在过程中输入的命令无法使用。替代方案是用非交互式的等价命令，比如用 `git rebase --onto` 代替 `git rebase -i`，用 `git add <file>` 代替 `git add -i`。

### Q5 · 多个工具调用的顺序是谁决定的？我能控制吗？

ANS

工具调用顺序由 Claude 自主决定。它会分析任务需要哪些步骤，然后按逻辑顺序调用。 **独立的工具调用可以并行** （比如同时 Read 两个文件），有依赖关系的则顺序执行（比如必须先 Read 才能 Edit）。你可以通过更精确的指令来影响顺序，比如说"先看看文件内容，再决定怎么改"就会让 Claude 先 Read 再计划修改策略。

## 复盘问题

5 QUESTIONS

1. Read 工具的 `offset` 和 `limit` 参数分别控制什么？为什么分段读取比读取整个文件更好？
2. Edit 工具要求 old\_string 必须唯一——如果不唯一，有哪两种解决方案？
3. 在什么场景下应该用 Write 而不是 Edit？列举至少三种情况。
4. Bash 工具的 `run_in_background` 参数适用于什么场景？它和 `timeout` 参数的关系是什么？
5. 说出"专用工具优先于 Bash"这条原则的三个具体例子（哪些操作应该用专用工具而不是 Bash）。

## 今日检查清单

7 ITEMS

- 能说出 Read、Edit、Write、Bash 各自的核心参数
- 理解 Edit 的 old\_string 唯一性要求和 replace\_all 的用途
- 知道 Edit 和 Write 都要求先 Read 已有文件
- 掌握 Edit vs Write 的选择标准：局部修改 vs 大幅重写/新建
- 理解 Bash 的超时机制和后台执行模式
- 完成四个 Lab 并观察了 Claude 的工具选择规律
- 能用决策树快速判断一个任务应该用哪个工具

## 推荐阅读

3 ITEMS

OFFICIAL

### Claude Code Tool Use Guide

Anthropic 官方文档中关于工具使用的部分，详细描述了每个工具的参数、限制和最佳实践。建议精读 Read 和 Edit 部分。

REFERENCE

### Claude Code CLI Reference

claude --help 的完整输出文档——包含所有命令行参数和环境变量。今天用到的 --resume、--continue 等参数都在这里有详细说明。

DEEP DIVE

### Claude Code Best Practices

Anthropic 官方最佳实践指南的"工具使用"章节——涵盖何时用 Edit vs Write、如何高效使用 Bash、以及常见反模式的避免策略。

## Day 03 预告

NEXT

COMING NEXT

### CLAUDE.md 与项目配置

学习 Claude Code 的"记忆系统"——通过 CLAUDE.md 文件告诉 Claude 你的项目规范、编码偏好和工作流约定。掌握 settings.json 的权限配置、.claude/ 目录结构，以及如何用 /init 命令自动生成项目上下文文件。让 Claude 从"通用助手"变成"你的专属团队成员"。

"Give me six hours to chop down a tree and I will spend the first four sharpening the axe."

DAY 02 · CLAUDE CODE 20-DAY ROADMAP
