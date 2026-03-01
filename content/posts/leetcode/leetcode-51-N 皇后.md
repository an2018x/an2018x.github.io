---
title: "实验-leetcode-51-N 皇后"
date: '2026-02-26'
draft: false
description:  
toc: true
---

 # 实验元数据 (Meta Data)

实验编号/标题：例如：实验-leetcode-51-N 皇后

日期：Feb 26, 2026

所属领域/标签：例如：#LeetCode

# 🎯 实验前：假设与目标 (Plan)


## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226224428209.png)

## 实验目标 (Objective)：做完这件事，我想达到什么具体效果？

例：成功抓取20页数据而不报错。

## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

由于同一行不能有两个皇后，完全可以规定，每一行恰好放一个皇后，需要考虑的问题变成皇后放在那一列。

冲突判断：
* 当前列没有别的皇后
* 当前主对角线没有别的皇后（row-col 相同）
* 当前副对角线没有别的皇后（row+col 相同）


# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step 1 初始化棋盘

```java
class Solution {
    char[][] board;

    public List<List<String>> solveNQueens(int n) {

        // 棋盘
        board = new char[n][n];
        for (int i = 0; i < n; i ++) {
            for (int j = 0; j < n; j ++) {
                board[i][j] = '.';
            }
        }
    }
}
```

### Step 2 尝试在当前行的每一列放置皇后

```java
class Solution {

    char[][] board;

    public List<List<String>> solveNQueens(int n) {

        // 棋盘
        board = new char[n][n];
        for (int i = 0; i < n; i ++) {
            for (int j = 0; j < n; j ++) {
                board[i][j] = '.';
            }
        }

        dfs(n, 0);
    }

    void dfs(int n, int row) {
        for (int col = 0; col < n; col ++) {
            board[rol][col] = 'Q';
            dfs(n, row + 1);
            board[rol][col] = '.';

        }
    }
}
```

### Step 3 检验和设置列、对角线冲突

```java
class Solution {

    boolean[] cols = new boolean[n];
    boolean[] diag1 = new boolean[2 * n - 1];
    boolean[] diag2 = new boolean[2 * n - 1];

    public List<List<String>> solveNQueens(int n) {

        // 棋盘
        char[][] board = new char[n][n];
        for (int i = 0; i < n; i ++) {
            for (int j = 0; j < n; j ++) {
                board[i][j] = '.';
            }
        }

        dfs(n, 0);
    }

    void dfs(int n, int row) {
        for (int col = 0; col < n; col ++) {
            int d1 = row - col + (n - 1);
            int d2 = row + col;

            // 如果当前列或对角线已被占用，则不能放
            if (cols[col] || diag1[d1] || diag2[d2]) {
                continue;
            }
            board[row][col] = 'Q';
            cols[col] = true;
            diag1[d1] = true;
            diag2[d2] = true;
            dfs(n, row + 1);
            board[row][col] = '.';
            cols[col] = false;
            diag1[d1] = false;
            diag2[d2] = false;
        }
    }
}
```

### Step 4 将成功放置的结果增加到答案中去

```java
class Solution {

    boolean[] cols;
    boolean[] diag1;
    boolean[] diag2;
    char[][] board;
    List<List<String>> ans = new ArrayList<>();

    public List<List<String>> solveNQueens(int n) {
        // 棋盘
        cols = new boolean[n];
        diag1 = new boolean[2 * n - 1];
        diag2 = new boolean[2 * n - 1];
        board = new char[n][n];
        for (int i = 0; i < n; i ++) {
            for (int j = 0; j < n; j ++) {
                board[i][j] = '.';
            }
        }
        dfs(n, 0);
        return ans;
    }

    void dfs(int n, int row) {
        if (row == n) {
            ans.add(build(board));
            return;
        }
        for (int col = 0; col < n; col ++) {
            int d1 = row - col + (n - 1);
            int d2 = row + col;

            // 如果当前列或对角线已被占用，则不能放
            if (cols[col] || diag1[d1] || diag2[d2]) {
                continue;
            }
            board[row][col] = 'Q';
            cols[col] = true;
            diag1[d1] = true;
            diag2[d2] = true;
            dfs(n, row + 1);
            board[row][col] = '.';
            cols[col] = false;
            diag1[d1] = false;
            diag2[d2] = false;
        }
    }

    List<String> build(char[][] board) {
        List<String> list = new ArrayList<>();
        for (char[] row : board) {
            list.add(new String(row));
        }
        return list;
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