---
title: "实验 leetcode-236.二叉树的最近公共祖先"
date: '2026-02-25'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：实验-二叉树的最近公共祖先

日期：YYYY-MM-DD

所属领域/标签：例如：#烹饪 #Python #营销测试

耗时：2小时

# 🎯 实验前：假设与目标 (Plan)


## 当前问题 (Problem)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/25/20260225110421585.png)


## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

从叶子往上汇报是否找到 p/q，当某个节点的左右子树分别包含 p 和 q，这个节点就是 LCA。

# 🧪 实验中：执行步骤与变量 (Do)


## 执行步骤 (Log)：

### 第一步：处理 CornerCase

当前节点为 p/q 其中一个时，直接返回当前节点

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }
}
```

### 第二步：处理分居左右子树的情况

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) {
        return root;
    }
}
```

### 第三步：处理只有一边有值的情况

> 其中一个节点是另外一个节点的祖先，根据第一步，只会返回一个节点的值

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) {
        return root;
    }
    return left != null ? left : right;
}
```


# 👁️ 实验后：现象与数据 (Check)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/25/20260225111219355.png)


# 🧠 深度复盘：分析与结论 (Act)

这是学习发生的地方。将“经历”转化为“经验”。

结果对比：实际结果 vs. 预期假设。

符合预期 / 部分符合 / 完全相反

原因分析 (Why?)：

为什么成功了？是运气还是方法对路？

为什么失败了？是假设错了，还是执行出问题了？

(可以使用“5个为什么”法进行深挖)

获得的知识点 (Key Learnings)：

我学到了什么新概念？

纠正了什么旧认知？

# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

🔄 验证失败，修改假设，开启下一次实验（EXP-002）。

❓ 产生新问题：[记录新问题]