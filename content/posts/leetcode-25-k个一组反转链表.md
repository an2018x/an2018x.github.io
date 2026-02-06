---
title: "k 个一组翻转链表"
date: '2026-02-04'
draft: false
description:  
toc: true
---

# K 个一组翻转链表

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/04/20260204220547549.png)

## 思路

1. 每轮探测是否有 K 个节点
2. 翻转 head, tail
3. 把翻转后的凭借回去。


## Java

```java
class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        if (head == null || k <= 1) {
            return head;
        }

        ListNode dummy = new ListNode(0, head);
        ListNode pre = dummy;

        while (true) {
            ListNode tail = pre;
            for (int i = 0; i < k; i ++) {
                tail = tail.next;
                if (tail == null) {
                    return dummy.next;
                }
            }

            ListNode next = tail.next;

            ListNode groupHead = pre.next;
            reverse(groupHead, tail);

            pre.next = tail;
            groupHead.next = next;
            pre = groupHead;
        }
    }

    private void reverse(ListNode head, ListNode tail) {
        ListNode prev = null;
        ListNode cur = head;
        ListNode stop = tail.next;

        while(cur != stop) {
            ListNode nxt = cur.next;
            cur.next = prev;
            prev = cur;
            cur = nxt;
        }
    }
}
```