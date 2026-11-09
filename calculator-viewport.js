/* Proportional calculator zoom, fit height, and accessible panning.
   Keeps the device's native 2D geometry; scales everything by one factor. */
(() => {
  "use strict";
  const viewport=document.querySelector(".calc-viewport");
  const stage=document.querySelector(".calc-stage");
  const calculator=stage?.querySelector(".calculator");
  const fit=document.getElementById("fitHeight");
  const fitW=document.getElementById("fitWidth");
  const plus=document.getElementById("zoomIn");
  const minus=document.getElementById("zoomOut");
  if(!viewport||!stage||!calculator||!fit||!plus||!minus)return;

  const MIN=0.25,MAX=5,clamp=x=>Math.min(MAX,Math.max(MIN,x));
  let scale=1;
  let mode=(innerWidth>=800&&innerHeight>=700)?"height":null;
  let gesture=null,drag=null,space=false,blockClick=false,queued=false;
  let baseWidth=660,baseHeight=900;

  function measure(){
    // Responsive width is calculated before scaling, never separately in x/y.
    const available=Math.max(210,viewport.clientWidth);
    baseWidth=Math.min(660,available);
    calculator.style.setProperty("--calc-base-width",baseWidth+"px");
    calculator.style.setProperty("--calc-scale","1");
    // Offset height is invariant under CSS transform.
    baseHeight=Math.max(100,calculator.offsetHeight);
    calculator.style.setProperty("--calc-scale",String(scale));
  }
  function viewportHeight(){
    const height=window.visualViewport?.height||innerHeight;
    return Math.max(180,height-viewport.getBoundingClientRect().top-12);
  }
  function draw(){
    stage.style.width=(baseWidth*scale)+"px";
    stage.style.height=(baseHeight*scale)+"px";
    calculator.style.setProperty("--calc-scale",String(scale));
    viewport.style.height=Math.max(180,Math.min(baseHeight*scale,viewportHeight()))+"px";
    fit.setAttribute("aria-pressed",String(mode==="height"));
    fitW?.setAttribute("aria-pressed",String(mode==="width"));
    plus.disabled=scale>=MAX;
    minus.disabled=scale<=MIN;
    viewport.classList.toggle("zoomed",scale>1.001||baseWidth*scale>viewport.clientWidth+1||baseHeight*scale>viewport.clientHeight+1);
  }
  function change(next,clientX,clientY){
    if(!Number.isFinite(next))return;
    const target=Math.round(clamp(next)*1000)/1000;
    const oldScale=scale;
    const rect=stage.getBoundingClientRect();
    const frame=viewport.getBoundingClientRect();
    const focusX=clientX??frame.left+frame.width/2;
    const focusY=clientY??frame.top+frame.height/2;
    const naturalX=(focusX-rect.left)/oldScale;
    const naturalY=(focusY-rect.top)/oldScale;
    scale=target;
    draw();
    // Keep the part beneath the cursor/fingers stationary while zooming.
    const moved=stage.getBoundingClientRect();
    viewport.scrollLeft+=moved.left+naturalX*scale-focusX;
    viewport.scrollTop+=moved.top+naturalY*scale-focusY;
  }
  function manual(next,x,y){
    mode=null;
    change(next,x,y);
  }
  function fitHeight(){
    measure();
    mode="height";
    // Fit the entire device. On phones, do not let height fitting
    // produce a calculator wider than the available screen.
    const target=Math.min(viewportHeight()/baseHeight,viewport.clientWidth/baseWidth);
    scale=Math.round(clamp(target)*1000)/1000;
    draw();
    viewport.scrollTo({left:0,top:0,behavior:"instant"});
  }
  function fitWidth(){
    measure();
    mode="width";
    scale=Math.round(clamp(viewport.clientWidth/baseWidth)*1000)/1000;
    draw();
    viewport.scrollTo({left:0,top:0,behavior:"instant"});
  }
  function zoomTo(next){manual(next);}
  plus.addEventListener("click",()=>zoomTo(scale*1.2));
  minus.addEventListener("click",()=>zoomTo(scale/1.2));
  fit.addEventListener("click",fitHeight);
  fitW?.addEventListener("click",()=>{if(mode==="width")fitHeight();else fitWidth()});

  function scheduleLayout(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      measure();
      if(mode==="height")fitHeight();
      else if(mode==="width")fitWidth();
      else draw();
    });
  }
  addEventListener("resize",scheduleLayout,{passive:true});
  window.visualViewport?.addEventListener("resize",scheduleLayout,{passive:true});

  function separation(t){
    const a=t[0],b=t[1];
    return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  }
  viewport.addEventListener("touchstart",event=>{
    if(event.touches.length===2)gesture={
      distance:Math.max(1,separation(event.touches)),
      startScale:scale
    };
  },{passive:true});
  viewport.addEventListener("touchmove",event=>{
    if(!gesture||event.touches.length!==2)return;
    event.preventDefault();
    const first=event.touches[0],second=event.touches[1];
    manual(gesture.startScale*separation(event.touches)/gesture.distance,
      (first.clientX+second.clientX)/2,(first.clientY+second.clientY)/2);
  },{passive:false});
  viewport.addEventListener("touchend",event=>{
    if(event.touches.length<2)gesture=null;
  },{passive:true});
  viewport.addEventListener("touchcancel",()=>gesture=null,{passive:true});

  // One-finger touch panning is native scrolling inside the viewport.
  // With a mouse, drag the blank chassis; hold Space to drag anywhere.
  document.addEventListener("keydown",event=>{
    if(event.code==="Space"&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){
      space=true;
    }
  },true);
  document.addEventListener("keyup",event=>{if(event.code==="Space")space=false;},true);
  addEventListener("blur",()=>{space=false;drag=null;});
  viewport.addEventListener("pointerdown",event=>{
    if(event.pointerType==="touch"||event.button!==0)return;
    const interactive=event.target.closest("button,a,input,textarea,select,[role='button']");
    if(interactive&&!space)return;
    if(!viewport.classList.contains("zoomed")&&!space)return;
    drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false};
    viewport.setPointerCapture?.(event.pointerId);
  });
  viewport.addEventListener("pointermove",event=>{
    if(!drag)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.hypot(dx,dy)>5)drag.moved=true;
    if(drag.moved){
      viewport.classList.add("is-panning");
      viewport.scrollLeft=drag.left-dx;
      viewport.scrollTop=drag.top-dy;
      event.preventDefault();
    }
  });
  function release(event){
    if(!drag)return;
    if(drag.moved){
      blockClick=true;
      // Release click suppression after the corresponding pointer click.
      requestAnimationFrame(()=>{blockClick=false;});
    }
    drag=null;
    viewport.classList.remove("is-panning");
    if(event && viewport.hasPointerCapture?.(event.pointerId))viewport.releasePointerCapture(event.pointerId);
  }
  viewport.addEventListener("pointerup",release);
  viewport.addEventListener("pointercancel",release);
  viewport.addEventListener("click",event=>{
    if(!blockClick)return;
    event.stopImmediatePropagation();event.preventDefault();blockClick=false;
  },true);

  // Double-click only blank chassis/background to switch Fit Width / Fit Height.
  viewport.addEventListener("dblclick",event=>{
    if(event.target.closest("button,a,input,textarea,select,[role='button'],.screen"))return;
    event.preventDefault();
    if(mode==="width")fitHeight();else fitWidth();
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&mode==="width"){event.preventDefault();fitHeight();}
  });
  viewport.addEventListener("wheel",event=>{
    if(!event.ctrlKey)return;
    event.preventDefault();
    manual(scale*Math.exp(-event.deltaY*.012),event.clientX,event.clientY);
  },{passive:false});

  measure();
  if(mode==="height")requestAnimationFrame(fitHeight);
  else draw();
})();
