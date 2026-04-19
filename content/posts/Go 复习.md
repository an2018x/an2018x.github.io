---
title: "Go 复习"
date: '2026-04-18'
draft: false
description:  
toc: true
---

# 基础

{{< mind height="860px" >}}
- 基础
    - Go 环境搭建与工具链
        - 安装 Go
            - 官网直接安装
                - 
                ```bash
                # macOS（用 Homebrew）
                brew install go

                # Linux（手动安装）
                wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
                sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
                export PATH=$PATH:/usr/local/go/bin

                # Windows
                # 直接下载 .msi 安装包：https://go.dev/dl/

                # 验证安装
                go version
                # 输出：go version go1.23.0 darwin/arm64
                ```
            - goenv 环境管理
                - 
                ```bash
                # Linux（手动安装）
                wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
                sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
                export PATH=$PATH:/usr/local/go/bin

                # Windows
                # 直接下载 .msi 安装包：https://go.dev/dl/

                # 验证安装
                go version
                # 输出：go version go1.23.0 darwin/arm64
                ```
        - 理解环境变量
            - 常用环境变量
                - 
                ```bash
                # 查看所有 Go 环境变量
                go env

                # 最重要的几个：
                go env GOROOT   # Go 的安装路径（一般不需要改）
                go env GOPATH   # 工作目录，默认 ~/go
                go env GOMODULE # 模块模式（应该是 "on"）
                ```
            - GOPATH vs Go Modules
                - 早期 Go 用 GOPATH 管理所有的代码，所有项目必须放在 $GOPATH/src 下
                - Go 1.11 引入了 Go Modules，可以在任意目录创建项目
                - 现在 Go Modules 是默认模式，不需要关注 GOPATH 了
                - 只需要确认 GO111MODULE=on
            - 设置常用模块
                -
                ```bash
                # 确保模块模式开启
                go env -w GO111MODULE=on

                # 设置国内代理（如果你在中国大陆）
                go env -w GOPROXY=https://goproxy.cn,direct
                ```
        - VsCode 插件
            - Go 官方插件
            - Go Test Exploerer 可视化运行测试
            - Error Lens 行内显示错误信息
        - 核心命令
            - go mod init <模块名> 初始化一个新模块
            - go run main.go 编译并直接运行(不生成二进制)
            - go build 编译生成可执行文件
            - go fmt ./... 格式化代码
            - go test ./... 运行所有测试
            - go get <包名> 添加依赖到当前模块
            - go mod tidy 清理未使用的依赖
            - go vet ./... 静态分析，检查常用错误
            - go doc <包名>
    - 类型系统与变量
        - 基本类型总览
            - Go 是强类型语言，每个类型都有明确的类型，
            - 整数
                - int/uint 平台相关(32 位或 64 位) 最常用
                - int8/int16/int32/int64 指定位数的有符号整数
                - uint8(byte)/uint16/uint32/uint64 无符号整数
            - 浮点数
                - float32 单进度浮点数 (7 位有效数字)
                - float64 双进度浮点数 (15 位有效数字)
            - 其他
                - bool true/false 
                - string UTF-8 编码的不可变字节序列
                - byte uint8 的别名，表示一个字节
                - rune int32 的别名，表示一个 Unicode 码点
            - byte vs rune
                - byte 是一个字节，用于处理原始字节数据
                - rune 是一个 Unicode 码点，用于处理字符
                - 一个中文字符占 3 个 byte，但只是一个 1 rune
                - 遍历字符串，for range 遍历的是 rune，for i 遍历的是 byte
            - 
            ```go
            s := "Hello你好"

            // byte 视角：看到的是字节
            fmt.Println(len(s))        // 11（5个ASCII + 6个中文字节）

            // rune 视角：看到的是字符
            fmt.Println(len([]rune(s))) // 7（5个英文字符 + 2个中文字符）

            // for range 按 rune 遍历
            for i, ch := range s {
                fmt.Printf("索引=%d 字符=%c\n", i, ch)
            }
            // 索引=0 字符=H
            // 索引=1 字符=e
            // ...
            // 索引=5 字符=你   ← 注意索引跳了
            // 索引=8 字符=好
            ```
        - 变量声明的四种方式
            - 核心原则：函数内用 :=，函数外用 var
            - 
            ```go
            // ① var + 类型（最完整的写法）
            var name string = "Gopher"

            // ② var + 类型推断（省略类型）
            var age = 25  // Go 推断为 int

            // ③ 短变量声明（最常用，只能在函数内）
            city := "Tokyo"  // 等价于 var city = "Tokyo"

            // ④ 批量声明（常用于包级别变量）
            var (
                host     = "localhost"
                port     = 8080
                debug    = false
            )
            ```
            - 选用参考
                - 函数内：几乎总是使用 := 短声明，简洁明了
                - 函数外：只能用 var，因为 := 只能在函数内使用
                - 需要显式指定类型时，用 var name Type
                - 声明但是暂不赋值，用var name Type
            - 常见陷阱
                - 短声明的遮蔽
                -
                ```go
                x := 1
                fmt.Println(x)  // 1

                if true {
                    x := 2     // 注意：这是一个新的 x，遮蔽了外层的 x！
                    fmt.Println(x)  // 2
                }
                fmt.Println(x)  // 1 ← 外层的 x 没有变！

                // 正确做法：用 = 而不是 :=
                if true {
                    x = 2      // 修改的是外层的 x
                }
                fmt.Println(x)  // 2
                ```
        - 零值机制
            - Go 没有 undefined、null、None 的概念
            - 每个类型都有一个确定的零值，声明变量时不赋值就是零值
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418230943782.png,200,180)
            -
            ```go
            // 零值是安全的，可以直接使用
            var count int      // 0，可以直接 count++
            var name string    // ""，可以直接 name += "Go"
            var ok bool        // false

            // 但 nil 类型需要初始化后才能使用！
            var m map[string]int   // nil，直接 m["key"] = 1 会 panic！
            m = make(map[string]int) // 先 make 初始化

            var s []int        // nil，但 append 是安全的
            s = append(s, 1)   // ✅ nil 切片可以直接 append
            ```
        - 常量与 iota 枚举
            - Go 用 const 定义常量
            - Go 没有 enum 关键字，但是提供了 iota 自增器
            - 基本常量
            ```go
            const Pi = 3.14159
            const AppName = "MyApp"

            // 批量声明
            const (
                StatusOK    = 200
                StatusNotFound = 404
                StatusError = 500
            )
            ```
            - iota Go 的枚举利器
            ```Go
            // iota 在 const 块中从 0 开始，每行自增 1
            type Weekday int

            const (
                Sunday    Weekday = iota  // 0
                Monday                    // 1（自动继承 iota 表达式）
                Tuesday                   // 2
                Wednesday                 // 3
                Thursday                  // 4
                Friday                    // 5
                Saturday                  // 6
            )
            ```
            - iota 高级用法
            ```Go
            // 用法一：跳过某个值
            type Color int
            const (
                _      Color = iota  // 0，用 _ 跳过
                Red                  // 1
                Green                // 2
                Blue                 // 3
            )

            // 用法二：位掩码（权限系统常用）
            type Permission uint

            const (
                Read    Permission = 1 << iota  // 1  (001)
                Write                           // 2  (010)
                Execute                         // 4  (100)
            )
            // 组合权限
            userPerm := Read | Write  // 3 (011)
            fmt.Println(userPerm & Read != 0)   // true，有读权限
            fmt.Println(userPerm & Execute != 0) // false，无执行权限

            // 用法三：文件大小单位
            const (
                _  = iota
                KB = 1 << (10 * iota)  // 1 << 10 = 1024
                MB                      // 1 << 20
                GB                      // 1 << 30
                TB                      // 1 << 40
            )
            ```
            - iota 的本质
                - 不是一个值，是 const 块的行索引计数器
                - 每次遇到一个新的 const 就重置为 0
                - 同一行的多个 iota 值相同
        - 类型转换
            - 
            ```Go
            // ❌ 隐式转换在 Go 中不存在
            var a int = 42
            var b float64 = a      // 编译错误！
            var c int64 = a        // 编译错误！即使都是整数

            // ✅ 必须显式转换
            var b float64 = float64(a)  // 42.0
            var c int64 = int64(a)      // 42

            // 字符串 ↔ 数字（用 strconv 包）
            import "strconv"

            s := strconv.Itoa(42)         // int → string: "42"
            n, err := strconv.Atoi("42")  // string → int: 42
            f, err := strconv.ParseFloat("3.14", 64)  // string → float64

            // 字符串 ↔ 字节切片
            bytes := []byte("Hello")     // string → []byte
            str := string(bytes)          // []byte → string

            // ⚠️ 精度丢失要注意
            big := int64(1<<62)
            small := int32(big)  // 溢出！结果不可预测
            ```
            - fmt.Sprintf 万能转字符串
                - 性能不如 strconv，高频调用优先用 strconv
    - 流程控制
        - if/else 条件判断
            - 条件不需要括号
            - 允许在条件前加入一个初始化语句
            - 基本语法
                - 
                ```Go
                score := 85

                if score >= 90 {
                    fmt.Println("优秀")
                } else if score >= 60 {
                    fmt.Println("及格")
                } else {
                    fmt.Println("不及格")
                }

                // 注意：
                // 1. 条件不需要括号 (score >= 90) 写成 score >= 90
                // 2. 大括号必须有，即使只有一行
                // 3. else 必须和右大括号同一行
                ```
            - 前置初始化语句 (GO 特色)
                -
                ```Go
                // 在条件中声明并使用变量
                if err := doSomething(); err != nil {
                    fmt.Println("出错了:", err)
                    return
                }
                // err 的作用域仅限于 if-else 块内，块外不可见

                // 对比：不用前置初始化的写法
                err := doSomething()
                if err != nil {
                    fmt.Println("出错了:", err)
                    return
                }
                // 这里 err 仍在作用域内，可能造成后续变量名冲突
                ```
            - 前置初始化的好处
                - 限制了变量的作用域
                - 避免污染外部命名空间
                - 在错误处理中常见
        - for 循环
            - Go 只有 for 一个循环关键字
            - for 有多种形式，能覆盖其他语言的各种循环要求
            - 经典三段式
                - 
                ```Go
                for i := 0; i < 10; i++ {
                    fmt.Println(i)
                }
                ```
            - 类 while 循环 (只有条件)
                -
                ```Go
                n := 10
                for n > 0 {
                    fmt.Println(n)
                    n--
                }
                ```
            - 无限循环
                - 
                ```Go
                for {
                    // 死循环，用 break 退出
                    if someCondition() {
                        break
                    }
                }

                // 常用于服务器主循环
                for {
                    conn, err := listener.Accept()
                    if err != nil {
                        continue
                    }
                    go handleConn(conn)
                }
                ```
            - for-range 遍历
                - 
                ```Go
                // 遍历切片/数组
                nums := []int{10, 20, 30}
                for i, v := range nums {
                    fmt.Printf("索引=%d 值=%d\n", i, v)
                }

                // 只要索引
                for i := range nums {
                    fmt.Println(i)
                }

                // 只要值（用 _ 忽略索引）
                for _, v := range nums {
                    fmt.Println(v)
                }

                // 遍历 map（顺序随机！）
                m := map[string]int{"a": 1, "b": 2}
                for k, v := range m {
                    fmt.Printf("%s=%d\n", k, v)
                }

                // 遍历字符串（按 rune）
                for i, ch := range "Hello你好" {
                    fmt.Printf("%d: %c\n", i, ch)
                }

                // 遍历 channel（Day 9 会讲）
                // for msg := range ch { ... }
                ```
            - 循环复用坑
                - 在 Go 1.22 之前，for-range 的循环变量是复用的，在 go routine 中捕获会出现问题
                -
                ```Go
                // Go 1.22+ 这样写是安全的
                for _, v := range []int{1, 2, 3} {
                    go func() {
                        fmt.Println(v) // 1.22 前可能全打印 3
                    }()
                }

                // Go 1.22 之前的兼容写法：
                for _, v := range []int{1, 2, 3} {
                    v := v // 显式创建副本
                    go func() {
                        fmt.Println(v)
                    }()
                }
                ```
        - switch 分支
            - 支持默认 break、多值匹配、任意表达式
            - 基本用法：默认不穿透
                - 
                ```go
                day := 3

                switch day {
                case 1:
                    fmt.Println("周一")
                case 2:
                    fmt.Println("周二")
                case 3:
                    fmt.Println("周三")
                    // 默认自动 break，不会掉到 case 4
                case 4, 5:  // ✨ 多值匹配
                    fmt.Println("周四或周五")
                case 6, 7:
                    fmt.Println("周末")
                default:
                    fmt.Println("无效")
                }
                ```
            - 无条件 switch (if-else 链的优雅写法)
                - 
                ```go
                score := 85

                // 省略 switch 后的条件，相当于 switch true
                switch {
                case score >= 90:
                    fmt.Println("A")
                case score >= 80:
                    fmt.Println("B")
                case score >= 60:
                    fmt.Println("C")
                default:
                    fmt.Println("F")
                }

                // 比 if-else 链更清晰
                // 等价于：
                // if score >= 90 { ... } 
                // else if score >= 80 { ... }
                // ...
                ```
            - 前置初始化语句
                - 
                ```go
                switch os := runtime.GOOS; os {
                case "linux":
                    fmt.Println("Linux")
                case "darwin":
                    fmt.Println("macOS")
                case "windows":
                    fmt.Println("Windows")
                default:
                    fmt.Printf("未知系统: %s\n", os)
                }
                ```
            - fallthrough:显式穿透
                -
                ```go
                // 如果真的需要穿透到下一个 case，用 fallthrough
                switch n := 1; n {
                case 1:
                    fmt.Println("一")
                    fallthrough  // 继续执行下一个 case
                case 2:
                    fmt.Println("二") // 会被打印
                case 3:
                    fmt.Println("三") // 不会打印，fallthrough 只穿透一层
                }
                // 输出：一、二
                ```
        - break、continue、goto
            - 基础 break 和 continue
                -
                ```go
                for i := 0; i < 10; i++ {
                    if i == 3 {
                        continue  // 跳过本次迭代
                    }
                    if i == 7 {
                        break     // 退出循环
                    }
                    fmt.Println(i)
                }
                // 输出：0 1 2 4 5 6
                ```
            - 标签：跳出嵌套循环
                -
                ```go
                // 问题：break 只能跳出一层循环
                // 在嵌套循环中如何跳出外层？

                OuterLoop:
                for i := 0; i < 5; i++ {
                    for j := 0; j < 5; j++ {
                        if i*j > 6 {
                            break OuterLoop  // 直接跳出外层循环
                        }
                        fmt.Printf("%d*%d ", i, j)
                    }
                }

                // continue 也支持标签：continue OuterLoop 会回到外层循环的下一次迭代
                ```
            - goto 存在，但是不建议用
        - defer 延迟执行
            - defer 是 Go 的标志性特性，用来注册「函数退出前必须执行」的逻辑
            - 它彻底解决了资源清理、错误恢复等场景
            - 基本行为：函数返回前执行
                -
                ```go
                func main() {
                    fmt.Println("1. 开始")
                    defer fmt.Println("3. 延迟执行")
                    fmt.Println("2. 中间")
                }
                // 输出：
                // 1. 开始
                // 2. 中间
                // 3. 延迟执行 ← 在函数返回前执行
                ```
            - 典型用法：资源清理
                -
                ```go
                // 文件操作
                func readFile(name string) error {
                    f, err := os.Open(name)
                    if err != nil {
                        return err
                    }
                    defer f.Close()  // ✨ 立刻注册关闭，无论函数怎么退出都会执行
                    
                    // 读取文件内容...
                    // 即使这里 return 或 panic，f.Close() 都会被执行
                    return nil
                }

                // 锁
                func updateCounter() {
                    mu.Lock()
                    defer mu.Unlock()  // ✨ 保证解锁，不会死锁
                    
                    counter++
                    // 即使后续代码 panic，锁也能释放
                }
                ```
            - 多个 defer: LIFO 栈顺序
                -
                ```go
                func main() {
                    defer fmt.Println("1")
                    defer fmt.Println("2")
                    defer fmt.Println("3")
                    fmt.Println("main")
                }
                // 输出：
                // main
                // 3  ← 后进先出（栈）
                // 2
                // 1
                ```
            - defer 语句参数
                - defer 语句的参数在注册是就计算好，不是执行时
                -
                ```go
                func main() {
                    x := 10
                    defer fmt.Println("defer:", x)  // x 的值 10 被立即捕获
                    x = 20
                    fmt.Println("main:", x)
                }
                // 输出：
                // main: 20
                // defer: 10   ← 不是 20！

                // 如果想用最终值，用闭包：
                func main() {
                    x := 10
                    defer func() {
                        fmt.Println("defer:", x)  // 闭包捕获变量引用
                    }()
                    x = 20
                }
                // 输出 defer: 20
                ```
    - 函数深入
        - 函数基础
            - Go 的函数定义和 C 系列语言不一样：关键字 func 在前，返回值类型在后
                -
                ```go
                // 基本语法：func 函数名(参数列表) 返回值类型 { 函数体 }
                func add(a int, b int) int {
                    return a + b
                }

                // 参数同类型可以合并声明
                func add2(a, b int) int {
                    return a + b
                }

                // 无返回值
                func greet(name string) {
                    fmt.Println("Hello,", name)
                }

                // 无参数也无返回值
                func printVersion() {
                    fmt.Println("v1.0.0")
                }
                ```
            - 函数是一等公民
                - Go 的函数可以赋值给变量、作为参数传递、作为返回值返回
                - 这让 Go 支持函数式编程风格，比如高阶函数、回调、中间件模式等
                -
                ```go
                // 函数赋值给变量
                var operation func(int, int) int = add
                result := operation(1, 2) // 3

                // 函数作为参数
                func apply(nums []int, fn func(int) int) []int {
                    result := make([]int, len(nums))
                    for i, n := range nums {
                        result[i] = fn(n)
                    }
                    return result
                }

                doubled := apply([]int{1, 2, 3}, func(x int) int {
                    return x * 2
                }) // [2, 4, 6]
                ```
        - 多返回值
            - go 原生支持多返回值
                -
                ```go
                // 返回商和余数
                func divmod(a, b int) (int, int) {
                    return a / b, a % b
                }

                q, r := divmod(10, 3) // q=3, r=1

                // 只想要其中一个，用 _ 忽略
                q, _ := divmod(10, 3) // 只要商
                _, r = divmod(10, 3) // 只要余数
                ```
            - 几乎所有主流库都用这个特性返回 (result, error)
            - go 的惯用法：(result,error)
                - 
                ```go
                // 几乎所有可能失败的操作都返回 (结果, error)
                func readFile(name string) (string, error) {
                    data, err := os.ReadFile(name)
                    if err != nil {
                        return "", err // 失败时返回零值 + 错误
                    }
                    return string(data), nil // 成功时返回结果 + nil
                }

                // 调用方的标准模式
                content, err := readFile("hello.txt")
                if err != nil {
                    log.Fatal(err)
                }
                fmt.Println(content)
                ```
        - 命名返回值
            - go 允许给返回值命名，在返回值多，复杂逻辑时有用
                -
                ```go
                // 普通多返回值
                func divide1(a, b float64) (float64, error) {
                    if b == 0 {
                        return 0, errors.New("除数不能为零")
                    }
                    return a / b, nil
                }

                // 命名返回值版本
                func divide2(a, b float64) (result float64, err error) {
                    if b == 0 {
                        err = errors.New("除数不能为零")
                        return // 裸 return，自动返回 result=0, err=上面的值
                    }
                    result = a / b
                    return // 自动返回 result, err
                }
                ```
            - 命名返回值 + defer
                -
                ```go
                // 在 defer 中修改返回值
                func doWork() (err error) {
                    defer func() {
                        if r := recover(); r != nil {
                            err = fmt.Errorf("恢复自 panic: %v", r)
                            // ✨ 这里能修改返回值 err！
                        }
                    }()

                    // 可能 panic 的代码
                    panic("something bad")
                }

                result := doWork() // result 不是 nil，而是包装后的 error
                ```
            - 什么时候用命名返回值
                - 返回值很多且含义复杂时，命名可以当文档
                - 需要在 defer 中修改返回值时（recover 模式）
        - 可变参数函数
            - 用 ...T 表示可变参数，函数内部会收到一个 []T 类型的切片
            - fmt.Println 就是典型的可变参数函数。
            - 示例
                - 
                ```go
                // 求任意个数字的和
                func sum(nums ...int) int {
                    total := 0
                    for _, n := range nums {
                        total += n
                    }
                    return total
                }

                sum()              // 0（传递空切片）
                sum(1, 2, 3)       // 6
                sum(1, 2, 3, 4, 5) // 15

                // 把切片展开传递，用 ... 展开
                nums := []int{10, 20, 30}
                sum(nums...) // 60，注意是 nums... 而不是 nums
                ```
            - 混合使用固定参数和可变参数
                - 
                ```go
                // 可变参数必须是最后一个参数
                func greet(greeting string, names ...string) {
                    for _, name := range names {
                        fmt.Printf("%s, %s!\n", greeting, name)
                    }
                }

                greet("Hello", "Alice", "Bob", "Charlie")
                // Hello, Alice!
                // Hello, Bob!
                // Hello, Charlie!
                ```
        - 闭包与匿名函数
            - 闭包是能访问外部作用域变量的函数
            - Go 的闭包语法简洁，是实现迭代器、中间件、回调等模式的基础
            - 匿名函数
                -
                ```go
                // 定义后立即调用（IIFE）
                func() {
                    fmt.Println("我是匿名函数")
                }()

                // 赋值给变量
                add := func(a, b int) int {
                    return a + b
                }
                fmt.Println(add(1, 2)) // 3
                ```
            - 闭包：捕获外部变量
                -
                ```go
                // 计数器生成器
                func makeCounter() func() int {
                    count := 0
                    return func() int {
                        count++ // ✨ 闭包捕获了外部的 count
                        return count
                    }
                }

                c1 := makeCounter()
                fmt.Println(c1()) // 1
                fmt.Println(c1()) // 2
                fmt.Println(c1()) // 3

                // 每个闭包有自己独立的状态
                c2 := makeCounter()
                fmt.Println(c2()) // 1（c2 的 count 是独立的）
                fmt.Println(c1()) // 4（c1 继续累加）
                ```
            - 闭包实战：装饰器模式
                -
                ```go
                // 为函数添加日志功能
                func withLogging(name string, fn func(int) int) func(int) int {
                    return func(x int) int {
                        fmt.Printf("调用 %s(%d)\n", name, x)
                        result := fn(x)
                        fmt.Printf("%s(%d) = %d\n", name, x, result)
                        return result
                    }
                }

                double := func(x int) int { return x * 2 }
                loggedDouble := withLogging("double", double)

                loggedDouble(5)
                // 调用 double(5)
                // double(5) = 10

                // 这是 HTTP 中间件的基础思想！
                ```
            - 闭包的捕获规则
                - 闭包捕获的是引用，不是值
                - 修改外部变量会反映到闭包内
                - 闭包修改也会反映到外部
        - error 作为 返回值
            - Go 把 error 当作普通值处理，而不是特殊的异常机制
            - error 的本质：一个接口
                - 
                ```go
                // error 其实就是标准库定义的一个接口
                // 任何实现了 Error() string 方法的类型都是 error
                type error interface {
                    Error() string
                }

                // 创建 error 的几种方式：
                // 方式一：errors.New
                import "errors"
                err := errors.New("文件不存在")

                // 方式二：fmt.Errorf（支持格式化）
                err = fmt.Errorf("文件 %s 不存在", filename)

                // 方式三：自定义类型（后续再深入）
                ```
            - 标准返回模式
                -
                ```go
                // ✅ Go 惯用写法：err 作为最后一个返回值
                func findUser(id int) (*User, error) {
                    if id < 0 {
                        return nil, fmt.Errorf("无效 ID: %d", id)
                    }

                    user, ok := userCache[id]
                    if !ok {
                        return nil, errors.New("用户不存在")
                    }

                    return user, nil
                }

                // 调用方必须检查 err
                user, err := findUser(42)
                if err != nil {
                    return err
                }
                // 这里 user 保证不是 nil
                ```
            - 提前返回：降低嵌套
                - 
                ```go
                // ❌ 过度嵌套（来自 Java/Python 习惯）
                func processDataBad(path string) error {
                    data, err := readFile(path)
                    if err == nil {
                        parsed, err := parse(data)
                        if err == nil {
                            result, err := transform(parsed)
                            if err == nil {
                                save(result)
                                return nil
                            }
                            return err
                        }
                        return err
                    }
                    return err
                }

                // ✅ Go 风格：早期返回，扁平化
                func processData(path string) error {
                    data, err := readFile(path)
                    if err != nil {
                        return err
                    }

                    parsed, err := parse(data)
                    if err != nil {
                        return err
                    }

                    result, err := transform(parsed)
                    if err != nil {
                        return err
                    }

                    return save(result)
                }
                ```
    - 数组、切片与 Map
        - 数组：固定长度的值类型
            - 数组：固定长度的值类型
                - Go 的数组和 C/Java 的不一样，它是值类型，长度是类型的一部分
                - 实际开发很少使用数组，几乎都使用切片
                - 示例
                    - 
                    ```go
                    // 声明数组：类型 [N]T
                    var a [3]int           // [0, 0, 0]，零值初始化
                    b := [3]int{1, 2, 3}   // 字面量初始化
                    c := [...]int{1, 2, 3} // ... 让编译器推断长度

                    // 长度是类型的一部分！
                    var x [3]int
                    var y [4]int
                    x = y  // ❌ 编译错误：[3]int 和 [4]int 是不同类型

                    // 访问和修改
                    fmt.Println(b[0])      // 1
                    b[0] = 100
                    fmt.Println(len(b))    // 3

                    // 遍历
                    for i, v := range b {
                        fmt.Printf("b[%d] = %d\n", i, v)
                    }
                    ```
                - 数组是值类型
                    - 把数组赋值给另一个变量，或者传入函数，都会完整拷贝一份
                    - 大数组这样性能会很差，实际开发总是使用切片
                    - 
                    ```go
                    a := [3]int{1, 2, 3}
                    b := a       // ✨ 完全拷贝！b 和 a 是独立的
                    b[0] = 100

                    fmt.Println(a)  // [1 2 3]  ← a 没变
                    fmt.Println(b)  // [100 2 3]

                    // 传入函数也是拷贝
                    func modify(arr [3]int) {
                        arr[0] = 999
                    }
                    modify(a)
                    fmt.Println(a)  // [1 2 3]  ← 依然没变！
                    ```
            - 切片：Go 的主力军
                - 切片是 Go 中最常用的数据结构
                - 看起来像动态数组，但底层是对数组的视图
                - 切片的三要素
                    -
                    ```go
                    // 切片在内存中是一个结构体（概念上）：
                    // type slice struct {
                    //     ptr      *T    // 指向底层数组的指针
                    //     len      int   // 当前长度
                    //     cap      int   // 容量（底层数组剩余空间）
                    // }

                    s := []int{10, 20, 30}
                    fmt.Println(len(s))  // 3（长度）
                    fmt.Println(cap(s))  // 3（容量）
                    ```
                - 创建切片的五种方式
                    -
                    ```go
                    // ① 字面量
                    s1 := []int{1, 2, 3}

                    // ② make：指定长度（和容量）
                    s2 := make([]int, 5)       // len=5, cap=5，值全是 0
                    s3 := make([]int, 3, 10)   // len=3, cap=10

                    // ③ nil 切片
                    var s4 []int                // nil，len=0, cap=0
                    fmt.Println(s4 == nil)      // true
                    // 但 nil 切片可以直接 append，不会 panic

                    // ④ 空切片（和 nil 切片 len/cap 相同但底层不同）
                    s5 := []int{}
                    fmt.Println(s5 == nil)      // false

                    // ⑤ 切割已有数组/切片（下一节详讲）
                    arr := [5]int{1, 2, 3, 4, 5}
                    s6 := arr[1:4]              // [2, 3, 4]
                    ```
                - ni 切片 vs 空切片
                    - 两者几乎可以互换
                    - 都可以 append，都可以 range
                    - JSON 序列化时 nil 变为 null，空切片变为 【】
                    - 推荐总是优先使用 nil 切片
            - 切片操作：切割与 append
                - 切割语法 s[low:high:max]
                    -
                    ```go
                    s := []int{0, 1, 2, 3, 4, 5}

                    // 基本切割 [low:high]
                    s[1:4]      // [1, 2, 3]  ← 左闭右开
                    s[:3]       // [0, 1, 2]  省略 low 默认 0
                    s[3:]       // [3, 4, 5]  省略 high 默认 len
                    s[:]        // [0, 1, 2, 3, 4, 5]  完整拷贝引用

                    // 三参数切割 [low:high:max] —— 限制容量
                    s2 := s[1:4:4]
                    fmt.Println(len(s2), cap(s2))  // 3, 3（容量被限制）
                    // 不加 :max 的话，cap(s2) 会是 5（底层数组剩余容量）
                    ```
                - append: 扩容机制
                    -
                    ```go
                    s := []int{1, 2, 3}
                    s = append(s, 4)          // [1 2 3 4]
                    s = append(s, 5, 6, 7)    // 添加多个

                    // 合并两个切片
                    a := []int{1, 2}
                    b := []int{3, 4}
                    c := append(a, b...)      // 注意 ...，展开 b
                    // c = [1 2 3 4]
                    ```
                - 扩容规则
                    - 
                    ```go
                    // 当 append 超过 cap 时，Go 会分配新的底层数组
                    // 扩容规则（Go 1.18+ 简化）：
                    //   cap < 256：翻倍（1 → 2 → 4 → 8 ...）
                    //   cap >= 256：每次增加约 25%

                    s := make([]int, 0, 2)
                    fmt.Println(cap(s))  // 2

                    s = append(s, 1, 2, 3)
                    fmt.Println(cap(s))  // 4（翻倍）

                    // 扩容是昂贵的！如果知道最终大小，一开始就 make 好
                    s := make([]int, 0, 1000)  // ✅ 预分配
                    for i := 0; i < 1000; i++ {
                        s = append(s, i)        // 不会触发扩容
                    }
                    ```
            - 切片陷阱
                - 切割共享底层数组
                    - 
                    ```go
                    original := []int{1, 2, 3, 4, 5}
                    sub := original[1:3]        // [2, 3]，但底层数组是共享的！

                    sub[0] = 999
                    fmt.Println(original)       // [1 999 3 4 5]  ← 原数组被改了！
                    fmt.Println(sub)            // [999 3]

                    // 安全做法：显式拷贝
                    sub := make([]int, 2)
                    copy(sub, original[1:3])    // sub 是独立的
                    sub[0] = 999
                    fmt.Println(original)       // [1 2 3 4 5]  ← 不受影响
                    ```
                - append 可能修改原切片
                    -
                    ```go
                    original := []int{1, 2, 3, 4, 5}
                    sub := original[:3]         // [1 2 3]，cap=5

                    sub = append(sub, 999)      // append 时 cap 够用，复用底层数组！
                    fmt.Println(original)       // [1 2 3 999 5]  ← 原数组第 4 位被改了！

                    // 用三参数切割限制容量，强制 append 时分配新数组
                    sub := original[:3:3]       // cap=3
                    sub = append(sub, 999)      // 容量不够，分配新数组
                    fmt.Println(original)       // [1 2 3 4 5]  ← 原数组安全
                    ```
                - 大切片导致内存泄露
                    - 
                    ```go
                    // 读一个 1GB 大文件，只保留前 100 字节
                    func readSmallPart(filename string) []byte {
                        big, _ := os.ReadFile(filename)  // 1GB
                        return big[:100]  // ⚠️ 返回的切片引用着整个 1GB 数组！
                        // 只要返回值存活，1GB 内存就不会被 GC
                    }

                    // 正确做法：主动拷贝脱离引用
                    func readSmallPart(filename string) []byte {
                        big, _ := os.ReadFile(filename)
                        small := make([]byte, 100)
                        copy(small, big)
                        return small  // ✅ 只引用 100 字节，big 可以被 GC
                    }
                    ```
            - 切片常见操作
                - 删除元素
                    -
                    ```go
                    // Go 没有内置的删除函数，用切片拼接
                    s := []int{1, 2, 3, 4, 5}
                    i := 2  // 要删除的索引

                    // 删除索引 i 的元素
                    s = append(s[:i], s[i+1:]...)
                    // s = [1 2 4 5]

                    // Go 1.21+ 用 slices.Delete
                    import "slices"
                    s = slices.Delete(s, i, i+1)
                    ```
                - 插入元素
                    -
                    ```go
                    s := []int{1, 2, 4, 5}
                    i := 2       // 插入位置
                    val := 3     // 要插入的值

                    // 在索引 i 处插入 val
                    s = append(s[:i], append([]int{val}, s[i:]...)...)
                    // s = [1 2 3 4 5]

                    // Go 1.21+ 用 slices.Insert（推荐）
                    s = slices.Insert(s, i, val)
                    ```
                - 复制、反转、排序
                    -
                    ```go
                    // 复制
                    src := []int{1, 2, 3}
                    dst := make([]int, len(src))
                    n := copy(dst, src)    // n 是实际复制的元素数

                    // Go 1.21+ 最简洁
                    dst := slices.Clone(src)

                    // 排序
                    import "sort"
                    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
                    sort.Ints(nums)         // [1 1 2 3 4 5 6 9]
                    sort.Sort(sort.Reverse(sort.IntSlice(nums)))  // 降序

                    // Go 1.21+ 更简洁
                    slices.Sort(nums)
                    slices.Reverse(nums)

                    // 自定义排序
                    sort.Slice(nums, func(i, j int) bool {
                        return nums[i] > nums[j]  // 降序
                    })
                    ```
            - map: 键值对容器
                - Go 的 map 是哈希表实现，支持任何可比较类型作为 key
                - 使用前必须初始化，nil map 不能写入
                - 声明与初始化
                    -
                    ```go
                    // ❌ 错误：只声明，没初始化
                    var m1 map[string]int
                    m1["a"] = 1  // panic: assignment to entry in nil map

                    // ✅ 方式一：make
                    m2 := make(map[string]int)
                    m2["a"] = 1

                    // ✅ 方式二：字面量
                    m3 := map[string]int{
                        "one":   1,
                        "two":   2,
                        "three": 3,
                    }

                    // ✅ 方式三：make 指定初始容量（性能优化）
                    m4 := make(map[string]int, 1000)  // 提前分配空间
                    ```
                - 增删改查
                    -
                    ```go
                    m := map[string]int{"a": 1, "b": 2}

                    // 增/改（语法相同）
                    m["c"] = 3        // 新增
                    m["a"] = 100      // 修改

                    // 查
                    v := m["a"]       // 100
                    missing := m["x"] // 0（不存在时返回零值！）

                    // ✨ 判断 key 是否存在：逗号 ok 惯用法
                    v, ok := m["a"]   // v=100, ok=true
                    v, ok := m["x"]   // v=0,   ok=false
                    if ok {
                        fmt.Println("存在")
                    }

                    // 删除（不存在也不会报错）
                    delete(m, "a")

                    // 长度
                    fmt.Println(len(m))
                    ```
                - 遍历(顺序随机)
                    -
                    ```go
                    m := map[string]int{"a": 1, "b": 2, "c": 3}

                    // 每次遍历顺序都可能不同！
                    for k, v := range m {
                        fmt.Printf("%s=%d\n", k, v)
                    }

                    // 需要有序遍历：把 key 取出来排序
                    keys := make([]string, 0, len(m))
                    for k := range m {
                        keys = append(keys, k)
                    }
                    sort.Strings(keys)

                    for _, k := range keys {
                        fmt.Printf("%s=%d\n", k, m[k])
                    }
                    ```
            - map 进阶：零值技巧与并发
                - 零值技巧：计数器模式
                    -
                    ```go
                    // map 访问不存在的 key 返回零值，这特性很好用
                    words := []string{"go", "rust", "go", "python", "go", "rust"}

                    count := make(map[string]int)
                    for _, w := range words {
                        count[w]++  // ✨ 不存在时 count[w] 是 0，+1 变成 1
                    }
                    // count = {"go": 3, "rust": 2, "python": 1}

                    // 分组：map + 切片
                    type User struct {
                        Name string
                        City string
                    }
                    users := []User{
                        {"Alice", "Tokyo"},
                        {"Bob", "Tokyo"},
                        {"Charlie", "Osaka"},
                    }

                    byCity := make(map[string][]User)
                    for _, u := range users {
                        byCity[u.City] = append(byCity[u.City], u)
                    }
                    // byCity["Tokyo"] = [{Alice Tokyo} {Bob Tokyo}]
                    ```
                - map 作为集合
                    -
                    ```go
                    // Go 没有内置 Set，用 map[T]struct{} 模拟
                    set := map[string]struct{}{}

                    // 添加
                    set["apple"] = struct{}{}
                    set["banana"] = struct{}{}

                    // 判断存在
                    _, ok := set["apple"]   // true

                    // 删除
                    delete(set, "apple")

                    // 为什么用 struct{} 而不是 bool？
                    // struct{} 不占内存（0 字节），比 bool（1字节）更省空间
                    ```
                - map 不是并发安全的
                    -
                    ```go
                    // ❌ 多个 goroutine 同时读写 map 会 panic！
                    m := make(map[string]int)
                    go func() { m["a"] = 1 }()
                    go func() { m["b"] = 2 }()
                    // 运行时报错：fatal error: concurrent map writes

                    // ✅ 方式一：sync.Mutex 加锁
                    var mu sync.Mutex
                    m := make(map[string]int)

                    go func() {
                        mu.Lock()
                        defer mu.Unlock()
                        m["a"] = 1
                    }()

                    // ✅ 方式二：sync.Map（适合读多写少场景）
                    var sm sync.Map
                    sm.Store("a", 1)
                    v, ok := sm.Load("a")
                    sm.Delete("a")
                    sm.Range(func(k, v any) bool {
                        fmt.Println(k, v)
                        return true  // 返回 false 停止遍历
                    })
                    ```
    - 结构体与方法
        - 结构体基础
            - 结构体是 Go 中组织数据的核心方式
            - Go 没有 class，但 struct + 方法已经能表达几乎所有面向对象的特性，而且更简单直接
            - 定义与初始化
                - 
                ```go
                // 定义结构体
                type User struct {
                    ID       int
                    Name     string
                    Email    string
                    Active   bool
                }

                // 初始化方式一：字段名（推荐，最清晰）
                u1 := User{
                    ID:     1,
                    Name:   "Alice",
                    Email:  "alice@example.com",
                    Active: true,
                }

                // 初始化方式二：按字段顺序（脆弱，字段增减会出问题）
                u2 := User{2, "Bob", "bob@example.com", false}

                // 初始化方式三：零值
                var u3 User  // 所有字段都是零值：{0, "", "", false}
                u3.Name = "Charlie"

                // 初始化方式四：new（返回指针）
                u4 := new(User)  // 等价于 &User{}
                u4.Name = "David"
                ```
            - 访问和修改字段
                - 
                ```go
                u := User{Name: "Alice"}

                // 访问字段
                fmt.Println(u.Name)

                // 修改字段
                u.Name = "Alicia"

                // 指针也用 . 访问（Go 自动解引用）
                p := &u
                p.Name = "Alice 2"  // 等价于 (*p).Name，Go 帮你省了*
                fmt.Println(u.Name)  // Alice 2
                ```
            - 字段名大小写
                - 首字母大写的字段是导出的（public），可以被包外访问
                - 小写的是未导出的（private），只能包内使用
        - 值类型 vs 指针
            - struct 是值类型。赋值、传参、返回都是完整拷贝
                -
                ```go
                u1 := User{Name: "Alice"}
                u2 := u1           // ✨ 完全拷贝！u1 和 u2 是两个独立对象
                u2.Name = "Bob"

                fmt.Println(u1.Name)  // Alice（没变）
                fmt.Println(u2.Name)  // Bob

                // 传入函数也是拷贝
                func modify(u User) {
                    u.Name = "Changed"  // 只修改了拷贝
                }
                modify(u1)
                fmt.Println(u1.Name)  // Alice（没变！）

                // 想修改原对象？传指针
                func modifyPtr(u *User) {
                    u.Name = "Changed"
                }
                modifyPtr(&u1)
                fmt.Println(u1.Name)  // Changed
                ```
            - 什么时候用指针
                -
                ```go
                // ✅ 使用指针的场景：

                // 1. 需要修改原对象
                func (u *User) SetName(name string) {
                    u.Name = name
                }

                // 2. 结构体很大，拷贝开销大
                type Config struct {
                    // 假设有 50 个字段
                }
                func process(c *Config) { ... }  // 传指针避免拷贝

                // 3. 想表达「可能为空」的语义
                func findUser(id int) *User {
                    if !found {
                        return nil  // 用 nil 表示未找到
                    }
                    return &user
                }

                // ❌ 不用指针的场景：
                // - 小结构体（几个字段的）
                // - 不修改的只读操作
                // - 代表不可变概念（如 time.Time）
                ```
            - 经验法则
                - 拿不准就用指针
                - Go 代码中 *User 比 User 更常见
                - 但像 time.Time、image.Point 这种小且不可变的类型，用值类型更自然
        - 方法：给类型加行为
            - 方法是绑定到特定类型的函数
            - Go 的方法语法有点特别——接收者写在函数名前面
            - 方法定义语法
                -
                ```go
                type Rectangle struct {
                    Width, Height float64
                }

                // 方法定义：func (接收者 类型) 方法名(参数) 返回值
                func (r Rectangle) Area() float64 {
                    return r.Width * r.Height
                }

                func (r Rectangle) Perimeter() float64 {
                    return 2 * (r.Width + r.Height)
                }

                // 调用
                rect := Rectangle{Width: 3, Height: 4}
                fmt.Println(rect.Area())       // 12
                fmt.Println(rect.Perimeter())  // 14
                ```
            - 值接收者 vs 指针接收者
                -
                ```go
                type Counter struct {
                    count int
                }

                // ❌ 值接收者：修改不会生效！
                func (c Counter) IncrementWrong() {
                    c.count++  // 只修改了副本
                }

                // ✅ 指针接收者：修改原对象
                func (c *Counter) Increment() {
                    c.count++
                }

                // ✅ 只读方法用值接收者
                func (c Counter) Get() int {
                    return c.count
                }

                c := Counter{}
                c.IncrementWrong()
                fmt.Println(c.Get())  // 0 ← 没变！

                c.Increment()
                fmt.Println(c.Get())  // 1 ← 生效了
                c.Increment()
                fmt.Println(c.Get())  // 2
                ```

{{< /mind >}}