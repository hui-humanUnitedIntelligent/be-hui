// src/components/home/AmbientWorldBar.jsx — v2 Refined
// ══════════════════════════════════════════════════════════════════
// HUI Live — leise, ruhig, hochwertig.
// Kommuniziert: "HUI ist lebendig — gerade jetzt."
// Design: kompakter, ruhigerer Ticker, dezenteres Glassmorphism
// Kein worldEnergy-Meter (zu gamifiziert), keine worldBorder
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";

const T = {
  teal:     "#0EC4B8",
  ink:      "#1A3530",
  inkFaint: "rgba(26,53,48,0.38)",
  bg:       "rgba(250,250,248,0.92)",
  border:   "rgba(14,196,184,0.10)",
};

const CSS = `
  @keyframes awb-slide {
    from { transform: translateX(0) }
    to   { transform: translateX(-50%) }
  }
  @keyframes awb-pulse {
    0%,100% { opacity:1; transform:scale(1) }
    50%     { opacity:.45; transform:scale(.78) }
  }
  .awb-ticker { animation: awb-slide 36s linear infinite; will-change:transform; }
  .awb-dot    { animation: awb-pulse 2.8s ease-in-out infinite; }
  .awb-ticker:hover { animation-play-state:paused; }
`;

const ACTIVITY_POOL = [
  { emoji:"✦",  text:"Mia & Jonas haben sich verbunden"      },
  { emoji:"🌿",  text:"Neuer Waldbaden-Abend in München"      },
  { emoji:"🐾",  text:"Tierheim-Tag — 9 freie Plätze"        },
  { emoji:"💛",  text:"Stadtgarten Netz: 47 Unterstützer"    },
  { emoji:"🧘",  text:"Lena öffnet Meditationsraum"          },
  { emoji:"🎶",  text:"Akustik Abend — fast ausverkauft"     },
  { emoji:"🌱",  text:"Felix started a new initiative"       },
  { emoji:"☕",  text:"Morgenrunde: 4 Menschen dabei"         },
  { emoji:"✨",  text:"Anna teilt einen neuen Moment"         },
  { emoji:"🌎",  text:"Küsten Cleanup: 89 aktive Mitglieder" },
];

export default function AmbientWorldBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 320);
    return () => clearTimeout(t);
  }, []);

  const items = [...ACTIVITY_POOL, ...ACTIVITY_POOL]; // seamless loop

  return (
    <div style={{
      width: "100%", overflow: "hidden",
      opacity: visible ? 1 : 0,
      transition: "opacity .6s ease",
    }}>
      <style>{CSS}</style>
      <div style={{
        background: T.bg,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "6px 0",        // kompakter als vorher (8px → 6px)
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}>

        {/* Live Badge — dezent, links fixiert */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", gap: 5,
          padding: "0 12px",
          borderRight: `1px solid rgba(14,196,184,0.14)`,
          marginRight: 10,
        }}>
          <div className="awb-dot" style={{
            width: 6, height: 6, borderRadius: "50%",   // 7→6
            background: T.teal,
            boxShadow: "0 0 0 2px rgba(14,196,184,0.20)",
          }} />
          <span style={{
            fontSize: 9, fontWeight: 800, color: T.teal,    // 9.5→9
            letterSpacing: ".06em", textTransform: "uppercase",
          }}>Live</span>
        </div>

        {/* Scrolling ticker */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="awb-ticker" style={{
            display: "inline-flex", gap: 28, whiteSpace: "nowrap",
          }}>
            {items.map((item, i) => (
              <div key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 12 }}>{item.emoji}</span>
                <span style={{
                  fontSize: 11, color: T.inkFaint, fontWeight: 500,    // 11.5→11
                  letterSpacing: "-0.01em",
                }}>
                  {item.text}
                </span>
                <span style={{
                  width: 2, height: 2, borderRadius: "50%",    // 3→2
                  background: "rgba(26,53,48,0.15)", flexShrink: 0,
                }} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
