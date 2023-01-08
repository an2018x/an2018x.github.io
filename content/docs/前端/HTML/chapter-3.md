---
title: 3-HTML 列表
description: 介绍 HTML 中有序和无序列表
toc: true
authors: []
date: 2022-11-26T19:15:46+08:00
lastmod: 2022-11-26T19:15:46+08:00
draft: false

---

## 1. 有序列表

有序列表是指为其中的每一个项目编号的列表。

1. 使用 `<ol>` 元素来构建有序列表。

2. 列表中的每一个项目都被放在 `<li></li>` 标签中。

3. 浏览器默认对列表进行缩进。

```html
<html>
    <head>
        <title>有序列表测试</title>
    </head>
    </head>
    <body>
        <ol>
            <li>第一条</li>
            <li>第二条</li>
            <li>第三条</li>
        </ol>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126193219.png)

## 2. 无序列表

无序列表指的是用不表明顺序的点状项目符号作为开头的列表。

1. 使用 `<ul>` 元素来构建无序列表。

2. 列表中的每一个项目都被放在 `<li></li>` 标签中。

```html
<html>
    <head>
        <title>无序列表测试</title>
    </head>
    </head>
    <body>
        <ul>
            <li>第一条</li>
            <li>第二条</li>
            <li>第三条</li>
        </ul>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126193357.png)

## 3. 定义列表

定义列表是一系列术语以及定义组成的列表。

1. 使用 `<dl>` 元素来构建定义列表。

2. `<dt>` 元素用来包含被定义的术语。

3. `<dd>` 元素用来包含定义。

```html
<html>
    <head>
        <title>定义列表测试</title>
    </head>
    </head>
    <body>
        <dl>
            <dt>GDP</dt>
            <dd>国民生产总值</dd>
            <dt>恩格尔系数</dt>
            <dd>食品支出总额占个人消费支出总额的比重</dd>
        </dl>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126215959.png)

## 4. 嵌套列表

1. 可以在 `<li>` 元素中放入另外一个列表来创建子列表。

2. 嵌套列表的缩进层级会更深，同时列表符号的样式也会改变

```html
<html>
    <head>
        <title>嵌套测试</title>
    </head>
    </head>
    <body>
        <ul>
            <li>第1节</li>
            <li>第2节
                <ul>
                    <li>第2.1节</li>
                </ul>
            </li>
        </ul>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126220309.png)

## 5. 小结

1. HTML 中有三种列表：有序列表、无序列表和定义列表。

2. 有序列表使用数字编号。

3. 无序列表使用项目符号。

4. 定义列表用来定义专业术语。

5. 列表可以嵌套在其他列表中。