---
title: "验证二叉搜索树"
date: '2026-02-06'
draft: false
description:  
toc: true
---

# 验证二叉搜索树

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206111713111.png)

## 思路

* root starts with (-inf, +inf)
* left child inherits (min, root.val)
* right child inherits (root.val, max)


## Java

```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        return dfs(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private boolean dfs(TreeNode node, long low, long high) {
        if (node == null) {
            return true;
        }

        long v = node.val;
        if (v <= low || v >= high) {
            return false;
        }
        return dfs(node.left, low, v) && dfs(node.right, v, high);
    }
}
```

