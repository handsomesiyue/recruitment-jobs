/* ============================================
   招聘信息聚合网站 - App
   风格：BOSS 直聘（青绿主题，双栏布局）
   支持多视图切换（紧凑列表 / 看板 / 表格 / 时间线）
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ---- State ----
  const state = {
    jobs: [],
    keyword: '',
    filters: {
      type: new Set(),
      industry: new Set(),
      position: new Set(),
      location: new Set(), // kept for city bar quick-filter
    },
    sort: 'default',
    selectedJobId: null,
    viewMode: localStorage.getItem('viewMode') || 'compact',
    groupBy: localStorage.getItem('groupBy') || 'company',
    // 个人投递进度（仅桌面版）：{ "<jobId>": { status, note } }
    statuses: {},
    statusFilter: '',
    desktopEditable: false,
  };

  const GROUP_LABELS = { type: '类型', industry: '行业', position: '岗位分类' };

  // ---- DOM refs ----
  const jobListEl = document.getElementById('jobList');         // kept for backward compat (smoke tests)
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const jobCountEl = document.getElementById('jobCount');
  const companyCountEl = document.getElementById('companyCount');
  const cityBar = document.getElementById('cityBar');
  const sidebar = document.getElementById('sidebar');
  const clearFiltersEl = document.getElementById('clearFilters');
  const typeOptions = document.getElementById('typeOptions');
  const industryOptions = document.getElementById('industryOptions');
  const positionOptions = document.getElementById('positionOptions');
  const activeFiltersEl = document.getElementById('activeFilters');
  const sortSelect = document.getElementById('sortSelect');
  const filterToggle = document.getElementById('filterToggle');
  const detailModal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  // New view-related DOM refs
  const viewContainer = document.getElementById('viewContainer');
  const viewSwitcher = document.getElementById('viewSwitcher');
  const groupByControl = document.getElementById('groupByControl');
  const groupBySelect = document.getElementById('groupBySelect');
  const sortControl = document.querySelector('.sort-control');
  const addJobBtn = document.getElementById('addJobBtn');
  const statusFilterControl = document.getElementById('statusFilterControl');
  const statusFilterSelect = document.getElementById('statusFilterSelect');

  // ---- Options derivation ----
  let options = { types: [], industries: [], positions: [], locations: [] };

  function byCount(map) {
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }

  function deriveOptions() {
    const countMap = (arr) => {
      const m = new Map();
      arr.forEach(v => m.set(v, (m.get(v) || 0) + 1));
      return m;
    };
    const types = countMap(state.jobs.map(j => j.type).filter(Utils.has));
    const industries = countMap(state.jobs.flatMap(j => j.industry || []));
    const positions = countMap(state.jobs.flatMap(j => (j.positions || []).filter(Utils.has)));
    const locations = countMap(state.jobs.flatMap(j => j.locations || []));
    options = { types: byCount(types), industries: byCount(industries), positions: byCount(positions), locations: byCount(locations) };
  }

  // ---- Filtering ----
  function filterByState() {
    const kw = state.keyword.trim().toLowerCase();
    const f = state.filters;
    return state.jobs.filter(job => {
      if (kw) {
        const hay = [
          job.company, job.title, ...(job.positions || []), ...(job.locations || []),
          ...(job.tags || []), job.description, job.target, job.salary,
          ...(job.extra_links || []).map(l => l.label),
        ].filter(Utils.has).join(' ').toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (f.type.size && !f.type.has(job.type)) return false;
      if (f.industry.size && !(job.industry || []).some(i => f.industry.has(i))) return false;
      if (f.position.size && !(job.positions || []).some(p => f.position.has(p))) return false;
      if (f.location.size && !(job.locations || []).some(l => f.location.has(l))) return false;
      if (state.statusFilter) {
        const st = state.statuses[String(job.id)];
        if (!st || st.status !== state.statusFilter) return false;
      }
      return true;
    });
  }

  function sortJobs(list) {
    if (state.sort !== 'newest') return list;
    return list.slice().sort((a, b) => Utils.toMonth(b.post_date) - Utils.toMonth(a.post_date));
  }

  // ---- Render ----
  function render() {
    const list = sortJobs(filterByState());
    renderStats(list);
    renderList(list);
    renderActiveFilters();
    renderCityBar();
  }

  function renderStats(list) {
    jobCountEl.textContent = list.length;
    companyCountEl.textContent = new Set(list.map(j => j.company)).size;
  }

  function renderList(list) {
    if (!list.length) {
      if (viewContainer) viewContainer.style.display = 'none';
      if (jobListEl) jobListEl.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    // Dispatch to active view component
    if (viewContainer) {
      viewContainer.style.display = '';
      const viewEl = viewContainer.firstElementChild;
      if (viewEl && viewEl.update) {
        viewEl.update({ jobs: list, keyword: state.keyword, groupBy: state.groupBy, sort: state.sort });
      }
    }
    // Legacy fallback: also update jobList for smoke test compat
    if (jobListEl) {
      jobListEl.style.display = 'none';
    }
  }

  // ---- Filters UI ----
  function renderFilters() {
    const chipHTML = (group, list) => list.map(o =>
      `<label class="filter-check"><input type="checkbox" data-group="${group}" value="${Utils.escHtml(o.name)}"${state.filters[group].has(o.name) ? ' checked' : ''}><span>${Utils.escHtml(o.name)}</span><span class="count">${o.count}</span></label>`
    ).join('');
    typeOptions.innerHTML = chipHTML('type', options.types);
    industryOptions.innerHTML = chipHTML('industry', options.industries);
    positionOptions.innerHTML = chipHTML('position', options.positions);
  }

  function syncSidebarChecks() {
    sidebar.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.checked = state.filters[cb.dataset.group].has(cb.value);
    });
  }

  function renderCityBar() {
    const allChip = `<button type="button" class="city-chip${state.filters.location.size ? '' : ' active'}" data-loc="__all__">全部</button>`;
    const chips = options.locations.map(o =>
      `<button type="button" class="city-chip${state.filters.location.has(o.name) ? ' active' : ''}" data-loc="${Utils.escHtml(o.name)}">${Utils.escHtml(o.name)}<span class="chip-count">${o.count}</span></button>`
    ).join('');
    cityBar.innerHTML = allChip + chips;
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.keyword) chips.push({ group: 'keyword', value: '', label: `关键词：${state.keyword}` });
    ['type', 'industry', 'position'].forEach(group => {
      state.filters[group].forEach(v => chips.push({ group, value: v, label: `${GROUP_LABELS[group]}：${v}` }));
    });
    activeFiltersEl.innerHTML = chips.map(c =>
      `<span class="af-chip">${Utils.escHtml(c.label)}<button type="button" data-group="${c.group}" data-value="${Utils.escHtml(c.value)}" aria-label="移除">×</button></span>`
    ).join('');
  }

  // ---- Detail drawer ----
  function buildStatusSection(job) {
    const st = state.statuses[String(job.id)];
    const current = st && st.status ? st.status : '';
    const options = Utils.STATUS_META.map(s =>
      `<option value="${s.value}"${s.value === current ? ' selected' : ''}>${Utils.escHtml(s.label)}</option>`
    ).join('');
    const note = st && st.note ? Utils.escAttr(st.note) : '';
    return `
      <div class="detail-section status-section">
        <h3>我的进度</h3>
        <div class="status-controls">
          <select id="statusSelect" class="sort-select">
            <option value="">未标记</option>
            ${options}
          </select>
          <input type="text" id="statusNote" class="status-note-input" placeholder="备注（如面试日期、联系人）" value="${note}">
        </div>
      </div>`;
  }

  function buildInfoRows(job) {
    const rows = [
      ['公司', job.company],
      ['招聘类型', job.type],
      ['目标人群', job.target],
      ['薪资', job.salary],
      ['学历要求', job.education],
      ['经验要求', job.experience],
      ['发布日期', job.post_date],
    ].filter(([, v]) => Utils.has(v))
      .map(([label, v]) =>
        `<div class="info-item"><span class="label">${Utils.escHtml(label)}</span><span class="value">${Utils.escHtml(v)}</span></div>`
      ).join('');
    return rows || '<div class="info-item"><span class="label">暂无更多信息</span></div>';
  }

  function buildExtraLinks(job) {
    if (!job.extra_links || !job.extra_links.length) return '';
    return `<div class="detail-section"><h3>更多链接</h3><div class="extra-links-section">${job.extra_links.map(l =>
      `<a class="btn btn-outline btn-sm" href="${Utils.escHtml(l.url)}" target="_blank" rel="noopener">${Utils.escHtml(l.label)}</a>`
    ).join('')}</div></div>`;
  }

  function buildDetail(job) {
    const avatar = Utils.companyAvatar(job.company);
    const salary = Utils.has(job.salary) ? `<span class="detail-salary">${Utils.escHtml(job.salary)}</span>` : '';
    const tags = (job.tags || []).map(t => `<span class="tag">${Utils.escHtml(t)}</span>`).join('');
    const statusBadge = Utils.jobStatusBadge(job.id);
    const hcBadge = job.has_hc
      ? `<span class="hc-badge has-hc">有HC${Utils.has(job.hc_detail) ? ' · ' + Utils.escHtml(job.hc_detail) : ''}</span>`
      : `<span class="hc-badge unknown">暂无HC</span>`;
    const qrBlock = Utils.has(job.qr_code)
      ? `<div class="detail-section"><h3>扫码投递</h3><div class="qr-block"><img src="${Utils.escHtml(job.qr_code)}" alt="二维码" class="qr-img" onclick="openQrZoom('${Utils.escHtml(job.qr_code)}')"><p class="qr-label">点击二维码放大，用微信/扫码工具扫描</p></div></div>`
      : '';
    const referral = Utils.has(job.referral_code)
      ? `<div class="referral-section"><div class="referral-code-box"><span class="code-label">内推码</span><span class="code-value">${Utils.escHtml(job.referral_code)}</span><span class="copy-feedback">已复制</span></div>${job.referral_url ? `<a class="btn btn-primary" href="${Utils.escHtml(job.referral_url)}" target="_blank" rel="noopener">投递</a>` : ''}</div>`
      : (job.referral_url
          ? `<div class="referral-section"><span style="font-size:var(--text-sm);color:var(--color-text-secondary);">官方投递页面</span><a class="btn btn-primary" href="${Utils.escHtml(job.referral_url)}" target="_blank" rel="noopener">投递</a></div>`
          : '');
    const manageBtns = state.desktopEditable
      ? `<div class="detail-manage"><button type="button" class="btn btn-outline btn-sm" id="editJobBtn">编辑</button><button type="button" class="btn btn-outline btn-sm btn-danger" id="deleteJobBtn">删除</button></div>`
      : '';

    return `
      <div class="job-detail">
        <div class="job-detail-header">
          <div class="detail-company">
            ${avatar}
            <div class="detail-title">
              <h2>${Utils.escHtml(job.title)}</h2>
              <div class="company">${Utils.escHtml(job.company)}</div>
            </div>
          </div>
          ${salary}
        </div>
        <div class="detail-tags">${statusBadge}${tags}${hcBadge}</div>
        ${state.desktopEditable ? buildStatusSection(job) : ''}
        ${manageBtns}
        <div class="detail-section"><h3>职位信息</h3><div class="info-grid">${buildInfoRows(job)}</div></div>
        <div class="detail-section"><h3>招聘详情</h3><div class="detail-description">${Utils.escHtml(job.description || '暂无描述')}</div></div>
        ${qrBlock}
        ${referral}
        ${buildExtraLinks(job)}
      </div>
    `;
  }

  function buildLinkDetail(job) {
    const avatar = Utils.companyAvatar(job.company);
    const tags = (job.tags || []).map(t => `<span class="tag">${Utils.escHtml(t)}</span>`).join('');
    const statusBadge = Utils.jobStatusBadge(job.id);
    const manageBtns = state.desktopEditable
      ? `<div class="detail-manage"><button type="button" class="btn btn-outline btn-sm" id="editJobBtn">编辑</button><button type="button" class="btn btn-outline btn-sm btn-danger" id="deleteJobBtn">删除</button></div>`
      : '';
    const applyBtn = job.referral_url
      ? `<div class="referral-section"><span style="font-size:var(--text-sm);color:var(--color-text-secondary);">官方投递页面</span><a class="btn btn-primary" href="${Utils.escHtml(job.referral_url)}" target="_blank" rel="noopener">访问官网 →</a></div>`
      : '';

    return `
      <div class="job-detail">
        <div class="job-detail-header">
          <div class="detail-company">
            ${avatar}
            <div class="detail-title">
              <h2>${Utils.escHtml(job.title)}</h2>
              <div class="company">${Utils.escHtml(job.company)}</div>
            </div>
          </div>
        </div>
        <div class="detail-tags">${statusBadge}${tags}</div>
        ${state.desktopEditable ? buildStatusSection(job) : ''}
        ${manageBtns}
        <div class="detail-section"><h3>职位信息</h3><div class="info-grid">${buildInfoRows(job)}</div></div>
        <div class="detail-section"><h3>招聘详情</h3><div class="detail-description">${Utils.escHtml(job.description || '暂无描述')}</div></div>
        ${applyBtn}
        ${buildExtraLinks(job)}
      </div>
    `;
  }

  function openDetail(jobId) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    state.selectedJobId = jobId;
    modalBody.innerHTML = job.entry_type === 'link' ? buildLinkDetail(job) : buildDetail(job);
    detailModal.style.display = 'flex';
    requestAnimationFrame(() => detailModal.classList.add('open'));
    document.body.style.overflow = 'hidden';

    // 绑定抽屉内内推码复制
    const codeEl = modalBody.querySelector('.code-value');
    const feedbackEl = modalBody.querySelector('.copy-feedback');
    if (codeEl && feedbackEl) {
      codeEl.addEventListener('click', () => Utils.copyText(job.referral_code, () => {
        feedbackEl.classList.add('show');
        setTimeout(() => feedbackEl.classList.remove('show'), 2000);
      }));
    }

    // 绑定进度控制与编辑/删除（仅桌面版）
    bindManageControls(job);
  }

  function bindManageControls(job) {
    const statusSel = modalBody.querySelector('#statusSelect');
    const noteEl = modalBody.querySelector('#statusNote');
    if (statusSel && noteEl) {
      const persist = () => {
        const key = String(job.id);
        const status = statusSel.value;
        const note = noteEl.value.trim();
        if (!status && !note) delete state.statuses[key];
        else state.statuses[key] = { status, note };
        Utils.jobStatuses = state.statuses;
        saveStatuses();
      };
      statusSel.addEventListener('change', () => { persist(); render(); });
      noteEl.addEventListener('change', persist);
    }
    const editBtn = modalBody.querySelector('#editJobBtn');
    if (editBtn) editBtn.addEventListener('click', () => {
      closeDetail();
      window.JobEditor.openEdit(job);
    });
    const delBtn = modalBody.querySelector('#deleteJobBtn');
    if (delBtn) delBtn.addEventListener('click', async () => {
      closeDetail();
      await window.JobEditor.onDelete(job);
    });
  }

  async function saveStatuses() {
    if (!window.desktopAPI) return;
    try {
      const res = await window.desktopAPI.saveStatus(state.statuses);
      if (!res || !res.ok) throw new Error((res && res.error) || '保存失败');
    } catch (e) {
      Utils.toast('进度保存失败：' + (e && e.message ? e.message : e));
    }
  }

  function closeDetail() {
    detailModal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!detailModal.classList.contains('open')) detailModal.style.display = 'none';
    }, 250);
  }

  // ---- View management ----
  const VIEW_TAGS = {
    compact: 'compact-list-view',
    board: 'board-view',
    table: 'table-view',
    timeline: 'timeline-view',
  };

  function switchView(mode) {
    state.viewMode = mode;
    try { localStorage.setItem('viewMode', mode); } catch (e) { /* noop */ }

    // Update switcher UI
    if (viewSwitcher) {
      viewSwitcher.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
      });
    }

    // Show/hide group-by control (only for board view)
    if (groupByControl) groupByControl.style.display = mode === 'board' ? '' : 'none';

    // Replace view container content
    if (viewContainer) {
      viewContainer.innerHTML = '';
      const tagName = VIEW_TAGS[mode] || (mode + '-view');
      const viewEl = document.createElement(tagName);
      viewEl.className = 'view-content';
      viewContainer.appendChild(viewEl);

      // Update with current data
      const list = sortJobs(filterByState());
      if (viewEl.update) viewEl.update({ jobs: list, keyword: state.keyword, groupBy: state.groupBy });
    }

    renderActiveFilters();
  }

  // ---- Bootstrap ----
  function loadData() {
    // 优先使用内联数据（file:// 兼容）
    if (window.__JOBS_DATA__) {
      initData(window.__JOBS_DATA__);
      return;
    }
    // HTTP 环境下用 XHR 加载
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/jobs.json', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
        try { initData(JSON.parse(xhr.responseText)); } catch (e) { showError(); }
      } else {
        showError();
      }
    };
    xhr.onerror = showError;
    xhr.send();
  }

  function initData(jobs) {
    state.jobs = jobs;
    deriveOptions();
    renderFilters();
    switchView(state.viewMode);
    renderStats(sortJobs(filterByState()));
    renderCityBar();
  }

  // 编辑器保存后：替换数据并整体重渲染（不重新加载页面）
  function replaceJobs(jobs) {
    initData(jobs);
    render();
  }

  // 桌面版初始化：可编辑性探测、加载个人进度、显示编辑入口
  async function initDesktop() {
    if (!window.desktopAPI) return;
    let editable = false;
    try {
      const info = await window.desktopAPI.getInfo();
      editable = !!(info && info.editable);
    } catch (e) { /* 探测失败按不可编辑处理 */ }
    state.desktopEditable = editable;

    if (editable) {
      // 加载个人进度（文件可能不存在，属正常情况）
      try {
        const resp = await fetch('data/my-status.json');
        if (resp.ok) {
          const st = await resp.json();
          if (st && typeof st === 'object' && !Array.isArray(st)) state.statuses = st;
        }
      } catch (e) { /* 无进度文件则保持空 */ }

      if (addJobBtn) {
        addJobBtn.style.display = '';
        addJobBtn.addEventListener('click', () => window.JobEditor.openNew());
      }
      if (statusFilterControl && statusFilterSelect) {
        statusFilterControl.style.display = '';
        statusFilterSelect.innerHTML =
          '<option value="">全部进度</option>' +
          Utils.STATUS_META.map(s => `<option value="${s.value}">${Utils.escHtml(s.label)}</option>`).join('');
        statusFilterSelect.addEventListener('change', () => {
          state.statusFilter = statusFilterSelect.value;
          render();
        });
      }
    }
    Utils.jobStatuses = state.statuses;
    render();
  }

  function showError() {
    console.error('加载招聘数据失败');
    if (viewContainer) viewContainer.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML =
      '<div class="empty-icon">!</div>' +
      '<p>数据加载失败</p>' +
      '<p class="empty-hint">请确保 data/jobs.json 文件存在且格式正确</p>';
  }

  // ---- Event Delegation ----

  // View container: handle copy buttons and job selection
  if (viewContainer) {
    viewContainer.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.btn-copy');
      if (copyBtn) {
        e.stopPropagation();
        const btn = copyBtn;
        Utils.copyText(btn.dataset.code, () => {
          btn.classList.add('copied');
          const original = btn.textContent;
          btn.textContent = '已复制';
          setTimeout(() => { btn.classList.remove('copied'); btn.textContent = original; }, 2000);
        });
        return;
      }
      if (e.target.closest('a')) return;
      const item = e.target.closest('[data-id]');
      if (item) openDetail(Number(item.dataset.id));
    });

    // Table view internal sort events
    viewContainer.addEventListener('sort-change', (e) => {
      // Re-render is handled by the table-view component itself
    });
  }

  // Legacy jobList fallback for smoke tests
  if (jobListEl) {
    jobListEl.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.btn-copy');
      if (copyBtn) {
        e.stopPropagation();
        const btn = copyBtn;
        Utils.copyText(btn.dataset.code, () => {
          btn.classList.add('copied');
          const original = btn.textContent;
          btn.textContent = '已复制';
          setTimeout(() => { btn.classList.remove('copied'); btn.textContent = original; }, 2000);
        });
        return;
      }
      if (e.target.closest('a')) return;
      const card = e.target.closest('.job-card');
      if (card) openDetail(Number(card.dataset.id));
    });
  }

  sidebar.addEventListener('change', (e) => {
    const cb = e.target.closest('input[type=checkbox][data-group]');
    if (!cb) return;
    if (cb.checked) state.filters[cb.dataset.group].add(cb.value);
    else state.filters[cb.dataset.group].delete(cb.value);
    render();
  });

  cityBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.city-chip');
    if (!chip) return;
    const loc = chip.dataset.loc;
    if (loc === '__all__') {
      state.filters.location.clear();
    } else {
      if (state.filters.location.has(loc)) state.filters.location.delete(loc);
      else state.filters.location.add(loc);
    }
    render();
    syncSidebarChecks();
  });

  activeFiltersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-group]');
    if (!btn) return;
    const group = btn.dataset.group;
    const value = btn.dataset.value;
    if (group === 'keyword') {
      state.keyword = '';
      searchInput.value = '';
    } else {
      state.filters[group].delete(value);
    }
    render();
    syncSidebarChecks();
  });

  searchInput.addEventListener('input', () => {
    state.keyword = searchInput.value.trim();
    render();
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    render();
  });

  clearFiltersEl.addEventListener('click', () => {
    Object.values(state.filters).forEach(set => set.clear());
    state.keyword = '';
    searchInput.value = '';
    state.sort = 'default';
    sortSelect.value = 'default';
    render();
    syncSidebarChecks();
  });

  modalClose.addEventListener('click', closeDetail);
  detailModal.querySelector('.drawer-backdrop').addEventListener('click', closeDetail);

  filterToggle.addEventListener('click', () => document.body.classList.add('sidebar-open'));
  document.querySelectorAll('[data-sidebar-close]').forEach(el =>
    el.addEventListener('click', () => document.body.classList.remove('sidebar-open'))
  );

  // View switcher events
  if (viewSwitcher) {
    viewSwitcher.addEventListener('click', (e) => {
      const btn = e.target.closest('.view-btn');
      if (!btn || btn.classList.contains('active')) return;
      switchView(btn.dataset.view);
    });
  }

  // Group-by selector events
  if (groupBySelect) {
    groupBySelect.value = state.groupBy;
    groupBySelect.addEventListener('change', () => {
      state.groupBy = groupBySelect.value;
      try { localStorage.setItem('groupBy', state.groupBy); } catch (e) { /* noop */ }
      render();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (detailModal.classList.contains('open')) {
      closeDetail();
    } else {
      document.body.classList.remove('sidebar-open');
    }
  });

  loadData();
  initDesktop();

  // 供编辑器（js/editor.js）读写当前数据
  window.JobApp = {
    state,
    get options() { return options; },
    replaceJobs,
  };
});

// ---- QR Zoom (全局，供抽屉内联 onclick 调用) ----
function openQrZoom(src) {
  const overlay = document.createElement('div');
  overlay.className = 'qr-zoom-overlay';
  overlay.innerHTML = `
    <div class="qr-zoom-backdrop"></div>
    <div class="qr-zoom-content">
      <button class="qr-zoom-close">&times;</button>
      <img src="${src}" alt="二维码放大">
      <p class="qr-zoom-label">长按或截图保存，用微信/扫码工具扫描</p>
    </div>
  `;

  overlay.querySelector('.qr-zoom-backdrop').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.qr-zoom-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); }, { once: true });

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}
