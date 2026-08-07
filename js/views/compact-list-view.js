/* ============================================
   招聘信息聚合 - 紧凑列表视图
   扁平紧凑行列表，每行约 48px 高
   ============================================ */

class CompactListView extends HTMLElement {
  connectedCallback() {
    this.className = 'view-content view-compact-list';
  }

  /**
   * @param {{ jobs: object[], keyword: string }} params
   */
  update({ jobs, keyword }) {
    if (!jobs || !jobs.length) {
      this.innerHTML = '<div class="empty-state">暂无匹配的招聘信息</div>';
      return;
    }
    const rows = jobs.map(j =>
      j.entry_type === 'link'
        ? JobBlock.compactLinkRow(j, keyword)
        : JobBlock.compactRow(j, keyword)
    ).join('');
    this.innerHTML = `<div class="compact-list">${rows}</div>`;
  }
}

customElements.define('compact-list-view', CompactListView);
