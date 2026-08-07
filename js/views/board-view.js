/* ============================================
   招聘信息聚合 - 看板视图组件
   将岗位按 groupBy 字段分组为多列看板
   ============================================ */

class BoardView extends HTMLElement {
  connectedCallback() {
    this.className = 'view-content view-board';
  }

  update({ jobs, keyword, groupBy }) {
    const groups = this._groupJobs(jobs, groupBy);
    // Sort groups by count descending
    const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

    this.innerHTML = `<div class="board-view">${
      sorted.map(([name, list]) => `
        <div class="board-column">
          <div class="board-column-header">
            <span class="board-column-title">${Utils.escHtml(name)}</span>
            <span class="board-column-count">${list.length}</span>
          </div>
          <div class="board-column-body">
            ${list.map(job => JobBlock.boardCard(job, keyword)).join('')}
          </div>
        </div>
      `).join('')
    }</div>`;
  }

  _groupJobs(jobs, groupBy) {
    const map = new Map();
    for (const job of jobs) {
      const keys = this._resolveKeys(job, groupBy);
      for (const key of keys) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(job);
      }
    }
    return map;
  }

  _resolveKeys(job, groupBy) {
    switch (groupBy) {
      case 'company':
        return [job.company || '未知'];
      case 'type':
        return [job.type || '未知'];
      case 'location':
        return (job.locations && job.locations.length) ? job.locations : ['未知'];
      case 'hc':
        return [job.has_hc ? '有HC' : '暂无HC'];
      default:
        return [job.company || '未知'];
    }
  }
}

customElements.define('board-view', BoardView);
