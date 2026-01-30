---
title: "和为 k 的子数组"
date: '2026-01-30'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130115530284.png)

## 思路

把子数组求和转换为前缀和差值计数。

子数组和 = 两个前缀和之差

用哈希表维护前缀和为 sum - k 的个数。

## Java

```java
class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> cnt = new HashMap<>();
        cnt.put(0, 1);

        int sum = 0;
        int ans = 0;

        for (int x : nums) {
            sum += x;

            ans += cnt.getOrDefault(sum-k, 0);

            cnt.put(sum, cnt.getOrDefault(sum, 0) + 1);
        }
        return ans;
    }
}
```

## Python

```python
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        cnt = defaultdict(int)
        cnt[0] = 1

        s = 0
        ans = 0
        for x in nums:
            s += x
            ans += cnt[s-k]
            cnt[s] += 1
        return ans
```

## JS

```js
var subarraySum = function(nums, k) {
    const cnt = new Map();
    cnt.set(0, 1);

    let sum = 0;
    let ans = 0;
    
    for (const x of nums) {
        sum += x;
        ans += (cnt.get(sum - k) || 0);
        cnt.set(sum, (cnt.get(sum) || 0) + 1);
    }
    return ans;
};
```


## Go

```Go
func subarraySum(nums []int, k int) int {
    cnt := make(map[int]int)
    cnt[0] = 1

    sum, ans := 0, 0
    for _, x := range nums {
        sum += x
        ans += cnt[sum - k]
        cnt[sum] ++
    }
    return ans
}
```

## ts

```typescript
function subarraySum(nums: number[], k: number): number {
    const cnt = new Map<number, number>();
    cnt.set(0, 1);

    let sum = 0;
    let ans = 0;

    for (const x of nums) {
        sum += x;
        ans += cnt.get(sum - k) ?? 0;
        cnt.set(sum, (cnt.get(sum) ?? 0) + 1);
    }
    return ans;
};
```