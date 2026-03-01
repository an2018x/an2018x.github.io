---
title: "leetcode-79-单词搜索"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：leetcode-79-单词搜索

日期：Feb 26, 2026

所属领域/标签：例如：#LeetCode

# 🎯 实验前：假设与目标 (Plan)



## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226191337344.png)


## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

本题是二维网格的回溯，目的是在字符网络中找到一条路径，使得路径上经过的字符依次拼成 Word。

# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step 1 枚举每个位置作为起点 dfs

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length;
        int n = board[0].length;

        for (int r = 0; r < m; r ++) {
            for (int c = 0; c < n; c ++) {
                if (dfs(board, word, r, c, 0)) {
                    return true;
                }
            }
        }
        return false;
    }
}
```

### Step 2 不合法状态快速退出

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length;
        int n = board[0].length;

        for (int r = 0; r < m; r ++) {
            for (int c = 0; c < n; c ++) {
                if (dfs(board, word, r, c, 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    boolean dfs(char[][] board, String word, int r, int c, int index) {
        if (r < 0 || r >= board.length || c < 0 || c >= board.length) {
            return false;
        }

        if (board[r][c] != word.charAt(index)) {
            return false;
        }
    }
}
```

### Step 3 满足条件快速退出

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length;
        int n = board[0].length;

        for (int r = 0; r < m; r ++) {
            for (int c = 0; c < n; c ++) {
                if (dfs(board, word, r, c, 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    boolean dfs(char[][] board, String word, int r, int c, int index) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) {
            return false;
        }

        if (board[r][c] != word.charAt(index)) {
            return false;
        }

        if (index == word.length() - 1) {
            return true;
        }
    }
}
```

### Step 4 四个方向回溯，标记可访问

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length;
        int n = board[0].length;

        for (int r = 0; r < m; r ++) {
            for (int c = 0; c < n; c ++) {
                if (dfs(board, word, r, c, 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    boolean dfs(char[][] board, String word, int r, int c, int index) {
        if (r < 0 || r >= board.length || c < 0 || c >= board.length) {
            return false;
        }

        if (board[r][c] != word.charAt(index)) {
            return false;
        }

        if (index == word.length() - 1) {
            return true;
        }

        char temp = board[r][c];
        board[r][c] = '#';

        boolean found = dfs(board, word, r - 1, c, index + 1) ||
                        dfs(board, word, r + 1, c, index + 1) ||
                        dfs(board, word, r, c - 1, index + 1) ||
                        dfs(board, word, r, c + 1, index + 1);
        board[r][c] = temp;
        return found;
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