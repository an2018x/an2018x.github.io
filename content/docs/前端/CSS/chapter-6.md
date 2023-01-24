---
title: 6-定位
description: 描述CSS中如何定位元素
toc: true
authors: []
date: 2023-01-20T19:16:46+08:00
lastmod: 2023-01-20T19:16:46+08:00
draft: false
---

## 1. 核心概念

### 1.1. 构建块

1. CSS 采用盒子模型来处理每个 HTML 元素，盒子可以是一个块级盒子，也可以是一个内联盒子。
2. 块级盒子另起一行显示，并且在布局中就像是主体构建块。
3. 内联盒子在其周围的文本间浮动。
4. 可以通过设置每个盒子的宽度来控制其占用的空间。
5. 可以使用边框、外边距、内边距来将盒子分开。

### 1.2. 包含元素

1. 如果一个块级元素位于另一个块级元素内部，那么这个外部的框就被称为包含元素或父级元素。
2. 人们通常将若干个元素集中在一个 `<div>` 元素中。
3. 一个盒子可能被嵌套在其他多个块级元素中，但包含元素只能是它的直接父元素。

## 2. 控制元素的位置

1. CSS 中包含三种用于控制页面布局的定位机制：普通流、相对定位和绝对定位。
2. 在 CSS 中通过 `position` 属性表明定位机制，还可以使用 `float` 属性让元素浮动。
2. 普通流：每个块级元素都换行显示，以至于页面中的每个项目都显示在前一个项目的下方，即使有足够的空间能够让两个元素并排显示。
3. 相对定位：相对定位将一个元素从它在普通流中所处的位置上移动，在它原来的位置向上、向下、像左、向右移动，但是不会影响周围元素的位置。
4. 绝对定位：元素位置相对于它的包含元素。它完全脱离了普通流，不会影响周围任何元素的位置，使用绝对定位的元素随着页面的滚动而移动。
5. 为了确定一个盒子的位置，可能还要使用盒子位移属性将盒子与上、下、左、右的距离告诉浏览器。
6. 此外还有固定定位和浮动元素两种定位方式。
7. 固定定位：固定定位是绝对定位的一种形式，但是它是将元素相对于浏览器窗口进行定位，而不是相对于包含元素进行定位。固定定位的元素同样不会影响周围元素的位置。
8. 浮动元素：浮动一个元素可以让其脱离普通流，并定位到其包含盒子的最左边或最右边的位置。这个浮动的元素会成为一个周围可以浮动其他内容的块级元素。
10. 任何元素从普通流脱离时，盒子都会产生重叠。可以使用 `z-index` 属性来控制哪个盒子显示在上层。

## 3. 普通流

1. 使用 `position:static` 可以指定普通流，不过这是默认设置，可以不用显示指定。
2. 使用普通流的块级元素都会换行显示。

## 4. 相对定位

1. 使用 `position:relative` 可以指定该元素进行相对定位。
2. 相对定位的元素以其在普通流中所处的位置为起点进行移动。
3. 可以使用 `top`、`bottom`、`left`、`right` 属性进行移动。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>相对定位</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <p>段落1</p>
        <p class="test">段落2（相对流）</p>
        <p>段落3</p>
    </body>
</html>
```

```css
body {
    width: 500px;
}
p.test {
    position: relative;
    left: 300px;
    bottom: 20px;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120210437.png)

## 5. 绝对定位

1. 如果将一个盒子的 position 属性设置为 absolute，那么他就会脱离普通流，不再影响页面中其他元素的位置（如同它不在那个位置一样）。
2. 盒子的位移属性用于指定元素相对于它的包含元素应该显示在什么位置。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>绝对定位</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
            <p class="one">段落1</p>
            <p>段落2</p>
        </div>
    </body>
</html>
```

```css
div {
    padding: 0px;
    background-color: burlywood;
}
p {
    margin: 0px;
}
p.one {
    position: absolute;
    left: 50px;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120232111.png)

## 6. 固定定位

1. 固定定位是指元素相对于浏览器窗口进行定位。因此，当用户滚动页面时，这类元素的位置保持不变。
2. 将 position 属性设置为 fixed 就表示固定定位。

## 7. 重叠元素

1. 当使用相对定位或者绝对定位时，盒子是可以重叠的。
2. 如果盒子出现重叠，那么默认后出现的元素将位于先出现的元素上方。
3. 如果要控制元素的层次，那么可以使用 z-index 属性，该属性的值是一个数字，数字越大，元素的层次就越靠前。
4. z-index 也别称为堆叠上下文。

## 8. 浮动元素

1. float 元素允许你将普通流中的元素在它的包含元素内尽可能地向左或向右排列。
2. 位于包含元素中的其他内容会在浮动元素的周围流动。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>浮动元素</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div class="one">
            盒子1
        </div>
        <div>
            盒子2
        </div>
    </body>
</html>
```


```css
div {
    margin: 20px;
    width: 200px;
    height: 200px;
    padding: 0px;
    background-color: burlywood;
}
div.one {
    float: right;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120233034.png)

## 9. 清除浮动

1. `clear` 属性用来表明一个盒子的左侧或者右侧不允许浮动元素（在同一个包含元素内）。
2. `left` 值表示盒子左侧不能接触同一个包含元素内的其他任何元素。
3. `right` 值表示盒子右侧不能接触同一个包含元素内的其他任何元素。
4. `both` 值表示盒子两侧都不能接触同一个包含元素内的其他任何元素。
5. `none` 值表示盒子两侧都可以接触同一个包含元素内的其他任何元素。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>清除浮动</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div class="one">
            盒子1
        </div>
        <p>
            这是一个段落，用来说明元素的浮动。
        </p>
    </body>
</html>
```

```css
div {
    width: 200px;
    height: 200px;
    background-color: antiquewhite;
}
div.one {
    float: left;
}
p {
    clear: left;
    height: 200px;
    width: 400px;
    background-color: aqua;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/24/20230124145552.png)

## 10. 浮动元素的父级

1. 如果一个包含元素中只包含了一个浮动元素，有些浏览器就会将它的高度看为 0 像素。
2. 可以在包含元素中最后一个浮动盒子后面插入一个额外的元素，并为其编写 CSS 规则 `clear: both` 来解决这个问题，但不够优雅。
3. 也可以在包含元素中指定 CSS 规则：`overflow: auto` 和 `width: 100%`。

## 11. 多个样式表

1. 在 HTML 中使用多个 link 标签可以链接到多个样式表。
2. 可以在 CSS 文件的规则最前面使用 `@import url(...)` 规则导入多个样式表。

## 12. 小结

1. `<div>` 元素常作为包含元素，以便将页面中某些部分组合在一起。
2. 除非指定了相对定位、绝对定位或者是固定定位，否则浏览器就会按照普通流显示页面。
3. `float` 属性将内容移到页面的左侧或者右侧，还可以用于创建多列式布局。
4. 可以在一个页面中引入多个 CSS 文件。


