---
title: "Day 10 · 算子与后端"
date: '2026-05-21'
draft: false
description: "拆开 PyTorch 算子实现层:c10 是底座,ATen 是算子库,native_functions.yaml 是真理之源。从代码生成管线到 TORCH_LIBRARY 注册机制,跑通一个自定义 CUDA 算子。"
toc: true
tags:
  - AI
  - PyTorch
  - ATen
  - CUDA
  - Internals
---

DAY 10 · AI INFRA ROADMAP · 60 DAYS

# 算子的 _真理之源_

Day 08 知道有 Dispatcher,Day 09 知道有 Autograd, 但_真正的"加法"代码到底写在哪里?_ 今天进入算子实现层: **c10** 是核心抽象, **ATen** 是算子库, **native\_functions.yaml** 是所有 op 的契约, **TORCH\_LIBRARY** 是把 CUDA kernel 接入 Dispatcher 的钩子。 拆完这套,你就有了"给 PyTorch 加一个新算子"的能力。

**DURATION** 3 h **THEORY** 1.5 h **HANDS-ON** 1 h **REVIEW** 0.5 h **STACK** C++ · CUDA · pybind11 · torch.utils.cpp\_extension

## 思维导图

OVERVIEW

> **图：Day 10 思维导图**
>
> - DAY 10 · 算子与后端
> - C10 · ATEN · YAML · TORCH\_LIBRARY
> - 01 · LAYERS
> - c10 vs ATen
> - 02 · YAML
> - 代码生成管线
> - 03 · REGISTER
> - TORCH\_LIBRARY
> - 04 · BUILD
> - 自定义算子
> - c10/core 抽象
> - DispatchKey 在 c10
> - aten/native = 实现
> - cuda/cpu 子目录
> - native\_functions.yaml
> - torchgen 生成 .h
> - structured kernels
> - device\_check / variants
> - \_IMPL 注册 kernel
> - TensorIterator
> - AT\_DISPATCH 模板
> - cpp\_extension
> - load\_inline 热加载
> - 前向 + 反向注册
> - torch.ops 调用
> - DELIVERABLES
> - c10 / ATen 分层笔记
> - 读懂一条 yaml 入口
> - my\_add CUDA op
> - 支持 backward 的扩展

FIG · Day 10 全景:从 c10 底座到 yaml 契约,再到 TORCH\_LIBRARY 注册,最后造一个自己的算子

## 分层 — c10 / ATen / torch / Python

25 MIN

"PyTorch" 不是一个库,而是_至少四层的同心圆_。 不同层有不同的职责、不同的依赖、不同的开发者群体。 读源码先认这四层,后面再钻细节就不会迷路。

> **图：PyTorch 分层架构**
>
> - PYTORCH STACK — FROM CORE TO PYTHON
> - LAYER 1 · c10 — CORE LIBRARY
> - Tensor / Storage / Device / DispatchKey / TensorImpl / 引用计数
> - 无算子实现 · 纯抽象数据结构和 Dispatcher 框架 · 所有上层都依赖它
> - c10/core/
> - LAYER 2 · ATen — TENSOR LIBRARY
> - 所有算子的实现 · native\_functions.yaml · CPU/CUDA/MPS kernel
> - aten/src/ATen/native/\* — 数千个算子的具体逻辑,大部分是 C++ 模板代码
> - native/cuda/\* · native/cpu/\* · native/mkldnn/\* · native/sparse/\*
> - aten/src/ATen/
> - LAYER 3 · torch/csrc — PYTHON BINDING + AUTOGRAD
> - Python ↔ C++ 桥(pybind11)· Autograd engine · JIT / Dynamo
> - 把 ATen 暴露给 Python · Autograd Key 的 kernel 在这里生成
> - torch/csrc/
> - LAYER 4 · torch/ — PYTHON API
> - torch.nn · torch.optim · torch.distributed · 各种用户面 API
> - 绝大部分用户只接触这一层,它的下面才是真正的引擎
> - torch/
> - 依赖方向
> - 何时改哪一层?
> - L1 — 加新 DispatchKey / 新设备类型 (极少) · L2 — 加 / 改算子 kernel · L3 — Autograd / 编译器特性 · L4 — 高层 API 重构

FIG · 四层架构 · 下层不知道上层存在 · 改算子永远从 L2 开始

### 四层职责对比

| 层 | 目录 | 核心内容 | 不包含 |
| --- | --- | --- | --- |
| c10 | `c10/` | Tensor、Storage、Device、DispatchKey、Allocator、引用计数 | 任何算子实现 |
| ATen | `aten/src/ATen/` | native\_functions.yaml、所有 op 的 CPU/CUDA kernel、TensorIterator | Python 绑定、Autograd 自动微分 |
| torch/csrc | `torch/csrc/` | pybind11 绑定、Autograd 引擎、JIT、Dynamo、Inductor | 用户面 API(nn / optim 等) |
| torch/ | `torch/` | `nn.Module`、Optimizer、distributed、profiler | 核心数据结构、kernel |

### native/ 的子目录就是 backend

ATen 真正放算子代码的地方是 `aten/src/ATen/native/`。 它的子目录名就是 **该算子针对哪种 backend 写的** —— 这种"按目录组织 backend"的模式让你很容易定位 kernel 文件。

| 子目录 | 对应 DispatchKey | 放什么 |
| --- | --- | --- |
| `native/` | (顶层入口) | backend-agnostic 实现 / composite ops / yaml 配置 |
| `native/cpu/` | `CPU` | 向量化的 CPU 实现(SIMD intrinsics) |
| `native/cuda/` | `CUDA` | CUDA C++ / `.cu` kernel |
| `native/mkldnn/` | `MkldnnCPU` | OneDNN 加速的 CPU 算子 |
| `native/sparse/` | `SparseCPU/CUDA` | 稀疏张量专用实现 |
| `native/mps/` | `MPS` | Apple Metal Performance Shaders kernel |

READING TIP

### 如何找一个 op 的实现

固定流程:① 全局 grep `native_functions.yaml` 找到 op 的条目;② 看 `dispatch:` 段下对应 backend 的 kernel 名;③ 用 kernel 名 grep `native/<backend>/`。 **10 秒定位任意算子实现** ,比看源码索引快得多。

DEPENDENCY

### 严格的依赖方向

箭头永远从下指上:c10 不依赖 ATen,ATen 不依赖 torch/csrc,torch/csrc 不依赖 torch/(Python)。 **反过来全部依赖** 。这就是为什么 c10 可以独立编译给嵌入式设备用(LibTorch 移动版)——它根本不知道 Python 存在。

本节 takeaway: c10 = 抽象,ATen = 算子,torch/csrc = 胶水,torch = API。

## native\_functions.yaml 与代码生成管线

30 MIN

PyTorch 有 _数千个算子 × 几十种 backend × 多种 dtype_, 手写绑定不现实。 所有这些样板都由 **代码生成器** 从一个 yaml 文件自动产出—— 理解了这条管线,你就知道源码里 `aten/src/ATen/Functions.h` 为什么会有上万行, 也知道编译 PyTorch 时为什么会跑很久。

### 一条真实的 yaml 入口

```
# aten/src/ATen/native/native_functions.yaml 节选(简化)
- func: add.Tensor(Tensor self, Tensor other, *, Scalar alpha=1) -> Tensor
  device_check: NoCheck
  structured_delegate: add.out
  variants: function, method
  dispatch:
    SparseCPU, SparseCUDA: add_sparse
    MkldnnCPU: mkldnn_add
    ZeroTensor: add_zerotensor
  tags: pointwise

# 同一个 op 的 .out 变体 —— "结构化 kernel" 的真正实现入口
- func: add.out(Tensor self, Tensor other, *, Scalar alpha=1, Tensor(a!) out) -> Tensor(a!)
  device_check: NoCheck
  structured: True # 声明这是 structured kernel
  structured_inherits: TensorIteratorBase
  ufunc_inner_loop:
    Generic: add (AllAndComplex, BFloat16, Half, ComplexHalf)
    ScalarOnly: add (Bool)
  dispatch:
    SparseCPU: add_out_sparse_cpu
    SparseCUDA: add_out_sparse_cuda
    MkldnnCPU: mkldnn_add_out
```

### 每个字段的含义

| 字段 | 作用 |
| --- | --- |
| `func:` | 算子 **类型签名** (自定义 IDL 语法),决定 Python/C++ 调用形式 |
| `variants:` | `function`(`torch.add(a,b)`)/ `method`(`a.add(b)`),逗号分隔多个 |
| `dispatch:` | 每个 DispatchKey 对应的 kernel 函数名,未列出的 backend 走 fallback |
| `device_check:` | 是否检查所有 Tensor 在同一设备,`NoCheck` 即跳过(用于 scalar) |
| `structured:` | 是否使用现代 structured kernel 模式,启用后大量样板自动生成 |
| `structured_delegate:` | 把 `.Tensor` 变体的实现"委托"给 `.out` 变体——避免重复代码 |
| `tags:` | 元信息(`pointwise`/`view`/`inplace_view`),编译器和 Inductor 会用 |

### 代码生成管线

> **图：代码生成管线**
>
> - CODEGEN PIPELINE — FROM YAML TO COMPILED BINARIES
> - SOURCE
> - native\_functions.yaml
> - ~3000 op 条目
> - CODEGEN
> - torchgen/
> - Python 生成器
> - Functions.h / .cpp
> - at::add(self, other) 等
> - RegisterCPU.cpp
> - CPU 算子注册到 Dispatcher
> - RegisterCUDA.cpp
> - CUDA 算子注册
> - VariableType\_X.cpp
> - Autograd 包装(关键!)
> - COMPILE
> - libtorch\_cpu
> - libtorch\_cuda
> - WHY CODEGEN
> - 3000 op × 6 backend × 多 dtype = 几十万行样板代码,人写不可能。codegen 把"重复 + 易错"的部分自动化,
> - 让开发者只写真正的 kernel 函数。这也是为什么"加一个 op"通常只需要改 yaml + 写一个 kernel 函数。

FIG · yaml → torchgen → 大量 .cpp/.h → nvcc/g++ → libtorch · 编译时间长的真正原因

### Structured Kernels — 现代 op 的标准模式

新加的 op 几乎都写成 **structured kernel** :把"形状推断 + 输出分配 + 实际计算"_分离_, 实际计算用 `TensorIterator` 复用所有 broadcast / type promotion / contiguity 处理。 开发者只需写 **~10 行的核心循环** 。

```
// aten/src/ATen/native/BinaryOps.cpp · structured kernel 的"meta"
// 由 yaml 中 structured_delegate / structured: True 触发生成

TORCH_META_FUNC2(add, Tensor)(
    const Tensor& self, const Tensor& other, const Scalar& alpha) {
  build_borrowing_binary_op(maybe_get_output(), self, other);
}

// 实际的 CPU kernel —— 由 ufunc 装饰器生成向量化循环
// aten/src/ATen/native/cpu/BinaryOpsKernel.cpp
void add_kernel(TensorIteratorBase& iter, const Scalar& alpha_scalar) {
  AT_DISPATCH_ALL_TYPES_AND2(kHalf, kBFloat16, iter.dtype(), "add_cpu", [&]() {
    auto alpha = alpha_scalar.to<scalar_t>();
    cpu_kernel_vec(iter,
      [=](scalar_t a, scalar_t b) -> scalar_t { return a + alpha * b; },
      [=](Vectorized<scalar_t> a, Vectorized<scalar_t> b) {
        return vec::fmadd(b, Vectorized<scalar_t>(alpha), a);
      });
  });
}
```

META + KERNEL

### "meta" 函数干什么

structured kernel 把 op 拆成 **两阶段** :meta 函数只计算输出 shape 和 dtype(不做计算),由它准备好输出 Tensor,再调具体 backend kernel 填充数据。 **这种分离让 dry-run/FakeTensor 极其方便** ——只跑 meta 就能预测整个网络的所有中间形状。

AT\_DISPATCH

### dtype 宏的 zoo

PyTorch 有一组 `AT_DISPATCH_*` 宏,根据 dtype 选择具体模板实例。比如 `AT_DISPATCH_ALL_TYPES_AND2(kHalf, kBFloat16, ...)` 意为"所有标量类型加上 fp16 / bf16"。 **读源码遇到这串宏就知道,它在生成几十个特化版本** 。

TENSOR ITERATOR

### TensorIterator 是隐藏王者

所有 pointwise / reduction op 都用 TensorIterator 统一处理 broadcast、stride 合并、向量化、并行 chunking。它 **本身就是个小型编译器** ——能自动决定"3 个张量哪些维度可以 fuse 成一个内循环"。Day 14 算子融合再展开。

DELEGATE

### functional / .out / inplace 三胞胎

大多数 op 有三个变体:`add`(返回新张量)、`add_`(就地修改 self)、`add.out`(写入指定 out)。 **structured 模式让三者共享一份计算逻辑** ,在 yaml 里通过 `structured_delegate` 连接。

关键认知: 一条 yaml 入口 + 一个 kernel 函数,扩展到所有 backend / dtype / variant —— 这是 PyTorch 工程美学的核心。

## TORCH\_LIBRARY — 把 kernel 接入 Dispatcher

25 MIN

上面讲的是 PyTorch 内部 op 的_"官方通道"_(yaml + codegen)。 但你写自己的 op 时不会改 yaml —— 改了要重编译整个 PyTorch,工程量太大。 **TORCH\_LIBRARY / TORCH\_LIBRARY\_IMPL** 提供了 _第二条通道_:在外部 C++ 文件里声明 schema、注册 kernel, 运行时挂进 Dispatcher。所有自定义算子都走这条路。

> **图：算子注册流程**
>
> - CUSTOM OP REGISTRATION — TWO MACROS, THREE STEPS
> - STEP 1 · 声明 schema
> - TORCH\_LIBRARY(myops, m) {
> - m.def("my\_add(Tensor a,
> - Tensor b) -\> Tensor");
> - }
> - STEP 2 · 注册 backend kernel
> - TORCH\_LIBRARY\_IMPL(myops, CUDA, m){
> - m.impl("my\_add",
> - my\_add\_cuda\_impl);
> - STEP 3 · Python 调用
> - torch.ops.myops
> - .my\_add(a, b)
> - Dispatcher 自动路由
> - RUNTIME CALL PATH
> - torch.ops.myops.my\_add
> - Python 入口
> - Dispatcher 查表
> - op × backend → fn
> - my\_add\_cuda\_impl
> - 你的 C++ 函数
> - cudaLaunchKernel
> - .cu 编译产物
> - GPU 执行
> - SM 上跑你的 kernel
> - 这一整套流程和 PyTorch 内置 op 走的是 完全相同 的 Dispatcher 路径
> - 区别只是:你的 kernel 没有走 codegen,而是手写注册

FIG · 两个宏:TORCH\_LIBRARY 声明 schema,TORCH\_LIBRARY\_IMPL 注册具体 backend kernel

### 三种典型注册模式

| 宏 | 用途 | 示例 |
| --- | --- | --- |
| `TORCH_LIBRARY(ns, m)` | 定义一个全新的命名空间和它包含的 op schema | `m.def("my_add(Tensor a, Tensor b) -> Tensor")` |
| `TORCH_LIBRARY_IMPL(ns, key, m)` | 给某个 backend(key)注册具体实现 | `m.impl("my_add", my_add_cuda)` |
| `TORCH_LIBRARY_FRAGMENT(ns, m)` | 给 **已存在** 的命名空间(包括 `aten`)追加新 op | 给 PyTorch 自带 op 加新 backend 实现 |

### 关键的 schema 语法

```
// 类型签名遵循 IDL —— 不是 C++,也不是 Python
"my_add(Tensor a, Tensor b) -> Tensor" // 最普通
"my_add(Tensor a, Tensor b, *, Scalar alpha=1) -> Tensor" // 默认参数 + kwargs-only
"my_add_(Tensor(a!) self, Tensor b) -> Tensor(a!)" // inplace,用 ! 标 mutable alias
"my_add.out(Tensor a, Tensor b, *, Tensor(a!) out) -> Tensor(a!)" // .out 变体
"my_split(Tensor a, int chunks) -> Tensor[]" // 返回 list

// (a!) 是别名注解:
// (a) — 表示这个张量是输入 a 的视图(共享 Storage,read-only alias)
// (a!) — 同上,且会被修改(write alias),用于 inplace / out 变体
// 不写 — 完全独立的新张量
```

SCHEMA = 契约

### 为什么要 schema

Dispatcher 必须知道每个 op 的 **输入数量、类型、可变性** 才能正确路由、生成 Autograd 包装、做 functionalization。schema 是这份契约的唯一来源,所以即使外部 op 也要先 `m.def` 一次。

ALIAS NOTATION

### `(a!)` 不是装饰,是关键

别小看 `(a!)` ——它告诉 functionalization pass 这个张量是 **就地修改** 。漏写会导致 `torch.compile` / functorch 出错(它们以为函数纯,实际有副作用)。 **所有 inplace op 必须正确标 alias** 。

AUTOGRAD KEY

### 注册 Autograd 行为

除了给具体 backend 注册,还可以给 `Autograd` key 注册——典型做法是 **用 torch::autograd::Function 写一个 forward + backward 的 C++ 类** ,再在 `TORCH_LIBRARY_IMPL(myops, Autograd, m)` 里把它注册进去。下一节会演示。

EXTENSIBILITY

### 新硬件也用这套

NVIDIA 之外的厂商(AMD ROCm、Intel XPU、Apple MPS、华为昇腾 等)给 PyTorch 加 backend 全靠 `TORCH_LIBRARY_IMPL(aten, <新 Key>, m)`。 **新增一种硬件 = 注册一组 kernel,不动核心代码** ——这就是 Dispatcher 设计的胜利。

## 动手实践 — 写一个 my\_add CUDA op

1 H

理论看完,亲手写一个完整的自定义算子:CUDA kernel + C++ 调度 + Python 绑定 + Autograd 支持。 不到 100 行代码,用 `torch.utils.cpp_extension.load_inline` 可以_不写 setup.py、直接在 notebook 里热编译_, 30 秒拿到一个能跑的算子。

### 步骤 1 — 写 CUDA kernel

```
// my_add_kernel.cu (在下一段代码里以字符串形式传入)
#include <torch/extension.h>
#include <cuda_runtime.h>

template <typename scalar_t>
__global__ void my_add_kernel(
    const scalar_t* __restrict__ a,
    const scalar_t* __restrict__ b,
    scalar_t* __restrict__ out,
    int n) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) out[i] = a[i] + b[i];
}

// C++ 入口:校验形状、launch kernel、返回结果
torch::Tensor my_add_cuda(const torch::Tensor& a, const torch::Tensor& b) {
  TORCH_CHECK(a.is_cuda() && b.is_cuda(), "inputs must be CUDA");
  TORCH_CHECK(a.sizes() == b.sizes(), "shape mismatch");
  auto a_c = a.contiguous();
  auto b_c = b.contiguous();
  auto out = torch::empty_like(a_c);

  int n = a_c.numel();
  int threads = 256;
  int blocks = (n + threads - 1) / threads;

  AT_DISPATCH_FLOATING_TYPES(a_c.scalar_type(), "my_add_cuda", [&] {
    my_add_kernel<scalar_t><<<blocks, threads>>>(
        a_c.data_ptr<scalar_t>(),
        b_c.data_ptr<scalar_t>(),
        out.data_ptr<scalar_t>(),
        n);
  });
  return out;
}

// 注册到 Dispatcher —— 两个宏
TORCH_LIBRARY(myops, m) {
  m.def("my_add(Tensor a, Tensor b) -> Tensor");
}
TORCH_LIBRARY_IMPL(myops, CUDA, m) {
  m.impl("my_add", my_add_cuda);
}
```

### 步骤 2 — 用 load\_inline 热编译

```
import torch
from torch.utils.cpp_extension import load_inline

cuda_src = open("my_add_kernel.cu").read()
cpp_src = "" # 没有额外 .cpp,全部代码在 .cu 文件里

myops = load_inline(
    name="myops",
    cpp_sources=cpp_src,
    cuda_sources=cuda_src,
    is_python_module=False, # 走 TORCH_LIBRARY,不走 pybind
    verbose=True, # 看 nvcc 输出
)

# 现在算子已经挂在 torch.ops.myops 下
a = torch.randn(1024, device="cuda")
b = torch.randn(1024, device="cuda")
c = torch.ops.myops.my_add(a, b)

print(torch.allclose(c, a + b)) # True ✓
```

### 步骤 3 — 加上 Autograd 支持

上面注册的是 **无梯度版本** 。如果想让 `my_add` 能被 `backward()` 反向传播, 最简单的方法是在 Python 端用 `torch.autograd.Function` 包一层—— 不必写 C++ Autograd 类。

```
class MyAddFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, a, b):
        ctx.save_for_backward(a, b) # 反向需要的输入
        return torch.ops.myops.my_add(a, b)

    @staticmethod
    def backward(ctx, grad_output):
        # 加法的局部梯度 = 1,直接把上游梯度传下去
        return grad_output, grad_output

# 包装成 Python 函数
def my_add(a, b):
    return MyAddFunction.apply(a, b)

# --- 测试 backward 是否正常 ---
a = torch.randn(3, device="cuda", requires_grad=True)
b = torch.randn(3, device="cuda", requires_grad=True)
y = my_add(a, b).sum()
y.backward()

print(a.grad, b.grad)
# tensor([1., 1., 1.], device='cuda:0')
# tensor([1., 1., 1.], device='cuda:0')
# ✓ 与 PyTorch 内置 add 完全一致
```

### 三种构建方式对比

| 方法 | 需要 | 编译时机 | 适用 |
| --- | --- | --- | --- |
| `load_inline` | 源码字符串 | 运行时 | 实验 / notebook / 快速原型 |
| `load` (sources=) | `.cu/.cpp` 文件 | 运行时 | 多文件项目,不想写 setup.py |
| `setup.py` + `BuildExtension` | 完整 Python 包结构 | 预编译 | 发布给别人 pip 安装(如 flash-attn) |

REAL WORLD

### flash-attn 就是这样写的

Tri Dao 的 flash-attention 仓库本质就是个超级版本的"自定义算子":CUDA kernel(几千行)+ setup.py + Python 包装。 **结构和你刚写的 my\_add 一样,只是 kernel 复杂度差几个数量级** 。看懂 my\_add 之后,flash-attn 源码不再是天书。

META REGISTRATION

### 给 torch.compile 友好的算子

想让自定义算子被 `torch.compile` 追踪,还要注册一个 **meta kernel** (只返回形状/dtype,不分配数据)。模板:`TORCH_LIBRARY_IMPL(myops, Meta, m)`。Day 13 学 Inductor 时再深入。

DEBUG

### 常见编译错误

① _找不到 torch/extension.h_ → conda 环境没装 torch dev headers,确认 `torch.utils.cpp_extension.CUDA_HOME` 指向真实 CUDA。
② _nvcc -gencode 不识别_ → 设 `TORCH_CUDA_ARCH_LIST="8.0 9.0"`(对应 A100/H100)。
③ _linking error_ → 多半是 ABI 不一致,用 `verbose=True` 看实际命令。

DELIVERABLE

### 今天的交付物

把 my\_add 三步全跑通,保存 `my_add_kernel.cu` 和测试脚本。加分项:写个 `my_addmm`(矩阵乘加),复用 Day 05 的 tiled GEMM kernel——你将得到一个 **跑得通、可微分、能被 PyTorch 模型直接调用** 的自定义算子。

第一次编译可能要 1–2 分钟(nvcc 慢),后续会命中缓存(~/.cache/torch\_extensions/),只剩几秒。

## 常见疑问

5 QUESTIONS

### Q1 · c10 和 ATen 都在 `aten/src/ATen/` 下,怎么区分?

ANS

不在同一个目录。 **c10 在仓库根的 `c10/` 目录** ,完全独立的库; **ATen 在 `aten/src/ATen/`** 。

关系:_ATen 依赖 c10,反过来不行_。c10 提供 Tensor / Storage / DispatchKey 这些核心数据结构和 Dispatcher 框架,但不含任何 op 实现;ATen 用 c10 的 Tensor 写出所有算子。

命名来历:c10 是 "Caffe2 + ATen" 的合并产物(2018 年 PyTorch 和 Caffe2 合并时把共享的核心抽象抽出来叫 c10);ATen 取自 "A Tensor library",一个独立的 C++ 张量库,后被 PyTorch 收编。

### Q2 · 为什么 add 在 yaml 里要写成两条(`add.Tensor` 和 `add.out`)?

ANS

因为 PyTorch 的一个 op 通常有 **三个变体** :

(1) **functional** (`add`):返回新张量,最常用;

(2) **inplace** (`add_`):就地修改 self;

(3) **out** (`add.out`):写入用户提供的输出张量。

三者计算逻辑相同,只是 **结果去向不同** 。structured kernel 模式让一份核心逻辑由这三个变体共享——具体做法是把真正的算子定义为 `.out` 变体,functional 和 inplace 通过 `structured_delegate: add.out` 自动委托过去。 **少写 2/3 的代码,且保证三者行为完全一致** 。

### Q3 · 改了 native\_functions.yaml,要不要从头编译 PyTorch?

ANS

要重新跑 codegen + 编译受影响的文件,但 **不是从零** 。增量编译机制如下:

(1) `tools/setup_helpers/generate_code.py` 检测 yaml 变化,重新生成 `Functions.h`、`RegisterXXX.cpp` 等;

(2) 编译系统按依赖图编译被影响的目标文件;通常只重编几十到几百个文件,而非全量(~3000)。

实际开发体验:第一次编译 PyTorch 几十分钟到 1 小时,后续改一个 op 通常 1–3 分钟。 **ccache** 能进一步加速。这就是为什么_开发自定义算子绝大多数情况下用 cpp\_extension_——它不动 PyTorch 源码,只编你自己那几行,几秒到几十秒。

### Q4 · TORCH\_LIBRARY\_IMPL 注册到 Autograd key 和 Python 端 torch.autograd.Function,有什么区别?

ANS

两种途径殊途同归,选哪个看场景。

**C++ Autograd 注册** (`TORCH_LIBRARY_IMPL(ns, Autograd, m)`):性能最优,完全在 C++ 端构图;但要写 C++ 类(`torch::autograd::Function`)+ 实现 forward/backward,代码量大,调试也烦。 **用于:对外发布、需要 trace 进 torch.compile 的算子** 。

**Python `torch.autograd.Function`** :简单太多,几行 Python 就能加梯度;代价是 forward 时会走一次 Python ↔ C++ 边界。 **用于:实验、原型、个人项目** ——开发体验吊打前者。

实际经验:先用 Python 跑通,确认数学没错,有性能或部署需求再迁到 C++。

### Q5 · 为什么很多 op 的 yaml 里有 `tags: pointwise`?这些 tag 重要吗?

ANS

非常重要,但只对 **编译器/调度器** 可见,对用户透明。

`tags:` 是 op 的元属性,告诉下游"这个 op 是什么类型的运算"。常见 tag:

• `pointwise`:逐元素运算, **可以和其他 pointwise op 融合** (Inductor 的核心优化);

• `view`:零拷贝视图(transpose / slice),不分配新内存;

• `inplace_view`:就地修改且改变 shape;

• `nondeterministic_seeded`:有随机性,需要 seed 管理。

实际作用:torch.compile 看见 `pointwise` tag 就考虑算子融合,看见 `view` tag 就跳过实际数据移动。 **正确的 tag 直接影响编译后的性能** ——这就是 PyTorch op 元数据系统的价值。

## 复盘问题

5 QUESTIONS

1. 画一张 PyTorch 分层图(c10 / ATen / torch/csrc / torch),标出每层目录路径和不能跨层引用的依赖方向。
2. 用 `grep` 在 PyTorch 源码里找到 `at::relu` 的 CUDA 实现文件路径——演练"从 yaml 到 kernel"的检索流程。
3. 解释为什么 structured kernel 比传统写法节省代码,并举例说明 meta 函数与 kernel 函数的分工。
4. 用 `cpp_extension.load_inline` 实现一个 `my_relu`(forward+backward),与 PyTorch 内置 ReLU 对比梯度。
5. 设想给 PyTorch 加一个名为 NPU 的新硬件,你需要分别在 c10 / ATen / torch/csrc 哪些位置做改动?哪些可以完全不动?

## 今日检查清单

8 ITEMS

- 能用一句话说清 c10、ATen、torch/csrc、torch 四层各自的职责
- 能解释为什么所有依赖方向都从上指下,以及为什么 c10 能独立编译
- 能读懂一条 native\_functions.yaml 入口(func / variants / dispatch 等字段)
- 理解 structured kernel 的 meta + kernel 分离设计
- 能区分 TORCH\_LIBRARY / TORCH\_LIBRARY\_IMPL / TORCH\_LIBRARY\_FRAGMENT 三个宏
- 能解释 schema 中 `(a!)` alias 注解的含义和重要性
- 用 load\_inline 成功编译并运行 my\_add CUDA op,结果与 `a + b` 一致
- 给 my\_add 加上 `torch.autograd.Function` 包装,backward 梯度通过验证

## 推荐阅读

5 ITEMS

MUST READ

### PyTorch Custom C++ and CUDA Extensions 教程

官方 tutorial,从最小 `load_inline` 到完整 setup.py 包发布全流程。今天 hands-on 部分的标准参考。

OFFICIAL

### aten/src/ATen/native/README.md

ATen native 目录自己的 README,详细解释 native\_functions.yaml 每个字段、structured kernel 的写法,以及 codegen 的工作原理。是开发者文档,但写得清晰。

BLOG

### ezyang — Let's talk about the PyTorch dispatcher

Day 08 已推荐,本日重点看后半部分关于 op registration 和 codegen 的细节。配合 native\_functions.yaml 一起读效果最好。

SOURCE

### flash-attention 仓库

真实世界自定义 CUDA op 的标杆。重点看 `csrc/flash_attn/` 下的 kernel 注册方式和 setup.py,验证今天学的所有概念。

VIDEO

### PyTorch DevCon — Custom Ops

PyTorch 团队历年开发者大会演讲,讲自定义算子的演进(从 pybind11 到 TORCH\_LIBRARY 再到 torch.library)、与 torch.compile 的集成。

## Day 11 预告

NEXT

COMING NEXT

### 显存管理 — caching allocator · OOM 排查 · 碎片化

到现在我们一直把显存当无限大,真实训练中"CUDA out of memory"是日常。Day 11 拆开 PyTorch 的 caching allocator:为什么 `empty_cache()` 释放不掉某些 block?`expandable_segments` 怎么帮你减少碎片?显存峰值定位的标准工作流是什么?这是 Phase 2 训大模型前的必修课。

"一行 yaml 配置 + 一个 kernel 函数,扩展到所有 backend × dtype × variant —— 这就是 PyTorch 的工程美学。"

DAY 10 · AI INFRA 60-DAY ROADMAP
