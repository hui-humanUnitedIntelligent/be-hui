// src/components/home/header/SearchCommandCenter.jsx
// HUI Command Center — Intelligente Suche & Discovery
// Ersetzt MatchBar als zentralen Einstiegspunkt der Plattform

import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from "react";
import { supabase } from "../../../lib/supabaseClient.js";

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  coral:    "#E8573A",
  ink:      "#1A3530",
  inkSoft:  "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.32)",
  white:    "#FFFFFF",
  bg:       "rgba(255,251,248,0.98)",
  border:   "rgba(26,53,48,0.07)",
  shadow:   "0 4px 32px rgba(26,53,48,0.13), 0 1px 4px rgba(26,53,48,0.06)",
};

// ── Themen-Chips ──────────────────────────────────────────────
const THEMES = [
  { label:"Nachhaltigkeit", emoji:"🌱", color:"#16A34A", bg:"rgba(22,163,74,0.09)"   },
  { label:"Kunst & Kreativität", emoji:"🎨", color:"#9333EA", bg:"rgba(147,51,234,0.09)" },
  { label:"Musik",           emoji:"🎵", color:"#0EA5E9", bg:"rgba(14,165,233,0.09)"  },
  { label:"Bildung",         emoji:"📚", color:"#D97706", bg:"rgba(217,119,6,0.09)"   },
  { label:"Gemeinschaft",    emoji:"🤝", color:T.teal,    bg:T.tealSoft               },
  { label:"Spiritualität",   emoji:"✨", color:"#E8573A", bg:"rgba(232,87,58,0.09)"   },
];

// ── Debounce Hook ─────────────────────────────────────────────
function useDebounce(value, delay) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

// ── Zeitformat ────────────────────────────────────────────────
function relTime(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)    return "Gerade eben";
  if (diff < 3600)  return `vor ${Math.floor(diff/60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std`;
  return `vor ${Math.floor(diff/86400)} Tagen`;
}

// ── Ergebnis-Item ─────────────────────────────────────────────
function ResultItem({ item, onSelect }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      onClick={() => onSelect?.(item)}
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"8px 10px", borderRadius:12,
        cursor:"pointer", transition:"background .12s ease",
        WebkitTapHighlightColor:"transparent",
      }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(14,196,184,0.07)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}
    >
      {/* Avatar / Icon */}
      <div style={{
        width:36, height:36, borderRadius:item.type==="profile"?"50%":10,
        overflow:"hidden", flexShrink:0,
        background: item.avatar && !imgErr ? "transparent" : T.tealSoft,
        display:"flex", alignItems:"center", justifyContent:"center",
        border:"1px solid rgba(14,196,184,0.15)",
      }}>
        {item.avatar && !imgErr
          ? <img src={item.avatar} alt={item.title} onError={() => setImgErr(true)}
              style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
          : <span style={{ fontSize:16 }}>{item.emoji || "🔍"}</span>
        }
      </div>
      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:13, fontWeight:600, color:T.ink,
          overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
        }}>{item.title}</div>
        {item.sub && (
          <div style={{
            fontSize:11, color:T.inkFaint, fontWeight:400,
            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
          }}>{item.sub}</div>
        )}
      </div>
      {/* Type Badge */}
      <span style={{
        fontSize:9.5, fontWeight:700, color:T.teal,
        background:T.tealSoft, borderRadius:99, padding:"2px 7px",
        flexShrink:0, letterSpacing:".03em",
      }}>{item.typeLabel}</span>
    </div>
  );
}

// ── Live Stats ────────────────────────────────────────────────
function LiveStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const since24h = new Date(Date.now() - 86400000).toISOString();
    const since7d  = new Date(Date.now() - 86400000*7).toISOString();

    Promise.all([
      supabase.from("profiles").select("id",{count:"exact",head:true})
        .gte("created_at", since24h),
      supabase.from("works").select("id",{count:"exact",head:true})
        .gte("created_at", since7d),
      supabase.from("experiences").select("id",{count:"exact",head:true}),
      supabase.from("beitraege").select("id",{count:"exact",head:true})
        .gte("created_at", since24h),
    ]).then(([p,w,e,b]) => {
      setStats({
        people:      p.count ?? 0,
        works:       w.count ?? 0,
        experiences: e.count ?? 0,
        momente:     b.count ?? 0,
      });
    }).catch(() => {});
  }, []);

  const items = [
    { label:"neue Menschen",      value:stats?.people,      emoji:"👥", sub:"in den letzten 24h"     },
    { label:"neue Werke",         value:stats?.works,       emoji:"🎨", sub:"diese Woche"            },
    { label:"aktive Erlebnisse",  value:stats?.experiences, emoji:"📅", sub:"buchbar"                },
    { label:"neue Momente",       value:stats?.momente,     emoji:"🌱", sub:"heute geteilt"          },
  ];

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint, letterSpacing:".06em",
        textTransform:"uppercase", marginBottom:10 }}>
        Gerade aktiv auf HUI
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"7px 10px", borderRadius:11,
            background:"rgba(14,196,184,0.05)",
            border:"1px solid rgba(14,196,184,0.10)",
          }}>
            <div style={{
              width:30, height:30, borderRadius:8, flexShrink:0,
              background:"rgba(14,196,184,0.12)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14,
            }}>{it.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                <span style={{ fontSize:18, fontWeight:900, color:T.teal, letterSpacing:"-0.04em" }}>
                  {stats === null ? "—" : (it.value ?? 0)}
                </span>
                <span style={{ fontSize:11, fontWeight:600, color:T.ink }}>{it.label}</span>
              </div>
              <div style={{ fontSize:10, color:T.inkFaint }}>{it.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recommended Items (personalisiert nach Profil) ────────────
function Recommended({ currentUser }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    // Lade neue Profiles + Experiences für Empfehlungen
    Promise.all([
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,bio,location,impact_eur")
        .neq("id", currentUser.id)
        .order("impact_eur", { ascending:false })
        .limit(3),
      supabase.from("experiences")
        .select("id,title,description,cover_url,location_text,category")
        .eq("status","published")
        .order("created_at", { ascending:false })
        .limit(2),
    ]).then(([pRes, eRes]) => {
      const recs = [];
      (pRes.data||[]).forEach(p => recs.push({
        id: p.id, type:"profile",
        title: p.display_name || p.username || "HUI Mitglied",
        sub: p.bio ? p.bio.slice(0,40)+"…" : p.location,
        avatar: p.avatar_url, emoji:"👤", typeLabel:"Person",
      }));
      (eRes.data||[]).forEach(e => recs.push({
        id: e.id, type:"experience",
        title: e.title,
        sub: e.location_text || e.category,
        avatar: e.cover_url, emoji:"📅", typeLabel:"Erlebnis",
      }));
      setItems(recs);
    }).catch(() => {});
  }, [currentUser?.id]);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint, letterSpacing:".06em", textTransform:"uppercase" }}>
          Für dich empfohlen
        </div>
        <span style={{ fontSize:11, color:T.teal, fontWeight:600, cursor:"pointer" }}>Alles live →</span>
      </div>
      {items.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              height:44, borderRadius:11,
              background:"linear-gradient(90deg,rgba(14,196,184,0.05) 25%,rgba(14,196,184,0.10) 50%,rgba(14,196,184,0.05) 75%)",
              backgroundSize:"200% 100%",
              animation:"hui-skel-shimmer 1.4s ease-in-out infinite",
            }}/>
          ))}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {items.map(item => <ResultItem key={item.id} item={item}/>)}
        </div>
      )}
    </div>
  );
}

// ── useUnifiedSearch Hook ─────────────────────────────────────
function useUnifiedSearch(query) {
  const [results, setResults] = useState({ profiles:[], works:[], experiences:[], momente:[] });
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults({ profiles:[], works:[], experiences:[], momente:[] });
      setLoading(false);
      return;
    }

    // Vorherigen Request abbrechen
    if (abortRef.current) abortRef.current = false;
    const alive = { v: true };
    abortRef.current = alive;

    setLoading(true);
    const q = query.toLowerCase().trim();

    Promise.all([
      // Profiles
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,bio,location,impact_eur")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(5),
      // Works
      supabase.from("works")
        .select("id,title,description,cover_url,category,price,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5),
      // Experiences
      supabase.from("experiences")
        .select("id,title,description,cover_url,category,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,location_text.ilike.%${q}%`)
        .limit(5),
      // Momente/Beiträge
      supabase.from("beitraege")
        .select("id,caption,src,type,created_at")
        .ilike("caption", `%${q}%`)
        .limit(5),
    ]).then(([p, w, e, b]) => {
      if (!alive.v) return;
      setResults({
        profiles: (p.data||[]).map(r => ({
          id:r.id, type:"profile",
          title: r.display_name || r.username || "HUI Mitglied",
          sub: r.bio ? r.bio.slice(0,50) : r.location,
          avatar: r.avatar_url, emoji:"👤", typeLabel:"Person",
        })),
        works: (w.data||[]).map(r => ({
          id:r.id, type:"work",
          title: r.title,
          sub: r.category || r.location_text,
          avatar: r.cover_url, emoji:"🎨", typeLabel:"Werk",
        })),
        experiences: (e.data||[]).map(r => ({
          id:r.id, type:"experience",
          title: r.title,
          sub: r.location_text || r.category,
          avatar: r.cover_url, emoji:"📅", typeLabel:"Erlebnis",
        })),
        momente: (b.data||[]).map(r => ({
          id:r.id, type:"moment",
          title: r.caption || "Moment",
          sub: relTime(r.created_at),
          avatar: r.src, emoji:"📸", typeLabel:"Moment",
        })),
      });
      setLoading(false);
    }).catch(() => {
      if (!alive.v) return;
      setLoading(false);
    });

    return () => { alive.v = false; };
  }, [query]);

  const total = results.profiles.length + results.works.length +
                results.experiences.length + results.momente.length;

  return { results, loading, total };
}

// ── HAUPTKOMPONENTE: SearchCommandCenter ──────────────────────
export default function SearchCommandCenter({ activeMood, currentUser }) {
  const [open,           setOpen]          = useState(false);
  const [query,          setQuery]          = useState("");
  // searchQuery: sofort bei Thema/History, debounced beim Tippen
  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeTheme,    setActiveTheme]    = useState(null);
  const inputRef   = useRef(null);
  const overlayRef = useRef(null);

  // Lokale Suchhistorie
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_search_history")||"[]"); }
    catch { return []; }
  });

  // Tippen → debounced
  const debouncedQuery = useDebounce(query, 250);

  // searchQuery folgt debouncedQuery beim Tippen ODER wird sofort gesetzt
  useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery]);

  const { results, loading, total } = useUnifiedSearch(searchQuery);

  // Placeholder rotierend
  const PLACEHOLDERS = ["Was möchtest du heute bewirken?", "Menschen finden…", "Projekte entdecken…", "Werke erkunden…", "Orte & Räume…"];
  const [phIdx, setPhIdx] = useState(0);
  const [phVis, setPhVis] = useState(true);
  useEffect(() => {
    if (open) return;
    const t = setInterval(() => {
      setPhVis(false);
      setTimeout(() => { setPhIdx(i => (i+1)%PLACEHOLDERS.length); setPhVis(true); }, 300);
    }, 3800);
    return () => clearInterval(t);
  }, [open]);

  // Click outside → close
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        setOpen(false); setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive:true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // ESC → close
  useEffect(() => {
    function handler(e) { if (e.key==="Escape") { setOpen(false); setQuery(""); } }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const mc  = activeMood?.color || "#0EC4B8";
  const has = !!activeMood;

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function handleClose() {
    setOpen(false);
    setQuery("");
    setSearchQuery("");
    setActiveTheme(null);
    inputRef.current?.blur();
  }

  function saveHistory(q) {
    if (!q.trim()) return;
    const next = [q, ...history.filter(h => h !== q)].slice(0,8);
    setHistory(next);
    try { localStorage.setItem("hui_search_history", JSON.stringify(next)); } catch {}
  }

  function handleTheme(theme) {
    const label = theme.label;
    setQuery(label);
    setSearchQuery(label);   // sofort — kein Debounce
    setActiveTheme(label);
    saveHistory(label);
    inputRef.current?.focus();
  }

  function handleHistoryItem(q) {
    setQuery(q);
    setSearchQuery(q);       // sofort — kein Debounce
    setActiveTheme(null);
    inputRef.current?.focus();
  }

  function handleSelect(item) {
    // Thema oder Tipp-Query speichern — was auch immer aktiver war
    const q = searchQuery || query || item.title;
    saveHistory(q);
    handleClose();
  }

  const showResults = searchQuery.trim().length > 0;

  return (
    <>
      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes hui-overlay-in {
          from { opacity:0; transform:translateY(-6px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes hui-skel-shimmer {
          from { background-position:-200% 0; }
          to   { background-position:200% 0; }
        }
        .hui-cmd-overlay {
          animation: hui-overlay-in 0.20s cubic-bezier(.22,1,.36,1) both;
        }
        .hui-cmd-item:hover { background:rgba(14,196,184,0.07); }
        .hui-cmd-input { outline:none; border:none; background:none; width:100%;
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
          font-size:14px; font-weight:500; color:#1A3530; }
        .hui-cmd-input::placeholder { color:rgba(26,53,48,0.35); }
      `}</style>

      {/* ── Backdrop ── */}
      {open && (
        <div style={{
          position:"fixed", inset:0, zIndex:299,
          background:"rgba(26,53,48,0.25)",
          backdropFilter:"blur(2px)",
          WebkitBackdropFilter:"blur(2px)",
          animation:"hui-overlay-in .15s ease both",
        }}/>
      )}

      {/* ── Command Center Wrapper ── */}
      <div ref={overlayRef} style={{ position:"relative", flex:1, zIndex:300 }}>

        {/* ── Bar ── */}
        <div
          onClick={handleOpen}
          style={{
            display:"flex", alignItems:"center", gap:9,
            height:38,
            background: has
              ? `linear-gradient(135deg,${mc}12,rgba(255,251,248,0.96))`
              : "rgba(255,255,255,0.90)",
            backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            borderRadius:999,
            border:`1.5px solid ${open ? T.teal : has ? mc+"42" : "rgba(22,215,197,0.25)"}`,
            boxShadow: open
              ? `0 0 0 3px rgba(14,196,184,0.14), 0 3px 14px rgba(0,0,0,0.06)`
              : has
              ? `0 0 0 3px ${mc}10, 0 3px 14px rgba(0,0,0,0.05)`
              : "0 0 0 2px rgba(14,196,184,0.08), 0 3px 14px rgba(0,0,0,0.05)",
            padding:"0 10px 0 12px",
            cursor:"text",
            transition:"border-color .18s, box-shadow .18s, background .18s",
          }}
        >
          {/* Lupe */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ flexShrink:0, opacity: open ? 0.6 : 0.38 }}>
            <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="2"/>
            <path d="M20 20 L16.5 16.5" stroke={T.teal} strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* Input */}
          <div style={{ flex:1, position:"relative", height:38, display:"flex", alignItems:"center" }}>
            <input
              ref={inputRef}
              className="hui-cmd-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={handleOpen}
              placeholder=""
            />
            {!query && !open && (
              <span style={{
                position:"absolute", left:0, pointerEvents:"none",
                fontSize:13.5, fontWeight:500,
                color: has ? `${mc}80` : "rgba(130,130,130,0.60)",
                opacity: phVis ? 1 : 0,
                transform: phVis ? "translateY(0)" : "translateY(4px)",
                transition:"opacity .3s ease, transform .3s ease",
                whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%",
              }}>
                {PLACEHOLDERS[phIdx]}
              </span>
            )}
            {open && !query && (
              <span style={{
                position:"absolute", left:0, pointerEvents:"none",
                fontSize:13.5, fontWeight:400,
                color:"rgba(26,53,48,0.30)",
                whiteSpace:"nowrap",
              }}>Was möchtest du heute bewirken?</span>
            )}
          </div>

          {/* Clear */}
          {query && (
            <button
              onClick={e => { e.stopPropagation(); setQuery(""); setSearchQuery(""); setActiveTheme(null); inputRef.current?.focus(); }}
              style={{
                flexShrink:0, width:18, height:18, borderRadius:"50%",
                background:"rgba(0,0,0,0.11)", border:"none",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", fontSize:10, color:"rgba(60,60,60,0.65)", fontWeight:700,
              }}>✕</button>
          )}

          {/* KI Button */}
          <div style={{
            flexShrink:0, display:"flex", alignItems:"center", gap:3,
            background:"rgba(14,196,184,0.12)", border:"1px solid rgba(14,196,184,0.22)",
            borderRadius:99, padding:"3px 9px",
            cursor:"pointer", WebkitTapHighlightColor:"transparent",
          }}
            onClick={e => { e.stopPropagation(); handleOpen(); }}
          >
            <span style={{ fontSize:10 }}>✨</span>
            <span style={{ fontSize:10, fontWeight:700, color:T.teal }}>KI</span>
          </div>

          {/* Mic */}
          <div style={{ flexShrink:0, padding:"0 2px", opacity:0.4, cursor:"pointer" }}
            onClick={e => e.stopPropagation()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke={T.ink} strokeWidth="2"/>
              <path d="M5 10a7 7 0 0014 0" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="21" x2="12" y2="17" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* ── Overlay Panel ── */}
        {open && (
          <div className="hui-cmd-overlay" style={{
            position:"absolute", top:"calc(100% + 8px)", left:"50%",
            transform:"translateX(-50%)",
            width:"min(94vw, 780px)",
            background:"rgba(255,252,250,0.98)",
            backdropFilter:"blur(24px) saturate(1.8)",
            WebkitBackdropFilter:"blur(24px) saturate(1.8)",
            borderRadius:20,
            boxShadow:T.shadow,
            border:"1px solid rgba(14,196,184,0.14)",
            overflow:"hidden",
            zIndex:301,
          }}>

            {/* ══ LIVE SEARCH ERGEBNISSE ══ */}
            {showResults ? (
              <div style={{ padding:"14px 14px 16px", maxHeight:"70vh", overflowY:"auto" }}>
                {loading && (
                  <div style={{ textAlign:"center", padding:"20px 0", color:T.inkFaint, fontSize:13 }}>
                    Suche läuft…
                  </div>
                )}
                {!loading && total === 0 && (
                  <div style={{ textAlign:"center", padding:"20px 0" }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>🔍</div>
                    <div style={{ fontSize:13, color:T.inkFaint }}>
                      Keine Ergebnisse für „{searchQuery}"
                    </div>
                  </div>
                )}

                {/* Profiles */}
                {results.profiles.length > 0 && (
                  <ResultGroup title="Menschen" items={results.profiles} onSelect={handleSelect}/>
                )}
                {/* Works */}
                {results.works.length > 0 && (
                  <ResultGroup title="Werke" items={results.works} onSelect={handleSelect}/>
                )}
                {/* Experiences */}
                {results.experiences.length > 0 && (
                  <ResultGroup title="Erlebnisse" items={results.experiences} onSelect={handleSelect}/>
                )}
                {/* Momente */}
                {results.momente.length > 0 && (
                  <ResultGroup title="Momente" items={results.momente} onSelect={handleSelect}/>
                )}
              </div>
            ) : (
              /* ══ DEFAULT OVERLAY ══ */
              <div>
                {/* Desktop: 3-Spalten Layout */}
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"1fr 1fr 1fr",
                  gap:0,
                }}>
                  {/* ── LINKS: Beliebte Themen ── */}
                  <div style={{
                    padding:"18px 16px 16px",
                    borderRight:"1px solid rgba(14,196,184,0.10)",
                  }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint,
                      letterSpacing:".06em", textTransform:"uppercase", marginBottom:12 }}>
                      Beliebte Themen
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {THEMES.map(t => {
                        const isActive = activeTheme === t.label;
                        return (
                          <button key={t.label} onClick={() => handleTheme(t)} style={{
                            display:"flex", alignItems:"center", gap:8,
                            background: isActive ? t.color : t.bg,
                            border:`1.5px solid ${isActive ? t.color : t.color+"22"}`,
                            borderRadius:10, padding:"8px 12px",
                            cursor:"pointer", textAlign:"left",
                            transition:"all .15s ease",
                            WebkitTapHighlightColor:"transparent",
                            boxShadow: isActive ? `0 2px 10px ${t.color}40` : "none",
                            transform: isActive ? "translateX(3px)" : "translateX(0)",
                          }}
                            onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform="translateX(2px)"; }}
                            onMouseLeave={e => { if(!isActive) e.currentTarget.style.transform="translateX(0)"; }}
                          >
                            <span style={{ fontSize:14 }}>{t.emoji}</span>
                            <span style={{
                              fontSize:12.5, fontWeight:700,
                              color: isActive ? "white" : t.color,
                            }}>
                              {t.label}
                            </span>
                            {isActive && (
                              <span style={{
                                marginLeft:"auto", fontSize:9, fontWeight:700,
                                color:"rgba(255,255,255,0.80)",
                              }}>✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── MITTE: Live Stats ── */}
                  <div style={{
                    padding:"18px 16px 16px",
                    borderRight:"1px solid rgba(14,196,184,0.10)",
                  }}>
                    <LiveStats/>
                  </div>

                  {/* ── RECHTS: Empfohlen ── */}
                  <div style={{ padding:"18px 16px 16px" }}>
                    <Recommended currentUser={currentUser}/>
                  </div>
                </div>

                {/* ── UNTEN: Letzte Suchanfragen ── */}
                {history.length > 0 && (
                  <div style={{
                    borderTop:"1px solid rgba(14,196,184,0.10)",
                    padding:"12px 16px 14px",
                  }}>
                    <div style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      marginBottom:9,
                    }}>
                      <span style={{ fontSize:11, fontWeight:700, color:T.inkFaint,
                        letterSpacing:".06em", textTransform:"uppercase" }}>
                        Letzte Suchanfragen
                      </span>
                      <button onClick={() => {
                        setHistory([]);
                        localStorage.removeItem("hui_search_history");
                      }} style={{
                        background:"none", border:"none", cursor:"pointer",
                        fontSize:11, color:T.inkFaint, padding:0,
                      }}>Löschen</button>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {history.slice(0,6).map((h,i) => {
                        const isActive = searchQuery === h;
                        return (
                          <button key={i} onClick={() => handleHistoryItem(h)} style={{
                            display:"flex", alignItems:"center", gap:5,
                            background: isActive ? "rgba(14,196,184,0.12)" : "rgba(26,53,48,0.05)",
                            border: isActive ? "1px solid rgba(14,196,184,0.30)" : "1px solid rgba(26,53,48,0.09)",
                            borderRadius:99, padding:"5px 12px",
                            fontSize:12, fontWeight: isActive ? 700 : 500,
                            color: isActive ? T.teal : T.inkSoft,
                            cursor:"pointer", transition:"all .12s ease",
                            WebkitTapHighlightColor:"transparent",
                          }}
                            onMouseEnter={e => { if(!isActive) e.currentTarget.style.background="rgba(14,196,184,0.09)"; }}
                            onMouseLeave={e => { if(!isActive) e.currentTarget.style.background="rgba(26,53,48,0.05)"; }}
                          >
                            <span style={{ fontSize:10, opacity:0.5 }}>🕐</span>
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Hilfsfunktion: ResultGroup ────────────────────────────────
function ResultGroup({ title, items, onSelect }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{
        fontSize:10.5, fontWeight:700, color:T.inkFaint,
        letterSpacing:".06em", textTransform:"uppercase",
        marginBottom:4, paddingLeft:4,
      }}>{title}</div>
      {items.map(item => <ResultItem key={item.id} item={item} onSelect={onSelect}/>)}
    </div>
  );
}
