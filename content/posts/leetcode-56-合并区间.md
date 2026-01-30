---
title: "合并区间"
date: '2026-01-27'
draft: false
description:  
toc: true
---

# 合并区间

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/30/20260130174535658.png)

## 解题思路

1. 按照左端点排序
2. 维护一个当前正在合并的区间
3. 依次扫描所有区间

## Java

```java
class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals == null || intervals.length == 0) {
            return new int[0][2];
        }

        Arrays.sort(intervals, (a, b) -> {
            if (a[0] != b[0]) return Integer.compare(a[0], b[0]);
            return Integer.compare(a[1], b[1]);
        });

        List<int[]> res = new ArrayList<>();
        int start = intervals[0][0], end = intervals[0][1];

        for (int i = 1; i < intervals.length; i ++) {
            int s = intervals[i][0], e = intervals[i][1];
            if (s <= end) {
                end = Math.max(end,e);
            } else {
                res.add(new int[]{start, end});
                start = s;
                end = e;
            }
        }
        res.add(new int[]{start, end});
        return res.toArray(new int[res.size()][]);
    }
}
```

## Python

```python
class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        if not intervals:
            return []

        intervals.sort(key=lambda x: (x[0], x[1]))
        res = []
        start, end = intervals[0]

        for s, e in intervals[1:]:
            if s <= end:
                end = max(end, e)
            else:
                res.append([start,end])
                start, end = s, e
        
        res.append([start, end])
        return res
```

## JS

```js
/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
    if (!intervals || intervals.length === 0) {
        return [];
    }

    intervals.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));

    const res = [];
    let [start, end] = intervals[0];

    for (let i = 1; i < intervals.length; i ++) {
        const [s, e] = intervals[i];
        if (s <= end) {
            end = Math.max(end, e);
        } else {
            res.push([start, end]);
            start = s;
            end = e;
        }
    }
    res.push([start, end]);
    return res;
};
```

## Go

```go
func merge(intervals [][]int) [][]int {
    if len(intervals) == 0 {
        return [][]int{}
    }
    
    sort.Slice(intervals, func(i, j int) bool {
        if intervals[i][0] != intervals[j][0] {
            return intervals[i][0] < intervals[j][0]
        }
        return intervals[i][1] < intervals[j][1]
    })

    res := make([][]int, 0, len(intervals))
    start, end := intervals[0][0], intervals[0][1]

    for i := 1; i < len(intervals); i ++ {
        s, e := intervals[i][0], intervals[i][1]
        if s <= end {
            if e > end {
                end = e
            }
        } else {
            res = append(res, []int{start, end})
            start, end = s, e
        }
    }
    res = append(res, []int{start, end})
    return res
}
```