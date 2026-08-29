---
title: "Day 02 · 界面骨架与命令面板"
date: '2026-05-24'
draft: false
description: "拆解 VSCode 的「五大件」—— Activity Bar / Side Bar / Editor / Panel / Status Bar 的边界与协作，以及命令面板 ⌘⇧P 的四种模式（> / @ / # / :）—— 老司机的唯一菜单。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 02
---

DAY 02 · VSCODE ROADMAP · 21 DAYS

# _五大件_ 与一把万能钥匙

很多人用了一年 VSCode，还在用鼠标点菜单——这是「永远停在 60 分」的根本原因。 今天的目标是搞清两件事： 一是 VSCode 的_五大界面区域_各自的职责，让你不再「找不到面板」； 二是_命令面板的四种模式_，让你以后再也不打开菜单。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **KEY HOTKEY** ⌘⇧P

## 思维导图

OVERVIEW

> **图：Day 02 思维导图**
>
> - DAY 02 · 界面骨架 + 命令面板
> - ANATOMY · COMMAND · VIEW · PRACTICE
> - 01 · ANATOMY
> - 五大界面区域
> - 02 · COMMAND
> - 命令面板四模式
> - 03 · VIEW
> - 视图切换与 Zen
> - 04 · PRACTICE
> - 动手练习
> - Activity Bar
> - Side Bar (Primary/Secondary)
> - Editor Group
> - Panel · Status Bar
> - \> 命令搜索
> - @ 当前文件符号
> - # 工作区符号
> - : 跳行 / 空 = 文件
> - ⌘B · ⌘J Side/Panel
> - ⌘⇧E/F/G/D/X 视图
> - Zen Mode
> - 布局重排与还原
> - 无鼠标 5 分钟
> - 四模式速查
> - 布局重排
> - 绑定自定义快捷键
> - DELIVERABLES
> - 界面五区域命名清楚
> - 四种前缀肌肉记忆
> - 自己的布局方案
> - 5 分钟无鼠标完成

FIG · Day 02 全景：解剖界面 → 学命令面板 → 玩视图切换 → 全键盘实操

## 界面解剖：五大区域

20 MIN

不管你用 VSCode 多少年，它的窗口永远由_五个区域_组成。 看似简单，但每一块都有自己的边界与最佳实践—— 搞清「文件应该放哪、终端应该放哪、信息应该放哪」，工作流才不会乱。

> **图：VSCode 界面五区域示意**
>
> - VSCODE WINDOW ANATOMY
> - 📁
> - 🔍
> - ⎇
> - ▶
> - ⬚
> - ①
> - ACTIVITY
> - EXPLORER
> - ▾ src
> - ▸ components
> - ▸ pages
> - index.ts
> - package.json
> - README.md
> - ②
> - SIDE BAR
> - index.ts ●
> - utils.ts
> - // edit code here
> - function
> - main() {
> - return
> - "hello"
> - }
> - ③
> - EDITOR GROUP
> - TERMINAL · PROBLEMS · OUTPUT · DEBUG CONSOLE
> - $
> - npm run dev
> - ▸ ready in 312ms
> - ④
> - PANEL
> - SECONDARY
> - (可选 · 默认隐藏)
> - 用于放
> - AI Chat / Outline
> - 第二份 Explorer
> - ⎇ main ↑1↓0
> - ⚠ 0 ⓘ 0
> - Ln 12, Col 4
> - TypeScript
> - UTF-8
> - ⑤ STATUS BAR

FIG · VSCode 窗口由五个区域组成（Secondary Side Bar 默认隐藏）

### 五区域职责对照

| 区域 | 职责 | 切换快捷键 |
| --- | --- | --- |
| ① Activity Bar | 视图切换条 — 文件、搜索、Git、调试、扩展、Account、Settings | `⌘B` 显隐 Side Bar 时一起隐 |
| ② Side Bar | 视图本体 — 显示 Activity Bar 选中那个图标对应的内容 | ⌘B 切显隐 |
| ③ Editor Group | 核心 — 你 95% 的时间在这里。可分屏、可分组、可拖拽 tab | ⌘1/2/3 切组 |
| ④ Panel | 横向工具区 — 终端、问题、输出、调试控制台 | ⌘J 切显隐 / ⌃` 终端 |
| ⑤ Status Bar | 状态条 — git 分支、错误数、行列、语言、编码、Sync 状态 | 点击任意项可触发对应命令 |
| ⑥ Secondary Side Bar | 右侧副边栏 — 放 AI Chat / Outline / Timeline 等次级视图 | ⌘⌥B 切显隐 |

### Activity Bar 五大视图快捷键

EXPLORER · ⌘⇧E

### 文件浏览器

最常驻视图。展示工作区目录树、打开的编辑器、Outline、Timeline。

SEARCH · ⌘⇧F

### 全文搜索

跨整个工作区搜索 / 替换。支持正则、include / exclude glob。Day 06 详讲。

SOURCE CONTROL · ⌘⇧G

### Git 源代码控制

stage / commit / push、diff、blame、merge editor 都在这里。Day 11 详讲。

RUN AND DEBUG · ⌘⇧D

### 运行与调试

断点列表、变量、调用栈、watch。配 launch.json 用。Day 14 详讲。

EXTENSIONS · ⌘⇧X

### 扩展市场

装扩展、管理扩展、查推荐。命令行用 `code --install-extension` 也行。Day 16 详讲。

REMOTE · 可选

### 远程资源管理器

装了 Remote-SSH / Containers 才会出现。Day 17 详讲。

规律：⌘⇧ + 视图首字母 — Explorer/Find/Git/Debug/eXtensions

## 命令面板：四模式速查

20 MIN · MOST IMPORTANT

⌘⇧P（Win/Linux：Ctrl⇧P）是 VSCode 的_唯一菜单_—— 所有功能、所有扩展命令、所有设置入口都能通过它找到。 它能识别_四个前缀字符_，每个字符切换到一种搜索模式。 记住这四个前缀，你就再也不需要鼠标。

\>

COMMAND · 默认模式

### 命令搜索

⌘⇧P 直接打开就是这个模式。模糊搜索任意命令——"Format Document"、"Toggle Word Wrap"、"Reload Window"……所有菜单项 + 所有扩展命令都在这里。

\> format document
\> reload window
\> preferences open user settings

（空）

QUICK OPEN · ⌘P

### 文件搜索

没有前缀时（或直接按 ⌘P），模糊搜索工作区内所有文件名。比鼠标点目录树快十倍。支持驼峰首字母匹配。

index
UC ← 匹配 UserController.ts
src/utils ← 路径片段也行

@

SYMBOL IN FILE · ⌘⇧O

### 当前文件的符号

在当前文件内跳转到任意函数 / 类 / 变量。加 `:` 可以按类别分组（class、function、property……）。

@handleClick
@: ← 按类别分组浏览

#

SYMBOL IN WORKSPACE · ⌘T

### 整个工作区的符号

跨文件搜索符号。要求该语言安装了语言服务器（TypeScript / Python / Go 等都自带）。

#UserService
#calculateTax

:

GO TO LINE · ⌃G

### 跳到指定行

冒号 + 数字直接跳行。报错信息里的 "line 142" 可以一键定位。也可写 `:142:5` 跳到行列。

:142
:142:5 ← 行 142 列 5

?

HELP

### 查看所有前缀

忘了前缀？输入 `?`，VSCode 会列出所有可用的搜索模式与前缀。

? ← 显示全部前缀

### 三个进阶技巧

TIP 01

### 查看命令对应的快捷键

命令面板中每条命令右侧显示对应快捷键。看到一个常用命令没绑定？右侧齿轮直接绑。

TIP 02

### 最近用过的命令置顶

VSCode 自动记住你最近的命令，下次 ⌘⇧P 时优先显示——前几次用面板慢，越用越快。

TIP 03

### 当前位置 ⌘⇧P 不丢上下文

面板里的命令作用于当前光标位置。例如先点光标到函数内 → ⌘⇧P → "Go to Definition"。

### 前 30 天最常用的 10 个命令

| 命令 | 用途 | 建议快捷键 |
| --- | --- | --- |
| Reload Window | VSCode 卡了 / 扩展异常 / 设置不生效 | 已默认 ⌘⇧P 后输入 |
| Format Document | 用 Prettier 等格式化整个文件 | ⌥⇧F |
| Toggle Word Wrap | 开关自动换行 | ⌥Z |
| Preferences: Open User Settings (JSON) | 直接编辑 settings.json | 无 — 记住名字即可 |
| Preferences: Open Keyboard Shortcuts (JSON) | 编辑 keybindings.json | 无 |
| Developer: Toggle Developer Tools | VSCode 本身是 Electron，能开 DevTools 调试扩展 | 无 |
| Change Language Mode | 当前文件按某语言高亮（无后缀文件常用） | 点 Status Bar 右侧语言名也行 |
| Toggle Zen Mode | 全屏专注模式 | ⌘K Z |
| Workbench: Toggle Centered Layout | 编辑器居中（外接大屏写文档舒服） | 无 |
| View: Open View | 显示任意视图（包括扩展自带的） | 无 |

## 视图切换与布局

10 MIN

命令面板解决「找命令」，快捷键解决「频繁切换」。 下面这一小组快捷键值得花 5 分钟死记——之后每天都会用到几十次。

### 显隐切换三件套

| 区域 | 快捷键 | 使用场景 |
| --- | --- | --- |
| Primary Side Bar | ⌘B | 专注写代码时收起，给 Editor 让位 |
| Secondary Side Bar | ⌘⌥B | 需要 AI Chat / Outline 时打开 |
| Panel（底部） | ⌘J | 需要终端 / 看错误时打开 |
| Terminal（直接打开） | ⌃` | 一键开终端（不论 Panel 当前是哪个 tab） |
| Maximize Editor Group | ⌘K Z | 当前编辑器最大化（Zen Mode） |

### 布局重排（不用碰鼠标）

```
# 命令面板常用布局命令
> View: Move Primary Side Bar Right # Side Bar 挪到右边
> View: Move Panel Left / Right / Bottom # Panel 挪到任意一边
> View: Toggle Activity Bar Visibility # 隐藏左侧最窄的图标条
> View: Toggle Centered Layout # 编辑器居中（大屏写文档）
> View: Reset View Locations # 还原默认布局（手抖救星）
> Workbench: Customize Layout # 图形化布局调整向导
```

### 编辑器分屏

⌘\

### 右侧分屏

当前文件复制到右侧组。对比两段代码、文档与代码并排时常用。

⌘K ⌘\

### 下方分屏

纵向分屏。终端在底部时，编辑器上下分两块写。

⌘1 / 2 / 3

### 切换组

有多个编辑器组时，按数字切换焦点。配合 ⌘P 在不同组里打开不同文件。

⌘W

### 关闭当前编辑器

关闭一个 tab（不是窗口）。配合 ⌘⇧T 撤回最近关闭的 tab。

⌘K W

### 关闭组内所有 tab

清空当前编辑器组的所有 tab。开多了想重新组织时用。

⌘⇧T

### 恢复关闭的 tab

类似浏览器 ⌘⇧T。手滑关错文件时的救命快捷键。

## 动手练习

25 MIN · 3 LABS

今天的练习_完全禁用鼠标_（除非快捷键找不到）—— 逼自己把今天讲的快捷键全用一遍。三个 Lab 各对应一个目标：命令面板、布局重排、快捷键绑定。

### Lab 1 — 5 分钟无鼠标挑战

在 Day 01 创建的 `~/vscode-day01` 目录里，完全用键盘完成下面 8 件事。计时 5 分钟。

```
# 在终端里准备好
$ cd ~/vscode-day01 && code .

# 接下来全程键盘 ↓
```

1. 用 ⌘P 打开 `src/index.js`
2. 用 ⌘⇧O 看当前文件有哪些符号
3. 用 :5（即在 Quick Open 输入 `:5`）跳到第 5 行
4. 用 ⌘B 收起 Side Bar，再 ⌘B 展开
5. 用 ⌃` 开终端，执行 `node src/index.js`，看到输出
6. 用 ⌘J 收起 Panel
7. 用 ⌘\ 把当前文件复制到右侧分屏
8. 用 ⌘K Z 进 Zen Mode，再按 Esc Esc 退出

能在 3 分钟内完成 = 良好；5 分钟 = 合格；超过 = 明天再练一次

### Lab 2 — 设计你的布局

默认布局是给 99 分人设计的。你是那个 1 分——花 5 分钟摆一个属于自己的。

1. 命令面板 → `View: Move Primary Side Bar Right` — 文件树挪到右边（左撇子或大屏党会喜欢）
2. 命令面板 → `View: Move Panel Right` — 终端挪到右侧（外接超宽屏时巨爽）
3. 命令面板 → `View: Toggle Activity Bar Visibility` — 隐藏最左侧图标条（用 ⌘⇧E/F/G/D/X 切视图代替）
4. 命令面板 → `View: Toggle Centered Layout` — 编辑器居中（写 Markdown / 看代码时舒服）
5. 觉得不对 → `View: Reset View Locations` 一键还原

**预期观察：** 你会发现自己原本默认接受的"默认"其实并不是唯一选择。挑一个你觉得最顺手的留下来。

### Lab 3 — 给「Reveal in File Explorer」绑快捷键

"Reveal in File Explorer/Finder" 是个高频但默认没绑快捷键的命令——把当前文件在系统文件管理器里打开。今天学的命令面板就是为了让你能 1 分钟内给它绑上。

1. ⌘⇧P → 输入 `Preferences: Open Keyboard Shortcuts`（不是 JSON 版）
2. 在搜索框输入 `reveal in`
3. 找到 **Reveal in Finder** （macOS）/ **Reveal in File Explorer** （Win/Linux）
4. 双击该行（或点左侧 + 图标）
5. 按下你想绑的快捷键，比如 ⌘⌥R，回车保存
6. 打开任意文件，按你绑的快捷键 → 系统文件管理器应该打开并定位到该文件

这是「命令面板 → 快捷键」工作流的核心——遇到任何高频命令都可以走这条链路

REFLECTION

### 三个 Lab 的共性

都在用 **键盘 + 命令面板** 替代鼠标 + 菜单。一旦养成习惯，你会发现 VSCode 的「界面」其实只是「快捷键的可视化提示」。

CHALLENGE

### 附加挑战

把 `View: Toggle Centered Layout` 也绑一个快捷键（比如 ⌘K L）。这是 chord 快捷键的写法，明天的 Day 03 会详细讲多键组合。

## 常见疑问

5 QUESTIONS

### Q1 · 命令面板（⌘⇧P）和 Quick Open（⌘P）到底有什么区别？

ANS

本质是 **同一个** 对话框，只是 **默认前缀不同** 。`⌘P` 打开时输入框是空的，相当于「文件搜索」模式；`⌘⇧P` 打开时输入框预填了 `>`，相当于「命令搜索」模式。所以打开后手动改前缀，两个快捷键能互相切换。记住一个 `⌘⇧P` 也够用——打开后输入 `?` 看所有可用前缀。

### Q2 · 怎么把 Side Bar 永久挪到右边？

ANS

命令面板 → `View: Move Primary Side Bar Right`。VSCode 会记住这个布局，下次启动还在右边。如果你想用 settings.json 持久化，对应键是 `"workbench.sideBar.location": "right"`。 **建议这么做的人** ：大屏右利手——因为眼睛重心在左，左眼角余光看文件树会分散注意力。

### Q3 · 能完全隐藏 Activity Bar 吗？我嫌它占地方。

ANS

能。命令面板 → `View: Toggle Activity Bar Visibility`，或在 settings.json 加 `"workbench.activityBar.location": "hidden"`。 **前提是你已经记熟视图快捷键** ——Explorer ⌘⇧E、Search ⌘⇧F、Git ⌘⇧G、Debug ⌘⇧D、Extensions ⌘⇧X。否则隐藏后你连入口都找不到。

### Q4 · 想找一个功能，但又不知道它叫什么命令，怎么办？

ANS

这正是命令面板模糊搜索擅长的—— **用英文关键词** 多试几个。比如想要"自动换行"，搜 `wrap` 能找到 **Toggle Word Wrap** ；想要"启动开发服务器"，搜 `task` 或 `run`。VSCode 命令名遵循 `类别: 动作` 格式（如 `View: Toggle ...`、`Preferences: Open ...`），熟悉这个规律后猜中率会越来越高。还是猜不到？官方文档有 **Default Keybindings JSON** 列出全部命令名，可以浏览一遍。

### Q5 · Quick Open（⌘P）能搜文件夹吗？为什么我搜目录名不出来？

ANS

Quick Open 默认只搜 **文件** 。但你可以输入 **路径片段** —— 比如想找 `src/components/Button/index.tsx`，可以输入 `components/index` 同时匹配「目录名片段 + 文件名片段」。如果真的想列出某个目录的所有文件，更直接的做法是用 ⌘⇧E 打开 Explorer，用方向键浏览；或者在 Search 视图（⌘⇧F）里用 **files to include** glob 限定目录。

## 复盘问题

5 QUESTIONS

1. 说出 VSCode 五大界面区域的名字与它们各自的核心职责。
2. 命令面板的四个前缀 `>` / `@` / `#` / `:` 分别对应什么搜索模式？空前缀又是什么？
3. ⌘P 和 ⌘⇧P 的本质区别是什么？只记一个的话该记哪个？
4. 如何在不点鼠标的情况下，把当前文件复制到右侧分屏，再切回左边？
5. "Reveal in Finder" 这个命令你绑了什么快捷键？为什么是它？

## 今日检查清单

8 ITEMS

- 能说出 Activity Bar / Side Bar / Editor Group / Panel / Status Bar 的中文与英文名
- 知道 ⌘B 切 Side Bar、⌘J 切 Panel、⌃` 直接开终端
- 能用 ⌘⇧E/F/G/D/X 切到五大视图
- 记熟命令面板的 4 个前缀（`> @ # :`）+ 空前缀（文件搜索）
- 完成 Lab 1：5 分钟无鼠标完成 8 个动作
- 完成 Lab 2：调整了至少一项布局（Side Bar 位置 / Panel 位置 / Centered Layout）
- 完成 Lab 3：给 "Reveal in Finder/File Explorer" 绑了快捷键
- 能在不查文档的情况下答出复盘 5 问

## 推荐阅读

3 ITEMS

OFFICIAL

### User Interface

官方界面文档。今天讲的五大件名字与所有可调位置都来自这里。建议作为词汇表收藏。

OFFICIAL

### Quick Open · Command Palette

命令面板的官方权威说明。包括所有前缀、扩展可注册命令的机制等。

CHEATSHEET

### Keyboard Shortcuts Reference (PDF)

官方 macOS / Windows / Linux 三套 PDF。打印贴在显示器旁，21 天后大半你都背得出来。

## Day 03 预告

NEXT

COMING NEXT

### 设置三层与 Settings Sync — User · Workspace · Folder 的优先级

明天会讲 VSCode 配置的「三层架构」：User 全局设置、Workspace 工作区设置、Folder 文件夹设置——以及它们如何按优先级覆盖。会教你直接编辑 `settings.json` 而不是用 UI、把项目特化的设置放进 `.vscode/settings.json` commit 给团队、以及怎么用 `@modified` 过滤器审视自己改过的所有设置。

"老司机和新手最大的区别 —— 不是会的命令多，而是从来不用鼠标点菜单。"

DAY 02 · VSCODE 21-DAY ROADMAP
