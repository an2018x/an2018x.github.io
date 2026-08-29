---
title: "Day 10 · Nvim + Go 诊断与 Quickfix"
date: '2026-06-13'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 10：学习 diagnostics 浮窗、跳转、quickfix 与 location list，把编译错误、LSP 诊断和 grep 结果放进同一个处理习惯里。"
toc: true
tags:
  - Go
  - Neovim
  - Diagnostics
  - Quickfix
  - LSP
  - Roadmap
  - Day 10
---

NEOVIM · GO · DAY 10

# 诊断与问题列表

第十天把“看到报错”变成“系统处理报错”。你会把 gopls 诊断、quickfix、location list、grep 结果和可选的 trouble.nvim 放进同一套动作里： 先收集，再跳转，再修复，最后验证。

**DAY** 10 / 30 **TIME** 70 - 100 min **OUTPUT** diagnostics + quickfix workflow **CHECK** qflist + loclist + trouble optional

[上一天：格式化与导入整理](/posts/infra/nvim-go-day09/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：包结构与模块边界](/posts/infra/nvim-go-day11/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

学习 diagnostics 浮窗、跳转、quickfix 列表和 location list；把编译错误、LSP 诊断、grep 结果放进同一个处理习惯里。

CHECK

### 完成标准

能制造一个 Go 错误，用诊断跳过去；能把诊断灌进 quickfix；能用 `:grep` 搜索项目并逐条处理；知道 trouble.nvim 只是列表视图增强，不是诊断来源。

## 1. 先分清三种列表

MODEL

今天最重要的心智模型：诊断是问题来源，quickfix / location list 是问题容器，trouble.nvim 是更漂亮的列表界面。

| 名字 | 它是什么 | 什么时候用 |
| --- | --- | --- |
| diagnostics | 来自 LSP、lint、外部工具的错误、警告、提示。 | 在当前 buffer 里即时看问题、跳转问题、打开浮窗。 |
| quickfix list | 全局问题列表，一次只关注一组结果。 | 处理编译错误、全项目 grep、跨文件诊断。 |
| location list | 窗口局部的问题列表，每个窗口可以有自己的列表。 | 只处理当前窗口、当前 buffer 或当前上下文的问题。 |
| trouble.nvim | 把 diagnostics、quickfix、location list 等结果可视化。 | 项目大、问题多，希望有树状列表和预览窗口时使用。 |

不要一开始就依赖插件。先掌握原生 quickfix，trouble.nvim 才会像增强，而不是黑盒。

## 2. 配置诊断显示

DIAGNOSTIC

把这段放进 `lua/lsp/init.lua`，或者单独建 `lua/config/diagnostics.lua` 再在 `init.lua` 里 require。它只控制诊断如何显示，不负责启动 gopls。

```
vim.diagnostic.config({
  virtual_text = {
    prefix = ">",
    source = "if_many",
  },
  signs = true,
  underline = true,
  update_in_insert = false,
  severity_sort = true,
  float = {
    border = "rounded",
    source = "if_many",
  },
})
```

| 配置 | 作用 | 建议 |
| --- | --- | --- |
| `virtual_text` | 在问题行后面显示简短提示。 | 学习期建议开，熟练后可以只保留浮窗。 |
| `signs` | 在 signcolumn 显示错误、警告标记。 | 配合 Day04 的 `signcolumn=yes`，避免正文左右跳。 |
| `update_in_insert` | 是否在 insert 模式持续刷新诊断。 | 先设为 `false`，少一点干扰。 |
| `severity_sort` | 按严重程度排序显示。 | 推荐打开，先处理 Error，再处理 Warn。 |

诊断配置是显示层。没有 gopls attach 时，这段配置不会凭空产生 Go 诊断。

## 3. 给诊断绑定动作

KEYMAPS

Day06 已经绑定过 `[d` / `]d`。今天把它整理成一组可维护的诊断按键，并兼容不同 Neovim 版本。

```
local function diagnostic_jump(count)
  if vim.diagnostic.jump then
    vim.diagnostic.jump({ count = count })
    return
  end

  if count > 0 then
    vim.diagnostic.goto_next()
  else
    vim.diagnostic.goto_prev()
  end
end

vim.keymap.set("n", "gl", vim.diagnostic.open_float, { desc = "Line diagnostic" })
vim.keymap.set("n", "[d", function() diagnostic_jump(-1) end, { desc = "Previous diagnostic" })
vim.keymap.set("n", "]d", function() diagnostic_jump(1) end, { desc = "Next diagnostic" })
vim.keymap.set("n", "<leader>dq", function()
  vim.diagnostic.setqflist({ open = true })
end, { desc = "Diagnostics to quickfix" })
vim.keymap.set("n", "<leader>dl", function()
  vim.diagnostic.setloclist({ open = true })
end, { desc = "Diagnostics to location list" })
```

如果你用的是新版本 Neovim，`vim.diagnostic.jump` 是更统一的跳转入口；旧配置里的 `goto_next` / `goto_prev` 仍可作为兼容 fallback。

## 4. 亲手制造一个诊断

DRILL

回到 Day05 的 `tasknote` 项目，故意写一个类型错误。先用诊断定位，再用 quickfix 收集。

```
package main

func BrokenTask() string {
  task := NewTask(123)
  return FormatTask(task)
}
```

| 动作 | 命令或按键 | 预期 |
| --- | --- | --- |
| 查看当前行问题 | `gl` | 浮窗显示 gopls 给出的类型错误。 |
| 跳到下一条诊断 | `]d` | 光标移动到下一条错误或警告。 |
| 诊断进入 quickfix | `<leader>dq` | 打开 quickfix 窗口，里面列出当前诊断。 |
| 修复并验证 | `u` 或手动改回正确代码，再跑 `go test ./...` | 诊断消失，测试通过。 |

$ cd ~/code/lab/tasknote
$ nvim task.go
$ go test ./...

如果 `<leader>dq` 打开的列表为空，先确认当前 Go buffer 里真的有诊断：`:lua vim.print(vim.diagnostic.get(0))`。

## 5. 快速掌握 quickfix

QUICKFIX

quickfix 是 Vim 系编辑器的老能力，但它非常适合 Go 项目：一组错误、一组搜索结果、一组待处理位置，都可以放进去逐条处理。

| 命令 | 作用 | 习惯 |
| --- | --- | --- |
| `:copen` | 打开 quickfix 窗口。 | 看到一组错误后打开它。 |
| `:cnext` / `:cprev` | 跳到下一条或上一条。 | 逐个处理错误时使用。 |
| `:cc` | 跳到当前 quickfix 项。 | 在列表里选中一项后进入代码。 |
| `:cclose` | 关闭 quickfix 窗口。 | 处理完后收起列表。 |
| `:colder` / `:cnewer` | 在 quickfix 历史里前后切换。 | 刚被 grep 覆盖了旧列表时很有用。 |

```
vim.keymap.set("n", "<leader>qo", "<cmd>copen<cr>", { desc = "Open quickfix" })
vim.keymap.set("n", "<leader>qc", "<cmd>cclose<cr>", { desc = "Close quickfix" })
vim.keymap.set("n", "]q", "<cmd>cnext<cr>", { desc = "Next quickfix item" })
vim.keymap.set("n", "[q", "<cmd>cprev<cr>", { desc = "Previous quickfix item" })
```

quickfix 是全局列表。下一次 `:grep`、`:make` 或 `vim.diagnostic.setqflist()` 会替换当前列表。

## 6. 把 grep 结果放进 quickfix

SEARCH

Telescope 适合“找一个地方”，quickfix 适合“处理一批地方”。今天用 ripgrep 让 `:grep` 直接产生 quickfix 列表。

```
vim.opt.grepprg = "rg --vimgrep --smart-case"
vim.opt.grepformat = "%f:%l:%c:%m"
```

:silent grep! NewTask .
:copen
:cnext
:cprev

| 场景 | 用 Telescope | 用 quickfix |
| --- | --- | --- |
| 找某个函数定义 | 更快，交互过滤后回车。 | 也能做，但略重。 |
| 逐个修改所有引用 | 容易看完就散掉。 | 更适合，列表会留在那里。 |
| 批量确认 TODO | 适合临时浏览。 | 适合逐条处理并记录进度。 |

从今天开始，遇到“我要处理一组位置”，就优先想到 quickfix。

## 7. 把 go test 错误放进列表

MAKE

quickfix 最初就是为编译错误设计的。Go 的测试失败有不同形态，今天先处理编译错误和明显的文件行号错误。

```
vim.opt_local.makeprg = "go test ./..."
vim.opt_local.errorformat = "%A%f:%l:%c: %m,%A%f:%l: %m,%C%m"
```

:make
:copen
:cnext

如果失败输出不能被解析进 quickfix，不要急着调很复杂的 `errorformat`。Day12 会专门处理测试工作流；今天的重点是理解列表机制。

## 8. 可选：安装 trouble.nvim

OPTIONAL

trouble.nvim 不是必须项。它适合在问题很多时把 diagnostics、quickfix、location list 做成更好读的列表。先会原生 quickfix，再装它。

```
{
  "folke/trouble.nvim",
  opts = {},
  cmd = "Trouble",
  keys = {
    {
      "<leader>xx",
      "<cmd>Trouble diagnostics toggle<cr>",
      desc = "Diagnostics (Trouble)",
    },
    {
      "<leader>xX",
      "<cmd>Trouble diagnostics toggle filter.buf=0<cr>",
      desc = "Buffer diagnostics (Trouble)",
    },
    {
      "<leader>xq",
      "<cmd>Trouble qflist toggle<cr>",
      desc = "Quickfix list (Trouble)",
    },
    {
      "<leader>xl",
      "<cmd>Trouble loclist toggle<cr>",
      desc = "Location list (Trouble)",
    },
  },
}
```

| 命令 | 用途 | 备注 |
| --- | --- | --- |
| `:Trouble diagnostics toggle` | 打开或关闭项目诊断列表。 | 适合看整个 workspace 的问题。 |
| `:Trouble diagnostics toggle filter.buf=0` | 只看当前 buffer 的诊断。 | 适合专注修一个文件。 |
| `:Trouble qflist toggle` | 用 Trouble 展示 quickfix。 | 列表来源仍然是 quickfix。 |
| `:Trouble loclist toggle` | 用 Trouble 展示 location list。 | 列表来源仍然是 location list。 |

很多旧教程还写 `:TroubleToggle`。新版本优先使用 `:Trouble diagnostics toggle` 这种命令形式。

## 9. 排查清单

DEBUG

| 现象 | 可能原因 | 排查命令 |
| --- | --- | --- |
| 没有诊断 | gopls 没 attach，或当前文件不在 Go module 里。 | `:lua vim.print(vim.lsp.get_clients())`，`:pwd`，`:set filetype?`。 |
| 有诊断但 quickfix 为空 | 诊断还没刷新，或命令作用在了错误 buffer。 | `:lua vim.print(vim.diagnostic.get(0))`。 |
| `:grep` 没结果 | `grepprg` 或 `grepformat` 不匹配 ripgrep 输出。 | `:set grepprg?`，`:set grepformat?`。 |
| Trouble 空白 | 对应列表本来就是空的，或插件版本命令写旧了。 | 先用 `:copen` / `:lopen` 验证原生列表，再用 `:Trouble qflist toggle`。 |

排查顺序固定：先看数据源，再看列表，再看展示插件。这样不会把 gopls、quickfix 和 trouble.nvim 混成一团。

## 10. 写 Day10 日志并提交

COMMIT

今天的日志要记录你的“问题处理路线”。以后遇到报错，不是盯着屏幕焦虑，而是按路线走。

```
# Day10 diagnostics and quickfix log

## Diagnostics
- gopls attached:
- diagnostic float key:
- previous / next diagnostic key:

## Quickfix
- command used to fill quickfix:
- copen / cnext tested:
- one error fixed from quickfix:

## Search
- grepprg:
- grepformat:
- pattern searched:

## Optional Trouble
- installed:
- diagnostics command:
- qflist command:

## Decision
- when I use quickfix:
- when I use location list:
- when I use Trouble:
```

$ cd ~/.config/nvim
$ git add lua/lsp/init.lua lua/config/diagnostics.lua lua/plugins/init.lua init.lua
$ git commit -m "day10 add diagnostics and quickfix workflow"
$ cd ~/code/lab/tasknote
$ go test ./...

EXIT CHECK

### 离开前自测

制造一个 Go 错误，能用诊断看到它、用 quickfix 收集它、用列表跳到它、修复后用测试确认它消失。完成这套动作，第一阶段 IDE 能力就收束住了。

## 参考资料

PRIMARY SOURCES

NEOVIM

### diagnostic 与 quickfix

[Neovim diagnostic 文档](https://neovim.io/doc/user/diagnostic.html) 说明诊断显示、跳转和 `setqflist`；[quickfix 文档](https://neovim.io/doc/user/quickfix.html) 说明 `:copen`、`:cnext`、`:grep` 和 `:make`。

PLUGIN

### trouble.nvim

[trouble.nvim README](https://github.com/folke/trouble.nvim) 说明 diagnostics、quickfix、location list、LSP references 等模式，以及新版 `:Trouble diagnostics toggle` 命令。

[上一天：格式化与导入整理](/posts/infra/nvim-go-day09/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：包结构与模块边界](/posts/infra/nvim-go-day11/)
