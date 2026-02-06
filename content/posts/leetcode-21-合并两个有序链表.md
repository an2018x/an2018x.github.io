---
title: "21-合并两个有序链表"
date: '2026-02-03'
draft: false
description:  
toc: true
---

# 合并两个有序链表

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204182314353.png)

## 思路

每次从两个链表头取出更小的节点接到新链表后面。

## Java


```java
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode cur = dummy;

        while(list1 != null && list2 != null) {
            if (list1.val <= list2.val) {
                cur.next = list1;
                list1 = list1.next;
            } else {
                cur.next = list2;
                list2 = list2.next;
            }
            cur = cur.next;
        }
        cur.next = (list1 != null) ? list1 : list2;
        return dummy.next;
    }
}
```