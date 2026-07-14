// HuiMatchOverlay.jsx — HUI Match v3
// Emotionale Discovery Experience: Stimmungs-Flow × dynamische UI-Reaktion × kuratierte Ergebnisse
// Datenlogik (doMatch, doSurprise, Supabase) vollständig erhalten.

import { HUITalentIcon,
  HUIImpactIcon, HUILocationIcon,
} from '../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { normalizeProfileInput, PROFILE_FIELDS } from '../lib/perfUtils';
import { HUI } from "../design/hui.design.js";

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════ */
const C = {
  teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, tealPale:HUI.COLOR.tealPale,
  tealGlow:"rgba(22,215,197,0.22)",
  coral:HUI.COLOR.coral, coralPale:HUI.COLOR.coralPale,
  cream:HUI.COLOR.cream, warm:HUI.COLOR.creamSoft,
  card:"#FFFFFF", ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2,
  muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.06)", gold:HUI.COLOR.gold, green:"#3DB87A",
  purple:HUI.COLOR.violetLight,
};

/* ══════════════════════════════════════════════════════
   STIMMUNGS-SYSTEM
   Jede Stimmung hat eigene Farbe, Ambient, Speed
══════════════════════════════════════════════════════ */
const MOODS = [
  {
    key:"ruhe",
    emoji:"🧘",
    label:"Ich suche Ruhe",
    sub:"Stille. Zentrierung. Ankommen.",
    color:"#6B9FD4",
    glow:"rgba(107,159,212,0.18)",
    grad:"linear-gradient(135deg, rgba(107,159,212,0.12), rgba(22,215,197,0.06))",
    speed:"slow",
    interests:["ruhe","heilung","natur","yoga"],
  },
  {
    key:"inspiration",
    emoji:"✨",
    label:"Ich brauche Inspiration",
    sub:"Neues entdecken. Kreativ werden.",
    color:HUI.COLOR.gold,
    glow:"rgba(245,166,35,0.20)",
    grad:"linear-gradient(135deg, rgba(245,166,35,0.12), rgba(255,138,107,0.06))",
    speed:"medium",
    interests:["inspiration","kunst","design","fotografie"],
  },
  {
    key:"gemeinschaft",
    emoji:"🤝",
    label:"Ich möchte Menschen treffen",
    sub:"Echte Gespräche. Neue Verbindungen.",
    color:HUI.COLOR.coral,
    glow:"rgba(255,138,107,0.20)",
    grad:"linear-gradient(135deg, rgba(255,138,107,0.12), rgba(245,166,35,0.06))",
    speed:"medium",
    interests:["menschen","gemeinschaft","austausch","coaching"],
  },
  {
    key:"kreativitaet",
    emoji:"🎨",
    label:"Ich will kreativ werden",
    sub:"Werkzeuge. Talente. Workshops.",
    color:HUI.COLOR.violetLight,
    glow:"rgba(167,139,250,0.20)",
    grad:"linear-gradient(135deg, rgba(167,139,250,0.12), rgba(22,215,197,0.06))",
    speed:"fast",
    interests:["kuenstler","handwerk","workshops","musik"],
  },
  {
    key:"abenteuer",
    emoji:"🗺️",
    label:"Ich suche ein Erlebnis",
    sub:"Aktiv sein. Etwas erleben. Raus.",
    color:"#3DB87A",
    glow:"rgba(61,184,122,0.20)",
    grad:"linear-gradient(135deg, rgba(61,184,122,0.12), rgba(22,215,197,0.08))",
    speed:"fast",
    interests:["abenteuer","natur","workshops","motivation"],
  },
  {
    key:"ueberraschung",
    emoji:"🎲",
    label:"Überrasch mich",
    sub:"Ich bin offen für alles.",
    color:HUI.COLOR.teal,
    glow:"rgba(22,215,197,0.22)",
    grad:"linear-gradient(135deg, rgba(22,215,197,0.12), rgba(167,139,250,0.08))",
    speed:"medium",
    interests:[],
    isSurprise:true,
  },
];

/* ══════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════ */
const CSS = `
  @keyframes sheetUp {
    from { transform:translateY(100%); opacity:0.5; }
    to   { transform:translateY(0);    opacity:1;   }
  }
  @keyframes moodIn {
    from { opacity:0; transform:translateY(14px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes cardIn {
    from { opacity:0; transform:translateY(16px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes breatheSlow {
    0%,100%{ transform:scale(1) rotate(0deg); opacity:0.85; }
    50%{ transform:scale(1.08) rotate(5deg); opacity:1; }
  }
  @keyframes breatheFast {
    0%,100%{ transform:scale(1); opacity:0.9; }
    50%{ transform:scale(1.15); opacity:1; }
  }
  @keyframes breatheMedium {
    0%,100%{ transform:scale(1); opacity:0.88; }
    50%{ transform:scale(1.10); opacity:1; }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes searchDot {
    0%,100%{ opacity:0.3; transform:scale(0.7); }
    50%{ opacity:1; transform:scale(1); }
  }
  @keyframes revealUp {
    from{ opacity:0; transform:translateY(22px); }
    to{ opacity:1; transform:translateY(0); }
  }
  @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .hmo-scroll::-webkit-scrollbar{display:none}
  .hmo-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .hmo-tap{-webkit-tap-highlight-color:transparent;cursor:pointer;border:none;font-family:inherit;background:none}
  .hmo-tap:active{ opacity:0.82; }
`;

/* ══════════════════════════════════════════════════════
   SEARCHING VIEW — immersive Transition
══════════════════════════════════════════════════════ */
function SearchingView({ mood }) {
  const color = mood?.color || HUI.COLOR.teal;
  const glow  = mood?.glow  || "rgba(22,215,197,0.22)";
  const animSpeed = mood?.speed === "slow" ? 3.5 : mood?.speed === "fast" ? 1.8 : 2.5;
  const breatheAnim = mood?.speed === "slow"
    ? "breatheSlow" : mood?.speed === "fast"
    ? "breatheFast" : "breatheMedium";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"52px 24px 40px",
      animation:"revealUp 0.4s both" }}>
      {/* Orbital rings */}
      <div style={{ position:"relative", width:92, height:92, marginBottom:30 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%",
          border:`2px solid ${color}33`,
          animation:`spinSlow ${animSpeed * 2}s linear infinite` }}/>
        <div style={{ position:"absolute", inset:7, borderRadius:"50%",
          border:`1.5px solid ${color}20`,
          animation:`spinSlow ${animSpeed * 3.2}s linear infinite reverse` }}/>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          background:`radial-gradient(circle, ${glow} 0%, transparent 70%)` }}>
          <span style={{ fontSize:36,
            animation:`${breatheAnim} ${animSpeed}s ease-in-out infinite` }}>
            {mood?.emoji || "✨"}
          </span>
        </div>
      </div>
      {/* Text */}
      <div style={{ fontSize:18, fontWeight:900, color:HUI.COLOR.ink,
        letterSpacing:-0.4, marginBottom:10, textAlign:"center" }}>
        HUI kuratiert gerade…
      </div>
      <div style={{ fontSize:13, color:"#888", lineHeight:1.65,
        textAlign:"center", maxWidth:240, marginBottom:30 }}>
        {mood ? `Passend zu: „${mood.label}"` : "Einen Moment bitte"}
      </div>
      {/* Dots */}
      <div style={{ display:"flex", gap:8 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:"50%",
            background:color, opacity:0.5,
            animation:`searchDot 1.3s ease-in-out ${i*0.16}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RESULT CARD — cinematic
══════════════════════════════════════════════════════ */
function ResultCard({ item, idx, onOpen, moodColor }) {
  const isWirker = item.type === "wirker" || item.type === "profile";
  const isWerk   = item.type === "work"   || item.type === "werk";
  const tag      = isWirker ? "Talent" : isWerk ? "Werk" : "Erlebnis";
  const tagColor = isWirker ? HUI.COLOR.teal : isWerk ? HUI.COLOR.gold : HUI.COLOR.coral;
  const img      = item.avatar_url || item.cover_url || item.img ||
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80";
  const name     = item.display_name || item.name || item.title || "—";
  const sub      = item.talent || item.bio?.slice(0,55) || item.description?.slice(0,55) || "";

  return (
    <div onClick={() => onOpen?.(item)}
      className="hmo-tap"
      style={{ background:"#FFFFFF", borderRadius:20,
        overflow:"hidden", cursor:"pointer",
        boxShadow:"0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        border:"1px solid rgba(0,0,0,0.05)",
        animation:`cardIn 0.4s ${idx*0.06}s both`,
        transition:"transform .22s cubic-bezier(.34,1.3,.64,1), box-shadow .22s",
      }}
      onPointerEnter={e=>{
        e.currentTarget.style.transform = "translateY(-3px) scale(1.015)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.12)";
      }}
      onPointerLeave={e=>{
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
      }}>
      <div style={{ position:"relative", height:120, overflow:"hidden" }}>
        <img loading="lazy" decoding="async" src={img} alt=""
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.80) saturate(1.18)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.62))" }}/>
        {/* Accent top line */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5,
          background:`linear-gradient(90deg,${tagColor},${tagColor}55,transparent)` }}/>
        {/* Mood ambient */}
        {moodColor && (
          <div style={{ position:"absolute", top:0, right:0, width:55, height:55,
            background:`radial-gradient(circle, ${moodColor}28, transparent 72%)`,
            pointerEvents:"none" }}/>
        )}
        <span style={{ position:"absolute", bottom:8, left:10,
          fontSize:9, fontWeight:900, color:"white",
          background:`${tagColor}CC`, borderRadius:50, padding:"3px 9px",
          backdropFilter:"blur(8px)", letterSpacing:0.8, textTransform:"uppercase" }}>
          {tag}
        </span>
      </div>
      <div style={{ padding:"11px 13px 13px" }}>
        <div style={{ fontWeight:800, fontSize:13, color:HUI.COLOR.ink, lineHeight:1.3,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
          {name}
        </div>
        {sub && (
          <div style={{ fontSize:11.5, color:"#888", lineHeight:1.45,
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {sub}
          </div>
        )}
        {(item.location || item.city) && (
          <div style={{ fontSize:10.5, color:"#BBB", marginTop:5,
            display:"flex", alignItems:"center", gap:3 }}>
            <HUILocationIcon size={14} style={{opacity:0.7}} />
            {item.location || item.city}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════ */
function Skeleton() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ background:"#FFFFFF", borderRadius:20,
          overflow:"hidden", border:"1px solid rgba(0,0,0,0.06)",
          animation:`cardIn 0.3s ${i*0.06}s both` }}>
          <div style={{ height:120,
            background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)",
            backgroundSize:"200% 100%", animation:"shimmer 1.4s ease infinite" }}/>
          <div style={{ padding:"10px 12px 12px" }}>
            <div style={{ height:12, borderRadius:6, background:"rgba(0,0,0,0.06)",
              marginBottom:7, width:"72%" }}/>
            <div style={{ height:10, borderRadius:6, background:"rgba(0,0,0,0.06)",
              width:"50%" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function HuiMatchOverlay({ onClose, onView, onMoodSelect }) {
  const [step,      setStep]      = useState("mood");
  const [mood,      setMood]      = useState(null);
  const [results,   setResults]   = useState([]);
  const [surprises, setSurprises] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const sheetRef = useRef(null);

  // Für Abwärts-Kompatibilität mit der bestehenden Daten-Logik
  const [interests, setInterests] = useState([]);
  const [location,  setLocation]  = useState("de");
  const [discType,  setDiscType]  = useState("all");

  // Wenn Stimmung gewählt → Interests synchronisieren
  useEffect(() => {
    if (mood) setInterests(mood.interests || []);
  }, [mood]);

  /* ── Swipe down to close ── */
  const touchStartY = useRef(null);
  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY; }
  function onTouchEnd(e) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) onClose();
    touchStartY.current = null;
  }

  /* ── Stimmung wählen → searching → match ── */
  async function handleMoodSelect(m) {
    setMood(m);
    if (onMoodSelect) onMoodSelect(m);  // Bridge: Stimmung sofort an Feed übergeben
    if (m.isSurprise) {
      setStep("searching");
      await new Promise(r => setTimeout(r, 1100));
      await doSurprise();
      return;
    }
    setStep("searching");
    await new Promise(r => setTimeout(r, 1200));
    await doMatch(m);
  }

  /* ── doMatch (Supabase Queries — unverändert) ── */
  async function doMatch(activeMood) {
    setLoading(true);
    const usedInterests = activeMood?.interests || interests;
    try {
      const queries = [];

      // Profiles / Talente
      if (discType === "all" || discType === "people") {
        let q = supabase.from("profiles")
          .select(PROFILE_FIELDS)
          .eq("has_talent_profile", true)
          .limit(12);
        if (location === "online") q = q.eq("location", "Online");
        const { data } = await q;
        queries.push(...(data||[]).map(p => ({
          ...normalizeProfileInput(p), type:"wirker"
        })));
      }

      // Works
      if (discType === "all" || discType === "works") {
        const { data } = await supabase.from("works")
          .select("id,title,description,price_eur,cover_url,creator_id,category,location")
          .eq("status","published").limit(12);
        queries.push(...(data||[]).map(w => ({
          ...w, type:"werk", img:w.cover_url, bio:w.description,
          price: w.price_eur ? `€ ${w.price_eur}` : null,
        })));
      }

      // Experiences
      if (discType === "all" || discType === "experiences") {
        const { data } = await supabase.from("experiences")
          .select("id,title,description,price_eur,cover_url,creator_id,date,spots_available,location")
          .eq("status","published").limit(8);
        queries.push(...(data||[]).map(e => ({
          ...e, type:"experience", img:e.cover_url, bio:e.description,
          price: e.price_eur ? `ab € ${e.price_eur}` : null,
          spots: e.spots_available,
        })));
      }

      // Score basierend auf Mood-Interests
      const scored = queries.map(item => {
        let score = Math.random();
        const text = [
          item.display_name||"", item.talent||"", item.bio||"",
          item.description||"", item.category||""
        ].join(" ").toLowerCase();
        usedInterests.forEach(key => { if (text.includes(key)) score += 0.3; });
        return { item, score };
      });
      setResults(scored.sort((a,b) => b.score - a.score).map(s => s.item).slice(0, 8));
    } catch(e) {
      console.error("[HuiMatch] doMatch error:", e);
      setResults([]);
    }
    setLoading(false);
    setStep("results");
  }

  /* ── doSurprise (unverändert) ── */
  async function doSurprise() {
    setLoading(true);
    try {
      const [profRes, workRes, expRes] = await Promise.all([
        supabase.from("profiles").select(PROFILE_FIELDS)
          .eq("has_talent_profile", true).limit(10),
        supabase.from("works")
          .select("id,title,description,cover_url,price_eur,location")
          .eq("status","published").limit(8),
        supabase.from("experiences")
          .select("id,title,description,cover_url,price_eur,date,spots_available")
          .eq("status","published").limit(6),
      ]);
      const pool = [
        ...(profRes.data||[]).map(p => ({ ...normalizeProfileInput(p), type:"wirker" })),
        ...(workRes.data||[]).map(w => ({ ...w, type:"work", img:w.cover_url, bio:w.description })),
        ...(expRes.data||[]).map(e => ({ ...e, type:"experience", img:e.cover_url, bio:e.description })),
      ];
      setSurprises(pool.sort(() => Math.random() - 0.5).slice(0, 8));
    } catch(e) {
      setSurprises([]);
    }
    setLoading(false);
    setStep("surprise");
  }

  /* ── Back ── */
  function goBack() {
    setStep("mood");
    setMood(null);
    setResults([]);
    setSurprises([]);
  }

  const moodColor = mood?.color || HUI.COLOR.teal;
  const moodGlow  = mood?.glow  || "rgba(22,215,197,0.22)";
  const breatheAnim = mood?.speed === "slow"
    ? "breatheSlow" : mood?.speed === "fast"
    ? "breatheFast" : "breatheMedium";

  return (
    <>
      <style>{CSS}</style>

      {/* ── BACKDROP ── */}
      <div style={{ position:"fixed", inset:0, zIndex:10500,
        background:"rgba(8,8,8,0.65)",
        backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)" }}
        onClick={e => e.target === e.currentTarget && onClose()}>

        {/* ── SHEET ── */}
        <div ref={sheetRef}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ position:"absolute", bottom:0, left:0, right:0,
            background:HUI.COLOR.creamSoft,
            borderRadius:"28px 28px 0 0",
            maxHeight:"92vh",
            display:"flex", flexDirection:"column",
            animation:"sheetUp 0.38s cubic-bezier(0.22,1,0.36,1) both",
            paddingBottom:"env(safe-area-inset-bottom,0)",
            boxShadow:`0 -4px 52px ${moodGlow}, 0 -1px 0 rgba(0,0,0,0.05)`,
            transition:"box-shadow 0.7s ease" }}>

          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center",
            padding:"14px 0 0", flexShrink:0 }}>
            <div style={{ width:44, height:4, borderRadius:999,
              background:"rgba(0,0,0,0.10)" }}/>
          </div>

          {/* Mood accent bar — erscheint sobald Stimmung gewählt */}
          {mood && (
            <div style={{ height:2.5, margin:"12px 20px 0", borderRadius:999,
              background:`linear-gradient(90deg,${moodColor},${moodColor}55,transparent)`,
              transition:"background 0.7s", flexShrink:0 }}/>
          )}

          {/* Header */}
          <div style={{ padding: mood ? "10px 20px 0" : "14px 20px 0", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {(step === "results" || step === "surprise" || step === "searching") && (
                  <button className="hmo-tap" onClick={goBack}
                    style={{ width:32, height:32, borderRadius:"50%",
                      background:"rgba(0,0,0,0.06)", border:"none",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:15, color:"#888", flexShrink:0 }}>
                    ←
                  </button>
                )}
                {/* Logo Badge — Farbe wechselt je Mood */}
                <div style={{ width:40, height:40, borderRadius:14,
                  background: mood
                    ? `linear-gradient(135deg,${moodColor},${moodColor}88)`
                    : "linear-gradient(135deg,#F5A623,#E8A000)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, flexShrink:0,
                  boxShadow:`0 4px 16px ${moodGlow}`,
                  transition:"background 0.6s, box-shadow 0.6s",
                  animation:`${breatheAnim} 4s ease-in-out infinite` }}>
                  {mood ? mood.emoji : "✨"}
                </div>
                <div>
                  <div style={{ fontWeight:900, fontSize:17, color:HUI.COLOR.ink,
                    letterSpacing:-0.4, lineHeight:1.1 }}>
                    {step === "mood"      ? "HUI Match"            :
                     step === "searching" ? "Einen Moment…"        :
                     step === "surprise"  ? "Überraschung"         :
                     mood ? mood.label.replace("Ich suche ", "").replace("Ich ", "").replace("Überrasch mich", "Überraschung") : "Entdeckungen"}
                  </div>
                  <div style={{ fontSize:11, color:"#888", marginTop:2 }}>
                    {step === "mood"      ? "Wie fühlst du dich heute?"           :
                     step === "searching" ? "HUI kuratiert passende Entdeckungen…" :
                     step === "surprise"  ? "Zufällig kuratiert für dich"         :
                     `${results.length} kuratierte Treffer`}
                  </div>
                </div>
              </div>
              <button className="hmo-tap" onClick={onClose}
                style={{ width:32, height:32, borderRadius:"50%",
                  background:"rgba(0,0,0,0.06)", border:"none",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, color:"#888", flexShrink:0 }}>✕</button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="hmo-scroll"
            style={{ flex:1, overflowY:"auto",
              padding:"20px 16px max(28px,env(safe-area-inset-bottom,28px))" }}>

            {/* ══ STEP: MOOD ════════════════════════════════════ */}
            {step === "mood" && (
              <div style={{ animation:"revealUp 0.35s both" }}>
                {/* Intro */}
                <div style={{ textAlign:"center", marginBottom:26, paddingTop:4 }}>
                  <div style={{ marginBottom:10, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.7)" }}><HUITalentIcon size={28}/></div>
                  <div style={{ fontSize:21, fontWeight:900, color:HUI.COLOR.ink,
                    letterSpacing:-0.5, lineHeight:1.2, marginBottom:8 }}>
                    Wie fühlst du dich heute?
                  </div>
                  <div style={{ fontSize:13, color:"#888", lineHeight:1.65,
                    maxWidth:255, margin:"0 auto" }}>
                    HUI findet passende Menschen, Werke und Erlebnisse — abgestimmt auf deine Stimmung.
                  </div>
                </div>

                {/* Mood-Karten */}
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {(MOODS || []).filter(Boolean).map((m, i) => (
                    <button key={m.key} className="hmo-tap"
                      onClick={() => handleMoodSelect(m)}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:16,
                        padding: i % 3 === 0 ? "20px 20px" : "15px 18px",
                        borderRadius: m.isSurprise ? 18 : 20,
                        background: m.grad,
                        border:`1.5px solid ${m.color}25`,
                        cursor:"pointer", textAlign:"left",
                        transition:"transform .22s cubic-bezier(.34,1.3,.64,1), box-shadow .22s",
                        animation:`moodIn 0.4s ${i*0.065}s both` }}
                      onPointerEnter={e => {
                        e.currentTarget.style.transform = "translateX(5px) scale(1.01)";
                        e.currentTarget.style.boxShadow = `0 6px 24px ${m.glow}`;
                      }}
                      onPointerLeave={e => {
                        e.currentTarget.style.transform = "translateX(0) scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      {/* Emoji-Badge */}
                      <div style={{ width: i % 3 === 0 ? 52 : 46,
                        height: i % 3 === 0 ? 52 : 46,
                        borderRadius:16, flexShrink:0,
                        background:`${m.color}18`,
                        border:`1px solid ${m.color}28`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize: i % 3 === 0 ? 26 : 22 }}>
                        {m.emoji}
                      </div>
                      {/* Text */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800,
                          fontSize: i % 3 === 0 ? 15.5 : 14.5,
                          color:HUI.COLOR.ink, letterSpacing:-0.2,
                          lineHeight:1.25, marginBottom:3 }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize:12, color:"#888",
                          fontWeight:500, lineHeight:1.4 }}>
                          {m.sub}
                        </div>
                      </div>
                      {/* Arrow */}
                      <span style={{ fontSize:15, color:`${m.color}88`,
                        flexShrink:0, transition:"transform .2s" }}>
                        →
                      </span>
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ textAlign:"center", marginTop:24, paddingTop:16,
                  borderTop:"1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:11.5, color:"#AAA", lineHeight:1.65 }}>
                    HUI kuratiert echte Menschen und Werke<br/>
                    — abgestimmt auf deinen Moment.
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP: SEARCHING ═══════════════════════════════ */}
            {step === "searching" && <SearchingView mood={mood}/>}

            {/* ══ STEP: RESULTS ═════════════════════════════════ */}
            {step === "results" && (
              <div style={{ animation:"revealUp 0.4s both" }}>
                {loading ? <Skeleton/> : results.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"52px 24px" }}>
                    <div style={{ marginBottom:14, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIImpactIcon size={36}/></div>
                    <div style={{ fontSize:16, fontWeight:800, color:HUI.COLOR.ink,
                      marginBottom:8 }}>Noch keine Treffer</div>
                    <div style={{ fontSize:13, color:"#888", marginBottom:20,
                      lineHeight:1.6 }}>
                      Probiere eine andere Stimmung aus.
                    </div>
                    <button className="hmo-tap" onClick={goBack}
                      style={{ padding:"12px 26px", borderRadius:50,
                        background:`linear-gradient(135deg,${moodColor},${moodColor}99)`,
                        border:"none", color:"white", fontSize:13, fontWeight:700,
                        boxShadow:`0 4px 16px ${moodGlow}` }}>
                      Andere Stimmung wählen
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mood-Recap */}
                    {mood && (
                      <div style={{ display:"flex", alignItems:"center", gap:10,
                        marginBottom:18, padding:"11px 14px",
                        background: mood.grad,
                        border:`1px solid ${moodColor}25`,
                        borderRadius:14 }}>
                        <span style={{ fontSize:18 }}>{mood.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:HUI.COLOR.ink,
                            letterSpacing:-0.1 }}>{mood.label}</div>
                          <div style={{ fontSize:11, color:"#888" }}>
                            {results.length} kuratierte Entdeckungen
                          </div>
                        </div>
                        <span style={{ fontSize:12, color:`${moodColor}99`,
                          fontWeight:700 }}>✦</span>
                      </div>
                    )}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {(results || []).filter(Boolean).map((item, i) => (
                        <ResultCard key={item.id||i} item={item} idx={i}
                          moodColor={moodColor}
                          onOpen={v => { onView?.(v); onClose(); }}/>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:10, marginTop:18 }}>
                      <button className="hmo-tap" onClick={goBack}
                        style={{ flex:1, padding:"12px", borderRadius:50,
                          background:"rgba(0,0,0,0.055)",
                          border:"1.5px solid rgba(0,0,0,0.07)",
                          color:HUI.COLOR.ink2, fontSize:13, fontWeight:700 }}>
                        Andere Stimmung
                      </button>
                      <button className="hmo-tap" onClick={() => doMatch(mood)}
                        style={{ flex:1.5, padding:"12px", borderRadius:50,
                          background:`linear-gradient(135deg,${moodColor},${moodColor}99)`,
                          border:"none", color:"white", fontSize:13, fontWeight:800,
                          boxShadow:`0 4px 16px ${moodGlow}` }}>
                        🔄 Neu kuratieren
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ══ STEP: SURPRISE ════════════════════════════════ */}
            {step === "surprise" && (
              <div style={{ animation:"revealUp 0.4s both" }}>
                {loading ? <Skeleton/> : (
                  <>
                    <div style={{ textAlign:"center", marginBottom:20 }}>
                      <div style={{ fontSize:30, marginBottom:8 }}>🎲</div>
                      <div style={{ fontSize:16, fontWeight:800, color:HUI.COLOR.ink,
                        letterSpacing:-0.3, marginBottom:6 }}>
                        Frische Entdeckungen für dich
                      </div>
                      <div style={{ fontSize:12.5, color:"#888", lineHeight:1.6 }}>
                        Zufällig kuratiert — vielleicht genau das Richtige.
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {(surprises || []).filter(Boolean).map((item, i) => (
                        <ResultCard key={item.id||i} item={item} idx={i}
                          moodColor={HUI.COLOR.gold}
                          onOpen={v => { onView?.(v); onClose(); }}/>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:10, marginTop:18 }}>
                      <button className="hmo-tap" onClick={goBack}
                        style={{ flex:1, padding:"12px", borderRadius:50,
                          background:"rgba(0,0,0,0.055)",
                          border:"1.5px solid rgba(0,0,0,0.07)",
                          color:HUI.COLOR.ink2, fontSize:13, fontWeight:700 }}>
                        Stimmung wählen
                      </button>
                      <button className="hmo-tap" onClick={doSurprise}
                        style={{ flex:1.5, padding:"12px", borderRadius:50,
                          background:"linear-gradient(135deg,#F5A623,#FF8A6B)",
                          border:"none", color:"white", fontSize:13, fontWeight:800,
                          boxShadow:"0 4px 16px rgba(245,166,35,0.28)" }}>
                        🔄 Nochmal überraschen
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}