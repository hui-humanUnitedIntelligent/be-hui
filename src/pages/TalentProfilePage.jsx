// src/pages/TalentProfilePage.jsx — HUI Öffentliches Talent-Profil v1
// "Öffentliches Talent-Profil ✨ — Entdecke meine Welt und meine Werke."
// ════════════════════════════════════════════════════════════════
// Screenshot-exact rebuild — May 2026
// Same emotional DNA as BasisProfilePage.
// Talent layer adds: Talente & Angebote, Werke, Erlebnisse,
// Kundenstimmen, Verfügbarkeit+Standort, Sichtbarkeit, Social bar.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ── Tokens (same as BasisProfilePage) ───────────────────────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  bgSheet:  "rgba(252,251,248,0.98)",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  coral:    "#FF6B52",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.28)",
  border:   "rgba(26,26,24,0.08)",
  borderMid:"rgba(26,26,24,0.13)",
  px: 20,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:  "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  glow:  "0 4px 18px rgba(14,196,184,0.26)",
  sheet: "0 -10px 40px rgba(26,26,24,0.10)",
};

const CSS = `
  .tpp-root{background:${T.bg};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;color:${T.ink};}
  .tpp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .tpp-scroll::-webkit-scrollbar{display:none;}
  .tpp-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .tpp-hscroll::-webkit-scrollbar{display:none;}
  @keyframes tpp-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tpp-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes tpp-shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
  .tpp-skeleton{background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);background-size:200% 100%;animation:tpp-shimmer 1.4s ease-in-out infinite;border-radius:8px;}
  .tpp-press{transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease;}
  .tpp-press:active{transform:scale(0.94);opacity:0.75;}
  .tpp-press-light{transition:transform .14s ease,opacity .14s ease;}
  .tpp-press-light:active{transform:scale(0.97);opacity:0.82;}
  .tpp-in{animation:tpp-fade-up .45s ease both;}
  .tpp-sheet{animation:tpp-slide-up .28s cubic-bezier(.22,1,.36,1) both;}
`;

const s  = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
const a  = (v) => Array.isArray(v) ? v : [];
const dl = (i) => ({ animationDelay:`${i*55}ms` });

const FB_COVER = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80";
const FB_AVT   = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

const DEFAULT_TALENTS = [
  {icon:"🎨",label:"Malen"},{icon:"🖌",label:"Illustration"},
  {icon:"👥",label:"Workshops"},{icon:"⭐",label:"Kunstberatung"},{icon:"👜",label:"Auftragskunst"},
];
const SEED_WORKS = [
  {id:"w1",img:"https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&q=70"},
  {id:"w2",img:"https://images.unsplash.com/photo-1490750967868-88df5691cc38?w=300&q=70"},
  {id:"w3",img:"https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&q=70"},
  {id:"w4",img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=70"},
  {id:"w5",img:"https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&q=70"},
];
const SEED_EXP = [
  {id:"e1",title:"Malkurs: Intuitives Malen",type:"Workshop",   date:"Mai 2024",  img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=70"},
  {id:"e2",title:"Gemeinschaftsausstellung", type:"Ausstellung",date:"März 2024", img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&q=70"},
  {id:"e3",title:"Live Painting Event",      type:"Event",      date:"Feb. 2024", img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=70"},
  {id:"e4",title:"Kunst für den guten Zweck",type:"Projekt",    date:"Jan. 2024", img:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=300&q=70"},
];
const SEED_TESTI = [
  {id:"t1",quote:"Leas Bilder berühren etwas in mir, das Worte nicht können.",author:"Julia M.",avatar:"https://i.pravatar.cc/48?img=5"},
];

// ── Atoms ─────────────────────────────────────────────────────────
function Gap({h=16}){return <div style={{height:h}}/>;}
function Divider(){return <div style={{height:1,background:T.border,margin:`0 ${T.px}px`}}/>;}
function Sk({w,h,r=8,style={}}){return <div className="tpp-skeleton" style={{width:w,height:h,borderRadius:r,flexShrink:0,...style}}/>;}

function SectionHead({title,cta,onCta}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em"}}>{title}</div>
      {cta&&<button className="tpp-press-light" onClick={onCta} style={{background:"none",border:"none",padding:0,fontSize:12,color:T.teal,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>{cta} ›</button>}
    </div>
  );
}

function Sheet({onClose,children}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9900,background:"rgba(26,26,24,0.4)",display:"flex",alignItems:"flex-end"}}>
      <div className="tpp-sheet" onClick={e=>e.stopPropagation()} style={{width:"100%",background:T.bgSheet,borderRadius:`${T.r24}px ${T.r24}px 0 0`,padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",boxShadow:T.sheet,maxHeight:"82vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 1. HEADER
// ══════════════════════════════════════════════════════════════════
function Header({onBack}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:`14px ${T.px}px 10px`,background:T.bg}}>
      <button className="tpp-press" onClick={onBack} style={{width:36,height:36,borderRadius:"50%",background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.ink}}>‹</button>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:700,color:T.ink,letterSpacing:"-0.02em",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          Öffentliches Talent-Profil <span style={{fontSize:15}}>✨</span>
        </div>
        <div style={{fontSize:11.5,color:T.inkFaint,fontWeight:400,marginTop:1}}>Entdecke meine Welt und meine Werke.</div>
      </div>
      <button className="tpp-press-light" style={{width:36,height:36,borderRadius:"50%",background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.ink,letterSpacing:"1px"}}>···</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 2. CINEMATIC HERO — artist studio cover + floating avatar
// ══════════════════════════════════════════════════════════════════
function CinematicHero({profile,loading}){
  const[coverOk,setCoverOk]=useState(false);
  const[avOk,setAvOk]=useState(false);
  const cover=s(profile?.header_img,FB_COVER);
  const avatar=s(profile?.avatar_url,FB_AVT);
  return(
    <div style={{position:"relative",width:"100%"}}>
      <div style={{width:"100%",height:220,overflow:"hidden",position:"relative",background:"linear-gradient(160deg,#3B2A1A 0%,#6B4E3A 45%,#9B7B5A 100%)"}}>
        {loading
          ? <div className="tpp-skeleton" style={{width:"100%",height:"100%"}}/>
          : <img src={cover} alt="" onLoad={()=>setCoverOk(true)} onError={()=>setCoverOk(true)}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:coverOk?0.88:0,transition:"opacity 1.1s ease"}}/>
        }
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(to bottom,transparent,rgba(247,245,240,0.55))"}}/>
      </div>
      {/* Floating avatar — centered */}
      <div style={{position:"absolute",bottom:-44,left:"50%",transform:"translateX(-50%)"}}>
        <div style={{width:90,height:90,borderRadius:"50%",border:"4px solid white",boxShadow:"0 4px 24px rgba(0,0,0,0.16), 0 0 0 1px rgba(26,26,24,0.06)",overflow:"hidden",background:T.bg,position:"relative"}}>
          {loading
            ? <div className="tpp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>
            : <>
                {!avOk&&<div className="tpp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
                <img src={avatar} alt="" onLoad={()=>setAvOk(true)} onError={()=>setAvOk(true)}
                  style={{width:"100%",height:"100%",objectFit:"cover",opacity:avOk?1:0,transition:"opacity .5s ease"}}/>
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 3. IDENTITY — same as BasisProfilePage
// ══════════════════════════════════════════════════════════════════
function Identity({profile,loading}){
  const name=s(profile?.display_name||profile?.username,"Kreative·r");
  const loc=s(profile?.location,"");
  const bio=s(profile?.bio,"Ich male, um das Unsichtbare sichtbar zu machen.\nInspiration finde ich in der Natur,\nim Licht und in echten Begegnungen.");
  return(
    <div style={{textAlign:"center",padding:`0 ${T.px}px`}}>
      {loading
        ? <Sk w={140} h={32} r={8} style={{margin:"0 auto 8px"}}/>
        : <div style={{fontSize:28,fontWeight:800,color:T.ink,letterSpacing:"-0.04em",lineHeight:1.15,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {name} <span style={{fontSize:20}}>🌿</span>
          </div>
      }
      {loading
        ? <Sk w={200} h={16} r={6} style={{margin:"0 auto 14px"}}/>
        : <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:12.5,color:T.inkSoft,marginBottom:14,fontWeight:400}}>
            {loc&&<><span style={{fontSize:13}}>📍</span><span>{loc}</span><span style={{color:T.borderMid}}>•</span></>}
            <span style={{color:T.teal,fontWeight:600}}>Offen für Begegnungen</span>
          </div>
      }
      {loading
        ? <><Sk w="100%" h={14} r={6} style={{marginBottom:6}}/><Sk w="85%" h={14} r={6} style={{margin:"0 auto 6px"}}/><Sk w="70%" h={14} r={6} style={{margin:"0 auto"}}/></>
        : <p style={{fontSize:14.5,lineHeight:1.72,color:T.inkSoft,margin:0,fontFamily:"-apple-system,'Georgia',serif",fontStyle:"italic",whiteSpace:"pre-line",maxWidth:320,marginLeft:"auto",marginRight:"auto"}}>{bio}</p>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 4. TALENTE & ANGEBOTE — pill row (read-only public view)
// ══════════════════════════════════════════════════════════════════
function TalenteSection({profile,loading}){
  const rawInterests=a(profile?.interests);
  const tags=rawInterests.length
    ? DEFAULT_TALENTS.filter(t=>rawInterests.includes(t.label))
    : DEFAULT_TALENTS;
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:12}}>Meine Talente & Angebote</div>
      {loading
        ? <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{[0,1,2,3,4].map(i=><Sk key={i} w={110} h={40} r={T.r99}/>)}</div>
        : <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {tags.map((t,i)=>(
              <div key={i} className="tpp-in" style={{...dl(i),display:"inline-flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:T.r99,background:T.bgCard,border:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.ink,boxShadow:T.card}}>
                <span style={{fontSize:14}}>{t.icon}</span>{t.label}
              </div>
            ))}
            {/* "Weitere hinzufügen" on public = subtle "Mehr erfahren" */}
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:T.r99,background:"transparent",border:`1px dashed ${T.borderMid}`,fontSize:13,fontWeight:600,color:T.inkFaint}}>
              <span>+</span> Weitere hinzufügen
            </div>
          </div>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 5. MEINE WERKE — cinematic square thumbnails
// ══════════════════════════════════════════════════════════════════
function WerkThumb({src,i}){
  const[ok,setOk]=useState(false);
  return(
    <div className="tpp-in" style={{...dl(i),flexShrink:0,width:100,height:100,borderRadius:T.r12,overflow:"hidden",background:"rgba(26,26,24,0.07)",position:"relative"}}>
      {!ok&&<div className="tpp-skeleton" style={{position:"absolute",inset:0}}/>}
      <img src={src} alt="" onLoad={()=>setOk(true)} onError={()=>setOk(true)}
        style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:ok?1:0,transition:"opacity .5s ease"}}/>
    </div>
  );
}

function WerkeSection({profile,loading}){
  const[showAll,setShowAll]=useState(false);
  const works=SEED_WORKS;
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionHead title="Meine Werke" cta="Alle Werke ansehen" onCta={()=>setShowAll(true)}/>
      {loading
        ? <div style={{display:"flex",gap:8}}>{[0,1,2,3,4].map(i=><Sk key={i} w={100} h={100} r={T.r12}/>)}</div>
        : <div className="tpp-hscroll" style={{display:"flex",gap:8,paddingBottom:4}}>
            {works.map((w,i)=><WerkThumb key={w.id} src={w.img} i={i}/>)}
          </div>
      }
      {showAll&&(
        <Sheet onClose={()=>setShowAll(false)}>
          <div style={{fontSize:16,fontWeight:800,color:T.ink,marginBottom:16}}>🎨 Alle Werke</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {works.map(w=>(
              <div key={w.id} style={{aspectRatio:"1",borderRadius:T.r12,overflow:"hidden"}}>
                <img src={w.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 6. ERLEBNISSE & PROJEKTE — 130×110px cards + + Neues Projekt slot
// ══════════════════════════════════════════════════════════════════
function ExpCard({e,i}){
  const[ok,setOk]=useState(false);
  return(
    <div className="tpp-in" style={{...dl(i),flexShrink:0,width:130}}>
      <div style={{width:130,height:110,borderRadius:T.r12,overflow:"hidden",position:"relative",background:"rgba(26,26,24,0.07)",marginBottom:8}}>
        {!ok&&<div className="tpp-skeleton" style={{position:"absolute",inset:0}}/>}
        <img src={e.img} alt={e.title} onLoad={()=>setOk(true)} onError={()=>setOk(true)}
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:ok?1:0,transition:"opacity .5s ease"}}/>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:T.ink,lineHeight:1.35,marginBottom:2}}>{e.title}</div>
      <div style={{fontSize:10.5,color:T.inkFaint}}>{e.type}</div>
      <div style={{fontSize:10.5,color:T.inkFaint}}>{e.date}</div>
    </div>
  );
}

function ErlebnisseSection({loading}){
  const[showAll,setShowAll]=useState(false);
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionHead title="Erlebnisse & Projekte" cta="Alle anzeigen" onCta={()=>setShowAll(true)}/>
      {loading
        ? <div style={{display:"flex",gap:10}}>{[0,1,2,3].map(i=><Sk key={i} w={130} h={110} r={T.r12}/>)}</div>
        : <div className="tpp-hscroll" style={{display:"flex",gap:10,paddingBottom:4}}>
            {SEED_EXP.map((e,i)=><ExpCard key={e.id} e={e} i={i}/>)}
            {/* + Neues Projekt add-slot */}
            <div style={{flexShrink:0,width:90,minHeight:110,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,borderRadius:T.r12,border:`1.5px dashed ${T.borderMid}`,padding:12}}>
              <span style={{fontSize:20,color:T.inkFaint}}>+</span>
              <span style={{fontSize:10,color:T.inkFaint,textAlign:"center",lineHeight:1.4}}>Neues Projekt</span>
            </div>
          </div>
      }
      {showAll&&(
        <Sheet onClose={()=>setShowAll(false)}>
          <div style={{fontSize:16,fontWeight:800,color:T.ink,marginBottom:16}}>🌿 Erlebnisse & Projekte</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {SEED_EXP.map(e=>(
              <div key={e.id} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:64,height:64,borderRadius:T.r12,overflow:"hidden",flexShrink:0}}>
                  <img src={e.img} alt={e.title} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:2}}>{e.title}</div>
                  <div style={{fontSize:11,color:T.inkFaint}}>{e.type} · {e.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 7. KUNDENSTIMMEN — floating quote card + add slot
// ══════════════════════════════════════════════════════════════════
function KundenstimmenSection({loading}){
  const[showAll,setShowAll]=useState(false);
  const t=SEED_TESTI[0];
  const[avOk,setAvOk]=useState(false);
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionHead title="Kundenstimmen" cta="Alle anzeigen" onCta={()=>setShowAll(true)}/>
      {loading
        ? <Sk w="100%" h={90} r={T.r16}/>
        : <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
            {/* Quote card */}
            <div style={{flex:1,background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"14px 16px",boxShadow:T.card,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:32,color:T.teal,lineHeight:1,opacity:0.4,flexShrink:0,marginTop:-2}}>"</span>
              <div style={{flex:1}}>
                <p style={{fontSize:13,lineHeight:1.6,color:T.inkSoft,margin:"0 0 10px",fontFamily:"-apple-system,'Georgia',serif",fontStyle:"italic"}}>{t.quote}</p>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:28,height:28,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"rgba(26,26,24,0.08)",position:"relative"}}>
                    {!avOk&&<div className="tpp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
                    <img src={t.avatar} alt={t.author} onLoad={()=>setAvOk(true)} onError={()=>setAvOk(true)}
                      style={{width:"100%",height:"100%",objectFit:"cover",opacity:avOk?1:0,transition:"opacity .4s ease"}}/>
                  </div>
                  <span style={{fontSize:11.5,fontWeight:700,color:T.ink}}>— {t.author}</span>
                </div>
              </div>
            </div>
            {/* + Weitere hinzufügen slot */}
            <div style={{flexShrink:0,width:110,borderRadius:T.r16,border:`1.5px dashed ${T.borderMid}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,padding:12}}>
              <span style={{fontSize:18,color:T.inkFaint}}>+</span>
              <span style={{fontSize:10.5,color:T.inkFaint,textAlign:"center",lineHeight:1.4}}>Weitere hinzufügen</span>
            </div>
          </div>
      }
      {showAll&&(
        <Sheet onClose={()=>setShowAll(false)}>
          <div style={{fontSize:16,fontWeight:800,color:T.ink,marginBottom:16}}>💬 Kundenstimmen</div>
          {SEED_TESTI.map(t=>(
            <div key={t.id} style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"16px",boxShadow:T.card,marginBottom:12}}>
              <div style={{fontSize:28,color:T.teal,lineHeight:1,marginBottom:8,opacity:0.4}}>"</div>
              <p style={{fontSize:13.5,lineHeight:1.65,color:T.inkSoft,margin:"0 0 12px",fontFamily:"-apple-system,'Georgia',serif",fontStyle:"italic"}}>{t.quote}</p>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",flexShrink:0}}>
                  <img src={t.avatar} alt={t.author} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:T.ink}}>— {t.author}</span>
              </div>
            </div>
          ))}
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 8. VERFÜGBARKEIT + STANDORT — two compact columns (same as MyTalentProfile)
// ══════════════════════════════════════════════════════════════════
function VerfuegbarkeitStandort({profile,loading}){
  const loc=s(profile?.location,"Freiburg, Deutschland");
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <div style={{display:"flex",gap:12}}>
        {/* Verfügbarkeit */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:800,color:T.ink,letterSpacing:"-0.01em"}}>Verfügbarkeit</div>
            <button style={{background:"none",border:"none",padding:0,fontSize:11,color:T.teal,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit"}}>Mehr erfahren ›</button>
          </div>
          <div style={{fontSize:10.5,color:T.inkFaint,marginBottom:8}}>Wann du für neue Anfragen offen bist.</div>
          {loading
            ? <Sk w="100%" h={52} r={T.r16}/>
            : <div style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"11px 13px",boxShadow:T.card,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 0 2px rgba(34,197,94,0.2)"}}/>
                    <span style={{fontSize:11.5,fontWeight:700,color:T.ink}}>Offen für neue Anfragen</span>
                  </div>
                  <div style={{fontSize:10,color:T.inkFaint}}>Antwortzeit: innerhalb von 24h</div>
                </div>
                <span style={{fontSize:13,color:T.inkFaint}}>›</span>
              </div>
          }
        </div>
        {/* Standort */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:800,color:T.ink,letterSpacing:"-0.01em"}}>Standort</div>
            <button style={{background:"none",border:"none",padding:0,fontSize:11,color:T.teal,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit"}}>Mehr erfahren ›</button>
          </div>
          <div style={{fontSize:10.5,color:T.inkFaint,marginBottom:8}}>&nbsp;</div>
          {loading
            ? <Sk w="100%" h={52} r={T.r16}/>
            : <div style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"11px 13px",boxShadow:T.card,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13}}>📍</span>
                  <span style={{fontSize:11.5,fontWeight:600,color:T.ink}}>{loc}</span>
                </div>
                <span style={{fontSize:13,color:T.inkFaint}}>›</span>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 9. SICHTBARKEIT
// ══════════════════════════════════════════════════════════════════
function SichtbarkeitSection({profile,loading}){
  const[show,setShow]=useState(false);
  const vis=s(profile?.visibility,"connections");
  const txt={public:"Dieses Profil ist öffentlich sichtbar.",connections:"Dieses Profil ist für deine Verbindungen sichtbar.",private:"Dieses Profil ist privat."}[vis]||"Dieses Profil ist für deine Verbindungen sichtbar.";
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:10}}>Sichtbarkeit</div>
      {loading
        ? <Sk w="100%" h={54} r={T.r16}/>
        : <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"14px 16px",boxShadow:T.card}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
              <span style={{fontSize:14,flexShrink:0}}>🔒</span>
              <span style={{fontSize:12,color:T.inkSoft,lineHeight:1.45}}>{txt}</span>
            </div>
            <button className="tpp-press-light" onClick={()=>setShow(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:T.r99,border:`1px solid ${T.border}`,background:T.bg,fontSize:12,fontWeight:600,color:T.ink,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",flexShrink:0,boxShadow:T.card}}>
              <span style={{fontSize:13}}>👥</span> Mehr erfahren
            </button>
          </div>
      }
      {show&&(
        <Sheet onClose={()=>setShow(false)}>
          <div style={{fontSize:16,fontWeight:800,color:T.ink,marginBottom:8}}>🔒 Sichtbarkeit</div>
          <p style={{fontSize:14,lineHeight:1.68,color:T.inkSoft,margin:"0 0 20px",fontFamily:"-apple-system,'Georgia',serif",fontStyle:"italic"}}>{txt}</p>
          <button className="tpp-press" onClick={()=>setShow(false)} style={{width:"100%",padding:"14px",borderRadius:T.r99,border:"none",background:"linear-gradient(135deg,#0EC4B8,#0DBBAF)",color:"white",fontSize:15,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",boxShadow:T.glow}}>Verstanden</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 10. SOCIAL CONTEXT BAR — same as BasisProfilePage
// ══════════════════════════════════════════════════════════════════
function SocialBar({loading}){
  const stats=[
    {icon:"👥",value:"24",label:"Verbindungen"},
    {icon:"🤝",value:"8", label:"Gemeinsame Begegnungen"},
    {icon:"💬",value:"6", label:"Gemeinsame Momente"},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",background:T.bgCard,borderRadius:T.r20,border:`1px solid ${T.border}`,margin:`0 ${T.px}px`,boxShadow:T.card,overflow:"hidden"}}>
      {stats.map((st,i)=>(
        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 8px",borderRight:i<stats.length-1?`1px solid ${T.border}`:"none"}}>
          {loading
            ? <><Sk w={32} h={20} r={6} style={{marginBottom:6}}/><Sk w={48} h={12} r={4}/></>
            : <>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                  <span style={{fontSize:16}}>{st.icon}</span>
                  <span style={{fontSize:18,fontWeight:800,color:T.ink,letterSpacing:"-0.03em"}}>{st.value}</span>
                </div>
                <span style={{fontSize:10.5,color:T.inkFaint,textAlign:"center",lineHeight:1.35,fontWeight:400}}>{st.label}</span>
              </>
          }
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
export default function TalentProfilePage({ profileId, onClose }) {
  const[profile,setProfile]=useState(null);
  const[loading,setLoading]=useState(true);
  const[mounted,setMounted]=useState(false);

  useEffect(()=>{const t=setTimeout(()=>setMounted(true),30);return()=>clearTimeout(t);},[]);

  useEffect(()=>{
    if(!profileId){setLoading(false);return;}
    (async()=>{
      try{
        const{data}=await supabase.from("profiles")
          .select("id,username,display_name,bio,avatar_url,header_img,location,interests,visibility,has_talent_profile,role,membership_type")
          .eq("id",profileId).single();
        setProfile(data||null);
      }catch(e){console.warn("TalentProfilePage:",e);}
      setLoading(false);
    })();
  },[profileId]);

  const handleBack=useCallback(()=>{if(onClose)onClose();},[onClose]);

  return(
    <div className="tpp-root" style={{position:"fixed",inset:0,zIndex:9500,display:"flex",flexDirection:"column",opacity:mounted?1:0,transform:mounted?"none":"translateY(14px)",transition:"opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)"}}>
      <style>{CSS}</style>

      <Header onBack={handleBack}/>

      <div className="tpp-scroll" style={{flex:1,overflowY:"auto",paddingBottom:"max(40px,calc(28px + env(safe-area-inset-bottom,0px)))"}}>

        {/* Hero */}
        <CinematicHero profile={profile} loading={loading}/>
        <Gap h={52}/>

        {/* Identity */}
        <Identity profile={profile} loading={loading}/>
        <Gap h={24}/>

        {/* Talente & Angebote */}
        <TalenteSection profile={profile} loading={loading}/>
        <Gap h={26}/>

        {/* Meine Werke */}
        <WerkeSection profile={profile} loading={loading}/>
        <Gap h={26}/>

        {/* Erlebnisse & Projekte */}
        <ErlebnisseSection loading={loading}/>
        <Gap h={26}/>

        {/* Kundenstimmen */}
        <KundenstimmenSection loading={loading}/>
        <Gap h={26}/>

        {/* Verfügbarkeit + Standort */}
        <VerfuegbarkeitStandort profile={profile} loading={loading}/>
        <Gap h={26}/>

        {/* Sichtbarkeit */}
        <SichtbarkeitSection profile={profile} loading={loading}/>
        <Gap h={24}/>

        {/* Social context bar */}
        <SocialBar loading={loading}/>
        <Gap h={32}/>
      </div>
    </div>
  );
}
