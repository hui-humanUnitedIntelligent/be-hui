// HuiMatchOverlay.jsx — HUI Match v2
// Emotionaler Discovery-Flow: Inspiration × Menschen × Werke × Erlebnisse
// Design: bestehende HUI-Optik vollständig beibehalten

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.06)", gold:"#F5A623", green:"#3DB87A",
  purple:"#A78BFA",
};

const CSS = `
  @keyframes sheetUp {
    from { transform:translateY(100%); opacity:0.6; }
    to   { transform:translateY(0);    opacity:1;   }
  }
  @keyframes chipIn {
    from { opacity:0; transform:scale(0.88) translateY(8px); }
    to   { opacity:1; transform:scale(1)    translateY(0);   }
  }
  @keyframes cardIn {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes breathe {
    0%,100%{transform:scale(1)}
    50%{transform:scale(1.06)}
  }
  .hmo-scroll::-webkit-scrollbar{display:none}
  .hmo-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .hmo-tap{-webkit-tap-highlight-color:transparent;cursor:pointer;border:none;fontFamily:inherit;background:none}
  .hmo-tap:active{transform:scale(0.94)!important}
`;

/* ── Interest Chips ─────────────────────────────────── */
const INTERESTS = [
  {key:"inspiration",  icon:"✨", label:"Inspiration"},
  {key:"menschen",     icon:"🤝", label:"Menschen kennenlernen"},
  {key:"werke",        icon:"🎨", label:"Kreative Werke"},
  {key:"kuenstler",    icon:"🖌️", label:"Künstler"},
  {key:"workshops",    icon:"🔧", label:"Workshops"},
  {key:"coaching",     icon:"💡", label:"Coaching"},
  {key:"austausch",    icon:"💬", label:"Austausch"},
  {key:"musik",        icon:"🎵", label:"Musik"},
  {key:"natur",        icon:"🌿", label:"Natur"},
  {key:"heilung",      icon:"🌸", label:"Heilung"},
  {key:"handwerk",     icon:"🏺", label:"Handwerk"},
  {key:"fotografie",   icon:"📸", label:"Fotografen"},
  {key:"motivation",   icon:"🔥", label:"Motivation"},
  {key:"gemeinschaft", icon:"🫂", label:"Gemeinschaft"},
  {key:"ruhe",         icon:"🧘", label:"Ruhe"},
  {key:"abenteuer",    icon:"🗺️", label:"Abenteuer"},
  {key:"kunst",        icon:"🖼️", label:"Kunst"},
  {key:"design",       icon:"✏️", label:"Design"},
];

const LOCATIONS = [
  {key:"nearby",   icon:"📍", label:"In meiner Nähe"},
  {key:"de",       icon:"🇩🇪", label:"Deutschlandweit"},
  {key:"online",   icon:"💻", label:"Online"},
  {key:"world",    icon:"🌍", label:"Weltweit"},
];

const DISCOVER_TYPES = [
  {key:"all",         icon:"✦",  label:"Alles gemischt",  color:C.teal},
  {key:"works",       icon:"🎨", label:"Werke",           color:C.gold},
  {key:"experiences", icon:"✨", label:"Erlebnisse",      color:C.coral},
  {key:"people",      icon:"👤", label:"Menschen",        color:C.purple},
];

/* ── Result card ─────────────────────────────────────── */
function ResultCard({ item, idx, onOpen }) {
  const isWirker = item.type === "wirker" || item.type === "profile";
  const isWerk   = item.type === "work"   || item.type === "werk";
  const tag      = isWirker ? "Talent" : isWerk ? "Werk" : "Erlebnis";
  const tagColor = isWirker ? C.teal    : isWerk ? C.gold : C.coral;
  const img      = item.avatar_url || item.cover_url || item.img ||
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80";

  return (
    <div onClick={() => onOpen?.(item)}
      style={{ background:C.card, borderRadius:18,
        overflow:"hidden", cursor:"pointer",
        boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
        border:`1px solid ${C.border}`,
        animation:`cardIn 0.35s ${idx*0.05}s both`,
        transition:"transform .2s cubic-bezier(.34,1.4,.64,1)",
        WebkitTapHighlightColor:"transparent" }}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      {/* Cover */}
      <div style={{ position:"relative", height:110, overflow:"hidden" }}>
        <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
        <div style={{ position:"absolute",inset:0,
          background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45))" }}/>
        <span style={{ position:"absolute",bottom:8,left:10,
          fontSize:10, fontWeight:800, color:"white",
          background:`${tagColor}CC`, borderRadius:50, padding:"2px 8px",
          backdropFilter:"blur(6px)" }}>
          {tag}
        </span>
      </div>
      {/* Body */}
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontWeight:800,fontSize:13,color:C.ink,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
          {item.display_name || item.name || item.title || "—"}
        </div>
        <div style={{ fontSize:11,color:C.muted,marginTop:2,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
          {item.talent || item.bio?.slice(0,40) || item.description?.slice(0,40) || ""}
        </div>
        {(item.location || item.city) && (
          <div style={{ fontSize:10,color:C.muted2,marginTop:3,
            display:"flex",alignItems:"center",gap:3 }}>
            <span>📍</span>
            {item.location || item.city}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Surprise result card ────────────────────────────── */
function SurpriseCard({ item, idx, onOpen }) {
  return (
    <div onClick={() => onOpen?.(item)}
      style={{ background:C.card, borderRadius:18,
        overflow:"hidden", cursor:"pointer",
        boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
        border:`1.5px solid ${C.gold}33`,
        animation:`cardIn 0.4s ${idx*0.07}s both`,
        WebkitTapHighlightColor:"transparent" }}>
      <div style={{ height:100, overflow:"hidden", position:"relative" }}>
        <img src={item.avatar_url||item.cover_url||item.img||
          "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80"}
          alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
        <div style={{ position:"absolute",inset:0,
          background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.5))" }}/>
        <span style={{ position:"absolute",bottom:7,left:9,
          fontSize:9,fontWeight:800,color:"white",
          background:"rgba(245,166,35,0.85)",borderRadius:50,padding:"2px 7px" }}>
          🎲 Überraschung
        </span>
      </div>
      <div style={{ padding:"9px 11px 11px" }}>
        <div style={{ fontWeight:800,fontSize:12,color:C.ink }}>
          {item.display_name||item.name||item.title||"—"}
        </div>
        <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>
          {item.talent||item.description?.slice(0,35)||item.bio?.slice(0,35)||""}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton loader ─────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ background:C.card, borderRadius:18,
          overflow:"hidden", border:`1px solid ${C.border}`,
          animation:`cardIn 0.3s ${i*0.06}s both` }}>
          <div style={{ height:110, background:`linear-gradient(90deg,
            ${C.border} 25%, rgba(0,0,0,0.03) 50%, ${C.border} 75%)`,
            backgroundSize:"200% 100%",
            animation:"shimmer 1.4s ease infinite" }}/>
          <div style={{ padding:"10px 12px" }}>
            <div style={{ height:12,borderRadius:6,background:C.border,marginBottom:6,width:"70%" }}/>
            <div style={{ height:10,borderRadius:6,background:C.border,width:"50%" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function HuiMatchOverlay({ onClose, onView }) {
  const [step,      setStep]      = useState("discover"); // discover | results | surprise
  const [interests, setInterests] = useState([]);
  const [location,  setLocation]  = useState("de");
  const [discType,  setDiscType]  = useState("all");
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [surprises, setSurprises] = useState([]);
  const sheetRef = useRef(null);

  // Swipe-down to close
  const touchStartY = useRef(null);
  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY; }
  function onTouchEnd(e) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) onClose();
    touchStartY.current = null;
  }

  function toggleInterest(key) {
    setInterests(prev =>
      prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]
    );
  }

  async function doMatch() {
    setLoading(true);
    setStep("results");
    try {
      // Build queries based on selections
      const queries = [];

      // Profiles / Talente
      if (discType === "all" || discType === "people") {
        let q = supabase.from("profiles")
          .select("id, display_name, avatar_url, bio, location, focus_type, has_talent_profile")
          .eq("has_talent_profile", true)
          .limit(12);
        if (location === "online") q = q.eq("location", "Online");
        const { data } = await q;
        queries.push(...(data||[]).map(p => ({ ...p, type:"profile" })));
      }

      // Works
      if (discType === "all" || discType === "works") {
        const { data } = await supabase.from("works")
          .select("id, title, cover_url, price, description, user_id")
          .eq("status","published").limit(8);
        queries.push(...(data||[]).map(w => ({ ...w, type:"work" })));
      }

      // Experiences
      if (discType === "all" || discType === "experiences") {
        const loc = location === "online" ? "online" : undefined;
        let q = supabase.from("experiences")
          .select("id, title, cover_url, price, description, location")
          .eq("status","published").limit(8);
        if (loc) q = q.ilike("location", "%online%");
        const { data } = await q;
        queries.push(...(data||[]).map(e => ({ ...e, type:"experience" })));
      }

      // Score by interest tags
      const scored = queries
        .map(item => {
          let score = Math.random() * 0.3; // base noise
          const text = [
            item.display_name, item.title, item.bio,
            item.description, item.focus_type, item.location
          ].join(" ").toLowerCase();
          interests.forEach(int => {
            if (text.includes(int)) score += 1.5;
            // fuzzy tag matching
            const chip = INTERESTS.find(i=>i.key===int);
            if (chip && text.includes(chip.label.toLowerCase())) score += 1;
          });
          return { ...item, _score: score };
        })
        .sort((a,b) => b._score - a._score);

      setResults(scored);
    } catch(e) {
      console.warn("[HuiMatch]", e.message);
      setResults([]);
    }
    setLoading(false);
  }

  async function doSurprise() {
    setLoading(true);
    setStep("surprise");
    try {
      const [profileRes, workRes, expRes] = await Promise.all([
        supabase.from("profiles").select("id,display_name,avatar_url,bio,location")
          .eq("has_talent_profile",true).limit(20),
        supabase.from("works").select("id,title,cover_url,price,description")
          .eq("status","published").limit(20),
        supabase.from("experiences").select("id,title,cover_url,price,description,location")
          .eq("status","published").limit(20),
      ]);
      const pool = [
        ...(profileRes.data||[]).map(p=>({...p,type:"profile"})),
        ...(workRes.data||[]).map(w=>({...w,type:"work"})),
        ...(expRes.data||[]).map(e=>({...e,type:"experience"})),
      ];
      // Shuffle
      const shuffled = pool.sort(()=>Math.random()-0.5).slice(0,8);
      setSurprises(shuffled);
    } catch(e) {
      setSurprises([]);
    }
    setLoading(false);
  }

  return (
    <>
      <style>{CSS}
        @keyframes shimmer {
          0%{background-position:200% 0}
          100%{background-position:-200% 0}
        }
      </style>

      {/* Backdrop */}
      <div style={{ position:"fixed",inset:0,zIndex:600,
        background:"rgba(10,10,10,0.55)",
        backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)" }}
        onClick={e => e.target===e.currentTarget && onClose()}>

        {/* Sheet */}
        <div ref={sheetRef}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ position:"absolute",bottom:0,left:0,right:0,
            background:C.warm,
            borderRadius:"28px 28px 0 0",
            maxHeight:"92vh",
            display:"flex",flexDirection:"column",
            animation:"sheetUp 0.38s cubic-bezier(0.22,1,0.36,1) both",
            paddingBottom:"env(safe-area-inset-bottom,0)" }}>

          {/* Handle */}
          <div style={{ display:"flex",justifyContent:"center",padding:"14px 0 0",flexShrink:0 }}>
            <div style={{ width:44,height:4,borderRadius:999,background:"rgba(0,0,0,0.10)" }}/>
          </div>

          {/* Header */}
          <div style={{ padding:"12px 20px 0",flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",
              justifyContent:"space-between",marginBottom:2 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                {(step==="results"||step==="surprise") && (
                  <button className="hmo-tap" onClick={()=>setStep("discover")}
                    style={{ width:30,height:30,borderRadius:"50%",
                      background:"rgba(0,0,0,0.06)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:14,color:C.muted,transition:"transform .15s" }}>
                    ←
                  </button>
                )}
                <div style={{ width:38,height:38,borderRadius:12,
                  background:`linear-gradient(135deg,${C.gold},#E8A000)`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,boxShadow:"0 3px 12px rgba(245,166,35,0.28)",
                  animation:"breathe 4s ease-in-out infinite" }}>✨</div>
                <div>
                  <div style={{ fontWeight:900,fontSize:18,color:C.ink,letterSpacing:-0.4 }}>
                    {step==="surprise" ? "Überraschung 🎲" : "HUI Match"}
                  </div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>
                    {step==="discover"  ? "Entdecke Menschen, Werke & Erlebnisse" :
                     step==="surprise"  ? "Zufällige Entdeckungen für dich" :
                     `${results.length} Treffer · ${interests.length > 0 ? interests.length+" Interessen" : "Alle"}`}
                  </div>
                </div>
              </div>
              <button className="hmo-tap" onClick={onClose}
                style={{ width:30,height:30,borderRadius:"50%",
                  background:"rgba(0,0,0,0.06)",border:"none",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,color:C.muted,transition:"transform .15s" }}>✕</button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="hmo-scroll"
            style={{ flex:1,overflowY:"auto",padding:"16px 16px max(24px,env(safe-area-inset-bottom,24px))" }}>

            {/* ── STEP: DISCOVER ── */}
            {step === "discover" && (
              <>
                {/* Section 1: Interessen */}
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:16,fontWeight:900,color:C.ink,
                    letterSpacing:-0.3,marginBottom:4 }}>
                    Was suchst du gerade?
                  </div>
                  <div style={{ fontSize:12,color:C.muted,marginBottom:12 }}>
                    Wähle so viele wie du möchtest.
                  </div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                    {INTERESTS.map((chip,i) => {
                      const on = interests.includes(chip.key);
                      return (
                        <button key={chip.key} className="hmo-tap"
                          onClick={() => toggleInterest(chip.key)}
                          style={{ display:"inline-flex",alignItems:"center",gap:6,
                            padding:"8px 14px",borderRadius:50,
                            background: on
                              ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                              : "rgba(0,0,0,0.055)",
                            border:`1.5px solid ${on ? "transparent" : "rgba(0,0,0,0.06)"}`,
                            color: on ? "white" : C.ink2,
                            fontSize:13,fontWeight: on ? 700 : 500,
                            boxShadow: on ? `0 2px 10px ${C.tealGlow}` : "none",
                            transition:"all .2s cubic-bezier(.34,1.4,.64,1)",
                            animation:`chipIn 0.3s ${i*0.025}s both` }}>
                          <span style={{ fontSize:14 }}>{chip.icon}</span>
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Ort */}
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:15,fontWeight:800,color:C.ink,
                    letterSpacing:-0.2,marginBottom:10 }}>
                    Wo möchtest du entdecken?
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                    {LOCATIONS.map(loc => {
                      const on = location === loc.key;
                      return (
                        <button key={loc.key} className="hmo-tap"
                          onClick={() => setLocation(loc.key)}
                          style={{ display:"flex",alignItems:"center",gap:10,
                            padding:"12px 14px",borderRadius:16,
                            background: on ? `${C.teal}14` : C.card,
                            border:`1.5px solid ${on ? C.teal+"55" : C.border}`,
                            cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                            transition:"all .2s cubic-bezier(.34,1.4,.64,1)" }}>
                          <span style={{ fontSize:18 }}>{loc.icon}</span>
                          <span style={{ fontSize:13,fontWeight: on ? 800 : 500,
                            color: on ? C.teal : C.ink2 }}>
                            {loc.label}
                          </span>
                          {on && <div style={{ marginLeft:"auto",width:8,height:8,
                            borderRadius:"50%",background:C.teal }}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Was entdecken? */}
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:15,fontWeight:800,color:C.ink,
                    letterSpacing:-0.2,marginBottom:10 }}>
                    Was möchtest du entdecken?
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                    {DISCOVER_TYPES.map(dt => {
                      const on = discType === dt.key;
                      return (
                        <button key={dt.key} className="hmo-tap"
                          onClick={() => setDiscType(dt.key)}
                          style={{ display:"flex",alignItems:"center",gap:10,
                            padding:"12px 14px",borderRadius:16,
                            background: on ? `${dt.color}14` : C.card,
                            border:`1.5px solid ${on ? dt.color+"55" : C.border}`,
                            cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                            transition:"all .2s" }}>
                          <span style={{ fontSize:18 }}>{dt.icon}</span>
                          <span style={{ fontSize:13,fontWeight: on ? 800 : 500,
                            color: on ? dt.color : C.ink2 }}>
                            {dt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CTA row */}
                <div style={{ display:"flex",gap:10 }}>
                  {/* Surprise me */}
                  <button className="hmo-tap" onClick={doSurprise}
                    style={{ flex:1,padding:"14px",borderRadius:50,
                      background:"rgba(0,0,0,0.055)",
                      border:"1.5px solid rgba(0,0,0,0.07)",
                      color:C.ink2,fontSize:14,fontWeight:700,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                      transition:"transform .18s" }}>
                    🎲 Überrasch mich
                  </button>
                  {/* Match */}
                  <button className="hmo-tap" onClick={doMatch}
                    style={{ flex:2,padding:"14px",borderRadius:50,
                      background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                      border:"none",color:"white",fontSize:14,fontWeight:800,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                      boxShadow:`0 4px 18px ${C.tealGlow}`,
                      transition:"transform .18s, box-shadow .18s" }}>
                    ✨ Match finden
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: RESULTS ── */}
            {step === "results" && (
              <>
                {loading
                  ? <Skeleton/>
                  : results.length === 0
                    ? (
                      <div style={{ textAlign:"center",padding:"48px 24px" }}>
                        <div style={{ fontSize:36,marginBottom:12 }}>🌱</div>
                        <div style={{ fontSize:15,fontWeight:700,color:C.ink,marginBottom:6 }}>
                          Noch keine Treffer
                        </div>
                        <div style={{ fontSize:13,color:C.muted }}>
                          Andere Interessen wählen?
                        </div>
                        <button className="hmo-tap" onClick={()=>setStep("discover")}
                          style={{ marginTop:16,padding:"11px 24px",borderRadius:50,
                            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                            border:"none",color:"white",fontSize:13,fontWeight:700 }}>
                          Neu auswählen
                        </button>
                      </div>
                    )
                    : (
                      <>
                        {/* Interest tags recap */}
                        {interests.length > 0 && (
                          <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:14 }}>
                            {interests.map(key => {
                              const chip = INTERESTS.find(c=>c.key===key);
                              return chip ? (
                                <span key={key} style={{ fontSize:11,fontWeight:700,
                                  color:C.teal,background:`${C.teal}12`,
                                  borderRadius:50,padding:"3px 10px" }}>
                                  {chip.icon} {chip.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                          {results.map((item,i) => (
                            <ResultCard key={item.id||i} item={item} idx={i}
                              onOpen={v => { onView?.(v); onClose(); }}/>
                          ))}
                        </div>
                      </>
                    )
                }
              </>
            )}

            {/* ── STEP: SURPRISE ── */}
            {step === "surprise" && (
              <>
                {loading
                  ? <Skeleton/>
                  : (
                    <>
                      <div style={{ textAlign:"center",marginBottom:18 }}>
                        <div style={{ fontSize:28,marginBottom:4 }}>🎲</div>
                        <div style={{ fontSize:13,color:C.muted,lineHeight:1.5 }}>
                          Zufällige Entdeckungen — frisch für dich.
                        </div>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
                        {surprises.map((item,i) => (
                          <SurpriseCard key={item.id||i} item={item} idx={i}
                            onOpen={v => { onView?.(v); onClose(); }}/>
                        ))}
                      </div>
                      <button className="hmo-tap" onClick={doSurprise}
                        style={{ width:"100%",padding:"13px",borderRadius:50,
                          background:"rgba(0,0,0,0.055)",
                          border:"1.5px solid rgba(0,0,0,0.07)",
                          color:C.ink2,fontSize:14,fontWeight:700 }}>
                        🔄 Nochmal überraschen
                      </button>
                    </>
                  )
                }
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
