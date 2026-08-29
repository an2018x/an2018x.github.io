---
title: "Day 01 · AuthN vs AuthZ · HTTP 认证与 Session 模型"
date: '2026-05-22'
draft: false
description: "认证授权 30 天 Day 01：辨析 AuthN/AuthZ/Accounting 三个 A，理解 HTTP Basic / Digest 的挑战-应答模型，掌握 Cookie/Session 的工作原理与三大安全属性,并用 Go 实现最小可运行的登录系统。"
toc: true
tags:
  - Backend
  - Security
  - Authentication
  - Session
  - Cookie
  - HTTP
  - Go
---

DAY 01 · AUTHN / AUTHZ ROADMAP · 30 DAYS

# 三个 A 与一只 _Cookie_

第一天的目标是把后面 29 天的"地基"打牢—— 辨清 Authentication / Authorization / Accounting 三个 A 各自的责任， 从 HTTP 这一层理解最早的认证方案 Basic / Digest， 再从 Cookie / Session 看懂"无状态协议如何支撑有状态登录"， 最后用 Go 写出一个 50 行就能跑通的最小登录系统。 跳过这一天，后面 OAuth / JWT 的所有"为什么这样设计"都会失去参照系。

**DURATION** 60–90 min **READ** 30 min **HANDS-ON** 30 min **REVIEW** 20 min **STACK** Go · net/http · curl · Chrome DevTools

## 思维导图

OVERVIEW

> **图：Day 01 思维导图**
>
> - DAY 01 · 概念 · HTTP 认证 · Session
> - CONCEPT · HTTP-AUTH · COOKIE · GO-LAB
> - 01 · CONCEPT
> - 三个 A 辨析
> - 02 · HTTP-AUTH
> - Basic / Digest
> - 03 · COOKIE
> - Cookie / Session
> - 04 · GO LAB
> - 动手实战
> - Authentication (你是谁)
> - Authorization (能做啥)
> - Accounting (做了啥)
> - 机场登机类比
> - RFC 7617 / 7616
> - Challenge-Response 模型
> - WWW-Authenticate / 401
> - 为何 Basic 必须配 HTTPS
> - RFC 6265 (Cookie)
> - Server-side Session
> - HttpOnly / Secure / SameSite
> - Session 存储选型
> - Go Basic Auth 解析
> - 手写 Session 存储
> - 用 scs 写正经版本
> - 用 DevTools 观察 Cookie
> - DELIVERABLES
> - 能讲清三个 A 的差别
> - 手算 Basic 头部 base64
> - 跑通 Go Session demo
> - 画出登录时序图

FIG · Day 01 全景: 概念 → HTTP 认证 → Cookie/Session → Go 实战

## AuthN / AuthZ / Accounting 三个 A

20 MIN

做开放平台最容易踩的第一个坑，就是把"认证"和"授权"混为一谈—— 新人写代码经常在登录中间件里直接判断"这个用户能不能访问这个 API"， 把两件事揉在一起，三个月后只能推倒重来。 所以第一天，先把这三个英文单字母都以 A 开头的概念彻底分开。

### 定义与区分

| 概念 | 回答的问题 | 典型机制 | 失败的代价 |
| --- | --- | --- | --- |
| Authentication (AuthN) | _你是谁?_ | 密码 · 短信验证码 · TOTP · 证书 · WebAuthn | 冒名登录(账号被盗) |
| Authorization (AuthZ) | _你能做什么?_ | RBAC · ABAC · OAuth Scope · 资源所有权检查 | 越权访问(看到别人的数据) |
| Accounting / Audit | _你做了什么?_ | 操作日志 · 审计流水 · 计量计费 · SIEM | 事后无法追溯/取证失败 |

**AAA 框架** 最早系统性提出 "Authentication / Authorization / Accounting" 三件套的是网络设备领域的 RADIUS (RFC 2865) 与 Diameter (RFC 6733) 协议—— 它们把这三件事拆成独立的接口，告诉我们： **这三件事在工程上必须解耦,否则无法独立演进** 。 在 Web 应用里我们一般把 Accounting 拆成"应用日志 / 安全审计 / 计量计费"三种不同的东西, 但本质仍然是"事后可追溯"。

### 机场登机类比

把这三件事映射到一次飞行体验:

AUTHN · 你是谁

### 护照查验

到机场先在边检窗口出示护照——这是 **认证** 。系统只确认"持有这本护照的人就是 Cheng An"，不关心你今天要去哪里。

AUTHZ · 能干啥

### 登机牌检验

到登机口出示登机牌——这是 **授权** 。系统确认你能上 CA1234 这趟航班的某个座位。同一本护照,没有这张登机牌就上不去。

ACCT · 干过啥

### 登机扫描记录

登机口扫码后留下时间戳——这是 **审计** 。即使你已经上飞机,系统仍然知道"5 月 22 日 14:03 谁登了哪个航班"。

关键洞察: 护照本身不告诉你"能上哪趟飞机";登机牌也不验证"你是不是这个人"。两件事各管各的,中间用一次"姓名比对"来联系——开放平台的 OAuth 授权码 / Access Token 流程就是这个模型的延伸。

### 为什么必须分开

1. **演进节奏不同。** 认证方式可能 5 年一变(从密码到 Passkey),授权策略可能每天都在调整。耦合在一起,改任何一边都要回归测试另一边。
2. **外包与委托能力不同。** 你可以把认证外包给"Sign in with Google"(OIDC),但授权(谁能调你哪个 API)必须自己控制——这是开放平台最基本的边界。
3. **故障影响面不同。** 认证挂了所有人登不上来;授权挂了可能"什么都能干"——后者通常更危险,需要不同等级的灰度与回滚机制。
4. **审计要求不同。** 认证关注"是不是本人",审计关注"做了哪些事"——前者是登录瞬间的快照,后者是连续的流水。

## HTTP 认证: Basic 与 Digest

25 MIN

HTTP 协议自己就内置了一套认证框架,叫 _HTTP Authentication_。 虽然今天 SaaS 应用很少直接用 Basic / Digest 登录, 但这两个老协议留下来的"Challenge-Response 模型"和 `Authorization` 请求头, 被后来的 Bearer Token / OAuth / Hawk 全部继承——理解它们就是理解一切 HTTP 鉴权的起点。

### Challenge-Response 时序

> **图：HTTP Basic Auth 时序图**
>
> - CLIENT (Browser / curl)
> - SERVER (Origin)
> - ① GET /admin · 不带 Authorization 头
> - ② 401 Unauthorized
> - WWW-Authenticate: Basic realm="ops"
> - 客户端弹出登录框 · 用户输入账号密码
> - credentials = base64("alice:s3cr3t")
> - ③ GET /admin
> - Authorization: Basic YWxpY2U6czNjcjN0
> - ④ 200 OK · 返回内容
> - 后续每个请求都要重新带 Authorization 头

FIG · HTTP Basic 的四步: 试探 → 挑战 → 应答 → 通过

### Basic 认证(RFC 7617)

最简单粗暴的方案: 把用户名和密码用冒号拼接、Base64 编码,放进 `Authorization` 请求头。

```
# 客户端手动构造
$ echo -n "alice:s3cr3t" | base64
YWxpY2U6czNjcjN0

# 浏览器 / curl 会自动加这一行
GET /admin HTTP/1.1
Host: api.example.com
Authorization: Basic YWxpY2U6czNjcjN0

# curl 一行测试
$ curl -u alice:s3cr3t https://api.example.com/admin
$ curl -H "Authorization: Basic YWxpY2U6czNjcjN0" https://api.example.com/admin
```

✓ 优点

### 简单到极致

所有 HTTP 客户端、所有服务器框架原生支持; 无需 Cookie / Session, 调试方便, 适合内网工具、CI 调用、Webhook 推送等"机器对机器"场景。

✗ 致命缺陷

### 密码每次都在路上

Base64 **不是加密** , 任何中间人都能立刻解码。所以 Basic **必须配 HTTPS** ; 没有 TLS 的 Basic Auth 等于把密码贴在公告栏。即使有 HTTPS, 也意味着每个请求都把"原始密码"送出去——一旦服务端日志记错, 立刻泄露。

### Digest 认证(RFC 7616)

为了让密码"不再上路", HTTP 设计了 Digest 方案: 服务端发一个一次性 nonce, 客户端用 nonce + 密码 + 请求方法 + URI 做哈希再回传。 这样服务端能验证, 但中间人拿到响应也复用不了(nonce 用完作废)。

```
# 服务端 challenge
WWW-Authenticate: Digest
  realm="api",
  qop="auth",
  nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
  opaque="5ccc069c403ebaf9f0171e9517f40e41"

# 客户端用 H(A1) + H(A2) + nonce 哈希后响应
# H(A1) = MD5(user:realm:password)
# H(A2) = MD5(method:uri)
# response = MD5( H(A1) : nonce : nc : cnonce : qop : H(A2) )

Authorization: Digest username="alice",
  realm="api",
  nonce="dcd98b71...",
  uri="/admin",
  qop=auth, nc=00000001, cnonce="0a4f113b",
  response="6629fae49393a05397450978507c4ef1"
```

**现状: 几乎被淘汰** Digest 在 1999 年(RFC 2617)就出现,2015 年由 RFC 7616 升级支持 SHA-256。 但它从未真正流行——原因是: _(1)_ 服务端必须能拿到密码明文或可逆形式才能计算 H(A1), 与"密码必须 bcrypt 哈希存储"的最佳实践冲突; _(2)_ HTTPS 普及后,Basic 的"密码上路"问题不再是大问题; _(3)_ 现代场景已经全面转向 Bearer Token / OAuth / mTLS。 所以了解 Digest 即可,不必深入。

### Authorization 头的家族

虽然 Basic 退场了,但 `Authorization: <scheme> <credentials>` 这个语法被沿用至今。 你后面会反复见到这一族:

| Scheme | 形态示例 | 规范 | 典型用途 |
| --- | --- | --- | --- |
| Basic | Basic YWxpY2U6czNjcjN0 | RFC 7617 | 内网工具 · CI · Webhook 调用 |
| Digest | Digest username="...", ... | RFC 7616 | 历史遗留 · 已不推荐 |
| Bearer | Bearer eyJhbGciOiJSUzI1NiI... | RFC 6750 | OAuth 2.0 / JWT 访问令牌 |
| DPoP | DPoP eyJ0eXAiOiJkcG9w... | RFC 9449 | 绑定密钥的 OAuth 访问令牌 |
| Hawk / AWS4-HMAC | AWS4-HMAC-SHA256 Credential=... | 厂商规范 | 云厂商签名认证(AWS / 阿里云) |

写法约定: 注意 scheme 名后面是空格,然后是与该 scheme 相关的凭证串。后面 OAuth / DPoP 都遵循这同一个语法,只是凭证形式不同

## Cookie 与 Session 模型

25 MIN

HTTP 是_无状态_的——每个请求对服务器都是陌生人。 可登录后我们需要"被记住",这就要在协议之上叠一层"状态"。 Cookie 是这一层的载体(RFC 6265),Session 是其上的应用模式。 所有现代 Web 登录,本质都是这两个东西的变体。

### 登录的标准时序

> **图：Cookie Session 登录时序图**
>
> - BROWSER
> - SERVER + SESSION STORE
> - ① POST /login · username + password
> - ② 200 OK · 服务端生成 session 并存储
> - Set-Cookie: SID=abc123; HttpOnly; Secure; SameSite=Lax
> - 浏览器 Cookie Jar
> - SID=abc123 · 自动随后续请求带上
> - Session Store (Redis 等)
> - abc123 → {uid:42, exp:...}
> - ③ GET /me
> - Cookie: SID=abc123
> - ④ 200 OK · {id:42, name:"alice"}
> - 服务端用 SID 查 Session Store, 拿到 uid=42

FIG · Session 模型: 服务端存数据,客户端只存索引(SID)

### Cookie 的关键属性(必背)

Cookie 上的属性远比"键值对"重要——大多数线上事故都来自这几个属性没设对:

SECURITY · 防 XSS

### HttpOnly

禁止 JavaScript 通过 `document.cookie` 读取。攻击者通过 XSS 注入脚本时拿不到 Session ID。 **会话 Cookie 必须设。**

SECURITY · 防嗅探

### Secure

只在 HTTPS 上传输。HTTP 请求里不带这个 Cookie——避免明文链路上被嗅探。生产环境一律设。

SECURITY · 防 CSRF

### SameSite

限制跨站请求是否带 Cookie。`Strict` 完全不跨站; `Lax` 跨站 GET 跳转会带(默认值); `None` 必须配 Secure。

SCOPE · 作用域

### Domain / Path

控制 Cookie 在哪些子域、哪些路径下生效。`Domain=.example.com` 让二级域名共享; 不写则只对当前域生效(更安全)。

LIFETIME · 生命周期

### Expires / Max-Age

不设这两个就是会话 Cookie(关浏览器消失); 设了就是持久 Cookie。"记住我"功能本质就是这两个属性。

2023+ · 隐私加固

### \_\_Host- 前缀

名字以 `__Host-` 开头的 Cookie 强制要求 Secure + Path=/ + 不带 Domain——一种"显式声明这是绑死本域的关键 Cookie"的写法。

**RFC 6265bis 与现代浏览器** Chrome 在 2020 年开始把 SameSite 默认值改为 `Lax`(原来是 None)—— 这一个改动让全行业大量"未显式设置 SameSite"的跨站登录失效。 要点: _SameSite=None 必须同时设 Secure_,否则浏览器直接拒绝。 这是 Cookie 规范现代化的一个里程碑,也是 CSRF 防御的"系统级"加固。

### Session 存储选型

| 方案 | 读写速度 | 横向扩展 | 掉电是否丢 | 典型场景 |
| --- | --- | --- | --- | --- |
| 内存(Map) | 极快 | 不行 · 单机 | 丢 | 本地 demo · 单机小工具 |
| Redis | 快(网络一跳) | 可分片 / 主从 | 看持久化策略 | 生产首选 · 大多数 Web 系统 |
| 关系数据库 | 慢(磁盘 + 索引) | 可主从 | 不丢 | 低频登录 · 与业务表共库 |
| 签名 Cookie | 无网络 | 无状态 · 天然分布式 | 不存在 | JWT / scs+sealed cookie · 无中心存储 |

取舍要点: "服务端存 Session" 易于吊销但难以横向扩展; "Cookie 自带数据" 天然分布式但难以吊销——这是 Day 06-09 JWT 那一阶段会反复出现的根本矛盾

## Go 实战: 三段最小代码

30 MIN

理论看完三遍不如自己跑一遍。三个 lab 由浅入深: 先用 `net/http` 内置能力实现 Basic Auth(看清 Authorization 头怎么解析); 再手写一个 50 行的内存 Session(看清 SID 与服务端存储的关系); 最后换上社区库 `scs` 写"生产规格"版本。

### Lab 1 · 标准库实现 Basic Auth

```
// basic_auth.go · 一段就跑通的 Basic Auth Demo
package main

import (
    "crypto/subtle"
    "net/http"
)

func requireAuth(w http.ResponseWriter) {
    w.Header().Set("WWW-Authenticate", `Basic realm="ops", charset="UTF-8"`)
    http.Error(w, "unauthorized", http.StatusUnauthorized) // 401
}

func main() {
    http.HandleFunc("/admin", func(w http.ResponseWriter, r *http.Request) {
        user, pass, ok := r.BasicAuth() // 自动解 base64
        if !ok {
            requireAuth(w); return
        }
        // 用 constant time 比较, 防止时序侧信道泄露用户名/密码
        userOK := subtle.ConstantTimeCompare([]byte(user), []byte("alice")) == 1
        passOK := subtle.ConstantTimeCompare([]byte(pass), []byte("s3cr3t")) == 1
        if !(userOK && passOK) {
            requireAuth(w); return
        }
        w.Write([]byte("hello, " + user + "\n"))
    })
    _ = http.ListenAndServe(":8080", nil)
}
```

```
# 跑起来 + 验证
$ go run basic_auth.go &
$ curl -i http://localhost:8080/admin
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="ops", charset="UTF-8"

$ curl -i -u alice:s3cr3t http://localhost:8080/admin
HTTP/1.1 200 OK
hello, alice
```

**为什么要用 subtle.ConstantTimeCompare** 普通字符串比较 `==` 会在第一个不同字符就提前返回—— 攻击者可以通过测量响应时间, 逐字节猜出正确的用户名/密码。 `crypto/subtle` 的常量时间比较确保比较耗时与输入相同, 杜绝这种时序侧信道。 _所有"敏感字符串比较"都应该用它,不限于 Basic Auth。_

### Lab 2 · 手写一个内存 Session(理解原理用)

```
// session_demo.go · 不要把这个用到生产 — 只为理解原理
package main

import (
    "crypto/rand"
    "encoding/hex"
    "net/http"
    "sync"
    "time"
)

type session struct {
    userID int
    expires time.Time
}

var (
    store = map[string]session{}
    mu sync.Mutex
)

func newSID() string {
    b := make([]byte, 32)
    _, _ = rand.Read(b)
    return hex.EncodeToString(b) // 64 字符的随机 ID
}

func login(w http.ResponseWriter, r *http.Request) {
    // 略: 校验账号密码 → 假设是用户 42
    sid := newSID()
    mu.Lock()
    store[sid] = session{userID: 42, expires: time.Now().Add(2 * time.Hour)}
    mu.Unlock()

    http.SetCookie(w, &http.Cookie{
        Name: "SID",
        Value: sid,
        Path: "/",
        HttpOnly: true, // JS 拿不到
        Secure: true, // 仅 HTTPS
        SameSite: http.SameSiteLaxMode,
        MaxAge: 60 * 60 * 2, // 2 小时
    })
    w.Write([]byte("logged in\n"))
}

func me(w http.ResponseWriter, r *http.Request) {
    c, err := r.Cookie("SID")
    if err != nil {
        http.Error(w, "no session", 401); return
    }
    mu.Lock(); s, ok := store[c.Value]; mu.Unlock()
    if !ok || time.Now().After(s.expires) {
        http.Error(w, "session expired", 401); return
    }
    w.Write([]byte("user=" + "42" + "\n"))
}

func main() {
    http.HandleFunc("/login", login)
    http.HandleFunc("/me", me)
    _ = http.ListenAndServe(":8080", nil)
}
```

看清这件事

### SID 是钥匙, store 是仓库

客户端只保存一串 64 字符的随机数; 用户数据全在服务端 `store`。这就是"服务端 Session"模型的全部内核。

为什么不要用到生产

### 掉电就丢 · 单机不能扩

这个 demo 没考虑: 进程重启 Session 全没了; 多实例之间不共享; 没有清理过期项的协程。生产请用下面的 scs + Redis。

### Lab 3 · 用 scs 写生产规格的 Session

```
# scs 是 Go 生态里最干净的 Session Manager,支持 Redis/Postgres/Memcached 等多种后端
$ go get github.com/alexedwards/scs/v2
$ go get github.com/alexedwards/scs/redisstore
$ go get github.com/gomodule/redigo/redis
```

```
package main

import (
    "net/http"
    "time"

    "github.com/alexedwards/scs/redisstore"
    "github.com/alexedwards/scs/v2"
    "github.com/gomodule/redigo/redis"
)

var sm *scs.SessionManager

func main() {
    pool := &redis.Pool{
        Dial: func() (redis.Conn, error) { return redis.Dial("tcp", "localhost:6379") },
    }

    sm = scs.New()
    sm.Store = redisstore.New(pool)
    sm.Lifetime = 24 * time.Hour
    sm.Cookie.Name = "SID"
    sm.Cookie.HttpOnly = true
    sm.Cookie.Secure = true
    sm.Cookie.SameSite = http.SameSiteLaxMode

    mux := http.NewServeMux()
    mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
        sm.Put(r.Context(), "uid", 42)
        w.Write([]byte("ok"))
    })
    mux.HandleFunc("/me", func(w http.ResponseWriter, r *http.Request) {
        uid := sm.GetInt(r.Context(), "uid")
        if uid == 0 {
            http.Error(w, "no session", 401); return
        }
        w.Write([]byte("uid="))
    })

    _ = http.ListenAndServe(":8080", sm.LoadAndSave(mux))
}
```

观察任务: 跑起来后, 在 Chrome DevTools → Application → Cookies 里找到 SID, 看它的 HttpOnly / Secure / SameSite 是不是 true; 再去 redis-cli 里 KEYS "\*", 找到对应的服务端 Session 数据

## 常见疑问

5 QUESTIONS

### Q1 · Session 和 JWT 选哪个? 听说"现在都用 JWT 了"是真的吗?

ANS

**不是。**"全员转 JWT"是 2015 年前后的话术,2020 年开始风向已经回来了。本质区别只有一个: **状态放在哪里** 。

Session: 状态在服务端, 客户端只持有 ID。_优点_: 随时吊销, 改权限立即生效, 不暴露任何内部信息。_缺点_: 需要中心存储(Redis 等), 横向扩展要考虑亲和。

JWT: 状态在客户端 token 里。_优点_: 无状态, 任何节点都能校验。_缺点_: 颁出去就吊销不掉(只能等过期 / 加黑名单—— 黑名单就把"无状态"破了)。

**开放平台经验法则** : 浏览器登录态用 Session(用户体验更可控); 给三方应用调 API 的 Access Token 用 JWT(对方无法共享你的 Redis)。两者并存而非互斥, 这是 Day 06-09 会展开的话题。

### Q2 · Basic Auth 在 HTTPS 下足够安全吗? 为什么开放平台基本不用它?

ANS

HTTPS 解决了"线路上被嗅探"问题, 但 Basic 还有更深的缺陷:

(1) **密码每次都上路。** 服务端日志、CDN、WAF、网关——任何一环把请求头记下来, 都会把原始密码留底。生产事故里"密码被日志泄露"比"被中间人嗅探"常见得多。

(2) **无法颗粒授权。** Basic 的凭证只有 user/pass, 没法表达"这个 token 只能调读接口、不能调写接口"。开放平台的核心需求是 scope, Basic 无法承载。

(3) **无法吊销单次会话。** 想"把某个第三方应用踢下线"时, Basic 必须改密码——这样所有人都被踢下线。OAuth Token 可以一刀切单个客户端。

所以 Basic 现在的位置是: _内网工具的便捷登录_、_Webhook 接收方做最小校验_、_CI / 脚本里的临时调试_。开放对外的 API 一律走 OAuth / 签名认证。

### Q3 · Cookie 会被 CSRF 攻击, 是不是 JWT(放在 Authorization 头)就更安全?

ANS

这是个常见误解。"放在 Authorization 头"不天然安全, 它只是把 **攻击面从 CSRF 换成了 XSS** 。

Cookie 易受 CSRF, 是因为_浏览器自动带_; 但 Cookie 设了 HttpOnly + SameSite=Lax 之后, CSRF 大部分场景都被堵死, 而 JS 也偷不到。

JWT 放在 `Authorization` 头要靠 JS 把它带上, 也就意味着 JS 必须能读到它——一旦页面被 XSS 注入, token 立刻被盗。 **没有 HttpOnly 这层保护** 。

所以现代最佳实践: _浏览器登录态走 Cookie + HttpOnly + SameSite=Lax + CSRF Token_, _移动 App / 后端调用走 Bearer Token_——按场景选, 不存在"哪个更安全"的笼统结论。

### Q4 · SameSite=Lax 和 Strict 实际差别在哪? 应该选哪个?

ANS

**Strict** : 任何跨站请求都不带 Cookie——包括从外部链接点进来。结果就是: 用户从微信 / 邮件点链接进你的网站, 第一次会"显示未登录", 需要再刷新一次才行。体验很差。

**Lax** (浏览器默认): 跨站的_顶级导航 GET_会带 Cookie(点链接、跳转), 跨站的 POST / fetch / iframe 不带。既保留了"从外部链接进来已登录"的体验, 又堵住了表单提交型 CSRF。

**None** : 任何请求都带, 必须同时设 `Secure`。仅用于需要真正跨站读取 Cookie 的场景(嵌入式小程序、三方支付 callback 等)。

_经验_: 99% 的网站选 **Lax** 就对了。需要 Strict 的多半是后台管理系统(用户从外部链接进来本来就应该重新登录)。

### Q5 · 如果前端先把密码 SHA-256 一遍再传, 是不是就不用 HTTPS 了?

ANS

**没用, 反而更糟。** 原因: 一旦中间人能截到请求, 他截到的"hashed 密码"对服务端来说就等于密码——重发就能登录(_pass-the-hash_ 攻击)。

更糟的是: 服务端为了能验证, 数据库里只能存原始 hash; 这样数据库被脱库, 攻击者拿到 hash 就能直接登录, 连"破解密码"这一步都省了。

密码安全的正确思路: _(1) HTTPS 保证传输_; _(2) 服务端用 bcrypt / argon2 加盐哈希后存储_。前端做哈希在 99% 的场景下毫无必要——这是 Day 02 密码学基础会重点讲的内容。

## 复盘问题

5 QUESTIONS

1. 用一句话分别说清 Authentication / Authorization / Accounting 的责任。_(提示: 你是谁 / 能干啥 / 干过啥)_
2. HTTP Basic 的完整流程是哪四步? 中间为什么需要服务端先返回 401 + WWW-Authenticate?
3. Cookie 的 HttpOnly / Secure / SameSite 三个属性分别防什么攻击? 不设的话最坏会怎样?
4. "Session 存内存"和"Session 存 Redis"在生产环境分别有什么风险? 你会怎么选?
5. 动手写一段 Go 代码: 接收 `Authorization: Basic xxx`, 解析出 user/pass 并打印——不要用 `r.BasicAuth()`, 用 `encoding/base64` 手动解。

## 今日检查清单

7 ITEMS

- 能给同事用三句话讲清 AuthN / AuthZ / Accounting 的差别
- 能手算 `Basic YWxpY2U6czNjcjN0` 解出来是什么
- 能完整画出"登录 → Set-Cookie → 后续请求带 Cookie → 服务端查 Session"四步时序图
- 能说出 HttpOnly / Secure / SameSite 三个 Cookie 属性各自防的攻击类型
- 跑通 Lab 1: 标准库的 Basic Auth 例子, 能用 curl 看到 401 → 200 的转换
- 跑通 Lab 2 或 Lab 3: 至少有一个版本的 Session 登录能跑, 并在 DevTools 里看到 SID Cookie
- 读完 RFC 7617 (Basic Auth, 仅 10 页) 和 RFC 6265 第 4-5 节(Cookie 处理规则)

## 推荐阅读

5 ITEMS

MUST READ · 10 PAGES

### RFC 7617 · HTTP Basic Authentication

整个 RFC 只有 10 页, 半小时读完。是后面所有 Authorization 头规范的"开山之作"。

MUST READ · 第 4-5 节

### RFC 6265 · HTTP State Management Mechanism

Cookie 规范。重点看第 4 节(Set-Cookie 处理)和第 5 节(Cookie 存储/发送模型)。

OWASP · 实战

### OWASP Session Management Cheat Sheet

OWASP 的 Session 管理最佳实践清单。生产前必读, 涵盖了所有 Cookie 属性的推荐设置。

MDN · 入门

### MDN: HTTP Cookies / HTTP Authentication

规范读完后看 MDN 的两篇文档做收尾。配图清楚, 例子直观, 帮助巩固理解。

GO LIB · 源码

### alexedwards/scs 源码

Go 生态最干净的 Session Manager。读它的 `session.go` + `store.go`, 200 行左右就能看完, 是最好的"原理→工程"参考。

## Day 02 预告

NEXT

TOMORROW · DAY 02

### 密码学基础

有了"密码上路 / 服务端存密码"这两件事的概念, 第二天开始解决"密码到底怎么存才安全"—— 哈希函数(SHA-256 / Blake3)、专用密码哈希(bcrypt / scrypt / argon2)、 对称 vs 非对称加密、HMAC 的设计动机、数字签名的几条经典坑。 看完 Day 02 后, 你应该再也不会写出 `MD5(password)` 存数据库这种代码。

"认证告诉服务器你是谁, 授权告诉服务器你能做什么, 其余一切——日志、审计、计费——都从这两件事派生而来。"

DAY 01 · AUTHN / AUTHZ 30-DAY ROADMAP · OPEN PLATFORM
