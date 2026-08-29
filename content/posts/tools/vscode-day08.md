---
title: "Day 08 · 文件浏览器与多根工作区"
date: '2026-05-27'
draft: false
description: "VSCode 文件浏览器与多根工作区：Explorer、.code-workspace、Multi-root、file nesting、Breadcrumbs、Workspace Trust 与项目视图整理。把 VSCode 从打开文件夹升级成项目控制台。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 08
---

DAY 08 · VSCODE ROADMAP · 21 DAYS

# 把文件夹升级成 _工作区_

前四天我们把编辑器内部的速度练起来了。今天开始进入「工作区与终端」阶段: 不再把 VSCode 当成一个单纯的文件夹浏览器,而是把它整理成项目控制台。 你会学会 **.code-workspace、多根目录、Explorer 整理、file nesting、Breadcrumbs 与 Workspace Trust** 。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **POWER MOVE**.code-workspace

## 思维导图

OVERVIEW

> **图：Day 08 文件浏览器与多根工作区思维导图**
>
> - DAY 08 · EXPLORER · WORKSPACE
> - FOLDER · MULTI-ROOT · NESTING · BREADCRUMB · TRUST
> - 01 · EXPLORER
> - 文件视图
> - 02 · WORKSPACE
> - .code-workspace
> - 03 · MULTI-ROOT
> - 多个项目根
> - 04 · NESTING
> - 文件折叠
> - 05 · WAYFIND
> - Breadcrumbs
> - 可视化目录
> - Explorer / Outline
> - Timeline / Open Editors
> - 保存工作台
> - folders
> - settings / extensions
> - 组合仓库
> - frontend / backend
> - docs / infra
> - 降低噪音
> - lock / test / map
> - nested under source
> - 知道自己在哪
> - path breadcrumb
> - symbol breadcrumb
> - 核心判断
> - 单项目用 FOLDER · 复杂项目用 WORKSPACE · 视觉噪音用 NESTING / EXCLUDE

A WORKSPACE IS A SAVED PROJECT VIEW

## 今天的心智模型

MODEL

FOLDER

### 打开一个目录

最普通的模式。VSCode 以这个目录为根,读取里面的 `.vscode/settings.json`、任务、调试配置。适合单仓库、单服务。

WORKSPACE

### 保存一个项目视图

`.code-workspace` 不是代码目录,而是 VSCode 的项目视图文件。它能保存多个根目录、工作区设置、推荐扩展、任务配置。

MULTI-ROOT

### 把多个根放到一起

适合前端 + 后端 + 文档 + 基础设施分在不同目录或仓库的项目。一个窗口里看到多个 root,搜索、终端、任务都能带上上下文。

一句话: folder 是目录入口,workspace 是可复用的工作台配置。

## Explorer 不只是文件树

ANATOMY

| 区域 | 用途 | 建议用法 |
| --- | --- | --- |
| Explorer | 项目文件树。创建、重命名、移动、删除文件。 | 尽量把长期不看的生成物隐藏或折叠,让源码目录露出来。 |
| Open Editors | 当前窗口打开过的文件列表。 | 适合短期上下文切换。文件一多就清理,否则会变成第二个杂乱文件树。 |
| Outline | 当前文件的符号结构:函数、类、变量、标题。 | 读长文件时打开。它比滚动更稳定,也能帮助你判断文件是否过大。 |
| Timeline | 当前文件的本地历史、Git 历史、保存节点。 | 小规模误改时非常有用。大型回滚仍以 Git 为准。 |
| Breadcrumbs | 编辑器顶部的路径 + 符号导航。 | 在深目录、长文件里快速确认「我在哪」,也可直接跳到父目录或上层符号。 |

## 高频入口

SHORTCUTS

| 动作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 打开 Explorer | ⌘⇧E | Ctrl Shift E | Activity Bar 的文件视图入口。 |
| 快速打开文件 | ⌘P | Ctrl P | 文件多时优先用它,不要在树里慢慢翻。 |
| 在 Explorer 中显示当前文件 | ⌘⇧P → Reveal Active File in Explorer | Ctrl Shift P → Reveal Active File in Explorer | 读代码迷路时,一键回到文件树位置。 |
| 重命名文件 | F2 | F2 | 在 Explorer 中选中文件后触发。移动文件建议用拖拽或剪切粘贴。 |
| 折叠所有文件夹 | Explorer 工具栏 Collapse Folders | Explorer 工具栏 Collapse Folders | 文件树展开过多时快速清场。 |
| 聚焦 Breadcrumbs | ⌘⇧. | Ctrl Shift . | 用键盘进入顶部路径 / 符号导航。 |
| 保存工作区 | ⌘⇧P → Save Workspace As | Ctrl Shift P → Save Workspace As | 把当前窗口的多根目录保存成 `.code-workspace`。 |

## .code-workspace 文件长什么样

STRUCTURE

它本质是一个 JSON 文件。你可以用菜单生成,也可以手写。 下面是一份适合前后端分离项目的最小可用模板。

```
{
  "folders": [
    { "name": "web", "path": "packages/web" },
    { "name": "api", "path": "packages/api" },
    { "name": "docs", "path": "docs" }
  ],
  "settings": {
    "files.exclude": {
      "**/.DS_Store": true,
      "**/dist": true,
      "**/coverage": true
    },
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
    }
  },
  "extensions": {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode"
    ]
  }
}
```

FOLDERS

### 定义根目录

`path` 可以是相对路径或绝对路径。`name` 是 Explorer 里显示的名字,建议用短名。

SETTINGS

### 保存项目视图偏好

适合放排除规则、file nesting、格式化策略这类工作区级设置。不要把个人字体、主题放进来。

EXTENSIONS

### 推荐扩展

用 recommendations 引导团队安装必要扩展。它不会强制安装,但会在打开项目时提示。

## Multi-root 解决什么问题

SCENARIOS

MONOREPO

### 一个仓库,多个子项目

repo/
&nbsp;&nbsp;packages/web/
&nbsp;&nbsp;packages/api/
&nbsp;&nbsp;packages/shared/
&nbsp;&nbsp;docs/

用 workspace 只暴露你当下关心的子目录,减少根目录噪音。

MULTI-REPO

### 多个仓库,一个业务场景

~/work/order-web/
~/work/order-api/
~/work/order-deploy/
~/work/order-docs/

每个仓库保持独立 Git,但 VSCode 一个窗口里同时导航和搜索。

LEARNING

### 源码 + 笔记 + 实验

~/lab/source-code/
~/lab/notes/
~/lab/scratch/
~/lab/references/

适合学习型工作区。读源码、写笔记、做实验不用来回开窗口。

CLIENT

### 客户项目隔离

client-a-web/
client-a-api/
client-a-infra/
client-a-runbook/

一个客户一个 workspace 文件,切换上下文时只打开对应工作台。

## File Nesting: 把噪音收起来

NESTING

File nesting 不是删除文件,而是在 Explorer 里把相关文件折到主文件下面。 它特别适合 lockfile、测试文件、类型声明、source map、构建产物。

| 主文件 | 折叠规则 | 效果 |
| --- | --- | --- |
| `package.json` | `package-lock.json,yarn.lock,pnpm-lock.yaml,bun.lockb` | 锁文件跟随 package.json,根目录清爽很多。 |
| `tsconfig.json` | `tsconfig.*.json` | 把 tsconfig.build.json、tsconfig.node.json 收在一起。 |
| `*.ts` | `$(capture).test.ts,$(capture).spec.ts,$(capture).d.ts` | 测试与类型声明跟随源码文件。 |
| `*.js` | `$(capture).js.map,$(capture).min.js` | source map 与压缩产物不再冲到主视图。 |
| `*.css` | `$(capture).module.css,$(capture).css.map` | 样式相关文件可以按主样式收纳。 |

经验规则: 关联强、低频打开、名字可由主文件推导出来的文件,适合 nesting。

## Breadcrumbs: 读代码时不迷路

WAYFINDING

> **图：Breadcrumbs 路径与符号导航**
>
> - packages
> - ›
> - web
> - src
> - pages
> - Settings.tsx
> - SettingsPage
> - handleSubmit
> - 路径 Breadcrumb
> - 定位目录 · 跳父级 · 看模块归属
> - 符号 Breadcrumb
> - 定位函数 · 跳类 / 方法 · 读长文件

BREADCRUMB = PATH CONTEXT + SYMBOL CONTEXT

PATH

### 路径导航

当你从 ⌘P 跳进一个深层文件,第一眼先看 Breadcrumb。它告诉你模块归属,也能快速跳回同级目录。

SYMBOL

### 符号导航

在长文件中,符号 Breadcrumb 能显示当前函数 / 类 / 方法。比靠滚动条猜位置可靠得多。

## Workspace Trust: 先判断能不能信任

SAFETY

TRUSTED

### 可信项目

你自己的项目、公司内部仓库、明确来源的开源仓库。可以开启任务、调试、扩展自动运行等完整能力。

RESTRICTED

### 受限模式

下载的陌生代码、面试题压缩包、临时分析的可疑仓库。先用 Restricted Mode 看源码,不要立刻允许脚本和扩展运行。

RULE

### 信任的是目录

VSCode 的信任通常绑定目录。把不同来源的代码分开存放,不要把陌生仓库扔进一个已经信任的大目录里。

安全心法: 代码能读不等于能运行；陌生项目先看,再信任。

## 怎么选择工作区形态

DECISION

OPEN FOLDER WHEN

### 项目单一、结构清晰

例如一个普通前端应用、一个 Go 服务、一个博客仓库。直接 Open Folder 足够,再配合项目内 `.vscode/settings.json`。

SAVE WORKSPACE WHEN

### 每次都要打开一组目录

如果你反复打开 web + api + docs,就该保存成 `.code-workspace`。一次配置,之后双击恢复。

MULTI-ROOT WHEN

### 多个根各有独立上下文

不同仓库、不同语言栈、不同 Git 根。Multi-root 能把它们放在同一个窗口,但不强行合并它们。

AVOID

### 不要把一切都塞进一个工作区

过大的 workspace 会让搜索、Explorer、终端上下文都变重。一个工作区最好对应一个真实任务场景。

## 动手实验

3 LABS

### Lab 1 — 搭一个多根工作区

目标:创建一个模拟前后端项目,并保存成 `learning.code-workspace`。

```
vscode-day08-lab/
  packages/
    web/
      src/
    api/
      src/
  docs/
  infra/
```

1. 创建上面的目录结构,用 VSCode 打开 `vscode-day08-lab`
2. 执行 `File: Add Folder to Workspace`,把 `packages/web`、`packages/api`、`docs` 作为根加入
3. 执行 `Workspaces: Save Workspace As`,保存为 `learning.code-workspace`
4. 关闭窗口后双击 `learning.code-workspace`,确认多根目录被恢复
5. 观察 Explorer 顶层是否显示 web / api / docs 三个 root

### Lab 2 — 配置 file nesting

目标:把 lockfile、测试文件、类型文件折叠到主文件下面。

```
{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.expand": false,
  "explorer.fileNesting.patterns": {
    "package.json": "package-lock.json,yarn.lock,pnpm-lock.yaml",
    "*.ts": "$(capture).test.ts,$(capture).spec.ts,$(capture).d.ts",
    "*.tsx": "$(capture).test.tsx,$(capture).spec.tsx"
  }
}
```

1. 在 workspace 的 `settings` 中加入上面配置
2. 创建 `Button.tsx`、`Button.test.tsx`、`Button.spec.tsx`
3. 创建 `package.json` 与 `pnpm-lock.yaml`
4. 回到 Explorer,观察测试文件和 lockfile 是否被折叠
5. 把 `explorer.fileNesting.expand` 改成 `true`,对比默认展开效果

### Lab 3 — 用 Breadcrumbs 读一个深层文件

目标:练习不依赖文件树,只用 Breadcrumbs 和快速打开定位。

1. 在 `packages/web/src/pages/settings/SettingsPage.tsx` 写几个函数: `SettingsPage`、`handleSubmit`、`validateForm`
2. 用 ⌘P(Win: Ctrl P)直接打开 `SettingsPage.tsx`
3. 看编辑器顶部 Breadcrumb,确认当前路径和当前函数
4. 按 ⌘⇧.(Win: Ctrl Shift .)聚焦 Breadcrumbs
5. 用键盘选择上层目录或函数名跳转,体验路径导航与符号导航的区别

REFLECTION

### 三个 Lab 的纵深

Lab 1 解决项目入口,Lab 2 解决视觉噪音,Lab 3 解决定位感。工作区管理不是为了好看,是为了减少每次进入项目时的认知摩擦。

CHALLENGE

### 附加挑战

把你当前最常打开的 2-4 个项目目录整理成一个真实 `.code-workspace`,并加入 file nesting、search.exclude、extensions.recommendations。

## 常见疑问

5 QUESTIONS

### Q1 · `.code-workspace` 文件要不要提交到 Git?

ANS

看它是否代表团队约定。如果里面是项目结构、推荐扩展、排除规则、任务配置,可以提交。如果里面是你的本机绝对路径、个人主题、个人字体、临时目录,不要提交。团队共享 workspace 最好使用相对路径,并把个人偏好留在 User Settings。

### Q2 · Multi-root 和 monorepo 是一回事吗?

ANS

不是。Monorepo 是代码组织方式:多个项目放在一个仓库。Multi-root 是 VSCode 窗口组织方式:一个窗口里放多个根目录。它可以用于 monorepo,也可以用于多个独立仓库。简单说,monorepo 发生在 Git 和文件系统层,Multi-root 发生在编辑器视图层。

### Q3 · `files.exclude`、`search.exclude`、file nesting 有什么区别?

ANS

`files.exclude` 是从 Explorer 里隐藏,眼不见；`search.exclude` 是搜索时跳过,不影响 Explorer；file nesting 是文件仍可见,只是折到主文件下面。三者可以配合:生成物用 exclude 隐藏,源码关联文件用 nesting 收纳,大目录用 search.exclude 降低搜索噪音。

### Q4 · 为什么不建议把所有仓库都放进一个超大 workspace?

ANS

因为工作区越大,你的搜索范围、文件树、符号索引、终端上下文都会变重。更糟的是它会稀释任务边界:你很难判断当前窗口到底服务哪个目标。一个好的 workspace 应该围绕一个真实工作场景,比如「订单系统开发」或「博客写作」,而不是「我的所有代码」。

### Q5 · Workspace Trust 每次弹出来很烦,可以直接全信任吗?

ANS

不建议。信任后,项目里的任务、调试配置、部分扩展能力可能运行代码。你自己的项目和可信来源可以信任；陌生压缩包、网上下载的仓库、临时排查的代码先保持 Restricted Mode。更好的习惯是按来源分目录:可信工作目录长期信任,临时下载目录默认不信任。

## 复盘问题

5 QUESTIONS

1. `Open Folder` 和打开 `.code-workspace` 的本质区别是什么?
2. `folders`、`settings`、`extensions.recommendations` 在 workspace 文件里分别负责什么?
3. `files.exclude`、`search.exclude`、`explorer.fileNesting.patterns` 应该分别用于什么场景?
4. Breadcrumbs 中路径导航和符号导航分别解决什么问题?
5. 什么时候应该信任一个 workspace?什么时候应该保持 Restricted Mode?

## 今日检查清单

8 ITEMS

- 能区分 Folder、Workspace、Multi-root 三个概念
- 能创建并重新打开一个 `.code-workspace` 文件
- 知道 workspace 文件中的 `folders`、`settings`、`extensions` 各自用途
- 能为项目配置 `files.exclude` 与 `search.exclude`
- 能写出至少 3 条 file nesting pattern
- 能用 ⌘P / Ctrl P 快速打开文件,而不是只靠 Explorer 翻目录
- 能用 Breadcrumbs 判断当前路径和当前函数位置
- 理解 Workspace Trust 的安全意义,不会盲目信任陌生代码

## 推荐阅读

3 ITEMS

OFFICIAL

### VSCode Multi-root Workspaces

官方多根工作区文档。重点看 workspace 文件结构、root 命名、跨根搜索与设置作用域。

OFFICIAL

### VSCode Workspace Trust

官方工作区信任模型说明。理解 Restricted Mode 下哪些能力会被限制。

REFERENCE

### VSCode File Nesting

查 file nesting pattern 语法和常见配置。重点理解 `$(capture)` 如何匹配同名文件。

## Day 09 预告

NEXT

COMING NEXT

### 集成终端深入

今天我们把项目视图整理好了。明天继续往「项目控制台」推进: 终端 Profile、多个 terminal、split、working directory、shell integration、点击日志路径跳源码。 学完后,你会少开很多独立终端窗口。

"工作区不是文件夹的别名,而是你对项目入口、噪音和上下文的选择。"

DAY 08 · VSCODE 21-DAY ROADMAP
