---
title: 6-HTML 表格

description: 介绍 HTML 中如何创建和利用表格呈现信息

toc: true

authors: []

date: 2022-11-26T22:16:46+08:00

lastmod: 2022-11-26T22:16:46+08:00

draft: false

---

## 1. 表格概述

1. 表格通过在两个轴线上引用信息来呈现数据，通常通过网格形式表示数据。

2. 网格中每个块称为单元格。

## 2. 基本的表格结构

1. 通过 `<table>` 元素来创建表格，通常逐行填写表格内容。

2. 通过 `<tr>` 元素来表示表格中的每一行。

3. 通过 `<tr>` 元素中嵌套 `<td>` 元素表示表格中每个单元格。

```html
<html>
    <head>
        <title>基本的表格结构测试</title>
    </head>
    </head>
    <body>
        <table>
            <tr>
                <td>苹果</td>
                <td>香蕉</td>
            </tr>
            <tr>
                <td>菠萝</td>
                <td>甘蔗</td>
            </tr>
        </table>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127000453.png)

## 3. 表格标题

1. `<th>` 和 `<td>` 元素用法一样，但是是用来表示行或列的标题。

2. 即使单元格没有任何内容，仍然需要一个 `<th>` 或 `<td>` 元素。

3. 可以使用 `scope` 属性来指定该 `<th>` 元素是行标题还是列标题。

4. `row` 表明是行标题，`col` 表明是列标题。

```html
<html>
    <head>
        <title>表格标题测试</title>
    </head>
    </head>
    <body>
        <table>
            <tr>
                <th></th>
                <th>周一</th>
                <th>周二</th>
            </tr>
            <tr>
                <th>上午</th>
                <td>苹果</td>
                <td>香蕉</td>
            </tr>
            <tr>
                <th>下午</th>
                <td>菠萝</td>
                <td>甘蔗</td>
            </tr>
        </table>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127001123.png)

## 4. 跨列

1. 可以在 `<th>` 或 `<td>` 元素中使用 `colspan` 属性表示单元格要跨的列数。

```html
<html>
    <head>
        <title>表格跨列测试</title>
    </head>
    </head>
    <body>
        <table>
            <tr>
                <th></th>
                <th>周一</th>
                <th>周二</th>
            </tr>
            <tr>
                <th>上午</th>
                <td>苹果</td>
                <td colspan="2">香蕉</td>
            </tr>
            <tr>
                <th>下午</th>
                <td>菠萝</td>
            </tr>
        </table>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127001431.png)

## 5. 跨行

1. 可以在 `<th>` 或 `<td>` 元素中使用 `rowspan` 属性表示单元格要跨的行数。

```html
<html>
    <head>
        <title>表格跨行测试</title>
    </head>
    </head>
    <body>
        <table>
            <tr>
                <th></th>
                <th>周一</th>
                <th>周二</th>
            </tr>
            <tr>
                <th rowspan="2">上午</th>
                <td>苹果</td>
                <td colspan="2">香蕉</td>
            </tr>
            <tr>
                <td>菠萝</td>
            </tr>
        </table>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127001614.png)

## 6. 长表格

1. 使用 `<thead>` 元素放置表格的标题。

2. 使用 `<tbody>` 元素放置表格的主题内容

3. 使用 `<tfoot>` 元素放置表格的脚注。

4. 上面三种元素将表格根据表格内容的语义将表格进一步划分。

5. 将 `<thead>` 和 `<tfoot>` 独立出来的另一个原因是如果表格内容超出屏幕，那么会在表格滚动时始终保持标题和脚注可见，但是浏览器默认没有启用这个功能。

```html
<html>
    <head>
        <title>长表格测试</title>
    </head>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    <th>日期</th>
                    <th>收入</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>2022-11-11</td>
                    <td>20,000</td>
                </tr>
                <tr>
                    <td>2022-11-12</td>
                    <td>30,000</td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td></td>
                    <td>50,000</td>
                </tr>
            </tfoot>
        </table>
    </body>
</html>
```

## 7. 总结

1. `<table>` 元素用来向页面中添加表格。

2. 表格通常逐行绘制，每行通过 `<tr>` 元素创建。

3. 每行中都有一定数量的 `<td>` 元素，表示表格的单元格。

4. `<th>` 元素用来表示表格的标题。

5. 可以使用 `colspan` 或 `rowspan` 来使表格跨列或跨行。

6. 对于长表格，可以将表格划分为 `<thead>` 、`<tbody>` 和 `<tfoot>` 三个部分。
