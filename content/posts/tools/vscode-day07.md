---
title: "Day 07 · Snippets 与 Emmet"
date: '2026-05-26'
draft: false
description: "VSCode Snippets 与 Emmet：用户 / 全局 / 项目三层模板、tab stops、placeholder、choice、变量、项目级 .code-snippets，以及 HTML/CSS/JSX 中的 Emmet abbreviation。把高频样板代码压缩成一次 Tab。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 07
---

DAY 07 · VSCODE ROADMAP · 21 DAYS

# 把样板代码压缩成 _一次 Tab_

Day 04 练的是「快速抵达」,Day 05 练的是「批量编辑」,Day 06 练的是「搜索改造」。 今天进入编辑器内功的最后一块: **Snippets 与 Emmet** 。 它们解决的不是「已经写出来的代码怎么改」,而是「 **重复出现的新代码,怎样一次生成到正确形状** 」。

**DURATION** 60 min **THEORY** 20 min **HANDS-ON** 30 min **REVIEW** 10 min **POWER MOVE** prefix + Tab

## 思维导图

OVERVIEW

> **图：Day 07 Snippets 与 Emmet 思维导图**
>
> - DAY 07 · SNIPPETS · EMMET
> - TEMPLATE · TABSTOP · VARIABLE · ABBREVIATION
> - 01 · ANATOMY
> - prefix / body
> - 02 · CURSOR
> - $1 / ${1:x}
> - 03 · SCOPE
> - User / Project
> - 04 · VARIABLES
> - $TM\_FILENAME
> - 05 · EMMET
> - DSL 展开
> - 四个字段
> - prefix
> - body / desc / scope
> - 光标编排
> - $1 → $2 → $0
> - choice / placeholder
> - 三层模板
> - language / global
> - .vscode/\*.code-snippets
> - 上下文变量
> - file / date / clipboard
> - selected text
> - 缩写语言
> - ul\>li\*3
> - m10 / df / jc:c
> - 核心判断
> - 固定结构用 SNIPPET · 层级结构用 EMMET · 团队约定用 PROJECT SNIPPET

SNIPPET IS A TEMPLATE · EMMET IS A SMALL LANGUAGE

## 今天的心智模型

MODEL

SNIPPET

### 固定模板

适合 React 组件、测试用例、日志格式、API 错误返回、团队统一注释。它的优势是 **结构稳定** ,且能安排多个光标依次填写。

EMMET

### 结构缩写

适合 HTML / CSS / JSX 的层级结构。它不是保存好的模板,而是一套缩写语法:用 `> + * $ {}` 描述树。

PROJECT

### 团队约定

如果某段代码是团队规范,不要只存在你自己的 User Snippets 里。放进 `.vscode/*.code-snippets`,让整个项目共享。

一句话: Snippet 负责「可复用代码片段」,Emmet 负责「快速生成标签树」。

## 先把开关调顺

SETTINGS

Snippet 最常见的失败不是语法错,而是补全排序太靠后、Tab 不触发、Emmet 在 JSX 中不展开。 先把这组设置放进 User Settings,今天的练习会顺很多。

```
{
  "editor.tabCompletion": "on",
  "editor.snippetSuggestions": "top",
  "emmet.triggerExpansionOnTab": true,
  "emmet.showSuggestionsAsSnippets": true,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
```

WHY

### 为什么把 snippet 放到 top?

补全列表里 LSP、路径、单词、AI 建议会混在一起。把 snippet 提到上面,可以让短 prefix 更稳定地命中,减少「输入了 rfc 却补成别的东西」的摩擦。

CAUTION

### Tab 展开冲突怎么办?

如果 Tab 同时承担缩进、补全、Emmet 展开,偶尔会有冲突。稳妥方式是先看 Suggest 列表是否选中了正确项,或用命令 `Insert Snippet` / `Emmet: Expand Abbreviation` 明确触发。

## Snippet 语法拆解

ANATOMY

| 字段 / 语法 | 含义 | 例子 | 注意点 |
| --- | --- | --- | --- |
| prefix | 触发词。你输入它,再按 Tab 或 Enter 展开。 | `"prefix": "rfcx"` | 建议短但不和业务词冲突。个人可用 3-5 个字符。 |
| body | 真正插入编辑器的模板。可以是字符串或字符串数组。 | `"body": ["line1", "line2"]` | 数组每一项就是一行,比在字符串里写 `\n` 好维护。 |
| description | 补全列表里展示的解释。 | `"description": "React function component"` | 团队 snippet 一定要写,不然过两个月没人知道它干嘛。 |
| scope | 限制全局 / 项目 snippet 在哪些语言生效。 | `"scope": "typescriptreact,javascriptreact"` | 语言专属 snippet 文件本身已有 scope,一般不需要再写。 |
| $1 / $2 / $0 | Tab stop。展开后光标按编号跳转,`$0` 是最后停靠点。 | `"const $1 = $2;$0"` | 没有 `$0` 时,最后会停在模板末尾。 |
| ${1:default} | Placeholder。第 1 个光标位置带默认文本。 | `${1:ComponentName}` | 输入时默认文本会被整体替换。 |
| ${1\|a,b,c\|} | Choice。第 1 个光标位置给一个可选列表。 | `${1\|GET,POST,PUT,DELETE\|}` | 适合 HTTP method、log level、测试类型这类枚举。 |
| $TM\_SELECTED\_TEXT | 变量。展开时读取当前上下文。 | `${TM_SELECTED_TEXT}` | 常用于把选中文本包进函数、标签、try/catch。 |

## 高频入口

SHORTCUTS

| 动作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 命令面板 | ⌘⇧P | Ctrl Shift P | 搜索 Configure User Snippets、Insert Snippet、Emmet 命令。 |
| 插入 Snippet | ⌘⇧P → Insert Snippet | Ctrl Shift P → Insert Snippet | 不记得 prefix 时,从列表里找。 |
| 展开补全项 | Tab / Enter | Tab / Enter | 选中 snippet 或 Emmet suggestion 后展开。 |
| 跳到下一个 tab stop | Tab | Tab | Snippet 展开后,按编号依次填写。 |
| 跳到上一个 tab stop | ⇧Tab | Shift Tab | 填错上一处时回退。 |
| Emmet 明确展开 | ⌘⇧P → Emmet: Expand Abbreviation | Ctrl Shift P → Emmet: Expand Abbreviation | 当 Tab 被缩进或补全抢走时使用。 |
| 环绕选区 | ⌘⇧P → Emmet: Wrap with Abbreviation | Ctrl Shift P → Emmet: Wrap with Abbreviation | 把已有文本包成标签结构。 |

## 三层 Snippet

SCOPE

USER · LANGUAGE

### 语言专属

通过 `Configure User Snippets` 选择 `typescriptreact.json`、`go.json` 等。只在对应语言生效,适合个人长期习惯。

USER · GLOBAL

### 全局个人模板

创建 `*.code-snippets` 全局文件,再用 `scope` 限制语言。适合跨语言通用的注释、debug、文档模板。

WORKSPACE

### 项目共享模板

放在项目的 `.vscode/*.code-snippets`。适合团队统一的 API response、测试骨架、页面目录结构。这个最应该进 Git。

判断标准: 只服务你自己,放 User；服务这个项目所有人,放 Workspace。

## 三个可直接使用的 Snippet

RECIPES

### 1. React 函数组件骨架

适合放进 `typescriptreact.json`。输入 `rfcx` 后展开,光标先填组件名,再填 props 类型,最后停在 return 内。

```
{
  "React function component with props": {
    "prefix": "rfcx",
    "body": [
      "type ${1:ComponentName}Props = {",
      " ${2:// props}",
      "};",
      "",
      "export function ${1:ComponentName}(props: ${1:ComponentName}Props) {",
      " return (",
      " <${3:div}>",
      " $0",
      " </${3:div}>",
      " );",
      "}"
    ],
    "description": "React function component with typed props"
  }
}
```

### 2. 包裹选中文本的 try/catch

先选中一段代码,再触发 `tryx`。如果没有选区,默认会在 try 块里留一个光标。

```
{
  "Wrap selection in try catch": {
    "prefix": "tryx",
    "body": [
      "try {",
      " ${TM_SELECTED_TEXT:${1:// code}}",
      "} catch (${2:error}) {",
      " console.error(${2:error});",
      " $0",
      "}"
    ],
    "description": "Wrap selected code in try/catch"
  }
}
```

### 3. 团队 API 错误返回

适合放进 `.vscode/team.code-snippets`。用 choice 限定错误码,让团队返回结构保持一致。

```
{
  "API error response": {
    "scope": "typescript,javascript,typescriptreact,javascriptreact",
    "prefix": "apierr",
    "body": [
      "return {",
      " code: \"${1|BAD_REQUEST,UNAUTHORIZED,FORBIDDEN,NOT_FOUND,INTERNAL_ERROR|}\",",
      " message: \"${2:message}\",",
      " requestId: ${3:requestId},",
      "};$0"
    ],
    "description": "Standard API error response"
  }
}
```

## 常用变量

VARIABLES

| 变量 | 展开结果 | 适合场景 |
| --- | --- | --- |
| `$TM_SELECTED_TEXT` | 当前选中文本 | 包 try/catch、包标签、包 Markdown 引用。 |
| `$TM_FILENAME` | 当前文件名,含扩展名 | 日志、注释、测试标题。 |
| `$TM_FILENAME_BASE` | 当前文件名,不含扩展名 | 组件名、类名、测试 suite 名。 |
| `$WORKSPACE_NAME` | 当前工作区名称 | 项目级注释、脚本输出。 |
| `$CLIPBOARD` | 剪贴板内容 | 把刚复制的 URL、变量名、错误信息塞进模板。 |
| `$CURRENT_YEAR` / `$CURRENT_MONTH` / `$CURRENT_DATE` | 当前日期片段 | 文件头、迁移脚本、记录类模板。 |
| `$UUID` | 随机 UUID | 临时 ID、测试数据、demo 数据。 |

变量是 snippet 从「死模板」变成「有上下文的模板」的关键。

## Emmet 不是缩写表,是小语言

EMMET

Emmet 的强大在于它能描述结构关系。你不是背 `div` 的补全,而是在写一个极短的 DOM/CSS 草图。 下面这些模式足够覆盖大多数日常页面。

HTML TREE

### 父子、兄弟、重复

ul.menu\>li.item$\*4\>a[href="#"]{Item $}

生成一个 `ul`,里面 4 个 `li`。`$` 是序号,`{}` 是文本。

CLASS / ID

### 快速写类名与 id

section#profile.panel\>h2.title+p.desc

`#` 表示 id,`.` 表示 class。没有显式标签时,`.card` 默认生成 `<div class="card">`。

GROUP

### 括号分组

main\>(section.hero\>h1+p)+(section.list\>ul\>li\*3)

当结构变复杂,用 `()` 明确分组,避免兄弟节点跑错层级。

CSS

### CSS 属性缩写

df + ai:c + jc:sb + gap16 + p24 + bgc#fff

在 CSS 中输入 `df` 展开为 `display:flex`,`p24` 展开为 `padding:24px`。

## Emmet 速查

CHEATSHEET

| 写法 | 含义 | 例子 |
| --- | --- | --- |
| `>` | 子节点 | `nav>a` → nav 里有 a |
| `+` | 兄弟节点 | `h1+p` → h1 后面跟 p |
| `*` | 重复 | `li*5` → 5 个 li |
| `$` | 编号 | `.item$*3` → item1 / item2 / item3 |
| `{}` | 文本内容 | `button{Save}` |
| `[]` | 属性 | `a[href="/docs"]{Docs}` |
| `()` | 分组 | `(header>nav)+(main>section)` |
| `lorem` | 占位文本 | `p>lorem20` → 20 词段落 |

## 什么时候用谁?

DECISION

USE SNIPPET WHEN

### 模板包含业务语义

比如 API 返回结构、测试命名规则、React Hook 约定、日志格式、错误处理策略。这些不是纯结构,而是你的项目或团队选择。

USE EMMET WHEN

### 模板主要是标签层级

比如一段表单、导航列表、卡片列表、CSS 布局属性。Emmet 临场生成最轻,不需要提前维护模板文件。

USE PROJECT SNIPPET WHEN

### 希望所有人写得一样

只要它涉及代码规范和 review 成本,就放项目里。比如统一 `apierr`、`testcase`、`pagex`。

AVOID

### 不要把一切都 snippet 化

低频模板会增加记忆负担。优秀的 snippet 库应该小而锋利:每天用、团队用、容易出错的东西优先。

## 动手实验

3 LABS

### Lab 1 — 创建第一个 User Snippet

目标:在 TSX 文件中输入 `rfcx`,生成一个带 props 类型的 React 函数组件。

1. 打开命令面板 ⌘⇧P(Win: Ctrl Shift P)
2. 输入并选择 `Snippets: Configure User Snippets`
3. 选择 `typescriptreact.json`
4. 粘贴上面「React function component with props」snippet
5. 新建 `Demo.tsx`,输入 `rfcx`,按 Tab
6. 连续按 Tab 观察光标如何在组件名、props、标签名、正文之间跳转

### Lab 2 — 把团队约定放进项目

目标:创建项目级 snippet,让这个仓库的其他人也能用。

1. 在练习项目中创建目录 `.vscode`
2. 创建文件 `.vscode/team.code-snippets`
3. 粘贴「API error response」snippet
4. 打开任意 `.ts` 文件,输入 `apierr` 并展开
5. 在 choice 位置选择不同错误码,感受枚举模板带来的规范性
6. 把这个文件提交到 Git,这就是团队共享的编辑器能力

### Lab 3 — Emmet 生成一个设置页骨架

目标:不用手敲标签,用一个 abbreviation 生成页面结构。

```
main.settings>(header.page-head>h1{Settings}+p{Manage account preferences})+(section.panel>h2{Profile}+form>label*3>span{Field $}+input[name=field$])
```

1. 新建 `settings.html` 或 `Settings.tsx`
2. 输入上面的 Emmet 缩写
3. 按 Tab 或执行 `Emmet: Expand Abbreviation`
4. 观察 `>`、`+`、`*`、`$`、`{}` 分别生成了什么
5. 改写它:把 3 个字段改成 5 个,把 `input` 改成 `textarea`

REFLECTION

### 实验的重点

不是背三个模板,而是理解模板的三个核心能力:光标顺序、上下文变量、项目共享。只要这三个会了,你就能给任何技术栈造自己的模板。

CHALLENGE

### 附加挑战

找一个你最近三天重复写过 3 次以上的代码结构,把它改成 snippet。要求:至少包含 2 个 tab stop、1 个 placeholder、1 个 description。

## 常见疑问

5 QUESTIONS

### Q1 · 为什么我的 snippet 不出现?明明已经写进 json 了。

ANS

优先排查四件事:(1) 当前文件语言模式是否匹配,看右下角是不是 TypeScript React / JavaScript React；(2) 如果是全局或项目 `.code-snippets`,检查 `scope` 是否包含当前语言；(3) JSON 是否有尾逗号、漏引号、括号不闭合；(4) 补全列表里 snippet 可能排得靠后,把 `editor.snippetSuggestions` 设置成 `top`。不确定时用命令 `Insert Snippet` 看它是否在列表里。

### Q2 · User Snippet、Global Snippet、Workspace Snippet 到底怎么选?

ANS

**语言专属 User Snippet** 用来沉淀个人习惯,比如你自己的 React 组件骨架。 **Global Snippet** 用来跨语言复用,比如通用注释、console、todo。 **Workspace Snippet** 用来固化项目约定,应该提交到 Git。经验规则:只提升你的效率,放 User；能减少团队 review 分歧,放 Workspace。

### Q3 · Snippet 和 Copilot / AI 补全重复了吗?

ANS

不重复。Snippet 是 **确定性模板** :每次展开都一样,适合规范化和肌肉记忆。AI 补全是 **概率性建议** :适合补全上下文相关逻辑。对于 API response、测试骨架、项目目录结构这类不希望漂移的内容,snippet 更可靠。对于业务分支、算法细节、调用组合,AI 更有用。两者最好搭配:snippet 先给稳定骨架,AI 再补局部逻辑。

### Q4 · Emmet 在 JSX / TSX 里不展开怎么办?

ANS

先确认右下角语言模式是 JavaScript React 或 TypeScript React。如果你在普通 `.js` / `.ts` 中写 JSX,需要配置 `emmet.includeLanguages`,把 `javascript` 映射到 `javascriptreact`,把 `typescript` 映射到 `typescriptreact`。如果 Tab 不触发,用命令 `Emmet: Expand Abbreviation` 试一次,可以判断是语法问题还是 Tab 快捷键冲突。

### Q5 · 一个 snippet 应该做得很通用,还是很具体?

ANS

优先具体。太通用的 snippet 会塞满 placeholder,每次展开还要删改很多东西,最后不如手写。好 snippet 的标准是:展开后 80% 以上内容不需要改,只在少数关键位置填写。对于高度变化的代码,用 Emmet、AI 或普通补全更合适。你的 snippet 库应该像常用工具架,不是杂物仓库。

## 复盘问题

5 QUESTIONS

1. Snippet 的 `prefix`、`body`、`description`、`scope` 分别负责什么?
2. `$1`、`${1:default}`、`${1|a,b,c|}`、`$0` 的区别是什么?
3. 什么类型的模板应该放进 `.vscode/*.code-snippets` 并提交到 Git?
4. Emmet 中 `>`、`+`、`*`、`$`、`{}` 分别表示什么?
5. 当 Tab 不展开 snippet 或 Emmet 时,你会按什么顺序排查?

## 今日检查清单

8 ITEMS

- 已把 `editor.snippetSuggestions`、`editor.tabCompletion`、`emmet.triggerExpansionOnTab` 调顺
- 能通过 `Configure User Snippets` 找到语言专属 snippet 文件
- 能写出包含 tab stop、placeholder、choice 的 snippet
- 理解 `$TM_SELECTED_TEXT`、`$TM_FILENAME_BASE`、`$CLIPBOARD` 的用途
- 知道个人 snippet 与项目级 snippet 的边界
- 能在 HTML / JSX 中用 Emmet 生成多层结构
- 能用 Emmet 写出常见 CSS 属性缩写
- 完成 3 个 Lab,并把一个真实重复模板改造成 snippet

## 推荐阅读

3 ITEMS

OFFICIAL

### VSCode User Defined Snippets

官方 snippet 语法说明。重点看 tabstop、placeholder、choice、variables、scope。

OFFICIAL

### VSCode Emmet

官方 Emmet 集成文档。重点看 includeLanguages、triggerExpansionOnTab、Wrap with Abbreviation。

REFERENCE

### Emmet Cheat Sheet

查 HTML 与 CSS 缩写最方便的速查表。练到能自然写出 `ul>li.item$*5` 就够用了。

## Day 08 预告

NEXT

COMING NEXT

### 文件浏览器与多根工作区

Day 04-07 解决的是编辑器内的速度。明天开始进入「工作区与终端」阶段: `.code-workspace` 文件、多根目录、Explorer file nesting、breadcrumbs、工作区信任与项目视图整理。 学完后,VSCode 不只是打开一个文件夹,而是能作为复杂项目的控制台。

"Snippet 是把经验写成模板,Emmet 是把结构写成句子。"

DAY 07 · VSCODE 21-DAY ROADMAP
