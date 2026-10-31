(function(){
var T=window.TEST,answers=[],qi=0,busy=false,shown=0,seen3=false;
var $=function(s){return document.querySelector(s)};
function glue(s){var re=/(^|[\s«(])([А-Яа-яЁёA-Za-z]{1,2})\s/g;return String(s).replace(/\s–/g,' –').replace(re,'$1$2 ').replace(re,'$1$2 ').replace(/(\d)\s/g,'$1 ').replace(/\s(\S+)$/,' $1')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function t(s){return esc(glue(s))}
function Q(){return T.questions.concat(T.branches[T.seg_branch[answers[0]||0]])}
function show(id){busy=false;shown=Date.now();document.querySelectorAll('.scr-q').forEach(function(e){e.classList.toggle('on',e.id===id)});document.body.classList.toggle('started',qi>0||id!=='quiz');if(document.body.classList.contains('started'))scrollTo(0,0)}
function counts(){var c={};answers.forEach(function(i,k){var l=Q()[k].a[i][0];if(l)c[l]=(c[l]||0)+1});return c}
function lead(){var c=counts(),b='',n=0,tie=false;for(var l in c){if(c[l]>n){b=l;n=c[l];tie=false}else if(c[l]===n)tie=true}return tie?'':b}
function render(){var q=Q()[qi],n=Q().length;
 
 $('#qnum').textContent=qi===n-1?'Последний вопрос':'Вопрос '+(qi+1)+' из '+n;
 $('#qbar').style.width=((qi+1)/n*100)+'%';$('#back').hidden=qi===0;$('#qq').innerHTML=t(q.q);
 var idx=q.a.map(function(a,i){return i});
 if(q.a[0][0]){var sc=idx.filter(function(i){return q.a[i][0]!=='N'});idx=sc.map(function(i,k){return sc[(k+qi)%sc.length]}).concat(idx.filter(function(i){return q.a[i][0]==='N'}))}
 $('#opts').innerHTML=idx.map(function(i){return '<button type="button" class="opt'+(answers[qi]===i?' sel':'')+'" data-i="'+i+'"><i></i><span>'+t(q.a[i][1])+'</span></button>'}).join('');
 show('quiz')}
function loader(L,reveal,done){show('load');$('#load').classList.remove('done');$('#lt').textContent=L.title;var ul=$('#ll'),lines=L.lines||[],k=0;$('#rv').hidden=true;
 ul.innerHTML=lines.map(function(x){return '<li>'+t(x)+'</li>'}).join('');var it=ul.querySelectorAll('li');
 function end(){if(reveal){$('#load').classList.add('done');if(L===T.loaders['3'])$('#lt').textContent='Уже сейчас можно заметить закономерность';$('#rvt').innerHTML=t(reveal);$('#rv').hidden=false;$('#cont').onclick=function(){if(busy)return;busy=true;done()}}else done()}
 if(!it.length){setTimeout(end,2000);return}
 var iv=setInterval(function(){if(k<it.length){it[k].classList.add('on');if(k)it[k-1].classList.add('ok');k++;return}it[k-1].classList.add('ok');clearInterval(iv);setTimeout(end,600)},900)}
function score(){var c=counts(),top=0;if(T.calm_min&&(c.N||0)>=T.calm_min)return 'N';
 T.order.forEach(function(l){top=Math.max(top,c[l]||0)});var tied=T.order.filter(function(l){return(c[l]||0)===top}),best=tied[0];
 for(var k=answers.length-1;k>=0&&tied.length>1;k--){var l=Q()[k].a[answers[k]][0];if(tied.indexOf(l)>=0){best=l;break}}return best}
function pick(i){if(busy||Date.now()-shown<300)return;busy=true;answers[qi]=i;$('#opts').querySelector('[data-i="'+i+'"]').classList.add('sel');
 setTimeout(function(){
  if(qi===2&&!seen3){seen3=true;var p=T.pattern;qi++;loader(T.loaders['3'],typeof p==='string'?p:(p[lead()]||p['']),render);return}
  if(qi===5&&qi<Q().length-1){qi++;loader(T.loaders['6'],T.reveal6,render);return}
  if(qi<Q().length-1){qi++;render()}else{var ty=score(),seg=T.seg_branch[answers[0]||0];
   loader(T.loaders.end,null,function(){location.href='../'+(ty==='N'?'N':seg+'-'+ty)+'/'})}},220)}
$('#opts').onclick=function(e){var b=e.target.closest('.opt');if(b)pick(+b.dataset.i)};
$('#back').onclick=function(){if(qi>0){qi--;render()}};
render();
})();
