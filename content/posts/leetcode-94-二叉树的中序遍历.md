---
title: "二叉树的中序遍历"
date: '2026-02-05'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/05/20260205170202397.png)

## 思路

递归解法

1. 递归遍历左子树
2. 访问当前答案
3. 递归遍历右子树

迭代 + 栈解法

1. 一路向左压栈，直到空
2. 然后弹栈访问，再去右子树一路向左


## Java

```java
class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> ans = new ArrayList<>();
        dfs(root, ans);
        return ans;
    }

    private void dfs(TreeNode node, List<Integer> ans) {
        if (node == null) {
            return;
        }
        dfs(node.left, ans);
        ans.add(node.val);
        dfs(node.right, ans);
    }
}
```

```java
class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> ans = new ArrayList<>();
        Deque<TreeNode> st = new ArrayDeque<>();
        TreeNode cur = root;

        while (cur != null || !st.isEmpty()) {
            while (cur != null) {
                st.push(cur);
                cur = cur.left;
            }
            TreeNode node = st.pop();
            ans.add(node.val);
            cur = node.right;
        }
        return ans;
    }
}
```