---
title: 3-Maven Profile
description: 描述 Maven 的 Profile 概念
toc: true
authors: []
date: 2023-02-01T15:15:46+08:00
lastmod: 2022-02-01T15:15:46+08:00
draft: false
---

## 1. 概述

Maven Profile 可以被用来创建自定义的构建配置，例如指定一个测试力度，或者是指定部署环境。

## 2. 简单例子

1. 通常，我们运行 `mvn package`，单元测试也会被执行，如果我们不希望执行单元测试，可以使用如下的 profile 配置：

```xml
  <profiles>
    <profile>
      <id>no-tests</id>
      <properties>
        <maven.test.skip>true</maven.test.skip>
      </properties>
    </profile>
  </profiles>
```

2. 然后通过命令 `mvn package -Pno-tests` 来执行该 profile。
3. 现在工程被打包，并且测试也被跳过了。

## 3. 声明 Profiles

1. 通过指定不同的 id，我们可以创建无数个 profile。
2. 我们可以创建一个 profile 来运行集成测试，也可以定义另一个 profile 来运行变异测试。

```xml
  <profiles>
    <profile>
      <id>integration-tests</id>
    </profile>
    <profile>
      <id>mutation-tests</id>
    </profile>
  </profiles>
```

3. 在每一个 profile 元素内，我们可以配置许多元素，例如 dependencies，plugins，resources 和 finalName。
4. 所以对上面的例子，我们可以对两个 profile 分别添加依赖和插件。

### 3.1. profile 作用域

1. 之前，我们仅仅把 profiles 元素放在了 pom.xml 文件中，这样只会对该项目有效。
2. 但是在 Maven 3 中，我们可以在如下位置添加 profiles：
    1. 项目范围：pom.xml 文件
    2. 用户范围：用户目录下的 settings.xml 文件
    3. 全局范围：全局 settings.xml 文件

## 4. 激活 Profile

### 4.1. 查看那个 profile 被激活

1. 可以使用 `help:active-profiles` 来查询在我们默认的构建流程中，哪个 profile 被激活，一般情况下，查询结果为空。
2. 另一种查看方式是将 `maven-help-plugin` 插件添加到 pom.xml 中，然后将其绑定到构建阶段下的 active-profile 目标上。

```xml
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-help-plugin</artifactId>
        <version>3.2.0</version>
        <executions>
          <execution>
            <id>show-profile</id>
            <phase>compile</phase>
            <goals>
              <goal>active-profiles</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
```

### 4.2 使用 -P 选项

1. 我们可以使用 -P 选项来激活指定的 profile。

```bash
mvn package -P integration-tests
```

打印如下：

```bash
The following profiles are active:

 - integration-tests (source: com.ans20xx:demo01:1.0-SNAPSHOT)

```

2. 如果我们想要一次激活多个 profile，我们可以使用如下命令：

```bash
mvn package -P integration-tests,mutation-tests
```

### 4.3. 默认激活

1. 如果我们想要默认情况下执行某一个 profile，可以这样配置

```xml
    <profile>
      <id>integration-tests</id>
      <activation>
        <activeByDefault>true</activeByDefault>
      </activation>
    </profile>
```

2. 然而，如果我们显式指定了 profile，那么默认的 profile 会被覆盖

