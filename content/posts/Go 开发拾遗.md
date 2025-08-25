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

* 基础类型：int 为 0，bool 为 false，string 为空字符串 ""。
* 复合类型：指针、slice、map、channel、interface、func 的零值为 nil。
* 结构体：所有字段递归初始化为各自的零值。

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


# Go 包 (Package)

包是公共源代码的集合，一个包可以包含多个 go 文件， 每个 go 文件的第一行必须为 `packge [所属包名]`。


```go
// main.go
package main

import "fmt"

func main() {
    fmt.Println("hi")
}
```

```go
// helper.go
package main

import "fmt"

func helper() {
    fmt.Println("helper")
}
```

包分为可执行包 (Executable Package) 和可重用包 (Reusable Package)。

可执行包就是 main 包，main 包是一个特殊的包，可以被编译和执行，<mark>必须包含一个 main 函数</mark>。

可重用包可以定义一个可以被用作依赖的包，当编译可重用包的时候什么都不会输出。

使用 import 语句可以导入其他包。

# 字符串

## 不可变


```go
var s string = "hello"
s[0] = 'k'   // 错误：字符串的内容是不可改变的
s = "gopher" // ok
```

Go 中，不能改变字符串的内容，无需担心并发问题。

## Raw String

可以通过反引号支持『所见即所得』的原始字符串 (Raw String)

```Go
var s string = `         ,_---~~~~~----._
    _,,_,*^____      _____*g*\"*,--,
   / __/ /'     ^.  /      \ ^@q   f
  [  @f | @))    |  | @))   l  0 _/
   \/   \~____ / __ \_____/     \
    |           _l__l_           I
    }          [______]           I
    ]            | | |            |
    ]             ~ ~             |
    |                            |
     |                           |`
fmt.Println(s)
```

## 使用 Unicode 字符集

Go 源文件默认使用 Unicode 字符集。

Go 字符串中的每个字符都是一个 Unicode 字符，这些 Unicode 字符是以 UTF-8 编码存储在内存中。

## rune 类型与码点

Go 使用 rune 来表示一个 Unicode 码点，本质上是 int32 类型的别名。

```go
// $GOROOT/src/builtin.go
type rune = int32
```

一般使用单引号括起来的字符字面值来初始化 rune 变量。

```go
var a rune = 'a' 
```

## 下标操作

```Go
var s = "中国人"
fmt.Printf("0x%x\n", s[0]) // 0xe4：字符“中” utf-8编码的第一个字节
```

通过下标操作，获取到的是第一个字节，而不是字符。

通过 `len(s)` 获取到的也是字节数量。

## 字符迭代

```Go
var s = "中国人"

for i, v := range s {
    fmt.Printf("index: %d, value: 0x%x\n", i, v)
} 
```

通过 for range 迭代，得到的是码点，以及该字符在字符串中的偏移值。

## 拼接字符串

```Go
s := "Rob Pike, "
s = s + "Robert Griesemer, "
s += " Ken Thompson"

fmt.Println(s) // Rob Pike, Robert Griesemer, Ken Thompson
```

支持通过 + 和 += 拼接字符串

# 常量


## 常量声明

```Go
const Pi float64 = 3.14159265358979323846 // 单行常量声明

// 以const代码块形式声明常量
const (
    size int64 = 4096
    i, j, s = 13, 14, "bar" // 单行声明多个常量
)
```

Go 通过 const 关键字声明常量。

> 注意：Go 常量的类型只局限于 Go 基本数据类型

## 无类型常量

在 Go 中，即使两个类型的底层类型是一样的，它们仍然是不同的数据类型，不可以被互相比较或者混在一个表达式中进行运算。

```Go
type myInt int
const n myInt = 13
const m int = n + 5 // 编译器报错：cannot use n + 5 (type myInt) as type int in const initializer

func main() {
    var a int = 5
    fmt.Println(a + n) // 编译器报错：invalid operation: a + n (mismatched types int and myInt)
}
```

```Go
type myInt int
const n = 13

func main() {
    var a myInt = 5
    fmt.Println(a + n)  // 输出：18
}
```

对于无类型的常量参与的表达式求值，Go 编译器会根据上下文中的类型信息把无类型常量自动转换为相应的类型，再参与求值计算，该操作是隐式进行的。

## 枚举

Go 语言没有原生提供枚举类型，但是可以通过 const 代码定义的常量集合来实现枚举。

```Go
const (
    Apple, Banana = 11, 22
    Strawberry, Grape 
    Pear, Watermelon 
)
```

```Go
const (
    Apple, Banana = 11, 22
    Strawberry, Grape  = 11, 22 // 使用上一行的初始化表达式
    Pear, Watermelon  = 11, 22 // 使用上一行的初始化表达式
)
```

Go 的 const 语法会隐式重复前一个非空表达式，所以上面两段代码是等价的。

```Go
// $GOROOT/src/sync/mutex.go 
const ( 
    mutexLocked = 1 << iota  // 1
    mutexWoken   // 2
    mutexStarving  // 4
    mutexWaiterShift = iota // 3
    starvationThresholdNs = 1e6 // 1e6
)
```

iota 是 Go 语言的一个预定义标识符，表示的是 const 声明块中么个常量所处位置在块中的声明值(从 0 开始)


# 数组

Go 中的数组是一个长度固定的，由同构类型元素组成的连续序列。

```Go
var arr [N]T
```

上面声明了一个数组变量 arr，它的类型为 [N]T，元素的类型是 T，数组长度为 N。

数组的长度需要在声明数组变量时提供，Go 编译器需要再编译阶段就知道数组类型的长度。

如果两个数组类型的元素类型 T 和数组长度 N 都是一样的，那么这两个数组是等价的。

```Go
var mArr [2][3][4]int
```

可以定义多维数组。

数组类型变量是一个整体，一整个数组变量表示的是整个数组，无论是迭代还是作为实际参数传给一个函数/方法，Go 传递数组都是使用值拷贝。

# if 语句

```Go
if runtime.GOOS == "linux" {
    println("we are on linux os")    
}
```
if 语句的布尔表达式不需要括号包裹，后面的表达式的求值结果也必须是布尔类型。

```Go
func main() {
    if a, c := f(), h(); a > 0 {
        println(a)
    } else if b := f(); b > 0 {
        println(a, b)
    } else {
        println(a, b, c)
    }
}
```

可以在 if 后的布尔表达式前，进行变量的声明，在 if 布尔表达式前声明的变量，被叫做 if 语句的的自用变量。

# Switch 语句

## 基础结构

```go
switch initStmt; expr {
    case expr1:
        // 执行分支1
    case expr2:
        // 执行分支2
    case expr3_1, expr3_2, expr3_3:
        // 执行分支3
    case expr4:
        // 执行分支4
    ... ...
    case exprN:
        // 执行分支N
    default: 
        // 执行默认分支
}
```

```go
func readByExtBySwitch(ext string) {
    switch ext {
    case "json":
        println("read json file")
    case "jpg", "jpeg", "png", "gif":
        println("read image file")
    case "txt", "md":
        println("read text file")
    case "yml", "yaml":
        println("read yaml file")
    case "ini":
        println("read ini file")
    default:
        println("unsupported file extension:", ext)
    }
}
```

## type switch


```Go
func main() {
    var x interface{} = 13
    switch x.(type) {
    case nil:
        println("x is nil")
    case int:
        println("the type of x is int")
    case string:
        println("the type of x is string")
    case bool:
        println("the type of x is string")
    default:
        println("don't support the type")
    }
}
```

switch 关键字后跟着的表达式为 x.(type) ，这种表达式类型是 switch 语句特有的，只能在 switch 语句中使用。

表达式中的 x 必须是一个接口类型变量，表达式的求值结果是这个接口类型变量对应的动态类型。

```Go
func main() {
    var x interface{} = 13
    switch v := x.(type) {
    case nil:
        println("v is nil")
    case int:
        println("the type of v is int, v =", v)
    case string:
        println("the type of v is string, v =", v)
    case bool:
        println("the type of v is bool, v =", v)
    default:
        println("don't support the type")
    }
}
```

可以通过 v:=x.(type) 获取类型对应的值信息，注意 v 存储的不是类型信息，而是变量 x 的动态类型对应的值信息。




# for 循环

```Go
var sum int
for i := 0; i < 10; i++ {
    sum += i
}
println(sum)
```

```Go
for i, j, k := 0, 1, 2; (i < 20) && (j < 10) && (k < 30); i, j, k = i+1, j+1, k+5 {
    sum += (i + j + k)
    println(sum)
}
```

Go 语言的 for 循环支持声明多循环变量，可以应用在循环体以及判断条件中。

```Go
i := 0
for i < 10 {
    println(i)
    i++
}  
```

可以仅保留条件表达式，这样就等价于 while 

```Go
for { 
   // 循环体代码
}
```

无限循环可以省略表达式。

```Go
for i, v := range sl {
    fmt.Printf("sl[%d] = %d\n", i, v)
}
```
for-range 可以变量切片的元素。


# 切片

```Go
var nums = []int{1, 2, 3, 4, 5, 6}
fmt.Println(len(nums)) // 6
```

切片声明不需要传入长度属性，切片的长度不是固定的，而是随着切片中元素个数的变化而变化的，可以通过 len 获取切片的长度。


```Go
nums = append(nums, 7) // 切片变为[1 2 3 4 5 6 7]
fmt.Println(len(nums)) // 7
```

可以通过 append 函数，向切片中动态添加元素。

```Go
var s []int // s 是 nil 切片
s = append(s, 1, 2, 3) // 无需提前分配空间
```

nil 切片可以安全调用 append 方法动态扩展。


```Go
sl := make([]byte, 6, 10) // 其中10为cap值，即底层数组长度，6为切片的初始长度
sl := make([]byte, 6) // cap = len = 6
```

可以通过 make 函数来创建切片，并指定底层数组的长度。

```Go
arr := [10]int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
sl := arr[3:7:9]
```
可以基于 `array[low:high:max]` 从数组或者已有的切片中创建切片。

起始元素是 low，长度是 high - low，容量是 max - low。

# map 类型


## 声明

map 类型用来表示一组无序的键值对。

```Go
map[string]string // key与value元素的类型相同
map[int]string    // key与value元素的类型不同
```

> 注意：函数类型、map 类型自身、切片类型不能作为 map 的 key 类型。

```Go
var m map[string]int // 一个map[string]int类型的变量
```

## 初始化

map 无法零值可用，因此直接对 map 进行操作，会触发 panic。

```Go
var m map[string]int // m = nil
m["key"] = 1         // 发生运行时异常：panic: assignment to entry in nil map
```

```Go
m := map[int]string{}
m1 := map[int][]string{
    1: []string{"val1_1", "val1_2"},
    3: []string{"val3_1", "val3_2", "val3_3"},
    7: []string{"val7_1"},
}

type Position struct { 
    x float64 
    y float64
}

m2 := map[Position]string{
    Position{29.935523, 52.568915}: "school",
    Position{25.352594, 113.304361}: "shopping-mall",
    Position{73.224455, 111.804306}: "hospital",
}
m1 := make(map[int]string) // 未指定初始容量
m2 := make(map[int]string, 8) // 指定初始容量为8
```

通过复合字面值或者 make 函数可以初始化 map。

## 插入新键值对

```Go
m := make(map[int]string)
m[1] = "value1"
m[2] = "value2"
m[3] = "value3"
```

## 获取键值对数量

```Go
m := map[string]int {
  "key1" : 1,
  "key2" : 2,
}

fmt.Println(len(m)) // 2
m["key3"] = 3  
fmt.Println(len(m)) // 3
```

## 查找和数据读取

```Go
m := make(map[string]int)
v, ok := m["key1"]
if !ok {
    // "key1"不在map中
}

// "key1"在map中，v将被赋予"key1"键对应的value
```

通过 comma ok 语法，进行对 key 的查询。

## 删除数据

```Go
m := map[string]int {
  "key1" : 1,
  "key2" : 2,
}

fmt.Println(m) // map[key1:1 key2:2]
delete(m, "key2") // 删除"key2"
fmt.Println(m) // map[key1:1]
```

如果 key 不存在，delete 也不会抛出异常。

## 遍历键值对

```Go
m := map[int]int{
    1: 11,
    2: 12,
    3: 13,
}

fmt.Printf("{ ")
for k, v := range m {
    fmt.Printf("[%d, %d] ", k, v)
}
fmt.Printf("}\n")
```

```Go
for k, _ := range m { 
  // 使用k
  
}
for k := range m {
  // 使用k
}
```

只关心键的话，使用上面的方式进行迭代。

```Go
for _, v := range m {
  // 使用v
}
```

> 注意，Go 语言中对于 map 类型的顺序是随机的，不能依赖遍历 map 得到的元素次序。

# 函数

## 函数组成

```Go
//关键字 函数名  参数列表                                      返回值列表
func Fprintf(w io.Writer, format string, a ...interface{}) (n int, err error) {
    // 函数体
    p := newPrinter()
    p.doPrintf(format, a)
    n, err = w.Write(p.buf)
    p.free()
    return
}
```

## 函数变量声明

```Go
// 变量名 = 函数类型
var Fprintf = func(w io.Writer, format string, a ...interface{}) (n int, err error) {
}
```

声明一个类型为函数类型的变量。

函数声明中的函数名就是变量名，函数声明中的 func 关键字、参数列表和返回值列表共同构成了函数类型。

参数列表和返回值列表的组合被称为函数签名，函数类型也可以看作是 func 关键字 + 函数签名组成。

```Go
func(io.Writer, string, ...interface{}) (int, error)
```

在表述函数类型时，也会省略函数签名参数列表中的参数名，以及返回值列表中的返回值变量名。

每个函数声明所定义的函数，仅仅是对于函数类型的一个实例。

```Go
f := func(){}
```

func(){} 被称为函数字面值，函数字面值由函数类型与函数体组成，也叫做匿名函数。

## 函数参数

参数列表中的参数叫做形式参数，函数调用实际传入的参数叫做实际参数。

Go 中，函数参数传递采用的是值传递，就是将实际参数在内存中的表示逐位拷贝到形式参数中。

```Go
func myAppend(sl []int, elems ...int) []int {
    fmt.Printf("%T\n", elems) // []int
    if len(elems) == 0 {
        println("no elems to append")
        return sl
    }

    sl = append(sl, elems...)
    return sl
}

func main() {
    sl := []int{1, 2, 3}
    sl = myAppend(sl) // no elems to append
    fmt.Println(sl) // [1 2 3]
    sl = myAppend(sl, 4, 5, 6)
    fmt.Println(sl) // [1 2 3 4 5 6]
}
```

变长参数通过切片来实现，可以使用切片支持的所有操作来操作变长参数。

## 多返回值

```Go
func foo()                       // 无返回值
func foo() error                 // 仅有一个返回值
func foo() (int, string, error)  // 有2或2个以上返回值
```

如果一个函数仅有一个返回值，那么不需要用括号括起来，否则需要。

```Go
// $GOROOT/src/time/format.go
func parseNanoseconds(value string, nbytes int) (ns int, rangeErrString string, err error) {
    if !commaOrPeriod(value[0]) {
        err = errBad
        return
    }
    if ns, err = atoi(value[1:nbytes]); err != nil {
        return
    }
    if ns < 0 || 1e9 <= ns {
        rangeErrString = "fractional second"
        return
    }

    scaleDigits := 10 - nbytes
    for i := 0; i < scaleDigits; i++ {
        ns *= 10
    }
    return
}
```

在返回值个数较多时，可以使用具名返回值让函数可读性更好。

## 函数是一等公民

如果一门编程语言对某种语言元素的创建和使用没有限制，我们可以像对待值一样对待这种元素，那么就称之为一等公民。

拥有一等公民待遇的语法元素可以存储在变量中，可以作为参数传递给函数，可以在函数内部创建并可以作为返回值从函数返回。

## 函数转型

```Go
func greeting(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Welcome, Gopher!\n")
}                    

func main() {
    http.ListenAndServe(":8080", http.HandlerFunc(greeting))
}
```

```Go
// $GOROOT/src/net/http/server.go
func ListenAndServe(addr string, handler Handler) error {
    server := &Server{Addr: addr, Handler: handler}
    return server.ListenAndServe()
}
```

```Go
// $GOROOT/src/net/http/server.go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

```Go
// $GOROOT/src/net/http/server.go

type HandlerFunc func(ResponseWriter, *Request)

// ServeHTTP calls f(w, r).
func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) {
    f(w, r)
}
```

HandlerFunc 是一个基于函数类型定义的新类型，它的底层类型为函数类型 `func(ResponseWriter, *Request)`。这个类型有一个方法 ServeHTTP，实现了 Handler 接口。

`http.HandlerFunc(greeting)` 可以将函数 greeting 显式转换为 HandlerFunc 类型，后者实现了 Handler 接口。


## 闭包

Go 闭包是在函数内部创建的匿名函数，匿名函数可以访问创建它的函数的参数与局部变量。

```Go
func partialTimes(x int) func(int) int {
  return func(y int) int {
    return times(x, y)
  }
}
```

```Go
timesTwo = func(y int) int {
    return times(2, y)
}
```

```Go
func main() {
  timesTwo := partialTimes(2)   // 以高频乘数2为固定乘数的乘法函数
  timesThree := partialTimes(3) // 以高频乘数3为固定乘数的乘法函数
  timesFour := partialTimes(4)  // 以高频乘数4为固定乘数的乘法函数
  fmt.Println(timesTwo(5))   // 10，等价于times(2, 5)
  fmt.Println(timesTwo(6))   // 12，等价于times(2, 6)
  fmt.Println(timesThree(5)) // 15，等价于times(3, 5)
  fmt.Println(timesThree(6)) // 18，等价于times(3, 6)
  fmt.Println(timesFour(5))  // 20，等价于times(4, 5)
  fmt.Println(timesFour(6))  // 24，等价于times(4, 6)
}
```

# 错误处理

## error 类型

```Go
// $GOROOT/src/builtin/builtin.go
type error interface {
    Error() string
}
```

error 接口是 Go 元素内置的类型，任何实现了 error 的 Error 方法的类型的实例，都可以作为错误值赋值给 error 接口变量。

```Go
err := errors.New("your first demo error")
errWithCtx = fmt.Errorf("index %d is out of bounds", i)
```

可以通过 `errors.New` 和 `fmt.Errorof` 来方便构造错误值。

```Go
// $GOROOT/src/errors/errors.go

type errorString struct {
    s string
}

func (e *errorString) Error() string {
    return e.s
}
```

```Go
// $GOROOT/src/net/net.go
type OpError struct {
    Op string
    Net string
    Source Addr
    Addr Addr
    Err error
}
// $GOROOT/src/net/http/server.go
func isCommonNetReadError(err error) bool {
    if err == io.EOF {
        return true
    }
    if neterr, ok := err.(net.Error); ok && neterr.Timeout() {
        return true
    }
    if oe, ok := err.(*net.OpError); ok && oe.Op == "read" {
        return true
    }
    return false
}
```

可以通过自定义错误类型来从错误值中取出更多信息。

## 透明错误处理

错误处理策略，就是根据函数/方法返回的 error 类型变量中携带的错误值信息做决策，并选择后续代码执行路径。

透明错误处理，就是不关心返回错误值携带的具体上下文信息，只要发生错误就进入唯一的错误处理执行路径。

```Go
err := doSomething()
if err != nil {
    // 不关心err变量底层错误值所携带的具体上下文信息
    // 执行简单错误处理逻辑并返回
    ... ...
    return err
}
```

## 哨兵错误处理

```Go
// $GOROOT/src/bufio/bufio.go
var (
    ErrInvalidUnreadByte = errors.New("bufio: invalid use of UnreadByte")
    ErrInvalidUnreadRune = errors.New("bufio: invalid use of UnreadRune")
    ErrBufferFull        = errors.New("bufio: buffer full")
    ErrNegativeCount     = errors.New("bufio: negative count")
)

data, err := b.Peek(1)
if err != nil {
    switch err {
    case bufio.ErrNegativeCount:
        // ... ...
        return
    case bufio.ErrBufferFull:
        // ... ...
        return
    case bufio.ErrInvalidUnreadByte:
        // ... ...
        return
    default:
        // ... ...
        return
    }
}
```

可以通过 errors.Is 方法沿着包装错误所在的错误链，与链上所有被包装的错误进行比较，直到找到一个匹配的错误。

```Go
var ErrSentinel = errors.New("the underlying sentinel error")

func main() {
  err1 := fmt.Errorf("wrap sentinel: %w", ErrSentinel)
  err2 := fmt.Errorf("wrap err1: %w", err1)
    println(err2 == ErrSentinel) //false
  if errors.Is(err2, ErrSentinel) {
    println("err2 is ErrSentinel")
    return
  }

  println("err2 is not ErrSentinel")
}
```

## 错误值类型检视

```Go
// $GOROOT/src/encoding/json/decode.go
func (d *decodeState) addErrorContext(err error) error {
    if d.errorContext.Struct != nil || len(d.errorContext.FieldStack) > 0 {
        switch err := err.(type) {
        case *UnmarshalTypeError:
            err.Struct = d.errorContext.Struct.Name()
            err.Field = strings.Join(d.errorContext.FieldStack, ".")
            return err
        }
    }
    return err
}
```

## panic 处理

```Go
func foo() {
    println("call foo")
    bar()
    println("exit foo")
}

func bar() {
    println("call bar")
    panic("panic occurs in bar")
    zoo()
    println("exit bar")
}

func zoo() {
    println("call zoo")
    println("exit zoo")
}

func main() {
    println("call main")
    foo()
    println("exit main")
}
```

```shell
call main
call foo
call bar
panic: panic occurs in bar
```

```Go
func bar() {
    defer func() {
        if e := recover(); e != nil {
            fmt.Println("recover the panic:", e)
        }
    }()

    println("call bar")
    panic("panic occurs in bar")
    zoo()
    println("exit bar")
}
```

可以通过 recover 函数来捕捉 panic 并恢复程序正常执行，recover 函数只能放在 defer 函数中才能生效。

注意：无论哪个 Goroutine 中发生未被捕获的 panic，整个程序都会退出。

# 方法

## Go 方法声明

```Go
// 关键字 receiver  方法名             参数列表                   返回值列表
func (srv *Server) ListenAndServeTLS(certFile, keyFile string) error {
    // 方法体
    if srv.shuttingDown() {
        return ErrServerClosed
    }
    // ...
}
```

Go 中的方法必须归属于一个类型，receiver 参数的类型就是这个方法归属的类型，这个方法就是这个类型的一个方法。

上面的 ListenAndServeTLS 就是 *Server 类型的方法，而不是 Server 类型的方法。

```Go
type MyInt *int
func (r MyInt) String() string { // r的基类型为MyInt，编译器报错：invalid receiver type MyInt (MyInt is a pointer type)
    return fmt.Sprintf("%d", *(*int)(r))
}

type MyReader io.Reader
func (r MyReader) Read(p []byte) (int, error) { // r的基类型为MyReader，编译器报错：invalid receiver type MyReader (MyReader is an interface type)
    return r.Read(p)
}
```

Receiver 参数的基类型不能为指针类型或者接口类型。

方法声明要和 receiver 参数的基类型声明放在同一个包中，因此：
* 不能为原生类型添加方法
```Go
func (i int) Foo() string { // 编译器报错：cannot define new methods on non-local type int
    return fmt.Sprintf("%d", i) 
}
```
* 不能跨越包为其他包的类型声明新方法
```Go
import "net/http"

func (s http.Server) Foo() { // 编译器报错：cannot define new methods on non-local type http.Server
}
```

## 调用方法

```Go
type T struct{}

func (t T) M(n int) {
}

func main() {
    var t T
    t.M(1) // 通过类型T的变量实例调用方法M

    p := &T{}
    p.M(2) // 通过类型*T的变量实例调用方法M
}
```

可以通过 *T 或者 T 的变量实例调用方法。

## 方法本质

Go 编译器会将 receiver 参数以第一个参数的身份并入到方法的参数列表中。

```Go
type T struct { 
    a int
}

func (t T) Get() int {  
    return t.a 
}

func (t *T) Set(a int) int { 
    t.a = a 
    return t.a 
}

// 类型T的方法Get的等价函数
func Get(t T) int {  
    return t.a 
}

// 类型*T的方法Set的等价函数
func Set(t *T, a int) int { 
    t.a = a 
    return t.a 
}
```

```Go
var t T
T.Get(t)
(*T).Set(&t, 1)
```

直接以类型名调用方法的表达方式，被称为 Method Expression，通过 Method Express，类型 T 只能调用 T 的方法集合中的方法，类型 *T 也只能调用 *T 的方法集合中的方法。

可以将方法作为右值，赋值给函数类型的变量。

```Go
func main() {
    var t T
    f1 := (*T).Set // f1的类型，也是*T类型Set方法的类型：func (t *T, int)int
    f2 := T.Get    // f2的类型，也是T类型Get方法的类型：func(t T)int
    fmt.Printf("the type of f1 is %T\n", f1) // the type of f1 is func(*main.T, int) int
    fmt.Printf("the type of f2 is %T\n", f2) // the type of f2 is func(main.T) int
    f1(&t, 3)
    fmt.Println(f2(t)) // 3
}
```

## 方法集合

Go 任何一个类型都有属于自己的方法集合，方法集合是 Go 类型的一个属性。

方法集合是判断一个类型是否实现了某个接口类型的唯一手段。

```Go
func dumpMethodSet(i interface{}) {
    dynTyp := reflect.TypeOf(i)

    if dynTyp == nil {
        fmt.Printf("there is no dynamic type\n")
        return
    }

    n := dynTyp.NumMethod()
    if n == 0 {
        fmt.Printf("%s's method set is empty!\n", dynTyp)
        return
    }

    fmt.Printf("%s's method set:\n", dynTyp)
    for j := 0; j < n; j++ {
        fmt.Println("-", dynTyp.Method(j).Name)
    }
    fmt.Printf("\n")
}
```

```Go
type T struct{}

func (T) M1() {}
func (T) M2() {}

func (*T) M3() {}
func (*T) M4() {}

func main() {
    var n int
    dumpMethodSet(n)
    dumpMethodSet(&n)

    var t T
    dumpMethodSet(t)
    dumpMethodSet(&t)
}
```

```shell
int's method set is empty!
*int's method set is empty!
main.T's method set:
- M1
- M2

*main.T's method set:
- M1
- M2
- M3
- M4
```

*T 类型的方法集合包含所有以 *T 为 receiver 参数类型的方法，以及所有以 T 为 receiver 参数类型的方法。

如果某个类型 T 的方法集合与接口类型的犯法集合相同，或者类型 T 的方法集合是接口类型 I 方法集合的超集，那么就说类型 T 实现了接口 I。

# 指针

## 指针类型

指针类型依托于某一个类型而存在，例如 int 就是 *int 指针类型的基类型。

如果拥有一个类型 T，那么以 T 作为基类型的指针类型为 *T。

## 指针类型赋值

```Go
var a int = 13
var p *int = &a  // 给整型指针变量p赋初值
```


# 结构体

## 定义新类型

```Go
type T S // 定义一个新类型T
```

```Go
type T1 int 
type T2 T1  
```

```Go
type T1 int
type T2 T1
type T3 string

func main() {
    var n1 T1
    var n2 T2 = 5
    n1 = T1(n2)  // ok
    
    var s T3 = "hello"
    n1 = T1(s) // 错误：cannot convert s (type T3) to type T1
}
```

如果一个新类型是基于某个 Go 原生类型定义的，那么这个 Go 的原生类型就是新类型的底层类型。

底层类型相同的两个类型，它们的变量可以通过显式转型进行相互赋值。


## 类型别名

```Go
type T = S // type alias
type T = string 
  
var s string = "hello" 
var t T = s // ok
fmt.Printf("%T\n", t) // string
```

类型别名没有定义类型，T 和 S 仍然是同种类型。

## 结构体类型定义

```Go
type T struct {
    Field1 T1
    Field2 T2
    ... ...
    FieldN Tn
}
```

```Go
package book

type Book struct {
     Title string              // 书名
     Pages int                 // 书的页数
     Indexes map[string]int    // 书的索引
}
```

## 定义空结构体

```Go
type Empty struct{} // Empty是一个不包含任何字段的空结构体类型
```

## 使用其他结构体作为自定义结构体中的类型

```Go
type Person struct {
    Name string
    Phone string
    Addr string
}

type Book struct {
    Title string
    Author Person
    ... ...
}
```

```Go
var book Book 
println(book.Author.Phone)
```


```Go
type Book struct {
    Title string
    Person
    ... ...
}
```

对于包含结构体类型字段的结构体来说，可以无需提供字段名字，只要使用其类型即可，这种被称为嵌入字段。

```Go
var book Book 
println(book.Person.Phone) // 将类型名当作嵌入字段的名字
println(book.Phone)        // 支持直接访问嵌入字段所属类型中字段
```


## 结构体初始化

```Go
var t = T{
    F2: "hello",
    F1: 11,
    F4: 14,
}
```


推荐使用 `field:value` 形式的复合字面值，进行显式初始化。

# 类型嵌入

类型嵌入是指在一个类型的定义中嵌入了其他类型。

## 接口类型的类型嵌入

接口类型声明了由一个方法集合代表的接口。

```Go
type E interface {
    M1()
    M2()
}
```
```Go
type I interface {
    E
    M3()
}
```

## 结构体类型的嵌入

```Go
type MyInt int

func (n *MyInt) Add(m int) {
    *n = *n + MyInt(m)
}

type t struct {
    a int
    b int
}

type S struct {
    *MyInt
    t
    io.Reader
    s string
    n int
}

func main() {
    m := MyInt(17)
    r := strings.NewReader("hello, go")
    s := S{
        MyInt: &m,
        t: t{
            a: 1,
            b: 2,
        },
        Reader: r,
        s:      "demo",
    }

    var sl = make([]byte, len("hello, go"))
    s.Reader.Read(sl)
    fmt.Println(string(sl)) // hello, go
    s.MyInt.Add(5)
    fmt.Println(*(s.MyInt)) // 22
}
```




# Context

Context 用于在并发编程中传递上下文信息，用来解决 goroutine 之间的协作和控制问题。

## 取消操作

```Go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// 启动一个可被取消的 goroutine
	ctx, cancel := context.WithCancel(context.Background())
	go func(ctx context.Context) {
		for {
			select {
			case <-ctx.Done(): // 收到取消信号
				fmt.Println("任务被取消，退出")
				return
			default:
			}
		}
	}(ctx)

	// 主动取消（如用户触发）
	cancel()
	time.Sleep(3 * time.Second)
}
```


## 设置超时时间

```Go
// 设置 3 秒超时
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

// 模拟一个耗时操作
go func(ctx context.Context) {
    time.Sleep(5 * time.Second) // 超过超时时间
    select {
    case <-ctx.Done():
        fmt.Println("操作超时被取消") // 会执行此分支
    default:
        fmt.Println("操作完成")
    }
}(ctx)
```

## 传递请求的元数据

```Go
// 传递用户 ID
ctx := context.WithValue(context.Background(), "userID", 123)

// 在下游函数中获取
func handle(ctx context.Context) {
    userID := ctx.Value("userID").(int)
    fmt.Printf("处理用户 %d 的请求\n", userID)
}
```

# Goroutine


## 基本用法

```Go
go fmt.Println("I am a goroutine")

var c = make(chan int)
go func(a, b int) {
    c <- a + b
}(3,4)
 
// $GOROOT/src/net/http/server.go
c := srv.newConn(rw)
go c.serve(connCtx)
```

通过 go 关键字 + 函数/方法的方式创造一个 goroutine

## Goroutine 通信

CSP 并发模型：输入输出应该是基本的编程原语，数据处理逻辑 P 只需要调用原语获取数据，顺序处理数据，将结果数据通过输出原语输出即可。

一个符合 CSP 模型的并发程序应该是一组通过输入输出原语连接起来的 P 的集合。

在 Go 中，与 Process 对应的是 goroutine，同时引入了 channel，goroutine 可以从 channel 获取输入数据，再将处理后得到的结果数据通过 channel 输出。


```Go
func spawn(f func() error) <-chan error {
    c := make(chan error)

    go func() {
        c <- f()
    }()

    return c
}

func main() {
    c := spawn(func() error {
        time.Sleep(2 * time.Second)
        return errors.New("timeout")
    })
    fmt.Println(<-c)
}
```

## Channel 是一等公民

Channel 是一等公民，意味着可以像使用普通变量一样使用 channel。

## 创建 Channel


```Go
var ch chan int
```

## 给 channel 赋初值

```Go
ch1 := make(chan int)   
ch2 := make(chan int, 5) 
```

第一个创建了一个无缓冲的 channel，第二个创建了一个待缓冲的 channel

## 发送和接收 Channel

```Go
ch1 <- 13    // 将整型字面值13发送到无缓冲channel类型变量ch1中
n := <- ch1  // 从无缓冲channel类型变量ch1中接收一个整型值存储到整型变量n中
ch2 <- 17    // 将整型字面值17发送到带缓冲channel类型变量ch2中
m := <- ch2  // 从带缓冲channel类型变量ch2中接收一个整型值存储到整型变量m中
```

channel 是用于 Goroutine 间通信，绝大多数对 Channel 的读写都被分别放在了不同的 Goroutine 中。

Goroutine 对于无缓冲 channel 的接收和发送操作是同步的，只有对它进行接收操作的 Goroutine 和对它进行发送操作的 Goroutine 都存在的情况下，通信才能得以进行。

```Go
func main() {
    ch1 := make(chan int)
    ch1 <- 13 // fatal error: all goroutines are asleep - deadlock!
    n := <-ch1
    println(n)
}
```

对于带缓冲 channel 的发送操作在缓冲区未满，接收操作在缓冲区非空的情况下是异步的。

```Go
ch2 := make(chan int, 1)
n := <-ch2 // 由于此时ch2的缓冲区中无数据，因此对其进行接收操作将导致goroutine挂起

ch3 := make(chan int, 1)
ch3 <- 17  // 向ch3发送一个整型数17
ch3 <- 27  // 由于此时ch3中缓冲区已满，再向ch3发送数据也将导致goroutine挂起
```

可以通过 <- 来声明只发送 channel 类型和只接收 channel 类型。

```Go
ch1 := make(chan<- int, 1) // 只发送channel类型
ch2 := make(<-chan int, 1) // 只接收channel类型

<-ch1       // invalid operation: <-ch1 (receive from send-only type chan<- int)
ch2 <- 13   // invalid operation: ch2 <- 13 (send to receive-only type <-chan int)
```

## 关闭 Channel

调用 Go 内置的 close 函数关闭了 channel，channel 关闭后，所有等待从这个 channel 接收数据的操作都返回。


```Go
n := <- ch      // 当ch被关闭后，n将被赋值为ch元素类型的零值
m, ok := <-ch   // 当ch被关闭后，m将被赋值为ch元素类型的零值, ok值为false
for v := range ch { // 当ch被关闭后，for range循环结束
    ... ...
}
```

## select 原语

通过 select，可以同时在多个 channel 上进行发送/接收操作：

```Go
select {
case x := <-ch1:     // 从channel ch1接收数据
  ... ...

case y, ok := <-ch2: // 从channel ch2接收数据，并根据ok值判断ch2是否已经关闭
  ... ...

case ch3 <- z:       // 将z值发送到channel ch3中:
  ... ...

default:             // 当上面case中的channel通信均无法实施时，执行该默认分支
}
```

# Reflect

reflect 围绕两个基础类型展开，对应类型信息和值信息。

`reflect.Type` 表示 Go 中静态类型的元信息，包括类型名称、种类、方法、字段等属性，通过 `reflect.TypeOf(x)` 获取。

`reflect.Value` 表示变量的动态值信息，提供了读取和修改值的方法，通过 `relect.ValueOf(x)` 获取。

`Kind` 类型表示类型的底层种类，例如 int、struct、slice 等，`Type` 则区分具体类型，例如自定义类型。

```Go
package main

import (
	"fmt"
	"reflect"
)

type User struct {
	Name string
	Age  int
}

func main() {
	u := User{"Alice", 30}
	t := reflect.TypeOf(u)

	// 类型名称与种类
	fmt.Println("类型名:", t.Name())   // 输出: User
	fmt.Println("底层种类:", t.Kind()) // 输出: struct

	// 结构体字段信息
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		fmt.Printf("字段名: %s, 类型: %s\n", field.Name, field.Type)
	}
	// 输出:
	// 字段名: Name, 类型: string
	// 字段名: Age, 类型: int
}
```

```Go
func main() {
	num := 42
	v := reflect.ValueOf(&num).Elem() // 传入指针并解引用，确保可修改

	// 读取值
	fmt.Println("当前值:", v.Int()) // 输出: 42

	// 修改值（需确保类型匹配）
	if v.CanSet() { // 检查是否可修改
		v.SetInt(100)
		fmt.Println("修改后:", num) // 输出: 100
	}
}
```

```Go
type Calculator struct{}

func (c Calculator) Add(a, b int) int {
	return a + b
}

func main() {
	c := Calculator{}
	v := reflect.ValueOf(c)

	// 获取方法（注意：方法名首字母需大写，否则不可导出）
	method := v.MethodByName("Add")
	if !method.IsValid() {
		fmt.Println("方法不存在")
		return
	}

	// 准备参数（需包装为[]reflect.Value）
	args := []reflect.Value{
		reflect.ValueOf(10),
		reflect.ValueOf(20),
	}

	// 调用方法并获取返回值
	results := method.Call(args)
	fmt.Println("结果:", results[0].Int()) // 输出: 30
}
```


# 泛型

## 类型参数

```Go
// max_generics.go
type ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
        ~float32 | ~float64 |
        ~string
}

func maxGenerics[T ordered](sl []T) T {
    if len(sl) == 0 {
        panic("slice is empty")
    }

    max := sl[0]
    for _, v := range sl[1:] {
        if v > max {
            max = v
        }
    }
    return max
}

type myString string

func main() {
    var m int = maxGenerics([]int{1, 2, -4, -6, 7, 0})
    fmt.Println(m) // 输出：7
    fmt.Println(maxGenerics([]string{"11", "22", "44", "66", "77", "10"})) // 输出：77
    fmt.Println(maxGenerics([]float64{1.01, 2.02, 3.03, 5.05, 7.07, 0.01})) // 输出：7.07
    fmt.Println(maxGenerics([]int8{1, 2, -4, -6, 7, 0})) // 输出：7
    fmt.Println(maxGenerics([]myString{"11", "22", "44", "66", "77", "10"})) // 输出：77
}
```

maxGenerics 函数原型多出的代码 [T ordered] 就是 Go 泛型的类型参数列表，这个列表中仅有一个类型参数 T，ordered 为类型参数的类型约束。

函数的类型参数列表位于函数名与参数列表之间，由方括号括起来的固定个数的，由逗号分隔的类型参数声明组成。

```Go
func genericsFunc[T1 constraint1, T2, constraint2, ..., Tn constraintN](ordinary parameters list) (return values list)
```

类型参数通常用大写，且必须是具名的。

```Go
func print[T any]() { // 正确
}     

func print[any]() {   // 编译错误：all type parameters must be named 
}
```

## 调用泛型函数

```Go
// 泛型函数声明：T为类型形参
func maxGenerics[T ordered](sl []T) T

// 调用泛型函数：int为类型实参
m := maxGenerics[int]([]int{1, 2, -4, -6, 7, 0})
```

## 泛型类型

```Go
// maxable_slice.go

type maxableSlice[T ordered] struct {
    elems []T
}
```

泛型类型是类型声明中带有类型参数的 Go 类型。

## 使用泛型类型

```Go
var sl = maxableSlice[int]{
    elems: []int{1, 2, -4, -6, 7, 0},
} 
```

## 泛型约束

any 是最宽松的约束，本质上是 interface{} 的一个类型别名。

```Go
// $GOROOT/src/builtin/buildin.go
// any is an alias for interface{} and is equivalent to interface{} in all ways.
type any = interface{}
```

## 自定义约束

```Go
// stringify.go

func Stringify[T fmt.Stringer](s []T) (ret []string) {
    for _, v := range s {
        ret = append(ret, v.String())
    }
    return ret
}

type MyString string

func (s MyString) String() string {
    return string(s)
}

func main() {
    sl := Stringify([]MyString{"I", "love", "golang"})
    fmt.Println(sl) // 输出：[I love golang]
}
```


```Go
type ordered interface {
  ~int | ~int8 | ~int16 | ~int32 | ~int64 |
  ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
  ~float32 | ~float64 | ~string
}
```
类型元素信息，代表以它们为底层类型的类型都满足 ordered 约束。

