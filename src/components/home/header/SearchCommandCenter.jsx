// src/components/home/header/SearchCommandCenter.jsx
// HUI Discovery Center V4 — Intelligentes Eingangstor der HUI-Welt
// Overlay wächst direkt aus der Suchleiste · Bündig · Premium

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient.js";

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.09)",
  tealMid:  "rgba(14,196,184,0.20)",
  ink:      "#1A3530",
  inkSoft:  "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.30)",
  bg:       "rgba(255,252,250,0.99)",
  white:    "#FFFFFF",
  shadow:   "0 12px 48px rgba(26,53,48,0.15), 0 2px 8px rgba(26,53,48,0.06)",
};

// ── Themen mit fixen Farben ───────────────────────────────────
const THEMES = [
  { key:"nachhaltig",  label:"Nachhaltigkeit",    emoji:"🌱", color:"#16A34A", kw:["nachhaltig","natur","umwelt","grün"] },
  { key:"kreativ",     label:"Kreativität",        emoji:"🎨", color:"#9333EA", kw:["kunst","kreativ","design","fotografie"] },
  { key:"musik",       label:"Musik",              emoji:"🎵", color:"#0EA5E9", kw:["musik","musiker","band","konzert","session"] },
  { key:"gemeinschaft",label:"Gemeinschaft",       emoji:"🤝", color:T.teal,   kw:["gemeinschaft","treffen","community","lokal"] },
];

// ── KI-Vorschläge ─────────────────────────────────────────────
const KI_SUGGESTIONS = [
  { text:"Ich suche kreative Menschen",        emoji:"👥" },
  { text:"Projekte in meiner Nähe",            emoji:"📍" },
  { text:"Wer passt zu meinem Profil?",        emoji:"🔮" },
  { text:"Wo kann ich heute helfen?",          emoji:"🤝" },
  { text:"Veranstaltungen die zu mir passen",  emoji:"📅" },
  { text:"Welche Menschen sollte ich kennen?", emoji:"✨" },
];

// ── Greeting-Vorschläge (rotierend) ──────────────────────────
const GREETING_HINTS = [
  { text:"Menschen kennenlernen", emoji:"✨" },
  { text:"Ein Projekt starten",   emoji:"🌱" },
  { text:"Inspiration finden",    emoji:"🎨" },
  { text:"Etwas erleben",         emoji:"📅" },
  { text:"Etwas bewegen",         emoji:"🌍" },
  { text:"Unterstützung erhalten",emoji:"🤝" },
];

// ── Debounce ──────────────────────────────────────────────────
function useDebounce(v, d) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return val;
}

// ── relTime ───────────────────────────────────────────────────
function relTime(ts) {
  if (!ts) return "";
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60)    return "Gerade eben";
  if (s < 3600)  return `vor ${Math.floor(s/60)} Min`;
  if (s < 86400) return `vor ${Math.floor(s/3600)} Std`;
  return `vor ${Math.floor(s/86400)} T`;
}

// ── Avatar ────────────────────────────────────────────────────
function Av({ src, emoji = "👤", size = 36, round = true }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: round ? "50%" : size * 0.28,
      overflow: "hidden", background: T.tealSoft,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid rgba(14,196,184,0.15)",
    }}>
      {src && !err
        ? <img src={src} alt="" onError={() => setErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.44 }}>{emoji}</span>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function Sk({ w, h, r = 8, style: sx }) {
  return <div style={{
    width: w, height: h, borderRadius: r, flexShrink: 0,
    background: "linear-gradient(90deg,rgba(14,196,184,0.06) 25%,rgba(14,196,184,0.13) 50%,rgba(14,196,184,0.06) 75%)",
    backgroundSize: "200% 100%",
    animation: "dc-shimmer 1.5s ease-in-out infinite",
    ...sx,
  }}/>;
}

// ══════════════════════════════════════════════════════════════
// LIVE HUI STREAM — horizontales Band
// ══════════════════════════════════════════════════════════════
function LiveStream() {
  const [items, setItems]   = useState([]);
  const [px,    setPx]      = useState(0);
  const rafRef = useRef(null);
  const pxRef  = useRef(0);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id,display_name,username,avatar_url,created_at")
        .order("created_at", { ascending: false }).limit(4),
      supabase.from("works").select("id,title,cover_url,created_at")
        .order("created_at", { ascending: false }).limit(4),
      supabase.from("experiences").select("id,title,cover_url,location_text,created_at")
        .order("created_at", { ascending: false }).limit(3),
      supabase.from("beitraege").select("id,caption,src,created_at")
        .order("created_at", { ascending: false }).limit(4),
    ]).then(([p, w, e, b]) => {
      const all = [];
      (p.data || []).forEach(r => all.push({
        id: "p" + r.id, emoji: "✨",
        text: `${r.display_name || r.username || "Jemand"} ist HUI beigetreten`,
        time: relTime(r.created_at), avatar: r.avatar_url,
      }));
      (w.data || []).forEach(r => all.push({
        id: "w" + r.id, emoji: "🎨",
        text: `Neues Werk: „${r.title}"`,
        time: relTime(r.created_at), avatar: r.cover_url,
      }));
      (e.data || []).forEach(r => all.push({
        id: "e" + r.id, emoji: "📅",
        text: `${r.title}${r.location_text ? " · " + r.location_text : ""}`,
        time: relTime(r.created_at), avatar: r.cover_url,
      }));
      (b.data || []).forEach(r => all.push({
        id: "b" + r.id, emoji: "🌱",
        text: r.caption ? r.caption.slice(0, 52) + (r.caption.length > 52 ? "…" : "") : "Neuer Moment geteilt",
        time: relTime(r.created_at), avatar: r.src,
      }));
      all.sort(() => Math.random() - 0.5);
      setItems(all.slice(0, 12));
    }).catch(() => {});
  }, []);

  // rAF-Scroll
  useEffect(() => {
    if (items.length === 0) return;
    const ITEM_W = 224 + 10;
    const total  = items.length * ITEM_W;
    function tick() {
      pxRef.current = (pxRef.current + 0.4) % total;
      setPx(pxRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items]);

  if (items.length === 0) return (
    <div style={{ display: "flex", gap: 10 }}>
      {[0,1,2,3].map(i => <Sk key={i} w={224} h={46} r={12}/>)}
    </div>
  );

  const doubled = [...items, ...items];

  return (
    <div style={{
      overflow: "hidden",
      maskImage: "linear-gradient(90deg,transparent,black 4%,black 96%,transparent)",
      WebkitMaskImage: "linear-gradient(90deg,transparent,black 4%,black 96%,transparent)",
    }}>
      <div style={{
        display: "flex", gap: 10,
        transform: `translateX(-${px}px)`,
        willChange: "transform",
      }}>
        {doubled.map((it, i) => (
          <div key={i} style={{
            flexShrink: 0, width: 224,
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(14,196,184,0.06)",
            border: "1px solid rgba(14,196,184,0.12)",
            borderRadius: 12, padding: "7px 10px", cursor: "pointer",
          }}>
            <Av src={it.avatar} emoji={it.emoji} size={26} round={false}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 500, color: T.ink,
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
              }}>{it.text}</div>
              <div style={{ fontSize: 9.5, color: T.inkFaint }}>{it.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// GREETING — Begrüßung mit rotierenden Vorschlägen
// ══════════════════════════════════════════════════════════════
function Greeting({ currentUser }) {
  const [hIdx, setHIdx] = useState(0);
  const [hVis, setHVis] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setHVis(false);
      setTimeout(() => { setHIdx(i => (i + 1) % GREETING_HINTS.length); setHVis(true); }, 280);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const name = currentUser?.display_name || currentUser?.username || null;
  const hint = GREETING_HINTS[hIdx];

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{
          fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-0.03em",
        }}>
          {name ? `Hallo ${name} 👋` : "Willkommen auf HUI 👋"}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 400 }}>
          Was möchtest du heute
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: T.teal,
          opacity: hVis ? 1 : 0,
          transform: hVis ? "translateY(0)" : "translateY(3px)",
          transition: "opacity .25s ease, transform .25s ease",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          {hint.emoji} {hint.text}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// THEMENKARTEN — "Heute entdecken" mit echten Counts
// ══════════════════════════════════════════════════════════════
function ThemeCards({ onThemeClick }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    // Echte Counts pro Kategorie aus Supabase
    Promise.all(
      THEMES.map(t =>
        Promise.all([
          // Menschen die zum Thema passen (bio/dna_tags/skills)
          supabase.from("profiles").select("id", { count: "exact", head: true })
            .or(t.kw.map(k => `bio.ilike.%${k}%`).join(",")),
          // Werke
          supabase.from("works").select("id", { count: "exact", head: true })
            .or(t.kw.map(k => `title.ilike.%${k}%,description.ilike.%${k}%,category.ilike.%${k}%`).join(",")),
          // Erlebnisse
          supabase.from("experiences").select("id", { count: "exact", head: true })
            .or(t.kw.map(k => `title.ilike.%${k}%,description.ilike.%${k}%`).join(",")),
        ]).then(([m, w, e]) => ({
          key: t.key,
          menschen: m.count ?? 0,
          werke:    w.count ?? 0,
          erlebnisse: e.count ?? 0,
        }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { map[r.key] = r; });
      setCounts(map);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{
        fontSize: 10.5, fontWeight: 800, color: T.inkFaint,
        letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 10,
      }}>Heute entdecken</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {THEMES.map(t => {
          const c = counts[t.key] || {};
          const hasData = c.menschen > 0 || c.werke > 0 || c.erlebnisse > 0;
          return (
            <button key={t.key} onClick={() => onThemeClick(t.label)} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: `linear-gradient(135deg,${t.color}0D,${t.color}05)`,
              border: `1.5px solid ${t.color}22`,
              borderRadius: 13, padding: "10px 12px",
              cursor: "pointer", textAlign: "left",
              transition: "all .16s ease",
              WebkitTapHighlightColor: "transparent",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `linear-gradient(135deg,${t.color}18,${t.color}0A)`;
                e.currentTarget.style.transform = "translateX(3px)";
                e.currentTarget.style.borderColor = t.color + "44";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `linear-gradient(135deg,${t.color}0D,${t.color}05)`;
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.borderColor = t.color + "22";
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: t.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>{t.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.color, marginBottom: 3 }}>
                  {t.label}
                </div>
                {hasData ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {c.menschen > 0 && (
                      <span style={{ fontSize: 10, color: T.inkFaint, fontWeight: 500 }}>
                        👥 {c.menschen} Menschen
                      </span>
                    )}
                    {c.werke > 0 && (
                      <span style={{ fontSize: 10, color: T.inkFaint, fontWeight: 500 }}>
                        🎨 {c.werke} Werke
                      </span>
                    )}
                    {c.erlebnisse > 0 && (
                      <span style={{ fontSize: 10, color: T.inkFaint, fontWeight: 500 }}>
                        📅 {c.erlebnisse} Erlebnisse
                      </span>
                    )}
                  </div>
                ) : (
                  <Sk w="60%" h={9} r={5}/>
                )}
              </div>
              <span style={{ fontSize: 13, color: t.color, opacity: 0.5 }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PEOPLE MATCHING — "HUI hat diese Menschen für dich gefunden"
// ══════════════════════════════════════════════════════════════
function PeopleMatching({ currentUser }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lade top People — sortiert nach Impact + Verfügbarkeit
    supabase.from("profiles")
      .select("id,display_name,username,avatar_url,bio,location,impact_eur,dna_tags,talent,is_available")
      .neq("id", currentUser?.id || "00000000-0000-0000-0000-000000000000")
      .order("impact_eur", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setPeople(data || []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [currentUser?.id]);

  // Einfacher Matching-Score (deterministisch aus ID-Hash)
  function matchScore(profile) {
    // Ohne echtes ML: Score aus impact_eur + is_available + pseudo-random basierend auf ID
    const base = 65;
    const impact = Math.min(profile.impact_eur || 0, 500) / 500 * 20;
    const avail  = profile.is_available ? 5 : 0;
    // Pseudo-Variation aus letztem Zeichen der ID
    const variation = (profile.id?.charCodeAt(profile.id.length - 1) || 0) % 10;
    return Math.min(99, Math.round(base + impact + avail + variation));
  }

  // Gemeinsame Tags (aus dna_tags, die ersten 3)
  const USER_TAGS = ["Kunst", "Gemeinschaft", "Bildung", "Natur", "Musik"];

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10,
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: T.inkFaint,
          letterSpacing: ".07em", textTransform: "uppercase" }}>
          HUI hat diese Menschen für dich gefunden
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "center" }}>
              <Sk w={40} h={40} r={99}/>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Sk w="65%" h={11} r={6}/>
                <Sk w="45%" h={9} r={5}/>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {people.map(p => {
            const score = matchScore(p);
            const tags  = (p.dna_tags || []).slice(0, 3).length > 0
              ? (p.dna_tags || []).slice(0, 3)
              : USER_TAGS.slice(0, 2);
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                padding: "8px 8px", borderRadius: 12,
                cursor: "pointer", transition: "background .12s",
                WebkitTapHighlightColor: "transparent",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(14,196,184,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Av src={p.avatar_url} emoji="👤" size={38}/>
                  {/* Match-Badge */}
                  <div style={{
                    position: "absolute", bottom: -3, right: -6,
                    background: score >= 85 ? T.teal : "#D97706",
                    borderRadius: 99, padding: "1px 5px",
                    fontSize: 8.5, fontWeight: 800, color: "white",
                    border: "1.5px solid white",
                    whiteSpace: "nowrap",
                  }}>{score}%</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 1 }}>
                    {p.display_name || p.username || "HUI Mitglied"}
                  </div>
                  {(p.talent || p.bio) && (
                    <div style={{
                      fontSize: 10.5, color: T.inkFaint,
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                      maxWidth: "90%", marginBottom: 4,
                    }}>
                      {p.talent || (p.bio ? p.bio.slice(0, 32) + "…" : "")}
                    </div>
                  )}
                  {/* Gemeinsame Tags */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {tags.slice(0, 3).map((tag, ti) => (
                      <span key={ti} style={{
                        fontSize: 9.5, color: T.teal, fontWeight: 600,
                        background: T.tealSoft, borderRadius: 99, padding: "2px 7px",
                      }}>✓ {tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11.5, color: T.teal, fontWeight: 600,
            padding: "4px 0", textAlign: "left",
          }}>Alle passenden Menschen anzeigen →</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// KI EMPFEHLUNGSKARTE
// ══════════════════════════════════════════════════════════════
function KiRecommendationCard({ currentUser }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Lade Top-Items aus verschiedenen Tabellen
    Promise.all([
      supabase.from("profiles").select("id,display_name,username,avatar_url")
        .order("impact_eur", { ascending: false }).limit(2),
      supabase.from("experiences").select("id,title,cover_url")
        .eq("status", "published").order("created_at", { ascending: false }).limit(2),
      supabase.from("works").select("id,title,cover_url")
        .order("created_at", { ascending: false }).limit(1),
    ]).then(([p, e, w]) => {
      const all = [];
      (p.data || []).forEach(r => all.push({ label: r.display_name || r.username, emoji: "👤", avatar: r.avatar_url }));
      (e.data || []).forEach(r => all.push({ label: r.title, emoji: "📅", avatar: r.cover_url }));
      (w.data || []).forEach(r => all.push({ label: r.title, emoji: "🎨", avatar: r.cover_url }));
      setItems(all.slice(0, 4));
    }).catch(() => {});
  }, [currentUser?.id]);

  // User-Tags aus Profil oder Fallback
  const interests = ["Kreativität", "Gemeinschaft", "Wirkung"];

  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(14,196,184,0.08),rgba(14,196,184,0.03))",
      border: "1.5px solid rgba(14,196,184,0.18)",
      borderRadius: 16, padding: "14px 14px 12px",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>✨</span>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: T.teal, letterSpacing: ".03em" }}>
          HUI Empfehlung
        </span>
      </div>

      <div style={{ fontSize: 10.5, color: T.inkFaint, marginBottom: 6 }}>
        Du interessierst dich für:
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {interests.map((tag, i) => (
          <span key={i} style={{
            fontSize: 10.5, fontWeight: 600,
            background: "rgba(14,196,184,0.13)", color: T.teal,
            borderRadius: 99, padding: "3px 9px",
            border: "1px solid rgba(14,196,184,0.22)",
          }}>{tag}</span>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: T.inkFaint, marginBottom: 7 }}>
        Heute könnten dich interessieren:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.length === 0
          ? [0,1,2,3].map(i => <Sk key={i} w="80%" h={11} r={6}/>)
          : items.map((it, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 7,
              cursor: "pointer", padding: "2px 0",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: "rgba(14,196,184,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, overflow: "hidden",
              }}>
                {it.avatar
                  ? <img src={it.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e => e.target.style.display="none"}/>
                  : it.emoji}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: T.ink }}>• {it.label}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// UNIFIED SEARCH HOOK
// ══════════════════════════════════════════════════════════════
function useUnifiedSearch(query) {
  const [results, setResults]  = useState({ profiles:[], works:[], experiences:[], momente:[] });
  const [loading, setLoading]  = useState(false);
  const aliveRef = useRef({ v: false });

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults({ profiles:[], works:[], experiences:[], momente:[] });
      setLoading(false);
      return;
    }
    aliveRef.current.v = false;
    const alive = { v: true };
    aliveRef.current = alive;
    setLoading(true);
    const q = query.toLowerCase().trim();

    Promise.all([
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,bio,location")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(5),
      supabase.from("works")
        .select("id,title,description,cover_url,category,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5),
      supabase.from("experiences")
        .select("id,title,cover_url,category,location_text")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,location_text.ilike.%${q}%`)
        .limit(5),
      supabase.from("beitraege")
        .select("id,caption,src,created_at")
        .ilike("caption", `%${q}%`)
        .limit(5),
    ]).then(([p, w, e, b]) => {
      if (!alive.v) return;
      setResults({
        profiles:    (p.data||[]).map(r => ({ id:r.id, type:"profile",    title:r.display_name||r.username||"HUI Mitglied", sub:r.bio?r.bio.slice(0,45):r.location, avatar:r.avatar_url, emoji:"👤", typeLabel:"Person" })),
        works:       (w.data||[]).map(r => ({ id:r.id, type:"work",       title:r.title, sub:r.category||r.location_text, avatar:r.cover_url, emoji:"🎨", typeLabel:"Werk" })),
        experiences: (e.data||[]).map(r => ({ id:r.id, type:"experience", title:r.title, sub:r.location_text||r.category, avatar:r.cover_url, emoji:"📅", typeLabel:"Erlebnis" })),
        momente:     (b.data||[]).map(r => ({ id:r.id, type:"moment",     title:r.caption||"Moment", sub:relTime(r.created_at), avatar:r.src, emoji:"📸", typeLabel:"Moment" })),
      });
      setLoading(false);
    }).catch(() => { if (alive.v) setLoading(false); });
  }, [query]);

  const total = results.profiles.length + results.works.length + results.experiences.length + results.momente.length;
  return { results, loading, total };
}

// ── Ergebnis-Spalte (Suchmodus) ───────────────────────────────
function ResultCol({ title, emoji, items, onSelect }) {
  if (!items.length) return null;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: T.inkFaint, letterSpacing: ".07em",
        textTransform: "uppercase", marginBottom: 6, paddingLeft: 2,
        display: "flex", alignItems: "center", gap: 5 }}>
        {emoji} {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map(it => (
          <div key={it.id} onClick={() => onSelect?.(it)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 6px", borderRadius: 10, cursor: "pointer",
            transition: "background .10s", WebkitTapHighlightColor: "transparent",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(14,196,184,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Av src={it.avatar} emoji={it.emoji} size={28} round={it.type==="profile"}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.ink,
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {it.title}
              </div>
              {it.sub && <div style={{ fontSize: 10, color: T.inkFaint,
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {it.sub}
              </div>}
            </div>
          </div>
        ))}
        {items.length === 5 && (
          <button style={{ background:"none",border:"none",cursor:"pointer",
            fontSize:11,color:T.teal,fontWeight:600,padding:"3px 6px",textAlign:"left" }}>
            Alle →
          </button>
        )}
      </div>
    </div>
  );
}

// ── KI Discovery Spalte ───────────────────────────────────────
function KiDiscoveryCol({ query }) {
  const hints = useMemo(() => {
    if (!query) return [];
    return [
      { emoji:"🎯", text:`Menschen die „${query}" lieben` },
      { emoji:"🌍", text:`Projekte: ${query}` },
      { emoji:"📍", text:`${query} in deiner Nähe` },
      { emoji:"💡", text:`${query} — neue Perspektiven` },
    ];
  }, [query]);

  if (!hints.length) return null;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: T.teal, letterSpacing: ".07em",
        textTransform: "uppercase", marginBottom: 6, paddingLeft: 2,
        display: "flex", alignItems: "center", gap: 5 }}>
        ✨ KI Entdeckungen
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {hints.map((h, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 9px", borderRadius: 10, cursor: "pointer",
            background: "linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.03))",
            border: "1px solid rgba(14,196,184,0.12)",
          }}>
            <span style={{ fontSize: 15 }}>{h.emoji}</span>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: T.ink }}>{h.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// KI PANEL (Floating)
// ══════════════════════════════════════════════════════════════
function KiPanel({ onSelect, onClose }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", right: 0,
      width: 255, zIndex: 10,
      background: T.bg,
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderRadius: 16, boxShadow: "0 8px 32px rgba(26,53,48,0.15)",
      border: "1px solid rgba(14,196,184,0.20)",
      overflow: "hidden",
      animation: "dc-in .18s cubic-bezier(.22,1,.36,1) both",
    }}>
      <div style={{ padding:"12px 14px 8px",
        background:"linear-gradient(135deg,rgba(14,196,184,0.08),rgba(14,196,184,0.02))",
        borderBottom:"1px solid rgba(14,196,184,0.10)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.teal, marginBottom:2 }}>
          ✨ HUI KI kann dir helfen…
        </div>
        <div style={{ fontSize:10.5, color:T.inkFaint }}>Wähle einen Vorschlag</div>
      </div>
      <div style={{ padding:"8px 8px 10px" }}>
        {KI_SUGGESTIONS.map((s,i) => (
          <button key={i} onClick={()=>{onSelect(s.text);onClose();}} style={{
            display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",
            padding:"8px 10px",background:"none",border:"none",borderRadius:10,
            cursor:"pointer",WebkitTapHighlightColor:"transparent",
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
  const wrapRef    = useRef(null);   // wraps Bar + Overlay
  const kiRef      = useRef(null);

  // History
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_search_history") || "[]"); }
    catch { return []; }
  });

  // Debounce → searchQuery
  const debounced = useDebounce(query, 250);
  useEffect(() => { setSearchQuery(debounced); }, [debounced]);

  const { results, loading, total } = useUnifiedSearch(searchQuery);

  // Placeholder rotierend
  const PH = ["Was möchtest du heute bewirken?", "Menschen finden…", "Projekte entdecken…", "Werke erkunden…", "Inspiration suchen…"];
  const [phIdx, setPhIdx] = useState(0);
  const [phVis, setPhVis] = useState(true);
  useEffect(() => {
    if (open) return;
    const t = setInterval(() => {
      setPhVis(false);
      setTimeout(() => { setPhIdx(i => (i+1)%PH.length); setPhVis(true); }, 290);
    }, 3800);
    return () => clearInterval(t);
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    function h(e) {
      if (!wrapRef.current?.contains(e.target) && !kiRef.current?.contains(e.target)) {
        setOpen(false); setQuery(""); setShowKi(false);
      }
    }
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [open]);

  // ESC
  useEffect(() => {
    function h(e) {
      if (e.key !== "Escape") return;
      if (showKi) { setShowKi(false); return; }
      setOpen(false); setQuery(""); setSearchQuery(""); setActiveTheme(null);
    }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showKi]);

  const mc  = activeMood?.color || "#0EC4B8";
  const has = !!activeMood;

  function open_() { setOpen(true); setTimeout(() => inputRef.current?.focus(), 60); }

  function close_() {
    setOpen(false); setQuery(""); setSearchQuery("");
    setActiveTheme(null); setShowKi(false);
    inputRef.current?.blur();
  }

  function saveHistory(q) {
    if (!q.trim()) return;
    const next = [q, ...history.filter(h => h !== q)].slice(0, 8);
    setHistory(next);
    try { localStorage.setItem("hui_search_history", JSON.stringify(next)); } catch {}
  }

  function handleTheme(label) {
    setQuery(label); setSearchQuery(label);
    setActiveTheme(label); saveHistory(label);
    setShowKi(false);
    inputRef.current?.focus();
  }

  function handleHistory(q) {
    setQuery(q); setSearchQuery(q);
    setActiveTheme(null); setShowKi(false);
    inputRef.current?.focus();
  }

  function handleKiSelect(text) {
    setQuery(text); setSearchQuery(text); setActiveTheme(null); setShowKi(false);
    inputRef.current?.focus();
  }

  function handleSelect(item) {
    saveHistory(searchQuery || query || item.title);
    close_();
  }

  const showResults = searchQuery.trim().length > 0;

  return (
    <>
      {/* ── Global CSS ── */}
      <style>{`
        @keyframes dc-in {
          from { opacity:0; transform:translateY(-6px) scaleY(0.97); transform-origin:top center; }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes dc-shimmer {
          from { background-position:-200% 0; }
          to   { background-position:200% 0; }
        }
        @keyframes dc-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.45; transform:scale(1.35); }
        }
        .dc-input {
          outline:none; border:none; background:none; width:100%;
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
          font-size:14px; font-weight:500; color:#1A3530;
        }
        .dc-input::placeholder { color:rgba(26,53,48,0.32); }
      `}</style>

      {/* ── Backdrop ── */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 299,
          background: "rgba(26,53,48,0.18)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "dc-in .15s ease both",
        }} onClick={close_}/>
      )}

      {/* ══ WRAPPER — Bar + Overlay zusammen ══
          position:relative → Overlay kann left:0,right:0 bekommen
          und ist damit exakt so breit wie der Wrapper = so breit wie die Bar  */}
      <div ref={wrapRef} style={{ position: "relative", flex: 1, zIndex: 300 }}>

        {/* ── SEARCH BAR ── */}
        <div onClick={open_} style={{
          display: "flex", alignItems: "center", gap: 9, height: 40,
          background: has
            ? `linear-gradient(135deg,${mc}12,rgba(255,251,248,0.96))`
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          borderRadius: open ? "14px 14px 0 0" : 999,
          border: `1.5px solid ${open ? T.teal : has ? mc + "42" : "rgba(22,215,197,0.25)"}`,
          borderBottom: open ? `1.5px solid rgba(14,196,184,0.12)` : undefined,
          boxShadow: open
            ? "none"
            : "0 0 0 2px rgba(14,196,184,0.08), 0 3px 14px rgba(0,0,0,0.05)",
          padding: "0 10px 0 13px", cursor: "text",
          transition: "border-radius .18s ease, border-color .18s, box-shadow .18s",
        }}>

          {/* Lupe */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ flexShrink: 0, opacity: open ? 0.7 : 0.38 }}>
            <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="2"/>
            <path d="M20 20 L16.5 16.5" stroke={T.teal} strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* Input */}
          <div style={{ flex: 1, position: "relative", height: 40, display: "flex", alignItems: "center" }}>
            <input ref={inputRef} className="dc-input"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveTheme(null); }}
              onFocus={open_}
              placeholder=""
            />
            {/* Animierter Placeholder */}
            {!query && !open && (
              <span style={{
                position: "absolute", left: 0, pointerEvents: "none",
                fontSize: 13.5, fontWeight: 500,
                color: has ? `${mc}80` : "rgba(130,130,130,0.58)",
                opacity: phVis ? 1 : 0,
                transform: phVis ? "translateY(0)" : "translateY(4px)",
                transition: "opacity .28s ease, transform .28s ease",
                whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%",
              }}>{PH[phIdx]}</span>
            )}
            {open && !query && (
              <span style={{
                position: "absolute", left: 0, pointerEvents: "none",
                fontSize: 13.5, fontWeight: 400,
                color: "rgba(26,53,48,0.27)", whiteSpace: "nowrap",
              }}>Was möchtest du heute bewirken?</span>
            )}
          </div>

          {/* Clear */}
          {query && (
            <button onClick={e => {
              e.stopPropagation();
              setQuery(""); setSearchQuery(""); setActiveTheme(null);
              inputRef.current?.focus();
            }} style={{
              flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
              background: "rgba(0,0,0,0.11)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 10, color: "rgba(60,60,60,0.65)", fontWeight: 700,
            }}>✕</button>
          )}

          {/* KI */}
          <div ref={kiRef} style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={e => { e.stopPropagation(); open_(); setShowKi(p => !p); }} style={{
              display: "flex", alignItems: "center", gap: 3,
              background: showKi ? T.teal : "rgba(14,196,184,0.12)",
              border: `1px solid ${showKi ? T.teal : "rgba(14,196,184,0.22)"}`,
              borderRadius: 99, padding: "4px 10px",
              cursor: "pointer", transition: "all .15s ease",
              WebkitTapHighlightColor: "transparent",
            }}>
              <span style={{ fontSize: 10 }}>✨</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: showKi ? "white" : T.teal }}>KI</span>
            </button>
            {showKi && <KiPanel onSelect={handleKiSelect} onClose={() => setShowKi(false)}/>}
          </div>

          {/* Mic */}
          <div style={{ flexShrink: 0, padding: "0 2px", opacity: 0.35, cursor: "pointer" }}
            onClick={e => e.stopPropagation()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke={T.ink} strokeWidth="2"/>
              <path d="M5 10a7 7 0 0014 0" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="21" x2="12" y2="17" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* ══ DISCOVERY OVERLAY
            left:0  right:0  → exakt bündig zur Bar (= Wrapper-Breite)
            Keine translateX-Zentrierung mehr — wächst direkt aus der Bar  ══ */}
        {open && (
          <div style={{
            position: "absolute",
            top: "100%",       /* direkt unter der Bar */
            left: 0,
            right: 0,
            zIndex: 301,
            background: T.bg,
            backdropFilter: "blur(28px) saturate(1.9)",
            WebkitBackdropFilter: "blur(28px) saturate(1.9)",
            borderRadius: "0 0 20px 20px",
            border: `1.5px solid ${T.teal}`,
            borderTop: "none",
            boxShadow: T.shadow,
            overflow: "hidden",
            animation: "dc-in .20s cubic-bezier(.22,1,.36,1) both",
          }}>

            {/* ── LIVE STREAM (immer, außer im Suchmodus) ── */}
            {!showResults && (
              <div style={{
                padding: "10px 14px 8px",
                borderBottom: "1px solid rgba(14,196,184,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: T.teal,
                    boxShadow: "0 0 0 2.5px rgba(14,196,184,0.22)",
                    animation: "dc-pulse 2s ease-in-out infinite",
                  }}/>
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.teal, letterSpacing: ".05em" }}>
                    LIVE AUF HUI
                  </span>
                </div>
                <LiveStream/>
              </div>
            )}

            {/* ══ SUCHMODUS ══ */}
            {showResults ? (
              <div style={{ padding: "14px 14px 16px", maxHeight: "72vh", overflowY: "auto" }}>
                {loading ? (
                  <div style={{ padding: "22px 0", textAlign: "center", color: T.inkFaint, fontSize: 13 }}>
                    Suche läuft…
                  </div>
                ) : total === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontSize: 13, color: T.inkFaint }}>
                      Keine Ergebnisse für „{searchQuery}"
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                    <ResultCol title="Menschen"   emoji="👥" items={results.profiles}    onSelect={handleSelect}/>
                    <ResultCol title="Erlebnisse" emoji="📅" items={results.experiences} onSelect={handleSelect}/>
                    <ResultCol title="Werke"      emoji="🎨" items={results.works}       onSelect={handleSelect}/>
                    <KiDiscoveryCol query={searchQuery}/>
                  </div>
                )}
              </div>

            ) : (
              /* ══ DEFAULT OVERLAY ══ */
              <div>
                {/* Begrüßung */}
                <div style={{ padding: "14px 16px 0" }}>
                  <Greeting currentUser={currentUser}/>
                </div>

                {/* 3-Spalten Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 0,
                  padding: "10px 0",
                }}>
                  {/* LINKS — Themenkarten */}
                  <div style={{ padding: "0 14px 14px", borderRight: "1px solid rgba(14,196,184,0.09)" }}>
                    <ThemeCards onThemeClick={handleTheme}/>
                  </div>

                  {/* MITTE — KI Empfehlung + People Matching */}
                  <div style={{ padding: "0 14px 14px", borderRight: "1px solid rgba(14,196,184,0.09)" }}>
                    <KiRecommendationCard currentUser={currentUser}/>
                    {/* Letzte Suchen */}
                    {history.length > 0 && (
                      <div>
                        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                          <span style={{ fontSize:10.5,fontWeight:700,color:T.inkFaint,letterSpacing:".06em",textTransform:"uppercase" }}>
                            Zuletzt gesucht
                          </span>
                          <button onClick={()=>{setHistory([]);localStorage.removeItem("hui_search_history");}}
                            style={{ background:"none",border:"none",cursor:"pointer",fontSize:10.5,color:T.inkFaint,padding:0 }}>
                            Löschen
                          </button>
                        </div>
                        <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                          {history.slice(0,5).map((h,i)=>(
                            <button key={i} onClick={()=>handleHistory(h)} style={{
                              display:"flex",alignItems:"center",gap:4,
                              background:"rgba(26,53,48,0.05)",border:"1px solid rgba(26,53,48,0.09)",
                              borderRadius:99,padding:"4px 11px",
                              fontSize:11.5,fontWeight:500,color:T.inkSoft,
                              cursor:"pointer",WebkitTapHighlightColor:"transparent",
                            }}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.09)"}
                              onMouseLeave={e=>e.currentTarget.style.background="rgba(26,53,48,0.05)"}
                            >
                              <span style={{fontSize:9.5,opacity:0.45}}>🕐</span> {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RECHTS — People Matching */}
                  <div style={{ padding: "0 14px 14px" }}>
                    <PeopleMatching currentUser={currentUser}/>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
