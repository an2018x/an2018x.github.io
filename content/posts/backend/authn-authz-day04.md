---
title: "Day 04 · 会话管理与 Web 安全 · Session / CSRF / XSS"
date: '2026-05-23'
draft: false
description: "认证授权 30 天 Day 04：理解 Session 完整生命周期与 Session Fixation 攻击，对比 CSRF 的四种防御方案，区分 Stored/Reflected/DOM 三种 XSS，并用 Go 实现安全的 Cookie / CSRF Token / CSP 中间件。"
toc: true
tags:
  - Backend
  - Security
  - Session
  - CSRF
  - XSS
  - Cookie
  - Go
---

DAY 04 · AUTHN / AUTHZ ROADMAP · 30 DAYS

# 会话管理与 Web 安全 _三件套_

前三天打完了密码学、协议、传输层的地基, Day 04 回到_应用层_—— Web 工程师每天都在处理却经常踩坑的三件事: **Session Fixation** (为什么登录之后必须换 SID)、 **CSRF** (浏览器为我们带 Cookie 这件好事如何被利用)、 **XSS** (攻击者用一段 \<script\> 把整个登录态偷走)。 这一天的目标是: 看完之后, 你能审 Cookie 配置 / 审 CSRF 中间件 / 一眼识破 XSS 注入点。

**DURATION** 75–105 min **READ** 40 min **HANDS-ON** 35 min **REVIEW** 20 min **STACK** Go · gorilla/csrf · html/template · CSP

## 思维导图

OVERVIEW

> **图：Day 04 思维导图**
>
> - DAY 04 · 会话与 Web 安全
> - SESSION · CSRF · XSS · HARDENING
> - 01 · SESSION
> - 生命周期 / Fixation
> - 02 · CSRF
> - 跨站请求伪造
> - 03 · XSS
> - 跨站脚本注入
> - 04 · HARDEN
> - 安全头与 Go 实战
> - 登录前/后 SID 切换
> - Idle / Absolute Timeout
> - Session Hijack
> - 登出 = 服务端失效
> - 攻击原理 (Cookie 自动带)
> - Synchronizer Token
> - Double Submit Cookie
> - SameSite + Origin 校验
> - Stored XSS (最危险)
> - Reflected XSS
> - DOM-based XSS
> - 输出编码 + CSP
> - CSP / nonce
> - HSTS / X-Frame
> - 安全 Cookie 中间件
> - gorilla/csrf 实战
> - DELIVERABLES
> - 能讲清 Fixation 攻击链
> - 列出 CSRF 四种防御
> - 区分三种 XSS
> - 写全套安全中间件

FIG · Day 04 全景: Session 生命周期 → CSRF → XSS → 综合加固

## Session 生命周期与 Fixation

20 MIN

Day 01 我们建了一个能跑的 Session 系统, 但当时没讲它的_生命周期管理_。 "什么时候发新 SID、什么时候失效、什么时候要换"—— 这些时机一旦做错, 会出现一个经典攻击: **Session Fixation** 。 理解它的攻击链, 你就懂了为什么"登录后必须 regenerate session id"是写在所有安全清单第一条的铁律。

### Session Fixation 攻击

> **图：Session Fixation 攻击流程**
>
> - ATTACKER
> - VICTIM
> - SERVER
> - ① 攻击者访问站点, 服务端发给他 SID=abc
> - ② 钓鱼: https://site.com/?SID=abc
> - ③ 受害者带 SID=abc 登录, 输入账号密码
> - 登录成功, 但 SID 没换
> - SID=abc ↔ user\_id=victim
> - ④ 攻击者带 SID=abc 访问, 已是登录态

FIG · Fixation 的关键漏洞: 登录前后 SID 没变, 攻击者预先持有的 SID 因此"继承"了用户身份

**核心防御** _登录成功后, 必须立即生成新 SID, 并废弃旧 SID。_ 这是 OWASP Session Management Cheat Sheet 第一条规则。 一行代码的事: scs 用 `sm.RenewToken(ctx)`, gorilla/sessions 用 `session.ID = ""` 让其重新生成。 **权限提升也要换** ——从普通用户提升为管理员时同样要 regen, 防止"低权限上下文换到高权限"被劫持。

### Session 完整生命周期

| 阶段 | 动作 | 典型时机 |
| --- | --- | --- |
| 匿名 SID | 第一次访问时分配 (可选 · 用于购物车等) | 访问首页 |
| 登录提升 | **生成全新 SID** , 废弃旧的 | 账号密码 / OAuth 回调成功 |
| 权限变化 | 再生成一次 SID | 切换租户 / 提升为管理员 / 切换角色 |
| 空闲超时 | N 分钟没活动 → 失效 | idle = 15 - 30 min (敏感系统) |
| 绝对超时 | 登录后 N 小时无论如何失效 | absolute = 8 - 24 h |
| 登出 | 服务端 store 立即删除该 SID | 用户主动点退出 |
| 全局踢出 | 账号被盗时按 user\_id 批量删除该用户全部 SID | 风控触发 / 用户改密 |

关键区分: "前端清 Cookie"≠ "登出"。必须在服务端 Store 里把 SID 删掉——只清前端 Cookie 的话,攻击者拿到的 SID 仍然在服务端有效

### Go 实战: 登录后 regenerate SID

```
// 用 alexedwards/scs · 沿用 Day 01 的设置
func login(w http.ResponseWriter, r *http.Request) {
    user, ok := verifyCredentials(r)
    if !ok {
        http.Error(w, "bad credentials", 401); return
    }

    if err := sm.RenewToken(r.Context()); err != nil { // 关键一行
        http.Error(w, "renew failed", 500); return
    }

    sm.Put(r.Context(), "uid", user.ID)
    sm.Put(r.Context(), "login_at", time.Now().Unix())
    w.Write([]byte("ok"))
}

func logout(w http.ResponseWriter, r *http.Request) {
    // 服务端 Store 删 + 客户端 Cookie 过期
    _ = sm.Destroy(r.Context())
    w.Write([]byte("bye"))
}
```

## CSRF: 跨站请求伪造

25 MIN

CSRF 把"浏览器自动带 Cookie"这件设计原本是好事的特性,变成攻击面—— 只要受害者还登录着 your-bank.com, 攻击者在 evil.com 放一段 `<img src="your-bank.com/transfer?to=attacker">`, 浏览器就会自动带上 your-bank 的 Cookie 去发起请求。 防御不靠"加密 Cookie", 靠让_伪造者无法构造完整请求_。

### CSRF 攻击流程

> **图：CSRF 攻击流程**
>
> - VICTIM 浏览器
> - EVIL.COM
> - BANK.COM
> - 已登录 · Cookie: SID=xxx
> - ① 访问 evil.com
> - ② \<form action="bank.com/transfer" method="POST"\>
> - ③ POST bank.com/transfer · Cookie: SID=xxx 自动带上
> - "用户授权了, 转吧"

FIG · 关键问题: 浏览器无法区分"用户主动操作 bank"和"被 evil.com 引导发起请求"

### 四种防御方案

| 方案 | 原理 | 优势 | 限制 |
| --- | --- | --- | --- |
| SameSite Cookie | 浏览器不让跨站请求带这个 Cookie | 零代码, Chrome 默认 Lax | 老浏览器不支持(已基本忽略) |
| Synchronizer Token | 服务端为每个会话生成 token, 放表单隐藏域, 提交时校验 | 最强 · 推荐 · 适合服务端渲染 | 需要在每个 form / AJAX 里塞 token |
| Double Submit Cookie | 服务端发 Cookie + JS 把同值放到 Header, 服务端比对 | 无状态 · 适合 SPA | 实现稍复杂; 必须配 SameSite |
| Origin / Referer 校验 | 检查请求 Header 的 Origin 是不是本站 | 额外一层兜底 | 不能单独依赖(老客户端可能不发) |

**2024 实战推荐组合** _(1) Cookie 全部 SameSite=Lax + HttpOnly + Secure_(基础底线); _(2) 关键写操作再叠加 Synchronizer Token_(服务端渲染) 或 _Double Submit Cookie_(SPA); _(3) 服务端额外校验 Origin / Referer Header_(便宜的额外保险)。 三层叠加, 任何一层失效都还有另外两层兜底。

### Go 实战: gorilla/csrf 中间件

```
// go get github.com/gorilla/csrf
package main

import (
    "net/http"

    "github.com/gorilla/csrf"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/transfer", transferHandler)

    // CSRF 中间件包一层
    csrfMW := csrf.Protect(
        []byte("32-byte-long-auth-key-from-env!!"),
        csrf.Secure(true), // 生产必开
        csrf.HttpOnly(true),
        csrf.SameSite(csrf.SameSiteLaxMode),
        csrf.Path("/"),
    )

    _ = http.ListenAndServe(":8080", csrfMW(mux))
}

func transferHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == "GET" {
        // 把 token 塞进 form, 用户提交时浏览器会带回来
        token := csrf.Token(r)
        fmt.Fprintf(w, `<form method="POST">
            <input type="hidden" name="gorilla.csrf.Token" value="%s">
            <input name="to"> <input name="amt">
            <button>Transfer</button></form>`, token)
        return
    }
    // POST 走到这里, token 已经被中间件校验过
    w.Write([]byte("transfer ok"))
}
```

```
// SPA 场景 · Double Submit Cookie · 自己实现
func csrfMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 写操作才校验
        if r.Method == "GET" || r.Method == "HEAD" {
            ensureCSRFCookie(w, r)
            next.ServeHTTP(w, r); return
        }

        // 取 Cookie 与 Header, 常量时间比较
        c, err := r.Cookie("csrf_token")
        h := r.Header.Get("X-CSRF-Token")
        if err != nil || h == "" ||
           subtle.ConstantTimeCompare([]byte(c.Value), []byte(h)) != 1 {
            http.Error(w, "csrf invalid", 403); return
        }

        // 兜底: Origin 校验
        origin := r.Header.Get("Origin")
        if origin != "" && origin != "https://app.example.com" {
            http.Error(w, "bad origin", 403); return
        }

        next.ServeHTTP(w, r)
    })
}
```

关键: 比较 token 必须用 `subtle.ConstantTimeCompare` (Day 01 / Day 02 反复出现的常量时间比较),防时序侧信道

## XSS: 跨站脚本注入

25 MIN

XSS 的本质是 **把数据当成代码执行** —— 用户输入的字符串没有被正确转义就放进了 HTML, 浏览器把它当作 \<script\> 标签解析, 攻击者的代码因此在受害者的浏览器上下文中运行。 一旦得手, 攻击者能干_HttpOnly 都防不住_的事: 偷 token、操作 DOM、伪造点击、键盘记录, 因为他的脚本就在受害者的页面里——已经"成了"受害者本人。

### 三种 XSS 类型

> **图：三种 XSS 类型对比**
>
> - STORED · 最危险
> - ① 攻击者发评论
> - \<script\>steal()\</script\>
> - ② 写入数据库
> - ③ 任何访客打开页面
> - 脚本就在他的浏览器跑
> - 范围: 所有看过的人
> - REFLECTED · 钓鱼用
> - ① 构造恶意 URL
> - /?q=\<script\>...\</script\>
> - ② 把链接发给受害者
> - ③ 服务端把 q 反射到 HTML
> - 浏览器执行脚本
> - 范围: 点链接的人
> - DOM-BASED · 前端坑
> - ① 同样恶意 URL
> - /#name=\<img onerror...\>
> - ② 服务端响应正常
> - ③ 前端 JS innerHTML 渲染
> - 完全在浏览器侧触发
> - 范围: 服务端日志看不到

FIG · Stored 持久化 / Reflected 一次性 / DOM 完全在前端

### 防御层级

1. **输出编码 (第一道闸门)。** 任何用户数据写进 HTML / JS / URL / CSS 时, 必须做对应上下文的转义。Go 用 `html/template` 自动转义, _不要_用 `text/template` 输出 HTML。
2. **输入验证 (兜底)。** 上传 / 注册的字段做白名单校验——比如手机号只允许数字, 用户名限制字符集。不要试图"黑名单过滤 \<script\>"——绕过方式太多。
3. **CSP (现代护城河)。** Content Security Policy 在响应头里告诉浏览器"只允许从 https://example.com 加载脚本", 即使 XSS 注入了 \<script\>, 也被浏览器拒绝执行。
4. **Cookie HttpOnly (止损)。** Day 01 强调过, 加这个属性 JS 偷不到 Cookie——XSS 即使得手, 至少 Session ID 拿不走。

### Go html/template 自动转义

```
// Go 的 html/template 默认就是安全的, 关键是不要绕过它
package main

import (
    "html/template"
    "net/http"
)

var tpl = template.Must(template.New("x").Parse(`
<h1>Hello, {{.Name}}</h1>
<p>Your bio: {{.Bio}}</p>
<a href="/profile?id={{.ID}}">Edit</a>
<script>var user = {{.JSData}};</script>
`))

func handler(w http.ResponseWriter, r *http.Request) {
    // 即使用户名是 <script>alert(1)</script>
    // html/template 会按上下文自动转义:
    // - 在 HTML body → &lt;script&gt;
    // - 在 href 属性 → URL 编码
    // - 在 <script> 内 → JSON 安全的字符串字面量
    _ = tpl.Execute(w, map[string]any{
        "Name": r.URL.Query().Get("name"),
        "Bio": r.URL.Query().Get("bio"),
        "ID": r.URL.Query().Get("id"),
        "JSData": map[string]string{"name": "alice"},
    })
}
```

**常见误用** _(1) 把 `template.HTML(x)` 包在用户输入上_—— 这是显式告诉模板"这段是可信 HTML, 别转义", 用户输入永远不能这么做。 _(2) 拼接 SQL 风格的拼接 HTML 字符串_: `"<div>" + userInput + "</div>"`, 绕过了模板的安全机制。 _(3) 前端 `element.innerHTML = userInput`_: DOM XSS 的最常见入口, 应该用 `textContent`。

### CSP 入门

```
# 最严格的 CSP — 只允许同源 + 显式列出的资源
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{随机值}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  font-src 'self' https://fonts.gstatic.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  report-uri /csp-report

# 把 nonce 塞进 <script>: 只有带正确 nonce 的脚本能跑
# <script nonce="rA8s..."> ... </script>
# 注入的 <script> 没有 nonce → 浏览器拒绝执行
```

迁移建议: 先用 `Content-Security-Policy-Report-Only` 上线一周, 收集 report-uri 的告警, 修完所有兼容性问题再切到强制模式

## 安全头与 Go 综合中间件

20 MIN

把前三节的所有点合并成一个 Go 中间件—— 安全 Cookie / CSRF / CSP / 浏览器加固头, 一次写好, 全站受益。 这一节也是 30 天里第一次给出"_可以直接 copy 到生产_"的样板代码。

### 必备的安全响应头

| Header | 作用 | 推荐值 |
| --- | --- | --- |
| Strict-Transport-Security | 强制 HTTPS, 防降级 | max-age=31536000; includeSubDomains; preload |
| Content-Security-Policy | 限制脚本 / 资源加载源, 防 XSS | default-src 'self'; script-src 'self' 'nonce-...' |
| X-Frame-Options | 禁止被嵌入 iframe, 防点击劫持 | DENY |
| X-Content-Type-Options | 禁止浏览器 MIME sniffing | nosniff |
| Referrer-Policy | 限制 Referer 头泄露 | strict-origin-when-cross-origin |
| Permissions-Policy | 禁用不需要的浏览器 API (摄像头 / 麦克风) | camera=(), microphone=(), geolocation=() |
| Cross-Origin-Opener-Policy | 隔离窗口, 防 Spectre 跨源攻击 | same-origin |

### Go 综合安全中间件

```
// security.go · 一个 middleware 把所有头打齐
package middleware

import (
    "crypto/rand"
    "encoding/base64"
    "fmt"
    "net/http"
)

func SecurityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 1) 每请求生成一个 CSP nonce, 放进 context 供模板使用
        b := make([]byte, 16)
        _, _ = rand.Read(b)
        nonce := base64.RawStdEncoding.EncodeToString(b)
        ctx := context.WithValue(r.Context(), "csp_nonce", nonce)

        h := w.Header()
        h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
        h.Set("Content-Security-Policy", fmt.Sprintf(
            "default-src 'self'; script-src 'self' 'nonce-%s'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "frame-ancestors 'none'; base-uri 'self'; form-action 'self'", nonce))
        h.Set("X-Frame-Options", "DENY")
        h.Set("X-Content-Type-Options", "nosniff")
        h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
        h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        h.Set("Cross-Origin-Opener-Policy", "same-origin")

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 安全 Cookie helper · 一次写好不再思考
func SecureCookie(name, value string, maxAge int) *http.Cookie {
    return &http.Cookie{
        Name: name,
        Value: value,
        Path: "/",
        MaxAge: maxAge,
        HttpOnly: true, // 防 XSS 偷 Cookie
        Secure: true, // 仅 HTTPS
        SameSite: http.SameSiteLaxMode, // 防 CSRF
    }
}
```

```
// main.go · 串起来用
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/login", login)
    mux.HandleFunc("/me", me)

    // 中间件栈: 安全头 → CSRF → Session → 业务
    handler := middleware.SecurityHeaders(
        csrf.Protect(secret, csrf.Secure(true))(
            sm.LoadAndSave(mux),
        ),
    )

    _ = http.ListenAndServeTLS(":443", "server.crt", "server.key", handler)
}
```

VERIFY

### 用 securityheaders.com 体检

上线后访问 `securityheaders.com/?q=your-site.com`, 自动评分。目标拿 A+。

CHROME DEVTOOLS

### 看 Security 标签页

Chrome DevTools → Security 标签查看证书 / TLS 版本 / 主源是否安全; Application → Cookies 查看每个 Cookie 的实际属性。

## 常见疑问

5 QUESTIONS

### Q1 · SPA + JWT 时代, CSRF 还是真实威胁吗? 我看不少团队完全不做 CSRF 防御。

ANS

分两种情况:

**JWT 放在 Authorization 头** · 不带 Cookie 调用 API: 这种纯前端体系下 CSRF 不存在——浏览器不会自动给 evil.com 发起的请求加上 `Authorization: Bearer ...`(只有 JS 主动加才会)。代价是 JWT 必须存在 localStorage / 内存里, _暴露 XSS 风险_(Day 01 / 09 反复提及)。

**JWT 放在 Cookie 里** 或 **仍然用 Session** : 浏览器会自动带, CSRF 风险完全存在。SameSite=Lax 帮你挡了大部分场景, 但_关键写操作仍建议加 CSRF Token_——SameSite 在某些跨域链接、子域名信任、老浏览器场景下并不可靠。

真实的开放平台后台一般是_Session + Cookie 体系_, CSRF 防御必须做。如果你的团队完全不做, 很可能只是_还没出过事_。

### Q2 · SameSite=Lax 默认就开了, 还需要专门做 CSRF Token 吗?

ANS

"Lax 够了"的论点在 90% 场景成立, 但 **关键写操作不能只靠它** 。原因:

(1) **Lax 允许跨站 GET 跳转** : 攻击者从 evil.com 点链接跳到 your-site.com, Cookie 依然会带。如果你的"删除资源"接口接受 GET 请求(RESTful 反模式但很常见), Lax 完全挡不住。

(2) **子域名互信** : SameSite 看的是 site(eTLD+1), 不是 origin。如果攻击者控制了 _blog.example.com_(比如博客平台用户上传内容), 他可以发请求到 _api.example.com_, Cookie 照样带。

(3) **SameSite=None 场景** : 某些跨域嵌入(支付 / OAuth callback)必须用 None, 那一刻 CSRF 防护就完全失效。

结论: SameSite 是基础底线, _关键写操作再叠加 CSRF Token + Origin 校验_, 不要二选一。

### Q3 · CSP 配好了是不是就能完全防住 XSS? 还要不要继续做输出转义?

ANS

CSP **不是替代转义, 而是叠加防护** 。两者关系:

_转义 / 编码_ 是第一道闸门——做对了, XSS 注入压根进不来。

_CSP_ 是兜底——万一某个开发漏了转义, CSP 让"已注入的脚本"也跑不起来(因为没有正确 nonce)。

真实场景 CSP 经常被绕过的姿势: _(1)_ 配置了 `'unsafe-inline'` 等于禁用了 CSP 主要防线; _(2)_ 信任了过多 CDN, 攻击者上传 JS 到信任的 CDN 就绕过; _(3)_ JSONP 端点暴露在白名单内, 可被用来绕过。

**规则** : 转义必做; CSP 是降低事故影响面的护城河, 但不能替代基本功。

### Q4 · JWT 体系下还存在 Session Fixation 吗?

ANS

名字不叫 Fixation, 但 **类似的攻击仍然存在** 。攻击模式略有不同:

JWT 是_新签发_的, 攻击者无法预先持有"将被分配给受害者的 token"——所以经典 Fixation 不直接成立。

但有变体: **登录后没换 refresh token** ——如果攻击者通过其他方式拿到了用户的 refresh token(XSS / 中间人 / 日志泄露), 用它去刷出新 access token 就能持续登录。所以登录 / 改密 / 重要权限变化时, 应当 _主动作废所有旧 refresh token_, 重新签发——这就是 JWT 体系的"Fixation 防御"。

另一个常见坑: _Refresh Token Rotation 没做_——每次用 refresh 换 access 都该同时换发新的 refresh, 旧的立即作废。Day 09 实战会展开。

### Q5 · 为什么 X-XSS-Protection 不在你的安全头清单里? 它名字听起来是为这个设计的。

ANS

因为它 **已经被现代浏览器废弃** , 应该_不要_设置, 设了反而有风险。

X-XSS-Protection 是早期 IE / 老 Chrome 的 XSS Auditor 开关。后来研究发现, 这个 Auditor 本身可以被滥用(用攻击 payload 触发它把页面里合法的脚本"关掉", 从而绕过其他防御)——Chrome 在 2019 年完全移除了这个特性, Firefox / Edge 也都不再支持。

2024 年的正确清单是: 用 CSP 替代它, 然后明确_不要设_ X-XSS-Protection。很多老教程还在推荐 `X-XSS-Protection: 1; mode=block`——已经过时, 跟着抄会被 securityheaders.com 扣分。

## 复盘问题

5 QUESTIONS

1. 用 60 秒讲清 Session Fixation 完整攻击链——攻击者预先做了什么 / 受害者做了什么 / 服务端漏了什么。
2. 列出 CSRF 的四种防御方案及它们的相对优缺点。2024 年的实战推荐组合是什么?
3. 区分 Stored / Reflected / DOM-based XSS——攻击位置、触发位置、传播范围各有什么不同?
4. 写一段 Go 代码: 实现一个安全的 Cookie helper, 接收 name/value/maxAge, 返回带全部安全属性的 `*http.Cookie`。
5. CSP 的 nonce 机制怎么工作? 为什么 `'unsafe-inline'` 几乎等于关闭了 CSP?

## 今日检查清单

8 ITEMS

- 能讲清 Session Fixation 的完整攻击链, 以及防御只需要一行代码 (RenewToken)
- 能解释 Session 完整生命周期的 7 个阶段, 知道什么时候必须换 SID
- 能列出 CSRF 的 4 种防御方案以及在 SPA / SSR 中各自的取舍
- 能区分 Stored / Reflected / DOM-based XSS 三种类型
- 跑通 gorilla/csrf 或自己实现的 Double Submit Cookie 中间件
- 能用 Go html/template 写一个会自动转义的页面, 故意输入 `<script>` 验证不会执行
- 给自己的 Demo 服务加上 7 个安全响应头, 用 securityheaders.com 测试拿 A 以上
- 读完 OWASP Session / CSRF / XSS 三份 Cheat Sheet

## 推荐阅读

5 ITEMS

MUST READ · 入门

### OWASP Top 10 (2021)

整个 Web 安全圈的"宪法"。Day 04 的三件套(A01 Broken Access / A03 Injection / A07 Auth Failures)在里面都有专项。每 3-4 年更新一次, 2025 版即将发布。

MUST READ · 实操

### OWASP Cheat Sheet Series

Session / CSRF / XSS / Cookie 各一份, 每份 5-10 页。比 OWASP Top 10 更细, 是"看完直接能照做"的工程清单。

SPEC · 关键节

### RFC 6265bis · Cookie 现状

2024 年活跃 IETF draft, SameSite 默认值变化、\_\_Host- 前缀、Partitioned Cookie 等现代 Cookie 行为的权威来源。

SOURCE · 实战参考

### gorilla/csrf 源码

Go 圈最被广泛使用的 CSRF 中间件, 不到 1000 行。读完你能写出生产级的 token 校验中间件。

TOOL · 检测

### securityheaders.com · csp-evaluator

前者 5 秒给你的站点一个安全头评分; 后者(Google 出品) 帮你评估 CSP 是否真的安全, 还是写了个看着唬人的 unsafe-inline。

## Day 05 预告

NEXT

TOMORROW · DAY 05

### 多因素认证: TOTP / Passkey / WebAuthn

Phase 1 的收官——账号密码这个"你知道什么"的因素已经不够用了, 现代登录系统都在叠加"你拥有什么"(手机 / 安全密钥)。 Day 05 看 TOTP 是怎么用一个 30 秒变化的 6 位数字证明"手机在你手上"; 看 WebAuthn / Passkey 怎么用公私钥彻底干掉密码, 让钓鱼网站_从原理上_无法骗到凭证。 看完 Day 05, 你应该能给自己的服务接入 TOTP, 并理解为什么 Apple / Google / 微软都在 All-in Passkey。

"Web 安全的本质是边界——服务端永远不要相信任何来自客户端的输入, 即使它看起来是你刚刚发出去的。"

DAY 04 · AUTHN / AUTHZ 30-DAY ROADMAP · OPEN PLATFORM
