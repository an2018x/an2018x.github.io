---
title: "LeetCode-994-腐烂的橘子"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：LeetCode-994-腐烂的橘子

日期：YYYY-MM-DD

所属领域/标签：例如：#烹饪 #Python #营销测试

耗时：2小时

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226121442265.png)

实验目标 (Objective)：做完这件事，我想达到什么具体效果？


核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

多源 BFS：

1. 入队所有的腐烂橘子
2. 统计新鲜橘子数量
3. 分层 BFS，出队所有当前队列
4. 处理 size 个节点，更新四邻的 1 为 2，时间推进 1 分钟
5. 如果最终新鲜橘子数量为 0，说明全部感染，返回数量

# 🧪 实验中：执行步骤与变量 (Do)


## 执行步骤 (Log)：

### Step 1 初始化队列，入队所有腐烂橘子

```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        ArrayDeque<int[]> q = new ArrayDeque<>();
        int fresh = 0;

        for (int i = 0; i < m; i ++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 2) {
                    q.offer(new int[]{i, j});
                } else if(grid[i][j] == 1) {
                    fresh ++;
                }
            }
        }

        if (fresh == 0) return 0;
    }
}
```

### Step 2 取出一层

```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        ArrayDeque<int[]> q = new ArrayDeque<>();
        int fresh = 0;

        for (int i = 0; i < m; i ++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 2) {
                    q.offer(new int[]{i, j});
                } else if(grid[i][j] == 1) {
                    fresh ++;
                }
            }
        }

        if (fresh == 0) return 0;

        while (!q.isEmpty && fresh > 0) {
            int size = q.size();
            for (int i = 0; i < size; i ++) {
                int [] cur = q.poll();
                int r = cur[0], c = cur[1];
            }
        }
    }
}
```

### Step 3 将扩散后的位置入队

```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        ArrayDeque<int[]> q = new ArrayDeque<>();
        int fresh = 0;

        for (int i = 0; i < m; i ++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 2) {
                    q.offer(new int[]{i, j});
                } else if(grid[i][j] == 1) {
                    fresh ++;
                }
            }
        }

        if (fresh == 0) return 0;

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        while (!q.isEmpty && fresh > 0) {
            int size = q.size();
            for (int i = 0; i < size; i ++) {
                int [] cur = q.poll();
                int r = cur[0], c = cur[1];

                for (int k = 0; k < 4; k ++) {
                    int nr = r + dr[k];
                    int nc = c + dc[k];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        fresh --;
                        q.offer(new int[]{nr, nc});
                    }
                }
            }
        }
    }
}
```

### Step 4 扩展后累加分钟数

```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        ArrayDeque<int[]> q = new ArrayDeque<>();
        int fresh = 0;

        for (int i = 0; i < m; i ++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 2) {
                    q.offer(new int[]{i, j});
                } else if(grid[i][j] == 1) {
                    fresh ++;
                }
            }
        }

        if (fresh == 0) return 0;

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};
        int minutes = 0;

        while (!q.isEmpty() && fresh > 0) {
            int size = q.size();
            for (int i = 0; i < size; i ++) {
                int [] cur = q.poll();
                int r = cur[0], c = cur[1];

                for (int k = 0; k < 4; k ++) {
                    int nr = r + dr[k];
                    int nc = c + dc[k];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        fresh --;
                        q.offer(new int[]{nr, nc});
                    }
                }
            }
            minutes ++; // 本层处理完，时间 + 1
        }
        // 仍然有新鲜橘子，不可能全部腐烂
        return fresh == 0 ? minutes : -1;
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