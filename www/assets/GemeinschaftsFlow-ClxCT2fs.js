import{r as o,j as e}from"./react-vendor-Db8AeWW8.js";import{u as k}from"./index-DblVi1gy.js";import"./vendor-B2A-RkCI.js";const n={teal:"#0EC4B8",tealSoft:"rgba(14,196,184,0.10)",tealGlow:"rgba(14,196,184,0.28)",ink:"#1A1A18",inkSoft:"rgba(26,26,24,0.52)",inkFaint:"rgba(26,26,24,0.28)",cream:"#F7F5F0",white:"#FFFFFF",border:"rgba(26,26,24,0.08)",borderMid:"rgba(26,26,24,0.14)",greenSoft:"rgba(34,197,94,0.12)",card:"0 2px 16px rgba(26,26,24,0.08), 0 1px 4px rgba(26,26,24,0.04)",r20:20,r99:99,px:20},j=`
  @keyframes gf-fade-up {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes gf-scale-in {
    from { opacity:0; transform:scale(0.92); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes gf-pulse {
    0%,100% { transform:scale(1); }
    50%      { transform:scale(1.04); }
  }
  .gf-root {
    position:fixed; inset:0; z-index:19999;
    background:rgba(26,26,24,0.55);
    display:flex; align-items:flex-end; justify-content:center;
    -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
  }
  .gf-sheet {
    width:100%; max-width:480px;
    background:${n.cream};
    border-radius:28px 28px 0 0;
    overflow:hidden;
    animation: gf-scale-in .32s cubic-bezier(.22,1,.36,1) both;
    max-height:calc(92dvh - env(safe-area-inset-bottom, 0px));
    display:flex; flex-direction:column;
    margin-bottom:env(safe-area-inset-bottom, 0px);
    padding-bottom: 72px;
  }
  .gf-scroll {
    flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .gf-scroll::-webkit-scrollbar { display:none; }
  .gf-btn-primary {
    width:100%; padding:18px 24px;
    background:linear-gradient(135deg,${n.teal},#0AADA3);
    color:#fff; border:none; border-radius:${n.r99}px;
    font-size:17px; font-weight:800; letter-spacing:0.01em;
    cursor:pointer; font-family:inherit;
    box-shadow:0 4px 18px ${n.tealGlow};
    touch-action:manipulation;
    transition:transform .15s, box-shadow .15s;
  }
  .gf-btn-primary:active { transform:scale(.97); box-shadow:none; }
  .gf-btn-primary:disabled {
    background:rgba(26,26,24,0.12); color:rgba(26,26,24,0.32);
    box-shadow:none; cursor:not-allowed;
  }
  .gf-btn-secondary {
    padding:14px 24px;
    background:transparent; color:${n.inkSoft};
    border:none; border-radius:${n.r99}px;
    font-size:15px; font-weight:600;
    cursor:pointer; font-family:inherit;
    touch-action:manipulation;
    transition:color .15s;
  }
  .gf-btn-secondary:active { color:${n.ink}; }
  .gf-check-row {
    display:flex; align-items:flex-start; gap:14px;
    padding:14px 0; border-bottom:1px solid ${n.border};
  }
  .gf-check-row:last-child { border-bottom:none; }
  .gf-checkbox {
    width:22px; height:22px; border-radius:6px; flex-shrink:0;
    border:2px solid ${n.borderMid}; background:${n.white};
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; margin-top:1px;
    transition:border-color .15s, background .15s;
  }
  .gf-checkbox.checked {
    background:${n.teal}; border-color:${n.teal};
  }
  .gf-feature-row {
    display:flex; align-items:center; gap:12px;
    padding:10px 0;
  }
`;function y(){return e.jsxs("div",{style:{textAlign:"center",margin:"8px 0 4px",userSelect:"none"},children:[e.jsx("span",{style:{fontSize:88,lineHeight:1,display:"block"},children:"🌍"}),e.jsx("div",{style:{width:72,height:4,borderRadius:99,background:`linear-gradient(90deg,${n.teal},rgba(14,196,184,0))`,margin:"12px auto 0"}})]})}function S(){return e.jsxs("div",{style:{textAlign:"center",margin:"8px 0 4px",userSelect:"none"},children:[e.jsx("span",{style:{fontSize:88,lineHeight:1,display:"block"},children:"✨"}),e.jsx("div",{style:{width:72,height:4,borderRadius:99,background:"linear-gradient(90deg,rgba(245,166,35,0),rgba(245,166,35,1),rgba(245,166,35,0))",margin:"12px auto 0"}})]})}function v(){return e.jsxs("div",{style:{textAlign:"center",margin:"8px 0 4px",userSelect:"none"},children:[e.jsx("span",{style:{fontSize:88,lineHeight:1,display:"block"},children:"🤝"}),e.jsx("div",{style:{width:72,height:4,borderRadius:99,background:`linear-gradient(90deg,${n.teal},rgba(14,196,184,0))`,margin:"12px auto 0"}})]})}function h({step:i,total:r}){return e.jsx("div",{style:{display:"flex",gap:7,justifyContent:"center",paddingTop:20},children:Array.from({length:r}).map((s,a)=>e.jsx("div",{style:{width:a===i?24:7,height:7,borderRadius:99,background:a<=i?`linear-gradient(90deg,${n.teal},#0AADA3)`:"rgba(26,26,24,0.12)",transition:"all .35s cubic-bezier(.34,1.4,.64,1)"}},a))})}function w({onNext:i,onClose:r}){return e.jsxs("div",{style:{padding:`24px ${n.px}px 32px`,animation:"gf-fade-up .38s both"},children:[e.jsx("div",{style:{display:"flex",justifyContent:"flex-end",marginBottom:4},children:e.jsx("button",{onClick:r,className:"gf-btn-secondary",style:{padding:"6px 12px",fontSize:13},children:"Schließen"})}),e.jsx(h,{step:0,total:4}),e.jsxs("div",{style:{textAlign:"center",marginTop:28},children:[e.jsx(y,{}),e.jsx("h2",{style:{fontSize:26,fontWeight:800,color:n.ink,letterSpacing:"-0.03em",lineHeight:1.2,margin:"20px 0 16px"},children:"Willkommen bei HUI 🌍"}),e.jsxs("p",{style:{fontSize:16,lineHeight:1.75,color:n.inkSoft,margin:0,maxWidth:300,marginLeft:"auto",marginRight:"auto"},children:["Hier begegnen sich Menschen,",e.jsx("br",{}),"die ihre Talente, Ideen und Erfahrungen",e.jsx("br",{}),"einbringen möchten.",e.jsx("br",{}),e.jsx("br",{}),"Gemeinsam schaffen wir Dinge,",e.jsx("br",{}),"die größer sind als wir selbst."]})]}),e.jsx("div",{style:{marginTop:36},children:e.jsx("button",{className:"gf-btn-primary",onClick:i,children:"Weiter →"})})]})}function z({onNext:i,onBack:r}){return e.jsxs("div",{style:{padding:`24px ${n.px}px 32px`,animation:"gf-fade-up .38s both"},children:[e.jsx(h,{step:1,total:4}),e.jsxs("div",{style:{textAlign:"center",marginTop:28},children:[e.jsx(S,{}),e.jsx("h2",{style:{fontSize:26,fontWeight:800,color:n.ink,letterSpacing:"-0.03em",lineHeight:1.2,margin:"20px 0 16px"},children:"Dein Beitrag zählt ✨"}),e.jsxs("p",{style:{fontSize:16,lineHeight:1.75,color:n.inkSoft,margin:0,maxWidth:300,marginLeft:"auto",marginRight:"auto"},children:["Jeder Mensch besitzt Fähigkeiten,",e.jsx("br",{}),"Erfahrungen und Perspektiven,",e.jsx("br",{}),"die für andere wertvoll sein können."]}),e.jsxs("p",{style:{fontSize:16,lineHeight:1.75,color:n.teal,fontWeight:700,margin:"16px auto 0",maxWidth:280},children:["Was du gibst,",e.jsx("br",{}),"kann für andere ein Geschenk sein."]})]}),e.jsxs("div",{style:{marginTop:36,display:"flex",flexDirection:"column",gap:10},children:[e.jsx("button",{className:"gf-btn-primary",onClick:i,children:"Weiter →"}),e.jsx("button",{className:"gf-btn-secondary",onClick:r,style:{textAlign:"center"},children:"← Zurück"})]})]})}const W=[{icon:"🌟",label:"Talente sichtbar machen"},{icon:"🎨",label:"Werke veröffentlichen"},{icon:"✨",label:"Erlebnisse teilen"},{icon:"🤝",label:"Menschen verbinden"},{icon:"💚",label:"Projekte unterstützen"},{icon:"🌱",label:"Teil einer werteorientierten Gemeinschaft sein"}];function A({onNext:i,onBack:r}){return e.jsxs("div",{style:{padding:`24px ${n.px}px 32px`,animation:"gf-fade-up .38s both"},children:[e.jsx(h,{step:2,total:4}),e.jsxs("div",{style:{textAlign:"center",marginTop:28},children:[e.jsx(v,{}),e.jsx("h2",{style:{fontSize:26,fontWeight:800,color:n.ink,letterSpacing:"-0.03em",lineHeight:1.2,margin:"20px 0 20px"},children:"Gemeinsam Wirkung entfalten 🤝"})]}),e.jsx("div",{style:{margin:"0 0 20px"},children:W.map((s,a)=>e.jsxs("div",{className:"gf-feature-row",children:[e.jsx("span",{style:{width:36,height:36,borderRadius:12,background:n.tealSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0},children:s.icon}),e.jsx("span",{style:{fontSize:15.5,color:n.ink,fontWeight:600,lineHeight:1.4},children:s.label})]},a))}),e.jsxs("p",{style:{fontSize:14.5,lineHeight:1.72,color:n.inkSoft,margin:"0 0 28px",textAlign:"center",fontStyle:"italic"},children:["Du wirst Teil einer Gemeinschaft,",e.jsx("br",{}),"die auf Vertrauen, Respekt,",e.jsx("br",{}),"Verantwortung und gemeinsames Wachstum setzt."]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsx("button",{className:"gf-btn-primary",onClick:i,children:"Weiter →"}),e.jsx("button",{className:"gf-btn-secondary",onClick:r,style:{textAlign:"center"},children:"← Zurück"})]})]})}const $=[{id:"rules",label:"Ich habe die ",link:"Gemeinschaftsregeln",suffix:" gelesen und akzeptiere sie."},{id:"privacy",label:"Ich habe die ",link:"Datenschutzerklärung",suffix:" gelesen und akzeptiere sie."},{id:"terms",label:"Ich habe die ",link:"Allgemeinen Geschäftsbedingungen",suffix:" gelesen und akzeptiere sie."},{id:"intent",label:"Ich möchte Teil der HUI-Gemeinschaft werden und mit meinem Wirken zu einer positiven Entwicklung beitragen. 💚",link:null,suffix:null}];function H({onBack:i,onConfirm:r,loading:s}){const[a,d]=o.useState({rules:!1,privacy:!1,terms:!1,intent:!1}),g=Object.values(a).every(Boolean),x=t=>d(c=>({...c,[t]:!c[t]}));return e.jsxs("div",{style:{padding:`24px ${n.px}px 32px`,animation:"gf-fade-up .38s both"},children:[e.jsx(h,{step:3,total:4}),e.jsxs("div",{style:{textAlign:"center",marginTop:24,marginBottom:24},children:[e.jsx("h2",{style:{fontSize:24,fontWeight:800,color:n.ink,letterSpacing:"-0.03em",lineHeight:1.2,margin:"0 0 8px"},children:"Mitgliedschaft bestätigen 💚"}),e.jsx("p",{style:{fontSize:13.5,color:n.inkFaint,margin:0},children:"Bitte bestätige alle Punkte um fortzufahren."})]}),e.jsx("div",{style:{background:n.white,borderRadius:n.r20,padding:"4px 16px 4px",boxShadow:n.card,marginBottom:24},children:$.map(t=>e.jsxs("div",{className:"gf-check-row",onClick:()=>x(t.id),children:[e.jsx("div",{className:`gf-checkbox ${a[t.id]?"checked":""}`,children:a[t.id]&&e.jsx("svg",{width:"13",height:"10",viewBox:"0 0 13 10",fill:"none",children:e.jsx("path",{d:"M1.5 5L5 8.5L11.5 1.5",stroke:"#fff",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round"})})}),e.jsxs("p",{style:{margin:0,fontSize:14.5,lineHeight:1.6,color:n.ink,cursor:"pointer",userSelect:"none"},children:[t.label,t.link&&e.jsx("span",{style:{color:n.teal,fontWeight:600},children:t.link}),t.suffix]})]},t.id))}),e.jsx("p",{style:{fontSize:12,color:n.inkFaint,textAlign:"center",margin:"0 0 20px"},children:"Du kannst alle Dokumente jederzeit in deinem Profil einsehen."}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsx("button",{className:"gf-btn-primary",onClick:r,disabled:!g||s,style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8},children:s?e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",children:e.jsx("path",{d:"M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",stroke:"#fff",strokeWidth:"2",strokeLinecap:"round"})}),"Wird aktiviert…"]}):"💚 Jetzt Mitglied werden"}),!s&&e.jsx("button",{className:"gf-btn-secondary",onClick:i,style:{textAlign:"center"},children:"← Zurück"})]})]})}function N({onOpenProfile:i}){return e.jsxs("div",{style:{padding:`40px ${n.px}px 40px`,textAlign:"center",animation:"gf-fade-up .42s both"},children:[e.jsx("div",{style:{width:80,height:80,borderRadius:"50%",background:n.greenSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"gf-pulse 2s ease-in-out infinite"},children:e.jsx("span",{style:{fontSize:42,lineHeight:1},children:"🎉"})}),e.jsxs("h2",{style:{fontSize:24,fontWeight:800,color:n.ink,letterSpacing:"-0.03em",lineHeight:1.25,margin:"0 0 16px"},children:["Willkommen in der",e.jsx("br",{}),"HUI-Gemeinschaft!"]}),e.jsxs("p",{style:{fontSize:15.5,lineHeight:1.75,color:n.inkSoft,margin:"0 0 32px",maxWidth:300,marginLeft:"auto",marginRight:"auto"},children:["Schön, dass du da bist.",e.jsx("br",{}),"Dein Gemeinschaftsprofil wurde aktiviert.",e.jsx("br",{}),e.jsx("br",{}),"Nun kannst du deine Talente, Werke,",e.jsx("br",{}),"Erlebnisse und Projekte mit anderen",e.jsx("br",{}),"Menschen teilen und gemeinsam",e.jsx("br",{}),"Gutes bewirken."]}),e.jsx("button",{className:"gf-btn-primary",onClick:i,children:"Mein Gemeinschaftsprofil öffnen →"})]})}function F({onClose:i,onComplete:r}){const[s,a]=o.useState(0),[d,g]=o.useState(!1),[x,t]=o.useState(null),{activateMembership:c,refreshProfile:f}=k(),p=o.useCallback(()=>a(l=>l+1),[]),u=o.useCallback(()=>a(l=>Math.max(0,l-1)),[]),b=o.useCallback(async()=>{if(!d){g(!0),t(null);try{const l=await(c==null?void 0:c());if(l!=null&&l.error){t("Aktivierung fehlgeschlagen. Bitte nochmal versuchen."),g(!1);return}await(f==null?void 0:f().catch(()=>{})),a(4)}catch{t("Verbindungsfehler. Bitte nochmal versuchen.")}finally{g(!1)}}},[d,c,f]),m=o.useCallback(()=>{r==null||r(),i==null||i()},[r,i]);return e.jsxs("div",{className:"gf-root",onClick:l=>{l.target===l.currentTarget&&(i==null||i())},children:[e.jsx("style",{children:j}),e.jsx("div",{className:"gf-sheet",children:e.jsxs("div",{className:"gf-scroll",children:[s===0&&e.jsx(w,{onNext:p,onClose:i}),s===1&&e.jsx(z,{onNext:p,onBack:u}),s===2&&e.jsx(A,{onNext:p,onBack:u}),s===3&&e.jsx(H,{onBack:u,onConfirm:b,loading:d}),s===4&&e.jsx(N,{onOpenProfile:m}),x&&e.jsx("div",{style:{margin:`0 ${n.px}px 16px`,padding:"12px 16px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,fontSize:14,color:"#DC2626"},children:x})]})})]})}export{F as default};
