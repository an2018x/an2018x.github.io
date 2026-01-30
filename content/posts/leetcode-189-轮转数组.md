---
title: "轮转数组"
date: '2026-01-27'
draft: false
description:  轮转数组
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130180946116.png)

## 解题思路

思路 1：

三次反转

右移 k 位等价为：把数组分成两段 A|B ，B 是最后 K 个，结果是 B|A

1. 反转整个数组
2. 反转前 K 个
3. 反转后 K 个

思路 2：

把每个元素搬到它应该去的位置：

1. 元素 i 应该去 (i+k)%n
2. 但是会覆盖原来的值，需要使用临时变量

## Java

```java
class Solution {
    public void rotate(int[] nums, int k) {
        int n = nums.length;
        k %= n;
        if (k==0) {
            return;
        }

        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k , n - 1);
    }

    private void reverse(int[] a, int l, int r) {
        while (l < r) {
            int tmp = a[l];
            a[l] = a[r];
            a[r] = tmp;
            l++;
            r--;
        }
    }
}
```

```java
class Solution {
    public void rotate(int[] nums, int k) {
        int n = nums.length;
        k %= n;
        if (k==0) {
            return;
        }

        int moved = 0;

        for (int start = 0; moved < n; start++) {
            int cur = start;
            int prev = nums[cur];

            do {
                int next = (cur + k) %n;
                int tmp = nums[next];
                nums[next] = prev;

                prev = tmp;
                cur = next;
                moved++;
            } while (cur != start);
        }
    }
}
```

## Python

```python
class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        n = len(nums)
        k %= n
        if k == 0:
            return

        moved = 0
        start = 0

        while moved < n:
            cur = start
            prev = nums[cur]
            while True:
                nxt = (cur + k) % n
                nums[nxt], prev = prev, nums[nxt]
                cur = nxt
                moved += 1
                if cur == start:
                    break
            start += 1
```

```python
class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        n = len(nums)
        k %= n
        if k == 0:
            return

        def rev(l: int, r: int) -> None:
            while l < r:
                nums[l], nums[r] = nums[r], nums[l]
                l += 1
                r -= 1
        
        rev(0, n - 1)
        rev(0, k - 1)
        rev(k, n - 1)
```

## JS

```js
var rotate = function(nums, k) {
    const n = nums.length;
    k %= n;
    if (k === 0) {
        return;
    }

    const reverse = (l, r) => {
        while (l < r) {
            [nums[l], nums[r]] = [nums[r], nums[l]]
            l ++;
            r --;
        }
    }

    reverse(0, n - 1);
    reverse(0, k - 1);
    reverse(k, n - 1);
};
```

```js
var rotate = function(nums, k) {
    const n = nums.length;
    if (n === 0) return;
    k %= n;
    if (k === 0) return;
    let moved = 0;
    for (let start = 0; moved < n; start ++) {
        let cur = start;
        let prev = nums[start];

        while (true) {
            const next = (cur + k) % n;
            const tmp = nums[next];
            nums[next] = prev;
            prev = tmp;
            cur = next;
            moved ++;

            if (cur === start) break;
        }
    }
};
```

## Go

```Go
func rotate(nums []int, k int)  {
    n := len(nums)
    if n == 0 {
        return
    }
    k %= n
    if k == 0 {
        return
    }

    reverse := func(l, r int) {
        for l < r {
            nums[l], nums[r] = nums[r], nums[l]
            l ++
            r --
        }
    }

    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)
}
```

```Go
func rotate(nums []int, k int)  {
    n := len(nums)
    if n == 0 {
        return
    }
    k %= n
    if k == 0 {
        return
    }

    moved := 0

    for start := 0; moved < n; start ++ {
        cur := start
        prev := nums[start]

        for {
            next := (cur + k) % n
            nums[next], prev = prev, nums[next]
            cur = next
            moved++
            if cur == start {
                break
            }
        }
    }
}
```