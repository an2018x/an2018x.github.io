---
title: "二叉树的最大深度"
date: '2026-02-05'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/05/20260205171041931.png)

## 思路

最大深度 = max(左子树深度, 右子树深度) + 1

## Java

```java
class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }
        return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
    }
}
```

迭代解法：

```java
class Solution {

    private static class State {
        TreeNode node;
        int depth;
        State(TreeNode node, int depth) {
            this.node = node;
            this.depth = depth;
        }
    }

    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }
        Deque<State> st = new ArrayDeque<>();
        st.push(new State(root, 1));

        int ans = 0;
        while (!st.isEmpty()) {
            State s = st.pop();
            TreeNode node = s.node;
            int d = s.depth;

            ans = Math.max(ans, d);
            if (node.left != null) {
                st.push(new State(node.left, d + 1));
            }
            if (node.right != null) {
                st.push(new State(node.right, d + 1));
            }
        }
        return ans;
    }
}
```

BSF 解法

```java
class Solution {

    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }

        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        int depth = 0;

        while (!q.isEmpty()) {
            int size = q.size();
            depth ++;
            for (int i = 0; i < size; i ++) {
                TreeNode node = q.poll();
                if (node.left != null) {
                    q.offer(node.left);
                }
                if (node.right != null) {
                    q.offer(node.right);
                }
            }
        }
        return depth;
    }
}
```