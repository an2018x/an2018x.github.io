---
title: "Day 08 · 大型代码库 — 多文件重构 · 代码迁移 · 架构重组"
date: '2026-05-16'
draft: false
description: "跨越单文件的边界——学会让 Claude Code 在大型代码库中定位代码、批量重构、执行语言迁移、拆分巨型模块。掌握 Agent 子任务分发和 Worktree 隔离，精准控制上万行的变更。"
toc: true
tags:
  - AI
  - Claude Code
  - Tooling
  - Tutorial
---

DAY 08 · CLAUDE CODE ROADMAP · 20 DAYS

# 在大型代码库中_精准操控_

前七天你在单文件或小项目中游刃有余——今天进入_深水区_。 当一个函数被 200 个文件引用、当整个项目要从 JavaScript 迁移到 TypeScript、 当一个 3000 行的巨型模块必须拆分为六个独立包——你需要一套完全不同的策略。 掌握 Agent 子任务分发、Worktree 隔离和分阶段迁移术， 让 Claude Code 在十万行级代码库中保持外科手术般的精度。

**DURATION** 70–80 min **THEORY** 30 min **HANDS-ON** 35 min **REVIEW** 10 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 08 思维导图**
>
> - DAY 08 · 大型代码库
> - SEARCH · REFACTOR · MIGRATE · RESTRUCTURE
> - 01 · SEARCH
> - 搜索与导航
> - 02 · REFACTOR
> - 多文件重构
> - 03 · MIGRATE
> - 代码迁移
> - 04 · AGENT
> - 子任务分发
> - grep -r / ripgrep
> - Glob / find 文件发现
> - Explore Agent 探索
> - CLAUDE.md 知识地图
> - Edit replace\_all
> - 跨文件重命名
> - 接口签名变更
> - TodoWrite 进度追踪
> - JS → TypeScript
> - 分阶段迁移策略
> - Worktree 隔离
> - 架构拆分模式
> - Explore / Plan 模式
> - 并行 Agent 分发
> - Worktree 隔离执行
> - 上下文保护策略
> - 从单文件到整个仓库——策略 × 工具 × 子任务编排
> - GREP + GLOB
> - EDIT + BASH
> - WORKTREE
> - AGENT

FIG M — DAY 08 KNOWLEDGE MAP · LARGE CODEBASE OPERATIONS

## 搜索与导航

4 TOOLS

在大型代码库中，找到目标比修改它更难。Claude Code 提供四层搜索策略，从精确匹配到语义理解逐层递进。

| 搜索工具 | 适用场景 | 用法示例 | 特点 |
| --- | --- | --- | --- |
| Bash grep | 精确字符串 / 正则匹配 | `grep -rn "getUserData" src/` | 最快、最可控、支持 --include 过滤 |
| Bash find | 按文件名 / 修改时间定位 | `find src/ -name "*.tsx" -newer tsconfig.json` | 擅长发现文件，不读内容 |
| Glob | 按路径模式批量发现文件 | `**/*.test.ts` | 结果上限 100 条，尊重 .gitignore |
| Explore Agent | 语义级搜索 + 跨文件理解 | 「找到所有调用了支付模块的入口点」 | 独立上下文窗口，自主组合多种工具 |

四种工具互补而非互斥——grep 用于确定性定位，Explore Agent 用于模糊意图探索

### 搜索分层策略

> **图：搜索分层示意图**
>
> - LAYER 1
> - grep / ripgrep
> - LAYER 2
> - find + Glob
> - LAYER 3
> - Read 深度阅读
> - LAYER 4
> - Explore Agent
> - 精确匹配
> - 文件发现
> - 上下文理解
> - 语义探索
> - FAST
> - SMART

FIG 01 — SEARCH LAYERING · FAST → SMART ESCALATION

### CLAUDE.md 作为代码库地图

在大型项目中，CLAUDE.md 不仅是配置文件——它是 **代码库地图** 。 在其中描述项目的目录结构、核心模块职责和模块间依赖关系，Claude 就能跳过漫长的探索阶段，直接定位目标。

```
# CLAUDE.md — 大型项目的架构速写

## Architecture
src/core/ — 核心业务逻辑（纯函数，无副作用）
src/adapters/ — 外部服务适配层（DB、API、MQ）
src/handlers/ — HTTP/gRPC 请求处理
src/shared/ — 跨模块共享类型和工具函数

## Key Patterns
- 所有数据库操作必须通过 src/adapters/db/ 中的 Repository
- Handler 不直接导入 core，通过 src/services/ 中转
- 共享类型定义在 src/shared/types/，禁止循环引用
```

将架构知识固化在 CLAUDE.md 中——每次对话都自动加载，省去反复解释

## 多文件重构

3 PATTERNS

重命名一个被 200 个文件引用的函数——Claude Code 的 Edit 工具和 Bash 脚本协同完成这种精密的跨文件手术。

### 重构工作流

> **图：重构工作流**
>
> - STEP 1
> - 定位范围
> - grep 统计影响面
> - STEP 2
> - 制定计划
> - TodoWrite 分解任务
> - STEP 3
> - 批量执行
> - Edit + replace\_all
> - STEP 4
> - 验证确认
> - grep 零残留 + 测试

FIG 02 — REFACTORING WORKFLOW · LOCATE → PLAN → EXECUTE → VERIFY

### 实战：跨文件重命名

场景：将 `getUserData` 重命名为 `fetchUserProfile`，该函数被 87 个文件引用。

```
# Step 1 — 定位范围：有多少文件受影响？
$ grep -rn "getUserData" src/ --include="*.ts" | wc -l
143 # 143 处引用，分布在 87 个文件中

$ grep -rl "getUserData" src/ --include="*.ts" | wc -l
87 # 确认 87 个文件

# Step 2 — 分类：定义处 vs 引用处
$ grep -rn "export.*getUserData\|function getUserData" src/
src/services/user.ts:42: export async function getUserData(id: string)
src/services/user.ts:89: export function getUserData.cached(...)
```

对 Claude 下达精确指令：

```
# 给 Claude 的 Prompt
把 getUserData 重命名为 fetchUserProfile。
规则：
1. 先修改 src/services/user.ts 中的定义和导出
2. 然后修改所有 import 语句
3. 最后修改所有调用处
4. 每修改一个文件后用 grep 确认该文件无残留
5. 全部完成后运行 npm run typecheck 确认零错误
```

关键技巧：给 Claude 明确的执行顺序（定义→导入→调用），避免中间状态的类型错误

### 三种重构模式

PATTERN A

### 简单重命名

函数 / 变量 / 类名的全局替换。使用 Edit 的 `replace_all: true` 逐文件替换，配合 grep 验证。

PATTERN B

### 签名变更

修改函数参数或返回类型。需逐个调用点分析上下文，不能简单的全局替换——让 Claude 逐文件 Read → Edit。

PATTERN C

### 结构性重构

拆分模块、合并文件、重组目录。涉及 import 路径更新、barrel export 调整——最适合 Agent 子任务分发。

## 代码迁移

STRATEGIES

从 JavaScript 到 TypeScript、从 REST 到 gRPC、从 Class 组件到 Hooks——大规模迁移需要分阶段执行，用 Worktree 隔离风险。

### 迁移策略对比

| 策略 | 方式 | 适用场景 | 风险 |
| --- | --- | --- | --- |
| 全量迁移 | 一次性转换所有文件 | 小项目（\<50 文件）、类型安全的改名 | 高 — 一次提交巨量变更，难以回滚 |
| 增量迁移 | 按模块 / 目录分批转换 | 中大型项目、允许新旧共存的语言迁移 | 中 — 需要维护边界兼容层 |
| Strangler 模式 | 新代码用新方式、旧代码逐步替换 | 正在运行的生产系统、框架迁移 | 低 — 渐进替换，随时可停 |

### 实战：JS → TypeScript 增量迁移

```
# Phase 1 — 基础设施（在 Worktree 中隔离）
$ claude --worktree ts-migration

# 在隔离环境中初始化 TypeScript 配置
claude> 为这个 JS 项目添加 TypeScript 支持：
        1. 创建 tsconfig.json，设置 allowJs: true
        2. 安装 typescript 和 @types/node
        3. 先不转换任何文件，确保 tsc --noEmit 通过

# Phase 2 — 类型定义
claude> 在 src/types/ 下创建共享类型定义文件：
        - User, Product, Order 等核心实体类型
        - API 请求和响应的类型
        从现有代码的 JSDoc 和运行时形状推断类型

# Phase 3 — 逐模块转换
claude> 把 src/utils/ 下所有 .js 文件转换为 .ts：
        - 添加类型注解
        - 保持导出签名不变
        - 每转换一个文件后运行 tsc --noEmit 确认
        - 如果有循环依赖，报告但不修改
```

Worktree 是大规模迁移的安全网——所有实验在隔离分支中进行，失败了直接丢弃

### Worktree 隔离机制

WORKTREE 创建

### 独立工作目录

`claude --worktree migration` 在 `.claude/worktrees/` 下创建独立副本， 基于 `origin/HEAD` 创建新分支。所有修改不影响主工作目录，可以放心实验。

WORKTREE 清理

### 自动回收机制

如果 Worktree 中没有任何变更，退出时自动清理。有变更时会提示你保留或删除。 用 `.worktreeinclude` 可以把 `.env` 等 .gitignore 文件复制到新 Worktree 中。

## 架构重组

PATTERNS

把一个 3000 行的 utils.ts 拆成六个聚焦模块、把单体应用拆分为分层架构——这类手术需要 Plan 模式先规划，再精确执行。

### Plan 模式：先规划再动手

对于架构级变更，永远先进入 Plan 模式（`Shift+Tab` 两次）。 让 Claude 分析代码库结构、识别模块边界、发现隐藏的依赖关系，然后输出一份可审核的执行计划—— **你审批后再执行** 。

```
# 典型的架构重组 Prompt
claude> 分析 src/utils.ts（3200 行），提出拆分方案：
        1. 识别内聚的函数组（按用途分类）
        2. 分析函数间的调用关系（哪些必须同组）
        3. 输出拆分方案：每个新模块的文件名、包含的函数、预计行数
        4. 列出所有需要更新 import 的文件
        先给我方案，不要执行
```

### 模块拆分流程

> **图：模块拆分流程**
>
> - BEFORE
> - utils.ts
> - 3,200 LINES
> - 字符串处理 × 12 fn
> - 日期格式化 × 8 fn
> - 数据校验 × 15 fn
> - HTTP 工具 × 6 fn
> - ...更多
> - string-utils.ts
> - 12 functions · 280 lines
> - date-utils.ts
> - 8 functions · 190 lines
> - validation.ts
> - 15 functions · 420 lines
> - ...更多模块
> - utils/index.ts
> - Barrel export · 零破坏性变更

FIG 04 — MODULE SPLITTING · MONOLITH → FOCUSED MODULES + BARREL EXPORT

```
// utils/index.ts — Barrel export 保持向后兼容
export * from './string-utils';
export * from './date-utils';
export * from './validation';
export * from './http-helpers';
export * from './crypto';
export * from './file-io';

// 所有原有的 import { xxx } from './utils' 无需修改
```

Barrel export 是拆分模块的安全阀——先拆内部结构，保持外部接口不变，之后再逐步更新 import 路径

## Agent 子任务分发

3 TYPES

当一个任务太大、太复杂，一个上下文窗口装不下时——把它拆成子任务，分发给专业的 Agent 并行执行。

### Agent 类型

| Agent 类型 | 职责 | 工具限制 | 典型用法 |
| --- | --- | --- | --- |
| Explore | 只读搜索、定位代码、回答结构性问题 | 无 Edit / Write / Agent | 「找到所有使用 Redis 的文件和调用模式」 |
| Plan | 分析需求、设计实现方案、识别关键文件 | 无 Edit / Write | 「为这次重构设计分步执行计划」 |
| general-purpose | 完整能力——搜索、编辑、执行、测试 | 全部工具可用 | 「把 src/auth/ 模块迁移到 TypeScript」 |

Explore 最适合大型代码库探索——它有独立上下文窗口，不会污染你的主对话

### 并行 Agent 编排

Claude Code 可以在 **一次回复中同时分发多个 Agent** 。 配合 `isolation: "worktree"`，每个 Agent 在独立的 Git Worktree 中工作，彼此不会产生文件冲突。

> **图：并行 Agent 分发**
>
> - MAIN CONTEXT
> - Claude Code 主会话
> - PARALLEL DISPATCH
> - AGENT 1 · WORKTREE
> - 迁移 auth 模块
> - src/auth/\*.js → \*.ts
> - 独立 git branch
> - AGENT 2 · WORKTREE
> - 迁移 payment 模块
> - src/payment/\*.js → \*.ts
> - 独立 git branch · 与 Agent 1 无冲突
> - AGENT 3 · EXPLORE
> - 分析共享依赖
> - 找出跨模块引用
> - 只读，不修改文件
> - MERGE · VERIFY · COMMIT

FIG 05 — PARALLEL AGENT DISPATCH WITH WORKTREE ISOLATION

### 上下文保护策略

PROBLEM

### 上下文窗口溢出

在大型代码库中，Read 几十个文件就会耗尽上下文窗口。Grep 结果过多同样会把有价值的早期对话挤出窗口。

SOLUTION

### 分层分发

探索性搜索交给 Explore Agent（独立窗口），编辑任务交给 Worktree Agent（独立分支）， 主会话只负责_决策和协调_。 用 `/compact` 定期压缩主上下文，保留关键结论。

核心原则：主会话是指挥部——做决策、发指令、审结果；Agent 是执行团队——做搜索、写代码、跑测试

## Labs

4 EXERCISES

LAB 01 · 代码库探索

### 绘制代码地图

克隆一个你没接触过的开源项目（推荐 \>500 文件）。 用 `find . -name "*.ts" | head -30`、`grep -r "export class" src/`、 Explore Agent 三种方式探索其架构。写出一段 50 字的 CLAUDE.md 架构摘要。

LAB 02 · 跨文件重命名

### 批量重命名函数

在你的项目中选一个被 ≥10 个文件引用的函数，让 Claude 执行完整的重命名流程： 定位 → 计划 → 逐文件修改 → grep 验证零残留 → 类型检查通过。

LAB 03 · 模块拆分

### 拆分巨型文件

找到项目中最大的工具文件（\>300 行）。让 Claude 先进入 Plan 模式分析内聚函数组， 给出拆分方案后再执行：创建子模块 + barrel export + 更新所有 import。

LAB 04 · 迁移实战

### JS → TS 迁移一个目录

选择项目中一个纯 JS 目录（5-10 个文件）。使用 Worktree 隔离，让 Claude 分三阶段迁移： tsconfig → 类型定义 → 逐文件转换。每阶段验证 `tsc --noEmit` 通过。

## 常见问题

5 Q&A

### Q1 · 重命名后 grep 还有残留怎么办？

A

首先确认残留是否在 **注释、字符串常量或测试固件** 中——这些可能不应被替换。用 `grep -rn "oldName" src/ --include="*.ts"` 查看每处残留的上下文。如果确实应替换，让 Claude 逐个处理（注释中的可能只需更新描述，字符串中的可能是 API 字段名不应改）。

### Q2 · 代码库太大，Claude 读不完所有文件怎么办？

A

不需要读完——这正是 **分层搜索** 的价值。用 grep 做精确定位，只 Read 真正需要修改的文件。把架构知识写进 CLAUDE.md 让 Claude 无需探索就能理解项目结构。对于探索性任务，交给 Explore Agent——它有独立的上下文窗口，不会挤占你的主对话空间。

### Q3 · 多个 Agent 同时修改文件会冲突吗？

A

使用 `isolation: "worktree"` 就不会。每个 Agent 在独立的 Git Worktree 中工作，有自己的文件副本和分支。完成后通过 Git merge 合并结果。关键是 **任务划分时避免两个 Agent 修改同一个文件** ——按模块或目录划分是最安全的策略。

### Q4 · 增量迁移时新旧代码如何共存？

A

以 JS→TS 迁移为例：在 `tsconfig.json` 中设置 `allowJs: true`，TS 和 JS 文件可以互相导入。已迁移的模块获得类型安全，未迁移的继续正常运行。通过 **barrel export** 保持对外接口不变。这就是 Strangler 模式——新代码逐步替代旧代码，而不是一夜之间切换。

### Q5 · Explore Agent 和直接用 grep 有什么区别？

A

grep 是 **确定性工具** ——你给它一个精确的模式，它返回所有匹配行。Explore Agent 是 **智能代理** ——你给它一个模糊意图（「找到所有涉及用户权限的代码路径」），它会自主组合 grep、find、Read 等工具，跨文件追踪调用链，最终给你一份结构化的分析报告。当你明确知道要搜什么，用 grep；当你需要理解代码如何协作，用 Explore。

## 复习题

5 QUESTIONS

1. 在大型代码库中，搜索分层策略的四个层次是什么？各自的适用场景？
2. 使用 Edit 工具进行跨文件重命名时，`replace_all: true` 参数的作用是什么？有什么限制？
3. 增量迁移和 Strangler 模式的核心区别是什么？各自在什么场景下优先选择？
4. Worktree 隔离解决了 Agent 并行执行中的什么问题？无 Worktree 的 Agent 会有什么风险？
5. 为什么架构重组应该先进入 Plan 模式？直接让 Claude 执行拆分会有什么潜在问题？

## 自检清单

7 ITEMS

- 能使用 grep / find / Glob 三种方式在大型代码库中定位目标代码
- 能用 Explore Agent 对陌生代码库进行语义级探索
- 能执行跨文件重命名的完整流程：定位 → 计划 → 执行 → 验证
- 理解全量迁移、增量迁移、Strangler 模式的适用场景和权衡
- 能使用 Worktree 隔离大规模迁移的实验环境
- 能用 Plan 模式先规划架构重组方案再执行
- 理解 Agent 子任务分发的类型选择和上下文保护策略

## 延伸阅读

3 LINKS

DOCS

### Claude Code — Sub-agents

Agent 工具的完整参数文档：subagent\_type、isolation、parallel execution 用法。

PATTERN

### Strangler Fig Pattern

Martin Fowler 提出的经典迁移模式——新旧系统并行，逐步绞杀旧代码。

PRACTICE

### Git Worktree 深度指南

Git 官方文档：多 Worktree 并行开发的创建、管理和清理。

## Day 09 预告

NEXT

COMING NEXT

### 非交互模式 — Headless 执行 · CI/CD 集成 · 管道化

前八天你一直在终端里与 Claude 对话——明天你将学会让它在无人值守的环境中运行。用 Headless 模式在 CI Pipeline 中自动生成 PR 描述、在 GitHub Actions 中自动修复 lint 错误、在 cron 任务中定期审计代码。Claude Code 从此不仅是你的助手——它是 7×24 小时的自动化引擎。

"Any intelligent fool can make things bigger and more complex. It takes a touch of genius — and a lot of courage — to move in the opposite direction."

DAY 08 · CLAUDE CODE 20-DAY ROADMAP · E. F. SCHUMACHER
