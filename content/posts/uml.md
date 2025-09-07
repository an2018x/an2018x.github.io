---
title: "技术文档"
date: '2025-09-07'
draft: false
description: 整理常用的技术文档操作
toc: true
---

# 在线编辑

plantUML

https://www.plantuml.com/plantuml/uml/SyfFKj2rKt3CoKnELR1Io4ZDoSa700001

mermaid:

https://mermaid-live.nodejs.cn/edit

# 类图


## 简介

类用于描述系统中具有相似角色的对象，包括：
* 结构特征（属性）
    * 代表了类对象的状态
    * 类结构和静态特征的描述
* 行为特征（操作）
    * 对象能够执行的动作
    * 对象之间可能的交互方式

## 组成

```plantuml
@startuml
' 格式：class 类名 {
'   可见性  属性名: 类型 [= 默认值]
'   可见性  方法名(参数: 类型): 返回值
' }
class Person {
  - id: int          ' 私有属性（- 表示 private）
  # name: String     ' 保护属性（# 表示 protected）
  ~ age: int = 18    ' 包私有属性（~ 表示 package-private，默认值可选）
  + gender: String   ' 公有属性（+ 表示 public）
  
  - calculateBirthYear(): int  ' 私有方法
  # getName(): String          ' 保护方法
  ~ setAge(newAge: int): void  ' 包私有方法
  + eat(food: String): void    ' 公有方法
  + sleep(hours: int): void    ' 公有方法
}
@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907212607.png)

```mermaid
classDiagram
    class Person {
    - id: int          ' 私有属性（- 表示 private）
    # name: String     ' 保护属性（# 表示 protected）
    ~ age: int = 18    ' 包私有属性（~ 表示 package-private，默认值可选）
    + gender: String   ' 公有属性（+ 表示 public）
    
    - calculateBirthYear(): int  ' 私有方法
    # getName(): String          ' 保护方法
    ~ setAge(newAge: int): void  ' 包私有方法
    + eat(food: String): void    ' 公有方法
    + sleep(hours: int): void    ' 公有方法
    }
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907213133.png)


## 类之间的关系

### 继承

```plantuml
@startuml
class Animal {  
  + name: String
  + eat(): void
}

class Dog {
  ' Dog特有的方法
  + bark(): void  
}
class Cat {
  ' Cat特有的方法
  + meow(): void  
}

Animal <|-- Dog  
Animal <|-- Cat  

' 子类可添加自己的属性/方法
@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907214114.png)

mermaid

```mermaid
classDiagram

class Animal {  
    + name: String
    + eat(): void
}

class Dog {
    + bark(): void  
}
class Cat {
    + meow(): void  
}

Animal <|-- Dog  
Animal <|-- Cat  
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907214336.png)

### 实现

代表类实现接口

```plantuml
@startuml
' 定义接口
interface IMovable {
  ' 接口方法（无实现，仅定义规范）
  + move(): void  
}

' 实现类的具体方法
class Car {
  + move(): void 
}
class Bicycle {
  + move(): void
}

' 类实现接口
' Car实现IMovable
IMovable <|.. Car  
' Bicycle实现IMovable
IMovable <|.. Bicycle
@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907215038.png)

```mermaid
classDiagram
%% 定义接口（PlantUML中接口也用class定义，可加I前缀标识）
class IMovable {
  %%  接口方法（无实现，仅定义规范）
  + move(): void  
}

%%  实现类的具体方法
class Car {
  + move(): void 
}
class Bicycle {
  + move(): void
}

%%  类实现接口
%%  Car实现IMovable
IMovable <|.. Car  
%%  Bicycle实现IMovable
IMovable <|.. Bicycle 
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907215146.png)

### 聚合

整体-部分的关系，部分可以脱离整体。

```plantuml
@startuml
' 整体：班级
class Class {  
  + className: String
}
' 部分：学生
class Student {  
  + name: String
}

' 空心菱形在Class侧，说明Class是整体
Class o-- Student : 包含
@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907215415.png)


```mermaid
classDiagram
%% 整体：班级
class Class {  
  + className: String
}
%% 部分：学生
class Student {  
  + name: String
}

%% 空心菱形在Class侧，说明Class是整体
Class o-- Student : 包含
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907215701.png)

### 组合

部分不能脱离整体而存在，心脏不能脱离人体而存在。

```plantuml
@startuml 组合关系
' 整体：人
class Person {  
  + name: String
}

' 部分：心脏
class Heart {  
  + beat(): void
}

Person *-- Heart : 拥有  
@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907220139.png)


```mermaid
classDiagram
%% 整体：人
class Person {  
  + name: String
}

%% 部分：心脏
class Heart {  
  + beat(): void
}

Person *-- Heart : 拥有 
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907220308.png)

### 依赖

临时依赖，一个类使用另一个类的方法，但是没有长期依赖。

```plantuml
@startuml 依赖关系
' 依赖类：订单业务类
class OrderService {  
  + calculateTotal(order: Order): double
}
' 被依赖类：订单数据类
class Order {  
  + price: double
  + quantity: int
}

' 虚线箭头指向Order
OrderService ..> Order : 依赖（计算总价）  
@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907220707.png)


```mermaid
classDiagram
%% 依赖类：订单业务类
class OrderService {  
  + calculateTotal(order: Order): double
}
%% 被依赖类：订单数据类
class Order {  
  + price: double
  + quantity: int
}

%% 虚线箭头指向Order
OrderService ..> Order : 依赖（计算总价）  
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907220931.png)


### 关联

表示类之间的普通联系，例如用户有订单，老师教学生。

```plantuml
@startuml 双向关联
class Teacher {
  + name: String
}
class Student {
  + name: String
}
' 双向关联：老师和学生互相关联
Teacher "1"--"1..n" Student  
@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907221201.png)

```mermaid
classDiagram
class Teacher {
  + name: String
}
class Student {
  + name: String
}
%% 双向关联：老师和学生互相关联
Teacher "1"--"1..n" Student  
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907221350.png)

# 组件图

组件图是一种结构图，用来展示系统中组件之间的组织结构、依赖关系和交互方式。

组件是系统中可替换的单元，具有明确的接口，能够独立完成特定的功能。

* 封装性：内部实现细节对外部隐藏，仅通过接口交互。
* 可替换性：符合相同接口的组件可以相互替换。

作用：

1. 展示系统物理结构：将系统分解为可管理的组件，清晰呈现模块划分。
2. 描述组件依赖：显示哪些组件依赖其他组件。
3. 指导部署：为后续的部署图提供基础，明确组件如何部署到硬件。

## 接口


* 提供接口（Provided Interface）：其符号末端带有完整圆形，代表组件对外提供的接口。这种 “棒棒糖”（lollipop）符号是接口分类器实现关系（realization relationship）的简化表示。
* 需求接口（Required Interface）：其符号末端仅有半个圆形（又称 “插座”，socket），代表组件所需的接口。
（两种情况下，接口名称均需标注在接口符号附近。）

```plantuml
component CreateOrder

component OrderSystem

() "order" as ord
ord - OrderSystem
CreateOrder ..( ord
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907234021.png)

## 依赖

```plantuml
@startuml

component CreateOrder

component OrderSystem

() "order" as ord
ord - OrderSystem
CreateOrder ..> ord

@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907233916.png)


## 组件嵌套

```plantuml
@startuml

component buy <<system>> {
	component CreateOrder <<service>>
	
	component OrderSystem <<service>>
	
	() "order" as ord
	ord - OrderSystem
	CreateOrder ..( ord
}

@enduml
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907234215.png)


# 序列图

```mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    alt is sick
        Bob->>Alice: Not so good :(
    else is well
        Bob->>Alice: Feeling fresh like a daisy
    end
    opt Extra response
        Bob->>Alice: Thanks for asking
    end
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907234930.png)

```mermaid
sequenceDiagram
    autonumber
    Alice->>John: Hello John, how are you?
    loop HealthCheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F09%2F0720250907234852.png)