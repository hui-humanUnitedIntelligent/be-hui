// src/pages/DiscoverPage.jsx — HUI Redesign v3 (2026-05-30)
// ══════════════════════════════════════════════════════════════════
// DESIGN REFERENZ: Screenshot 2026-05-30
// Reihenfolge: Suche → Heute auf HUI → Menschen → Momente → Werke → Erlebnisse → Projekte → Orte
// KEINE Kategorie-Pills (HUI-Orb übernimmt Themennavigation)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient.js";

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
  .dp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
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
  .dp-search-input { outline:none; border:none; background:none; width:100%; font-family:inherit; font-size:14px; color:#1A3530; }
  .dp-search-input::placeholder { color:rgba(26,53,48,0.35); }
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
// 1. SUCHLEISTE
// ════════════════════════════════════════════════════════════════
function SearchBar({ searchQ, onSearch, view, onViewChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      padding:`14px ${T.px}px 12px`,
      background:T.bg,
    }}>
      {/* Title Row */}
      <div style={{ marginBottom:12 }}>
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

      {/* Search Input */}
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        background:T.white,
        border:`1.5px solid ${focused ? T.teal : T.border}`,
        borderRadius:14,
        padding:"11px 14px",
        boxShadow: focused ? `0 0 0 3px rgba(14,196,184,0.10)` : T.cardShadow,
        transition:"border-color .18s, box-shadow .18s",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, opacity:0.35 }}>
          <circle cx="11" cy="11" r="7" stroke={T.ink} strokeWidth="2"/>
          <path d="M20 20 L16.5 16.5" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          className="dp-search-input"
          value={searchQ}
          onChange={e => onSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Suche nach Menschen, Werken, Erlebnissen, Projekten oder Orten..."
          style={{ flex:1, fontSize:13.5 }}
        />
        {searchQ && (
          <button onClick={() => onSearch("")} style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:16, color:T.inkFaint, padding:0, lineHeight:1,
          }}>×</button>
        )}
        {/* Filter Button */}
        <div style={{
          width:32, height:32, borderRadius:10,
          background:T.tealSoft, border:`1px solid ${T.tealMid}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", flexShrink:0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M7 12h10M10 18h4" stroke={T.teal} strokeWidth="2" strokeLinecap="round"/>
          </svg>
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

function TodayStats({ stats }) {
  return (
    <div className="dp-in" style={{ padding:`0 ${T.px}px 16px`, animationDelay:"40ms" }}>
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
            <div key={def.key} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              background:T.white, borderRadius:14, padding:"12px 10px",
              minWidth:72, boxShadow:T.cardShadow, flexShrink:0,
              border:`1px solid ${T.border}`,
              animationDelay:`${i*30}ms`,
            }}>
              <span style={{ fontSize:20, marginBottom:6 }}>{def.emoji}</span>
              <span style={{
                fontSize:22, fontWeight:900, color:def.color,
                letterSpacing:"-0.04em", lineHeight:1,
              }}>
                {stats?.[def.key] ?? (8 + i*3)}
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
const SEED_PEOPLE = [
  { id:"p1", name:"Mia Waldmann",  bio:"Naturpädagogin & Waldcoach",       location:"München", avatar:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80", impact:4200 },
  { id:"p2", name:"Jonas Kreuz",   bio:"Musiker & Community Builder",      location:"Berlin",  avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", impact:6800 },
  { id:"p3", name:"Lena Stern",    bio:"Meditationslehrerin & Heilerin",   location:"Hamburg", avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80", impact:6100 },
  { id:"p4", name:"Timo Berger",   bio:"Permakultur & Saatgut Hüter",      location:"Freiburg",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80", impact:7200 },
  { id:"p5", name:"Anna Kowalski", bio:"Künstlerin & Kreativraum Kuratorin",location:"Wien",   avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", impact:6500 },
  { id:"p6", name:"Felix Braun",   bio:"Tierheim-Aktivist & Hundefreund",  location:"Leipzig", avatar:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80", impact:2800 },
];

function PersonCard({ person, onPress, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && person.avatar) ? person.avatar : null;

  return (
    <div className="dp-press dp-in" onClick={() => onPress?.(person)} style={{
      width:130, flexShrink:0,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"14px 10px 12px",
      background:T.white,
      borderRadius:20,
      boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Avatar */}
      <div style={{
        width:72, height:72, borderRadius:"50%", overflow:"hidden",
        border:`2.5px solid ${T.white}`,
        boxShadow:`0 0 0 2.5px rgba(14,196,184,0.30), 0 4px 14px rgba(26,53,48,0.12)`,
        marginBottom:10, flexShrink:0,
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

      {/* Name */}
      <div style={{
        fontSize:12.5, fontWeight:700, color:T.ink, textAlign:"center",
        letterSpacing:"-0.02em", lineHeight:1.25, marginBottom:4,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.name}
      </div>

      {/* Bio */}
      <div style={{
        fontSize:11, color:T.inkSoft, textAlign:"center", lineHeight:1.4,
        marginBottom:8, fontWeight:400,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.bio}
      </div>

      {/* Location */}
      {person.location && (
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          fontSize:11, color:T.inkFaint, marginBottom:8,
        }}>
          <span>📍</span>
          <span style={{ fontWeight:500 }}>{person.location}</span>
        </div>
      )}

      {/* Impact */}
      <div style={{
        display:"flex", alignItems:"center", gap:4,
        background:T.tealSoft, borderRadius:99,
        padding:"3px 10px",
      }}>
        <span style={{ fontSize:11 }}>⚡</span>
        <span style={{ fontSize:11, fontWeight:700, color:T.teal }}>
          {fmtImpact(person.impact)} Wirkung
        </span>
      </div>
    </div>
  );
}

function PeopleSection({ people, onPersonPress, loading, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Inspiring Menschen"
        sub="Entdecke wundervolle Menschen auf HUI."
        action="Alle anzeigen"
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
const SEED_MOMENTE = [
  { id:"m1", src:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=280&q=75", caption:"Waldspaziergang & Waldbaden im Englischen Garten", name:"Mia W.", location:"München",     created_at: new Date(Date.now()-3600000*1).toISOString(),    type:"foto" },
  { id:"m2", src:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=280&q=75", caption:"Stille Morgenrunde beim Café Lichtblick",          name:"Lena S.", location:"Hamburg",    created_at: new Date(Date.now()-3600000*2).toISOString(),    type:"foto" },
  { id:"m3", src:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75", caption:"Akustik Abend im Kiez — alle sind willkommen",     name:"Jonas K.", location:"Berlin",    created_at: new Date(Date.now()-3600000*3).toISOString(),    type:"foto" },
  { id:"m4", src:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=280&q=75", caption:"Sonnenaufgang Meditation",                         name:"Lena S.", location:"Hamburg",    created_at: new Date(Date.now()-3600000*5).toISOString(),    type:"foto" },
  { id:"m5", src:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75", caption:"Tierheim Besuchstag – helfen macht glücklich",       name:"Felix B.", location:"Leipzig",    created_at: new Date(Date.now()-3600000*6).toISOString(),    type:"foto" },
  { id:"m6", src:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75", caption:"Kreativworkshop für Kinder",                      name:"Anne K.", location:"Wien",        created_at: new Date(Date.now()-3600000*8).toISOString(),    type:"foto" },
];

function MomentCard({ moment, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const ago = timeAgo(moment.created_at);

  return (
    <div className="dp-press dp-in dp-card-hover" style={{
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

      {/* Caption */}
      <div style={{ background:T.white, padding:"10px 10px 10px" }}>
        <div style={{
          fontSize:11.5, fontWeight:600, color:T.ink, lineHeight:1.35,
          marginBottom:8,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {moment.caption}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
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
      </div>
    </div>
  );
}

function MomenteSection({ momente, loading, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Momente aus deiner Nähe"
        sub="Echte Geschichten, gerade jetzt."
        action="Alle anzeigen"
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
            : momente.map((m, i) => <MomentCard key={m.id} moment={m} delay={i*35+delay} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : momente.map((m) => (
                <div key={m.id} className="dp-list-card">
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
const SEED_WERKE = [
  { id:"w1", title:"Farben der Stille",   medium:"Malerei",   cover:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=280&q=75",   author:"Anna K.", likes:128 },
  { id:"w2", title:"Seelenklang",          medium:"Musik",     cover:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=280&q=75",  author:"Jonas K.", likes:96  },
  { id:"w3", title:"Küstenrauschen",       medium:"Fotografie",cover:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75",  author:"Timo B.", likes:87  },
  { id:"w4", title:"Freiheitsvogel",       medium:"Illustration",cover:"https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=280&q=75",author:"Mia W.", likes:64  },
  { id:"w5", title:"Verbunden",            medium:"Skulptur",  cover:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=280&q=75",     author:"Lena S.", likes:63  },
  { id:"w6", title:"Kleiner Moment",       medium:"Text",      cover:null,                                                                          author:"Felix B.", likes:42  },
];

const MEDIUM_COLOR = {
  "Malerei":    { bg:"rgba(147,51,234,0.12)",  text:"#9333EA" },
  "Musik":      { bg:"rgba(14,196,184,0.12)",  text:T.teal    },
  "Fotografie": { bg:"rgba(22,163,74,0.12)",   text:"#16A34A" },
  "Illustration":{ bg:"rgba(232,87,58,0.12)", text:T.coral    },
  "Skulptur":   { bg:"rgba(245,158,11,0.12)",  text:"#D97706" },
  "Text":       { bg:"rgba(100,116,139,0.12)", text:"#64748B" },
};

function WerkCard({ werk, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && werk.cover) ? werk.cover : null;
  const medCol = MEDIUM_COLOR[werk.medium] || { bg:T.tealSoft, text:T.teal };

  return (
    <div className="dp-press dp-in dp-card-hover" style={{
      width:145, flexShrink:0,
      borderRadius:16, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:100, position:"relative", overflow:"hidden", background:cover ? "#000" : medCol.bg }}>
        {cover ? (
          <img src={cover} alt={werk.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <span style={{ fontSize:28, opacity:0.5 }}>✍️</span>
            <span style={{ fontSize:10, color:medCol.text, fontWeight:600 }}>Textwerk</span>
          </div>
        )}
        {/* Medium badge */}
        <div style={{
          position:"absolute", top:7, left:7,
          background:cover ? "rgba(0,0,0,0.52)" : medCol.bg,
          backdropFilter:cover?"blur(6px)":"none",
          borderRadius:99, padding:"2px 8px",
          fontSize:9, fontWeight:700,
          color: cover ? "rgba(255,255,255,0.92)" : medCol.text,
          letterSpacing:".02em",
        }}>
          ◎ {werk.medium}
        </div>
        {/* Play button for music */}
        {werk.medium === "Musik" && (
          <div style={{
            position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(14,196,184,0.88)", backdropFilter:"blur(4px)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <span style={{ fontSize:14, color:"white", marginLeft:2 }}>▶</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"9px 10px 10px" }}>
        <div style={{
          fontSize:12, fontWeight:700, color:T.ink, marginBottom:3,
          letterSpacing:"-0.02em", lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:1, WebkitBoxOrient:"vertical",
        }}>
          {werk.title}
        </div>
        <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:8, fontWeight:400 }}>
          von {werk.author}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:11, color:T.coral }}>♥</span>
          <span style={{ fontSize:10.5, fontWeight:600, color:T.inkSoft }}>{werk.likes}</span>
        </div>
      </div>
    </div>
  );
}

function WerkeSection({ werke, loading, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Werke entdecken"
        sub="Kunst, Musik, Fotografie & mehr von der HUI Community."
        action="Alle Werke"
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
            : werke.map((w, i) => <WerkCard key={w.id} werk={w} delay={i*35+delay} />)
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
                return (
                  <div key={w.id} className="dp-list-card">
                    <div className="dp-list-thumb-placeholder" style={{ background:medCol.bg }}>
                      {w.cover
                        ? <img src={w.cover} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} onError={e => e.target.style.display='none'}/>
                        : <span>🎨</span>
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em" }}>{w.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:5 }}>von {w.author}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{w.medium}</span>
                        <span style={{ fontSize:11, color:T.coral }}>♥ {w.likes}</span>
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
const SEED_ERLEBNISSE = [
  { id:"e1", title:"Yoga im Park",              date:"30", month:"Mai",  dayLabel:"Heute",  time:"18:00", location:"München",  spots:12, cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=280&q=75" },
  { id:"e2", title:"Urban Gardening Workshop",  date:"31", month:"Mai",  dayLabel:"Morgen", time:"10:00", location:"Hamburg",  spots:8,  cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75" },
  { id:"e3", title:"Gitarre für Anfänger",      date:"02", month:"Jun",  dayLabel:"Mo",     time:"19:00", location:"Berlin",   spots:6,  cover:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=280&q=75" },
  { id:"e4", title:"Acryl Malen für Einsteiger",date:"04", month:"Jun",  dayLabel:"Mi",     time:"17:00", location:"Leipzig",  spots:7,  cover:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=280&q=75" },
  { id:"e5", title:"Sonnenaufgang Wanderung",   date:"06", month:"Jun",  dayLabel:"Fr",     time:"05:00", location:"Freiburg", spots:10, cover:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=280&q=75" },
  { id:"e6", title:"Tierheim Helfer Tag",       date:"07", month:"Jun",  dayLabel:"Sa",     time:"11:00", location:"Leipzig",  spots:9,  cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75" },
];

function ErlebnisCard({ erlebnis, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && erlebnis.cover) ? erlebnis.cover : null;
  const isToday = erlebnis.dayLabel === "Heute";

  return (
    <div className="dp-press dp-in dp-card-hover" style={{
      width:155, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover mit Datum */}
      <div style={{ width:"100%", height:105, position:"relative", overflow:"hidden", background:cover?"#000":T.tealSoft }}>
        {cover ? (
          <img src={cover} alt={erlebnis.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.85 }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:32, opacity:0.4 }}>📅</span>
          </div>
        )}

        {/* Datum-Block */}
        <div style={{
          position:"absolute", top:8, left:8,
          background:"rgba(255,255,255,0.94)", backdropFilter:"blur(8px)",
          borderRadius:10, padding:"5px 9px", textAlign:"center", minWidth:36,
        }}>
          <div style={{ fontSize:15, fontWeight:900, color:T.ink, lineHeight:1 }}>{erlebnis.date}</div>
          <div style={{ fontSize:8.5, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:".04em", marginTop:1 }}>{erlebnis.month}</div>
        </div>

        {/* "Heute"-Badge */}
        {isToday && (
          <div style={{
            position:"absolute", bottom:8, left:8,
            background:T.teal, borderRadius:99, padding:"2px 8px",
            fontSize:9.5, fontWeight:800, color:"white",
          }}>
            Heute · {erlebnis.time}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 10px 11px" }}>
        <div style={{
          fontSize:12, fontWeight:700, color:T.ink, marginBottom:4,
          letterSpacing:"-0.02em", lineHeight:1.3,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {erlebnis.title}
        </div>
        {!isToday && (
          <div style={{ fontSize:10.5, color:T.teal, fontWeight:600, marginBottom:4 }}>
            {erlebnis.dayLabel} · {erlebnis.time}
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:8 }}>
          <span style={{ fontSize:10, color:T.inkFaint }}>📍</span>
          <span style={{ fontSize:10.5, color:T.inkFaint, fontWeight:500 }}>{erlebnis.location}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:11 }}>👥</span>
          <span style={{ fontSize:10.5, color:T.inkSoft, fontWeight:500 }}>
            {erlebnis.spots} Plätze frei
          </span>
        </div>
      </div>
    </div>
  );
}

function ErlebnisseSection({ erlebnisse, loading, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Erlebnisse für dich"
        sub="Workshops, Treffen, Kurse & besondere Momente."
        action="Alle Erlebnisse"
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
            : erlebnisse.map((e, i) => <ErlebnisCard key={e.id} erlebnis={e} delay={i*35+delay} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : erlebnisse.map((e) => (
                <div key={e.id} className="dp-list-card">
                  <div className="dp-list-thumb-placeholder" style={{ background:"rgba(232,87,58,0.07)", position:"relative", overflow:"hidden" }}>
                    {e.cover
                      ? <img src={e.cover} alt={e.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={ev => ev.target.style.display='none'}/>
                      : <span>📅</span>
                    }
                    <div style={{ position:"absolute", bottom:2, left:2, right:2, background:"rgba(255,255,255,0.92)", borderRadius:6, padding:"1px 4px", textAlign:"center" }}>
                      <span style={{ fontSize:9, fontWeight:800, color:T.ink }}>{e.date} {e.month}</span>
                    </div>
                  </div>
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{e.title}</div>
                    <div style={{ fontSize:11.5, color:T.teal, fontWeight:600, marginBottom:4 }}>{e.dayLabel} · {e.time}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:T.inkFaint }}>📍 {e.location}</span>
                      <span style={{ fontSize:11, color:T.inkSoft }}>👥 {e.spots} frei</span>
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
// 7. PROJEKTE & INITIATIVEN
// ════════════════════════════════════════════════════════════════
const SEED_PROJEKTE = [
  { id:"pr1", title:"Stadtgarten Netz",    desc:"Gemeinschaftliche Gärten in 12 Städten",              members:47, cat:"Natur",     cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75", catColor:{ bg:"rgba(22,163,74,0.12)", text:"#16A34A" } },
  { id:"pr2", title:"Tierheim Netzwerk",   desc:"Moralische Unterstützung & Vermittlung",               members:133,cat:"Tiere",     cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75", catColor:{ bg:"rgba(217,119,6,0.12)", text:"#D97706" } },
  { id:"pr3", title:"Küsten Cleanup",      desc:"Kostenlose Aktionen für unsere Meere",                members:89, cat:"Umwelt",    cover:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75", catColor:{ bg:"rgba(14,196,184,0.12)", text:T.teal    } },
  { id:"pr4", title:"Musik für alle",      desc:"Kostenlose Konzerte in Parks",                        members:63, cat:"Kultur",    cover:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75", catColor:{ bg:"rgba(99,102,241,0.12)", text:"#6366F1" } },
  { id:"pr5", title:"Kunst für Kinder",    desc:"Kreativworkshops für Kinder & Jugendliche",            members:76, cat:"Bildung",   cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75", catColor:{ bg:"rgba(232,87,58,0.12)", text:T.coral   } },
  { id:"pr6", title:"Klima Zukunft",       desc:"Bildung & Aktionen für eine bessere Welt",            members:54, cat:"Klima",     cover:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=280&q=75", catColor:{ bg:"rgba(22,163,74,0.12)", text:"#16A34A" } },
];

function ProjektCard({ projekt, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && projekt.cover) ? projekt.cover : null;
  const cc = projekt.catColor || { bg:T.tealSoft, text:T.teal };

  return (
    <div className="dp-press dp-in dp-card-hover" style={{
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

function ProjekteSection({ projekte, loading, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Projekte & Initiativen"
        sub="Gemeinsam echte Wirkung schaffen."
        action="Alle Projekte"
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:160, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={90} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="60%" h={10} r={5}/></div>
                </div>
              ))
            : projekte.map((p, i) => <ProjektCard key={p.id} projekt={p} delay={i*35+delay} />)
          }
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
                  <div key={p.id} className="dp-list-card">
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
const SEED_ORTE = [
  { id:"o1", name:"Waldlichtung",      city:"München",  dist:"0 km",  cover:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=75"  },
  { id:"o2", name:"Community Garten",  city:"Hamburg",  dist:"12 km", cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=75"  },
  { id:"o3", name:"Atelier Raum",      city:"Berlin",   dist:"27 km", cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"  },
  { id:"o4", name:"Meditationsraum",   city:"Freiburg", dist:"—",     cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=75"     },
  { id:"o5", name:"Tierheim Leipzig",  city:"Leipzig",  dist:"—",     cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=75"     },
  { id:"o6", name:"Kreativwerkstatt",  city:"Wien",     dist:"—",     cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"  },
];

function OrteSection({ onMap, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Orte entdecken"
        sub="Besondere HUI-Räume, Parks & Begegnungsorte."
        action="Alle Orte"
        onAction={onMap}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:8, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {SEED_ORTE.map((ort, i) => <OrtCard key={ort.id} ort={ort} delay={i*30+delay} onMap={onMap} />)}
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {SEED_ORTE.map((ort) => (
            <div key={ort.id} className="dp-list-card" onClick={onMap}>
              <div className="dp-list-thumb-placeholder" style={{ position:"relative", overflow:"hidden" }}>
                {ort.cover
                  ? <img src={ort.cover} alt={ort.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display='none'}/>
                  : <span>📍</span>
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em" }}>{ort.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11.5, color:T.inkFaint }}>📍 {ort.city}</span>
                  {ort.dist !== "—" && <span style={{ fontSize:11, background:T.tealSoft, color:T.teal, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{ort.dist}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
        <div style={{ fontSize:10, color:T.inkFaint, fontWeight:500 }}>{ort.city}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function DiscoverPage({ onView, onMap }) {
  const [searchQ, setSearchQ] = useState("");
  const [view, setView]         = useState("cards"); // "cards" | "list"
  const [loading, setLoading] = useState(true);
  const [people, setPeople]           = useState([]);
  const [momente, setMomente]         = useState([]);
  const [werke, setWerke]             = useState([]);
  const [erlebnisse, setErlebnisse]   = useState([]);
  const [projekte, setProjekte]       = useState([]);
  const [stats, setStats]             = useState(null);

  // ── Daten laden ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // People
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,username,display_name,bio,avatar_url,location,impact_eur,interests")
          .or("has_talent_profile.eq.true,is_member.eq.true,role.eq.talent,role.eq.wirker")
          .limit(12);

        if (!cancelled && profiles?.length > 0) {
          setPeople(profiles.map(p => ({
            id:       p.id,
            name:     safeStr(p.display_name || p.username, "Human"),
            bio:      safeStr(p.bio),
            location: safeStr(p.location),
            avatar:   safeStr(p.avatar_url),
            impact:   safeNum(p.impact_eur, 0),
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
        console.log("[DISCOVER QUERY] public.works wird geladen...");
        const { data: ws, error: wsErr } = await supabase
          .from("works")
          .select("id,title,cover_url,category,file_format,tags,status,visibility,user_id,created_at")
          .eq("status", "published")
          .eq("visibility", "public")
          .order("created_at", { ascending:false })
          .limit(8);

        if (wsErr) {
          console.error("[DISCOVER QUERY ERROR]", wsErr.message, "| code:", wsErr.code);
        } else {
          console.log("[DISCOVER RESULT COUNT]", ws?.length ?? 0, "Werke geladen");
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
            id:     w.id,
            title:  safeStr(w.title, "Werk"),
            cover:  safeStr(w.cover_url),
            medium: FILE_FORMAT_LABEL[w.file_format] || safeStr(w.category, "Werk"),
            likes:  0,   // likes_count existiert nicht in DB
            author: "HUI Talent",
          })));
        } else if (!wsErr) {
          // Keine Werke in DB → setWerke([]) → displayWerke fällt auf SEED zurück
          if (!cancelled) setWerke([]);
        }

        // Erlebnisse
        const { data: exps } = await supabase
          .from("experiences")
          .select("id,title,description,cover_url,date,duration,location,spots_available")
          .order("created_at", { ascending:false })
          .limit(8);

        if (!cancelled && exps?.length > 0) {
          setErlebnisse(exps.map((e, i) => {
            const d = e.date ? new Date(e.date) : null;
            return {
              id:       e.id,
              title:    safeStr(e.title, "Erlebnis"),
              cover:    safeStr(e.cover_url),
              date:     d ? String(d.getDate()).padStart(2,"0") : SEED_ERLEBNISSE[i % SEED_ERLEBNISSE.length].date,
              month:    d ? d.toLocaleString("de",{month:"short"}) : SEED_ERLEBNISSE[i % SEED_ERLEBNISSE.length].month,
              dayLabel: i === 0 ? "Heute" : SEED_ERLEBNISSE[i % SEED_ERLEBNISSE.length].dayLabel,
              time:     safeStr(e.duration, "10:00"),
              location: safeStr(e.location, "Berlin"),
              spots:    safeNum(e.spots_available, 8),
            };
          }));
        }

        // Projekte (aus HUI Impact)
        const { data: imp } = await supabase
          .from("impact_pool")
          .select("id,month")
          .limit(6);
        // Falls keine Daten → SEED wird weiter unten verwendet

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
          setStats({
            momente:     cMomente ?? 24,
            begegnungen: 8,
            werke:       cWerke ?? 5,
            erlebnisse:  cExps ?? 12,
            projekte:    3,
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

  // ── Search filter ────────────────────────────────────────────
  const filteredPeople = useMemo(() => {
    const base = people.length > 0 ? people : SEED_PEOPLE;
    if (!searchQ.trim()) return base;
    const q = searchQ.toLowerCase();
    return base.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  }, [people, searchQ]);

  const displayMomente    = momente.length > 0 ? momente : SEED_MOMENTE;
  const displayWerke      = werke.length > 0 ? werke : SEED_WERKE;
  const displayErlebnisse = erlebnisse.length > 0 ? erlebnisse : SEED_ERLEBNISSE;
  const displayProjekte   = projekte.length > 0 ? projekte : SEED_PROJEKTE;

  const handlePersonPress = useCallback((person) => {
    if (typeof onView === "function") onView(person.id || person.user_id);
  }, [onView]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="dp-root" style={{
      width:"100%", minHeight:"100%", background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      color:T.ink,
    }}>
      <style>{CSS}</style>

      {/* ── 1. Suchleiste ── */}
      <SearchBar searchQ={searchQ} onSearch={setSearchQ} view={view} onViewChange={setView} />

      {/* ── 2. Heute auf HUI ── */}
      <TodayStats stats={stats} />

      {/* ── 3. Menschen entdecken ── */}
      <PeopleSection
        people={filteredPeople}
        onPersonPress={handlePersonPress}
        loading={loading && people.length === 0}
        delay={60}
        view={view}
      />

      {/* ── 4. Momente aus deiner Nähe ── */}
      <MomenteSection
        momente={displayMomente}
        loading={loading && momente.length === 0}
        delay={80}
        view={view}
      />

      {/* ── 5. Werke entdecken ── */}
      <WerkeSection
        werke={displayWerke}
        loading={loading && werke.length === 0}
        delay={100}
        view={view}
      />

      {/* ── 6. Erlebnisse für dich ── */}
      <ErlebnisseSection
        erlebnisse={displayErlebnisse}
        loading={loading && erlebnisse.length === 0}
        delay={120}
        view={view}
      />

      {/* ── 7. Projekte & Initiativen ── */}
      <ProjekteSection
        projekte={displayProjekte}
        loading={loading}
        delay={140}
        view={view}
      />

      {/* ── 8. Orte entdecken ── */}
      <OrteSection onMap={onMap} delay={160} view={view} />

      {/* Bottom padding für BottomNav */}
      <div style={{ height:100 }}/>
    </div>
  );
}
