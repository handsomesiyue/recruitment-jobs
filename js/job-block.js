/* ============================================
   招聘信息聚合 - 岗位块渲染工具
   各视图共享的 HTML 生成函数
   ============================================ */

const JobBlock = {

  /* ---- 紧凑列表行 ---- */
  compactRow(job, keyword) {
    const { has, escHtml, highlight, companyAvatar } = Utils;
    const kw = keyword;
    const avatar = companyAvatar(job.company);
    const salary = has(job.salary) ? `<span class="compact-salary">${escHtml(job.salary)}</span>` : '';
    const tags = (job.tags || []).slice(0, 3).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
    const locs = job.locations || [];
    const locText = locs.length ? locs.slice(0, 3).join(' / ') : '';
    const typeBadge = job.type ? `<span class="meta-badge">${escHtml(job.type)}</span>` : '';
    const industryBadges = (job.industry || []).map(i => `<span class="tag industry-tag">${escHtml(i)}</span>`).join('');
    const dateBadge = has(job.post_date) ? `<span class="meta-badge post-date">${escHtml(job.post_date)}</span>` : '';
    const copyBtn = has(job.referral_code)
      ? `<button type="button" class="btn btn-outline btn-xs btn-copy" data-code="${escHtml(job.referral_code)}">复制内推码</button>`
      : '';
    const applyBtn = job.referral_url
      ? `<a class="btn btn-primary btn-xs" href="${escHtml(job.referral_url)}" target="_blank" rel="noopener">投递</a>`
      : '';

    return `
      <div class="compact-row view-detail" data-id="${job.id}">
        ${avatar}
        <div class="compact-main">
          <span class="compact-company">${highlight(job.company, kw)}</span>
          <span class="compact-title">${highlight(job.title, kw)}</span>
        </div>
        <div class="compact-tags">${tags}</div>
        <div class="compact-meta">${typeBadge}${industryBadges}${locText ? `<span class="meta-badge">${escHtml(locText)}</span>` : ''}${dateBadge}</div>
        <div class="compact-salary-col">${salary}</div>
        <div class="compact-actions">
          ${copyBtn}
          ${applyBtn}
        </div>
      </div>`;
  },

  compactLinkRow(job, keyword) {
    const { escHtml, highlight, companyAvatar } = Utils;
    const kw = keyword;
    const avatar = companyAvatar(job.company);
    const tags = (job.tags || []).slice(0, 3).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
    const typeBadge = job.type ? `<span class="meta-badge">${escHtml(job.type)}</span>` : '';
    const dateBadge = Utils.has(job.post_date) ? `<span class="meta-badge post-date">${escHtml(job.post_date)}</span>` : '';
    const applyBtn = job.referral_url
      ? `<a class="btn btn-outline btn-xs" href="${escHtml(job.referral_url)}" target="_blank" rel="noopener">访问官网 →</a>`
      : '';

    return `
      <div class="compact-row view-detail" data-id="${job.id}">
        ${avatar}
        <div class="compact-main">
          <span class="compact-company">${highlight(job.company, kw)}</span>
          <span class="compact-title">${highlight(job.title, kw)}</span>
        </div>
        <div class="compact-tags">${tags}</div>
        <div class="compact-meta">${typeBadge}${dateBadge}</div>
        <div class="compact-salary-col"></div>
        <div class="compact-actions">${applyBtn}</div>
      </div>`;
  },

  /* ---- 看板小卡片 ---- */
  boardCard(job, keyword) {
    const { has, escHtml, highlight, companyAvatar } = Utils;
    const kw = keyword;
    const avatar = companyAvatar(job.company, 'sm');
    const tags = (job.tags || []).slice(0, 2).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
    const industryBadges = (job.industry || []).map(i => `<span class="tag industry-tag">${escHtml(i)}</span>`).join('');
    const copyBtn = has(job.referral_code)
      ? `<button type="button" class="btn btn-outline btn-xs btn-copy" data-code="${escHtml(job.referral_code)}">复制</button>`
      : '';

    return `
      <div class="board-card view-detail" data-id="${job.id}">
        <div class="board-card-top">
          ${avatar}
          <div class="board-card-info">
            <div class="board-card-title">${highlight(job.title, kw)}</div>
            <div class="board-card-company">${highlight(job.company, kw)}</div>
          </div>
        </div>
        <div class="board-card-bottom">
          <div class="board-card-badges">${tags}${industryBadges}</div>
          ${copyBtn}
        </div>
      </div>`;
  },

  /* ---- 表格行 <tr> ---- */
  tableRow(job, keyword) {
    const { escHtml, highlight } = Utils;
    const kw = keyword;
    const locs = job.locations || [];
    const locText = locs.length ? locs.slice(0, 3).join(' / ') : '—';
    const industryText = (job.industry || []).join(' / ') || '—';

    return `
      <tr class="table-row view-detail" data-id="${job.id}">
        <td class="td-company">${escHtml(job.company)}</td>
        <td class="td-title">${highlight(job.title, kw)}</td>
        <td class="td-type">${escHtml(job.type || '—')}</td>
        <td class="td-industry">${escHtml(industryText)}</td>
        <td class="td-location">${escHtml(locText)}</td>
        <td class="td-date">${escHtml(job.post_date || '—')}</td>
      </tr>`;
  },

  /* ---- 时间线节点 ---- */
  timelineNode(job, keyword) {
    const { has, escHtml, highlight, companyAvatar } = Utils;
    const kw = keyword;
    const avatar = companyAvatar(job.company, 'sm');
    const type = job.type || '';
    const typeClass = type.includes('校招') ? 'type-campus' :
                      type.includes('实习') ? 'type-intern' : 'type-other';
    const salary = has(job.salary) ? `<span class="tl-salary">${escHtml(job.salary)}</span>` : '';

    return `
      <div class="timeline-node ${typeClass} view-detail" data-id="${job.id}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          ${avatar}
          <div class="timeline-info">
            <div class="timeline-title">${highlight(job.title, kw)}</div>
            <div class="timeline-company">${highlight(job.company, kw)}</div>
            ${salary}
          </div>
        </div>
      </div>`;
  },
};
