---
title: 5-JavaScript 文档对象模型
description: 描述 JavaScript 中的文档对象模型
toc: true
authors: []
date: 2023-01-27T20:46:46+08:00
lastmod: 2023-01-27T20:46:46+08:00
draft: false
---

## 1. 简介

1. 文档对象模型规定了浏览器应该如何创建 HTML 页面的模型，以及 JavaScript 如何访问或修改浏览器窗口中的 Web 页面的内容。
2. DOM 既不是 HTML 中的一部分，也不是 JavaScript 中的一部分，而是一系列独立的规则，所有主流的浏览器都实现了这些规则。
3. 规则主要分为两个方面。
4. 规定 HTML 页面的模型：
    1. 当浏览器加载 Web 页面时，会再内存中创建页面的模型。
    2. DOM 规定了浏览器应该使用 DOM 树的方式来创建这个模型。
    3. DOM 被称为 "对象模型" 是因为这个模型(DOM树)是由一些对象组成的。
    4. 每个对象都会作为页面的不同部分被加载到浏览器窗口中。
5. 访问和修改 HTML 页面：
    1. DOM 同样定义了一些方法和属性，用来访问和修改模型中的对象，用户最终会在浏览器中看到这些修改。
    2. 人们把 DOM 称为 API，API 是程序之间的通信接口。
    3. DOM 规定了脚本可以向浏览器询问当前页面相关的哪些内容，以及如何通知浏览器去修改用户看到的内容。

## 2. DOM 树是 Web 页面的模型

1. 当浏览器加载一个 Web 页面时，它会创建这个页面的模型，这个模型被称为 DOM 树，并被保存在浏览器的内存中，该模型由四类主要节点构成。
2. 文档节点：在 DOM 树的顶端是文档节点，它呈现为整个页面，相当于 document 对象，当需要访问任何其他节点时，都需要通过文档节点进行导航。
3. 元素节点：HTML 元素描述了 HTML 页面的结构，需要访问 DOM 树时，需要从查找元素开始，一旦找到所需的元素，就可以根据需要来访问它的文本和属性节点。
4. 属性节点：HTML 元素的开始标签中可以包含若干属性，这些属性在 DOM 树中形成属性节点。属性节点不是所在元素的子节点，它们是这个元素的一部分。当访问一个元素时，有特定的方法和属性用来读取或修改这个元素的属性。
5. 文本节点：当访问元素节点时，可以访问元素内部的文本，这些文本保存在其文本节点中。文本节点没有子节点。

## 3. 使用 DOM 树

1. 访问并更新 DOM 树需要两个步骤：
    1. 定位到需要操作的元素所对应的节点。
    2. 使用它的文本内容、子元素或属性。
2. 访问元素
    1. DOM 查询-选择单个元素节点
        1. getElementById() 使用元素的 id 属性
        2. querySelector() 使用 CSS 选择器，返回第一个匹配的元素
    2. DOM 查询-选择多个元素
        1. getElementByClassName() 使用 class 属性
        2. getElementByTagName() 选择所有使用了指定标记的元素
        3. querySelectorAll() 选择所有使用了指定标记的元素
    3. DOM 遍历-在元素节点之间遍历
        1. 可以从一个元素节点移动到另一个相关的元素节点
        2. parentNode：返回当前元素节点的父节点
        3. previousSibling/nextSibling 选择 DOM 树中的前一个或后一个兄弟节点
        4. fistChild/lastChild 选择当前元素的第一个或最后一个子节点
3. 操作元素
    1. 访问/更新文本节点
        1. 任何元素内部的文本都保存在文本节点中
        2. 使用文本节点唯一属性 nodeValue 从元素中获取或修改文本
    2. 操作 HTML 内容
        1. innerHTML 可以访问子元素和文本内容
        2. textContent 仅访问文本内容
        3. createElement()/createTextNode()/appendChild()/removeChild() 可以用来创建新的节点、将节点添加到树种或者从树中移除节点
    3. 访问或更新属性值
        1. hasAttribute() 用来检查属性值是否存在。
        2. getAttribute() 用来获取属性值。
        3. setAttribute() 用来更新属性值。
        4. removeAttribute() 用来移除属性。


## 4. 缓存 DOM 查询

1. 用来在 DOM 树中查找元素的方法被称为 DOM 查询。
2. 当需要多次操作同一个元素时，应该使用一个变量来保存这个查询的结果。
3. 保存到变量中的实际上是元素在 DOM 树中的位置，这个元素节点的属性和方法可以通过这个变量来获取。

## 5. 访问元素

1. DOM 查询可能返回一个元素，也可能返回一个 NodeList，即节点的集合。

## 6. 选择单一节点的方法

1. `getElementById()` 和 `querySelector()` 方法都可以搜索整个文档，然后返回单一元素。

### 6.1. 使用 id 属性选择元素

1. `getElementById()` 方法运行根据指定的 id 属性来选择单一的元素节点。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>使用id属性选择元素</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <header>
            <div id = "item1"></div>
            <div id = "item2"></div>
        </header>
        <script src = "./hello.js"></script>
    </body>
</html>
```

```css
div {
    height: 50px;
    width: 100px;
    border: 1px solid black;
    background-color: yellow;
}
.red {
    background-color: red;
}
```

```js
var el = document.getElementById("item1");
el.className = "red";
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/28/20230128134837.png)

2. 通过修改 className 属性来修改元素的类名。

## 7. NodeList：返回多个元素的 DOM 查询

1. 当一个 DOM 方法可以返回多个元素时，它会返回一个 NodeList。
2. NodeList 是一组元素节点的集合。每个节点都有索引编号（从 0 开始的数字，就像数组一样）。
3. NodeList 看起来像是数组，然而它实际上不是数组，而是一种被称为集合的对象。
4. 动态和静态 NodeList：
    1. 在动态 NodeList 中，当脚本更新页面时，NodeList 也会进行更新，以 `getElementBy` 开头的方法会返回动态 NodeList。
    2. 在静态 NodeList 中，当脚本更新页面之后，NodeList 并不会进行更新，也不会反映脚本做出的变更，一些例如 `querySelector` 的方法会返回静态 NodeList，它只会反映查询当时的文档内容。

## 8. 使用 class 属性选择元素

1. `getElementByClassName()` 方法允许选择那些 class 属性包含指定值的元素。
2. 由于可能有多个元素拥有同样的 class 属性，所以该方法会一直返回一个 NodeList。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>使用class属性选择元素</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <header>
            <div></div>
            <div class="cRed"></div>
        </header>
        <script src = "./hello.js"></script>
    </body>
</html>
```

```js
var el = document.getElementsByClassName("cRed");
el[0].className = "red";
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/28/20230128140251.png)

## 9. 使用标签名选择元素

1. `getElementsByTagName()` 方法允许使用标签名选择元素。
2. 注意参数名称不需要使用尖括号来包裹标签名。

```js
var el = document.getElementsByTagName("div");
for (var i = 0; i < el.length; i++) {
    el[i].className = "red";
}
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/28/20230128140458.png)

## 10. 使用 CSS 选择器选择元素

1. `querySelector()` 方法返回匹配 CSS 样式选择器的第一个元素节点。
2. `querySelectorAll()` 方法以 NodeList 形式返回满足条件的所有节点。

## 11. 遍历 DOM

1. 得到一个元素节点后，可以使用如下属性来找到其他相关的元素，这种方式被称为遍历 DOM。
2. `parentNode` 该属性在 HTML 中找到包含该元素的父节点。
3. `previousSibling` 和 `nextSibling` 这两个属性找到当前节点的前一个或后一个兄弟节点。
4. `firstChild` 和 `nextChild` 这两个属性找到当前元素的第一个或最后一个子节点。

## 12. 空白节点

1. 有些浏览器会在元素之间添加一个文本节点，不管它们之间是否真的有空白。
2. 绝大多数浏览器，都会把元素之间的空白（空格或回车）当作文本节点来处理，因此 `previousSibling`、`firstChild` 可能对于不同浏览器返回不同的元素。
3. 可以通过删除 HTML 中的空白来解决这个问题。
4. 也可以使用例如 jQuery 框架提供的能力来解决。

## 13. 获取/更新元素内容

### 13.1. 使用 nodeValue 属性获取和更新文本节点

1. 选择一个文本节点后，可以使用 `nodeValue` 属性获取或修改其内容。
2. 使用 nodeValue 属性时，必须在文本节点上操作，而不是在包含文本的元素节点上操作。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>使用 nodeValue 属性获取和更新文本节点</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div id = "item1">旧Node</div>
        <script src = "./hello.js"></script>
    </body>
</html>
```

```js
var el = document.getElementById("item1");
el.firstChild.nodeValue = "新Node"
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/28/20230128143818.png)

### 13.2. 使用 textContent 和 innerText 获取和更新文本

1. 使用 textContent 可以获取或更新包含元素及其子元素中的文本。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>使用 textContent 和 innerText 获取和更新文本</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <div id = "item1"><em>测试</em>test</div>
        <script src = "./hello.js"></script>
    </body>
</html>
```

```js
var el = document.getElementById("item1");
console.log(el.textContent)
// 打印：测试test
```

2. `textContent` 属性会忽略掉元素内所有的标签。
3. 同样有个 `innerText` 属性，不过不建议使用，因为它不会返回任何被 CSS 隐藏的内容，同时性能较差。

## 14. 添加或移除 HTML 内容

1. 存在两种不同的方式来添加和移除 DOM 树中的内容：innerHTML 属性和 DOM 操作。

### 14.1. innerHTML 属性

1. innerHTML 属性可以被用于任何元素节点。
2. innerHTML 属性既可以被用来获取内容，也可以被用来修改内容。
3. 需要更新元素时，新的内容需要以字符串的形式提供，它可以包含后代元素的标签。
4. 修改内容时，需要把新的内容（包括标签）保存在字符串中，然后设置 innerHTML 为这个值。
5. 要从元素中移除所有内容，需要将 innerHTML 属性设置为空字符串。

### 14.2. DOM 操作

1. DOM 操作可以很容易地针对 DOM 树中的独立节点，而 innerHTML 更适合用来更新整个片段。
2. DOM 操作会比使用 innerHTML 安全一点，但是它需要更多的代码，速度也会更慢。
3. DOM 操作涉及一组和 DOM 相关的方法，允许创建元素和文本节点，然后将其附加到 DOM 树中，或将其从 DOM 树中移除。

#### 14.2.1. 使用 DOM 操作添加元素

1. 创建元素：可以使用 `createElement()` 方法创建一个新的元素节点，该元素节点会被保存到一个变量中。
2. 设置内容：可以使用 `createTextNode()` 方法创建一个新的文本节点。然后使用 `appendChild()` 方法将该节点添加到元素节点中。
3. 添加到 DOM 树中：可以使用 `appendChild()` 方法将新创建的元素添加到 DOM 树中，也可以使用 `insertBefore()` 方法将元素添加到指定元素之前。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>使用DOM操作添加元素</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <article>
            <div class = "red">test</div>
        </article>
        <script src = "./hello.js"></script>
    </body>
</html>
```

```js
var articleEl = document.getElementsByTagName("article")[0];
var newEl = document.createElement("div");
var newText = document.createTextNode("测试");
newEl.appendChild(newText);
articleEl.appendChild(newEl);
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/28/20230128152027.png)

#### 14.2.2. 使用 DOM 操作移除元素

1. 选择需要被移除的元素，并将该元素节点保存到变量中。
2. 把该元素的父元素节点保存变量中。
3. 使用 `removeChild()` 方法把元素从它的包含父元素中移除。
4. 当从 DOM 中移除一个元素时，也会移除它的所有子元素。

### 14.3. 两种方式比较

1. `document.write()` 方法可以很简单地向页面中添加内容，它的优缺点如下：
* 优点
    1. 可以快速、简单地向页面添加内容
* 缺点
    1. 只在页面初始化时才有效。
    2. 如果在在页面加载完成后使用该方法，则会覆盖整个页面，而不是向页面中添加新的内容。
    3. 大多数人不会使用。
2. `innerHTML` 属性允许以字符串的方式，获取/更新任何元素中的整个内容(包括里面的标签)。
* 优点：
    1. 可以使用更少的代码添加大量的新标签。
    2. 速度比 DOM 操作更快
    3. 当需要移除元素中的内容时，更简单
* 缺点：
    1. 不应该用它来添加来自用户输入的内容，可能会导致安全隐患。
    2. 在添加一个很大的 DOM 片段时，很难独立区分出每一个元素。
    3. 事件处理程序可能会出问题。
3. DOM 操作提供了一组方法和属性，用来访问、创建以及更新元素和文本节点。
* 优点
    1. 如果 DOM 片段中有大量的兄弟节点，处理其中一个元素节点使用这种方法更合适。
    2. 不会影响事件处理程序。
    3. 可以轻易使用脚本来逐步添加元素。
* 缺点
    1. 速度更慢
    2. 需要编写更多代码来实现相同的功能

## 15. 跨站脚本(XSS)攻击

1. 如果使用 innerHTML 向页面中添加一些 HTML 内容，需要小心跨站脚本攻击，攻击者会用这种方式来获取用户账号信息。
2. XSS 攻击者将恶意代码插入到网站中，网站会展示很多不同的由用户自己创建的内容，例如：
    * 用户可以修改信息
    * 用户可以发表文章
    * 用户可以上传文件
3. 这些无法控制的数据被称为不可信任数据。
4. XSS 可以让攻击者获取到如下信息：
    * DOM 信息
    * 网站的 Cookie
    * 会话令牌

## 16. 防范 XSS 攻击

1. 校验提交到服务器上的数据。
2. 对来自服务器或数据库中的数据进行转义。

## 17. 属性节点

1. 得到一个元素节点后，可以在这个元素上使用其他一些对象属性和方法来获取和修改它的 HTML 属性。

### 18. 检查一个属性并获取它的值

1. 在操作一个属性之前，最好需要检查一下它是否存在。
2. `hasAttribute()` 方法可以检查任何一个元素节点的某个属性是否存在。
3. `getAttribute()` 方法可以获取指定名称的属性节点。

### 19. 创建属性并更改其值

1. 使用 `className` 属性可以修改 class 这个 HTML 属性的值，如果属性不存在，则会创建一个。
2. `setAttribute()` 方法允许你更新任何 HTML 属性的值，它使用两个参数：属性名称 + 该属性的值。

### 20. 移除属性

1. 需要从元素中移除一个属性时，需要首先选中这个属性。
2. 之后调用选中属性的 removeAttribute() 方法。
3. 如果移除一个不存在的属性会报错。

### 21. 在 Chrome 中检查 DOM

1. 在 Chrome 页面上 右键 -> 检查 -> 选中 Elements 选项卡 -> Properties ，即可看到对应的 DOM 和它的所有属性。

![](https://animg.oss-cn-shanghai.aliyuncs.com/2023/01/28/20230128155921.png)
