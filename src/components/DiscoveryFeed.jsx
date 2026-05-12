// DiscoveryFeed.jsx — HUI Home Feed
// Struktur: Search → HUI Match → Wirker Grid → Werke Grid → Immersiver Discovery Feed
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.22)",
  gold:"#F5A623", goldGlow:"rgba(245,166,35,0.22)",
  green:"#3DB87A", greenGlow:"rgba(61,184,122,0.22)",
  cream:"#F9F6F2", creamWarm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBBBBB",
  border:"rgba(0,0,0,0.06)",
};

/* ── DATA ─────────────────────────────────────────────────────────────── */
const WIRKERS = [
  { name:"Lea Sommer", talent:"Fotografin", city:"München", recs:34, available:true,
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=85" },
  { name:"David Weber", talent:"Keramiker", city:"Hamburg", recs:19, available:true,
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=85" },
  { name:"Nina B.", talent:"Yogalehrerin", city:"Stuttgart", recs:61, available:true,
    img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=85" },
  { name:"Marcus B.", talent:"Videograf", city:"Berlin", recs:27, available:false,
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85" },
  { name:"Anna K.", talent:"Gartengestalterin", city:"München", recs:43, available:true,
    img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=85" },
  { name:"Felix M.", talent:"Gitarrenlehrer", city:"Frankfurt", recs:15, available:true,
    img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=85" },
];

const WERKE = [
  { title:"Keramikschale", price:"€ 89", creator:"David Weber",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=85" },
  { title:"Aquarell Original", price:"€ 120", creator:"Lena M.",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=85" },
  { title:"Leder-Rucksack", price:"€ 195", creator:"Stefan K.",
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=85" },
  { title:"Holzschälchen", price:"€ 68", creator:"Markus L.",
    img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=85" },
  { title:"Lichtfoto", price:"€ 320", creator:"Lea Sommer",
    img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=85" },
];

const FEED_ITEMS = [
  { id:1, type:"wirker", name:"Lea Sommer", talent:"Fotografin", city:"München", recs:34,
    available:true, hourly:85, bio:"Ich fange das Licht ein, bevor es verschwindet.",
    img:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=900&q=90" },
  { id:2, type:"werk", title:"Aquarell Original", creator:"Lena Maier", city:"München",
    price:"€ 120", category:"Kunst", bio:"Aquarell auf Archivpapier. Jedes Stück ein Unikat.",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=90" },
  { id:3, type:"experience", title:"Yoga bei Sonnenaufgang", creator:"Nina B.",
    city:"Stuttgart", date:"Sa, 9. Mai", time:"06:30", price:"ab € 35", spots:4,
    bio:"Morgen-Yoga im Park. Sonnenaufgang, Stille, Gemeinschaft.",
    img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=90" },
  { id:4, type:"impact", title:"Stadtgärten als Begegnungsorte", city:"München",
    raised:12800, goal:40000, bio:"Wo Erde wächst, wächst Gemeinschaft.",
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=90" },
  { id:5, type:"wirker", name:"David Weber", talent:"Keramikkünstler", city:"Hamburg",
    recs:19, available:true, hourly:65, bio:"Ton ist mein Medium — Stille ist meine Sprache.",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90" },
  { id:6, type:"experience", title:"Töpferkurs am See", creator:"David Weber",
    city:"Starnberg", date:"So, 10. Mai", time:"10:00", price:"ab € 85", spots:3,
    bio:"Töpfern am Ufer des Starnberger Sees.",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90" },
  { id:7, type:"werk", title:"Leder-Rucksack", creator:"Stefan K.", city:"Berlin",
    price:"€ 195", category:"Mode", bio:"Vegetable-Tanned Leder. Auf Maß gefertigt.",
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=90" },
  { id:8, type:"impact", title:"Schutz der Meere", city:"Hamburg",
    raised:36200, goal:80000, bio:"Wir schützen, was uns schützt.",
    img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=900&q=90" },
];

/* ── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes dfFadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dfKenBurns  { from{transform:scale(1)} to{transform:scale(1.06)} }
  @keyframes dfBreath    { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes dfSkel      { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes dfSkPulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes dfSaved     { 0%{transform:scale(1)} 40%{transform:scale(1.45)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
  @keyframes dfRingPulse {
    0%,100%{ filter:drop-shadow(0 0 0px rgba(22,215,197,0)); }
    50%    { filter:drop-shadow(0 0 5px rgba(22,215,197,0.55)); }
  }
  @keyframes dfRingDash  {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -28; }
  }
  .df-scroll::-webkit-scrollbar{display:none}
  .df-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .df-tap{transition:transform .18s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .df-tap:active{transform:scale(.96)}
  .df-moment-ring svg circle { animation: dfRingDash 8s linear infinite; }
`;

/* ── SAVE BTN ──────────────────────────────────────────────────────────── */

/* ── CreatorRow — Avatar + Name + @username, klickbar ──────────────── */
function CreatorAvatar({ url, name, size = 28 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (url) return (
    <img src={url} alt={name}
      style={{ width: size, height: size, borderRadius: "50%",
        objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)",
        flexShrink: 0 }} />
  );
  return (
    <div style={{ width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #16D7C5, #FF8A6B)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 900, color: "white",
      border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function CreatorRow({ item, dark = false, onNavigate }) {
  const displayName = item.creator      || "Unbekannter Creator";
  const username    = item.creatorUsername || "hui-user";
  const avatarUrl   = item.creatorImg   || null;
  const textColor   = dark ? "rgba(255,255,255,0.88)" : C.ink;
  const subColor    = dark ? "rgba(255,255,255,0.50)" : C.muted;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(`/profile/${username}`);
  };

  return (
    <div onClick={handleClick}
      style={{ display: "flex", alignItems: "center", gap: 8,
        cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
      <CreatorAvatar url={avatarUrl} name={displayName} size={28} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: textColor,
          lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", maxWidth: 160 }}>
          {displayName}
        </div>
        <div style={{ fontSize: 10.5, color: subColor, fontWeight: 500 }}>
          @{username}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Loading Card ───────────────────────────────────────────── */
function WerkCardSkeleton() {
  return (
    <div style={{ position: "relative", width: "100%", height: "76vh",
      maxHeight: 590, borderRadius: 32, overflow: "hidden",
      background: "linear-gradient(135deg, #f0f0f0, #e8e8e8)",
      animation: "dfSkel 1.4s ease-in-out infinite" }}>
      <div style={{ position: "absolute", bottom: 32, left: 26, right: 26 }}>
        <div style={{ height: 12, borderRadius: 8, background: "rgba(255,255,255,0.3)",
          marginBottom: 12, width: "60%" }}/>
        <div style={{ height: 24, borderRadius: 10, background: "rgba(255,255,255,0.4)",
          marginBottom: 8, width: "85%" }}/>
        <div style={{ height: 12, borderRadius: 8, background: "rgba(255,255,255,0.2)",
          width: "40%" }}/>
      </div>
    </div>
  );
}

function WerkTileSkeleton() {
  return (
    <div style={{ flexShrink: 0, width: 130 }}>
      <div style={{ borderRadius: 18, height: 148,
        background: "linear-gradient(135deg, #f0f0f0, #e8e8e8)",
        animation: "dfSkel 1.4s ease-in-out infinite" }}/>
      <div style={{ padding: "6px 2px 0" }}>
        <div style={{ height: 10, borderRadius: 6, background: "#eee", marginBottom: 5, width: "80%" }}/>
        <div style={{ height: 8, borderRadius: 6, background: "#eee", width: "55%" }}/>
      </div>
    </div>
  );
}


function SaveBtn({ accent, dark }) {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
      style={{ width:32, height:32, borderRadius:"50%",
        background: dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.88)",
        backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
        border:`1px solid ${dark?"rgba(255,255,255,0.25)":C.border}`,
        cursor:"pointer", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:14, lineHeight:1,
        WebkitTapHighlightColor:"transparent",
        animation: saved ? "dfSaved 0.38s ease" : "none" }}>
      {saved ? "💙" : "🤍"}
    </button>
  );
}

/* ── WIRKER TILE — compact, portrait ──────────────────────────────────── */
function WirkerTile({ w, onView, onBook }) {
  return (
    <div className="df-tap" onClick={() => onView && onView(w)}
      style={{ flexShrink:0, width:118, cursor:"pointer" }}>
      {/* Portrait */}
      <div style={{ borderRadius:20, overflow:"hidden",
        height:148, position:"relative",
        boxShadow:"0 3px 14px rgba(0,0,0,0.11)" }}>
        <img src={w.img} alt={w.name}
          style={{ width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"top center",
            filter:"brightness(0.88) saturate(1.1)" }}/>
        {/* Teal top strip */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5,
          background:`linear-gradient(90deg,${C.teal},transparent)` }}/>
        {/* Gradient bottom */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 45%,rgba(0,0,0,0.62) 100%)" }}/>
        {/* Available dot */}
        {w.available && (
          <div style={{ position:"absolute", top:8, right:8,
            width:8, height:8, borderRadius:"50%",
            background:C.green, border:"2px solid white",
            boxShadow:`0 0 5px ${C.green}` }}/>
        )}
        {/* Name */}
        <div style={{ position:"absolute", bottom:8, left:8, right:8 }}>
          <div style={{ fontWeight:800, fontSize:11.5, color:"white",
            lineHeight:1.2, letterSpacing:-0.2 }}>{w.name}</div>
          <div style={{ fontSize:10, color:`${C.teal}EE`,
            fontWeight:600, marginTop:1 }}>{w.talent}</div>
        </div>
      </div>
      {/* City + buchen pill */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginTop:5, paddingLeft:2 }}>
        <div style={{ fontSize:10, color:C.muted,
          display:"flex", alignItems:"center", gap:3 }}>
          <span style={{ fontSize:9 }}>📍</span>{w.city}
        </div>
        <button onClick={e=>{e.stopPropagation();onBook&&onBook(w);}}
          style={{ background:C.teal, border:"none", borderRadius:999,
            padding:"3px 10px", fontSize:9.5, fontWeight:800,
            color:"white", cursor:"pointer", fontFamily:"inherit",
            WebkitTapHighlightColor:"transparent" }}>
          buchen
        </button>
      </div>
    </div>
  );
}

/* ── WERK TILE — compact, square-ish ─────────────────────────────────── */
function WerkTile({ w, onView, onBuyWerk, navigate }) {
  return (
    <div className="df-tap" onClick={() => { if(w.id && navigate) navigate(`/work/${w.id}`); else if(onView) onView(w); }}
      style={{ flexShrink:0, width:130, cursor:"pointer" }}>
      <div style={{ borderRadius:18, overflow:"hidden",
        height:148, position:"relative",
        boxShadow:"0 3px 14px rgba(0,0,0,0.10)" }}>
        <img src={w.img} alt={w.title}
          style={{ width:"100%", height:"100%",
            objectFit:"cover",
            filter:"brightness(0.86) saturate(1.15)" }}/>
        {/* Coral top strip */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5,
          background:`linear-gradient(90deg,${C.coral},transparent)` }}/>
        {/* Gradient bottom */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.60) 100%)" }}/>
        {/* Price badge */}
        <div style={{ position:"absolute", top:8, left:8 }}>
          <div style={{ background:"rgba(255,255,255,0.92)",
            backdropFilter:"blur(6px)",
            borderRadius:999, padding:"3px 9px",
            fontSize:10.5, fontWeight:900, color:C.ink }}>
            {w.price}
          </div>
        </div>
        {/* Save */}
        <div style={{ position:"absolute", top:6, right:6 }}>
          <SaveBtn accent={C.coral} dark/>
        </div>
      </div>
      <div style={{ padding:"6px 2px 0" }}>
        <div style={{ fontSize:11.5, fontWeight:700,
          color:C.ink, lineHeight:1.3, marginBottom:4 }}>{w.title}</div>
        <div onClick={e=>{e.stopPropagation(); if(navigate) navigate(`/profile/${w.creatorUsername||"hui-user"}`);}}
          style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer" }}>
          <CreatorAvatar url={w.creatorImg||null} name={w.creator||"?"} size={16}/>
          <span style={{ fontSize:10, color:C.teal,
            fontWeight:600, overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", maxWidth:90 }}>
            {w.creator || "Unbekannt"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── SECTION HEADER ───────────────────────────────────────────────────── */
function SectionHeader({ title, sub, accent, onAll }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end",
      justifyContent:"space-between",
      padding:"26px 20px 12px" }}>
      <div>
        <div style={{ fontWeight:900, fontSize:18, color:C.ink,
          letterSpacing:-0.4, lineHeight:1.15 }}>{title}</div>
        {sub && <div style={{ fontSize:11.5, color:C.muted, marginTop:3 }}>{sub}</div>}
      </div>
      <button onClick={onAll}
        style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:11.5, fontWeight:700, color:accent,
          padding:"5px 11px", borderRadius:999,
          background:`${accent}18`,
          WebkitTapHighlightColor:"transparent",
          fontFamily:"inherit" }}>
        Alle →
      </button>
    </div>
  );
}

/* ── DIVIDER ──────────────────────────────────────────────────────────── */
function Divider({ label, accent }) {
  return (
    <div style={{ padding:"24px 24px 6px",
      display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(90deg,${accent}44,transparent)` }}/>
      <span style={{ fontSize:8.5, fontWeight:800, color:accent,
        letterSpacing:2.5, textTransform:"uppercase", opacity:0.8 }}>
        {label}
      </span>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(270deg,${accent}44,transparent)` }}/>
    </div>
  );
}

/* ── IMMERSIVE FEED CARDS ─────────────────────────────────────────────── */
function WirkerCard({ item, onView, onBook }) {
  return (
    <div className="df-tap" onClick={() => onView && onView(item)}
      style={{ position:"relative", width:"100%", height:"82vh", maxHeight:640,
        overflow:"hidden", cursor:"pointer", borderRadius:32,
        animation:"dfFadeUp 0.5s both" }}>
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 20s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.name}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            objectPosition:"top center",
            filter:"brightness(0.70) saturate(1.15)" }}/>
      </div>
      <div style={{ position:"absolute", inset:0, background:`
        radial-gradient(ellipse 80% 50% at 0% 0%, ${C.teal}2E 0%, transparent 55%),
        linear-gradient(to bottom, transparent 28%, rgba(8,8,8,0.85) 100%)` }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5,
        background:`linear-gradient(90deg,${C.teal},${C.teal}44,transparent)` }}/>

      {/* Label */}
      <div style={{ position:"absolute", top:22, left:22 }}>
        <div style={{ background:"rgba(22,215,197,0.18)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(22,215,197,0.35)", borderRadius:999,
          padding:"4px 13px", display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:8.5, color:C.teal, fontWeight:800,
            letterSpacing:1.8, textTransform:"uppercase" }}>Wirker</span>
          {item.available && <span style={{ width:5, height:5, borderRadius:"50%",
            background:C.green, boxShadow:`0 0 4px ${C.green}` }}/>}
        </div>
      </div>
      <div style={{ position:"absolute", top:22, right:22 }}>
        <SaveBtn accent={C.teal} dark/>
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 26px 32px" }}>
        <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.72)", fontStyle:"italic",
          lineHeight:1.65, marginBottom:14 }}>„{item.bio}"</p>
        <div style={{ fontWeight:900, fontSize:26, color:"white",
          letterSpacing:-0.6, lineHeight:1.1, marginBottom:4 }}>{item.name}</div>
        <div style={{ fontSize:13, color:C.teal, fontWeight:700, marginBottom:2 }}>
          {item.talent}</div>
        <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.46)", marginBottom:18 }}>
          📍 {item.city}</div>
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          {[{val:`${item.recs}`, label:"Empf.", col:C.teal},
            {val:`€ ${item.hourly}`, label:"/Std", col:C.coral}].map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:5,
              background:"rgba(255,255,255,0.10)", backdropFilter:"blur(8px)",
              border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:999, padding:"5px 13px" }}>
              <span style={{ fontSize:11, color:s.col, fontWeight:800 }}>{s.val}</span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.55)" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={e=>{e.stopPropagation();onView&&onView(item);}}
            style={{ flex:1, padding:"14px",
              background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)",
              border:"1.5px solid rgba(22,215,197,0.45)",
              borderRadius:16, color:"white",
              fontSize:13, fontWeight:700, cursor:"pointer",
              fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent" }}>
            Profil
          </button>
          <button onClick={e=>{e.stopPropagation();onBook&&onBook(item);}}
            style={{ flex:1.5, padding:"14px",
              background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:16, color:"white",
              fontSize:13, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit", boxShadow:`0 4px 16px ${C.tealGlow}`,
              WebkitTapHighlightColor:"transparent" }}>
            Jetzt buchen
          </button>
        </div>
      </div>
    </div>
  );
}

function WerkCard({ item, onView, onBuyWerk, onAddToKorb, navigate }) {
  return (
    <div className="df-tap" onClick={() => { if(item.id && navigate) navigate(`/work/${item.id}`); else if(onView) onView(item); }}
      style={{ position:"relative", width:"100%", height:"76vh", maxHeight:590,
        overflow:"hidden", cursor:"pointer", borderRadius:32,
        animation:"dfFadeUp 0.5s both" }}>
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 22s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.72) saturate(1.2)" }}/>
      </div>
      <div style={{ position:"absolute", inset:0, background:`
        radial-gradient(ellipse 60% 40% at 100% 0%, ${C.coral}26 0%, transparent 55%),
        linear-gradient(to bottom, transparent 22%, rgba(8,5,5,0.90) 100%)` }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5,
        background:`linear-gradient(90deg,${C.coral},${C.coral}44,transparent)` }}/>

      <div style={{ position:"absolute", top:22, left:22 }}>
        <div style={{ background:"rgba(255,138,107,0.18)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(255,138,107,0.35)", borderRadius:999,
          padding:"4px 13px", fontSize:8.5, color:C.coral,
          fontWeight:800, letterSpacing:1.8, textTransform:"uppercase" }}>
          {item.category}
        </div>
      </div>
      <div style={{ position:"absolute", top:22,
        left:"50%", transform:"translateX(-50%)" }}>
        <div style={{ background:"rgba(255,255,255,0.92)", backdropFilter:"blur(10px)",
          borderRadius:999, padding:"5px 16px",
          fontSize:13, fontWeight:900, color:C.ink }}>
          {item.price}
        </div>
      </div>
      <div style={{ position:"absolute", top:22, right:22 }}>
        <SaveBtn accent={C.coral} dark/>
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 26px 32px" }}>
        <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.68)", fontStyle:"italic",
          lineHeight:1.65, marginBottom:12 }}>„{item.bio}"</p>
        <div style={{ fontWeight:900, fontSize:24, color:"white",
          letterSpacing:-0.5, lineHeight:1.15, marginBottom:10 }}>{item.title}</div>
        <div style={{ marginBottom:16 }}>
          <CreatorRow item={item} dark onNavigate={navigate || null}/>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={e=>{e.stopPropagation();onAddToKorb&&onAddToKorb(item);}}
            style={{ flex:1, padding:"14px",
              background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)",
              border:"1.5px solid rgba(255,138,107,0.45)",
              borderRadius:16, color:"white",
              fontSize:13, fontWeight:700, cursor:"pointer",
              fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent" }}>
            In Korb
          </button>
          <button onClick={e=>{e.stopPropagation();onBuyWerk&&onBuyWerk(item);}}
            style={{ flex:1.5, padding:"14px",
              background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
              border:"none", borderRadius:16, color:"white",
              fontSize:13, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit", boxShadow:`0 4px 16px ${C.coralGlow}`,
              WebkitTapHighlightColor:"transparent" }}>
            Jetzt kaufen
          </button>
        </div>
      </div>
    </div>
  );
}

function ExperienceCard({ item, onView }) {
  return (
    <div className="df-tap" onClick={() => onView && onView(item)}
      style={{ position:"relative", width:"100%", height:"78vh", maxHeight:610,
        overflow:"hidden", cursor:"pointer", borderRadius:32,
        animation:"dfFadeUp 0.5s both" }}>
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 18s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.65) saturate(1.2)" }}/>
      </div>
      <div style={{ position:"absolute", inset:0, background:`
        radial-gradient(ellipse 70% 40% at 50% 0%, ${C.gold}1E 0%, transparent 50%),
        linear-gradient(to bottom, transparent 20%, rgba(6,5,0,0.92) 100%)` }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5,
        background:`linear-gradient(90deg,${C.gold},${C.gold}44,transparent)` }}/>

      <div style={{ position:"absolute", top:22, left:22,
        display:"flex", gap:8 }}>
        <div style={{ background:"rgba(245,166,35,0.18)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(245,166,35,0.40)", borderRadius:999,
          padding:"4px 13px", fontSize:8.5, color:C.gold,
          fontWeight:800, letterSpacing:1.6, textTransform:"uppercase" }}>
          Erlebnis
        </div>
        {item.spots <= 3 && (
          <div style={{ background:"rgba(255,138,107,0.22)", backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,138,107,0.40)", borderRadius:999,
            padding:"4px 10px", fontSize:8.5, color:C.coral, fontWeight:800 }}>
            🔥 Noch {item.spots}
          </div>
        )}
      </div>
      <div style={{ position:"absolute", top:22, right:22 }}>
        <SaveBtn accent={C.gold} dark/>
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 26px 32px" }}>
        <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.65)", fontStyle:"italic",
          lineHeight:1.65, marginBottom:12 }}>„{item.bio}"</p>
        <div style={{ fontWeight:900, fontSize:24, color:"white",
          letterSpacing:-0.5, lineHeight:1.15, marginBottom:14 }}>{item.title}</div>
        <div style={{ display:"flex", gap:10, marginBottom:18 }}>
          <div style={{ background:"rgba(255,255,255,0.10)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:999,
            padding:"5px 13px", fontSize:11, color:"rgba(255,255,255,0.70)" }}>
            📅 {item.date}
          </div>
          <div style={{ background:"rgba(245,166,35,0.15)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(245,166,35,0.30)", borderRadius:999,
            padding:"5px 13px", fontSize:11, color:C.gold, fontWeight:800 }}>
            {item.price}
          </div>
        </div>
        <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.44)", marginBottom:18 }}>
          {item.creator} · 📍 {item.city}</div>
        <button onClick={e=>{e.stopPropagation();onView&&onView(item);}}
          style={{ width:"100%", padding:"15px",
            background:`linear-gradient(135deg,${C.gold},#E8A000)`,
            border:"none", borderRadius:16, color:"white",
            fontSize:14.5, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", boxShadow:`0 5px 20px ${C.goldGlow}`,
            WebkitTapHighlightColor:"transparent" }}>
          Erlebnis buchen
        </button>
      </div>
    </div>
  );
}

function ImpactCard({ item, onImpact }) {
  const pct = Math.round((item.raised / item.goal) * 100);
  return (
    <div className="df-tap" onClick={onImpact}
      style={{ position:"relative", width:"100%", height:"70vh", maxHeight:550,
        overflow:"hidden", cursor:"pointer", borderRadius:32,
        animation:"dfFadeUp 0.5s both" }}>
      <div style={{ position:"absolute", inset:0,
        animation:"dfKenBurns 24s ease-in-out infinite alternate" }}>
        <img src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.58) saturate(1.25)" }}/>
      </div>
      <div style={{ position:"absolute", inset:0, background:`
        radial-gradient(ellipse 80% 50% at 20% 15%, ${C.teal}3A 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 80% 80%, ${C.green}28 0%, transparent 55%),
        linear-gradient(to bottom, transparent 15%, rgba(4,8,6,0.90) 100%)` }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5,
        background:`linear-gradient(90deg,${C.green},${C.teal},transparent)` }}/>

      <div style={{ position:"absolute", top:22, left:22 }}>
        <div style={{ background:"rgba(61,184,122,0.18)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(61,184,122,0.38)", borderRadius:999,
          padding:"4px 13px", fontSize:8.5, color:C.green,
          fontWeight:800, letterSpacing:1.8, textTransform:"uppercase" }}>
          🌱 Impact
        </div>
      </div>
      <div style={{ position:"absolute", top:22, right:22 }}>
        <SaveBtn accent={C.green} dark/>
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 26px 32px" }}>
        <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.68)", fontStyle:"italic",
          lineHeight:1.65, marginBottom:12 }}>„{item.bio}"</p>
        <div style={{ fontWeight:900, fontSize:22, color:"white",
          letterSpacing:-0.4, lineHeight:1.2, marginBottom:14 }}>{item.title}</div>
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ fontWeight:800, fontSize:14, color:C.green }}>
              € {Number(item.raised).toLocaleString("de-DE")}
            </span>
            <span style={{ fontSize:11.5, color:"rgba(255,255,255,0.50)" }}>
              {pct}% erreicht
            </span>
          </div>
          <div style={{ height:4, borderRadius:999,
            background:"rgba(255,255,255,0.12)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999,
              width:`${pct}%`,
              background:`linear-gradient(90deg,${C.green},${C.teal})`,
              boxShadow:`0 0 8px ${C.greenGlow}` }}/>
          </div>
        </div>
        <button onClick={e=>{e.stopPropagation();onImpact&&onImpact();}}
          style={{ width:"100%", padding:"15px",
            background:`linear-gradient(135deg,${C.green},${C.teal2})`,
            border:"none", borderRadius:16, color:"white",
            fontSize:14.5, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", boxShadow:`0 5px 20px ${C.greenGlow}`,
            WebkitTapHighlightColor:"transparent" }}>
          Projekt entdecken
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN DISCOVERY FEED
════════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════════
   MOMENTEBAR — Offizieller HUI Story-Strip
   Direkt nach HUI Match. Echter Supabase-Connect. Kein Mock.
══════════════════════════════════════════════════════════════════ */
function MomenteBar({ user, onOpenComposer, refreshKey }) {
  const [stories,  setStories]  = React.useState([]);
  const [viewer,   setViewer]   = React.useState(null);
  const [loading,  setLoading]  = React.useState(true);
  const [ownProfile, setOwnProfile] = React.useState(null);

  React.useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("avatar_url,display_name,username")
      .eq("id", user.id).single()
      .then(({ data }) => { if (data) setOwnProfile(data); });
  }, [user?.id]);

  const load = React.useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("stories")
        .select("id,user_id,username,avatar_url,media_url,media_type,text_overlay,mood,is_highlight,created_at,expires_at")
        .eq("status","published")
        .or(`expires_at.is.null,expires_at.gt.${now},is_highlight.eq.true`)
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) { console.error("[MomenteBar] load:", error); return; }
      setStories(data || []);
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load, refreshKey]);

  // Group by user, keep newest as representative
  const grouped = React.useMemo(() => {
    const map = new Map();
    for (const s of stories) {
      if (!map.has(s.user_id)) map.set(s.user_id, { rep: s, all: [s] });
      else map.get(s.user_id).all.push(s);
    }
    return Array.from(map.values());
  }, [stories]);

  const ownGroup  = grouped.find(g => g.rep.user_id === user?.id);
  const otherGroups = grouped.filter(g => g.rep.user_id !== user?.id);

  if (loading) return (
    <div style={{ padding:"0 20px 4px", display:"flex", gap:14, overflowX:"auto" }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{ flexShrink:0, display:"flex", flexDirection:"column",
          alignItems:"center", gap:6 }}>
          <div style={{ width:64, height:64, borderRadius:"50%",
            background:`linear-gradient(135deg,rgba(22,215,197,0.08),rgba(255,138,107,0.06))`,
            animation:`dfSkPulse 1.4s ease-in-out ${i*0.12}s infinite alternate`,
            boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}/>
          <div style={{ width:44, height:7, borderRadius:4,
            background:"rgba(0,0,0,0.05)",
            animation:`dfSkPulse 1.4s ease-in-out ${i*0.12}s infinite alternate` }}/>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch",
        paddingBottom:4,
        scrollbarWidth:"none", msOverflowStyle:"none" }}>
        <div style={{ display:"flex", gap:16, padding:"2px 20px 6px", minWidth:"min-content" }}>

          {/* ── "Dein Moment" immer zuerst ── */}
          <MomenteAvatar
            label={ownProfile?.display_name ? `${ownProfile.display_name.split(" ")[0]}` : "Dein Moment"}
            avatar={ownProfile?.avatar_url || user?.user_metadata?.avatar_url || null}
            isOwn={true}
            hasStory={!!ownGroup}
            onTap={() => {
              if (ownGroup) setViewer({ stories: ownGroup.all, startIdx: 0 });
              else onOpenComposer?.();
            }}
          />

          {/* ── Andere User-Stories ── */}
          {otherGroups.map(({ rep, all }, i) => (
            <MomenteAvatar
              key={rep.user_id}
              label={rep.username || "HUI"}
              avatar={rep.avatar_url}
              isOwn={false}
              hasStory={true}
              animDelay={i * 0.06}
              onTap={() => setViewer({ stories: all, startIdx: 0 })}
            />
          ))}
        </div>
      </div>

      {viewer && (
        <MomenteViewer
          stories={viewer.stories}
          startIdx={viewer.startIdx}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
}

/* ── Single Avatar Bubble — HUI Premium ── */
function MomenteAvatar({ label, avatar, isOwn, hasStory, onTap, animDelay=0 }) {
  const TEAL  = "#16D7C5";
  const CORAL = "#FF8A6B";
  const [pressed, setPressed] = React.useState(false);

  return (
    <div onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        flexShrink:0, display:"flex", flexDirection:"column",
        alignItems:"center", gap:6, cursor:"pointer",
        WebkitTapHighlightColor:"transparent",
        animation: `dfFadeUp 0.35s ${animDelay}s both`,
        transform: pressed ? "scale(0.93)" : "scale(1)",
        transition: "transform 0.18s cubic-bezier(0.34,1.4,0.64,1)",
      }}>

      {/* Outer glow + ring container */}
      <div style={{ position:"relative", width:64, height:64 }}>

        {/* ── Story-Ring: echtes Gradient-SVG ── */}
        {hasStory && (
          <svg width="72" height="72" viewBox="0 0 72 72"
            style={{ position:"absolute", top:-4, left:-4,
              animation:"dfRingPulse 3s ease-in-out infinite" }}>
            <defs>
              <linearGradient id="huiRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#16D7C5"/>
                <stop offset="50%"  stopColor="#A78BFA"/>
                <stop offset="100%" stopColor="#FF8A6B"/>
              </linearGradient>
            </defs>
            <circle cx="36" cy="36" r="33"
              fill="none"
              stroke="url(#huiRingGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 2.5"
              style={{ animation:"dfRingDash 8s linear infinite" }}
            />
          </svg>
        )}

        {/* ── Empty own ring: dashed teal ── */}
        {!hasStory && isOwn && (
          <svg width="72" height="72" viewBox="0 0 72 72"
            style={{ position:"absolute", top:-4, left:-4 }}>
            <circle cx="36" cy="36" r="33"
              fill="none"
              stroke="rgba(22,215,197,0.38)"
              strokeWidth="1.8"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* ── Avatar circle ── */}
        <div style={{
          width:64, height:64, borderRadius:"50%",
          overflow:"hidden", position:"relative", zIndex:1,
          background: isOwn && !avatar
            ? `linear-gradient(145deg,${TEAL}25,${CORAL}18)`
            : `linear-gradient(145deg,rgba(22,215,197,0.12),rgba(255,138,107,0.10))`,
          boxShadow: hasStory
            ? `0 0 0 2.5px #F9F7F4, 0 4px 18px rgba(22,215,197,0.22)`
            : `0 0 0 2px #F9F7F4, 0 2px 10px rgba(0,0,0,0.08)`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {avatar
            ? <img src={avatar} alt={label}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                onError={e => { e.target.style.display="none"; }}/>
            : isOwn
              ? (
                <div style={{ display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:1 }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="10"
                      stroke={TEAL} strokeWidth="1.6" strokeDasharray="3 2"/>
                    <line x1="11" y1="6" x2="11" y2="16"
                      stroke={TEAL} strokeWidth="2" strokeLinecap="round"/>
                    <line x1="6" y1="11" x2="16" y2="11"
                      stroke={TEAL} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              )
              : (
                <span style={{ fontSize:22, fontWeight:800,
                  color:TEAL, letterSpacing:-1 }}>
                  {(label||"?")[0].toUpperCase()}
                </span>
              )
          }
        </div>

        {/* ── Online dot für andere User ── */}
        {!isOwn && hasStory && (
          <div style={{
            position:"absolute", bottom:1, right:1, zIndex:2,
            width:13, height:13, borderRadius:"50%",
            background:`linear-gradient(135deg,${TEAL},${TEAL}CC)`,
            border:"2.5px solid #F9F7F4",
            boxShadow:`0 0 6px ${TEAL}88`,
          }}/>
        )}
      </div>

      {/* Label */}
      <span style={{
        fontSize:10.5, color:"#4A4A4A", fontWeight: hasStory ? 700 : 500,
        maxWidth:68, textAlign:"center",
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        lineHeight:1.2, letterSpacing:0.1,
      }}>
        {label}
      </span>
    </div>
  );
}

/* ── Full-Screen Story Viewer ── */
function MomenteViewer({ stories, startIdx=0, onClose }) {
  const [idx,     setIdx]     = React.useState(startIdx);
  const [paused,  setPaused]  = React.useState(false);
  const [pct,     setPct]     = React.useState(0);
  const elapsed = React.useRef(0);
  const raf     = React.useRef(null);
  const DURATION = 5000;

  const current = stories[idx];
  const goNext  = React.useCallback(() => {
    elapsed.current = 0; setPct(0);
    if (idx < stories.length - 1) setIdx(p=>p+1); else onClose?.();
  }, [idx, stories.length, onClose]);
  const goPrev  = () => {
    elapsed.current = 0; setPct(0);
    if (idx > 0) setIdx(p=>p-1);
  };

  // Progress timer
  React.useEffect(() => {
    if (paused) return;
    const step = 16;
    raf.current = setInterval(() => {
      elapsed.current += step;
      setPct(Math.min(100, (elapsed.current / DURATION) * 100));
      if (elapsed.current >= DURATION) { elapsed.current = 0; setPct(0); goNext(); }
    }, step);
    return () => clearInterval(raf.current);
  }, [idx, paused, goNext]);

  // Touch swipe down to close
  const touchStart = React.useRef(null);
  const onTouchStart = e => { touchStart.current = { y: e.touches[0].clientY, x: e.touches[0].clientX }; };
  const onTouchEnd   = e => {
    if (!touchStart.current) return;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (dy > 80 && Math.abs(dx) < 60) onClose?.();
    touchStart.current = null;
  };

  if (!current) return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, background:"#000",
      display:"flex", flexDirection:"column" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Progress bars */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:2,
        padding:"max(48px,env(safe-area-inset-top,48px)) 12px 0",
        display:"flex", gap:4 }}>
        {stories.map((_,i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2,
            background:"rgba(255,255,255,0.3)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:2,
              background:"white",
              width: i < idx ? "100%" : i === idx ? `${pct}%` : "0%",
              transition: i === idx ? "none" : "none" }}/>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:3,
        padding:"max(60px,env(safe-area-inset-top,60px)) 16px 12px",
        display:"flex", alignItems:"center", gap:10,
        background:"linear-gradient(to bottom,rgba(0,0,0,0.5),transparent)" }}>
        <div style={{ width:38, height:38, borderRadius:"50%", overflow:"hidden",
          border:"2px solid rgba(255,255,255,0.6)", flexShrink:0,
          background:"rgba(255,255,255,0.1)" }}>
          {current.avatar_url
            ? <img src={current.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",
                justifyContent:"center",color:"white",fontSize:16}}>✦</div>
          }
        </div>
        <div>
          <div style={{ color:"white", fontWeight:700, fontSize:14, lineHeight:1.2 }}>
            {current.username || "HUI User"}
          </div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>
            {current.created_at
              ? new Date(current.created_at).toLocaleTimeString("de",{hour:"2-digit",minute:"2-digit"})
              : ""}
          </div>
        </div>
        <button onClick={onClose}
          style={{ marginLeft:"auto", width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,0.15)", border:"none", color:"white",
            fontSize:20, cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", backdropFilter:"blur(8px)" }}>×</button>
      </div>

      {/* Media */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative" }}>
        {current.media_url
          ? (current.media_type === "video"
              ? <video src={current.media_url} autoPlay loop muted playsInline
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <img src={current.media_url}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>)
          : <div style={{ width:"100%", height:"100%",
              background:"linear-gradient(135deg,#16D7C5,#A78BFA,#FF8A6B)" }}/>
        }
        {/* Caption */}
        {current.text_overlay && (
          <div style={{ position:"absolute", bottom:80, left:20, right:20,
            background:"rgba(0,0,0,0.5)", backdropFilter:"blur(12px)",
            borderRadius:16, padding:"12px 16px",
            color:"white", fontSize:15, fontWeight:500, lineHeight:1.5 }}>
            {current.text_overlay}
          </div>
        )}
        {/* Tap zones */}
        <div style={{ position:"absolute", left:0, top:0, width:"40%", height:"100%",
          cursor:"pointer" }} onClick={goPrev}/>
        <div style={{ position:"absolute", right:0, top:0, width:"60%", height:"100%",
          cursor:"pointer" }}
          onClick={goNext}
          onPointerDown={()=>setPaused(true)}
          onPointerUp={()=>setPaused(false)}/>
      </div>
    </div>
  );
}

export default function DiscoveryFeed({ onView, onBook, onImpact, onMatch, onMap, onBuyWerk, onAddToKorb, refreshSignal, storyRefreshKey, onOpenComposer }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  // ── Echte Supabase-Daten ──────────────────────────────────────────
  const [dbWerke,   setDbWerke]   = useState([]);
  const [dbFeed,    setDbFeed]    = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError,   setFeedError]   = useState(null);

  // Normalisiert ein Work-Objekt für den Feed
  const mapWork = (w, prof = {}) => ({
    id:              w.id,
    type:            "werk",
    title:           w.title        || "Unbekanntes Werk",
    creator:         prof.display_name || prof.username || "Unbekannt",
    creatorUsername: prof.username   || null,
    creatorImg:      prof.avatar_url || null,
    city:            "",
    price:           w.price != null ? `€ ${Number(w.price).toFixed(0)}` : "",
    category:        w.category     || "Kunst",
    bio:             w.description  || "",
    img: w.cover_url
      || w.media_url
      || (Array.isArray(w.images) && w.images.length > 0 ? w.images[0] : null)
      || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=90",
    _raw: w,
  });

  // ── Wirker Profiles (Supabase) ──────────────────────────────────
  const [liveWirkers, setLiveWirkers] = useState([]);
  const [wirkersLoading, setWirkersLoading] = useState(true);

  useEffect(() => {
    async function loadWirkers() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url, talent, city, availability, impact_eur")
          .eq("has_talent_profile", true)
          .eq("availability", true)
          .order("impact_eur", { ascending: false })
          .limit(10);
        if (data && data.length > 0) {
          setLiveWirkers(data.map(p => ({
            user_id:   p.id,
            name:      p.display_name || p.username || "Talent",
            talent:    p.talent || "Kreativ",
            city:      p.city  || "",
            recs:      0,
            available: p.availability !== false,
            img:       p.avatar_url || null,
            impactEur: p.impact_eur || 0,
          })));
        }
      } catch(e) {
        console.error("[DiscoveryFeed] wirkers:", e.message);
      } finally {
        setWirkersLoading(false);
      }
    }
    loadWirkers();
  }, []);

  // ── Infinite scroll state ────────────────────────────────────────
  const [page,       setPage]       = useState(0);
  const [hasMore,    setHasMore]    = useState(true);
  const [loadingMore,setLoadingMore]= useState(false);
  const PAGE_SIZE = 12;
  const loaderRef = useRef(null);

  const loadFeed = useCallback(async (reset = true) => {
    if (reset) { setFeedLoading(true); setFeedError(null); setPage(0); setHasMore(true); }
    else        { setLoadingMore(true); }

    const currentPage = reset ? 0 : page;

    try {
      // 1. Works laden mit Pagination
      const { data: worksData, error: worksErr } = await supabase
        .from("works")
        .select("id, title, description, price, cover_url, media_url, images, category, status, created_at, user_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (worksErr) throw worksErr;
      const rawWorks = worksData || [];
      if (rawWorks.length < PAGE_SIZE) setHasMore(false);

      // 2. Profile für alle Creator laden (1 Query statt N)
      const userIds = [...new Set(rawWorks.map(w => w.user_id).filter(Boolean))];
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);
        (profs || []).forEach(p => { profileMap[p.id] = p; });
      }

      // 3. Works + Profile zusammenführen
      const works = rawWorks.map(w => mapWork(w, profileMap[w.user_id] || {}));

      if (reset) {
        setDbWerke(works);
        setDbFeed(works);
      } else {
        setDbWerke(prev => [...prev, ...works]);
        setDbFeed(prev => [...prev, ...works]);
        setPage(p => p + 1);
      }
      console.log("[HUI Feed] Loaded page", currentPage, "→", works.length, "works");
    } catch(e) {
      console.error("[HUI Feed] Error:", e);
      setFeedError(e.message);
    } finally {
      setFeedLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => { loadFeed(true); }, []);
  useEffect(() => { if (refreshSignal) loadFeed(true); }, [refreshSignal]);

  // Realtime subscription für neue Works
  useEffect(() => {
    const sub = supabase
      .channel("works-feed")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "works",
        filter: "status=eq.published"
      }, (payload) => {
        console.log("[HUI Feed] Realtime new work:", payload.new?.id);
        loadFeed(true); // reload feed when new work added
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && !feedLoading) {
        loadFeed(false);
      }
    }, { threshold: 0.1 });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, feedLoading, loadFeed]);

  // Feed items: nur echte Daten — kein Mock-Fallback mehr
  const liveFeedItems = dbFeed;
  const liveWerke     = dbWerke;

  return (
    <>
      <style>{CSS}</style>
      <div className="df-scroll"
        style={{ background:C.creamWarm, overflowY:"auto",
          height:"100%", WebkitOverflowScrolling:"touch",
          paddingBottom:110 }}>

        {/* ══ 1. SEARCH HEADER ══════════════════════════════════════ */}
        <div style={{
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
          background:`
            radial-gradient(ellipse 70% 60% at 15% 0%, ${C.teal}10 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 90% 50%, ${C.coral}0C 0%, transparent 60%),
            ${C.creamWarm}`,
          paddingBottom:20,
        }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontWeight:900, fontSize:21, color:C.ink,
              letterSpacing:-0.5, lineHeight:1.1 }}>Was bewegst du heute?</div>
            <div style={{ fontSize:12.5, color:C.muted, marginTop:3 }}>
              Entdecke Menschen, Werke und Erlebnisse.
            </div>
          </div>

          {/* Search + Map */}
          <div style={{ display:"flex", gap:10, marginBottom:12, alignItems:"center" }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:15, top:"50%",
                transform:"translateY(-50%)", fontSize:14,
                color:C.muted2, pointerEvents:"none" }}>🔍</span>
              <input readOnly onFocus={onMatch}
                placeholder="Wen oder was suchst du?"
                style={{ width:"100%", background:"rgba(255,255,255,0.90)",
                  backdropFilter:"blur(12px)",
                  border:`1.5px solid ${C.border}`,
                  borderRadius:999, padding:"12px 18px 12px 40px",
                  fontSize:14, color:C.ink, outline:"none",
                  fontFamily:"inherit", boxSizing:"border-box",
                  boxShadow:"0 2px 14px rgba(0,0,0,0.06)" }}/>
            </div>
            <button onClick={onMap}
              style={{ width:46, height:46, flexShrink:0, borderRadius:15,
                background:`linear-gradient(135deg,${C.teal}1E,${C.coral}14)`,
                border:`1.5px solid ${C.teal}40`,
                cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 2px 12px ${C.tealGlow}`,
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

          {/* HUI Match */}
          <button onClick={onMatch}
            style={{ width:"100%", padding:"13px 20px",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:999, color:"white",
              fontSize:14.5, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit", display:"flex",
              alignItems:"center", justifyContent:"center", gap:8,
              boxShadow:`0 4px 18px ${C.tealGlow}`,
              WebkitTapHighlightColor:"transparent" }}>
            <span>✨</span><span>HUI Match</span>
          </button>
        </div>

        {/* ══ 1b. MOMENTE ═══════════════════════════════════════════ */}
        <div style={{ padding:"18px 0 12px" }}>
          {/* Section header */}
          <div style={{ padding:"0 20px 10px",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{
                width:3, height:14, borderRadius:99,
                background:"linear-gradient(to bottom,#16D7C5,#FF8A6B)",
              }}/>
              <span style={{ fontSize:13, fontWeight:800, color:"#1A1A1A",
                letterSpacing:0.1 }}>Momente</span>
            </div>
            <span style={{
              fontSize:10.5, color:"#16D7C5", fontWeight:700,
              background:"rgba(22,215,197,0.10)",
              border:"1px solid rgba(22,215,197,0.22)",
              borderRadius:999, padding:"3px 10px",
              letterSpacing:0.2,
            }}>
              24h
            </span>
          </div>
          <MomenteBar
            user={user}
            refreshKey={storyRefreshKey}
            onOpenComposer={onOpenComposer}
          />
        </div>

        {/* ══ 2. WIRKER GRID ════════════════════════════════════════ */}
        <SectionHeader
          title="Menschen, die inspirieren"
          sub="Echte Talente in deiner Nähe"
          accent={C.teal}
          onAll={() => {}}
        />
        <div className="df-scroll"
          style={{ display:"flex", gap:12, overflowX:"auto",
            padding:"0 20px 4px" }}>
          {(liveWirkers.length > 0 ? liveWirkers : WIRKERS).map((w, i) => (
            <WirkerTile key={w.user_id || i} w={w} onView={onView} onBook={onBook}/>
          ))}
        </div>

        {/* ══ 3. WERKE GRID ════════════════════════════════════════ */}
        <SectionHeader
          title="Werke mit Seele"
          sub="Handgefertigt. Einzigartig. Bedeutungsvoll."
          accent={C.coral}
          onAll={() => {}}
        />
        <div className="df-scroll"
          style={{ display:"flex", gap:12, overflowX:"auto",
            padding:"0 20px 4px" }}>
          {liveWerke.map((w, i) => (
            <WerkTile key={i} w={w} onView={onView} onBuyWerk={onBuyWerk} navigate={navigate}/>
          ))}
        </div>

        {/* ══ 4. IMMERSIVER FEED ═══════════════════════════════════ */}
        <Divider label="Entdecken" accent={C.teal}/>

        {feedError && (
          <div style={{ margin:"0 16px 16px", padding:"12px 16px",
            borderRadius:14, background:"#FFF0EE",
            border:"1px solid #FF8A6B44" }}>
            <span style={{ fontSize:12, color:"#E05A3A", fontWeight:700 }}>
              ⚠ Feed-Fehler: {feedError}
            </span>
            <button onClick={loadFeed}
              style={{ marginLeft:10, fontSize:11, color:"#16D7C5",
                fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>
              Retry
            </button>
          </div>
        )}

        {feedLoading && (
          <>
            {/* Skeleton Werke-Tiles */}
            <div style={{ display:"flex", gap:12, overflowX:"auto",
              padding:"0 20px 4px", marginBottom:8 }}>
              {[0,1,2].map(i => <WerkTileSkeleton key={i}/>)}
            </div>
            {/* Skeleton Feed-Cards */}
            <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:12, marginTop:12 }}>
              <WerkCardSkeleton/>
            </div>
          </>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {liveFeedItems.map((item, i) => {
            const divAccent =
              item.type==="wirker" ? C.teal :
              item.type==="werk"   ? C.coral :
              item.type==="experience" ? C.gold : C.green;
            const divLabel =
              item.type==="wirker" ? "Menschen" :
              item.type==="werk"   ? "Werke" :
              item.type==="experience" ? "Erlebnisse" : "Impact";

            return (
              <div key={item.id}>
                {i > 0 && <Divider label={divLabel} accent={divAccent}/>}
                <div style={{ padding:"0 16px" }}>
                  {item.type==="wirker"     && <WirkerCard     item={item} onView={onView} onBook={onBook}/>}
                  {item.type==="werk"       && <WerkCard        item={item} onView={onView} onBuyWerk={onBuyWerk} onAddToKorb={onAddToKorb} navigate={navigate}/>}
                  {item.type==="experience" && <ExperienceCard  item={item} onView={onView}/>}
                  {item.type==="impact"     && <ImpactCard      item={item} onImpact={onImpact}/>}
                </div>
              </div>
            );
          })}

          {/* ── Empty state wenn keine echten Daten ── */}
          {!feedLoading && liveFeedItems.length === 0 && (
            <div style={{ padding:"60px 28px", textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:16 }}>🌱</div>
              <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:8 }}>
                Noch keine Inhalte
              </div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
                Sei der Erste — lade ein Werk hoch oder teile einen Moment.
              </div>
            </div>
          )}

          {/* ── Infinite scroll loader ── */}
          <div ref={loaderRef} style={{ height:1 }} />

          {/* ── Loading more indicator ── */}
          {loadingMore && (
            <div style={{ display:"flex", justifyContent:"center", padding:"20px 0 8px" }}>
              <div style={{ display:"flex", gap:6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:"50%",
                    background:C.teal, opacity:0.6,
                    animation:`dfSkPulse 1s ease-in-out ${i*0.2}s infinite alternate` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Feed end (nur wenn alles geladen) ── */}
          {!hasMore && liveFeedItems.length > 0 && (
            <div style={{ padding:"44px 28px 0", textAlign:"center" }}>
              <div style={{ width:36, height:1, background:C.teal,
                margin:"0 auto 14px", opacity:0.4 }}/>
              <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.7,
                fontStyle:"italic", maxWidth:210, margin:"0 auto" }}>
                Das war es für heute. Morgen warten neue Menschen und Momente.
              </div>
              <div style={{ fontSize:22, marginTop:14,
                animation:"dfBreath 4s ease-in-out infinite" }}>🌿</div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
