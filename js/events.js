/* ============================================
   宣讲会板块渲染
   数据来自 data/events.js（window.__EVENTS_DATA__），按日期分组。
   ============================================ */
(function () {
  var DATA = window.__EVENTS_DATA__ || [];
  var listEl = document.getElementById('eventsList');
  var emptyEl = document.getElementById('emptyEvents');
  if (!listEl) return;

  if (!DATA.length) {
    if (emptyEl) emptyEl.style.display = '';
    return;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function parseDate(d) {
    var p = String(d || '').split('-');
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function todayStr() {
    var t = new Date();
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }

  function fmtDay(d) {
    var dt = parseDate(d);
    return (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
  }

  function fmtWeek(d) {
    return '周' + ['日', '一', '二', '三', '四', '五', '六'][parseDate(d).getDay()];
  }

  // 截止日显示：跨年补年份，已过标红
  function fmtDeadline(dl) {
    if (!dl) return '';
    var parts = String(dl).split(' ');
    var dt = parseDate(parts[0]);
    var label = (dt.getMonth() + 1) + '-' + dt.getDate() + (parts[1] ? ' ' + parts[1] : '');
    var overdue = parts[0] < todayStr();
    return '<span class="event-deadline' + (overdue ? ' is-overdue' : '') + '">' +
      (overdue ? '已截止 ' : '截止 ') + esc(label) + '</span>';
  }

  function badgeOf(e) {
    var text = e.badge || '';
    var cls = 'badge-fair';
    if (text.indexOf('实习') > -1) cls = 'badge-both';
    else if (text.indexOf('校招') > -1) cls = 'badge-campus';
    else if (e.event_type === '宣讲会') cls = 'badge-campus';
    if (!text) text = e.event_type || '';
    if (!text) return '';
    return '<span class="event-badge ' + cls + '">' + esc(text) + '</span>';
  }

  function card(e, isToday) {
    var rows = (e.rows || []).map(function (r) {
      return '<div class="event-row"><span class="row-label">' + esc(r.label) + '</span>' +
        '<span class="row-text">' + esc(r.text) + '</span></div>';
    }).join('');

    var tags = [];
    if (e.event_type) tags.push('<span class="event-tag tag-type">' + esc(e.event_type) + '</span>');
    (e.tags || []).forEach(function (t) {
      tags.push('<span class="event-tag">' + esc(t) + '</span>');
    });

    var when = '';
    if (e.time || e.venue) {
      when = '<div class="event-when">' +
        (e.time ? '<span class="event-time">' + esc(e.time) + '</span>' : '') +
        (e.venue ? '<span class="event-venue">' + esc(e.venue) + '</span>' : '') +
        '</div>';
    }

    var foot = '';
    if (e.deadline || e.contact || e.link) {
      foot = '<div class="event-foot">' +
        (e.deadline ? fmtDeadline(e.deadline) : '') +
        (e.contact ? '<span class="event-contact">' + esc(e.contact) + '</span>' : '') +
        (e.link ? '<a class="event-link" href="' + esc(e.link.url) + '" target="_blank" rel="noopener">' +
          esc(e.link.label || '查看详情') + ' →</a>' : '') +
        '</div>';
    }

    var cls = 'event-card';
    if (isToday) cls += ' is-today';
    if (e.tentative) cls += ' is-tentative';

    return '<article class="' + cls + '" data-type="' + esc(e.event_type) + '">' +
      '<div class="event-head">' +
        '<div class="event-head-main">' +
          '<h3 class="event-company">' + esc(e.company) + '</h3>' +
          (e.title ? '<p class="event-title">' + esc(e.title) + '</p>' : '') +
        '</div>' +
        badgeOf(e) +
      '</div>' +
      when +
      (tags.length ? '<div class="event-tags">' + tags.join('') + '</div>' : '') +
      (rows ? '<div class="event-rows">' + rows + '</div>' : '') +
      (e.note ? '<p class="event-note">' + esc(e.note) + '</p>' : '') +
      foot +
      '</article>';
  }

  var today = todayStr();
  var order = [];
  var buckets = {};
  var tentative = [];

  DATA.forEach(function (e) {
    if (e.tentative || !e.date) { tentative.push(e); return; }
    if (!buckets[e.date]) { buckets[e.date] = []; order.push(e.date); }
    buckets[e.date].push(e);
  });
  order.sort();

  var html = order.map(function (date) {
    var items = buckets[date];
    var isToday = date === today;
    return '<section class="event-day' + (isToday ? ' is-today' : '') + '">' +
      '<h2 class="event-day-head">' +
        '<span class="day-bar" aria-hidden="true"></span>' +
        '<span class="day-date">' + fmtDay(date) + '</span>' +
        '<span class="day-week">' + fmtWeek(date) + (isToday ? ' · 今天' : '') + '</span>' +
        '<span class="day-count">' + items.length + ' 场</span>' +
      '</h2>' +
      '<div class="event-grid">' + items.map(function (e) { return card(e, isToday); }).join('') + '</div>' +
    '</section>';
  }).join('');

  if (tentative.length) {
    html += '<section class="event-day is-tentative-day">' +
      '<h2 class="event-day-head">' +
        '<span class="day-bar" aria-hidden="true"></span>' +
        '<span class="day-date">待定 / 外校场次</span>' +
        '<span class="day-count">' + tentative.length + ' 场</span>' +
      '</h2>' +
      '<div class="event-grid">' + tentative.map(function (e) { return card(e, false); }).join('') + '</div>' +
    '</section>';
  }

  listEl.innerHTML = html;
})();
