---
title: "除了自身以外数组的乘积"
date: '2026-01-30'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130213507145.png)

## 思路说明

1. 前缀乘积 + 后缀乘积

## Java

```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] ans = new int[n];

        // 前缀乘积
        ans[0] = 1;
        for (int i = 1; i < n; i++) {
            ans[i] = ans[i-1] * nums[i-1];
        }

        // 后缀乘积
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            ans[i] = ans[i] * suffix;
            suffix *= nums[i];
        }
        return ans;
    }
}
```

## Python 

```python
class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        ans = [1] * n

        for i in range(1, n):
            ans[i] = ans[i - 1] * nums[i - 1]

        suffix = 1

        for i in range(n - 1, -1, -1):
            ans[i] *= suffix
            suffix *= nums[i]

        return ans
        
```

## JS

```js
var productExceptSelf = function(nums) {
    const n = nums.length;
    const ans = new Array(n);

    ans[0] = 1;
    for (let i = 1; i < n; i ++) {
        ans[i] = ans[i-1] * nums[i-1];
    }

    let suffix = 1;
    for (let i = n - 1; i >= 0; i --) {
        ans[i] *= suffix;
        suffix *= nums[i];
    }
    return ans;
};
```

## Go

```Go
func productExceptSelf(nums []int) []int {
    n := len(nums)
    ans := make([]int, n)

    ans[0] = 1
    for i := 1; i < n; i ++ {
        ans[i] = ans[i-1] * nums[i -1]
    }

    suffix := 1
    for i := n - 1; i >= 0; i-- {
        ans[i] *= suffix
        suffix *= nums[i]
    }
    return ans
}
```