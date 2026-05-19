// connection-create/StepOneTypeSelection.jsx v3
// STEP 1 — "Was möchtest du erschaffen?"
// DIREKTES onClick → onSelect(key) ohne setTimeout, ohne pressedKey-Blocker
// iOS-sicher: type="button", touch-action:manipulation, kein preventDefault

import React, { useState } from "react";
import { CONNECTION_TYPES } from "./ConnectionTypeSidebar.jsx";

const V  = "#8B5CF6";
const V2 = "#7C3AED";
const INK  = "#1A1A1A";
const MUT  = "rgba(80,80,80,0.50)";

const CSS = `
  @keyframes s1-in {
    from { opacity:0; transform:translateY(18px) scale(0.98); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes s1-glow {
    0%,100% { box-shadow:0 6px 28px rgba(139,92,246,0.20), 0 0 0 2px rgba(139,92,246,0.26); }
    50%     { box-shadow:0 10px 40px rgba(139,92,246,0.32), 0 0 0 2.5px rgba(139,92,246,0.38); }
  }
  @keyframes s1-float {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-3px); }
  }

  /* iOS-kritisch */
  .s1-btn {
    display: block;
    text-align: left;
    width: 100%;
    border: none;
    outline: none;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    pointer-events: auto;
  }
  .s1-btn:active { opacity: 0.85; transform: scale(0.975); }
`;

export default function StepOneTypeSelection({ value, onSelect }) {
  const [active, setActive] = useState(value || null);

  function handleTap(key) {
    console.log("[STEP1 CLICK]", key);   // Debug: muss in Console erscheinen
    setActive(key);
    onSelect?.(key);                      // SOFORT — kein setTimeout
  }

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 20px 40px",
      overflowY: "auto",
      overflowX: "hidden",
      WebkitOverflowScrolling: "touch",
    }}>
      <style>{CSS}</style>

      {/* ── Headline ── */}
      <div style={{
        textAlign: "center",
        marginBottom: 32,
        maxWidth: 400,
        animation: "s1-in 0.22s ease both",
      }}>
        <div style={{
          fontSize: 26, fontWeight: 900, color: INK,
          letterSpacing: -0.7, lineHeight: 1.2, marginBottom: 10,
        }}>
          Was m\u00f6chtest du erschaffen?
        </div>
        <div style={{ fontSize: 14.5, color: MUT, lineHeight: 1.65 }}>
          W\u00e4hle einen Moment \u2014 und lade andere ein, Teil davon zu sein.
        </div>
      </div>

      {/* ── Cards ── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        maxWidth: 500,
      }}>
        {CONNECTION_TYPES.map((t, i) => {
          const on = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className="s1-btn"
              onClick={() => handleTap(t.key)}
              style={{
                padding: "18px 20px",
                borderRadius: 22,
                background: on
                  ? "linear-gradient(135deg,rgba(139,92,246,0.10),rgba(124,58,237,0.06))"
                  : "rgba(255,255,255,0.85)",
                border: on
                  ? `2px solid rgba(139,92,246,0.35)`
                  : "1.5px solid rgba(230,225,240,0.90)",
                boxShadow: on
                  ? "0 0 0 0 transparent"
                  : "0 3px 16px rgba(0,0,0,0.055)",
                animation: on
                  ? "s1-glow 3s ease-in-out infinite"
                  : `s1-in ${0.07 + i * 0.05}s ease both`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "background 0.15s, border 0.15s",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                flexShrink: 0,
                background: on
                  ? `linear-gradient(135deg,${V},${V2})`
                  : "rgba(139,92,246,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: on ? `0 5px 16px rgba(139,92,246,0.28)` : "none",
                transition: "all 0.20s",
                animation: on ? "s1-float 3.5s ease-in-out infinite" : "none",
              }}>
                {t.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: on ? V : INK,
                  marginBottom: 3,
                  letterSpacing: -0.25,
                  transition: "color 0.15s",
                }}>
                  {t.label}
                </div>
                <div style={{
                  fontSize: 13,
                  color: MUT,
                  lineHeight: 1.50,
                }}>
                  {t.desc}
                </div>
              </div>

              {/* Arrow */}
              <div style={{
                fontSize: 20,
                color: on ? V : "rgba(0,0,0,0.15)",
                transition: "color 0.15s, transform 0.15s",
                transform: on ? "translateX(2px)" : "translateX(0)",
                flexShrink: 0,
              }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
