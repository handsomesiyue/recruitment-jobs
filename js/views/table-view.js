/* ============================================
   招聘信息聚合 - 表格视图
   可点击列头排序（无 → 升序 → 降序 → 无）
   ============================================ */

class TableView extends HTMLElement {
  connectedCallback() {
    this.className = 'view-content view-table';
    this._sortField = '';
    this._sortDir = '';   // '' | 'asc' | 'desc'
  }

  update({ jobs, keyword }) {
    this._jobs = jobs;
    this._keyword = keyword;

    this.innerHTML = `<div class="table-view">
      <table class="data-table">
        <thead><tr>${this._head()}</tr></thead>
        <tbody></tbody>
      </table>
    </div>`;

    this._tbody = this.querySelector('tbody');
    this._renderBody();

    this.querySelector('thead').addEventListener('click', (e) => {
      const th = e.target.closest('th[data-sort]');
      if (!th) return;
      const field = th.dataset.sort;

      if (this._sortField === field) {
        this._sortDir = this._sortDir === '' ? 'asc' : this._sortDir === 'asc' ? 'desc' : '';
        if (!this._sortDir) this._sortField = '';
      } else {
        this._sortField = field;
        this._sortDir = 'asc';
      }

      // Only update header arrows and tbody — keep table structure intact
      this.querySelector('thead tr').innerHTML = this._head();
      this._renderBody();
    });
  }

  /* ---- private helpers ---- */

  _head() {
    const cols = [
      ['company',  '公司'],
      ['title',    '标题'],
      ['type',     '类型'],
      ['location', '城市'],
      ['hc',       'HC'],
      ['date',     '日期'],
    ];
    return cols.map(([key, label]) => {
      const arrow = this._sortField === key
        ? (this._sortDir === 'asc' ? ' ▲' : ' ▼') : '';
      return `<th data-sort="${key}" class="sortable-th">${label}${arrow}</th>`;
    }).join('');
  }

  _sorted() {
    if (!this._sortField || !this._sortDir) return this._jobs;
    const dir = this._sortDir === 'asc' ? 1 : -1;
    const field = this._sortField;
    return this._jobs.slice().sort((a, b) => {
      let va, vb;
      switch (field) {
        case 'company':  va = a.company; vb = b.company; break;
        case 'title':    va = a.title;   vb = b.title;   break;
        case 'type':     va = a.type || '';         vb = b.type || '';         break;
        case 'location': va = (a.locations || []).join(); vb = (b.locations || []).join(); break;
        case 'hc':       va = a.has_hc ? 0 : 1;    vb = b.has_hc ? 0 : 1;    break;
        case 'date':     va = a.post_date || '';    vb = b.post_date || '';    break;
        default: return 0;
      }
      return typeof va === 'number'
        ? (va - vb) * dir
        : String(va).localeCompare(String(vb), 'zh-Hans-CN') * dir;
    });
  }

  _renderBody() {
    this._tbody.innerHTML = this._sorted()
      .map(j => JobBlock.tableRow(j, this._keyword)).join('');
  }
}

customElements.define('table-view', TableView);
