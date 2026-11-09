/* Key-driven calculator menus. Separate OPTN and SHIFT+MENU (SETUP)
   follow the reference calculator's menu structure. */
(() => {
  "use strict";
  const screen=document.querySelector(".calculator .screen");
  const keypad=document.getElementById("keys");
  const nav=document.getElementById("nav");
  const physicalMenu=document.getElementById("angle");
  if(!screen||!keypad||!nav||!physicalMenu)return;

  const root=document.createElement("div");
  root.className="lcd-menu";
  root.setAttribute("aria-label","Calculator menus");
  root.hidden=true;
  screen.appendChild(root);

  const settings=window.calculatorSettings={
    output:"math",format:"norm",norm:1,digits:3,sciDigits:10,
    fraction:"improper",statistics:false,table:"both",
    decimalMark:"dot",separators:false,font:"normal"
  };
  const previousFmt=fmt;
  function formatForDisplay(text) {
    const parts=text.split("×10^");
    const mantissa=parts[0];
    const m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(mantissa);
    if(!m)return text;
    const groups=settings.separators?m[2].replace(/\B(?=(\d{3})+(?!\d))/g,settings.decimalMark==="comma"?".":","):m[2];
    const decimal=m[3]===undefined?"":(settings.decimalMark==="comma"?",":".")+m[3];
    return m[1]+groups+decimal+(parts.length>1?"×10^"+parts[1]:"");
  }
  fmt=function(n){
    if(!Number.isFinite(n))return "Math ERROR";
    let value;
    if(settings.format==="fix")value=Number(n).toFixed(settings.digits);
    else if(settings.format==="sci")value=Number(n).toExponential(settings.sciDigits-1).replace(/e\+?(-?\d+)$/,"×10^$1");
    else if(settings.format==="norm"){
      const a=Math.abs(n),lower=settings.norm===1?1e-2:1e-9;
      value=(a>0&&(a<lower||a>=1e10))?
        Number(n).toExponential(9).replace(/e\+?(-?\d+)$/,"×10^$1"):
        previousFmt(n);
    } else value=previousFmt(n);
    return formatForDisplay(value);
  };

  const pages={
    options:[["1","Hyperbolic Func"],["2","Angle Unit"]],
    hyperbolic:[["1","sinh"],["2","cosh"],["3","tanh"],["4","sinh⁻¹"],["5","cosh⁻¹"],["6","tanh⁻¹"]],
    angle:[["1","°"],["2","r"],["3","g"]],
    modes:[["1","Calculate"],["2","Statistics"],["3","Table"]],
    setup:[["1","Input/Output"],["2","Angle Unit"],["3","Number Format"],
           ["4","Fraction Result"],["5","Statistics"],["6","Table"],
           ["7","Decimal Mark"],["8","Digit Separator"],["9","MultiLine Font"],
           ["0","Contrast"]],
    inputOutput:[["1","MathI/MathO"],["2","MathI/DecimalO"],["3","LineI/LineO"],["4","LineI/DecimalO"]],
    numberFormat:[["1","Fix"],["2","Sci"],["3","Norm"]],
    norm:[["1","Norm 1"],["2","Norm 2"]],
    fixDigits:[["0","0"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"],["8","8"],["9","9"]],
    sciDigits:[["0","10 digits"],["1","1 digit"],["2","2 digits"],["3","3 digits"],["4","4 digits"],
               ["5","5 digits"],["6","6 digits"],["7","7 digits"],["8","8 digits"],["9","9 digits"]],
    fractions:[["1","Mixed (ab/c)"],["2","Improper (d/c)"]],
    statistics:[["1","On"],["2","Off"]],
    table:[["1","f(x)"],["2","f(x),g(x)"]],
    decimal:[["1","Dot"],["2","Comma"]],
    separator:[["1","On"],["2","Off"]],
    font:[["1","Normal Font"],["2","Small Font"]],
    contrast:[["1","◄ / ► to adjust"]],
    unavailable:[["1","Mode not yet available"]]
  };
  const hyperbolic={1:"sinh",2:"cosh",3:"tanh",4:"asinh",5:"acosh",6:"atanh"};
  // SETUP is three numbered screens (4 + 4 + 2), as on the fx-EX.
  const setupRoutes=["inputOutput","angle","numberFormat","fractions",
    "statistics","table","decimal","separator","font","contrast"];
  let page=null,trail=[],choice="1",historyPosition=-1,setupPage=0,contrastLevel=5;
  function items(){
    if(page!=="setup")return pages[page]||[];
    return pages.setup.slice(setupPage*4,(setupPage+1)*4)
      .map(([_,label],i)=>[String(i+1),label]);
  }
  function advanceSetup(delta){
    const next=Math.max(0,Math.min(2,setupPage+delta));
    if(next===setupPage)return false;
    setupPage=next;choice="1";draw();return true;
  }

  function draw(){
    if(!page)return;
    screen.classList.add("lcd-menu-mode");
    root.hidden=false;root.replaceChildren();
    root.classList.toggle("two-columns",page==="angle"||page==="hyperbolic");
    const grid=document.createElement("div");
    grid.className=(page==="angle"||page==="hyperbolic")?"angle-grid":"option-list";
    grid.setAttribute("role","group");
    for(const [number,label] of items()){
      const button=document.createElement("button");
      button.type="button";
      button.dataset.option=number;
      button.textContent=number+":"+label;
      button.setAttribute("aria-label",page==="angle"?number+": "+({1:"Degree",2:"Radian",3:"Gradian"}[number]):number+": "+label);
      button.setAttribute("aria-current",String(choice===number));
      grid.appendChild(button);
    }
    root.appendChild(grid);
    if(page==="setup"){
      // A slim page marker like the EX menu scroll indicator.
      root.classList.add("setup-paged");
      const marker=document.createElement("span");
      marker.className="setup-page-indicator";
      marker.textContent=setupPage===0?"▼":setupPage===2?"▲":"▲\n▼";
      marker.setAttribute("aria-label","Setup page "+(setupPage+1)+" of 3");
      root.appendChild(marker);
    }else root.classList.remove("setup-paged");
    if(page==="angle"){
      const arrow=document.createElement("span");
      arrow.className="angle-mark";
      arrow.textContent="◀";
      arrow.setAttribute("aria-hidden","true");
      root.appendChild(arrow);
    }
  }
  function show(next,keepPrevious=true){
    if(!pages[next])return;
    if(page&&keepPrevious)trail.push(page);
    if(next==="setup"&&keepPrevious)setupPage=0;
    page=next;choice=items()[0]?.[0]||"1";draw();
  }
  function close(){
    page=null;trail=[];root.hidden=true;
    screen.classList.remove("lcd-menu-mode");
    render();
    if(justCalculated && Number.isFinite(ans)) {
      if(settings.format!=="norm"||settings.output.endsWith("Decimal")) {
        const result=document.getElementById("result");
        result.textContent=fmt(ans);
      }
    }
  }
  function back(){
    if(!trail.length){close();return;}
    show(trail.pop(),false);
  }
  function choose(number){
    if(!page||!items().some(([n])=>n===number))return false;
    if(page==="options"){
      show(number==="1"?"hyperbolic":"angle");
      return true;
    }
    if(page==="modes"){
      if(number==="1")close();
      else show("unavailable");
      return true;
    }
    if(page==="unavailable"){close();return true;}
    if(page==="setup"){
      const index=setupPage*4+Number(number)-1;
      if(setupRoutes[index])show(setupRoutes[index]);
      return true;
    }
    if(page==="numberFormat"){
      show(({1:"fixDigits",2:"sciDigits",3:"norm"})[number]);return true;
    }
    if(page==="angle"){
      angleUnit=({1:"deg",2:"rad",3:"grad"})[number];
      deg=angleUnit==="deg";close();return true;
    }
    if(page==="hyperbolic"){
      const fn=hyperbolic[number];close();append(fn);return true;
    }
    if(page==="inputOutput")settings.output=({1:"math",2:"mathDecimal",3:"line",4:"lineDecimal"})[number];
    else if(page==="fixDigits"){settings.format="fix";settings.digits=Number(number);}
    else if(page==="sciDigits"){settings.format="sci";settings.sciDigits=number==="0"?10:Number(number);}
    else if(page==="norm"){settings.format="norm";settings.norm=Number(number);}
    else if(page==="fractions")settings.fraction=number==="1"?"mixed":"improper";
    else if(page==="statistics")settings.statistics=number==="1";
    else if(page==="table")settings.table=number==="1"?"single":"both";
    else if(page==="decimal")settings.decimalMark=number==="1"?"dot":"comma";
    else if(page==="separator")settings.separators=number==="1";
    else if(page==="font"){settings.font=number==="1"?"normal":"small";screen.classList.toggle("small-lcd-font",settings.font==="small");}
    else if(page==="contrast")return true; // Use ◄/► to adjust; AC exits.
    close();return true;
  }

  root.addEventListener("click",event=>{
    const button=event.target.closest("button[data-option]");
    if(button)choose(button.dataset.option);
  });
  keypad.addEventListener("click",event=>{
    const button=event.target.closest("button[data-key]");if(!button)return;
    const key=button.dataset.key;
    if(key==="opt"){
      event.preventDefault();event.stopImmediatePropagation();
      show("options");return;
    }
    if(!page)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(key==="AC")close();
    else if(key==="DEL")back();
    else if(/^\d$/.test(key))choose(key);
  },true);

  function arrow(direction){
    if(!page){
      // Allow active editable fraction/root templates to use the arrow pad.
      if(window.calculatorTemplateState)return false;
      if(direction==="left"||direction==="right"){
        const line=document.getElementById("expression");
        line.scrollBy({left:direction==="left"?-110:110,behavior:"smooth"});
        return true;
      }
      if((direction==="up"||direction==="down") && history.length){
        historyPosition=direction==="up"?
          Math.min(history.length-1,historyPosition+1):
          Math.max(0,historyPosition-1);
        expr=history[historyPosition].expr;justCalculated=false;render();
        return true;
      }
      return false;
    }
    if(page==="contrast"&&(direction==="left"||direction==="right")){
      const step=direction==="right"?1:-1;
      contrastLevel=Math.max(1,Math.min(9,contrastLevel+step));
      screen.style.setProperty("filter","contrast("+(0.72+contrastLevel*0.06)+")");
      return true;
    }
    if(direction==="left"){back();return true;}
    if(direction==="right"){choose(choice);return true;}
    const choices=items().map(([n])=>n),current=choices.indexOf(choice);
    const step=direction==="down"?1:-1;
    if(page==="setup"&&current+step>=choices.length){advanceSetup(1);return true;}
    if(page==="setup"&&current+step<0){
      if(advanceSetup(-1)){choice=items().at(-1)[0];draw();}
      return true;
    }
    const next=Math.max(0,Math.min(choices.length-1,current+step));
    choice=choices[next];draw();
    root.querySelector('[data-option="'+choice+'"]')?.scrollIntoView({block:"nearest"});
    return true;
  }
  nav.addEventListener("click",event=>{
    const button=event.target.closest("button[data-nav]");
    if(!button)return;
    if(arrow(button.dataset.nav)){
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);

  physicalMenu.addEventListener("click",event=>{
    event.preventDefault();event.stopImmediatePropagation();
    // Physical MENU enters a calculation-mode list; SHIFT+MENU enters Setup.
    const setup=Boolean(inverse);
    if(setup){inverse=false;render();}
    show(setup?"setup":"modes");
  },true);
  document.addEventListener("keydown",event=>{
    if(event.ctrlKey||event.altKey||event.metaKey)return;
    if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
    const key=event.key;
    if(page){
      if(/^\d$/.test(key)){event.preventDefault();event.stopImmediatePropagation();choose(key);return;}
      if(key==="Escape"){event.preventDefault();event.stopImmediatePropagation();close();return;}
      if(key==="Backspace"){event.preventDefault();event.stopImmediatePropagation();back();return;}
      const dir=({ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"})[key];
      if(dir){event.preventDefault();event.stopImmediatePropagation();arrow(dir);return;}
      if(key==="PageDown"&&page==="setup"){event.preventDefault();advanceSetup(1);return;}
      if(key==="PageUp"&&page==="setup"){event.preventDefault();advanceSetup(-1);return;}
      if(key==="Enter"){event.preventDefault();event.stopImmediatePropagation();choose(choice);}
    }else if(!window.calculatorTemplateState && /^Arrow(?:Up|Down|Left|Right)$/.test(key)){
      if(arrow(key.slice(5).toLowerCase())){event.preventDefault();event.stopImmediatePropagation();}
    }
  },true);
})();
