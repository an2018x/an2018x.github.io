---
title: "旋转图像"
date: '2026-02-01'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/01/20260201095104129.png)

## 思路

思路一：两步变化，先转置再每行反转

思路二：按圈做四元环循环变换

## Java 解法

```java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;

        for (int i = 0; i < n; i ++) {
            for (int j = i + 1; j < n; j ++) {
                int tmp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = tmp;
            }
        }

        for (int i = 0; i < n; i ++) {
            int l = 0, r = n - 1;
            while (l < r) {
                int tmp = matrix[i][l];
                matrix[i][l] = matrix[i][r];
                matrix[i][r] = tmp;
                l ++;
                r --;
            }
        }
    }
}
```

```java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;

        for (int layer = 0; layer < n / 2; layer ++) {
            int top = layer;
            int bottom = n - 1 - layer;
            int left = layer;
            int right = n - 1 - layer;

            for (int k = 0; k < right - left; k ++) {
                int tmp = matrix[top][left + k];

                matrix[top][left + k] = matrix[bottom - k][left];
                matrix[bottom - k][left] = matrix[bottom][right - k];
                matrix[bottom][right - k] = matrix[top + k][right];
                matrix[top + k][right] = tmp;
            }
        }
    }
}
```