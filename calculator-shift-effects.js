/* Scientific calculator: opt-in colour migration through SHIFT ink.
   The real keys, casing, LCD and existing calculation logic are unchanged. */
(()=>{
  "use strict";
  const buttons=[...document.querySelectorAll("[data-shift-effect]")];
  const swatches=[...document.querySelectorAll("[data-shift-colour]")];
  if(!buttons.length||!swatches.length)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  let effect="plain",handle=0,start=0,lastFrame=-Infinity;
  function visualState(){
    for(const button of buttons)
      button.setAttribute("aria-pressed",String(button.dataset.shiftEffect===effect));
    document.body.classList.toggle("shift-effect-rainbow",effect==="rainbow");
    document.body.classList.toggle("shift-effect-galaxy",effect==="galaxy");
    if(effect!=="plain")for(const swatch of swatches)swatch.setAttribute("aria-pressed","false");
  }
  function stop(){
    if(handle)cancelAnimationFrame(handle);
    handle=0;
    document.body.style.removeProperty("--chosen-shift");
    document.body.style.removeProperty("--chosen-shift-ring");
  }
  function tick(now){
    if(effect==="plain")return;
    if(now-lastFrame>=70){
      const t=(now-start)/1000;
      const hue=effect==="rainbow" ? ((215+t*360/42)%360) :
        237+33*Math.sin(t*Math.PI*2/38)+12*Math.sin(t*Math.PI*2/83);
      const sat=effect==="rainbow"?84:74;
      const light=document.body.classList.contains("light");
      const brightness=light ? (effect==="rainbow"?34:38) : (effect==="rainbow"?73:75);
      const ink="hsl("+hue.toFixed(2)+" "+sat+"% "+brightness+"%)";
      document.body.style.setProperty("--chosen-shift",ink);
      document.body.style.setProperty("--chosen-shift-ring",ink);
      lastFrame=now;
    }
    if(!reduce.matches)handle=requestAnimationFrame(tick);
  }
  function choose(mode){
    stop();
    effect=mode;
    visualState();
    if(mode==="plain"){
      // Reapply the established solid colour without changing calculator skin.
      document.body.dataset.shiftColour=document.body.dataset.shiftColour||"blue";
      for(const swatch of swatches)
        swatch.setAttribute("aria-pressed",String(swatch.dataset.shiftColour===document.body.dataset.shiftColour));
      return;
    }
    start=performance.now();lastFrame=-Infinity;
    tick(start);
  }
  for(const button of buttons)button.addEventListener("click",()=>choose(button.dataset.shiftEffect));
  for(const swatch of swatches)swatch.addEventListener("click",()=>choose("plain"));
  reduce.addEventListener?.("change",()=>{
    if(effect==="plain")return;
    stop();start=performance.now();lastFrame=-Infinity;tick(start);
  });
  visualState();
})();