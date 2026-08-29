---
title: "JSON 工具盒"
date: '2026-05-21'
draft: false
description: "JSON 格式化、压缩、排序、转义与差异对比的静态说明和速查。"
toc: true
tags:
  - Tool
  - Utility
  - JSON
---

> 原交互工具已转换为静态 Markdown；以下保留功能说明、示例与速查内容。

UTILITY · JSON TOOLBOX

# JSON _工具盒_

一个共享输入的 **工作台** (格式化 / 压缩 / 排序 / 树视图 一体) 加上独立的 **转义** 与 git 风格的 **差异对比** —— 三个 section 解决日常 JSON 全部操作。纯前端、无依赖、数据不离开浏览器。

**OFFLINE** 无网络也可用 **DEPS** 纯 HTML + JS **STRICT** 标准 JSON **SAFE** 数据不离开浏览器

## JSON 工作台

FORMAT · MINIFY · SORT · TREE · STATS

输入 A— B

```
{"name":"Anthropic","models":["opus","sonnet","haiku"],"founded":2021}
```

 【文本】 【树视图】 【统计】 【类图】 【对比 B】 —

—

字节

—

最大深度

—

总键数

—

数组数

—

对象数

—

叶子值

点击 [类图] 标签或加载示例数据,自动按 key 名生成 UML 风类关系图

```
把要对比的 B 版本 JSON 粘贴在这里,然后点工具栏 [▶ 对比 A↔B]
```

【格式化 ⇲】【压缩 ⇱】2 空格 / 4 空格 / Tab【↑ 升序 A→Z】【↓ 降序 Z→A】 递归嵌套 排序数组(仅原始值)【▣ 重渲染树】【全展开】【全折叠】【▶ 对比 A↔B】【↕ 交换 A/B】 折叠相同段 归一化 Key【载入示例】【清空】【复制输出】【⛶ 全屏】

等待输入…

操作即切换:格式化/压缩/排序 → 文本标签;树视图 / 类图 → 对应标签。 **对比 B** :切到 [对比 B] 标签粘贴 B 版本,点 [▶ 对比 A↔B] 即在原编辑框内做高亮差异,再点一次退出。出错时输入框变橙。

## 转义 与 反转义

ESCAPE · UNESCAPE

输入原文 / 已转义字符串

```
原 JSON: {"msg":"hello \"world\""} 或 已转义文本: {\"msg\":\"hello \\\"world\\\"\"}
```

输出—

【转义 →】【反转义 ←】引号包裹:" 双引号 / ' 单引号 / 无,仅转义【清空】【复制输出】【⛶ 全屏】

等待输入…

转义:把 JSON 文本变成可塞进字符串字面量的转义串(`"` → `\"`、换行 → `\\n`)。反转义:把日志或代码里复制的转义串还原。

## 速查

CHEAT SHEET

| 类别 | 规则 | 示例 |
| --- | --- | --- |
| 标准 JSON 类型 | object · array · string · number · true · false · null | {"x": 1, "y": [true, null]} |
| 不支持 | undefined · NaN · Infinity · 注释 · 末尾逗号 · 单引号 · 函数 | 这些是 JS 字面量,非 JSON |
| 字符串转义 | `\" \\ \/ \b \f \n \r \t \uXXXX` | "hello \"world\"\n" |
| 数字 | 不允许前导 +、不允许 .5(必须 0.5)、不允许 1.(必须 1.0) | -3.14e10 |
| 键 | 必须是双引号包裹的字符串 | "k": 1 ✓ &nbsp;&nbsp; k: 1 ✗ |
| JSON Pointer | 路径用 `/` 分隔,数组用下标,空段表根 | /data/users/0/name |
| 大小限制 | JS 数字精度 53 位,大整数会丢精度 | 9007199254740993 → 9007199254740992 |
| 规范 | RFC 8259 (2017) · ECMA-404 | 媒体类型 `application/json` |

"JSON 不是数据结构,是协议;它的全部美德都来自约束 —— 越少越好,越显规则。"

JSON TOOLBOX · OFFLINE · PURE FRONTEND
