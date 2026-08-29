---
title: "Day 10 · Hooks 钩子系统 — 完整事件 · 自动格式化 · 自动测试 · Shell & HTTP"
date: '2026-05-18'
draft: false
description: "把 Day 07 的 Hooks 入门带到生产级——掌握全部 9 种钩子事件、Shell 与 HTTP 两种处理器、自动格式化与自动测试的最佳实践，以及 hook 调试、撤销与阻断机制。让规则自动执行，不再依赖记忆。"
toc: true
tags:
  - AI
  - Claude Code
  - Hooks
  - Automation
  - Tutorial
---

DAY 10 · CLAUDE CODE ROADMAP · 20 DAYS

# Hooks 钩子系统_让规则自动执行_

Day 07 你认识了 Hooks——今天把它推到_生产级_。 9 种钩子事件覆盖整个会话生命周期；Shell 与 HTTP 两类处理器各管一摊； 自动格式化、自动测试、阻断危险命令、记录审计日志，全部交给 hook。 Claude 不再依赖你"记得"做这些——规则一旦写进 `settings.json`，就再也无法被绕过。

**DURATION** 75–90 min **THEORY** 25 min **HANDS-ON** 45 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 10 思维导图**
>
> - DAY 10 · Hooks 钩子系统
> - EVENTS · MATCHER · SHELL · HTTP
> - 01 · EVENTS
> - 9 种钩子事件
> - 02 · CONFIG
> - 配置与匹配
> - 03 · FORMAT/TEST
> - 自动格式化 + 测试
> - 04 · TRANSPORT
> - Shell vs HTTP
> - PreToolUse / PostToolUse
> - UserPromptSubmit
> - SessionStart / End
> - Stop / PreCompact …
> - 三层嵌套 JSON
> - Matcher 正则规则
> - stdin / stdout 协议
> - 退出码语义
> - prettier / black / gofmt
> - PostToolUse(Edit) 触发
> - npm test / pytest
> - 失败阻断 / 反馈
> - Shell 命令(本地)
> - HTTP webhook(远程)
> - 阻塞 vs 异步
> - 审计 / Slack 通知
> - 把规则编码为 hook——比口头叮嘱可靠一万倍
> - PRETOOLUSE
> - AUTO FORMAT
> - AUTO TEST
> - EXIT CODE 2

FIG M — DAY 10 KNOWLEDGE MAP · COMPLETE HOOK SYSTEM

## 9 种钩子事件

EVENT LIFECYCLE

Day 07 只介绍了 `PreToolUse` 和 `PostToolUse`—— 它们其实只是钩子家族的两位成员。整套系统覆盖了从会话启动到上下文压缩的_完整生命周期_， 每一个事件都是一个可以注入自动化的接口点。

### 完整事件列表

| 事件 | 触发时机 | 典型用途 |
| --- | --- | --- |
| PreToolUse | 工具调用之前——可以审查参数、决定放行或阻断 | 阻止危险命令、二次确认、参数注入 |
| PostToolUse | 工具执行之后——结果已写回，可触发副作用 | 自动格式化、运行测试、记录审计 |
| UserPromptSubmit | 用户按下回车提交 prompt 之后、Claude 收到之前 | 注入项目上下文、PII 脱敏、敏感词拦截 |
| SessionStart | 每个 Claude Code 会话刚开始时 | 读取项目元数据、激活上下文、欢迎横幅 |
| SessionEnd | 会话结束/退出时 | 导出对话日志、统计 token 用量 |
| Stop | Claude 主动结束本轮回答时 | 推送桌面通知、发送 Slack 完成提醒 |
| SubagentStop | 子代理（subagent）任务完成时 | 聚合多个 agent 结果、并行任务汇总 |
| PreCompact | 上下文即将被自动压缩之前 | 持久化关键信息到 memory、保存草稿 |
| Notification | Claude 需要用户注意（如等待权限确认）时 | 系统通知中心 / 微信机器人提醒 |

完整事件列表见 docs/hooks-reference；少数事件随版本迭代会新增

### 事件在会话中的时间线

> **图：Hook 事件时间线**
>
> - SessionStart
> - UserPromptSubmit
> - 用户提交
> - PreToolUse
> - 调用前
> - PostToolUse
> - 调用后
> - Notification
> - 需要确认
> - Stop
> - 本轮结束
> - SessionEnd
> - REPEAT · EACH · TURN
> - 单轮对话中触发的 5 个核心 hook

FIG 01 · CONVERSATION TIMELINE — HOOK FIRING ORDER

## 配置与匹配语法

SETTINGS.JSON

所有 hook 都在 `settings.json` 中声明。 结构是固定的三层嵌套—— **事件 → matcher → 处理器** —— 把这个心智模型刻进脑子，剩下的都是细节。

### 骨架结构

```
// .claude/settings.json
{
  "hooks": {
    // 第 1 层：事件名
    "PostToolUse": [
      {
        // 第 2 层：matcher（哪些工具会触发）
        "matcher": "Edit|Write|MultiEdit",

        // 第 3 层：处理器列表
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Matcher 写法

| 写法 | 含义 | 示例 |
| --- | --- | --- |
| "Bash" | 精确匹配单个工具名 | 只在 Bash 工具调用时触发 |
| "Edit\|Write" | 正则 OR——匹配多个工具 | 编辑或写入文件时都触发 |
| "mcp\_\_.\*" | 正则模式——匹配所有 MCP 工具 | 对所有外部 MCP 调用进行审计 |
| "" 或 "\*" | 留空 / 通配——匹配所有工具 | 全局日志记录 |
| 注意 | matcher 只在 `PreToolUse` 与 `PostToolUse` 上生效——其他事件不需要 matcher | — |

### stdin/stdout 协议

Hook 脚本通过 **stdin** 接收一个 JSON 对象（包含工具名、参数、上下文），通过 **stdout** 返回处理结果，通过 **退出码** 表达通过/拒绝。

> **图：Hook IO 协议**
>
> - CLAUDE CODE
> - 触发事件
> - STDIN · JSON
> - YOUR HOOK
> - 脚本/HTTP
> - STDOUT · DECISION
> - EXIT CODE
> - 0 = 通过
> - 2 = 阻断
> - 单向数据流 · 退出码即决策 · stdout 是给 Claude 的反馈

FIG 02 · HOOK IO PROTOCOL — STDIN / STDOUT / EXIT

### 退出码语义

EXIT 0

### 静默通过

一切正常，Claude 看不到 hook 跑过的任何痕迹。stdout 内容会被丢弃。

EXIT 2

### 阻断 + 反馈

阻止工具继续执行；stderr 的内容会作为反馈传给 Claude，让它知道为什么被阻止、可以怎么改。

EXIT 其他

### 非阻断警告

不阻断，但 stderr 会被 Claude 看到——适合"提醒但不强制"的场景。

## 自动格式化 & 自动测试

PRACTICAL PATTERNS

所有 hook 用法中， **自动格式化** 与 **自动测试** 是收益最高的两类。 每次 Claude 修改完文件，立刻自动 prettier / black / pytest， 让 Claude 自己看到结果——这是把 LLM 编程从"凑合能跑"提升到"工业级可信"的关键习惯。

### Pattern A · 编辑后自动格式化

```
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format.sh"
      }]
    }]
  }
}
```

```
#!/bin/bash — .claude/hooks/format.sh
# 读取 stdin 拿到改动文件路径
file=$(jq -r '.tool_input.file_path // empty')
[-z "$file"] && exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx) npx prettier --write "$file" ;;
  *.py) black --quiet "$file" ;;
  *.go) gofmt -w "$file" ;;
  *.rs) rustfmt "$file" ;;
  *.json|*.yml|*.yaml) npx prettier --write "$file" ;;
esac

# exit 0 —— 静默通过，Claude 看不到，但磁盘上的文件已经被格式化了
```

这个 hook 每次都跑得很快（\< 500ms），不影响交互体验

### Pattern B · 修改源码后自动测试

```
#!/bin/bash — .claude/hooks/auto-test.sh
file=$(jq -r '.tool_input.file_path // empty')
[-z "$file"] && exit 0

# 只对 src/ 下的代码触发测试，跳过 docs / config
[[! "$file" =~ ^src/]] && exit 0

# 只跑相关测试，不是全量——速度优先
test_file="${file//src/test}"
test_file="${test_file%.ts}.test.ts"

if [-f "$test_file"]; then
  if ! npx vitest run "$test_file" 2>&1 | tail -20; then
    # 测试失败 → 把失败信息写到 stderr + exit 2 阻断
    echo "⚠ 测试失败:$test_file,请修复后再继续" >&2
    exit 2
  fi
fi

exit 0
```

关键：失败时 exit 2 + stderr——Claude 会收到反馈并自动修复

### 何时阻断、何时静默

SILENT · EXIT 0

### 格式化、排版、import 排序

幂等操作——无论运行多少次结果一样，没有副作用。让 Claude 不知道有 hook 在跑，体验最丝滑。

BLOCK · EXIT 2

### 测试失败、Lint 报错、类型错误

必须修复才能继续的"硬错误"。stderr 写清楚错误位置和原因，Claude 下一步会自动尝试修复。

WARN · EXIT 1

### 性能下降、覆盖率掉、deprecation

不阻断流程但要让 Claude 知道——它可以选择立刻处理或忽略到最后。

ABORT · EXIT 2

### 危险命令、生产数据库、敏感文件

无论如何不能放行。PreToolUse 拦截 + 退出码 2 + 清晰的 stderr 说明为什么。

### Pattern C · UserPromptSubmit 注入项目上下文

```
#!/bin/bash — .claude/hooks/inject-context.sh
# 在每次 prompt 提交前自动塞入当前 git 状态
{
  echo "=== 当前 git 状态 ==="
  git status --short
  echo "=== 最近 3 个 commit ==="
  git log --oneline -3
} | jq -Rs '{ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: . } }'
```

UserPromptSubmit 的 stdout 直接以 JSON 注入到 prompt 上下文中

## Shell 钩子 vs HTTP 钩子

TWO TRANSPORTS

Hook 的处理器有两种形态：本地 **shell 命令** ，或调用远端 **HTTP webhook** 。 前者更快、更私密；后者跨机器、跨团队、能集成 Slack/PagerDuty 这类协作工具。

### 对比一览

| 维度 | Shell 钩子 | HTTP 钩子 |
| --- | --- | --- |
| 延迟 | ~10–500ms（本地） | ~100ms–数秒（依赖网络与对端） |
| 权限 | 继承当前用户、可以读写本地文件 | 无本地权限，只能影响远端服务 |
| 跨机器 | 否——只能在执行 Claude Code 的机器上跑 | 是——可以触发任意能接收 HTTP 的服务 |
| 团队共享 | 每个开发者要在本地有这个脚本 | 统一在服务端配置，所有人共享 |
| 典型场景 | 格式化、测试、lint、阻断危险命令 | Slack 通知、审计日志、CI 触发、合规上报 |

### HTTP 钩子配置

```
// settings.json — HTTP 类型 hook
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "webhook",
        "url": "https://audit.internal.corp/claude-bash",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer ${AUDIT_TOKEN}"
        },
        "timeout": 5
      }]
    }]
  }
}
```

### 三种生产模式

PATTERN · 01

### Slack 完成通知

用 `Stop` 事件 + HTTP 钩子调用 Slack incoming webhook——长任务跑完自动 @你。离开终端去吃饭也不会错过结果。

PATTERN · 02

### 合规审计上报

用 `PreToolUse(Bash)` + HTTP 钩子把每次 shell 命令推送到中央审计服务。SOC 2 / ISO 27001 必备。

PATTERN · 03

### 桌面通知中心

用 `Notification` 事件 + Shell 钩子调 `terminal-notifier` / `notify-send`——Claude 需要确认时自动弹通知。

### Shell + HTTP 组合示例

```
#!/bin/bash — .claude/hooks/audit-with-slack.sh
# 既写本地 audit log,也推 Slack——Shell 钩子里调 HTTP

payload=$(cat) # 从 stdin 读 JSON
tool=$(echo "$payload" | jq -r '.tool_name')
cmd=$(echo "$payload" | jq -r '.tool_input.command // ""')

# 本地审计 log
echo "[$(date -Iseconds)] $tool: $cmd" >> ~/.claude/audit.log

# 高危命令推 Slack
if [["$cmd" =~ (rm -rf|drop table|DELETE FROM)]]; then
  curl -s -X POST "$SLACK_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"⚠ Claude attempted: $cmd\"}"
fi

exit 0
```

最常见的"既要审计、又要通知"的组合用法

## 调试与最佳实践

PRODUCTION CRAFT

Hook 不是"写完就忘"——它会在生产环境跑成百上千次。 下面是把 hook 调到稳定可信的几个关键习惯。

### 调试命令

CMD · 01

### `/hooks`

在 Claude Code 里直接打——列出当前会话所有激活的 hook、它们的 matcher 与处理器路径。

CMD · 02

### `claude --debug`

启动 Claude 时加这个标志，每次 hook 触发都会在 stderr 打印 stdin / stdout / 退出码——调试金标准。

CMD · 03

### 本地手动跑

把样例 JSON `echo '...' | ./hooks/format.sh` 喂给脚本，直接看输出——比在 Claude 里调试快 10 倍。

CMD · 04

### `tail -f audit.log`

所有 hook 都写本地日志，开第二个终端 tail 它——任何不对劲都能立刻看见。

### 8 条铁律

- **始终给 hook 加 timeout** ——默认 60s，但格式化只要 5s 就够，超时 = 用户卡死
- 用 `${CLAUDE_PROJECT_DIR}` 而不是相对路径，避免 cwd 漂移
- 幂等：同样的输入跑 100 次结果必须一致——hook 不该有副作用顺序依赖
- 失败要"响"：stderr 写清楚 **哪个文件、哪一行、为什么** ，让 Claude 能自动修
- 分离环境：开发环境的 audit 别送到生产审计端点
- 团队 hook 进 git（`.claude/settings.json`），个人偏好放 `settings.local.json`
- HTTP hook 必须配 timeout 和重试上限——远端挂了别拖累本地
- 用 `jq` 而不是 grep——hook 的输入是 JSON，正则会咬人

### 常见反模式

❌ ANTI · 01

### PostToolUse 跑全量测试

每次 Edit 都跑 `npm test`——单次几分钟，会让 Claude 的每一步都变成等待。改成只跑相关测试或挪到 Stop 事件。

❌ ANTI · 02

### PreToolUse 调用外部 API

每次工具调用前都打 HTTP 校验——网络一抖就阻塞所有操作。改成异步或挪到 PostToolUse。

❌ ANTI · 03

### 失败不打日志

hook 静默退出非 0——Claude 收不到反馈、你看不到为什么。永远写 stderr。

❌ ANTI · 04

### hook 里改 Claude 改过的文件再 exit 0

Claude 不知道文件被改过、后续可能写脏。要么 exit 2 强制让 Claude 重新读，要么明确告诉它"文件已被 hook 重写"。

## Labs

4 HANDS-ON

四个递进的动手实验——从最简单的格式化 hook 到完整审计流。 预计 45 分钟，建议在一个真实项目里跑通，每个 lab 结束后用 `/hooks` 命令检查。

LAB · 01 · 10 MIN

### 自动格式化 hook

在 `.claude/settings.json` 写一个 `PostToolUse` matcher `"Edit|Write"`，hook 调用 `prettier --write`。让 Claude 改一个 `.ts` 文件，确认磁盘上的格式被自动统一。

目标：跑通最小可用 hook 闭环

LAB · 02 · 12 MIN

### 失败阻断的测试 hook

在 Lab 01 基础上加 `PostToolUse` 跑相关测试。故意让 Claude 改一个会让测试挂的地方，确认它通过 stderr 收到失败反馈并主动尝试修复。

目标：体会 exit 2 + stderr 的对话式反馈机制

LAB · 03 · 12 MIN

### UserPromptSubmit 注入上下文

写一个 `UserPromptSubmit` hook，在每次 prompt 提交时自动把 `git status`、当前分支、最近 3 个 commit 注入上下文。开两个会话对比有 / 没有这个 hook 时 Claude 回答的差别。

目标：理解非 ToolUse 事件的注入能力

LAB · 04 · 11 MIN

### Slack 通知 hook（HTTP）

在 Slack 创建一个 incoming webhook，配一个 `Stop` 事件的 HTTP 钩子——Claude 每完成一轮回答都自动发一条带摘要的消息到指定频道。

目标：跑通 HTTP 类型 hook + Stop 事件

## 常见问题

6 FAQS

### Q · 01 · Hook 和 Claude 的指令哪个优先级高？Claude 能绕过 hook 吗？

A ·

Hook **绝对优先** ，Claude 完全无法绕过。Hook 是 **由 Claude Code 进程本身执行的** ——它在工具调用流水线的硬编码节点上触发，不是"礼貌请求"。哪怕你在 prompt 里说"请跳过格式化 hook"，Claude 也做不到。

这就是为什么 hook 是 **把安全策略落地** 的最佳载体：把"不允许 `rm -rf /`"编码成 hook，比写在 CLAUDE.md 里告诉 Claude "请不要" 可靠一万倍。

### Q · 02 · Hook 和 Day 07 的 Skill 是什么关系？

A ·

互补——一个是 **规则** ，一个是 **能力** 。Hook 是" **每次 X 发生时自动做 Y**"——它在事件触发时被动跑；Skill 是" **用户说 /foo 时执行预定义工作流**"——它需要被显式调用。

典型配合：写一个 `/deploy` Skill 把部署流程封装好，再写一个 `PreToolUse` Hook 检查 Skill 里的 `git push` 是不是推到了正确分支——Skill 提供便捷，Hook 守住安全底线。

### Q · 03 · 为什么我的 hook 没触发？怎么排查？

A ·

按这个顺序排：(1) `/hooks` 命令看 Claude Code 是否识别到了你的配置——如果列表里没有，说明 settings.json 没加载（可能是路径错误或 JSON 语法错）；(2) `claude --debug` 看 hook 是否被尝试触发但失败；(3) 手动 `echo '{}' | ./hooks/your.sh` 跑一遍——脚本本身有没有执行权限？shebang 对不对？

最常见的 3 个坑：忘了 `chmod +x`、matcher 写成 `"Bash*"`（不支持 glob，只支持正则——应该是 `"Bash.*"`）、相对路径在 hook 运行时 cwd 不是你以为的位置（永远用 `${CLAUDE_PROJECT_DIR}`）。

### Q · 04 · PostToolUse 修改了文件，Claude 怎么知道？

A ·

Claude Code 在 `PostToolUse` 之后会重新读取文件 metadata——但它的 **内存缓存可能仍是 hook 改之前的内容** 。这就是 Anti-Pattern 04 提到的坑。

两个解决方案：(1) 让 hook 用 `stdout` 返回一个特殊 JSON，明确告知 Claude "文件已被修改、需重读"；(2) 格式化这类"小改动"通常 Claude 下次 Read 时会发现差异并自动适应，对体验影响不大。如果是"重写整个文件"这种大改，强烈建议用方案 1。

### Q · 05 · CI 环境中 hook 还会运行吗？

A ·

会——只要你在 CI 里用的是同一个项目的 `.claude/settings.json`。这通常是好事（CI 里也跑格式化和测试），但要注意两点：

(1) CI 环境可能没有本地脚本依赖（prettier、black 等）——确保 CI 工作流的 `npm ci`/`pip install` 装齐了；(2) 把 **会发通知的 hook** （Slack 提醒、桌面通知）放进 `settings.local.json` 或用环境变量门控——不然每次 CI 跑都发 Slack 消息，所有人会想暴打你。

### Q · 06 · Hook 出错了 Claude 会崩溃吗？

A ·

不会崩，但行为分两种情况：(1) **PreToolUse hook** 出错且 exit 非 0——Claude 会按"被阻断"处理，工具不会执行，stderr 内容传给 Claude 看；(2) **PostToolUse hook** 出错——工具已经执行完了，hook 错误不会回滚结果，只会被记录到 debug 日志。

所以最危险的不是 hook 崩，是 **hook 静默失败** ——比如格式化脚本写错了路径，每次都 exit 0 但实际什么都没做。这就是为什么要有 audit 日志 + `tail -f` 监控习惯。

## 复习题

5 QUESTIONS

1. 列出至少 6 种 Hook 事件名，说明它们各自的触发时机。
2. `PostToolUse` 的 hook 如何把"测试失败"反馈给 Claude？退出码与 stderr 各扮演什么角色？
3. Matcher 字段的 `"Edit|Write"` 与 `"Edit"` 有什么区别？为什么用正则不用 glob？
4. Shell 钩子 与 HTTP 钩子的核心差异是什么？各举一个最合适的场景。
5. 请写出三条"hook 反模式"——并说明它们为什么会让用户体验变糟。

## 自检清单

8 ITEMS

- 能说出至少 6 种钩子事件及它们的触发时机
- 理解 settings.json 中 hook 的三层嵌套结构（事件→matcher→处理器）
- 能用 `"Edit|Write|MultiEdit"` 这类正则 matcher 精确选定触发工具
- 掌握 exit 0 / exit 2 / 其他退出码的语义差异
- 已为项目写好 `PostToolUse` 自动格式化 hook
- 能用 `/hooks` 与 `claude --debug` 调试 hook 行为
- 知道 Shell 与 HTTP 两种处理器各自的适用场景
- 了解 4 条常见反模式，并能在自己的 hook 中规避

## 延伸阅读

3 LINKS

DOCS

### Claude Code — Hooks Reference

官方 hooks 完整文档：所有事件名、JSON schema、退出码协议、最新可用的 hook 类型。

GUIDE

### Claude Code — Settings 配置层级

全局 / 项目 / 本地三层 settings.json 优先级与合并规则——决定 hook 在哪里生效。

EXAMPLE

### awesome-claude-hooks

社区维护的 hook 模板集合：自动格式化、安全审计、Slack 集成、git 工作流自动化等。

## Day 11 预告

NEXT

COMING NEXT

### 自定义 Skills — 把重复工作封装成一句命令

今天你学会让规则自动执行——明天你将教 Claude 学一项你的"祖传手艺"。在 `.claude/skills/` 写一个 markdown 文件就能创建斜杠命令，把你常用的多步工作流（PR 评审、bug 复现、deploy 流程）封装成 `/review`、`/repro`、`/deploy`，团队成员一键复用。Hook 守住底线，Skill 提供便捷——双剑合璧。

"Make the right thing easy, and the wrong thing impossible."

DAY 10 · CLAUDE CODE 20-DAY ROADMAP · LARRY WALL
