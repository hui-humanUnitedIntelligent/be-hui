import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";
import ImpactPage    from "./ImpactPage";
import ProfilePage   from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow   from "../components/BookingFlow";
import CreateFlow    from "../components/CreateFlow";

/* ── Colors ─────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  gold:"#F59E0B", goldPale:"#FFFBEB",
  cream:"#F9F6F2", creamWarm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3D3D3D",
  muted:"#888888", muted2:"#BBBBBB",
  border:"#EFEFEF", borderWarm:"#E8E2D8",
  green:"#10B981",
};

/* ── Rich mock data ──────────────────────────── */
const WIRKERS = [
  { name:"Lea Sommer", talent:"Fotografin", city:"München",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=700&q=85",
    score:4.9, posts:128, connections:312,
    quote:"Ich fange Momente ein, die bleiben. Echt, natürlich und voller Gefühl.",
    bio:"Fotografie ist für mich mehr als ein Beruf – es ist meine Art, Geschichten zu erzählen. Ich liebe es, mit natürlichem Licht zu arbeiten und Menschen in ihrer Echtheit zu zeigen.",
    werke:[
      {img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80",title:"Berglandschaft"},
      {img:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&q=80",title:"Portrait"},
      {img:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&q=80",title:"Licht & Schatten"},
    ] },
  { name:"David Weber", talent:"Keramikkünstler", city:"Hamburg",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
    score:4.8, posts:64, connections:189,
    quote:"Ton ist mein Medium — Stille ist meine Sprache.",
    bio:"Handgemachte Keramik mit Seele. Jedes Stück entsteht im Dialog mit dem Material.",
    werke:[] },
  { name:"Nina B.", talent:"Yogalehrerin", city:"Stuttgart",
    img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=85",
    score:4.9, posts:201, connections:445,
    quote:"Yoga ist keine Übung — es ist eine Art zu leben.",
    bio:"Ich begleite Menschen auf ihrem Weg zu mehr Achtsamkeit und innerer Ruhe.",
    werke:[] },
  { name:"Marcus B.", talent:"Videograf", city:"Berlin",
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=700&q=85",
    score:4.7, posts:93, connections:267,
    quote:"Bewegte Bilder, die bewegen.",
    bio:"Dokumentarische Videografie für Menschen und Marken mit Haltung.",
    werke:[] },
];

const WERKE = [
  { title:"Handgefertigte Keramikschale", price:"€89",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=85",
    creator:"David Weber", h:220 },
  { title:"Zwischen Licht und Wellen", price:"€320",
    img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=85",
    creator:"Lea Sommer", h:270 },
  { title:"Portrait im goldenen Licht", price:"€180",
    img:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&q=85",
    creator:"Lea Sommer", h:240 },
  { title:"Töpfer-Workshop", price:"€75",
    img:"https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=85",
    creator:"David Weber", h:200 },
];

const NEARBY = [
  { title:"Live Musik Abend", sub:"Heute, 19:30 · München",
    img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=85" },
  { title:"Töpferkurs am See", sub:"Samstag, 14:00 · Starnberg",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=85" },
];

const CATS = [
  {icon:"🔨", label:"Handwerk",   bg:"#E6FAF8"},
  {icon:"🎨", label:"Kunst & Design", bg:"#FFF2EE"},
  {icon:"📷", label:"Fotografie", bg:"#EDE9FE"},
  {icon:"💬", label:"Coaching",   bg:"#FFFBEB"},
];

const MATCH_HINTS = [
  "Fotograf für Hochzeit",
  "Gartenhilfe bis 300 €",
  "Yoga in München",
  "Handgemachte Keramik",
  "Gitarrenunterricht",
];

/* ═══════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════ */
function Av({ src, name, size=36, ring="" }) {
  const init = (name||"").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden",
      flexShrink:0,
      border: ring || `1.5px solid ${C.borderWarm}`,
      background:`linear-gradient(135deg,${C.tealPale},${C.coralPale})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:800, color:C.teal }}>
      {src
        ? <img src={src} alt={name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e=>e.target.style.display="none"} />
        : init}
    </div>
  );
}

function HeartBtn({ count=0, white=false }) {
  const [liked,setLiked]=useState(false);
  const [n,setN]=useState(count);
  const [anim,setAnim]=useState(false);
  function tap(e) {
    e.stopPropagation();
    setAnim(true); setTimeout(()=>setAnim(false),420);
    setLiked(p=>{ setN(c=>p?c-1:c+1); return !p; });
  }
  return (
    <button onClick={tap} style={{ background:"none", border:"none",
      cursor:"pointer", display:"flex", alignItems:"center", gap:4,
      padding:0, WebkitTapHighlightColor:"transparent" }}>
      <span className={anim?"heart-pop":""} style={{ fontSize:18, lineHeight:1,
        filter:liked?"none":"grayscale(1) opacity(0.5)" }}>
        {liked?"❤️":"🤍"}
      </span>
      {count>0 && <span style={{ fontSize:12, fontWeight:700,
        color:liked?C.coral:white?"rgba(255,255,255,0.8)":C.muted }}>{n}</span>}
    </button>
  );
}

/* ═══════════════════════════════════════════
   HUI LOGO SVG
═══════════════════════════════════════════ */
function HuiLogo({ size=40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E8D8"/>
          <stop offset="100%" stopColor="#FF8A6B"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#logo-g)"/>
      <rect x="2" y="2" width="60" height="28" rx="18" fill="white" fillOpacity="0.15"/>
      <text x="10" y="44" fontSize="30" fontWeight="900" fill="white"
        fontFamily="-apple-system,system-ui,sans-serif" letterSpacing="-2">Hj</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   WERKEKORB SVG
═══════════════════════════════════════════ */
function WerkekorbbBtn({ count=0, size=34, onClick }) {
  const filled = count > 0;
  return (
    <button onClick={onClick} style={{ background:"none", border:"none",
      cursor:"pointer", padding:4, lineHeight:0, position:"relative",
      WebkitTapHighlightColor:"transparent" }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="bk-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A87C"/>
            <stop offset="100%" stopColor="#B5692E"/>
          </linearGradient>
          <linearGradient id="bk-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16D7C5"/>
            <stop offset="100%" stopColor="#11C5B7"/>
          </linearGradient>
        </defs>
        {/* Handle */}
        <path d="M22 28 Q22 10 32 10 Q42 10 42 28"
          fill="none" stroke="#C8784A" strokeWidth="4" strokeLinecap="round"/>
        <path d="M24 27 Q24 13 32 13 Q40 13 40 27"
          fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round"/>
        {/* Body */}
        <path d="M11 31 Q11 53 32 53 Q53 53 53 31 Z" fill="url(#bk-body)"/>
        {/* Weave horizontal */}
        <path d="M12 37 Q32 35 52 37" fill="none" stroke="#9A5220" strokeWidth="1.5" strokeOpacity="0.45"/>
        <path d="M11 43 Q32 41 53 43" fill="none" stroke="#9A5220" strokeWidth="1.5" strokeOpacity="0.45"/>
        <path d="M12 49 Q32 47 52 49" fill="none" stroke="#9A5220" strokeWidth="1.5" strokeOpacity="0.45"/>
        {/* Weave vertical */}
        {[19,25,31,37,43].map((x,i)=>(
          <path key={i} d={`M${x} 31 Q${x-1} 42 ${x} 52`}
            fill="none" stroke="#7A3E14" strokeWidth="0.9" strokeOpacity="0.3"/>
        ))}
        {/* Rim teal */}
        <rect x="10" y="29" width="44" height="6" rx="3" fill="url(#bk-rim)"/>
        <rect x="10" y="29" width="44" height="3" rx="2" fill="white" fillOpacity="0.22"/>
        {/* Items if filled */}
        {filled && <>
          <circle cx="23" cy="27" r="5.5" fill="#FF8A6B" opacity="0.92"/>
          <circle cx="32" cy="25" r="6" fill="#16D7C5" opacity="0.92"/>
          <circle cx="41" cy="27" r="5" fill="#F59E0B" opacity="0.92"/>
          <circle cx="21" cy="25" r="1.8" fill="white" opacity="0.4"/>
          <circle cx="30" cy="23" r="2.2" fill="white" opacity="0.4"/>
        </>}
        {/* HUI mark */}
        <circle cx="32" cy="43" r="5.5" fill="white" opacity="0.2"/>
      </svg>
      {count>0 && (
        <div style={{ position:"absolute", top:-2, right:-2,
          minWidth:17, height:17, borderRadius:999,
          background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
          color:"white", fontSize:8, fontWeight:900,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0 3px", border:"2px solid white",
          boxShadow:"0 2px 6px rgba(255,138,107,0.4)" }}>
          {count>9?"9+":count}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════
   HEADER
═══════════════════════════════════════════ */
function Header({ cart, notif, onNotif, onCart, userName }) {
  return (
    <div className="hui-header" style={{ position:"sticky", top:0, zIndex:60 }}>
      <div style={{ height:"env(safe-area-inset-top,0px)" }} />
      <div style={{ display:"flex", alignItems:"center",
        padding:"8px 18px 8px", gap:10 }}>
        <div style={{ flex:1 }}>
          {userName ? (
            <div style={{ fontWeight:800, fontSize:18, color:C.ink, letterSpacing:-0.4 }}>
              Guten Morgen, {userName.split(" ")[0]}
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <HuiLogo size={32} />
              <div style={{ fontWeight:800, fontSize:15, color:C.ink, letterSpacing:-0.3 }}>
                <span style={{ color:C.teal }}>H</span>uman{" "}
                <span style={{ color:C.coral }}>U</span>nited{" "}
                <span style={{ color:C.teal }}>I</span>ntelligent
              </div>
            </div>
          )}
        </div>
        {userName && <Av name={userName} size={34} ring={`2px solid ${C.teal}`} />}
        {!userName && <>
          <WerkekorbbBtn count={cart} size={32} onClick={onCart} />
          <button onClick={onNotif}
            style={{ position:"relative", background:"none", border:"none",
              cursor:"pointer", padding:4, lineHeight:0,
              WebkitTapHighlightColor:"transparent" }}>
            <div style={{ width:32, height:32, borderRadius:"50%",
              background:C.cream, border:`1px solid ${C.borderWarm}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16 }}>🔔</div>
            {notif>0 && <div style={{ position:"absolute", top:1, right:1,
              width:14, height:14, borderRadius:"50%",
              background:C.coral, color:"white", fontSize:7, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:"2px solid white" }}>{notif}</div>}
          </button>
        </>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOTTOM NAV — genau wie Bild: 4 Tabs + Center
═══════════════════════════════════════════ */
const NAV = [
  {key:"feed",     label:"Home"},
  {key:"impact",   label:"Impact"},
  null,
  {key:"discover", label:"Entdecken"},
  {key:"profile",  label:"Profil"},
];

function NavIcon({ tabKey, active }) {
  const s = active ? C.teal : C.muted2;
  const style = { width:22, height:22 };
  if (tabKey==="feed") return (
    <svg {...style} viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 4L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z"
        fill={active?C.teal:"none"} stroke={s} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
  if (tabKey==="impact") return (
    <svg {...style} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={s} strokeWidth="1.8"/>
      <path d="M15 8 Q20 10 17 15 Q14 11 15 8Z" fill={active?C.teal:s} opacity={active?1:0.7}/>
      <path d="M17 15 Q16 18 12 19" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17" cy="7" r="2" fill={C.gold}/>
    </svg>
  );
  if (tabKey==="discover") return (
    <svg {...style} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={s} strokeWidth="1.8"/>
      <path d="M16 8L13.5 13.5L8 16L10.5 10.5L16 8Z"
        fill={active?C.teal:"none"} stroke={s} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill={s}/>
    </svg>
  );
  if (tabKey==="profile") return (
    <svg {...style} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill={active?C.teal:"none"} stroke={s} strokeWidth="1.8"/>
      <path d="M4 20Q4 15 12 15Q20 15 20 20" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

function BottomNav({ tab, onTab, onCreate }) {
  return (
    <div className="hui-nav">
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-around", padding:"6px 4px 4px" }}>
        {NAV.map((item,i)=>{
          if(!item) return (
            <button key="center" onClick={onCreate}
              style={{ width:52, height:52, borderRadius:15, flexShrink:0,
                background:"none", border:"none", padding:0, lineHeight:0,
                cursor:"pointer", transform:"translateY(-12px)",
                filter:"drop-shadow(0 6px 20px rgba(22,215,197,0.45))",
                WebkitTapHighlightColor:"transparent" }}
              onTouchStart={e=>{ e.currentTarget.style.transform="translateY(-12px) scale(0.9)"; }}
              onTouchEnd={e=>{ e.currentTarget.style.transform="translateY(-12px) scale(1)"; }}>
              <HuiLogo size={52} />
            </button>
          );
          const active = tab===item.key;
          return (
            <button key={item.key} onClick={()=>onTab(item.key)}
              style={{ display:"flex", flexDirection:"column",
                alignItems:"center", gap:3, background:"none",
                border:"none", cursor:"pointer", padding:"4px 10px",
                minWidth:50, WebkitTapHighlightColor:"transparent" }}
              onTouchStart={e=>e.currentTarget.style.transform="scale(0.88)"}
              onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              {active && (
                <div style={{ position:"absolute", top:0, left:"50%",
                  transform:"translateX(-50%)",
                  width:16, height:2.5, borderRadius:999,
                  background:C.teal }}/>
              )}
              <NavIcon tabKey={item.key} active={active} />
              <span style={{ fontSize:9, fontWeight:active?700:400,
                color:active?C.teal:C.muted2, transition:"color 0.2s" }}>
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
   HUI MATCH BUTTON — golden pill
═══════════════════════════════════════════ */
function HuiMatchPill({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ width:"100%", padding:"13px 20px",
        background:`linear-gradient(135deg, ${C.gold}, #E8A000)`,
        border:"none", borderRadius:14, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:8, fontFamily:"inherit",
        boxShadow:"0 3px 14px rgba(245,158,11,0.35)",
        WebkitTapHighlightColor:"transparent",
        transition:"transform 0.14s, opacity 0.14s" }}
      onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"}
      onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
      <span style={{ fontSize:16 }}>✨</span>
      <span style={{ fontSize:15, fontWeight:800, color:"white" }}>HUI Match</span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   MATCH OVERLAY
═══════════════════════════════════════════ */
function MatchOverlay({ onClose, onView }) {
  const [q,setQ]=useState("");
  const [busy,setBusy]=useState(false);
  const [results,setResults]=useState(null);
  const [hintIdx,setHintIdx]=useState(0);

  useEffect(()=>{
    const t=setInterval(()=>setHintIdx(i=>(i+1)%MATCH_HINTS.length),3200);
    return()=>clearInterval(t);
  },[]);

  async function run() {
    if(!q.trim())return;
    setBusy(true);
    await new Promise(r=>setTimeout(r,1600));
    setResults(WIRKERS.slice(0,3));
    setBusy(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(26,26,26,0.50)",
      backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="slide-up"
        style={{ width:"100%", background:C.cream,
          borderRadius:"28px 28px 0 0", maxHeight:"88vh", overflowY:"auto",
          paddingBottom:"max(28px,env(safe-area-inset-bottom))" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 0" }}>
          <div style={{ width:40, height:4, borderRadius:999, background:C.borderWarm }}/>
        </div>
        <div style={{ padding:"18px 22px 24px" }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:46, height:46, borderRadius:15, flexShrink:0,
              background:`linear-gradient(135deg,${C.gold},#E8A000)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, boxShadow:"0 4px 16px rgba(245,158,11,0.35)" }}>✨</div>
            <div>
              <div style={{ fontWeight:900, fontSize:20, color:C.ink, letterSpacing:-0.5 }}>
                HUI Match
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
                Beschreibe was du suchst — ganz natürlich
              </div>
            </div>
            <button onClick={onClose}
              style={{ marginLeft:"auto", width:30, height:30, borderRadius:"50%",
                background:C.border, border:"none", cursor:"pointer",
                fontSize:13, color:C.muted, display:"flex",
                alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>✕</button>
          </div>

          {/* Hint */}
          <div style={{ fontSize:13, color:C.muted, marginBottom:10, fontStyle:"italic" }}>
            z. B. „{MATCH_HINTS[hintIdx]}"
          </div>

          <textarea value={q} onChange={e=>setQ(e.target.value)} rows={3}
            placeholder="Beschreibe wen oder was du suchst…"
            style={{ width:"100%", boxSizing:"border-box",
              padding:"14px 16px", fontSize:14, color:C.ink,
              background:C.card, border:`1.5px solid ${C.borderWarm}`,
              borderRadius:18, outline:"none", resize:"none",
              fontFamily:"inherit", lineHeight:1.6, marginBottom:12,
              transition:"border-color 0.2s" }}
            onFocus={e=>e.target.style.borderColor=C.teal}
            onBlur={e=>e.target.style.borderColor=C.borderWarm}
          />

          <button onClick={run} disabled={!q.trim()||busy}
            className="btn-teal"
            style={{ width:"100%", padding:"14px", fontSize:15, borderRadius:16,
              opacity:q.trim()?1:0.5 }}>
            {busy?"Suche läuft…":"✨ Perfekte Matches finden"}
          </button>

          {results && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:14 }}>
                Passend für dich
              </div>
              {results.map((w,i)=>(
                <div key={i} onClick={()=>{onClose();onView(w.name);}}
                  className="hui-card fade-up"
                  style={{ marginBottom:10, padding:"14px 16px",
                    display:"flex", gap:12, alignItems:"center",
                    cursor:"pointer",
                    animationDelay:`${i*0.07}s` }}>
                  <Av src={w.img} name={w.name} size={50}
                    ring={`2px solid ${C.teal}40`}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>{w.name}</div>
                    <div style={{ fontSize:12, color:C.teal, fontWeight:700 }}>{w.talent}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>📍 {w.city}</div>
                  </div>
                  <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                    <span style={{ color:C.gold, fontSize:12 }}>★</span>
                    <span style={{ fontSize:12, fontWeight:700, color:C.ink2 }}>{w.score}</span>
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
   WIRKER PROFILE SHEET (wie Bild: modal over feed)
═══════════════════════════════════════════ */
function WirkerSheet({ w, onClose, onBook, onChat }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(26,26,26,0.45)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="slide-up"
        style={{ width:"100%", background:C.card,
          borderRadius:"28px 28px 0 0", maxHeight:"90vh", overflowY:"auto",
          paddingBottom:"max(24px,env(safe-area-inset-bottom))" }}>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
          <div style={{ width:40, height:4, borderRadius:999, background:C.border }}/>
        </div>

        {/* Hero image */}
        <div style={{ height:220, position:"relative", overflow:"hidden" }}>
          <img src={w.bg} alt={w.name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to bottom, transparent 40%, rgba(26,26,26,0.65) 100%)"}}/>
          <button onClick={onClose}
            style={{ position:"absolute", top:14, left:14,
              width:34, height:34, borderRadius:"50%",
              background:"rgba(255,255,255,0.22)",
              backdropFilter:"blur(8px)", border:"none",
              cursor:"pointer", fontSize:16, color:"white",
              display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>←</button>
          <button style={{ position:"absolute", top:14, right:14,
            width:34, height:34, borderRadius:"50%",
            background:"rgba(255,255,255,0.22)",
            backdropFilter:"blur(8px)", border:"none",
            cursor:"pointer", fontSize:16, color:"white",
            display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>···</button>
          {/* Heart overlay */}
          <div style={{ position:"absolute", top:14, right:56 }}>
            <HeartBtn white />
          </div>
        </div>

        <div style={{ padding:"0 22px 24px" }}>
          {/* Avatar + Name */}
          <div style={{ marginTop:-28, marginBottom:14 }}>
            <div style={{ width:56, height:56, borderRadius:"50%",
              overflow:"hidden", border:`3px solid white`,
              boxShadow:"0 4px 16px rgba(0,0,0,0.12)" }}>
              <img src={w.img} alt={w.name}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          </div>

          <div style={{ fontWeight:900, fontSize:22, color:C.ink,
            letterSpacing:-0.5, marginBottom:2 }}>
            {w.name}
            <span style={{ color:C.teal, fontSize:16, marginLeft:6 }}>✓</span>
          </div>
          <div style={{ fontSize:13, color:C.teal, fontWeight:700 }}>{w.talent}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>📍 {w.city}</div>

          {/* Stats */}
          <div style={{ display:"flex", gap:24, marginTop:16, marginBottom:16 }}>
            {[
              {val:w.posts, label:"Posts"},
              {val:w.score, label:"Bewertung", gold:true},
              {val:w.connections, label:"Verbindungen"},
            ].map((s,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontWeight:900, fontSize:18, color:s.gold?C.gold:C.ink }}>
                  {s.val}
                </div>
                <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div style={{ fontSize:15, color:C.ink2, fontStyle:"italic",
            lineHeight:1.7, marginBottom:14,
            padding:"14px 16px", background:C.cream,
            borderRadius:16, borderLeft:`3px solid ${C.teal}` }}>
            „{w.quote}"
          </div>

          {/* Bio */}
          <div style={{ fontWeight:700, fontSize:14, color:C.ink, marginBottom:6 }}>Über mich</div>
          <div style={{ fontSize:14, color:C.ink2, lineHeight:1.7, marginBottom:18 }}>
            {w.bio}
          </div>

          {/* Werke grid */}
          {w.werke && w.werke.length > 0 && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>Meine Arbeiten</div>
                <button style={{ background:"none", border:"none", cursor:"pointer",
                  fontSize:12, fontWeight:600, color:C.teal }}>Alle ansehen →</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                gap:6, marginBottom:20 }}>
                {w.werke.map((wk,i)=>(
                  <div key={i} style={{ borderRadius:12, overflow:"hidden",
                    aspectRatio:"1", background:C.cream }}>
                    <img src={wk.img} alt={wk.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action buttons */}
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={()=>onChat&&onChat(w)}
              className="btn-ghost"
              style={{ flex:1, padding:"14px", fontSize:14, borderRadius:14 }}>
              Nachricht
            </button>
            <button onClick={()=>onBook&&onBook(w)}
              className="btn-coral"
              style={{ flex:1, padding:"14px", fontSize:14, borderRadius:14 }}>
              Anfragen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   WERKEKORB PAGE
═══════════════════════════════════════════ */
function WerkekorbbPage({ cart, onClose }) {
  const isEmpty = cart.length === 0;
  const isFull  = cart.length >= 3;
  const state   = isEmpty ? "leer" : isFull ? "gefüllt" : "mitWerken";

  const stateInfo = {
    leer:     { title:"Leer", sub:"Dein Korb ist noch leer." },
    mitWerken:{ title:"Mit Werken", sub:`Du hast ${cart.length} Werk${cart.length>1?"e":""} in deinem Korb.` },
    gefüllt:  { title:"Gefüllt", sub:"Dein Korb ist bereit." },
  }[state];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(26,26,26,0.45)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="slide-up"
        style={{ width:"100%", background:C.creamWarm,
          borderRadius:"28px 28px 0 0", maxHeight:"88vh", overflowY:"auto",
          paddingBottom:"max(24px,env(safe-area-inset-bottom))" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
          <div style={{ width:40, height:4, borderRadius:999, background:C.borderWarm }}/>
        </div>
        <div style={{ padding:"16px 22px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:24 }}>
            <div style={{ fontWeight:900, fontSize:22, color:C.ink }}>Werkekorb</div>
            <button onClick={onClose} style={{ background:"none", border:"none",
              cursor:"pointer", fontSize:13, color:C.muted,
              WebkitTapHighlightColor:"transparent" }}>✕</button>
          </div>

          {/* Large basket illustration */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
            <WerkekorbbBtn count={cart.length} size={140} onClick={()=>{}}/>
          </div>

          <div style={{ fontWeight:800, fontSize:18, color:C.ink, marginBottom:4 }}>
            Deine Sammlung bedeutungsvoller Werke.
          </div>
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.65, marginBottom:24 }}>
            Hier findest du alles, was dich inspiriert und was du erleben oder buchen möchtest.
          </div>

          {/* States */}
          {[
            {key:"leer",     icon:"🧺", title:"Leer",      sub:"Dein Korb ist noch leer."},
            {key:"mitWerken",icon:null,  title:"Mit Werken",sub:`${cart.length} Werk${cart.length!==1?"e":""} in deinem Korb.`},
            {key:"gefüllt",  icon:null,  title:"Gefüllt",   sub:"Dein Korb ist bereit.", badge:cart.length},
          ].map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center",
              gap:14, padding:"14px 16px", marginBottom:10,
              background:state===s.key?`${C.teal}10`:C.card,
              borderRadius:18, border:`1.5px solid ${state===s.key?C.teal:C.border}` }}>
              <div style={{ flexShrink:0 }}>
                <WerkekorbbBtn count={i===0?0:i===1?1:3} size={48} onClick={()=>{}}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink,
                  display:"flex", alignItems:"center", gap:6 }}>
                  {s.title}
                  {s.badge && <span style={{ background:C.coral, color:"white",
                    borderRadius:999, fontSize:10, fontWeight:900,
                    padding:"1px 7px" }}>{s.badge}</span>}
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ENTDECKEN PAGE
═══════════════════════════════════════════ */
function DiscoverPage({ onView, onMatch }) {
  return (
    <div style={{ paddingBottom:90 }}>
      {/* Headline */}
      <div style={{ padding:"20px 18px 12px" }}>
        <div style={{ fontWeight:900, fontSize:26, color:C.ink,
          letterSpacing:-0.8 }}>Entdecken</div>
      </div>

      {/* Search */}
      <div style={{ padding:"0 18px 14px", position:"relative" }}>
        <span style={{ position:"absolute", left:30, top:"50%",
          transform:"translateY(-50%)", fontSize:15,
          color:C.muted2, pointerEvents:"none" }}>🔍</span>
        <input className="hui-search"
          placeholder="Suche nach Menschen, Werken, Erlebnissen und mehr"
          readOnly onFocus={onMatch} />
      </div>

      {/* Hero nearby card */}
      <div style={{ margin:"0 18px 18px", borderRadius:22, overflow:"hidden",
        height:180, position:"relative", cursor:"pointer",
        boxShadow:"0 4px 24px rgba(0,0,0,0.12)" }}>
        <img src={NEARBY[0].img} alt="Erlebnisse"
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.75) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to right, rgba(26,26,26,0.7) 0%, transparent 65%)" }}/>
        <div style={{ position:"absolute", left:18, bottom:18 }}>
          <div style={{ fontWeight:900, fontSize:22, color:"white",
            lineHeight:1.2, marginBottom:10 }}>
            Erlebnisse<br/>in deiner Nähe
          </div>
          <button className="btn-teal"
            style={{ padding:"9px 18px", fontSize:13, borderRadius:12 }}>
            Entdecken
          </button>
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding:"0 18px 8px",
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {CATS.map((k,i)=>(
          <div key={i} style={{ display:"flex", flexDirection:"column",
            alignItems:"center", gap:6, padding:"12px 4px",
            background:C.card, borderRadius:18, cursor:"pointer",
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            transition:"transform 0.15s" }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.95)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{ width:40, height:40, borderRadius:12,
              background:k.bg,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:20 }}>{k.icon}</div>
            <span style={{ fontSize:10, fontWeight:600, color:C.ink2,
              textAlign:"center" }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* Für dich empfohlen */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"18px 18px 10px" }}>
        <div style={{ fontWeight:800, fontSize:17, color:C.ink }}>Für dich empfohlen</div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.teal }}>Alle ansehen →</button>
      </div>

      <div className="scrollbar-hide"
        style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 18px 4px" }}>
        {NEARBY.map((n,i)=>(
          <div key={i} style={{ flexShrink:0, width:260, borderRadius:18,
            overflow:"hidden", position:"relative", height:160,
            boxShadow:"0 4px 16px rgba(0,0,0,0.10)", cursor:"pointer" }}>
            <img src={n.img} alt={n.title}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.8)" }}/>
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to bottom, transparent 30%, rgba(26,26,26,0.72) 100%)" }}/>
            <HeartBtn white />
            <div style={{ position:"absolute", bottom:12, left:12, right:12 }}>
              <div style={{ fontWeight:800, fontSize:14, color:"white",
                marginBottom:2 }}>{n.title}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)" }}>{n.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOME FEED CONTENT
═══════════════════════════════════════════ */
function HomeFeed({ onView, onBook, onCart, onImpact, onMatch }) {
  return (
    <div style={{ paddingBottom:90 }}>

      {/* ── Search + HUI Match ── */}
      <div style={{ padding:"12px 18px 16px" }}>
        {/* Search pill */}
        <div style={{ position:"relative", marginBottom:12 }}>
          <span style={{ position:"absolute", left:16, top:"50%",
            transform:"translateY(-50%)", fontSize:15,
            color:C.muted2, pointerEvents:"none" }}>🔍</span>
          <input className="hui-search"
            placeholder="Wen oder was suchst du heute?"
            readOnly onFocus={onMatch} />
        </div>
        {/* HUI Match golden pill */}
        <HuiMatchPill onClick={onMatch} />
      </div>

      {/* ── Menschen die inspirieren (WIRKER) ── */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"6px 18px 12px" }}>
        <div style={{ fontWeight:800, fontSize:17, color:C.ink }}>
          Menschen, die inspirieren
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.teal }}>Alle ansehen →</button>
      </div>

      <div className="scrollbar-hide"
        style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 18px 4px" }}>
        {WIRKERS.map((w,i)=>(
          <div key={i} className="fade-up"
            style={{ flexShrink:0, width:140, borderRadius:20,
              overflow:"hidden", cursor:"pointer",
              background:C.card,
              boxShadow:"0 2px 12px rgba(0,0,0,0.09)",
              animationDelay:`${i*0.07}s` }}
            onClick={()=>onView(w)}>
            {/* Portrait image */}
            <div style={{ height:170, overflow:"hidden", position:"relative" }}>
              <img src={w.img} alt={w.name}
                style={{ width:"100%", height:"100%", objectFit:"cover",
                  objectPosition:"top" }}/>
              {/* Teal atmosphere — WIRKER */}
              <div style={{ position:"absolute", inset:0,
                background:`linear-gradient(to bottom,
                  rgba(22,215,197,0.06) 0%,
                  transparent 40%,
                  rgba(26,26,26,0.55) 100%)` }}/>
              {/* Avatar bottom */}
              <div style={{ position:"absolute", bottom:8, left:8,
                width:32, height:32, borderRadius:"50%",
                overflow:"hidden",
                border:"2px solid rgba(255,255,255,0.8)",
                boxShadow:"0 2px 6px rgba(0,0,0,0.2)" }}>
                <img src={w.img} alt={w.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              </div>
            </div>
            <div style={{ padding:"8px 10px 12px" }}>
              <div style={{ fontWeight:800, fontSize:13, color:C.ink,
                marginBottom:1 }}>{w.name}</div>
              <div style={{ fontSize:11, color:C.teal, fontWeight:700 }}>{w.talent}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>📍 {w.city}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Werke mit Seele (WERKE) ── */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"22px 18px 12px" }}>
        <div style={{ fontWeight:800, fontSize:17, color:C.ink }}>Werke mit Seele</div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.teal }}>Alle ansehen →</button>
      </div>

      {/* Masonry 2-col */}
      <div style={{ padding:"0 18px", columns:2, columnGap:10 }}>
        {WERKE.map((w,i)=>(
          <div key={i} style={{ breakInside:"avoid", marginBottom:10 }}>
            <div style={{ borderRadius:18, overflow:"hidden",
              background:C.card,
              boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
              cursor:"pointer" }}
              onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"}
              onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              <div style={{ height:w.h, overflow:"hidden", position:"relative" }}>
                <img src={w.img} alt={w.title}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                {/* Coral atmosphere — WERKE */}
                <div style={{ position:"absolute", inset:0,
                  background:`linear-gradient(to bottom,
                    rgba(255,138,107,0.05) 0%,
                    transparent 40%,
                    rgba(26,26,26,0.55) 100%)` }}/>
                {/* Price badge */}
                <div style={{ position:"absolute", top:8, left:8,
                  background:"rgba(255,255,255,0.92)",
                  backdropFilter:"blur(8px)", borderRadius:999,
                  padding:"3px 10px", fontSize:12, fontWeight:800,
                  color:C.ink }}>
                  {w.price}
                </div>
                {/* Save button */}
                <button onClick={e=>e.stopPropagation()}
                  style={{ position:"absolute", bottom:8, right:8,
                    width:28, height:28, borderRadius:"50%",
                    background:"rgba(255,255,255,0.85)",
                    border:"none", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:14, WebkitTapHighlightColor:"transparent" }}>∨</button>
              </div>
              <div style={{ padding:"8px 10px 10px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.ink,
                  lineHeight:1.35, marginBottom:3 }}>{w.title}</div>
                <div style={{ fontSize:10, color:C.teal, fontWeight:600 }}>{w.creator}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Impact Teaser ── */}
      <div style={{ margin:"12px 18px 24px", borderRadius:22,
        overflow:"hidden", cursor:"pointer" }}
        onClick={onImpact}>
        <div style={{ position:"relative", height:140 }}>
          <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=85"
            alt="Impact"
            style={{ width:"100%", height:"100%", objectFit:"cover",
              filter:"brightness(0.7) saturate(1.1)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(160deg,
              rgba(22,215,197,0.7) 0%,
              rgba(255,138,107,0.5) 100%)` }}/>
          <div style={{ position:"absolute", inset:0,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center" }}>
            <span className="breathe" style={{ fontSize:36, marginBottom:6 }}>🌱</span>
            <div style={{ fontWeight:900, fontSize:32, color:"white", letterSpacing:-1 }}>
              3.847 €
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.88)", marginTop:4,
              fontWeight:600 }}>gemeinsam bewegt · Mai 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
export default function Home() {
  const [tab,          setTab]          = useState("feed");
  const [showWirker,   setShowWirker]   = useState(null);
  const [showBooking,  setShowBooking]  = useState(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [showMatch,    setShowMatch]    = useState(false);
  const [showKorb,     setShowKorb]     = useState(false);
  const [cart,         setCart]         = useState([]);
  const [notif,        setNotif]        = useState(3);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userName,     setUserName]     = useState("");
  const [following,    setFollowing]    = useState(new Set());

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session) return;
      setCurrentUser(session.user);
      setUserName(session.user.user_metadata?.full_name ||
                  session.user.email?.split("@")[0] || "");
    });
  },[]);

  if(showCreate) return <CreateFlow onClose={()=>setShowCreate(false)} />;

  if(showBooking) return (
    <div style={{ position:"fixed", inset:0, zIndex:200,
      overflowY:"auto", background:C.cream }}>
      <BookingFlow
        wirker={showBooking}
        onClose={()=>setShowBooking(null)}
        onAddToCart={item=>setCart(p=>[...p,item])}
        onSuccess={()=>setShowBooking(null)}
      />
    </div>
  );

  return (
    <div className="hui-app"
      style={{ height:"100dvh", display:"flex",
        flexDirection:"column", overflow:"hidden" }}>

      <Header cart={cart.length} notif={notif}
        onNotif={()=>setNotif(0)}
        onCart={()=>setShowKorb(true)}
        userName={userName} />

      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden",
        WebkitOverflowScrolling:"touch" }}
        className="scrollbar-hide">

        {tab==="feed"     && (
          <HomeFeed
            onView={w=>setShowWirker(w)}
            onBook={w=>setShowBooking(w)}
            onCart={item=>setCart(p=>[...p,item])}
            onImpact={()=>setTab("impact")}
            onMatch={()=>setShowMatch(true)}
          />
        )}
        {tab==="impact"   && <ImpactPage currentUser={currentUser} />}
        {tab==="discover" && (
          <DiscoverPage
            onView={w=>setShowWirker(w)}
            onMatch={()=>setShowMatch(true)}
          />
        )}
        {tab==="profile"  && (
          <ProfilePage
            onTalentAnbieten={()=>setShowCreate(true)}
            onLogout={()=>{ supabase.auth.signOut(); window.location.href="/login"; }}
          />
        )}
      </div>

      <BottomNav tab={tab}
        onTab={setTab}
        onCreate={()=>setShowCreate(true)}
      />

      {/* Overlays */}
      {showMatch && (
        <MatchOverlay
          onClose={()=>setShowMatch(false)}
          onView={name=>{
            const w = WIRKERS.find(x=>x.name===name)||WIRKERS[0];
            setShowWirker(w);
            setShowMatch(false);
          }}
        />
      )}
      {showWirker && (
        <WirkerSheet
          w={showWirker}
          onClose={()=>setShowWirker(null)}
          onBook={w=>{ setShowWirker(null); setShowBooking(w); }}
          onChat={()=>setShowWirker(null)}
        />
      )}
      {showKorb && (
        <WerkekorbbPage cart={cart} onClose={()=>setShowKorb(false)} />
      )}
    </div>
  );
}
