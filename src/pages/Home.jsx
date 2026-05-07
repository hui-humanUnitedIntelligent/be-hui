import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import ImpactPage    from "./ImpactPage";
import ProfilePage   from "./ProfilePage";
import BookingFlow   from "../components/BookingFlow";
import CreateFlow    from "../components/CreateFlow";

/* ── Brand ───────────────────────────────────── */
const C = {
  teal:"#4A9B9B", teal2:"#7EC8C8", tealPale:"#E6F5F5",
  coral:"#E8957A", coral2:"#F0B8A4", coralPale:"#FDF0EA",
  cream:"#F9F7F4", sand:"#E8E0D5",
  card:"#FFFFFF", ink:"#2C2C2C", ink2:"#4A4A4A",
  muted:"#6B6B6B", muted2:"#AAAAAA",
  border:"#EFEFEF", borderWarm:"#E8E0D5",
  gold:"#F59E0B", green:"#10B981",
};

/* ── Mock data ───────────────────────────────── */
const WIRKERS = [
  { name:"Lea Sommer",  talent:"Fotografin",       city:"München",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=85",
    score:4.9, posts:128, connections:312,
    quote:"Ich fange Momente ein, die bleiben. Echt, natürlich und voller Gefühl.",
    bio:"Fotografie ist für mich mehr als ein Beruf – es ist meine Art, Geschichten zu erzählen. Ich liebe es, mit natürlichem Licht zu arbeiten und Menschen in ihrer Echtheit zu zeigen.",
    werke:[
      {img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80"},
      {img:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80"},
      {img:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80"},
    ]},
  { name:"David Weber", talent:"Keramikkünstler",  city:"Hamburg",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=85",
    score:4.8, posts:64,  connections:189,
    quote:"Ton ist mein Medium — Stille ist meine Sprache.",
    bio:"Handgemachte Keramik mit Seele. Jedes Stück entsteht im Dialog mit dem Material und trägt die Energie des Augenblicks in sich.",
    werke:[]},
  { name:"Nina B.",     talent:"Yogalehrerin",     city:"Stuttgart",
    img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=85",
    score:4.9, posts:201, connections:445,
    quote:"Yoga ist keine Übung — es ist eine Art zu leben.",
    bio:"Ich begleite Menschen auf ihrem Weg zu mehr Achtsamkeit, Ruhe und innerer Stärke.",
    werke:[]},
  { name:"Marcus B.",   talent:"Videograf",        city:"Berlin",
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=800&q=85",
    score:4.7, posts:93,  connections:267,
    quote:"Bewegte Bilder, die bewegen.",
    bio:"Dokumentarische Videografie für Menschen und Marken mit Haltung.",
    werke:[]},
];

const WERKE = [
  { title:"Handgefertigte Keramikschale", price:"€89",  h:220,
    img:"https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=85"},
  { title:"Zwischen Licht und Wellen",    price:"€320", h:270,
    img:"https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&q=85"},
  { title:"Leder-Rucksack (handgenäht)", price:"€195", h:200,
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=85"},
  { title:"Aquarell Original (A3)",       price:"€120", h:240,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=85"},
];

const DISCOVER_EVENTS = [
  { title:"Live Musik Abend",   sub:"Heute · 19:30 · München",  tag:"Heute",   tagColor:C.teal,
    img:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80"},
  { title:"Keramik Workshop",   sub:"Morgen · 10:00 · Hamburg", tag:"Morgen",  tagColor:C.coral,
    img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80"},
];

const CATS = [
  {icon:"🔨", label:"Handwerk",      bg:C.tealPale,   color:C.teal},
  {icon:"🎨", label:"Kunst & Design",bg:C.coralPale,  color:C.coral},
  {icon:"📷", label:"Fotografie",    bg:"#EDE9FE",    color:"#7C3AED"},
  {icon:"💬", label:"Coaching",      bg:"#FFFBEB",    color:C.gold},
];

const MATCH_HINTS = [
  "Fotograf für meine Hochzeit",
  "Yogakurs in München",
  "Handgemachte Keramik",
  "Gitarrenunterricht",
  "Imagefilm für mein Unternehmen",
];

/* ═══════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════ */
function HeartBtn({ white=false, size=32 }) {
  const [liked, setLiked] = useState(false);
  const [pop,   setPop]   = useState(false);
  function tap(e) {
    e.stopPropagation();
    setPop(true); setTimeout(()=>setPop(false),380);
    setLiked(p=>!p);
  }
  return (
    <button onClick={tap}
      style={{ width:size, height:size, borderRadius:"50%",
        background:"rgba(255,255,255,0.22)", backdropFilter:"blur(8px)",
        border:"1px solid rgba(255,255,255,0.35)",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontSize:size*0.47,
        transform:pop?"scale(1.28)":"scale(1)",
        transition:"transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        WebkitTapHighlightColor:"transparent" }}>
      {liked ? "❤️" : "🤍"}
    </button>
  );
}

/* HUI Logo */
function HuiLogo({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="hui-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A9B9B"/>
          <stop offset="100%" stopColor="#E8957A"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#hui-lg)"/>
      <rect x="2" y="2" width="60" height="30" rx="16" fill="white" fillOpacity="0.14"/>
      <text x="11" y="44" fontSize="28" fontWeight="900" fill="white"
        fontFamily="-apple-system,system-ui" letterSpacing="-1.5">HUI</text>
    </svg>
  );
}

/* Werkekorb SVG */
function WerkekorbbBtn({ count=0, size=32, onClick }) {
  const filled = count > 0;
  return (
    <button onClick={onClick}
      style={{ background:"none", border:"none", cursor:"pointer",
        padding:4, lineHeight:0, position:"relative",
        WebkitTapHighlightColor:"transparent" }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="bk-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A87C"/><stop offset="100%" stopColor="#B5692E"/>
          </linearGradient>
          <linearGradient id="bk-r" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4A9B9B"/><stop offset="100%" stopColor="#7EC8C8"/>
          </linearGradient>
        </defs>
        <path d="M22 29 Q22 11 32 11 Q42 11 42 29"
          fill="none" stroke="#C8784A" strokeWidth="4" strokeLinecap="round"/>
        <path d="M11 32 Q11 54 32 54 Q53 54 53 32 Z" fill="url(#bk-b)"/>
        {[37,43,49].map((y,i)=>(
          <path key={i} d={`M12 ${y} Q32 ${y-2} 52 ${y}`}
            fill="none" stroke="#9A5220" strokeWidth="1.5" strokeOpacity="0.45"/>
        ))}
        {[19,25,31,37,43].map((x,i)=>(
          <path key={i} d={`M${x} 32 Q${x-1} 43 ${x} 53`}
            fill="none" stroke="#7A3E14" strokeWidth="0.9" strokeOpacity="0.3"/>
        ))}
        <rect x="10" y="30" width="44" height="6" rx="3" fill="url(#bk-r)"/>
        <rect x="10" y="30" width="44" height="3" rx="2" fill="white" fillOpacity="0.22"/>
        {filled && <>
          <circle cx="23" cy="28" r="5.5" fill="#E8957A" opacity="0.92"/>
          <circle cx="32" cy="26" r="6" fill="#4A9B9B" opacity="0.92"/>
          <circle cx="41" cy="28" r="5" fill="#F59E0B" opacity="0.92"/>
        </>}
      </svg>
      {count > 0 && (
        <div style={{ position:"absolute", top:-2, right:-2,
          minWidth:16, height:16, borderRadius:999,
          background:C.coral, color:"white", fontSize:8, fontWeight:900,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0 3px", border:"2px solid white" }}>
          {count > 9 ? "9+" : count}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════
   HEADER
═══════════════════════════════════════════ */
function Header({ cart, notif, onCart, onNotif, userName }) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:60,
      background:"rgba(249,247,244,0.94)",
      backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
      borderBottom:`1px solid ${C.borderWarm}` }}>
      <div style={{ height:"env(safe-area-inset-top,0)" }}/>
      <div style={{ display:"flex", alignItems:"center",
        padding:"10px 18px", gap:10 }}>
        <div style={{ flex:1 }}>
          {userName ? (
            <div style={{ fontWeight:800, fontSize:20, color:C.ink }}>
              Guten Morgen, {userName.split(" ")[0]} ✨
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <HuiLogo size={30}/>
              <span style={{ fontWeight:800, fontSize:14, color:C.ink }}>
                Human United Intelligent
              </span>
            </div>
          )}
        </div>
        {/* Werkekorb */}
        <WerkekorbbBtn count={cart} size={30} onClick={onCart}/>
        {/* Bell */}
        <button onClick={onNotif}
          style={{ position:"relative", background:"none", border:"none",
            cursor:"pointer", padding:4, fontSize:20,
            WebkitTapHighlightColor:"transparent" }}>
          🔔
          {notif > 0 && (
            <div style={{ position:"absolute", top:1, right:1,
              width:14, height:14, borderRadius:"50%",
              background:C.coral, color:"white", fontSize:7, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:"2px solid white" }}>{notif}</div>
          )}
        </button>
        {/* Avatar if logged in */}
        {userName && (
          <div style={{ width:34, height:34, borderRadius:"50%",
            overflow:"hidden", border:`2px solid ${C.tealPale}`,
            background:`linear-gradient(135deg,${C.tealPale},${C.coralPale})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:800, fontSize:13, color:C.teal }}>
            {userName[0]}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOTTOM NAV — exakt wie Prototyp
═══════════════════════════════════════════ */
function BottomNav({ tab, onTab, onCreate }) {
  const items = [
    {key:"feed",     label:"Home",      icon:"🏠"},
    {key:"impact",   label:"Impact",    icon:"🌱"},
    null,
    {key:"discover", label:"Entdecken", icon:"🧭"},
    {key:"profile",  label:"Profil",    icon:"👤"},
  ];

  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100,
      background:"rgba(249,247,244,0.96)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      borderTop:`1px solid ${C.sand}`,
      paddingBottom:"env(safe-area-inset-bottom,0)" }}>
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-around", padding:"6px 8px 4px" }}>
        {items.map((item,i)=>{
          if(!item) return (
            <button key="hui" onClick={onCreate}
              style={{ display:"flex", flexDirection:"column",
                alignItems:"center", width:56, background:"none",
                border:"none", cursor:"pointer",
                WebkitTapHighlightColor:"transparent" }}>
              <div style={{ width:52, height:52, marginTop:-20,
                borderRadius:16,
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 6px 20px rgba(74,155,155,0.45)`,
                transition:"transform 0.15s" }}
                onTouchStart={e=>e.currentTarget.style.transform="scale(0.9)"}
                onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
                <span style={{ fontWeight:900, fontSize:16,
                  color:"white", letterSpacing:-0.5 }}>HUI</span>
              </div>
            </button>
          );
          const active = tab === item.key;
          return (
            <button key={item.key} onClick={()=>onTab(item.key)}
              style={{ display:"flex", flexDirection:"column",
                alignItems:"center", gap:2, background:"none", border:"none",
                cursor:"pointer", padding:"4px 8px",
                WebkitTapHighlightColor:"transparent",
                transition:"transform 0.12s" }}
              onTouchStart={e=>e.currentTarget.style.transform="scale(0.88)"}
              onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              <span style={{ fontSize:20,
                filter:active?"none":"grayscale(1) opacity(0.4)",
                transform:active?"scale(1.1)":"scale(1)",
                transition:"all 0.2s" }}>
                {item.icon}
              </span>
              <span style={{ fontSize:9, fontWeight:active?700:400,
                color:active?C.teal:C.muted2,
                transition:"color 0.2s" }}>
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
   WIRKER PROFILE SHEET — exakt wie Prototyp
═══════════════════════════════════════════ */
function WirkerSheet({ w, onClose, onBook }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(0,0,0,0.45)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%", background:C.card,
        borderRadius:"28px 28px 0 0", maxHeight:"92vh", overflowY:"auto",
        paddingBottom:"max(24px,env(safe-area-inset-bottom))",
        animation:"slideUp 0.34s cubic-bezier(0.22,1,0.36,1) both" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Hero image */}
        <div style={{ height:240, position:"relative", overflow:"hidden" }}>
          <img src={w.bg} alt={w.name}
            style={{ width:"100%", height:"100%", objectFit:"cover",
              filter:"brightness(0.78)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to bottom,rgba(0,0,0,0.35) 0%,transparent 40%,rgba(0,0,0,0.6) 100%)"}}/>
          {/* Controls */}
          <div style={{ position:"absolute", top:16, left:16, right:16,
            display:"flex", justifyContent:"space-between" }}>
            <button onClick={onClose}
              style={{ width:38, height:38, borderRadius:"50%",
                background:"rgba(255,255,255,0.22)", backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.35)",
                cursor:"pointer", color:"white", fontSize:16,
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>←</button>
            <div style={{ display:"flex", gap:10 }}>
              <HeartBtn size={38}/>
              <button style={{ width:38, height:38, borderRadius:"50%",
                background:"rgba(255,255,255,0.22)", backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.35)",
                cursor:"pointer", color:"white", fontSize:14,
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>···</button>
            </div>
          </div>
        </div>

        <div style={{ padding:"0 22px 28px" }}>
          {/* Avatar */}
          <div style={{ marginTop:-28, marginBottom:12 }}>
            <div style={{ width:56, height:56, borderRadius:"50%",
              overflow:"hidden", border:"3px solid white",
              boxShadow:"0 4px 16px rgba(0,0,0,0.15)" }}>
              <img src={w.img} alt={w.name}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          </div>

          {/* Name */}
          <div style={{ display:"flex", alignItems:"center",
            gap:6, marginBottom:2 }}>
            <div style={{ fontWeight:900, fontSize:24, color:C.ink,
              letterSpacing:-0.5 }}>{w.name}</div>
            <span style={{ color:C.teal, fontSize:18 }}>✓</span>
          </div>
          <div style={{ fontSize:13, color:C.teal,
            fontWeight:700, marginBottom:2 }}>{w.talent}</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>
            📍 {w.city}
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:0, marginBottom:18 }}>
            {[
              {val:w.posts,       label:"Posts"},
              {val:w.score,       label:"Bewertung", gold:true},
              {val:w.connections, label:"Verbindungen"},
            ].map((s,i)=>(
              <div key={i} style={{ flex:1, textAlign:"center",
                padding:"12px 4px",
                borderRight:i<2?`1px solid ${C.border}`:"none" }}>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"center", gap:3 }}>
                  {s.gold && <span style={{ fontSize:11, color:C.gold }}>★</span>}
                  <span style={{ fontWeight:900, fontSize:18,
                    color:s.gold?C.gold:C.ink }}>{s.val}</span>
                </div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div style={{ background:C.tealPale, borderRadius:18,
            padding:"14px 16px", marginBottom:16,
            borderLeft:`4px solid ${C.teal}` }}>
            <div style={{ fontSize:14, color:C.ink, fontStyle:"italic",
              lineHeight:1.7 }}>„{w.quote}"</div>
          </div>

          {/* Bio */}
          <div style={{ fontWeight:700, fontSize:14,
            color:C.ink, marginBottom:6 }}>Über mich</div>
          <div style={{ fontSize:14, color:C.muted,
            lineHeight:1.75, marginBottom:18 }}>{w.bio}</div>

          {/* Werke grid */}
          {w.werke.length > 0 && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>
                  Meine Arbeiten
                </div>
                <button style={{ background:"none", border:"none",
                  cursor:"pointer", fontSize:12, fontWeight:600,
                  color:C.teal }}>Alle ansehen →</button>
              </div>
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
                {w.werke.map((wk,i)=>(
                  <div key={i} style={{ borderRadius:12, overflow:"hidden",
                    aspectRatio:"1" }}>
                    <img src={wk.img} alt=""
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action buttons — genau wie Prototyp */}
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ flex:1, padding:"15px",
              background:"none",
              border:`2px solid ${C.borderWarm}`,
              borderRadius:18, fontSize:15, fontWeight:700,
              color:C.ink, cursor:"pointer", fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent" }}>
              Nachricht
            </button>
            <button onClick={()=>onBook&&onBook(w)}
              style={{ flex:1, padding:"15px",
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                border:"none", borderRadius:18,
                fontSize:15, fontWeight:700,
                color:"white", cursor:"pointer", fontFamily:"inherit",
                boxShadow:`0 4px 16px rgba(74,155,155,0.35)`,
                WebkitTapHighlightColor:"transparent" }}>
              Anfragen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MATCH OVERLAY
═══════════════════════════════════════════ */
function MatchOverlay({ onClose, onView }) {
  const [q,    setQ]    = useState("");
  const [busy, setBusy] = useState(false);
  const [res,  setRes]  = useState(null);
  const [hint, setHint] = useState(0);

  useEffect(()=>{
    const t = setInterval(()=>setHint(h=>(h+1)%MATCH_HINTS.length), 3200);
    return ()=>clearInterval(t);
  },[]);

  async function run() {
    if(!q.trim()) return;
    setBusy(true);
    await new Promise(r=>setTimeout(r,1500));
    setRes(WIRKERS.slice(0,3));
    setBusy(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(0,0,0,0.50)",
      backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%", background:C.cream,
        borderRadius:"28px 28px 0 0", maxHeight:"88vh", overflowY:"auto",
        paddingBottom:"max(28px,env(safe-area-inset-bottom))",
        animation:"slideUp 0.34s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 0" }}>
          <div style={{ width:40, height:4, borderRadius:999, background:C.borderWarm }}/>
        </div>
        <div style={{ padding:"16px 22px 24px" }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:12, marginBottom:6 }}>
            <div style={{ width:44, height:44, borderRadius:14, flexShrink:0,
              background:`linear-gradient(135deg,${C.gold},#E8A000)`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:20,
              boxShadow:"0 4px 16px rgba(245,158,11,0.35)" }}>✨</div>
            <div>
              <div style={{ fontWeight:900, fontSize:20,
                color:C.ink }}>HUI Match</div>
              <div style={{ fontSize:12, color:C.muted }}>
                Beschreibe was du suchst
              </div>
            </div>
            <button onClick={onClose}
              style={{ marginLeft:"auto", width:28, height:28,
                borderRadius:"50%", background:C.border,
                border:"none", cursor:"pointer", fontSize:12,
                color:C.muted, display:"flex", alignItems:"center",
                justifyContent:"center",
                WebkitTapHighlightColor:"transparent" }}>✕</button>
          </div>

          <div style={{ fontSize:12, color:C.muted,
            marginBottom:10, fontStyle:"italic" }}>
            z. B. „{MATCH_HINTS[hint]}"
          </div>

          <textarea value={q} onChange={e=>setQ(e.target.value)} rows={3}
            placeholder="Beschreibe wen oder was du suchst…"
            style={{ width:"100%", boxSizing:"border-box",
              padding:"14px 16px", fontSize:14, color:C.ink,
              background:C.card, border:`1.5px solid ${C.borderWarm}`,
              borderRadius:16, outline:"none", resize:"none",
              fontFamily:"inherit", lineHeight:1.6, marginBottom:12 }}
            onFocus={e=>e.target.style.borderColor=C.teal}
            onBlur={e=>e.target.style.borderColor=C.borderWarm}
          />

          <button onClick={run} disabled={!q.trim()||busy}
            style={{ width:"100%", padding:"14px",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              color:"white", border:"none", borderRadius:16,
              fontSize:15, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:"0 4px 16px rgba(74,155,155,0.35)",
              opacity:q.trim()?1:0.5, marginBottom:res?20:0 }}>
            {busy ? "Suche läuft…" : "✨ Passende finden"}
          </button>

          {res && res.map((w,i)=>(
            <div key={i} onClick={()=>{onClose();onView(w);}}
              style={{ display:"flex", gap:12, alignItems:"center",
                padding:"12px 14px", marginTop:10,
                background:C.card, borderRadius:16,
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
                cursor:"pointer" }}>
              <img src={w.img} alt={w.name}
                style={{ width:46, height:46, borderRadius:"50%",
                  objectFit:"cover", border:`2px solid ${C.tealPale}` }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14,
                  color:C.ink }}>{w.name}</div>
                <div style={{ fontSize:12, color:C.teal,
                  fontWeight:700 }}>{w.talent}</div>
                <div style={{ fontSize:11, color:C.muted }}>
                  📍 {w.city}
                </div>
              </div>
              <div style={{ fontSize:12, fontWeight:700,
                color:C.gold }}>★ {w.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   WERKEKORB PAGE
═══════════════════════════════════════════ */
function WerkekorbbPage({ cart, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(0,0,0,0.45)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%", background:C.cream,
        borderRadius:"28px 28px 0 0", maxHeight:"88vh", overflowY:"auto",
        paddingBottom:"max(28px,env(safe-area-inset-bottom))",
        animation:"slideUp 0.34s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
          <div style={{ width:40, height:4, borderRadius:999, background:C.borderWarm }}/>
        </div>
        <div style={{ padding:"16px 22px 28px" }}>
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

          {/* Large basket */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
            <WerkekorbbBtn count={cart.length} size={130} onClick={()=>{}}/>
          </div>

          <div style={{ fontWeight:800, fontSize:19, color:C.ink,
            marginBottom:6 }}>
            Deine Sammlung bedeutungsvoller Werke.
          </div>
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.7,
            marginBottom:24 }}>
            Hier findest du alles, was dich inspiriert und was du erleben oder buchen möchtest.
          </div>

          {/* States */}
          {[
            {count:0, title:"Leer",      sub:"Dein Korb ist noch leer.",          active:cart.length===0},
            {count:2, title:"Mit Werken",sub:`${cart.length||2} Werke in deinem Korb.`, active:cart.length>0&&cart.length<4},
            {count:4, title:"Gefüllt",   sub:"Dein Korb ist bereit.",             active:cart.length>=4, badge:cart.length||4},
          ].map((s,i)=>(
            <div key={i}
              style={{ display:"flex", alignItems:"center", gap:14,
                padding:"14px 16px", marginBottom:10,
                background:s.active?`${C.teal}0D`:C.card,
                borderRadius:18,
                border:`1.5px solid ${s.active?C.teal:C.border}`,
                cursor:"pointer" }}>
              <WerkekorbbBtn count={s.count} size={52} onClick={()=>{}}/>
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
              <span style={{ color:s.active?C.teal:C.muted2, fontSize:14 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOME FEED — exakt wie Prototyp
═══════════════════════════════════════════ */
function HomeFeed({ onView, onBook, onCart, onImpact, onMatch }) {
  return (
    <div style={{ paddingBottom:90 }}>

      {/* Search + HUI Match */}
      <div style={{ padding:"12px 18px 16px",
        background:`linear-gradient(to bottom, ${C.sand}50, transparent)` }}>
        <div style={{ position:"relative", marginBottom:12 }}>
          <span style={{ position:"absolute", left:16, top:"50%",
            transform:"translateY(-50%)", fontSize:15,
            color:C.muted2, pointerEvents:"none" }}>🔍</span>
          <input
            style={{ width:"100%", background:C.card,
              border:"none", borderRadius:999,
              padding:"13px 18px 13px 44px",
              fontSize:14, color:C.ink, outline:"none",
              fontFamily:"inherit",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              boxSizing:"border-box" }}
            placeholder="Wen oder was suchst du heute?"
            readOnly onFocus={onMatch}/>
        </div>
        {/* Golden HUI Match button — exakt wie Prototyp */}
        <button onClick={onMatch}
          style={{ width:"100%", padding:"13px",
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", borderRadius:16,
            color:"white", fontSize:15, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center",
            justifyContent:"center", gap:8,
            boxShadow:"0 4px 16px rgba(74,155,155,0.35)",
            WebkitTapHighlightColor:"transparent" }}>
          <span>✨</span> HUI Match
        </button>
      </div>

      {/* Menschen die inspirieren */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"6px 18px 12px" }}>
        <div style={{ fontWeight:800, fontSize:17, color:C.ink }}>
          Menschen, die inspirieren
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.teal }}>Alle ansehen</button>
      </div>

      <div style={{ display:"flex", gap:14, overflowX:"auto",
        padding:"0 18px 6px", scrollbarWidth:"none" }}
        className="scrollbar-hide">
        {WIRKERS.map((w,i)=>(
          <div key={i} onClick={()=>onView(w)}
            style={{ flexShrink:0, width:145, cursor:"pointer",
              animation:`fadeUp 0.5s ${i*0.07}s both` }}>
            {/* Portrait card — aspect 3:4 */}
            <div style={{ position:"relative", borderRadius:20,
              overflow:"hidden", marginBottom:8,
              height:195 }}>
              <img src={w.img} alt={w.name}
                style={{ width:"100%", height:"100%", objectFit:"cover",
                  objectPosition:"top" }}/>
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.65) 100%)"}}/>
              <div style={{ position:"absolute", bottom:10,
                left:10, right:10 }}>
                <div style={{ fontWeight:700, fontSize:13,
                  color:"white" }}>{w.name}</div>
                <div style={{ fontSize:11,
                  color:"rgba(255,255,255,0.8)" }}>{w.talent}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center",
              gap:4, fontSize:11, color:C.muted }}>
              <span style={{ fontSize:10, color:C.teal }}>📍</span>
              {w.city}
            </div>
          </div>
        ))}
      </div>

      {/* Werke mit Seele — Masonry genau wie Prototyp */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"20px 18px 12px" }}>
        <div style={{ fontWeight:800, fontSize:17, color:C.ink }}>
          Werke mit Seele
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.teal }}>Alle ansehen</button>
      </div>

      <div style={{ padding:"0 18px", columns:2, columnGap:12 }}>
        {WERKE.map((w,i)=>(
          <div key={i} style={{ breakInside:"avoid", marginBottom:14,
            cursor:"pointer" }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{ borderRadius:18, overflow:"hidden",
              marginBottom:8, height:w.h }}>
              <img src={w.img} alt={w.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
            <div style={{ fontWeight:600, fontSize:13,
              color:C.ink, marginBottom:2 }}>{w.title}</div>
            <div style={{ fontWeight:800, fontSize:13,
              color:C.teal }}>{w.price}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DISCOVER — exakt wie Prototyp
═══════════════════════════════════════════ */
function DiscoverFeed({ onView, onMatch }) {
  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ padding:"20px 18px 12px" }}>
        <div style={{ fontWeight:900, fontSize:26, color:C.ink,
          letterSpacing:-0.6, marginBottom:16 }}>Entdecken</div>
        <div style={{ position:"relative", marginBottom:20 }}>
          <span style={{ position:"absolute", left:16, top:"50%",
            transform:"translateY(-50%)", fontSize:15,
            color:C.muted2, pointerEvents:"none" }}>🔍</span>
          <input
            style={{ width:"100%", background:C.card,
              border:"none", borderRadius:999,
              padding:"13px 18px 13px 44px",
              fontSize:13, color:C.ink, outline:"none",
              fontFamily:"inherit",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              boxSizing:"border-box" }}
            placeholder="Suche nach Menschen, Werken, Erlebnissen und mehr"
            readOnly onFocus={onMatch}/>
        </div>
      </div>

      {/* Hero nearby — genau wie Prototyp */}
      <div style={{ margin:"0 18px 20px",
        borderRadius:24, overflow:"hidden", height:200, position:"relative",
        boxShadow:"0 4px 24px rgba(0,0,0,0.14)" }}>
        <img src="https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80"
          alt="Erlebnisse"
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.75)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 20%,rgba(0,0,0,0.65) 100%)"}}/>
        <div style={{ position:"absolute", bottom:20, left:20, right:20 }}>
          <div style={{ fontWeight:900, fontSize:24, color:"white",
            lineHeight:1.2, marginBottom:12 }}>
            Erlebnisse<br/>in deiner Nähe
          </div>
          <button style={{ background:"rgba(255,255,255,0.22)",
            backdropFilter:"blur(10px)", color:"white",
            border:"1px solid rgba(255,255,255,0.35)",
            padding:"9px 20px", borderRadius:999,
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit" }}>Entdecken</button>
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding:"0 18px 20px",
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {CATS.map((k,i)=>(
          <div key={i} style={{ display:"flex", flexDirection:"column",
            alignItems:"center", gap:6, cursor:"pointer" }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.92)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{ width:48, height:48, borderRadius:16,
              background:k.bg,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:22 }}>{k.icon}</div>
            <span style={{ fontSize:10, fontWeight:600,
              color:C.muted, textAlign:"center" }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* Für dich empfohlen */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"0 18px 12px" }}>
        <div style={{ fontWeight:800, fontSize:17, color:C.ink }}>
          Für dich empfohlen
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.teal }}>Alle ansehen</button>
      </div>

      <div style={{ padding:"0 18px", display:"flex",
        flexDirection:"column", gap:14 }}>
        {DISCOVER_EVENTS.map((ev,i)=>(
          <div key={i} style={{ background:C.card, borderRadius:20,
            overflow:"hidden",
            boxShadow:"0 2px 8px rgba(0,0,0,0.07)",
            cursor:"pointer" }}>
            <div style={{ height:160, overflow:"hidden", position:"relative" }}>
              <img src={ev.img} alt={ev.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              <div style={{ position:"absolute", top:10, right:10 }}>
                <HeartBtn size={32}/>
              </div>
            </div>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:8, marginBottom:6 }}>
                <span style={{ background:`${ev.tagColor}18`,
                  color:ev.tagColor, borderRadius:8,
                  padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                  {ev.tag}
                </span>
                <span style={{ fontSize:11, color:C.muted }}>
                  {ev.sub.split("·").slice(1).join("·")}
                </span>
              </div>
              <div style={{ fontWeight:800, fontSize:15,
                color:C.ink, marginBottom:2 }}>{ev.title}</div>
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
  const [tab,         setTab]         = useState("feed");
  const [showWirker,  setShowWirker]  = useState(null);
  const [showBooking, setShowBooking] = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showMatch,   setShowMatch]   = useState(false);
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

  if(showCreate) return <CreateFlow onClose={()=>setShowCreate(false)}/>;
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
    <div style={{ height:"100dvh", display:"flex",
      flexDirection:"column", overflow:"hidden",
      background:C.cream }}>

      <Header
        cart={cart.length} notif={notif}
        onCart={()=>setShowKorb(true)}
        onNotif={()=>setNotif(0)}
        userName={userName}
      />

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
        {tab==="impact"   && <ImpactPage currentUser={currentUser}/>}
        {tab==="discover" && (
          <DiscoverFeed
            onView={w=>setShowWirker(w)}
            onMatch={()=>setShowMatch(true)}
          />
        )}
        {tab==="profile"  && (
          <ProfilePage
            onTalentAnbieten={()=>setShowCreate(true)}
            onLogout={()=>{supabase.auth.signOut();window.location.href="/login";}}
          />
        )}
      </div>

      <BottomNav tab={tab} onTab={setTab}
        onCreate={()=>setShowCreate(true)}/>

      {showMatch && (
        <MatchOverlay
          onClose={()=>setShowMatch(false)}
          onView={w=>{setShowWirker(w);setShowMatch(false);}}
        />
      )}
      {showWirker && (
        <WirkerSheet
          w={showWirker}
          onClose={()=>setShowWirker(null)}
          onBook={w=>{setShowWirker(null);setShowBooking(w);}}
        />
      )}
      {showKorb && (
        <WerkekorbbPage cart={cart} onClose={()=>setShowKorb(false)}/>
      )}
    </div>
  );
}
