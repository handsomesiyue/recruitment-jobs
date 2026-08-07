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
      hc: new Set(),
      location: new Set(),
      tag: new Set(),
    },
    sort: 'default',
    selectedJobId: null,
    viewMode: localStorage.getItem('viewMode') || 'compact',
    groupBy: localStorage.getItem('groupBy') || 'company',
  };

  const GROUP_LABELS = { type: '类型', hc: 'HC', location: '地点', tag: '标签' };

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
  const hcOptions = document.getElementById('hcOptions');
  const locationOptions = document.getElementById('locationOptions');
  const tagOptions = document.getElementById('tagOptions');
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

  // ---- Options derivation ----
  let options = { types: [], hc: [], locations: [], tags: [] };

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
    const hcMap = new Map();
    let yes = 0, no = 0;
    state.jobs.forEach(j => (j.has_hc ? yes++ : no++));
    hcMap.set('有HC', yes);
    hcMap.set('暂无HC', no);
    const locations = countMap(state.jobs.flatMap(j => j.locations || []));
    const tags = countMap(state.jobs.flatMap(j => j.tags || []));
    options = { types: byCount(types), hc: byCount(hcMap), locations: byCount(locations), tags: byCount(tags) };
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
      const hcKey = job.has_hc ? '有HC' : '暂无HC';
      if (f.hc.size && !f.hc.has(hcKey)) return false;
      if (f.location.size && !(job.locations || []).some(l => f.location.has(l))) return false;
      if (f.tag.size && !(job.tags || []).some(t => f.tag.has(t))) return false;
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
        viewEl.update({ jobs: list, keyword: state.keyword, groupBy: state.groupBy });
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
    hcOptions.innerHTML = chipHTML('hc', options.hc);
    locationOptions.innerHTML = chipHTML('location', options.locations);
    tagOptions.innerHTML = chipHTML('tag', options.tags);
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
    ['type', 'hc', 'location', 'tag'].forEach(group => {
      state.filters[group].forEach(v => chips.push({ group, value: v, label: `${GROUP_LABELS[group]}：${v}` }));
    });
    activeFiltersEl.innerHTML = chips.map(c =>
      `<span class="af-chip">${Utils.escHtml(c.label)}<button type="button" data-group="${c.group}" data-value="${Utils.escHtml(c.value)}" aria-label="移除">×</button></span>`
    ).join('');
  }

  // ---- Detail drawer ----
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
        <div class="detail-tags">${tags}${hcBadge}</div>
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
        <div class="detail-tags">${tags}</div>
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

    // Show/hide global sort control (table has its own column sorting)
    if (sortControl) sortControl.style.display = mode === 'table' ? 'none' : '';

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
  async function loadData() {
    try {
      const resp = await fetch('data/jobs.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      state.jobs = await resp.json();
      deriveOptions();
      renderFilters();
      switchView(state.viewMode);
      renderStats(sortJobs(filterByState()));
      renderCityBar();
    } catch (err) {
      console.error('加载招聘数据失败:', err);
      if (viewContainer) viewContainer.style.display = 'none';
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div class="empty-icon">!</div>
        <p>数据加载失败</p>
        <p class="empty-hint">请确保 data/jobs.json 文件存在且格式正确</p>
      `;
    }
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
