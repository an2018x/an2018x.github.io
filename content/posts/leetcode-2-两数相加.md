---
title: " 2-两数相加"
date: '2026-02-04'
draft: false
description:  
toc: true
---

# 两数相加

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204183027974.png)

## 思路

同时遍历两个链表 + 维护一个进位 carry。

## Java 

```java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode cur = dummy;
        int carry = 0;

        while (l1 != null || l2 != null || carry != 0) {
            int x = (l1 != null) ? l1.val : 0;
            int y = (l2 != null) ? l2.val : 0;

            int sum = x + y + carry;
            carry = sum / 10;

            cur.next = new ListNode(sum % 10);
            cur = cur.next;

            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummy.next;
    }
}
```