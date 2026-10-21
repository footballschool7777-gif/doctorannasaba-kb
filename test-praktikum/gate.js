/* Practicum test gate (funnel qaYf, GetCourse scene).
 * Personal link from the bot: ?u=<GC user id>&d=<deadline, ms epoch>&k=<check key>.
 * - Without a complete valid tuple in the URL the page is a plain public test: no gate, no calls.
 * - At the deadline an unfinished test is covered by the «Доступ к тесту закрыт» screen.
 * - When the result is shown before the deadline, the GC funnel event is called (retried until
 *   GC answers 200). The funnel then stops reminders Н1–Н4 and adds the user to the GC group
 *   «Практикум НР 25-28.11 | тест пройден».
 * Integration contract with index.html (keep it when the page is rebuilt):
 *   preferred: document.dispatchEvent(new CustomEvent('pt:test-finished', {detail:{title}}))
 *   fallback:  #results visible (no [hidden]) and #result-title has text.
 * Known limit: completion is remembered per browser; a pass on another device is not seen here.
 */
(function () {
  'use strict';
  var EVENT_URL = 'https://doctor-saba.com/chtm/app/builder/event/~reg/GA3DrZlB2IlaX49HAVg059321/pt-pass-nqd6lw4h?hash=Ceu67kVSvN';
  var MAX_TIMER = 2147483000;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  // Same formula as the funnel transformer on the proxy node (user.ptKey).
  function keyFor(u, d) { return ((Number(u) * 7919 + Math.floor(Number(d) / 1000) * 104729) % 2147483647).toString(36); }

  var q = new URLSearchParams(location.search);
  var p = { u: q.get('u') || '', d: q.get('d') || '', k: q.get('k') || '' };
  var now0 = Date.now();
  var valid = /^\d{3,10}$/.test(p.u) && /^\d{13}$/.test(p.d) &&
    Number(p.d) < now0 + 7 * 864e5 && keyFor(p.u, p.d) === p.k;
  var deadline = valid ? Number(p.d) : 0;
  var scope = valid ? 'ptGate.' + p.u + '.' + p.k : '';
  var state = { done: valid && get(scope + '.done') === '1', sent: valid && get(scope + '.sent') === '1', inflight: false, tries: 0, title: '' };

  function deliver() {
    if (!valid || state.sent || state.inflight) return;
    state.inflight = true; state.tries++;
    var body = JSON.stringify({ userId: p.u, customData: { k: p.k, result: state.title.slice(0, 200) } });
    var retry = function () {
      state.inflight = false;
      if (state.tries < 6) setTimeout(deliver, Math.min(60000, 2000 * Math.pow(2, state.tries)));
    };
    try {
      fetch(EVENT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true })
        .then(function (r) { if (r.ok) { state.inflight = false; state.sent = true; put(scope + '.sent', '1'); } else retry(); }, retry);
    } catch (e) { retry(); }
  }

  function markDone(title) {
    if (!valid || Date.now() >= deadline && !state.done) return; // late completion does not count
    if (!state.done) { state.done = true; put(scope + '.done', '1'); }
    if (title) state.title = String(title);
    deliver();
  }

  function el(id) { return document.getElementById(id); }
  function resultTitle() { var t = el('result-title'); return t ? t.textContent.trim() : ''; }
  function resultShown() {
    var r = el('results');
    return !!(r && !r.hidden && r.getClientRects().length && resultTitle());
  }

  function closeScreen() {
    if (el('pt-gate-closed')) return;
    var s = document.createElement('style');
    s.textContent = '#pt-gate-closed{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:var(--bg,#f6f0e6);color:var(--ink,#2b2118);text-align:center;font-family:inherit}' +
      '#pt-gate-closed .box{max-width:30rem}#pt-gate-closed h1{font-size:clamp(1.6rem,5vw,2.4rem);line-height:1.15;margin:0 0 .6em;text-wrap:balance}' +
      '#pt-gate-closed p{font-size:1.05rem;line-height:1.5;margin:0;text-wrap:balance;opacity:.85}html.pt-gate-lock,html.pt-gate-lock body{overflow:hidden}';
    document.head.appendChild(s);
    Array.prototype.forEach.call(document.body.children, function (c) { c.setAttribute('inert', ''); c.setAttribute('aria-hidden', 'true'); });
    var w = document.createElement('div');
    w.id = 'pt-gate-closed'; w.setAttribute('role', 'alert');
    w.innerHTML = '<div class="box"><h1>Доступ к&nbsp;тесту закрыт</h1><p>Тест был доступен 24&nbsp;часа после получения сообщения в&nbsp;боте.</p></div>';
    document.body.appendChild(w);
    document.documentElement.classList.add('pt-gate-lock');
    document.dispatchEvent(new CustomEvent('pt:gate-closed'));
  }

  function check() {
    if (!valid) return;
    if (!state.done && Date.now() >= deadline) { closeScreen(); return; }
    if (resultShown()) markDone(resultTitle());
  }

  function schedule() {
    if (!valid || state.done) return;
    var left = deadline - Date.now();
    if (left <= 0) { check(); return; }
    setTimeout(function () { check(); schedule(); }, Math.min(left + 250, MAX_TIMER));
  }

  var pending = false;
  function soon() { if (pending) return; pending = true; setTimeout(function () { pending = false; check(); }, 120); }

  function start() {
    if (!valid) return;
    check();
    if (state.done && !state.sent) deliver();
    if (window.MutationObserver) {
      new MutationObserver(soon).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
    }
    document.addEventListener('pt:test-finished', function (e) { markDone((e.detail && e.detail.title) || resultTitle()); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
    window.addEventListener('pageshow', check);
    schedule();
  }
  window.ptGate = { valid: valid, deadline: deadline || null, state: state, check: check };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
