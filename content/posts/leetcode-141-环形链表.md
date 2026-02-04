---
title: "141-环形链表"
date: '2026-02-04'
draft: false
description:  
toc: true
---


# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204175751337.png)


## 思路

如果链表无环，fast 会先走到 null，循环结束。

如果链表有环，fast 会在环里不断追赶 slow，最终后一定会追上。


## Java

```java
public class Solution {
    public boolean hasCycle(ListNode head) {
        if (head == null || head.next == null) {
            return false;
        }
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                return true;
            }
        }

        return false;
    }
}
```