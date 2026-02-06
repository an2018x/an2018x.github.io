---
title: "Redis 知识点"
date: '2026-02-06'
draft: false
description:  
toc: true
---

{{< mind height="860px" >}}
- Redis
    - 环境安装
        - docker run -d --name redis -p 6379:6379 redis
        - docker exec -it redis redis-cli （进入容器安装）
        - 安装 redis-cli
            - brew install redis
            - redis-cli --version
        - 连接 redis
            - redis-cli -h 127.0.0.1 -p 6379
        - ping
            - PONG
    - 核心数据结构
        - 清空数据
            - FLUSHDB
        - 查看有多少 key
            - DBSIZE
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206215227359.png,100,35)
        - String
            - 基本 GET/SET
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206215323487.png,130,35)
            - 带过期时间 TTL
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206215527894.png,130,80)
                - EX 是秒，PX 是毫秒
                - TTL 返回剩余的秒数
                - TTL = -1: 存在但没过期时间，-2 不存在
            - 原子自增(计数器)
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206215723437.png,130,90)
        - List
            - 左进右出：队列 FIFO
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206215909155.png,130,150)
            - 阻塞队列
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206220103319.png,640,54)
                - BRPOP key timeout
                    - key 要监听的队列
                    - timeout 最大等待时间(s) 0=无限等待，5=最多等5s
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206220135317.png,640,54)
        - Hash (存对象)
            - 写入写出
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/06/20260206220545889.png,500,420)
        - Set (去重，关系，共同好友)
            - 去重集合
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207000117913.png,400,200)
            - 交集、并集、差集
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207000306600.png,400,200)
        - ZSet (排行榜：积分、热度、TopN)
            - ZSet = Set + Score
            - 添加与排序读取
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207000515210.png,400,370)
            - 增加分数与查询名次
{{< /mind >}}