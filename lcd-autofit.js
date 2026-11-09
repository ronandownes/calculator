/* Accessible LCD expression sizing.
   Only adjusts font size of the typed mathematical expression.
   Answers, keypad, functions and saved calculations are untouched. */
(() => {
  "use strict";
  const screen = document.querySelector(".calculator .screen");
  const expression = document.getElementById("expression");
  const status = screen?.querySelector(".status");
  const result = document.getElementById("result");
  if (!screen || !expression || !status || !result) return;

  let pending = false;
  function measure() {
    pending = false;
    if (screen.classList.contains("lcd-menu-mode")) {
      expression.style.removeProperty("--lcd-expression-size");
      result.style.removeProperty("--lcd-result-size");
      return;
    }
    // Fit the answer first, preserving the largest legible size available.
    // Never distort individual glyphs; long results scroll horizontally.
    const inner=window.getComputedStyle(screen);
    const height=screen.clientHeight-(parseFloat(inner.paddingTop)||0)-(parseFloat(inner.paddingBottom)||0);
    const width=Math.max(50,screen.clientWidth-(parseFloat(inner.paddingLeft)||0)-(parseFloat(inner.paddingRight)||0)-7);
    const resultContents=result.textContent.trim();
    if(resultContents){
      const remaining=Math.max(26,height-status.offsetHeight-expression.offsetHeight-10);
      for(let px=88;px>=22;px-=2){
        result.style.setProperty("--lcd-result-size",px+"px");
        const actualWidth=Math.max(result.scrollWidth,result.querySelector("math")?.getBoundingClientRect().width||0);
        const actualHeight=Math.max(result.scrollHeight,result.querySelector("math")?.getBoundingClientRect().height||0);
        if(actualWidth<=width+2&&actualHeight<=remaining+2)break;
      }
    }else result.style.removeProperty("--lcd-result-size");
    if (!expression.textContent.trim()){expression.style.removeProperty("--lcd-expression-size");return;}
    const compact = window.matchMedia("(max-width: 700px)").matches;
    const largest = compact ? 48 : 56;
    const smallest = compact ? 22 : 26;
    const css = window.getComputedStyle(screen);
    const innerHeight = screen.clientHeight
      - Number.parseFloat(css.paddingTop || "0")
      - Number.parseFloat(css.paddingBottom || "0");
    const availableHeight = Math.max(34, innerHeight - status.offsetHeight
      - result.offsetHeight - 8);
    const availableWidth = Math.max(50, expression.clientWidth - 5);
    const math = expression.querySelector("math");

    // Search largest readable size. If even the minimum is too wide,
    // the expression remains horizontally scrollable instead of being cut.
    for (let size = largest; size >= smallest; size -= 2) {
      expression.style.setProperty("--lcd-expression-size", size + "px");
      const width = math ? math.getBoundingClientRect().width : expression.scrollWidth;
      const height = math ? math.getBoundingClientRect().height : expression.scrollHeight;
      if (width <= availableWidth + 1 && height <= availableHeight + 1) break;
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(measure);
  }

  new MutationObserver(schedule).observe(result, {childList:true,characterData:true,subtree:true});
  new MutationObserver(schedule).observe(expression, {
    childList: true,
    characterData: true,
    subtree: true
  });
  new ResizeObserver(schedule).observe(screen);
  window.addEventListener("resize", schedule, {passive:true});
  document.fonts?.ready.then(schedule);
  schedule();
})();