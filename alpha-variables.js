/* ClassWiz-style ALPHA registers and on-screen store notation.
   Independently coded; original calculator display is preserved. */
(() => {
  "use strict";
  const registers = Object.fromEntries([... "ABCDEFXYM"].map(letter => [letter, 0]));
  const keys = document.getElementById("keys");
  const alphaButton = document.getElementById("alpha");
  if (!keys || !alphaButton) return;

  let alphaMode = false;
  let storePending = false;
  const oldEvaluate = evaluate;
  const oldAppend = append;
  const oldRender = render;

  // Keep literal A, B, ... on the LCD. Resolve their values only for evaluation.
  // Adjacent letters use the calculator's implicit multiplication: AB = A × B.
  evaluate = function (input) {
    let source = String(input);
    const arrow = source.indexOf("→");
    if (arrow !== -1) source = source.slice(0, arrow);
    source = source.replace(/[A-Za-z]+/g, word => {
      if (!/^[A-FXYM]+$/.test(word)) return word; // preserve sin, Ans, log, nPr...
      return [...word].map(letter => "(" + String(registers[letter]) + ")").join("");
    });
    return oldEvaluate(source);
  };

  append = function (value) {
    // Beginning a new expression with a variable must discard the last result.
    if (/^[A-FXYM]$/.test(value) && justCalculated) {
      expr = "";
      justCalculated = false;
    }
    return oldAppend(value);
  };

  function indicators() {
    alphaButton.classList.toggle("active", alphaMode);
    document.querySelectorAll("#keys button[data-alpha]").forEach(button => {
      button.classList.toggle("alpha-ready", alphaMode || storePending);
      if (!button.querySelector(".alpha-legend")) {
        const legend = document.createElement("span");
        legend.className = "alpha-legend";
        legend.textContent = button.dataset.alpha;
        button.appendChild(legend);
      }
    });
    document.getElementById("mode").textContent = deg ? "D" : "R";
    const status = document.getElementById("shiftStatus");
    if (status) status.textContent = inverse ? "S" : alphaMode ? "A" : "";
  }

  render = function () {
    oldRender();
    indicators();
  };

  alphaButton.addEventListener("click", event => {
    event.stopImmediatePropagation();
    alphaMode = !alphaMode;
    if (alphaMode) inverse = false;
    render();
  }, true);

  keys.addEventListener("click", event => {
    const button = event.target.closest("button[data-main]");
    if (!button) return;
    const key = button.dataset.key;
    const letter = button.dataset.alpha;

    if (key === "sto" && !inverse) {
      event.preventDefault();
      event.stopImmediatePropagation();
      // The STO key introduces an arrow; the next ALPHA letter selects a register.
      if (expr.endsWith("→")) expr = expr.slice(0, -1);
      expr = (expr || "Ans").replace(/→[A-FXYM]$/, "") + "→";
      justCalculated = false;
      storePending = true;
      alphaMode = false;
      render();
      return;
    }

    if (storePending && letter) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const left = expr.split("→")[0] || "Ans";
      try {
        const value = evaluate(complete(left));
        if (!Number.isFinite(value)) throw Error("Math ERROR");
        registers[letter] = value;
        ans = value;
        expr = left + "→" + letter;
        justCalculated = true;
        storePending = false;
        alphaMode = false;
        history.unshift({expr, value: fmt(value)});
        history = history.slice(0, 30);
        renderHistory();
        render();
      } catch (error) {
        storePending = false;
        alphaMode = false;
        document.getElementById("result").textContent = error.message || "Math ERROR";
        indicators();
      }
      return;
    }

    if (alphaMode && letter) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alphaMode = false;
      append(letter);
      indicators();
      return;
    }

    if (key === "AC" || key === "DEL") {
      storePending = false;
      alphaMode = false;
    }
  }, true);

  document.getElementById("shift").addEventListener("click", () => {
    alphaMode = false;
    storePending = false;
    queueMicrotask(indicators);
  }, true);
  document.getElementById("on").addEventListener("click", () => {
    alphaMode = false;
    storePending = false;
    queueMicrotask(indicators);
  }, true);

  render();
})();
