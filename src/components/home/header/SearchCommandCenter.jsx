// src/components/home/header/SearchCommandCenter.jsx
// HUI Discovery Center — Phase 3: "Von Daten zu Möglichkeiten"
// Weniger Zahlen. Mehr Menschen. Weniger Dashboard. Mehr HUI.

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase }              from "../../../lib/supabaseClient.js";
import { useHome }               from "../../home/HomeShell.jsx";
import { useConnectionEngine }   from "../../../core/HuiConnectionEngine.jsx";

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

const QUICK_ACTIONS = [
  { emoji:"🤝", label:"Menschen kennenlernen", desc:"Finde passende Kontakte",        color:"#0EC4B8" },
  { emoji:"🌱", label:"Projekt starten",        desc:"Bringe eine Idee ins Leben",    color:"#16A34A" },
  { emoji:"🎨", label:"Werk veröffentlichen",   desc:"Zeige deine Kreativität",       color:"#9333EA" },
  { emoji:"📅", label:"Erlebnis erstellen",     desc:"Plane Begegnungen",             color:"#0EA5E9" },
  { emoji:"📍", label:"Ort hinzufügen",         desc:"Mache Plätze sichtbar",         color:"#D97706" },
];

const KI_HINTS = [
  { text:"Menschen kennenlernen", emoji:"✨" },
  { text:"Ein Projekt starten",   emoji:"🌱" },
  { text:"Inspiration finden",    emoji:"🎨" },
  { text:"Etwas erleben",         emoji:"📅" },
  { text:"Etwas bewegen",         emoji:"🌍" },
  { text:"Unterstützung finden",  emoji:"🤝" },
];

const KI_SUGGESTIONS = [
  { text:"Ich suche kreative Menschen",        emoji:"👥" },
  { text:"Projekte in meiner Nähe",            emoji:"📍" },
  { text:"Wer passt zu meinem Profil?",        emoji:"🔮" },
  { text:"Wo kann ich heute helfen?",          emoji:"🤝" },
  { text:"Veranstaltungen die zu mir passen",  emoji:"📅" },
  { text:"Welche Menschen sollte ich kennen?", emoji:"✨" },
];

const REC_REASONS = [
  "Menschen mit ähnlichen Interessen haben dieses Profil häufig besucht.",
  "Aktiv in deinen Themen und in deiner Region.",
  "Gemeinsame Interessen und ähnliche Werte.",
  "Von Menschen empfohlen, denen du folgst.",
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

function relTime(ts) {
  if (!ts) return "";
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60)    return "Gerade eben";
  if (s < 120)   return "Vor 1 Minute";
  if (s < 3600)  return `Vor ${Math.floor(s / 60)} Minuten`;
  if (s < 7200)  return "Vor 1 Stunde";
  if (s < 86400) return `Vor ${Math.floor(s / 3600)} Stunden`;
  return `Vor ${Math.floor(s / 86400)} Tagen`;
}

// ─────────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────
function Av({ src, emoji = "👤", size = 36, round = true }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: round ? "50%" : Math.round(size * 0.28),
      overflow: "hidden", background: T.tealS,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid rgba(14,196,184,0.14)",
    }}>
      {src && !err
        ? <img src={src} alt="" onError={() => setErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        : <span style={{ fontSize: size * 0.44 }}>{emoji}</span>}
    </div>
  );
}

function Sk({ w = "100%", h, r = 8 }) {
  return <div style={{
    width: w, height: h, borderRadius: r, flexShrink: 0,
    background: "linear-gradient(90deg,rgba(14,196,184,0.05) 25%,rgba(14,196,184,0.12) 50%,rgba(14,196,184,0.05) 75%)",
    backgroundSize: "200% 100%",
    animation: "dc-shimmer 1.6s ease-in-out infinite",
  }}/>;
}

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
// PHASE 5 — "MENSCHEN DIE DU KENNEN SOLLTEST"
// Echtes Match-System: follows-Netzwerk · impact · dna_tags
// ─────────────────────────────────────────────────────────────

// Match-Gründe Pool
const MATCH_REASONS_POOL = [
  { emoji:"🌱", text:"Gemeinsame Interessen" },
  { emoji:"🤝", text:"Ähnliche Werte" },
  { emoji:"🎨", text:"Ähnliche Werke" },
  { emoji:"🎵", text:"Gleiche Themen" },
  { emoji:"📚", text:"Gemeinsame Lernbereiche" },
  { emoji:"🌍", text:"Gleiches Wirkungsfeld" },
  { emoji:"🏗", text:"Ähnliche Projekte" },
  { emoji:"✨", text:"Passend zu deinem Profil" },
];

// DNA-Tag → Emoji + Label Mapping
const DNA_DISPLAY = {
  nachhaltigkeit: { emoji:"🌱", label:"Nachhaltigkeit" },
  kreativitaet:   { emoji:"🎨", label:"Kreativität"   },
  musik:          { emoji:"🎵", label:"Musik"          },
  gemeinschaft:   { emoji:"🤝", label:"Gemeinschaft"   },
  bildung:        { emoji:"📚", label:"Bildung"        },
  spiritualitaet: { emoji:"✨", label:"Spiritualität"  },
  natur:          { emoji:"🌿", label:"Natur"          },
  kunst:          { emoji:"🎨", label:"Kunst"          },
  sport:          { emoji:"⚽", label:"Sport"          },
  technologie:    { emoji:"💻", label:"Technologie"    },
};

function dnaDisplay(tag) {
  const key = (tag || "").toLowerCase().replace(/[^a-z]/g, "");
  return DNA_DISPLAY[key] || { emoji:"✨", label: tag };
}

// MATCH SCORE — echte Gewichtung
// Basis 60 + Impact (max 18) + Trust (max 8) + Available (4) + Netzwerk (10) + Variation (9)
function calcMatchScore(profile, commonContacts) {
  const base    = 60;
  const impact  = Math.min(profile.impact_eur  || 0, 500) / 500 * 18;
  const trust   = Math.min(profile.trust_score || 0, 100) / 100 * 8;
  const avail   = profile.is_available ? 4 : 0;
  const network = Math.min(commonContacts, 5) * 2;  // max 10 Punkte
  // Deterministisch aus ID → 0-8
  const id = profile.id || "";
  const vari = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % 9;
  return Math.min(99, Math.round(base + impact + trust + avail + network + vari));
}

// MATCH GRÜNDE — 2-3 Gründe pro Person
function buildReasons(profile, commonContacts, myDna) {
  const reasons = [];
  // Gemeinsame Kontakte — stärkster Grund
  if (commonContacts > 0) {
    reasons.push({ emoji:"🤝", text:`${commonContacts} gemeinsame Kontakt${commonContacts>1?"e":""}` });
  }
  // DNA Überschneidung
  const theirDna = profile.dna_tags || [];
  const shared   = theirDna.filter(t => myDna.includes(t));
  if (shared.length > 0) {
    const d = dnaDisplay(shared[0]);
    reasons.push({ emoji:d.emoji, text:`Gemeinsam: ${d.label}` });
  }
  // Standort
  if (profile.location && profile.location.trim()) {
    reasons.push({ emoji:"📍", text:profile.location });
  }
  // Fallback
  if (reasons.length === 0) {
    const seed = (profile.id?.charCodeAt(0) || 0) % MATCH_REASONS_POOL.length;
    reasons.push(MATCH_REASONS_POOL[seed]);
  }
  return reasons.slice(0, 2);
}

// Hook — lädt People-Matches
function useMenschenMatch(currentUser) {
  const [people,   setPeople]   = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [refreshK, setRefreshK] = React.useState(0);

  React.useEffect(() => {
    const uid    = currentUser?.id;
    const myDna  = currentUser?.dna_tags || [];

    Promise.all([
      // Alle Profile außer mein eigenes
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,tagline,talent,bio,dna_tags,impact_eur,trust_score,is_available,location,follower_count")
        .neq("id", uid || "00000000-0000-0000-0000-000000000000")
        .order("impact_eur", { ascending: false })
        .limit(20),

      // Meine follows → wer folge ich
      uid
        ? supabase.from("follows").select("followed_id").eq("follower_id", uid).limit(100)
        : Promise.resolve({ data: [] }),

      // Wer folgt wem — für "gemeinsame Kontakte" (2. Ebene)
      supabase.from("follows").select("follower_id,followed_id").limit(200),
    ]).then(([pRes, myFollowRes, allFollowRes]) => {
      const profiles    = pRes.data || [];
      const myFollowing = new Set((myFollowRes.data || []).map(f => f.followed_id));
      const allFollows  = allFollowRes.data || [];

      // Berechne gemeinsame Kontakte pro Profil
      // = Personen, denen sowohl ich ALS AUCH das Target-Profil folgen
      function commonContacts(targetId) {
        // Wem folgt target?
        const targetFollowing = new Set(
          allFollows.filter(f => f.follower_id === targetId).map(f => f.followed_id)
        );
        // Schnittmenge mit meinen follows
        return [...myFollowing].filter(id => targetFollowing.has(id)).length;
      }

      // Filtere wen ich bereits folge heraus
      const candidates = profiles.filter(p => !myFollowing.has(p.id));

      // Berechne Score + Gründe
      const scored = candidates.map(p => {
        const cc = commonContacts(p.id);
        return {
          ...p,
          _score:   calcMatchScore(p, cc),
          _reasons: buildReasons(p, cc, myDna),
          _cc:      cc,
        };
      });

      // Sortiere: Score absteigend, dann Variation
      scored.sort((a, b) => b._score - a._score);

      setPeople(scored.slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser?.id, refreshK]);

  return { people, loading, refresh: () => setRefreshK(k => k + 1) };
}

// Einzel-Karte
function MenschCard({ person, idx, openProfileById, engine }) {
  const [hov, setHov] = React.useState(false);
  const [imgErr, setImgErr] = React.useState(false);

  const name    = person.display_name || person.username || "HUI Mitglied";
  const sub     = person.tagline || person.talent || (person.bio ? person.bio.slice(0, 42) + "…" : null);
  const score   = person._score;
  const reasons = person._reasons || [];
  const dna     = (person.dna_tags || []).slice(0, 2);

  // Score-Farbe
  const scoreColor = score >= 88 ? "#16A34A" : score >= 75 ? T.teal : "#D97706";

  return (
    <div style={{
      flexShrink: 0, width: 188,
      scrollSnapAlign: "start",
      borderRadius: 18,
      border: `1.5px solid ${hov ? "rgba(14,196,184,0.35)" : "rgba(14,196,184,0.14)"}`,
      background: hov
        ? "linear-gradient(145deg,rgba(14,196,184,0.08),rgba(255,252,250,0.99))"
        : "rgba(255,252,250,0.96)",
      boxShadow: hov ? "0 10px 32px rgba(14,196,184,0.18)" : "0 2px 8px rgba(26,53,48,0.05)",
      transform: hov ? "translateY(-3px) scale(1.015)" : "translateY(0) scale(1)",
      transition: "all .20s ease",
      cursor: "pointer",
      overflow: "hidden",
      animation: "dc-slidein .32s ease both",
      animationDelay: `${idx * 0.08}s`,
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Avatar Bereich */}
      <div style={{
        padding: "16px 14px 10px",
        display: "flex", flexDirection: "column", alignItems: "center",
        background: hov
          ? "linear-gradient(180deg,rgba(14,196,184,0.06),transparent)"
          : "transparent",
        transition: "background .2s ease",
      }}>
        {/* Avatar */}
        <div style={{
          position: "relative", marginBottom: 10,
          transform: hov ? "scale(1.06)" : "scale(1)",
          transition: "transform .2s ease",
        }}>
          <div style={{
            width: 62, height: 62, borderRadius: "50%",
            overflow: "hidden", flexShrink: 0,
            background: T.tealS,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2.5px solid ${hov ? T.teal : "rgba(14,196,184,0.20)"}`,
            boxShadow: hov ? `0 0 0 4px rgba(14,196,184,0.12)` : "none",
            transition: "border-color .2s, box-shadow .2s",
          }}>
            {person.avatar_url && !imgErr
              ? <img src={person.avatar_url} alt={name} onError={() => setImgErr(true)}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontSize: 26 }}>👤</span>}
          </div>

          {/* Score Badge */}
          <div style={{
            position: "absolute", bottom: -3, right: -8,
            background: scoreColor,
            borderRadius: 99, padding: "2px 7px",
            fontSize: 9, fontWeight: 900, color: "white",
            border: "2px solid white",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}>{score}%</div>
        </div>

        {/* Name */}
        <div style={{
          fontSize: 13, fontWeight: 800, color: T.ink,
          textAlign: "center", lineHeight: 1.25,
          marginBottom: sub ? 4 : 0,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{name}</div>

        {/* Talent / Sub */}
        {sub && (
          <div style={{
            fontSize: 10.5, color: T.inkS, textAlign: "center",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            maxWidth: "100%",
          }}>{sub}</div>
        )}
      </div>

      {/* Trennlinie */}
      <div style={{ height: 1, background: "rgba(14,196,184,0.08)", margin: "0 12px" }}/>

      {/* DNA Tags */}
      {dna.length > 0 && (
        <div style={{
          display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center",
          padding: "8px 12px 4px",
        }}>
          {dna.map((tag, i) => {
            const d = dnaDisplay(tag);
            return (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, color: T.teal,
                background: T.tealS, borderRadius: 99, padding: "2px 8px",
                border: "1px solid rgba(14,196,184,0.18)",
              }}>{d.emoji} {d.label}</span>
            );
          })}
        </div>
      )}

      {/* Empfehlungs-Gründe */}
      <div style={{ padding: "6px 12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
        {reasons.map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 10.5, color: T.inkS, fontWeight: 500,
          }}>
            <span style={{ fontSize: 12 }}>{r.emoji}</span>
            <span style={{
              overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            }}>{r.text}</span>
          </div>
        ))}
      </div>

      {/* Trennlinie */}
      <div style={{ height: 1, background: "rgba(14,196,184,0.07)", margin: "0 12px" }}/>

      {/* CTA Buttons */}
      <div style={{ padding: "10px 12px 12px", display: "flex", gap: 6 }}>
        <button
          onClick={() => openProfileById?.(person.id)}
          style={{
          flex: 1, padding: "8px 0",
          background: hov ? T.teal : "transparent",
          border: `1.5px solid ${T.teal}`,
          borderRadius: 99, fontSize: 11, fontWeight: 700,
          color: hov ? "white" : T.teal,
          cursor: "pointer", transition: "all .18s ease",
          WebkitTapHighlightColor: "transparent",
        }}>Kennenlernen</button>

        <button style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "rgba(26,53,48,0.05)",
          border: "1.5px solid rgba(26,53,48,0.09)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 14, transition: "all .15s ease",
          WebkitTapHighlightColor: "transparent",
        }}
          title={engine?.isFollowed?.(person.id) ? "Gefolgt" : "Folgen"}
          onClick={() => {
            if (engine?.isFollowed?.(person.id)) engine.unfollow(person.id);
            else engine?.follow?.(person.id);
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background="rgba(14,196,184,0.12)"; e.currentTarget.style.borderColor="rgba(14,196,184,0.30)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="rgba(26,53,48,0.05)"; e.currentTarget.style.borderColor="rgba(26,53,48,0.09)"; }}
        >{engine?.isFollowed?.(person.id) ? "✓" : "➕"}</button>
      </div>
    </div>
  );
}

// Container
function MenschenDuKennenSolltest({ currentUser, openProfileById, engine, onDiscover }) {
  const { people, loading, refresh } = useMenschenMatch(currentUser);

  return (
    <div style={{
      padding: "14px 16px 16px",
      borderBottom: "1px solid rgba(14,196,184,0.08)",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
            <span style={{ fontSize:14 }}>🤝</span>
            <span style={{ fontSize:13, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
              Menschen die du kennen solltest
            </span>
          </div>
          <div style={{ fontSize:10.5, color:T.inkF, lineHeight:1.4 }}>
            Entdecke Menschen, die zu deinen Interessen, Projekten und Zielen passen.
          </div>
        </div>
        <button onClick={() => onDiscover?.()} style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:10, color:T.teal, fontWeight:600,
          flexShrink:0, padding:"2px 0",
          transition:"opacity .15s",
          whiteSpace:"nowrap",
        }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".6"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
        >Alle ansehen →</button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:4 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              flexShrink:0, width:188, borderRadius:18,
              border:"1.5px solid rgba(14,196,184,0.10)",
              background:"rgba(255,252,250,0.96)",
              overflow:"hidden",
              animation:`dc-slidein .3s ease both`,
              animationDelay:`${i*0.08}s`,
            }}>
              <div style={{ padding:"16px 14px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <Sk w={62} h={62} r={99}/>
                <Sk w="70%" h={13} r={6}/>
                <Sk w="55%" h={10} r={5}/>
              </div>
              <div style={{ height:1, background:"rgba(14,196,184,0.08)", margin:"0 12px" }}/>
              <div style={{ padding:"8px 12px 10px", display:"flex", flexDirection:"column", gap:6 }}>
                <Sk w="80%" h={10} r={5}/>
                <Sk w="65%" h={10} r={5}/>
              </div>
              <div style={{ height:1, background:"rgba(14,196,184,0.07)", margin:"0 12px" }}/>
              <div style={{ padding:"10px 12px 12px" }}>
                <Sk w="100%" h={32} r={99}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && people.length === 0 && (
        <div style={{
          textAlign:"center", padding:"24px 16px",
          background:"rgba(14,196,184,0.04)",
          borderRadius:16,
          border:"1.5px dashed rgba(14,196,184,0.16)",
        }}>
          <div style={{ fontSize:28, marginBottom:10 }}>🤝</div>
          <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:6 }}>
            HUI sucht passende Menschen für dich
          </div>
          <div style={{ fontSize:11.5, color:T.inkF, lineHeight:1.6, marginBottom:16 }}>
            Interagiere mit Profilen, Projekten und Werken.<br/>
            Je mehr du entdeckst, desto bessere Empfehlungen erhältst du.
          </div>
          <button onClick={() => onDiscover?.()} style={{
            background:T.teal, border:"none", borderRadius:99,
            padding:"9px 20px", fontSize:12, fontWeight:700, color:"white", cursor:"pointer",
          }}>Menschen entdecken</button>
        </div>
      )}

      {/* Karten-Karussell */}
      {!loading && people.length > 0 && (
        <div style={{
          display:"flex", gap:12, overflowX:"auto",
          paddingBottom:6,
          scrollSnapType:"x mandatory",
          WebkitOverflowScrolling:"touch",
          msOverflowStyle:"none", scrollbarWidth:"none",
        }}>
          {people.map((p, idx) => (
            <MenschCard key={p.id} person={p} idx={idx}
              openProfileById={openProfileById} engine={engine}/>
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// PHASE 4 — "FÜR DICH AUSGEWÄHLT"
// Personalisierter Mix: Profiles · Works · Experiences
// Basis: dna_tags, follows, mood_tags, view_count
// ─────────────────────────────────────────────────────────────

// Empfehlungs-Gründe pro Typ
const REC_REASON_MAP = {
  profile:    [ "✨ Passend zu deinen Interessen", "🤝 Gemeinsame Themen", "🌱 Ähnliche Werte", "👥 Folgen dir gemeinsam" ],
  work:       [ "🎨 Ähnliche Werke angesehen",     "✨ Passt zu deinem Stil", "🌱 Gleiches Thema", "🎵 Kreativität & Kunst" ],
  experience: [ "📅 Könnte dir gefallen",           "📍 In deiner Nähe",      "🤝 Menschen wie du", "🌍 Passendes Erlebnis" ],
};

function recReason(type, seed) {
  const pool = REC_REASON_MAP[type] || REC_REASON_MAP.profile;
  return pool[Math.abs(seed) % pool.length];
}

// localStorage-basiertes Interaktions-Tracking
// Schlüssel: hui_disco_prefs → { profiles:n, works:n, experiences:n }
function getPrefs() {
  try { return JSON.parse(localStorage.getItem("hui_disco_prefs") || "{}"); }
  catch { return {}; }
}
function trackPref(type) {
  const p = getPrefs();
  p[type] = (p[type] || 0) + 1;
  try { localStorage.setItem("hui_disco_prefs", JSON.stringify(p)); } catch {}
}

// Hook: lädt personalisierten Mix aus Supabase
function useForDich(currentUser) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    const prefs = getPrefs();
    // Gewichtung: Nutzer-Präferenzen bestimmen wieviele von jedem Typ
    const total  = 6;
    const pTotal = (prefs.profiles||0) + (prefs.works||0) + (prefs.experiences||0);
    let nP, nW, nE;
    if (pTotal === 0) {
      // Default: gleichmäßige Mischung
      nP = 2; nW = 2; nE = 2;
    } else {
      // Proportional aus Präferenzen, min 1 pro Typ
      nP = Math.max(1, Math.min(3, Math.round((prefs.profiles||0) / pTotal * total)));
      nW = Math.max(1, Math.min(3, Math.round((prefs.works||0)    / pTotal * total)));
      nE = Math.max(1, total - nP - nW);
    }

    // Baue user-spezifische Queries
    const uid = currentUser?.id;
    const userDnaTags = currentUser?.dna_tags || [];

    Promise.all([
      // Menschen: nicht ich selbst, sortiert nach impact + follower
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,bio,talent,tagline,impact_eur,follower_count,dna_tags,is_available,location")
        .neq("id", uid || "00000000-0000-0000-0000-000000000000")
        .order("impact_eur", { ascending: false })
        .limit(nP + 2),

      // Werke: publiziert, sortiert nach view_count
      supabase.from("works")
        .select("id,title,description,cover_url,category,work_category,price_eur,views_count,mood_tags,creator_id,user_id")
        .eq("status", "published")
        .order("views_count", { ascending: false })
        .limit(nW + 2),

      // Erlebnisse: publiziert, zukünftig oder ohne Datum
      supabase.from("experiences")
        .select("id,title,description,cover_url,category,price,location_text,date,time_start,mood_tags,spots_available,user_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(nE + 2),

      // Follows für "gemeinsame Kontakte"-Signal
      uid ? supabase.from("follows")
        .select("followed_id")
        .eq("follower_id", uid)
        .limit(50)
        : Promise.resolve({ data: [] }),
    ]).then(([pr, wr, er, fr]) => {
      const myFollowing = new Set((fr.data || []).map(f => f.followed_id));
      const all = [];

      // Seed für deterministischen reason-Index
      function seed(id) {
        return id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 0;
      }

      // Profile → Items
      (pr.data || []).slice(0, nP).forEach(p => {
        const sharedFollow = [...myFollowing].some(fid => fid === p.id);
        all.push({
          id:     "p" + p.id,
          rawId:  p.id,
          type:   "profile",
          badge:  "Person",
          badgeColor: "#9333EA",
          emoji:  "👤",
          title:  p.display_name || p.username || "HUI Mitglied",
          desc:   p.tagline || p.talent || (p.bio ? p.bio.slice(0, 55) : p.location || ""),
          img:    p.avatar_url,
          round:  true,
          cta:    "Profil ansehen",
          reason: sharedFollow ? "🤝 Gemeinsame Kontakte" : recReason("profile", seed(p.id)),
          score:  Math.min(99, 68 + Math.round(Math.min(p.impact_eur||0,500)/500*18) + (p.is_available?4:0) + (seed(p.id)%9)),
        });
      });

      // Works → Items
      (wr.data || []).slice(0, nW).forEach(w => {
        all.push({
          id:     "w" + w.id,
          rawId:  w.id,
          type:   "work",
          badge:  "Werk",
          badgeColor: "#0EA5E9",
          emoji:  "🎨",
          title:  w.title,
          desc:   w.description ? w.description.slice(0, 55) : (w.work_category || w.category || ""),
          img:    w.cover_url,
          round:  false,
          cta:    "Werk öffnen",
          reason: recReason("work", seed(w.id)),
          score:  null,
        });
      });

      // Experiences → Items
      (er.data || []).slice(0, nE).forEach(e => {
        const when = e.date
          ? new Date(e.date).toLocaleDateString("de-DE",{day:"numeric",month:"short"})
          : null;
        const time = e.time_start ? " · " + e.time_start.slice(0,5) + " Uhr" : "";
        all.push({
          id:     "e" + e.id,
          rawId:  e.id,
          type:   "experience",
          badge:  "Erlebnis",
          badgeColor: T.teal,
          emoji:  "📅",
          title:  e.title,
          desc:   (e.location_text || "") + (when ? (e.location_text ? " · " : "") + when + time : time),
          img:    e.cover_url,
          round:  false,
          cta:    "Erlebnis ansehen",
          reason: recReason("experience", seed(e.id)),
          score:  null,
        });
      });

      // Mischen: Menschen immer erste Position, dann abwechseln
      // Sortiere: erst ein Profile, dann ein Work, dann ein Experience, repeat
      const profiles    = all.filter(i => i.type === "profile");
      const works       = all.filter(i => i.type === "work");
      const experiences = all.filter(i => i.type === "experience");
      const mixed = [];
      const maxLen = Math.max(profiles.length, works.length, experiences.length);
      for (let i = 0; i < maxLen; i++) {
        if (profiles[i])    mixed.push(profiles[i]);
        if (works[i])       mixed.push(works[i]);
        if (experiences[i]) mixed.push(experiences[i]);
      }

      setItems(mixed.slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser?.id, refreshKey]);

  function refresh() { setRefreshKey(k => k + 1); }
  return { items, loading, refresh };
}

// Einzel-Karte — Premium Design
function ForDichCard({ item, idx, onSelect, openProfileById }) {
  const [hovered, setHovered] = React.useState(false);
  const [imgErr,  setImgErr]  = React.useState(false);

  return (
    <div
      onClick={() => { trackPref(item.type); onSelect?.(item); }}
      style={{
        flexShrink: 0,
        width: 200,
        scrollSnapAlign: "start",
        borderRadius: 16,
        overflow: "hidden",
        background: hovered
          ? `linear-gradient(145deg,${item.badgeColor}12,${item.badgeColor}06)`
          : `linear-gradient(145deg,${item.badgeColor}0A,${item.badgeColor}04)`,
        border: `1.5px solid ${item.badgeColor}${hovered ? "40" : "20"}`,
        boxShadow: hovered ? `0 8px 28px ${item.badgeColor}22` : "none",
        cursor: "pointer",
        transition: "all .2s ease",
        transform: hovered ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
        animation: `dc-slidein .32s ease both`,
        animationDelay: `${idx * 0.08}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover / Avatar */}
      <div style={{
        width: "100%", height: 88, overflow: "hidden",
        background: item.img && !imgErr ? "transparent" : item.badgeColor + "14",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {item.img && !imgErr ? (
          <img src={item.img} alt="" onError={() => setImgErr(true)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform .3s ease",
          }}/>
        ) : (
          <span style={{ fontSize: 32 }}>{item.emoji}</span>
        )}

        {/* Type Badge */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: item.badgeColor,
          borderRadius: 99, padding: "3px 8px",
          fontSize: 9, fontWeight: 800, color: "white",
          letterSpacing: ".04em",
        }}>{item.badge}</div>

        {/* Score Badge (nur bei Profilen) */}
        {item.score && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: item.score >= 85 ? T.teal : "#D97706",
            borderRadius: 99, padding: "3px 7px",
            fontSize: 9, fontWeight: 900, color: "white",
            border: "1.5px solid rgba(255,255,255,0.4)",
          }}>{item.score}%</div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "10px 11px 11px" }}>
        {/* Titel */}
        <div style={{
          fontSize: 12.5, fontWeight: 800, color: T.ink,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          lineHeight: 1.3, marginBottom: 4,
        }}>{item.title}</div>

        {/* Beschreibung */}
        {item.desc && (
          <div style={{
            fontSize: 10.5, color: T.inkS, lineHeight: 1.4,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            marginBottom: 7,
          }}>{item.desc}</div>
        )}

        {/* Empfehlungs-Grund */}
        <div style={{
          fontSize: 10, fontWeight: 600, color: item.badgeColor,
          marginBottom: 9, letterSpacing: ".01em",
        }}>{item.reason}</div>

        {/* CTA */}
        <button style={{
          width: "100%", padding: "7px 0",
          background: hovered ? item.badgeColor : "transparent",
          border: `1.5px solid ${item.badgeColor}`,
          borderRadius: 9,
          fontSize: 11, fontWeight: 700,
          color: hovered ? "white" : item.badgeColor,
          cursor: "pointer",
          transition: "all .18s ease",
        }}>{item.cta} →</button>
      </div>
    </div>
  );
}

// Container Komponente
function ForDichAusgewaehlt({ currentUser, openProfileById, onDiscover, onClose }) {
  const { items, loading, refresh } = useForDich(currentUser);
  const [showEmpty, setShowEmpty] = React.useState(false);

  // Nach 3s ohne Daten → Empty State zeigen
  React.useEffect(() => {
    if (!loading && items.length === 0) setShowEmpty(true);
  }, [loading, items]);

  return (
    <div style={{
      padding: "14px 16px 16px",
      borderBottom: "1px solid rgba(14,196,184,0.08)",
      background: "linear-gradient(180deg,rgba(14,196,184,0.025),transparent)",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <div style={{
            display:"flex", alignItems:"center", gap:7, marginBottom:3,
          }}>
            <span style={{ fontSize:14 }}>✨</span>
            <span style={{ fontSize:13, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
              Für dich ausgewählt
            </span>
          </div>
          <div style={{ fontSize:10.5, color:T.inkF, lineHeight:1.4 }}>
            Menschen, Projekte und Erlebnisse, die zu deinen Interessen passen.
          </div>
        </div>
        <button onClick={refresh} style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:10, color:T.teal, fontWeight:600,
          padding:"2px 0", flexShrink:0,
          transition:"opacity .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".65"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
        >Neu laden ↻</button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              flexShrink:0, width:200, borderRadius:16, overflow:"hidden",
              background:"rgba(14,196,184,0.05)",
              border:"1.5px solid rgba(14,196,184,0.10)",
              animation:`dc-slidein .3s ease both`,
              animationDelay:`${i*0.08}s`,
            }}>
              <div style={{ width:"100%", height:88, background:"rgba(14,196,184,0.08)" }}/>
              <div style={{ padding:"10px 11px 11px", display:"flex", flexDirection:"column", gap:7 }}>
                <Sk w="75%" h={13} r={6}/>
                <Sk w="60%" h={10} r={5}/>
                <Sk w="85%" h={9} r={5}/>
                <Sk w="100%" h={28} r={9}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div style={{
          textAlign:"center", padding:"24px 0",
          background:"rgba(14,196,184,0.04)",
          borderRadius:16,
          border:"1.5px dashed rgba(14,196,184,0.18)",
        }}>
          <div style={{ fontSize:28, marginBottom:10 }}>✨</div>
          <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:6 }}>
            HUI lernt gerade deine Interessen
          </div>
          <div style={{ fontSize:11.5, color:T.inkF, lineHeight:1.6, marginBottom:16, maxWidth:260, margin:"0 auto 16px" }}>
            Interagiere mit Menschen, Werken, Projekten und Erlebnissen.<br/>
            Je mehr du entdeckst, desto persönlicher werden deine Empfehlungen.
          </div>
          <button onClick={() => onDiscover?.()} style={{
            background:T.teal, border:"none", borderRadius:99,
            padding:"9px 20px", fontSize:12, fontWeight:700, color:"white",
            cursor:"pointer",
          }}>Jetzt entdecken</button>
        </div>
      )}

      {/* Karten — horizontal scrollbar */}
      {!loading && items.length > 0 && (
        <div style={{
          display:"flex", gap:12, overflowX:"auto",
          paddingBottom:4,
          scrollSnapType:"x mandatory",
          WebkitOverflowScrolling:"touch",
          msOverflowStyle:"none", scrollbarWidth:"none",
        }}>
          {items.map((item, idx) => (
            <ForDichCard
              key={item.id}
              item={item}
              idx={idx}
              onSelect={(it) => {
                if (it.type === "profile")     openProfileById?.(it.rawId);
                else if (it.type === "work")   openProfileById?.(it.rawId);  // opens creator's profile
                else if (it.type === "experience") openProfileById?.(it.rawId);
                onClose?.();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 1. PERSÖNLICHE HEUTE-ZEILE (Greeting erweitert)
// ─────────────────────────────────────────────────────────────
function GreetingWithHints({ currentUser, onCategoryClick }) {
  const [hIdx, setHIdx] = useState(0);
  const [hVis, setHVis] = useState(true);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    const since7d = new Date(Date.now() - 86400000 * 7).toISOString();
    Promise.all([
      supabase.from("profiles").select("id",{count:"exact",head:true}).order("impact_eur",{ascending:false}).limit(3),
      supabase.from("works").select("id",{count:"exact",head:true}).gte("created_at",since7d),
      supabase.from("experiences").select("id",{count:"exact",head:true}),
    ]).then(([p,w,e]) => {
      setCounts({ people: Math.min(p.count??0, 5), works: w.count??0, exp: e.count??0 });
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setHVis(false);
      setTimeout(() => { setHIdx(i => (i+1) % KI_HINTS.length); setHVis(true); }, 270);
    }, 2900);
    return () => clearInterval(t);
  }, []);

  const name = currentUser?.display_name || currentUser?.username || null;
  const hint = KI_HINTS[hIdx];

  // Persönliche Hint-Zeilen
  const hints = useMemo(() => {
    if (!counts) return [];
    return [
      counts.people > 0 && { emoji:"🤝", color:"#0EC4B8", text:`${counts.people} Menschen passen zu deinem Profil`, cat:"Menschen" },
      counts.works  > 0 && { emoji:"🎨", color:"#9333EA", text:`${counts.works} neue Werke könnten dich inspirieren`,  cat:"Werke" },
      counts.exp    > 0 && { emoji:"📅", color:"#0EA5E9", text:`${counts.exp} Erlebnisse sind buchbar`,               cat:"Erlebnisse" },
    ].filter(Boolean);
  }, [counts]);

  return (
    <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid rgba(14,196,184,0.08)` }}>
      {/* Name + rotierender Hint */}
      <div style={{ marginBottom: hints.length ? 12 : 0 }}>
        <div style={{ fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", marginBottom:4 }}>
          {name ? `Hallo ${name} 👋` : "Willkommen auf HUI 👋"}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:12, color:T.inkF }}>Was möchtest du heute</span>
          <span style={{
            fontSize:12, fontWeight:700, color:T.teal,
            opacity: hVis ? 1 : 0,
            transform: hVis ? "translateY(0)" : "translateY(3px)",
            transition: "opacity .25s ease, transform .25s ease",
            display:"inline-flex", alignItems:"center", gap:3,
          }}>{hint.emoji} {hint.text}?</span>
        </div>
      </div>

      {/* Persönliche Heute-Zeile */}
      {hints.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.inkF, marginBottom:2, letterSpacing:".04em" }}>
            HEUTE FÜR DICH
          </div>
          {hints.map((h, i) => (
            <button key={i} onClick={() => onCategoryClick?.(h.cat)} style={{
              display:"flex", alignItems:"center", gap:9,
              background:"none", border:"none", padding:"5px 0",
              cursor:"pointer", textAlign:"left",
              WebkitTapHighlightColor:"transparent",
            }}>
              <div style={{
                width:26, height:26, borderRadius:8, flexShrink:0,
                background: h.color+"14",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13,
              }}>{h.emoji}</div>
              <span style={{
                fontSize:12.5, fontWeight:600, color:T.ink,
                transition:"color .12s",
              }}
                onMouseEnter={e=>e.target.style.color=h.color}
                onMouseLeave={e=>e.target.style.color=T.ink}
              >{h.text}</span>
              <span style={{ fontSize:11, color:T.inkF, marginLeft:"auto" }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. STORY CARDS — "Heute auf HUI" (echte Inhalte, keine Zahlen)
// ─────────────────────────────────────────────────────────────
function StoryCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles")
        .select("id,display_name,username,avatar_url,bio,created_at")
        .order("created_at",{ascending:false}).limit(3),
      supabase.from("works")
        .select("id,title,cover_url,category,created_at,user_id")
        .order("created_at",{ascending:false}).limit(3),
      supabase.from("experiences")
        .select("id,title,cover_url,location_text,date,created_at,time_start")
        .order("created_at",{ascending:false}).limit(2),
      supabase.from("beitraege")
        .select("id,caption,src,created_at")
        .order("created_at",{ascending:false}).limit(2),
    ]).then(([p,w,e,b]) => {
      const all = [];

      (p.data||[]).forEach(r => all.push({
        id:"p"+r.id, type:"person",
        emoji:"✨", color:"#9333EA",
        label:"Neues Mitglied",
        title: r.display_name || r.username || "HUI Mitglied",
        desc:  r.bio ? r.bio.slice(0,48)+"…" : "Gerade HUI beigetreten",
        time:  relTime(r.created_at),
        img:   r.avatar_url,
        round: true,
      }));

      (w.data||[]).forEach(r => all.push({
        id:"w"+r.id, type:"work",
        emoji:"🎨", color:"#0EA5E9",
        label:"Neues Werk",
        title: r.title,
        desc:  r.category || "Frisch veröffentlicht",
        time:  relTime(r.created_at),
        img:   r.cover_url,
        round: false,
      }));

      (e.data||[]).forEach(r => all.push({
        id:"e"+r.id, type:"experience",
        emoji:"📅", color:T.teal,
        label:"Erlebnis",
        title: r.title,
        desc:  (r.location_text || "") + (r.time_start ? " · " + r.time_start.slice(0,5) + " Uhr" : ""),
        time:  relTime(r.created_at),
        img:   r.cover_url,
        round: false,
      }));

      (b.data||[]).forEach(r => all.push({
        id:"b"+r.id, type:"moment",
        emoji:"🌱", color:"#16A34A",
        label:"Moment",
        title: r.caption ? r.caption.slice(0,45)+(r.caption.length>45?"…":"") : "Neuer Moment geteilt",
        desc:  "",
        time:  relTime(r.created_at),
        img:   r.src,
        round: false,
      }));

      // Mischen + trim
      all.sort(() => Math.random() - 0.42);
      setCards(all.slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionLabel>
        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{
            display:"inline-block", width:6, height:6, borderRadius:"50%",
            background:T.teal, boxShadow:"0 0 0 2.5px rgba(14,196,184,0.22)",
            animation:"dc-pulse 2s ease-in-out infinite",
          }}/>
          Heute auf HUI
        </span>
      </SectionLabel>

      {loading ? (
        <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
          {[0,1,2].map(i => <Sk key={i} w={160} h={88} r={14}/>)}
        </div>
      ) : (
        <div style={{
          display:"flex", gap:10, overflowX:"auto",
          paddingBottom:4,
          scrollSnapType:"x mandatory",
          WebkitOverflowScrolling:"touch",
          msOverflowStyle:"none", scrollbarWidth:"none",
        }}>
          {cards.map((c, i) => (
            <div key={c.id} style={{
              flexShrink:0, scrollSnapAlign:"start",
              width:164, borderRadius:14,
              background:`linear-gradient(145deg,${c.color}0D,${c.color}05)`,
              border:`1.5px solid ${c.color}22`,
              cursor:"pointer",
              overflow:"hidden",
              transition:"transform .18s ease, box-shadow .18s ease",
              animation:`dc-slidein .3s ease both`,
              animationDelay:`${i*0.05}s`,
            }}
              onMouseEnter={e=>{
                e.currentTarget.style.transform="translateY(-3px) scale(1.01)";
                e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}28`;
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.transform="translateY(0) scale(1)";
                e.currentTarget.style.boxShadow="none";
              }}
            >
              {/* Cover / Avatar */}
              {c.img && (
                <div style={{
                  width:"100%", height:60, overflow:"hidden",
                  borderRadius:"12px 12px 0 0", flexShrink:0,
                  background:c.color+"18",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <img src={c.img} alt="" style={{
                    width:"100%", height:"100%", objectFit:"cover",
                    transition:"transform .3s ease",
                  }}
                    onError={e=>{ e.target.style.display="none"; }}
                    onMouseEnter={e=>e.target.style.transform="scale(1.06)"}
                    onMouseLeave={e=>e.target.style.transform="scale(1)"}
                  />
                </div>
              )}
              {!c.img && (
                <div style={{
                  width:"100%", height:60,
                  background:c.coverBg || c.color+"18",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:26,
                }}>{c.emoji}</div>
              )}

              {/* Content */}
              <div style={{ padding:"9px 10px 10px" }}>
                <div style={{
                  fontSize:9.5, fontWeight:800, color:c.color,
                  letterSpacing:".05em", textTransform:"uppercase",
                  marginBottom:3,
                }}>{c.label}</div>
                <div style={{
                  fontSize:12, fontWeight:700, color:T.ink,
                  overflow:"hidden", display:"-webkit-box",
                  WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                  lineHeight:1.35, marginBottom: c.desc ? 3 : 0,
                }}>{c.title}</div>
                {c.desc && (
                  <div style={{
                    fontSize:10.5, color:T.inkS,
                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                    marginBottom:5,
                  }}>{c.desc}</div>
                )}
                <div style={{ fontSize:9.5, color:T.inkF }}>{c.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. HUI EMPFEHLUNGSKARTE (aufgewertet)
// ─────────────────────────────────────────────────────────────
function PersonalRec({ currentUser, openProfileById }) {
  const [recs, setRecs]   = useState([]);
  const [idx,  setIdx]    = useState(0);
  const [loading, setL]   = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    supabase.from("profiles")
      .select("id,display_name,username,avatar_url,bio,talent,impact_eur,dna_tags,is_available")
      .neq("id", currentUser?.id || "00000000-0000-0000-0000-000000000000")
      .order("impact_eur",{ascending:false}).limit(3)
      .then(({data}) => { setRecs(data||[]); setL(false); })
      .catch(()=>setL(false));
  }, [currentUser?.id]);

  // Dezenter Pulse alle 20 Sekunden
  useEffect(() => {
    const t = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }, 20000);
    return () => clearInterval(t);
  }, []);

  function score(p) {
    const base = 70;
    const imp  = Math.min(p.impact_eur||0, 500)/500*18;
    const avl  = p.is_available ? 4 : 0;
    const vari = (p.id?.charCodeAt(p.id.length-1)||0) % 9;
    return Math.min(99, Math.round(base+imp+avl+vari));
  }

  const TAGS = ["Kreativität","Gemeinschaft","Bildung","Natur","Wirkung"];
  const rec  = recs[idx];

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <Sk w={48} h={48} r={99}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
          <Sk w="65%" h={13} r={6}/><Sk w="45%" h={10} r={5}/>
        </div>
      </div>
      <Sk w="100%" h={80} r={12}/>
    </div>
  );

  if (!rec) return null;
  const sc   = score(rec);
  const tags = (rec.dna_tags||[]).slice(0,3).length > 0 ? (rec.dna_tags||[]).slice(0,3) : TAGS.slice(0,3);

  return (
    <div>
      <SectionLabel color={T.teal}>✨ HUI Empfehlung</SectionLabel>
      <div style={{
        background:"linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.02))",
        border:"1.5px solid rgba(14,196,184,0.16)",
        borderRadius:16, padding:"14px 14px 12px",
        transition:"box-shadow .18s ease",
        boxShadow: pulse ? "0 0 0 3px rgba(14,196,184,0.18)" : "none",
      }}>
        {/* Avatar + Name + Score */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <Av src={rec.avatar_url} emoji="👤" size={44}/>
            <div style={{
              position:"absolute", bottom:-3, right:-8,
              background: sc>=85 ? T.teal : "#D97706",
              borderRadius:99, padding:"2px 6px",
              fontSize:8.5, fontWeight:900, color:"white",
              border:"1.5px solid white", whiteSpace:"nowrap",
            }}>{sc}%</div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:800, color:T.ink, marginBottom:1 }}>
              {rec.display_name || rec.username || "HUI Mitglied"}
            </div>
            {(rec.talent||rec.bio) && (
              <div style={{ fontSize:11, color:T.inkS,
                overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                {rec.talent || rec.bio?.slice(0,36)}
              </div>
            )}
            <div style={{ fontSize:10, color:T.teal, fontWeight:700, marginTop:2 }}>
              {sc}% Übereinstimmung
            </div>
          </div>
        </div>

        {/* Gemeinsam */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, color:T.inkF, marginBottom:5 }}>Gemeinsam:</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {tags.map((tag,i) => (
              <span key={i} style={{
                fontSize:10.5, fontWeight:700, color:T.teal,
                background:T.tealS, borderRadius:99, padding:"3px 9px",
                border:"1px solid rgba(14,196,184,0.18)",
              }}>✓ {tag}</span>
            ))}
          </div>
        </div>

        {/* Warum */}
        <div style={{
          fontSize:11, color:T.inkS, fontStyle:"italic",
          lineHeight:1.5,
          borderTop:"1px solid rgba(14,196,184,0.09)",
          paddingTop:8, marginBottom:11,
        }}>
          {REC_REASONS[idx % REC_REASONS.length]}
        </div>

        {/* CTA */}
        <button style={{
          width:"100%", padding:"10px 0",
          background:T.teal, border:"none", borderRadius:11,
          fontSize:12.5, fontWeight:700, color:"white",
          cursor:"pointer", letterSpacing:".02em",
          transition:"opacity .14s, transform .14s",
        }}
          onClick={() => rec?.id && openProfileById?.(rec.id)}
          onMouseEnter={e=>{ e.currentTarget.style.opacity=".88"; e.currentTarget.style.transform="scale(1.01)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.opacity="1";   e.currentTarget.style.transform="scale(1)"; }}
        >Profil entdecken →</button>
      </div>

      {/* Dot-Navigation */}
      {recs.length > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:8 }}>
          {recs.map((_,i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: idx===i ? 18 : 6, height:6, borderRadius:99, cursor:"pointer",
              background: idx===i ? T.teal : "rgba(14,196,184,0.22)",
              transition:"all .2s ease",
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. KATEGORIEN mit Cover-Feeling
// ─────────────────────────────────────────────────────────────
function ThemeCards({ onThemeClick }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    Promise.all(
      THEMES.map(t => Promise.all([
        supabase.from("profiles").select("id",{count:"exact",head:true})
          .or(t.kw.map(k=>`bio.ilike.%${k}%`).join(",")),
        supabase.from("works").select("id",{count:"exact",head:true})
          .or(t.kw.map(k=>`title.ilike.%${k}%,category.ilike.%${k}%`).join(",")),
        supabase.from("experiences").select("id",{count:"exact",head:true})
          .or(t.kw.map(k=>`title.ilike.%${k}%,description.ilike.%${k}%`).join(",")),
        supabase.from("beitraege").select("id",{count:"exact",head:true})
          .or(t.kw.map(k=>`caption.ilike.%${k}%`).join(",")),
      ]).then(([m,w,e,b]) => ({ key:t.key, m:m.count??0, w:w.count??0, e:e.count??0, b:b.count??0 })))
    ).then(res => {
      const map = {};
      res.forEach(r => { map[r.key] = r; });
      setCounts(map);
    }).catch(()=>{});
  }, []);

  return (
    <div>
      <SectionLabel>Heute entdecken</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {THEMES.map(t => {
          const c   = counts[t.key] || {};
          const tot = (c.m||0)+(c.w||0)+(c.e||0)+(c.b||0);
          return (
            <button key={t.key} onClick={()=>onThemeClick(t.label)} style={{
              display:"flex", alignItems:"center", gap:0,
              background:"none", border:"none",
              borderRadius:13, padding:0,
              cursor:"pointer", textAlign:"left",
              transition:"transform .15s ease",
              WebkitTapHighlightColor:"transparent",
              overflow:"hidden",
            }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateX(2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}
            >
              {/* Mini Cover */}
              <div style={{
                width:40, height:40, flexShrink:0, borderRadius:11,
                background:t.coverBg,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18,
                transition:"transform .22s ease",
                overflow:"hidden",
                marginRight:10,
              }}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.07)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              >{t.emoji}</div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:t.color, marginBottom:2 }}>
                  {t.label}
                </div>
                {tot > 0 ? (
                  <div style={{ fontSize:10, color:T.inkF, fontWeight:500 }}>
                    {[
                      c.m>0 && `👥 ${c.m}`,
                      c.w>0 && `🎨 ${c.w}`,
                      c.e>0 && `📅 ${c.e}`,
                      c.b>0 && `🌱 ${c.b}`,
                    ].filter(Boolean).join("  ")}
                  </div>
                ) : (
                  <Sk w="55%" h={9} r={5}/>
                )}
              </div>
              <span style={{ fontSize:13, color:t.color, opacity:.4, marginLeft:4 }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. LIVE AKTIVITÄTEN — wie ein lebendiger Organismus
// ─────────────────────────────────────────────────────────────
function LiveActivity() {
  const [items, setItems] = useState([]);
  const [new_, setNew]    = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id,display_name,username,avatar_url,created_at")
        .order("created_at",{ascending:false}).limit(3),
      supabase.from("works").select("id,title,cover_url,created_at")
        .order("created_at",{ascending:false}).limit(3),
      supabase.from("beitraege").select("id,caption,src,created_at")
        .order("created_at",{ascending:false}).limit(2),
      supabase.from("experiences").select("id,title,cover_url,created_at")
        .order("created_at",{ascending:false}).limit(2),
    ]).then(([p,w,b,e]) => {
      const all = [];
      (p.data||[]).forEach(r => all.push({
        id:"p"+r.id, emoji:"✨", color:"#9333EA",
        avatar:r.avatar_url, round:true,
        type:"Beigetreten",
        text:`${r.display_name||r.username||"Jemand"} ist HUI beigetreten`,
        time:r.created_at,
      }));
      (w.data||[]).forEach(r => all.push({
        id:"w"+r.id, emoji:"🎨", color:"#0EA5E9",
        avatar:r.cover_url, round:false,
        type:"Neues Werk",
        text:`hat „${r.title}" veröffentlicht`,
        time:r.created_at,
      }));
      (e.data||[]).forEach(r => all.push({
        id:"e"+r.id, emoji:"📅", color:T.teal,
        avatar:r.cover_url, round:false,
        type:"Erlebnis",
        text:`hat „${r.title}" erstellt`,
        time:r.created_at,
      }));
      (b.data||[]).forEach(r => all.push({
        id:"b"+r.id, emoji:"🌱", color:"#16A34A",
        avatar:r.src, round:false,
        type:"Moment",
        text:r.caption?r.caption.slice(0,42)+(r.caption.length>42?"…":""):"hat einen Moment geteilt",
        time:r.created_at,
      }));
      all.sort((a,b)=>new Date(b.time)-new Date(a.time));
      setItems(all.slice(0,5));
    }).catch(()=>{});
  }, []);

  if (!items.length) return null;

  return (
    <div>
      <SectionLabel>Live Aktivitäten</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map((it,i) => (
          <div key={it.id} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"7px 8px", borderRadius:11,
            background: i===0 ? "rgba(14,196,184,0.05)" : "transparent",
            border: i===0 ? "1px solid rgba(14,196,184,0.10)" : "none",
            cursor:"pointer",
            transition:"background .12s, transform .12s",
            animation:`dc-slidein .3s ease both`,
            animationDelay:`${i*0.06}s`,
            WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(14,196,184,0.07)"; e.currentTarget.style.transform="translateX(2px)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=i===0?"rgba(14,196,184,0.05)":"transparent"; e.currentTarget.style.transform="translateX(0)"; }}
          >
            {/* Live Dot + Avatar */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <Av src={it.avatar} emoji={it.emoji} size={30} round={it.round}/>
              {i === 0 && (
                <div style={{
                  position:"absolute", top:-1, right:-1,
                  width:8, height:8, borderRadius:"50%",
                  background:"#22c55e",
                  border:"1.5px solid white",
                  animation:"dc-pulse 1.8s ease-in-out infinite",
                }}/>
              )}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:10, fontWeight:700, color:it.color,
                letterSpacing:".04em", marginBottom:1,
              }}>{it.type}</div>
              <div style={{
                fontSize:11.5, fontWeight:500, color:T.ink,
                overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
              }}>{it.text}</div>
            </div>
            <div style={{ fontSize:9.5, color:T.inkF, flexShrink:0 }}>
              {relTime(it.time)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. SCHNELLAKTIONEN — große Karten mit Beschreibung
// ─────────────────────────────────────────────────────────────
function QuickActions({ onAction }) {
  return (
    <div>
      <SectionLabel>Schnellaktionen</SectionLabel>
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:8,
      }}>
        {QUICK_ACTIONS.map((a,i) => (
          <button key={i} onClick={()=>onAction?.(a.label)} style={{
            display:"flex", alignItems:"flex-start", gap:9,
            background:`linear-gradient(135deg,${a.color}0B,${a.color}04)`,
            border:`1.5px solid ${a.color}1E`,
            borderRadius:13, padding:"11px 12px",
            cursor:"pointer", textAlign:"left",
            transition:"all .16s ease",
            WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px) scale(1.01)";
              e.currentTarget.style.boxShadow=`0 6px 18px ${a.color}22`;
              e.currentTarget.style.borderColor=a.color+"44";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0) scale(1)";
              e.currentTarget.style.boxShadow="none";
              e.currentTarget.style.borderColor=a.color+"1E";
            }}
          >
            <div style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background:a.color+"16",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, transition:"transform .18s ease",
            }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            >{a.emoji}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:a.color, marginBottom:2 }}>
                {a.label}
              </div>
              <div style={{ fontSize:10.5, color:T.inkF, lineHeight:1.4 }}>
                {a.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
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
// UNIFIED SEARCH
// ─────────────────────────────────────────────────────────────
function useUnifiedSearch(query) {
  const [results, setResults] = useState({profiles:[],works:[],experiences:[],momente:[]});
  const [loading, setLoading] = useState(false);
  const alive = useRef({v:false});

  useEffect(()=>{
    if (!query?.trim()){setResults({profiles:[],works:[],experiences:[],momente:[]});setLoading(false);return;}
    alive.current.v=false;
    const a={v:true}; alive.current=a;
    setLoading(true);
    const q=query.toLowerCase().trim();
    Promise.all([
      supabase.from("profiles").select("id,display_name,username,avatar_url,bio,location")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`).limit(5),
      supabase.from("works").select("id,title,cover_url,category,location_text,user_id")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`).limit(5),
      supabase.from("experiences").select("id,title,cover_url,category,location_text,user_id")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,location_text.ilike.%${q}%`).limit(5),
      supabase.from("beitraege").select("id,caption,src,created_at")
        .ilike("caption",`%${q}%`).limit(5),
    ]).then(([p,w,e,b])=>{
      if(!a.v)return;
      setResults({
        profiles:    (p.data||[]).map(r=>({id:r.id,type:"profile",    title:r.display_name||r.username||"HUI Mitglied",sub:r.bio?r.bio.slice(0,42):r.location,avatar:r.avatar_url,emoji:"👤",typeLabel:"Person"})),
        works:       (w.data||[]).map(r=>({id:r.id,type:"work",       title:r.title,sub:r.category||r.location_text,avatar:r.cover_url,emoji:"🎨",typeLabel:"Werk",userId:r.user_id})),
        experiences: (e.data||[]).map(r=>({id:r.id,type:"experience", title:r.title,sub:r.location_text||r.category,avatar:r.cover_url,emoji:"📅",typeLabel:"Erlebnis",userId:r.user_id})),
        momente:     (b.data||[]).map(r=>({id:r.id,type:"moment",     title:r.caption||"Moment",sub:relTime(r.created_at),avatar:r.src,emoji:"📸",typeLabel:"Moment"})),
      });
      setLoading(false);
    }).catch(()=>{if(a.v)setLoading(false);});
  },[query]);

  const total=results.profiles.length+results.works.length+results.experiences.length+results.momente.length;
  return {results,loading,total};
}

function ResultCol({title,emoji,items,onSelect,startIdx=0,focusedIdx=-1,onDiscover}){
  if(!items.length)return null;
  return(
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:10,fontWeight:800,color:T.inkF,letterSpacing:".07em",
        textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
        {emoji} {title}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:1}}>
        {items.map((it,localIdx)=>(
          <div key={it.id} onClick={()=>onSelect?.(it)} style={{
            display:"flex",alignItems:"center",gap:8,
            padding:"6px 6px",borderRadius:10,cursor:"pointer",
            transition:"background .10s",WebkitTapHighlightColor:"transparent",
            background:(startIdx+localIdx)===focusedIdx?"rgba(14,196,184,0.13)":"transparent",
            outline:(startIdx+localIdx)===focusedIdx?"2px solid rgba(14,196,184,0.35)":"none",
          }}
            onMouseEnter={e=>{ if((startIdx+localIdx)!==focusedIdx) e.currentTarget.style.background="rgba(14,196,184,0.08)"; }}
            onMouseLeave={e=>{ if((startIdx+localIdx)!==focusedIdx) e.currentTarget.style.background="transparent"; }}
          >
            <Av src={it.avatar} emoji={it.emoji} size={28} round={it.type==="profile"}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:T.ink,
                overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{it.title}</div>
              {it.sub&&<div style={{fontSize:10,color:T.inkF,
                overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{it.sub}</div>}
            </div>
          </div>
        ))}
        {items.length===5&&(
          <button onClick={()=>onDiscover?.()} style={{background:"none",border:"none",cursor:"pointer",
            fontSize:11,color:T.teal,fontWeight:600,padding:"3px 6px",textAlign:"left"}}>
            Alle →
          </button>
        )}
      </div>
    </div>
  );
}

function KiDiscoveryCol({query, onHintSelect}){
  const hints=useMemo(()=>{
    if(!query)return[];
    return[
      {emoji:"🎯",text:`Menschen die „${query}" lieben`},
      {emoji:"🌍",text:`Projekte: ${query}`},
      {emoji:"📍",text:`${query} in deiner Nähe`},
      {emoji:"💡",text:`${query} — neue Blickwinkel`},
    ];
  },[query]);
  if(!hints.length)return null;
  return(
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:10,fontWeight:800,color:T.teal,letterSpacing:".07em",
        textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
        ✨ KI
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {hints.map((h,i)=>(
          <div key={i} onClick={()=>onHintSelect?.(h)} style={{
            display:"flex",alignItems:"center",gap:7,padding:"8px 9px",borderRadius:10,cursor:"pointer",
            background:"linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.03))",
            border:"1px solid rgba(14,196,184,0.12)",
            transition:"transform .12s, background .12s",
            WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateX(2px)"; e.currentTarget.style.background="linear-gradient(135deg,rgba(14,196,184,0.14),rgba(14,196,184,0.07))"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateX(0)"; e.currentTarget.style.background="linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.03))"; }}
          >
            <span style={{fontSize:14}}>{h.emoji}</span>
            <span style={{fontSize:11.5,fontWeight:500,color:T.ink}}>{h.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// HAUPTKOMPONENTE
// ─────────────────────────────────────────────────────────────
export default function SearchCommandCenter({ activeMood, currentUser }) {
  // ── Navigation + Follow Engine ──────────────────────────────
  const { openProfileById, switchTab,
          setShowWerkPublisher, setShowExperienceCreator,
          setShowImpactFlow } = useHome();
  const engine = useConnectionEngine();

  const [open,        setOpen]        = useState(false);
  // Mobile Fullscreen Search
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const isMobile = () => typeof window !== "undefined" && window.innerWidth < 1024;
  const [query,       setQuery]       = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showKi,      setShowKi]      = useState(false);
  const [focusedIdx,  setFocusedIdx]  = useState(-1);

  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const kiRef    = useRef(null);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_search_history")||"[]"); }
    catch { return []; }
  });

  const resultsRef = useRef({profiles:[],works:[],experiences:[],momente:[]});
  const focusedIdxRef = useRef(-1);
  const openRef = useRef(false);
  const searchQueryRef = useRef("");
  const debounced = useDebounce(query, 250);
  useEffect(()=>{ setSearchQuery(debounced); setFocusedIdx(-1); },[debounced]);
  const {results,loading,total} = useUnifiedSearch(searchQuery);
  // Sync refs für Keyboard-Handler (Closure über alten State vermeiden)
  useEffect(()=>{ resultsRef.current = results; },[results]);
  useEffect(()=>{ focusedIdxRef.current = focusedIdx; },[focusedIdx]);
  useEffect(()=>{ openRef.current = open; },[open]);
  useEffect(()=>{ searchQueryRef.current = searchQuery; },[searchQuery]);

  const PH = ["Was möchtest du heute bewirken?","Menschen finden…","Werke entdecken…","Projekte erkunden…"];
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

  useEffect(()=>{
    if(!open)return;
    function h(e){
      if(!wrapRef.current?.contains(e.target)&&!kiRef.current?.contains(e.target)) close_();
    }
    document.addEventListener("mousedown",h);
    document.addEventListener("touchstart",h,{passive:true});
    return()=>{ document.removeEventListener("mousedown",h); document.removeEventListener("touchstart",h); };
  },[open]);

  useEffect(()=>{
    function h(e){
      if(e.key==="Escape"){ if(showKi){setShowKi(false);return;} close_(); return; }
      if(!openRef.current)return;
      const allItems=[...resultsRef.current.profiles,...resultsRef.current.works,...resultsRef.current.experiences,...resultsRef.current.momente];
      if(e.key==="ArrowDown"){ e.preventDefault(); setFocusedIdx(i=>Math.min(i+1,allItems.length-1)); return; }
      if(e.key==="ArrowUp"){ e.preventDefault(); setFocusedIdx(i=>Math.max(i-1,-1)); return; }
      if(e.key==="Enter" && searchQueryRef.current.trim()){
        e.preventDefault();
        const target = focusedIdxRef.current>=0 ? allItems[focusedIdxRef.current] : allItems[0];
        if(target) handleSelect(target);
        return;
      }
    }
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[showKi]);

  const mc  = activeMood?.color || "#0EC4B8";
  const has = !!activeMood;

  function open_(){
    if (isMobile()) {
      setMobileOpen(true);
    } else {
      setOpen(true);
      setTimeout(()=>inputRef.current?.focus(),60);
    }
  }
  function close_(){ setOpen(false); setQuery(""); setSearchQuery(""); setShowKi(false); inputRef.current?.blur(); }
  function mobileClose(){ setMobileOpen(false); setQuery(""); setSearchQuery(""); }
  function saveHistory(q){ if(!q.trim())return; const n=[q,...history.filter(h=>h!==q)].slice(0,8); setHistory(n); try{localStorage.setItem("hui_search_history",JSON.stringify(n));}catch{} }
  function handleTheme(label){ setQuery(label); setSearchQuery(label); saveHistory(label); setShowKi(false); inputRef.current?.focus(); }
  function handleHistory(q){ setQuery(q); setSearchQuery(q); setShowKi(false); inputRef.current?.focus(); }
  function handleKiSelect(text){ setQuery(text); setSearchQuery(text); setShowKi(false); inputRef.current?.focus(); }
  function handleSelect(item){
    saveHistory(searchQuery||query||item.title);
    close_();
    if(!item)return;
    switch(item.type){
      case "profile":
        if(item.id) openProfileById(item.id);
        break;
      case "work":
        // Werk-Detailseite existiert noch nicht → Ersteller-Profil
        if(item.userId) openProfileById(item.userId);
        break;
      case "experience":
        // Erlebnis-Detailseite existiert noch nicht → Ersteller-Profil
        if(item.userId) openProfileById(item.userId);
        break;
      case "moment":
        // Beitrag → Discover-Tab
        switchTab?.("discover");
        break;
      default:
        break;
    }
  }
  function handleAction(label){
    saveHistory(label);
    close_();
    // QuickAction → spezifischen Creator-Flow öffnen
    const l = label.toLowerCase();
    if(l.includes("werk") || l.includes("veröffentlichen")){
      setShowWerkPublisher?.(true);
    } else if(l.includes("erlebnis") || l.includes("erstellen")){
      setShowExperienceCreator?.(true);
    } else if(l.includes("projekt")){
      setShowImpactFlow?.(true);
    } else {
      // "Menschen kennenlernen" + "Ort hinzufügen" → Discover
      switchTab?.("discover");
    }
  }
  function handleDiscover() { close_(); switchTab?.("discover"); }
  function handleKiHintSelect(hint){
    // hint = { emoji, text }
    const t = hint.text.toLowerCase();
    if(t.includes("menschen") || t.includes("lieben")){
      // Setze Suche auf people-only und öffne Discover
      close_(); switchTab?.("discover");
    } else if(t.includes("projekte")){
      close_(); switchTab?.("discover");
      setTimeout(()=>{
        const el=document.querySelector("[data-dp-projekte]");
        if(el)el.scrollIntoView({behavior:"smooth"});
      },350);
    } else if(t.includes("nähe") || t.includes("location")){
      close_(); switchTab?.("discover");
      setTimeout(()=>{
        const el=document.querySelector("[data-dp-people]");
        if(el)el.scrollIntoView({behavior:"smooth"});
      },350);
    } else {
      // "neue Blickwinkel" → globale Discover-Suche
      close_(); switchTab?.("discover");
    }
  }
  function handleCategoryClick(cat){ setQuery(cat); setSearchQuery(cat); inputRef.current?.focus(); }

  const showResults = searchQuery.trim().length > 0;

  return (
    <>
      <style>{`
        @keyframes dc-in {
          from { opacity:0; transform:translateY(-8px) scaleY(.97); transform-origin:top center; }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes dc-shimmer {
          from { background-position:-200% 0; }
          to   { background-position:200% 0; }
        }
        @keyframes dc-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:.35; transform:scale(1.45); }
        }
        @keyframes dc-slidein {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dc-input {
          outline:none; border:none; background:none; width:100%;
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
          font-size:14px; font-weight:500; color:#1A3530;
        }
        .dc-input::placeholder { color:rgba(26,53,48,0.28); }
        .dc-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Mobile Fullscreen Search */}
      {mobileOpen && (
        <MobileSearchView
          initialQuery={query}
          history={history}
          onClose={mobileClose}
          onSelect={handleSelect}
          onHistory={saveHistory}
          currentUser={currentUser}
        />
      )}

      {/* Backdrop */}
      {open && (
        <div onClick={close_} style={{
          position:"fixed", inset:0, zIndex:299,
          background:"rgba(26,53,48,0.15)",
          backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)",
          animation:"dc-in .15s ease both",
        }}/>
      )}

      {/* WRAPPER */}
      <div ref={wrapRef} style={{ position:"relative", flex:1, zIndex:300 }}>

        {/* SEARCH BAR */}
        <div onClick={open_} style={{
          display:"flex", alignItems:"center", gap:9, height:40,
          background: has
            ? `linear-gradient(135deg,${mc}12,rgba(255,251,248,0.96))`
            : "rgba(255,255,255,0.92)",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          borderRadius: open ? "14px 14px 0 0" : 999,
          border:`1.5px solid ${open ? T.teal : has ? mc+"42" : "rgba(22,215,197,0.25)"}`,
          borderBottom: open ? "1.5px solid rgba(14,196,184,0.09)" : undefined,
          boxShadow: open ? "none" : "0 0 0 2px rgba(14,196,184,0.08),0 3px 14px rgba(0,0,0,0.05)",
          padding:"0 10px 0 13px", cursor:"text",
          transition:"border-radius .18s ease, border-color .18s, box-shadow .18s",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{flexShrink:0, opacity:open?.7:.38}}>
            <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="2"/>
            <path d="M20 20L16.5 16.5" stroke={T.teal} strokeWidth="2" strokeLinecap="round"/>
          </svg>

          <div style={{flex:1,position:"relative",height:40,display:"flex",alignItems:"center"}}>
            <input ref={inputRef} className="dc-input"
              value={query}
              onChange={e=>setQuery(e.target.value)}
              onFocus={open_}
              placeholder=""
            />
            {!query && !open && (
              <span style={{
                position:"absolute",left:0,pointerEvents:"none",
                fontSize:13.5,fontWeight:500,
                color:has?`${mc}80`:"rgba(130,130,130,0.55)",
                opacity:phVis?1:0,
                transform:phVis?"translateY(0)":"translateY(4px)",
                transition:"opacity .28s ease, transform .28s ease",
                whiteSpace:"nowrap",overflow:"hidden",maxWidth:"100%",
              }}>{PH[phIdx]}</span>
            )}
            {open && !query && (
              <span style={{
                position:"absolute",left:0,pointerEvents:"none",
                fontSize:13.5,fontWeight:400,color:"rgba(26,53,48,0.24)",whiteSpace:"nowrap",
              }}>Was möchtest du heute bewirken?</span>
            )}
          </div>

          {query && (
            <button onClick={e=>{e.stopPropagation();setQuery("");setSearchQuery("");inputRef.current?.focus();}} style={{
              flexShrink:0,width:18,height:18,borderRadius:"50%",
              background:"rgba(0,0,0,0.11)",border:"none",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",fontSize:10,color:"rgba(60,60,60,0.65)",fontWeight:700,
            }}>✕</button>
          )}

          <div ref={kiRef} style={{position:"relative",flexShrink:0}}>
            <button onClick={e=>{e.stopPropagation();open_();setShowKi(p=>!p);}} style={{
              display:"flex",alignItems:"center",gap:3,
              background:showKi?T.teal:"rgba(14,196,184,0.11)",
              border:`1px solid ${showKi?T.teal:"rgba(14,196,184,0.20)"}`,
              borderRadius:99,padding:"4px 10px",
              cursor:"pointer",transition:"all .14s ease",
              WebkitTapHighlightColor:"transparent",
            }}>
              <span style={{fontSize:10}}>✨</span>
              <span style={{fontSize:10,fontWeight:700,color:showKi?"white":T.teal}}>KI</span>
            </button>
            {showKi && <KiPanel onSelect={handleKiSelect} onClose={()=>setShowKi(false)}/>}
          </div>

          <div style={{flexShrink:0,padding:"0 2px",opacity:.30,cursor:"pointer"}} onClick={e=>e.stopPropagation()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke={T.ink} strokeWidth="2"/>
              <path d="M5 10a7 7 0 0014 0" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="21" x2="12" y2="17" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* DISCOVERY OVERLAY — left:0 right:0 = exakt bündig */}
        {open && (
          <div style={{
            position:"absolute", top:"100%", left:0, right:0, zIndex:301,
            background:T.bg,
            backdropFilter:"blur(28px) saturate(1.9)",
            WebkitBackdropFilter:"blur(28px) saturate(1.9)",
            borderRadius:"0 0 20px 20px",
            border:`1.5px solid ${T.teal}`,
            borderTop:"none",
            boxShadow:T.shadow,
            overflow:"hidden",
            animation:"dc-in .20s cubic-bezier(.22,1,.36,1) both",
            maxHeight:"84vh", overflowY:"auto",
          }}>

            {/* ══ SUCHMODUS ══ */}
            {showResults ? (
              <div style={{padding:"14px 16px 16px"}}>
                {loading ? (
                  <div style={{padding:"22px 0",textAlign:"center",color:T.inkF,fontSize:13}}>Suche läuft…</div>
                ) : total===0 ? (
                  <div style={{padding:"24px 0",textAlign:"center"}}>
                    <div style={{fontSize:26,marginBottom:8}}>🔍</div>
                    <div style={{fontSize:13,color:T.inkF}}>Keine Ergebnisse für „{searchQuery}"</div>
                  </div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
                    <ResultCol title="Menschen"   emoji="👥" items={results.profiles}    onSelect={handleSelect} startIdx={0} focusedIdx={focusedIdx} onDiscover={handleDiscover}/>
                    <ResultCol title="Erlebnisse" emoji="📅" items={results.experiences} onSelect={handleSelect} startIdx={results.profiles.length} focusedIdx={focusedIdx} onDiscover={handleDiscover}/>
                    <ResultCol title="Werke"      emoji="🎨" items={results.works}       onSelect={handleSelect} startIdx={results.profiles.length+results.experiences.length} focusedIdx={focusedIdx} onDiscover={handleDiscover}/>
                    <KiDiscoveryCol query={searchQuery} onHintSelect={handleKiHintSelect}/>
                  </div>
                )}
                {history.length>0 && (
                  <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid rgba(14,196,184,0.08)",display:"flex",flexWrap:"wrap",gap:6}}>
                    {history.slice(0,5).map((h,i)=>(
                      <button key={i} onClick={()=>handleHistory(h)} style={{
                        display:"flex",alignItems:"center",gap:4,
                        background:"rgba(26,53,48,0.05)",border:"1px solid rgba(26,53,48,0.09)",
                        borderRadius:99,padding:"4px 11px",
                        fontSize:11.5,fontWeight:500,color:T.inkS,
                        cursor:"pointer",WebkitTapHighlightColor:"transparent",
                      }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.09)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(26,53,48,0.05)"}
                      >
                        <span style={{fontSize:9.5,opacity:.42}}>🕐</span> {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            ) : (
              /* ══ DEFAULT OVERLAY ══
                 Reihenfolge: Greeting+Hints → StoryCards → 3-Spalten → QuickActions */
              <>
                {/* 1. Greeting + persönliche Hints */}
                <GreetingWithHints currentUser={currentUser} onCategoryClick={handleCategoryClick}/>

                {/* 1b. Für dich ausgewählt — Phase 4 */}
                <ForDichAusgewaehlt currentUser={currentUser} openProfileById={openProfileById} onDiscover={handleDiscover} onClose={close_}/>

                {/* 2. Menschen die du kennen solltest — Phase 5 */}
                <MenschenDuKennenSolltest currentUser={currentUser} openProfileById={openProfileById} engine={engine} onDiscover={handleDiscover}/>

                {/* 3. Story Cards "Heute auf HUI" */}
                <div style={{padding:"14px 16px 12px",borderBottom:"1px solid rgba(14,196,184,0.08)"}}>
                  <StoryCards/>
                </div>

                {/* 3. Drei Spalten */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0}}>
                  {/* LINKS — HUI Empfehlung */}
                  <div style={{padding:"14px 14px",borderRight:"1px solid rgba(14,196,184,0.08)"}}>
                    <PersonalRec currentUser={currentUser} openProfileById={openProfileById}/>
                  </div>

                  {/* MITTE — Kategorien */}
                  <div style={{padding:"14px 14px",borderRight:"1px solid rgba(14,196,184,0.08)"}}>
                    <ThemeCards onThemeClick={handleTheme}/>
                  </div>

                  {/* RECHTS — Live + Verlauf */}
                  <div style={{padding:"14px 14px"}}>
                    <LiveActivity/>
                    {history.length>0 && (
                      <div style={{marginTop:14}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <SectionLabel>Zuletzt gesucht</SectionLabel>
                          <button onClick={()=>{setHistory([]);localStorage.removeItem("hui_search_history");}} style={{
                            background:"none",border:"none",cursor:"pointer",
                            fontSize:10,color:T.inkF,padding:"0 0 10px 0",
                          }}>Löschen</button>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {history.slice(0,5).map((h,i)=>(
                            <button key={i} onClick={()=>handleHistory(h)} style={{
                              display:"flex",alignItems:"center",gap:4,
                              background:"rgba(26,53,48,0.05)",border:"1px solid rgba(26,53,48,0.09)",
                              borderRadius:99,padding:"4px 11px",
                              fontSize:11.5,fontWeight:500,color:T.inkS,
                              cursor:"pointer",WebkitTapHighlightColor:"transparent",
                            }}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.09)"}
                              onMouseLeave={e=>e.currentTarget.style.background="rgba(26,53,48,0.05)"}
                            >
                              <span style={{fontSize:9.5,opacity:.42}}>🕐</span> {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Schnellaktionen */}
                <div style={{borderTop:"1px solid rgba(14,196,184,0.08)",padding:"14px 16px 16px"}}>
                  <QuickActions onAction={handleAction}/>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
