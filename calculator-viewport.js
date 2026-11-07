/* Whole-calculator zoom controls. Retain regular scrolling and keyboard input. */
(() => {
  "use strict";
  const calc=document.querySelector(".calculator");
  const fit=document.getElementById("fitHeight");
  const smaller=document.getElementById("zoomOut");
  const larger=document.getElementById("zoomIn");
  if(!calc||!fit||!smaller||!larger)return;

  const MIN=0.70, MAX=1.60;
  const clamp=n=>Math.min(MAX,Math.max(MIN,n));
  let scale=1;
  let autoFit=window.innerWidth>=800 && window.innerHeight>=720;
  let pinch=null;

  function update(next){
    scale=Math.round(clamp(next)*100)/100;
    calc.style.zoom=String(scale);
    fit.setAttribute("aria-pressed",String(autoFit));
    fit.setAttribute("aria-label",autoFit?"Fit to height enabled; click for 100%":"Fit calculator to height");
    fit.title=autoFit?"Fit to height on (click for 100%)":"Fit calculator to screen height";
    smaller.disabled=scale<=MIN;
    larger.disabled=scale>=MAX;
  }
  function fitHeight(){
    if(!autoFit)return;
    // The current zoom changes the measured height; divide it out before refitting.
    const measured=calc.getBoundingClientRect();
    const unzoomedHeight=measured.height/scale;
    if(!(unzoomedHeight>0))return;
    const room=Math.max(200,window.innerHeight-measured.top-24);
    update(Math.min(1,room/unzoomedHeight));
  }
  function manualZoom(next){
    autoFit=false;
    update(next);
  }
  fit.addEventListener("click",()=>{
    autoFit=!autoFit;
    if(autoFit)fitHeight();
    else update(1);
  });
  smaller.addEventListener("click",()=>manualZoom(scale-0.1));
  larger.addEventListener("click",()=>manualZoom(scale+0.1));
  window.addEventListener("resize",()=>{if(autoFit)requestAnimationFrame(fitHeight)},{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener("resize",()=>{if(autoFit)requestAnimationFrame(fitHeight)},{passive:true});

  // Two-finger pinch inside the calculator changes its size, not the user's input.
  const distance=touches=>{
    const a=touches[0],b=touches[1];
    return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  };
  calc.addEventListener("touchstart",event=>{
    if(event.touches.length===2)pinch={distance:distance(event.touches),scale};
  },{passive:true});
  calc.addEventListener("touchmove",event=>{
    if(!pinch||event.touches.length!==2)return;
    event.preventDefault();
    const ratio=distance(event.touches)/Math.max(1,pinch.distance);
    manualZoom(pinch.scale*ratio);
  },{passive:false});
  calc.addEventListener("touchend",event=>{
    if(event.touches.length<2)pinch=null;
  },{passive:true});
  calc.addEventListener("touchcancel",()=>{pinch=null;},{passive:true});
  calc.addEventListener("wheel",event=>{
    if(!event.ctrlKey)return;
    event.preventDefault();
    manualZoom(scale+(event.deltaY<0?0.06:-0.06));
  },{passive:false});
  calc.style.touchAction="pan-x pan-y";
  update(1);
  if(autoFit)requestAnimationFrame(fitHeight);
})();
