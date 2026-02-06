---
title: "二叉树的层序遍历"
date: '2026-02-06'
draft: false
description:  
toc: true
---

# 二叉树的层序遍历

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206105804533.png)

## 思路

1. put root into a queue
2. queue is not empty
    2.1. size = queue.size(), this is exactly how many nodes are in the current level.
    2.1. repeat size times:
        * pop one node from queue
        * add its value to level
        * add left and right child

## Java

```java
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> res = new ArrayList<>();
        if (root == null) {
            return res;
        }

        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);

        while(!q.isEmpty()) {
            int size = q.size();
            List<Integer> level = new ArrayList<>(size);
            for (int i = 0; i < size; i ++) {
                TreeNode node = q.poll();
                level.add(node.val);

                if (node.left != null) q.offer(node.left);
                if (node.right != null) q.offer(node.right);
            }
            res.add(level);
        }
        return res;
    }
}
```