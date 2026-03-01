---
title: "实验-leetcode46-全排列"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)


实验编号/标题：例如：实验-leetcode46-全排列

日期：2026-02-26

所属领域/标签：例如：#LeetCode #排列问题


# 🎯 实验前：假设与目标 (Plan)


## 当前问题 (Problem)

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226154451423.png)

## 核心假设 (Hypothesis)

基础排列问题

* 先选择一个数
* 继续选下一个树
* 全部选完生成排列，
* 撤销上一步选择，重新选择

# 🧪 实验中：执行步骤与变量 (Do)


## 执行步骤 (Log)：

### Step 1 枚举当前层可用的数字，放入路径中

```java
class Solution {

    List<Integer> path = new ArrayList<>();

    public List<List<Integer>> permute(int[] nums) {
        dfs();
    }
    
    void dfs() {
        for (int i = 0; i < nums.length; i ++) {
            path.add(nums[i]);
        }
    }
}
```

### Step 2 进入下一步选择

```java
class Solution {

    List<Integer> path = new ArrayList<>();

    public List<List<Integer>> permute(int[] nums) {
        dfs();
    }
    
    void dfs() {
        for (int i = 0; i < nums.length; i ++) {
            path.add(nums[i]);
            dfs();
        }
    }
}
```

### Step 3 标记已选的数字，跳过已标记的数字


```java
class Solution {

    List<Integer> path = new ArrayList<>();
    boolean[] used;

    public List<List<Integer>> permute(int[] nums) {
        used = new boolean[nums.length];
        dfs();
    }
    
    void dfs() {
        for (int i = 0; i < nums.length; i ++) {
            if (used[i]) {
                continue;
            }
            path.add(nums[i]);
            used[i] = true;
            dfs();
        }
    }
}
```

### Step 4 回溯时撤销选择

```java
class Solution {

    List<Integer> path = new ArrayList<>();
    boolean[] used;

    public List<List<Integer>> permute(int[] nums) {
        used = new boolean[nums.length];
        dfs();
    }
    
    void dfs() {
        for (int i = 0; i < nums.length; i ++) {
            if (used[i]) {
                continue;
            }
            path.add(nums[i]);
            used[i] = true;
            dfs();
            used[i] = false;
            path.remove(path.size() -1);
        }
    }
}
```

### Step 5 满足长度加入结果

```java
class Solution {

    List<Integer> path = new ArrayList<>();
    boolean[] used;
    List<List<Integer>> ans = new ArrayList<>();

    public List<List<Integer>> permute(int[] nums) {
        used = new boolean[nums.length];
        dfs(nums);
        return ans;
    }
    
    void dfs(int[] nums) {
        if (path.size() == nums.length) {
            ans.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i ++) {
            if (used[i]) {
                continue;
            }
            path.add(nums[i]);
            used[i] = true;
            dfs(nums);
            used[i] = false;
            path.remove(path.size() -1);
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
