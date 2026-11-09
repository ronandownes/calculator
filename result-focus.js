/* Classroom presentation: click an answer to enlarge; click again / Escape to close.
   Shared by scientific and menu calculators. Not a replacement for calculation UI. */
(() => {
 "use strict";
 const source=document.querySelector(".calculator #result, .menu-fit-viewport #display .result");
 const host=document.querySelector(".calculator .screen, .menu-fit-viewport .lcd");
 if(!host)return;
 let overlay=null,number=null,formula=null,opened=false;
 const css=document.createElement("style");
 css.textContent=`
 .maths-focus-backdrop{position:fixed;inset:0;z-index:20000;background:rgba(15,19,28,.80);
   display:flex;align-items:center;justify-content:center;padding:clamp(12px,4vw,48px)}
 .maths-focus-card{box-sizing:border-box;position:relative;display:flex;flex-direction:column;
   align-items:center;justify-content:center;gap:clamp(20px,6vh,65px);
   width:100%;height:min(88dvh,900px);max-width:1400px;padding:clamp(20px,5vw,80px);
   border-radius:20px;background:#dce9dd;color:#17241c;box-shadow:0 12px 50px #0008;
   overflow:hidden;text-align:center;cursor:pointer}
 .maths-focus-expression{max-width:100%;opacity:.35;font:600 clamp(26px,5vw,68px)/1.2 "Cambria Math",Georgia,serif;
   overflow:auto;white-space:normal;overflow-wrap:anywhere}
 .maths-focus-answer{box-sizing:border-box;max-width:100%;width:100%;font:700 96px/1.12 "Cambria Math",Georgia,serif;
   font-variant-numeric:lining-nums tabular-nums;overflow:auto;white-space:nowrap;scrollbar-width:thin}
 .maths-focus-answer math{font-size:inherit!important}
 .maths-focus-close{position:absolute;top:14px;right:14px;font:700 16px Arial,sans-serif;
   border:1px solid #8b9e90;border-radius:8px;background:#f7fbf7;color:#16241d;
   padding:12px;cursor:pointer;min-height:44px}
 .maths-focus-instruction{position:absolute;bottom:12px;left:20px;right:20px;opacity:.65;
   font:500 12px Arial,sans-serif}
 .calculator #result:not(:empty),.menu-fit-viewport #display .result:not(:empty){cursor:zoom-in}
 .calculator #result:not(:empty):focus-visible,.menu-fit-viewport #display .result:not(:empty):focus-visible{
   outline:3px solid #2d7dd2;outline-offset:3px}
 body.maths-focus-open{overflow:hidden}
 @media(prefers-reduced-motion:no-preference){.maths-focus-backdrop{animation:maths-focus-in .15s ease-out}
 @keyframes maths-focus-in{from{opacity:0}to{opacity:1}}}
 `;
 document.head.append(css);
 function currentResult(){return document.querySelector(".calculator #result:not(:empty), .menu-fit-viewport #display .result:not(:empty)")}
 function adjust(){
  if(!opened||!number)return;
  const maxWidth=number.clientWidth-6;
  const maxHeight=Math.max(80,number.parentElement.clientHeight*.5);
  for(let size=160;size>=24;size-=4){
   number.style.fontSize=size+"px";
   if(number.scrollWidth<=maxWidth+3 && number.scrollHeight<=maxHeight)break;
  }
 }
 function close(){
  if(!opened)return;
  opened=false;
  document.body.classList.remove("maths-focus-open");
  overlay?.remove();overlay=null;number=null;formula=null;
  currentResult()?.focus({preventScroll:true});
 }
 function open(sourceNode){
  if(opened){close();return;}
  if(!sourceNode?.textContent.trim())return;
  overlay=document.createElement("div");overlay.className="maths-focus-backdrop";
  overlay.setAttribute("role","presentation");
  const card=document.createElement("div");card.className="maths-focus-card";
  card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");
  card.setAttribute("aria-label","Enlarged calculator result");
  const exit=document.createElement("button");exit.className="maths-focus-close";
  exit.textContent="× Close";exit.setAttribute("aria-label","Close enlarged result");
  formula=document.createElement("div");formula.className="maths-focus-expression";
  const original=document.querySelector(".calculator #expression,.menu-fit-viewport #display .expression");
  if(original)formula.innerHTML=original.innerHTML;
  number=document.createElement("div");number.className="maths-focus-answer";
  number.innerHTML=sourceNode.innerHTML;
  const help=document.createElement("div");help.className="maths-focus-instruction";
  help.textContent="Click the answer again or press Escape to return";
  card.append(exit,formula,number,help);overlay.append(card);document.body.append(overlay);
  opened=true;document.body.classList.add("maths-focus-open");
  exit.addEventListener("click",close);
  overlay.addEventListener("click",event=>{
   if(event.target.closest(".maths-focus-answer")||event.target===overlay||event.target===card)close();
  });
  exit.focus({preventScroll:true});
  requestAnimationFrame(adjust);
 }
 document.addEventListener("click",e=>{
  if(opened)return;
  const source=e.target.closest(".calculator #result, .menu-fit-viewport #display .result");
  if(source){source.setAttribute("tabindex","0");open(source);}
 });
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&opened){e.preventDefault();e.stopImmediatePropagation();close();}
  else if(!opened&&(e.key==="Enter"||e.key===" ")&&
    document.activeElement?.matches(".calculator #result, .menu-fit-viewport #display .result")){
   e.preventDefault();open(document.activeElement);
  }
 },true);
 new MutationObserver(()=>{
  const r=currentResult();
  if(r&&!r.hasAttribute("tabindex")){r.tabIndex=0;r.setAttribute("role","button");r.setAttribute("aria-label","Enlarge result");}
 }).observe(host,{subtree:true,childList:true,characterData:true});
 window.addEventListener("resize",adjust,{passive:true});
})();
