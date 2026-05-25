// connection-create/ConnectionPreviewCard.jsx
// Live-Vorschau — screenshot-exact nach HUI Design
// Sieht aus wie ein echter Feed-Post

import React from "react";
import { CONNECTION_TYPES } from "./ConnectionTypeSidebar.jsx";
import { HUI } from "../../design/hui.design.js";

const C = {
  violet:HUI.COLOR.violet, violet2:"#7C3AED",
  teal:HUI.COLOR.teal, ink:HUI.COLOR.ink,
  muted:"rgba(80,80,80,0.55)", cream:HUI.COLOR.cream,
};

const MOOD_ICONS = {
  ruhig:"🌿", kreativ:"🎨", tief:"💧", gesellig:"🧡", abenteuerlich:"🔥",
};
const MOOD_LABELS = {
  ruhig:"Ruhige Stimmung", kreativ:"Kreative Energie", tief:"Tiefe Gespr\u00e4che",
  gesellig:"Gesellige Stimmung", abenteuerlich:"Abenteuerlicher Geist",
};
const VIS_LABELS = {
  public:"\u00d6ffentlich", local:"Lokal", friends:"Freunde", private:"Privat",
};
const COST_LABELS = {
  free:"Kostenlos", donation:"Spende", fixed:"Festpreis", request:"Auf Anfrage",
};

function MetaRow({ icon, text }) {
  if (!text) return null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:9,
      padding:"8px 0",
      borderBottom:"1px solid rgba(0,0,0,0.05)",
    }}>
      <span style={{ fontSize:15, flexShrink:0, opacity:0.7 }}>{icon}</span>
      <span style={{ fontSize:13.5, color:C.ink }}>{text}</span>
    </div>
  );
}

export default function ConnectionPreviewCard({ data }) {
  if (!data) return null;
  const { type, title, description, date, time, location,
          participants, cost, mood, visibility, coverImage } = data;

  const typeInfo = CONNECTION_TYPES.find(t => t.key === type) || CONNECTION_TYPES[0];
  const today = new Date().toLocaleDateString("de-DE",
    { weekday:"short", day:"numeric", month:"long", year:"numeric" });

  return (
    <div style={{
      borderRadius:24,
      overflow:"hidden",
      background:"rgba(255,255,255,0.85)",
      backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
      border:"1px solid rgba(255,255,255,0.70)",
      boxShadow:"0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      {/* ── Cover Image ── */}
      <div style={{
        height:180, position:"relative",
        background: coverImage
          ? `url(${coverImage}) center/cover no-repeat`
          : "linear-gradient(160deg,#B8A4E8 0%,#9B88D4 30%,#7C6BC2 60%,#6B5BAD 100%)",
        overflow:"hidden",
      }}>
        {/* Gradient overlay */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.28) 100%)",
        }}/>
        {/* Type Badge */}
        <div style={{
          position:"absolute", top:12, left:12,
          padding:"5px 11px", borderRadius:99,
          background:"rgba(255,255,255,0.90)",
          backdropFilter:"blur(10px)",
          display:"flex", alignItems:"center", gap:5,
          fontSize:12, fontWeight:700, color:C.violet,
        }}>
          <span>{typeInfo.icon}</span>
          {typeInfo.label}
        </div>
        {/* Bookmark */}
        <button style={{
          position:"absolute", top:10, right:10,
          width:32, height:32, borderRadius:"50%",
          background:"rgba(255,255,255,0.85)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14,
        }}>🔖</button>
        {/* Title overlay am Boden */}
        {!title && (
          <div style={{
            position:"absolute", bottom:12, left:14,
            fontSize:13, color:"rgba(255,255,255,0.60)", fontStyle:"italic",
          }}>Titel erscheint hier\u2026</div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"16px 18px 20px" }}>
        {/* Title */}
        <div style={{
          fontSize:19, fontWeight:900, color:C.ink,
          letterSpacing:-0.4, lineHeight:1.25,
          marginBottom:8, minHeight:28,
        }}>
          {title || <span style={{ color:C.muted, fontWeight:400, fontStyle:"italic" }}>
            Titel der Verbindung\u2026
          </span>}
        </div>

        {/* Description */}
        {description && (
          <div style={{
            fontSize:13.5, color:C.muted, lineHeight:1.60,
            marginBottom:14, maxHeight:60, overflow:"hidden",
          }}>{description}</div>
        )}

        {/* Meta Rows */}
        <div style={{ marginBottom:16 }}>
          <MetaRow icon="📅" text={date || today}/>
          <MetaRow icon="🕐" text={time || "20:00"}/>
          <MetaRow icon="📍" text={location || "\u2014"}/>
          <MetaRow icon="👥" text={participants > 0 ? `12 / ${participants} Teilnehmer` : null}/>
          <MetaRow icon="💰" text={cost ? COST_LABELS[cost] : null}/>
          {mood && <MetaRow icon={MOOD_ICONS[mood]} text={MOOD_LABELS[mood]}/>}
          {visibility && <MetaRow icon="👁" text={VIS_LABELS[visibility]}/>}
        </div>

        {/* Participant Avatars (decorative) */}
        <div style={{
          display:"flex", alignItems:"center", gap:-8,
          marginBottom:14,
        }}>
          {["#B8A4E8","#9B88D4","#7C6BC2","#A8C5D4"].map((bg,i) => (
            <div key={i} style={{
              width:28, height:28, borderRadius:"50%",
              background:bg, border:"2px solid white",
              marginLeft: i ? -8 : 0,
              boxShadow:"0 1px 4px rgba(0,0,0,0.10)",
            }}/>
          ))}
          <div style={{
            width:28, height:28, borderRadius:"50%",
            background:"rgba(139,92,246,0.15)",
            border:"2px solid white",
            marginLeft:-8,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontWeight:700, color:C.violet,
          }}>+7</div>
        </div>

        {/* CTA */}
        <button style={{
          width:"100%", height:46,
          background:`linear-gradient(135deg,${C.violet} 0%,${C.violet2} 100%)`,
          border:"none", borderRadius:99,
          color:"white", fontSize:16, fontWeight:800,
          cursor:"pointer",
          boxShadow:"0 6px 20px rgba(139,92,246,0.35)",
          letterSpacing:-0.2,
          transition:"transform 0.15s, box-shadow 0.15s",
          WebkitTapHighlightColor:"transparent",
        }}
        onMouseEnter={e => e.currentTarget.style.transform="translateY(-1px)"}
        onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
        >
          Dabei sein
        </button>

        {/* Disclaimer */}
        <div style={{
          fontSize:11, color:C.muted, textAlign:"center",
          marginTop:10, lineHeight:1.5,
        }}>
          Du kannst alle Angaben nach dem Posten noch \u00e4ndern.
        </div>
      </div>
    </div>
  );
}
