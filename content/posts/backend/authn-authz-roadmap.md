---
title: "认证授权 30 天系统学习路线（Go 开放平台视角）"
date: '2026-05-22'
draft: false
description: "从 HTTP Basic 到 OAuth 2.1，从 JWT 到 mTLS，从 RBAC 到 Google Zanzibar——面向 Go 后端 / 开放平台工程师的 30 天认证授权学习路线。"
toc: true
tags:
  - Backend
  - Security
  - OAuth
  - OIDC
  - JWT
  - RBAC
  - Roadmap
  - Go
---

AUTHN · AUTHZ · 30-DAY ROADMAP · OPEN PLATFORM

# 三十天精通 _认证授权_ —— 给 Go 开放平台工程师的路线

从 HTTP Basic 到 OAuth 2.1，从 JWT 到 mTLS，从 RBAC 到 Google Zanzibar。 六个阶段覆盖：基础认证 · 令牌与 JWT · OAuth 2.0 全家桶 · OIDC 与企业身份 · 授权模型 · 开放平台实战。 节奏：每天 45–90 分钟，先读规范 / 论文，后用 Go 实现最小可运行的样例。 原则—— **对着 RFC 读 → 画时序图 → 写 Go 实现 → 复盘攻击面。**

**TOTAL** 30 Days **PACE** 45–90 min / day **PHASES** 6 **STACK** Go · OAuth · OIDC · OPA · Hydra **TARGET** 设计 & 实现开放平台 IAM

## 阶段总览

OVERVIEW

> **图：认证授权 30 天学习路线阶段总览**
>
> - AUTHN / AUTHZ 30-DAY ROADMAP — 6 PHASES
> - PHASE 1
> - 基础认证
> - Day 1 – 5
> - PHASE 2
> - 令牌 / JWT
> - Day 6 – 9
> - PHASE 3 ★
> - OAuth 2.0
> - Day 10 – 16
> - PHASE 4
> - OIDC / SAML
> - Day 17 – 21
> - PHASE 5
> - 授权模型
> - Day 22 – 25
> - PHASE 6 ★
> - 开放平台实战
> - Day 26 – 30
> - KEY CONCEPTS
> - Session / Cookie
> - bcrypt / argon2
> - JWT / JWS
> - OAuth 2.1
> - OIDC
> - RBAC / ABAC
> - mTLS / SPIFFE
> - Open Platform IAM
> - SKILLS ACQUIRED
> - HTTP Auth
> - Crypto
> - JWT
> - SAML
> - Zanzibar
> - OPA / Casbin
> - mTLS
> - API Sign
> - DELIVERABLES
> - 能独立设计三方应用接入流程 · 能审计自家 OAuth Server · 能为微服务挑对的授权模型

六阶段 / 30 天 · 从协议规范到 Go 工程落地 · 终点是 Open Platform IAM

## 基础认证

DAY 1 – 5

把所有"老话题"一次性补齐。 HTTP Basic / Cookie / Session 是后面所有协议的语义基础； 密码学和 TLS 是所有 token 安全性的物理基础。 跳过这一阶段直接学 OAuth，会看着规范不知道为什么要这么设计。

**DAY 01 · 概念入门：AuthN vs AuthZ** — Authentication / Authorization / Accounting · HTTP Basic / Digest · Cookie / Session 模型

**DAY 02 · 密码学基础** — 哈希 SHA-256 · 密码哈希 bcrypt / argon2 · 对称 / 非对称加密 · HMAC · 数字签名

**DAY 03 · PKI 与 TLS / HTTPS** — 证书链 · CA · TLS 1.3 握手 · SNI · ALPN · mTLS 入门

**DAY 04 · 会话管理与 Web 安全** — Server-side Session · Session Fixation · CSRF · SameSite · XSS · HttpOnly / Secure

**DAY 05 · 多因素认证 MFA** — TOTP / HOTP (RFC 6238 / 4226) · SMS OTP 的真实风险 · WebAuthn / Passkey · FIDO2

交付物: 用 Go + `net/http` 写一个支持 Cookie Session 登录 + bcrypt 存密码 + TOTP 二次验证的最小 demo

## 令牌与 JWT

DAY 6 – 9

JWT 是 OAuth / OIDC 时代的事实载荷格式，但也是事故重灾区。 这一阶段先把 JWS / JWE / JWK / JWA 一族规范理清， 再专门用一天复盘 JWT 的著名漏洞， 最后用 Go 实现带 JWKS 轮换的双 token 登录系统。

**DAY 06 · JWT 深入** — JWS / JWE / JWK / JWA 关系 · Header / Payload / Signature · RS256 / HS256 / ES256 · 标准声明 iss / sub / aud / exp / nbf / jti

**DAY 07 · JWT 安全攻击** — alg=none 漏洞 · alg 混淆 · Key Confusion · 拒绝列表设计 · JWKS 端点

**DAY 08 · JWT 替代方案** — PASETO v3/v4 · Macaroon (带条件的 token) · Biscuit · Branca · 何时该用 / 不该用

**DAY 09 · Go 实战：双 Token 登录** — golang-jwt/jwt v5 · Access + Refresh 双 token · JWKS rotation · go-jose 处理 JWS / JWE

关键认知: JWT 不等于"加密"——默认只是签名（JWS）；需要保密时用 JWE，但更常见的做法是把敏感数据留在服务端

## OAuth 2.0 全家桶 _★ 开放平台核心_

DAY 10 – 16

整整一周专门给 OAuth 2.0。 开放平台的"接入第三方应用"，本质就是在搭 OAuth Authorization Server。 不只要懂"用哪个流程"，更要懂" **为什么是这个流程**"—— Implicit Flow 为什么被废、PKCE 解决什么问题、DPoP 又对 Bearer 做了什么补充。

**DAY 10 · OAuth 2.0 核心概念** — 四角色 RO / Client / AS / RS · 四种 Grant · Token & Scope · 端点 authorize / token / introspect / revoke

**DAY 11 · 授权码流程详解** — Authorization Code Flow 端到端 · state 防 CSRF · redirect\_uri 精确匹配 · 时序图练习

**DAY 12 · PKCE 与已废弃流程** — PKCE RFC 7636 (code\_verifier / code\_challenge) · Implicit Flow 为何废弃 · ROPC 为何不该用

**DAY 13 · 其他 Grant 流程** — Client Credentials (M2M) · Device Code Flow RFC 8628 (电视/打印机) · Token Exchange RFC 8693

**DAY 14 · Token 生命周期管理** — Access vs Refresh Token · Bearer vs Sender-Constrained · Introspection RFC 7662 · Revocation RFC 7009 · JWT Profile RFC 9068

**DAY 15 · OAuth 2.1 与 Security BCP** — 2.1 的合并与强制要求 · Security BCP 重点变化 · DPoP RFC 9449 · Resource Indicators RFC 8707

**DAY 16 · 攻击面与防御清单** — CSRF · Mix-up Attack · Code Injection · Redirect URI Manipulation · AS 安全 checklist

交付物: 用 fosite / hydra 起一个本地 AS，用 oauth2 客户端跑完整 Authorization Code + PKCE，并能解释每个参数为什么需要

## OIDC 与企业身份

DAY 17 – 21

OAuth 解决"授权"，OIDC 在它之上解决"认证"—— 开放平台里几乎所有"用 X 账号登录"都是这两套协议的组合。 企业客户接入则还要面对 SAML 这套上一个时代的协议，以及 SCIM 这种"用户/组同步"标准。

**DAY 17 · OIDC 核心** — ID Token vs Access Token · UserInfo Endpoint · scope openid / profile / email · nonce 防重放

**DAY 18 · OIDC Discovery & 动态注册** — .well-known/openid-configuration · JWKS 端点 · Dynamic Client Registration RFC 7591

**DAY 19 · OIDC 高级特性** — RP-Initiated Logout · Front / Back-Channel Logout · Session Management · CIBA

**DAY 20 · SAML 2.0 与企业 SSO** — IdP / SP / Federation · SAML Assertion · 与 OIDC 对比 · Office 365 / 钉钉 / 飞书 接入场景

**DAY 21 · SCIM 用户管理** — SCIM 2.0 RFC 7644 · 用户 / 组同步 · 与 OIDC / SAML 配合形成 IAM 闭环

关键区分: OAuth 给应用一张"代客户做事的票"，OIDC 在票上再印一行"持票人是谁"——SaaS 登录两者都要

## 授权模型 (AuthZ)

DAY 22 – 25

认证解决"你是谁"，授权解决"你能干什么"。 RBAC 适合管理后台，ABAC 适合复杂规则，ReBAC 适合"文档 / 资源"型权限（典型代表是 Google Docs）。 开放平台一般是组合：scope + RBAC 给 API 接入，资源级权限走 ReBAC。

**DAY 22 · RBAC 角色访问控制** — 用户 - 角色 - 权限 三段模型 · 角色层级 · 职责分离 SoD · 静态 vs 动态分配

**DAY 23 · ABAC 属性访问控制** — 属性建模 · XACML 架构 · PDP / PEP / PIP / PAP 四件套 · 适用 vs 不适用场景

**DAY 24 · ReBAC 与 Google Zanzibar** — Zanzibar 论文精读 · Userset Rewrites · SpiceDB / OpenFGA / Permify 选型对比

**DAY 25 · 策略引擎实战** — OPA + Rego 入门 · Cedar Policy · Casbin (Go 生态首选) · 与 gRPC / Gin 中间件集成

实战建议: 不要试图"一个模型走天下"——开放平台典型组合是 OAuth scope (粗粒度) + Casbin (RBAC 后台) + OpenFGA (资源级 ReBAC)

## 开放平台实战 _★ 业务落地_

DAY 26 – 30

最后五天，把所有协议落到真实的开放平台场景： 签名验证（API Key + HMAC）、三方应用接入与配额、服务间 mTLS、零信任架构， 最终用 Ory Hydra + Casbin + Go 搭一个能跑的小型 IAM。

**DAY 26 · API Key 与签名认证** — API Key 设计 · AWS SigV4 / 阿里云 / 飞书签名算法 · Webhook HMAC 验签 · 时间窗口防重放

**DAY 27 · 三方应用接入与 Marketplace** — 应用注册流程 · Client Credentials 申请审核 · Scope 治理 · 配额与限流 · 租户隔离

**DAY 28 · 服务间认证** — mTLS 自签证书 · SPIFFE / SPIRE 身份框架 · Istio / Linkerd Service Mesh 认证模型

**DAY 29 · 零信任架构** — BeyondCorp 论文 · ZTNA · Identity-Aware Proxy · 设备身份 · 持续验证 (Continuous Verification)

**DAY 30 · 综合实战：搭一个迷你开放平台** — Ory Hydra (OAuth2 Server) + Kratos (Identity) + Casbin (RBAC) + Go API + 一个三方应用 demo 全链路打通

终极目标: 别人提"如何接我们的开放平台"时，你能画清楚 SDK 申请 → OAuth 授权 → API 调用 → Webhook 回推 的全流程，并解释每一步的安全考虑

## 规范 / RFC 速查

REFERENCE

这一行是这套路线最重要的资料。 认证授权领域所有"博客知识"最终都要回到这几篇规范才有定论。 建议每天学习的最后 15 分钟，对着 RFC 看一遍今天的主题。

| 编号 | 规范 | 说明 | 对应阶段 |
| --- | --- | --- | --- |
| RFC 7617 | HTTP Basic Auth | 最简单的 HTTP 认证方案，base64(user:pass) | P1 · Day 1 |
| RFC 6238 | TOTP 时间型一次性密码 | Google Authenticator / Authy 的核心算法 | P1 · Day 5 |
| WebAuthn L3 | W3C WebAuthn / Passkey | 无密码认证的事实标准，基于公私钥 | P1 · Day 5 |
| RFC 7519 | JSON Web Token (JWT) | Token 的载荷格式定义 | P2 · Day 6 |
| RFC 7515 | JSON Web Signature (JWS) | JWT 默认形态——只签名不加密 | P2 · Day 6 |
| RFC 7516 | JSON Web Encryption (JWE) | 需要保密的 JWT 用这个 | P2 · Day 6 |
| RFC 7517 | JSON Web Key (JWK / JWKS) | 公钥分发的标准格式 | P4 · Day 18 |
| RFC 6749 | OAuth 2.0 核心 | 开放平台的"宪法"——必须通读 | P3 · Day 10 |
| RFC 6750 | Bearer Token 使用 | Authorization: Bearer xxx 的来源 | P3 · Day 14 |
| RFC 7636 | PKCE | 移动 / SPA 场景的必备加固 | P3 · Day 12 |
| RFC 7662 | Token Introspection | 资源服务器在线验证 token | P3 · Day 14 |
| RFC 7009 | Token Revocation | 主动吊销 token 的标准端点 | P3 · Day 14 |
| RFC 8252 | OAuth for Native Apps | 移动 / 桌面 App 的 OAuth 最佳实践 | P3 · Day 12 |
| RFC 8628 | Device Code Flow | 电视 / 打印机 / CLI 的 OAuth | P3 · Day 13 |
| RFC 8693 | Token Exchange | 跨域 token 换发，零信任常用 | P3 · Day 13 |
| RFC 9068 | JWT Profile for Access Tokens | 把 Access Token 标准化为 JWT 的规范 | P3 · Day 14 |
| RFC 9449 | DPoP | Sender-Constrained Token,解决 Bearer 被偷的问题 | P3 · Day 15 |
| RFC 6819 | OAuth Threat Model | OAuth 安全模型,Day 16 必读 | P3 · Day 16 |
| OIDC Core 1.0 | OpenID Connect Core | OAuth 之上的认证层 | P4 · Day 17 |
| RFC 7591 | Dynamic Client Registration | OIDC 客户端动态注册 | P4 · Day 18 |
| SAML 2.0 | OASIS SAML Core | 企业 SSO 的老牌协议 | P4 · Day 20 |
| RFC 7644 | SCIM 2.0 | 跨系统的用户 / 组同步标准 | P4 · Day 21 |

## 核心概念对照表

12 CONCEPTS

| 概念 | 含义 | 使用场景 | 阶段 |
| --- | --- | --- | --- |
| AuthN vs AuthZ | 认证 = 你是谁；授权 = 你能做什么 | 任何登录系统的设计第一步：分清这两件事 | P1 · Day 1 |
| Session vs Token | 状态在服务端 (Session) 还是在客户端 (JWT) | 选型决定吊销 / 扩展性 / 安全性的取舍 | P1-P2 · Day 4 / 6 |
| OAuth 2.0 vs OIDC | OAuth 授权（拿 Access Token），OIDC 认证（拿 ID Token） | "用 X 登录" = OIDC；"调 X 的 API" = OAuth | P3-P4 · Day 10 / 17 |
| Access vs Refresh Token | 短命的资源凭证 vs 长命的换发凭证 | 权衡安全性与用户体验的核心机制 | P3 · Day 14 |
| Authorization Code vs Implicit | Code Flow 走后端换 token；Implicit 直接给前端 token (已废弃) | 新项目一律用 Code + PKCE | P3 · Day 11 / 12 |
| Bearer vs DPoP | Bearer "凭票即用"；DPoP 把 token 绑定到客户端密钥 | 高安全场景 / 公开客户端用 DPoP | P3 · Day 15 |
| OIDC vs SAML | OIDC JSON + REST，年轻；SAML XML，企业老协议 | 面向 C 端用 OIDC；面向大企业 IT 部门可能要 SAML | P4 · Day 17 / 20 |
| RBAC vs ABAC vs ReBAC | 角色 / 属性 / 关系 三种授权建模思路 | 后台管理 → RBAC；规则复杂 → ABAC；资源型 → ReBAC | P5 · Day 22-24 |
| PDP / PEP / PIP | 策略决策点 / 执行点 / 信息点（XACML 架构） | 策略引擎部署架构的标准术语 | P5 · Day 23 |
| API Key 签名 vs OAuth | 签名认证用对称密钥 + HMAC，OAuth 走 token 体系 | 云厂商 OpenAPI 多用签名；SaaS 多用 OAuth | P6 · Day 26 |
| mTLS vs Bearer | mTLS 在传输层互验证书；Bearer 在应用层带 token | 服务间通信首选 mTLS；公网 API 用 Bearer | P6 · Day 28 |
| SSO vs Federation | SSO 是"一次登录处处用"，Federation 是"跨域信任建立" | SSO 多用 OIDC / SAML；Federation 多用 OIDC + IdP | P4 · Day 20 |

## 学习资源

RESOURCES

### 经典论文与规范

MUST READ

### OAuth 2.0 Security BCP

draft-ietf-oauth-security-topics——OAuth 安全的现代版"圣经"，比 RFC 6819 更新。Day 15 / Day 16 必读。

MUST READ

### Google Zanzibar 论文

"Consistent, Global Authorization System"——ReBAC 的祖师爷论文，现代权限系统（SpiceDB / OpenFGA）都是它的实现。Day 24 精读。

PAPER

### BeyondCorp 系列

Google 零信任架构 6 篇论文，从理念到落地。Day 29 的核心参考。

SPEC

### OAuth / OIDC Spec 全集

`oauth.net/2/` 与 `openid.net/specs/` 是规范权威入口，配合 RFC 速查表使用。

### 推荐书籍

1. **OAuth 2 in Action** — Justin Richer / Antonio Sanso · OAuth 入门最系统的书，Manning 出版
2. **API Security in Action** — Neil Madden · 后端 API 安全的全景图，覆盖 OAuth / JWT / mTLS / 容量限制
3. **Solving Identity Management in Modern Applications** — Yvonne Wilson · 偏企业 IAM 视角，SAML / OIDC / SCIM 都讲
4. **Zero Trust Networks** — Evan Gilman / Doug Barth · 零信任架构的实操指南
5. **白帽子讲 Web 安全** — 吴翰清 · 国内 Web 安全入门经典，Phase 1 的中文补充读物

### Go 生态选型

OAUTH SERVER

### ory/hydra

Go 写的 OAuth 2.0 / OIDC 服务器，CNCF 项目，生产可用。Day 30 实战核心组件。

IDENTITY

### ory/kratos

用户管理 / 注册 / 登录 / MFA 一站式后端，搭配 Hydra 形成完整 IAM。

AUTHZ

### casbin/casbin

Go 最流行的访问控制库，支持 RBAC / ABAC / RESTful，配置即模型。

REBAC

### openfga / spicedb

Zanzibar 的开源实现，资源级权限的现代选择。

JWT

### golang-jwt/jwt v5

Go 最常用的 JWT 库；JWS / JWE 用 go-jose/go-jose 更完整。

OAUTH CLIENT

### golang.org/x/oauth2

官方 OAuth 2.0 客户端实现，对接 GitHub / Google / 飞书等开放平台标配。

OIDC

### coreos/go-oidc

Go 里最成熟的 OIDC RP 实现，ID Token 验证 / Discovery 一把梭。

POLICY

### open-policy-agent/opa

通用策略引擎，Rego 语言写策略，K8s 准入控制 / 微服务授权都用它。

WORKLOAD ID

### spiffe / spire

服务身份框架，Service Mesh 与零信任的基础设施。

### 参考开放平台（拆解学习）

飞书 Open Platform钉钉开放平台企业微信GitHub AppsSlack APIStripe ConnectNotion APIAWS IAM / Cognito

学习方法: 选 1-2 个平台精读其"应用开发者文档"，特别看授权流程、scope 设计、签名机制——这是别人花几年沉淀的答案

## Go 代码骨架速查

SNIPPETS

### JWT 签发与校验（Day 9）

// go get github.com/golang-jwt/jwt/v5
 claims := jwt.MapClaims{
 &nbsp;&nbsp;"sub": userID,
 &nbsp;&nbsp;"aud": "openapi.example.com",
 &nbsp;&nbsp;"exp": time.Now().Add(15 \* time.Minute).Unix(),
 &nbsp;&nbsp;"iat": time.Now().Unix(),
 }
 token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
 signed, \_ := token.SignedString(privateKey)

// 校验时一定要 explicit 指定算法,避免 alg 混淆攻击
 parsed, err := jwt.Parse(signed, func(t \*jwt.Token) (any, error) {
 &nbsp;&nbsp;if t.Method != jwt.SigningMethodRS256 {
 &nbsp;&nbsp;&nbsp;&nbsp;return nil, errors.New("unexpected alg")
 &nbsp;&nbsp;}
 &nbsp;&nbsp;return publicKey, nil
 })

### OAuth 2.0 客户端（Day 11）

// go get golang.org/x/oauth2
 cfg := &oauth2.Config{
 &nbsp;&nbsp;ClientID: os.Getenv("CLIENT\_ID"),
 &nbsp;&nbsp;ClientSecret: os.Getenv("CLIENT\_SECRET"),
 &nbsp;&nbsp;RedirectURL: "https://app.example.com/callback",
 &nbsp;&nbsp;Scopes: []string{"openid", "contact:read"},
 &nbsp;&nbsp;Endpoint: myplatform.Endpoint,
 }

// 1) 生成 state + PKCE,跳到授权页
 state := randomString(32)
 verifier := oauth2.GenerateVerifier()
 url := cfg.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))

// 2) 回调里换 token
 tok, err := cfg.Exchange(ctx, code, oauth2.VerifierOption(verifier))

### Casbin RBAC 授权（Day 25）

// go get github.com/casbin/casbin/v2
 e, \_ := casbin.NewEnforcer("model.conf", "policy.csv")

// 中间件里检查权限
 ok, \_ := e.Enforce(userID, "/api/v1/contacts", "GET")
if !ok {
 &nbsp;&nbsp;c.AbortWithStatus(http.StatusForbidden)
 &nbsp;&nbsp;return
 }

### HMAC 签名验证（Day 26）

// 验证开放平台 Webhook 签名
 mac := hmac.New(sha256.New, []byte(appSecret))
 mac.Write([]byte(timestamp + "\n" + nonce + "\n" + string(body)))
 expected := hex.EncodeToString(mac.Sum(nil))

if !hmac.Equal([]byte(expected), []byte(receivedSig)) {
 &nbsp;&nbsp;return errors.New("invalid signature")
 }
// 务必检查 timestamp 在 ±5 分钟内,防重放

## 学习方法建议

5 PRINCIPLES

01

### 跟 RFC 走

OAuth / OIDC 的中文博客质量参差不齐，很多结论已过时（比如还在推 Implicit Flow）。每天最后 15 分钟对着 RFC 复核一遍今天的主题。

02

### 画时序图说服自己

每个流程都用 Mermaid / Excalidraw 画一遍时序图。搞清楚每条消息里" **谁** 把 **什么** 发给 **谁** 、 **为什么** 需要它"，比读十篇博客有效。

03

### 同时学攻击面

学每个机制时同步学它的攻击方式：JWT 学 alg 混淆，OAuth 学 Mix-up，Cookie 学 CSRF。安全感来自理解威胁模型，不来自"听说安全"。

04

### 自己实现一遍

读完规范一定要写 Go 代码。最小 OAuth Server + 最小 Client 走完整 Code Flow，能学到所有文章都没讲的细节。

05

### 关注废弃与演进

Implicit Flow / ROPC / SMS OTP / 自签 JWT 加密——这些"还活着但不该用"的，要知道 **为什么被废弃** 、 **替代方案是什么** 。这是高级工程师的判断力来源。

"好的认证授权系统，让用户感觉不到它的存在，让攻击者感觉无从下手。"

AUTHENTICATION · AUTHORIZATION · 30-DAY ROADMAP · GO BACKEND · OPEN PLATFORM
