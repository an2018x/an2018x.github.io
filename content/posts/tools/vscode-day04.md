---
title: "Day 04 · 基础导航与选择"
date: '2026-05-24'
draft: false
description: "VSCode 编辑器内功第一天 —— 导航三件套（文件 / 符号 / 行号）、光标按词/按行/按符号的移动、扩展选择与 Smart Select、行操作四件套（删/复制/移动/合并）。修饰键 = 作用域，这是所有快捷键的底层规律。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 04
---

DAY 04 · VSCODE ROADMAP · 21 DAYS

# 用 _键盘_ 在文件里飞

今天进入_编辑器内功_第一天。 建立一个最重要的心智模型—— **修饰键 = 作用域** ：⌥ 是「按词」、⌘ 是「按行/文件」、⇧ 是「同时选中」。 把这条规律内化后，你将不再死记快捷键——而是 **临场组合出来** 。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **CORE MODEL** MODIFIER = SCOPE

## 思维导图

OVERVIEW

> **图：Day 04 思维导图**
>
> - DAY 04 · 基础导航与选择
> - JUMP · MOVE · SELECT · LINE
> - 01 · JUMP
> - 导航三件套
> - 02 · MOVE
> - 光标移动 = 修饰键
> - 03 · SELECT
> - 扩展选择艺术
> - 04 · LINE
> - 行操作四件套
> - ⌘P 文件
> - ⌘T 工作区符号
> - ⌃G 行号
> - ⌃- / ⌃⇧- 后退/前进
> - ⌥← / ⌥→ 按词
> - ⌘← / ⌘→ 行首/尾
> - ⌘↑ / ⌘↓ 文件首/尾
> - ⌘⇧\ 匹配括号 · F12 跳定义
> - ⇧ + 移动 = 扩展
> - ⌘L 整行 · ⌘D 当前词
> - ⌃⇧⌘← / → Smart 扩缩
> - ⌘A 全选
> - ⌘⇧K 删行
> - ⇧⌥↑/↓ 复制行
> - ⌥↑/↓ 移动行
> - ⌃J 合并行 · ⌘⏎ 下方新行
> - DELIVERABLES
> - 修饰键心智模型
> - 20+ 快捷键肌肉记忆
> - 行操作组合拳
> - 不再碰方向键 + 鼠标

FIG · Day 04 全景：跳转 → 移动 → 选择 → 行操作，逐级扩大作用域

## 核心心智模型：修饰键 = 作用域

FOUNDATION

VSCode 的快捷键看似海量，但_骨架只有四块_—— 四个修饰键各代表一种「作用域」，方向键/字母键代表「动作」。 看懂这张图，剩下的快捷键全是组合题。

> **图：修饰键作用域示意**
>
> - MODIFIER KEY → SEMANTIC SCOPE
> - （无）
> - NONE
> - 字符 / 行
> - ←→ 一字 · ↑↓ 一行
> - ⌥ Option
> - WORD
> - 按词 / 移动行
> - ⌥← 按词 · ⌥↑ 上移行
> - ⌘ Command
> - LINE / FILE
> - 行首尾 / 文件首尾
> - ⌘← 行首 · ⌘↑ 文件首
> - ⇧ Shift
> - + SELECT
> - 同时选中
> - 叠加在前三个上
> - EXAMPLES · 组合即推导
> - ⇧⌥→
> - = ⌥(按词) + ⇧(选中) → 选中下一个词
> - ⇧⌘→
> - = ⌘(行尾) + ⇧(选中) → 选到行尾
> - ⇧⌘↓
> - = ⌘(文件尾) + ⇧(选中) → 选到文件结尾
> - ⇧⌥↓
> - = ⌥(移动行) + ⇧(变成复制) → 向下复制一行

FIG · 修饰键 = 作用域单位，⇧ = 同时选中，组合即可推导出所有快捷键

CROSS-PLATFORM

### Windows / Linux 对应

⌘ → Ctrl，⌥ → Alt，⌃ → 同样是 Ctrl。下面所有表格会同时列出。

EXCEPTION 01

### ⌃ 与 ⌘ 不等价

macOS 上 ⌃（Control）保留给少数命令如 ⌃G（跳行）、⌃`（终端）。Win/Linux 直接是 Ctrl。

EXCEPTION 02

### 记法：双手分工

左手按修饰键、右手按方向键/字母——这是 **不需要看键盘** 的关键。手指别交叉。

## 导航三件套：再也不点文件树

15 MIN

VSCode 提供_三种粒度_的跳转： 文件级（⌘P）、符号级（⌘T / ⌘⇧O）、行级（⌃G）。 理解这三套快捷键后，鼠标点文件树会变成「最慢的导航方式」。

### 跳转五兄弟

| 动作 | macOS | Win / Linux | 用法 |
| --- | --- | --- | --- |
| Quick Open（文件） | ⌘P | CtrlP | 模糊搜索文件名 · 支持驼峰首字母 · 支持路径片段 |
| Symbol in Workspace | ⌘T | CtrlT | 整个工作区找类/函数 · 要求装好语言服务器 |
| Symbol in File | ⌘⇧O | Ctrl⇧O | 当前文件内跳转 · 加冒号 `:` 按类型分组 |
| Go to Line | ⌃G | CtrlG | 跳到行号 · 支持 `行:列` 格式 |
| 导航历史 后退 / 前进 | ⌃- / ⌃⇧- | Alt← / Alt→ | 像浏览器一样在跳转过的位置之间来回 · 极其常用 |

### ⌘P 进阶：四个隐藏招数

招数 01

### 驼峰首字母搜索

想打开 `UserProfileService.ts`？只输入 `ups` 就能匹配。命名规范的项目里效率爆表。

招数 02

### 路径片段

有多个 `index.ts` 时，输入 `components/index` 同时匹配目录名 + 文件名。

招数 03

### 选中后按 ⌥⏎ 分屏打开

⌘P 找到目标 → 按 ⌥⏎（Win: Ctrl⏎）→ 在 **新编辑器组** 打开，原文件保留。

招数 04

### 历史文件列表

⌘P 不输入任何字符——列表自动显示 **最近打开** 的文件，按时间倒序。

### 符号级跳转（基于 LSP）

| 动作 | macOS | Win / Linux | 用法 |
| --- | --- | --- | --- |
| Go to Definition | F12 | F12 | 跳到符号定义 · ⌘+click 同效 |
| Peek Definition | ⌥F12 | AltF12 | 不跳走 · 在原地弹出定义内联视图 |
| Go to Type Definition | 命令面板搜 type def | 命令面板搜 type def | 跳到类型定义（TS / Java 等强类型语言） |
| Find All References | ⇧F12 | ⇧F12 | 列出该符号所有使用位置 · Day 13 详讲重构 |
| Go to Symbol（当前文件） | ⌘⇧O | Ctrl⇧O | 已学 · 配合 `@:` 按类型分组 |
| 跳到匹配括号 | ⌘⇧\ | Ctrl⇧\ | 光标在 `{` 时跳到对应 `}` · 嵌套救命 |

老司机操作链：F12 跳进去看 → 看完按 ⌃- 跳回来。配合断点调试体感极佳

## 光标移动：修饰键 = 作用域

15 MIN

把上面那张「修饰键 = 作用域」的图刻进脑子。 接下来每一条快捷键都是它的具体应用——你不需要记， **你需要推导** 。

←→

NO MODIFIER · 字符

### 逐字符移动

← / → 一字符
↑ / ↓ 一行

⌥ + ←→

OPTION · 按词

### 逐词跳跃

⌥← / ⌥→ 词边界
识别标识符 / camelCase

⌘ + ←→

COMMAND · 行首尾 / 文件

### 行/文件级跳

⌘← / ⌘→ 行首尾
⌘↑ / ⌘↓ 文件首尾

⇧ + 任意

SHIFT · 选中

### 移动 + 同时选中

⇧← 选一字
⇧⌥→ 选一词
⇧⌘↓ 选到文件尾

### 光标移动完整速查

| 动作 | macOS | Win / Linux | 归纳 |
| --- | --- | --- | --- |
| 字符移动 | ← → | ← → | 无修饰 = 最小单位 |
| 按词移动 | ⌥← ⌥→ | Ctrl← Ctrl→ | ⌥ = WORD |
| 行首 / 行尾 | ⌘← ⌘→ | Home End | ⌘ = LINE |
| 文件首 / 文件尾 | ⌘↑ ⌘↓ | CtrlHome CtrlEnd | ⌘ + 纵向 = FILE |
| 翻页 | fn↑ fn↓ | PgUp PgDn | 整屏滚动 |
| 滚动但光标不动 | ⌃↑ ⌃↓ | Ctrl↑ Ctrl↓ | 仅滚屏 · 看上下文不丢光标 |
| 跳匹配括号 | ⌘⇧\ | Ctrl⇧\ | 嵌套救星 |
| 跳定义 | F12 | F12 | LSP 加持 |
| 返回上一个位置 | ⌃- | Alt← | 跳完一定要会回来 |

### 进阶：按 camelHumps 跳词

默认 ⌥→ 把 `getUserProfile` 当一个词。如果想让它 **在大小写边界处也停** （即按 `get` → `User` → `Profile`），需要装扩展 **Subword Navigation** （或自己写 keybinding）。Vim 党尤其受用。

```
// keybindings.json — 给 camelHumps 跳词绑键
[
  {
    "key": "alt+cmd+right",
    "command": "cursorWordPartRight",
    "when": "editorTextFocus"
  },
  {
    "key": "alt+cmd+left",
    "command": "cursorWordPartLeft",
    "when": "editorTextFocus"
  }
]
```

`cursorWordPartRight` / `cursorWordPartLeft` 是 VSCode 内置命令 —— 不用装扩展也能用

## 选择艺术：Smart Select 与扩展选择

10 MIN

规则只有一条： **把任何「移动」前面加 ⇧，就变成「选择」** 。 除此之外还有几个独立的「整块选择」快捷键，是 VSCode 区别于其他编辑器的优势。

### 选择四件套

| 动作 | macOS | Win / Linux | 归纳 |
| --- | --- | --- | --- |
| 选一字符 / 一词 / 到行尾 | ⇧→ · ⇧⌥→ · ⇧⌘→ | ⇧→ · ⇧Ctrl→ · ⇧End | ⇧ + 任意移动 |
| 选当前行 | ⌘L | CtrlL | L = Line |
| 选当前词 / 重复同样的词 | ⌘D | CtrlD | 明天 Day 05 多光标主角 |
| Smart 扩展选择 | ⌃⇧⌘→ | ⇧Alt→ | 按语法层级扩大（词→括号→语句→块） |
| Smart 缩小选择 | ⌃⇧⌘← | ⇧Alt← | 退一步 · 一直用扩展直到选对再回缩 |
| 全选 | ⌘A | CtrlA | 整个文件 |
| 选到匹配括号 | ⌘⇧\ 然后 ⇧+前面 | 同左 | 组合即可 |

### Smart Select 的威力

最被低估的快捷键。基于 **语法树** （AST），按层级逐步扩选：单词 → 括号内 → 整个表达式 → 整个语句 → 整个函数。

```
// 把光标放在 message 这个词上
function greet(name) {
  const message = "Hello, " + name;
  console.log(message); // ← 光标在这
}

// 连按 ⌃⇧⌘→ 的扩选序列：
// 1 次：message
// 2 次：(message)
// 3 次：console.log(message)
// 4 次：console.log(message);
// 5 次：整个 function 体
// 6 次：整个 function 声明
```

配合 ⌘C 复制一个完整表达式 / 函数 —— 比鼠标拖选准 10 倍

## 行操作四件套：编辑速度的差距点

10 MIN

这一节 8 个快捷键，是_老司机和新手编辑速度差 5 倍_的根本原因。 它们都 **不需要选中** ——光标在哪行就操作哪行。

| 动作 | macOS | Win / Linux | 说明 |
| --- | --- | --- | --- |
| 删除整行 | ⌘⇧K | Ctrl⇧K | K = Kill · 不用先选 |
| 向下 / 上复制行 | ⇧⌥↓ / ↑ | ⇧Alt↓ / ↑ | 复制黏贴的零摩擦版 |
| 向下 / 上移动行 | ⌥↓ / ↑ | Alt↓ / ↑ | 重新排序代码 · 比剪贴板快 |
| 下方插入空行 | ⌘⏎ | Ctrl⏎ | 光标在行中也能瞬间下沉一行 |
| 上方插入空行 | ⌘⇧⏎ | Ctrl⇧⏎ | 不破坏当前行 |
| 合并行（Join Lines） | ⌃J | 需绑 `editor.action.joinLines` | 把光标行与下一行合并 |
| 剪切行（无选择时） | ⌘X | CtrlX | 不选中就是整行 |
| 复制行（无选择时） | ⌘C | CtrlC | 不选中就是整行 |
| 行注释 / 取消 | ⌘/ | Ctrl/ | 按语言自动识别注释符 |
| 块注释 | ⌘⌥/ | Ctrl⇧/ | 用 `/* */` 包裹 |

### 行操作组合拳示例

```
// 场景 1：把同一行配置复制 5 份，改成数组
// 起点：
const item1 = { name: "foo", value: 1 };

// 操作：⇧⌥↓ ⇧⌥↓ ⇧⌥↓ ⇧⌥↓ → 连按 4 次向下复制

// 结果（4 秒内完成）：
const item1 = { name: "foo", value: 1 };
const item1 = { name: "foo", value: 1 };
const item1 = { name: "foo", value: 1 };
const item1 = { name: "foo", value: 1 };
const item1 = { name: "foo", value: 1 };

// 然后用明天 Day 05 的多光标 ⌘D 一键改名为 item1...item5
```

```
// 场景 2：把语句顺序错了的代码瞬间重排
// 起点（顺序错）：
const result = compute(data);
const data = loadData();
console.log(result);

// 操作：光标在第 2 行 → ⌥↑ → 上移一行

// 结果：
const data = loadData();
const result = compute(data);
console.log(result);
```

这就是为什么 **行操作是「编辑速度差异」的根本** —— 它把「剪切 → 找位置 → 粘贴」三步压缩成一个快捷键

## 动手练习

25 MIN · 3 LABS

今天三个 Lab 全部_禁用方向键_（除了和修饰键组合时）—— 逼自己脱离「按住 → 等光标移过去」的旧习惯。

### Lab 1 — 5 分钟无方向键导航

用 Day 03 那个 `~/vscode-day03-team` 项目，或随便 clone 一个有几十个文件的开源仓库。

1. 用 ⌘P 打开 `README.md`
2. 用 ⌃G 跳到第 10 行
3. 用 ⌘P 打开 `.vscode/settings.json`
4. 用 ⌘⇧O 看当前文件结构,跳到任意一个键
5. 用 ⌃- 返回 README.md
6. 用 ⌃⇧- 重新前进到 settings.json
7. 用 ⌘T 在整个工作区找一个符号（如果是代码仓库，找函数名）
8. 用 F12 跳到它的定义，再用 ⌃- 返回

能在 3 分钟内完成 = 良好；5 分钟 = 合格；超过 = 重做一次

### Lab 2 — 行操作组合拳

复制下面这段代码到任意 `.ts` 文件，按提示 **纯快捷键** 完成重构。

```
// 起始代码 — 顺序错乱的工厂方法
function createUser() {
  return user;
  const user = { name: "Alice" };
  user.role = "admin";
  user.createdAt = new Date();
}
```

**目标** ：

```
function createUser() {
  const user = { name: "Alice" };
  user.role = "admin";
  user.createdAt = new Date();
  user.active = true; // 新增一行
  user.active = true; // 复制一份
  return user;
}
```

**操作序列** （不要碰鼠标）：

1. 光标在 `return user;` 那行 → ⌥↓×4 把它移到最后
2. 光标在 `user.createdAt = new Date();` 那行末 → ⌘⏎ 下方插入新行
3. 输入 `user.active = true;`
4. 立即 ⇧⌥↓ 向下复制一份

### Lab 3 — Smart Select 实验

用 Smart Select 替代鼠标拖选。打开任意一个有嵌套结构的代码文件（推荐 JSON 或 TS）。

1. 把光标放在 **最深层** 的某个值/标识符上
2. 连按 ⌃⇧⌘→（Win: ⇧Alt→） **5 次**
3. 观察选区如何按语法层级一步步扩大
4. 选过头了？⌃⇧⌘← 退一步
5. 选到想要的层级后 → ⌘C 复制 → ⌘P 跳到另一个文件 → ⌘V 粘贴

**预期感受** ：第一次用觉得「这不就是括号匹配？」；用一周后会发现， **所有「选中一个完整逻辑单元」的场景** 它都更准。

REFLECTION

### 今天的认知转变

「方向键 + 鼠标」是字符级思维；「修饰键组合」是 **语义级思维** 。后者才匹配代码本身的结构 —— 词、行、函数、块。

CHALLENGE

### 附加挑战

关掉 **左右方向键** （用键盘改键工具或拔键帽）一天，强迫使用 ⌥/⌘ 组合。第二天再用方向键时，你会觉得它「慢得离谱」。

## 常见疑问

5 QUESTIONS

### Q1 · Windows / Linux 上 ⌥ 对应 Alt，那为什么不全用 Alt 命名？

ANS

因为 **历史与品牌问题** ——macOS 一直叫 `Option`（符号 ⌥），Win 一直叫 `Alt`，键位相同但名字不同。VSCode 官方文档用 `Alt` 作标准名（因为 Windows 用户更多），但 macOS 用户读到 `Alt` 时要在脑子里换成 `⌥`。本文档全程 **同时列出两个平台的写法** ，避免歧义。 **记忆窍门** ：键盘上的物理位置一样（空格键左右两侧），按下去就是它，名字无所谓。

### Q2 · ⌘P 搜不到某个文件，但它确实在工作区里？

ANS

大概率被 `files.exclude` 或 `search.exclude` 排除了。检查 `.vscode/settings.json` 和 User settings，看是否有匹配的 glob。 **另一种可能** ：文件在 `.gitignore` 里，而你启用了 `"search.useIgnoreFiles": true`（默认 true）。 **临时绕过** ：在 ⌘P 输入框开头加感叹号 `!filename` 可以包括被忽略的文件（取决于版本）；或者改 settings 让特定目录可搜：`"search.exclude": { "node_modules": false }`。

### Q3 · ⌘T（工作区符号搜索）总是没结果，什么原因？

ANS

原因几乎一定是 **语言服务器没装或没启动** 。⌘T 依赖 LSP 提供符号索引：TypeScript / JavaScript 内置；Python 需要装 **Python** 扩展；Go 需要装 **Go** 扩展并 `go install gopls`；Rust 需要 **rust-analyzer** ；Java 需要 **Language Support for Java** …… **排查步骤** ：(1) 打开一个该语言的文件，看右下角 Status Bar 是否显示语言名；(2) 命令面板搜 `Output` → 切到对应语言服务器的输出，看有没有报错；(3) 如果是大型项目，语言服务器需要几秒到几分钟做初始索引，第一次打开请稍等。

### Q4 · 怎么在分屏的两个编辑器组之间切焦点？

ANS

用 ⌘1 / ⌘2 / ⌘3 直接跳到第 1/2/3 个编辑器组。 **更通用的做法** ：⌘K ⌘← / ⌘K ⌘→（chord 写法）切换到左/右组。还有 ⌘K Z 进入 Zen Mode 把当前组放到最大。 **切 tab vs 切组别搞混** ：⌘⌥← / ⌘⌥→（macOS）是在 **同一组内** 切上/下一个 tab；⌘1/2/3 是切到 **不同的组** 。

### Q5 · 我是 Vim 党，该用 VSCodeVim 扩展还是放弃 Vim？

ANS

三个建议：(1) **VSCodeVim 适合「肌肉记忆很重的 Vim 老用户」** ——保留 hjkl / d/y/p / 文本对象 / 宏 等核心操作。配合 VSCode 的多光标、LSP、调试，得到「Vim 编辑 + VSCode 生态」。(2) **VSCodeVim 不适合纯粹追求性能的人** ——它是用 JS 实现的 Vim 模拟器，在巨型文件下卡顿。这种场景建议用 **NeoVim + nvim-cmp + Mason** 自建。(3) **第三条路** ：放弃 Vim 模态，但保留 Vim 的「文本对象」思维——VSCode 的 Smart Select、按词跳跃、Subword Navigation 已经很接近。今天就先按 VSCode 原生快捷键练熟，21 天后再决定是否需要 Vim。

## 复盘问题

5 QUESTIONS

1. 「修饰键 = 作用域」这一规律里，⌥ / ⌘ / ⇧ 三个修饰键分别代表什么？
2. 导航三件套 ⌘P / ⌘T / ⌘⇧O 分别搜什么？哪一个依赖语言服务器？
3. F12（跳定义）后想回到原来位置，按什么？
4. 不选中任何内容时按 ⌘X 会发生什么？这个特性叫什么设计哲学？
5. Smart Select ⌃⇧⌘→ 选过头了怎么办？

## 今日检查清单

8 ITEMS

- 能在白板上画出「修饰键 = 作用域」示意图
- 导航三件套 ⌘P / ⌘T / ⌘⇧O 不假思索就按出来
- 掌握 F12 跳定义 + ⌃- 返回的循环
- 光标按词移动用 ⌥←/→，行首尾用 ⌘←/→
- 会用 ⌃⇧⌘→（Win: ⇧Alt→）做 Smart Select
- 行操作 4 件套（删 ⌘⇧K / 复制 ⇧⌥↓ / 移动 ⌥↓ / 合并 ⌃J）能盲打
- 完成 3 个 Lab,全程没碰鼠标和方向键单独使用
- 能回答 5 个常见疑问与 5 道复盘题

## 推荐阅读

3 ITEMS

OFFICIAL

### Basic Editing

官方编辑器基础文档,所有光标 / 选择 / 行操作命令的权威来源。今天的快捷键来自这里。

CHEATSHEET

### Keyboard Shortcuts Reference (PDF)

官方 macOS / Win / Linux 三套 PDF。Day 02 推荐过——今天起开始真正用它。

REFERENCE

### VSCode Key Bindings 文档

包含所有内置命令（如 `cursorWordPartRight`）的完整列表,自定义 keybindings.json 时的字典。

## Day 05 预告

NEXT

COMING NEXT

### 多光标与列编辑 — VSCode 最强的「批量魔法」

明天进入 **编辑器内功的高潮** ——多光标。会拆解 ⌘D（选中相同词逐个加光标）、⌥click（任意位置加光标）、⌘⇧L（选中所有相同）、Box Selection（列编辑）等。理解了多光标， **SQL 列对齐、批量改 import 路径、给 100 个变量加前缀、改 JSON 的所有键名** 都会变成 5 秒钟的事。

"修饰键不是要记的快捷键 —— 它是你思考代码结构的语法。"

DAY 04 · VSCODE 21-DAY ROADMAP
