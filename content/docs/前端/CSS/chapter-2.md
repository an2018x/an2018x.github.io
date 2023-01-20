---
title: 2-CSS 颜色
description: 描述CSS中如何指定颜色以及颜色的分类
toc: true
authors: []
date: 2022-12-02T22:15:46+08:00
lastmod: 2022-12-02T22:15:46+08:00
draft: false
---

## 1. 前景色

1. `color` 属性允许指定元素中文本的颜色，可以在 CSS 中使用以下方法来指定任何颜色：

    * RGB 值：从组成一种元素需要多少红色、绿色、蓝色的角度来表示颜色。例如：rgb(100,100,100)。
    * 十六进制编码：通过十六进制编码来表示颜色，其中的六位编码（每两位构成一个值，共三个值）分别代表一种颜色中红、绿、蓝的数量，并在前面加一个 # 号，例如 #ee3e80。
    * 颜色名称：浏览器可以识别 147 种预定义的颜色名称。例如：blue。

2. 也可以使用 HSLA 来指定颜色。
3. CSS 中，可以使用 `/* */` 来添加注释。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>前景色</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <h1>你好</h1>
        <h2>我是 An</h2>
        <p>很高兴见到你</p>
    </body>
</html>
```

```css
/* 颜色名 */
h1 {
    color: red;
}
/* hex 编码 */
h2 {
    color: #006600;
}
/* rgb 值 */
p {
    color: rgb(0,0,250);
}
```


![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202221659.png)


## 2. 背景色

1. CSS 在处理每个 HTML 元素是都假设它们处于一个无形的盒子中，`background-color` 属性可以设置这个盒子的背景色。
2. 同样可以采用上述三种方式来指定颜色。
3. 如果未指定背景色，那么默认背景是透明的。


```html
<!DOCTYPE html>
<html>
    <head>
        <title>背景色</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <h1>你好</h1>
        <h2>我是 An</h2>
        <p>很高兴见到你</p>
    </body>
</html>
```

```css
body {
    color: white;
}

/* 颜色名 */
h1 {
    background-color: red;
}
/* hex 编码 */
h2 {
    background-color: #006600;
}
/* rgb 值 */
p {
    background-color: rgb(0,0,250);
}
```


![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202222025.png)


## 3. 颜色解析

1. 计算机屏幕上的每种颜色都由一定数量的红色、绿色、蓝色混合而成，可以使用拾色器来选取需要的颜色，参考 https://paletton.com/
2. RGB 值：用 0~255 之间的数字来表示红、绿、蓝三种颜色的值。
3. 十六进制编码：用十六进制码来表示红绿蓝三种颜色的值。
4. 颜色名称：用预定义名称来表示颜色，但是表示的颜色非常有限。
5. 色调：色调很接近通俗意义上的颜色，但是一个颜色往往由色调、饱和度和亮度三者组成。
6. 饱和度：指颜色中灰色的含量，饱和度最大时，灰色含量为0。
7. 亮度：指颜色中黑色的含量，亮度最大时，黑色含量为0。

## 4. 对比度

1. 为了使得文本清晰，在选取前景色和背景色时，一定要保证两者之间有足够的对比度。
2. 如果对比度较低，文本就不易阅读。
3. 但是对于长文本，过高的对比度也不利于阅读。


## 5. 透明度

1. CSS3 中的 `opacity` 属性允许指定透明度，它介于 0.0 和 1.0 之间。
2. rgba 允许像 RGB 值那样指定颜色，不过它增加了一个用来表示透明度的值，这个值介于 0.0 和 1.0 之间。

## 6. HSL 颜色

1. CSS3 中引入了 HSL 颜色，它通过色调、饱和度和明度来指定颜色。
2. 在 HSL 中使用一个色环来表示色调，色环上的一个角度对应一种色调，介于 0-360 之间。
3. 饱和度指一种颜色中灰色的含量，100% 代表最高饱和度。
4. 注意，明度和亮度不同。明度是指一个颜色中白色或者黑色的含量，0% 时为黑色，100% 时为白色，50% 时为标准色。

## 7. HSL 和 HSLA

1. HSLA 允许利用色调、饱和度、明度来指定颜色，并增加了一个表示透明度的值，像 RGBA 一样。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>HSL 和 HSLA</title>
        <link rel="stylesheet" href="hello.css" type="text/css" />
    </head>
    <body>
        <h1>你好</h1>
    </body>
</html>
```

```css
body {
    background-color: hsl(200, 80%, 50%);
}

/* 颜色名 */
h1 {
    background-color: hsla(100, 80%, 70%, 0.8);
}

```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202230848.png)

## 8. 总结

1. 在 CSS 中可以采用三种方式来指定颜色：RGB 值、十六进制编码和颜色名称。
2. 拾色器可以帮助找到想要的颜色。
3. 保证在文本和背景色之间存在足够的对比度十分重要。
4. CSS3 为指定的 RGB 颜色的不透明度而引入了一个额外的值 RGBA。
5. CSS3 还允许使用 HSL 值来指定颜色，增加一个透明度后，变为 HSLA。