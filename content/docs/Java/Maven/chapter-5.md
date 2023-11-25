---
title: 5-Maven 插件管理
description: 描述 Maven 的插件管理
toc: true
authors: []
date: 2023-02-04T10:30:46+08:00
lastmod: 2022-02-04T10:30:46+08:00
draft: false
---

## 1. 概述

1. Maven 利用插件来自动化和执行所有的构建和生成报告的任务。
2. 然而，项目中可能由多个相同的插件，它们的配置和版本都不一样，特别在多模块的项目中，这会让项目变得复杂，难以维护。


## 2. 插件配置

1. Maven 有两种类型的插件：
    * Build - 在构建过程中执行，例如 Clean、Install 和 Surefire 插件，这些插件应该被配置在 pom 文件的 build 部分。
    * Reporting - 在 site 阶段执行来生成多个项目报告，例如 Javadoc 和 Checkstyle 插件，这些在 pom 文件的 reporting 部分配置。
2. 我们可以在 pom 文件中声明 jar 插件，用来将我们的项目打包成 jar 文件：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-jar-plugin</artifactId>
            <version>3.2.0</version>
        </plugin>
    </plugins>
</build>
```

## 3. 插件管理

1. 我们也可以在 `pluginManagement` 标签内声明插件。
2. 如果在 `pluginManagement` 标签内声明插件，它将会对所有的子 POM 文件生效。
3. 这意味着在子 pom 文件中不需要显示指定版本号，同时也不会有重复的配置或冲突的版本。
4. 和依赖管理一样，在多模块项目中使用该方法非常有用。

## 4. 示例

1. 下面是一个包含两个子模块的多模块项目。
2. 在父 POM 文件中，我们添加了 Build Helper 插件。

### 4.1. 父 POM 文件

1. 首先，在父 POM 文件的 pluginManagement 部分添加插件
2. 该插件将 add-resource 目标绑定到 generate-resources 阶段
3. 同样，我们也指定 `src/resources` 目录作为包含额外资源的目录
4. 该插件会将资源拷贝到目标位置

```xml
<pluginManagement>
    <plugins>
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>build-helper-maven-plugin</artifactId>
            <version>3.3.0</version>
            <executions>
                <execution>
                    <id>add-resource</id>
                    <phase>generate-resources</phase>
                    <goals>
                        <goal>add-resource</goal>
                    </goals>
                    <configuration>
                        <resources>
                            <resource>
                                <directory>src/resources</directory>
                                <targetPath>json</targetPath>
                            </resource>
                        </resources>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</pluginManagement>
```

### 4.2. 子 POM 配置

1. 现在在子 POM 文件中引用该插件：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>build-helper-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

2. 和依赖管理相似，我们不需要指定任何插件的版本号，因为它们会从父 POM 文件中集成。

## 5. 核心插件

1. 有一些 Maven 核心配置在整个生命周期中被默认使用，例如 clean 和 compiler 插件不需要被显式指定。
2. 然而我们可以在 pluginManagement 中显式指定这些信息。
3. 主要的区别在于核心插件默认会生效并自动执行，并不需要在子项目中传递引用。
4. 下面我们在 pluginManage 中添加编译插件：

```xml
<pluginManagement>
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.10.0</version>
        <configuration>
            <source>1.8</source>
            <target>1.8</target>
        </configuration>
    </plugin>
</pluginManagement>
```

5. 这里我们锁定了插件的版本号，并且配置使用 Java 8 来构建项目，然而我们并不需要在子项目中额外声明插件。
6. 构建框架默认激活这些配置。
7. 因此，推荐在多模块项目中在 pluginManagement 中显式指定插件的配置并且锁定插件的版本。
