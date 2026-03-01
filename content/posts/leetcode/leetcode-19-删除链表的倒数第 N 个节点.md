---
title: "删除链表的倒数第 N 个节点"
date: '2026-02-04'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204205911649.png)

## 思路

等价于找到正数第 len - n 个节点的前一个节点。

快指针先走 n+1 步。

## Java

```java
class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);

        ListNode fast = dummy;
        ListNode slow = dummy;

        for (int i = 0; i <= n; i++) {
            fast = fast.next;
        }

        while (fast != null) {
            fast = fast.next;
            slow = slow.next;
        }

        slow.next = slow.next.next;

        return dummy.next;
    }
}
```
