---
title: "Day 02 · Nvim + Go Vim 移动心智"
date: '2026-06-08'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 02：练习 normal、insert、visual 三种模式，掌握 hjkl、word、line、paragraph 与 search 移动，并输出个人快捷键纸。"
toc: true
tags:
  - Go
  - Neovim
  - Tooling
  - Roadmap
  - Day 02
---

NEOVIM · GO · DAY 02

# Vim 移动心智

第二天不加插件，也不追求炫技。今天只训练一件基础能力：让光标移动从“按方向键试探”变成“按编辑意图跳转”。 你要能清楚区分 normal、insert、visual 三种模式，并用词、行、段落和搜索在 Go 文件里快速定位。

**DAY** 02 / 30 **TIME** 45 - 70 min **OUTPUT** notes/day02.md **CHECK** movement drill + key sheet

[上一天：安装与健康检查](/posts/infra/nvim-go-day01/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：文本对象与批量编辑](/posts/infra/nvim-go-day03/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

练熟 normal、insert、visual 三种模式；掌握 `hjkl`、word、line、paragraph、search 五类移动；把最常用的移动动作写成一张个人快捷键纸。

CHECK

### 完成标准

能在不碰鼠标的情况下跳到 Go 文件里的任意函数、字符串、结构体字段和错误处理分支；能解释 `w`、`e`、`b`、`0`、`$`、`/`、`n` 的使用场景。

## 1. 准备 Day02 练习项目

LAB

今天用一个短 Go 文件做移动训练。代码不需要复杂，但要有函数、结构体、字符串、分支和空行，这样移动单位才有可练的地形。

$ mkdir -p ~/code/lab/nvim-go-day02/notes
$ cd ~/code/lab/nvim-go-day02
$ go mod init example.com/nvim-go-day02
$ nvim main.go notes/day02.md

```
package main

import (
	"fmt"
	"strings"
)

type Task struct {
	Title string
	Done bool
}

func normalizeTitle(title string) string {
	title = strings.TrimSpace(title)
	title = strings.ReplaceAll(title, " ", " ")
	return strings.ToLower(title)
}

func visibleTasks(tasks []Task) []Task {
	var visible []Task
	for _, task := range tasks {
		if task.Done {
			continue
		}
		visible = append(visible, task)
	}
	return visible
}

func main() {
	tasks := []Task{
		{Title: " Learn Nvim movement ", Done: false},
		{Title: "Write Go test", Done: true},
		{Title: "Practice search", Done: false},
	}

	for _, task := range visibleTasks(tasks) {
		fmt.Println(normalizeTitle(task.Title))
	}
}
```

先把这段代码手打进 Nvim。今天的训练重点不是复制代码，而是在输入、保存、撤销、搜索之间建立稳定的节奏。

## 2. 把模式切换练成条件反射

MODES

| 模式 | 进入方式 | 今天要形成的判断 |
| --- | --- | --- |
| Normal | `Esc` 或 `Ctrl-[` | 移动、删除、复制、搜索、撤销都从 normal 开始。停下来思考时，先回 normal。 |
| Insert | `i`、`a`、`o`、`O` | 只在真正输入文字时进入 insert。输入结束立刻回 normal，不把 insert 当默认状态。 |
| Visual | `v`、`V`、`Ctrl-v` | 选中一段文本时使用。今天先练字符选择和整行选择，块选择知道入口即可。 |
| Command-line | `:`、`/`、`?` | 保存、退出、执行命令和搜索都在这里完成。命令输错时用 `Esc` 取消。 |

练习 5 轮：`i` 输入一行注释，`Esc` 回 normal，`u` 撤销，`Ctrl-r` 恢复，`V` 选中整行，再 `Esc` 退出选择。

## 3. 建立移动单位

MOTIONS

Vim 的移动不是“往左一点、往右一点”，而是按文本结构移动。今天先掌握字符、词、行、段落、屏幕五个尺度。

| 尺度 | 按键 | 在 Go 文件里怎么练 |
| --- | --- | --- |
| 字符 | `h` `j` `k` `l` | 只用于微调位置。连续按超过 5 次，就换更大的移动方式。 |
| 词 | `w` `e` `b` / `W` `E` `B` | 在 `normalizeTitle` 和 `visibleTasks` 之间练习跳到单词开头、结尾和回退。 |
| 行 | `0` `^` `$` `gg` `G` `12G` | 跳到行首、首个非空字符、行尾、文件顶部、文件底部和指定行号。 |
| 段落 | `{` `}` | 利用函数之间的空行，在一个函数块和下一个函数块之间移动。 |
| 屏幕 | `Ctrl-d` `Ctrl-u` `zz` `zt` `zb` | 长文件里用半屏滚动，定位后用 `zz` 把当前行放到屏幕中间。 |

## 4. 用搜索代替扫视

SEARCH

INLINE

### 行内定位

`f"` 跳到本行下一个双引号，`t)` 跳到右括号前，`;` 重复上一次行内查找，`,` 反向重复。它们适合在一行函数调用里精确落点。

FILE

### 文件内搜索

`/Task` 向下搜索，`?Task` 向上搜索，`n` 到下一个结果，`N` 到上一个结果。光标停在单词上时，`*` 搜同词下一个。

把下面几行加到 Day01 的 `init.lua`，让搜索反馈更清楚。它们不是插件，只是基础编辑体验。

```
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.opt.incsearch = true
vim.opt.scrolloff = 6

vim.keymap.set("n", "<leader>h", "<cmd>nohlsearch<cr>", { desc = "Clear search highlight" })
```

练习顺序：搜索 `Task`，用 `n` 跳完全部结果；再搜索 `visible`，用 `N` 倒着回去；最后用 `<leader>h` 清掉高亮。

## 5. 做 20 分钟移动训练

DRILL

| 任务 | 限制 | 验收方式 |
| --- | --- | --- |
| 跳到每个函数名 | 只能用 `/`、`n`、`w`、`b` | 依次落到 `normalizeTitle`、`visibleTasks`、`main`。 |
| 检查每个字符串 | 用 `/"` 搜索，再用 `n` 前进 | 能快速扫过 import、ReplaceAll 参数和三个任务标题。 |
| 定位错误高发点 | 搜索 `continue`、`append`、`Println` | 每次定位后用 `zz` 居中，读完上下文再跳下一个。 |
| 段落跳转 | 用 `{` 和 `}`，不用滚轮 | 能从 type 定义跳到第一个函数、第二个函数、main 函数。 |
| 编辑后恢复 | 随意改一处字符串，然后用 `u` 和 `Ctrl-r` | 确认自己能撤销和重做，不害怕动代码。 |

## 6. 输出个人快捷键纸

KEY SHEET

快捷键纸不要追求全。只记录你今天真正会用、明天愿意继续用的动作。每个动作后面写一个自己的使用场景，比抄完整 help 更有用。

```
# Day02 Nvim movement key sheet

## Mode
- Normal: Esc / Ctrl-[, stop and think here
- Insert: i a o O, only for typing
- Visual: v V Ctrl-v, select before operating

## Move
- hjkl: small adjustment
- w e b: word start / word end / back
- 0 ^ $: line start / first non-blank / line end
- gg G 12G: top / bottom / line number
- { }: previous / next paragraph
- Ctrl-d Ctrl-u zz: half-page down / half-page up / center cursor

## Search
- /word ?word: search down / up
- n N: next / previous match
- f<char> t<char> ; ,: inline find / before-char / repeat / reverse

## My friction
- The motion I overused today:
- The motion I want to use tomorrow:
```

把这份内容写进 `notes/day02.md`，最后补上两行复盘：今天最容易忘的一个移动动作，以及明天最想练的一个文本对象。

## 7. 运行、格式化并提交

COMMIT

训练结束后照常跑一次 Go 工具链。哪怕今天主要练编辑器，也要保持“改完就验证”的节奏。

$ gofmt -w main.go
$ go test ./...
$ go run .
$ git init
$ git add .
$ git commit -m "day02 practice vim movement"

EXIT CHECK

### 离开前自测

随机说出一个目标：函数名、字符串、行尾、文件底部、上一个搜索结果。你应该能在 3 次按键思考内选出移动方式，而不是靠连续方向键慢慢挪。

## 参考资料

PRIMARY SOURCES

NEOVIM

### 移动与模式

[Neovim 用户手册 02](https://neovim.io/doc/user/usr_02.html) 介绍首次编辑、插入和移动；[motion 文档](https://neovim.io/doc/user/motion.html) 解释移动命令和文本位置。

SEARCH

### 搜索与模式匹配

[pattern 文档](https://neovim.io/doc/user/pattern.html) 解释 `/`、`?`、`n`、`N` 与搜索模式。

[上一天：安装与健康检查](/posts/infra/nvim-go-day01/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：文本对象与批量编辑](/posts/infra/nvim-go-day03/)
