---
title: "AI 数学基础"
date: '2026-05-05'
draft: false
description:  
toc: true
math: true
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

## 矩阵基本运算

{{< mind >}}
- 矩阵基本运算
    - 矩阵是什么
        - 是数字排列成的二维表格，用行数 x 列数描述它的形状（称为"维度"或"shape"）
        - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/07/20260507220522540.png,142,68)
        - 这是一个 2×3 矩阵（2 行 3 列）。用 $A_{ij}$​ 表示第 i 行第 j 列的元素，比如 $A_{12} = 2$
        - 矩阵的本质是线性变换。
        - 描述的是"把一个向量变成另一个向量"的规则。
    - 矩阵与向量的乘法
        - 计算规则
            - 矩阵 $A(m \times n)$ 乘以向量 $\vec{x}$（n 维），结果是一个 m 维向量
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/07/20260507221328789.png,353,92)
            - 结果的每一行，就是矩阵那一行与向量做点积。
        - 具体例子
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/07/20260507221813500.png,388,92)
            - 一个 3×2 的矩阵，把一个 2 维向量变成了 3 维向量。
            - 维度变了——这正是"变换"的含义。
        - 几何直觉
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/07/20260507221947557.png,126,66)
            - 该矩阵可以把任意 2D 向量逆时针旋转 90 度
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/07/20260507222314744.png,114,66)
            - 原来朝右的向量，变成了朝上的向量。矩阵就是这样编码变换规则的。
            - 矩阵 A 乘以向量 $\vec{x}$ 等于把 $\vec{x}$ 所在的空间拉伸、旋转、投影到另一个空间。
        - LLM 中的应用
            - Transformer 里，每个 token 的向量 $\vec{x}$ 乘以权重矩阵 $W_Q$​，得到 Query 向量
            - $\vec{q} = W_Q\vec{x}$
            - 这就是一次线性变换——把输入向量投影到"Query 空间"
    - 矩阵乘法
        - 计算规则
            - 两个矩阵相乘：$A(m\times k) \times B (k\times n) = C(m\times n)$
        - 关键约束
            - A 的列数必须等于 B 的行数（都是 k）。
            - 结果矩阵 C 的第 i 行第 j 列
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/07/20260507224234717.png,165,72)
            - 即 A 的第 i 行与 B 的第 j 列做点积。
        - 具体例子
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/05/07/20260507224403814.png,121,212)
        - 矩阵乘法的本质：变换的复合
            - 单独看计算规则很枯燥。真正重要的是它的意义
            - 矩阵 AB 表示"先做变换 B，再做变换 A"。
            - 就像函数复合 $f(g(x))$，矩阵乘法是在组合两个线性变换。
            - 神经网络的多层结构，本质上就是多个矩阵变换串联在一起，每一层都对数据做一次变换。
        - 矩阵乘法的重要性质
            - 不满足交换律
                - $AB \neq BA$（大多数情况下）
                - 先旋转再缩放，和先缩放再旋转，结果不同——顺序很重要。
            - 满足结合律
                - $(AB)C=A(BC)$
                - 这让我们可以灵活选择计算顺序（影响效率，不影响结果）
            - 
{{< /mind >}}


