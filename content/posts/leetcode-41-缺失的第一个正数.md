---
title: "缺失的第一个正数"
date: '2026-01-27'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130220510700.png)

## 解题思路

设数组长度为 n:

* 要找的答案一定在 [1, n+1] 里面。

把数组当做一个哈希表，值 x 放在 x - 1 的位置。

最后遍历一遍，第一个满足 nums[i] != i + 1 的位置就是。

## Java

```java
class Solution {
    public int firstMissingPositive(int[] nums) {
        int n = nums.length;

        for (int i = 0; i < n; i++) {
            while(nums[i] >= 1 && nums[i] <= n && nums[nums[i]-1] != nums[i]) {
                int j = nums[i] - 1;
                int tmp = nums[i];
                nums[i] = nums[j];
                nums[j] = tmp;
            }
        }

        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) {
                return i + 1;
            }
        }
        return n + 1;
    }
}
```


## Python

```python
class Solution:
    def firstMissingPositive(self, nums: List[int]) -> int:
        n = len(nums)

        for i in range(n):
            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
                j = nums[i] - 1
                nums[i], nums[j] = nums[j], nums[i]
            
        for i in range(n):
            if nums[i] != i + 1:
                return i + 1
        return n + 1
```

## JS

```js
var firstMissingPositive = function(nums) {
    const n = nums.length;

    for (let i = 0; i < n; i ++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
            const j = nums[i] - 1;
            const tmp = nums[i];
            nums[i] = nums[j];
            nums[j] = tmp;
        }
    }

    for (let i = 0; i < n; i ++) {
        if (nums[i] !== i + 1) {
            return i + 1;
        }
    }
    return n + 1;
};
```

## go

```go
func firstMissingPositive(nums []int) int {
    n := len(nums)

    for i := 0; i < n; i ++ {
        for nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i] {
            j := nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]
        }
    }

    for i := 0; i < n; i++ {
        if nums[i] != i + 1 {
            return i + 1
        }
    }
    return n + 1
}
```