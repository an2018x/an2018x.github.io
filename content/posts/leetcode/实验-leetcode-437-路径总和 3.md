---
title: "实验-leetcode-437-路径总和 3"
date: '2026-02-25'
draft: false
description:  
toc: true
---


# 实验元数据 (Meta Data)


实验编号/标题：实验-leetcode-437-路径总和 3

日期：2026-02-25

所属领域/标签：#LeetCode


# 🎯 实验前：假设与目标 (Plan)


当前问题 (Problem)：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/25/20260225094719661.png)

实验目标 (Objective)：

解决路径和问题

# 🧪 实验中：执行步骤与变量 (Do)

## 执行步骤 (Log) 【暴力思路】：

暴力思路：双递归

统计：

1. 以当前节点为起点，统计向下的路径和数量
2. 递归遍历左右子树，重复上述过程

### 第一步 计算以当前节点为起点的路径和数量

```java
private int countFrom(TreeNode node, long target) {
    if (node == null) {
        return 0;
    }
    int res = 0;
    if (node.val == target) {
        res ++;
    }
    res += countFrom(node.left, target - node.val);
    res += countFrom(node.right, target - node.val);
    
    return res;
}
```


### 第二步：递归遍历左右子树

```java
    public int pathSum(TreeNode root, int targetSum) {
        if (root == null) {
            return 0;
        }

        return countFrom(root, targetSum)
                + pathSum(root.left, targetSum)
                + pathSum(root.right, targetSum);
    }
```

### 第三步：组合两段

```java
class Solution {
    public int pathSum(TreeNode root, int targetSum) {
        if (root == null) {
            return 0;
        }

        return countFrom(root, targetSum)
                + pathSum(root.left, targetSum)
                + pathSum(root.right, targetSum);
    }

    private int countFrom(TreeNode node, long target) {
        if (node == null) {
            return 0;
        }
        int res = 0;
        if (node.val == target) {
            res ++;
        }
        res += countFrom(node.left, target - node.val);
        res += countFrom(node.right, target - node.val);
        
        return res;
    }
}
```


## 执行步骤 (Log) 【前缀和思路】：

前缀和思路

1. 当前路径和 curSum，如果存在某个历史前缀和 currSum - targetSum
2. 说明中间这段路径和为 targetSum
3. DFS 遍历
4. 维护前缀和 Map
5. 回溯时删除当前前缀

### 第一步：算出前缀和

```java
private int dfs(TreeNode node, long curSum, int targetSum) {
    if (node == 0) {
        return 0;
    }
    curSum += node.val;
}

```

### 第二步：将前缀和存储到 Map 中

```java
private int dfs(TreeNode node, long curSum, int targetSum, Map<Long, Integer> prefix) {
    if (node == null) {
        return 0;
    }
    curSum += node.val;

    prefix.put(curSum, prefix.getOrDefault(curSum, 0) + 1);

    prefix.put(curSum, prefix.get(curSum) - 1);
}
```

### 第三步：算出以当前节点为终点的前缀和 = curSum - targetSum 的数量

```java
private int dfs(TreeNode node, long curSum, int targetSum, Map<Long, Integer> prefix) {
    if (node == null) {
        return 0;
    }
    curSum += node.val;

    int res = prefix.getOrDefault(curSum - targetSum, 0);

    prefix.put(curSum, prefix.getOrDefault(curSum, 0) + 1);

    prefix.put(curSum, prefix.get(curSum) - 1);
    return res;
}
```

### 第四步：递归遍历左右子树

```java
private int dfs(TreeNode node, long curSum, int targetSum, Map<Long, Integer> prefix) {
    if (node == null) {
        return 0;
    }
    curSum += node.val;

    int res = prefix.getOrDefault(curSum - targetSum, 0);

    prefix.put(curSum, prefix.getOrDefault(curSum, 0) + 1);
    // 递归左右子树
    res += dfs(node.left, curSum, targetSum, prefix);
    res += dfs(node.right, curSum, targetSum, prefix);

    prefix.put(curSum, prefix.get(curSum) - 1);
    return res;
}
```

### 第五步：编写完整程序

```java
   public int pathSum(TreeNode root, int targetSum) {
        Map<Long, Integer> prefix = new HashMap<>();
        prefix.put(0L, 1);   // 初始前缀

        return dfs(root, 0L, targetSum, prefix);
    }
```



# 👁️ 实验后：现象与数据 (Check)


解法 1：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/25/20260225102337369.png)

解法 2：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/25/20260225102316374.png)

# 🧠 深度复盘：分析与结论 (Act)




# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

🔄 验证失败，修改假设，开启下一次实验（EXP-002）。

❓ 产生新问题：[记录新问题]