// DiscoveryFeed.jsx — HUI Home Feed
// Struktur: Search → HUI Match → Wirker Grid → Werke Grid → Immersiver Discovery Feed
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { normalizeProfileInput, PROFILE_FIELDS } from '../lib/perfUtils';
import { sentryCapture } from "../lib/sentry";
import { useAuth } from "../lib/AuthContext";
import HuiSearchBar from "./HuiSearchBar";
import VirtualFeedList, { FeedEndSentinel } from "./VirtualFeedList";
import LazyImage from "./LazyImage";

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
  /* ── Core Animations ────────────────────────────────────────── */
  @keyframes dfFadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dfFadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes dfKenBurns  { from{transform:scale(1) translate(0,0)} to{transform:scale(1.07) translate(-0.5%,-0.5%)} }
  @keyframes dfSkel      { 0%,100%{opacity:1} 50%{opacity:0.48} }
  @keyframes dfSkPulse   { 0%,100%{opacity:1} 50%{opacity:0.42} }
  @keyframes dfSaved     { 0%{transform:scale(1)} 40%{transform:scale(1.5)} 70%{transform:scale(0.88)} 100%{transform:scale(1)} }
  @keyframes dfShimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes dfGlow      { 0%,100%{opacity:0.4} 50%{opacity:0.85} }
  @keyframes dfPop       { 0%{transform:scale(0.88);opacity:0} 65%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  @keyframes dfRingPulse {
    0%,100%{ filter:drop-shadow(0 0 0px rgba(22,215,197,0)); }
    50%    { filter:drop-shadow(0 0 6px rgba(22,215,197,0.55)); }
  }
  @keyframes dfRingDash  { from{stroke-dashoffset:0} to{stroke-dashoffset:-28} }
  @keyframes dfFloat     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

  /* ── Interaction ────────────────────────────────────────────── */
  .df-scroll::-webkit-scrollbar{display:none}
  .df-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .df-tap{transition:transform .18s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent;user-select:none}
  .df-tap:active{transform:scale(.965)}
  .df-card-tap{transition:transform .22s cubic-bezier(.34,1.3,.64,1),box-shadow .22s;-webkit-tap-highlight-color:transparent;user-select:none;cursor:pointer}
  .df-card-tap:active{transform:scale(.975)}
  .df-moment-ring svg circle{animation:dfRingDash 8s linear infinite}

  /* ── Shimmer ────────────────────────────────────────────────── */
  .df-shimmer{
    background:linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%);
    background-size:200% 100%;
    animation:dfShimmer 1.5s ease-in-out infinite;
  }
`;

/* ── SAVE BTN ──────────────────────────────────────────────────────────── */

/* ── CreatorRow — Avatar + Name + @username, klickbar ──────────────── */
function CreatorAvatar({ url, name, size = 28 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (url) return (
    <img loading="lazy" decoding="async" src={url} alt={name}
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



/* ══════════════════════════════════════════════════════════════════
   PREMIUM FEED CARDS — HUI Visual Identity v4
   Nur UI/Styling. Datenlogik, Props, Callbacks unverändert.
══════════════════════════════════════════════════════════════════ */

/* ── SAVE BTN — eleganter, subtiler ─────────────────────────────── */
function SaveBtn({ accent, dark }) {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
      className="df-tap"
      style={{ width:36, height:36, borderRadius:"50%",
        background: dark
          ? "rgba(0,0,0,0.32)"
          : "rgba(255,255,255,0.92)",
        backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        border:`1px solid ${dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.07)"}`,
        cursor:"pointer", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:15, lineHeight:1,
        WebkitTapHighlightColor:"transparent",
        boxShadow: dark
          ? "0 2px 12px rgba(0,0,0,0.25)"
          : "0 2px 8px rgba(0,0,0,0.10)",
        animation: saved ? "dfSaved 0.42s cubic-bezier(.34,1.6,.64,1)" : "none",
        transition:"background .2s, border .2s" }}>
      {saved
        ? <span style={{ color: accent, filter:`drop-shadow(0 0 4px ${accent})` }}>♥</span>
        : <span style={{ opacity:0.72 }}>♡</span>}
    </button>
  );
}

/* ── WIRKER TILE — kompakt, portrait, emotional ──────────────────── */
function WirkerTile({ w, onView, onBook }) {
  return (
    <div className="df-card-tap" onClick={() => onView && onView(w)}
      style={{ flexShrink:0, width:122, cursor:"pointer",
        animation:"dfFadeUp 0.45s both" }}>
      {/* Portrait */}
      <div style={{ borderRadius:22, overflow:"hidden",
        height:158, position:"relative",
        boxShadow:"0 6px 22px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)" }}>
        <img loading="lazy" decoding="async" src={w.img || w.avatar_url} alt={w.name || w.display_name}
          style={{ width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"top center",
            filter:"brightness(0.82) saturate(1.18)" }}/>
        {/* Teal ambient top */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:40,
          background:`linear-gradient(to bottom,rgba(22,215,197,0.22),transparent)`,
          pointerEvents:"none" }}/>
        {/* Deep gradient bottom */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 38%,rgba(0,0,0,0.72) 100%)",
          pointerEvents:"none" }}/>
        {/* Available glow dot */}
        {w.available !== false && (
          <div style={{ position:"absolute", top:10, right:10 }}>
            <div style={{ width:8, height:8, borderRadius:"50%",
              background:C.green, border:"2px solid white",
              boxShadow:`0 0 0 3px rgba(61,184,122,0.3), 0 0 8px ${C.green}` }}/>
          </div>
        )}
        {/* Name over gradient */}
        <div style={{ position:"absolute", bottom:10, left:10, right:10 }}>
          <div style={{ fontWeight:800, fontSize:12, color:"white",
            lineHeight:1.2, letterSpacing:-0.3,
            textShadow:"0 1px 6px rgba(0,0,0,0.5)" }}>
            {w.name || w.display_name}
          </div>
          <div style={{ fontSize:10, color:`rgba(22,215,197,0.95)`,
            fontWeight:700, marginTop:2, letterSpacing:0.1 }}>
            {w.talent}
          </div>
        </div>
      </div>
      {/* Meta */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginTop:7, paddingLeft:2 }}>
        <div style={{ fontSize:10, color:C.muted,
          display:"flex", alignItems:"center", gap:3 }}>
          <span style={{ fontSize:9, opacity:0.7 }}>📍</span>
          <span>{w.city || w.location_label}</span>
        </div>
        <button onClick={e=>{e.stopPropagation(); onBook&&onBook(w);}}
          className="df-tap"
          style={{ background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            border:"none", borderRadius:999,
            padding:"4px 11px", fontSize:9.5, fontWeight:800,
            color:"white", cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 2px 8px rgba(22,215,197,0.32)`,
            WebkitTapHighlightColor:"transparent" }}>
          Buchen
        </button>
      </div>
    </div>
  );
}

/* ── WERK TILE — kompakt, editorial ──────────────────────────────── */
function WerkTile({ w, onView, onBuyWerk, navigate }) {
  return (
    <div className="df-card-tap"
      onClick={() => { if(w.id && navigate) navigate(`/work/${w.id}`); else if(onView) onView(w); }}
      style={{ flexShrink:0, width:134, cursor:"pointer",
        animation:"dfFadeUp 0.45s both" }}>
      <div style={{ borderRadius:20, overflow:"hidden",
        height:158, position:"relative",
        boxShadow:"0 6px 22px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.07)" }}>
        <img loading="lazy" decoding="async" src={w.img} alt={w.title}
          style={{ width:"100%", height:"100%",
            objectFit:"cover",
            filter:"brightness(0.84) saturate(1.18)" }}/>
        {/* Coral ambient */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:40,
          background:`linear-gradient(to bottom,rgba(255,138,107,0.18),transparent)`,
          pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 35%,rgba(0,0,0,0.65) 100%)",
          pointerEvents:"none" }}/>
        {/* Price badge */}
        <div style={{ position:"absolute", top:8, left:8 }}>
          <div style={{ background:"rgba(255,255,255,0.94)",
            backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
            borderRadius:999, padding:"3px 10px",
            fontSize:11, fontWeight:900, color:C.ink,
            boxShadow:"0 2px 8px rgba(0,0,0,0.12)" }}>
            {w.price}
          </div>
        </div>
        <div style={{ position:"absolute", top:6, right:6 }}>
          <SaveBtn accent={C.coral} dark/>
        </div>
        {/* Title over gradient */}
        <div style={{ position:"absolute", bottom:10, left:10, right:10 }}>
          <div style={{ fontWeight:800, fontSize:11.5, color:"white",
            lineHeight:1.25, letterSpacing:-0.2,
            textShadow:"0 1px 6px rgba(0,0,0,0.5)" }}>
            {w.title}
          </div>
        </div>
      </div>
      <div style={{ padding:"6px 3px 0" }}>
        <div onClick={e=>{ e.stopPropagation();
          if(navigate) navigate(`/profile/${w.creatorUsername||"hui-user"}`); }}
          style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer" }}>
          <CreatorAvatar url={w.creatorImg||null} name={w.creator||"?"} size={16}/>
          <span style={{ fontSize:10.5, color:C.teal,
            fontWeight:700, overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", maxWidth:95 }}>
            {w.creator || "Unbekannt"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── SECTION HEADER — editorial ──────────────────────────────────── */
function SectionHeader({ title, sub, accent, onAll }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end",
      justifyContent:"space-between",
      padding:"28px 20px 14px" }}>
      <div>
        <div style={{ fontWeight:900, fontSize:19, color:C.ink,
          letterSpacing:-0.5, lineHeight:1.15 }}>{title}</div>
        {sub && (
          <div style={{ fontSize:12, color:C.muted, marginTop:3,
            fontWeight:500 }}>{sub}</div>
        )}
      </div>
      {onAll && (
        <button onClick={onAll}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:12, fontWeight:700, color:accent,
            padding:"6px 13px", borderRadius:999,
            background:`${accent}14`,
            WebkitTapHighlightColor:"transparent",
            fontFamily:"inherit", letterSpacing:0.2 }}>
          Alle →
        </button>
      )}
    </div>
  );
}

/* ── DIVIDER — atmospheric ───────────────────────────────────────── */
function Divider({ label, accent }) {
  return (
    <div style={{ padding:"28px 22px 8px",
      display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(90deg,${accent}55,transparent)` }}/>
      <span style={{ fontSize:9, fontWeight:800, color:accent,
        letterSpacing:2.8, textTransform:"uppercase", opacity:0.7 }}>
        {label}
      </span>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(270deg,${accent}55,transparent)` }}/>
    </div>
  );
}

/* ── WIRKER CARD — cinematic fullscreen, Creator-First ───────────── */

/* ══════════════════════════════════════════════════════════════════
   VARIANT-AWARE CARD SYSTEM
   variant: "hero" | "mid" | "compact" | "full"
   Datenlogik identisch — nur Höhen/Padding/Schriftgröße variieren.
══════════════════════════════════════════════════════════════════ */

const ipad = typeof window !== 'undefined' && window.innerWidth >= 768;

/* ── Variant-Höhen-Tabelle ── */
function cardH(variant, type) {
  const table = {
    //        hero    mid     compact  full
    wirker:  [ipad?680:610, ipad?520:470, ipad?400:360, ipad?740:660],
    werk:    [ipad?640:580, ipad?490:440, ipad?380:340, ipad?700:630],
    experience:[ipad?630:570,ipad?480:430,ipad?370:330, ipad?690:620],
    impact:  [ipad?590:540, ipad?460:415, ipad?360:320, ipad?660:600],
  };
  const row = table[type] || table.werk;
  return ({ hero: row[0], mid: row[1], compact: row[2], full: row[3] })[variant] || row[0];
}

/* ── Variant-Typografie ── */
function titleSize(variant, len) {
  const base = { hero:28, mid:23, compact:19, full:32 }[variant] || 28;
  return len > 20 ? base - 4 : len > 14 ? base - 2 : base;
}
function quoteSize(variant) {
  return { hero:13, mid:12.5, compact:12, full:14 }[variant] || 13;
}
function paddingBottom(variant) {
  return { hero:28, mid:24, compact:20, full:32 }[variant] || 28;
}

/* ── WIRKER CARD ─────────────────────────────────────────────────── */
function WirkerCard({ item, onView, onBook, variant = "hero" }) {
  const h = cardH(variant, "wirker");
  const isCompact = variant === "compact";
  const isMid     = variant === "mid";

  return (
    <div className="df-card-tap" onClick={() => onView && onView(item)}
      style={{ position:"relative", width:"100%",
        height:h, overflow:"hidden", cursor:"pointer",
        borderRadius: isCompact ? 22 : 26,
        animation:"dfFadeUp 0.5s both",
        boxShadow: isCompact
          ? "0 8px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08)"
          : "0 18px 52px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)" }}>

      {/* BG Ken-Burns (nur hero/full für Performance) */}
      <div style={{ position:"absolute", inset:0,
        animation: !isCompact ? "dfKenBurns 22s ease-in-out infinite alternate" : "none" }}>
        <img loading="lazy" decoding="async"
          src={item.img || item.avatar_url} alt={item.name || item.display_name}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            objectPosition:"top center",
            filter:`brightness(${isCompact ? "0.72" : "0.65"}) saturate(1.22)` }}/>
      </div>

      {/* Ambient Teal top-left + deep bottom gradient */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:`
          radial-gradient(ellipse 75% 45% at 0% 0%,
            rgba(22,215,197,${isCompact ? "0.18" : "0.24"}) 0%, transparent 60%),
          linear-gradient(to bottom,
            rgba(0,0,0,0.25) 0%,
            transparent ${isCompact ? "28" : "25"}%,
            rgba(6,6,6,${isCompact ? "0.84" : "0.90"}) 100%)` }}/>

      {/* Accent line */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, pointerEvents:"none",
        background:`linear-gradient(90deg,${C.teal},${C.teal}55,transparent)`, opacity:0.9 }}/>

      {/* Label + Save */}
      <div style={{ position:"absolute", top:18, left:18, right:18,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ background:"rgba(22,215,197,0.13)", backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          border:"1px solid rgba(22,215,197,0.28)", borderRadius:999,
          padding:"4px 13px", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:8, color:C.teal, fontWeight:900,
            letterSpacing:2, textTransform:"uppercase" }}>Talent</span>
          {item.available !== false && (
            <span style={{ width:5, height:5, borderRadius:"50%", background:C.green,
              boxShadow:`0 0 0 2px rgba(61,184,122,0.4)`, display:"block" }}/>
          )}
        </div>
        <SaveBtn accent={C.teal} dark/>
      </div>

      {/* Content bottom */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:`0 22px ${paddingBottom(variant)}px` }}>

        {/* Quote — nur hero/full */}
        {!isCompact && item.bio && (
          <p style={{ fontSize:quoteSize(variant), color:"rgba(255,255,255,0.65)",
            fontStyle:"italic", lineHeight:1.72, marginBottom:10,
            textShadow:"0 1px 10px rgba(0,0,0,0.45)",
            letterSpacing:0.08 }}>
            „{item.bio}"
          </p>
        )}

        {/* Name */}
        <div style={{ fontWeight:900,
          fontSize:titleSize(variant, (item.name||item.display_name||"").length),
          color:"white", letterSpacing:-0.8, lineHeight:1.05,
          marginBottom:isCompact ? 6 : 5,
          textShadow:"0 2px 18px rgba(0,0,0,0.55)" }}>
          {item.name || item.display_name}
        </div>

        {/* Talent + City */}
        <div style={{ display:"flex", alignItems:"center", gap:8,
          marginBottom: isCompact ? 14 : 14 }}>
          <span style={{ fontSize: isCompact ? 12 : 13, color:C.teal,
            fontWeight:700 }}>{item.talent}</span>
          {(item.city || item.location_label) && (
            <>
              <span style={{ width:3, height:3, borderRadius:"50%",
                background:"rgba(255,255,255,0.28)", display:"block" }}/>
              <span style={{ fontSize:11.5, color:"rgba(255,255,255,0.44)" }}>
                📍 {item.city || item.location_label}
              </span>
            </>
          )}
        </div>

        {/* Stats — nur hero/full */}
        {!isCompact && (item.recs > 0 || item.hourly) && (
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {item.recs > 0 && (
              <div style={{ background:"rgba(255,255,255,0.09)",
                backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.12)",
                borderRadius:999, padding:"5px 14px",
                display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:11, color:C.teal, fontWeight:900 }}>{item.recs}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.48)" }}>Empf.</span>
              </div>
            )}
            {item.hourly && (
              <div style={{ background:"rgba(255,255,255,0.09)",
                backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.12)",
                borderRadius:999, padding:"5px 14px",
                display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:11, color:C.coral, fontWeight:900 }}>€ {item.hourly}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.48)" }}>/Std</span>
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display:"flex", gap:10 }}>
          {!isCompact && (
            <button onClick={e=>{e.stopPropagation(); onView&&onView(item);}}
              className="df-tap"
              style={{ flex:1, padding:"12px 14px",
                background:"rgba(255,255,255,0.11)", backdropFilter:"blur(12px)",
                WebkitBackdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,0.20)",
                borderRadius:14, color:"rgba(255,255,255,0.88)",
                fontSize:13, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit", WebkitTapHighlightColor:"transparent" }}>
              Mehr ansehen
            </button>
          )}
          <button onClick={e=>{e.stopPropagation(); onBook&&onBook(item);}}
            className="df-tap"
            style={{ flex: isCompact ? "unset" : 1.5,
              width: isCompact ? "100%" : "auto",
              padding:"12px 14px",
              background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:14, color:"white",
              fontSize: isCompact ? 12.5 : 13, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:`0 5px 18px rgba(22,215,197,0.36)`,
              WebkitTapHighlightColor:"transparent" }}>
            Anfragen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── WERK CARD ───────────────────────────────────────────────────── */
function WerkCard({ item, onView, onBuyWerk, onAddToKorb, navigate, variant = "hero" }) {
  const h = cardH(variant, "werk");
  const isCompact = variant === "compact";

  return (
    <div className="df-card-tap" onClick={() => {
      if(item.id && navigate) navigate(`/work/${item.id}`);
      else if(onView) onView(item);
    }}
      style={{ position:"relative", width:"100%",
        height:h, overflow:"hidden", cursor:"pointer",
        borderRadius: isCompact ? 22 : 26,
        animation:"dfFadeUp 0.5s both",
        boxShadow: isCompact
          ? "0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)"
          : "0 18px 52px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.09)" }}>

      <div style={{ position:"absolute", inset:0,
        animation: !isCompact ? "dfKenBurns 20s ease-in-out infinite alternate" : "none" }}>
        <img loading="lazy" decoding="async" src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:`brightness(${isCompact ? "0.75" : "0.68"}) saturate(1.24)` }}/>
      </div>

      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:`
          radial-gradient(ellipse 60% 40% at 100% 0%,
            rgba(255,138,107,${isCompact ? "0.16" : "0.20"}) 0%, transparent 58%),
          linear-gradient(to bottom,
            rgba(0,0,0,0.22) 0%,
            transparent ${isCompact ? "28" : "24"}%,
            rgba(6,4,2,${isCompact ? "0.86" : "0.92"}) 100%)` }}/>

      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, pointerEvents:"none",
        background:`linear-gradient(90deg,${C.coral},${C.coral}55,transparent)`, opacity:0.9 }}/>

      {/* Header */}
      <div style={{ position:"absolute", top:18, left:18, right:18,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ background:"rgba(255,138,107,0.13)", backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          border:"1px solid rgba(255,138,107,0.26)", borderRadius:999, padding:"4px 13px" }}>
          <span style={{ fontSize:8, color:C.coral, fontWeight:900,
            letterSpacing:2, textTransform:"uppercase" }}>
            {item.category || "Werk"}
          </span>
        </div>
        <SaveBtn accent={C.coral} dark/>
      </div>

      {/* Content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:`0 22px ${paddingBottom(variant)}px` }}>

        {/* Creator row — immer sichtbar, hero größer */}
        <div style={{ display:"flex", alignItems:"center", gap:9,
          marginBottom: isCompact ? 8 : 12 }}>
          <CreatorAvatar url={item.creatorImg||null} name={item.creator||"?"} size={isCompact ? 24 : 30}/>
          <div>
            {!isCompact && (
              <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.50)",
                fontWeight:500, marginBottom:1 }}>von</div>
            )}
            <div style={{ fontSize: isCompact ? 12 : 13.5, color:"white",
              fontWeight:800, letterSpacing:-0.2 }}>
              {item.creator || "Unbekannt"}
            </div>
          </div>
        </div>

        {!isCompact && item.bio && (
          <p style={{ fontSize:quoteSize(variant), color:"rgba(255,255,255,0.60)",
            fontStyle:"italic", lineHeight:1.68, marginBottom:10,
            textShadow:"0 1px 10px rgba(0,0,0,0.45)" }}>
            „{item.bio}"
          </p>
        )}

        <div style={{ fontWeight:900,
          fontSize:titleSize(variant, (item.title||"").length),
          color:"white", letterSpacing:-0.6, lineHeight:1.1,
          marginBottom: isCompact ? 14 : 16,
          textShadow:"0 2px 16px rgba(0,0,0,0.55)" }}>
          {item.title}
        </div>

        {!isCompact && (item.city || item.category) && (
          <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.40)",
            marginBottom:18, fontWeight:500, letterSpacing:0.1 }}>
            {item.category && <span>{item.category}</span>}
            {item.city && item.category && <span> · </span>}
            {item.city && <span>📍 {item.city}</span>}
          </div>
        )}

        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {item.price && (
            <div style={{ background:"rgba(255,255,255,0.10)",
              backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.16)",
              borderRadius:14, padding:"11px 14px",
              fontSize: isCompact ? 14 : 16, fontWeight:900, color:"white" }}>
              {item.price}
            </div>
          )}
          <button onClick={e=>{e.stopPropagation();
            if(item.id && navigate) navigate(`/work/${item.id}`);
            else if(onView) onView(item);
          }}
            className="df-tap"
            style={{ flex:1, padding:"12px 14px",
              background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
              border:"none", borderRadius:14, color:"white",
              fontSize: isCompact ? 12.5 : 13.5, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:`0 5px 18px rgba(255,138,107,0.34)`,
              WebkitTapHighlightColor:"transparent" }}>
            Entdecken →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── EXPERIENCE CARD ─────────────────────────────────────────────── */
function ExperienceCard({ item, onView, variant = "hero" }) {
  const h = cardH(variant, "experience");
  const isCompact = variant === "compact";

  return (
    <div className="df-card-tap" onClick={() => onView && onView(item)}
      style={{ position:"relative", width:"100%",
        height:h, overflow:"hidden", cursor:"pointer",
        borderRadius: isCompact ? 22 : 26,
        animation:"dfFadeUp 0.5s both",
        boxShadow: isCompact
          ? "0 8px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08)"
          : "0 18px 52px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)" }}>

      <div style={{ position:"absolute", inset:0,
        animation: !isCompact ? "dfKenBurns 18s ease-in-out infinite alternate" : "none" }}>
        <img loading="lazy" decoding="async" src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:`brightness(${isCompact ? "0.70" : "0.62"}) saturate(1.28)` }}/>
      </div>

      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:`
          radial-gradient(ellipse 58% 35% at 50% 5%,
            rgba(245,166,35,${isCompact ? "0.18" : "0.22"}) 0%, transparent 55%),
          linear-gradient(to bottom,
            rgba(0,0,0,0.28) 0%,
            transparent ${isCompact ? "26" : "22"}%,
            rgba(5,4,0,${isCompact ? "0.88" : "0.94"}) 100%)` }}/>

      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, pointerEvents:"none",
        background:`linear-gradient(90deg,${C.gold},${C.gold}55,transparent)`, opacity:0.9 }}/>

      <div style={{ position:"absolute", top:18, left:18, right:18,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ background:"rgba(245,166,35,0.14)", backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            border:"1px solid rgba(245,166,35,0.32)", borderRadius:999, padding:"4px 13px" }}>
            <span style={{ fontSize:8, color:C.gold, fontWeight:900,
              letterSpacing:2, textTransform:"uppercase" }}>Erlebnis</span>
          </div>
          {item.spots != null && item.spots <= 3 && (
            <div style={{ background:"rgba(255,138,107,0.17)", backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,138,107,0.33)", borderRadius:999,
              padding:"4px 10px", fontSize:9, color:C.coral, fontWeight:800,
              display:"flex", alignItems:"center", gap:4 }}>
              🔥 Nur noch {item.spots}
            </div>
          )}
        </div>
        <SaveBtn accent={C.gold} dark/>
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:`0 22px ${paddingBottom(variant)}px` }}>

        {!isCompact && item.bio && (
          <p style={{ fontSize:quoteSize(variant), color:"rgba(255,255,255,0.62)",
            fontStyle:"italic", lineHeight:1.70, marginBottom:10,
            textShadow:"0 1px 10px rgba(0,0,0,0.45)" }}>
            „{item.bio}"
          </p>
        )}

        <div style={{ fontWeight:900,
          fontSize:titleSize(variant, (item.title||"").length),
          color:"white", letterSpacing:-0.6, lineHeight:1.1,
          marginBottom: isCompact ? 12 : 14,
          textShadow:"0 2px 16px rgba(0,0,0,0.55)" }}>
          {item.title}
        </div>

        <div style={{ display:"flex", gap:8, marginBottom: isCompact ? 14 : 18, flexWrap:"wrap" }}>
          {item.date && (
            <div style={{ background:"rgba(255,255,255,0.09)",
              backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:999, padding:"4px 12px",
              fontSize:10.5, color:"rgba(255,255,255,0.68)", fontWeight:600 }}>
              📅 {item.date}
            </div>
          )}
          {item.price && (
            <div style={{ background:"rgba(245,166,35,0.15)",
              backdropFilter:"blur(10px)", border:"1px solid rgba(245,166,35,0.30)",
              borderRadius:999, padding:"4px 12px",
              fontSize:10.5, color:C.gold, fontWeight:800 }}>
              {item.price}
            </div>
          )}
        </div>

        <button onClick={e=>{e.stopPropagation(); onView&&onView(item);}}
          className="df-tap"
          style={{ width:"100%", padding: isCompact ? "11px" : "13px",
            background:`linear-gradient(135deg,${C.gold},#E8A000)`,
            border:"none", borderRadius:14, color:"white",
            fontSize: isCompact ? 12.5 : 13.5, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:`0 5px 18px rgba(245,166,35,0.36)`,
            WebkitTapHighlightColor:"transparent" }}>
          Erlebnis entdecken
        </button>
      </div>
    </div>
  );
}

/* ── IMPACT CARD ─────────────────────────────────────────────────── */
function ImpactCard({ item, onImpact, variant = "hero" }) {
  const h = cardH(variant, "impact");
  const isCompact = variant === "compact";
  const pct = Math.min(Math.round(((item.raised||0) / (item.goal||1)) * 100), 100);

  return (
    <div className="df-card-tap" onClick={onImpact}
      style={{ position:"relative", width:"100%",
        height:h, overflow:"hidden", cursor:"pointer",
        borderRadius: isCompact ? 22 : 26,
        animation:"dfFadeUp 0.5s both",
        boxShadow: isCompact
          ? "0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)"
          : "0 18px 52px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.09)" }}>

      <div style={{ position:"absolute", inset:0,
        animation: !isCompact ? "dfKenBurns 26s ease-in-out infinite alternate" : "none" }}>
        <img loading="lazy" decoding="async" src={item.img} alt={item.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:`brightness(${isCompact ? "0.62" : "0.55"}) saturate(1.30)` }}/>
      </div>

      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:`
          radial-gradient(ellipse 72% 44% at 15% 10%,
            rgba(22,215,197,${isCompact ? "0.18" : "0.24"}) 0%, transparent 55%),
          radial-gradient(ellipse 48% 33% at 85% 85%,
            rgba(61,184,122,${isCompact ? "0.16" : "0.22"}) 0%, transparent 50%),
          linear-gradient(to bottom,
            rgba(0,0,0,0.30) 0%,
            transparent ${isCompact ? "22" : "18"}%,
            rgba(3,6,4,${isCompact ? "0.88" : "0.92"}) 100%)` }}/>

      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, pointerEvents:"none",
        background:`linear-gradient(90deg,${C.green},${C.teal},transparent)`, opacity:0.9 }}/>

      <div style={{ position:"absolute", top:18, left:18, right:18,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ background:"rgba(61,184,122,0.14)", backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          border:"1px solid rgba(61,184,122,0.32)", borderRadius:999,
          padding:"4px 13px", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:11 }}>🌱</span>
          <span style={{ fontSize:8, color:C.green, fontWeight:900,
            letterSpacing:2, textTransform:"uppercase" }}>Impact</span>
        </div>
        <SaveBtn accent={C.green} dark/>
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:`0 22px ${paddingBottom(variant)}px` }}>

        {!isCompact && item.bio && (
          <p style={{ fontSize:quoteSize(variant), color:"rgba(255,255,255,0.63)",
            fontStyle:"italic", lineHeight:1.70, marginBottom:12,
            textShadow:"0 1px 10px rgba(0,0,0,0.45)" }}>
            „{item.bio}"
          </p>
        )}

        <div style={{ fontWeight:900,
          fontSize:titleSize(variant, (item.title||"").length),
          color:"white", letterSpacing:-0.55, lineHeight:1.15,
          marginBottom: isCompact ? 14 : 18,
          textShadow:"0 2px 16px rgba(0,0,0,0.55)" }}>
          {item.title}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: isCompact ? 14 : 20 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"baseline", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
              <span style={{ fontWeight:900, fontSize: isCompact ? 16 : 18,
                color:C.green }}>
                € {Number(item.raised||0).toLocaleString("de-DE")}
              </span>
              <span style={{ fontSize:10.5, color:"rgba(255,255,255,0.40)" }}>
                von € {Number(item.goal||0).toLocaleString("de-DE")}
              </span>
            </div>
            <span style={{ fontSize:10.5, color:C.teal, fontWeight:800 }}>{pct} %</span>
          </div>
          <div style={{ height:5, borderRadius:999,
            background:"rgba(255,255,255,0.11)", overflow:"hidden",
            boxShadow:"inset 0 1px 3px rgba(0,0,0,0.2)" }}>
            <div style={{ height:"100%", borderRadius:999, width:`${pct}%`,
              background:`linear-gradient(90deg,${C.green},${C.teal})`,
              boxShadow:`0 0 10px rgba(22,215,197,0.48)`,
              transition:"width 0.9s cubic-bezier(.34,1.3,.64,1)" }}/>
          </div>
        </div>

        <button onClick={e=>{e.stopPropagation(); onImpact&&onImpact();}}
          className="df-tap"
          style={{ width:"100%", padding: isCompact ? "11px" : "13px",
            background:`linear-gradient(135deg,${C.green},${C.teal2})`,
            border:"none", borderRadius:14, color:"white",
            fontSize: isCompact ? 12.5 : 13.5, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:`0 5px 20px rgba(61,184,122,0.36)`,
            WebkitTapHighlightColor:"transparent" }}>
          Projekt unterstützen
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
            ? <img loading="lazy" decoding="async" src={avatar} alt={label}
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
            ? <img loading="lazy" decoding="async" src={current.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
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
              : <img loading="lazy" decoding="async" src={current.media_url}
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


/* ─── Memoized Card Components — prevent re-render on parent state ── */
const MemoWirkerCard     = React.memo(WirkerCard);
const MemoWerkCard       = React.memo(WerkCard);
const MemoExperienceCard = React.memo(ExperienceCard);
const MemoImpactCard     = React.memo(ImpactCard);

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
    let mounted = true;
    async function loadWirkers() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id,display_name,username,avatar_url,header_img,bio,talent,focus_type,dna_tags,location_label,is_available,is_wirker,has_talent_profile,impact_eur,followers_count")
          .eq("has_talent_profile", true)
          .eq("availability", true)
          .order("impact_eur", { ascending: false })
          .limit(10);
        if (!mounted) return;
        if (data && data.length > 0) {
          setLiveWirkers(data.map(p => ({
            // Normalisierte Felder — direkt kompatibel mit WirkerProfilePage
            id:           p.id,
            user_id:      p.id,
            username:     p.username     || null,
            display_name: p.display_name || p.username || "Talent",
            // Legacy-Felder (WirkerTile/WirkerCard lesen diese)
            name:         p.display_name || p.username || "Talent",
            talent:       p.talent       || "Kreativ",
            city:         p.location_label || "",
            available:    p.is_available !== false,
            img:          p.avatar_url   || null,
            // Neue vollständige Felder
            avatar_url:   p.avatar_url   || null,
            header_img:   p.header_img   || null,
            bio:          p.bio          || null,
            focus_type:   p.focus_type   || "hybrid",
            dna_tags:     p.dna_tags     || [],
            location_label: p.location_label || "",
            impact_eur:   p.impact_eur   || 0,
            impactEur:    p.impact_eur   || 0,
            followers_count: p.followers_count || 0,
            is_wirker:    p.is_wirker    || p.has_talent_profile || false,
          })));
        }
      } catch(e) {
        if (!mounted) return;
        sentryCapture(e, {
          source: 'DiscoveryFeed.loadWirkers',
          document_hidden: document.hidden,
        });
        console.error("[DiscoveryFeed] wirkers:", e.message);
      } finally {
        if (mounted) setWirkersLoading(false);
      }
    }
    loadWirkers();
    return () => { mounted = false; };
  }, []);

  // ── Infinite scroll state ────────────────────────────────────────
  const [page,       setPage]       = useState(0);
  const pageRef      = useRef(0);             // stale-free page ref
  const [hasMore,    setHasMore]    = useState(true);
  const [loadingMore,setLoadingMore]= useState(false);
  const loadingRef   = useRef(false);         // concurrent-load guard
  const PAGE_SIZE = 12;
  const loaderRef            = useRef(null);
  const scrollContainerRef   = useRef(null); // ref auf .df-scroll für VirtualFeedList

  const loadFeed = useCallback(async (reset = true) => {
    // Guard: prevent concurrent loads when not resetting
    if (loadingRef.current && !reset) return;
    loadingRef.current = true;
    let mounted = true;  // per-call unmount guard

    if (reset) {
      pageRef.current = 0;
      setFeedLoading(true); setFeedError(null); setPage(0); setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    const currentPage = reset ? 0 : pageRef.current;

    try {
      // 1. Works laden mit Pagination
      const { data: worksData, error: worksErr } = await supabase
        .from("works")
        .select("id, title, description, price, cover_url, media_url, images, category, status, created_at, user_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (!mounted) return;   // unmounted during first await
      if (worksErr) throw worksErr;
      const rawWorks = worksData || [];
      if (rawWorks.length < PAGE_SIZE) setHasMore(false);

      // 2. Profile fuer alle Creator laden (1 Query statt N)
      const userIds = [...new Set(rawWorks.map(w => w.user_id).filter(Boolean))];
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url,header_img,bio,talent,focus_type,location_label,impact_eur,is_wirker,has_talent_profile")
          .in("id", userIds);
        if (!mounted) return;   // unmounted during second await
        (profs || []).forEach(p => { profileMap[p.id] = p; });
      }

      // 3. Works + Profile zusammenfuehren
      const works = rawWorks.map(w => mapWork(w, normalizeProfileInput(profileMap[w.user_id]) || {}));
      if (!mounted) return;

      if (reset) {
        setDbWerke(works);
        setDbFeed(works);
      } else {
        setDbWerke(prev => [...prev, ...works]);
        setDbFeed(prev => [...prev, ...works]);
        pageRef.current = currentPage + 1;
        setPage(p => p + 1);
      }
      console.log("[HUI Feed] Loaded page", currentPage, "works:", works.length);
    } catch(e) {
      if (!mounted) return;
      sentryCapture(e, {
        source:       'DiscoveryFeed.loadFeed',
        reset:        reset,
        current_page: currentPage,
        document_hidden: document.hidden,
      });
      console.error("[HUI Feed] Error:", e);
      setFeedError(e.message);
    } finally {
      loadingRef.current = false;
      if (mounted) {
        setFeedLoading(false);
        setLoadingMore(false);
      }
      // cleanup: mark unmounted for any dangling callbacks
      mounted = false;
    }
  }, []);  // no page dep — pageRef is always current

  useEffect(() => { loadFeed(true); }, []);
  useEffect(() => { if (refreshSignal) loadFeed(true); }, [refreshSignal]);

  // visibilitychange: iPad Safari Background Resume Recovery
  useEffect(() => {
    let hiddenAt       = 0;
    let loadingStartAt = 0;          // merken wann feedLoading startete
    let stallTimer     = null;

    // Schwellen:
    //  > 60s  Idle → Feed neu laden (vorher 5min — zu lang für iPad)
    //  > 8s   feedLoading hängt nach Resume → force reset
    const RELOAD_THRESHOLD_MS = 60 * 1000;       // 60 Sekunden
    const STALL_THRESHOLD_MS  =  8 * 1000;       //  8 Sekunden

    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now();
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
        return;
      }

      // Tab wieder sichtbar
      const idleMs = hiddenAt > 0 ? Date.now() - hiddenAt : 0;
      console.log('[DiscoveryFeed] visibility resume, idle=' + Math.round(idleMs / 1000) + 's');

      if (hiddenAt > 0 && idleMs > RELOAD_THRESHOLD_MS) {
        // Lang genug weg → Feed neu laden
        console.log('[DiscoveryFeed] Reload nach Idle: ' + Math.round(idleMs/1000) + 's');
        loadFeed(true);
      }

      // Stall-Guard: nach Resume auf feedLoading=true prüfen
      // Wenn feedLoading nach STALL_THRESHOLD_MS noch true → force reset
      stallTimer = setTimeout(() => {
        // Zugriff auf feedLoading über closure — aktueller Wert durch
        // React-State nicht direkt lesbar hier, daher über DOM-Fallback
        const skeleton = document.querySelector('[data-hui-skeleton]');
        if (skeleton) {
          console.warn('[DiscoveryFeed] Skeleton stall detected after resume — forcing reload');
          sentryCapture(new Error('DiscoveryFeed skeleton stall after resume'), {
            source:   'DiscoveryFeed.visibilityStall',
            idle_ms:  idleMs,
          });
          loadFeed(true);
        }
        stallTimer = null;
      }, STALL_THRESHOLD_MS);
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (stallTimer) clearTimeout(stallTimer);
    };
  }, [loadFeed]);

  // Realtime subscription für neue Works
  useEffect(() => {
    const sub = supabase
      .channel("works-feed")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "works",
        filter: "status=eq.published"
      }, (payload) => {
        console.log("[HUI Feed] Realtime new work:", payload.new?.id);
        // Guard: skip reload wenn Tab hidden (Safari Idle)
        if (!document.hidden) loadFeed(true);
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      // Guard: keine parallelen Loads, kein Load wenn Tab hidden
      if (entry.isIntersecting && hasMore && !loadingMore && !feedLoading && !document.hidden) {
        loadFeed(false);
      }
    }, { threshold: 0.1 });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, feedLoading, loadFeed]);

  // Feed items: nur echte Daten — kein Mock-Fallback mehr
// ── MOOD SCORING ENGINE ─────────────────────────────────────────────
  // Gewichtet dbFeed ohne neue API-Calls — reine Client-Priorisierung.
  // Jede Stimmung hebt bestimmte Kategorien/Typen nach oben.
  const MOOD_WEIGHTS = {
    ruhe: {
      // Natur, Meditation, ruhige Werke → hoch; Action, Events → niedrig
      typeBoost:     { werk: 0.15, wirker: 0.10, experience: -0.05, impact: 0.20 },
      categoryBoost: { natur:1.0, heilung:0.9, yoga:0.8, meditation:0.8,
                       handwerk:0.5, fotografie:0.4, kunst:0.3 },
      keywords:      ["ruhe","stille","natur","heilung","yoga","meditation","zen",
                       "wald","see","entspannung","slow"],
    },
    inspiration: {
      typeBoost:     { werk: 0.30, wirker: 0.15, experience: 0.10, impact: 0.05 },
      categoryBoost: { kunst:1.0, design:0.9, fotografie:0.8, architektur:0.7,
                       malerei:0.9, illustration:0.8, musik:0.5 },
      keywords:      ["inspiration","kreativ","kunst","design","farbe","vision",
                       "idee","experiment","mutig","original"],
    },
    gemeinschaft: {
      typeBoost:     { werk: -0.05, wirker: 0.35, experience: 0.25, impact: 0.20 },
      categoryBoost: { workshop:0.9, kurs:0.8, community:1.0, gruppe:0.9,
                       event:0.8, coaching:0.6 },
      keywords:      ["gemeinschaft","gruppe","workshop","kurs","event","treffen",
                       "zusammen","community","austausch","menschen"],
    },
    kreativitaet: {
      typeBoost:     { werk: 0.25, wirker: 0.20, experience: 0.20, impact: 0.05 },
      categoryBoost: { handwerk:1.0, keramik:0.9, malerei:0.9, musik:0.8,
                       design:0.8, illustration:0.8, workshop:0.7 },
      keywords:      ["kreativ","handwerk","bauen","basteln","machen","gestalten",
                       "formen","erschaffen","kunst","atelier"],
    },
    abenteuer: {
      typeBoost:     { werk: -0.05, wirker: 0.10, experience: 0.45, impact: 0.10 },
      categoryBoost: { outdoor:1.0, sport:0.9, natur:0.8, reise:0.9,
                       event:0.7, abenteuer:1.0 },
      keywords:      ["abenteuer","outdoor","sport","natur","wandern","klettern",
                       "erleben","aktiv","raus","draußen","reise"],
    },
    ueberraschung: {
      typeBoost:     { werk: 0, wirker: 0, experience: 0, impact: 0 },
      categoryBoost: {},
      keywords:      [],
    },
  };

  const liveFeedItems = React.useMemo(() => {
    if (!activeMood || !dbFeed.length) return dbFeed;
    const weights = MOOD_WEIGHTS[activeMood.key];
    if (!weights) return dbFeed;

    const scored = dbFeed.map(item => {
      let score = 0;

      // Typ-Boost
      const typeKey = item.type === "wirker" ? "wirker"
        : item.type === "werk" ? "werk"
        : item.type === "experience" ? "experience" : "impact";
      score += weights.typeBoost[typeKey] || 0;

      // Kategorie-Boost
      const cat = (item.category || "").toLowerCase();
      for (const [k, v] of Object.entries(weights.categoryBoost)) {
        if (cat.includes(k)) { score += v; break; }
      }

      // Keyword-Boost (Bio + Titel + Talent)
      const text = [
        item.bio || "", item.title || "", item.talent || "",
        item.name || "", item.creator || ""
      ].join(" ").toLowerCase();
      for (const kw of weights.keywords) {
        if (text.includes(kw)) score += 0.25;
      }

      return { item, score };
    });

    // Sortieren: höchster Score vorne, Gleichstand zufällig
    return scored
      .sort((a, b) => b.score - a.score + (Math.random() * 0.05 - 0.025))
      .map(s => s.item);
  }, [dbFeed, activeMood]);
  // ── Ende MOOD SCORING ENGINE ─────────────────────────────────────
  const liveWerke     = dbWerke;

  return (
    <>
      <style>{CSS}</style>
      <div className="df-scroll" ref={scrollContainerRef}
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

          {/* ── HUI Smart Search + Match ── */}
          <HuiSearchBar
            onMatchClick={onMatch}
            onKarteClick={onMap}
          />
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

        {/* ══ 2. WIRKER — Editorial Horizontal Scroll ══════════════════ */}
        <div style={{ padding:"22px 0 8px" }}>
          <div style={{ display:"flex", alignItems:"baseline",
            justifyContent:"space-between", padding:"0 20px 14px" }}>
            <div>
              <div style={{ fontWeight:900, fontSize:17, color:C.ink,
                letterSpacing:-0.4, lineHeight:1.1 }}>
                Menschen, die bewegen
              </div>
              <div style={{ fontSize:11.5, color:C.muted, marginTop:3, fontWeight:500 }}>
                Echte Talente in deiner Nähe
              </div>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:C.teal,
              padding:"5px 12px", borderRadius:999,
              background:"rgba(22,215,197,0.10)",
              border:"1px solid rgba(22,215,197,0.18)" }}>
              Alle →
            </span>
          </div>
          <div className="df-scroll"
            style={{ display:"flex", gap:10, overflowX:"auto",
              padding:"0 20px 6px", WebkitOverflowScrolling:"touch" }}>
            {(liveWirkers.length > 0 ? liveWirkers : WIRKERS).map((w, i) => (
              <WirkerTile key={w.user_id || i} w={w} onView={onView} onBook={onBook}/>
            ))}
          </div>
        </div>

        {/* ══ 3. WERKE — Editorial Showcase Strip ══════════════════════ */}
        {liveWerke.length > 0 && (
          <div style={{ padding:"8px 0 16px" }}>
            <div style={{ display:"flex", alignItems:"baseline",
              justifyContent:"space-between", padding:"0 20px 14px" }}>
              <div>
                <div style={{ fontWeight:900, fontSize:17, color:C.ink,
                  letterSpacing:-0.4, lineHeight:1.1 }}>
                  Werke mit Seele
                </div>
                <div style={{ fontSize:11.5, color:C.muted, marginTop:3, fontWeight:500 }}>
                  Handgemacht. Einzigartig. Bedeutungsvoll.
                </div>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:C.coral,
                padding:"5px 12px", borderRadius:999,
                background:"rgba(255,138,107,0.10)",
                border:"1px solid rgba(255,138,107,0.18)" }}>
                Alle →
              </span>
            </div>
            <div className="df-scroll"
              style={{ display:"flex", gap:10, overflowX:"auto",
                padding:"0 20px 6px", WebkitOverflowScrolling:"touch" }}>
              {liveWerke.map((w, i) => (
                <WerkTile key={i} w={w} onView={onView} onBuyWerk={onBuyWerk} navigate={navigate}/>
              ))}
            </div>
          </div>
        )}

        {/* ══ 4. FEED — Editorial Cinematic Section Header ════════════ */}
        <div style={{ padding:"8px 20px 4px",
          display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ flex:1, height:1,
            background:`linear-gradient(90deg,${C.teal}55,${C.coral}33,transparent)` }}/>
          <span style={{ fontSize:9, fontWeight:900, letterSpacing:3,
            textTransform:"uppercase", color:C.muted, opacity:0.7 }}>
            Entdecken
          </span>
          <div style={{ flex:1, height:1,
            background:`linear-gradient(270deg,${C.teal}55,${C.coral}33,transparent)` }}/>
        </div>

        {/* ── MOOD BANNER — aktive Stimmung ─────────────── */}
        {activeMood && (
          <div style={{
            margin:"8px 14px 4px",
            padding:"11px 16px",
            borderRadius:16,
            background: activeMood.grad || "rgba(22,215,197,0.08)",
            border:`1px solid ${activeMood.color || '#16D7C5'}22`,
            display:"flex", alignItems:"center", gap:10,
            animation:"dfFadeUp 0.4s both",
          }}>
            <span style={{ fontSize:20 }}>{activeMood.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:800, color:C.ink,
                letterSpacing:-0.1 }}>
                {activeMood.label.replace("Ich ", "")}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                Feed kuratiert · {liveFeedItems.length} Inhalte priorisiert
              </div>
            </div>
            <button onClick={() => {}}
              style={{ background:"none", border:"none", cursor:"default",
                fontSize:12, color:`${activeMood.color || '#16D7C5'}99`,
                fontWeight:700, padding:0 }}>
              ✦
            </button>
          </div>
        )}



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
          <div data-hui-skeleton="true">
            {/* Skeleton Werke-Tiles */}
            <div style={{ display:"flex", gap:12, overflowX:"auto",
              padding:"0 20px 4px", marginBottom:8 }}>
              {[0,1,2].map(i => <WerkTileSkeleton key={i}/>)}
            </div>
            {/* Skeleton Feed-Cards */}
            <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:12, marginTop:12 }}>
              <WerkCardSkeleton/>
            </div>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          <VirtualFeedList
            items={liveFeedItems}
            scrollContainerRef={scrollContainerRef}
            estimatedSize={520}
            overscan={5}
            onEndReached={hasMore ? () => loadFeed(false) : undefined}
            renderItem={(item, i) => {
              // SafeVirtualRow in VirtualFeedList fängt Crashes — aber
              // renderItem selbst extra absichern für maximale Isolation
              if (!item) return null;
              try {
                // Tracking fuer ErrorBoundary-Diagnose
                if (typeof window !== 'undefined') {
                  window.__HUI_LAST_FEED_COMPONENT__ =
                    'DiscoveryFeed:' + (item.type || 'unknown') + ':' + (item.id || i);
                }

                // ── FEED DRAMATURGIE ENGINE ──────────────────────────────────
                // Position im Feed bestimmt visuelles Gewicht der Karte
                // 0: Hero (groß) | 1: Mid | 2: Mid | 3: Full | 4+: abwechselnd
                const pos = i % 7; // 7er-Rhythmus

                // Bestimme Kartenformat basierend auf Position + Typ
                const isHero   = pos === 0 || pos === 4;        // Groß + Fullbleed
                const isMid    = pos === 1 || pos === 2;        // 2er-Gruppe
                const isFull   = pos === 3;                     // Voller Cinematic
                const isCompact = pos === 5 || pos === 6;       // Kleiner + kompakter

                // Padding: Hero/Full edge-to-edge, Mid/Compact mit Rand
                const px = isHero || isFull ? "0 14px" : "0 14px";

                // ── SECTION BREAK zwischen Gruppen ─────────────────────────
                // Vor Hero-Cards (pos 0, 4) eine atmosphärische Trennlinie
                const showBreak = i > 0 && (pos === 0 || pos === 4);

                // Akzentfarbe + Label
                const accent =
                  item.type==="wirker"     ? C.teal  :
                  item.type==="werk"       ? C.coral :
                  item.type==="experience" ? C.gold  : C.green;
                const label =
                  item.type==="wirker"     ? "Talent"    :
                  item.type==="werk"       ? "Werk"      :
                  item.type==="experience" ? "Erlebnis"  : "Impact";

                return (
                  <div key={item.id || i}>
                    {/* ── Atmosphärische Sektion-Pause ── */}
                    {showBreak && (
                      <div style={{ padding:"20px 22px 6px",
                        display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1, height:1,
                          background:`linear-gradient(90deg,${accent}44,transparent)` }}/>
                        <span style={{ fontSize:8.5, fontWeight:900, color:accent,
                          letterSpacing:2.5, textTransform:"uppercase", opacity:0.65 }}>
                          {label}
                        </span>
                        <div style={{ flex:1, height:1,
                          background:`linear-gradient(270deg,${accent}44,transparent)` }}/>
                      </div>
                    )}

                    {/* ── HERO / FULL — große Karte ── */}
                    {(isHero || isFull) && (
                      <div style={{ padding:px, marginBottom:isHero ? 6 : 6 }}>
                        {item.type==="wirker"     && <MemoWirkerCard     item={item} onView={onView} onBook={onBook} variant={isFull ? "full" : "hero"}/>}
                        {item.type==="werk"       && <MemoWerkCard       item={item} onView={onView} onBuyWerk={onBuyWerk} onAddToKorb={onAddToKorb} navigate={navigate} variant={isFull ? "full" : "hero"}/>}
                        {item.type==="experience" && <MemoExperienceCard item={item} onView={onView} variant={isFull ? "full" : "hero"}/>}
                        {item.type==="impact"     && <MemoImpactCard     item={item} onImpact={onImpact} variant={isFull ? "full" : "hero"}/>}
                      </div>
                    )}

                    {/* ── MID — kompaktere Karte, mehr Luft drumherum ── */}
                    {isMid && (
                      <div style={{ padding:px, marginBottom:6 }}>
                        {item.type==="wirker"     && <MemoWirkerCard     item={item} onView={onView} onBook={onBook} variant="mid"/>}
                        {item.type==="werk"       && <MemoWerkCard       item={item} onView={onView} onBuyWerk={onBuyWerk} onAddToKorb={onAddToKorb} navigate={navigate} variant="mid"/>}
                        {item.type==="experience" && <MemoExperienceCard item={item} onView={onView} variant="mid"/>}
                        {item.type==="impact"     && <MemoImpactCard     item={item} onImpact={onImpact} variant="mid"/>}
                      </div>
                    )}

                    {/* ── COMPACT — kleinere Karte mit weniger Höhe ── */}
                    {isCompact && (
                      <div style={{ padding:px, marginBottom:6 }}>
                        {item.type==="wirker"     && <MemoWirkerCard     item={item} onView={onView} onBook={onBook} variant="compact"/>}
                        {item.type==="werk"       && <MemoWerkCard       item={item} onView={onView} onBuyWerk={onBuyWerk} onAddToKorb={onAddToKorb} navigate={navigate} variant="compact"/>}
                        {item.type==="experience" && <MemoExperienceCard item={item} onView={onView} variant="compact"/>}
                        {item.type==="impact"     && <MemoImpactCard     item={item} onImpact={onImpact} variant="compact"/>}
                      </div>
                    )}
                  </div>
                );
              } catch(err) {
                sentryCapture(err, {
                  source:     'DiscoveryFeed.renderItem',
                  item_id:    item?.id   ?? null,
                  item_type:  item?.type ?? 'unknown',
                  item_index: i,
                });
                console.error('[DiscoveryFeed] renderItem crash type=' +
                  (item?.type||'?') + ' id=' + (item?.id||i), err);
                return null;
              }
            }}

          />

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
          {/* Infinite scroll via VirtualFeedList.onEndReached */}

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