/* Школа Анны Саба: меню, фильтры, слои трафика, ИИ-помощник.
   ?nopopups=1 – все таймеры и слои выключены (для проверок). */
(function () {
  'use strict';
  var S = window.SITE || { root: '', kind: 'page' };
  var R = S.root;
  var KB = window.ANNA_KB || { products: [], free: [], bot: '' };
  var Q = new URLSearchParams(location.search);
  var NOPOP = Q.get('nopopups') === '1';
  var SHOW = Q.get('show');
  var mobile = function () { return innerWidth < 760; };
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function escH(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var NB = ' ';
  var IMG = R + 'assets/img/';
  var AVA = IMG + 'anna-ava.webp';
  var NR = KB.free[0] || { title: 'Онлайн-практикум «Новая реальность»', when: '25–28 ноября, онлайн', url: '#', btn: 'Зарегистрироваться на практикум', text: '' };
  function freeById(id) { for (var i = 0; i < KB.free.length; i++) if (KB.free[i].id === id) return KB.free[i]; return NR; }
  function ext(u) { return /^https?:/.test(u); }
  function link(u) { return ext(u) ? u : R + u; }
  function tgt(u) { return ext(u) ? ' target="_blank" rel="noopener"' : ''; }

  /* ---------- меню ---------- */
  var burger = $('.burger'), menu = $('#menu');
  if (burger && menu) burger.addEventListener('click', function () {
    var open = menu.hidden; menu.hidden = !open; burger.setAttribute('aria-expanded', open);
  });

  /* ---------- фильтр каталога ---------- */
  var fl = $('.k-catalog .flt');
  if (fl) {
    var apply = function (f) {
      $$('.pill', fl).forEach(function (b) { b.classList.toggle('on', b.dataset.f === f); });
      $$('[data-grid]').forEach(function (g) {
        var shown = 0;
        $$('.pc', g).forEach(function (c) { var ok = f === 'all' || c.dataset.kind === f; c.hidden = !ok; if (ok) shown++; });
        var e = g.parentNode.querySelector('.empty'); if (e) e.hidden = shown > 0;
      });
    };
    fl.addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { apply(b.dataset.f); history.replaceState(null, '', b.dataset.f === 'all' ? location.pathname + location.search : '#' + b.dataset.f); } });
    if (location.hash === '#free') apply('free'); else if (location.hash === '#paid') apply('paid');
  }
  /* ---------- фильтр блога ---------- */
  var bf = $('.k-blog .flt');
  if (bf) bf.addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]'); if (!b) return;
    $$('.pill', bf).forEach(function (x) { x.classList.toggle('on', x === b); });
    $$('.bc[data-tag]').forEach(function (c) { c.hidden = !(b.dataset.t === 'all' || c.dataset.tag === b.dataset.t); });
  });

  /* ---------- стрелки карусели ---------- */
  $$('.evs-b').forEach(function (b) { b.addEventListener('click', function () {
    var c = b.parentNode.previousElementSibling; c.scrollBy({ left: (+b.dataset.d) * (c.firstElementChild.getBoundingClientRect().width + 16), behavior: 'smooth' });
  }); });

  /* ---------- кнопка «наверх» (всегда, это не таймерный слой) ---------- */
  var up = el('<button class="up L" type="button" aria-label="Наверх">↑</button>');
  document.body.appendChild(up);
  up.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });
  addEventListener('scroll', function () { up.classList.toggle('in', scrollY > 1200); }, { passive: true });

  if (NOPOP) return;

  /* ================= СЛОИ ТРАФИКА ================= */
  var T0 = Date.now();
  var busy = null;                 // какое большое окно сейчас открыто
  var waiting = [];                // очередь больших окон
  function openBig(name, fn) {
    if (busy) { if (waiting.every(function (w) { return w.name !== name; })) waiting.push({ name: name, fn: fn }); return; }
    busy = name; fn();
  }
  function closeBig(name) {
    if (busy !== name) return; busy = null;
    var n = waiting.shift(); if (n) setTimeout(function () { openBig(n.name, n.fn); }, 1500);
    flushToasts();
  }

  /* --- нижний док: cookie + таб --- */
  var dock = el('<div class="dock L"></div>');
  document.body.appendChild(dock);
  function setDock() {
    var h = mobile() ? dock.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--dock', Math.round(h) + 'px');
    guardHero();
  }
  // таб-баннер внизу (сразу)
  var tab = null;
  if (sstore('as_tab_x') !== '1') {
    tab = el('<a class="tab" href="' + NR.url + '" target="_blank" rel="noopener"><img src="' + AVA + '" alt="Анна Саба"><span><small>Бесплатно</small><b>Практикум «Новая' + NB + 'реальность»</b><em style="font-style:normal">' + NR.when + '</em></span><button class="x-btn" type="button" aria-label="Закрыть">×</button></a>');
    dock.appendChild(tab);
    $('.x-btn', tab).addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); tab.remove(); tab = null; sstore('as_tab_x', '1'); setDock(); });
  }
  // тонкая cookie-плашка
  if (store('as_cookie') !== '1') {
    var ck = el('<div class="cookie" role="region" aria-label="Cookie"><span>Сайт использует cookie. <a href="' + R + 'dokumenty/index.html">Подробнее</a></span><button type="button">Понятно</button></div>');
    dock.insertBefore(ck, dock.firstChild);
    $('button', ck).addEventListener('click', function () { store('as_cookie', '1'); ck.remove(); setDock(); });
  }
  // таб не должен закрывать главную кнопку первого экрана на телефоне
  function guardHero() {
    var b = $('.hx-acts .btn');
    var layers = [tab, $('.gift-w'), $('.chat-l')].filter(Boolean);
    if (!b || !mobile()) { layers.forEach(function (l) { l.classList.remove('m-hide'); }); return; }
    var q = b.getBoundingClientRect();
    layers.forEach(function (l) {
      l.classList.remove('m-hide');
      var r = l.getBoundingClientRect();
      var hit = r.width > 0 && r.top < q.bottom + 8 && r.bottom > q.top - 8 && r.left < q.right && r.right > q.left;
      if (scrollY < 40 && hit) l.classList.add('m-hide');
    });
  }
  addEventListener('scroll', guardHero, { passive: true });
  addEventListener('resize', setDock);
  setDock();

  /* --- верхняя плашка (через 1 с) --- */
  var TDO = freeById('tdo');
  setTimeout(function () {
    if (sstore('as_top_x') === '1') return;
    var tb = el('<div class="topbar L" role="region" aria-label="Тест"><div class="topbar-in"><p><span class="t-l">Тест из 9' + NB + 'шагов: в' + NB + 'конце индивидуальная расшифровка и' + NB + 'шаги к' + NB + 'выходу в' + NB + 'новую' + NB + 'реальность</span><span class="t-s">Тест из 9' + NB + 'шагов с' + NB + 'расшифровкой</span></p><a class="btn" href="' + TDO.url + '" target="_blank" rel="noopener"><span>Пройти тест бесплатно</span></a></div><button class="x-btn" type="button" aria-label="Закрыть">×</button></div>');
    document.body.insertBefore(tb, document.body.firstChild);
    $('.x-btn', tb).addEventListener('click', function () { tb.remove(); sstore('as_top_x', '1'); guardHero(); });
    guardHero();
  }, 1000);

  /* --- виджет «Забрать подарок» (3 с, прыжок каждые 10 с) --- */
  var gw;
  setTimeout(function () {
    if (sstore('as_gift_x') === '1') return;
    gw = el('<div class="gift-w L"><button class="g" type="button"><i aria-hidden="true"></i><span>Забрать<br>подарок</span></button><button class="x-btn gx" type="button" aria-label="Закрыть">×</button></div>');
    $('.g', gw).setAttribute('aria-label', 'Забрать подарок');
    document.body.appendChild(gw);
    requestAnimationFrame(function () { gw.classList.add('in'); setTimeout(guardHero, 700); });
    $('.g', gw).addEventListener('click', function () { openBig('wheel', showWheel); });
    $('.gx', gw).addEventListener('click', function () { gw.remove(); sstore('as_gift_x', '1'); });
    setTimeout(function () { jump(); setInterval(jump, 10000); }, 1200);
  }, 3000);
  function jump() { if (!gw || !gw.isConnected) return; gw.classList.remove('jump'); void gw.offsetWidth; gw.classList.add('jump'); }

  /* --- общий конструктор окна --- */
  function modal(name, inner, cls) {
    var ov = el('<div class="ov L" role="dialog" aria-modal="true"><div class="md ' + (cls || '') + '">' + inner + '<button class="x-btn" type="button" aria-label="Закрыть">×</button></div></div>');
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('in'); });
    function close() { ov.classList.remove('in'); setTimeout(function () { ov.remove(); }, 300); document.removeEventListener('keydown', esc); closeBig(name); if (ov._onclose) ov._onclose(); }
    function esc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc);
    $('.md > .x-btn', ov).addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    setTimeout(function () { var b = $('.md > .x-btn', ov); if (b) b.focus({ preventScroll: true }); }, 50);
    ov._close = close;
    return ov;
  }

  /* --- попап через 30 с (раз в сутки) --- */
  var DAY = 864e5;
  var popupShown = false;
  setTimeout(function () {
    var last = +store('as_popup_ts') || 0;
    if (Date.now() - last < DAY) return;
    popupNow();
  }, 30000);
  function popupNow() {
    openBig('popup', function () {
      store('as_popup_ts', Date.now()); popupShown = true;
      var ov = modal('popup', '<div class="md-img"><img src="' + IMG + 'c-practicum.webp" alt=""></div><div class="md-b"><span class="badge badge-free">25–28' + NB + 'ноября · онлайн · участие 0' + NB + '₽</span><h3>Как за 4' + NB + 'дня выйти из' + NB + 'угнетающих чувств на' + NB + 'новый уровень дохода, энергии, отношений, реализации</h3><p>Онлайн-практикум «Новая' + NB + 'реальность». Бонусы сразу после регистрации:</p><ul><li>Практика «Деньги х2»</li><li>Терапевтическая сессия «Убираем тревогу и' + NB + 'выходим из' + NB + 'недостаточности»</li><li>Гайд «Волшебная' + NB + 'женщина»</li></ul><a class="btn" href="' + NR.url + '" target="_blank" rel="noopener"><span>Зарегистрироваться на' + NB + 'практикум</span></a></div>');
      ov._onclose = function () {
        if (Date.now() - (+store('as_wheel_ts') || 0) > DAY) setTimeout(function () { openBig('wheel', showWheel); }, 25000);
      };
    });
  }

  /* --- колесо подарков (25 с после попапа или по клику) --- */
  var PRIZES = [
    { s: 'Тест ТДО', t: 'Тест ТДО с расшифровкой', u: freeById('tdo').url, b: 'Пройти тест бесплатно', c: '#d6a24a' },
    { s: 'Гайд', t: 'Гайд «Волшебная женщина»', u: NR.url, b: 'Забрать гайд при регистрации', c: '#efe6d6', d: 'Бонус за регистрацию на практикум «Новая реальность»' },
    { s: 'Опросник', t: 'Опросник на тип личности', u: freeById('opr').url, b: 'Пройти опросник', c: '#b9832e' },
    { s: 'Деньги х2', t: 'Практика «Деньги х2»', u: NR.url, b: 'Забрать практику при регистрации', c: '#fffdf8', d: 'Бонус за регистрацию на практикум «Новая реальность»' },
    { s: '3 видео', t: '3 видео бота «Без стресса»', u: KB.bot, b: 'Открыть бота', c: '#e8c27a' },
    { s: 'Интенсив', t: 'Интенсив за 0 ₽ по промокоду', u: freeById('int').url, b: 'Записаться на интенсив', c: '#f7f1e7', d: 'Промокод РЕЗУЛЬТАТ: участие 0 ₽ вместо 4 990 ₽' }
  ];
  function wheelSvg() {
    var n = PRIZES.length, s = '', a = 2 * Math.PI / n;
    for (var i = 0; i < n; i++) {
      var a0 = i * a - Math.PI / 2 - a / 2, a1 = a0 + a;
      var x0 = 50 + 48 * Math.cos(a0), y0 = 50 + 48 * Math.sin(a0), x1 = 50 + 48 * Math.cos(a1), y1 = 50 + 48 * Math.sin(a1);
      s += '<path d="M50 50 L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A48 48 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'Z" fill="' + PRIZES[i].c + '" stroke="#fff" stroke-width=".6"/>';
      var am = (i * a - Math.PI / 2) * 180 / Math.PI;
      var an = ((am % 360) + 360) % 360, flip = an > 90 && an < 270 ? ' rotate(180 72 50)' : '';
      s += '<g transform="rotate(' + am.toFixed(1) + ' 50 50)' + flip + '"><text x="72" y="51.6" text-anchor="middle" font-size="5" font-family="Manrope,sans-serif" font-weight="800" fill="#2a1c06">' + escH(PRIZES[i].s) + '</text></g>';
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49.5" fill="#2a1c10"/>' + s + '<circle cx="50" cy="50" r="7" fill="#16110c" stroke="#d6a24a" stroke-width="1.4"/></svg>';
  }
  function showWheel() {
    var ov = modal('wheel', '<div class="md-b"><span class="badge badge-free">Подарок от школы</span><h3>Крутите колесо и' + NB + 'заберите бесплатный материал</h3><p>Каждый сектор – бесплатный тест, гайд, практика или видео школы.</p><div class="wheel">' + wheelSvg() + '</div><div class="wres"><button class="btn spin" type="button"><span>Крутить колесо</span></button></div></div>', 'wheel-md');
    var spun = false;
    $('.spin', ov).addEventListener('click', function () {
      if (spun) return; spun = true; store('as_wheel_ts', Date.now());
      var k = Math.floor(Math.random() * PRIZES.length), n = PRIZES.length;
      var deg = 360 * 6 - k * (360 / n);
      var svg = $('.wheel svg', ov); svg.style.transform = 'rotate(' + deg + 'deg)';
      this.disabled = true;
      setTimeout(function () {
        var p = PRIZES[k];
        $('.wheel', ov).classList.add('done');
        $('.wres', ov).innerHTML = '<div class="prize"><small>Ваш подарок</small><b>' + escH(p.t) + '</b>' + (p.d ? '<small>' + escH(p.d) + '</small>' : '') + '<a class="btn" href="' + p.u + '" target="_blank" rel="noopener"><span>' + escH(p.b) + '</span></a></div>';
      }, 5100);
    });
  }

  /* --- ИИ-помощник: 100 с --- */
  var chatOpen = false, chatEl = null, launcher = null, history_ = [];
  launcher = el('<button class="chat-l L" type="button" aria-label="Открыть чат с ИИ-помощником школы"><img src="' + AVA + '" alt=""><i></i></button>');
  setTimeout(function () { document.body.appendChild(launcher); guardHero(); }, 3000);
  launcher.addEventListener('click', function () { openChat(true); });
  setTimeout(function () {
    if (chatOpen || sstore('as_chat_auto') === '1') return;
    openBig('chat', function () { sstore('as_chat_auto', '1'); if (mobile()) teaser(); else openChat(false); });
  }, 100000);

  function teaser() {
    var tz = el('<div class="chat-tz L" role="button" tabindex="0"><b>ИИ-помощник школы</b>Здравствуйте! Подобрать вам бесплатное мероприятие?<button class="x-btn" type="button" aria-label="Закрыть">×</button></div>');
    function show() {
      document.body.appendChild(tz); requestAnimationFrame(function () { tz.classList.add('in'); });
      var b = $('.hx-acts .btn'), q = b && b.getBoundingClientRect(), r = tz.getBoundingClientRect();
      if (q && scrollY < 40 && r.top < q.bottom + 8 && r.bottom > q.top) {   // не закрываем главную кнопку
        tz.remove(); var w = function () { if (scrollY > 80) { removeEventListener('scroll', w); show(); } }; addEventListener('scroll', w, { passive: true });
      }
    }
    function done() { tz.remove(); closeBig('chat'); }
    tz.addEventListener('click', function (e) { if (e.target.closest('.x-btn')) { done(); return; } tz.remove(); busy = null; openChat(true); });
    show();
  }
  function openChat(manual) {
    if (chatOpen) return;
    chatOpen = true; if (manual && busy == null) busy = 'chat';
    if (!document.body.contains(launcher)) document.body.appendChild(launcher);
    launcher.hidden = true;
    if (!chatEl) buildChat();
    document.body.appendChild(chatEl);
    requestAnimationFrame(function () { chatEl.classList.add('in'); });
    if (!history_.length) greet();
  }
  function closeChat() {
    chatOpen = false; chatEl.classList.remove('in');
    setTimeout(function () { if (!chatOpen) chatEl.remove(); }, 300);
    launcher.hidden = false; closeBig('chat'); guardHero();
  }
  function buildChat() {
    chatEl = el('<section class="chat L" aria-label="ИИ-помощник школы Анны Саба"><header class="chat-h"><img src="' + AVA + '" alt=""><div><b>ИИ-помощник школы Анны' + NB + 'Саба</b><span>Отвечает сразу</span></div><button class="x-btn" type="button" aria-label="Свернуть чат">×</button></header><div class="chat-m" aria-live="polite"></div><div class="chips-q"></div><form class="chat-f"><input type="text" placeholder="Напишите вопрос" aria-label="Ваш вопрос" maxlength="400"><button type="submit">Отправить</button></form></section>');
    $('.x-btn', chatEl).addEventListener('click', closeChat);
    $('form', chatEl).addEventListener('submit', function (e) { e.preventDefault(); var i = $('input', chatEl); var v = i.value.trim(); if (!v) return; i.value = ''; ask(v); });
    chips(['Подобрать бесплатное', 'У меня тревога', 'Я специалист', 'Сколько стоит?', 'Когда старт?']);
  }
  function chips(list) {
    var c = $('.chips-q', chatEl); c.innerHTML = '';
    list.forEach(function (t) { var b = el('<button type="button">' + escH(t) + '</button>'); b.addEventListener('click', function () { ask(t); }); c.appendChild(b); });
  }
  function addMsg(who, html) {
    var m = el('<div class="msg ' + who + '"></div>'); m.innerHTML = html;
    var box = $('.chat-m', chatEl); box.appendChild(m); box.scrollTop = box.scrollHeight; return m;
  }
  function typing(cb, ms) {
    var m = addMsg('b', '<span class="dots3" aria-label="Печатает"><i></i><i></i><i></i></span>');
    setTimeout(function () { m.remove(); cb(); }, ms || 900);
  }
  function greet() {
    typing(function () {
      say('Здравствуйте! Я ИИ-помощник школы Анны' + NB + 'Саба, врача-психиатра и психотерапевта. Я не заменяю консультацию врача, но подскажу, с чего начать: подберу бесплатное мероприятие или программу и отвечу на вопросы о ценах и датах.');
      setTimeout(function () { typing(function () { say(freeBlock(NR, 'Ближайшее бесплатное мероприятие:')); }, 1100); }, 600);
    }, 1400);
  }
  function say(html) { history_.push({ role: 'assistant', content: html.replace(/<[^>]+>/g, ' ') }); addMsg('b', html); }
  function freeBlock(f, intro) {
    return (intro ? escH(intro) + '\n' : '') + '<b>' + escH(f.title) + '</b>\n' + escH(f.when) + '. ' + escH(f.text) + '<br><a class="btn" href="' + f.url + '" target="_blank" rel="noopener"><span>' + escH(f.btn) + '</span></a>';
  }
  function prodBlock(p) {
    return '<b>' + escH(p.name) + '</b>\n' + escH(p.promise) + (p.duration ? '\nСрок: ' + escH(p.duration) + '.' : '') + (p.price ? '\nСтоимость: ' + escH(p.price) + '.' : '') +
      (p.page ? '<a class="lk" href="' + R + p.page + '">Подробнее на сайте →</a>' : '');
  }
  function ask(text) {
    addMsg('u', escH(text)); history_.push({ role: 'user', content: text });
    var ep = window.ANNA_CHAT_ENDPOINT;
    if (ep) {
      var m = addMsg('b', '<span class="dots3" aria-label="Печатает"><i></i><i></i><i></i></span>');
      fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history_ }) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { m.remove(); if (!d || !d.reply) throw new Error('empty'); say(escH(d.reply) + '<br><a class="btn" href="' + NR.url + '" target="_blank" rel="noopener"><span>' + escH(NR.btn) + '</span></a>'); })
        .catch(function () { m.remove(); answerLocal(text); });
      return;
    }
    typing(function () { answerLocal(text); }, 700 + Math.min(text.length * 15, 900));
  }
  function has(t, arr) { for (var i = 0; i < arr.length; i++) if (t.indexOf(arr[i]) >= 0) return true; return false; }
  function P(id) { for (var i = 0; i < KB.products.length; i++) if (KB.products[i].id === id) return KB.products[i]; return null; }
  function answerLocal(q) {
    var t = q.toLowerCase().replace(/ё/g, 'е'), out = [], freeShown = false, nextChips = null;
    var named = [['результат', 'rezult'], ['интенсив', 'intensiv'], ['марафон', 'marafon'], ['сексолог', 'seksologiya'], ['пендэл', 'club'], ['пендел', 'club'], ['клуб', 'club'],
      ['тдо', 'test-tdo'], ['опросник', 'test-type'], ['тип личност', 'test-type'], ['бот', 'bot-nostress'], ['без стресс', 'bot-nostress'], ['для жизни', 'emdr-life'],
      ['автомаг', 'automagic'], ['ключ', 'audio-keys'], ['аудиопракт', 'audio-keys'], ['волшебн', 'magical-woman'], ['групп', 'group'], ['расстанов', 'rasstanovka'],
      ['гипно', 'hypno'], ['пкт', 'pkt'], ['краткосроч', 'pkt'], ['переподготов', 'pkt'], ['новая реальн', 'praktikum-novaya-realnost'], ['практикум', 'praktikum-novaya-realnost'], ['консультац', 'consult'], ['личн', 'consult'], ['сесси', 'consult']];
    var hit = null;
    for (var i = 0; i < named.length; i++) if (t.indexOf(named[i][0]) >= 0) { hit = P(named[i][1]); break; }
    if (has(t, ['привет', 'здравств', 'добрый'])) out.push('Здравствуйте! Расскажите, что вас сейчас беспокоит, и я подберу подходящий бесплатный шаг.');
    if (has(t, ['бесплат', 'подобрать', 'подар', 'с чего начать', 'начать', '0 ₽', 'ноль'])) {
      out.push('Бесплатно в школе можно:\n' + KB.free.map(function (f) { return '• <a class="lk" style="display:inline" href="' + f.url + '" target="_blank" rel="noopener">' + escH(f.title) + '</a> – ' + escH(f.when); }).join('\n'));
      out.push(freeBlock(NR, 'Лучший первый шаг:')); freeShown = true;
    }
    if (has(t, ['тревог', 'страх', 'паник', 'стресс', 'нерв', 'бессон', 'беспоко'])) {
      out.push('На онлайн-практикуме «Новая реальность» мы за 4 дня убираем 5 угнетающих чувств: тревогу, страх, обиду, вину, стыд.\nЕсли хочется начать прямо сейчас, в Telegram-боте «Без стресса» есть 3 коротких видео и практика для нервной системы.');
      out.push(freeBlock(NR)); out.push('<a class="lk" href="' + KB.bot + '" target="_blank" rel="noopener">Открыть бота «Без стресса» →</a>'); freeShown = true;
    }
    if (has(t, ['дпдг', 'emdr', 'эмдр', 'движени', 'метод', 'кпт'])) {
      out.push('ДПДГ расшифровывается как «Десенсибилизация и Переработка Движением Глаз» (англ. EMDR – Eye Movement Desensitization and Reprocessing).\nВ программах школы КПТ (когнитивно-поведенческая терапия) находит мишень → EMDR (ДПДГ) убирает реакцию → результат закрепляется.');
      out.push('<a class="lk" href="' + R + 'blog/chto-takoe-dpdg-emdr/index.html">Статья о методе →</a>');
    }
    if (has(t, ['специалист', 'психолог', 'врач', 'профес', 'диплом', 'удостовер', 'квалифик', 'обучен'])) {
      out.push('Для специалистов есть:\n• ' + ['emdr30', 'pkt', 'seksologiya'].map(function (id) { var p = P(id); return '<a class="lk" style="display:inline" href="' + R + p.page + '">' + escH(p.name) + '</a> – ' + escH(p.price); }).join('\n• '));
      out.push('Познакомиться с методом в работе можно бесплатно на практикуме «Новая реальность».');
    }
    if (has(t, ['отношен', 'муж', 'партнер', 'любов', 'одинок', 'семь'])) {
      var mw = P('magical-woman'); out.push('Про отношения: ' + prodBlock(mw));
      out.push('С отношениями можно прийти и на практикум «Новая реальность» (участие 0' + NB + '₽). После регистрации вы получите гайд «Волшебная женщина».');
    }
    if (has(t, ['деньг', 'доход', 'финанс', 'заработ', 'долг'])) {
      out.push('Про деньги: на бесплатном практикуме «Новая реальность» после регистрации вы получите практику «Деньги х2» – как пробить финансовый потолок и удвоить доход.');
      out.push(freeBlock(NR)); freeShown = true;
    }
    if (hit && !out.length) out.push(prodBlock(hit));
    else if (hit && has(t, ['цен', 'стоим', 'сколько', 'руб', 'оплат', 'рассроч'])) out.push(prodBlock(hit));
    if (has(t, ['цен', 'стоим', 'сколько', 'руб', 'оплат', 'рассроч', 'дорог']) && !hit) {
      out.push('Цены по программам:\n' + KB.products.filter(function (p) { return p.kind !== 'free'; }).slice(0, 9).map(function (p) { return '• ' + escH(p.name) + ': ' + escH(p.price); }).join('\n') + '\n<a class="lk" href="' + R + 'obuchenie/index.html">Весь каталог →</a>');
      out.push('Бесплатно можно начать с практикума «Новая реальность», теста ТДО и опросника на тип личности.');
    }
    if (has(t, ['когда', 'старт', 'дата', 'начал', 'распис', 'ближайш'])) {
      out.push('Ближайшие даты:\n• Онлайн-практикум «Новая реальность» – 25–28 ноября 2026, участие 0 ₽\n• Терапевтическая группа (офлайн) – ноябрь\n• Родовая расстановка – 20 декабря, Москва');
      out.push(freeBlock(NR)); freeShown = true;
    }
    if (has(t, ['контакт', 'телефон', 'почт', 'связ', 'менеджер', 'человек', 'оператор'])) {
      out.push('Связаться со школой можно через Telegram-бот или на странице контактов.\n<a class="lk" href="' + R + 'kontakty/index.html">Контакты →</a>');
    }
    if (!out.length) {
      out.push('Я подсказываю по программам, ценам и датам школы и института Анны' + NB + 'Саба. Спросите, например: что есть бесплатно, что делать с тревогой, сколько стоит программа «Результат».');
      nextChips = ['Подобрать бесплатное', 'У меня тревога', 'Отношения', 'Деньги', 'Я специалист'];
    }
    if (!freeShown) out.push(freeBlock(NR, 'Начать можно бесплатно:'));
    var i2 = 0;
    (function next() { if (i2 >= out.length) return; say(out[i2++]); if (i2 < out.length) setTimeout(function () { typing(next, 600); }, 200); })();
    chips(nextChips || ['Подобрать бесплатное', 'Когда старт?', 'Сколько стоит?', 'Что такое ДПДГ?']);
  }

  /* --- карточка «Анна рассказала» (150 с) --- */
  setTimeout(function () { if (sstore('as_tell_x') !== '1') tellNow(); }, 150000);
  function tellNow() {
    if (mobile() && scrollY < innerHeight * 0.6 && SHOW !== 'tell') {   // на телефоне не закрываем первый экран
      var w = function () { if (scrollY >= innerHeight * 0.6) { removeEventListener('scroll', w); tellNow(); } };
      return addEventListener('scroll', w, { passive: true });
    }
    openBig('tell', function () {
      var c = el('<aside class="tell L" aria-label="Анна Саба рассказала"><img src="' + IMG + 'c-bot.webp" alt=""><div><small class="kick kick-g" style="margin:0">Анна' + NB + 'Саба рассказала</small><b>3 коротких видео и' + NB + 'практика для нервной системы</b><p>Бесплатно в Telegram-боте «Без' + NB + 'стресса»</p><a class="btn btn-s" href="' + KB.bot + '" target="_blank" rel="noopener"><span>Смотреть в Telegram</span></a></div><button class="x-btn" type="button" aria-label="Закрыть">×</button></aside>');
      document.body.appendChild(c); requestAnimationFrame(function () { c.classList.add('in'); });
      $('.x-btn', c).addEventListener('click', function () { c.classList.remove('in'); sstore('as_tell_x', '1'); setTimeout(function () { c.remove(); }, 600); closeBig('tell'); });
      setTimeout(function () { if (c.isConnected) { c.classList.remove('in'); setTimeout(function () { c.remove(); }, 600); closeBig('tell'); } }, 30000);
    });
  }

  /* --- push-карточки: правдивые тексты, ≥40 с между ними, ≤3 за визит --- */
  var TOASTS = [
    { i: 'c-practicum', k: '25–28 ноября · онлайн', t: 'Онлайн-практикум «Новая реальность» Анны Саба. Участие 0 ₽, бонусы сразу после регистрации.', u: NR.url, b: 'Зарегистрироваться' },
    { i: 'c-test', k: 'Тест ТДО · 9 шагов', t: 'В конце теста – индивидуальная расшифровка и шаги к выходу в новую реальность.', u: freeById('tdo').url, b: 'Пройти тест' },
    { i: 'c-bot', k: 'Telegram-бот «Без стресса»', t: '3 коротких видео и практика для нервной системы.', u: KB.bot, b: 'Открыть бота' },
    { i: 'c-oprosnik', k: 'Опросник на тип личности', t: 'Поймите, какие сценарии повторяются в отношениях, работе и реакциях на стресс.', u: freeById('opr').url, b: 'Пройти опросник' }
  ];
  var tBox = el('<div class="toasts L" aria-live="polite"></div>');
  document.body.appendChild(tBox);
  var tCount = +sstore('as_toasts') || 0, tIdx = tCount % TOASTS.length, tLast = 0, tPending = false;
  function toastDue() {
    if (tCount >= 3) return;
    if (busy || Date.now() - tLast < 40000) { tPending = true; return; }
    tPending = false; tLast = Date.now(); tCount++; sstore('as_toasts', tCount);
    var d = TOASTS[tIdx++ % TOASTS.length];
    var x = el('<div class="toast" role="status"><img src="' + IMG + d.i + '.webp" alt=""><div><small>' + escH(d.k) + '</small><p>' + escH(d.t) + '</p><div class="ta"><a href="' + d.u + '" target="_blank" rel="noopener">' + escH(d.b) + ' →</a><a href="' + KB.bot + '" target="_blank" rel="noopener">Получать напоминания</a></div></div><button class="x-btn" type="button" aria-label="Закрыть">×</button></div>');
    tBox.appendChild(x); requestAnimationFrame(function () { x.classList.add('in'); });
    function rm() { x.classList.remove('in'); setTimeout(function () { x.remove(); }, 450); }
    $('.x-btn', x).addEventListener('click', rm); setTimeout(rm, 12000);
  }
  function flushToasts() { if (tPending) setTimeout(toastDue, 3000); }
  /* ?show=popup|wheel|chat|tell|toast|menu – сразу показать состояние (для проверок и снимков) */
  if (SHOW) setTimeout(function () {
    if (SHOW === 'chat') openChat(true);
    else if (SHOW === 'teaser') { busy = 'chat'; teaser(); }
    else if (SHOW === 'wheel') openBig('wheel', showWheel);
    else if (SHOW === 'toast') { tLast = 0; toastDue(); }
    else if (SHOW === 'menu' && burger) burger.click();
    else if (SHOW === 'popup') { store('as_popup_ts', 0); popupNow(); }
    else if (SHOW === 'tell') tellNow();
  }, 300);
  setTimeout(function () { toastDue(); var iv = setInterval(function () { if (tCount >= 3) return clearInterval(iv); toastDue(); }, 45000); }, 45000);
})();
