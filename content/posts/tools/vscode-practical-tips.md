---
title: "VSCode 最实用技巧与效率工具清单"
date: '2026-06-20'
draft: false
description: "一份面向日常开发的 VSCode 实用技巧与效率工具清单：快捷键、搜索替换、多光标、Snippets、工作区、终端、Tasks、Git、Profiles，以及常用扩展组合与可复制配置。"
toc: true
tags:
  - VSCode
  - Tools
  - Productivity
  - Editor
---

VSCODE · PRACTICAL TIPS · PRODUCTIVITY

# 最实用技巧与 _效率工具清单_

这不是「扩展越多越强」的清单。真正高效的 VSCode 来自三层: 先练熟内建能力,再用少量扩展补齐工作流,最后把配置、任务、推荐扩展沉淀到项目里。 目标是让你每天少切窗口、少重复输入、少误改、多看清上下文。

**SCOPE** daily development **FOCUS** built-in first **TOOLS** curated extensions **OUTPUT** copyable configs

## 效率地图

OVERVIEW

> **图：VSCode 效率地图**
>
> - VSCode Productivity Stack
> - NAVIGATE · EDIT · SEARCH · AUTOMATE · REVIEW
> - 01 · FIND
> - 快速抵达
> - 02 · EDIT
> - 批量编辑
> - 03 · BUILD
> - 任务自动化
> - 04 · REVIEW
> - 变更审查
> - 05 · SHARE
> - 项目沉淀
> - 最重要的顺序
> - 内建能力 → 少量扩展 → settings/tasks/snippets/extensions.json → 团队共享

DO NOT INSTALL YOUR WAY OUT OF NOT KNOWING THE EDITOR

## 先练熟这 12 个内建技巧

BUILT-IN FIRST

01 · COMMAND

### 命令面板是总入口

⌘⇧P / Ctrl Shift P。不会找菜单时,先搜命令。VSCode 的大多数能力都能从这里发现。

02 · QUICK OPEN

### 文件别靠树里翻

⌘P / Ctrl P 快速打开文件。输入文件名片段即可,比 Explorer 翻目录快很多。

03 · SYMBOL

### 按符号跳转

⌘T / Ctrl T 全局符号,⌘⇧O / Ctrl Shift O 当前文件符号。读长文件必备。

04 · MULTI CURSOR

### 批量编辑不要手敲

⌘D / Ctrl D 选下一个相同,⌥Click / Alt Click 任意加光标。

05 · SEARCH

### 搜索范围先收窄

⌘⇧F / Ctrl Shift F 跨文件搜索。配合 include/exclude glob,大型替换前先缩小范围。

06 · REGEX

### 正则替换是永久多光标

用捕获组 `$1`、命名捕获、大小写转换做结构化替换。改 import、重命名字段非常快。

07 · SNIPPET

### 高频模板一键展开

React 组件、测试骨架、错误返回、日志格式都适合 snippet。个人放 User,团队放 `.vscode/*.code-snippets`。

08 · WORKSPACE

### 复杂项目用工作区

`.code-workspace` 能保存多根目录、设置、推荐扩展。前端 + 后端 + 文档适合一起组织。

09 · TERMINAL

### 终端放回项目里

用 terminal profile、split、命名终端。长期进程和临时命令分开,日志路径可点击跳源码。

10 · TASKS

### 重复命令写成 task

第三次运行同一条命令时,考虑写进 `tasks.json`。配 problemMatcher 接入 Problems 面板。

11 · GIT

### 提交前一定看 diff

Source Control 最强能力是 stage hunk / selected ranges。一个提交一个意图,别把调试日志带进去。

12 · PROFILES

### 按场景切换编辑器

用 Profiles 分离前端、后端、写作、演示环境。减少扩展互相污染,也方便临时干净环境排错。

## 高频快捷键速查

SHORTCUTS

| 动作 | macOS | Windows / Linux | 使用场景 |
| --- | --- | --- | --- |
| 命令面板 | ⌘⇧P | Ctrl Shift P | 找任何命令。 |
| 快速打开文件 | ⌘P | Ctrl P | 不要在文件树里翻。 |
| 全局搜索 | ⌘⇧F | Ctrl Shift F | 跨文件定位、重构前调研。 |
| 选下一个相同 | ⌘D | Ctrl D | 局部批量编辑。 |
| 选择全部相同 | ⌘⇧L | Ctrl Shift L | 当前文件大批量修改。 |
| 跳到定义 | F12 | F12 | 读代码主路径。 |
| 查看引用 | ⇧F12 | Shift F12 | 改函数前看影响面。 |
| 重命名符号 | F2 | F2 | 优先用语义重命名,少用全文替换。 |
| 打开终端 | ⌃` | Ctrl ` | 命令回到项目上下文。 |
| 运行默认构建任务 | ⌘⇧B | Ctrl Shift B | 触发 tasks.json 的默认 build。 |
| Source Control | ⌃⇧G | Ctrl Shift G | 看 diff、stage hunk、commit。 |
| Problems 面板 | ⌘⇧M | Ctrl Shift M | 集中处理 lint / type / build 错误。 |

## 推荐扩展组合

EXTENSIONS

BASELINE

### 几乎所有项目都用得上

EditorConfig.EditorConfig
esbenp.prettier-vscode
dbaeumer.vscode-eslint
usernamehw.errorlens

统一缩进和格式化,把 lint/type 错误提前显示出来。Error Lens 很提效,但如果觉得太吵,可以降低提示级别。

GIT

### 变更理解与协作

eamodio.gitlens
GitHub.vscode-pull-request-github

GitLens 用来追溯行级历史、commit 上下文。GitHub Pull Requests 适合在编辑器里看 PR、issue 和 review。

FRONTEND

### 前端开发

bradlc.vscode-tailwindcss
stylelint.vscode-stylelint
formulahendry.auto-rename-tag

Tailwind 项目优先装 Tailwind CSS IntelliSense。CSS 规范严格的团队补 Stylelint。

REMOTE

### 远程和容器

ms-vscode-remote.remote-ssh
ms-vscode-remote.remote-containers
ms-vscode-remote.remote-wsl

远程开发优先用官方 Remote 系列。把运行环境隔离到 SSH、容器或 WSL,减少本机环境漂移。

DOCS

### Markdown 与文档

yzhang.markdown-all-in-one
DavidAnson.vscode-markdownlint
Gruntfuggly.todo-tree

Markdown All in One 管目录、快捷键、预览体验。markdownlint 让团队文档风格更一致。Todo Tree 收拢 TODO/FIXME。

API

### 接口调试

humao.rest-client
rangav.vscode-thunder-client

REST Client 适合把请求写进仓库,便于 review 和共享。Thunder Client 更像轻量 Postman,适合图形化调试。

扩展原则: 一个场景只保留 1-2 个核心扩展。扩展越多,补全、启动、错误提示越容易互相打架。

## 可复制配置

SETTINGS

### 1. User Settings 基础版

```
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.snippetSuggestions": "top",
  "editor.tabCompletion": "on",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 800,
  "search.useIgnoreFiles": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  },
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.expand": false,
  "explorer.fileNesting.patterns": {
    "package.json": "package-lock.json,yarn.lock,pnpm-lock.yaml,bun.lockb",
    "tsconfig.json": "tsconfig.*.json",
    "*.ts": "$(capture).test.ts,$(capture).spec.ts,$(capture).d.ts",
    "*.tsx": "$(capture).test.tsx,$(capture).spec.tsx"
  },
  "terminal.integrated.shellIntegration.enabled": true,
  "git.autofetch": true,
  "git.confirmSync": true,
  "git.enableSmartCommit": false
}
```

### 2. 项目推荐扩展 .vscode/extensions.json

```
{
  "recommendations": [
    "EditorConfig.EditorConfig",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "usernamehw.errorlens",
    "eamodio.gitlens"
  ],
  "unwantedRecommendations": []
}
```

### 3. 项目任务 .vscode/tasks.json

```
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
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
      "label": "build",
      "type": "npm",
      "script": "build",
      "group": { "kind": "build", "isDefault": true },
      "problemMatcher": "$tsc"
    },
    {
      "label": "precheck",
      "dependsOn": ["build"],
      "dependsOrder": "sequence",
      "problemMatcher": []
    }
  ]
}
```

## 按场景怎么用

WORKFLOWS

| 场景 | 最佳入口 | 组合动作 |
| --- | --- | --- |
| 快速理解陌生项目 | ⌘P / Ctrl P + Search | 先看 README/package/tasks,再用全局搜索入口函数、配置、路由、错误码。 |
| 批量改 import / 字段名 | Search + Regex | 先 include/exclude 收窄范围,再用捕获组替换,最后看 Source Control diff。 |
| 写重复样板代码 | Snippets + Emmet | 组件、测试、错误返回用 snippet; HTML/CSS 结构用 Emmet。 |
| 本地启动项目 | Terminal + Tasks | 第一次在 terminal 试;稳定后写进 tasks.json,长期进程用 dedicated panel。 |
| 提交前自检 | Source Control + Tasks | 看 diff → stage hunk → 看 staged diff → 跑 precheck → commit。 |
| 排查谁改了这行 | Timeline + GitLens | 先看文件 Timeline,再用 blame 追到 commit / PR / 需求背景。 |
| 减少团队环境差异 | .vscode 目录 | 提交 settings、tasks、extensions、snippets,但不要提交个人主题、字体、token。 |

## 一小时落地清单

CHECKLIST

- 把命令面板、快速打开、全局搜索、多光标、Source Control 快捷键练到不用想
- 安装基础扩展: EditorConfig、Prettier、ESLint、Error Lens、GitLens
- 复制基础 settings,再按项目调整 formatOnSave、search.exclude、file nesting
- 给当前项目加 `.vscode/extensions.json`,沉淀团队推荐扩展
- 把最常运行的一条命令写进 `tasks.json`
- 把最近重复写过 3 次的代码做成 snippet
- 创建一个专门的 Profile: Frontend / Backend / Writing / Clean Debug
- 从今天开始,每次提交前先看 staged diff

## 参考资料

SOURCES

OFFICIAL

### VSCode Tips and Tricks

[官方技巧总览](https://code.visualstudio.com/docs/getstarted/tips-and-tricks),适合查快捷键、编辑、导航、搜索等内建能力。

OFFICIAL

### Settings / Profiles / Tasks

[Settings](https://code.visualstudio.com/docs/configure/settings)、[Profiles](https://code.visualstudio.com/docs/editor/profiles)、[Tasks](https://code.visualstudio.com/docs/editor/tasks) 是效率配置的三根柱子。

MARKETPLACE

### Extension Marketplace

[Marketplace](https://marketplace.visualstudio.com/VSCode) 用来核对扩展 ID、安装量、更新状态和项目说明。

"真正高效的 VSCode,不是装满扩展,而是让常用动作都有最短路径。"

VSCODE PRACTICAL TIPS · PRODUCTIVITY TOOLS
