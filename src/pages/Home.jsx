import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase }         from "../lib/supabaseClient";
import mockWirkerProfiles   from "../lib/mockData";
import ImpactPage           from "./ImpactPage";
import ProfilePage          from "./ProfilePage";
import WirkerProfilePage    from "../components/WirkerProfilePage";
import BookingFlow          from "../components/BookingFlow";
import CreateFlow           from "../components/CreateFlow";
import FavoritesPage        from "./FavoritesPage";

/* ── Brand ──────────────────────────────────── */
const T = {
  teal:      "#16D7C5",
  tealDeep:  "#11C5B7",
  tealPale:  "#E4F9F7",
  tealMist:  "rgba(22,215,197,0.10)",
  tealGlow:  "rgba(22,215,197,0.25)",
  coral:     "#FF8A6B",
  coralDeep: "#FF7B72",
  coralPale: "#FFF2EE",
  coralMist: "rgba(255,138,107,0.10)",
  cream:     "#F9F6F2",
  creamWarm: "#FFF9F4",
  card:      "#FFFFFF",
  ink:       "#18181B",
  ink2:      "#3F3F46",
  ink3:      "#52525B",
  muted:     "#71717A",
  muted2:    "#A1A1AA",
  border:    "#E4E4E7",
  borderWarm:"#EDE8E0",
  gold:      "#F59E0B",
  goldPale:  "#FFFBEB",
  green:     "#10B981",
};

/* ── Rich curated data ──────────────────────── */
const WIRKERS = [
  {
    id:"w1", name:"Sofia M.", fullName:"Sofia Mayer", talent:"Keramik-Künstlerin",
    location:"München", dist:"1,2 km", price:"ab 45 €/h", rec:34, score:4.9,
    img:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&q=85",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=85",
    bio:"Jedes Stück entsteht mit Bedacht, mit Liebe und mit den Händen.",
    badge:"Top Wirker", impact:"124 €",
  },
  {
    id:"w2", name:"Marcus B.", fullName:"Marcus Braun", talent:"Fotograf & Videograf",
    location:"Berlin", dist:"0,8 km", price:"ab 90 €/h", rec:47, score:4.8,
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=85",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=85",
    bio:"Ich halte Momente fest, die sonst verschwinden.",
    badge:"Beliebt", impact:"312 €",
  },
  {
    id:"w3", name:"Maria L.", fullName:"Maria Lopez", talent:"Yoga & Achtsamkeit",
    location:"Hamburg", dist:"1,2 km", price:"ab 70 €/h", rec:93, score:4.9,
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=85",
    bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=85",
    bio:"Ich bringe in jede Session echte Ruhe und innere Kraft.",
    badge:"Community ♥", impact:"201 €",
  },
  {
    id:"w4", name:"Tom H.", fullName:"Tom Hartmann", talent:"Leder-Handwerker",
    location:"München", dist:"2,1 km", price:"ab 55 €/h", rec:19, score:4.6,
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=85",
    bg:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=85",
    bio:"Handgenähtes Leder mit Seele — für ein Leben lang.",
    badge:"Neu", impact:"78 €",
  },
];

const WERKE = [
  { id:"we1", title:"Handgedrehte Keramik-Tasse", price:"38 €", likes:124,
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=85",
    creator:"Sofia M.", creatorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&q=80",
    h:290, shipping:"+ 4,50 € Versand" },
  { id:"we2", title:"Aquarell-Stimmungsbild (A3)", price:"120 €", likes:89,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85",
    creator:"Lena K.", creatorImg:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80",
    h:340, shipping:"+ 3,90 € Versand" },
  { id:"we3", title:"Leder-Rucksack (handgenäht)", price:"195 €", likes:203,
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85",
    creator:"Tom H.", creatorImg:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80",
    h:260, shipping:"Versandkostenfrei" },
  { id:"we4", title:"Töpfer-Workshop (2 Stunden)", price:"75 €", likes:112,
    img:"https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=85",
    creator:"Sofia M.", creatorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&q=80",
    h:310, shipping:"Vor Ort · Keine Versandkosten" },
];

const NEARBY = [
  { name:"Marcus B.", talent:"Fotograf & Videograf",
    img:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=700&q=80",
    avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    dist:"0,8 km", price:"90 €/h" },
  { name:"Maria L.", talent:"Yoga & Achtsamkeit",
    img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=80",
    avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    dist:"1,2 km", price:"70 €/h" },
  { name:"Lena K.", talent:"Aquarell-Künstlerin",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=80",
    avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    dist:"3,4 km", price:"60 €/h" },
];

const MATCH_HINTS = [
  "Fotograf für meine Hochzeit",
  "Gartenhilfe bis 300 €",
  "Yoga-Kurs in Hamburg",
  "Handgemachte Keramik",
  "Gitarrenunterricht für Anfänger",
  "Imagefilm für mein Unternehmen",
];

/* ═══════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════ */
function Av({ src, name, size=36, ring="" }) {
  const init = (name||"").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden",
      flexShrink:0, border:ring||`1.5px solid rgba(255,255,255,0.5)`,
      background:`linear-gradient(135deg,${T.tealPale},${T.coralPale})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:800, color:T.teal }}>
      {src
        ? <img src={src} alt={name}
            style={{ width:"100%",height:"100%",objectFit:"cover" }}
            onError={e=>e.target.style.display="none"} />
        : init}
    </div>
  );
}

function HeartBtn({ count=0 }) {
  const [liked,setLiked]=useState(false);
  const [n,setN]=useState(count);
  const [anim,setAnim]=useState(false);
  function tap(e) {
    e.stopPropagation();
    setAnim(true); setTimeout(()=>setAnim(false),440);
    setLiked(p=>{ setN(c=>p?c-1:c+1); return !p; });
  }
  return (
    <button onClick={tap} style={{ background:"none",border:"none",cursor:"pointer",
      display:"flex",alignItems:"center",gap:5,padding:0,
      WebkitTapHighlightColor:"transparent" }}>
      <span className={anim?"hui-heart":""} style={{ fontSize:18,lineHeight:1,
        filter:liked?"none":"grayscale(1) opacity(0.45)" }}>
        {liked?"❤️":"🤍"}
      </span>
      <span style={{ fontSize:12,fontWeight:700,
        color:liked?T.coral:T.muted }}>{n}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   HEADER
═══════════════════════════════════════════ */
function Header({ cart, notif, onNotif, onCart }) {
  return (
    <div className="hui-glass" style={{ position:"sticky",top:0,zIndex:60,
      borderBottom:`1px solid rgba(255,255,255,0.45)` }}>
      <div style={{ height:"env(safe-area-inset-top,0px)" }} />
      <div style={{ display:"flex",alignItems:"center",
        padding:"0 18px",height:56,gap:10 }}>

        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:9,flex:1 }}>
          <div style={{ width:34,height:34,borderRadius:11,flexShrink:0,overflow:"hidden",
            background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 2px 10px ${T.tealGlow}` }}>
            <span style={{ fontWeight:900,fontSize:15,color:"white",letterSpacing:-0.5 }}>Hj</span>
          </div>
          <div style={{ fontWeight:800,fontSize:16,color:T.ink,letterSpacing:-0.3 }}>
            <span style={{ color:T.teal }}>H</span>uman{" "}
            <span style={{ color:T.coral }}>U</span>nited{" "}
            <span style={{ color:T.teal }}>I</span>ntelligent
          </div>
        </div>

        <button onClick={onCart} style={{ position:"relative",width:38,height:38,
          borderRadius:"50%",background:T.cream,border:`1px solid ${T.borderWarm}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",fontSize:17,WebkitTapHighlightColor:"transparent" }}>
          🛒
          {cart>0&&<div style={{ position:"absolute",top:-3,right:-3,
            width:16,height:16,borderRadius:"50%",background:T.coral,color:"white",
            fontSize:8,fontWeight:900,display:"flex",alignItems:"center",
            justifyContent:"center",border:`2px solid ${T.cream}` }}>{cart}</div>}
        </button>

        <button onClick={onNotif} style={{ position:"relative",width:38,height:38,
          borderRadius:"50%",background:T.cream,border:`1px solid ${T.borderWarm}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",fontSize:17,WebkitTapHighlightColor:"transparent" }}>
          🔔
          {notif>0&&<div style={{ position:"absolute",top:-3,right:-3,
            width:16,height:16,borderRadius:"50%",background:T.coral,color:"white",
            fontSize:8,fontWeight:900,display:"flex",alignItems:"center",
            justifyContent:"center",border:`2px solid ${T.cream}` }}>{notif}</div>}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOTTOM NAV
═══════════════════════════════════════════ */
const NAV=[
  {key:"feed",    icon:"🏠",label:"Home"},
  {key:"impact",  icon:"🌱",label:"Impact"},
  null,
  {key:"discover",icon:"🔍",label:"Entdecken"},
  {key:"profile", icon:"👤",label:"Profil"},
];
// Note: favorites is accessible via discover tab

function BottomNav({ tab, onTab, isTalent, onCreate }) {
  return (
    <div className="hui-nav">
      <div className="hui-nav-pill">
        {NAV.map((item,i)=>{
          if(!item) return (
            <button key="hui" onClick={onCreate}
              className="hui-float"
              style={{ width:54,height:54,borderRadius:"50%",flexShrink:0,
                background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
                border:`3px solid ${T.cream}`,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}
              onTouchStart={e=>{e.currentTarget.style.transform="translateY(-14px) scale(0.9)";
                e.currentTarget.style.animation="none";}}
              onTouchEnd={e=>{e.currentTarget.style.transform="";
                e.currentTarget.style.animation="";}}>
              <span style={{ fontWeight:900,fontSize:18,color:"white",letterSpacing:-0.5 }}>Hj</span>
            </button>
          );
          const active=tab===item.key;
          return (
            <button key={item.key} onClick={()=>onTab(item.key)}
              style={{ flex:1,display:"flex",flexDirection:"column",
                alignItems:"center",gap:2,background:"none",border:"none",
                cursor:"pointer",padding:"6px 4px",position:"relative",
                WebkitTapHighlightColor:"transparent" }}
              onTouchStart={e=>e.currentTarget.style.transform="scale(0.88)"}
              onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              {active&&<div style={{ position:"absolute",top:0,left:"50%",
                transform:"translateX(-50%)",width:20,height:2.5,borderRadius:999,
                background:`linear-gradient(90deg,${T.teal},${T.coral})` }} />}
              <span style={{ fontSize:21,
                filter:active?"none":"grayscale(1) opacity(0.38)",
                transform:active?"translateY(-1px)":"none",transition:"all 0.2s" }}>
                {item.icon}
              </span>
              <span style={{ fontSize:9,fontWeight:active?800:500,
                color:active?T.teal:T.muted,transition:"color 0.2s" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO SEARCH — creative portal
═══════════════════════════════════════════ */
function HeroSearch({ onMatch }) {
  const [val,setVal]=useState("");
  const [hintIdx,setHintIdx]=useState(0);
  const [focused,setFocused]=useState(false);

  useEffect(()=>{
    if(focused||val) return;
    const t=setInterval(()=>setHintIdx(i=>(i+1)%MATCH_HINTS.length),3500);
    return()=>clearInterval(t);
  },[focused,val]);

  return (
    <div style={{ margin:"16px 18px 0",
      background:`linear-gradient(160deg,
        rgba(22,215,197,0.07) 0%,
        rgba(255,255,255,0.85) 45%,
        rgba(255,138,107,0.06) 100%)`,
      borderRadius:28,padding:"22px 20px 20px",
      border:`1px solid rgba(22,215,197,0.12)`,
      boxShadow:`0 4px 6px rgba(0,0,0,0.02),
                 0 12px 36px rgba(22,215,197,0.09),
                 0 12px 36px rgba(255,138,107,0.06)` }}>

      {/* Headline */}
      <div style={{ fontWeight:800,fontSize:20,color:T.ink,
        letterSpacing:-0.5,marginBottom:4 }}>
        Wen oder was suchst du heute?
      </div>
      <div style={{ fontSize:13,color:T.muted,marginBottom:16 }}>
        Echte Menschen · Handgemachtes · Erlebnisse
      </div>

      {/* Search input */}
      <div style={{ position:"relative",marginBottom:12 }}>
        <span style={{ position:"absolute",left:15,top:"50%",
          transform:"translateY(-50%)",fontSize:17,
          color:focused?T.teal:T.muted2,transition:"color 0.2s",
          pointerEvents:"none",zIndex:1 }}>🔍</span>
        <input className="hui-search"
          placeholder="Suche nach Talent, Werk, Name…"
          value={val}
          onChange={e=>setVal(e.target.value)}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
        />
        {val&&(
          <button onClick={()=>setVal("")}
            style={{ position:"absolute",right:14,top:"50%",
              transform:"translateY(-50%)",background:`${T.muted}22`,
              border:"none",borderRadius:"50%",width:22,height:22,
              cursor:"pointer",fontSize:10,color:T.muted,
              display:"flex",alignItems:"center",justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>✕</button>
        )}
      </div>

      {/* AI Match CTA */}
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <button onClick={()=>onMatch(val||MATCH_HINTS[hintIdx])}
          className="hui-btn hui-btn-teal"
          style={{ flex:1,padding:"13px 16px",fontSize:14,borderRadius:16 }}>
          ✨ HUI Match
        </button>
        <div style={{ fontSize:12,color:T.muted,fontStyle:"italic",flex:1,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
          {!val && !focused && (
            <span style={{ opacity:0.8 }}>„{MATCH_HINTS[hintIdx]}"</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MATCH OVERLAY
═══════════════════════════════════════════ */
function MatchOverlay({ initial="", onClose, onView }) {
  const [q,setQ]=useState(initial);
  const [busy,setBusy]=useState(false);
  const [results,setResults]=useState(null);
  const ta=useRef();
  useEffect(()=>{ setTimeout(()=>ta.current?.focus(),100); },[]);

  async function run() {
    if(!q.trim())return;
    setBusy(true);
    await new Promise(r=>setTimeout(r,1800));
    setResults(WIRKERS.slice(0,3));
    setBusy(false);
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:400,
      background:"rgba(24,24,27,0.54)",
      backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
      display:"flex",alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="hui-slide-up"
        style={{ width:"100%",background:T.cream,borderRadius:"32px 32px 0 0",
          maxHeight:"88vh",overflowY:"auto",
          paddingBottom:"max(28px,env(safe-area-inset-bottom))" }}>

        <div style={{ display:"flex",justifyContent:"center",padding:"14px 0 0" }}>
          <div style={{ width:40,height:4,borderRadius:999,background:T.border }} />
        </div>

        <div style={{ padding:"18px 22px 24px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:18 }}>
            <div style={{ width:46,height:46,borderRadius:16,flexShrink:0,
              background:`linear-gradient(135deg,${T.teal},${T.coral})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,boxShadow:`0 4px 16px ${T.tealGlow}` }}>✨</div>
            <div>
              <div style={{ fontWeight:900,fontSize:20,color:T.ink,letterSpacing:-0.5 }}>
                HUI Match
              </div>
              <div style={{ fontSize:12,color:T.muted }}>
                Beschreibe was du suchst — ganz natürlich
              </div>
            </div>
            <button onClick={onClose} style={{ marginLeft:"auto",width:32,height:32,
              borderRadius:"50%",background:T.border,border:"none",cursor:"pointer",
              fontSize:13,color:T.muted,display:"flex",alignItems:"center",
              justifyContent:"center",WebkitTapHighlightColor:"transparent" }}>✕</button>
          </div>

          <textarea ref={ta} value={q} onChange={e=>setQ(e.target.value)} rows={4}
            placeholder={"Ich suche jemanden für meinen Garten.\n3 Stunden. Budget 300 €.\nKennt sich mit Blumen aus."}
            style={{ width:"100%",boxSizing:"border-box",
              padding:"16px 18px",fontSize:15,color:T.ink,
              background:T.card,border:`1.5px solid ${T.borderWarm}`,
              borderRadius:20,outline:"none",resize:"none",
              fontFamily:"inherit",lineHeight:1.65,
              boxShadow:"0 2px 12px rgba(0,0,0,0.04)",marginBottom:12,
              transition:"border-color 0.2s,box-shadow 0.2s" }}
            onFocus={e=>{e.target.style.borderColor=T.teal;
              e.target.style.boxShadow=`0 0 0 4px ${T.tealMist}`;}}
            onBlur={e=>{e.target.style.borderColor=T.borderWarm;
              e.target.style.boxShadow="0 2px 12px rgba(0,0,0,0.04)";}}
          />

          <button onClick={run} disabled={!q.trim()||busy}
            className="hui-btn hui-btn-teal"
            style={{ width:"100%",padding:"15px",fontSize:15,borderRadius:18,
              opacity:q.trim()?1:0.5,marginBottom:results?20:0 }}>
            {busy
              ? <><span style={{ animation:"hui-breathe 1s infinite" }}>⚙️</span> Analysiere…</>
              : "✨ Passende Talente finden"}
          </button>

          {results&&(
            <div>
              <div style={{ fontWeight:800,fontSize:16,color:T.ink,marginBottom:14 }}>
                Perfekt passend für dich
              </div>
              {results.map((w,i)=>(
                <div key={w.id} onClick={()=>{onClose();onView(w.name);}}
                  className="hui-wirker-card hui-rise"
                  style={{ marginBottom:12,display:"flex",gap:14,padding:"14px 16px",
                    animationDelay:`${i*0.08}s` }}>
                  <Av src={w.img} name={w.name} size={52} ring={`2px solid ${T.tealPale}`} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800,fontSize:15,color:T.ink }}>{w.name}</div>
                    <div style={{ fontSize:12,color:T.teal,fontWeight:700,marginTop:1 }}>{w.talent}</div>
                    <div style={{ fontSize:11,color:T.muted,marginTop:2 }}>
                      📍 {w.dist} · {w.price}
                    </div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",
                    alignItems:"flex-end",gap:4 }}>
                    <div style={{ display:"flex",gap:3 }}>
                      <span style={{ color:T.gold,fontSize:12 }}>★</span>
                      <span style={{ fontSize:12,fontWeight:700,color:T.ink2 }}>{w.score}</span>
                    </div>
                    <div style={{ fontSize:10,color:T.teal,fontWeight:600 }}>
                      🌱 {w.impact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 1 — Ausgewählte Wirker
   Cinematic portrait cards — TEAL world
═══════════════════════════════════════════ */
function WirkerSection({ onView, onBook }) {
  return (
    <div>
      <div style={{ padding:"28px 20px 14px" }}>
        <div style={{ fontSize:11,fontWeight:700,letterSpacing:0.08*11,
          textTransform:"uppercase",color:T.teal,marginBottom:5 }}>
          Ausgewählte Wirker
        </div>
        <div style={{ fontWeight:800,fontSize:22,color:T.ink,letterSpacing:-0.5 }}>
          Menschen mit Talent
        </div>
        <div style={{ fontSize:13,color:T.muted,marginTop:3 }}>
          Handverlesen für deinen Moment
        </div>
      </div>

      <div className="scrollbar-hide"
        style={{ display:"flex",gap:16,overflowX:"auto",padding:"0 18px 4px" }}>
        {WIRKERS.map((w,i)=>(
          <WirkerCard key={w.id} w={w} idx={i}
            onView={onView} onBook={onBook} />
        ))}
      </div>
    </div>
  );
}

function WirkerCard({ w, idx, onView, onBook }) {
  return (
    <div className="hui-wirker-card hui-rise"
      style={{ flexShrink:0,width:240,
        animationDelay:`${idx*0.07}s` }}
      onClick={()=>onView&&onView(w.name)}>

      {/* Cinematic image — 4:5 */}
      <div style={{ position:"relative",paddingTop:"125%",overflow:"hidden",
        background:`linear-gradient(160deg,${T.tealPale},rgba(22,215,197,0.04))` }}>
        <img src={w.bg} alt={w.name}
          style={{ position:"absolute",inset:0,width:"100%",height:"100%",
            objectFit:"cover" }} />

        {/* Teal ambient overlay — WIRKER identity */}
        <div style={{ position:"absolute",inset:0,
          background:`linear-gradient(to bottom,
            rgba(22,215,197,0.08) 0%,
            transparent 35%,
            rgba(24,24,27,0.72) 100%)` }} />

        {/* Badge */}
        <div style={{ position:"absolute",top:12,left:12 }}>
          <span style={{ background:"rgba(22,215,197,0.92)",color:"white",
            borderRadius:999,padding:"4px 11px",fontSize:10,fontWeight:800,
            backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)" }}>
            {w.badge}
          </span>
        </div>

        {/* Top-right: save */}
        <div style={{ position:"absolute",top:10,right:10 }}>
          <button onClick={e=>{e.stopPropagation();}}
            className="hui-btn-ghost"
            style={{ width:34,height:34,borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:15,cursor:"pointer",border:"none",padding:0,
              WebkitTapHighlightColor:"transparent" }}>☆</button>
        </div>

        {/* Bottom content */}
        <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"18px 16px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",overflow:"hidden",
              border:"2px solid rgba(255,255,255,0.7)",
              boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
              <img src={w.img} alt={w.name}
                style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:15,color:"white",lineHeight:1.2 }}>
                {w.name}
              </div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.78)",fontWeight:600 }}>
                {w.talent}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div style={{ fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",
            lineHeight:1.5,marginBottom:12,
            textShadow:"0 1px 6px rgba(0,0,0,0.2)" }}>
            „{w.bio}"
          </div>

          {/* Meta */}
          <div style={{ display:"flex",justifyContent:"space-between",
            alignItems:"center",marginBottom:10 }}>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)" }}>
              📍 {w.dist} · {w.price}
            </div>
            <div style={{ display:"flex",gap:3,alignItems:"center" }}>
              <span style={{ color:T.gold,fontSize:12 }}>★</span>
              <span style={{ fontSize:12,fontWeight:700,color:"white" }}>{w.score}</span>
              <span style={{ fontSize:10,color:"rgba(255,255,255,0.65)" }}>
                ({w.rec} Empf.)
              </span>
            </div>
          </div>

          {/* CTA */}
          <button onClick={e=>{e.stopPropagation();onBook&&onBook({name:w.name});}}
            style={{ width:"100%",padding:"11px",
              background:`linear-gradient(135deg,${T.coral},${T.coralDeep})`,
              color:"white",border:"none",borderRadius:14,
              fontSize:13,fontWeight:800,cursor:"pointer",
              boxShadow:`0 3px 14px ${T.coralGlow||"rgba(255,138,107,0.35)"}`,
              WebkitTapHighlightColor:"transparent" }}>
            Termin buchen
          </button>
        </div>
      </div>

      {/* Impact strip */}
      <div style={{ padding:"10px 16px",background:T.tealMist,
        display:"flex",alignItems:"center",gap:6 }}>
        <span className="hui-breathe" style={{ fontSize:12 }}>🌱</span>
        <span style={{ fontSize:11,color:T.teal,fontWeight:700 }}>
          {w.impact} Impact bisher
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 2 — Werke mit Seele
   Pinterest masonry — CORAL world
═══════════════════════════════════════════ */
function WerkeSection({ onCart }) {
  return (
    <div>
      <div style={{ padding:"28px 20px 14px" }}>
        <div style={{ fontSize:11,fontWeight:700,letterSpacing:0.08*11,
          textTransform:"uppercase",color:T.coral,marginBottom:5 }}>
          Werke mit Seele
        </div>
        <div style={{ fontWeight:800,fontSize:22,color:T.ink,letterSpacing:-0.5 }}>
          Handgemacht mit Herz
        </div>
        <div style={{ fontSize:13,color:T.muted,marginTop:3 }}>
          Entdecke kreative Werke echter Talente
        </div>
      </div>

      {/* Masonry 2-col */}
      <div style={{ padding:"0 18px",
        columns:2,columnGap:12 }}>
        {WERKE.map((w,i)=>(
          <div key={w.id} style={{ breakInside:"avoid",marginBottom:12 }}>
            <WerkCard w={w} idx={i} onCart={onCart} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WerkCard({ w, idx, onCart }) {
  const [saved,setSaved]=useState(false);
  const [added,setAdded]=useState(false);
  return (
    <div className="hui-werk-card"
      style={{ animation:`hui-rise 0.55s ${idx*0.08}s cubic-bezier(0.22,1,0.36,1) both` }}>

      {/* Image */}
      <div style={{ height:w.h,overflow:"hidden",position:"relative" }}>
        <img src={w.img} alt={w.title}
          style={{ width:"100%",height:"100%",objectFit:"cover" }} />

        {/* Coral ambient — WERKE identity */}
        <div style={{ position:"absolute",inset:0,
          background:`linear-gradient(to bottom,
            rgba(255,138,107,0.06) 0%,
            transparent 40%,
            rgba(24,24,27,0.60) 100%)` }} />

        {/* Price badge — coral */}
        <div style={{ position:"absolute",top:10,left:10,
          background:`linear-gradient(135deg,${T.coral},${T.coralDeep})`,
          color:"white",borderRadius:999,padding:"4px 12px",
          fontSize:13,fontWeight:900,
          boxShadow:"0 2px 10px rgba(255,138,107,0.35)" }}>
          {w.price}
        </div>

        {/* Save */}
        <button onClick={e=>{e.stopPropagation();setSaved(p=>!p);}}
          style={{ position:"absolute",top:8,right:8,width:34,height:34,
            borderRadius:"50%",background:"rgba(255,255,255,0.88)",
            backdropFilter:"blur(8px)",border:"none",cursor:"pointer",
            fontSize:16,display:"flex",alignItems:"center",
            justifyContent:"center",WebkitTapHighlightColor:"transparent",
            transition:"transform 0.15s" }}
          onTouchStart={e=>e.currentTarget.style.transform="scale(0.88)"}
          onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
          {saved?"⭐":"☆"}
        </button>

        {/* Creator overlay */}
        <div style={{ position:"absolute",bottom:8,left:10,
          display:"flex",alignItems:"center",gap:6 }}>
          <Av src={w.creatorImg} name={w.creator} size={22}
            ring="1.5px solid rgba(255,255,255,0.7)" />
          <span style={{ fontSize:11,fontWeight:700,
            color:"rgba(255,255,255,0.9)" }}>{w.creator}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontWeight:700,fontSize:13,color:T.ink,
          lineHeight:1.3,marginBottom:4 }}>{w.title}</div>
        <div style={{ fontSize:11,color:T.muted,marginBottom:8 }}>{w.shipping}</div>
        <div style={{ display:"flex",alignItems:"center",
          justifyContent:"space-between" }}>
          <HeartBtn count={w.likes} />
          <button onClick={e=>{e.stopPropagation();setAdded(true);
            setTimeout(()=>setAdded(false),2000);if(onCart)onCart(w);}}
            style={{ width:36,height:36,borderRadius:"50%",
              background:added
                ? `linear-gradient(135deg,${T.green},#34D399)`
                : `linear-gradient(135deg,${T.coral},${T.coralDeep})`,
              border:"none",cursor:"pointer",fontSize:16,color:"white",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 2px 10px rgba(255,138,107,0.30)`,
              transition:"background 0.3s",
              WebkitTapHighlightColor:"transparent" }}>
            {added?"✓":"🛒"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 3 — Erlebnisse in der Nähe
═══════════════════════════════════════════ */
function NearbySection({ onView }) {
  return (
    <div>
      <div style={{ padding:"28px 20px 14px" }}>
        <div style={{ fontSize:11,fontWeight:700,letterSpacing:0.8,
          textTransform:"uppercase",color:T.muted,marginBottom:5 }}>
          In deiner Nähe
        </div>
        <div style={{ fontWeight:800,fontSize:22,color:T.ink,letterSpacing:-0.5 }}>
          Erlebnisse entdecken
        </div>
        <div style={{ fontSize:13,color:T.muted,marginTop:3 }}>
          Echte Menschen in deiner Stadt
        </div>
      </div>

      <div style={{ padding:"0 18px",display:"flex",flexDirection:"column",gap:12 }}>
        {NEARBY.map((n,i)=>(
          <div key={i} className="hui-card hui-card-tap"
            style={{ overflow:"hidden",height:180,position:"relative",
              animation:`hui-rise 0.55s ${i*0.08}s cubic-bezier(0.22,1,0.36,1) both` }}
            onClick={()=>onView&&onView(n.name)}>
            <img src={n.img} alt={n.name}
              style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            <div style={{ position:"absolute",inset:0,
              background:"linear-gradient(to right,rgba(24,24,27,0.72) 0%,transparent 60%)" }} />
            <div style={{ position:"absolute",top:0,bottom:0,left:0,
              padding:"18px 16px",display:"flex",flexDirection:"column",
              justifyContent:"center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                <Av src={n.avatar} name={n.name} size={34} />
                <div>
                  <div style={{ fontWeight:800,fontSize:15,color:"white" }}>{n.name}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.75)" }}>{n.talent}</div>
                </div>
              </div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.8)",marginBottom:10 }}>
                📍 {n.dist} entfernt · {n.price}
              </div>
              <button onClick={e=>{e.stopPropagation();onView&&onView(n.name);}}
                style={{ alignSelf:"flex-start",padding:"8px 16px",
                  background:"rgba(255,255,255,0.18)",
                  backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
                  border:"1px solid rgba(255,255,255,0.3)",
                  color:"white",borderRadius:12,fontSize:12,fontWeight:700,
                  cursor:"pointer",WebkitTapHighlightColor:"transparent" }}>
                Profil ansehen →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 4 — Impact editorial card
═══════════════════════════════════════════ */
function ImpactSection({ onImpact }) {
  return (
    <div>
      <div style={{ padding:"28px 20px 14px" }}>
        <div style={{ fontSize:11,fontWeight:700,letterSpacing:0.8,
          textTransform:"uppercase",color:T.green,marginBottom:5 }}>
          Impact bewegt gerade
        </div>
        <div style={{ fontWeight:800,fontSize:22,color:T.ink,letterSpacing:-0.5 }}>
          Menschen verändern die Welt
        </div>
      </div>

      <div style={{ margin:"0 18px" }}>
        <div className="hui-card hui-card-tap"
          style={{ overflow:"hidden" }}
          onClick={onImpact}>
          <div style={{ height:220,position:"relative",overflow:"hidden" }}>
            <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=85"
              alt="Impact"
              style={{ width:"100%",height:"100%",objectFit:"cover",
                filter:"brightness(0.70) saturate(1.1)" }} />
            <div style={{ position:"absolute",inset:0,
              background:`linear-gradient(160deg,
                rgba(22,215,197,0.65) 0%,
                rgba(255,138,107,0.45) 100%)` }} />
            <div style={{ position:"absolute",inset:0,
              display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",padding:"20px" }}>
              <span className="hui-breathe" style={{ fontSize:44,marginBottom:10 }}>🌱</span>
              <div style={{ fontWeight:900,fontSize:44,color:"white",
                letterSpacing:-2,lineHeight:1,
                textShadow:"0 2px 20px rgba(0,0,0,0.25)" }}>3.847 €</div>
              <div style={{ fontSize:14,color:"rgba(255,255,255,0.88)",
                marginTop:6,fontWeight:600 }}>
                gemeinsam bewegt · Mai 2026
              </div>
            </div>
          </div>
          <div style={{ padding:"16px 18px",
            background:`linear-gradient(135deg,${T.tealMist},${T.coralMist})`,
            display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontWeight:800,fontSize:15,color:T.ink }}>
                Jeden Monat wählen Wirker
              </div>
              <div style={{ fontSize:13,color:T.muted,marginTop:2 }}>
                welche Projekte gefördert werden.
              </div>
            </div>
            <button className="hui-btn hui-btn-teal"
              style={{ padding:"10px 16px",fontSize:13,borderRadius:14,flexShrink:0 }}>
              Impact →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOME FEED CONTENT
═══════════════════════════════════════════ */
function HomeFeedContent({ onView, onBook, onCart, onImpact, onMatch }) {
  return (
    <div style={{ paddingBottom:100 }}>
      <HeroSearch onMatch={onMatch} />
      <WirkerSection onView={onView} onBook={onBook} />
      <div style={{ height:1,background:T.borderWarm,margin:"4px 20px 4px" }} />
      <WerkeSection onCart={onCart} />
      <div style={{ height:1,background:T.borderWarm,margin:"4px 20px 4px" }} />
      <NearbySection onView={onView} />
      <div style={{ height:1,background:T.borderWarm,margin:"4px 20px 4px" }} />
      <ImpactSection onImpact={onImpact} />
      <div style={{ height:32 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   DISCOVER
═══════════════════════════════════════════ */
function DiscoverContent({ onView, onMatch }) {
  const cats=[
    {icon:"🔨",label:"Handwerk",color:T.teal},
    {icon:"🎨",label:"Kunst",color:T.coral},
    {icon:"📷",label:"Fotografie",color:"#8B5CF6"},
    {icon:"💬",label:"Coaching",color:T.gold},
    {icon:"🧘",label:"Gesundheit",color:T.green},
    {icon:"🎵",label:"Musik",color:"#EC4899"},
  ];
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ padding:"20px 18px 6px" }}>
        <div style={{ fontWeight:900,fontSize:22,color:T.ink,marginBottom:4 }}>
          Entdecke HUI
        </div>
        <div style={{ fontSize:14,color:T.muted }}>Finde das, was zu dir passt</div>
      </div>

      {/* Match CTA */}
      <div style={{ margin:"12px 18px",
        background:`linear-gradient(160deg,${T.tealMist},${T.coralMist})`,
        borderRadius:24,padding:"18px",border:`1px solid ${T.teal}18` }}>
        <div style={{ display:"flex",justifyContent:"space-between",
          alignItems:"flex-start",marginBottom:10 }}>
          <div style={{ fontWeight:900,fontSize:17,color:T.ink }}>✨ HUI Match</div>
          <span style={{ background:`linear-gradient(135deg,${T.coral},${T.coralDeep})`,
            color:"white",borderRadius:999,padding:"3px 10px",fontSize:10,fontWeight:800 }}>
            KI
          </span>
        </div>
        <div style={{ fontSize:13,color:T.muted,marginBottom:12,lineHeight:1.5 }}>
          Beschreibe was du suchst — wir finden perfekte Matches.
        </div>
        <button onClick={()=>onMatch("")}
          className="hui-btn hui-btn-teal"
          style={{ width:"100%",padding:"13px",fontSize:14,borderRadius:16 }}>
          ✨ Match starten
        </button>
      </div>

      {/* Kategorien */}
      <div style={{ padding:"16px 18px 6px",fontWeight:800,fontSize:17,color:T.ink }}>
        Kategorien
      </div>
      <div style={{ padding:"0 18px",display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
        {cats.map((k,i)=>(
          <button key={i} style={{ borderRadius:20,padding:"16px 10px",
            background:T.card,border:"none",cursor:"pointer",
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
            display:"flex",flexDirection:"column",alignItems:"center",gap:6,
            transition:"transform 0.15s",
            WebkitTapHighlightColor:"transparent" }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.95)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{ width:46,height:46,borderRadius:14,
              background:`${k.color}14`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22 }}>{k.icon}</div>
            <span style={{ fontSize:11,fontWeight:700,color:T.ink2 }}>{k.label}</span>
          </button>
        ))}
      </div>

      {/* Top Talente */}
      <div style={{ padding:"20px 18px 8px",fontWeight:800,fontSize:17,color:T.ink }}>
        Top Talente
      </div>
      <div className="hui-card" style={{ margin:"0 18px" }}>
        {WIRKERS.map((w,i)=>(
          <div key={w.id} onClick={()=>onView&&onView(w.name)}
            style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",
              cursor:"pointer",borderBottom:i<WIRKERS.length-1
                ?`1px solid ${T.border}`:"none",
              transition:"background 0.15s" }}
            onTouchStart={e=>e.currentTarget.style.background=T.cream}
            onTouchEnd={e=>e.currentTarget.style.background="transparent"}>
            <Av src={w.img} name={w.name} size={46} ring="none" />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800,fontSize:15,color:T.ink }}>{w.name}</div>
              <div style={{ fontSize:12,color:T.muted }}>{w.talent}</div>
            </div>
            <div style={{ display:"flex",gap:3,alignItems:"center" }}>
              <span style={{ color:T.gold,fontSize:12 }}>★</span>
              <span style={{ fontSize:12,fontWeight:700,color:T.ink2 }}>{w.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
export default function Home() {
  const [tab,           setTab]           = useState("feed");
  const [viewingWirker, setViewingWirker] = useState(null);
  const [showBooking,   setShowBooking]   = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [showMatch,     setShowMatch]     = useState(false);
  const [matchInit,     setMatchInit]     = useState("");
  const [cart,          setCart]          = useState([]);
  const [notif,         setNotif]         = useState(3);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [isTalent,      setIsTalent]      = useState(false);
  const [following,     setFollowing]     = useState(new Set());

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session)return;
      setCurrentUser(session.user);
      try {
        const {data}=await supabase.from("profiles")
          .select("talent_type").eq("user_id",session.user.id).single();
        if(data?.talent_type&&data.talent_type!=="entdecker")setIsTalent(true);
      } catch { setIsTalent(true); }
    });
  },[]);

  function openMatch(q="") { setMatchInit(q); setShowMatch(true); }

  if(showCreate) return <CreateFlow onClose={()=>setShowCreate(false)} />;

  if(viewingWirker) return (
    <div style={{ position:"fixed",inset:0,zIndex:200,overflowY:"auto",background:T.cream }}>
      <WirkerProfilePage
        wirkerName={viewingWirker}
        onBack={()=>setViewingWirker(null)}
        onAddToCart={item=>setCart(p=>[...p,item])}
        isOwnProfile={false}
        following={following}
        toggleFollow={name=>setFollowing(p=>{
          const n=new Set(p);n.has(name)?n.delete(name):n.add(name);return n;
        })}
        onGoToChats={()=>{setViewingWirker(null);setTab("chats");}}
      />
    </div>
  );

  if(showBooking) return (
    <div style={{ position:"fixed",inset:0,zIndex:200,overflowY:"auto",background:T.cream }}>
      <BookingFlow
        wirker={showBooking}
        onClose={()=>setShowBooking(null)}
        onAddToCart={item=>setCart(p=>[...p,item])}
        onSuccess={()=>{setShowBooking(null);setTab("chats");}}
      />
    </div>
  );

  return (
    <div className="hui-canvas"
      style={{ height:"100dvh",display:"flex",
        flexDirection:"column",overflow:"hidden" }}>

      <Header cart={cart.length} notif={notif}
        onNotif={()=>setNotif(0)} onCart={()=>{}} />

      <div style={{ flex:1,overflowY:"auto",overflowX:"hidden",
        WebkitOverflowScrolling:"touch" }}
        className="scrollbar-hide">

        {tab==="feed"     && <HomeFeedContent
          onView={setViewingWirker} onBook={setShowBooking}
          onCart={item=>setCart(p=>[...p,item])}
          onImpact={()=>setTab("impact")} onMatch={openMatch} />}
        {tab==="impact"   && <ImpactPage currentUser={currentUser} />}
        {tab==="discover" && <DiscoverContent
          onView={setViewingWirker} onMatch={openMatch} />}
        {tab==="favorites"&& <FavoritesPage />}
        {tab==="profile"  && <ProfilePage
          onTalentAnbieten={()=>setShowCreate(true)}
          onLogout={()=>{supabase.auth.signOut();window.location.href="/login";}} />}
      </div>

      <BottomNav tab={tab}
        onTab={t=>{
          if(t==="discover")setTab("discover");
          else setTab(t);
        }}
        isTalent={isTalent}
        onCreate={()=>isTalent?setShowCreate(true):openMatch("")}
      />

      {showMatch&&(
        <MatchOverlay initial={matchInit}
          onClose={()=>setShowMatch(false)}
          onView={name=>{setViewingWirker(name);setShowMatch(false);}} />
      )}
    </div>
  );
}
