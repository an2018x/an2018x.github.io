---
title: "Redis 复习"
date: '2026-02-06'
draft: false
description:  
toc: false
tags:
  - Redis
---

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
    - Redis 定位
        - 性能：减少 DB 压力
        - 并发：原子操作
        - 临时数据：状态、计数、锁
    - 不适合场景
        - 强一致性核心数据
        - 超大对象
        - 长期冷数据
    - 基本特性
        - 命令执行是单线程
        - 网络 I/O 是多路复用
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
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207000515210.png,420,370)
            - 增加分数与查询名次
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207142718618.png,320,110)
            - TOPN
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207142916620.png,200,40)
            - 按成员删除
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210171017828.png,360,94)
            - 按 score 范围删除
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210171755055.png,377,128)
            - 按排名删除
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210172016602.png,466,343)
        - Bitmap (用户签到/布尔状态)
            - 场景：统计 2026-02 月的签到情况
            - 思路
                - 一个用户 = 1 个 Bitmap
                - 一天 = 1 bit
                - 签到 = 1
                - 未签到 = 0
                - key = sign:用户 ID:202602
                - offset = 第几天 - 1
            - 基础实验
                - 第一天签到 + 第二天签到
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210164227735.png,353,78)
                - 查询某天是否签到
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210164101061.png,330,37)
                - 统计本月签到天数
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210164306694.png,342,39)
        - HyperLogLog (UV/去重统计)
            - 场景：统计某天网站 UV
            - 模拟用户访问
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210164510486.png,323,117)
            - 统计 UV
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210164530550.png,294,36)
            - 特点
                - 内存：固定 12KB
                - 准确度：99%
        - Geo (地理位置/附近的人)
            - 场景
                - 查找 5km 内的商家
                - ZSet + GeoHash
            - 添加地理位置
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210165000620.png,441,116)
            - 查看两点距离
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210165107321.png,441,50)
            - 查询附近 1500km 的城市
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210165141208.png,431,58)
            - 带距离排序
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210165203816.png,431,110)
        - 通用排查命令
            - 查看 Key
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207143038160.png,100,23)
                - 一般生产环境中不建议用 KEYS，建议使用 SCAN
            - 查看类型/是否存在
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207143201412.png,100,40)
            - 删除 key
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207143312380.png,100,22)
    - 缓存系统实战
        - 目标
            - 实现用户查询接口: Get /user/{id}
        - 架构
            - Controller -> Service -> Redis -> FakeDB
        - 逻辑
            - 先查 Redis
            - 没命中查数据库 
            - 写回 Redis
            - 加 TTL
            - 防穿透 + 防击穿
        - Java 实现
            - 初始化项目 https://start.spring.io
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207144538747.png,240,290)
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207145053224.png,100,22)
            - 配置 RedisTemplate
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207162941344.png,420,200)
            - 编写 Service
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207164953341.png,620,900)
            - 编写 Controller
            - 访问 localhost:8080/user/1
            - 查看 redis 内容
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207163242027.png,200,30)
            - 压测
                - ab -n 10000 -c 100 http://localhost:8080/user/1
    - 秒杀系统实战
        - 项目结构
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207202201922.png,180,560)
        - 库存扣减
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207202254845.png,500,500)
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/07/20260207202428795.png,400,190)
        - 消息队列
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208103843531.png,600,200)
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208103947825.png,200,400)
        - 分布式锁
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208104108604.png,600,660)
        - 限流
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208104251769.png,600,300)
        - service
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208104346930.png,200,300)
        - controller
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208104412950.png,200,250)
        - 压测测试
            - ab -n 1000 -c 200 http://localhost:8080/seckill/1
        - 进阶
            - 滑动窗口限流
                - lua
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208174051889.png,400,600)
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208174120075.png,400,120)
                - service
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208174212781.png,250,300)
            - 令牌桶
                - lua
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208183418934.png,200,600)
    - 持久化
        - RDB(快照)
            - 机制：周期性生成内存快照文件 dump.rdb
            - 优点：恢复快、文件紧凑
            - 缺点：可能丢失最近一次快照之后的数据
            - 关键点：fork 触发 COW，会带来短暂的延迟和额外内存占用
        - AOF(追加日志)
            - 机制：写命令追加到 appendonly.aof
            - 刷盘策略
                - appendfsync always：每条都写 fsync，最安全最慢
                - everysec：每秒 fsync，最常用，最多丢 1s
                - no：交给 OS，风险高
            - AOF 重写：压缩日志，避免无限膨胀
        - 混合持久化
            - AOF 前半段是 RDB 快照，后半段是增量 AOF
        - 实验一：只开 RDB，模拟宕机恢复
            - 只启用 RDB 快照
            - 编写配置文件 redis-rdb.conf
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208204018291.png,300,200)
            - 启动 redis 容器
                - mkdir -p ./redis-data
                - docker rm -f redis-rdb 2>/dev/null
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208212630821.png,300,100)
                - 验证 docker logs redis-rdb --tail 20
            - 进入容器
                - docker exec -it redis-rdb redis-cli
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208212952482.png,200,320)
            - 写入大量数据
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208213207221.png,200,40)
            - 观察 persistence
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208213348306.png,300,620)
            - 手动触发 BGSAVE
            - 制造快照后的新增数据（丢失窗口）
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208213600877.png,300,30)
            - 强制宕机
                - docker kill -s KILL redis-rdb
            - 重启 redis
                - docker start redis-rdb
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208213747156.png,320,270)
            - 验证 rdb 文件
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208213916814.png,200,50)
        - 实验 2：只开 AOF，验证刷盘策略差异
            - 清理旧容器和目录
                - docker rm -f redis-aof 2>/dev/null
                - rm -rf ./redis-aof-data
            - 准备三份配置
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208220151934.png,320,590)
            - 清空数据&启动 redis
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208220813971.png,550,130)
            - 检查 AOF 开启
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208221351700.png,570,220)
            - 写入负载 + 强制关闭
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208221604525.png,150,40)
                - docker kill -s KILL redis-aof
            - 重启 Redis
                - docker start redis-aof
            - 查看计数
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208221709710.png)
        - 实验 3：AOF rewrite 触发与观测
            - auto-aof-rewrite-percentage 100
            - auto-aof-rewrite-min-size 64mb
    - 主从复制
        - 目的：读扩展、数据冗余、高可用
        - 全量复制：第一次同步或者 backlog 不够时
        - 增量复制(PSYNC)：短线重连后从 backlog 补差异
        - 实验 1：搭主从并验证数据一致
            - 启动 Master
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208225457359.png,200,40)
            - 启动 Replica
                - 创建并加入网络
                    - docker network create redis-net 2>/dev/null
                    - docker network connect redis-net redis-master
                - 启动 replica 并加入网络
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208232745496.png,250,50)
                - 查看复制状态
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208233441611.png,400,400)
                - 验证数据一致性
                    - 主库写入 + 从库读取
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208233706250.png,330,260)
                - 验证从库默认只读
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208233757628.png,300,70)
                - 查看复制延迟
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/08/20260208233852945.png,100,20)
                - 排障 INFO replication
    - 哨兵 Sentinel (高可用)
        - 目的：监控、选主、故障转移、通知客户端
        - 核心：主观下线、客观下线、选举与 failover
        - 客户端连接地址：不用写死 master 地址，而是通过哨兵获取当前 master
        - 实验：搭建 1 主 2 从+ 3 Sentinel
            - 准备目录
                - mkdir -p redis-sentinel-lab/{conf,data}
            - 准备 Redis 配置
                - master 配置
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209102606425.png,200,90)
                - replica 配置
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209102646643.png,150,120)
                - sentinel 配置
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209201652255.png,500,400)
                    - quorum 2：3 个 sentinel 里至少 2 个认为 master 有问题，才会进入客观下线/转移流程
                    - down-after-milliseconds：5s 没有响应就 SDOWN。
                - docker-compose 启动
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209103212388.png,400,220)
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209103505779.png,200,150)
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209103544585.png,500,40)
                - 验证主从复制
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209103652649.png,350,100)
                    - redis-cli -h 127.0.0.1 -p 6379 -a 123456 INFO replication
                    - redis-cli -h 127.0.0.1 -p 6380 -a 123456 INFO replication
                    - redis-cli -h 127.0.0.1 -p 6381 -a 123456 INFO replication
                - 验证写主从一致性
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209103756350.png,350,100)
                - 验证 Sentinel 监控是否生效
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209201810208.png,200,800)
                    - 查看主库信息 redis-cli -p 26379 SENTINEL master mymaster
                    - 查看从库信息 redis-cli -p 26379 SENTINEL slaves mymaster
        - 实验：故障演练
            - 写入测试数据，验证切主后数据仍然可写
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209202049854.png,400,150)
            - 观察主从拓扑
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209202140865.png,900,300)
            - 查看 Sentinel 实时日志
                - docker compose logs -f --tail 200 sentinel-1
            - 模拟主库宕机
                - docker kill -s KILL $(docker compose ps -q redis-master)
            - 等待故障转移完成（5-15s）
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209214118816.png,500,50)
            - 确定新 master
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209214241750.png,600,30)
            - 验证其中一个哪个变成 master
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209214340957.png,750,100)
            - 验证切主后仍然可写
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209214638757.png,700,140)
            - 启动旧 master
                - docker compose up -d redis-master
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209214737010.png,400,50)
                - 旧 master 变成 slave
            - 最终一致性验证
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209214827689.png,350,70)
        - 实验：SpringBoot 无感切主
            - 验证 Sentiel 当前 master
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209220539046.png,600,70)
            - 配置 Sentinel 连接
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209224129500.png,515,227)
            - 编写 Controller 验证读写
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209221005722.png,438,412)
            - 构建镜像
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209222203602.png,370,480)
                - docker build -t redis-demo . 
            - 切主前写入
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/09/20260209224307958.png,300,80)
            - 模拟主库宕机
                - docker kill -s KILL $(docker compose ps -q redis-master)
                - 观察 sentinel 选主
                - redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster
    - 内存管理
        - INFO memory
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210104614321.png,438,172)
            - used_memory: Redis 实际分配的内存
            - used_memory_human：人类可读的内粗
            - used_memory_rss：进程在 OS 视角占用的物理内存
            - used_memory_peak：历史峰值
            - mem_fragmentation：碎片比 = rss/used_memory >= 2 碎片偏高       - 上限相关
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210105023351.png,250,40)
            - maxmemory：代表你给 Redis 的硬上限，等于 0 代表未设置内存上限，Redis 会继续申请内存知道吃光资源，不会触发淘汰侧路
            - maxmemory-policy：代表 Redis 达到上限时怎么处理
        - 淘汰策略
            - allkeys-lfu （强烈推荐，缓存业务首选）
                - 所有 key 都可能被淘汰
                - 适合热点明显的缓存
            - allkeys-lru
                - 适合访问模式更均匀，有最近性的场景
            - volatile-ttl
                - 只淘汰带过期时间的 key
            - noeviction
                - 拒绝写入，适合强一致性
        - 实验：设置 maxmemory + 不同淘汰策略对比
            - 设置较小的 maxmemory
                - redis-cli -a 123456 CONFIG SET maxmemory 10mb
            - 测试策略
                - redis-cli -a 123456 FLUSHDB
                - redis-cli -a 123456 CONFIG SET maxmemory-policy noeviction
            - 持续写入大 value
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210123915656.png,700,200)
            - 观察指标
                - redis-cli -a 123456 INFO stats | egrep "evicted_keys|keyspace_hits|keyspace_misses"
                - redis-cli -a 123456 INFO memory | egrep "used_memory_human|maxmemory_human|mem_fragmentation_ratio"
        - 实验：LFU vs LRU 对热点的保护效果
            - 目标：构造一个热点 key 与大量冷 key，验证 LFU 更能保护热点
            - 策略设置
                - redis-cli -a 123456 CONFIG SET maxmemory-policy allkeys-lfu
            - 写入热点 key
                - redis-cli -a 123456 SET hot "1"
            - 增加访问频率
                - for i in $(seq 1 20000); do redis-cli -a 123456 GET hot > /dev/null; done
            - 写入大量冷 key
            - 检查 hot 是否存在
        - 实验：内存碎片 fragmentation 观察与整理
            - 制造碎片
                - 反复创建/删除很多不同大小的 value
                - Hash/List 不断增长、缩小
            - 缓解手段
                - 避免频繁大幅变更 value 大小
                - 拆分 bigkey
                - 合理设置 maxmemory，预留空间
                - Redis 4+ 可以考虑 memory purge
        - 实验：BigKey 检测与治理
            - 构造 bigkey
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210125423939.png,785,132)
            - 查看内存
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210125448129.png,425,226)
            - 粗定位 --bigkeys (抽样/扫描)
                - 看到按类型统计的最大 key
                - 会扫描 keyspace，生产慎用
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/02/10/20260210160144500.png,700,400)
            - 精确测量 MEMORY USAGE
                - redis-cli -a 123456 MEMORY USAGE big:hash
            - 观察 BigKey 对延迟的影响
                - 打开延迟监控
                    - redis-cli -a 123456 CONFIG SET latency-monitor-threshold 10
                - 删除 bigkey
                - 查看延迟事件
                    - redis-cli -a 123456 LATENCY LATEST
            - 危害
                - 阻塞主线程
                - 复制/持久化压力
                - 网络抖动
            - 治理方案
                - 拆分设计

# 附录

## 缓存系统实战

缓存系统实战 application.properties:

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.timeout=3000
```

RedisTemplate 配置类:

```java
@Configuration
public class RedisConfig {

    @Bean
    public StringRedisTemplate redisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder().build();
    }
}
```

Service 类：

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final FakeDatabase db;

    public User getUser(Long id) throws Exception {
        String key = "user:" + id;
        // 查缓存
        String cache = redis.opsForValue().get(key);

        if (cache != null) {
            if ("NULL".equals(cache)) {
                return null;
            }
            return mapper.readValue(cache, User.class);
        }

        // 防缓存击穿（热点 key 失效瞬间，大量请求直接打数据库），加锁
        Boolean lock = redis.opsForValue()
                .setIfAbsent("lock:" + id, "1", Duration.ofSeconds(5));
        if (Boolean.FALSE.equals(lock)) {
            Thread.sleep(50);
            return getUser(id);
        }

        // 查数据库
        User user = db.queryUser(id);
        if (user == null) {
            // 防缓存穿透，请求的数据本身就不存在，攻击者疯狂请求，每次请求都打 DB
            redis.opsForValue().set(key, "NULL", Duration.ofSeconds(30));
            return null;
        }

        // 写缓存 + 随机 TTL，防止缓存雪崩
        int ttl = 60 + new Random().nextInt(20);

        String json = mapper.writeValueAsString(user);

        redis.opsForValue().set(key, json, Duration.ofSeconds(ttl));
        return user;
    }
}

```

Controller 类

```java
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/user/{id}")
    public User get(@PathVariable Long id) throws Exception {
        return userService.getUser(id);
    }
}
```

FakeDB 类

```java
@Component
public class FakeDatabase {

    public User queryUser(Long id) {
        try {
            Thread.sleep(100);
        }   catch (Exception ignored) {

        }
        if (id == 999L) {
            return null;
        }
        return new User(id, "User_" + id);
    }
}
```

## 秒杀系统实战

SeckillController

```java
@RestController
@RequiredArgsConstructor
public class SeckillController {

    private final SeckillService service;

    @PostMapping("/seckill/{userId}")
    public String seckill(@PathVariable Long userId) {
        int r = service.seckill(userId);

        return switch (r) {
            case 1 -> "成功";
            case 0 -> "库存不足";
            case -1 -> "重复下单";
            case -2 -> "限流";
            case -3 -> "重复请求";
            default -> "失败";
        };
    }
}
```

RateLimiter

```java
@Component
@RequiredArgsConstructor
public class RateLimiter {

    private final StringRedisTemplate redis;

    public boolean allow(String key, int limit) {
        String redisKey = "limit:" + key + ":" + Instant.now().getEpochSecond();
        Long count = redis.opsForValue().increment(redisKey);

        if (count == 1) {
            redis.expire(redisKey, Duration.ofSeconds(2));
        }
        return count <= limit;
    }
}
```

RedisLock

```java
@Component
@RequiredArgsConstructor
public class RedisLock {

    private final StringRedisTemplate redis;

    private static final String LOCK_PREFIX = "lock:";
    private static final long DEFAULT_EXPIRE = 5;

    private static final DefaultRedisScript<Long> UNLOCK_SCRIPT;

    static {
        UNLOCK_SCRIPT = new DefaultRedisScript<>();
        UNLOCK_SCRIPT.setScriptText(
                """
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end
                """
        );
        UNLOCK_SCRIPT.setResultType(Long.class);
    }

    public String tryLock(String key) {
        String lockKey = LOCK_PREFIX + key;
        // 每个线程唯一 id
        String lockValue = UUID.randomUUID().toString();
        Boolean success = redis.opsForValue().setIfAbsent(lockKey, lockValue, Duration.ofSeconds(DEFAULT_EXPIRE));
        if (Boolean.TRUE.equals(success)) {
            return lockValue;
        }
        return null;
    }

    public boolean unlock(String key, String lockValue) {
        String lockKey = LOCK_PREFIX + key;
        Long result = redis.execute(
                UNLOCK_SCRIPT,
                Collections.singletonList(lockKey),
                lockValue
        );
        return Long.valueOf(1).equals(result);
    }

}
```

LuaConfig

```java
@Configuration
public class LuaConfig {

    @Bean
    public DefaultRedisScript<Long> stockScript() {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setLocation(new ClassPathResource("lua/stock.lua"));
        script.setResultType(Long.class);

        return script;
    }
}
```

stock.lua

```lua
-- KEYS[1] = 库存 key
-- KEYS[2] = 订单集合 key
-- ARGV[1] = 用户 id
local stock = tonumber(redis.call('get', KEYS[1]))

if stock <= 0 then
    -- 库存不足
    return 0
end

-- 防止重复下单
if redis.call('sismember', KEYS[2], ARGV[1]) == 1 then
    -- 重复下单
    return -1
end

-- 扣库存
redis.call('decr', KEYS[1])

-- 记录用户下单
redis.call('sadd', KEYS[2], ARGV[1])
-- 成功下单
return 1
```

OrderQueue

```java
@Component
@RequiredArgsConstructor
public class OrderQueue {

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    private static final String QUEUE_KEY = "queue:orders";

    public void push(Order order) {
        try {
            String json = objectMapper.writeValueAsString(order);
            redis.opsForList().leftPush(QUEUE_KEY, json);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public Order pop() {
        String result = redis.opsForList().rightPop(QUEUE_KEY, Duration.ofSeconds(0));
        if (result == null) {
            return null;
        }

        try {
            return objectMapper.readValue(result, Order.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```


OrderWorker

```java
@Component
@RequiredArgsConstructor
public class OrderWorker {

    private final OrderQueue queue;

    @PostConstruct
    public void start() {
        Thread work = new Thread(() -> {
            while(true) {
                Order order =queue.pop();
                if (order != null) {
                    process(order);
                }
            }
        });

        work.setDaemon(true);
        work.start();
    }

    private void process(Order order) {
        System.out.println("处理订单: " + order);
        try {
            Thread.sleep(100);
        } catch (Exception ignored) {

        }
    }
}
```

SeckillService

```java
@Service
@RequiredArgsConstructor
public class SeckillService {

    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> stockScript;
    private final OrderQueue queue;
    private final RateLimiter rateLimiter;
    private final RedisLock redisLock;

    public int seckill(Long userId) {

        if (!rateLimiter.allow("seckill", 100)) {
            return -2; // 系统繁忙
        }

        // 获取分布式锁
        String token = redisLock.tryLock("user:" + userId);
        if (token == null) {
            return -3;
        }

        try {
            List<String> keys = List.of(
                    "seckill:stock",
                    "seckill:orders"
            );

            Long result = redis.execute(stockScript, keys, userId.toString());

            if (result == 1) {
                Order order = new Order(userId, System.currentTimeMillis());
                queue.push(order);
            }
            return result.intValue();
        } finally {
            redisLock.unlock("user:" + userId, token);
        }
    }

}
```

## 秒杀系统滑动窗口限流进阶

ratelimit.lua

```lua
-- KEYS[1] = rate limit key (zset)
-- ARGV[1] = now(ms)
-- ARGV[2] = window(ms)
-- ARGV[3] = limit(max requests in window)
-- ARGV[4] = member(unique id for this requests)
-- ARGV[5] = expireSeconds(Key ttl)

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local expireSeconds = tonumber(ARGV[5])

-- 1 remove out-of-window
redis.call('zremrangebyscore', key, 0, now - window)

-- 2 current call
local cnt = redis.call('zcard', key)

-- 3 if exceed, reject
if cnt >= limit then
    return 0
end

-- 4 add current request
redis.call('zadd', key, now, member)

-- 5 set ttl to avoid key leak
redis.call('expire', key, expireSeconds)
return 1
```

LuaConfig

```java
@Bean
public DefaultRedisScript<Long> rateLimitScript() {
    DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    script.setLocation(new ClassPathResource("lua/ratelimit.lua"));
    script.setResultType(Long.class);
    return script;
}
```

SlidingWindowLimit

```java
@Component
@RequiredArgsConstructor
public class SlidingWindowRateLimiter {

    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> rateLimitScript;

    public boolean allow(String key, int limit, long windowMs) {
        long now = System.currentTimeMillis();

        // 每次请求唯一 member
        String member = now + "-" + UUID.randomUUID();

        // key TTL，一般设置为 window 的 2-3 倍，保证窗口内数据可用并自动回收
        long expireSeconds = Math.max(2, (windowMs * 3) / 1000);

        String redisKey = "rl:" + key;

        Long result = redis.execute(
                rateLimitScript,
                Collections.singletonList(redisKey),
                String.valueOf(now),
                String.valueOf(windowMs),
                String.valueOf(limit),
                member,
                String.valueOf(expireSeconds)
        );
        System.out.println("result:" + result);
        return Long.valueOf(1).equals(result);
    }
}
```

## 秒杀系统进阶令牌桶

token_bucket.lua

```lua
-- KEYS[1] = bucket key
-- ARGV[1] = now_ms
-- ARGV[2] = capacity (max tokens)
-- ARGV[3] = refill_rate_per_sec (tokens per second)
-- ARGV[4] = cost (tokens per request, usually 1)
-- ARGV[5] = ttl_seconds (expire key to avoid leaks)

local key = KEYS[1]
local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local rate = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

-- Read current state
local tokens = redis.call('hget', key, 'tokens')
local ts = redis.call('hget', key, 'ts')

if tokens == false or ts == false then
    tokens = capacity
    ts = now
else
    tokens = tonumber(tokens)
    ts = tonumber(ts)
end

-- Refill tokens based on elapsed time
local delta_ms = now - ts
if delta_ms < 0 then
    delta_ms = 0
end

local refill = (delta_ms / 1000.0) * rate
tokens = math.min(capacity, tokens + refill)

-- Decide allow or reject
if tokens < cost then
    redis.call('hset', key, 'tokens', tokens)
    redis.call('hset', key, 'ts', now)
    redis.call('expire', key, ttl)
    return 0
end

-- Consume tokens
tokens = tokens - cost

redis.call('hset', key, 'tokens', tokens)
redis.call('hset', key, 'ts', now)
redis.call('expire', key, ttl)

return 1
```




TokenBucketRateLimiter

```java
@Component
@RequiredArgsConstructor
public class TokenBucketRateLimiter {

    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> tokenBucketScript;

    /**
     * 令牌桶限流
     * @param key 限流维度
     * @param capacity 桶容量
     * @param ratePerSec 补充速率
     * @param cost 每次请求消耗令牌数
     */
    public boolean allow(String key, long capacity, double ratePerSec, long cost) {
        long now = System.currentTimeMillis();
        String redisKey = "tb:" + key;

        // TTL: 建议 >= 桶完全补满的时间 * 2 (避免闲置 key 常驻)
        // refill time ≈ capacity / ratePerSec
        long refillSeconds = (long) Math.ceil(capacity / Math.max(ratePerSec, 0.0000001));
        long ttlSeconds = Math.max(2, refillSeconds * 2);

        Long result = redis.execute(
                tokenBucketScript,
                Collections.singletonList(redisKey),
                String.valueOf(now),
                String.valueOf(capacity),
                String.valueOf(ratePerSec),
                String.valueOf(cost),
                String.valueOf(ttlSeconds)
        );
        return Long.valueOf(1).equals(result);
    }
}
```

LuaConfig

```java
@Bean
public DefaultRedisScript<Long> tokenBucketScript() {
    DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    script.setLocation(new ClassPathResource("lua/token_bucket.lua"));
    script.setResultType(Long.class);
    return script;
}
```

## 哨兵实验

docker-compose

```yaml
services:
  redis-master:
    image: redis:7
    container_name: redis-master
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]
    volumes:
      - ./conf/redis-master.conf:/usr/local/etc/redis/redis.conf
      - ./data/master:/data
    ports:
      - "6379:6379"
    networks: [redisnet]

  redis-replica-1:
    image: redis:7
    container_name: redis-replica-1
    depends_on: [redis-master]
    command: ["redis-server", "/usr/local/etc/redis/redis.conf", "--replicaof", "redis-master", "6379"]
    volumes:
      - ./conf/redis-replica.conf:/usr/local/etc/redis/redis.conf
      - ./data/replica1:/data
    ports:
      - "6380:6379"
    networks: [redisnet]

  redis-replica-2:
    image: redis:7
    container_name: redis-replica-2
    depends_on: [redis-master]
    command: ["redis-server", "/usr/local/etc/redis/redis.conf", "--replicaof", "redis-master", "6379"]
    volumes:
      - ./conf/redis-replica.conf:/usr/local/etc/redis/redis.conf
      - ./data/replica2:/data
    ports:
      - "6381:6379"
    networks: [redisnet]

  sentinel-1:
    image: redis:7
    container_name: sentinel-1
    depends_on: [redis-master, redis-replica-1, redis-replica-2]
    command:
      [
        "sh","-c",
        "cp /usr/local/etc/redis/sentinel.conf /data/sentinel.conf && exec redis-sentinel /data/sentinel.conf"
      ]
    volumes:
      - ./conf/sentinel.conf:/usr/local/etc/redis/sentinel.conf
      - ./data/s1:/data
    ports:
      - "26379:26379"
    networks: [redisnet]

  sentinel-2:
    image: redis:7
    container_name: sentinel-2
    depends_on: [redis-master, redis-replica-1, redis-replica-2]
    command:
      [
        "sh","-c",
        "cp /usr/local/etc/redis/sentinel.conf /data/sentinel.conf && exec redis-sentinel /data/sentinel.conf"
      ]
    volumes:
      - ./conf/sentinel.conf:/usr/local/etc/redis/sentinel.conf
      - ./data/s2:/data
    ports:
      - "26380:26379"
    networks: [redisnet]

  sentinel-3:
    image: redis:7
    container_name: sentinel-3
    depends_on: [redis-master, redis-replica-1, redis-replica-2]
    command:
      [
        "sh","-c",
        "cp /usr/local/etc/redis/sentinel.conf /data/sentinel.conf && exec redis-sentinel /data/sentinel.conf"
      ]
    volumes:
      - ./conf/sentinel.conf:/usr/local/etc/redis/sentinel.conf
      - ./data/s3:/data
    ports:
      - "26381:26379"
    networks: [redisnet]

networks:
  redisnet:
    driver: bridge
```

## 哨兵故障演练实验


docker-compose.yml

```yml
services:
  redis-master:
    image: redis:7
    container_name: redis-master
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]
    volumes:
      - ./conf/redis-master.conf:/usr/local/etc/redis/redis.conf
      - ./data/master:/data
    ports:
      - "6379:6379"
    networks:
      redisnet:
        ipv4_address: 172.28.0.10

  redis-replica-1:
    image: redis:7
    container_name: redis-replica-1
    depends_on: [redis-master]
    command: ["redis-server", "/usr/local/etc/redis/redis.conf", "--replicaof", "172.28.0.10", "6379"]
    volumes:
      - ./conf/redis-replica.conf:/usr/local/etc/redis/redis.conf
      - ./data/replica1:/data
    ports:
      - "6380:6379"
    networks: [redisnet]

  redis-replica-2:
    image: redis:7
    container_name: redis-replica-2
    depends_on: [redis-master]
    command: ["redis-server", "/usr/local/etc/redis/redis.conf", "--replicaof", "172.28.0.10", "6379"]
    volumes:
      - ./conf/redis-replica.conf:/usr/local/etc/redis/redis.conf
      - ./data/replica2:/data
    ports:
      - "6381:6379"
    networks: [redisnet]

  sentinel-1:
    image: redis:7
    container_name: sentinel-1
    depends_on: [redis-master, redis-replica-1, redis-replica-2]
    command:
      [
        "sh","-c",
        "cp /usr/local/etc/redis/sentinel.conf /data/sentinel.conf && exec redis-sentinel /data/sentinel.conf"
      ]
    volumes:
      - ./conf/sentinel.conf:/usr/local/etc/redis/sentinel.conf
      - ./data/s1:/data
    ports:
      - "26379:26379"
    networks: [redisnet]

  sentinel-2:
    image: redis:7
    container_name: sentinel-2
    depends_on: [redis-master, redis-replica-1, redis-replica-2]
    command:
      [
        "sh","-c",
        "cp /usr/local/etc/redis/sentinel.conf /data/sentinel.conf && exec redis-sentinel /data/sentinel.conf"
      ]
    volumes:
      - ./conf/sentinel.conf:/usr/local/etc/redis/sentinel.conf
      - ./data/s2:/data
    ports:
      - "26380:26379"
    networks: [redisnet]

  sentinel-3:
    image: redis:7
    container_name: sentinel-3
    depends_on: [redis-master, redis-replica-1, redis-replica-2]
    command:
      [
        "sh","-c",
        "cp /usr/local/etc/redis/sentinel.conf /data/sentinel.conf && exec redis-sentinel /data/sentinel.conf"
      ]
    volumes:
      - ./conf/sentinel.conf:/usr/local/etc/redis/sentinel.conf
      - ./data/s3:/data
    ports:
      - "26381:26379"
    networks: [redisnet]

networks:
  redisnet:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```


sentinel.conf

```conf
port 26379
bind 0.0.0.0
protected-mode no

# 监控主库：mymaster 名称、主库 host/port、quorum（法定票数）
sentinel monitor mymaster 172.28.0.10 6379 2

# 认证（主库有 requirepass 时必须加）
sentinel auth-pass mymaster 123456

# 多久没响应算主观下线（ms）
sentinel down-after-milliseconds mymaster 5000

# 故障转移超时（ms）
sentinel failover-timeout mymaster 10000

# 同时同步副本数量（不影响本实验搭建，可保留默认）
sentinel parallel-syncs mymaster 1

# Redis 7 的 Sentinel 默认会把 monitor 的 host 当成“IP/可直接解析的实例”，
# 在某些环境下它不会走你以为的 resolver 路径（或要求显式开启 hostname 解析）
# 解决方法是——打开 Sentinel 的 hostname 解析开关
sentinel resolve-hostnames yes
sentinel announce-hostnames yes
```