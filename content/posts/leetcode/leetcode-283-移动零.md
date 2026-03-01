---
title: "移动零"
date: '2025-01-12'
draft: false
description: 移动零
toc: true
---

# 移动零

给定一个数组 nums，编写一个函数将所有 0 移动到数组的末尾，同时保持非零元素的相对顺序。

请注意 ，必须在不复制数组的情况下原地对数组进行操作。

 

示例 1:

输入: nums = [0,1,0,3,12]
输出: [1,3,12,0,0]
示例 2:

输入: nums = [0]
输出: [0]

# 思路

## Java 写法

双指针，目的就是为了把头部的元素往最后移动，第一个指针指向当前要移动到末尾的元素，第二个指针指向需要移动到的位置（从后往前遍历）。

```java
class Solution {
    public void moveZeroes(int[] nums) {
        int slow = 0; // 指向下一个应放非零的位置

        for (int fast = 0; fast < nums.length; fast++) {
            if (nums[fast] != 0) {
                // 将非零元素交换到前面
                int tmp = nums[slow];
                nums[slow] = nums[fast];
                nums[fast] = tmp;
                slow++;
            }
        }
    }
}
```

另外一种解法如下，单指针，将元素往前移动，该解法是覆盖非零 + 末尾补零的方法，时间复杂度更优秀。

```java
class Solution {
    public void moveZeroes(int[] nums) {
        int k = 0; // 下一个非零元素应放的位置

        for (int x : nums) {
            if (x != 0) nums[k++] = x;
        }

        while (k < nums.length) {
            nums[k++] = 0;
        }
    }
}
```

## Go 写法

```go
func moveZeroes(nums []int)  {
    k := 0
    for _, x := range nums {
        if x != 0 {
            nums[k] = x
            k = k + 1
        }
    }
    for i := k; i < len(nums); i ++ {
        nums[i] = 0
    }
}
```

```Go
func moveZeroes(nums []int)  {
    slow := 0
    for fast := 0; fast < len(nums); fast ++ {
        if nums[fast] != 0 {
            nums[slow], nums[fast] = nums[fast], nums[slow] // 交换
            slow++
        }
    }
}
```

## Python 写法

```python
class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        slow = 0
        for fast in range(len(nums)):
            if nums[fast] != 0:
                nums[slow], nums[fast] = nums[fast], nums[slow]
                slow += 1
```

python 和 Go 一样也支持交换赋值，注意的是，python 不支持 ++ 运算

注意上面的便利写法通常不推荐，一般推荐使用 enumerate(nums)

```python
class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        slow = 0
        for fast, num in enumerate(nums):
            if num != 0:
                nums[slow], nums[fast] = nums[fast], nums[slow]
                slow += 1
```

range 的用法：

```python
# 不是列表，但是可以转成列表
r = range(3)
print(r)          # range(0, 3)
print(list(r))    # [0, 1, 2]

# 从头遍历
for i in range(5):
    print(i)  # 0 1 2 3 4

# 从 start 到 stop - 1
for i in range(2, 5):
    print(i)  # 2 3 4

# 指定步长
for i in range(1, 10, 2):
    print(i)  # 1 3 5 7 9

# 倒序遍历
for i in range(10, 0, -1):
    print(i)  # 10 9 ... 1

# 生成固定次数循环
for _ in range(3):
    do_something()


```

需要特别注意的是，在 python 中的 for 循环实际上是遍历的可迭代对象，python 中没有 java 等其他语言中的 for;; 这种语法

```python
class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        k = 0
        for num in nums:
            if num != 0:
                nums[k] = num
                k += 1
        for i, _ in enumerate(nums, start = k):
            nums[i] = 0

# 可以指定起始下标，需要特别注意，这里的 end 是 start + len - 1，所以上面的解法是有问题的
for i, x in enumerate(nums, start=1):
    ...
```

正确的解法如下：

```python
class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        k = 0
        for num in nums:
            if num != 0:
                nums[k] = num
                k += 1
        for i in range(k, len(nums)):
            nums[i] = 0

```


## JS 解法

```js
/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
    let k = 0;

    for (const x of nums) {
        if (x != 0) {
            nums[k++] = x;
        }
    }
    while (k < nums.length) {
        nums[k++] = 0;
    }
};
```

双指针

```js
var moveZeroes = function(nums) {
    let slow = 0;

    for (let fast = 0; fast < nums.length; fast ++) {
        if (nums[fast] != 0) {
            [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
            slow ++;
        }
    }
};
```