---
title: "Go 开发拾遗"
date: '2025-08-21'
draft: false
description: Go 开发拾遗
toc: true
---

# 变量


## 变量声明

### 声明变量

```Go
var a int = 6 // 修饰变量声明的关键字 变量名 变量类型 = 初始值
```

Go 会将变量名放在类型前。

```Go
var a, b, c int = 5, 6, 7
```

可以在一行变量声明中同时声明多个变量。

### 类型零值

```Go
var a int // a的初值为int类型的零值：0
```

如果没有显式为变量赋初值，Go 会自动为变量赋予<mark>这个类型的零值</mark>。

### 变量声明块

```Go
var (
    a, b, c int = 5, 6, 7
    c, d, e rune = 'C', 'D', 'E'
) 
```

用一个 var 关键字将多个变量声明放在一起。

### 省略类型信息的声明

```Go
var b = 13
```

Go 编译器会根据右侧变量初值自动推导出变量的类型，并给这个变量赋予初值所对应的默认类型。

整型值的默认类型 int，浮点值的默认类型为 float64，复数值的默认类型为 complex128。

```Go
var a
```

注意：不允许不带初值的，省略类型信息的声明。

### 显式类型转型

```Go
var b = int32(13)
```

当不接受默认类型，而是要显式地为变量指定类型，除了通用的声明形式，我们还可以通过显式类型转型达到我们的目的。

### 短变量声明

```Go
a := 12
b := 'A'
c := "hello"
```

通过短变量声明，可以省略 var 和类型信息。

## 变量作用域

### 包级变量

包级变量在包级别可见。

包级变量只能使用带有 var 变量的声明形式，不能使用短变量声明形式。

```Go
var (
  a = 13
  b = int32(17)
  f = float32(3.14)
)
```

使用显式类型转型，是 Go 官方推荐的包变量声明形式。

```Go
// $GOROOT/src/net/net.go
var (
    netGo  bool 
    netCgo bool 
)

var (
    aLongTimeAgo = time.Unix(1, 0)
    noDeadline = time.Time{}
    noCancel   = (chan struct{})(nil)
)
```

声明聚类：
1. 将同一类的变量声明放在一个 var 块中。
2. 将延迟初始化的变量声明放在一个 var 块中。

### 局部变量

```Go
a := 17
f := 3.14
s := "hello, gopher!"

a := int32(17)
f := float32(3.14)
s := []byte("hello, gopher!")
```

对于声明且显式初始化的变量，建议采用短变量声明。

```Go
if as, isASCII := makeASCIISet(chars); isASCII { 
    for i := len(s) - 1; i >= 0; i-- {
        if as.contains(s[i]) {
            return i
        }
    }
    return -1
}
```

尽量在分支控制时，使用短变量声明。