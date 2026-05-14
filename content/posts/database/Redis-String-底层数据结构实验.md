---
title: "Redis String 底层数据结构实验"
date: '2026-02-22'
draft: false
description:  
toc: true
tags:
  - Redis
  - 数据结构
  - 实验
---


# 实验元数据 (Meta Data)

实验编号/标题：Redis String 底层数据结构实验

日期：2026-02-22

所属领域/标签：#Redis #数据结构

耗时：19:30 - 21:12

# 🎯 实验前：假设与目标 (Plan)

当前问题 (Problem)：我需要了解 Redis String 的底层数据结构

实验目标 (Objective)：验证并模拟 Redis String 的底层结构，查看 Redis 底层代码

核心假设 (Hypothesis)：

Redis String 的值对象会在 int 和 SDS 间切换。

# 🧪 实验中：执行步骤与变量 (Do)

## 准备工作/工具：

```bash
docker run -d --name redis -p 6379:6379 redis
docker exec -it redis redis-cli
> ping
```

## 控制变量 (Variable)：仅基于 String 结构进行实验

## 执行步骤 (Log)：

### 子实验一：证明 String 可能是整数编码

1. 写入一个整数样子的字符串
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222200022556.png)
2. 查看底层编码
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222200054755.png)
3. 对它做 INCR
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222200240475.png)

### 子实验二：证明 String 也可能是 SDS（动态字符串）

1. 写入一个非纯整数
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222200654290.png)

### 子实验三：证明 SDS 的两种形态：embstr vs raw

1. 短字符串
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222200818468.png)
2. 长字符串
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222200941229.png)

### 子实验四：证明 embstr 在修改后会转成 raw

1. 先放一个短串
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222201049326.png)
2. 追加内容
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222201126564.png)


# 👁️ 实验后：现象与数据 (Check)

## 子实验一：证明 String 可能是整数编码

第一步和第三步查看到的编码都是 int，说明 Redis String 在数值场景下不是字符数组，而是直接用整数存。

## 子实验二：证明 String 也可能是 SDS（动态字符串）

返回的结果是 embstr，证明非纯整数是 SDS

## 子实验三：证明 SDS 的两种形态：embstr vs raw

短字符串返回 embstr，长字符串返回 raw。

## 子实验四：证明 embstr 在修改后会转成 raw

追加后 encoding 变为 raw，embstr 的设计偏向“只读/少改“的短串。


# 🧠 深度复盘：分析与结论 (Act)


## 结果对比：实际结果 vs. 预期假设

符合预期

1. Redis Sting 的值对象会在两条路线之间切换
    * int：纯整数形式（范围可放进 64-bit signed）
    * SDS：其他字符串/二进制，对应 encoding 展示为 embstr 或 raw
2. SDS 不是 C 字符串：有长度字段、预分配策略、二进制安全（可包含\0），因此 Redis String 才能高效支持 STRLEN、APPEND 等操作

## 原因分析 (Why?)：


## 获得的知识点 (Key Learnings)：

每个 Key 对于的 value 在 Redis 内部通常表现为一个对象 (robj/RedisObject)
* type：这里都是 string
* encoding：int/embstr/raw
* ptr：指向真正的数据载荷（或者直接存整数）

### int：对象头 + 直接存 64-bit 整数

适用场景：
* value 看起来是一个十进制整数（123、-45）
* 能放进 64-bit signed (long long)

数据结构布局：

```
RedisObject (type=string, encoding=int)
└── ptr  (不指向字符串，而是“存着一个整数值”，等价于 int64)
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222204617554.png)

特点：
* 没有 SDS，也没有字符数组。
* INCR/DECR 等操作无需 parse 字符串（或 parse 后立刻转 int），直接做整数算术更快。
* 读 GET 时再把整数转成文本返回给客户端（网络协议层面仍是字符串）。

### embstr：对象头 + SDS“一整块连续内存“分配

embstr 的本质仍是 SDS（Simple Dynamic String），只是优化了分配方式：把 RedisObject + SDS 头 + 字符数组 一次性 malloc 成一块连续内存。

数据结构布局：

```
[ 一次 malloc 得到的一整块内存 ]
┌───────────────────────────────────────────────┐
│ RedisObject (type=string, encoding=embstr)    │
│ SDS header (len/alloc/flags...)               │
│ char buf[...]  (以 '\0' 结尾, 但二进制安全)      │
└───────────────────────────────────────────────┘
```

特点：
* 1 次内存分配（相较 raw 的 2 次），更省 malloc/fragmentation 成本。
* 对 CPU cache 更友好（对象头和内容在一起）。
* 通常用于 短字符串（阈值与版本有关）。
* 典型限制/行为：很多版本里 一旦需要修改/扩容（比如 APPEND），往往会转换成 raw（因为“整块”不好就地扩容）。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222204656960.png)

### raw：对象头和 SDS 分开分配（两块内存）

同样是 SDS，但采用更通用的表示：对象头一块，SDS（含 header+buf）另一块。

数据结构布局：

```
RedisObject (type=string, encoding=raw)
└── ptr ──>  SDS (单独 malloc)
             ├── SDS header (len/alloc/flags...)
             └── char buf[...]
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222210647476.png)

特点：
* 两次内存分配（对象头一次，SDS 一次）
* 更灵活：DS 可以根据追加/截断等操作 realloc，支持频繁修改更自然。
* 常用于 较长字符串 或 发生过修改后的字符串。



# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

❓ 产生新问题：验证 Redis Set 的底层结构