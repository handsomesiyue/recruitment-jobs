/* ============================================
   招聘信息聚合 - Electron 主进程
   ============================================
   作用：
   - 通过自定义 app:// 协议加载本地静态页面
   - 优先读取应用同目录的外置 data/ 目录（Windows 便携版 exe 旁 / macOS .app 旁，用户可编辑）
   - 首次运行自动把内置数据复制到应用同目录
   - 外链在系统浏览器中打开
   - 剪贴板权限放行（navigator.clipboard.writeText 无需改页面代码）
   ============================================ */

const { app, BrowserWindow, shell, protocol, session } = require('electron');
const path = require('node:path');
const fsp = require('node:fs/promises');

// 必须在 app ready 之前调用，且全进程只能调用一次
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

// 页面根目录：开发模式为项目根目录，打包后为 asar 根目录（fs 对 asar 透明）
const bundledRoot = __dirname;

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
    // process.execPath = <bundle>/Contents/MacOS/<可执行文件>；
    // 三层 .. 即"包含 .app 的文件夹"（app 同目录），数据目录在其下 data/
    const appDir = path.join(path.dirname(process.execPath), '..', '..', '..');
    return path.join(appDir, 'data');
  }
  return null;
}

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

async function fileExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

// 判断 p 是否为普通文件（目录或其它非文件返回 false，避免对目录 readFile 触发 EISDIR）
async function isFile(p) {
  try {
    const st = await fsp.stat(p);
    return st.isFile();
  } catch {
    return false;
  }
}

// ---- 内容类型 ----
const TEXT_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// 图片按魔数嗅探，避免 .jpg 扩展名实为 PNG 的问题
function sniffImageMime(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
    && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp';
  return null;
}

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  return TEXT_MIME[ext] || null;
}

async function readResponse(file) {
  const buf = await fsp.readFile(file);
  const type = sniffImageMime(buf) || contentTypeFor(file) || 'application/octet-stream';
  return new Response(new Uint8Array(buf), { headers: { 'content-type': type } });
}

// ---- app:// 协议处理 ----
async function serve(req) {
  try {
    const { pathname } = new URL(req.url);
    const rel = decodeURIComponent(pathname).replace(/^\/+/, '');

    // 路径遍历防护：在 normalize 之前检查原始路径中的 '..' 段，
    // 避免归一化把遍历意图吞掉后防护失效（normalize 仅用于统一斜杠/点段）
    if (rel.split('/').some((s) => s === '..')) {
      return new Response('Bad Request', { status: 400 });
    }
    const safeRel = path.posix.normalize('/' + rel).replace(/^\/+/, '');

    if (!rel || rel === 'index.html') {
      return readResponse(path.join(bundledRoot, 'index.html'));
    }

    // data/ 与 images/ 优先读外置目录（用户改 jobs.json 立即生效）。
    // 外置目录结构：<app 同目录>/data/ 内含 jobs.json 与 images/，
    // 因此 data/ 前缀需剥离后再拼接（避免多一层 data/data）。
    if (externalDataDir && (safeRel.startsWith('data/') || safeRel.startsWith('images/'))) {
      const relInExternal = safeRel.startsWith('data/') ? safeRel.slice('data/'.length) : safeRel;
      const externalFile = path.join(externalDataDir, relInExternal);
      if (await isFile(externalFile)) {
        return readResponse(externalFile);
      }
    }

    // 回退到打包内嵌文件
    const bundledFile = path.join(bundledRoot, safeRel);
    if (await isFile(bundledFile)) {
      return readResponse(bundledFile);
    }

    return new Response('Not Found', { status: 404 });
  } catch (err) {
    // 无法解析的 URL（如非法 % 转义抛 URIError）或其它意外错误：统一 400
    return new Response('Bad Request', { status: 400 });
  }
}

// ---- 创建窗口 ----
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    title: '招聘信息聚合',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 外链（target="_blank"）交给系统默认浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // 阻止窗口内导航到外部站点
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) e.preventDefault();
  });

  win.loadURL('app://app/index.html');
  return win;
}

// ---- 启动 ----
app.whenReady().then(async () => {
  // 解析外置数据目录：Windows 便携版 / macOS 打包版
  const candidate = resolveExternalDataDir();
  if (candidate) {
    try {
      await fsp.mkdir(candidate, { recursive: true });
      const probe = path.join(candidate, '.write-probe');
      await fsp.writeFile(probe, 'x');
      await fsp.unlink(probe);
      externalDataDir = candidate;
      // 首次运行（外置无 jobs.json 时）：把内置 data/ 与 images/ 复制到外置目录
      if (!(await fileExists(path.join(externalDataDir, 'jobs.json')))) {
        await seedExternalData();
      }
    } catch (err) {
      // 不可写（如 mac app 放在 /Applications）：回退内置只读数据
      externalDataDir = null;
      console.warn('外置数据目录不可写，使用内置数据:', err.message);
    }
  }

  // 注册协议
  protocol.handle('app', serve);

  // 剪贴板：只放行 navigator.clipboard.writeText 需要的权限
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'clipboard-sanitized-write');
  });

  const win = createWindow();

  // 冒烟测试钩子：SMOKE_TEST=1 时自动验证页面/数据/搜索/弹窗，输出结果后退出
  if (process.env.SMOKE_TEST === '1') {
    win.webContents.once('did-finish-load', async () => {
      try {
        await new Promise((r) => setTimeout(r, 800));
        const result = await win.webContents.executeJavaScript(`(async () => {
          const out = { jobsLoaded: false, cardCount: 0, searchCount: 0, modalOpen: false, error: null };
          try {
            const resp = await fetch('data/jobs.json');
            out.jobsLoaded = resp.ok;
          } catch (e) { out.error = String(e); }
          out.cardCount = document.querySelectorAll('.job-card').length;
          await new Promise((r) => setTimeout(r, 300));
          out.imgsLoaded = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth > 0).length;
          out.imgsTotal = document.querySelectorAll('img').length;
          const input = document.getElementById('searchInput');
          input.value = '网易';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 100));
          out.searchCount = document.querySelectorAll('.job-card').length;
          const btn = document.querySelector('.view-detail');
          if (btn) { btn.click(); await new Promise((r) => setTimeout(r, 100)); }
          out.modalOpen = document.getElementById('detailModal').style.display === 'flex';
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          return out;
        })()`);
        console.log('SMOKE_RESULT ' + JSON.stringify(result));
      } catch (err) {
        console.error('SMOKE_ERROR ' + String(err));
      }
      app.quit();
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
