/* ============================================
   招聘信息聚合 - 共享工具函数
   ============================================ */

const Utils = {
  // 个人投递进度状态（仅桌面版，数据存 data/my-status.json，不随共享数据分发）
  STATUS_META: [
    { value: 'pending', label: '待投递' },
    { value: 'applied', label: '已投递' },
    { value: 'exam', label: '笔试' },
    { value: 'interview', label: '面试' },
    { value: 'offer', label: 'offer' },
    { value: 'rejected', label: '已拒绝' },
  ],

  statusLabel(value) {
    const m = Utils.STATUS_META.find(s => s.value === value);
    return m ? m.label : '';
  },

  // 状态徽章 HTML（无状态返回空串）
  statusBadge(statusValue) {
    if (!statusValue) return '';
    const label = Utils.statusLabel(statusValue);
    if (!label) return '';
    return `<span class="status-badge status-${Utils.escHtml(statusValue)}">${Utils.escHtml(label)}</span>`;
  },

  // 当前个人进度表（app.js 启动时赋值）：{ "<jobId>": { status, note } }
  jobStatuses: {},

  // 按岗位 id 生成状态徽章（供 job-block 各视图调用）
  jobStatusBadge(id) {
    const st = Utils.jobStatuses[String(id)];
    return st && st.status ? Utils.statusBadge(st.status) : '';
  },

  has(v) {
    return v != null && String(v).trim() !== '';
  },

  escHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  // 属性值转义（escHtml 不转引号，用于 HTML 属性时需用此函数）
  escAttr(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  // 安全高亮：按关键词切分原文，每段单独转义，<mark> 由代码注入
  highlight(text, kw) {
    if (!text) return '';
    if (!kw) return Utils.escHtml(text);
    const parts = String(text).split(new RegExp(Utils.escapeRegExp(kw), 'ig'));
    const marker = `<mark class="hl">${Utils.escHtml(kw)}</mark>`;
    return parts.map(p => Utils.escHtml(p)).join(marker);
  },

  AVATAR_COLORS: ['#00a396', '#5b8def', '#f59e0b', '#8b5cf6', '#ef6c87', '#0ea5e9', '#22c55e', '#f97316'],

  // 公司 → 本地 logo 文件映射（无映射则显示首字头像）
  COMPANY_LOGOS: {
    '网易互娱': 'images/logos/netease.png',
    '安克创新': 'images/logos/anker.png',
    '美的集团': 'images/logos/midea.png',
    '韶音科技': 'images/logos/shokz.png',
    '欣旺达': 'images/logos/sunwoda.png',
    '卧安机器人': 'images/logos/switchbot.png',
    '大参林医药集团': 'images/logos/dashenlin.png',
    '中信证券浙江分公司': 'images/logos/citics.jpg',
    '鸣鸣很忙集团': 'images/logos/hnlshm.jpg',
    '国家电投集团': 'images/logos/spic.jpg',
  },

  companyAvatar(name, size) {
    const s = String(name || '招');
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    const color = Utils.AVATAR_COLORS[hash % Utils.AVATAR_COLORS.length];
    const cls = size === 'sm' ? 'company-avatar company-avatar-sm' : 'company-avatar';
    const logo = Utils.COMPANY_LOGOS[name];
    if (logo) {
      return `<span class="${cls}" style="--avatar-bg:${color}"><img src="${logo}" alt="" class="avatar-logo" onload="this.parentElement.classList.add('avatar-loaded')" onerror="this.remove()"><span class="avatar-letter">${Utils.escHtml(s.charAt(0))}</span></span>`;
    }
    return `<span class="${cls}" style="--avatar-bg:${color}">${Utils.escHtml(s.charAt(0))}</span>`;
  },

  toMonth(s) {
    const [y, m] = String(s || '').split('-');
    return (+y || 0) * 12 + (+m || 0);
  },

  fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  },

  copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => Utils.fallbackCopy(text, done));
    } else {
      Utils.fallbackCopy(text, done);
    }
  },

  // 轻量 toast 提示
  toast(msg) {
    let el = document.getElementById('appToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'appToast';
      el.className = 'app-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2200);
  },
};
