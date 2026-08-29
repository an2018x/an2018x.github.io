---
title: "Day 05 · Git 工作流 — commit · PR · 分支管理 · Code Review"
date: '2026-05-16'
draft: false
description: "用自然语言驱动 Git 操作：让 Claude Code 生成智能 commit message、创建 Pull Request、管理分支、执行 Code Review——从此你有了一个 24/7 在线的结对编程搭档。"
toc: true
tags:
  - AI
  - Claude Code
  - Tooling
  - Tutorial
---

DAY 05 · CLAUDE CODE ROADMAP · 20 DAYS

# 让 Claude 替你_干 Git 的活_

写完代码后最枯燥的事——组织 commit、写 PR 描述、逐行 Review 别人的代码。 今天你将把这些 Git 日常全部交给 Claude Code： 用一句自然语言生成完美的 commit message， 用一个指令创建带摘要的 Pull Request， 甚至让 Claude 当你的_7×24 Code Reviewer_。

**DURATION** 50–60 min **THEORY** 15 min **HANDS-ON** 30 min **REVIEW** 10 min **TOOLS** git · gh · Claude Code

## 思维导图

OVERVIEW

> **图：Day 05 思维导图**
>
> - DAY 05 · Git 工作流
> - COMMIT · PR · BRANCH · CODE REVIEW
> - 01 · COMMIT
> - 智能提交
> - 02 · PR
> - Pull Request
> - 03 · BRANCH
> - 分支管理
> - 04 · REVIEW
> - Code Review
> - 分析 diff 生成消息
> - Conventional Commits
> - Co-Authored-By 签名
> - 安全: 不跳过 hooks
> - gh pr create 集成
> - 自动生成 Summary
> - 关联 Issue / Test Plan
> - 推送前确认
> - 创建 feature 分支
> - 查看分支状态
> - 合并与冲突解决
> - 禁止 force push main
> - Review PR diff
> - 安全 / 性能审查
> - Review 本地变更
> - 自定义审查标准
> - DELIVERABLES
> - 用 Claude 提交 commit
> - 创建一个完整 PR
> - 用 Claude Review 代码
> - 理解 Git 安全护栏
> - GOLDEN RULE
> - 让 Claude 做 Git 操作，但 push 之前永远自己过一眼 — 信任但要验证

FIG · Day 05 全景: 智能提交 → PR 创建 → 分支管理 → Code Review

## 智能 Commit — 一句话生成提交

12 MIN

写 commit message 是开发者最"知道该认真但总是敷衍"的事—— `fix bug`、`update`、`wip` 充斥着 git log。 Claude Code 可以_分析你的 diff_， 生成结构化的、有意义的 commit message。

### 基础用法

```
# 最简单的方式: 让 Claude 帮你提交
> 提交当前的改动
# Claude 会:
# 1. 运行 git status 查看变更
# 2. 运行 git diff 分析改了什么
# 3. 查看 git log 学习仓库的 commit 风格
# 4. 生成 commit message 并创建提交

# 指定提交意图
> 把 src/auth 下的改动提交了，这是修复登录超时的 Bug

# 只提交特定文件
> 把 README.md 和 CHANGELOG.md 提交了，消息写"更新文档"
```

### Claude 的 Commit 流程

> **图：Commit 流程**
>
> - SMART COMMIT FLOW
> - STEP 1
> - git status + diff
> - STEP 2
> - git log 学习风格
> - STEP 3
> - 生成 message
> - STEP 4
> - git add + commit
> - STEP 5
> - git status 验证
> - 分析变更
> - 对齐风格
> - 核心步骤
> - 精准暂存
> - 确认成功
> - Claude 优先用具体文件名暂存 (git add file.ts)，避免 git add -A 意外包含敏感文件

FIG · 智能 Commit: 分析 diff → 学习风格 → 生成消息 → 精确暂存 → 验证

### Commit Message 规范

Claude 生成的 commit message 会自动匹配仓库已有的风格。你也可以在 CLAUDE.md 中指定规范：

```
# CLAUDE.md 中指定 commit 规范
## Commit 规范
- 使用 Conventional Commits 格式
- feat: 新功能
- fix: Bug 修复
- refactor: 重构 (不改变行为)
- docs: 文档更新
- test: 测试相关
- chore: 杂务 (依赖、CI 等)
- commit message 用英文，body 可以用中文补充说明
```

KEY INSIGHT

### Co-Authored-By 签名

Claude 创建的 commit 会自动添加 `Co-Authored-By: Claude` 签名。这是透明度的体现——团队成员可以看到哪些提交是 AI 辅助的。 **不要使用 --no-gpg-sign 跳过签名** ，除非你明确要求。

SAFETY

### 新建而不是 amend

Claude 默认创建 **新的 commit** 而非 amend 已有提交。这是安全设计——amend 会修改历史，如果已推送则需要 force push。当 pre-commit hook 失败时，Claude 会修复问题后 **新建一个 commit** ，绝不会 amend 上一个可能不相关的提交。

提示: 在 CLAUDE.md 中写清楚 commit 规范——Claude 会严格遵守，从此你的 git log 终于整洁了。

## Pull Request — 从代码到上线的桥梁

10 MIN

Claude Code 用 `gh`（GitHub CLI）处理所有 GitHub 交互。 它能分析_整个分支的所有 commit_——不只是最后一个—— 然后生成结构化的 PR 描述，包含摘要、变更列表和测试计划。

### 创建 PR 的方式

```
# 最简方式: 一句话创建 PR
> 创建一个 PR
# Claude 会:
# 1. 检查未提交的改动并提交
# 2. 分析分支上所有 commits vs base branch
# 3. 推送到远端
# 4. 用 gh pr create 创建 PR，自动生成标题和描述

# 指定更多细节
> 创建一个 PR，标题叫 "Add user auth middleware"
> 关联 issue #42，reviewer 加上 @alice

# 查看已有的 PR
> 看一下 PR #15 的内容
# Claude 会用 gh pr view 15 获取详情
```

### PR 描述模板

Claude 生成的 PR 描述遵循这个结构：

```
## Summary
- 实现了用户认证中间件
- 支持 JWT 和 Session 两种模式
- 添加了 /api/auth/login 和 /api/auth/logout 端点

## Test plan
- [] 测试 JWT 认证流程
- [] 测试 Session 过期处理
- [] 验证未授权访问返回 401
- [] 回归测试现有 API 端点

🤖 Generated with Claude Code
```

HOW IT WORKS

### Claude 分析的不只是最后一个 commit

创建 PR 时，Claude 会用 `git log` 和 `git diff base...HEAD` 分析 **分支上所有 commit 的完整变更** 。这就是为什么 PR 描述能准确涵盖整个功能——它看到了全貌，而不只是最后的修修补补。

TIP

### 推送需要你确认

Claude 不会静默推送代码——`git push` 会触发权限确认。这是安全设计：提交是本地操作，推送才让改动公开。 **在确认前看一眼 commit 列表和目标分支** ，确保没有意外。

所有 GitHub 操作使用 gh CLI——确保你已经通过 gh auth login 完成了认证。

## 分支管理 — 创建、切换与合并

8 MIN

分支操作是 Claude Code 处理得最自然的 Git 场景之一—— 因为分支名、切换方向和合并策略都可以用_自然语言_表达， 而不需要记忆 `git checkout -b` 还是 `git switch -c`。

### 常用分支操作

```
# 创建 feature 分支
> 从 main 创建一个 feature/user-auth 分支并切换过去

# 查看当前状态
> 当前在哪个分支？有多少 commit 领先 main？

# 同步上游
> 把 main 的最新代码合并到当前分支

# 处理冲突
> 合并有冲突，帮我解决一下
# Claude 会读取冲突文件，分析双方改动，给出合并建议

# 清理
> 这个 feature 分支已经合并了，删掉本地和远端的
```

### 冲突解决流程

| 步骤 | Claude 的操作 | 你需要做的 |
| --- | --- | --- |
| 1. 发现冲突 | 解析 `git status` 找到冲突文件 | 不需要操作 |
| 2. 分析冲突 | Read 冲突文件，理解双方意图 | 告诉 Claude 你倾向哪方 |
| 3. 提出方案 | 给出合并后的代码 | 审核合并方案 |
| 4. 解决冲突 | Edit 文件去掉冲突标记 | 确认 Edit 操作 |
| 5. 完成合并 | `git add` + `git commit` | 审核最终提交 |

SAFETY

### Claude 不会 force push 到 main

即使你要求，Claude 也会 **警告并拒绝** `git push --force` 到 main/master 分支——这是硬编码的安全限制。对 feature 分支的 force push 也会先请你确认。同样，`git reset --hard` 和 `git checkout .` 这类丢弃本地改动的命令，Claude 会寻找更安全的替代方案。

MENTAL MODEL

### 解决冲突而不是丢弃

遇到障碍时，Claude 倾向 **解决问题而不是跳过它** 。如果 merge 有冲突，它会分析冲突并合并，而不是用 `--ours` 或 `--theirs` 草率地选一边。如果 lock 文件存在，它会调查原因，而不是直接删除。这是 Claude 的安全哲学。

Claude 处理冲突的质量取决于上下文——如果它了解两边的改动意图（比如你解释过），合并结果会更准确。

## Code Review — Claude 做你的审查搭档

10 MIN

Code Review 是 Claude Code 最_被低估_的能力。 不需要等同事有空——让 Claude 先做一轮审查， 它能发现安全漏洞、性能问题、风格不一致和逻辑错误。 人类 Reviewer 拿到的已经是高质量的代码。

### Review 的多种方式

```
# Review 一个 GitHub PR
> review 一下 PR #23
# Claude 用 gh pr diff 23 获取改动
# 然后逐文件分析，给出评审意见

# Review 本地未提交的改动
> review 一下我当前的改动
# Claude 用 git diff 分析当前工作区

# Review 指定 commit 范围
> review 最近 3 个 commit 的改动

# 针对性审查
> 从安全角度 review 一下 src/auth/ 的改动
> 检查这个 PR 有没有性能问题
> 看看这些改动是否符合我们的 TypeScript 规范
```

### Claude Review 的检查维度

| 维度 | 检查内容 | 示例问题 |
| --- | --- | --- |
| 正确性 | 逻辑错误、边界条件、空值处理 | "这里 array 可能为空，.map() 会报错" |
| 安全性 | 注入攻击、XSS、敏感信息泄露 | "用户输入直接拼接 SQL，有注入风险" |
| 性能 | N+1 查询、不必要的循环、内存泄漏 | "循环内有 await 调用，考虑 Promise.all" |
| 风格 | 命名一致性、代码重复、模式遵从 | "其他地方用 camelCase，这里突然 snake\_case" |
| 可维护性 | 过度复杂、缺少类型、魔法数字 | "这个 86400 应该用命名常量 SECONDS\_PER\_DAY" |

BEST PRACTICE

### 在 CLAUDE.md 中定义审查标准

在 CLAUDE.md 中添加 Review 指南，让 Claude 每次都按照团队的标准来审查。比如："Review 时重点关注 OWASP Top 10 安全问题"、"检查是否所有数据库查询都使用参数化"、"确保新 API 端点有请求验证"。 **越具体，Review 越有价值** 。

WORKFLOW

### AI 先审，人再审

最高效的 Review 流程：(1) 代码写完后，先让 Claude Review 一遍；(2) 根据反馈修复明显问题；(3) 再提交给人类 Reviewer。这样人类 Reviewer 收到的已经是 **经过 AI 预筛的高质量代码** ——Review 时间大幅缩短，讨论聚焦在架构和设计层面。

Claude 的 Review 不能替代人类 Review——它擅长找技术问题，但架构决策、业务逻辑和团队约定仍需人类判断。

## Git 安全护栏 — Claude 的内建保护

REFERENCE

Claude Code 内置了一系列 Git 安全规则——不是"建议"，而是_硬限制_。 理解这些护栏能帮你预判 Claude 的行为，避免"为什么它不执行我的命令"的困惑。

| 安全规则 | Claude 的行为 | 原因 |
| --- | --- | --- |
| 不跳过 hooks | 不使用 `--no-verify` | pre-commit hooks 存在是有原因的——跳过它解决的是症状不是根因 |
| 不 force push main | 警告并拒绝 | 会覆盖远端历史，影响所有协作者 |
| 新建不 amend | 默认创建新 commit | amend 修改历史，hook 失败后 amend 会损坏上一个 commit |
| 不 git add -A | 逐个文件 add | 避免意外暂存 .env、凭证等敏感文件 |
| 不跳过 GPG 签名 | 不使用 `--no-gpg-sign` | 保持 commit 签名的完整性 |
| 解决而非丢弃 | 遇冲突分析合并 | reset --hard / checkout . 可能丢失工作 |
| push 需要确认 | 推送前请求许可 | 推送是不可逆的公开操作 |

IMPORTANT

### Hook 失败怎么办

当 pre-commit hook 失败时（比如 lint 不通过）， **commit 实际上没有发生** 。Claude 会分析 hook 的错误输出，修复问题（比如调整格式），重新 stage 文件，然后创建 **新的 commit** ——注意不是 amend。这很重要：如果用 amend，会修改上一个可能完全不相关的 commit。

TIP

### 敏感文件保护

Claude 在 `git add` 时会自动跳过看起来像敏感信息的文件（`.env`、`credentials.json` 等）。如果你明确要求提交这类文件，Claude 会 **警告你** 但不会阻止——最终决定权在你。

这些安全规则不能通过 settings.json 覆盖——它们是 Claude Code 核心行为的一部分，保护你免于意外。

## 动手练习

30 MIN

今天的练习需要一个真实的 Git 仓库。如果你的项目还没初始化 Git， 先 `git init`；如果你想练习 PR 相关操作，需要一个 GitHub 仓库。

### Lab 1 — 智能 Commit 体验

修改一个文件，让 Claude 帮你生成 commit。

```
# 先手动改一个文件 (比如加一行注释)
$ echo "// updated" >> src/index.ts

# 让 Claude 提交
$ claude
> 提交当前的改动

# 观察 Claude 的流程:
# 1. 它查看了 git status 吗？
# 2. 它查看了 git diff 吗？
# 3. 它查看了 git log 学习风格吗？
# 4. commit message 的质量如何？
# 5. 它用的是 git add 具体文件还是 git add -A？

# 查看结果
> 看一下最新的 commit
```

### Lab 2 — 多文件修改 + 拆分提交

修改多个文件，让 Claude 按逻辑拆分成多个 commit。

```
# 同时修改几个文件
# 比如: 改了 API 端点 + 更新了文档 + 修了一个 Bug

> 当前有三类改动: API 端点变更、文档更新和 Bug 修复
> 帮我拆分成三个独立的 commit

# Claude 会:
# 1. 分析所有变更文件
# 2. 按逻辑分组
# 3. 依次暂存 + 提交每个分组
```

### Lab 3 — 创建 PR (需要 GitHub 仓库)

在 feature 分支上做些修改，然后让 Claude 创建 PR。

```
# 创建分支并做一些改动
> 创建一个 feature/day05-lab 分支
> 在 README.md 末尾加一行 "Day 05 Lab"
> 提交并创建一个 PR

# 查看 PR 描述的质量
# Claude 生成的 Summary 和 Test Plan 是否准确？

# 练习完后清理
> 关闭 PR 并删除 feature/day05-lab 分支
```

### Lab 4 — Code Review 实战

让 Claude Review 你自己的代码或一个开源 PR。

```
# Review 自己的本地改动
> review 一下我当前的改动，重点看安全问题

# Review 一个你自己仓库的 PR
> review PR #1，从以下角度:
> 1. 有没有安全漏洞
> 2. 代码风格是否一致
> 3. 有没有可以优化的地方

# 尝试给 Review 加上项目规范
# (确保 CLAUDE.md 中已有编码规范)
> 按照 CLAUDE.md 中的规范 review 这个 PR
```

如果你没有 GitHub 仓库，可以跳过 Lab 3——但 Lab 1/2/4 在任何本地 Git 仓库中都可以练习。

## 常见疑问

5 QUESTIONS

### Q1 · Claude 生成的 commit message 不是我想要的风格，怎么调整？

ANS

两个方法。 **立即调整** ：告诉 Claude "用 Conventional Commits 格式重新提交" 或 "commit message 换成英文"。 **永久调整** ：在 CLAUDE.md 中写清楚 commit 规范——Claude 会在后续所有提交中遵守。比如写 `commit message 格式: type(scope): description，type 可选 feat/fix/refactor/docs/test/chore，用英文`。 Claude 还会自动从 `git log` 学习仓库已有的风格，所以保持一致的 commit 习惯本身就是最好的"配置"。

### Q2 · Claude 会自动 push 吗？我怕它偷偷把代码推上去。

ANS

**不会自动 push** 。`git push` 属于影响远端的操作，Claude 在执行前一定会请求你的确认（除非你在 settings.json 中显式 allow 了 `Bash(git push)`，但强烈不推荐）。commit 是本地操作，push 才是公开操作——Claude 严格区分这两者。同样的逻辑适用于 `gh pr create`——创建 PR 前你也会看到确认提示。

### Q3 · Claude 做 Code Review 的质量怎么样？能替代人类 Reviewer 吗？

ANS

Claude 擅长发现 **技术层面的问题** ——类型错误、边界条件、安全漏洞、性能反模式、命名不一致。这些占日常 Review 评论的 60-70%。但它 **不擅长** 的是：架构合理性（"这个功能该不该放在这个模块"）、业务逻辑正确性（"这个折扣计算规则对吗"）、团队约定（"我们组不用这个库"）。最佳实践是 **让 Claude 做第一轮筛选** ，人类 Reviewer 聚焦高层问题。

### Q4 · 如果 pre-commit hook 失败了怎么办？

ANS

Claude 会 **诊断 hook 的错误输出并修复根因** 。比如 ESLint hook 报错——Claude 会看错误信息，修复代码中的 lint 问题，重新 stage 文件，然后创建新的 commit。关键点：Claude **不会用 --no-verify 绕过 hook** ，也 **不会 amend 上一个 commit** （因为 hook 失败意味着上一个 commit 没成功创建）。如果 hook 问题确实无法修复（比如 hook 脚本本身有 bug），Claude 会告诉你，让你决定下一步。

### Q5 · Claude 能处理 Git 子模块、Git LFS 或 monorepo 吗？

ANS

Claude 通过 Bash 执行标准 `git` 命令，所以 **理论上支持所有 Git 功能** ，包括子模块和 LFS。对于 monorepo（如 Turborepo、Nx），Claude 能理解 workspace 结构并做正确的 scope 化操作。但这些高级场景你可能需要在 CLAUDE.md 中写清楚规范——比如 "这是一个 pnpm workspace monorepo，提交时按 package 拆分 commit" 或 "images/ 目录下的文件使用 Git LFS 跟踪"。

## 复盘问题

5 QUESTIONS

1. Claude 在创建 commit 时经历了哪几个步骤？为什么要先看 `git log`？
2. 为什么 Claude 默认创建新 commit 而不是 amend？在什么场景下 amend 会导致问题？
3. 创建 PR 时，Claude 分析的是最后一个 commit 还是分支上所有 commit？这有什么好处？
4. 列出三个 Claude 内建的 Git 安全规则，并解释每个规则保护你免受什么风险。
5. 描述一个 "AI 先审，人再审" 的 Code Review 工作流。Claude 擅长发现哪类问题？不擅长哪类？

## 今日检查清单

7 ITEMS

- 用 Claude 成功创建了至少一个 commit，commit message 质量满意
- 理解 Claude 的 commit 流程（status → diff → log → message → add → commit → verify）
- 知道如何在 CLAUDE.md 中指定 commit 规范
- 尝试过让 Claude 创建 PR（或理解了创建流程）
- 让 Claude Review 过代码，并体验了不同审查角度
- 能列出至少 5 条 Git 安全护栏及其原因
- 理解 "信任但验证" — 在 push 前检查 Claude 的操作

## 推荐阅读

3 ITEMS

STANDARD

### Conventional Commits

Conventional Commits 规范的官方网站——如果你的团队还没有 commit 规范，这是最广泛采用的标准。配合 Claude Code 使用效果极佳。

TOOL

### GitHub CLI (gh) 文档

Claude Code 使用 gh 处理所有 GitHub 操作。了解 gh 的能力边界能帮你更好地指导 Claude——比如 `gh pr checks`、`gh issue create` 等高级用法。

BEST PRACTICE

### Claude Code: Git Best Practices

Anthropic 官方关于 Claude Code Git 工作流的最佳实践指南——包含 commit 策略、PR 流程和 Review 技巧的详细建议。

## Day 06 预告

NEXT

COMING NEXT

### 调试与测试 — 错误诊断 · 测试生成 · TDD 工作流

代码提交只是开始——确保它是正确的才是关键。明天你将学习如何让 Claude 诊断 Bug（给它一个报错就够了）、自动生成测试用例、实践 AI 驱动的 TDD 工作流，以及如何让 Claude 运行测试并智能解读结果。让 Claude 从"帮你写代码"升级为"帮你保证代码质量"。

"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."

DAY 05 · CLAUDE CODE 20-DAY ROADMAP
