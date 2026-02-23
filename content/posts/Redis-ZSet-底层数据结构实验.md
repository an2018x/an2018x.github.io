---
title: "Redis ZSet 底层数据结构实验"
date: '2026-02-22'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

实验编号/标题：Redis set 底层数据结构实验

日期：2026-02-22

所属领域/标签：#Redis #数据结构

耗时：22:42 - 23:00

# 🎯 实验前：假设与目标 (Plan)

当前问题 (Problem)：我需要了解 Redis zset 的底层数据结构

实验目标 (Objective)：验证并模拟 Redis zset 的底层结构，查看 Redis 底层代码

核心假设 (Hypothesis)：

Redis zset 的值会根据 zset 中元素的个数转换为 listpack 和 quicklist

# 🧪 实验中：执行步骤与变量 (Do)

## 准备工作/工具：

```bash
docker run -d --name redis \
  -p 6379:6379 \
  -v "./redis.conf":/usr/local/etc/redis/redis.conf:ro \
  redis \
  redis-server /usr/local/etc/redis/redis.conf
docker exec -it redis redis-cli
ping
```
配置文件

```conf
port 6379
bind 0.0.0.0
protected-mode yes
enable-debug-command local
```


## 控制变量 (Variable)

仅基于 List 结构进行实验

## 执行步骤 (Log)：

### 子实验一：构造小 ZSet 观察为 listpack

1. 构造小 zset，查看编码
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222224837946.png)

### 子实验二：元素个数超限变为 skiplist

1. 添加 500 个元素
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222225037179.png)

### 子实验三：成员长度超限变为 skiplist

1. 生成长字符串并插入
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222225230674.png)


# 👁️ 实验后：现象与数据 (Check)


# 🧠 深度复盘：分析与结论 (Act)

## skiplist 结构

可以理解成“多层索引的有序链表”：最底层是一条按 score 排序的链表；在其上抽出部分节点形成更稀疏的“高速通道”，从而把查找/插入从链表的 O(n) 降到 期望 O(log n)。

### 结构

一个跳表对象通常包含：

* header：头结点（哨兵节点，不存真实 member）
* tail：尾结点（方便反向遍历）
* level：当前跳表最高层数（动态变化）
* length：元素数量

```
L3:  H  ----------------->  ( ... )  ----------------->  T
L2:  H  ------>  ( ... )  --------->  ( ... )  ------>  T
L1:  H  --> (a) --> (c) --> (f) --> (k) --> (m) -->    T
L0:  H  -> (a)->(b)->(c)->(d)->(e)->(f)-> ... ->(m)->  T
```

### 节点结构

每个真实元素节点里通常有：

* ele：成员（member，字符串/SDS 指针）
* score：分值（double）
* backward：底层（L0）的前向指针（用于从尾到头遍历）
* level[]：一个数组，长度 = 该节点的“高度”
    * 每一层 level[i] 里通常至少有：
        * forward：该层的后继指针
        * span：跨度（到 forward 节点跨过了多少个底层节点）
* span 让 Redis 能在跳表上 O(log n) 计算排名（rank）或 “第 k 个元素是谁”：


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222230920824.png)

# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

❓ 产生新问题：验证 Redis ZSet 的底层结构