---
title: "实验-leetcode-22-括号生成"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：实验-leetcode-22-括号生成

日期：Feb 26, 2026

所属领域/标签：例如：#LeetCode

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226172708604.png)

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

从左到右构造一个长度为 2n 的字符串，每步只能放 '(' 或 ')'，但是必须始终保证当前前缀是可能合法的。

符合回溯题的特征：
* 做选择
* 检查是否合法
* 合法则继续递归
* 不合法则立即停止

剪枝：在递归过程中维护当前用来多少左括号，多少右括号，只扩展合法状态。

合法括号的条件：
1. 左括号数不能超过 n
2. 任何前缀中，右括号不能多于左括号

# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step 1 初始化路径、结果

```java
class Solution {
    List<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();

    public List<String> generateParenthesis(int n) {

    }
}
```

### Step 2 判断左括号是可以放

```java
class Solution {
    List<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();
    int leftCnt;

    public List<String> generateParenthesis(int n) {
                
    }

    void dfs(int n) {
        if (leftCnt < n) {
            path.append('(');
            leftCnt++;
            dfs(n);
            path.deleteCharAt(path.length() - 1);
            leftCnt--;
        }
    }
}
```

### Step 3 判断右括号是否可以放

```java
class Solution {
    List<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();
    int leftCnt, rightCnt;

    public List<String> generateParenthesis(int n) {
        dfs(n);
    }

    void dfs(int n) {
        if (leftCnt < n) {
            path.append('(');
            leftCnt++;
            dfs(n);
            path.deleteCharAt(path.length() - 1);
            leftCnt--;
        }
        if (rightCnt < leftCnt) {
            path.append(')');
            rightCnt++;
            dfs(n);
            path.deleteCharAt(path.length() - 1);
            rightCnt--;
        }
    }
}
```

### Step 4 生成最终结果

```java
class Solution {
    List<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();
    int leftCnt, rightCnt;

    public List<String> generateParenthesis(int n) {
        dfs(n);
        return ans;
    }

    void dfs(int n) {
        if (leftCnt == n && rightCnt == n) {
            ans.add(path.toString());
            return;
        }
        if (leftCnt < n) {
            path.append('(');
            leftCnt++;
            dfs(n);
            path.deleteCharAt(path.length() - 1);
            leftCnt--;
        }
        if (rightCnt < leftCnt) {
            path.append(')');
            rightCnt++;
            dfs(n);
            path.deleteCharAt(path.length() - 1);
            rightCnt--;
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