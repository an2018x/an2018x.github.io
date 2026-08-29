---
title: "Day 03 · Nvim + Go 文本对象与批量编辑"
date: '2026-06-09'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 03：练习 ciw、di(、ya\"、点命令和宏录制，用 Go 文件完成变量名、函数参数、注释与重复结构的批量编辑。"
toc: true
tags:
  - Go
  - Neovim
  - Tooling
  - Roadmap
  - Day 03
---

NEOVIM · GO · DAY 03

# 文本对象与批量编辑

第三天开始进入 Vim 真正省力的地方：先描述文本范围，再选择动作。你不再逐字删除括号里的参数， 而是用 `di(` 说“删除括号内部”；不再重复手工改三遍，而是用点命令和宏把一次编辑变成可复用动作。

**DAY** 03 / 30 **TIME** 50 - 80 min **OUTPUT** text object drills + notes/day03.md **CHECK** ciw / di( / ya" / . / q

[上一天：Vim 移动心智](/posts/infra/nvim-go-day02/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：Lua 配置结构](/posts/infra/nvim-go-day04/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

练习 `ciw`、`di(`、`ya"`、宏录制、点命令；用 Go 文件完成变量名、函数参数、注释和重复结构的批量编辑。

CHECK

### 完成标准

能解释 operator、motion、text object 的组合关系；能把一次修改用 `.` 重复到下一处；能录制一个只做一件小事的宏，并用 `@q` 回放。

## 1. 准备 Day03 练习项目

LAB

今天的练习文件故意放了重复字段、字符串、参数和注释。它不追求业务完整，而是给文本对象、点命令和宏提供足够多的落点。

$ mkdir -p ~/code/lab/nvim-go-day03/notes
$ cd ~/code/lab/nvim-go-day03
$ go mod init example.com/nvim-go-day03
$ nvim main.go notes/day03.md

```
package main

import (
	"fmt"
	"strings"
)

type Issue struct {
	ID int
	Title string
	Owner string
	Labels []string
}

func normalizeOwner(owner string) string {
	owner = strings.TrimSpace(owner)
	owner = strings.ToLower(owner)
	return owner
}

func formatIssue(issue Issue, prefix string) string {
	title := strings.TrimSpace(issue.Title)
	owner := normalizeOwner(issue.Owner)
	labels := strings.Join(issue.Labels, ",")
	return fmt.Sprintf("%s #%d %s owner=%s labels=%s", prefix, issue.ID, title, owner, labels)
}

func main() {
	issues := []Issue{
		{ID: 101, Title: " Fix login redirect ", Owner: "ALICE", Labels: []string{"bug", "auth"}},
		{ID: 102, Title: "Add profile cache", Owner: "BOB", Labels: []string{"feature", "api"}},
		{ID: 103, Title: "Clean error message", Owner: "CAROL", Labels: []string{"paper-cut", "ux"}},
	}

	for _, issue := range issues {
		// TODO: print issue summary
		fmt.Println(formatIssue(issue, "TODO"))
	}
}
```

先手打代码，再运行 `gofmt -w main.go`。如果 gofmt 改动了缩进，正好观察一下 Go 代码在 Vim 里按结构移动的感觉。

## 2. 理解 Vim 的编辑语法

GRAMMAR

Vim 的许多命令可以拆成一个句子：动作 + 范围。先记这个模型，再记快捷键会轻很多。

| 组合 | 含义 | 在 Go 里怎么用 |
| --- | --- | --- |
| `d` + motion | 删除某个移动范围 | `dw` 删除下一个词，`d$` 删除到行尾。 |
| `c` + motion | 修改某个范围，删除后进入 insert | `ciw` 修改当前变量名，`c$` 改写当前行剩余部分。 |
| `y` + motion | 复制某个范围 | `yy` 复制整行，`ya"` 复制含引号的字符串。 |
| `gU` / `gu` + motion | 大小写转换 | `gUiw` 把当前词转大写，`guiw` 转小写。 |

今天先少用 visual 选择。优先训练“我想操作什么范围”，再用 operator + text object 精确表达它。

## 3. 掌握核心文本对象

OBJECTS

| 对象 | 按键 | 练习动作 |
| --- | --- | --- |
| 当前词 | `iw` / `aw` | 把 `owner` 改成 `assignee`：光标落在词内，按 `ciw`。 |
| 括号内部 | `i(` / `a(` | 清空 `fmt.Sprintf(...)` 的参数：光标在括号内，按 `di(`。 |
| 花括号内部 | `i{` / `a{` | 复制一个结构体 literal 的内容，观察 inner 与 around 是否包含括号。 |
| 引号内部 | `i"` / `a"` | 把 `"TODO"` 改成 `"OPEN"`：光标在字符串里，按 `ci"`。 |
| 整行 | `dd` / `yy` / `cc` | 复制一行 issue 数据，再用文本对象改掉 ID、Title、Owner 和 Labels。 |

`i` 是 inner，只取内部；`a` 是 around，连同边界一起取。括号、引号、词都按这个思路理解。

## 4. 用点命令重复上一次修改

DOT

点命令 `.` 会重复上一次修改。它最适合“同一种改法，换一个位置再做一次”。关键是把第一次修改做小、做完整。

DRILL

### 重复修改字符串

在 `"TODO"` 内按 `ci"OPEN`，回 normal 后搜索下一个 `TODO`，按 `.`。如果第一次修改边界选得好，第二次就不用重新输入。

DRILL

### 重复追加字段

在每条 issue literal 的 `Labels` 后追加一个字段。第一处用 `A,` 进入行尾追加，再移动到下一行用 `.` 重复。

点命令不好用时，通常不是点命令的问题，而是第一次修改做得太大、混进了太多移动。

## 5. 录一个小而稳的宏

MACRO

宏不是魔法，它只是把一串按键录下来。今天只录“小宏”：从当前行开始，完成一处机械改动，然后停在下一处容易继续的位置。

| 步骤 | 按键 | 目的 |
| --- | --- | --- |
| 开始录制 | `qq` | 把宏录进寄存器 `q`。 |
| 执行一次编辑 | `/Owner<cr>ciwassignee<esc>` | 搜索下一个 `Owner`，把当前词改成 `assignee`。 |
| 停到下一处 | `n` | 让宏结束时落在下一处匹配，方便连续回放。 |
| 结束录制 | `q` | 停止录制。用 `@q` 回放一次，用 `3@q` 回放三次。 |

如果宏跑偏，按 `u` 撤销，重新录一个更短的版本。宏越短，越容易理解和修正。

## 6. 完成 Go 批量编辑任务

BATCH

| 任务 | 建议动作 | 验收方式 |
| --- | --- | --- |
| 变量名替换 | 用 `*` 找同词，再用 `ciw`、`n`、`.` | 把局部变量 `owner` 改成 `assignee`，不误伤结构体字段。 |
| 函数参数改写 | 在括号内用 `ci(` 或 `di(` | 把 `formatIssue(issue, "TODO")` 改成新的参数组合，再跑 gofmt。 |
| 字符串批量修改 | 搜索字符串后用 `ci"` 和 `.` | 把几个 label 或状态词改成统一风格。 |
| 注释改写 | 用 `cc` 改整行注释，或 `c$` 改注释正文 | 把 TODO 注释改成一句更具体的说明。 |
| 重复结构追加 | 用 `yy` 复制一条 issue，再用文本对象改字段 | 新增第四条 issue，运行后输出内容合理。 |

## 7. 写 Day03 日志并提交

COMMIT

日志记录今天真正省下力气的动作。不要写“宏很强”，要写“我用宏把哪三行做了同一种修改”。

```
# Day03 text object log

## Three commands I used
- ciw:
- di(:
- ya":

## Repeat
- Dot command worked well when:
- Dot command failed when:

## Macro
- Register:
- What it changed:
- How I verified it:
```

$ gofmt -w main.go
$ go test ./...
$ go run .
$ git add .
$ git commit -m "day03 practice text objects and macros"

EXIT CHECK

### 离开前自测

任选一处变量名、括号参数、引号字符串和整行注释，分别说出你会用哪个对象修改它。能说清楚范围，再动手。

## 参考资料

PRIMARY SOURCES

NEOVIM

### Operator 与文本对象

[motion 文档](https://neovim.io/doc/user/motion.html) 解释 motion、operator-pending 和文本对象；[change 文档](https://neovim.io/doc/user/change.html) 解释删除、修改、复制和重复。

REPEAT

### 点命令与宏

[repeat 文档](https://neovim.io/doc/user/repeat.html) 解释 `.`、寄存器、录制和回放宏。

[上一天：Vim 移动心智](/posts/infra/nvim-go-day02/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：Lua 配置结构](/posts/infra/nvim-go-day04/)
