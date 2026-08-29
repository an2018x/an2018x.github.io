---
title: "Day 06 · Profiling 工具链"
date: '2026-05-17'
draft: false
description: "系统学习 GPU profiling 工具链:nsys 看系统级 timeline、ncu 做 kernel 深度分析、py-spy 抓 Python 热点、torch.profiler 串起训练全链路,建立先测量再优化的工程习惯。"
toc: true
tags:
  - AI
  - CUDA
  - GPU
  - Profiling
  - PyTorch
---

DAY 06 · AI INFRA ROADMAP · 60 DAYS

# 测量先于 _优化_

Day 05 写完 tiled GEMM,你大概率会问:"还差什么才能追上 cuBLAS?" 这就是 profiling 要回答的问题。今天系统学习 4 个层次的工具—— `nsys` 看系统级 timeline、`ncu` 钻 kernel 内部、 `py-spy` 抓 Python 热点、`torch.profiler` 串起训练全链路。 没有数据的优化是猜测。

**DURATION** 3 h **THEORY** 1 h **HANDS-ON** 1.5 h **REVIEW** 0.5 h **STACK** Nsight Systems · Nsight Compute · py-spy · torch.profiler

## 思维导图

OVERVIEW

> **图：Day 6 思维导图**
>
> - DAY 06 · PROFILING 工具链
> - NSYS · NCU · PY-SPY · TORCH.PROFILER
> - 01 · NSYS
> - 系统级 Timeline
> - 02 · NCU
> - Kernel 深度分析
> - 03 · PY-SPY
> - Python 采样剖析
> - 04 · TORCH
> - torch.profiler
> - CPU + GPU 时间线
> - Kernel launch / memcpy
> - NCCL 通信可视化
> - 找 bubble / 找空隙
> - Occupancy 分析
> - Memory / Compute Tput
> - Roofline · Source View
> - Bank Conflict 检测
> - 采样剖析 (无侵入)
> - Flame Graph 输出
> - dump · top · record
> - DataLoader 瓶颈定位
> - Op 级 + Kernel 级
> - Schedule (wait/warm)
> - TensorBoard 可视化
> - Memory · Stack Trace
> - DELIVERABLES
> - resnet.nsys-rep 时间线
> - tiled\_gemm.ncu-rep 报告
> - py-spy flame graph
> - TensorBoard trace

FIG · Day 06 全景:四个工具,四个抽象层次,共同构成 GPU 性能分析栈

## 四个层次的 Profiling 栈

20 MIN

把工具搞混最常见的错误是:用 `ncu` 去找 DataLoader 瓶颈, 用 `py-spy` 去看 kernel 是不是 memory-bound。 四个工具的关系是_不同抽象层次的显微镜_—— 先在高层用粗粒度工具定位区域,再用低层细粒度工具放大问题。

> **图：Profiling 工具栈层次**
>
> - PROFILING STACK — 4 LAYERS · TOP-DOWN INVESTIGATION
> - HIGH
> - LOW
> - ABSTRACTION
> - LAYER 1 · APPLICATION
> - torch.profiler
> - 看 op 调用栈 · 看每个 step 时间分布 · 看 H2D/D2H 传输 · 看 OOM
> - 秒级
> - LAYER 2 · PYTHON RUNTIME
> - py-spy
> - Python 调用栈采样 · DataLoader 是否慢 · GIL 等待 · 第三方库热点
> - 毫秒级
> - LAYER 3 · SYSTEM TIMELINE
> - nsys (Nsight Systems)
> - CPU/GPU 时间线 · kernel launch 序列 · memcpy · NCCL · stream 并行
> - 微秒级
> - LAYER 4 · KERNEL INTERNALS
> - ncu (Nsight Compute)
> - SM 占用率 · 内存吞吐 · bank conflict · Roofline · 指令级分析
> - 纳秒级
> - TOP-DOWN 调查路径
> - step 慢
> - DataLoader 卡?
> - GPU 有空隙?
> - 某 kernel 慢?
> - memory-bound?

FIG · 四个工具按抽象层次排列,典型调查路径自上而下,从应用层"step 慢"逐步钻到 kernel 层"memory-bound"

KEY INSIGHT

### Top-Down 不要 Bottom-Up

新人最常见错误:打开就跑 `ncu` 看某个 kernel。这等于在不知道哪间房有问题时直接拆墙。 **先用 torch.profiler 看哪个 op 占时间最多,再用 nsys 看那个时间段在 GPU 上发生了什么,最后才用 ncu 看具体 kernel 的内部** 。每深入一层成本翻倍。

OBSERVER EFFECT

### Profiling 会改变被测对象

所有 profiling 都有 overhead:`ncu` 默认会序列化 kernel 并多次重放,慢 10–100×;`nsys` overhead 较小(\<5%)但生成的 trace 文件可能很大;`py-spy` 几乎无侵入。 **profile 数据反映相对结构,不要把绝对耗时当成生产性能。**

原则: 一次只 profile 一件事。同时开 nsys + ncu 会得到不可解读的数据。

## Nsight Systems — 系统级 Timeline

30 MIN

`nsys` 把整个进程的 CPU 线程、CUDA stream、kernel 启动、memcpy、NCCL 调用 画在_同一条时间线_上,几乎是判断"GPU 究竟在不在干活"的唯一办法。 它不告诉你某个 kernel 内部好不好,只告诉你 **整个系统的协作是否顺畅** 。

> **图：nsys timeline 示意**
>
> - NSYS TIMELINE — TWO TRAINING STEPS
> - t = 0
> - 120 ms
> - 240 ms
> - CPU
> - DataLoad
> - launch
> - CPU idle / wait for GPU
> - CPU idle
> - CUDA API
> - cpy
> - launch×N
> - Memcpy H2D
> - GPU Kernels
> - conv
> - bn
> - gemm
> - gemm\_bwd
> - opt
> - ⚠ GPU IDLE 60 ms
> - DATALOADER 卡住了 GPU
> - → 增加 num\_workers / pin\_memory / prefetch

FIG · 典型 nsys timeline:GPU 行的空隙意味着 GPU 在等 CPU,本例是 DataLoader 阻塞

### 常用命令

```
# 1) 最常用:profile 一次完整的 Python 训练脚本
nsys profile -o resnet \
     --trace=cuda,nvtx,cudnn,cublas \
     --cuda-memory-usage=true \
     python train.py

# 2) 只 profile 中间 5 秒(避开 warmup),减少文件大小
nsys profile -o resnet -y 10 -d 5 python train.py

# 3) 多 GPU / 多进程:每个 rank 输出独立 .nsys-rep
nsys profile -o rank%q{LOCAL_RANK} \
     --trace=cuda,nvtx,nccl \
     torchrun --nproc_per_node=4 train.py

# 4) 命令行查看摘要(无 GUI 时)
nsys stats resnet.nsys-rep
# 输出:CUDA Kernel Time、Memcpy Stats、NVTX ranges、CPU sampling……

# 5) GUI 打开
nsys-ui resnet.nsys-rep
```

### 用 NVTX 给 timeline 加标签

默认 timeline 只有 CUDA API 和 kernel 名字,信息有限。 用 `torch.cuda.nvtx.range_push/pop` 给关键代码段打标签, timeline 上会出现彩色长条,极大提高可读性。

```
import torch
from torch.cuda import nvtx

for step, batch in enumerate(loader):
    nvtx.range_push(f"step_{step}")

    nvtx.range_push("forward")
    out = model(batch)
    loss = criterion(out, target)
    nvtx.range_pop()

    nvtx.range_push("backward")
    loss.backward()
    nvtx.range_pop()

    nvtx.range_push("optimizer")
    optimizer.step()
    optimizer.zero_grad()
    nvtx.range_pop()

    nvtx.range_pop() # step_{step}
```

FIRST QUESTION

### GPU 行有空隙吗?

这是看 timeline 时 **第一个要问的问题** 。GPU 几乎打满 = 计算 bound,优化算子内部;有大块空隙 = host 端瓶颈(DataLoader / Python overhead / 同步),要往上一层找。

SYNC POINTS

### 注意隐式同步

很多 PyTorch 调用会触发 device sync:`.item()`、`.cpu()`、`print(tensor)`、`.numpy()`。timeline 上表现为 CPU 长时间等待 GPU。 **训练 loop 里禁止打印 loss 张量,改用 detach + 累加** 。

FILE SIZE

### 控制 trace 文件大小

跑 10 分钟的 trace 文件可能上 GB。用 `-y`(delay)和 `-d`(duration)只抓中间几秒;profile 第一次先抓 10 秒看模式,再决定要不要抓更长。

PRO TIP

### NCCL 通信可视化

加 `--trace=nccl` 后,分布式训练中的 AllReduce/AllGather 会显示为单独的行。 **看通信和计算是否 overlap** —— 不 overlap 就是 bubble,直接关系到训练吞吐。Day 17–22 会反复用到。

实战节奏: nsys 是日常 profiling 第一选择,跑 1 次拿到 timeline 比想 1 小时更有价值。

## Nsight Compute — Kernel 深度分析

25 MIN

Day 05 已经用过 `ncu`。今天补充三个进阶用法: _指定 kernel 抓取_(避免 profile 整个程序)、 _Source View_(把指标对齐到 CUDA 源码行)、 _两份报告对比_(优化前后的定量评估)。

| 场景 | 命令 | 关键参数 |
| --- | --- | --- |
| 只 profile 名字匹配的 kernel | `ncu -k regex:gemm ./app` | `-k` 支持正则,避免抓整个程序 |
| 只 profile 第 N 次调用 | `ncu --launch-skip 50 --launch-count 1 ./app` | 跳过 warmup,只看稳态 |
| Source View(SASS / PTX / C++ 对齐) | `ncu --set full --import-source on -o rep ./app` | 编译时需 `-lineinfo` |
| 对比两个 kernel | `ncu --set full -o naive ./naive; ncu --set full -o tiled ./tiled` | GUI 中 File → Baseline 加载第二个 |
| 仅打印关键指标(无 GUI) | `ncu --print-summary per-kernel ./app` | CI 里跑性能回归测试 |

### 最该看的几个 Section

GPU SPEED OF LIGHT

### 第一眼看这里

顶部的 SOL 卡片直接给出 Compute % 和 Memory %,告诉你 kernel bound 在哪里。 **哪个数字大就先优化哪边** ——Memory % 高就改访存,Compute % 高就找指令级优化。

MEMORY CHART

### Memory Workload Analysis

L1/L2/HBM 各层的带宽和命中率。Day 05 tiled GEMM 应该看到 L1 hit rate 显著高于 naive 版本——这就是 Shared Memory 的效果。

SCHEDULER STATS

### Warp State 统计

看 warp 在等什么:`stall_long_sb` = 等 Global Memory,`stall_short_sb` = 等 Shared Memory,`stall_barrier` = 等 syncthreads。stall 类型告诉你下一步该优化什么。

SOURCE VIEW

### 把指标对齐到源码

编译时加 `-lineinfo`,Source View 里能逐行看每行 CUDA C 的执行次数、stall 原因、SASS 指令。 **定位"哪一行是热点"最精准的工具** 。

SCHEDULER · OCCUPANCY

### Launch Statistics

列出限制 occupancy 的因素:寄存器、SMEM、block 大小。比如显示"Limited by SMEM = 50%",你就知道减少 SMEM 用量能直接提升 occupancy。

ROOFLINE

### Roofline 视图

一图判断 compute-bound vs memory-bound。点落在斜线上 = memory-bound,水平线上 = compute-bound。 **tiled GEMM 通常仍在斜线区** ——还能继续往上推。

### 优化前后对比工作流

```
# Step 1: 编译时保留行号信息
nvcc -O2 -lineinfo -o tiled_gemm tiled_gemm.cu

# Step 2: profile baseline 与优化版各一份
ncu --set full --import-source on -k tiled_gemm \
     -o baseline ./tiled_gemm

# 改完代码再跑一次
ncu --set full --import-source on -k tiled_gemm \
     -o optimized ./tiled_gemm

# Step 3: 在 ncu-ui 中加载 optimized.ncu-rep,
# 然后 File → Add Baseline → 选 baseline.ncu-rep
# 所有指标会显示 ± 百分比变化
ncu-ui optimized.ncu-rep
```

陷阱: ncu 会序列化 kernel 并多次重放,实际运行时间会被放大。判断"快了多少"用程序自己测的耗时,ncu 只看相对指标。

## py-spy — Python 采样剖析

15 MIN

`nsys` 看不清 Python 里发生什么——它能告诉你"CPU 在某段时间闲着", 但不知道是哪段 Python 代码在闲。`py-spy` 填补这个空隙: _不修改一行代码_、对运行中的 Python 进程做采样, 生成火焰图。AI Infra 场景下最常用来定位 DataLoader 瓶颈。

| 子命令 | 用途 | 典型场景 |
| --- | --- | --- |
| `py-spy top` | 实时显示 Python 函数 CPU 占比(类似 `top`) | 训练卡住时快速看是哪个函数在死循环 |
| `py-spy record` | 采样一段时间,生成 SVG 火焰图 | 定位长期热点,事后分析 |
| `py-spy dump` | 打印每个线程的当前调用栈 | 诊断挂死/死锁,看每个线程卡在哪 |

### 三个最有用的命令

```
# 1) 对运行中的训练进程实时 top(无侵入)
py-spy top --pid 12345

# 2) 采样 60 秒,生成火焰图
py-spy record -o flame.svg --pid 12345 --duration 60

# 3) 训练挂死时,看每个线程在哪
py-spy dump --pid 12345

# 4) 直接启动并 profile(适合短脚本)
py-spy record -o flame.svg -- python train.py

# 5) DataLoader worker 也要 profile,加 --subprocesses
py-spy record -o flame.svg --subprocesses -- python train.py
```

CLASSIC FINDING

### DataLoader 慢的元凶

火焰图里最常出现的"长平台":图像 decode(`PIL`)、Tokenizer(`transformers`)、JSON parse、磁盘随机读。**看到这些就该把对应操作前置离线、改用更快的库(opencv / pyarrow / orjson)、或加大 num\_workers**。

SUBPROCESSES

### 别忘了 --subprocesses

PyTorch DataLoader 用 worker 子进程,默认 py-spy 只看主进程。 **必须加 `--subprocesses`** ,否则火焰图里只能看到主进程在 idle wait——什么都查不出来。

PERMISSION

### Linux 上的权限

py-spy 要读其他进程内存,需要 `ptrace` 能力。Docker 容器内可能要 `--cap-add=SYS_PTRACE`;某些云主机要 `sudo`。报错 _Permission denied_ 时先查这个。

GIL · NATIVE

### --idle 与 --native

`--idle` 把 GIL 等待也算进去,能看出多线程是否被 GIL 拖住。`--native` 一并采样 C/Rust 扩展的栈,看 numpy/torch 内部的 native 代码 —— 比纯 Python 栈信息量大得多。

使用频次: 每次新接手一个训练脚本第一天就跑一次 py-spy record,十有八九能发现可摘的"低垂果实"。

## torch.profiler — 端到端训练分析

20 MIN

`torch.profiler` 是 PyTorch 内置的 profiler,介于 nsys 与 ncu 之间—— 它同时记录 _op 调用_(forward/backward/optimizer) 和 _底层 CUDA kernel_。 最大的优势:数据用 TensorBoard 打开,Operator View / Kernel View / Memory View 一站式查看。

### 最小可用模板

```
import torch
from torch.profiler import profile, schedule, tensorboard_trace_handler, ProfilerActivity

prof = profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    schedule=schedule(
        wait=1, # 跳过前 1 个 step (warmup)
        warmup=1, # 预热 1 个 step (不记录但激活 profiler)
        active=3, # 真正采集 3 个 step
        repeat=1, # 整个周期重复 1 次
    ),
    on_trace_ready=tensorboard_trace_handler("./log/resnet"),
    record_shapes=True,
    profile_memory=True,
    with_stack=True,
)

with prof:
    for step, batch in enumerate(loader):
        out = model(batch)
        loss = criterion(out, target)
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()
        prof.step() # 重要!推进 profiler 的 schedule 阶段
        if step >= 10:
            break

# 命令行查看 top kernels
print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=20))
```

### 用 TensorBoard 查看

```
# 安装 TensorBoard Plugin
pip install torch-tb-profiler

# 启动 TensorBoard 指向 trace 目录
tensorboard --logdir=./log

# 浏览器打开后切到 "PYTORCH_PROFILER" 标签页
```

SCHEDULE 三段式

### wait / warmup / active

这三个参数**必须配合 `prof.step()` 使用**。wait 跳过模型刚加载时的杂讯;warmup 让 cudnn 选好算法、分配好 SMEM;active 才是真正记录。少了 schedule 等于在抓"非稳态"数据,毫无意义。

OPERATOR VIEW

### 谁的时间最多

按 op 类型聚合(Linear / Conv / Attention),给出 CPU 时间、GPU 时间、self time。 **self time 排序** 可以看哪个 op 最耗时,这是优化的第一步。

KERNEL VIEW

### 底层 kernel 视角

每个 op 调用了哪些 CUDA kernel、各占多少时间。能直接看到"这个 Linear 实际跑的是 ampere\_sgemm\_128x64\_tn 这个 kernel"。Op View 到 Kernel View 是 **从 PyTorch 抽象到 GPU 现实的桥梁** 。

TRACE VIEW

### Chrome Trace 时间线

类似 nsys 的 timeline,但是 op 级别的。能看到 forward / backward / optimizer 的边界、stream 上的 kernel、memcpy。 **没装 Nsight 时可以代替 nsys 用** 。

MEMORY VIEW

### 显存曲线

开 `profile_memory=True` 后,能看到一个 step 中显存随时间的曲线、峰值在哪个 op。 **OOM 排查的首选工具** 。

DISTRIBUTED VIEW

### 分布式诊断

多卡训练时,TensorBoard Plugin 给出每个 rank 的 GPU 利用率、AllReduce 时间、计算/通信占比。 **判断 DDP 是否健康的标准面板** ,Day 17 起会反复用到。

### 把 nsys / ncu / py-spy / torch.profiler 串起来

四个工具不是互斥的,而是_同一个调查里的不同放大倍数_。 一个完整的性能问题诊断通常这样走:

| 步骤 | 工具 | 要回答的问题 | 典型结论 |
| --- | --- | --- | --- |
| 1 | torch.profiler | 哪个 op 最耗时?GPU 利用率是多少? | Linear 占 45%,GPU 利用率仅 50% |
| 2 | nsys | 那 50% 时间 GPU 在做什么?有 idle gap 吗? | 每 step 之间 GPU idle 80 ms |
| 3 | py-spy | 那 80 ms 内 Python 在做什么? | DataLoader worker 在 PIL.open() |
| 4 | ncu(必要时) | Linear 这个 kernel 内部还能优化吗? | 已经接近 cuBLAS 极限,跳过 |

心得: 70% 的训练性能问题在第 2-3 步就能解决,根本走不到 ncu。

## 动手实践 — 给 ResNet 训练做体检

1.5 H

### Lab — profile\_resnet.py

用 ResNet-50 + CIFAR-10(或 ImageNet 子集)写一个故意有问题的训练脚本—— **num\_workers=0** 、**每 step 打印 loss.item()**、 **用 PIL 现场 resize** ——然后用今天的四个工具找出每个问题。

```
# profile_resnet.py — 故意写慢的训练脚本
import torch, torchvision
from torch.profiler import profile, schedule, tensorboard_trace_handler, ProfilerActivity
from torch.cuda import nvtx

model = torchvision.models.resnet50().cuda()
opt = torch.optim.SGD(model.parameters(), lr=0.1)
loss_fn = torch.nn.CrossEntropyLoss()

# 故意:num_workers=0(单进程加载,严重瓶颈)
loader = torch.utils.data.DataLoader(dataset, batch_size=64,
                                      num_workers=0, pin_memory=False)

prof = profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    schedule=schedule(wait=1, warmup=1, active=3),
    on_trace_ready=tensorboard_trace_handler("./log/resnet"),
    record_shapes=True, profile_memory=True, with_stack=True,
)

with prof:
    for step, (x, y) in enumerate(loader):
        nvtx.range_push(f"step_{step}")
        x, y = x.cuda(), y.cuda()

        nvtx.range_push("forward"); out = model(x); nvtx.range_pop()
        nvtx.range_push("loss"); loss = loss_fn(out, y); nvtx.range_pop()
        nvtx.range_push("backward"); loss.backward(); nvtx.range_pop()
        nvtx.range_push("opt"); opt.step(); opt.zero_grad(); nvtx.range_pop()

        # 故意:每步打印,触发隐式 D2H 同步
        print(f"step {step}: loss={loss.item():.4f}")

        prof.step()
        nvtx.range_pop()
        if step >= 10: break
```

### 四步体检流程

```
# Step 1: torch.profiler — 看 op 级别占比
python profile_resnet.py
tensorboard --logdir=./log
# 在 Operator View 看 GPU 利用率,大概率 < 50%

# Step 2: nsys — 看时间线上 GPU 空隙
nsys profile -o resnet --trace=cuda,nvtx -y 5 -d 10 \
     python profile_resnet.py
nsys stats resnet.nsys-rep
# 应该能看到大块 GPU idle,以及 print/.item() 引起的 sync

# Step 3: py-spy — 看 CPU 端 Python 热点
py-spy record -o flame.svg --subprocesses --duration 30 \
       -- python profile_resnet.py
# 在火焰图里看 PIL / collate / to_tensor 占多少

# Step 4: ncu — 钻最热的 kernel(可选)
ncu --set full --launch-skip 50 --launch-count 5 \
     -k regex:ampere_sgemm -o resnet_gemm \
     python profile_resnet.py
```

### 预期诊断结果

| 问题 | 用哪个工具发现 | 修复方案 | 预期收益 |
| --- | --- | --- | --- |
| DataLoader 单进程 | nsys timeline GPU 大空隙 → py-spy 火焰图证实 | `num_workers=8`, `pin_memory=True`, `persistent_workers=True` | 2–4× 端到端加速 |
| 每步 loss.item() 同步 | nsys 看到 step 末尾 CPU 等 GPU | 累加 `loss.detach()`,每 N 步再 `.item()` | 5–10% 加速 |
| PIL 图片处理慢 | py-spy 火焰图里 PIL.\* 占大段 | 预先转 `webdataset` / 用 `torchvision.io.decode_jpeg` | DataLoader 吞吐 3× 提升 |
| 没开 AMP | torch.profiler Kernel View 看到全是 fp32 kernel | 用 `torch.cuda.amp.autocast`(Day 12 详讲) | A100 上 1.5–2× 加速 |

交付物: 一份 markdown 报告,包含四个工具的截图、定位到的 3 个具体问题、修复前后的 step 时间对比。

## 常见疑问

5 QUESTIONS

### Q1 · nsys 和 torch.profiler 都能画 timeline,选哪个?

ANS

两者侧重不同。 **nsys 是系统级** :能同时看到所有进程、所有 stream、NCCL 通信、CPU 线程调度,适合排查 host/device 协同问题、分布式问题。 **torch.profiler 是框架级** :能把 op 调用栈对齐到 kernel,看 Linear 的下面究竟是哪个 cuBLAS kernel,适合排查"哪个 PyTorch op 慢"。

实战:先用 torch.profiler 定位 op 层瓶颈;若问题在框架之外(DataLoader / 分布式 / CPU 同步)就切到 nsys。

### Q2 · 为什么 ncu 跑出来的耗时比真实运行慢很多?

ANS

ncu 为了收集精确的硬件计数器,会 **多次重放同一个 kernel** (默认 `--replay-mode kernel`),每次收集不同的指标组。一个 kernel 可能被跑 10+ 次,加上序列化执行,绝对耗时被放大 10–100×。

所以 **ncu 报告里的 Duration 不要当生产性能** ,要看的是 Compute % / Memory % / Occupancy 这些相对指标。真实耗时用程序内 CUDA event 或 nsys 测。如果非要 ncu 测真实耗时,用 `--replay-mode application`,但收集的指标会少。

### Q3 · py-spy 抓不到 DataLoader worker 怎么办?

ANS

三步检查:

(1) **必须加 `--subprocesses`** ,这是最常见的坑。PyTorch DataLoader worker 是 fork 出来的子进程,默认 py-spy 只看主进程。

(2) **权限** :Linux 上要么 `sudo`,要么 sysctl 设置 `kernel.yama.ptrace_scope=0`。Docker 里要 `--cap-add=SYS_PTRACE`。

(3) **worker 启动方式** :如果用 `multiprocessing_context='spawn'`,worker 是新解释器,py-spy 启动时它们还没起来,可以加 `--duration 60` 让 py-spy 持续采样到 worker 都启动后。

### Q4 · torch.profiler 输出特别大、加载到 TensorBoard 很慢,怎么瘦身?

ANS

几个有效手段:

(1) **缩短 active 区间** :active=3 已经够分析,不要 active=100。schedule 的语义就是为了避免抓全程。

(2) **关掉 with\_stack** :Python 调用栈占体积最大。只在需要看 stack 时打开,日常诊断关掉。

(3) **关掉 record\_shapes** :形状信息会显著膨胀 trace,只在分析形状相关问题(比如不同 batch size 性能差异)时开。

(4) **profile\_memory 也很贵** ,只在排查 OOM 时打开。

(5) 多 GPU 训练只 profile 一两个 rank,不要每个 rank 都 profile,否则 trace 总大小线性放大。

### Q5 · 分布式训练里怎么 profile?每个 rank 都要抓吗?

ANS

不必。日常诊断的两种打法:

**① 单机多卡:每个 rank 输出独立 nsys-rep** ,但只重点看 rank 0 和 rank N-1 两份(头尾通常先暴露问题)。命令模板:`nsys profile -o rank%q{LOCAL_RANK} torchrun ...`。文件命名里用 %q{ENV\_VAR} 占位符是关键。

**② 多机:torch.profiler 加 DistributedView** ,在 TensorBoard 里能直接对比所有 rank 的 GPU 利用率和通信占比,一眼看出"哪个 rank 是慢节点"。这是诊断"straggler"问题的标准工具,Day 27/52 会专门讲。

原则:profile 是有 overhead 的,不要每个 rank 都开高强度 profiling,会严重影响实际时间分布的可信度。

## 复盘问题

5 QUESTIONS

1. 画一张图:把 nsys、ncu、py-spy、torch.profiler 按"看哪一层"排列,并写出各自的适用场景。
2. 训练脚本 GPU 利用率只有 40%,你的诊断顺序是什么?第一个动用的工具是什么?第一个排除的可能性是什么?
3. 解释为什么 `loss.item()` 出现在训练循环里会让 nsys timeline 出现规律性 GPU idle。
4. 给你的 Day 05 tiled\_gemm 跑一次 ncu,记录 SOL 卡片的 Compute % 和 Memory %,说出它是 compute-bound 还是 memory-bound,以及下一步应该往哪个方向优化。
5. 写一个三行的"profile 决策表":出现 X 现象 → 用 Y 工具 → 看 Z 指标。覆盖至少 5 种现象。

## 今日检查清单

8 ITEMS

- 能解释 nsys / ncu / py-spy / torch.profiler 四个工具各自的抽象层次和适用场景
- nsys 命令能成功跑通,生成 .nsys-rep 文件,会用 nsys stats 看摘要
- 能在代码里用 nvtx.range\_push/pop 标注训练阶段,timeline 上能看到对应彩色长条
- ncu 报告里能找到 GPU SOL、Memory Workload、Scheduler Statistics 三个 section
- py-spy record 能成功生成 SVG 火焰图,且包含 DataLoader worker 的栈
- torch.profiler 的 schedule(wait/warmup/active) + prof.step() 用法掌握
- TensorBoard 能打开 trace,在 Operator View 找到 top kernels
- 跑过完整的"四步体检流程",至少定位 1 个真实瓶颈并验证修复效果

## 推荐阅读

4 ITEMS

MUST READ

### PyTorch Profiler Recipes

官方教程系列,从基础 schedule 到 TensorBoard 集成、分布式 profiling 一应俱全。AI Infra 工程师必读。

OFFICIAL

### Nsight Systems User Guide

NVIDIA 官方文档,重点看 "Common Usage Scenarios" 和 "NCCL Trace" 两章。CLI 参数表是日常查询参考。

BLOG

### Horace He — Making Deep Learning Go Brrrr

PyTorch 团队的经典博客,把性能问题分类为 compute-bound、memory-bound、overhead-bound 三类,profiling 思路非常清晰。

VIDEO

### GTC: Profiling DL Workloads

NVIDIA GTC 历年关于 nsys/ncu 的实战演讲,搜 "Nsight Systems Deep Learning" 能找到大量实战案例。

## Day 07 预告

NEXT

COMING NEXT — WEEK 1 RECAP

### 周复盘 + 网络/存储基础

第一周 GPU 编程基础收官:复盘 Day 01–06 知识地图,补上 AI 集群的网络与存储基础——RDMA、NCCL 通信模型、NVLink vs PCIe vs InfiniBand 的带宽对比。为 Phase 1 进入框架内部机制做准备。

"Premature optimization is the root of all evil — but profiling is its only cure."

DAY 06 · AI INFRA 60-DAY ROADMAP
