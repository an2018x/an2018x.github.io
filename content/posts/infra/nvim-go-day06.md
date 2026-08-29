---
title: "Day 06 · Nvim + Go 接入 gopls"
date: '2026-06-12'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 06：安装 gopls，用 Neovim 内置 LSP 连接 Go 项目，配置 attach 后的定义、引用、悬浮说明、重命名和诊断快捷键。"
toc: true
tags:
  - Go
  - Neovim
  - LSP
  - Roadmap
  - Day 06
---

NEOVIM · GO · DAY 06

# 接入gopls

第六天把 Nvim 接上 Go 官方语言服务器。今天不追求补全菜单和花哨 UI，先看清 LSP 的基本链路： Neovim 启动客户端，`gopls` 理解 Go module，然后把定义、引用、悬浮说明、重命名和诊断结果交回编辑器。

**DAY** 06 / 30 **TIME** 60 - 90 min **OUTPUT** lsp/init.lua + gopls attach **CHECK** definition + hover + rename

[上一天：Go 工具链入门](/posts/infra/nvim-go-day05/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：代码导航与项目搜索](/posts/infra/nvim-go-day07/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

安装 `gopls`；用 Neovim 内置 LSP 连接 Day05 的 `tasknote` 项目；配置 attach 后 keymap：定义、引用、悬浮说明、重命名和诊断跳转。

CHECK

### 完成标准

打开 `task.go` 后，`:lua vim.print(vim.lsp.get_clients())` 能看到 gopls；`gd` 能跳定义，`K` 能看说明，`<leader>rn` 能重命名。

## 1. 安装并确认 gopls

INSTALL

`gopls` 是 Go 官方语言服务器。Nvim 不直接理解 Go 项目，它通过 LSP 协议把问题交给 gopls。

$ go install golang.org/x/tools/gopls@latest
$ gopls version
$ go env GOPATH
$ go env GOBIN

| 检查项 | 含义 | 失败时先看哪里 |
| --- | --- | --- |
| `gopls version` | 确认 shell 能找到 gopls 可执行文件。 | 如果找不到，把 `$GOPATH/bin` 或 `$HOME/go/bin` 加进 `PATH`。 |
| `go env GOPATH` | 查看 Go 默认安装工具的位置。 | 多数机器上 gopls 会安装到 `$(go env GOPATH)/bin`。 |
| `go env GOBIN` | 查看是否覆盖了 Go 工具安装目录。 | 如果有值，优先检查这个目录是否在 `PATH`。 |

先在普通终端确认 `gopls` 可执行。终端找不到，Nvim 通常也找不到。

## 2. 配置最小 LSP 启动器

LSP

把 Day04 的 `lua/lsp/init.lua` 替换成一个最小启动器。它只在 Go 文件里启动 gopls，并以 `go.mod` 所在目录作为项目根。

```
local M = {}

local function root_dir()
  local marker = vim.fs.find({ "go.mod", ".git" }, { upward = true })[1]
  return marker and vim.fs.dirname(marker) or vim.fn.getcwd()
end

local function on_attach(_, bufnr)
  local function map(lhs, rhs, desc)
    vim.keymap.set("n", lhs, rhs, { buffer = bufnr, desc = desc })
  end

  map("gd", vim.lsp.buf.definition, "Go to definition")
  map("gr", vim.lsp.buf.references, "List references")
  map("K", vim.lsp.buf.hover, "Hover documentation")
  map("<leader>rn", vim.lsp.buf.rename, "Rename symbol")
  map("<leader>ca", vim.lsp.buf.code_action, "Code action")
  map("[d", vim.diagnostic.goto_prev, "Previous diagnostic")
  map("]d", vim.diagnostic.goto_next, "Next diagnostic")
end

function M.setup()
  vim.api.nvim_create_autocmd("FileType", {
    pattern = "go",
    callback = function()
      vim.lsp.start({
        name = "gopls",
        cmd = { "gopls" },
        root_dir = root_dir(),
        on_attach = on_attach,
      })
    end,
  })
end

M.setup()

return M
```

这是不用插件管理器的最小版本。Day07 之后可以换成 `nvim-lspconfig`，但今天先理解 Neovim 内置 LSP 的基本形状。

## 3. 理解这段配置

EXPLAIN

| 片段 | 作用 | 为什么重要 |
| --- | --- | --- |
| `vim.fs.find` | 从当前文件向上查找 `go.mod` 或 `.git`。 | LSP 必须知道项目根目录，才能正确理解 package、module 和 import。 |
| `FileType go` | 只在 Go buffer 打开时启动 gopls。 | 避免在 Lua、Markdown、HTML 文件里无意义地启动 Go 语言服务器。 |
| `vim.lsp.start` | 启动一个 LSP 客户端并附加到当前 buffer。 | 这是 Neovim 内置 LSP 的核心入口，不依赖外部插件。 |
| `on_attach` | 客户端成功附加到 buffer 后执行。 | 只有 LSP 真正可用时才注册 LSP 快捷键，避免普通文件里出现无效映射。 |
| `buffer = bufnr` | 让快捷键只对当前 buffer 生效。 | Go 专属动作不污染其他文件类型。 |

## 4. 在 tasknote 项目里验证

VERIFY

回到 Day05 的项目，打开 Go 文件。LSP 不是打开 Nvim 就一定启动，而是进入 Go buffer 后才 attach。

$ cd ~/code/lab/tasknote
$ nvim task.go

| 验证动作 | 命令或按键 | 预期结果 |
| --- | --- | --- |
| 查看客户端 | `:lua vim.print(vim.lsp.get_clients())` | 能看到名为 `gopls` 的客户端。 |
| 跳转定义 | 把光标放到 `Task` 上，按 `gd` | 跳到 `type Task struct` 定义处。 |
| 悬浮说明 | 把光标放到 `strings.TrimSpace` 上，按 `K` | 显示函数签名和文档摘要。 |
| 查找引用 | 把光标放到 `NewTask` 上，按 `gr` | 列出 main 和测试里的引用位置。 |
| 重命名 | 把光标放到局部变量 `title` 上，按 `<leader>rn` | 同一作用域内的变量同步改名。 |

如果 `gd` 没反应，先看 `:set filetype?` 是否是 `go`，再看 `:lua vim.print(vim.lsp.get_clients())` 是否有客户端。

## 5. 观察诊断如何出现

DIAGNOSTICS

语言服务器最有价值的能力之一，是在运行测试之前就发现明显错误。今天亲手制造一个错误，再用诊断定位它。

| 实验 | 操作 | 观察 |
| --- | --- | --- |
| 删除 import | 临时删掉 `task.go` 里的 `strings` import。 | 相关调用处出现诊断，`]d` 可以跳到下一条问题。 |
| 拼错字段 | 把 `task.Title` 改成 `task.Titles`。 | gopls 提示字段不存在，保存后 `go test ./...` 也会失败。 |
| 恢复代码 | 用 `u` 撤销，或手动修回正确代码。 | 诊断消失，`go test ./...` 重新通过。 |

:lua vim.diagnostic.open\_float()
:lua vim.diagnostic.setqflist()

诊断不是测试的替代品。它更像编辑时的即时反馈，最终仍然要用 `go test ./...` 验证。

## 6. 常见故障定位

DEBUG

| 现象 | 可能原因 | 排查命令 |
| --- | --- | --- |
| 启动时报 `gopls` not found | Nvim 继承的 `PATH` 里没有 gopls。 | `:echo $PATH`，终端执行 `which gopls`。 |
| 没有 LSP 客户端 | 当前文件不是 Go filetype，或 autocmd 没触发。 | `:set filetype?`，`:autocmd FileType go`。 |
| 跳转定义不准 | 项目根目录错了，gopls 没读到正确 `go.mod`。 | `:lua print(vim.lsp.get_clients()[1].config.root_dir)`。 |
| 诊断一直不刷新 | 代码未保存、module 状态异常，或 gopls 卡住。 | `:write`，终端跑 `go test ./...`，重启 Nvim。 |

今天先学会看 LSP 是否 attach、root\_dir 是否正确、gopls 是否在 PATH。大部分早期问题都在这三处。

## 7. 写 Day06 日志并提交

COMMIT

记录你今天验证过的 LSP 能力，以及遇到的第一个故障。明天做项目搜索时，这些信息会继续用上。

```
# Day06 gopls log

## Install
- gopls version:
- gopls path:

## Attach
- project:
- root_dir:
- filetype:

## LSP actions tested
- gd:
- gr:
- K:
- rename:
- diagnostics:

## First issue
- symptom:
- command used to debug:
- fix:
```

$ cd ~/.config/nvim
$ git add init.lua lua/lsp/init.lua
$ git commit -m "day06 connect gopls to nvim"
$ cd ~/code/lab/tasknote
$ go test ./...

EXIT CHECK

### 离开前自测

不用看配置，说出 gopls 可执行文件、Go filetype、项目 root\_dir、on\_attach keymap 四者之间的关系。能解释这条链，LSP 才真的接上了。

## 参考资料

PRIMARY SOURCES

GOPLS

### Go 官方语言服务器

[gopls 文档](https://go.dev/gopls/) 介绍安装、能力和编辑器集成；[gopls package 文档](https://pkg.go.dev/golang.org/x/tools/gopls) 提供版本与模块信息。

NEOVIM

### 内置 LSP

[Neovim LSP 文档](https://neovim.io/doc/user/lsp.html) 解释 `vim.lsp.start`、buffer attach、请求和诊断；[diagnostic 文档](https://neovim.io/doc/user/diagnostic.html) 说明诊断显示与跳转。

[上一天：Go 工具链入门](/posts/infra/nvim-go-day05/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：代码导航与项目搜索](/posts/infra/nvim-go-day07/)
