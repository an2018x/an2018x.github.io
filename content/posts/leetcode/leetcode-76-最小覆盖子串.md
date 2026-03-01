---
title: "最小覆盖子串"
date: '2026-01-27'
draft: false
description:  
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130161211795.png)

## 不定长滑动窗口 + 计数哈希

1. 右指针扩张窗口，直到覆盖了 t 的全部需求
2. 一旦覆盖成功，左指针尽量收缩，变短
3. 在收缩过程中持续更新最优答案
4. 当收缩到不再满足条件时，再继续右扩

## Java 解法

```java
class Solution {
    public String minWindow(String s, String t) {
        int m = s.length(), n = t.length();
        if (n > m) return "";

        int[] need = new int[128];
        for (int i = 0; i < n; i ++) {
            need[t.charAt(i)] ++;
        }

        int missing = n;
        int bestLen = Integer.MAX_VALUE;
        int bestL = 0;

        int l = 0;

        for (int r = 0; r < m; r ++) {
            char c = s.charAt(r);

            if (need[c] > 0) {
                missing--;
            }
            need[c]--;

            while(missing == 0) {
                int len = r - l + 1;
                if (len < bestLen) {
                    bestLen = len;
                    bestL = l;
                }
                char leftChar = s.charAt(l);

                need[leftChar]++;
                 
                if (need[leftChar] > 0) {
                    missing ++;
                }
                l ++;
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
    }
}
```

## Python 解法

```python
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        if len(t) > len(s):
            return ""
        
        need = [0] * 128
        for ch in t:
            need[ord(ch)] += 1
        
        missing = len(t)
        best_len = float("inf")
        best_l = 0

        l = 0
        for r, ch in enumerate(s):
            idx = ord(ch)

            if need[idx] > 0:
                missing -= 1
            need[idx] -= 1

            while missing == 0:
                cur_len = r - l + 1
                if cur_len < best_len:
                    best_len = cur_len
                    best_l = l

                left_idx = ord(s[l])
                need[left_idx] += 1

                if need[left_idx] > 0:
                    missing += 1

                l += 1

        return "" if best_len == float("inf") else s[best_l: best_l + best_len]
```

## JS

```js
/**
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
var minWindow = function(s, t) {
    if (t.length > s.length) return "";

    const need = new Array(128).fill(0);
    for(let i = 0; i < t.length; i ++) {
        need[t.charCodeAt(i)] ++;
    }

    let missing = t.length;
    let bestLen = Infinity;
    let bestL = 0;
    let l = 0;

    for (let r = 0; r < s.length; r ++) {
        const idx = s.charCodeAt(r);
        if (need[idx] > 0) {
            missing --;
        }
        need[idx]--;

        while(missing === 0) {
            const len = r - l + 1;
            if (len < bestLen) {
                bestLen = len;
                bestL = l;
            }

            const leftIdx = s.charCodeAt(l);
            need[leftIdx]++;

            if (need[leftIdx] > 0) {
                missing ++;
            }
            l++;
        }
    }
    return bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);
};
```

### Go

```go
func minWindow(s string, t string) string {
    if len(t) > len(s) {
        return ""
    }   

    need := make([]int, 128)
    for i:=0; i < len(t); i ++ {
        need[t[i]] ++
    }
    missing := len(t)
    bestLen := 1<<30
    bestL := 0
    l := 0
    for r := 0; r < len(s); r++ {
        c := s[r]

        if need[c] > 0 {
            missing--
        }
        need[c]--

        for missing == 0 {
            if r-l+1 < bestLen {
                bestLen = r-l+1
                bestL = l
            }
            left := s[l]
            need[left]++

            if need[left] > 0 {
                missing ++
            }
            l++
        }
    }

    if bestLen == 1 << 30 {
        return ""
    }
    return s[bestL : bestL + bestLen]
}
```