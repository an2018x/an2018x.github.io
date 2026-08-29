---
title: "Day 06 · JWT 深入 · JWS / JWE / JWK / JWA 全家族"
date: '2026-05-27'
draft: false
description: "认证授权 30 天 Day 06：拆开 JWT 的 Header.Payload.Signature 三段结构,理解 JWS/JWE/JWK/JWA 四条 RFC 的分工,辨析 HS256/RS256/PS256/ES256/EdDSA 五大算法的选型,掌握 iss/sub/aud/exp/nbf/iat/jti 七个标准声明。Phase 2 开篇。"
toc: true
tags:
  - Backend
  - Security
  - JWT
  - JWS
  - JWE
  - JWK
  - Go
---

DAY 06 · AUTHN / AUTHZ ROADMAP · 30 DAYS · PHASE 2 开篇

# JWT 三段论 _与四条 RFC_

Phase 2 开篇。JWT 是 OAuth / OIDC 时代的事实载荷格式—— 几乎所有"换 token"的协议最后都把数据塞进一个 JWT。 可它远不止"一串 base64"——背后是四条互相啮合的 RFC: **JWS** (签名)、 **JWE** (加密)、 **JWK** (密钥分发)、 **JWA** (算法集)。 Day 06 不讲攻击 (那是 Day 07 的事), 而是把这四个零件全部认清: Header.Payload.Signature 的物理结构 / 五大签名算法的选型 / 七个标准声明的语义。 看完 Day 06, 你能 _手撕_一个 HS256 JWT。

**DURATION** 75–105 min **READ** 35 min **HANDS-ON** 40 min **REVIEW** 20 min **STACK** Go · golang-jwt/jwt · openssl · jwt.io

## 思维导图

OVERVIEW

> **图：Day 06 思维导图**
>
> - DAY 06 · JWT 深入
> - STRUCTURE · FAMILY · ALG · CLAIMS
> - 01 · STRUCTURE
> - 三段结构
> - 02 · FAMILY
> - JWS / JWE / JWK
> - 03 · ALG
> - 算法选型
> - 04 · CLAIMS
> - 声明与 Go 实战
> - Header . Payload . Sig
> - base64url 编码
> - 紧凑 / JSON 序列化
> - RFC 7519 · §3
> - JWS = 签名 (默认)
> - JWE = 加密 (少用)
> - JWK = 密钥格式
> - JWA = 算法名约定
> - HS256 / 384 / 512
> - RS256 / PS256
> - ES256 / ES384
> - EdDSA (Ed25519)
> - iss / sub / aud
> - exp / nbf / iat
> - jti · 私有声明
> - 手撕 + golang-jwt
> - DELIVERABLES
> - 能裸眼解码 JWT 三段
> - 辨清四 RFC 分工
> - 能为场景挑算法
> - 手撕一个 HS256 JWT

FIG · Day 06 全景: 结构 → 家族 → 算法 → 声明 + 实战

## JWT 三段结构

20 MIN

JWT (RFC 7519) 之所以能成为事实标准, 一半功劳归于它的 **形状极其简单** —— 三段 base64url 用 `.` 拼起来, 一行字符串能传 HTTP Header 也能塞 Cookie。 理解 JWT 的第一件事不是密码学, 而是"_这串字符到底是什么_"。

### 真实例子拆解

> **图：JWT 三段结构**
>
> - JWT = HEADER · PAYLOAD · SIGNATURE
> - eyJhbGciOiJIUzI1NiJ9
> - .
> - eyJzdWIiOiI0MiIsImV4cCI6MTcyNzM0MDgwMH0
> - PoF2J3K7p9...mZx\_GwAQ
> - HEADER (base64url 解码)
> - {
> - "alg": "HS256",
> - "typ": "JWT"
> - }
> - PAYLOAD (base64url 解码)
> - "sub": "42",
> - "exp": 1727340800
> - SIGNATURE (32 字节原始)
> - HMAC-SHA256(
> - key,
> - H\_b64 + "." + P\_b64
> - )
> - · Header / Payload 只是 base64url, 任何人都能解开看见明文 — 不要往里放秘密
> - · Signature 是对 H\_b64 + "." + P\_b64 整段的签名 — 改一个字节就验不过
> - · "签名"和"加密"是两件事 · 默认 JWT 只签名不加密

FIG · 一个完整的 JWT 在 jwt.io 拖进去就是这个样子

**base64url vs base64** JWT 用的不是标准 base64, 而是 _base64url_ (RFC 4648 §5)—— 把 `+` 换成 `-`, `/` 换成 `_`, 并_去掉末尾的 = 填充_。 原因: 这套字符可以直接放进 URL / Cookie / HTTP Header 而不需要再次编码。 Go 里用 `base64.RawURLEncoding`("Raw"代表去掉 = 填充)。

### 两种序列化形式

| 形式 | 样子 | 适用 |
| --- | --- | --- |
| Compact | eyJ.....eyJ.....xxx | 默认 · HTTP Header / Cookie / URL · 99% 场景用这个 |
| JSON Serialization | {"protected":"...","payload":"...","signature":"..."} | 需要 **多个签名** 或 **未保护头** 时 · 罕见 |

### 手撕一个 JWT (不用任何库)

```
// 30 行用标准库手撕 HS256 — 看清"签名前签名后"
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/base64"
    "encoding/json"
    "fmt"
)

func main() {
    key := []byte("my-secret-key-at-least-32-bytes!!")

    // 1) 构造 Header 和 Payload (任何 JSON 对象都行)
    header := map[string]any{"alg": "HS256", "typ": "JWT"}
    payload := map[string]any{"sub": "42", "exp": 1727340800}

    hJSON, _ := json.Marshal(header)
    pJSON, _ := json.Marshal(payload)

    // 2) base64url 编码 — RawURLEncoding 去掉 = 填充
    h64 := base64.RawURLEncoding.EncodeToString(hJSON)
    p64 := base64.RawURLEncoding.EncodeToString(pJSON)

    // 3) 签名: 对 "H64.P64" 整段做 HMAC-SHA256
    signingInput := h64 + "." + p64
    mac := hmac.New(sha256.New, key)
    mac.Write([]byte(signingInput))
    s64 := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

    // 4) 拼起来就是 JWT
    token := signingInput + "." + s64
    fmt.Println(token)
    // → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjczNDA4MDAsInN1YiI6IjQyIn0.xxx
}
```

把输出拖到 `jwt.io`, 它能解出 Header / Payload, 但 **签名验证** 需要你填入相同的 secret

## JWS / JWE / JWK / JWA 全家族

20 MIN

"JWT"这个词其实是个_容器_—— 它真正的实质是 **JWS** (签名形态)或 **JWE** (加密形态)。 绝大多数我们日常说的 JWT, 都是 JWS; 另外两条 RFC **JWK / JWKS** (密钥分发)和 **JWA** (算法标识) 是它们的支撑设施。这四条 RFC 一起构成 "JOSE" (JavaScript Object Signing and Encryption)。

### JWS vs JWE

> **图：JWS vs JWE 对比**
>
> - JWS · 签名 (默认 99% JWT)
> - 明文 Payload
> - {"sub":"42","exp":...}
> - 加上签名 → 三段式
> - H.P.Signature
> - 保证: 完整性 + 来源可证
> - ✗ 不保证: 机密 (Payload 明文)
> - RFC 7515 · 用 HS / RS / PS / ES / EdDSA
> - JWE · 加密 (少用 · 复杂)
> - 五段式 · 全程密文
> - H.EncKey.IV.CT.Tag
> - 保证: 完整性 + 机密 + 认证 (AEAD)
> - ✗ 代价: 实现复杂 · 算法选错易塌
> - RFC 7516 · AES-GCM / ECDH-ES

FIG · 99% 场景 JWS 就够; 只有"Token 中需要保密信息"才上 JWE

### 四条 RFC 的分工

| RFC | 名字 | 定义了什么 | 实战意义 |
| --- | --- | --- | --- |
| RFC 7515 | JWS | JSON Web Signature 的结构与处理 | "签名版 JWT" |
| RFC 7516 | JWE | JSON Web Encryption 的结构与处理 | "加密版 JWT" |
| RFC 7517 | JWK | 把公钥 / 私钥表达为 JSON | OIDC `jwks_uri` 用它分发公钥 |
| RFC 7518 | JWA | 规定算法标识符 (HS256 / RS256...) | Header 里 alg 字段的字典 |
| RFC 7519 | JWT | 定义"装在 JWS/JWE 里的 Claims 集合" | 俗称 "JWT" 的来源 |
| RFC 7520 | Cookbook | 各种使用样例 / 测试向量 | 调试用 |

**易混的命名**"_JWT_" 严格说指 **携带 Claims 的 JWS 或 JWE** 。 但日常工程师互相说"JWT"几乎总指_JWS 形态_(三段, 签名)。 面试 / 文档里看到对方说"JWT", 默认理解成 JWS 即可。

### JWK 与 JWKS

JWK (JSON Web Key) 是一种 _用 JSON 表达密钥_ 的格式; JWKS (JWK Set) 是 JWK 的数组——OIDC / OAuth 服务器在 `/.well-known/jwks.json` 暴露这个, 客户端拉过来就能用对应 `kid` 验证 JWT 签名。Day 18 OIDC Discovery 会展开。

```
# 一个公开的 RSA 公钥 (JWK 形态)
{
  "kty": "RSA", // 密钥类型: RSA / EC / OKP
  "use": "sig", // 用途: sig 签名 / enc 加密
  "alg": "RS256", // 使用的 JWA 算法
  "kid": "2024-01-rsa-key", // key id — JWT Header 通过这个找钥匙
  "n": "sXch...(modulus)...",
  "e": "AQAB" // 公钥指数 (65537)
}

# JWKS = JWK 的数组, 一个端点里可以同时有"当前 key"和"上一把 key"
{
  "keys": [
    { "kid": "2024-01", "kty": "RSA", "alg": "RS256", ... },
    { "kid": "2023-12", "kty": "RSA", "alg": "RS256", ... }
  ]
}
```

关键: JWT Header 一定要带 `kid`, 验证方按 kid 在 JWKS 里查公钥——这是密钥轮换的基础设施

## 算法选型: HS / RS / PS / ES / EdDSA

20 MIN

Day 02 已经讲过 HMAC、RSA、ECDSA、Ed25519 各自的底层取舍。 这一节专门看这些算法在 JWT 里怎么命名、怎么挑—— **不同算法的安全模型完全不同, 选错一个比不签名还危险** 。

### JWA 算法标识对照

| alg 值 | 类型 | 底层 | 密钥模型 | 典型用途 |
| --- | --- | --- | --- | --- |
| HS256 / 384 / 512 | 对称 MAC | HMAC-SHA-2 | 双方 **共享同一密钥** | 单服务自签自验 · 简单场景 |
| RS256 / 384 / 512 | 非对称签名 | RSA + PKCS#1 v1.5 | 私钥签 / 公钥验 | OIDC / OAuth 默认 · 兼容性最好 |
| PS256 / 384 / 512 | 非对称签名 | RSA-PSS | 私钥签 / 公钥验 | 新项目优先于 RS · 概率性签名更安全 |
| ES256 / 384 / 512 | 非对称签名 | ECDSA (P-256/384/521) | 私钥签 / 公钥验 | 空间敏感场景 · 签名只有 64 字节 |
| EdDSA | 非对称签名 | Ed25519 (默认) | 私钥签 / 公钥验 | 新建私有协议首选 · 难误用 · 最快 |
| none | 无 | 不签名 | 无 | 不许在生产出现 · Day 07 会讲攻击 |

### 五种算法的体积与速度

| 算法 | 密钥大小 | 签名大小 | 签名速度 | 验证速度 |
| --- | --- | --- | --- | --- |
| HS256 | ≥ 32 字节 | 32 字节 | 极快 | 极快 |
| RS256 (2048) | ~270 字节 (pub) | 256 字节 | 慢 | 较快 |
| PS256 (2048) | ~270 字节 (pub) | 256 字节 | 慢 | 较快 |
| ES256 (P-256) | ~65 字节 (pub) | 64 字节 | 中等 | 中等 |
| EdDSA (Ed25519) | 32 字节 (pub) | 64 字节 | 很快 | 很快 |

**选型决策树** _(1)_ 单服务自己签自己验 (Session 替代品)? — 用 `HS256`, 简单足够; _(2)_ 需要分发公钥给三方验证 (OIDC ID Token / OAuth Access Token)? — 用 `RS256` 兼容性最好, 新项目推 `PS256` 或 `ES256`; _(3)_ 完全自有协议 + 想要现代化? — 用 `EdDSA`(Ed25519), 又快又难误用; _(4)_ JWT 经常在 HTTP Header 里跑, 在意体积? — 优先 `ES256` 或 `EdDSA`, RS256 签名 256 字节, JWT 总长可能突破 1KB。

### Go 实战 · 用 golang-jwt 签发与验证

```
// HS256 — 自签自验
$ go get github.com/golang-jwt/jwt/v5

import "github.com/golang-jwt/jwt/v5"

var secret = []byte("my-secret-at-least-32-bytes-long!!")

func signHS256() string {
    claims := jwt.MapClaims{
        "iss": "my-service",
        "sub": "42",
        "aud": "api.example.com",
        "exp": time.Now().Add(15 * time.Minute).Unix(),
        "iat": time.Now().Unix(),
        "jti": uuid.NewString(),
    }
    tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, _ := tok.SignedString(secret)
    return signed
}

func verifyHS256(s string) (jwt.MapClaims, error) {
    tok, err := jwt.Parse(s, func(t *jwt.Token) (any, error) {
        // 关键: 显式锁死算法, 不要"兼容多算法"
        if t.Method.Alg() != "HS256" {
            return nil, errors.New("unexpected alg")
        }
        return secret, nil
    },
        jwt.WithIssuer("my-service"),
        jwt.WithAudience("api.example.com"),
        jwt.WithExpirationRequired(),
    )
    if err != nil || !tok.Valid {
        return nil, err
    }
    return tok.Claims.(jwt.MapClaims), nil
}
```

```
// RS256 — 私钥签发 / 公钥验证
import (
    "crypto/rsa"
    "github.com/golang-jwt/jwt/v5"
)

var (
    privateKey *rsa.PrivateKey // 从 PEM 加载, openssl genrsa -out k.pem 2048
    publicKey *rsa.PublicKey // 同一密钥对的公钥
)

func signRS256() string {
    claims := jwt.MapClaims{"sub": "42", "exp": time.Now().Add(1 * time.Hour).Unix()}
    tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
    // 加 kid, 验证方据此到 JWKS 里查公钥
    tok.Header["kid"] = "2026-05-key"
    signed, _ := tok.SignedString(privateKey)
    return signed
}

func verifyRS256(s string) (jwt.MapClaims, error) {
    tok, err := jwt.Parse(s, func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, errors.New("unexpected alg")
        }
        // 实际场景: 根据 t.Header["kid"] 从 JWKS 里取对应公钥
        return publicKey, nil
    })
    if err != nil || !tok.Valid {
        return nil, err
    }
    return tok.Claims.(jwt.MapClaims), nil
}
```

关键防御: `jwt.Parse` 的 keyFunc 里必须 **显式校验** `t.Method.Alg()`——这是防 Day 07 alg 混淆攻击的第一道闸门

## 标准声明: iss / sub / aud / exp / nbf / iat / jti

20 MIN

JWT 的 Payload 是 _任意 JSON_, 但 RFC 7519 §4.1 预定义了 **七个"标准声明"** —— 这些字段被业界一致约定语义, 库和服务都默认认得。 用对它们, 你的 JWT 跟全世界互通; 用错或不用, 验证时各种边界 case 自己重新发明轮子。

### 七个标准声明

| 声明 | 全名 | 类型 | 含义 / 用法 |
| --- | --- | --- | --- |
| iss | Issuer | string | **谁签发的** · 通常是 AS 的 URL (如 `https://auth.example.com`) · 验证方 must match |
| sub | Subject | string | **这个 token 代表谁** · 通常是 user\_id · 在 iss 范围内必须唯一 |
| aud | Audience | string 或 string[] | **给谁用的** · 资源服务器拿到必须检查 aud 包含自己 · 错过会导致 token 串用 |
| exp | Expiration Time | NumericDate (秒) | **过期时间** · 必填 · 验证方拒绝 now \> exp |
| nbf | Not Before | NumericDate | 不早于此时间生效 · 可选 · 用于"延后激活"场景 |
| iat | Issued At | NumericDate | 签发时间 · 可选 · 审计 / "强制重新认证"判断用 |
| jti | JWT ID | string | 唯一 ID (UUID) · 用于 **防重放** · 或加入吊销黑名单的 key |

**aud 是最容易踩坑的字段** 想象你有两个 API: `api.example.com` 和 `admin.example.com`, 都接受同一个 AS 签发的 JWT。 如果资源方不检查 `aud` —— 普通用户的 token (aud=api) 直接调 admin 也会被认成功! **每个资源服务器必须断言: 这张票的 aud 包含我自己** 。 OIDC ID Token 的 aud 是 client\_id, OAuth Access Token 的 aud 是 RS 标识符——含义不同, 但都必须验。

### 完整 Payload 范例

```
{
  // === 七个标准声明 ===
  "iss": "https://auth.example.com",
  "sub": "user_42",
  "aud": ["api.example.com", "open-api.example.com"], // 可以多值
  "exp": 1727340800,
  "nbf": 1727340000,
  "iat": 1727340000,
  "jti": "7f3c4a98-9b3a-4a32-9...",

  // === OIDC / OAuth 常见扩展 ===
  "scope": "openid profile contact:read",
  "client_id": "app_3rd_party_abc",
  "acr": "urn:mace:incommon:iap:silver", // MFA 强度等级 (Day 05)
  "amr": ["pwd", "otp"], // 用了哪些认证方法

  // === 私有声明 — 业务自定义 ===
  "tenant": "acme-corp",
  "plan": "pro"
}
```

### 私有声明的命名约定

Payload 是任意 JSON, 但 **不要** 用 `user_id` / `email` 这种"裸名"——可能与未来标准化的声明冲突。 RFC 7519 §4.3 推荐用_命名空间式 URI_ 作 key, 避免碰撞:

```
{
  // ✗ 反例 — 裸名易冲突
  "role": "admin",
  "team": "backend",

  // ✓ 推荐 — URL 命名空间
  "https://example.com/role": "admin",
  "https://example.com/team": "backend",

  // ✓ 简化 — 命名空间前缀
  "ex:role": "admin",
  "ex:team": "backend"
}
```

### 验证时机清单

拿到一个 JWT 后, "验证"远不止"签名对不对"——以下七步缺一不可:

1. **解析 Header** , 取出 `alg` 和 `kid`。
2. **校验 alg** 在允许的白名单内(_显式列出_, 不要"接受任何算法")。
3. **根据 kid 取对应公钥 / 密钥** , 验证签名——签名错了立刻 reject。
4. **校验 exp** : `now < exp`(允许 30-60 秒时钟偏移)。
5. **校验 nbf** (如果有): `now >= nbf`。
6. **校验 iss** : 必须匹配预期的签发者。
7. **校验 aud** : 必须包含本服务的标识。

golang-jwt v5 通过 `jwt.WithIssuer` / `WithAudience` / `WithExpirationRequired` 等选项把这些断言自动做掉; 但 `alg` 的白名单仍需要你在 keyFunc 里手写

## 常见疑问

5 QUESTIONS

### Q1 · 网上人云亦云"JWT 取代 Session", 我新项目应该用哪个?

ANS

Day 01 Q1 已经给过答案, 这里再补一层" **为什么场景决定选择**":

**Session 适合** · 浏览器登录态——你能完全控制服务端 + Redis, 可以即时吊销、随时改权限、踢出账号。用户登录后服务端发个 SID Cookie, 简单且最安全。

**JWT 适合** · 跨服务的_授权凭证_——你签发的 token 要让其他服务 (甚至别的公司) 验证, 它们没法访问你的 Session Store。OAuth Access Token / OIDC ID Token 是典型场景, 必须用 JWT。

反过来想: 如果你的 token _只在自己服务里用_, 用 Session 几乎一定更好——吊销容易、不暴露 Claims、不用密钥轮换。如果 token _要给三方应用 / 跨服务用_, 才发挥 JWT 的价值。

开放平台的现实组合: _用户控制台_走 Session, _给三方应用的 Access Token_走 JWT。两者并存而非互斥。

### Q2 · HS256 用一个共享密钥就能跑, 比 RS256 简单多了, 是不是用它就行?

ANS

分场景:

**单服务自签自验** · HS256 完全 OK · 速度快、密钥就放在配置里, 没必要为了"高级"用 RS256。

**多服务都要验** · **必须** 用 RS / PS / ES / EdDSA。HMAC 是对称的, 验证方需要密钥 = 也能伪造 token。把签发权和验证权耦合在一起, 任何一个服务被攻破就等于全网沦陷。

典型反例: 后端服务签 HS256, 然后把密钥分发给前端 / SDK 让它"验证 token"。这等于_把签发权送出去_, 攻击者拿到 SDK 就能伪造任意 token。这种代码在新人代码里出现概率极高, code review 要警觉。

### Q3 · Payload 里能不能放敏感信息, 比如手机号 / 邮箱 / 身份证?

ANS

**不能。** JWS (普通 JWT) 的 Payload 是 base64url, 不是加密——任何持有 token 的人都能裸眼解码看到所有字段。

所以原则: Payload 里只放_不介意被对方看到的、用来做授权决策的_信息——user\_id、role、scope、exp 这些。 **不要** 放手机号、邮箱、身份证、内部 user 系统的隐私字段。

需要这些字段时的正确做法: _(1)_ JWT 里只放 user\_id, 资源服务器拿到后回查自己的 DB 取详情; _(2)_ OIDC 的 UserInfo 端点 (Day 17) 就是这个模式——ID Token 里只有基本 claims, 详细 profile 走另外的 API。

实在需要加密 JWT 的少数场景才用 JWE——但实现复杂、容易选错算法 · OWASP JWT Cheat Sheet 明确建议"能不用就不用 JWE"。

### Q4 · exp 设多长合适? 5 分钟太短用户老掉线, 24 小时又怕泄露危险。

ANS

这正是 **双 token 模式** 要解决的问题:

_Access Token_ · 短命 (5-15 分钟), 用于实际调 API · 泄露窗口很小。

_Refresh Token_ · 长命 (7-30 天), 仅用于换发新 Access Token · 永不进入 API 调用, 只跟 AS 通信。

Day 09 实战会展开。基本经验数:

· **高安全场景** (银行 / 管理后台): Access 5 分钟, Refresh 1-2 天

· **普通 SaaS** : Access 15 分钟, Refresh 7-14 天

· **开放平台三方应用** : Access 1-2 小时, Refresh 30-90 天

关键点: _无论多长, Refresh Token 都要 Rotation_——每次刷新都签发新 Refresh 并废弃旧的, 这样旧 token 被攻击者偷走也只有一次性的窗口。

### Q5 · 同一个 JWT 同时给多个服务用, aud 写多值可以吗?

ANS

**规范允许, 但工程上建议_不_这么做** 。

RFC 7519 §4.1.3 明确说 aud 可以是 string 或 string array, 每个资源方校验时只需检查"我的标识符在 aud 列表里"。从协议上没有问题。

但实战上, "一张 token 多服务用"违反 **最小权限原则** : API A 拿到的 token 同样能调 API B, 一旦 A 被攻破就同时丢失对 B 的访问控制。

更好的模式: _(1)_ 用 OAuth 2.0 的 **Token Exchange (RFC 8693)**——拿一个总 token 去换不同 aud 的子 token; _(2)_ 或者各 RS 各自获取独立 token, 通过 scope 区分。Day 13 会展开 Token Exchange 的细节。

aud 多值的合法用途主要是: _OIDC 场景里 ID Token 同时被前端和后端用_, 此时多值确实是最简单的选择。其他场景能避免就避免。

## 复盘问题

5 QUESTIONS

1. 用 30 秒讲清 JWT 三段结构, 以及为什么用 base64url 而不是标准 base64。
2. RFC 7515 / 7516 / 7517 / 7518 / 7519 各自定义什么? "JOSE" 是什么意思?
3. HS256 / RS256 / ES256 / EdDSA 四种算法的关键区别——密钥模型、体积、何时该选?
4. 七个标准声明分别是什么? 资源服务器收到 JWT 必须校验哪几个?
5. 动手用标准库 (不要用 golang-jwt) 写一段代码: 输入 header / payload / secret, 输出一个合法的 HS256 JWT。验证: 用 `jwt.io` 能解码成功。

## 今日检查清单

8 ITEMS

- 能拿一个真实 JWT, 用 `base64url` 解码出 Header / Payload 的内容
- 能讲清 base64url 与标准 base64 的差异 (字符替换 + 去填充)
- 能给同事画出 JWS / JWE / JWK / JWA / JWT 的关系图
- 能为"单服务 / 跨服务 / 体积敏感 / 现代化新建" 4 种场景各推荐一个签名算法
- 能列出七个标准声明的全名与含义, 并讲清 aud 错过会出什么事
- 跑通 Lab: 用标准库手撕一个 HS256 JWT, 在 jwt.io 验证签名通过
- 跑通 Lab: 用 golang-jwt 签发 + 验证 RS256 JWT, keyFunc 里显式锁死算法
- 读完 RFC 7519 §4 (Claims) 与 RFC 7515 §3 (JWS Compact Serialization)

## 推荐阅读

5 ITEMS

MUST READ · §4 + §7

### RFC 7519 · JSON Web Token

JWT 的总规范, 30 页。§4 标准声明 + §7 验证流程是工程师每隔半年应该重读的两节, 比任何博客都准确。

MUST READ · §3

### RFC 7515 · JSON Web Signature

JWS 的细节规范。§3 Compact Serialization 解释了三段结构的精确格式; §10 是安全考虑, 列出常见误用。

RFC · 算法字典

### RFC 7518 · JSON Web Algorithms

所有 alg 值的官方定义 (HS256 / RS256 / ES256 / EdDSA...) · 想知道某个算法标识的精确含义, 来这里查。

TOOL · 调试必备

### jwt.io · Debugger

JWT 调试器的事实标准, Auth0 维护。可以粘贴 token 解出 Header / Payload, 输入 secret 验证签名。 **慎用线上 token** ——粘进去等于发给 Auth0。

CHEAT SHEET

### OWASP JWT Cheat Sheet

OWASP 出品, 1 页讲完 JWT 安全要点。Day 07 会大量引用——提前看一遍, Day 07 学攻击时会更顺。

## Day 07 预告

NEXT

TOMORROW · DAY 07

### JWT 安全攻击与防御

今天讲完了 JWT 的"正常用法", 明天专门讲它的" **事故现场**"—— `alg=none` 漏洞为什么让一行配置能让你的服务_接受任意未签名 token_; **alg 混淆攻击** 怎么让攻击者用你的_RSA 公钥_伪造出 HS256 签名; **kid 注入** 如何利用宽松的 keyFunc 把验证密钥指向攻击者控制的资源; 以及如何_真正_实现 JWT 吊销 (黑名单 vs 短期 + Rotation)。 看完 Day 07, 你能审阅团队的 JWT 中间件, 找出大概率存在的隐患。

"JWT 不是密码学的胜利, 是 base64url + 几条短小 RFC 的胜利——简单到极致的设计才能被全行业采用, 哪怕代价是 Day 07 那一长串的攻击面。"

DAY 06 · AUTHN / AUTHZ 30-DAY ROADMAP · PHASE 2 开篇
