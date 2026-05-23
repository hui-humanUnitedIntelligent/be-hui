// connection-create/StepThreePreview.jsx v2
// Screenshot-exact: "So wird deine Verbindung wirken"
// Hero (violet gradient) → Type Badge → Meta-Rows → Avatar Bubbles → CTA

import React, { useState } from "react";
import { CONNECTION_TYPES } from "./ConnectionTypeSidebar.jsx";
import { HUI } from "../../design/hui.design.js";

// ── Farben ──────────────────────────────────────────────────────────
const C = {
  violet:HUI.COLOR.violet, violet2:"#7C3AED", violet3:"#6D28D9",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.inkMid,
  muted:"rgba(80,80,80,0.52)",
  border:"rgba(0,0,0,0.07)",
  cream:"#F2F0F8",
};

// ── Labels ──────────────────────────────────────────────────────────
const MOOD_ICONS  = {
  ruhig:"🌿", kreativ:"🎨", tief:"💧", gesellig:"🧡", abenteuerlich:"🔥",
};
const MOOD_LABELS = {
  ruhig:"Ruhige Stimmung", kreativ:"Kreative Energie",
  tief:"Tiefe Gespr\u00e4che", gesellig:"Gesellige Stimmung",
  abenteuerlich:"Abenteuerlicher Geist",
};
const VIS_LABELS  = {
  public:"\u00d6ffentlich", local:"Lokal",
  friends:"Freunde",        private:"Privat",
};
const COST_LABELS = {
  free:"Kostenlos", donation:"Spende",
  fixed:"Festpreis", request:"Auf Anfrage",
};

// ── Datums-Formatter ────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return new Date().toLocaleDateString("de-DE",
    { weekday:"short", day:"numeric", month:"long", year:"numeric" });
  return new Date(iso).toLocaleDateString("de-DE",
    { weekday:"short", day:"numeric", month:"long", year:"numeric" });
}

// ── CSS ─────────────────────────────────────────────────────────────
const CSS = `
  @keyframes s3-in {
    from { opacity:0; transform:translateY(22px) scale(0.98); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes s3-hero-in {
    from { opacity:0; transform:scale(1.04); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes s3-pub-glow {
    0%,100% { box-shadow: 0 8px 28px rgba(139,92,246,0.34); }
    50%     { box-shadow: 0 12px 40px rgba(139,92,246,0.52); }
  }
  @keyframes s3-pub-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes s3-atm-a {
    0%,100%{ transform:translate(0,0) scale(1); }
    50%    { transform:translate(10px,-8px) scale(1.04); }
  }
  @keyframes s3-atm-b {
    0%,100%{ transform:translate(0,0) scale(1); }
    50%    { transform:translate(-8px,10px) scale(1.03); }
  }
  @keyframes s3-avatar-in {
    from { opacity:0; transform:scale(0.7) translateX(-6px); }
    to   { opacity:1; transform:scale(1)   translateX(0); }
  }
  .s3-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .s3-scroll::-webkit-scrollbar { display:none; }
`;

// ── Atmosphere ───────────────────────────────────────────────────────
function Atmosphere() {
  return (
    <>
      <div style={{
        position:"absolute", top:"-18%", right:"-10%",
        width:"55vw", height:"55vw", maxWidth:480, borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(139,92,246,0.09) 0%,transparent 68%)",
        filter:"blur(50px)", pointerEvents:"none",
        animation:"s3-atm-a 18s ease-in-out infinite",
      }}/>
      <div style={{
        position:"absolute", bottom:"-12%", left:"-8%",
        width:"42vw", height:"42vw", maxWidth:380, borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(22,215,197,0.07) 0%,transparent 68%)",
        filter:"blur(40px)", pointerEvents:"none",
        animation:"s3-atm-b 22s ease-in-out infinite",
      }}/>
    </>
  );
}

// ── Hero Card ────────────────────────────────────────────────────────
function HeroCard({ typeInfo, title, coverImage }) {
  return (
    <div style={{
      position:"relative", borderRadius:"24px 24px 0 0",
      overflow:"hidden", height:200, flexShrink:0,
      animation:"s3-hero-in 0.50s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      {/* Background: Bild oder Violet Gradient */}
      {coverImage ? (
        <div style={{
          position:"absolute", inset:0,
          background:`url(${coverImage}) center/cover no-repeat`,
        }}/>
      ) : (
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(160deg,
            rgba(176,138,250,0.95) 0%,
            rgba(139,92,246,0.90) 40%,
            rgba(109,40,217,0.92) 100%)`,
        }}/>
      )}
      {/* Overlay Gradient (unten dunkel für Lesbarkeit) */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to bottom,transparent 40%,rgba(30,10,60,0.55) 100%)",
      }}/>

      {/* Type Badge — oben links (Screenshot-exact) */}
      <div style={{
        position:"absolute", top:14, left:14,
        display:"flex", alignItems:"center", gap:6,
        padding:"6px 14px", borderRadius:99,
        background:"rgba(255,255,255,0.90)",
        backdropFilter:"blur(10px)",
        fontSize:13, fontWeight:700, color:C.violet,
        boxShadow:"0 2px 10px rgba(0,0,0,0.12)",
      }}>
        <span>{typeInfo.icon}</span>
        {typeInfo.label}
      </div>

      {/* Bookmark Button — oben rechts */}
      <button style={{
        position:"absolute", top:12, right:12,
        width:34, height:34, borderRadius:"50%",
        background:"rgba(255,255,255,0.85)",
        border:"none", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:15,
        boxShadow:"0 2px 8px rgba(0,0,0,0.10)",
      }}>🔖</button>

      {/* Titel im Hero — unten links (Screenshot: italic placeholder) */}
      <div style={{
        position:"absolute", bottom:14, left:16, right:16,
      }}>
        {title ? (
          <div style={{
            fontSize:18, fontWeight:800, color:"white",
            letterSpacing:-0.4, lineHeight:1.25,
            textShadow:"0 2px 8px rgba(0,0,0,0.30)",
          }}>{title}</div>
        ) : (
          <div style={{
            fontSize:15, color:"rgba(255,255,255,0.55)",
            fontStyle:"italic",
          }}>Titel erscheint hier…</div>
        )}
      </div>
    </div>
  );
}

// ── Meta Row ─────────────────────────────────────────────────────────
function MetaRow({ icon, text, last }) {
  if (!text) return null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:14,
      padding:"13px 0",
      borderBottom: last ? "none" : `1px solid rgba(0,0,0,0.055)`,
    }}>
      <span style={{ fontSize:18, flexShrink:0, opacity:0.80 }}>{icon}</span>
      <span style={{ fontSize:15, color:C.ink2, lineHeight:1.4 }}>{text}</span>
    </div>
  );
}

// ── Avatar Bubbles ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "rgba(176,138,250,0.90)",
  "rgba(139,92,246,0.80)",
  "rgba(167,139,250,0.85)",
  "rgba(196,181,253,0.90)",
];

function ParticipantBubbles({ count }) {
  return (
    <div style={{
      padding:"16px 0 4px",
      display:"flex", alignItems:"center", gap:0,
    }}>
      {AVATAR_COLORS.map((bg, i) => (
        <div key={i} style={{
          width:32, height:32, borderRadius:"50%",
          background:bg,
          border:"2.5px solid white",
          marginLeft: i === 0 ? 0 : -10,
          boxShadow:"0 2px 6px rgba(139,92,246,0.20)",
          animation:`s3-avatar-in 0.25s ${0.05 * i + 0.10}s ease both`,
          zIndex: AVATAR_COLORS.length - i,
          position:"relative",
        }}/>
      ))}
      {/* +N badge */}
      <div style={{
        width:32, height:32, borderRadius:"50%",
        background:"rgba(139,92,246,0.14)",
        border:"2.5px solid white",
        marginLeft:-10, zIndex:0, position:"relative",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, fontWeight:800, color:C.violet,
        animation:`s3-avatar-in 0.25s 0.30s ease both`,
      }}>+{count || 7}</div>
    </div>
  );
}

// ── Publish Actions ───────────────────────────────────────────────────
function PublishActions({ onPublish, onEdit, onDraft, publishing }) {
  return (
    <div>
      {/* Haupt-CTA */}
      <button
        onClick={onPublish}
        disabled={publishing}
        style={{
          width:"100%", height:54,
          background: publishing
            ? "rgba(139,92,246,0.55)"
            : `linear-gradient(135deg,${C.violet} 0%,${C.violet3} 100%)`,
          border:"none", borderRadius:99,
          color:"white", fontSize:17, fontWeight:800,
          cursor: publishing ? "default" : "pointer",
          letterSpacing:-0.3,
          animation: publishing ? "none" : "s3-pub-glow 3s ease-in-out infinite",
          display:"flex", alignItems:"center",
          justifyContent:"center", gap:9,
          WebkitTapHighlightColor:"transparent",
          touchAction:"manipulation",
          transition:"opacity 0.18s",
        }}
      >
        {publishing ? (
          <>
            <div style={{
              width:18, height:18, borderRadius:"50%",
              border:"2.5px solid rgba(255,255,255,0.35)",
              borderTopColor:"white",
              animation:"s3-pub-spin 0.8s linear infinite",
            }}/>
            Wird ver\u00f6ffentlicht\u2026
          </>
        ) : (
          <>
            Verbindung ver\u00f6ffentlichen
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="white" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>

      {/* Disclaimer */}
      <div style={{
        textAlign:"center", fontSize:12.5, color:C.muted,
        marginTop:11, lineHeight:1.55,
      }}>
        Du kannst deine Verbindung sp\u00e4ter jederzeit bearbeiten.
      </div>

      {/* Secondary Actions */}
      <div style={{
        display:"flex", gap:10, marginTop:14,
        justifyContent:"center",
      }}>
        {[
          { label:"✏️  Bearbeiten",       onClick:onEdit  },
          { label:"📋  Entwurf speichern", onClick:onDraft },
        ].map(a => (
          <button key={a.label} onClick={a.onClick} style={{
            padding:"8px 16px", borderRadius:99,
            background:"rgba(255,255,255,0.75)",
            border:`1.5px solid ${C.border}`,
            color:C.muted, fontSize:13, fontWeight:600,
            cursor:"pointer",
            WebkitTapHighlightColor:"transparent",
            backdropFilter:"blur(10px)",
            transition:"border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.28)";
            e.currentTarget.style.color = C.violet;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.muted;
          }}
          >{a.label}</button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HAUPT-EXPORT
// ══════════════════════════════════════════════════════════════════
export default function StepThreePreview({ data, onPublish, onBack, publishing }) {
  const {
    type, title, description, date, time,
    location, participants, cost, mood,
    visibility, coverImage,
  } = data;

  const typeInfo = CONNECTION_TYPES.find(t => t.key === type) || CONNECTION_TYPES[0];

  return (
    <div className="s3-scroll" style={{
      flex:1, overflowY:"auto", overflowX:"hidden",
      padding:"0 16px 40px",
      position:"relative",
    }}>
      <style>{CSS}</style>
      <Atmosphere/>

      {/* ── Header ── */}
      <div style={{
        textAlign:"center", marginBottom:22,
        position:"relative", zIndex:1,
        animation:"s3-in 0.24s ease both",
      }}>
        <div style={{
          fontSize:12, fontWeight:700, color:C.violet,
          letterSpacing:0.5, textTransform:"uppercase",
          marginBottom:8,
        }}>Schritt 3 von 3</div>
        <div style={{
          fontSize:24, fontWeight:900, color:C.ink,
          letterSpacing:-0.7, lineHeight:1.20, marginBottom:7,
        }}>
          So wird deine Verbindung wirken
        </div>
        <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.60, maxWidth:340, margin:"0 auto" }}>
          Menschen werden diesen Moment entdecken<br/>und daran teilnehmen k\u00f6nnen.
        </div>
      </div>

      {/* ── Preview Card ── */}
      <div style={{
        maxWidth:440, margin:"0 auto",
        background:"rgba(255,255,255,0.93)",
        backdropFilter:"blur(28px) saturate(1.6)",
        WebkitBackdropFilter:"blur(28px) saturate(1.6)",
        border:"1px solid rgba(255,255,255,0.78)",
        borderRadius:28,
        boxShadow:"0 12px 48px rgba(139,92,246,0.14), 0 4px 16px rgba(0,0,0,0.08)",
        overflow:"hidden",
        animation:"s3-in 0.32s 0.06s cubic-bezier(0.22,1,0.36,1) both",
        position:"relative", zIndex:1,
      }}>
        {/* Hero Image */}
        <HeroCard typeInfo={typeInfo} title={title} coverImage={coverImage}/>

        {/* Meta Content */}
        <div style={{ padding:"20px 20px 6px" }}>

          {/* Titel unter Hero (groß, grau wenn leer) */}
          {!title && (
            <div style={{
              fontSize:20, fontWeight:900, color:"rgba(80,80,80,0.28)",
              fontStyle:"italic", letterSpacing:-0.4, marginBottom:16,
              lineHeight:1.25,
            }}>Titel der Verbindung…</div>
          )}
          {title && (
            <div style={{
              fontSize:20, fontWeight:900, color:C.ink,
              letterSpacing:-0.5, marginBottom:4, lineHeight:1.25,
            }}>{title}</div>
          )}

          {/* Description (wenn vorhanden, compact) */}
          {description && (
            <div style={{
              fontSize:13.5, color:C.muted, lineHeight:1.60,
              marginBottom:14, maxHeight:54, overflow:"hidden",
            }}>{description}</div>
          )}

          {/* Meta Rows — screenshot-exact: Icon + Text + Divider */}
          <div>
            <MetaRow icon="📅" text={fmtDate(date)}/>
            <MetaRow icon="🕐" text={time || "20:00"}/>
            <MetaRow icon="📍" text={location || "\u2014"}/>
            <MetaRow
              icon="👥"
              text={`12 / ${participants || 30} Teilnehmer`}
            />
            <MetaRow
              icon="💰"
              text={COST_LABELS[cost] || "Kostenlos"}
            />
            {mood && (
              <MetaRow
                icon={MOOD_ICONS[mood] || "🌿"}
                text={MOOD_LABELS[mood] || ""}
              />
            )}
            <MetaRow
              icon="👁"
              text={VIS_LABELS[visibility] || "\u00d6ffentlich"}
              last
            />
          </div>

          {/* Avatar Bubbles */}
          <ParticipantBubbles count={7}/>
        </div>

        {/* CTA im Card (screenshot: "Dabei sein") */}
        <div style={{ padding:"4px 20px 20px" }}>
          <button style={{
            width:"100%", height:50,
            background:`linear-gradient(135deg,${C.violet},${C.violet3})`,
            border:"none", borderRadius:99,
            color:"white", fontSize:16, fontWeight:800,
            cursor:"pointer", letterSpacing:-0.2,
            boxShadow:`0 6px 20px rgba(139,92,246,0.34)`,
            WebkitTapHighlightColor:"transparent",
          }}>Dabei sein</button>
          <div style={{
            textAlign:"center", fontSize:11.5, color:C.muted, marginTop:9,
          }}>
            Du kannst alle Angaben nach dem Posten noch \u00e4ndern.
          </div>
        </div>
      </div>

      {/* ── Publish Actions (außerhalb der Card) ── */}
      <div style={{
        maxWidth:440, margin:"20px auto 0",
        position:"relative", zIndex:1,
        animation:"s3-in 0.32s 0.14s ease both",
      }}>
        <PublishActions
          onPublish={onPublish}
          onEdit={onBack}
          onDraft={() => {}}
          publishing={publishing}
        />
      </div>
    </div>
  );
}
