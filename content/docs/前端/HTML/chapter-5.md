---
title: 5-HTML 图像

description: 介绍 HTML 中有序和无序列表

toc: true

authors: []

date: 2022-11-26T22:15:46+08:00

lastmod: 2022-11-26T22:15:46+08:00

draft: false

---



## 1. 添加图像



1. 可以使用 `<img>`  元素向页面中添加图像，该元素是一个空元素。

2. `src` 属性告诉浏览器从哪里获取到图像。

3. `alt` 属性对图像进行文本说明，从而在无法查看图像时对图像进行描述。

4. `title` 属性提供有关图像的附加内容，该属性的值会在鼠标悬停在图像时显示。



```html
<html>
    <head>
        <title>添加图像测试</title>
    </head>
    </head>
    <body>
        <img src="cat.jpg" alt="猫" title="猫猫摄影" />
    </body>
</html>
```





![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126233210.png)





## 2. 图像的宽度和高度



1. 使用 `width` 属性以像素为单位指定图像的宽度。

2. 使用 `height` 属性以像素为单位指定图像的高度。

3. 提前指定图像的宽高可以让浏览器为图片提前留出指定的空间余量。

4. 也可以使用 CSS 来只当图像的宽高。



```html
<html>
    <head>
        <title>图像的宽度和高度测试</title>
    </head>
    </head>
    <body>
        <img src="cat.jpg" alt="猫" title="猫猫摄影" 
            width="200" height="120"/>
    </body>
</html>
```



![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126233505.png)





## 3. 在代码中插入图像的位置



1. 在代码中插入图像的位置会如何显示图像产生影响。

2. 在段落之前插入图像，段落会在图像后另起一行显示。

3. 在段落起始位置插入图像，段落文本的第一行会与图像的底部对齐。

4. 在段落之中插入图像，图像将位于它所在段落文字之中。



```html
<html>
    <head>
        <title>在代码中插入图像的位置</title>
    </head>
    </head>
    <body>
        <img src="cat.jpg" alt="猫" title="猫猫摄影" 
            width="200" height="120"/>
        <p>可爱的猫咪</p>

        <p><img src="cat.jpg" alt="猫" title="猫猫摄影" 
            width="200" height="120"/>可爱的猫咪</p>

        <p>可爱的<img src="cat.jpg" alt="猫" title="猫猫摄影" 
            width="200" height="120"/>猫咪</p>
    </body>
</html>
```



![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126233932.png)



1. HTML 中有两种显示 HTML 元素的方式。

2. 块级元素总是另起一行显示，例如 `<h1>` `<p>` 等。所以上述第一种情况，`<p>` 元素的内容会在图像后的下一行开始。

3. 内联元素位于块级元素中，且不会另起一行显示，例如 `<b>` 、`<em>` 、`<img>` 等。

4. 如果 `<img>` 元素位于一个块级元素中，文本和其他内联元素会环绕在图像周围，例如上述第二种和第三种情况。



## 4. 创建图像的三条规则



1. 使用正确的格式保存图像，主要为 jpeg、gif 或 png。

2. 以正确的大小保存图像。保存图像时，其宽高需要与网页中展示的宽高保持一致，否则图像就会扭曲。

3. 以像素来衡量图像。屏幕内每英寸的像素数量在用户提高或降低分辨率时会发生变化。



## 5. 图形与图形说明



1. `<figure>` 元素用来包含图像以及对图像的说明。

2. `<figcaption>` 元素用来添加说明。



```html
<html>
    <head>
        <title>图形与图形说明测试</title>
    </head>
    </head>
    <body>
        <figure>
            <img src="cat.jpg" alt="猫" title="猫猫摄影" 
                width="200" height="120"/> <br/>
            <figcaption>可爱的猫咪</figcaption>
        </figure>

    </body>
</html>
```



![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/11/26/20221126235243.png)



## 6. 总结



1. `<img>` 元素用来向网页中添加图像。

2. `<img>` 元素必须指定 `src` 和 `alt` 属性，`src` 用来说明图像的地址，`alt` 属性用来描述图形的内容。

3. 应该根据图像在网页上显示的大小来保存图像。




