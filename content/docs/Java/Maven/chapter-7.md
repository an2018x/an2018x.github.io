---
title: 7-Maven 多模块项目
description: Maven 多模块项目如何创建
toc: true
authors: []
date: 2023-02-04T10:30:46+08:00
lastmod: 2022-02-04T10:30:46+08:00
draft: false
---

## 1. 概述

1. 本文主要描述 Maven 多模块项目如何创建。
2. 描述什么是多模块项目以及使用该方法的好处。

## 2. Maven 的多模块项目

1. 一个多模块项目根据一个聚合 pom 文件构建，该文件管理一组子模块。
2. 在大多数情况下，聚合 pom 文件位于项目的根目录下，并且打包方式为 pom。
3. 子模块是常规的 Maven 项目，并且它们也能被单独构建。
4. 通过聚合 POM 来构建项目，每个打包方式不为 pom 的项目都会被打包进最终的项目文件中。

## 3. 使用多模块的好处

1. 最显著的好处是我们能够减少重复和冲突。
2. 假设我们有包含若干个模块的应用程序，一个前端模块和一个后端模块。
3. 现在想象我们在它们之上构建项目，并且修改配置对二者都生效的配置项，使用多模块就很容易办到。


## 4. 父 POM 

1. Maven 通过让每个 pom 文件都有父 pom 文件来支持继承。
2. 除了继承，Maven 还提供了聚合的概念，一个支持聚合的父 POM 文件被称为聚合 POM，这种 POM 在它的 pom 文件中声明聚合的模块。

## 5. 子模块

1. 子模块，或者子项目，是继承自父 POM 文件的常规项目。
2. 继承可以让子项目共享配置和依赖。
3. 然而，如果我们想要一起编译和发布项目，就必须要在父 POM 文件中显式声明。

## 6. 构建应用程序

现在我们创建一个程序来演示这项功能，该程序包含三个模块：

1. 领域核心模块
2. 提供 REST 接口的 web 服务模块
3. 包含用户可视化资源的 webapp

### 6.1. 生成父 POM 文件

1. 首先，需要创建一个父项目：

```shell
mvn archetype:generate -DgroupId=com.baeldung -DartifactId=parent-project
```

2. 父项目一旦被创建，我们需要打开 pom.xml 文件夹，并且添加打包方式为 pom：

```shell
<packaging>pom</packaging>
```

3. 通过设置 pom 类型的打包方式，我们声明该项目将会是一个父项目，或者是一个聚合项目，它不会生成打包内容。
4. 当我们的聚合完成后，我们可以生成我们的子模块。

### 6.2. 创建子模块

1. 在创建子模块之前，需要确认我们在父项目的文件夹中，然后运行如下生成指令：

```bash
cd parent-project
mvn archetype:generate -DgroupId=com.baeldung -DartifactId=core
mvn archetype:generate -DgroupId=com.baeldung -DartifactId=service
mvn archetype:generate -DgroupId=com.baeldung -DartifactId=webapp
```

2. 在父项目的 pom 文件中，我们需要在 modules 部分添加所有的子模块：

```xml
<modules>
 <module>core</module>
 <module>service</module>
 <module>webapp</module>
</modules>
```

3. 在每个子模块中，我们需要在 `<parent>` 元素内部添加父模块：

```xml
<parent>
 <artifactId>parent-project</artifactId>
 <groupId>com.baeldung</groupId>
 <version>1.0-SNAPSHOT</version>
</parent>
```

4. 注意，每个子模块只能由有一个父模块

### 6.3. 构建项目

1. 现在，我们可以一次构建所有的三个项目：

```bash
mvn package
```

2. 该命令会构建所有的模块，我们可以看到命令的输出如下：

```bash
[INFO] Scanning for projects...
[INFO]
------------------------------------------------------------------------
[INFO] Reactor Build Order:
[INFO] parent-project
[pom]
[INFO] core
[jar]
[INFO] service
[jar]
[INFO] webapp
[war]
[INFO] Reactor Summary for parent-project 1.0-SNAPSHOT:
[INFO] parent-project ..................................... SUCCESS [ 0.272 s]
[INFO] core ............................................... SUCCESS [ 2.043 s]
[INFO] service ............................................ SUCCESS [ 0.627 s]
[INFO] webapp ............................................. SUCCESS [ 0.572 s]
[INFO]
------------------------------------------------------------------------[INFO]
BUILD SUCCESS
[INFO]
------------------------------------------------------------------------
```

3. 此外，Maven Reactor也会分析我们的项目并且按照指定的顺序来构建项目，所以如果我们的 webapp 模块依赖 service 模块，Maven 将会首先构建 service，然而再构建 webapp。

### 6.4. 在父项目中启用依赖管理

1. 依赖管理是一种在多模块项目中集中依赖信息的机制。
2. 当我们有一些项目或模块依赖一个公共的父项目时，我们可以把所有需要的依赖信息都放在公共的 pom.xml 文件中。

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>5.3.16</version>
        </dependency> //... 
    </dependencies>
</dependencyManagement>
````

3. 通过在父项目中声明 spring-core 的版本号，所有依赖它的项目都只需要声明 groupId 和 artifactId 即可，version 将会被继承：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-core</artifactId>
    </dependency>
    //...
</dependencies>
```

4. 此外，我们还可以在父项目中剔除依赖，所以指定的库不会被子项目继承：

```xml
<exclusions>
    <exclusion>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
    </exclusion>
</exclusions>
```

5. 最后，如果一个子模块需要使用不同于父项目的版本号，可以自行指定版本号来覆盖父项目中的配置：

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>4.3.30.RELEASE</version>
</dependency>
```

### 6.5. 更新子模块并构建项目

1. 我们可以修改每一个子模块的打包方式。