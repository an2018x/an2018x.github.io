---
title: "二叉树的右视图"
date: '2026-02-11'
draft: false
description:  
toc: true
---

# 二叉树的右视图

## 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/11/20260211223348838.png)

## 思路

思路 1：

层序遍历，用队列做 BFS，最后出列的就是最右边。

思路 2：

DFS，先访问右子树，再访问左子树。

## Java 解法

```java
class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> res = new ArrayList<>();
        if (root == null) return res;

        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);

        while (!q.isEmpty()) {
            int size = q.size();
            TreeNode last = null;

            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll();
                last = node;

                if (node.left != null) q.offer(node.left);
                if (node.right != null) q.offer(node.right);
            }
            // 这一层最后出队的就是最右边
            res.add(last.val);
        }
        return res;
    }
}
```

```java
class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> res = new ArrayList<>();
        dfs(root, 0, res);
        return res;
    }

    private void dfs(TreeNode node, int depth, List<Integer> res) {
        if (node == null) return;

        // 第一次到达该层：因为先右后左，所以就是右视图节点
        if (depth == res.size()) res.add(node.val);

        dfs(node.right, depth + 1, res);
        dfs(node.left, depth + 1, res);
    }
}

```