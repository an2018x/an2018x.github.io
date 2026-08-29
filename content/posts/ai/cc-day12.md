---
title: "Day 12 · Memory 记忆系统 — 四种类型 · 生命周期 · 与 CLAUDE.md 的边界"
date: '2026-05-19'
draft: false
description: "把 Day 03 的 Memory 入门带到生产级——深入 user / feedback / project / reference 四种类型的写法标准，掌握 MEMORY.md 索引结构、读写时机、过期处理与跨系统协作。让 Claude 成为有长期记忆的同事，不再每次从零开始。"
toc: true
tags:
  - AI
  - Claude Code
  - Memory
  - Persistence
  - Tutorial
---

DAY 12 · CLAUDE CODE ROADMAP · 20 DAYS

# Memory_有记忆的同事_

Day 03 你认识了 Memory——今天把它推到_生产级_。 user / feedback / project / reference 四种类型各管一摊；MEMORY.md 是索引、单个文件是事实、 `[[name]]` 是链接。读写时机有讲究，过期清理有节奏。 Hook、Skill、Plan、Task 各有职责——Memory 只记录_非显然_、 会_长期有用_的事。

**DURATION** 75–90 min **THEORY** 30 min **HANDS-ON** 40 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 12 思维导图**
>
> - DAY 12 · Memory 记忆系统
> - TYPES · STORAGE · LIFECYCLE · BOUNDARY
> - 01 · TYPES
> - 4 种类型
> - 02 · STORAGE
> - 存储结构
> - 03 · LIFECYCLE
> - 读写时机
> - 04 · BOUNDARY
> - 与其他系统
> - user 角色背景
> - feedback 纠正
> - project 进行中
> - reference 外部指针
> - MEMORY.md 索引
> - 单文件 frontmatter
> - [[name]] 链接
> - 语义组织
> - 自动写入触发
> - 读取时机
> - 陈旧检测与验证
> - 忽略指令处理
> - vs CLAUDE.md
> - vs Skills 命令
> - vs Plan / Task
> - 不该存什么
> - 不是记得越多越好——是记得对才有用
> - /MEMORY
> - 4 TYPES
> - WHY · HOW
> - STALENESS

FIG M — DAY 12 KNOWLEDGE MAP · MEMORY PRODUCTION GUIDE

## 四种记忆类型

TAXONOMY

四种类型不是"标签"——它们对应_四种本质不同的信息_。 记错类型不只是分类乱，会导致 Claude 在错的时机用错的方式调用记忆。 下面是每种类型的 **定义、写法标准、典型示例和反例** 。

TYPE · USER

### 用户身份与背景

关于 **你是谁、做什么、知道什么** 的事实。让 Claude 把回答的深度、术语和类比调到适合你的层级。

✓ GOOD

user is a Go engineer with 10y exp, first time touching React — frame frontend concepts via backend analogues

✗ BAD

user 写了一个 React 组件（这是一次性活动，不是身份）

TYPE · FEEDBACK

### 用户对 Claude 行为的纠正或认可

" **不要 X / 要 Y**" 与 " **那次 X 是对的**" 都算。纠正与确认 **都要存** ——只存纠正会让 Claude 越来越保守。

✓ GOOD

集成测试必须连真实数据库,不用 mock。Why: 上季度 mock 测试通过但 prod 迁移挂了。How: 看到 test 文件不要写 vi.mock(db)

✗ BAD

不要用 var（这种是代码规范,应该写进 CLAUDE.md 而不是 memory）

TYPE · PROJECT

### 进行中的工作、决策与背景

从 git / 代码 **读不出来** 的状态信息——发布日期、停滞原因、stakeholder 决策。 **容易过期** ，要勤更新。日期一律存绝对值（"周四" → 2026-05-21）。

✓ GOOD

2026-03-05 起 mobile release branch 进入冻结期。Why: legal 要求。How: 非紧急 PR 推迟到下个 sprint

✗ BAD

今天修了 login bug（属于 git 历史可查的内容,不该存 memory）

TYPE · REFERENCE

### 外部系统的指针

" **X 信息在哪儿找**"。Linear 项目、Grafana dashboard、Notion 页面、Slack 频道。本身不存信息——只存 **位置** 。

✓ GOOD

pipeline bug 跟踪在 Linear 的 INGEST 项目;oncall 监控面板: grafana.internal/d/api-latency

✗ BAD

INGEST-1234 的详细状态是 in-review（具体内容会过期,只存项目位置即可）

### 写法铁律：feedback 与 project 必须带 Why + How

`feedback` 与 `project` 是 **最容易腐烂的两类** —— 没有上下文的规则未来无法判断是否还成立。统一写成三段式：

```
## 主体规则或事实
集成测试必须连真实数据库,不用 mock

**Why** : 2026-Q1 mock 测试通过但 prod 迁移挂了,
        造成 4 小时 outage(INC-2398)

**How to apply** : 看到 test 文件含 vi.mock('../db') 立刻警示;
        集成测试用 testcontainers 起真实 pg
```

未来 Claude 看到例外场景时,能据 Why 判断要不要破例

## 存储结构

FILE LAYOUT

Memory 存在 `~/.claude/projects/<project>/memory/`—— _不在_项目目录、_不进_ git。 结构是 **索引 + 事实文件 + 链接** 三层。

### 典型目录结构

```
# ~/.claude/projects/-Users-minimax-myproject/memory/
memory/
├── MEMORY.md # 索引(总览,加载到 context)
├── user_role.md # type=user
├── user_preferences.md # type=user
├── feedback_testing.md # type=feedback
├── feedback_pr_size.md # type=feedback
├── project_q2_freeze.md # type=project
├── project_auth_rewrite.md # type=project
├── reference_oncall.md # type=reference
└── reference_linear.md # type=reference
```

### 单个 memory 文件结构

```
# feedback_testing.md
---
name: feedback-testing
description: 集成测试必须连真实数据库,不允许 mock —— 决策点关键
metadata:
  type: feedback
---

集成测试必须连真实数据库,不用 mock。

**Why** : 2026-Q1 mock 测试通过但 prod 迁移挂了,造成 4 小时 outage(INC-2398)。
        Mock 与真实 schema 漂移过大,无法及时发现。

**How to apply** : 看到 vi.mock('../db') / jest.mock('@/db')
        立刻警示;集成测试统一用 testcontainers 起真实 pg。

相关:[[project-migration-strategy]]、[[reference-incident-db]]
```

### MEMORY.md 索引规则

```
# MEMORY.md 是索引,不是内容容器
# 永远只放一行一条 — 单行 <150 字符
# 不带 frontmatter

## User
- [Role](user_role.md) — Go 10y / 新手 React / 偏好后端类比
- [Preferences](user_preferences.md) — 终端用 ghostty / 编辑器用 vscode

## Feedback
- [Testing](feedback_testing.md) — 集成测试不用 mock(INC-2398)
- [PR Size](feedback_pr_size.md) — 重构 PR 偏好单个 bundled 而非多个小 PR

## Project
- [Q2 Freeze](project_q2_freeze.md) — 2026-03-05 起 mobile release 冻结
- [Auth Rewrite](project_auth_rewrite.md) — 合规驱动 / 不是技术债

## Reference
- [Oncall](reference_oncall.md) — grafana.internal/d/api-latency
- [Linear](reference_linear.md) — pipeline bug 在 INGEST 项目
```

MEMORY.md 200 行后会被截断 — 一定要简洁

### [[name]] 链接机制

> **图：Memory 链接图**
>
> - FEEDBACK
> - feedback-testing
> - 不 mock 数据库
> - PROJECT
> - migration-strategy
> - 迁移分阶段
> - REFERENCE
> - incident-db
> - INC-2398 详情
> - 未写入
> - testcontainers-tips
> - TODO: 占位链接
> - [[migration-strategy]]
> - [[incident-db]]
> - [[testcontainers-tips]] · TODO

FIG 02 · [[NAME]] LINKS — 实链 + TODO 占位链 串成知识网

RULE · 01

### 链接用 slug,不用路径

`[[feedback-testing]]` 而不是 `[[feedback_testing.md]]`。slug 来自 frontmatter 的 `name:` 字段。

RULE · 02

### TODO 链接允许

链到一个还没写的 memory 是 **合法** 的——它标记了"未来值得记录的话题"。比格式错误更有价值。

RULE · 03

### 按主题组织,不按时间

不要 `2026-05-19-notes.md` 这类时间命名——按主题语义命名（`testing`、`deployment`）才便于检索。

RULE · 04

### frontmatter 与内容同步

修改了 memory 主体时,记得更新 `description`——它决定未来 Claude 怎么判断这条记忆是否相关。

## 读写时机与生命周期

LIFECYCLE

记忆系统的难度不在_怎么写_——而在_何时写、何时读、何时不用_。 下面是一套实战可用的判断标准。

### 何时该自动写入

WRITE · IF

### ✓ 用户主动告知身份/偏好

"我是 Go 工程师"、"我喜欢简洁回答"——这是 user 类型的金矿。

WRITE · IF

### ✓ 用户纠正了 Claude

"不要那么做"、"用 X 不要 Y"——立即记成 feedback,附 Why。

WRITE · IF

### ✓ 用户认可了非显然的选择

"对,这样写是对的"——这是 confirmation,和纠正一样重要。

WRITE · IF

### ✓ 学到外部资源位置

"看 Linear 的 INGEST"、"Grafana board 在 X"——存 reference。

### 何时_不该_写入

SKIP · 01

### ✗ 代码模式、架构、文件路径

这些读代码更准——存了 memory 反而会因代码改了而过期。

SKIP · 02

### ✗ git 历史可查的信息

谁改了什么、什么时候——`git log` 永远是真理源。

SKIP · 03

### ✗ 当前对话的临时上下文

"我正在调试 X"是当下状态,不是长期记忆——用 Plan/Task 即可。

SKIP · 04

### ✗ CLAUDE.md 里已经有的内容

项目规范已在 CLAUDE.md——再存 memory 是冗余,反而难维护。

### 读取与陈旧检测

> **图：Memory 读取流程**
>
> - STEP · 01
> - 检索相关 memory
> - 用 description 匹配
> - STEP · 02
> - 验证陈旧性
> - 代码还在吗?
> - STEP · 03
> - 应用 Why+How
> - 判断是否例外
> - STEP · 04
> - 行动 / 更新 / 删除
> - 陈旧则修正
> - STALE → REWRITE OR DELETE
> - 每次读取都是一次验证机会 — 信现在,不是信过去

FIG 03 · READ FLOW — RETRIEVE · VERIFY · APPLY · UPDATE

### 陈旧处理三档

FRESH

### 仍然有效

memory 描述的事实在代码 / 仓库 / 外部系统中仍能验证——直接用。

PARTIAL

### 部分过期

主要规则仍成立,但细节漂移了——用 Edit 修正后继续用,保留 Why。

DEAD

### 完全失效

事实已不存在（项目结束、人员调动、文件删除）——直接删除文件并清理 MEMORY.md 引用。

### "忽略 memory" 指令处理

```
# 用户说: "这次先不用 memory" / "暂时忽略你记住的内容"

行为约定:
- ✗ 不要应用任何 memory 中的事实
- ✗ 不要在回答中引用或对比 memory
- ✓ 当前对话视为"零记忆"状态
- ✓ 仍可以读 memory 文件作为研究,但不作为约束

为什么需要:
- 用户在做 prototype / spike,不希望被既有约束限制
- 调试时怀疑 memory 是错误信息源
- 想体验"清洁状态"下 Claude 的表现
```

## 与其他系统的边界

SYSTEM BOUNDARY

Memory 不孤立——它和 CLAUDE.md、Skills、Plan、Task 都涉及"持久化"。 划清边界是 Memory 用对的前提：选错系统比不存还糟。

### 五个持久化系统的对比

| 系统 | 保存什么 | 生命期 | 共享范围 |
| --- | --- | --- | --- |
| CLAUDE.md | 团队级项目规范、技术约定 | 项目存活期 | 团队（git 提交） |
| Memory | 个人偏好、对 Claude 的反馈、项目背景 | 跨会话长期 | 仅自己（不进 git） |
| Skills | 可复用的命令 / 工作流 | 长期 | 个人或团队（按位置） |
| Plan | 当前任务的实施方案 | 单次任务 | 会话内 |
| Task / TodoWrite | 当前会话内的步骤拆解 | 会话内 | 会话内 |

### 决策树：信息该存哪儿？

> **图：决策树**
>
> - START
> - 这条信息要保留下来吗?
> - 活过这次会话吗?
> - 否
> - TASK / PLAN
> - 会话内步骤
> - 团队都需要遵守吗?
> - 是
> - CLAUDE.MD
> - git 共享规范
> - 是可执行的工作流吗?
> - SKILL
> - 封装成 /command
> - → MEMORY

FIG 04 · DECISION TREE — WHERE DOES THIS BELONG?

### 边界判断三句话

RULE · A

### 团队规范 → CLAUDE.md

所有人都该遵守的约定。Git 共享、Code Review 把关。

RULE · B

### 个人偏好 / 反馈 → Memory

只关于你与 Claude 的协作方式。不影响别人。

RULE · C

### 可执行流程 → Skill

哪怕只你一个人用——封装成 /命令 比每次写指令省事。

## 操作与维护

OPERATIONS

Memory 不维护就会腐烂——MEMORY.md 越长、重复越多、过期条目越多， 读它的 Claude 行为就越混乱。 下面是维护 Memory 的日常操作与定期保养。

### 核心命令

| 命令 | 作用 | 使用频率 |
| --- | --- | --- |
| /memory | 查看 MEMORY.md 索引 + 所有 memory 文件清单 | 每次开始新任务前 |
| /memory edit \<name\> | 用编辑器打开指定 memory 文件 | 需要修正陈旧条目时 |
| /memory rm \<name\> | 删除指定 memory 文件 + 清理 MEMORY.md 引用 | 项目结束 / 决策推翻时 |
| 记住:... | 自然语言要求 Claude 保存某事 | 对话中随时 |
| 忘掉关于 X 的内容 | 自然语言要求 Claude 删除相关条目 | 对话中随时 |
| 这次先忽略 memory | 本轮对话不应用任何已存记忆 | spike / prototype 模式 |

### 定期保养清单

WEEKLY · 5 MIN

### 查看 MEMORY.md 行数

用 `wc -l MEMORY.md`——超过 100 行就要考虑合并 / 删除冗余条目。索引太长 Claude 会读不全。

WEEKLY · 5 MIN

### 清理 project 类

project 类型最容易腐烂——deadline 过了、决策推翻了、人员变了。每周 grep `type: project` 走一遍。

MONTHLY · 10 MIN

### 验证 reference 链接

外部 URL 会失效、Linear 项目会改名——每月点一遍 reference 类的链接,挂掉的就修。

QUARTERLY · 20 MIN

### 对照 CLAUDE.md 去重

季度回顾：把已经写进 CLAUDE.md 的规范从 Memory 里删掉。规则的家应该是 CLAUDE.md,memory 只补充未规范化的偏好。

### 反模式预警

❌ ANTI · 01

### 把 memory 当日记

"今天做了 X / Y / Z"——memory 不是 changelog,这种内容只会越积越多。日志该写 git commit。

❌ ANTI · 02

### 同一信息存多份

memory 里有"用 Vitest"、CLAUDE.md 里也有"用 Vitest"——双份维护负担。规则只该有一个家。

❌ ANTI · 03

### memory 当作 prompt 模板

把可复用流程写进 memory——它会在每次对话被读取,占 context。这种用法应该是 Skill。

❌ ANTI · 04

### 纠正不写 Why

只存"不要 X"——未来 Claude 看到边缘场景不知道能不能破例。永远附 Why + How to apply。

## Labs

4 HANDS-ON

四个递进的动手实验——从写一条标准 memory 到完成季度保养。 预计 40 分钟，全部在你日常使用的项目里完成。

LAB · 01 · 8 MIN

### 写一条标准 feedback memory

选一个你最近纠正过 Claude 的场景——告诉 Claude "记住" 并写成标准三段式（主规则 + Why + How to apply）。用 `/memory` 检查文件内容,确认 frontmatter 与 MEMORY.md 索引都正确。

目标：掌握 feedback 类型的写法标准

LAB · 02 · 10 MIN

### 构建 user 与 reference 各一条

明确告诉 Claude 你的角色（user）和一个外部信息位置（reference,如 Linear/Notion/Grafana 链接）。再让 Claude 在下一次回答时 **主动用到** 这两条 memory——观察 description 写法对触发概率的影响。

目标：体会 description 决定记忆"被用到"的几率

LAB · 03 · 12 MIN

### 陈旧检测与重写

故意在 memory 里写一条"已过期"信息（比如"v2.0 计划 2025-12-31 发布"——日期已过）。开新会话让 Claude 引用这条 memory,观察它如何验证陈旧 + 自动修正 / 删除。

目标：理解读取时的验证 + 重写流程

LAB · 04 · 10 MIN

### 季度保养实战

对当前项目的 memory 做一次完整保养：(1) `wc -l MEMORY.md` 看长度;(2) 找出 3 条最老的 memory 验证陈旧性;(3) 把 1-2 条规则从 memory 迁到 CLAUDE.md;(4) 删掉所有空 TODO 链接。

目标：把"维护节奏"变成肌肉记忆

## 常见问题

6 FAQS

### Q · 01 · Memory 和 CLAUDE.md 的边界到底怎么划？

A ·

一句话区分： **团队都该遵守的规范进 CLAUDE.md；只跟你这一个人/这个项目阶段相关的进 Memory。**

典型案例：项目" **所有 API 用 zod 校验**"——团队公约,进 CLAUDE.md。" **你不喜欢 Claude 主动加 try/catch**"——个人偏好,进 Memory。" **2026-Q2 mobile release 冻结期**"——项目阶段性事实,进 Memory 的 project 类。

判断不出来时,问一句" **团队新人 clone 仓库后是否需要立刻知道这件事**"——需要就 CLAUDE.md,不需要就 Memory。

### Q · 02 · 为什么 Memory 不进 git？团队不该共享纠正反馈吗？

A ·

Memory 是 **"我和 Claude"的私人笔记** ——里面有大量"我习惯这样"、"我不喜欢那样"的个人偏好。强行共享会出现两个问题：(1) 不同人的偏好打架,Claude 不知道听谁的；(2) 这些偏好对别人没用、还占别人的 context。

团队级共享的规范有更合适的家： **CLAUDE.md 共享规则；Skills 共享流程；Hooks 共享强制策略** 。Memory 留给真正属于个人的部分。

### Q · 03 · MEMORY.md 越长 Claude 加载越慢吗？

A ·

不是慢的问题——是 **读不全** 。MEMORY.md 在每次会话启动时被加载进 system context,超过约 200 行后 **后面的会被截断** 。截断的部分等于 Claude 永远不知道它存在。

所以铁律是：每条索引 **单行 \<150 字符** ,内容放在被链接的文件里、用 description 字段提示要不要打开。索引就是索引,不要把内容塞进去。

### Q · 04 · Claude 自动写的 memory 经常不准——怎么办？

A ·

三个层面解决：(1) 在 **CLAUDE.md 里加一条 meta 规则** ——"写 memory 必须用三段式（规则+Why+How）",触发严格写法；(2) 每次说" **记住**"时 **明确指定类型** ——"记成 feedback,Why 是 X";(3) 定期做 Lab 04 的季度保养,把 Claude 写错的及时修正。

另一个杀手锏： **用具体场景纠正反而比抽象指令有效** 。比如发现 Claude 把"今天修了 login bug"存成 memory——立刻指出"这种属于 git 历史,不该进 memory",一次纠正能管很久。

### Q · 05 · 不同项目能共享 user 类 memory 吗？

A ·

Memory 默认按项目隔离——一个项目 dir 对应一个 memory 目录。但 user 类（你的角色、终极偏好）确实跨项目通用。

两种处理方式：(1) **放到 `~/.claude/CLAUDE.md` 全局指令文件** ——这是 Claude Code 唯一支持"跨项目偏好"的官方位置；(2) **软链 user\_\*.md** ——在多个项目 memory 目录里 `ln -s ~/.claude/global/user_role.md user_role.md`。方式 1 简单可靠,方式 2 灵活但易碎。优先用方式 1。

### Q · 06 · Memory 会让 Claude 产生"AI 偏见"吗？

A ·

会——特别是只存纠正、不存确认时。Claude 看到一堆"不要 X / 不要 Y / 不要 Z"会变得越来越保守,什么都不敢做。

解决方案： **纠正与确认成对存** ——每次发现 Claude 做对了"非显然的选择"（一次性 bundled PR 而不是拆 5 个、一次性大重构而不是小修小补）,也明确告诉它" **对,这种场景就该这么做**",存成 feedback。这条 memory 会成为未来 Claude 的"defensible action"——它有底气重复正确选择,而不是事事请示。

## 复习题

5 QUESTIONS

1. 请说出 user / feedback / project / reference 四种类型各自保存什么——并各举一个 good 与 bad 示例。
2. `feedback` 与 `project` 类必须包含 **Why** 和 **How to apply** ——为什么不能只写主规则？
3. MEMORY.md 是什么？为什么不能把 memory 内容直接写进 MEMORY.md？
4. 给定一条信息,如何判断它该进 CLAUDE.md / Memory / Skill / Plan / Task 中的哪个？请描述判断流程。
5. Memory 的"陈旧检测"分三档——FRESH / PARTIAL / DEAD,请说出各自的处理动作。

## 自检清单

8 ITEMS

- 能说出 user / feedback / project / reference 四种类型的定义与典型示例
- 写 feedback / project 类时能自然带上 **Why** 与 **How to apply** 两段
- 理解 MEMORY.md 作为索引、单文件作为事实、`[[name]]` 作为链接的三层结构
- 能列出"何时该写 / 何时不该写"各 4 条标准
- 掌握读取 → 验证 → 应用 → 更新四步生命周期,知道如何处理陈旧记忆
- 能用决策树正确把信息分配到 CLAUDE.md / Memory / Skill / Plan / Task
- 会用 `/memory` / `/memory edit` / `/memory rm` 维护记忆
- 建立了"weekly / monthly / quarterly"三档保养节奏

## 延伸阅读

3 LINKS

DOCS

### Claude Code — Memory Reference

官方 Memory 完整文档：四种类型定义、frontmatter 字段、MEMORY.md 索引规则、读写时机最佳实践。

GUIDE

### CLAUDE.md 写作指南

Day 03 对应的延伸阅读：CLAUDE.md 三层叠加、与 Memory 的边界、init 命令生成模板。

PATTERN

### Long-term context patterns

社区总结的长期记忆模式集合：feedback 三段式、project 时序管理、reference URL 失效检测。

## Day 13 预告

NEXT

COMING NEXT

### MCP 服务器 — 让 Claude 操作外部世界

今天让 Claude 记住_你_——明天教它_动手_。 MCP（Model Context Protocol）打通 Claude 与外部系统：直接查 Postgres、读 GitHub PR、发 Slack 消息、看 Grafana 监控。 `.claude/.mcp.json` 一句配置，所有公司内的工具都成为 Claude 的"延伸"。

"Memory is the diary that we all carry about with us."

DAY 12 · CLAUDE CODE 20-DAY ROADMAP · OSCAR WILDE
