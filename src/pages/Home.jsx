import React, { useState, useEffect, useRef } from "react";
import { supabase }   from "../lib/supabaseClient";
import ImpactPage     from "./ImpactPage";
import ProfilePage from "../components/ProfilePage";
import BookingFlow    from "../components/BookingFlow";
import { WerkDetail, WerkCheckout, WerkeKorb } from "../components/WerkeShop";
import OrdersPage from "../components/OrdersPage";
import { useAuth } from "../lib/AuthContext";
import CreateFlow          from "../components/CreateFlow";
import TalentOnboarding   from "../components/TalentOnboarding";
import WirkerCreateSheet  from "../components/WirkerCreateSheet";
import WirkerProfilePage from "../components/WirkerProfilePage";
import HuiMatchOverlay from "../components/HuiMatchOverlay";
import LiveMapPage    from "./LiveMapPage";
import DiscoveryFeed  from "../components/DiscoveryFeed";
import DiscoverPage   from "./DiscoverPage";

/* ═══════════════════════════════════════════════════
   BRAND — original HUI DNA
═══════════════════════════════════════════════════ */
const C = {
  teal:       "#16D7C5",
  teal2:      "#11C5B7",
  tealPale:   "#E6FAF8",
  tealGlow:   "rgba(22,215,197,0.22)",
  coral:      "#FF8A6B",
  coral2:     "#FF7B72",
  coralGlow: "rgba(255,138,107,0.22)",
  cream:      "#F9F6F2",
  creamWarm:  "#FFF9F4",
  card:       "#FFFFFF",
  ink:        "#1A1A1A",
  ink2:       "#3A3A3A",
  muted:      "#888",
  muted2:     "#BBB",
  border:     "rgba(0,0,0,0.06)",
  gold:       "#F59E0B",
  green:      "#10B981",
};

/* ═══════════════════════════════════════════════════
   MOCK DATA — rich & cinematic
═══════════════════════════════════════════════════ */
const WIRKERS = [
  {
    name:"Lea Sommer", talent:"Fotografin", city:"München",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=90",
    score:4.9, posts:128, connections:312,
    quote:"Ich fange Momente ein, die bleiben. Echt, natürlich und voller Gefühl.",
    bio:"Fotografie ist meine Art, Geschichten zu erzählen. Mit natürlichem Licht. Mit echten Menschen.",
    werke:[
      {img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=85"},
      {img:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=85"},
      {img:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=85"},
    ],
  },
  {
    name:"David Weber", talent:"Keramikkünstler", city:"Hamburg",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90",
    score:4.8, posts:64, connections:189,
    quote:"Ton ist mein Medium — Stille ist meine Sprache.",
    bio:"Handgemachte Keramik mit Seele. Jedes Stück ein Dialog mit dem Material.",
    werke:[],
  },
  {
    name:"Nina B.", talent:"Yogalehrerin", city:"Stuttgart",
    img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=90",
    score:4.9, posts:201, connections:445,
    quote:"Yoga ist keine Übung — es ist eine Art zu leben.",
    bio:"Ich begleite Menschen zu mehr Achtsamkeit und innerer Stärke.",
    werke:[],
  },
  {
    name:"Marcus B.", talent:"Videograf", city:"Berlin",
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=900&q=90",
    score:4.7, posts:93, connections:267,
    quote:"Bewegte Bilder, die bewegen.",
    bio:"Dokumentarische Videografie für Menschen mit Haltung.",
    werke:[],
  },
];

const WERKE = [
  {
    title:"Handgefertigte Keramikschale",
    price:"€89", creator:"David Weber", h:230,
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=90",
  },
  {
    title:"Zwischen Licht und Wellen",
    price:"€320", creator:"Lea Sommer", h:290,
    img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=90",
  },
  {
    title:"Leder-Rucksack",
    price:"€195", creator:"Anna K.", h:210,
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=90",
  },
  {
    title:"Aquarell Original",
    price:"€120", creator:"Lena M.", h:260,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=90",
  },
];

const EXPERIENCES = [
  {
    title:"Live Musik Abend",
    sub:"Heute · 19:30 · München",
    img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=90",
  },
  {
    title:"Töpferkurs am See",
    sub:"Samstag · 14:00 · Starnberg",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=90",
  },
  {
    title:"Yoga bei Sonnenaufgang",
    sub:"Sonntag · 07:00 · München",
    img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=90",
  },
];


/* ═══════════════════════════════════════════════════
   GLOBAL STYLES injected once
═══════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideUp {
    from { transform:translateY(100%); opacity:0; }
    to   { transform:translateY(0);    opacity:1; }
  }
  @keyframes heartPop {
    0%  { transform:scale(1); }
    40% { transform:scale(1.55); }
    70% { transform:scale(0.88); }
    100%{ transform:scale(1); }
  }
  @keyframes breathe {
    0%,100% { transform:scale(1) translateY(0); }
    50%      { transform:scale(1.04) translateY(-2px); }
  }
  .hui-scroll::-webkit-scrollbar { display:none; }
  .hui-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .hui-card-tap { transition:transform 0.2s cubic-bezier(0.34,1.4,0.64,1); }
  .hui-card-tap:active { transform:scale(0.965); }
  @keyframes hui-pulse-ring {
    0%   { transform:translate(-50%,-62%) scale(0.85); opacity:0.45; }
    60%  { transform:translate(-50%,-62%) scale(1.35); opacity:0; }
    100% { transform:translate(-50%,-62%) scale(1.35); opacity:0; }
  }
`;

/* ═══════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════ */
function HeartBtn({ size=36, overlayStyle={} }) {
  const [liked, setLiked] = useState(false);
  const [pop,   setPop]   = useState(false);
  return (
    <button
      onClick={e=>{ e.stopPropagation(); setPop(true); setTimeout(()=>setPop(false),380); setLiked(p=>!p); }}
      style={{ width:size, height:size, borderRadius:"50%",
        background:"rgba(255,255,255,0.22)", backdropFilter:"blur(10px)",
        border:"1px solid rgba(255,255,255,0.35)",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontSize:size*0.44, lineHeight:1,
        animation:pop?"heartPop 0.38s ease both":"none",
        WebkitTapHighlightColor:"transparent", ...overlayStyle }}>
      {liked ? "❤️" : "🤍"}
    </button>
  );
}

function HuiLogo({ size=44 }) {
  return (
    <img
      src="/hui-logo.jpg"
      alt="HUI"
      style={{
        width:size, height:size,
        borderRadius: Math.round(size * 0.27),
        objectFit:"cover",
        display:"block", flexShrink:0,
      }}
    />
  );
}

/* Rattan Werkekorb */
function Korb({ count=0, size=32, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:"none", border:"none", cursor:"pointer",
        padding:4, lineHeight:0, position:"relative",
        WebkitTapHighlightColor:"transparent" }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Shopping bag — clean, minimal, app-native */}
        {/* Handle */}
        <path d="M11 13 Q11 7 16 7 Q21 7 21 13"
          stroke={count>0 ? C.teal : "rgba(60,60,60,0.5)"}
          strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        {/* Bag body */}
        <path d="M7 13 L8.5 26 Q8.5 27 9.5 27 H22.5 Q23.5 27 23.5 26 L25 13 Z"
          fill={count>0
            ? `url(#korb-fill)`
            : "rgba(60,60,60,0.08)"}
          stroke={count>0 ? C.teal : "rgba(60,60,60,0.35)"}
          strokeWidth="1.5" strokeLinejoin="round"/>
        {/* Subtle fold line */}
        <path d="M9 19 Q16 18.2 23 19"
          stroke={count>0 ? `${C.teal}55` : "rgba(60,60,60,0.12)"}
          strokeWidth="0.9" strokeLinecap="round"/>
        <defs>
          <linearGradient id="korb-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`${C.teal}22`}/>
            <stop offset="100%" stopColor={`${C.coral}14`}/>
          </linearGradient>
        </defs>
      </svg>
      {count>0 && (
        <div style={{ position:"absolute", top:0, right:0,
          minWidth:15, height:15, borderRadius:999,
          background:`linear-gradient(135deg,${C.teal},${C.coral})`,
          color:"white", fontSize:8, fontWeight:900,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0 3px", border:"2px solid rgba(255,251,248,0.95)",
          boxShadow:`0 1px 5px ${C.tealGlow}` }}>
          {count>9?"9+":count}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   HEADER — minimal glass
═══════════════════════════════════════════════════ */
function Header({ cart, notif, onCart, onNotif, userName }) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:60,
      background:"rgba(255,251,248,0.92)",
      backdropFilter:"blur(28px) saturate(1.6)",
      WebkitBackdropFilter:"blur(28px) saturate(1.6)",
      borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
      <div style={{ height:"env(safe-area-inset-top,0)" }}/>
      <div style={{ display:"flex", alignItems:"center",
        padding:"10px 18px 10px 16px", gap:12 }}>

        {/* ── Logo + wordmark — always visible ── */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
          <HuiLogo size={38}/>

          <div style={{ lineHeight:1 }}>
            {/* Line 1: HUI big */}
            <div style={{ display:"flex", alignItems:"baseline", gap:0,
              marginBottom:1 }}>
              <span style={{
                fontWeight:900, fontSize:18, letterSpacing:-0.5,
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              }}>H</span>
              <span style={{
                fontWeight:700, fontSize:14, color:"rgba(30,30,30,0.75)",
                letterSpacing:-0.2
              }}>UI</span>
              <span style={{ width:1, display:"inline-block" }}/>
              {/* dot separator */}
              <span style={{ fontSize:14, color:C.muted2, margin:"0 4px" }}>·</span>
              <span style={{ fontWeight:900, fontSize:12,
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:0.2 }}>
                H
              </span>
              <span style={{ fontWeight:500, fontSize:11,
                color:"rgba(30,30,30,0.60)", letterSpacing:0 }}>uman </span>
              <span style={{ fontWeight:900, fontSize:12,
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:0.2 }}>
                U
              </span>
              <span style={{ fontWeight:500, fontSize:11,
                color:"rgba(30,30,30,0.60)" }}>nited </span>
              <span style={{ fontWeight:900, fontSize:12,
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:0.2 }}>
                I
              </span>
              <span style={{ fontWeight:500, fontSize:11,
                color:"rgba(30,30,30,0.60)" }}>ntelligent</span>
            </div>
          </div>
        </div>

        {/* ── Right actions ── */}
        <Korb count={cart} size={30} onClick={onCart}/>

        <button onClick={onNotif}
          style={{ background:"none", border:"none", cursor:"pointer",
            padding:4, position:"relative", lineHeight:0,
            WebkitTapHighlightColor:"transparent" }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            {/* Bell dome */}
            <path d="M16 4 C10 4 8 9 8 14 L8 21 L6 23 L26 23 L24 21 L24 14 C24 9 22 4 16 4Z"
              fill={notif>0 ? `${C.teal}1A` : "rgba(60,60,60,0.08)"}
              stroke={notif>0 ? C.teal : "rgba(60,60,60,0.45)"}
              strokeWidth="1.6" strokeLinejoin="round"/>
            {/* Clapper */}
            <path d="M13 23 Q13 27 16 27 Q19 27 19 23"
              stroke={notif>0 ? C.teal : "rgba(60,60,60,0.45)"}
              strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            {/* Active vibration lines */}
            {notif>0 && <>
              <path d="M6 10 Q5 8 6.5 6.5" stroke={C.teal} strokeWidth="1.2"
                strokeLinecap="round" opacity="0.5"/>
              <path d="M26 10 Q27 8 25.5 6.5" stroke={C.coral} strokeWidth="1.2"
                strokeLinecap="round" opacity="0.5"/>
            </>}
          </svg>
          {notif>0 && (
            <div style={{ position:"absolute", top:1, right:1,
              width:8, height:8, borderRadius:"50%",
              background:`linear-gradient(135deg,${C.coral},${C.coral2||"#FF7B72"})`,
              border:"1.5px solid rgba(255,251,248,0.95)",
              boxShadow:`0 1px 4px ${C.coralGlow}` }}/>
          )}
        </button>

        {userName && (
          <div style={{ width:32, height:32, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:13, color:"white",
            boxShadow:`0 2px 8px ${C.tealGlow}` }}>
            {userName[0].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BOTTOM NAV — floating, minimal
═══════════════════════════════════════════════════ */
const NAV = [
  {key:"feed",     label:"Home"},
  {key:"impact",   label:"Impact"},
  null,
  {key:"discover", label:"Entdecken"},
  {key:"profile",  label:"Profil"},
];

/* ─── NAV ICONS — custom, characterful, HUI-native ─── */
function NavIcon({ k, active }) {
  const col  = active ? C.teal : "rgba(80,80,80,0.55)";
  const col2 = active ? C.coral : "rgba(80,80,80,0.30)";
  const sw   = active ? 1.8 : 1.5;

  /* HOME — organic house with a heart-roofline */
  if(k==="feed") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Roof — curved, warm */}
      <path d="M3.5 11 Q12 2.5 20.5 11" stroke={col} strokeWidth={sw}
        strokeLinecap="round" fill="none"/>
      {/* Walls */}
      <path d="M5.5 11V20.5H10V15.5H14V20.5H18.5V11"
        stroke={col} strokeWidth={sw} strokeLinecap="round"
        strokeLinejoin="round" fill={active ? `${C.teal}15` : "none"}/>
      {/* Tiny heart on door */}
      <path d="M12 18 C12 18 10.5 17 10.5 15.8 C10.5 15.1 11.3 14.7 12 15.3 C12.7 14.7 13.5 15.1 13.5 15.8 C13.5 17 12 18 12 18Z"
        fill={active ? C.coral : "rgba(80,80,80,0.25)"} stroke="none"/>
    </svg>
  );

  /* IMPACT — sprouting seedling */
  if(k==="impact") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Stem */}
      <path d="M12 21 V10" stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      {/* Left leaf */}
      <path d="M12 14 Q8 12 7 8 Q10 8 12 11"
        fill={active ? `${C.teal}30` : "rgba(80,80,80,0.12)"}
        stroke={col} strokeWidth={sw-0.3} strokeLinejoin="round"/>
      {/* Right leaf */}
      <path d="M12 17 Q16 15 17 11 Q14 11 12 14"
        fill={active ? `${C.teal}22` : "rgba(80,80,80,0.08)"}
        stroke={col} strokeWidth={sw-0.3} strokeLinejoin="round"/>
      {/* Ground line */}
      <path d="M8 21 H16" stroke={col2} strokeWidth={1.2} strokeLinecap="round"/>
    </svg>
  );

  /* DISCOVER — compass rose */
  if(k==="discover") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={col} strokeWidth={sw}/>
      {/* N needle — teal */}
      <path d="M12 12 L10.5 6.5 L12 8.5 L13.5 6.5 Z"
        fill={active ? C.teal : col} stroke="none"/>
      {/* S needle — coral */}
      <path d="M12 12 L10.5 17.5 L12 15.5 L13.5 17.5 Z"
        fill={active ? C.coral : "rgba(80,80,80,0.3)"} stroke="none"/>
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5"
        fill={active ? "white" : "rgba(80,80,80,0.3)"}
        stroke={col} strokeWidth="0.8"/>
    </svg>
  );

  /* PROFILE — abstract face, warm */
  if(k==="profile") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Head circle */}
      <circle cx="12" cy="8.5" r="4"
        fill={active ? `${C.teal}18` : "rgba(80,80,80,0.08)"}
        stroke={col} strokeWidth={sw}/>
      {/* Shoulders arc */}
      <path d="M4 21 Q4 15 12 15 Q20 15 20 21"
        stroke={col} strokeWidth={sw} strokeLinecap="round"
        fill={active ? `${C.teal}10` : "none"}/>
    </svg>
  );

  return null;
}

/* ─── BOTTOM NAV — floating pill, premium ─── */
function BottomNav({ tab, onTab, onCreate, isWirker }) {
  const [pressed, setPressed] = useState(null);
  const [transformed, setTransformed] = useState(false);

  // Trigger the "magic moment" transformation animation
  useEffect(() => {
    if(isWirker) {
      const t = setTimeout(() => setTransformed(true), 50);
      return () => clearTimeout(t);
    } else {
      setTransformed(false);
    }
  }, [isWirker]);

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:100,
    }}>
      <div style={{
        margin:"0 14px",
        marginBottom:"max(12px, env(safe-area-inset-bottom, 12px))",
        background:"rgba(255,251,248,0.92)",
        backdropFilter:"blur(36px) saturate(1.8)",
        WebkitBackdropFilter:"blur(36px) saturate(1.8)",
        borderRadius:28,
        border:"1px solid rgba(255,255,255,0.72)",
        boxShadow:`
          0 2px 4px rgba(0,0,0,0.03),
          0 8px 28px rgba(0,0,0,0.10),
          0 1px 0 rgba(255,255,255,0.9) inset
        `,
        display:"flex", alignItems:"center",
        justifyContent:"space-around",
        padding:"6px 4px",
      }}>

        {NAV.map((item, i) => {
          /* ── HUI centre button ── */
          if(!item) return (
            <button key="hui"
              onClick={onCreate}
              onTouchStart={()=>setPressed("hui")}
              onTouchEnd={()=>setPressed(null)}
              style={{
                background:"none", border:"none",
                cursor:"pointer", padding:0,
                lineHeight:0, flexShrink:0,
                WebkitTapHighlightColor:"transparent",
                position:"relative",
              }}>
              <div style={{
                width:52, height:52, borderRadius: isWirker ? "50%" : 17,
                marginTop:-24,
                background: isWirker
                  ? `linear-gradient(145deg,${C.teal},${C.teal2} 45%,${C.coral})`
                  : `linear-gradient(145deg,${C.teal},#14C4B4 45%,${C.coral})`,
                display:"flex", alignItems:"center",
                justifyContent:"center",
                transform: pressed==="hui"
                  ? "scale(0.90) translateY(2px)"
                  : transformed ? "scale(1.05) translateY(0)" : "scale(1) translateY(0)",
                transition:"all 0.55s cubic-bezier(0.34,1.5,0.64,1)",
                boxShadow: isWirker
                  ? `
                    0 0 0 3px rgba(255,251,248,0.95),
                    0 4px 6px rgba(0,0,0,0.12),
                    0 8px 28px rgba(22,215,197,0.52),
                    0 4px 14px rgba(255,138,107,0.30),
                    0 0 0 7px rgba(22,215,197,0.10)
                  `
                  : `
                    0 0 0 3px rgba(255,251,248,0.95),
                    0 4px 6px rgba(0,0,0,0.12),
                    0 8px 22px rgba(22,215,197,0.38),
                    0 4px 12px rgba(255,138,107,0.22)
                  `,
                overflow:"hidden",
              }}>
                {/* BASE USER: real HUI logo */}
                <img src="/hui-logo.jpg" alt="HUI"
                  style={{
                    width:36, height:36, borderRadius: isWirker ? "50%" : 10,
                    objectFit:"cover", display:"block",
                    position:"absolute",
                    opacity: isWirker ? 0 : 1,
                    transform: isWirker ? "scale(0.5) rotate(-90deg)" : "scale(1) rotate(0deg)",
                    transition:"all 0.5s cubic-bezier(0.34,1.3,0.64,1)",
                  }}/>
                {/* WIRKER: Plus icon */}
                <div style={{
                  position:"absolute",
                  opacity: isWirker ? 1 : 0,
                  transform: isWirker ? "scale(1) rotate(0deg)" : "scale(0.3) rotate(90deg)",
                  transition:"all 0.5s cubic-bezier(0.34,1.3,0.64,1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3 L11 19" stroke="white" strokeWidth="2.4"
                      strokeLinecap="round"/>
                    <path d="M3 11 L19 11" stroke="white" strokeWidth="2.4"
                      strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              {/* Wirker glow pulse ring */}
              {isWirker && (
                <div style={{
                  position:"absolute",
                  top:"50%", left:"50%",
                  transform:"translate(-50%,-62%)",
                  width:64, height:64, borderRadius:"50%",
                  border:`1.5px solid ${C.teal}`,
                  opacity:0,
                  animation:"hui-pulse-ring 2.2s ease-out infinite",
                  pointerEvents:"none",
                }}/>
              )}
            </button>
          );

          const active    = tab === item.key;
          const isPressed = pressed === item.key;

          return (
            <button key={item.key}
              onClick={() => onTab(item.key)}
              onTouchStart={() => setPressed(item.key)}
              onTouchEnd={() => setPressed(null)}
              style={{
                display:"flex", flexDirection:"column",
                alignItems:"center", gap:3,
                background:"none", border:"none",
                cursor:"pointer",
                padding:"5px 10px 4px",
                borderRadius:18,
                position:"relative",
                WebkitTapHighlightColor:"transparent",
                transform: isPressed ? "scale(0.88)" : "scale(1)",
                transition:"transform 0.18s cubic-bezier(0.34,1.4,0.64,1)",
                minWidth:50,
              }}>

              {/* Active background pill */}
              {active && (
                <div style={{
                  position:"absolute", inset:0,
                  borderRadius:18,
                  background:`linear-gradient(150deg,
                    ${C.teal}18 0%,
                    ${C.coral}0A 100%)`,
                  border:`1px solid ${C.teal}28`,
                }}/>
              )}

              {/* Icon */}
              <div style={{
                position:"relative", zIndex:1,
                transform: active ? "translateY(-1px) scale(1.06)" : "translateY(0) scale(1)",
                transition:"transform 0.25s cubic-bezier(0.34,1.3,0.64,1)",
              }}>
                <NavIcon k={item.key} active={active}/>
              </div>

              {/* Label — readable, warm */}
              <span style={{
                fontSize:10,
                fontWeight: active ? 700 : 500,
                color: active ? C.teal : "rgba(60,60,60,0.65)",
                transition:"all 0.22s",
                letterSpacing: active ? 0.1 : 0,
                position:"relative", zIndex:1,
                fontFamily:"inherit",
              }}>
                {item.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div style={{
                  position:"absolute", bottom:1,
                  left:"50%", transform:"translateX(-50%)",
                  width:4, height:4, borderRadius:"50%",
                  background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                  boxShadow:`0 0 5px ${C.teal}80`,
                }}/>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
}
function WirkerSheet({ w, onClose, onBook }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(10,10,10,0.55)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.card, borderRadius:"28px 28px 0 0",
        maxHeight:"90vh", overflowY:"auto",
        animation:"slideUp 0.36s cubic-bezier(0.22,1,0.36,1) both",
        paddingBottom:"max(24px,env(safe-area-inset-bottom))" }}>

        {/* Cinematic hero */}
        <div style={{ height:260, position:"relative", overflow:"hidden" }}>
          <img src={w.bg} alt={w.name}
            style={{ width:"100%", height:"100%", objectFit:"cover",
              filter:"brightness(0.72) saturate(1.1)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to bottom,rgba(0,0,0,0.28) 0%,transparent 40%,rgba(0,0,0,0.68) 100%)"}}/>
          <div style={{ position:"absolute", top:16, left:16, right:16,
            display:"flex", justifyContent:"space-between" }}>
            <button onClick={onClose}
              style={{ width:38, height:38, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)", backdropFilter:"blur(10px)",
                border:"1px solid rgba(255,255,255,0.3)",
                cursor:"pointer", fontSize:16, color:"white",
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>←</button>
            <div style={{ display:"flex", gap:10 }}>
              <HeartBtn size={38}/>
              <button style={{ width:38, height:38, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)", backdropFilter:"blur(10px)",
                border:"1px solid rgba(255,255,255,0.3)",
                cursor:"pointer", color:"white", fontSize:14,
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>···</button>
            </div>
          </div>
        </div>

        <div style={{ padding:"0 22px 28px" }}>
          {/* Avatar */}
          <div style={{ marginTop:-30, marginBottom:14 }}>
            <div style={{ width:60, height:60, borderRadius:"50%",
              overflow:"hidden", border:"3px solid white",
              boxShadow:"0 4px 20px rgba(0,0,0,0.18)" }}>
              <img src={w.img} alt={w.name}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          </div>

          <div style={{ fontWeight:900, fontSize:24, color:C.ink,
            letterSpacing:-0.6, marginBottom:2 }}>
            {w.name}
            <span style={{ color:C.teal, fontSize:17, marginLeft:6 }}>✓</span>
          </div>
          <div style={{ fontSize:13, color:C.teal, fontWeight:700,
            marginBottom:2 }}>{w.talent}</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>
            📍 {w.city}
          </div>

          {/* Stats */}
          <div style={{ display:"flex", background:C.cream,
            borderRadius:18, marginBottom:18, overflow:"hidden" }}>
            {[
              {val:w.posts,       lab:"Posts"},
              {val:w.score,       lab:"Bewertung", gold:true},
              {val:w.connections, lab:"Verbindungen"},
            ].map((s,i)=>(
              <div key={i} style={{ flex:1, textAlign:"center",
                padding:"14px 4px",
                borderRight:i<2?`1px solid ${C.border}`:"none" }}>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"center", gap:3 }}>
                  {s.gold && <span style={{ fontSize:11, color:C.gold }}>★</span>}
                  <span style={{ fontWeight:900, fontSize:18,
                    color:s.gold?C.gold:C.ink }}>{s.val}</span>
                </div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                  {s.lab}
                </div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div style={{ background:C.tealPale, borderRadius:18,
            padding:"16px 18px", marginBottom:16,
            borderLeft:`4px solid ${C.teal}` }}>
            <div style={{ fontSize:14, color:C.ink2, fontStyle:"italic",
              lineHeight:1.75 }}>„{w.quote}"</div>
          </div>

          <div style={{ fontWeight:700, fontSize:14,
            color:C.ink, marginBottom:6 }}>Über mich</div>
          <div style={{ fontSize:14, color:C.muted,
            lineHeight:1.75, marginBottom:20 }}>{w.bio}</div>

          {w.werke.length>0 && <>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:10 }}>
              <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>
                Meine Arbeiten
              </div>
              <button style={{ background:"none", border:"none",
                cursor:"pointer", fontSize:12, fontWeight:600,
                color:C.teal }}>Alle →</button>
            </div>
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:22 }}>
              {w.werke.map((wk,i)=>(
                <div key={i} style={{ borderRadius:14, overflow:"hidden",
                  aspectRatio:"1" }}>
                  <img src={wk.img} alt=""
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                </div>
              ))}
            </div>
          </>}

          <div style={{ display:"flex", gap:12 }}>
            <button style={{ flex:1, padding:"15px",
              background:"none", border:`2px solid ${C.border}`,
              borderRadius:18, fontSize:15, fontWeight:700,
              color:C.ink, cursor:"pointer", fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent" }}>
              Nachricht
            </button>
            <button onClick={()=>onBook&&onBook(w)}
              style={{ flex:1, padding:"15px",
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                border:"none", borderRadius:18, fontSize:15, fontWeight:800,
                color:"white", cursor:"pointer", fontFamily:"inherit",
                boxShadow:`0 4px 20px ${C.tealGlow}`,
                WebkitTapHighlightColor:"transparent" }}>
              Anfragen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   WERKEKORB PAGE
═══════════════════════════════════════════════════ */
function KorbPage({ cart, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(10,10,10,0.5)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.creamWarm, borderRadius:"28px 28px 0 0",
        maxHeight:"88vh", overflowY:"auto",
        animation:"slideUp 0.34s cubic-bezier(0.22,1,0.36,1) both",
        paddingBottom:"max(28px,env(safe-area-inset-bottom))" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
          <div style={{ width:44, height:4, borderRadius:999,
            background:"rgba(0,0,0,0.1)" }}/>
        </div>
        <div style={{ padding:"14px 22px 28px" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:24 }}>
            <div style={{ fontWeight:900, fontSize:22, color:C.ink }}>
              Werkekorb
            </div>
            <button onClick={onClose}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontSize:13, color:C.muted,
                WebkitTapHighlightColor:"transparent" }}>✕</button>
          </div>

          <div style={{ display:"flex", justifyContent:"center", marginBottom:22 }}>
            <Korb count={cart.length} size={140} onClick={()=>{}}/>
          </div>

          <div style={{ fontWeight:800, fontSize:19, color:C.ink,
            marginBottom:6, lineHeight:1.25 }}>
            Deine Sammlung<br/>bedeutungsvoller Werke.
          </div>
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.7,
            marginBottom:24 }}>
            Hier findest du alles, was dich inspiriert und was du erleben oder buchen möchtest.
          </div>

          {[
            {n:0, title:"Leer",      sub:"Dein Korb ist noch leer."},
            {n:2, title:"Mit Werken",sub:`${cart.length||2} Werk${(cart.length||2)!==1?"e":""} in deinem Korb.`, badge:cart.length||2},
            {n:4, title:"Gefüllt",   sub:"Dein Korb ist bereit."},
          ].map((s,i)=>{
            const active = i===0&&cart.length===0 ||
                           i===1&&cart.length>0&&cart.length<4 ||
                           i===2&&cart.length>=4;
            return (
              <div key={i}
                style={{ display:"flex", alignItems:"center", gap:14,
                  padding:"14px 16px", marginBottom:10,
                  background:active?`${C.teal}0D`:C.card,
                  borderRadius:20,
                  border:`1.5px solid ${active?C.teal:"rgba(0,0,0,0.06)"}`,
                  cursor:"pointer", transition:"all 0.2s" }}>
                <Korb count={s.n} size={52} onClick={()=>{}}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.ink,
                    display:"flex", alignItems:"center", gap:6 }}>
                    {s.title}
                    {s.badge && (
                      <span style={{ background:C.coral, color:"white",
                        borderRadius:999, fontSize:10, fontWeight:900,
                        padding:"1px 7px" }}>{s.badge}</span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                    {s.sub}
                  </div>
                </div>
                <span style={{ color:active?C.teal:C.muted2,
                  fontSize:14, fontWeight:600 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HOME FEED — cinematic, emotional, image-driven
═══════════════════════════════════════════════════ */
function HomeFeed({ onView, onBook, onImpact, onMatch, onMap }) {

  return (
    <div style={{ paddingBottom:110 }}>

      {/* ─── 1. HERO SEARCH — atmospheric, not technical ─── */}
      <div style={{ margin:"16px 18px 0",
        borderRadius:28, overflow:"hidden", position:"relative" }}>
        {/* Atmospheric background */}
        <div style={{
          background:`
            radial-gradient(ellipse 70% 60% at 15% 40%, rgba(22,215,197,0.18) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 90% 70%, rgba(255,138,107,0.14) 0%, transparent 60%),
            linear-gradient(160deg, ${C.creamWarm} 0%, #FFF2EE 100%)`,
          padding:"22px 20px 20px" }}>

          <div style={{ fontWeight:800, fontSize:17, color:C.ink,
            letterSpacing:-0.3, marginBottom:3 }}>
            Was bewegst du heute?
          </div>
          <div style={{ fontSize:13, color:C.muted,
            marginBottom:16, lineHeight:1.5 }}>
            Entdecke Menschen, Werke und Erlebnisse.
          </div>

          {/* Search pill + Map icon */}
          <div style={{ display:"flex", gap:10, marginBottom:12,
            alignItems:"center" }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:16, top:"50%",
                transform:"translateY(-50%)", fontSize:14,
                color:C.muted2, pointerEvents:"none" }}>🔍</span>
              <input
                style={{ width:"100%", background:"rgba(255,255,255,0.88)",
                  backdropFilter:"blur(12px)",
                  border:"1.5px solid rgba(0,0,0,0.06)",
                  borderRadius:999, padding:"13px 18px 13px 42px",
                  fontSize:14, color:C.ink, outline:"none",
                  fontFamily:"inherit", boxSizing:"border-box",
                  boxShadow:"0 2px 16px rgba(0,0,0,0.06)",
                  transition:"border-color 0.2s, box-shadow 0.2s" }}
                placeholder="Wen oder was suchst du heute?"
                readOnly onFocus={onMatch}
                onMouseEnter={e=>e.target.style.borderColor=C.teal}
                onMouseLeave={e=>e.target.style.borderColor="rgba(0,0,0,0.06)"}
              />
            </div>
            {/* Map icon button */}
            <button onClick={onMap}
              style={{ width:48, height:48, flexShrink:0,
                borderRadius:16,
                background:`linear-gradient(135deg,${C.teal}22,${C.coral}14)`,
                border:`1.5px solid ${C.teal}40`,
                cursor:"pointer",
                display:"flex", alignItems:"center",
                justifyContent:"center",
                boxShadow:`0 2px 14px ${C.tealGlow}`,
                WebkitTapHighlightColor:"transparent",
                transition:"transform 0.18s cubic-bezier(0.34,1.4,0.64,1)" }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                    <defs>
                      <radialGradient id="pg" cx="38%" cy="34%" r="62%">
                        <stop offset="0%" stopColor="#3DECD8"/>
                        <stop offset="55%" stopColor="#16D7C5"/>
                        <stop offset="100%" stopColor="#0FA898"/>
                      </radialGradient>
                      <radialGradient id="pg2" cx="62%" cy="66%" r="50%">
                        <stop offset="0%" stopColor="#FF8A6B" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#FF8A6B" stopOpacity="0"/>
                      </radialGradient>
                    </defs>
                    <circle cx="16" cy="16" r="9" fill="url(#pg)"/>
                    <circle cx="16" cy="16" r="9" fill="url(#pg2)"/>
                    <circle cx="13" cy="12" r="2.8" fill="white" fillOpacity="0.22"/>
                    <ellipse cx="16" cy="16" rx="14" ry="5.5"
                      stroke="rgba(22,215,197,0.55)" strokeWidth="1.4" fill="none"
                      transform="rotate(-28 16 16)"/>
                    <circle cx="3.5" cy="13.8" r="1.6" fill="#FF8A6B" opacity="0.9"/>
                    <circle cx="28.8" cy="17.5" r="1.2" fill="#16D7C5" opacity="0.85"/>
                    <circle cx="16" cy="4.5" r="1.0" fill="white" opacity="0.7"/>
                    <line x1="7.2" y1="14.5" x2="4.8" y2="14.2"
                      stroke="rgba(255,138,107,0.45)" strokeWidth="0.8" strokeLinecap="round"/>
                    <line x1="24.6" y1="17.1" x2="27.4" y2="17.3"
                      stroke="rgba(22,215,197,0.45)" strokeWidth="0.8" strokeLinecap="round"/>
                  </svg>
            </button>
          </div>

          {/* HUI Match — warm gradient pill */}
          <button onClick={onMatch}
            style={{ width:"100%", padding:"13px 20px",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:999,
              color:"white", fontSize:15, fontWeight:800,
              cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center",
              justifyContent:"center", gap:8,
              boxShadow:`0 4px 20px ${C.tealGlow}, 0 2px 8px rgba(255,138,107,0.2)`,
              WebkitTapHighlightColor:"transparent",
              letterSpacing:0.1 }}>
            <span>✨</span>
            <span>HUI Match</span>
          </button>
        </div>
      </div>

      {/* ─── 2. WIRKER — large cinematic portrait cards ─── */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"28px 20px 14px" }}>
        <div>
          <div style={{ fontWeight:900, fontSize:20, color:C.ink,
            letterSpacing:-0.5 }}>Menschen, die inspirieren</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            Echte Talente in deiner Nähe
          </div>
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:700, color:C.teal,
          padding:"6px 12px", borderRadius:999,
          background:C.tealPale }}>
          Alle →
        </button>
      </div>

      <div className="hui-scroll"
        style={{ display:"flex", gap:16, overflowX:"auto",
          padding:"0 20px 4px" }}>
        {WIRKERS.map((w,i)=>(
          <div key={i} onClick={()=>onView(w)}
            className="hui-card-tap"
            style={{ flexShrink:0, width:155, cursor:"pointer",
              animation:`fadeUp 0.5s ${i*0.08}s both` }}>

            {/* Large portrait — teal atmosphere for WIRKER */}
            <div style={{ borderRadius:22, overflow:"hidden",
              height:205, position:"relative",
              boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
              <img src={w.img} alt={w.name}
                style={{ width:"100%", height:"100%", objectFit:"cover",
                  objectPosition:"top" }}/>
              {/* Teal atmospheric overlay — WIRKER identifier */}
              <div style={{ position:"absolute", inset:0,
                background:`linear-gradient(to bottom,
                  rgba(22,215,197,0.08) 0%,
                  transparent 35%,
                  rgba(10,10,10,0.6) 100%)` }}/>
              {/* Heart */}
              <div style={{ position:"absolute", top:10, right:10 }}>
                <HeartBtn size={30}/>
              </div>
              {/* Name on image */}
              <div style={{ position:"absolute", bottom:10,
                left:10, right:10 }}>
                <div style={{ fontWeight:800, fontSize:13,
                  color:"white", lineHeight:1.2 }}>{w.name}</div>
                <div style={{ fontSize:11,
                  color:"rgba(255,255,255,0.78)",
                  marginTop:1 }}>{w.talent}</div>
              </div>
              {/* Teal accent strip */}
              <div style={{ position:"absolute", top:0, left:0, right:0,
                height:3,
                background:`linear-gradient(90deg,${C.teal},transparent)` }}/>
            </div>

            <div style={{ display:"flex", alignItems:"center",
              gap:4, padding:"7px 2px 0",
              fontSize:11, color:C.muted }}>
              <span style={{ fontSize:10, color:C.teal }}>📍</span>
              {w.city}
            </div>
          </div>
        ))}
      </div>

      {/* ─── 3. WERKE — editorial masonry, coral warmth ─── */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"32px 20px 16px" }}>
        <div>
          <div style={{ fontWeight:900, fontSize:20, color:C.ink,
            letterSpacing:-0.5 }}>Werke mit Seele</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            Handgefertigt. Einzigartig. Bedeutungsvoll.
          </div>
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:700, color:C.coral,
          padding:"6px 12px", borderRadius:999,
          background:C.coralPale }}>
          Alle →
        </button>
      </div>

      {/* Masonry 2-col */}
      <div style={{ padding:"0 20px", columns:2, columnGap:14 }}>
        {WERKE.map((w,i)=>(
          <div key={i} style={{ breakInside:"avoid", marginBottom:16 }}
            className="hui-card-tap">
            <div style={{ borderRadius:20, overflow:"hidden",
              position:"relative", height:w.h,
              boxShadow:"0 3px 16px rgba(0,0,0,0.09)",
              cursor:"pointer" }}>
              <img src={w.img} alt={w.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              {/* Coral atmosphere — WERKE identifier */}
              <div style={{ position:"absolute", inset:0,
                background:`linear-gradient(to bottom,
                  rgba(255,138,107,0.06) 0%,
                  transparent 30%,
                  rgba(10,10,10,0.55) 100%)` }}/>
              {/* Coral top strip */}
              <div style={{ position:"absolute", top:0, left:0, right:0,
                height:3,
                background:`linear-gradient(90deg,${C.coral},transparent)` }}/>
              {/* Price */}
              <div style={{ position:"absolute", top:10, left:10 }}>
                <div style={{ background:"rgba(255,255,255,0.92)",
                  backdropFilter:"blur(8px)",
                  borderRadius:999, padding:"4px 11px",
                  fontSize:12, fontWeight:900, color:C.ink }}>
                  {w.price}
                </div>
              </div>
              {/* Heart */}
              <div style={{ position:"absolute", top:10, right:10 }}>
                <HeartBtn size={28}/>
              </div>
            </div>
            <div style={{ padding:"8px 2px 0" }}>
              <div style={{ fontSize:13, fontWeight:700,
                color:C.ink, lineHeight:1.35 }}>{w.title}</div>
              <div style={{ fontSize:11, color:C.teal,
                fontWeight:600, marginTop:3 }}>{w.creator}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 4. EXPERIENCES — full-width cinematic cards ─── */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"16px 20px 14px" }}>
        <div>
          <div style={{ fontWeight:900, fontSize:20, color:C.ink,
            letterSpacing:-0.5 }}>Erlebnisse in deiner Nähe</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            Momente, die bleiben.
          </div>
        </div>
      </div>

      <div className="hui-scroll"
        style={{ display:"flex", gap:16, overflowX:"auto",
          padding:"0 20px 4px" }}>
        {EXPERIENCES.map((ex,i)=>(
          <div key={i} className="hui-card-tap"
            style={{ flexShrink:0, width:270, borderRadius:22,
              overflow:"hidden", height:170, position:"relative",
              boxShadow:"0 4px 20px rgba(0,0,0,0.12)", cursor:"pointer" }}>
            <img src={ex.img} alt={ex.title}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.78)" }}/>
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to bottom,transparent 25%,rgba(0,0,0,0.72) 100%)"}}/>
            <div style={{ position:"absolute", top:12, right:12 }}>
              <HeartBtn size={30}/>
            </div>
            <div style={{ position:"absolute", bottom:14,
              left:14, right:14 }}>
              <div style={{ fontWeight:800, fontSize:15,
                color:"white", marginBottom:3 }}>{ex.title}</div>
              <div style={{ fontSize:11,
                color:"rgba(255,255,255,0.75)" }}>{ex.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 5. IMPACT TEASER — documentary, hopeful ─── */}
      <div style={{ margin:"32px 20px 0" }}>
        <div style={{ borderRadius:28, overflow:"hidden",
          cursor:"pointer", position:"relative" }}
          className="hui-card-tap"
          onClick={onImpact}>
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=90"
            alt="Impact"
            style={{ width:"100%", height:200, objectFit:"cover",
              filter:"brightness(0.62) saturate(1.15)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(160deg,
              rgba(22,215,197,0.55) 0%,
              rgba(255,138,107,0.40) 100%)` }}/>
          <div style={{ position:"absolute", inset:0,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            textAlign:"center", padding:"0 28px" }}>
            <div style={{ fontSize:38, marginBottom:8,
              animation:"breathe 3s ease-in-out infinite" }}>🌱</div>
            <div style={{ fontWeight:900, fontSize:34, color:"white",
              letterSpacing:-1.5, lineHeight:1, marginBottom:6 }}>
              € 124.850
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.88)",
              fontWeight:600 }}>
              gemeinsam bewegt · Mai 2026
            </div>
            <div style={{ marginTop:14, padding:"8px 20px",
              background:"rgba(255,255,255,0.2)",
              backdropFilter:"blur(8px)",
              borderRadius:999, fontSize:13, fontWeight:700,
              color:"white", border:"1px solid rgba(255,255,255,0.3)" }}>
              Impact erleben →
            </div>
          </div>
        </div>
      </div>

      {/* Bottom breathing room */}
      <div style={{ height:16 }}/>

    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DISCOVER PAGE
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════ */
export default function Home() {
  const [tab,         setTab]         = useState("feed");
  const { isWirker: authIsWirker, hasTalentProfile, profile: authProfile, signOut: authSignOut } = useAuth();
  const [isWirker,    setIsWirker]    = useState(false);  // transforms centre btn
  const [showTalentFlow, setShowTalentFlow] = useState(false); // "Wirker werden" flow
  const [showCreateSheet, setShowCreateSheet] = useState(false); // wirker create menu
  const [showWirker,  setShowWirker]  = useState(null);
  const [showBooking, setShowBooking] = useState(null);
  const [showWerkDetail,  setShowWerkDetail]  = useState(null);  // werk detail view
  const [showWerkCheckout,setShowWerkCheckout]= useState(null);  // werk checkout
  const [showWerkeKorb,   setShowWerkeKorb]   = useState(false); // korb sheet
  const [showCreate,  setShowCreate]  = useState(false);

  // Sync wirker status from AuthContext
  useEffect(() => {
    if (authIsWirker || hasTalentProfile) setIsWirker(true);
  }, [authIsWirker, hasTalentProfile]);
  const [showMatch,   setShowMatch]   = useState(false);
  const [showMap,     setShowMap]     = useState(false);
  const [showKorb,    setShowKorb]    = useState(false);
  const [cart,        setCart]        = useState([]);
  const [notif,       setNotif]       = useState(3);
  const [userName,    setUserName]    = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(()=>{
    supabase.auth.getSession().then(async ({data:{session}})=>{
      if(!session) return;
      setCurrentUser(session.user);
      setUserName(
        session.user.user_metadata?.full_name ||
        session.user.email?.split("@")[0] || ""
      );
    });
    // Sync isWirker from AuthContext (authoritative source)
  },[]);

  if(showCreate)  return <CreateFlow onClose={()=>setShowCreate(false)}/>;
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

  if(showWerkDetail) return (
    <WerkDetail
      werk={showWerkDetail}
      onClose={()=>setShowWerkDetail(null)}
      onAddToKorb={w=>{setCart(p=>[...p,w]);setShowWerkDetail(null);}}
      onBuyNow={w=>{setShowWerkDetail(null);setShowWerkCheckout([w]);}}
    />
  );

  if(showWerkCheckout) return (
    <WerkCheckout
      werk={showWerkCheckout[0]}
      items={showWerkCheckout}
      onClose={()=>setShowWerkCheckout(null)}
      onSuccess={()=>setShowWerkCheckout(null)}
    />
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ height:"100dvh", display:"flex",
        flexDirection:"column", overflow:"hidden",
        background:C.cream }}>

        <Header
          cart={cart.length} notif={notif}
          onCart={()=>setShowKorb(true)}
          onNotif={()=>setNotif(0)}
          userName={userName}
        />

        <div className="hui-scroll"
          style={{ flex:1, overflowY:"auto", overflowX:"hidden",
            WebkitOverflowScrolling:"touch" }}>

          {tab==="feed" && (
            <DiscoveryFeed
              onView={w=>w.type==="werk"||w.price?setShowWerkDetail(w):setShowWirker(w)}
              onBook={w=>setShowBooking(w)}
              onImpact={()=>setTab("impact")}
              onMatch={()=>setShowMatch(true)}
              onMap={()=>setShowMap(true)}
              onBuyWerk={w=>setShowWerkCheckout([w])}
              onAddToKorb={w=>{setCart(p=>[...p,w]);}}
            />
          )}
          {tab==="impact" && (
            <ImpactPage currentUser={currentUser}/>
          )}
          {tab==="discover" && (
            <DiscoverPage
              onView={w=>setShowWirker(w)}
              onMap={()=>setShowMap(true)}
              onMatch={()=>setShowMatch(true)}
            />
          )}
          {tab==="profile" && (
            <ProfilePage
              onTalentAnbieten={()=>setShowTalentFlow(true)}
              onLogout={()=>{
                supabase.auth.signOut();
                window.location.href="/login";
              }}
            />
          )}
        </div>

        <BottomNav tab={tab} onTab={setTab}
          isWirker={isWirker}
          onCreate={()=>{
            if(isWirker || hasTalentProfile) setShowCreateSheet(true);
            else setShowTalentFlow(true);
          }}/>

        {/* Overlays */}
        {showMap && <LiveMapPage onView={w=>{setShowWirker(w);setShowMap(false);}} onMatch={()=>{setShowMap(false);setShowMatch(true);}} onClose={()=>setShowMap(false)} fullscreen={true}/>}
        {showMatch  && <HuiMatchOverlay onClose={()=>setShowMatch(false)}
          onView={w=>{setShowWirker(w);setShowMatch(false);}}/>}
        {showWirker && (
        <WirkerProfilePage
          wirker={showWirker}
          onClose={()=>setShowWirker(null)}
          onBook={w=>{setShowWirker(null);setShowBooking(w);}}
        />
      )}
        {(showKorb||showWerkeKorb) && <WerkeKorb
          items={cart}
          onClose={()=>{setShowKorb(false);setShowWerkeKorb(false);}}
          onRemove={i=>setCart(p=>p.filter((_,idx)=>idx!==i))}
          onCheckout={()=>{setShowKorb(false);setShowWerkeKorb(false);
            if(cart.length>0)setShowWerkCheckout(cart);}}
        />}
      </div>

      {/* ── Wirker werden Flow ── */}
      {showTalentFlow && (
        <TalentOnboarding
          onClose={() => setShowTalentFlow(false)}
          onActivate={(data) => {
            setIsWirker(true);
            setShowTalentFlow(false);
          }}
        />
      )}

      {/* ── Wirker Create Sheet ── */}
      {showCreateSheet && (
        <WirkerCreateSheet
          onClose={() => setShowCreateSheet(false)}
          onSelect={(type) => {
            setShowCreateSheet(false);
            setShowCreate(true);
          }}
        />
      )}
    </>
  );
}
