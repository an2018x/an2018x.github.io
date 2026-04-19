---
title: "Grafana 复习"
date: '2026-04-10'
draft: false
description:  
toc: true
---

# 基础入门

{{< mind height="860px" >}}
- 基础入门
    - 可观测性与 Grafana 概览
        - 理解可观测性
            - 什么是可观测性
                - 指通过系统对外输出的数据，来推断系统内部状态的能力
                - 和监控的区别：监控是预先定义好要看什么，可观测性让你能回答事先没想到的问题
            - 三大支柱
                - Metrics（指标）：
                    - 带事件戳的数值数据，例如 QPS、响应事件 P99、内存使用率
                    - 指标的特点是体积小、聚合性强，适合用来回答系统整体表现如何
                - Logs （日志）：
                    - 是离散的事件记录，比如一条错误堆栈、一次用户登录、一个数据库慢查询
                    - 日志的特点是信息丰富但体积大，适合用来回答到底发生了什么
                    - 指标告诉你系统有问题，需要通过日志定位具体原因
                - Traces（链路追踪）：
                    - 记录一个请求在分布式系统中经过的所有服务和耗时
                    - 一个 API 请求经过了网关 -> 用户服务 -> 订单服务 -> 数据库
                    - Trace 记录每一跳的耗时
                    - 适合回答请求慢在哪个环节
        - 认知 Grafana 生态
            - Grafana 是什么
                - 是 Grafana Labs 开发的开源可视化与监控平台
                - Grafana 本身不存储数据，是一个统一的查询和可视化前端
            - LGTM 技术栈
                - LGTM 代表四个核心组件-Loki、Grafana、Tempo 和 Mimir，每个负责可观测性的一个关键方面
                - L - Loki：日志聚合系统，类似 ELK 中的 Elasticsearch 但是更轻量
                - G - Grafana：可视化中心，所有数据汇聚于此
                - T - Tempo：分布式追踪后端，存储和查询 Trace 数据
                - M - Mimir：长期指标存储，可以理解为 Prometheus 的增强版
        - 了解 Prometheus 在生态中的角色
            - Prometheus 是什么
                - 是一个开源的指标监控和告警系统
                - 在 Grafana 中扮演数据采集和存储的角色
            - 关键特征
                - 拉取模型（Pull Model）：Prometheus 主动去拉取目标服务的指标，而不是目标服务推送数据给它，服务只需暴露 /metrics HTTP 端点
                - 时序数据库：所有指标都按时间戳存储，形成时间序列
                - PromQL：Prometheus 自带的查询语言
    - 环境搭建与初识 Grafana 界面
        - 用 Docker Compose 搭建环境
            - 创建项目目录
                - 
                ```
                grafana-learning/
                ├── docker-compose.yml
                └── prometheus/
                    └── prometheus.yml
                ```
            - 启动服务
                - 在 grafana-learning 目录打开终端，运行
                ```bash
                docker-compose up -d
                ```
            - 验证 prometheus
                - 打开浏览器访问 localhost:9090
                - 在查询框输入 up 点击 execute
                - 结果 up{job="prometheus"} 的值为 1
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163113390.png,440,150)
                - 点击 Status -> Targets，看到 prometheus 的 target，状态为绿色的 UP
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163148074.png,400,150)
            - 验证 Grafana
                - 打开 localhost:3000，使用 admin/admin123 登录
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163255350.png,309,338)
        - 熟悉 Grafana 界面
            - Home：首页，包含最近访问的仪表盘和快捷入口
            - Dashboard：管理和浏览所有仪表盘，核心功能区
            - Explore：临时查询和调试数据的工作台
            - Alerting：配置告警规则，通知渠道和静默策略
            - Connections：管理数据源连接，在这里添加 Prometheus
            - Administration：系统管理（用户、组织、插件、服务器设置等）
        - 连接 Prometheus 并创建第一个面板
            - 添加 Prometheus 数据源
                - 在 Grafana -> Connections -> Data source -> Add data source (Prometheus)
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163355890.png,400,300)
                - 配置 Connection URL：http://prometheus:9090 （容器名）
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163429596.png,300,80)
                - 出现 queried the Prometheus API 提示，说明连接成功
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163506913.png,410,60)
            - 创建第一个 Dashboard
                - Dashboard -> New -> New dashboard -> Add visualization
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163625329.png,430,290)
                - Metric ，输入 up，点击 Run queries，看到值为 1 的直线
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163741421.png,260,160)
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163813561.png,260,190)
                - Save Dashboard 保存面板
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410163933122.png,260,210)
            - 添加第二个面板
                - Add -> Visualization
                - 输入 prometheus_target_interval_length_seconds
                - 记录了 Prometheus 实时抓取目标的时间间隔，会看到多条线，因为有不同的 quantile 标签
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410164235654.png,260,200)
                - 面板设置，Title -> 抓取间隔分布，Legend 模式改为 Custom 输入 quantile
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410164840562.png,260,170)
            - 调整时间范围
                - 调整时间选择器 Last 6 hours
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410165639451.png,340,320)
    - 理解 Prometheus 的基本概念
        - Prometheus 的工作原理
            - 拉取模型
                - 传统的方式是应用主动把数据推给监控服务器
                - Prometheus 按照固定的事件间隔，主动去拉取每个目标暴露的指标数据
                - Prometheus 每隔 15s (scape_interval) 向目标服务发起一个 HTTP GET 请求，访问 /metrics 端点
                - 解析返回的文本并存入本地的时序数据库
                - 优点：被监控的服务不需要知道 Prometheus 地址，只需暴露一个 HTTP 端点
                - Prometheus 可以集中管理所有采集目标的配置，如果某个目标挂了，Prometheus 能立刻发现
            - metric 数据结构
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410175651692.png,260,150)
                - 格式：指标名称{标签1="值1", 标签2="值2"} 数值 时间戳
        - 四种指标类型
            - Counter 计数器
                - 只增不减，每次事件发生，值就加 1
                - 典型用例是请求总数、错误总数、发送的字节数
                - 几乎不会直接看 Counter 的原始值，而是用 rate() 函数计算它的增长速率
                - 例如 rate(http_requests_total[5m]) 告诉过去 5m 平均每秒处理了多少请求
                - Counter 在服务重启时会归零，但 rate() 函数能自动处理这种重置
            - Gauge 仪表盘
                - Gauge 可以上升也可以下降，代表某个瞬时状态的快照
                - 典型用例是当前内存的使用率、CPU 温度、队列中任务量
                - 与 Counter 不同，Gauge 的原始值本身就有意义，不需要 rate()
            - Histogram 直方图
                - Histogram 把观测值按照预定义的区间分类计数
                - 每次请求的响应时间会被分到不同的时间区间中
                - Histogram 在 Prometheus 中实际会产生多个时间序列：_bucket(每个区间的累计计数)、_count(总观测次数)、_sum(所有观测值的总和)
                - Histogram 的核心价值在于它可以在服务端灵活计算任意分位数
                - 可以用 histogram_quantile(0.95,...) 在查询时计算 P95
            - Summary 摘要
                - Summary 和 Histogram 解决类似的问题，但是它在客户端直接计算分位数
                - Summary 的缺点是分位数在客户端计算后就固定了，无法跨实例聚合
                - 实际项目中，Histogram 比 Summary 用的更多
        - 理解标签
            - 一个指标名称加上一组标签，唯一确定一条时间序列
            - 什么是标签
                - 查询 prometheus_http_requests_total:
                ```
                prometheus_http_requests_total{code="200", handler="/api/v1/query", instance="prometheus:9090", job="prometheus"}  → 42
                prometheus_http_requests_total{code="200", handler="/metrics", instance="prometheus:9090", job="prometheus"}       → 1580
                prometheus_http_requests_total{code="302", handler="/", instance="prometheus:9090", job="prometheus"}              → 3
                ```
                - code、handler、instance、job 都是标签，虽然指标名称是 prometheus_http_requests_total，但是每组不同的标签组合构成了独立的时间序列
                - 标签可以做维度分析：按 HTTP 状态码筛选，按接口路径分组，按实例聚合
                - 需要注意标签的基数，如果用用户 ID 作为标签，会导致存储爆炸
            - 查询
                - prometheus_http_requests_total{code="200"} 只看成功的请求
    - 在 Grafana 中连接数据源与创建面板
        - Explore 查询实验台
            - 查询 Counter 指标
                - prometheus_http_requests_total
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410191834327.png,400,400)
                - 只看 /metrics 端点的请求
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410191950185.png,400,400)
                - 使用 rate() 函数把累计值转换为速率
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410192131676.png,400,400)
                    - [5m] 是范围选择器，表示过去 5min 内每秒的平均请求数，指定了计算速率的时间窗口
            - 查询 Gauge 指标
                - go_goroutines
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410192303151.png,400,400)
                - go_memstats_alloc_bytes/1024
                    - 是 Prometheus 进程当前分配的内存字节数，/1024 转换为 KB
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410192453732.png,400,400)
            - 观察 Histogram 指标的结构
                - prometheus_http_request_duration_seconds_bucket
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410192606038.png,400,375)
                    - 每个时间序列都带有 le 标签，表示 less than or equal
                    - 计算 P90
                        - histogram_quantile(0.9, rate(prometheus_http_request_duration_seconds_bucket[5m]))
                        - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410193139016.png,400,375)
        - 构建完整的 Dashboard
            - 创建 Dashboard
                - Dashboard -> New -> New dashboard，save dashboard 命名为 "Day 4-Prometheus 自监控"
            - 面板 1：Prometheus 运行状态 (Stat 面板)
                - Add -> Visualization，面板类型从 Time series 切换成 Stat
                - 查询输入 up{job="prometheus"}
                - Title 填运行状态
                - Value mapping 部分，点击 Add Value mapping，添加 1->正常运行/绿色，0->已宕机/红色
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410194252635.png,300,300)
            - 面板 2：每秒请求数 (Time Series 面板)
                - 查询输入 rate(prometheus_http_requests_total[5m])
                - Title "HTTP 请求速率 (按 handler)"
                - Legend 输入 {{handler}}
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/10/20260410194559215.png,300,300)
            - 面板 3：内存使用量 (Time Series 面板)
                - go_memstats_alloc_bytes / 1024 / 1024
                - Title 填内存使用 (MB)，右侧设置找到 Standard options -> Unit，搜索并选择 Megabytes (SI)，设置 Decimals 为 1，让数值显示一位小数
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412093035837.png,440,340)
            - 面板 4: Goroutine 数量 (Gauge 面板)
                - 这里的 Gauge 是 Grafana 的面板类型，不是 Prometheus 的指标类型，同名但是概念不同
                - go_goroutines
                - Title 填 Goroutines，在 Standard options 中设置 Min 为 0，Max 为 100
                - 找到 Threshholds 部分，设置阈值：绿色为基础色，50 以上为黄色，80 以上为红色
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412093435497.png,420,340)
            - 面板 5: 请求耗时 P90 (Stat 面板)
                - 新建 Stat
                - histogram_quantile(0.9, rate(prometheus_http_request_duration_seconds_bucket[5m]))
                - Title 请求耗时 P90，在 Standard Options -> Unit 中选择 seconds
            - 布局建议
                - 第一行放小面板-运行状态和请求耗时 P90 这种单值面板适合窄小的尺寸
                - 第二行放 HTTP 请求速率这种需要横向展开的时序图
                - 第三行并排放内存使用和 Goroutines
            - 面板探索设置
                - Standard options 包含最常用的显示设置：Unit 单位、Min/Max 范围、Decimals 小数位数、Color Schema 配色方案
                - Threshholds 用颜色编码数值区间，帮助快速判断好坏
                - Overrides 允许为特定的时间序列覆盖全局设置
{{< /mind >}}

# 核心技能

{{< mind height="860px" >}}
- 核心技能
    - PromQL
        - 两种向量 - PromQL 的基石
            - 即时向量
                - 即时向量返回每条时间序列在某一时刻的采样值，之前的大部分查询都是即时向量
                - up/go_goroutines/prometheus_http_requests_total{handler="/metrics"}
                - 每条查询返回的是当前时刻每条匹配的事件序列的最新值
                - 切换到 Table 视图看的更清晰
            - 范围向量
                - 返回每条时间序列在一个时间窗口内的所有采样值，语法是在指标名后加 [时间窗口]
                - prometheus_http_requests_total{handler="/metrics"}[5m]
                - 返回的是过去 5 分钟内的所有采样点
                - 范围向量不能直接绘图，只能作为函数的输入转化为即时向量，最常见的就是 rate()
            - 时间窗口的写法
                - 支持这些时间单位 s(秒)、m(分钟)、h(小时)、d(天)、w(周)、y(年)
                - 可以组合使用 [1h30m] 表示 1小时 30 分钟
                - 窗口越短，曲线越尖锐，能捕捉到更细微的波动，窗口越长，曲线越平滑，反映的是更长期的趋势
                - 5m 是最常用的窗口
        - 核心函数
            - rate()
                - 计算 Counter 在指定时间窗口内的平均增长率，会自动处理 Counter 重置
                - rate(prometheus_http_requests_total[5m])
            - irate()
                - irate() 只用时间窗口内最后两个数据点计算瞬时速率，对突刺更敏感
                - irate(prometheus_http_requests_total[5m])
                - 因为只看两个点，结果不够稳定，一般不用于告警规则
            - increase()
                - 返回 Counter 在时间窗口内的总增长量
                - increase(prometheus_http_requests_total{handler="/metrics"}[1h])
                - 告诉你过去 1 h /metrics 端点一共被请求了多少次
            - sum()
                - sum() 把多条时间序列的值加在一起
                - sum(rate(prometheus_http_requests_total[5m]))
                    - 把所有 handler、所有 code 的请求速率加总，得到一个总 QPS
                - sum by (code) (rate(prometheus_http_requests_total[5m]))
                    - 可以用 by 子句按某个标签维度分组
            - avg()
                - 有多个实例时，avg() 能给出平均值
                - 也支持 by 分组
            - count()
                - count(prometheus_http_requests_total)
                - 返回的是有多少条时间序列匹配这个查询
        - 数学运算与常用模式
            - 算术运算
                - 支持标准的数学运算符
                    - go_memstats_alloc_bytes / 1024 / 1024
                - 两个指标之间也能做运算 HTTP 请求的错误率
                    - sum(rate(prometheus_http_requests_total{code=~"5.."}[5m]))/sum(rate(prometheus_http_requests_total[5m]))
            - 比较运算
                - go_goroutines > 30
            - 聚合函数
                - min(prometheus_http_request_duration_seconds_sum)
                - max(prometheus_http_request_duration_seconds_sum)
                - topk(3, prometheus_http_requests_total)
                - bottomk(2, prometheus_http_requests_total)
        - 标签匹配的四种方式
            - 精确匹配 =
                - prometheus_http_requests_total{handler="/metrics"}
            - 精确排除 !=
                - prometheus_http_requests_total{handler!="/metrics"}
            - 正则匹配
                - prometheus_http_requests_total{handler=~"/api/v1/.*"}
            - 正则排除
                - prometheus_http_requests_total{handler!~"/api/v1/.*"}
        - 聚合-by 与 without
            - by 保留指定标签
                - by 告诉聚合函数"按这些标签分组，其余标签全部丢弃"
                - sum by (code) (rate(prometheus_http_requests_total[5m]))
                - 可以按多个标签分组
                - sum by (code, handler) (rate(prometheus_http_requests_total[5m]))
            - without 排除指定标签
                - 按除了这些标签之外的所有标签分组
                - sum without (instance) (rate(prometheus_http_requests_total[5m]))
                - 会移除 instance 标签维度，保留其他所有标签。效果是把同一个 job 下不同实例的数据合并。
            - 什么时候用 by/without
                - 关心的维度少，想丢弃的维度多，用 by
        - 时间偏移与数据对比
            - offset 查看历史数据
                - go_goroutines offset 1h
                - 返回的是 1 小时前的 goroutine 数量。单独看这个值意义不大，但它可以用来做环比对比。
            - 计算同比/环比变化
                - 用当前值减去历史值，就能得到变化量
                - 
                ```
                rate(prometheus_http_requests_total{handler="/metrics"}[5m])
                -
                rate(prometheus_http_requests_total{handler="/metrics"}[5m] offset 1h)
                ```
    - 深入 Grafana 面板类型
        - 面板选择的思考方式
            - 单个关键数值
                - Stat 或 Gauge
                - Stat 适合展示当前值，Gauge 适合展示有范围的百分比
            - 随时间变化的趋势
                - TimeSeries
                - 最常用的面板类型，适合 QPS、延迟、内存使用等需要观察时间趋势的指标
            - 多项的大小对比
                - Bar chart
                - 适合按维度比较大小，例如各服务的请求量排行、各状态码的占比
            - 数据的分布密度
                - Heatmap
                - 用颜色深浅表示值的密集程度，非常适合展示请求延迟分布随时间的变化，Histogram 数据的最佳搭档
            - 结构化明细数据
                - Table 
                - 展示多列明细数据，适合需要精确数值和排序的场景
        - TimeSeries 进阶
            - 面板 1：多线对比
                - 查询：rate(prometheus_http_requests_total[5m])
                - Legend 填写 {{handler}} {{code}}
                - 右侧设置 Graph Styles，Line Width:2, Fill opacity:10（线条下方增加淡填充色）
                - Tooltip，设置为 All，Sort order: Descending
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412104830826.png,600,220)
            - 面板 2：堆叠面积图
                - 查询：sum by (code) (rate(prometheus_http_requests_total[5m]))
                - Title: 请求量堆叠（按状态码）
                - Legend {{code}}、Graph styles，找到 Stack series 设置为 Normal
                - Fill opacity 调整到 50
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412105336324.png,540,300)
        - Stat 面板的丰富配置
            - 面板 3：带 sparkline 的 Stat
                - sum(rate(prometheus_http_requests_total[5m]))
                - Title：总 QPS，Stat Stype: Grap mode -> Area (在大数字下面显示迷你趋势线-sparkline)
                - Standard options -> Unit requests/sec (ps)，Decimals=2
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412105937729.png,551,342)
            - 面板 4：多值 Stat
                - 查询 A：sum(rate(prometheus_http_requests_total{code="200"}[5m]))
                - 查询 B：sum(rate(prometheus_http_requests_total{code!="200"}[5m]))
                - Legend：A -> 成功请求，B -> 非 200 请求
                - Orientation -> Horizontal 两个值会并排显示
                - Thresholds B 设置 0 为绿色，0.1 以上为红色
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412110948641.png,541,320)
        - BarChart 维度对比
            - 面板 5：按 handler 排行的柱状图
                - sort_desc(sum by (handler) (increase(prometheus_http_requests_total[1h])))
                - 这条查询计算过去 1 h内每个 handler 的请求总量，按降序排列
                - Bar chart 显示效果不理想，PromQL 返回的是时间序列数据，Bar chart 更适合展示某一时刻的快照
                - 在查询编辑器的 Options 区域，把 Format 改为 Table，把 Type 改为 Instant
                - 在右侧面板设置中，"Orientation" 改为 "Horizontal"（横向柱状图）
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412122419997.png,600,170)
        - Table 结构化明细
            - 面板 6：指标明细表
                - sort_desc(sum by (handler, code) (increase(prometheus_http_requests_total[1h])))
                - 在 Option 中设置 Format 为 Table，Type 为 Instant
                - Overrides -> Add field override -> Fields with name -> 选择 value
                - 点击 "Add override property" → 在搜索框中输入 "cell" → 选择 "Cell type"，然后设为 "Colored background"
                - 颜色效果依赖 Threshold 的配置
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412151854303.png,422,282)
        - Heatmap 分布密度
            - Heatmap 是 Histogram 数据的最佳搭档
            - 用颜色深浅表示数据密度，X 轴是时间，Y 轴是数值区间
            - 面板 7：请求延迟分布热力图
                - sum(increase(prometheus_http_request_duration_seconds_bucket[5m])) by (le)
                - 把所有 handler 的延迟 bucket 数据汇总，le 标签表示 bucket 的上界
                - Format -> Heatmap
                - Yaxis，Unit -> seconds，Colors -> Scheme 选择不同的配色方案
                - Title：请求延迟分布
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412152205566.png,530,310)
        - Dashboard 布局优化
            - 第一行放概览指标（Stat 面板）
            - 第二行放趋势图，Time Series 面板（多线对比，堆叠面积图）
            - 第三方放分析图，Bar Chart 和 Heatmap 并排放在第三排
            - 第四行放明细表，Table 面板放在最底部
    - Dashboard 变量与交互设计
        - 理解变量的作用
            - 变量允许用户通过下拉框切换要查看的数据维度，而不用为每个维度创建单独的面板
        - 创建一个变量
            - 进入变量设置
                - Dashboard 页面 -> Settings -> Variables -> Add variable
            - 创建 handler 变量
                - Name 填 handler，这是变量的标识符，在查询中用 $handler 引用它
                - Label 填接口，这是下拉框旁边显示的中文标签
                - Type 选 Query，这表示变量的候选值从数据源查询获得
                - Data source 选 prometheus
                - Query Type 选 Lable Values
                - Label 选 handler
                - Metric 选 prometheus_http_requests_total
                - 告诉 Grafana 从 prometheus_http_requests_total 中提取所有不同的 handler 标签值作为下拉选项
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412153052768.png,280,300)
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412153132293.png,400,150)
            - 在面板使用变量
                - 添加 Time Series 面板
                - 查询：rate(prometheus_http_requests_total{handler="$handler"}[5m])
                - Legend 填 {{code}}，Title 填 $handler 请求速率，变量在 title 中也能用
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412153254711.png,530,340)
            - 多选与全选
                - Dashboard Settings -> Variables -> handler 变量进行编辑
                - Selection options 部分，勾选 Multi-value，允许用户同时勾选多个 handler
                - 勾选 Include All option ，在下拉框增加 ALL 选项
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412153554336.png,350,190)
                - 修改面板查询为 rate(prometheus_http_requests_total{handler=~"$handler"}[5m])
                - Grafana 会将多选处理为正则表达式
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412153751767.png,430,350)
        - 内置变量
            - Grafana 提供了一些内置变量，不需要手动创建，可以直接在查询中使用
            - $__interval 和 $__rate_interval
                - 是最重要的内置变量
                - 会根据 Dashboard 的时间范围和面板宽度，自动计算一个合理的时间步长
                - $__rate_interval 的智能之处
                    - 当查看过去一小时的数据，可能是 1 分钟
                    - 查看过去 7 天的数据，可能是 15 分钟
                    - 无论时间范围怎么变，都能返回合理密度的数据点
                - $__rate_interval 和 $interval 的区别
                    - $__rate_interval 至少覆盖 4 个采样周期，更适合搭配 rate() 使用
                    - $__interval 纯根据面板像素密度计算步长
            - $__range
                - 表示当前 Dashboard 选择的完整时间范围，在 increase 中有用
                - increase(prometheus_http_requests_total{handler=~"$handler"}[$__range])
            - $__dashboard 和 $__name
                - $__dashboard 是当前 Dashboard 的名称，$__name 是面板的名称
                - 一般用在告警通知模板中，不常用在查询里
    - 用 Go 构建可观测 HTTP 服务
        - 编写带 Prometheus 指标的 Go 服务
            - 构建一个模拟的订单 API 服务，会暴露：请求计数 (Counter)、请求延迟 (Histogram)、当前处理中的请求数 (Gauge)。
        - 指标设计
            - myapp_http_requests_total(Counter)
                - 按 method、endpoint、status 三个维度记录请求总数
                - Counter 是因为请求数只增不减
                - 三个标签维度可以让你从不同角度分析：按接口看、按状态码看，按 HTTP 方法看
            - myapp_http_request_duration_seconds(Histogram)
                - 记录请求延迟分布
                - 用 Histogram 而不是 Summary，是因为要计算不同分位
            - myapp_http_requets_in_flight(Guage)
                - 当前正在处理的请求数
                - Guage 是由于这个值可增可减
            - myapp_orders_created_total(Counter)
                - 业务指标，按商品类型记录订单数
            - myapp_order_queue_size(Guage)
                - 模拟的业务指标，队列深度
        - 启动服务并验证
            - 启动服务
                - 
                ```bash
                docker-compose down
                docker-compose up -d --build
                ```
                - --build 参数会重新构建 myapp 镜像。首次构建需要下载 Go 依赖
            - 验证 myapp
                - 访问 http://localhost:8080/health，看到 {"status": "healthy"}
                - 访问 http://localhost:8080/metrics，看到自定义指标和 Go 运行时指标
            - 验证 prometheus 抓取
                - 访问 http://localhost:9090/targets，看到两个 target：prometheus 和 myapp，状态是 up
                - 查询 myapp_http_requests_total，确认有数据返回
        - 构建应用监控 Dashboard
            - 创建新 Dashboard "My GoApp-监控面板"
            - 创建变量
                - Settings -> Variables
                - 添加 endpoint 变量：
                    - Type -> Query，Data source -> Prometheus
                    - query type -> label values，Label -> myapp，metric->myapp_http_requests_total
                    - Multi-value 和 Include All option 勾选
            - 面板 1：应用状态
                - 查询 up{job="myapp"}
                - 类型 Stat，配置 Value mappings: 1->在线(绿色)，0->离线(红色)，Title->应用状态
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412170743853.png,250,140)
            - 面板 2：总 QPS (state + sparkline)
                -  查询：sum(rate(myapp_http_requests_total{endpoint=~"$endpoint"}[$__rate_interval]))
                - 类型选 Stat，Graph mode 设置为 Area，Unit 设置为 reqps，Title 填写 QPS
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412170957566.png,250,140)
            - 面板 3：错误率 (Stat)
                - 查询：
                ```
                sum(rate(myapp_http_requests_total{endpoint=~"$endpoint", status=~"4..|5.."}[$__rate_interval]))
                /
                sum(rate(myapp_http_requests_total{endpoint=~"$endpoint"}[$__rate_interval])) * 100
                ```
                - Unit 设为 "percent (0-100)"
                - Thresholds 设置：绿色为基础，5 以上黄色，10 以上红色。Title 填 "错误率"。
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412171243965.png,250,150)
            - 面板 4：请求速率按状态码（Time Series 堆叠）
                - 查询：sum by (status) (rate(myapp_http_requests_total{endpoint=~"$endpoint"}[$__rate_interval]))
                - Legend 填 {{status}}。Graph styles 中 Stack series 设为 "Normal"，Fill opacity 设为 40。
                - Overide: 添加 "Fields with name" 为 "200"，Override 属性选 "Color"，设为绿色。重复操作，给 "500" 设红色，"400" 设黄色，"201" 设浅绿色。
                - Title 填 "请求速率（按状态码）"
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412171817077.png,250,150)
            - 面板 5：请求延迟分位数 (Time Series)
                - 同时展示 P50,P90,P99 三条线
                - 查询 A: 
                    - Legend P50
                    - histogram_quantile(0.5, sum by (le) (rate(myapp_http_request_duration_seconds_bucket{endpoint=~"$endpoint"}[$__rate_interval])))
                - 查询 B: 
                    - Legend P90
                    - histogram_quantile(0.9, sum by (le) (rate(myapp_http_request_duration_seconds_bucket{endpoint=~"$endpoint"}[$__rate_interval])))
                - 查询 C
                    - Legent P99
                    - histogram_quantile(0.99, sum by (le) (rate(myapp_http_request_duration_seconds_bucket{endpoint=~"$endpoint"}[$__rate_interval])))
                - Unit: seconds，Title：请求延迟分位数
                - 通过 Overrides 给三条线设置不同的视觉效果：P50 绿色实线，P90 用黄色实线，P99 用红色实线
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/12/20260412225759292.png,310,150)

{{< /mind >}}

# 告警与日志

{{< mind height="860px" >}}
- 告警与日志
    - Grafana 的告警系统
        - 理解 Grafana 告警架构
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418104323716.png,618,330)
        - 配置 Contact Point
            - 左侧导航栏 Alerting -> Contact points -> Create contact points
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418104545088.png,277,414)
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418104623733.png,400,150)
            - Name 填学习用 Webhook，Integration 选 Webhook，URL 填 http://myapp:8080/health
            - 用 Go 应用的健康检查端点作为 Webhook 接收地址，不会真正处理报警，但能验证通知是否发出
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418104854183.png,400,250)
            - 内置了一个默认的 grafana-default-email Contact Point，生产环境会配置 Email、Slack、DingTalk、PagerDuty 等
        - 创建第一条告警规则（监控 Go 应用的错误率）
            - 创建告警规则
                - Alerting -> Alert Rules -> New alert rule
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418105203977.png,400,350)
            - 命名规则
                - Rule name 填入应用错误率过高
            - 定义查询和条件
                - 在 Define query and alert condition 部分，会看到一个查询编辑器
                - 查询 A: 选择数据源 Prometheus，切换到 Code 模式，输入
                    - sum(rate(myapp_http_requests_total{status=~"4..|5.."}[5m])) / sum(rate(myapp_http_requests_total[5m])) * 100
                    - 计算的是过去 5 分钟内的错误率百分比
                - 下方 Set Alert Condition，设置 WHERE QUERY IS ABOVE 5
                    - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418105855803.png,400,125)
                - 通过 preview alert rule condition 可以预览报警状态，如果已经满足条件，会显示为 firing
            - 配置评估行为
                - 在 Add foler and labels 下选择或创建一个文件夹 (学习告警)
                - Evaluation 创建一个新的，叫做默认评估组，评估间隔 1m，每分钟评估一次
                - Pending period 填写 2，这个参数很重要，表示条件必须持续满足 2 分钟后才会真正触发告警
                - 避免了短暂的尖峰导致的误报，告警会先进入 Pending 状态，2 分钟后才会变为 Firing
            - 添加标签和注释
                - 在 Add folder and labels 部分
                - 添加一个 Label: key 填 severity，value 填 warning。标签用于告警路由
                - Notification Policy 可以决定把报警发给谁
                - 在 Configure notification message 中：Summary 填应用错误率超过 5%
                - Description 填当前错误率为 {{$value.B.value}}，已超过 5% 的告警阈值
                - {{ $value.B.value }} 是模板变量，会在告警触发时被替换为实际的错误率数值。
        - 理解告警状态与查看告警
            - 在 Alerting -> Alert Rules 可以查看所有规则的状态
            - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418174616492.png,300,100)
            - 在 Dashboard 中添加一个 Alert list 面板，会展示当前活跃的所有告警
    - Loki 与日志监控
        - Loki 的设计哲学
            - 传统日志系统（ElasticSearch）会对日志内容做全文索引，每个词都被索引，搜索速度快但是存储和计算成本高
            - Loki 只索引日志的元数据标签，不索引日志内容本身，查询先通过标签快速定位到相关的日志流，再在这些流中做文本搜索
        - 部署 Loki 和 Promtail
            - Loki 是日志存储和查询引擎，Promtail 是日志采集代理，类似 Node Exporter 采集指标，Promtail 采集日志
            - 更新 docker-compose.yml
                - 在底部的 volumns 部分添加 loki_data:
            - 创建 Promtail 配置文件
                - 放在 grafana-learning/promtail 目录下
            - 理解 Promtail 配置
                - clients 指定了日志推送的目标地址 - Loki 的 api 端点
                - 和 Prometheus 的拉取模型不同，Loki 使用推送模型：Promtail 主动把采集到的日志推送给 Loki
                - scrape_configs 定义了日志采集源
                - 本次使用了 docker_sd_configs，通过 Docker Socket 自动发现所有运行中的容器并采集它们的标准输出日志
                - relabel_configs 对标签做转换
                - __meta_docker_container_name 是 Docker 自动提供的元数据，映射到 container 标签，就能按容器名筛选日志
            - 验证
                - 访问 http://localhost:3100/ready，返回 ready 说明 Loki 已启动
                - docker-compose logs promtail --tail 20
                - 能看到 Successfully connected to Loki 的日志
        - 在 Grafana 中添加 Loki 数据源
            - 在 Grafana 中点击 Connections -> Data sources -> Add data source，搜索 Loki
            - Connection URL 填写 http://loki:3100
        - 用 Explore 查看日志
            - 点击左侧 Explore，在顶部数据源下拉框中切换到 Loki
            - 第一次查询
                - Loki 查询语言是 LogQL，结构和 PromQL 非常相似
                - 最基本的查询是用花括号指定标签筛选：{container="myapp"}
                - 输入后点击 Run query
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418210037672.png,430,360)
            - 按容器筛选
                - {container="prometheus}
            - 查看所有容器的日志
                - {container=~".+"}
                - =~".+" 是正则匹配
        - LogQL 管道操作
            - 可以在标签筛选的基础上，用 ｜ 符号串联多个处理步骤
            - 文本过滤
                - 只看包含 error 的日志
                    - {container="myapp"} |= "error"
                - |= 表示包含，!= 表示不包含
                - {container="myapp"} != "health"
            - 正则过滤
                - {container="myapp"} |~ "status.*500"
                - |~ 是正则匹配，!~ 是反向正则过滤
            - 管道串联
                - 多个过滤条件可以串联，形成管道
                - {container="myapp"} |= "error" != "health"
                - 管道中的每一步都在上一步的结果基础上继续过滤
            - JSON 解析
                - 如果 Go 应用输出的是 JSON 格式的日志，可以用 | json 进行自动解析
                - {container="myapp"} | json
                - 解析后，json 中的每个字段都变成了可筛选的标签
                - {"level":"error"}
                - {container="myapp"} | json | level="error"
            - 行格式化
                - | line_format 可以重新格式化日志的显示方式
                - {container="myapp"} | line_format "{{.container}}: {{.__line__}}"
            - 从日志提取指标
                - Metrics from Logs 能让你不需要在代码埋点就能从日志中生成监控指标
                - 计算日志量速率
                    - rate({container="myapp"}[5m])
                - 按容器分组统计
                    - sum by (container) (rate({container=~".+"}[5m]))
                - count_over_time
                    - 计算时间窗口内的日志总行数
                    - count_over_time({container="myapp"} |= "error" [1h])
        - 在 Dashboard 中整合日志面板
            - 实时日志流
                - 右侧面板类型选择 Logs，数据源选 Loki
                - 查询: {container="myapp"} != "metrics"，排除 /metrics 端点的请求日志
                - 在右侧面板设置中，找到 Log details 区域，确保 Show time 和 Wrap lines 都开启
                - Tilte 填应用日志，这个面板会实时滚动 Go 应用的最新日志
                - ![](https://an-img.oss-cn-hangzhou.aliyuncs.com/2026/04/18/20260418220304056.png,260,150)
            - 错误日志速率 (Time Series 面板)
                - 新建 Time Series 类型，数据源选择 Loki
                - rate({container="myapp"} |= "error" [5m])
                - Title 填写错误日志速率，Unit 设置为 logs/sec
    - LogQL 进阶与指标日志联动
        - 更多日志解析器
            - logfmt 解析器
                - logfmt 是 Go 生态常见的日志格式，形如 level=info msg="request handled" method="GET"
                - 如果日志是这种键值对格式，可以用：{container="myapp"} | logfmt
                - 解析后每个键值对都变成可以筛选的标签
                - 当前 Go 应用用的是标准 log.Println 输出，不是 logfmt 格式
            - pattern 解析器
                - pattern 是最灵活的解析器，允许用模板来描述日志的结构，提取出其中的字段
                - 语法是使用 <field_name> 来做占位符
                - {container="myapp"} | pattern `<_> "<method> <path> <_>" <status> <_>`
                - 这条查询假设日志中包含类似 "GET /api/orders HTTP/1.1" 200 ... 的内容
                - 会把 HTTP 方法提取为 method，路径提取为 path，状态码提取为 status
                - <_> 是丢弃占位符，匹配但是不保存
            - regxp 解析器
                - {container="myapp"} | regexp `(?P<method>GET|POST|PUT|DELETE) (?P<path>/\S+)`
                - (?P<name>...) 是命名捕获组，提取的值会变成同名标签，正则解析器功能最强但是性能最差
        - 标签提取与 label_format
            - line_format 重新格式化日志显示
                - line_format 用 Go 模板语法重新定义每行日志的显示内容
                - {container=~"myapp|prometheus"} | line_format "[{{.container}}] {{.__line__}}"
                - 这会在每行日志前加上方括号包裹的容器名
            - line_format 转换标签
                - label_format 可以基于现有标签生成新标签或修改标签名
                - {container="myapp"} | label_format short_id="{{.container_id | trunc 12}}"
                - 这条查询把容器 ID 截取前 12 位，存为 short_id 标签，trunc 12 是 Go 模板的字符串截取函数
            - drop 和 keep 标签
                - 当解析器提取了太多标签导致查询杂乱，可以用 drop 丢弃不需要的标签，或用 keep 只保留需要的
                - {container="myapp"} | json | keep container, level, msg
{{< /mind >}}



# 附录

## 环境配置

docker-compose.yml

```yml
version: '3.8'

services:
  # Prometheus - 指标采集与存储
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  # Grafana - 可视化与仪表盘
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      # 默认管理员密码，首次登录后建议修改
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      # 允许匿名访问（学习环境，生产环境不要这样做）
      - GF_AUTH_ANONYMOUS_ENABLED=false
      # 设置时区
      - GF_DEFAULT_TIMEZONE=Asia/Singapore
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

prometheus.yml

```yml
# Prometheus 配置文件
# 学习环境配置 - Day 2

global:
  # 每 15 秒抓取一次指标（默认值）
  scrape_interval: 15s
  # 每 15 秒评估一次告警规则
  evaluation_interval: 15s

# 抓取配置
scrape_configs:
  # 抓取 Prometheus 自身的指标
  # Prometheus 会在 /metrics 端点暴露自己的运行指标
  - job_name: 'prometheus'
    static_configs:
      - targets: ['prometheus:9090']
```

## 用 Go 构建可观测的 HTTP 服务

main.go

```go
package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// 第一步定义指标

// Counter - 记录请求总数，按 method、endpoint、status 分维度
var httpRequestsTotal = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "myapp_http_requests_total",
		Help: "Total number of HTTP requests",
	},
	[]string{"method", "endpoint", "status"},
)

// Histogram - 记录请求延迟分布
// Buckets 定义了延迟区间：10ms,20ms,50ms,100ms,250ms,500ms,1s,2.5s
var httpRequestDuration = prometheus.NewHistogramVec(
	prometheus.HistogramOpts{
		Name:    "myapp_http_request_duration_seconds",
		Help:    "HTTP request duration in seconds",
		Buckets: []float64{0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2.5}, // 10ms to ~2.5s
	},
	[]string{"method", "endpoint"},
)

// Gauge - 记录当前正在处理的请求数
var httpRequestsInFlight = prometheus.NewGauge(
	prometheus.GaugeOpts{
		Name: "myapp_http_requests_in_flight",
		Help: "Number of HTTP requests currently being processed",
	},
)

// Counter 模拟业务指标：订单创建数量
var ordersCreatedTotal = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "myapp_orders_created_total",
		Help: "Total number of orders created",
	},
	[]string{"product_type"},
)

// Guage 模拟业务指标：订单队列深度
var orderQueueSize = prometheus.NewGauge(
	prometheus.GaugeOpts{
		Name: "myapp_order_queue_depth",
		Help: "Current number of orders in the processing queue",
	},
)

// 第二步：注册指标

func init() {
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
	prometheus.MustRegister(httpRequestsInFlight)
	prometheus.MustRegister(ordersCreatedTotal)
	prometheus.MustRegister(orderQueueSize)
}

// 第三步：编写业务逻辑（带指标埋点）
// instrumentHandler 是一个中间件，自动为 Handler 添加指标采集
func instrumentHandler(endpoint string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 进入请求: in_flight + 1
		httpRequestsInFlight.Inc()
		defer httpRequestsInFlight.Dec() // 请求结束: in_flight - 1

		// 记录开始时间
		start := time.Now()
		// 调用实际的 handler
		next(w, r)
		// 计算耗时并记录
		duration := time.Since(start).Seconds()
		httpRequestDuration.WithLabelValues(r.Method, endpoint).Observe(duration)
	}
}

// handleGetOrders 获取订单列表
func handleGetOrders(w http.ResponseWriter, r *http.Request) {
	delay := time.Duration(20+rand.Intn(180)) * time.Millisecond // 模拟20-200ms的处理时间
	time.Sleep(delay)
	// 90% 请求成功，10% 返回 500 错误
	if rand.Float64() < 0.1 {
		httpRequestsTotal.WithLabelValues(r.Method, "/api/orders", "500").Inc()
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"error": "database timeout"}`)
		return
	}

	httpRequestsTotal.WithLabelValues(r.Method, "/api/orders", "200").Inc()
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"orders": [{"id": 1, "product": "Laptop"}, {"id": 2, "product": "Phone"}]}`)
}

// handleCreateOrder 创建订单
func handleCreateOrder(w http.ResponseWriter, r *http.Request) {
	delay := time.Duration(50+rand.Intn(450)) * time.Millisecond // 模拟50-500ms的处理时间
	time.Sleep(delay)

	// 随机选择商品类型
	products := []string{"electronics", "clothing", "books", "food"}
	product := products[rand.Intn(len(products))]

	// 95% 成功，5% 失败
	if rand.Float64() < 0.05 {
		httpRequestsTotal.WithLabelValues(r.Method, "/api/orders", "400").Inc()
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"error": "invalid order data"}`)
		return
	}

	// 记录业务指标
	ordersCreatedTotal.WithLabelValues(product).Inc()
	httpRequestsTotal.WithLabelValues(r.Method, "/api/orders", "201").Inc()

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"order_id": %d, "product_type": "%s", "status": "created"}`, rand.Intn(10000), product)
}

// handleHealth —— 健康检查端点
func handleHealth(w http.ResponseWriter, r *http.Request) {
	httpRequestsTotal.WithLabelValues(r.Method, "/health", "200").Inc()
	fmt.Fprint(w, `{"status": "healthy"}`)
}

// 第四步：模拟背景流量
func simulateTraffic() {
	client := &http.Client{Timeout: 5 * time.Second}
	endpoints := []struct {
		method string
		url    string
	}{
		{"GET", "http://localhost:8080/api/orders"},
		{"GET", "http://localhost:8080/api/orders"},
		{"GET", "http://localhost:8080/api/orders"},
		{"POST", "http://localhost:8080/api/orders"},
		{"GET", "http://localhost:8080/health"},
	}

	// 等待服务启动
	time.Sleep(2 * time.Second)
	log.Println("Starting traffic simulation...")

	for {
		// 随机选择一个端点
		ep := endpoints[rand.Intn(len(endpoints))]

		req, _ := http.NewRequest(ep.method, ep.url, nil)
		client.Do(req) //nolint:errcheck

		// 模拟队列深度波动
		orderQueueSize.Set(float64(rand.Intn(50)))

		// 请求间隔：200ms ~ 2s
		time.Sleep(time.Duration(200+rand.Intn(1800)) * time.Millisecond)
	}
}

// 第五步：启动服务
func main() {
	// 注册业务路由
	http.HandleFunc("/api/orders", func(w http.ResponseWriter, r *http.Request) {
		handler := instrumentHandler("/api/orders", func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case "GET":
				handleGetOrders(w, r)
			case "POST":
				handleCreateOrder(w, r)
			default:
				httpRequestsTotal.WithLabelValues(r.Method, "/api/orders", "405").Inc()
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		})
		handler(w, r)
	})

	http.HandleFunc("/health", instrumentHandler("/health", handleHealth))

	// 暴露 /metrics 端点给 Prometheus 抓取
	http.Handle("/metrics", promhttp.Handler())

	// 启动模拟流量（后台 goroutine）
	go simulateTraffic()

	log.Println("Server starting on :8080")
	log.Println("Metrics available at :8080/metrics")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

```
grafana-learning/
├── docker-compose.yml          (已更新)
├── prometheus/
│   └── prometheus.yml          (已更新)
└── myapp/
    ├── main.go
    ├── go.mod
    └── Dockerfile
```

Dockerfile

```Dockerfile
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /myapp main.go

FROM alpine:3.19
COPY --from=builder /myapp /myapp
EXPOSE 8080
CMD ["/myapp"]
```

Prometheus.yml

```yml
# Prometheus 配置文件
# 学习环境配置 - Day 9 更新

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # 抓取 Prometheus 自身的指标
  - job_name: 'prometheus'
    static_configs:
      - targets: ['prometheus:9090']

  # 抓取你的 Go 应用的指标
  - job_name: 'myapp'
    static_configs:
      - targets: ['myapp:8080']
```


Docker-compose.yml

```yml
version: '3.8'

services:
  # 你的 Go 应用服务
  myapp:
    build: ./myapp
    container_name: myapp
    ports:
      - "8080:8080"
    restart: unless-stopped

  # Prometheus - 指标采集与存储
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  # Grafana - 可视化与仪表盘
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      # 默认管理员密码，首次登录后建议修改
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      # 允许匿名访问（学习环境，生产环境不要这样做）
      - GF_AUTH_ANONYMOUS_ENABLED=false
      # 设置时区
      - GF_DEFAULT_TIMEZONE=Asia/Singapore
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

## Loki 与日志监控

docker-compose.yml 在 node-exporter 服务后添加 Loki 和 Promtail

```yml
# Loki - 日志存储与查询
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki_data:/loki
    restart: unless-stopped

  # Promtail - 日志采集代理
  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
      - ./promtail/promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    restart: unless-stopped
```

promtail-config.yml

```yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # 采集 Docker 容器日志
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      # 用容器名作为标签
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      # 用容器 ID 作为标签
      - source_labels: ['__meta_docker_container_id']
        target_label: 'container_id'
```