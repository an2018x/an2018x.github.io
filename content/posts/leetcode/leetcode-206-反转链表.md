---
title: "反转链表"
date: '2026-02-01'
draft: false
description:  
toc: true
---

# 反转链表

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/01/20260201105730731.png)

## 思路

把每个节点的指针反过来

1. 迭代法，逐个拆链表，再接到新头部
2. 递归法，先把后面的链表反转，再把当前节点接到尾巴

## Java

```java
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode pre = null;
        ListNode cur = head;
        while (cur != null) {
            ListNode nxt = cur.next;
            cur.next = pre;
            pre = cur;
            cur = nxt;
        }
        return pre;
    }
}
```

```java
class Solution {
    public ListNode reverseList(ListNode head) {
        if (head == null || head.next == null) {
            return head
        }

        ListNode newHead = reverseList(head.next);
        head.next.next = head;
        head.next = null;
        return newHead;
    }
}
```