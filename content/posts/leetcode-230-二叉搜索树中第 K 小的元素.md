---
title: "二叉搜索树中第 K 小的元素"
date: '2026-02-11'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/11/20260211221635002.png)

## 思路

思路一. 中序遍历，取第 K 个
思路二. 维护每个子树的大小


## Java

```java
import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;

        while (cur != null || !stack.isEmpty()) {
            // 一路向左，把路径压栈
            while (cur != null) {
                stack.push(cur);
                cur = cur.left;
            }

            // 弹出当前最左（当前未访问的最小）
            cur = stack.pop();
            k--;
            if (k == 0) return cur.val;

            // 转向右子树继续中序
            cur = cur.right;
        }
        return 0;
    }
}
```

```java
class Solution {
    private int k;
    private int ans;
    
    public int kthSmallest(TreeNode root, int k) {
        this.k = k;
        inorder(root);
        return ans;
    }

    private void inorder(TreeNode node) {
        if (node == null) {
            return;
        }
        inorder(node.left);
        if (--k == 0) {
            ans = node.val;
            return;
        }
        inorder(node.right);
    }
}
```

```java
import java.util.IdentityHashMap;
import java.util.Map;

class Solution2 {
    private final Map<TreeNode, Integer> size = new IdentityHashMap<>();

    public int kthSmallest(TreeNode root, int k) {
        buildSize(root);
        TreeNode cur = root;

        while (cur != null) {
            int leftSize = getSize(cur.left);
            if (k <= leftSize) {
                cur = cur.left;
            } else if (k == leftSize + 1) {
                return cur.val;
            } else {
                k -= (leftSize + 1);
                cur = cur.right;
            }
        }

        throw new IllegalArgumentException("k is out of range");
    }

    // 后序遍历：先算左右，再算自己
    private int buildSize(TreeNode node) {
        if (node == null) return 0;
        int ls = buildSize(node.left);
        int rs = buildSize(node.right);
        int total = ls + rs + 1;
        size.put(node, total);
        return total;
    }

    private int getSize(TreeNode node) {
        return node == null ? 0 : size.getOrDefault(node, 0);
    }
}

```