(function(){
  var T = window.TEST, LS = 'anna-test-' + T.slug;
  var answers = [], qi = 0, type = null, wish = null;
  var busy = false, shownAt = 0; // one tap per screen: a double tap must not skip a question
  var second = null;
  var $ = function(s){ return document.querySelector(s); };

  // Keep short words and the last word of a block from hanging alone (widow law).
  function glue(s){
    var re = /(^|[\s«(])([А-Яа-яЁёA-Za-z]{1,2})\s/g;
    return String(s).replace(/\s–/g, '\u00A0–').replace(re, '$1$2\u00A0').replace(re, '$1$2\u00A0')
      .replace(/\s(же|ли|бы)(?=[\s,.!?])/g, '\u00A0$1')
      .replace(/(\d)\s/g, '$1\u00A0')
      .replace(/\s(\S+)$/, '\u00A0$1');
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function t(s){ return esc(glue(s)); }

  function show(id){
    busy = false; shownAt = Date.now();
    document.querySelectorAll('.screen').forEach(function(el){ el.classList.toggle('on', el.id === id); });
    window.scrollTo(0, 0);
  }

  function store(){ try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch(e){ return {}; } }
  function save(o){ try { var s = store(); for (var k in o) s[k] = o[k]; localStorage.setItem(LS, JSON.stringify(s)); } catch(e){} }

  // Hook for GetCourse registration (Ника). Must return a Promise.
  window.submitLead = window.submitLead || function(data){
    return Promise.resolve({ok: true});
  };

  function D(d){ return typeof d === 'string' ? {t: d} : d; }
  // 'pair', 'single' or '' (complicated / not asked): '' shows every desire
  function status(){
    if ((T.status_pair || []).indexOf(answers[0]) >= 0) return 'pair';
    if ((T.status_single || []).indexOf(answers[0]) >= 0) return 'single';
    return '';
  }
  // school test: the first answer picks the branch, the rest of the questions differ
  function Q(){
    if (!T.branches) return T.questions;
    // «Код любви»: the first answer is the segment, each segment has its own test (owner, msg 1306)
    if (T.seg_branch) return T.questions.concat(T.branches[T.seg_branch[answers[0] || 0]]);
    var b = status() === 'pair' ? 'pair' : 'single';
    // living apart: same branch, questions without a shared home (owner, msg 1292)
    if (b === 'pair' && T.branches.apart && (T.status_apart || []).indexOf(answers[0]) >= 0) b = 'apart';
    return T.questions.concat(T.branches[b]);
  }
  // type card of the woman's segment, the calm type N is common
  function TY(l){
    var st = T.seg_types && T.seg_branch && T.seg_types[T.seg_branch[answers[0]]];
    return (st && st[l]) || T.types[l];
  }
  function lead3(){ // leading type after the first answers, '' when nobody leads
    var c = counts(), best = '', n = 0, tie = false;
    for (var l in c){ if (c[l] > n){ best = l; n = c[l]; tie = false; } else if (c[l] === n) tie = true; }
    return tie ? '' : best;
  }

  function renderQ(){
    var q = Q()[qi], n = Q().length;
    $('#qnum').textContent = qi === n - 1 ? 'Последний вопрос' : 'Вопрос ' + (qi + 1) + ' · из ' + n;
    $('#qbar').style.width = ((qi + 1) / n * 100) + '%';
    $('#back').hidden = qi === 0;
    $('#qtext').innerHTML = t(q.q);
    // scored answers rotate per question so the type order is not obvious; data-i keeps the real index
    var idx = q.a.map(function(a, i){ return i; });
    // the calm answer N always stays last
    if (q.a[0][0]){
      var sc = idx.filter(function(i){ return q.a[i][0] !== 'N'; });
      idx = sc.map(function(i, k){ return sc[(k + qi) % sc.length]; }).concat(idx.filter(function(i){ return q.a[i][0] === 'N'; }));
    }
    $('#opts').innerHTML = idx.map(function(i){
      return '<button class="opt' + (answers[qi] === i ? ' sel' : '') + '" data-i="' + i + '">' + t(q.a[i][1]) + '</button>';
    }).join('');
    show('quiz');
  }

  function pick(i){
    if (busy || Date.now() - shownAt < 300) return;
    busy = true;
    answers[qi] = i;
    save({answers: answers, qi: qi + 1});
    $('#opts').querySelector('[data-i="' + i + '"]').classList.add('sel');
    setTimeout(function(){
      if (qi === (T.seg_branch ? 3 : 2) && !pick.seenPattern){
        pick.seenPattern = true;
        var pt = T.pattern; $('#ptext').innerHTML = t(typeof pt === 'string' ? pt : (pt[lead3()] || pt['']));
        show('pattern'); return;
      }
      if (qi < Q().length - 1){ qi++; renderQ(); } else { finish(); }
    }, 220);
  }

  function counts(){
    var c = {};
    answers.forEach(function(i, k){ var l = Q()[k].a[i][0]; if (l) c[l] = (c[l] || 0) + 1; });
    return c;
  }

  // A tie goes to the type of the latest answer among the tied ones, not to a fixed type.
  function score(){
    var c = counts(), top = 0, tied;
    second = null;
    // mostly calm answers: a soft common result instead of a scenario (stress test, msg 1318)
    if (T.calm_min && (c.N || 0) >= T.calm_min) return 'N';
    T.order.forEach(function(l){ top = Math.max(top, c[l] || 0); });
    tied = T.order.filter(function(l){ return (c[l] || 0) === top; });
    var best = tied[0];
    for (var k = answers.length - 1; k >= 0 && tied.length > 1; k--){
      var l = Q()[k].a[answers[k]][0];
      if (tied.indexOf(l) >= 0){ best = l; break; }
    }
    second = null;
    T.order.forEach(function(l){ if (l !== best && (c[l] || 0) >= top - 1 && (c[l] || 0) > 1 && (!second || c[l] > c[second])) second = l; });
    return best;
  }

  function finish(){
    type = score();
    save({type: type, answers: answers});
    show('loader');
    var m = $('#lmsg'), k = 0;
    m.textContent = T.loader[0];
    var iv = setInterval(function(){
      k++;
      if (k < T.loader.length){ m.textContent = T.loader[k]; return; }
      clearInterval(iv); renderResult();
    }, 1100);
  }

  // Cards for a woman in a couple, when the type has them (school test)
  function typeView(){
    var r = TY(type), p = status() === 'pair' && r.pair;
    if (!p) return r;
    var v = JSON.parse(JSON.stringify(r));
    if (p.sub) v.sub = p.sub;
    if (p.key) v.key = p.key;
    if (p.reality) v.reality = p.reality;
    if (p.title0) v.cards[0][1] = p.title0;
    for (var k in p.cards) v.cards[k][2] = p.cards[k];
    return v;
  }

  // Her own latest answer of the result type: the result rests on what she chose, not on a label
  function why(){
    if (!T.why) return '';
    for (var k = answers.length - 1; k > 0; k--){
      if (T.why_q && T.why_q.indexOf(k) < 0) continue;
      var a = Q()[k].a[answers[k]];
      if (a[0] === type) return '<span class="why">' + t(T.why.replace('{a}', a[1].replace(/^«|»$/g, '')).replace('{n}', TY(type).name)) + '</span>';
    }
    return '';
  }

  function renderResult(){
    var r = typeView(), reg = !!store().lead;
    $('#rname').textContent = r.name;
    $('#rsub').innerHTML = t(r.sub) + why() + (second ? '<span class="mix">' + t('В ваших ответах есть и черты сценария «' + TY(second).name + '»') + '</span>' : '');
    $('#scale-l').innerHTML = T.order.map(function(l){
      return '<span' + (l === type ? ' class="me"' : '') + '>' + esc(TY(l).name) + '</span>';
    }).join('');
    $('#scale-bar').style.width = ((T.order.indexOf(type) + 1) / T.order.length * 100) + '%';
    $('#scale-l').parentNode.hidden = T.order.indexOf(type) < 0;
    var n = r.cards.length, icons = n > 3 ? ['🧭', '✨', '👣'] : ['🧭', '✨'];
    $('#cards').innerHTML = r.cards.map(function(c, i){
      var last = i === n - 1;
      return '<div class="card' + (last && !reg ? ' locked' : '') + '"' + (last ? ' id="card3"' : '') + '>' +
        '<div class="lbl"><i class="ico">' + (last ? (reg ? '🔓' : '🔒') : icons[i]) + '</i><div>Карта ' + (i + 1) + ' из ' + n + '<span>' + esc(c[0]) + '</span></div></div>' +
        '<div class="' + (last ? 'hide' : '') + '"><h3>' + t(c[1]) + '</h3><p>' + t(c[2]) + '</p>' +
        (last ? '<div class="key"><b>Ключ:</b> ' + t(r.key) + '</div>' : '') + '</div>' +
        (last ? '<button class="btn open-btn" data-open>' + esc(T.open_btn || 'Открыть третью карту') + '</button>' : '') +
        '</div>';
    }).join('');
    $('#reality-h').textContent = glue(r.reality || '');
    $('#reality').hidden = !r.reality;
    var st = status();
    $('#desires').innerHTML = T.desires.map(function(d, i){
      d = D(d);
      return d.only && st && d.only !== st ? '' : '<button class="opt" data-w="' + i + '">' + t(d.t) + '</button>';
    }).join('');
    show('result');
  }

  function renderFinal(){
    var r = typeView(), reg = !!store().lead;
    var w = D(T.desires.filter(function(d){ return D(d).t === wish; })[0] || wish);
    $('#wish').innerHTML = 'Ваше желание: «' + t(w.t) + '»';
    $('#ba').querySelectorAll('p').forEach(function(el){ el.remove(); });
    $('#ba').insertAdjacentHTML('beforeend', (w.after || r.after).map(function(p){
      return '<p class="now">' + t(p[0]) + '</p><p class="aft">' + t(p[1]) + '</p>';
    }).join(''));
    $('#final-cta').hidden = reg;
    $('#final-done').hidden = !reg;
    show('final');
  }

  function openForm(){
    $('#f-btn').textContent = $('#final').classList.contains('on') ? 'Занять место на практикуме' : (T.open_btn || 'Открыть третью карту');
    $('#modal').classList.add('on');
  }
  function closeForm(){ $('#modal').classList.remove('on'); }

  $('#go').onclick = function(){ qi = 0; answers = []; pick.seenPattern = false; save({answers: [], qi: 0}); renderQ(); };
  $('#again').onclick = function(){ try { var s = store(); delete s.type; delete s.wish; delete s.answers; delete s.qi; localStorage.setItem(LS, JSON.stringify(s)); } catch(e){} show('start'); };
  $('#share').onclick = function(){
    var u = location.href.split('#')[0];
    if (navigator.share) { navigator.share({title: document.title, text: T.share || document.title, url: u}).catch(function(){}); return; }
    var b = this; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function(){ b.textContent = 'Ссылка скопирована'; }, function(){ prompt('Ссылка на тест:', u); });
  };
  // after signing up on the final screen she must still get card 3, as the form promised
  $('#to-card').onclick = function(){
    renderResult();
    setTimeout(function(){ var c = $('#card3'); if (c) c.scrollIntoView({block: 'center'}); }, 50);
  };
  $('#back').onclick = function(){ if (qi > 0){ qi--; renderQ(); } };
  $('#opts').onclick = function(e){ var b = e.target.closest('.opt'); if (b) pick(+b.dataset.i); };
  $('#cont').onclick = function(){ if (busy) return; busy = true; qi++; renderQ(); };
  document.addEventListener('click', function(e){
    if (e.target.closest('[data-open]')) openForm();
    if (e.target === $('#modal') || e.target.closest('.x')) closeForm();
    var w = e.target.closest('[data-w]');
    if (w && !busy){ busy = true; wish = D(T.desires[+w.dataset.w]).t; w.classList.add('sel'); save({wish: wish}); setTimeout(renderFinal, 220); }
  });

  // every visit starts from the first screen (owner, msg 1289); only the registration is kept
  try { var s0 = store(); delete s0.type; delete s0.wish; delete s0.answers; delete s0.qi; localStorage.setItem(LS, JSON.stringify(s0)); } catch(e){}

  // an error mark goes away as soon as she fixes the field
  ['#f-name', '#f-email', '#f-phone'].forEach(function(id){ $(id).addEventListener('input', function(){ this.classList.remove('err'); }); });

  var sending = false;
  $('#form').onsubmit = function(e){
    e.preventDefault();
    var f = {name: $('#f-name'), email: $('#f-email'), phone: $('#f-phone')}, ok = true;
    f.name.classList.toggle('err', !f.name.value.trim()); if (!f.name.value.trim()) ok = false;
    var em = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim()); f.email.classList.toggle('err', !em); if (!em) ok = false;
    var ph = f.phone.value.replace(/\D/g, '').length >= 10; f.phone.classList.toggle('err', !ph); if (!ph) ok = false;
    if (!ok || sending) return;
    sending = true;
    var data = {name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), test: T.slug, type: type, answers: answers, wish: wish};
    window.submitLead(data).then(function(){
      sending = false;
      save({lead: data});
      closeForm();
      var c3 = $('#card3'); if (c3){ c3.classList.remove('locked'); c3.querySelector('.ico').textContent = '🔓'; }
      if ($('#final').classList.contains('on')){ $('#final-cta').hidden = true; $('#final-done').hidden = false; }
      else if (c3) c3.scrollIntoView({behavior: 'smooth', block: 'center'});
    });
  };
})();
