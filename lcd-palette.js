/* Four independent Maths dots select a readable LCD tint. */
(() => {
  "use strict";
  const display=document.querySelector(".calculator .screen");
  const buttons=[...document.querySelectorAll(".lcd-palette [data-lcd-tone]")];
  if(!display||buttons.length!==4)return;
  const colours={
    green:"#dce9dd",  // original natural LCD green
    red:"#f4dfe1",
    blue:"#dfebf8",
    grey:"#e4e6e9"
  };
  function select(tone){
    if(!Object.prototype.hasOwnProperty.call(colours,tone))return;
    display.style.setProperty("--lcd-tone",colours[tone]);
    buttons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.lcdTone===tone)));
    display.dataset.lcdTone=tone;
  }
  for(const button of buttons){
    button.addEventListener("click",()=>select(button.dataset.lcdTone));
  }
  select("green");
  // Deep SETUP contrast can also change the LCD colour without breaking
  // the dot selectors: clicking any dot restores that exact tint.
  window.calculatorSetLcdTone=select;
})();
