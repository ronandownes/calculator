/* Each colour swatch switches between the dark and light case in that hue.
   Neutral preserves the original graphite/grey design. */
(() => {
 "use strict";
 const buttons=[...document.querySelectorAll("[data-science-skin]")];
 const status=document.getElementById("scienceSkinStatus");
 const families=["red","green","blue","pink","neutral"];
 let family="neutral",tone="dark";
 function apply(nextFamily,nextTone){
   if(!families.includes(nextFamily)||!["dark","light"].includes(nextTone))return;
   family=nextFamily;tone=nextTone;
   document.body.classList.toggle("dark",tone==="dark");
   document.body.classList.toggle("light",tone==="light");
   document.body.classList.remove("skin-red","skin-pink","skin-mint","skin-green","skin-blue","skin-orange");
   if(family!=="neutral")document.body.classList.add("skin-"+(family==="green"?"mint":family));
   document.body.dataset.caseFamily=family;
   document.body.dataset.caseTone=tone;
   for(const b of buttons){
     const name=b.dataset.scienceSkin;
     const chosen=name===family;
     const label=name==="neutral"?"Grey":name[0].toUpperCase()+name.slice(1);
     b.setAttribute("aria-pressed",String(chosen));
     b.setAttribute("aria-label",label+" case, "+(chosen?tone:"not selected")+". "+(chosen?"Click for "+(tone==="dark"?"light":"dark"):"Click for dark")+".");
     b.title=label+(chosen?" · "+tone:"")+" · "+(chosen?"switch to "+(tone==="dark"?"light":"dark"):"select dark");
   }
   if(status)status.textContent=(tone==="dark"?"Dark ":"Light ")+(family==="neutral"?"grey":family);
 }
 for(const b of buttons)b.addEventListener("click",()=>{
   const selected=b.dataset.scienceSkin;
   apply(selected,selected===family?(tone==="dark"?"light":"dark"):"dark");
 });
 const shiftButtons=[...document.querySelectorAll("[data-shift-colour]")];
 function applyShiftColour(colour){
   if(!["blue","green","orange","neutral"].includes(colour))return;
   document.body.dataset.shiftColour=colour;
   for(const b of shiftButtons)b.setAttribute("aria-pressed",String(b.dataset.shiftColour===colour));
 }
 for(const b of shiftButtons)b.addEventListener("click",()=>applyShiftColour(b.dataset.shiftColour));
 applyShiftColour("blue");
 const requested=new URLSearchParams(location.search).get("skin");
 const legacy={dark:["neutral","dark"],light:["neutral","light"],mint:["green","light"],orange:["red","light"],pink:["pink","light"],blue:["blue","light"]};
 const pair=legacy[requested]||(/^((?:red|green|blue|pink|neutral))-(dark|light)$/.exec(requested||"")||[]).slice(1);
 apply(pair?.[0]||"neutral",pair?.[1]||"dark");
})();
