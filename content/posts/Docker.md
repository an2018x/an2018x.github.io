---
title: "Docker 相关操作"
date: '2025-08-30'
draft: false
description: 整理常用的 Docker 操作
toc: true
---

# 官网下载 docker

https://www.docker.com/

# 镜像操作

## 镜像加速

https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors

Perferences -> Docker Engine -> 将 `https://y2vgkfz3.mirror.aliyuncs.com` 加到"registry-mirrors"的数组里，然后点击 Apply & Restart。

## 镜像查看

```shell
docker images 
```

查看本地仓库有哪些镜像。

## 下载镜像

```shell
docker pull 镜像名:版本号
```

## 搜索镜像

```shell
docker search 镜像名[:版本号]
```

## 删除镜像

```shell
docker image rm 镜像名
```

强制删除:

```shell
docker image rm -f 
```

## 获取镜像 id

```shell
docker images -q
```

```shell
docker rmi -f $(docker images -q)
```

# 容器命令

## 将打包的 tar 文件导入到 docker 仓库

```shell
docker load -i 导入的 tar 镜像文件名
```

## 通过镜像运行容器

```shell
docker run 镜像id/镜像名
```

## 映射宿主机端口和容器端口

```shell
docker run -p 宿主机端口:容器端口
```

## 后台启动

```shell
docker run -d(后台运行)
```

## 指定名称启动

```shell
docker run --name 名称
```

## 查看运行的容器

```shell
docker ps 
```

## 查看所有容器

```shell
docker ps -a
```

## 返回正在运行的容器 id

```shell
docker ps -q
```

## 开始、停止、重启容器

```shell
docker start 容器id/容器名
docker restart 容器id/容器名
docker stop 容器id/容器名   正常停止容器运行
docker kill 容器id/容器名   立即停止容器运行
```

## 删除容器

```shell
docker rm 容器名/容器id
```

## 查看容器内服务运行日志

```shell
docker logs 容器 id/容器名称  一闪而过
docker logs -f 容器 id/容器名称  实时查看
docker logs -t 容器 id/容器名称   加入时间戳
docker logs --tail n 容器 id/容器名称   查看容器尾部的n行
```

## 查看容器进程

```shell
docker top 容器 id/容器名称
```

## 进入容器

```shell
docker exec -it 容器id/容器名称 /bin/bash(终端应用)
```

## 复制文件

从操作系统到容器

```shell
docker cp 宿主机中的路径 容器id/容器名:容器下的资源路径
```

从容器到操作系统

```shell
docker cp 容器id/容器名:容器下的资源路径 宿主机中的路径
```

## 查看容器内部细节

```shell
docker inspect 容器id/容器名称
```

## 数据卷

实现宿主系统和容器间文件共享。

```shell
docker run -v 宿主机名目录:容器目录
```

## 将容器打包成新的镜像

```shell
docker commit -m "deploy" -a "an" 容器id 打包的镜像名:镜像版本
```

## 备份镜像

```shell
docker save 镜像名称:Tag -o 文件名.tar
```

# Dockerfile


## FROM

当前镜像是基于哪一个镜像，第一个指令必须是 FROM


```shell
FROM <images> 
FROM <images>[:<tag>]
FROM <images>[@digest] 使用摘要
```

## 基于 Dockerfile 构建镜像

```shell
docker build -t mycentos:01 .
```

## RUN

构建镜像时需要运行的指令。

```shell
FROM centos
RUN yum install -y vim
```

```shell
FROM centos
RUN ["yum","install","-y","vim"]
```

## EXPOSE

用来指定构建的镜像在运行为容器时对外暴露的端口。

```shell
EXPOSE 80
```

## WORKDIR

指定工作目录

```shell
WORKDIR /data
```

## ADD

从上下文中拷贝文件到指定路径映像文件系统中

```shell
ADD home.txt /mydir/
```

## COPY

从上下文中拷贝文件到指定路径映像文件系统中

```shell
COPY home.txt /mydir
```

COPY 可以下载 URL，ADD 不行

## VOLUMN

定义可以挂载到宿主机器目录。

```shell
VOLUMN ["/data"]
```

## ENV

设置环境变量。

```shell
ENV <key> <value>
ENV <key>=<value>
```

## ENTRYPOINT

用来指定容器启动时的执行命令

```shell
ENTRYPOINT command param1 param2
```