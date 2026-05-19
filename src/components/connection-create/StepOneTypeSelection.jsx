// connection-create/StepOneTypeSelection.jsx
// STEP 1 — "Was möchtest du erschaffen?"
// Große emotionale Typ-Karten, luftig, ruhig, meditativ

import React from "react";
import { CONNECTION_TYPES } from "./ConnectionTypeSidebar.jsx";

const C = {
  violet:"#8B5CF6", violet2:"#7C3AED",
  ink:"#1A1A1A", muted:"rgba(80,80,80,0.50)",
};

const CSS = `
  @keyframes s1-float {
    0%,100%{ transform:translateY(0); }
    50%    { transform:translateY(-4px); }
  }
  @keyframes s1-glow {
    0%,100%{ box-shadow:0 8px 32px rgba(139,92,246,0.18), 0 0 0 1.5px rgba(139,92,246,0.22); }
    50%    { box-shadow:0 14px 44px rgba(139,92,246,0.28), 0 0 0 2px rgba(139,92,246,0.32); }
  }
  @keyframes s1-in {
    from{ opacity:0; transform:translateY(22px) scale(0.97); }
    to  { opacity:1; transform:translateY(0)    scale(1);    }
  }
`;

export default function StepOneTypeSelection({ value, onChange }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center",
      padding:"0 24px 24px",
      overflowY:"auto",
    }}>
      <style>{CSS}</style>

      {/* Headline */}
      <div style={{ textAlign:"center", marginBottom:40, maxWidth:420 }}>
        <div style={{
          fontSize:28, fontWeight:900, color:C.ink,
          letterSpacing:-0.8, lineHeight:1.2, marginBottom:10,
        }}>
          Was m\u00f6chtest du erschaffen?
        </div>
        <div style={{
          fontSize:15, color:C.muted, lineHeight:1.65,
        }}>
          W\u00e4hle einen Moment \u2014 und lade andere ein, Teil davon zu sein.
        </div>
      </div>

      {/* Type Cards */}
      <div style={{
        display:"flex", flexDirection:"column", gap:14,
        width:"100%", maxWidth:520,
      }}>
        {CONNECTION_TYPES.map((t, i) => {
          const on = value === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              style={{
                textAlign:"left", width:"100%",
                padding:"22px 24px",
                borderRadius:24,
                background: on
                  ? "linear-gradient(135deg,rgba(139,92,246,0.10) 0%,rgba(124,58,237,0.06) 100%)"
                  : "rgba(255,255,255,0.78)",
                backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
                border: on
                  ? "2px solid rgba(139,92,246,0.35)"
                  : "1.5px solid rgba(255,255,255,0.70)",
                animation: on
                  ? "s1-glow 3s ease-in-out infinite"
                  : `s1-in ${0.08 + i * 0.06}s ease both`,
                cursor:"pointer",
                display:"flex", alignItems:"center", gap:20,
                transition:"transform 0.18s ease, border 0.2s",
                WebkitTapHighlightColor:"transparent",
                touchAction:"manipulation",
                boxShadow: on
                  ? "none"
                  : "0 4px 20px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={e => !on && (e.currentTarget.style.transform="translateY(-2px)")}
              onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
            >
              {/* Icon */}
              <div style={{
                width:56, height:56, borderRadius:18, flexShrink:0,
                background: on
                  ? "linear-gradient(135deg,#8B5CF6,#7C3AED)"
                  : "rgba(139,92,246,0.08)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:26,
                boxShadow: on ? "0 6px 18px rgba(139,92,246,0.30)" : "none",
                transition:"all 0.25s ease",
                animation: on ? "s1-float 4s ease-in-out infinite" : "none",
              }}>{t.icon}</div>

              {/* Text */}
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:17, fontWeight:800,
                  color: on ? C.violet : C.ink,
                  marginBottom:5, letterSpacing:-0.3,
                  transition:"color 0.2s",
                }}>{t.label}</div>
                <div style={{
                  fontSize:13.5, color:C.muted, lineHeight:1.55,
                }}>{t.desc}</div>
              </div>

              {/* Arrow */}
              <div style={{
                width:32, height:32, borderRadius:10, flexShrink:0,
                background: on ? "rgba(139,92,246,0.12)" : "rgba(0,0,0,0.04)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, color: on ? C.violet : "rgba(0,0,0,0.20)",
                transition:"all 0.2s",
              }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
