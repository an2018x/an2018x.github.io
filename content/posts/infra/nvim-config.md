---
title: "我的 Nvim 配置整理"
date: '2026-06-13'
draft: false
description: "整理当前 ~/.config/nvim 配置：lazy.nvim、Catppuccin、Telescope、Neo-tree、gitsigns、Diffview、which-key、lualine、Trouble、nvim-cmp 和 Go LSP。"
toc: true
tags:
  - Neovim
  - Go
  - Lua
  - Tooling
---

# 目标

这份配置的目标不是把 Nvim 变成一个很重的 IDE，而是先把 Go 开发中最常用的能力补齐：

- 文件搜索、全文搜索、buffer 切换：Telescope
- 目录树和 Git 文件状态：Neo-tree
- 当前文件 Git 修改块：gitsigns
- Git diff、文件历史：Diffview
- Git 面板：Neogit
- 快捷键提示：which-key
- 状态栏：lualine
- 诊断列表、quickfix、references 展示：Trouble
- 补全和片段：nvim-cmp + LuaSnip
- Go LSP：gopls
- 主题和语法高亮：Catppuccin + Treesitter

# 系统依赖

部分插件需要系统命令配合。比如 Markdown 图片粘贴和渲染：

```shell
brew install pngpaste imagemagick
```

这里两个工具的作用分别是：

| 工具 | 作用 |
|---|---|
| `pngpaste` | 读取 macOS 剪切板里的图片，并保存成 png 文件 |
| `imagemagick` | 给 `image.nvim` 处理图片尺寸、格式和预览渲染 |

安装后可以这样检查：

```shell
which pngpaste
which magick
magick -version
```

# 目录结构

当前配置目录如下：

```text
~/.config/nvim/
  init.lua
  lua/
    config/
      init.lua
      options.lua
      keymaps.lua
      completion.lua
    lsp/
      init.lua
    plugins/
      init.lua
```

加载顺序是：

```text
options -> plugins -> keymaps -> completion -> lsp
```

这个顺序很重要。`mapleader` 必须先定义，插件要先注册，之后快捷键和补全配置才能安全引用插件能力。

# 常用快捷键

## 基础

| 快捷键 | 作用 |
|---|---|
| `<leader>w` | 保存文件 |
| `<leader>h` | 清除搜索高亮 |
| `jj` | Insert 模式退出到 Normal |
| `<Esc><Esc>` | Terminal 模式退出到 Normal |
| `<C-h>` | 跳到左侧窗口 |
| `<C-j>` | 跳到下方窗口 |
| `<C-k>` | 跳到上方窗口 |
| `<C-l>` | 跳到右侧窗口 |
| `<leader>tt` | 底部打开终端 |
| `<D-c>` | macOS Command+C，复制到系统剪切板 |
| `<D-v>` | macOS Command+V，从系统剪切板粘贴 |

## Telescope

| 快捷键 | 作用 |
|---|---|
| `<leader>ff` | 搜索文件 |
| `<leader>fb` | 搜索已打开 buffer |
| `<leader>fg` | 全文搜索 |
| `<leader>fh` | 搜索帮助文档 |
| `<leader>fs` | 当前文件 symbols |
| `<leader>fS` | workspace symbols |

## Git

| 快捷键 | 作用 |
|---|---|
| `<leader>gg` | 打开 Neogit |
| `<leader>gd` | 打开 Diffview |
| `<leader>gD` | 关闭 Diffview |
| `<leader>gh` | 当前文件历史 |
| `<leader>gq` | 输入 Git revision/range 打开 Diffview |
| `]h` | 下一个 Git hunk |
| `[h` | 上一个 Git hunk |
| `<leader>hp` | 预览当前 hunk |
| `<leader>hs` | stage 当前 hunk |
| `<leader>hr` | reset 当前 hunk |
| `<leader>hb` | 查看当前行 blame |

## LSP 和诊断

| 快捷键 | 作用 |
|---|---|
| `gd` | 跳转定义 |
| `gr` | Telescope 展示引用 |
| `K` | 悬浮文档 |
| `<leader>rn` | 重命名 |
| `<leader>ca` | code action |
| `<leader>lf` | 格式化当前 buffer |
| `gl` | 当前行诊断浮窗 |
| `[d` | 上一条诊断 |
| `]d` | 下一条诊断 |
| `<leader>dq` | 诊断放入 quickfix |
| `<leader>dl` | 诊断放入 location list |

## Trouble

| 快捷键 | 作用 |
|---|---|
| `<leader>xx` | 项目诊断 |
| `<leader>xX` | 当前 buffer 诊断 |
| `<leader>xq` | quickfix list |
| `<leader>xl` | location list |
| `<leader>xr` | LSP references |

# init.lua

入口文件只做三件事：

1. 定义 leader。
2. 固定加载顺序。
3. 把具体配置交给各个模块。

```lua
-- Leader keys must be defined before loading plugins and keymaps.
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- Keep startup order explicit:
-- 1. editor options
-- 2. plugin manager and plugin specs
-- 3. user keymaps
-- 4. completion engine
-- 5. Go LSP setup
require("config.options")
require("plugins")
require("config.keymaps")
require("config.completion")
require("lsp")
```

# lua/config/options.lua

基础选项按用途分组：行号、缩进、颜色、搜索、滚动和 signcolumn。

```lua
local opt = vim.opt

-- Line numbers: absolute number for the current line, relative numbers for
-- quick motion counts such as 5j or 3k.
opt.number = true
opt.relativenumber = true

-- Indentation: use spaces by default. Go files are still formatted by gofmt,
-- so these settings mostly affect Lua, Markdown, and config files.
opt.expandtab = true
opt.shiftwidth = 2
opt.tabstop = 2

-- True color support is required by modern colorschemes such as Catppuccin.
opt.termguicolors = true

-- Search: ignore case unless the query contains uppercase letters.
opt.ignorecase = true
opt.smartcase = true
opt.incsearch = true

-- Keep context around the cursor and reserve the sign column for diagnostics,
-- Git markers, and breakpoints so text does not jump horizontally.
opt.scrolloff = 6
opt.signcolumn = "yes"
```

# lua/plugins/init.lua

插件统一由 lazy.nvim 管理。主题优先加载，UI 插件和开发插件按能力分组。

```lua
-- Bootstrap lazy.nvim if it has not been installed yet.
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  -- Colorscheme. Load first so every UI plugin can pick up the theme.
  {
    "catppuccin/nvim",
    name = "catppuccin",
    lazy = false,
    priority = 1000,
    opts = {
      flavour = "mocha",
      transparent_background = false,
      auto_integrations = true,
      integrations = {
        cmp = true,
        gitsigns = true,
        native_lsp = {
          enabled = true,
        },
        neotree = true,
        telescope = true,
        treesitter = true,
        trouble = true,
        which_key = true,
      },
    },
    config = function(_, opts)
      require("catppuccin").setup(opts)
      vim.cmd.colorscheme("catppuccin")
    end,
  },

  -- Fuzzy finder for files, grep, buffers, help, and LSP lists.
  {
    "nvim-telescope/telescope.nvim",
    branch = "0.1.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
    },
  },

  -- Completion engine and snippet support. The actual completion behavior lives
  -- in lua/config/completion.lua.
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

  -- Syntax-aware highlighting and indentation.
  {
    "nvim-treesitter/nvim-treesitter",
    branch = "master",
    build = ":TSUpdate",
    event = { "BufReadPost", "BufNewFile" },
    config = function()
      require("nvim-treesitter.configs").setup({
        ensure_installed = {
          "go",
          "gomod",
          "gosum",
          "gowork",
          "lua",
          "query",
          "vim",
          "vimdoc",
        },
        highlight = {
          enable = true,
        },
        indent = {
          enable = true,
        },
      })
    end,
  },

  -- File tree and Git status tree.
  {
    "nvim-neo-tree/neo-tree.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "MunifTanjim/nui.nvim",
      "nvim-tree/nvim-web-devicons",
    },
    keys = {
      {
        "<leader>e",
        "<cmd>Neotree toggle position=float reveal_force_cwd<cr>",
        desc = "Toggle file tree",
      },
      {
        "<leader>gs",
        "<cmd>Neotree float git_status<cr>",
        desc = "Neo-tree git status",
      },
    },
    opts = {
      enable_git_status = true,
      source_selector = {
        winbar = true,
        statusline = false,
      },
      filesystem = {
        follow_current_file = {
          enabled = true,
        },
        use_libuv_file_watcher = true,
      },
    },
  },

  -- Git signs in the sign column and hunk-level actions.
  {
    "lewis6991/gitsigns.nvim",
    event = { "BufReadPre", "BufNewFile" },
    opts = {
      on_attach = function(bufnr)
        local gs = package.loaded.gitsigns

        local function map(mode, lhs, rhs, desc)
          vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, desc = desc })
        end

        map("n", "]h", gs.next_hunk, "Next git hunk")
        map("n", "[h", gs.prev_hunk, "Previous git hunk")
        map("n", "<leader>hp", gs.preview_hunk, "Preview hunk")
        map("n", "<leader>hs", gs.stage_hunk, "Stage hunk")
        map("n", "<leader>hr", gs.reset_hunk, "Reset hunk")
        map("n", "<leader>hb", gs.blame_line, "Git blame line")
      end,
    },
  },

  -- Full Git UI for status, staging, committing, pushing, and pulling.
  {
    "NeogitOrg/neogit",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "sindrets/diffview.nvim",
      "nvim-telescope/telescope.nvim",
    },
    keys = {
      { "<leader>gg", "<cmd>Neogit<cr>", desc = "Open Neogit" },
    },
    opts = {},
  },

  -- Dedicated Git diff and file history views.
  {
    "sindrets/diffview.nvim",
    cmd = {
      "DiffviewOpen",
      "DiffviewClose",
      "DiffviewFileHistory",
    },
    keys = {
      { "<leader>gd", "<cmd>DiffviewOpen<cr>", desc = "Open git diff view" },
      { "<leader>gD", "<cmd>DiffviewClose<cr>", desc = "Close git diff view" },
      { "<leader>gh", "<cmd>DiffviewFileHistory %<cr>", desc = "Current file history" },
    },
  },

  -- Shows possible keybindings after pressing leader keys.
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    opts = {
      preset = "modern",
    },
  },

  -- Statusline with mode, branch, diff, diagnostics, filetype, and location.
  {
    "nvim-lualine/lualine.nvim",
    dependencies = {
      "nvim-tree/nvim-web-devicons",
    },
    event = "VeryLazy",
    opts = {
      options = {
        theme = "catppuccin",
        globalstatus = true,
        component_separators = { left = "|", right = "|" },
        section_separators = { left = "", right = "" },
      },
      sections = {
        lualine_a = { "mode" },
        lualine_b = { "branch", "diff" },
        lualine_c = {
          {
            "filename",
            path = 1,
          },
        },
        lualine_x = { "diagnostics", "encoding", "filetype" },
        lualine_y = { "progress" },
        lualine_z = { "location" },
      },
    },
  },

  -- Better UI for diagnostics, quickfix, location list, and references.
  {
    "folke/trouble.nvim",
    cmd = "Trouble",
    opts = {},
    keys = {
      {
        "<leader>xx",
        "<cmd>Trouble diagnostics toggle<cr>",
        desc = "Diagnostics",
      },
      {
        "<leader>xX",
        "<cmd>Trouble diagnostics toggle filter.buf=0<cr>",
        desc = "Buffer diagnostics",
      },
      {
        "<leader>xq",
        "<cmd>Trouble qflist toggle<cr>",
        desc = "Quickfix list",
      },
      {
        "<leader>xl",
        "<cmd>Trouble loclist toggle<cr>",
        desc = "Location list",
      },
      {
        "<leader>xr",
        "<cmd>Trouble lsp_references toggle focus=true<cr>",
        desc = "LSP references",
      },
    },
  },
})
```

# lua/config/keymaps.lua

这里放全局快捷键。LSP buffer-local 快捷键放在 `lua/lsp/init.lua` 里。

```lua
local map = vim.keymap.set

-- File and search basics.
map("n", "<leader>w", "<cmd>write<cr>", { desc = "Save file" })
map("n", "<leader>h", "<cmd>nohlsearch<cr>", { desc = "Clear search highlight" })

-- Keep wrapped-line movement natural for prose and Markdown.
map("n", "j", "gj", { desc = "Move down by visual line" })
map("n", "k", "gk", { desc = "Move up by visual line" })

-- Faster mode switching. jj is easier to reach than Esc on many keyboards.
map("i", "jj", "<Esc>", { desc = "Exit insert mode" })
map("t", "<Esc><Esc>", "<C-\\><C-n>", { desc = "Exit terminal mode" })

-- macOS Command-c / Command-v. Some terminals send these keys to Neovim as
-- <D-c> and <D-v>, so wire them to the system clipboard explicitly.
map("n", "<D-c>", '"+yy', { desc = "Copy line to system clipboard" })
map("x", "<D-c>", '"+y', { desc = "Copy selection to system clipboard" })
map("i", "<D-c>", '<C-o>"+yy', { desc = "Copy line to system clipboard" })

map("n", "<D-v>", '"+p', { desc = "Paste from system clipboard" })
map("x", "<D-v>", '"_d"+P', { desc = "Paste over selection from system clipboard" })
map("i", "<D-v>", "<C-r>+", { desc = "Paste from system clipboard" })
map("c", "<D-v>", "<C-r>+", { desc = "Paste from system clipboard" })
map("t", "<D-v>", function()
  vim.api.nvim_paste(vim.fn.getreg("+"), true, -1)
end, { desc = "Paste from system clipboard" })

-- Window navigation. These replace the longer Ctrl-w h/j/k/l sequence.
map("n", "<C-h>", "<C-w>h", { desc = "Move to left window" })
map("n", "<C-j>", "<C-w>j", { desc = "Move to lower window" })
map("n", "<C-k>", "<C-w>k", { desc = "Move to upper window" })
map("n", "<C-l>", "<C-w>l", { desc = "Move to right window" })

-- Terminal: open a small terminal at the bottom of the current tab.
map("n", "<leader>tt", "<cmd>botright 12split | terminal<cr>", {
  desc = "Open terminal",
})

-- Diffview: prompt for a custom Git revision or range, such as HEAD~1,
-- main..feature/foo, or origin/main...HEAD.
map("n", "<leader>gq", function()
  local target = vim.fn.input("Diff against: ", "")
  if target ~= "" then
    vim.cmd.DiffviewOpen({ args = { target } })
  end
end, { desc = "Diffview open custom range" })

-- Diagnostics are configured globally, so these work even before a language
-- server attaches. diagnostic_jump keeps compatibility with older Nvim builds.
local function diagnostic_jump(count)
  if vim.diagnostic.jump then
    vim.diagnostic.jump({ count = count })
    return
  end

  if count > 0 then
    vim.diagnostic.goto_next()
  else
    vim.diagnostic.goto_prev()
  end
end

map("n", "gl", vim.diagnostic.open_float, { desc = "Line diagnostic" })
map("n", "[d", function()
  diagnostic_jump(-1)
end, { desc = "Previous diagnostic" })
map("n", "]d", function()
  diagnostic_jump(1)
end, { desc = "Next diagnostic" })
map("n", "<leader>dq", function()
  vim.diagnostic.setqflist({ open = true })
end, { desc = "Diagnostics to quickfix" })
map("n", "<leader>dl", function()
  vim.diagnostic.setloclist({ open = true })
end, { desc = "Diagnostics to location list" })

-- Telescope shortcuts. pcall keeps the config loadable before Telescope is
-- installed or while lazy.nvim is syncing plugins.
local telescope_ok, builtin = pcall(require, "telescope.builtin")
if telescope_ok then
  map("n", "<leader>ff", builtin.find_files, { desc = "Find files" })
  map("n", "<leader>fb", builtin.buffers, { desc = "Find buffers" })
  map("n", "<leader>fg", builtin.live_grep, { desc = "Live grep" })
  map("n", "<leader>fh", builtin.help_tags, { desc = "Help tags" })
  map("n", "<leader>fs", builtin.lsp_document_symbols, { desc = "Document symbols" })
  map("n", "<leader>fS", builtin.lsp_workspace_symbols, { desc = "Workspace symbols" })
end

-- which-key group names make the leader popup easier to scan.
local which_key_ok, which_key = pcall(require, "which-key")
if which_key_ok then
  which_key.add({
    { "<leader>d", group = "diagnostic" },
    { "<leader>f", group = "find" },
    { "<leader>g", group = "git" },
    { "<leader>h", group = "hunk" },
    { "<leader>l", group = "lsp" },
    { "<leader>r", group = "rename" },
    { "<leader>t", group = "terminal" },
    { "<leader>x", group = "trouble" },
  })
end
```

## macOS 剪切板说明

在 macOS 终端里，Nvim 会把 Command 键显示成 `<D-...>`：`Command+C` 是 `<D-c>`，`Command+V` 是 `<D-v>`。这里没有改真正的 `<C-c>` 和 `<C-v>`，因为它们在 Vim 里有自己的用途：`<C-c>` 常用于中断当前操作，`<C-v>` 常用于块选择或插入特殊字符。

系统剪切板使用 `+` 寄存器：

```vim
"+y
"+p
```

所以上面的映射本质上是把 macOS 常用的复制粘贴手势转接到 `+` 寄存器。可视模式粘贴使用 `"_d"+P`，意思是先把选区删除到黑洞寄存器，再用系统剪切板内容覆盖选区，避免被删除的选区反过来污染剪切板。

# lua/config/completion.lua

补全配置保持一个原则：不自动选中候选项，避免回车误接受补全。

```lua
local cmp = require("cmp")
local luasnip = require("luasnip")

cmp.setup({
  -- Do not preselect a completion item. This prevents Enter from accepting a
  -- suggestion unless you explicitly selected it.
  preselect = cmp.PreselectMode.None,

  completion = {
    completeopt = "menu,menuone,noinsert,noselect",
  },

  -- LuaSnip expands snippet bodies returned by completion sources.
  snippet = {
    expand = function(args)
      luasnip.lsp_expand(args.body)
    end,
  },

  mapping = cmp.mapping.preset.insert({
    -- Manually open / close the completion menu.
    ["<C-Space>"] = cmp.mapping.complete(),
    ["<C-e>"] = cmp.mapping.abort(),

    -- Confirm only the item you selected.
    ["<CR>"] = cmp.mapping.confirm({ select = false }),

    -- Tab first navigates completion items, then snippet jump points, then
    -- falls back to normal tab behavior.
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

# lua/lsp/init.lua

Go LSP 配置负责：

- 给 gopls 提供 nvim-cmp completion capabilities。
- 找项目根目录。
- 如果 PATH 里没有 gopls，自动 fallback 到 `~/go/bin/gopls`。
- 在 LSP attach 后注册 `gd`、`gr`、`K`、rename、code action、format。
- 保存 Go 文件前自动格式化。

```lua
local M = {}

-- Let nvim-cmp advertise completion support to language servers.
local capabilities = vim.lsp.protocol.make_client_capabilities()
local cmp_lsp_ok, cmp_lsp = pcall(require, "cmp_nvim_lsp")
if cmp_lsp_ok then
  capabilities = cmp_lsp.default_capabilities(capabilities)
end

-- gopls needs the project root to understand modules and import paths.
local function root_dir()
  local marker = vim.fs.find({ "go.mod", ".git" }, { upward = true })[1]
  return marker and vim.fs.dirname(marker) or vim.fn.getcwd()
end

local function gopls_cmd()
  local from_path = vim.fn.exepath("gopls")
  if from_path ~= "" then
    return from_path
  end

  local from_gopath = vim.fn.expand("~/go/bin/gopls")
  if vim.fn.executable(from_gopath) == 1 then
    return from_gopath
  end

  return nil
end

local function on_attach(_, bufnr)
  local function map(lhs, rhs, desc)
    vim.keymap.set("n", lhs, rhs, { buffer = bufnr, desc = desc })
  end

  -- Core LSP navigation and editing actions.
  map("gd", vim.lsp.buf.definition, "Go to definition")
  map("K", vim.lsp.buf.hover, "Hover documentation")
  map("<leader>rn", vim.lsp.buf.rename, "Rename symbol")
  map("<leader>ca", vim.lsp.buf.code_action, "Code action")

  -- Synchronous formatting is safer for BufWritePre because the formatted
  -- content lands before the file is written to disk.
  map("<leader>lf", function()
    vim.lsp.buf.format({ async = false, bufnr = bufnr })
  end, "Format current buffer")

  -- Show references in Telescope so results are searchable and previewable.
  map("gr", function()
    require("telescope.builtin").lsp_references({
      include_current_line = true,
      include_declaration = false,
      jump_type = "never",
      layout_strategy = "horizontal",
      layout_config = {
        height = 0.85,
        preview_width = 0.6,
        width = 0.95,
      },
      show_line = true,
      trim_text = false,
    })
  end, "References")

  local group = vim.api.nvim_create_augroup("GoLspFormat", { clear = false })

  vim.api.nvim_clear_autocmds({ group = group, buffer = bufnr })
  vim.api.nvim_create_autocmd("BufWritePre", {
    group = group,
    buffer = bufnr,
    callback = function()
      vim.lsp.buf.format({ async = false, bufnr = bufnr })
    end,
  })
end

vim.diagnostic.config({
  virtual_text = {
    prefix = ">",
    source = "if_many",
  },
  signs = true,
  underline = true,
  update_in_insert = false,
  severity_sort = true,
  float = {
    border = "rounded",
    source = "if_many",
  },
})

function M.setup()
  local group = vim.api.nvim_create_augroup("GoLspStart", { clear = true })

  vim.api.nvim_create_autocmd("FileType", {
    group = group,
    pattern = "go",
    callback = function()
      local cmd = gopls_cmd()
      if not cmd then
        vim.notify(
          "gopls not found; install it or add GOPATH/bin to PATH",
          vim.log.levels.WARN
        )
        return
      end

      vim.lsp.start({
        name = "gopls",
        cmd = { cmd },
        root_dir = root_dir(),
        capabilities = capabilities,
        on_attach = on_attach,
      })
    end,
  })
end

M.setup()

return M
```

# 排查命令

如果配置加载异常，先用 headless 模式确认是否能启动：

```shell
nvim --headless +qa
```

检查 leader：

```vim
:echo mapleader
```

检查快捷键：

```vim
:map gd
:map <leader>gd
:map <leader>ff
```

检查 gopls：

```vim
:lua print(vim.fn.exepath("gopls"))
:lua print(vim.fn.expand("~/go/bin/gopls"), vim.fn.executable(vim.fn.expand("~/go/bin/gopls")))
```

检查当前 Go buffer 的 LSP：

```vim
:lua vim.print(vim.lsp.get_clients({ bufnr = 0 }))
```

检查 Treesitter：

```vim
:TSInstallInfo
:Inspect
```

# 当前约定

这份配置当前保留几个约定：

- `<leader>` 是空格。
- `gd` 永远留给 LSP 跳转定义。
- `<leader>g*` 是 Git 相关能力。
- `<leader>f*` 是 Telescope 查找。
- `<leader>x*` 是 Trouble 列表。
- `<leader>h*` 是 Git hunk。
- Go 文件保存前自动调用 LSP format。
- gopls 优先从 PATH 查找，找不到再使用 `~/go/bin/gopls`。
