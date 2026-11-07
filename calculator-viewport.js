/* Fit Height, demonstration Zoom In, and two-finger pinch resizing.
   Does not alter keys, calculations, or the browser's normal scroll gestures. */
(() => {
  "use strict";
  const calculator=document.querySelector(".calculator");
  const fitHeightButton=document.getElementById("fitHeight");
  const zoomInButton=document.getElementById("zoomIn");
  if(!calculator || !fitHeightButton || !zoomInButton) return;

  const MIN=0.25, MAX=5;
  let scale=1;
  let fitMode=innerWidth>=800 && innerHeight>=700 ? "height" : null;
  let gesture=null;
  let resizeQueued=false;
  const clamp=n=>Math.min(MAX,Math.max(MIN,n));

  function setScale(next) {
    if(!Number.isFinite(next))return;
    scale=Math.round(clamp(next)*1000)/1000;
    calculator.style.zoom=String(scale);
    fitHeightButton.setAttribute("aria-pressed",String(fitMode==="height"));
    zoomInButton.disabled=scale>=MAX;
    zoomInButton.title=scale>=MAX?"Maximum zoom reached":"Zoom In";
    fitHeightButton.title=fitMode==="height"?"Fit Height (active)":"Fit Height";

  }
  function fitHeight() {
    fitMode="height";
    // Zoom changes measured dimensions; divide by the current scale.
    const rect=calculator.getBoundingClientRect();
    const normalHeight=rect.height/scale;
    if(!normalHeight)return;
    const viewportHeight=window.visualViewport?.height || innerHeight;
    const margin=20;
    const availableHeight=Math.max(180,viewportHeight-Math.max(0,rect.top)-margin);
    setScale(availableHeight/normalHeight);
  }
  function manual(next){
    fitMode=null;
    setScale(next);
  }
  fitHeightButton.addEventListener("click",fitHeight);
  // Magnify 20% per click for classroom projection; Fit Height restores the view.
  zoomInButton.addEventListener("click",()=>manual(scale*1.2));

  function scheduleFit(){
    if(!fitMode || resizeQueued)return;
    resizeQueued=true;
    requestAnimationFrame(()=>{resizeQueued=false;if(fitMode==="height")fitHeight()});
  }
  addEventListener("resize",scheduleFit,{passive:true});
  window.visualViewport?.addEventListener("resize",scheduleFit,{passive:true});

  // Pinch inside calculator — at any time, even when fit mode was active.
  const distance=t=>{
    const a=t[0],b=t[1];
    return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  };
  calculator.addEventListener("touchstart",event=>{
    if(event.touches.length===2){
      gesture={startDistance:distance(event.touches),startScale:scale};
    }
  },{passive:true});
  calculator.addEventListener("touchmove",event=>{
    if(!gesture || event.touches.length!==2)return;
    event.preventDefault();
    manual(gesture.startScale*distance(event.touches)/Math.max(1,gesture.startDistance));
  },{passive:false});
  calculator.addEventListener("touchend",event=>{
    if(event.touches.length<2)gesture=null;
  },{passive:true});
  calculator.addEventListener("touchcancel",()=>{gesture=null},{passive:true});

  // On precision trackpads, Ctrl+wheel is a pinch gesture in many browsers.
  calculator.addEventListener("wheel",event=>{
    if(!event.ctrlKey)return;
    event.preventDefault();
    manual(scale*Math.exp(-event.deltaY*.012));
  },{passive:false});
  // Single-finger scrolling remains possible; do not force a pan or fullscreen mode.
  calculator.style.touchAction="pan-x pan-y";
  setScale(1);
  if(fitMode) requestAnimationFrame(fitHeight);
})();
