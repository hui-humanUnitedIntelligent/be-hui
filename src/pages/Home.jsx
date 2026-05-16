import React, { useState, useEffect, useRef } from "react";
import { supabase }   from "../lib/supabaseClient";
import ImpactPage     from "./ImpactPage";
import ProfilePage from "./ProfilePage";
import BookingFlow    from "../components/BookingFlow";
import { WerkDetail, WerkCheckout, WerkeKorb } from "../components/WerkeShop";
import OrdersPage from "../components/OrdersPage";
import { useAuth } from "../lib/AuthContext";
import CreateFlow          from "../components/CreateFlow";
import TalentOnboarding   from "../components/TalentOnboarding";
import StoryComposer      from "../components/StoryComposer";
import WerkPublisher      from "../components/WerkPublisher";
import ExperienceCreator  from "../components/ExperienceCreator";
import QuickCreateSheet   from "../components/QuickCreateSheet";
import WirkerProfilePage from "../components/WirkerProfilePage";
import HuiMatchOverlay from "../components/HuiMatchOverlay";
import HuiSearchBar   from "../components/HuiSearchBar";
import LiveMapPage    from "./LiveMapPage";
import DiscoveryFeed  from "../components/DiscoveryFeed";
import { StoryBar, StoryViewer } from "../components/StoryBar";
import DiscoverPage   from "./DiscoverPage";
import ChatPage from "../components/ChatPage";
import NotificationCenter from "../components/NotificationCenter";
import { useNotifCount } from "../components/NotificationCenter";
import HuiMembershipFlow from "../components/HuiMembershipFlow";
import HuiCreateFlow  from "../components/HuiCreateFlow";
import HuiPlusSheet   from "../components/HuiPlusSheet";

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
    // normalizeProfileInput-kompatibel: type:"wirker" → onView routet zu WirkerProfilePage
    type:"wirker",
    name:"Lea Sommer", display_name:"Lea Sommer", talent:"Fotografin",
    city:"München", location_label:"München",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=90",
    avatar_url:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=90",
    header_img:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=90",
    score:4.9, posts:128, connections:312,
    quote:"Ich fange Momente ein, die bleiben. Echt, natürlich und voller Gefühl.",
    bio:"Fotografie ist meine Art, Geschichten zu erzählen. Mit natürlichem Licht. Mit echten Menschen.",
    focus_type:"works", is_available:true,
    werke:[
      {img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=85"},
      {img:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=85"},
      {img:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=85"},
    ],
  },
  {
    type:"wirker",
    name:"David Weber", display_name:"David Weber", talent:"Keramikkünstler",
    city:"Hamburg", location_label:"Hamburg",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=90",
    avatar_url:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90",
    header_img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90",
    score:4.8, posts:64, connections:189,
    quote:"Ton ist mein Medium — Stille ist meine Sprache.",
    bio:"Handgemachte Keramik mit Seele. Jedes Stück ein Dialog mit dem Material.",
    focus_type:"works", is_available:true, werke:[],
  },
  {
    type:"wirker",
    name:"Nina B.", display_name:"Nina B.", talent:"Yogalehrerin",
    city:"Stuttgart", location_label:"Stuttgart",
    img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=90",
    avatar_url:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=90",
    header_img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=90",
    score:4.9, posts:201, connections:445,
    quote:"Yoga ist keine Übung — es ist eine Art zu leben.",
    bio:"Ich begleite Menschen zu mehr Achtsamkeit und innerer Stärke.",
    focus_type:"experiences", is_available:true, werke:[],
  },
  {
    type:"wirker",
    name:"Marcus B.", display_name:"Marcus B.", talent:"Videograf",
    city:"Berlin", location_label:"Berlin",
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=90",
    avatar_url:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=90",
    bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=900&q=90",
    header_img:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=900&q=90",
    score:4.7, posts:93, connections:267,
    quote:"Bewegte Bilder, die bewegen.",
    bio:"Dokumentarische Videografie für Menschen mit Haltung.",
    focus_type:"hybrid", is_available:true, werke:[],
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
  /* hui-pulse-ring removed — Orb handles all pulse animations */
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
function Header({ userName, avatarUrl }) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:60,
      background:"rgba(255,251,248,0.88)",
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

        {/* ── Right: Avatar only ── */}
        {(avatarUrl || userName) && (
          <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0,
            overflow:"hidden",
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:13, color:"white",
            boxShadow:`0 2px 8px ${C.tealGlow}` }}>
            {avatarUrl
              ? <img loading="lazy" decoding="async" src={avatarUrl} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}
                  onError={e=>{e.target.style.display="none"}}/>
              : userName?.[0]?.toUpperCase()
            }
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
  null,                               // Orb-Slot
  {key:"discover", label:"Entdecken"},
  {key:"chat",     label:"Chat"},     // Chat ersetzt Mein HUI
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

  /* CHAT — speech bubble mit warmem Akzent */
  if(k==="chat") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H7L12 22L17 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        fill={active ? `${C.teal}18` : "rgba(80,80,80,0.08)"}
        stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8"  cy="11" r="1" fill={active ? C.teal : col}/>
      <circle cx="12" cy="11" r="1" fill={active ? C.coral : col}/>
      <circle cx="16" cy="11" r="1" fill={active ? C.teal : col}/>
    </svg>
  );

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   HUI BOTTOM NAVIGATION — v3
   5 Tabs: Home · Impact · [Orb] · Entdecken · Chat
   Orb: fest eingebettet, Floating Card Menü (slide-up)
   Design: Premium Ruhe · Glassmorphism · Ambient Glow
═══════════════════════════════════════════════════════════════ */

const BN_CSS = `
  /* ── Orb Breathing Glow — meditative, matter, premium ── */
  @keyframes hui-orb-breathe-glow {
    0%,100% {
      box-shadow:
        0 4px 18px rgba(22,215,197,0.13),
        0 1px 4px  rgba(0,0,0,0.08),
        0 1px 0    rgba(255,255,255,0.50) inset;
    }
    50% {
      box-shadow:
        0 6px 26px rgba(22,215,197,0.22),
        0 1px 4px  rgba(0,0,0,0.08),
        0 1px 0    rgba(255,255,255,0.50) inset;
    }
  }
  /* ── Card Appear — weich, aus dem Orb entstehend ── */
  @keyframes hui-card-in {
    from { opacity:0; transform:translateX(-50%) translateY(14px) scale(0.98); }
    to   { opacity:1; transform:translateX(-50%) translateY(0)    scale(1);    }
  }
  @keyframes hui-overlay-in { from{opacity:0} to{opacity:1} }

  /* ── Tab Buttons ── */
  .hui-bn-btn {
    display:flex; flex-direction:column; align-items:center; gap:4px;
    background:none; border:none; cursor:pointer; padding:5px 8px 4px;
    border-radius:16px; position:relative; min-width:50px; min-height:46px;
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.18s cubic-bezier(0.34,1.4,0.64,1);
    justify-content:center;
  }
  .hui-bn-btn:active { transform:scale(0.88); }
  .hui-bn-label {
    font-size:9.5px; font-weight:500; letter-spacing:0.04px;
    color:rgba(55,55,55,0.55);
    transition:color 0.22s ease, font-weight 0.22s ease;
    font-family:inherit; line-height:1;
  }
  .hui-bn-label--active {
    color:#16D7C5; font-weight:700;
  }
  .hui-bn-active-pill {
    position:absolute; inset:0; border-radius:16px; pointer-events:none;
    background:linear-gradient(150deg,
      rgba(22,215,197,0.07) 0%,
      rgba(255,138,107,0.03) 100%);
    border:1px solid rgba(22,215,197,0.11);
  }
  .hui-bn-dot {
    position:absolute; bottom:2px; left:50%; transform:translateX(-50%);
    width:3px; height:3px; border-radius:50%;
    background:linear-gradient(135deg,#16D7C5,#FF8A6B);
    box-shadow:0 0 3px rgba(22,215,197,0.45);
  }

  /* ── Orb Button ── */
  .hui-orb-btn {
    width:54px; height:54px; border-radius:50%; border:none; cursor:pointer;
    flex-shrink:0; position:relative; margin-top:-10px;
    -webkit-tap-highlight-color:transparent;
    /* Subtile Glassmorphism — kein Neon, kein Gaming */
    background:radial-gradient(circle at 36% 30%,
      rgba(255,255,255,0.86) 0%,
      rgba(255,252,248,0.70) 42%,
      rgba(22,215,197,0.07) 100%);
    backdrop-filter:blur(28px) saturate(1.45);
    -webkit-backdrop-filter:blur(28px) saturate(1.45);
    border:1px solid rgba(255,255,255,0.44);
    transition:
      transform 0.30s cubic-bezier(0.34,1.30,0.64,1),
      box-shadow 0.45s ease;
    will-change:transform, box-shadow;
  }
  .hui-orb-btn:active { transform:scale(0.90); }

  /* Idle: ruhiges Breathing (6s — fast meditativ) */
  @media (prefers-reduced-motion:no-preference) {
    .hui-orb-btn.hui-orb-btn--idle {
      animation:hui-orb-breathe-glow 6s ease-in-out infinite;
    }
  }

  /* Open: leicht elevated, nicht dominant */
  .hui-orb-btn.hui-orb-btn--open {
    transform:scale(1.05);
    box-shadow:
      0 6px 28px rgba(22,215,197,0.22),
      0 2px 8px  rgba(0,0,0,0.09),
      0 1px 0    rgba(255,255,255,0.55) inset;
  }

  /* Glass-Ring — kaum sichtbar, nur als Tiefenhinweis */
  .hui-orb-ring {
    position:absolute; inset:-4px; border-radius:50%;
    border:1px solid rgba(255,255,255,0.26); pointer-events:none;
  }
  /* Top-left Reflektion — wie Apple VisionOS */
  .hui-orb-highlight {
    position:absolute; top:8px; left:9px; width:24px; height:12px;
    border-radius:50%; pointer-events:none;
    background:radial-gradient(ellipse,rgba(255,255,255,0.72) 0%,transparent 100%);
    filter:blur(1.5px); transform:rotate(-22deg); opacity:0.75;
  }
  .hui-orb-icon {
    position:absolute; inset:0; display:flex; align-items:center;
    justify-content:center; border-radius:50%; overflow:hidden;
  }

  /* ── Floating Card ── */
  .hui-orb-card {
    position:fixed;
    /* Zentrierung: transform enthält translateX(-50%) aus cardStyle */
    background:rgba(253,250,247,0.96);
    backdrop-filter:blur(32px) saturate(1.55);
    -webkit-backdrop-filter:blur(32px) saturate(1.55);
    border:1px solid rgba(255,255,255,0.72);
    box-shadow:
      0 4px 6px   rgba(0,0,0,0.04),
      0 12px 40px rgba(0,0,0,0.09),
      0 1px 0     rgba(255,255,255,0.92) inset;
    border-radius:22px;
    padding:6px 0;
    z-index:101;
    width:232px;
    /* Animation: transform-origin bottom center, transform via keyframe */
    animation:hui-card-in 0.30s cubic-bezier(0.34,1.25,0.64,1) both;
  }

  /* Card Row */
  .hui-orb-card-item {
    display:flex; align-items:center; gap:14px;
    padding:13px 18px; cursor:pointer;
    min-height:56px;
    border:none; background:none; width:100%;
    -webkit-tap-highlight-color:transparent;
    transition:background 0.18s ease;
    border-radius:0;
    font-family:inherit;
    text-align:left;
  }
  .hui-orb-card-item:active {
    background:rgba(22,215,197,0.05);
  }
  .hui-orb-card-item:first-child { border-radius:22px 22px 0 0; }
  .hui-orb-card-item:last-child  { border-radius:0 0 22px 22px; }

  /* Divider — kaum sichtbar */
  .hui-orb-card-divider {
    height:1px; margin:0 18px;
    background:linear-gradient(
      90deg,
      transparent 0%,
      rgba(0,0,0,0.055) 30%,
      rgba(0,0,0,0.055) 70%,
      transparent 100%
    );
  }

  /* Icon Wrapper in Card — soft ambient glow on tap */
  .hui-orb-card-icon {
    width:34px; height:34px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:rgba(255,255,255,0.70);
    border:1px solid rgba(0,0,0,0.055);
    box-shadow:0 1px 4px rgba(0,0,0,0.06);
    transition:background 0.18s ease, box-shadow 0.18s ease;
  }
  .hui-orb-card-item:active .hui-orb-card-icon {
    background:rgba(255,255,255,0.90);
    box-shadow:0 2px 8px rgba(22,215,197,0.12);
  }

  /* Overlay — nahezu unsichtbar, 5% Darkness */
  .hui-orb-overlay {
    position:fixed; inset:0; z-index:100;
    background:rgba(10,8,5,0.05);
    animation:hui-overlay-in 0.20s ease both;
  }
`;

function BottomNav({ tab, onTab, onOrbAction, notifCount=0, msgCount=0, hasTalent=false, authProfile=null }) {
  const [pressed,   setPressed]  = React.useState(null);
  const [orbOpen,   setOrbOpen]  = React.useState(false);
  const [orbAnim,   setOrbAnim]  = React.useState(false); // breathing

  // Scroll → Orb schließen
  React.useEffect(() => {
    if (!orbOpen) return;
    const el = document.querySelector(".hui-scroll");
    if (!el) return;
    const h = () => setOrbOpen(false);
    el.addEventListener("scroll", h, { passive:true });
    return () => el.removeEventListener("scroll", h);
  }, [orbOpen]);

  // Tab-Wechsel → Orb schließen
  React.useEffect(() => { setOrbOpen(false); }, [tab]);

  // Orb idle breathing — startet nach mount
  React.useEffect(() => {
    const t = setTimeout(() => setOrbAnim(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleOrbAction = React.useCallback((key) => {
    setOrbOpen(false);
    onOrbAction?.(key);
  }, [onOrbAction]);

  // Orb Menü Karten-Position: direkt über dem Orb, mittig
  // Orb sitzt mittig. Card-Breite ca. 220px → links: calc(50% - 110px)
  // Bottom: BottomNav-Höhe + safe-area + 12px Luft
  // Card: exakt über dem Orb zentriert
  // BottomNav-Pill: ca. 66px hoch + 10px margin + safe-area
  // Card bottom: Oberkante Nav + 10px Luft
  const cardStyle = {
    left: "50%",
    // transform ist im @keyframes hui-card-in definiert (translateX(-50%) bleibt erhalten)
    bottom: `calc(66px + max(10px, env(safe-area-inset-bottom, 10px)) + 12px)`,
  };

  const ORB_MENU = [
    {
      key:"favorites",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      label: "Favoriten",
      sub:   "Deine gespeicherten Talente",
    },
    {
      key:"create",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16D7C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8"  y1="12" x2="16" y2="12"/>
        </svg>
      ),
      label: "Erstellen",
      sub:   hasTalent ? "Story · Werk · Erlebnis" : "Wirker werden",
    },
    {
      key:"profile",
      icon: (
        <div style={{
          width:26, height:26, borderRadius:"50%", overflow:"hidden", flexShrink:0,
          background:"linear-gradient(135deg,#16D7C5,#FF8A6B)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {authProfile?.avatar_url
            ? <img src={authProfile.avatar_url} alt="Profil"
                style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                onError={e=>{e.target.style.display="none";}}/>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          }
        </div>
      ),
      label: "Mein HUI",
      sub:   "Profil · Einstellungen · Impact",
    },
    {
      key:"notifs",
      icon: (
        <div style={{ position:"relative", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && (
            <div style={{
              position:"absolute", top:-2, right:-2,
              minWidth:14, height:14, borderRadius:7,
              background:"linear-gradient(135deg,#FF5F5F,#FF8A6B)",
              color:"white", fontSize:8, fontWeight:800,
              display:"flex", alignItems:"center", justifyContent:"center",
              padding:"0 3px", border:"1.5px solid rgba(255,251,248,0.96)",
            }}>{notifCount > 9 ? "9+" : notifCount}</div>
          )}
        </div>
      ),
      label: "Mitteilungen",
      sub:   notifCount > 0 ? `${notifCount} neue Benachrichtigung${notifCount>1?"en":""}` : "Keine neuen Mitteilungen",
    },
  ];

  return (
    <>
      <style>{BN_CSS}</style>

      {/* Overlay zum Schließen */}
      {orbOpen && (
        <div className="hui-orb-overlay" onClick={() => setOrbOpen(false)} aria-hidden="true"/>
      )}

      {/* Floating Card */}
      {orbOpen && (
        <div className="hui-orb-card" style={cardStyle} role="dialog" aria-label="HUI Menü">
          {ORB_MENU.map((item, idx) => (
            <React.Fragment key={item.key}>
              {idx > 0 && <div className="hui-orb-card-divider"/>}
              <button
                className="hui-orb-card-item"
                onClick={() => handleOrbAction(item.key)}
                aria-label={item.label}
              >
                <div className="hui-orb-card-icon">{item.icon}</div>
                <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                  <div style={{
                    fontSize:14.5, fontWeight:600, color:"#1A1A1A",
                    letterSpacing:-0.15, lineHeight:1.25,
                  }}>{item.label}</div>
                  <div style={{
                    fontSize:11.5, color:"rgba(55,55,55,0.48)",
                    marginTop:2, lineHeight:1.35, fontWeight:400,
                    letterSpacing:0.05,
                  }}>{item.sub}</div>
                </div>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Bottom Nav Pill */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        pointerEvents:"none",
      }}>
        <div style={{
          margin:"0 10px",
          marginBottom:"max(10px, env(safe-area-inset-bottom, 10px))",
          background:"rgba(255,251,248,0.90)",
          backdropFilter:"blur(36px) saturate(1.8)",
          WebkitBackdropFilter:"blur(36px) saturate(1.8)",
          borderRadius:28,
          border:"1px solid rgba(255,255,255,0.65)",
          boxShadow:`
            0 2px 4px rgba(0,0,0,0.03),
            0 8px 28px rgba(0,0,0,0.09),
            0 1px 0 rgba(255,255,255,0.92) inset
          `,
          display:"flex", alignItems:"center",
          justifyContent:"space-between",
          padding:"4px 6px",
          height:66,
          pointerEvents:"auto",
        }}>
          {NAV.map((item, i) => {

            /* ── Orb Slot ── */
            if (!item) return (
              <button
                key="orb"
                className={`hui-orb-btn${orbOpen ? " hui-orb-btn--open" : (orbAnim ? " hui-orb-btn--idle" : "")}`}
                onClick={() => setOrbOpen(o => !o)}
                aria-label={orbOpen ? "Menü schließen" : "Menü öffnen"}
                aria-expanded={orbOpen}
              >
                <div className="hui-orb-ring"/>
                <div className="hui-orb-highlight"/>
                <div className="hui-orb-icon">
                  {/* Logo — sichtbar wenn geschlossen */}
                  <div style={{
                    position:"absolute",
                    opacity:   orbOpen ? 0 : 1,
                    transform: orbOpen ? "scale(0.72) rotate(-18deg)" : "scale(1) rotate(0deg)",
                    transition:"opacity 0.26s ease, transform 0.34s cubic-bezier(0.34,1.3,0.64,1)",
                  }}>
                    <img src="/hui-logo.jpg" alt="HUI" loading="eager" decoding="async"
                      style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", display:"block" }}
                      onError={e=>{e.target.style.display="none";}}/>
                  </div>
                  {/* ✕ — sichtbar wenn offen */}
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                    style={{
                      position:"absolute",
                      opacity:   orbOpen ? 1 : 0,
                      transform: orbOpen ? "rotate(0deg) scale(1)" : "rotate(-45deg) scale(0.55)",
                      transition:"opacity 0.24s ease, transform 0.34s cubic-bezier(0.34,1.4,0.64,1)",
                    }}>
                    <line x1="3" y1="9" x2="15" y2="9" stroke="#16D7C5" strokeWidth="2.2" strokeLinecap="round"/>
                    <line x1="9" y1="3" x2="9"  y2="15" stroke="#16D7C5" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </div>
                {/* Notif-Dot */}
                {!orbOpen && notifCount > 0 && (
                  <div style={{
                    position:"absolute", top:3, right:3,
                    width:7, height:7, borderRadius:"50%",
                    background:"linear-gradient(135deg,#FF8A6B,#FF5F5F)",
                    border:"1.5px solid rgba(255,251,248,0.95)",
                    boxShadow:"0 0 5px rgba(255,138,107,0.7)",
                  }}/>
                )}
              </button>
            );

            /* ── Standard Tab ── */
            const active    = tab === item.key || (item.key === "chat" && false);
            const isActive  = tab === item.key;
            const isPressed = pressed === item.key;

            return (
              <button
                key={item.key}
                className="hui-bn-btn"
                onClick={() => onTab(item.key)}
                onTouchStart={() => setPressed(item.key)}
                onTouchEnd={() => setPressed(null)}
                style={{ transform: isPressed ? "scale(0.88)" : "scale(1)" }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && <div className="hui-bn-active-pill"/>}
                <div style={{
                  position:"relative", zIndex:1,
                  transform: isActive ? "translateY(-1px) scale(1.06)" : "translateY(0) scale(1)",
                  transition:"transform 0.24s cubic-bezier(0.34,1.3,0.64,1)",
                }}>
                  <NavIcon k={item.key} active={isActive}/>
                  {/* Chat unread badge */}
                  {item.key === "chat" && msgCount > 0 && (
                    <div style={{
                      position:"absolute", top:-3, right:-5,
                      minWidth:14, height:14, borderRadius:7,
                      background:"linear-gradient(135deg,#FF5F5F,#FF8A6B)",
                      color:"white", fontSize:7.5, fontWeight:800,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      padding:"0 3px", border:"1.5px solid rgba(255,251,248,0.96)",
                    }}>{msgCount > 9 ? "9+" : msgCount}</div>
                  )}
                </div>
                <span className={`hui-bn-label${isActive ? " hui-bn-label--active" : ""}`}>
                  {item.label}
                </span>
                {isActive && <div className="hui-bn-dot"/>}
              </button>
            );
          })}
        </div>
      </div>
    </>
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
          <img loading="lazy" decoding="async" src={w.bg} alt={w.name}
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
              <img loading="lazy" decoding="async" src={w.img} alt={w.name}
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
                  <img loading="lazy" decoding="async" src={wk.img} alt=""
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

          {/* ── HUI Smart Search + Match ── */}
          <HuiSearchBar
            onMatchClick={onMatch}
            onKarteClick={onMap}
          />
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
              <img loading="lazy" decoding="async" src={w.img} alt={w.name}
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
              <img loading="lazy" decoding="async" src={w.img} alt={w.title}
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
            <img loading="lazy" decoding="async" src={ex.img} alt={ex.title}
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
   RIGHT ACTION BAR — Floating Quick Actions
   Only visible on Feed tab. Glassmorphism, HUI style.
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════ */
export default function Home() {
  const [tab,         setTab]         = useState("feed");
  const { user, isWirker: authIsWirker, hasTalentProfile, activateTalentProfile, loadingProfile, profile: authProfile, wirkerProfile, signOut: authSignOut } = useAuth();
  const [isWirker,    setIsWirker]    = useState(false);  // transforms centre btn
  const [showTalentFlow, setShowTalentFlow] = useState(false); // "Wirker werden" flow
  const [showCreateSheet, setShowCreateSheet] = useState(false); // wirker create menu
  const [showWirker,  setShowWirker]  = useState(null);
  const [showBooking, setShowBooking] = useState(null);
  const [showWerkDetail,  setShowWerkDetail]  = useState(null);  // werk detail view
  const [showWerkCheckout,setShowWerkCheckout]= useState(null);  // werk checkout
  const [showWerkeKorb,   setShowWerkeKorb]   = useState(false); // korb sheet
  const [showStoryComposer,   setShowStoryComposer]   = useState(false);
  const [activeStory,         setActiveStory]         = useState(null);

  // StoryBar "+" Button Event
  React.useEffect(() => {
    const handler = () => setShowStoryComposer(true);
    document.addEventListener("hui:open-story-composer", handler);
    return () => document.removeEventListener("hui:open-story-composer", handler);
  }, []);
  const [storyRefreshKey,     setStoryRefreshKey]     = useState(0);
  const [showWerkPublisher,   setShowWerkPublisher]   = useState(false);
  const [showExperienceCreator,setShowExperienceCreator]= useState(false);

  // Sync wirker status from AuthContext
  useEffect(() => {
    if (authIsWirker || hasTalentProfile) setIsWirker(true);
  }, [authIsWirker, hasTalentProfile]);
  const [showMatch,   setShowMatch]   = useState(false);
  const [activeMood,   setActiveMood]   = useState(null);  // HUI Match Stimmung
  const [showMap,     setShowMap]     = useState(false);
  const [showKorb,    setShowKorb]    = useState(false);
  const [cart,        setCart]        = useState([]);
  const [notif,       setNotif]       = useState(3);
  const [showChat,     setShowChat]     = useState(false);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const liveNotifCount = useNotifCount();
  const [userName,    setUserName]    = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  // ── New simplified flows ──
  const [showMembership,  setShowMembership]  = useState(false);
  const [showCreateFlow,  setShowCreateFlow]  = useState(false);
  const [showPlusSheet,   setShowPlusSheet]   = useState(false);  // Type-Selector Sheet
  const [createType,      setCreateType]      = useState(null);   // "moment"|"werk"|"erlebnis"|"story"
  // hasTalentProfile → from AuthContext (Supabase source-of-truth)
  // isTalent is a real useState — seeds from localStorage instantly,
  // syncs with AuthContext as soon as profile loads
  const [isTalent, setIsTalent] = useState(
    () => localStorage.getItem("hui_talent") === "1"
  );
  useEffect(() => {
    if (hasTalentProfile) {
      // Supabase confirmed talent → lock it in
      localStorage.setItem("hui_talent", "1");
      setIsTalent(true);
    }
    // IMPORTANT: we never call setIsTalent(false) here.
    // Only explicit user cancellation should do that.
  }, [hasTalentProfile]);

  // Safety net: re-read localStorage on every mount
  // (handles edge case where useState() ran before localStorage was set)
  useEffect(() => {
    if (localStorage.getItem("hui_talent") === "1") {
      setIsTalent(true);
    }
  }, []);

  // Session data comes from AuthContext — no separate getSession() needed
  useEffect(() => {
    if (authProfile) {
      setCurrentUser(authProfile);
      setUserName(authProfile.display_name || authProfile.email?.split("@")[0] || "");
    }
  }, [authProfile?.id]);  // only re-run when user actually changes

  // ── ZENTRALER TAB-WECHSEL ────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const switchTab = React.useCallback((newTab) => {
    setShowWirker(null);
    setShowBooking(null);
    setShowWerkDetail(null);
    setShowWerkCheckout(null);
    setShowWerkeKorb(false);
    setShowStoryComposer(false);
    setShowWerkPublisher(false);
    setShowExperienceCreator(false);
    setShowMatch(false);
    setShowMap(false);
    setShowKorb(false);
    setShowChat(false);
    setShowNotifs(false);
    setShowCreateSheet(false);
    setShowMembership(false);
    setShowCreateFlow(false);
    setShowPlusSheet(false);
    setCreateType(null);
    setTab(newTab);
  }, []);

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
          userName={userName}
          avatarUrl={authProfile?.avatar_url || null}
        />

        <div className="hui-scroll"
          style={{ flex:1, overflowY:"auto", overflowX:"hidden",
            WebkitOverflowScrolling:"touch" }}>

          {tab==="feed" && (
            <>
              <DiscoveryFeed
                onView={(w) => (w.type==="werk" || (w.price && w.type!=="wirker" && w.type!=="talent" && w.type!=="profile")) ? setShowWerkDetail(w) : setShowWirker(w)}
                onBook={(w) => setShowBooking(w)}
                onImpact={() => switchTab("impact")}
                onMatch={() => setShowMatch(true)}
                onMap={() => setShowMap(true)}
                onBuyWerk={(w) => setShowWerkCheckout([w])}
                onAddToKorb={(w) => { setCart(p => [...p, w]); }}
                storyRefreshKey={storyRefreshKey}
                onOpenComposer={() => setShowStoryComposer(true)}
                activeMood={activeMood}
              />
            </>
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
          {tab==="chat" && (
            <ChatPage onClose={() => switchTab("feed")} />
          )}
          {tab==="profile" && (
            <ProfilePage
              onTalentAnbieten={()=>setShowMembership(true)}
              onLogout={()=>{
                supabase.auth.signOut();
                window.location.href="/login";
              }}
              onViewPublicProfile={async ()=>{
                // Eigenes öffentliches Profil im WirkerProfilePage öffnen
                let uid = authProfile?.id;
                if (!uid) {
                  try {
                    const { data: { user: u } } = await supabase.auth.getUser();
                    uid = u?.id;
                  } catch { /* ignore */ }
                }
                if (!uid) return;
                setShowWirker({
                  id:          uid,
                  user_id:     uid,
                  username:    authProfile?.username    || null,
                  display_name:authProfile?.display_name|| null,
                  avatar_url:  authProfile?.avatar_url  || null,
                  talent:      authProfile?.talent      || null,
                  focus_type:  authProfile?.focus_type  || "hybrid",
                  header_img:  authProfile?.header_img  || null,
                  bio:         authProfile?.bio         || null,
                  dna_tags:    authProfile?.dna_tags    || [],
                });
              }}
            />
          )}
        </div>

        <BottomNav
          tab={tab}
          onTab={(key) => {
            if (key === "chat") { setShowChat(true); return; }
            switchTab(key);
          }}
          hasTalent={isTalent}
          authProfile={authProfile}
          notifCount={liveNotifCount}
          msgCount={0}
          onOrbAction={(key) => {
            if (key === "favorites")  { /* TODO: FavoritesPage öffnen */ }
            if (key === "create") {
              if (isTalent) { setCreateType(null); setShowPlusSheet(true); }
              else setShowMembership(true);
            }
            if (key === "profile") {
              // "Mein HUI" → öffnet eigenes öffentliches Profil
              // WirkerProfilePage erkennt Owner automatisch via isOwner
              const p   = authProfile;
              const uid = p?.id || user?.id;
              if (!uid) { console.warn("[MeinHUI] keine uid — authProfile:", p, "user:", user); return; }
              setShowWirker({
                id:            uid,
                user_id:       uid,
                username:      p?.username      || null,
                display_name:  p?.display_name  || null,
                avatar_url:    p?.avatar_url    || null,
                talent:        p?.talent        || null,
                focus_type:    p?.focus_type    || "hybrid",
                header_img:    p?.header_img    || null,
                bio:           p?.bio           || null,
                dna_tags:      p?.dna_tags      || [],
                _isOwnProfile: true,
              });
            }
            if (key === "notifs") setShowNotifs(true);
          }}
        />


        {/* Overlays */}
        {showMap && <LiveMapPage onView={w=>{setShowWirker(w);setShowMap(false);}} onMatch={()=>{setShowMap(false);setShowMatch(true);}} onClose={()=>setShowMap(false)} fullscreen={true}/>}
        {showMatch  && <HuiMatchOverlay onClose={()=>setShowMatch(false)}
          onMoodSelect={(m)=>{ setActiveMood(m); setShowMatch(false); }}
          onView={w=>{setShowWirker(w);setShowMatch(false);}}/> }
        {showWirker && (
        <WirkerProfilePage
          wirker={showWirker}
          onClose={()=>setShowWirker(null)}
          onBook={w=>{setShowWirker(null);setShowBooking(w);}}
          onEdit={(_p) => {
            // Owner → Profil bearbeiten → öffnet ProfilePage (privater Bereich)
            setShowWirker(null);
            switchTab("profile");
          }}
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

      {/* ── Quick Create Flows ── */}
      
      {/* ── STORY VIEWER ── */}
      {activeStory && (
        <StoryViewer
          data={activeStory}
          onClose={() => setActiveStory(null)}
          onViewProfile={(story) => {
            // Story-Creator-Profil öffnen via WirkerProfilePage
            setActiveStory(null);
            if (story?.user_id || story?.id) {
              setShowWirker({
                id:           story.user_id || story.id,
                user_id:      story.user_id || story.id,
                username:     story.username     || null,
                display_name: story.username     || null,
                avatar_url:   story.avatar_url   || null,
                talent:       story.talent       || story.focus_label || null,
                type:         "wirker",
              });
            }
          }}
        />
      )}
      {showStoryComposer && (
        <StoryComposer
          onClose={() => setShowStoryComposer(false)}
          onSuccess={() => {
            setShowStoryComposer(false);
            setStoryRefreshKey(p => p + 1);
          }}
        />
      )}
      {showWerkPublisher && (
        <WerkPublisher
          onClose={() => setShowWerkPublisher(false)}
          onSuccess={() => setShowWerkPublisher(false)}
        />
      )}
      {showExperienceCreator && (
        <ExperienceCreator
          onClose={() => setShowExperienceCreator(false)}
          onSuccess={() => setShowExperienceCreator(false)}
        />
      )}

      {/* ── Quick Create Sheet ── */}
      {showCreateSheet && (
        <QuickCreateSheet
          onClose={() => setShowCreateSheet(false)}
          onSelect={(type) => {
            setShowCreateSheet(false);
            if (type === "story")      setShowStoryComposer(true);
            if (type === "werk")       setShowWerkPublisher(true);
            if (type === "experience") setShowExperienceCreator(true);
          }}
        />
      )}

      {showChat && (
        <ChatPage onClose={() => setShowChat(false)} />
      )}
      {showNotifs && (
        <NotificationCenter
          onClose={() => setShowNotifs(false)}
          onNavigate={(url) => { setShowNotifs(false); }}
        />
      )}

      {/* ── HUI Membership Flow (neues Onboarding) ── */}
      {showMembership && (
        <HuiMembershipFlow
          onClose={() => setShowMembership(false)}
          onComplete={async (focusType) => {
            // Show Plus-Button immediately (optimistic update)
            setIsTalent(true);
            localStorage.setItem("hui_talent", "1");
            setShowMembership(false);
            // Persist to Supabase — including focus_type
            activateTalentProfile(focusType || "hybrid");
          }}
        />
      )}

      {/* ── HUI Plus Sheet — Type Selector ── */}
      {showPlusSheet && (
        <HuiPlusSheet
          onClose={() => setShowPlusSheet(false)}
          onSelect={(type) => {
            setShowPlusSheet(false);
            setCreateType(type);
            setShowCreateFlow(true);
          }}
        />
      )}

      {/* ── HUI Create Flow — Content Creator ── */}
      {showCreateFlow && (
        <HuiCreateFlow
          initialType={createType}
          onClose={() => { setShowCreateFlow(false); setCreateType(null); }}
          onSuccess={() => {
            setShowCreateFlow(false);
            setCreateType(null);
            setStoryRefreshKey(p => p + 1);
          }}
        />
      )}
    </>
  );
}