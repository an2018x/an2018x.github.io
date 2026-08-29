---
title: "LLM 数学基础 40 天学习路线"
date: '2026-05-16'
draft: false
description: "从线性代数到 Transformer 实现：覆盖向量空间、矩阵微积分、概率论、信息论、优化算法的 40 天数学学习路线图。"
toc: true
math: true
tags:
  - AI
  - Math
  - LLM
  - Roadmap
---

LLM MATH · 40-DAY ROADMAP · FOUNDATIONS

# 从向量空间到 _Transformer_ 的四十天

适用于有大学数学基础、希望读懂 LLM 论文并能动手实现的学习者。 覆盖线性代数、微积分、概率论、信息论、优化算法、Transformer 数学六大板块。 节奏：每天 1–2 小时，前半段推公式，后半段写代码。 原则—— **直觉先行 → 公式验证 → 代码实现 → 论文对照。**

**TOTAL** 40 Days **PACE** 1–2 h / day **PHASES** 6 **TARGET** Attention Is All You Need **OUTPUT** 从零实现 mini-GPT

## 阶段总览

OVERVIEW

> **图：40 天数学路线图阶段总览**
>
> - LLM MATH 40-DAY ROADMAP — 6 PHASES
> - PHASE 1
> - 线性代数
> - Day 1 – 7
> - PHASE 2
> - 微积分与反向传播
> - Day 8 – 14
> - PHASE 3
> - 概率论与统计
> - Day 15 – 21
> - PHASE 4
> - 信息论
> - Day 22 – 25
> - PHASE 5
> - 优化算法
> - Day 26 – 30
> - PHASE 6
> - Transformer 数学
> - Day 31 – 40
> - KEY FORMULAS
> - A = UΣVᵀ
> - ∂L/∂w = δ·xᵀ
> - softmax(zᵢ)
> - H(P,Q) = −Σ P log Q
> - θ ← θ − η∇L
> - QKᵀ/√dₖ
> - SKILLS ACQUIRED
> - SVD
> - Backprop
> - MLE
> - Softmax
> - KL
> - Adam
> - Attention
> - RoPE
> - nanoGPT

FIG · 40 天数学路线总览:从线性代数基础到从零实现 Transformer

## 线性代数

DAY 1 – 7

LLM 里的一切——词向量、注意力权重、参数矩阵——本质上都是线性代数。 这一周的目标是建立从向量到 SVD 的完整直觉，并用 NumPy 验证每一个概念。

**DAY 01 · 向量与向量空间** — 点积 · L2 范数 · 余弦相似度 · 词嵌入直觉

**DAY 02 · 矩阵基本运算** — 矩阵乘法 · 转置 · 逆矩阵 · $QK^\top V$ 的矩阵视角

**DAY 03 · 线性变换的几何直觉** — 旋转 · 缩放 · 投影 · 秩 · 3B1B 线性代数本质

**DAY 04 · 特征值与特征向量** — 特征分解 · PCA · Embedding 空间主成分

**DAY 05 · SVD（奇异值分解）** — $A = U\Sigma V^\top$ · 低秩近似 · LoRA 的数学基础

**DAY 06 · 动手实践** — NumPy 实现 Embedding 查找表 · 手写矩阵乘法 · 余弦相似度

**DAY 07 · 复习与自测** — 手推余弦相似度 · 矩阵乘法结合律验证

核心公式: $\cos\theta = \frac{\mathbf{a} \cdot \mathbf{b}}{\lVert\mathbf{a}\rVert \cdot \lVert\mathbf{b}\rVert}$ · $A = U\Sigma V^\top$

## 微积分与反向传播

DAY 8 – 14

训练模型的本质是对损失函数求梯度、然后更新参数。 这一周从链式法则出发，经过计算图和矩阵求导，最终手写一个 micrograd。

**DAY 08 · 导数与偏导数** — 链式法则 · 偏导数几何意义 · 反向传播唯一前提

**DAY 09 · 梯度（Gradient）** — 梯度向量 · 梯度方向 · $f(x,y)=x^2y+3y$ 手算

**DAY 10 · 计算图** — 有向计算图 · 前向 vs 反向传播 · Karpathy micrograd

**DAY 11 · 手推反向传播** — 2 层 MLP 逐层手推 · $\delta = \partial L/\partial z$

**DAY 12 · 矩阵求导** — $\partial(Wx)/\partial W = x^\top$ · 布局约定 · Transformer 中的矩阵梯度

**DAY 13 · Jacobian 矩阵** — 多输出函数导数矩阵 · Softmax 的 Jacobian 结构

**DAY 14 · 动手实践 · micrograd** — 纯 Python/NumPy 实现自动求导 · 加法 · 乘法 · tanh

核心公式: $\frac{\partial L}{\partial w\_{ij}} = \delta\_j \cdot a\_i$ · $\frac{\partial(Wx)}{\partial W} = x^\top$

## 概率论与统计

DAY 15 – 21

语言模型本质是在建模"下一个词的概率分布"。 从条件概率到 Softmax，从 MLE 到 Bigram 模型， 这一周打通统计学与 LLM 训练目标之间的桥梁。

**DAY 15 · 概率基础** — 条件概率 · 联合概率 · 贝叶斯定理

**DAY 16 · 常见概率分布** — 高斯 · 伯努利 · Categorical 分布 · LLM 输出分布

**DAY 17 · 期望与方差** — $E[X]$ · $\text{Var}[X]$ · 协方差矩阵 · Layer Normalization

**DAY 18 · 最大似然估计（MLE）** — MLE 思想 · 预测下一个 token ≡ MLE

**DAY 19 · Softmax 函数** — exp 归一化 · 数值稳定性 · 温度参数

**DAY 20 · 语言模型中的概率** — $P(w\_1,\ldots,w\_n)$ 建模 · 自回归生成的数学原理

**DAY 21 · 动手实践 · Bigram 模型** — NumPy 实现 Softmax · Bigram 语言模型 · Karpathy makemore

核心公式: $\text{softmax}(z\_i) = \frac{e^{z\_i}}{\sum\_j e^{z\_j}}$ · $P(w\_t \mid w\_1,\ldots,w\_{t-1})$

## 信息论

DAY 22 – 25

信息论是理解"损失函数为什么有效"的关键。 交叉熵、KL 散度、困惑度——这四天解开训练目标背后的数学逻辑。

**DAY 22 · 熵（Entropy）** — $H(P) = -\sum P(x)\log P(x)$ · 不确定性度量

**DAY 23 · 交叉熵（Cross-Entropy）** — $H(P,Q) = -\sum P\log Q$ · 最小化交叉熵 $\equiv$ 最大化似然

**DAY 24 · KL 散度** — $D\_{\text{KL}}(P\|Q) = \sum P\log\frac{P}{Q}$ · RLHF 中的 KL 惩罚项

**DAY 25 · 困惑度（Perplexity）** — $\text{PPL} = \exp(H(P,Q))$ · 用 Bigram 模型计算 PPL

核心推导: $\min H(P,Q) \equiv \max \sum \log Q(x\_i) \equiv \text{MLE}$

## 优化算法

DAY 26 – 30

模型怎么"学习"，背后全是优化。 从最基本的梯度下降到 Adam，从学习率调度到梯度裁剪， 理解每一个超参数背后的数学直觉。

**DAY 26 · 梯度下降（GD & SGD）** — $\theta \leftarrow \theta - \eta\nabla L$ · Mini-batch SGD

**DAY 27 · Momentum 与 RMSProp** — 历史梯度加速 · 自适应学习率

**DAY 28 · Adam 优化器** — Momentum + RMSProp · $m\_t$ / $v\_t$ 偏差修正 · LLM 首选

**DAY 29 · 学习率调度** — Warmup + Cosine Decay · GPT / LLaMA 标准配置

**DAY 30 · 梯度问题** — 梯度消失 / 爆炸 · Gradient Clipping · 残差连接

Adam: $\hat{m}\_t = \frac{m\_t}{1-\beta\_1^t}$ · $\hat{v}\_t = \frac{v\_t}{1-\beta\_2^t}$ · $\theta \leftarrow \theta - \eta \cdot \frac{\hat{m}}{\sqrt{\hat{v}}+\epsilon}$

## Transformer 核心数学 + 动手实现

DAY 31 – 40

最后十天，把前五个阶段的所有数学工具组合起来—— 从 Embedding 到 Self-Attention，从 Multi-Head 到 LayerNorm， 精读原论文，从零实现一个 mini-GPT。

**DAY 31 · Embedding 的数学** — $|V| \times d$ 矩阵 · Position Embedding · 维度与表达能力

**DAY 32 · Self-Attention 机制** — $Q$ · $K$ · $V$ 线性变换 · $\text{Att} = \text{softmax}(QK^\top\!/\!\sqrt{d\_k})\,V$

**DAY 33 · 手推 Self-Attention** — $4 \times 3$ 序列矩阵 · 手算完整 Attention 输出

**DAY 34 · Multi-Head Attention** — 多组 Q/K/V · Concat + 投影 · 每个头学不同模式

**DAY 35 · 位置编码** — 正弦/余弦编码 · 相对位置表示 · RoPE 旋转位置编码

**DAY 36 · Layer Normalization** — $\text{LN}(x)=\frac{x-\mu}{\sigma}\!\cdot\!\gamma+\beta$ · Pre-LN vs Post-LN

**DAY 37 · FFN 与残差连接** — FFN 非线性变换 · $x + \text{FFN}(x)$ 的梯度流意义

**DAY 38 · 精读《Attention Is All You Need》** — Section 3 逐公式对照 · 每个公式都能解释

**DAY 39 · 从零实现 Transformer** — 参考 nanoGPT · PyTorch ~200 行 · 跑通训练

**DAY 40 · 综合回顾 · 数学笔记** — 六阶段知识串联 · 写 LLM 数学笔记 · 长期参考

核心公式: $\text{Attention}(Q,K,V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d\_k}}\right)V$

## 推荐资源清单

RESOURCES

### 视频（最直观）

VIDEO

### 3Blue1Brown

《线性代数的本质》《微积分的本质》——用动画建立几何直觉，B站有中文字幕。

MUST WATCH

### Andrej Karpathy「Neural Networks: Zero to Hero」

从 micrograd 到 makemore 再到 nanoGPT，边讲边写代码。本路线的核心参考。

### 书籍（系统深入）

TEXTBOOK

### Mathematics for Machine Learning

Deisenroth 等著，免费 PDF，专为 ML 设计的数学教材。覆盖线代、微积分、概率。

REFERENCE

### The Matrix Calculus You Need For Deep Learning

Parr & Howard 著，免费，20 页搞定矩阵求导——Day 12 的最佳伴读。

### 目标论文

1. **Attention Is All You Need** — Vaswani et al. (2017)，Transformer 原论文，第 40 天的终极检验

### 代码参考

karpathy/microgradkarpathy/makemorekarpathy/nanoGPTnumpy/numpypytorch/pytorch

Day 14 → micrograd · Day 21 → makemore · Day 39 → nanoGPT

## 学习方法建议

5 PRINCIPLES

01

### 30 + 60 分配法

前 30 分钟理解概念、推公式；后 30–60 分钟写代码或做练习。手推 \> 只看。

02

### 周末只复习

Day 7、14、21 等复盘日不引入新内容。避免知识积压，让概念沉淀。

03

### 20 分钟规则

遇到卡壳的概念不要死磕超过 20 分钟，先标记跳过，等后面看到应用场景往往会豁然开朗。

04

### 代码验证公式

每推导完一个公式，立刻用 NumPy 验证。数值对上了，才算真懂。

05

### 从应用到理论

先看这个数学在 LLM 里怎么用，再回过头理解为什么。有动机的学习效率翻倍。

"直觉先行 → 公式验证 → 代码实现 → 论文对照"

LLM MATH 40-DAY ROADMAP · FROM VECTORS TO TRANSFORMERS
