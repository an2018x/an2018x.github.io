---
title: "回文链表"
date: '2026-02-01'
draft: false
description:  
toc: true
---

# 回文链表

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/01/20260201112937345.png)

## 思路

1. 快慢指针找中点
2. 反转左右
3. 对比

## Java 解法

```java

class Solution {
    public boolean isPalindrome(ListNode head) {
        if (head == null || head.next == null) {
            return true;
        }

        ListNode slow = head, fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        if (fast != null) {
            slow = slow.next;
        }

        ListNode second = reverse(slow);

        ListNode p1 = head, p2 = second;
        boolean ok = true;
        while (p2 != null) {
            if (p1.val != p2.val) {
                ok = false;
                break;
            }
            p1 = p1.next;
            p2 = p2.next;
        }

        return ok;
    }

    private ListNode reverse(ListNode head) {
        ListNode pre = null, cur = head;
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