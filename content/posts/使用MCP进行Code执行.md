---
title: "【Anthropic】使用 MCP 进行 Code 执行"
date: '2026-03-14'
draft: false
description:  
toc: true
---

# 1. 学习主题

## 我要学习的内容：

## 我为什么要学它：

## 我希望达到的程度：

- [ ] 了解基本概念

- [ ]  能向别人讲清楚

- [ ]  能用于面试回答

- [ ]  能写代码/做项目

- [ ]  能深入分析原理

# 2. 我当前的理解

在正式学习前，我认为它是什么：
为了节省上下文，可以不把工具的元数据披露给大模型，而是让代码去调用 MCP 工具。

我已经知道的相关知识：
我目前不清楚的问题：

# 3. 第一轮学习记录

资料来源：https://www.anthropic.com/engineering/code-execution-with-mcp

书籍 / 博客 / 视频 / 论文 / 官方文档

核心概念提炼：
1. MCP 带来的问题
    * 工具定义占用上下文窗口
    * 中间工具调用结果消耗额外的 token
    * ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/03/14/20260314190122200.png)
2. 使用代码调用来和 MCP 进行交互（文件树和文件内容）
    * 根据 mcp 服务生成文件树
    ```shell
    servers
    ├── google-drive
    │   ├── getDocument.ts
    │   ├── ... (other tools)
    │   └── index.ts
    ├── salesforce
    │   ├── updateRecord.ts
    │   ├── ... (other tools)
    │   └── index.ts
    └── ... (other servers)
    ```
    * 每个文件的内容
    ```ts
    // ./servers/google-drive/getDocument.ts
    import { callMCPTool } from "../../../client.js";

    interface GetDocumentInput {
        documentId: string;
    }

    interface GetDocumentResponse {
        content: string;
    }

    /* Read a document from Google Drive */
    export async function getDocument(input: GetDocumentInput): Promise<GetDocumentResponse> {
        return callMCPTool<GetDocumentResponse>('google_drive__get_document', input);
    }
    ```
3. 执行流程
    * 遍历文件系统：列出 ./servers/ 目录下的文件来得到所有可用的 server
    * 查看需要的工具文件来理解每个文件的接口
    * 这样模型只需要知道当前任务的定义
4. 使用 Code 执行 MCP 带来的优势
    * 模型擅长搜索文件系统，这样可以让模型能够按需加载工具定义
    * 可以定义一个 search_tools 工具来帮助模型查找相关的工具定义
    * Agent 可以通过代码过滤和转换代码返回的结果
    ```ts
    // Without code execution - all rows flow through context
    TOOL CALL: gdrive.getSheet(sheetId: 'abc123')
            → returns 10,000 rows in context to filter manually

    // With code execution - filter in the execution environment
    const allRows = await gdrive.getSheet({ sheetId: 'abc123' });
    const pendingOrders = allRows.filter(row => 
        row["Status"] === 'pending'
    );
    console.log(`Found ${pendingOrders.length} pending orders`);
    console.log(pendingOrders.slice(0, 5)); // Only log first 5 for review
    ```
    * 代码可以方便的处理循环、条件和异常处理
    ```ts
    let found = false;
    while (!found) {
        const messages = await slack.getChannelHistory({ channel: 'C123456' });
        found = messages.some(m => m.text.includes('deployment complete'));
        if (!found) await new Promise(r => setTimeout(r, 5000));
    }
    console.log('Deployment notification received');
    ```
    * 代码可以做更好的隐私控制
    ```ts
    const sheet = await gdrive.getSheet({ sheetId: 'abc123' });
    for (const row of sheet.rows) {
    await salesforce.updateRecord({
        objectType: 'Lead',
        recordId: row.salesforceId,
        data: { 
        Email: row.email,
        Phone: row.phone,
        Name: row.name
        }
    });
    }
    console.log(`Updated ${sheet.rows.length} leads`);
    ```
    * Code execution 可以让 agent 在操作间共享状态，agent 可以将结果输出到文件，从而在后续的流程中追踪
    ```ts
    const leads = await salesforce.query({ 
        query: 'SELECT Id, Email FROM Lead LIMIT 1000' 
    });
    const csvData = leads.map(l => `${l.Id},${l.Email}`).join('\n');
    await fs.writeFile('./workspace/leads.csv', csvData);

    // Later execution picks up where it left off
    const saved = await fs.readFile('./workspace/leads.csv', 'utf-8');
    ```
    * Agent 可以将自己的代码保存为可复用的函数
    ```ts
    // In ./skills/save-sheet-as-csv.ts
    import * as gdrive from './servers/google-drive';
    export async function saveSheetAsCsv(sheetId: string) {
    const data = await gdrive.getSheet({ sheetId });
    const csv = data.map(row => row.join(',')).join('\n');
    await fs.writeFile(`./workspace/sheet-${sheetId}.csv`, csv);
        return `./workspace/sheet-${sheetId}.csv`;
    }

    // Later, in any agent execution:
    import { saveSheetAsCsv } from './skills/save-sheet-as-csv';
    const csvPath = await saveSheetAsCsv('abc123');
    ```

关键术语：

术语 1：

术语 2：

术语 3：

# 4. 用“小白能听懂的话”解释

假设我要把这个知识讲给一个完全不懂的人听。

一句话解释它是什么：
mcp 解决了 Agent 工具调用的问题，但是会带来上下文膨胀，通过封装 mcp 为代码文件，能够实现工具的按需加载，减少上下文的长度。

它解决了什么问题：
（这个知识存在的原因是什么）

它是怎么工作的：
（按步骤写，像讲流程一样）

举一个最简单的例子：
（最好是生活化类比 + 技术例子）

如果让我口头讲 1 分钟，我会怎么讲：
（直接写成可说出口的话）

# 5. 找出“讲不清楚”的地方
我在哪些地方卡住了：
哪些概念我一解释就变模糊：
哪些地方只是“背会了”，但没有真正理解：

# 6. 回炉补缺

针对卡点，我重新查到的内容：

问题 1：

重新理解：

问题 2：

重新理解：

问题 3：

重新理解：

新的理解和原来有什么不同：
（写出修正点）

# 7. 压缩成自己的知识表达

最终版通俗解释：
（要求自己能不用资料直接讲清楚）

最终版技术解释：
（适合面试 / 写作 / 项目说明）

核心公式 / 关键流程 / 重点机制：

最容易被问到的问题：
1.
2.
3.
4.
5.

对应回答：

Q1：

Q2：

Q3：

Q4：

Q5：

# 8. 输出检验

我是否能做到以下几点：

 不看资料讲 3 分钟

 用大白话解释清楚

 解释它为什么出现

 解释它和相近概念的区别

 举出一个实际应用场景

 回答常见追问

 写出简单代码 / 例子 / 流程图

如果还不能，卡在哪：
# 9. 一页总结

主题：

一句话本质：

核心作用：

关键原理：
1.
2.
3.

常见误区：

面试中怎么说最合适：
（写成一段完整答题模板）