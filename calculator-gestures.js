/* A universal calculator gesture. Double tap blank case = EXE;
   triple tap blank case = SHIFT + EXE (decimal approximation).
   Delays the second tap to distinguish triple without evaluating twice. */
(()=>{
 "use strict";
 const menu=!!document.querySelector(".menu-fit-viewport .device");
 const surface=menu?document.querySelector(".menu-fit-viewport"):document.querySelector(".calc-viewport");
 if(!surface)return;
 const IGNORE="button,a,input,textarea,select,[role='button'],[contenteditable],.lcd,.screen,.calc-fullscreen-exit,.menu-fullscreen-exit";
 const WAIT=390,MAX_MOVE=14,MAX_GAP=460,MAX_DISTANCE=36;
 let pending=null,taps=0,lastTime=0,lastX=0,lastY=0,down=null;
 function blank(target){
   if(!(target instanceof Element)||target.closest(IGNORE))return false;
   // On the LCD the result view, selection, and maths cursor take precedence.
   return surface.contains(target);
 }
 function execute(approx){
   if(menu){
     const key=document.querySelector('.menu-fit-viewport [data-cmd="exe"]');
     if(!key)return;
     if(approx)document.querySelector('.menu-fit-viewport [data-cmd="shift"]')?.click();
     key.click();
   }else{
     const key=document.querySelector('#keys button[data-key="="]');
     if(!key)return;
     if(approx)document.getElementById("shift")?.click();
     key.click();
   }
 }
 function clear(){if(pending!==null)clearTimeout(pending);pending=null;}
 surface.addEventListener("pointerdown",e=>{
   if(!e.isPrimary||e.button!==0||!blank(e.target)){down=null;return}
   down={x:e.clientX,y:e.clientY,time:performance.now(),target:e.target,pointerId:e.pointerId};
 },true);
 surface.addEventListener("pointercancel",()=>{down=null;clear();taps=0},true);
 surface.addEventListener("pointerup",e=>{
   const start=down;down=null;
   if(!start||start.pointerId!==e.pointerId||!blank(e.target))return;
   if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>MAX_MOVE||
      performance.now()-start.time>650){clear();taps=0;return}
   const now=performance.now();
   if(now-lastTime>MAX_GAP||Math.hypot(e.clientX-lastX,e.clientY-lastY)>MAX_DISTANCE){
     clear();taps=0;
   }
   lastTime=now;lastX=e.clientX;lastY=e.clientY;
   taps++;
   if(taps===2){
     clear();
     pending=setTimeout(()=>{
       pending=null;
       if(taps===2){taps=0;execute(false);}
     },WAIT);
   }else if(taps===3){
     clear();taps=0;
     execute(true);
   }
 },true);
 // Suppress native double-click selection/zoom on blank case. Other controls untouched.
 surface.addEventListener("dblclick",e=>{
   if(blank(e.target))e.preventDefault();
 },true);
})();
