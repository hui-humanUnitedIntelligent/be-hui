// src/components/home/header/SearchCommandCenter.jsx
// HUI Discovery Center — Phase 3: "Von Daten zu Möglichkeiten"
// Weniger Zahlen. Mehr Menschen. Weniger Dashboard. Mehr HUI.

import React, { useState, useEffect, useRef } from "react";
import { supabase }              from "../../../lib/supabaseClient.js";
import { toast }                 from "../../../lib/useToast.jsx";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  teal:   "#0EC4B8",
  tealS:  "rgba(14,196,184,0.08)",
  tealM:  "rgba(14,196,184,0.18)",
  ink:    "#1A3530",
  inkS:   "rgba(26,53,48,0.52)",
  inkF:   "rgba(26,53,48,0.28)",
  bg:     "rgba(255,252,250,0.995)",
  shadow: "0 20px 60px rgba(26,53,48,0.13), 0 2px 8px rgba(26,53,48,0.05)",
};

// ─────────────────────────────────────────────────────────────
// KONSTANTEN
// ─────────────────────────────────────────────────────────────
const THEMES = [
  { key:"nachhalt",     label:"Nachhaltigkeit", emoji:"🌱", color:"#16A34A",
    coverBg:"linear-gradient(135deg,#166534,#15803d)",
    kw:["nachhaltig","natur","umwelt","garten","grün","klima"] },
  { key:"kreativ",      label:"Kreativität",    emoji:"🎨", color:"#9333EA",
    coverBg:"linear-gradient(135deg,#581c87,#7e22ce)",
    kw:["kunst","kreativ","design","foto","illustration","maler"] },
  { key:"musik",        label:"Musik",          emoji:"🎵", color:"#0EA5E9",
    coverBg:"linear-gradient(135deg,#0c4a6e,#0369a1)",
    kw:["musik","musiker","band","konzert","session","lied"] },
  { key:"gemeinschaft", label:"Gemeinschaft",   emoji:"🤝", color:T.teal,
    coverBg:"linear-gradient(135deg,#134e4a,#0f766e)",
    kw:["gemeinschaft","treffen","community","lokal","nachbarschaft"] },
  { key:"bildung",      label:"Bildung",        emoji:"📚", color:"#D97706",
    coverBg:"linear-gradient(135deg,#78350f,#b45309)",
    kw:["bildung","workshop","lernen","kurs","schule","coaching"] },
];

const KI_SUGGESTIONS = [
  { text:"Ich suche kreative Menschen",        emoji:"👥" },
  { text:"Projekte in meiner Nähe",            emoji:"📍" },
  { text:"Wer passt zu meinem Profil?",        emoji:"🔮" },
  { text:"Wo kann ich heute helfen?",          emoji:"🤝" },
  { text:"Veranstaltungen die zu mir passen",  emoji:"📅" },
  { text:"Welche Menschen sollte ich kennen?", emoji:"✨" },
];

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────
function useDebounce(v, d) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return val;
}

// ─────────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────
function SectionLabel({ children, color, action, onAction }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      marginBottom: 10,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: ".07em",
        textTransform: "uppercase", color: color || T.inkF,
      }}>{children}</div>
      {action && (
        <button onClick={onAction} style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize: 10, color: T.teal, fontWeight: 600, padding: 0,
        }}>{action}</button>
      )}
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// KI PANEL
// ─────────────────────────────────────────────────────────────
function KiPanel({ onSelect, onClose }) {
  return (
    <div style={{
      position:"absolute", top:"calc(100% + 6px)", right:0,
      width:258, zIndex:10,
      background:T.bg, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
      borderRadius:16, boxShadow:"0 8px 32px rgba(26,53,48,0.14)",
      border:"1px solid rgba(14,196,184,0.20)", overflow:"hidden",
      animation:"dc-in .18s cubic-bezier(.22,1,.36,1) both",
    }}>
      <div style={{
        padding:"11px 13px 8px",
        background:"linear-gradient(135deg,rgba(14,196,184,0.08),rgba(14,196,184,0.02))",
        borderBottom:"1px solid rgba(14,196,184,0.10)",
      }}>
        <div style={{ fontSize:12,fontWeight:700,color:T.teal,marginBottom:2 }}>
          ✨ HUI KI kann dir helfen…
        </div>
        <div style={{ fontSize:10.5,color:T.inkF }}>Wähle einen Vorschlag</div>
      </div>
      <div style={{ padding:"7px 7px 9px" }}>
        {KI_SUGGESTIONS.map((s,i) => (
          <button key={i} onClick={()=>{onSelect(s.text);onClose();}} style={{
            display:"flex",alignItems:"center",gap:8,width:"100%",
            textAlign:"left",padding:"8px 10px",background:"none",border:"none",
            borderRadius:10,cursor:"pointer",WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}
          >
            <span style={{fontSize:14,flexShrink:0}}>{s.emoji}</span>
            <span style={{fontSize:12,fontWeight:500,color:T.ink}}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
  return createPortal(content, document.body);
}

// ─────────────────────────────────────────────────────────────
// HAUPTKOMPONENTE — Search Experience 2.0 (2026-07-06, Lars)
// ─────────────────────────────────────────────────────────────
// ARCHITEKTUR-WECHSEL: Kein Portal, kein Fullscreen-Overlay, keine eigene
// Ergebnisliste mehr (useUnifiedSearch/ResultCol/KiDiscoveryCol entfernt --
// vollstaendig ersetzt, keine doppelte Suchlogik mehr im System).
// Die Suche ist jetzt ein Zustand des Home-Feeds:
//   - open=false                   -> normaler Feed (Dashboard, Discover etc.)
//   - open=true,  query leer       -> Discovery: Kategorien + Filter + Verlauf,
//                                     inline direkt unter der Bar (kein Overlay,
//                                     kein Portal) -- Feed-Bereich bleibt leer
//   - open=true,  query nicht leer -> Kategorien+Verlauf blenden aus, Filter
//                                     bleiben sichtbar; der bestehende Feed
//                                     (UnifiedFeed/useFeedStream) zeigt live
//                                     gefilterte Ergebnisse -- dieselben Karten
//                                     wie im Normalzustand, keine Suchkarten.
// Diese Komponente besitzt selbst KEINE Ergebnisdaten mehr -- sie meldet nur
// {query, typeFilter, active} per onSearchStateChange nach oben (Home.jsx),
// welches es an UnifiedFeed durchreicht. Single Source of Truth ist der Feed
// (useFeedStream), nicht die Suchleiste.
//
// EINGESCHRAENKTE FUNKTION -- BEWUSST TRANSPARENT: Der Filter "Menschen" kann
// aktuell KEINE Feed-Items filtern, weil das Feed-Kartensystem (FeedRouter)
// nur 4 Typen kennt: moment/work/experience/event -- keinen Personen-Typ.
// Eine echte Personensuche im Feed wuerde eine neue Kartenart erfordern
// (Architektur-Entscheidung, kein reiner Bugfix). Bis dahin zeigt ein Tap auf
// "Menschen" einen kurzen Hinweis statt einen leeren/kaputten Feed-Zustand.
export default function SearchCommandCenter({ activeMood, currentUser, onSearchStateChange }) {
  const [open,       setOpen]       = useState(false);   // Suche fokussiert/aktiv
  const [query,      setQuery]      = useState("");
  const [typeFilter, setTypeFilter] = useState(null);    // null | "work" | "experience"
  const [showKi,     setShowKi]     = useState(false);

  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const kiRef    = useRef(null);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_search_history")||"[]"); }
    catch { return []; }
  });

  // Debounce 150-200ms (Vorgabe Lars, Search Experience 2.0) -- vorher 250ms.
  // UI-Reaktionen (Discovery ein/ausblenden, Eingabefeld) bleiben INSTANT und
  // nutzen die rohe `query` -- nur der teure Feed-Refetch wartet auf den
  // debouncten Wert.
  const debouncedQuery = useDebounce(query, 180);

  // Suchstatus nach oben melden (Home.jsx -> UnifiedFeed). Der Feed entscheidet
  // selbst, welche Inhalte er anzeigt (Query/Filter sind nur Parameter).
  useEffect(() => {
    onSearchStateChange?.({ query: debouncedQuery, typeFilter, active: open });
  }, [debouncedQuery, typeFilter, open]); // eslint-disable-line

  // Verlauf speichern, sobald ein Suchbegriff kurz stabil war (kein Spam pro Tastendruck)
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    const t = setTimeout(() => saveHistory(debouncedQuery), 1200);
    return () => clearTimeout(t);
  }, [debouncedQuery]); // eslint-disable-line

  // Placeholder-Rotation (nur wenn nicht aktiv)
  const PH = ["Menschen, Werke oder Erlebnisse","Menschen finden","Werke entdecken","Projekte erkunden"];
  const [phIdx,setPhIdx] = useState(0);
  const [phVis,setPhVis] = useState(true);
  useEffect(()=>{
    if(open)return;
    const t=setInterval(()=>{
      setPhVis(false);
      setTimeout(()=>{ setPhIdx(i=>(i+1)%PH.length); setPhVis(true); },290);
    },3800);
    return()=>clearInterval(t);
  },[open]);

  // Click-Outside beendet den aktiven Suchzustand (kein Portal mehr zu schliessen --
  // einfach open=false, Feed faellt automatisch auf den Normalzustand zurueck)
  useEffect(()=>{
    if(!open)return;
    function h(e){
      if(!wrapRef.current?.contains(e.target)&&!kiRef.current?.contains(e.target)) close_();
    }
    document.addEventListener("mousedown",h);
    document.addEventListener("touchstart",h,{passive:true});
    return()=>{ document.removeEventListener("mousedown",h); document.removeEventListener("touchstart",h); };
  },[open]);

  // Escape beendet den aktiven Suchzustand
  useEffect(()=>{
    function h(e){
      if(e.key!=="Escape")return;
      if(showKi){setShowKi(false);return;}
      close_();
    }
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[showKi]);

  const mc  = activeMood?.color || "#0EC4B8";
  const has = !!activeMood;

  function open_(){
    setOpen(true);
    setTimeout(()=>inputRef.current?.focus(), 60);
  }
  function close_(){
    setOpen(false);
    setShowKi(false);
    inputRef.current?.blur();
    // Bewusst: Suchtext bleibt erhalten -- erneutes Antippen der Bar zeigt
    // sofort wieder dieselben gefilterten Ergebnisse (kein Datenverlust).
  }
  function clearQuery(){
    setQuery("");
    inputRef.current?.focus();
  }
  function saveHistory(q){ if(!q.trim())return; const n=[q,...history.filter(h=>h!==q)].slice(0,8); setHistory(n); try{localStorage.setItem("hui_search_history",JSON.stringify(n));}catch{} }
  function handleTheme(label){ setQuery(label); inputRef.current?.focus(); }
  function handleHistory(q){ setQuery(q); inputRef.current?.focus(); }
  function handleKiSelect(text){ setQuery(text); setShowKi(false); inputRef.current?.focus(); }
  function toggleFilter(f){
    if (f === "profile") {
      // Siehe Kommentar am Dateikopf: Personensuche im Feed nicht moeglich (kein Feed-Kartentyp).
      toast.info("Personensuche im Feed kommt bald — aktuell zeigt der Feed Werke, Erlebnisse & Beiträge.");
      return;
    }
    setTypeFilter(prev => prev===f ? null : f);
  }

  const showCategoriesAndHistory = open && !query.trim();
  const showFilters              = open; // Filter bleiben sichtbar, auch waehrend Live-Search

  // ── SEARCH-BAR (identisch Desktop + Mobile, unveraendert aus Premium-Finetuning) ──
  const searchBar = (
    <div onClick={open_} style={{
      display:"flex", alignItems:"center", gap:8, height:33,
      background: has ? `linear-gradient(135deg,${mc}10,rgba(255,251,248,0.96))` : "rgba(255,255,255,0.90)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
      borderRadius: open ? "13px 13px 0 0" : 999,
      border:`1px solid ${open ? T.teal : has ? mc+"38" : "rgba(22,215,197,0.20)"}`,
      borderBottom: open ? "1px solid rgba(14,196,184,0.08)" : undefined,
      boxShadow: open ? "none" : "0 1px 8px rgba(0,0,0,0.04)",
      padding:"0 9px 0 12px", cursor:"text",
      transition:"border-radius .18s ease, border-color .18s, box-shadow .18s",
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:open?.65:.34}}>
        <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="1.8"/>
        <path d="M20 20L16.5 16.5" stroke={T.teal} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <div style={{flex:1,position:"relative",height:33,display:"flex",alignItems:"center"}}>
        <input ref={inputRef} className="dc-input"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          onFocus={open_}
        />
        {!query && !open && (
          <span style={{position:"absolute",left:0,pointerEvents:"none",fontSize:13,fontWeight:500,color:has?`${mc}80`:"rgba(130,130,130,0.55)",opacity:phVis?1:0,transform:phVis?"translateY(0)":"translateY(4px)",transition:"opacity .28s ease, transform .28s ease",whiteSpace:"nowrap",overflow:"hidden",maxWidth:"100%"}}>{PH[phIdx]}</span>
        )}
        {open && !query && (
          <span style={{position:"absolute",left:0,pointerEvents:"none",fontSize:13,fontWeight:400,color:"rgba(26,53,48,0.24)",whiteSpace:"nowrap"}}>Was möchtest du bewirken?</span>
        )}
      </div>
      {query && (
        <button onClick={e=>{e.stopPropagation();clearQuery();}} style={{flexShrink:0,width:16,height:16,borderRadius:"50%",background:"rgba(0,0,0,0.09)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"rgba(60,60,60,0.60)",fontWeight:700}}>✕</button>
      )}
      <div ref={kiRef} style={{position:"relative",flexShrink:0}}>
        <button onClick={e=>{e.stopPropagation();open_();setShowKi(p=>!p);}} style={{display:"flex",alignItems:"center",gap:2,background:showKi?T.teal:"rgba(14,196,184,0.08)",border:"none",borderRadius:99,padding:"3px 8px",cursor:"pointer",transition:"all .14s ease",WebkitTapHighlightColor:"transparent"}}>
          <span style={{fontSize:8.5}}>✨</span>
          <span style={{fontSize:8.5,fontWeight:700,color:showKi?"white":`${T.teal}CC`}}>KI</span>
        </button>
        {showKi && <KiPanel onSelect={handleKiSelect} onClose={()=>setShowKi(false)}/>}
      </div>
      <div style={{flexShrink:0,padding:"0 1px",opacity:.26,cursor:"pointer"}} onClick={e=>e.stopPropagation()}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="11" rx="3" stroke={T.ink} strokeWidth="1.8"/>
          <path d="M5 10a7 7 0 0014 0" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="12" y1="21" x2="12" y2="17" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );

  // ── DISCOVERY / FILTER-PANEL — inline, normaler DOM-Fluss, kein Portal ──
  const FILTERS = [
    {key:"profile",    label:"Menschen",   emoji:"👥"},
    {key:"work",       label:"Werke",      emoji:"🎨"},
    {key:"experience", label:"Erlebnisse", emoji:"📅"},
  ];

  const discoveryPanel = (open) ? (
    <div style={{
      background:T.bg, borderLeft:`1.5px solid ${T.teal}`, borderRight:`1.5px solid ${T.teal}`,
      borderBottom:`1.5px solid ${T.teal}`, borderRadius:"0 0 14px 14px",
      padding:"12px 14px 14px", overflow:"hidden",
      animation:"hui-search-fade-in .18s ease both",
    }}>
      {/* Kategorien -- horizontal scrollbar, eine Zeile, nur in reiner Discovery */}
      {showCategoriesAndHistory && (
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}} className="dc-scroll">
            {THEMES.map(t=>(
              <button key={t.key} onClick={()=>handleTheme(t.label)} style={{
                display:"flex",alignItems:"center",gap:5,flexShrink:0,
                background:`${t.color}0F`,border:`1px solid ${t.color}30`,
                borderRadius:99,padding:"6px 12px",cursor:"pointer",
                fontSize:12.5,fontWeight:600,color:t.color,whiteSpace:"nowrap",
                WebkitTapHighlightColor:"transparent",
              }}>
                <span style={{fontSize:13}}>{t.emoji}</span>{t.label}
              </button>
            ))}
            <button onClick={clearQuery} style={{
              display:"flex",alignItems:"center",gap:4,flexShrink:0,
              background:"rgba(26,53,48,0.045)",border:"1px solid rgba(26,53,48,0.09)",
              borderRadius:99,padding:"6px 12px",cursor:"pointer",
              fontSize:12.5,fontWeight:600,color:T.inkF,whiteSpace:"nowrap",
              WebkitTapHighlightColor:"transparent",
            }}>Alle Kategorien ➡</button>
          </div>
        </div>
      )}

      {/* Filter -- schlicht, kompakt, bleiben auch waehrend Live-Search sichtbar */}
      {showFilters && (
        <div style={{marginBottom: showCategoriesAndHistory && history.length>0 ? 12 : 0}}>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {FILTERS.map(f=>{
              const activeF = typeFilter===f.key;
              return (
                <button key={f.key} onClick={()=>toggleFilter(f.key)} style={{
                  display:"flex",alignItems:"center",gap:5,
                  background: activeF ? T.teal : "rgba(26,53,48,0.045)",
                  border:`1px solid ${activeF ? T.teal : "rgba(26,53,48,0.09)"}`,
                  borderRadius:99,padding:"6px 12px",cursor:"pointer",
                  fontSize:12.5,fontWeight:600,color: activeF ? "#fff" : T.ink,
                  transition:"background .14s,border-color .14s,color .14s",
                  WebkitTapHighlightColor:"transparent",
                }}>
                  <span style={{fontSize:13}}>{f.emoji}</span>{f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Zuletzt gesucht -- nur in reiner Discovery */}
      {showCategoriesAndHistory && history.length>0 && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <SectionLabel>Zuletzt gesucht</SectionLabel>
            <button onClick={()=>{setHistory([]);localStorage.removeItem("hui_search_history");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:T.inkF,padding:0}}>Löschen</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {history.slice(0,6).map((h,i)=>(
              <button key={i} onClick={()=>handleHistory(h)} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(26,53,48,0.05)",border:"1px solid rgba(26,53,48,0.09)",borderRadius:99,padding:"4px 11px",fontSize:11.5,fontWeight:500,color:T.inkS,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
                <span style={{fontSize:9.5,opacity:.42}}>🕐</span>{h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @keyframes dc-in {
          from { opacity:0; transform:translateY(-8px) scaleY(.97); transform-origin:top center; }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        .dc-input {
          outline:none; border:none; background:none; width:100%;
          font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;
          font-size:14px; font-weight:500; color:#1A3530;
        }
        .dc-input::placeholder { color:rgba(26,53,48,0.28); }
        .dc-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      {/* WRAPPER — Suchleiste bleibt IMMER an Position/Groesse/Hoehe unveraendert
          (Vorgabe Lars). Das Discovery/Filter-Panel waechst darunter im normalen
          Seitenfluss -- kein Overlay, kein Portal, kein Fixed-Positioning mehr. */}
      <div ref={wrapRef} style={{ position:"relative", flex:1, zIndex:300 }}>
        {searchBar}
        {discoveryPanel}
      </div>
    </>
  );
}
