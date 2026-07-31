/* ============================================
   招聘信息聚合网站 - App
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ---- State ----
  let jobs = [];

  // ---- DOM refs ----
  const jobListEl = document.getElementById('jobList');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const hcFilter = document.getElementById('hcFilter');
  const jobCountEl = document.getElementById('jobCount');
  const detailModal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = detailModal.querySelector('.modal-backdrop');

  // ---- Fetch & Render ----
  async function loadJobs() {
    try {
      const resp = await fetch('data/jobs.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      jobs = await resp.json();
      populateFilters(jobs);
      render(jobs);
    } catch (err) {
      console.error('加载招聘数据失败:', err);
      jobListEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">!</div>
          <p>数据加载失败</p>
          <p class="empty-hint">请确保 data/jobs.json 文件存在且格式正确</p>
        </div>
      `;
    }
  }

  // ---- Populate filter dropdowns ----
  function populateFilters(data) {
    // Types
    const types = new Set(data.map(j => j.type).filter(Boolean));
    typeFilter.innerHTML = '<option value="">全部类型</option>' +
      [...types].sort().map(t => `<option value="${t}">${t}</option>`).join('');
  }

  // ---- Filter & Search ----
  function getFilteredJobs(data) {
    const keyword = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;
    const hc = hcFilter.value;

    return data.filter(job => {
      // Keyword search
      if (keyword) {
        const searchTarget = [
          job.company,
          job.title,
          ...(job.positions || []),
          ...(job.tags || []),
          job.description,
          ...(job.extra_links || []).map(l => l.label),
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchTarget.includes(keyword)) return false;
      }

      if (type && job.type !== type) return false;

      if (hc === '有HC' && !job.has_hc) return false;
      if (hc === '未知' && job.has_hc) return false;

      return true;
    });
  }

  // ---- Render ----
  function render(data) {
    const filtered = getFilteredJobs(data);
    jobCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
      jobListEl.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    jobListEl.style.display = 'grid';
    jobListEl.innerHTML = filtered.map(job => createCard(job)).join('');
  }

  function createCard(job) {
    // Link-type entries: simplified card
    if (job.entry_type === 'link') {
      return createLinkCard(job);
    }

    const hcBadge = job.has_hc
      ? `<span class="hc-badge has-hc">有HC ${job.hc_detail ? '· ' + job.hc_detail : ''}</span>`
      : `<span class="hc-badge unknown">暂无HC</span>`;

    const tags = (job.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    const positions = (job.positions || []).slice(0, 4).join(' · ');
    const posDisplay = positions ? (job.positions.length > 4 ? positions + '…' : positions) : '';
    const locations = (job.locations || []).join(' · ');
    const desc = (job.description || '').slice(0, 150) + ((job.description || '').length > 150 ? '…' : '');

    // Determine card layout: with or without company badge header
    const posHtml = posDisplay ? `<span class="meta-item">${escHtml(posDisplay)}</span>` : '';
    const locHtml = `<span class="meta-item">${escHtml(locations)}</span>`;
    const typeHtml = job.type ? `<span class="meta-item">${escHtml(job.type)}</span>` : '';
    const targetHtml = job.target ? `<div class="job-card-target">${escHtml(job.target)}</div>` : '';

    const qrHtml = job.qr_code
      ? `<div class="job-card-qr"><img src="${escHtml(job.qr_code)}" alt="二维码"></div>`
      : '';

    const bottomHtml = `<div class="job-card-bottom">
      ${qrHtml}
      ${hcBadge}
    </div>`;

    return `
      <div class="job-card" data-id="${job.id}">
        <div class="job-card-company-badge">
          <span class="company-dot"></span>
          <span class="company-name">${escHtml(job.company)}</span>
        </div>
        <div class="job-card-title">
          <h3>${escHtml(job.title)}</h3>
        </div>
        <div class="job-card-meta">
          ${posHtml}
          ${locHtml}
          ${typeHtml}
        </div>
        ${targetHtml}
        ${tags ? `<div class="job-card-tags">${tags}</div>` : ''}
        <div class="job-card-desc">${escHtml(desc)}</div>
        <div class="job-card-actions">
          <button class="btn btn-primary btn-sm view-detail" data-id="${job.id}">查看详情</button>
          ${job.referral_url ? `<a href="${escHtml(job.referral_url)}" target="_blank" class="btn btn-outline btn-sm" rel="noopener">内推链接</a>` : ''}
        </div>
        ${job.extra_links && job.extra_links.length ? `
        <div class="job-card-extra-links">
          ${job.extra_links.map(link => `<a href="${escHtml(link.url)}" target="_blank" class="extra-link" rel="noopener">${escHtml(link.label)}</a>`).join('')}
        </div>` : ''}
        ${bottomHtml}
      </div>
    `;
  }

  function createLinkCard(job) {
    const tags = (job.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    const desc = (job.description || '').slice(0, 200) + ((job.description || '').length > 200 ? '…' : '');

    return `
      <div class="job-card job-card-link" data-id="${job.id}">
        <div class="job-card-company-badge">
          <span class="company-name">${escHtml(job.company)}</span>
        </div>
        <div class="job-card-title">
          <h3>${escHtml(job.title)}</h3>
        </div>
        <div class="job-card-meta">
          ${job.type ? `<span class="meta-item">${escHtml(job.type)}</span>` : ''}
          ${job.target ? `<span class="meta-item">${escHtml(job.target)}</span>` : ''}
        </div>
        ${tags ? `<div class="job-card-tags">${tags}</div>` : ''}
        <div class="job-card-desc">${escHtml(desc)}</div>
        <div class="job-card-actions">
          ${job.referral_url ? `<a href="${escHtml(job.referral_url)}" target="_blank" class="btn btn-accent btn-sm" rel="noopener">访问官网 →</a>` : ''}
        </div>
        ${job.extra_links && job.extra_links.length ? `
        <div class="job-card-extra-links">
          ${job.extra_links.map(link => `<a href="${escHtml(link.url)}" target="_blank" class="extra-link" rel="noopener">${escHtml(link.label)}</a>`).join('')}
        </div>` : ''}
      </div>
    `;
  }

  // ---- Detail Modal ----
  function openDetail(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Link-type entries: simplified detail
    if (job.entry_type === 'link') {
      openLinkDetail(job);
      return;
    }

    const hcBadge = job.has_hc
      ? `<span class="hc-badge has-hc">有HC ${job.hc_detail ? '· ' + job.hc_detail : ''}</span>`
      : `<span class="hc-badge unknown">暂无HC</span>`;

    const tags = (job.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    const positions = (job.positions || []).join(' · ');
    const locations = (job.locations || []).join(' · ');

    modalBody.innerHTML = `
      <div class="job-detail">
        <div class="job-detail-header">
          <div class="company">${escHtml(job.company)}</div>
          <h2>${escHtml(job.title)}</h2>
          ${hcBadge}
        </div>
        <div class="job-card-meta">
          <span class="meta-item">${escHtml(positions)}</span>
          <span class="meta-item">${escHtml(locations)}</span>
          ${job.type ? `<span class="meta-item">${escHtml(job.type)}</span>` : ''}
          ${job.target ? `<span class="meta-item">${escHtml(job.target)}</span>` : ''}
          ${job.post_date ? `<span class="meta-item">${escHtml(job.post_date)}</span>` : ''}
        </div>
        ${tags ? `<div class="job-card-tags">${tags}</div>` : ''}
        <div class="job-detail-description">${escHtml(job.description || '暂无描述')}</div>
        <div class="job-detail-qr-section">${job.qr_code ? `
          <div class="qr-block">
            <img src="${escHtml(job.qr_code)}" alt="二维码" class="qr-img" onclick="openQrZoom('${escHtml(job.qr_code)}')">
            <p class="qr-label">点击二维码放大</p>
          </div>` : ''}
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">公司</span>
            <span class="value">${escHtml(job.company)}</span>
          </div>
          <div class="info-item">
            <span class="label">招聘类型</span>
            <span class="value">${escHtml(job.type || '-')}</span>
          </div>
          <div class="info-item">
            <span class="label">目标人群</span>
            <span class="value">${escHtml(job.target || '-')}</span>
          </div>
          <div class="info-item">
            <span class="label">发布日期</span>
            <span class="value">${escHtml(job.post_date || '-')}</span>
          </div>
        </div>
        <div class="referral-section">
          <div class="referral-code-box">
            <span class="code-label">内推码</span>
            <span class="code-value" id="referralCode">${escHtml(job.referral_code)}</span>
            <span class="copy-feedback" id="copyFeedback">已复制</span>
          </div>
          ${job.referral_url ? `<a href="${escHtml(job.referral_url)}" target="_blank" class="btn btn-primary" rel="noopener">内推链接</a>` : ''}
        </div>
        ${job.extra_links && job.extra_links.length ? `
        <div class="extra-links-section">
          <div class="extra-links-label">更多链接</div>
          ${job.extra_links.map(link => `<a href="${escHtml(link.url)}" target="_blank" class="btn btn-outline btn-sm" rel="noopener">${escHtml(link.label)}</a>`).join('')}
        </div>` : ''}
      </div>
    `;

    detailModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Copy referral code
    const codeEl = document.getElementById('referralCode');
    const feedbackEl = document.getElementById('copyFeedback');
    if (codeEl) {
      codeEl.addEventListener('click', () => {
        navigator.clipboard.writeText(job.referral_code).then(() => {
          feedbackEl.classList.add('show');
          setTimeout(() => feedbackEl.classList.remove('show'), 2000);
        }).catch(() => {
          // Fallback
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(codeEl);
          sel.removeAllRanges();
          sel.addRange(range);
        });
      });
    }
  }

  function openLinkDetail(job) {
    const tags = (job.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    modalBody.innerHTML = `
      <div class="job-detail">
        <div class="job-detail-header">
          <div class="company">${escHtml(job.company)}</div>
          <h2>${escHtml(job.title)}</h2>
        </div>
        <div class="job-card-meta">
          ${job.type ? `<span class="meta-item">${escHtml(job.type)}</span>` : ''}
          ${job.target ? `<span class="meta-item">${escHtml(job.target)}</span>` : ''}
          ${job.post_date ? `<span class="meta-item">${escHtml(job.post_date)}</span>` : ''}
        </div>
        ${tags ? `<div class="job-card-tags">${tags}</div>` : ''}
        <div class="job-detail-description">${escHtml(job.description || '暂无描述')}</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">公司</span>
            <span class="value">${escHtml(job.company)}</span>
          </div>
          <div class="info-item">
            <span class="label">招聘类型</span>
            <span class="value">${escHtml(job.type || '-')}</span>
          </div>
          <div class="info-item">
            <span class="label">目标人群</span>
            <span class="value">${escHtml(job.target || '-')}</span>
          </div>
          <div class="info-item">
            <span class="label">发布日期</span>
            <span class="value">${escHtml(job.post_date || '-')}</span>
          </div>
        </div>
        ${job.referral_url ? `
        <div class="referral-section">
          <span style="font-size:0.9rem;color:var(--color-text-secondary);">官方投递页面</span>
          <a href="${escHtml(job.referral_url)}" target="_blank" class="btn btn-accent" rel="noopener">访问官网 →</a>
        </div>` : ''}
        ${job.extra_links && job.extra_links.length ? `
        <div class="extra-links-section">
          <div class="extra-links-label">更多链接</div>
          ${job.extra_links.map(link => `<a href="${escHtml(link.url)}" target="_blank" class="btn btn-outline btn-sm" rel="noopener">${escHtml(link.label)}</a>`).join('')}
        </div>` : ''}
      </div>
    `;

    detailModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    detailModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ---- Event Delegation ----
  // Card click -> open detail
  jobListEl.addEventListener('click', (e) => {
    const card = e.target.closest('.job-card');
    const btn = e.target.closest('.view-detail');
    const link = e.target.closest('a');

    if (link) return; // Let normal link behavior happen

    if (btn) {
      e.stopPropagation();
      openDetail(Number(btn.dataset.id));
      return;
    }

    if (card) {
      openDetail(Number(card.dataset.id));
    }
  });

  // Modal close
  modalClose.addEventListener('click', closeDetail);
  modalBackdrop.addEventListener('click', closeDetail);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail();
  });

  // Search & Filter
  searchInput.addEventListener('input', () => render(jobs));
  typeFilter.addEventListener('change', () => render(jobs));
  hcFilter.addEventListener('change', () => render(jobs));

  // ---- Utility ----
  function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Bootstrap ----
  loadJobs();
});

// ---- QR Zoom (global, called from inline onclick) ----
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
