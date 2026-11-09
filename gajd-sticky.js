/* Sticky practicum bar for guides (Евгений, msg 17802/17803).
   After 10% scroll a bottom bar with the practicum button appears.
   Every 30 s it slides away and a 2-second notice with a reader's state takes its place.
   Include before </body>: <script src="/gajd-sticky.js" data-topic="izmena|rasstavanie" defer></script> */
(function () {
  var me = document.currentScript;
  var topic = (me && me.getAttribute('data-topic')) || 'izmena';
  var NOTES = {
    izmena: [
      '3 дня после измены, острая стадия? Практикум – для вас',
      'Шатает из стороны в сторону? На практикуме разбираем и это',
      'Уже успокоилась, но не отпускает? Это тоже ваш случай',
      'Не можете решить, остаться или уйти? Практикум поможет',
      'Ночами прокручиваете переписку? Приходите на практикум'
    ],
    rasstavanie: [
      'Первые дни после расставания, острая стадия? Практикум – для вас',
      'Тянет написать ему? На практикуме разбираем и это',
      'То легче, то снова накрывает? Это тоже ваш случай',
      'Прошло время, а не отпускает? Практикум поможет',
      'Ждёте его сообщения каждый вечер? Приходите на практикум'
    ]
  }[topic] || [];

  var css = '.gs-bar,.gs-note{position:fixed;z-index:60;left:50%;width:min(560px,calc(100vw - 24px));bottom:calc(12px + env(safe-area-inset-bottom));transition:transform .5s cubic-bezier(.2,.9,.3,1.1),opacity .35s}' +
    '.gs-bar{transform:translate(-50%,160%);opacity:0}' +
    '.gs-bar.on{transform:translate(-50%,0);opacity:1}' +
    '.gs-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:56px;padding:12px 20px;border:0;border-radius:999px;cursor:pointer;background:linear-gradient(135deg,var(--plum,#6d2944),var(--plum2,#4f1c31));color:#fff;font:700 16px/1.2 var(--fb,sans-serif);box-shadow:0 16px 34px -14px rgba(79,28,49,.65);text-wrap:balance}' +
    '.gs-btn svg{flex:0 0 auto;width:20px;height:20px}' +
    '.gs-note{transform:translate(-50%,160%);opacity:0;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:18px;background:rgba(255,253,250,.97);border:1px solid var(--rose2,#e9b9bf);box-shadow:0 16px 36px -14px rgba(79,28,49,.45);color:#2e1f26;font:600 14px/1.3 var(--fb,sans-serif);pointer-events:none}' +
    '.gs-note.on{transform:translate(-50%,0);opacity:1}' +
    '.gs-dot{flex:0 0 auto;width:10px;height:10px;border-radius:50%;background:var(--rose,#c46f7e);box-shadow:0 0 0 4px rgba(196,111,126,.18)}' +
    'html.gs-up .rcp{bottom:calc(80px + env(safe-area-inset-bottom))!important}' +
    'html.md-open .gs-bar,html.md-open .gs-note{display:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var bar = document.createElement('div'); bar.className = 'gs-bar';
  bar.innerHTML = '<button type="button" class="gs-btn" id="gsBtn">Самое эффективное решение в вашем случае' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
  var note = document.createElement('div'); note.className = 'gs-note'; note.setAttribute('aria-live', 'polite');
  note.innerHTML = '<span class="gs-dot" aria-hidden="true"></span><span class="gs-t"></span>';
  document.body.appendChild(bar); document.body.appendChild(note);

  bar.querySelector('#gsBtn').addEventListener('click', function () {
    // VIP version (msg 18087): scroll to the VIP tariff so the reader sees what 1 980 ₽ includes, no payment popup
    var vip = document.documentElement.classList.contains('vip') && document.getElementById('vip');
    if (vip) { vip.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    var reg = document.getElementById('regBtn');
    if (reg) reg.click();
    else location.hash = '#register';
  });

  var shown = false, i = 0, timer = null;
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var want = max > 0 && scrollY / max >= 0.1;
    if (want === shown) return;
    shown = want;
    bar.classList.toggle('on', shown);
    document.documentElement.classList.toggle('gs-up', shown);
    if (shown && !timer && NOTES.length) timer = setInterval(cycle, 30000);
  }
  function cycle() {
    if (!shown || document.documentElement.classList.contains('md-open')) return;
    note.querySelector('.gs-t').textContent = NOTES[i++ % NOTES.length];
    bar.classList.remove('on');
    setTimeout(function () { note.classList.add('on'); }, 350);
    setTimeout(function () { note.classList.remove('on'); }, 2350);
    setTimeout(function () { if (shown) bar.classList.add('on'); }, 2700);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
