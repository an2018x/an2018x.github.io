---
title: "实验-leetcode-84-数组中的第 K 个最大元素"
date: '2026-02-27'
draft: false
description:  
toc: true
---

 # 实验元数据 (Meta Data)

用于日后检索和归档，建立知识索引。

实验编号/标题：实验-leetcode-84-数组中的第 K 个最大元素

日期：Feb 27, 2026

所属领域/标签：例如：#LeetCode

# 🎯 实验前：假设与目标 (Plan)

不要在此处长篇大论，用一两句话厘清“为什么做这个”。

## 当前问题 (Problem)：我现在遇到了什么阻碍？或者我想解决什么问题？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/27/20260227163206342.png)

## 实验目标 (Objective)：做完这件事，我想达到什么具体效果？


## 核心假设 (Hypothesis)：（最关键的一步） 我认为怎么做能成功？

维护一个容量为 k 的最小堆即可。

# 🧪 实验中：执行步骤与变量 (Do)

记录“我到底做了什么”。如果是代码，粘贴关键片段；如果是实物操作，记录参数。

## 准备工作/工具：

List tools or resources used.

## 控制变量 (Variable)：

不变的量：(例：目标网址、抓取频率)

改变的量 (测试点)：(例：User-Agent 字符串，IP代理池)

## 执行步骤 (Log)：

### Step 1 定义小根堆

```java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();

        for (int num : nums) {
            if (minHeap.size() < k) {
                minHeap.offer(num);
            } else if (num > minHeap.peek()) {
                minHeap.poll();
                minHeap.offer(num);
            }
        }
        return minHeap.peek();
    }
}
```


### Step 2 向小根堆增加元素

```java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();

        for (int num : nums) {
            if (minHeap.size() < k) {
                minHeap.offer(num);
            } else if (num > minHeap.peek()) {
                minHeap.poll();
                minHeap.offer(num);
            }
        }
        return minHeap.peek();
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

## 小顶堆的实现

### 性质

* 根节点是最小值
* 任意一个节点都 <= 它的左右孩子

用数组存，下标 i：
* 左孩子：2 * i + 1
* 右孩子：2 * i + 2
* 父节点：(i - 1) / 2

### 需要实现的操作

* add(x)：插入元素
* peek()：查看堆顶
* poll()：删除并返回堆顶
* size()：当前元素个数

### 关键操作

* 上浮 siftUp
* 下层 siftDown

### 实现步骤

1. 定义基本数据结构
    ```java
    class MinHeap {
        private int[] heap;
        private int size;

        public MinHeap(int capacity) {
            heap = new int[capacity];
            size = 0;
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }
    }
    ```
2. 实现 peek 操作
    ```java
    class MinHeap {
        private int[] heap;
        private int size;

        public MinHeap(int capacity) {
            heap = new int[capacity];
            size = 0;
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public int peek() {
            return heap[0];
        }
    }
    ```
3. 上浮操作
    ```java
    class MinHeap {
        private int[] heap;
        private int size;

        public MinHeap(int capacity) {
            heap = new int[capacity];
            size = 0;
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public int peek() {
            return heap[0];
        }

        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (heap[index] >= heap[parent]) {
                    break;
                }
                swap(index, parent);
                index = parent;
            }
        }

        private void swap(int i, int j) {
            int temp = heap[i];
            heap[i] = heap[j];
            heap[j] = temp;
        }
    }
    ```
4. 下沉操作
    ```java
    class MinHeap {
        private int[] heap;
        private int size;

        public MinHeap(int capacity) {
            heap = new int[capacity];
            size = 0;
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public int peek() {
            return heap[0];
        }

        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (heap[index] >= heap[parent]) {
                    break;
                }
                swap(index, parent);
                index = parent;
            }
        }

        private void swap(int i, int j) {
            int temp = heap[i];
            heap[i] = heap[j];
            heap[j] = temp;
        }

        private void siftDown(int index) {
            while (true) {
                int left = index * 2 + 1;
                int right = index * 2 +2;
                int smallest = index;
                if (left < size && heap[left] < heap[smallest]) {
                    smallest = left;
                }
                if (right < size && heap[right] < heap[smallest]) {
                    smallest = right;
                }
                if (smallest == index) {
                    break;
                }

                swap(index, smallest);
                index = smallest;
            }
        }
    }
    ```
5. add 操作
    ```java
    class MinHeap {
        private int[] heap;
        private int size;

        public MinHeap(int capacity) {
            heap = new int[capacity];
            size = 0;
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public int peek() {
            return heap[0];
        }

        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (heap[index] >= heap[parent]) {
                    break;
                }
                swap(index, parent);
                index = parent;
            }
        }

        public void add(int val) {
            heap[size] = val;
            size++;
            siftUp(size - 1);
        }

        private void swap(int i, int j) {
            int temp = heap[i];
            heap[i] = heap[j];
            heap[j] = temp;
        }

        private void siftDown(int index) {
            while (true) {
                int left = index * 2 + 1;
                int right = index * 2 +2;
                int smallest = index;
                if (left < size && heap[left] < heap[smallest]) {
                    smallest = left;
                }
                if (right < size && heap[right] < heap[smallest]) {
                    smallest = right;
                }
                if (smallest == index) {
                    break;
                }

                swap(index, smallest);
                index = smallest;
            }
        }
    }
    ```
6.  poll 操作
    ```java
    class MinHeap {
        private int[] heap;
        private int size;

        public MinHeap(int capacity) {
            heap = new int[capacity];
            size = 0;
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public int peek() {
            return heap[0];
        }

        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (heap[index] >= heap[parent]) {
                    break;
                }
                swap(index, parent);
                index = parent;
            }
        }

        public int poll() {
            int ans = heap[0];
            heap[0] = heap[size - 1];
            size --;
            if (size > 0) {
                shiftDown(0);
            }
            return ans;
        }

        public void add(int val) {
            heap[size] = val;
            size++;
            siftUp(size - 1);
        }

        private void swap(int i, int j) {
            int temp = heap[i];
            heap[i] = heap[j];
            heap[j] = temp;
        }

        private void siftDown(int index) {
            while (true) {
                int left = index * 2 + 1;
                int right = index * 2 +2;
                int smallest = index;
                if (left < size && heap[left] < heap[smallest]) {
                    smallest = left;
                }
                if (right < size && heap[right] < heap[smallest]) {
                    smallest = right;
                }
                if (smallest == index) {
                    break;
                }

                swap(index, smallest);
                index = smallest;
            }
        }
    }
    ```


# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

🔄 验证失败，修改假设，开启下一次实验（EXP-002）。

❓ 产生新问题：[记录新问题]