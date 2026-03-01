---
title: "无重复字符的最长子串"
date: '2026-01-29'
draft: false
description: 无重复字符的最长子串
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/29/20260129184133234.png)

for 滑动窗口循环遍历，每次遍历以 l 为起点，r 为终点的滑动窗口是否包含重复字符，如果包含，则 l++，否则不停移动 r。

同样，也可以遍历以 r 为重点的滑动窗口。

## Java 解法

```Java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int ans = 0;
        int left = 0;

        for (int right = 0; right < s.length(); right++ ) {
            char c = s.charAt(right);

            if (last.containsKey(c) && last.get(c) >= left) {
                left = last.get(c) + 1;
            }

            last.put(c, right);

            ans = Math.max(ans, right - left + 1);
        }
        return ans;
    }
}
```

以 l 为边界的解法：

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> set = new HashSet<>();
        int ans = 0;
        int left = 0;

        for (int right = 0; right < s.length(); right ++) {
            char c = s.charAt(right);
            while (set.contains(c)) {
                set.remove(s.charAt(left));
                left ++;
            }
            set.add(c);
            ans = Math.max(ans, right - left + 1);
        }
        return ans;
    }
}
```

int[128] 解法：

```Java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] last = new int[128];
        int ans = 0;
        int left = 0;
        for (int right = 0; right < s.length(); right ++) {
            int c = s.charAt(right);
            left = Math.max(left, last[c]);
            ans = Math.max(ans, right - left + 1);
            last[c] = right + 1;
        }
        return ans;
    }
}
```

## Python

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}
        left = 0
        ans = 0

        for right, ch in enumerate(s):
            if ch in last and last[ch] >= left:
                left = last[ch] + 1
            last[ch] = right
            ans = max(ans, right - left + 1)
            
        return ans
```

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        seen = set()
        left = 0
        ans = 0

        for right, ch in enumerate(s):
            while ch in seen:
                seen.remove(s[left])
                left += 1
            seen.add(ch)
            ans = max(ans, right - left + 1)
        return ans
```

## JS

```js
/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    const last = new Map();
    let left = 0;
    let ans = 0;
    for (let right = 0; right < s.length; right ++) {
        const ch = s[right];

        if (last.has(ch) && last.get(ch) >= left) {
            left = last.get(ch) + 1;
        }

        last.set(ch, right);
        ans = Math.max(ans, right - left + 1);
    }
    return ans;
};
```

```js
/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    const seen = new Set();
    let left = 0;
    let ans = 0;
    for (let right = 0; right < s.length; right ++) {
        const ch = s[right];
        while (seen.has(ch)) {
            seen.delete(s[left]);
            left ++;
        }

        seen.add(ch);
        ans = Math.max(ans, right - left + 1);
    }

    return ans;
};
```

## Go

```go
func lengthOfLongestSubstring(s string) int {
    last := make(map[byte]int)
    left, ans := 0, 0

    for right := 0; right < len(s); right ++ {
        ch := s[right]
        if idx, ok := last[ch]; ok && idx >= left {
            left = idx + 1
        }
        last[ch] = right
        if right - left + 1 > ans {
            ans = right - left + 1
        }
    }

    return ans
}
```

```go
func lengthOfLongestSubstring(s string) int {
    seen := make(map[byte]bool)
    left, ans := 0, 0

    for right := 0; right < len(s); right ++ {
        ch := s[right]
        for seen[ch] {
            seen[s[left]] = false
            left ++
        }
        seen[ch] = true
        if right - left + 1 > ans {
            ans = right - left + 1
        }
    }

    return ans
}
```