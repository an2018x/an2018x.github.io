---
title: "Day 06 · 调试与测试 — 错误诊断 · 测试生成 · TDD 工作流"
date: '2026-05-16'
draft: false
description: "把报错信息丢给 Claude 就能定位 Bug；自动生成覆盖正例、边界和异常的测试用例；用 AI 驱动的 TDD 循环写出更可靠的代码——调试和测试从此不再是苦差。"
toc: true
tags:
  - AI
  - Claude Code
  - Tooling
  - Tutorial
---

DAY 06 · CLAUDE CODE ROADMAP · 20 DAYS

# 让 Claude 帮你_找 Bug 写测试_

Bug 诊断不再需要你逐行 console.log——把报错信息丢给 Claude 就够了。 测试用例不再需要你手敲 edge case——Claude 会自动覆盖正例、边界和异常。 今天你将掌握 AI 驱动的_调试与测试工作流_： 从"帮你写代码"升级为"帮你保证代码质量"。

**DURATION** 55–65 min **THEORY** 20 min **HANDS-ON** 30 min **REVIEW** 10 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 06 思维导图**
>
> - DAY 06 · 调试与测试
> - DIAGNOSE · GENERATE · TDD · RUN
> - 01 · DIAGNOSE
> - 错误诊断
> - 02 · GENERATE
> - 测试生成
> - 03 · TDD
> - 测试驱动
> - 04 · RUN
> - 运行与解读
> - 粘贴报错 / 堆栈
> - Read 源码定位根因
> - 日志分析
> - 修复 + 验证闭环
> - 函数级 / 模块级
> - 正例 + 边界 + 异常
> - 框架自动适配
> - Mock / Stub 策略
> - Red → Green → Refactor
> - 测试即需求说明
> - Claude 当 TDD 搭档
> - 迭代收敛
> - 运行测试套件
> - 失败智能诊断
> - 覆盖率分析
> - 修复 → 重跑循环
> - DELIVERABLES
> - 用 Claude 诊断一个 Bug
> - 为函数生成测试用例
> - 体验 TDD 工作流
> - 运行测试并解读结果
> - GOLDEN RULE
> - 测试不是写完代码后的苦差——它是你对代码行为的精确描述，也是 Claude 理解"正确"的最佳方式

FIG · Day 06 全景: 错误诊断 → 测试生成 → TDD 循环 → 运行解读

## 错误诊断 — 给 Claude 一个报错就够了

12 MIN

传统调试：读报错 → 猜原因 → 加 console.log → 重新运行 → 再猜。 Claude Code 调试：_把报错粘贴过去_。 它会读源码、分析堆栈、定位根因、提出修复方案，甚至直接帮你改好再验证。

### 基础用法

```
# 最简单: 直接粘贴报错信息
> 运行 npm start 报了这个错:
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (/src/components/UserList.tsx:23:18)
    at renderWithHooks (/node_modules/react-dom/...)

# Claude 会:
# 1. 读 src/components/UserList.tsx 第 23 行
# 2. 分析为什么 .map() 的对象是 undefined
# 3. 提出修复方案 (可能是初始值或空值检查)
# 4. 直接用 Edit 工具修复

# 带上下文的诊断
> 用户登录后跳转到 /dashboard 页面报 403，但管理员账号正常
> 帮我看看 src/middleware/auth.ts 是不是权限检查有问题

# 让 Claude 运行命令复现
> 运行 pytest tests/test_api.py 看看哪些测试挂了，帮我修
```

### Claude 的诊断流程

> **图：诊断流程**
>
> - DIAGNOSIS FLOW
> - STEP 1
> - 解析报错信息
> - STEP 2
> - Read 源码文件
> - STEP 3
> - 定位根因
> - STEP 4
> - Edit 修复代码
> - STEP 5
> - Bash 运行验证
> - 理解错误类型
> - 跟踪堆栈
> - 核心推理
> - 精确修复
> - 确认修好
> - 给 Claude 的信息越多 (报错 + 操作步骤 + 预期行为)，诊断越准确

FIG · 诊断闭环: 解析报错 → 读源码 → 定位根因 → 修复 → 验证

### 不同错误类型的调试技巧

| 错误类型 | 你给 Claude 的信息 | Claude 的处理方式 |
| --- | --- | --- |
| 编译 / 类型错误 | 编译器输出 | 直接定位文件和行号，修复类型签名或导入 |
| 运行时异常 | 堆栈 + 复现步骤 | 沿堆栈逐层读源码，找到 undefined / null 的源头 |
| 逻辑错误 | 预期 vs 实际结果 | 分析算法或条件分支，模拟执行路径找偏差 |
| 性能问题 | 慢的接口 / 操作 + 耗时 | 检查 N+1 查询、不必要循环、缓存缺失 |
| 环境 / 配置错误 | 报错 + 环境信息 | 检查环境变量、依赖版本、配置文件 |

KEY INSIGHT

### 上下文是诊断的关键

不要只说"它不工作了"。 **给 Claude 三样东西** ：(1) 完整的报错信息或堆栈，(2) 你做了什么操作触发的，(3) 你期望的正确行为是什么。就像看医生一样——"我头疼"远不如"昨天淋雨后头疼，左太阳穴跳痛，吃了止痛药没用"有用。

WORKFLOW

### 诊断 → 修复 → 验证 闭环

Claude 不只是告诉你"这里有 Bug"——它会 **直接修复并运行验证** 。典型流程：Read 源码 → 分析问题 → Edit 修复 → Bash 运行测试确认。如果修复后仍有问题，Claude 会继续迭代直到通过。这个闭环是 Claude Code 调试的核心优势。

调试时让 Claude 运行一个能复现问题的命令——它看到实际错误输出，诊断准确率会大幅提升。

## 测试生成 — 自动覆盖边界场景

12 MIN

让 Claude 生成测试是它最_可靠的能力之一_—— 因为测试有明确的对错标准：运行通过或不通过。 Claude 会读你的代码，自动选择正确的测试框架， 生成覆盖正例、边界和异常的测试用例。

### 基础用法

```
# 为一个函数生成测试
> 为 src/utils/formatDate.ts 写单元测试
# Claude 会:
# 1. Read formatDate.ts 理解函数签名和逻辑
# 2. 检查项目已有的测试文件了解框架 (Jest? Vitest? Mocha?)
# 3. 生成测试文件 src/utils/ __tests__ /formatDate.test.ts
# 4. 包含正例、边界值、无效输入等 case

# 为整个模块生成测试
> 为 src/services/auth/ 目录下所有公共函数写测试

# 为 API 端点生成集成测试
> 为 POST /api/users 端点写集成测试，覆盖成功创建、
> 重复邮箱、缺少必填字段三种场景

# 补充现有测试的覆盖面
> 看一下 tests/test_cart.py 还缺哪些边界场景，补上
```

### Claude 生成测试的特点

| 维度 | Claude 的做法 | 为什么这很好 |
| --- | --- | --- |
| 框架适配 | 自动识别项目用的测试框架 | 不需要你指定"用 Jest"——它会从 package.json 和现有测试推断 |
| 正例覆盖 | 典型输入 → 预期输出 | 确保基本功能正常——这是大部分手写测试仅有的覆盖 |
| 边界值 | 空值、零、极大/极小、特殊字符 | 手写测试最容易遗漏的场景 |
| 异常路径 | 无效输入、网络错误、超时 | 确保错误被优雅处理而不是静默失败 |
| 文件放置 | 遵循项目已有的文件结构 | 如果已有 ` __tests__ /` 目录，新测试也放那里 |
| Mock 策略 | 只 mock 外部依赖（API、DB） | 内部代码走真实路径，外部用 mock 隔离 |

### 进阶: 指定测试策略

```
# 指定你想要的测试粒度
> 为 calculateDiscount 函数写测试，要求:
> 1. 每个分支路径至少一个 case
> 2. 测试折扣百分比为 0、50、100 的边界
> 3. 负数价格要抛出 Error
> 4. 不要 mock 数据库，用真实连接

# 在 CLAUDE.md 中定义测试规范
# 这样每次生成测试都会遵循:
## 测试规范
- 使用 Vitest 作为测试框架
- 测试文件放在 src/ __tests__ / 目录
- 命名格式: {module}.test.ts
- 每个测试用 describe/it 组织
- 数据库测试用真实连接，不要 mock
- API 测试使用 supertest
```

HOW IT WORKS

### Claude 先读再写

生成测试前，Claude 会先 Read 被测代码 **理解每个分支和边界** ，然后检查现有测试文件 **学习项目的测试风格** （describe 嵌套方式、assertion 库、setup/teardown 模式）。这就是为什么生成的测试看起来像是你团队写的——因为它确实在模仿你的风格。

TIP

### 生成后一定要跑

Claude 生成的测试不一定都能通过——这 **恰恰是有价值的** 。失败的测试可能暴露了被测代码中的真实 Bug，也可能是 Claude 对边界行为的理解与你的预期不同。让 Claude 跑一遍，讨论失败的原因，然后决定是修测试还是修代码。

在 CLAUDE.md 中写清楚测试规范 (框架、目录、mock 策略) 能让每次生成的测试都符合团队约定。

## TDD 工作流 — 先写测试再实现

10 MIN

Test-Driven Development 与 Claude Code 是天然的好搭档—— 你用自然语言描述_你想要什么行为_， Claude 把它翻译成测试用例，然后写代码让测试通过。 测试成了你和 Claude 之间的"验收合同"。

### TDD 三步曲

> **图：TDD 循环**
>
> - TDD CYCLE WITH CLAUDE CODE
> - RED
> - 写一个会失败的测试
> - 描述你想要的行为
> - GREEN
> - 写最少代码让测试通过
> - Claude 实现功能
> - REFACTOR
> - 重构，保持测试通过
> - 清理代码质量
> - REPEAT UNTIL FEATURE COMPLETE

FIG · TDD 循环: 红(写失败测试) → 绿(写实现) → 重构(清理代码) → 循环

### 用 Claude 做 TDD 的示例

```
# Step 1: Red — 先描述需求，让 Claude 写测试
> 我要实现一个 parseCSV 函数，要求:
> - 输入: CSV 字符串
> - 输出: 对象数组，第一行作为 key
> - 支持引号内的逗号
> - 空字符串返回空数组
> 先只写测试，不要写实现
# Claude 生成 parseCSV.test.ts，运行后全部 FAIL ✓

# Step 2: Green — 让 Claude 写实现
> 现在实现 parseCSV 函数，让所有测试通过
# Claude 写 parseCSV.ts，运行测试直到全部 PASS ✓

# Step 3: Refactor — 让 Claude 重构
> 重构一下 parseCSV，确保测试仍然通过
# Claude 优化代码结构，每次改动后重跑测试 ✓

# 迭代: 追加需求
> parseCSV 还需要支持自定义分隔符
> 先加测试 case，再改实现
```

KEY INSIGHT

### 测试是你和 Claude 的"合同"

在 TDD 模式下，测试就是你的 **需求规格说明** 。Claude 不需要猜你想要什么——测试定义了"正确"。这解决了 AI 编程中最大的痛点：你说"实现一个解析器"，但什么算正确？边界怎么处理？空输入返回什么？ **测试回答了所有这些问题** ，Claude 只需让它们通过。

WHY TDD + AI

### 为什么 TDD 特别适合 AI 协作

传统开发中 TDD 的最大阻力是"先写测试太慢"。但用 Claude 写测试 **几乎不花时间** ——你只需用自然语言描述行为，Claude 翻译成测试代码。而且 AI 写的代码你可能不完全信任，但 **如果它通过了你定义的测试，你就可以信任它** 。TDD + AI = 更快的开发 + 更高的信心。

TDD 的秘诀: 每次只加一个小测试 case，让 Claude 实现，然后再加下一个——小步快跑比一次性写所有测试更高效。

## 测试运行与结果解读

8 MIN

Claude Code 不只是生成测试——它能_运行测试并智能解读结果_。 测试失败了？Claude 会分析失败原因，区分是代码 Bug 还是测试写错了， 然后帮你修复正确的那一方。

### 基础用法

```
# 让 Claude 运行测试
> 跑一下测试
# Claude 会自动识别项目的测试命令:
# - npm test / npx vitest / npx jest
# - pytest / python -m pytest
# - go test ./...
# - cargo test

# 运行特定测试文件
> 只跑 tests/test_auth.py

# 运行单个测试 case
> 只跑 test_login_with_expired_token 这个测试

# 运行并修复失败
> 跑测试，失败的帮我修掉
# Claude 会: 运行 → 分析失败 → 修复 → 重跑 → 直到全部通过
```

### 失败分析的智能判断

| 失败场景 | Claude 的判断 | 修复方向 |
| --- | --- | --- |
| assert 值不匹配 | 比较预期值和实际值 | 如果实际值更合理 → 修测试；如果预期正确 → 修代码 |
| import / 依赖错误 | 检查模块路径和安装 | 修复 import 路径或安装缺失依赖 |
| 超时 / 异步问题 | 检查 async/await 和超时配置 | 添加 await 或增加超时时间 |
| 环境依赖 | 检查环境变量或外部服务 | 添加 mock 或 skip 条件 |
| 快照不匹配 | 比较新旧快照差异 | 如果改动是预期的 → 更新快照 |

### 覆盖率分析

```
# 让 Claude 检查测试覆盖率
> 跑一下带覆盖率的测试，告诉我哪些函数没有被覆盖

# Claude 会:
# 1. 运行 npx vitest --coverage 或 pytest --cov
# 2. 解读覆盖率报告
# 3. 指出未覆盖的文件/函数/分支
# 4. 如果你让它补，它会针对性地生成缺失的测试

> 覆盖率低于 80% 的文件，帮我补测试
```

BEST PRACTICE

### 在 CLAUDE.md 中指定测试命令

在 CLAUDE.md 中明确写出项目的测试命令，Claude 就不需要猜：`测试命令: npx vitest run`、`覆盖率: npx vitest --coverage`、`单文件: npx vitest run {file}`。这比每次都告诉 Claude"用 vitest 不是 jest"高效得多。

SAFETY

### 修代码还是修测试？

当测试失败时，Claude 需要判断 **该修哪一方** 。它的默认逻辑：如果测试是你刚写的（新增的），大概率是实现有 Bug。如果测试是已有的（且之前通过），大概率是你的改动引入了回归。如果你发现 Claude 判断错了，直接告诉它：" **测试是对的，去修代码**"或反之。

将测试命令写入 CLAUDE.md 的好处不只是方便——它让 Claude 在自动修 Bug 时也知道如何验证修复。

## 调试进阶技巧

REFERENCE

超越"粘贴报错"——这些进阶模式让你把 Claude 用成一个 _更聪明的调试搭档_， 处理那些没有明确报错信息的棘手问题。

### 场景化调试模式

```
# 1. 日志分析: 让 Claude 分析日志找线索
> 这是最近 100 行生产日志，找出有没有异常模式
> (粘贴日志)

# 2. 二分法定位: 让 Claude 帮你缩小范围
> 这个 Bug 在 v2.3 之后出现的，帮我用 git bisect 定位
> 是哪个 commit 引入的

# 3. 性能调试: 分析慢查询或慢接口
> /api/users 接口平均响应 3 秒，帮我看看是哪里慢
> 检查一下有没有 N+1 查询问题

# 4. 并发 / 竞态问题
> 这个接口偶尔返回错误数据，怀疑有竞态条件
> 帮我分析 src/services/orderService.ts 的并发安全性

# 5. 内存泄漏排查
> Node 进程内存持续增长，帮我检查有没有事件监听器泄漏
> 或者没有正确释放的资源
```

### 调试心法对照表

| 传统方式 | Claude Code 方式 | 优势 |
| --- | --- | --- |
| 加 console.log 重跑 | "帮我看第 42 行为什么返回 null" | 不需要改代码就能分析逻辑 |
| 手动设断点单步调试 | "读一下这个函数的执行路径" | Claude 能"脑中执行"分析分支走向 |
| Stack Overflow 搜索 | "这个错误是什么意思，怎么修" | Claude 结合你的代码上下文回答 |
| 手动写复现脚本 | "帮我写一个能复现这个 Bug 的测试" | 生成的测试可以作为回归防护 |
| 团队中找人问 | "这段代码的设计意图是什么" | Claude 随时在线，不打断同事 |

TECHNIQUE

### 橡皮鸭调试的终极形态

"橡皮鸭调试"的核心是你向一个对象描述问题时，自己就想明白了。Claude 比橡皮鸭强在 **它真的会回答** 。当你向 Claude 描述"我觉得问题在这里……"时，它可能会说"不对，根据第 35 行的逻辑，问题应该在上游的数据转换"——一个会反驳你、帮你纠正错误假设的橡皮鸭。

TIP

### Bug 复现测试的价值

让 Claude 修 Bug 后，永远加一句：" **再写一个测试确保这个 Bug 不会再出现**"。这个回归测试的价值远超 Bug 本身——它防止了同一个 Bug 在未来的重构或修改中悄悄回来。Claude 很擅长这个：它刚修完 Bug，对边界条件记忆犹新，写出的测试会精准覆盖。

"帮我修这个 Bug 然后写一个回归测试"——这一句话就是你的最佳调试工作流。

## 动手练习

30 MIN

今天的练习围绕调试和测试。你可以在任何有代码的项目中操作—— 如果手边没有合适的项目，可以创建一个小项目来练习。

### Lab 1 — 错误诊断体验

人为制造一个 Bug，让 Claude 帮你找到并修复。

```
# 准备: 在你的项目中故意引入一个 Bug
# 比如把一个变量名拼错，或者删掉一个必要的 null 检查

# 然后运行代码触发报错
$ npm start # 或你项目的运行命令

# 把报错信息给 Claude
$ claude
> 运行报了这个错: (粘贴报错)
> 帮我找到原因并修复

# 观察:
# 1. Claude 是否正确定位了你故意引入的 Bug？
# 2. 它的修复方案是否合理？
# 3. 它是否验证了修复（重新运行）？
```

### Lab 2 — 测试生成

选一个你项目中没有测试的函数，让 Claude 生成测试。

```
# 选一个没有测试覆盖的函数
> 为 src/utils/validate.ts 中的 validateEmail 函数写单元测试

# 运行生成的测试
> 跑一下刚才写的测试

# 如果有失败，让 Claude 分析
> 这两个测试失败了，是代码 Bug 还是测试写错了？

# 补充边界场景
> 还有哪些边界没覆盖？比如超长邮箱、Unicode 字符
```

### Lab 3 — TDD 迷你实践

用 TDD 模式实现一个小功能——体验 Red → Green → Refactor 循环。

```
# 选一个小功能来 TDD，比如一个密码强度检查器
> 我要实现一个 checkPasswordStrength 函数:
> - 返回 weak / medium / strong
> - 8位以下 = weak
> - 有大小写 + 数字 = medium
> - 再加特殊字符 = strong
> 先只写测试，不要写实现

# 确认测试都 FAIL (这是正确的!)
> 跑一下测试，确认都失败了

# 让 Claude 实现
> 现在写 checkPasswordStrength 让测试通过

# 追加需求
> 还要检查密码中不能包含用户名
> 先加测试 case，再改实现
```

### Lab 4 — 修复并验证

让 Claude 完成一个完整的"修 Bug + 写回归测试"循环。

```
# 如果你的项目有已知的 Bug 或 TODO
> 修一下 issue #12 的 Bug，然后写一个回归测试
> 确保测试跑过

# 或者让 Claude 找 Bug
> 跑一下所有测试，失败的帮我修掉
> 修完之后确保所有测试都通过

# 观察 Claude 的闭环:
# 运行测试 → 发现失败 → 分析原因 → 修复 → 重跑 → 全部通过
```

如果你的项目还没有测试框架，告诉 Claude "帮我初始化测试框架"——它会根据项目类型自动配置。

## 常见疑问

5 QUESTIONS

### Q1 · Claude 生成的测试质量可靠吗？我能直接用吗？

ANS

Claude 生成的测试通常 **结构合理、覆盖面广** ，但需要你审核两件事：(1) **断言值是否正确** ——Claude 可能对边界行为的预期与你不同；(2) **Mock 是否合理** ——它可能过度 mock 导致测试变成在测 mock 而不是测代码。最好的实践是：让 Claude 生成后 **跑一遍** ，然后一起讨论失败的 case——这本身就是一个审查过程。

### Q2 · Claude 能调试非代码问题吗？比如 Docker、CI/CD 或基础设施？

ANS

**可以** 。Claude 可以读 Dockerfile、docker-compose.yml、GitHub Actions workflow、nginx 配置等文件，并帮你分析构建失败、容器启动错误、CI pipeline 问题。粘贴 `docker build` 或 CI 的报错日志，Claude 会分析并给出修复建议。它还能帮你读懂复杂的 CI 日志——比如从 300 行输出中找到关键的错误行。不过它 **不能直接连接到远程服务器** ，所以需要你把日志或配置文件的内容带给它。

### Q3 · TDD 模式下，Claude 写的测试太简单怎么办？

ANS

三个调整方式。 **一是具体描述** ：不说"写测试"，而是"写测试，覆盖：空输入、超长字符串(10000字符)、Unicode emoji、并发调用"。 **二是追加迭代** ：先让 Claude 写基础测试，然后说"还有哪些边界你没想到？补上"——它往往能自己发现遗漏。 **三是写在 CLAUDE.md 里** ：`测试要求：每个函数至少覆盖正例、空值、越界、类型错误四个维度`。Claude 接下来生成的每个测试都会遵循。

### Q4 · Claude 修 Bug 时会不会引入新 Bug？

ANS

有可能——这也是为什么 **测试如此重要** 。Claude 修完 Bug 后，如果你有一套完善的测试套件，跑一遍就知道有没有回归。这形成了一个正循环：你的测试越完善 → Claude 修 Bug 越安全 → 你越敢让 Claude 做修改。建议在 CLAUDE.md 中添加：`修复 Bug 后必须运行完整测试套件确认无回归`。Claude 会在每次修复后自动跑测试。

### Q5 · Claude 能处理 Flaky Test (间歇性失败的测试) 吗？

ANS

Flaky test 是测试中最棘手的问题之一，常见原因是 **竞态条件、时间依赖、外部服务不稳定或测试间状态泄漏** 。Claude 可以帮你分析：把间歇性失败的测试给它看，它会检查是否有 `setTimeout` 依赖、共享状态、不稳定的外部调用等。修复方式通常是添加 retry 逻辑、用 mock 替代不稳定的依赖、或者确保测试间的隔离（每个测试独立 setup/teardown）。但 Claude **需要你告诉它"这个测试有时通过有时不通过"** ——它无法自己发现 flakiness。

## 复盘问题

5 QUESTIONS

1. Claude 的调试闭环有哪几个步骤？为什么"验证"这一步不可省略？
2. 给 Claude 调试信息时，三样最重要的东西是什么？对比"它不工作了"和"用户登录后跳转 /dashboard 返回 403"的效果差异。
3. Claude 生成测试时会自动适配哪些东西？如果它选错了框架，你怎么纠正？
4. 描述 TDD 的 Red → Green → Refactor 循环。为什么说 "测试是你和 Claude 的合同"？
5. 测试失败时，Claude 需要判断"修代码还是修测试"——它的默认逻辑是什么？你怎么覆盖这个判断？

## 今日检查清单

7 ITEMS

- 用 Claude 成功诊断并修复了一个 Bug（粘贴报错 → 定位 → 修复 → 验证）
- 让 Claude 为至少一个函数生成了测试，覆盖正例、边界和异常
- 体验了 TDD 工作流（先写测试 → 写实现 → 测试通过）
- 让 Claude 运行测试并解读结果，理解它如何判断失败原因
- 理解了"修 Bug + 写回归测试"的最佳实践
- 在 CLAUDE.md 中配置了测试相关规范（框架、目录、命令）
- 体会到测试套件越完善，越敢让 Claude 做修改

## 推荐阅读

3 ITEMS

METHODOLOGY

### Test-Driven Development by Example

Kent Beck 的经典之作。理解 TDD 的哲学和实践——"先写一个失败的测试"这个简单规则如何深刻改变开发方式。与 Claude Code 结合后，TDD 的"先写测试太慢"这个最大阻力消失了。

PRACTICE

### Testing Best Practices

JavaScript 测试最佳实践指南——涵盖测试结构、命名、Assertion、Mock、E2E 等维度。将这些规范写入 CLAUDE.md，Claude 生成的每个测试都会遵循。

TOOL

### Vitest / Jest / pytest 文档

了解你项目使用的测试框架的完整 API。当 Claude 生成的测试中有你不认识的 API 时，查文档确认它是否用对了——Claude 偶尔会混淆不同框架的 API。

## Day 07 预告

NEXT

COMING NEXT

### 搜索与导航 — grep · glob · 符号查找 · 跨文件追踪

调试和测试是处理已知文件，明天教你在不熟的代码库里精准定位。Grep / Glob / Bash find / Read / Explore agent 五种搜索工具的取舍；正则与路径模式的常见陷阱；改函数前必做的"定位定义 → 列 callers → 看上下文"三步法。导航不熟，改一个函数都可能漏改五处。

"Testing shows the presence, not the absence of bugs."

DAY 06 · CLAUDE CODE 20-DAY ROADMAP · EDSGER W. DIJKSTRA
