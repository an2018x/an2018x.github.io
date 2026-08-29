---
title: "Day 08 · Nvim + Go 补全与片段"
date: '2026-06-13'
draft: false
description: "Nvim + Go 30 天系统学习路线 Day 08：接入补全插件或使用内置补全，只保留 Go 常用片段：函数、测试、表驱动测试、error return，并避免把补全菜单调得过重。"
toc: true
tags:
  - Go
  - Neovim
  - Completion
  - Snippets
  - Roadmap
  - Day 08
---

NEOVIM · GO · DAY 08

# 补全与片段

第八天给 Nvim 加上补全，但不把补全菜单调成第二个 IDE。目标是：LSP 给你合适的候选， 片段帮你写重复结构，而你仍然清楚每一行 Go 代码的形状。只保留函数、测试、表驱动测试、error return 这些高频片段。

**DAY** 08 / 30 **TIME** 65 - 95 min **OUTPUT** completion + Go snippets **CHECK** LSP items + snippets + tests

[上一天：代码导航与项目搜索](/posts/infra/nvim-go-day07/)·[返回 30 天总路线](/posts/infra/nvim-go-roadmap/)·[下一天：格式化与导入整理](/posts/infra/nvim-go-day09/)

## 今日验收

DONE MEANS

GOAL

### 今日目标

接入补全插件或使用内置补全；让 `gopls` 候选能出现在菜单中；只保留 Go 常用片段：函数、测试、表驱动测试、error return。

CHECK

### 完成标准

在 `tasknote` 里输入 `strings.` 能看到 LSP 候选；输入 `gotest` 能展开测试片段；写完后 `go test ./...` 通过。

## 1. 先选补全路线

CHOICE

今天推荐用 `nvim-cmp` + `LuaSnip`，因为它同时覆盖 LSP 补全和片段。若你使用较新的 Neovim，也可以先用内置补全保持轻量。

| 路线 | 适合谁 | 取舍 |
| --- | --- | --- |
| `nvim-cmp` + `LuaSnip` | 想要补全菜单、LSP source、snippet source 统一体验的人。 | 配置稍多，但 Go 开发体验完整，本文主线采用它。 |
| Neovim 内置补全 | 想先保持最少插件，只验证 LSP completion 的人。 | 更轻，但片段体验和菜单控制不如插件方案完整。 |
| 完全不自动弹菜单 | 不想被候选干扰，只想手动触发的人。 | 可以把补全绑定到 `Ctrl-Space`，避免每次输入都弹出。 |

补全越主动，越容易打断思路。今天的配置会关闭预选，确认候选必须明确按键。

## 2. 安装补全与片段插件

PLUGINS

把插件加进 Day07 的 `require("lazy").setup({...})` 列表。Telescope 保留，新增 cmp 和 LuaSnip。

```
require("lazy").setup({
  {
    "nvim-telescope/telescope.nvim",
    branch = "0.1.x",
    dependencies = { "nvim-lua/plenary.nvim" },
  },
  {
    "hrsh7th/nvim-cmp",
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-buffer",
      "hrsh7th/cmp-path",
      "L3MON4D3/LuaSnip",
      "saadparwaiz1/cmp_luasnip",
    },
  },
})
```

如果插件管理器界面弹出来，按 `q` 退出。安装失败时先看网络，不要急着改 keymap。

## 3. 配置 nvim-cmp

CMP

新增 `lua/config/completion.lua`，然后在 `init.lua` 里插件加载后 require 它。

```
local cmp = require("cmp")
local luasnip = require("luasnip")

cmp.setup({
  preselect = cmp.PreselectMode.None,
  completion = {
    completeopt = "menu,menuone,noinsert,noselect",
  },
  snippet = {
    expand = function(args)
      luasnip.lsp_expand(args.body)
    end,
  },
  mapping = cmp.mapping.preset.insert({
    ["<C-Space>"] = cmp.mapping.complete(),
    ["<C-e>"] = cmp.mapping.abort(),
    ["<CR>"] = cmp.mapping.confirm({ select = false }),
    ["<Tab>"] = cmp.mapping(function(fallback)
      if cmp.visible() then
        cmp.select_next_item()
      elseif luasnip.expand_or_jumpable() then
        luasnip.expand_or_jump()
      else
        fallback()
      end
    end, { "i", "s" }),
    ["<S-Tab>"] = cmp.mapping(function(fallback)
      if cmp.visible() then
        cmp.select_prev_item()
      elseif luasnip.jumpable(-1) then
        luasnip.jump(-1)
      else
        fallback()
      end
    end, { "i", "s" }),
  }),
  sources = cmp.config.sources({
    { name = "nvim_lsp" },
    { name = "luasnip" },
    { name = "path" },
  }, {
    { name = "buffer" },
  }),
})
```

| 配置 | 含义 | 为什么这样设 |
| --- | --- | --- |
| `preselect = None` | 不自动选中第一项。 | 避免按 Enter 时误接受补全，尤其是写 Go 错误处理时。 |
| `select = false` | 确认时必须显式选择候选。 | 让换行和确认补全保持边界清楚。 |
| `Ctrl-Space` | 手动触发补全。 | 当自动菜单没出现或你不想自动弹出时，有一个稳定入口。 |
| `Tab` / `Shift-Tab` | 在菜单和片段占位间移动。 | 同一套手势覆盖补全候选与 snippet 跳转。 |

在 `init.lua` 里确保顺序是 `require("plugins")` 之后，再 `require("config.completion")`。

## 4. 把补全能力交给 gopls

CAPABILITIES

LSP 客户端会告诉服务器自己支持哪些能力。接入 cmp 后，要把增强后的 completion capability 传给 `gopls`。

```
local capabilities = vim.lsp.protocol.make_client_capabilities()

local ok, cmp_lsp = pcall(require, "cmp_nvim_lsp")
if ok then
  capabilities = cmp_lsp.default_capabilities(capabilities)
end

-- inside vim.lsp.start({
-- name = "gopls",
-- cmd = { "gopls" },
-- root_dir = root_dir(),
-- on_attach = on_attach,
-- capabilities = capabilities,
-- })
```

如果没有这一步，基础 LSP 仍可工作，但补全候选的能力声明不完整，体验可能变弱。

## 5. 添加 Go 常用片段

SNIPPETS

新增 `lua/config/snippets.lua`。片段少一点，准一点。今天只保留四类：函数、测试、表驱动测试、error return。

```
local ls = require("luasnip")
local s = ls.snippet
local t = ls.text_node
local i = ls.insert_node

ls.add_snippets("go", {
  s("gofunc", {
    t("func "), i(1, "Name"), t("("), i(2), t({ ") {", "\t" }),
    i(0),
    t({ "", "}" }),
  }),
  s("gotest", {
    t("func Test"), i(1, "Name"), t({ "(t *testing.T) {", "\t" }),
    i(0),
    t({ "", "}" }),
  }),
  s("goerr", {
    t({ "if err != nil {", "\treturn " }), i(1, "err"),
    t({ "", "}" }),
  }),
  s("gotable", {
    t({ "tests := []struct {", "\tname string", "\tinput " }), i(1, "string"),
    t({ "", "\twant " }), i(2, "string"),
    t({ "", "}{", "\t{name: " }), i(3, "\"case\""),
    t(", input: "), i(4, "\"input\""),
    t(", want: "), i(5, "\"want\""),
    t({ "},", "}", "", "for _, tt := range tests {", "\tt.Run(tt.name, func(t *testing.T) {", "\t\t" }),
    i(0),
    t({ "", "\t})", "}" }),
  }),
})
```

在 `config.completion` 后加载 `config.snippets`。如果片段展开报错，先看 Lua 语法，再看插件是否安装。

## 6. 在 tasknote 里验证

DRILL

回到 Day05 的项目，用补全和片段完成一次真实小改动。

$ cd ~/code/lab/tasknote
$ nvim task\_test.go

| 任务 | 动作 | 验收 |
| --- | --- | --- |
| 验证 LSP 候选 | 输入 `strings.` 或 `testing.` 后触发补全。 | 菜单里出现来自 gopls 的函数或类型候选。 |
| 展开测试片段 | 输入 `gotest`，按 `Tab` 展开。 | 生成 `func Test...(t *testing.T)` 骨架。 |
| 补一条错误测试 | 用 `gotable` 或手写表格，覆盖空标题和多空格标题。 | `go test ./...` 通过。 |
| 测试 error return | 在临时函数里输入 `goerr` 展开。 | 确认占位符跳转顺序符合自己的习惯，练完删掉临时代码。 |

补全出现慢时，不要连续敲键。先确认 LSP attach，再确认 `:Lazy` 里 cmp 和 LuaSnip 已加载。

## 7. 常见问题定位

DEBUG

| 现象 | 可能原因 | 排查方式 |
| --- | --- | --- |
| 按 Enter 总是误选补全 | `select = true` 或预选未关闭。 | 确认 `preselect = cmp.PreselectMode.None` 和 `select = false`。 |
| 没有 LSP 候选 | gopls 没 attach，或 capabilities 没传进去。 | `:lua vim.print(vim.lsp.get_clients())`，检查 `capabilities`。 |
| 片段不展开 | LuaSnip 未加载，或 snippet 文件没有 require。 | `:lua print(pcall(require, "luasnip"))`。 |
| Tab 行为奇怪 | Tab 同时承担菜单选择、片段跳转、缩进 fallback。 | 先在一个空 Go 文件里测试，再回到真实项目。 |

补全问题通常分三层：插件是否加载、LSP 是否 attach、按键是否被其它映射抢走。按这个顺序查。

## 8. 写 Day08 日志并提交

COMMIT

记录你最后保留了哪些补全行为。以后觉得补全吵，先回来看这份日志，而不是继续加插件。

```
# Day08 completion and snippets log

## Completion
- engine:
- confirm key:
- manual trigger:
- preselect:

## Snippets
- gofunc:
- gotest:
- gotable:
- goerr:

## Validation
- LSP candidate tested:
- snippet expanded:
- go test result:

## Friction
- one completion behavior I disliked:
- one setting I changed:
```

$ cd ~/.config/nvim
$ git add lua/plugins/init.lua lua/config/completion.lua lua/config/snippets.lua lua/lsp/init.lua init.lua
$ git commit -m "day08 add completion and go snippets"
$ cd ~/code/lab/tasknote
$ go test ./...

EXIT CHECK

### 离开前自测

能说清楚一个候选来自 LSP、buffer、path 还是 snippet；能手动触发补全；能展开测试片段并用 Tab 跳过占位符。

## 参考资料

PRIMARY SOURCES

COMPLETION

### nvim-cmp

[nvim-cmp](https://github.com/hrsh7th/nvim-cmp) 提供补全菜单和 source 管理；[cmp-nvim-lsp](https://github.com/hrsh7th/cmp-nvim-lsp) 把 LSP completion capabilities 接给服务器。

SNIPPETS

### LuaSnip

[LuaSnip](https://github.com/L3MON4D3/LuaSnip) 提供 Lua 片段定义、展开和占位符跳转；[cmp\_luasnip](https://github.com/saadparwaiz1/cmp_luasnip) 把片段接入 cmp source。

[上一天：代码导航与项目搜索](/posts/infra/nvim-go-day07/)·[返回 Nvim + Go 30 天系统学习路线](/posts/infra/nvim-go-roadmap/)·[下一天：格式化与导入整理](/posts/infra/nvim-go-day09/)
