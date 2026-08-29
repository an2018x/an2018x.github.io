---
title: "Day 16 · 自动化工作流 — /loop · Cron · 后台执行 · Monitor"
date: '2026-05-22'
draft: false
description: "把 Claude 从『会话内的助手』变成『会话外的同事』——拆透 /loop 的两种节奏、Cron 的本地时区与抖动、Bash/Agent 的后台执行与回调、Monitor 的事件流与覆盖率铁律,再把四件套编排成一条真正能 24×7 运转的自动化流水线。"
toc: true
tags:
  - AI
  - Claude Code
  - Automation
  - Workflow
  - Tutorial
---

DAY 16 · CLAUDE CODE ROADMAP · 20 DAYS

# 自动化_让 Claude 在你离开时也能工作_

前 15 天的 Claude 都困在 **"你在键盘前"** 的会话里——你说一句、它做一步。 今天把这层墙拆掉:`/loop` 让它_自我节奏_地反复迭代, **Cron** 让它按本地时区准时上工, **Bash / Agent 后台** 把长任务推到一边继续干别的, **Monitor** 把外部世界的事件流连进对话。四件套编排起来,Claude 第一次有了"会话外的呼吸"—— 深夜跑训练、清晨自检 PR、整点轮询 CI——你睡觉,它接班。

**DURATION** 80–100 min **THEORY** 30 min **HANDS-ON** 50 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 16 思维导图**
>
> - DAY 16 · 自动化工作流
> - LOOP · CRON · BACKGROUND · MONITOR
> - 01 · LOOP
> - /loop 循环
> - 02 · CRON
> - 定时任务
> - 03 · BACKGROUND
> - 后台执行
> - 04 · MONITOR
> - 事件流监控
> - cron 模式 /loop 5m
> - dynamic 自我节奏
> - ScheduleWakeup
> - 自主 / 用户驱动
> - 5 字段本地时区
> - recurring vs 一次性
> - 7 天自动过期
> - 回避 :00 / :30 抖动
> - Bash run\_in\_background
> - Agent 后台并行
> - TaskOutput / TaskStop
> - 完成回调通知
> - stdout 行 = 事件
> - grep --line-buffered
> - 覆盖率铁律
> - persistent / 200ms 合批
> - 05 · ORCHESTRATION · 编排维度
> - 触发节奏
> - 外部时间? → Cron
> - 条件迭代? → /loop
> - 长任务? → BG / Agent
> - 外部事件? → Monitor
> - 完成信号
> - harness 自动回调
> - 不要 sleep 轮询
> - 不可见任务用 fallback
> - push 通知用户
> - 成本节流
> - 缓存 5 min TTL
> - \< 270s / \> 1200s 两档
> - 事件密度过高 → 收紧
> - 7 天自动过期续约
> - 风险边界
> - 仅 REPL idle 才触发
> - durable=false 默认
> - 覆盖失败信号
> - PushNotification 节制

FIG 00 · 自动化四件套 + 编排四维度 — 触发 · 完成 · 成本 · 风险

## /loop 循环

RHYTHM CONTROL

`/loop` 是 Claude Code 自带的 skill,把一个 prompt 或 slash command **反复执行** 。 看似只是定时器,但它真正的价值是把"何时再来一遍"这个决策 **交给模型** —— Claude 可以自己判断该 60 秒后再看一次,还是 30 分钟后再来。

### 两种节奏模式

> **图：/loop 两种模式**
>
> - MODE A · CRON 节奏
> - /loop 5m /check-ci
> - 用户显式给间隔——固定节奏触发
> - t
> - +5m
> - +10m
> - +15m
> - +20m
> - 底层走 CronCreate 注册周期任务
> - 适合: 监督 CI / 轮询队列 / 周期巡检
> - MODE B · DYNAMIC 节奏
> - /loop /watch-train
> - 省略间隔——模型每轮自己决定下次几秒后
> - +60s
> - +30m
> - 底层走 ScheduleWakeup 自适应延迟
> - 适合: 训练监控 / 部署等待 / 不确定时长

FIG 01 · /loop 两种节奏 — Cron 由用户给间隔,Dynamic 由模型自决

### Dynamic 模式怎么选 delay

| 延迟档 | 区间 | 缓存状态 | 适用场景 |
| --- | --- | --- | --- |
| 短延迟 | 60s – 270s | prompt 缓存命中 | 主动轮询 CI / 远端队列 / harness 无法回调的外部任务 |
| 长延迟 | 1200s – 3600s | 缓存 miss 但摊薄 | idle 心跳 / 兜底重试 / 长时间无变化的等待 |
| 禁区 | 300s 附近 | worst-of-both | 付了 cache miss 又没换来等待时间——直接避开 |
| 默认值 | 无具体信号要等就用 **1200–1800s** ;轮询 8 分钟左右的 CI 任务用 **≈270s** 跑两次 |

5 分钟整是 Anthropic prompt 缓存 TTL —— 跨过它就要重读全部历史,贵且慢

### 三种典型用法

```
# A · 用户驱动 + 固定 cron 节奏
/loop 10m /babysit-prs # 每 10 分钟检查 PR 状态

# B · 用户驱动 + 动态自适应节奏(无间隔参数)
/loop "盯着 dev.log,出现 ERROR 就告诉我并停下"

# C · 自主循环(autonomous loop)— Claude 主动给自己派活
# cron 模式调用 CronCreate,prompt 设为 sentinel: <<autonomous-loop>>
# dynamic 模式调用 ScheduleWakeup,prompt 设为: <<autonomous-loop-dynamic>>
# 两个 sentinel 不要混用
```

7 天自动失效——这是兜底安全网,不要赖它,长期任务要主动续

### 何时 **不** 用 /loop

SKIP · 01

### 一次性任务

"提醒我下午 2 点 30 检查部署"——直接用 `CronCreate` + `recurring:false`,触发一次即销毁,不需要循环骨架。

SKIP · 02

### 等单次完成

"build 完成时通知我"——用 `Bash run_in_background` 跑一个 until 退出的探测脚本,会话只会被叫醒一次。/loop 反而会反复执行无谓的轮询。

SKIP · 03

### 实时事件流

"每次出现 ERROR 就告诉我"——交给 `Monitor` 的 `tail -f | grep`。/loop 是定时器,Monitor 才是事件流;选错了要么漏事件、要么挂空轮询。

## Cron 定时任务

LOCAL TZ · 5 FIELDS

`CronCreate` 排一个 prompt 在未来某个 wall-clock 时间被注入会话。 它 **不是 Linux crontab** ——会话不在跑就不会触发,且仅在 REPL idle 时点火。 理解它的本地时区、jitter 和 7 天 TTL,你就能写出可预期、不踩坑的定时器。

### 5 字段语法 · 本地时区

```
# 字段顺序: 分 时 日 月 星期 — 全部按本机时区计算,不要做 UTC 换算
CronCreate(
  cron="57 8 * * *", # 每天 8:57(避开 9:00 高峰)
  prompt="做一次今日 standup 整理",
  recurring=True
)

# 常见模式
"*/5 * * * *" # 每 5 分钟
"7 * * * *" # 每小时第 7 分钟(不要写 0 * * * *)
"0 9 * * 1-5" # 工作日 9 点(若坚持整点)
"30 14 22 5 *" # 5 月 22 日 14:30 触发一次
```

CronCreate 用的是 Anthropic 自家调度器,不是系统 crontab,会话退出就停

### recurring vs 一次性

RECURRING · TRUE

### 周期任务

每次到点都触发,直到 7 天后自动过期或被 `CronDelete` 删除。模式带星号 / 区间(`*/5 * * * *`、`0 9 * * 1-5`)。

会自动加 **≤ 10% 周期** 的抖动(最多 15 分钟),用来错开和你同时段的其他用户。

RECURRING · FALSE

### 一次性闹钟

下一次 cron 匹配时触发,然后自动删除。 **4 个字段都必须 pin 死** (分/时/日/月),不能带 \*。

典型场景:"今天下午 2 点提醒我"——把今天的日和月也写进去,触发完即消。

### 为什么避开 :00 和 :30

> **图：抖动机制**
>
> - USER · 北京
> - cron: 0 9 \* \* \*
> - 9:00 准时
> - USER · 纽约
> - USER · 巴黎
> - → 全球同瞬冲击 API
> - 瞬时洪峰
> - 429 / 排队 / 限流
> - 解法 — 写 57 8 / 3 9 / 7 \*,把负载从整点错开

FIG 02 · 群体性整点踩踏 — 选偏移分钟把自己挪出洪峰

### 完整生命周期

```
# 1. 创建 — 返回 job ID
id = CronCreate(cron="7 * * * *", prompt="巡检 prod", recurring=True)

# 2. 查看所有定时任务
CronList()
# → [{id: "cron_abc", cron: "7 * * * *", next_fire: "14:07", ...}]

# 3. 删除某一条
CronDelete(id="cron_abc")

# 4. 跨会话存储(可选)— durable=True 会写到 .claude/scheduled_tasks.json
CronCreate(cron="57 8 * * 1-5", prompt="早会准备",
           recurring=True, durable=True)
# 用户明确要求"跨会话存活"时才打开,默认 False
```

CronList 是你的工作面板——不知道开过哪些定时任务就先 List 一下再说

## 后台执行

BACKGROUND TASKS

会话级的"并发":把长任务推到后台,Claude 接着干别的,任务完成时 **自动叫回** 。 Bash 和 Agent 都支持 `run_in_background:true`, 关键是知道 **什么时候开后台、怎么拿结果、什么时候停** 。

### 四种后台模式对比

| 工具 | 典型场景 | 结果获取 | 注意 |
| --- | --- | --- | --- |
| Bash · 前台 | 秒级命令、git diff、跑测试 | 同步等待 stdout/stderr | 2 分钟默认超时,最多 10 分钟 |
| Bash · run\_in\_background | npm run dev、长 build、单次"等条件成立" | 会话被 `<task-notification>` 唤回,Read 输出文件 | 用 until 循环包装,条件一到自然退出 |
| Agent · 前台 | 需要它的结论才能下一步 | tool result 直接到位 | 会占用你这一轮的时间 |
| Agent · BG | 并行的独立调研、互不相关的多分支 | 完成时回调, **不要 Read .output** (那是 jsonl 转录,会爆 context) | 用 Agent 工具结果本身,别去摸文件 |

### "等单次完成"惯用法

```
# 反例: tail -f | grep "Ready" 永不退出,后台一直挂
$ tail -f dev.log | grep "Ready in" # ❌

# 正解: until 循环,grep 命中即退出,会话立刻收到 1 次完成通知
$ until grep -q "Ready in" dev.log; do sleep 0.5; done

# 配合 Bash(run_in_background=true) 推到后台
# → Claude 干别的,直到看到 <task-notification> 就读 dev.log 后续
```

"等一次"用 Bash until + run\_in\_background;"等多次"才上 Monitor

### 回调架构

> **图：后台回调架构**
>
> - CLAUDE SESSION
> - REPL 主循环
> - 用户输入
> - 工具调用
> - 回到对话
> - 不阻塞 ↘
> - HARNESS TRACKER
> - task registry
> - task\_id ↔ pid
> - stdout buffer
> - exit watcher
> - 监听 SIGCHLD
> - BG PROCESS
> - npm run dev / agent
> - 独立 pid,自由跑
> - \<TASK-NOTIFICATION\>
> - 完成事件注入
> - 退出码 + 输出文件路径
> - spawn
> - exit ↑
> - wake

FIG 03 · 后台回调流 — Claude 不轮询,harness 把退出事件主动塞回对话

看到 \<task-notification\> 才动手——不要主动 sleep 等结果

### 主动停止与查询

```
# 后台任务跑歪了想中止
TaskStop(task_id="shell_abc123")

# 想阶段性看一眼(不阻塞)
TaskOutput(task_id="shell_abc123", block=False)

# 强行同步等到完成(慎用,失去后台的意义)
TaskOutput(task_id="shell_abc123", block=True, timeout=60000)

# Agent 后台任务: 不要 Read .output 文件(那是 jsonl 转录)
# 直接用工具返回的 result 字段;子 agent 完成时会触发同样的通知
```

## Monitor 监控

EVENT STREAM

Monitor 不是定时器,也不是后台任务——它是 **事件流** 。 启动一段长跑脚本,它的 **每一行 stdout 都自动作为一条通知** 注入会话。 Claude 在等待你打字时,事件流可以并行进来——这才是"实时"的本意。

### 核心比喻 — 一行 = 一个事件

```
# 监听日志,每条 ERROR 都成为一个通知
Monitor(
  description="errors in deploy.log",
  command="tail -f /var/log/deploy.log | grep --line-buffered ERROR",
  persistent=True
)

# 监听文件变化
Monitor(
  description="watching schema files",
  command="inotifywait -m --format '%e %f' src/schemas/",
  persistent=True
)

# 远端轮询 → 每条新评论一条事件
Monitor(
  description="new PR 123 comments",
  command="""last=$(date -u +%Y-%m-%dT%H:%M:%SZ)
            while true; do
              now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
              gh api 'repos/o/r/issues/123/comments?since='$last \\
                --jq '.[] | \"\\(.user.login): \\(.body)\"' || true
              last=$now; sleep 30
            done""",
  persistent=True
)
```

--line-buffered 不写,grep 会按 4KB 块缓冲——分钟级的延迟全因为这一行

### 覆盖率铁律 · 沉默不等于成功

> **图：覆盖率铁律**
>
> - ✗ 反例 — 只 grep 成功标记
> - tail -f run.log | grep --line-buffered \
> - "elapsed\_steps="
> - → 进程崩溃 / OOM / Killed 全部沉默
> - → 你以为"还在跑",其实早死
> - "沉默 = 还在运转"是错觉
> - ✓ 正解 — 覆盖所有终止形态
> - tail -f run.log | grep -E --line-buffered \
> - "elapsed\_steps=|Traceback|Error|\
> - FAILED|Killed|OOM"
> - → 进程崩了你也立刻收到
> - → 噪声多一点 \>\> 漏掉失败

FIG 04 · 写过滤器的金科玉律 — 问自己: "如果它现在崩了,我会知道吗?"

### 何时用 Monitor、何时用别的

| 需求 | 正确工具 | 原因 |
| --- | --- | --- |
| 一次性通知 | Bash · run\_in\_background | 命令一退出就唤回,Monitor 反而会因为命令不退出而挂到 timeout |
| 每次出现就通知 | Monitor (unbounded) | `tail -f` / `inotifywait -m` / `while true` 都不退出 |
| 多次但有终点 | Monitor (会自然退出) | 循环检查 CI 步骤,全 done 时 break 退出——既要进度也要终结 |
| 固定节奏巡检 | CronCreate 或 /loop 5m | 不是流式事件,本质是周期任务 |

### 事件密度与节流

RULE · 01

### 200 ms 内合批

同一个事件的多行 stdout(比如一段栈)会自动合并成一条通知,所以脚本可以放心一次 echo 多行——视觉上是一个事件。

RULE · 02

### 过密会被自动停

事件率超阈值会被 harness 强行终止——重启时把过滤器收紧。 **用 grep / awk / 包装脚本** 提前过滤,不要把 raw log 喂进去。

RULE · 03

### persistent 与 timeout

默认 `timeout_ms=300000`(5 分钟),会话级长跑要显式 `persistent:true`;否则你刚开 PR 监控,5 分钟就被自己 kill 掉。

## 编排无人值守工作流

PUTTING IT TOGETHER

四件套各有所长,真正的力量在 **组合** 。 这一节给一张"看症状选工具"决策图,再用三个真实场景演示怎么把它们串起来—— 理解了之后,你就能为自己的工作流写一张属于自己的 SOP。

### 决策图 — 看症状选工具

> **图：工具选择决策图**
>
> - QUESTION
> - 我要让 Claude 在会话外做某件事
> - 触发是…
> - 外部 wall-clock 时间?
> - "每天早上 9 点"
> - CronCreate
> - recurring=True · "57 8 \* \* \*"
> - 条件成立 → 再来一遍?
> - "直到 PR 全绿"
> - /loop (dynamic)
> - 模型自决 delay
> - 一个长任务 → 等完?
> - "build 好通知我"
> - Bash run\_in\_background
> - until + 退出码
> - 外部源源不断事件?
> - "日志出 ERROR"
> - Monitor
> - persistent=True
> - SECOND-ORDER · 复杂任务 = 组合多个
> - 每天巡检 = Cron + Agent
> - 训练监督 = BG + Monitor
> - PR 跟踪 = /loop + Monitor

FIG 05 · 一级问题选基础工具,二级问题用组合 — "什么触发"决定第一选择

### 三个组合模板

TEMPLATE · 01

### 夜班训练监督

晚上扔出训练任务,白天回来看结果。

**Bash run\_in\_background** 跑训练脚本(`python train.py 2>&1 | tee run.log`); 同时开一个 **Monitor** 盯 run.log 的进度 + 失败信号; 训练结束的 task-notification 会自动叫回会话,Claude 收尾并写报告。

关键: Monitor 的 grep 一定要覆盖 OOM/Killed/Traceback

TEMPLATE · 02

### 每日 standup 整理

工作日 8:57 自动整理今天行程 + 待办。

**CronCreate** (`"57 8 * * 1-5"`, durable=True) 注入 prompt; 该 prompt 里调用 **Agent** 并行查日历、查 PR、查任务清单; 最后 **PushNotification** 推到手机。

用 8:57 避开整点,durable 保证重启后仍生效

TEMPLATE · 03

### PR 全绿守望

提交完 PR,人去开会,自动盯到 merge。

**/loop** dynamic 模式驱动节奏; 每轮里用 **Bash** 同步查一次 PR 状态; 出现失败用 **Monitor** 实时跟错误日志; 全绿就 break 退出循环 + 推送。

delay 取 270s——CI 通常 8 分钟,跑两轮就在缓存内

META · 反模式

### 不要做的事

① 用 /loop 1m 当 Monitor 替身—会 sleep 满 1 分钟才看一眼。
② 用 Monitor + tail -f 等"一次性成功"—永远不退出。
③ Bash 后台跑 + 自己 sleep 轮询—harness 会自动通知,sleep 是在烧 token。
④ Cron 写 0 9 \* \* \*—和半个地球的人挤同一秒。

### 通知用户的纪律

```
# PushNotification: 把用户从其他事抓回来,代价是注意力
PushNotification(
  status="proactive",
  message="build failed: 2 auth tests · main.py:42"
)

# 该推:
  · 长任务完成、有等他做决定的事、用户明确要求 ping

# 不该推:
  · 例行进度、刚问完的事的回答、几秒钟就完的任务

# 信息密度: "build failed: 2 auth tests" 比 "任务完成"信息量大 10 倍
```

无人值守的最后一公里 — 决定"什么时候打扰"和"打扰说什么"

## Labs

4 HANDS-ON

四个递进的实验——从最简单的一次性闹钟,到完整的"训练 + 监控 + 推送"组合。 预计 50 分钟,每个 Lab 结束后用 `CronList` / 查后台任务 ID 自检, 避免无意中留下后台跑的脏数据。

LAB · 01 · 8 MIN

### 一次性闹钟

用 `CronCreate` + `recurring:false` 设一个 5 分钟后的闹钟,prompt 写"提醒我喝水"。验证: 时间到时会话自动收到 prompt,然后自我销毁(`CronList` 不应再看到这条)。

目标: 体会 pin 死全部 4 字段 + 自动销毁机制

LAB · 02 · 12 MIN

### Bash 后台 + until

启动 `npm run dev` 到后台,同时跑一个 `until grep -q "Ready in" dev.log; do sleep 0.5; done` 探测脚本。验证: 探测脚本退出时收到 task-notification,Claude 自动跳到下一步(比如打开浏览器测试)。

目标: 掌握"等单次完成"惯用法,体会 harness 自动回调

LAB · 03 · 15 MIN

### Monitor 错误流

写一个会随机 echo 不同级别日志的 bash 脚本(80% INFO, 15% WARN, 5% ERROR),跑 `Monitor` 用 `grep -E "ERROR|FATAL|Killed"` 过滤。让脚本跑 3 分钟,统计你收到多少通知,有没有漏掉某条 ERROR。

目标: 内化"覆盖率铁律"与 --line-buffered 的必要性

LAB · 04 · 15 MIN

### 完整组合 — PR 守望者

给一个真实 PR 起一个 **/loop** dynamic 监督(delay 取 270s 内); 每轮调 `gh pr checks` 看状态; 同时启一个 **Monitor** 盯 `gh pr view --json reviews` 的新评论; 全绿时 break + PushNotification 推送。跑一次真实 PR,自己掐表算端到端响应时延。

目标: 把四件套真正串起来,理解组合的价值

## 常见问题

6 FAQS

### Q · 01 · CronCreate 和 Linux 的 crontab 是同一个东西吗?

A ·

不是。Linux crontab 是 **系统级** 的,服务起着就能跑;CronCreate 注册的任务 **只在 Claude 会话进程内** 有效——会话退出,定时器全部失效(除非显式 `durable:true` 写到 `.claude/scheduled_tasks.json`)。

正确的心智模型:CronCreate 是" **这个会话内的提醒服务**",不是真的 cron。需要 7×24 持续跑的任务,要么 durable=True 启动器(配合 `claude --continue`),要么真的写到系统 crontab 调 `claude --print "..."`。两条路各有取舍——前者保留对话上下文,后者真正后台化但每次冷启。

### Q · 02 · /loop 跑了一会就停了,但我没让它停——为什么?

A ·

三个常见原因:(1) **7 天 TTL 到了** ——所有 recurring 任务都有上限,最后一次触发完自动清掉,这是兜底安全网;(2) **Claude 在 dynamic 模式里主动收手** ——它判断任务已完成或永远不会完成时会停止安排下一次 ScheduleWakeup; (3) **会话被压缩了** ——超长对话被自动 compact 后,/loop 内存里的状态可能丢。

诊断顺序: `CronList` 看任务是否还在 → 看最近一轮 prompt 的输出有没有"我决定停下"的迹象 → 检查 session 是否被中断/重启。如果是必须长期跑的任务,加 durable=True 并加业务层的"再启动"逻辑——别完全依赖 7 天兜底。

### Q · 03 · 后台 Bash 任务,我想阶段性看进度,Read 输出文件够吗?

A ·

够,而且这是 **推荐做法** 。`Bash(run_in_background=true)` 返回的就是输出文件路径,你直接 Read 就能拿到截至当下的 stdout/stderr。也可以用 `TaskOutput(task_id=X, block=False)` 不阻塞地看一眼当前状态。

例外: **Agent 后台任务** 不要 Read 它的 .output 文件——那是 sub-agent 完整对话转录(JSONL),包含每一轮思考与工具调用,Read 进来会把你的 context 撑爆。Agent 的最终结论用工具返回的 result 字段拿,中间过程信任 sub-agent 不要插手。

### Q · 04 · Monitor 启动后没收到任何通知,但脚本明明在产生日志——为什么?

A ·

九成是 **缓冲问题** 。`grep` / `awk` 默认按 4KB 块缓冲,只有写满才 flush——日志慢的情况下,你要等很久才看到第一条。解法是给 grep 加 `--line-buffered`,给 sed 加 `-u`,给 awk 用 `fflush()`。这个坑专治"我明明 echo 了它怎么没反应"。

第二种可能: 脚本输出走了 stderr 而不是 stdout(Monitor 只把 stdout 当事件流)。修复: 在管道前面加 `2>&1` 把 stderr 也合并进 stdout。第三种: 命令本身 buffer 重(Python 默认 line-buffered 但需要 `-u`;Node 在 pipe 输出时是 block-buffered)——用 `stdbuf -oL command` 强制行缓冲是万能补丁。

### Q · 05 · 自动化跑起来很爽,但 token 账单也涨了——怎么省?

A ·

三个核心节流策略: (1) **选对 delay 区间** ——dynamic /loop 不要用 5 分钟附近(prompt 缓存 TTL 是 5 分钟,300 秒是 worst-of-both); (2) **让 Monitor 过滤更窄** ——每条 stdout 都是一条 message,raw log 直接灌进来很贵,在脚本里 grep / awk 先过滤; (3) **谨慎给 Agent 后台并行** ——sub-agent 自己也消耗 token,只在真正独立的工作上拆 agent。

另外一个隐性大头: 每个 /loop tick 都会重读会话历史。如果你的对话已经很长,/loop 5m 一天烧的 input token 会让你大跌眼镜。可行做法是把长期监控搬到独立 session(`claude --print "..."`),只在出关键事件时回主对话——本质上是把"上下文负担"从循环里挪出去。

### Q · 06 · 这套自动化和 Day 14 的 Agent 是什么关系?

A ·

两个正交维度。 **Agent 是"空间维度"的并行** ——把一件大事拆成几份让多个 Claude 同时干; **自动化是"时间维度"的延展** ——让 Claude 在你不在键盘前的时刻继续工作。它们经常组合: Cron 触发一个 prompt,这个 prompt 内部启动 3 个 Agent 后台跑——空间 × 时间。

判断标准: 任务能不能 **同时** 开始?能就拆 Agent; 任务需要 **未来某时** 开始?用 Cron / /loop; 任务是 **持续** 的输入流?用 Monitor。三个维度独立选,组合时一加就强。Day 14 帮你把一个大任务并行化,Day 16 帮你把所有任务"出会话"——前者增加单次处理量,后者让 Claude 跨越会话边界。

## 复习题

5 QUESTIONS

1. /loop 的 cron 模式和 dynamic 模式有什么区别?分别在什么场景下用?
2. CronCreate 的 5 字段语法用的是什么时区?为什么要避开整点和半点?7 天 TTL 意味着什么?
3. "等单次完成"为什么应该用 Bash + run\_in\_background + until,而不是 Monitor + tail -f?
4. Monitor 写过滤器时"覆盖率铁律"是什么?给出一个反例和一个正例。
5. 设计一个"24×7 监督 prod 错误率"的工作流:用上 Cron + /loop + Monitor + PushNotification,说出每个工具承担什么角色。

## 自检清单

8 ITEMS

- 能区分 /loop 的 cron 模式与 dynamic 模式,知道 delay 的两档安全区
- 能写出本地时区的 5 字段 cron,并主动避开 :00 / :30 整点
- 知道 CronCreate 默认 recurring=True,以及 recurring=False 必须 pin 死 4 字段
- 跑通过一次 Bash run\_in\_background + until 的"等单次完成"模式
- 会写带 --line-buffered + 覆盖失败信号的 Monitor 过滤器
- 区分得清 Bash 后台 / Agent 后台 / TaskOutput / TaskStop 的用法
- 知道 Agent 后台任务 **不要** 去 Read 它的 .output 文件
- 能为一个真实场景画出"决策图"——选对工具,必要时组合

## 延伸阅读

3 LINKS

SKILL · /loop

### loop skill 源码

看 Claude Code 自带 skill 的实现——dynamic 模式怎么调 ScheduleWakeup、autonomous sentinel 怎么解析、cron 模式如何向 CronCreate 派发。读完再写 /loop 心里就有底。

SPEC · CRON

### Cron 5-field 标准

POSIX crontab 5 字段语义、范围、星号、列表、步长写法。注意 Claude Code 的实现不接 @reboot 等扩展词,只接最朴素的 5 字段。

PRACTICE

### Anthropic 工程博客

"How we use Claude Code" 系列里关于后台任务与监控的实战——团队怎么用 /loop 监督 CI、怎么编排夜间训练监控、怎么节制 PushNotification 不打扰队友。

## Day 17 预告

NEXT

COMING NEXT

### 全栈项目实战 — 从零搭建: CLAUDE.md → 脚手架 → API → 前端 → 测试 → 部署

P4 结束,P5 实战开场。明天把前 16 天学到的所有能力_一次性_串起来—— 用自然语言从空目录走到上线: 先写一份精确的 CLAUDE.md 定项目宪法; 用 Agent 并行起脚手架、API、前端三条线; 用 Plan 模式做关键架构决策; 用 MCP 接数据库与 Slack; 用今天的自动化跑端到端测试与持续部署。一天写完一个能 demo 的全栈应用——这才是 Claude Code 的正确打开方式。

"Civilization advances by extending the number of important operations which we can perform without thinking of them."

DAY 16 · CLAUDE CODE 20-DAY ROADMAP · ALFRED NORTH WHITEHEAD
