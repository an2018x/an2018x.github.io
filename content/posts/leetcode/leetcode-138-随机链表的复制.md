---
title: "随机链表的复制"
date: '2026-02-04'
draft: false
description:  
toc: true
---

# 随机链表的复制

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204222522503.png)

## 思路

1. 把复制节点插入到原链表中
2. 每个旧节点紧跟着它的复制节点
3. 复制 random 指针
4. 拆分链表

## Java

```java

class Solution {
    public Node copyRandomList(Node head) {
        if (head == null) {
            return null;
        }

        Node cur = head;
        while (cur != null) {
            Node copy = new Node(cur.val);
            copy.next = cur.next;
            cur.next = copy;
            cur = copy.next;
        }

        cur = head;
        while (cur != null) {
            Node copy = cur.next;
            copy.random = (cur.random == null) ? null : cur.random.next;
            cur = copy.next;
        }

        Node dummy = new Node(0);
        Node copyCur = dummy;

        cur = head;
        while (cur != null) {
            Node copy = cur.next;
            Node nextOld = copy.next;

            copyCur.next = copy;
            copyCur = copy;

            cur.next = nextOld;
            cur = nextOld;
        }

        return dummy.next;
    }
}
```