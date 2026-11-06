/* iPhone fix for forms inside fixed pop-up windows (Евгений, msg 16875).
   On iOS (Safari and the Instagram/Telegram in-app browsers) the page behind a
   position:fixed window scrolls when the keyboard opens; after that taps land
   one row below what is drawn: the checkbox and the "register" button do not
   react. While a field inside a fixed window is in use we pin the page in place
   (body position:fixed) and re-align the viewport when the keyboard moves.
   Loaded by /utm.js, so every page gets it. */
(function () {
  var ua = navigator.userAgent;
  var ios = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!ios) return;
  var FIELD = 'input,textarea,select';
  var y = 0, box = null, timer = 0;

  function fixedParent(el) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (getComputedStyle(el).position === 'fixed') return el;
    }
    return null;
  }
  function shown(el) {
    if (!el || !el.isConnected) return false;
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && s.pointerEvents !== 'none' && +s.opacity > 0 && !el.hidden;
  }
  function lock(el) {
    if (box) { box = el; return; }
    box = el; y = window.scrollY || window.pageYOffset || 0;
    var b = document.body.style;
    b.position = 'fixed'; b.top = -y + 'px'; b.left = '0'; b.right = '0'; b.width = '100%';
    timer = setInterval(function () { if (!shown(box)) unlock(); }, 250);
  }
  function unlock() {
    if (!box) return;
    box = null; clearInterval(timer);
    var b = document.body.style;
    b.position = b.top = b.left = b.right = b.width = '';
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }
  // keyboard opened/closed: the page must stay at 0 while pinned, so taps match the picture
  function realign() { if (box) setTimeout(function () { if (box) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, 60); }

  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (!t || !t.matches || !t.matches(FIELD)) return;
    var p = fixedParent(t);
    if (p) lock(p);
  }, true);
  // GetCourse widget: the fields live in an iframe, the page only sees its own blur
  window.addEventListener('blur', function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (a && a.tagName === 'IFRAME') { var p = fixedParent(a); if (p) lock(p); }
    }, 0);
  });
  document.addEventListener('focusout', realign, true);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', realign);
  window.addEventListener('pagehide', unlock);
})();
