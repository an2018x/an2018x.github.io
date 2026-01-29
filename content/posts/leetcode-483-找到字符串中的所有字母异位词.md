---
title: "找到字符串中所有字母异位词"
date: '2026-01-28'
draft: false
description: 找到字符串中所有字母异位词
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/29/20260129203017354.png)

## 思路

利用定长滑动窗口，增量维护频次数组。

## Java

```java
class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        List<Integer> res = new ArrayList<>();

        int n = s.length(), m = p.length();
        if (n < m) return res;

        int[] cnt = new int[26];
        for (int i = 0; i < m; i ++) {
            cnt[p.charAt(i) - 'a'] ++;
        }

        int diff = m;
        int left = 0;

        for (int right = 0; right < n; right ++) {
            // 进窗口
            int in = s.charAt(right) - 'a';
            if (cnt[in] > 0) {
                diff --;
            }
            cnt[in]--;

            // 出窗口
            if (right - left + 1 > m) {
                int out = s.charAt(left) - 'a';
                if (cnt[out] >= 0) {
                    diff ++;
                }
                cnt[out] ++;
                left ++;
            }

            // 结算答案
            if (right - left + 1 == m && diff == 0) {
                res.add(left);
            }
        }
        return res;
    }
}
```

## Python

```python
class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        n, m = len(s), len(p)
        if n < m:
            return []
        
        cnt = [0] * 26
        for ch in p:
            cnt[ord(ch) - 97] += 1
        
        diff = m
        left = 0
        ans = []

        for right, ch in enumerate(s):
            idx_in = ord(ch) - 97
            if cnt[idx_in] > 0:
                diff -= 1
            cnt[idx_in] -= 1

            if right - left + 1 > m:
                idx_out = ord(s[left]) - 97
                if cnt[idx_out] >= 0:
                    diff += 1
                cnt[idx_out] += 1
                left += 1

            if right - left + 1 == m and diff == 0:
                ans.append(left)

        return ans
```

## JS

```js
/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
var findAnagrams = function(s, p) {
    const n = s.length, m = p.length;
    if (n < m) return [];

    const cnt = new Array(26).fill(0);
    for (let i = 0; i < m; i ++) {
        cnt[p.charCodeAt(i) - 97] ++;
    }

    let diff = m;
    let left = 0;
    const ans = [];

    for (let right = 0; right < n; right ++) {
        const inIdx = s.charCodeAt(right) - 97;
        if (cnt[inIdx] > 0) diff--;
        cnt[inIdx]--;

        if (right - left + 1 > m) {
            const outIdx = s.charCodeAt(left) - 97;

            if (cnt[outIdx] >= 0) diff ++;
            cnt[outIdx] ++;
            left ++;
        }

        if (right - left + 1 === m && diff === 0) {
            ans.push(left);
        }
    }
    return ans;
};
```

## Go

```go
func findAnagrams(s string, p string) []int {
    n, m := len(s), len(p)
    if n < m {
        return []int{}
    }

    cnt := make([]int, 26)
    for i := 0; i < m ;i ++ {
        cnt[p[i] - 'a'] ++
    }
    
    diff := m
    left := 0
    ans := make([]int, 0)
    for right := 0; right < n; right ++ {
        in := s[right] - 'a'
        if cnt[in] > 0 {
            diff--
        }
        cnt[in]--

        if right - left + 1 > m {
            out := s[left] - 'a'
            if cnt[out] >= 0 {
                diff++
            }
            cnt[out]++
            left++
        }

        if right - left + 1 == m  && diff == 0 {
            ans = append(ans, left)
        }
    }
    return ans
}
```