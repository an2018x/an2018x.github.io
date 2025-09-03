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

# 通配符

通配符是 shell（如 bash）用于匹配文件名或路径 的简化模式匹配工具，主要用于命令行中对文件 / 目录进行批量操作（如 ls、cp、rm 等命令）。

| 通配符 | 说明 | 示例 |
| ----- | ----| --- |
| `*`| 匹配任意数量的任意字符|ls *.txt 匹配所有以 .txt 结尾的文件。 |
| `?` | 匹配 单个 任意字符 | ls file?.log 匹配 file1.log、fileA.log 等（文件名长度固定，仅最后一个字符不同）。|
| `[]`| 匹配括号内的 单个 字符，支持范围表示 | ls [a-z].sh 匹配 a.sh、b.sh 等；ls [0-9].txt 匹配 1.txt、5.txt 等。|
| `[! ]`/ `[^ ]` | 匹配 不在 括号内的单个字符 | ls [!a-z].pdf 匹配文件名首字符不是小写字母的 PDF 文件 |
|`{}`|匹配括号内的 逗号分隔的字符串（用于生成多个模式） | cp file{1,2,3}.txt dir/ 等价于 cp file1.txt file2.txt file3.txt dir/。|

和正则表达式的区别

* 通配符是 文件操作的简化工具，专注于快速匹配文件名，语法简单直观。
* 正则表达式是 文本内容匹配的强大工具，支持复杂模式，适用于文本分析和处理。

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


# 文件搜索

## find

* 按文件名搜索

```shell
# 在 /home 目录下搜索名为 "file.txt" 的文件
find /home -name "file.txt"
```

* 按文件名模糊搜索

```shell
# 在当前目录及子目录下搜索以 ".txt" 结尾的文件（忽略大小写）
find . -iname "*.txt"
```

* 按文件大小搜索

```shell
# 搜索大于 100MB 的文件（c=字节, k=KB, M=MB, G=GB）
find / -size +100M

# 搜索小于 10KB 的文件
find ./docs -size -10k
```

* 按修改时间搜索

```shell
# 搜索最近 7 天内修改过的文件
find /var/log -mtime -7

# 搜索超过 30 天未修改的文件
find ~ -mtime +30
```

* 按文件类型搜索

```shell
# 搜索目录（type d）
find /etc -type d -name "conf.d"

# 搜索符号链接（type l）
find /usr/bin -type l -name "python*"
```

* 按路径搜索

```shell
find /var -path "*/logs/*.log"
```

* 组合条件搜索

-a：与（默认，可省略）
-o：或
!：非

```shell
find /var/log -name "*.log" -size +100M -mtime +30
```

```shell
find . -type f \( -name "*.txt" -o -name "*.md" \) ! -name ".*"
```
（注意：() 用于分组，需转义 \(` `\)）

* 对搜索结果进行操作

```shell
find [条件] -exec 命令 {} \;
```

    * {} 代表匹配的文件名（占位符）。
    * \; 是命令结束标记（必须转义），为了防止 shell 解析这个分号。

删除 30 天前的 .log 文件

```shell
find /var/log -name "*.log" -mtime +30 -exec rm -f {} \;
```

* 限制搜索深度

```shell
find /etc -maxdepth 2 -name "*.conf"  # 只搜索 /etc 及直接子目录
```

* 排除目录

```shell
# 搜索 /home 但排除 /home/alice/tmp 目录
find /home -path "/home/alice/tmp" -prune -o -name "*.pdf" -print
```


## locate

* 基本搜索

```shell
# 搜索所有包含 "nginx.conf" 的文件路径
locate nginx.conf
```

* 精确匹配

```shell
# 只匹配完整名称完全为 "hosts" 的文件
locate -b '^hosts$'
```

* 更新数据库

```shell
sudo updatedb  # 需要 root 权限，更新 /var/lib/mlocate/mlocate.db
```

## which

搜索系统 PATH 目录下的可执行文件

```shell
which python3  # 输出 /usr/bin/python3
```

## whereis

搜索命令的二进制文件、源文件和手册页

```shell
whereis gcc  # 输出 gcc 的安装路径和手册位置
```

# 文件大小

## du

* 查看单个文件的磁盘占用

```shell
du -h filename.txt
# 输出示例：2.5M  filename.txt
```

* 查看目录总大小 （包含子文件）

```shell
du -sh /home/user/documents  # -s 表示只显示总和（不列出子目录详情）
# 输出示例：1.2G  /home/user/documents
```

* 查看目录内各子项的大小

```shell
du -h --max-depth=1 /var/log  # 只显示一级子目录/文件的大小
# 输出示例：
# 450M  /var/log/journal
# 12K   /var/log/nginx
# 5.2M  /var/log/syslog
```

* 按大小排序

```shell
du -h --max-depth=1 /tmp | sort -hr  # 结合 sort 从大到小排序
```

* 查看特定大小的文件并显式详情

```shell
find / -type f -size +1G -exec du -sh {} \;  # 查找 1GB 以上的文件
```
