---
title: "Day 10 · 任务系统 tasks.json"
date: '2026-05-29'
draft: false
description: "VSCode 任务系统 tasks.json：npm / shell / process / 自定义 task、group、dependsOn、problemMatcher、background task 与 preLaunchTask。把手敲命令升级成可复用动作。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 10
---

DAY 10 · VSCODE ROADMAP · 21 DAYS

# 把手敲命令升级成 _可复用动作_

Day 09 我们把终端收回到项目上下文。今天再往前走一步: 把反复执行的命令写进 **tasks.json** ,让启动服务、跑测试、构建、代码生成、预检查都变成可复用、可共享、可组合的动作。 终端适合探索;任务适合沉淀。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **POWER MOVE** Run Task

## 思维导图

OVERVIEW

> **图：Day 10 tasks.json 思维导图**
>
> - DAY 10 · TASKS.JSON
> - TYPE · COMMAND · GROUP · PROBLEM MATCHER · DEPENDS · PRELAUNCH
> - 01 · TASK
> - label / type
> - 02 · RUN
> - command / args
> - 03 · GROUP
> - build / test
> - 04 · PROBLEMS
> - problemMatcher
> - 05 · COMPOSE
> - dependsOn
> - 任务身份
> - label
> - shell / process / npm
> - 执行细节
> - command
> - args / options.cwd
> - 常用入口
> - build default
> - test default
> - 问题面板
> - $tsc / $eslint
> - file line column
> - 任务编排
> - sequence / parallel
> - preLaunchTask
> - 核心判断
> - 跑熟一次在 TERMINAL · 跑第三次进 TASK · 调试前置用 PRELAUNCH

TASKS TURN COMMANDS INTO PROJECT ACTIONS

## 今天的心智模型

MODEL

TERMINAL

### 探索命令

还不确定参数、目录、依赖时,先在终端里试。终端是草稿纸,允许你快速失败和调整。

TASK

### 沉淀动作

一旦命令稳定、重复、需要团队共享,就写进 `.vscode/tasks.json`。这就是项目里的按钮化命令。

DEBUG

### 接入调试

调试前需要先构建、启动服务、生成文件时,用 `preLaunchTask` 串起来。Day14 会重点用到。

一句话: Task 是 VSCode 对「项目命令」的结构化描述。

## tasks.json 字段拆解

ANATOMY

| 字段 | 含义 | 例子 | 注意点 |
| --- | --- | --- | --- |
| version | tasks.json 的 schema 版本。 | `"2.0.0"` | 现代 VSCode 基本都用这个。 |
| label | 任务显示名,也是 dependsOn / preLaunchTask 引用名。 | `"dev:web"` | 建议用命名空间: `dev:web`、`test:unit`、`build:api`。 |
| type | 任务类型。常见有 shell、process、npm。 | `"shell"` | shell 支持管道和重定向; process 更精确; npm 会识别 package.json 脚本。 |
| command | 要执行的命令或程序。 | `"npm"` | 跨平台时,尽量把复杂逻辑放进 npm script 或脚本文件。 |
| args | 命令参数数组。 | `["run", "dev"]` | 比把整条命令塞进字符串更不容易被 shell 引号坑到。 |
| options.cwd | 任务启动目录。 | `"${workspaceFolder}/packages/web"` | 多根 / monorepo 项目里非常关键。 |
| group | 标记为 build / test 组,可设默认。 | `{ "kind": "build", "isDefault": true }` | 让 `Run Build Task` / `Run Test Task` 直接命中。 |
| problemMatcher | 把任务输出解析成 Problems 面板里的错误。 | `"$tsc"` | 这是 tasks 最值钱的部分:错误不只在终端,还能跳源码。 |
| dependsOn | 组合多个任务。 | `["lint", "test"]` | 配合 `dependsOrder` 控制串行或并行。 |
| presentation | 控制终端展示行为。 | `{ "reveal": "always", "panel": "dedicated" }` | 长期任务用 dedicated,避免每次运行刷掉别的输出。 |

## 高频入口

SHORTCUTS

| 动作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 运行任务 | ⌘⇧P → Tasks: Run Task | Ctrl Shift P → Tasks: Run Task | 最通用入口,选择任意 task。 |
| 配置任务 | ⌘⇧P → Tasks: Configure Task | Ctrl Shift P → Tasks: Configure Task | 生成或打开 `.vscode/tasks.json`。 |
| 运行默认 Build Task | ⌘⇧B | Ctrl Shift B | 命中 `group.kind = build` 且 `isDefault = true` 的任务。 |
| 运行 Test Task | ⌘⇧P → Tasks: Run Test Task | Ctrl Shift P → Tasks: Run Test Task | 命中 test group。 |
| 终止任务 | ⌘⇧P → Tasks: Terminate Task | Ctrl Shift P → Tasks: Terminate Task | 停止正在运行的 watch / dev / build task。 |
| 重新运行上一个任务 | ⌘⇧P → Tasks: Rerun Last Task | Ctrl Shift P → Tasks: Rerun Last Task | 修改代码后快速重复执行。 |
| 打开 Problems 面板 | ⌘⇧M | Ctrl Shift M | 查看 problemMatcher 解析出的错误。 |

## 最小可用 tasks.json

TEMPLATE

下面这份模板适合前端或 Node 项目。它包含 dev、build、test、lint 四类任务, 并把 build 设成默认构建任务。

```
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev:web",
      "type": "npm",
      "script": "dev",
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated",
        "group": "dev"
      }
    },
    {
      "label": "build:web",
      "type": "npm",
      "script": "build",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": "$tsc"
    },
    {
      "label": "test:unit",
      "type": "npm",
      "script": "test",
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "lint",
      "type": "npm",
      "script": "lint",
      "problemMatcher": "$eslint-stylish"
    }
  ]
}
```

NPM TYPE

### 适合 package.json 脚本

如果命令已经在 `scripts` 里,用 `type: npm` 最省心。VSCode 还能自动发现 npm scripts。

BACKGROUND

### dev server 是后台任务

像 `npm run dev` 这种不会自动结束的任务,通常需要 `isBackground` 和合适的 problemMatcher。

PRESENTATION

### 控制终端行为

`panel: dedicated` 会让同一个任务复用自己的终端,避免输出到处乱跳。

## 三种常见任务类型

TYPES

NPM

### 直接运行 package.json 脚本

type: npm
script: build

最适合前端项目。脚本名与 package.json 保持一致,团队成员也容易理解。

SHELL

### 需要 shell 能力

type: shell
command: "mkdir -p dist && cp README.md dist/"

适合管道、重定向、环境变量展开、多个命令串联。但跨平台时要小心 shell 差异。

PROCESS

### 直接运行可执行文件

type: process
command: "go"
args: ["test", "./..."]

不经过 shell,参数边界更清楚。适合 Go、Python、Rust 等 CLI 稳定的命令。

COMPOUND

### 组合多个任务

dependsOn: ["lint", "test:unit", "build:web"]
dependsOrder: "sequence"

适合 precheck、ci-local、release:dry-run 这类多步骤流程。

## problemMatcher: 任务系统的灵魂

PROBLEMS

如果 task 只是帮你运行命令,它只是一个快捷方式。 一旦加上 problemMatcher,VSCode 就能把输出解析成 Problems 面板里的诊断信息: 文件、行号、列号、错误级别、消息都能被点击跳转。

| matcher | 适用输出 | 使用场景 |
| --- | --- | --- |
| `$tsc` | TypeScript 编译器输出。 | `tsc --noEmit`、前端构建、类型检查。 |
| `$eslint-stylish` | ESLint stylish formatter 输出。 | lint 任务。注意 formatter 要匹配。 |
| `$go` | Go 编译 / 测试输出。 | `go test ./...`、`go build`。 |
| `$msCompile` | MSBuild / C# 等编译输出。 | .NET / C++ 项目。 |
| 自定义 matcher | 你自己的 CLI 输出。 | 公司内部脚本、代码生成器、特殊测试框架。 |

### 自定义 matcher 示例

```
{
  "label": "check:custom",
  "type": "shell",
  "command": "node scripts/check.js",
  "problemMatcher": {
    "owner": "custom-check",
    "fileLocation": ["relative", "${workspaceFolder}"],
    "pattern": {
      "regexp": "^(.*):(\\d+):(\\d+):\\s+(error|warning):\\s+(.*)$",
      "file": 1,
      "line": 2,
      "column": 3,
      "severity": 4,
      "message": 5
    }
  }
}
```

设计内部脚本时,优先输出 file:line:column: severity: message,VSCode 最容易解析。

## dependsOn: 把任务编排起来

COMPOSE

> **图：tasks dependsOn 编排示意图**
>
> - lint
> - $eslint
> - test:unit
> - vitest
> - build:web
> - tsc / vite
> - precheck
> - dependsOn
> - dependsOrder: sequence → lint 通过后 test, test 通过后 build

COMPOSE SMALL TASKS INTO A LOCAL CI FLOW

### 本地 CI 示例

```
{
  "label": "precheck",
  "dependsOn": [
    "lint",
    "test:unit",
    "build:web"
  ],
  "dependsOrder": "sequence",
  "problemMatcher": []
}
```

SEQUENCE

### 串行适合有依赖的流程

lint → test → build 这类流程建议串行。前一步失败就不要浪费时间跑后面。

PARALLEL

### 并行适合互不依赖的 watcher

web dev server + api dev server 可以并行启动,但需要注意 background task 的完成条件。

## background 与 preLaunchTask

DEBUG HOOK

Task 不只是从命令面板里手动运行。它还可以成为 Debug 的前置动作。 比如调试前先启动 dev server、先编译 TypeScript、先生成代码。

```
// .vscode/tasks.json
{
  "label": "dev:web",
  "type": "npm",
  "script": "dev",
  "isBackground": true,
  "problemMatcher": {
    "owner": "vite",
    "pattern": {
      "regexp": "^(.*):(\\d+):(\\d+):\\s+(.*)$",
      "file": 1,
      "line": 2,
      "column": 3,
      "message": 4
    },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "Local:",
      "endsPattern": "ready in"
    }
  }
}
```

```
// .vscode/launch.json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Web",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/src",
  "preLaunchTask": "dev:web"
}
```

background task 的难点是让 VSCode 知道「服务已经 ready」,这通常靠 beginsPattern / endsPattern。

## 动手实验

3 LABS

### Lab 1 — 把手敲命令写进 tasks.json

目标:把 Day09 的临时命令升级为可复用任务。

1. 在练习项目中创建 `.vscode/tasks.json`
2. 加入 `dev:web`、`build:web`、`test:unit` 三个任务
3. 执行 `Tasks: Run Task`,选择 `build:web`
4. 给 `build:web` 加上 build group,并设为 default
5. 按 ⌘⇧B(Win: Ctrl Shift B)确认默认构建任务能直接运行

### Lab 2 — 让错误进入 Problems 面板

目标:理解 problemMatcher 如何把终端输出变成可点击错误。

1. 在 TypeScript 项目中故意写一个类型错误
2. 创建任务 `typecheck`:运行 `tsc --noEmit`
3. 给它加 `problemMatcher: "$tsc"`
4. 运行任务后打开 Problems 面板 ⌘⇧M(Win: Ctrl Shift M)
5. 点击错误,确认能跳到对应文件和行号

### Lab 3 — 组合一个本地 precheck

目标:把 lint、test、build 编排成一个本地 CI。

```
{
  "label": "precheck",
  "dependsOn": ["lint", "test:unit", "build:web"],
  "dependsOrder": "sequence",
  "problemMatcher": []
}
```

1. 确保 `lint`、`test:unit`、`build:web` 都能单独运行
2. 加入上面的 `precheck` 任务
3. 运行 `precheck`,观察三个任务是否按顺序执行
4. 故意让 lint 失败,确认后续任务不会继续浪费时间
5. 修复后重新运行,把它作为提交前的本地检查

REFLECTION

### 三个 Lab 的纵深

Lab 1 把命令结构化,Lab 2 把输出接入 Problems,Lab 3 把小动作编排成流程。Task 的价值正是在这三层逐步放大的。

CHALLENGE

### 附加挑战

找一个你每天至少运行一次的命令,把它写成 task,并加上合适的 `label`、`group`、`presentation`。如果输出包含错误,再补一个 problemMatcher。

## 常见疑问

5 QUESTIONS

### Q1 · 既然 package.json 里已经有 scripts,为什么还要 tasks.json?

ANS

`package.json` 定义的是项目命令本身,`tasks.json` 定义的是 VSCode 如何运行和理解这些命令。Task 可以加 group、problemMatcher、presentation、dependsOn、preLaunchTask,还能把错误接入 Problems 面板。两者不是替代关系:脚本放 package.json,编辑器工作流放 tasks.json。

### Q2 · task 的 `type: shell` 和 `type: process` 怎么选?

ANS

需要 shell 特性时用 `shell`,比如 `&&`、管道、重定向、环境变量展开。想精确运行某个可执行文件并传参数时用 `process`,它不经过 shell,引号和参数边界更可控。跨平台任务优先把复杂逻辑写进脚本文件,再用 task 调这个脚本。

### Q3 · problemMatcher 配了但 Problems 面板没有错误,怎么排查?

ANS

先看命令输出格式是否和 matcher 匹配。比如 `$eslint-stylish` 要求 ESLint formatter 是 stylish；`$tsc` 要求输出是 tsc 风格。然后看路径是相对 workspace 还是绝对路径,必要时设置 `fileLocation`。最后确认任务真的运行失败并输出到了 terminal,而不是脚本吞掉了错误。

### Q4 · watch / dev server 这种永不结束的任务怎么处理?

ANS

这类任务需要标记 `isBackground: true`。如果它要作为 `preLaunchTask`,还要给 problemMatcher 配 `background.beginsPattern` 和 `endsPattern`,让 VSCode 知道服务什么时候 ready。否则调试器会一直等任务结束,而 dev server 本来就不会结束。

### Q5 · tasks.json 要不要提交到 Git?

ANS

如果它描述的是团队共享流程,应该提交。比如 build、test、lint、precheck、generate、dev server。不要提交个人机器路径、个人 token、本地临时脚本。好任务文件应该让新同事打开项目后马上知道「怎么启动、怎么检查、怎么构建」。

## 复盘问题

5 QUESTIONS

1. `label`、`type`、`command`、`args`、`options.cwd` 分别控制什么?
2. `type: npm`、`type: shell`、`type: process` 适合什么场景?
3. 为什么说 `problemMatcher` 是 task 系统的灵魂?
4. `dependsOn` 和 `dependsOrder` 如何组合成本地 CI?
5. background task 作为 `preLaunchTask` 时,为什么需要 ready 条件?

## 今日检查清单

8 ITEMS

- 能通过 `Tasks: Configure Task` 创建或打开 `tasks.json`
- 能写出一个最小可运行的 shell / npm / process task
- 能把 build task 设成默认,并用 ⌘⇧B / Ctrl Shift B 运行
- 理解 `options.cwd` 在 monorepo / multi-root 中的重要性
- 能给 TypeScript 或 ESLint 任务配置合适的 problemMatcher
- 能用 `dependsOn` 编排 lint + test + build
- 理解 background task 与普通一次性 task 的区别
- 知道 `preLaunchTask` 如何把 Task 接入 Debug 流程

## 推荐阅读

3 ITEMS

OFFICIAL

### VSCode Tasks

官方任务系统文档。重点看 task schema、auto-detected tasks、group、dependsOn、background tasks。

OFFICIAL

### Problem Matchers

把终端输出解析为 Problems 的核心机制。重点理解 regexp、fileLocation、background。

NEXT

### Debugging launch.json

Day14 会把 `preLaunchTask` 接到调试配置里。今天先把 task 基础打牢。

## Day 11 预告

NEXT

COMING NEXT

### 内建 Git 与 Source Control

工作区与终端阶段的最后一天,我们回到代码变更本身: Source Control 视图、stage hunk、diff、3-way merge editor、timeline、blame、commit 前检查。 学完后,你会更稳地管理每一次改动。

"Task 是把偶然跑通的命令,变成项目里每个人都能复用的动作。"

DAY 10 · VSCODE 21-DAY ROADMAP
