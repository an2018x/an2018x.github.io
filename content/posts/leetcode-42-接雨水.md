---
title: "接雨水"
date: '2025-01-12'
draft: false
description: 接雨水
toc: true
---

# 接雨水

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/16/20260116213917777.png)

每个位置能接的雨水由左右最高墙得到：

w = max(0, min(leftmax(i), rightmax(i)) - height[i])

问题转换成，如何高效得到 leftmax(i) 和 rightmax(i)。

可以从两端向中间收缩，维护 leftMax 和 rightMax

如果 height[l] < height[r] 那么 l 的可接水上限由 leftMax 决定：
* 如果 height[l] >= leftMax: 更新 leftMax，不做任何处理，因为这个时候一定是接不到水的。
* 否则 leftMax - height[l] 就是 l 位置可接水的量，为什么是这样？这里解释下，由于 rightMax > height[r]，而 height[r] > height[l]，但是 height[l] < leftMax，所以 leftMax < rightMax
* 然后 l++


## java 解法

```java
class Solution {
    public int trap(int[] height) {
        if (height.length < 3) {
            return 0;
        }
        int l = 0, r = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int ans = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                if (height[l] >= leftMax) {
                    leftMax = height[l];
                } else {
                    ans += leftMax - height[l];
                }
                l ++;
            } else {
                if (height[r] >= rightMax) {
                    rightMax = height[r];
                } else {
                    ans += rightMax - height[r];
                }
                r --;
            }
        }
        return ans;
    }
}
```


## Python 解法

