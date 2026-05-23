// connection-create/ConnectionTypeSidebar.jsx
// Linke Spalte — Verbindungstypen
// Screenshot-exact: weiche Karten, aktiver Typ mit Lila-Glow

import React from "react";
import { HUI } from "../../design/hui.design.js";

const C = {
  violet:HUI.COLOR.violet, violet2:"#7C3AED",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2,
  muted:"rgba(80,80,80,0.55)",
  cream:HUI.COLOR.cream, white:"rgba(255,255,255,0.92)",
};

export const CONNECTION_TYPES = [
  {
    key:"treffen",
    label:"Treffen",
    icon:"👥",
    desc:"Triff dich mit anderen an einem Ort.",
  },
  {
    key:"erlebnis",
    label:"Erlebnis / Event",
    icon:"📅",
    desc:"Veranstalte ein Event oder eine Aktivit\u00e4t.",
  },
  {
    key:"kreativ",
    label:"Kreative Suche",
    icon:"🔗",
    desc:"Suche Menschen f\u00fcr ein Projekt oder eine Idee.",
  },
  {
    key:"einladung",
    label:"Offene Einladung",
    icon:"🤍",
    desc:"Offene Einladung f\u00fcr alle zu etwas.",
  },
  {
    key:"community",
    label:"Community Moment",
    icon:"👣",
    desc:"Starte einen Abend oder Moment f\u00fcr deine Community.",
  },
];

const CSS = `
  @keyframes cs-glow {
    0%,100%{box-shadow:0 4px 20px rgba(139,92,246,0.22),0 0 0 1px rgba(139,92,246,0.18);}
    50%{box-shadow:0 6px 28px rgba(139,92,246,0.32),0 0 0 1.5px rgba(139,92,246,0.28);}
  }
`;

export default function ConnectionTypeSidebar({ active, onChange }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <style>{CSS}</style>

      <div style={{
        fontSize:13.5, fontWeight:700, color:C.muted,
        marginBottom:4, letterSpacing:0.1,
      }}>Was m\u00f6chtest du erstellen?</div>

      {(CONNECTION_TYPES||[]).filter(t=>t&&t.key).map(t => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              textAlign:"left", width:"100%",
              padding:"14px 15px",
              borderRadius:16,
              background: on
                ? "linear-gradient(135deg,rgba(139,92,246,0.10) 0%,rgba(124,58,237,0.06) 100%)"
                : C.white,
              backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
              border: on
                ? "1.5px solid rgba(139,92,246,0.30)"
                : "1.5px solid rgba(0,0,0,0.06)",
              boxShadow: on
                ? "none"
                : "0 2px 10px rgba(0,0,0,0.05)",
              animation: on ? "cs-glow 3s ease-in-out infinite" : "none",
              cursor:"pointer",
              display:"flex", alignItems:"flex-start", gap:12,
              transition:"transform 0.15s ease, border 0.2s",
              WebkitTapHighlightColor:"transparent",
              touchAction:"manipulation",
            }}
            onMouseEnter={e => !on && (e.currentTarget.style.transform="translateY(-1px)")}
            onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
          >
            {/* Icon circle */}
            <div style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background: on
                ? "linear-gradient(135deg,#8B5CF6,#7C3AED)"
                : "rgba(139,92,246,0.08)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16,
              boxShadow: on ? "0 3px 10px rgba(139,92,246,0.28)" : "none",
            }}>{t.icon}</div>

            <div style={{ minWidth:0 }}>
              <div style={{
                fontSize:14, fontWeight: on ? 800 : 700,
                color: on ? C.violet : C.ink,
                marginBottom:3, lineHeight:1.2,
              }}>{t.label}</div>
              <div style={{
                fontSize:12, color:C.muted, lineHeight:1.5,
              }}>{t.desc}</div>
            </div>
          </button>
        );
      })}

      {/* Tipp Card */}
      <div style={{
        marginTop:8, padding:"14px 15px",
        borderRadius:16,
        background:"rgba(255,245,180,0.40)",
        border:"1px solid rgba(251,191,36,0.25)",
        backdropFilter:"blur(12px)",
      }}>
        <div style={{
          display:"flex", alignItems:"center", gap:6, marginBottom:5,
        }}>
          <span style={{ fontSize:14 }}>💡</span>
          <span style={{ fontSize:13, fontWeight:700, color:"#92400E" }}>Tipp</span>
        </div>
        <div style={{ fontSize:12, color:"rgba(120,80,20,0.75)", lineHeight:1.55 }}>
          Je mehr Infos du teilst, desto mehr passende Menschen erreichen dich.
        </div>
      </div>
    </div>
  );
}
