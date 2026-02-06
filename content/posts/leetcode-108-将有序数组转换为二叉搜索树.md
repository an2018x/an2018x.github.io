---
title: "将有序数组转换为二叉搜索树"
date: '2026-02-06'
draft: false
description:  
toc: true
---

# 将有序数组转换为二叉搜索树

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206110521111.png)

## 思路

A height-balance BST is achieved by always picking the <mark>middle element</mark> as the root.

The left and right subtree sizes differ by at most 1.

As the nums is sorted:
* all elements left of mid are < nums[mid]  -> must go to left subtree.
* all elements right of mid are  > nums[mid] -> must go to right subtree.

## Java

```java
class Solution {
    public TreeNode sortedArrayToBST(int[] nums) {
        return build(nums, 0, nums.length - 1);
    }

    private TreeNode build(int[] nums, int l, int r) {
        if (l > r) return null;
        int mid = l + (r - l) / 2;
        TreeNode root = new TreeNode(nums[mid]);
        root.left = build(nums, l, mid - 1);
        root.right = build(nums, mid + 1, r);
        return root;
    }
}
```