---
title: 2-Maven 标准目录结构
description: 描述 Maven 的标准目录结构
toc: true
authors: []
date: 2023-01-29T15:15:46+08:00
lastmod: 2023-01-29T15:15:46+08:00
draft: false
---

## 1. 简介

Apache Maven 除了分离依赖和仓库外，还提供了一个标准的工程目录结构。

## 2. 目录结构

1. 一个标准的 Maven 工程有一个 pom.xml 文件，还有一个基于约定的目录结构。

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/02/01/20230201221101.png)

2. 使用项目描述符可以覆盖默认的目录结构，但是不推荐。


## 3. 根目录

1. 该目录作为每个 Maven 目录的根目录。
2. 根目录下包含如下内容：
    1. `pom.xml` 定义 Maven 项目构建生命周期中需要的依赖和模块。
    2. `LICENSE.txt` 描述项目的授权信息。
    3. `README.txt` 项目的概要描述。
    4. `NOTICE.txt` 该项目使用到的第三方库的名称。
    5. `src/main` 包含工程中的源代码和资源
    6. `src/test` 包含测试代码和资源
    7. `src/it` 为 Maven Failsafe 的集成测试所保留
    8. `src/site` 使用 Maven Site 插件创建的项目站点文档
    9. `src/assembly` 打包所需要的集成配置

## 4. `src/main` 目录

1. `src/main` 目录是 Maven 项目中最重要的目录。
2. 任何要被打包进 jar 或者 war 包中的内容都要被放在这里。
3. 它的子目录如下：
    1. `src/main/java` 工程的 java 源代码
    2. `src/main/resources` 配置文件和其他资源文件
    3. `src/main/webapp` 对于 Web 应用，用来存放 JS、CSS、HTML、图片等文件
    4. `src/main/filters` 包含一些配置文件，这些配置文件的作用是在编译时向 `resource` 中的文件注入值。

## 5. `src/test` 目录

1. `src/test` 目录存放着应用中每个模块的单元测试。
2. 其中的任何资源或目录都不会被打包到最终的工程中。
3. 它的子目录如下：
    1. `src/test/java` Java 测试源代码
    2. `src/test/resources` 测试需要用的配置文件
    3. `src/test/filters` 包含一些配置文件，这些配置文件的作用是在编译时向 `resource` 中的文件注入值。

