/* Optional Maths answer duplicate:
   Off | Automatic when LCD is scrolled off-screen | Draggable always | Below keypad.
   The actual expression, result, calculation engine and answer-focus feature
   are untouched; the secondary displays only mirror their visible content. */
(() => {
  "use strict";
  const lcd=document.querySelector(".calculator .screen");
  const calculator=document.querySelector(".calculator");
  const keypad=document.getElementById("keys");
  const expression=document.getElementById("expression");
  const result=document.getElementById("result");
  const select=document.getElementById("floatingAnswerMode");
  if(!lcd||!calculator||!keypad||!expression||!result||!select)return;

  const float=document.createElement("aside");
  float.className="calc-answer-float";
  float.setAttribute("aria-label","Floating calculator answer");
  float.hidden=true;
  const header=document.createElement("div");
  header.className="calc-answer-header";
  const handle=document.createElement("button");
  handle.type="button";
  handle.className="calc-answer-handle";
  handle.textContent="⠿  Answer · drag to move";
  handle.setAttribute("aria-label","Move floating answer: drag, or use arrow keys; Home resets position");
  const close=document.createElement("button");
  close.type="button";
  close.className="calc-answer-close";
  close.textContent="×";
  close.setAttribute("aria-label","Turn off floating answer");
  header.append(handle,close);
  const content=document.createElement("div");
  content.className="calc-answer-content";
  const formula=document.createElement("div");
  formula.className="calc-answer-expression";
  formula.setAttribute("aria-label","Expression");
  const answer=document.createElement("div");
  answer.className="calc-answer-result";
  answer.setAttribute("aria-label","Answer");
  content.append(formula,answer);
  const resizeGrip=document.createElement("button");
  resizeGrip.type="button";
  resizeGrip.className="calc-answer-resize";
  resizeGrip.textContent="◢";
  resizeGrip.setAttribute("aria-label","Resize floating answer: drag lower-right corner or use arrow keys");
  resizeGrip.title="Drag to resize (arrow keys also work)";
  float.append(header,content,resizeGrip);
  document.body.append(float);

  const dock=document.createElement("section");
  dock.className="calc-answer-dock";
  dock.setAttribute("aria-label","Answer below the calculator keys");
  dock.hidden=true;
  const dockLabel=document.createElement("div");
  dockLabel.className="calc-answer-dock-label";
  dockLabel.textContent="Answer";
  const dockFormula=document.createElement("div");
  dockFormula.className="calc-answer-expression";
  const dockResult=document.createElement("div");
  dockResult.className="calc-answer-result";
  dock.append(dockLabel,dockFormula,dockResult);
  keypad.insertAdjacentElement("afterend",dock);

  // Clone presentation only, including exact MathML where present.
  // Do not copy calculator input logic or make the duplicate editable.
  function copyDisplay(source,target,placeholder){
    if(source.childNodes.length){
      const copies=[...source.childNodes].map(node=>node.cloneNode(true));
      target.replaceChildren(...copies);
      target.querySelectorAll(".template-insertion-caret").forEach(node=>node.remove());
      if(target.textContent.trim())return;
    }
    target.textContent=placeholder;
  }
  let pending=false;
  function refresh(){
    pending=false;
    copyDisplay(expression,formula,"");
    copyDisplay(result,answer,"—");
    copyDisplay(expression,dockFormula,"");
    copyDisplay(result,dockResult,"—");
  }
  function queueRefresh(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(refresh);
  }
  new MutationObserver(queueRefresh).observe(expression,{
    subtree:true,childList:true,characterData:true
  });
  new MutationObserver(queueRefresh).observe(result,{
    subtree:true,childList:true,characterData:true
  });

  let lcdVisible=true;
  let mode="auto";
  function updateVisibility(){
    const showFloat=mode==="always"||(mode==="auto"&&!lcdVisible);
    float.hidden=!showFloat;
    dock.hidden=mode!=="bottom";
    if(showFloat){
      queueRefresh();
      scheduleOverlap();
    }else float.classList.remove("over-keys");
  }
  function updateMode(){
    mode=["auto","always","bottom","off"].includes(select.value)?select.value:"auto";
    updateVisibility();
    // The dock changes calculator height; refit the zoom to keep it visible.
    window.dispatchEvent(new Event("resize"));
  }
  select.addEventListener("change",updateMode);
  close.addEventListener("click",()=>{
    select.value="off";
    updateMode();
    select.focus({preventScroll:true});
  });

  function checkIntersection(){
    const r=lcd.getBoundingClientRect();
    const w=Math.max(1,Math.min(r.right,innerWidth)-Math.max(r.left,0));
    const h=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));
    lcdVisible=w*h >= r.width*r.height*0.35;
    updateVisibility();
  }
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{
      lcdVisible=(entries[0]?.intersectionRatio||0)>=0.35;
      updateVisibility();
    },{threshold:[0,0.35,0.65,1]});
    observer.observe(lcd);
  }else{
    window.addEventListener("scroll",checkIntersection,{passive:true});
    document.querySelector(".calc-viewport")?.addEventListener("scroll",checkIntersection,{passive:true});
    window.addEventListener("resize",checkIntersection,{passive:true});
    requestAnimationFrame(checkIntersection);
  }

  // The answer panel is positioned independently of the calculator stage.
  // Mouse, stylus, touch and keyboard all work; it is always clamped in view.
  let drag=null;
  let saved=null;
  let resizeDrag=null;
  let overlapScheduled=false;
  const keyTargets=[...calculator.querySelectorAll("#keys button, .top button")];
  function updateOverlap(){
    overlapScheduled=false;
    if(float.hidden){float.classList.remove("over-keys");return;}
    const a=float.getBoundingClientRect();
    const overlaps=keyTargets.some(button=>{
      const b=button.getBoundingClientRect();
      return Math.min(a.right,b.right)-Math.max(a.left,b.left)>6 &&
        Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>6;
    });
    float.classList.toggle("over-keys",overlaps);
  }
  function scheduleOverlap(){
    if(overlapScheduled)return;
    overlapScheduled=true;
    requestAnimationFrame(updateOverlap);
  }
  const scroller=document.querySelector(".calc-viewport");
  scroller?.addEventListener("scroll",scheduleOverlap,{passive:true});
  window.addEventListener("scroll",scheduleOverlap,{passive:true,capture:true});
  function place(left,top){
    const width=float.offsetWidth||260,height=float.offsetHeight||130;
    const maxX=Math.max(0,innerWidth-width);
    const maxY=Math.max(0,innerHeight-height);
    const x=Math.max(0,Math.min(maxX,left));
    const y=Math.max(0,Math.min(maxY,top));
    saved={x,y};
    float.style.left=x+"px";
    float.style.top=y+"px";
    float.style.right="auto";
    float.style.bottom="auto";
    scheduleOverlap();
  }
  handle.addEventListener("pointerdown",event=>{
    if(!event.isPrimary||event.button!==0)return;
    const rect=float.getBoundingClientRect();
    drag={
      id:event.pointerId,startX:event.clientX,startY:event.clientY,
      left:rect.left,top:rect.top
    };
    handle.setPointerCapture(event.pointerId);
    float.classList.add("is-dragging");
    event.preventDefault();
  });
  handle.addEventListener("pointermove",event=>{
    if(!drag||drag.id!==event.pointerId)return;
    place(drag.left+event.clientX-drag.startX,
      drag.top+event.clientY-drag.startY);
  });
  function release(event){
    if(!drag||drag.id!==event.pointerId)return;
    drag=null;
    float.classList.remove("is-dragging");
    scheduleOverlap();
    if(handle.hasPointerCapture(event.pointerId))
      handle.releasePointerCapture(event.pointerId);
  }
  handle.addEventListener("pointerup",release);
  handle.addEventListener("pointercancel",release);

  // Lower-right corner resizes both dimensions, maintaining a sensible minimum.
  // The answer's mathematical font grows with the panel width.
  function resizeTo(width,height){
    const box=float.getBoundingClientRect();
    const maxWidth=Math.max(180,innerWidth-box.left-6);
    const maxHeight=Math.max(110,innerHeight-box.top-6);
    float.style.width=Math.round(Math.min(maxWidth,Math.max(180,width)))+"px";
    float.style.height=Math.round(Math.min(maxHeight,Math.max(110,height)))+"px";
    scheduleOverlap();
  }
  resizeGrip.addEventListener("pointerdown",event=>{
    if(!event.isPrimary||event.button!==0)return;
    const rect=float.getBoundingClientRect();
    place(rect.left,rect.top);
    resizeDrag={id:event.pointerId,x:event.clientX,y:event.clientY,
      width:rect.width,height:rect.height};
    resizeGrip.setPointerCapture(event.pointerId);
    float.classList.add("is-resizing");
    event.preventDefault();
  });
  resizeGrip.addEventListener("pointermove",event=>{
    if(!resizeDrag||resizeDrag.id!==event.pointerId)return;
    resizeTo(resizeDrag.width+event.clientX-resizeDrag.x,
      resizeDrag.height+event.clientY-resizeDrag.y);
  });
  function finishResize(event){
    if(!resizeDrag||resizeDrag.id!==event.pointerId)return;
    resizeDrag=null;
    float.classList.remove("is-resizing");
    scheduleOverlap();
    if(resizeGrip.hasPointerCapture(event.pointerId))
      resizeGrip.releasePointerCapture(event.pointerId);
  }
  resizeGrip.addEventListener("pointerup",finishResize);
  resizeGrip.addEventListener("pointercancel",finishResize);
  resizeGrip.addEventListener("keydown",event=>{
    const step=event.shiftKey?32:16;
    const delta={ArrowRight:[step,0],ArrowLeft:[-step,0],
      ArrowDown:[0,step],ArrowUp:[0,-step]}[event.key];
    if(!delta)return;
    const box=float.getBoundingClientRect();
    resizeTo(box.width+delta[0],box.height+delta[1]);
    event.preventDefault();
  });
  handle.addEventListener("keydown",event=>{
    const offsets={ArrowLeft:[-16,0],ArrowRight:[16,0],
      ArrowUp:[0,-16],ArrowDown:[0,16]};
    if(event.key==="Home"){
      saved=null;
      float.style.removeProperty("left");
      float.style.removeProperty("top");
      float.style.removeProperty("right");
      float.style.removeProperty("bottom");
      event.preventDefault();
      return;
    }
    if(!offsets[event.key])return;
    const bounds=float.getBoundingClientRect();
    const [dx,dy]=offsets[event.key];
    place(bounds.left+dx,bounds.top+dy);
    event.preventDefault();
  });
  window.addEventListener("resize",()=>{
    if(saved)place(saved.x,saved.y);
    scheduleOverlap();
  },{passive:true});

  // Initial automatic mode retains a single LCD while it is on screen.
  mode=select.value||"auto";
  refresh();
  requestAnimationFrame(checkIntersection);
})();
