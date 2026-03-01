---
title: "滑动窗口最大值"
date: '2026-01-30'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130121425871.png)

## 单调队列

维护一个双端队列，里面存下标，让对应的值 nums[下标] 从队头到队尾单调递减：

* 队头永远是当前窗口最大值的下标。
* 当新元素进来时，把队尾那些比他小或等于他的下标都踢掉
    * 它们更小，还更早过期
    * 未来窗口里面有新元素在，它们永远不可能成为最大值

## Java

```java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        int[] ans = new int[n-k+1];
        Deque<Integer> dq = new ArrayDeque<>();

        for (int i = 0; i < n; i ++) {
            int left = i - k + 1;
            // 弹出过期下标
            if (!dq.isEmpty() && dq.peekFirst() < left) {
                dq.pollFirst();
            }
            // 维护单调队列
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) {
                dq.pollLast();
            }
            // 入队
            dq.offerLast(i);

            if (i >= k - 1) {
                ans[left] = nums[dq.peekFirst()];
            }
        }
        return ans;
    }
}
```

## Python

```python
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        dq = deque()
        ans = []

        for i, x in enumerate(nums):
            left = i - k + 1

            if dq and dq[0] < left:
                dq.popleft()

            while dq and nums[dq[-1]] <= x:
                dq.pop()

            dq.append(i)

            if i >= k - 1:
                ans.append(nums[dq[0]])
        return ans
```

## Js

```js
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var maxSlidingWindow = function(nums, k) {
    const n = nums.length;
    const ans = [];
    const dq = [];
    let head = 0;

    for (let i = 0; i < n; i ++) {
        const left = i - k + 1;
        if (head < dq.length && dq[head] < left) head++;
        while (head < dq.length && nums[dq[dq.length - 1]] <= nums[i]) {
            dq.pop();
        }
        dq.push(i);

        if (i >= k - 1) {
            ans.push(nums[dq[head]]);
        }
    }
    return ans;
};
```

## Go

```Go
func maxSlidingWindow(nums []int, k int) []int {
    n := len(nums)
    if k == 0 || n == 0 {
        return []int{}
    }

    ans := make([]int, 0, n - k + 1)

    dq := make([]int, 0, k)
    head := 0

    for i:=0; i < n; i++ {
        left := i - k + 1
        if head < len(dq) && dq[head] < left {
            head ++
        }

        for head < len(dq) && nums[dq[len(dq) - 1]] <= nums[i] {
            dq = dq[:len(dq) - 1]
        }

        dq = append(dq, i)

        if i >= k - 1 {
            ans = append(ans, nums[dq[head]])
        }
        
    }
    return ans
}
```

```Go
func maxSlidingWindow(nums []int, k int) []int {
    n := len(nums)
    if k == 0 || n == 0 {
        return []int{}
    }

    ans := make([]int, 0, n - k + 1)

    dq := list.New()

    for i := 0; i < n; i ++ {
        left := i - k + 1
        if dq.Len() > 0 {
            frontIdx := dq.Front().Value.(int)
            if frontIdx < left {
                dq.Remove(dq.Front())
            }
        }

        for dq.Len() > 0 {
            backIdx := dq.Back().Value.(int)
            if nums[backIdx] <= nums[i] {
                dq.Remove(dq.Back())
            } else {
                break
            }
        }

        dq.PushBack(i)

        if i >= k - 1 {
            ans = append(ans, nums[dq.Front().Value.(int)])
        }
    }
    return ans
}
```