---
title: 4-HTML 链接

description: 介绍 HTML 中的链接

toc: true

authors: []

date: 2022-11-26T20:15:46+08:00

lastmod: 2022-11-26T20:15:46+08:00

draft: false

---

## 1. 编写链接

1. 链接通过 `<a>` 元素建立。

2. 用户可以点击 `<a></a>`  标签中的内容。

3. `href` 属性指定要跳转到的页面。

## 2. 指向其他网站的链接

1. `href` 属性设置了链接的目标，即网站用户单击链接时所到达的页面地址。

2. 当用户点击 `<a></a>` 中的内容，就会跳转到 `href` 属性指定的页面。

3. 如果链接指向另外一个网站，那么 `href` 的属性值必须是另一个网站的完整 URL/绝对 URL 地址。

4. 默认情况下，链接文本在浏览器中显示为带有下划线的蓝色文本。

5. URL 全称是 Uniform Resource Locator （统一资源定位器）。每个网页都有自己的 URL。

6. 绝对 URL 以域名开头，域名后面可以指定具体页面的路径，如果没有指定具体路径，网站就会显示主页。

```html
<html>
    <head>
        <title>指向其他网站的链接测试</title>
    </head>
    <body>
        <a href="https://www.taobao.com">淘宝</a>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126221333.png)

点击链接后：

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126221439.png)

## 3. 指向同一网站中其他页面的链接

1. 如果只是链接到同一网站中的其他页面，那么可以使用相对 URL。

2. 相对 URL 中不需要指定网站的域名。

```html
<html>
    <head>
        <title>指向同一网站中其他页面的链接</title>
    </head>
    <body>
        <a href="about.html">第二页</a>
    </body>
</html>
```

about.html：

```html
<html>
    <head>
        <title>第二页</title>
    </head>
    <body>
        <h1>这是另外一个页面</h1>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126221853.png)

点击后：

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126221912.png)

## 4. EMAIL 链接

1. email 链接的 `href` 属性以 `mailto:` 开始，属性值为收件人的邮箱地址。

```html
<html>
    <head>
        <title>EMAIL 链接</title>
    </head>
    <body>
        <a href="mailto:ans20xx@qq.com">发送邮件给 ans20xx</a>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126222159.png)

点击后：

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126222226.png)


## 5. 在新窗口中打开链接

1. 可以使用 `target` 属性，并将值设置为 `_blank` 来在新窗口中打开链接。

2. 一般在访问另外一个网站时需要设置该值。

```html
<html>
    <head>
        <title>在新窗口中打开链接测试</title>
    </head>
    <body>
        <a href="https://www.baidu.com" target="_blank">百度</a>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126222459.png)

点击后：

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126222514.png)





## 6. 链接到当前页面的某个特定位置



1. 需要使用 `id` 属性来确定元素的目标位置。

2. `id` 属性值必须以字母或者下划线开头。

3. 一个页面中不允许有两个重复的 `id` 属性值。

4. 跳转到 `id` 属性对应的元素时，需要设置 `href` 属性的值为 "#+属性名"。



```html
<html>
    <head>
        <title>链接到当前页面的某个特定位置</title>
    </head>
    <body>
        <a href="#title2">跳转到标题二</a>
        <h1 id="title1">标题一</h1>
        <h2>子标题1</h2>
        <h2>子标题2</h2>
        <h2>子标题3</h2>
        <h1 id="title2">标题二</h1>
    </body>
</html>
```



![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126223906.png)



点击链接后：



![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126223925.png)



标题二出现在了页面下方


## 7. 链接到其他页面的某个特定位置

1. 可以设置 `href` 的属性值为 "绝对 URL + # + id 属性值" 来链接到其他页面的某个特定位置。


## 8. 小结

1. 链接通过 `<a>` 元素创建。

2. `<a>` 元素通过 `href` 属性名指定要链接的页面。

3. 如果是链接到网站内部的页面，最好使用相对 URL。

4. 可以使用 mailto: 前缀来指定发送 EMAIL 的链接。

5. 可以通过 `id` 属性值将某个页面上的元素作为链接目标。






