// connection-create/StepOneTypeSelection.jsx v2
// STEP 1 — "Was möchtest du erschaffen?"
// FIX: onSelect(key) → setzt Typ UND springt direkt zu Step 2
// Vollständiges tap-feedback, iOS touch handling, pointer-events korrekt

import React, { useState, useCallback } from "react";
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
    0%,100%{
      box-shadow: 0 8px 32px rgba(139,92,246,0.22),
                  0 0 0 2px rgba(139,92,246,0.28);
    }
    50%{
      box-shadow: 0 14px 44px rgba(139,92,246,0.34),
                  0 0 0 2.5px rgba(139,92,246,0.40);
    }
  }
  @keyframes s1-tap {
    0%  { transform: scale(1); }
    40% { transform: scale(0.97); }
    100%{ transform: scale(1); }
  }
  @keyframes s1-in {
    from{ opacity:0; transform:translateY(22px) scale(0.97); }
    to  { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes s1-icon-pop {
    0%  { transform:scale(1); }
    50% { transform:scale(1.15); }
    100%{ transform:scale(1); }
  }

  /* Kritisch für iOS: kein Delay bei Buttons */
  .s1-card-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    user-select: none;
    cursor: pointer;
    pointer-events: auto !important;
    position: relative;
    z-index: 1;
  }
  .s1-card-btn:active {
    transform: scale(0.97);
  }
`;

export default function StepOneTypeSelection({ value, onSelect }) {
  // pressedKey: für sofortiges visuelles Tap-Feedback
  const [pressedKey, setPressedKey] = useState(null);

  const handleSelect = useCallback((key) => {
    setPressedKey(key);
    // Kurzes visuelles Feedback, dann navigieren
    setTimeout(() => {
      onSelect?.(key);
    }, 120);
  }, [onSelect]);

  return (
    <div style={{
      flex:1,
      display:"flex", flexDirection:"column",
      alignItems:"center",
      padding:"0 20px 32px",
      overflowY:"auto", overflowX:"hidden",
      WebkitOverflowScrolling:"touch",
      // Kein overflow:hidden das Klicks blockiert
      position:"relative", zIndex:1,
    }}>
      <style>{CSS}</style>

      {/* ── Headline ── */}
      <div style={{
        textAlign:"center", marginBottom:36, maxWidth:420,
        animation:"s1-in 0.22s ease both",
      }}>
        <div style={{
          fontSize:28, fontWeight:900, color:C.ink,
          letterSpacing:-0.8, lineHeight:1.2, marginBottom:10,
        }}>
          Was m\u00f6chtest du erschaffen?
        </div>
        <div style={{ fontSize:15, color:C.muted, lineHeight:1.65 }}>
          W\u00e4hle einen Moment \u2014 und lade andere ein, Teil davon zu sein.
        </div>
      </div>

      {/* ── Type Cards ── */}
      <div style={{
        display:"flex", flexDirection:"column", gap:13,
        width:"100%", maxWidth:520,
        // Sicherstellen: kein overflow:hidden das Clicks schluckt
        position:"relative", zIndex:1,
      }}>
        {CONNECTION_TYPES.map((t, i) => {
          const on      = value === t.key;
          const pressed = pressedKey === t.key;

          return (
            <button
              key={t.key}
              className="s1-card-btn"
              onClick={() => handleSelect(t.key)}
              // iOS Safari: onTouchEnd als Backup
              onTouchEnd={e => {
                e.preventDefault();
                handleSelect(t.key);
              }}
              style={{
                textAlign:"left",
                width:"100%",
                padding:"20px 22px",
                borderRadius:24,
                background: on
                  ? "linear-gradient(135deg,rgba(139,92,246,0.11) 0%,rgba(124,58,237,0.07) 100%)"
                  : "rgba(255,255,255,0.82)",
                backdropFilter:"blur(20px)",
                WebkitBackdropFilter:"blur(20px)",
                border: on
                  ? "2px solid rgba(139,92,246,0.38)"
                  : "1.5px solid rgba(255,255,255,0.72)",
                boxShadow: on
                  ? "none"
                  : "0 4px 20px rgba(0,0,0,0.06)",
                // Animation: glow wenn aktiv, tap wenn gedrückt, sonst staggered entry
                animation: on
                  ? "s1-glow 3s ease-in-out infinite"
                  : pressed
                  ? "s1-tap 0.18s ease forwards"
                  : `s1-in ${0.06 + i * 0.05}s ease both`,
                transform: pressed && !on ? "scale(0.97)" : "scale(1)",
                display:"flex", alignItems:"center", gap:18,
                transition:"background 0.18s, border 0.18s, box-shadow 0.18s",
                // Pointer-events explizit
                pointerEvents:"auto",
              }}
            >
              {/* ── Icon Circle ── */}
              <div style={{
                width:54, height:54, borderRadius:17, flexShrink:0,
                background: on
                  ? "linear-gradient(135deg,#8B5CF6,#7C3AED)"
                  : "rgba(139,92,246,0.09)",
                display:"flex", alignItems:"center",
                justifyContent:"center",
                fontSize:25,
                boxShadow: on ? "0 6px 18px rgba(139,92,246,0.32)" : "none",
                transition:"all 0.22s ease",
                animation: on
                  ? "s1-float 4s ease-in-out infinite"
                  : pressed
                  ? "s1-icon-pop 0.22s ease"
                  : "none",
                flexShrink:0,
              }}>{t.icon}</div>

              {/* ── Text ── */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:17, fontWeight:800,
                  color: on ? C.violet : C.ink,
                  marginBottom:4, letterSpacing:-0.3,
                  transition:"color 0.18s",
                }}>{t.label}</div>
                <div style={{
                  fontSize:13, color:C.muted, lineHeight:1.55,
                }}>{t.desc}</div>
              </div>

              {/* ── Arrow ── */}
              <div style={{
                width:30, height:30, borderRadius:9, flexShrink:0,
                background: on ? "rgba(139,92,246,0.13)" : "rgba(0,0,0,0.04)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18,
                color: on ? C.violet : "rgba(0,0,0,0.18)",
                transition:"all 0.18s",
                // Arrow dreht sich beim press
                transform: pressed ? "translateX(3px)" : "translateX(0)",
              }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
