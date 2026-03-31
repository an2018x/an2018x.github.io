---
title: "CSS 复习"
date: '2026-03-30'
draft: false
description:  
toc: true
---

# 基础核心


{{<mind>}}
- 基础核心
    - CSS 基础与选择器
        - CSS 的三种引入方式
            - 
            ```html
            <!-- 1. 行内样式：直接写在标签上，优先级最高但不推荐大量使用 -->
            <p style="color: red; font-size: 16px;">这是行内样式</p>

            <!-- 2. 内嵌样式：写在 <head> 的 <style> 标签里 -->
            <head>
            <style>
                p { color: blue; }
            </style>
            </head>

            <!-- 3. 外链样式（推荐！）：单独的 .css 文件 -->
            <link rel="stylesheet" href="style.css">
            ```
        - 基础选择器
            - 
            ```css
            /* 元素选择器 —— 选中所有该标签 */
            p { color: #333; }
            h1 { font-size: 24px; }

            /* 类选择器 —— 最常用，可复用 */
            .card { background: #fff; padding: 16px; }
            .highlight { color: orange; }

            /* ID 选择器 —— 唯一的，一个页面同一个 ID 只用一次 */
            #header { height: 60px; }

            /* 通配符选择器 —— 选中所有元素，常用于重置 */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;  /* 第 3 天会详细讲 */
            }
            ```
{{</mind>}}

# 布局体系

# 响应式与进阶

# 工程化与实战