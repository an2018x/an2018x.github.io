---
title: "个人用 SKILLS"
date: '2026-05-10'
draft: false
description:  
toc: true
tags:
  - Claude Code
---

# 绘图 SKILL

````md
# Paper-tone Diagram

学术克制 × 手工纸感 × 编辑设计。回避现代 SaaS 风(饱和蓝、纯白底、阴影泛滥、圆角滥用),把"信息"当作"印刷品"来呈现。适用流程图 / 架构图 / pipeline 示意图,中文友好,可输出 HTML、Excalidraw、SVG。

气质关键词:**安静、考究、可读、不喧哗**。

---

## 1 · Color Tokens(固定不可改)

```
--ivory:  #FAF9F5   主背景(代替纯白)
--paper:  #FFFFFF   卡片背景
--slate:  #141413   主文字(几乎黑但偏暖)
--clay:   #D97757   唯一强调色 — 关键路径 / 序号 / 斜体
--clay-d: #B85C3E   强调暗色,备用
--oat:    #E3DACC   暖灰 — hover / 下划线
--olive:  #788C5D   第二色,用量 ≈ clay 的 1/5
--g100:   #F0EEE6   最浅灰 — 徽章背景
--g200:   #E6E3DA   边框 / 分隔
--g300:   #D1CFC5   标准描边
--g500:   #87867F   次要文字、Mono 标签
--g700:   #3D3D3A   正文次级
```

调色法则:**没有冷灰**(所有灰带土黄底);全页只有 clay 一种亮色,占比 < 20%;不用纯黑纯白;olive 仅作分类区分,用量约 clay 的 1/5。

---

## 2 · Typography(固定)

```
--serif: ui-serif, Georgia, "Times New Roman", Times, serif;
--sans:  system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--mono:  ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
```

| 用途 | 字体 | 字号 | 字重 | 字距 |
|---|---|---|---|---|
| H1 | serif | clamp(38, 5.4vw, 62)px | **500** | -0.018em |
| H2 章节 | serif | 27px | 500 | -0.012em |
| 卡片标题 | serif | 19px | 500 | -0.008em |
| 正文 lede | sans | 16.5px | 400 | — |
| 卡片描述 | sans | 13.5px | 400 | — |
| Mono 标签 | mono | 10–13px | 400/600 | 0.08–0.12em |

铁律:serif 标题字重统一 **500**(不要 600/700);H1 用负字距 -0.018em + `max-width:17ch`;斜体词用 `<em>` + clay 色,是页面唯一的"装饰修辞"。

---

## 3 · Layout

```
.wrap { max-width:1120px; margin:0 auto; padding:0 32px 140px; }
```

- 章节间距 **72px**;header 顶部 80px / 底部 56px;footer 顶部 100px
- **50px 悬挂缩进** — 章节标题不缩,介绍与卡片网格 `margin-left:50px`
- 卡片网格 `grid-template-columns: repeat(auto-fill, minmax(316px, 1fr)); gap:20px`

---

## 4 · Borders / Radius / Motion

- 描边 **1.5px**(HTML) / **1px**(Excalidraw,无 1.5 选项)
- 圆角:5px(SVG 内)、6px(tag)、10–14px(卡片)、999px(胶囊)
- 动效时长 **120–150ms**(纸面回弹感)
- 只用 transform + 颜色 + 阴影,**不缩放、不旋转、不淡入**
- 默认 ease,不用 cubic-bezier

---

## 5 · 通用结构 — Vertical Pipeline 流程图

每张图按这个骨架组织:

1. **masthead** — eyebrow(▬ + Mono 大写)+ H1(serif 500,带 `<em>` 斜体)+ lede(sans 16.5)+ meta strip(Mono 横条罗列关键技术栈)
2. **section header** — 序号(Mono / clay / 34px 宽)+ 标题(serif 27)+ count(灰胶囊)
3. **节点垂直流** — 每节点 = mono tag + serif title + sans sub
4. **节点间 vertical arrow** — strokeWidth=1, color=g500, 长度 ~42px
5. **右侧 mono 注释** — 前置 24×1.5px clay 短横线 + Mono 11px 灰字
6. **大型节点用 panel** — slate border,内嵌 4 列子模块网格,关键子模块用 clay border;子模块再下沉到深层硬件栈(深色块用 slate 背景 + ivory 文字)
7. **底部 legend** — 色彩与符号说明
8. **footer** — 衬线斜体格言 + 仓库链接

节点状态 mapping:
- `entry` — bg=g100, border=slate
- 普通 service — bg=transparent, border=slate
- `accent`(关键路径) — border=clay
- `exit` — bg=oat, border=clay
- `dark`(硬件层) — bg=slate, 文字=ivory, 副=oat

---

## 6 · Variant A — HTML 单文件

CSS 起手必备:

```css
:root{
  --ivory:#FAF9F5; --paper:#FFFFFF; --slate:#141413;
  --clay:#D97757; --clay-d:#B85C3E; --oat:#E3DACC; --olive:#788C5D;
  --g100:#F0EEE6; --g200:#E6E3DA; --g300:#D1CFC5;
  --g500:#87867F; --g700:#3D3D3A;
  --serif: ui-serif, Georgia, serif;
  --sans:  system-ui, -apple-system, sans-serif;
  --mono:  ui-monospace, "SF Mono", Menlo, monospace;
}
body{ background:var(--ivory); color:var(--slate);
      font-family:var(--sans); line-height:1.55; }
.wrap{ max-width:1120px; margin:0 auto; padding:0 32px 140px; }

.eyebrow{ font-family:var(--mono); font-size:12px;
          letter-spacing:.12em; text-transform:uppercase;
          color:var(--g500); }
.eyebrow::before{ content:""; display:inline-block;
          width:24px; height:1.5px; background:var(--clay);
          margin-right:12px; vertical-align:middle; }

h1{ font-family:var(--serif); font-weight:500;
    font-size:clamp(38px, 5.4vw, 62px);
    letter-spacing:-0.018em; line-height:1.06; max-width:17ch; }
h1 em{ font-style:italic; color:var(--clay); }
```

节点卡片:

```css
.node{ background:var(--paper); border:1.5px solid var(--g300);
       border-radius:14px; padding:18px 22px;
       transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease; }
.node:hover{ transform:translateY(-3px);
       box-shadow:0 10px 30px rgba(20,20,19,.10);
       border-color:var(--slate); }
.node.accent{ border-color:var(--clay); }
.node.entry { background:var(--g100); }
.node.exit  { background:var(--oat); border-color:var(--clay); }

.annot{ font-family:var(--mono); font-size:11.5px; color:var(--g500);
        display:flex; align-items:center; }
.annot::before{ content:""; width:32px; height:1.5px;
        background:var(--clay); margin-right:12px; }
```

垂直箭头(SVG):

```html
<svg width="14" height="46" viewBox="0 0 14 46">
  <line x1="7" y1="2" x2="7" y2="34" stroke="#87867F" stroke-width="2.5" stroke-linecap="round"/>
  <polyline points="2,32 7,42 12,32" fill="none"
            stroke="#87867F" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

## 7 · Variant B — Excalidraw (.excalidraw)

JSON 文件骨架:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [...],
  "appState": { "gridSize": null, "viewBackgroundColor": "#FAF9F5" },
  "files": {}
}
```

每个 element 必备字段:`id, type, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, groupIds, frameId, roundness, seed, version, versionNonce, isDeleted, boundElements, updatedAt, link, locked`

铁律:
- **`roughness: 0`** 全画布禁用手绘抖动(学术风核心)
- `strokeWidth: 1`(Excalidraw 没有 1.5)
- 圆角矩形:`"roundness": {"type": 3}`
- `fillStyle: "solid"`(不用 hachure 斜线填充)
- 字体: 统一使用 Comic Shanns 字体，font-family: 8

推荐用 Python 脚本生成,因为 JSON 重复字段多。最小工厂:

```python
import json, time, random
random.seed(42)
elements = []

def base():
    return {
        "id": f"id-{random.randint(10**8, 10**12)}",
        "angle": 0, "strokeColor": "#141413", "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "solid",
        "roughness": 0, "opacity": 100, "groupIds": [], "frameId": None,
        "roundness": None, "seed": random.randint(1, 10**9),
        "version": 1, "versionNonce": random.randint(1, 10**9),
        "isDeleted": False, "boundElements": None,
        "updatedAt": int(time.time() * 1000), "link": None, "locked": False,
    }

def rect(x, y, w, h, *, stroke="#141413", bg="transparent", sw=1, rounded=True):
    el = base(); el.update({"type":"rectangle", "x":x, "y":y, "width":w, "height":h,
        "strokeColor":stroke, "backgroundColor":bg, "strokeWidth":sw,
        "roundness": {"type":3} if rounded else None})
    elements.append(el); return el

def text(x, y, content, *, size=14, font=2, color="#141413", w=None, align="left"):
    if w is None:
        cn = sum(1 for c in content if ord(c) > 127)
        w = int(cn*size + (len(content)-cn)*size*0.55) + 6
    el = base(); el.update({"type":"text", "x":x, "y":y,
        "width":w, "height":int(size*1.25),
        "text":content, "fontSize":size, "fontFamily":font,
        "textAlign":align, "verticalAlign":"top",
        "containerId":None, "originalText":content,
        "lineHeight":1.25, "baseline":int(size*0.9), "strokeColor":color})
    elements.append(el); return el

def arrow(x1, y1, x2, y2, *, color="#87867F", sw=1):
    dx, dy = x2-x1, y2-y1
    el = base(); el.update({"type":"arrow", "x":x1, "y":y1,
        "width":max(abs(dx),1), "height":max(abs(dy),1),
        "points":[[0,0],[dx,dy]], "lastCommittedPoint":None,
        "startBinding":None, "endBinding":None,
        "startArrowhead":None, "endArrowhead":"arrow",
        "strokeColor":color, "strokeWidth":sw})
    elements.append(el); return el

def line(x1, y1, x2, y2, *, color="#87867F", sw=1, dashed=False):
    dx, dy = x2-x1, y2-y1
    el = base(); el.update({"type":"line", "x":x1, "y":y1,
        "width":max(abs(dx),1), "height":max(abs(dy),1),
        "points":[[0,0],[dx,dy]], "lastCommittedPoint":None,
        "startBinding":None, "endBinding":None,
        "startArrowhead":None, "endArrowhead":None,
        "strokeColor":color, "strokeWidth":sw,
        "strokeStyle": "dashed" if dashed else "solid"})
    elements.append(el); return el

# ... 调用 rect/text/arrow 组装画布,最后:
data = {"type":"excalidraw", "version":2, "source":"https://excalidraw.com",
        "elements":elements,
        "appState":{"gridSize":None, "viewBackgroundColor":"#FAF9F5"},
        "files":{}}
json.dump(data, open("out.excalidraw","w"), ensure_ascii=False, indent=2)
```

布局参考(垂直流程图):

- 主轴中心 X = 700,卡片宽 380,普通节点高 78
- 节点之间 arrow 长度 42
- 大面板宽 540~560,内嵌 4 列子模块(每个 ~120 宽,gap 12)
- 大面板的"04 · ENGINE"标签:在 border 上浮一个 IVORY 背景的小矩形 + clay Mono 文字
- 右侧详细注释面板 X = 主面板右边缘 + 60,宽 320
- 注释条目格式:Mono clay 小标题(`§ NN · 主题`)+ sans g700 多行正文

---

## 8 · Variant C — SVG 缩略图

放在卡片缩略图区(.thumb,132px 高,灰底)。

约定:
- `stroke-width: 2.5`
- `stroke-linecap: round`
- 圆角 `rx="4"` 或 `5`
- 一张图只用 3–5 个色阶,clay 占比 < 20%
- 几何元素:`<rect>`、`<circle>`、`<line>`,**不画曲线**

class 命名:
- `.st` 描边 (g500) / `.fl` 填充 (g300) / `.cl` clay 填充 / `.ol` olive 填充
- `.oa` oat 填充 + g500 描边 / `.sl` slate 填充 / `.wh` 白填充 + g500 描边
- `.ln` 灰线 / `.lc` clay 线 / `.da` 虚线 (dasharray 4 4)

---

## 9 · 输出前自检 Checklist

每张图都必须满足:

1. ☐ 背景 `#FAF9F5` 米白,**不用纯白**
2. ☐ 强调色只有 `#D97757` 粘土橙,占比 < 20%,无第二亮色
3. ☐ 大标题用 serif(Excalidraw 例外:Helvetica 大字号 字重 500)
4. ☐ Mono 标签全部大写 + 宽字距(eyebrow / 序号 / 文件名 / 注释)
5. ☐ 章节缩进 50px(标题不缩,正文与卡片缩)
6. ☐ 描边 1.5px(HTML)/ 1px(Excalidraw),圆角 10–14px
7. ☐ 没有阴影泛滥(只在 hover 时柔和阴影)
8. ☐ 没有冷灰(灰一律带土黄底)
9. ☐ Hover 只动 150ms(translateY(-3px) + 颜色 + 阴影)
10. ☐ 大量留白(下边距 ≥ 100px,章节间距 72px)
11. ☐ Excalidraw 必须 `roughness: 0`
12. ☐ 大量中文标注时,字号略放大,行高 ≥ 1.5,留白略多

---

## 10 · 命名与产物建议

- HTML:`{topic}-pipeline.html` / `{topic}-architecture.html`
- Excalidraw:`{topic}.excalidraw`(中文文件名也支持)
- 生成脚本:`gen_{topic}.py`,参数化坐标 / 文字 / 配色,便于反复调整

> 这套设计的精神:把"信息"当作"印刷品",而不是"界面"。少即是多,但少不是空 — 是经过裁剪的丰富。
````