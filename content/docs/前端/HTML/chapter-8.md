---
title: 8-HTML5 其他标记

description: HTML5 版本的指定、元素的标识和分组、注释、 META 信息与内联框架

toc: true

authors: []

date: 2022-12-02T17:16:46+08:00

lastmod: 2022-12-02T17:16:46+08:00

draft: false

---

## 1. DOCTYPE 文档类型

1. HTML 存在多个版本，因此每个网页的开头都应该用 `DOCTYPE` 声明来表示使用了 HTML 哪个版本。
2. 即使没有 `DOCTYPE` 类型，浏览器通常也会显示页面，但是使用 `DOCTYPE` 有助于浏览器正确渲染。
3. HTML 5 的 `DOCTYPE` 声明如下，它应该被放在文件的开头位置：

```html
<!DOCTYPE html>
```

## 2. 注释

1. 注释后的内容不会被浏览器显示。
2. 可以在被注释的内容左右添加 `<!--` 和 `-->` 来表示表示注释。
3. 开发者通常使用注释来对某段代码进行说明。

例如：

```html
<!DOCTYPE html>
<html>
    <head>
        <title>注释测试</title>
    </head>
    <body>
        <p>你好，世界!</p>
        <!-- <p>被注释的内容不会显示</p> -->
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202171614.png)

## 3. id 属性

1. `id` 属性用来对一个元素进行唯一标识。
2. 每个 `html` 元素都可以使用 `id` 属性。
3. `id` 属性的值必须以字母或下划线开头，且在一个页面中必须唯一。
4. 像 `id` 属性这样可以被应用于任何元素的属性一般被称为全局属性。
5. 下面的 `id` 属性值 hello 唯一标识了 `p` 元素。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>id属性测试</title>
    </head>
    <body>
        <p id="hello">你好</p>
    </body>
</html>
```

## 4. class 属性

1. `class` 属性可以指定页面中的多个元素，并将其与其他元素区别出来。
2. 每个 `html` 元素都可以使用 `class` 属性。
3. 任何元素上的 `class` 属性都可以共用相同的值。
4. 如果想要指定一个元素属于几个不同的类，只需要使用空格将类名隔开。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>class属性测试</title>
    </head>
    <body>
        <p class="hello">你好</p>
        <p class="hello intro">我的名字是An</p>
    </body>
</html>
```

## 5. 块级元素

1. 有些元素在浏览器窗口中显示时总是另起一行，这些元素被称为块级元素。
2. 块级元素包括 `<h1>`、`<p>`、`<ul>` 以及 `<li>` 等。

## 6. 内联元素

1. 有些元素在浏览器窗口中显示时总是与前一个元素出现在同一行内，这些元素被称为内联元素。
2. 块级元素包括 `<a>`、`<img>`、`<em>` 以及 `<b>` 等。

## 7. 将文本及元素集中在一个块级元素中

1. `<div>` 允许你将一组元素集中在一个块级元素中。
2. 由于 `<div>` 元素内部总是包含其他的一些元素，所以最好在结束标签 `<div>` 后面添加一行注释加以说明。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>div测试</title>
    </head>
    <body>
        <img src="cat.jpg" width="200" height="100" />
        <div>
            <a href="detail.html">详细信息</a>
            <a href="about.html">关于</a>
        </div> <!-- 一组链接 -->
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202173818.png)



## 8. 将文本及元素集中在一个内联元素中

1. `<span>` 元素允许你将一组元素集中在一个内联元素中。
2. `<span>` 元素可以在没有其他合适元素的情况下包含一段文本并将其与周围的文本区分开。
3. 通常包含若干个内联元素。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>span测试</title>
    </head>
    <body>
        <p>你好，<span class="mark">世界</span></p>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202174313.png)

## 9. 内联框架

1. 内联框架就像在网页中分割的小窗口，可以在这个小窗口中看到另外一个网页。
2. 可以使用 `<iframe>` 元素来创建内联框架，`iframe` 是 inline frame 的缩写。
3. src 属性指定要在框架中显示的另外一个页面的 URL。
4. height 和 width 属性指定内联属性的宽高。
5. seamless 属性可以让内联页面不出现滚动条。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>iframe测试</title>
    </head>
    <body>
        <iframe src="http://www.bilibili.com" width="800" height="600" seamless>

        </iframe>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202181556.png)

## 10. 页面信息

1. `<meta>` 元素位于 `<head>` 元素中并包含所在页面的相关信息。
2. `<meta>` 元素对用户不可见，但是有多种用途，比如把页面的相关信息告诉搜索引擎。
3. `<meta>` 元素是空元素，所以没有结束标签。
4. `name` 属性指明要设定的 meta 属性名，`content` 属性指明要设定的 meta 属性值。
5. `name` 属性的值可以任意指定，但是常用的有以下几种：
    * `description` 用于包含一段有关页面的描述信息，该描述信息用来帮助搜索引擎了解页面的内容，但最多只能容纳 155 个字符。
    * `keywords` 用来包含一组以逗号分隔的关键词列表，用户可以通过这些关键词找到页面，但是由于之前这个属性被滥用，现在效果已经微弱了。
    * `robots` 用来指定搜索引擎是否可以将这个页面加入到搜索结果中。如果不希望加入，可以使用值 `noindex`，如果希望加入，但是不要收录页面上链接的其他页面，可以使用 `nofollow`。
6. `meta` 属性还会成对指定 `http-equiv` 属性和 `content` 属性，常用的如下：
    * `author` 用来指定网站的设计者。
    * `pragma` 用于防止浏览器对页面的缓存。
    * `expires` 由于浏览器经常缓存页面的内容，`expires` 选项可以用来指定页面的过期时间，必须按照指定格式给出，如下例：

```html
<!DOCTYPE html>
<html>
    <head>
        <title>meta 元素测试</title>
        <meta name="descirption" content="欢迎页面" />
        <meta name="keywords" content="hello, self-intro" />
        <meta name="robots" content="noflow" />
        <meta http-equiv="author" content="an" />
        <meta http-equiv="progma" content="no-cache" />
        <meta http-equiv="expires" content="Fri, 04 Oct 2022 12:00:00 GMT" />
    </head>
    <body>
        <p>你好，我是An</p>
    </body>
</html>
```


## 11. 转义字符

1. 一些字符用来编写 html 代码被作为 html 的保留字符，例如 `<` 和 `>`，还有一些是特殊符号，用来标识版权、货币等。
2. 如果需要在浏览器中显示这些字符，就需要使用它们对应的转移字符。

转义字符可以参考：

https://www.sojson.com/htmlmark.html

## 12. 小结

1. DOCTYPE 告诉浏览器你正在使用哪个版本的 HTML。
2. 可以使用 `<!-- -->` 来在页面中添加注释。
3. `id` 和 `class` 属性可以帮助定位特定的元素。
4. `<div>` 可以将块级元素聚合起来，`<span>` 可以将内联元素聚合起来。
5. `<iframe>` 用来在网页中嵌入其他的页面。
6. `<meta>` 标签可以提供网页的相关信息。
7. 转义字符可以用来向页面中加入特殊字符。


