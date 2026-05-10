import MindElixir from 'mind-elixir'
import hljs from 'highlight.js/lib/core'
import katex from 'katex'

// 注意：有些语言的文件名和常用名不一样
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import bash from 'highlight.js/lib/languages/bash'
import java from 'highlight.js/lib/languages/java'
import html from 'highlight.js/lib/languages/xml'  // highlight.js 用 xml 来处理 html
import css from 'highlight.js/lib/languages/css'  


hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)  // js 是 javascript 的别名
hljs.registerLanguage('python', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('java', java)
hljs.registerLanguage('html', html)
hljs.registerLanguage('css', css)


function generateId() {
    return Math.random().toString(36).substr(2, 9)
}

// 将 topic 中的 markdown 语法转成 HTML
function formatTopic(text) {
    // 数学公式：$$...$$ 块级，$...$ 行内
    text = text.replace(/\$\$([^$]+)\$\$/g, (_, tex) => {
        try { return katex.renderToString(tex, { displayMode: true, throwOnError: false }) }
        catch { return _ }
    })
    text = text.replace(/\$([^$]+)\$/g, (_, tex) => {
        try { return katex.renderToString(tex, { displayMode: false, throwOnError: false }) }
        catch { return _ }
    })
    // 图片
    text = text.replace(
        /!\[([^\]]*)\]\(([^)]+),.+,.+\)/g,
        '<img src="$2" alt="$1" style="vertical-align:middle;border-radius:3px;margin-left:6px;" />'
    )
    // 行内代码
    return text.replace(/^`([^`]+)`/g, '<code>$1</code>')
}

function highlightCode(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
        console.log(`Highlighting code block with language: ${lang} ${code}`)
        return hljs.highlight(code, { language: lang }).value
    }
    return escapeHtml(code)
}

function parseMarkdownList(text) {
    const lines = text.split('\n')
    const root = { topic: '', children: [] }
    const stack = [{ node: root, indent: -1 }]
    console.log('Parsing markdown list:', lines)
    let i = 0
    while (i < lines.length) {
        const line = lines[i]

        // 跳过空行
        if (!line.trim()) { i++; continue }

        // 匹配列表项
        const match = line.match(/^(\s*)[*\-+]\s+(.*)/)
        if (!match) { i++; continue }

        const indent = match[1].length
        let topic = match[2].trim()

        // 往下看是否紧跟代码块
        let codeBlock = ''
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('```')) {
            i++ // 跳到 ``` 开始行
            const langMatch = lines[i].trim().match(/^```(\w*)/)
            const lang = langMatch ? langMatch[1] : ''
            i++ // 跳过开始行
            let codeLines = []
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i])
                i++
            }
            // 去掉公共缩进
            const nonEmptyLines = codeLines.filter(l => l.trim().length > 0)
            const minIndent = nonEmptyLines.reduce((min, l) => {
                const spaces = l.match(/^(\s*)/)[1].length
                return Math.min(min, spaces)
            }, Infinity)
            codeLines = codeLines.map(l => l.slice(minIndent))
            // i 现在指向结束的 ```，循环末尾 i++ 会跳过它
            codeBlock = codeLines.join('\n')
            console.log(`Found code block with language: ${lang} ${codeBlock}`)
            const highlighted = highlightCode(codeBlock, lang)
            topic += `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
        }
        let node = { topic: topic, dangerouslySetInnerHTML: topic , children: [] }

        if (codeBlock) {
            node = {
                topic: codeBlock,
                dangerouslySetInnerHTML: topic,
                children: [],
            }
        }

        // 解析图片标记：[img:/path/a.png,160,120]
        const imgMatch = topic.match(/\!\[\]\(\s*([^,\]]+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*$/i)
        if (imgMatch) {
            const url = imgMatch[1].trim();
            const width = Number(imgMatch[2]);
            const height = Number(imgMatch[3]);
            // topic = topic.replace(imgMatch[0], "").trim();
            node.topic = ""
            node.image = { url, width, height }; // Mind Elixir 的 image 字段 :contentReference[oaicite:1]{index=1}
        }

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop()
        }
        stack[stack.length - 1].node.children.push(node)
        stack.push({ node, indent })

        i++
    }

    if (root.children.length === 1) return root.children[0]
    root.topic = 'Root'
    return root
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function toMindElixirData(node) {
    return {
        topic: node.topic,
        id: generateId(),
        image: node.image ? {
            url: node.image.url,
            width: node.image.width,
            height: node.image.height
        } : undefined,
        dangerouslySetInnerHTML: formatTopic(node.dangerouslySetInnerHTML),
        children: (node.children || []).map(c => toMindElixirData(c))
    }
}

function refreshMindmaps() {
    document.querySelectorAll('.mindmap-container').forEach(container => {
        const id = container.id.replace('mindmap-', '')
        const el = document.getElementById('mindmap-data-' + id)
        const raw = el ? el.value : ''
        if (!raw) return
        console.log(raw)
        const tree = parseMarkdownList(raw)
        const data = { nodeData: toMindElixirData(tree) }

        const mind = new MindElixir({
            el: container,
            direction: 2,
            draggable: true,
            contextMenu: {
                focus: true,
                link: true,
                extend: [
                {
                    name: 'Copy Text',
                    onclick: () => {
                        const node = mind.currentNode?.nodeObj
                        navigator.clipboard.writeText(node.topic)
                        showToast('复制成功')
                    },
                },
                ],
            },
            toolBar: true,
            nodeMenu: true,
            keypress: true,
            overflowHidden: false,
        })
        mind.init(data)
    })
}

function initMindmaps() {
    setTimeout(() => refreshMindmaps(),500)
    setTimeout(() => refreshMindmaps(),1000)
}

document.addEventListener('DOMContentLoaded', ()=>{initMindmaps()})