/* ============================================
   招聘信息聚合 - 时间线视图
   按月份分组，水平时间线，节点交替上下排列
   ============================================ */

class TimelineView extends HTMLElement {
  connectedCallback() {
    this.className = 'view-content view-timeline';
  }

  update({ jobs, keyword }) {
    if (!jobs.length) { this.innerHTML = ''; return; }

    // Group jobs by month
    const groups = new Map();
    jobs.forEach(job => {
      const m = job.post_date || '';
      const key = m.slice(0, 7) || '未知'; // "2026-06" or fallback
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(job);
    });

    // Sort months ascending
    const months = [...groups.entries()].sort((a, b) => {
      if (a[0] === '未知') return 1;
      if (b[0] === '未知') return -1;
      return a[0].localeCompare(b[0]);
    });

    // Build HTML
    let html = '<div class="timeline-view"><div class="timeline-track">';
    html += '<div class="timeline-line"></div>';

    months.forEach(([month, monthJobs]) => {
      html += `<div class="timeline-month">`;
      html += `<div class="timeline-month-nodes">`;
      monthJobs.forEach((job, i) => {
        const posClass = i % 2 === 0 ? 'tl-above' : 'tl-below';
        html += `<div class="timeline-node-wrap ${posClass}">`;
        html += JobBlock.timelineNode(job, keyword);
        html += `</div>`;
      });
      html += `</div>`;
      html += `<div class="timeline-month-label">${Utils.escHtml(month === '未知' ? '未知' : month)}</div>`;
      html += `</div>`;
    });

    html += '</div></div>';
    this.innerHTML = html;
  }
}

customElements.define('timeline-view', TimelineView);
