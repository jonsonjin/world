(function () {
  'use strict';

  var RATE = 36.72; // 1 EUR = 36.72 TWD（固定匯率）
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var gmaps = function (q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); };

  /* ---------- 📍 地點連結 ---------- */
  $$('a.pin').forEach(function (a) {
    if (!a.getAttribute('href') && a.dataset.q) a.href = gmaps(a.dataset.q);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- 手機表格：補上欄位標籤 ---------- */
  $$('table.info').forEach(function (tb) {
    var heads = $$('thead th', tb).map(function (th) { return th.textContent.trim(); });
    $$('tbody tr', tb).forEach(function (tr) {
      $$('td', tr).forEach(function (td, i) { td.setAttribute('data-label', heads[i] || ''); });
    });
  });

  /* ---------- 時段底色 ---------- */
  $$('table.sched td.t').forEach(function (td) {
    var m = td.textContent.match(/(\d{1,2}):\d{2}/);
    if (!m) return;
    var h = parseInt(m[1], 10);
    var cls = h >= 5 && h < 12 ? 't-morning' : h >= 12 && h < 17 ? 't-afternoon' : h >= 17 && h < 20 ? 't-evening' : 't-night';
    td.classList.add(cls);
  });

  /* ---------- Dialog 共用 ---------- */
  function openDlg(d) {
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeDlg(d) {
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('close', function () { document.documentElement.style.overflow = ''; });
    d.addEventListener('click', function (e) { if (e.target === d) closeDlg(d); }); // 點背景關閉
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { closeDlg(d); }); });
  });

  /* ---------- 匯率換算 ---------- */
  var fxDlg = $('#fxDlg'), fxAmt = $('#fxAmt'), fxRes = $('#fxRes');
  var dir = 'e2t';
  var QUICK = { e2t: [5, 10, 20, 50, 100], t2e: [100, 500, 1000, 3000, 5000] };

  function fmt(n) { return Math.round(n).toLocaleString('zh-TW'); }
  function calc() {
    var v = parseFloat(String(fxAmt.value).replace(/,/g, ''));
    if (!isFinite(v)) { fxRes.textContent = '0'; return; }
    fxRes.textContent = fmt(dir === 'e2t' ? v * RATE : v / RATE);
  }
  function renderQuick() {
    var box = $('#fxQuick');
    box.innerHTML = '';
    QUICK[dir].forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = (dir === 'e2t' ? '€' : 'NT$') + n.toLocaleString('zh-TW');
      b.addEventListener('click', function () { fxAmt.value = n; calc(); fxAmt.focus(); fxAmt.select(); });
      box.appendChild(b);
    });
  }
  function setDir(d) {
    dir = d;
    $$('.fx-dir button').forEach(function (b) { b.classList.toggle('on', b.dataset.dir === d); });
    $('#fxFromCur').textContent = d === 'e2t' ? '€' : 'NT$';
    $('#fxToCur').textContent = d === 'e2t' ? 'NT$' : '€';
    renderQuick();
    calc();
    fxAmt.focus(); fxAmt.select();
  }
  $$('.fx-dir button').forEach(function (b) { b.addEventListener('click', function () { setDir(b.dataset.dir); }); });
  fxAmt.addEventListener('input', function () {
    fxAmt.value = fxAmt.value.replace(/[^\d.,]/g, '');
    calc();
  });
  $('#openFx').addEventListener('click', function () {
    openDlg(fxDlg);
    fxAmt.focus();
    fxAmt.select();
    // 部分行動瀏覽器需延遲再選取一次
    setTimeout(function () { fxAmt.focus(); fxAmt.select(); }, 60);
  });
  renderQuick(); calc();

  /* ---------- 每日行程選單 ---------- */
  var dayDlg = $('#dayDlg'), dayList = $('#dayList');
  $$('details.day').forEach(function (d) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<span class="dl-date"></span><span class="dl-title"></span>';
    $('.dl-date', b).textContent = d.dataset.date;
    $('.dl-title', b).textContent = d.dataset.title;
    b.addEventListener('click', function () {
      closeDlg(dayDlg);
      d.open = true;
      requestAnimationFrame(function () { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    });
    li.appendChild(b);
    dayList.appendChild(li);
  });
  $('#openDays').addEventListener('click', function () { openDlg(dayDlg); });

  /* ---------- 簡易步行地圖 ---------- */
  // lp: 標籤位置 r/l/t/b；mode: 抵達此點的交通方式（預設步行）
  var MAPS = {
    '1125': { title: '11/25 羅馬老城', stops: [
      { n: '飯店', q: 'The Independent Hotel Rome', lat: 41.9043, lng: 12.4990, lp: 't' },
      { n: '共和廣場', q: 'Piazza della Repubblica Roma', lat: 41.9027, lng: 12.4964, lp: 'b' },
      { n: '四泉街', q: 'Le Quattro Fontane Roma', lat: 41.9015, lng: 12.4910, lp: 'b' },
      { n: '許願池', q: 'Fontana di Trevi', lat: 41.9009, lng: 12.4833, lp: 'b' },
      { n: '西班牙階梯', q: 'Piazza di Spagna Roma', lat: 41.9060, lng: 12.4828, lp: 'r' },
      { n: '人民廣場', q: 'Piazza del Popolo Roma', lat: 41.9107, lng: 12.4763, lp: 'l' },
      { n: '平丘露台', q: 'Terrazza del Pincio Roma', lat: 41.9113, lng: 12.4800, lp: 'r' },
      { n: '萬神殿', q: 'Pantheon Roma', lat: 41.8986, lng: 12.4769, lp: 'b' },
      { n: '納沃納廣場', q: 'Piazza Navona Roma', lat: 41.8992, lng: 12.4731, lp: 't' }
    ]},
    '1126': { title: '11/26 梵蒂岡', stops: [
      { n: 'Ottaviano 地鐵站', q: 'Ottaviano Metro Station Roma', lat: 41.9093, lng: 12.4580, lp: 'r' },
      { n: '梵蒂岡博物館入口', q: 'Musei Vaticani Viale Vaticano', lat: 41.9067, lng: 12.4536, lp: 'l' },
      { n: '聖彼得廣場', q: 'Piazza San Pietro', lat: 41.9022, lng: 12.4572, lp: 'b' },
      { n: '聖彼得大教堂', q: 'Basilica di San Pietro', lat: 41.9022, lng: 12.4536, lp: 't' },
      { n: '聖天使堡', q: "Castel Sant'Angelo", lat: 41.9031, lng: 12.4663, lp: 't' },
      { n: '聖天使橋', q: "Ponte Sant'Angelo", lat: 41.9016, lng: 12.4666, lp: 'b' }
    ]},
    '1127': { title: '11/27 古羅馬區', stops: [
      { n: 'Colosseo 地鐵站', q: 'Colosseo Metro Station Roma', lat: 41.8917, lng: 12.4930, lp: 'r' },
      { n: '羅馬競技場', q: 'Colosseo Roma', lat: 41.8902, lng: 12.4922, lp: 'r' },
      { n: '帕拉蒂尼山', q: 'Palatino Roma', lat: 41.8893, lng: 12.4875, lp: 'b' },
      { n: '古羅馬廣場', q: 'Foro Romano', lat: 41.8925, lng: 12.4853, lp: 'r' },
      { n: '卡比托利歐廣場', q: 'Piazza del Campidoglio Roma', lat: 41.8934, lng: 12.4828, lp: 'l' },
      { n: '威尼斯廣場', q: 'Piazza Venezia Roma', lat: 41.8960, lng: 12.4826, lp: 't' },
      { n: '真理之口', q: 'Bocca della Verità Roma', lat: 41.8881, lng: 12.4815, lp: 'b' },
      { n: '勝利神廟', q: 'Tempio di Ercole Vincitore Roma', lat: 41.8888, lng: 12.4802, lp: 'l' },
      { n: '橘園', q: 'Giardino degli Aranci Roma', lat: 41.8848, lng: 12.4797, lp: 'r' },
      { n: '騎士團鎖孔', q: 'Buco della Serratura Aventino Roma', lat: 41.8832, lng: 12.4777, lp: 'l' }
    ]},
    '1128': { title: '11/28 佛羅倫斯', stops: [
      { n: 'Firenze S.M.N. 車站', q: 'Firenze Santa Maria Novella station', lat: 43.7764, lng: 11.2480, lp: 'r' },
      { n: '百花大教堂', q: 'Cattedrale di Santa Maria del Fiore Firenze', lat: 43.7731, lng: 11.2562, lp: 'r' },
      { n: '洗禮堂', q: 'Battistero di San Giovanni Firenze', lat: 43.7731, lng: 11.2548, lp: 'l' },
      { n: '學院美術館', q: "Galleria dell'Accademia Firenze", lat: 43.7768, lng: 11.2586, lp: 'r' },
      { n: '領主廣場', q: 'Piazza della Signoria Firenze', lat: 43.7696, lng: 11.2558, lp: 'r' },
      { n: '老橋', q: 'Ponte Vecchio Firenze', lat: 43.7680, lng: 11.2531, lp: 'l' },
      { n: '米開朗基羅廣場', q: 'Piazzale Michelangelo Firenze', lat: 43.7629, lng: 11.2650, lp: 'l', mode: 'car' }
    ]},
    '1129': { title: '11/29 威尼斯本島', stops: [
      { n: 'Santa Lucia 車站', q: 'Venezia Santa Lucia station', lat: 45.4410, lng: 12.3210, lp: 'b' },
      { n: '里亞托橋', q: 'Ponte di Rialto Venezia', lat: 45.4380, lng: 12.3359, lp: 't' },
      { n: '聖馬可廣場', q: 'Piazza San Marco Venezia', lat: 45.4341, lng: 12.3380, lp: 'b' },
      { n: '嘆息橋', q: 'Ponte dei Sospiri Venezia', lat: 45.4340, lng: 12.3409, lp: 't' }
    ]},
    '1130': { title: '11/30 聖馬可區', stops: [
      { n: 'San Zaccaria 碼頭', q: 'San Zaccaria vaporetto Venezia', lat: 45.4334, lng: 12.3430, lp: 'b' },
      { n: '總督宮', q: 'Palazzo Ducale Venezia', lat: 45.4337, lng: 12.3404, lp: 'b' },
      { n: '聖馬可廣場', q: 'Piazza San Marco Venezia', lat: 45.4341, lng: 12.3380, lp: 'l' },
      { n: 'Rasse 集合點', q: 'Calle de le Rasse 4536 Venezia', lat: 45.4344, lng: 12.3424, lp: 'r' },
      { n: '聖馬可大教堂', q: 'Basilica di San Marco Venezia', lat: 45.4345, lng: 12.3397, lp: 't' },
      { n: '返回 San Zaccaria', q: 'San Zaccaria vaporetto Venezia', lat: 45.4334, lng: 12.3430, lp: 'r', ret: true }
    ]}
  };

  function hav(a, b) {
    var R = 6371000, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function legInfo(a, b) {
    var straight = hav(a, b);
    if (b.mode === 'car') {
      var dc = straight * 1.5;
      return { d: dc, txt: '約 ' + fmtDist(dc), sub: '車程約 ' + Math.max(5, Math.round(dc / 250)) + ' 分', car: true };
    }
    var d = straight * 1.3;              // 街道繞行係數
    var min = Math.max(1, Math.round(d / 70)); // 約 4.2 km/h
    return { d: d, txt: '約 ' + fmtDist(d), sub: '步行約 ' + min + ' 分' };
  }
  function textW(t) { var w = 0; for (var c of t) w += /[\u2E80-\uFFFF]/.test(c) ? 12.5 : 7; return w; }
  function fmtDist(m) { return m < 1000 ? (Math.round(m / 10) * 10) + ' m' : (m / 1000).toFixed(1) + ' km'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function buildMap(key) {
    var m = MAPS[key];
    var stops = m.stops;
    var W = 360, padX = 70, padY = 50;
    var midLat = stops.reduce(function (s, p) { return s + p.lat; }, 0) / stops.length;
    var k = Math.cos(midLat * Math.PI / 180);
    var xs = stops.map(function (p) { return p.lng * k; }), ys = stops.map(function (p) { return p.lat; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var dX = (maxX - minX) || 1e-6, dY = (maxY - minY) || 1e-6;
    var sc = Math.min((W - 2 * padX) / dX, (460 - 2 * padY) / dY);
    var H = Math.max(280, Math.min(460, dY * sc + 2 * padY + 20));
    var offX = (W - (maxX - minX) * sc) / 2, offY = (H - (maxY - minY) * sc) / 2;
    var P = stops.map(function (p) {
      return { x: offX + (p.lng * k - minX) * sc, y: offY + (maxY - p.lat) * sc };
    });

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(m.title) + ' 示意地圖">';
    svg += '<defs><pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#eadfc6" stroke-width="1"/></pattern></defs>';
    svg += '<rect width="' + W + '" height="' + H + '" fill="#fbf6ea"/><rect width="' + W + '" height="' + H + '" fill="url(#g)"/>';

    // 北方指示
    svg += '<g transform="translate(' + (W - 30) + ',34)"><circle r="17" fill="#fff" stroke="#1f4d3a" stroke-width="1.5"/>' +
      '<path d="M0 -12 L6 6 L0 2 L-6 6 Z" fill="#a8432b"/><text y="-21" text-anchor="middle" font-size="11" font-weight="700" fill="#1f4d3a">N</text></g>';

    // 路線
    var legs = [];
    for (var i = 1; i < stops.length; i++) {
      var a = P[i - 1], b = P[i], info = legInfo(stops[i - 1], stops[i]);
      legs.push({ from: i, to: i + 1, info: info });
      svg += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) +
        '" stroke="#c0392b" stroke-width="3" stroke-dasharray="' + (info.car ? '2 6' : '8 6') + '" stroke-linecap="round"/>';
    }
    // 距離標籤
    for (var j = 1; j < stops.length; j++) {
      var p1 = P[j - 1], p2 = P[j], lg = legs[j - 1];
      var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      var dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len * 11, ny = dx / len * 11;
      var lx = Math.min(W - 34, Math.max(34, mx + nx)), ly = Math.min(H - 10, Math.max(14, my + ny));
      var label = lg.info.sub.replace('步行約 ', '').replace('車程約 ', '🚕') ;
      var tw = label.length * 6.4 + 10;
      svg += '<g><rect x="' + (lx - tw / 2).toFixed(1) + '" y="' + (ly - 9).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="16" rx="8" fill="#fff" stroke="#e7b6a5"/>' +
        '<text x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#a8432b">' + esc(label) + '</text></g>';
    }
    // 景點
    stops.forEach(function (s, i) {
      if (s.ret) return; // 返回點與起點重疊，不重畫
      var p = P[i], lp = s.lp || 'r', tx = p.x, ty = p.y, anc = 'middle';
      if (lp === 'r') { tx = p.x + 16; ty = p.y + 4; anc = 'start'; }
      if (lp === 'l') { tx = p.x - 16; ty = p.y + 4; anc = 'end'; }
      if (lp === 't') { ty = p.y - 17; }
      if (lp === 'b') { ty = p.y + 26; }
      var tw2 = textW(s.n);
      if (anc === 'start' && tx + tw2 > W - 6) { tx = p.x - 16; anc = 'end'; }
      if (anc === 'end' && tx - tw2 < 6) { tx = p.x + 16; anc = 'start'; }
      if (anc === 'middle') tx = Math.min(W - 6 - tw2 / 2, Math.max(6 + tw2 / 2, tx));
      svg += '<a class="stop" href="' + esc(gmaps(s.q)) + '" target="_blank" rel="noopener" tabindex="0">' +
        '<circle class="dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="11" fill="#1f4d3a" stroke="#fff" stroke-width="2"/>' +
        '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 4).toFixed(1) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">' + (i + 1) + '</text>' +
        '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="' + anc + '" font-size="12" font-weight="700" fill="#2a2420" ' +
        'stroke="#fbf6ea" stroke-width="4" paint-order="stroke" stroke-linejoin="round">' + esc(s.n) + '</text></a>';
    });
    svg += '</svg>';

    $('#mapTitle').textContent = m.title + ' 簡易地圖';
    $('#mapSvg').innerHTML = svg;
    var names = stops.map(function (s, i) { return s.ret ? '1' : String(i + 1); });
    $('#mapLegs').innerHTML = legs.map(function (l) {
      var a = stops[l.from - 1], b = stops[l.to - 1];
      return '<li><span>' + names[l.from - 1] + ' ' + esc(a.n) + ' → ' + names[l.to - 1] + ' ' + esc(b.n) + (l.info.car ? '（建議搭車）' : '') + '</span>' +
        '<span class="lg-dist">' + l.info.txt + '・' + l.info.sub + '</span></li>';
    }).join('');
  }

  var mapDlg = $('#mapDlg');
  $$('.map-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      buildMap(b.dataset.map);
      openDlg(mapDlg);
      mapDlg.scrollTop = 0;
    });
  });
})();
