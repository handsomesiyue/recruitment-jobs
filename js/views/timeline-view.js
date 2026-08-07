/* ============================================
   招聘信息聚合 - 时间线视图
   按月份分组，月份标题在上方，卡片在下方
   ============================================ */

class TimelineView extends HTMLElement {
  connectedCallback() {
    this.className = 'view-content view-timeline';
  }

  update({ jobs, keyword, sort }) {
    if (!jobs.length) { this.innerHTML = ''; return; }

    // Group jobs by month
    const groups = new Map();
    jobs.forEach(job => {
      const m = job.post_date || '';
      const key = m.slice(0, 7) || '未知';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(job);
    });

    // Sort months: newest first when sort='newest', otherwise oldest first
    const months = [...groups.entries()].sort((a, b) => {
      if (a[0] === '未知') return 1;
      if (b[0] === '未知') return -1;
      const cmp = a[0].localeCompare(b[0]);
      return sort === 'newest' ? -cmp : cmp;
    });

    let html = '<div class="timeline-view">';
    months.forEach(([month, monthJobs]) => {
      const label = month === '未知' ? '未知' : month;
      html += `<div class="timeline-month">`;
      html += `<div class="timeline-month-label"><span class="tl-month-dot"></span>${Utils.escHtml(label)}<span class="tl-month-count">${monthJobs.length}条</span></div>`;
      html += `<div class="timeline-month-cards">`;
      monthJobs.forEach(job => {
        html += JobBlock.timelineNode(job, keyword);
      });
      html += `</div></div>`;
    });
    html += '</div>';
    this.innerHTML = html;
  }
}

customElements.define('timeline-view', TimelineView);
