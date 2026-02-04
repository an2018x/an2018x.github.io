---
title: "搜索二维矩阵"
date: '2026-02-01'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/01/20260201102933912.png)

## 思路

从右上角 (0, n - 1) 作为起点走楼梯，因为：

* 左边都更小
* 下边都更大

从这个点可以一次排除一整行或者一整列。

## Java

```java
class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int m = matrix.length;
        int n = matrix[0].length;

        int i = 0, j = n - 1;
        while (i < m && j >= 0) {
            int x = matrix[i][j];
            if (x == target) {
                return true;
            }
            if (x > target) {
                j --;
            } else {
                i ++;
            }
        }
        return false;
    }
}
```

## Python

```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        m, n = len(matrix), len(matrix[0])
        i, j = 0, n - 1

        while i < m and j >= 0:
            x = matrix[i][j]
            if x == target:
                return True
            if x > target:
                j -= 1
            else:
                i += 1
        return False
```