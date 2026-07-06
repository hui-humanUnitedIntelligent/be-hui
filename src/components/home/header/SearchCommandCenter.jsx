// src/components/home/header/SearchCommandCenter.jsx
// HUI Discovery Center — Phase 3: "Von Daten zu Möglichkeiten"
// Weniger Zahlen. Mehr Menschen. Weniger Dashboard. Mehr HUI.
//
// Visual Polish Pass (2026-07-06, Lars) — "Apple/Notion/Linear-Niveau":
// reines Styling-Update, KEINE neue Komponente, KEINE neue Logik. Ziel:
// mehr Weissraum, weichere Bar, monochrome Filter, ruhige Animationen.
// Siehe Kommentar am Anfang der Hauptkomponente fuer Architektur-Details.

import React, { useState, useEffect, useRef } from "react";
import { supabase }              from "../../../lib/supabaseClient.js";
import { toast }                 from "../../../lib/useToast.jsx";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  teal:   "#0EC4B8",
  tealS:  "rgba(14,196,184,0.06)",
  tealM:  "rgba(14,196,184,0.14)",
  ink:    "#1A3530",
  inkS:   "rgba(26,53,48,0.50)",
  inkF:   "rgba(26,53,48,0.28)",
  inkFF:  "rgba(26,53,48,0.18)",   // sehr helle, sekundaere Ebene (Punkt 9)
  bg:     "rgba(255,253,251,0.97)",
  // Bar-Schatten: ruhig im Rest-Zustand, sanfter Glow bei Fokus (Punkt 2)
  shadowRest:  "0 1px 2px rgba(26,53,48,0.04), 0 6px 18px rgba(26,53,48,0.05)",
  shadowFocus: "0 2px 8px rgba(14,196,184,0.12), 0 12px 32px rgba(14,196,184,0.16), 0 0 0 3px rgba(14,196,184,0.09)",
  // Panel-Schatten: schwebt frei, kein harter Rahmen (Punkt 7)
  panelShadow: "0 10px 34px rgba(26,53,48,0.09), 0 2px 10px rgba(26,53,48,0.045)",
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
        fontSize: 10, fontWeight: 700, letterSpacing: ".08em",
        textTransform: "uppercase", color: color || T.inkFF,
      }}>{children}</div>
      {action && (
        <button onClick={onAction} style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize: 10.5, color: T.inkF, fontWeight: 600, padding: 0,
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
      position:"absolute", top:"calc(100% + 8px)", right:0,
      width:264, zIndex:10,
      background:T.bg, backdropFilter:"blur(24px) saturate(1.5)", WebkitBackdropFilter:"blur(24px) saturate(1.5)",
      borderRadius:18, boxShadow:"0 12px 36px rgba(26,53,48,0.14), 0 2px 8px rgba(26,53,48,0.05)",
      border:"1px solid rgba(26,53,48,0.05)", overflow:"hidden",
      animation:"dc-in .2s cubic-bezier(.22,1,.36,1) both",
    }}>
      <div style={{
        padding:"13px 15px 10px",
        background:"linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.015))",
        borderBottom:"1px solid rgba(14,196,184,0.08)",
      }}>
        <div style={{ fontSize:12.5,fontWeight:700,color:T.teal,marginBottom:2,letterSpacing:"-0.01em" }}>
          ✨ HUI KI kann dir helfen…
        </div>
        <div style={{ fontSize:10.5,color:T.inkF }}>Wähle einen Vorschlag</div>
      </div>
      <div style={{ padding:"8px 8px 10px" }}>
        {KI_SUGGESTIONS.map((s,i) => (
          <button key={i} className="dc-tag" onClick={()=>{onSelect(s.text);onClose();}} style={{
            display:"flex",alignItems:"center",gap:9,width:"100%",
            textAlign:"left",padding:"9px 11px",background:"none",border:"none",
            borderRadius:12,cursor:"pointer",WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.07)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}
          >
            <span style={{fontSize:14,flexShrink:0}}>{s.emoji}</span>
            <span style={{fontSize:12.5,fontWeight:500,color:T.ink,letterSpacing:"-0.01em"}}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
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
//                                     als frei schwebendes Panel unter der Bar
//                                     (kein Overlay, kein Portal, aber auch kein
//                                     glued/hard-bordered Anschluss an die Bar --
//                                     Visual Polish Pass) -- Feed-Bereich bleibt leer
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

  // Visual Polish Pass -- Panel-Phase fuer weiches Ein-/Ausblenden statt
  // hartem Mount/Unmount-Sprung (Vorgabe Punkt 8: 180ms Fade beim Verschwinden,
  // keine Sprünge). "hidden" = nicht im DOM, "visible" = normal sichtbar,
  // "leaving" = spielt gerade die Exit-Animation ab, danach -> hidden.
  const [panelPhase, setPanelPhase] = useState("hidden");
  const panelTimerRef = useRef(null);

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

  // Panel-Phase steuern (Visual Polish Pass, Punkt 8: weiche Animationen).
  // Discovery erscheint: 220ms Fade+Translate. Discovery verschwindet: 180ms Fade.
  useEffect(() => {
    clearTimeout(panelTimerRef.current);
    if (open) {
      setPanelPhase("entering");
      panelTimerRef.current = setTimeout(() => setPanelPhase("visible"), 220);
    } else if (panelPhase !== "hidden") {
      setPanelPhase("leaving");
      panelTimerRef.current = setTimeout(() => setPanelPhase("hidden"), 180);
    }
    return () => clearTimeout(panelTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  // ── SEARCH-BAR — Visual Polish Pass: mehr Hoehe, weichere Rundung, kein
  // harter Rahmen, sanfter Glow statt Border bei Fokus (Punkt 2) ──────────
  const searchBar = (
    <div onClick={open_} style={{
      display:"flex", alignItems:"center", gap:10, height:44,
      background: has ? `linear-gradient(135deg,${mc}12,rgba(255,253,251,0.95))` : "rgba(255,255,255,0.90)",
      backdropFilter:"blur(18px) saturate(1.6)", WebkitBackdropFilter:"blur(18px) saturate(1.6)",
      borderRadius: 22,
      border: `1px solid ${has ? mc+"30" : "rgba(26,53,48,0.055)"}`,
      boxShadow: open ? T.shadowFocus : T.shadowRest,
      padding:"0 10px 0 16px", cursor:"text",
      transition:"box-shadow .32s cubic-bezier(.22,1,.36,1), background .28s ease, border-color .28s ease",
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:open?.7:.36,transition:"opacity .2s ease"}}>
        <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="1.7"/>
        <path d="M20 20L16.5 16.5" stroke={T.teal} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
      <div style={{flex:1,position:"relative",height:44,display:"flex",alignItems:"center"}}>
        <input ref={inputRef} className="dc-input"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          onFocus={open_}
        />
        {!query && !open && (
          <span style={{position:"absolute",left:0,pointerEvents:"none",fontSize:14,fontWeight:450,letterSpacing:"-0.01em",color:has?`${mc}85`:"rgba(26,53,48,0.32)",opacity:phVis?1:0,transform:phVis?"translateY(0)":"translateY(4px)",transition:"opacity .3s ease, transform .3s ease",whiteSpace:"nowrap",overflow:"hidden",maxWidth:"100%"}}>{PH[phIdx]}</span>
        )}
        {open && !query && (
          <span style={{position:"absolute",left:0,pointerEvents:"none",fontSize:14,fontWeight:400,letterSpacing:"-0.01em",color:"rgba(26,53,48,0.26)",whiteSpace:"nowrap"}}>Was möchtest du bewirken?</span>
        )}
      </div>
      {query && (
        <button className="dc-tag" onClick={e=>{e.stopPropagation();clearQuery();}} style={{flexShrink:0,width:18,height:18,borderRadius:"50%",background:"rgba(26,53,48,0.07)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"rgba(26,53,48,0.55)",fontWeight:700}}>✕</button>
      )}
      <div ref={kiRef} style={{position:"relative",flexShrink:0}}>
        <button className="dc-tag" onClick={e=>{e.stopPropagation();open_();setShowKi(p=>!p);}} style={{display:"flex",alignItems:"center",gap:3,background:showKi?T.teal:"rgba(14,196,184,0.07)",border:"none",borderRadius:99,padding:"4px 9px",cursor:"pointer",transition:"background .18s ease",WebkitTapHighlightColor:"transparent"}}>
          <span style={{fontSize:8.5}}>✨</span>
          <span style={{fontSize:8.5,fontWeight:700,color:showKi?"white":`${T.teal}CC`,letterSpacing:".01em"}}>KI</span>
        </button>
        {showKi && <KiPanel onSelect={handleKiSelect} onClose={()=>setShowKi(false)}/>}
      </div>
      <div className="dc-tag" style={{flexShrink:0,padding:"0 2px",opacity:.24,cursor:"pointer"}} onClick={e=>e.stopPropagation()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="11" rx="3" stroke={T.ink} strokeWidth="1.7"/>
          <path d="M5 10a7 7 0 0014 0" stroke={T.ink} strokeWidth="1.7" strokeLinecap="round"/>
          <line x1="12" y1="21" x2="12" y2="17" stroke={T.ink} strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );

  // ── DISCOVERY / FILTER-PANEL — frei schwebendes Panel, kein Portal, kein
  // Glued-Border zur Bar mehr (Punkt 1 + 7: mehr Weissraum, kein harter
  // Uebergang). Weiches Ein-/Ausblenden ueber panelPhase (Punkt 8). ──────────
  const FILTERS = [
    {key:"profile",    label:"Menschen",   emoji:"👥"},
    {key:"work",       label:"Werke",      emoji:"🎨"},
    {key:"experience", label:"Erlebnisse", emoji:"📅"},
  ];

  const panelAnimating = panelPhase === "entering" || panelPhase === "leaving";
  const discoveryPanel = (panelPhase !== "hidden") ? (
    <div style={{
      marginTop: 12,
      background:T.bg,
      backdropFilter:"blur(20px) saturate(1.4)", WebkitBackdropFilter:"blur(20px) saturate(1.4)",
      border:"1px solid rgba(26,53,48,0.045)",
      borderRadius: 20,
      boxShadow: T.panelShadow,
      padding:"20px 18px 22px", overflow:"hidden",
      opacity: panelPhase === "leaving" ? 0 : 1,
      transform: panelPhase === "leaving" ? "translateY(-5px)" : "translateY(0)",
      transition: panelAnimating
        ? (panelPhase === "leaving"
            ? "opacity .18s ease, transform .18s ease"
            : "opacity .22s cubic-bezier(.22,1,.36,1), transform .22s cubic-bezier(.22,1,.36,1)")
        : "none",
    }}>
      {/* Kategorien -- horizontal scrollbar, eine Zeile, nur in reiner Discovery */}
      {showCategoriesAndHistory && (
        <div style={{marginBottom:20, animation:"hui-search-fade-in .22s cubic-bezier(.22,1,.36,1) both"}}>
          <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}} className="dc-scroll">
            {THEMES.map(t=>(
              <button key={t.key} className="dc-tag" onClick={()=>handleTheme(t.label)} style={{
                display:"flex",alignItems:"center",gap:5,flexShrink:0,
                background:`${t.color}0A`,border:`1px solid ${t.color}22`,
                borderRadius:99,padding:"7px 14px",cursor:"pointer",
                fontSize:12,fontWeight:600,letterSpacing:"-0.01em",color:t.color,whiteSpace:"nowrap",
                WebkitTapHighlightColor:"transparent",
              }}>
                <span style={{fontSize:12.5}}>{t.emoji}</span>{t.label}
              </button>
            ))}
            <button className="dc-tag" onClick={clearQuery} style={{
              display:"flex",alignItems:"center",gap:4,flexShrink:0,
              background:"rgba(26,53,48,0.035)",border:"1px solid rgba(26,53,48,0.07)",
              borderRadius:99,padding:"7px 14px",cursor:"pointer",
              fontSize:12,fontWeight:600,letterSpacing:"-0.01em",color:T.inkF,whiteSpace:"nowrap",
              WebkitTapHighlightColor:"transparent",
            }}>Alle Kategorien ➡</button>
          </div>
        </div>
      )}

      {/* Filter -- fast monochrom, nur der aktive Filter erhaelt die HUI-Farbe (Punkt 5) */}
      {showFilters && (
        <div style={{marginBottom: showCategoriesAndHistory && history.length>0 ? 20 : 0}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {FILTERS.map(f=>{
              const activeF = typeFilter===f.key;
              return (
                <button key={f.key} className="dc-tag" onClick={()=>toggleFilter(f.key)} style={{
                  display:"flex",alignItems:"center",gap:5,
                  background: activeF ? T.teal : "rgba(26,53,48,0.035)",
                  border:`1px solid ${activeF ? T.teal : "rgba(26,53,48,0.07)"}`,
                  borderRadius:99,padding:"6px 13px",cursor:"pointer",
                  fontSize:11.5,fontWeight:600,letterSpacing:"-0.01em",
                  color: activeF ? "#fff" : "rgba(26,53,48,0.62)",
                  boxShadow: activeF ? "0 3px 10px rgba(14,196,184,0.26)" : "none",
                  transition:"background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease",
                  WebkitTapHighlightColor:"transparent",
                }}>
                  <span style={{fontSize:12,opacity:activeF?1:.75}}>{f.emoji}</span>{f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Zuletzt gesucht -- kleine dezente Pills, nicht dominant (Punkt 6) */}
      {showCategoriesAndHistory && history.length>0 && (
        <div style={{animation:"hui-search-fade-in .22s cubic-bezier(.22,1,.36,1) both"}}>
          <SectionLabel action="Löschen" onAction={()=>{setHistory([]);localStorage.removeItem("hui_search_history");}}>
            Zuletzt gesucht
          </SectionLabel>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {history.slice(0,6).map((h,i)=>(
              <button key={i} className="dc-tag" onClick={()=>handleHistory(h)} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(26,53,48,0.03)",border:"1px solid rgba(26,53,48,0.055)",borderRadius:99,padding:"4px 10px",fontSize:10.5,fontWeight:500,color:T.inkF,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
                <span style={{fontSize:9,opacity:.38}}>🕐</span>{h}
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
          from { opacity:0; transform:translateY(-6px) scaleY(.97); transform-origin:top center; }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes hui-search-fade-in {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dc-input {
          outline:none; border:none; background:none; width:100%;
          font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;
          font-size:15px; font-weight:500; letter-spacing:-0.01em; color:#1A3530;
        }
        .dc-input::placeholder { color:rgba(26,53,48,0.28); }
        .dc-scroll::-webkit-scrollbar { display:none; }
        /* Premium-Detail (Punkt 10): weiche Scale-Reaktion auf Touch/Klick,
           keine harten Zustaende -- gilt fuer alle Kategorie-/Filter-/Verlaufs-Pills. */
        .dc-tag { transition: transform .13s ease, opacity .13s ease; }
        .dc-tag:active { transform: scale(0.97); opacity: 0.86; }
        @media (hover:hover) {
          .dc-tag:hover { opacity: 0.92; }
        }
      `}</style>

      {/* WRAPPER — Suchleiste bleibt IMMER an Position/Groesse/Hoehe unveraendert
          (Vorgabe Lars). Das Discovery/Filter-Panel schwebt mit eigenem Abstand
          darunter -- kein Overlay, kein Portal, kein Fixed-Positioning, kein
          glued Border (Visual Polish Pass). */}
      <div ref={wrapRef} style={{ position:"relative", flex:1, zIndex:300 }}>
        {searchBar}
        {discoveryPanel}
      </div>
    </>
  );
}
