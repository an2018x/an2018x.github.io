---
title: "Day 09 · 权限与安全 — 四档信任阶梯 · 工具白名单 · 敏感文件保护"
date: '2026-05-16'
draft: false
description: "把 Claude Code 的能力锁在你想给的范围里——理解 default / acceptEdits / plan / bypassPermissions 四档权限模式的取舍,用 allow / deny 规则做白名单与黑名单,用 Hooks 兜底拦截危险命令和敏感文件读取。一句 rm -rf 和一个泄漏的 .env,可能让你和 Claude 的全部信任崩盘。"
toc: true
tags:
  - AI
  - Claude Code
  - Permission
  - Security
  - Tutorial
---

DAY 09 · CLAUDE CODE ROADMAP · 20 DAYS

# 把 Claude 的权力锁在_你想给的范围里_

Claude Code 默认是_克制_的—— 每个会改文件、跑命令的操作都会先问你一句。 但只要你说一次"全部允许",这层防线就消失了。 今天我们把权限系统拆开看:四档信任阶梯之间到底差在哪、 `allowedTools` 与 `deny` 规则该怎么搭、 敏感文件怎么从 `Read` 视野里彻底拿掉、 最后用 `Hooks` 给所有规则上一道兜底防线。

**DURATION** 70–85 min **THEORY** 25 min **HANDS-ON** 45 min **REVIEW** 15 min **SECTIONS** 5

## 思维导图

OVERVIEW

> **图：Day 09 思维导图**
>
> - DAY 09 · 权限与安全
> - MODES · ALLOW · DENY · HOOKS
> - 01 · MODES
> - 四档信任阶梯
> - 02 · ALLOW
> - 工具白名单
> - 03 · DENY
> - 敏感文件保护
> - 04 · HOOKS
> - 兜底防线
> - default · 每次询问
> - acceptEdits · 自动改
> - plan · 只读规划
> - bypass · 关闭防线
> - allowedTools 列表
> - Bash 前缀匹配
> - 三层 settings 配置
> - 最小授权原则
> - .env / .pem / id\_rsa
> - deny 高于 allow
> - Read 也被阻断
> - 危险命令清单
> - PreToolUse 拦截
> - exit 2 阻断工具
> - 审计与日志
> - 规则被绕过时兜底
> - 最小授权 · 默认拒绝 · 显式允许 · 兜底审计
> - SHIFT+TAB
> - ALLOW LIST
> - DENY \*.ENV
> - PRETOOLUSE

FIG M — DAY 09 KNOWLEDGE MAP · PERMISSION & SAFETY MODEL

## 权限模式 — 四档信任阶梯

FOUR TIERS

Claude Code 把"我有多信任这一段工作"建模成 **四档可切换的模式** 。 默认这一档最克制——任何会改文件、跑命令的工具调用都先停下来问你。 你可以随时往上爬一格(更宽松、更省事)或往下退一格(更严、更安全)。 理解这四档之间的_实际差异_,是后面所有配置的前提。

### 四档对照表

| 模式 | 读文件 | 改文件 | 跑命令 | 推荐场景 |
| --- | --- | --- | --- | --- |
| plan | ✓ 自由 | ✗ 全禁 | ✗ 全禁 | 大型重构前先出方案 · 高风险变更评审 |
| default | ✓ 自由 | 需逐条批准 | 需逐条批准 | 日常开发 · 陌生项目 · 团队 CI 推荐 |
| acceptEdits | ✓ 自由 | ✓ 自动 | 仍逐条批准 | 大量改文件 · 已规划好的批量重构 |
| bypassPermissions | ✓ 自由 | ✓ 自动 | ✓ 自动 | 仅限隔离沙箱 · YOLO 模式 |

关键直觉:每往上一格,你换到的是"省按 Enter"·失去的是"反悔机会"

### 四档之间的升降路径

> **图：权限四档升降路径**
>
> - TIER · 01
> - plan
> - 只读 · 出方案
> - TIER · 02 · 默认
> - default
> - 每个操作问一句
> - TIER · 03
> - acceptEdits
> - 编辑放行 · 命令仍问
> - TIER · 04 · 危险
> - bypassPermissions
> - 不再问任何事
> - ⇧ Tab 在前三档间循环 · bypass 必须用 --dangerously-skip-permissions 显式启用
> - 默认拒绝 → 显式允许 → 永远可降级

FIG 01 · PERMISSION ESCALATION LADDER — PLAN → DEFAULT → ACCEPTEDITS → BYPASS

### 三种切换方式

```
# 1. 交互中 ⇧ Tab — 在 plan / default / acceptEdits 间循环
# 底部状态栏会显示当前模式

# 2. 启动时指定 (适合脚本)
$ claude --permission-mode plan
$ claude --permission-mode acceptEdits

# 3. 危险档 — 不允许通过 ⇧ Tab 进入,必须显式标志
$ claude --dangerously-skip-permissions
# ↑ 标志名本身就是警告 — 一旦开启,所有工具直通

# 4. SDK / -p 模式默认更严 — 工具必须在 allowedTools 里
$ claude -p "修复 lint" --allowedTools "Read,Edit,Bash(npm run lint *)"
```

交互式开发用 ⇧ Tab · 自动化脚本用 --permission-mode · 不要让 bypass 进入团队配置

### 什么时候用哪一档

PLAN

### 陌生 / 高风险

大型重构、跨模块变更、生产事故响应。先让 Claude 出方案,再切回 default 落地。

DEFAULT

### 日常默认

未知项目、不熟环境、共享机器。每条命令都看一眼,慢但不会翻车。

ACCEPTEDITS

### 批量改文件

大批量改样式 / 重命名 / 模板替换。改对错都看得见,命令仍会拦住。

BYPASS

### 隔离沙箱

仅在 Docker / VM / 一次性 worktree 里使用。日常机器开 bypass 等于裸奔。

## 白名单 — allowedTools 与前缀匹配

ALLOW LIST

模式决定_"问不问"_,白名单决定_"哪些根本不用问"_。 声明在白名单里的工具或命令前缀,Claude 直接放行——不弹窗、不打断、不拖你 Enter 键的后腿。 关键是写得 **足够窄** :窄到误差范围内出错也只能伤到你想让它能伤到的东西。

### 三种工具表达式

| 表达式 | 含义 | 典型用法 |
| --- | --- | --- |
| Read | 整个工具放行 —— 任何路径任何参数都允许 | 读文件几乎从不出事 · 全放行可接受 |
| Edit | 编辑文件全放行 —— 不区分文件路径 | 开发循环里高频用,acceptEdits 已覆盖 |
| Bash(git diff \*) | 带 **前缀匹配** 的 Bash 命令 —— 只允许特定前缀 | 窄授权的核心 · 见下方示例 |
| Read(./src/\*\*) | 带 **路径匹配** 的文件工具 —— 限定到子树 | 多仓库工作区时锁定到当前项目 |
| mcp\_\ __name_\_\__ tool_ | MCP 工具 —— 按服务器和工具名授权 | Day 13 详谈,这里先认识形态 |

### Bash 前缀匹配的陷阱

```
# ✓ 窄 — 明确边界
"Bash(npm test *)" # 只允许 npm test...
"Bash(git diff *)" # 只允许 git diff...
"Bash(npx tsc --noEmit)" # 精确到完整命令

# ✗ 过宽 — 几乎等于放弃白名单
"Bash(*)" # 等于 bypass 一半
"Bash(npm *)" # npm publish / npm uninstall 都进来了
"Bash(git *)" # git push --force 也算 git

# ⚠ 看似窄、其实可绕过 — 一定记得对应的 deny
"Bash(rm *.log)" # Claude 可改为 rm *.log; rm -rf /
# ↑ shell 注入风险,前缀匹配只看开头,后面的恶意 ; && | 全放行
```

原则:能写完整命令就不留 \* · 凡是用了 \* 的,必须有对应 deny 规则封堵尾巴

### settings.json 的 permissions 字段

命令行 `--allowedTools` 只对当前会话生效——团队、项目级的常驻规则要写到 `.claude/settings.json` 的 `permissions` 字段里。

```
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Bash(npm test *)",
      "Bash(npm run lint *)",
      "Bash(npx tsc --noEmit)",
      "Bash(git diff *)",
      "Bash(git status)",
      "Bash(git log *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(curl * | sh)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./**/*.pem)",
      "Read(./**/id_rsa)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(npm publish *)"
    ]
  }
}
```

三段语义 — allow 自动允许 · deny 永远阻断 · ask 强制弹窗(即便在 acceptEdits)

### 最小授权工作流

1. 第一天:用 `default` 模式裸跑——看 Claude 真正会用到哪些命令。
2. 第二天:把高频出现、明显无害的命令(`git diff`、`npm test`)加到 `allow`。
3. 第三天:把 **本来就不该跑** 的命令(`rm -rf`、`sudo`、远程拉脚本)加到 `deny`。
4. 第四天:把 **偶尔需要但要慎用** 的(`git push`、`npm publish`)加到 `ask`。
5. 每周复盘一次:看哪些命令被你按了 100 次 yes——它们是 allow 的下一个候选。

## 拒绝规则与敏感文件保护

DENY RULES

"Claude 怎么把 `.env` 里的 OpenAI Key 复读到日志里了?"—— 绝大多数 Claude 引发的_真实事故_不是它跑了一条危险命令, 而是它 **读了不该读的文件** 。 `deny` 规则的优先级永远高于 `allow`, 它也是唯一能把"全工具放行"和"敏感文件不可见" **同时成立** 的机制。

### 必须 deny 的七类资源

| 类别 | 典型路径 | 推荐 deny 规则 |
| --- | --- | --- |
| 环境变量文件 | `.env` · `.env.local` · `.env.production` | Read(./.env\*) · Read(./\*\*/.env\*) |
| 密钥与证书 | `*.pem` · `*.key` · `id_rsa` · `*.p12` | Read(./\*\*/\*.pem) · Read(./\*\*/id\_rsa) |
| 云厂商凭证 | `~/.aws/credentials` · `~/.config/gcloud/` | Read(~/.aws/\*\*) · Read(~/.config/gcloud/\*\*) |
| 本地数据库 | `*.sqlite` · `*.db` · `dump.sql` | Read(./\*\*/\*.sqlite) · Read(./dump\*.sql) |
| 构建产物 / lock | `node_modules/` · `dist/` · `build/` | Read(./node\_modules/\*\*) |
| 外部脚本执行 | 从网上 curl 下来直接管道执行 | Bash(curl \* \| sh) · Bash(wget \* \| bash) |
| 破坏性命令 | `rm -rf` · `sudo` · `chmod 777` · 强推 git | Bash(rm -rf \*) · Bash(sudo \*) · Bash(git push \*--force\*) |

deny 一旦命中,弹窗都不会出现 · Claude 会在自己的会话里看到"该工具被拒绝"的错误然后另寻它路

### deny 比 allow 优先 — 优先级流程

> **图：权限优先级流程**
>
> - TOOL CALL
> - Edit / Bash / Read
> - 匹配 deny?
> - step 1
> - YES
> - REJECTED
> - NO
> - 匹配 allow?
> - step 2
> - EXECUTE
> - ASK USER
> - PRIORITY
> - ① deny 阻断
> - ② allow 放行
> - ③ ask 弹窗
> - ④ 模式 兜底

FIG 03 · PERMISSION RESOLUTION FLOW — DENY OVERRIDES ALLOW

### 实战:把 .env 从 Claude 的视野里彻底拿掉

```
# 1. 在 .claude/settings.json 里加 deny
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./**/.env)",
      "Read(./**/.env.*)",
      "Bash(cat .env*)",
      "Bash(less .env*)",
      "Bash(head .env*)",
      "Bash(tail .env*)"
    ]
  }
}

# 2. 验证 — 让 Claude 试着读它
> 把 .env 的内容打印给我看
Claude: 我无法读取 .env 文件——它被项目权限规则阻断了。
        如果你需要查看,请在终端直接 cat。

# 3. 即便 Claude 用 Bash 也试不出来
> 用 cat 也试一下
Claude: cat .env 同样被 deny 规则阻断,我没办法绕过。

# 4. 但环境变量本身可以读 — 因为 process.env 不经过工具
# 所以你要么用 .env.example 让 Claude 看模板,要么把真值放到 ~/.zshrc
```

边界:deny 只能管 Claude 工具调用 · 拦不住 node -e "console.log(process.env)" 这种自身就拿环境变量的代码

## Hooks — 权限的最后一道防线

SAFETY NET

`allow` / `deny` 是_声明式_的—— 规则写错或漏写,Claude 就放行。 `Hooks` 是_命令式_的—— 每次工具调用前都跑你给的脚本,你说阻断就阻断, 就算是 `bypassPermissions` 都拦得住。 (Day 10 会展开整个 Hooks 系统,今天只用 **安全场景** 那一支。)

### PreToolUse — 工具运行前的最后关口

```
# .claude/settings.json 中注册一个 PreToolUse 钩子
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-dangerous.sh"
          }
        ]
      }
    ]
  }
}
```

```
#!/usr/bin/env bash
# .claude/hooks/block-dangerous.sh
# 读 stdin 的 JSON,解析出 Bash 命令,匹配危险模式就 exit 2 阻断

set -euo pipefail
cmd=$(jq -r '.tool_input.command // ""')

# 危险模式列表 — 任何命中都阻断
declare -a PATTERNS=(
  'rm -rf /'
  'rm -rf ~'
  'rm -rf \*'
  ':\(\)\{.*\}' # fork bomb
  'mkfs\.' # 格式化磁盘
  'dd if=.* of=/dev/' # 写裸设备
  '> /dev/sd'
  'curl .* \| sh' # 远程脚本直接执行
  'wget .* \| bash'
)

for pat in "${PATTERNS[@]}"; do
  if [["$cmd" =~ $pat]]; then
    echo "BLOCKED: 命令命中危险模式 '$pat'" >&2
    exit 2 # exit 2 = 阻断该工具调用,把 stderr 内容反馈给 Claude
  fi
done

exit 0 # 放行
```

exit 码语义 — 0:放行 · 1:出错(Claude 看到但不阻断) · 2:阻断(Claude 看到 stderr 后另寻它法)

### Hooks vs deny — 各自的强项

DENY 规则

### 简单 · 声明式 · 快

写一行就完事,不用维护脚本。适合静态规则(`.env`、`rm -rf`)。配置即文档——别人 review 一眼就懂。

HOOK 脚本

### 灵活 · 可审计 · 可绕不开

能写复杂条件(组合判断、查表、调外部服务)、能写审计日志、能彻底拦截 — **即便 bypassPermissions 也跑** 。适合企业级安全策略。

### 三个安全 Hook 模板

TEMPLATE · 01

### 命令审计日志

PreToolUse 在 Bash 调用前把命令、时间、cwd 追加到 `~/.claude/audit.log`。事后追溯"那条 rm 是谁让跑的"。

TEMPLATE · 02

### 分支保护

检测 `git checkout main` / `git push origin main`,直接 exit 2 阻断,要求 Claude 切到 feature 分支。

TEMPLATE · 03

### 敏感关键词扫描

PostToolUse 扫描刚写入的文件,出现 `API_KEY=` / `PRIVATE_KEY` 等明文就 exit 2,要求 Claude 撤回。

## 三层配置 — 谁覆盖谁

CONFIG LAYERS

同一条 `allow` / `deny` 可以写在三个地方: **用户级** (全机器生效)、 **项目级** (团队共享)、 **本地级** (只你自己)。 搞清楚谁覆盖谁,才不会发生"我加了规则怎么没生效"的玄学。

### 三层文件 · 优先级从高到低

| 层级 | 文件路径 | 纳入 git? | 典型用途 |
| --- | --- | --- | --- |
| 命令行 | --allowedTools / --permission-mode | — | 临时覆盖 · 仅本次会话 最高优先级 |
| 本地 | .claude/settings.local.json | ✗ gitignore | 个人偏好 · 实验性放行 · 不希望污染队友配置 |
| 项目 | .claude/settings.json | ✓ 提交 | 团队共享规则 · 项目级 deny · 大家一致的 allow |
| 用户 | ~/.claude/settings.json | — | 个人通用偏好 · 跨项目的 deny(防 rm -rf 之类) |
| 企业 | /etc/claude-code/managed-settings.json | — | 组织强制策略 · 不可被覆盖 · 管理员部署 |

合并语义 — allow / deny 数组是 **并集** ,不是覆盖 · 子层不能"撤销"父层的规则 · 但本地 deny 可以加在已有 allow 之上

### 团队配置 vs 个人配置的分工

提交到仓库 · settings.json

### 团队级规则

① 项目相关的 allow(`Bash(npm test *)`、`Bash(npm run lint *)`)
 ② 项目敏感文件的 deny(`Read(./.env*)`、`Read(./secrets/**)`)
 ③ 必装的 PreToolUse hook(分支保护、审计)

_谁 clone 项目都自动受这些规则保护。_

gitignore · settings.local.json

### 个人级规则

① 个人开发偏好的 allow(只你信任的命令)
 ② 实验性放行(临时打开某个工具试试)
 ③ 你自己的 hook 路径(本地审计日志)
 ④ 个人 ANTHROPIC\_API\_KEY 环境变量

_不会污染队友,也不会被 review。_

### 合并示例

```
# 用户级 ~/.claude/settings.json — 跨所有项目生效
{
  "permissions": {
    "deny": ["Bash(rm -rf *)", "Bash(sudo *)"]
  }
}

# 项目级 .claude/settings.json — 当前项目生效,提交到 git
{
  "permissions": {
    "allow": ["Read", "Edit", "Bash(npm test *)"],
    "deny": ["Read(./.env*)"]
  }
}

# 个人级 .claude/settings.local.json — 仅自己,gitignore
{
  "permissions": {
    "allow": ["Bash(git diff *)", "Bash(git status)"]
  }
}

# 合并后 Claude 看到的实际规则:
# allow: Read, Edit, Bash(npm test *), Bash(git diff *), Bash(git status)
# deny: Bash(rm -rf *), Bash(sudo *), Read(./.env*)
```

无法在 local 里"取消"项目级的 deny — 想绕开必须在项目级显式调整规则,这是设计上的安全保证

## Labs

4 EXERCISES

LAB 01 · 模式切换

### 给自己装一个安全的 plan → default 工作流

在一个你不熟的开源项目里:先用 `claude --permission-mode plan` 让 Claude 出方案, 切回 default 让它落地,中途用 `⇧ Tab` 在 default 和 acceptEdits 之间切换, 感受三档模式各自的"问的频率"。 **不要试 bypass。**

LAB 02 · 最小授权

### 为你的项目写一份合格的 permissions 块

创建 `.claude/settings.json`, 根据项目用到的命令写至少 5 条 `allow`(`Bash(npm test *)` 等)、 5 条 `deny`(`Bash(rm -rf *)`、`Bash(sudo *)` 等), 2 条 `ask`(`git push *` 等)。提交到仓库。

LAB 03 · 敏感文件

### 把 .env 从 Claude 的视野里彻底抹掉

在你的项目里加 `deny` 规则(`Read(./.env*)`、`Bash(cat .env*)` 等), 然后 **主动让 Claude 试着读 .env** ——确认它返回的是"被规则阻断",而不是文件内容。 再尝试用 `cat` / `head` / 拼接 shell 等方式让它绕,直到完全拦死为止。

LAB 04 · Hook 兜底

### 写一个 PreToolUse hook 拦截危险命令

写一个 Bash 脚本(参考 §04 模板),从 stdin 读取工具调用的 JSON, 匹配 `rm -rf /`、`mkfs`、`curl | sh` 等模式就 exit 2 阻断。 注册到 `.claude/settings.json` 的 hooks 字段。 然后 **故意** 让 Claude 跑一条 `rm -rf ./tmp_test`——确认 hook 工作。

## 常见问题

5 Q&A

### Q1 · acceptEdits 和 bypassPermissions 在实操上到底差多少?

A

差一个数量级。 **acceptEdits** 只放行 `Edit` / `Write` 这类"动文件"的工具,任何 `Bash` 调用——哪怕是 `ls`——依然会弹窗等你按 yes。 **bypassPermissions** 是把所有工具全放行,包括 `Bash(rm -rf /)`。

更关键的区别:acceptEdits 改错文件你能 `git diff` / `git restore` 救回来;bypass 让 Claude 跑了 `rm` 之后,文件在硬盘上就真的没了。**除非你在隔离沙箱(Docker、一次性 VM、临时 worktree),否则永远不要用 bypass。**

### Q2 · --allowedTools 命令行参数和 settings.json 的 permissions.allow 该用哪个?

A

原则上: **临时用命令行,长期用 settings.json** 。

命令行 `--allowedTools` 只对当前会话生效,适合一次性脚本、CI 任务、`-p` 模式下精确控制权限边界。settings.json 适合写常驻规则——团队都能受益、commit 进 git 后下次启动 Claude 也自动加载。

反模式:把 settings.json 写得很宽,然后期待用 `--disallowedTools` 在 CI 里收紧——容易遗漏。正确做法是 settings.json 里就写最小集,有特殊场景再 `--allowedTools` 加点。

### Q3 · plan 模式真的不会修改任何文件吗?会不会有边界情况?

A

plan 模式下 Claude 收到的工具集是被裁剪过的——`Edit` / `Write` / `Bash` 等写操作的工具 **根本不会出现在它的可调用列表里** 。所以即便它"想"改文件,也找不到对应工具调用。

边界情况:如果你装了 MCP 服务器,plan 模式不会自动限制 MCP 工具——某些 MCP 工具可能间接造成副作用(向数据库写、调远程 API 等)。 **关键 MCP 工具该在项目 settings 里另外配 deny,不要指望 plan 模式自动拦。**

### Q4 · deny 规则能 100% 防止 Claude 读到 .env 吗?

A

能拦住 **Claude 自己的工具调用** (`Read`、`Bash(cat .env)` 等)。 **拦不住** 三种情况:

① 你让 Claude 写代码,代码运行时读 `process.env`——这是程序自身,不经过工具系统;② 你执行 `npm run dev`,dev server 启动时加载 .env——同样是程序行为;③ Claude 让你帮忙执行 `echo $OPENAI_KEY` 然后把输出贴给它——这是你自己泄漏的。

所以真正安全的做法:① 项目 `.gitignore` 排除 .env;② settings.json 的 deny 防 Claude 主动读;③ 写 PreToolUse hook 扫描即将写入的代码里有没有出现真实密钥模式(如 `sk-[A-Za-z0-9]{20,}`);④ 重要密钥用密钥管理服务而不是 .env。四层叠起来才是合格的防御。

### Q5 · 团队成员的权限配置怎么共享,又怎么允许个人差异?

A

三层分工各司其职:

**项目 settings.json(commit)**:全队共用的最小集——项目相关的命令 allow、敏感文件 deny、必装的 hook。这是 **底线** ,任何 clone 项目的人都自动受保护。

**个人 settings.local.json(gitignore)**:每人的个性化偏好——你信任的额外 allow、你的本地 hook 路径、个人 API Key 环境变量。这部分别人看不到也用不到。

**用户 ~/.claude/settings.json** :跨项目通用——比如永远 deny `rm -rf` / `sudo`,无论在哪个项目都生效。

反模式:把团队规则写到 settings.local.json——结果新同事 clone 项目后没有,得手动配,体验很差。"该全员有的规则一定要进 commit"是底线。

## 复习题

5 QUESTIONS

1. 四档权限模式按"会允许 Claude 做什么"从最少到最多排序,并说出每一档的典型场景。
2. `Bash(git diff *)` 这种前缀匹配会匹配到 `git diff && rm -rf /` 吗?为什么这种通配符要慎用?
3. 当一条工具调用同时匹配 `allow` 和 `deny`,Claude Code 会怎么处理?
4. 项目级 `.claude/settings.json`、个人级 `settings.local.json`、用户级 `~/.claude/settings.json` 的 `allow` 数组是覆盖关系还是合并关系?
5. PreToolUse hook 用什么 exit code 阻断工具调用?Claude 收到阻断后会做什么?

## 自检清单

8 ITEMS

- 能脱口说出 plan / default / acceptEdits / bypassPermissions 四档的差异
- 能用 `⇧ Tab` 在交互中切换前三档,知道 bypass 必须用 `--dangerously-skip-permissions`
- 能在 `.claude/settings.json` 写至少 5 条精确的 `allow` 规则(含 Bash 前缀匹配)
- 能写至少 5 条 `deny` 规则覆盖危险命令和敏感文件
- 理解 deny \> allow \> ask \> 模式 的优先级顺序
- 能区分项目 settings.json(团队共享)和 settings.local.json(个人)的使用边界
- 能写一个 PreToolUse hook 拦截危险 Bash 命令并用 exit 2 阻断
- 清楚 deny 拦不住"运行时读 process.env"这类边界情况,知道补救措施

## 延伸阅读

3 LINKS

DOCS

### Claude Code — Permissions

官方权限文档:四档模式语义、permissions 字段全字段、allow/deny/ask 表达式语法。Day 09 的根参考。

REFERENCE

### Settings Schema

`.claude/settings.json` 的完整 schema:三层文件位置、合并规则、企业级 managed settings 字段定义。

GUIDE

### Hooks 安全模板

Day 10 的前置阅读:PreToolUse / PostToolUse 事件列表、stdin JSON schema、exit code 语义、社区安全 hook 仓库。

## Day 10 预告

NEXT

COMING NEXT

### Hooks 钩子系统 — 完整事件 · 自动格式化 · 自动测试 · Shell & HTTP

今天我们只用了 Hooks 的安全那一支——明天把它整个翻开。9 种钩子事件各自在什么时候触发、Shell 与 HTTP 两种处理器各自的取舍、自动 lint / 自动测试 / 自动 commit 怎么落地、hook 跑挂了怎么调试、阻断与撤销机制如何与 Claude 协作。规则一旦写好,记忆这件事就交还给机器。

"Least privilege is not paranoia — it's how you keep trust earnable."

DAY 09 · CLAUDE CODE 20-DAY ROADMAP · PERMISSION & SAFETY
