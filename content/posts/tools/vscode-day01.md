---
title: "Day 01 · VSCode 安装、CLI 与同步登录"
date: '2026-05-24'
draft: false
description: "从零开始：选择 Stable / Insiders、各平台安装、把 code 命令装进 PATH、用 Microsoft 或 GitHub 登录开启 Settings Sync，让任何一台新机器 10 分钟还原你的 VSCode。"
toc: true
tags:
  - VSCode
  - Tools
  - Tutorial
  - Day 01
---

DAY 01 · VSCODE ROADMAP · 21 DAYS

# 把 VSCode _装进 PATH_，把自己装进云端

第一天的目标是建立两条「不可见但关键」的连接—— 一条是 `code` 命令到 PATH 的连接，让你从任意终端 1 秒打开任意目录； 一条是 Settings Sync 到云端的连接，让任何一台新机器 10 分钟还原成「你的 VSCode」。 这两条线打通后，VSCode 才不再只是一个 GUI 应用，而是你工作流的_起点_。

**DURATION** 45–60 min **SETUP** 15 min **HANDS-ON** 20 min **REVIEW** 10 min **PLATFORM** macOS · Windows · Linux

## 思维导图

OVERVIEW

> **图：Day 01 思维导图**
>
> - DAY 01 · 安装、CLI 与同步登录
> - CHOOSE · INSTALL · PATH · SYNC
> - 01 · CHOOSE
> - 选版本与安装
> - 02 · PATH
> - code 命令进 PATH
> - 03 · SYNC
> - Settings Sync
> - 04 · PRACTICE
> - 动手练习
> - Stable vs Insiders
> - macOS / Win / Linux
> - Homebrew / .deb / .rpm
> - VSCodium 对比
> - macOS shell command
> - code . / code -d / -w
> - EDITOR 环境变量
> - git config core.editor
> - Microsoft / GitHub 登录
> - 同步项粒度选择
> - 冲突解决与合并
> - 关闭/重置/备份
> - code . 启动当前目录
> - code --diff 文件对比
> - 开启 Sync 并切机器
> - 查看同步历史
> - DELIVERABLES
> - VSCode 安装成功
> - code 命令可用
> - Settings Sync 已开启
> - 3 个 Lab 完成

FIG · Day 01 全景：选版本 → 装 CLI 进 PATH → 登录开 Sync → 实操验证

## 选择版本与安装

15 MIN

VSCode 有两条发布通道——_Stable_ 每月一次正式版， _Insiders_ 每天一次预览版。 推荐先装 Stable 作为主力，等用熟后再考虑加装 Insiders 双修。 两个版本可以共存，配置完全独立。

### Stable vs Insiders

| 维度 | Stable（正式） | Insiders（预览） |
| --- | --- | --- |
| 发布节奏 | 每月 1 次 | 每天 1 次 |
| 稳定性 | 高，适合日常工作 | 偶尔崩溃，新特性可能未打磨 |
| 图标颜色 | 蓝色 | 绿色（一眼能区分） |
| 配置目录 | `~/.vscode` | `~/.vscode-insiders` |
| CLI 命令 | `code` | `code-insiders` |
| 共存 | 支持，配置/扩展互不干扰 |

建议：先 Stable 主力；想看团队新特性时再加装 Insiders 旁敲侧击

### 各平台安装方式

### macOS

```
# 方式 A · Homebrew（推荐，便于后续升级）
$ brew install --cask visual-studio-code
$ brew install --cask visual-studio-code@insiders # 可选

# 方式 B · 直接下载安装包
# https://code.visualstudio.com/Download 选 macOS Universal
# 解压后把 Visual Studio Code.app 拖到 /Applications/

# 验证安装
$ ls /Applications/ | grep -i visual
Visual Studio Code.app
Visual Studio Code - Insiders.app # 如果装了 Insiders
```

### Windows

```
# 方式 A · winget（Win10+ 自带）
PS> winget install Microsoft.VisualStudioCode
PS> winget install Microsoft.VisualStudioCode.Insiders # 可选

# 方式 B · Scoop
PS> scoop bucket add extras
PS> scoop install vscode

# 方式 C · 官网下载 User Installer（推荐普通用户）
# https://code.visualstudio.com/Download 选 Windows x64 User Installer
# 安装时务必勾选「Add to PATH」
```

### Linux

```
# Ubuntu / Debian — 添加官方源（保证后续 apt upgrade 同步升级）
$ sudo apt install wget gpg
$ wget -qO- https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor > packages.microsoft.gpg
$ sudo install -D -o root -g root -m 644 packages.microsoft.gpg \
    /etc/apt/keyrings/packages.microsoft.gpg
$ echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" \
    | sudo tee /etc/apt/sources.list.d/vscode.list
$ sudo apt update && sudo apt install code

# Fedora / RHEL
$ sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
$ sudo dnf install code

# Arch — 官方仓库就有
$ sudo pacman -S code # OSS 版本
$ yay -S visual-studio-code-bin # 官方版本（推荐）
```

MYTH 01

### VSCode = VS（Visual Studio）？

不是。VSCode 是 Electron 编辑器（轻）；VS 是 Windows 上的 IDE（重）。两个完全不同的产品，唯一共通是 Microsoft 出品。

MYTH 02

### VSCode 和 VSCodium 选哪个？

VSCodium 是 VSCode 源码的纯开源构建——去掉了 Microsoft 的遥测和品牌。对隐私敏感选 VSCodium，但 **无法用官方 Marketplace** ，扩展生态会受限。

MYTH 03

### 需要付费吗？

不需要。VSCode 完全免费，包括商业使用。GitHub Copilot 等扩展可能收费，但编辑器本身永远免费。

## 把 `code` 命令装进 PATH

10 MIN

这是_今天最重要的一步_。装好 `code` 命令后， 你在任何终端目录都能用 `code .` 一键打开当前目录、用 `code -d a b` 对比文件、 用 `code -w` 让 git commit 在 VSCode 里写——这就是「编辑器变成工作流」的入口。

### macOS — 通过命令面板安装

Windows / Linux 安装时通常会自动加入 PATH。macOS 需要手动操作一次：

1. 启动 VSCode（任意方式打开即可）
2. 按 ⌘+⇧+P 打开命令面板
3. 输入 `shell command`，选 **"Shell Command: Install 'code' command in PATH"**
4. 系统弹出权限确认 → 输入密码
5. 重启终端

```
# 验证安装成功
$ code --version
1.96.4
abc123def456...
x64

# 如果是 Insiders 版
$ code-insiders --version
```

### 实用 `code` 命令清单

| 命令 | 说明 | 使用频率 |
| --- | --- | --- |
| `code .` | 在 VSCode 打开当前目录 | ★★★★★ 每天 N 次 |
| `code file.py` | 打开单个文件 | ★★★★ 经常 |
| `code -d a.txt b.txt` | 对比两个文件（diff 视图） | ★★★ 替代 diff/meld |
| `code -w file` | 打开并阻塞终端直到文件关闭
(用于 git commit / EDITOR 环境) | ★★★★ 配合 git |
| `code -r file` | 在当前窗口而不是新窗口打开 | ★★ 偶尔 |
| `code -n` | 强制新窗口 | ★★ 偶尔 |
| `code -g file:line:col` | 跳转到指定行列（错误日志点击复用） | ★★★ 调试常用 |
| `code --list-extensions` | 列出已装扩展（用于备份） | ★★ 迁移时用 |
| `code --install-extension X` | 命令行安装扩展 | ★★ 脚本化场景 |
| `code --profile "Web"` | 用指定 Profile 打开（Day 18 详讲） | ★★★ 多角色必备 |

### 进阶：把 VSCode 设为 Git 默认编辑器

默认情况下 `git commit` 会进 vim 或 nano。把它换成 VSCode 后，写 commit message 时拥有完整 IntelliSense、历史记录、拼写检查。

```
# 全局设置 Git 的默认编辑器
$ git config --global core.editor "code --wait"

# 同时建议设置 EDITOR 环境变量（让 svn / kubectl edit / crontab -e 等也用 VSCode）
# 写入 ~/.zshrc 或 ~/.bashrc
$ echo 'export EDITOR="code --wait"' >> ~/.zshrc
$ source ~/.zshrc

# 验证
$ echo $EDITOR
code --wait
```

`--wait` 让命令阻塞直到关闭文件，否则 git 会以为你 0 秒就写完了 commit message

## Settings Sync 登录与配置

15 MIN

Settings Sync 是 VSCode 内置的云同步——把你的设置、快捷键、Snippets、扩展通过 Microsoft 或 GitHub 账号同步到所有设备。 新机器装好 VSCode → 登录 → 5 分钟还原你的整套环境。这是_21 天路线最重要的安全网_。

> **图：Settings Sync 工作流**
>
> - SETTINGS SYNC FLOW
> - MACHINE A
> - 你的主力 Mac
> - settings / keys / snippets
> - extensions / UI state
> - CLOUD
> - MS / GitHub 账号
> - 加密存储 + 历史版本
> - MACHINE B
> - 新机 / 公司机
> - 登录 → 拉取 → 还原
> - 10 分钟内可用
> - 上传
> - 下载
> - 任意一端的修改 → 数秒内自动同步到其他所有登录设备

FIG · Settings Sync 双向云同步示意

### 开启 Settings Sync 的 5 步

1. 点击左下角齿轮 **⚙️** → **Backup and Sync Settings...**
2. 或命令面板 ⌘⇧P → 输入 `Turn on Settings Sync`
3. 选择要同步的项目（见下表）
4. 选择登录方式： **Microsoft** 或 **GitHub**
5. 浏览器跳出授权页 → 同意 → 自动跳回 VSCode

### 同步项粒度选择

| 项目 | 同步内容 | 建议 |
| --- | --- | --- |
| Settings | 所有 User 级 `settings.json` | ✓ 必开 |
| Keyboard Shortcuts | 自定义 `keybindings.json` | ✓ 必开 |
| User Snippets | 你写的所有 snippet 文件 | ✓ 必开 |
| User Tasks | 全局 tasks.json | ✓ 开（一般为空） |
| UI State | 面板布局、视图开关、最近打开 | 视情况 — 多机习惯不同可关 |
| Extensions | 已装的扩展列表（不同步扩展自己的设置） | ✓ 必开 — 这是 Sync 最爽的功能 |
| Profiles | 所有 Profile 的完整快照（Day 18 详讲） | ✓ 开 |

UI State 是唯一一个我推荐_关掉_的项 —— 大屏小屏布局习惯往往不一样

### 同步管理常用命令

```
# 命令面板内（⌘⇧P 后输入）
> Settings Sync: Show Synced Data # 查看云端有什么
> Settings Sync: Show Conflicts # 解决冲突
> Settings Sync: Show Sync Activity # 查看同步日志
> Settings Sync: Reset Synced Data # 清空云端（核选项）
> Settings Sync: Turn Off # 暂时关闭
```

SECURITY

### 不会同步什么？

密码、token、API Key（这些在系统 Keychain）；扩展 **自己** 的数据（如 GitLens 的缓存）；本地未保存的修改。

CONFLICT

### 冲突怎么办？

两台机器同时改设置时会触发。VSCode 会弹一个三栏 merge 视图，让你手动选 local / remote / both。和 Git merge 一样的体验。

BACKUP

### 云端有历史版本

每次同步都会留快照。手抖把设置改坏了？用 `Show Synced Data` 可以回滚到任意历史版本。

## 动手练习

20 MIN · 3 LABS

理论看一百遍不如手敲一遍。三个练习对应今天的三个核心能力—— _CLI 使用_、_文件对比_、_同步验证_。 做完才算 Day 01 通关。

### Lab 1 — 用 `code .` 启动当前目录

最高频用法。建立「我在哪里 → VSCode 就开哪里」的肌肉记忆。

```
# 1. 终端切到任意一个项目目录（没有就 mkdir 一个）
$ mkdir ~/vscode-day01 && cd ~/vscode-day01

# 2. 创建几个测试文件
$ echo "hello" > a.txt
$ echo "world" > b.txt
$ mkdir src && echo "console.log(1)" > src/index.js

# 3. 一键打开整个目录
$ code .

# 4. 在新终端里跳到子目录再开
$ cd src && code . # 注意 workspace 只包含 src/
```

**预期观察：** VSCode 打开后左侧文件树以你执行 `code .` 时的目录为根。这是 workspace 的本质——「一个文件夹」。

### Lab 2 — 用 `code -d` 对比文件

配合 git 之外的「随手 diff」场景，用一次后再也回不去 `diff a b` 了。

```
# 1. 准备两个有差异的文件
$ cat > old.json <<EOF
{
  "name": "foo",
  "version": "1.0.0",
  "port": 3000
}
EOF

$ cat > new.json <<EOF
{
  "name": "foo",
  "version": "1.1.0",
  "port": 8080,
  "host": "0.0.0.0"
}
EOF

# 2. 打开 VSCode diff 视图
$ code -d old.json new.json
```

**预期观察：** VSCode 打开两栏对比视图，差异处高亮（绿色新增 / 红色删除）。你可以直接在右侧编辑保存——比 `diff` 命令多了「修改能力」。

### Lab 3 — 验证 Settings Sync 双向工作

单机也能验证：改一个设置，看云端 Show Synced Data 里是否能看到。

1. 确认你已经按 §03 开启了 Sync 并完成登录
2. 命令面板 → `Preferences: Open User Settings (JSON)`
3. 添加一行：`"editor.fontSize": 14`（或任意一个你能记住的值）
4. ⌘S 保存，等待右下角同步状态变成 ✓
5. 命令面板 → `Settings Sync: Show Synced Data`
6. 展开 **Settings** 节点，确认能看到刚才那条变更
7. （可选）在另一台机或 Insiders 上登录同一账号，验证设置自动还原

REFLECTION

### 三个 Lab 的共性

都在用「命令行 + GUI 协同」——VSCode 不是要替代终端，而是和终端互相增强。这是和 Cursor / IDE 最大的不同。

CHALLENGE

### 附加挑战

用 `code -g src/index.js:1:5` 打开 Lab 1 的文件并定位到第 1 行第 5 列。这就是错误日志一点跳转的原理。

## 常见疑问

5 QUESTIONS

### Q1 · macOS 上为什么命令面板找不到 "Install 'code' command in PATH"？

ANS

大概率是 VSCode 不在 `/Applications/` 里——比如装到了 `~/Downloads/` 或某个奇怪位置。把 **Visual Studio Code.app** 拖到 `/Applications/` 后再试。另一种可能是装的是 Insiders 版，那对应命令名叫 `code-insiders`，对应面板项是 **"Install 'code-insiders' command in PATH"** 。

### Q2 · Stable 和 Insiders 同时装着，配置会互相干扰吗？

ANS

完全不会。两个版本读不同的配置目录（macOS：`~/Library/Application Support/Code` vs `Code - Insiders`），扩展也分开装。 **但 Settings Sync 是共享的** ——同一个账号登录 Stable 和 Insiders，设置会双向同步。这是优点也是陷阱：在 Insiders 里手贱改了实验性设置，会一并推到 Stable。

### Q3 · Settings Sync 会泄露密码、Token、API Key 吗？

ANS

不会。所有「密」数据都走系统 Keychain（macOS Keychain / Windows Credential Manager / Linux libsecret），Sync 只同步明文配置。但 **注意一类陷阱** ：如果你手贱把 API Key 直接写进 `settings.json`（比如某些扩展配置示例这么写），那它就会同步到云。所以养成习惯——任何 secret 永远不写进 settings，而是用环境变量或扩展专用的 secret storage。

### Q4 · 没有 Microsoft 或 GitHub 账号，能用 Settings Sync 吗？

ANS

VSCode 内置的 Settings Sync **必须用** 这两个账号之一。如果你都不想用，有两个替代方案：(1) 用社区扩展 **Settings Sync (Shan Khan)**——把配置存 GitHub Gist，但需要自己管 token；(2) 用 **Dotfiles 仓库** ——把 `settings.json` / `keybindings.json` / `snippets/` 用软链接进 git 仓库，自己 git push。第二种更通用，是不少老司机的最终选择。

### Q5 · 公司不让用 Microsoft 云、内网开发，VSCode 还能用吗？

ANS

能。VSCode 本身完全离线可用，只是 **三类网络功能** 会受限：(1) Settings Sync（用 Dotfiles 替代）；(2) Extension Marketplace（可以用 `.vsix` 文件离线安装，或搭内网镜像 Open VSX）；(3) 自动更新（关掉 `update.mode: none`，由 IT 统一推安装包）。 **VSCodium** 是更激进的选择——默认就关闭了所有遥测和云通信，适合严格的内网环境。

## 复盘问题

5 QUESTIONS

1. Stable 和 Insiders 的核心区别是什么？什么场景下你会选 Insiders？
2. `code -w file` 中的 `-w` 是什么意思？为什么 git commit 必须加？
3. Settings Sync 同步项中，你为什么会关掉 UI State？还有哪些情况你会关掉某项同步？
4. 如果你想把当前 VSCode 的所有扩展导出到一个文件，再到新机器上批量安装，对应的两条 CLI 命令分别是什么？
5. 如果你的 settings.json 被同步覆盖成了一个你不想要的版本，怎么用 Settings Sync 自带的功能恢复？

## 今日检查清单

8 ITEMS

- 已安装 VSCode Stable，能在系统启动器中看到图标
- 终端里 `code --version` 能输出版本号
- 能用 `code .` 打开当前目录
- 已设置 `git config --global core.editor "code --wait"`
- 已通过 Microsoft 或 GitHub 登录，命令面板能搜到 `Settings Sync: Show Synced Data`
- 同步项中至少开启了 Settings / Keybindings / Snippets / Extensions
- 完成 Lab 1（`code .`）、Lab 2（`code -d`）、Lab 3（验证 Sync）
- 能回答复盘的 5 个问题

## 推荐阅读

3 ITEMS

OFFICIAL

### VS Code Setup Overview

官方安装与初始化文档，每个平台都有专门页。遇到安装问题直接搜这里，比 Stack Overflow 准。

OFFICIAL

### Command Line Interface (CLI)

官方 `code` 命令全集文档，包含所有 flag 和环境变量。今天讲的只是高频部分。

OFFICIAL

### Settings Sync

Settings Sync 的官方说明，包含数据安全、隐私、企业部署等问题的权威答案。

## Day 02 预告

NEXT

COMING NEXT

### 界面骨架与命令面板 — VSCode 的「五大件」与万能入口

明天会拆解 VSCode 的界面：Activity Bar / Side Bar / Editor / Panel / Status Bar 各自的边界与最佳实践；以及为什么命令面板 ⌘⇧P 是「老司机的唯一菜单」——所有功能、所有扩展、所有设置都能通过它找到，再也不用翻菜单。

"先让工具能在任何角落响应你 —— 之后所有的快捷键，都建立在这条线上。"

DAY 01 · VSCODE 21-DAY ROADMAP
