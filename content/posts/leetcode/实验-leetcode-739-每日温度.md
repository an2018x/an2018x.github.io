---
title: "实验-leetcode-739-每日温度"
date: '2026-02-27'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：实验-leetcode-739-每日温度

日期：Feb 27, 2026

所属领域/标签：例如：#LeetCode #栈

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/27/20260227152954415.png)

## 实验目标 (Objective)：做完这件事，我想达到什么具体效果？

例：成功抓取20页数据而不报错。

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

用单调栈，维护一个还没有找到更高温度的下标栈。

问题可以转换为找右边第一个更大的元素。

# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step 1 定义单调递减栈

```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] ans = new int[n];

        Deque<Integer> stack = new ArrayDeque<>();

    }
}
```

### Step 2 单调递减栈入栈

```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] ans = new int[n];

        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < n; i ++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int prevIndex = stack.pop();
            }
            stack.push(i);
        }
        return ans;
    }
}
```

### Step 3 更新结果

```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] ans = new int[n];

        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < n; i ++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int prevIndex = stack.pop();
                ans[prevIndex] = i - prevIndex;
            }
            stack.push(i);
        }
        return ans;
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