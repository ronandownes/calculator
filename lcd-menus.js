/* Interactive LCD options. The four-dot identity is the only branding. */
(() => {
  "use strict";
  const screen=document.querySelector(".calculator .screen");
  const keypad=document.getElementById("keys");
  const nav=document.getElementById("nav");
  const angleButton=document.getElementById("angle");
  if (!screen||!keypad||!nav||!angleButton) return;

  const menuRoot=document.createElement("div");
  menuRoot.className="lcd-menu";
  menuRoot.setAttribute("aria-label","Calculator options");
  menuRoot.hidden=true;
  screen.appendChild(menuRoot);
  let menu=null;
  let choice=1;

  const pages={
    options:[
      ["1","Hyperbolic Func"],
      ["2","Angle Unit"]
    ],
    angle:[
      ["1","°"],
      ["2","r"],
      ["3","g"]
    ],
    hyperbolic:[
      ["1","sinh"],
      ["2","cosh"],
      ["3","tanh"],
      ["4","sinh⁻¹"],
      ["5","cosh⁻¹"],
      ["6","tanh⁻¹"]
    ]
  };
  const hyperbolic={1:"sinh",2:"cosh",3:"tanh",4:"asinh",5:"acosh",6:"atanh"};
  function draw() {
    screen.classList.add("lcd-menu-mode");
    menuRoot.hidden=false;
    menuRoot.replaceChildren();
    menuRoot.classList.toggle("two-columns",menu==="angle"||menu==="hyperbolic");
    const list=document.createElement("div");
    list.className=(menu==="angle"||menu==="hyperbolic")?"angle-grid":"option-list";
    for(const [number,title] of pages[menu]) {
      const b=document.createElement("button");
      b.type="button";
      b.dataset.option=number;
      b.textContent=number+":"+title;
      b.setAttribute("aria-label",number+": "+(menu==="angle"?({1:"Degrees",2:"Radians",3:"Gradians"}[number]):title));
      list.appendChild(b);
    }
    menuRoot.appendChild(list);
    if(menu==="angle"){
      const arrow=document.createElement("span");
      arrow.className="angle-mark";
      arrow.textContent="◀";
      arrow.setAttribute("aria-hidden","true");
      menuRoot.appendChild(arrow);
    }
  }
  function show(page) {
    if(!pages[page])return;
    menu=page;
    choice=1;
    draw();
  }
  function close() {
    menu=null;
    screen.classList.remove("lcd-menu-mode");
    menuRoot.hidden=true;
    render();
  }
  function back() {
    if(menu==="options")close();
    else show("options");
  }
  function select(number) {
    if(!menu)return false;
    if(menu==="options"){
      if(number==="1")show("hyperbolic");
      else if(number==="2")show("angle");
      else return false;
      return true;
    }
    if(menu==="angle"){
      const mode=({1:"deg",2:"rad",3:"grad"})[number];
      if(!mode)return false;
      angleUnit=mode;
      deg=mode==="deg";
      close();
      return true;
    }
    if(menu==="hyperbolic"){
      const f=hyperbolic[number];
      if(!f)return false;
      close();
      append(f);
      return true;
    }
    return false;
  }
  menuRoot.addEventListener("click",e=>{
    const b=e.target.closest("button[data-option]");
    if(b)select(b.dataset.option);
  });
  keypad.addEventListener("click",e=>{
    const b=e.target.closest("button[data-key]");
    if(!b)return;
    const key=b.dataset.key;
    if(key==="opt"){
      e.preventDefault();e.stopImmediatePropagation();
      show("options");return;
    }
    if(!menu)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(key==="AC")close();
    else if(key==="DEL")back();
    else if(/^\d$/.test(key))select(key);
  },true);
  nav.addEventListener("click",e=>{
    if(!menu)return;
    const b=e.target.closest("button[data-nav]");
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const direction=b.dataset.nav;
    if(direction==="left")back();
    else if(direction==="right")select(String(choice));
    else {
      const length=pages[menu].length;
      choice=(choice+(direction==="down"?1:-1)+length-1)%length+1;
      const item=menuRoot.querySelector('[data-option="'+choice+'"]');
      item?.focus();
    }
  },true);
  angleButton.addEventListener("click",e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(menu==="angle")close();
    else show("angle");
  },true);
  document.addEventListener("keydown",e=>{
    if(!menu||e.ctrlKey||e.altKey||e.metaKey)return;
    if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
    const key=e.key;
    if(/^\d$/.test(key)){
      e.preventDefault();e.stopImmediatePropagation();select(key);
    }else if(key==="Escape"||key==="Backspace"){
      e.preventDefault();e.stopImmediatePropagation();
      if(key==="Backspace")back();else close();
    }else if(key==="ArrowLeft"){
      e.preventDefault();e.stopImmediatePropagation();back();
    }else if(key==="Enter"){
      e.preventDefault();e.stopImmediatePropagation();select(String(choice));
    }
  },true);
  // The auxiliary controls remain accessible through the document but do not
  // replace the LCD menus or introduce a second calculator face.
  const selector=document.querySelector(".theme-switch");
  if(selector)document.querySelector(".calculator .calc-toolbar").appendChild(selector);
})();
