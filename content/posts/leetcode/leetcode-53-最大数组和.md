---
title: "最大数组和"
date: '2026-01-30'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130170246629.png)

## 思路

思路 1 ：动态规划

dp[i] = 以 i 位置结尾的最大子数组和

对于第 i 个数 nums[i]:

1. 把它接在前面的子数组后面
2. 直接从自己重新开始一段

dp[i] = max(nums[i], dp[i-1] + nums[i])

滚动优化：

cur = max(nums[i], cur + nums[i])
ans = max(ans, cur)

思路 2： 分治法

一个区间的最大子数组和，要么在左半边，要么在右半边，要么跨国终点



## Java

```java
class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0];
        int cur = 0;
        for (int x : nums) {
            cur = Math.max(cur + x, x);
            best = Math.max(best, cur);
        }
        return best;
    }
}
```

分治解法：

```java
class Solution {
    public int maxSubArray(int[] nums) {
        return get(nums, 0, nums.length - 1).mSum;
    }

    private static class Status {
        // 区间和，最大前缀和，最大后缀和，最大子段和
        int iSum, lSum, rSum, mSum;

        Status(int iSum, int lSum, int rSum, int mSum) {
            this.iSum = iSum;
            this.lSum = lSum;
            this.rSum = rSum;
            this.mSum = mSum;
        }
    }

    private Status get(int[] a, int l, int r) {
        if (l == r) {
            int x = a[l];
            return new Status(x, x, x, x);
        }
        int m = (l + r) >> 1;
        Status left = get(a, l, m);
        Status right = get(a, m + 1, r);
        return pushUp(left, right);
    }
    
    private Status pushUp(Status L, Status R) {
        int iSum = L.iSum + R.iSum;
        int lSum = Math.max(L.lSum, L.iSum + R.lSum);
        int rSum = Math.max(R.rSum, R.iSum + L.rSum);
        int mSum = Math.max(Math.max(L.mSum, R.mSum), L.rSum + R.lSum);
        return new Status(iSum, lSum, rSum, mSum);
    }
}
```

## Python

```python
class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        pre = 0
        ans = nums[0]
        for x in nums:
            pre = max(x, pre+x)
            ans = max(ans, pre)
        return ans
```

## Js

```js
/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let pre = 0;
    let ans = nums[0];

    for (const x of nums) {
        pre = Math.max(x, pre + x);
        ans = Math.max(ans, pre);
    }
    return ans;
};
```


## Go

```Go
func maxSubArray(nums []int) int {
    pre := 0
    ans := nums[0]

    for _, x := range nums {
        if pre + x > x {
            pre = pre + x
        } else {
            pre = x
        }
        if pre > ans {
            ans = pre
        }
    }
    return ans
}
```