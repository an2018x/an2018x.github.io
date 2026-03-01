---
title: "实验-leetcode-131-分割回文串"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：实验-leetcode-131-分割回文串

日期：Feb 26, 2026

所属领域/标签：例如：#LeetCode

# 🎯 实验前：假设与目标 (Plan)

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226192250756.png)

## 实验目标 (Objective)：做完这件事，我想达到什么具体效果？

把字符串从左到右切开，切开的每一段都是回文串

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

从字符串当前起点开始，切到哪里，才能保证这一段是回文，然后再处理后面的部分。


# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step 1 初始化结果和路径

```java
class Solution {

    List<List<String>> ans = new ArrayList<>();
    List<String> path = new ArrayList<>();

    public List<List<String>> partition(String s) {
        
    }
}
```

### Step 2 遍历当前段的结束位置

```java
class Solution {

    List<List<String>> ans = new ArrayList<>();
    List<String> path = new ArrayList<>();

    public List<List<String>> partition(String s) {
        dfs(s, 0);
    }

    void dfs(String s, int startIdx) {
        for (int end = startIdx; end < s.length(); end++) {

        }
    }
}
```

### Step 3 判断子串是否是回文串，是则加入路径

```java
class Solution {

    List<List<String>> ans = new ArrayList<>();
    List<String> path = new ArrayList<>();

    public List<List<String>> partition(String s) {
        dfs(s, 0);
    }

    void dfs(String s, int startIdx) {
        for (int end = startIdx; end < s.length(); end++) {
            if (!isPalindrome(s, startIdx, end)) {
                continue;
            }
            path.add(s.substring(startIdx, end+1));
            dfs(s, end + 1);
            path.remove(path.size() - 1);
        }
    }

    boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                return false;
            }
            left ++;
            right --;
        }
        return true;
    }
}
```


### Step 4 切割完成，向结果中追加

```java
class Solution {

    List<List<String>> ans = new ArrayList<>();
    List<String> path = new ArrayList<>();

    public List<List<String>> partition(String s) {
        dfs(s, 0);
        return ans;
    }

    void dfs(String s, int startIdx) {
        if (startIdx == s.length()) {
            ans.add(new ArrayList<>(path));
            return;
        }
        for (int end = startIdx; end < s.length(); end++) {
            if (!isPalindrome(s, startIdx, end)) {
                continue;
            }
            path.add(s.substring(startIdx, end+1));
            dfs(s, end + 1);
            path.remove(path.size() - 1);
        }
    }

    boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                return false;
            }
            left ++;
            right --;
        }
        return true;
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