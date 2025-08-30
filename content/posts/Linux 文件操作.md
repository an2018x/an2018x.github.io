---
title: "Linux 文件操作"
date: '2025-08-30'
draft: false
description: 整理常用的 Linux 文件操作
toc: true
---

# 列出文件

ls 命令的几个选项如下。

| 选项 | 作用 |
| --- | --- |
| -a  | 列出隐藏文件 |
| -h  | 以人类友好的信息列出文件大小 |
| -t | 按照修改时间排序，最新的排在前面 |
| -r | 逆序排序 |
| -l | 列出详细信息 |

# 文件链接

```shell
ln -s hello.txt link.txt
```

创建 hello.txt 的软链接 link.txt。

```shell
$ ls -ltr
lrwxrwxrwx 1 ubuntu ubuntu 9 Mar 25 23:59 link.txt -> hello.txt
```

不加 `-s` 则是创建硬链接，硬链接是通过共享 inode 节点来指向同一个内容，所有的硬链接被删除了，文件才被删除，如果源文件路径变化，不会影响其他链接文件，但是软链接会失效。

# 权限说明


| rw- | rw- | r-- |
| --- | ----| --- |
| 文件所有者权限 | 同组用户的权限 | 其他用户的权限 |

二进制表示：

| r | w | x |
| --- | ----| --- |
| 4 | 2 | 1 |

* r 可读
* w 可写
* x 可执行

使用 chmod 增加权限。

```shell
chmod +r/w/x 
```
向所有用户添加权限。

```shell
chmod +r/w/x 
```

向所有用户删除权限。

```shell
chmod [u/a/g]+r/w/x
```

向所有者、全部用户、用户组添加权限。

```shell
chmod 777 hello.txt
```

# 创建文件

```shell
touch xx.txt
```


```shell
echo "hello.txt" > hello.txt
```

# 常用目录

| 目录 | 全称|  作用 | 典型文件 |
| --- | ---- |---  |---  |
| bin  | Binary | 存放系统最核心最基础的可执行程序，所有用户都可以执行 | ls / cat |
| lib  | Library | 系统库文件 |  |
| etc  | Editable Text Configuration | 配置文件 | Nginx/mysql 的配置文件 /etc/nginx/、/etc/mysql/  |
| sbin  | System Bin | 存放仅 root 用户可执行的系统管理命令 | ifconfig 配置网络、fdisk 分区 |
| var | Variable | 存储系统运行过程中会动态变化的数据 | 日志、缓存、临时文件|
| var/log |  | 存储系统和应用程序的日志文件 | nginx/xx.log |
| var/lib |  | 存储应用程序运行时需要的持久化数据 | 数据库文件、状态信息，例如 mysql/ 代表 MySQL 数据库的实际数据文件 |
| var/tmp |  | 需要长期保存的临时文件 | 应用程序的临时缓存 |
| opt | Optional | 存放用户或第三方软件开发者可选安装的应用程序，所有相关文件都在独立子目录，不依赖系统默认组件，通常将软件解压到 /opt，再通过软链接链接到 /usr/local/bin | IntelliJ IDEA |
| home | Home | 用户家目录 |  |
| tmp | Temporary | 系统或应用程序运行时产生的临时文件，只短时间有用，不需要长期保留，系统会自动清理 |  |
| usr   | Unix System Resource | 存储非核心系统资源，包括用户程序、库文件、文档、配置模板，不影响系统的启动 |  |
| sys   | System | 是 sysfs 文件系统的挂载点，以文件和目录的形式，向用户空间暴露内核空间的硬件设备、内核模块、系统资源的实时状态和配置信息 | /proc/1/ 进程信息，/proc/cpuinfo cpu 信息|
| proc   | Proc | 是 procfs 文件系统的挂载点，以文件和目录的形式，向用户空间暴露内核数据结构、进程信息和系统硬件信息 |  |
| usr/bin  |  | 存储普通用户可执行的非核心应用程序，所有用户可执行 | 通过系统发行版自带的、通过包管理器(apt/yum)安装的软件，例如 git/python，是系统提供、管理的官方工具 |
| usr/sbin  |  | 存放 root 用户可执行的非核心系统管理工具 | apache、mysql  |
| usr/lib | | 存放应用程序依赖的共享库程序 .so 和内核模块 | |
| usr/share | | 存放跨平台共享的静态资源(文档、图标) ，不依赖硬件架构||
| usr/local | | 存放用户手动安装的软件，从源码编译的程序/手动解压的二进制包，避免与系统默认安装软件冲突 |




