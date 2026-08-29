---
title: "Day 17 · 全栈项目实战 — 从 CLAUDE.md 到上线的完整循环"
date: '2026-05-22'
draft: false
description: "把 Day 1–16 学过的所有招式拼成一个真实项目——以 Mini Task Tracker(FastAPI + React)为例,跑通 CLAUDE.md → 脚手架 → DB → API → 前端 → 测试 → 部署七步,看 Hooks / Skills / MCP / Subagent 在其中各自的位置。"
toc: true
tags:
  - AI
  - Claude Code
  - Full-stack
  - Project
  - Tutorial
---

DAY 17 · CLAUDE CODE ROADMAP · 20 DAYS

# 全栈项目_实战_

Day 1–16 你练过了所有招式——今天把它们_串起来_。 用一个真实的小项目（ **Mini Task Tracker** ，FastAPI + React）走完 **CLAUDE.md → 脚手架 → DB → API → 前端 → 测试 → 部署** 七步。 你会看到 Hooks 在每次编辑后自动跑 lint，Skills 把"开新组件"压成一条命令， MCP 把数据库 schema 喂给 Claude，Subagent 并行写测试与文档—— Claude Code 从助手升级为_独立产出 PR_的搭子。

**DURATION** 100–130 min **HANDS-ON** 70 min **THEORY** 25 min **REVIEW** 20 min **SECTIONS** 6

## 思维导图

OVERVIEW

> **图：Day 17 思维导图**
>
> - DAY 17 · 全栈项目实战
> - BLUEPRINT · FOUNDATION · BUILD · SHIP
> - 01 · BLUEPRINT
> - 项目蓝图
> - 02 · FOUNDATION
> - CLAUDE.md 奠基
> - 03 · BUILD
> - 脚手架 + API + UI
> - 04 · SHIP
> - 测试 + 部署
> - Plan 模式画架构
> - 技术栈选型
> - 数据模型设计
> - MVP 范围切片
> - 项目说明 + 栈说明
> - 编码规范 + 禁忌
> - 命令清单 + 路径规则
> - .claude/ 配置矩阵
> - 脚手架(monorepo)
> - DB schema + 迁移
> - API TDD 循环
> - 前端 + Subagent 并行
> - 三层测试矩阵
> - Dockerfile + compose
> - GitHub Actions CI
> - 上线后的 smoke test
> - Claude Code 不再只写代码——它交付一个产品
> - PLAN MODE
> - THICK CLAUDE.MD
> - 7-STEP PIPELINE
> - CI / CD

FIG M — DAY 17 KNOWLEDGE MAP · FULL-STACK PROJECT WORKFLOW

## 项目蓝图

BLUEPRINT

不论用不用 AI，全栈项目最大的浪费是 **边写边想** 。 Day 15 学的 Plan 模式在这里第一次真正用上——先把架构、栈、范围画清楚， _让 Claude 知道这是个什么东西_， 后面 6 小时的写码才不会原地打转。

### 今天的样例：Mini Task Tracker

麻雀虽小，五脏俱全：注册登录、增删任务、按标签筛选、按截止日排序、按状态归档。 这五条功能切片刚好覆盖 **全栈所有典型组件** —— Auth、CRUD、Filter、Sort、State Transition。

### 技术栈一览

| 层级 | 选型 | 为什么选它 | 替代品 |
| --- | --- | --- | --- |
| 后端 | FastAPI + SQLAlchemy 2.x + Pydantic v2 | 类型提示丰富，Claude 容易理解；自动 OpenAPI 给前端用 | Express / Nest / Go-Gin |
| 数据库 | SQLite (dev) → Postgres (prod) | 本地零依赖；线上换 DSN 即可，迁移脚本不变 | Postgres-only / Turso |
| 前端 | React 19 + Vite + TypeScript + Tailwind | 组件化清晰，Tailwind 让 Claude 改样式不用查类名 | SvelteKit / Vue 3 / Solid |
| 测试 | pytest + Vitest + Playwright | 单元 / 集成 / E2E 三层覆盖；Playwright 截图便于 Claude 自检 UI | Jest / Cypress |
| 部署 | Docker + GitHub Actions + Fly.io | Dockerfile 单文件即可上线；Actions 触发 deploy | Railway / Render / Vercel |
| 选型口诀 | 语言统一(都用 TS / Py)、有类型(Claude 才能推导)、能本地跑(脱网开发)、单文件部署 |

### 项目架构图

> **图：项目架构**
>
> - FRONTEND
> - React + Vite
> - TypeScript · Tailwind
> - localhost:5173
> - API SERVER
> - FastAPI
> - SQLAlchemy · Pydantic v2
> - POST /auth · GET /tasks
> - POST /tasks · PATCH /tasks/:id
> - DELETE /tasks/:id · GET /tags
> - 8 endpoints total
> - DATABASE
> - SQLite · Postgres
> - users · tasks · tags
> - Alembic migrations
> - JSON over HTTPS
> - SQLAlchemy
> - DOCKER COMPOSE · 3 SERVICES
> - DEPLOY · Fly.io / Railway
> - GitHub Actions CI → 单命令上线

FIG 01 · 三层架构 — UI / API / DB,Docker Compose 一键起,Fly.io 上线

### 四条 AI-driven 全栈开发原则

01

### 蓝图先行

动手前先用 `/plan` 把目录、模型、端点定下来。 **结构错了改一次比写错代码改十次贵** 。

02

### API 先于 UI

先写后端 + OpenAPI Schema，前端从 schema 生成类型——避免"前端假装数据、后端跟着改"的反向开发。

03

### 测试是合同

每个端点先写测试再写实现（TDD）。测试是 Claude 改代码时的安全网， **没测试的代码 = 没合同的工人** 。

04

### 一切自动化

能让 Hook 跑的不手动跑、能让 Skill 一句话搞定的不重复打字、能让 Subagent 并行的不串行。

原则 1+2 来自 Day 15 Plan 模式；原则 3 来自 Day 06 测试；原则 4 串起 Day 10/11/14

## CLAUDE.md 项目奠基

FOUNDATION

Day 03 教你写 CLAUDE.md，那时它可能只有 20 行。 真实全栈项目里它应该是 **厚厚一份** —— 告诉 Claude 项目是什么、技术栈是什么、规范是什么、 _什么绝对不能做_、出问题去哪里查。 项目级 CLAUDE.md 是你和 Claude 之间的 **项目契约** 。

### 四个必备章节

CHAPTER · 01

### 项目说明

一句话讲清这是什么、给谁用、解决什么问题；列出技术栈和外部依赖。 **新成员（包括 Claude）读完应知"我在做什么"** 。

CHAPTER · 02

### 编码规范

命名风格、文件组织、类型严格度、错误处理范式、注释要求——把口头默契写成 **可执行的规则** 。

CHAPTER · 03

### 常用命令

装依赖、跑测试、起 dev server、跑迁移、build、deploy——所有人都该知道的 **"make 命令清单"** 。Claude 不用再 grep package.json。

CHAPTER · 04

### 禁忌（最重要）

"不要 commit 进 main"、"不要写 raw SQL"、"不要在前端处理鉴权"——把 **过去栽过的坑** 明文写出来。Claude 不会自己悟。

### 真实项目 CLAUDE.md 模板

```
# CLAUDE.md — Mini Task Tracker

## 项目说明
个人任务追踪 SaaS,后端 FastAPI + Postgres,前端 React 19 + Vite。
单租户、用户自己管理自己的 tasks/tags。 **目前 MVP 阶段** ,
不要引入复杂的多人协作 / 团队功能。

## 技术栈
- 后端: Python 3.12 + FastAPI 0.118 + SQLAlchemy 2.x + Pydantic v2 + Alembic
- 前端: React 19 + TypeScript 5.4 + Vite 6 + Tailwind v4 + TanStack Query
- 测试: pytest (后端) · Vitest + Playwright (前端)
- 部署: Dockerfile + Fly.io · CI 走 GitHub Actions

## 目录结构
- `backend/` FastAPI 服务 + Alembic 迁移
- `frontend/` React app, 入口 src/main.tsx
- `infra/` Dockerfile, fly.toml, deploy 脚本
- `.github/` CI / CD workflow

## 编码规范
- Python: ruff + mypy --strict,所有函数必须有类型注解
- TS: tsc --noEmit + eslint, **不允许 any** ,组件全用 function component
- 提交信息走 Conventional Commits: feat / fix / chore / docs
- 测试覆盖率 >= 80% — CI 卡线

## 常用命令(Make 风格)
- $ make dev # 同时起前后端
- $ make test # 跑全部测试
- $ make migrate # 生成 + 应用迁移
- $ make lint-fix # 自动修可修的
- $ make deploy # fly deploy

## 禁忌(踩过的坑,别再踩)
- ❌ **不要在前端做 token 校验** — 一律走后端 middleware
- ❌ **不要用 raw SQL** — 走 SQLAlchemy ORM,迁移走 Alembic
- ❌ **不要把 .env 提交进 git** — 已 gitignore,看 .env.example
- ❌ **不要在 main 分支直接 push** — 走 PR
- ❌ **不要跳过测试合并** — CI 卡 80% 覆盖率

## 出问题去哪查
- 接口形态: 看 backend/openapi.json (CI 自动生成)
- 表结构: 用 db MCP 查 prod 副本(只读)
- 历史决策: docs/decisions/*.md (ADR 风格)
```

这份 CLAUDE.md ~80 行 — 看似多,实际让 Claude 后续 80 小时都不踩雷

### 路径级规则（精准提示）

```
# .claude/rules/backend.md —— 只在 backend/ 下生效

apply_to:
  - "backend/**/*.py"

## Backend 专属规则
- 所有路由文件放 `backend/routers/`,按资源分文件: tasks.py / tags.py / auth.py
- DB session 通过 FastAPI Depends 注入, **不要全局变量**
- 异常: 用 `HTTPException`, **不要 return error dict**
- 日志: `logging.getLogger( __name__ )`, **不要用 print**
```

```
# .claude/rules/frontend.md —— 只在 frontend/ 下生效

apply_to:
  - "frontend/src/**/*.tsx"
  - "frontend/src/**/*.ts"

## Frontend 专属规则
- 远端请求一律走 TanStack Query 的 useQuery / useMutation
- 表单用 React Hook Form + Zod
- 组件 props **必须** 显式 Type, **不允许 React.FC**
- 样式只用 Tailwind class, **不写 inline style**
```

路径级规则 = 局部精装修。比塞进顶层 CLAUDE.md 更精准

### .claude/ 配置矩阵

```
# 项目根目录结构(完整版)
project/
├── CLAUDE.md # 项目契约(80 行)
├── .claude/
│ ├── settings.json # 团队共享设置
│ ├── settings.local.json # 个人覆盖(gitignored)
│ ├── .mcp.json # db / github MCP 配置
│ ├── rules/
│ │ ├── backend.md # 后端规则
│ │ ├── frontend.md # 前端规则
│ │ └── migrations.md # Alembic 规则
│ ├── skills/
│ │ ├── new-endpoint.md # 新增一个 API 端点(含测试)
│ │ ├── new-component.md # 新增一个 React 组件
│ │ └── ship.md # 构建 + 部署 + 跑 smoke
│ ├── agents/
│ │ ├── tester.md # 专门写测试的子代理
│ │ └── reviewer.md # 专门做 code review 的子代理
│ └── hooks/
│ └── post-edit.sh # 编辑后自动 lint + 跑相关测试
├── backend/ # Python 后端
├── frontend/ # React 前端
└── infra/ # Dockerfile + fly.toml
```

## 脚手架 → API → 前端

BUILD

地基打好后， **七步 build pipeline** 走完一轮，一个能跑的 MVP 就出来了。 关键不是每一步会用什么命令——而是_每一步用对模式_： 何时 Plan、何时 TDD、何时让 Subagent 接手。

### 7 步 Build Pipeline

> **图：Build 流水线**
>
> - 01 · PLAN
> - 蓝图
> - /plan
> - 02 · SCAFFOLD
> - 脚手架
> - monorepo
> - 03 · DB
> - 模型 + 迁移
> - SQLAlchemy
> - 04 · API
> - TDD 循环
> - test-first
> - 05 · UI
> - 组件 + 页面
> - subagent
> - 06 · TEST
> - 三层覆盖
> - e2e + unit
> - 07 · SHIP
> - Docker + CI
> - fly deploy
> - ~20 min
> - ~15 min
> - ~80 min
> - ~100 min
> - ~40 min
> - ~25 min
> - MODE
> - PLAN
> - EDIT
> - TDD LOOP
> - SUBAGENT
> - SKILL: /ship

FIG 02 · BUILD PIPELINE — 7 STEPS · ~5 HOURS · MIXED MODES

### 阶段 A · 脚手架（Plan → 落地）

```
# Step 1 — 用 plan 模式让 Claude 先给方案,不要直接动手
> /plan

> 帮我搭一个 mini task tracker 的脚手架:
  · monorepo: backend/(FastAPI + Alembic) · frontend/(Vite+TS) · infra/
  · Makefile: dev/test/migrate/deploy 四个目标
  · .gitignore · .env.example · pre-commit hook
  · 不要写业务代码 — 只搭骨架,所有路由先返 501

# Claude 会回一份 plan(目录 + 关键文件清单),用户确认后才执行
> 通过,执行
```

```
# Step 2 — 验证脚手架能跑
$ make dev
# backend 起在 :8000, frontend 起在 :5173 — 都返 hello / 501,即 OK
```

为什么这步要 Plan? — 错的目录结构后面要拖动 100+ 文件才能改

### 阶段 B · DB 模型与迁移

```
> 在 backend/models/ 下建三张表:
  · users(id, email, hashed_password, created_at)
  · tasks(id, user_id FK, title, description, due_date, status, created_at)
  · tags(id, name) + tasks_tags 多对多关联表
  生成对应 SQLAlchemy 2.x 风格 model + 一份 Alembic 初始迁移

$ make migrate # Claude 已经写好,你只需跑一下
INFO Running upgrade -> 7f3a2b — initial schema
```

### 阶段 C · API 端点（TDD 循环）

```
# 关键: 一次开一个端点,先测试再实现 — 走 Day 6 的 TDD 模式
> 用 TDD 模式实现 POST /tasks:
  1. 先在 backend/tests/test_tasks.py 写 5 个测试:
     - 未登录 401
     - title 为空 422
     - 正常创建 201 返 task obj
     - status 默认为 "open"
     - due_date 必须未来
  2. 跑测试确认全部失败
  3. 在 backend/routers/tasks.py 实现端点直到全过
```

```
# Claude 的执行轨迹(简化):
[Edit] backend/tests/test_tasks.py # 写测试
[Bash] pytest backend/tests/test_tasks.py
5 failed — expected, no impl yet

[Edit] backend/routers/tasks.py # 写实现
[Edit] backend/schemas/task.py # Pydantic schema
[Bash] pytest backend/tests/test_tasks.py
5 passed in 0.42s ✓

[Hook · post-edit] ruff check backend/ # 自动 lint
[Hook · post-edit] mypy backend/ # 自动类型检查
```

每个端点 ~8 分钟。8 个端点 = 1 小时 TDD 战。Hook 让你不用管 lint

### 阶段 D · 前端（Subagent 并行）

```
# 前端有 5 个页面 + ~12 个组件 — 用 Subagent 并行铺开
> 派出三个 subagent 并行做:
  · agent A: frontend/src/api/ 从 backend/openapi.json 生成 TS 类型 + fetch client
  · agent B: frontend/src/components/ 建 TaskCard / TaskList / FilterBar 三个基础组件
  · agent C: frontend/src/pages/ 建 LoginPage / TasksPage / 路由配置

  agent A 完成后 agent B/C 才能用类型,所以 A 串行,B/C 并行
```

```
# 实际跑下来:
[Agent A] 完成 — 3 min · 生成 api/client.ts (147 行) + types.ts (89 行)
[Agent B] 进行中 ... 完成 — 8 min · TaskCard.tsx + TaskList.tsx + FilterBar.tsx
[Agent C] 进行中 ... 完成 — 6 min · LoginPage.tsx + TasksPage.tsx + router.tsx

$ cd frontend && npm run dev
UI 已经能登录 → 看 task 列表 → 新建 task,~17 min 完成
```

Subagent 并行的临界值: 任务之间无强依赖 + 涉及多个文件 → 单线串 30 分钟以上

## 测试与部署

SHIP

代码能跑只是开始。 **能跑得稳、能上线、能被监控** 才算 ship。 这一阶段把三层测试矩阵补齐、Dockerfile 写好、GitHub Actions 接通—— 之后每次 PR 都自动跑全套校验，绿了才能 merge。

### 三层测试矩阵

| 层级 | 工具 | 覆盖什么 | 典型例 |
| --- | --- | --- | --- |
| 单元测试 | pytest · Vitest | 函数 / 工具 / 组件 — 不动 DB / 不动网 | schema 校验、密码哈希、Tag 排序工具 |
| 集成测试 | pytest + httpx · Vitest + msw | 跨层契约 — API ↔ DB,UI ↔ mock API | POST /tasks 真的写库、TaskList 收到错误时显示 fallback |
| E2E 测试 | Playwright | 用户路径 — 真浏览器跑真服务 | 登录 → 建 task → 标记完成 → 查归档 全流程 |
| 覆盖目标 | 单元 60% + 集成 80% 关键路径 + E2E 覆盖核心用户路径 4–6 条 |

### Dockerfile · 多阶段构建

```
# infra/Dockerfile — 一个镜像同时打包前后端,前端构建产物给 FastAPI static 服务
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build # 出 dist/

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend /app/frontend/dist ./backend/static
ENV PORT=8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### GitHub Actions CI

```
# .github/workflows/ci.yml — PR 卡线,绿了才能合
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - uses: actions/setup-node@v4
        with: { node-version: "22" }

      - run: pip install -r backend/requirements.txt
      - run: cd frontend && npm ci

      - run: ruff check backend/ # lint py
      - run: cd frontend && npm run lint # lint ts
      - run: mypy backend/ --strict # 类型
      - run: pytest --cov=backend --cov-fail-under=80
      - run: cd frontend && npm test
      - run: cd frontend && npx playwright test # E2E

  deploy:
    needs: test
    if: github.ref == "refs/heads/main"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

让 CI 替代你的"记性" — 永远别相信"我刚才跑过了"

### 上线后的 Smoke Test

```
# 部署完别走人 — 跑 5 个最关键的健康检查
$ URL=https://task-tracker.fly.dev

$ curl -sf $URL/healthz # 1. 进程活
$ curl -sf $URL/api/version | jq .commit # 2. 部署的是最新 commit
$ curl -sf $URL/api/docs > /dev/null # 3. OpenAPI 可访问
$ curl -sf -o /dev/null -w "%{http_code}\n" $URL/ # 4. 首页 200
$ npx playwright test e2e/smoke.spec.ts \
       --config=playwright.prod.config.ts # 5. 关键用户路径
```

## 全流程编排

ORCHESTRATION

上面四节是 **动作** ，这一节是 **编排** —— Hooks / Skills / MCP / Subagent 不是孤立工具,而是_协奏曲_。 看一个真实场景: 你接到一张 ticket，到 PR 合并、自动部署、Slack 通知, Claude Code 怎么在每一步串起 Day 10–14 学过的能力。

### 编排全景图

> **图：全流程编排**
>
> - TOOLS
> - HOOKS
> - Day 10
> - SKILLS
> - Day 11
> - MCP
> - Day 13
> - SUBAGENT
> - Day 14
> - PLAN
> - Day 15
> - LOOP/CRON
> - Day 16
> - YOU
> - Architect
> - TICKET
> - 需求拆解
> - MCP 读 issue
> - PLAN 出方案
> - CODE
> - 实现 + 重构
> - SUBAGENT 并行
> - HOOKS 自动 lint
> - TEST
> - 写 + 跑测试
> - HOOKS · post-edit
> - TESTER subagent
> - PR
> - 提 + 审
> - SKILL · /pr
> - REVIEWER subagent
> - MERGE + DEPLOY
> - CI 通过 → 上线
> - SKILL · /ship
> - MCP · Slack 通知
> - 你的工作从"写代码"变成"架构 + 审批"—— Claude 处理 80% 重复劳动
> - FULL LOOP · TICKET → MERGE · ~30 MIN PER FEATURE

FIG 03 · 全流程编排 — 6 类能力 × 5 个阶段 · 你只在关键节点决策

### 四件套各自的位置

HOOKS · 自动卫兵

### 编辑后必做的"清洁工作"

post-edit hook 自动跑 `ruff fmt` + `mypy` + 相关测试。你不用记得格式化,Claude 也不会忘——commit 一定整洁。

SKILLS · 高频快捷

### 把 5 步操作压成 1 句话

项目里 `/new-endpoint POST /tasks` 自动建 router + schema + 测试 + Alembic 迁移; `/ship` 跑 lint + test + build + deploy + smoke.

MCP · 外部世界

### 不用切到浏览器找信息

db MCP 让 Claude 直接查 prod schema(只读副本); github MCP 让 Claude 读 issue/PR 评论; slack MCP 让 Claude 发部署通知。

SUBAGENT · 并行分身

### 独立任务别串行做

"写 3 个组件 + 1 份 README + 跑覆盖率分析" — 派 4 个 subagent 并行,~10 min 内全收。比串行省 60% 时间。

### 真实 Ticket 全流程实录

```
# 假设 ticket #42: "tasks 列表需要支持按 due_date 排序"

> 读 GitHub issue #42 的描述,然后给我一份实施方案# MCP · github
[mcp_github] 读到了 issue: "用户希望按截止日升降序排,默认升序"

> /plan — 这个需求要改哪些文件?需要新加测试吗?# PLAN
[Plan] 1. backend/routers/tasks.py 加 order_by 参数
       2. backend/tests/test_tasks.py 加 4 个排序测试
       3. frontend/src/components/FilterBar.tsx 加排序下拉
       4. frontend/e2e/sort.spec.ts 加一条 E2E

> 通过,执行 # 进入实现
[Subagent A] 改后端 + 测试 ...
[Subagent B] 改前端 + 组件 ...
[Hook · post-edit] 自动跑相关测试 ✓
[Hook · post-edit] ruff fmt + mypy ✓

> /pr — 起 PR,标题 "feat(tasks): support order_by"# SKILL
[git] 已创建分支 feat/tasks-order-by · push · 开 PR #87

> 派 reviewer subagent 审一下 # SUBAGENT
[Reviewer] 发现 1 处: missing index hint — 建议加 db index on (user_id, due_date)
> 同意,加上,重新跑 CI

[CI · GitHub Actions] All checks passed ✓ — 你点 merge
[Deploy] fly deploy — 上线 1m12s
[mcp_slack] 已发 #team-eng: "✅ #42 上线 / PR #87 / commit abc1234"
```

从读 issue 到上线 — ~28 min · 全程你只点了 3 次"通过"

## Labs

4 HANDS-ON

不实际跑一遍,前面所有内容都只是_读过_而已。 下面四个 Lab 按 BUILD pipeline 切片,任挑一个项目跟着做—— 技术栈不必和样例一样,关键是体会 **编排** 。

LAB · 01 · 15 MIN

### Plan 模式画一个小项目

挑你想写的 **真实小项目** (URL 短链 / 番茄钟 / Markdown 笔记...),用 `/plan` 让 Claude 输出: 目录结构 / 模型 / 端点 / 部署方式 / 工期估算。 **不要落地** ——只看 Plan,验证 Claude 是否懂你的意图。

目标：训练"先想后写"的肌肉记忆

LAB · 02 · 25 MIN

### 写一份"厚 CLAUDE.md"

给你 **已有的** 一个项目重写 CLAUDE.md: 必须含"项目说明 / 编码规范 / 命令清单 / 禁忌"四章,加至少 5 条禁忌(基于你过去栽过的坑)。然后选 3 处让 Claude 改代码,观察它是否真的按规范走。

目标：体会"项目契约"对长期开发的影响

LAB · 03 · 30 MIN

### TDD 实现 + Subagent 并行

选一个端点(如 `POST /tasks`): 先用 TDD 模式让 Claude 写测试再写实现,完成后 **派 2 个 subagent** 并行做 (A) 补集成测试 (B) 写对应前端组件。统计耗时——对比"串行做一遍"的预估时间。

目标：感受 TDD + 并行的复合杠杆

LAB · 04 · 25 MIN

### 装一条 CI/CD 流水线

给你的项目写 `.github/workflows/ci.yml`: lint + test + 覆盖率卡线;再装个 `/ship` Skill,让 Claude 帮你跑本地构建并触发 deploy。完工后假装 **提一个小 PR** ,观察 CI 全绿后再 merge。

目标：建立"PR 不绿不合"的安全感

## 常见问题

6 FAQS

### Q · 01 · AI-driven 全栈跟传统全栈最本质的差别在哪？

A ·

三处真正的差别: (1) **"思考"与"打字"解耦** ——传统开发里你边想边打,效率被打字速度限制; AI-driven 里你只负责想,Claude 负责打。(2) **规范变成可执行** ——以前 README 没人看的"代码规范",现在写进 CLAUDE.md 后 Claude 真的会遵守,且会提醒你违反。(3) **并行成本接近 0** ——Subagent 让你能同时推进 3 件事,这在传统模式下需要 3 个人。

不变的是: **架构、品味、判断、产品感** ——这些都还得人想。Claude 让你能写"传统模式下需要 3 倍人时"的项目,但 **不会让你的项目变好 3 倍** 。瓶颈从"会不会写"变成"想不想得清楚"。

### Q · 02 · 一个人靠 Claude Code 能做多大规模的项目？

A ·

经验数据: **10k–50k 行代码的小型 SaaS** 一个人 + Claude Code 全程独立完成是可行的; 这量级以上瓶颈不在编码,而在"你能不能持续装得下整个系统的心智模型"。

具体看三个指标: (1) **会话能否被 Plan + CLAUDE.md 维持上下文一致** ; (2) **测试覆盖率能否抗住你忘记自己写过什么** ; (3) **Hooks 是否真的能挡住人为失误** 。三个都过关,你的天花板就是 **你能想多清楚** ——不是 Claude 能写多少代码。

### Q · 03 · 该让 Claude 一次写完整个 feature 还是分步？

A ·

三档判断: (1) **单文件、纯增量** (给 util 加个函数 / 改一个组件样式)——一次写完。(2) **跨 2-3 个文件、有耦合** (加一个 API 端点 + 测试 + 前端调用)——分两段: 先 Plan 看方案,再一次执行。(3) **跨层、有架构影响** (加一种新的认证方式 / 重构 DB schema)——必须 `/plan`,且 **分多次执行,每段中间 review** 。

反模式: "把整个 ticket 丢给 Claude 让它一口气干完"——容易出现"看起来都对、跑一下全错"的偏差。Claude 越自由,你越要切片去 review。

### Q · 04 · 怎么避免大项目里 Claude 写出风格不一致的代码？

A ·

三层防线,从软到硬: (1) **CLAUDE.md 编码规范章** ——把命名、结构、错误处理范式明文写; (2) **路径级规则** (`.claude/rules/`)——按目录给不同领域不同提示,backend 和 frontend 有专属规则; (3) **Hooks 卡线** ——post-edit 自动跑 lint / type 检查,不符直接报错。

第四层是 **给个例子** : CLAUDE.md 里贴 1-2 个"标准实现"的代码片段,Claude 会按例仿写。比一千字规则有效。

### Q · 05 · 全栈项目里,什么时候该用 Subagent 而不是直接做？

A ·

满足 **三个条件之一** 才派 subagent: (1) **无依赖且并行** ——3 个组件 / 3 处文案修改,可以同时做; (2) **独立调研** ——"分析这个老仓库的认证逻辑"——派出去避免污染主上下文; (3) **角色专精** ——让 reviewer / tester 子代理负责他们擅长的部分。

反过来, **有强依赖的串行任务** (改 schema → 改路由 → 改前端)别派 subagent。一字之差(schema 字段命名)就让另外两边重做,反而慢。

### Q · 06 · 部署前还需要人工 review 吗？CI 都过了。

A ·

需要,且永远需要。CI 能验证 **"代码符合契约"** ,但回答不了 **"这个变更有没有意义"** 。Claude 写出 100% 通过测试的代码,也可能解决错了问题(因为它对需求的理解就错了)。

实操: PR 一定要有人(可以是你自己换个时段) **读 description + diff 摘要** ——不必逐行,但必须读懂"它在做什么、为什么这么做、有没有偏离原 issue"。这 3 分钟是 AI-driven 开发里 **不能省的人工动作** 。

## 复习题

5 QUESTIONS

1. 7 步 build pipeline 中,哪些步骤 **必须** 走 Plan 模式?哪些可以直接 Edit?给出理由。
2. 项目级 CLAUDE.md 的四个必备章节是什么?为什么"禁忌"通常比"规范"更重要?
3. "API 先于 UI" 的开发顺序背后的具体原因是什么?反过来会发生什么?
4. 列出 4 件套(Hooks / Skills / MCP / Subagent)在一个典型 ticket 全流程里各自的 **具体使用场景** 。
5. CI 通过 ≠ 可以合并。给出至少 3 件 CI 检测不到、但 PR review 必须人工把关的事。

## 自检清单

8 ITEMS

- 写过一份覆盖"说明 / 规范 / 命令 / 禁忌"四章的厚 CLAUDE.md
- 跑通过 Plan 模式 → 落地 → 复盘的完整循环
- 在一个真实项目里跑通了 7 步 build pipeline 中至少 5 步
- 用 Subagent 完成过至少一个并行任务(同时改 3 处以上)
- 配置了至少 1 个 PostToolUse Hook 自动跑 lint / test
- 写过至少 1 个项目级 Skill,封装重复出现的 5+ 步操作
- 配过至少 1 个 MCP server,让 Claude 能查 db / GitHub / Slack 其中之一
- 项目有完整的 README + Dockerfile + CI workflow,能在云上跑起来

## 延伸阅读

3 LINKS

COOKBOOK

### Anthropic · Claude Code Cookbook

官方维护的真实场景配方集: 从单文件 CLAUDE.md 到完整 monorepo 配置,有大量可直接 fork 的模板。

TEMPLATE

### FastAPI + React Monorepo Starter

社区维护的全栈起手仓: 含 Dockerfile / GitHub Actions / pre-commit / VS Code 工作区配置,clone 即用。

CLASSIC

### The Twelve-Factor App

SaaS 设计的"圣经": 配置走 env、日志走 stdout、依赖明示、无状态进程——这些原则在 AI-driven 项目里更重要。

## Day 18 预告

NEXT

COMING NEXT

### 遗留代码与大型仓库 — 当代码不是你写的

今天你从零造了一个新项目——明天面对一个_十年代码库_。 用 Subagent 做"代码考古"摸清架构、用 MCP 拉 git history 还原决策、用 Plan 模式设计渐进式重构、 用 Hooks 在改老代码时强制走兼容路径——把"接手陌生项目"从一周的折磨变成两小时的导览。

"The best architectures, requirements, and designs emerge from self-organizing teams."

DAY 17 · CLAUDE CODE 20-DAY ROADMAP · AGILE MANIFESTO
