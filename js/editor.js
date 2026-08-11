/* ============================================
   招聘信息聚合 - 岗位编辑器
   新增/编辑/删除招聘信息的表单抽屉（仅桌面版启用）
   依赖 window.desktopAPI（preload 提供）与 app.js 暴露的 JobApp
   ============================================ */

(function () {
  const FIELDS = [
    { key: 'company', label: '公司名称', type: 'text', required: true },
    { key: 'title', label: '招聘标题', type: 'text', required: true },
    { key: 'type', label: '招聘类型', type: 'text' },
    { key: 'target', label: '目标人群', type: 'text' },
    { key: 'positions', label: '岗位分类（逗号分隔）', type: 'text', datalist: 'positions' },
    { key: 'locations', label: '办公地点（逗号分隔）', type: 'text' },
    { key: 'industry', label: '行业（逗号分隔）', type: 'text', datalist: 'industries' },
    { key: 'salary', label: '薪资', type: 'text' },
    { key: 'education', label: '学历要求', type: 'text' },
    { key: 'experience', label: '经验要求', type: 'text' },
    { key: 'has_hc', label: '有 HC', type: 'checkbox' },
    { key: 'hc_detail', label: 'HC 详情', type: 'text' },
    { key: 'referral_code', label: '内推码', type: 'text' },
    { key: 'referral_url', label: '内推链接', type: 'text' },
    { key: 'post_date', label: '发布日期（YYYY-MM）', type: 'month' },
    { key: 'tags', label: '标签（逗号分隔）', type: 'text' },
    { key: 'qr_code', label: '二维码路径', type: 'text' },
    { key: 'description', label: '招聘文案全文', type: 'textarea', full: true },
    { key: 'extra_links', label: '附加链接', type: 'links', full: true },
  ];

  let editorModal = null;
  let editingId = null; // null=新增，数字=编辑

  function ensureModal() {
    if (editorModal) return editorModal;
    editorModal = document.createElement('div');
    editorModal.id = 'editorModal';
    editorModal.className = 'drawer';
    editorModal.style.display = 'none';
    editorModal.innerHTML = `
      <div class="drawer-backdrop"></div>
      <aside class="drawer-panel" role="dialog" aria-modal="true">
        <button class="drawer-close" id="editorClose" type="button" aria-label="关闭">&times;</button>
        <div class="drawer-body">
          <h2 id="editorTitle" class="editor-title">新增招聘信息</h2>
          <form id="editorForm" class="editor-form"></form>
          <div class="editor-actions">
            <button type="button" class="btn btn-outline" id="editorCancel">取消</button>
            <button type="button" class="btn btn-primary" id="editorSave">保存</button>
          </div>
        </div>
      </aside>
    `;
    document.body.appendChild(editorModal);

    editorModal.querySelector('#editorClose').addEventListener('click', closeEditor);
    editorModal.querySelector('#editorCancel').addEventListener('click', closeEditor);
    editorModal.querySelector('.drawer-backdrop').addEventListener('click', closeEditor);
    editorModal.querySelector('#editorSave').addEventListener('click', saveForm);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && editorModal.classList.contains('open')) closeEditor();
    });
    return editorModal;
  }

  function splitList(v) {
    return String(v || '').split(/[,，、;；]/).map(s => s.trim()).filter(Boolean);
  }

  function fieldValue(job, f) {
    const v = job[f.key];
    if (f.key === 'has_hc') return !!v;
    if (Array.isArray(v)) return v.join('，');
    if (f.key === 'extra_links') return v || [];
    return v == null ? '' : v;
  }

  function buildFieldHTML(f, job) {
    const v = fieldValue(job, f);
    const label = `<label class="editor-label">${Utils.escHtml(f.label)}${f.required ? ' <span class="req">*</span>' : ''}</label>`;
    let input;
    if (f.type === 'checkbox') {
      input = `<label class="editor-check"><input type="checkbox" name="${f.key}"${v ? ' checked' : ''}><span>${Utils.escHtml(f.label)}</span></label>`;
      return `<div class="editor-field editor-field-check">${input}</div>`;
    }
    if (f.type === 'textarea') {
      input = `<textarea name="${f.key}" rows="6">${Utils.escHtml(v)}</textarea>`;
    } else if (f.type === 'month') {
      input = `<input type="month" name="${f.key}" value="${Utils.escAttr(v)}">`;
    } else if (f.type === 'links') {
      input = `<div class="editor-links" data-name="${f.key}">${linksHTML(v)}</div>
        <button type="button" class="btn btn-outline btn-xs editor-add-link">+ 添加链接</button>`;
    } else {
      const dl = f.datalist ? ` list="dl-${f.datalist}"` : '';
      input = `<input type="text" name="${f.key}" value="${Utils.escAttr(v)}"${dl}>`;
    }
    const cls = f.full ? 'editor-field editor-field-full' : 'editor-field';
    return `<div class="${cls}">${label}${input}</div>`;
  }

  function linksHTML(links) {
    const arr = Array.isArray(links) && links.length ? links : [{ label: '', url: '' }];
    return arr.map(l => `
      <div class="editor-link-row">
        <input type="text" placeholder="名称" value="${Utils.escAttr(l.label)}">
        <input type="text" placeholder="https://" value="${Utils.escAttr(l.url)}">
        <button type="button" class="editor-del-link" aria-label="删除">&times;</button>
      </div>`).join('');
  }

  function buildDatalists() {
    const opts = (window.JobApp && window.JobApp.options) || { positions: [], industries: [] };
    const mk = (id, list) => `<datalist id="${id}">${(list || []).map(o => `<option value="${Utils.escAttr(o.name)}">`).join('')}</datalist>`;
    return mk('dl-positions', opts.positions) + mk('dl-industries', opts.industries);
  }

  function renderForm(job) {
    const form = editorModal.querySelector('#editorForm');
    form.innerHTML = FIELDS.map(f => buildFieldHTML(f, job)).join('') + buildDatalists();

    form.querySelectorAll('.editor-add-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = btn.previousElementSibling;
        box.insertAdjacentHTML('beforeend', linksHTML([{ label: '', url: '' }]));
      });
    });
    form.querySelectorAll('.editor-links').forEach(box => {
      box.addEventListener('click', (e) => {
        if (e.target.classList.contains('editor-del-link')) {
          const row = e.target.closest('.editor-link-row');
          if (box.querySelectorAll('.editor-link-row').length > 1) row.remove();
          else row.querySelectorAll('input').forEach(i => { i.value = ''; });
        }
      });
    });
  }

  function collectForm() {
    const form = editorModal.querySelector('#editorForm');
    const get = (k) => form.querySelector(`[name="${k}"]`);
    const job = {};
    for (const f of FIELDS) {
      if (f.key === 'extra_links') {
        job.extra_links = [...form.querySelectorAll('.editor-link-row')].map(row => {
          const [l, u] = row.querySelectorAll('input');
          return { label: l.value.trim(), url: u.value.trim() };
        }).filter(l => l.label || l.url);
        continue;
      }
      const el = get(f.key);
      if (!el) continue;
      if (f.key === 'has_hc') { job.has_hc = el.checked; continue; }
      if (f.type === 'month') { job.post_date = el.value || ''; continue; }
      if (f.key === 'positions' || f.key === 'locations' || f.key === 'industry' || f.key === 'tags') {
        job[f.key] = splitList(el.value);
        continue;
      }
      job[f.key] = el.value.trim();
    }
    return job;
  }

  function nextId() {
    const jobs = window.JobApp.state.jobs;
    return jobs.length ? Math.max(...jobs.map(j => Number(j.id) || 0)) + 1 : 1;
  }

  function openEditor(job) {
    ensureModal();
    editingId = job && job.id != null ? job.id : null;
    editorModal.querySelector('#editorTitle').textContent = editingId == null ? '新增招聘信息' : '编辑招聘信息';
    renderForm(job || {});
    editorModal.style.display = 'flex';
    requestAnimationFrame(() => editorModal.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }

  function closeEditor() {
    if (!editorModal) return;
    editorModal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!editorModal.classList.contains('open')) editorModal.style.display = 'none';
    }, 250);
  }

  async function saveForm() {
    const job = collectForm();
    if (!job.company || !job.title) {
      Utils.toast('公司名称与招聘标题为必填项');
      return;
    }
    if (editingId == null) job.id = nextId();
    else job.id = editingId;

    const saveBtn = editorModal.querySelector('#editorSave');
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中…';
    try {
      const jobs = window.JobApp.state.jobs.slice();
      const idx = jobs.findIndex(j => j.id === job.id);
      // 编辑时保留表单未覆盖的原有字段（如 entry_type）
      const merged = idx >= 0 ? Object.assign({}, jobs[idx], job) : job;
      if (idx >= 0) jobs[idx] = merged; else jobs.push(merged);
      const res = await window.desktopAPI.saveJobs(jobs);
      if (!res || !res.ok) throw new Error((res && res.error) || '保存失败');
      window.JobApp.replaceJobs(jobs);
      Utils.toast('已保存');
      closeEditor();
    } catch (e) {
      Utils.toast('保存失败：' + (e && e.message ? e.message : e));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '保存';
    }
  }

  async function deleteJob(job) {
    if (!window.confirm(`确定删除「${job.company} · ${job.title}」吗？`)) return;
    try {
      const jobs = window.JobApp.state.jobs.filter(j => j.id !== job.id);
      const res = await window.desktopAPI.saveJobs(jobs);
      if (!res || !res.ok) throw new Error((res && res.error) || '删除失败');
      window.JobApp.replaceJobs(jobs);
      Utils.toast('已删除');
    } catch (e) {
      Utils.toast('删除失败：' + (e && e.message ? e.message : e));
    }
  }

  window.JobEditor = {
    openNew: () => openEditor(null),
    openEdit: (job) => openEditor(job),
    onDelete: (job) => deleteJob(job),
    close: closeEditor,
  };
})();
