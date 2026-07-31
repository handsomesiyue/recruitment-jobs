# macOS 版本 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为项目打包出可在本机双击打开的 macOS 应用（dmg），并让 mac 版数据从 app 同目录 `data/` 读取（可写则用，不可写回退内置），与 Windows 版共用同一份页面与主进程代码。

**Architecture:** 复用现有 Electron 壳。`package.json` 增加 mac 构建配置（dmg 目标、`identity: null` 免签名）；`main.js` 把"外置数据目录解析"从仅 Windows 通用化为三态（Windows 便携版 / macOS 打包版 / 开发模式），并扩展首次运行种子复制为"复制内置 data/ 与 images/ 全部文件"。

**Tech Stack:** Electron ^43.2.0、electron-builder ^26.15.3、Node 26。

## Global Constraints

- **不得修改页面代码**：`index.html`、`css/style.css`、`js/app.js`、`data/`、`images/` 一律不动（网站与 Windows 桌面版共用）。
- `productName` 保持 `"招聘信息聚合"`；`appId` 保持 `com.local.zhaopin2401`；`name` 保持 `zhaopin-2401`。
- `electron` 保持 `^43.2.0`、`electron-builder` 保持 `^26.15.3`。
- `scripts.dist:win` 保持 `electron-builder --win` 不变；Windows 便携版行为（`PORTABLE_EXECUTABLE_DIR/data` 外置优先 + 种子复制）不得回归。
- 构建可用镜像加速：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`、`ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/`。
- 冒烟测试钩子：`SMOKE_TEST=1` 时主进程自动执行页面检查并打印 `SMOKE_RESULT {...}` 后退出（已存在，不得破坏）。

---

### Task 1: package.json — mac 构建配置

**Files:**
- Modify: `package.json`（scripts 与 build 字段）

**Interfaces:**
- Consumes: 无。
- Produces: `scripts.dist:mac`（`electron-builder --mac`）与 `build.mac` / `build.dmg` 配置，供 Task 3 构建使用。

- [ ] **Step 1: 在 `scripts` 中新增 mac 构建脚本**

在 `"dist:win": "electron-builder --win"` 后新增一行：

```json
    "dist:win": "electron-builder --win",
    "dist:mac": "electron-builder --mac"
```

- [ ] **Step 2: 在 `build` 中新增 `mac` 与 `dmg` 配置**

在现有 `"win": {...}` 块之后追加：

```json
    "mac": {
      "target": ["dmg"],
      "icon": "build/icon.png",
      "identity": null,
      "category": "public.app-category.utilities"
    },
    "dmg": {
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    }
```

`identity: null` 表示跳过代码签名（本机预览用，未签名）。`build/icon.png` 由 electron-builder 自动转为 icns。

- [ ] **Step 3: 验证 mac 解包构建成功（本任务的测试）**

```bash
npx electron-builder --mac --dir
```

预期：构建成功，产出 `dist/mac-arm64/招聘信息聚合.app`（Apple Silicon 本机；若本机是 Intel 则为 `dist/mac/`）。用 `ls dist/mac*/*.app` 确认存在。

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat(mac): 增加 electron-builder mac/dmg 构建配置"
```

---

### Task 2: main.js — 通用化外置数据目录（支持 mac）

**Files:**
- Modify: `main.js`

**Interfaces:**
- Consumes: 现有 `SMOKE_TEST` 冒烟测试钩子、现有 `app://` 协议处理器 `serve()`。
- Produces: 模块级 `let externalDataDir`（whenReady 时解析），`serve()` 依赖它做外置优先。

**背景说明（mac 打包版路径）：** 打包后 `process.execPath` = `<bundle>/Contents/MacOS/<可执行文件>`；"app 同目录" = 包含 `.app` 的文件夹，即 `bundleDir` 的父目录，数据目录 = 其下 `data/`。

- [ ] **Step 1: 把模块级常量改为动态解析**

把现有（位于 `registerSchemesAsPrivileged` 之后）：

```js
// 外置数据目录：便携版运行时优先取 exe 所在目录下的 data/，
// 否则（开发模式）回退到项目内的 data/。
const externalDir = process.env.PORTABLE_EXECUTABLE_DIR
  ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data')
  : path.join(__dirname, 'data');
```

替换为：

```js
// 外置数据目录，whenReady 时解析：
// - Windows 便携版：exe 所在目录下的 data/
// - macOS 打包版：.app 同目录的 data/（不可写时回退内置只读）
// - 开发模式：null（直接用项目内 data/）
let externalDataDir = null;

function resolveExternalDataDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data');
  }
  if (process.platform === 'darwin' && app.isPackaged) {
    const bundleDir = path.join(path.dirname(process.execPath), '..', '..', '..');
    return path.join(bundleDir, '..', 'data');
  }
  return null;
}
```

- [ ] **Step 2: 把固定的 SEED_FILES 列表改为"复制内置 data/ 与 images/ 全部文件"**

把现有 `SEED_FILES` 常量（数组定义）整体删除，替换为函数：

```js
async function seedExternalData() {
  const jobsSeed = path.join(bundledRoot, 'data');
  const imgSeed = path.join(bundledRoot, 'images');
  for (const f of await fsp.readdir(jobsSeed)) {
    const dst = path.join(externalDataDir, f);
    if (!(await fileExists(dst))) {
      await fsp.copyFile(path.join(jobsSeed, f), dst);
    }
  }
  const imgDst = path.join(externalDataDir, 'images');
  await fsp.mkdir(imgDst, { recursive: true });
  for (const f of await fsp.readdir(imgSeed)) {
    const dst = path.join(imgDst, f);
    if (!(await fileExists(dst))) {
      await fsp.copyFile(path.join(imgSeed, f), dst);
    }
  }
}
```

- [ ] **Step 3: 改写 whenReady 中的数据目录初始化与种子复制**

把现有（在 `app.whenReady` 内）：

```js
  // 便携版首次运行：把内置数据复制到 exe 旁，用户之后直接编辑外置文件
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    try {
      await fsp.mkdir(externalDir, { recursive: true });
      for (const seed of SEED_FILES) {
        const dst = path.join(externalDir, ...seed.external);
        if (!(await fileExists(dst)) && (await fileExists(seed.bundled))) {
          await fsp.mkdir(path.dirname(dst), { recursive: true });
          await fsp.copyFile(seed.bundled, dst);
        }
      }
    } catch (err) {
      console.error('初始化外置数据目录失败:', err);
    }
  }
```

替换为：

```js
  // 解析外置数据目录：Windows 便携版 / macOS 打包版
  const candidate = resolveExternalDataDir();
  if (candidate) {
    try {
      await fsp.mkdir(candidate, { recursive: true });
      const probe = path.join(candidate, '.write-probe');
      await fsp.writeFile(probe, 'x');
      await fsp.unlink(probe);
      externalDataDir = candidate;
      // 首次运行：把内置 data/ 与 images/ 复制到外置目录（缺哪个补哪个）
      if (!(await fileExists(path.join(externalDataDir, 'jobs.json')))) {
        await seedExternalData();
      }
    } catch (err) {
      // 不可写（如 mac app 放在 /Applications）：回退内置只读数据
      externalDataDir = null;
      console.warn('外置数据目录不可写，使用内置数据:', err.message);
    }
  }
```

- [ ] **Step 4: 更新 `serve()` 外置优先判断**

把现有（在 `serve` 内）：

```js
  // data/ 与 images/ 优先读外置目录（用户改 jobs.json 立即生效）。
  // 外置目录结构：<exe 旁>/data/ 内含 jobs.json 与 images/，
  // 因此 data/ 前缀需剥离后再拼接（避免多一层 data/data）。
  if (safeRel.startsWith('data/') || safeRel.startsWith('images/')) {
    const relInExternal = safeRel.startsWith('data/') ? safeRel.slice('data/'.length) : safeRel;
    const externalFile = path.join(externalDir, relInExternal);
    if (await fileExists(externalFile)) {
      return readResponse(externalFile);
    }
  }
```

替换为：

```js
  // data/ 与 images/ 优先读外置目录（用户改 jobs.json 立即生效）。
  // 外置目录结构：<app 同目录>/data/ 内含 jobs.json 与 images/，
  // 因此 data/ 前缀需剥离后再拼接（避免多一层 data/data）。
  if (externalDataDir && (safeRel.startsWith('data/') || safeRel.startsWith('images/'))) {
    const relInExternal = safeRel.startsWith('data/') ? safeRel.slice('data/'.length) : safeRel;
    const externalFile = path.join(externalDataDir, relInExternal);
    if (await fileExists(externalFile)) {
      return readResponse(externalFile);
    }
  }
```

- [ ] **Step 5: 验证开发模式不回归（本任务测试 1）**

```bash
SMOKE_TEST=1 npx electron .
```

预期：打印 `SMOKE_RESULT {"jobsLoaded":true,"cardCount":10,"searchCount":1,"modalOpen":true,"error":null,"imgsLoaded":3,"imgsTotal":3}`。

- [ ] **Step 6: 验证 Windows 便携版路径不回归（本任务测试 2）**

```bash
rm -rf /tmp/zp-pt && mkdir -p /tmp/zp-pt
PORTABLE_EXECUTABLE_DIR=/tmp/zp-pt SMOKE_TEST=1 npx electron .
node -e 'const j=require("/tmp/zp-pt/data/jobs.json"); j.push({id:999,company:"测试",title:"测试",positions:[],locations:[],has_hc:true,hc_detail:"",referral_code:"",referral_url:"",description:"外置优先",target:"",type:"",tags:[],post_date:"",qr_code:"",extra_links:[]}); require("fs").writeFileSync("/tmp/zp-pt/data/jobs.json", JSON.stringify(j,null,2))'
PORTABLE_EXECUTABLE_DIR=/tmp/zp-pt SMOKE_TEST=1 npx electron .
```

预期：第一次 `cardCount:10`（首次运行种子复制生效）；改外置文件后第二次 `cardCount:11`（外置优先生效）。`rm -rf /tmp/zp-pt` 清理。

- [ ] **Step 7: Commit**

```bash
git add main.js
git commit -m "feat(mac): 主进程支持 mac 打包版外置数据目录"
```

---

### Task 3: 构建 mac dmg + 打包 app 冒烟验证（控制器执行）

**Files:** 无代码改动（构建产物在 `dist/`，已被 .gitignore 忽略）。

**Interfaces:**
- Consumes: Task 1 的 mac 构建配置、Task 2 的 `main.js`。
- Produces: `dist/招聘信息聚合-1.0.0-arm64.dmg`；验证结论。

- [ ] **Step 1: 构建 dmg**

```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
npm run dist:mac
```

预期：构建成功，产出 `dist/招聘信息聚合-1.0.0-arm64.dmg`（`ls -lh dist/*.dmg` 确认）。

- [ ] **Step 2: 对打包后的 .app 跑冒烟测试**

```bash
SMOKE_TEST=1 "dist/mac-arm64/招聘信息聚合.app/Contents/MacOS/招聘信息聚合"
```

预期：打印 `SMOKE_RESULT` 且 `jobsLoaded:true`、`cardCount:10`、`imgsLoaded:3`（打包形态 = asar 内置数据路径可用）。

- [ ] **Step 3: 验证 mac app 同目录外置数据优先**

```bash
mkdir -p /tmp/zp-mac && cp -R "dist/mac-arm64/招聘信息聚合.app" /tmp/zp-mac/
mkdir -p "/tmp/zp-mac/data/images"
cp data/jobs.json /tmp/zp-mac/data/jobs.json   # 复制一份可编辑数据到 app 同目录
node -e 'const fs=require("fs");const p="/tmp/zp-mac/data/jobs.json";const j=JSON.parse(fs.readFileSync(p,"utf8"));j.push({id:999,company:"mac测试",title:"测试",positions:[],locations:[],has_hc:true,hc_detail:"",referral_code:"",referral_url:"",description:"app同目录外置优先",target:"",type:"",tags:[],post_date:"",qr_code:"",extra_links:[]});fs.writeFileSync(p,JSON.stringify(j,null,2))'
SMOKE_TEST=1 "/tmp/zp-mac/招聘信息聚合.app/Contents/MacOS/招聘信息聚合"
```

预期：`cardCount:11`（app 同目录外置数据生效）。`rm -rf /tmp/zp-mac` 清理。

- [ ] **Step 4: 清理临时目录**

```bash
rm -rf /tmp/zp-mac
```

---

### Task 4: CLAUDE.md — 补 mac 版构建说明

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: Task 1 的脚本名（`dist:mac`）、Task 2 的 mac 数据目录行为。
- Produces: 文档。

- [ ] **Step 1: 在"Desktop App (Electron / Windows x64 便携版)"一节的命令列表后追加 mac 说明**

在现有：

```markdown
- **打包 Windows 便携版**：`npm run dist:win`，产物在 `dist/` 下（`招聘信息聚合-<版本>-portable.exe`，单文件）。
```

之后新增：

```markdown
- **打包 macOS 应用**：`npm run dist:mac`，产物在 `dist/` 下（`招聘信息聚合-<版本>-<架构>.dmg`）。
- **mac 版数据目录**：从 `.app` 同目录的 `data/` 读取（首次运行自动生成）；app 放在不可写位置（如 `/Applications`）时自动回退内置只读数据。
- **mac 版验证**：`SMOKE_TEST=1 "<解包后 .app>/Contents/MacOS/招聘信息聚合"` 可对打包应用跑冒烟测试。
```

- [ ] **Step 2: 验证文档可读**

```bash
grep -n "dist:mac" CLAUDE.md
```

预期：能 grep 到至少两处 `dist:mac`。

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: 补充 mac 版构建与数据目录说明"
```
