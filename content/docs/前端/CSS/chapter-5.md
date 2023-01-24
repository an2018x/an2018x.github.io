---
title: 5-列表、表格和表单
description: 描述CSS中如何控制列表、表格和表单的样式
toc: true
authors: []
date: 2023-01-20T19:16:46+08:00
lastmod: 2023-01-20T19:16:46+08:00
draft: false
---

## 1. 项目符号样式

1. `list-style-type` 属性允许你控制项目符号的形状或样式。
2. 该属性可以应用到 `<ol>`、`<ul>` 和 `<li>` 元素的规则中。
3. 对于无序列表的 `list-style-type` 属性，可以使用如下值：
    * none
    * disc
    * circle
    * square
4. 对于有序列表的 `list-style-type` 属性，可以使用如下值：
    * decimal
    * decimal-leading-zero
    * lower-alpha
    * upper-alpha
    * lower-roman
    * upper-roman

```html
<!DOCTYPE html>
<html>
    <head>
        <title>项目符号样式</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <ul>
            <li>项目1</li>
            <li>项目2</li>
        </ul>
    </body>
</html>
```

```css
ul {
    list-style-type: circle;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120191312.png)

## 2. 项目图像

1. 可以利用 `list-style-image` 属性将一个图像作为项目符号使用。
2. 该属性的值以字母 url 开头，后面跟着一对圆括号。
3. 该属性可以应用到 `<ul>` 和 `<li>` 元素中。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>项目图像</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <ul>
            <li>项目1</li>
            <li>项目2</li>
        </ul>
    </body>
</html>
```

```css
ul {
    list-style-image: url("add.png");
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120191601.png)

## 3. 标记的定位

1. 默认情况下，列表会缩进到页面中。
2. `list-style-position` 属性用来表明标记显示的位置，是包含主体内容的盒子的内部，还是在其外部。
3. 该属性可以选用如下两个值：
    * `outside`：表明标记位于文本块的左侧（默认）。
    * `inside` 表明标记位于文本块的内部，同时文本块会被缩进。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>标记的定位</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <ul class="one">
            <li>项目1项目1项目1项目1项目1项目1项目1项目1项目1项目1项目1项目1项目1项目1</li>
            <li>项目2项目2项目2项目2项目2项目2项目2项目2项目2项目2项目2项目2项目2项目2</li>
        </ul>
        <ul class="two">
            <li>类型1类型1类型1类型1类型1类型1类型1类型1类型1类型1类型1类型1类型1类型1</li>
            <li>类型2类型2类型2类型2类型2类型2类型2类型2类型2类型2类型2类型2类型2类型2</li>
        </ul>
    </body>
</html>
```

```css
ul.one {
    list-style-position: outside;
}
ul.two {
    list-style-position: inside;
}
```


![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120192321.png)

## 4. 列表快捷方式

1. 可以使用 `list-style` 一次定义多个列表属性。

```css
list-style: inside circle;
```

## 5. 表格属性

1. `width` 用来指定表格的宽度。
2. `padding` 用来设置每个单元格边框与内容之间的空隙。
3. `text-transform` 用来将表格标题中的内容转换为大写。
4. `letter-spacing`、`font-size` 用来为表格标题的内容增加额外的样式。
5. `border-top`、`border-bottom` 用于设置表格标题上方和下方的边框。
6. `text-align` 用来将某些单元格中的书写方式设置为向左或向右对齐。
7. `background-color` 用来改变表格行的背景颜色。
8. `:hover` 在用户把光标悬停在某个表格行时将此行高亮显示。

## 6. 空单元格的边框

1. 可以使用 `empty-cells` 属性来指定是否显示空单元格的边框。
2. `slow` 值用于显示空单元格的边框。
3. `hide` 值用于隐藏空单元格的边框。
4. `inherit` 值表示单元格遵循外部表格的规则。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>空单元格边框</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <table>
            <tr>
                <td>单元格1</td>
                <td></td>
            </tr>
        </table>
    </body>
</html>
```

```css
td {
    border: 1px solid;
    empty-cells: hide;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120194635.png)

## 7. 单元格之间的空隙

1. `border-spacing` 属性允许你控制相邻单元格之间的距离，默认情况下，浏览器会在每个单元格之间留有一个小的空隙。
2. `border-collapse` 属性用来合并相邻的边框，它的值有：
    * `collapse` 值表示尽可能将单元格相邻的边框合并为一个单独的边框，此时 `border-spacing` 属性不会生效。
    * `separate` 表示将相邻的边框分离。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>单元格之间的空隙</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <table>
            <tr>
                <td>单元格1</td>
                <td>单元格2</td>
            </tr>
        </table>
    </body>
</html>
```

```css
table {
    border-spacing: 10px;    
}
td {
    border: 1px solid;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120195821.png)

## 8. 定义表单样式

1. CSS 对表单样式的处理主要体现下定义下列控件的样式。
    * 文本输入框和文本域
    * 提交按钮
    * 表单中的标签，可以精确地对表单控件进行对齐。

## 9. 定义单行文本框样式

1. `font-size` 用于设置用户输入文本的大小。
2. `color` 用于设置文本颜色，`background-color` 用于设置文本输入框的背景色。
3. `border` 用于在文本输入框的边缘增加边框，`border-radius` 可以创建圆角。
4. `background-image` 为文本框增加背景图像。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>定义单行文本框样式</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <form>
            <input type="text" />
        </form>
    </body>
</html>
```

```css
input {
    font-size: 120%;
    border-radius: 5px;
    padding: 5px 5px 5px 30px;
    background-color: #f2f2f2;
    background-repeat: no-repeat;
    background-position: 8px 8px;
    background-image: url("add.png");
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120201023.png)

## 10. 光标样式

1. `cursor` 属性用于控制显示给用户的光标的类型。
2. 通常有下列值：
    * auto
    * crosshair
    * default
    * pointer
    * move
    * text
    * wait
    * help
    * url("xxxx.png")

## 11. 小结

1. 可以使用 `list-style-type` 属性和 `list-style` 图像属性为列表标记定义不同的外观。
2. 表格中的单元格在不同的浏览器中可以有不同的边框和间距，可以利用一些属性来控制它们。
               