# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

**招聘信息聚合网站** — 人工整理的招聘信息集中展示页。支持搜索高亮、多选筛选、内推码一键复制、详情抽屉等。

## Development

**不需要构建工具**，这是一个纯静态页面，直接在浏览器中打开 `index.html` 即可。

- `index.html` — 主页面
- `css/style.css` — 样式（BOSS 直聘风格：青绿主题、双栏布局）
- `js/app.js` — 交互逻辑（搜索、筛选、排序、复制、详情抽屉）
- `data/jobs.json` — 招聘数据（核心文件，直接编辑此文件添加/修改招聘信息）

## How to Add a Job

1. 打开 `data/jobs.json`
2. 在数组末尾添加一个新对象，参考已有格式：
   - `id` — 唯一数字 ID，依次递增
   - `company` — 公司名称
   - `title` — 招聘标题
   - `positions` — 岗位列表（数组）
   - `locations` — 办公地点列表（数组）
   - `has_hc` — 是否有 HC（布尔值）
   - `hc_detail` — HC 详情描述
   - `referral_code` — 内推码
   - `referral_url` — 内推链接
   - `description` — 招聘文案全文
   - `target` — 目标人群（如 "2027届在校生"）
   - `type` — 类型（如 "实习"、"校招"、"社招"）
   - `tags` — 标签列表
   - `post_date` — 发布日期
   - `salary` — 薪资（可选，如 `"面议"`、`"200-300元/天"`、`"12-18万/年"`；留空或缺失则不显示薪资行）
   - `education` — 学历要求（可选，如 `"本科及以上"`、`"不限"`；留空或缺失则详情不显示该行）
   - `experience` — 经验要求（可选，如 `"在校/应届"`、`"经验不限"`；留空或缺失则详情不显示该行）
   - `qr_code` — 二维码图片路径（如 `"images/anker-qr.jpg"`，没有则留空字符串）
   - `extra_links` — 附加链接列表（数组，每项含 `label` 和 `url`，没有则 `[]`）

3. 在浏览器刷新页面即可看到新信息

## Project Structure

```
2606_招聘信息网站/
├── index.html          # 主页面
├── css/style.css       # 样式表（响应式设计）
├── js/app.js           # 前端交互（搜索/筛选/弹窗/复制）
├── data/jobs.json      # 招聘数据（JSON）
├── main.js             # Electron 桌面版主进程（app:// 协议、外置数据、外链）
├── package.json        # 桌面版依赖与构建配置
├── build/icon.svg/png  # 应用图标
└── AGENTS.md           # 本文件
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

- **关键词搜索 + 高亮** — 实时搜索公司、职位、描述等，命中词在卡片中高亮
- **多选筛选侧栏** — 工作地点 / 招聘类型 / HC 状态 / 标签，组内多选（OR）、组间叠加（AND）
- **顶部统计 + 城市条** — 显示岗位数/公司数，点击城市条快捷筛选
- **排序** — 默认排序 / 最新发布（按 post_date）
- **卡片快捷投递** — 卡片直接显示内推码复制按钮与投递链接
- **内推码一键复制** — 点击复制，显示"已复制"反馈
- **详情抽屉** — 右侧滑入（移动端全屏），含薪资/学历/经验、二维码放大
- **响应式设计** — 桌面双栏布局，移动端筛选收为底部抽屉
