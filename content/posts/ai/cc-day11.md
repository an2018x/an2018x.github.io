---
title: "Day 11 · 自定义 Skills — 参数化模板 · 嵌套资源 · 跨项目分发"
date: '2026-05-19'
draft: false
description: "把 Day 07 的 Skill 入门带到生产级——掌握完整 frontmatter、$ARGUMENTS 参数化、嵌套 scripts/templates 资源结构、三层分发位置和团队级跨项目复用，让团队的「祖传手艺」一键可调用。"
toc: true
tags:
  - AI
  - Claude Code
  - Skills
  - Automation
  - Tutorial
---

DAY 11 · CLAUDE CODE ROADMAP · 20 DAYS

# Skills_把团队工艺封装成命令_

Day 07 你写了第一个 Skill——今天把它推到_团队级_。 用 frontmatter 精确控制模型、agent、上下文；用 `$ARGUMENTS` 让命令接受参数； 把脚本 / 模板 / 示例组织成 _资源包_； 通过 git / plugin marketplace 让"祖传手艺"在团队和项目间一键复用。 一个 `/deploy staging` 背后，是整个团队的工程经验。

**DURATION** 75–90 min **THEORY** 25 min **HANDS-ON** 45 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 11 思维导图**
>
> - DAY 11 · 自定义 Skills
> - ANATOMY · ARGS · RESOURCES · DISTRIBUTE
> - 01 · ANATOMY
> - Skill 解剖
> - 02 · ARGUMENTS
> - 参数化模板
> - 03 · RESOURCES
> - 嵌套资源
> - 04 · DISTRIBUTE
> - 跨项目分发
> - frontmatter 字段全表
> - model / agent / context
> - allowed-tools 白名单
> - 触发模式选择
> - $ARGUMENTS 全文
> - 位置参数 $1 $2
> - 命名参数与默认
> - !`cmd` 动态注入
> - scripts/ 辅助脚本
> - templates/ 模板
> - examples/ 范例
> - README / VERSION
> - 三层位置优先级
> - git submodule
> - plugin marketplace
> - 版本管理与升级
> - 一个 / 命令背后——是整个团队的工程经验
> - SKILL.MD
> - $ARGUMENTS
> - CONTEXT FORK
> - PLUGIN

FIG M — DAY 11 KNOWLEDGE MAP · SKILLS PRODUCTION GUIDE

## Skill 完整解剖

FRONTMATTER

Day 07 写了一个最小 Skill——三行 frontmatter + 一段 prompt。 生产级 Skill 的 frontmatter 远不止这些。下面这张表把_所有可用字段_ 列清楚，每一个都对应一种行为控制能力。

### frontmatter 字段全表

| 字段 | 类型 / 取值 | 作用 |
| --- | --- | --- |
| name | string（kebab-case） | 命令名——决定 `/name` 怎么调用。必填。 |
| description | string（一句话） | 给 Claude 看的"什么场景下用"——决定自动调用是否触发。 |
| model | opus / sonnet / haiku / inherit | 该 Skill 强制使用的模型。`inherit` 跟随主会话。 |
| agent | string（agent 名） | 在指定子代理中执行——避免污染主会话上下文。 |
| context | inherit / fork / fresh | `fork` 复制主会话上下文；`fresh` 全新无历史。 |
| allowed-tools | string[] 工具白名单 | 该 Skill 只能调用这些工具——天然的安全沙箱。 |
| disable-model-invocation | boolean | `true` 时 Claude 不会自动调用，只能手动 `/cmd`。 |
| user-invocable | boolean（默认 true） | `false` 时不出现在 `/` 菜单——只供其他流程内部调用。 |
| argument-hint | string | 显示给用户看的"该命令需要什么参数"提示——出现在补全菜单里。 |

最常用的是 name / description / argument-hint，其他字段按需启用

### 生产级 Skill 模板

```
# .claude/skills/pr-review/SKILL.md
---
name: pr-review
description: 对当前 PR 做一轮自动评审——查 diff、读相关文件、给出建议
argument-hint: [severity: blocker | nit | optional]
model: sonnet
context: fork
allowed-tools:
  - Bash
  - Read
  - Grep
  - Edit
disable-model-invocation: false
---

请对当前 PR 做一轮代码评审：

1. 分析变更：
   - 运行 !`git diff origin/main...HEAD --stat`
   - 列出改动的文件和大致目的

2. 读取关键文件：使用 Read 工具读取改动量最大的 3 个文件

3. 评审输出：按以下格式给出建议
   - 🔴 BLOCKER: 必须修复才能合并
   - 🟡 NIT: 风格 / 命名 / 小问题
   - 🟢 OPTIONAL: 改进建议

4. 严重程度过滤：用户传入了 $ARGUMENTS——
   只展示 ≥ 该级别的问题（blocker > nit > optional）
```

### 触发模式三选一

MODE · 双向

### 默认（推荐）

既可以 `/pr-review` 手动调用，也允许 Claude 在合适场景自动调用。description 写得越清楚，自动调用越准。

MODE · 仅手动

### disable-model-invocation

设为 `true`——Claude 永远不会自己调用。适合"破坏性操作"，例如 `/deploy production`。

MODE · 内部

### user-invocable: false

不在 `/` 菜单里出现——只能被其他 Skill 内部调用。适合组件化复用。

## 参数化模板

DYNAMIC INPUT

硬编码的 Skill 只能做一件事——`/deploy` 永远只能部署到 staging。 用参数化把同一个 Skill 变成_一族命令_—— `/deploy staging`、`/deploy production`、 `/deploy preview --skip-tests`。

### 三种参数语法

| 语法 | 含义 | 示例 |
| --- | --- | --- |
| $ARGUMENTS | 用户在 `/cmd` 之后输入的 **所有内容（原文）** | `/explain useState 用法` → $ARGUMENTS = "useState 用法" |
| $1 / $2 / $N | **位置参数** ——按空格分隔的第 N 个 token | `/deploy staging --skip` → $1=staging, $2=--skip |
| !`shell cmd` | Skill 加载时 **执行 shell** ，结果注入 | `!`git branch --show-current`` → 当前分支名 |
| 组合用法 | 三种可以混用——参数填进 shell 命令、再注入回 prompt | `!`gh issue view $1 --json title,body`` |

### $ARGUMENTS 实战

```
# .claude/skills/explain/SKILL.md
---
name: explain
description: 用大白话解释一个函数 / 概念 / 报错
argument-hint: <函数路径 | 概念名 | 报错信息>
---

用户想知道：$ARGUMENTS

请按以下方式回答：
1. 一句话总结：先用一句口语化的话讲清楚
2. 展开：分 3-5 个要点详细说明
3. 实例：给一个最小可运行的代码示例
4. 类比：用一个生活中的类比帮助理解

如果 $ARGUMENTS 看起来是文件路径，请先用 Read 读取该文件。
```

### 位置参数 + 动态注入

```
# .claude/skills/deploy/SKILL.md
---
name: deploy
description: 部署到指定环境(staging / production)
argument-hint: <env> [--skip-tests] [--dry-run]
allowed-tools: [Bash, Read]
disable-model-invocation: true # 部署是破坏性操作,仅手动
---

## 部署到 $1 环境

当前状态：
- 分支：!`git branch --show-current`
- 最近 commit：!`git log -1 --format='%h %s'`
- 已修改文件：!`git status --short | wc -l`

部署目标：$1
额外参数：$2 $3

请按以下流程执行：

1. 前置检查：
   - 确认 $1 是 staging 或 production
   - 如果 $1 == production，要求用户二次确认
   - 检查所有测试是否通过（除非传了 --skip-tests）

2. 构建：运行 npm run build

3. 部署：
   - staging → npm run deploy:staging
   - production → npm run deploy:prod

4. 验证：等 30 秒后 curl 健康检查端点
```

位置参数适合"模式固定、参数有限"的命令；$ARGUMENTS 适合自由文本

### 参数验证与默认值

```
# .claude/skills/test-coverage/SKILL.md
---
name: test-coverage
description: 检查指定模块的测试覆盖率
argument-hint: [模块路径,默认 src/]
---

# 如果用户没传参,默认为 src/
module=${1:-src/}

请检查 $module 的测试覆盖率：

1. 运行 !`npx vitest run --coverage $module 2>&1 | tail -30`
2. 列出覆盖率 < 80% 的文件
3. 对前 3 个文件给出补充测试建议
```

## 嵌套资源结构

FILE LAYOUT

复杂的 Skill 不只是一个 `SKILL.md`—— 它可以是一整个_资源目录_： 模板文件、辅助脚本、参考示例、README 文档。 Claude 在执行时可以引用这些资源，让 Skill 变成可携带的"工程包"。

### 典型目录结构

```
# .claude/skills/scaffold-component/
scaffold-component/
├── SKILL.md # 主入口（必需）
├── README.md # 给人看的使用说明
├── VERSION # 版本号(可选,便于追踪)
├── templates/ # 模板文件
│ ├── Component.tsx.tpl
│ ├── Component.test.tsx.tpl
│ └── Component.stories.tsx.tpl
├── scripts/ # 辅助脚本
│ ├── render.sh # 渲染模板
│ └── validate-name.sh # 校验组件名
├── examples/ # 输入输出示例
│ ├── input.md
│ └── output/
└── docs/ # Skill 内部参考文档
    └── conventions.md
```

### 资源引用方式

> **图：Skill 资源引用**
>
> - SKILL.MD
> - 主入口
> - TEMPLATES/
> - Read templates/x.tpl
> - SCRIPTS/
> - !`./scripts/x.sh`
> - EXAMPLES/
> - Few-shot 提示
> - DOCS/
> - 人/Claude 参考

FIG 03 · SKILL RESOURCE LAYOUT — TEMPLATES · SCRIPTS · EXAMPLES · DOCS

### 引用规则

RULE · 01

### 模板用 Read 读取

SKILL.md 里写 `请用 Read 读取 templates/Component.tsx.tpl 作为基础模板`——Claude 会进入 skill 目录解析相对路径。

RULE · 02

### 脚本用 ! 反引号

用 `!`./scripts/render.sh $1 $2`` 把脚本输出注入 prompt。脚本必须有可执行权限。

RULE · 03

### examples/ 是 few-shot

在 SKILL.md 里 `参考 examples/input.md → examples/output/ 的对应关系`，让 Claude 学到风格。

RULE · 04

### VERSION 与 README 给人看

VERSION 一行版本号便于升级追踪；README 写给团队成员看，不会被 Claude 自动读取，但 `/cmd --help` 可以输出。

### scaffold-component 完整示例

```
# .claude/skills/scaffold-component/SKILL.md
---
name: scaffold-component
description: 根据组件名生成 React 组件 + 测试 + Storybook 三件套
argument-hint: <ComponentName> [--with-story]
allowed-tools: [Read, Write, Bash]
---

请为组件 $1 生成三件套：

1. 校验组件名：
   !`./scripts/validate-name.sh $1`

2. 读取三个模板：
   - Read templates/Component.tsx.tpl
   - Read templates/Component.test.tsx.tpl
   - Read templates/Component.stories.tsx.tpl

3. 替换占位符：把 __NAME__ 替换成 $1，
   __name__ 替换成 camelCase 形式

4. 写入文件：
   - src/components/$1/$1.tsx
   - src/components/$1/$1.test.tsx
   - src/components/$1/$1.stories.tsx（仅当参数含 --with-story）

5. 参考：examples/Card/ 是一个完整的输出样例,可以对照风格
```

## 跨项目分发与复用

DISTRIBUTION

Skill 的真正价值在_复用_—— 你写的 `/pr-review` 应该所有项目都能用、整个团队都能用、 甚至社区其他人也能用。Claude Code 提供了三层分发位置 + 三种分发方式，覆盖从个人到企业的所有场景。

### 三层位置（优先级从高到低）

| 位置 | 路径 | 适合什么 |
| --- | --- | --- |
| 项目级 | `.claude/skills/`（git 内） | 团队统一工作流：/pr-review、/deploy、/migrate |
| 个人级 | `~/.claude/skills/` | 个人偏好：/explain、/standup、/refactor |
| 插件级 | plugin/`skills/`（marketplace 安装） | 社区共享：/security-review、/i18n-extract |
| 优先级 | 项目 \> 个人 \> 插件 | 同名时项目级覆盖——便于团队定制社区 skill |

### 三种分发方式

WAY · 01

### Git 直接共享

Skills 放在 `.claude/skills/` 跟随项目仓库——团队成员 clone 后立即获得所有命令。最简单、最常用。

WAY · 02

### Git Submodule

把组织级共享 skills 仓库作为 submodule 引入 `.claude/skills/shared/`——多个项目共享一套基础命令，独立升级。

WAY · 03

### Plugin Marketplace

把 Skill 包装成 plugin 发布到 marketplace——任何人 `/plugin install` 即可使用，自带版本管理。Day 19 详解。

### Git Submodule 模式

```
# 组织内有一个共享 skills 仓库:
# github.com/acme/claude-skills
# 包含 /pr-review, /deploy, /security-check 等

# 在新项目中引入:
$ git submodule add git@github.com:acme/claude-skills.git \
    .claude/skills/shared

# 项目内同时保留特有 skill:
# .claude/skills/shared/ ← submodule(团队共享)
# .claude/skills/my-deploy/ ← 项目特有

# 升级共享 skill:
$ cd .claude/skills/shared && git pull && cd -
$ git add .claude/skills/shared
$ git commit -m "升级共享 skills 到 v2.3"
```

所有项目共享一份基线，各自有特化空间——平衡复用与灵活

### 版本管理

VERSION · 01

### VERSION 文件

每个 Skill 目录放一个 `VERSION` 文件（一行 SemVer），便于追踪是谁、什么时候、用哪个版本的 Skill 出了问题。

VERSION · 02

### CHANGELOG.md

团队共享的 skill 必备——记录每次 prompt 改动、新增字段、行为变化。读 changelog 能让别人无痛升级。

VERSION · 03

### 语义化 git tag

共享 skills 仓库用 `v1.2.3` 打 tag——下游项目可以 pin 到具体版本，不被上游 breaking change 拖累。

VERSION · 04

### 兼容性测试

在 examples/ 里放固定输入 → 固定输出对——CI 跑 `claude -p` 验证 Skill 行为没变。

## 高级模式

PRODUCTION CRAFT

Skill 不只是"命令"——配合 context fork、agent 隔离、与 Hook 组合， 可以构建出复杂的工程系统。下面是几个最有效的高级模式。

### Pattern A · context: fork 子代理隔离

默认 Skill 在主会话里执行，会消耗主会话的上下文窗口。 对于"长任务"（如全项目重构、深度搜索）应该用 `context: fork`—— 在独立子会话里执行， **只把最终摘要** 返回主会话。

```
---
name: deep-search
description: 在大型代码库里深度搜索某个 API 的所有用法
context: fork # ← 关键
model: haiku # 子代理用便宜模型
---

请深度搜索 $ARGUMENTS 这个 API：

1. 用 Grep / Glob 找出所有调用点
2. 对每个调用点读 5 行上下文
3. 分类：测试 / 生产 / 文档 / deprecated

最终只返回 markdown 表格摘要，不要返回完整列表。
```

主会话上下文不被污染——子代理跑完只回一个摘要

### Pattern B · Skill 调用 Skill

```
# .claude/skills/release/SKILL.md
---
name: release
description: 完整发版流程
---

请按以下步骤发版：

1. 先调用 /pr-review 做一轮自检
2. 如果无 BLOCKER:
   - 运行 npm version $1
   - 调用 /deploy production
3. 最后调用 /changelog 生成发布说明
```

Skill 内部可以引用其他 Skill ——组合出复杂流程

### Pattern C · Hook + Skill 共生

SCENE · 01

### Hook 自动调用 Skill

在 `Stop` Hook 里 `claude -p "/pr-review nit"`——Claude 每完成一轮就自动 PR 自检。两者职责清晰：Hook 触发、Skill 执行。

SCENE · 02

### Skill 内部依赖 Hook

`/deploy` Skill 假设 PreToolUse Hook 已经把"禁推 main"规则编码进去——Skill 只关心流程，Hook 只关心规则。

SCENE · 03

### Skill 触发 Hook 链

`/migrate` 调用 Write 工具→触发 PostToolUse 格式化 Hook→再触发自动测试 Hook——单个 Skill 启动整条自动化链。

SCENE · 04

### Hook 注入 Skill 上下文

UserPromptSubmit Hook 检测到用户输入 `/help`，自动调用 `/list-skills` 列出可用命令——把 help 也做成 Skill。

### 调试与热重载

```
# 列出所有可用 Skill 及其位置:
$ ls .claude/skills/ ~/.claude/skills/

# Skill 修改后立即生效 —— 无需重启会话
# 但 frontmatter 改了需要重新执行命令才会读取新值

# 在 Claude Code 内查看 skill 加载详情:
$ claude --debug
> /pr-review blocker
# stderr 会打印: 加载 .claude/skills/pr-review/SKILL.md, frontmatter 解析结果...

# 手动测试 Skill prompt 渲染结果:
$ claude -p --bare "/explain useState" --dry-run
# 输出 Skill 渲染后的完整 prompt,不真正调用 LLM
```

## Labs

4 HANDS-ON

四个递进的动手实验——从带参数的基础 Skill 到完整资源包。 预计 45 分钟，每个 Lab 完成后用 `/skill-name <参数>` 实际跑一次。

LAB · 01 · 10 MIN

### 带参数的 /explain

创建 `~/.claude/skills/explain/SKILL.md`，加上 `argument-hint` 和 `$ARGUMENTS` 占位符。试运行 `/explain useState` 和 `/explain ./src/utils/parseCSV.ts`，对比两种输入下的行为。

目标：掌握 $ARGUMENTS 与 frontmatter 基础

LAB · 02 · 12 MIN

### 位置参数 + 动态注入的 /deploy

写一个 `/deploy <env>`，用 `$1` 接收环境名、`!`git ...`` 注入当前分支和 commit。`disable-model-invocation: true` 保证只能手动调用。试 `/deploy staging` 与 `/deploy production` 对比行为。

目标：组合位置参数、shell 注入、手动模式

LAB · 03 · 13 MIN

### 资源包 /scaffold

创建一个完整的 scaffold 目录：SKILL.md + templates/Component.tsx.tpl + scripts/validate-name.sh + examples/Card/。让它能从模板生成新组件 + 测试 + Storybook 三件套。

目标：理解 Skill 作为"工程包"的组织方式

LAB · 04 · 10 MIN

### Git Submodule 团队共享

创建一个新 git 仓库 `my-claude-skills`，放进至少 2 个 skill；在另一个项目里用 `git submodule add` 引入到 `.claude/skills/shared/`，验证两个项目都能调用。

目标：跑通跨项目共享 + 版本固定模式

## 常见问题

6 FAQS

### Q · 01 · 同名 Skill 在不同层级都存在时，哪个生效？

A ·

优先级是： **项目级 \> 个人级 \> 插件级** 。这个顺序是 **故意** 这样设计的——它允许团队"覆盖"个人或社区的同名 Skill。

典型场景：插件 `acme-skills` 提供了一个 `/deploy`，但你们项目有特殊的部署逻辑——直接在 `.claude/skills/deploy/` 写一个同名 Skill，它会覆盖插件版本，团队成员不需要做任何配置。用 `/skills` 命令可以查看每个命令最终从哪里加载。

### Q · 02 · $ARGUMENTS 和 $1 $2 $3 区别在哪？什么时候用哪个？

A ·

`$ARGUMENTS` 是 **原文整体** ——用户输入什么、它就是什么字符串。适合"自由文本"场景，比如 `/explain 一段说明文字`。

`$1 $2 $N` 是 **按空格拆出来的位置参数** ——适合"模式固定"的命令，比如 `/deploy staging --skip-tests` 里 $1=staging, $2=--skip-tests。可以混用：用 $1 拿环境，用 $ARGUMENTS 拿完整原始输入。注意带空格的参数需要引号包裹，否则会被拆开。

### Q · 03 · 为什么 Claude 不自动调用我写的 Skill？

A ·

三个常见原因，按概率从高到低：(1) **`description` 写得太模糊** ——Claude 不知道什么场景下用。改成" **当用户 X 时使用此 Skill**"这种明确的触发提示；(2) 设了 `disable-model-invocation: true`——这就是关闭自动调用的开关；(3) Skill 加载失败但 Claude Code 没报错——用 `claude --debug` 看 stderr。

提升自动调用准确率的最佳实践：在 description 里写" **触发词：…**"和" **当以下情况时使用此 Skill：…**"，列举具体场景。Claude 的工具选择本质上是 LLM 的 zero-shot 分类——描述越具体越准。

### Q · 04 · Skill 里的 !`shell` 注入安全吗？

A ·

取决于 **谁能修改 Skill 文件** 。Skill 加载时会执行 frontmatter 之后的所有 `!`...``——如果攻击者能往你的 `.claude/skills/` 写文件，他就能在你启动 Claude 时执行任意命令。

三条防线：(1) Skill 目录走 **Code Review** ，跟代码一样审；(2) submodule 引入第三方 skill 时 **pin 到具体 commit** ，不要跟 master；(3) 把传入参数 **当不可信** ——绝对不要在 shell 里写 `!`rm $1``，用 `!`./scripts/validate-and-run.sh "$1"` 包一层校验。

### Q · 05 · context: fork 真的能省 token 吗？

A ·

能——但要看 Skill 设计得对不对。`fork` 的真正价值是 **主会话不被子任务的中间过程污染** ——子代理可能 Read 几百个文件来搜索，但只把"找到了 12 个用法、列表如下"返回主会话。主会话的窗口里只多了一行结果。

误用 `fork` 的两个坑：(1) 短任务也 fork——子会话冷启动反而多 1-2 秒；(2) 主任务严重依赖子任务的中间细节——结果用户还得追问"你都搜了哪些文件"，子会话已经销毁了。判断标准： **任务是否能用一段 ≤200 字摘要交付** 。能就 fork，不能就 inherit。

### Q · 06 · 写好的 Skill 怎么分享给社区？要做 plugin 吗？

A ·

分三档：(1) **小范围共享** ——直接发 git 仓库链接，让别人 clone 进 `~/.claude/skills/`；(2) **中等规模** ——做成 git submodule 模板，别人 add 即可；(3) **面向广泛社区** ——包装成 plugin 发到 marketplace（Day 19 详解），自带版本管理、依赖声明、安装提示。

判断要不要走 plugin：如果你的 Skill 只是几个 SKILL.md，git 仓库就够；如果包含多个 Skill + Hook + agent 还有版本依赖，plugin 会让用户体验好得多。看自己的 Skill 是"工具"还是"产品"。

## 复习题

5 QUESTIONS

1. 请列出至少 6 个 Skill frontmatter 字段，并说明各自的作用。
2. `$ARGUMENTS` 与 `$1 $2` 的区别是什么？分别在什么场景下首选？
3. Skill 资源目录中 templates/ / scripts/ / examples/ 三种子目录分别如何被引用？
4. 跨项目复用 Skill 的三种方式（git / submodule / plugin）各有什么权衡？
5. `context: fork` 解决了什么问题？什么场景下不应该用？

## 自检清单

8 ITEMS

- 能熟练写出 Skill frontmatter 的核心字段（name / description / model / allowed-tools / argument-hint）
- 掌握 `$ARGUMENTS` / `$1..$N` / `!`cmd`` 三种参数化语法
- 能给 Skill 加 `argument-hint` 让补全菜单显示提示
- 能用 `disable-model-invocation` / `user-invocable` 控制触发模式
- 能组织 templates/ / scripts/ / examples/ 多文件资源包
- 理解项目级 / 个人级 / 插件级三层优先级
- 能用 git submodule 在多个项目共享一套 skill 基线
- 知道何时用 `context: fork` 避免污染主会话

## 延伸阅读

3 LINKS

DOCS

### Claude Code — Skills Reference

官方 Skills 完整文档：frontmatter 字段全表、参数语法、context 模式、与 agent / hook 的集成方式。

EXAMPLE

### awesome-claude-skills

社区维护的 Skill 模板集合：scaffold-component、pr-review、changelog 生成、i18n 提取等开箱即用。

GUIDE

### Plugin Marketplace 发布指南

把 Skill 包装成 plugin 的完整流程：plugin.json 配置、依赖声明、版本管理、上架审核（Day 19 详解）。

## Day 12 预告

NEXT

COMING NEXT

### Memory 记忆系统 — 让偏好与上下文跨会话持久化

今天你封装了团队的工艺——明天将让 Claude 记住_你这个人_。 用 `/memory` 命令、MEMORY.md 索引、user / feedback / project / reference 四种记忆类型， 让 Claude 跨会话记得你的角色、偏好、纠正历史、项目背景。从此每次开会话不再从零开始—— Claude 像一个有记忆的同事。

"The best abstractions don't hide details — they let you forget them."

DAY 11 · CLAUDE CODE 20-DAY ROADMAP · AFTER ALFRED N. WHITEHEAD
