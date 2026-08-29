---
title: "Day 03 · CLAUDE.md 与项目配置"
date: '2026-05-16'
draft: false
description: "通过 CLAUDE.md 告诉 Claude 你的项目规范与偏好，掌握 settings.json 权限配置、.claude/ 目录结构和 Memory 跨会话记忆——让 Claude 从通用助手变成你的专属团队成员。"
toc: true
tags:
  - AI
  - Claude Code
  - Tooling
  - Tutorial
---

DAY 03 · CLAUDE CODE ROADMAP · 20 DAYS

# 给 Claude 一份_项目说明书_

没有 CLAUDE.md 的 Claude Code 像一个新来的实习生——能力很强，但对你的项目一无所知。 今天你将学习如何通过配置文件告诉 Claude 你的技术栈、编码规范和工作习惯， 让它从"通用助手"变成_你的专属团队成员_。

**DURATION** 40–50 min **THEORY** 15 min **HANDS-ON** 20 min **REVIEW** 10 min **FILES** CLAUDE.md · settings.json · .claude/

## 思维导图

OVERVIEW

> **图：Day 03 思维导图**
>
> - DAY 03 · 项目配置
> - CLAUDE.MD · SETTINGS · DIRECTORY · MEMORY
> - 01 · CLAUDE.MD
> - 项目指令
> - 02 · SETTINGS
> - 权限与配置
> - 03 · .CLAUDE/
> - 目录结构
> - 04 · MEMORY
> - 跨会话记忆
> - 项目规范 / 技术栈
> - 编码偏好 / 禁忌
> - 三级层叠机制
> - /init 自动生成
> - settings.json 权限
> - settings.local.json
> - 全局 vs 项目配置
> - /config 命令
> - settings / settings.local
> - .mcp.json (MCP 配置)
> - agents/ · skills/ · rules/
> - hooks/ 钩子脚本
> - /memory 命令
> - 用户偏好 / 项目事实
> - 自动学习 / 手动保存
> - MEMORY.md 索引
> - DELIVERABLES
> - 编写项目 CLAUDE.md
> - 配置 settings.json
> - 理解 .claude/ 目录
> - 测试 Memory 记忆
> - GOLDEN RULE
> - CLAUDE.md 是给 Claude 看的，不是给人看的 — 写你希望 Claude 怎么做，而不是项目文档

FIG · Day 03 全景: CLAUDE.md 指令 → Settings 权限 → 目录结构 → Memory 记忆

## CLAUDE.md — 项目指令文件

12 MIN

CLAUDE.md 是 Claude Code 的_系统提示词_—— 每次 Claude 启动时都会自动读取它，作为对话的背景知识。 把它理解为你写给 AI 队友的"新人入职文档"： 项目是什么、用了哪些技术、有哪些规矩必须遵守。

### 一份好的 CLAUDE.md 包含什么

| 板块 | 内容 | 示例 |
| --- | --- | --- |
| 项目概述 | 一两句话说清楚这个项目是什么 | "这是一个用 Next.js 14 构建的电商后台系统" |
| 技术栈 | 语言、框架、构建工具、包管理器 | "TypeScript + React + Prisma + PostgreSQL" |
| 编码规范 | 命名风格、代码风格、文件组织方式 | "用 kebab-case 命名文件，组件用 PascalCase" |
| 常用命令 | 构建、测试、部署的命令 | "npm run dev 启动开发服务器" |
| 禁忌 | 绝对不能做的事 | "不要修改 migrations/ 下的已有文件" |
| 偏好 | Claude 的行为偏好 | "回复用中文，代码注释用英文" |

### CLAUDE.md 示例

```
# CLAUDE.md — 项目指令文件

## 项目概述
这是一个用 Hugo + PaperMod 主题构建的个人技术博客。
内容以 AI、系统设计和编程学习笔记为主。

## 技术栈
- 静态站点生成器: Hugo
- 主题: PaperMod (自定义扩展)
- 部署: GitHub Pages
- 内容格式: Markdown + HTML (纸感学术风)

## 编码规范
- HTML 文件使用 CSS namespace 隔离样式 (如 .day01-wrap)
- 每个页面的 CSS 写在页面内部 <style> 标签中
- 颜色使用 CSS 变量: --ivory, --clay, --slate 等
- 中文内容为主，代码和命令用英文

## 常用命令
- hugo server -D --port 1313 # 本地预览
- hugo # 构建静态文件

## 禁忌
- 不要修改 themes/ 目录下的原始主题文件
- 不要在 CSS 中使用 !important
- 不要创建 README 或文档文件除非明确要求

## 行为偏好
- 回复用中文
- 优先使用 Edit 而非 Write 修改文件
- 修改文件前先 git commit 当前状态
```

### 三级层叠机制

CLAUDE.md 不只有项目根目录一份——它有_三个层级_，像 CSS 一样层叠生效。

> **图：CLAUDE.md 三级层叠**
>
> - CLAUDE.MD HIERARCHY — THREE LEVELS
> - LEVEL 1 · GLOBAL
> - ~/.claude/CLAUDE.md
> - 所有项目通用的个人偏好
> - LEVEL 2 · PROJECT
> - project/CLAUDE.md
> - 项目级规范，团队共享 (git)
> - LEVEL 3 · SUBDIRECTORY
> - 子目录/CLAUDE.md
> - 子目录特有的规则覆盖
> - 优先级: 低
> - 推荐: 从这里开始
> - 优先级: 高
> - "回复用中文"
> - "prefer Edit over Write"
> - "技术栈: Hugo + PaperMod"
> - "不要修改 themes/ 目录"
> - "api/ 下用 REST 规范"
> - "tests/ 下用 Jest + MSW"
> - 所有层级同时生效并合并——子目录规则覆盖项目级规则，项目级覆盖全局规则

FIG · CLAUDE.md 三级层叠: 全局 → 项目 → 子目录，后者覆盖前者

KEY INSIGHT

### 写给 Claude 看，不是写给人看

CLAUDE.md 不是 README——它的读者是 AI，不是人。写法应该是 **直接的指令** ，而非解释性文档。比如写「回复用中文」而不是「本项目的官方语言是中文，所以 Claude 应该...」。简洁、明确、可执行。

QUICK START

### /init 自动生成

不知道从哪写起？在项目根目录运行 `/init` 命令——Claude 会分析你的项目结构、package.json、技术栈，然后自动生成一份 CLAUDE.md 初稿。你在此基础上修改远比从空白开始容易。

CLAUDE.md 应该提交到 Git——它是项目规范的一部分，团队成员共享同一份指令。

## settings.json — 权限与环境

10 MIN

CLAUDE.md 告诉 Claude _应该怎么做_， settings.json 告诉 Claude _被允许做什么_。 它是权限控制的核心——哪些工具可以自动执行、哪些环境变量可用、哪些命令被禁止。

### 配置层级

| 文件 | 位置 | 作用 | 是否提交 Git |
| --- | --- | --- | --- |
| 全局配置 | `~/.claude/settings.json` | 所有项目通用的权限规则 | 否（个人目录） |
| 项目配置 | `.claude/settings.json` | 团队共享的项目级权限 | 是 — 团队共享 |
| 本地配置 | `.claude/settings.local.json` | 个人的项目级偏好 | 否（已在 .gitignore） |

### settings.json 结构

```
// .claude/settings.json — 项目级权限配置
{
  // 允许自动执行的 Bash 命令前缀
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Bash(npm run lint)",
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git log)",
      "Bash(ls)",
      "Bash(find)",
      "Bash(grep)"
    ],
    "deny": [
      "Bash(rm -rf)",
      "Bash(git push --force)",
      "Bash(git reset --hard)"
    ]
  },

  // 环境变量
  "env": {
    "NODE_ENV": "development"
  }
}
```

HOW IT WORKS

### 权限匹配是前缀匹配

allow 规则用前缀匹配——`"Bash(npm test)"` 会匹配所有以 `npm test` 开头的命令，包括 `npm test -- --watch`。deny 规则的优先级高于 allow——如果同时匹配 allow 和 deny，deny 生效。

TIP

### 当你点 Always Allow 时

在 Prompt 模式下点击 **Always Allow** ，Claude 会把对应的规则自动写入 `settings.local.json`。这就是为什么个人配置不需要手写——通过日常使用自然积累。你可以用 `/config` 查看当前所有权限规则。

团队协作时，把安全基线（deny 规则 + 常用 allow 规则）放进 .claude/settings.json 提交 Git，个人偏好留给 settings.local.json。

## .claude/ 目录全景

8 MIN

`.claude/` 是 Claude Code 在你项目中的"家"—— 所有配置、自定义扩展和运行时数据都住在这里。 今天先认识每个文件的作用，后续课程会深入每个子目录。

> **图：.claude/ 目录结构**
>
> - .CLAUDE/ DIRECTORY STRUCTURE
> - .claude/
> - settings.json
> - ← 权限规则 (提交 Git)
> - settings.local.json
> - ← 个人偏好 (gitignored)
> - .mcp.json
> - ← MCP 服务器配置 (Day 13)
> - agents/
> - ← 自定义子代理 (Day 15)
> - skills/
> - ← 自定义斜杠命令 (Day 11)
> - rules/
> - ← 路径级规则文件
> - hooks/
> - ← 工具执行钩子脚本 (Day 10)
> - 今天学习
> - 后续课程
> - 今天重点掌握 settings.json / settings.local.json — 其余子目录在后续课程深入

FIG · .claude/ 目录全景: 两个配置文件 + 五个扩展子目录

IMPORTANT

### .gitignore 规则

Claude Code 自动在 `.claude/.gitignore` 中排除了 `settings.local.json` 和运行时数据。`settings.json` 和 `.mcp.json` 会提交到 Git——确保里面不包含敏感信息（API Key 等放环境变量或 local 配置中）。

PREVIEW

### 后续课程路线

这些子目录各有专属课程： **hooks/** （Day 10）、 **skills/** （Day 11）、 **.mcp.json** （Day 13）、 **agents/** （Day 15）。今天你只需要知道它们存在——不要提前去改它们。

.claude/ 目录是自动创建的——第一次运行 claude 命令时就会在项目根目录生成。

## Memory — 跨会话记忆

10 MIN

CLAUDE.md 是你_手动写的_指令， Memory 是 Claude _自动学习的_知识。 它在对话过程中捕捉你的偏好、纠正和项目上下文，保存为持久化的记忆文件， 在后续对话中自动加载。

### Memory 的工作方式

```
# 查看当前 Memory
> /memory
# 显示所有已保存的记忆条目

# 手动要求记忆
> 记住: 这个项目的测试框架是 Vitest 而不是 Jest
# Claude 会保存到 Memory 文件中

# 自动学习 (你不需要做任何事)
> 不要用 var，用 const 和 let
# Claude 可能自动记住你的编码偏好

# 要求遗忘
> 忘掉关于测试框架的记忆
# Claude 会找到并删除相关记忆
```

### Memory 的四种类型

| 类型 | 保存什么 | 示例 |
| --- | --- | --- |
| user | 你的角色、专业背景、知识水平 | "用户是前端工程师，熟悉 React" |
| feedback | 你对 Claude 行为的纠正或认可 | "不要在测试中 mock 数据库" |
| project | 项目的进行中工作、决策、截止日期 | "v2.0 发布日期: 2026-06-01" |
| reference | 外部系统的指针和位置 | "Bug 跟踪在 Linear 的 INGEST 项目中" |

MENTAL MODEL

### CLAUDE.md vs Memory

把它们想象成 **公司手册 vs 个人笔记** 。CLAUDE.md 是你写好的、团队共享的正式规范。Memory 是 Claude 在工作中积累的、个人化的经验记录。两者互补：CLAUDE.md 定规矩，Memory 补细节。

STORAGE

### 记忆存储位置

Memory 文件保存在 `~/.claude/projects/` 下对应项目的目录中，包含一个 `MEMORY.md` 索引和各个记忆文件。这些文件不在项目目录中，不会提交到 Git——它们是你和 Claude 之间的"私人笔记"。

Memory 不保存代码模式、文件路径或 git 历史——这些信息直接从代码库读取更准确。

## 动手练习

20 MIN

今天的练习全都有持久化的产出—— 你写的 CLAUDE.md 和配置的 settings.json 会在后续所有课程中持续生效。

### Lab 1 — 用 /init 生成 CLAUDE.md

让 Claude 分析你的项目并自动生成初稿。

```
# 进入你的项目目录
$ cd ~/my-project
$ claude

# 运行 /init 自动分析项目
> /init
# Claude 会读取 package.json、目录结构等
# 然后生成一份 CLAUDE.md 初稿

# 查看生成的文件
> 读一下 CLAUDE.md 的内容
```

### Lab 2 — 手动完善 CLAUDE.md

/init 生成的内容通常需要补充——添加你的个人偏好和团队规范。

```
# 让 Claude 帮你完善 CLAUDE.md
> 在 CLAUDE.md 中添加以下规则:
> 1. 回复用中文
> 2. commit message 用英文
> 3. 优先使用 Edit 而非 Write
> 4. 修改代码前先跑一次测试

# 验证: 开一个新对话测试效果
$ claude
> 你知道这个项目用的什么技术栈吗？
# Claude 应该能准确回答 (来自 CLAUDE.md)
```

### Lab 3 — 配置权限规则

设置一些安全的自动允许规则，减少重复确认。

```
# 方法 1: 通过对话让 Claude 帮你配置
> 在 .claude/settings.json 中添加以下 allow 规则:
> git status, git diff, git log, ls, find, grep

# 方法 2: 在日常使用中积累
# 当权限确认弹出时，选择 Always Allow
# 规则自动写入 settings.local.json

# 查看当前配置
> /config
```

### Lab 4 — 测试 Memory

告诉 Claude 一些偏好，然后新建对话验证记忆是否生效。

```
# 对话 1: 建立记忆
> 记住: 我更喜欢用 early return 而不是深层嵌套
> 记住: 这个项目的数据库是 PostgreSQL 15
> /memory
# 查看是否保存成功

# 退出并开启新对话
$ claude

# 对话 2: 验证记忆
> 你知道我对代码风格有什么偏好吗？
# Claude 应该提到 early return 偏好
> 项目用的什么数据库？
# Claude 应该回答 PostgreSQL 15
```

OBSERVATION

### 对比有无 CLAUDE.md 的差异

完成 Lab 1-2 后，你可以在另一个没有 CLAUDE.md 的项目里试同样的问题。对比 Claude 回答的 **精准度和一致性** 差异——有 CLAUDE.md 的项目中，Claude 的回答明显更贴合你的实际需求。

CHALLENGE

### 写一份"完美"的 CLAUDE.md

参考 Anthropic 官方的 CLAUDE.md 最佳实践指南，为你最常用的项目写一份全面的 CLAUDE.md。目标是让一个完全不了解项目的 Claude 会话也能像老成员一样工作——这就是好的 CLAUDE.md 的标准。

今天写的 CLAUDE.md 和 settings.json 会在后续所有 Day 中持续生效——花时间写好是值得的投资。

## 常见疑问

5 QUESTIONS

### Q1 · CLAUDE.md 太长会不会浪费 token？有长度限制吗？

ANS

CLAUDE.md 每次对话都会被完整注入上下文，所以 **确实会消耗 token** 。但通常项目的 CLAUDE.md 在 200-500 行以内，对于 200K 上下文窗口来说微乎其微。原则是： **写得够用就好** 。不要把整个 README、CHANGELOG 或 API 文档塞进去——只写对 Claude 工作方式有直接影响的指令。如果超过 500 行，考虑用子目录 CLAUDE.md 拆分。

### Q2 · CLAUDE.md 和 .cursorrules / .github/copilot-instructions.md 有什么区别？

ANS

概念类似——都是给 AI 工具的项目级指令文件。区别在于：(1) **作用范围** ：CLAUDE.md 支持三级层叠（全局→项目→子目录），比单文件更灵活；(2) **能力范围** ：Claude Code 不只是代码补全——它管理文件、执行命令、处理 Git，所以 CLAUDE.md 中可以写工作流指令（如"commit 前先跑测试"），而不只是编码规则；(3) **配合机制** ：CLAUDE.md 与 settings.json、Memory 形成完整的配置体系。

### Q3 · Memory 会不会记错或记住过时的信息？

ANS

会。Memory 是基于对话上下文保存的，如果当时的信息不准确或已经过时，记忆就会失真。Claude 在使用记忆时会尝试 **与当前代码库交叉验证** ——如果记忆说"项目用 Jest"但实际看到 `vitest.config.ts`，它会以当前事实为准并更新记忆。你也可以随时用 `/memory` 查看和清理过时记忆，或直接说"忘掉关于 XX 的记忆"。

### Q4 · 团队成员用不同的 CLAUDE.md 怎么办？会冲突吗？

ANS

好的做法是： **项目级 CLAUDE.md 统一提交 Git** ，保持团队一致的规范（技术栈、编码标准、禁忌列表）。个人偏好（语言选择、响应风格、自己的快捷规则）放在 **全局 CLAUDE.md** （`~/.claude/CLAUDE.md`）或 Memory 中，不影响团队配置。如果需要在项目中追加个人规则而不影响他人，可以用 `.claude/settings.local.json`。

### Q5 · Claude 真的会严格遵守 CLAUDE.md 吗？

ANS

大部分情况下会，但 **不是 100% 保证** 。CLAUDE.md 相当于系统提示词，Claude 会尽力遵守，但在复杂任务中偶尔会偏离（和人类读完规范偶尔犯错一样）。提升遵从率的技巧：(1) 指令要 **具体可执行** ，不要写模糊的原则；(2) 重要规则用 **命令式语气** （"用 const 不用 let"而非"建议使用 const"）；(3) 如果 Claude 违规了， **立即纠正** ——它会从纠正中学习并存入 Memory。

## 复盘问题

5 QUESTIONS

1. CLAUDE.md 的三级层叠机制是什么？当同一条规则在项目级和子目录级冲突时，哪个优先？
2. `settings.json` 和 `settings.local.json` 的区别是什么？各自适合放什么内容？
3. CLAUDE.md 和 Memory 的关系是什么？各自适合存储什么类型的信息？
4. `.claude/` 目录下有哪些文件和子目录？哪些会提交 Git，哪些不会？
5. 如果你需要让 `git status` 和 `npm test` 在 Prompt 模式下自动执行（不弹确认），你会怎么配置？

## 今日检查清单

7 ITEMS

- 用 `/init` 生成了 CLAUDE.md 初稿
- 手动补充了编码规范、偏好和禁忌规则
- 理解 CLAUDE.md 三级层叠机制（全局 → 项目 → 子目录）
- 配置了 `.claude/settings.json` 的 allow / deny 规则
- 知道 `.claude/` 目录下每个文件的作用
- 用 `/memory` 查看了 Memory 记忆并测试了跨会话保持
- 在新对话中验证了 CLAUDE.md 和 Memory 的实际效果

## 推荐阅读

3 ITEMS

OFFICIAL

### Claude Code: CLAUDE.md Guide

Anthropic 官方文档中关于 CLAUDE.md 的完整指南——包含写法模板、层叠机制详解和真实项目案例。今天最重要的参考文档。

BEST PRACTICE

### Claude Code: Memory System

Memory 系统的官方文档——四种记忆类型的详细定义、自动保存触发机制、以及如何管理和清理记忆。

EXAMPLE

### Anthropic 的 CLAUDE.md

Anthropic 自己的开源项目中实际使用的 CLAUDE.md——学习"专业选手"如何给 Claude 写指令。注意它的简洁性和指令化风格。

## Day 04 预告

NEXT

COMING NEXT

### 上下文管理 — /compact · /clear · 对话策略

Claude 的上下文窗口有限——对话越长，前面的内容越模糊。明天你将学习如何用 `/compact` 主动压缩、理解自动压缩机制、掌握 `/clear` 重置策略，以及在长时间工作中维持高效上下文的实战技巧。知道什么时候该开新对话，什么时候该 --continue。

"A tool is only as good as the context you give it."

DAY 03 · CLAUDE CODE 20-DAY ROADMAP
