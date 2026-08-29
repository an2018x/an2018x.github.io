---
title: "Day 14 · Agent 与子代理 — 并行调度 · 自定义 agents · Worktree 隔离"
date: '2026-05-22'
draft: false
description: "派分身去干活——把开放式探索、独立评审、批量重构交给 subagent 在隔离上下文里跑;用 .claude/agents/ 把团队的工种沉淀成可复用资产;用 Git worktree 让多个 agent 在不同分支上同时改文件不会打架。一个任务,几只手并行。"
toc: true
tags:
  - AI
  - Claude Code
  - Agent
  - Subagent
  - Worktree
  - Tutorial
---

DAY 14 · CLAUDE CODE ROADMAP · 20 DAYS

# 派_分身_去同时干几件事

一个主代理一次只能想一件事——上下文窗口是它的工作台,塞太满就开始忘前面发生过什么。 _子代理(subagent)_是给主代理装的几只手: 每只手有自己独立的工作台,各自完成一段任务,只把 **结论** 交回主代理。 今天我们拆开三层:`.claude/agents/` 怎么把团队的工种沉淀成可复用资产、 一次怎么派 N 个 subagent 并行干活、用 Git worktree 让它们改文件不会打架。

**DURATION** 80–95 min **THEORY** 30 min **HANDS-ON** 50 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 14 思维导图**
>
> - DAY 14 · Agent 与子代理
> - WHEN · AGENTS · PARALLEL · WORKTREE
> - 01 · WHEN
> - 何时派分身
> - 02 · AGENTS
> - 自定义子代理
> - 03 · PARALLEL
> - 并行调度
> - 04 · WORKTREE
> - Git 隔离
> - 开放式探索
> - 独立评审 / 第二意见
> - 保护主上下文
> - 已知路径就别派
> - .claude/agents/\*.md
> - name / description
> - tools 工具子集
> - 模型继承 / 覆盖
> - 一条消息派 N 个
> - foreground vs background
> - 上下文隔离 · 只回总结
> - prompt 必须自洽
> - git worktree add
> - isolation: "worktree"
> - EnterWorktree 切换
> - 多分支并行不冲突
> - 分而治之 · 上下文隔离 · 并行落地 · 主代理只看摘要
> - EXPLORE
> - .AGENTS/\*
> - N IN ONE MSG
> - WORKTREE

FIG M — DAY 14 KNOWLEDGE MAP · SUBAGENT ORCHESTRATION

## 何时派子代理 — 决策表

WHEN TO DELEGATE

子代理本质上是一个_独立上下文的 Claude 副本_。 派一只 subagent,你付的成本是:多一次 prompt 装填、多一次 round-trip、 你看不到它中间在想什么——只能拿到最后那份总结。 所以"该不该派"的标准很硬: **主代理做这件事会不会污染主上下文,或者顺序做太慢** 。

### 主代理 vs 子代理

| 维度 | 主代理 | 子代理 |
| --- | --- | --- |
| 上下文 | 与你共享 · 看得见全部对话 | 隔离的新会话 · 只看到 prompt |
| 能记住中间过程 | ✓ 全部 | ✗ 只把摘要交回主代理 |
| 能用的工具 | 所有 · 含 Agent 工具(可派子代理) | 该 agent 在 tools 里声明的子集 |
| 并发 | 串行 · 一次一个动作 | 并行 · 一条消息可派 N 个 |
| 与用户交互 | ✓ 直接对话 | ✗ 无法 AskUserQuestion |
| 代价 | 低 · 走当前会话 | 高 · prompt 装填 + token + 摘要漏失风险 |

### 该派 vs 不该派

该派 · 派对了省一倍时间

### 开放式探索 / 大批量读取

"权限验证逻辑都在哪儿?"——主代理读 30 个文件后,你也忘了一开始问的是什么。让 Explore agent 在隔离上下文里搜,只回一份"在这 7 个文件里,用的是 XX 中间件"。

该派 · 独立判断

### 第二意见 / 评审 / 审计

主代理刚写完一个迁移脚本,顺手让自己 review 容易自信过头。派一个 code-reviewer agent,它没看过你的实现过程,意见才独立。

该派 · 并行收敛

### 50 个文件批量改

同样的重命名要应用到 50 个文件——一条消息派 5 个 subagent,每个处理 10 个文件,5 倍速完成。每个 subagent 只回"我改完了哪 10 个"。

不该派

### 已知路径的精确操作

你已经知道要改 `src/auth/login.ts:42` 的 `getUser` 函数——主代理一个 Edit 就完事,派 subagent 反而多一层翻译损耗。

不该派

### 需要和用户来回确认

子代理无法 AskUserQuestion——如果任务过程中需要你做选择,主代理留下来更合适。

不该派

### 极小成本任务

读一个文件、搜一个字符串、跑一条命令——派 subagent 的装填开销比任务本身还大。直接 Read / Grep / Bash 即可。

### 内置子代理速览

| agent | 定位 | 典型派法 |
| --- | --- | --- |
| Explore | 只读搜索 · 找文件 / 找符号 / 跨文件追踪 | "权限验证都在哪?"——quick / medium / very thorough 三档广度 |
| Plan | 设计实现方案 · 列步骤 / 关键文件 / 权衡 | "我要在 X 加 Y 功能,出一个落地计划" |
| general-purpose | 多步任务兜底 · 当不知道用哪个时的默认 | "研究一下 …",可读可写 |
| claude-code-guide | Claude Code / SDK / API 自身的用法问题 | "怎么写一个 hook 来 …" |
| statusline-setup | 专做 status line 配置 | "帮我把状态栏改成显示 git 分支" |

原则:能匹配到内置 agent 的就用内置 · 不能匹配再写自定义 agent · 都不行就用 general-purpose

## 自定义子代理 — `.claude/agents/`

CUSTOM AGENTS

内置 agent 通用但泛——团队里反复出现的工种(代码评审、迁移脚本、文档抽取、安全审计) 值得沉淀成 **自定义 agent** :一个 Markdown 文件,描述清楚这个分身擅长什么、能用哪些工具、 它该怎么思考。下次任何人在项目里说"派 X 帮我看一下",Claude 就调起这个 agent。

### agent 文件结构

```
# 文件:.claude/agents/code-reviewer.md
# 项目级 · commit 到 git · 团队共享

---
name: code-reviewer
description: |
  Use proactively after the user finishes implementing a non-trivial change.
  Best for catching bugs, security issues, and design problems before commit.
  Skip for typo fixes, comment-only changes, and pure refactors.
model: opus
tools: [Read, Grep, Bash, Glob]
---

You are a senior code reviewer. The user has just finished a change and
wants an independent second opinion before they commit.

Review goals (in order):
1. Correctness — does the change do what it claims?
2. Security — any injection / auth / secret leakage / unsafe deserialization?
3. Resource leaks — file handles, connections, memory.
4. Edge cases — empty input, concurrent access, error paths.
5. Tests — are tests added? do they actually cover the new code path?

Use `git diff` to see what changed. Read surrounding context for each
modified function. Cross-check callers with `grep`.

Output format:
- 🔴 Critical (must fix before commit)
- 🟡 Should fix (high impact but not blocking)
- 🟢 Nit (style / readability)
Each item: file:line, what's wrong, suggested fix.
```

### frontmatter 字段

| 字段 | 必填 | 作用 |
| --- | --- | --- |
| name | ✓ | agent 标识 · kebab-case · 主代理用这个名字派 |
| description | ✓ | 主代理读这段决定该不该派 · 写得越具体派得越准 |
| tools | 建议 | 该 agent 能用的工具白名单 · 不写=继承主代理全部(过宽) |
| model | 可选 | opus / sonnet / haiku · 不写=继承父代理 · 复杂任务可单独升档 |

### 三层 agent 存放位置

> **图：agent 三层存放位置**
>
> - USER · 跨项目
> - ~/.claude/agents/
> - 个人通用工种
> - commit-reviewer / api-doc-writer
> - 私人 · 不进任何项目仓库
> - PROJECT · 团队共享
> - .claude/agents/
> - 项目专用工种
> - migration-runner / log-analyzer
> - commit 到 git · 全员可派
> - PLUGIN · 跨团队分发
> - plugin:\<name\>:\<agent\>
> - 通过插件包发布
> - understand-anything / paper-tone-diagram
> - 命名空间隔离 · 不冲突

FIG 02 · AGENT STORAGE TIERS — USER · PROJECT · PLUGIN

### 写 description 的诀窍 — 让主代理"懂得派"

```
# ✗ 模糊 — 主代理不知道什么时候该派
description: "代码评审 agent"

# ✓ 具体 — 主代理一看 description 就能判断匹配
description: |
  Use proactively after the user finishes implementing a non-trivial change.
  Best for catching bugs, security issues, and design problems before commit.
  Skip for typo fixes, comment-only changes, and pure refactors.

# ✓ 主动触发关键词 — 告诉主代理"什么场景务必派我"
description: |
  MUST USE when user runs `git commit` or asks for review of pending changes.
  Specifically tuned for backend Go services in this repo.
```

心法:description 不是文档,是 **派单系统的路由规则** — 写给主代理看,不是写给人看

### tools 字段:给分身的"工具包"

```
# 一个只读的搜索 agent — 不给写权限是基本安全
tools: [Read, Grep, Glob, Bash] # Bash 通常允许只读命令

# 一个评审 agent — 给读 + 跑测试,不给改
tools: [Read, Grep, Glob, Bash] # 评审不需要 Edit/Write

# 一个迁移 agent — 给改文件 + 跑 migration
tools: [Read, Edit, Write, Bash, Grep]

# 不写 tools 字段:继承父代理的全部工具(包括 Agent 工具本身)
# 这意味着 subagent 可以再派 subagent — 递归深度过深时一定要限
```

## 并行调度 — 一条消息派 N 个

PARALLEL DISPATCH

最容易被忽略的能力: **同一条消息里调用多次 Agent 工具,这些 subagent 会并行跑** 。 顺序派 5 个要等 5 倍时间,并行派 5 个只等最慢那一个。 但并行的_前提_是任务彼此独立——一旦后一个依赖前一个的结果, 并行就退化成串行加同步开销,反而更慢。

### 三种调度形态

> **图：子代理三种调度形态**
>
> - SEQUENTIAL · 串行
> - A
> - B
> - C
> - B 依赖 A · C 依赖 B
> - 总时长 = A+B+C
> - PARALLEL · 并行(单消息)
> - 三者独立 · 一条消息派出
> - 总时长 = max(A,B,C)
> - BACKGROUND · 后台
> - 主代理继续
> - 通知
> - A 跑长任务 · 主代理同时做别的
> - 完成时收到 task notification
> - 独立任务并行 · 依赖任务串行 · 长任务后台 — 不要混着用
> - 关键:并行的 prerequisite 是"任务彼此独立"

FIG 03 · DISPATCH PATTERNS — SEQUENTIAL · PARALLEL · BACKGROUND

### 并行派 — 主代理伪代码

```
# 主代理在【一条助手消息】里 emit 多个 Agent 调用 — 这些就并行

Agent(subagent_type="Explore", prompt="找权限验证逻辑")
Agent(subagent_type="Explore", prompt="找日志记录逻辑")
Agent(subagent_type="Explore", prompt="找错误处理逻辑")

# ↑ 三只手同时去搜 · 最慢那个跑完时主代理一次性收到 3 份摘要

# 反例:依赖关系不能并行
result_a = Agent(...) # 等 A 完成
Agent(prompt=f"基于 {result_a} 继续做 B") # B 必须等 A
# 这种就老老实实串行,别硬塞同一条消息
```

### foreground vs background

FOREGROUND · 默认

### 主代理等结果才能继续

派 Explore 找东西,主代理拿到结果才知道下一步去哪个文件——这种必须 foreground。 **规则:你需要 agent 的输出来决定下一步,就用 foreground。**

BACKGROUND

### 主代理同时干别的

派 agent 跑一个 10 分钟的大测试,主代理同时整理代码——这种用 `run_in_background: true`。完成时主代理收到 task notification。

反模式:对所有 agent 都开 background — 然后主代理就傻等通知,反而比 foreground 还慢

### prompt 必须自洽 — subagent 看不到你和主代理的对话

```
# ✗ 主代理这样派 — subagent 完全懵
Agent(prompt="基于上面我们讨论的方案,把它实现一下")
# ↑ "上面的方案"是什么?subagent 没看过那段对话

# ✓ 把上下文打包进 prompt
Agent(prompt="""
背景:用户在重构 auth 模块,目标是把 session 存储从 cookie 改成 JWT。
我们已经决定:① 用 jose 库 ② token 放 Authorization header
③ 保留 refresh-token 机制。

任务:实现 src/auth/jwt.ts,导出 signToken / verifyToken 两个函数。
约束:函数签名必须兼容现有 src/auth/session.ts 的调用方式。

完成后,简短报告:改了哪些文件、新增了什么、有没有遗留 TODO。
""")
```

subagent prompt 写法:像在给一个刚到岗的同事写交接文档 · 假设它不知道任何上下文

### 实战:50 个文件批量重命名

```
# 任务:把项目里所有 getUserId() 改成 getCurrentUserId()

# 第一步:主代理用 Grep 列出所有命中
Grep("getUserId", output="files_with_matches")
# 输出 50 个文件 — 大致按目录分:auth/ (12) · api/ (15) · ui/ (23)

# 第二步:按目录分成 3 组,一条消息并行派
Agent(subagent_type="general-purpose", prompt="""
重命名 src/auth/ 下 12 个文件里的 getUserId → getCurrentUserId。
保持其他代码不变。完成后报告:改了哪些文件、行数、有无遗漏。
""")
Agent(subagent_type="general-purpose", prompt="重命名 src/api/ 下...")
Agent(subagent_type="general-purpose", prompt="重命名 src/ui/ 下...")

# 第三步:三只手同时改 · 主代理收齐 3 份报告 · 跑测试验证
```

## Worktree 隔离 — 多分支并行不打架

GIT ISOLATION

并行派两个 subagent 同时改文件——一个改 `src/auth/`, 一个改 `src/auth/login.ts` 的同一段—— 在同一个工作目录里跑必然_写冲突_。 Git worktree 给每只手发一份 **独立的工作目录** (同一仓库、不同分支、不同物理路径), 改完合并就好。Claude Code 把这个能力封装在 `isolation: "worktree"` 参数里。

### Git worktree 30 秒入门

```
# 一个仓库可以有多个 worktree — 每个挂在自己的分支上

$ git worktree add ../proj-feat-auth feat/auth
# ↑ 新目录 ↑ 检出/新建的分支
$ git worktree add ../proj-fix-login fix/login

$ git worktree list
/Users/me/proj d4a92e1 [main]
/Users/me/proj-feat-auth d4a92e1 [feat/auth]
/Users/me/proj-fix-login d4a92e1 [fix/login]

# 三个目录共享同一份 .git · 各自独立的工作区
# 在不同目录里改不同分支,互不干扰 · build / test 也独立

$ git worktree remove ../proj-feat-auth # 清理
```

### subagent + worktree 的组合

> **图：subagent + worktree 组合架构**
>
> - MAIN · main 分支
> - 主代理 · 你看到的会话
> - SUBAGENT A
> - 改 src/auth/
> - worktree: feat/auth
> - SUBAGENT B
> - 改 src/api/
> - worktree: feat/api
> - SUBAGENT C
> - 改 src/ui/
> - worktree: feat/ui
> - .claude/worktrees/auth/
> - .claude/worktrees/api/
> - .claude/worktrees/ui/
> - 三只手在三个目录里同时改 · 同一仓库 · 不同分支 · 主代理只看汇总

FIG 04 · MAIN ↔ SUBAGENT × WORKTREE — PARALLEL BRANCH DEVELOPMENT

### 两种用法

```
# 用法 1:派 subagent 时指定 worktree 隔离
# agent 全程在新 worktree 里操作 · 完成后报告路径/分支

Agent(
  subagent_type="general-purpose",
  isolation="worktree",
  prompt="在新分支上把 src/auth 从 cookie 改成 JWT,跑完测试"
)
# ↑ 父代理拿到结果:"已在 .claude/worktrees/abc/ 上 feat/jwt-xyz 分支完成,
# 18 个文件改动 · 12 个测试通过"

# 用法 2:让当前会话进入 worktree
# 适合"我现在要切到另一个分支临时改东西"

EnterWorktree(name="hotfix-login") # 创建并切入
# …你和 Claude 在新 worktree 里干活…
ExitWorktree(action="keep") # 留着,稍后回来
# 或
ExitWorktree(action="remove") # 干完直接清理
```

### 什么时候用 worktree

该用

### 多个 subagent 同时改文件

不用 worktree 它们都在同一份代码上写,先到先得地覆盖彼此。用了之后各干各的,合并交给你或后续步骤。

该用

### 实验性改动 / 风险尝试

让 subagent 在 throwaway 分支上试一个大胆改法——成了就 merge,失败一删了之,主分支不留痕。

该用

### 同时维护多分支

main 在跑长测试,同时想在 hotfix 分支改一行——传统 git checkout 会打断 main 的 build,worktree 不会。

不用

### 单 subagent 只读

Explore 只是搜代码不改东西——根本没有冲突可能,加 worktree 是额外开销。

不用

### 顺序任务

任务本来就要一步一步来,没并行,worktree 解决的问题不存在。

不用

### 非 git 仓库

git worktree 依赖 git——非 git 项目里只能靠 hook 模拟,通常得不偿失。

## 四种工作流模式

PATTERNS

把前面的零件拼起来,真实项目里反复出现的 **四种 subagent 编排模式** 。 认出眼前任务是哪一种,就知道该派几个、串还是并、要不要 worktree。

PATTERN · 01 · 分而治之

### Divide & Conquer

**任务:** 同一种操作要施加到 N 个独立资源上(50 个文件改名、20 个端点加日志、10 个组件加样式)。

**编排:** 主代理切分 → 一条消息并行派 N 个 subagent → 每个负责一个子集 → 主代理汇总并跑测试。

**需要 worktree?** 子集间无文件重叠就不用 · 有重叠用。

PATTERN · 02 · 独立评审

### Second Opinion

**任务:** 主代理刚做完一段事(写完迁移、改完 API、起完方案),需要不带偏见的复核。

**编排:** 派一个 code-reviewer / Plan agent,prompt 里 **只提任务和约束** ,不告诉它你的实现思路——独立判断才有价值。

**需要 worktree?** 评审是只读,不用。

PATTERN · 03 · 广度探索

### Breadth-First Search

**任务:**"X 在哪儿"这种问题不知道关键词,可能在 5+ 处,自己搜上下文会被污染。

**编排:** 派一个 Explore agent · 设广度 medium / very thorough · 它会试多个查询关键词 · 主代理只收一份摘要报告。

**需要 worktree?** 只读探索,不用。

PATTERN · 04 · 长任务后台

### Long-Running Background

**任务:** 有件事要跑 5-30 分钟(E2E 测试套件、大批量代码生成、跨仓库分析),你不想干等。

**编排:** 派 agent 时 `run_in_background: true` · 主代理同时做其他事 · agent 完成时收到 task notification 自动接力。

**需要 worktree?** 如果会改文件且主代理同时也在改,需要。

### 把四种模式映射到一张决策图

```
# 拿到任务先问自己 4 个问题

Q1: 这是"在 N 个独立单元上做同一件事"吗?
   ✓ → PATTERN 01 · 分而治之(N 并行)
   ✗ → 继续

Q2: 主代理刚做完,想要不带偏见的复核?
   ✓ → PATTERN 02 · 独立评审(1 只读)
   ✗ → 继续

Q3: 目标模糊 / 不知道关键词 / 可能在 5+ 处?
   ✓ → PATTERN 03 · 广度探索(1 只读 + Explore)
   ✗ → 继续

Q4: 这件事会跑 5 分钟以上,你不想干等?
   ✓ → PATTERN 04 · 后台执行
   ✗ → 主代理自己做 · 不要派 subagent
```

反模式:见 subagent 就派 · 实际上大多数任务主代理自己做更快(省去 prompt 装填)

## Labs

4 EXERCISES

LAB 01 · 内置 agent

### 用 Explore 找一个你不熟的功能

打开一个你不太熟的开源项目,问主代理"这个项目的 **权限验证逻辑** 都在哪儿,用了哪些中间件?"—— 故意不给关键词。观察主代理是否派出 Explore agent · 看它返回的摘要 vs 它隐藏的中间搜索过程。 对比同样的问题让主代理自己搜——上下文窗口分别消耗了多少。

LAB 02 · 自定义 agent

### 给项目写一个 code-reviewer.md

在 `.claude/agents/code-reviewer.md` 写一个评审 agent · frontmatter 写清楚 name / description / tools(只给 Read/Grep/Glob/Bash) · body 里定义 review 的优先级和输出格式。提交到仓库。 下次写完功能让主代理说"派 code-reviewer 看一下",验证它确实派出去了。

LAB 03 · 并行调度

### 50 个文件批量重命名

找一个有 30+ 文件用到某符号的项目 · 让主代理把这个符号重命名 · 观察它选 Pattern 1 分而治之的派法——会不会按目录 / 按职责切分 · 会不会一条消息里同时派多个 Agent · 完成后会不会跑测试验证 · 全程消耗的真实墙钟时间。

LAB 04 · Worktree 隔离

### 让 subagent 在独立分支上做实验

挑一个你犹豫的改法(比如把状态管理从 Context 换成 Zustand) · 让主代理派一个 subagent 带 `isolation: "worktree"` 去隔离分支上试一下 · 完成后查 git worktree list 看新分支 · 满意就 merge · 不满意 git worktree remove 一删了之 · 主分支全程未被污染。

## 常见问题

5 Q&A

### Q1 · subagent 和主代理 token 共享吗?派 5 个 subagent 是不是要付 5 倍 token?

A

不共享。每个 subagent 是 **独立的会话上下文** ——独立的 system prompt、独立的工具结果、独立的 token 计费。这是它的核心价值,也是它的代价。

所以派 subagent 的经济模型是:你换到的是"主上下文不被搜索过程污染"和"并行省墙钟时间",付出的是"每个 subagent 要重新装填上下文"。当 subagent 要读 30 个文件、跑 10 次搜索才能得出结论时——这笔账划算;当任务本身只读 2 个文件,自己干更便宜。

实务经验:开放式探索、批量重构、独立评审基本都划算;精确定位、小改动派 subagent 通常亏。

### Q2 · subagent 之间能互相通信吗?能看到对方在干嘛吗?

A

不能。subagent 之间 **互相完全不可见** ——A 不知道 B 存在,B 也不知道 A 存在。这是设计上的隔离,不是 bug。

需要协作时只能走主代理中转:① 主代理派 A 拿到结果;② 主代理把 A 的结果作为 prompt 派 B。这天然就是串行,不能并行。

如果你发现自己想让两个 subagent "互相交流",九成是任务切分错了——它们其实是同一个任务的两个串行步骤,应该串成一个流程或交给一个 subagent。

### Q3 · 自定义 agent 的 description 写得很详细,主代理就一定会按要求派吗?

A

"会派"是概率问题,不是 100% 保证。description 是主代理选 agent 时的 **路由依据** ——写得越具体、越带触发关键词("MUST USE when…"、"Use proactively after…"),命中率越高。

提高命中率的几个技巧:

① 在 description 里写明 **正例和反例** ("适合 X · 不适合 Y");② 用动词触发("after commit"、"when reviewing");③ 在项目 CLAUDE.md 里加一段"开发流程提示",直接告诉主代理"做完 X 之后请派 Y agent";④ 用户对话里也可以显式说"派 code-reviewer 看一下"——这种显式触发最稳。

反过来,如果某个 agent 总是不被派,大概率是 description 写得太泛或场景描述模糊。

### Q4 · isolation: "worktree" 真的能让两个 subagent 同时改文件不冲突吗?

A

能,且彻底。每个 worktree 是独立的 **物理目录** ——subagent A 在 `.claude/worktrees/abc/src/auth.ts` 改,subagent B 在 `.claude/worktrees/def/src/auth.ts` 改——这是两个文件,只是来自同一个 Git 仓库的不同分支。文件系统层面不冲突,git 层面在不同分支上各自 commit,也不冲突。

但冲突的"账"不会消失,只是 **推到 merge 那一刻** 。两个分支都改了 `auth.ts` 同一段——你最后 merge 还是要解决冲突。worktree 的价值是把"工作时的冲突"消除,代价是"merge 时的冲突需要人决策"。

所以最佳实践:让 subagent 切分到 **不重叠的代码区域** (按目录、按功能模块、按文件类型),这样既享受并行,又避开 merge 冲突。

### Q5 · subagent 失败 / 输出垃圾时怎么办?能让主代理重试吗?

A

可以,但要谨慎。subagent 的输出主代理是看得到的——如果摘要明显有问题(没完成、跑偏、报告不一致),主代理可以再派一次,或者换一个 agent 类型,或者把任务拆得更小再派。

但"无脑重试"是反模式——子代理失败往往是因为:① prompt 没把上下文交代清楚(它根本不知道你想要什么);② 任务超出该 agent 的工具集(给的是 Explore 只读权限却让它改文件);③ 任务太大塞不进 subagent 的工作上下文。

所以正确反应:看摘要 → 诊断失败原因 → 调 prompt 或换 agent → 再派。如果连续两次都失败,通常说明任务切分有问题——拆得更小或主代理自己做。

**原则:重要任务永远让主代理在结尾"trust but verify"** — 子代理说"我改完了"不等于真的改对了,主代理该 grep / 跑测试 / 看 diff 的步骤别省。

## 复习题

5 QUESTIONS

1. 子代理与主代理在 **上下文窗口** 上的关系是什么?为什么这决定了"该不该派"的判断标准?
2. 自定义 agent 文件放在哪三个层级?各自的可见范围有什么不同?
3. 同一条消息里调用多个 Agent 工具 vs 分多条消息调用,行为上有什么区别?
4. `isolation: "worktree"` 为什么能让多个 subagent 并行改文件不冲突?它把冲突推到了哪一步?
5. 四种工作流模式各自的判别问题是什么?见到"批量重命名 50 个文件"该用哪一种?

## 自检清单

8 ITEMS

- 能说清主代理 vs 子代理在上下文、工具集、并发、用户交互上的差异
- 能在一条消息里同时派出 N 个 subagent · 知道这就是并行
- 能在 `.claude/agents/` 写一个带完整 frontmatter 的自定义 agent
- 会写 description 让主代理"看了就知道何时该派"
- 知道何时用 `run_in_background` · 何时用 foreground · 不混着用
- 能给 subagent 写自洽的 prompt — 不依赖主对话上下文
- 会用 `isolation: "worktree"` 让多个 subagent 并行改文件
- 认得出"分而治之 / 独立评审 / 广度探索 / 后台执行"四种模式,会判断该用哪种

## 延伸阅读

3 LINKS

DOCS

### Claude Code — Subagents

官方 subagent 文档:Agent 工具签名、内置 agent 列表、自定义 agent 格式、tools 字段语义。Day 14 的根参考。

REFERENCE

### Git Worktree

`git worktree` 官方文档:add / list / remove / move 全部子命令、共享状态、单仓库多工作区的边界条件。

GUIDE

### Agent SDK · query()

Day 19 的前置阅读:在自己的代码里用 SDK 调起 subagent 并接收流式结果 · subagent 编程化编排的进阶玩法。

## Day 15 预告

NEXT

COMING NEXT

### Plan 模式 — 架构规划 · 方案审批 · 大型重构安全网

今天让你学会"派几只手并行干"——明天往回拉一格,讲" **动手前先把方案敲定**"。 EnterPlanMode 让 Claude 进入只读状态先出方案,你审阅后再批准落地。 大型重构、跨服务变更、生产事故响应——任何一旦做错代价高的场景,先 Plan 再 Execute 是最稳的工作流。

"The whole is more than the sum of its parts." — Aristotle, on systems of agents.

DAY 14 · CLAUDE CODE 20-DAY ROADMAP · AGENTS & SUBAGENTS
