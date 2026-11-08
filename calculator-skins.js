/* Left-rail skins; independent of the four LCD tint dots. */
(() => {
 "use strict";
 const neutral=document.getElementById("toggleNeutralSkin");
 const buttons=[...document.querySelectorAll("[data-science-skin]")];
 const status=document.getElementById("scienceSkinStatus");
 const skins=["dark","light","pink","mint","blue"];
 let selected="dark"; // Every new visit to /calculator/ starts here.
 function apply(skin){
   if(!skins.includes(skin))return;
   selected=skin;
   document.body.classList.toggle("dark",skin==="dark");
   document.body.classList.toggle("light",skin!=="dark");
   document.body.classList.remove("skin-pink","skin-mint","skin-blue");
   if(["pink","mint","blue"].includes(skin))document.body.classList.add("skin-"+skin);
   for(const b of buttons)b.setAttribute("aria-pressed",String(b.dataset.scienceSkin===skin));
   neutral.setAttribute("aria-pressed",String(skin==="dark"||skin==="light"));
   neutral.setAttribute("aria-label",skin==="dark"?"Scientific dark skin, click for light":"Scientific light skin, click for dark");
   if(status)status.textContent=({dark:"Dark",light:"Light",pink:"Pastel pink",mint:"Pastel green",blue:"Pastel blue"})[skin];
 }
 for(const b of buttons)b.addEventListener("click",()=>apply(b.dataset.scienceSkin));
 neutral?.addEventListener("click",()=>apply(selected==="dark"?"light":"dark"));
 apply("dark");
})();
