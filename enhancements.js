/* Calculator extensions — independent code, no external libraries */
(function(){
"use strict";
const oldHandle=handle, oldEvaluate=evaluate;
let mem=0, precision="auto",lastExact="", menuOpen=false;
const num=x=>{if(!Number.isFinite(x))throw Error("Undefined result");return x;};
const fact=n=>{if(!Number.isInteger(n)||n<0||n>170)throw Error("Whole number 0–170 required");let r=1;for(let k=2;k<=n;k++)r*=k;return r;};
const choose=(n,r)=>{if(!Number.isInteger(n)||!Number.isInteger(r)||n<0||r<0||r>n)throw Error("nCr: whole numbers, 0 ≤ r ≤ n");r=Math.min(r,n-r);let v=1;for(let k=1;k<=r;k++)v=v*(n-r+k)/k;return Math.round(v);};
const perm=(n,r)=>{if(!Number.isInteger(n)||!Number.isInteger(r)||n<0||r<0||r>n)throw Error("nPr: whole numbers, 0 ≤ r ≤ n");let v=1;for(let k=0;k<r;k++)v*=n-k;return num(v);};
function splitTop(str,sep){
 let depth=0;for(let i=0;i<str.length;i++){if(str[i]==='(')depth++;else if(str[i]===')')depth--;else if(depth===0&&str.slice(i).startsWith(sep))return[str.slice(0,i),str.slice(i+sep.length)];}return null;
}
evaluate=function(s){
 s=s.replace(/(\d|\))\s*nPr\s*(\d|\()/g,'$1 nPr $2').replace(/(\d|\))\s*nCr\s*(\d|\()/g,'$1 nCr $2');
 for(const [operator,fun] of [[' nPr ',perm],[' nCr ',choose]]){
 const parts=splitTop(s,operator);if(parts)return num(fun(evaluate(parts[0]),evaluate(parts[1])));
 }
 if(s.startsWith("logbase(")&&s.endsWith(")")){const parts=splitTop(s.slice(8,-1),',');if(!parts)throw Error("Enter base and value");const [b,x]=parts.map(evaluate);if(b<=0||b===1||x<=0)throw Error("Invalid logarithm");return Math.log(x)/Math.log(b);}
 if(s.startsWith("root(")&&s.endsWith(")")){const parts=splitTop(s.slice(5,-1),',');if(!parts)throw Error("Enter degree and radicand");const [n,x]=parts.map(evaluate);if(n===0||x<0&&n%2===0)throw Error("Root undefined");return Math.sign(x)*Math.pow(Math.abs(x),1/n);}
 return oldEvaluate(s);
};
const oldAppend=append;
append=function(s){
 if(s==='npr'){oldAppend(' nPr ');return}
 if(s==='ncr'){oldAppend(' nCr ');return}
 if(s==='pi'){oldAppend('π');return}
 if(s==='econst'){oldAppend('e');return}
 if(s==='percent'){oldAppend('%');return}
 if(s==='tenexp'){oldAppend('×10^');return}
 if(s==='logbase'){oldAppend('logbase(');return}
 if(s==='root'){oldAppend('root(');return}
 if(s==='comma'){oldAppend(',');return}
 oldAppend(s);
};
const oldFmt=fmt;
fmt=function(v){
 if(!Number.isFinite(v))return "Math ERROR";
 if(precision==='sci')return v.toExponential(9).replace('e+','×10^').replace('e-','×10^-');
 if(precision==='fix')return v.toFixed(6);
 return oldFmt(v);
};
const status=(message)=>{document.getElementById('mode').title=message;};
const panel=document.createElement('section');
panel.className='extension-panel';
panel.innerHTML='<h2>Scientific tools</h2><div class="extgrid"></div><p class="exthelp" id="exthelp">SHIFT swaps the visible key labels. Tap an operation, enter its arguments, then press =.</p><p class="extnote">Independent web calculator · not affiliated with Casio. For reference calculations, check rounding and domain restrictions.</p>';
document.querySelector('.side').prepend(panel);
const extra=[
 ["nPr","npr"],["nCr","ncr"],["π","pi"],["e","econst"],["n√x","root"],["logₐx","logbase"],[",","comma"],["%","percent"],["x!","factorial"],["1/x","inversepower"],["x³","cube"],["10ˣ","pow10"],["eˣ","exp"],["∛x","cbrt"],["DEG/RAD","angle"],["SCI/FIX","precision"],["M+","mplus"],["M−","mminus"],["MR","recall"],["MS","sto"],["DMS → decimal","dms"],["Decimal → DMS","decimaldms"],["OFF","off"],["MENU","menu"]
];
const grid=panel.querySelector('.extgrid');
extra.forEach(([label,key])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.ext=key;grid.append(b);});
const style=document.createElement('style');style.textContent='.extension-panel{border-bottom:1px solid #ddd;margin-bottom:15px;padding-bottom:12px}.extension-panel h2{font-size:17px;margin-top:0}.extgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.extgrid button{cursor:pointer;border:1px solid #8791a4;border-radius:6px;background:#f4f6fa;min-height:36px;font-weight:600;font-size:12px}.extgrid button:active{background:#d9e5fa}.exthelp,.extnote{font-size:12px!important;line-height:1.45}.extnote{color:#666}';document.head.append(style);
grid.addEventListener('click',e=>{const b=e.target.closest('button[data-ext]');if(b)handle(b.dataset.ext);});
function value(){return evaluate(complete(expr||'Ans'))}
handle=function(v){
 if(v==='menu'||v==='opt'){menuOpen=!menuOpen;panel.querySelector('.extgrid').hidden=!menuOpen;status("Scientific tools");panel.scrollIntoView({block:'nearest',behavior:'smooth'});return}
 if(v==='npr'||v==='ncr'||v==='pi'||v==='econst'||v==='percent'||v==='logbase'||v==='root'||v==='comma'){append(v);return}
 if(v==='mplus'){try{mem+=value();memory=mem}catch(e){document.getElementById('result').textContent=e.message}return}
 if(v==='mminus'){try{mem-=value();memory=mem}catch(e){document.getElementById('result').textContent=e.message}return}
 if(v==='sto'){try{mem=value();memory=mem;status("Stored in M")}catch(e){document.getElementById('result').textContent=e.message}return}
 if(v==='recall'){append(String(memory));return}
 if(v==='precision'){precision=precision==='auto'?'sci':precision==='sci'?'fix':'auto';render();return}
 if(v==='sd'){
  if(!expr)return;
  try{const val=value();let best=null;for(let d=1;d<=10000;d++){const n=Math.round(val*d);if(Math.abs(n/d-val)<1e-11){best=[n,d];break;}}lastExact=best&&best[1]!==1?best.join('/') : fmt(val);document.getElementById('result').textContent=document.getElementById('result').textContent===lastExact?fmt(val):lastExact;}catch(e){document.getElementById('result').textContent=e.message}
  return;
 }
 if(v==='frac'){append('÷');status("Enter numerator ÷ denominator; press S⇔D for fraction display");return}
 if(v==='mixed'){append('+');status("Mixed number: whole part plus numerator ÷ denominator");return}
 if(v==='dms'){try{const x=value(),a=Math.abs(x),d=Math.floor(a),m=Math.floor((a-d)*60),sec=((a-d)*60-m)*60;document.getElementById('result').textContent=(x<0?'-':'')+d+'° '+m+'′ '+Number(sec.toFixed(8))+'″'}catch(e){document.getElementById('result').textContent=e.message}return}
 if(v==='decimaldms'){status("Enter degrees + minutes/60 + seconds/3600");append('+');return}
 if(v==='angle'){oldHandle(v);status(deg?"Degrees":"Radians");return}
 if(v==='eng'){append('×10^3');return}
 if(v==='right'||v==='up'||v==='down'){if(v==='up'||v==='down'){const index=v==='up'?0:1;const h=history[index];if(h){expr=h.expr;justCalculated=false;render()}}return}
 if(v==='off'){document.getElementById('result').textContent='OFF';expr='';document.getElementById('expression').textContent='';return}
 oldHandle(v);
};

/* Exact prime factorisation is distinct from x! */
const previousHandle=handle;
handle=function(v){
 if(v==='primefact'){
  try{
   let n=Math.round(value());
   if(!Number.isSafeInteger(n)||n<2||Math.abs(n-value())>1e-10)throw Error("FACT requires an integer ≥ 2");
   const factors=[];let m=n;
   for(let p=2;p*p<=m && p<=1000000;p+=(p===2?1:2)){if(m%p===0){let pow=0;do{m/=p;pow++}while(m%p===0);factors.push(pow>1?p+'^'+pow:String(p));}}
   if(m>1)factors.push(String(m));
   document.getElementById('result').textContent=n+' = '+factors.join(' × ');
  }catch(e){document.getElementById('result').textContent=e.message}
  return;
 }
 if(v==='random'){append(String(Math.random()));return}
 previousHandle(v);
};
panel.querySelector('.extgrid').hidden=false;
render();
})();