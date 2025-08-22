---
title: "SSH 相关"
date: '2025-08-22'
draft: false
description: 整理常用的 SSH 操作
toc: true
---


## Github SSH 配置

1. 生成 ssh 密钥对：

```shell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

-t 用来指定密钥类型，ed25519 是高性能椭圆曲线算法，更推荐。

-C 用来指定注释，用来区分不同的 ssh 密钥，一般使用 Github 邮箱地址。

```shell
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

也可以使用 rsa 密钥类型, -b 用来指定位数

2. 将 ssh 公钥粘贴到剪切板：

```shell
pbcopy < ~/.ssh/id_ed25519.pub
```

id_[密钥类型].pub，需要根据实际情况替换密钥类型为第一步设置的密钥类型。

3. 打开 Github -> 个人资料 -> 设置 -> SSH 和 GPG 密钥

4. 新建 SSH 密钥或者添加 SSH 密钥。


## 管理多个密钥

1. 为不同的密钥设置不同的名称：

```shell
# 生成 GitHub 专用密钥
ssh-keygen -t ed25519 -f ~/.ssh/github_key -C "github@example.com"

# 生成 GitLab 专用密钥
ssh-keygen -t ed25519 -f ~/.ssh/gitlab_key -C "gitlab@example.com"

# 生成公司服务器专用密钥
ssh-keygen -t ed25519 -f ~/.ssh/company_server -C "company@example.com"
```

2. 配置 ssh 配置文件

```shell
# GitHub 配置
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_key  # 指定对应密钥
  IdentitiesOnly yes  # 只使用指定的密钥，不尝试其他密钥

# GitLab 配置
Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile ~/.ssh/gitlab_key
  IdentitiesOnly yes

# 公司服务器（假设域名是 company.com）
Host company-server
  HostName ssh.company.com  # 实际服务器地址
  User your_username  # 登录用户名
  IdentityFile ~/.ssh/company_server
  IdentitiesOnly yes

# 可以用通配符匹配一类主机
Host *.internal.company.com
  IdentityFile ~/.ssh/company_internal_key
  User dev
```

通过 ~/.ssh/config 文件定义不同主机对应的密钥。

## 免密登录

1. 生成 SSH 密钥对。
2. 将公钥部署到目标服务器。

```shell
pbcopy < ~/.ssh/id_ed25519.pub
```

```shell
echo "本地公钥内容" >> ~/.ssh/authorized_keys
```

3. 设置 authorized_keys 权限

```shell
chmod 600 ~/.ssh/authorized_keys
```

4. 使用 ssh-copy-id 自动化部署 （推荐）

可以跳过 2, 3 步。

```shell
# 格式：ssh-copy-id -i 本地私钥路径 用户名@服务器IP
ssh-copy-id -i ~/.ssh/server_key root@192.168.1.100
```

5. 指定密钥登录

```shell
# 格式：ssh -i 本地私钥路径 用户名@服务器IP
ssh -i ~/.ssh/server_key root@192.168.1.100
```

6. 通过服务器配置登录

```shell
Host myserver  # 自定义别名（后续可用 ssh myserver 登录）
  HostName 192.168.1.100  # 服务器IP或域名
  User root  # 登录用户名
  IdentityFile ~/.ssh/server_key  # 本地私钥路径
  IdentitiesOnly yes  # 强制使用指定密钥
```

```shell
ssh myserver  # 自动匹配密钥，实现免密登录
```