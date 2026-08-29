---
title: "Day 05 · 多因素认证 · TOTP · WebAuthn / Passkey"
date: '2026-05-23'
draft: false
description: "认证授权 30 天 Day 05：辨清 MFA 三要素与威胁模型，看懂 RFC 4226 / 6238 的 HOTP/TOTP 公式，理解 SMS OTP 为何被 NIST 弃用，用 Go 实现 TOTP 服务并跑通 WebAuthn / Passkey 登录。Phase 1 收官。"
toc: true
tags:
  - Backend
  - Security
  - MFA
  - TOTP
  - WebAuthn
  - Passkey
  - Go
---

DAY 05 · AUTHN / AUTHZ ROADMAP · 30 DAYS · PHASE 1 收官

# 多因素与 _无密码未来_

Phase 1 的最后一天。前四天我们围着"_密码 + 会话_"这一套打转, 但密码这件事本身存在根本缺陷—— **它能被钓鱼、能被脱库、能被复用、能被猜中** 。 Day 05 的目标是看清两条出路: _短期方案_ —— TOTP 给密码加一道时间因子; _长期方案_ —— WebAuthn / Passkey 彻底干掉密码, 用公私钥让钓鱼网站 **从原理上** 无法骗到凭证。 看完这一天, 你应该能给自己的服务接 TOTP, 也能解释为什么 Apple / Google / 微软都 All-in Passkey。

**DURATION** 90–120 min **READ** 45 min **HANDS-ON** 45 min **REVIEW** 20 min **STACK** Go · pquerna/otp · go-webauthn · YubiKey

## 思维导图

OVERVIEW

> **图：Day 05 思维导图**
>
> - DAY 05 · MFA · 从 TOTP 到 Passkey
> - FACTORS · TOTP · SMS-RISK · WEBAUTHN
> - 01 · FACTORS
> - 三要素 / 威胁模型
> - 02 · TOTP
> - HOTP / TOTP 公式
> - 03 · SMS-RISK
> - SMS / Email 风险
> - 04 · WEBAUTHN
> - Passkey 实战
> - 知 / 有 / 是
> - 2FA vs MFA
> - NIST 800-63 AAL
> - Phishable / 不可钓
> - RFC 4226 · HOTP
> - RFC 6238 · TOTP
> - otpauth URI · QR
> - 时钟偏移容忍
> - SIM Swap 攻击
> - SS7 信令截听
> - 实时钓鱼代理
> - NIST 800-63B 已退
> - FIDO2 · CTAP / WebAuthn
> - Passkey = 可同步公钥
> - Origin-bound · 防钓鱼
> - 注册 + 登录两段流程
> - DELIVERABLES
> - 能讲清三要素模型
> - 手算 TOTP 6 位码
> - 用 pquerna/otp 发 QR
> - 跑通 Passkey 登录

FIG · Day 05 全景: 三要素模型 → TOTP → SMS 风险 → WebAuthn / Passkey

## MFA 三要素与威胁模型

20 MIN

讲 MFA 之前必须先讲清"什么是 factor"。 所谓"多因素", 不是"输入两个东西"—— 输密码 + 输安全问题, 仍然是单因素 (都是"你知道的"), 攻击者一次钓鱼能同时拿到。 **真正的多因素要求两类来源不同的凭证** , 让攻击者必须同时攻破两个独立通道。

### 三类因子

SOMETHING YOU KNOW

### 你知道什么

密码、PIN、安全问题、图形手势。_问题_: 能被钓鱼、能被脱库、会被复用——大约 80% 的账号入侵都从这里开始。

SOMETHING YOU HAVE

### 你拥有什么

手机(收 SMS / TOTP App)、硬件安全密钥(YubiKey)、智能卡。_关键_: 必须物理或加密地绑定到设备, 不能远程复制。

SOMETHING YOU ARE

### 你是什么

指纹、Face ID、虹膜、声纹。_注意_: 生物特征作为" **本地解锁手段**"很安全, 但不应该直接传到服务端——一旦泄露无法换。

**NIST 800-63B 的 AAL 分级** 美国 NIST 把认证强度分三级—— _AAL1_: 单因素就行(普通服务); _AAL2_: 两个不同因素 + 抗重放(金融 / 企业账号); _AAL3_: 必须有 **硬件加密** 因素 + **不可钓鱼** (政府机密 / 高价值账号)。 Passkey / WebAuthn 是当前能达到 AAL3 的最便利方案。

### 2FA / MFA / Step-up 概念辨析

| 术语 | 定义 | 典型场景 |
| --- | --- | --- |
| 2FA | 恰好两个因素 (Two-Factor) | 密码 + TOTP / 密码 + Passkey |
| MFA | ≥2 个不同来源的因素 (Multi-Factor) | 2FA 是 MFA 的子集; 高安全场景可叠到 3 因素 |
| Step-up Auth | **按风险动态要求** 加一道 | 登录用密码; 转账时再要 TOTP / Passkey |
| Adaptive MFA | 风险引擎判断要不要要二次因素 | 异地登录 / 异常设备 → 强制 MFA; 常用设备跳过 |
| Passwordless | 没有密码这个因素, 直接用其他因素登录 | Passkey only / Magic Link / 手机推送 |

### 哪些 MFA 能抵抗钓鱼?

| 方案 | 因素 | 抗钓鱼? | 原因 |
| --- | --- | --- | --- |
| 密码 + 安全问题 | 单因素 (都是"知道") | ✗ | 都能在同一个钓鱼页输入 |
| 密码 + SMS OTP | 知 + 有 | ✗ | 实时钓鱼代理可转发, 用户感觉不到 |
| 密码 + Email OTP | 知 + (邮箱另一密码) | ✗ | 同上 + 邮箱本身也是密码体系 |
| 密码 + TOTP App | 知 + 有 | ✗ | 30s 内仍可被实时钓鱼转发 |
| 密码 + 推送审批 | 知 + 有 | 部分 | 会被"MFA 疲劳轰炸"绕过 (反复推送让用户失误点确认) |
| 密码 + WebAuthn 硬件 | 知 + 有 (加密绑定) | ✓ | Origin-bound · 钓鱼站发不出正确挑战 |
| Passkey only | 有 + 是 (设备生物解锁) | ✓ | 无密码可钓, 公私钥+Origin 绑死 |

关键结论: 大部分"加了 MFA"的系统仍然能被实时钓鱼代理(Modlishka / evilginx2)绕过——只有 WebAuthn 因为绑死了 Origin,才是真正" **从协议上**"抗钓鱼

## TOTP / HOTP 算法详解

25 MIN

Google Authenticator / Authy / 1Password 里那串"30 秒变一次"的 6 位数字, 背后只是两条 RFC—— **RFC 4226 (HOTP)** 和 **RFC 6238 (TOTP)**。 公式简单到一页纸说得完, 但理解它你才能解释清楚: 为什么用 SHA-1 仍然是安全的; 为什么必须容忍时钟偏移; 为什么 6 位刚好够。

### HOTP 公式 (RFC 4226 · 计数器型)

```
# HOTP(K, C) = Truncate( HMAC-SHA1(K, C) ) mod 10^Digits
# 输入
K // 共享密钥 (≥ 16 字节, 通常 20 字节)
C // 8 字节计数器 (大端编码)
Digits // 输出位数, 通常 6

# 步骤
1) HS = HMAC-SHA1(K, C) // 输出 20 字节
2) offset = HS[19] & 0x0F // 取末字节低 4 位 (0..15)
3) bin = (HS[offset] & 0x7F) << 24
       | (HS[offset+1] & 0xFF) << 16
       | (HS[offset+2] & 0xFF) << 8
       | (HS[offset+3] & 0xFF) // 动态截断 4 字节
4) return bin mod 10^Digits // 6 位 → mod 1_000_000
```

**动态截断的设计动机** 为什么不直接取前 4 字节? 因为攻击者如果知道你_总是取固定位置_, 就能对哈希做生日攻击优化。 "用末字节低 4 位决定取哪 4 字节"——这一步把输出彻底随机化, 让所有字节都参与决定结果, 而且第一位 mask 掉符号位保证非负。 _简洁但深思熟虑的设计。_

### TOTP 公式 (RFC 6238 · 时间型)

```
# TOTP = HOTP(K, T)
# 把 HOTP 里的"计数器"换成"时间步长"

T = floor( (Now - T0) / X )
# Now: 当前 Unix 时间 (秒)
# T0: 起始时间, 通常 0
# X: 时间步长, 通常 30 秒

# 然后照搬 HOTP
TOTP = HOTP(K, T)

# 例: 2026-05-26 10:30:00 UTC = 1779179400 秒
# T = floor(1779179400 / 30) = 59305980
# 把 59305980 作为 8 字节大端塞进 HOTP, 算出 6 位数字
```

### TOTP 工作时序

> **图：TOTP 工作原理**
>
> - 10:30:00
> - 10:30:30
> - 10:31:00
> - 10:31:30
> - 10:32:00
> - T=59305980
> - 847291
> - T=59305981
> - 013466
> - T=59305982 (now)
> - 528104
> - T=59305983
> - 772019
> - T=59305984
> - 198643
> - 服务端验证时容忍 ±1 步
> - 用户提交 013466 / 528104 / 772019 都能通过
> - 同一密钥 K · 客户端与服务端各自独立算 · 时钟对上就匹配

FIG · TOTP 每 30 秒切换一次, 服务端容忍 ±1 步以应对时钟偏移

### otpauth URI 与 QR Code

用户绑定时不需要手敲密钥——服务端生成一个特殊 URI, 编成二维码, 用户用 Authenticator App 扫一下就把密钥导入到本地。

```
# otpauth URI 格式 (Google Authenticator 约定)
otpauth://totp/{Issuer}:{Account}?secret={Base32}&issuer={Issuer}&algorithm=SHA1&digits=6&period=30

# 实际例子
otpauth://totp/Acme:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme&algorithm=SHA1&digits=6&period=30
```

### Go 实战 · 手写 HOTP / TOTP

```
// hotp.go · 30 行实现 RFC 4226
package main

import (
    "crypto/hmac"
    "crypto/sha1"
    "encoding/binary"
    "fmt"
    "time"
)

func HOTP(key []byte, counter uint64, digits int) string {
    // 1) 8 字节大端计数器
    buf := make([]byte, 8)
    binary.BigEndian.PutUint64(buf, counter)

    // 2) HMAC-SHA1
    mac := hmac.New(sha1.New, key)
    mac.Write(buf)
    h := mac.Sum(nil) // 20 字节

    // 3) 动态截断
    offset := h[19] & 0x0F
    bin := (uint32(h[offset])&0x7F)<<24 |
           uint32(h[offset+1])<<16 |
           uint32(h[offset+2])<<8 |
           uint32(h[offset+3])

    // 4) 取低 N 位
    mod := uint32(1)
    for i := 0; i < digits; i++ { mod *= 10 }
    return fmt.Sprintf("%0*d", digits, bin%mod)
}

func TOTP(key []byte, t time.Time, digits int) string {
    counter := uint64(t.Unix() / 30)
    return HOTP(key, counter, digits)
}

func main() {
    // RFC 6238 附录 B 测试向量: K = "12345678901234567890" (ASCII)
    K := []byte("12345678901234567890")
    t := time.Unix(59, 0)
    fmt.Println("T = 1 :", TOTP(K, t, 8)) // → 94287082
}
```

### Go 实战 · pquerna/otp 生产用法

```
// 生产请用社区库, 自带 Base32 / QR / 时钟漂移容忍等细节
$ go get github.com/pquerna/otp/totp
$ go get github.com/skip2/go-qrcode

import (
    "github.com/pquerna/otp/totp"
    qrcode "github.com/skip2/go-qrcode"
)

// 1) 用户绑定: 生成密钥 + 返回 QR Code 图片
func bindTOTP(w http.ResponseWriter, r *http.Request) {
    key, _ := totp.Generate(totp.GenerateOpts{
        Issuer: "OpenPlatform",
        AccountName: "alice@example.com",
        Period: 30,
        Digits: otp.DigitsSix,
        Algorithm: otp.AlgorithmSHA1,
    })

    // 关键: 服务端必须把 key.Secret() 存入用户表 (加密存储)
    saveSecret(currentUser, key.Secret())

    // 返回 QR 给用户扫
    png, _ := qrcode.Encode(key.URL(), qrcode.Medium, 256)
    w.Header().Set("Content-Type", "image/png")
    w.Write(png)
}

// 2) 登录二次验证: 用户输入 6 位码, 服务端校验
func verifyTOTP(w http.ResponseWriter, r *http.Request) {
    code := r.FormValue("code")
    secret := getSecret(currentUser)

    if !totp.Validate(code, secret) {
        http.Error(w, "invalid code", 401); return
    }
    w.Write([]byte("verified"))
}
```

关键: pquerna/otp 默认容忍 ±1 个时间窗口(±30s), 完全够用。 **禁忌** : 不要"既容忍 ±5 窗口又允许同一码多次提交"——攻击者就有 5 分钟的暴力枚举窗口

## SMS / Email OTP 的真实风险

15 MIN

"收个验证码"是最被用户接受的二次验证方式, 但 **从 2016 年起 NIST 就建议弃用 SMS OTP** (800-63B v3, §5.1.3.3)。 原因不是"算法弱", 而是手机网络这个传输通道本身就充满漏洞—— SIM Swap、SS7 信令攻击、运营商内鬼、实时钓鱼代理, 任何一条都能让验证码落到攻击者手里, 而用户和服务方都察觉不到。

### SIM Swap 攻击

> **图：SIM Swap 攻击流程**
>
> - ATTACKER
> - CARRIER · 运营商
> - BANK · 你的服务
> - ① 社工 + 数据泄露
> - ② "我是受害者, 手机丢了, 转号到新 SIM"
> - ③ 运营商 KYC 不严
> - ④ "忘记密码" + "请发 SMS 验证码"
> - ⑤ 验证码经运营商 → 攻击者新 SIM 卡

FIG · 攻击者不需要碰受害者手机 · 整套攻击 1-2 小时内完成

### SMS / Email OTP 的攻击面汇总

| 攻击 | 原理 | 真实事件 |
| --- | --- | --- |
| SIM Swap | 社工骗运营商把手机号转到攻击者 SIM | 2019 Twitter CEO Jack Dorsey · 2022 多起加密货币交易所盗号事件 |
| SS7 信令攻击 | 滥用 2G/3G 全球漫游信令协议拦截短信 | 2017 德国 O2 银行客户被批量盗号 |
| 运营商内鬼 | 客服 / 销售点员工被收买 | 2023 美国 T-Mobile 多起内部协助 SIM Swap |
| 实时钓鱼代理 | evilginx2 类工具实时转发 OTP 到真实站 | 2022-2024 大量企业 Microsoft 365 被钓鱼 |
| Email 账号本身被攻破 | Email OTP 等于"另一个密码", 邮箱被攻破就一锅端 | 所有以邮箱为 root of trust 的体系普遍问题 |

**NIST 800-63B 的现状(2024)**_"RESTRICTED"_ 级别——允许在没有更好选择时_临时_用 SMS OTP, 但必须: (1) 把它_不当作真正的"有"因素, 只作为账号恢复手段_; (2) 服务必须告知用户"SMS 不是最安全的方式"; (3) 必须提供 TOTP / WebAuthn 作为升级选项。 简单说: **SMS OTP 是过渡方案, 不该是默认方案** 。

### 那应该用什么?

个人服务

### TOTP App

Google Authenticator / Authy / 1Password / Bitwarden 都内置, 用户接受度高, 服务端实现简单——开放平台 **最起码** 提供这个。

企业 / 高价值账号

### WebAuthn / Passkey

抗钓鱼 · 不可被远程攻击 · 用户体验比 TOTP 更好(Face ID 一秒)。 **新建系统的首选** , 下一节展开。

合规过渡

### SMS 仅做恢复

已经用了 SMS 的存量系统, 短期内难以完全去除——把 SMS 降级为"账号恢复手段", 主认证替换为 TOTP / Passkey。

## WebAuthn / Passkey 实战

30 MIN

Passkey 不是"新的密码", 而是 **用 Day 02 的公私钥彻底取代密码** —— 浏览器里按一下指纹 / Face ID, 设备用预先生成的私钥给服务端的挑战签个名。 整套体系的协议规范叫 **WebAuthn (W3C Level 3)**, 它与硬件密钥的底层协议 **CTAP2 (FIDO Alliance)** 组合, 就是 **FIDO2** 。 Passkey 是 WebAuthn 凭证_可以同步到云端_的版本——Apple Keychain / Google 密码管理器替你同步。

### WebAuthn 抗钓鱼的三个机制

1. **Origin Binding。** 浏览器把当前页面的_真实 origin_(协议+域+端口)塞进给认证器的 challenge。钓鱼站 `examp1e.com` 跟真站 `example.com` origin 不同, 私钥根本算不出有效签名。
2. **设备本地解锁。** 私钥永远不离开设备, 调用时用 Touch ID / Face ID / PIN 解锁。攻击者就算偷到 token 也用不上。
3. **Challenge 一次性 + 服务端随机生成。** 每次登录 challenge 都不同, 重放无效。

### 注册流程 (Attestation)

> **图：WebAuthn 注册流程**
>
> - USER · 设备
> - BROWSER
> - SERVER (RP)
> - ① challenge + rpId + user info
> - ② 浏览器调起设备认证器
> - ③ Touch ID / Face ID
> - 本地生成 (pub, priv)
> - ④ pub + attestation
> - ⑤ 服务端存 pub + credentialId

FIG · 注册一次, 服务端只存公钥; 私钥永远留在设备里

### 登录流程 (Assertion)

登录时服务端发一个新 challenge, 设备_用注册时存的私钥_对 challenge + Origin + 计数器签名, 服务端用注册时存的公钥验证签名。整个过程没有"输入密码"这一步。

```
// Go 实战 · 用 go-webauthn/webauthn 库
$ go get github.com/go-webauthn/webauthn/webauthn

import "github.com/go-webauthn/webauthn/webauthn"

// 1) 初始化 RP (Relying Party)
var wa, _ = webauthn.New(&webauthn.Config{
    RPDisplayName: "Open Platform",
    RPID: "example.com", // 必须与浏览器实际域匹配
    RPOrigins: []string{"https://example.com"},
})

// 2) 注册第一步: 服务端生成 challenge, 返回给前端
func beginRegister(w http.ResponseWriter, r *http.Request) {
    user := currentUser(r)
    options, session, _ := wa.BeginRegistration(user)
    saveSession(user.ID, session) // 服务端临时存 session (含 challenge)
    json.NewEncoder(w).Encode(options)
}

// 3) 注册第二步: 前端把设备返回的 attestation 发回, 服务端校验
func finishRegister(w http.ResponseWriter, r *http.Request) {
    user := currentUser(r)
    session := loadSession(user.ID)
    credential, err := wa.FinishRegistration(user, session, r)
    if err != nil {
        http.Error(w, err.Error(), 400); return
    }
    saveCredential(user.ID, credential) // 存 pub + credentialID
    w.Write([]byte("registered"))
}

// 4) 登录两步类似 — BeginLogin / FinishLogin
func beginLogin(w http.ResponseWriter, r *http.Request) {
    user := lookupUser(r.FormValue("email"))
    options, session, _ := wa.BeginLogin(user)
    saveSession(user.ID, session)
    json.NewEncoder(w).Encode(options)
}

func finishLogin(w http.ResponseWriter, r *http.Request) {
    user := lookupUser(r.URL.Query().Get("email"))
    session := loadSession(user.ID)
    _, err := wa.FinishLogin(user, session, r)
    if err != nil {
        http.Error(w, err.Error(), 401); return
    }
    // 验证成功 — 颁发 Session Cookie (Day 01 / Day 04 流程)
    issueSession(w, r, user)
}
```

### 浏览器端 JS

```
// register.js · 让浏览器调起 Touch ID / Face ID
const opts = await fetch('/webauthn/begin-register').then(r => r.json())

// challenge / userId 从 base64url 解码为 ArrayBuffer
opts.publicKey.challenge = b64ToBuf(opts.publicKey.challenge)
opts.publicKey.user.id = b64ToBuf(opts.publicKey.user.id)

const cred = await navigator.credentials.create({ publicKey: opts.publicKey })

await fetch('/webauthn/finish-register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: cred.id,
    rawId: bufToB64(cred.rawId),
    type: cred.type,
    response: {
      attestationObject: bufToB64(cred.response.attestationObject),
      clientDataJSON: bufToB64(cred.response.clientDataJSON),
    },
  }),
})
```

### Passkey vs 传统硬件密钥

| 属性 | 硬件密钥 (YubiKey) | Passkey (云同步) |
| --- | --- | --- |
| 私钥存哪 | 硬件芯片 · 物理隔离 | 设备本地 · iCloud / Google 加密同步 |
| 多设备使用 | 每设备插一次 / 配多把 | 同账号设备自动可用 |
| 设备丢失恢复 | 必须有备用密钥 (买两把) | 登录另一设备的同账号即恢复 |
| 抗钓鱼 | ✓ (Origin 绑定) | ✓ (Origin 绑定) |
| 合规等级 | AAL3 (硬件级) | AAL2 (云同步降低保证) |
| 用户体验 | 插入 + 触摸 | Face ID / Touch ID, 1 秒完成 |

开放平台建议: 给个人开发者首选 Passkey(体验最好); 给企业管理员账号允许配置硬件密钥(AAL3 合规); 两者底层都是 WebAuthn, 服务端代码几乎一样

## 常见疑问

5 QUESTIONS

### Q1 · TOTP 用 SHA-1 哈希, Day 02 不是说 SHA-1 已破了吗?

ANS

SHA-1 被破的是 **抗碰撞性** (找两个不同输入得到同一哈希), 而 HOTP / TOTP 用的是 HMAC-SHA1, 依赖的是 **原像抗性** ——这一性质至今仍然成立。

更重要的是, TOTP 验证只比较"6 位数字" mod 10⁶, 即使攻击者能找到 SHA-1 碰撞, 也很难精确控制结果的最后 6 位数字, 而且每 30 秒就过期, 跑暴力的窗口极短。

不过 RFC 6238 也定义了 SHA-256 / SHA-512 变体——只是 Google Authenticator / 大多数 App 默认只识别 SHA-1, 强制升级会导致兼容问题。_结论_: HMAC-SHA1 的 TOTP 仍然安全, 沿用即可; 新设计的 OTP 协议(如 Apple OTP)选 SHA-256。

### Q2 · 既然 SMS OTP 这么不安全, 为什么主流银行还在用?

ANS

三个现实理由——但都是_"在被改善"_的现状, 不是"永远如此":

(1) **用户基数与教育成本** 。银行的用户群覆盖老年人 / 不会装 App 的人。让他们学 TOTP / Passkey 需要全网客服改造, 短期内 SMS 仍是"最低公分母"。

(2) **跨设备 / 跨平台兼容** 。SMS 不挑设备, 不需要装应用, 不需要 OS 支持; Passkey 需要相对新的浏览器 + OS, 银行不能假设用户都用 iOS 17。

(3) **监管惯性** 。某些金融法规仍把"SMS OTP"列为"双因素", 改变监管语言需要数年。

方向上的事实: **Apple Pay / 国内主流移动支付都已经在用 Passkey / FIDO 取代 SMS** ; 银行 App 内部也逐渐转向"App 内推送审批"代替 SMS 短信。你做新系统, 不要再设计"以 SMS 为主因素", 把 SMS 降到"恢复手段"位置。

### Q3 · Passkey 跟 WebAuthn 是什么关系? 看到很多文章混用。

ANS

层级关系是这样:

**FIDO2** = WebAuthn + CTAP2。前者是浏览器 ↔ 服务端的协议, 后者是浏览器 ↔ 设备的协议。两者合在一起就是无密码登录的完整体系。

**WebAuthn** 是 W3C 标准, 定义浏览器里 `navigator.credentials.create / get` 这套 API。任何 FIDO2 凭证都用这套 API 操作。

**Passkey** 是 2022 年苹果 / 谷歌 / 微软联合推出的_用户友好术语_, 本质是 **"可同步的 WebAuthn 凭证"** ——区别于传统不可同步的硬件密钥。Apple Keychain / Google Password Manager 把私钥同步到云端, 你换设备同账号登录就自动有。

简单说: WebAuthn 是协议, Passkey 是它的_云同步形态_, 是为大众用户起的好记名字。

### Q4 · Passkey 同步到 iCloud / Google, 那不就等于私钥被云端拿到了吗? 这不破坏了"私钥永不外传"的原则?

ANS

云同步用的是 **端到端加密** , Apple / Google 服务器看到的是密文, 解密密钥只在你的设备里(由 iCloud Keychain 的设备绑定 + 你的设备密码派生)。所以 Apple / Google 本身看不到你的 Passkey 私钥。

但确实 **降低了安全保证等级** : 你的设备密码弱 / 多设备里有一台被植入恶意软件 / iCloud 账号被攻破——任何一处出问题, Passkey 都会泄露。这就是为什么 NIST 把 Passkey 评级为 AAL2 而不是 AAL3(硬件级)。

实务建议: 普通用户用 Passkey(因为它便利, 而且仍然 **远比密码安全** ); 高价值账号(企业管理员 / 加密货币持有者)用_不可同步的硬件密钥_(YubiKey / Titan Key), 物理保管。Apple 也支持把 Passkey 标记为"仅本设备", 不上传 iCloud。

### Q5 · 给开放平台做"应用级 MFA"应该怎么设计? 是每次调 API 都验, 还是只登录验一次?

ANS

分两层来想:

**用户登录控制台** : 标准 MFA, 登录时验, 之后走 Session(Day 01 / 04 的方案)。这部分跟普通 SaaS 一样。

**三方应用调你的 OpenAPI** : 这里没有"用户在场", 走 OAuth 2.0 + Access Token, MFA 在_用户授权应用_那一刻已经完成(用户登录时已经验过 MFA, 然后授权给应用)。_API 调用本身不应该再要 MFA_——否则三方应用根本没法在后台跑批处理。

**Step-up 时机** : 真正需要二次验证的是_敏感操作_——给三方应用授权"全部资料"权限、修改 webhook 回调地址、删除应用等。这时候要_重新引导用户登录并验 MFA_(典型实现: OIDC 的 `acr_values=urn:mace:incommon:iap:silver`)。Day 17-19 的 OIDC 阶段会展开。

结论: _登录时验一次, 敏感操作要求 step-up, API 调用本身不验_——三层各管各, 不要混。

## 复盘问题

5 QUESTIONS

1. 用一句话讲清三类因子各自的代表机制。"密码 + 安全问题"为什么不算 2FA?
2. 写出 TOTP 的完整公式(包括 HOTP 部分), 解释为什么需要"动态截断"。
3. 讲清 SIM Swap 攻击的完整链——攻击者第一步、第二步...到拿到验证码的关键节点。
4. WebAuthn 抗钓鱼的三个机制是什么? 为什么 evilginx2 类工具 **无法** 绕过它?
5. 动手用 Go 写 8 位数字的 TOTP 函数, 用 RFC 6238 附录 B 的测试向量(K="12345678901234567890"; T=59) 验证输出是 94287082。

## 今日检查清单

8 ITEMS

- 能讲清 MFA 三要素 + 各自的典型机制
- 能区分 2FA / MFA / Step-up / Adaptive / Passwordless 五个术语
- 列出哪些 MFA 抗钓鱼, 哪些会被实时钓鱼代理绕过
- 能手算或写代码算 HOTP / TOTP 数值, 验证与 RFC 6238 测试向量一致
- 用 pquerna/otp 跑通 TOTP 绑定 + 校验流程, 用真实 Authenticator App 扫码
- 能讲清 SIM Swap 攻击, 知道 NIST 800-63B 为什么把 SMS 列为 RESTRICTED
- 能讲清 Passkey = 可同步的 WebAuthn 凭证, FIDO2 = WebAuthn + CTAP2
- 用 go-webauthn 跑通 Passkey 注册 + 登录全流程

## 推荐阅读

5 ITEMS

MUST READ · 32 PAGES

### RFC 4226 · HOTP

HOTP 的开山规范。重点看 §5 算法定义和附录 D 测试向量, 把"动态截断"的设计意图想清楚。

MUST READ · 16 PAGES

### RFC 6238 · TOTP

HOTP 的时间扩展, 附录 B 的测试向量是 Day 05 复盘题的答案。RFC 本身写得比博客清楚得多。

SPEC · WebAuthn L3

### W3C WebAuthn Level 3

WebAuthn 现行规范。读 §1 (Use Cases) + §5 (Web Authentication API) 即可, 别去啃完整的 600 页。

NIST · 政策

### NIST SP 800-63B · Authenticator Assurance

美国 NIST 的身份认证指南, AAL 三级标准来源。§5 是各种认证器(密码 / OTP / 多设备 / 加密) 的安全等级判定, 工程师的"判官手册"。

DOC · 实战

### Yubico Developer Docs · passkeys.dev

Yubico 出品是硬件密钥视角; passkeys.dev 由 Apple / Google / Microsoft 联合维护, 是 Passkey 的官方实战参考——例子代码 / UI 文案 / 各浏览器兼容都有。

## Day 06 预告 · Phase 2 开篇

NEXT

TOMORROW · DAY 06 · PHASE 2

### JWT 深入: JWS / JWE / JWK / JWA

Phase 1 完成 —— 你应该已经懂"如何安全地登录"。 Phase 2 进入 OAuth / OIDC 时代的事实载荷格式 —— JWT 全家桶。 Day 06 把 JWT 的整族规范(JWS 签名 / JWE 加密 / JWK 公钥 / JWA 算法)一次理清: Header / Payload / Signature 三段结构, RS256 / HS256 / ES256 / EdDSA 五种主流算法, `iss / sub / aud / exp / nbf / jti` 七个标准声明。 看完 Day 06, 你能解释为什么"放在 Cookie 里的 JWT"和"放在 Authorization 头里的 JWT"安全模型完全不同。

"MFA 不是为了让登录更难, 而是为了让'攻破密码'这件事不再等于'攻破账号'——这个目标的终极形态是: 干脆不要密码。"

DAY 05 · AUTHN / AUTHZ 30-DAY ROADMAP · PHASE 1 完结
