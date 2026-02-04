---
title: "矩阵置零"
date: '2026-01-27'
draft: false
description:  
toc: true
---

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130231609001.png)

## 思路

* 用第一行作为列标记，matrix[0][j] == 0 表示第 j 列最终要清零。
* 用第一列作为行标记，matrix[i][0] == 0 表示第 i 行最终要清零。
* 第一行、第一列可能原本就包含 0，需要额外保存两个变量标识

## Java

```java
class Solution {
    public void setZeroes(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;

        boolean row0 = false, col0 = false;

        for (int j = 0; j < n; j ++) {
            if (matrix[0][j] == 0) {
                row0 = true;
                break;
            }
        }

        for (int i = 0; i < m; i ++) {
            if (matrix[i][0] == 0) {
                col0 = true;
                break;
            }
        }

        for (int i = 1; i < m; i ++) {
            for (int j = 1; j < n; j++) {
                if (matrix[i][j] == 0) {
                    matrix[i][0] = 0;
                    matrix[0][j] = 0;
                }
            }
        }

        for (int i = 1; i < m; i ++) {
            for (int j = 1; j < n; j ++) {
                if (matrix[i][0] == 0 || matrix[0][j] == 0) {
                    matrix[i][j] = 0;
                }
            }
        }

        if (row0) {
            for (int j = 0; j < n;j ++) {
                matrix[0][j] = 0;
            }
        }
        if (col0) {
            for (int i = 0; i < m;i ++) {
                matrix[i][0] = 0;
            }
        }
    }
}
```
