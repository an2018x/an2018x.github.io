---
title: "Day 02 · 密码学基础 · 哈希 · 加密 · HMAC 与签名"
date: '2026-05-22'
draft: false
description: "认证授权 30 天 Day 02：辨清通用哈希与密码哈希的本质差异，理解对称 vs 非对称加密的取舍，掌握 HMAC 与数字签名的设计动机,并用 Go 跑通 bcrypt / argon2id / AES-GCM / Ed25519 全套样例。"
toc: true
tags:
  - Backend
  - Security
  - Cryptography
  - Hash
  - HMAC
  - Signature
  - Go
---

DAY 02 · AUTHN / AUTHZ ROADMAP · 30 DAYS

# 哈希、加密 _与签名_——密码学三件套

第二天的目标是把后面所有协议依赖的"密码学零件"全部认清—— 通用哈希(SHA-256)和密码哈希(bcrypt / argon2)_为什么不能混用_; 对称(AES)和非对称(RSA / Curve25519)_各自的取舍_; HMAC _解决了"用哈希做认证"的什么问题_; 数字签名又比 HMAC _多解决了什么_。 这些零件是 JWT / OAuth / mTLS / API 签名所有协议的物理基础—— 不理解它们,就只能"按文档抄代码",踩到坑也找不到根因。

**DURATION** 75–120 min **READ** 40 min **HANDS-ON** 40 min **REVIEW** 20 min **STACK** Go · crypto/\* · bcrypt · argon2

## 思维导图

OVERVIEW

> **图：Day 02 思维导图**
>
> - DAY 02 · 密码学三件套
> - HASH · PWHASH · ENCRYPT · SIGN
> - 01 · HASH
> - 通用哈希
> - 02 · PWHASH
> - 密码哈希
> - 03 · ENCRYPT
> - 对称 / 非对称
> - 04 · SIGN
> - HMAC / 数字签名
> - 三个安全性质
> - MD5 / SHA-1 已破
> - SHA-256 · BLAKE3
> - 用途: 指纹 / 完整性
> - 为何 SHA-256 不能存密码
> - 盐 · 慢哈希 · memory-hard
> - bcrypt / scrypt / argon2
> - 参数调优
> - AES-256-GCM (AEAD)
> - ChaCha20-Poly1305
> - RSA · Curve25519
> - 混合加密 · KMS
> - HMAC-SHA256
> - 长度扩展攻击
> - Ed25519 · ECDSA
> - 不可否认性
> - DELIVERABLES
> - 能讲清通用 vs 密码哈希
> - 跑通 argon2id 存校验
> - 用 AES-GCM 加解密
> - 写出 Ed25519 验签

FIG · Day 02 全景: 通用哈希 → 密码哈希 → 加密 → 签名

## 通用哈希函数

20 MIN

哈希函数把任意长度的输入,映射到固定长度的输出——但"映射"二字不重要, 重要的是它需要满足的_三个安全性质_。 这三个性质既是哈希函数的"凭据",也是它的"局限"—— 理解它们,才能明白为什么 MD5 已被宣判死刑, 也才能明白为什么 **哪怕是最新的 SHA-3,也不该用来存密码** 。

### 三个安全性质

| 性质 | 定义 | 被破意味着什么 |
| --- | --- | --- |
| 原像抗性
Preimage Resistance | 给定 h, 找到 x 使 H(x)=h 在算力上不可行 | 攻击者可从密码哈希反推出密码 |
| 第二原像抗性
Second Preimage Resistance | 给定 x, 找到另一个 x' 使 H(x)=H(x') 不可行 | 攻击者可伪造一个不同的文档但哈希相同 |
| 抗碰撞
Collision Resistance | 任意找到两个 x ≠ x' 使 H(x)=H(x') 不可行 | 攻击者可主动构造两个哈希相同的输入(SHA-1 / MD5 实际事件) |

**历史事件** MD5 在 2004 年被中国学者王小云团队找到实际碰撞; SHA-1 在 2017 年被 Google "SHAttered" 攻击发布了第一组真实碰撞 PDF。 两者都是_抗碰撞性质被破_——原像抗性目前仍然成立。 所以"MD5 校验下载文件完整性"在_非恶意_场景下勉强能用,但_有对手_的场景一律不能用。

### 常见算法对比

| 算法 | 输出长度 | 状态 | 推荐用途 |
| --- | --- | --- | --- |
| MD5 | 128 bit | 已破 (2004) | 仅用于非安全场景的"指纹"(如缓存键) |
| SHA-1 | 160 bit | 已破 (2017) | 不要在新项目使用; 旧 Git 在迁移 |
| SHA-256 (SHA-2) | 256 bit | 仍然安全 | 通用首选; HMAC / JWT / TLS 的工作哈希 |
| SHA-3 (Keccak) | 224–512 bit | 安全 · 不同设计 | 需要 SHA-2 之外多样性时备选 |
| BLAKE3 | 可变 | 安全 · 极快 | 大文件 / 高吞吐场景, 比 SHA-256 快 4-10× |

### 工程用途

INTEGRITY

### 完整性校验

下载文件后比对 sha256sum——传输过程任何一 bit 翻转,哈希都对不上。这是哈希最古老的用途。

FINGERPRINT

### 数据指纹 / 去重

把内容 hash 成 32 字节, 当作缓存键 / 唯一标识。CDN 的 ETag、容器的 image digest、IPFS 的 CID 全是这个套路。

ADDRESS

### 内容寻址

Git 用 SHA-1 / SHA-256 做 commit ID; 每个 commit 都"指向"父 commit 的 hash, 构成不可篡改的链条。

PROOF

### Merkle Tree

把多个 hash 两两组合再 hash, 形成一棵树。区块链、TLS 证书透明度日志(CT)、Git 都在用——可以高效证明"某条记录确实在集合里"。

关键认知: 通用哈希追求"快"——SHA-256 在现代 CPU 上每秒能算十亿次。这是它做"完整性"的优点, 却恰好是它做"密码哈希"的致命缺点。下面立即展开

## 密码哈希: bcrypt / scrypt / argon2

25 MIN

用 `MD5(password)` 或者 `SHA-256(password)` 存数据库, 是后端工程师最常见的"看起来安全实则裸奔"的代码。 问题不在"哈希了没有",而在 **用错了哈希** —— 通用哈希为"快"而生,密码哈希必须为"慢"而生。 这一节就是要讲清这个反直觉的设计哲学。

### 用 SHA-256 存密码的攻击

> **图：通用哈希 vs 密码哈希对比**
>
> - SHA-256 存密码 · 被破场景
> - 数据库泄露: SHA256("password123")
> - = ef92b778... (固定输出)
> - 攻击者拿出 10 亿条常见密码
> - SHA256 (RTX 4090): 5 × 10⁹ / s
> - 10 亿条密码 = 200 毫秒跑完
> - 99% 弱密码立即被破
> - ARGON2ID · 被破场景
> - argon2id(pw, salt, m=64M, t=3, p=4)
> - 每次校验需 64MB 内存 + 数次迭代
> - argon2 (RTX 4090): ~1000 / s
> - 10 亿条密码 ≈ 11 天才跑完
> - + 加盐 ⇒ 必须对每个用户分别跑
> - 慢 ≈ 5 × 10⁷ 倍 · 让 GPU 不再划算

FIG · 同样 10 亿条密码字典: SHA-256 200ms,argon2id 11 天

### 三个对抗手段

1. **加盐 (Salt)。** 每个用户一个随机盐, 拼到密码上再哈希。_作用_: 让"全表彩虹表"失效——攻击者必须对每个用户单独跑字典, 不能复用结果。
2. **慢哈希 (Slow Hashing)。** 故意做几千~几十万次迭代, 让一次校验耗时 50-500ms。用户登录感觉不到, 攻击者却被拖慢几个数量级。
3. **消耗内存 (Memory-Hard)。** 算法故意需要大量 RAM(几十~几百 MB), 让 GPU / ASIC 优势失效——GPU 单卡显存只有几十 GB, 同时跑几百路就被卡死。

### 主流密码哈希算法

| 算法 | 年代 | 慢哈希 | Memory-Hard | 推荐度 |
| --- | --- | --- | --- | --- |
| PBKDF2 | 2000 (RFC 2898) | ✓ (迭代次数) | ✗ | FIPS 合规场景 · 否则不推荐 |
| bcrypt | 1999 | ✓ (cost 因子) | 部分 (4 KB) | 稳健 · 70 字符密码上限是已知缺陷 |
| scrypt | 2009 (RFC 7914) | ✓ | ✓ | 可选 · 已基本被 argon2 取代 |
| argon2id | 2015 PHC 冠军 | ✓ | ✓ + 抗侧信道 | 现代首选 · OWASP 推荐第一 |

**argon2 三个变种** _argon2d_: 抗 GPU 最强, 但有时序侧信道风险, 不适合存密码; _argon2i_: 抗侧信道, 但抗 GPU 弱一些; _argon2id_: 前两者的混合 —— **密码哈希一律选 argon2id** 。 参数推荐(OWASP 2024): m=19456 KiB (≈19 MB), t=2, p=1; 或更激进 m=65536 (64 MB), t=3, p=4。

### Go 实战: bcrypt 与 argon2id

```
// password_bcrypt.go · 最简单 — golang.org/x/crypto/bcrypt
package main

import (
    "fmt"
    "golang.org/x/crypto/bcrypt"
)

func main() {
    pw := []byte("correct horse battery staple")

    // 1) 哈希存储 — cost=12 是 2024 年合理值
    hashed, _ := bcrypt.GenerateFromPassword(pw, 12)
    fmt.Println("DB:", string(hashed))
    // → $2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

    // 2) 登录时校验 — 不需要单独取盐, hashed 字符串里自带
    err := bcrypt.CompareHashAndPassword(hashed, pw)
    fmt.Println("OK?", err == nil)
}
```

```
// password_argon2.go · 更现代 — golang.org/x/crypto/argon2
package main

import (
    "crypto/rand"
    "crypto/subtle"
    "encoding/base64"
    "fmt"
    "strings"

    "golang.org/x/crypto/argon2"
)

// OWASP 2024 推荐参数
const (
    memKiB = 64 * 1024 // 64 MB
    iters = 3
    parallel = 4
    saltLen = 16
    keyLen = 32
)

func Hash(pw string) string {
    salt := make([]byte, saltLen)
    _, _ = rand.Read(salt)
    h := argon2.IDKey([]byte(pw), salt, iters, memKiB, parallel, keyLen)

    // 标准编码格式 (PHC string format): $argon2id$v=19$m=...$salt$hash
    return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
        argon2.Version, memKiB, iters, parallel,
        base64.RawStdEncoding.EncodeToString(salt),
        base64.RawStdEncoding.EncodeToString(h))
}

func Verify(pw, encoded string) bool {
    parts := strings.Split(encoded, "$")
    // 简化版: 实际生产请解析参数, 这里假设跟 Hash 一致
    salt, _ := base64.RawStdEncoding.DecodeString(parts[4])
    expected, _ := base64.RawStdEncoding.DecodeString(parts[5])

    actual := argon2.IDKey([]byte(pw), salt, iters, memKiB, parallel, keyLen)
    return subtle.ConstantTimeCompare(actual, expected) == 1
}

func main() {
    enc := Hash("correct horse battery staple")
    fmt.Println("DB:", enc)
    fmt.Println("OK?", Verify("correct horse battery staple", enc))
}
```

关键代码: 校验阶段必须用 `subtle.ConstantTimeCompare` 而不是 bytes.Equal——前者耗时与输入相同,后者会有时序侧信道。Day 01 也提到过这一点

## 对称 vs 非对称加密

20 MIN

加密分两大流派,区别只有一句话: **对称** 用同一把密钥加密和解密——快,但密钥必须事先约定; **非对称** 用一对公私钥,公钥加密私钥解密——慢,但公钥可以随便发。 现代世界用的是_混合加密_: 非对称协商一次性的对称密钥,后续通信走对称。TLS 1.3 就是这个套路。

### 两种加密的对比示意

> **图：对称 vs 非对称加密对比**
>
> - SYMMETRIC · 一把钥匙
> - A
> - ALICE
> - B
> - BOB
> - SHARED K
> - AES(K, msg)
> - 痛点: K 怎么传给 Bob?
> - 不能用同一条不安全链路
> - ASYMMETRIC · 一对钥匙
> - PUB · 可公开
> - PRIV · 永不传出
> - PUB (Bob)
> - RSA(PUB\_B, msg)
> - 优点: 公钥随便传
> - 只有 Bob 能用私钥解开

FIG · 对称: 钥匙共享; 非对称: 公钥公开, 私钥保留

### 主流算法对照

| 类型 | 算法 | 密钥长度 | 状态 / 推荐 |
| --- | --- | --- | --- |
| 对称 · 分组 | AES-128 / 256 | 128 / 256 bit | 行业标准 · 用 GCM 模式 |
| 对称 · 流 | ChaCha20-Poly1305 | 256 bit | 移动 / 无 AES-NI 场景更快 |
| 对称 · 旧模式 | AES-CBC / ECB | — | 无认证 · 不再推荐裸用 |
| 非对称 · 加密 | RSA-OAEP | 2048 / 3072 bit | 稳健 · 但速度慢且密钥大 |
| 非对称 · 密钥交换 | X25519 / ECDH | 256 bit | TLS 1.3 默认 · 短小快速 |
| 非对称 · 签名 | Ed25519 | 256 bit | 现代首选 · 短小快速安全 |

**什么是 AEAD?** Authenticated Encryption with Associated Data —— 加密的同时_顺便认证_密文是否被篡改。 AES-GCM 和 ChaCha20-Poly1305 都是 AEAD。 为什么重要? 经典的 AES-CBC 只加密、不认证, 攻击者可以翻转密文的某些 bit, 让解密出"被改过但语法合法"的明文(著名的 Padding Oracle 攻击)。 **2024 年的经验法则: 加密必选 AEAD, 不要再裸用 CBC / CTR。**

### Go 实战: AES-256-GCM

```
// aes_gcm.go · 标准库 crypto/aes + crypto/cipher
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/hex"
    "fmt"
)

func main() {
    // 1) 准备 32 字节 (256-bit) 密钥 — 生产请从 KMS / 配置中心取
    key := make([]byte, 32)
    _, _ = rand.Read(key)

    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)

    // 2) 12 字节随机 nonce — 同一密钥下绝不能重复
    nonce := make([]byte, gcm.NonceSize())
    _, _ = rand.Read(nonce)

    plaintext := []byte("hello, day02")
    aad := []byte("user_id=42") // 附加认证数据 (不加密但参与认证)

    // 3) Seal: 密文 = nonce || ciphertext || tag
    ct := gcm.Seal(nil, nonce, plaintext, aad)
    fmt.Println("ciphertext:", hex.EncodeToString(ct))

    // 4) Open: 任何字节被篡改都会返回 error
    pt, err := gcm.Open(nil, nonce, ct, aad)
    if err != nil {
        fmt.Println("verify failed:", err); return
    }
    fmt.Println("plaintext:", string(pt))
}
```

陷阱 #1

### nonce 不能重用

同一密钥下用同一个 nonce 加密两次, GCM 的安全性 **整体崩塌** ——攻击者可以恢复明文异或值。生产中 nonce 必须从 `crypto/rand` 来,12 字节随机已足。

陷阱 #2

### 密钥永远不要硬编码

放进代码就等于推到 Git, 推到 Git 就等于公开。生产请用 KMS(AWS KMS / 阿里云 KMS) 或 Vault, 启动时拉取, 内存中持有。

## HMAC 与数字签名

25 MIN

加密保证_秘密_, 但很多场景我们不需要秘密,只需要_完整性 + 来源可证_—— "这条消息确实是 Alice 发的,而且没被改"。 解决这件事的两个工具是 **HMAC** (对称密钥, 双方都能算) 和 **数字签名** (非对称密钥, 只有私钥持有方能签)。 JWT / Webhook / OAuth 签名 / TLS 证书全部建立在这两个工具之上。

### HMAC vs 数字签名 · 对比示意

> **图：HMAC vs 数字签名对比**
>
> - HMAC · 对称密钥 (双方共享 K)
> - A
> - SHARED K
> - B
> - msg ‖ HMAC(K, msg)
> - Bob 用同样的 K 重算 HMAC(K, msg), 比对是否相等
> - DIGITAL SIGNATURE · 非对称 (A 私签 / B 公验)
> - PRIV\_A · 永不外传
> - PUB\_A · 可公开
> - msg ‖ Sign(PRIV\_A, msg)
> - Bob 用 PUB\_A 验证签名 — 只有 Alice 能产生这个签名

FIG · HMAC 双方对称, 签名 A 私签 B 公验

### HMAC: 为什么不是 H(K ‖ msg)?

最朴素的想法: 既然要"用密钥认证消息", 那 `SHA256(key + msg)` 不就行了? **不行** 。基于 Merkle–Damgård 结构的哈希函数(SHA-1 / SHA-256) 存在_长度扩展攻击_: 攻击者拿到 `H(key + msg)` 和 `msg`, 不需要知道 `key`, 就能算出 `H(key + msg + suffix)`。 这意味着攻击者可以"在合法消息后面追加任意内容并伪造出有效 MAC"。

**HMAC 的设计** RFC 2104 给出的解法: `HMAC(K, m) = H( (K' ⊕ opad) ‖ H( (K' ⊕ ipad) ‖ m ) )`。 两次哈希 + 两个固定填充 (ipad/opad) ——保证内部状态不能被外部继续追加。 看起来繁琐, 但只是一次性的设计代价, 用起来跟普通哈希一样简单, 并彻底堵住了长度扩展攻击。 _所有"用对称密钥认证消息"的场景, 都该用 HMAC, 不要手搓拼接。_

### Go 实战: HMAC-SHA256

```
// hmac_sha256.go · 验证 Webhook 签名的标准套路
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
)

func sign(key, msg []byte) string {
    mac := hmac.New(sha256.New, key)
    mac.Write(msg)
    return hex.EncodeToString(mac.Sum(nil))
}

func verify(key, msg []byte, sig string) bool {
    expected := sign(key, msg)
    return hmac.Equal([]byte(expected), []byte(sig)) // 常量时间比较
}

func main() {
    key := []byte("my-app-secret")
    msg := []byte("event=order.paid&order_id=42&ts=1234567890")

    sig := sign(key, msg)
    fmt.Println("X-Signature:", sig)

    fmt.Println("OK?", verify(key, msg, sig))
}
```

### 数字签名: 比 HMAC 多解决什么

| 性质 | HMAC | 数字签名 |
| --- | --- | --- |
| 密钥模型 | 对称 · 双方共享 | 非对称 · 签发方有私钥, 验证方有公钥 |
| 完整性 + 来源 | ✓ | ✓ |
| 不可否认性 | ✗ 双方都能产生 MAC | ✓ 只有私钥持有人能签 |
| 多方验证 | 每对人都要分发密钥 | 公钥发布一次, 全网验证 |
| 性能 | 极快 (μs 级) | 慢一些 (ms 级) |
| 典型用途 | Webhook · API 签名 · JWT HS256 | JWT RS256/ES256 · TLS 证书 · 软件包签名 |

### 现代签名算法

RSA-PSS

### RSA 签名

2048+ bit 密钥; 兼容性最好, 但密钥和签名都大。新项目用 PSS 模式而不是老的 PKCS#1 v1.5。

ECDSA

### 椭圆曲线 DSA

P-256 (secp256r1) 是主流, JWT 的 ES256 用的就是它。**必须用确定性 nonce (RFC 6979)**,否则烂随机数会泄露私钥(Sony PS3 事件)。

RECOMMENDED

### Ed25519 (EdDSA)

RFC 8032 · 密钥 32 字节、签名 64 字节、速度快、API 不容易用错。 **新项目首选** 。SSH / Tailscale / Signal 都在用。

### Go 实战: Ed25519 签名与验证

```
// ed25519_sign.go · 标准库 crypto/ed25519, 不需要任何外部依赖
package main

import (
    "crypto/ed25519"
    "crypto/rand"
    "encoding/hex"
    "fmt"
)

func main() {
    // 1) 生成密钥对 — pub 公开, priv 严格保密
    pub, priv, _ := ed25519.GenerateKey(rand.Reader)
    fmt.Println("public (", len(pub), "B):", hex.EncodeToString(pub))
    fmt.Println("private (", len(priv), "B):", hex.EncodeToString(priv))

    msg := []byte("hello, day02")

    // 2) 签名 — 输出 64 字节
    sig := ed25519.Sign(priv, msg)
    fmt.Println("sig (", len(sig), "B):", hex.EncodeToString(sig))

    // 3) 验证 — 只需要公钥
    ok := ed25519.Verify(pub, msg, sig)
    fmt.Println("verify?", ok)

    // 4) 改一个字符再验, 必然失败
    ok = ed25519.Verify(pub, []byte("hello, day03"), sig)
    fmt.Println("tampered verify?", ok)
}
```

观察任务: 跑起来后注意私钥实际占 64 字节(包含 32 字节 seed + 32 字节派生公钥)、公钥 32 字节、签名 64 字节——比 RSA 短了一个数量级。这就是为什么 SSH / Tailscale / 区块链都在转 Ed25519

## 常见疑问

5 QUESTIONS

### Q1 · MD5 / SHA-1 都"已破"了, 是不是任何场景都不能再用?

ANS

不必一棍子打死, 但要分场景:

**必须避免** : 任何"有对手"的安全场景——密码哈希、数字签名、证书、防篡改校验。攻击者可以主动构造碰撞,让"看起来正确的校验"通过假数据。

**仍可用** : 完全非对抗的场景, 比如_缓存键_、_HashMap 分桶_、_非恶意来源的下载完整性_(只为防网络传输位翻转)。这些场景不存在"主动构造碰撞的攻击者"。

但新项目里没必要再选 MD5—— xxHash / BLAKE3 速度更快, SHA-256 也只是慢一点。 **"避免使用 MD5"是最便宜的安全收益** 。

### Q2 · SHA-256 这么快, 为什么不能用来存密码? 我加盐了也不行?

ANS

"快"对哈希函数本身是优点, 但对密码哈希是 **致命缺陷** 。

加盐确实能让_彩虹表失效_(攻击者不能一次跑出全表), 但加盐 **不能拖慢单次校验** ——攻击者拿到泄露的数据库后, 依然可以"对每个用户分别跑"。而 GPU 上 SHA-256 每秒能算几十亿次, 字典攻击照样 5 分钟跑完。

密码哈希需要的不是"加盐这一招", 而是三招齐上: **加盐 + 慢哈希 + memory-hard** 。bcrypt / argon2 之所以叫"密码哈希函数", 是因为它们故意设计成不可加速——单次校验 100ms, GPU 也救不了攻击者。

所以正确公式: _"密码 + 盐 + 慢哈希 + 内存"_, 不是"密码 + 盐 + 任意哈希"。

### Q3 · bcrypt 和 argon2 选哪个? 我看 bcrypt 也很常见, 是不是不必折腾?

ANS

OWASP 2024 的推荐顺序: **argon2id ≻ scrypt ≻ bcrypt ≻ PBKDF2** 。但前三个都"足够安全",差别在边际收益。

**选 argon2id 的理由** : 现代设计、抗 GPU 最强(memory-hard 真做到位)、参数可调更灵活、PHC 比赛的官方冠军。新项目优先选它。

**选 bcrypt 的理由** : 历史悠久 / 集成最多 / 现有 ORM 多有内置 / 不需要额外依赖。维护已久的项目继续用 bcrypt 完全可以, _不必为换而换_。已知缺陷只有一个: 密码 72 字节后被截断——如果你的系统允许超长密码, 要么先 SHA-256 一遍再 bcrypt(标准做法), 要么换 argon2id。

**选 PBKDF2 的理由** : 几乎只剩一个——必须满足 FIPS 140-2 合规(美国政府场景)。否则它的抗 GPU 性最差, 不该选。

### Q4 · 为什么不能再用 AES-CBC? 我看老系统都在用啊。

ANS

AES-CBC 本身没有问题, **问题在于"裸用 CBC 没有认证"** 。攻击者可以翻转密文里的 bit, 让解密结果改变, 而你的应用完全不知道密文被篡改过。

经典攻击是 _Padding Oracle_: 攻击者通过观察"解密失败 vs 解密成功但业务报错"的差异, 一字节一字节恢复明文。 **历史上 ASP.NET、Java EE、OpenSSL 都中过** 。

正确做法有两种: _(1) 用 AEAD(AES-GCM / ChaCha20-Poly1305) ——加密的同时认证_; _(2) "Encrypt-then-MAC" 模式 —— 先 CBC 加密, 再 HMAC 整段_。后者实现起来容易出错, 所以现代场景一律推荐前者。

老系统继续用 CBC 没必要立即翻新, 但_新写的代码不要用裸 CBC_。Go 的 `crypto/cipher.NewGCM` 跟 NewCBC 用起来一样简单。

### Q5 · RSA 这么经典, 为什么大家都在推 Ed25519?

ANS

三个核心理由:

**(1) 体积。** Ed25519 公钥 32 字节、签名 64 字节; RSA-2048 公钥 ~270 字节、签名 256 字节。在 JWT / HTTP Header / TLS Handshake 这种"每字节都要钱"的场景, 差一个数量级。

**(2) 速度。** Ed25519 签名 / 验证比 RSA-2048 快 10-100×, 而且没有"算 RSA 加密慢一些, 算 RSA 签名快一些"这种细分坑。

**(3) 难误用。** RSA 的椭圆曲线选错、padding 选错、nonce 选错都能炸; Ed25519 没有 padding 概念, nonce 是确定性派生的, API 几乎没有"用错"的方法。安全 = 默认正确。

那为什么 RSA 还活着? 因为兼容性: 大量旧系统、CA、嵌入式设备只支持 RSA。新建私有协议优先 Ed25519; 必须与外部互联的场景检查对端支持。

## 复盘问题

5 QUESTIONS

1. 用一句话分别讲清哈希函数的三个安全性质——原像抗性 / 第二原像抗性 / 抗碰撞。SHA-1 在 2017 年"被破"指的是哪一个性质?
2. 为什么 `SHA256(key + msg)` 不是安全的 MAC, 而 HMAC 解决了什么问题? _(提示: 长度扩展攻击)_
3. argon2id 的三个关键参数(memory / time / parallelism)分别防什么? OWASP 2024 推荐的值是多少?
4. AEAD 是什么, 为什么裸 AES-CBC 不是 AEAD? Padding Oracle 攻击为什么能恢复明文?
5. 动手写一段 Go 代码: 用 argon2id 哈希一个密码, 然后写一个 `Verify(pw, encoded string) bool` 函数, 必须用常量时间比较。

## 今日检查清单

8 ITEMS

- 能讲清通用哈希(SHA-256)和密码哈希(argon2)的本质差异——"快"与"慢"
- 能列出 bcrypt / scrypt / argon2 各自的设计动机和取舍
- 能解释 HMAC 为什么比 `H(key ‖ msg)` 安全
- 能说出 HMAC 与数字签名的核心差别——是否支持不可否认
- 跑通 Lab: bcrypt 或 argon2id 的密码哈希 + 校验
- 跑通 Lab: AES-256-GCM 加密一段文本, 篡改密文后能看到 Open 返回 error
- 跑通 Lab: Ed25519 签名 + 验证, 篡改消息后验证失败
- 读完 OWASP Password Storage Cheat Sheet 和 RFC 2104 (HMAC, 11 页)

## 推荐阅读

5 ITEMS

MUST READ · OWASP

### Password Storage Cheat Sheet

OWASP 出品, 2024 最新版。一页就讲完"密码该怎么哈希、参数怎么定"——直接能复制粘贴的工程结论。

MUST READ · 11 PAGES

### RFC 2104 · HMAC

HMAC 的原始规范, 11 页读完。重点看为什么需要 ipad / opad 两层填充——理解后再也不会想"自己拼 hash"。

RFC · ARGON2

### RFC 9106 · Argon2

argon2 三个变种的正式规范。重点看 §4 "Recommended Parameters", 一切疑问到这里找答案。

RFC · EDDSA

### RFC 8032 · EdDSA / Ed25519

Ed25519 的规范文档。30 多页, 但前 10 页足以理解为什么这个算法"难误用"。后面是公式和参考实现。

BOOK · 入门首选

### Serious Cryptography (Aumasson)

2017 No Starch 出版, 公认现代密码学的最佳入门书。_没有公式恐惧症的话_, 完整啃完一遍, 你就能成为团队的"密码学顾问"。

## Day 03 预告

NEXT

TOMORROW · DAY 03

### PKI 与 TLS / HTTPS

有了"对称 / 非对称 / 哈希 / 签名"四件套, 第三天把它们组合起来—— 看 CA 怎么用_签名_给一张证书背书, 看 TLS 1.3 怎么用_非对称_协商出_对称密钥_, 然后所有应用数据走_AEAD_加密。 之后再看 mTLS——服务间互验证书的现代做法。 看完 Day 03, 你应该能用 openssl 自己搭一套 CA + 服务端证书 + 客户端证书, 跑通 mTLS。

"密码学不是发明新算法,而是用对已有的——'用对'比'强大'重要十倍。"

DAY 02 · AUTHN / AUTHZ 30-DAY ROADMAP · OPEN PLATFORM
