---
title: "Linux 虚拟机安装"
date: '2025-08-22'
draft: false
description: 整理常用在 Mac 上安装 Linux 虚拟机的过程
toc: true
tags:
  - Linux
---


# 使用 Multipass 安装 Ubuntu 系统

1. 进入 https://canonical.com/multipass 官网
2. 点击 Install now 按钮 -> MacOS
3. 运行命令启动 ubuntu 虚拟机

    ```shell
    multipass launch --name ubuntu --cpus 2 --memory 4G --disk 10G
    ```

    name 代表虚拟机的名字。

4. 使用 `multipass list` 命令查询当前安装的虚拟机列表

    ```shell
    $ multipass list
    Name                    State             IPv4             Image
    ubuntu                  Running           192.168.64.2     Ubuntu 24.04 LTS
    ```
5. 使用 `multipass shell ubuntu` 进入到虚拟机中
6. 使用 `multipass stop ubuntu` 可以关闭虚拟机
7. 使用 `multipass start ubuntu` 可以启动虚拟机