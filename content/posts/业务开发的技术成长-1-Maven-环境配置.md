
---
title: "业务开发的技术成长 1 Maven 环境配置"
date: 2022-11-06T16:03:57+08:00
draft: false
description: 关于Java项目Maven环境配置
toc: true
---

[maven环境配置](https://www.bilibili.com/video/BV1ur4y1L72V/)


Maven 当前仓库使用阿里免费的仓库进行发布，免去了自建 nexus 的麻烦。需要将 `setting.xml` 放在 `~/.m2` 目录下。


开发一个简单应用时，只需要继承 spring-boot-parent 这个 POM 文件就足够了。


对于复杂项目，也需要有一个基础的 POM 文件。


这个基础的 POM 文件，需要处理例如 SpringCloud、SpringBoot 等基础体系。


[02:54](https://www.bilibili.com/video/BV1ur4y1L72V/#t=174.764124)

Maven 还需要一个脚手架，根据脚手架命令直接生成项目。


[03:31](https://www.bilibili.com/video/BV1ur4y1L72V?t=211.2)

也会使用 Maven 插件的功能，这里主要使用了几个代码生成器和打包插件。


[04:42](https://www.bilibili.com/video/BV1ur4y1L72V?t=282.2)

代码生成器的作用是可以生成关于这个领域对象所有代码，例如 Service、DAO、Mapper、Request 等。


[05:47](https://www.bilibili.com/video/BV1ur4y1L72V?t=347.3)

IDEA Setting 文件提供了几个模板。

