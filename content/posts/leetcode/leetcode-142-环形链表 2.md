---
title: "142-环形链表 2"
date: '2026-02-04'
draft: false
description:  
toc: true
---

# 环形链表2

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204180441681.png)


## 思路

1. 用快慢指针判断是否有环
2. 从相遇点定位入环点
3. 把指针放在回头点，另外一个指针放在相遇点，两者每次都走一步，第一次相遇的就是入环点。

从头到入环点的距离为 a，入环点到相遇点沿着环走的距离为 b。

2(a+b) - (a+b) = a + b = k * c

a = (k - 1) c + (c - b)

## Java

```java
public class Solution {
    public ListNode detectCycle(ListNode head) {
        if (head == null || head.next == null) {
            return null;
        }

        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                ListNode p1 = head, p2 = slow;
                while (p1 != p2) {
                    p1 = p1.next;
                    p2 = p2.next;
                }
                return p1;
            }
        }
        return null;
    }
}
```