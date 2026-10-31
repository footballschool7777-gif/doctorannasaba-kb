/* «Код любви»: тест → результат → расшифровка → практикум. Тексты берутся из data/ без изменений. */
(function () {
  'use strict';
  var BOT_URL = '#bot'; // TODO: ссылка на бота выдачи расшифровки
  var D = window.KL_DATA, T = D.test, DEC = D.dec;
  var app = document.getElementById('app');
  var bar = document.querySelector('.thread'), barI = bar.querySelector('i');
  var backBtn = document.querySelector('.back');
  var sticky = document.querySelector('.sticky');
  var modal = document.querySelector('.modal');
  var params = new URLSearchParams(location.search);
  var st = { seg: null, ans: [], qs: [], result: null };

  /* ---------- analytics ---------- */
  function track(ev, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: 'kl_' + ev, result: st.result }, data || {}));
  }

  /* ---------- typography: glue short words, no orphan last word ---------- */
  var NB = ' ';
  function nb(s) {
    s = s.replace(/(^|[\s(«"])([A-Za-zА-Яа-яЁё]{1,3})\s(?=\S)/g, function (m, a, w) { return a + w + NB; });
    s = s.replace(/(^|[\s(«"])([A-Za-zА-Яа-яЁё]{1,3})\s(?=\S)/g, function (m, a, w) { return a + w + NB; });
    s = s.replace(/\s([–—-])\s/g, NB + '$1 ');
    s = s.replace(/(\d)\s(?=\d{3}\b)/g, '$1' + NB);
    s = s.replace(/(\d)\s(?=[а-яё])/g, '$1' + NB);
    // last two words stay together
    s = s.replace(/\s(\S+)$/, function (m, w) { return w.length < 14 ? NB + w : m; });
    return s;
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function t(s) { return esc(nb(s)); }
  function cap(s) { s = s.toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

  /* ---------- decoding parser ---------- */
  function isHead(line) { return /[А-ЯЁ]/.test(line) && !/[а-яё]/.test(line) && line.length > 4; }
  function parseDec(txt) {
    var groups = txt.replace(/\r/g, '').trim().split(/\n\s*\n/).map(function (g) { return g.split('\n').filter(function (l) { return l.trim(); }); });
    var blocks = [];
    groups.forEach(function (g) {
      if (g.length === 1 && isHead(g[0])) blocks.push({ h: g[0], g: [] });
      else blocks[blocks.length - 1].g.push(g);
    });
    var first = blocks[0];
    first.name = first.h.split(': ').slice(1).join(': ');
    first.k = first.h.split(': ')[0];
    var lock = blocks.findIndex(function (b) { return /^ВЫВОД/.test(b.h); });
    return { blocks: blocks, lock: lock, last: blocks.length - 1 };
  }

  /* ---------- result maths ---------- */
  function counts(ans) {
    var c = { S: 0, U: 0, P: 0, N: 0 };
    ans.forEach(function (l) { if (c[l] !== undefined) c[l]++; });
    return c;
  }
  function lead(c) {
    var best = '', bv = 0;
    T.order.forEach(function (l) { if (c[l] > bv) { bv = c[l]; best = l; } });
    return best;
  }
  function calc() {
    var c = counts(st.ans);
    if (c.N >= T.calm_min) return 'N';
    return st.seg + '-' + (lead(c) || T.order[0]);
  }

  /* ---------- screens ---------- */
  function show(node, opts) {
    opts = opts || {};
    app.innerHTML = '';
    app.appendChild(node);
    window.scrollTo(0, 0);
    bar.classList.toggle('on', !!opts.progress);
    if (opts.progress !== undefined) barI.style.width = (opts.progress * 100) + '%';
    backBtn.hidden = !opts.back;
    sticky.hidden = !opts.sticky;
    observe(node);
  }

  function optList(q, onPick) {
    var ul = el('<ul class="opts"></ul>');
    q.a.forEach(function (a, i) {
      var li = document.createElement('li');
      var b = el('<button type="button" class="opt">' + t(a[1]) + '</button>');
      b.addEventListener('click', function () {
        if (ul.dataset.done) return;
        ul.dataset.done = 1;
        b.classList.add('sel');
        setTimeout(function () { onPick(i, a[0]); }, 260);
      });
      li.appendChild(b); ul.appendChild(li);
    });
    return ul;
  }

  function intro() {
    st = { seg: null, ans: [], qs: [], result: null };
    var q = T.questions[0];
    var n = el(
      '<section class="screen">' +
      '<div class="wrap intro"><div class="ihd"><h1>' + t('Бесплатный тест для женщин') + '</h1>' +
      '<p class="promise">' + t('Узнай за 1 минуту главную причину, которая мешает тебе расслабиться в отношениях, почувствовать себя счастливой, желанной и жить так, как ты действительно хочешь.') + '</p>' +
      '</div><div class="q1"><h2 class="qh">' + t(q.q) + '</h2></div></div>' +
      '<div class="wrap more">' +
      '<h2 class="stat rv">' + t('97% женщин попадают в один из сценариев:') + '</h2><div class="mr">' +
      '<ul class="scen rv">' + ['«Хорошая девочка»: удобная, терпит, молчит', '«Спасательница»: отдает больше, чем получает', 'Тянется к холодным и недоступным', 'Отношения есть, а тепла и близости нет'].map(function (s) { return '<li>' + t(s) + '</li>'; }).join('') + '</ul>' +
      '<p class="rv">' + t('Тест покажет вашу уникальность и объяснит, какая ваша изюминка привлекает мужчин.') + '</p>' +
      '<p class="rv">' + t('Применив техники их расшифровки вы сможете построить счастливые отношения, о которых мечтаете, даже если много раз пробовали, и попадали в одни и те же сценарии.') + '</p>' +
      '<p class="free rv">' + t('Тест бесплатный - после прохождения вам не будут предлагать что-либо купить') + '</p>' +
      '<button type="button" class="btn btn-line up rv">' + t('Начать тест') + ' ↑</button>' +
      '</div></div></section>');
    n.querySelector('.q1').appendChild(optList(q, function (i) {
      st.seg = T.seg_branch[i];
      st.qs = [q].concat(T.branches[st.seg]);
      st.ans = [''];
      track('start', { seg: st.seg });
      question(1);
    }));
    n.querySelector('.up').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    show(n);
  }

  function question(i) {
    var q = st.qs[i], total = st.qs.length;
    var n = el('<section class="screen wrap quiz"><div class="qhd"><p class="count">Вопрос ' + (i + 1) + ' из ' + total + '</p><h2 class="qh">' + t(q.q) + '</h2></div></section>');
    n.appendChild(optList(q, function (k, l) {
      st.ans[i] = l; st.ans.length = i + 1;
      if (i === 2) { track('q3'); loader('3', 2000, function () { reveal(T.pattern[lead(counts(st.ans))] || T.pattern[''], i + 1); }); }
      else if (i === 5) { track('q6'); loader('6', 2600, function () { reveal(T.reveal6, i + 1); }); }
      else if (i === total - 1) loader('end', 3200, result);
      else question(i + 1);
    }));
    backBtn.onclick = function () { if (i > 1) question(i - 1); else intro(); };
    show(n, { progress: i / total, back: true });
  }

  function loader(key, ms, done) {
    var L = T.loaders[key];
    var n = el('<section class="screen wrap load" style="--t:' + ms + 'ms">' +
      '<svg class="knot" viewBox="0 0 88 88" aria-hidden="true"><circle cx="44" cy="44" r="40"/></svg>' +
      '<h2>' + t(L.title) + '</h2>' +
      (L.lines.length ? '<ul class="checks">' + L.lines.map(function (s) { return '<li>' + t(s) + '</li>'; }).join('') + '</ul>' : '') +
      '</section>');
    show(n, { progress: st.ans.length / (st.qs.length || 10) });
    requestAnimationFrame(function () { n.classList.add('go'); });
    var lis = n.querySelectorAll('.checks li');
    lis.forEach(function (li, k) { setTimeout(function () { li.classList.add('ok'); }, (ms / (lis.length + 1)) * (k + 1)); });
    if (done) setTimeout(done, ms + 250);
  }

  function reveal(text, next) {
    var n = el('<section class="screen wrap load reveal">' +
      '<svg class="knot" viewBox="0 0 88 88" aria-hidden="true"><circle cx="44" cy="44" r="40" style="stroke-dashoffset:14"/></svg>' +
      '<p class="big">' + t(text) + '</p>' +
      '<div><button type="button" class="btn">Дальше →</button></div></section>');
    n.querySelector('.btn').addEventListener('click', function () { question(next); });
    show(n, { progress: next / st.qs.length });
  }

  /* ---------- result page ---------- */
  var ICON = {
    lock: '<svg class="lockico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    g0: '<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="22" cy="28" r="14"/><circle cx="34" cy="28" r="14"/></svg>',
    g1: '<svg viewBox="0 0 56 56" aria-hidden="true"><path d="M4 22c8-8 16 8 24 0s16 8 24 0M4 34c8-8 16 8 24 0s16 8 24 0"/></svg>',
    g2: '<svg viewBox="0 0 56 56" aria-hidden="true"><path d="M28 48C10 36 6 24 12 16c5-6 12-4 16 3 4-7 11-9 16-3 6 8 2 20-16 32Z"/></svg>'
  };

  function para(lines, cls) {
    if (lines.length > 1) return '<ul class="' + (cls || '') + '">' + lines.map(function (l) { return '<li>' + t(l) + '</li>'; }).join('') + '</ul>';
    return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + t(lines[0]) + '</p>';
  }

  function blockHTML(b, extra) {
    var h = b.h, body = '';
    var age = /^ЭТО НАЧАЛОСЬ|^ОТКУДА У ВАС/.test(h);
    b.g.forEach(function (g, k) {
      if (/^ВЫВОД/.test(h) && k === 0 && /^«/.test(g[0])) body += '<p class="quote">' + t(g[0]) + '</p>';
      else if (/^ВАМ ГОВОРИЛИ/.test(h) && g.length > 1) body += para(g, 'words');
      else if (g.length > 1 && /^(Стыд|Вина|Тревога|Обида|Страх)/.test(g[0])) {
        body += '<ul class="feel">' + g.map(function (l) { var m = l.match(/^(\S+)(\s[\s\S]*)$/); return '<li><b>' + esc(m[1]) + '</b>' + t(m[2]) + '</li>'; }).join('') + '</ul>';
      } else body += para(g);
    });
    return '<article class="blk' + (extra || '') + '"><h2 class="rv">' + t(cap(h)) + '</h2><div class="txt rv">' +
      (age ? '<div class="age" aria-hidden="true" data-deco>3<i></i>12</div>' : '') + body + '</div></article>';
  }

  function demoCounts(L) {
    // ?r= opens a result without answers: show a plausible spread for preview only
    var c = { S: 1, U: 1, P: 1, N: 0 };
    if (L === 'N') return { S: 2, U: 1, P: 1, N: 5 };
    c[L] = 6; return c;
  }

  function result() {
    var r = st.result = st.result || calc();
    var seg = r === 'N' ? (st.seg || 'seg1') : r.split('-')[0], L = r === 'N' ? 'N' : r.split('-')[1];
    var P = parseDec(DEC[r]), B = P.blocks;
    var c = st.ans.length > 1 ? counts(st.ans) : demoCounts(L);
    var tot = c.S + c.U + c.P + c.N || 1;
    track('result');

    var names = { S: parseDec(DEC[seg + '-S']).blocks[0].name, U: parseDec(DEC[seg + '-U']).blocks[0].name, P: parseDec(DEC[seg + '-P']).blocks[0].name, N: parseDec(DEC.N).blocks[0].name };
    var scale = ['S', 'U', 'P', 'N'].sort(function (a, b) { return c[b] - c[a]; }).map(function (k) {
      var pc = Math.round(c[k] / tot * 100);
      return '<div class="sc' + (k === L ? ' me' : '') + '"><b>' + t(cap(names[k])) + '</b><span>' + pc + '%</span><div class="bar2"><i data-w="' + pc + '"></i></div></div>';
    }).join('');

    var b0 = B[0];
    var leadTxt = b0.g.map(function (g) { return g.join(' '); });
    var cta = B[P.last], conc = P.lock > 0 ? B[P.lock] : null;
    var concQuote = conc && conc.g[0] && /^«/.test(conc.g[0][0]) ? conc.g[0][0] : (conc ? conc.g[0][0] : '');

    var open = '', locked = '';
    for (var i = 1; i < P.last; i++) {
      if (P.lock > 0 && i >= P.lock) locked += blockHTML(B[i]);
      else open += blockHTML(B[i], i === 2 ? ' f' : '');
    }
    var lockedHeads = B.slice(P.lock, P.last).map(function (b) { return cap(b.h); }).concat(['Практические задания']);

    // CTA block
    var g = cta.g, btnText = g[g.length - 1][0];
    var promoIdx = g.findIndex(function (x) { return /^ПРОМОКОД/.test(x[0]); });
    var giftIdx = g.findIndex(function (x) { return x.length === 3 && /;$/.test(x[0]); });
    var promoM = g[promoIdx][0].match(/^(ПРОМОКОД)\s(«[^»]+»)\s(применён)\s·\s(таймер)\s(\d+:\d+)$/);
    var mid = g.slice(1, giftIdx).map(function (x) { return para(x); }).join('');
    var gifts = g[giftIdx].map(function (l, k) {
      var cut = l.indexOf(': '), a, z;
      if (cut > 0) { a = l.slice(0, cut + 1); z = l.slice(cut + 2); }
      else { cut = l.indexOf(' «'); a = cut > 0 ? l.slice(0, cut) : l; z = cut > 0 ? l.slice(cut + 1) : ''; }
      return '<li class="gift">' + ICON['g' + k] + '<div><b>' + t(a) + '</b><span>' + t(z) + '</span></div></li>';
    }).join('');
    var promoHTML = '<div class="promo"><span class="pc"><span class="pl">' + promoM[1] + '</span> <span class="code">' + esc(promoM[2]) + '</span> ' + promoM[3] + '</span> <span class="pt">· ' + promoM[4] + ' <b class="timer">' + promoM[5] + '</b></span></div>';
    var afterPromo = g.slice(promoIdx + 1, g.length - 1).map(function (x) { return para(x); }).join('');

    var n = el('<div class="screen">' +
      '<section class="wrap res-top"><div class="res-hero"><div>' +
      '<p class="res-k">' + t(cap(b0.k) + ':') + '</p>' +
      '<h1 class="res-name">' + t(cap(b0.name)) + '</h1>' +
      '<p class="res-lead" style="margin-top:28px">' + t(leadTxt.join(' ')) + '</p></div>' +
      '<svg class="res-art" viewBox="0 0 440 440" aria-hidden="true">' +
      '<circle class="g" cx="220" cy="220" r="150"/>' +
      '<path class="t" d="M20 400 C 120 380 120 300 160 250 S 300 60 360 140 S 340 360 220 370 S 70 250 150 160 S 330 90 420 30"/></svg>' +
      '<svg class="res-thread" viewBox="0 0 350 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 60 40 90 10 130 14 S 170 54 150 50 S 120 20 170 22 S 280 44 350 30"/></svg>' +
      '</div>' +
      '<div class="scale rv"><h2>' + t('Как распределились ваши ответы') + '</h2>' + scale + '</div>' +
      '<div class="cards">' +
      '<article class="card rv"><h3>Что видно по ответам</h3><p>' + t(T.pattern[L === 'N' ? '' : L]) + '</p></article>' +
      '<article class="card rv"><h3>Откуда это</h3><p>' + t(T.reveal6) + '</p></article>' +
      '<article class="card rv"><h3>Первый шаг</h3><p>' + t(g[0][0]) + '</p></article>' +
      '<article class="card lock rv"><h3>' + ICON.lock + 'Что держит</h3><p aria-hidden="true">' + t(concQuote) + '</p></article>' +
      '</div>' +
      '<div class="go-read rv"><a class="btn btn-w" href="#dec">' + t('Читать мою расшифровку') + ' ↓</a></div>' +
      '</section>' +
      '<section class="wrap dec" id="dec">' + open +
      '<div class="locked" aria-hidden="true">' + locked + '</div>' +
      '<div class="gate rv"><h2>' + t('Что откроется после записи') + '</h2><ul>' +
      lockedHeads.map(function (h) { return '<li>' + ICON.lock + '<span>' + t(h) + '</span></li>'; }).join('') + '</ul>' +
      '<button type="button" class="btn btn-w js-open">' + t('Открыть полную расшифровку') + '</button>' +
      '<a class="link" href="#cta">' + t('Как забрать всё БЕСПЛАТНО?') + '</a></div>' +
      '</section>' +
      '<section class="cta" id="cta"><div class="wrap">' +
      '<div class="cta-c"><div><h2 class="rv">' + t(cap(cta.h)) + '</h2><p class="lead rv">' + t(g[0][0]) + '</p></div>' +
      '<div class="txt rv">' + mid + '</div></div>' +
      '<ul class="gifts rv">' + gifts + '</ul>' +
      '<div class="promo-t rv">' + afterPromo.replace(/^/, '') + '</div>' +
      '<div class="rv">' + promoHTML + '<button type="button" class="btn js-open js-main">' + t(btnText) + '</button></div>' +
      '</div></section>' +
      '<div class="foot"></div></div>');
    // "Так как вы прошли тест…" paragraph sits right before the promo line
    var pre = g.slice(giftIdx + 1, promoIdx).map(function (x) { return para(x); }).join('');
    n.querySelector('.promo-t').innerHTML = pre;
    // the gift intro paragraph ("Сразу после регистрации…") ends the mid text: keep it right above the gifts
    show(n, { sticky: true });
    requestAnimationFrame(function () { setTimeout(function () { n.querySelectorAll('.bar2 i').forEach(function (i) { i.style.width = i.dataset.w + '%'; }); }, 300); });
    startTimer();
    wireSticky(n);
    var gr = n.querySelector('.go-read a');
    gr.addEventListener('click', function (e) { e.preventDefault(); track('read'); document.getElementById('dec').scrollIntoView({ behavior: 'smooth' }); });
    n.querySelector('.link').addEventListener('click', function (e) { e.preventDefault(); document.getElementById('cta').scrollIntoView({ behavior: 'smooth' }); });
  }

  /* ---------- timer ---------- */
  var tick;
  function startTimer() {
    var key = 'kl_end', end = +sessionStorage.getItem(key);
    if (!end || end < Date.now()) { end = Date.now() + 10 * 60 * 1000; sessionStorage.setItem(key, end); }
    clearInterval(tick);
    function upd() {
      var s = Math.max(0, Math.round((end - Date.now()) / 1000));
      var txt = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      document.querySelectorAll('.timer').forEach(function (e) { e.textContent = txt; });
      if (!s) clearInterval(tick);
    }
    upd(); tick = setInterval(upd, 1000);
  }

  /* ---------- sticky bar ---------- */
  function wireSticky(n) {
    if (!('IntersectionObserver' in window)) return;
    var past = false, ctaIn = false;
    function upd() { sticky.classList.toggle('on', past && !ctaIn); }
    new IntersectionObserver(function (es) { es.forEach(function (e) { past = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }); }).observe(n.querySelector('.go-read'));
    new IntersectionObserver(function (es) { es.forEach(function (e) { ctaIn = e.isIntersecting; upd(); }); }, { threshold: 0.05 }).observe(n.querySelector('.js-main'));
  }

  /* ---------- form ---------- */
  function openForm() {
    track('open');
    var promo = document.querySelector('.cta .promo');
    modal.innerHTML = '<form class="mf" novalidate>' +
      '<button type="button" class="x" aria-label="Закрыть">×</button>' +
      '<h2 id="mt">' + t('Практикум «Новая реальность»') + '</h2>' +
      (promo ? promo.outerHTML : '') +
      '<label>Имя<input name="name" autocomplete="given-name" required autofocus></label>' +
      '<label>Телефон или почта<input name="contact" autocomplete="email" inputmode="email" required></label>' +
      '<p class="err" role="alert"></p>' +
      '<button class="btn btn-w" type="submit">Забрать бесплатно</button></form>';
    startTimer();
    var f = modal.querySelector('form');
    modal.querySelector('.x').onclick = function () { modal.close(); };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.name.value.trim(), c = f.contact.value.trim();
      var ok = /^\S+@\S+\.\S+$/.test(c) || c.replace(/\D/g, '').length >= 10;
      if (name.length < 2) return void (f.querySelector('.err').textContent = 'Напишите имя');
      if (!ok) return void (f.querySelector('.err').textContent = 'Нужен телефон или почта');
      var lead = { name: name, contact: c, result: st.result };
      if (typeof window.submitLead === 'function') window.submitLead(lead);
      track('register');
      modal.close();
      thanks();
    });
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
  }
  document.addEventListener('click', function (e) { if (e.target.closest('.js-open')) openForm(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });

  function thanks() {
    var n = el('<section class="screen wrap thanks"><h1>Спасибо!</h1>' +
      '<p class="res-lead" style="margin-top:24px">' + t('Вы записаны на практикум «Новая реальность».') + '</p>' +
      '<div><a class="btn" href="' + BOT_URL + '">' + t('Открыть расшифровку в боте') + '</a></div></section>');
    show(n);
  }

  /* ---------- entrance ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function observe(root) {
    root.querySelectorAll('.rv').forEach(function (x, k) {
      if (!io) return x.classList.add('in');
      x.style.transitionDelay = (k % 3) * 70 + 'ms';
      io.observe(x);
    });
  }

  /* ---------- entry: ?r=seg1-S opens a result, ?screen=… for previews ---------- */
  var r = params.get('r'), scr = params.get('screen');
  if (r && DEC[r]) { st.result = r; st.seg = r === 'N' ? 'seg1' : r.split('-')[0]; result(); }
  else if (scr) {
    st.seg = params.get('seg') || 'seg1'; st.qs = [T.questions[0]].concat(T.branches[st.seg]);
    st.ans = ['', 'S', 'S', 'U', 'S', 'P', 'S', 'U', 'S'];
    var m = scr.match(/^q(\d+)$/);
    if (m) { st.ans.length = +m[1] - 1; question(+m[1] - 1); }
    else if (scr === 'load3') loader('3', 600000);
    else if (scr === 'load6') { loader('6', 1600); }
    else if (scr === 'loadend') loader('end', 2400);
    else if (scr === 'rev3') { st.ans.length = 3; reveal(T.pattern[lead(counts(st.ans))], 3); }
    else if (scr === 'rev6') reveal(T.reveal6, 6);
    else if (scr === 'thanks') thanks();
    else if (scr === 'form') { st.result = 'seg1-S'; result(); setTimeout(openForm, 50); }
    else intro();
  } else intro();
})();
