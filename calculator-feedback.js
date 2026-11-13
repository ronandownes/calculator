/* Non-destructive scientific-key feedback and SHIFT/ALPHA accessibility.
   The existing handlers still own all calculator mathematics. */
(() => {
  "use strict";
  const calculator=document.querySelector(".calculator");
  const keys=document.getElementById("keys");
  const shift=document.getElementById("shift");
  const alpha=document.getElementById("alpha");
  if(!calculator||!keys||!shift||!alpha)return;

  const keyButtons=[...keys.querySelectorAll("button[data-key]")];
  const flashTimers=new WeakMap();

  function flash(button){
    if(!button)return;
    const old=flashTimers.get(button);
    if(old!==undefined)clearTimeout(old);
    button.classList.remove("key-flash");
    // Restart the brief feedback, even when the same key is tapped quickly.
    void button.offsetWidth;
    button.classList.add("key-flash");
    flashTimers.set(button,setTimeout(()=>{
      button.classList.remove("key-flash");
      flashTimers.delete(button);
    },220));
  }

  function fromEvent(event){
    const target=event.target;
    if(!(target instanceof Element))return null;
    const button=target.closest("#keys button, .calculator .top button");
    return button&&calculator.contains(button)?button:null;
  }

  // Pointer feedback begins on contact; click also covers keyboard activation
  // and buttons invoked by the existing calculator's gesture handlers.
  calculator.addEventListener("pointerdown",event=>{
    if(event.isPrimary&&event.button===0)flash(fromEvent(event));
  },{passive:true,capture:true});
  calculator.addEventListener("click",event=>flash(fromEvent(event)),true);

  const keyboardKey={
    "*":"×", "/":"÷", "-":"−",
    "Enter":"=", "Backspace":"DEL", "Escape":"AC"
  };
  document.addEventListener("keydown",event=>{
    if(event.ctrlKey||event.altKey||event.metaKey||
       ["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
    const key=keyboardKey[event.key]||event.key;
    const button=keyButtons.find(item=>item.dataset.key===key);
    if(button)flash(button);
  },true);

  function syncModes(){
    const shifted=shift.classList.contains("active");
    const alphaOn=alpha.classList.contains("active");
    document.body.classList.toggle("shift-engaged",shifted);
    document.body.classList.toggle("alpha-engaged",alphaOn);
    shift.setAttribute("aria-pressed",String(shifted));
    alpha.setAttribute("aria-pressed",String(alphaOn));

    for(const button of keyButtons){
      const main=button.dataset.main||button.dataset.key||"Key";
      const alternative=button.dataset.alt||"";
      const available=Boolean(button.dataset.altkey)&&button.dataset.altkey!==button.dataset.key;
      const visible=shifted&&alternative&&available?alternative:main;
      const next=shifted&&alternative&&available
        ?visible+"; SHIFT function"
        :main+(alternative&&available?"; SHIFT: "+alternative:"");
      if(button.getAttribute("aria-label")!==next)
        button.setAttribute("aria-label",next);
    }
  }
  // All existing render(), SHIFT and ALPHA handlers are left intact.
  new MutationObserver(syncModes).observe(shift,{attributes:true,attributeFilter:["class"]});
  new MutationObserver(syncModes).observe(alpha,{attributes:true,attributeFilter:["class"]});
  syncModes();
})();