---
title: "什么是 Telescope：Nvim 里的模糊查找中枢"
date: '2026-06-13'
draft: false
description: "一篇面向 Nvim + Go 学习者的 Telescope 入门说明：理解 picker、finder、sorter、previewer，配置文件搜索、全文搜索、buffer、LSP 引用和当前文件函数列表。"
toc: true
tags:
  - Neovim
  - Telescope
  - Search
  - LSP
  - Go
---

NEOVIM · TELESCOPE · GUIDE

# 什么是Telescope

Telescope 是 Nvim 里的“模糊查找中枢”。它不是文件树，也不是语言服务器；它负责把文件、文本、buffer、Git、LSP 符号、引用列表这些东西收集起来， 放进一个可搜索、可预览、可跳转的弹窗里。

**TYPE** Nvim plugin guide **TIME** 25 - 40 min **OUTPUT** Telescope mental model + config **FOR** Nvim + Go workflow

[返回 Nvim + Go 30 天总路线](/posts/infra/nvim-go-roadmap/)·[关联：Day07 代码导航与项目搜索](/posts/infra/nvim-go-day07/)

## 一句话理解

MENTAL MODEL

WHAT

### 它解决什么问题

当你脑子里只有一点线索，比如文件名、函数名、错误文案、某个引用，Telescope 负责把候选项拉出来，让你边输入边过滤，最后跳到准确位置。

NOT

### 它不是什么

它不是文件目录树，不负责长期展示项目结构；它也不是 gopls，不负责理解 Go 语义。它更像一个统一入口，把不同来源的列表变得好找。

你可以把 Telescope 想成 Nvim 里的搜索面板：文件搜索、全文搜索、函数列表、引用列表，都用同一种交互方式处理。

## 1. Telescope 的四个部件

CORE

Telescope 官方把它设计成可扩展的 picker 系统。日常使用不需要写扩展，但理解这四个词会让配置清楚很多。

| 部件 | 它做什么 | 例子 |
| --- | --- | --- |
| picker | 一次完整的查找界面。 | `find_files`、`live_grep`、`lsp_references`。 |
| finder | 负责拿到候选列表。 | 从 `fd` 拿文件，从 `rg` 拿文本，从 LSP 拿引用。 |
| sorter | 负责按输入内容排序候选项。 | 你输入 `tsk`，它把最像 `task.go` 的结果排前面。 |
| previewer | 负责右侧或下方预览内容。 | 预览文件内容、grep 命中行、LSP 引用上下文。 |

真正让 Telescope 好用的不是“弹窗”，而是候选列表、模糊排序和预览被统一到了一个操作模型里。

## 2. 安装最小配置

INSTALL

Telescope 依赖 `plenary.nvim`。如果你要高质量文件搜索和全文搜索，还应该安装 `fd` 和 `ripgrep`。

$ brew install ripgrep fd

把插件放进 `lua/plugins/init.lua`：

```
{
  "nvim-telescope/telescope.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  cmd = "Telescope",
  keys = {
    { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find files" },
    { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Live grep" },
    { "<leader>fb", "<cmd>Telescope buffers<cr>", desc = "Find buffers" },
    { "<leader>fh", "<cmd>Telescope help_tags<cr>", desc = "Help tags" },
  },
  opts = {
    defaults = {
      path_display = { "smart" },
      dynamic_preview_title = true,
      layout_strategy = "horizontal",
      layout_config = {
        horizontal = {
          width = 0.95,
          height = 0.85,
          preview_width = 0.6,
        },
      },
    },
  },
}
```

如果你按 `<leader>ff` 没反应，先确认 leader 是什么：`:echo mapleader`。常见配置里 leader 是空格。

## 3. 最常用的入口

PICKERS

初学时别记太多，先把这六个入口练熟。

| 入口 | 用来找什么 | 什么时候按 |
| --- | --- | --- |
| `find_files` | 项目文件。 | 知道文件名一部分时。 |
| `live_grep` | 项目全文内容。 | 记得某段字符串、错误文案、函数调用时。 |
| `buffers` | 已打开文件。 | 在几个文件之间来回切换时。 |
| `oldfiles` | 最近打开过的文件。 | 想回到刚才编辑过但已经关掉的文件。 |
| `lsp_document_symbols` | 当前文件函数、方法、结构体。 | 长 Go 文件里找某个函数。 |
| `lsp_references` | 当前符号的引用。 | 按 `gr` 查哪里调用了这个函数。 |

Telescope 适合“我知道一点线索，想快速跳过去”。如果你要长期观察目录结构，用 Neo-tree；如果要逐条处理一组结果，用 quickfix 或 Trouble。

## 4. 推荐快捷键

KEYMAPS

把这些放进 `lua/config/keymaps.lua`。用 `pcall` 是为了 Telescope 未安装时不让整个 Nvim 配置报错。

```
local ok, builtin = pcall(require, "telescope.builtin")
if ok then
  vim.keymap.set("n", "<leader>ff", builtin.find_files, { desc = "Find files" })
  vim.keymap.set("n", "<leader>fg", builtin.live_grep, { desc = "Live grep" })
  vim.keymap.set("n", "<leader>fb", builtin.buffers, { desc = "Find buffers" })
  vim.keymap.set("n", "<leader>fo", builtin.oldfiles, { desc = "Find old files" })
  vim.keymap.set("n", "<leader>fh", builtin.help_tags, { desc = "Find help" })
end
```

在 LSP attach 之后，再把语义相关入口放到 `lua/lsp/init.lua`：

```
local builtin = require("telescope.builtin")

map("gr", function()
  builtin.lsp_references({
    include_declaration = false,
    include_current_line = true,
    show_line = true,
    trim_text = false,
    jump_type = "never",
  })
end, "References")

map("<leader>sf", function()
  builtin.lsp_document_symbols({
    symbols = { "function", "method", "struct", "interface" },
    show_line = true,
    trim_text = false,
  })
end, "Search symbols in current file")
```

文件搜索和全文搜索不需要 LSP；引用、定义、函数列表依赖 gopls attach。坏掉时要分层排查。

## 5. Go 开发里的实际用法

GO FLOW

在 Go 项目里，Telescope 最大的价值是减少“我先去哪里找”的犹豫。

| 任务 | 入口 | 动作 |
| --- | --- | --- |
| 打开业务文件 | `<leader>ff` | 输入 `task`，选择 `internal/task/task.go`。 |
| 找错误文案 | `<leader>fg` | 搜索 `title is required`，从结果跳到定义。 |
| 找当前文件函数 | `<leader>sf` | 输入函数名片段，跳到目标函数。 |
| 查函数在哪里被调用 | `gr` | 查看引用列表，带预览确认上下文。 |
| 读文档 | `<leader>fh` | 搜索 `lsp`、`quickfix`、`diagnostic`。 |

一个很稳的节奏是：文件名用 `ff`，文本内容用 `fg`，当前文件结构用 `sf`，语义引用用 `gr`。

## 6. Telescope 和其他工具的边界

COMPARE

| 工具 | 更适合 | 不适合 |
| --- | --- | --- |
| Telescope | 临时查找、快速过滤、带预览跳转。 | 长时间展示目录结构，逐条处理大量问题。 |
| Neo-tree | 看目录结构、创建文件、重命名、移动文件。 | 全文搜索和语义引用。 |
| quickfix | 逐条处理一组错误、grep 结果、测试失败。 | 临时模糊查找一个文件。 |
| Trouble | 更好地展示 diagnostics、quickfix、LSP 引用。 | 替代底层数据源。它展示列表，不产生语义。 |

不要把所有事都塞给 Telescope。工具边界清楚，配置才不会越堆越乱。

## 7. 常见问题

DEBUG

| 现象 | 可能原因 | 排查命令 |
| --- | --- | --- |
| `<leader>ff` 没反应 | leader 不是空格，插件没安装，或 keymap 文件没 require。 | `:echo mapleader`，`:map <leader>ff`。 |
| `live_grep` 报错 | 没有安装 `ripgrep`。 | `:echo executable("rg")`。 |
| 找不到被 gitignore 的文件 | Telescope 默认遵循底层工具的忽略规则。 | 先确认终端里 `fd` 或 `rg` 是否能找到。 |
| `gr` 没引用 | gopls 没 attach，或当前符号没有引用。 | `:lua vim.print(vim.lsp.get_clients())`。 |
| 窗口太小 | 默认 layout 不适合当前屏幕。 | 调整 `layout_config.width`、`height` 和 `preview_width`。 |

排查时先分清：文件搜索坏了通常是 Telescope 或 fd；全文搜索坏了通常是 rg；LSP 引用坏了通常是 gopls。

## 参考资料

PRIMARY SOURCES

TELESCOPE

### 官方文档

[telescope.nvim README](https://github.com/nvim-telescope/telescope.nvim) 介绍 picker、finder、sorter、previewer，以及内置 pickers；[plenary.nvim](https://github.com/nvim-lua/plenary.nvim) 是 Telescope 依赖的 Lua 工具库。

TOOLS

### 搜索工具

[ripgrep](https://github.com/BurntSushi/ripgrep) 负责高速全文搜索；[fd](https://github.com/sharkdp/fd) 负责快速列文件，它们是 Telescope 搜索体验的重要底层能力。

[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[关联：Day07 代码导航与项目搜索](/posts/infra/nvim-go-day07/)
