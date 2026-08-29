---
title: "Day 11 · Nvim + Go 包结构与模块边界"
date: '2026-06-13'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 11：梳理 cmd、internal、package 命名和 import path，用 go list、文件树、搜索和 LSP 建立 Go 项目地图。"
toc: true
tags:
  - Go
  - Neovim
  - Package
  - Module
  - Architecture
  - Roadmap
  - Day 11
---

NEOVIM · GO · DAY 11

# 包结构与模块边界

第十一天从“会写 Go 文件”进入“能读懂 Go 项目”。你要把 `go.mod`、package、import path、`cmd/` 和 `internal/` 放到一张地图里，再用 Nvim 的文件树、搜索、LSP 跳转验证这张地图。

**DAY** 11 / 30 **TIME** 75 - 110 min **OUTPUT** package map + project layout **CHECK** go list + internal boundary + LSP nav

[上一天：诊断、quickfix 与 trouble list](/posts/infra/nvim-go-day10/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·下一天：表驱动测试

## 今日验收

DONE MEANS

GOAL

### 今日目标

梳理 `cmd/`、`internal/`、package 命名和 import path；用文件树、搜索、`go list` 和 LSP 建立项目地图。

CHECK

### 完成标准

能解释一个 Go 文件属于哪个 package、它的 import path 是什么、谁可以 import 它；能把 Day05 的 `tasknote` 拆出命令入口和内部业务包。

## 1. 先分清四个概念

MODEL

Go 项目不是按“类文件”组织，而是按 package 和 module 组织。今天先把这四个词钉稳。

| 概念 | 它是什么 | 怎么观察 |
| --- | --- | --- |
| module | 由 `go.mod` 定义的一组 Go packages，是依赖管理和版本边界。 | `cat go.mod`，看第一行 `module ...`。 |
| package | 同一目录下、声明同一个 `package` 名的 Go 文件集合。 | 打开文件第一行，看 `package main` 或 `package task`。 |
| command | 可以编译成可执行程序的 package，必须是 `package main` 并有 `main()`。 | `go run ./cmd/tasknote`。 |
| import path | 其他 package 引用它时使用的路径，通常由 module path 加目录路径组成。 | `go list -f '{{.ImportPath}} {{.Name}}' ./...`。 |

目录名经常影响 import path，但 package 名不一定等于目录名。日常建议让它们一致，减少读代码时的心理摩擦。

## 2. 用 go list 画项目地图

GO LIST

`go list` 是今天的主命令。它让你从 Go 工具链视角看项目，而不是只看文件夹。

$ cd ~/code/lab/tasknote
$ go list ./...
$ go list -f '{{.ImportPath}} {{.Name}} {{.Dir}}' ./...
$ go list -deps ./... | head

| 命令 | 告诉你什么 | 今天怎么用 |
| --- | --- | --- |
| `go list ./...` | 当前 module 下有哪些 packages。 | 确认拆目录后 Go 还能识别所有包。 |
| `go list -f` | 按模板输出 package 的路径、名字、目录。 | 检查 package name 和 import path 是否清晰。 |
| `go list -deps` | 列出依赖图里的所有包。 | 观察标准库、第三方依赖和本地包的边界。 |

如果 `go list ./...` 失败，先别改 Nvim 配置。Go 工具链都看不懂的项目，gopls 通常也会看不稳。

## 3. 推荐的 tasknote 结构

LAYOUT

Day05 的小 CLI 可以先从扁平结构开始，今天把它拆成一个命令入口和一个内部业务包。

```
tasknote/
  go.mod
  cmd/
    tasknote/
      main.go
  internal/
    task/
      task.go
      format.go
      task_test.go
  README.md
```

| 目录 | package | 职责 |
| --- | --- | --- |
| `cmd/tasknote` | `main` | 命令行入口：解析参数、调用业务包、输出结果。 |
| `internal/task` | `task` | 任务创建、校验、格式化等核心逻辑。 |
| `README.md` | 无 | 记录命令用法、项目结构和练习日志。 |

`cmd/` 不是 Go 语言强制规则，而是常见约定；`internal/` 是 Go 工具链识别的边界规则。

## 4. 动手拆 package

REFACTOR

先建目录，再移动文件。移动后要改 package 名、import path 和测试文件位置。

$ cd ~/code/lab/tasknote
$ mkdir -p cmd/tasknote internal/task
$ mv task.go format.go task\_test.go internal/task/
$ mv main.go cmd/tasknote/main.go

内部业务包示例：

```
package task

import "strings"

type Task struct {
  Title string
  Done bool
}

func New(title string) (Task, error) {
  title = strings.TrimSpace(title)
  if title == "" {
    return Task{}, ErrEmptyTitle
  }
  return Task{Title: title}, nil
}
```

命令入口示例。把 import path 里的 module path 换成你自己的 `go.mod` 第一行。

```
package main

import (
  "fmt"
  "os"

  "example.com/tasknote/internal/task"
)

func main() {
  item, err := task.New(strings.Join(os.Args[1:], " "))
  if err != nil {
    fmt.Fprintln(os.Stderr, err)
    os.Exit(1)
  }
  fmt.Println(task.Format(item))
}
```

如果你复制这段，记得补上 `strings` import，或者让 Day09 的保存整理帮你自动加入。这里故意留下一个可观察的 gopls 诊断点。

## 5. 让 Go 工具链确认边界

VERIFY

重构后先问 Go，不要先问编辑器。Go 工具链通过，Nvim 才有稳定基础。

$ gofmt -w cmd internal
$ go test ./...
$ go run ./cmd/tasknote "write day11 note"
$ go list -f '{{.ImportPath}} {{.Name}}' ./...

| 输出 | 说明 | 下一步 |
| --- | --- | --- |
| `go test ./...` 通过 | 所有 package 都能编译，测试仍然有效。 | 回到 Nvim 做跳转和搜索验证。 |
| import path 找不到 | `cmd/tasknote/main.go` 里的 module path 写错。 | 看 `go.mod` 第一行，替换 import 前缀。 |
| undefined 符号 | 函数改名后调用处没同步，或小写函数不能跨 package 使用。 | 用 LSP rename 或 quickfix 逐条修。 |

跨 package 使用的名字必须导出，也就是首字母大写。内部实现细节可以继续小写，留在 package 内部。

## 6. 在 Nvim 里建立项目地图

NVIM MAP

现在回到 Nvim。目标不是“找到文件”，而是让每个目录、package、符号和引用在脑子里连起来。

| 动作 | 命令或按键 | 观察什么 |
| --- | --- | --- |
| 看文件结构 | `:Ex` 或文件搜索 | `cmd/` 和 `internal/` 是否清晰。 |
| 查 package 声明 | `:grep '^package ' .` | 每个目录是否只有一个 package 名。 |
| 查所有 import | `:grep '^import' .` | 哪些文件跨 package 依赖。 |
| 符号跳转 | `gd` / `gr` | 从 `main.go` 跳到 `internal/task`，再回到引用处。 |
| workspace symbol | `:lua vim.lsp.buf.workspace_symbol("Task")` | 确认 gopls 看到整个 module。 |

```
vim.keymap.set("n", "<leader>ps", function()
  vim.lsp.buf.workspace_symbol(vim.fn.input("Symbol: "))
end, { desc = "Workspace symbol" })
```

Day07 的搜索能力在今天开始真正发力：文件搜索看结构，grep 看关系，LSP 看语义。

## 7. 理解 internal 边界

BOUNDARY

`internal/` 的意思是：只有它父目录树以内的代码能 import 它。它让“这是项目私有实现”变成工具链规则。

ALLOWED

### 允许 import

`tasknote/cmd/tasknote` 可以 import `tasknote/internal/task`，因为它们共享 `tasknote` 这个父目录。

BLOCKED

### 禁止 import

项目外部的另一个 module 不能 import `tasknote/internal/task`。Go 编译器会直接报错。

$ go list ./...
$ go test ./...

把不想被外部依赖的代码放进 `internal/`。把真正要作为库公开的 API 留在 module 根部或明确的公开 package 中。

## 8. 做一次命名审查

NAMING

Go 的 package 名会出现在调用处，所以命名要短、具体、少重复。

| 避免 | 更好 | 原因 |
| --- | --- | --- |
| `internal/utils` | `internal/task` | `utils` 不表达业务边界。 |
| `task.TaskManager` | `task.Service` 或直接函数 | 包名已经提供上下文，类型名不必重复。 |
| `common` / `shared` | 按能力命名：`config`、`task`、`store` | 含糊的公共包最后会吸进所有杂物。 |
| 一个 package 做三件事 | 按稳定边界拆包 | 拆包不是按文件数，而是按变化原因。 |

今天不追求“企业级目录”。小项目最好的结构是简单、能解释、能随着需求自然长大。

## 9. 常见故障定位

DEBUG

| 现象 | 可能原因 | 排查命令 |
| --- | --- | --- |
| `found packages main and task` | 同一目录里混了不同 package 名。 | `:grep '^package ' .`。 |
| `package ... is not in std` | import path 写错，或没有在 module 根目录运行。 | `pwd`，`cat go.mod`，`go env GOMOD`。 |
| `use of internal package not allowed` | 从 internal 父目录外部 import 了内部包。 | `go list ./...`。 |
| gopls 跳转失效 | 项目结构变动后 gopls 索引还没刷新，或 Go 工具链已经报错。 | `:LspRestart`，`go test ./...`。 |

遇到结构问题，优先跑 `go list ./...`。它比肉眼看目录更接近 gopls 的真实理解。

## 10. 写 Day11 日志并提交

COMMIT

今天的日志要回答一个问题：这个项目的边界在哪里？边界清楚，后面写测试、重构、调试都会轻很多。

```
# Day11 package and module boundary log

## Module
- module path:
- go list output:

## Layout
- command package:
- internal package:
- public package, if any:

## Import paths
- cmd imports:
- internal imports:
- external deps:

## Nvim map
- package declarations checked:
- workspace symbol tested:
- grep pattern used:

## Boundary decision
- what stays in internal:
- what can be public:
- one package name I improved:
```

$ cd ~/code/lab/tasknote
$ gofmt -w cmd internal
$ go test ./...
$ go run ./cmd/tasknote "ship day11"
$ git add .
$ git commit -m "day11 organize package layout"

EXIT CHECK

### 离开前自测

不用打开浏览器，直接在 Nvim 里说出每个目录的 package、import path 和职责；能从 main 跳到业务包，再从业务包跳回引用处。

## 参考资料

PRIMARY SOURCES

GO

### 模块与代码组织

[Organizing a Go module](https://go.dev/doc/modules/layout) 说明 Go 官方推荐的 module 布局；[How to Write Go Code](https://go.dev/doc/code) 介绍 module、package 和 go tool 的基本工作方式。

NAMING

### package 命名

[Effective Go package names](https://go.dev/doc/effective_go#package-names) 解释 package 命名原则；[Go blog: Package names](https://go.dev/blog/package-names) 进一步说明短小、清晰的包名为什么重要。

[上一天：诊断、quickfix 与 trouble list](/posts/infra/nvim-go-day10/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·下一天：表驱动测试
