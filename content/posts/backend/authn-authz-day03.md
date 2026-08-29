---
title: "Day 03 · PKI · TLS 1.3 与 mTLS"
date: '2026-05-23'
draft: false
description: "认证授权 30 天 Day 03：理解 PKI 信任锚 / X.509 证书链 / TLS 1.3 一发握手 / SNI 与 ALPN 扩展，用 openssl 自建 CA、用 Go 跑通 HTTPS 服务端 + mTLS 双向认证。"
toc: true
tags:
  - Backend
  - Security
  - TLS
  - PKI
  - mTLS
  - HTTPS
  - Go
---

DAY 03 · AUTHN / AUTHZ ROADMAP · 30 DAYS

# 信任链 · TLS 1.3 _与 mTLS_

Day 02 我们集齐了"哈希 · 加密 · 签名"四件零件。 Day 03 把这四件零件组合成 Web 上每秒成千上万次发生的事——HTTPS 握手。 要点不止于"装个证书": _CA 怎么用签名给一张证书背书_、 _TLS 1.3 凭什么 1-RTT 就能跑完_、 _SNI / ALPN 给现代 Web 解决了什么_、 最后是开放平台服务间认证的核心—— _mTLS 双向认证_怎么从零搭起来。

**DURATION** 90–120 min **READ** 45 min **HANDS-ON** 45 min **REVIEW** 20 min **STACK** Go · openssl · curl · crypto/tls

## 思维导图

OVERVIEW

> **图：Day 03 思维导图**
>
> - DAY 03 · PKI · TLS 1.3 · mTLS
> - PKI · HANDSHAKE · SNI/ALPN · MTLS
> - 01 · PKI
> - 证书与信任链
> - 02 · TLS 1.3
> - 握手与密钥
> - 03 · SNI / ALPN
> - 现代扩展
> - 04 · MTLS
> - 双向认证实战
> - CA · Trust Anchor
> - X.509 v3 字段
> - PEM / DER 编码
> - CRL / OCSP / Stapling
> - RFC 8446
> - 1-RTT 握手 (TLS 1.3)
> - KEM 与密钥派生
> - 0-RTT 与回放风险
> - SNI: 一 IP 多域
> - ALPN: 协议协商
> - ECH: 加密 SNI
> - HSTS · CT 透明
> - openssl 自建 CA
> - Go HTTPS 服务端
> - mTLS Server + Client
> - 证书轮转 / cert-manager
> - DELIVERABLES
> - 能画三层证书链
> - 能讲清 1-RTT 全过程
> - 用 openssl 建本地 CA
> - 跑通 mTLS demo

FIG · Day 03 全景: PKI → TLS 握手 → 扩展 → mTLS 实战

## PKI 与 X.509 证书

25 MIN

"公钥加密"解决的是 **怎么** 加密的问题, 但留下一个更难的问题: _这把公钥真的是 api.example.com 的吗?_ PKI(公钥基础设施)就是为了回答这个问题—— 引入一个被多方信任的第三方 (CA), 由它用 **数字签名** 给"公钥 + 主体"绑死, 签出来的东西就叫 **证书** 。

### 证书链与信任锚

> **图：X.509 三层证书链**
>
> - ROOT CA · 信任锚
> - DigiCert Global Root G2
> - → 自签 (issuer = subject)
> - 预装在操作系统 / 浏览器中
> - Sign with ROOT PRIV
> - INTERMEDIATE CA
> - DigiCert TLS RSA SHA256 2020 CA1
> - Sign with INT PRIV
> - LEAF · 你的服务证书
> - CN=api.example.com
> - CLIENT
> - 浏览器收到 Leaf + Intermediate
> - 用 Intermediate 公钥验 Leaf
> - 用 Root 公钥验 Intermediate
> - Root 在本地信任库 ⇒ 通过

FIG · 三层证书链: Root 自签 → 中间 CA 由 Root 签 → 叶子证书由中间 CA 签

**为什么要中间 CA?** 理论上 Root CA 可以直接签叶子证书。但 Root 的私钥需要_极高规格_保管(离线 HSM、跨大洲分散), 每次签发都很贵。所以 Root 只用来签_少量中间 CA_, 日常签发交给中间 CA。 _额外好处_: 中间 CA 私钥泄露时, 只要吊销中间 CA, Root 还在; Root 永远不上线, 也就永远不会失窃。

### X.509 v3 关键字段

| 字段 | 说明 | 典型值 |
| --- | --- | --- |
| Subject | 证书持有者 | CN=api.example.com |
| Issuer | 颁发者(签名方) | CN=DigiCert TLS ... CA1 |
| Subject Public Key Info | 持有者公钥 | RSA 2048 / EC P-256 |
| Validity | 有效期 | notBefore / notAfter |
| Subject Alt Name (SAN) | **实际生效的域名/IP** · CN 已废 | DNS:api.example.com, DNS:\*.example.com |
| Key Usage | 密钥可以做什么 | digitalSignature, keyEncipherment |
| Extended Key Usage | 更细粒度用途 | serverAuth · clientAuth |
| Basic Constraints | 是否是 CA · 链最大深度 | CA:TRUE · pathLenConstraint:0 |
| CRL / AIA | 吊销列表 / 颁发者 URL | http://crl.digicert.com/... |
| Signature | 颁发者用其私钥对证书内容的签名 | sha256WithRSAEncryption |

关键认知: 现代浏览器 **只看 SAN, 不再看 CN** 。所以自签证书一定要把 SAN 写对——不止 CN 设了 example.com 就行

### PEM 与 DER 编码

DER

### 二进制编码

Distinguished Encoding Rules · ASN.1 的紧凑二进制形式。最小, 适合传输/存储。文件扩展名 `.cer` / `.der`。

PEM

### Base64 + 头尾包装

Privacy-Enhanced Mail · 把 DER 用 base64 包起来, 加上 `-----BEGIN CERTIFICATE-----` 头尾。常见扩展名 `.pem` / `.crt`。 **最常用** ——纯文本能复制粘贴, 多个证书可以拼成一个文件(证书链)。

```
# 看一张正式证书 (用 https://www.google.com 演示)
$ echo | openssl s_client -connect www.google.com:443 -servername www.google.com 2>/dev/null \
    | openssl x509 -noout -issuer -subject -dates -ext subjectAltName

issuer=C=US, O=Google Trust Services, CN=WR2
subject=CN=www.google.com
notBefore=Apr 15 ... 2026 GMT
notAfter=Jul 8 ... 2026 GMT
X509v3 Subject Alternative Name:
    DNS:www.google.com

# DER ↔ PEM 互转
$ openssl x509 -in cert.pem -outform DER -out cert.der
$ openssl x509 -in cert.der -inform DER -out cert.pem

# 把证书链拼起来 (服务端要发送 leaf + intermediate, root 在客户端本地)
$ cat leaf.pem intermediate.pem > fullchain.pem
```

### 吊销机制: CRL / OCSP / Stapling

CRL

### 证书吊销列表

CA 周期性发布"被吊销的证书序列号清单"。_问题_: 客户端要下载几 MB 文件, 而且更新有延迟(几小时~几天)。

OCSP

### 在线吊销查询

客户端遇到证书时, 实时向 OCSP Responder 问"这张还有效吗?"。_问题_: 增加一次 RTT, 还泄露用户访问行为。

RECOMMENDED

### OCSP Stapling

服务端预先向 OCSP 拿一个"有效证明", 握手时直接塞给客户端——零额外 RTT, 不泄露用户行为。 **现代部署的标准做法** 。

**现状** Let's Encrypt 在 2024 年宣布_停止维护 OCSP, 全面转向短期证书_—— 90 天有效期的证书 + 自动化续签, 让"撤销"变成"等它过期"。这是行业方向。 自己运维时, _能用短期证书就别折腾 OCSP_。

## TLS 1.3 握手

25 MIN

TLS 1.3 (RFC 8446, 2018) 是 TLS 协议历史上最大的一次重构—— _砍掉了 90% 的密码套件_, _把握手从 2-RTT 压到 1-RTT_, _默认强制前向保密_。 理解 1.3 握手, 你就能在排查 TLS 问题时, 用 Wireshark 的输出直接对上协议字段。

### TLS 1.2 vs TLS 1.3 握手对比

> **图：TLS 1.2 vs 1.3 握手对比**
>
> - TLS 1.2 · 2-RTT
> - CLIENT
> - SERVER
> - ClientHello
> - ServerHello · Cert · KeyExchange · Done
> - RTT 1
> - ClientKeyEx · ChangeCS · Finished
> - ChangeCS · Finished
> - RTT 2
> - [Encrypted] HTTP Request
> - 应用数据 · 等了 2 个 RTT
> - TLS 1.3 · 1-RTT
> - ClientHello +
> - KeyShare (X25519)
> - ServerHello · KeyShare
> - {Encrypted} Cert · Finished
> - 从这里开始已加密
> - {Finished} +
> - 应用数据 · 1 个 RTT 完成

FIG · TLS 1.3 通过"ClientHello 自带 KeyShare"省掉一个 RTT

### TLS 1.3 的五个关键改动

1. **密码套件大瘦身。** TLS 1.2 有 300+ 套件, TLS 1.3 只保留 5 个 AEAD 套件(AES-GCM / ChaCha20-Poly1305 系列)。_历史性弱算法(RC4 / MD5 / SHA1 / CBC) 全部砍掉。_
2. **1-RTT 默认。** Client 在 ClientHello 就发 KeyShare(基于 ECDHE 的临时公钥), Server 一次回应就能算出共享密钥, 不再需要"先协商再交换"。
3. **强制前向保密(Forward Secrecy)。** 密钥协商必须用 (EC)DHE, 静态 RSA 密钥交换被废弃——意味着_就算服务端私钥日后泄露, 历史流量也解不开_。
4. **更早加密。** ServerHello 之后所有消息(包括证书)都用握手密钥加密——证书不再明文暴露在网络上。
5. **0-RTT 可选。** 客户端如果之前连过同一服务器, 可以在 ClientHello 里"附带"应用数据(early\_data), 0 个 RTT 就送出去。_代价_: early\_data 可被重放, 只能用于幂等操作。

**0-RTT 的风险** 0-RTT 的早期数据没有 nonce 保护——攻击者抓包之后可以重放。 所以即使 Cloudflare / Google 这类大厂启用了 0-RTT, 也只会让_幂等 GET 请求_走这条路径, _POST / PUT 等修改操作绝不能用 0-RTT_。 Go 的 `crypto/tls` 在 1.21 起支持 0-RTT, 但默认关闭, 需要显式 opt-in。

### 密钥派生与 HKDF

TLS 1.3 用 HKDF (RFC 5869) 从一个共享秘密派生出多个用途的密钥—— 不同方向(C→S / S→C)、不同阶段(握手 / 应用 / 重启)都有独立密钥。 这就是"前向保密"的工程实现: 每次会话密钥独立, 一个泄露不影响其他。

```
# 用 Wireshark 看 TLS 1.3 握手
# 1) 在 curl 之前设置 SSLKEYLOGFILE 让 TLS 库导出会话密钥
$ export SSLKEYLOGFILE=/tmp/tls.keys
$ curl -v https://www.google.com

# 2) Wireshark → Preferences → Protocols → TLS → (Pre)-Master-Secret log filename
# 指向 /tmp/tls.keys, 然后捕获包就能看到解密后的握手细节

# curl 直接观察协商出的版本和套件
$ curl -v https://example.com 2>&1 | grep "SSL connection"
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / RSASSA-PSS
```

## SNI · ALPN · ECH

15 MIN

TLS 自身定义了"怎么协商加密通道", 但现代 Web 需要在握手阶段就回答两个问题—— "我要的是哪个网站?"(IPv4 短缺导致一 IP 多域) 和 "我要走的是哪个上层协议?"(HTTP/1.1 / HTTP/2 / HTTP/3)。 **SNI** 解决前者, **ALPN** 解决后者, **ECH** 解决 SNI 暴露域名的隐私问题。

SNI · RFC 6066

### Server Name Indication

ClientHello 里明文带上"我要访问 api.example.com", 服务端据此选择对应证书。 **没有 SNI 之前, 一个 IP 只能配一张证书** ; 有了 SNI, 一台 Nginx 可以为 10000 个域名各自配置不同证书。

ALPN · RFC 7301

### Application-Layer Protocol Negotiation

客户端在 ClientHello 列出"我会说: h2, http/1.1, h3", 服务端选一个回复。 **没有 ALPN 就没有 HTTP/2** —— 因为 H2 跑在 TLS 上, 必须在握手时就决定走 H2 还是 H1。

2024+ · 隐私升级

### ECH · Encrypted Client Hello

把 SNI 这一段也加密——解决"运营商 / 防火墙仍能通过明文 SNI 看到你访问哪个网站"的隐私问题。 Cloudflare / Firefox 已默认开启, 是 TLS 未来几年最重要的演进。

### 配套基础设施

| 机制 | 解决问题 | 典型部署 |
| --- | --- | --- |
| HSTS | 强制浏览器只用 HTTPS, 防降级 | 响应头 `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| CT (Certificate Transparency) | 所有签发的证书必须公开记录, 防 CA 偷签 | RFC 9162 · 浏览器要求叶子证书包含 SCT |
| CAA DNS 记录 | 声明"只允许 LE / DigiCert 签我的证书" | DNS: `example.com. CAA 0 issue "letsencrypt.org"` |
| HPKP | 已废弃 · 太容易锁死自己 | — |

关键认知: HSTS 与 CAA 是" **低成本的最大收益**"——前者一行响应头防降级, 后者一行 DNS 防签发被乱用, 任何线上 HTTPS 站都该上

## mTLS 双向认证 · Go 实战

35 MIN

标准 TLS 只验证"服务端是不是真的", 客户端可以匿名; **mTLS** (mutual TLS)要求双向: 客户端也要拿出一张被服务端信任的 CA 签的证书。 这是开放平台_服务间通信_的标准方案—— 内部 Service A 调 Service B, 不靠 Token, 靠证书证明"我是 A"。 Istio / Linkerd 这类 Service Mesh 给每个 Pod 自动签发证书, 默认就是 mTLS。

### mTLS 双向握手

> **图：mTLS 握手时序**
>
> - CLIENT (Service A)
> - SERVER (Service B)
> - ① ClientHello + KeyShare
> - ② ServerHello · ServerCert · ServerFinished
> - + CertificateRequest (mTLS 关键)
> - ③ ClientCert · CertVerify
> - Server 验证 ClientCert 链
> - → 从 ClientCert.Subject 提取身份
> - ④ {Encrypted} 应用数据开始

FIG · mTLS 在普通 TLS 基础上加 CertificateRequest + ClientCert + CertVerify

### Lab · 用 openssl 建本地 CA + 签证书

```
# 1) 建 CA — 一次性, 私钥严格保管
$ openssl genrsa -out ca.key 4096
$ openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
    -out ca.crt \
    -subj "/CN=My Local CA/O=Demo"

# 2) 签服务端证书 (注意 SAN 必须写)
$ openssl genrsa -out server.key 2048
$ openssl req -new -key server.key -out server.csr \
    -subj "/CN=localhost" \
    -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"
$ openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out server.crt -days 365 -sha256 \
    -extfile <(echo "subjectAltName=DNS:localhost,IP:127.0.0.1")

# 3) 签客户端证书 (mTLS 才需要)
$ openssl genrsa -out client.key 2048
$ openssl req -new -key client.key -out client.csr \
    -subj "/CN=service-a"
$ openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out client.crt -days 365 -sha256
```

### Lab · Go HTTPS 服务端

```
// https_server.go · 起一个 HTTPS 服务
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "hello, TLS %x\n", r.TLS.Version)
    })

    // ListenAndServeTLS 自动选 TLS 1.3 + 强密码套件
    err := http.ListenAndServeTLS(":8443", "server.crt", "server.key", nil)
    if err != nil {
        fmt.Println(err)
    }
}
```

```
# 启动 + 用 curl 测试 (--cacert 告诉 curl 信任我们的本地 CA)
$ go run https_server.go &
$ curl --cacert ca.crt https://localhost:8443/
hello, TLS 304 # 0x0304 = TLS 1.3

# 不指定 --cacert 会报 self-signed certificate
$ curl https://localhost:8443/
curl: (60) SSL certificate problem: unable to get local issuer certificate
```

### Lab · Go mTLS 服务端 + 客户端

```
// mtls_server.go · 要求客户端必须出示证书
package main

import (
    "crypto/tls"
    "crypto/x509"
    "fmt"
    "net/http"
    "os"
)

func main() {
    // 1) 把 CA 加进信任池, 用来验证客户端证书
    caPEM, _ := os.ReadFile("ca.crt")
    pool := x509.NewCertPool()
    pool.AppendCertsFromPEM(caPEM)

    cfg := &tls.Config{
        ClientCAs: pool,
        ClientAuth: tls.RequireAndVerifyClientCert, // 关键: 强制双向
        MinVersion: tls.VersionTLS13,
    }

    srv := &http.Server{
        Addr: ":8443",
        TLSConfig: cfg,
        Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // 从客户端证书提取身份
            cn := r.TLS.PeerCertificates[0].Subject.CommonName
            fmt.Fprintf(w, "hi, %s\n", cn)
        }),
    }
    _ = srv.ListenAndServeTLS("server.crt", "server.key")
}
```

```
// mtls_client.go · 带客户端证书
package main

import (
    "crypto/tls"
    "crypto/x509"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    cert, _ := tls.LoadX509KeyPair("client.crt", "client.key")

    caPEM, _ := os.ReadFile("ca.crt")
    pool := x509.NewCertPool()
    pool.AppendCertsFromPEM(caPEM)

    cli := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                Certificates: []tls.Certificate{cert}, // 提供自己的证书
                RootCAs: pool, // 信任本地 CA
                MinVersion: tls.VersionTLS13,
            },
        },
    }

    resp, _ := cli.Get("https://localhost:8443/")
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body)) // → hi, service-a
}
```

关键代码 #1

### tls.RequireAndVerifyClientCert

服务端的强制开关。还有 `VerifyClientCertIfGiven` (可选), `RequestClientCert` (要但不验)—— **生产 mTLS 一律用 Require** 。

关键代码 #2

### r.TLS.PeerCertificates[0]

从 HTTP Request 拿到客户端证书。这是"用证书认证身份"的核心——把 `Subject.CommonName` 或 `URIs` 当作 user identity。

生产建议: 别在每个服务里手搓 mTLS。Kubernetes 用 cert-manager 自动签发证书; 服务网格里 Istio/Linkerd 通过 SPIFFE 标准给每个 Pod 一个 SVID, 完全透明。Day 28 会展开

## 常见疑问

5 QUESTIONS

### Q1 · TLS 1.2 已经很成熟了, 一定要升 TLS 1.3 吗?

ANS

**能升就升。** 三个原因:

(1) **性能** : 握手从 2-RTT 到 1-RTT, 跨国连接节省 100-200ms 的首字节时间。对 API 调用来说是肉眼可见的差距。

(2) **安全默认** : TLS 1.2 还能协商出弱密码套件(CBC / RSA 静态密钥交换), 配置稍有失误就开洞。TLS 1.3 全部默认就是强 AEAD + 前向保密, "没法配错"。

(3) **未来已来** : HTTP/3 必须用 TLS 1.3 (QUIC 内置), 现在不升, HTTP/3 也用不上。

_例外_: 极老的客户端(IE11 / Java 7 / 老 Android)只支持 TLS 1.2。生产部署一般同时启用 1.2 + 1.3, 让客户端选最高支持的。 **禁掉 TLS 1.0 / 1.1** 是必须的。

### Q2 · 自签证书和 Let's Encrypt 的证书, 在加密强度上有差别吗?

ANS

**加密强度完全一样。** 都是 RSA 2048 / ECC P-256, 都是 TLS 1.3 握手, 协商出的会话密钥强度毫无差别。

差别只有一个: **信任根** 。Let's Encrypt 的根 CA 被预装在所有操作系统 / 浏览器里, 所以任何客户端都默认信任它签的证书; 自签 CA 没人预装, 必须把 CA 证书手动添加到客户端的信任列表(或用 `--cacert`)。

所以选择标准: _对公网用户的服务_必须用公共 CA(LE / DigiCert), 否则浏览器红屏; _内部服务 / 服务间 mTLS_用自签 CA 完全合理, 还能避免暴露内网域名给 CT 日志。

### Q3 · Let's Encrypt 的证书只有 90 天, 为什么是"短"是好事?

ANS

反直觉但确实是好事——核心理由是 **降低撤销机制的依赖** :

(1) **证书泄露的"自然过期"窗口短** : 私钥被偷, 最多 90 天就自动失效, 攻击者能利用的时间窗口很小。一年期证书泄露的"未来损失"是 90 天的 4 倍。

(2) **逼迫自动化** : 90 天意味着不能手动续签, 必须用 certbot / cert-manager 这种自动化工具。_"自动化"是安全的副产品_——配错了立刻就会暴露, 而不是一年后某个深夜过期。

(3) **淘汰过时配置** : 算法 / 密钥长度 / 链结构每隔几个月就刷新一次, 历史包袱不容易堆积。

2024 年 Apple 提议要把证书最长有效期降到 47 天, 行业方向是"越来越短"。如果你还在手动续签 1 年证书, 是时候把它自动化了。

### Q4 · mTLS 和 OAuth 都能做"服务间认证", 各自什么时候用?

ANS

两个机制定位不同——**mTLS 解决"对端是谁"(Workload Identity), OAuth 解决"代谁做事"(User Authorization)**。

**mTLS 适合** : 服务对服务的_身份认证_。Service A 拿 mTLS 证明"我是 cluster 里那个 A Pod", Service B 据此决定要不要给数据。证书由 PKI / SPIFFE 统一签发, 无需每次拿 token。

**OAuth 适合** : 应用代_用户_调 API。第三方 App 拿 OAuth Token 证明"用户 Alice 同意了我调取她的联系人", token 里带着 scope 和用户信息。

**组合用法** (典型开放平台): 服务网格内部走 mTLS, 边界网关验证 OAuth Token 后, 加上 mTLS 把请求转发到内部服务——两层叠加, mTLS 守住身份, OAuth 守住授权。

### Q5 · 证书过期了会发生什么? 怎么避免凌晨被叫起来续签?

ANS

**过期当天所有 HTTPS 请求全部 502 / SSL error** ——浏览器拒绝连接, API 调用方报 `x509: certificate has expired`。这是过去 10 年最常见的"全公司停服"原因之一。

**三层防御** :

**(1) 自动化续签**: 公网证书用 certbot / acme.sh; Kubernetes 集群用 cert-manager; 云上用 ACM / 阿里云证书服务自动续。_从签发那刻起就别让人参与_。

**(2) 监控提前 30 天告警**: Prometheus 的 blackbox\_exporter / SSL Labs API / 自己写脚本 `openssl x509 -enddate` 都行。_等过期再告警就晚了_。

**(3) 不只盯主站**: API 网关、内部 LB、Kafka mTLS、Redis TLS、数据库 TLS——所有 TLS 端点都要纳入清单。事故里"主站续了内网忘了"是高频踩坑点。

开放平台的额外提醒: _给三方应用的 webhook 回推_用的也是 TLS——你的证书过期, 对方调你的服务收不到回推, 投诉会在工单里堆积。

## 复盘问题

5 QUESTIONS

1. 用 30 秒讲清"信任锚 → 中间 CA → 叶子证书"三层链的验证流程。客户端验到哪一步会停下?
2. TLS 1.3 为什么能 1-RTT, 而 TLS 1.2 必须 2-RTT? 关键的协议改动是什么?
3. 0-RTT 的 early\_data 有什么安全风险? 为什么 POST 请求不能走 0-RTT?
4. SNI 解决了什么问题? 没有它的话, 一台服务器最多能配多少个 HTTPS 网站?
5. 写一段 Go 代码: 让 `http.Client` 信任一个自签 CA, 调用 `https://internal.api`——不要 `InsecureSkipVerify`。

## 今日检查清单

8 ITEMS

- 能画出"Root CA → Intermediate → Leaf"三层证书链, 并解释客户端是怎么验的
- 能用 `openssl x509 -text` 看一张证书的 SAN / Validity / Key Usage 各字段
- 能区分 PEM / DER 两种编码, 知道何时该用哪个
- 能讲清 TLS 1.3 的 1-RTT 全过程, 以及它比 TLS 1.2 砍掉了什么
- 能解释 SNI / ALPN / ECH 各自解决的问题
- 用 openssl 在本地自建 CA, 签了服务端证书 + 客户端证书
- 跑通 Go HTTPS 服务端, 用 curl 加 `--cacert` 调通
- 跑通 Go mTLS 服务端 + 客户端, 服务端能从 `r.TLS.PeerCertificates[0]` 拿到客户端 CN

## 推荐阅读

5 ITEMS

MUST READ · §4

### RFC 8446 · TLS 1.3

2018 年的核心规范。重点读 §4 (Handshake Protocol), 配合 Wireshark 抓包对照, 一遍就能理解 1-RTT。

MUST READ · §6

### RFC 5280 · X.509 Path Validation

证书链验证的正式规范。§6 详细列了"客户端必须做的 10 步检查", 想做 PKI 工具的话必读。

BOOK · 章 4

### High Performance Browser Networking

Ilya Grigorik 著 · Chapter 4 "Transport Layer Security" 是中文世界少有的把 TLS 性能讲透的章节。免费在线阅读。

BLOG · CLOUDFLARE

### Cloudflare TLS 1.3 系列

Cloudflare 是 TLS 1.3 标准化的主要推动者之一, 博客里有大量讲 0-RTT / ECH / Post-Quantum 的深度文章。

TOOL · 自签必备

### mkcert / cfssl / step

mkcert 是 Go 写的"傻瓜版本地 CA"——一行命令搞定本地 HTTPS 开发; cfssl / smallstep 是更完整的私有 CA 工具链, 适合企业 mTLS 部署。

## Day 04 预告

NEXT

TOMORROW · DAY 04

### 会话管理与 Web 安全

三天打完密码学 / 协议层的地基, Day 04 回到应用层—— Session Fixation 是什么, 为什么 CSRF 攻击在 SPA 时代依然存在, XSS 怎么把 HttpOnly Cookie 一锅端, 以及 Day 01 那个 SameSite 究竟挡了什么。 看完 Day 04, 你能给团队评审 Cookie 配置, 也能在代码评审里一眼看出"这段写法可能开 XSS 洞"。

"证书不是密码学的胜利, 是信任链的胜利——技术保证了'这确实是这把公钥', 而'这把公钥确实属于 example.com', 是 CA 用签名背的书。"

DAY 03 · AUTHN / AUTHZ 30-DAY ROADMAP · OPEN PLATFORM
