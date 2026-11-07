/* Exact textbook results for arithmetic and elementary radicals.
   Uses the existing numeric evaluator for calculations, not formatted strings. */
(() => {
  "use strict";
  const display = document.getElementById("result");
  const keys = document.getElementById("keys");
  if (!display || !keys) return;

  const oldCalculate = calculate;
  const oldHandle = handle;
  const oldRender = render;
  let lastExpression = "", exactText = "", decimalText = "";
  let showingDecimal = false, forceDecimal = false;

  const abs = x => x < 0n ? -x : x;
  const gcd = (a,b) => { a=abs(a); b=abs(b); while(b){const t=a%b;a=b;b=t;}return a||1n; };
  const frac = (n,d=1n) => {
    if (!d) throw Error("Division by zero");
    if (d<0n){n=-n;d=-d;}
    const g=gcd(n,d);n/=g;d/=g;
    if (abs(n)>10n**26n || d>10n**26n) throw Error("Too many digits");
    return {n,d};
  };
  const add = (a,b) => frac(a.n*b.d+b.n*a.d,a.d*b.d);
  const sub = (a,b) => frac(a.n*b.d-b.n*a.d,a.d*b.d);
  const mul = (a,b) => frac(a.n*b.n,a.d*b.d);
  const div = (a,b) => frac(a.n*b.d,a.d*b.n);
  const neg = a => frac(-a.n,a.d);
  const toFraction = v => {
    const s=String(v);
    if (!/^\d+(?:\.\d+)?$/.test(s)) throw Error("Not an exact decimal");
    const parts=s.split(".");
    return frac(BigInt(parts.join("")),10n**BigInt(parts[1]?.length||0));
  };
  function rationalExpression(input) {
    const tokens=tokenize(complete(input));
    if (tokens.some(x => !['num','+','-','*','/','^','(',')','%'].includes(x.t))) return null;
    let i=0;
    const peek=()=>tokens[i]?.t;
    const take=t=>{if(peek()!==t)throw Error("Invalid expression");return tokens[i++];};
    function primary() {
      if(peek()==='-'){take('-');return neg(parse(35));}
      if(peek()==='+'){take('+');return parse(35);}
      if(peek()==='num')return toFraction(take('num').v);
      if(peek()==='('){take('(');const x=parse(0);take(')');return x;}
      throw Error("Unsupported exact operation");
    }
    function parse(min) {
      let a=primary();
      while(true){
        if(peek()==='%'){if(60<min)break;take('%');a=div(a,frac(100n));continue;}
        const op=peek(),prec={'+':10,'-':10,'*':20,'/':20,'^':40}[op];
        if(prec===undefined||prec<min)break;
        take(op);const b=parse(op==='^'?prec:prec+1);
        if(op==='+')a=add(a,b);
        else if(op==='-')a=sub(a,b);
        else if(op==='*')a=mul(a,b);
        else if(op==='/')a=div(a,b);
        else {
          if(b.d!==1n||abs(b.n)>10n)throw Error("Power outside exact range");
          const p=Number(abs(b.n));
          a=b.n<0n?frac(a.d**BigInt(p),a.n**BigInt(p)):
                        frac(a.n**BigInt(p),a.d**BigInt(p));
        }
      }
      return a;
    }
    const value=parse(0);
    if(i!==tokens.length)throw Error("Unparsed exact expression");
    return value;
  }
  function radicalExpression(input) {
    // Handle the common square-root sequences before falling back to a decimal.
    const s=input.replace(/\s/g,"");
    let multiplier=1, radicand=0;
    let m=s.match(/^√\((\d+)\)$/);
    if(m)radicand=Number(m[1]);
    else if((m=s.match(/^(\d+)×√\((\d+)\)$/))){multiplier=Number(m[1]);radicand=Number(m[2]);}
    else if((m=s.match(/^√\((\d+)\)×(\d+)$/))){radicand=Number(m[1]);multiplier=Number(m[2]);}
    else return null;
    if(!Number.isSafeInteger(radicand)||radicand<0||radicand>100000000||!Number.isSafeInteger(multiplier))return null;
    let root=radicand,outer=multiplier;
    for(let k=2;k*k<=root;k++){
      while(root%(k*k)===0){root/=k*k;outer*=k;}
    }
    if(root===1)return String(outer);
    return (outer===1?"":outer)+"√"+root;
  }
  function formatExact(input,value) {
    const settings=window.calculatorSettings;
    if(settings&&(settings.format!=="norm"||settings.output==="mathDecimal"||settings.output==="lineDecimal"))return null;
    if(!Number.isFinite(value)||String(input).includes("→"))return null;
    const radical=radicalExpression(input);
    if(radical)return radical;
    try {
      const r=rationalExpression(input);
      if(!r||r.d===1n)return null;
      if(Math.abs(Number(r.n)/Number(r.d)-value)>Math.max(1e-10,Math.abs(value)*1e-10))return null;
      if(settings?.fraction==="mixed" && (r.n>=r.d || r.n<=-r.d)) {
        const whole=r.n/r.d;
        const remainder=r.n<0n?(-r.n)%r.d:r.n%r.d;
        if(remainder) return String(whole)+" "+String(remainder)+"/"+String(r.d);
      }
      return String(r.n)+"/"+String(r.d);
    } catch (_) { return null; }
  }
  function paint() {
    if(!justCalculated || expr!==lastExpression)return;
    const settings=window.calculatorSettings;
    if(settings&&(settings.format!=="norm"||settings.output==="mathDecimal"||settings.output==="lineDecimal")){
      display.classList.remove("error");
      display.textContent=fmt(ans);
      return;
    }
    const requestedExact=formatExact(complete(expr),ans);
    if(requestedExact)exactText=requestedExact;
    else exactText="";
    if(!exactText)return;
    display.classList.remove("error");
    display.textContent=showingDecimal?fmt(ans):exactText;
  }
  calculate = function() {
    const input=complete(expr);
    oldCalculate();
    if(!justCalculated||display.classList.contains('error'))return;
    lastExpression=expr;
    decimalText=fmt(ans);
    exactText=formatExact(input,ans)||"";
    showingDecimal=forceDecimal || !exactText;
    forceDecimal=false;
    paint();
    if(history.length && history[0].expr===lastExpression) {
      history[0].value=display.textContent;
      renderHistory();
    }
  };
  render = function() { oldRender(); paint(); };
  handle = function(v) {
    if(v==='sd' && justCalculated && expr===lastExpression && exactText) {
      showingDecimal=!showingDecimal;
      paint();
      return;
    }
    return oldHandle(v);
  };
  keys.addEventListener('click',event=>{
    const b=event.target.closest('button[data-key]');
    if(b && b.dataset.key==='=' && inverse)forceDecimal=true;
  },true);
  render();
})();
