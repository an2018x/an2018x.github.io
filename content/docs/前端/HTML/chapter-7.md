---
title: 7-HTML 表单

description: 介绍 HTML 中表单工作流程以及如何创建各种表单控件

toc: true

authors: []

date: 2022-11-26T23:16:46+08:00

lastmod: 2022-11-26T23:16:46+08:00

draft: false

---

## 1. 表单概述

生活中，表单指的是一个打印的文档，这个文档中包含一些空白区域来填写信息。

在网页中，表单通常用来让网站收集来自访问者的信息。

## 2. 表单如何工作

1. 用户填写表单，然后单击一个按钮将所填信息提交给服务器。

2. 每个表单控件的名称与用户输入或选择的值一同发送到服务器。

3. 服务器利用某种编程语言（例如 Java）对这些信息进行处理，还可能将这些信息存储在一个数据库中。

4. 服务器基于收到的信息创建一个新页面并将其返回到浏览器。

## 3. 表单控件与输入数据

1. 表单中包含多个表单控件，每种控件收集不同的信息。

2. 服务器需要知道用户输入的每一条数据输入了哪个表单元素。

3. 为了区分各类输入数据，从浏览器发送到服务器的信息采用“名称-值”这样成对的格式，例如（username=an, password=123456）。

## 4. 表单结构

1. 表单控件位于 `<form>` 元素中。每个 `<form>` 元素通常要包含 `action` 、`method` 和 `id` 属性。

2. `action` 属性值对应服务器上一个页面的 URL，这个页面用来在用户提交表单时接收表单信息。

3. `method` 对应提交表单的方法，通常有 `get` 和 `post` 两种方法，如果没有指定，默认以 get 方法来发送。
   
   1. 使用 get 方法，表单中的值会被附加到由 action 指定的 URL 末尾，通常适用于短表单（搜索框）和从 Web 服务器检索数据的表单的情形。
   
   2. 使用 post 方法，表单中的值会被放在 HTTP 头信息中，通常，当上传文件、长表单、包含敏感信息和向数据库添加信息时，应该使用 post 方法。

4. `id` 属性用来对表单进行唯一标识。

## 5. 单行文本框

1. `<input>` 元素用来创建多种不同的表单控件。

2. `type` 属性值决定要创建哪种控件，当属性值为 `text` 时，会创建一个单行文本框。

3. 当用户向表单中输入信息时，服务器需要知道每条数据被输入到了哪个表单控件中。因此，每个表单控件都要指定一个 `name` 属性，这个属性的值用来对表单控件进行标识，并和输入的信息一起传递给服务器，后续的表单控件都支持 `name` 属性。

4. `maxlength` 属性可以限制用户在文本区域输入字符的数量，它的值为用户可以输入字符的最大数量。

```html
<html>
    <head>
        <title>单行文本框测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> Username:
                <input type="text" name="uname" maxlength="30"/>
            </p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127113312.png)

## 6. 密码框

1. 当 `type` 属性值为 `password` 时，`<input>` 元素会创建一个密码框，它的输入字符会被隐藏起来。

2. `name` 属性用来指定密码框的名称。

```html
<html>
    <head>
        <title>密码框测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> Password:
                <input type="password" name="passwd" maxlength="30"/>
            </p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127113619.png)

## 7. 文本域/多行文本框

1. `<textarea>` 元素用来创建多行文本框。

2. `<textarea>` 元素并非空元素，它包含起始和结束标签。

3. 页面加载完成后，`<textarea>` 标签内的内容会作为默认内容出现在文本框中。

```html
<html>
    <head>
        <title>多行文本框测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> 更多建议:
                <textarea name="advice">请输入你的建议</textarea>
            </p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127113943.png)

## 8. 单选按钮

1. `type="radio"` 可以让用户创建一个单选按钮，从而在一系列选项中只选择一个。

2. `name` 属性指定控件名称，一系列只能选择一个的单选按钮应该共用一个 `name`。

3. `value` 属性指定该项被选中后发送给服务器的数据值。

4. `checked` 属性可以指定当页面加载后该项是否默认被选中。

```html
<html>
    <head>
        <title>单选框测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> 性别: <br />
                <input type="radio" name="gender" value="M" checked /> 男 <br />
                <input type="radio" name="gender" value="F" /> 女
            </p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127114809.png)

## 9. 复选框

1. `type="checkbox"` 可以让用户创建一个复选按钮，从而在一系列选项中可以选择多个选项。

2. `name` 指定控件名称，相关的复选框应该指定一个 `name`。

3. `value` 指定该项被选中后发送给服务器的值。

4. `checked` 属性可以指定当页面加载后该项是否默认被选中。

```html
<html>
    <head>
        <title>复选框测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> 爱好: <br />
                <input type="checkbox" name="hobbies" value="swimming" checked /> 游泳
                <input type="checkbox" name="hobbies" value="running" /> 跑步
                <input type="checkbox" name="hobbies" value="other" /> 其他
            </p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127115243.png)

## 10. 下拉列表框

1. 下拉列表框让用户在一个下拉列表中选择其中的一个选项。

2. `<select>` 元素用来创建下拉列表框，包含两个以上的 `<option>` 元素。

3. `<option>` 元素用来指定用户可以选择的选项，在 `<option></option>` 标签中的内容将会展示为选项。

4. `value` 属性用来指定选项的值。

5. `selected` 属性可以指定当前页面加载时被选中的选项。如果未指定，则展示第一个选项。

```html
<html>
    <head>
        <title>下拉列表框测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> 你来自哪里: </p>
            <select name="country">
                <option value="中国">中国</option>
                <option value="美国">美国</option>
                <option value="其他" selected>其他国家</option>
            </select>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127220820.png)

## 11. 多选框

1. 可以使用 `size` 属性让下拉列表框能显示多个选项。

2. 可以使用 `multiple` 属性来允许用户选择多个选项。

```html
<html>
    <head>
        <title>多选框测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> 你的爱好是什么: </p>
            <select name="hobbies" size="2" multiple>
                <option value="爬山">爬山</option>
                <option value="游泳">游泳</option>
                <option value="钓鱼">钓鱼</option>
            </select>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127221235.png)

## 12. 文件上传域

1. 通过指定 `type="file"` 会创建一个带上传按钮的文本框。

2. 如果需要用户上传文件，必须将 `<form>` 的 `method` 属性设置为 `post`。

```html
<html>
    <head>
        <title>文件上传域测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com" method="post">
            <p> 请上传文件： </p>
            <input type="file" />
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127221602.png)

## 13. 提交按钮

1. 提交按钮用来将表单发送给服务器。

2. 通过指定 `type="submit"` 可以定义一个提交按钮。

3. `value` 属性用于控制在按钮上显示的文字。

```html
<html>
    <head>
        <title>提交按钮测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p> 请上传表单 </p>
            <input type="submit" value="提交" />
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127221912.png)

## 14. 图像按钮

1. 通过指定 `type="image"` 可以使用图像作为提交按钮。

2. 通过 `src`、`alt` 、`width` 、`height` 属性可以指定图像的具体属性，这点与 `<img>` 标签相同。

```html
<html>
    <head>
        <title>图像按钮测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p>请点击如下按钮：</p>
            <input type="image" src="button.png" alt="按钮" width="100" height="50" />
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127223857.png)

## 15. 按钮和隐藏控件

1. `<button>` 元素可以让用户更好地控制按钮的显示方式，并允许其他元素出现在 `<button>` 元素内。

2. 指定 `type="hidden"` 的控件不会显示在页面上，这允许开发人员向页面中添加用户看不到的值。

```html
<html>
    <head>
        <title>按钮测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <button><img src="add.png" />添加</button>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127224450.png)

## 16. 标签表单控件

1. 可以使用 `<label>` 元素来作为标签，从而说明控件的作用。

2. 相比与直接使用文本而言，`<label>` 元素对视力障碍人士更友好。

3. 可以用 `<label>` 标签将控件包围起来使用。

4. 也可以使用 `for` 属性来指明 `<label>` 元素关联的表单控件，其中属性值为表单控件的 id 属性值。

5. 可以通过点击 `<label>` 元素来跳转到对应的控件。

```html
<html>
    <head>
        <title>标签表单控件测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <label>年龄：<input type="text" /></label> <br />
            <label for="job">职业</label>
            <input id="job" type="text" />
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127225145.png)

## 17. 组合表单元素

1. 可以将相关的表单控件置于 `<fieldset>` 元素中分成一组。

2. `<lengend>` 元素可以直接跟在 `<fieldset>` 元素后并包含一个标题，这个标题用来说明控件组的用途。

```html
<html>
    <head>
        <title>组合表单元素测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <fieldset>
                <legend>职业调查</legend>
                <label>年龄：<input type="text" /></label> <br />
                <label for="job">职业</label>
                <input id="job" type="text" />
            </fieldset>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127230156.png)

## 18. 表单验证

1. 可以使用 `required` 属性来说明提示用户某一个控件必须填入值。

```html
<html>
    <head>
        <title>表单验证测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p>用户名：<input type="text" name="uname" required /></p>
            <p><input type="submit" /></p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127230501.png)

## 19. 日期控件

1. 通过指定 `type="date"` 可以创建一个日期输入控件。

```html
<html>
    <head>
        <title>日期控件测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p>出生日期：<input type="date" name="birthday" required /></p>
            <p><input type="submit" /></p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127230636.png)

## 20. 电子邮件和 URL 输入控件

1. 指定 `type="email"` 可以创建一个电子邮件输入控件。

2. 指定 `type="url"` 可以创建一个 URL 输入控件。

3. 浏览器会校验电子邮件或 URL 输入控件的值格式是否正确。

```html
<html>
    <head>
        <title>电子邮件和 URL 输入控件测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <p>电子邮件：<input type="email" name="email" /></p>
            <p>网址：<input type="url" name="url" /></p>
            <p><input type="submit" /></p>
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127231137.png)

## 21. 搜索输入控件

1. 通过指定 `type="search"` 可以创建一个用于搜索的单行文本框。

2. 对于所有的文本输入控件，都可以设置 `placeholder` 属性作为没有任何输入时的占位符。

```html
<html>
    <head>
        <title>搜索输入控件测试</title>
    </head>
    <body>
        <form action="http://www.ans20xx.com">
            <input type="search" placeholder="搜索一下" />
            <input type="submit" value="搜索" />
        </form>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/27/20221127231428.png)

## 22. 小结

1. 当希望从访问者那里收集表单时，需要使用表单，表单内容位于 `<form>` 元素中。

2. 表单中的内容以 "名称/值" 的形式进行发送。

3. 每个表单控件都有一个名称，用户输入的文本或所选择选项的值一同发送给服务器。
