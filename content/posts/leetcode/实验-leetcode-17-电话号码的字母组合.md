---
title: "实验-leetcode-17-电话号码的字母组合"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

实验编号/标题：例如：实验-leetcode-17-电话号码的字母组合

日期：2026-02-26

所属领域/标签：例如：#LeetCode

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226164036006.png)

## 核心假设 (Hypothesis)

该问题是一个多叉树回溯，每层能处理的字母集合都不同。

核心就是维护好每层能处理的字母集合。

# 🧪 实验中：执行步骤与变量 (Do)

## Step 1 维护数字到字母的映射

```java
class Solution {

    private static final String[] MAPPING = {
        "",     // 0
        "",     // 1
        "abc",  // 2
        "def",  // 3
        "ghi",  // 4
        "jkl",  // 5
        "mno",  // 6
        "pqrs", // 7
        "tuv",  // 8
        "wxyz"  // 9
    };

    public List<String> letterCombinations(String digits) {
        
    }
}
```

## Step 2 初始化路径、结果

```java
class Solution {

    private static final String[] MAPPING = {
        "",     // 0
        "",     // 1
        "abc",  // 2
        "def",  // 3
        "ghi",  // 4
        "jkl",  // 5
        "mno",  // 6
        "pqrs", // 7
        "tuv",  // 8
        "wxyz"  // 9
    };

    List<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();

    public List<String> letterCombinations(String digits) {
        if (digits == null || digits.length() == 0) {
            return ans;
        }
        return ans;
    }
}
```

## Step 3 回溯遍历当前可选的字母

```java
class Solution {

    private static final String[] MAPPING = {
        "",     // 0
        "",     // 1
        "abc",  // 2
        "def",  // 3
        "ghi",  // 4
        "jkl",  // 5
        "mno",  // 6
        "pqrs", // 7
        "tuv",  // 8
        "wxyz"  // 9
    };

    List<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();

    public List<String> letterCombinations(String digits) {
        if (digits == null || digits.length() == 0) {
            return ans;
        }
        dfs(digits, 0);
        return ans;
    }

    void dfs(String digits, int idx) {
        String letters = MAPPING[digits.charAt(idx) - '0'];

        for (int i = 0; i < letters.length(); i ++) {
            path.append(letters.charAt(i));
            dfs(digits, idx + 1);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
```

## Step 4 将最终结果添加到答案中

```java
class Solution {

    private static final String[] MAPPING = {
        "",     // 0
        "",     // 1
        "abc",  // 2
        "def",  // 3
        "ghi",  // 4
        "jkl",  // 5
        "mno",  // 6
        "pqrs", // 7
        "tuv",  // 8
        "wxyz"  // 9
    };

    List<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();

    public List<String> letterCombinations(String digits) {
        if (digits == null || digits.length() == 0) {
            return ans;
        }
        dfs(digits, 0);
        return ans;
    }

    void dfs(String digits, int idx) {
        if (idx == digits.length()) {
            ans.add(path.toString());
            return;
        }
        String letters = MAPPING[digits.charAt(idx) - '0'];

        for (int i = 0; i < letters.length(); i ++) {
            path.append(letters.charAt(i));
            dfs(digits, idx + 1);
            path.deleteCharAt(path.length() - 1);
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

