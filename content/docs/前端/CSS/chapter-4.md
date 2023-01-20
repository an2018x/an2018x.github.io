---
title: 4-CSS 盒子
description: 描述CSS中的盒子模型
toc: true
authors: []
date: 2023-01-19T22:16:46+08:00
lastmod: 2023-01-19T22:16:46+08:00
draft: false
---

## 1. 导言

可以通过 CSS 来设置盒子的外观，包括：

* 控制盒子的大小
* 创建盒子周围的边框
* 设置盒子的外边距和内边距
* 显示和隐藏盒子

## 2. 盒子的大小

1. 默认情况下，一个盒子的大小刚好容纳其中的内容。如果需要自定义盒子的大小，就需要用到 `width` 和 `height` 属性。
2. 指定盒子大小的常用方式有像素、百分数或者 em 值。
3. 使用百分数时，盒子的大小与浏览器窗口的大小相关，如果这个盒子被装入另外一个盒子，那么百分数的大小就是相对外部盒子而言。
4. 使用 em 时，盒子的大小将以盒子中文本的大小相关。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>盒子的大小</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
            外部的盒子
            <p>内部的盒子</p>
        </div>
    </body>
</html>
```

```css
div {
    height: 300px;
    width: 60%;
    background-color: cadetblue;
}
p {
    height: 4em;
    width: 80%;
    background-color: darkorange;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119191517.png)


## 3. 宽度限制

1. 为了适应用户屏幕大小，有些设计会适时展开或收缩页面。
2. `min-width` 属性指定一个盒子在浏览器窗口较窄时可以显示的最小宽度，`max-width` 属性指定一个盒子在浏览器较宽时能伸展的最大宽度。
3. 宽度限制可以保证内容在所设备上清晰可读。利用 `max-width` 属性可以保证文本行在较大的浏览器窗口中不至于太宽，利用 `min-width` 可以保证不会太窄。

## 4. 高度限制

1. 可以利用 `min-height` 和 `max-height` 属性来对某个盒子进行高度限制。

## 5. 内容溢出

1. `overflow` 属性告诉浏览器当盒子的内容超过盒子本身时如何显示，有两个属性值可选。
2. `hidden` 直接把溢出盒子空间的内容进行隐藏。
3. `scroll` 会在盒子上添加一个滚动条。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>内容溢出</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
            这个例子用来说明内容溢出。
            这个例子用来说明内容溢出。
            这个例子用来说明内容溢出。
            这个例子用来说明内容溢出。
            这个例子用来说明内容溢出。
            这个例子用来说明内容溢出。
            这个例子用来说明内容溢出。
        </div>
    </body>
</html>
```

```css
div {
    max-height: 100px;
    width: 60%;
    background-color: cadetblue;
    overflow: scroll;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119193401.png)


## 5. 边框、外边距和内边距

1. 有三种属性(边框、外边距和内边距)可以应用在所有盒子上，可以通过调节这些属性来控制盒子的外观。
2. 边框(border)：每个盒子都有边框，即使这些边框不可见或者宽度被设置为 0 像素。边框将一个盒子的边缘与另一个盒子隔开。
3. 外边距(margin)：外边距位于边框的边缘之外。可以通过设置外边距的宽度在两个相邻盒子的边框之间创建空隙。
4. 内边距(padding)：内边距是指盒子边框与盒子所包含内容之间的空隙。增加内边距可以提高内容的可读性。
5. 如果为一个盒子指定了宽度和高度，那么盒子的边框、外边距内边距会增加到它的宽高上。


## 6. 空白区和垂直外边距

1. 设计人员将页面上项目之间的空隙称为空白区。
2. 如果一个盒子下方的外边距与另一个盒子上方的外边距相接，那么浏览器只会显示这两者中较大的一个。

## 7. 边框宽度

1. 使用 `border-width` 属性来控制边框宽度。
2. 该属性可以是像素值，也可以是(thin、medium、thick)三个值之一。
3. 该属性值不可以使用百分数。
4. 可以使用以下四个属性分别对各个边框大小进行控制：
    * border-top-width
    * border-right-width
    * border-bottom-width
    * border-left-width
5. 还可以使用如下方式来为四个边框指定不同的宽度：

```css
border-width: 2px 1px 1px 2px;
```

上面属性的展示顺序为：上、右、下、左。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>边框宽度</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
        </div>
    </body>
</html>
```

```css
div {
    height: 100px;
    width: 100px;
    border-width: 1px 5px 2px 5px;
    border-style: solid;
    background-color: salmon;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119201817.png)

## 8. 边框宽度

1. 可以使用 `border-style` 属性来控制边框的样式，可以选用如下值：
    * `solid` 一条实线
    * `dotted` 一串方形点
    * `dashed` 一条虚线
    * `double` 两条实线
    * `groove` 雕入页面
    * `ridge` 显示为在页面上凸起的效果
    * `inset` 显示为嵌入页面的效果
    * `outset` 看向来像要凸出屏幕
    * `hidden/none` 不显示任何边框
2. 可以利用下面的属性对各个边框的样式单独进行设置：
    * `border-top-style`
    * `border-left-style`
    * `border-right-style`
    * `border-bottom-style`

## 9. 边框颜色

1. 可以使用 `border-color` 属性来指定边框的颜色。

## 10. 快捷方式

1. border 属性允许在一个属性中同时指定边框的宽度、样式和颜色，不过要按照（边框->宽度->颜色）的顺序编写。

## 11. 内边距

1. `padding` 属性用来指定元素的内容与元素边框之间保持多大的空隙。
2. 如果已经为盒子指定了宽度，那么内边距会增加到这个盒子的宽度上。
3. 内边距和边框一样可以指定 `padding-top`，以及使用简便写法。
4. padding 属性不会被子元素继承。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>内边距</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
            <p>
                测试
            </p>
        </div>
    </body>
</html>
```

```css
div {
    height: 100px;
    width: 100px;
    padding: 0 20px 0px 20px;
    background-color: salmon;
}
p {
    background-color: green;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119211452.png)

## 12. 外边距

1. `margin` 属性用来控制盒子之间的空隙。
2. 如果一个盒子位于另一个盒子上方，就会出现外边距折叠现象，也就是说相连的这两个外边距中，较大的一个会生效，较小的一个则会被浏览器忽略。
3. 如果一个盒子已经指定了宽度，那么外边距就会增加到这个盒子的宽度上。
4. 外边距和边框一样可以指定 `padding-top`，以及使用简便写法。
5. margin 属性不会被子元素继承。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>外边距</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div id="no1">
            1号盒子
        </div>
        <div id="no2">
            2号盒子
        </div>
    </body>
</html>
```

```css
#no1 {
    width: 100px;
    height: 100px;
    border: 1px solid red;
    background-color: teal;
    margin: 10px;
}
#no2 {
    width: 100px;
    height: 100px;
    border: 1px solid red;
    background-color: teal;
    margin: 10px;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119212156.png)


## 13. 内容居中

1. 如果想要一个盒子在页面上居中显示或者在某个元素内居中显示，可以将 `margin-left` 和 `margin-right` 的值设置为 auto。
2. 为了让盒子在页面上居中，还需要为盒子设置一个宽度，否则元素会占满整个屏幕。
3. 其原理是一旦设置了 `margin-left` 和 `margin-right` 的值为 auto，浏览器就会在盒子的两侧显示相同的空隙。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>内容居中</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div id="no1">
            1号盒子
        </div>
        <div id="no2">
            2号盒子
        </div>
    </body>
</html>
```

```css
#no1 {
    width: 100px;
    height: 100px;
    border: 1px solid red;
    background-color: teal;
    margin: 10px;
    margin-left: auto;
    margin-right: auto;
}
#no2 {
    width: 100px;
    height: 100px;
    border: 1px solid red;
    background-color: teal;
    margin: 10px;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119213741.png)


## 14. 内联元素与块级元素的转换

1. `display` 属性允许你将一个内联元素转换为块级元素，反之亦然；同时也支持从页面上隐藏元素。
2. `inline` 值可以使一个块级元素转换为内联元素。
3. `block` 值可以使一个内联元素转换为块级元素。
4. `inline-block` 值可以使一个块级元素像一个内联元素一样浮动并保持其他块级元素特征。
5. `none` 值可以将一个元素从页面上隐藏，就像元素不存在一样。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>内联元素与块级元素的转换</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <ul>
            <li>首页</li>
            <li class="invisible">
                更多
            </li>
            <li>归档</li>
            <li>博文</li>
        </ul>
    </body>
</html>
```

```css
li {
    display: inline;
    margin: 10px;
}
li.invisible {
    display: none;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119214259.png)

## 15. 盒子的隐藏

1. `visibility` 属性允许从用户的视线中隐藏盒子，但它保留了元素原来占用的空间。
2. `hidden` 值用来隐藏元素，原来元素的位置会显示为空白。
3. `visible` 值用来显示元素。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>盒子的隐藏</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <ul>
            <li>首页</li>
            <li>归档</li>
            <li class="invisible">
                更多
            </li>
            <li>博文</li>
        </ul>
    </body>
</html>
```

```css
li {
    display: inline;
    margin: 10px;
}
li.invisible {
    visibility: hidden;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/19/20230119214703.png)

## 16. CSS3：边框图像

1. `border-image` 将图像应用到盒子的边框上。它采用一张背景图片，并将图片分割成9块。
2. 从图片切割出来的各自将被放在盒子相应的位置上，而对于盒子的边来说，需要选择它的背景是伸展显示还是重复显示。
3. 该属性包含三种值：
 a. 图片的 URL
 b. 切割图片的位置
 c. 如何处理直边：
     * stretch 伸展图片 
     * repeat 重复图片 
     * round 类似 repeat，但是如果重复图片遇到边界时不合适，round 值会自动根据边框的大小动态调整图片的大小直到正好可以铺满整个边框。
4. 一般我们会遇到类似：`-moz-border-image` 或者 `-webkit-border-image` 属性，这些属性是为了帮助 Chrome/Firefox 的早期版本正确显示。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>边框图像</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <p>
            内容
        </p>
    </body>
</html>
```

```css
p {
    width: 300px;
    border: 30px solid transparent;
    border-image: url("border.png") 5 5 5 5 round;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120184455.png)

## 17. CSS3：盒子的投影

1. `box-shadow` 属性可以在盒子的周围增加投影，该属性与 `text-shadow` 属性类型。
2. 使用该属性时，至少需要包含下面项目中的前两项以及一个颜色值：
    * 水平偏移：负值表示将阴影置于盒子的左侧。
    * 垂直偏移：负值表示将阴影置于盒子的下方。
    * 模糊距离：如果省略该值，阴影会显示为实边，和边框一样。
    * 阴影扩展：如果使用该值，正值会使阴影向四周扩展，负值会让阴影收缩。
3. 可以在以上值前面使用 inset 关键字来创建内部阴影。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>盒子投影</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
        <div>
    </body>
</html>
```

```css
div {
    border: 1px solid seagreen;
    height: 300px;
    width: 300px;
    box-shadow: 5px 5px 3px #faa;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120185355.png)


## 18. CSS3: 圆角

1. 可以使用 `border-radius` 属性来给盒子创建圆角。
2. 该属性的值表示圆角的半径。
3. 可以使用 `border-top-right-radius`、`border-top-bottom-radius`、`border-left-bottom-radius`、`border-left-top-radius`来分别指定四个角的圆角。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>圆角</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
        <div>
    </body>
</html>
```

```css
div {
    border: 1px solid seagreen;
    height: 300px;
    width: 300px;
    border-radius: 10px;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120185743.png)

## 19. CSS3: 椭圆形

1. 可以给圆角的横向和纵向值指定不同的距离来创建椭圆形圆角。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>圆角</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div>
        <div>
    </body>
</html>
```

```css
div {
    border: 1px solid seagreen;
    height: 300px;
    width: 300px;
    border-top-left-radius: 80px 30px;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/20/20230120190325.png)

## 20. 小结

1. CSS 采用盒子模型来处理每个 HTML 元素。
2. 可以使用 CSS 来控制盒子的大小。
3. 可以使用 CSS 来控制盒子的边框、外边距和内边距。
4. 可以通过 display 和 visibility 属性来隐藏元素。
5. 块级盒子可以转换为内联盒子，内联盒子也可以转换成块级盒子。
6. 通过控制包含文本的盒子宽度以及行距可以提高文本的可读性。
7. CSS3 引入了创建图像边框和圆角边框的功能。  