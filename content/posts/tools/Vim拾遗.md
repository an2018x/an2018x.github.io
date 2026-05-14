---
title: "VIM 相关操作"
date: '2025-08-30'
draft: false
description: 整理常用的 VIM 操作
toc: true
tags:
  - Vim
---


# 命令模式

|  命令 | 说明 |
| ---- | --- |
| i |  进入插入模式，光标前插入 |
| a | 进入插入模式，光标后插入 |
| o | 进入插入模式，下一行插入 |
| I | 进入插入模式，在当前行首插入 |
| A | 进入插入模式，在当前行尾插入 |
| O | 进入插入模式，上一行插入 |
| h/j/k/l | 左/下/上/右 |
| ^ | 跳转行首 |
| $ | 跳转到行尾 |
| yy  | 复制一行 |
| dd  | 剪切一行 |
| p | 粘贴内容 |
| [n]yy | 复制n行内容 |
| [n]p | 粘贴 n 次 |
| Ctrl + f | 向前翻页 |
| Ctrl + b | 向后翻页 |
| Ctrl + u | 向上翻半页 |
| Ctrl + d | 向下翻半页 |
| gg | 跳转文件第一行 |
| G | 跳转到最后一行 |
| 10G | 跳转到第 10 行 |
| /hello | 向下查找 hello (大小写敏感)|
| ?hello | 向上查找 hello (大小写敏感)|
| n | 查找下一个 |
| N | 查找上一个 |
| /hello\c | 向下查找 hello (大小写不敏感)|
| u | Undo，撤销上一次操作 |


# 尾行模式


| 命令 | 说明 |
| --- | ---|
| :wq | 保存 + 退出 |
| :set number / :set nu | 设置行号  |
| :set nonumber  | 关闭行号  |
| :50 | 跳转到第 50 行 | 
| :set ic (ignore case) | 设置全局查找忽略大小写 |
| :10,50s/Hello/World/g | 全局替换 10-50 行 Hello 为 World|
| :10,50s/Hello/World/ | 替换 10-50 行，每行第一个 Hello 为 World|
| :s/Hello/World/g | 替换当前行 Hello 为 World|
| :1,$s/Hello/World/g | 替换整个文件中的 Hello 为 World |
| :%s/Hello/World/g | 替换整个文件中的 Hello 为 World |

# 配置文件 

放在 ~/.vimrc 下。

| 命令 | 说明 |
| --- | ---|
|   set nu  | 设置行号   |
| syntax on | 打开语法高亮 |
