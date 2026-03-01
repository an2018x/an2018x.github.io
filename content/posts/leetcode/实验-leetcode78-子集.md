---
title: "实验-leetcode78-子集"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：实验-leetcode78-子集

日期：2026-02-26

所属领域/标签：例如：#LeetCode

耗时：2小时

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226163022962.png)

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

在 n 个元素里，每个元素都有选和不选两种状态，该题就是枚举所有选和不选的状态集合。


# 🧪 实验中：执行步骤与变量 (Do)


## 执行步骤 (Log)

### Step 1 定义当前路径

```java
class Solution {

    List<Integer> path = new ArrayList<>();

    public List<List<Integer>> subsets(int[] nums) {
        
    }

    void dfs(int[] nums) {

    }
}
```

### Step 2 从 startIndex 开始，加入集合

```java
class Solution {

    List<Integer> path = new ArrayList<>();

    public List<List<Integer>> subsets(int[] nums) {
        
    }

    void dfs(int[] nums, int startIdx) {
        for (int i = startIdx; i < nums.length; i ++) {
            path.add(nums[i]);
            dfs(nums, i + 1);
        }
    }
}
```

### Step 3 回溯集合



```java
class Solution {

    List<Integer> path = new ArrayList<>();

    public List<List<Integer>> subsets(int[] nums) {
        
    }

    void dfs(int[] nums, int startIdx) {
        for (int i = startIdx; i < nums.length; i ++) {
            path.add(nums[i]);
            dfs(nums, i + 1);
            path.remove(path.size() - 1);
        }
    }
}
```

### Step 4 将当前结果添加到答案中

```java
class Solution {

    List<Integer> path = new ArrayList<>();
    List<List<Integer>> ans = new ArrayList<>();

    public List<List<Integer>> subsets(int[] nums) {
        dfs(nums, 0);
        return ans;
    }

    void dfs(int[] nums, int startIdx) {
        ans.add(new ArrayList<>(path));
        for (int i = startIdx; i < nums.length; i ++) {
            path.add(nums[i]);
            dfs(nums, i + 1);
            path.remove(path.size() - 1);
        }
    }
}
```



# 👁️ 实验后：现象与数据 (Check)
客观记录发生了什么，不要带主观评价。

观察到的现象：

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