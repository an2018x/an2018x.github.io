---
title: "翻转二叉树"
date: '2026-02-05'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/05/20260205175412654.png)

## 思路

对于任意节点
1. 先翻转左子树
2. 再翻转右子树
3. 交换左右孩子节点

## Java

```java
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) {
            return null;
        }

        invertTree(root.left);
        invertTree(root.right);

        TreeNode tmp = root.left;
        root.left = root.right;
        root.right = tmp;
        return root;
    }
}
```