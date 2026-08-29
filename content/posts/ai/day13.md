---
title: "Day 13 · torch.compile / TorchDynamo / Inductor"
date: '2026-05-27'
draft: false
description: "进入 PyTorch 2.x 编译器栈: TorchDynamo 如何从 Python 代码捕获 FX 图, guards 如何决定复用/重编译/fallback, Inductor 如何融合算子并生成 Triton/C++ kernel;最后对一个小模型做 eager vs compile benchmark。"
toc: true
tags:
  - AI
  - PyTorch
  - TorchDynamo
  - TorchInductor
  - Compiler
---

DAY 13 · AI INFRA ROADMAP · 60 DAYS

# 从动态图到 _融合 kernel_

前面几天我们拆过 PyTorch 的 Tensor、Dispatcher、Autograd、算子注册和显存管理。 今天开始把这些零件连成一条编译链路: `torch.compile` 用 **TorchDynamo** 从 Python 执行中捕获 **FX graph** ,用 **guards** 判断这张图什么时候还能复用, 再交给 **AOTAutograd** 和 **TorchInductor** 做 backward 捕获、算子分解、 融合和代码生成。目标不是背 API,而是能回答一个工程问题: _为什么同一段模型代码,有时 compile 变快,有时反而变慢?_

**DURATION** 3 h **THEORY** 1.4 h **HANDS-ON** 1.2 h **REVIEW** 0.4 h **STACK** PyTorch 2.x · Dynamo · FX · Inductor · Triton

## 思维导图

OVERVIEW

> **图：Day 13 思维导图**
>
> - DAY 13 · torch.compile
> - DYNAMO · FX · GUARDS · INDUCTOR · BENCHMARK
> - 01 · CAPTURE
> - FX 图捕获
> - 02 · GUARD
> - 复用 / 重编译
> - 03 · LOWER
> - Inductor 代码生成
> - 04 · MEASURE
> - eager vs compile
> - Python frame eval
> - FX GraphModule
> - graph break
> - fullgraph=True
> - shape / dtype / device
> - object id / constants
> - recompile\_limit
> - eager fallback
> - AOTAutograd
> - decomposition
> - fusion schedule
> - Triton / C++ kernel
> - warmup 去掉首编译
> - CUDA synchronize
> - TORCH\_LOGS
> - speedup 表格
> - DELIVERABLES
> - 编译链路图
> - graph break 诊断表
> - benchmark 脚本
> - eager vs compile 记录

FIG · Day 13 全景:先知道编译链路,再学会诊断 graph break / recompile,最后用 benchmark 验证收益

## torch.compile 解决什么问题

25 MIN

PyTorch eager 的优点是灵活:每一行 Python 都立刻执行,动态控制流天然可用。 代价是每个 op 都要走 Python 调度、Dispatcher、kernel launch、临时张量分配。 对 GPU 来说,很多小 op 的真正瓶颈不是算力,而是 **启动开销、内存读写和中间结果搬运** 。 `torch.compile` 的核心目标,就是把一段稳定的 PyTorch 计算变成可优化的图, 然后让后端把多个小操作揉成更少、更贴近硬件的 kernel。

| 执行方式 | 发生了什么 | 常见收益 | 常见代价 |
| --- | --- | --- | --- |
| Eager | Python 逐行执行,每个 op 单独 dispatch,通常每个 CUDA op 单独 launch kernel | 调试简单,动态行为完全自然 | 小 op 多时 CPU launch 开销大;中间张量多;跨 op 优化机会少 |
| `torch.compile` | Dynamo 捕获 FX 图,Inductor 对图做融合、调度和代码生成,后续调用命中缓存 | 减少 launch、融合 elementwise、降低 Python overhead、可能触发 CUDA graphs | 首次调用要编译;遇到 graph break 会碎图;shape 变化可能重编译 |
| 手写 Triton / CUDA | 人工为热点写特定 kernel | 极限性能和完全控制 | 维护成本高,正确性和 shape 泛化都要自己兜住 |

### 它最擅长的三类加速

FUSION

### 融合内存带宽型 op

例如 `x * scale + bias`、激活函数、mask、残差加法、部分归一化 epilogue。多个读写全局显存的 op 被融合后,中间张量不再落地,内存流量直接下降。

LAUNCH

### 减少 CPU 端调度成本

batch 小、序列短、op 很碎时,GPU 没吃饱,CPU 一直在发 kernel。编译后的图可以合并 launch,在 `reduce-overhead` 模式下还可能用 CUDA graphs 降低重复调用成本。

SPECIALIZE

### 为当前 shape 生成更贴切的代码

编译器知道 dtype、device、shape、stride 后,可以选择更合适的 tile、layout 和 kernel。代价是这些假设要靠 guards 保护,输入变化太频繁就会触发重编译。

第一条纪律:benchmark 时必须把首次编译成本排除,否则你测到的是编译器启动时间,不是模型稳定态吞吐。

## 编译链路:从 Python 到 kernel

35 MIN

`torch.compile` 不是一个单独的优化 pass, 而是一条流水线。粗略看,它把 Python 执行切成可捕获的区域,生成 FX 图, 为这张图生成 guards,再把 forward / backward 交给后端编译。 每个环节都有可能失败、降级或变慢,所以要把链路图刻进脑子里。

> **图：torch.compile 编译链路**
>
> - TORCH.COMPILE PIPELINE
> - Python Module
> - forward()
> - TorchDynamo
> - bytecode trace
> - guards
> - FX Graph
> - GraphModule
> - call\_function
> - AOTAutograd
> - forward + backward
> - decompose
> - TorchInductor
> - schedule · fusion
> - Triton / C++
> - graph break → eager island
> - RUNTIME CACHE
> - 第一次调用: trace → compile → cache compiled graph
> - 后续调用: 先跑 guards。如果 shape / dtype / device / 常量等假设满足,直接复用 compiled graph。
> - guards 失败: 为新输入重新 trace / compile。超过重编译上限后,该函数区域会回退到 eager。
> - guard pass → reuse
> - guard fail → recompile

FIG · Dynamo 负责捕获和 guards,FX 是中间图,AOTAutograd 处理训练的 backward,Inductor 才是真正生成快代码的默认后端

### 组件速查

TORCHDYNAMO

### 从 Python 执行中安全捕获图

它观察 Python frame / bytecode 执行,把能表达成 PyTorch op 的部分提取成 FX graph。遇到无法静态理解的 Python 行为,就切出 graph break,让那一小段继续用 eager 跑。

FX GRAPH

### 可检查、可变换的图 IR

FX graph 近似是一串 `placeholder`、`call_function`、`call_module`、`output` 节点。它不等于最终 kernel,只是后端优化的输入。

AOTAUTOGRAD

### 训练时把 backward 也纳入图

如果只编 forward,训练收益有限。AOTAutograd 会通过 ahead-of-time 的方式捕获反向图,让 Inductor 同时优化 forward 和 backward 的可优化区域。

INDUCTOR

### 默认后端,负责真正变快

Inductor 会做算子分解、融合、调度,再为 GPU 生成 Triton kernel,为 CPU 生成 C++/OpenMP 代码。`backend="inductor"` 是默认选择。

```
# 三层调试阶梯:每一层多打开一点编译器能力
compiled = torch.compile(model, backend="eager") # 只走 Dynamo 捕获,不做后端优化
compiled = torch.compile(model, backend="aot_eager") # Dynamo + AOTAutograd,仍用 eager 执行图
compiled = torch.compile(model, backend="inductor") # 默认:完整编译链路

# 用 fullgraph 当作"图完整性测试":有 graph break 就直接报错
compiled = torch.compile(model, fullgraph=True)
```

调试时先 backend="eager" 看 Dynamo 能不能捕获,再用 aot\_eager 查 backward,最后才上 inductor 查性能和代码生成。

## FX 捕获与 graph break

35 MIN

graph break 的意思不是"编译失败",而是 Dynamo 捕获到某一行时发现: 这段 Python 行为无法安全放进 FX 图。于是它先把已经捕获的图编译掉, 中间那段 unsupported code 用 eager 执行,然后继续尝试捕获后面的代码。 这保留了 PyTorch 的灵活性,但会 **打断融合、增加调度边界、降低优化机会** 。

```
import torch

@torch.compile
def bad_fn(x):
    y = x.sin() + x.cos()
    if y.sum().item() > 0: # 数据依赖控制流 + Tensor.item()
        print("positive") # logging 也会打断图
        return y * 2
    return y - 2

bad_fn(torch.randn(1024, device="cuda"))

# 观察 graph break 位置和原因
# TORCH_LOGS="graph_breaks" python playground.py
```

### 常见 graph break 与改法

| 触发源 | 为什么断图 | 优先改法 |
| --- | --- | --- |
| 数据依赖 `if/while` | 分支取决于 tensor runtime 值,trace 时不能提前知道走哪条路 | 能改成张量表达就用 `torch.where`;真分支用 `torch.cond`;否则把分支移出 compiled region |
| `Tensor.item()` | 把 GPU tensor 标量拉回 Python,通常意味着同步和数据依赖 | 避免在热路径上取 Python 标量;必要时尝试 `capture_scalar_outputs`,但先确认语义安全 |
| print / logging / 文件 I/O | 副作用无法放进纯张量计算图 | 放到外层;或用 `torch.compiler.disable` 包住日志函数;调试时临时打开即可 |
| Python 容器动态变形 | list/dict 长度、对象 id、模块属性变化会影响 trace 假设 | 让 compiled forward 只处理张量计算;把采样、后处理、统计聚合移出去 |
| 自定义 op / 第三方 kernel | Dynamo 或后端不知道如何追踪/分解/降低 | 注册 custom op + fake/meta kernel;或把这段作为 eager island,只编其前后稳定部分 |

### fullgraph=True 的正确用法

DEBUG GATE

### 用来发现隐藏 graph break

默认模式会默默切图继续跑,你可能以为"已经 compile 了",但实际只编到几个碎片。`fullgraph=True` 会要求整个函数捕获成一张图,一旦断图就报错,特别适合在 benchmark 前做图完整性检查。

PRODUCTION

### 不一定适合直接上线

生产里有些 eager island 是合理的,例如前后处理、日志、采样分支。比较稳妥的方式是:把真正的 tensor hot path 抽成小函数或子模块,对那部分开 `fullgraph=True`。

```
# 推荐结构:把可编译的热路径剥离出来
class Model(torch.nn.Module):
    def __init__ (self):
        super(). __init__ ()
        self.block = torch.compile(Block(), fullgraph=True)

    def forward(self, batch):
        x = preprocess(batch) # Python / I/O / tokenizer:留在 eager
        x = self.block(x) # 稳定张量计算:compile
        return postprocess(x) # 采样 / 日志:留在 eager
```

graph break 的优化原则:不要追求"全程序都 compile",要追求"高耗时张量区域被完整捕获"。

## guards、recompile 与 fallback

35 MIN

编译器要生成快代码,就必须相信一些假设:输入 dtype 是 fp16、shape 是 `(32, 128, 768)`、stride 连续、module 的某个属性没变。 guards 就是这些假设的 runtime check。后续调用时 guards 通过,直接复用已编译代码; guards 失败,就针对新条件重新编译。重编译次数太多时,Dynamo 会放弃,回到 eager。

> **图：guards 与重编译流程**
>
> - GUARDS DECIDE CACHE REUSE
> - Call #1
> - trace + compile
> - Compiled Graph A
> - guards attached
> - shape=(32,128,768)
> - CALL #2, #3, ...
> - guards pass → reuse Graph A
> - guards fail → compile Graph B / C / ...
> - too many variants → eager fallback
> - COMMON GUARDS
> - shape / stride
> - dtype / device
> - requires\_grad
> - object id
> - constants

FIG · guards 是 compiled graph 的准入条件;失败不是错误,但频繁失败会把编译收益吃掉

### 静态 shape 与 dynamic=True

STATIC

### 固定输入通常最快

如果 batch、seq\_len、hidden 都稳定,让编译器针对固定 shape 特化,通常能得到更强的融合和更简单的 kernel。线上推理常通过 padding / bucketing 把 shape 规整到少数几档。

DYNAMIC

### shape 变化频繁时减少重编译

`dynamic=True` 会让 Dynamo 尽量生成动态 shape kernel,避免每个 seq\_len 都重新编译。但动态 kernel 可能牺牲部分优化,并且不是所有 op 都能完全动态化。

DEFAULT NONE

### 先特化,遇到变化再更动态

官方默认 `dynamic=None`:开始会尝试更专门的图,当检测到输入尺寸变化导致重编译时,再尝试生成更动态的版本。这是通用场景的折中。

INFRA LESSON

### shape 策略是系统设计问题

编译器不是孤立优化。服务层的 batching、padding、request bucketing、KV cache layout 都会影响 guards 命中率。AI Infra 工程师要从入口流量开始控制 shape 分布。

### 诊断命令

```
# 小样例:看 graph break / guards / recompile 明细
TORCH_LOGS="graph_breaks,guards,recompiles" python day13_compile_bench.py

# 动态 shape 过度特化:看 dynamic shape 相关日志
TORCH_LOGS="dynamic,recompiles" python day13_compile_bench.py --dynamic

# 大模型:生成完整编译报告,再用 tlparse 打开
TORCH_TRACE="/tmp/day13_trace" python train_or_infer.py
pip install tlparse
tlparse /tmp/day13_trace
```

看到 recompile 时不要只怪编译器,先查输入 shape、dtype、module 属性和 Python 常量是不是每次都在变。

## Inductor:融合、模式与现实边界

30 MIN

Dynamo 捕获图只是"拿到了优化材料",真正把图变快的是后端。 PyTorch 默认后端 Inductor 会把高层 PyTorch ops 分解到更底层的 aten / prim 表达, 做 layout、调度、融合和代码生成。GPU 上常见输出是 Triton kernel; CPU 上则生成 C++/OpenMP 代码。理解 Inductor 不必一开始读源码, 先会选模式、看 trace、解释为什么没加速。

### compile mode 速查

| mode | 做什么 | 适合场景 | 注意 |
| --- | --- | --- | --- |
| `default` | 性能和编译开销的平衡模式 | 第一轮实验、训练、debug benchmark | 先用它建立 baseline,不要一上来 max-autotune |
| `reduce-overhead` | 通过 CUDA graphs 等方式减少 Python overhead | 小 batch、固定 shape、稳定推理服务 | 可能占更多内存;CUDA graph 也有适用条件 |
| `max-autotune` | 为 matmul / convolution 等 profile 多种实现并选择更快方案 | 离线压测、延迟极敏感、shape 很稳定 | 首次编译很慢;要把 autotune 成本从延迟统计里拿掉 |
| `max-autotune-no-cudagraphs` | 类似 max-autotune,但不启用 CUDA graphs | 想要 autotune,但 CUDA graph 不适用或影响调试 | 作为定位 reduce-overhead / cudagraph 问题的对照组 |

### 为什么编译后仍可能不快

GRAPH COVERAGE

### 图太碎,融合机会没了

如果 forward 里每几行就一次 graph break,Inductor 只能优化小片段,片段之间仍要回 eager。症状是 `TORCH_LOGS="graph_breaks"` 输出很多,benchmark 加速很小。

RECOMPILE

### 输入变化吃掉收益

变长 seq、动态图结构、Python 常量每步变化,都会触发新图编译。症状是 `TORCH_LOGS="recompiles"` 不断刷屏,首 token / 前几批延迟异常高。

NOT HOT

### 模型太小或瓶颈不在 PyTorch op

如果主要耗时在数据加载、tokenizer、网络 I/O、custom CUDA op 或大 GEMM 本身,compile 可能没有多少空间。先 profile,再决定是否编译。

CORRECTNESS

### 性能优化必须配正确性校验

编译后 kernel、融合顺序、数值舍入可能变化。每次引入 compile,都要做 eager vs compiled 输出对齐、端到端指标回归和异常 shape 覆盖。

### Inductor 调试选项

| 选项 / 命令 | 用途 | 什么时候用 |
| --- | --- | --- |
| `torch._inductor.list_mode_options()` | 查看每种 mode 实际打开了哪些配置 | 想知道 `default` 和 `max-autotune` 差在哪 |
| `torch._inductor.list_options()` | 列出 Inductor 支持的可配置项 | 查某个 options key 是否存在 |
| `options={"trace.enabled": True}` | 输出编译 trace,用于定位后端行为 | 性能异常或想看 fusion 后图形 |
| `options={"trace.graph_diagram": True}` | 生成融合后的图示 | 需要解释"哪些 op 被融合了" |
| `options={"fallback_random": True}` | 调试随机数相关正确性问题 | compiled 输出与 eager 对不齐且怀疑随机 op |

Inductor 的收益来自"稳定图 + 足够大的热路径 + 可融合/可调度的 op";三者缺一,compile 就可能只是更复杂的 eager。

## 动手实践:eager vs compile benchmark

1 H

今天的交付物是一份可复现实验记录:同一个小模型分别跑 eager 和 compile, 排除首编译开销,同步 GPU 计时,校验输出正确性,记录 graph break / recompile 日志。 如果你只有 CPU,脚本也能跑,但更推荐在 CUDA 机器上观察 kernel launch 和 fusion 收益。

```
# day13_compile_bench.py
import argparse
import time
import torch
from torch import nn

class TinyBlock(nn.Module):
    def __init__ (self, hidden, expansion):
        super(). __init__ ()
        self.ln = nn.LayerNorm(hidden)
        self.fc1 = nn.Linear(hidden, hidden * expansion)
        self.fc2 = nn.Linear(hidden * expansion, hidden)

    def forward(self, x):
        residual = x
        x = self.ln(x)
        x = self.fc1(x)
        x = torch.nn.functional.gelu(x)
        x = x * 1.41421356 + 0.01
        x = self.fc2(x)
        return x + residual

def sync(device):
    if device.type == "cuda":
        torch.cuda.synchronize()

def bench(fn, x, device, warmup, iters):
    with torch.inference_mode():
        for _ in range(warmup):
            fn(x)
        sync(device)
        start = time.perf_counter()
        for _ in range(iters):
            fn(x)
        sync(device)
    return (time.perf_counter() - start) * 1000 / iters

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", default="default",
                        choices=["default", "reduce-overhead", "max-autotune", "max-autotune-no-cudagraphs"])
    parser.add_argument("--dynamic", action="store_true")
    parser.add_argument("--fullgraph", action="store_true")
    parser.add_argument("--batch", type=int, default=32)
    parser.add_argument("--seq", type=int, default=128)
    parser.add_argument("--hidden", type=int, default=768)
    parser.add_argument("--iters", type=int, default=100)
    parser.add_argument("--warmup", type=int, default=20)
    args = parser.parse_args()

    torch.manual_seed(0)
    torch.set_float32_matmul_precision("high")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dtype = torch.float16 if device.type == "cuda" else torch.float32

    model = TinyBlock(args.hidden, expansion=4).to(device=device, dtype=dtype).eval()
    x = torch.randn(args.batch, args.seq, args.hidden, device=device, dtype=dtype)

    compiled = torch.compile(
        model,
        mode=args.mode,
        dynamic=args.dynamic or None,
        fullgraph=args.fullgraph,
    )

    with torch.inference_mode():
        eager_out = model(x)
        compiled_out = compiled(x) # 首次调用会触发 trace + compile
        torch.testing.assert_close(compiled_out, eager_out, rtol=1e-2, atol=1e-2)

    eager_ms = bench(model, x, device, args.warmup, args.iters)
    compile_ms = bench(compiled, x, device, args.warmup, args.iters)
    speedup = eager_ms / compile_ms

    print(f"device={device} dtype={dtype} mode={args.mode} dynamic={args.dynamic}")
    print(f"shape=({args.batch}, {args.seq}, {args.hidden})")
    print(f"eager : {eager_ms:.3f} ms / iter")
    print(f"compile : {compile_ms:.3f} ms / iter")
    print(f"speedup : {speedup:.2f}x")

if __name__ == " __main__":
    main()
```

### 实验命令

```
# 1) 默认模式,建立 baseline
python day13_compile_bench.py --mode default

# 2) 检查是否有 graph break / recompile
TORCH_LOGS="graph_breaks,recompiles" python day13_compile_bench.py --mode default --fullgraph

# 3) 固定 shape 推理可以试 reduce-overhead
python day13_compile_bench.py --mode reduce-overhead

# 4) 离线压测再试 max-autotune,不要把首次 autotune 算进线上延迟
python day13_compile_bench.py --mode max-autotune

# 5) 变长 seq 对比 dynamic=True 的重编译情况
TORCH_LOGS="recompiles,dynamic" python day13_compile_bench.py --seq 64 --dynamic
TORCH_LOGS="recompiles,dynamic" python day13_compile_bench.py --seq 128 --dynamic
```

### 结果记录模板

| 环境 | mode | shape | eager | compile | speedup | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| GPU / dtype | `default` | 32 × 128 × 768 | \_\_ ms | \_\_ ms | \_\_× | 是否有 graph break / recompile |
| GPU / dtype | `reduce-overhead` | 32 × 128 × 768 | \_\_ ms | \_\_ ms | \_\_× | 内存是否上升,CUDA graph 是否生效 |
| GPU / dtype | `max-autotune` | 32 × 128 × 768 | \_\_ ms | \_\_ ms | \_\_× | 首次编译/调参耗时另记 |

### 交付物检查清单

- 能画出 `Python → Dynamo → FX → AOTAutograd → Inductor → Triton/C++` 的链路图。
- 能解释 graph break 为什么会降低融合机会,并用 `TORCH_LOGS="graph_breaks"` 找到位置。
- 能解释 guards 失败为什么导致 recompile,并用 `TORCH_LOGS="recompiles"` 找到触发条件。
- 完成 eager / compile / reduce-overhead 至少三组 benchmark,并排除首次编译耗时。
- 写下结论:这个模型是否值得 compile?瓶颈是 graph break、recompile、编译开销还是算子本身?

## 生产判断:什么时候该 compile

20 MIN

AI Infra 里,编译不是"开关",而是一项容量和延迟工程。 你需要知道它给哪条路径带来收益、给哪条路径带来风险, 以及如何把编译缓存、shape 分桶、灰度验证接进服务系统。

适合开

### 稳定、重复、张量密集

Transformer block、MLP、vision backbone、固定 shape 推理、长时间训练 step。只要图覆盖高、输入分布稳定、warmup 后调用次数足够多,compile 的一次性成本就能摊薄。

谨慎开

### 形状和控制流很动态

agent 工具调用、复杂采样后处理、频繁变长 batch、Python object 操作重的模型。先拆出稳定子模块,不要把整条业务链路一口气 compile。

上线流程

### 三步灰度

① 离线输出对齐;② 压测固定 shape 和长尾 shape;③ 线上小流量灰度,记录 p50/p95/p99、首次请求延迟、recompile 次数和显存峰值。

原则

### 编译器吃稳定性

你越能把请求整理成少数稳定 shape,越能把热路径写成纯张量计算,编译器越能回报你。服务层的调度质量,常常决定 compile 的最终收益。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么第一次调用 compiled model 特别慢?

ANS

第一次调用不仅在跑模型,还在做 trace、guard 生成、后端编译、Triton/C++ 代码生成,有时还会做 autotune。这个成本是一次性的,所以 benchmark 必须先 warmup,线上服务也要预热常见 shape。

### Q2 · compile 后没有变快,第一优先查什么?

ANS

先查三件事:是否把首次编译算进去了;是否有很多 graph break;是否一直 recompile。命令分别是正常 warmup、`TORCH_LOGS="graph_breaks"`、`TORCH_LOGS="recompiles"`。如果这三项都干净,再用 profiler 看瓶颈是不是数据加载、大 GEMM 或第三方 kernel。

### Q3 · `dynamic=True` 是不是总该打开?

ANS

不是。固定 shape 场景下,静态特化通常更快。`dynamic=True` 的价值是减少 shape 变化导致的重编译,适合变长序列和 batch 波动明显的场景。实际策略通常是:服务层先 bucketing / padding,仍然重编译明显时再开 dynamic。

### Q4 · 能不能把整个训练脚本都套一层 `torch.compile`?

ANS

不建议。训练脚本里有 DataLoader、日志、checkpoint、调度器、评估分支和大量 Python 副作用。更好的边界是模型 forward、部分 optimizer step 或单个高耗时子模块。边界越纯粹,guards 越稳定,graph break 越少。

### Q5 · `torch.compile` 能替代手写 Triton kernel 吗?

ANS

它是很好的 baseline,但不能替代所有手写 kernel。通用 elementwise、简单融合、部分 matmul/convolution 模式交给 Inductor 很合适;极端热点、特殊 layout、FlashAttention 这类 IO-aware 算法,仍然需要专门 kernel。Day 14 的算子融合和 FlashAttention 会继续接上这里。

## 复盘问题

REVIEW

1. 为什么 `torch.compile` 可以在保持 eager 语义的同时获得优化机会?
2. FX graph 和最终 Triton kernel 是同一个层级的东西吗?中间还经历了哪些阶段?
3. graph break 为什么通常不是 correctness bug,但会影响性能?
4. guards 失败、recompile、fallback 三者的因果关系是什么?
5. 固定 shape 推理服务为什么更适合 `reduce-overhead`?
6. 如果 benchmark 没加速,你会按什么顺序排查?

## 参考资料

OFFICIAL DOCS

API

### torch.compile API

官方参数说明: `fullgraph`、`dynamic`、`backend`、`mode`、`options`。
[docs.pytorch.org · torch.compile](https://docs.pytorch.org/docs/2.12/generated/torch.compile.html)

DEBUG

### torch.compile Troubleshooting

官方 graph break、guards、recompile、`TORCH_LOGS` 与 `tlparse` 调试指南。
[docs.pytorch.org · troubleshooting](https://docs.pytorch.org/docs/2.12/user_guide/torch_compiler/torch.compiler_troubleshooting.html)

OVERVIEW

### PyTorch 2.x Compiler Stack

官方介绍 TorchDynamo、AOTAutograd、PrimTorch、TorchInductor 的关系。
[docs.pytorch.org · PyTorch 2.x](https://docs.pytorch.org/get-started/pytorch-2.0/)

TUTORIAL

### Introduction to torch.compile

官方入门教程,包含基础用法、graph break 和 troubleshooting 指向。
[docs.pytorch.org · tutorial](https://docs.pytorch.org/tutorials/intermediate/torch_compile_tutorial.html)

编译器不是魔法开关,它是对稳定张量计算的奖励。

DAY 13 COMPLETE · NEXT: OPERATOR FUSION & FLASHATTENTION
