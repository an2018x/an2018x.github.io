---
title: "最长连续序列"
date: '2025-01-12'
draft: false
description: 最长连续序列
toc: true
---

# 最长连续序列

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/14/20260114170108829.png)

核心思路，假设这个序列由若干个子序列构成，每个子序列都是连续序列，目的就是找到这些子序列的长度最大值。

由于可能存在重复元素，所以需要对原始序列进行去重。

为了统计每个子序列的长度，我们可以取每个子序列的最小值，一直往上找它的下一个值是否在原序列中，如果存在，那么子序列长度 + 1。

最后对所有子序列的长度取一个最大值就是最终答案。

## Java 解法

```Java
class Solution {
    public int longestConsecutive(int[] nums) {
        if (nums.length == 0 ) {
            return 0;
        }
        Set<Integer> set = new HashSet<>();
        for (Integer num : nums) {
            set.add(num);
        }

        int res = 1;
        for (Integer num : set) {
            if (set.contains(num-1)) {
                continue;
            }
            int cur = 1;
            int t = num + 1;
            while(set.contains(t)) {
                cur ++;
                if (cur > res) {
                    res = cur;
                }
                t ++;
            }
        }
        return res;
    }
}
```

其实上面的代码可以简化一点， cur 可以用 y-x 提替代

```java
import java.util.HashSet;
import java.util.Set;

class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>(nums.length * 2);

        for (int x : nums) set.add(x);

        int ans = 0;
        for (int x : set) {
            // 只从“连续序列的起点”开始扩展，避免重复扫描，保证整体 O(n)
            if (!set.contains(x - 1)) {
                int y = x;
                while (set.contains(y)) y++;
                ans = Math.max(ans, y - x);
            }
        }
        return ans;
    }
}
```

## python 解法

```python
class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        s = set(nums)
        ans = 0

        for x in s:
            if x - 1 not in s:
                y = x
                while y in s:
                    y += 1
                ans = max(ans, y-x)

        return ans
```

python set 用法：

```python
# 初始化
s = set()                    # 空集合（注意：{} 是空 dict）
s = {1, 2, 3}                # 字面量创建
s = set([1, 2, 2, 3])        # 去重 -> {1, 2, 3}
s = set("abca")              # {'a','b','c'}

# 增加元素
s.add(10)                    # 加单个元素
s.update([1, 2, 3])           # 批量加入（可迭代对象）

# 删除元素
s.remove(10)                 # 不存在会抛 KeyError
s.discard(10)                # 不存在不报错（更稳）
v = s.pop()                  # 随机弹出一个元素（集合无序）
s.clear()                    # 清空

# 查询元素
10 in s                      # 成员测试（平均 O(1)）
len(s)                       # 元素个数

# 集合运算
# 并集
a | b
a.union(b)

# 交集
a & b
a.intersection(b)

# 查集
a - b
a.difference(b)
```

## Go 解法

```Go
func longestConsecutive(nums []int) int {
	set := make(map[int]struct{}, len(nums))
	for _, x := range nums {
		set[x] = struct{}{}
	}

	ans := 0
	for x := range set {
		// 只从“序列起点”开始扩展，保证整体 O(n)
		if _, ok := set[x-1]; ok {
			continue
		}
		y := x
		for {
			if _, ok := set[y]; !ok {
				break
			}
			y++
		}
		if y-x > ans {
			ans = y - x
		}
	}
	return ans
}
```

go 语言中，需要注意的就是没有 set 这一个数据结构，只有 map。

## JS 解法

```js
/**
 * LeetCode 128 - Longest Consecutive Sequence
 * 时间复杂度：O(n) 平均
 * 空间复杂度：O(n)
 *
 * @param {number[]} nums
 * @return {number}
 */
function longestConsecutive(nums) {
  const set = new Set(nums);
  let ans = 0;

  for (const x of set) {
    // 只从“连续序列的起点”开始扩展，避免重复扫描
    if (set.has(x - 1)) continue;

    let y = x;
    while (set.has(y)) y++;
    ans = Math.max(ans, y - x);
  }

  return ans;
}
```