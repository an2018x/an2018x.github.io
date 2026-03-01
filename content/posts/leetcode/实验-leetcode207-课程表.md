---
title: "实验-leetcode207-课程表"
date: '2026-02-26'
draft: false
description:  
toc: true
---

# 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：例如：实验-leetcode207-课程表

日期：2026-02-26

所属领域/标签：例如：#LeetCode #拓扑排序

耗时：2小时

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/26/20260226144915353.png)


## 核心假设 (Hypothesis)：

这是一个有向图判环问题。

1. 找到所有入度为 0 的课程，加入队列。
2. 从队列中取出一门课
3. 后续课程的入度 - 1
4. 某门后续课程入度变为 0 ，加入队列
5. 查看是否所有课程入度都为 0

# 🧪 实验中：执行步骤与变量 (Do)

## 执行步骤 (Log)：

### Step1 建图，统计入度（临接表法）

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i ++) {
            graph.add(new ArrayList<>());
        }
        int[] indegree = new int[numCourses];
        
        for (int[] p: prerequisites) {
            int a = p[0];
            int b = p[1];
            graph.get(b).add(a);
            indegree[a]++;
        }
    }
}
```

### Step2 入度为 0 的点入队

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i ++) {
            graph.add(new ArrayList<>());
        }
        int[] indegree = new int[numCourses];
        
        for (int[] p: prerequisites) {
            int a = p[0];
            int b = p[1];
            graph.get(b).add(a);
            indegree[a]++;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i ++) {
            if (indegree[i] == 0) {
                queue.offer(i);
            }
        }
    }
}
```

### Step3 入度为 0 的节点出队，相连节点入度 - 1

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i ++) {
            graph.add(new ArrayList<>());
        }
        int[] indegree = new int[numCourses];
        
        for (int[] p: prerequisites) {
            int a = p[0];
            int b = p[1];
            graph.get(b).add(a);
            indegree[a]++;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i ++) {
            if (indegree[i] == 0) {
                queue.offer(i);
            }
        }

        int count = 0;
        while (!queue.isEmpty()) {
            int cur = queue.poll();
            count ++;
            
            for (int next : graph.get(cur)) {
                indegree[next] --;
            }
        }
    }
}
```

### Step 4 入度为 0 的入队

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i ++) {
            graph.add(new ArrayList<>());
        }
        int[] indegree = new int[numCourses];
        
        for (int[] p: prerequisites) {
            int a = p[0];
            int b = p[1];
            graph.get(b).add(a);
            indegree[a]++;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i ++) {
            if (indegree[i] == 0) {
                queue.offer(i);
            }
        }

        int count = 0;
        while (!queue.isEmpty()) {
            int cur = queue.poll();
            count ++;
            
            for (int next : graph.get(cur)) {
                indegree[next] --;
                if (indegree[next] == 0) {
                    queue.offer(next);
                }
            }
        }
        return count == numCourses;
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