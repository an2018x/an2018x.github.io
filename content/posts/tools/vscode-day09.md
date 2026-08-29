---
title: "Day 09 · 集成终端深入"
date: '2026-05-28'
draft: false
description: "VSCode 集成终端深入：多 terminal、profile、split、cwd、环境变量、Shell Integration、命令装饰、路径链接跳转源码。把终端从外部窗口收回到项目上下文。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 09
---

DAY 09 · VSCODE ROADMAP · 21 DAYS

# 把终端放回 _项目上下文_

Day 08 把文件与工作区整理好了。今天把终端也收进这个上下文里: 不再在一堆外部窗口之间切来切去,而是在 VSCode 中管理 **Profile、cwd、多终端、分屏、Shell Integration 与路径链接** 。 集成终端的价值不是「也能敲命令」,而是让命令、文件、日志、源码跳转在同一个工作台里闭环。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **POWER MOVE** terminal profile

## 思维导图

OVERVIEW

> **图：Day 09 集成终端深入思维导图**
>
> - DAY 09 · INTEGRATED TERMINAL
> - PROFILE · CWD · SPLIT · SHELL INTEGRATION · LINKS
> - 01 · PROFILE
> - 不同 Shell
> - 02 · CWD
> - 启动目录
> - 03 · MULTI
> - tabs / split
> - 04 · SHELL
> - 命令感知
> - 05 · LINKS
> - 日志跳源码
> - 命令环境
> - zsh / bash / pwsh
> - args / env / icon
> - 目录上下文
> - ${workspaceFolder}
> - multi-root choice
> - 并行工作流
> - web / api / test
> - rename / color
> - 命令状态
> - success / failed
> - recent command
> - 可点击输出
> - src/app.ts:12:5
> - http://localhost
> - 核心判断
> - 临时命令用 TERMINAL · 可复用命令用 TASK · 断点运行用 DEBUG

TERMINAL IS WHERE COMMANDS MEET PROJECT CONTEXT

## 今天的心智模型

MODEL

TERMINAL

### 临时、交互、探索

适合一次性命令、REPL、临时检查、手动调试。你在终端里试出稳定流程后,就该考虑把它沉淀成 Day10 的 Task。

PROFILE

### 命令运行环境

Profile 决定用哪个 shell、带什么参数、注入什么环境变量。一个项目可以有 default、clean、node、docker 等不同 profile。

CONTEXT

### cwd 是终端的坐标

同一条命令在不同目录含义完全不同。多根工作区里,先确认当前 terminal 的 cwd,再运行安装、测试、启动命令。

一句话: 集成终端的关键是让 shell 环境、当前目录、源码链接都跟工作区对齐。

## 终端面板拆解

ANATOMY

| 区域 / 能力 | 解决什么问题 | 使用建议 |
| --- | --- | --- |
| Terminal Tabs | 一个窗口里保留多个独立 terminal。 | 给长期运行的进程命名,比如 `web`、`api`、`test`,不要全叫 zsh。 |
| Split Terminal | 同一个 tab 内左右 / 上下并排多个 pane。 | 适合强关联命令,比如一个 pane 跑服务,另一个 pane 跑 curl 或日志。 |
| Profile | 选择 shell、参数、环境变量、图标、颜色。 | 把常用环境做成 profile,不要每次新终端都手动 source 一堆脚本。 |
| cwd | 决定新 terminal 从哪个目录启动。 | 单根项目用 `${workspaceFolder}`;多根项目根据 web / api 分别打开或切换。 |
| Shell Integration | 让 VSCode 感知命令边界、退出码、当前目录。 | 开启后可以看到命令装饰、最近命令、失败状态,路径链接也更聪明。 |
| Links | 把输出中的 URL、文件路径、端口、错误位置变成可点击对象。 | 日志尽量输出 `file:line:column` 格式,能直接跳源码。 |

## 高频入口

SHORTCUTS

| 动作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 显示 / 隐藏终端 | ⌃` | Ctrl ` | 最快进入 Panel 的方式。反引号在数字 1 左边。 |
| 新建终端 | ⌃⇧` | Ctrl Shift ` | 用默认 Profile 打开一个新 terminal。 |
| 选择默认 Profile | ⌘⇧P → Terminal: Select Default Profile | Ctrl Shift P → Terminal: Select Default Profile | 在 zsh、bash、PowerShell、Git Bash 等环境之间选择。 |
| 用指定 Profile 新建终端 | ⌘⇧P → Terminal: Create New Terminal With Profile | Ctrl Shift P → Terminal: Create New Terminal With Profile | 临时切到另一个 shell 或环境。 |
| 分屏终端 | ⌘⇧P → Terminal: Split Terminal | Ctrl Shift P → Terminal: Split Terminal | 也可以点终端面板右上角 split 按钮。 |
| 重命名终端 | ⌘⇧P → Terminal: Rename Active Terminal | Ctrl Shift P → Terminal: Rename Active Terminal | 长期运行进程一定要命名,否则很快分不清。 |
| 清空终端 | ⌘K | Ctrl L 或 Terminal: Clear | 保留终端实例,清理可视输出。 |
| 运行选中文本 | ⌘⇧P → Terminal: Run Selected Text in Active Terminal | Ctrl Shift P → Terminal: Run Selected Text in Active Terminal | 从 README、脚本片段、笔记里选中命令直接运行。 |

## Profile 配置模板

SETTINGS

Profile 可以写在 User Settings,也可以写在 Workspace Settings。 个人 shell 偏好放 User;项目必须的环境变量、cwd、默认 profile 可以放 Workspace。

```
{
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.profiles.osx": {
    "zsh": {
      "path": "zsh",
      "args": ["-l"],
      "icon": "terminal"
    },
    "clean zsh": {
      "path": "zsh",
      "args": ["-f"],
      "icon": "debug-console",
      "env": {
        "NODE_ENV": "development"
      }
    }
  },
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.cwd": "${workspaceFolder}",
  "terminal.integrated.scrollback": 20000,
  "terminal.integrated.shellIntegration.enabled": true,
  "terminal.integrated.confirmOnExit": "hasChildProcesses"
}
```

PATH

### path 决定 shell

macOS 常见是 `zsh` 或 `bash`; Windows 常见是 PowerShell、Command Prompt、Git Bash、WSL。

ARGS

### args 决定启动方式

`-l` 表示 login shell,会加载登录配置。排查环境污染时,可以用 clean profile 少加载配置。

ENV

### env 注入变量

适合项目级轻量变量。敏感 token 不建议写进仓库里的 workspace settings。

## cwd: 终端的起点

CONTEXT

SINGLE ROOT

### 单根项目

"terminal.integrated.cwd": "${workspaceFolder}"

新终端从项目根启动。适合普通单仓库项目。

MULTI ROOT

### 多根工作区

web terminal → packages/web
api terminal → packages/api
docs terminal → docs

多根项目中,新终端通常需要明确选择 root。运行 npm install 前先看 `pwd`。

LONG RUNNING

### 长期运行进程

web: npm run dev
api: go run ./cmd/server
test: npm run test -- --watch

长期进程用独立 terminal,命名 + 上色,不要和临时命令混在一个 pane 里。

TEMP COMMAND

### 临时命令

git status
curl localhost:3000/health
rg "TODO"

临时命令可以共用一个 scratch terminal。试出固定流程后,移动到 Day10 tasks。

## 多终端工作流

TABS · SPLIT

> **图：多终端工作流**
>
> - web
> - api
> - test
> - + split trash
> - $ npm run dev
> - Local: http://localhost:5173
> - ready in 420ms
> - $ curl localhost:5173
> - HTTP/1.1 200 OK
> - src/App.tsx:18:7
> - 左 pane: 长期进程
> - 右 pane: 临时验证

KEEP LONG-RUNNING PROCESSES SEPARATE FROM SCRATCH COMMANDS

NAME

### 给终端命名

命名是低成本高收益动作。`web`、`api`、`db` 比 4 个 `zsh` 可靠得多。

COLOR

### 给长期进程上色

开发服务、测试 watcher、数据库容器这类长期进程,用颜色或图标区分。减少误关。

SPLIT

### 强关联才分屏

同一上下文里的服务 + curl 适合 split。完全无关的任务更适合新 tab,避免视觉拥挤。

## Shell Integration: 让 VSCode 读懂命令

INTEGRATION

没有 Shell Integration 时,终端只是一个字符流。 开启后,VSCode 能识别命令边界、退出状态、当前目录,于是命令装饰、最近命令、路径链接、目录跟踪都会更稳定。

| 能力 | 表现 | 价值 |
| --- | --- | --- |
| Command decorations | 命令左侧出现成功 / 失败标记。 | 快速定位上一条失败命令,不用在大量输出里翻。 |
| Command navigation | 可以在最近命令之间跳转。 | 长输出场景下回到上一个命令起点。 |
| Current working directory | VSCode 能感知 shell 当前目录。 | 点击相对路径时更容易解析到正确文件。 |
| Recent commands | 命令历史能以 VSCode 命令的方式被访问。 | 重复运行刚才的命令更轻松。 |
| Rich links | URL、端口、文件路径、行列位置可点击。 | 日志输出与源码导航打通。 |

## 让日志可以点击

LINKS

VSCode 集成终端会识别输出中的 URL、文件路径、行号、列号。 你写脚本或日志时,尽量输出标准格式,调试效率会直接上一个台阶。

```
# 好格式: 文件:行:列
src/pages/SettingsPage.tsx:42:13

# 也常见: 绝对路径 + 行列
/Users/an/project/packages/web/src/App.tsx:18:7

# URL 和 localhost 也会被识别
http://localhost:5173

# 不太好: 缺少可解析路径
Error at SettingsPage line forty-two
```

TIP

### 输出相对路径时要注意 cwd

如果终端当前目录在项目根,`src/App.tsx:18:7` 很好解析。如果 cwd 在子目录,同样的相对路径可能指向错误位置。

TIP

### 日志库也要按可点击格式输出

测试、lint、构建脚本的错误最好都输出 `file:line:column`。这会让「看错误 → 跳源码 → 修复」变成一次点击。

## Terminal、Task、Debug 怎么分工

BOUNDARY

| 入口 | 适合做什么 | 不适合做什么 | 例子 |
| --- | --- | --- | --- |
| Terminal | 探索、临时命令、交互式 REPL、一次性排查。 | 团队共享的固定流程。 | `rg "TODO"`、`curl localhost:3000/health` |
| Task | 可重复命令、一键启动、跑测试、构建、生成代码。 | 需要断点、变量观察的调试。 | `npm run dev`、`go test ./...` |
| Debug | 断点、单步、watch、变量、调用栈、多进程 attach。 | 纯粹命令编排。 | Node launch、Go attach、浏览器调试。 |

今天先把 Terminal 练熟;明天把稳定命令升级为 tasks.json。

## 动手实验

3 LABS

### Lab 1 — 建一个 clean terminal profile

目标:区分默认 shell 与干净 shell,理解 profile 如何影响环境。

1. 打开 User Settings JSON,加入上文的 `clean zsh` profile
2. 执行 `Terminal: Create New Terminal With Profile`
3. 选择 `clean zsh`
4. 分别运行 `echo $SHELL`、`pwd`、`env | sort`
5. 再开一个默认 zsh,比较两边环境变量和启动速度
6. 把 clean terminal 重命名为 `clean`

### Lab 2 — 搭一个三终端开发台

目标:为 web、api、scratch 三类命令建立清晰边界。

```
web → npm run dev
api → npm run dev:api
scratch → curl localhost:3000/health / rg / git status
```

1. 打开三个 terminal tab,分别重命名为 `web`、`api`、`scratch`
2. 给 `web` 和 `api` 设置不同颜色或图标
3. 在 web/api 中运行长期进程;在 scratch 中运行临时命令
4. 把 web terminal split 成左右两个 pane:左边跑服务,右边跑 curl
5. 练习关闭 scratch 后重新创建,但保留 web/api 不动

### Lab 3 — 打通日志到源码跳转

目标:让终端输出的错误位置变成可点击链接。

```
mkdir -p src/pages
printf "export const line = 1;\n" > src/pages/SettingsPage.tsx
printf "src/pages/SettingsPage.tsx:1:14\nhttp://localhost:3000\n"
```

1. 在项目根运行上面的命令,创建一个测试文件并输出路径
2. 按住 ⌘(Win/Linux: Ctrl)悬停终端里的 `src/pages/SettingsPage.tsx:1:14`
3. 点击链接,确认 VSCode 跳到对应文件与位置
4. 再输出一个不存在的路径,观察 VSCode 如何处理
5. 切换到子目录后重复输出同一个相对路径,理解 cwd 对路径解析的影响

REFLECTION

### 三个 Lab 的纵深

Lab 1 关注 shell 环境,Lab 2 关注并行工作流,Lab 3 关注输出到源码的闭环。终端不是越多越强,而是每个终端都要有清楚职责。

CHALLENGE

### 附加挑战

把你最常跑的 3 条命令整理成「长期进程」「临时检查」「可复用流程」三类。第三类留到 Day10 改造成 `tasks.json`。

## 常见疑问

5 QUESTIONS

### Q1 · 既然有系统终端,为什么还要用 VSCode 集成终端?

ANS

集成终端的优势是上下文闭环:它知道当前 workspace,输出里的文件路径能跳源码,多个终端能跟编辑器窗口一起保存和恢复,命令失败也能通过 Shell Integration 标出来。系统终端仍然有价值,比如全局运维、长时间独立任务、多窗口布局。但日常项目开发,集成终端的上下文优势更大。

### Q2 · Profile 应该写在 User Settings 还是 Workspace Settings?

ANS

个人偏好写 User,项目约定写 Workspace。比如你喜欢 zsh、字体、scrollback,这是个人偏好;某项目必须从特定 cwd 启动、需要注入非敏感环境变量、推荐用某个 shell,可以放 Workspace。敏感 token、私人绝对路径不要写进会提交的 workspace 文件。

### Q3 · 多根工作区里,新 terminal 到底从哪个目录启动?

ANS

取决于你创建终端时的上下文和 `terminal.integrated.cwd` 设置。多根工作区里最好养成先运行 `pwd` 的习惯,尤其是安装依赖、删除文件、运行迁移脚本前。也可以从 Explorer 中右键某个文件夹选择在集成终端中打开,这样 cwd 更明确。

### Q4 · 为什么终端里的文件路径有时不能点击?

ANS

常见原因有三个:(1) 输出格式不标准,建议用 `file:line:column`；(2) 相对路径和当前 cwd 对不上；(3) 文件不存在或路径被日志截断。先确认终端 cwd,再输出绝对路径测试。如果绝对路径能点击,问题通常在相对路径解析或日志格式。

### Q5 · 什么时候应该从 Terminal 升级到 Task?

ANS

当一条命令被你重复执行、需要固定参数、希望团队共享、需要和问题匹配器或调试联动时,就该升级成 Task。Terminal 适合探索,Task 适合流程。一个好判断是:如果你已经第三次从历史里翻同一条命令,它大概率值得写进 `tasks.json`。

## 复盘问题

5 QUESTIONS

1. Terminal Profile 中 `path`、`args`、`env` 分别控制什么?
2. 为什么多根工作区里运行命令前要确认 `pwd`?
3. 长期运行进程和临时命令为什么最好不要混在同一个 terminal?
4. Shell Integration 让 VSCode 额外感知到了哪些信息?
5. 什么情况下应该继续用 Terminal,什么情况下应该升级到 Day10 的 Task?

## 今日检查清单

8 ITEMS

- 能用 ⌃` / Ctrl ` 快速显示和隐藏集成终端
- 能创建 terminal profile,并选择默认 profile
- 理解 `terminal.integrated.cwd` 与 `${workspaceFolder}` 的作用
- 能把 web / api / scratch 三类终端命名并分开使用
- 能使用 split terminal 组织强关联命令
- 已开启并理解 Shell Integration 的命令装饰与目录感知
- 能让 `file:line:column` 格式的日志跳转到源码
- 能判断某条命令该留在 Terminal,还是升级为 Task

## 推荐阅读

3 ITEMS

OFFICIAL

### VSCode Integrated Terminal

官方集成终端文档。重点看 profiles、cwd、shell integration、links、persistent sessions。

OFFICIAL

### Terminal Profiles

Profile 配置说明。不同操作系统的 profile 字段略有差异,需要按本机 shell 调整。

NEXT

### Tasks in VSCode

明天的主题。把今天在终端里跑熟的命令沉淀成可复用、可共享、可和调试联动的任务。

## Day 10 预告

NEXT

COMING NEXT

### 任务系统 tasks.json

今天我们把命令放进项目上下文。明天继续往自动化推进: `tasks.json`、npm / shell / 自定义 task、problemMatcher、group、dependsOn、preLaunchTask。 学完后,启动服务、跑测试、构建、生成代码都可以从「手敲命令」变成「可复用动作」。

"终端不是编辑器旁边的黑盒,它是项目控制台里最灵活的手。"

DAY 09 · VSCODE 21-DAY ROADMAP
