// src/pages/DiscoverPage.jsx — HUI Redesign v3 (2026-05-30)
// ══════════════════════════════════════════════════════════════════
// DESIGN REFERENZ: Screenshot 2026-05-30
// Reihenfolge: Suche → Heute auf HUI → Menschen → Momente → Werke → Erlebnisse → Projekte → Orte
// KEINE Kategorie-Pills (HUI-Orb übernimmt Themennavigation)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate }   from "react-router-dom";
import { supabase }      from "../lib/supabaseClient.js";
import { formatPresence } from "../lib/usePresence.js";

// ── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:       "#F8F7F4",
  white:    "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.18)",
  coral:    "#E8573A",
  coralSoft:"rgba(232,87,58,0.10)",
  ink:      "#1A3530",
  inkSoft:  "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.32)",
  border:   "rgba(26,53,48,0.07)",
  px:       16,
  cardShadow:"0 2px 14px rgba(26,53,48,0.07), 0 1px 3px rgba(26,53,48,0.04)",
  cardShadowHover:"0 6px 24px rgba(26,53,48,0.11), 0 2px 8px rgba(26,53,48,0.06)",
};

// ── Global CSS ───────────────────────────────────────────────────
const CSS = `
  .dp-root * { box-sizing:border-box; }
  .dp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; overscroll-behavior-x:none; }
  .dp-hscroll::-webkit-scrollbar { display:none; }
  .dp-press { transition:transform .14s cubic-bezier(.22,1,.36,1),opacity .14s ease; cursor:pointer; }
  .dp-press:active { transform:scale(0.94); opacity:0.80; }
  @keyframes dp-in  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dp-shim { from{background-position:-200% 0} to{background-position:200% 0} }
  .dp-in  { animation:dp-in .45s ease both; }
  .dp-skel {
    background:linear-gradient(90deg,rgba(26,53,48,.05) 25%,rgba(26,53,48,.09) 50%,rgba(26,53,48,.05) 75%);
    background-size:200% 100%;
    animation:dp-shim 1.4s ease-in-out infinite;
    border-radius:12px;
  }
  .dp-card-hover { transition:box-shadow .18s ease, transform .18s cubic-bezier(.22,1,.36,1); }
  .dp-card-hover:hover { box-shadow:0 6px 24px rgba(26,53,48,0.11)!important; transform:translateY(-2px); }
  @keyframes dp-live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
  .dp-live-dot { animation:dp-live-pulse 2.2s ease-in-out infinite; }
  /* List view */
  .dp-list-section { display:flex; flex-direction:column; gap:10px; padding:0 16px; }
  .dp-list-card { display:flex; align-items:center; gap:12px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 14px rgba(26,53,48,0.07),0 1px 3px rgba(26,53,48,0.04); border:1px solid rgba(26,53,48,0.07); padding:10px; cursor:pointer; transition:transform .14s,opacity .14s; }
  .dp-list-card:active { transform:scale(0.97); opacity:0.82; }
  .dp-list-thumb { width:58px; height:58px; border-radius:12px; object-fit:cover; flex-shrink:0; background:rgba(14,196,184,0.08); }
  .dp-list-thumb-placeholder { width:58px; height:58px; border-radius:12px; flex-shrink:0; background:rgba(14,196,184,0.08); display:flex; align-items:center; justify-content:center; font-size:22px; }
  /* Toggle animation */
  @keyframes dp-toggle-in { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  .dp-toggle-in { animation:dp-toggle-in .18s ease both; }
  /* Live Activity Bar */
  @keyframes dp-activity-slide { from{transform:translateX(8px);opacity:0} to{transform:translateX(0);opacity:1} }
  .dp-activity-card { animation:dp-activity-slide .35s cubic-bezier(.22,1,.36,1) both; }
  /* Online Pulse */
  @keyframes dp-online-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 0 4px rgba(34,197,94,0)} }
  .dp-online-pulse { animation:dp-online-pulse 2.4s ease-in-out infinite; }
  /* Stat card hover */
  .dp-stat-card { transition:transform .15s ease,box-shadow .15s ease; cursor:default; }
  .dp-stat-card:hover { transform:translateY(-2px); }
  /* Projekt Hero */
  .dp-projekt-hero { transition:transform .2s ease,box-shadow .2s ease; cursor:pointer; }
  .dp-projekt-hero:hover { transform:scale(1.01); }
  /* Tag pills */
  .dp-tag { display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:600;cursor:default; }
  /* Moment engagement row */
  .dp-engage { display:flex;align-items:center;gap:10px;font-size:10px;color:rgba(26,53,48,0.50); }
  .dp-engage span { display:flex;align-items:center;gap:3px; }
`;

// ── Helpers ──────────────────────────────────────────────────────
const safeStr = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
const safeNum = (v, fb=0)  => (typeof v === "number" && isFinite(v) ? v : fb);
const safeArr = (v)         => (Array.isArray(v) ? v : []);
const fmtImpact = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000 / 3600;
  if (diff < 1) return "vor " + Math.round(diff*60) + " Min";
  if (diff < 24) return "vor " + Math.round(diff) + " Std";
  return "vor " + Math.round(diff/24) + " Tagen";
};

// ── View Toggle ──────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:2,
      background:"rgba(26,53,48,0.06)",
      borderRadius:12, padding:3,
      backdropFilter:"blur(8px)",
    }}>
      {[
        { key:"cards", icon:(
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="1" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )},
        { key:"list", icon:(
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        )},
      ].map(btn => {
        const active = view === btn.key;
        return (
          <button key={btn.key} onClick={() => onChange(btn.key)} style={{
            width:30, height:28, borderRadius:9, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            background: active ? "white" : "transparent",
            color: active ? "#0EC4B8" : "rgba(26,53,48,0.45)",
            boxShadow: active ? "0 1px 6px rgba(26,53,48,0.10), 0 0 0 1px rgba(14,196,184,0.18)" : "none",
            transition:"background .16s, color .16s, box-shadow .16s",
            WebkitTapHighlightColor:"transparent",
            touchAction:"manipulation",
          }}>
            {btn.icon}
          </button>
        );
      })}
    </div>
  );
}

// ── Section Empty State (Phase 2.1 — Authentizität) ───────────────
function SectionEmpty({ icon, label, sub }) {
  return (
    <div style={{
      margin: `0 ${T.px}px`,
      padding: "32px 20px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.65)",
      border: `1px solid ${T.border}`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 6, letterSpacing: "-0.02em" }}>{label}</div>
      {sub && <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55, maxWidth: 280, margin: "0 auto" }}>{sub}</div>}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────
function Skel({ w="100%", h=14, r=10, mb=0 }) {
  return <div className="dp-skel" style={{ width:w, height:h, borderRadius:r, marginBottom:mb }} />;
}

// ── Section Header ────────────────────────────────────────────────
function SectionHead({ title, sub, action, onAction, delay=0 }) {
  return (
    <div className="dp-in" style={{
      display:"flex", alignItems:"flex-end", justifyContent:"space-between",
      padding:`0 ${T.px}px`, marginBottom:14,
      animationDelay:`${delay}ms`,
    }}>
      <div>
        <div style={{ fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", lineHeight:1.2 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize:12, color:T.inkFaint, marginTop:3, fontWeight:400 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          fontSize:12.5, fontWeight:600, color:T.teal,
          display:"flex", alignItems:"center", gap:4,
          touchAction:"manipulation", WebkitTapHighlightColor:"transparent",
        }}>
          {action} <span style={{ fontSize:13 }}>›</span>
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. TITELBEREICH (Suchleiste entfernt — globale Suche im Header)
// ════════════════════════════════════════════════════════════════
function SearchBar({ view, onViewChange }) {
  return (
    <div style={{
      padding:`12px ${T.px}px 8px`,
      background:T.bg,
    }}>
      {/* Title Row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22, fontWeight:900, color:T.ink, letterSpacing:"-0.04em" }}>Entdecken</span>
          <span style={{ fontSize:18 }}>🌿</span>
        </div>
        {/* View Toggle — oben rechts */}
        <ViewToggle view={view} onChange={onViewChange} />
      </div>
      <div style={{ fontSize:12.5, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
        Menschen, Werke, Erlebnisse & Orte, die HUI lebendig machen.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1b. LIVE ACTIVITY BAR — nur bei echten Aktivitäten (Phase 2.1)
// ════════════════════════════════════════════════════════════════
function ActivityCard({ act, idx, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && act.avatar) ? act.avatar : null;
  return (
    <div className="dp-activity-card dp-press" onClick={() => onPress?.(act)} style={{
      width:155, flexShrink:0,
      background:"rgba(255,255,255,0.88)",
      backdropFilter:"blur(12px)",
      borderRadius:16,
      border:"1px solid rgba(255,255,255,0.70)",
      boxShadow:"0 2px 12px rgba(26,53,48,0.07)",
      padding:"11px 11px 10px",
      animationDelay:`${idx*60}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column", gap:8,
    }}>
      {/* Top: avatar + name + time */}
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <div style={{
          width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden",
          background:av ? "transparent" : "rgba(14,196,184,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center",
          border:"1.5px solid rgba(14,196,184,0.20)",
        }}>
          {av ? <img src={av} alt={act.name} onError={() => setImgErr(true)} style={{ width:"100%",height:"100%",objectFit:"cover" }}/> : <span style={{fontSize:12}}>👤</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#1A3530", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{act.name}</div>
          <div style={{ fontSize:9.5, color:"rgba(26,53,48,0.40)", fontWeight:500 }}>{act.ago}</div>
        </div>
      </div>
      {/* Action text */}
      <div style={{
        fontSize:11, color:"rgba(26,53,48,0.72)", lineHeight:1.4, fontWeight:400,
        overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>{act.action}</div>
      {/* Type badge */}
      <div style={{
        alignSelf:"flex-start",
        background:`${act.typeColor}18`,
        color:act.typeColor,
        borderRadius:99, padding:"2px 8px",
        fontSize:9, fontWeight:700, letterSpacing:".03em",
        display:"flex", alignItems:"center", gap:3,
      }}>
        <span>{act.typeEmoji}</span>{act.type}
      </div>
    </div>
  );
}

function LiveActivityBar({ activities, onPersonPress }) {
  if (!activities?.length) return null;
  return (
    <div style={{ padding:`4px 16px 14px`, marginBottom:0 }}>
      <div style={{
        background:"linear-gradient(135deg,rgba(14,196,184,0.05) 0%,rgba(232,87,58,0.03) 100%)",
        border:"1px solid rgba(14,196,184,0.12)",
        borderRadius:20, padding:"14px 0 14px 14px", overflow:"hidden",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, paddingRight:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div className="dp-live-dot" style={{ width:7,height:7,borderRadius:"50%",background:"#0EC4B8" }}/>
            <span style={{ fontSize:14, fontWeight:800, color:"#1A3530", letterSpacing:"-0.03em" }}>Jetzt auf HUI</span>
          </div>
          <div style={{
            background:"rgba(14,196,184,0.12)", border:"1px solid rgba(14,196,184,0.22)",
            borderRadius:99, padding:"1px 7px",
            fontSize:9, fontWeight:700, color:"#0EC4B8", letterSpacing:".04em",
          }}>Live</div>
        </div>
        <div className="dp-hscroll" style={{ display:"flex", gap:8, paddingRight:14 }}>
          {activities.map((act, i) => <ActivityCard key={act.id} act={act} idx={i} onPress={onPersonPress}/>)}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. HEUTE AUF HUI
// ════════════════════════════════════════════════════════════════
const STAT_DEFS = [
  { key:"momente",    emoji:"🌱", label:"neue Momente",    color:"#16A34A", bg:"rgba(22,163,74,0.09)"   },
  { key:"begegnungen",emoji:"🤝", label:"neue Begegnungen",color:T.teal,    bg:T.tealSoft               },
  { key:"werke",      emoji:"🎨", label:"neue Werke",      color:"#9333EA", bg:"rgba(147,51,234,0.09)"  },
  { key:"erlebnisse", emoji:"📅", label:"aktive Erlebnisse",color:T.coral,  bg:T.coralSoft              },
  { key:"projekte",   emoji:"🌍", label:"neue Projekte",   color:"#D97706", bg:"rgba(217,119,6,0.09)"   },
];

function TodayStats({ stats, onScrollTo, loading }) {
  const values = STAT_DEFS.map((d) => stats?.[d.key] ?? 0);
  const hasAny = values.some((v) => v > 0);
  if (!loading && !hasAny) return null;

  return (
    <div className="dp-in" style={{ padding:`0 ${T.px}px 14px`, animationDelay:"40ms" }}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(135deg, rgba(14,196,184,0.06) 0%, rgba(232,87,58,0.04) 100%)`,
        border:`1px solid rgba(14,196,184,0.12)`,
        borderRadius:20,
        padding:"16px 16px 14px",
        position:"relative", overflow:"hidden",
      }}>
        {/* Live badge */}
        <div style={{
          display:"flex", alignItems:"center", gap:6, marginBottom:14,
        }}>
          <span style={{ fontSize:14, fontWeight:800, color:T.ink, letterSpacing:"-0.03em" }}>
            Heute auf HUI entdecken
          </span>
          <div style={{
            display:"flex", alignItems:"center", gap:5,
            background:"rgba(14,196,184,0.12)", border:"1px solid rgba(14,196,184,0.20)",
            borderRadius:99, padding:"2px 8px",
          }}>
            <div className="dp-live-dot" style={{
              width:6, height:6, borderRadius:"50%", background:T.teal,
            }}/>
            <span style={{ fontSize:10, fontWeight:700, color:T.teal, letterSpacing:".04em" }}>Live</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", gap:10, overflowX:"auto" }} className="dp-hscroll">
          {STAT_DEFS.map((def, i) => (
            <div key={def.key} className="dp-stat-card dp-press" onClick={() => onScrollTo?.(def.key)} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              background:T.white, borderRadius:14, padding:"12px 10px",
              minWidth:72, boxShadow:T.cardShadow, flexShrink:0,
              border:`1px solid ${T.border}`,
              cursor:"pointer", touchAction:"manipulation",
              animationDelay:`${i*30}ms`,
            }}>
              <span style={{ fontSize:20, marginBottom:6 }}>{def.emoji}</span>
              <span style={{
                fontSize:22, fontWeight:900, color:def.color,
                letterSpacing:"-0.04em", lineHeight:1,
              }}>
                {stats?.[def.key] ?? 0}
              </span>
              <span style={{
                fontSize:9.5, color:T.inkFaint, marginTop:4,
                textAlign:"center", lineHeight:1.3, fontWeight:500,
              }}>
                {def.label}
              </span>
            </div>
          ))}
        </div>

        {/* Dekorative Illustration rechts */}
        <div style={{
          position:"absolute", right:12, bottom:8, opacity:0.18,
          fontSize:36, userSelect:"none", pointerEvents:"none",
        }}>
          🌅
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. MENSCHEN ENTDECKEN
// ════════════════════════════════════════════════════════════════
// Interesse-Tags pro Person — deterministisch aus index
const INTEREST_POOLS = ["Natur","Musik","Kunst","Gemeinschaft","Spiritualität","Nachhaltigkeit","Fotografie","Design","Bildung","Umwelt"];
function personTags(person, max=2) {
  if (person.interests?.length) return person.interests.slice(0,max);
  // deterministisch aus Name-Hashcode
  const code = String(person.name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const start = code % INTEREST_POOLS.length;
  return [INTEREST_POOLS[start % INTEREST_POOLS.length], INTEREST_POOLS[(start+3) % INTEREST_POOLS.length]];
}

function PersonCard({ person, onPress, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && person.avatar) ? person.avatar : null;
  const presence = formatPresence(person.last_seen_at);
  const tags = personTags(person, 2);

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(person)} style={{
      width:135, flexShrink:0,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"14px 10px 12px",
      background:T.white,
      borderRadius:20,
      boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      position:"relative",
    }}>
      {/* Avatar + Online-Dot */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <div style={{
          width:72, height:72, borderRadius:"50%", overflow:"hidden",
          border:`2.5px solid ${T.white}`,
          boxShadow:`0 0 0 2.5px rgba(14,196,184,0.30), 0 4px 14px rgba(26,53,48,0.12)`,
          background:av ? "transparent" : T.tealSoft,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {av ? (
            <img src={av} alt={person.name} onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          ) : (
            <span style={{ fontSize:26, userSelect:"none" }}>👤</span>
          )}
        </div>
        {/* Online-Status Dot */}
        <div style={{
          position:"absolute", bottom:2, right:2,
          width:14, height:14, borderRadius:"50%",
          background: presence?.online ? "#22c55e" : presence ? "rgba(200,200,200,0.9)" : "rgba(200,200,200,0.9)",
          border:"2px solid white",
          boxShadow: presence?.online ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
        }} className={presence?.online ? "dp-online-pulse" : ""}/>
      </div>

      {/* Name */}
      <div style={{
        fontSize:12.5, fontWeight:700, color:T.ink, textAlign:"center",
        letterSpacing:"-0.02em", lineHeight:1.25, marginBottom:3,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.name}
      </div>

      {/* Bio */}
      <div style={{
        fontSize:10.5, color:T.inkSoft, textAlign:"center", lineHeight:1.4,
        marginBottom:6, fontWeight:400,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.bio}
      </div>

      {/* Online-Status Text */}
      {presence && (
        <div style={{
          fontSize:10, fontWeight:600, marginBottom:6,
          color: presence.online ? "#22c55e" : "rgba(26,53,48,0.42)",
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span style={{
            display:"inline-block", width:6, height:6, borderRadius:"50%",
            background:presence.dot, flexShrink:0,
          }}/>
          {presence.label}
        </div>
      )}

      {/* Interesse-Tags */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", justifyContent:"center", marginBottom:8 }}>
        {tags.map(t => (
          <span key={t} className="dp-tag" style={{ background:"rgba(14,196,184,0.09)", color:T.teal }}>
            {t}
          </span>
        ))}
      </div>

      {/* Location */}
      {person.location && (
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          fontSize:10, color:T.inkFaint, marginBottom:8,
        }}>
          <span style={{ fontSize:9 }}>📍</span>
          <span style={{ fontWeight:500 }}>{person.location}</span>
        </div>
      )}

      {/* Impact — stärker hervorgehoben */}
      <div style={{
        display:"flex", alignItems:"center", gap:4,
        background:`linear-gradient(135deg,rgba(14,196,184,0.12),rgba(14,196,184,0.06))`,
        borderRadius:99, padding:"4px 10px",
        border:"1px solid rgba(14,196,184,0.18)",
      }}>
        <span style={{ fontSize:11 }}>⚡</span>
        <span style={{ fontSize:11.5, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
          {fmtImpact(person.impact)} Wirkung
        </span>
      </div>
    </div>
  );
}

function PeopleSection({ people, onPersonPress, loading, delay=0, view='cards', onSectionAction }) {
  return (
    <div className="dp-in" style={{ animationDelay:`${delay}ms` }}>
      <div data-dp-people/>
      <SectionHead
        title="Inspiring Menschen"
        sub="Entdecke wundervolle Menschen auf HUI."
        action="Alle anzeigen"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{
          display:"flex", gap:10,
          paddingLeft:T.px, paddingRight:T.px, paddingBottom:4,
        }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:130, flexShrink:0, borderRadius:20, overflow:"hidden", background:T.white, boxShadow:T.cardShadow, padding:"14px 10px" }}>
                  <Skel w={72} h={72} r={99} mb={10} />
                  <Skel w="80%" h={12} r={8} mb={6} />
                  <Skel w="60%" h={10} r={6} mb={8} />
                  <Skel w="70%" h={10} r={6} />
                </div>
              ))
            : people.length === 0
              ? <SectionEmpty icon="🤝" label="Noch keine Menschen sichtbar" sub="Sobald Talente und Mitglieder auf HUI aktiv sind, erscheinen sie hier — echt und lebendig." />
              : people.map((p, i) => (
                <PersonCard key={p.id} person={p} onPress={onPersonPress} delay={i*40+delay} />
              ))
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12} /><div style={{flex:1}}><Skel w="70%" h={13} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : people.length === 0
              ? <SectionEmpty icon="🤝" label="Noch keine Menschen sichtbar" sub="Sobald Talente und Mitglieder auf HUI aktiv sind, erscheinen sie hier — echt und lebendig." />
              : people.map((p, i) => (
                <div key={p.id} className="dp-list-card" onClick={() => onPersonPress?.(p)}>
                  {p.avatar
                    ? <img src={p.avatar} alt={p.name} className="dp-list-thumb" onError={e => e.target.style.display='none'}/>
                    : <div className="dp-list-thumb-placeholder">👤</div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:3, letterSpacing:"-0.02em" }}>{p.name}</div>
                    <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:5, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.bio}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {p.location && <span style={{ fontSize:11, color:T.inkFaint }}>📍 {p.location}</span>}
                      <span style={{ fontSize:11, color:T.teal, fontWeight:600 }}>⚡ {fmtImpact(p.impact)}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. MOMENTE AUS DEINER NÄHE
// ════════════════════════════════════════════════════════════════
function MomentCard({ moment, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const ago = timeAgo(moment.created_at);

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(moment)} style={{
      width:175, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      background:"#111", position:"relative",
      boxShadow:T.cardShadow,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Bild */}
      <div style={{ width:"100%", height:130, position:"relative", overflow:"hidden" }}>
        {!imgErr && moment.src ? (
          <img src={moment.src} alt={moment.caption}
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${T.tealSoft},${T.coralSoft})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:32, opacity:0.4 }}>📸</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.65) 100%)" }}/>
        {/* Time badge */}
        <div style={{
          position:"absolute", top:8, left:8,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)",
          borderRadius:99, padding:"3px 8px",
          fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.9)",
        }}>
          {ago}
        </div>
      </div>

      {/* Live Badge — if fresh */}
      {moment.isLive && (
        <div style={{
          position:"absolute", top:8, right:8,
          background:"#E8573A", borderRadius:99, padding:"2px 7px",
          fontSize:9, fontWeight:700, color:"white", letterSpacing:".04em",
          display:"flex", alignItems:"center", gap:4,
        }}>
          <div className="dp-live-dot" style={{ width:5,height:5,borderRadius:"50%",background:"white" }}/>
          Live
        </div>
      )}
      {/* Caption */}
      <div style={{ background:T.white, padding:"10px 10px 10px" }}>
        <div style={{
          fontSize:11.5, fontWeight:600, color:T.ink, lineHeight:1.35,
          marginBottom:6,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {moment.caption}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:7 }}>
          <div style={{
            width:18, height:18, borderRadius:"50%",
            background:T.tealSoft,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9, flexShrink:0,
          }}>👤</div>
          <span style={{ fontSize:10.5, fontWeight:600, color:T.inkSoft }}>{moment.name}</span>
          {moment.location && (
            <>
              <span style={{ fontSize:9, color:T.inkFaint }}>·</span>
              <span style={{ fontSize:10, color:T.inkFaint }}>📍 {moment.location}</span>
            </>
          )}
        </div>
        {(moment.likes > 0 || moment.comments > 0 || moment.wirkung > 0) && (
          <div className="dp-engage">
            {moment.likes > 0 && <span>❤️ {moment.likes}</span>}
            {moment.comments > 0 && <span>💬 {moment.comments}</span>}
            {moment.wirkung > 0 && <span>🌱 {moment.wirkung}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function MomenteSection({ momente, loading, delay=0, view='cards', onPress, onSectionAction }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-momente/>
      <SectionHead
        title="Momente aus deiner Nähe"
        sub="Echte Geschichten, gerade jetzt."
        action="Alle anzeigen"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:175, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={130} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={6}/></div>
                </div>
              ))
            : momente.length === 0
              ? <SectionEmpty icon="🌱" label="Noch keine Momente" sub="Echte Geschichten aus der Community erscheinen hier, sobald jemand sie teilt." />
              : momente.map((m, i) => <MomentCard key={m.id} moment={m} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : momente.map((m) => (
                <div key={m.id} className="dp-list-card" onClick={() => onPress?.(m)} style={{cursor:"pointer"}}>
                  {m.src
                    ? <img src={m.src} alt={m.caption} className="dp-list-thumb" onError={e => e.target.style.display='none'} style={{ objectFit:"cover" }}/>
                    : <div className="dp-list-thumb-placeholder">📸</div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", lineHeight:1.35 }}>{m.caption}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:T.inkSoft }}>{m.name}</span>
                      {m.location && <span style={{ fontSize:11, color:T.inkFaint }}>📍 {m.location}</span>}
                      <span style={{ fontSize:10.5, color:T.inkFaint }}>{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. WERKE ENTDECKEN
// ════════════════════════════════════════════════════════════════
const MEDIUM_COLOR = {
  "Malerei":    { bg:"rgba(147,51,234,0.12)",  text:"#9333EA" },
  "Musik":      { bg:"rgba(14,196,184,0.12)",  text:T.teal    },
  "Fotografie": { bg:"rgba(22,163,74,0.12)",   text:"#16A34A" },
  "Illustration":{ bg:"rgba(232,87,58,0.12)", text:T.coral    },
  "Skulptur":   { bg:"rgba(245,158,11,0.12)",  text:"#D97706" },
  "Text":       { bg:"rgba(100,116,139,0.12)", text:"#64748B" },
};

function WerkCard({ werk, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover  = (!imgErr && werk.cover) ? werk.cover : null;
  const medCol = MEDIUM_COLOR[werk.medium] || { bg:T.tealSoft, text:T.teal };
  const priceStr = werk.price != null
    ? parseFloat(werk.price).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €"
    : null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(werk)} style={{
      width:165, flexShrink:0,
      borderRadius:16, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : medCol.bg }}>
        {cover ? (
          <img src={cover} alt={werk.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <span style={{ fontSize:32, opacity:0.4 }}>🎨</span>
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {werk.medium && (
          <div style={{
            position:"absolute", top:8, left:8,
            background: cover ? "rgba(0,0,0,0.54)" : medCol.bg,
            backdropFilter: cover ? "blur(6px)" : "none",
            borderRadius:99, padding:"2px 9px",
            fontSize:9, fontWeight:700,
            color: cover ? "rgba(255,255,255,0.92)" : medCol.text,
            letterSpacing:".03em",
          }}>
            {werk.medium}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 11px 12px" }}>
        {/* Titel */}
        <div style={{
          fontSize:13, fontWeight:700, color:T.ink,
          marginBottom:3, letterSpacing:"-0.02em", lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {werk.title}
        </div>

        {/* Autor */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von {werk.author}
        </div>

        {/* Standort falls vorhanden */}
        {werk.location && (
          <div style={{
            fontSize:10, color:T.inkFaint, marginBottom:6,
            display:"flex", alignItems:"center", gap:3,
          }}>
            <span style={{ fontSize:9 }}>📍</span>
            <span style={{
              overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
            }}>{werk.location}</span>
          </div>
        )}

        {/* Preis — prominente Teal-Farbe */}
        {/* Price row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          {priceStr ? (
            <div style={{ fontSize:14, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
              {priceStr}
            </div>
          ) : (
            <div style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Nicht zum Verkauf</div>
          )}
        </div>
        {/* Likes + Views */}
        {(werk.likes > 0 || werk.views > 0) && (
          <div className="dp-engage">
            {werk.likes > 0 && <span>❤️ {werk.likes}</span>}
            {werk.views > 0 && <span>👁 {werk.views}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function WerkeSection({ werke, loading, delay=0, view='cards', onPress, onSectionAction }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-werke/>
      <SectionHead
        title="Werke entdecken"
        sub="Kunst, Musik, Fotografie & mehr von der HUI Community."
        action="Alle Werke"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:145, flexShrink:0, borderRadius:16, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={100} r={0} mb={0}/>
                  <div style={{ padding:"9px 10px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div>
                </div>
              ))
            : werke.length === 0
              ? <SectionEmpty icon="🎨" label="Noch keine Werke" sub="Kreative Werke erscheinen hier, sobald Talente sie veröffentlichen." />
              : werke.map((w, i) => <WerkCard key={w.id} werk={w} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="70%" h={12} r={6} mb={6}/><Skel w="40%" h={10} r={5}/></div></div>
              ))
            : werke.map((w) => {
                const medCol = MEDIUM_COLOR[w.medium] || { bg:T.tealSoft, text:T.teal };
                const priceStr = w.price != null
                  ? parseFloat(w.price).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €"
                  : null;
                return (
                  <div key={w.id} className="dp-list-card" onClick={() => onPress?.(w)} style={{cursor:"pointer"}}>
                    <div className="dp-list-thumb-placeholder" style={{ background: w.cover ? "#1A1A18" : medCol.bg }}>
                      {w.cover
                        ? <img src={w.cover} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} onError={e => e.currentTarget.style.display="none"}/>
                        : <span style={{ fontSize:20 }}>🎨</span>
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em",
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:4 }}>von {w.author}</div>
                      {w.location && (
                        <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:4, display:"flex", alignItems:"center", gap:3 }}>
                          <span style={{ fontSize:9 }}>📍</span>
                          <span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.location}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {w.medium && (
                          <span style={{ fontSize:10.5, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"2px 8px", fontWeight:600 }}>{w.medium}</span>
                        )}
                        {priceStr && (
                          <span style={{ fontSize:12, fontWeight:800, color:T.teal }}>{priceStr}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. ERLEBNISSE FÜR DICH
// ════════════════════════════════════════════════════════════════
function ErlebnisCard({ erlebnis, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && erlebnis.cover) ? erlebnis.cover : null;

  // Status-Farben
  const STATUS_DOT = {
    "Aktiv":        "#16A34A",
    "Geplant":      "#D97706",
    "Abgeschlossen":"rgba(26,26,46,0.35)",
  };
  const statusDot   = STATUS_DOT[erlebnis.statusLabel] || T.inkFaint;
  const statusColor = erlebnis.statusColor || T.inkFaint;

  console.log("[DISCOVER EXPERIENCE CARD]", {
    id:     erlebnis.id,
    title:  erlebnis.title,
    status: erlebnis.statusLabel,
    cover:  !!erlebnis.cover,
    type:   erlebnis.typeLabel,
  });

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(erlebnis)} style={{
      width:165, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : T.tealSoft }}>
        {cover ? (
          <img src={cover} alt={erlebnis.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.88 }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:36, opacity:0.35 }}>📅</span>
          </div>
        )}

        {/* Datum-Block oben links — nur wenn Datum vorhanden */}
        {erlebnis.date && (
          <div style={{
            position:"absolute", top:8, left:8,
            background:"rgba(255,255,255,0.94)", backdropFilter:"blur(8px)",
            borderRadius:10, padding:"5px 9px", textAlign:"center", minWidth:36,
          }}>
            <div style={{ fontSize:16, fontWeight:900, color:T.ink, lineHeight:1 }}>
              {erlebnis.date}
            </div>
            {erlebnis.month && (
              <div style={{ fontSize:8.5, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:".04em", marginTop:1 }}>
                {erlebnis.month}
              </div>
            )}
          </div>
        )}

        {/* Typ-Badge oben rechts */}
        {erlebnis.typeLabel && (
          <div style={{
            position:"absolute", top:8, right:8,
            background: cover ? "rgba(0,0,0,0.50)" : "rgba(14,196,184,0.15)",
            backdropFilter: cover ? "blur(6px)" : "none",
            borderRadius:99, padding:"2px 8px",
            fontSize:9, fontWeight:700,
            color: cover ? "rgba(255,255,255,0.92)" : T.teal,
            letterSpacing:".03em",
          }}>
            {erlebnis.typeLabel}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 11px 12px" }}>
        {/* Titel */}
        <div style={{
          fontSize:13, fontWeight:700, color:T.ink, marginBottom:5,
          letterSpacing:"-0.02em", lineHeight:1.3,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {erlebnis.title}
        </div>

        {/* Standort */}
        {erlebnis.location && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
            <span style={{ fontSize:9.5, color:T.inkFaint }}>📍</span>
            <span style={{
              fontSize:10.5, color:T.inkFaint, fontWeight:500,
              overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
            }}>
              {erlebnis.location}
            </span>
          </div>
        )}

        {/* Dauer falls vorhanden */}
        {erlebnis.time && (
          <div style={{ fontSize:10.5, color:T.teal, fontWeight:600, marginBottom:4 }}>
            {erlebnis.time}
          </div>
        )}

        {/* Status-Dot */}
        {erlebnis.statusLabel && (
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{
              width:6, height:6, borderRadius:"50%",
              background:statusDot, flexShrink:0, display:"inline-block",
            }}/>
            <span style={{ fontSize:10.5, fontWeight:600, color:statusColor }}>
              {erlebnis.statusLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ErlebnisseSection({ erlebnisse, loading, delay=0, view='cards', onPress, onSectionAction }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-erlebnisse/>
      <SectionHead
        title="Erlebnisse für dich"
        sub="Workshops, Treffen, Kurse & besondere Momente."
        action="Alle Erlebnisse"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:155, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={105} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="55%" h={10} r={5}/></div>
                </div>
              ))
            : erlebnisse.length === 0
              ? <SectionEmpty icon="📅" label="Noch keine Erlebnisse" sub="Workshops, Retreats und Begegnungen erscheinen hier, sobald sie geplant sind." />
              : erlebnisse.map((e, i) => <ErlebnisCard key={e.id} erlebnis={e} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : erlebnisse.map((e) => {
                const statusDot = {
                  "Aktiv":"#16A34A", "Geplant":"#D97706",
                }[e.statusLabel] || "rgba(26,26,46,0.30)";
                return (
                  <div key={e.id} className="dp-list-card">
                    <div className="dp-list-thumb-placeholder" style={{ background: e.cover ? "#1A1A18" : T.tealSoft, position:"relative", overflow:"hidden" }}>
                      {e.cover
                        ? <img src={e.cover} alt={e.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={ev => ev.currentTarget.style.display="none"}/>
                        : <span style={{ fontSize:20 }}>📅</span>
                      }
                      {e.date && (
                        <div style={{ position:"absolute", bottom:3, left:0, right:0, textAlign:"center",
                          background:"rgba(0,0,0,0.45)", padding:"1px 0" }}>
                          <span style={{ fontSize:9, fontWeight:800, color:"white" }}>{e.date} {e.month}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em",
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{e.title}</div>
                      {e.typeLabel && (
                        <div style={{ fontSize:11, color:T.teal, fontWeight:600, marginBottom:3 }}>{e.typeLabel}</div>
                      )}
                      {e.location && (
                        <div style={{ fontSize:11, color:T.inkFaint, marginBottom:3 }}>📍 {e.location}</div>
                      )}
                      {e.statusLabel && (
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:statusDot, display:"inline-block" }}/>
                          <span style={{ fontSize:10.5, fontWeight:600, color:e.statusColor }}>{e.statusLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 7. PROJEKTE & INITIATIVEN
// ════════════════════════════════════════════════════════════════
function ProjektCard({ projekt, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && projekt.cover) ? projekt.cover : null;
  const cc = projekt.catColor || { bg:T.tealSoft, text:T.teal };

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(projekt)} style={{
      width:160, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:90, position:"relative", overflow:"hidden", background:cover?"#000":cc.bg }}>
        {cover ? (
          <img src={cover} alt={projekt.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.82 }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:28, opacity:0.4 }}>🌍</span>
          </div>
        )}
        {/* Category badge */}
        <div style={{
          position:"absolute", top:7, left:7,
          background:"rgba(255,255,255,0.90)", backdropFilter:"blur(6px)",
          borderRadius:99, padding:"2px 8px",
          fontSize:9, fontWeight:700, color:cc.text,
        }}>
          {projekt.cat}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:"10px 10px 11px" }}>
        <div style={{
          fontSize:12.5, fontWeight:700, color:T.ink, marginBottom:4,
          letterSpacing:"-0.02em", lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:1, WebkitBoxOrient:"vertical",
        }}>
          {projekt.title}
        </div>
        <div style={{
          fontSize:10.5, color:T.inkSoft, lineHeight:1.4, marginBottom:9,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {projekt.desc}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:11 }}>👥</span>
          <span style={{ fontSize:10.5, fontWeight:600, color:T.inkSoft }}>{projekt.members} Mitglieder</span>
        </div>
      </div>
    </div>
  );
}

function ProjekteSection({ projekte, loading, delay=0, view='cards', onPress, onSectionAction }) {
  const hero = projekte[0];
  const rest = projekte.slice(1);
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-projekte/>
      <SectionHead
        title="Projekte & Initiativen"
        sub="Gemeinsam echte Wirkung schaffen."
        action="Alle Projekte"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div style={{ paddingLeft:T.px, paddingRight:T.px }}>
          {/* ── Hero: Projekt der Woche ── */}
          {!loading && !hero && (
            <SectionEmpty icon="🌍" label="Noch keine Projekte" sub="Impact-Initiativen aus der Community erscheinen hier, sobald sie genehmigt sind." />
          )}
          {!loading && hero && (
            <div className="dp-projekt-hero dp-in" onClick={() => onPress?.(hero)} style={{
              position:"relative", borderRadius:20, overflow:"hidden",
              cursor:"pointer",
              height:180, marginBottom:10,
              background: hero.cover ? "#000" : "linear-gradient(135deg,rgba(14,196,184,0.15),rgba(232,87,58,0.10))",
              boxShadow:"0 6px 24px rgba(26,53,48,0.12)",
              animationDelay:`${delay}ms`,
            }}>
              {hero.cover && (
                <img src={hero.cover} alt={hero.title}
                  style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.75 }}
                  onError={e => e.target.style.display="none"}/>
              )}
              {/* Gradient */}
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.80) 0%,rgba(0,0,0,0.10) 60%)" }}/>
              {/* Badge */}
              <div style={{
                position:"absolute",top:12,left:12,
                background:"#D97706", borderRadius:99,
                padding:"3px 10px", fontSize:9.5, fontWeight:800,
                color:"white", letterSpacing:".04em",
              }}>🔥 Projekt der Woche</div>
              {/* Content */}
              <div style={{ position:"absolute",bottom:14,left:14,right:14 }}>
                <div style={{ fontSize:17, fontWeight:900, color:"white", letterSpacing:"-0.03em", marginBottom:4, lineHeight:1.2 }}>
                  {hero.title}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.72)", marginBottom:10, lineHeight:1.4 }}>
                  {hero.desc}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.80)", display:"flex", alignItems:"center", gap:4 }}>
                    <span>👥</span><span>{hero.members} Mitglieder</span>
                  </div>
                  <div onClick={() => onPress?.(hero)} style={{
                    background:"rgba(14,196,184,0.90)", backdropFilter:"blur(8px)",
                    borderRadius:99, padding:"5px 14px",
                    fontSize:11, fontWeight:700, color:"white",
                    cursor:"pointer", touchAction:"manipulation",
                    WebkitTapHighlightColor:"transparent",
                  }}>Projekt ansehen →</div>
                </div>
              </div>
            </div>
          )}
          {/* ── Restliche Projekte — horizontal scrollbar ── */}
          <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingBottom:4 }}>
            {loading
              ? Array.from({length:4}).map((_,i) => (
                  <div key={i} style={{ width:160, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                    <Skel w="100%" h={90} r={0} mb={0}/>
                    <div style={{ padding:"10px 10px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="60%" h={10} r={5}/></div>
                  </div>
                ))
              : rest.map((p, i) => <ProjektCard key={p.id} projekt={p} delay={i*35+delay} onPress={onPress} />)
            }
          </div>
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="70%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : projekte.map((p) => {
                const cc = p.catColor || { bg:T.tealSoft, text:T.teal };
                return (
                  <div key={p.id} className="dp-list-card" onClick={() => onPress?.(p)} style={{cursor:"pointer"}}>
                    <div className="dp-list-thumb-placeholder" style={{ background:cc.bg, position:"relative", overflow:"hidden" }}>
                      {p.cover
                        ? <img src={p.cover} alt={p.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }} onError={ev => ev.target.style.display='none'}/>
                        : <span>🌍</span>
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em" }}>{p.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:5, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.desc}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, background:cc.bg, color:cc.text, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{p.cat}</span>
                        <span style={{ fontSize:11, color:T.inkFaint }}>👥 {p.members} Mitgl.</span>
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 8. ORTE ENTDECKEN
// ════════════════════════════════════════════════════════════════
function OrteSection({ onMap, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Orte entdecken"
        sub="Besondere HUI-Räume, Parks & Begegnungsorte."
        delay={delay}
      />
      <SectionEmpty
        icon="📍"
        label="Orte kommen bald"
        sub="HUI-Räume und Begegnungsorte werden hier erscheinen, sobald sie in der Community entstehen."
      />
    </div>
  );
}

function OrtCard({ ort, delay=0, onMap }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="dp-press dp-in dp-card-hover" onClick={onMap} style={{
      width:110, flexShrink:0,
      borderRadius:14, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
    }}>
      <div style={{ width:"100%", height:68, overflow:"hidden", position:"relative", background:T.tealSoft }}>
        {!imgErr && ort.cover ? (
          <img src={ort.cover} alt={ort.name} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:24, opacity:0.4 }}>📍</span>
          </div>
        )}
        {ort.dist !== "—" && (
          <div style={{
            position:"absolute", top:5, left:5,
            background:"rgba(255,255,255,0.90)", backdropFilter:"blur(6px)",
            borderRadius:99, padding:"1px 6px",
            fontSize:9, fontWeight:700, color:T.teal,
          }}>
            {ort.dist}
          </div>
        )}
      </div>
      <div style={{ padding:"7px 8px 9px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginBottom:2, lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>
          {ort.name}
        </div>
        <div style={{ fontSize:9.5, color:T.inkFaint, fontWeight:500, marginBottom:4 }}>{ort.city}</div>
        {/* Aktivität */}
        {ort.nextEvent ? (
          <div style={{ fontSize:9, color:"#D97706", fontWeight:600 }}>📅 {ort.nextEvent}</div>
        ) : ort.active ? (
          <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:9.5, color:"#22c55e", fontWeight:700 }}>
            <span style={{ display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#22c55e" }}/>
            {ort.active} aktiv
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function DiscoverPage({ onView, onMap, onBook }) {
  const [view, setView]         = useState("cards"); // "cards" | "list"
  const [loading, setLoading] = useState(true);
  const [people, setPeople]           = useState([]);
  const [momente, setMomente]         = useState([]);
  const [werke, setWerke]             = useState([]);
  const [erlebnisse, setErlebnisse]   = useState([]);
  const [projekte, setProjekte]       = useState([]);
  const [stats, setStats]             = useState(null);
  const [liveActivities, setLiveActivities] = useState([]);

  // ── Daten laden ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // People
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views") // Identity Contract v1.0
          .or("has_talent_profile.eq.true,is_member.eq.true,role.eq.talent,role.eq.wirker")
          .limit(12);

        if (!cancelled && profiles?.length > 0) {
          setPeople(profiles.map(p => ({
            id:           p.id,
            name:         safeStr(p.display_name || p.username) || null,
            bio:          safeStr(p.bio),
            location:     safeStr(p.location_label), // Identity Contract v1.0
            avatar:       safeStr(p.avatar_url),
            impact:       safeNum(p.impact_eur, 0),
            last_seen_at: null, // last_seen_at nicht im Identity Contract
            interests:    [], // dna_tags/skills nicht im Identity Contract
          })));
        }

        // Momente (beitraege)
        const { data: beitr } = await supabase
          .from("beitraege")
          .select("id,src,type,caption,created_at,user_id")
          .order("created_at", { ascending:false })
          .limit(8);

        if (!cancelled && beitr?.length > 0) {
          setMomente(beitr.map(b => ({
            id:         b.id,
            user_id:    b.user_id,
            src:        safeStr(b.src),
            caption:    safeStr(b.caption, "Ein Moment"),
            type:       safeStr(b.type, "foto"),
            created_at: b.created_at,
            name:       "HUI Mitglied",
            location:   "",
          })));
        }

        // Werke — nur existierende DB-Felder (medium/media_url/likes_count existieren NICHT)
        // Felder: id, title, cover_url, category, file_format, tags, status, visibility, user_id, created_at
        const { data: ws, error: wsErr } = await supabase
          .from("works")
          .select("id,title,cover_url,category,file_format,tags,status,approval_status,visibility,price,location_text,user_id,created_at")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .eq("visibility", "public")
          .order("created_at", { ascending:false })
          .limit(8);

        if (wsErr) {
        }

        if (!cancelled && ws?.length > 0) {
          // file_format-Werte: 'original'|'druck'|'digital'
          // Mappen auf lesbare Labels für MEDIUM_COLOR-Fallback
          const FILE_FORMAT_LABEL = {
            original: "Original",
            druck:    "Druck",
            digital:  "Digital Art",
          };
          setWerke(ws.map(w => ({
            id:       w.id,
            user_id:  w.user_id || w.creator_id,
            title:    safeStr(w.title, "Werk"),
            cover:    safeStr(w.cover_url),
            medium:   FILE_FORMAT_LABEL[w.file_format] || safeStr(w.category, "Werk"),
            price:    w.price != null ? safeNum(w.price, 0) : null,
            location: safeStr(w.location_text),
            author:   "HUI Talent",
          })));
        } else if (!wsErr) {
          // Keine Werke in DB → setWerke([]) → displayWerke fällt auf SEED zurück
          if (!cancelled) setWerke([]);
        }

        // Erlebnisse — korrigierte Feldnamen: location_text, max_participants
        const { data: exps, error: expsErr } = await supabase
          .from("experiences")
          .select("id,title,cover_url,date,duration,location_text,max_participants,status,approval_status,category,experience_type,created_at")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .order("created_at", { ascending:false })
          .limit(8);

        if (expsErr) {
        }

        if (!cancelled && exps?.length > 0) {
          setErlebnisse(exps.map(e => {
            const d = e.date ? new Date(e.date) : null;
            const now = new Date();
            // Status ableiten
            let statusLabel = "Aktiv";
            let statusColor = "#16A34A";
            if (d && d > now) { statusLabel = "Geplant";       statusColor = "#D97706"; }
            if (d && d < now) { statusLabel = "Abgeschlossen"; statusColor = "rgba(26,26,46,0.38)"; }

            // Typ-Label
            const typeRaw = e.experience_type || e.category || "";
            const typeMap = { workshop:"Workshop", event:"Event", ausstellung:"Ausstellung",
              projekt:"Projekt", kurs:"Kurs", online:"Online" };
            const typeLabel = typeMap[typeRaw.toLowerCase()] || typeRaw || "Erlebnis";

            // Datum
            const dateStr = d ? d.toLocaleDateString("de-DE",{ day:"numeric", month:"short" }) : null;
            const dayNum  = d ? String(d.getDate()).padStart(2,"0") : null;
            const monthSh = d ? d.toLocaleString("de",{month:"short"}) : null;

            return {
              id:          e.id,
              user_id:     e.user_id,
              title:       safeStr(e.title, "Erlebnis"),
              cover:       safeStr(e.cover_url),
              date:        dayNum,
              month:       monthSh,
              dateStr,
              dayLabel:    dateStr || "",
              time:        safeStr(e.duration),
              location:    safeStr(e.location_text),
              spots:       safeNum(e.max_participants, 0),
              statusLabel,
              statusColor,
              typeLabel,
            };
          }));
        } else if (!expsErr) {
          if (!cancelled) setErlebnisse([]);
        }

        // Projekte (aus HUI Impact)
        const { data: impApps } = await supabase
          .from("impact_applications")
          .select("id, title, description, cover_url, status, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(6);

        if (!cancelled && impApps?.length > 0) {
          setProjekte(impApps.map(p => ({
            id:      p.id,
            title:   safeStr(p.title, "Impact-Projekt"),
            desc:    safeStr(p.description),
            cover:   safeStr(p.cover_url),
            members: 0,
          })));
        } else if (!cancelled) {
          setProjekte([]);
        }

        // Stats berechnen
        const [
          { count: cMomente },
          { count: cWerke },
          { count: cExps },
        ] = await Promise.all([
          supabase.from("beitraege").select("*", { count:"exact", head:true }).gte("created_at", new Date(Date.now()-86400000*7).toISOString()),
          supabase.from("works").select("*", { count:"exact", head:true }).gte("created_at", new Date(Date.now()-86400000*7).toISOString()),
          supabase.from("experiences").select("*", { count:"exact", head:true }),
        ]);

        if (!cancelled) {
          const { count: cBegegnungen } = await supabase
            .from("connections")
            .select("*", { count:"exact", head:true })
            .gte("created_at", new Date(Date.now()-86400000*7).toISOString());
          const { count: cProjekte } = await supabase
            .from("impact_applications")
            .select("*", { count:"exact", head:true })
            .eq("status", "approved");
          setStats({
            momente:     cMomente ?? 0,
            begegnungen: cBegegnungen ?? 0,
            werke:       cWerke ?? 0,
            erlebnisse:  cExps ?? 0,
            projekte:    cProjekte ?? 0,
          });
        }

      } catch (e) {
        console.warn("[DiscoverPage] load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── People: nur echte DB-Daten ─────────────────────────────────
  const navigate = useNavigate();

  const handlePersonPress = useCallback((person) => {
    if (typeof onView === "function") onView(person.id || person.user_id);
  }, [onView]);

  // Werk-Karte: öffne Werk-Detailseite (nur bei echter DB-ID, nicht bei Seed-Daten)
  const handleWerkPress = useCallback((werk) => {
    const werkId = werk.id;
    // UUID-Prüfung: echte Supabase-IDs sind UUIDs (8-4-4-4-12)
    // Seed-IDs wie "w1","w2" sind keine UUIDs → kein Navigate
    const isRealId = werkId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(werkId));
    if (isRealId) {
      navigate(`/work/${werkId}`);
    }
    // Seed-Karte: kein Navigate — kein "Werk nicht gefunden"
  }, [navigate]);

  // Moment-Karte: erst Profil des Erstellers (kein separater Moment-Detail-View)
  const handleMomentPress = useCallback((moment) => {
    const profileId = moment.user_id || moment.author?.id;
    if (profileId && typeof onView === "function") onView(profileId);
  }, [onView]);

  // Erlebnis-Karte: öffne ExperienceBookingFlow (Detail + Buchen)
  const handleErlebnisPress = useCallback((erlebnis) => {
    if (typeof onBook === "function") {
      onBook(erlebnis);
    } else {
      // Fallback: Ersteller-Profil öffnen
      const profileId = erlebnis.user_id;
      if (profileId && typeof onView === "function") onView(profileId);
    }
  }, [onBook, onView]);

  // Projekt-Karte: öffne Impact-Seite (/impact)
  const handleProjektPress = useCallback((projekt) => {
    navigate("/impact");
  }, [navigate]);

  // ActivityCard → Profil öffnen (act.user_id wenn vorhanden, sonst People-Sektion)
  const handleActivityPress = useCallback((act) => {
    if (act?.user_id && typeof onView === "function") {
      onView(act.user_id);
    } else {
      const el = document.querySelector("[data-dp-people]");
      if (el) el.scrollIntoView({ behavior:"smooth" });
    }
  }, [onView]);

  // TodayStats Stat-Karte → scroll zu jeweiliger Section
  const handleScrollTo = useCallback((key) => {
    const selectorMap = {
      momente:     "[data-dp-momente]",
      begegnungen: "[data-dp-people]",
      werke:       "[data-dp-werke]",
      erlebnisse:  "[data-dp-erlebnisse]",
      projekte:    "[data-dp-projekte]",
    };
    const sel = selectorMap[key];
    if (sel) {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }, []);

  // SectionHead "Alle ansehen →" → scroll zum nächsten Marker
  const makeScrollHandler = useCallback((selector) => () => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  }, []);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="dp-root" style={{
      width:"100%", background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      color:T.ink,
      overscrollBehavior:"none",
    }}>
      <style>{CSS}</style>

      {/* ── 1. Titelbereich ── */}
      <SearchBar view={view} onViewChange={setView} />

      {/* ── 1b. Live Activity Bar ── */}
      <LiveActivityBar activities={liveActivities} onPersonPress={handleActivityPress}/>

      {/* ── 2. Heute auf HUI ── */}
      <TodayStats stats={stats} onScrollTo={handleScrollTo} loading={loading}/>

      {/* ── 3. Menschen entdecken ── */}
      <PeopleSection
        people={people}
        onPersonPress={handlePersonPress}
        loading={loading && people.length === 0}
        delay={60}
        view={view}
        onSectionAction={makeScrollHandler("[data-dp-people]")}
      />

      {/* ── 4. Momente aus deiner Nähe ── */}
      <MomenteSection
        momente={momente}
        loading={loading && momente.length === 0}
        delay={80}
        view={view}
        onPress={handleMomentPress}
        onSectionAction={makeScrollHandler("[data-dp-momente]")}
      />

      {/* ── 5. Werke entdecken ── */}
      <WerkeSection
        werke={werke}
        loading={loading && werke.length === 0}
        delay={100}
        view={view}
        onPress={handleWerkPress}
        onSectionAction={makeScrollHandler("[data-dp-werke]")}
      />

      {/* ── 6. Erlebnisse für dich ── */}
      <ErlebnisseSection
        erlebnisse={erlebnisse}
        loading={loading && erlebnisse.length === 0}
        delay={120}
        view={view}
        onPress={handleErlebnisPress}
        onSectionAction={makeScrollHandler("[data-dp-erlebnisse]")}
      />

      {/* ── 7. Projekte & Initiativen ── */}
      <ProjekteSection
        projekte={projekte}
        loading={loading}
        delay={140}
        view={view}
        onPress={handleProjektPress}
        onSectionAction={makeScrollHandler("[data-dp-projekte]")}
      />

      {/* ── 8. Orte entdecken ── */}
      <OrteSection onMap={onMap} delay={160} view={view} />
    </div>
  );
}
