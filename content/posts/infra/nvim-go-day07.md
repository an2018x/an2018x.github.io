---
title: "Day 07 · Nvim + Go 代码导航与项目搜索"
date: '2026-06-13'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 07：配置 fuzzy finder，练习文件、buffer、symbol、grep 搜索，并用 :lua vim.lsp.buf.definition() 理解 LSP 请求。"
toc: true
tags:
  - Go
  - Neovim
  - LSP
  - Search
  - Roadmap
  - Day 07
---

NEOVIM · GO · DAY 07

# 代码导航与项目搜索

第七天把“找代码”变成系统能力。你会同时练三条路线：文件和 buffer 搜索负责在项目里移动， grep 负责按文本定位，LSP symbol 负责按语言结构定位。最后用 `:lua vim.lsp.buf.definition()` 看清一次跳转定义到底是怎么发起的。

**DAY** 07 / 30 **TIME** 65 - 95 min **OUTPUT** Telescope + navigation keymaps **CHECK** files + buffers + grep + symbols

[上一天：接入 gopls](/posts/infra/nvim-go-day06/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：补全与片段](/posts/infra/nvim-go-day08/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

配置 fuzzy finder；练习文件、buffer、symbol、grep 搜索；用 `:lua vim.lsp.buf.definition()` 理解 LSP 请求，而不是只背 `gd`。

CHECK

### 完成标准

在 `tasknote` 项目里，能用 `<leader>ff` 找文件、`<leader>fb` 切 buffer、`<leader>fg` 搜文本、`<leader>fs` 查 LSP symbol。

## 1. 确认搜索工具

TOOLS

Telescope 可以用纯 Lua 做界面，但快速搜索依赖底层命令。今天先确认 `ripgrep` 和 `fd` 可用。

$ rg --version
$ fd --version
$ cd ~/code/lab/tasknote
$ rg "NewTask"
$ fd ".go$"

| 工具 | 用途 | 缺失时 |
| --- | --- | --- |
| `rg` | 按内容搜索，Telescope 的 live grep 常用它。 | macOS 用 `brew install ripgrep`。 |
| `fd` | 快速列文件，比传统 `find` 更适合交互搜索。 | macOS 用 `brew install fd`。 |
| `gopls` | 提供定义、引用、文档符号、工作区符号。 | 回到 Day06，先让 LSP attach 成功。 |

先让终端命令跑通，再接进 Nvim。插件只是界面，真正搜索的是底层工具和 LSP。

## 2. 加入 Telescope 插件

PLUGIN

如果你已经有插件管理器，按自己的结构加入即可。下面用 Day04 预留的 `lua/plugins/init.lua` 演示 lazy.nvim 的最小写法。

```
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  {
    "nvim-telescope/telescope.nvim",
    branch = "0.1.x",
    dependencies = { "nvim-lua/plenary.nvim" },
  },
})
```

这一步会从 GitHub 下载插件。网络失败时不要改业务配置，先确认代理、DNS 或 GitHub 访问。

## 3. 配置搜索快捷键

KEYMAPS

把 Telescope keymap 放进 `lua/config/keymaps.lua`。如果 require 失败，说明插件还没装好或没加载。

```
local keymap = vim.keymap.set

local ok, builtin = pcall(require, "telescope.builtin")
if ok then
  keymap("n", "<leader>ff", builtin.find_files, { desc = "Find files" })
  keymap("n", "<leader>fb", builtin.buffers, { desc = "Find buffers" })
  keymap("n", "<leader>fg", builtin.live_grep, { desc = "Live grep" })
  keymap("n", "<leader>fh", builtin.help_tags, { desc = "Help tags" })
  keymap("n", "<leader>fs", builtin.lsp_document_symbols, { desc = "Document symbols" })
  keymap("n", "<leader>fS", builtin.lsp_workspace_symbols, { desc = "Workspace symbols" })
end
```

| 快捷键 | 查找对象 | 典型场景 |
| --- | --- | --- |
| `<leader>ff` | 项目文件。 | 知道文件名大概叫什么，快速打开 `task_test.go`。 |
| `<leader>fb` | 已打开 buffer。 | 在 `main.go`、`task.go`、测试文件之间切换。 |
| `<leader>fg` | 全文内容。 | 搜 `title is required`、`FormatTask`、错误文案。 |
| `<leader>fs` | 当前文件符号。 | 按函数、类型、方法跳转，不依赖文件行号。 |
| `<leader>fS` | 工作区符号。 | 跨文件查 `Task`、`NewTask` 等语言结构。 |

`pcall` 可以避免 Telescope 未安装时整个配置崩掉。它不是最终架构，只是学习期的安全垫。

## 4. 做 25 分钟导航训练

DRILL

回到 `tasknote` 项目。今天不要用文件树，用搜索入口移动。

$ cd ~/code/lab/tasknote
$ nvim .

| 任务 | 入口 | 验收方式 |
| --- | --- | --- |
| 打开测试文件 | `<leader>ff` | 输入 `test`，打开 `task_test.go`。 |
| 回到业务函数 | `<leader>fs` | 选择 `NewTask` 或 `FormatTask`。 |
| 查找错误文案 | `<leader>fg` | 搜索 `title is required`，从结果跳到定义。 |
| 切换已打开文件 | `<leader>fb` | 在三个 Go 文件和日志之间来回切换。 |
| 跨项目找符号 | `<leader>fS` | 搜索 `Task`，确认结果来自 gopls。 |

## 5. 拆开一次 LSP definition 请求

LSP REQUEST

`gd` 只是快捷键。真正做事的是 `vim.lsp.buf.definition()`：它读取当前光标位置，向已 attach 的 LSP 客户端发起 definition 请求。

:lua vim.lsp.buf.definition()
:lua vim.print(vim.lsp.get\_clients())
:lua vim.print(vim.lsp.get\_clients()[1].server\_capabilities.definitionProvider)

| 问题 | 检查命令 | 你要看什么 |
| --- | --- | --- |
| 有没有客户端 | `vim.lsp.get_clients()` | 列表里是否有 `gopls`。 |
| 客户端支持定义跳转吗 | `server_capabilities.definitionProvider` | 是否为 `true`。 |
| 当前文件根目录对吗 | `vim.lsp.get_clients()[1].config.root_dir` | 是否指向 `tasknote` module 根目录。 |
| 快捷键做了什么 | `:verbose nmap gd` | 确认 `gd` 映射到了 LSP definition。 |

理解这层后，插件坏了也不慌。你可以直接调用 `vim.lsp.buf.*` 系列函数来判断是 UI 问题还是 LSP 问题。

## 6. 把搜索结果放进 quickfix

QUICKFIX

Telescope 适合交互挑选，quickfix 适合处理一组结果。今天先用原生命令体验这个区别。

:grep NewTask \*\*/\*.go
:copen
:cnext
:cprev
:cclose

| 列表 | 适合什么 | 今天怎么用 |
| --- | --- | --- |
| Telescope picker | 从很多候选里挑一个。 | 找文件、找 symbol、临时 grep。 |
| Quickfix | 按顺序处理一批位置。 | grep 后逐个看引用，或后面处理编译错误。 |
| LSP references | 按语言语义找引用。 | 比纯文本 grep 更懂作用域和符号。 |

Day10 会把 diagnostics、grep 和 test 失败都放进列表习惯里。今天先知道 quickfix 是什么。

## 7. 写 Day07 日志并提交

COMMIT

记录你最常用的四个搜索入口，以及一次从“搜索到修改到验证”的完整路径。

```
# Day07 navigation and search log

## Finder keys
- files:
- buffers:
- grep:
- document symbols:
- workspace symbols:

## LSP request
- command tested:
- client:
- root_dir:
- capability:

## One edit loop
- how I found the code:
- what I changed:
- how I verified:
```

$ cd ~/.config/nvim
$ git add lua/config/keymaps.lua lua/plugins/init.lua
$ git commit -m "day07 add telescope navigation"
$ cd ~/code/lab/tasknote
$ go test ./...

EXIT CHECK

### 离开前自测

任选一个目标：文件名、已打开文件、普通文本、当前文件函数、跨项目符号。你应该能立刻说出该用哪个入口，而不是每次都只用全文搜索。

## 参考资料

PRIMARY SOURCES

TELESCOPE

### Fuzzy Finder

[telescope.nvim](https://github.com/nvim-telescope/telescope.nvim) 提供文件、buffer、grep、LSP symbol 等 picker；[plenary.nvim](https://github.com/nvim-lua/plenary.nvim) 是 Telescope 依赖的 Lua 工具库。

NEOVIM

### LSP 与 Quickfix

[Neovim LSP 文档](https://neovim.io/doc/user/lsp.html) 解释 `vim.lsp.buf.definition()`；[quickfix 文档](https://neovim.io/doc/user/quickfix.html) 解释 quickfix 列表和跳转命令。

[上一天：接入 gopls](/posts/infra/nvim-go-day06/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：补全与片段](/posts/infra/nvim-go-day08/)
