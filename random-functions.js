/* Rnd, Ran#, RanInt#; independent overlay for the existing calculator.
   Numeric evaluation remains delegated to the established evaluator. */
(() => {
  "use strict";
  const previousEvaluate=evaluate;
  const previousHandle=handle;
  const previousCalculate=calculate;
  const previousRender=render;
  const result=document.getElementById("result");
  const MATH="http://www.w3.org/1998/Math/MathML";
  if(!result)return;
  let calculating=false;
  let cachedSamples=[];
  let showDecimal=false;

  function rounded(n){
    if(!Number.isFinite(n))throw Error("Math ERROR");
    const display=String(fmt(n)).replace("×10^","e");
    const value=Number(display);
    return Number.isFinite(value)?value:Number(n.toPrecision(10));
  }
  function randomInt(low,high){
    if(!Number.isSafeInteger(low)||!Number.isSafeInteger(high)||
       high<low||high-low+1>1e10)throw Error("Argument ERROR");
    return low+Math.floor(Math.random()*(high-low+1));
  }
  function splitArguments(s){
    let level=0;
    for(let i=0;i<s.length;i++){
      const ch=s[i];
      if(ch==="(")level++;
      else if(ch===")")level--;
      else if(ch===","&&level===0)return [s.slice(0,i),s.slice(i+1)];
    }
    throw Error("RanInt# requires lower and upper limits");
  }
  function sample(ctx,generate){
    const i=ctx.position++;
    const value=ctx.reuse && i<cachedSamples.length?cachedSamples[i]:generate();
    ctx.values.push(value);
    return value;
  }
  function evaluateArgument(s,ctx){
    return previousEvaluate(rewrite(s,ctx));
  }
  function replaceCall(s,name,callback,ctx){
    let from=0;
    for(let count=0;count<60;count++){
      const i=s.indexOf(name+"(",from);
      if(i===-1)return s;
      const beginning=i+name.length+1;
      let level=1,end=beginning;
      for(;end<s.length;end++){
        if(s[end]==="(")level++;
        else if(s[end]===")"&&--level===0)break;
      }
      if(level!==0)throw Error("Syntax ERROR");
      const argument=s.slice(beginning,end);
      const replacement=String(callback(argument,ctx));
      s=s.slice(0,i)+replacement+s.slice(end+1);
      from=i+replacement.length;
    }
    throw Error("Expression too long");
  }
  function rewrite(input,ctx){
    let s=String(input);
    // Preserve calculator-style implicit multiplication, e.g. 1000 Ran#.
    s=s.replace(/(\d|\))(?=Ran#|RanInt#\(|Rnd\()/g,"$1×");
    s=replaceCall(s,"RanInt#",(arg,context)=>{
      const [a,b]=splitArguments(arg);
      const low=evaluateArgument(a,context),high=evaluateArgument(b,context);
      return sample(context,()=>randomInt(low,high));
    },ctx);
    s=replaceCall(s,"Rnd",(arg,context)=>{
      return rounded(evaluateArgument(arg,context));
    },ctx);
    s=s.replace(/Ran#/g,()=>{
      const k=sample(ctx,()=>Math.floor(Math.random()*1000));
      return (k/1000).toFixed(3);
    });
    return s;
  }
  evaluate=function(input){
    const ctx={position:0,values:[],reuse:!calculating&&justCalculated&&cachedSamples.length>0};
    const value=previousEvaluate(rewrite(input,ctx));
    if(calculating)cachedSamples=ctx.values;
    return value;
  };
  function makeMath(tag,text){
    const item=document.createElementNS(MATH,tag);
    if(text!==undefined)item.textContent=String(text);
    return item;
  }
  function fractionFor(value){
    let numerator=Math.round(value*1000),denominator=1000;
    if(numerator===0)return {numerator:0,denominator:1};
    const gcd=(a,b)=>{while(b){[a,b]=[b,a%b]}return a;};
    const g=gcd(Math.abs(numerator),denominator);
    return {numerator:numerator/g,denominator:denominator/g};
  }
  function paintRandom(){
    if(!justCalculated||expr.trim()!=="Ran#"||!cachedSamples.length)return;
    if(showDecimal){
      result.textContent=fmt(ans);
      return;
    }
    const f=fractionFor(ans);
    if(f.denominator===1){
      result.textContent=String(f.numerator);
      return;
    }
    const math=makeMath("math"),frac=makeMath("mfrac");
    frac.append(makeMath("mn",f.numerator),makeMath("mn",f.denominator));
    math.append(frac);
    result.replaceChildren(math);
    result.classList.remove("error");
  }
  calculate=function(){
    calculating=true;
    cachedSamples=[];
    try{
      previousCalculate();
    }finally{calculating=false;}
    showDecimal=false;
    paintRandom();
  };
  render=function(){
    previousRender();
    paintRandom();
  };
  handle=function(v){
    if(v==="rnd"){append("Rnd(");return}
    if(v==="random"){append("Ran#");return}
    if(v==="comma"){append(",");return}
    if(v==="sd"&&justCalculated&&expr.trim()==="Ran#"&&cachedSamples.length){
      showDecimal=!showDecimal;
      paintRandom();
      return;
    }
    previousHandle(v);
  };
  document.addEventListener("keydown",e=>{
    if(e.key!==","||e.ctrlKey||e.metaKey||e.altKey)return;
    if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
    e.preventDefault();
    handle("comma");
  },true);
})();