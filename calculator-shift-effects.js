/* Live moving SHIFT ink for the scientific calculator.
   Galaxy: slowly migrating blues/purples. Rainbow: separate hues moving
   across key legends. Main key faces, ALPHA red, and SHIFT border do not move. */
(()=>{
 "use strict";
 const buttons=[...document.querySelectorAll("[data-shift-effect]")];
 const swatches=[...document.querySelectorAll("[data-shift-colour]")];
 if(!buttons.length||!swatches.length)return;

 const legends=[...document.querySelectorAll(
   "#keys button .upper, .calculator .top .roundgroup:first-child .keylabel, .calculator .top .roundgroup em"
 )].filter(el=>el.textContent.trim()||el.querySelector("svg"));
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
 let effect="plain",frame=0,started=0,lastTick=-Infinity;

 function stop(){
   if(frame)cancelAnimationFrame(frame);
   frame=0;
   legends.forEach(label=>label.style.removeProperty("--shift-ink-local"));
   document.body.style.removeProperty("--chosen-shift");
 }
 function updateButtons(){
   buttons.forEach(button=>
     button.setAttribute("aria-pressed",String(button.dataset.shiftEffect===effect)));
   document.body.classList.toggle("shift-effect-galaxy",effect==="galaxy");
   document.body.classList.toggle("shift-effect-rainbow",effect==="rainbow");
   swatches.forEach(button=>
     button.setAttribute("aria-pressed",String(effect==="plain" &&
       button.dataset.shiftColour===document.body.dataset.shiftColour)));
 }
 function animate(now){
   if(effect==="plain")return;
   if(now-lastTick>=85){
     const elapsed=(now-started)/1000;
     const light=document.body.classList.contains("light");
     const brightness=light?36:76;
     const sat=effect==="galaxy"?77:85;
     // One full rainbow passes slowly across the secondary labels.
     // Galaxy follows shorter, partly out-of-phase blue/violet oscillations.
     legends.forEach((label,index)=>{
       const offset=legends.length?index/legends.length:0;
       const hue=effect==="rainbow"
         ?(215+offset*360+elapsed*360/34)%360
         :230+31*Math.sin(elapsed*Math.PI*2/39+offset*Math.PI*2)
             +12*Math.sin(elapsed*Math.PI*2/79+offset*Math.PI*4);
       label.style.setProperty("--shift-ink-local",
         "hsl("+hue.toFixed(2)+" "+sat+"% "+brightness+"%)");
     });
     lastTick=now;
   }
   if(!reduced.matches)frame=requestAnimationFrame(animate);
 }
 function choose(mode){
   if(mode!=="galaxy"&&mode!=="rainbow")mode="plain";
   stop();
   effect=mode;
   updateButtons();
   if(effect==="plain")return;
   started=performance.now();
   lastTick=-Infinity;
   animate(started);
 }
 buttons.forEach(button=>button.addEventListener("click",()=>choose(button.dataset.shiftEffect)));
 // The existing colour selector applies the solid ink before this runs.
 swatches.forEach(swatch=>swatch.addEventListener("click",()=>choose("plain")));
 reduced.addEventListener?.("change",()=>{
   if(effect==="plain")return;
   stop();
   started=performance.now();lastTick=-Infinity;
   animate(started);
 });
 choose("plain");
})();