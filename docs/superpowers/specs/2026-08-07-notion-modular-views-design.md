# 多视图模块化设计文档

> 日期：2026-08-07
> 状态：已自检，待用户审核
> 方案：Web Component 组件化

## 目标

将招聘信息网站从单一卡片列表升级为 Notion 风格的多视图系统。每个岗位数据作为"块"（Block），用户可在 4 种视图之间自由切换，看板视图支持按不同字段分组。

## 视图类型

### 1. Board View（看板视图）

- 按选定字段分列展示：每列一个分组值，列内垂直堆叠卡片
- 可切换分组字段：公司 / 招聘类型 / 工作城市 / HC 状态
- 列可横向滚动，列内可垂直滚动
- 卡片内容精简：公司头像 + 标题 + 关键 tag + HC 徽章
- 空分组不显示列

### 2. Table View（表格视图）

- 每行一个岗位，列为结构化字段（公司、标题、类型、城市、HC、日期）
- 固定表头，内容区滚动
- 列可点击排序（公司名称字母序、日期、类型）
- 行点击打开详情抽屉
- v1 不做列宽拖拽

### 3. Timeline View（时间线视图）

- 水平时间轴，月份为刻度
- 每个岗位是一个节点，悬停显示摘要卡片，点击打开详情
- 同月节点垂直堆叠避免重叠
- 节点颜色按招聘类型区分

### 4. Compact List View（紧凑列表，替代当前卡片）

- 每行一个岗位，信息密度高（~48px 行高）
- 行内直接显示复制内推码按钮和投递链接
- 保留搜索高亮
- 比当前卡片视图节省约 60% 空间

## 架构设计

### 方案选型：Web Component 组件化

每种视图封装为一个 Custom Element，通过属性切换，通过 `update(data)` 方法接收新数据。

### 文件结构

```
2606_招聘信息网站/
├── index.html                    # 主页面（增加视图切换器 UI、viewContainer 容器）
├── css/
│   └── style.css                 # 新增视图相关样式（board/table/timeline/compact）
├── js/
│   ├── app.js                    # 主控制器（状态管理 + 视图调度 + 事件绑定）
│   ├── views/
│   │   ├── board-view.js         # <board-view> 组件
│   │   ├── table-view.js         # <table-view> 组件
│   │   ├── timeline-view.js      # <timeline-view> 组件
│   │   └── compact-list-view.js  # <compact-list-view> 组件
│   ├── job-block.js              # 岗位块渲染工具（生成精简卡片 HTML、紧凑行 HTML、表格行 HTML）
│   └── utils.js                  # 提取共享工具函数（highlight, escHtml, companyAvatar 等）
├── data/jobs.json                # 不变
├── main.js                       # Electron 主进程（不变）
├── package.json                  # 不变
└── build/                        # 不变
```

### 数据流

```
jobs.json
  ↓ fetch
state.jobs (原始数据)
  ↓ filterByState()              # 现有逻辑不变
filtered list
  ↓ sortJobs()                   # 现有逻辑不变
sorted list
  ↓ dispatch to view             # 新增：根据 state.viewMode 分发
  ├→ <board-view>.update({ jobs, groupBy, keyword })
  ├→ <table-view>.update({ jobs, keyword })
  ├→ <timeline-view>.update({ jobs, keyword })
  └→ <compact-list-view>.update({ jobs, keyword })
```

### State 扩展

```js
const state = {
  // 现有字段保持不变
  jobs: [],
  keyword: '',
  filters: { type: new Set(), hc: new Set(), location: new Set(), tag: new Set() },
  sort: 'default',
  selectedJobId: null,
  // 新增字段
  viewMode: 'compact',   // 'board' | 'table' | 'timeline' | 'compact'
  groupBy: 'company',    // 看板分组字段：'company' | 'type' | 'location' | 'hc'
};
```

### 事件通信

各视图组件通过 `CustomEvent` 与 `app.js` 通信：

- `job-select`：用户点击岗位 → `app.js` 调用 `openDetail(jobId)`
- `job-copy`：用户点击复制内推码 → `app.js` 调用 `copyText()`
- `sort-change`：表格视图列头排序 → `<table-view>` 内部自行排序并重新渲染（不触发全局 `state.sort` 变更）

`app.js` 通过调用视图组件的 `update()` 方法推送数据。

## 视图切换器 UI

位于顶部工具栏（排序控件旁边），包含：

- 4 个图标按钮（SVG 内联，不引入图标库），当前激活视图高亮
- 看板视图激活时，旁边额外出现"分组"下拉选择器
- 移动端：只显示图标，隐藏文字标签
- 用户选择的视图模式和分组字段通过 localStorage 持久化

## 响应式策略

### 桌面 (>1024px)

所有视图正常展示，看板列横向滚动，表格固定表头。

### 平板 (768-1024px)

- 看板：列宽缩小
- 表格：隐藏次要列（保留公司、标题、类型、HC）
- 时间线：节点缩小

### 手机 (<768px)

- 看板：单列显示，左右滑动切换分组
- 表格：转为卡片式列表（每行变成小卡片）
- 时间线：转为垂直时间线
- 紧凑列表：保持一行式，字号缩小

## 边界情况

- **空分组**：看板某分组下无岗位时不显示该列；表格/列表为空时复用现有空态提示
- **数据加载失败**：复用现有错误提示
- **视图切换**：切换后滚动位置回到顶部
- **localStorage**：记忆 `viewMode` 和 `groupBy`，下次打开自动恢复
- **详情抽屉**：所有视图共享同一个详情抽屉，点击岗位触发 `openDetail()`
- **搜索高亮**：所有视图复用 `highlight()` 函数，保持一致

## 与现有功能的兼容性

- **筛选侧栏**：不变，所有视图共享同一套筛选逻辑
- **城市条**：不变，筛选结果同步更新到当前视图
- **排序**：现有排序控件在看板/时间线/紧凑列表视图下保留；表格视图下隐藏全局排序控件，改用列头点击排序（升序/降序/取消），排序状态仅在表格视图内生效，不写入 `state.sort`
- **统计条**：不变，显示当前过滤结果的岗位数/公司数
- **详情抽屉**：不变，所有视图触发同一个抽屉
- **Electron 桌面版**：Custom Elements 为浏览器原生 API，Electron 完全支持

## 实施范围

### Phase 1（本次实施）

1. 提取共享工具函数到 `utils.js`
2. 创建 `job-block.js` 共享渲染逻辑
3. 实现 `<compact-list-view>` 替代当前卡片列表
4. 实现 `<board-view>` + 分组切换
5. 实现 `<table-view>`
6. 实现 `<timeline-view>`
7. 实现视图切换器 UI
8. 响应式适配
9. localStorage 持久化

### Phase 2（后续可选）

- 表格列宽拖拽
- 看板卡片拖拽排序
- 视图状态 URL 参数化（分享特定视图链接）
