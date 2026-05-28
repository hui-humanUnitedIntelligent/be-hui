// src/pages/MyTalentProfile.jsx — HUI Mein Talent-Profil v1
// "Ich gestalte meine kreative Präsenz."
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

const T = {
  bg:"#F7F5F0",bgCard:"#FFFFFF",bgSheet:"rgba(252,251,248,0.98)",
  teal:"#0EC4B8",tealSoft:"rgba(14,196,184,0.10)",tealMid:"rgba(14,196,184,0.22)",
  coral:"#FF6B52",ink:"#1A1A18",inkSoft:"rgba(26,26,24,0.52)",inkFaint:"rgba(26,26,24,0.28)",
  border:"rgba(26,26,24,0.08)",borderMid:"rgba(26,26,24,0.14)",
  px:20,r12:12,r16:16,r20:20,r24:24,r99:99,
  card:"0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  glowTeal:"0 4px 18px rgba(14,196,184,0.26)",sheet:"0 -10px 40px rgba(26,26,24,0.10)",
};
const CSS=`
  .mtp-root{background:${T.bg};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;color:${T.ink};}
  .mtp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .mtp-scroll::-webkit-scrollbar{display:none;}
  .mtp-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .mtp-hscroll::-webkit-scrollbar{display:none;}
  @keyframes mtp-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes mtp-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes mtp-shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
  .mtp-skeleton{background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);background-size:200% 100%;animation:mtp-shimmer 1.4s ease-in-out infinite;border-radius:8px;}
  .mtp-press{transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease;}
  .mtp-press:active{transform:scale(0.93);opacity:0.74;}
  .mtp-press-light{transition:transform .14s ease,opacity .14s ease;}
  .mtp-press-light:active{transform:scale(0.96);opacity:0.82;}
  .mtp-in{animation:mtp-fade-up .45s ease both;}
  .mtp-sheet{animation:mtp-slide-up .28s cubic-bezier(.22,1,.36,1) both;}
`;
const s=(v,fb="")=>(v&&typeof v==="string"?v.trim():fb);
const a=(v)=>Array.isArray(v)?v:[];
const FB_COVER="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80";
const FB_AVT="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";
const ALL_TALENTS=[
  {icon:"🎨",label:"Malen"},{icon:"🖌",label:"Illustration"},{icon:"👥",label:"Workshops"},
  {icon:"⭐",label:"Kunstberatung"},{icon:"👜",label:"Auftragskunst"},{icon:"📸",label:"Fotografie"},
  {icon:"🎵",label:"Musik"},{icon:"✍️",label:"Texte"},{icon:"🧘",label:"Achtsamkeit"},{icon:"🌿",label:"Natur-Projekte"},
];
const SEED_WORKS=[
  {id:"w1",img:"https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&q=70"},
  {id:"w2",img:"https://images.unsplash.com/photo-1490750967868-88df5691cc38?w=300&q=70"},
  {id:"w3",img:"https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&q=70"},
  {id:"w4",img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=70"},
  {id:"w5",img:"https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&q=70"},
];
const SEED_EXP=[
  {id:"e1",title:"Malkurs: Intuitives Malen",type:"Workshop",date:"Mai 2024",img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=70"},
  {id:"e2",title:"Gemeinschaftsausstellung",type:"Ausstellung",date:"März 2024",img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&q=70"},
  {id:"e3",title:"Live Painting Event",type:"Event",date:"Feb. 2024",img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=70"},
  {id:"e4",title:"Kunst für den guten Zweck",type:"Projekt",date:"Jan. 2024",img:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=300&q=70"},
];
const SEED_TESTI=[
  {id:"t1",quote:"Deine Bilder berühren etwas in mir, das Worte nicht können.",author:"Julia M.",avatar:"https://i.pravatar.cc/48?img=5"},
  {id:"t2",quote:"Der Workshop hat mir gezeigt, wie ich meinen eigenen Stil finde.",author:"Markus K.",avatar:"https://i.pravatar.cc/48?img=10"},
];
const VIS=[
  {key:"public",icon:"🌍",label:"Öffentlich",sub:"Für alle sichtbar"},
  {key:"connections",icon:"👥",label:"Verbindungen",sub:"Nur für deine Verbindungen"},
  {key:"private",icon:"🔒",label:"Privat",sub:"Nur für dich"},
];
function Gap({h=16}){return <div style={{height:h}}/>;} 
function Divider(){return <div style={{height:1,background:T.border,margin:`0 ${T.px}px`}}/>;} 
function SectionRow({title,sub,onEdit,small=false}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:`0 ${T.px}px ${small?8:10}px`}}>
      <div>
        <div style={{fontSize:small?13:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em"}}>{title}</div>
        {sub&&<div style={{fontSize:11,color:T.inkFaint,marginTop:2,fontWeight:400}}>{sub}</div>}
      </div>
      {onEdit&&<button className="mtp-press-light" onClick={onEdit} style={{background:"none",border:"none",padding:0,fontSize:12,color:T.teal,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",flexShrink:0}}>Bearbeiten ›</button>}
    </div>
  );
}
function Sheet({onClose,children,zIndex=9800}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex,background:"rgba(26,26,24,0.4)",display:"flex",alignItems:"flex-end"}}>
      <div className="mtp-sheet" onClick={e=>e.stopPropagation()} style={{width:"100%",background:T.bgSheet,borderRadius:`${T.r24}px ${T.r24}px 0 0`,padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",boxShadow:T.sheet,maxHeight:"82vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}
function TogglePill({icon,label,active,onToggle}){
  return(
    <button onClick={onToggle} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:T.r99,background:active?T.tealSoft:T.bgCard,border:`1px solid ${active?T.tealMid:T.border}`,fontSize:13,fontWeight:600,color:active?T.teal:T.ink,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",transition:"all .18s cubic-bezier(.22,1,.36,1)",boxShadow:active?T.glowTeal:T.card}}>
      <span style={{fontSize:14}}>{icon}</span>{label}
    </button>
  );
}
function TalentHeader({profile,onSettings}){
  const[imgLoaded,setImgLoaded]=useState(false);
  const[avLoaded,setAvLoaded]=useState(false);
  const cover=s(profile?.header_img,FB_COVER);
  const avatar=s(profile?.avatar_url,FB_AVT);
  return(
    <div style={{width:"100%",paddingTop:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`0 ${T.px}px 10px`}}>
        <div>
          <div style={{fontSize:23,fontWeight:800,color:T.ink,letterSpacing:"-0.03em",display:"flex",alignItems:"center",gap:8,lineHeight:1.2}}>Mein Talent-Profil <span style={{fontSize:17}}>✨</span></div>
          <div style={{fontSize:12,color:T.inkFaint,marginTop:2,fontWeight:400}}>Gestalte dein Talent-Profil so, wie es dich und dein Wirken zeigt.</div>
        </div>
        <button className="mtp-press-light" onClick={onSettings} style={{width:36,height:36,borderRadius:"50%",background:"rgba(26,26,24,0.06)",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer",touchAction:"manipulation"}}>⚙️</button>
      </div>
      <div style={{margin:`0 ${T.px}px`,borderRadius:T.r20,overflow:"hidden",height:170,position:"relative",background:"linear-gradient(135deg,#2C2018 0%,#5C4030 50%,#8B6E52 100%)"}}>
        <img src={cover} alt="" onLoad={()=>setImgLoaded(true)} onError={()=>setImgLoaded(true)} style={{width:"100%",height:"100%",objectFit:"cover",opacity:imgLoaded?0.68:0,transition:"opacity 1.1s ease"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(247,245,240,0) 28%,rgba(247,245,240,0.5) 100%)"}}/>
        <div style={{position:"absolute",bottom:-38,left:"50%",transform:"translateX(-50%)"}}>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",inset:-3,borderRadius:"50%",background:`conic-gradient(from 0deg,${T.teal},${T.coral},${T.teal})`,opacity:0.88}}/>
            <div style={{position:"relative",width:82,height:82,borderRadius:"50%",border:"3.5px solid white",boxShadow:"0 4px 20px rgba(0,0,0,0.16)",overflow:"hidden",background:T.bg}}>
              {!avLoaded&&<div className="mtp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
              <img src={avatar} alt="" onLoad={()=>setAvLoaded(true)} onError={()=>setAvLoaded(true)} style={{width:"100%",height:"100%",objectFit:"cover",opacity:avLoaded?1:0,transition:"opacity .5s ease"}}/>
            </div>
            <button className="mtp-press" style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:T.teal,border:"2px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",touchAction:"manipulation",boxShadow:"0 2px 8px rgba(14,196,184,0.3)"}}>📷</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function UeberMich({bio,onChange}){
  const[editing,setEditing]=useState(false);
  const[draft,setDraft]=useState(bio||"");
  const MAX=220;
  const handleSave=()=>{onChange(draft.trim());setEditing(false);};
  const displayBio=bio||"Ich male, um das Unsichtbare sichtbar zu machen.\nInspiration finde ich in der Natur, im Licht\nund in echten Begegnungen.";
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionRow title="Über mich" onEdit={()=>{setDraft(bio||"");setEditing(true);}}/>
      <div style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${editing?T.tealMid:T.border}`,padding:"14px 16px",boxShadow:editing?`0 0 0 3px ${T.tealSoft}`:T.card,transition:"all .2s ease"}}>
        {editing?(
          <>
            <textarea autoFocus value={draft} onChange={e=>setDraft(e.target.value.slice(0,MAX))} style={{width:"100%",minHeight:80,border:"none",outline:"none",background:"transparent",fontSize:14,color:T.ink,lineHeight:1.68,resize:"none",fontFamily:"inherit",fontStyle:"italic"}} placeholder="Wie bist du als kreativer Mensch?"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
              <span style={{fontSize:11,color:T.inkFaint}}>{draft.length} / {MAX}</span>
              <div style={{display:"flex",gap:8}}>
                <button className="mtp-press" onClick={()=>setEditing(false)} style={{padding:"6px 14px",borderRadius:T.r99,border:`1px solid ${T.border}`,background:"transparent",fontSize:12,fontWeight:600,color:T.inkSoft,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit"}}>Abbrechen</button>
                <button className="mtp-press" onClick={handleSave} style={{padding:"6px 16px",borderRadius:T.r99,border:"none",background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,fontSize:12,fontWeight:700,color:"white",cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",boxShadow:T.glowTeal}}>Speichern</button>
              </div>
            </div>
          </>
        ):(
          <>
            <p style={{fontSize:14,lineHeight:1.68,color:T.inkSoft,margin:0,fontFamily:"-apple-system,'Georgia',serif",fontStyle:"italic",whiteSpace:"pre-line"}}>{displayBio}</p>
            <div style={{textAlign:"right",marginTop:6,fontSize:11,color:T.inkFaint}}>{(bio||"").length} / {MAX}</div>
          </>
        )}
      </div>
    </div>
  );
}
function TalenteSection({talents,onChange}){
  const[showEdit,setShowEdit]=useState(false);
  const current=a(talents).length?a(talents):["Malen","Illustration","Workshops","Kunstberatung","Auftragskunst"];
  const toggle=(label)=>{if(current.includes(label))onChange(current.filter(x=>x!==label));else onChange([...current,label]);};
  const displayTags=ALL_TALENTS.filter(t=>current.includes(t.label));
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionRow title="Meine Talente & Angebote" onEdit={()=>setShowEdit(true)}/>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {displayTags.map((t,i)=>(
          <div key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:T.r99,background:T.bgCard,border:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.ink,boxShadow:T.card}}>
            <span style={{fontSize:14}}>{t.icon}</span>{t.label}
          </div>
        ))}
        <button className="mtp-press-light" onClick={()=>setShowEdit(true)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:T.r99,background:"transparent",border:`1px dashed ${T.borderMid}`,fontSize:13,fontWeight:600,color:T.inkSoft,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit"}}>
          <span>+</span> Weiteres hinzufügen
        </button>
      </div>
      {showEdit&&(
        <Sheet onClose={()=>setShowEdit(false)}>
          <div style={{fontSize:16,fontWeight:800,color:T.ink,marginBottom:4}}>Talente & Angebote</div>
          <div style={{fontSize:12,color:T.inkFaint,marginBottom:16}}>Was kannst und bietest du an?</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
            {ALL_TALENTS.map((t,i)=><TogglePill key={i} icon={t.icon} label={t.label} active={current.includes(t.label)} onToggle={()=>toggle(t.label)}/>)}
          </div>
          <button className="mtp-press" onClick={()=>setShowEdit(false)} style={{width:"100%",padding:"14px",borderRadius:T.r99,border:"none",background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",boxShadow:T.glowTeal}}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}
function WerkThumb({w,onRemove}){
  const[loaded,setLoaded]=useState(false);
  return(
    <div style={{position:"relative",width:100,height:100,flexShrink:0,borderRadius:T.r12,overflow:"hidden",background:"rgba(26,26,24,0.07)"}}>
      {!loaded&&<div className="mtp-skeleton" style={{position:"absolute",inset:0}}/>}
      <img src={w.img} alt="" onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:loaded?1:0,transition:"opacity .5s ease"}}/>
      <button className="mtp-press" onClick={()=>onRemove(w.id)} style={{position:"absolute",top:5,right:5,width:20,height:20,borderRadius:"50%",background:"rgba(26,26,24,0.65)",backdropFilter:"blur(6px)",border:"none",color:"white",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",touchAction:"manipulation"}}>×</button>
    </div>
  );
}
function WerkeSection({works,onChange}){
  const items=a(works).length?a(works):SEED_WORKS;
  const remove=(id)=>onChange(items.filter(w=>w.id!==id));
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionRow title="Meine Werke" onEdit={()=>{}}/>
      <div className="mtp-hscroll" style={{display:"flex",gap:8,paddingBottom:4}}>
        {items.map((w,i)=><WerkThumb key={w.id||i} w={w} onRemove={remove}/>)}
        <div style={{flexShrink:0,width:4}}/>
      </div>
      <Gap h={10}/>
      <button className="mtp-press-light" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 18px",borderRadius:T.r99,background:T.bgCard,border:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.inkSoft,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",boxShadow:T.card}}>
        <span style={{fontSize:15}}>+</span> Werk hinzufügen
      </button>
    </div>
  );
}
function ErlebnisCard({e,onRemove}){
  const[loaded,setLoaded]=useState(false);
  return(
    <div style={{flexShrink:0,width:130}}>
      <div style={{width:130,height:110,borderRadius:T.r12,overflow:"hidden",position:"relative",background:"rgba(26,26,24,0.07)",marginBottom:8}}>
        {!loaded&&<div className="mtp-skeleton" style={{position:"absolute",inset:0}}/>}
        <img src={e.img} alt={e.title} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:loaded?1:0,transition:"opacity .5s ease"}}/>
        <button className="mtp-press" onClick={()=>onRemove(e.id)} style={{position:"absolute",top:5,right:5,width:20,height:20,borderRadius:"50%",background:"rgba(26,26,24,0.65)",backdropFilter:"blur(6px)",border:"none",color:"white",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",touchAction:"manipulation"}}>×</button>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:T.ink,lineHeight:1.35,marginBottom:2}}>{e.title}</div>
      <div style={{fontSize:10.5,color:T.inkFaint}}>{e.type}</div>
      <div style={{fontSize:10.5,color:T.inkFaint}}>{e.date}</div>
    </div>
  );
}
function ErlebnisseSection({experiences,onChange}){
  const items=a(experiences).length?a(experiences):SEED_EXP;
  const remove=(id)=>onChange(items.filter(e=>e.id!==id));
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionRow title="Erlebnisse & Projekte" sub="Momente, die mein Wirken zeigen." onEdit={()=>{}}/>
      <div className="mtp-hscroll" style={{display:"flex",gap:10,paddingBottom:4}}>
        {items.map((e,i)=><ErlebnisCard key={e.id||i} e={e} onRemove={remove}/>)}
        <div style={{flexShrink:0,width:90,minHeight:110,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,borderRadius:T.r12,border:`1.5px dashed ${T.borderMid}`,cursor:"pointer",touchAction:"manipulation",padding:12}}>
          <span style={{fontSize:20,color:T.inkFaint}}>+</span>
          <span style={{fontSize:10,color:T.inkFaint,textAlign:"center",lineHeight:1.4}}>Erlebnis hinzufügen</span>
        </div>
      </div>
    </div>
  );
}
function TestiCard({t}){
  const[loaded,setLoaded]=useState(false);
  return(
    <div style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"16px",boxShadow:T.card,flexShrink:0,width:240}}>
      <div style={{fontSize:28,color:T.teal,lineHeight:1,marginBottom:8,opacity:0.45}}>"</div>
      <p style={{fontSize:13.5,lineHeight:1.65,color:T.inkSoft,margin:"0 0 14px",fontFamily:"-apple-system,'Georgia',serif",fontStyle:"italic"}}>{t.quote}</p>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",background:"rgba(26,26,24,0.08)",flexShrink:0}}>
          {!loaded&&<div className="mtp-skeleton" style={{width:"100%",height:"100%",borderRadius:"50%"}}/>}
          <img src={t.avatar} alt={t.author} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)} style={{width:"100%",height:"100%",objectFit:"cover",opacity:loaded?1:0,transition:"opacity .4s ease"}}/>
        </div>
        <span style={{fontSize:12,fontWeight:700,color:T.ink}}>— {t.author}</span>
      </div>
    </div>
  );
}
function KundenstimmenSection({testimonials}){
  const items=a(testimonials).length?a(testimonials):SEED_TESTI;
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionRow title="Kundenstimmen" onEdit={()=>{}}/>
      <div className="mtp-hscroll" style={{display:"flex",gap:10,paddingBottom:4}}>
        {items.map((t,i)=><TestiCard key={t.id||i} t={t}/>)}
        <div style={{flexShrink:0,width:120,borderRadius:T.r16,border:`1.5px dashed ${T.borderMid}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,cursor:"pointer",touchAction:"manipulation",gap:4}}>
          <span style={{fontSize:18,color:T.inkFaint}}>+</span>
          <span style={{fontSize:11,color:T.inkFaint,textAlign:"center",lineHeight:1.4}}>Weitere hinzufügen</span>
        </div>
      </div>
    </div>
  );
}
function VerfuegbarkeitStandort({location,onEditLocation}){
  const[editLoc,setEditLoc]=useState(false);
  const[locDraft,setLocDraft]=useState(location||"");
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <div style={{display:"flex",gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <SectionRow title="Verfügbarkeit" onEdit={()=>{}} small/>
          <div className="mtp-press-light" style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"12px 14px",boxShadow:T.card,cursor:"pointer",touchAction:"manipulation",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 0 2px rgba(34,197,94,0.2)"}}/>
                <span style={{fontSize:12,fontWeight:700,color:T.ink}}>Offen für neue Anfragen</span>
              </div>
              <div style={{fontSize:10.5,color:T.inkFaint}}>Antwortzeit: innerhalb von 24h</div>
            </div>
            <span style={{fontSize:14,color:T.inkFaint}}>›</span>
          </div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <SectionRow title="Standort" onEdit={()=>setEditLoc(true)} small/>
          <div className="mtp-press-light" onClick={()=>setEditLoc(true)} style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"12px 14px",boxShadow:T.card,cursor:"pointer",touchAction:"manipulation",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>📍</span>
              <span style={{fontSize:12,fontWeight:600,color:T.ink}}>{location||"Standort hinzufügen"}</span>
            </div>
            <span style={{fontSize:14,color:T.inkFaint}}>›</span>
          </div>
        </div>
      </div>
      {editLoc&&(
        <Sheet onClose={()=>setEditLoc(false)}>
          <div style={{fontSize:16,fontWeight:800,color:T.ink,marginBottom:16}}>📍 Standort</div>
          <input autoFocus value={locDraft} onChange={e=>setLocDraft(e.target.value)} placeholder="z.B. Freiburg, Deutschland"
            style={{width:"100%",padding:"13px 16px",borderRadius:T.r16,border:`1.5px solid ${T.tealMid}`,outline:"none",background:T.bg,fontSize:14,color:T.ink,fontFamily:"inherit",boxSizing:"border-box"}}/>
          <Gap h={14}/>
          <button className="mtp-press" onClick={()=>{onEditLocation(locDraft);setEditLoc(false);}} style={{width:"100%",padding:"14px",borderRadius:T.r99,border:"none",background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",boxShadow:T.glowTeal}}>Speichern</button>
        </Sheet>
      )}
    </div>
  );
}
function SichtbarkeitSection({visibility,onChange}){
  return(
    <div style={{padding:`0 ${T.px}px`}}>
      <SectionRow title="Sichtbarkeit" sub="Wähle, wer dein Profil sehen kann."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {VIS.map(opt=>{
          const active=(visibility||"connections")===opt.key;
          return(
            <button key={opt.key} className="mtp-press-light" onClick={()=>onChange(opt.key)} style={{padding:"14px 8px",borderRadius:T.r16,background:active?T.tealSoft:T.bgCard,border:`1.5px solid ${active?T.teal:T.border}`,boxShadow:active?T.glowTeal:T.card,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all .2s cubic-bezier(.22,1,.36,1)"}}>
              <span style={{fontSize:20}}>{opt.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:active?T.teal:T.ink}}>{opt.label}</span>
              <span style={{fontSize:10,color:T.inkFaint,lineHeight:1.4,textAlign:"center",fontWeight:400}}>{opt.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default function MyTalentProfile({onClose}){
  const[profile,setProfile]=useState(null);
  const[loading,setLoading]=useState(true);
  const[mounted,setMounted]=useState(false);
  const[bio,setBio]=useState("");
  const[talents,setTalents]=useState([]);
  const[works,setWorks]=useState([]);
  const[experiences,setExperiences]=useState([]);
  const[location,setLocation]=useState("");
  const[visibility,setVisibility]=useState("connections");
  const[saving,setSaving]=useState(false);
  const[saveOk,setSaveOk]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setMounted(true),30);return()=>clearTimeout(t);},[]);
  useEffect(()=>{
    (async()=>{
      try{
        const{data:{user}}=await supabase.auth.getUser();
        if(!user){setLoading(false);return;}
        const{data}=await supabase.from("profiles").select("id,username,display_name,avatar_url,header_img,bio,interests,location,visibility").eq("id",user.id).single();
        if(data){setProfile(data);setBio(s(data.bio));setTalents(Array.isArray(data.interests)?data.interests.filter(x=>typeof x==="string"):[]);setLocation(s(data.location));setVisibility(data.visibility||"connections");}
      }catch(e){console.warn("MyTalentProfile:",e);}
      setLoading(false);
    })();
  },[]);
  const saveTimer=useRef(null);
  const autoSave=useCallback(async(field,value)=>{
    if(!profile?.id)return;
    setSaving(true);
    try{await supabase.from("profiles").update({[field]:value,updated_at:new Date().toISOString()}).eq("id",profile.id);setSaveOk(true);setTimeout(()=>setSaveOk(false),2000);}
    catch(e){console.warn("AutoSave:",e);}
    setSaving(false);
  },[profile?.id]);
  const handleBio=(v)=>{setBio(v);clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>autoSave("bio",v),1200);};
  const handleTalents=(v)=>{setTalents(v);clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>autoSave("interests",v),800);};
  const handleVis=(v)=>{setVisibility(v);autoSave("visibility",v);};
  const handleLoc=(v)=>{setLocation(v);autoSave("location",v);};
  return(
    <div className="mtp-root" style={{position:"fixed",inset:0,zIndex:9500,display:"flex",flexDirection:"column",opacity:mounted?1:0,transform:mounted?"none":"translateY(14px)",transition:"opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)"}}>
      <style>{CSS}</style>
      {(saving||saveOk)&&(
        <div style={{position:"fixed",top:16,right:16,zIndex:9900,padding:"6px 14px",borderRadius:T.r99,background:saveOk?T.tealSoft:"rgba(26,26,24,0.07)",border:`1px solid ${saveOk?T.tealMid:T.border}`,fontSize:11.5,fontWeight:600,color:saveOk?T.teal:T.inkFaint,backdropFilter:"blur(10px)",transition:"all .2s ease"}}>
          {saveOk?"✓ Gespeichert":"Speichert…"}
        </div>
      )}
      <div className="mtp-scroll" style={{flex:1,overflowY:"auto",paddingBottom:"max(80px,calc(64px + env(safe-area-inset-bottom,0px)))"}}>
        <TalentHeader profile={profile} onSettings={()=>{}}/>
        <Gap h={54}/>
        <UeberMich bio={bio} onChange={handleBio}/>
        <Gap h={22}/><Divider/><Gap h={18}/>
        <TalenteSection talents={talents} onChange={handleTalents}/>
        <Gap h={22}/><Divider/><Gap h={18}/>
        <WerkeSection works={works} onChange={setWorks}/>
        <Gap h={22}/><Divider/><Gap h={18}/>
        <ErlebnisseSection experiences={experiences} onChange={setExperiences}/>
        <Gap h={22}/><Divider/><Gap h={18}/>
        <KundenstimmenSection testimonials={[]}/>
        <Gap h={22}/><Divider/><Gap h={18}/>
        <VerfuegbarkeitStandort location={location} onEditLocation={handleLoc}/>
        <Gap h={22}/><Divider/><Gap h={18}/>
        <SichtbarkeitSection visibility={visibility} onChange={handleVis}/>
        <Gap h={40}/>
      </div>
    </div>
  );
}
