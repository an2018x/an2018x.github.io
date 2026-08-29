---
title: "Day 05 · 多光标与列编辑"
date: '2026-05-24'
draft: false
description: "VSCode 最强的批量魔法 —— ⌘D 选下一个相同、⌘⇧L 选全部、⌥click 任意加光标、Box Selection 列编辑。理解后,SQL 列对齐、批改 import、给 100 个变量加前缀都是 5 秒钟的事。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 05
---

DAY 05 · VSCODE ROADMAP · 21 DAYS

# 多光标：VSCode 的 _批量魔法_

用过 VSCode 多光标的人会说：「_没办法回到没有这个功能的编辑器了_。」 它把「重复编辑 N 次」压缩成「编辑 1 次」， 是 VSCode 区别于古早 IDE 的最大杀手锏。 今天讲清三种姿势—— **添加** （⌥click）、 **智能** （⌘D）、 **批量** （⌘⇧L）， 以及垂直方向的 **Box Selection** 。

**DURATION** 60 min **THEORY** 20 min **HANDS-ON** 30 min **REVIEW** 10 min **STAR HOTKEY** ⌘D

## 思维导图

OVERVIEW

> **图：Day 05 思维导图**
>
> - DAY 05 · 多光标与列编辑
> - ADD · SMART · BATCH · COLUMN
> - 01 · ADD
> - 任意添加光标
> - 02 · SMART
> - ⌘D 逐个相同
> - 03 · BATCH
> - ⌘⇧L 全部相同
> - 04 · COLUMN
> - Box Selection
> - ⌥click 任意位置
> - ⌥⌘↑/↓ 上下加光标
> - ⌘U 撤销最后一个
> - Esc 退回单光标
> - ⌘D 下一个相同
> - ⌘K ⌘D 跳过当前
> - ⌘D 默认 case-sensitive
> - 可改 whole-word
> - ⌘⇧L 文件内全部
> - ⌘F2 同上(备用键)
> - 配合 Find 选过滤
> - ⌥⏎ 找完全选
> - ⌥⇧+drag 框选
> - 中键拖拽
> - ⌥⌘⇧+方向键
> - Column Selection Mode
> - DELIVERABLES
> - 三种添加姿势熟练
> - ⌘D 链式肌肉记忆
> - Box Selection 玩转 CSV
> - 5 个真实场景实战

FIG · Day 05 全景：从添加单个光标到批量编辑，再到二维列编辑

## 多光标的进化树

VISUAL MAP

多光标不是一个快捷键，而是_一种思维模式_—— 把编辑动作从「单点」扩展到「多点」。 下面这张图按「选择规则」把多光标分成 4 类，记住这棵进化树就掌握了所有用法。

> **图：多光标进化树**
>
> - MULTI-CURSOR EVOLUTION TREE
> - START · 单光标
> - 普通编辑
> - const foo = 1;
> - const bar = 2;
> - const baz = 3;
> - 1 个光标 · 1 个动作
> - ⌥CLICK · 任意添加
> - 手动定点
> - let bar = 2;
> - var baz = 3;
> - 任意位置 · 无规则
> - ⌘D · 逐个相同
> - 智能选词
> - const
> - foo
> - = 1;
> - use(
> - );
> - log(
> - 按一次加一个 · 可跳过
> - BOX · 列选择
> - 几何选区
> - apple, 10
> - pear, 20
> - peach, 30
> - 矩形区域 · 列对齐
> - DECISION GUIDE · 怎么选
> - 需要改的位置 ≤ 5 个、无规律 → ⌥click 手动添加
> - 改的内容是同一个词、想逐个确认 → ⌘D 链式
> - 改的是同一个词、确信要全改 → ⌘⇧L 一次到位
> - 改的是矩形区域（CSV / 表格 / 列对齐） → Box Selection

FIG · 多光标的四种形态：从单点到任意点、到智能、到几何

## 添加光标的三种姿势

15 MIN

光标怎么加进来——这是多光标的第一个问题。 VSCode 提供_三条路径_：手动定点、逐个匹配、批量匹配。 用错了路径，效率差 10 倍。

### 三种姿势速查

| 姿势 | macOS | Win / Linux | 语义 |
| --- | --- | --- | --- |
| 任意位置加光标 | ⌥ + 鼠标点击 | Alt + 鼠标点击 | 手动定点 · 最自由 |
| 上方 / 下方加光标 | ⌥⌘↑ / ↓ | CtrlAlt↑ / ↓ | 垂直方向 · 同列加光标 |
| 选下一个相同（⌘D） | ⌘D | CtrlD | 最常用 · 逐个添加 |
| 跳过当前匹配，找下一个 | ⌘K ⌘D | CtrlK CtrlD | ⌘D 选错了用 |
| 选全部相同 | ⌘⇧L | Ctrl⇧L | 一次到位 · 不可逆 |
| 撤销最后一个光标 | ⌘U | CtrlU | ⌘D 选过头了救命 |
| 退回到单光标 | Esc | Esc | 全部清掉重来 |

### ⌘D 的链式工作流

`⌘D` 不是「按一次完成」的快捷键——它是一条 **循环链** ：每按一次添加一个光标，可以中途跳过、可以中途撤销，最终决定权在你。

```
// 起点：把光标停在 foo 这个词上（不需要选中）
const foo = 1;
use(foo);
log(foo);
const bar = foo + 1;

// 操作 1：第一次 ⌘D — 选中当前 foo
const [foo] = 1; // 现在有 1 个选区
use(foo);
log(foo);

// 操作 2：再 ⌘D — 跳到下一个 foo 并选中
const [foo] = 1;
use([foo]); // 2 个选区，2 个光标
log(foo);

// 操作 3：再 ⌘D ⌘D — 选中全部 foo
const [foo] = 1;
use([foo]);
log([foo]);
const bar = [foo] + 1; // 4 个选区

// 操作 4：输入新名 — 4 个位置同步更改
const data = 1;
use(data);
log(data);
const bar = data + 1;
```

### ⌘D vs ⌘⇧L 决策矩阵

⌘D · 逐个

### 选这个，跳过这个，再选下一个

**用在** ：变量名有同名冲突（如 `id` 既是函数参数又是属性名），需要肉眼判断每一个该不该改时。 **风险** ：低 — 错了就 ⌘U 撤销最后一个，或 ⌘K ⌘D 跳过。

⌘⇧L · 全部

### 所有相同的，一次到位

**用在** ：100% 确认该词只在「目标含义」上出现（如全文唯一的私有变量），或处理 JSON / CSV 这种结构化数据。 **风险** ：高 — 没有⌘U 这种「单步撤销」，错了只能整体撤销。

折中

### 用 Find（⌘F）+ ⌥⏎

⌘F 输入要找的词 → ⌥⏎ 把 **当前结果全选** 。比 ⌘⇧L 更安全，可以先开正则/whole-word/case-sensitive 过滤。

大型重构

### 不要用多光标，用 F2 Rename

跨文件改符号名 → 用 F2 重构（Day 13 详讲）。多光标只适合 **当前文件内 + 字符级** 替换。

## Box Selection：垂直方向的多光标

10 MIN

Box Selection（列选择）是多光标的_几何版本_—— 选中一个矩形区域，每行行尾自动获得一个光标。 处理 CSV、SQL、配置文件、对齐过的代码时它是无可替代的。

### 开启 Box Selection 的四种方式

| 方式 | macOS | Win / Linux | 适用 |
| --- | --- | --- | --- |
| 按住修饰键拖鼠标 | ⌥⇧ + drag | Alt⇧ + drag | 最常用 · 视觉直观 |
| 中键拖鼠标 | 鼠标中键 + drag | 鼠标中键 + drag | 有滚轮键的鼠标 |
| 键盘扩选 | ⌥⌘⇧ + ←↑→↓ | CtrlAlt⇧ + ←↑→↓ | 无鼠标 · 精确 |
| Column Selection Mode | 命令面板 → Toggle Column Selection | 同左 | 常用时切到该模式 · 普通拖拽就是列选 |

### Box Selection 实例

```
// 起点：一份对齐的 CSV
apple, 10, red
banana, 20, yellow
cherry, 30, red
grape, 40, purple

// 操作：⌥⇧+drag 框选中间「数字」列
apple, 10, red
banana, 20, yellow
cherry, 30, red
grape, 40, purple

// 现在每行的数字都被选中 + 每行有一个独立光标

// 后续可以：
// 1. 直接输入新值（4 个位置同步改）
// 2. ⌘C 复制成 4 行数字
// 3. 末尾按 End 后继续按 ⌘← 选到行首 (此时不再是 Box, 而是普通多光标)
// 4. 输入 // 给 4 行都加注释
```

### 真实场景：CSV → JS 数组

```
// 输入（粘贴自 Excel）：
Alice, 25, alice@example.com
Bob, 30, bob@example.com
Charlie, 35, charlie@example.com

// 目标：
{ name: "Alice", age: 25, email: "alice@example.com" },
{ name: "Bob", age: 30, email: "bob@example.com" },
{ name: "Charlie", age: 35, email: "charlie@example.com" },

// 操作流程：
// 1. ⌥⌘↓ 让所有行都加光标（或用 ⌘⇧L 选中所有逗号变成多光标也行）
// 2. ⌘← 跳到每行行首
// 3. 输入 { name: "
// 4. ⌥→ 跳到第一个逗号前
// 5. 输入 ", age:
// 6. ⌥→ 跳到第二个逗号前
// 7. 输入 , email: "
// 8. ⌘→ 跳到行尾
// 9. 输入 " },
//
// 30 秒搞定，且不用写 sed 脚本
```

这就是为什么 **多光标 = 临时正则** —— 处理「规律可见但不值得写脚本」的中等数据时最快

## 多光标 × 一切快捷键

10 MIN

多光标的_真正威力_不在于「同时输入」， 而在于「 **Day 04 学的所有快捷键** 瞬间作用于 N 个位置」。

### 组合举例

＋ 按词移动

### ⌥→

多光标 + ⌥→ 同时跳到各自的下一个词边界。各行长短不一也没关系—— **每个光标独立计算** 。

＋ 行首尾

### ⌘←/→

每个光标跳到自己所在行的行首/行尾。最常用在「批量在行首加注释」「批量在行尾加分号」。

＋ 复制粘贴

### ⌘C / ⌘V

N 个光标复制 → 内部存为 N 份。N 个光标粘贴时——如果剪贴板也是 N 份， **一对一粘贴** ；否则每个光标粘贴同样内容。

＋ 选词

### ⇧⌥→

每个光标选中自己的下一个词。配合「按词选 + 改名」批量改局部变量。

＋ 删行

### ⌘⇧K

每个光标删掉自己所在行——一秒删除散落在各处的 N 行无用 import / 调试 print。

＋ 复制行

### ⇧⌥↓

每个光标向下复制一份自己所在行——批量复制多个不相邻的行。

### 一份对照 — 同一任务的两种解法

```
// 任务：把下面 5 行的 var 全部改成 const
var name = "Alice";
var age = 25;
var email = "alice@example.com";
var role = "admin";
var team = "infra";

// === 解法 A · 鼠标 + 重复操作（45 秒）===
// 选第一个 var → 改成 const → 移到下一行 → 重复 5 次

// === 解法 B · ⌘D 链式（4 秒）===
// 1. 双击选中第一个 var
// 2. ⌘D ⌘D ⌘D ⌘D （添加另外 4 个光标）
// 3. 输入 const （5 个位置同时替换）

// === 解法 C · ⌘⇧L 一次性（2 秒）===
// 1. 双击选中第一个 var
// 2. ⌘⇧L （选中文件内所有 var）
// 3. 输入 const （全文同步）
//
// ⚠ 风险：若文件内还有 var 用作其他变量名会一起改
```

从 45 秒到 2 秒——这就是「多光标思维」带来的工程效率倍数

## 五个真实场景

10 MIN · CASE STUDIES

不要为了用而用。下面五个场景是_多光标真正比其他工具快_的实战时刻—— 记住这些信号，遇到就出手。

SCENARIO 01

### 批量改 import 路径

重构后 `@/components/*` 全部要改成 `@/ui/*`。

⌘F → 输入旧路径 → ⌥⏎ 全选 → 输入新路径

1. ⌘F 打开搜索框
2. 输入 `@/components/`（开 case-sensitive）
3. 按 ⌥⏎ 当前匹配全选
4. Esc 关闭搜索框（保留多光标）
5. 输入新路径 `@/ui/`

SCENARIO 02

### 给一堆变量批量加前缀

10 个 `getXxx` 函数都要改成 `storeGetXxx`。

⌘D 链式选 get → ⌘← 跳到 get 前 → 输入 store

1. 选中第一个 `get`
2. ⌘D × N 选完 10 个
3. ⌘← 让每个光标跳到 get 前（仍 10 个光标）
4. 输入 `store` — 10 个 get 同时变成 storeGet

SCENARIO 03

### 处理 SQL 结果集 → 代码

从 DataGrip 复制了一列 ID 数字,要变成 JS 数组。

粘贴 → ⌥⇧+drag 框选行尾 → 输入 , → ⌘← 加 '

1. 粘贴 ID 列表（每行一个数字）
2. ⌥⌘↓ 把所有行加光标
3. ⌘→ 跳到行尾 → 输入 `,`
4. ⌘← 跳到行首 → 输入 `'`
5. 合并所有行：选全部 → ⌃J（多次）

SCENARIO 04

### JSON 改键名

API 改了字段名,JSON 里的 `"userId"` 全部要改成 `"user_id"`。

⌘D 选 userId → ⌘⇧L 全选 → 输入 user\_id

1. 选中第一个 `"userId"`
2. ⌘⇧L 选中全部相同
3. 输入 `"user_id"`
4. 整个文件瞬间同步

SCENARIO 05

### 批量给行加 // TODO 注释

复习 PR 时想给一组 5 行不连续的代码各加一行 TODO。

⌥click 各行末 → ⏎ 换行 → 输入 // TODO: ...

1. ⌥click 在每行末点一下（添加 5 个光标）
2. 按 ⏎ 同时插入 5 个新行
3. 输入 `// TODO: 待 review`
4. 5 行 TODO 一次生成

ANTI-PATTERN

### 什么时候 **不** 用多光标

有更好的工具时,不要硬上多光标。

3 种避雷场景

1. **跨文件改** → 用 ⌘⇧F 全局搜索替换
2. **改符号名** → 用 F2 Rename (LSP 加持,跟踪所有引用)
3. **有复杂规律** → 用正则替换（明天 Day 06)

## 动手练习

30 MIN · 3 LABS

今天的练习设计成「_用秒表自计时_」—— 每个 Lab 第一次做完记下时间，明天再做一次。 第二次至少快一半,才算「肌肉记忆开始形成」。

### Lab 1 — ⌘D 链式：批改 var → const

把下面这段代码粘贴到 VSCode,用 ⌘D 链式 + 多光标编辑完成转换。

```
// 起始
var username = "alice";
var password = "123";
var token = "abc";
var ttl = 3600;
var scope = "read";
var refresh = false;

// 目标
const username = "alice";
const password = "123";
const token = "abc";
const ttl = 3600;
const scope = "read";
const refresh = false;
```

**操作** ：选第一个 `var` → ⌘D × 5 → 输入 `const` → Esc。

挑战目标： **3 秒内完成**

### Lab 2 — Box Selection：CSV 转代码

把下面的「假装从 Excel 复制的」数据,转成 JS 对象数组。

```
// 起始
Alice 25 alice@example.com
Bob 30 bob@example.com
Charlie 35 charlie@example.com
David 28 david@example.com

// 目标
{ name: "Alice", age: 25, email: "alice@example.com" },
{ name: "Bob", age: 30, email: "bob@example.com" },
{ name: "Charlie", age: 35, email: "charlie@example.com" },
{ name: "David", age: 28, email: "david@example.com" },
```

**提示** :

1. ⌥⌘↓ 全部行加光标（4 个）
2. ⌘← 跳行首,输入 `{ name: "`
3. ⌥→ 跳到第一个空格前（即 name 的右边）
4. ⌥⇧→ 选中名字与年龄之间的空白,输入 `", age: `
5. ⌥→ 跳过年龄数字 · ⌥⇧→ 选中空白 · 输入 `, email: "`
6. ⌘→ 行尾,输入 `" },`

挑战目标： **30 秒内完成** 。第一次 60 秒也正常,主要是建立「多光标推手」感觉

### Lab 3 — 真实场景：给函数批量加日志

用 ⌥click 给 5 个不连续的函数定义之后,各加一行 `console.log`。

```
// 起始
function fetchUser(id) {
  return api.get("/users/" + id);
}

function fetchPost(id) {
  return api.get("/posts/" + id);
}

function fetchComment(id) {
  return api.get("/comments/" + id);
}

function fetchTag(id) {
  return api.get("/tags/" + id);
}

function fetchUserProfile(id) {
  return api.get("/profiles/" + id);
}

// 目标 — 5 个函数都加一行 log
function fetchUser(id) {
  console.log("[fetchUser]", id);
  return api.get("/users/" + id);
}
// ... 其余四个同样
```

**操作** :

1. ⌥click 在每个 `{` 后面点一下（5 个光标）
2. 按 ⏎ 同时换行
3. 输入 `console.log("[", id);`
4. 遗憾的是函数名不同——所以这一步无法批量。 **这正是多光标的边界** :批量编辑要求「插入内容相同」
5. 退出多光标,逐个进每行手动加函数名（或用 Snippet,Day 07 会讲）

这一题的教学意图:让你 **体会多光标的能与不能** 。「插入内容因位置而异」的场景需要 Snippet 或 AI（Day 20）

REFLECTION

### 多光标的三条边界

(1) **跨文件** 用不了 — 用全局替换或 F2 Rename；(2) **插入内容因位置而异** 用不了 — 用 Snippet 或 AI；(3) **需要正则推导** 用不了 — 用 Find & Replace 正则模式（Day 06）。

CHALLENGE

### 附加挑战

找一个你最近写过的 PR,看看是否有「连续重复编辑」的提交。用多光标重做一遍,记下能节省的时间。把这个数字变成你的 ROI。

## 常见疑问

5 QUESTIONS

### Q1 · ⌘D 链式时多选了一个不该选的怎么办？

ANS

两条救命快捷键：(1) **⌘U** （Win: Ctrl U）—— Undo Last Cursor，撤销刚才那个多余的光标，但保留之前的所有；(2) **⌘K ⌘D** （chord 写法）—— Move Last Selection to Next Find Match，跳过当前匹配，把光标移到再下一个。 **记忆法** ：⌘D 是 Down（下一个），⌘U 是 Up（撤销）。 **实战流程** ：用 ⌘D 一边选一边肉眼检查，发现不该选的立刻 ⌘U；或者快速整体撤销（Esc）从头来。

### Q2 · 多光标后我想完全退出回到单光标怎么办？

ANS

**按 Esc** ——这是所有多光标场景的「逃生键」。它会保留 **主光标** （最初的那个）并取消所有其他光标和选区。 **注意区分** ：如果你刚才是用 ⌘F 配合 ⌥⏎ 进入的多光标，第一次 Esc 会关闭搜索框，第二次 Esc 才退出多光标——需要按两次。 **另一招** ：点击编辑器任意位置鼠标左键，也能立即退到「点击位置的单光标」。

### Q3 · 多光标在不同长度的行上按 End 或 ⌘→，行为很奇怪？

ANS

这是 **正常且重要的特性** ——每个光标 **独立** 跳到自己所在行的行尾。所以一列短行和一列长行混在一起按 ⌘→ 后，光标们会落在不同的 **X 坐标** 。这 **正是** 处理参差不齐的代码（如带不同注释的函数声明）的杀手锏。 **反过来** ：如果你想让所有光标都落在同一个 X 坐标（如全部第 40 列），用 Box Selection 而不是普通多光标；或者使用「跳到指定列」⌃G 后再多光标。

### Q4 · Box Selection 我老是用错——拖拽时总是普通选择？

ANS

原因有 3：(1) **修饰键时机错了** ——必须 **先按住** ⌥⇧ 再点击鼠标，松开后再拖拽。如果先点鼠标再按修饰键，触发的是普通选区。(2) **VSCodeVim 等扩展冲突** ——某些扩展会拦截 Alt+Shift。临时禁用看看。(3) **更稳妥的做法** ：命令面板 → `Toggle Column Selection Mode`，进入后所有普通拖拽都自动变成列选择（再切回去取消模式）。 **另一种** ：用键盘 ⌥⌘⇧+方向键扩选，完全不靠鼠标。

### Q5 · 多光标和正则替换 (Find & Replace) 该怎么选？

ANS

简单判断：(1) **看得见每个修改、需要肉眼确认** → 多光标。优点是所见即所得，错了立即可见；缺点是只在单文件。(2) **规则可以写成正则、跨多文件、修改量大** → Find & Replace（明天 Day 06）。优点是 **批量、可重复** ，劣势是写错正则可能批量改错。(3) **逻辑上是符号重命名而非字符替换** → F2 Rename（Day 13）。是基于 LSP 的 **语义** 级重构，能正确处理同名不同作用域的变量。 **经验法则** ：能用 F2 别用替换，能用替换别用多光标。但多光标的「我看着改」的安全感是其他工具给不了的，所以它永远有位置。

## 复盘问题

5 QUESTIONS

1. 添加光标的三种姿势是什么？分别对应什么场景？
2. ⌘D 和 ⌘⇧L 的本质区别是什么？什么时候用哪个？
3. 开启 Box Selection 的四种方法分别是？哪一种最适合不带鼠标使用？
4. 多光标的三条「能力边界」（什么时候不该用多光标）是什么？
5. ⌘D 选错了用什么撤销最后一个？整体退出多光标按什么？

## 今日检查清单

8 ITEMS

- 掌握三种添加光标姿势:⌥click / ⌥⌘↑↓ / ⌘D
- 会用 ⌘U 撤销最后一个光标、Esc 退出多光标
- 能区分 ⌘D 与 ⌘⇧L 的使用场景
- 掌握至少一种开启 Box Selection 的方法
- 能描述多光标的三条边界（跨文件 / 内容异 / 需正则）
- 完成 Lab 1（var → const）并第二次低于 3 秒
- 完成 Lab 2（CSV → 对象数组）
- 完成 Lab 3 并理解「多光标 + Snippet」的协同空间

## 推荐阅读

3 ITEMS

OFFICIAL

### Multi-cursor Selection

VSCode 官方多光标文档。所有相关命令的权威来源,包括今天未提及的少数边角命令。

OFFICIAL

### Column (Box) Selection

列选择的官方说明。包含 Column Selection Mode 的开启/关闭机制与所有相关快捷键。

VIDEO

### VSCode Multi-cursor Magic

YouTube 上 VSCode 官方 / 社区做的多光标演示视频。10 分钟看 20 个场景,比读文档直观。

## Day 06 预告

NEXT

COMING NEXT

### 搜索、替换与正则 — 从单文件到全工作区的精准制导

明天从「单文件」扩展到「整个工作区」。会拆解 ⌘F 文件内 / ⌘⇧F 全工作区两套搜索的差异、正则捕获组与替换语法（`$1 $2 \U \L`）、include / exclude glob 的实战写法、以及为什么搜索结果窗口本身就是一个「可编辑的预览」。多光标是临时正则,正则是永久多光标——明天补上这块拼图。

"多光标不是技巧 —— 它是把编辑器的视角，从一个像素扩展到一片像素。"

DAY 05 · VSCODE 21-DAY ROADMAP
