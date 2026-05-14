---
title: "Redis List 底层数据结构实验"
date: '2026-02-22'
draft: false
description:  
toc: true
tags:
  - Redis
  - 数据结构
---

# 实验元数据 (Meta Data)

实验编号/标题：Redis List 底层数据结构实验

日期：2026-02-22

所属领域/标签：#Redis #数据结构

耗时：21:12 - 22:17

# 🎯 实验前：假设与目标 (Plan)

当前问题 (Problem)：我需要了解 Redis List 的底层数据结构

实验目标 (Objective)：验证并模拟 Redis List 的底层结构，查看 Redis 底层代码

核心假设 (Hypothesis)：

Redis List 的值会根据 list 中元素的个数转换为 listpack 和 quicklist

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

### 子实验一：证明小 list 直接是 listpack

1. 创建 list 查看编码
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222211614698.png)

### 子实验二： 转换成 quicklist

1. 批量塞入数据
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222213943764.png)
2. 查看编码
    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222214001363.png)


# 👁️ 实验后：现象与数据 (Check)

## 子实验一：证明小 list 直接是 listpack

返回 listpack 证明小 list 直接是 listpack

## 子实验二： 转换成 quicklist

返回 quicklist，证明 list 节点足够多会转换为 quicklist


# 🧠 深度复盘：分析与结论 (Act)


## listpack 小 list

```
redisObject(type=list, encoding=listpack)
  └─ ptr -> [ listpack: entry1 | entry2 | entry3 | ... ]   // 连续内存
```

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222220658995.png)

## quicklist 大 list

```
redisObject(type=list, encoding=quicklist)
  └─ ptr -> quicklist (双向链表)
           ├─ node1 -> listpack (一块连续内存，装一段元素)
           ├─ node2 -> listpack
           └─ node3 -> listpack
```

链表 + 块的组合：用块减少指针开销，用链表支持两段 push/pop 和分段扩展

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/22/20260222221433931.png)

# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

❓ 产生新问题：验证 Redis Set 的底层结构