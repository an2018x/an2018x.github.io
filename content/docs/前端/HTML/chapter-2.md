---
title: 2-HTML 文本
description: 如何向显示在网页上的文本添加标记
toc: true
authors: []
date: 2022-11-25T22:15:46+08:00
lastmod: 2022-11-25T22:15:46+08:00
draft: false
---

## 1. 结构化标记

1. 结构化标记：可以用来描述标题或段落的元素。

## 2. 标题

HTML 中的标题有六个级别。

1. `<h1>` 主标题
2. `<h2>` 子标题
3. `<h3>` 子子标题
   ...
4. `<h6>` 

通常，浏览器通过字号来标识各种标题，从 `<h1>` 到 `<h6>` 字号依次递减。

```html
<html>
    <head>
        <title>标题测试</title>
    </head>
    </head>
    <body>
        <h1>一号标题</h1>
        <h2>二号标题</h2>
        <h3>三号标题</h3>
        <h4>四号标题</h4>
        <h5>五号标题</h5>
        <h6>六号标题</h6>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126001449.png)

## 3. 段落

1. 在文字两端添加 `<p>` 和 `</p>` 标签即构成了 HTML 中的段落。

2. 默认情况下，显示段落会另起一行，且与后续的段落保持一定的距离。

```html
<html>
    <head>
        <title>段落测试</title>
    </head>
    </head>
    <body>
        <p>这是第一个段落。</p>
        <p>这是第二个段落。</p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126172706.png)

## 4. 粗体和斜体

1. 在 `<b>` 和 `</b>` 标签内的内容，我们会把它显示为粗体。

2. 使用 `<b>` 没有任何特殊语义，只是在视觉上将文字加粗，这一点可以对照后续的 `<strong>` 标签。

3. 在 `<i>` 和 `</i>` 标签内的内容，我们会把它显示为斜体。

4. 使用 `<i>` 同样没有任何特殊语义，只是在视觉上将文字倾斜，这一点可以对照后续的 `<em>` 标签。

```html
<html>
    <head>
        <title>粗体和斜体测试</title>
    </head>
    </head>
    <body>
        <b>这是粗体 </b>
        <i>这是斜体 </i>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126174542.png)

## 5. 上标和下标

1. `<sup>` 元素用来标记作为上标的字符。

2. `<sub>` 元素用来标记作为下标的字符。

```html
<html>
    <head>
        <title>上标和下标测试</title>
    </head>
    </head>
    <body>
        <p>
            E=mc<sup>2</sup>
        </p>
        <p>
            H<sub>2</sub>O
        </p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126174846.png)

## 6. 空白

1. 程序员通常在代码中通过空格、制表符、回车等空白符增加代码可读性。

2. 浏览器会将两个以上连续空格处理为一个空格，这被称为白色空间折叠。

```html
<html>
    <head>
        <title>空白测试</title>
    </head>
    </head>
    <body>
        <p>
            今天天气不错
        </p>
        <p>
            今天天气 不错
        </p>
        <p>
            今天天气      不错
        </p>
        <p>
            今天天气
            不错
        </p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126175152.png)

## 7. 换行符和水平线

1. 浏览器会让 `<p>` 元素自动换行，如果想要手动换行，可以使用 `<br />` 标签。

2. 使用 `<hr />` 会插入一条水平分隔线。

3. 像 `<br /> ` 和 `<hr />` 这样的元素，由于不包含任何内容，所以我们也会把它们称为空元素。

4. 空元素只包含一个标签，通常由 "< + 标签名 + 空格 + / + >" 构成。

```html
<html>
    <head>
        <title>换行符和水平线测试</title>
    </head>
    </head>
    <body>
        <p>
            今天天气<br />不错
        </p>
        <hr />
        <p>
            今天天气晴朗
        </p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126175815.png)

## 8. 语义化标记

1. 语义化标记不影响网页结构，却为所在的页面添加额外信息。

2. 浏览器可能会为这些标记以不同的方式显示，但是不应该把这些元素当作是一种改变外观的方式，它们的目的是更准确地描述网页中的内容。

3. 这些语义化标记可以为屏幕阅读器或搜索引擎服务，这些程序可以读取语义化标记中的额外信息。

## 9. 加粗和强调

1. `<strong>` 元素表明其中的内容十分重要。

2. 默认情况下，`<strong>` 元素中的内容会被显示为粗体。

3. `<em>` 起强调作用。

4. 默认情况下，`<strong>` 元素中的内容会被显示为斜体。

```html
<html>
    <head>
        <title>加粗和强调测试</title>
    </head>
    </head>
    <body>
        <strong>这段文字十分重要</strong> <br />
        <em>需要仔细阅读</em>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126183424.png)

## 10. 引用

1. `<blockquote>` 元素用来标记那些会占用一整段的较长的引用。

2. 浏览器会对 `<blockquote>` 中的内容进行缩进，但是我们不应该只是为了缩进效果而使用该元素。

3. `<q>` 元素用来标记位于段落中的较短引用。

4. 浏览器会对 `<blockquote>` 中的内容两侧添加引号。

```html
<html>
    <head>
        <title>引用测试</title>
    </head>
    </head>
    <body>
        <blockquote>学而时习之，不亦乐乎</blockquote>
        <p>上面这段话出自<q>论语</q></p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126183849.png)

## 11. 缩写词和首字母缩写词

1. `<abbr>` 可以用来描述缩写词，其中 `title` 属性可以提供关于指定缩写词的完整定义。

```html
<html>
    <head>
        <title>缩写词测试</title>
    </head>
    </head>
    <body>
        <p>A 商品今年的 <abbr title="商品交易总额">GMV</abbr> 同比增长 150%。</p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126191312.png)

## 12. 引文和定义

1. 可以使用 `<cite>` 元素表明引用的来源。

2. 浏览器会将 `<cite>` 元素内容显示为斜体。

3. `<dfn>` 用来给出一个新术语的定义。

4. `<dfn>` 元素也会被显示为斜体。

```html
<html>
    <head>
        <title>引文和定义测试</title>
    </head>
    </head>
    <body>
        <p><cite>《算法导论》</cite>是一本描述计算机算法与数据结构的经典书籍。</p>
        <p><dfn>Dijkstra</dfn>算法是书中描述的一种经典的最短路算法。</p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126191800.png)

## 13. 小结

1. HTML 元素用来描述页面的结构（例如标题、子标题和段落）

2. HTML 元素还提供语义信息（例如在什么位置强调，所使用的缩略语定义、给定的文本何时是个引用）。
