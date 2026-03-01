---
title: "螺旋矩阵"
date: '2026-01-31'
draft: false
description:  
toc: true
---

# 螺旋矩阵

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/31/20260131161356066.png)

## 思路

从外到内，按层遍历，一圈圈剥洋葱。

## Java

```java
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        int m = matrix.length;
        int n = matrix[0].length;

        List<Integer> ans = new ArrayList<>(m * n);

        int top = 0, bottom = m - 1;
        int left = 0, right = n - 1;

        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j ++) {
                ans.add(matrix[top][j]);
            }
            top ++;

            for (int i = top; i <= bottom; i ++) {
                ans.add(matrix[i][right]);
            }
            right --;

            if (top <= bottom) {
                for (int j = right; j >= left; j --) {
                    ans.add(matrix[bottom][j]);
                }
                bottom --;
            }

            if (left <= right) {
                for (int i = bottom; i >= top; i --) {
                    ans.add(matrix[i][left]);
                }
                left ++;
            }
        }
        return ans;
    }
}
```

## Python

```python
class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        m, n = len(matrix), len(matrix[0])
        ans = []

        top, bottom = 0, m - 1
        left, right = 0, n - 1

        while top <= bottom and left <= right:
            for j in range(left, right + 1):
                ans.append(matrix[top][j])
            top += 1

            for i in range(top, bottom + 1):
                ans.append(matrix[i][right])
            right -= 1

            if top <= bottom:
                for j in range(right, left - 1, -1):
                    ans.append(matrix[bottom][j])
                bottom -= 1
            
            if left <= right:
                for i in range(bottom, top - 1, -1):
                    ans.append(matrix[i][left])
                left += 1

        return ans
```
