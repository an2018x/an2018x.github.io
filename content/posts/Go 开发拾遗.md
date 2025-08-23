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