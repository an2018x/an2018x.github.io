---
title: "Day 08 · PyTorch 核心抽象"
date: '2026-05-19'
draft: false
description: "打开 PyTorch 黑盒:Tensor 与 Storage 的分离、Dispatcher 的多重派发机制、Autograd Engine 的工作原理。跟踪一行 a + b 从 Python 一路调到 CUDA kernel 的完整路径。"
toc: true
tags:
  - AI
  - PyTorch
  - Internals
  - Dispatcher
  - Autograd
---

DAY 08 · AI INFRA ROADMAP · PHASE 1 START

# 打开 _PyTorch_ 的黑盒

Phase 1 起步——这一周不再写 CUDA,而是_拆开框架_。 今天要回答一个问题:你敲下 `c = a + b` 之后,Python 到 CUDA kernel 之间到底发生了什么? 答案藏在三个核心抽象里—— **Tensor / Dispatcher / Autograd** ,它们决定了 PyTorch 的全部表达能力。

**PHASE 1 / 6** · 深度学习框架内部机制 · DAY 08 – 14 · 阶段开启

**DURATION** 3 h **THEORY** 1.5 h **HANDS-ON** 1 h **REVIEW** 0.5 h **STACK** Python · ATen · c10 · CUDA

## 思维导图

OVERVIEW

> **图：Day 8 思维导图**
>
> - DAY 08 · PYTORCH 核心抽象
> - TENSOR · STORAGE · DISPATCHER · AUTOGRAD
> - 01 · TENSOR
> - Tensor / Storage
> - 02 · DISPATCHER
> - 多重派发系统
> - 03 · AUTOGRAD
> - Autograd Engine
> - 04 · CALL PATH
> - a + b 全链路
> - metadata + ptr
> - shape · stride · offset
> - view · contiguous
> - Storage 引用计数
> - DispatchKey 集
> - DispatchKeySet 位图
> - native\_functions.yaml
> - kernel 注册
> - requires\_grad
> - grad\_fn 节点
> - 动态计算图
> - Autograd Key
> - Python → C++
> - ATen 入口
> - Dispatcher 路由
> - CUDA kernel
> - DELIVERABLES
> - Tensor/Storage 关系笔记
> - DispatchKey 速查表
> - \_\_torch\_dispatch\_\_ 拦截
> - a+b 调用链注释图

FIG · Day 08 全景:三大抽象层叠加,共同决定一行 op 如何变成 GPU 执行

## Tensor 与 Storage 的分离

30 MIN

第一个反直觉:_Tensor 不持有数据_。 Tensor 是 **一组元数据** (shape / stride / offset / dtype / device), 数据本身存在它指向的 `Storage` 里。 `transpose`、`view`、`slice` 之所以是 O(1) 操作, 就是因为它们只改 Tensor 元数据,不动 Storage 一个字节。

> **图：Tensor 与 Storage 关系**
>
> - TENSOR = METADATA · STORAGE = ACTUAL BYTES
> - TENSOR A · view of full storage
> - shape = (3, 4)
> - stride = (4, 1)
> - offset = 0
> - dtype=float32 · device=cpu
> - TENSOR B · A.T (transpose)
> - shape = (4, 3)
> - stride = (1, 4) ← 互换!
> - non-contiguous
> - TENSOR C · A[1:, :2]
> - shape=(2,2) stride=(4,1) offset=4
> - STORAGE · CONTIGUOUS BYTES · float32 × 12
> - 0
> - 1
> - 2
> - 3
> - 4
> - 5
> - 6
> - 7
> - 8
> - 9
> - 10
> - 11
> - 索引 0–11 是 Storage 上的物理位置
> - 高亮 = C 引用的 4 个元素
> - 所有三个 Tensor 共享同一个 Storage,引用计数 = 3
> - 访问 T[i, j] 的物理地址 = storage[offset + Σ i\_k · stride\_k]
> - B.T 是 view,没有复制数据,只反转了 stride
> - .contiguous() 才会真复制一份

FIG · Tensor 只是 Storage 的"视图",改 shape/stride/offset 不动数据本身

### 三件事:shape / stride / offset

| 字段 | 语义 | 计算 T[i,j] 时的角色 | 修改它的典型操作 |
| --- | --- | --- | --- |
| shape | 每一维的大小 | 遍历范围 / 边界检查 | `view`, `reshape`, `squeeze` |
| stride | 跨过一个该维元素要走几个 storage 元素 | 物理偏移 = Σ i\_k · stride\_k | `transpose`, `permute`, `expand` |
| offset | 这个 Tensor 从 Storage 的第几个元素开始 | 加在最终物理地址上 | `slice` (`a[1:]`) |
| dtype | 元素类型 | 每个元素占多少字节 | `.to(torch.float16)` 会复制 |
| device | 数据在 CPU 还是哪张 GPU | 决定后续 dispatch 路径 | `.cuda()`, `.to('cuda:0')` |

### Python 里印证一下

```
import torch

a = torch.arange(12, dtype=torch.float32).view(3, 4)
print(a.shape, a.stride(), a.storage_offset())
# torch.Size([3, 4]) (4, 1) 0 ← 行优先 row-major

b = a.T # 转置:仅交换 stride
print(b.shape, b.stride(), b.is_contiguous())
# torch.Size([4, 3]) (1, 4) False

# A 和 B 共享 Storage —— 验证
print(a.data_ptr() == b.data_ptr()) # True
print(a.untyped_storage().data_ptr() == b.untyped_storage().data_ptr()) # True

c = a[1:, :2] # slice:offset 变了,stride 不变
print(c.shape, c.stride(), c.storage_offset())
# torch.Size([2, 2]) (4, 1) 4

# contiguous 会真的复制
d = b.contiguous()
print(a.data_ptr() == d.data_ptr()) # False —— 新 Storage
```

KEY INSIGHT

### view ≠ copy

所有 view 类操作 (`view` / `transpose` / `permute` / `slice` / `expand`) 都是 O(1) 的元数据操作。 **真正会触发数据复制的** 是 `.contiguous()` / `.clone()` / `.to(...)` 跨设备或跨 dtype。

CONTIGUOUS

### 什么叫"连续"

contiguous 的严格定义: **stride 严格递减且最末维 stride = 1** 。许多 CUDA kernel 要求 contiguous 输入,所以转置后再喂 GEMM 通常会触发 `.contiguous()` 隐式复制。Profile 看到莫名 memcpy 时,八成是这个。

EXPAND

### expand 的零拷贝技巧

`tensor.expand(N, *)` 把 `(1, *)` 扩成 `(N, *)` ——通过把那一维的 **stride 设为 0** 实现"虚拟重复",不占额外内存。Broadcast 的底层就是它。

SHARING

### Storage 的引用计数

Storage 内部维护一个引用计数,Tensor 销毁时 -1,到 0 才真正释放。 **OOM 排查时常见:一个 slice 引用着大 Tensor 的 Storage,导致 99% 数据被保留** ——这种内存泄漏比想象中常见。

动手提示: 在 ipython 里用 sys.getrefcount(a.untyped\_storage()) 看引用计数变化,直观感受共享。

## Dispatcher — 多重派发系统

35 MIN

PyTorch 的一个 op(比如 `torch.add`)其实有 **几十个不同的实现** —— CPU 一个、CUDA 一个、Vulkan 一个、Autograd 包装一个、Autocast 包装一个…… Dispatcher 就是_根据当前 Tensor 的属性挑选哪一个实现_的中间路由层。 它是 PyTorch 全部扩展性的来源。

> **图：Dispatcher 流程**
>
> - DISPATCHER FLOW — KEY-BASED MULTI-DISPATCH
> - STEP 1 · 收集 Key
> - Tensor → DispatchKeySet
> - 从输入张量提取所有 key
> - STEP 2 · 取最高优先级
> - highestPriorityKey()
> - 按预设顺序找第一个 set
> - STEP 3 · 查 kernel 表
> - opTable[op][key] → fn
> - 命中即调用对应 kernel
> - STEP 4 · 执行
> - 调用对应实现
> - CUDA / CPU / fallback
> - KEY ORDER (高优先 → 低优先, 简化版)
> - Python
> - \_\_torch\_dispatch\_\_
> - Autocast
> - AMP 类型转换
> - Autograd
> - 记录反向函数
> - Functorch
> - vmap / grad
> - CUDA
> - 真 kernel
> - CPU
> - REDISPATCH
> - 每个高优 key 的 kernel 做完自己的工作(类型转换 / 记录图等)后,
> - 会从 KeySet 中移除当前 key,再调用 redispatch 把请求
> - 交给下一个 key 处理。一行 op 通常经过 3–5 层 redispatch 才落到真实 kernel。

FIG · Dispatcher 不是一次性 dispatch,而是按 key 优先级层层 redispatch 的洋葱结构

### 常见 DispatchKey 速查

| Key 类别 | 代表性 key | kernel 在做什么 |
| --- | --- | --- |
| Wrapper (高优) | `PythonTLSSnapshot`, `PythonDispatcher` | 把控制权交给 Python(` __torch_dispatch__ `) |
| Autocast | `AutocastCUDA`, `AutocastCPU` | AMP:把 fp32 输入转 fp16/bf16,再 redispatch |
| Autograd | `AutogradCUDA`, `AutogradCPU` | 构图、保存反向所需 tensor,再 redispatch 到真实 kernel |
| Functorch | `FuncTorchBatched`, `FuncTorchGrad` | vmap/grad 的实现:批量化 / 高阶导 |
| Backend (低优) | `CUDA`, `CPU`, `MPS`, `XPU` | 真实 kernel 实现 —— 终点 |
| Fallback | `CompositeImplicitAutograd` | 用其他 op 组合实现 —— 不少 op 没有自己 kernel |

### native\_functions.yaml — 算子签名的真理之源

所有 ATen 算子的 **签名、变体、dispatch 配置** 都集中在 `aten/src/ATen/native/native_functions.yaml`。读 PyTorch 源码的入口就在这里。

```
# aten/src/ATen/native/native_functions.yaml 节选 (示意)
- func: add.Tensor(Tensor self, Tensor other, *, Scalar alpha=1) -> Tensor
  device_check: NoCheck
  structured_delegate: add.out
  variants: function, method
  dispatch:
    SparseCPU, SparseCUDA: add_sparse
    MkldnnCPU: mkldnn_add
    ZeroTensor: add_zerotensor
  tags: pointwise

# 说明:
# structured_delegate: 这个 op 是 structured kernel,实际实现复用 add.out
# dispatch: 列出每种 DispatchKey 对应的 kernel 函数名
# 未列出的 backend 由代码生成器自动生成默认派发
```

WHY MULTI-DISPATCH

### 为什么不是简单 if-else

因为同一个 op 要支持 **backend × dtype × autograd × autocast × functorch × ...** 的笛卡尔积。硬编码 if-else 不可维护;Dispatcher 把这些维度抽成 **独立可叠加的 key** ,新增一个特性只需注册一组 key,不改老代码。

KEYSET BITMAP

### DispatchKeySet 是 64 位 bitmap

实现细节:每个 Tensor 持有一个 64-bit 整数,每一位代表是否带某个 key。"取最高优先级 key" 就是一次 `__builtin_clz`(count leading zeros),纳秒级。Dispatcher 在 hot path 上零开销。

REDISPATCH

### 调用栈洋葱

`torch.add(a, b)` 在 `requires_grad=True` 时的实际 C++ 栈:Python → Autocast → Autograd → CUDA kernel。每层 kernel 做完自己事,移除自己的 key,再 redispatch。 **栈深 = key 集合大小** 。

EXTENSIBILITY

### 你也能注册 key

研究项目想给所有 op 加打印?写个`TORCH_LIBRARY_IMPL`,把所有 op 的"高优 key" 注册成你的函数。不动 PyTorch 一行代码就能 **拦截整个框架** ——下一节会动手做。

## Autograd Engine 概览

20 MIN

Autograd 是 PyTorch 最迷人的部分——一行 `loss.backward()` 让所有参数自动有了梯度。 今天只做_机制概览_(Day 09 才手写), 重点理解三个概念: **requires\_grad、grad\_fn、动态计算图** 。

> **图：Autograd 计算图**
>
> - DYNAMIC COMPUTATION GRAPH — z = (a + b) \* c
> - a
> - requires\_grad=T
> - b
> - c
> - grad\_fn
> - AddBackward0
> - a+b
> - grad\_fn=Add
> - MulBackward0
> - z
> - grad\_fn=Mul
> - 前向(实线):构图
> - 反向(虚线):backward() 沿图回溯

FIG · 前向时构图,backward 时沿 grad\_fn 链反向遍历,累积梯度到叶节点

### 最小可演示

```
import torch

a = torch.tensor([2.0], requires_grad=True)
b = torch.tensor([3.0], requires_grad=True)
c = torch.tensor([4.0], requires_grad=True)

z = (a + b) * c

# 看一下 z 的 grad_fn —— 反向图的入口
print(z.grad_fn)
# <MulBackward0 object at 0x...>

print(z.grad_fn.next_functions)
# ((<AddBackward0 object>, 0), (<AccumulateGrad object>, 0))

# 触发反向
z.backward()

# 梯度被累加到叶子上
print(a.grad, b.grad, c.grad)
# tensor([4.]) tensor([4.]) tensor([5.])
# ∂z/∂a = c = 4, ∂z/∂b = c = 4, ∂z/∂c = a+b = 5
```

DYNAMIC

### 动态图 vs 静态图

PyTorch 的图 **每次前向重新构建** 。这给了 Python 控制流(if/while)天然支持,代价是无法做整图优化——这正是 `torch.compile`(Day 13)要解决的问题。

grad\_fn LINK

### 反向图就是 grad\_fn 链

每个由 op 产出的 Tensor 都带一个 `grad_fn`,它的 `next_functions` 指向输入 Tensor 的 grad\_fn,形成 **从输出到叶子的反向 DAG** 。`backward()` 就是在这个 DAG 上做拓扑排序。

SAVED TENSORS

### 反向需要的输入会被保存

计算 `∂(a*c)/∂a = c` 需要 c 的值。所以前向时 c 被 **saved\_tensors** 钩住,backward 才能用。这是 activation 显存占用的根源——也是 gradient checkpointing 优化的对象(Day 14)。

AUTOGRAD KEY

### Autograd 就是一组 Dispatcher Key

记住第 02 节的洋葱: **Autograd 不是独立系统,而是 Dispatcher 的一层 key** 。Autograd key 对应的 kernel 做"构图 + redispatch 到真 kernel"两件事,前向完整执行后,反向图就构好了。

Day 09 预告: 我们会手写一个 ~200 行的 mini-autograd,完全复现这一套机制。今天先建立直觉。

## a + b 的完整调用链

20 MIN

把前三节串起来。一行 `c = a + b`(`a, b` 是 CUDA Tensor,`requires_grad=True`), Python 解释器到 GPU 的 ALU 之间至少经过 **8 步** 。这是 PyTorch 内部机制的体检图。

> **图：a+b 调用链**
>
> - FULL CALL PATH — c = a + b · a,b on CUDA · requires\_grad=True
> - 1
> - PYTHON
> - c = a + b → 触发 a.\_\_add\_\_(b)
> - torch/\_tensor.py · 调用 torch.add(self, other)
> - 2
> - C-EXT
> - pybind11 绑定层 — Python args → C++ Tensor
> - torch/csrc/autograd/python\_variable.cpp · THPVariable\_add
> - 3
> - ATEN
> - 进入 at::add(self, other),收集 DispatchKeySet
> - Autograd · CUDA · BackendSelect 等 key 被点亮
> - 4
> - DISPATCH
> - 取最高 key = AutogradCUDA → 调对应 kernel
> - torch/csrc/autograd/generated/VariableType\_\*.cpp
> - 5
> - AUTOGRAD
> - 创建 AddBackward0 节点,保存所需 saved\_tensors
> - 设置 c.grad\_fn,移除 Autograd key,redispatch
> - 6
> - REDISPATCH
> - 现在最高 key = CUDA → 选具体 CUDA kernel
> - aten/src/ATen/native/cuda/BinaryAddSubKernel.cu
> - 7
> - LAUNCH
> - 分配输出 Storage · 计算 grid/block · cudaLaunchKernel
> - 通过 TensorIterator 处理 broadcast / contiguous
> - 8
> - GPU
> - SM 上 thread 并行执行加法 · 写回 HBM
> - 异步:CPU 不等待,Python 已经返回 Tensor
> - 输出 Tensor 携带 grad\_fn=AddBackward0 一路返回到 Python

FIG · 一行 `a + b` 的 8 步:Python 入口 → Dispatcher 洋葱 → CUDA kernel launch → GPU 执行

SCALE

### 10 µs 量级的开销

步骤 1–7 全是 **CPU 端逻辑** ,典型耗时 5–15 µs。GPU kernel 本身可能只跑 1 µs(小 tensor)。这就是为什么小 tensor 训练 GPU 利用率低—— **kernel launch overhead 占主导** ,也是 `torch.compile` 要解决的痛点。

ASYNC

### CUDA 调用是异步的

步骤 7 把 kernel 推到 CUDA stream 队列就返回,GPU 还在跑。Python 拿到的 Tensor 是"未来值"——这就是为什么 `.item()` 会阻塞(等 GPU 算完)、为什么测时要用 `torch.cuda.synchronize()`。

TENSOR ITERATOR

### TensorIterator 是无名英雄

步骤 7 中的 `TensorIterator` 统一处理 broadcast、type promotion、stride 合并、向量化等所有 binary/unary op 的脏活。 **所有 pointwise op 都共享它** ——这就是为什么加一个新 op 只要写 10 行 kernel。

PROFILING

### 用 nsys 看这些步骤

Day 06 学的 nsys timeline 上,CPU 行的 "CUDA API" 段就是 步骤 1–7,GPU 行才是 步骤 8。两者错位 = 异步;两者贴紧 = sync 阻塞。 **现在你知道每个色块代表什么了** 。

## 动手实践 — 拦截 Dispatcher

1 H

理论懂了没用——必须亲手看一遍 Dispatcher 在跑什么。两个实验: ① 用 ` __torch_dispatch__ ` 拦截所有 op 调用,把整个网络的 op 序列打印出来; ② 写一个 forward hook,在 ResNet 的某层加观察点。

### 实验 1 — TorchDispatchMode 打印所有 op

```
import torch
from torch.utils._python_dispatch import TorchDispatchMode

class OpPrinter(TorchDispatchMode):
    def __torch_dispatch__ (self, func, types, args=(), kwargs=None):
        # func 是被调用的 ATen op,比如 aten.add.Tensor
        kwargs = kwargs or {}
        in_shapes = [tuple(a.shape) if isinstance(a, torch.Tensor) else a
                     for a in args]
        out = func(*args, **kwargs)
        out_shape = out.shape if isinstance(out, torch.Tensor) else "-"
        print(f"{func. __name__ :<30} in={in_shapes} out={out_shape}")
        return out

# 用它包住任意计算,所有 op 的真实调用都会被打印
with OpPrinter():
    a = torch.randn(4, 8, device="cuda")
    b = torch.randn(4, 8, device="cuda")
    c = (a + b).relu().sum()

# 你会看到 aten.add.Tensor、aten.relu、aten.sum.default 全部被记录
# 这就是 PyTorch 在 dispatcher 上真正执行的算子序列
```

### 实验 2 — 在真实模型上拦截

```
import torchvision

model = torchvision.models.resnet18().cuda().eval()
x = torch.randn(1, 3, 224, 224, device="cuda")

from collections import Counter
op_count = Counter()

class OpCounter(TorchDispatchMode):
    def __torch_dispatch__ (self, func, types, args=(), kwargs=None):
        op_count[func. __name__] += 1
        return func(*args, **(kwargs or {}))

with torch.no_grad(), OpCounter():
    _ = model(x)

for op, n in op_count.most_common(10):
    print(f"{n:>4d} {op}")

# 典型输出:
# 20 convolution.default
# 17 batch_norm.default
# 17 relu.default
# 9 add.Tensor ← residual connection!
# 1 adaptive_avg_pool2d.default
# 1 addmm.default
```

### 实验 3 — 验证 view 不复制 Storage

```
import torch

a = torch.zeros(3, 4, device="cuda")
print("a base ptr =", a.untyped_storage().data_ptr())

# 各种 view 操作
b = a.T # transpose
c = a.view(2, 6) # reshape
d = a[1:] # slice
e = a.expand(5, 3, 4) # broadcast

for name, t in [("b", b), ("c", c), ("d", d), ("e", e)]:
    same = t.untyped_storage().data_ptr() == a.untyped_storage().data_ptr()
    print(f"{name}: same storage = {same}, stride = {t.stride()}")

# 全部 True,只有 stride 不同 —— 验证 view = O(1) 元数据操作

# contiguous() 才会真复制
f = b.contiguous()
print("f: same storage =", f.untyped_storage().data_ptr() == a.untyped_storage().data_ptr())
# False —— 新 Storage 被分配
```

WHY MATTER

### 这些实验有什么用

实验 1/2 是 **调试任意 PyTorch 模型的金钥匙** ——遇到不知道某层在调用什么 op、被哪个 kernel 拖慢时,套一个 OpPrinter 立刻就清晰。比加 print 强百倍。

EXTENSIONS

### 同款模式的高级用法

FakeTensor、ProxyTensor、SymbolicShapes 全部基于 TorchDispatchMode。 **torch.compile 的图捕获,本质就是用一个特殊的 dispatch mode 把所有 op trace 下来** 。

DELIVERABLE

### 今天的交付物

跑通三个实验,把 ResNet-18 的 op 序列(实验 2 的输出)保存为 markdown 表格——这就是 ResNet 模型的"算子画像",Day 13 学 `torch.compile` 时会回头对照。

配套阅读: ezyang 的 PyTorch internals 长文是这一节最好的扩展,推荐配合实验慢读。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么 view 和 reshape 不是一回事?

ANS

**view 严格 O(1)、要求源 Tensor contiguous**。当 stride 不连续时(比如 `a.T`),view 会失败抛 `RuntimeError`。

**reshape 是 view + 必要时 contiguous() 的封装**:能 view 就 view,不能就先复制一份再 view。所以 reshape "总能成功",但可能隐藏一次内存复制——profile 看到莫名 memcpy 时检查这里。

实战:训练里推荐用 `reshape`(安全),写库代码用 `view`(强约束、性能可预期)。

### Q2 · ATen 和 c10 是什么关系?

ANS

**c10** (意为 "Caffe2 + ATen") 是 PyTorch 最底层的库,包含 Tensor / Storage / Device / DispatchKey 这些 **核心数据结构和 Dispatcher 本身** ,不含任何算子实现。

**ATen** 建立在 c10 之上,提供 **所有算子的具体实现** (CPU/CUDA/MPS 等)和算子注册机制。Python 端 `torch.add` 最终调到的是 ATen 里的函数。

类比:c10 是骨架,ATen 是肌肉,Python 是皮肤。读源码顺序:c10 → ATen → torch/csrc(Python 绑定)。

### Q3 · Dispatcher 这么多层 redispatch,不会影响性能吗?

ANS

会,但比想象的小。Dispatcher 每次查表是 **纳秒级** (bitmap + 数组索引),redispatch 5 层 ≈ 100 ns。问题是 **每层 kernel 自己也有 C++ 函数调用开销** ,累积下来 single op 的 CPU overhead 在 5–15 µs。

对大 tensor(GPU kernel 数十毫秒)这点开销可忽略。对小 tensor(kernel

解决方法是 **把多个 op 融合成一个 kernel** ,这就是 `torch.compile`(Day 13)、Triton、CUDA Graph 都在解决的问题。

### Q4 · requires\_grad=False 的 Tensor 还会走 Autograd key 吗?

ANS

不会。 **Autograd key 只有在输入 Tensor 至少有一个 `requires_grad=True` 时才会被点亮** 。所以推理时关掉 grad(`with torch.no_grad():` 或 `model.eval()` + 不设 requires\_grad)能跳过 Autograd 层 redispatch,有可观加速。

更激进的做法:`torch.inference_mode()` 不仅关 autograd,还跳过 version counter 等额外簿记,比 no\_grad 再快 5–15%——纯推理场景推荐用它。

### Q5 · 学到这里我应该读 PyTorch 源码吗?从哪里开始?

ANS

不必通读,但应该 **会按需切入** 。推荐的入口顺序:

(1) **ezyang 的 "PyTorch internals" 博客** (2019,虽然老但概念框架完全有效)。读完你不会再迷路。

(2) **aten/src/ATen/native/native\_functions.yaml** :任何想知道一个 op 怎么实现的,都先来这里查它的 dispatch 配置,顺藤摸瓜找到 kernel 文件。

(3) **c10/core/DispatchKey.h** :看完所有 key 的定义,Dispatcher 就具体化了。

(4) **torch/\_tensor.py 和 torch/overrides.py** :Python 端怎么把 magic method 接到 ATen。

原则:_带着问题读_。"为什么我的 reshape 失败了?" → 查 native\_functions → 找 kernel → 看 contiguous 检查。三天读懂一个问题,胜过两周泛读。

## 复盘问题

5 QUESTIONS

1. 用一张图说明 Tensor、Storage、shape、stride、offset 五个概念的关系,并写出 `T[i,j,k]` 的物理地址公式。
2. 给定 `a = torch.arange(24).view(2,3,4)`,手算 `a.transpose(0,2)` 之后的 shape 和 stride,并验证。
3. 解释 DispatchKey 的"洋葱"结构:为什么 Autograd 不是独立系统,而是 Dispatcher 上的一组 key?这给扩展性带来什么好处?
4. 把 `c = a + b` 的 8 步调用链复述一遍,每一步写出对应的源码文件(粗略路径即可)。
5. 用 TorchDispatchMode 抓取一个 Linear 层的算子序列(`y = linear(x)`),解释为什么会看到 `addmm` 而不是 `matmul`。

## 今日检查清单

8 ITEMS

- 能准确说出 Tensor 与 Storage 的区别,理解 view 操作为什么 O(1)
- 掌握 shape / stride / offset 三件套,能手算给定 view 操作后的 stride
- 能解释 contiguous 的严格定义,知道哪些操作会破坏 contiguous
- 理解 Dispatcher 的 key + 优先级 + redispatch 机制
- 能列出至少 5 类 DispatchKey 和它们各自的职责
- 理解 Autograd 是 Dispatcher 上的一层 key,而不是独立模块
- 能复述 `c = a + b` 从 Python 到 GPU 的 8 步调用链
- 用 ` __torch_dispatch__ ` 成功拦截到 ResNet 的 op 调用序列

## 推荐阅读

5 ITEMS

MUST READ

### ezyang — PyTorch internals

Edward Yang 的经典长文。今天三大抽象的核心思路全部来自这篇——读完所有"为什么"都豁然开朗。

OFFICIAL

### PyTorch Dispatcher 设计文档

PyTorch 仓库 docs/source/notes 下的 "dispatcher.md",讲清 DispatchKey、KeySet、Fallthrough 三个核心概念。

BLOG

### Horace He — PyTorch 2 Dispatch

对 PyTorch 2 以来 Dispatcher 演进的回顾,重点讲 functorch 和 torch.compile 如何复用 Dispatcher 实现新特性。

SOURCE

### c10/core/DispatchKey.h

所有 key 的权威定义。读一遍源码注释,胜过看十篇博客——key 的优先级顺序就在文件顶部。

TUTORIAL

### PyTorch Extending Dispatcher 教程

官方教程,演示如何为自定义 backend 注册 op。看一遍能彻底理解"为什么 PyTorch 能这么容易支持新硬件"。

## Day 09 预告

NEXT

COMING NEXT

### Autograd 原理 — 手写 mini-autograd

今天对 Autograd 只做了概览。Day 09 会用 ~200 行 Python 手写一个完整的 mini-autograd:动态图构建、链式法则、拓扑排序、梯度累加。从能跑通 `y = (a * b + c).sum(); y.backward()` 开始,理解 PyTorch Autograd 真正在做的事。

"To understand PyTorch is to understand Dispatcher — everything else is implementation detail."

DAY 08 · PHASE 1 START · AI INFRA 60-DAY ROADMAP
