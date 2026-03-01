---
title: "实验-leetcode200-岛屿数量"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)


实验编号/标题： 实验-leetcode200-岛屿数量

日期：2026-0226

所属领域/标签：例如：#LeetCode #图论


# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

当前问题 (Problem)：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226115351811.png)


实验目标 (Objective)：

## 核心假设 (Hypothesis)：

### BFS/DFS

1. 遍历所有格子
2. 每遇到一个未访问的 '1'：
    * 岛屿计数 +1
    * 从这个点出发，将所有联通 '1' 都标记为已访问



# 🧪 实验中：执行步骤与变量 (Do)


## 实验步骤(DFS)

### Step 1: 寻找起点

```java
class Solution {

    int m,n;
    char[][] grid;

    public int numIslands(char[][] grid) {
        if (grid == null || grid.length ==0) {
            return 0;
        }
        this.grid = grid;
        this.m = grid.length;
        this.n = grid[0].length;

        int count = 0;
        for(int i = 0; i < m; i++) {
            for(int j = 0; j < n; j++) {
                if (grid[i][j] == '1') {
                    count ++;
                    dfs(i, j);
                }
            }
        }
        return count;
    }
}
```

### Step 2: DFS 染色

```java
import java.util.*;

class Solution {
    private int m, n;
    private char[][] grid;

    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        this.grid = grid;
        this.m = grid.length;
        this.n = grid[0].length;

        int count = 0;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    dfs(r, c); // 淹没整个连通块
                }
            }
        }
        return count;
    }

    private void dfs(int i, int j) {
        if (i < 0 || i >=m || j < 0 || j >=n || grid[i][j] == '0') {
            return;
        }
        grid[i][j] = '0';
        dfs(i-1,j);
        dfs(i+1,j);
        dfs(i,j-1);
        dfs(i,j+1);
    }
}
```


## 实验步骤(BFS)

### Step 1 定义所需队列

```java
class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;

        ArrayDeque<int[]> q = new ArrayDeque<>();
    }
}
```

### Step 2  定义遍历的四个方向

```java
class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;

        ArrayDeque<int[]> q = new ArrayDeque<>();
        int di = {-1, 1, 0, 0};
        int dj = {0, 0, -1, 1};
    }
}
```

### Step 3 初始岛屿入队

```java
class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        int count = 0;

        ArrayDeque<int[]> q = new ArrayDeque<>();
        int di = {-1, 1, 0, 0};
        int dj = {0, 0, -1, 1};
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j ++) {
                if (grid[i][j] == '1') {
                    count ++;
                    grid[i][j] = '0';
                    q.offer(new int[]{i, j});
                }
            }
        }
    }
}
```

### Step 4 四个方向入队

```java
class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        int count = 0;

        ArrayDeque<int[]> q = new ArrayDeque<>();
        int[] di = {-1, 1, 0, 0};
        int[] dj = {0, 0, -1, 1};
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j ++) {
                if (grid[i][j] == '1') {
                    count ++;
                    grid[i][j] = '0';
                    q.offer(new int[]{i, j});

                    while (!q.isEmpty()) {
                        int[] cur = q.poll();
                        int ci = cur[0], cj = cur[1];
                        for (int k = 0; k < 4; k ++) {
                            int ni = ci + di[k];
                            int nj = cj + dj[k];
                            if (ni >= 0 && ni < m && nj >=0 && nj < n && grid[ni][nj] == '1') {
                                grid[ni][nj] = '0';
                                q.offer(new int[]{ni, nj});
                            } 
                        }
                    }
                }
            }
        }
        return count;
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