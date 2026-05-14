---
title: "Linux 文本操作"
date: '2025-08-30'
draft: false
description: 整理常用的 Linux 文本操作
toc: true
tags:
  - Linux
---

# Less


* 空格键 或 f：向下滚动一整屏。
* b：向上滚动一整屏。
* d：向下滚动半屏。
* u：向上滚动半屏。
* g：跳转到文件开头。
* G：跳转到文件末尾。
* 数字 + G：跳转到指定行（如 50G 跳转到第 50 行）。
* Ctrl + g：显示当前位置信息（行号、总行数、进度百分比）。
* /关键词：向下搜索指定关键词（如 /error 查找所有 “error”）。
* ?关键词：向上搜索指定关键词（如 ?success 向上查 “success”）。
* n：跳转到下一个匹配结果（与搜索方向一致）。
* N：跳转到上一个匹配结果（与搜索方向相反）。
* -i：在搜索时忽略大小写（输入 -i 后回车，再次输入关闭）。

# Grep


## 基础搜索

* 搜索指定文件中包含目标字符串的行

```shell
# 在 nginx.log 中搜索包含 "404" 的行
grep "404" nginx.log
```

* 从多个文件搜索

```shell
# 在 file1.txt 和 file2.txt 中搜索 "warning"
grep "warning" file1.txt file2.txt
```

* 从标准输入中搜索

```shell
# 查看进程并筛选包含 "python" 的进程
ps aux | grep "python"
```

## 忽略大小写

```shell
# 搜索包含 "error" 或 "ERROR" 或 "Error" 的行
grep -i "error" /var/log/syslog
```

## 显示行号

```shell
# 在 config.ini 中搜索 "port" 并显示行号
grep -n "port" config.ini
# 输出示例：5:server_port = 8080
```

## 反向匹配

```shell
# 查看 /etc/passwd 中不包含 "nologin" 的行（通常是可登录用户）
grep -v "nologin" /etc/passwd
```

## 只显示匹配的字符串

```shell
# 在日志中只提取所有 IP 地址（假设 IP 格式为 x.x.x.x）
grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+" access.log
```

## 递归搜索

```shell
# 在 ./src 目录下所有文件中搜索 "import numpy"
grep -r "import numpy" ./src
```

## 统计行数

```shell
# 统计日志中包含 "error" 的行数
grep -c "error" app.log
```

## 正则匹配

基础正则

* `^`：匹配行首（如 ^ERROR 匹配以 ERROR 开头的行）
* `$`：匹配行尾（如 `exit$` 匹配以 exit 结尾的行）
* `.`：匹配任意单个字符（如 err.r 匹配 error、errar 等）
* `*`：匹配前一个字符 0 次或多次（如 err* 匹配 er、err、errr 等）
* `[]`：匹配括号内的任意一个字符（如 [0-9] 匹配数字）

```shell
# 搜索以 "INFO" 开头且以 "done" 结尾的行
grep "^INFO.*done$" service.log

# 搜索包含 3 位数字的行
grep "[0-9]\{3\}" data.txt
```

扩展正则

```shell
# 匹配 "user1" 或 "user2"（扩展正则的 | 表示或）
grep -E "user1|user2" /etc/passwd
```

# awk

## 简介

awk 是 Linux 中功能强大的文本处理工具，主要用于分析、提取和转换结构化文本数据（如日志文件、CSV、配置文件等）。它按行处理文本，支持模式匹配、字段提取、计算、流程控制等，尤其适合处理 “每行格式相似” 的文本（如用空格 / 逗号分隔的表格数据）。

* 记录（Record）：默认指一行文本（由换行符分隔），可通过 RS 变量修改分隔符。
* 字段（Field）：每行中被分隔符拆分的 “列”，默认用空格 / 制表符分隔，可通过 -F 选项指定分隔符。
    * 用 $1 表示第 1 个字段，$2 表示第 2 个字段，...，$0 表示整行。
    * NF 是内置变量，代表当前行的字段总数（$NF 表示最后一个字段）。
    * NR 是内置变量，代表当前处理的行号（记录数）。

## 格式

```shell
awk [选项] '模式 {动作}' 文件名
```

选项：常用 -F 分隔符 指定字段分隔符；-v 变量=值 定义变量。
模式：用于筛选行（如正则表达式、条件判断），不指定则匹配所有行。
动作：对匹配的行执行操作（如打印字段、计算、判断等），用 {} 包裹

## 提取字段

处理 /etc/passwd（格式：用户名:密码:UID:GID:描述:家目录:shell，分隔符为 :）。
打印所有用户的 “用户名”（第 1 字段）和 “登录 shell”（第 7 字段）：

```bash
awk -F ':' '{print $1, $7}' /etc/passwd
# 输出示例：
# root /bin/bash
# daemon /usr/sbin/nologin
```

打印行号（NR）和整行（$0）：

```shell
awk '{print "行号:", NR, "内容:", $0}' file.txt
```

## 按条件筛选

正则匹配：打印 /etc/passwd 中 shell 为 /bin/bash 的用户（第 7 字段匹配 /bin/bash）：

```shell
awk -F ':' '$7 == "/bin/bash" {print $1}' /etc/passwd
```

数值比较，打印 UID 大于 1000 的用户（第 3 字段 $3 是数值）：

```shell
awk -F ':' '$3 > 1000 {print $1, $3}' /etc/passwd
```

逻辑判断：打印 “家目录在 /home 且 shell 不是 /bin/false” 的用户

```shell
awk -F ':' '$6 ~ /^\/home/ && $7 != "/bin/false" {print $1, $6}' /etc/passwd
# ~ 表示正则匹配，!~ 表示不匹配；&& 是逻辑与，|| 是逻辑或
```

## 内置变量

* NR：当前行号（全局，所有文件累计）
* FNR：当前文件内的行号（多文件处理时有用）
* NF：当前行的字段总数（$NF 是最后一个字段）
* FILENAME：当前处理的文件名


## 流程控制

```shell
awk -F ',' 'NR > 1 {
  if ($2 < 30) {
    print $1, "是青年"
  } else {
    print $1, "是中年"
  }
}' data.csv
```

```shell
awk '{
  print "第" NR "行的字段："
  for (i=1; i<=NF; i++) {
    print "  第" i "个字段：" $i
  }
}' file.txt
```

# sed

## 替换文本

* 替换文件中所有 old 为 new（输出到终端，不修改原文件）：

```shell
sed 's/old/new/g' file.txt
```

* 原地修改

```shell
sed -i 's/error/ERROR/g' app.log  # 直接修改 app.log
sed -i.bak 's/foo/bar/' data.txt  # 修改并备份为 data.txt.bak
```

## 按行号处理

* 打印第 5 行（结合 -n 只输出匹配行）：

```shell
sed -n '5p' file.txt
```

* 打印 3 到 10 行：

```shell
sed -n '3,10p' file.txt
```

* 删除 3 到末行（$ 表示最后一行）：

```shell
sed '3,$d' file.txt
```

## 按模式匹配

* 打印包含 error 的行：

```shell
sed -n '/error/p' log.txt
```

* 删除所有空行（^$ 匹配空行）：

```shell
sed '/^$/d' file.txt
```

## 插入追加文本

* 在第 1 行前插入 === 开始 ===：

```shell
sed '1i === 开始 ===' file.txt
```

* 在包含 [server] 的行后追加 port = 8080：

```shell
sed '/\[server\]/a port = 8080' config.ini  # [ ] 需转义为 \[ \]
```

## 替换整行

* 将所有包含 deprecated 的行替换为 已废弃：

```shell
sed '/deprecated/c 已废弃' readme.txt
```

## 多个操作组合

用 -e 选项或分号 ; 执行多个操作。

* 先删除空行，再替换 old 为 new：

```shell
sed -e '/^$/d' -e 's/old/new/g' file.txt
# 等价于：
sed '/^$/d; s/old/new/g' file.txt
```
