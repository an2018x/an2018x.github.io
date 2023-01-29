---
title: 1-Maven 简介
description: Maven 是什么，有什么用
toc: true
authors: []
date: 2022-11-29T15:15:46+08:00
lastmod: 2022-11-29T15:15:46+08:00
draft: false
---

## 1. 构建应用程序

1. 构建一个应用程序往往由以下几个步骤组成：
    1. 下载依赖
    2. 将依赖 jar 包放在 classpath 目录下
    3. 将源代码编译为二进制码
    4. 运行测试
    5. 将编译结果打包成可部署的软件包：jar、war 等
    6. 将工程发布到服务器或者仓库中
2. Apache Maven 将这些步骤自动化，减少了人工操作带来的错误

## 2. 为什么用 Maven

Maven 有如下优势：

1. 遵循最佳实践来创建简单应用：Maven 通过引入项目模板(archetypes)来尽量避免项目的配置。
2. 依赖管理：Maven 包含自动下载、更新、验证兼容性和处理传递依赖。
3. 隔离项目依赖和项目插件：在 Maven 中，项目依赖从依赖仓库中获取，插件依赖从插件仓库中获取，这样当插件下载额外的依赖时会带来更少的冲突。
4. 中央仓库：项目依赖可以从本地文件系统或者公开仓库中获取，例如 https://central.sonatype.dev/


## 3. 安装 Maven

### 3.1. 简介

1. Maven 是构建和管理任何 Java 项目的命令行工具。
2. Maven 项目提供了预先编译好的软件包，并压缩为一个 zip 文件（绿色版），可以直接解压运行。
3. 由于没有使用 installer（安装器）安装，所以，我们需要自己设置 maven 程序的依赖和环境变量。
4. 安装步骤简单来说就是解压下载好的 maven 软件包，然后将解压后的目录添加到环境变量中，这样我们可以直接在终端中运行 mvn 命令。

### 3.2. 前置准备

1. 因为 Maven 是基于 Java 开发的，所以系统中需要安装 [Java](https://www.oracle.com/java/technologies/downloads/)，并配置好环境变量。
2. 运行 `java -version` 如果不报错，则可以进行下一步。


### 3.3. 在 Windows 中安装

1. Maven 下载地址：

https://maven.apache.org/download.cgi

2. 下载对应平台的压缩包
3. 解压缩该文件夹，然后添加 `M2_HOME` 和 `MAVEN_HOME` 环境变量，使其指向 maven 根目录。
4. 在 PATH 环境变量中添加 `%M2_HOME%\bin`，这样就安装完成了。
5. 运行 `mvn -version` 命令，如果没有异常，则表示安装成功。

### 3.4. 在 Linux 中安装

1. 下载文件 `apache-maven-3.8.4-bin.tar.gz`
2. 创建并解压到 Maven 根目录：

```bash
$ mkdir -p /usr/local/apache-maven/apache-maven-3.8.4
$ tar -xvf apache-maven-3.8.4-bin.tar.gz -C /usr/local/apache-maven/apache-maven-3.8.4
```
3. 将 Maven 添加到环境变量中：

打开 ~/.bashrc

```bash
$ vim ~/.bashrc
```
追加如下内容：

```bash
export M2_HOME=/usr/local/apache-maven/apache-maven-3.8.4 
export M2=$M2_HOME/bin 
export MAVEN_OPTS=-Xms256m -Xmx512m 
export PATH=$M2:$PATH
```
重新加载配置文件：

```bash
$ source ~/.bashrc
```

4. 运行 `mvn -version` 命令，验证是否安装成功。

5. 对于 Ubuntu，也可以直接输入如下命令来安装：

```bash
$ sudo apt-get install maven
```

## 4. 项目对象模型(Project Object Model, POM)

1. Maven 通过项目对象模型（POM）来配置 Maven 项目，通常该模型以 xml 文件的方式保存为 `pom.xml`。
2. POM 描述了整个项目的结构，管理依赖，并且配置项目运行的插件。
3. POM 文件也描述了包含多个模块的 Java 项目中模块的关系。
4. POM 文件的典型结构如下：

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.test</groupId>
    <artifactId>test</artifactId>
    <packaging>jar</packaging>
    <version>1.0-SNAPSHOT</version>
    <name>com.test</name>
    <url>http://maven.apache.org</url>
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-api</artifactId>
            <version>5.8.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                //...
            </plugin>
        </plugins>
    </build>
</project>
```

### 4.1. 项目标识符

1. Maven 使用项目标识符，也被称为坐标，来唯一定位一个项目，并且指定项目应该如何被打包。
2. 项目标识符由如下几个部分组成：
    * groupId - 表示创建项目的公司或阻止的唯一标识。
    * artifactId - 项目的唯一名称。
    * version - 项目的版本号
    * packaging - 项目的打包方式
3. 前三项(groupId:artifactId:version)组成了唯一标识符，我们会使用该方式来定位我们需要的外部依赖库。

### 4.2. 依赖

1. 程序使用的外部库被称为依赖。
2. Maven 提供的依赖管理能力允许我们自动从中央仓库下载库，因此我们不需要事先在本地存放这些外部依赖。
3. 下面是声明一个外部依赖的常见格式：

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.16</version>
</dependency>
```

### 4.3. 仓库

1. Maven 中的仓库被用来保存构建结果和项目的依赖。
2. Maven 中的本地仓库默认被存放在 `~/.m2/repository` 目录下。
3. 如果依赖工程或插件可以在本地仓库中被找到，Maven 就直接使用，否在它就会从默认的中央仓库中下载到本地仓库中。
4. 有些库，例如 JBoss Server，无法从中央仓库中下载，但是可以从另外一个仓库下载。对于这些库，我们可以在 pom 文件的 respositories 标签中新增一个仓库：

```xml
<repositories>
    <repository>
        <id>JBoss repository</id>
        <url>http://repository.jboss.org/nexus/content/groups/public/</url>
    </repository>
</repositories>
```

### 4.4. 属性

1. 自定义属性可以让 pom 文件更易于阅读和维护。
2. 通常我们用自定义属性来保存版本号信息。
3. 可以在 `properties` 标签下指定自定义的属性，定义完成后，我们可以在 pom 文件的任何地方使用 `${属性名}` 来引用这个属性：

```xml
<properties>
    <spring.version>5.3.16</spring.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-core</artifactId>
        <version>${spring.version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>${spring.version}</version>
    </dependency>
</dependencies>
```

4. 如果我们后续想要升级 Spring 的版本，那我们就直接修改 `spring.version` 标签中的内容即可。
5. 属性也常用来指定构建目录的位置：

```xml
<properties>
    <project.build.folder>${project.build.directory}/tmp/</project.build.folder>
</properties>
<plugin> 
    //... 
    <outputDirectory>${project.resources.build.folder}</outputDirectory>
    //... 
</plugin>
```

### 4.5. 构建(Build)

1. `<build>` 标签中为默认 Maven 目标提供了一些额外信息：
    * 项目编译后存放的目录
    * 应用最终的名称
2. 默认情况下， `<build>` 标签中的内容如下：
```xml
<build>
    <defaultGoal>install</defaultGoal>
    <directory>${basedir}/target</directory>
    <finalName>
        ${artifactId}-${version}
    </finalName>
    <filters>
        <filter>filters/filter1.properties</filter>
    </filters>
    //... 
</build>
```
3. 默认的输出目录名称为 target，构建名称为 `artifactId-version`。

### 4.6. 使用配置 (Profiles)

1. Profile 是一组配置值。
2. 通过 profile，我们可以自定义不同环境下的构建流程，例如 `Production/Test/Development`。

```xml
<profiles>
    <profile>
        <id>production</id>
        <build>
            <plugins>
                <plugin>
                    //...
                </plugin>
            </plugins>
        </build>
    </profile>
    <profile>
        <id>development</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <build>
            <plugins>
                <plugin>
                    //...
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

3. 运行示例如下：

```bash
mvn clean install -Pproduction
```

## 5. Maven 构建生命周期

1. 每次 Maven 构建都遵循一个指定的生命周期
2. 我们可以执行数个构建生命周期目标，包括：
    * 编译项目的代码
    * 创建一个包
    * 在本地 Maven 依赖仓库中安装项目文件

### 5.1. 生命周期阶段 (Phases)

1. validate - 检查项目的正确性
2. compile - 将项目源代码编译成为二进制工程
3. test - 执行单元测试
4. packge - 将编译后的代码打包
5. integration-test - 执行需要打包的额外的测试
6. verify - 验证包是否合法
7. install - 安装包文件到本地 Maven 仓库
8. deploy - 部署包文件到远程服务器或仓库

### 5.2. 插件和目标

1. 一个 Maven 插件是一个或多个目标的集合
2. 目标在生命周期阶段中执行
3. 生命周期阶段可以帮助确定目标的执行顺序
4. maven 官方提供的可用的插件在这个链接 https://maven.apache.org/plugins/ 中可以看到
5. 要知道每个生命周期阶段中执行了哪些目标，可以在这个链接中看到 https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html#Built-in_Lifecycle_Bindings
6. 可以通过 `mvn <phase>` 来执行任何一个阶段，注意之前在该生命周期之前的所有阶段也都会被执行，实际上就是执行到某一个阶段
7. 注意：目标是由插件提供的，但是它也和各种生命周期阶段关联


## 6. 创建第一个 Maven 项目

### 6.1. 生成一个简单的 Maven 项目

1. 运行如下命令：

```bash
mvn archetype:generate \
    -DgroupId=com.ans20xx \
    -DartifactId=demo01 \
    -DarchetypeArtifactId=maven-archetype-quickstart \
    -DarchetypeVersion=1.4 \
    -DinteractiveMode=false
```

2. groupId 指定了创建项目的组织或个人，通常是公司域名的倒序
3. artifactId 是项目的根包名
4. 因为我们没有设置版本和打包类型，因此这些值将会被设置为默认值，版本号将会被设置为 1.0-SNAPSHOT，打包方式将会被设置为 jar 包方式
5. 如果不确定需要用哪些参数，可以指定 `interactiveMode=true`，它将会引导你完成项目设置
6. 命令执行结束后，会获得一个包含 App.java 文件的 Java 项目，它被放在 `src/main/java` 目录下，还有一个测试文件 `AppTest.java`，它被放在 `src/test/java` 下面。
7. 生成的 pom 文件如下：
```xml
<?xml version="1.0" encoding="UTF-8"?>

<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.ans20xx</groupId>
  <artifactId>demo01</artifactId>
  <version>1.0-SNAPSHOT</version>

  <name>demo01</name>
  <!-- FIXME change it to the project's website -->
  <url>http://www.example.com</url>

  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.11</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
```

可以看到，JUnit 依赖被默认提供。

### 6.2. 编译和打包项目

1. 编译项目：

```bash
mvn compile
```

该命令会执行默认生命周期下直到 compile 的所有阶段。

2. 运行项目测试：

```bash
mvn test
```

3. 打包：

```bash
mvn package
```

### 6.3. 运行项目

1. 最后，我们要使用 `exec-maven-plugin` 来运行 Java 项目。
2. `pom.xml` 中相关插件配置如下（如果爆红，运行 mvn clean 即可）：

```xml
<build>
    <sourceDirectory>src</sourceDirectory>
    <plugins>
        <plugin>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.6.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>exec-maven-plugin</artifactId>
            <version>3.0.0</version>
            <configuration>
                <mainClass>com.ans20xx.App</mainClass>
            </configuration>
        </plugin>
    </plugins>
</build>
```

3. 第一个插件 `maven-compiler-plugin`，负责使用 Java 1.8 来编译源代码。
4. `exec-maven-plugin` 用来在项目中搜索主类。
5. 运行 `mvn exec:java` 来运行项目。