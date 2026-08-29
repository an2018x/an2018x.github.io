---
title: "Day 15 · Plan 模式 — 规划与执行分离 · 决策矩阵 · 大型重构安全网"
date: '2026-05-21'
draft: false
description: "把 Day 08 提到的 Plan 模式真正变成肌肉记忆——拆解 EnterPlanMode / ExitPlanMode 的两阶段协议、给出『何时必须先 plan』的决策矩阵、用五要素模板把方案写到能被 review、把 Plan 与 Subagent / Hooks / CLAUDE.md 串成一张大型重构的安全网。一句『直接动手』可能撞墙,一份 30 秒能读完的 plan 能省下一下午回滚。"
toc: true
tags:
  - AI
  - Claude Code
  - Plan Mode
  - Architecture
  - Tutorial
---

DAY 15 · CLAUDE CODE ROADMAP · 20 DAYS

# 先_规划_,再动手

Day 08 你第一次见到 Plan 模式——今天把它_变成肌肉记忆_。 拆开 `EnterPlanMode` / `ExitPlanMode` 两阶段协议看 Claude 内部状态怎么切换、 用一张决策矩阵判断"这次该不该先 plan"、用五要素模板把方案写到能被 review、 把 Plan 与 **Subagent / Hooks / CLAUDE.md** 串成一张大型重构的安全网。 一句"直接动手"可能撞墙重做,一份 30 秒能读完的 plan 能省下一下午回滚。

**DURATION** 80–100 min **THEORY** 30 min **HANDS-ON** 50 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 15 思维导图**
>
> - DAY 15 · PLAN 模式
> - PROTOCOL · WHEN · TEMPLATE · COMBO
> - 01 · PROTOCOL
> - 两阶段协议
> - 02 · WHEN
> - 决策矩阵
> - 03 · TEMPLATE
> - 五要素模板
> - 04 · COMBO
> - 联动安全网
> - EnterPlanMode
> - 只读 / 不写文件
> - ExitPlanMode 审批
> - Shift+Tab 切档
> - 影响 ≥ 3 文件
> - 不可逆 / 高成本
> - 需求模糊 / 多解
> - 陌生代码库
> - 目标 + 范围
> - 变更清单(文件级)
> - 风险 + 回滚
> - 验证 + 测试
> - Plan 子代理
> - PreToolUse Hook
> - CLAUDE.md 规范
> - PR description 复用
> - 把"开干"延迟 30 秒——换一下午不返工
> - READ-ONLY
> - DECISION MATRIX
> - 5 ELEMENTS
> - SAFETY NET

FIG M — DAY 15 KNOWLEDGE MAP · PLAN MODE AS AN ARCHITECTURE GATE

## Plan 模式本质

TWO-PHASE PROTOCOL

Plan 模式不是一个"暂停键"——它是 Claude 内部的一种 **受限运行态** : 只能读、不能写,只能想、不能动。两个工具切换状态、用户审批闭环—— 这是 Anthropic 设计上对"自动化"与"安全"之间的精确妥协。

### 状态机视角

> **图：Plan 模式状态机**
>
> - DEFAULT · ACT
> - 直接执行态
> - Read · Edit · Write · Bash
> - EnterPlanMode
> - Shift+Tab × 2
> - RESTRICTED · PLAN
> - 只读规划态
> - Read / Grep / Glob · 不能 Edit/Write/Bash
> - ExitPlanMode
> - 用户审批 → 执行
> - RESUME · ACT
> - 按 plan 执行
> - Edit / Write / Bash 全开
> - 用户驳回 · 修订 plan
> - PLAN MODE — TWO-PHASE PROTOCOL

FIG 01 · 三态状态机 — ACT → PLAN(只读) → 审批 → 按 PLAN 执行

### 两个工具的契约

TOOL · ENTER

### EnterPlanMode

把会话切换到 **只读模式** ——之后所有 Edit / Write / Bash(写入类) 调用都会被拒。Claude 此时只能用 Read / Grep / Glob / Agent 子代理来调研。 **不是请求用户授权——是改变运行约束** 。

TOOL · EXIT

### ExitPlanMode

已经写好 plan 后调用,把 plan 推到用户面前 **请求批准** 。用户点同意才会切回 ACT 态,然后 Claude 按 plan 逐步执行。否则继续修订 plan、不写一行真实代码。

### 为什么需要"受限态"

```
# 反例 — 没有 Plan 模式
> 把 auth 模块拆成 controller + service + repository 三层
# Claude 立刻开 Edit/Write 改 12 个文件,
# 改到一半发现 service 层应该按 domain 拆,
# 此时 12 个文件已经是一个尴尬的中间态——回滚成本高

# 正例 — 进入 Plan 模式
> 进入 plan 模式, 把 auth 模块拆成 controller/service/repository 三层
# Claude 读完 auth/ 所有文件、grep 调用关系,
# 写一份 plan: "建议按 domain 切, 而不是按层切, 因为..."
# 你 review → 调整方向 → 同意 → 才真正动 0 个文件以外的代码
```

Plan 模式不是慢——是把"想错"的成本从修改文件降到修改文字

### 三种触发方式

| 触发方式 | 怎么用 | 典型场景 |
| --- | --- | --- |
| 键盘切档 | `Shift+Tab` 两次,左下角出现 ⏵ plan mode | 对话进行中临时切——发现任务比预想复杂 |
| 提示词触发 | 直接说" **进入 plan 模式后再...**" / " **先规划再执行**" | 批处理任务,事先就知道需要规划 |
| 子代理触发 | 调 Plan 子代理:`subagent_type: "Plan"` | 主代理保留写权限,把规划工作外包到子代理 |
| 推荐节奏 | 小改 ACT 直走 · 中等改 `Shift+Tab` 切档 · 大改外包给 Plan 子代理 |

## 何时进入 Plan 模式

DECISION MATRIX

并不是每个任务都需要 plan——给三行字符串改个变量名也走 plan 就是过度仪式。 下面这张矩阵告诉你 **什么时候必须 plan、什么时候可跳过** ,以及边界场景的判断口诀。

### 四象限

> **图：Plan 模式决策矩阵**
>
> - 影响范围 / 不可逆性 ↑
> - 需求明确度 →
> - QUADRANT 1
> - 必须 Plan
> - 大型重构 · 架构变更 · 数据迁移
> - 影响 ≥ 5 文件,且需求只是一句话
> - QUADRANT 2
> - 建议 Plan
> - 批量重命名 · 全局升级依赖 · 删模块
> - 需求清楚,但范围大,先列清单
> - QUADRANT 3
> - 先 Explore
> - "这块代码在做什么" · "怎么改才合理"
> - 用 Explore 子代理调研后再判断
> - QUADRANT 4
> - 直接 ACT
> - 改 typo · 加日志 · 单文件 bugfix
> - 规划成本 \> 执行成本——别给自己加戏

FIG 02 · 决策矩阵 — 高影响 × 需求模糊度 划出 PLAN / EXPLORE / ACT

### 六条硬触发条件

TRIGGER · 01

### 影响 ≥ 3 个文件

跨文件改动一旦中途方向不对,回滚很贵。规则:超过 3 个 stage 文件,先 plan。

TRIGGER · 02

### 触碰数据 / 迁移

数据库 schema 变更、数据迁移脚本、缓存清理——不可逆动作必须先 plan,且 plan 里必须有"回滚步骤"。

TRIGGER · 03

### 需求 \< 50 字

"重构 auth"、"优化性能"、"改进用户体验"——需求越短歧义越大。先 plan 是用文字逼出隐含约束。

TRIGGER · 04

### 陌生代码库

第一次接触某个项目/模块——先用 plan 模式只读地走一圈,plan 本身就是阅读笔记。

TRIGGER · 05

### 需要 review

知道这个 PR 最终要给 senior / 跨团队 review——先 plan 让评审者在 **写代码前** 就给反馈,成本最低。

TRIGGER · 06

### 多解可能

"用 Redis 还是用本地缓存"、"WebSocket 还是 SSE"——多个合理方案时,plan 强制选型并说明取舍。

### 三种"别走 plan"的场景

SKIP · 01

### 显而易见的 typo / lint

用户已明确指出文件路径、行号、要改成什么——plan 在这里只是仪式感。直接 Edit。

SKIP · 02

### 探索性问答

"X 是怎么实现的"、"Y 怎么用"——这是阅读不是写代码,Plan 模式反而限制了你后续顺手改一行的灵活性。

SKIP · 03

### 实验性 spike

知道这段代码"写完会扔"——比如压测脚本、一次性数据修复脚本。plan 的成本回收不了。

口诀: 看不见的成本越高,plan 的价值越大;反过来 plan 是浪费

## Plan 文件五要素

TEMPLATE

一个能被 review 的 plan 长什么样?——下面这套五要素模板覆盖 95% 场景。 关键不是"全",而是 **结构稳定** :reviewer 一眼就知道哪里看目标、哪里看变更、哪里看风险。

### 结构示意

PLAN · auth-refactor-2026-05-22DRAFT

01

目标 + 范围

用一句话说清楚"做完后系统会怎样"。明确 **不做什么** ——比 "做什么" 更能防止 scope creep。

02

前置事实

列出 Claude 在 plan 阶段读到的关键事实:某文件有 N 行、某函数被 M 处调用、某接口契约长这样。reviewer 据此判断 plan 是否建立在正确事实上。

03

变更清单

**文件级** 的动作清单:新增 / 修改 / 删除 / 移动。每条标注预估行数或核心改动。这是 plan 的"心脏"——reviewer 99% 的时间花在这里。

04

风险 + 回滚

列已知风险(可能破坏哪些用例 / 已知边界没覆盖)以及回滚路径(git revert / db rollback script / feature flag)。无回滚的不可逆动作必须显式标注。

05

验证 + 测试

做完后 **怎么知道做对了** :跑哪些测试、看哪些指标、用什么命令复现。把"完成"的定义写到 plan 里,执行阶段就有终点。

五要素之外的细节都属于实现自由——别在 plan 里写函数签名,那是后面的工作

### 完整 plan 样例

```
## PLAN · auth-refactor

### 01 目标 + 范围
把 auth 模块按 domain (user / session / token) 拆分;
**不动** : db schema, public API, 错误码契约。

### 02 前置事实
- src/auth/index.ts 共 642 行, 含 31 个 export
- 调用方共 4 处: app.ts / routes/api.ts / middleware/auth.ts / tests/
- public API 在 README 第 89 行声明,需保持向后兼容

### 03 变更清单
**新建**
- src/auth/user/{index,types,service}.ts (~ 200 行)
- src/auth/session/{index,types,service}.ts (~ 150 行)
- src/auth/token/{index,types,service}.ts (~ 180 行)

**修改**
- src/auth/index.ts → 改为 re-export 聚合, 保持外部 API
- 4 处调用方: 不动 (因为 re-export 兼容)

**删除**
- 无

### 04 风险 + 回滚
- 风险 R1: token 模块依赖 session 的循环引用 → 用 type-only import 拆解
- 风险 R2: 单测 import 路径硬编码内部细节 → 不动调用方但测试可能失败
- 回滚: `git revert` 单 commit 即可, 无 db 变更

### 05 验证 + 测试
- 全部 unit test 通过: `pnpm test src/auth`
- e2e auth flow 跑通: `pnpm test:e2e auth.spec.ts`
- 启动 dev server 手动验证登录: 1 次成功 + 1 次错密码
- bundle size 不超过原 + 5%: `pnpm analyze`
```

### 让 Claude 按模板出 plan

```
# 写进 CLAUDE.md, 全局生效
## Plan 模式规范

进入 plan 模式时, plan 必须按下列五要素结构:
1. 目标 + 范围 (做什么 / 不做什么)
2. 前置事实 (源码读到的关键数据)
3. 变更清单 (文件级, 新增/修改/删除/移动)
4. 风险 + 回滚 (已知风险 + 回滚路径)
5. 验证 + 测试 (完成的定义 + 复现命令)

**禁止** : plan 阶段直接写函数实现, 那是执行阶段的事。
```

把模板沉淀进 CLAUDE.md —— Claude 每次 plan 都按这个骨架写

## 联动安全网

COMBO · SUBAGENT · HOOKS · CLAUDE.md

Plan 模式单用已经很有价值——但和前面学过的**子代理 (Day 14)**、 **Hooks (Day 10)**、**CLAUDE.md (Day 03)** 组合起来, 能搭出一张"动手前必先规划"的_物理护栏_。

### 三种联动模式

> **图：Plan 与其他能力的联动**
>
> - MAIN CLAUDE
> - 主代理(可写)
> - COMBO · A
> - Plan 子代理
> - subagent\_type: "Plan"
> - 主代理保留写, 子代理只规划
> - COMBO · B
> - PreToolUse Hook
> - 检测 Edit/Write 前是否经过 plan
> - 未规划则强制阻断
> - COMBO · C
> - CLAUDE.md 规范
> - 触发条件 + plan 模板
> - 软引导,改变模型偏好

FIG 04 · 三种联动 — A 隔离 plan 上下文 · B 物理阻断未规划写 · C 沉淀规范偏好

### 联动 A · Plan 子代理

```
# 主代理在 ACT 态, 但外包"规划"工作给 Plan 子代理
# 子代理只读, 输出 plan 文本回主代理

> 我要把 src/payment 拆成独立 service.
  先调用 Plan 子代理写一份拆分方案,我 review 后你再执行。

# 主代理内部会触发:
# 1) Agent(subagent_type="Plan", prompt="拆分 src/payment 为独立 service")
# 2) 子代理只读地调研, 返回 5 要素 plan
# 3) 主代理把 plan 呈给你审批
# 4) 你同意后, 主代理按 plan 在 ACT 态执行
```

优点: 子代理的探索过程不占用主代理上下文, 主代理只接收"压缩后"的 plan

### 联动 B · PreToolUse Hook 物理阻断

```
# .claude/hooks/require-plan.sh
# 当 Claude 在 ACT 态准备 Edit/Write 时, 检查是否经过 plan

#!/usr/bin/env bash
tool="$1" # 钩子第一个参数: 工具名
file="$2" # 第二个: 目标文件

if [["$tool" == "Edit" || "$tool" == "Write"]]; then
  # 仅对特定敏感目录拦截
  if [["$file" == src/auth/* || "$file" == migrations/*]]; then
    if [[! -f .claude/last-plan-approved]]; then
      echo "BLOCK: 此目录需先进入 plan 模式并获用户审批"
      exit 2 # 非零退出 → Claude 收到阻断信号
    fi
  fi
fi
exit 0
```

```
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": ".claude/hooks/require-plan.sh"
      }
    ]
  }
}
```

这是物理护栏 —— 即使 Claude 想跳过规划, 写就会被 shell 拒掉

### 联动 C · CLAUDE.md 沉淀触发规则

```
# CLAUDE.md 片段 —— 项目级 plan 偏好

## Plan 模式触发规则

下列任一情况, **必须先进入 plan 模式** :
- 修改 src/auth/, src/payment/, migrations/ 三个目录的任何文件
- 一次任务涉及 ≥ 3 个文件
- 任务描述含"重构 / 迁移 / 升级 / 拆分"等关键词
- 需要写 db migration / 修改公开 API

下列情况 **可直接 ACT** :
- 改 README / 注释 / 测试用例
- 单文件 bugfix 且范围 < 20 行
- typo / lint 修正
```

```
## Plan 文件五要素 # 接前面的模板要求

每次 ExitPlanMode 时, plan 必须包含:
01 目标 + 范围 ｜ 02 前置事实 ｜ 03 变更清单 ｜
04 风险 + 回滚 ｜ 05 验证 + 测试

缺任意一项, plan 视为不完整, 应继续在 plan 模式补全。
```

软规范放 CLAUDE.md —— 不强制阻断, 但改变模型默认行为

### 三者组合的安全等级

| 组合 | 力度 | 能否被绕过 | 适用场景 |
| --- | --- | --- | --- |
| 仅 CLAUDE.md | 软引导 | 能 — 模型可能忽略 | 个人项目 · 低风险 |
| CLAUDE.md + 子代理 | 建议 | 能 — 但分离了上下文 | 中型项目 · 多人协作 |
| + PreToolUse Hook | 物理护栏 | 不能 — shell 层拦截 | 生产代码 · 敏感目录 |
| 推荐组合 | 三者全开 —— 软规范 + 上下文隔离 + 物理护栏, 互相补位 |

## 反模式与防御

ANTI-PATTERNS

Plan 模式用错了, 反而比不用更慢——它需要纪律。 下面四类反模式是社区里反复出现的"plan 走过场"现象。

### 四种典型反模式

ANTI · 01

### Plan 太抽象

"重构 auth 模块, 提升可维护性"——这不是 plan, 这是工单标题。 缺 **文件级** 变更清单和 **可验证** 的完成定义。 **防御** : CLAUDE.md 强制五要素, 缺项不许 ExitPlanMode。

ANTI · 02

### Plan 一遍过批准

用户看到 plan 直接"OK 去吧"——等于没规划。 **plan 的价值在反复** : 至少要驳回一次、补一次 / 删一处, 才说明 review 有内容。 **防御** : 团队规则 — plan 必须至少修订 1 次。

ANTI · 03

### Plan 完不执行

plan 写了 200 行, 执行时 Claude 临时发挥, 改成另一套结构—— plan 沦为废纸。 **防御** : 执行阶段每完成一步对照 plan, 偏离需要二次审批, 不可"边写边改方向"。

ANTI · 04

### 小事强行 plan

改一行 typo 也走 plan 流程——仪式感拉满, 实际产出降低。 **防御** : 把 Section 02 的"该跳过"列表也写进 CLAUDE.md, 告诉 Claude 什么时候 **不** 该进 plan。

### 三条纪律

- **plan 一定要文件级** : 任何"调整结构 / 优化设计"这样的句子都不算变更清单, 必须落到具体文件路径
- **plan 一定有验证步骤** : 没"做完后跑什么测/看什么指标"的 plan, 等于没定义完成 ——这种 plan 不准批
- **plan 偏离需要二次审批** : 执行中发现 plan 错了, 退回 plan 模式重写, 不要在 ACT 态边写边改方向

### 把 plan 变成 PR 描述

```
# Plan 文档与 PR description 高度同构 —— 可以直接复用

> 把刚才审批通过的那份 plan 整理成 PR 描述:
  - 把"前置事实"改成"背景"
  - "变更清单"改成"This PR"
  - 风险/验证保留原样
  - 末尾加 Test plan checkbox

# 结果: 评审者拿到的 PR description 就是被你审批过的 plan,
# 评审节奏: 看 plan + 抽查代码
```

plan → PR description 复用 —— 把规划成本回收成评审收益

## Labs

4 HANDS-ON

四个递进的实验——从体会 plan 模式的"约束感"开始, 到把整套护栏装到自己的项目里。 预计 50 分钟, 每个 Lab 完成后用 `/status` 看模式徽章状态。

LAB · 01 · 8 MIN

### 体会"只读受限"

找一个不重要的项目, 按 `Shift+Tab` 两次进入 plan 模式, 故意要求 Claude "立刻改 README 标题"。观察 Claude 怎么婉拒、 怎么解释自己只能读不能写。 退出 plan 模式后再让它改。

目标: 亲自看到 EnterPlanMode 的"工具锁"在动

LAB · 02 · 12 MIN

### 跑通五要素 plan

选一个真实的中型重构任务(影响 ≥ 5 文件), 把 Section 03 的五要素模板贴进对话, 让 Claude 严格按结构出 plan。 review 时刻意找 3 个不足让它修订。 最后 ExitPlanMode 审批通过, 让它按 plan 执行。

目标: 体会"plan 反复修订"才是真在规划

LAB · 03 · 15 MIN

### 装 PreToolUse Hook

把 Section 04 的 `require-plan.sh` 装到你的项目, 拦截对 `src/` 下任意目录的 Edit/Write。 故意不走 plan 直接让 Claude 改一个文件 —— 看 Hook 怎么物理阻断。 然后正常走 plan 流程, 验证审批后能正常写入。

目标: 体验"软规范 → 物理护栏"的差距

LAB · 04 · 15 MIN

### plan → PR 复用

把 Lab 02 完成的 plan 用一句 prompt 转成 PR description, 走 `gh pr create` 提交。 让你的同事/朋友评审 PR, 收集他们的反馈, 对比"先 plan 评审"与"直接看代码" 的评审节奏差异。

目标: 把规划的"成本"回收成评审的"收益"

## 常见问题

6 FAQS

### Q · 01 · Plan 模式和 TodoWrite 任务列表是不是同一个东西?

A ·

不是。 **Plan 是"做什么 / 怎么做"** ——是一个一次性写好、整体被批准的方案; **TodoWrite 是"做到哪一步"** ——是任务执行期间的状态追踪, 颗粒度细很多。

正确的协作姿势: 在 Plan 模式里产出 5 要素 plan → ExitPlanMode 审批通过 → 回到 ACT 态后, 用 TodoWrite 把 plan 中的"变更清单"拆成可勾选的 todo 项 → 边执行边勾掉。 两者一个负责 **规划质量** , 一个负责 **执行透明度** , 不冲突。

### Q · 02 · 进了 plan 模式以后, Claude 还能跑 Bash 吗?

A ·

能跑 **只读** 的 Bash: `ls / cat / grep / git log / git diff / wc` 这些不改文件系统的命令是允许的——它们是 Claude 在 plan 阶段调研代码的关键工具。 写入类命令(`echo > file` / `git commit` / `npm install`) 会被拒。

边界场景: `git checkout -b new-branch` 创建分支算"写"还是"读"? 实测会被拒。 如果 plan 阶段需要在 worktree 里验证, 推荐用 **Plan 子代理 + 主代理保持 ACT 态** 的组合 —— 子代理只读规划, 主代理保留写权限做必要的环境准备。

### Q · 03 · 每次都要写五要素 plan 是不是太重?

A ·

五要素是 **结构上限** , 不是字数下限——小任务每项可以一行带过。 一份合格的小型 plan 大概 80–120 字, 写完不到 1 分钟; reviewer 30 秒就能扫完。 真正"重"的是你抗拒规划的心理成本, 不是规划本身的时间成本。

另一个心态调整: 你不是在 **额外** 写 plan, 你只是把本来要在脑子里过的内容 **留在文字里** 。同等的思考无论如何都要发生 —— 区别只是有没有沉淀下来供 review 和复盘。

### Q · 04 · 用户驳回了 plan, Claude 怎么修订? 上下文会不会丢?

A ·

不会丢——驳回后 **仍在 plan 模式** , Claude 拥有上轮 plan 的完整上下文 + 你的反驳意见。 它会基于你的反馈在原 plan 上做 **增量修订** 而非重写, 然后再次调用 ExitPlanMode。 你可以驳回任意次数, 直到对方案满意。

实操技巧: 驳回时不要说"不对, 重写", 而要说" **R1 风险没列, 请补**" / " **不要动 routes/, 这是约束**"——具体反馈才能让 Claude 收敛得快。 模糊的"不行"会让 Claude 漫无目的地大幅改方向, 反而浪费一轮。

### Q · 05 · 能不能让 Plan 模式自动开?——我经常忘记按 Shift+Tab

A ·

有三层办法, 自动化程度递增: (1) **CLAUDE.md 触发规则** ——在项目级或全局规范里写"涉及 X 时必须 plan", 软引导模型自己 EnterPlanMode; (2) **UserPromptSubmit Hook** ——在你发 prompt 时检测关键词("重构/迁移/拆分"), 自动追加"请先进入 plan 模式"; (3) **PreToolUse Hook** ——在敏感目录的 Edit/Write 前做物理拦截, 没 plan 就 exit 2。

推荐组合: CLAUDE.md 兜底意图 + PreToolUse 兜底误触, 中间不需要 UserPromptSubmit。 这样模型主动 plan + 你忘的时候被拦截, 双保险。

### Q · 06 · Plan 模式和 ExitPlanMode 的关系——是不是必须显式调?

A ·

是的, 退出 plan 模式只能通过 `ExitPlanMode` 工具——它本身既是工具调用, 也是 **用户审批门** 。 Claude 不能"自己决定 plan 写完了就开干", 必须显式弹出审批界面, 由用户点同意才会切回 ACT 态。这是 Plan 模式安全设计的关键约束: **规划与执行之间永远有一个人在场** 。

有趣的边界: 如果你按 `Shift+Tab` 手动退出 plan 模式(不经过 ExitPlanMode), Claude 也会切回 ACT 态——但这条路径下 plan 不会作为"已审批方案"被记录, 也不会触发我们说的"按 plan 执行"流程。换言之, 想让 plan 真正生效, 一定要走 ExitPlanMode。

## 复习题

5 QUESTIONS

1. EnterPlanMode 与 ExitPlanMode 的契约分别是什么? 为什么 Plan 模式需要"受限态"而不仅仅是"先想后写"的提示?
2. 用决策矩阵的四象限说出"必须 plan / 建议 plan / 先 Explore / 直接 ACT"各自对应什么场景, 各举一个例子。
3. plan 文件的五要素是什么? 缺哪一项最致命, 为什么?
4. Plan 与 Subagent / PreToolUse Hook / CLAUDE.md 各自能解决什么问题? 怎样的组合算"完整安全网"?
5. 说出至少三种 plan 反模式, 每种给出对应的防御措施。

## 自检清单

8 ITEMS

- 能解释 Plan 模式是"受限运行态", 不是简单的"先思考"提示
- 记住 EnterPlanMode / ExitPlanMode 两阶段协议与三态状态机
- 能用决策矩阵在 30 秒内判断"这次任务该不该 plan"
- 能按五要素模板写出一份 reviewer 能 30 秒看完的 plan
- 知道 plan → PR description 的复用技巧, 减少评审重复
- 装过至少一次 PreToolUse Hook 做物理护栏
- 能在 CLAUDE.md 里沉淀 plan 触发规则 + 五要素结构
- 识别 plan 四种反模式 + 三条纪律(文件级 / 有验证 / 偏离重批)

## 延伸阅读

3 LINKS

SPEC

### Claude Code · Plan Mode 官方文档

Anthropic 官方对 EnterPlanMode / ExitPlanMode 协议的定义、键盘切档行为、与子代理协作的边界条件。Day 15 的权威参考。

PRACTICE

### 《Working Backwards》 — Amazon PR/FAQ 流程

"写完一份完整文档再决定要不要做"这个理念的源头之一。Plan 模式的精神原型——把规划成本前置以避免执行成本浪费。

TEAM

### Anthropic Engineering — Plan-First Workflow

Anthropic 内部团队如何把 Plan 模式融入 PR 工作流, 包括 plan 模板、评审检查表、CLAUDE.md 沉淀的真实案例。

## Day 16 预告

NEXT

COMING NEXT

### 自动化工作流 — /loop 循环 · Cron 定时任务 · 后台执行 · Monitor 监控

今天 Claude 学会了_三思而后行_——明天它将 _日夜不停_。 用 `/loop` 让任务自我调度、用 Cron 把 plan 模板 + 子代理串成定时巡检、 用 Monitor 流式订阅长跑日志、用 run\_in\_background 让重活在你睡觉时也在推进。 Phase 4 的最后一天 —— 完成"高级模式"四件套的闭环。

"Hours of planning can save you weeks of programming."

DAY 15 · CLAUDE CODE 20-DAY ROADMAP · DAN ARIELY
