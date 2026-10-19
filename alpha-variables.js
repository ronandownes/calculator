/* Nine ALPHA variable registers, independent of Casio firmware. */
(()=>{
"use strict";
const vars=Object.fromEntries("ABCDEFXYM".split("").map(k=>[k,0]));
let alphaMode=false,storePending=false;
const alphaButton=document.getElementById("alpha");
const keys=document.getElementById("keys");
if(!keys||!alphaButton)return;
const getCurrent=()=>{
 try { if(expr.trim())return evaluate(complete(expr));return Number.isFinite(ans)?ans:0; }
 catch(e){return Number.isFinite(ans)?ans:0;}
};
function indicators(){
 alphaButton.classList.toggle("active",alphaMode);
 document.querySelectorAll("#keys button[data-alpha]").forEach(b=>{
   const letter=b.dataset.alpha;
   b.classList.toggle("alpha-ready",alphaMode);
   if(!b.querySelector(".alpha-legend")){
     const legend=document.createElement("span");legend.className="alpha-legend";legend.textContent=letter;
     b.appendChild(legend);
   }
   const label=b.querySelector(".keyname");
   if(alphaMode && label)label.textContent=letter;
   else if(label)label.textContent=inverse?(b.dataset.alt||b.dataset.main):b.dataset.main;
 });
 const s=document.getElementById("shiftStatus");
 if(s) s.textContent=(inverse?"SHIFT ":"")+(alphaMode?"ALPHA":"")+(storePending?" STO":"");
}
alphaButton.addEventListener("click",e=>{
 e.stopImmediatePropagation();alphaMode=!alphaMode;
 if(alphaMode && inverse){inverse=false;render();}
 indicators();
},true);
keys.addEventListener("click",e=>{
 const b=e.target.closest("button[data-main]");
 if(!b)return;
 if(b.dataset.key==="sto"){
   e.preventDefault();e.stopImmediatePropagation();
   storePending=true;alphaMode=true;indicators();return;
 }
 if(!alphaMode||!b.dataset.alpha)return;
 e.preventDefault();e.stopImmediatePropagation();
 const letter=b.dataset.alpha;
 if(storePending){
   const val=getCurrent();
   if(Number.isFinite(val)){vars[letter]=val;document.getElementById("result").textContent=letter+" = "+fmt(val);}
   else document.getElementById("result").textContent="Value not defined";
   storePending=false;
 }else append("("+String(vars[letter])+")");
 alphaMode=false;indicators();
},true);
document.getElementById("shift").addEventListener("click",()=>{
 if(alphaMode){alphaMode=false;storePending=false;}
 queueMicrotask(indicators);
},true);
document.getElementById("on").addEventListener("click",()=>{alphaMode=false;storePending=false;queueMicrotask(indicators);},true);
indicators();
})();