/* Native MathML entry templates: editable fractions and radicals.
   No logo, no remote libraries, and no image approximations. */
(() => {
  "use strict";
  const MATH="http://www.w3.org/1998/Math/MathML";
  const screen=document.getElementById("expression");
  const result=document.getElementById("result");
  const keys=document.getElementById("keys");
  const nav=document.getElementById("nav");
  if(!screen||!result||!keys||!nav)return;

  const previousAppend=append, previousHandle=handle;
  const previousCalculate=calculate, previousRender=render;
  let editor=null, nextId=1;

  function m(tag,text){
    const e=document.createElementNS(MATH,tag);
    if(text!==undefined)e.textContent=text;
    return e;
  }
  function token(value){return {type:"text",value};}
  function rootNodes(){
    if(!editor)return [];
    let nodes=editor.nodes;
    for(const step of editor.path)nodes=step.node[step.slot];
    return nodes;
  }
  function createEditor(){
    const initial=justCalculated?"":expr;
    editor={nodes:initial?[token(initial)]:[],path:[],cursor:initial?1:0,calculated:false};
    justCalculated=false;
  }
  function currentText(nodes){
    return nodes.map(n => n.type==="text"?n.value:
      n.type==="frac"?"(("+currentText(n.top)+")÷("+currentText(n.bottom)+"))":
      n.type==="mixed"?"(("+currentText(n.whole)+")+(("+currentText(n.top)+")÷("+currentText(n.bottom)+")))":
      n.type==="logbase"?"logbase("+currentText(n.base)+","+currentText(n.arg)+")":
      (n.type==="sqrt"?"sqrt(":"cbrt(")+currentText(n.body)+")").join("");
  }
  function serialize(nodes,emptyAsZero=false){
    return nodes.map(n=>{
      if(n.type==="text")return n.value;
      const contents=(items)=>serialize(items,emptyAsZero)||(emptyAsZero?"0":"");
      if(n.type==="frac")return "(("+contents(n.top)+")÷("+contents(n.bottom)+"))";
      if(n.type==="mixed")return "(("+contents(n.whole)+")+(("+contents(n.top)+")÷("+contents(n.bottom)+")))";
      if(n.type==="logbase")return "logbase("+contents(n.base)+","+contents(n.arg)+")";
      return (n.type==="sqrt"?"sqrt(":"cbrt(")+contents(n.body)+")";
    }).join("");
  }
  function incomplete(nodes){
    return nodes.some(n=>{
      if(n.type==="text")return false;
      if(n.type==="frac")return !n.top.length||!n.bottom.length||incomplete(n.top)||incomplete(n.bottom);
      if(n.type==="mixed")return !n.whole.length||!n.top.length||!n.bottom.length||
        incomplete(n.whole)||incomplete(n.top)||incomplete(n.bottom);
      if(n.type==="logbase")return !n.base.length||!n.arg.length||incomplete(n.base)||incomplete(n.arg);
      return !n.body.length||incomplete(n.body);
    });
  }
  function sync(){
    expr=serialize(editor.nodes,true);
    editor.calculated=false;
    justCalculated=false;
    render();
  }
  // The fraction key consumes the operand immediately to its left.
  // For example 7 → fraction produces 7 above the bar, not 7 beside a
  // new fraction (which would wrongly mean a mixed number).
  function takeNumerator(nodes){
    if(!nodes.length)return [];
    const last=nodes[nodes.length-1];
    if(last.type!=="text"){
      if(!incomplete([last]))return [nodes.pop()];
      return [];
    }
    const match=last.value.match(/(?:^|[+−×÷*\/^(])(\d+(?:\.\d*)?|\.\d+|Ans|[A-FXYM])$/);
    if(!match)return [];
    const value=match[1];
    if(value.length===last.value.length)nodes.pop();
    else last.value=last.value.slice(0,-value.length);
    return [token(value)];
  }
  function template(type){
    if(!editor)createEditor();
    if(editor.calculated)createEditor();
    const nodes=rootNodes();
    const at=editor.cursor;
    // Consume a preceding numerator only when the caret is at the end.
    const numerator=type==="frac"&&at===nodes.length?takeNumerator(nodes):[];
    editor.cursor=Math.min(at,nodes.length);
    const n={id:nextId++,type};
    if(type==="frac"){n.top=numerator;n.bottom=[];}
    else if(type==="mixed"){n.whole=[];n.top=[];n.bottom=[];}
    else if(type==="logbase"){n.base=[];n.arg=[];}
    else n.body=[];
    nodes.splice(editor.cursor,0,n);
    editor.cursor++;
    // A completed numerator makes the denominator the next input field.
    const field=type==="frac"&&numerator.length?"bottom":type==="frac"?"top":type==="mixed"?"whole":type==="logbase"?"base":"body";
    editor.path.push({node:n,slot:field});
    editor.cursor=n[field].length;
    sync();
  }
  function literal(v){
    if(!editor)createEditor();
    if(editor.calculated){
      const chaining=/^[+−×÷^]$/.test(v);
      editor={nodes:chaining?[token("Ans")]:[],path:[],cursor:chaining?1:0,calculated:false};
    }
    if(v==="negate")v="−";
    else if(v==="square")v="^2";
    else if(v==="cube")v="^3";
    else if(v==="inversepower")v="^(-1)";
    else if(v==="factorial")v="!";
    else if(v==="percent")v="%";
    else if(v==="tenexp")v="×10^";
    else if(v==="pi")v="π";
    else if(v==="econst")v="e";
    else if(v==="random")v="Ran#";
    else if(v==="comma")v=",";
    else if(v==="rnd"||v==="random")v=String(Math.random());
    else if(v==="ans")v="Ans";
    else if(v==="neg")v="−";
    else if(v==="inversepower")v="^(-1)";
    else if(["sin","cos","tan","asin","acos","atan","sinh","cosh","tanh","asinh","acosh","atanh","log","ln","abs","exp","pow10","recip","fact"].includes(v))
      v+="(";
    else if(v==="logbase")v="logbase(";
    else if(v==="root")v="root(";
    if(v==="." && /(?:^|[^\d.])\d*\.\d*$/.test(currentText(rootNodes())))return;
    const nodes=rootNodes();
    const prior=nodes[editor.cursor-1];
    if((/^[0-9]$/.test(v)||v===".") && prior && prior.type==="text" &&
       /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(prior.value)){
      prior.value+=v;
    }else{
      nodes.splice(editor.cursor,0,token(v));
      editor.cursor++;
    }
    sync();
  }
  function backspace(){
    const nodes=rootNodes();
    if(editor.cursor>0){
      const prior=nodes[editor.cursor-1];
      if(prior.type==="text"&&prior.value.length>1){
        prior.value=prior.value.slice(0,-1);
      }else{
        nodes.splice(editor.cursor-1,1);
        editor.cursor--;
      }
      sync();
    }else navigate("previous");
  }
  function fieldsFor(node){
    return node.type==="mixed"?["whole","top","bottom"]:
      node.type==="frac"?["top","bottom"]:
      node.type==="logbase"?["base","arg"]:["body"];
  }
  function navigate(direction){
    if(!editor)return;
    const nodes=rootNodes();
    if(direction==="previous"){
      if(editor.cursor>0){
        const preceding=nodes[editor.cursor-1];
        if(preceding.type==="text"){
          // Move through a multi-digit literal one character at a time.
          // Split only numeric tokens; operators/functions remain atomic.
          if(/^\\d+(?:\\.\\d+)?$/.test(preceding.value)&&preceding.value.length>1){
            const text=preceding.value;
            preceding.value=text.slice(0,-1);
            nodes.splice(editor.cursor,0,token(text.slice(-1)));
            // The caret now sits before the final digit.
          }else editor.cursor--;
        }else{
          const slot=fieldsFor(preceding).at(-1);
          editor.path.push({node:preceding,slot});
          editor.cursor=preceding[slot].length;
        }
      }else if(editor.path.length){
        const step=editor.path.at(-1);
        const fields=fieldsFor(step.node),index=fields.indexOf(step.slot);
        if(index>0){
          step.slot=fields[index-1];
          editor.cursor=step.node[step.slot].length;
        }else{
          editor.path.pop();
          editor.cursor=rootNodes().indexOf(step.node);
        }
      }
    }else{
      if(editor.cursor<nodes.length){
        const following=nodes[editor.cursor];
        if(following.type==="text")editor.cursor++;
        else{
          const slot=fieldsFor(following)[0];
          editor.path.push({node:following,slot});
          editor.cursor=0;
        }
      }else if(editor.path.length){
        const step=editor.path.at(-1);
        const fields=fieldsFor(step.node),index=fields.indexOf(step.slot);
        if(index+1<fields.length){
          step.slot=fields[index+1];editor.cursor=0;
        }else{
          editor.path.pop();
          editor.cursor=rootNodes().indexOf(step.node)+1;
        }
      }
    }
    sync();
  }
  function cursorMarkup(){
    const caret=m("mtext","▏");
    caret.classList.add("template-insertion-caret");
    caret.setAttribute("aria-hidden","true");
    return caret;
  }
  function activePath(node,slot){
    if(!editor)return false;
    const p=editor.path;
    return p.length>0 && p[p.length-1].node===node && p[p.length-1].slot===slot;
  }
  function slotMarkup(node,slot,steps){
    const content=node[slot];
    const row=m("mrow");
    row.classList.add("template-slot");
    if(activePath(node,slot) && !editor.calculated)row.classList.add("template-active");
    row.setAttribute("aria-label",slot==="top"?"Numerator":slot==="bottom"?"Denominator":
      slot==="whole"?"Whole-number part":slot==="base"?"Logarithm base":
      slot==="arg"?"Logarithm argument":"Radicand");
    if(!content.length){
      const empty=m("mtext","□");
      empty.classList.add("template-placeholder");
      row.append(empty);
    }else{
      for(let i=0;i<=content.length;i++){
        if(activePath(node,slot)&&!editor.calculated&&i===editor.cursor)row.append(cursorMarkup());
        if(i<content.length)row.append(nodeMarkup(content[i],steps.concat([{node,slot}])));
      }
    }
    if(!content.length&&activePath(node,slot)&&!editor.calculated)row.append(cursorMarkup());
    row.addEventListener("click",event=>{
      event.stopPropagation();
      if(!editor)return;
      editor.path=steps.concat([{node,slot}]);
      editor.cursor=content.length;
      editor.calculated=false;
      render();
    });
    return row;
  }
  function nodeMarkup(node,steps){
    if(node.type==="text"){
      const value=node.value;
      const inverseNames={asin:"sin",acos:"cos",atan:"tan"};
      const inverse=value.match(/^(asin|acos|atan)\($/);
      if(inverse){
        const row=m("mrow"),sup=m("msup"),exponent=m("mrow");
        exponent.append(m("mo","−"),m("mn","1"));
        sup.append(m("mi",inverseNames[inverse[1]]),exponent);
        row.append(sup,m("mo","("));
        return row;
      }
      if(/^\d+(\.\d+)?$/.test(value))return m("mn",value);
      if(/^[+−×÷=()!,^%]$/.test(value))return m("mo",value);
      if(value==="π")return m("mi",value);
      return m("mtext",value.replace(/\basin\(/g,"sin⁻¹(").replace(/\bacos\(/g,"cos⁻¹(").replace(/\batan\(/g,"tan⁻¹("));
    }
    if(node.type==="frac"){
      const f=m("mfrac");
      f.setAttribute("linethickness","1.5px");
      f.append(slotMarkup(node,"top",steps),slotMarkup(node,"bottom",steps));
      return f;
    }
    if(node.type==="mixed"){
      const row=m("mrow");
      const f=m("mfrac");
      f.setAttribute("linethickness","1.5px");
      f.append(slotMarkup(node,"top",steps),slotMarkup(node,"bottom",steps));
      row.append(slotMarkup(node,"whole",steps),f);
      return row;
    }
    if(node.type==="logbase"){
      const row=m("mrow"),log=m("msub");
      log.append(m("mi","log"),slotMarkup(node,"base",steps));
      row.append(log,m("mo","("),slotMarkup(node,"arg",steps),m("mo",")"));
      return row;
    }
    if(node.type==="sqrt"){
      const r=m("msqrt");
      r.append(slotMarkup(node,"body",steps));
      return r;
    }
    const r=m("mroot");
    r.append(slotMarkup(node,"body",steps),m("mn","3"));
    return r;
  }
  function showMath(){
    if(!editor)return;
    const math=m("math");
    math.setAttribute("display","inline");
    math.setAttribute("aria-label","Mathematical expression");
    const row=m("mrow");
    for(let i=0;i<=editor.nodes.length;i++){
      if(!editor.path.length&&!editor.calculated&&i===editor.cursor)row.append(cursorMarkup());
      if(i<editor.nodes.length)row.append(nodeMarkup(editor.nodes[i],[]));
    }
    math.append(row);
    screen.replaceChildren(math);
    screen.classList.add("typeset-expression");
  }
  function typesetResult(){
    if(!editor||!editor.calculated)return;
    const t=result.textContent.trim();
    const match=t.match(/^(-?\d+)\/(\d+)$/);
    if(!match)return;
    const math=m("math"),f=m("mfrac");
    f.append(m("mn",match[1]),m("mn",match[2]));
    math.append(f);
    result.replaceChildren(math);
  }
  function enterCalculation(){
    if(!editor)return previousCalculate();
    if(incomplete(editor.nodes)){
      result.textContent="Syntax ERROR";
      result.classList.add("error");
      return;
    }
    expr=serialize(editor.nodes);
    previousCalculate();
    editor.calculated=justCalculated&&!result.classList.contains("error");
    if(editor.calculated)typesetResult();
    showMath();
  }
  append=function(v){
    if(v==="frac"||v==="mixed"||v==="sqrt"||v==="cbrt"||v==="logbase"){
      template(v);return;
    }
    if(editor){literal(v);return;}
    return previousAppend(v);
  };
  calculate=function(){
    if(editor)return enterCalculation();
    return previousCalculate();
  };
  render=function(){
    previousRender();
    if(editor){showMath();if(editor.calculated)typesetResult();}
    else screen.classList.remove("typeset-expression");
  };
  handle=function(v){
    if(v==="frac"||v==="mixed"||v==="sqrt"||v==="cbrt"||v==="logbase"){template(v);return;}
    if(!editor)return previousHandle(v);
    if(v==="AC"||v==="reset"){editor=null;return previousHandle(v);}
    if(v==="DEL"){backspace();return;}
    if(v==="="){calculate();return;}
    if(v==="right"||v==="down"){navigate("next");return;}
    if(v==="left"||v==="up"){navigate("previous");return;}
    if(v==="sd"){
      previousHandle(v);
      typesetResult();return;
    }
    if(["shift","alpha","angle","opt","menu","on","off","precision","mplus","mminus","sto","recall"].includes(v))
      return previousHandle(v);
    return append(v);
  };
  // The existing keypad listeners run during bubbling. Only take over once
  // structured entry is active; prior ALPHA and LCD handlers remain intact.
  keys.addEventListener("click",event=>{
    const button=event.target.closest("button[data-main]");
    if(!button||!editor)return;
    const key=inverse?(button.dataset.altkey||button.dataset.key):button.dataset.key;
    if(key==="opt")return; // the LCD option menu owns this key
    event.preventDefault();
    event.stopImmediatePropagation();
    if(inverse){inverse=false;render();}
    handle(key);
  },true);
  nav.addEventListener("click",event=>{
    if(!editor)return;
    const b=event.target.closest("button[data-nav]");
    if(!b)return;
    event.preventDefault();event.stopImmediatePropagation();
    handle(b.dataset.nav);
  },true);
  // STOring a typeset expression should return to the ordinary register
  // display before the existing ALPHA-variable handler stores the value.
  document.addEventListener("click",event=>{
    if(!editor || inverse)return;
    const key=event.target.closest("#keys button[data-key='sto']");
    if(!key)return;
    expr=serialize(editor.nodes);
    editor=null;
    screen.classList.remove("typeset-expression");
  },true);
  document.addEventListener("keydown",event=>{
    if(!editor || event.ctrlKey || event.metaKey || event.altKey)return;
    if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
    const key=event.key;
    let action=null;
    if(/^[0-9.]$/.test(key))action=key;
    else if(key==="/")action=editor.path.length?"down":"÷";
    else if(key==="*")action="×";
    else if(key===",")action="comma";
    else if(key==="-")action="−";
    else if(key==="+"||key==="("||key===")"||key==="^")action=key;
    else if(key==="Enter"||key==="=")action="=";
    else if(key==="Backspace")action="DEL";
    else if(key==="Escape")action="AC";
    else if(key==="Tab"||key==="ArrowRight"||key==="ArrowDown")action="right";
    else if(key==="ArrowLeft"||key==="ArrowUp")action="left";
    if(action===null)return;
    event.preventDefault();event.stopImmediatePropagation();
    handle(action);
  },true);
  document.addEventListener("click",event=>{
    const b=event.target.closest("#history button");
    if(b && editor){editor=null;screen.classList.remove("typeset-expression");}
  },true);
  // Test access is intentionally read-only; the calculator remains interactive
  // exclusively through its existing keys and the rendered mathematical slots.
  Object.defineProperty(window,"calculatorTemplateState",{
    configurable:true,
    get(){return editor?{expression:serialize(editor.nodes),path:editor.path.map(s=>s.slot),
      incomplete:incomplete(editor.nodes),calculated:editor.calculated}:null;}
  });
})();