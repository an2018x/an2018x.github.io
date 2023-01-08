---
title: 2-CSS 文本
description: 描述CSS中如何控制文本外观
toc: true
authors: []
date: 2022-12-02T22:16:46+08:00
lastmod: 2022-11-02T22:16:46+08:00
draft: false
---

## 1. 控制文本外观的属性

可以将用来控制文本外观的属性分为两类：

1. 直接作用于字体以及外观的属性（包括字型和文本的大小）
2. 无论使用何种字体都会对文本产生相同效果的属性（包括文本的颜色以及单词间距和字母间距）

## 2. 字体术语

### 2.1 衬线字体（SERIF）

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202233021.png)

衬线字体在字母主要笔画的末端会有一些额外的装饰，这些装饰被称为衬线。

在打印时，考虑到衬线字体容易阅读，所以通常将其应用为长篇文本。

### 2.2. 无衬线字体（SANS-SERIF）

无衬线字体中的字母有更笔直的线条，因此更加简洁。

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202233237.png)

屏幕分辨率要低于打印分辨率，因此如果文本非常小，无衬线字体阅读起来会更清晰。

### 2.3. 等宽字体（MONOSPACE）

等宽字体中的每个字母的宽度都相同，而非等宽字体中字母的宽度不同。

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202233447.png)

由于等宽字体可以精确地对齐，便于文本的跟随，因此通常用于显示代码。

### 2.4. 字体粗细

字体粗细不仅能起到强调作用，还可以影响空白区域的大小以及页面上的对比情况。

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202234015.png)


### 2.5. 字体样式

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202234438.png)

有些字体的斜体(Italic)呈现出连笔风格，倾斜字体(Oblique)的样式是将普通样式进行一定角度的倾斜。

### 2.6. 伸缩

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202234618.png)

在压缩（或缩窄）版本的字体中，字母会更窄，间距也会更小。在伸展版本的字体中，字母会更宽，间距也更大。

## 3. 字体选用

* 衬线字体(SERIF)：在字母主要笔画的末端有一些额外的装饰。例如：Georgia、Times、Times New Roman。
* 无衬线字体(SANS-SERIF)：字母拥有笔直的线条，设计更加简洁。例如：Arial、Verdana、Helvetica。
* 等宽字体(MONOSPACE)：每个字母的宽度都相同。例如：Courier、Courier New。
* 草书字体(CURSIVE)：加入了笔划或其他草书的风格，比如手写风格。例如：Comic Sans MS、Monotype Corsiva。
* 虚幻字体(FANTACY)：通常作为装饰性字体使用，经常用于标题。例如：Impact、Haettenscheweiler。

1. 我们可以一次指定多种字体并为其创建一个优先次序，这被称为字体堆栈。
2. 浏览器至少要支持上述每种字体中的一种，因此，需要在指定的字体最后加上这些通用字体名。

例如：如果想要使用衬线字体：

```css
font-family: Georgia, Times, serif;
```

## 4. 扩大字体选用范围的技术

1. 字体系列 (FONT-FAMILY) ：要求用户的计算机上已经安装了相应的字体，字体选用范围有限。
2. 服务器端字体 (FONT-FACE) ：如果计算机上没有安装相应字体，可以使用 CSS 来指定字体的下载地址。字体使用许可必须允许使用 `@font-face` 分发字体。
3. 基于服务的服务器端字体 (SERVICE-BASED FONT-FACE) ：商业用户可以通过 `@font-face` 为用户提供更多的可选字体，需要向字库支付长期的费用。

## 5. 字体选用 font-family

1. `font-family` 属性允许为这些元素中的任意文本指定字体。
2. 该属性的值为你希望使用的字体名称。
3. 可以指定一组字体并用逗号隔开，这样如果用户没有安装指定的首选字体，浏览器将改用这个列表中的其他字体。
4. 将一种通用的字体名作为一类字体的结尾也是常用的做法。
5. 如果一个字体名称由多个单词组成，需要将其放在双引号或单引号中。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>字体选用 font-family</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <h1>Hello</h1>
        <p>Have a nice day!</p>
    </body>
</html>
```

```css
h1 {
    font-family: Georgia, 'Times New Roman', Times, serif;
}
p {
    font-family: 'Courier New', Courier, monospace;
}
```


![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203105123.png)

## 6. 字体大小 font-size

1. `font-size` 属性用来指定字体的大小。可以采用多种方式来指定字体的大小，常用的方式有：

    * 像素：像素能让 Web 设计人员对文本占用的控件进行精确的控制。表示方式是在像素值后加上 px。
    * 百分数：文本在浏览器中的默认大小是 16px。75% 相当于 12 px。
    * EM 值：1em 相当于一个字母 m 的宽度，通常是相对父元素中字体的大小。


```html
<!DOCTYPE html>
<html>
    <head>
        <title>字体大小 font-size</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <h1>Hello</h1>
        <p id="welcome">Welcome to our website!</p>
        <p>Have a nice day!</p>
    </body>
</html>
```


```css
h1 {
    font-size: 50px;
}
#welcome {
    font-size: 120%;
}
p {
    font-size: 2em;
}
```

## 7. 字体刻度

1. Word、PS 等程序都为文本提供了同样的大小。
2. 它们都是根据 16 世纪欧洲印刷业的刻度和比例进行设置的，这样一系列成比例的文本大小被称为刻度。
3. 打印品的设计人员经常按照点数来表示文本的大小，而不是像素。
4. 有些 Web 开发人员以 16 像素作为正文，然后使用一组与默认大小保持相对比例的刻度对其他字体大小进行调整。
5. 可以用 pt 代替 px，但是只对那些需要打印的页面有效。
6. em 值允许以父元素中的文本大小作为参考来改变当前元素的文本大小。

## 8. 选用更多字体

1. `@font-face` 通过指定字体的下载地址来让你调用字体，即使用户计算机上没有安装的字体也可以使用。
2. `font-family` 指定字体的名称。指定的字体名称可以在样式表的其他部分作为 `font-family` 属性的值使用。
3. `src` 该属性指定字体的路径，为了让其在多个浏览器中兼容，可能需要指定该字体多种不同版本的路径。
4. `format` 指定所提供字体的格式。
5. 下面的网站提供了开源字体：

    * www.fontsquirrel.com
    * www.fontex.org
    * www.openfontlibrary.org

```html
<!DOCTYPE html>
<html>
    <head>
        <title>选用更多字体</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <h1>Hello</h1>
    </body>
</html>
```

```css
@font-face {
    font-family: 'SourceSansPro';
    src: url('SourceSansPro-Regular.otf');
}
h1 {
    font-family: SourceSansPro;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203133924.png)


## 9. 字体格式

1. 不同的浏览器支持不同的字体格式，为了兼容所有的浏览器，需要提供字体的多个变体。
2. 可以通过网站 www.fontsquirrel.com/fontface/generator 来转换字体格式
3. 为了减少字体下载时间，一方面可以从字体中删除多余的字符，另一方面可以将字体存在 CDN 中。

## 10. 粗体

1. 使用 `font-weight` 属性可以创建粗体文本。
2. `normal` 属性值使文本以普通粗细显示。
3. `bold` 属性值使文本以粗体显示。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>粗体</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p>Hello</p>
    </body>
</html>
```

```css
p {
    font-weight: bold;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203134527.png)

## 11. 斜体

1. 使用 `font-style` 属性可以创建斜体文本。
2. `normal` 使文本以普通字体显示。
3. `italic` 使文本以斜体显示。
4. `oblique` 使文本倾斜显示。
5. `italic` 是基于手写体风格的字体版本，而 `oblique` 则是简单将字体倾斜。
6. 如果找不到对应的斜体字型，则会浏览器会采取一定的算法将字体倾斜。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>斜体</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p id="italic">italic</p>
        <p id="oblique">oblique</p>
    </body>
</html>
```

```css
p {
    font-family: 'Times New Roman', Times, serif;
}
#italic {
    font-style: italic;
}
#oblique {
    font-style: oblique;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203134939.png)

## 12. 大写和小写

1. `text-transform` 属性可以用来改变文本的大小写。
2. `uppercase` 使文本以大写显示。
3. `lowercase` 使文本以小写显示。
4. `capitalize` 使每个单词的首字母以大写显示。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>大写和小写</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p id="uppercase">hello</p>
        <p id="capitalize">welcome to our website</p>
    </body>
</html>
```

```css
#uppercase {
    text-transform: uppercase;
}
#capitalize {
    text-transform: capitalize;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203135437.png)

## 13. 下划线和删除线

1. `text-decoration` 可以为文本创建装饰线。
2. `none` 会把应用在文本上的装饰线删除，经常使用该技巧来删除 `<a>` 标签默认的下划线。
3. `underline` 会在文本底部增加一条实线。
4. `overline` 会在文本顶部增加一条实线。
5. `overline` 会用一条实现穿过文字。
6. `blink` 会使文本动态闪烁，但尽量不要使用。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>下划线和删除线</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p id="underline">hello</p>
        <p id="line-through">welcome to our website</p>
    </body>
</html>
```

```css
#underline {
    text-decoration: underline;
}
#line-through {
    text-decoration: line-through;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203141714.png)

## 14. 行间距

1. 对一种字型来说，位于基准线以下的部分称为字母下缘，字母的最高点称为字母上缘。
2. 行间距是指某一行字母下缘的底端到下一行字母上缘的距离。
3. 在 CSS 中，使用 `line-height` 属性来设置整个文本行的高度，因此，`line-height` 和 `font-size` 的差值就是行间距。
4. 增加 `line-height` 会使文本在垂直方向上的空隙增大。
5. 行间距的初始值应该设置在 1.4em ~ 1.5em 之间，最好将 `line-height` 属性的值以 `em` 值给出，而不要用像素值。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>行间距</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p>hello</p>
        <p>welcome to our website</p>
    </body>
</html>
```

```css
p {
    line-height: 1.4em;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203142444.png)


## 15. 字母间距和单词间距

1. 字距是印刷行业用来描述字母之间空隙的一个术语，可以使用 `letter-spacing` 属性来控制字母之间的间距。
2. 可以通过 `word-spacing` 来控制单词间距。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>字母间距和单词间距</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p>hello</p>
        <p>welcome to our website</p>
    </body>
</html>
```

```css
p {
    letter-spacing: 0.2em;
    word-spacing: 3em;
}
```


![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203142927.png)

## 16. 对齐方式

1. `text-align` 用于控制文本的对齐方式。
2. `left` 表示文本向左对齐。
3. `right` 表示文本向右对齐。
4. `center` 表示文本居中对齐。
5. `justify` 表示文本两端对齐，即段落中除了末行，其余每行都要在宽度上占满文本所在容器。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>对齐方式</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p id="cneter">hello</p>
        <p id="right">welcome to our website</p>
    </body>
</html>
```

```css
#center {
    text-align: center;
}
#right {
    text-align: right;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203143250.png)

## 17. 垂直对齐

1. 文本的垂直对齐不是让你在 `<p>` 或 `<div>` 这样的块级元素中垂直对齐文本，尽管可以在表格的单元格中实现这种效果。
2. `vertical-align` 用于内联元素，例如 `<img>` 元素，使其周围的文本元素实现对齐。
3. `top` 使周围文本的第一行与图像的顶端对齐。
4. `middle` 使周围文本的第一行与图像中间对齐。
5. `bottom` 使周围文本的第一行与图像底端对齐。


```html
<!DOCTYPE html>
<html>
    <head>
        <title>对齐方式</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <img src="cat.jpg" width="200" height="100" />
        可爱的小猫
    </body>
</html>
```

```css
img {
    vertical-align: middle;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203145659.png)

## 18. 文本缩进

1. `text-indent` 属性允许你将元素中的首行文本进行缩进。
2. 该属性值可以设置为负值，从而让一些元素隐藏，但文本依然在 HTML 页面中，这是为了方便视觉障碍的人。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>文本缩进</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p>hello</p>
    </body>
</html>
```

```css
p {
    text-indent: 2em;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203151507.png)

## 19. 投影

1. `text-shadow` 属性用来创建投影。
2. 投影指的是比文本颜色更暗的版本，它位于文本的后方并略有偏移。
3. 创建投影需要指定三个长度值和一种颜色。
4. 第一个长度值表示阴影向左或向右延伸的距离。
5. 第二个长度值表示阴影向上或向下延伸的距离。
6. 第三个长度值为可选项，表示投影的模糊程度。
7. 最后一项是投影的颜色值。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>投影</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p>hello</p>
    </body>
</html>
```

```css
p {
    text-shadow: 2px 2px 2px #006600;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203150156.png)

## 20. 首字母或首行文本

1. 可以通过 `:first-letter` 和 `:first-line` 为一个元素中的首字母或首行文本另外指定一个值。
2. `:first-letter` 和 `:first-line` 被称为伪元素。
3. 在选择器的末尾处指定伪元素，然后按照与其他元素一样的方式指定声明。
4. CSS 中引入了伪元素和伪类。
5. 伪元素就像在代码中加入了额外的元素，例如 `:first-letter` 和 `first-line` 就像是为首字母或者首行文本添加了额外的元素，并且在此元素上应用专门的样式。
6. 伪类就像一个类特性的额外的值，例如下面介绍的 `:visited` ，它允许为那些已经被访问过的链接指定不同的样式。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>首字母或首行文本</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <p>hello</p>
    </body>
</html>
```

```css
p::first-letter {
    color: red;
    font-size: 2em;
    text-transform: uppercase;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203151122.png)


## 21. 链接样式

1. 默认情况下，浏览器常以蓝色显示链接并附带下划线，此外，浏览器还会改变那些已经访问过的链接颜色。
2. `:link` 伪类允许为那些尚未被访问过的链接设置样式。
3. `:visited` 伪类允许为那些已经访问过的链接设置样式。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>链接样式</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <a href="home.html">主页</a>
        <a href="about.html">关于</a>
    </body>
</html>
```

```css
a:visited {
    color: red;
    text-decoration: none;
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203152002.png)


![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203152015.png)

## 22. 响应用户

1. 当用户与元素进行交互时，可以使用如下三种伪类来改变元素的外观。
    * `:hover`：在用户将定位设备（光标）悬停在某个元素上生效。
    * `:active`：在用户在元素上进行操作时生效，例如按钮被按下，光标被点击。
    * `:focus`：在元素拥有焦点时生效。


```html
<!DOCTYPE html>
<html>
    <head>
        <title>响应用户</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    </head>
    <body>
        <ul>
            <li><a href="home.html">主页</a></li>
            <li><a href="about.html">关于</a></li>
        </ul>
    </body>
</html>
```

```css
a:hover {
    color: red;
}
a:focus {
    color: black;
}
```


![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/03/20221203160328.png)

## 23. 属性选择器

1. 属性选择器应用于那些属性中含有特定值的元素。

| 选择器 | 含义 | 示例 | 解释 |
| --- | --- | --- | --- |
|EXISTENCE(简单选择器)|`[]` 匹配一种特定的属性(与属性值无关) | `p[class]` | 应用于所有包含 class 属性的 `<p>` 元素 |
|EQUALITY(精确选择器)|`[=]` 匹配一个特定的属性，该属性具有特定的值 |`p[class="dog"]` | 应用于所有 class 属性值为 dog 的 `<p>` 元素 |
|SPACE(部分选择器)|`[~=]` 匹配一个特定的属性，该属性值出现在以空格隔开的单词列表中 | `p[class~="dog"]` | 应用于特定的 `<p>` 元素，这些元素的 class 属性值其中一项是 dog|
|PREFIX(开头选择器)|`[^=]` 匹配一个特定的属性，该属性的值以某个特定的字符串作为开头 | `p[attr^"d"]` | 应用于特定的 `<p>` 元素，这些元素的某个属性值以字母 d 开头|
|SUBSTRING(包含选择器)|`[*=]`匹配一个特定的属性，该属性的值以某个特定的字符串作为开头 | `p[attr*"do"]`| 应用于特定的 `<p>` 元素，这些元素的某个属性值含有 do |
| SUFFIX(结尾选择器) | `[$=]`匹配一个特定的属性，该属性的值以某个特定的字符串作为结尾 | `p[attr$"g"]`| 应用于特定的 `<p>` 元素，这些元素的某个属性值以字母 `g` 结尾 |


## 24. 小结

1. 有些属性可以用来控制字体的类型、大小、粗细、样式和字距。
2. 可以假设大多数人已经安装了某些字体，但这些字体的种类是非常有限的。
3. 如果想要扩大字型的选择范围，有几种方法可供选择，但是前提是要取得这些字体的使用许可。
4. 文本的行距、字母间距和单词间距都是可以控制的。文本可以向左对齐、向右对齐、居中显示或者两端对齐，同时也可以缩进显示。
5. 当用户将光标悬停在文本、单击文本或者当某个链接已经被访问过时，可以使用伪类来改变这个元素的样式。