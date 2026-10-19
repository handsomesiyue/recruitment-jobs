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
    '中信证券': 'images/logos/citics.jpg',
    '鸣鸣很忙集团': 'images/logos/hnlshm.jpg',
    '国家电投集团': 'images/logos/spic.jpg',
    '游卡': 'images/logos/yoka.png',
    '吉利科技集团': 'images/logos/geelytech.svg',
    '吉利商用车': 'images/logos/geely-cv.jpg',
    '零一万物': 'images/logos/01ai.png',
    '腾讯': 'images/logos/tencent.png',
    '得物': 'images/logos/dewu.jpg',
    '联想集团': 'images/logos/lenovo.png',
    '蚂蚁集团': 'images/logos/antgroup.png',
    '波克': 'images/logos/boke.png',
    '百度': 'images/logos/baidu.png',
    '智元机器人': 'images/logos/agirobot.png',
    '搜狐畅游': 'images/logos/cyou.png',
    '凡岛': 'images/logos/fandow.png',
    '传音控股': 'images/logos/transsion.png',
    '帆软': 'images/logos/fanruan.png',
    '杭州银行': 'images/logos/hangzhou-bank.png',
    '中汇会计师事务所': 'images/logos/zhonghui.png',
    '三一集团': 'images/logos/sany.png',
    '易点云': 'images/logos/edianyun.png',
    '毕马威（KPMG）': 'images/logos/kpmg.png',
    // —— 2026-10-19 补充 ——
    '永安国富资管': 'images/logos/yagf.png',
    '上海曼伦商贸': 'images/logos/rbmanon.png',
    '高途': 'images/logos/gaotu.png',
    '宇通集团': 'images/logos/yutong.png',
    '点点互动': 'images/logos/ddhd.png',
    '科锐国际': 'images/logos/careerintl.png',
    '海尔智家': 'images/logos/haier.png',
    '好未来（学而思）': 'images/logos/tal.png',
    '快手': 'images/logos/kuaishou.png',
    '美团': 'images/logos/meituan.png',
    '中信银行': 'images/logos/citicbank.png',
    '中信银行宁波分行': 'images/logos/citicbank.png',
    '浦发银行杭州分行': 'images/logos/spdb.png',
    '浦发银行宁波分行': 'images/logos/spdb.png',
    '永富物产': 'images/logos/yfcommodity.png',
    '群核科技（杭州群核信息技术有限公司）': 'images/logos/qunhe.png',
    '宁波亚虎进出口有限公司': 'images/logos/home-dollar.png',
    '养生堂·农夫山泉·万泰生物': 'images/logos/yst.png',
    '幸福基业物业服务有限公司嘉善分公司': 'images/logos/cfldcn.png',
    '未来一手（广州未来一手网络科技有限公司）': 'images/logos/weilaiyishou.png',
    '杭州热联集团股份有限公司（热联集团）': 'images/logos/ciec.png',
    '物产中大集团股份有限公司': 'images/logos/wzgroup.png',
    '珀莱雅（珀莱雅化妆品股份有限公司）': 'images/logos/proya.png',
    '浙江省交通投资集团有限公司（浙江交通集团）': 'images/logos/cncico.png',
    '中国邮政集团有限公司': 'images/logos/chinapost.png',
    '泰隆银行（浙江泰隆商业银行）': 'images/logos/zjtlcb.png',
    '重庆百亚卫生用品股份有限公司（百亚股份）': 'images/logos/baiya.png',
    '中国移动浙江公司（浙江移动）': 'images/logos/cmcc.png',
    '亿联网络（厦门亿联网络技术股份有限公司）': 'images/logos/yealink.png',
    '叠纸游戏（Papergames）': 'images/logos/papergames.png',
    '合合信息（INTSIG）': 'images/logos/intsig.png',
    '鹰角网络（Hypergryph）': 'images/logos/hypergryph.png',
    'OPPO（广东欧珀移动通信有限公司）': 'images/logos/oppo.png',
    '天锐星通（成都天锐星通科技股份有限公司）': 'images/logos/t-ray.png',
    '卓驭科技（深圳市卓驭科技有限公司，大疆车载）': 'images/logos/zyt.png',
    '微步在线（北京微步在线科技有限公司）': 'images/logos/threatbook.png',
    '多益网络': 'images/logos/duoyi.png',
    '泛微网络（泛微网络科技股份有限公司）': 'images/logos/weaver.png',
    '恒生电子（恒生电子股份有限公司，600570.SH）': 'images/logos/hundsun.png',
    '中国民生银行温州分行': 'images/logos/cmbc.png',
    '中国民生银行杭州分行': 'images/logos/cmbc.png',
    '招商银行上海分行': 'images/logos/cmbchina.png',
    '中国农业发展银行浙江省分行': 'images/logos/adbc.png',
    '交通银行宁波分行': 'images/logos/bankcomm.png',
    '交通银行浙江省分行': 'images/logos/bankcomm.png',
    '杰瑞集团（烟台杰瑞石油服务集团股份有限公司）': 'images/logos/jereh.png',
    '中国农业银行浙江省分行': 'images/logos/abc.png',
    '知原药业（ZIYOND）': 'images/logos/ziyond.png',
    '天天基金（东方财富全资子公司）': 'images/logos/1234567.png',
    '恒安集团': 'images/logos/hengan.png',
    '杭州海关（海关总署直属）': 'images/logos/customs.png',
    '舜宇集团（舜宇集团有限公司）': 'images/logos/sunnyoptical.png',
    '杭州城投（杭州市城市建设投资集团有限公司）': 'images/logos/hzcjtz.png',
    '郎酒股份（四川郎酒股份有限公司）': 'images/logos/langjiu.png',
    '浙商银行合肥分行': 'images/logos/czbank.png',
    '万葭灯火': 'images/logos/douyin.png',
    '临安农商银行（浙江临安农村商业银行股份有限公司）': 'images/logos/larcb.png',
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
