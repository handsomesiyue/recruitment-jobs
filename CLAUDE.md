# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**招聘信息聚合网站** — 人工整理的招聘信息集中展示页。支持搜索、筛选、内推码一键复制、查看详情等。

## Development

**不需要构建工具**，这是一个纯静态页面，直接在浏览器中打开 `index.html` 即可。

- `index.html` — 主页面
- `css/style.css` — 样式
- `js/app.js` — 交互逻辑（搜索、筛选、弹窗、复制）
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
└── CLAUDE.md           # 本文件
```

## Features

- **关键词搜索** — 搜索公司、职位、描述等
- **按地点筛选** — 按办公地点过滤
- **按类型筛选** — 实习/校招/社招
- **按 HC 状态筛选** — 有 HC / 未知
- **内推码一键复制** — 点击内推码即可复制
- **内推链接跳转** — 点击直达投递页面
- **响应式设计** — 桌面端和移动端均可使用
