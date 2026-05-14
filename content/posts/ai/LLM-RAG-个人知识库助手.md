---
title: "LLM-RAG-个人知识库助手"
date: '2026-02-23'
draft: false
description:  
toc: true
tags:
  - LLM
  - RAG
  - 实验
---

# 实验元数据 (Meta Data)


实验编号/标题：LLM-RAG-个人知识库助手

日期：2026-02-23

所属领域/标签：例如：#RAG #LLM


# 🎯 实验前：假设与目标 (Plan)

实验目标 (Objective)：通过构建一个基于你自己文档的问答助手，掌握 RAG（检索增强生成）全流程、向量数据库、Embedding、Chunk 策略、对话记忆系统等 Agent 开发的关键技术。

构建一个知识库问答助手，支持：

1. 文档导入 — 加载 TXT、Markdown、PDF 文件到知识库
2. 智能分块 — 将长文档切分为语义完整的片段
3. 向量索引 — 将文档片段转为 Embedding 并存入向量数据库
4. 语义检索 — 根据用户问题找到最相关的文档片段
5. 增强回答 — 将检索到的内容作为上下文，让 LLM 生成精准回答
6. 对话记忆 — 记住之前的对话，支持追问和上下文引用


# 🧪 实验中：执行步骤与变量 (Do)

## 环境准备

```bash
# 安装依赖
pip install anthropic chromadb sentence-transformers rich typer python-dotenv

# 可选：PDF 支持
pip install pymupdf  # 或 pypdf
```

* chromadb — 轻量级向量数据库，本地运行，适合学习和原型开发
* sentence-transformers — Embedding 模型库，本地运行，免费
* pymupdf — PDF 文本提取

## 项目结构

```
rag-assistant/
├── .env
├── src/
│   ├── __init__.py
│   ├── loader.py           # 文档加载器
│   ├── chunker.py          # 文档分块器
│   ├── embedder.py         # Embedding 封装
│   ├── vectorstore.py      # 向量数据库操作
│   ├── retriever.py        # 检索器（核心）
│   ├── memory.py           # 对话记忆管理
│   ├── rag_chain.py        # RAG 链：检索 + 生成
│   └── cli.py              # 命令行入口
├── data/                   # 存放你的文档
│   ├── sample_notes.md
│   └── sample_docs/
├── chroma_db/              # 向量数据库持久化目录
├── tests/
│   ├── test_chunker.py
│   ├── test_retriever.py
│   └── test_rag_chain.py
└── examples/
    ├── basic_qa.py
    └── evaluate_retrieval.py
```



## 执行步骤

### 文档加载器

```python
# src/loader.py
import os
from dataclasses import dataclass

@dataclass
class Document:
    """文档数据结构

    为什么用 dataclass 而不是 dict
    1. 类型安全
    2. 不可变性-防止意外修改
    3. 字段定义清晰
    """
    content: str # 文档的纯文本内容
    metadata: dict # 元数据：来源、页码、标题等
    doc_id: str # 唯一标识

    def __repr__(self) -> str:
        return f"Document(id={self.doc_id}, source={self.metadata.get('source', '?')}, len={len(self.content)})"

class DocumentLoader:
    """文档加载器 - 支持多种文件格式

    职责：将各种格式的文件统一转换为 Document 对象。
    RAG 流程的第一步
    """

    def load_file(self, file_path: str) -> Document:
        """加载单个文件"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        filename = os.path.basename(file_path)

        if ext in (".txt", ".md"):
            content = self._load_text(file_path)
        elif ext == ".pdf":
            content = self._laod_pdf(file_path)
        else:
            raise ValueError(f"不支持的文件格式: {ext}。支持: .txt, .md, .pdf")

        return Document(content=content,
            metadata={
                "source": filename,
                "file_path": file_path,
                "file_type": ext,
                "char_count": len(content),
            }, doc_id=filename)

    def load_directory(self, dir_path: str) -> list[Document]:
        """加载目录下所支持的文件"""
        documents = []
        supported = (".txt", ".md", ".pdf")

        for filename in sorted(os.listdir(dir_path)):
            if any(filename.endswith(ext) for ext in supported):
                file_path = os.path.join(dir_path, filename)
                try:
                    doc = self.load_file(file_path)
                    documents.append(doc)
                    print(f"  ✅ 已加载: {filename} ({len(doc.content)} 字符)")
                except Exception as e:
                    print(f"  ❌ 加载失败: {filename} — {e}")

        print(f"\n共加载 {len(documents)} 个文档")
        return documents

    def _load_text(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def _load_pdf(self, file_path: str) -> str:
        """加载 PDF (使用 pymupdf)"""
        try:
            import fitz
        except ImportError:
            raise ImportError("需要安装 pymupdf: pip install pymupdf")

        doc = fitz.open(file_path)
        pages = []
        for page_num, page in enumerate(doc, 1):
            text = page.get_text()
            if text.strip():
                pages.append(f"[第{page_num}页]\n{text}")
        doc.close()
        return "\n\n".join(pages)
```

### 文档分块器

```python
# src/chunker.py
from dataclasses import dataclass

@dataclass
class Chunk:
    """文档片段"""
    content: str # 片段内容
    metadata: dict # 继承自原文档 + 新增片段级元数据
    chunk_id: str # 唯一标识：doc_id + chunk_index

    def __repr__(self) -> str:
        return f"Chunk(id={self.chunk_id}, content={self.content}, metadata={self.metadata})"

class DocumentChunker:
    """文档分块器

    分块策略对 RAG 效果影响大

    * 块太大：包含太多无关信息，检索精度下降
    * 块太小：丢失上下文语义完整性，回答碎片化
    * 没有重叠：信息在块边界被切断，可能遗漏关键内容
    * 重叠太多：存储浪费，检索到重复内容，token 浪费

    推荐起步参数：chunk_size=500, overlap=100
    根据实际效果调整
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100,
                 min_chunk_size: int = 50,
                 ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    # ===============================
    # 策略 1：固定大小分块
    #================================
    def chunk_by_size(self, doc) -> list[Chunk]:
        """按固定字符数分块 + 滑动窗口重叠

        这是最简单的分块方法，适合快速原型

        chunk_size = 500, overlap = 100
        文档：|---------500--------|
                        |--------500-------|
                      100 字重叠
        """
        text = doc.content
        chunks = []
        start = 0
        chunk_index = 0

        while start < len(text):
            end = start + self.chunk_size

            # 尝试在句子边界切分
            if end < len(text):
                # 从 end 位置向前找最近的句号/换行
                boundary = self._find_boundary(text, end)
                if boundary > start + self.min_chunk_size:
                    end = boundary

            chunk_text = text[start:end].strip()

            if len(chunk_text) >= self.min_chunk_size:
                chunks.append(Chunk(
                    content=chunk_text,
                    metadata={
                        **doc.metadata,
                        "chunk_index": chunk_index,
                        "start_char": start,
                        "end_chart": end,
                    },
                    chunk_id=f"{doc.doc_id}::chunk_{chunk_index}",
                ))
                chunk_index += 1

            # 下一个块的起始位置 = 当前结束位置 - 重叠长度
            start = end - self.chunk_overlap

        return chunks

    # ================================================
    # 策略 2：按段落/标题分块（适合 Markdown 和结构化文档）
    # ================================================
    def chunk_by_section(self, doc) -> list[Chunk]:
        """按 Markdown 标题分块

        对于有结构的文档（如笔记、技术文档），按标题分块
        能保证语义完整性，效果通常由于固定大小分块

        # 标题 1 -> 独立 chunk
        ## 标题 1.1 -> 独立 chunk
        """
        lines = doc.content.split("\n")
        chunks = []
        current_section = []
        current_heading = ""
        chunk_index = 0

        for line in lines:
            # 检测标题行
            if line.strip().startswith("#"):
                # 保存前一个 section
                if current_section:
                    section_text = "\n".join(current_section).strip()
                    if len(section_text) >= self.min_chunk_size:
                        chunks.append(Chunk(
                            content=section_text,
                            metadata={
                                **doc.metadata,
                                "chunk_index": chunk_index,
                                "heading": current_heading,
                            },
                            chunk_id=f"{doc.doc_id}::section_{chunk_index}",
                        ))
                        chunk_index += 1

                    # 开始新 section
                    current_heading = line.strip().lstrip("#").strip()
                    current_section = [line]
                else:
                    current_section.append(line)

            # 最后一个 section
            if current_section:
                section_text = "\n".join(current_section).strip()
                if len(section_text) >= self.min_chunk_size:
                    chunks.append(Chunk(
                        content=section_text,
                        metadata={
                            **doc.metadata,
                            "chunk_index": chunk_index,
                            "heading": current_heading,
                        },
                        chunk_id=f"{doc.doc_id}::section_{chunk_index}",
                    ))

            # 如果某个 section 超过 chunk_size，再做二次分块
            final_chunks = []
            for chunk in chunks:
                if len(chunk.content) > self.chunk_size * 2:
                    # 对过长的 section 做固定大小分块
                    sub_doc = type(doc)(
                        content=chunk.content,
                        metadata=chunk.metadata,
                        doc_id=chunk.chunk_id,
                    )
                    final_chunks.extend(self.chunk_by_size(sub_doc))
                else:
                    final_chunks.append(chunk)
            return final_chunks

    # =====================================================
    # 策略 3：递归字符分块（LangChain 默认策略）
    # =====================================================
    def chunk_recursive(self, doc) -> list[Chunk]:
        """ 递归分块 - 按层级分隔符依次尝试

        分隔符优先级：段落 > 句子 > 词
        先尝试按段落分，如果段落太长再按句子分，依次类推
        这是 LangChain RecursiveCharacterTextSplitter 的核心思想
        """
        separators = ["\n\n", "\n", "。", ".", "！", "!", "？", "?", " "]
        return self._recursive_split(
            text=doc.content,
            separators=separators,
            doc=doc,
        )

    def _recursive_split(self, text: str, separators: list[str], doc, chunk_index: int = 0) -> list[Chunk]:
        """递归分割的核心逻辑"""
        chunks = []

        if len(text) <= self.chunk_size:
            if len(text) >= self.min_chunk_size:
                chunks.append(Chunk(
                    content=text.strip(),
                    metadata={**doc.metadata, "chunk_index": chunk_index},
                    chunk_id=f"{doc.doc_id}::recursive_{chunk_index}",
                ))
            return chunks

        # 找到第一个能有效分割的分隔符
        sep = separators[0] if separators else ""
        parts = text.split(sep) if sep else list(text)

        current_chunk = ""
        for part in parts:
            candidate = current_chunk + sep + part if current_chunk else part

            if len(candidate) > self.chunk_size:
                # 当前块已满
                if current_chunk:
                    if len(current_chunk) > self.min_chunk_size:
                        chunks.append(Chunk(
                            content=current_chunk.strip(),
                            metadata={**doc.metadata, "chunk_index": chunk_index},
                            chunk_id=f"{doc.doc_id}::recursive_{chunk_index}",
                        ))
                        chunk_index += 1

                # 如果单个 part 就超长，用下一级分隔符继续分
                if len(part) > self.chunk_size and len(separators) > 1:
                    sub_chunks = self._recursive_split(
                        part, separators[1:], doc, chunk_index
                    )
                    chunks.extend(sub_chunks)
                    chunk_index += len(sub_chunks)
                    current_chunk = ""
                else:
                    current_chunk = part
            else:
                current_chunk = candidate

        if current_chunk and len(current_chunk) > self.min_chunk_size:
            chunks.append(Chunk(
                content=current_chunk.strip(),
                metadata={**doc.metadata, "chunk_index": chunk_index},
                chunk_id=f"{doc.doc_id}::recursive_{chunk_index}",
            ))
        return chunks

    # ================================================================
    # 辅助方法
    # ================================================================
    def _find_boundary(self, text: str, position: int, window: int = 100) -> int:
        """在 position 附近找到最近的句子边界"""
        search_start = max(position - window, 0)
        search_text = text[search_start:position + window]

        # 按优先级查找分隔符
        for sep in ["\n\n", "\n", "。", ".", "！", "!", "？", "?"]:
            idx = search_text.rfind(sep, 0, position - search_start + 1)
            if idx != -1:
                return search_start + idx + len(sep)

        return position  # 没找到合适的边界，在原位置切分
```

### Embedding 封装

```python
# src/embedder.py
from sentence_transformers import SentenceTransformer


class Embedder:
    """Embedding 模型封装

    Embedding 模型的选择直接影响检索质量
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        print(f"正在加载 Embedding 模型: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"  ✅ 模型已加载 (维度: {self.dimension})")

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """将文本列表转换为向量"""

        embeddings = self.model.encode(
            texts,
            show_progress_bar=len(texts) > 10,
            normalize_embeddings=True, # L2 归一化，使得余弦相似度等于点积
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:
        """将单个查询转换为向量

        为什么查询和文档的 embedding 要分开？
        某些高级模型对查询会加特殊前缀
        来区分查询和文档的 embedding 空间
        """
        print(query)
        return self.model.encode(
            query, normalize_embeddings=True
        ).tolist()
```

### 向量数据库操作

```python
# src/vectorstore.py
import chromadb

from src.chunker import Chunk
from src.embedder import Embedder


class VectorStore:
    """向量数据库封装

    ChromaDB 的优势：
    - 纯 Python
    - 支持持久化存储
    - 支持 metadata 过滤
    """

    def __init__(self,
                 embedder: Embedder,
                 collection_name: str = "knowledge_base",
                 persist_dir: str = "./chroma_db"
                 ):
        self.embedder = embedder

        self.client = chromadb.PersistentClient(path=persist_dir)

        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name = collection_name,
            metadata = {"hnsw:space": "cosine"}, # 使用余弦相似度
        )

        print(f"  📦 向量数据库: {persist_dir}")
        print(f"  📂 集合: {collection_name} (已有 {self.collection.count()} 条记录)")

    def add_chunks(self, chunks: list[Chunk]) -> None:
        """将文档片段添加到向量数据库

        流程：
        1. 提取所有片段的文本
        2. 批量生成 embedding
        3. 连同原始文本和元数据一起存入数据库
        """
        if not chunks:
            return

        texts = [chunk.content for chunk in chunks]
        ids = [chunk.chunk_id for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]

        # 批量生成 Embedding
        print(f"  🔢 正在生成 {len(texts)} 个 Embedding...")
        embeddings = self.embedder.embed_texts(texts)

        # 存入 ChromaDB
        # ChromaDB 会自动去重
        self.collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        print(f"  ✅ 已存入 {len(texts)} 个片段 (总计: {self.collection.count()})")

    def search(self, query: str, top_k: int = 5, filter_metadata: dict | None = None) -> list[dict]:
        """语义搜索 - 根据查询找到相关的文档片段

        Args:
            query: 用户查询
            top_k: 返回前 K 个最相关的片段
            filter_metadata: 元数据过滤条件
        """
        # 将查询转为向量
        query_embedding = self.embedder.embed_query(query)

        # 在向量数据库中搜索
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_metadata,
            include=["documents", "metadatas", "distances"],
        )

        # 整理结果
        search_results = []
        for i in range(len(results["ids"][0])):
            # ChromaDB 返回的是距离，转换为分数（越大越相似）
            distance = results["distances"][0][i]
            score = 1 - distance

            search_results.append({
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": round(score, 4),
                "chunk_id": results["ids"][0][i],
            })

        return search_results

    def delete_collection(self) -> None:
        """删除集合（重建索引时使用）"""
        self.client.delete_collection(self.collection.name)
        print("集合已删除")

    def get_stats(self) -> dict:
        """获取数据库统计信息"""
        return {
            "total_chunks": self.collection.count(),
            "collection_name": self.collection.name,
        }
```

### 检索器

```python
# src/retriever.py
from src.vectorstore import VectorStore


class Retriever:
    """检索器 - 从向量数据中找到与查询最相关的文档片段

    这个类封装了检索策略，包括：
    1. 基础语义检索
    2. 带分数阈值的过滤
    3. 结果去重
    4. 上下文窗口扩展
    """

    def __init__(self, vector_store: VectorStore, top_k: int = 5, score_threshold: float = 0.1,):
        self.vector_store = vector_store
        self.top_k = top_k
        self.score_threshold = score_threshold # 低于此分数的结果会被过滤

    def retrieve(self, query: str, top_k: int | None = None, filter_source: str | None = None) -> list[dict]:
        """执行检索

        Args:
            query: 用户查询
            top_k: 覆盖默认的 top_k
            filter_source: 只检索指定来源文件的内容
        """
        k = top_k or self.top_k

        # 构建元数据过滤条件
        filter_metadata = None
        if filter_source:
            filter_metadata = {"source": filter_source}

        # 执行搜索
        results = self.vector_store.search(
            query=query,
            top_k=k,
            filter_metadata=filter_metadata
        )

        # 过滤低分结果
        filtered = [r for r in results if r["score"] >= self.score_threshold]

        if not filtered:
            print(f"  ⚠️ 未找到相关性 >= {self.score_threshold} 的结果")

        return filtered

    def format_context(self, results: list[dict]) -> str:
        """将检索结果格式化为 LLM 可消费的上下文字符串

        这个格式很重要：
        - 每个片段标注来源和相似度，帮助 LLM 判断可信度
        - 添加分隔符，帮助 LLM 区分不同片段
        - 按相关度排序，最相关的排在前面
        """

        if not results:
            return "未找到相关的知识库内容。"

        context_parts = []
        for i, result in enumerate(results, 1):
            source = result["metadata"].get("source", "未知来源")
            heading = result["metadata"].get("heading", "")
            score = result["score"]

            header = f"[片段 {i}] 来源: {source}"
            if heading:
                header += f" | 章节：{heading}"
            header += f" | 相关度:{score:.2f}"

            context_parts.append(f"{header}\n{result['content']}")

        return "\n\n---\n\n".join(context_parts)
```

### 对话记忆管理

```python
# src/memory.py
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Message:
    role: str
    content: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class ConversationMemory:
    """对话记忆管理器

    Agent 的记忆系统通常分为三层

    短期记忆（Short-term Memory）
    = 当前对话的消息历史
    实现：列表/数组，随对话增长
    生命周期：当前会话

    工作记忆（Working Memory）
    = 当前任务的关键上下文摘要
    实现：LLM 摘要 or 关键信息提取
    生命周期：当前任务

    长期记忆（Long-term Memory）
    = 跨会话的知识和偏好
    实现：向量数据库 or 知识图谱
    生命周期：持久化

    本项目实现：短期记忆 + 简单的工作记忆
    """
    def __init__(self, max_messages: int = 20, max_tokens_estimate: int = 4000):
        self.messages: list[Message] = []
        self.max_messages = max_messages
        self.max_tokens_estimate = max_tokens_estimate
        self.summary: str = "" # 工作记忆：早期对话的摘要

    def add_user_message(self, content: str) -> None:
        self.messages.append(Message(role="user", content=content))
        self._trim_if_needed()

    def add_assistant_message(self, content: str) -> None:
        self.messages.append(Message(role="assistant", content=content))
        self._trim_if_needed()

    def get_messages(self) -> list[dict]:
        """获取 Anthropic API 格式的消息列表

        如果有历史摘要，将其作为第一条系统信息注入
        """
        api_messages = []

        # 如果有早期对话摘要，作为上下文注入
        if self.summary:
            api_messages.append({
                "role": "user",
                "content": f"[以下是之前对话的摘要]\n{self.summary}"
            })
            api_messages.append({
                "role": "assistant",
                "content": "好的，我已经了解之前的对话内容，请继续。"
            })

        for msg in self.messages:
            api_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        return api_messages

    def _trim_if_needed(self) -> None:
        """当消息过多时，压缩早期消息为摘要

        策略：保留最近 N 条消息，更早的消息用摘要代替
        比直接丢弃好-用户可能会引用很早之前的对话内容

        更高级的做法是用 LLM 生成摘要（需要额外 API 调用，
        在生产环境中需要权衡成本）。
        """
        if len(self.messages) <= self.max_messages:
            return

        # 将要被压缩的消息
        old_messages = self.messages[:len(self.messages)-self.max_messages]
        kept_messages = self.messages[len(self.messages)-self.max_messages:]

        # 简单的摘要方式：提取对话要点
        summary_parts = []
        if self.summary:
            summary_parts.append(self.summary)

        for msg in old_messages:
            prefix = "用户问:" if msg.role == "user" else "助手答:"
            # 截取每条消息的前 100 字符作为摘要
            short = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
            summary_parts.append(f"{prefix} {short}")

        self.summary = "\n".join(summary_parts)
        self.messages = kept_messages

    def clear(self) -> None:
        """清空所有记忆"""
        self.messages = []
        self.summary = ""

    def get_last_user_query(self) -> str | None:
        """获取用户最后一条消息（用于检索优化）"""
        for msg in reversed(self.messages):
            if msg.role == "user":
                return msg.content
        return None
```

### RAG 链

```python
from anthropic import Anthropic

from src.chunker import DocumentChunker
from src.loader import DocumentLoader
from src.embedder import Embedder
from src.memory import ConversationMemory
from src.retriever import Retriever
from src.vectorstore import VectorStore


class RAGAssistant:
    """RAG 知识库助手 - 组合所有组件

    这个类把整个 RAG 管线串联起来：
    文档加载 -> 分块 -> 索引 -> 检索 -> 生成
    """

    def __init__(self, embedding_model: str = "all-MiniLM-L6-v2",
                 llm_model: str = "claude-sonnet-4-20250514",
                 collection_name: str = "knowledge_base",
                 chunk_size: int = 500,
                 chunk_overlap: int = 100,
                 top_k: int = 5
    ):
        print("正在初始化 RAG 助手...\n")

        # 初始化各组件
        self.loader = DocumentLoader()
        self.chunker = DocumentChunker(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
        self.embedder=Embedder(model_name=embedding_model)
        self.vector_store = VectorStore(
            embedder=self.embedder,
            collection_name=collection_name,
        )
        self.retriever = Retriever(
            vector_store=self.vector_store,
            top_k=top_k,
        )
        self.memory = ConversationMemory()

        # LLM 客户端
        self.client = Anthropic()
        self.client.base_url = "http://1.95.142.151:3000"
        self.llm_model = llm_model

        # System Prompt
        self.system_prompt = """你是一个知识库助手，基于用户提供的文档内容回答问题。
        
## 核心规则
1. **只基于提供的知识库内容回答**。如果知识库中没有相关信息，明确告诉用户"知识库中未找到相关内容"，不要编造。
2. 回答时**引用来源**：指明信息来自哪个文档、哪个章节。
3. 如果检索到的内容与问题部分相关，说明哪些部分能回答、哪些部分无法确定。
4. 支持追问：用户可能会基于之前的对话继续提问，注意对话上下文。
5. 用清晰、简洁的语言回答。"""

        print("\n✅ RAG 助手初始化完成！\n")

    # ==========================================
    # 索引：加载文档到知识库
    # ==========================================
    def index_file(self, file_path: str, chunk_strategy: str = "recursive") -> int:
        """索引单个文件
        
        Args:
            file_path: 文件路径
            chunk_strategy: 分块策略 ("size"/"sections"/"recursive")
        """
        print(f"📄 正在索引: {file_path}")

        # 1. 加载文档
        doc = self.loader.load_file(file_path)
        print(f"  📖 已加载: {len(doc.content)} 字符")

        # 2. 分块
        if chunk_strategy == "sections" and file_path.endswith(".md"):
            chunks = self.chunker.chunk_by_section(doc)
        elif chunk_strategy == "recursive":
            chunks = self.chunker.chunk_recursive(doc)
        else:
            chunks = self.chunker.chunk_by_size(doc)
        print(f"  ✂️ 已分块: {len(chunks)} 个片段")

        # 3. 存入向量数据库（Embedding 在 VectorStore 内部完成）
        self.vector_store.add_chunks(chunks)

        return len(chunks)

    def index_directory(self, dir_path: str) -> int:
        """索引整个目录"""
        docs = self.loader.load_directory(dir_path)
        total_chunks = 0
        for doc in docs:
            chunk_strategy = "sections" if doc.metadata["file_type"] == ".md" else "recursive"
            # 创建临时 doc 对象来调用分块
            if chunk_strategy == "sections":
                chunks = self.chunker.chunk_by_section(doc)
            else:
                chunks = self.chunker.chunk_recursive(doc)
            self.vector_store.add_chunks(chunks)
            total_chunks += len(chunks)
            
        print(f"\n📊 索引完成: 共 {total_chunks} 个片段")
        return total_chunks
    
    # ===========================================
    # 查询：检索 + 生成
    # ===========================================
    def ask(self, question: str, verbose: bool = True) -> str:
        """提问并获取回答 - RAG 的核心流程
        
        Step1: 优化查询（可选）
        Step2: 检索相关片段
        Step3: 构造 Prompt （问题+检索结果+对话历史）
        Step4: LLM 生成回答
        Step5: 更新对话记忆
        """
        
        # Step1: 查询优化
        # 如果用户的问题是追问（“它还有什么特点？”）
        # 需要结合对话历史来优化检索查询
        search_query = self._optimize_query(question)
        if verbose and search_query != question:
            print(f"  🔄 优化后的检索查询: {search_query}")
            
        # Step2: 检索
        results = self.retriever.retrieve(search_query)
        if verbose:
            print(f"  🔍 检索到 {len(results)} 个相关片段")
            for i, r in enumerate(results, 1):
                source = r["metadata"].get("source", "?")
                print(f"     [{i}] {source} (相关度: {r['score']:.2f})")
        
        # Step3: 构造上下文
        context = self.retriever.format_context(results)
        
        # 构造消息：对话历史 + 当前问题（带检索上下文）
        self.memory.add_user_message(question)
        
        messages = self.memory.get_messages()
        # 在最后一条用户消息中注入检索到的上下文
        messages[-1] = {
            "role": "user",
            "content": f"""基于以下知识库内容回答我的问题。

## 知识库检索结果
{context}

## 我的问题
{question}"""
        }
        
        # Step4: LLM 生成
        response = self.client.messages.create(
            model=self.llm_model,
            max_token=2048,
            system=self.system_prompt,
            messages=messages
        )
        
        answer = response.content[0].text
        
        # Step 5: 更新记忆
        self.memory.add_assistant_message(answer)
        
        if verbose:
            print(f"  📊 Token: {response.usage.input_tokens} in / {response.usage.output_tokens} out")

        return answer
    
    def _optimize_query(self, question: str) -> str:
        """查询优化 - 处理追问和代词消解
        
        问题：用户说“它有什么特点？”，“它”指的是什么？
        解决：结合对话历史，用 LLM 将追问改写为完整的检索查询
        
        例如：
        - 用户问了“什么是 asyncio”
        - 追问“它和多线程有什么区别？”
        - 改写为“asyncio 和多线程有什么区别”
        
        :param question: 
        :return: 
        """
        # 如果是第一个问题或者问题很完整，直接返回
        if len(self.memory.messages) <= 1:
            return question
        
        # 检查是否包含代词或省略
        vague_indicators = ["它", "这个", "那个", "他", "她", "上面", "刚才", "之前提到的"]
        is_followup = any(indicator in question for indicator in vague_indicators)

        if not is_followup:
            return question
        
        # 用 LLM 改写查询
        last_messages = self.memory.get_messages()[-4:] # 取最近 2 轮对话
        context_str = "\n".join(
            f"{m['role']}: {m['content'][:200]}" for m in last_messages
        )
        
        response = self.client.messages.create(
            model=self.llm_model,
            max_tokens=200,
            system="将用户的追问改写为一个完整的、自包含的搜索查询。只输出改写后的查询，不要其他内容。",
            messages=[{
                "role": "user",
                "content": f"对话上下文:\n{context_str}\n\n追问: {question}\n\n改写为完整查询:"
            }],
        )
        
        return response.content[0].text.strip()
    
    # ==============================================
    # 管理功能
    # ==============================================
    def reset_memory(self) -> None:
        """清空对话记忆"""
        self.memory.clear()
        print("对话记忆已清空")
        
    def reset_knowledge_base(self) -> None:
        """清空整个知识库"""
        self.vector_store.delete_collection()
        print("知识库已清空")
        
    def get_stats(self) -> dict:
        """获取系统状态"""
        db_stats = self.vector_store.get_stats()
        return {
            **db_stats,
            "conversation_length": len(self.memory.messages),
            "has_summary": bool(self.memory.summary),
            "llm_model": self.llm_model,
        }
```

### 命令行入口

```python
# src/cli.py
from dotenv import load_dotenv
load_dotenv()

import typer
from rich.console import Console
from rich.panel import Panel
from src.rag_chain import RAGAssistant

app = typer.Typer(help="RAG 知识库助手 — Agent 开发项目 3")
console = Console()


@app.command()
def index(
    path: str = typer.Argument(help="文件或目录路径"),
    chunk_strategy: str = typer.Option("recursive", "--strategy", "-s",
        help="分块策略: size / sections / recursive"),
    embedding_model: str = typer.Option("all-MiniLM-L6-v2", "--embedding", "-e"),
):
    """将文档索引到知识库"""
    import os
    assistant = RAGAssistant(embedding_model=embedding_model)

    if os.path.isdir(path):
        count = assistant.index_directory(path)
    else:
        count = assistant.index_file(path, chunk_strategy=chunk_strategy)

    console.print(f"\n[green]✅ 索引完成！共 {count} 个片段已入库[/green]")


@app.command()
def ask(
    question: str = typer.Argument(help="你的问题"),
    embedding_model: str = typer.Option("all-MiniLM-L6-v2", "--embedding", "-e"),
    top_k: int = typer.Option(5, "--top-k", "-k"),
):
    """单次提问"""
    assistant = RAGAssistant(embedding_model=embedding_model, top_k=top_k)
    answer = assistant.ask(question)

    console.print(Panel(answer, title="回答", border_style="green"))


@app.command()
def chat(
    embedding_model: str = typer.Option("all-MiniLM-L6-v2", "--embedding", "-e"),
    top_k: int = typer.Option(5, "--top-k", "-k"),
):
    """交互式对话（带记忆）"""
    assistant = RAGAssistant(embedding_model=embedding_model, top_k=top_k)

    console.print(Panel(
        "输入问题开始对话\n"
        "命令: /clear 清空记忆 | /stats 查看状态 | /quit 退出",
        title="RAG 知识库助手",
    ))

    while True:
        try:
            question = input("\n🧑 你: ").strip()

            if not question:
                continue
            if question == "/quit":
                console.print("👋 再见！")
                break
            if question == "/clear":
                assistant.reset_memory()
                continue
            if question == "/stats":
                stats = assistant.get_stats()
                for k, v in stats.items():
                    console.print(f"  {k}: {v}")
                continue

            answer = assistant.ask(question)
            console.print(f"\n🤖 助手: {answer}")

        except KeyboardInterrupt:
            console.print("\n👋 再见！")
            break


if __name__ == "__main__":
    app()
```



# 👁️ 实验后：现象与数据 (Check)


## 索引文档

((venv) ) ➜  rag-assistant python -m src.cli index ./data/my_notes.md                                   

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/24/20260224191850047.png)

## 单次提问

((venv) ) ➜  rag-assistant python -m src.cli ask "失踪的账本是什么"

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/24/20260224193444275.png)

# 交互式对话

python -m src.cli chat

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/24/20260224194816006.png)



# 🧠 深度复盘：分析与结论 (Act)

### 什么是 RAG？

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/23/20260223225619465.png)

RAG = Retrieval-Augmented Generation（检索增强生成）
LLM 有两个根本问题：

知识过时 — 训练数据有截止日期
缺少私有知识 — 不知道你的文档、公司数据

RAG 的解决方案：先检索，再生成。
传统 LLM:
  用户问题 → LLM → 回答（可能错误或过时）

RAG:
  用户问题 → 从你的文档中检索相关内容 → 将内容 + 问题一起发给 LLM → 基于真实文档的回答

Embedding（向量嵌入）：
把一段文本转换为一个高维向量（如 384 维的浮点数数组）。语义相似的文本，向量在空间中距离更近。这让我们能用"数学距离"来衡量"语义相似度"。

"猫在睡觉"    → [0.12, -0.34, 0.78, ...]  ┐
"小猫正在休息" → [0.11, -0.32, 0.80, ...]  ┤ 距离近 → 语义相似
"今天天气不错" → [-0.56, 0.23, 0.01, ...]  ┘ 距离远 → 语义不相关

Chunk（分块）：

文档通常很长，不可能整篇塞进 LLM 的上下文。分块就是把长文档切成小片段（如每段 500 字），分别做 Embedding。检索时只返回最相关的几个片段。

向量数据库：

专门存储和检索向量的数据库。给定一个查询向量，能快速找到最相似的 K 个向量（及其对应的原始文本）。

### 相关问题

Q: RAG 的检索效果不好怎么优化？

A: 分层优化：(1) 分块策略 — 调整 chunk_size、尝试语义分块；(2) Embedding 模型 — 换更好的模型（如 BGE、Cohere embed）；(3) 混合检索 — 语义检索 + BM25；(4) Reranker 重排 — Cross-Encoder 精排；(5) 查询优化 — 代词消解、查询扩展；(6) 元数据过滤 — 利用文件来源、时间等缩小范围。

Q: chunk_size 怎么选？

A: 取决于文档类型和问题粒度。经验值：FAQ → 100-200，技术文档 → 300-500，长文分析 → 500-1000。核心原则：一个 chunk 应该能独立回答一个问题。太大包含噪音，太小丢失上下文。建议用评估集测试不同大小。

Q: 向量数据库怎么选？

A: ChromaDB — 原型和小项目；Pinecone — 不想运维的云方案；Milvus — 大规模（百万级以上向量）；pgvector — 已有 PostgreSQL 基础设施时。核心考虑：数据规模、延迟要求、运维能力、成本。

Q: RAG 和 Fine-tuning 怎么选？

A: RAG 适合：知识经常变化、需要引用来源、数据量大但不需要改变模型行为。Fine-tuning 适合：需要改变模型的输出风格/格式、特定领域的专业术语理解、对延迟要求极高（省去检索步骤）。两者可以结合使用。

Q: 对话记忆为什么重要？怎么实现？

A: 没有记忆的 RAG 无法处理追问（"它还有什么特点？"）。实现方式：(1) 最简单 — 保留完整对话历史放入 messages；(2) 窗口法 — 只保留最近 N 轮；(3) 摘要法 — 用 LLM 压缩早期对话；(4) 向量记忆 — 将历史对话也存入向量数据库检索。要注意 token 成本与记忆质量的平衡。


# 下一步行动 (Next Actions)：

✅ 验证通过，纳入标准流程。

🔄 验证失败，修改假设，开启下一次实验（EXP-002）。

❓ 产生新问题：[记录新问题]