/* ============================================
   招聘信息聚合 - AI 助手
   粘贴招聘信息 → 智能解析 → 预填编辑器表单（仅桌面版启用）
   依赖 window.desktopAPI.aiParse（main.js 主进程调 OpenAI 兼容接口）
   解析结果通过 window.JobEditor.openEdit 复用现有编辑器与保存链路
   ============================================ */

(function () {
  let aiModal = null;
  let configured = false;
  let parsedJob = null; // 最近一次解析结果，供「编辑并保存」使用
  let configLoaded = false;

  // AI 错误码 → 中文提示（ipcRenderer.invoke 的 reject message 即错误码）
  const ERROR_TEXT = {
    AI_NOT_CONFIGURED: '请先配置 API 后再使用',
    AI_AUTH_FAILED: 'API Key 无效或已过期',
    AI_RATE_LIMITED: '请求过于频繁，请稍后重试',
    AI_TIMEOUT: '解析超时，请重试',
    AI_NETWORK: '网络错误，请检查网络后重试',
    AI_TEXT_TOO_SHORT: '文本过短，请粘贴完整的招聘信息',
    AI_BAD_JSON: 'AI 返回内容无法解析，请重试',
    AI_PARSE_FAILED: 'AI 未返回有效内容，请重试',
    AI_MISSING_REQUIRED: '未能识别公司名称和招聘标题',
  };

  function friendlyError(err) {
    const code = err && typeof err.message === 'string' ? err.message : '';
    if (ERROR_TEXT[code]) return ERROR_TEXT[code];
    if (code.startsWith('AI_HTTP_')) return '接口返回错误（HTTP ' + code.slice(7) + '）';
    return '解析失败：' + (err && err.message ? err.message : '未知错误');
  }

  function ensureModal() {
    if (aiModal) return aiModal;
    aiModal = document.createElement('div');
    aiModal.id = 'aiModal';
    aiModal.className = 'drawer';
    aiModal.style.display = 'none';
    aiModal.innerHTML = `
      <div class="drawer-backdrop"></div>
      <aside class="drawer-panel" role="dialog" aria-modal="true">
        <button class="drawer-close" id="aiClose" type="button" aria-label="关闭">&times;</button>
        <div class="drawer-body">
          <h2 class="editor-title">AI 助手</h2>
          <p class="ai-hint">粘贴招聘信息文本，AI 帮你解析成岗位并填入表单</p>

          <!-- 配置面板（未配置时显示） -->
          <div id="aiConfigPane" class="ai-config" style="display:none">
            <label class="editor-label">API BaseURL</label>
            <input id="aiBaseUrl" class="ai-config-input" type="text" placeholder="如 https://api.deepseek.com">
            <label class="editor-label">模型</label>
            <input id="aiModel" class="ai-config-input" type="text" placeholder="如 deepseek-chat">
            <label class="editor-label">API Key</label>
            <input id="aiApiKey" class="ai-config-input" type="password" placeholder="sk-…（仅保存在本机，不会随包分发）">
            <button type="button" class="btn btn-primary" id="aiSaveConfig">保存配置</button>
          </div>

          <!-- 聊天消息区 -->
          <div id="aiChat" class="ai-chat"></div>

          <!-- 输入区 -->
          <div class="ai-input">
            <textarea id="aiInput" class="ai-input-box" rows="3" placeholder="粘贴招聘信息文本…"></textarea>
            <button type="button" class="btn btn-primary" id="aiSend">发送</button>
          </div>
        </div>
      </aside>
    `;
    document.body.appendChild(aiModal);

    aiModal.querySelector('#aiClose').addEventListener('click', close);
    aiModal.querySelector('.drawer-backdrop').addEventListener('click', close);
    aiModal.querySelector('#aiSend').addEventListener('click', send);
    aiModal.querySelector('#aiSaveConfig').addEventListener('click', saveConfig);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && aiModal.classList.contains('open')) close();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiModal.classList.contains('open')) send();
    });
    return aiModal;
  }

  // ---- 消息渲染 ----
  function addUserMessage(text) {
    const chat = aiModal.querySelector('#aiChat');
    chat.insertAdjacentHTML('beforeend',
      `<div class="ai-msg ai-msg-user"><div class="ai-bubble">${Utils.escHtml(text)}</div></div>`);
    scrollChat(chat);
  }

  function addLoading() {
    const chat = aiModal.querySelector('#aiChat');
    chat.insertAdjacentHTML('beforeend',
      `<div class="ai-msg ai-msg-ai" id="aiLoading"><div class="ai-bubble ai-bubble-loading">解析中…</div></div>`);
    scrollChat(chat);
  }

  function removeLoading() {
    const el = aiModal && aiModal.querySelector('#aiLoading');
    if (el) el.remove();
  }

  function scrollChat(chat) {
    chat.scrollTop = chat.scrollHeight;
  }

  function addResultCard(job) {
    parsedJob = job;
    const chat = aiModal.querySelector('#aiChat');
    const pos = (job.positions || []).join(' / ');
    const ind = (job.industry || []).join(' / ');
    const loc = (job.locations || []).join(' / ');
    const rows = [
      ['公司', job.company],
      ['标题', job.title],
      ['类型', job.type],
      ['薪资', job.salary],
      ['岗位', pos],
      ['行业', ind],
      ['地点', loc],
    ].filter(([, v]) => v).map(([k, v]) =>
      `<div class="ai-result-row"><span class="ai-result-key">${Utils.escHtml(k)}</span><span class="ai-result-val">${Utils.escHtml(v)}</span></div>`).join('');
    chat.insertAdjacentHTML('beforeend', `
      <div class="ai-msg ai-msg-ai">
        <div class="ai-bubble">
          <div class="ai-result-card">
            <div class="ai-result-title">已解析出岗位</div>
            ${rows}
          </div>
          <div class="ai-result-actions">
            <button type="button" class="btn btn-primary btn-xs" id="aiEditSave">编辑并保存</button>
            <button type="button" class="btn btn-outline btn-xs" id="aiReparse">重新解析</button>
          </div>
        </div>
      </div>`);
    aiModal.querySelector('#aiEditSave').addEventListener('click', editAndSave);
    aiModal.querySelector('#aiReparse').addEventListener('click', () => {
      aiModal.querySelector('#aiInput').focus();
      Utils.toast('请修改文本后重新发送');
    });
    scrollChat(chat);
  }

  function addAiError(err) {
    const chat = aiModal.querySelector('#aiChat');
    chat.insertAdjacentHTML('beforeend',
      `<div class="ai-msg ai-msg-ai"><div class="ai-bubble ai-bubble-error">${Utils.escHtml(friendlyError(err))}</div></div>`);
    scrollChat(chat);
  }

  // ---- 交互 ----
  async function send() {
    if (!configured) {
      aiModal.querySelector('#aiConfigPane').style.display = '';
      Utils.toast('请先配置 API');
      return;
    }
    const input = aiModal.querySelector('#aiInput');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';
    addLoading();
    const sendBtn = aiModal.querySelector('#aiSend');
    sendBtn.disabled = true;
    try {
      const res = await window.desktopAPI.aiParse({ text });
      removeLoading();
      addResultCard(res.job);
    } catch (err) {
      removeLoading();
      addAiError(err);
      // 配置缺失/失效时顺带弹出配置面板，便于直接修改
      if (err && err.message === 'AI_NOT_CONFIGURED') {
        aiModal.querySelector('#aiConfigPane').style.display = '';
      }
    } finally {
      sendBtn.disabled = false;
    }
  }

  async function saveConfig() {
    const baseUrl = aiModal.querySelector('#aiBaseUrl').value.trim();
    const model = aiModal.querySelector('#aiModel').value.trim();
    const apiKey = aiModal.querySelector('#aiApiKey').value.trim();
    if (!baseUrl || !model || !apiKey) {
      Utils.toast('三项配置均需填写');
      return;
    }
    const btn = aiModal.querySelector('#aiSaveConfig');
    btn.disabled = true;
    btn.textContent = '保存中…';
    try {
      const res = await window.desktopAPI.aiSetConfig({ baseUrl, apiKey, model });
      if (res && res.ok) {
        configured = true;
        aiModal.querySelector('#aiConfigPane').style.display = 'none';
        Utils.toast('配置已保存');
      }
    } catch (err) {
      Utils.toast('保存失败：' + (err && err.message ? err.message : err));
    } finally {
      btn.disabled = false;
      btn.textContent = '保存配置';
    }
  }

  // 关闭 AI 抽屉 → 预填现有编辑器表单 → 保存完全走编辑器现有链路
  function editAndSave() {
    if (!parsedJob) return;
    close();
    window.JobEditor.openEdit(parsedJob);
  }

  // ---- 打开 / 关闭 ----
  async function open() {
    ensureModal();
    aiModal.style.display = 'flex';
    requestAnimationFrame(() => aiModal.classList.add('open'));
    document.body.style.overflow = 'hidden';

    if (!configLoaded && window.desktopAPI && window.desktopAPI.aiGetConfig) {
      try {
        const info = await window.desktopAPI.aiGetConfig();
        configured = !!(info && info.configured);
      } catch (e) {
        configured = false;
      }
      configLoaded = true;
    }
    if (!configured) {
      aiModal.querySelector('#aiConfigPane').style.display = '';
    }
    setTimeout(() => aiModal.querySelector('#aiInput').focus(), 300);
  }

  function close() {
    if (!aiModal) return;
    aiModal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!aiModal.classList.contains('open')) aiModal.style.display = 'none';
    }, 250);
  }

  window.AIAssistant = { open, close };
})();
