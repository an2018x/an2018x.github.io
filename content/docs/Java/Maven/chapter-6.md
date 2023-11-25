---
title: 6-Maven 目标和阶段
description: 深入分析 Maven 的目标和阶段
toc: true
authors: []
date: 2023-02-04T10:30:46+08:00
lastmod: 2022-02-04T10:30:46+08:00
draft: false
---

## 1. 概述

1. 本文将会探索不同的 Maven 构建声明周期和它们的阶段。
2. 也会深入讨论目标和阶段之间的核心关联。

## 2. Maven 构建生命周期

1. Maven 构建遵循一个指定的生命周期来部署和分发目标项目
2. 有三种内置的生命周期：
    * 默认(default)：主生命周期，负责项目的部署。
    * 清理(clean)：清理项目并且移除所有由先前的构建产生的文件。
    * 建立站点(site)：创建整个项目的文档
3. 每个生命周期由若干个阶段(phase)组成，默认的构建生命周期包含 23 个阶段
4. clean 生命周期包含三个阶段，site 生命周期包含 4 个阶段

## 3. Maven 阶段

1. 一个 Maven 阶段代表 Maven 构建生命周期其中的一个步骤。
2. 每一个阶段都代表一个指定的任务。
3. 默认生命周期下关键的一些阶段如下：
    * validate：检查所有供构建需要的必要信息都足够完备
    * compile：编译源代码
    * test-compile：编译测试源代码
    * test：运行单元测试
    * package：将编译后的源代码进行打包
    * integration-test：如果需要运行集成测试，则处理和部署包
    * install：将包安装到本地仓库
    * deploy：将包复制到远程仓库
4. 阶段按照指定的顺序指定，也就是说，如果我们执行命令 `mvn <phase>` 那么它不仅仅会只执行指定的阶段，也会执行前置的所有阶段。
5. 例如，如果我们运行部署阶段，那么它会执行之前的所有完整阶段

## 4. Maven 目标(Goal)

1. 每一个阶段都是由一系列目标构成的，每一个阶段都对应一个指定的任务。
2. 当我们执行一个阶段时，所有绑定到该阶段上的目标都被按顺序执行（在 POM 文件中定义的顺序）。
3. 下面是一些阶段和该阶段上绑定的默认的目标
    * compiler:compile：编译插件上的编译目标被绑定到编译阶段
    * compiler:testCompile: 被绑定到 test-compile 阶段
    * surefire:test: 被绑定到 test 阶段
    * install: 被绑定到 install 阶段
    * jar:jar 和 war:war： 被绑定到 package 阶段
4. 可以使用命令 `mvn help:describe -Dcmd=PHASENAME` 来列出绑定到某一个阶段的目标和插件

## 5. Maven 插件

1. Maven 插件是一组目标，然而这些目标不必绑定到相同的阶段。
2. 例如，下面是 Maven Failsafe 插件的简单配置，它被用来执行集成测试：

```xml
<build>
    <plugins>
        <plugin>
            <artifactId>maven-failsafe-plugin</artifactId>
            <version>${maven.failsafe.version}</version>
            <executions>
                <execution>
                    <goals>
                        <goal>integration-test</goal>
                        <goal>verify</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

3. 可以看到，Failsafe 插件配置了两个主要的目标：

    1. integration-test：运行集成测试
    2. verify：验证所有的集成测试是否通过

4. 可以使用如下的命令来列出绑定到 failsafe 插件的所有目标：

```shell
mvn failsafe:help
```

5. 为了执行一个特定的目标而不是执行整个阶段和前置阶段，可以使用命令

```shell
mvn <plugin>:<goal>
```

## 6. 构建一个 Maven 项目

1. 为了构建一个 Maven 项目，我们需要执行其中一个生命周期，下面的命令将会执行完整的默认生命周期：

```shell
mvn deploy
```

2. 相反，下面的命令会在执行完 install 阶段时停止下来：

```shell
mvn install
```

3. 但是通常，我们会在构建之前运行 clean 生命周期：

```shell
mvn clean install
```

4. 我们可以只运行插件的其中一个目标：

```shell
mvn compiler:compile
```