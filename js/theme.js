/* ============================================
   主题切换
   选择写入 localStorage；index.html 的 <head> 里有一段
   内联脚本会提前应用，避免刷新时闪一下默认配色。
   ============================================ */
(function () {
  var THEMES = [
    { key: 'teal', label: '青绿', color: '#00bead' },
    { key: 'blue', label: '科技蓝', color: '#3b82f6' },
    { key: 'amber', label: '暖阳橙', color: '#f59e0b' },
    { key: 'dark', label: '暗夜', color: '#1b2230' },
  ];
  var STORAGE_KEY = 'site-theme';
  var DEFAULT_KEY = 'teal';

  var btn = document.getElementById('themeBtn');
  var menu = document.getElementById('themeMenu');
  var label = document.getElementById('themeLabel');
  if (!btn || !menu || !label) return;

  function readSaved() {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_KEY; } catch (e) { return DEFAULT_KEY; }
  }

  function apply(key) {
    var t = THEMES.filter(function (x) { return x.key === key; })[0] || THEMES[0];
    document.documentElement.setAttribute('data-theme', t.key);
    try { localStorage.setItem(STORAGE_KEY, t.key); } catch (e) { /* 隐私模式忽略 */ }
    label.textContent = t.label;
    Array.prototype.forEach.call(menu.querySelectorAll('.theme-option'), function (el) {
      el.setAttribute('aria-current', el.getAttribute('data-theme') === t.key ? 'true' : 'false');
    });
  }

  function closeMenu() {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  menu.innerHTML = THEMES.map(function (t) {
    return '<button type="button" class="theme-option" role="menuitem" data-theme="' + t.key + '">' +
      '<span class="theme-swatch" style="background:' + t.color + '"></span>' + t.label +
      '</button>';
  }).join('');

  menu.addEventListener('click', function (e) {
    var opt = e.target.closest ? e.target.closest('.theme-option') : null;
    if (!opt) return;
    apply(opt.getAttribute('data-theme'));
    closeMenu();
  });

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && e.target !== btn) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  apply(readSaved());
})();
