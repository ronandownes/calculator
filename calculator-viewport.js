/* Fit Height / Fit Width and independent, unrestricted-feeling pinch zoom.
   Does not alter keys, calculations, or the browser's normal scroll gestures. */
(() => {
  "use strict";
  const calculator=document.querySelector(".calculator");
  const fitHeightButton=document.getElementById("fitHeight");
  const fitWidthButton=document.getElementById("fitWidth");
  if(!calculator || !fitHeightButton || !fitWidthButton) return;

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
    fitWidthButton.setAttribute("aria-pressed",String(fitMode==="width"));
    fitHeightButton.title=fitMode==="height"?"Fit Height (active)":"Fit Height";
    fitWidthButton.title=fitMode==="width"?"Fit Width (active)":"Fit Width";
  }
  function fit(mode) {
    if(mode!=="height" && mode!=="width")return;
    fitMode=mode;
    // Measurements are divided by current zoom to get the natural case size.
    const rect=calculator.getBoundingClientRect();
    const normalWidth=rect.width/scale;
    const normalHeight=rect.height/scale;
    if(!normalWidth || !normalHeight)return;
    const viewportWidth=document.documentElement.clientWidth;
    const viewportHeight=window.visualViewport?.height || innerHeight;
    const margin=20;
    const availableWidth=Math.max(160,viewportWidth-2*margin);
    const availableHeight=Math.max(180,viewportHeight-Math.max(0,rect.top)-margin);
    const target=mode==="height"?availableHeight/normalHeight:availableWidth/normalWidth;
    setScale(target);
  }
  function manual(next){
    fitMode=null;
    setScale(next);
  }
  fitHeightButton.addEventListener("click",()=>fit("height"));
  fitWidthButton.addEventListener("click",()=>fit("width"));

  function scheduleFit(){
    if(!fitMode || resizeQueued)return;
    resizeQueued=true;
    requestAnimationFrame(()=>{resizeQueued=false;if(fitMode)fit(fitMode)});
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
  if(fitMode) requestAnimationFrame(()=>fit(fitMode));
})();
