// HuiMatchOverlay.jsx — HUI Match + Smart Search System
// Intelligent, human, cinematic — not a search engine
import React, { useState, useEffect, useRef, useCallback } from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.06)", gold:"#F5A623", green:"#3DB87A",
};

/* ── Mock search corpus ─────────────────────── */
const CORPUS = [
  // WIRKER
  {id:1,type:"wirker",name:"Lea Sommer",talent:"Fotografin",city:"München",lat:48.13,lng:11.57,
   bio:"Ich fange das Licht ein, bevor es verschwindet.",
   img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=90",
   bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=90",
   score:4.9,recs:34,hourly:85,tags:["fotografie","portrait","natur","hochzeit","editorial"],available:true},
  {id:2,type:"wirker",name:"David Weber",talent:"Keramikkünstler",city:"Hamburg",lat:53.55,lng:9.99,
   bio:"Ton ist mein Medium — Stille ist meine Sprache.",
   img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=90",
   bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90",
   score:4.8,recs:19,hourly:65,tags:["keramik","handwerk","töpfern","kurs","workshop"],available:true},
  {id:3,type:"wirker",name:"Nina B.",talent:"Yogalehrerin",city:"Stuttgart",lat:48.77,lng:9.18,
   bio:"Yoga ist keine Übung — es ist eine Art zu leben.",
   img:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=90",
   bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=90",
   score:4.9,recs:61,hourly:55,tags:["yoga","meditation","morgen","natur","wellness","gruppe"],available:true},
  {id:4,type:"wirker",name:"Marcus B.",talent:"Videograf",city:"Berlin",lat:52.52,lng:13.40,
   bio:"Bewegte Bilder, die bewegen.",
   img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=90",
   bg:"https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=900&q=90",
   score:4.7,recs:27,hourly:120,tags:["video","film","dokumentation","imagefilm","brand"],available:false},
  {id:5,type:"wirker",name:"Anna K.",talent:"Gartengestalterin",city:"München",lat:48.15,lng:11.52,
   bio:"Gärten sind lebendige Kunstwerke.",
   img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=90",
   bg:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=90",
   score:4.9,recs:43,hourly:75,tags:["garten","pflanzen","natur","gestaltung","outdoor","konzept"],available:true},
  {id:6,type:"wirker",name:"Felix M.",talent:"Gitarrenlehrer",city:"Frankfurt",lat:50.11,lng:8.68,
   bio:"Musik verbindet — ich zeige dir den Einstieg.",
   img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=90",
   bg:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=90",
   score:4.6,recs:15,hourly:45,tags:["gitarre","musik","unterricht","anfänger","kurs","akustik"],available:true},
  // WERKE
  {id:7,type:"werk",name:"Handgefertigte Keramikschale",creator:"David Weber",city:"Hamburg",
   price:89,img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=90",
   desc:"Einzigartiges Unikat. Handgefertigt mit Ton aus der Region.",
   tags:["keramik","handwerk","geschenk","küche","deko","unikat"],category:"Handwerk"},
  {id:8,type:"werk",name:"Zwischen Licht und Wellen",creator:"Lea Sommer",city:"München",
   price:320,img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=90",
   desc:"Limitierter Fine-Art-Druck. Handgefertigt auf Hahnemühle.",
   tags:["fotografie","kunst","print","natur","wellen","licht","deko"],category:"Fotografie"},
  {id:9,type:"werk",name:"Leder-Rucksack (handgenäht)",creator:"Stefan K.",city:"Berlin",
   price:195,img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=90",
   desc:"Vollnarbiges Vegetable-Tanned Leder. Auf Maß.",
   tags:["leder","tasche","rucksack","handwerk","nachhaltig","mode"],category:"Mode"},
  {id:10,type:"werk",name:"Aquarell Original (A3)",creator:"Lena M.",city:"Leipzig",
   price:120,img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=90",
   desc:"Aquarell auf Archivpapier. Jedes Stück ein Original.",
   tags:["kunst","aquarell","malerei","original","wohnzimmer","deko","geschenk"],category:"Kunst"},
  // EXPERIENCES
  {id:11,type:"experience",name:"Yoga bei Sonnenaufgang",creator:"Nina B.",city:"Stuttgart",lat:48.78,lng:9.20,
   price:35,img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=90",
   desc:"Morgen-Yoga im Park. Sonnenaufgang, Stille, Gemeinschaft.",
   tags:["yoga","morgen","natur","gruppe","entspannung","sonnenaufgang","outdoor"],duration:"75 Min"},
  {id:12,type:"experience",name:"Töpferkurs am See",creator:"David Weber",city:"Starnberg",lat:47.99,lng:11.35,
   price:85,img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=90",
   desc:"Töpfern am Ufer des Starnberger Sees. Natur und Handwerk.",
   tags:["töpfern","kurs","see","natur","handwerk","gruppe","wochenende"],duration:"3 Std"},
  {id:13,type:"experience",name:"Walk & Think Session",creator:"Lars G.",city:"München",lat:48.14,lng:11.56,
   price:150,img:"https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=600&q=90",
   desc:"Strategie-Spaziergang durch die Stadt. Ideen brauchen Luft.",
   tags:["coaching","spaziergang","strategie","ideen","outdoor","business","inspiration"],duration:"2 Std"},
  {id:14,type:"experience",name:"Gitarren-Abend am Feuer",creator:"Felix M.",city:"Frankfurt",lat:50.12,lng:8.70,
   price:55,img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=90",
   desc:"Musik, Feuer, Gemeinschaft. Für Anfänger und Fortgeschrittene.",
   tags:["gitarre","musik","feuer","abend","gruppe","community","singen"],duration:"2 Std"},
];

/* ── Hints cycling ──────────────────────────── */
const HINTS = [
  "Fotograf für ein ruhiges Naturshooting",
  "Yoga Experience am Wochenende",
  "Jemanden für meinen Garten in München",
  "Handgefertigte Keramik als Geschenk",
  "Gitarrenunterricht für Anfänger",
  "Kreative Hilfe für mein Café",
  "Imagefilm unter 2.000 €",
  "Töpferkurs am Samstag",
];

/* ── AI intent parser (local, no API) ──────── */
function parseIntent(q) {
  const ql = q.toLowerCase();
  const intent = { type:null, tags:[], city:null, maxPrice:null,
    mood:null, available:false, radius:null };

  // Type detection
  if(/kurs|workshop|abend|erlebnis|experience|session|event|group|gruppe/i.test(ql))
    intent.type = "experience";
  else if(/kaufen|unikat|original|handgefertigt|druck|print|werk|produkt/i.test(ql))
    intent.type = "werk";
  else if(/fotograf|lehrer|coach|gärtn|töpfer|yoga|gitarr|wirker|jemand|person|suche.*der|suche.*die/i.test(ql))
    intent.type = "wirker";

  // Budget
  const priceMatch = ql.match(/unter\s*(\d+)|max\s*(\d+)|bis\s*(\d+)|(\d+)\s*€/);
  if (priceMatch) intent.maxPrice = parseInt(priceMatch[1]||priceMatch[2]||priceMatch[3]||priceMatch[4]);

  // City
  for (const city of ["münchen","hamburg","berlin","frankfurt","stuttgart","köln","leipzig","starnberg"]) {
    if (ql.includes(city)) { intent.city = city; break; }
  }

  // Tags extraction
  const tagMap = {
    foto:["fotografie","portrait"], natur:["natur","outdoor"],
    yoga:["yoga","meditation"], töpf:["töpfern","keramik"],
    guitar:["gitarre","musik"], gitarr:["gitarre","musik"],
    garten:["garten","pflanzen","outdoor"], video:["video","film"],
    coach:["coaching","strategie"], aquarell:["kunst","aquarell"],
    leder:["leder","handwerk"], geschenk:["geschenk","unikat"],
    morgen:["morgen","sonnenaufgang"], feuer:["feuer","abend"],
    see:["see","natur","outdoor"], hochzeit:["hochzeit"],
    café:["business","brand","foto"], imagefilm:["video","brand"],
    strateg:["strategie","coaching","business"],
  };
  for (const [k,tags] of Object.entries(tagMap)) {
    if (ql.includes(k)) intent.tags.push(...tags);
  }

  // Mood
  if (/ruhig|entspannt|langsam|natur|friedlich/i.test(ql)) intent.mood = "calm";
  if (/energie|dynamisch|kreativ|inspirier/i.test(ql)) intent.mood = "energetic";
  if (/wochenend|samstag|sonntag/i.test(ql)) intent.available = true;

  return intent;
}

/* ── Relevance scoring ──────────────────────── */
function scoreItem(item, intent, q) {
  const ql = q.toLowerCase();
  let score = 0;

  // Type match
  if (intent.type && item.type === intent.type) score += 40;
  if (!intent.type) score += 10; // neutral

  // Tag overlap
  const itemTags = item.tags || [];
  const overlap = intent.tags.filter(t => itemTags.some(it => it.includes(t) || t.includes(it)));
  score += overlap.length * 15;

  // Direct text match in name/bio/desc
  const searchIn = [item.name, item.bio||"", item.desc||"", item.talent||"", item.creator||""].join(" ").toLowerCase();
  const words = ql.split(/\s+/).filter(w => w.length > 3);
  for (const w of words) {
    if (searchIn.includes(w)) score += 20;
  }

  // City match
  if (intent.city && (item.city||"").toLowerCase().includes(intent.city)) score += 25;

  // Price filter
  if (intent.maxPrice) {
    const p = item.price || item.hourly || 0;
    if (p > intent.maxPrice) return -1; // exclude
    if (p > 0 && p <= intent.maxPrice) score += 10;
  }

  // Availability
  if (intent.available && item.available === false) score -= 20;

  // Quality boost
  if (item.score) score += (item.score - 4) * 10;
  if (item.recs)  score += Math.min(item.recs * 0.5, 15);

  return score;
}

function search(q, radius) {
  if (!q.trim()) return [];
  const intent = parseIntent(q);
  const scored = CORPUS.map(item => ({
    item,
    score: scoreItem(item, intent, q),
  })).filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.item);
  return scored;
}

/* ══════════════════════════════════════════════
   RESULT CARD — cinematic, not a listing
══════════════════════════════════════════════ */
function ResultCard({ item, idx, onOpen }) {
  const isWirker     = item.type === "wirker";
  const isWerk       = item.type === "werk";
  const isExperience = item.type === "experience";

  const accentColor  = isWirker ? C.teal : isWerk ? C.coral : C.gold;
  const img          = item.img || item.bg;

  return (
    <div
      onClick={() => onOpen(item)}
      style={{
        borderRadius:22, overflow:"hidden", cursor:"pointer",
        background:C.card,
        boxShadow:"0 4px 24px rgba(0,0,0,0.10)",
        animation:`resultsIn 0.5s ${idx*0.07}s both`,
        flexShrink:0,
      }}>

      {/* Image — dominant */}
      <div style={{ position:"relative", height: isWirker ? 200 : 180 }}>
        <img src={img} alt={item.name}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            objectPosition: isWirker ? "top" : "center",
            filter:"brightness(0.72) saturate(1.1)" }}/>

        {/* Atmosphere overlay — teal for wirker, coral for werk */}
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            ${isWirker ? "rgba(22,215,197,0.10)" : isWerk ? "rgba(255,138,107,0.08)" : "rgba(245,166,35,0.08)"} 0%,
            transparent 35%,
            rgba(0,0,0,0.65) 100%)` }}/>

        {/* Accent strip — the silent visual signal */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,${accentColor},transparent)` }}/>

        {/* Type hint — ultra minimal */}
        {isExperience && (
          <div style={{ position:"absolute", top:12, left:12 }}>
            <div style={{ background:"rgba(245,166,35,0.22)",
              backdropFilter:"blur(8px)",
              border:"1px solid rgba(245,166,35,0.35)",
              borderRadius:999, padding:"3px 10px",
              fontSize:10, fontWeight:700, color:C.gold }}>
              ⏱ {item.duration}
            </div>
          </div>
        )}

        {/* Available dot for wirker */}
        {isWirker && item.available && (
          <div style={{ position:"absolute", top:12, right:12,
            display:"flex", alignItems:"center", gap:5,
            background:"rgba(61,184,122,0.22)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(61,184,122,0.35)",
            borderRadius:999, padding:"3px 10px" }}>
            <span style={{ width:5, height:5, borderRadius:"50%",
              background:C.green, display:"inline-block" }}/>
            <span style={{ fontSize:9, fontWeight:700, color:C.green }}>Verfügbar</span>
          </div>
        )}

        {/* Price for werk/experience */}
        {(isWerk||isExperience) && item.price && (
          <div style={{ position:"absolute", bottom:12, right:12 }}>
            <div style={{ background:"rgba(255,255,255,0.92)",
              backdropFilter:"blur(8px)",
              borderRadius:999, padding:"4px 12px",
              fontSize:12, fontWeight:900, color:C.ink }}>
              {isWerk ? `€ ${item.price}` : `ab € ${item.price}`}
            </div>
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ padding:"14px 16px 16px" }}>
        <div style={{ fontWeight:800, fontSize:15, color:C.ink,
          letterSpacing:-0.2, marginBottom:3 }}>
          {item.name}
        </div>

        {isWirker && (
          <>
            <div style={{ fontSize:12, color:accentColor,
              fontWeight:700, marginBottom:3 }}>{item.talent}</div>
            <div style={{ fontSize:11, color:C.muted }}>📍 {item.city}</div>
          </>
        )}
        {isWerk && (
          <div style={{ fontSize:12, color:C.teal,
            fontWeight:600 }}>{item.creator} · {item.city}</div>
        )}
        {isExperience && (
          <>
            <div style={{ fontSize:12, color:C.teal,
              fontWeight:600, marginBottom:2 }}>{item.creator}</div>
            <div style={{ fontSize:11, color:C.muted }}>📍 {item.city}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN OVERLAY
══════════════════════════════════════════════ */
const CSS = `
  @keyframes sheetUp {
    from { transform:translateY(100%); opacity:0; }
    to   { transform:translateY(0);    opacity:1; }
  }
  @keyframes resultsIn {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes breathe {
    0%,100% { opacity:0.7; transform:scale(1); }
    50%      { opacity:1;   transform:scale(1.06); }
  }
  @keyframes dotPulse {
    0%,80%,100% { transform:scale(0); opacity:0.3; }
    40%          { transform:scale(1); opacity:1; }
  }
  .hm-scroll::-webkit-scrollbar { display:none; }
  .hm-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

export default function HuiMatchOverlay({ onClose, onView }) {
  const [q,          setQ]          = useState("");
  const [hint,       setHint]       = useState(0);
  const [results,    setResults]    = useState(null); // null=idle, []=empty, [...]
  const [loading,    setLoading]    = useState(false);
  const [radius,     setRadius]     = useState(50);
  const [showRadius, setShowRadius] = useState(false);
  const [filter,     setFilter]     = useState("alle");
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Cycling hint
  useEffect(() => {
    const t = setInterval(() => setHint(h => (h+1) % HINTS.length), 3400);
    return () => clearInterval(t);
  }, []);

  // Focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 180);
  }, []);

  // Debounced search on typing
  useEffect(() => {
    if (!q.trim()) { setResults(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setTimeout(() => {
        const res = search(q, radius);
        setResults(res);
        setLoading(false);
      }, 700 + Math.random()*400);
    }, 420);
    return () => clearTimeout(debounceRef.current);
  }, [q, radius]);

  const displayed = results === null ? null
    : filter === "alle" ? results
    : results.filter(r => r.type === filter);

  const FILTERS = [
    {key:"alle",      label:"Alles"},
    {key:"wirker",    label:"Wirker"},
    {key:"werk",      label:"Werke"},
    {key:"experience",label:"Erlebnisse"},
  ];

  return (
    <>
      <style>{CSS}</style>
      {/* Backdrop */}
      <div style={{ position:"fixed", inset:0, zIndex:600,
        background:"rgba(10,10,10,0.52)",
        backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)" }}
        onClick={e => e.target===e.currentTarget && onClose()}>

        {/* Sheet */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          background:C.warm,
          borderRadius:"28px 28px 0 0",
          maxHeight:"93vh",
          display:"flex", flexDirection:"column",
          animation:"sheetUp 0.38s cubic-bezier(0.22,1,0.36,1) both",
          paddingBottom:"env(safe-area-inset-bottom,0)" }}>

          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center",
            padding:"14px 0 0", flexShrink:0 }}>
            <div style={{ width:44, height:4, borderRadius:999,
              background:"rgba(0,0,0,0.10)" }}/>
          </div>

          {/* Header */}
          <div style={{ padding:"14px 22px 0", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:42, height:42, borderRadius:14,
                  background:`linear-gradient(135deg,${C.gold},#E8A000)`,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:20,
                  boxShadow:"0 4px 14px rgba(245,166,35,0.30)",
                  animation:"breathe 4s ease-in-out infinite" }}>✨</div>
                <div>
                  <div style={{ fontWeight:900, fontSize:20,
                    color:C.ink, letterSpacing:-0.4 }}>HUI Match</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                    Beschreibe — ganz natürlich
                  </div>
                </div>
              </div>
              <button onClick={onClose}
                style={{ width:30, height:30, borderRadius:"50%",
                  background:"rgba(0,0,0,0.06)", border:"none",
                  cursor:"pointer", fontSize:12, color:C.muted,
                  display:"flex", alignItems:"center",
                  justifyContent:"center",
                  WebkitTapHighlightColor:"transparent" }}>✕</button>
            </div>

            {/* Rotating example hint */}
            <div style={{ fontSize:12, color:C.muted2,
              fontStyle:"italic", marginBottom:14,
              minHeight:16, transition:"opacity 0.4s" }}>
              z. B. „{HINTS[hint]}"
            </div>

            {/* Search input — warm, not technical */}
            <div style={{ position:"relative", marginBottom:12 }}>
              <span style={{ position:"absolute", left:16, top:"50%",
                transform:"translateY(-50%)", fontSize:15,
                color:C.muted2, pointerEvents:"none",
                transition:"opacity 0.2s",
                opacity:q?0:1 }}>🔍</span>
              {loading && (
                <div style={{ position:"absolute", right:16, top:"50%",
                  transform:"translateY(-50%)",
                  display:"flex", gap:3 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:5, height:5, borderRadius:"50%",
                      background:C.teal,
                      animation:`dotPulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>
                  ))}
                </div>
              )}
              <textarea
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                rows={2}
                placeholder="Was oder wen suchst du?"
                style={{ width:"100%", boxSizing:"border-box",
                  padding:"14px 48px 14px 44px",
                  fontSize:15, color:C.ink,
                  background:"rgba(255,255,255,0.88)",
                  backdropFilter:"blur(10px)",
                  border:`1.5px solid rgba(0,0,0,0.07)`,
                  borderRadius:20, outline:"none",
                  resize:"none", fontFamily:"inherit",
                  lineHeight:1.5, transition:"border-color 0.2s, box-shadow 0.2s" }}
                onFocus={e => {
                  e.target.style.borderColor = C.teal;
                  e.target.style.boxShadow = `0 0 0 3px ${C.tealGlow}`;
                }}
                onBlur={e => {
                  e.target.style.borderColor = "rgba(0,0,0,0.07)";
                  e.target.style.boxShadow = "none";
                }}/>
            </div>

            {/* Radius + Filter row */}
            <div style={{ display:"flex", alignItems:"center",
              gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {/* Radius pill */}
              <button
                onClick={() => setShowRadius(s => !s)}
                style={{ display:"flex", alignItems:"center", gap:5,
                  padding:"7px 14px",
                  background:showRadius ? `${C.teal}18` : "rgba(0,0,0,0.05)",
                  border:`1px solid ${showRadius ? C.teal+"44" : "transparent"}`,
                  borderRadius:999, fontSize:11, fontWeight:700,
                  color:showRadius ? C.teal : C.muted,
                  cursor:"pointer", fontFamily:"inherit",
                  WebkitTapHighlightColor:"transparent",
                  transition:"all 0.2s" }}>
                📍 {radius} km
              </button>

              {/* Type filters */}
              {FILTERS.map(f => (
                <button key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{ padding:"7px 14px",
                    background: filter===f.key
                      ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                      : "rgba(0,0,0,0.05)",
                    border:"none", borderRadius:999,
                    fontSize:11, fontWeight:filter===f.key ? 700 : 500,
                    color: filter===f.key ? "white" : C.muted,
                    cursor:"pointer", fontFamily:"inherit",
                    boxShadow: filter===f.key ? `0 2px 8px ${C.tealGlow}` : "none",
                    transition:"all 0.22s",
                    WebkitTapHighlightColor:"transparent" }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Radius slider — soft, Apple-style */}
            {showRadius && (
              <div style={{ background:C.card, borderRadius:18,
                padding:"16px 18px", marginBottom:14,
                boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
                animation:"resultsIn 0.3s ease both" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  marginBottom:10 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:C.ink }}>
                    Umkreis
                  </span>
                  <span style={{ fontSize:12, fontWeight:800, color:C.teal }}>
                    {radius === 500 ? "Weltweit" : `${radius} km`}
                  </span>
                </div>
                <input type="range" min={5} max={500} step={5}
                  value={radius} onChange={e => setRadius(+e.target.value)}
                  style={{ width:"100%", accentColor:C.teal,
                    height:3, cursor:"pointer" }}/>
                <div style={{ display:"flex", justifyContent:"space-between",
                  marginTop:6, fontSize:10, color:C.muted2 }}>
                  <span>5 km</span>
                  <span>Weltweit</span>
                </div>
              </div>
            )}
          </div>

          {/* Results — scrollable area */}
          <div className="hm-scroll"
            style={{ flex:1, overflowY:"auto", padding:"0 22px 28px" }}>

            {/* IDLE — quick categories */}
            {results === null && (
              <div style={{ animation:"resultsIn 0.4s ease both" }}>
                <div style={{ fontWeight:700, fontSize:12,
                  color:C.muted, letterSpacing:1.2,
                  textTransform:"uppercase", marginBottom:14 }}>
                  Entdecke
                </div>
                <div style={{ display:"grid",
                  gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                  {[
                    {icon:"📷", label:"Fotografie",   q:"Fotografin für Portrait"},
                    {icon:"🌿", label:"Natur & Garten",q:"Gartengestalterin in München"},
                    {icon:"🎵", label:"Musik",         q:"Gitarrenunterricht Anfänger"},
                    {icon:"🧘", label:"Wellness",      q:"Yoga Erlebnis am Wochenende"},
                    {icon:"🏺", label:"Handwerk",      q:"Töpferkurs am See"},
                    {icon:"🎬", label:"Video & Film",  q:"Videograf Imagefilm"},
                  ].map((cat,i) => (
                    <button key={i}
                      onClick={() => setQ(cat.q)}
                      style={{ display:"flex", alignItems:"center",
                        gap:10, padding:"13px 14px",
                        background:C.card, border:"none",
                        borderRadius:18, cursor:"pointer",
                        fontFamily:"inherit", textAlign:"left",
                        boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
                        animation:`resultsIn 0.5s ${i*0.07}s both`,
                        WebkitTapHighlightColor:"transparent" }}>
                      <div style={{ width:38, height:38, borderRadius:12,
                        background:C.cream,
                        display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:18,
                        flexShrink:0 }}>{cat.icon}</div>
                      <span style={{ fontSize:13, fontWeight:700,
                        color:C.ink, lineHeight:1.25 }}>
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div style={{ textAlign:"center", padding:"40px 0",
                animation:"resultsIn 0.3s ease both" }}>
                <div style={{ fontSize:32, marginBottom:12,
                  animation:"breathe 2s ease-in-out infinite" }}>✨</div>
                <div style={{ fontSize:14, color:C.muted,
                  fontStyle:"italic" }}>
                  HUI sucht passende Entdeckungen…
                </div>
              </div>
            )}

            {/* RESULTS */}
            {!loading && displayed !== null && displayed.length > 0 && (
              <>
                {/* Intent summary — human, not technical */}
                <div style={{ marginBottom:16,
                  fontSize:13, color:C.ink2, lineHeight:1.6 }}>
                  <span style={{ fontWeight:800, color:C.teal }}>
                    {displayed.length} Entdeckungen
                  </span>
                  {" "}für dich zusammengestellt.
                </div>

                {/* Grid — 1 col for wirker, 2 col for werke/exp mixed */}
                {displayed.map((item, i) => (
                  <div key={item.id} style={{ marginBottom:16 }}>
                    <ResultCard
                      item={item} idx={i}
                      onOpen={r => { onClose(); onView && onView(r); }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* EMPTY — emotional, not technical */}
            {!loading && displayed !== null && displayed.length === 0 && (
              <div style={{ textAlign:"center", padding:"44px 24px",
                animation:"resultsIn 0.4s ease both" }}>
                <div style={{ fontSize:40, marginBottom:14 }}>🌿</div>
                <div style={{ fontWeight:800, fontSize:18, color:C.ink,
                  marginBottom:8, letterSpacing:-0.3 }}>
                  Noch nichts Perfektes entdeckt.
                </div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.7 }}>
                  Versuche eine andere kreative Richtung —{" "}
                  oder lass HUI Match für dich suchen.
                </div>
                <button onClick={() => setQ("")}
                  style={{ marginTop:20, padding:"12px 24px",
                    background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                    border:"none", borderRadius:999,
                    fontSize:14, fontWeight:800, color:"white",
                    cursor:"pointer", fontFamily:"inherit",
                    boxShadow:`0 4px 16px ${C.tealGlow}`,
                    WebkitTapHighlightColor:"transparent" }}>
                  Neu entdecken
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
