---
title: 4-Maven 依赖作用域
description: 描述 Maven 依赖作用域
toc: true
authors: []
date: 2023-02-04T10:15:46+08:00
lastmod: 2022-02-04T10:15:46+08:00
draft: false
---

## 1. 概述

1. 下面的内容将描述 Maven 的依赖作用域-它能帮助 Maven 解决间接依赖。

## 2. 间接依赖

1. Maven 中有两种形式的依赖：直接依赖和间接依赖。
2. 直接依赖是我们在项目中显式声明的依赖，例如：

```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.12</version>
</dependency>
```

3. 间接依赖就是直接依赖的依赖。
4. Maven 会自动导入项目中的间接依赖。
5. 可以使用 `mvn dependency:tree` 来列出项目中的所有依赖：

```shell
[INFO] --- maven-dependency-plugin:2.8:tree (default-cli) @ demo01 ---
[INFO] com.ans20xx:demo01:jar:1.0-SNAPSHOT
[INFO] \- junit:junit:jar:4.11:test
[INFO]    \- org.hamcrest:hamcrest-core:jar:1.3:test
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  0.566 s
[INFO] Finished at: 2023-02-04T09:33:56+08:00
[INFO] ------------------------------------------------------------------------
```

## 3. 依赖作用域

1. 依赖作用域可以被用来限制间接依赖。
2. 依赖作用域也会根据不同的构建任务来修改 classpath。
3. Maven 有六种依赖作用域。
4. 除了 `import` 作用域之外的其他作用域都会对间接依赖产生影响。

## 3.1. compile 作用域

1. 当没有显式指定作用域时，`compile` 是默认的作用域。
2. 在该作用域上的依赖会出现在所有的构建任务中的 classpath 内。
3. 这些依赖也会被传递给子项目。

## 3.2. provided 作用域

1. 使用 provided 作用域表示该依赖在运行时由 JDK 或容器提供。
2. 该作用域的一个使用例子是在容器中部署 web 应用，而这些容器本身也提供了一些依赖，例如 tomcat 容器本身会提供 servlet api。

```xml
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
    <scope>provided</scope>
</dependency>
```

3. `provided` 作用域的依赖值存在与 compile 和 test 的 classpath 中，在打包时并不会打到包中。
4. 该作用域的依赖不可传递。


## 3.3. Runtime 作用域

1. 该作用域下的依赖在运行时需要，但是我们在编译期不需要。
2. 所以，该作用域下的依赖会出现在运行时和测试的 classpath 中，但不会出现在编译时的 classpath 中。
3. jdk 驱动就是运行时需要的依赖：

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.28</version>
    <scope>runtime</scope>
</dependency>
```

## 3.4. Test 作用域

1. 该作用域用来说明依赖只有在测试时才需要。
2. 测试作用域下的依赖是不可传递的，只出现在 test 和 execution classpath 中。
3. JUnit 是一个典型的例子：

```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.12</version>
    <scope>test</scope>
</dependency>
```

## 3.5. System 作用域

1. System 作用域和 Provided 作用域非常类似。
2. 区别在于 System 作用域需要我们直接指定系统中的某个指定的 jar 包。
3. 然而，需要注意的是 System 作用域已经被废弃了，因为它会让在不同机器上指定的值都不相同。

```xml
<dependency>
    <groupId>com.baeldung</groupId>
    <artifactId>custom-dependency</artifactId>
    <version>1.3.2</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/libs/custom-dependency-1.3.2.jar</systemPath>
</dependency>
```

## 3.6. Import 作用域

1. `import` 作用域仅适用于 pom 类型的依赖。
2. `import` 说明该依赖应该被替换为声明在该 pom 文件中的所有有效依赖。
3. 下面的例子中，`customer-project` 依赖会被替换为在 customer-project 的 pom 文件中 `<dependencyManagement>` 元素内的所有依赖：

```xml
<dependency>
    <groupId>com.baeldung</groupId>
    <artifactId>custom-dependency</artifactId>
    <version>1.3.2</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/libs/custom-dependency-1.3.2.jar</systemPath>
</dependency>
```

## 4. 作用域和传递性

1. 每个依赖作用域都会影响间接依赖。
2. 也就是说，间接依赖最终会以不同的作用域出现在项目中。
3. 然而，`provided` 和 `test` 作用域的依赖并不会被包含在主项目中。
4. 对于 compile 作用域，所有 runtime 作用域的依赖将会以 runtime 作用域被添加到项目中，所有 compile 作用域的依赖将会以 compile 作用域被添加到项目中。
5. 对于 provided 作用域，所有 runtime 和 compile 作用域的依赖都会以 provided 作用域被添加到项目中。
6. 对于 test 作用域，所有 runtime 和 compile 作用域的依赖都会以 test 作用域添加到项目中。
7. 对于 runtime 作用域，所有 runtime 和 compile 作用域的依赖都会以 runtime 作用域添加到项目中。

https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html

