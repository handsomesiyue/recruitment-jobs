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

const { app, BrowserWindow, shell, protocol, session, ipcMain } = require('electron');
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

// ---- 数据写入（应用内编辑）----

// 可写数据目录：打包模式=外置 data/；开发模式=项目内 data/。
// 打包后外置目录不可写（externalDataDir 回退为 null）时返回 null，前端据此隐藏编辑入口。
function writableDataDir() {
  if (externalDataDir) return externalDataDir;
  if (!app.isPackaged) return path.join(bundledRoot, 'data');
  return null;
}

// 原子写：先写临时文件再 rename，避免写一半损坏数据
async function atomicWrite(file, content) {
  const tmp = file + '.tmp';
  await fsp.writeFile(tmp, content, 'utf8');
  await fsp.rename(tmp, file);
}

// 写入前备份现有 jobs.json 到 data/backups/，保留最近 10 份
async function backupJobsJson(dir) {
  const src = path.join(dir, 'jobs.json');
  if (!(await isFile(src))) return;
  const backupDir = path.join(dir, 'backups');
  await fsp.mkdir(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  await fsp.copyFile(src, path.join(backupDir, `jobs-${ts}.json`));
  const files = (await fsp.readdir(backupDir))
    .filter((f) => f.startsWith('jobs-') && f.endsWith('.json'))
    .sort();
  for (const f of files.slice(0, -10)) {
    await fsp.unlink(path.join(backupDir, f));
  }
}

function validateJobs(jobs) {
  if (!Array.isArray(jobs)) throw new Error('数据必须是数组');
  for (const j of jobs) {
    if (typeof j !== 'object' || j === null) throw new Error('数据项必须是对象');
    if (!Number.isFinite(j.id)) throw new Error('数据项缺少有效 id');
    if (!j.company || !j.title) throw new Error('数据项缺少 company 或 title');
  }
}

// ---- AI 助手（OpenAI 兼容接口）----

// 个人 AI 配置存 userData（不进共享 data/，分发 exe 时不泄露 key）。
// AI_CONFIG_FILE 写成函数延迟求值：app.getPath('userData') 需在 ready 之后才安全，
// 而 IPC handler 运行时必在 ready 之后。
function aiConfigFile() {
  return path.join(app.getPath('userData'), 'ai-config.json');
}

async function readAiConfig() {
  try {
    const raw = await fsp.readFile(aiConfigFile(), 'utf8');
    const cfg = JSON.parse(raw);
    return {
      baseUrl: String(cfg.baseUrl || '').trim(),
      apiKey: String(cfg.apiKey || '').trim(),
      model: String(cfg.model || '').trim(),
    };
  } catch {
    return { baseUrl: '', apiKey: '', model: '' };
  }
}

async function writeAiConfig(cfg) {
  await fsp.mkdir(app.getPath('userData'), { recursive: true });
  await atomicWrite(aiConfigFile(), JSON.stringify(cfg, null, 2) + '\n');
}

// baseUrl → chat/completions 完整 URL：兼容填 https://api.deepseek.com 与 …/v1 两种写法
function chatCompletionsUrl(base) {
  const b = String(base || '').replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(b)) return b;
  const p = b.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions';
  return b + p;
}

// System prompt：从 CLAUDE.md 规范生成，标准词表单一事实来源在提示词里
function buildSystemPrompt() {
  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `你是一名招聘信息解析助手。用户会粘贴一段招聘信息文本（来自微信、官网、帖子等，口语化、格式杂乱）。
请解析出结构化 JSON，严格遵循以下 schema 与命名规范。

一、输出要求：
- 只输出一个 JSON 对象，不要任何解释、前后缀或 markdown 代码围栏。
- 字段必须使用下方指定的标准名称，禁止口语化/营销化描述。
- 缺失的信息给合理默认（见三），不要臆造公司名/岗位不存在的内容。

二、目标 JSON schema（字段类型与 jobs.json 一致）：
{
  "company":  string 公司名称（必填），
  "title":    string 招聘标题（必填），
  "type":     string 招聘类型，从 实习/校招/社招 中选一（见三推断），
  "target":   string 目标人群，如"2027届在校生"，无则空串，
  "positions": string[] 岗位分类，每个元素必须来自下方标准岗位名称表，
  "locations": string[] 办公地点，城市名，如["广州","杭州"]，
  "industry": string[] 行业标签，每个元素必须来自下方标准行业表（1-3 个），
  "salary":   string 薪资，如"面议"、"200-300元/天"、"12-18万/年"，无则空串，
  "education": string 学历要求，如"本科及以上"、"不限"，无则空串，
  "experience": string 经验要求，如"在校/应届"、"经验不限"，无则空串，
  "has_hc":   boolean 是否明确提到 HC 充足/有编制（无明确信息给 false），
  "hc_detail": string HC 描述，无则空串，
  "referral_code": string 内推码，如"DNKyR1"，无则空串，
  "referral_url": string 投递/内推链接，必须是 https:// 开头的完整 URL，无则空串，
  "post_date": string 发布日期，格式 YYYY-MM；未注明则用当前年月 ${curMonth}，
  "tags":     string[] 标签，从文本提炼的短语，如["实习","2027届","内推"]，
  "qr_code":  string 恒为 ""（二维码路径由人工后续填写），
  "description": string 招聘文案全文（尽量原样保留，保留换行），
  "extra_links": object[] 附加链接数组，每项 {"label":名称,"url":"https://..."}，无则 []
}

三、推断规则：
- type：出现"实习/实习生"→实习；"春招/秋招/校园招聘/应届"→校招；"社招/社会招聘/经验X年"→社招；都未明确→校招。
- positions：从岗位描述提炼职能方向，映射到标准岗位名称（如"后端开发"→"后端"，"前端开发"→"前端"，"数据科学"→"数据"，"UI/UX"→"用户体验"或"交互设计"）。不要用"八大职业群"、"海量岗位"等营销说法。
- industry：按公司主营推断，如游戏公司→游戏/互联网，消费电子硬件→消费电子/智能硬件。
- post_date：未注明用当前年月 ${curMonth}。

四、标准岗位名称表（positions 取值必须在此表内）：
技术、算法、研发、前端、后端、测试、数据、嵌入式、人工智能、产品、用户体验、交互设计、
美术、设计、视觉、营销、市场、销售、运营、商务、战略、财务、人力资源、法务、行政、
项目管理、供应链、采购、物流、质量、品质、生产、工程、硬件、硬件研发、声学、金融销售、
投资顾问、客户服务、门店运营、选址开发、商品管理、新零售、策划、服务、客服

五、标准行业表（industry 取值必须在此表内）：
游戏、互联网、消费电子、智能硬件、家电、制造业、音频、医药、零售、机器人、新能源、
电池、食品、金融、证券、能源、电力、央企`;
}

// 宽松提取 AI 返回内容中的 JSON（兼容不严格遵循 response_format 的网关）
function extractJobJson(content) {
  const tryParse = (s) => {
    const obj = JSON.parse(s);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    return obj;
  };
  try {
    const obj = tryParse(content);
    if (obj) return obj;
  } catch { /* fallthrough */ }
  // 剥 ```json 代码围栏
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      const obj = tryParse(fenced[1].trim());
      if (obj) return obj;
    } catch { /* fallthrough */ }
  }
  // 取首个 { 到末个 } 的平衡块
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const obj = tryParse(content.slice(start, end + 1));
      if (obj) return obj;
    } catch { /* fallthrough */ }
  }
  throw new Error('AI_BAD_JSON');
}

function normalizeMonth(v) {
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})[-/.年](\d{1,2})/);
  if (!m) {
    const now = new Date();
    m = [null, String(now.getFullYear()), String(now.getMonth() + 1)];
  }
  return `${m[1]}-${String(m[2]).padStart(2, '0')}`;
}

function normalizeType(v) {
  const s = String(v || '').trim();
  if (['实习', '校招', '社招'].includes(s)) return s;
  return '';
}

// 归一数组字段：字符串按中文逗号/顿号/分号切分，数组去空去重
function toList(v) {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : String(v).split(/[,，、;；]/);
  return arr.map((s) => String(s).trim()).filter(Boolean);
}

// 轻校验不强映射：标准词表交给 system prompt，主进程只保形状与必填项
function parseAndNormalizeJob(obj) {
  const job = {
    id: undefined, // 交给编辑器 nextId() 分配，避免 id 冲突
    company: String(obj.company || '').trim(),
    title: String(obj.title || '').trim(),
    type: normalizeType(obj.type),
    target: String(obj.target || '').trim(),
    positions: toList(obj.positions),
    locations: toList(obj.locations),
    industry: toList(obj.industry),
    salary: String(obj.salary || '').trim(),
    education: String(obj.education || '').trim(),
    experience: String(obj.experience || '').trim(),
    has_hc: !!obj.has_hc,
    hc_detail: String(obj.hc_detail || '').trim(),
    referral_code: String(obj.referral_code || '').trim(),
    referral_url: String(obj.referral_url || '').trim(),
    post_date: normalizeMonth(obj.post_date),
    tags: toList(obj.tags),
    qr_code: '',
    description: String(obj.description || '').trim(),
    extra_links: Array.isArray(obj.extra_links)
      ? obj.extra_links
          .filter((l) => l && l.url)
          .map((l) => ({ label: String(l.label || l.url).trim(), url: String(l.url).trim() }))
      : [],
  };
  if (!job.company || !job.title) throw new Error('AI_MISSING_REQUIRED');
  return job;
}

function setupIpc() {
  // AI 配置：只回传是否已配置，绝不回传 key
  ipcMain.handle('ai:get-config', async () => {
    const cfg = await readAiConfig();
    return { configured: !!(cfg.baseUrl && cfg.apiKey && cfg.model) };
  });

  ipcMain.handle('ai:set-config', async (_e, cfg = {}) => {
    const clean = {
      baseUrl: String(cfg.baseUrl || '').trim(),
      apiKey: String(cfg.apiKey || '').trim(),
      model: String(cfg.model || '').trim(),
    };
    if (!clean.baseUrl || !clean.apiKey || !clean.model) {
      throw new Error('baseUrl / API Key / Model 均不能为空');
    }
    let base = clean.baseUrl.replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
    clean.baseUrl = base;
    await writeAiConfig(clean);
    return { ok: true, configured: true };
  });

  // AI 解析：主进程调 OpenAI 兼容接口，错误以固定错误码字符串抛出
  ipcMain.handle('ai:parse', async (_e, payload = {}) => {
    const text = String(payload.text || '').trim();
    if (text.length < 20) throw new Error('AI_TEXT_TOO_SHORT');
    const cfg = await readAiConfig();
    if (!cfg.baseUrl || !cfg.apiKey || !cfg.model) throw new Error('AI_NOT_CONFIGURED');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const resp = await fetch(chatCompletionsUrl(cfg.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + cfg.apiKey,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: text },
          ],
          temperature: 0.2,
          // 尽力而为：兼容模型忽略，不兼容则靠 extractJobJson 兜底
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) throw new Error('AI_AUTH_FAILED');
        if (resp.status === 429) throw new Error('AI_RATE_LIMITED');
        throw new Error('AI_HTTP_' + resp.status);
      }
      const data = await resp.json();
      const content =
        data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) throw new Error('AI_PARSE_FAILED');
      return { job: parseAndNormalizeJob(extractJobJson(content)) };
    } catch (err) {
      if (err && err.name === 'AbortError') throw new Error('AI_TIMEOUT');
      if (err && err.type === 'system') throw new Error('AI_NETWORK');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  });

  // 保存全量岗位数据：同时写 jobs.json 与 jobs.js（file:// 兼容包装），写前自动备份
  ipcMain.handle('jobs:save', async (_e, jobs) => {
    const dir = writableDataDir();
    if (!dir) throw new Error('当前数据目录不可写');
    validateJobs(jobs);
    await backupJobsJson(dir);
    const json = JSON.stringify(jobs, null, 2) + '\n';
    await atomicWrite(path.join(dir, 'jobs.json'), json);
    await atomicWrite(path.join(dir, 'jobs.js'), 'window.__JOBS_DATA__ = ' + json + ';\n');
    return { ok: true };
  });

  // 保存个人投递进度（按 job id 键控，与共享数据分离）
  ipcMain.handle('status:save', async (_e, statuses) => {
    const dir = writableDataDir();
    if (!dir) throw new Error('当前数据目录不可写');
    if (typeof statuses !== 'object' || statuses === null || Array.isArray(statuses)) {
      throw new Error('进度数据格式错误');
    }
    await atomicWrite(path.join(dir, 'my-status.json'), JSON.stringify(statuses, null, 2) + '\n');
    return { ok: true };
  });

  // 前端据此决定是否显示编辑入口
  ipcMain.handle('desktop:info', async () => ({ editable: !!writableDataDir() }));
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
      preload: path.join(__dirname, 'preload.js'),
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

  // 注册数据写入 IPC（应用内编辑）
  setupIpc();

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
          const out = { jobsLoaded: false, cardCount: 0, searchCount: 0, highlight: false, modalOpen: false, drawerOpen: false, firstPostDate: '', cityCount: 0, typeFilterCount: 0, aiBridge: false, aiBtnVisible: false, error: null };
          out.aiBridge = !!(window.desktopAPI && window.desktopAPI.aiParse);
          out.aiBtnVisible = !!document.getElementById('aiAssistantBtn');
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
          out.highlight = !!document.querySelector('#jobList mark');
          const btn = document.querySelector('.view-detail');
          if (btn) { btn.click(); await new Promise((r) => setTimeout(r, 100)); }
          out.modalOpen = document.getElementById('detailModal').style.display === 'flex';
          out.drawerOpen = document.getElementById('detailModal').classList.contains('open');
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          await new Promise((r) => setTimeout(r, 300));
          document.getElementById('clearFilters').click();
          const sortSel = document.getElementById('sortSelect');
          sortSel.value = 'newest';
          sortSel.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 100));
          const firstDate = document.querySelector('.job-card .post-date');
          out.firstPostDate = firstDate ? firstDate.textContent.trim() : '';
          const chip = document.querySelector('#cityBar .city-chip[data-loc="杭州"]');
          if (chip) { chip.click(); await new Promise((r) => setTimeout(r, 100)); }
          out.cityCount = document.querySelectorAll('.job-card').length;
          const allChip = document.querySelector('#cityBar .city-chip[data-loc="__all__"]');
          if (allChip) { allChip.click(); await new Promise((r) => setTimeout(r, 100)); }
          const cb = document.querySelector('#typeOptions input[value="实习"]');
          if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
          await new Promise((r) => setTimeout(r, 100));
          out.typeFilterCount = document.querySelectorAll('.job-card').length;
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
