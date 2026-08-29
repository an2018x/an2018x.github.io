---
title: "Day 11 · 内建 Git 与 Source Control"
date: '2026-05-30'
draft: false
description: "VSCode 内建 Git 与 Source Control：变更列表、diff、stage hunk、discard、commit、branch、sync、3-way merge editor、timeline 与 blame。把每一次改动管理得更稳。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 11
---

DAY 11 · VSCODE ROADMAP · 21 DAYS

# 把每一次改动变得 _可审查_

Day 08-10 把工作区、终端、任务串成了项目控制台。今天收束这一阶段: 用 VSCode 的 **Source Control、Diff、Stage Hunk、Merge Editor、Timeline** 管理每一次改动。 Git CLI 仍然重要,但 VSCode 的可视化能力能让你更稳地看清「我到底改了什么」。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **POWER MOVE** stage hunk

## 思维导图

OVERVIEW

> **图：Day 11 Source Control 思维导图**
>
> - DAY 11 · GIT · SOURCE CONTROL
> - CHANGES · DIFF · STAGE HUNK · COMMIT · MERGE · TIMELINE
> - 01 · STATUS
> - 变更列表
> - 02 · DIFF
> - 看清改动
> - 03 · STAGE
> - 文件 / hunk / line
> - 04 · MERGE
> - 冲突解决
> - 05 · HISTORY
> - timeline / blame
> - 工作树状态
> - modified / added
> - staged / unstaged
> - 审查差异
> - inline / side-by-side
> - word diff
> - 拆分提交
> - stage selected ranges
> - discard safely
> - 三方合并
> - incoming / current
> - result
> - 追溯上下文
> - file timeline
> - line blame
> - 核心判断
> - 命令行负责精确操作 · VSCode 负责看清变更 · 小提交降低风险

SOURCE CONTROL MAKES CHANGES VISIBLE BEFORE THEY BECOME HISTORY

## 今天的心智模型

MODEL

WORKTREE

### 你正在改的现场

工作树里混着所有未提交改动。VSCode Source Control 的第一价值,就是把这个现场拆成可读列表。

INDEX

### 下一次提交的篮子

Stage 不是形式主义,它是在构造下一次 commit。你可以 stage 文件、hunk、甚至几行,让提交更小更聚焦。

HISTORY

### 提交后的叙事

Commit message 不是给 Git 看的,是给未来的你和队友看的。小提交 + 好消息,是最便宜的协作质量。

一句话: Source Control 是把工作树变成可审查提交的可视化流水线。

## Source Control 面板拆解

ANATOMY

| 区域 / 动作 | 含义 | 建议用法 |
| --- | --- | --- |
| Changes | 未暂存变更。对应工作树中的改动。 | 先逐个打开 diff,确认每个文件为什么改。 |
| Staged Changes | 已暂存变更。对应下一次 commit 的内容。 | 提交前再 review 一遍 staged diff,不要盲 commit。 |
| Stage File | 把整个文件加入 index。 | 文件只有一个明确主题时使用。 |
| Stage Hunk / Selected Ranges | 只暂存某一块或几行变更。 | 一个文件里混了多个主题时,用它拆小提交。 |
| Discard Changes | 丢弃工作树改动。 | 这是危险动作。只对你确认不需要的改动使用。 |
| Commit Message | 提交消息输入框。 | 用祈使句或约定格式,说明「做了什么」和必要时「为什么」。 |
| Sync / Pull / Push | 和远端交换提交。 | 多人分支先 pull 再 push。冲突时慢下来,不要乱点 accept all。 |

## 高频入口

SHORTCUTS

| 动作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 打开 Source Control | ⌃⇧G | Ctrl Shift G | 进入 Git 变更视图。 |
| 命令面板 Git 命令 | ⌘⇧P → Git: | Ctrl Shift P → Git: | branch、checkout、stash、merge、pull、push 等入口。 |
| 打开文件 diff | 点击 Changes 文件 | 点击 Changes 文件 | 先看 diff 再 stage,这是核心习惯。 |
| Stage Hunk | diff 视图 hunk 上方 + | diff 视图 hunk 上方 + | 只暂存一块改动,适合拆提交。 |
| Stage Selected Ranges | 选中 diff 中行 → Stage Selected Ranges | 选中 diff 中行 → Stage Selected Ranges | 比 hunk 更细,适合同一块里混了两个意图。 |
| 查看文件 Timeline | Explorer / Outline 下方 Timeline | Explorer / Outline 下方 Timeline | 看文件历史、保存点、Git commit。 |
| 打开 Merge Editor | 冲突文件 → Resolve in Merge Editor | 冲突文件 → Resolve in Merge Editor | 三方视图解决冲突。 |

## Diff: 提交前的审查现场

REVIEW

> **图：VSCode diff 审查示意图**
>
> - HEAD / old
> - working tree / new
> - - const timeout = 3000;
> - + const timeout = 5000;
> - + logger.info("retry enabled");
> - side-by-side diff
> - 读 diff 时问三件事: 意图是否单一? 有没有误改? 有没有遗漏测试?

DIFF FIRST · STAGE SECOND · COMMIT LAST

READ

### 逐文件阅读

不要看到文件名就 stage。打开 diff,确认改动与当前任务一致。

SPLIT

### 按意图拆分

一个文件里同时有修 bug、格式化、重命名,就用 hunk / range stage 拆开。

PROTECT

### 丢弃要慢

Discard 是不可逆味道很重的动作。只在你确定某块改动完全不需要时使用。

## 小提交工作流

STAGING

01 · REVIEW

### 先看全部 diff

Changes → open file diff
问: 这是什么改动?

先建立全局感,避免把调试代码、临时日志、无关格式化带进提交。

02 · SELECT

### 按意图选择 hunk

Stage Hunk
Stage Selected Ranges

一次 commit 最好只有一个主题。hunk stage 是 VSCode Git 最值得练的能力。

03 · VERIFY

### 只检查 staged diff

Staged Changes → open diff
run precheck task

提交前看 staged 区,因为它才是将要进入历史的内容。

04 · COMMIT

### 写清提交消息

fix: handle empty settings form
refactor: split api client

消息写「做了什么」。如果上下文不明显,正文补「为什么」。

## Merge Editor: 冲突不是猜谜

MERGE

冲突解决最怕一键乱选。VSCode 的 3-way Merge Editor 把冲突拆成 Current、Incoming、Result: 你可以看清当前分支、对方分支和最终结果,再决定接受哪一边或手动组合。

| 区域 | 含义 | 操作建议 |
| --- | --- | --- |
| Current | 你当前分支的内容。 | 确认自己本来想保留的逻辑是什么。 |
| Incoming | 要合入的分支内容。 | 理解对方改动目的,不要只看文本差异。 |
| Result | 最终将写入文件的内容。 | 最终只相信 Result。解决完后读一遍完整上下文。 |
| Accept Current / Incoming | 接受某一边。 | 适合明显互斥且确定保留某边的冲突。 |
| Accept Both / Manual Edit | 组合两边或手动编辑。 | 适合两边都有效但需要整合的业务逻辑。 |

合并后一定运行相关测试或 Day10 的 precheck,冲突解决通过编译不等于逻辑正确。

## Timeline 与 Blame

HISTORY

TIMELINE

### 文件级历史

Timeline 能看到当前文件的保存点、Git 提交和历史变化。适合回答「这个文件最近发生了什么」。小范围误改时,它比翻 git log 更快。

BLAME

### 行级上下文

Blame 不是为了甩锅,而是为了找上下文。看到奇怪代码时,通过行级提交找到当时的需求、PR 或讨论。

SEARCH HISTORY

### 从文件到提交

先在 Timeline 找到可疑提交,再用 Git log 或平台 PR 继续追。VSCode 负责入口,CLI 和代码平台负责深挖。

LOCAL HISTORY

### 保存点也有价值

有些改动还没 commit,Timeline 也可能记录本地文件历史。它能救小误操作,但不能替代 Git 提交。

## 推荐设置

SETTINGS

Git 相关设置不要太花。目标是让变更更可见、提交更谨慎、同步更可控。

```
{
  "git.autofetch": true,
  "git.confirmSync": true,
  "git.enableSmartCommit": false,
  "git.openRepositoryInParentFolders": "always",
  "diffEditor.ignoreTrimWhitespace": false,
  "diffEditor.renderSideBySide": true,
  "mergeEditor.enabled": true
}
```

SMART COMMIT

### 建议先关闭

Smart Commit 可能在没有 staged changes 时直接提交所有变更。学习阶段关闭它,强迫自己明确 stage。

WHITESPACE

### 空白变更要看见

忽略空白有时方便,但提交前建议能看到格式化带来的大面积变更,避免误把无关格式化混进功能提交。

## 动手实验

3 LABS

### Lab 1 — 用 hunk stage 拆两个提交

目标:在同一个文件里做两个意图不同的改动,再用 VSCode 拆成两个 commit。

1. 创建或打开一个 Git 仓库,确保工作树干净
2. 在同一个文件中改一个 bug,再顺手改一段注释或格式
3. 打开 Source Control,点击该文件进入 diff
4. 只 stage bug 修复对应的 hunk 或 selected ranges
5. 提交为 `fix: handle empty input`
6. 再 stage 剩下的注释 / 格式改动,提交为 `docs: clarify input behavior`

### Lab 2 — 模拟并解决一个 merge conflict

目标:熟悉 Merge Editor 的 Current / Incoming / Result。

```
git checkout -b feature/current
echo "timeout=3000" > config.txt
git add config.txt && git commit -m "add timeout config"
git checkout -b feature/incoming
echo "timeout=5000" > config.txt
git commit -am "increase timeout"
git checkout feature/current
echo "timeout=1000" > config.txt
git commit -am "lower timeout for local dev"
git merge feature/incoming
```

1. 运行上面的命令制造冲突
2. 在 Source Control 中找到冲突文件
3. 选择 `Resolve in Merge Editor`
4. 观察 Current / Incoming / Result 三个区域
5. 手动决定最终 timeout 值,保存 Result
6. stage 文件并完成 merge commit

### Lab 3 — 用 Timeline 找回一次误改

目标:理解 Timeline 与 Git history 的关系。

1. 打开一个已有文件,做一次小改动并保存
2. 再做第二次改动,故意删掉一段有用内容
3. 打开 Explorer 中的 Timeline 面板
4. 查看该文件最近的保存点或 Git 提交记录
5. 对比历史版本,把误删内容恢复回来
6. 最后用 Source Control diff 确认恢复结果符合预期

REFLECTION

### 三个 Lab 的纵深

Lab 1 练提交粒度,Lab 2 练冲突判断,Lab 3 练历史追溯。它们共同服务一个目标:让变更在进入历史前足够清楚。

CHALLENGE

### 附加挑战

今天之后,每次 commit 前都做一个小流程:看 Changes → stage hunk → 看 Staged Changes → 跑 Day10 precheck → 写 commit message。

## 常见疑问

5 QUESTIONS

### Q1 · VSCode Git 能完全替代命令行 Git 吗?

ANS

不能,也没必要。VSCode 擅长可视化审查、stage hunk、看 diff、解决冲突、写 commit。命令行擅长精确、脚本化、复杂历史操作,比如 rebase、bisect、filter-repo。日常开发可以 VSCode + CLI 混用:看变更用 VSCode,复杂操作回命令行。

### Q2 · Stage Hunk 和 Stage Selected Ranges 有什么区别?

ANS

Stage Hunk 暂存 Git 识别出的一整块相邻改动。Stage Selected Ranges 更细,你可以在 diff 中选中几行只暂存这些行。当一个 hunk 里混了两个不同意图时,用 selected ranges 更合适。

### Q3 · Discard Changes 安全吗?误点了怎么办?

ANS

它是高风险动作,本质是把工作树改动丢掉。误点后可以先看 Timeline 或本地历史是否还能找回;如果改动已经 commit,用 Git 恢复更稳。预防方式是:不确定就不要 discard,先 stash 或新建临时 commit 保存现场。

### Q4 · Merge Editor 里 Accept Both 是不是最保险?

ANS

不是。Accept Both 只是把两边文本都放进结果,不保证逻辑正确。冲突解决要看业务意图:两边是否互补、是否重复、顺序是否重要、是否需要改调用方。最终只相信 Result 区域,解决后运行测试。

### Q5 · Blame 会不会让团队氛围变差?

ANS

看你怎么用。好的 blame 是找上下文:这个判断当时为什么成立、关联需求是什么、谁可能知道背景。坏的 blame 是找人背锅。把它叫 annotate 或 history 也好,核心是追溯知识,不是追责。

## 复盘问题

5 QUESTIONS

1. Changes、Staged Changes、commit 三者分别对应 Git 的什么概念?
2. 什么时候应该 stage file,什么时候应该 stage hunk 或 selected ranges?
3. 提交前为什么要再看一遍 Staged Changes 的 diff?
4. Merge Editor 中 Current、Incoming、Result 分别表示什么?
5. Timeline 和 blame 分别适合回答什么历史问题?

## 今日检查清单

8 ITEMS

- 能用 ⌃⇧G / Ctrl Shift G 打开 Source Control
- 能区分 Changes 与 Staged Changes
- 每次 stage 前都会打开 diff 审查改动
- 能使用 Stage Hunk 和 Stage Selected Ranges 拆分提交
- 知道 Discard Changes 的风险,不会随手乱点
- 能用 Merge Editor 解决一个简单冲突
- 能用 Timeline 查看文件历史并恢复小误改
- 形成提交前流程: review diff → stage → review staged → precheck → commit

## 推荐阅读

3 ITEMS

OFFICIAL

### VSCode Source Control

官方 Source Control 文档。重点看 stage、commit、branch、merge、SCM provider 模型。

OFFICIAL

### VSCode Merge Editor

三方合并编辑器的官方说明。重点理解 Current、Incoming、Result 和冲突导航。

REFERENCE

### Pro Git

Git 概念仍要回到权威书。重点读 working tree、index、commit、branch、merge。

## Day 12 预告

NEXT

COMING NEXT

### IntelliSense 与 LSP

明天进入「语言服务与调试」阶段。我们会拆开 VSCode 智能能力背后的来源: hover、signature help、completion、code action、自动导入、语言服务器排错。 学完后,你会知道为什么有时智能提示很准,有时却像没睡醒。

"提交不是保存按钮,它是你给未来留下的一段可审查历史。"

DAY 11 · VSCODE 21-DAY ROADMAP
