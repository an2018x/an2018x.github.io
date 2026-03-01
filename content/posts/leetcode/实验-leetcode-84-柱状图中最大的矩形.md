---
title: "实验-leetcode84-柱状图中最大的矩形"
date: '2026-02-27'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：实验-leetcode84-柱状图中最大的矩形

日期：Feb 27, 2026

所属领域/标签：例如：#LeetCode

# 🎯 实验前：假设与目标 (Plan)

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/27/20260227160320408.png)

## 实验目标 (Objective)：做完这件事，我想达到什么具体效果？

例：成功抓取20页数据而不报错。

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

对于每一根柱子，把它当做矩形的最低高度。

然后向左、向右扩展。

直到遇到比它更矮的柱子为止。

对于每个柱子 i ，快速找到
1. 左边第一个比它小的位置
2. 右边第一个比它小的位置

用单调栈即可快速找到这个位置。

# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step 1 末尾补 0，让所有栈中的元素都被弹出

```java
class Solution {
    public int largestRectangleArea(int[] heights) {
        int n = heights.length;
        int[] newHeights = new int[n+1];
        for (int i = 0; i < n; i ++) {
            newHeights[i] = heights[i];
        }
        newHeights[n] = 0;
    }
}
```

### Step 2 维护单调栈

```java
class Solution {
    public int largestRectangleArea(int[] heights) {
        int n = heights.length;
        int[] newHeights = new int[n+1];
        for (int i = 0; i < n; i ++) {
            newHeights[i] = heights[i];
        }
        newHeights[n] = 0;

        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0;

        for (int i = 0; i < newHeights.length; i ++) {
            while (!stack.isEmpty() && newHeights[i] < newHeights[stack.peek()]) {
                int mid = stack.pop();
                int height = newHeights[mid];

                int left = stack.isEmpty() ? -1 : stack.peek();

                int right = i;

                int width = right - left - 1;
                int area = height * width;

                maxArea = Math.max(maxArea, area);
            }
            stack.push(i);
        }
        return maxArea;
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