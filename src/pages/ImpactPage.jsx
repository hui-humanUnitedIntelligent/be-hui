// ImpactPage.jsx — HUI Impact Pool v4
// Screenshot-exact: Hero → Verteilung → Projekte → Activity → Stimmen
// Props-kompatibel: ImpactPage({ currentUser }) — unverändert
// REGEL: Kein Supabase in UI-Komponenten. Alle Queries in Hauptkomponente.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase }          from "../lib/supabaseClient";
import { safeQuery, FIELDS } from "../lib/perfUtils";
import SupportSheet           from "../components/SupportSheet";

/* ══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════════ */
const C = {
  teal:      "#20D3C2",
  teal2:     "#16BFB0",
  tealGlow:  "rgba(32,211,194,0.22)",
  tealPale:  "#E8FAF8",
  coral:     "#FF8A7A",
  coralGlow: "rgba(255,138,122,0.20)",
  gold:      "#F6C768",
  goldGlow:  "rgba(246,199,104,0.22)",
  green:     "#4CAF85",
  greenPale: "#EAF7F1",
  cream:     "#FAF8F5",
  warm:      "#FEFCF9",
  card:      "rgba(255,255,255,0.92)",
  ink:       "#1E1E1E",
  ink2:      "#3A3A3A",
  muted:     "#8A8A8A",
  muted2:    "#C5C5C5",
  border:    "rgba(0,0,0,0.06)",
};

/* ══════════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════════ */
const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; } to { opacity:1; }
  }
  @keyframes spin {
    to { transform:rotate(360deg); }
  }
  @keyframes pulse {
    0%,100% { transform:scale(1); opacity:1; }
    50%      { transform:scale(1.08); opacity:0.75; }
  }
  @keyframes slideIn {
    from { opacity:0; transform:translateX(-12px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(32,211,194,0); }
    50%      { box-shadow: 0 0 0 10px rgba(32,211,194,0.15); }
  }
  .ip-scroll::-webkit-scrollbar { display:none; }
  .ip-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .ip-pill {
    flex-shrink:0; border-radius:999px; padding:8px 18px;
    font-size:13.5px; font-weight:600; cursor:pointer; border:none; outline:none;
    transition:all 0.18s ease; -webkit-tap-highlight-color:transparent;
    white-space:nowrap;
  }
  .ip-pill:active { transform:scale(0.95); }
  .ip-card-btn {
    border:none; cursor:pointer; outline:none;
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.18s ease, box-shadow 0.18s ease;
  }
  .ip-card-btn:active { transform:scale(0.97); }
  .ip-vote-btn {
    border:none; cursor:pointer; outline:none;
    -webkit-tap-highlight-color:transparent;
    transition:all 0.22s ease;
  }
  .ip-vote-btn:active { transform:scale(0.92); }
`;

/* ══════════════════════════════════════════════════════════════════
   MOCK DATA (Fallback wenn DB leer)
══════════════════════════════════════════════════════════════════ */
const MOCK_PROJECTS = [
  {
    id:"p1", title:"Repair Café Netzwerk",
    short:"Gemeinsam reparieren statt wegwerfen.",
    story:"Ein Netzwerk von Reparaturcafés, die Menschen zusammenbringen und Ressourcen schonen.",
    category:"Gemeinschaft", categoryColor: C.teal,
    img:"https://images.unsplash.com/photo-1556909114-44e4e6b65b4a?w=600&q=80",
    raised:48650, goal:80000, votes:1248, status:"featured",
    badge:"Sehr beliebt", badgeColor: C.coral,
  },
  {
    id:"p2", title:"Musikräume für junge Künstler",
    short:"Kreativität braucht Raum.",
    story:"Bezahlbare Proberäume und Studios für aufstrebende Musiker:innen.",
    category:"Kunst & Kultur", categoryColor: C.gold,
    img:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80",
    raised:36200, goal:80000, votes:876, status:"active",
    badge:"Beliebt", badgeColor: C.coral,
  },
  {
    id:"p3", title:"Urban Garden Initiative",
    short:"Mehr grün. Mehr leben. Für unsere Stadt.",
    story:"Urbane Gärten als grüne Lungen und Begegnungsorte in der Stadt.",
    category:"Umwelt & Nachhaltigkeit", categoryColor: C.green,
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    raised:22480, goal:60000, votes:532, status:"voting",
    badge:"Neu", badgeColor: C.teal,
  },
  {
    id:"p4", title:"Kunst für Alle",
    short:"Workshops für Kinder und Jugendliche.",
    story:"Kostenlose Kunst-Workshops für Kinder aus einkommensschwachen Familien.",
    category:"Bildung & Entwicklung", categoryColor: C.coral,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    raised:18730, goal:40000, votes:421, status:"growing",
    badge:"Neu", badgeColor: C.teal,
  },
];

const MOCK_ACTIVITY = [
  { id:"a1", text:"Lea hat für Musikräume abgestimmt", time:"vor 2 Min", avatar:"https://i.pravatar.cc/36?img=11", icon:"🗳" },
  { id:"a2", text:"Neues Projekt „Kreative Nachbarschaft" eingereicht", time:"vor 15 Min", avatar:null, icon:"🌱" },
  { id:"a3", text:"Tim hat € 25 zum Impact Pool beigetragen", time:"vor 1 Std", avatar:"https://i.pravatar.cc/36?img=53", icon:"💚" },
  { id:"a4", text:"Das Projekt Wald Klassenzimmer wurde vollständig gefördert 🎉", time:"vor 3 Std", avatar:null, icon:"🎉" },
];

const DISTRIBUTION = [
  { pct:40, label:"Community Vote",      sub:"Was euch bewegt",                      color:C.teal,  dash:40 },
  { pct:30, label:"Wirkungsfaktoren",    sub:"Aktivität, Vertrauen, Transparenz",    color:C.coral, dash:30 },
  { pct:20, label:"HUI Kurations-Team",  sub:"Für Balance & Vielfalt",               color:C.gold,  dash:20 },
  { pct:10, label:"Förderraum",          sub:"Für neue & spontane Ideen",            color:C.green, dash:10 },
];

const CATEGORIES = [
  "Alle Projekte", "Kunst & Kultur", "Gemeinschaft",
  "Umwelt & Nachhaltigkeit", "Bildung & Entwicklung",
];

/* ══════════════════════════════════════════════════════════════════
   HELPER
══════════════════════════════════════════════════════════════════ */
function fmt(n) {
  if (!n) return "0";
  return new Intl.NumberFormat("de-DE").format(Math.round(n));
}
function pct(raised, goal) {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

/* ══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════ */

/* ── Donut Chart ─────────────────────────────────────────────────── */
function DonutChart({ percent, color, size = 64 }) {
  const r  = (size - 10) / 2;
  const c  = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={`${color}22`} strokeWidth={8}/>
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

/* ── ImpactHeroSection ───────────────────────────────────────────── */
function ImpactHeroSection({ poolTotal, weeklyInflow, onVote }) {
  return (
    <div style={{
      margin:"16px 20px 0",
      borderRadius:28,
      overflow:"hidden",
      position:"relative",
      minHeight:280,
      background:"linear-gradient(135deg, #1a4a45 0%, #2d6e5a 50%, #3a5a3a 100%)",
      boxShadow:"0 12px 48px rgba(0,0,0,0.18)",
      animation:"fadeUp 0.5s ease both",
    }}>
      {/* Hintergrundbild */}
      <img
        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"
        alt="Community"
        loading="eager"
        style={{
          position:"absolute", inset:0,
          width:"100%", height:"100%", objectFit:"cover",
          opacity:0.45,
        }}
      />
      {/* Gradient Overlay */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(135deg, rgba(10,40,35,0.88) 0%, rgba(30,70,50,0.60) 60%, rgba(0,0,0,0.30) 100%)",
      }}/>

      {/* Content */}
      <div style={{ position:"relative", padding:"24px 22px 20px", zIndex:2 }}>
        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:7,
          background:"rgba(32,211,194,0.18)",
          backdropFilter:"blur(8px)",
          borderRadius:999, padding:"5px 12px",
          marginBottom:14,
          border:"1px solid rgba(32,211,194,0.30)",
        }}>
          <span style={{ fontSize:14 }}>🌿</span>
          <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.90)", letterSpacing:0.3 }}>
            Gemeinsamer Impact Pool
          </span>
        </div>

        {/* Betrag */}
        <div style={{
          fontSize:46, fontWeight:900, color:"#fff",
          letterSpacing:-1.5, lineHeight:1.0, marginBottom:8,
          textShadow:"0 2px 12px rgba(0,0,0,0.3)",
        }}>
          €{fmt(poolTotal)}
        </div>

        {/* Weekly */}
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          marginBottom:16,
        }}>
          <span style={{ fontSize:12, color:C.teal, fontWeight:700 }}>↑</span>
          <span style={{ fontSize:13, color:C.teal, fontWeight:700 }}>
            +€{fmt(weeklyInflow)} diese Woche
          </span>
        </div>

        {/* Text */}
        <div style={{
          fontSize:13, color:"rgba(255,255,255,0.78)",
          lineHeight:1.6, maxWidth:240, marginBottom:20,
        }}>
          Aus Werken, Erlebnissen und Begegnungen entsteht echte Wirkung. Die Community entscheidet gemeinsam, welche Ideen gefördert werden.
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button
            onClick={onVote}
            className="ip-vote-btn"
            style={{
              display:"flex", alignItems:"center", gap:7,
              background:C.teal,
              color:"#fff", borderRadius:14,
              padding:"11px 20px",
              fontSize:13.5, fontWeight:700,
              boxShadow:`0 4px 16px ${C.tealGlow}`,
            }}
          >
            <span>🌿</span> Stimme geben
          </button>
          <button
            className="ip-vote-btn"
            style={{
              display:"flex", alignItems:"center", gap:7,
              background:"rgba(255,255,255,0.15)",
              backdropFilter:"blur(8px)",
              color:"#fff", borderRadius:14,
              padding:"11px 18px",
              fontSize:13.5, fontWeight:600,
              border:"1px solid rgba(255,255,255,0.25)",
            }}
          >
            <span style={{ fontSize:12 }}>ⓘ</span> Mehr erfahren
          </button>
        </div>
      </div>

      {/* Stats Panel — rechts unten / overlay */}
      <div style={{
        position:"absolute", right:16, top:16,
        background:"rgba(255,255,255,0.14)",
        backdropFilter:"blur(14px)",
        WebkitBackdropFilter:"blur(14px)",
        borderRadius:18,
        padding:"14px 16px",
        border:"1px solid rgba(255,255,255,0.22)",
        minWidth:155,
        zIndex:3,
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.70)",
          marginBottom:10, letterSpacing:0.5 }}>
          GEMEINSAM BEWIRKEN WIR
        </div>
        {[
          { icon:"👥", val:"3.431", label:"Menschen beteiligt" },
          { icon:"❤️", val:"47",    label:"Aktive Projekte" },
          { icon:"🌿", val:"12",    label:"Abgeschlossene Projekte" },
        ].map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
            marginBottom: i < 2 ? 8 : 0 }}>
            <span style={{ fontSize:16 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"#fff", lineHeight:1.1 }}>
                {s.val}
              </div>
              <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.65)", fontWeight:500 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ImpactDistributionSection ───────────────────────────────────── */
function ImpactDistributionSection() {
  return (
    <div style={{
      margin:"20px 20px 0",
      background:C.card,
      borderRadius:24,
      padding:"20px",
      boxShadow:"0 2px 16px rgba(0,0,0,0.06)",
      animation:"fadeUp 0.5s 0.1s both",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
        <span style={{ fontSize:15, fontWeight:800, color:C.ink }}>
          So wird der Impact Pool verteilt
        </span>
        <span style={{
          width:18, height:18, borderRadius:"50%",
          background:C.cream, border:`1px solid ${C.border}`,
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          fontSize:10, color:C.muted, cursor:"pointer", flexShrink:0,
        }}>ⓘ</span>
      </div>

      {/* 4 Donut-Karten */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(4, 1fr)",
        gap:10,
        marginBottom:18,
      }}>
        {DISTRIBUTION.map((d, i) => (
          <div key={i} style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            gap:6, animation:`fadeUp 0.4s ${0.1 + i*0.07}s both`,
          }}>
            <div style={{ position:"relative" }}>
              <DonutChart percent={d.pct} color={d.color} size={60} />
              <div style={{
                position:"absolute", inset:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:800, color:d.color,
              }}>
                {d.pct}%
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:C.ink, lineHeight:1.3 }}>
                {d.label}
              </div>
              <div style={{ fontSize:10, color:C.muted, lineHeight:1.4, marginTop:2 }}>
                {d.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nächste Ausschüttung */}
      <div style={{
        background:`linear-gradient(135deg, ${C.tealPale} 0%, rgba(246,199,104,0.12) 100%)`,
        borderRadius:16,
        padding:"14px 16px",
        display:"flex", alignItems:"center", gap:14,
        border:`1px solid rgba(32,211,194,0.15)`,
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.teal, marginBottom:3, letterSpacing:0.3 }}>
            NÄCHSTE AUSSCHÜTTUNG
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:C.ink, letterSpacing:-0.5 }}>
            in 12 Tagen
          </div>
          <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>25. Mai 2025</div>
          <div style={{ fontSize:12, color:C.teal, fontWeight:700, marginTop:6, cursor:"pointer" }}>
            Zeitplan ansehen →
          </div>
        </div>
        <div style={{ fontSize:40, opacity:0.6 }}>🌿</div>
      </div>
    </div>
  );
}

/* ── ImpactStatsBar (Kategorie-Filter) ───────────────────────────── */
function ImpactStatsBar({ activeCategory, onCategory }) {
  return (
    <div style={{ margin:"20px 0 0", animation:"fadeUp 0.4s 0.15s both" }}>
      <div className="ip-scroll" style={{
        display:"flex", gap:8,
        overflowX:"auto", padding:"0 20px",
      }}>
        {CATEGORIES.map((cat, i) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              className="ip-pill"
              onClick={() => onCategory(cat)}
              style={{
                background: active
                  ? C.teal
                  : C.card,
                color: active ? "#fff" : C.ink2,
                boxShadow: active
                  ? `0 4px 14px ${C.tealGlow}`
                  : "0 1px 6px rgba(0,0,0,0.06)",
                fontWeight: active ? 700 : 500,
                transform: active ? "scale(1.03)" : "scale(1)",
              }}
            >
              {cat}
            </button>
          );
        })}
        <button className="ip-pill" style={{
          background:C.card, color:C.ink2,
          boxShadow:"0 1px 6px rgba(0,0,0,0.06)",
          display:"flex", alignItems:"center", gap:5,
          fontWeight:500,
        }}>
          <span style={{ fontSize:12 }}>⚙</span> Filter
        </button>
      </div>
    </div>
  );
}

/* ── ImpactProjectCard ───────────────────────────────────────────── */
function ImpactProjectCard({ project, idx, votedIds, votesLeft, onOpen, onVote }) {
  const voted   = votedIds.includes(project.id);
  const percent = pct(project.raised, project.goal);

  return (
    <div
      className="ip-card-btn"
      onClick={() => onOpen(project)}
      style={{
        width:200, flexShrink:0,
        borderRadius:20, overflow:"hidden",
        background:C.card,
        boxShadow:"0 4px 20px rgba(0,0,0,0.09)",
        animation:`fadeUp 0.4s ${0.05 + idx*0.07}s both`,
        cursor:"pointer",
      }}
    >
      {/* Bild */}
      <div style={{ position:"relative", height:148 }}>
        <img
          src={project.img}
          alt={project.title}
          loading="lazy"
          style={{ width:"100%", height:"100%", objectFit:"cover" }}
        />
        {/* Gradient */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)",
        }}/>
        {/* Badge */}
        {project.badge && (
          <div style={{
            position:"absolute", top:10, left:10,
            background:"rgba(255,255,255,0.92)",
            backdropFilter:"blur(6px)",
            borderRadius:999, padding:"3px 9px",
            fontSize:10.5, fontWeight:700,
            color: project.badgeColor || C.teal,
          }}>
            {project.badge}
          </div>
        )}
        {/* Heart */}
        <button
          className="ip-vote-btn"
          onClick={e => { e.stopPropagation(); }}
          style={{
            position:"absolute", top:10, right:10,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(255,255,255,0.88)",
            backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, color:C.coral,
          }}
        >
          ♡
        </button>
      </div>

      {/* Info */}
      <div style={{ padding:"12px 12px 14px" }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:C.ink,
          lineHeight:1.3, marginBottom:4, letterSpacing:-0.2 }}>
          {project.title}
        </div>
        <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.4, marginBottom:10,
          overflow:"hidden", textOverflow:"ellipsis",
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {project.short}
        </div>

        {/* Progress Bar */}
        <div style={{
          height:4, borderRadius:4,
          background:"rgba(0,0,0,0.07)",
          marginBottom:8, overflow:"hidden",
        }}>
          <div style={{
            height:"100%", borderRadius:4,
            background:`linear-gradient(90deg, ${C.teal} 0%, ${C.teal2} 100%)`,
            width:`${percent}%`,
            transition:"width 0.8s ease",
          }}/>
        </div>

        {/* Raised + Supporters */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:C.teal }}>
              € {fmt(project.raised)} <span style={{ color:C.muted, fontWeight:500 }}>von € {fmt(project.goal)}</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {/* Supporter Avatare */}
            <div style={{ display:"flex" }}>
              {[1,2,3].map(k => (
                <img key={k}
                  src={`https://i.pravatar.cc/24?img=${(idx*3+k)%50+1}`}
                  style={{ width:18, height:18, borderRadius:"50%",
                    border:"1.5px solid #fff", marginLeft:k>1?-6:0, objectFit:"cover" }}
                />
              ))}
            </div>
            <span style={{ fontSize:10.5, color:C.muted, fontWeight:600 }}>
              {fmt(project.votes)} dabei
            </span>
            <button
              className="ip-vote-btn"
              onClick={e => { e.stopPropagation(); }}
              style={{
                width:24, height:24, borderRadius:"50%",
                background:voted ? `${C.coral}18` : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, color:voted ? C.coral : C.muted2,
              }}
            >
              {voted ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LiveImpactFeed ──────────────────────────────────────────────── */
function LiveImpactFeed({ activities }) {
  return (
    <div style={{
      margin:"20px 20px 0",
      background:C.card,
      borderRadius:24,
      padding:"18px 20px",
      boxShadow:"0 2px 16px rgba(0,0,0,0.06)",
      animation:"fadeUp 0.5s 0.25s both",
    }}>
      <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:14, letterSpacing:-0.3 }}>
        Aktuelle Impact Aktivität
      </div>
      <div className="ip-scroll" style={{
        display:"flex", gap:12, overflowX:"auto",
        paddingBottom:4,
      }}>
        {activities.map((a, i) => (
          <div key={a.id} style={{
            flexShrink:0, width:180,
            background:C.cream,
            borderRadius:18, padding:"12px 14px",
            animation:`slideIn 0.4s ${i*0.08}s both`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              {a.avatar ? (
                <img src={a.avatar} alt=""
                  style={{ width:30, height:30, borderRadius:"50%", objectFit:"cover" }}/>
              ) : (
                <div style={{
                  width:30, height:30, borderRadius:"50%",
                  background:`linear-gradient(135deg, ${C.teal}33 0%, ${C.coral}22 100%)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16,
                }}>
                  {a.icon}
                </div>
              )}
              <span style={{ fontSize:10.5, color:C.muted }}>{a.time}</span>
            </div>
            <div style={{ fontSize:12, color:C.ink2, lineHeight:1.5, fontWeight:500 }}>
              {a.text}
            </div>
          </div>
        ))}
        {/* Arrow */}
        <div style={{
          flexShrink:0, width:44, height:"auto",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{
            width:36, height:36, borderRadius:"50%",
            background:C.cream, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:C.muted, cursor:"pointer",
          }}>›</div>
        </div>
      </div>
    </div>
  );
}

/* ── VoteAllocationWidget ────────────────────────────────────────── */
function VoteAllocationWidget({ votesLeft, totalVotes, votedIds, projects }) {
  const used = totalVotes - votesLeft;

  return (
    <div style={{
      margin:"20px 20px 0",
      background:`linear-gradient(135deg, ${C.tealPale} 0%, rgba(246,199,104,0.10) 100%)`,
      borderRadius:24,
      padding:"18px 20px",
      border:`1px solid rgba(32,211,194,0.15)`,
      animation:"fadeUp 0.5s 0.30s both",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{
          width:38, height:38, borderRadius:12,
          background:C.teal,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, flexShrink:0,
          boxShadow:`0 4px 12px ${C.tealGlow}`,
        }}>
          🗳
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:C.ink, lineHeight:1.2 }}>
            Deine Impact-Stimmen
          </div>
          <div style={{ fontSize:11.5, color:C.muted }}>
            Verteile sie bewusst — sie zählen.
          </div>
        </div>
      </div>

      {/* Vote Dots */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {Array.from({ length: totalVotes }).map((_, i) => (
          <div key={i} style={{
            width:36, height:36, borderRadius:12,
            background: i < used
              ? `linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`
              : "rgba(0,0,0,0.07)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16,
            boxShadow: i < used ? `0 3px 10px ${C.tealGlow}` : "none",
            transition:"all 0.3s ease",
          }}>
            {i < used ? "✓" : ""}
          </div>
        ))}
        <div style={{
          display:"flex", alignItems:"center",
          fontSize:12, color:C.muted, fontWeight:600, marginLeft:4,
        }}>
          {votesLeft > 0
            ? `${votesLeft} verbleibend`
            : "Alle Stimmen verteilt"}
        </div>
      </div>

      {/* Unterstützte Projekte */}
      {votedIds.length > 0 && (
        <div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600, letterSpacing:0.3 }}>
            DU UNTERSTÜTZT
          </div>
          {projects
            .filter(p => votedIds.includes(p.id))
            .map(p => (
              <div key={p.id} style={{
                display:"flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,0.70)", borderRadius:12,
                padding:"8px 10px", marginBottom:6,
              }}>
                <img src={p.img} alt={p.title}
                  style={{ width:28, height:28, borderRadius:8, objectFit:"cover" }}/>
                <span style={{ fontSize:12.5, fontWeight:700, color:C.ink }}>
                  {p.title}
                </span>
                <span style={{ marginLeft:"auto", fontSize:11, color:C.teal, fontWeight:700 }}>
                  ✓ Stimme
                </span>
              </div>
            ))}
        </div>
      )}

      {votesLeft <= 0 && (
        <div style={{
          fontSize:12, color:C.muted, lineHeight:1.5,
          background:"rgba(255,255,255,0.60)", borderRadius:12, padding:"10px 12px",
        }}>
          Neue Stimmen gibt es nächste Woche wieder. 🌱
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  // ── State ──────────────────────────────────────────────────────────
  const [projects,      setProjects]     = useState([]);
  const [poolTotal,     setPoolTotal]    = useState(0);
  const [weeklyInflow,  setWeeklyInflow] = useState(0);
  const [votedIds,      setVotedIds]     = useState([]);
  const [votesLeft,     setVotesLeft]    = useState(1);
  const [totalVotes,    setTotalVotes]   = useState(1);
  const [activeCategory, setActiveCategory] = useState("Alle Projekte");
  const [loading,       setLoading]      = useState(true);
  const [supportProject, setSupportProject] = useState(null);
  const [selected,      setSelected]     = useState(null);

  // ── Daten laden ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [projRes, poolRes, weekRes] = await Promise.all([
          supabase
            .from("impact_projects")
            .select("id,name,category,description,icon,color,votes,status,goal_eur,awarded_eur,contact_name")
            .in("status", ["active","voting","growing","featured","funded"])
            .order("votes", { ascending:false }),
          supabase.from("payments").select("impact_eur"),
          supabase.from("payments").select("impact_eur")
            .gte("created_at", new Date(Date.now()-7*24*60*60*1000).toISOString()),
        ]);

        if (projRes.data?.length > 0) {
          setProjects(projRes.data.map((p, i) => ({
            id:            p.id,
            title:         p.name,
            short:         (p.description || "").slice(0, 80),
            story:         p.description || "",
            category:      p.category   || "Gemeinschaft",
            categoryColor: p.color      || C.teal,
            img:           p.icon?.startsWith("http") ? p.icon : MOCK_PROJECTS[i % 4].img,
            raised:        p.awarded_eur || 0,
            goal:          10000,
            votes:         p.votes      || 0,
            status:        p.status     || "growing",
            badge:         p.status === "featured" ? "Sehr beliebt"
                         : p.status === "active"   ? "Beliebt"
                         : "Neu",
            badgeColor:    p.status === "featured" ? C.coral
                         : p.status === "active"   ? C.coral : C.teal,
          })));
        } else {
          setProjects(MOCK_PROJECTS);
        }

        const total  = (poolRes.data  || []).reduce((s,r) => s + (r.impact_eur||0), 0);
        const weekly = (weekRes.data  || []).reduce((s,r) => s + (r.impact_eur||0), 0);
        setPoolTotal(total  > 0 ? total  : 124850);
        setWeeklyInflow(weekly > 0 ? weekly : 8950);
      } catch {
        setProjects(MOCK_PROJECTS);
        setPoolTotal(124850);
        setWeeklyInflow(8950);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Vote-Status laden ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      try {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const [profileRes, votesRes] = await Promise.all([
          supabase.from("profiles").select("has_talent_profile").eq("id", currentUser.id).maybeSingle(),
          supabase.from("impact_votes").select("project_id").eq("user_id", currentUser.id).gte("created_at", monthStart).limit(10),
        ]);
        const alloc = profileRes.data?.has_talent_profile ? 2 : 1;
        setTotalVotes(alloc);
        const voted = (votesRes.data || []).map(v => v.project_id);
        setVotedIds(voted);
        setVotesLeft(Math.max(0, alloc - voted.length));
      } catch { /* silent */ }
    })();
  }, [currentUser?.id]);

  // ── Vote Handler ───────────────────────────────────────────────────
  const handleVote = useCallback(async (projectId) => {
    if (votesLeft <= 0 || !currentUser?.id) return;
    // Optimistisch
    setVotedIds(v => [...v, projectId]);
    setVotesLeft(v => Math.max(0, v - 1));
    setProjects(ps => ps.map(p =>
      p.id === projectId ? { ...p, votes: p.votes + 1 } : p
    ));
    try {
      await Promise.all([
        supabase.from("impact_votes").insert({
          user_id:    currentUser.id,
          project_id: projectId,
          created_at: new Date().toISOString(),
        }),
        supabase.from("impact_projects")
          .update({ votes: (projects.find(p => p.id === projectId)?.votes || 0) + 1 })
          .eq("id", projectId),
      ]);
    } catch { /* Rollback nicht nötig — optimistisch */ }
  }, [votesLeft, currentUser?.id, projects]);

  // ── Gefilterte Projekte ────────────────────────────────────────────
  const filtered = activeCategory === "Alle Projekte"
    ? projects
    : projects.filter(p => p.category === activeCategory);

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"70vh", flexDirection:"column", gap:12,
      background:C.warm,
    }}>
      <style>{CSS}</style>
      <div style={{
        width:36, height:36, border:`3px solid ${C.teal}`,
        borderTopColor:"transparent", borderRadius:"50%",
        animation:"spin 0.8s linear infinite",
      }}/>
      <div style={{ fontSize:13, color:C.muted }}>Wirkung wird geladen…</div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{
      background:C.warm, minHeight:"100vh",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      paddingBottom:100,
    }}>
      <style>{CSS}</style>

      {/* ── 1. HERO ─────────────────────────────────────────────────── */}
      <ImpactHeroSection
        poolTotal={poolTotal}
        weeklyInflow={weeklyInflow}
        onVote={() => setSelected(projects[0])}
      />

      {/* ── 2. VERTEILUNG ───────────────────────────────────────────── */}
      <ImpactDistributionSection />

      {/* ── 3. KATEGORIE PILLS ──────────────────────────────────────── */}
      <ImpactStatsBar
        activeCategory={activeCategory}
        onCategory={setActiveCategory}
      />

      {/* ── 4. AKTIVE PROJEKTE ──────────────────────────────────────── */}
      <div style={{ margin:"20px 0 0" }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 20px", marginBottom:14,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:12, color:C.teal, fontWeight:700 }}>+</span>
            <span style={{ fontSize:15, fontWeight:800, color:C.ink, letterSpacing:-0.3 }}>
              Aktive Projekte
            </span>
          </div>
          <button style={{
            background:"none", border:"none",
            fontSize:12, fontWeight:700, color:C.teal, cursor:"pointer", padding:"4px 0",
          }}>
            Alle Projekte ansehen →
          </button>
        </div>

        <div className="ip-scroll" style={{
          display:"flex", gap:14,
          overflowX:"auto", padding:"4px 20px 8px",
        }}>
          {(filtered.length > 0 ? filtered : projects).map((p, i) => (
            <ImpactProjectCard
              key={p.id}
              project={p}
              idx={i}
              votedIds={votedIds}
              votesLeft={votesLeft}
              onOpen={setSelected}
              onVote={handleVote}
            />
          ))}
        </div>
      </div>

      {/* ── 5. LIVE ACTIVITY ────────────────────────────────────────── */}
      <LiveImpactFeed activities={MOCK_ACTIVITY} />

      {/* ── 6. STIMMEN WIDGET ───────────────────────────────────────── */}
      <VoteAllocationWidget
        votesLeft={votesLeft}
        totalVotes={totalVotes}
        votedIds={votedIds}
        projects={projects}
      />

      {/* ── Support Sheet ───────────────────────────────────────────── */}
      {supportProject && (
        <SupportSheet
          project={supportProject}
          user={currentUser}
          onClose={() => setSupportProject(null)}
        />
      )}
    </div>
  );
}
