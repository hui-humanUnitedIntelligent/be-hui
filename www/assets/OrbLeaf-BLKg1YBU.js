import{r as d,j as t}from"./react-vendor-Db8AeWW8.js";import{useOrbParams as L}from"./useCoreEngine-D-jlpVr6.js";import{b3 as O}from"./index-De9ZgNCZ.js";import"./vendor-B2A-RkCI.js";let C=!1;function _(){if(C||typeof document>"u")return;C=!0;const n=document.createElement("style");n.id="__hui_orb_leaf_css__",n.textContent=`
    /* HUI Orb Leaf — Basis-Animationen */

    @keyframes hui-leaf-breathe {
      0%,100% { transform: scale(1) translateY(0); }
      50%      { transform: scale(1.018) translateY(-2px); }
    }

    @keyframes hui-leaf-float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }

    @keyframes hui-leaf-shimmer {
      0%,100% { opacity: 0.6; }
      50%      { opacity: 1.0; }
    }

    @keyframes hui-leaf-entry {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }

    .hui-orb-leaf {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .hui-orb-leaf svg {
      overflow: visible;   /* Glow darf über Grenzen hinausgehen */
    }

    .hui-orb-leaf-tap {
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
      touch-action: manipulation;
    }
  `,document.head.appendChild(n)}const E=d.memo(function({userId:e,size:a=40,variant:o="profile",showPillars:c=!1,animate:s=!0,onClick:p,style:m}){var g,j,b;_();const{params:w,ready:x}=L(e),[u,v]=d.useState(!1);d.useEffect(()=>{if(!x)return;const i=setTimeout(()=>v(!0),80);return()=>clearTimeout(i)},[x]);const{leaf:h,color:r,glow:k,animation:l,details:f,dominantPillars:M}=w,y=c?O.pillarLabels(M):[],S=s&&u?`hui-leaf-breathe ${l.breathDuration} ${l.breathEasing} infinite`:"none",$={tab:0,profile:.7,public:.85}[o]??.7,D=!!p;return t.jsxs("div",{className:`hui-orb-leaf${D?" hui-orb-leaf-tap":""}`,onClick:p,style:{opacity:u?1:0,transition:`opacity ${l.transitionDuration} ease`,animation:s&&u?`hui-leaf-float ${l.floatDuration} ${l.floatEasing} infinite`:"none",...m},children:[t.jsxs("svg",{width:a,height:Math.round(a*1.33),viewBox:h.viewBox,fill:"none",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",style:{animation:S,filter:$>0?`drop-shadow(0 0 ${k.radius*.4}px ${r.warm})`:"none",transition:`all ${l.transitionDuration} ease`,willChange:s?"transform":"auto"},children:[t.jsxs("defs",{children:[t.jsxs("linearGradient",{id:`hui-leaf-grad-${(e==null?void 0:e.slice(0,8))??"default"}`,x1:"20",y1:"5",x2:"40",y2:"75",gradientUnits:"userSpaceOnUse",children:[t.jsx("stop",{offset:"0%",stopColor:r.warm}),t.jsx("stop",{offset:"60%",stopColor:r.primary}),t.jsx("stop",{offset:"100%",stopColor:r.deep})]}),f.some(i=>i.type==="shimmer")&&t.jsxs("linearGradient",{id:`hui-leaf-shimmer-${(e==null?void 0:e.slice(0,8))??"default"}`,x1:"10",y1:"0",x2:"50",y2:"80",gradientUnits:"userSpaceOnUse",children:[t.jsx("stop",{offset:"0%",stopColor:"rgba(255,255,255,0.22)"}),t.jsx("stop",{offset:"50%",stopColor:"rgba(255,255,255,0.08)"}),t.jsx("stop",{offset:"100%",stopColor:"rgba(255,255,255,0.0)"})]})]}),t.jsx("path",{d:h.path,fill:`url(#hui-leaf-grad-${(e==null?void 0:e.slice(0,8))??"default"})`,style:{transition:`fill ${l.transitionDuration} ease, d 3s ease`}}),f.some(i=>i.type==="veins")&&t.jsx(B,{path:h.path,color:r.deep,opacity:((g=f.find(i=>i.type==="veins"))==null?void 0:g.opacity)??.2}),f.some(i=>i.type==="shimmer")&&t.jsx("path",{d:h.path,fill:`url(#hui-leaf-shimmer-${(e==null?void 0:e.slice(0,8))??"default"})`,opacity:((j=f.find(i=>i.type==="shimmer"))==null?void 0:j.opacity)??.3,style:{animation:"hui-leaf-shimmer 4s ease-in-out infinite"}}),f.some(i=>i.type==="secondary_leaf")&&t.jsx(W,{color:r.warm,opacity:((b=f.find(i=>i.type==="secondary_leaf"))==null?void 0:b.opacity)??.4})]}),c&&y.length>0&&t.jsx(G,{labels:y,color:r.primary})]})});function B({path:n,color:e,opacity:a}){return t.jsxs("g",{opacity:a,stroke:e,strokeWidth:"0.8",fill:"none",strokeLinecap:"round",children:[t.jsx("path",{d:"M30,70 C30,50 30,30 30,8",opacity:"0.7"}),t.jsx("path",{d:"M30,50 C25,44 18,42 14,40",opacity:"0.5"}),t.jsx("path",{d:"M30,35 C26,30 20,28 17,26",opacity:"0.4"}),t.jsx("path",{d:"M30,50 C35,44 42,42 46,40",opacity:"0.5"}),t.jsx("path",{d:"M30,35 C34,30 40,28 43,26",opacity:"0.4"})]})}function W({color:n,opacity:e}){return t.jsx("path",{d:"M42,68 C36,58 34,48 36,38 C38,30 44,26 48,24 C50,30 50,42 46,52 C44,58 42,64 42,68 Z",fill:n,opacity:e*.6,transform:"rotate(-20, 45, 48)"})}function G({labels:n,color:e}){return t.jsxs("div",{style:{marginTop:10,display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[t.jsx("p",{style:{fontSize:11,color:"rgba(20,20,34,0.45)",fontWeight:500,letterSpacing:"0.04em",margin:0,textTransform:"uppercase"},children:"Wirkt besonders durch"}),t.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:n.map(({label:a,icon:o})=>t.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,background:"rgba(13,196,181,0.08)",border:"1px solid rgba(13,196,181,0.16)",fontSize:12,fontWeight:600,color:"rgba(20,20,34,0.75)"},children:[t.jsx("span",{style:{fontSize:13},children:o}),a]},a))})]})}const P=d.memo(function({userId:e,size:a=32,animate:o=!1}){const c=Math.round(a*.65),s=Math.round(a*.45);return t.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:Math.round(a*.08),flexShrink:0},children:[t.jsx(U,{size:c}),t.jsx(E,{userId:e,size:s,variant:"tab",animate:o})]})});function U({size:n=20}){return t.jsxs("svg",{width:n,height:n,viewBox:"0 0 40 40",fill:"none","aria-hidden":"true",children:[[0,45,90,135,180,225,270,315].map((e,a)=>{const o=e*Math.PI/180,c=20+Math.cos(o)*14,s=20+Math.sin(o)*14,p=20+Math.cos(o)*19,m=20+Math.sin(o)*19;return t.jsx("line",{x1:c,y1:s,x2:p,y2:m,stroke:"#0DC4B5",strokeWidth:a%2===0?1.8:1.2,strokeLinecap:"round",opacity:a%2===0?.9:.55},a)}),t.jsx("circle",{cx:"20",cy:"20",r:"9",fill:"url(#hui-sun-grad)"}),t.jsx("defs",{children:t.jsxs("radialGradient",{id:"hui-sun-grad",cx:"40%",cy:"35%",children:[t.jsx("stop",{offset:"0%",stopColor:"#22DDD0"}),t.jsx("stop",{offset:"100%",stopColor:"#0DC4B5"})]})})]})}export{P as HuiOrbLogo,U as HuiSun,E as OrbLeaf};
