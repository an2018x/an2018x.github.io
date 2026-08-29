---
title: "Day 09 · Autograd 原理"
date: '2026-05-20'
draft: false
description: "用 ~200 行 Python 手写一个 mini-autograd:理解动态计算图的构建、链式法则的层层应用、拓扑排序的反向遍历。在最小可运行实现里看清 PyTorch backward() 的真面目。"
toc: true
tags:
  - AI
  - PyTorch
  - Autograd
  - Internals
---

DAY 09 · AI INFRA ROADMAP · 60 DAYS

# 手写一个 _Autograd_

Day 08 知道了 PyTorch 的 Autograd 是 Dispatcher 上的一层 key。 今天_把它彻底拆开_—— 用 200 行 Python 实现一个能跑 MLP 的 mini-autograd, 亲手完成"前向构图 → 拓扑排序 → 反向链式法则"的全过程。 跑通之后,PyTorch `backward()` 对你不再有秘密。

**DURATION** 3.5 h **THEORY** 1 h **CODING** 2 h **REVIEW** 0.5 h **STACK** Pure Python · NumPy 对照

## 思维导图

OVERVIEW

> **图：Day 9 思维导图**
>
> - DAY 09 · 手写 MINI-AUTOGRAD
> - CHAIN RULE · DYNAMIC GRAPH · TOPOSORT · BACKWARD
> - 01 · MATH
> - 链式法则
> - 02 · DATA
> - Value 节点结构
> - 03 · ALGO
> - backward 算法
> - 04 · BUILD
> - 200 行实现
> - dz/dx = Σ dz/dy · dy/dx
> - 局部梯度 · 全局梯度
> - 多路径累加
> - 反向模式 vs 前向
> - .data 数值
> - .grad 累积梯度
> - .\_children 输入
> - .\_backward 闭包
> - DFS 拓扑排序
> - 出度 0 = 起点
> - 逆序传播梯度
> - 梯度 += 累加
> - Value 类
> - 运算符重载
> - MLP demo
> - 与 PyTorch 对照
> - DELIVERABLES
> - 链式法则推导笔记
> - micrograd.py (200 行)
> - MLP 拟合 demo 跑通
> - PyTorch 梯度对照

FIG · Day 09 全景:数学 → 数据结构 → 算法 → 实现,四个层次端到端打通 Autograd

## 链式法则——一切的起点

25 MIN

Autograd 不是魔法,它只是_链式法则的工程化_。 数学上一行公式,实现上需要回答三个问题: 谁是谁的输入?局部梯度怎么算?多路径梯度怎么合并? 理清这三件事,backward 算法就只剩下"按图反着走一遍"。

**链式法则** :若 z = f(y), y = g(x),则
∂z/∂x = ∂z/∂y · ∂y/∂x
**多输入** :若 z 依赖 x 通过_多条路径_ y₁, y₂, ...,则梯度按路径 **相加** :
∂z/∂x = Σᵢ (∂z/∂yᵢ · ∂yᵢ/∂x)

> **图：链式法则可视化**
>
> - CHAIN RULE — LOCAL GRADIENTS ACCUMULATE BACKWARD
> - x
> - leaf
> - u
> - u = 2x
> - v
> - v = x²
> - y
> - y = u + v
> - z
> - z = y³
> - ∂u/∂x = 2
> - ∂v/∂x = 2x
> - ∂y/∂u = 1
> - ∂y/∂v = 1
> - ∂z/∂y = 3y²
> - 反向遍历:
> - x.grad = ∂z/∂x = 2·1·3y² + 2x·1·3y² = (2 + 2x)·3y²
> - ↑ 两条路径,分别相乘后相加
> - 输入
> - 输出

FIG · x → {u, v} → y → z:两条路径的局部梯度沿反向传播相乘,在 x 处相加

### 三个核心原语的局部梯度

| op | 正向 | 对 a 的局部梯度 | 对 b 的局部梯度 | 分发规则 |
| --- | --- | --- | --- | --- |
| add | `c = a + b` | `∂c/∂a = 1` | `∂c/∂b = 1` | 梯度 **等额** 传给两个输入 |
| mul | `c = a * b` | `∂c/∂a = b` | `∂c/∂b = a` | 梯度 **交叉乘** 对方的值 |
| relu | `c = max(a, 0)` | `∂c/∂a = 1 if a>0 else 0` | — | 负值 **断流** ,梯度归零 |

KEY INSIGHT

### 反向模式 = 一次反向遍历

前向模式(forward-mode AD)每次只能求一个输入的偏导,要算所有输入要跑 N 次前向。 **反向模式只要 1 次反向遍历就拿到所有输入的梯度** ——这就是为什么深度学习只用反向模式:参数数千万,输入是 loss 单点。

LOCAL = SIMPLE

### "局部"是组合的力量

每个 op 只需要知道 **自己的局部梯度** (只关心自己的输入输出),全局梯度由链式法则自动组合。这就是为什么 Autograd 容易扩展——加一个新 op 只需提供它的 forward 和 local backward,不必关心整张图。

建议: 拿笔在纸上手推一遍 z = (a+b)·c 对 a/b/c 的梯度,确认理解后再继续。

## Value 节点——计算图的原子

20 MIN

链式法则是数学,要把它跑起来还得有_承载图结构的数据结构_。 我们设计一个 `Value` 类,它既存储数据, 又是计算图的一个节点——前向时被链入图,反向时被遍历到。 只需要 **4 个字段 + 1 个闭包** 。

> **图：Value 节点结构**
>
> - VALUE NODE — 4 FIELDS + 1 CLOSURE
> - VALUE
> - .data
> - 前向数值
> - float | ndarray — op 计算后的实际值
> - .grad
> - 累积梯度
> - backward 时不断 += 各路径贡献
> - .\_children
> - 输入节点
> - tuple[Value, ...] — 反向遍历的边
> - .\_backward
> - 闭包
> - callable() — 把 self.grad 派发给 children
> - INPUTS
> - a · b
> - 前一层 Value 节点
> - 存入 c.\_children
> - 构图时记录
> - CLOSURE 干什么
> - def \_backward():
> - # 以 c = a \* b 为例
> - a.grad += b.data \* c.grad
> - b.grad += a.data \* c.grad
> - ↑ 把自己的梯度按局部
> - 导数分发给输入
> - 前向时构造 Value+closure · 反向时依次调用 closure

FIG · 每个 Value 节点 = 数据 + 累积梯度 + 输入列表 + 一段"把梯度回填给输入"的闭包

### Value 类骨架

```
class Value:
    """标量自动微分节点。data: float, grad: float, _children: tuple[Value]."""
    def __init__ (self, data, _children=(), _op=''):
        self.data = data # 前向值
        self.grad = 0.0 # 累积梯度,初始 0
        self._children = _children # 反向遍历用的"边"
        self._op = _op # 仅用于调试 / 打印
        self._backward = lambda: None # 默认 no-op,叶子节点用

    def __repr__ (self):
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f}, op={self._op!r})"
```

CLOSURE TRICK

### 为什么用闭包存反向逻辑

每个 op 的反向行为不一样,但调用方式必须统一。 **用闭包把 op 的反向逻辑"封装在结构里"** ——backward 算法只要无脑调 `node._backward()`,不需要 if-else 判断 op 类型。这是 micrograd 最优雅的设计。

+= NOT =

### 梯度累加而不是覆盖

同一个变量可能 **多次进入计算** (比如 `y = x*x` 里 x 出现两次)。如果用 `=` 覆盖,只会保留最后一条路径的贡献。 **必须 `+=`** ,这就是 PyTorch 也要 `optimizer.zero_grad()` 的原因——上一步的累加要清掉。

LEAF

### 叶节点的特殊性

叶节点(`.children = ()`)的 `_backward` 是 no-op——它没有上游可以再分发。但它的 `.grad` 会被所有指向它的 op 节点 `+=` 累加,最终就是该变量的总梯度。

CORRESPONDENCE

### 对照 PyTorch

`Value.data` ↔ `Tensor.data`;`.grad` ↔ `.grad`;`._children` ↔ `grad_fn.next_functions`;`._backward` ↔ `grad_fn.apply()`。 **结构完全同构,只是 PyTorch 在 C++ 里实现并支持张量、设备、dtype** 。

## backward 算法——拓扑排序 + 反向遍历

25 MIN

数据结构准备好,backward 算法只有_两个步骤_: ① 用 DFS 把整个 DAG 拓扑排序;② 按逆序遍历,每个节点调一次 `_backward()`。 为什么拓扑排序? **因为必须先收齐所有上游贡献的梯度,再往下游分发** —— 否则一个节点的 `.grad` 还不完整就用它做局部反向,结果就错了。

> **图：backward 算法流程**
>
> - BACKWARD ALGORITHM — TOPOSORT THEN REVERSE
> - STEP 1 · DFS 构造拓扑序
> - a
> - b
> - c
> - u
> - a+b
> - v
> - u\*c
> - z
> - v + bias
> - toposort 结果(从叶到根)
> - [a, b, u, c, v, z]
> - 前提:遍历完所有 children 才把 self 加入
> - def build(v):
> - if v in seen: return
> - seen.add(v)
> - for c in v.\_children:
> - build(c)
> - topo.append(v) ← 关键
> - STEP 2 · 反向遍历,逐个 \_backward()
> - z.grad = 1
> - 起点(已知)
> - z.\_backward()
> - 分发给 v · bias
> - v.\_backward()
> - 分发给 u · c
> - c.grad ← 已就绪
> - 无 \_backward 需调用
> - u.\_backward()
> - 分发给 a · b
> - a.grad / b.grad
> - 叶子,遍历结束
> - ↑ 严格按 reversed(toposort) 顺序调用

FIG · DFS 后置顺序产出的拓扑序,反向遍历就是反向自然顺序——保证每个节点被处理时它的 .grad 已经收齐

### backward 的 12 行实现

```
def backward(self):
    """从 self 出发触发反向传播,梯度回填到所有可达的叶节点。"""
    # 1) DFS 后置顺序构造拓扑序(从叶到根)
    topo, visited = [], set()
    def build(v):
        if v in visited: return
        visited.add(v)
        for child in v._children:
            build(child)
        topo.append(v)
    build(self)

    # 2) 自己的梯度初始化为 1 (默认 dL/dL = 1)
    self.grad = 1.0

    # 3) 反向遍历,逐节点调用其闭包
    for v in reversed(topo):
        v._backward()
```

WHY TOPOSORT

### 顺序错了梯度就错

设想反向时先处理 `u` 再处理 `z`——`u.grad` 还没被 `z._backward()` 写入,就被用去算 `a.grad`,等于 **用了一个未完成的梯度** 。 **必须保证一个节点的所有上游都处理完,它的 .grad 才是终值** 。拓扑序就是干这件事。

SEED = 1

### 为什么 self.grad = 1

反向传播的边界条件:计算 `∂L/∂L = 1`。从这个"种子"出发链式法则才能展开。PyTorch 里 `loss.backward()` 默认也是这个;若调 `tensor.backward(grad_outputs)` 就是 **显式指定上游梯度** ——可以是向量,常用于 Jacobian-vector product。

COMPLEXITY

### O(V + E) 时间

DFS 拓扑排序 O(V+E),反向遍历 O(V),每个节点的 `_backward` 摊销 O(d) 其中 d 是入边数。**总复杂度 = O(V + E),与正向传播同阶**——这是反向模式 AD 最强大的性质,backward 的代价不超过前向。

RECURSION DEPTH

### 深图要小心栈溢出

递归 DFS 在很深的网络(LLM 数百层)上会触发 Python 默认 1000 的栈深。 **生产实现用迭代版 DFS 或 sys.setrecursionlimit** 。Day 11/13 我们看 PyTorch 的工程实现就是迭代的。

## 完整实现 — micrograd.py

1 H

把前三节合起来,完整代码 **不到 200 行** 。 支持 `+ - * / ** exp log relu` 等基本 op, 足以训练一个手写的 MLP—— 这就是 Karpathy _micrograd_ 的核心思想。

### Value 类全实现

```
# micrograd.py — 标量自动微分,纯 Python ~150 行
from __future__ import annotations
import math

class Value:
    def __init__ (self, data, _children=(), _op=''):
        self.data = float(data)
        self.grad = 0.0
        self._children = _children
        self._op = _op
        self._backward = lambda: None

    # ----- 二元运算 -----
    def __add__ (self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), '+')
        def _backward():
            self.grad += 1.0 * out.grad
            other.grad += 1.0 * out.grad
        out._backward = _backward
        return out

    def __mul__ (self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), '*')
        def _backward():
            self.grad += other.data * out.grad # ∂out/∂self = other
            other.grad += self.data * out.grad # ∂out/∂other = self
        out._backward = _backward
        return out

    def __pow__ (self, k): # 仅支持常数指数
        assert isinstance(k, (int, float))
        out = Value(self.data **k, (self,), f'**{k}')
        def _backward():
            self.grad += (k * self.data ** (k - 1)) * out.grad
        out._backward = _backward
        return out

    # ----- 一元非线性 -----
    def relu(self):
        out = Value(max(0.0, self.data), (self,), 'relu')
        def _backward():
            self.grad += (1.0 if self.data > 0 else 0.0) * out.grad
        out._backward = _backward
        return out

    def exp(self):
        out = Value(math.exp(self.data), (self,), 'exp')
        def _backward():
            self.grad += out.data * out.grad # d(eˣ)/dx = eˣ
        out._backward = _backward
        return out

    def log(self):
        out = Value(math.log(self.data), (self,), 'log')
        def _backward():
            self.grad += (1.0 / self.data) * out.grad
        out._backward = _backward
        return out

    # ----- 派生运算 (复用上面已有的) -----
    def __neg__ (self): return self * -1
    def __sub__ (self, o): return self + (-o)
    def __rsub__ (self, o): return o + (-self)
    def __truediv__ (self, o): return self * (o **-1 if isinstance(o, (int, float)) else o** -1)
    def __radd__ (self, o): return self + o
    def __rmul__ (self, o): return self * o

    # ----- backward -----
    def backward(self):
        topo, visited = [], set()
        def build(v):
            if id(v) in visited: return
            visited.add(id(v))
            for c in v._children:
                build(c)
            topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()

    def __repr__ (self):
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f}, op={self._op!r})"
```

### 最小冒烟测试

```
from micrograd import Value

a = Value(2.0)
b = Value(-3.0)
c = Value(10.0)
e = a * b
d = e + c # d = a·b + c = -6 + 10 = 4
f = d.relu() # f = relu(4) = 4
f.backward()

print(a.grad, b.grad, c.grad)
# 期望:
# ∂f/∂a = b * 1 (relu 通过) = -3
# ∂f/∂b = a * 1 = 2
# ∂f/∂c = 1
# 输出:-3.0 2.0 1.0 ✓
```

### 用它训练一个 MLP

```
import random
from micrograd import Value

# --- 用 Value 搭建一个最小神经网络 ---
class Neuron:
    def __init__ (self, nin):
        self.w = [Value(random.uniform(-1, 1)) for _ in range(nin)]
        self.b = Value(0.0)
    def __call__ (self, x):
        act = sum((wi * xi for wi, xi in zip(self.w, x)), self.b)
        return act.relu()
    def parameters(self):
        return self.w + [self.b]

class Layer:
    def __init__ (self, nin, nout):
        self.neurons = [Neuron(nin) for _ in range(nout)]
    def __call__ (self, x):
        return [n(x) for n in self.neurons]
    def parameters(self):
        return [p for n in self.neurons for p in n.parameters()]

class MLP:
    def __init__ (self, sizes):
        self.layers = [Layer(sizes[i], sizes[i+1]) for i in range(len(sizes)-1)]
    def __call__ (self, x):
        for l in self.layers: x = l(x)
        return x[0] if len(x)==1 else x
    def parameters(self):
        return [p for l in self.layers for p in l.parameters()]

# --- 数据:学一个简单 XOR-like 数据集 ---
xs = [[2.0,3.0], [3.0,-1.0], [0.5,1.0], [1.0,1.0]]
ys = [1.0, -1.0, -1.0, 1.0]

model = MLP([2, 4, 4, 1])

# --- 训练循环 ---
for step in range(200):
    # 1) 前向 + loss
    preds = [model(x) for x in xs]
    loss = sum((p - y)**2 for p, y in zip(preds, ys))

    # 2) 清梯度 + 反向
    for p in model.parameters(): p.grad = 0.0
    loss.backward()

    # 3) SGD 更新
    lr = 0.05
    for p in model.parameters():
        p.data -= lr * p.grad

    if step % 20 == 0:
        print(f"step {step:3d} loss = {loss.data:.4f}")

# 你应该看到 loss 一路下降到接近 0,200 行代码就训练了一个 MLP
```

REVELATION

### 整个 PyTorch 训练循环就是这五行

前向 → loss → zero\_grad → backward → optimizer.step, **每个真实训练循环都是这五步** 。PyTorch 复杂度全在"如何把每一步加速到 GPU、张量化、并行化",_逻辑上和这 150 行没有不同_。

SCALAR vs TENSOR

### 从标量到张量

micrograd 是 **标量** 自动微分,每个数都是单独节点。PyTorch 是 **张量** 自动微分,一个节点持有整个张量,局部梯度也是张量。_抽象同构,只是把数换成张量后局部梯度公式更复杂(矩阵乘的反向是另一个矩阵乘)_。

EXTEND

### 怎么加一个新 op

三步走:① 计算 `out.data`;② 构造 `Value(out_data, (self, ...), 'op_name')`;③ 定义 `_backward`(写出对每个输入的局部梯度)。比如要加 `tanh`:`out.data = tanh(x)`,`self.grad += (1 - out.data**2) * out.grad`。

DEBUGGING

### 用 Graphviz 看图

给 Value 写个简单的递归 dot 导出器(每个节点画圆,每条 `_children` 画边),用 Graphviz 渲出来——你会得到和 PyTorch torchviz 输出几乎一样的反向图。 **调试梯度问题的第一手段** 。

交付物: 把上面三个代码块整合保存为 micrograd.py + test\_mlp.py,跑通后 loss 应稳定下降。

## 与 PyTorch 对照验证

20 MIN

手写的代码要_和参考实现交叉验证_才算可信。 把同一个表达式分别在 micrograd 和 PyTorch 里算一遍, 对比梯度——一致就说明你的实现是对的。 这也是写新 op 时最有效的回归测试方法。

```
import torch
from micrograd import Value

# ----- 测试函数:f(a, b, c) = (a * b + c).relu() ** 2 -----

# 1) micrograd 版本
a1 = Value(2.0); b1 = Value(-3.0); c1 = Value(10.0)
y1 = ((a1 * b1 + c1).relu()) ** 2
y1.backward()
mg = (y1.data, a1.grad, b1.grad, c1.grad)

# 2) PyTorch 版本
a2 = torch.tensor(2.0, requires_grad=True)
b2 = torch.tensor(-3.0, requires_grad=True)
c2 = torch.tensor(10.0, requires_grad=True)
y2 = ((a2 * b2 + c2).relu()) ** 2
y2.backward()
pt = (y2.item(), a2.grad.item(), b2.grad.item(), c2.grad.item())

# 3) 对比
for name, x, y in zip(["y", "a.grad", "b.grad", "c.grad"], mg, pt):
    print(f"{name:8s} micrograd={x:8.4f} pytorch={y:8.4f} ok={abs(x-y)<1e-6}")

# 期望输出:
# y micrograd= 16.0000 pytorch= 16.0000 ok=True
# a.grad micrograd=-24.0000 pytorch=-24.0000 ok=True
# b.grad micrograd= 16.0000 pytorch= 16.0000 ok=True
# c.grad micrograd= 8.0000 pytorch= 8.0000 ok=True
```

### 两边的对应关系

| 概念 | micrograd | PyTorch | 区别 |
| --- | --- | --- | --- |
| 节点 | `Value` | `Tensor` | PyTorch 持有多维数据 + 设备 + dtype |
| 数据 | `.data` (float) | `.data` (Tensor) | 同名,语义一致 |
| 梯度 | `.grad` (float) | `.grad` (Tensor) | 都是累加(`+=`) |
| 反向边 | `._children` | `grad_fn.next_functions` | PyTorch 把图节点和 Tensor 分开 |
| 反向逻辑 | `._backward` (闭包) | `grad_fn.apply()` (C++ 类) | PyTorch 为性能用静态分发 |
| 触发 | `v.backward()` | `v.backward()` | 完全同名 |
| 种子梯度 | self.grad = 1 | 等价默认行为 | PyTorch 支持 `grad_outputs` 显式指定 |
| 清梯度 | 循环置 0 | `optimizer.zero_grad()` | 语义一致 |

### 推荐扩展练习

EXERCISE 01

### 加一个 sigmoid

实现 `sigmoid(x) = 1/(1+exp(-x))`,梯度 `σ(x)(1-σ(x))`。在 MLP 里把 ReLU 换成 sigmoid 看训练效果。

EXERCISE 02

### 实现 detach()

给 Value 加 `.detach()`:返回一个新 Value,`_children=()`。验证用它能切断梯度路径(对应 PyTorch 同名 API)。

EXERCISE 03

### 检测重复 backward

PyTorch 默认 `.backward()` 后会释放图,再次 backward 会报错(`retain_graph=False`)。给 micrograd 加同样的保护——backward 后清空 `_children`。

EXERCISE 04 (挑战)

### 张量化:TinyTensor

把 Value 换成 ndarray:每个节点持有 numpy 数组,实现 matmul/sum/broadcast 等。 **能跑通一个真正的张量 autograd,你就理解了 PyTorch 的核心** ——这是一个不错的周末项目。

良好习惯: 写完一个新 op 立刻和 PyTorch 对照梯度,差异 \> 1e-5 就回头查实现,别凭感觉过。

## 常见疑问

5 QUESTIONS

### Q1 · 闭包捕获的 self / other 是什么时候求值的?会不会出问题?

ANS

闭包 **按引用捕获变量名** ,在调用时才查值。但这里 `self`、`other`、`out` 都是 **对象引用** (Python 里就是指针),即使 `data` 后来变了,引用仍指向同一对象,因此能正确读到当时的 `self.data` 等。

常见陷阱:在 **for 循环里定义闭包并保存到列表** ,所有闭包会引用同一个循环变量,导致全部读到最后一次的值。micrograd 这里没有这个问题,因为每次调 ` __mul__ ` 都是新的函数作用域。

### Q2 · 为什么必须用 `+=` 累加梯度?

ANS

因为 **一个节点可能被多次"使用"** ,沿不同路径都有梯度贡献。例如 `y = x*x`:

计算 `y` 的 `_backward` 时,`self` 和 `other` 都是同一个 `x`。两行 `self.grad += other.data * out.grad` 和 `other.grad += self.data * out.grad` 都会写到 `x.grad`,结果 `x.grad = 2x`——恰好就是 `d(x²)/dx`。如果用 `=`,只会保留后一次,结果错。

这也是为什么 PyTorch 每次训练前要 `optimizer.zero_grad()`——上一步累积的梯度要清,否则会和本步混在一起。

### Q3 · DFS 拓扑排序为什么必须是"后置"顺序?

ANS

后置 DFS(先递归 children,再 append self)的产出顺序是 **"叶在前,根在后"** 。反转一下就是"根在前,叶在后"——正好是反向传播需要的顺序:从输出节点的 `.grad` 出发,逐步往叶子分发。

如果用前置 DFS(先 append 再递归),顺序会变成"根在前,叶在后"。反转后是"叶在前,根在后",反向遍历时根的梯度还没写就开始往下分发 —— 错。

本质: **后置 DFS 保证一个节点被 append 时它的所有 children 都已经在序列里了** ,反过来就保证反向遍历时所有上游都处理完了。

### Q4 · 如果计算图有环会怎样?神经网络真的是 DAG 吗?

ANS

必须是 DAG。如果有环,DFS 会无限递归(或者用 visited 集合跳过环节点,但梯度结果不正确)。

神经网络的计算图 **每个时刻都是 DAG** 。即使 RNN/Transformer 看起来"循环",实际上是 **展开** (unroll)后的 DAG——每个时间步是独立节点,只是参数共享(同一个 Value 被多个 op 引用,这正是 `+=` 累加发挥作用的地方)。

所以"参数共享"和"图里有环"完全是两回事:前者是_同一节点被多次使用_,后者是_真正的循环依赖_。神经网络只有前者,没有后者。

### Q5 · PyTorch 的 backward 比 micrograd 复杂在哪里?

ANS

核心算法 **完全一样** (toposort + reversed 遍历),复杂度全在工程细节:

(1) **张量梯度,不是标量** :matmul 的反向是另一个 matmul,conv 的反向需要 transposed conv,这些反向公式都不平凡。

(2) **原地操作 (in-place)**:`x.add_(1)` 会修改 `x.data`,但反向可能需要原值——PyTorch 用 version counter 检测违规。

(3) **多 GPU / 异步 / stream** :backward 也要派发到正确的 device,跨 device 时插入 memcpy。

(4) **高阶导数 (double backward)**:对 grad 再求 grad,需要图里嵌套图。

(5) **计算图释放策略** :`retain_graph=False` 默认 backward 后销毁 saved tensors 释放显存。

(6) **并行 backward** :大图可以拆成几路并发反向,在 C++ 引擎里有专门的 ready queue 调度。

但理解了 micrograd,这些都是_对同一个算法骨架的工程加固_。

## 复盘问题

5 QUESTIONS

1. 手推 `z = (a + b * c) ** 2` 对 a / b / c 的偏导,写出每个中间变量的局部梯度,标出反向遍历顺序。
2. 写一个 `tanh` 算子加入 micrograd:实现 `_backward`,并用 PyTorch 对照验证(梯度公式 `1 - tanh²(x)`)。
3. 解释为什么反向模式 AD 的总耗时与前向同阶,但前向模式 AD 需要 N 次前向才能算所有 N 个输入的梯度。
4. 把 micrograd 的递归 DFS 改成迭代版本(用显式栈)。运行你的 MLP demo 验证结果一致。
5. 设计实验:把 `y = x * x` 的 backward 跑一遍,然后 **故意** 把 `+=` 改成 `=`,观察 `x.grad` 错在什么数字上,解释为什么。

## 今日检查清单

8 ITEMS

- 能用一张图说出 z = (a+b)·c 的局部梯度分布和反向累加路径
- 理解为什么深度学习只用反向模式,不用前向模式 AD
- 能写出 Value 类的 4 个核心字段,解释每一个的作用
- 能解释"用闭包存反向逻辑"相比"按 op 类型 if-else 派发"的优势
- 能写出 backward 的 12 行实现,解释为什么必须用后置 DFS
- micrograd.py 跑通,Value 的 + / \* / \*\* / relu 全部测试通过
- MLP demo 跑通,loss 能稳定下降到接近 0
- 与 PyTorch 对照验证至少 3 个表达式,梯度全部一致(差 \< 1e-6)

## 推荐阅读

5 ITEMS

MUST READ

### Karpathy — micrograd / Lecture

"The spelled-out intro to neural networks and backpropagation" 这一讲视频 + 代码仓库。今天的所有思路都是它的精炼版,Karpathy 在视频里手把手 live coding 极清晰。

PAPER

### Baydin et al. — Automatic Differentiation in Machine Learning: a Survey

2018 年的综述,系统讲清楚 AD 的四种模式(symbolic / numeric / forward / reverse)以及各自的复杂度权衡。读完不会再混淆这些概念。

SOURCE

### PyTorch torch/autograd/\_\_init\_\_.py

PyTorch Python 层 backward 入口,虽然真正的执行在 C++ 引擎里,但 Python 这层薄薄的入口很值得读——可以看到 grad\_outputs、retain\_graph 等参数的真实语义。

BLOG

### ezyang — How PyTorch's Autograd Engine works

从 C++ 引擎角度讲 PyTorch backward 怎么调度多 GPU、怎么用 ready queue 做并行。和 micrograd 是不同维度的同一件事。

TEXTBOOK

### Goodfellow DL — Chapter 6.5 Back-Propagation

《Deep Learning》经典教材 6.5 节,从矩阵微分的视角推 backward,可以补齐"从标量到张量"的数学跨越。

## Day 10 预告

NEXT

COMING NEXT

### 算子与后端 — ATen / c10 / CUDA kernel 注册

今天看清了 Autograd,Day 10 把目光投向 **算子的实现层** :ATen 是什么、c10 在哪一层、一个 CUDA kernel 在源码里是怎样注册到 Dispatcher 的?读懂这一层之后,"给 PyTorch 加一个自定义算子"对你不再神秘——这是 Phase 2 实战分布式时必备的能力。

"反向传播不是技巧,是几何——链式法则把局部斜率沿图反着传一遍而已。"

DAY 09 · AI INFRA 60-DAY ROADMAP
