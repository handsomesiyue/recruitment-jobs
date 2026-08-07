/* ============================================
   招聘信息聚合 - 共享工具函数
   ============================================ */

const Utils = {
  has(v) {
    return v != null && String(v).trim() !== '';
  },

  escHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
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
};
