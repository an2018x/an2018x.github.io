---
title: "API 分页"
date: '2025-10-04'
draft: false
description: API 分页
toc: true
tags:
  - API
  - 系统设计
---

# 分类

* 基于页 + 偏移量
* 基于游标

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004224010.png)

## 基于页/偏移量的分页

基于页的分页：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004224233.png)

基于偏移量的分页：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004224353.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004224422.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004224448.png)

优点：易于实现。

缺点：

1. 当 offset 变多时，查询会变慢，因为数据库会处理偏移前的所有数据，并在最后返回时丢弃掉。

2. 当数据更新频繁时，可能会丢失数据或者展示两次

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004224745.png)

## 基于游标的分页

1. 挑选一个索引列，例如 ID 作为游标：

    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004224932.png)

2. 出于安全考虑，可能需要对 cursor 进行 hash

    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004225025.png)

3. 客户端感知它上一次的游标

    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004225208.png)

4. 利用游标去过滤数据

    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004225236.png)

5. 返回给客户端下一次查询的游标

    ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004225315.png)

### 分类

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004225358.png)

基于 keyset 的分页：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004225454.png)

基于时间戳的分页：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0420251004225526.png)