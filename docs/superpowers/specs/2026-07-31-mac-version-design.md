# macOS 版本设计文档

> 日期：2026-07-31

## Context（为什么做）

项目已具备 Windows x64 绿色便携版（Electron，`main.js` + `package.json`）。用户希望**先在本机（macOS）体验桌面版**，满意后再发布 Windows 版本。因此需要：

1. 打包出可在本机双击打开的 macOS 应用（dmg）；
2. mac 版与 Windows 版共用同一套页面代码（index.html / css / js / data / images）和同一份 Electron 主进程；
3. mac 版数据编辑体验与 Windows 一致（改外置 `data/jobs.json` 即生效）。

## 已确认的决策

| 决策点 | 选择 |
|---|---|
| mac 数据目录 | **app 同目录的 `data/`**（可写则用，不可写回退内置只读） |
| 是否初始化 git | **是**（已初始化 + 初始提交 + `feature/mac-version` 分支） |

## 架构

沿用现有 Electron 壳，两处修改 + 构建：

### 1. `package.json` — 增加 mac 构建配置

- `scripts.dist:mac` = `electron-builder --mac`
- `build.mac`：target `dmg`、icon `build/icon.png`（electron-builder 自动转 icns）、`identity: null`（本机未签名构建，跳过签名）
- `build.dmg.artifactName`：`${productName}-${version}-${arch}.${ext}`

### 2. `main.js` — 通用化外置数据目录解析

把原来"仅 Windows 便携版"的数据目录逻辑扩展为三态：

| 运行形态 | 外置数据目录 |
|---|---|
| Windows 便携版（`PORTABLE_EXECUTABLE_DIR` 存在） | `<exe 所在目录>/data`（现状不变） |
| macOS 打包版（`process.platform === 'darwin' && app.isPackaged`） | **app 同目录的 `data/`**（即包含 `.app` 的文件夹下的 `data/`） |
| 开发模式（`electron .`） | 无外置目录 → 直接用项目内 `data/`（现状不变） |

启动时：
- 计算候选外置目录 → `mkdir recursive` + 写入探针验证可写；
- **可写**：设为外置数据目录；若其中缺 `jobs.json`，把内置 `data/`、`images/` 下**所有文件**自动复制过去（首次运行）；
- **不可写**（如 app 在 `/Applications`）：外置目录置空 → 只读内置数据。

`app://` 协议处理器保持"外置优先，内置兜底"逻辑不变（只读判断用解析后的外置目录）。

### 3. 验证

- 冒烟测试（`SMOKE_TEST=1`）在**打包后的 .app** 上运行（非 dev 模式），验证数据加载/搜索/弹窗/图片；
- 验证 app 同目录外置数据优先（外部 `data/jobs.json` 改内容 → 界面随之变化）；
- 验证 `npm run dist:mac` 产出 dmg。

## 非目标（YAGNI）

- 不做 mac 版数据内置编辑器；
- 不做 mac 应用签名/公证（内部预览用，未签名即可）；
- 不改页面代码（index.html / css / js / app.js / images）。
