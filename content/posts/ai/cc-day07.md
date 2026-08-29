---
title: "Day 07 · 搜索与导航 — grep · glob · 符号查找 · 跨文件追踪"
date: '2026-05-16'
draft: false
description: "在大型代码库里精准找到目标——掌握 Grep/Glob/Bash find 工具家族的取舍、正则与路径模式技巧、符号定义与引用查找、跨文件追踪 callers/callees,以及何时让 Explore agent 帮你做开放式探索。导航不熟,改一个函数都可能漏改五处。"
toc: true
tags:
  - AI
  - Claude Code
  - Navigation
  - Search
  - Tutorial
---

DAY 07 · CLAUDE CODE ROADMAP · 20 DAYS

# 搜索与导航_在迷宫里精准找到目标_

一个 50 万行的代码库里改一个函数——_导航_不熟， 你会漏改 5 处、改错 2 处、看不见的 1 处会在生产爆炸。 今天教 Claude 怎么用 `Grep` / `Glob` / `Bash find` 工具家族； 怎么用正则与路径模式精准过滤；怎么追踪函数定义、引用、调用链； 什么时候自己直接搜、什么时候让 `Explore agent` 替你做开放式探索。

**DURATION** 75–90 min **THEORY** 20 min **HANDS-ON** 50 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 07 思维导图**
>
> - DAY 07 · 搜索与导航
> - TOOLS · PATTERNS · SYMBOLS · EXPLORE
> - 01 · TOOLS
> - 工具家族
> - 02 · PATTERNS
> - 模式与正则
> - 03 · SYMBOLS
> - 符号查找
> - 04 · EXPLORE
> - 代码库探索
> - Grep 内容搜索
> - Glob 路径模式
> - Bash find / fd
> - Read 精读 + 范围
> - 正则锚点 \\b $
> - -A / -B 上下文
> - type / glob 过滤
> - 多关键词组合
> - function / class 定义
> - callers / callees
> - import / export 关系
> - 类型流转追踪
> - Explore agent 调用
> - 广度参数 quick/medium
> - 何时直搜 / 何时分身
> - 上下文预算
> - 导航准 = 改对 · 找全 · 不漏 · 改完心里有数
> - GREP
> - \*\*/\*.TS
> - CALLERS
> - EXPLORE AGENT

FIG M — DAY 07 KNOWLEDGE MAP · CODEBASE NAVIGATION TOOLKIT

## 搜索工具家族

FIVE TOOLS

Claude Code 把搜索拆成 **三件功能不同的工具** —— `Grep` 找内容、`Glob` 找路径、`Bash` 兜底什么都能干。 用对工具是导航的第一性原理：用错了不仅慢,还会找不全。

### 三件工具的职责分工

| 工具 | 职责 | 典型查询 | 不擅长 |
| --- | --- | --- | --- |
| Grep | 在文件内容里搜 **正则模式** | 找所有 `useState` 用法 | 路径模糊查找 |
| Glob | 按 **路径模式** 列出文件 | 列出所有 `**/*.test.ts` | 查文件内容 |
| Bash find | 带 **条件组合** 的文件搜索 | "7 天内修改 + 大于 100KB" | 跨文件内容关联 |
| Read | 精读已知路径的 **具体内容** | 看 `src/auth/login.ts` 第 50–80 行 | 开放式查找 |
| Explore agent | 开放式 **跨文件探索** (子代理) | "权限验证逻辑都在哪儿?" | 精确定位 |

命中规则： **知道关键词 → Grep · 知道路径 → Glob · 知道路径 + 想看内容 → Read · 啥都不知道 → Explore agent**

### Grep 关键参数

```
# 1. 最简单 — 找出现 useState 的所有文件
Grep pattern: "useState"

# 2. 限定路径 + 文件类型
Grep pattern: "useState", glob: "src/**/*.tsx"

# 3. 看上下文 (前 2 行 + 后 5 行)
Grep pattern: "useState", -B: 2, -A: 5,
     output_mode: "content"

# 4. 大小写不敏感 + 限制结果数
Grep pattern: "todo", -i: true, head_limit: 50

# 5. 多行匹配 (跨换行的 import)
Grep pattern: "import\\s+\\{[\\s\\S]*?Logger",
     multiline: true
```

### 三种 output\_mode

MODE · 01

### `files_with_matches`

默认模式 — 只列 **匹配的文件路径** 。最省 token。当你只想知道"有哪些文件涉及 X"时用这个。

MODE · 02

### `content`

列出 **每条匹配的具体行** (像 grep 默认行为)。配合 `-A` / `-B` 参数看上下文。需要看代码细节时用。

MODE · 03

### `count`

每个文件的 **匹配数量** 。用于评估"哪个文件用得最多"——决定下一步精读哪一个。

### Glob 路径模式

```
# Glob 支持双星号递归与逗号分组

Glob pattern: "src/**/*.ts" # src 下所有 ts
Glob pattern: "**/*.{test,spec}.ts" # 所有 test/spec 文件
Glob pattern: "src/!(node_modules)/**/*.ts" # 排除 node_modules
Glob pattern: "docs/*.md" # 仅 docs 直接子文件

# 结果按 mtime 倒序 — 最近改的优先
# 结果数太多时,先看最近的几个通常足够
```

## 模式与正则技巧

REGEX CRAFT

"搜索找不到"——99% 是模式写错了,不是它不存在。 下面是把 Grep 用准的 5 个常见技巧。

### 常见陷阱

TRAP · 01

### 没加单词边界

`user` 会匹配到 `username` / `user_id` / `UserService`——你可能只想要 **独立的** `user`。用 `\\buser\\b` 锚定单词边界。

TRAP · 02

### 特殊字符没转义

`user.name` 中的 `.` 是正则通配符——会匹配 `user_name` 等。要找字面点必须 `user\\.name`。

TRAP · 03

### 多行模式忘开

跨行的 `import {\\n A,\\n B\\n}` 单行模式匹配不到。涉及跨行结构必须 `multiline: true` + 用 `[\\s\\S]` 替代 `.`。

TRAP · 04

### 大小写默认敏感

找 `TODO` 时 `todo` / `Todo` 都漏掉。加 `-i`(case insensitive)。

### 高频正则模板

```
# 1. 函数定义(JS/TS)
"^(export\\s+)?(async\\s+)?function\\s+myFunc\\b"
"const\\s+myFunc\\s*=\\s*(async\\s*)?\\(" # 箭头函数

# 2. 类方法定义(无 function 关键字)
"^\\s+(async\\s+)?myMethod\\s*\\("

# 3. import 该模块
"from\\s+['\"][^'\"]*myModule['\"]"

# 4. 函数调用(排除定义)
"\\bmyFunc\\s*\\(" + 配合 -v 排除定义文件

# 5. TODO / FIXME / XXX 三类待办
"\\b(TODO|FIXME|XXX|HACK)\\b" + -i

# 6. 跨行 try-catch 块
"try\\s*\\{[\\s\\S]*?\\}\\s*catch" + multiline

# 7. 类型定义(TS interface / type)
"^(export\\s+)?(interface|type)\\s+UserProfile\\b"
```

### 两步搜索 — 缩小范围

大型仓库一次搜可能命中几千行——分两步收敛比一次搞定更高效。

```
# 第 1 步: 找出涉及 X 的文件(files_with_matches)
Grep pattern: "PaymentService",
     output_mode: "files_with_matches"
# 输出: 17 个文件

# 第 2 步: 在这些文件里精确找定义
Grep pattern: "^(export\\s+)?class\\s+PaymentService\\b",
     glob: "src/payments/**",
     output_mode: "content"
# 输出: 1 处定义 + 文件路径,可直接跳到 Read
```

先 files\_with\_matches 探规模 · 再 content 精读 — 这是最省 token 的搜索范式

### find 兜底场景

```
# Grep / Glob 不擅长的:基于 metadata 的查找

# 1. 最近 1 小时改过的文件
$ find . -type f -mmin -60 -not -path './node_modules/*'

# 2. 大于 1MB 的源码文件(找该拆的大文件)
$ find src -type f -size +1M -name '*.ts'

# 3. 空文件 / 只有声明没实现的文件
$ find src -type f -size -100c

# 4. 软链 / 死链
$ find . -type l -! -exec test -e {} \\; -print

# 5. 修改时间组合 — 上周改过 + 今周没动
$ find . -mtime -14 -mtime +7 -name '*.go'
```

## 符号定义与跨文件追踪

SYMBOL TRAVERSE

"改一个函数前要先看谁在调它"——这是_影响面分析_的核心。 没有 LSP 的纯文本搜索做不到 100% 精确,但 **三步法** 可以让你在 2 分钟内 画出函数的完整使用图。

### 三步法 · 找完整影响面

> **图：符号追踪三步法**
>
> - STEP · 01
> - 定位定义
> - function|class|interface
> - STEP · 02
> - 列出 callers
> - name( + 排除定义
> - STEP · 03
> - 对每个 caller 看上下文
> - 分类: 测试 / 生产 / deprecated
> - 改函数前先做完这三步 — 没做就动手等于赌博

FIG 03 · IMPACT ANALYSIS — DEFINE → CALLERS → CONTEXT

### 实战:重命名 `getUser`

```
# Step 1 — 找定义
Grep pattern: "^(export\\s+)?(async\\s+)?function\\s+getUser\\b",
     output_mode: "content"
# 输出: src/auth/user.ts:42 — function getUser(id: string)

# Step 2 — 找 callers (调用 + 排除定义文件)
Grep pattern: "\\bgetUser\\s*\\(",
     output_mode: "content",
     -n: true
# 输出 23 处调用 — 含定义本身,需手动排除

# Step 3 — 对每个 caller 取上下文
Grep pattern: "\\bgetUser\\s*\\(",
     -A: 3, -B: 1,
     output_mode: "content"
# 看 callers 在做什么 — 有的是测试,有的是 fallback

# Step 4 — 找类型流转(被赋给什么类型变量)
Grep pattern: "const\\s+\\w+\\s*=\\s*await\\s+getUser"
# 看返回值都被怎么消费
```

### import / export 关系图

```
# 找谁在 import 这个模块
Grep pattern: "from\\s+['\"][^'\"]*payments/index['\"]"

# 找这个模块 export 了哪些符号
Grep pattern: "^export\\s+(const|function|class|type|interface)",
     glob: "src/payments/index.ts",
     output_mode: "content"

# 找循环依赖嫌疑(A 引 B + B 引 A)
Grep pattern: "from\\s+['\"]./auth", glob: "src/user/**"
Grep pattern: "from\\s+['\"]./user", glob: "src/auth/**"
# 两个都有命中 → 大概率循环依赖
```

### 跨语言查找速查表

| 目标 | JS / TS | Python | Go |
| --- | --- | --- | --- |
| 函数定义 | `function\\s+name\\b` | `def\\s+name\\b` | `func\\s+(\\w+\\s+)?name\\b` |
| 类定义 | `class\\s+Name\\b` | `class\\s+Name\\b` | `type\\s+Name\\s+struct` |
| 导入语句 | `from\\s+['\"][^'\"]*name` | `(from\|import)\\s+name` | `['\"][^'\"]*name['\"]` |
| 方法调用 | `\\.name\\s*\\(` | `\\.name\\s*\\(` | `\\.name\\s*\\(` |
| 关键差异 | JS/TS 有 `const = ()` 箭头函数变体 · Python 装饰器要单独搜 `@name` · Go 接收器要 `func (r *T)` |

## Explore agent — 何时让分身去找

DELEGATE

自己直接搜适合_已知关键词_的精确查找。 一旦目标模糊（"权限验证逻辑都在哪?"、"哪些地方处理了 race condition?"） 或者要查 5+ 处不同方向——把任务交给 `Explore agent` 更高效。

### 直搜 vs 派 Explore 决策表

| 场景 | 直接搜 | 派 Explore agent |
| --- | --- | --- |
| 已知函数名 / 类名 | ✓ Grep 一发命中 | ✗ 杀鸡用牛刀 |
| 查 1-2 处定义/引用 | ✓ 三步法即可 | ✗ 不必要 |
| "哪儿做了 X?"模糊语义 | ✗ 关键词不全 | ✓ 它会试多个查询 |
| 5+ 处分散在多目录 | ✗ 主上下文塞不下 | ✓ subagent 摘要返回 |
| 需要看完整文件再判断 | ✗ 主会话被污染 | ✓ 子代理只回结论 |
| 代码评审 | ✗ 用专门的 code-reviewer agent (Day 14) |

### Explore agent 调用模板

```
# 在 Claude Code 主会话里,可以这样让它调 Explore:

> 用 Explore agent 帮我找一下:
  权限验证逻辑都分布在哪些文件里? 是用中间件还是装饰器?
  搜索广度: medium

# Claude 会调起 subagent_type=Explore 的子代理
# 子代理在隔离上下文里跑多次 Grep / Glob / Read
# 主会话只收到一份总结报告
```

### 三档广度参数

QUICK

### 单点查找

1-2 次搜索就够了。比如"`authMiddleware 在哪定义?`"——但你不太确定关键词。

MEDIUM (默认)

### 中等探索

3-5 次搜索,试几个不同查询。"`权限验证都在哪?`"这种模糊问题。

VERY THOROUGH

### 多角度全面查

跨多个命名风格 / 多个目录约定。"`哪些地方做了 retry 逻辑?`"——可能叫 retry / again / backoff / repeat。

### Explore 不该做的事

NOT · 01

### 代码评审 / 审计

Explore 是 **定位工具** 不是 **判断工具** 。代码质量、设计审查用 code-reviewer agent (Day 14)。

NOT · 02

### 跨文件一致性检查

"全项目命名风格是否一致"——它读的是 **片段** 不是 **完整文件** ,容易遗漏。这种交给主会话+ Read 全文。

NOT · 03

### 编辑 / 修改文件

Explore agent **没有 Edit 权限** ——只读探索。改代码必须回到主会话。

NOT · 04

### 开放式设计问题

"如何重构这个模块"是 **架构判断** ,不是定位。用 Plan agent (Day 15)。

### 主会话 vs Explore 的上下文边界

> **图：主会话与 Explore**
>
> - 主会话上下文
> - 完整任务历史
> - · 用户原始问题
> - · 之前的 Read / Edit 结果
> - · 关键决策点
> - + Explore 返回的摘要
> - EXPLORE 子上下文 (隔离)
> - 大量 Grep / Glob / Read
> - · 搜了 8 个不同关键词
> - · 读了 23 个文件片段
> - · 试了 3 种命名约定
> - → 最终只返回 200 字摘要给主会话

FIG 04 · CONTEXT ISOLATION — EXPLORE 干脏活,主会话只看摘要

## 大型代码库的导航策略

SCALING UP

50 万行 monorepo 的导航和 5000 行小项目完全不同—— 工具链一样,但 **策略** 必须升级。

### 5 条经验法则

- **先拓扑后内容** ——大库先用 Glob 摸目录结构(`**/package.json` 看子项目分布),建立心智模型再下手 Grep
- **用 monorepo workspace 边界** ——只搜你关心的 workspace,`apps/web/ **/*.ts` 比 `** /*.ts` 快 10 倍且更准
- **排除生成代码** ——`dist` / `build` / `.next` / `node_modules` 默认忽略,但 ` __generated__ ` / `*.pb.go` 容易混入
- **分层搜索** ——先在 `src/` 找业务逻辑,再到 `packages/` 找共享库,最后看 `infra/` 配置层
- **记住"形状"而非"内容"** ——大库要记 **"这类逻辑通常在哪个目录约定下"** (如 `**/services/*Service.ts`),命中率比记具体名字高

### Token 预算管理

BUDGET · 01

### head\_limit 控量

查"找一下 useState 用法"时加 `head_limit: 30`——前 30 个例子足以判断模式,不需要 800 行全量。

BUDGET · 02

### files\_with\_matches 优先

开放探索阶段先用这个 mode 看分布,只在确定要精读时才换 content。前者 token 是后者的 1/20。

BUDGET · 03

### Read 时指定行范围

已知第 300 行附近有目标,用 `Read(file, offset: 280, limit: 60)`——别 Read 整个 2000 行文件。

BUDGET · 04

### 大查询交给 Explore

预计要读 10+ 文件才能回答的问题——直接派 Explore agent,主会话只承担最终决策。

### 缓存与思维模型

第二次找同一类东西时, **不要再搜一遍** ——把上次的结论 **记下来** 。 Day 12 的 Memory 系统是天然的代码库导航 cache:

```
# 第一次摸清楚后,存成 reference 类 memory:
> 记一下: 项目的认证逻辑分布在
  - src/auth/middleware/ — Express 中间件
  - src/services/auth.ts — 业务层
  - packages/shared/jwt.ts — 共享 JWT 工具
  下次问"权限"相关问题先看这三个位置,再扩展搜索

# Claude 会保存为 reference memory
# 之后再问类似问题,Claude 直接定位,无需重新探索
```

代码导航是高度可复用的脑力活——第二次不该再花同样时间

## Labs

4 HANDS-ON

四个递进的实验——从最基础的 Grep 用法到完整的影响面分析。 预计 50 分钟，全部在你最熟的项目里完成,效果最好。

LAB · 01 · 10 MIN

### 三种 output\_mode 对比

选一个项目里频繁出现的关键词(如 `useState` / `logger`)。分别用 `files_with_matches` / `content` / `count` 三种 mode 跑一次。对比结果与各自的 token 消耗,体会"该用哪种"。

目标：建立 mode 与 token 消耗的直觉

LAB · 02 · 12 MIN

### 正则陷阱排雷

挑一个常见单词(如 `user` / `id`)。先不带边界搜——记下结果数;再加 `\\b` 边界重搜——结果数差几倍?最后加 `-i` 看大小写差异。把这次的"差异"写进 memory 当 feedback。

目标：身体记住"边界 + 大小写"两个高频陷阱

LAB · 03 · 15 MIN

### 影响面三步法实战

选一个项目里你想重命名的函数。按" **定位定义 → 列 callers → 看 caller 上下文**"完整跑一遍。最后画一个简单 ASCII 图列出 callers 分类(测试 / 生产 / 已废弃)。

目标：掌握重构前必做的三步法

LAB · 04 · 13 MIN

### Explore 派活实战

给 Explore agent 一个模糊问题: "**项目里所有处理 retry / 重试逻辑的位置, 它们用了什么策略 (固定间隔/指数退避/jitter)?**"——观察它探索多少次、用了哪些关键词、最终返回的摘要质量。把好的查询记下来。

目标：体会 Explore 与直搜的边界与协作

## 常见问题

6 FAQS

### Q · 01 · Grep 工具和直接 `bash grep` / `rg` 有什么区别?

A ·

底层都基于 `ripgrep`(rg),输出能力一致。区别在 **权限与上下文管理** : (1) Grep 工具是 Claude Code 的 **原生工具** ,自动遵循项目的 `.gitignore` / 隐藏文件规则,Bash 的 grep 不一定有这些默认；(2) Grep 工具的输出会被 Claude Code **结构化解析** ,token 占用更可控,Bash 输出全是原始文本；(3) Grep 工具有 `multiline`、`output_mode` 等专门为 LLM 优化的参数。

选择: **能用 Grep 工具就别用 Bash grep** ——除非你需要 Bash 的管道组合(如 `rg ... | sort | uniq -c`)。

### Q · 02 · 为什么 Glob 找的文件顺序看起来很乱?

A ·

不是乱——是 **按 mtime 倒序** 。最近修改的在前,远古文件在后。这是为 LLM 调试场景优化的:你大概率关心" **最近改动了什么**"。

如果想要按字母序,在 `head_limit` 之后用 Bash `sort` 处理。但通常按时间序更有用——能直接看到"哪些文件最近被动过",对应近期的功能或 bug。

### Q · 03 · 查 callers 时找到的"假阳性"太多怎么办?

A ·

纯文本搜索的固有限制——它无法分辨同名变量。三个收敛技巧: (1) **加调用语法** : `\\bgetUser\\s*\\(` 比纯 `getUser` 准很多,因为只匹配后跟左括号的;(2) **限定 import 来源** : 先 Grep `from ['"]\\./auth/user` 找到所有引入文件,再在这些文件里搜调用;(3) **排除已知误报路径** : `glob: "src/ **/*.ts"` + 排除 `** /*.test.ts` 减少测试噪音。

真要 100% 精确——只能上 LSP 工具(如 typescript-language-server),纯文本永远是 **逼近** 不是 **精确** 。但 95% 准对 99% 场景已经足够。

### Q · 04 · Explore agent 返回的结果不靠谱——经常漏掉关键文件?

A ·

Explore 的局限是它 **读片段不读全文** ——某些跨文件信息会漏。三个改善方法: (1) **把广度调到 thorough** ——让它多试几个关键词;(2) **给它命名提示** : "可能叫 retry / backoff / again / repeat,试这几个";(3) **分两步** : 第一次 Explore 拿主线索,主会话用 Read 看完整文件确认。

对"我不能漏一个"的场景(比如重构前找所有调用),不要单靠 Explore——必须用三步法手动跑一遍 Grep。Explore 适合 **"知道大概有多少"** 不适合 **"必须找全"** 。

### Q · 05 · 大型 monorepo 里搜索奇慢——怎么提速?

A ·

三个优化方向: (1) **用 glob 锁定 workspace** : `apps/web/ **/*.ts` 而非全量 `** /*.ts`——大多数搜索不该跨整个 monorepo;(2) **type 过滤** : `type: "ts"` 比 `glob: "**/*.ts"` 略快(rg 内部优化);(3)**排除大目录**: 在项目根加 `.ignore` 文件列出 ` __generated__ /` / `vendor/` / `fixtures/` 这类大但少看的目录,Grep 自动遵守。

另外: **第一次搜索后把"形状"记下来** (Day 12 Memory)——下次直接定位,不要重新全量搜。

### Q · 06 · 何时该让 Claude 自己探索, 何时该自己写好 Grep 让它执行?

A ·

分水岭是 **"你能否一句话写清楚关键词"** 。能——直接给 prompt: "`用 Grep 找 useState 在 src/components/ 下的所有用法`",最准最快;不能——把意图给 Claude 让它自己选关键词,或派 Explore agent。

有个反直觉的事实: **有经验的开发者亲手写 Grep 几乎总是更快** 。Claude 不知道你项目里"权限逻辑通常以 ensureXxx 开头"这类隐性约定,而你知道。所以 **不熟的代码库** 让 Claude/Explore 探, **熟的代码库** 你直接给精确查询——把 Claude 用作执行器而不是探索器。

## 复习题

5 QUESTIONS

1. Grep / Glob / Bash find / Read / Explore agent 五种工具的职责分工是什么? 给一个"该用哪个"的判断口诀。
2. "两步搜索"指什么? 它在 token 预算上有什么优势?
3. 查函数 callers 时为什么要用 `\\bname\\s*\\(` 而不是纯关键字 `name`?
4. 什么场景下应该派 Explore agent? 什么场景下反而不该用它?
5. 大型 monorepo 搜索慢——给出至少 3 条提速策略。

## 自检清单

8 ITEMS

- 能根据问题在 Grep / Glob / Bash find / Read / Explore 之间正确选工具
- 能熟练使用 Grep 的 output\_mode / multiline / -A -B / glob / type 参数
- 掌握"两步搜索":先 files\_with\_matches 探规模,再 content 精读
- 会用 `\\b` 单词边界 / `-i` 大小写不敏感避开常见正则陷阱
- 能跑通"定位定义 → 列 callers → 看 caller 上下文"三步法
- 对 JS/TS/Python/Go 都能写出函数定义 / 类定义 / 导入语句的常用正则
- 会判断何时该派 Explore agent,何时直接搜更高效
- 建立了"先记形状再记内容"的 monorepo 导航习惯

## 延伸阅读

3 LINKS

DOCS

### Claude Code — Search Tools

官方 Grep / Glob / Bash / Read 工具完整参数文档,以及它们的搜索语义与权限规则。

REFERENCE

### ripgrep User Guide

Grep 工具底层基于 ripgrep——掌握 rg 的高级语法(PCRE2 / Unicode / smart-case)能让搜索能力更强。

PATTERN

### Codebase Navigation Patterns

大型项目里通用的导航模式集——目录约定、命名前缀、按层分搜、impact analysis 范式。

## Day 08 预告

NEXT

COMING NEXT

### 多文件操作与任务追踪 — 批量重构 · TodoWrite · 大型变更管理

今天你学会了精准定位——明天教 Claude 怎么_同时改 17 个文件_而不出错。 MultiEdit 同文件多点编辑、跨文件批量重构的安全模式、用 TodoWrite 把大型变更切成可恢复的步骤、 失败时如何从中间状态继续而不重来。 改一个函数和改一整片相关函数,所需的工程纪律完全不同。

"Premature optimization is the root of all evil — but knowing where to look is half the battle."

DAY 07 · CLAUDE CODE 20-DAY ROADMAP · AFTER DONALD KNUTH
