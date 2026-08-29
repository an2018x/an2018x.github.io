---
title: "Day 04 · Nvim + Go Lua 配置结构"
date: '2026-06-10'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 04：把 init.lua 拆成 options、keymaps、plugins、lsp，理解 require、模块加载顺序、package.loaded 与最小可维护配置结构。"
toc: true
tags:
  - Go
  - Neovim
  - Tooling
  - Roadmap
  - Day 04
---

NEOVIM · GO · DAY 04

# Lua 配置结构

第四天把前几天写在一个文件里的配置拆开。目标不是做一个“完美发行版”，而是让每一类设置都有自己的位置： 基础选项、快捷键、插件入口、LSP 入口。以后出问题时，你能沿着加载顺序定位，而不是在一大段 `init.lua` 里来回翻。

**DAY** 04 / 30 **TIME** 55 - 85 min **OUTPUT** split init.lua + lua modules **CHECK** require order + load test

[上一天：文本对象与批量编辑](/posts/infra/nvim-go-day03/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：Go 工具链入门](/posts/infra/nvim-go-day05/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

把 `init.lua` 拆成 `options`、`keymaps`、`plugins`、`lsp` 四个入口；理解 `require` 如何把模块名映射到文件路径。

CHECK

### 完成标准

重启 Nvim 没有报错；`:echo stdpath("config")` 指向你的配置目录；`:lua vim.print(package.loaded["config.options"] ~= nil)` 输出 `true`。

## 1. 备份并建立目录

FILES

先备份 Day01 的单文件配置，再创建模块目录。今天只拆结构，不引入新的插件管理器，避免把“路径问题”和“插件问题”混在一起。

$ cd ~/.config/nvim
$ cp init.lua init.lua.day03.bak
$ mkdir -p lua/config lua/plugins lua/lsp
$ nvim init.lua lua/config/options.lua lua/config/keymaps.lua lua/plugins/init.lua lua/lsp/init.lua

```
~/.config/nvim/
├── init.lua
└── lua/
    ├── config/
    │ ├── options.lua
    │ └── keymaps.lua
    ├── plugins/
    │ └── init.lua
    └── lsp/
        └── init.lua
```

| 路径 | 职责 | 为什么这样放 |
| --- | --- | --- |
| `init.lua` | Neovim 启动时读取的顶层入口。 | 只保留加载顺序，避免所有配置堆在一个文件里，后续排错更直接。 |
| `lua/config/` | 放不依赖插件的基础配置：选项、快捷键、自动命令等。 | 这些配置应该在插件之前加载，保证编辑器基础行为先稳定。 |
| `lua/plugins/` | 放插件管理器入口和插件规格。 | 后面添加主题、补全、Telescope、DAP 时，都从这里扩展。 |
| `lua/lsp/` | 放语言服务器、诊断、格式化、代码动作相关配置。 | Go 的 `gopls` 从 Day06 开始接入，提前留出独立边界。 |

Neovim 会把配置目录下的 `lua/` 放进 Lua 模块搜索路径。也就是说，`require("config.options")` 会去找 `lua/config/options.lua`。

## 2. 让 init.lua 只负责加载顺序

INIT

顶层入口越短，越容易排错。今天的 `init.lua` 只做两件事：设置 leader，然后按顺序加载模块。

```
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

require("config.options")
require("config.keymaps")
require("plugins")
require("lsp")
```

| 配置 | 作用 | 放在这里的原因 |
| --- | --- | --- |
| `vim.g.mapleader = " "` | 把全局 leader 键设为空格。 | leader 是组合快捷键的前缀，必须在注册 keymap 之前设置。 |
| `vim.g.maplocalleader = "\\"` | 设置 buffer 或 filetype 局部快捷键前缀。 | 以后 Go 文件专属动作可以挂在 localleader 下，和全局动作分开。 |
| `require("config.options")` | 加载基础编辑器选项。 | 选项先加载，后续插件或 LSP 才能继承稳定的缩进、搜索、显示行为。 |
| `require("config.keymaps")` | 加载你自己的快捷键。 | 放在 leader 之后，插件之前；基础快捷键不应该依赖插件是否安装成功。 |
| `require("plugins")` | 加载插件入口模块。 | `lua/plugins/init.lua` 可以被简写成 `require("plugins")`。 |
| `require("lsp")` | 加载 LSP 入口模块。 | 今天只是占位；Day06 开始把 `gopls` 和语言能力接进这里。 |

把 leader 放在 keymaps 之前。否则含 `<leader>` 的快捷键可能在旧 leader 值下注册，后续再改就很难看出原因。

## 3. 拆出基础选项

OPTIONS

选项模块只放编辑器行为，不放快捷键，不放插件配置。边界清楚，后面才能长期维护。

```
local opt = vim.opt

opt.number = true
opt.relativenumber = true
opt.expandtab = true
opt.shiftwidth = 2
opt.tabstop = 2
opt.termguicolors = true

opt.ignorecase = true
opt.smartcase = true
opt.incsearch = true
opt.scrolloff = 6
opt.signcolumn = "yes"
```

| 选项 | 含义 | 为什么适合 Go 开发 |
| --- | --- | --- |
| `number` | 显示绝对行号。 | 报错、测试失败、日志定位通常都会给出具体行号。 |
| `relativenumber` | 当前行以外显示相对行号。 | 方便用 `5j`、`3k`、`d4j` 这类带计数的移动和编辑。 |
| `expandtab` | 按 Tab 时插入空格。 | Lua 配置本身用空格缩进更稳定；Go 文件最终由 `gofmt` 统一格式。 |
| `shiftwidth` / `tabstop` | 控制缩进宽度和 Tab 显示宽度。 | 这里设为 2，主要服务 Lua 配置文件；Go 缩进交给 gofmt，不靠手调。 |
| `termguicolors` | 启用真彩色终端支持。 | 后面添加主题和诊断高亮时，颜色层次会更可靠。 |
| `ignorecase` / `smartcase` | 默认搜索忽略大小写；搜索词包含大写时自动区分大小写。 | 搜 `task` 时宽松，搜 `Task` 类型名时精确。 |
| `incsearch` | 输入搜索词时实时跳转预览。 | 减少盲搜，能立刻看出搜索词是否命中正确代码区域。 |
| `scrolloff` | 光标上下保留至少 6 行上下文。 | 读函数和错误处理分支时，不会让光标贴着屏幕边缘。 |
| `signcolumn` | 始终显示左侧 sign 栏。 | 以后 LSP 诊断、断点、Git 标记出现时，正文不会左右跳动。 |

用 `local opt = vim.opt` 不是性能魔法，只是减少重复。读代码时一眼能看出这一块都在设置选项。

## 4. 拆出快捷键

KEYMAPS

快捷键模块只放你已经会用的动作。不要把网上看到的所有映射都搬进来；每个 keymap 都应该能说出使用场景。

```
local keymap = vim.keymap.set

keymap("n", "<leader>w", "<cmd>write<cr>", { desc = "Save file" })
keymap("n", "<leader>h", "<cmd>nohlsearch<cr>", { desc = "Clear search highlight" })
keymap("n", "<leader>e", "<cmd>edit $MYVIMRC<cr>", { desc = "Edit init.lua" })

keymap("n", "j", "gj", { desc = "Move down by visual line" })
keymap("n", "k", "gk", { desc = "Move up by visual line" })
```

| 映射 | 作用 | 设计理由 |
| --- | --- | --- |
| `local keymap = vim.keymap.set` | 给 `vim.keymap.set` 起一个局部别名。 | 让每行映射更短，同时不污染全局变量。 |
| `<leader>w` | 保存当前文件。 | 保存是高频动作，放在 leader 下比反复输入 `:write` 更顺手。 |
| `<leader>h` | 清除搜索高亮。 | Day02 开始大量使用搜索，清高亮需要一个明确出口。 |
| `<leader>e` | 打开当前 Neovim 实际读取的配置入口。 | `$MYVIMRC` 比手写路径可靠，能避免改错配置文件。 |
| `j` / `k` 到 `gj` / `gk` | 按屏幕显示行移动，而不是按文件真实行移动。 | 长注释或 Markdown 段落自动换行时，移动更符合肉眼看到的位置。 |
| `{ desc = "..." }` | 给映射添加说明。 | 描述会出现在后续快捷键提示、帮助输出或自定义查询中，是配置的自文档。 |

`desc` 现在就写上。后面接入 which-key、Telescope 或内置查询时，描述会变成可搜索的配置文档。

## 5. 预留 plugins 与 lsp 入口

PLACEHOLDER

lua/plugins/init.lua

### 插件入口今天先保持可加载

```
-- Plugin manager will be added later.
-- Keep this module loadable today.

local M = {}

M.spec = {}

return M
```

lua/lsp/init.lua

### LSP 入口 Day06 再接 gopls

```
-- gopls wiring starts on Day06.
-- Today this file only proves load order.

local M = {}

function M.status()
  return "lsp placeholder loaded"
end

return M
```

| 写法 | 解释 | 后续会怎么扩展 |
| --- | --- | --- |
| `local M = {}` | 创建模块自己的返回表，常用变量名是 `M`，表示 module。 | 后面可以把插件规格、setup 函数或工具函数挂到这个表上。 |
| `M.spec = {}` | 先给插件列表留一个空表。 | 添加 lazy.nvim 或其它插件管理器后，这里会变成插件声明的集中入口。 |
| `function M.status()` | 给 LSP 模块放一个可调用函数，用于证明模块加载成功。 | Day06 后可以替换成 `M.setup()`，集中配置 gopls 和诊断。 |
| `return M` | 把模块表返回给 `require` 的调用方。 | 这样 `require("lsp").status()` 才能拿到函数并执行。 |
| 注释占位 | 明确这个文件现在为什么“看起来什么都没做”。 | 未来回看时，不会误删这些用于稳定结构的入口。 |

空模块也要能被 `require`。这能让目录结构先稳定下来，真正添加插件或 LSP 时只改对应模块。

## 6. 理解 require 与缓存

LUA

| 概念 | 你需要知道 | 验证命令 |
| --- | --- | --- |
| 模块名 | `config.options` 对应 `lua/config/options.lua`。 | `:lua print(vim.inspect(package.loaded["config.options"]))` |
| 返回值 | 模块可以返回 table；如果没有显式返回，通常只依赖执行时的副作用。 | `:lua vim.print(require("lsp").status())` |
| 缓存 | `require` 成功后会写入 `package.loaded`，再次 require 不会重复执行整个文件。 | `:lua package.loaded["lsp"] = nil` |
| 排错 | 路径拼错时，错误信息会列出 Lua 尝试过的搜索路径。先读第一段，不要急着重写配置。 | `:lua require("config.missing")` |

日常改配置时，最稳的方法仍然是重启 Nvim。理解缓存是为了排错，不是为了把配置热重载写得很复杂。

## 7. 做一次加载顺序实验

DRILL

今天必须亲手制造一个错误，再修好它。你要训练的是读错误信息，而不是祈祷配置永远不报错。

| 实验 | 操作 | 看什么 |
| --- | --- | --- |
| 拼错模块 | 把 `require("config.options")` 临时改成 `require("config.option")`。 | 启动报错里会列出找不到的路径，确认它在找 `option.lua`。 |
| 交换顺序 | 把 `vim.g.mapleader` 移到 keymaps 后面。 | 观察含 leader 的快捷键是否仍符合预期，然后改回正确顺序。 |
| 验证模块 | 在 Nvim 中执行 `:lua vim.print(require("lsp").status())`。 | 输出 `lsp placeholder loaded`，说明 `lua/lsp/init.lua` 被正确加载。 |
| 定位配置目录 | 执行 `:echo stdpath("config")` 和 `:echo $MYVIMRC`。 | 确认当前编辑的是 Neovim 实际启动时读取的配置。 |

## 8. 写 Day04 日志并提交

COMMIT

日志记录目录结构和一个真实报错。以后配置坏掉时，这份日志能提醒你如何从入口文件开始排查。

```
# Day04 Lua config structure log

## Files
- init.lua:
- lua/config/options.lua:
- lua/config/keymaps.lua:
- lua/plugins/init.lua:
- lua/lsp/init.lua:

## Loading order
- Why leader is before keymaps:
- Why plugins and lsp are separate:

## Error I created on purpose
- Broken require:
- Error message clue:
- Fix:
```

$ cd ~/.config/nvim
$ nvim --headless '+lua vim.print(require("lsp").status())' '+qa'
$ git add .
$ git commit -m "day04 split nvim lua config"

EXIT CHECK

### 离开前自测

不用看笔记，说出 `require("config.keymaps")` 会对应哪个文件、为什么 leader 要先设置、以及 `package.loaded` 在排错时能告诉你什么。

## 参考资料

PRIMARY SOURCES

NEOVIM

### Lua 与启动

[Neovim Lua 文档](https://neovim.io/doc/user/lua.html) 解释 `vim` API、`vim.opt` 和 Lua 执行方式；[starting 文档](https://neovim.io/doc/user/starting.html) 说明启动和初始化过程。

CONFIG

### 选项与快捷键

[options 文档](https://neovim.io/doc/user/options.html) 解释编辑器选项；[map 文档](https://neovim.io/doc/user/map.html) 解释 keymap、leader 和映射行为。

[上一天：文本对象与批量编辑](/posts/infra/nvim-go-day03/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：Go 工具链入门](/posts/infra/nvim-go-day05/)
