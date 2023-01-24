---
title: 9-视频和音频

description: HTML5 中如何添加视频和音频

toc: true

authors: []

date: 2022-12-03T17:16:46+08:00

lastmod: 2022-12-03T17:16:46+08:00

draft: false

---

## 1. 认识视频格式和播放器


### 1.1. 格式

1. 可以在线播放的视频格式有多种，例如 AVI、H264、MPEG、Ogg、WebM 等。
2. 为了使用户能够在线观看视频，需要对视频格式进行转换，这被称为视频编码。参考 www.mirogvideoconverter.com。

### 1.2. 播放器/插件

1. 2010 年前的浏览器只能支持显示文本和图像，要想播放视频必须安装播放器插件。
2. HTML5 出来后，可以使用 `<video>` 标签来播放视频。

### 1.3. 方法

1. 托管到 Bilibili 等视频网站。
2. 使用 HTML5 中的 `<video>` 元素。


## 2. 向网页中添加视频

1. 可以使用 `<video>` 元素向网页中添加视频。
2. `src` 属性可以指定视频的路径。
3. `poster` 属性用来指定播放前显示的封面图片。
4. `width` 和 `height` 属性用来指定播放器的大小。
5. `controls` 表示浏览器提供默认的播放组件。
6. `autoplay` 表示视频文件应该自动播放。
7. `loop` 表示在视频结束后重新播放。
8. `preload` 告诉浏览器在页面加载时需要做什么，可以选用下面三个值：
    * `none` 表示用户按下播放按钮前，浏览器不必加载视频。
    * `auto` 表示浏览器应该在用户在页面加载时载入视频。
    * `metadata` 表示浏览器只需要收集少量视频信息，例如大小、首帧时间、播放列表和持续时间等。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>向网页中添加视频测试</title>
    </head>
    <body>
        <video src="test.mp4" width="800" height="600" preload="none" controls></video>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202200528.png)


## 3. 多个视频源

1. 可以在 `<video>` 元素中使用多个 `<source>` 元素来指定多个视频源。
2. `src` 属性指定视频的路径。
3. `type` 属性告诉浏览器视频的格式。
4. `codecs` 指定用来对视频进行编码的编解码器，注意单双引号的用法。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>多个视频源</title>
    </head>
    <body>
        <video width="800" height="600" preload="none" controls>
            <source src="test.mp4" type='video/mp4;codecs="avcl.42E01E, mp4a.40.2"' />
        </video>
    </body>
</html>
```

## 4. 向网页中添加音频

1. 可以使用 `<audio>` 元素向网页中添加音频。
2. `src` 属性用来指定音频文件的路径。
3. `controls` 用来表明浏览器是否显示播放控件。
4. `autoplay` 表示音频是否应该自动播放。
5. `preload` 在没有设置 `autoplay` 时告诉浏览器应该做什么，这与第 2 节 video 元素一致。
6. `loop` 表示是否循环播放。

```html
<!DOCTYPE html>
<html>
    <head>
        <title>向网页中添加音频</title>
    </head>
    <body>
        <audio width="800" src="test.mp3" controls>
        </audio>
    </body>
</html>
```

![](https://animg.oss-cn-shanghai.aliyuncs.com/2022/12/02/20221202203133.png)

## 5. 多个音频源

和第 3 节一样，也可以通过 `source` 元素来指定多个音频源。

1. 使用 `src` 来表示音频的路径
2. 使用 `type` 来表示音频的格式