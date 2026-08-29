---
title: "Claude Code 20 天系统学习路线"
date: '2026-05-16'
draft: false
description: "从安装到自动化工作流：覆盖核心工具、Git 工作流、Hooks、MCP 服务器、Agent 子代理、Plan 模式的 20 天 Claude Code 学习路线图。"
toc: true
tags:
  - AI
  - Claude Code
  - Tooling
  - Roadmap
---

CLAUDE CODE · 20-DAY ROADMAP · MASTERY

# 二十天精通 _Claude Code_

从安装到自动化工作流的完整学习路线。 覆盖核心工具链、Git 工作流、Hooks 钩子、MCP 外部集成、Agent 子代理、Plan 模式六大板块。 节奏：每天 30–60 分钟，前半段理解概念，后半段动手实操。 原则—— **先跑通 → 再配置 → 后自动化 → 终极整合。**

**TOTAL** 20 Days **PACE** 30–60 min / day **PHASES** 5 **TARGET** 全自动化开发工作流 **PLATFORM** CLI · VS Code · Web

## 阶段总览

OVERVIEW

> **图：Claude Code 20 天学习路线阶段总览**
>
> - CLAUDE CODE 20-DAY ROADMAP — 5 PHASES
> - PHASE 1
> - 基础入门
> - Day 1 – 4
> - PHASE 2
> - 日常工作流
> - Day 5 – 8
> - PHASE 3
> - 效率进阶
> - Day 9 – 12
> - PHASE 4
> - 高级模式
> - Day 13 – 16
> - PHASE 5
> - 实战整合
> - Day 17 – 20
> - KEY CONCEPTS
> - Read / Edit / Write
> - CLAUDE.md
> - Git Workflow
> - Hooks
> - MCP
> - Agent
> - Full Automation
> - SKILLS ACQUIRED
> - CLI
> - Config
> - Git Flow
> - Debug
> - Plan
> - Cron
> - CI/CD
> - SDK

FIG · 20 天 Claude Code 学习路线总览: 从安装入门到全自动化开发工作流

## 基础入门

DAY 1 – 4

Claude Code 是 Anthropic 推出的 AI 编程工具，支持 CLI、VS Code 扩展、Web 三种形态。 前四天的目标是完成安装、理解核心工具链、掌握项目配置，并学会管理上下文窗口。

**DAY 01 · 安装与初体验** — CLI 安装 · claude login 认证 · 第一次对话 · /help

**DAY 02 · 四大核心工具** — Read 读文件 · Edit 修文件 · Write 写新文件 · Bash 跑命令

**DAY 03 · 项目配置：CLAUDE.md** — 项目记忆 · 编码规范 · .claude/ 目录结构 · settings.json

**DAY 04 · 上下文管理** — /compact 压缩 · 自动压缩 · /clear · 对话历史策略

核心命令: `claude` · `claude login` · `/help` · `/compact` · `/config`

## 日常工作流

DAY 5 – 8

掌握基础后，开始用 Claude Code 解决真实的日常开发任务。 从 Git 提交到代码审查，从调试到测试，从搜索到多文件重构—— 这四天建立高效的 AI 辅助开发循环。

**DAY 05 · Git 工作流** — 智能 commit · PR 创建 · 分支管理 · Code Review

**DAY 06 · 调试与测试** — 错误诊断 · 测试生成 · TDD 工作流 · 运行 & 解读测试结果

**DAY 07 · 搜索与导航** — grep / find · 代码库探索 · 符号查找 · 跨文件追踪

**DAY 08 · 多文件操作与任务追踪** — 批量重构 · TodoWrite 追踪 · 大型变更管理策略

关键能力: 让 Claude 理解你的项目后，用自然语言驱动 commit → PR → review 全流程

## 效率进阶

DAY 9 – 12

从"会用"到"用好"的关键四天。 权限系统保障安全，Hooks 实现自动化触发，Skills 创建可复用命令，Memory 让偏好持久化。 这一阶段把 Claude Code 从助手升级为高度定制化的开发伙伴。

**DAY 09 · 权限与安全** — Prompt / Auto 模式 · allowedTools · deny 规则 · 敏感文件保护

**DAY 10 · Hooks 钩子系统** — PreToolUse / PostToolUse · 自动格式化 · 自动测试 · Shell & HTTP 钩子

**DAY 11 · 自定义 Skills** — 创建 .claude/skills/ · 斜杠命令 · 参数化模板 · 跨项目复用

**DAY 12 · Memory 记忆系统** — /memory · MEMORY.md · 自动记忆 · user / feedback / project / reference 四类型

核心理念: Hooks 让 Claude 在编辑后自动跑 lint/test；Skills 把重复工作封装成一条命令

## 高级模式

DAY 13 – 16

解锁 Claude Code 的全部能力。 MCP 服务器打通外部系统，Agent 子代理实现并行开发，Plan 模式保障复杂变更的可控性， 自动化工作流让 Claude 在你离开时也能持续工作。

**DAY 13 · MCP 服务器** — Model Context Protocol · .claude/.mcp.json · 数据库 / GitHub / Slack 集成

**DAY 14 · Agent 与子代理** — Subagent 并行任务 · .claude/agents/ · Worktree 隔离 · 多分支开发

**DAY 15 · Plan 模式** — EnterPlanMode · 架构规划 · 方案审批 · 大型重构安全网

**DAY 16 · 自动化工作流** — /loop 循环 · Cron 定时任务 · 后台执行 · Monitor 监控

核心突破: MCP 让 Claude 操作数据库 / 发消息 / 看日志；Agent 让一个任务拆给多个 Claude 并行执行

## 实战整合

DAY 17 – 20

最后四天，把前四个阶段的所有技能组合起来—— 从零搭建项目、接管遗留代码、接入 CI/CD 流水线，最终形成你自己的全自动化开发工作流。

**DAY 17 · 全栈项目实战** — 从零搭建：CLAUDE.md → 脚手架 → API → 前端 → 测试 → 部署

**DAY 18 · 遗留代码与大型仓库** — 陌生代码库理解 · 重构策略 · 渐进式迁移 · 依赖升级

**DAY 19 · CI/CD 集成与团队协作** — GitHub Actions · @claude PR 自动修复 · 团队共享配置 · 管理员设置

**DAY 20 · 综合演练与个人工作流** — 组合所有技能 · 定制个人 CLAUDE.md · 最佳实践总结 · 持续优化

终极目标: 用自然语言驱动从需求到部署的全流程——Claude Code 成为你的结对编程伙伴

## 常用命令速查

REFERENCE

### 斜杠命令

| 命令 | 说明 | 阶段 |
| --- | --- | --- |
| `/help` | 查看帮助信息，列出所有可用命令 | Day 1 |
| `/compact` | 压缩对话历史，释放上下文窗口空间 | Day 4 |
| `/clear` | 清空当前对话，重新开始 | Day 4 |
| `/config` | 查看和修改当前配置 | Day 3 |
| `/memory` | 查看和编辑 Claude 的持久化记忆 | Day 12 |
| `/init` | 在项目中初始化 CLAUDE.md | Day 3 |
| `/review` | 对当前更改执行代码审查 | Day 5 |
| `/loop` | 循环执行指定任务 | Day 16 |

### 核心文件结构

# Claude Code 项目配置目录
project/
 ├── CLAUDE.md# 项目级指令与规范
 └── .claude/
 &nbsp;&nbsp;&nbsp;&nbsp;├── settings.json# 项目设置（权限、环境变量）
 &nbsp;&nbsp;&nbsp;&nbsp;├── settings.local.json # 个人设置（gitignore）
 &nbsp;&nbsp;&nbsp;&nbsp;├── .mcp.json# MCP 服务器配置
 &nbsp;&nbsp;&nbsp;&nbsp;├── agents/# 自定义子代理定义
 &nbsp;&nbsp;&nbsp;&nbsp;├── skills/# 自定义斜杠命令
 &nbsp;&nbsp;&nbsp;&nbsp;├── rules/# 路径级规则
 &nbsp;&nbsp;&nbsp;&nbsp;└── hooks/# 工具执行钩子脚本

### CLI 常用参数

$ claude # 启动交互式会话
$ claude "修复登录页面的 bug"# 直接传入任务
$ claude --model opus # 指定模型
$ claude --resume# 恢复上次会话
$ claude --continue# 继续最近对话
$ cat file.py | claude "review" # 管道输入

## 核心概念对照表

10 CONCEPTS

| 概念 | 作用 | 使用场景 | 所在阶段 |
| --- | --- | --- | --- |
| CLAUDE.md | 项目级指令，告诉 Claude 你的规范和偏好 | 每个项目必备——编码风格、技术栈、禁忌 | P1 · Day 3 |
| 权限模式 | 控制 Claude 可以执行哪些工具操作 | 安全敏感项目、团队共享环境 | P3 · Day 9 |
| Hooks | 工具执行前后自动触发的脚本 | 编辑后自动 lint/test、阻止危险操作 | P3 · Day 10 |
| Skills | 可复用的自定义斜杠命令 | 封装重复工作流、团队共享模板 | P3 · Day 11 |
| Memory | 跨会话的持久化记忆系统 | 记住用户偏好、项目上下文、反馈修正 | P3 · Day 12 |
| MCP 服务器 | 连接外部系统的协议层（数据库、API、消息） | 查数据库、发 Slack、读 Grafana 面板 | P4 · Day 13 |
| Agent / Subagent | 派生独立 Claude 实例执行子任务 | 并行重构 50 个文件、独立调研问题 | P4 · Day 14 |
| Worktree | Git worktree 隔离的独立工作环境 | 同时开发多个 feature、不干扰主分支 | P4 · Day 14 |
| Plan 模式 | 先规划、后执行的架构设计模式 | 大型重构、跨团队变更、高风险操作 | P4 · Day 15 |
| Cron / Loop | 定时或循环执行任务 | 监控 CI、定期检查代码质量、自动巡检 | P4 · Day 16 |

## 学习资源

RESOURCES

### 官方文档

MUST READ

### Claude Code 官方文档

Anthropic 官方出品，覆盖安装、配置、全部功能的权威参考。学习路线的核心伴读。

DOCS

### Model Context Protocol 规范

MCP 协议的设计文档与服务器开发指南。Day 13 的核心参考。

### 实践场景

HANDS-ON

### 用 Claude Code 写 Claude Code 配置

最好的练习就是让 Claude Code 帮你写 CLAUDE.md、Hooks、Skills——吃自己的狗粮。

PRACTICE

### 开源项目贡献

找一个感兴趣的 GitHub 项目，用 Claude Code 完成理解代码 → 修 bug → 提 PR 的全流程。

### 平台入口

CLI TerminalVS Code ExtensionJetBrains Pluginclaude.ai/code (Web)Desktop App (Mac/Win)

Day 1 选择任一平台开始 · Day 17 起建议在 VS Code 中使用以获得最佳 IDE 集成体验

## 学习方法建议

5 PRINCIPLES

01

### 真实项目驱动

不要用 demo 项目练习。找一个你正在写的真实项目，让 Claude Code 帮你解决实际问题。真实反馈 \> 模拟练习。

02

### 先手动 再自动

每个功能先手动执行一遍理解原理，再用 Hooks/Skills/Cron 自动化。跳过理解直接自动化 = 踩坑。

03

### 渐进式信任

从 Prompt 模式（逐条确认）开始，随着信任建立逐步切换到 Auto 模式。安全感来自理解、不来自盲信。

04

### CLAUDE.md 迭代

CLAUDE.md 不是一次性写完的，是在使用中不断迭代的。发现 Claude 理解错了就加规则，理解对了就加鼓励。

05

### 组合 \> 单一

Claude Code 的威力在于组合：CLAUDE.md + Hooks + MCP + Agent 联动，才是真正的 10x 开发体验。

"先跑通 → 再配置 → 后自动化 → 终极整合"

CLAUDE CODE 20-DAY ROADMAP · FROM INSTALLATION TO FULL AUTOMATION
