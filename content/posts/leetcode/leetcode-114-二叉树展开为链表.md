---
title: "二叉树展开为链表"
date: '2026-02-12'
draft: false
description:  
toc: true
---

# 二叉树展开为链表

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/12/20260212205750201.png)

## 思路

思路一：

维护一个全局指针 prev，表示已经处理好的部分的头节点。

按照 right -> left -> root 的顺序递归，这个是前序的逆序。

思路二：

原地 O(1) 空间，Morris

对于每个节点 cur

* 如果 cur.left 不为空
    1. 找到 cur.left 这颗子树的最右节点 pred
    2. pred.right = cur.right 把原右子树接到左子树最右端
    3. cur.right = cur.left
    4. cur.left = null

## Java

思路一：

```java
class Solution {
    private TreeNode prev = null;

    public void flatten(TreeNode root) {
        dfs(root);
    }

    // 反向前序：right -> left -> root
    private void dfs(TreeNode node) {
        if (node == null) return;

        dfs(node.right);
        dfs(node.left);

        // 把当前节点接到已展开链表头(prev)前面
        node.right = prev;
        node.left = null;
        prev = node;
    }
}

```

思路三：

```java
class Solution {
    public void flatten(TreeNode root) {
        TreeNode cur = root;

        while (cur != null) {
            if (cur.left != null) {
                // 找到左子树的最右节点 pred
                TreeNode pred = cur.left;
                while (pred.right != null) {
                    pred = pred.right;
                }

                // 把原右子树接到 pred 的右边
                pred.right = cur.right;

                // 把左子树搬到右边，并清空左指针
                cur.right = cur.left;
                cur.left = null;
            }

            // 继续处理链表的下一个节点（始终沿 right 走）
            cur = cur.right;
        }
    }
}

```