---
title: "Day 03 · 设置三层与 settings.json 实战"
date: '2026-05-24'
draft: false
description: "VSCode 配置的三层架构 —— User / Workspace / Folder 的优先级与覆盖规则；为什么直接写 JSON 比点 UI 更高效；如何用 .vscode/settings.json 和 extensions.json 给团队建立统一规范；@modified / @lang / @feature 过滤器的实战用法。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 03
---

DAY 03 · VSCODE ROADMAP · 21 DAYS

# 设置 _三层架构_ 与 settings.json

很多人改 VSCode 设置的方式是「打开 UI → 翻几页 → 点开关 → 关掉」。 高级玩家从来不这样——他们直接写 `settings.json`， 把_项目特化_的设置放进 `.vscode/settings.json` 给团队， 用 `@modified` 一眼看穿自己改过哪些。 今天讲清三层架构、JSON 派的胜利、团队共享的最佳实践。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **KEY FILES** settings.json · extensions.json

## 思维导图

OVERVIEW

> **图：Day 03 思维导图**
>
> - DAY 03 · 设置三层 + settings.json
> - LAYERS · JSON · TEAM · FILTER
> - 01 · LAYERS
> - 三层优先级
> - 02 · JSON
> - JSON 派胜利
> - 03 · TEAM
> - .vscode 共享
> - 04 · FILTER
> - @ 过滤器
> - Default 默认
> - User 用户级
> - Workspace 工作区
> - Folder 文件夹
> - UI 找不全
> - JSON 完全可控
> - IntelliSense 加持
> - 易 git diff / commit
> - .vscode/settings.json
> - .vscode/extensions.json
> - .editorconfig 配合
> - commit vs gitignore
> - @modified 看改过
> - @id: 精确定位
> - @lang: 按语言
> - @feature: 按功能
> - DELIVERABLES
> - 三层优先级清晰
> - 直接编辑 JSON
> - .vscode 团队模板
> - 个人 dotfile 雏形

FIG · Day 03 全景：理解三层 → 拥抱 JSON → 给团队建规范 → 用过滤器查漏

## 设置的三层架构

15 MIN

VSCode 的每一项设置都来自_四个来源_之一： 默认值（Default）、用户级（User）、工作区（Workspace）、文件夹（Folder）。 它们从下到上覆盖—— **越靠近你正在编辑的文件，优先级越高** 。 理解这条规则，你就再也不会问「为什么我改了设置没生效」。

> **图：VSCode 设置四层架构与优先级**
>
> - SETTINGS PRIORITY · LOW ↑ HIGH
> - LAYER 4 · FOLDER
> - 文件夹设置
> - multi-root workspace 内的单个 folder
> - LAYER 3 · WORKSPACE
> - 工作区设置
> - .vscode/settings.json · 团队共享
> - LAYER 2 · USER
> - 用户级设置
> - ~/Library/.../User/settings.json · 个人偏好
> - LAYER 1 · DEFAULT
> - 默认值（出厂）
> - VSCode 自带 · 不可改 · 只能读
> - OVERRIDES
> - EFFECTIVE VALUE =
> - topmost layer 中存在该键的值
> - EXAMPLE:
> - User 设 fontSize=14 → Workspace 设 fontSize=16 → 当前文件用 16

FIG · 设置四层架构：上层覆盖下层，越靠近文件优先级越高

### 配置文件实际位置

| 层级 | 文件位置（macOS / Linux / Windows） | 谁来管 |
| --- | --- | --- |
| Default | VSCode 安装目录内部，只读 | VSCode / 扩展作者 |
| User | `~/Library/Application Support/Code/User/settings.json`
`~/.config/Code/User/settings.json`
`%APPDATA%\Code\User\settings.json` | 你自己 · 通过 Sync 跨设备 |
| Workspace | `<项目根>/.vscode/settings.json` | 团队 · git commit 共享 |
| Folder | `<multi-root 中某 folder>/.vscode/settings.json` | 仅 multi-root workspace 才有 |

Insiders 把 `Code` 路径替换成 `Code - Insiders`，两者完全独立

### 真实场景：一个 fontSize 的旅行

```
# Layer 1 · Default
"editor.fontSize": 12 # VSCode 出厂默认

# Layer 2 · User （你的全局偏好）
# ~/Library/.../User/settings.json
"editor.fontSize": 14 # 你眼睛舒服的字号 → 覆盖 Default

# Layer 3 · Workspace （这个项目要求）
# projectA/.vscode/settings.json
"editor.fontSize": 16 # 团队 README 演示用大字号 → 覆盖 User

# Layer 4 · Folder （multi-root 内的子 folder）
# projectA/legacy-module/.vscode/settings.json
"editor.fontSize": 13 # 旧模块代码密 → 覆盖 Workspace

# 最终生效值：13（最上层）
```

CONVENTION 01

### 个人偏好放 User

字号、主题、字体、行号样式——只跟你的眼睛/手指有关，跨项目恒定。

CONVENTION 02

### 项目规范放 Workspace

缩进 2 还是 4、用 Prettier 还是 Biome、tabs 还是 spaces——影响 git diff 的设置全放这里。

CONVENTION 03

### Folder 谨慎使用

只在 multi-root workspace 才用。绝大多数项目用不到——避免"层级越多越混乱"。

## JSON 派的胜利：抛弃 UI 设置

10 MIN

Settings UI 是给新手的「引导轮」，等你能直接读 JSON 就该把它扔掉。 理由很硬：_所有真相都在 JSON 里_， UI 只是 JSON 的一种渲染。

### UI 与 JSON 的对比

| 维度 | Settings UI | settings.json（JSON） |
| --- | --- | --- |
| 覆盖率 | 不完整 — 部分扩展设置只能 JSON 改 | 100% — 所有设置项 |
| 编辑效率 | 找一项要翻 3 层菜单 | ⌘F 搜键名秒到 |
| 批量修改 | 逐个点 | 复制粘贴一段就行 |
| 版本控制 | 无法 git diff | 可 commit、可 review |
| IntelliSense | 有描述但难索引 | 键名 / 枚举值 / 描述全提示 |
| 跨机器复制 | 逐条对照 | 整文件 scp 过去 |
| 查找已改过的 | 看每项灰色"已修改"标记 | JSON 里就是你写过的全部 |

### 打开 JSON 的三种方式

```
# 方式 A · 命令面板（推荐）
⌘⇧P → Preferences: Open User Settings (JSON)
⌘⇧P → Preferences: Open Workspace Settings (JSON)
⌘⇧P → Preferences: Open Folder Settings (JSON) # multi-root 才有
⌘⇧P → Preferences: Open Default Settings (JSON) # 只读 · 看默认值

# 方式 B · 从 UI 切到 JSON
# Settings UI 右上角有个「{ }」图标 → 直接跳到对应 JSON

# 方式 C · 直接打开文件
$ code ~/Library/Application\ Support/Code/User/settings.json
```

### JSON 编辑时的 IntelliSense

在 `settings.json` 里按 ⌘空格 触发补全，VSCode 会列出所有可用设置项 —— 包括 **每一个扩展贡献的设置** 。 光标停在键名上还会浮出文档说明。这是 UI 永远做不到的「全局可索引」。

```
// settings.json — 输入时享受 IntelliSense
{
  "editor.fo| // ← 在此 ⌘空格，下拉列出：
  // editor.fontFamily
  // editor.fontLigatures
  // editor.fontSize
  // editor.fontVariations
  // editor.fontWeight
  // editor.formatOnPaste
  // editor.formatOnSave
  // editor.formatOnType
  // ...
}
```

每个键名都有 hover tooltip 给出官方描述 — 不用查文档，把鼠标放上去就行

## 团队共享：`.vscode/` 目录

15 MIN

`.vscode/` 目录是项目级配置的_官方约定_位置。 把它 commit 进 git，新人 clone 仓库时就自动继承团队规范—— 不用再写"请把 tab 改成 2 个空格"的 README。

### `.vscode/` 目录三件套

FILE 01

### settings.json

项目特化的 VSCode 设置 — 缩进、格式化工具、行尾规范、文件排除等。今天的主角。

FILE 02

### extensions.json

推荐扩展清单 — 新人 clone 后 VSCode 会弹窗提示"是否安装这些扩展"。降低新人门槛。

FILE 03

### launch.json · tasks.json

调试配置 / 自定义任务 — 后续 Day 10 / Day 14 详讲，今天先知道它们也住这里。

### 团队 `.vscode/settings.json` 模板

```
// .vscode/settings.json — 通用前后端项目
{
  // === 缩进与格式 ===
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,

  // === 格式化 ===
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.tabSize": 4
  },
  "[go]": {
    "editor.defaultFormatter": "golang.go",
    "editor.insertSpaces": false // Go 用 tabs
  },

  // === 隐藏噪声 ===
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/ __pycache__": true,
    "**/dist": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "pnpm-lock.yaml": true
  },

  // === TypeScript 项目特化 ===
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "non-relative",

  // === ESLint / Prettier 自动修复 ===
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  }
}
```

### `.vscode/extensions.json` 推荐扩展

```
// .vscode/extensions.json
{
  // 新人 clone 后会被提示"是否安装这些扩展"
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "editorconfig.editorconfig",
    "streetsidesoftware.code-spell-checker",
    "eamodio.gitlens"
  ],

  // 不推荐的扩展（可选）— 装了会弹警告
  "unwantedRecommendations": [
    "hookyqr.beautify", // 与 Prettier 冲突
    "ms-vscode.vscode-typescript-tslint-plugin" // TSLint 已废弃
  ]
}
```

### 什么该 commit、什么该 ignore

| 文件 | 建议 | 原因 |
| --- | --- | --- |
| .vscode/settings.json | ✓ commit | 团队代码规范 — 缩进/格式化/排除等 |
| .vscode/extensions.json | ✓ commit | 降低新人门槛 — 自动推荐必备插件 |
| .vscode/launch.json | ✓ commit | 调试配置共享 — 团队成员一键跑同样的调试 |
| .vscode/tasks.json | ✓ commit | 构建任务共享 — 同上 |
| .vscode/\*.code-snippets | 视项目 commit | 项目专用 snippet 共享，个人用的放 User |
| .editorconfig | ✓ commit（项目根，不在 .vscode/） | 跨编辑器统一缩进 — Vim/JetBrains/Sublime 同时受益 |

**绝对不要 .gitignore 整个 .vscode/** — 那是把团队规范掩埋的反模式。最多 ignore 个别敏感文件如 `.vscode/secrets.json`

### 配合 `.editorconfig`

团队成员用不同编辑器（Vim / JetBrains / Cursor）时，`.vscode/settings.json` 只覆盖 VSCode。 用 `.editorconfig` 做更基础的规范——它被几乎所有主流编辑器原生或插件支持。

```
# 项目根 .editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{py,go}]
indent_size = 4

[Makefile]
indent_style = tab
```

## Settings UI 过滤器与必备调优

15 MIN

就算坚定走 JSON 派，Settings UI 顶部那个搜索框也值得花 5 分钟学—— 它支持_@ 前缀过滤器_，是查阅默认值、审视改过哪些、按语言/功能筛选的利器。

### 六个常用过滤器

@modified

看你改过的所有设置

最有用的一个。一键列出你偏离默认值的所有项，方便 review 自己的 dotfile。

@id:\<key\>

精确定位某项

如 `@id:editor.fontSize`。比模糊搜索更快定位到唯一项。

@lang:\<id\>

按语言筛选

如 `@lang:python`。给 Python / Go / TS 单独调设置时必用。

@feature:\<area\>

按功能领域筛选

如 `@feature:debug`。按调试、终端、Git 等功能视角浏览。

@ext:\<publisher.id\>

某扩展贡献的设置

如 `@ext:esbenp.prettier-vscode`。集中调一个扩展的所有配置。

@tag:\<tag\>

按标签筛选

`@tag:experimental` · `@tag:preview` 看实验性设置。

### 用户级 settings.json 必备调优 — 我的 10 项

```
// ~/Library/.../User/settings.json — 装好就调，受益 21 天
{
  // 1. 字号 + 行高
  "editor.fontSize": 14,
  "editor.lineHeight": 1.6,

  // 2. 字体连字（→ ≠ <= 等组合字符）
  "editor.fontFamily": "JetBrains Mono, Menlo, monospace",
  "editor.fontLigatures": true,

  // 3. 关掉烦人的小地图
  "editor.minimap.enabled": false,

  // 4. Tab 在最近编辑顺序而不是位置顺序中切换
  "workbench.editor.enablePreview": false, // 单击打开就 pin，不再被覆盖

  // 5. 自动保存（防丢工作）
  "files.autoSave": "onFocusChange",

  // 6. 终端字体跟编辑器一致 + 滚动行数加大
  "terminal.integrated.fontFamily": "JetBrains Mono",
  "terminal.integrated.scrollback": 10000,

  // 7. 平滑光标移动（视觉舒适）
  "editor.cursorBlinking": "smooth",
  "editor.cursorSmoothCaretAnimation": "on",

  // 8. 文件树缩进加大 + 启用嵌套
  "workbench.tree.indent": 16,
  "explorer.fileNesting.enabled": true,

  // 9. 不要每次问"是否信任此工作区"
  "security.workspace.trust.untrustedFiles": "open",

  // 10. Git 自动 fetch + 显示 inline blame
  "git.autofetch": true,
  "git.confirmSync": false
}
```

这 10 项是大多数老司机的"最小公分母"，建议先抄一份，21 天里逐项理解 → 调整 → 删除

## 动手练习

25 MIN · 3 LABS

今天的三个 Lab 把今天的所有内容串起来—— _验证优先级_、_建立团队模板_、_审视个人 dotfile_。

### Lab 1 — 三层覆盖实验

用 fontSize 这个肉眼可见的设置，验证 User → Workspace 的覆盖关系。

```
# 1. 准备工作区
$ cd ~/vscode-day01 && code .

# 2. 在 User settings.json 设置一个明显字号
⌘⇧P → Preferences: Open User Settings (JSON)
# 添加：
  "editor.fontSize": 14

# 3. 切到 Workspace 层覆盖
⌘⇧P → Preferences: Open Workspace Settings (JSON)
# 该命令会自动创建 .vscode/settings.json，添加：
  "editor.fontSize": 22

# 4. 观察：编辑器字号立刻变成 22

# 5. 验证 UI 显示
⌘⇧P → Preferences: Open Settings (UI)
# 搜 fontSize 看到右边显示「Modified in: Workspace」

# 6. 删掉 .vscode/settings.json 的 fontSize
# 编辑器立刻回到 14（User 层）
```

**预期观察：** 看到一项设置时，UI 会标注它的覆盖来源（User / Workspace / Default Override / 等）——这是排查"为什么改了不生效"的关键信号。

### Lab 2 — 给项目建一份 `.vscode/` 模板

把上面 §03 的模板真正落地到一个测试项目里。

```
# 1. 创建测试项目
$ mkdir ~/vscode-day03-team && cd ~/vscode-day03-team
$ git init
$ mkdir .vscode

# 2. 创建 settings.json（拷上面模板的简化版）
$ cat > .vscode/settings.json <<'EOF'
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
EOF

# 3. 创建 extensions.json 推荐扩展
$ cat > .vscode/extensions.json <<'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig",
    "streetsidesoftware.code-spell-checker"
  ]
}
EOF

# 4. 创建 .editorconfig 兜底
$ cat > .editorconfig <<'EOF'
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
EOF

# 5. commit 后用 code . 打开
$ git add . && git commit -m "chore: add VSCode workspace config"
$ code .
```

**预期观察：** VSCode 右下角应该弹一个 toast「This workspace has extension recommendations」——这就是 extensions.json 在工作。

### Lab 3 — 审视你的 User settings

用 `@modified` 过滤器看看你自己改过多少项，理清「真正在用」和「忘了为什么改」。

1. ⌘⇧P → `Preferences: Open Settings (UI)`
2. 在顶部搜索框输入 `@modified`
3. 列表里会显示所有你偏离默认值的设置项
4. 对每一项问自己： **"我为什么改了它？"**
  - 能说出原因 → 保留
  - 不记得 → 改回默认值（点右侧齿轮 → Reset Setting）

5. 切到 JSON 视图（⌘⇧P → `Open User Settings (JSON)`）
6. 把剩下的项 **按主题分组 + 加注释** （参考 §04 的"必备调优 10 项"格式）

这是建立"个人 dotfile"的第一步 — 一个能写出原因的设置文件，下次重装时不会陌生

REFLECTION

### 三个 Lab 串起的认知

层级架构（懂规则）→ 团队模板（共享规则）→ 个人审视（拥有规则）。从此以后改设置，你都会问：「该写在哪一层？」

CHALLENGE

### 附加挑战

把整理好的 User `settings.json` 放进 git 仓库（如 `~/.dotfiles/vscode/`），用软链接连回 VSCode 配置目录。这是真正的"dotfile 工作流"，Day 21 复盘时会回到这里。

## 常见疑问

5 QUESTIONS

### Q1 · 我改了 settings.json 但设置没生效，是什么原因？

ANS

按这个顺序排查：(1) **JSON 语法错** ——多写了个逗号、缺少引号。VSCode 编辑 JSON 时左下角会显示 ⚠️，先把它修了。(2) **被上层覆盖了** ——Settings UI 搜该键，看右边是否标注 "Modified in: Workspace"。如果是，意味着 `.vscode/settings.json` 里有同样的键覆盖了你。(3) **键名写错** ——某些扩展的设置改名了，旧名失效。用 IntelliSense（⌘空格）确认键名存在。(4) **需要 Reload Window** ——少数设置需要重载窗口，命令面板搜 `Reload Window`。

### Q2 · UI 上看到设置被覆盖怎么显示？我怎么知道生效的是哪一层？

ANS

Settings UI 里每个设置项右侧会显示 **来源标签** ：`Modified in: User` / `Modified in: Workspace` / `Default` / `Default Override (extension)` 等。鼠标悬浮蓝色的"Modified in"链接，可以直接跳到对应的 JSON 文件那一行。 **另一招** ：命令面板搜 `Preferences: Configure Language Specific Settings`，能更精细地看每种语言下的最终生效值。

### Q3 · 团队成员用 Cursor / NeoVim，`.vscode/settings.json` 还有意义吗？

ANS

分两层考虑：(1) **Cursor 完全兼容** —— Cursor 基于 VSCode fork，会读取同一个 `.vscode/settings.json`。所以 VSCode 用户和 Cursor 用户共享一份配置毫无问题。(2) **NeoVim / JetBrains 不读这个文件** ——但他们都支持 `.editorconfig`。 **最佳实践** ：把 **编辑器无关的规范** （缩进、行尾、字符集）写进 `.editorconfig`；把 **VSCode 特化** 的设置（如 `editor.formatOnSave`、`files.exclude`）写进 `.vscode/settings.json`。两者互补不冲突。

### Q4 · 公司项目里 .vscode/ 应该全 commit 还是 gitignore？

ANS

团队项目 **必须 commit** ——理由：(1) 新人 clone 后立即拿到统一规范；(2) Code review 时设置变更可见；(3) 不会出现"我本地能跑你本地不能跑"。 **例外** ：`.vscode/secrets.json` 等可能含密钥的文件单独 ignore；个人偏好（如字体、字号）不要写进 Workspace 层，而是放 User 层。 **反面教材** ：很多公司 `.gitignore` 直接写 `.vscode/`——结果新人各自摸索，团队规范靠口口相传，最后代码风格四分五裂。

### Q5 · 怎么查某个设置的默认值是什么？

ANS

三个方法：(1) **命令面板** → `Preferences: Open Default Settings (JSON)`——这是 VSCode 全部内置设置的只读 JSON 文档，左侧带描述、右侧带默认值，是最权威的「设置百科」。(2) **Settings UI** ——搜任意设置，没改过的项默认就显示默认值。(3) **右键齿轮 → Reset Setting** ——任意时候把一项重置回默认值。 **提示** ：Default Settings 文件超长（数千项），用 ⌘F 搜键名最快；不知道键名就先在 UI 找到，再点 `{ }` 跳 JSON。

## 复盘问题

5 QUESTIONS

1. VSCode 设置的四层架构是什么？它们的优先级从低到高是什么顺序？
2. User 层和 Workspace 层在物理文件位置上分别是什么？
3. 为什么直接编辑 settings.json 比用 Settings UI 更高效？至少举出 3 个理由。
4. `.vscode/settings.json` 和 `.editorconfig` 的分工是什么？为什么需要两份？
5. `@modified` / `@lang:python` / `@ext:esbenp.prettier-vscode` 三个过滤器分别在什么场景用？

## 今日检查清单

8 ITEMS

- 能在白板上画出 Default → User → Workspace → Folder 四层架构
- 知道自己 User `settings.json` 的物理路径
- 能熟练用 ⌘⇧P → `Open User Settings (JSON)` 直接进 JSON
- 会用 `@modified` 过滤器看自己改过哪些设置
- 完成 Lab 1:验证了 Workspace 覆盖 User 的现象
- 完成 Lab 2:给一个测试项目建立了 `.vscode/settings.json` + `extensions.json` + `.editorconfig`
- 完成 Lab 3:整理了 User `settings.json`,按主题分组并加了注释
- 能回答 Q/A 5 个常见疑问

## 推荐阅读

3 ITEMS

OFFICIAL

### User and Workspace Settings

VSCode 官方对设置系统的完整说明。四层架构、JSON 与 UI 对照、过滤器用法都来自这里。

OFFICIAL

### Default Settings JSON

命令面板 `Open Default Settings (JSON)` 打开的那个文件——VSCode 全部内置设置的索引,堪称「设置百科」。

SPEC

### EditorConfig.org

`.editorconfig` 规范官方网站。支持的编辑器列表 + 属性全集 + 实例。建议给每个新项目都加一份。

## Day 04 预告

NEXT

COMING NEXT

### 基础导航与选择 — 用键盘在文件里飞

明天进入 **编辑器内功** 阶段第一天。会拆解 VSCode 最核心的导航三件套（⌘P 文件 / ⌘T 符号 / ⌃G 行号）、行操作四件套（删行/复制行/上下移动/合并）、以及光标快速移动（按词/按括号/按符号定义）。这些是后续多光标、重构、调试的基础——值得花一天死练。

"配置是工具的灵魂 —— 一份能让你说出每行原因的 settings.json，才是真正属于自己的编辑器。"

DAY 03 · VSCODE 21-DAY ROADMAP
