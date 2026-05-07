import React, { useState, useEffect, useRef } from "react";
import { supabase }   from "../lib/supabaseClient";
import ImpactPage     from "./ImpactPage";
import ProfilePage    from "./ProfilePage";
import BookingFlow    from "../components/BookingFlow";
import CreateFlow     from "../components/CreateFlow";
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
  coralPale:  "#FFF2EE",
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
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="hui-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E8D8"/>
          <stop offset="100%" stopColor="#FF8A6B"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#hui-lg)"/>
      <rect x="2" y="2" width="60" height="30" rx="17" fill="white" fillOpacity="0.14"/>
      <text x="10" y="44" fontSize="28" fontWeight="900" fill="white"
        fontFamily="-apple-system,system-ui" letterSpacing="-1.5">HUI</text>
    </svg>
  );
}

/* Rattan Werkekorb */
function Korb({ count=0, size=32, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:"none", border:"none", cursor:"pointer",
        padding:4, lineHeight:0, position:"relative",
        WebkitTapHighlightColor:"transparent" }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="kb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A87C"/>
            <stop offset="100%" stopColor="#B5692E"/>
          </linearGradient>
          <linearGradient id="kr" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#16D7C5"/>
            <stop offset="100%" stopColor="#11C5B7"/>
          </linearGradient>
        </defs>
        <path d="M22 29 Q22 11 32 11 Q42 11 42 29"
          fill="none" stroke="#C8784A" strokeWidth="4" strokeLinecap="round"/>
        <path d="M11 32 Q11 54 32 54 Q53 54 53 32Z" fill="url(#kb)"/>
        {[37,43,49].map((y,i)=>(
          <path key={i} d={`M12 ${y} Q32 ${y-2} 52 ${y}`}
            fill="none" stroke="#9A5220" strokeWidth="1.5" strokeOpacity="0.4"/>
        ))}
        {[19,25,31,37,43].map((x,i)=>(
          <path key={i} d={`M${x} 32 Q${x-1} 43 ${x} 53`}
            fill="none" stroke="#7A3E14" strokeWidth="0.9" strokeOpacity="0.28"/>
        ))}
        <rect x="10" y="30" width="44" height="6" rx="3" fill="url(#kr)"/>
        <rect x="10" y="30" width="44" height="3" rx="2" fill="white" fillOpacity="0.2"/>
        {count>0 && <>
          <circle cx="23" cy="27" r="5.5" fill="#FF8A6B" opacity="0.92"/>
          <circle cx="32" cy="25" r="6"   fill="#16D7C5" opacity="0.92"/>
          <circle cx="41" cy="27" r="5"   fill="#F59E0B" opacity="0.92"/>
        </>}
      </svg>
      {count>0 && (
        <div style={{ position:"absolute", top:-1, right:-1,
          minWidth:16, height:16, borderRadius:999,
          background:C.coral, color:"white", fontSize:8, fontWeight:900,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0 3px", border:"2px solid white",
          boxShadow:`0 2px 6px ${C.coral}66` }}>
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
      background:"rgba(249,246,242,0.90)",
      backdropFilter:"blur(24px) saturate(1.4)",
      WebkitBackdropFilter:"blur(24px) saturate(1.4)",
      borderBottom:"1px solid rgba(0,0,0,0.04)" }}>
      <div style={{ height:"env(safe-area-inset-top,0)" }}/>
      <div style={{ display:"flex", alignItems:"center",
        padding:"10px 20px", gap:12 }}>
        <div style={{ flex:1 }}>
          {userName ? (
            <div style={{ fontWeight:800, fontSize:19, color:C.ink,
              letterSpacing:-0.4 }}>
              Guten Morgen, {userName.split(" ")[0]} ✨
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <HuiLogo size={30}/>
              <div>
                <span style={{ fontWeight:800, fontSize:13, color:C.teal }}>H</span>
                <span style={{ fontWeight:700, fontSize:13, color:C.ink }}>uman </span>
                <span style={{ fontWeight:800, fontSize:13, color:C.coral }}>U</span>
                <span style={{ fontWeight:700, fontSize:13, color:C.ink }}>nited </span>
                <span style={{ fontWeight:800, fontSize:13, color:C.teal }}>I</span>
                <span style={{ fontWeight:700, fontSize:13, color:C.ink }}>ntelligent</span>
              </div>
            </div>
          )}
        </div>
        <Korb count={cart} size={30} onClick={onCart}/>
        <button onClick={onNotif}
          style={{ background:"none", border:"none", cursor:"pointer",
            padding:4, position:"relative", fontSize:19, lineHeight:1,
            WebkitTapHighlightColor:"transparent" }}>
          🔔
          {notif>0 && (
            <div style={{ position:"absolute", top:0, right:0,
              width:14, height:14, borderRadius:"50%",
              background:C.coral, color:"white", fontSize:7, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:"2px solid white" }}>{notif}</div>
          )}
        </button>
        {userName && (
          <div style={{ width:32, height:32, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.tealPale},${C.coralPale})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:13, color:C.teal,
            border:`2px solid ${C.teal}30` }}>
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

/* Soft custom SVG icons — premium, organic */
function NavIcon({ k, active }) {
  const col   = active ? C.teal : C.muted2;
  const glow  = active ? `drop-shadow(0 0 4px ${C.tealGlow})` : "none";
  const s = { width:22, height:22, filter:glow, transition:"filter 0.3s" };

  if(k==="feed") return (
    <svg width={s.width} height={s.height} style={{filter:s.filter,transition:s.transition}} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15.5V15.5H8.5V21H4C3.45 21 3 20.55 3 20V9.5Z"
        fill={active?"url(#nav-teal)":"none"} stroke={col} strokeWidth="1.6"
        strokeLinejoin="round"/>
      <defs>
        <linearGradient id="nav-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.teal}/>
          <stop offset="100%" stopColor={C.coral} stopOpacity="0.7"/>
        </linearGradient>
      </defs>
    </svg>
  );
  if(k==="impact") return (
    <svg width={s.width} height={s.height} style={{filter:s.filter,transition:s.transition}} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={col} strokeWidth="1.6"/>
      <path d="M12 7 Q16 9 15 13 Q12 10 12 7Z"
        fill={active?C.teal:col} opacity={active?1:0.65}/>
      <path d="M15 13 Q14 17 11 18" stroke={col}
        strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="16.5" cy="6.5" r="1.8"
        fill={active?C.gold:C.muted2} opacity={active?1:0.5}/>
    </svg>
  );
  if(k==="discover") return (
    <svg width={s.width} height={s.height} style={{filter:s.filter,transition:s.transition}} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={col} strokeWidth="1.6"/>
      <path d="M17 7L14 13.5L7 17L10 10.5L17 7Z"
        fill={active?"url(#nav-teal2)":"none"} stroke={col}
        strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill={active?C.teal:col}/>
      <defs>
        <linearGradient id="nav-teal2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.teal}/>
          <stop offset="100%" stopColor={C.coral} stopOpacity="0.6"/>
        </linearGradient>
      </defs>
    </svg>
  );
  if(k==="profile") return (
    <svg width={s.width} height={s.height} style={{filter:s.filter,transition:s.transition}} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.5" r="3.5"
        fill={active?"url(#nav-teal3)":"none"} stroke={col} strokeWidth="1.6"/>
      <path d="M5 20Q5 15 12 15Q19 15 19 20"
        stroke={col} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <defs>
        <linearGradient id="nav-teal3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.teal}/>
          <stop offset="100%" stopColor={C.coral} stopOpacity="0.7"/>
        </linearGradient>
      </defs>
    </svg>
  );
  return null;
}

function BottomNav({ tab, onTab, onCreate }) {
  const [pressed, setPressed] = useState(null);

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:100,
    }}>
      {/* Floating pill container */}
      <div style={{
        margin:"0 12px",
        marginBottom:"max(10px, env(safe-area-inset-bottom, 10px))",
        background:"rgba(252,250,247,0.88)",
        backdropFilter:"blur(32px) saturate(1.6)",
        WebkitBackdropFilter:"blur(32px) saturate(1.6)",
        borderRadius:32,
        border:"1px solid rgba(255,255,255,0.65)",
        boxShadow:`
          0 4px 6px rgba(0,0,0,0.04),
          0 12px 32px rgba(0,0,0,0.09),
          0 1px 0 rgba(255,255,255,0.8) inset
        `,
        display:"flex", alignItems:"center",
        justifyContent:"space-around",
        padding:"8px 6px",
        overflow:"visible",
      }}>
        {NAV.map((item,i)=>{
          if(!item) return (
            
            <button key="hui"
              onClick={onCreate}
              onTouchStart={()=>setPressed("hui")}
              onTouchEnd={()=>setPressed(null)}
              style={{
                background:"none", border:"none", cursor:"pointer",
                padding:0, lineHeight:0, flexShrink:0,
                WebkitTapHighlightColor:"transparent",
              }}>
              <div style={{
                width:54, height:54,
                borderRadius:18,
                marginTop:-26,
                background:`linear-gradient(145deg, ${C.teal}, #14C4B4 40%, ${C.coral})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                transform: pressed==="hui" ? "scale(0.92) translateY(2px)" : "scale(1) translateY(0)",
                transition:"transform 0.25s cubic-bezier(0.34,1.3,0.64,1)",
                boxShadow:`
                  0 0 0 3px rgba(252,250,247,0.9),
                  0 4px 6px rgba(0,0,0,0.10),
                  0 8px 24px rgba(22,215,197,0.35),
                  0 4px 12px rgba(255,138,107,0.20)
                `,
              }}>
                {/* HUI Logo SVG */}
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                  <rect x="2" y="2" width="60" height="60" rx="16"
                    fill="white" fillOpacity="0.18"/>
                  <rect x="2" y="2" width="60" height="30" rx="16"
                    fill="white" fillOpacity="0.10"/>
                  <text x="8" y="44" fontSize="28" fontWeight="900"
                    fill="white" fontFamily="-apple-system,system-ui"
                    letterSpacing="-1.5">HUI</text>
                </svg>
              </div>
            </button>
          );

          const active = tab===item.key;
          const isPressed = pressed===item.key;

          return (
            <button key={item.key}
              onClick={()=>onTab(item.key)}
              onTouchStart={()=>setPressed(item.key)}
              onTouchEnd={()=>setPressed(null)}
              style={{
                display:"flex", flexDirection:"column",
                alignItems:"center", gap:4,
                background:"none", border:"none",
                cursor:"pointer", padding:"4px 12px",
                borderRadius:20, position:"relative",
                WebkitTapHighlightColor:"transparent",
                transform: isPressed ? "scale(0.88)" : "scale(1)",
                transition:"transform 0.2s cubic-bezier(0.34,1.4,0.64,1)",
                minWidth:52,
              }}>

              {/* Active pill background */}
              {active && (
                <div style={{
                  position:"absolute", inset:0, borderRadius:20,
                  background:`linear-gradient(135deg,
                    rgba(22,215,197,0.10) 0%,
                    rgba(255,138,107,0.06) 100%)`,
                  border:`1px solid rgba(22,215,197,0.15)`,
                  transition:"opacity 0.3s",
                }}/>
              )}

              {/* Icon */}
              <div style={{
                position:"relative", zIndex:1,
                transform: active ? "translateY(-1px)" : "translateY(0)",
                transition:"transform 0.3s cubic-bezier(0.34,1.3,0.64,1)",
              }}>
                <NavIcon k={item.key} active={active}/>
              </div>

              {/* Label */}
              <span style={{
                fontSize:9, fontWeight: active ? 700 : 400,
                color: active ? C.teal : C.muted2,
                transition:"color 0.25s, font-weight 0.25s",
                letterSpacing: active ? 0.2 : 0,
                position:"relative", zIndex:1,
              }}>
                {item.label}
              </span>

              {/* Active dot */}
              {active && (
                <div style={{
                  position:"absolute", bottom:2,
                  width:3, height:3, borderRadius:"50%",
                  background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                  boxShadow:`0 0 4px ${C.teal}80`,
                }}/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   WIRKER SHEET — cinematic bottom sheet
═══════════════════════════════════════════════════ */
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
                border:`1.5px solid ${C.teal}55`,
                cursor:"pointer", fontSize:20,
                display:"flex", alignItems:"center",
                justifyContent:"center",
                boxShadow:`0 2px 12px ${C.tealGlow}`,
                WebkitTapHighlightColor:"transparent",
                transition:"transform 0.18s" }}>
              🗺
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
  const [showWirker,  setShowWirker]  = useState(null);
  const [showBooking, setShowBooking] = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showMatch,   setShowMatch]   = useState(false);
  const [showMap,     setShowMap]     = useState(false);
  const [showKorb,    setShowKorb]    = useState(false);
  const [cart,        setCart]        = useState([]);
  const [notif,       setNotif]       = useState(3);
  const [userName,    setUserName]    = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session) return;
      setCurrentUser(session.user);
      setUserName(
        session.user.user_metadata?.full_name ||
        session.user.email?.split("@")[0] || ""
      );
    });
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
              onView={w=>setShowWirker(w)}
              onBook={w=>setShowBooking(w)}
              onImpact={()=>setTab("impact")}
              onMatch={()=>setShowMatch(true)}
              onMap={()=>setShowMap(true)}
            />
          )}
          {tab==="impact" && (
            <ImpactPage currentUser={currentUser}/>
          )}
          {tab==="discover" && (
            <DiscoverPage
              onView={w=>setShowWirker(w)}
              onMap={()=>setShowMap(true)}
            />
          )}
              onMatch={()=>setShowMatch(true)}
            />
          )}
          {tab==="profile" && (
            <ProfilePage
              onTalentAnbieten={()=>setShowCreate(true)}
              onLogout={()=>{
                supabase.auth.signOut();
                window.location.href="/login";
              }}
            />
          )}
        </div>

        <BottomNav tab={tab} onTab={setTab}
          onCreate={()=>setShowCreate(true)}/>

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
        {showKorb   && <KorbPage cart={cart}
          onClose={()=>setShowKorb(false)}/>}
      </div>
    </>
  );
}
