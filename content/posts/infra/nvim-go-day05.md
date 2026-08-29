---
title: "Day 05 · Nvim + Go Go 工具链入门"
date: '2026-06-11'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 05：创建 go mod init 项目，跑通 go fmt、go test、go run，并写一个小 CLI 作为后续练习项目。"
toc: true
tags:
  - Go
  - Neovim
  - Tooling
  - Roadmap
  - Day 05
---

NEOVIM · GO · DAY 05

# Go 工具链入门

第五天把编辑器练习接回真实 Go 开发。今天你要从零创建一个 module，写一个小 CLI，给核心函数补测试， 并反复跑 `go fmt`、`go test`、`go run`。Nvim 是入口，Go 工具链才是交付闭环。

**DAY** 05 / 30 **TIME** 60 - 90 min **OUTPUT** tiny CLI + tests **CHECK** gofmt + go test + go run

[上一天：Lua 配置结构](/posts/infra/nvim-go-day04/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：接入 gopls](/posts/infra/nvim-go-day06/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

创建 `go mod init` 项目；跑通 `go fmt`、`go test`、`go run`；写一个小 CLI 作为后续 LSP、搜索、调试和测试练习项目。

CHECK

### 完成标准

`go test ./...` 通过；`go run . add "learn gopls"` 有输出；项目里有 `go.mod`、`main.go`、`task.go`、`task_test.go` 和一份 Day05 日志。

## 1. 创建 Go module

MODULE

今天的项目叫 `tasknote`：一个极小的任务记录 CLI。它足够小，能专注工具链；又足够真实，后面可以继续扩展搜索、测试、调试和 LSP。

$ mkdir -p ~/code/lab/tasknote/notes
$ cd ~/code/lab/tasknote
$ go mod init example.com/tasknote
$ nvim main.go task.go task\_test.go notes/day05.md

| 文件 | 职责 | 今天关注点 |
| --- | --- | --- |
| `go.mod` | 声明 module 路径和 Go 版本。 | 理解项目根目录，不手动乱改 module 名。 |
| `main.go` | 命令行入口，读取参数并打印结果。 | 保持薄入口，复杂逻辑放到普通函数里。 |
| `task.go` | 核心业务函数：创建、规范化、格式化任务。 | 让可测试逻辑脱离命令行参数。 |
| `task_test.go` | 测试核心函数。 | 先测纯函数，不急着测终端交互。 |

`go mod init` 的 module 路径今天用 `example.com/tasknote` 即可。真实项目再换成仓库地址或公司域名。

## 2. 写一个薄 CLI 入口

MAIN

`main.go` 只做参数解析和输出，不塞业务细节。后续接测试和调试时，这个边界会救你很多次。

```
package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("usage: tasknote add <title>")
		os.Exit(1)
	}

	command := os.Args[1]
	title := strings.Join(os.Args[2:], " ")

	switch command {
	case "add":
		task, err := NewTask(title)
		if err != nil {
			fmt.Println("error:", err)
			os.Exit(1)
		}
		fmt.Println(FormatTask(task))
	default:
		fmt.Println("unknown command:", command)
		os.Exit(1)
	}
}
```

这里先不用第三方 CLI 框架。标准库已经足够完成 Day05 的目标：理解参数、错误、输出和退出码。

## 3. 把核心逻辑放进普通函数

TASK

普通函数比命令行入口更容易测试。今天先把“清理标题、拒绝空任务、格式化输出”这三件事做稳。

```
package main

import (
	"errors"
	"fmt"
	"strings"
)

type Task struct {
	Title string
	Done bool
}

func NewTask(title string) (Task, error) {
	title = strings.TrimSpace(title)
	title = strings.Join(strings.Fields(title), " ")
	if title == "" {
		return Task{}, errors.New("title is required")
	}
	return Task{Title: title}, nil
}

func FormatTask(task Task) string {
	status := " "
	if task.Done {
		status = "x"
	}
	return fmt.Sprintf("[%s] %s", status, task.Title)
}
```

| 代码 | 作用 | 为什么这样写 |
| --- | --- | --- |
| `strings.TrimSpace` | 去掉标题前后的空白。 | 命令行输入经常带多余空格，入口外先统一清洗。 |
| `strings.Fields` | 按任意空白切分词。 | 再用 `strings.Join` 合并，可以把多个连续空格压成一个。 |
| `errors.New` | 创建明确的错误值。 | 比返回空任务更清楚，调用方可以决定如何展示错误。 |
| `FormatTask` | 把任务变成终端可读文本。 | 输出格式集中在一个函数里，后续改 UI 不会散落到 main。 |

## 4. 给核心逻辑补测试

TEST

今天不追求覆盖率数字，只验证最关键的三个行为：标题清理、空标题报错、格式化输出。

```
package main

import "testing"

func TestNewTaskNormalizesTitle(t *testing.T) {
	task, err := NewTask(" learn gopls ")
	if err != nil {
		t.Fatalf("NewTask() error = %v", err)
	}
	if task.Title != "learn gopls" {
		t.Fatalf("Title = %q", task.Title)
	}
}

func TestNewTaskRejectsEmptyTitle(t *testing.T) {
	_, err := NewTask(" ")
	if err == nil {
		t.Fatal("expected error for empty title")
	}
}

func TestFormatTask(t *testing.T) {
	got := FormatTask(Task{Title: "write tests", Done: true})
	if got != "[x] write tests" {
		t.Fatalf("FormatTask() = %q", got)
	}
}
```

测试函数名先写长一点没关系。它应该像一句验收描述：这个函数在什么情况下应该表现成什么样。

## 5. 跑通 fmt、test、run

COMMANDS

Day05 的核心肌肉记忆就是这三条命令。以后每次改 Go 代码，都尽量回到这个闭环。

$ gofmt -w main.go task.go task\_test.go
$ go test ./...
$ go run . add "learn gopls"
$ go run . add " clean test output "

| 命令 | 解决什么问题 | 失败时先看哪里 |
| --- | --- | --- |
| `gofmt -w` | 原地格式化 Go 文件。 | 如果输出不符合预期，先看文件是否保存、命令是否包含所有文件。 |
| `go test ./...` | 运行当前 module 下所有 package 的测试。 | 先读第一个失败测试的函数名和失败行号。 |
| `go run .` | 编译并运行当前 package。 | 参数问题看 `os.Args`；编译问题看错误里的文件和行号。 |
| `go list ./...` | 列出当前 module 中 Go 能识别的 package。 | 如果找不到 package，先确认你站在 module 根目录。 |

今天不要把测试命令藏进快捷键。先在终端完整输入几次，理解每条命令的输入、输出和失败形态。

## 6. 在 Nvim 里完成一次小改动

LOOP

现在把前四天的编辑能力串起来：搜索、移动、文本对象、保存、回到终端验证。

| 改动 | Nvim 动作 | 验证 |
| --- | --- | --- |
| 把默认未完成状态从空格改成短横线 | 搜索 `status := " "`，用 `ci"` 改成 `"-"`。 | 修改 `TestFormatTask` 或新增用例，再跑 `go test ./...`。 |
| 新增 `Complete` 函数 | 复制 `FormatTask` 附近结构，写一个返回完成任务的函数。 | 新增一个测试，确认 `Done` 为 `true`。 |
| 调整错误文案 | 用 `/title is required` 定位，`ci"` 修改字符串。 | 空标题测试仍然通过，命令行输出更清楚。 |

一次只做一个小改动，马上保存和测试。这个节奏比“写完一大坨再调”更适合 Nvim 和 Go。

## 7. 写 Day05 日志并提交

COMMIT

今天的日志要能让你明天继续在这个项目上工作。记录命令、输出、失败点和下一步。

```
# Day05 Go toolchain log

## Module
- module path:
- files created:

## Commands
- gofmt:
- go test:
- go run:

## One change I made in Nvim
- edit:
- command used to verify:
- result:

## Tomorrow
- what gopls should help me with:
```

$ gofmt -w main.go task.go task\_test.go
$ go test ./...
$ go run . add "prepare gopls day"
$ git init
$ git add .
$ git commit -m "day05 build tasknote go cli"

EXIT CHECK

### 第一阶段验收

你能不离开 Nvim 完成 Go 文件创建、快速移动、函数修改、保存，并用终端跑通格式化、测试和运行。Day06 开始，才把 gopls 接进这个闭环。

## 参考资料

PRIMARY SOURCES

GO

### Module 与命令

[Go Modules Reference](https://go.dev/ref/mod) 解释 module、go.mod 和依赖解析；[cmd/go 文档](https://pkg.go.dev/cmd/go) 说明 `go run`、`go test`、`go list` 等命令。

TEST

### 测试与格式化

[testing 包文档](https://pkg.go.dev/testing) 解释 Go 测试函数写法；[gofmt 文档](https://pkg.go.dev/cmd/gofmt) 说明 Go 标准格式化工具。

[上一天：Lua 配置结构](/posts/infra/nvim-go-day04/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：接入 gopls](/posts/infra/nvim-go-day06/)
