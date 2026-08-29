---
title: "Day 09 · Nvim + Go 格式化与导入整理"
date: '2026-06-13'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 09：绑定保存时 gofmt、goimports、gofumpt，确认格式化来自 LSP 还是外部 formatter，并建立可排错的保存格式化流程。"
toc: true
tags:
  - Go
  - Neovim
  - Formatting
  - LSP
  - Roadmap
  - Day 09
---

NEOVIM · GO · DAY 09

# 格式化与导入整理

第九天把保存动作变成可靠的清理入口。Go 的格式化不只是缩进，它还包括导入排序、删除未使用 import、统一代码风格。 今天你要明确一件事：当前格式化到底来自 `gopls`，还是来自 `goimports` / `gofumpt` 这样的外部工具。

**DAY** 09 / 30 **TIME** 60 - 90 min **OUTPUT** format-on-save + import cleanup **CHECK** gofmt + goimports + gopls source

[上一天：补全与片段](/posts/infra/nvim-go-day08/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：诊断、quickfix 与 trouble list](/posts/infra/nvim-go-day10/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

绑定保存时 `gofmt` / `goimports` / `gofumpt`；确认格式化来自 LSP 还是外部 formatter；建立可排错的保存格式化流程。

CHECK

### 完成标准

故意写乱 import 和缩进后，保存 Go 文件会自动整理；`go test ./...` 通过；你能说出今天启用的是 `vim.lsp.buf.format` 还是外部命令。

## 1. 先理解三个工具

TOOLS

Go 格式化有层次。先知道每个工具负责什么，再决定保存时调用谁。

| 工具 | 负责什么 | 今天建议 |
| --- | --- | --- |
| `gofmt` | Go 官方标准格式化：缩进、换行、对齐。 | 永远可信，是最低基线。 |
| `goimports` | 在 gofmt 基础上整理 import，添加缺失 import，删除未使用 import。 | 日常开发最实用，推荐作为外部 formatter。 |
| `gofumpt` | 比 gofmt 更严格的一套格式规则。 | 团队明确采用时再开；个人学习期先知道它存在。 |
| `gopls` | 通过 LSP 提供 format 和 organize imports code action。 | 适合统一走 LSP，但要清楚它背后仍依赖 Go 工具链能力。 |

$ gofmt -h
$ go install golang.org/x/tools/cmd/goimports@latest
$ go install mvdan.cc/gofumpt@latest
$ goimports -h
$ gofumpt -h

如果安装工具时遇到 Go 版本要求，优先升级 Go；临时学习也可以先只用系统自带的 `gofmt`。

## 2. 路线 A：使用 LSP 格式化

LSP FORMAT

LSP 路线的优点是统一：格式化、诊断、代码动作都由 gopls 提供。先把按键放进 Day06 的 `on_attach`。

```
map("<leader>lf", function()
  vim.lsp.buf.format({ async = false })
end, "Format current buffer")
```

再加保存时自动格式化。把它放进 `lua/lsp/init.lua` 的 `on_attach` 内部，确保只在 LSP attach 后启用。

```
local group = vim.api.nvim_create_augroup("GoLspFormat", { clear = false })

vim.api.nvim_clear_autocmds({ group = group, buffer = bufnr })
vim.api.nvim_create_autocmd("BufWritePre", {
  group = group,
  buffer = bufnr,
  callback = function()
    vim.lsp.buf.format({ async = false, bufnr = bufnr })
  end,
})
```

保存前格式化要用 `async = false`。否则保存可能先发生，格式化结果晚一步回来，文件内容和磁盘内容会错位。

## 3. 路线 B：使用外部 formatter

EXTERNAL

外部路线的优点是可解释：你明确知道保存时调用了哪个二进制。今天推荐先用 `goimports`，因为它会整理 import。

```
local function goimports()
  local file = vim.api.nvim_buf_get_name(0)
  if file == "" then
    return
  end

  vim.cmd.write()
  vim.system({ "goimports", "-w", file }, { text = true }, function(result)
    vim.schedule(function()
      if result.code ~= 0 then
        vim.notify(result.stderr, vim.log.levels.ERROR)
        return
      end
      vim.cmd.edit()
    end)
  end)
end

vim.keymap.set("n", "<leader>gf", goimports, { desc = "Format Go file with goimports" })
```

这段是手动命令，不是保存自动触发。先手动跑通，再决定是否放进保存钩子。自动化之前，先让行为可解释。

## 4. 推荐配置：LSP 格式化 + organize imports

RECOMMENDED

如果你已经在 Day06 接好了 gopls，推荐优先用 LSP：保存前先执行 organize imports，再 format。这样逻辑都留在 gopls 这条链路里。

```
local function organize_imports(bufnr)
  local params = vim.lsp.util.make_range_params(nil, "utf-16")
  params.context = { only = { "source.organizeImports" } }

  local clients = vim.lsp.get_clients({ bufnr = bufnr, name = "gopls" })
  for _, client in ipairs(clients) do
    local result = client.request_sync("textDocument/codeAction", params, 1000, bufnr)
    for _, action in ipairs(result and result.result or {}) do
      if action.edit then
        vim.lsp.util.apply_workspace_edit(action.edit, client.offset_encoding)
      end
    end
  end
end

local function format_go(bufnr)
  organize_imports(bufnr)
  vim.lsp.buf.format({
    bufnr = bufnr,
    async = false,
    filter = function(client)
      return client.name == "gopls"
    end,
  })
end
```

然后在 `on_attach` 中绑定保存前动作：

```
local group = vim.api.nvim_create_augroup("GoLspFormat", { clear = false })

vim.api.nvim_clear_autocmds({ group = group, buffer = bufnr })
vim.api.nvim_create_autocmd("BufWritePre", {
  group = group,
  buffer = bufnr,
  callback = function()
    format_go(bufnr)
  end,
})
```

如果你同时装了多个 LSP 或 formatter，`filter` 很重要。它避免两个工具抢着格式化同一个 buffer。

## 5. 制造一个需要整理的文件

DRILL

回到 `tasknote`，故意写乱 import、缩进和未使用包。保存时观察它们是否被整理。

```
package main

import (
  "fmt"
  "strings"
  "os"
)

func DebugTask(title string) string {
task, err := NewTask(strings.TrimSpace(title))
if err != nil {
return fmt.Sprintf("error: %v", err)
}
return FormatTask(task)
}
```

| 问题 | 格式化后应该怎样 | 谁负责 |
| --- | --- | --- |
| 缩进乱 | 函数体缩进恢复为 Go 标准格式。 | `gofmt` / LSP format。 |
| import 顺序乱 | 标准库 import 按组和字母顺序整理。 | `goimports` 或 gopls organize imports。 |
| `os` 未使用 | 未使用 import 被删除。 | `goimports` 或 gopls organize imports。 |

$ go test ./...
$ gofmt -w \*.go
$ goimports -w \*.go

如果保存后 import 没变，但缩进变了，说明你只启用了 format，没有启用 organize imports。

## 6. 确认格式化来源

SOURCE

不要只说“保存会格式化”。要能说出是哪条链路触发了格式化。

| 检查 | 命令 | 怎么看 |
| --- | --- | --- |
| 有哪些保存钩子 | `:autocmd BufWritePre` | 看是否有 `GoLspFormat` 或你自己创建的 group。 |
| LSP 是否支持格式化 | `:lua vim.print(vim.lsp.get_clients()[1].server_capabilities.documentFormattingProvider)` | 如果是 `true`，gopls 可以处理 format 请求。 |
| 当前客户端是谁 | `:lua vim.print(vim.lsp.get_clients())` | 确认是否只有 `gopls`，还是有多个客户端。 |
| 外部工具是否可用 | `:echo executable("goimports")` | 输出 `1` 表示 Nvim 能找到外部命令。 |

格式化重复触发时，常见症状是保存变慢、光标跳动、文件反复变更。先查 autocmd，再查 LSP 客户端数量。

## 7. 写 Day09 日志并提交

COMMIT

今天的日志重点记录你选择了哪条格式化路线。以后团队项目里最容易争论的就是格式化来源。

```
# Day09 formatting and imports log

## Tools
- gofmt:
- goimports:
- gofumpt:

## Format source
- LSP or external:
- BufWritePre group:
- command used to inspect:

## Import cleanup
- broken file:
- before save:
- after save:

## Decision
- my default formatter:
- when I would use gofumpt:
```

$ cd ~/.config/nvim
$ git add lua/lsp/init.lua
$ git commit -m "day09 format go files on save"
$ cd ~/code/lab/tasknote
$ go test ./...

EXIT CHECK

### 离开前自测

保存一个 Go 文件前，先说出会触发哪个 autocmd、调用哪个客户端或工具、是否整理 import。说得出来，配置才算可维护。

## 参考资料

PRIMARY SOURCES

GO

### 格式化工具

[gofmt 文档](https://pkg.go.dev/cmd/gofmt) 说明 Go 官方格式化工具；[goimports 文档](https://pkg.go.dev/golang.org/x/tools/cmd/goimports) 说明 import 整理；[gofumpt](https://github.com/mvdan/gofumpt) 提供更严格的格式化规则。

NEOVIM

### LSP 与自动命令

[Neovim LSP 文档](https://neovim.io/doc/user/lsp.html) 解释 `vim.lsp.buf.format`；[autocmd 文档](https://neovim.io/doc/user/autocmd.html) 解释 `BufWritePre` 与 augroup。

[上一天：补全与片段](/posts/infra/nvim-go-day08/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：诊断、quickfix 与 trouble list](/posts/infra/nvim-go-day10/)
