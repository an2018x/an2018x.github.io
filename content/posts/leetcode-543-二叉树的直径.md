---
title: "二叉树的直径"
date: '2026-02-06'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206105147927.png)

## Solution

The longest path through that node equals:

left subtree depth + right subtree depth.

the longest path must pass through some node as a highest point.

## Java

```java
class Solution {

    private int ans = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        depth(root);
        return ans;
    }

    private int depth(TreeNode node) {
        if (node == null) {
            return 0;
        }

        int left = depth(node.left);
        int right = depth(node.right);

        ans = Math.max(ans, left + right);
        return Math.max(left, right) + 1;
    }
}
```