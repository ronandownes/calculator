/* Fixed-size, horizontally navigable LCD: expressions never shrink to fit.
   LCD text sizes change only with physical display width, not input length.
   Supports plain entry, editable native MathML templates and exact results. */
(() => {
  "use strict";
  const screen = document.querySelector(".calculator .screen");
  const expression = document.getElementById("expression");
  const result = document.getElementById("result");
  const nav = document.getElementById("nav");
  if (!screen || !expression || !result || !nav) return;

  // Single source of truth for LCD text sizing (in unzoomed calculator pixels).
  const LCD = Object.freeze({
    regularInput: 30,
    regularAnswer: 31,
    narrowInput: 26,
    narrowAnswer: 28,
    narrowScreen: 320,
    scrollStep: 82
  });
  let pending = false;
  let previousExpression = expression.textContent;
  let previousResult = result.textContent;

  function setSizes() {
    const narrow = screen.clientWidth < LCD.narrowScreen;
    screen.style.setProperty("--lcd-expression-size", (narrow ? LCD.narrowInput : LCD.regularInput) + "px");
    screen.style.setProperty("--lcd-result-size", (narrow ? LCD.narrowAnswer : LCD.regularAnswer) + "px");
  }

  const indicators = new Map();
  for (const [name, element] of [["expression", expression], ["result", result]]) {
    for (const direction of ["left", "right"]) {
      const arrow = document.createElement("button");
      arrow.type = "button";
      arrow.className = "lcd-scroll-arrow lcd-scroll-" + name + " lcd-scroll-" + direction;
      arrow.textContent = direction === "left" ? "◀" : "▶";
      arrow.setAttribute("aria-label", "Scroll " + name + " " + direction);
      arrow.title = "Scroll " + name + " " + direction;
      arrow.hidden = true;
      arrow.addEventListener("click", () => scroll(element, direction));
      screen.append(arrow);
      indicators.set(name + "-" + direction, arrow);
    }
    element.addEventListener("scroll", schedule, {passive: true});
  }

  function scroll(node, direction) {
    node.scrollBy({left: (direction === "left" ? -1 : 1) * LCD.scrollStep, behavior: "auto"});
    schedule();
  }

  function caretIntoView() {
    const caret = expression.querySelector(".template-insertion-caret");
    if (!caret) return false;
    const outer = expression.getBoundingClientRect();
    const inner = caret.getBoundingClientRect();
    const gutter = 22;
    if (inner.right > outer.right - gutter) expression.scrollLeft += inner.right - outer.right + gutter;
    else if (inner.left < outer.left + gutter) expression.scrollLeft -= outer.left + gutter - inner.left;
    return true;
  }

  function indicate(node, name) {
    const overflow = node.scrollWidth > node.clientWidth + 2;
    indicators.get(name + "-left").hidden = !overflow || node.scrollLeft <= 2;
    indicators.get(name + "-right").hidden = !overflow || node.scrollLeft + node.clientWidth >= node.scrollWidth - 2;
  }

  function refresh() {
    pending = false;
    setSizes();
    if (screen.classList.contains("lcd-menu-mode")) {
      for (const arrow of indicators.values()) arrow.hidden = true;
      return;
    }
    const newExpression = expression.textContent;
    const newResult = result.textContent;
    if (!caretIntoView() && newExpression !== previousExpression) {
      // New ordinary input shows the latest characters; older ones remain scrollable.
      expression.scrollLeft = expression.scrollWidth;
    }
    if (newResult !== previousResult) {
      // For long answers, start at the final digits rather than clipping the suffix.
      result.scrollLeft = result.scrollWidth;
    }
    previousExpression = newExpression;
    previousResult = newResult;
    indicate(expression, "expression");
    indicate(result, "result");
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(refresh);
  }

  function isStructuredEntry() { return Boolean(window.calculatorTemplateState); }
  function preferredScrollTarget() {
    const expressionOverflows = expression.scrollWidth > expression.clientWidth + 2;
    const resultOverflows = result.scrollWidth > result.clientWidth + 2;
    return resultOverflows && !expressionOverflows ? result : expression;
  }
  function navigate(direction) { scroll(preferredScrollTarget(), direction); }

  // Without the structured editor, left/right are display-navigation keys,
  // never a destructive DEL shortcut. Structured entry retains caret movement.
  nav.addEventListener("click", event => {
    if (isStructuredEntry() || screen.classList.contains("lcd-menu-mode")) return;
    const key = event.target.closest("button[data-nav]")?.dataset.nav;
    if (key !== "left" && key !== "right") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(key);
  }, true);

  document.addEventListener("keydown", event => {
    if (isStructuredEntry() || screen.classList.contains("lcd-menu-mode")) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    navigate(event.key === "ArrowLeft" ? "left" : "right");
  }, true);

  const observer = new MutationObserver(schedule);
  observer.observe(expression, {childList: true, characterData: true, subtree: true});
  observer.observe(result, {childList: true, characterData: true, subtree: true});
  observer.observe(screen, {attributes: true, attributeFilter: ["class"]});
  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(screen);
    resizeObserver.observe(expression);
    resizeObserver.observe(result);
  }
  window.addEventListener("resize", schedule, {passive: true});
  document.fonts?.ready.then(schedule);
  schedule();
})();