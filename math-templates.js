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
    editor={nodes:initial?[token(initial)]:[],path:[],calculated:false};
    justCalculated=false;
  }
  function currentText(nodes){
    return nodes.map(n => n.type==="text"?n.value:
      n.type==="frac"?"(("+currentText(n.top)+")÷("+currentText(n.bottom)+"))":
      n.type==="mixed"?"(("+currentText(n.whole)+")+(("+currentText(n.top)+")÷("+currentText(n.bottom)+")))":
      (n.type==="sqrt"?"sqrt(":"cbrt(")+currentText(n.body)+")").join("");
  }
  function serialize(nodes,emptyAsZero=false){
    return nodes.map(n=>{
      if(n.type==="text")return n.value;
      const contents=(items)=>serialize(items,emptyAsZero)||(emptyAsZero?"0":"");
      if(n.type==="frac")return "(("+contents(n.top)+")÷("+contents(n.bottom)+"))";
      if(n.type==="mixed")return "(("+contents(n.whole)+")+(("+contents(n.top)+")÷("+contents(n.bottom)+")))";
      return (n.type==="sqrt"?"sqrt(":"cbrt(")+contents(n.body)+")";
    }).join("");
  }
  function incomplete(nodes){
    return nodes.some(n=>{
      if(n.type==="text")return false;
      if(n.type==="frac")return !n.top.length||!n.bottom.length||incomplete(n.top)||incomplete(n.bottom);
      if(n.type==="mixed")return !n.whole.length||!n.top.length||!n.bottom.length||
        incomplete(n.whole)||incomplete(n.top)||incomplete(n.bottom);
      return !n.body.length||incomplete(n.body);
    });
  }
  function sync(){
    expr=serialize(editor.nodes,true);
    editor.calculated=false;
    justCalculated=false;
    render();
  }
  function template(type){
    if(!editor)createEditor();
    if(editor.calculated)createEditor();
    const n={id:nextId++,type};
    if(type==="frac"){n.top=[];n.bottom=[];}
    else if(type==="mixed"){n.whole=[];n.top=[];n.bottom=[];}
    else n.body=[];
    rootNodes().push(n);
    editor.path.push({node:n,slot:type==="frac"?"top":type==="mixed"?"whole":"body"});
    sync();
  }
  function literal(v){
    if(!editor)createEditor();
    if(editor.calculated){
      const chaining=/^[+−×÷^]$/.test(v);
      editor={nodes:chaining?[token("Ans")]:[],path:[],calculated:false};
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
    const last=nodes[nodes.length-1];
    if((/^[0-9]$/.test(v)||v===".") && last && last.type==="text" &&
       /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(last.value)){
      last.value+=v;
    }else nodes.push(token(v));
    sync();
  }
  function backspace(){
    const nodes=rootNodes();
    if(nodes.length){
      const last=nodes[nodes.length-1];
      if(last.type==="text" && last.value.length>1){
        last.value=last.value.slice(0,-1);
        if(!last.value)nodes.pop();
      }else nodes.pop();
    }else if(editor.path.length){
      const step=editor.path[editor.path.length-1];
      if(step.slot==="bottom")step.slot="top";
      else if(step.slot==="top" && step.node.type==="mixed")step.slot="whole";
      else editor.path.pop();
    }
    sync();
  }
  function navigate(direction){
    if(!editor||!editor.path.length)return;
    const p=editor.path,step=p[p.length-1];
    const fields=step.node.type==="mixed"?["whole","top","bottom"]:
      step.node.type==="frac"?["top","bottom"]:["body"];
    let next=fields.indexOf(step.slot)+(direction==="next"?1:-1);
    if(next>=0 && next<fields.length){
      step.slot=fields[next];sync();
    }else{
      p.pop();sync();
    }
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
      slot==="whole"?"Whole-number part":"Radicand");
    if(!content.length){
      const empty=m("mtext","□");
      empty.classList.add("template-placeholder");
      row.append(empty);
    }else for(const child of content)row.append(nodeMarkup(child,steps.concat([{node,slot}])));
    row.addEventListener("click",event=>{
      event.stopPropagation();
      if(!editor)return;
      editor.path=steps.concat([{node,slot}]);
      editor.calculated=false;
      render();
    });
    return row;
  }
  function nodeMarkup(node,steps){
    if(node.type==="text"){
      const value=node.value;
      if(/^\d+(\.\d+)?$/.test(value))return m("mn",value);
      if(/^[+−×÷=()!,^%]$/.test(value))return m("mo",value);
      if(value==="π")return m("mi",value);
      return m("mtext",value);
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
    for(const n of editor.nodes)row.append(nodeMarkup(n,[]));
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
    if(v==="frac"||v==="mixed"||v==="sqrt"||v==="cbrt"){
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
    if(v==="frac"||v==="mixed"||v==="sqrt"||v==="cbrt"){template(v);return;}
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
  document.addEventListener("keydown",event=>{
    if(!editor || event.ctrlKey || event.metaKey || event.altKey)return;
    if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
    const key=event.key;
    let action=null;
    if(/^[0-9.]$/.test(key))action=key;
    else if(key==="/")action=editor.path.length?"down":"÷";
    else if(key==="*")action="×";
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