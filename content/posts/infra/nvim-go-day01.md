---
title: "Day 01 · Nvim + Go 安装与健康检查"
date: '2026-06-07'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 01：安装 Neovim、Go、ripgrep、fd 和 gopls，完成 :checkhealth、最小 init.lua、Go module 练习和 Git 提交。"
toc: true
tags:
  - Go
  - Neovim
  - Tooling
  - Roadmap
  - Day 01
---

NEOVIM · GO · DAY 01

# 安装与健康检查

第一天不要急着搭 IDE。今天只确认三件事：工具链能被系统找到，Nvim 能正常启动并给出健康报告， Go 项目能在终端和编辑器之间来回跑通。后面 29 天的效率，都压在这一天的地基上。

**DAY** 01 / 30 **TIME** 45 - 75 min **OUTPUT** init.lua + Go module **CHECK** :checkhealth + go test

[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·下一天：Vim 移动心智

## 今日验收

DONE MEANS

GOAL

### 今日目标

装好 Neovim、Go、ripgrep、fd 和 gopls；建立一个可提交的 Nvim 配置入口；创建一个最小 Go module，并在 Nvim 里完成打开、编辑、保存、运行。

CHECK

### 完成标准

`nvim --version`、`go version`、`:checkhealth` 都能跑；`go run .` 有输出；今天的配置和练习代码都进入 Git。

## 1. 安装基础工具

TOOLS

macOS 可以直接用 Homebrew；Linux 用户换成自己的包管理器即可。先只装基础工具，不装主题、状态栏和补全插件。

$ brew install neovim go ripgrep fd
$ go install golang.org/x/tools/gopls@latest
$ nvim --version
$ go version
$ rg --version
$ fd --version

如果 `gopls` 安装后找不到，先看 `go env GOPATH`，把 `$GOPATH/bin` 或 `$HOME/go/bin` 加进 `PATH`。

## 2. 建立最小 Nvim 配置入口

INIT.LUA

今天的配置只负责“能写代码”：行号、缩进、leader 键、保存快捷键。插件管理器留到后面，避免第一天就把问题来源变多。

$ mkdir -p ~/.config/nvim
$ nvim ~/.config/nvim/init.lua

```
vim.g.mapleader = " "

vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.expandtab = true
vim.opt.shiftwidth = 2
vim.opt.tabstop = 2
vim.opt.termguicolors = true

vim.keymap.set("n", "<leader>w", "<cmd>write<cr>", { desc = "Save file" })
```

如果你已经有 Nvim 配置，今天不要重写它。先复制一份备份，再把这段内容放进一个临时练习目录，目标是理解每行配置的作用。

## 3. 跑一次健康检查

HEALTH

NVIM

### 检查编辑器环境

:checkhealth
:version
:echo stdpath("config")

先处理红色错误；Python、Ruby、Node provider 的黄色提示可以记下来，今天不必全部修。

SHELL

### 确认 Go 环境

$ go env GOPATH
$ go env GOMODCACHE
$ gopls version

能解释这些路径，比抄一段 LSP 配置更重要。以后诊断 “gopls 不工作” 时，路径就是第一条线索。

## 4. 创建 Day01 Go 练习项目

GO MODULE

项目只需要小到足以验证工具链：一个函数、一个测试、一次运行。你要练的是从 Nvim 写入文件，然后回到终端验证。

$ mkdir -p ~/code/lab/nvim-go-day01
$ cd ~/code/lab/nvim-go-day01
$ go mod init example.com/nvim-go-day01
$ nvim main.go main\_test.go

这条命令会把 `main.go` 和 `main_test.go` 都放进 Nvim 的 buffer 列表。输入 `:ls` 查看已打开文件，`:bnext` / `:bprevious` 前后切换，`Ctrl-^` 可以在当前文件和上一个文件之间来回跳。

```
package main

import "fmt"

func hello(name string) string {
	return fmt.Sprintf("hello, %s", name)
}

func main() {
	fmt.Println(hello("Nvim + Go"))
}
```

```
package main

import "testing"

func TestHello(t *testing.T) {
	if got := hello("Nvim"); got != "hello, Nvim" {
		t.Fatalf("hello() = %q", got)
	}
}
```

$ gofmt -w main.go main\_test.go
$ go test ./...
$ go run .

## 5. 做 15 分钟编辑器热身

WARMUP

| 动作 | 训练方式 | 今天只要达到 |
| --- | --- | --- |
| 模式切换 | `i` 进入 insert，`Esc` 回 normal，`v` 进入 visual。 | 能清楚说出自己在哪个模式，不再盲按方向键。 |
| 保存与退出 | `:write`、`:quit`、`<leader>w`。 | 不用鼠标完成保存；退出前知道文件是否已修改。 |
| 基础移动 | `hjkl`、`w`、`b`、`gg`、`G`、`/hello`。 | 能在 `main.go` 里快速跳到函数名、测试名和文件末尾。 |
| 切换文件 | `:ls` 查看 buffer，`:bnext` / `:bprevious` 前后切换，`Ctrl-^` 回到上一个编辑文件。 | 能在 `main.go` 和 `main_test.go` 之间不退出 Nvim 来回编辑。 |
| 撤销恢复 | `u` 撤销，`Ctrl-r` 恢复。 | 敢于编辑，因为知道自己能退回来。 |

## 6. 写 Day01 日志并提交

COMMIT

日志不要写感想长文，只记录可复现信息。明天配置出问题时，今天的版本号和警告就是排查起点。

$ mkdir -p notes
$ nvim notes/day01.md
$ git init
$ git add .
$ git commit -m "day01 bootstrap nvim go workspace"

DAY01 LOG

### 日志模板

记录四行即可：Neovim 版本、Go 版本、`:checkhealth` 里仍然存在的警告、今天最不顺手的一个编辑动作。明天只复盘这四行。

## 参考资料

PRIMARY SOURCES

NEOVIM

### Health 与 LSP

[Neovim health 文档](https://neovim.io/doc/user/health.html) 解释 `:checkhealth`；[Neovim LSP 文档](https://neovim.io/doc/user/lsp.html) 解释内置 LSP 客户端。

GO

### Go 与 gopls

[Go 入门教程](https://go.dev/doc/tutorial/getting-started) 说明 `go mod init`、`go run`；[gopls 文档](https://go.dev/gopls/) 说明 Go 语言服务器。

[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)
