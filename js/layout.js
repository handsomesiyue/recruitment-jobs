/* ============================================
   内容区宽度切换
   三档循环：标准 1200 / 宽屏 1480 / 全宽 100%
   选择写入 localStorage；index.html 的 <head> 里提前应用避免抖动。
   ============================================ */
(function () {
  var KEY = 'site-width';
  var MODES = [
    { key: 'standard', label: '标准' },
    { key: 'wide', label: '宽屏' },
    { key: 'full', label: '全宽' }
  ];
  var DEFAULT_KEY = 'wide';

  var btn = document.getElementById('widthBtn');
  var label = document.getElementById('widthLabel');
  if (!btn || !label) return;

  function readSaved() {
    try { return localStorage.getItem(KEY) || DEFAULT_KEY; } catch (e) { return DEFAULT_KEY; }
  }

  function apply(key) {
    var idx = 0;
    for (var i = 0; i < MODES.length; i++) {
      if (MODES[i].key === key) { idx = i; }
    }
    var m = MODES[idx];
    document.documentElement.setAttribute('data-width', m.key);
    try { localStorage.setItem(KEY, m.key); } catch (e) { /* 隐私模式忽略 */ }
    label.textContent = m.label;
    btn.setAttribute('title', '内容区宽度：' + m.label + '（点击切换）');
  }

  btn.addEventListener('click', function () {
    var cur = readSaved();
    var idx = 0;
    for (var i = 0; i < MODES.length; i++) {
      if (MODES[i].key === cur) { idx = i; }
    }
    apply(MODES[(idx + 1) % MODES.length].key);
  });

  apply(readSaved());
})();
