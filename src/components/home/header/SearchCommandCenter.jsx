// src/components/home/header/SearchCommandCenter.jsx
// HUI Discovery Center V2 — Lebendiges Entdeckungs-, Empfehlungs- & Verbindungszentrum

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabaseClient.js";

// ── Design Tokens ────────────────────────────────────────────
const T = {
  teal:      "#0EC4B8",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  tealGlow:  "rgba(14,196,184,0.18)",
  ink:       "#1A3530",
  inkSoft:   "rgba(26,53,48,0.55)",
  inkFaint:  "rgba(26,53,48,0.32)",
  white:     "#FFFFFF",
  bg:        "rgba(255,251,248,0.98)",
  shadow:    "0 8px 40px rgba(26,53,48,0.14), 0 2px 8px rgba(26,53,48,0.06)",
  radius:    20,
};

// ── Themen-Chips ─────────────────────────────────────────────
const THEMES = [
  { label:"Nachhaltigkeit",    emoji:"🌱", color:"#16A34A", bg:"rgba(22,163,74,0.09)"    },
  { label:"Kunst & Kreativität", emoji:"🎨", color:"#9333EA", bg:"rgba(147,51,234,0.09)" },
  { label:"Musik",             emoji:"🎵", color:"#0EA5E9", bg:"rgba(14,165,233,0.09)"   },
  { label:"Bildung",           emoji:"📚", color:"#D97706", bg:"rgba(217,119,6,0.09)"    },
  { label:"Gemeinschaft",      emoji:"🤝", color:T.teal,    bg:T.tealSoft                },
  { label:"Spiritualität",     emoji:"✨", color:"#E8573A", bg:"rgba(232,87,58,0.09)"    },
];

// ── KI-Vorschläge ─────────────────────────────────────────────
const KI_SUGGESTIONS = [
  { text:"Ich suche kreative Menschen",          emoji:"👥" },
  { text:"Projekte in meiner Nähe",              emoji:"📍" },
  { text:"Wer passt zu meinem Profil?",          emoji:"🔮" },
  { text:"Wo kann ich heute helfen?",            emoji:"🤝" },
  { text:"Veranstaltungen die zu mir passen",    emoji:"📅" },
  { text:"Welche Menschen sollte ich kennenlernen?", emoji:"✨" },
];

// ── Schnellaktionen ───────────────────────────────────────────
const QUICK_ACTIONS = [
  { label:"Menschen kennenlernen", emoji:"🤝", color:"#0EC4B8", bg:"rgba(14,196,184,0.09)" },
  { label:"Projekt starten",       emoji:"🌱", color:"#16A34A", bg:"rgba(22,163,74,0.09)"  },
  { label:"Werk veröffentlichen",  emoji:"🎨", color:"#9333EA", bg:"rgba(147,51,234,0.09)" },
  { label:"Erlebnis erstellen",    emoji:"📅", color:"#0EA5E9", bg:"rgba(14,165,233,0.09)" },
  { label:"Ort empfehlen",         emoji:"📍", color:"#D97706", bg:"rgba(217,119,6,0.09)"  },
];

// ── Empfehlungs-Gründe ────────────────────────────────────────
const REC_REASONS = [
  "Passt zu deinen Interessen",
  "In deiner Nähe aktiv",
  "Von Menschen empfohlen denen du folgst",
  "3 gemeinsame Themen",
  "Neu auf HUI",
  "Viel Impact diese Woche",
];

// ── Debounce Hook ─────────────────────────────────────────────
function useDebounce(v, d) {
  const [val, setVal] = useState(v);
  useEffect(() => { const t = setTimeout(() => setVal(v), d); return () => clearTimeout(t); }, [v, d]);
  return val;
}

// ── Zeit ──────────────────────────────────────────────────────
function relTime(ts) {
  if (!ts) return "";
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60)    return "Gerade eben";
  if (s < 3600)  return `vor ${Math.floor(s/60)} Min`;
  if (s < 86400) return `vor ${Math.floor(s/3600)} Std`;
  return `vor ${Math.floor(s/86400)} T`;
}

// ── Skeleton ──────────────────────────────────────────────────
function Skel({ w, h, r=8 }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:r, flexShrink:0,
      background:"linear-gradient(90deg,rgba(14,196,184,0.06) 25%,rgba(14,196,184,0.13) 50%,rgba(14,196,184,0.06) 75%)",
      backgroundSize:"200% 100%",
      animation:"hui-shimmer 1.5s ease-in-out infinite",
    }}/>
  );
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ src, emoji="👤", size=36, radius }) {
  const [err, setErr] = useState(false);
  const r = radius ?? (size === 36 ? "50%" : 10);
  return (
    <div style={{
      width:size, height:size, borderRadius:r, flexShrink:0,
      overflow:"hidden", background:T.tealSoft,
      display:"flex", alignItems:"center", justifyContent:"center",
      border:"1px solid rgba(14,196,184,0.15)",
    }}>
      {src && !err
        ? <img src={src} alt="" onError={()=>setErr(true)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        : <span style={{fontSize:size*0.45}}>{emoji}</span>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BEREICH 1 — LIVE HUI STREAM
// ══════════════════════════════════════════════════════════════
function LiveStream() {
  const [items, setItems]   = useState([]);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,created_at")
        .order("created_at", { ascending:false })
        .limit(4),
      supabase.from("works")
        .select("id,title,cover_url,created_at,category")
        .eq("status","published")
        .order("created_at", { ascending:false })
        .limit(4),
      supabase.from("experiences")
        .select("id,title,cover_url,date,location_text,created_at")
        .order("created_at", { ascending:false })
        .limit(3),
      supabase.from("beitraege")
        .select("id,caption,src,created_at")
        .order("created_at", { ascending:false })
        .limit(3),
    ]).then(([p, w, e, b]) => {
      const all = [];
      (p.data||[]).forEach(r => all.push({
        id:"p"+r.id, emoji:"✨",
        text:`${r.display_name||r.username||"Jemand"} ist HUI beigetreten`,
        time: relTime(r.created_at), avatar: r.avatar_url,
      }));
      (w.data||[]).forEach(r => all.push({
        id:"w"+r.id, emoji:"🎨",
        text:`Neues Werk: „${r.title}"`,
        time: relTime(r.created_at), avatar: r.cover_url,
      }));
      (e.data||[]).forEach(r => all.push({
        id:"e"+r.id, emoji:"📅",
        text:`Erlebnis: „${r.title}"${r.location_text?" in "+r.location_text:""}`,
        time: relTime(r.created_at), avatar: r.cover_url,
      }));
      (b.data||[]).forEach(r => all.push({
        id:"b"+r.id, emoji:"🌱",
        text: r.caption ? r.caption.slice(0,55)+(r.caption.length>55?"…":"") : "Neuer Moment geteilt",
        time: relTime(r.created_at), avatar: r.src,
      }));
      // Sortiere nach Aktualität (zufällig mischen für Lebendigkeit)
      all.sort(() => Math.random() - 0.5);
      setItems(all.slice(0, 10));
    }).catch(()=>{});
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(() => {
      setOffset(o => o + 1);
    }, 30);
    return () => clearInterval(id);
  }, [items]);

  if (items.length === 0) return null;

  // Duplizieren für Endlosloop
  const doubled = [...items, ...items];
  const ITEM_W  = 240;
  const totalW  = items.length * (ITEM_W + 12);
  const x       = (offset % totalW);

  return (
    <div style={{
      overflow:"hidden", position:"relative",
      maskImage:"linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
      WebkitMaskImage:"linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
    }}>
      <div style={{
        display:"flex", gap:12,
        transform:`translateX(-${x}px)`,
        transition:"none",
        willChange:"transform",
      }}>
        {doubled.map((it, i) => (
          <div key={i} style={{
            flexShrink:0, width:ITEM_W,
            display:"flex", alignItems:"center", gap:8,
            background:"rgba(14,196,184,0.06)",
            border:"1px solid rgba(14,196,184,0.13)",
            borderRadius:12, padding:"7px 10px",
            cursor:"pointer",
          }}>
            <Avatar src={it.avatar} emoji={it.emoji} size={28} radius={8}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:11.5, fontWeight:500, color:T.ink,
                overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
              }}>{it.text}</div>
              <div style={{ fontSize:10, color:T.inkFaint }}>{it.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BEREICH 2 — KI ASSISTENT PANEL
// ══════════════════════════════════════════════════════════════
function KiPanel({ onSelect, onClose }) {
  return (
    <div style={{
      position:"absolute", top:"calc(100% + 6px)", right:0,
      width:260, zIndex:10,
      background:"rgba(255,252,250,0.99)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderRadius:16,
      boxShadow:"0 8px 32px rgba(26,53,48,0.15)",
      border:"1px solid rgba(14,196,184,0.20)",
      overflow:"hidden",
      animation:"hui-overlay-in .18s cubic-bezier(.22,1,.36,1) both",
    }}>
      <div style={{
        padding:"12px 14px 8px",
        background:"linear-gradient(135deg,rgba(14,196,184,0.08),rgba(14,196,184,0.02))",
        borderBottom:"1px solid rgba(14,196,184,0.10)",
      }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.teal, marginBottom:2 }}>
          ✨ HUI KI kann dir helfen…
        </div>
        <div style={{ fontSize:10.5, color:T.inkFaint }}>
          Wähle einen Vorschlag oder stelle eine Frage
        </div>
      </div>
      <div style={{ padding:"8px 8px 10px" }}>
        {KI_SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => { onSelect(s.text); onClose(); }} style={{
            display:"flex", alignItems:"center", gap:8,
            width:"100%", textAlign:"left", padding:"8px 10px",
            background:"none", border:"none", borderRadius:10,
            cursor:"pointer", transition:"background .1s",
            WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(14,196,184,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background="none"}
          >
            <span style={{ fontSize:15, flexShrink:0 }}>{s.emoji}</span>
            <span style={{ fontSize:12, fontWeight:500, color:T.ink }}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BEREICH 3 — DYNAMISCHE EMPFEHLUNGEN
// ══════════════════════════════════════════════════════════════
function DynamicRecommendations({ currentUser }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    Promise.all([
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,bio,location,impact_eur,dna_tags")
        .neq("id", currentUser.id)
        .order("impact_eur", { ascending:false })
        .limit(3),
      supabase.from("experiences")
        .select("id,title,cover_url,location_text,category,date")
        .eq("status","published")
        .order("created_at", { ascending:false })
        .limit(2),
      supabase.from("works")
        .select("id,title,cover_url,category,price")
        .eq("status","published")
        .order("created_at", { ascending:false })
        .limit(2),
    ]).then(([p, e, w]) => {
      const all = [];
      (p.data||[]).forEach((r, i) => all.push({
        id:"p"+r.id, type:"profile",
        title: r.display_name || r.username || "HUI Mitglied",
        sub: r.bio ? r.bio.slice(0,38)+"…" : (r.location || ""),
        avatar: r.avatar_url, emoji:"👤", typeLabel:"Person",
        reason: REC_REASONS[i % REC_REASONS.length],
      }));
      (e.data||[]).forEach((r, i) => all.push({
        id:"e"+r.id, type:"experience",
        title: r.title, sub: r.location_text || r.category,
        avatar: r.cover_url, emoji:"📅", typeLabel:"Erlebnis",
        reason: REC_REASONS[(i+2) % REC_REASONS.length],
      }));
      (w.data||[]).forEach((r, i) => all.push({
        id:"w"+r.id, type:"work",
        title: r.title, sub: r.category,
        avatar: r.cover_url, emoji:"🎨", typeLabel:"Werk",
        reason: REC_REASONS[(i+4) % REC_REASONS.length],
      }));
      // Mischen für Vielfalt
      all.sort(() => Math.random() - 0.45);
      setItems(all.slice(0, 6));
    }).catch(()=>{});
  }, [currentUser?.id]);

  return (
    <div>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10,
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint,
          letterSpacing:".06em", textTransform:"uppercase" }}>
          Für dich interessant
        </div>
        <span style={{ fontSize:11, color:T.teal, fontWeight:600, cursor:"pointer" }}>
          Alles live →
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
              <Skel w={36} h={36} r={99}/>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
                <Skel w="70%" h={11} r={6}/>
                <Skel w="50%" h={9} r={5}/>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display:"flex", alignItems:"center", gap:9,
              padding:"7px 8px", borderRadius:11,
              cursor:"pointer", transition:"background .12s",
              WebkitTapHighlightColor:"transparent",
            }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(14,196,184,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <Avatar src={item.avatar} emoji={item.emoji} size={34}
                radius={item.type==="profile"?"50%":9}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:12.5, fontWeight:600, color:T.ink,
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                }}>{item.title}</div>
                <div style={{
                  fontSize:10, color:T.teal, fontWeight:500, marginTop:1,
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                }}>{item.reason}</div>
              </div>
              <span style={{
                fontSize:9, fontWeight:700, color:T.inkFaint,
                background:"rgba(26,53,48,0.05)",
                borderRadius:99, padding:"2px 6px", flexShrink:0,
              }}>{item.typeLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BEREICH 4 — LIVE STATS (Mitte)
// ══════════════════════════════════════════════════════════════
function LiveStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const since24h = new Date(Date.now() - 86400000).toISOString();
    const since7d  = new Date(Date.now() - 86400000*7).toISOString();
    Promise.all([
      supabase.from("profiles").select("id",{count:"exact",head:true}).gte("created_at",since24h),
      supabase.from("works").select("id",{count:"exact",head:true}).gte("created_at",since7d),
      supabase.from("experiences").select("id",{count:"exact",head:true}),
      supabase.from("beitraege").select("id",{count:"exact",head:true}).gte("created_at",since24h),
    ]).then(([p,w,e,b]) => {
      setStats({ people:p.count??0, works:w.count??0, experiences:e.count??0, momente:b.count??0 });
    }).catch(()=>{});
  }, []);

  const rows = [
    { emoji:"👥", value:stats?.people,      label:"neue Menschen",     sub:"heute beigetreten"    },
    { emoji:"🎨", value:stats?.works,        label:"neue Werke",        sub:"diese Woche"          },
    { emoji:"📅", value:stats?.experiences,  label:"aktive Erlebnisse", sub:"buchbar"              },
    { emoji:"🌱", value:stats?.momente,      label:"neue Momente",      sub:"heute geteilt"        },
  ];

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint,
        letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>
        Gerade aktiv auf HUI
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:9,
            padding:"7px 10px", borderRadius:11,
            background:"rgba(14,196,184,0.05)",
            border:"1px solid rgba(14,196,184,0.09)",
          }}>
            <div style={{
              width:28, height:28, borderRadius:8, flexShrink:0,
              background:"rgba(14,196,184,0.13)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
            }}>{r.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                <span style={{ fontSize:16, fontWeight:900, color:T.teal, letterSpacing:"-0.04em" }}>
                  {stats===null ? "—" : (r.value??0)}
                </span>
                <span style={{ fontSize:11, fontWeight:600, color:T.ink }}>{r.label}</span>
              </div>
              <div style={{ fontSize:9.5, color:T.inkFaint }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BEREICH 5 — SCHNELLAKTIONEN
// ══════════════════════════════════════════════════════════════
function QuickActions({ onAction }) {
  return (
    <div style={{
      borderTop:"1px solid rgba(14,196,184,0.10)",
      padding:"12px 14px 14px",
    }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint,
        letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>
        Schnellaktionen
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {QUICK_ACTIONS.map((a, i) => (
          <button key={i} onClick={() => onAction?.(a.label)} style={{
            display:"flex", alignItems:"center", gap:6,
            background:a.bg, border:`1px solid ${a.color}20`,
            borderRadius:99, padding:"7px 12px",
            cursor:"pointer", transition:"all .14s ease",
            WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = a.bg.replace("0.09","0.17");
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = a.bg;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize:13 }}>{a.emoji}</span>
            <span style={{ fontSize:11.5, fontWeight:600, color:a.color }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BEREICH 6 — SUCHERGEBNISSE (4 Spalten)
// ══════════════════════════════════════════════════════════════
function useUnifiedSearch(query) {
  const [results, setResults] = useState({ profiles:[], works:[], experiences:[], momente:[] });
  const [loading, setLoading] = useState(false);
  const aliveRef = useRef({ v:true });

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults({ profiles:[], works:[], experiences:[], momente:[] });
      setLoading(false);
      return;
    }
    aliveRef.current.v = false;
    const alive = { v:true };
    aliveRef.current = alive;
    setLoading(true);
    const q = query.toLowerCase().trim();

    Promise.all([
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,bio,location,impact_eur")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(5),
      supabase.from("works")
        .select("id,title,description,cover_url,category,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5),
      supabase.from("experiences")
        .select("id,title,description,cover_url,category,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,location_text.ilike.%${q}%`)
        .limit(5),
      supabase.from("beitraege")
        .select("id,caption,src,created_at")
        .ilike("caption",`%${q}%`)
        .limit(5),
    ]).then(([p, w, e, b]) => {
      if (!alive.v) return;
      setResults({
        profiles: (p.data||[]).map(r => ({
          id:r.id, type:"profile",
          title: r.display_name || r.username || "HUI Mitglied",
          sub: r.bio ? r.bio.slice(0,45) : r.location,
          avatar:r.avatar_url, emoji:"👤", typeLabel:"Person",
        })),
        works: (w.data||[]).map(r => ({
          id:r.id, type:"work",
          title:r.title, sub:r.category||r.location_text,
          avatar:r.cover_url, emoji:"🎨", typeLabel:"Werk",
        })),
        experiences: (e.data||[]).map(r => ({
          id:r.id, type:"experience",
          title:r.title, sub:r.location_text||r.category,
          avatar:r.cover_url, emoji:"📅", typeLabel:"Erlebnis",
        })),
        momente: (b.data||[]).map(r => ({
          id:r.id, type:"moment",
          title:r.caption||"Moment", sub:relTime(r.created_at),
          avatar:r.src, emoji:"📸", typeLabel:"Moment",
        })),
      });
      setLoading(false);
    }).catch(() => { if (alive.v) setLoading(false); });
  }, [query]);

  const total = results.profiles.length + results.works.length +
                results.experiences.length + results.momente.length;
  return { results, loading, total };
}

function ResultColumn({ title, emoji, items, onSelect }) {
  if (items.length === 0) return null;
  return (
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{
        fontSize:10, fontWeight:800, color:T.inkFaint,
        letterSpacing:".07em", textTransform:"uppercase",
        marginBottom:6, paddingLeft:4,
        display:"flex", alignItems:"center", gap:5,
      }}>
        <span>{emoji}</span> {title}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
        {items.map(item => (
          <div key={item.id}
            onClick={() => onSelect?.(item)}
            style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"6px 8px", borderRadius:10,
              cursor:"pointer", transition:"background .10s",
              WebkitTapHighlightColor:"transparent",
            }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(14,196,184,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}
          >
            <Avatar src={item.avatar} emoji={item.emoji} size={30}
              radius={item.type==="profile"?"50%":8}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:12, fontWeight:600, color:T.ink,
                overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
              }}>{item.title}</div>
              {item.sub && (
                <div style={{
                  fontSize:10, color:T.inkFaint,
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                }}>{item.sub}</div>
              )}
            </div>
          </div>
        ))}
        {items.length === 5 && (
          <button style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:11, color:T.teal, fontWeight:600,
            padding:"4px 8px", textAlign:"left",
          }}>Alle anzeigen →</button>
        )}
      </div>
    </div>
  );
}

function KiColumn({ query }) {
  // KI-Entdeckungen: intelligente Assoziation basierend auf Suchbegriff
  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const pool = [
      { emoji:"🎯", text:`Menschen die „${query}" lieben` },
      { emoji:"🌍", text:`Projekte rund um ${query}` },
      { emoji:"📍", text:`${query} in deiner Nähe` },
      { emoji:"🤝", text:`Gemeinschaft für ${query}` },
      { emoji:"💡", text:`${query} — neue Perspektiven` },
    ];
    return pool.slice(0,4);
  }, [query]);

  if (suggestions.length === 0) return null;

  return (
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{
        fontSize:10, fontWeight:800, color:T.teal,
        letterSpacing:".07em", textTransform:"uppercase",
        marginBottom:6, paddingLeft:4,
        display:"flex", alignItems:"center", gap:5,
      }}>
        <span>✨</span> KI Entdeckungen
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"8px 10px", borderRadius:10,
            background:"linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.03))",
            border:"1px solid rgba(14,196,184,0.12)",
            cursor:"pointer",
          }}>
            <span style={{ fontSize:16 }}>{s.emoji}</span>
            <span style={{ fontSize:11.5, fontWeight:500, color:T.ink }}>{s.text}</span>
          </div>
        ))}
        <div style={{
          fontSize:10, color:T.inkFaint, padding:"4px 4px 0",
          fontStyle:"italic",
        }}>Das könnte dich interessieren</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HAUPTKOMPONENTE
// ══════════════════════════════════════════════════════════════
export default function SearchCommandCenter({ activeMood, currentUser }) {
  const [open,        setOpen]        = useState(false);
  const [query,       setQuery]       = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState(null);
  const [showKi,      setShowKi]      = useState(false);
  const inputRef   = useRef(null);
  const overlayRef = useRef(null);
  const kiRef      = useRef(null);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_search_history")||"[]"); }
    catch { return []; }
  });

  const debouncedQuery = useDebounce(query, 250);
  useEffect(() => { setSearchQuery(debouncedQuery); }, [debouncedQuery]);

  const { results, loading, total } = useUnifiedSearch(searchQuery);

  // Rotierender Placeholder
  const PH = ["Was möchtest du heute bewirken?","Menschen finden…","Projekte entdecken…","Werke erkunden…","Orte & Räume…"];
  const [phIdx, setPhIdx] = useState(0);
  const [phVis, setPhVis] = useState(true);
  useEffect(() => {
    if (open) return;
    const t = setInterval(() => {
      setPhVis(false);
      setTimeout(() => { setPhIdx(i=>(i+1)%PH.length); setPhVis(true); }, 300);
    }, 3800);
    return () => clearInterval(t);
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    function h(e) {
      const inOverlay = overlayRef.current?.contains(e.target);
      const inKi      = kiRef.current?.contains(e.target);
      if (!inOverlay && !inKi) { setOpen(false); setQuery(""); setShowKi(false); }
    }
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive:true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [open]);

  // ESC
  useEffect(() => {
    function h(e) {
      if (e.key==="Escape") {
        if (showKi) { setShowKi(false); return; }
        setOpen(false); setQuery(""); setSearchQuery(""); setActiveTheme(null);
      }
    }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showKi]);

  const mc  = activeMood?.color || "#0EC4B8";
  const has = !!activeMood;

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function handleClose() {
    setOpen(false); setQuery(""); setSearchQuery("");
    setActiveTheme(null); setShowKi(false);
    inputRef.current?.blur();
  }

  function saveHistory(q) {
    if (!q.trim()) return;
    const next = [q, ...history.filter(h=>h!==q)].slice(0,8);
    setHistory(next);
    try { localStorage.setItem("hui_search_history", JSON.stringify(next)); } catch {}
  }

  function handleTheme(theme) {
    setQuery(theme.label); setSearchQuery(theme.label);
    setActiveTheme(theme.label); saveHistory(theme.label);
    setShowKi(false);
    inputRef.current?.focus();
  }

  function handleHistory(q) {
    setQuery(q); setSearchQuery(q);
    setActiveTheme(null); setShowKi(false);
    inputRef.current?.focus();
  }

  function handleKiSelect(text) {
    setQuery(text); setSearchQuery(text);
    setActiveTheme(null);
    inputRef.current?.focus();
  }

  function handleSelect(item) {
    saveHistory(searchQuery || query || item.title);
    handleClose();
  }

  function handleQuickAction(label) {
    saveHistory(label);
    handleClose();
  }

  const showResults = searchQuery.trim().length > 0;

  return (
    <>
      <style>{`
        @keyframes hui-overlay-in {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes hui-shimmer {
          from { background-position:-200% 0; }
          to   { background-position:200% 0; }
        }
        .hui-cmd-input {
          outline:none; border:none; background:none; width:100%;
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
          font-size:14px; font-weight:500; color:#1A3530;
        }
        .hui-cmd-input::placeholder { color:rgba(26,53,48,0.35); }
      `}</style>

      {/* Backdrop */}
      {open && (
        <div style={{
          position:"fixed", inset:0, zIndex:299,
          background:"rgba(26,53,48,0.22)",
          backdropFilter:"blur(3px)",
          WebkitBackdropFilter:"blur(3px)",
          animation:"hui-overlay-in .15s ease both",
        }}/>
      )}

      {/* Wrapper */}
      <div ref={overlayRef} style={{ position:"relative", flex:1, zIndex:300 }}>

        {/* ── Search Bar ── */}
        <div onClick={handleOpen} style={{
          display:"flex", alignItems:"center", gap:9, height:38,
          background: has
            ? `linear-gradient(135deg,${mc}12,rgba(255,251,248,0.96))`
            : "rgba(255,255,255,0.90)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          borderRadius:999,
          border:`1.5px solid ${open ? T.teal : has ? mc+"42" : "rgba(22,215,197,0.25)"}`,
          boxShadow: open
            ? `0 0 0 3px rgba(14,196,184,0.15), 0 3px 16px rgba(0,0,0,0.07)`
            : "0 0 0 2px rgba(14,196,184,0.08), 0 3px 14px rgba(0,0,0,0.05)",
          padding:"0 10px 0 12px", cursor:"text",
          transition:"border-color .18s, box-shadow .18s, background .18s",
        }}>
          {/* Lupe */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ flexShrink:0, opacity:open?0.6:0.38 }}>
            <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="2"/>
            <path d="M20 20 L16.5 16.5" stroke={T.teal} strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* Input */}
          <div style={{ flex:1, position:"relative", height:38, display:"flex", alignItems:"center" }}>
            <input
              ref={inputRef}
              className="hui-cmd-input"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveTheme(null); }}
              onFocus={handleOpen}
              placeholder=""
            />
            {!query && !open && (
              <span style={{
                position:"absolute", left:0, pointerEvents:"none",
                fontSize:13.5, fontWeight:500,
                color: has ? `${mc}80` : "rgba(130,130,130,0.60)",
                opacity:phVis?1:0,
                transform:phVis?"translateY(0)":"translateY(4px)",
                transition:"opacity .3s ease, transform .3s ease",
                whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%",
              }}>{PH[phIdx]}</span>
            )}
            {open && !query && (
              <span style={{
                position:"absolute", left:0, pointerEvents:"none",
                fontSize:13.5, fontWeight:400,
                color:"rgba(26,53,48,0.28)", whiteSpace:"nowrap",
              }}>Was möchtest du heute bewirken?</span>
            )}
          </div>

          {/* Clear */}
          {query && (
            <button
              onClick={e=>{e.stopPropagation();setQuery("");setSearchQuery("");setActiveTheme(null);inputRef.current?.focus();}}
              style={{
                flexShrink:0,width:18,height:18,borderRadius:"50%",
                background:"rgba(0,0,0,0.11)",border:"none",
                display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",fontSize:10,color:"rgba(60,60,60,0.65)",fontWeight:700,
              }}>✕</button>
          )}

          {/* KI Button */}
          <div ref={kiRef} style={{ position:"relative", flexShrink:0 }}>
            <button
              onClick={e=>{e.stopPropagation();handleOpen();setShowKi(p=>!p);}}
              style={{
                display:"flex", alignItems:"center", gap:3,
                background: showKi ? T.teal : "rgba(14,196,184,0.12)",
                border:`1px solid ${showKi ? T.teal : "rgba(14,196,184,0.22)"}`,
                borderRadius:99, padding:"4px 9px",
                cursor:"pointer", transition:"all .15s ease",
                WebkitTapHighlightColor:"transparent",
              }}>
              <span style={{ fontSize:10 }}>✨</span>
              <span style={{ fontSize:10, fontWeight:700, color:showKi?"white":T.teal }}>KI</span>
            </button>
            {showKi && (
              <KiPanel
                onSelect={handleKiSelect}
                onClose={() => setShowKi(false)}
              />
            )}
          </div>

          {/* Mic */}
          <div style={{ flexShrink:0, padding:"0 2px", opacity:0.38, cursor:"pointer" }}
            onClick={e=>e.stopPropagation()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke={T.ink} strokeWidth="2"/>
              <path d="M5 10a7 7 0 0014 0" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="21" x2="12" y2="17" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* ── Overlay Panel ── */}
        {open && (
          <div style={{
            position:"absolute", top:"calc(100% + 8px)", left:"50%",
            transform:"translateX(-50%)",
            width:"min(96vw, 840px)",
            background:T.bg,
            backdropFilter:"blur(28px) saturate(1.8)",
            WebkitBackdropFilter:"blur(28px) saturate(1.8)",
            borderRadius:T.radius,
            boxShadow:T.shadow,
            border:"1px solid rgba(14,196,184,0.13)",
            overflow:"hidden",
            zIndex:301,
            animation:"hui-overlay-in .20s cubic-bezier(.22,1,.36,1) both",
          }}>

            {/* ── LIVE STREAM (immer sichtbar) ── */}
            {!showResults && (
              <div style={{
                padding:"12px 14px 8px",
                borderBottom:"1px solid rgba(14,196,184,0.08)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                  <div style={{
                    width:6, height:6, borderRadius:"50%", background:T.teal,
                    boxShadow:`0 0 0 2px rgba(14,196,184,0.25)`,
                    animation:"hui-pulse 2s ease-in-out infinite",
                  }}/>
                  <span style={{ fontSize:10.5, fontWeight:700, color:T.teal, letterSpacing:".04em" }}>
                    LIVE AUF HUI
                  </span>
                </div>
                <LiveStream/>
              </div>
            )}

            {/* ══ SUCHERGEBNISSE (4 Spalten) ══ */}
            {showResults ? (
              <div style={{ padding:"14px 14px 16px", maxHeight:"70vh", overflowY:"auto" }}>
                {loading ? (
                  <div style={{ textAlign:"center", padding:"24px 0", color:T.inkFaint, fontSize:13 }}>
                    Suche läuft…
                  </div>
                ) : total === 0 ? (
                  <div style={{ textAlign:"center", padding:"24px 0" }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>🔍</div>
                    <div style={{ fontSize:13, color:T.inkFaint }}>
                      Keine Ergebnisse für „{searchQuery}"
                    </div>
                    <div style={{ fontSize:11, color:T.inkFaint, marginTop:4 }}>
                      Probiere ein anderes Thema oder einen der Chips unten
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16 }}>
                    <ResultColumn title="Menschen"   emoji="👥" items={results.profiles}    onSelect={handleSelect}/>
                    <ResultColumn title="Erlebnisse" emoji="📅" items={results.experiences} onSelect={handleSelect}/>
                    <ResultColumn title="Werke"      emoji="🎨" items={results.works}       onSelect={handleSelect}/>
                    <KiColumn query={searchQuery}/>
                  </div>
                )}
                {/* Schnellaktionen auch im Suchmodus */}
                <QuickActions onAction={handleQuickAction}/>
              </div>

            ) : (
              /* ══ DEFAULT OVERLAY (kein Query) ══ */
              <>
                <div style={{
                  display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0,
                }}>
                  {/* Links — Themen */}
                  <div style={{ padding:"14px 14px", borderRight:"1px solid rgba(14,196,184,0.09)" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint,
                      letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>
                      Beliebte Themen
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {THEMES.map(t => {
                        const isActive = activeTheme === t.label;
                        return (
                          <button key={t.label} onClick={() => handleTheme(t)} style={{
                            display:"flex", alignItems:"center", gap:8,
                            background: isActive ? t.color : t.bg,
                            border:`1.5px solid ${isActive ? t.color : t.color+"22"}`,
                            borderRadius:10, padding:"7px 11px",
                            cursor:"pointer", textAlign:"left",
                            transition:"all .15s ease",
                            WebkitTapHighlightColor:"transparent",
                            boxShadow: isActive ? `0 2px 10px ${t.color}35` : "none",
                            transform: isActive ? "translateX(3px)" : "translateX(0)",
                          }}
                            onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform="translateX(2px)"; }}
                            onMouseLeave={e => { if(!isActive) e.currentTarget.style.transform="translateX(0)"; }}
                          >
                            <span style={{ fontSize:14 }}>{t.emoji}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:isActive?"white":t.color }}>
                              {t.label}
                            </span>
                            {isActive && <span style={{ marginLeft:"auto", fontSize:10, color:"rgba(255,255,255,0.75)" }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mitte — Live Stats */}
                  <div style={{ padding:"14px 14px", borderRight:"1px solid rgba(14,196,184,0.09)" }}>
                    <LiveStats/>
                  </div>

                  {/* Rechts — Empfehlungen */}
                  <div style={{ padding:"14px 14px" }}>
                    <DynamicRecommendations currentUser={currentUser}/>
                  </div>
                </div>

                {/* Letzte Suchanfragen */}
                {history.length > 0 && (
                  <div style={{
                    borderTop:"1px solid rgba(14,196,184,0.09)",
                    padding:"10px 14px 12px",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:T.inkFaint,
                        letterSpacing:".06em", textTransform:"uppercase" }}>
                        Letzte Suchanfragen
                      </span>
                      <button onClick={()=>{setHistory([]);localStorage.removeItem("hui_search_history");}}
                        style={{ background:"none",border:"none",cursor:"pointer",
                          fontSize:11,color:T.inkFaint,padding:0 }}>
                        Löschen
                      </button>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {history.slice(0,6).map((h, i) => {
                        const isActive = searchQuery === h;
                        return (
                          <button key={i} onClick={() => handleHistory(h)} style={{
                            display:"flex", alignItems:"center", gap:5,
                            background: isActive ? "rgba(14,196,184,0.12)" : "rgba(26,53,48,0.05)",
                            border:`1px solid ${isActive?"rgba(14,196,184,0.30)":"rgba(26,53,48,0.09)"}`,
                            borderRadius:99, padding:"5px 12px",
                            fontSize:12, fontWeight:isActive?700:500,
                            color:isActive?T.teal:T.inkSoft,
                            cursor:"pointer", transition:"all .12s",
                            WebkitTapHighlightColor:"transparent",
                          }}
                            onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(14,196,184,0.09)";}}
                            onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="rgba(26,53,48,0.05)";}}
                          >
                            <span style={{ fontSize:10, opacity:0.5 }}>🕐</span>
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Schnellaktionen */}
                <QuickActions onAction={handleQuickAction}/>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes hui-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(1.3); }
        }
      `}</style>
    </>
  );
}
