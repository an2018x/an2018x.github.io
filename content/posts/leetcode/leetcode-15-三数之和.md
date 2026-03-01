---
title: "三数之和"
date: '2025-01-12'
draft: false
description: 三数之和
toc: true
---

# 题目

![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/01/16/20260116201008109.png)

难点：

1. 时间复杂度要优于 O(n^3) 否则会超时
2. 需要去重

排序：

1. 排序后，可以在 O(n) 时间内，解决两数之和为 target 的问题。
2. 排序后，可以方便去重

```java
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        Arrays.sort(nums);
        int n = nums.length;

        for (int i = 0; i < n-2; i ++) {
            // 剪枝
            if (nums[i] > 0) {
                break;
            }

            // 去重
            if (i > 0 && nums[i] == nums[i-1]) {
                continue;
            }

            int l = i + 1, r = n - 1;

            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    l ++;
                    r --;
                    while (l < r && nums[l] == nums[l-1]) {
                        l ++;
                    }
                    while (l < r && nums[r] == nums[r+1]) {
                        r --;
                    }
                } else if (sum < 0) {
                    l ++;
                } else {
                    r --;
                }
            }
        }
        return res;
    }
}
```

## Python

```python
class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        n = len(nums)
        res = []

        for i in range(n-2):
            if nums[i] > 0:
                break
            
            if i > 0 and nums[i] == nums[i-1]:
                continue

            l, r = i + 1, n - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]

                if s == 0:
                    res.append([nums[i], nums[l], nums[r]])

                    l += 1
                    r -= 1

                    while l < r and nums[l] == nums[l-1]:
                        l += 1
                    while l < r and nums[r] == nums[r+1]:
                        r -= 1
                elif s < 0:
                    l += 1
                else:
                    r -= 1
        return res
```


## Go 

```Go
func threeSum(nums []int) [][]int {
    sort.Ints(nums)
    n := len(nums)
    res := make([][]int, 0)

    for i := 0; i < n - 2; i++ {
        if nums[i] > 0 {
            break
        }

        if i > 0 && nums[i] == nums[i-1] {
            continue
        }

        l, r := i + 1, n - 1
        for l < r {
            sum := nums[i] + nums[l] + nums[r]

            if sum == 0 {
                res = append(res, []int{nums[i], nums[l], nums[r]})

                l ++
                r --

                for l < r && nums[l] == nums[l-1] {
                    l ++
                }

                for l < r && nums[r] == nums[r+1] {
                    r --
                }
            } else if sum < 0 {
                l ++
            } else {
                r --
            }
        } 
    }
    return res;
}
```

## js

```js
var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const res = [];
    const n = nums.length;

    for (let i = 0; i < n - 2; i ++) {
        if (nums[i] > 0) break;
        if (i > 0 && nums[i] == nums[i-1]) continue;

        let l = i + 1, r = n - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];

            if (sum === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                l ++;
                r --;

                while(l < r && nums[l] == nums[l-1]) l++;
                while(l < r && nums[r] == nums[r+1]) r--;
            } else if (sum < 0) {
                l ++;
            } else {
                r --;
            }
        }
    }
    return res;
};
```