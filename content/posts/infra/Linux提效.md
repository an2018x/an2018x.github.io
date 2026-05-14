---
title: "Linux 提效"
date: '2025-09-08'
draft: false
description: 记录 Linux 常见的提效操作
toc: true
tags:
  - Linux
  - 效率
---

# alias

以 `git reset --hard HEAD` 为例。

在 ~/.zshrc 添加：

```shell
alias gr="git reset --hard HEAD"
```

```shell
source ~/.zshrc
```
