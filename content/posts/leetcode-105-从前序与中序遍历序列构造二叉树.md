---
title: "从前序与中序遍历序列构造二叉树"
date: '2026-02-12'
draft: false
description:  
toc: true
---

# 从前序与中序遍历序列构造二叉树

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/12/20260212211445004.png)

## 思路

前序确定根，中序切分左右子树

## Java 解法

```java
class Solution {

    private int[] preorder;
    private int[] inorder;
    private Map<Integer, Integer> inIndex = new HashMap<>();

    public TreeNode buildTree(int[] preorder, int[] inorder) {
        this.preorder = preorder;
        this.inorder = inorder;

        for (int i = 0; i < inorder.length; i++) {
            inIndex.put(inorder[i], i);
        }

        return build(0, preorder.length - 1, 0, inorder.length - 1);
    }

    private TreeNode build(int preL, int preR, int inL, int inR) {
        if (preL > preR) {
            return null;
        }

        int rootVal = preorder[preL];
        TreeNode root = new TreeNode(rootVal);

        int k = inIndex.get(root.val);
        int leftSize = k - inL;

        root.left = build(preL + 1, preL + leftSize, inL, k + 1);
        root.right = build(preL + leftSize + 1, preR, k + 1, inR);
        return root;
    }
}
```