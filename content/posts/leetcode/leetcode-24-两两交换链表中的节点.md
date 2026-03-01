---
title: "两两交换链表中的节点"
date: '2026-02-04'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204210851773.png)

## 思路

每次循环交换一对。

## Java

```java
class Solution {
    public ListNode swapPairs(ListNode head) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;

        ListNode prev = dummy;
        while (prev.next != null && prev.next.next != null) {
            ListNode a = prev.next;
            ListNode b = a.next;

            prev.next = b;
            a.next = b.next;
            b.next = a;

            prev = a;
        }
        return dummy.next;
    }
}
```