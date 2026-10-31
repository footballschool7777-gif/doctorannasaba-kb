(function(){
document.documentElement.classList.add('js');
var R=matchMedia('(prefers-reduced-motion: reduce)').matches;
// entrances, staggered per section
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;io.unobserve(el);
 var sib=[].slice.call(el.parentNode.querySelectorAll(':scope>.up'));var k=Math.max(0,sib.indexOf(el));setTimeout(function(){el.classList.add('in')},R?0:k*80)})},{threshold:.12});
document.querySelectorAll('.up,.race,.t2').forEach(function(el){io.observe(el)});
// decode effect: letters settle from a scramble into the text
var AB='АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ';
function decode(el){if(R)return;var t=el.getAttribute('data-text'),h=el.innerHTML,n=0,len=t.length;
 var id=setInterval(function(){n+=Math.max(1,len/28);var s='';for(var i=0;i<len;i++){var c=t[i];s+=(i<n||c===' '||/[«».,:–]/.test(c))?c:AB[Math.random()*AB.length|0]}
 el.textContent=s;if(n>=len){clearInterval(id);el.innerHTML=h}},45)}
var h1=document.querySelector('.scr');if(h1)decode(h1);
var c2=document.querySelector('.scr2');if(c2){var o2=new IntersectionObserver(function(es){if(es[0].isIntersecting){o2.disconnect();decode(c2)}},{threshold:.5});o2.observe(c2)}
// recognise: tap to mark
document.querySelectorAll('.me').forEach(function(b){b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true')})});
// phrases on the disc
var bub=document.getElementById('bub'),pb=[].slice.call(document.querySelectorAll('.phb')),cur=0,auto=true;
function pick(i){cur=i;pb.forEach(function(x,k){x.classList.toggle('on',k===i)});bub.classList.add('sw');setTimeout(function(){bub.innerHTML=pb[i].innerHTML;bub.classList.remove('sw')},R?0:260)}
pb.forEach(function(b,k){b.addEventListener('click',function(){auto=false;pick(k)})});
if(bub&&!R)setInterval(function(){if(auto)pick((cur+1)%pb.length)},2600);
// promo timer
var e=document.getElementById('tm');if(e){var key='kl-tm-'+location.pathname,t=+localStorage.getItem(key);if(!t||t<Date.now()-864e5){t=Date.now()+6e5;localStorage.setItem(key,t)}
 (function f(){var s=Math.max(0,Math.round((t-Date.now())/1e3));e.textContent=Math.floor(s/60)+':'+('0'+s%60).slice(-2);if(s)setTimeout(f,1e3)})()}
})();
