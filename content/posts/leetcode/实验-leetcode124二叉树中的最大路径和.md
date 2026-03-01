---
title: "leetcode-124-二叉树中的最大路径和"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)


实验编号/标题：例如：leetcode-124-二叉树中的最大路径和

日期：2026-02-26

所属领域/标签：例如：#LeetCode


# 🎯 实验前：假设与目标 (Plan)


## 当前问题 (Problem)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226110230946.png)

## 核心假设 (Hypothesis)

考虑最长路径的最高点，它要么是拐点，要么是路径的起点。

设 dfs(x) 代表以节点 x 为最高点的，且不是拐点的路径长度。

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226111927213.png)

那么 dfs(x) = val + max(dfs(L), dfs(R))

ans = val + max(0,dfs(l)) + max(0,dfs(r))


# 🧪 实验中：执行步骤与变量 (Do)

## 实验步骤

### 计算 dfs(x)

```java
class Solution {
    public int maxPathSum(TreeNode root) {
        dfs(root);
    }

    private int dfs(TreeNode x) {
        if (node == null) {
            return 0;
        }

        int l = Math.max(0, dfs(x.left));
        int r = Math.max(0, dfs(x.right));

        return x.val + Math.max(l, r);
    }
}
```

### 根据 dfs(l), dfs(r) 的结果，更新答案

```java
class Solution {

    int ans = Integer.MIN_VALUE;

    public int maxPathSum(TreeNode root) {
        dfs(root);
        return ans;
    }

    private int dfs(TreeNode x) {
        if (x == null) {
            return 0;
        }

        int l = Math.max(0, dfs(x.left));
        int r = Math.max(0, dfs(x.right));

        ans = Math.max(ans, x.val + l + r);

        return x.val + Math.max(l, r);
    }
}
```


# 👁️ 实验后：现象与数据 (Check)
客观记录发生了什么，不要带主观评价。

观察到的现象：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226112502584.png)

成功了吗？报错了吗？报错信息是什么？

产出物的样子（附截图/照片）。

关键数据：

耗时、准确率、转化率、温度、分数等。

例：前5页成功，第6页开始报错 403 Forbidden。

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