# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

**招聘信息聚合网站** — 人工整理的招聘信息集中展示页。支持搜索高亮、多选筛选、内推码一键复制、详情抽屉、多视图切换（紧凑列表/看板/表格/时间线）等。

## Development

**不需要构建工具**，这是一个纯静态页面，直接在浏览器中打开 `index.html` 即可。

- `index.html` — 主页面
- `css/style.css` — 样式（BOSS 直聘风格：青绿主题、双栏布局）
- `js/app.js` — 主控制器（状态管理、视图调度、筛选、排序、详情抽屉）
- `js/utils.js` — 共享工具函数
- `js/job-block.js` — 岗位块 HTML 生成（紧凑行、看板卡片、表格行、时间线节点）
- `js/views/` — 四种视图 Custom Element 组件
- `data/jobs.json` — 招聘数据（核心文件，直接编辑此文件添加/修改招聘信息）

## How to Add a Job

1. 打开 `data/jobs.json`
2. 在数组末尾添加一个新对象，参考已有格式：
   - `id` — 唯一数字 ID，依次递增
   - `company` — 公司名称
   - `title` — 招聘标题
   - `positions` — 岗位分类列表（数组，**必须使用标准名称**，见下方命名规范）
   - `locations` — 办公地点列表（数组）
   - `has_hc` — 是否有 HC（布尔值）
   - `hc_detail` — HC 详情描述
   - `referral_code` — 内推码
   - `referral_url` — 内推链接
   - `description` — 招聘文案全文
   - `target` — 目标人群（如 "2027届在校生"）
   - `type` — 招聘类型（如 "实习"、"校招"、"社招"）
   - `industry` — 行业标签（数组，**必须使用标准名称**，见下方命名规范）
   - `tags` — 标签列表
   - `post_date` — 发布日期
   - `salary` — 薪资（可选，如 `"面议"`、`"200-300元/天"`、`"12-18万/年"`；留空或缺失则不显示薪资行）
   - `education` — 学历要求（可选，如 `"本科及以上"`、`"不限"`；留空或缺失则详情不显示该行）
   - `experience` — 经验要求（可选，如 `"在校/应届"`、`"经验不限"`；留空或缺失则详情不显示该行）
   - `qr_code` — 二维码图片路径（如 `"images/anker-qr.jpg"`，没有则留空字符串）
   - `extra_links` — 附加链接列表（数组，每项含 `label` 和 `url`，没有则 `[]`）

3. 如需显示公司 logo，在 `images/logos/` 放一张 PNG 图片，并在 `js/utils.js` 的 `COMPANY_LOGOS` 中添加公司名 → 图片路径映射
4. 在浏览器刷新页面即可看到新信息

### 岗位分类（positions）命名规范

岗位分类用于筛选和看板分组，**必须使用标准化的岗位名称**，禁止口语化、营销化描述。

**规则：**
- 使用 2-4 字的标准职能名称，不加"类"、"方向"等后缀
- 不使用营销文案中的口语化说法（如"八大职业群"、"海量岗位"）
- 不使用招聘类型冒充岗位（如"暑期实习生"不是岗位分类）
- 优先从招聘描述中提取实际职能方向

**标准岗位名称参考：**

| 大类 | 标准名称 |
|------|---------|
| 技术 | 技术、算法、研发、前端、后端、测试、数据、嵌入式、人工智能 |
| 产品 | 产品、用户体验、交互设计 |
| 设计 | 美术、设计、视觉 |
| 商业 | 营销、市场、销售、运营、商务、战略 |
| 职能 | 财务、人力资源、法务、行政、项目管理 |
| 供应链 | 供应链、采购、物流、质量、品质、生产 |
| 工程 | 工程、硬件、硬件研发、声学 |
| 金融 | 金融销售、投资顾问、客户服务 |
| 零售 | 门店运营、选址开发、商品管理、新零售 |
| 其他 | 策划、服务、客服 |

若现有分类不够用，可新增标准名称，但需保持风格一致（2-4 字、无后缀、职能导向）。

### 行业（industry）命名规范

行业标签用于筛选和看板分组，每家公司标注 1-3 个行业标签。

**规则：**
- 使用简短的行业名称（2-4 字）
- 优先使用已有的行业标签，保持一致性
- 不使用过于宽泛的标签（如"科技"、"企业"）

**已有行业标签：** 游戏、互联网、消费电子、智能硬件、家电、制造业、音频、医药、零售、机器人、新能源、电池、食品、金融、证券、能源、电力、央企

## Project Structure

```
2606_招聘信息网站/
├── index.html                # 主页面
├── css/style.css             # 样式表（响应式设计）
├── js/
│   ├── app.js                # 主控制器（状态管理 + 视图调度 + 事件绑定）
│   ├── utils.js              # 共享工具函数（escHtml, highlight, companyAvatar 等）
│   ├── job-block.js          # 岗位块渲染（各视图共享的 HTML 生成函数）
│   └── views/
│       ├── compact-list-view.js   # 紧凑列表视图组件
│       ├── board-view.js          # 看板视图组件
│       ├── table-view.js          # 表格视图组件
│       └── timeline-view.js       # 时间线视图组件
├── data/jobs.json            # 招聘数据（JSON）
├── images/logos/             # 公司 logo（PNG，本地存储）
├── main.js                   # Electron 桌面版主进程（app:// 协议、外置数据、外链）
├── package.json              # 桌面版依赖与构建配置
├── build/icon.svg/png        # 应用图标
└── AGENTS.md                 # 本文件
```

## Desktop App (Electron / Windows 便携版 + macOS)

本项目同时是一个 Electron 桌面应用，可打包为 Windows x64 绿色便携版（单个 exe）。

- **运行调试（本机 macOS）**：`npm install` 后执行 `npm start`，用 Electron 窗口加载同一套页面。
- **打包 Windows 便携版**：`npm run dist:win`，产物在 `dist/` 下（`招聘信息聚合-<版本>-portable.exe`，单文件）。
- **打包 macOS 应用**：`npm run dist:mac`，产物在 `dist/` 下（`招聘信息聚合-<版本>-<架构>.dmg`）。
- **mac 版数据目录**：从 `.app` 同目录的 `data/` 读取（首次运行自动生成）；app 放在不可写位置（如 `/Applications`）时自动回退内置只读数据。
- **mac 版验证**：`SMOKE_TEST=1 "<解包后 .app>/Contents/MacOS/招聘信息聚合"` 可对打包应用跑冒烟测试。
- **数据更新方式（桌面版）**：软件从 exe 旁边的 `data/jobs.json` 读取数据；首次运行会自动在 exe 旁生成一份 `data/`。**以后更新招聘信息直接改 exe 旁的 `data/jobs.json`，无需重新打包。**
- **数据字段变更注意**：若 `data/jobs.json` 的**字段结构**变化（如新增 `salary` 字段），已部署的 exe/dmg 旁的外部 `data/jobs.json` 是旧结构、**不会自动更新**（只在文件缺失时重新生成）。此时需删除外部 `data/jobs.json`（或整个 `data/` 目录）后重新运行，让其按新结构重新生成。
- **国内网络提示**：构建需从 GitHub 下载 Windows 版 Electron（约 110MB）。若下载慢可先设置镜像再构建：
  ```bash
  export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
  export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
  ```
- 页面代码（index.html / css / js / data / images）网站与桌面版共用，**修改页面不影响桌面版**，重新打包即可生效。

## Features

- **多视图切换** — 4 种视图自由切换：紧凑列表（默认）、看板（按公司/类型/行业/岗位分类分组）、表格（可列头排序）、时间线（按月份）
- **看板分组** — 看板视图支持切换分组字段（公司/招聘类型/行业/岗位分类）
- **视图状态持久化** — 用户选择的视图模式和分组字段通过 localStorage 记忆
- **关键词搜索 + 高亮** — 实时搜索公司、职位、描述等，命中词在所有视图中高亮
- **多选筛选侧栏** — 招聘类型 / 行业 / 岗位分类，组内多选（OR）、组间叠加（AND）
- **顶部统计 + 城市条** — 显示岗位数/公司数，点击城市条快捷筛选
- **排序** — 默认排序 / 最新发布（按 post_date）
- **卡片快捷投递** — 卡片直接显示内推码复制按钮与投递链接
- **内推码一键复制** — 点击复制，显示"已复制"反馈
- **详情抽屉** — 右侧滑入（移动端全屏），含薪资/学历/经验、二维码放大
- **响应式设计** — 桌面双栏布局，移动端筛选收为底部抽屉；各视图独立适配

## View System Architecture

视图系统基于 Web Components（Custom Elements），使用 light DOM（非 Shadow DOM）。

- **状态驱动**：`app.js` 中 `state.viewMode` 控制当前视图，`state.groupBy` 控制看板分组字段
- **组件接口**：每个视图组件必须实现 `connectedCallback()` 和 `update({ jobs, keyword, groupBy })` 方法
- **事件委托**：点击岗位打开详情、复制内推码等交互由 `app.js` 在 `viewContainer` 上统一委托处理，视图组件自身不绑定点击事件
- **标签名映射**：`VIEW_TAGS` 对象将 `viewMode` 映射到 Custom Element 标签名（如 `compact` → `compact-list-view`）
- **共享渲染**：`job-block.js` 中的 `JobBlock` 对象提供各视图共享的 HTML 生成函数

添加新视图的步骤：
1. 在 `js/views/` 创建新组件文件，注册 Custom Element
2. 在 `js/app.js` 的 `VIEW_TAGS` 中添加映射
3. 在 `index.html` 的 `viewSwitcher` 中添加按钮
4. 在 `css/style.css` 中添加样式
