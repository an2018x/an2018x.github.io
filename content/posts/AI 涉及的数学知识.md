---
title: "AI 数学基础"
date: '2026-05-05'
draft: false
description:  
toc: true
---

# 线性代数

## 向量与向量空间

{{< mind height="860px" >}}
- 向量与向量空间
    - 什么是向量
        - 向量是一个有方向的量
        - 几何视角：空间中从原点出发的一支箭头，方向和长度都有意义
        - 代数视角：一组有序的数字
        - 示例
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505104026041.png,96,87)
            - 这是一个三维向量，每个数字对应一个坐标轴上的分量。
        - 词嵌入
            - 一个词（token）会被映射成一个几百甚至几千维的向量
            - 比如 "猫" 这个词可能被表示成一个 768 维的向量——你可以把它想象成 768 个坐标轴上的一个点
            - 语义相近的词在这个空间里位置接近
    - 向量的基本运算
        - 向量加法
            - 两个向量相加，对应分量分别相加
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505104141640.png,287,77)
            - 几何意义: 把 $\vec{b}$ 的起点接到 $\vec{a}$ 的终点，结果是合向量。
            - 在 LLM 里的例子：有研究发现，词向量之间存在近似的语义关系
            - vec("国王")−vec("男人")+vec("女人")≈vec("女王")
        - 标量乘法
            - 用一个数（标量）乘以向量，每个分量都乘以这个数
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505111258217.png,172,77)
            - 几何意义：把向量拉伸或压缩
    - 点积
        - 定义
            - 两个同维度向量的点积
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505114508393.png,360,73)
        - 示例
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505114528207.png,483,99)
        - 几何意义
            - 点积有另一种等价写法
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505114553768.png,165,50)
            - 其中 $\theta$ 是两向量之间的夹角
        - 关键洞察
            - 点积可以衡量两个向量"有多相似"。
            - 这正是 Attention 机制里 Query 和 Key 做点积的本质——算两个向量的相关程度
    - 向量范数(Norm)
        - 范数衡量向量的"长度"或"大小"
        - L2 范数（最常用）
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505115921185.png,251,61)
            - 就是我们熟悉的欧几里得距离
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505115946653.png,276,63)
        - L1 范数
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505120034974.png,255,43)
            - 各分量绝对值之和，在正则化（防止过拟合）中常用。
    - 余弦相似度
        - 把点积和范数组合起来，就得到余弦相似度——LLM 里衡量语义相似性的核心工具
        - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505120438471.png,383,76)
        - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/05/20260505120456734.png,389,164)
        - 余弦相似度只关心方向，不关心长度
        - 两个词的向量可能长度不同，但如果方向相同，说明它们在语义上是一致的
    - 向量空间
        - 满足以下条件的集合叫向量空间
            - 元素（向量）之间可以相加，可以被标量乘
            - 在这个集合里做加法和乘法，结果还在这个集合里
        - 最关键的概念是维度（Dimension）：向量空间需要多少个基向量来描述其中所有的点
        - GPT-2 用 768 维的向量空间来表示词义，GPT-3 用 12288 维。维度越高，理论上能编码的信息越丰富
    - Numpy 代码
        - 
        ```python
        import numpy as np

        # ─── 1. 创建向量 ───────────────────────────────────────
        a = np.array([1, 2, 3], dtype=float)
        b = np.array([4, -1, 2], dtype=float)

        print("向量 a:", a)
        print("向量 b:", b)

        # ─── 2. 向量加法与标量乘法 ─────────────────────────────
        print("\n向量加法 a + b:", a + b)
        print("标量乘法 2 * a:", 2 * a)

        # ─── 3. 点积 ──────────────────────────────────────────
        dot_product = np.dot(a, b)
        print("\n点积 a · b:", dot_product)

        # 手动验证
        manual_dot = sum(a[i] * b[i] for i in range(len(a)))
        print("手动计算点积:", manual_dot)

        # ─── 4. L2 范数 ────────────────────────────────────────
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        print("\n‖a‖₂ =", norm_a)
        print("‖b‖₂ =", norm_b)

        # ─── 5. 余弦相似度 ─────────────────────────────────────
        cos_sim = dot_product / (norm_a * norm_b)
        print("\n余弦相似度(a, b):", cos_sim)

        # ─── 6. 模拟词嵌入：哪个词和"猫"最相似？ ──────────────
        # 用随机向量模拟（实际中是模型学习出来的）
        np.random.seed(42)
        embedding_dim = 8  # 简化为 8 维演示

        word_vectors = {
            "猫":   np.random.randn(embedding_dim),
            "狗":   np.random.randn(embedding_dim),
            "汽车": np.random.randn(embedding_dim),
            "小猫": np.random.randn(embedding_dim),
        }

        # 手动让"猫"和"小猫"更相似
        word_vectors["小猫"] = word_vectors["猫"] + np.random.randn(embedding_dim) * 0.3

        def cosine_similarity(v1, v2):
            return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

        query = word_vectors["猫"]
        print("\n与"猫"的余弦相似度：")
        for word, vec in word_vectors.items():
            if word != "猫":
                sim = cosine_similarity(query, vec)
                print(f"  {word}: {sim:.4f}")
        ```
{{< /mind >}}