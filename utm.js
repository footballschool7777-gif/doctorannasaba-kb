/* UTM carry-over for doctorannasaba.ru: every GetCourse registration must say
   where the person came from (Евгений, msg 15421).
   - a page opened with utm_* remembers them (localStorage is shared by all pages);
   - a page opened without utm gets the remembered ones (else referrer / direct)
     written into its address before GetCourse forms and widgets read it;
   - utm_term = the page of the site where the person registered or clicked;
   - links to the landing, the quiz and doctor-saba.com carry the real channel.
   Include first thing in <head>: <script src="/utm.js"></script> */
(function () {
  var KEY = 'ds_utm', FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var parts = location.pathname.split('/').filter(Boolean);
  var slug = parts[0] || 'home';
  if (parts[1] && /^(seg\d-[A-Z]|[A-Z])$/.test(parts[1])) slug += '-' + parts[1];
  var isLanding = /^novaya-realnost/.test(slug);

  // remembered channel lives 30 days
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); return s && Date.now() - s.t < 2592e6 ? s.u : {}; } catch (e) { return {}; }
  }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify({ u: o, t: Date.now() })); } catch (e) {} }
  function bare(h) { return h.replace(/^(www\.|l\.|lm\.|m\.)/, ''); }
  function refUrl() { try { return new URL(document.referrer); } catch (e) { return null; } }

  var q = new URLSearchParams(location.search), own = {};
  q.forEach(function (v, k) { if (/^utm_/i.test(k) && v) own[k.toLowerCase()] = v; });
  var ref = refUrl(), external = ref && ref.host !== location.host;

  if (own.utm_source) save(FIELDS.reduce(function (o, k) { if (own[k]) o[k] = own[k]; return o; }, {}));
  else if (external && !load().utm_source) save({ utm_source: bare(ref.host), utm_medium: 'referral' });
  var cur = own.utm_source ? own : load();

  // Fill this page's address so GetCourse records the channel and the page.
  var add = {};
  if (!own.utm_source) {
    if (cur.utm_source) add = Object.assign({}, cur);
    else if (ref && !external) add = { utm_source: 'site', utm_medium: 'page', utm_campaign: ref.pathname.split('/')[1] || 'home' };
    else add = { utm_source: 'direct', utm_medium: 'none' };
  }
  if (!q.get('utm_term') && !(isLanding && own.utm_source)) {
    add.utm_term = isLanding ? (ref && !external ? (ref.pathname.split('/')[1] || 'home') : cur.utm_source && !own.utm_source ? 'saved' : 'landing') : slug;
  }
  if (Object.keys(add).length) {
    Object.keys(add).forEach(function (k) { if (add[k] && !q.get(k)) q.set(k, add[k]); });
    history.replaceState(history.state, '', location.pathname + '?' + q.toString() + location.hash);
  }

  // Real channel beats the utm hardcoded in a link; the clicked-from page goes to utm_term.
  function tag(href) {
    var u;
    try { u = new URL(href, location.href); } catch (e) { return href; }
    var mine = (u.host === location.host || u.host === 'doctorannasaba.ru') && /^\/(novaya-realnost[^/]*|kod-lyubvi)\//.test(u.pathname);
    if (!mine && !/(^|\.)doctor-saba\.com$/.test(u.host)) return href;
    var p = u.searchParams;
    if (cur.utm_source) FIELDS.forEach(function (k) { if (cur[k]) p.set(k, cur[k]); else p.delete(k); });
    else if (!p.get('utm_source')) { p.set('utm_source', 'site'); p.set('utm_medium', 'page'); p.set('utm_campaign', slug); }
    if (!isLanding) p.set('utm_term', slug);
    return u.toString();
  }
  function fix(a) { var h = a.getAttribute('href') || '', t = tag(h); if (t !== h) a.setAttribute('href', t); }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (a) fix(a);
  }, true);
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), fix);
  });
  window.dsUtm = { tag: tag, current: cur };
})();

/* iPhone: taps inside pop-up forms (see /ios-form-fix.js, msg 16875) */
(function () {
  try { var s = document.createElement('script'); s.src = '/ios-form-fix.js?v=1'; s.async = true; (document.head || document.documentElement).appendChild(s); } catch (e) {}
})();
