---
title: "Go 开发拾遗"
date: '2025-08-21'
draft: false
description: Go 开发拾遗
toc: true
---

# 变量

## 声明变量

```Go
var a int = 6 // 修饰变量声明的关键字 变量名 变量类型 = 初始值
```

Go 会将变量名放在类型前。

```Go
var a, b, c int = 5, 6, 7
```

可以在一行变量声明中同时声明多个变量。

## 类型零值

```Go
var a int // a的初值为int类型的零值：0
```

如果没有显式为变量赋初值，Go 会自动为变量赋予<mark>这个类型的零值</mark>。

