---
title: "GoLand 开发环境配置"
date: '2025-08-23'
draft: false
description: 配置 Goland 开发环境
toc: true
---


# 卸载已有的 Go 

1. 确认 Go 的安装路径，一般是官方路径 `/usr/local/go`

    ```shell
    which go
    ```

    which 命令可以查看并显示指定命令的可执行文件路径，能帮助确定当前系统正在使用的命令安装在哪个位置。

    默认情况下，只会输出第一个匹配的路径，可以通过 `-a` 选项查看所有匹配的路径。

2. 删除 Go 安装目录

    ```shell
    sudo rm -rf /usr/local/go
    ```

3. 删除 GOPATH 目录，一般是 `~/go`


    ```shell
    sudo rm -rf ~/go
    ```

4. 查看是否卸载成功

    ```shell
    go version
    ```

# 官网安装 Go

1. 进入官网下载页 https://golang.google.cn/dl/，下载对应版本

2. 查看 go 是否正确安装

    ```shell
    go version
    ```

# vscode 配置

1. 安装 Go 扩展 (Rich Go language support for Visual Studio Code)
2. 重启 vscode

# Hello World

```go
package main

import "fmt"

func main()  {
	fmt.Println("hello world!")
}
```

