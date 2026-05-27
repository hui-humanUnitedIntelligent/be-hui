// src/components/home/AmbientWorldBar.jsx — Phase 2.5
// Shows real-time world activity at the top of the feed.
// Communicates: "HUI is alive. People are connecting right now."
// ══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { useConnectionEngine } from "../../core/HuiConnectionEngine.jsx";

const T = {
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  coral:    "#FF6B52",
  ink:      "#0F1117",
  inkFaint: "rgba(15,17,23,0.32)",
  bg:       "rgba(255,255,255,0.88)",
};

const CSS = `
  @keyframes awb-slide { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes awb-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(.85)} }
  @keyframes awb-fade   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .awb-ticker { animation: awb-slide 28s linear infinite; }
  .awb-dot    { animation: awb-pulse 2.2s ease-in-out infinite; }
`;

const ACTIVITY_POOL = [
  { emoji:"✦",  text:"Mia & Jonas haben sich verbunden",       color:T.teal  },
  { emoji:"🌿",  text:"Neuer Waldbaden-Abend in München",       color:"#16A34A"},
  { emoji:"🐾",  text:"Tierheim-Tag: 9 freie Plätze",          color:"#D97706"},
  { emoji:"💛",  text:"Stadtgarten Netz: 47 Unterstützer",      color:T.coral  },
  { emoji:"🧘",  text:"Lena öffnet Meditationsraum",            color:"#9333EA"},
  { emoji:"🎶",  text:"Akustik Abend: ausverkauft",             color:"#6366F1"},
  { emoji:"🌱",  text:"Felix started a new initiative",         color:"#16A34A"},
  { emoji:"☕",  text:"Morgenrunde: 4 Menschen dabei",          color:T.teal  },
  { emoji:"✨",  text:"Anna teilt neuen Moment",                color:T.coral  },
  { emoji:"🌎",  text:"Küsten Cleanup: 89 aktive Mitglieder",   color:T.teal  },
];

export default function AmbientWorldBar() {
  const engine = useConnectionEngine();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Use engine's ambient activity if available, else pool
  const activity = engine?.ambientActivity?.length > 0
    ? engine.ambientActivity.map((a, i) => ({ emoji: a.emoji, text: a.text, color: T.teal }))
    : ACTIVITY_POOL;

  // Duplicate for seamless loop
  const items = [...activity, ...activity];

  if (!visible) return null;

  return (
    <div style={{
      width: "100%", overflow: "hidden",
      opacity: visible ? 1 : 0,
      transition: "opacity .5s ease",
    }}>
      <style>{CSS}</style>
      <div style={{
        background: T.bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(14,196,184,0.12)",
        padding: "8px 0",
        display: "flex", alignItems: "center",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Live indicator */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", gap: 5,
          padding: "0 12px",
          borderRight: "1px solid rgba(14,196,184,0.18)",
          marginRight: 8,
        }}>
          <div className="awb-dot" style={{
            width: 7, height: 7, borderRadius: "50%",
            background: T.teal,
            boxShadow: "0 0 0 2px rgba(14,196,184,0.25)",
          }} />
          <span style={{
            fontSize: 9.5, fontWeight: 800, color: T.teal,
            letterSpacing: ".05em", textTransform: "uppercase",
            fontFamily: "-apple-system, sans-serif",
          }}>Live</span>
        </div>

        {/* Scrolling ticker */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="awb-ticker" style={{
            display: "inline-flex", gap: 32, whiteSpace: "nowrap",
          }}>
            {items.map((item, i) => (
              <div key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                fontFamily: "-apple-system, sans-serif",
              }}>
                <span style={{ fontSize: 13 }}>{item.emoji}</span>
                <span style={{ fontSize: 11.5, color: T.inkFaint, fontWeight: 500 }}>
                  {item.text}
                </span>
                <span style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: "rgba(15,17,23,0.20)", flexShrink: 0,
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* World energy meter */}
        {engine?.worldEnergy > 0 && (
          <div style={{
            flexShrink: 0, padding: "0 12px",
            display: "flex", alignItems: "center", gap: 5,
            borderLeft: "1px solid rgba(14,196,184,0.12)",
          }}>
            <div style={{
              width: 32, height: 3, borderRadius: 99,
              background: "rgba(14,196,184,0.12)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${engine.worldEnergy}%`,
                background: `linear-gradient(90deg, ${T.teal}, #0DBBAF)`,
                transition: "width 1s ease",
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
