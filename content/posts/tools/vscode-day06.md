---
title: "Day 06 · 搜索、替换与正则"
date: '2026-05-25'
draft: false
description: "VSCode 搜索两套体系 —— ⌘F 单文件 / ⌘⇧F 全工作区。正则捕获组 ($1 $2)、大小写转换 (\\U \\L)、lookbehind/lookahead、include/exclude glob。多光标是临时正则,正则是永久多光标。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 06
---

DAY 06 · VSCODE ROADMAP · 21 DAYS

# 正则是 _永久的多光标_

昨天讲多光标时说过——「_多光标是临时正则,正则是永久多光标_」。 今天补上这块拼图。 我们把搜索范围从「单文件」扩展到「整个工作区」,把替换从「字面量」升级到「捕获组 + 大小写转换」, 最后理解 VSCode 一个常被忽视的设计—— **搜索结果窗口本身就是一个可编辑的预览** 。

**DURATION** 60 min **THEORY** 25 min **HANDS-ON** 25 min **REVIEW** 10 min **POWER MOVE** ⌘F + ⌥⏎

## 思维导图

OVERVIEW

> **图：Day 06 思维导图**
>
> - DAY 06 · 搜索 · 替换 · 正则
> - FILE · WORKSPACE · REGEX · LIVE-EDIT
> - 01 · FILE
> - ⌘F 单文件搜索
> - 02 · WORKSPACE
> - ⌘⇧F + glob
> - 03 · REGEX
> - 捕获组 + $1 \U
> - 04 · LIVE-EDIT
> - 结果即编辑器
> - Aa / Wholeword / .\*
> - ⌘G / ⌘⇧G 上下匹配
> - ⌥⏎ 当前结果全选
> - 在选区内查找
> - ⌘⇧F 全工作区
> - ⌘⇧H 多文件替换
> - files to include / exclude
> - search.exclude 全局
> - () 捕获 · $1 $2 引用
> - \U \L 大小写
> - (?\<=) (?=) 边界
> - 命名捕获 (?\<name\>)
> - 结果直接改
> - × 排除单条
> - Open in Editor
> - 和 ripgrep 关系
> - DELIVERABLES
> - 三个开关肌肉记忆
> - 写出 5 个常用正则
> - glob 限定搜索范围
> - 完整跨文件重构

FIG · Day 06 全景：从单文件搜索 → 全工作区 → 正则进阶 → 结果可编辑

## 核心:作用域金字塔与捕获管道

FOUNDATION

VSCode 的搜索是_两个正交的维度_: 纵向是「作用域」(单文件 → 工作区 → glob 子集), 横向是「能力」(字面量 → 正则 → 捕获组替换)。 把这两个维度组合起来,就是今天要掌握的全部。

> **图：搜索作用域与捕获管道**
>
> - SCOPE PYRAMID + CAPTURE PIPELINE
> - SCOPE
> - ⌘⇧F · WORKSPACE
> - 整个工作区 · 所有文件
> - FILES TO INCLUDE
> - src/\*\*/\*.ts · 子集过滤
> - ⌘F · FILE
> - 当前文件
> - IN SELECTION
> - 选中范围内
> - NARROWING
> - CAPTURE PIPELINE
> - PATTERN · search box
> - import (\w+) from "(.+)"
> - MATCH · in source
> - import Button from "@/components"
> - REPLACE · with $1 $2
> - import $1 from "@/ui/$2"
> - RESULT · in source
> - import Button from "@/ui/@/components"

FIG · 左:作用域金字塔从大到小;右:捕获组从模式到结果的四步管道

VERTICAL · 作用域

### 从大到小不断收窄

工作区 → glob 限定 → 单文件 → 选区。每收窄一层,精度更高、误改更少。

HORIZONTAL · 能力

### 从字面量到正则到捕获

找一个词 → 找一个模式 → 用模式提取再重组。今天目标是把这条横轴跑到尾。

CROSS · 组合

### 4 × 3 = 12 种场景

4 种作用域 × 3 种能力 = 12 种典型搜索场景。后面会用 5 个真实案例覆盖最常用的几格。

## ⌘F:单文件搜索的三个开关

10 MIN

⌘F 看着简单,但搜索框右侧那_三个小图标_(`Aa` / `Ab|` / `.*`) 决定了你是用「字面量」还是「正则」、是「精确」还是「模糊」。 老司机 90% 的搜索都先调好这三个开关再开始打字。

### 三个开关

| 图标 | 含义 | 切换快捷键 | 使用建议 |
| --- | --- | --- | --- |
| `Aa` | Match Case · 大小写敏感 | ⌥C | 找标识符时一定开;找文档/中文时关 |
| `Ab\|` | Whole Word · 整词匹配 | ⌥W | 找 `id` 时必开,否则会匹配 `idx` / `uuid` |
| `.*` | Regex · 正则匹配 | ⌥R | 需要捕获组、模糊匹配、跨字段时必开 |

### ⌘F 完整快捷键

| 动作 | macOS | Win / Linux | 说明 |
| --- | --- | --- | --- |
| 打开搜索框 | ⌘F | CtrlF | 当前文件 |
| 打开搜索 + 替换 | ⌥⌘F | CtrlH | 多一行替换框 |
| 下一个匹配 | ⌘G · ⏎ | F3 · ⏎ | 跳过、再跳过 |
| 上一个匹配 | ⌘⇧G | ⇧F3 | 回退 |
| 把当前所有匹配变多光标 | ⌥⏎ | Alt⏎ | POWER MOVE · 比 ⌘⇧L 更精准(可加正则过滤) |
| 在选区内搜索 | 先选 → 再 ⌘F → 点 `\|...\|` 图标 | 同左 | 把搜索范围限制在选区 |
| 替换当前匹配 | ⌘⇧1 | Ctrl⇧1 | 逐个确认替换 |
| 替换全部 | ⌘⌥⏎ | CtrlAlt⏎ | 当前文件全替换 |
| 关闭搜索框 | Esc | Esc | 退回编辑 |

### ⌘F + ⌥⏎ 黄金组合

Day 05 已经预告过——这是 **多光标的另一条进入通道** ,而且比 ⌘⇧L 更精准: 你可以先用三个开关过滤(case-sensitive / whole-word / regex), 满意后 ⌥⏎ 把当前所有匹配一次性变成多光标。

```
// 场景:把变量名 "id" 改成 "userId" — 但不能误改 idx / uuid
const id = req.params.id;
const idx = list.indexOf(id);
const uuid = generateUuid();
const u = users.find(u => u.id === id);

// 步骤:
// 1. ⌘F 打开搜索框
// 2. 输入 id
// 3. ⌥W 打开 Whole Word(关键!避免命中 idx / uuid)
// 4. ⌥C 打开 Match Case(避免命中 ID)
// 5. ⌥⏎ 把所有 id 变多光标
// 6. Esc 关闭搜索框,继续保留多光标
// 7. ⌘← 跳到每个 id 前 → 输入 user → 末尾大写化

// 结果:
const userId = req.params.userId;
const idx = list.indexOf(userId); // idx 没改
const uuid = generateUuid(); // uuid 没改
const u = users.find(u => u.userId === userId);
```

这就是「过滤 → 转多光标 → 编辑」三步舞 —— 比 ⌘⇧L 安全得多

## ⌘⇧F:全工作区搜索 + glob 限定

15 MIN

⌘⇧F 不是 ⌘F 的「升级版」—— 它是_完全不同的工具_。 它打开的是 Activity Bar 的 Search 视图,带左侧文件树预览,本身就是一个迷你 IDE。

### 全工作区搜索快捷键

| 动作 | macOS | Win / Linux | 说明 |
| --- | --- | --- | --- |
| 全工作区搜索 | ⌘⇧F | Ctrl⇧F | 打开 Search 视图 |
| 全工作区替换 | ⌘⇧H | Ctrl⇧H | 展开替换行的 Search 视图 |
| 用当前选中作为搜索词 | 选中 → ⌘⇧F | 同左 | 搜索框自动预填 |
| 展开 / 折叠所有结果 | 点击工具栏箭头 | 同左 | 大量结果时收起 |
| 从结果中排除某条 / 某文件 | 悬浮 → 点 × | 同左 | 批量替换前先排除误命中 |
| 在编辑器打开搜索结果 | 结果窗口右上角 `Open in Editor` | 同左 | 当作可编辑列表 |
| 回到上次搜索词 | ↑ 在搜索框 | 同左 | 搜索框有历史 |

### files to include / exclude · glob 实战

Search 视图展开后会显示两栏 glob 输入: `files to include`(只搜哪里) 和 `files to exclude`(不搜哪里)。 glob 模式是搜索精度的 **第二把刀** 。

| glob | 含义 | 典型用法 |
| --- | --- | --- |
| `**/*.ts` | 所有目录里的 .ts 文件 | 限定 TypeScript 源码 |
| `src/**/*.{ts,tsx}` | src 下所有 ts/tsx | 排除 tests / scripts / docs |
| `! **/node_modules/** ` | 感叹号 = 否定 · 排除 node\_modules | 本地有 dependency 时 |
| `**/*.test.ts` | 所有测试文件 | 跨文件改测试用例 |
| `./packages/api/**` | monorepo 中的某个包 | 限定子包 |
| `**/*.{md,mdx,html}` | 多扩展名一次匹配 | 跨文档格式 |
| 空着 | 用全局 search.exclude | 大多数时候依赖默认就够 |

### 全局排除:`search.exclude`

不想每次都手填「排除 node\_modules」?写进 `settings.json` 一劳永逸。 Day 03 的团队 `.vscode/settings.json` 模板里已经埋了一份,这里展开看一下。

```
// settings.json — User 或 Workspace 都可
{
  "search.exclude": {
    // 包管理器
    "**/node_modules": true,
    "**/ __pycache__": true,
    "**/.venv": true,
    "**/vendor": true,

    // 构建产物
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/coverage": true,

    // 锁文件(很大,几乎不需要搜)
    "**/pnpm-lock.yaml": true,
    "**/package-lock.json": true,
    "**/yarn.lock": true,
    "**/Cargo.lock": true,

    // 二进制/媒体(搜不出文本)
    "**/*.{png,jpg,jpeg,gif,svg,pdf,zip}": true
  },

  // 是否使用 .gitignore 自动排除(默认 true,推荐保持)
  "search.useIgnoreFiles": true,
  "search.useGlobalIgnoreFiles": true,
  "search.useParentIgnoreFiles": true
}
```

`files.exclude` 控制文件浏览器,`search.exclude` 单独控制搜索 —— 两者解耦

### ⌘F vs ⌘⇧F 决策表

| 场景 | 用什么 | 原因 |
| --- | --- | --- |
| 当前文件改名一处变量 | ⌘F + ⌥⏎ | 用多光标看着改最安全 |
| 跨文件改 import 路径 | ⌘⇧H | 预览结果再确认替换 |
| 找一个函数被谁调用 | F12 / ⇧F12 (Day 13) | 语义级,不要用文本搜 |
| 找一段错误日志的来源 | ⌘⇧F | 跨文件文本搜最快 |
| 给 README 改一处错别字 | ⌘F | 当前文件就够 |
| monorepo 只在 packages/api 找 | ⌘⇧F + glob | include 限定 packages/api/\*\* |

## 正则:捕获组与替换语法

15 MIN

正则的核心不是元字符,而是_捕获组_—— 把匹配中「我感兴趣」的部分用 `()` 包起来, 在替换时用 `$1 $2` 取出来重组。 看懂这一节,你的搜索能力会跨一个台阶。

### VSCode 正则要点(基于 JavaScript RegExp)

| 语法 | 用法 | 例子 |
| --- | --- | --- |
| `(...)` | 捕获组 | `(\w+) from` |
| `$1 $2` | 替换中引用第 N 个组 | 替换框写 `const $1 = ...` |
| `$0` | 引用整个匹配 | `// $0` 把匹配做成注释 |
| `\U$1` | 把 $1 转大写 | `foo` → `FOO` |
| `\L$1` | 把 $1 转小写 | `FOO` → `foo` |
| `\u$1` | $1 首字母大写(其余不变) | `foo` → `Foo` |
| `(?:...)` | 非捕获组(只分组不捕获) | 避免占用 $1 |
| `(?<name>...)` | 命名捕获 | 用 `$<name>` 引用 |
| `(?=...)` | 正向先行(后面是什么) | `foo(?=Bar)` · 只匹配后跟 Bar 的 foo |
| `(?!...)` | 负向先行(后面不是什么) | `foo(?!Bar)` |
| `(?<=...)` | 正向后行(前面是什么) | `(?<=class )\w+` |
| `(?<!...)` | 负向后行 | `(?<!_)\d+` |

### 五个高频配方(背下来)

RECIPE 01 · IMPORT 路径

### 批量改 import 别名

FIND

from ['"]@/components/(.+)['"]

REPLACE

from "@/ui/$1"

把 `@/components/Button` 全部改成 `@/ui/Button`,保留后面的子路径

RECIPE 02 · CASE 转换

### snake\_case → camelCase

FIND

\_(\w)

REPLACE

\U$1

`user_id` → `userId`;`created_at` → `createdAt`。 **建议先选区限定** ,避免误改字符串

RECIPE 03 · CONSOLE 清理

### 删除所有 console.log 行

FIND

`^\s\*console\.log\(.\*\);?\s\*\n`

REPLACE

(留空)

把整行替换为空,连带换行符。`^` 是行首,`\s*` 包容缩进

RECIPE 04 · LOOKBEHIND

### 给所有 class 名加前缀

FIND

(?\<=class )(\w+)

REPLACE

App$1

`class User` → `class AppUser`。lookbehind 不消费 `class`,只匹配后面的标识符

RECIPE 05 · 命名捕获

### 解析日志重排

FIND

`\[(?\<level\>\w+)\] (?\<msg\>.+)`

REPLACE

$\<level\>: $\<msg\>

日志格式从 `[INFO] connected` 重写为 `INFO: connected`。命名捕获让正则 **可读得多**

RECIPE 06 · 反转

### 键值对调换位置

FIND

"(\w+)": "(\w+)"

REPLACE

"$2": "$1"

JSON 里所有 key:value 调换成 value:key。$1 $2 引用顺序自由

### 三个常见陷阱

PITFALL 01

### 贪婪 vs 懒惰

`.+` 默认贪婪,会一直吃到行尾;加 `?` 变懒惰 `.+?`,匹配到最近的下一个就停。

PITFALL 02

### VSCode 不支持多行

VSCode 单文件搜索默认 **不跨行** 。要跨行需要 `[\s\S]+?` 这种「任意字符含换行」trick;或开 Search 视图的 `Search Editor`。

PITFALL 03

### 转义字符要双层

正则的反斜杠在 JSON 配置里要写 `\\`;但在搜索框直接 `\` 即可。混淆点常出现在抄博客代码时。

## 搜索结果即编辑器

10 MIN · UNDERRATED

VSCode 一个_极易被忽视_的设计: 搜索结果窗口里的每一行都 **不是只读快照** —— 你可以直接在结果上编辑、删除、排除,所有修改会同步回源文件。 这是「批量重构」最优雅的工作流。

### 三种结果操作

操作 01 · 直接编辑

### 把结果当代码改

点击搜索结果中的某一行匹配,直接在结果面板输入——VSCode 会同步修改源文件。看到不对劲随时改。

操作 02 · × 排除单条

### 选择性替换

悬浮在某一行结果上 → 出现 × 图标 → 点击排除该行。 **批量替换前先用 × 剔除误命中** 是老司机保命招式。

操作 03 · Open in Editor

### 结果当编辑器打开

点工具栏右上角 `Open in Editor` 图标 → 把结果作为 **Search Editor** 文件打开,可保存、可分享、可二次搜索。

### 完整跨文件重构工作流

```
// 任务:把所有 createUser(name) 改成 createUser({ name })
// — 但有些地方接收的不是字面量 name,要排除

// 1. ⌘⇧H 打开全工作区替换
// 2. 开正则 .*
// 3. Find: createUser\((\w+)\)
// Replace: createUser({ $1 })
// 4. 不要立刻按 Replace All!先看结果窗口

// 5. 浏览每一条匹配,发现:
createUser(name); // ✓ 应该改
createUser(getName()); // ✗ getName() 不能放成对象 key
createUser(currentUser); // ✓ 改
createUser(undefined); // ✗ undefined 是 reserved

// 6. 悬浮第 2 条结果 → 点 × 排除
// 7. 悬浮第 4 条结果 → 点 × 排除
// 8. 现在结果只剩 2 条 → 点 Replace All
// 9. 完成 — 误命中 0 个
```

### Search Editor:把搜索结果保存成文件

工具栏的 `Open in Editor` 把当前搜索结果 **另存为一个 .code-search 文件** 。 这是 VSCode 一个低调但强大的功能——你可以:

- **保存调研笔记** :研究开源项目时,把「所有 useEffect 调用」的搜索结果保存,边读边记
- **跨会话复用** :同一组搜索条件下次打开继续看
- **分享给同事** :.code-search 文件可以 git commit,review 别人的搜索发现
- **二次过滤** :在 Search Editor 内继续 ⌘F 在结果里再搜

许多人把 ripgrep / ack 输出贴到 Markdown 当笔记 —— Search Editor 替代了这个流程

### 底层引擎:ripgrep

VSCode 的全工作区搜索 **底层就是 ripgrep** (`rg`)—— Rust 写的高性能 grep。所以搜大型 monorepo 时也很快、自动尊重 `.gitignore`、不需要装额外索引。 Day 16 讲扩展时还会回到 ripgrep——它在终端里也好用。

## 动手练习

25 MIN · 3 LABS

三个 Lab 各对应今天三层能力: _单文件 + 多光标_、 _捕获组重写_、 _跨文件 + glob_。

### Lab 1 — ⌘F + ⌥⏎ 多光标

把下面这段贴入 VSCode,用 ⌘F → ⌥⏎ 把所有 **纯字面量 id** 改成 `userId`(注意保护 idx / uuid)。

```
function process(id) {
  const idx = list.indexOf(id);
  const uuid = generateUuid();
  if (id) {
    return { id, idx, uuid };
  }
  return id;
}
```

**步骤** :

1. ⌘F 输入 `id`
2. ⌥W 打开 Whole Word(关键!避免误命中 idx / uuid)
3. ⌥C 打开 Match Case
4. 右下角应显示 「6 of 6」(全是 id)
5. ⌥⏎ 全选为多光标
6. Esc 关搜索框
7. 输入 `userId`

挑战目标: **10 秒内完成** ,且 idx/uuid 不被误改

### Lab 2 — 捕获组改 import 路径

下面这段是某次重构后产生的 import 列表,把所有 `@/components/X` 改成 `@/ui/X`。

```
import Button from "@/components/Button";
import { Card, CardHeader } from "@/components/Card";
import Input from "@/components/forms/Input";
import { Modal } from "@/components/feedback/Modal";
import logger from "@/utils/logger"; // ← 不能改
```

**步骤** :

1. ⌥⌘F(Win: Ctrl H)打开搜索 + 替换
2. 开正则 ⌥R
3. Find 框: `@/components/(.+)`
4. Replace 框: `@/ui/$1`
5. 逐条按 ⌘⇧1 替换,确认结果。注意第 5 行 `@/utils/logger` 不会匹配

### Lab 3 — 全工作区 + glob 实验

用 Day 03 创建的 `~/vscode-day03-team` 项目(或随便一个有几个目录的代码库)。

1. ⌘⇧F 打开 Search 视图
2. 展开 `files to include` / `files to exclude` 输入框
3. 在 include 里输入 `**/*.json` — 只搜 JSON 文件
4. 在 exclude 里输入 `**/package*.json` — 不搜 package.json / package-lock.json
5. 搜索词输入 `"recommendations"`
6. 结果窗口应只显示 `.vscode/extensions.json`
7. 点工具栏 `Open in Editor` → 看到 .code-search 文件被打开
8. (可选)⌘S 保存成 `find-recommendations.code-search` — 这就是搜索的「快照保存」

REFLECTION

### 三个 Lab 的纵深

从「单文件 + 字面量」到「单文件 + 正则捕获」到「跨文件 + glob 限定」。每深一层,误改概率指数下降。 **越大的修改越要先收窄作用域** 。

CHALLENGE

### 附加挑战

把 Lab 2 的 import 重写做成 **全工作区** 替换:用 ⌘⇧H 打开,加 glob `**/*.{ts,tsx}` 限定,先在结果窗口检查所有匹配,排除任何看着不对的,再 Replace All。

## 常见疑问

5 QUESTIONS

### Q1 · ⌘F 和 ⌘⇧F 究竟有什么本质区别?能不能只用一个?

ANS

本质区别在 **「在哪儿搜 + 结果在哪儿展示」** :`⌘F` 是 **嵌入式** ——搜索框浮在编辑器上方,结果直接高亮在当前文件里;`⌘⇧F` 是 **独立视图** ——打开 Activity Bar 的 Search 视图,结果以列表展示,可以跨多文件。 **能力差异** :`⌘F` 不能跨文件、不支持 include/exclude glob、没有结果排除功能;`⌘⇧F` 不支持「⌥⏎ 把匹配变多光标」(因为多光标只在单文件有意义)。 **用一个够吗** :不够。两个工作流完全不同——`⌘F` 是 **「找+改一处」** ,`⌘⇧F` 是 **「调研+批量改」** 。日常都会用到。

### Q2 · 搜索总是出现 node\_modules / dist 里的结果,我已经写了 .gitignore 为什么还在?

ANS

三个排查点:(1) **检查 `search.useIgnoreFiles` 是否开启** (默认 true)——关了的话 .gitignore 不会被尊重。(2) **该目录可能没有被 .gitignore 覆盖** ——比如 .gitignore 写的是 `/node_modules`(根级),但你在 monorepo 子包里有 `packages/api/node_modules`。改成 `**/node_modules` 才能全局排除。(3)**建议在 settings.json 里加一份 `search.exclude` 兜底 **——这样不依赖 .gitignore,本节 §02 的模板已经给出。** 临时绕过**:在 Search 视图的 `files to exclude` 框里手动加。

### Q3 · 正则替换里 `$0` / `$1` / `$<name>` 的编号规则到底怎么算?

ANS

**$0 是整个匹配** (包括没在任何 () 里的部分); **$1 / $2 / ...** 按**左括号 (** 出现顺序编号——从左到右数,无论嵌套多深。例如 `((a)(b))(c)` 中:$1 = ab,$2 = a,$3 = b,$4 = c。**非捕获组 (?:...) 不占编号**——这是它存在的意义。 **命名捕获** 用 `(?<name>...)` 定义,用 `$<name>` 引用——它仍然占编号位,所以也可以用 `$1` 同时引用。 **实战建议** :超过 3 个捕获组就用命名捕获,可读性差距巨大。

### Q4 · Replace All 后发现替换错了,怎么撤销?

ANS

分情况:(1) **单文件 ⌘F 替换** ——直接 ⌘Z,VSCode 把整个替换视为一次编辑操作。(2) **全工作区 ⌘⇧H 替换** ——VSCode **没有「一键全部撤销」** 。每个文件需要分别打开按 ⌘Z。如果你 **替换前已经 git commit** ,直接 `git checkout .` 最干净。(3) **预防胜于补救** ——大型替换 **务必先 commit** ;并先在结果窗口逐条 review、用 × 排除可疑项、再点 Replace All。Day 11 学完 Git 后,这个流程会变成肌肉记忆。 **第三招** :开启文件 timeline(Day 03 提过)——VSCode 内置的文件版本历史,允许回滚某个文件到几小时前。

### Q5 · VSCode 搜索和命令行 `rg` / `grep` 是什么关系?重复了吗?

ANS

VSCode 的全工作区搜索 **底层就是 ripgrep** (rg)——同一个工具,不同入口。所以速度、正则方言、glob 语义都和 `rg` 命令完全一致。 **区别在 UI 与工作流** :VSCode 加了三层增强——(1) 结果可点击跳转到源文件;(2) 结果窗口可直接编辑替换;(3) Search Editor 可保存为 .code-search 文件分享。 **什么时候用命令行 rg** :(a) 写脚本/CI(`rg --json | jq`)、(b) 远程机器没装 VSCode、(c) 需要管道到其他工具(`rg foo | wc -l`)。 **什么时候用 VSCode 搜索** :99% 的日常调研、重构、修改场景。

## 复盘问题

5 QUESTIONS

1. ⌘F 搜索框右侧的三个开关分别是什么?它们的快捷键是?
2. 「⌘F + ⌥⏎」组合做了什么?它和 ⌘⇧L 比有什么优势?
3. 正则替换里 `\U$1` 是什么意思?`$0` 和 `$1` 的区别是?
4. monorepo 中只想搜索 `packages/api` 下的 .ts 文件,glob 应该怎么写?
5. 大型跨文件替换最稳妥的工作流是什么?(预防替换出错)

## 今日检查清单

8 ITEMS

- 能熟练用 ⌥C / ⌥W / ⌥R 切换三个开关
- 掌握「⌘F + ⌥⏎ → 多光标」黄金组合
- 区分 ⌘F (单文件) 与 ⌘⇧F (全工作区) 的使用场景
- 能写出至少 3 个常用正则配方(import 重写 / case 转换 / 删除日志)
- 理解 `$0 / $1 / $<name> / \U / \L` 的语义
- 会用 `files to include` / `exclude` glob 收窄搜索
- 给 settings.json 加了一份合理的 `search.exclude`
- 完成 3 个 Lab,理解搜索结果窗口的可编辑性

## 推荐阅读

3 ITEMS

OFFICIAL

### Searching across files

VSCode 全工作区搜索的官方文档。glob、include/exclude、Search Editor 的权威说明。

REFERENCE

### JavaScript RegExp · MDN

VSCode 正则基于 JavaScript 引擎。MDN 的 RegExp 文档是查所有元字符、断言、捕获组的最佳词典。

TOOL

### regex101.com

正则在线测试器。写复杂正则前先在这里调通,再粘贴到 VSCode。Flavor 选 ECMAScript/JS 才与 VSCode 一致。

## Day 07 预告

NEXT

COMING NEXT

### Snippets 与 Emmet — 把高频代码模板化

Day 04 的导航 / Day 05 的多光标 / Day 06 的搜索都在解决「 **已经写出来的代码怎么改** 」。 明天的 Snippets 解决「 **怎么快速生成新代码** 」—— 内置 / 用户 / 项目三层 snippet 的优先级、tab stops 与 placeholder、choice 多选项、变量(`$TM_FILENAME`)、Emmet 缩写。 做完明天,你会发现 90% 的样板代码都不用手敲。

"搜索框是编辑器最被低估的命令行 —— 多光标只在当下,正则改未来。"

DAY 06 · VSCODE 21-DAY ROADMAP
