---
title: "Nosql 原理"
date: '2025-10-04'
draft: false
description: Nosql 原理
toc: true
---


# B-树

B 树对读优化，但是不适合大量写，写会涉及到随机 I/O，可能会更新磁盘的多个页。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005152919.png)


# LSM-树

写操作在内存中按照 memtable 进行分批处理。

memtable 根据对象 key 组织起来，通常以平衡树存储。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005153306.png)

当 memtable 达到指定的大小时，会被以 Immutable Sorted String Table 格式刷写到磁盘上，SSTable 以顺序存储 K-V 对，这些 K-V 写入都是顺序 I/O。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005153416.png)

新的 SSTable 变为 LSM 树的最新段。

当越来越多的数据写入，更多的 SSTable 会被创建。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005153603.png)

由于 SSTable 不可修改，所以新的修改会以新的数据条目写入，它会取代旧条目中的任何对象 key。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005153657.png)


对于删除操作，会在最新的 SSTable 中增加一个叫做 tombstone 的标记，当读取的时候遇到这个标记，就知道这个数据已经被删除了：


![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005153823.png)

对于读取操作，首先会在 Memtable 中读取数据，然后再在最新的 SSTable 读取数据，之后再在下一个 SSTable 中读取数据。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005154100.png)

但是随着 SSTable 数量的增长，会需要更长的时间去查找一个 Key，同时，过时的 object key 也会占用大量的磁盘空间。

为了解决这个问题，后台会定期合并和剔除不需要的 SSTable。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005160409.png)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2025%2F10%2F0520251005161620.png)