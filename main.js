/* ============================================
   招聘信息聚合 - Electron 主进程
   ============================================
   作用：
   - 通过自定义 app:// 协议加载本地静态页面
   - 优先读取 exe 旁边的外置 data/ 目录（用户可编辑）
   - 首次运行自动把内置数据复制到 exe 旁
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

// 外置数据目录：便携版运行时优先取 exe 所在目录下的 data/，
// 否则（开发模式）回退到项目内的 data/。
const externalDir = process.env.PORTABLE_EXECUTABLE_DIR
  ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data')
  : path.join(__dirname, 'data');

// 首次运行要复制到 exe 旁的文件（内置兜底数据）
const SEED_FILES = [
  { bundled: path.join(__dirname, 'data', 'jobs.json'), external: ['jobs.json'] },
  { bundled: path.join(__dirname, 'images', 'wangyi-2026-intern-qr.jpg'), external: ['images', 'wangyi-2026-intern-qr.jpg'] },
  { bundled: path.join(__dirname, 'images', 'anker-2026-intern-qr.jpg'), external: ['images', 'anker-2026-intern-qr.jpg'] },
  { bundled: path.join(__dirname, 'images', 'midea-2026-spring-qr.jpg'), external: ['images', 'midea-2026-spring-qr.jpg'] },
];

async function fileExists(p) {
  try {
    await fsp.access(p);
    return true;
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
  const { pathname } = new URL(req.url);
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '');

  // 路径遍历防护
  const safeRel = path.posix.normalize('/' + rel).replace(/^\/+/, '');
  if (safeRel.split('/').some((s) => s === '..') || path.isAbsolute(safeRel)) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!rel || rel === 'index.html') {
    return readResponse(path.join(bundledRoot, 'index.html'));
  }

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

  // 回退到打包内嵌文件
  const bundledFile = path.join(bundledRoot, safeRel);
  if (await fileExists(bundledFile)) {
    return readResponse(bundledFile);
  }

  return new Response('Not Found', { status: 404 });
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
