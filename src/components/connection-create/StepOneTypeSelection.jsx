// connection-create/StepOneTypeSelection.jsx v5
// ROOT CAUSE FIX: Weiter-Button direkt nach den Cards (inline, im Scroll-Container)
// Kein sticky/fixed/Portal — einfach an der richtigen Stelle im DOM
// Props: value (formData.type), onSelect (setzt type), onAdvance (goTo 2)

import React from "react";
import { CONNECTION_TYPES } from "./ConnectionTypeSidebar.jsx";

const V   = "#8B5CF6";
const V2  = "#7C3AED";
const INK = "#1A1A1A";
const MUT = "rgba(80,80,80,0.50)";

const CSS = `
  @keyframes s1-card-in {
    from { opacity:0; transform:translateY(16px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes s1-glow {
    0%,100% { box-shadow: 0 6px 28px rgba(139,92,246,0.18), 0 0 0 2px rgba(139,92,246,0.24); }
    50%     { box-shadow: 0 10px 38px rgba(139,92,246,0.30), 0 0 0 2.5px rgba(139,92,246,0.36); }
  }
  @keyframes s1-float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-3px); }
  }
  @keyframes s1-btn-appear {
    from { opacity:0; transform:translateY(10px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes s1-btn-pulse {
    0%,100% { box-shadow: 0 8px 28px rgba(139,92,246,0.32); }
    50%     { box-shadow: 0 12px 40px rgba(139,92,246,0.50); }
  }

  .s1-card {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    pointer-events: auto;
  }
  .s1-card:active { transform: scale(0.982) translateY(1.5px) !important; }

  .s1-next-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    pointer-events: auto;
  }
  .s1-next-btn:active { transform: scale(0.982) translateY(1.5px) !important; }
`;

export default function StepOneTypeSelection({ value, onSelect, onAdvance }) {
  const hasSelection = !!value;

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
        marginBottom: 28,
        maxWidth: 400,
        animation: "s1-card-in 0.20s ease both",
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
        gap: 11,
        width: "100%",
        maxWidth: 500,
      }}>
        {CONNECTION_TYPES.map((t, i) => {
          const on = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className="s1-card"
              onClick={() => {
                onSelect?.(t.key);
              }}
              style={{
                textAlign: "left",
                width: "100%",
                padding: "17px 19px",
                borderRadius: 20,
                background: on
                  ? "linear-gradient(135deg,rgba(139,92,246,0.09),rgba(124,58,237,0.05))"
                  : "rgba(255,255,255,0.88)",
                border: on
                  ? "2px solid rgba(139,92,246,0.32)"
                  : "1.5px solid rgba(225,220,238,0.90)",
                boxShadow: on ? "none" : "0 2px 14px rgba(0,0,0,0.05)",
                animation: on
                  ? "s1-glow 3s ease-in-out infinite"
                  : `s1-card-in ${0.06 + i * 0.045}s ease both`,
                display: "flex",
                alignItems: "center",
                gap: 15,
                transition: "background 0.14s, border 0.14s",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                background: on
                  ? `linear-gradient(135deg,${V},${V2})`
                  : "rgba(139,92,246,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 23,
                boxShadow: on ? "0 5px 15px rgba(139,92,246,0.26)" : "none",
                transition: "all 0.18s ease",
                animation: on ? "s1-float 3.5s ease-in-out infinite" : "none",
              }}>
                {t.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15.5, fontWeight: 800,
                  color: on ? V : INK,
                  marginBottom: 3, letterSpacing: -0.25,
                  transition: "color 0.14s",
                }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.50 }}>
                  {t.desc}
                </div>
              </div>

              {/* Check / Arrow */}
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: on ? V : "transparent",
                border: on ? "none" : "1.5px solid rgba(0,0,0,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: on ? 13 : 16,
                color: on ? "white" : "rgba(0,0,0,0.14)",
                transition: "all 0.16s",
              }}>
                {on ? "\u2713" : "\u203a"}
              </div>
            </button>
          );
        })}
      </div>

      {/* ══ WEITER-BUTTON — DIREKT NACH DEN CARDS ══
          Kein sticky, kein fixed, kein Portal.
          Einfach inline im selben Scroll-Container.
          Erscheint sofort nach Card-Auswahl.
      */}
      <div style={{
        width: "100%",
        maxWidth: 500,
        marginTop: 20,
        animation: hasSelection ? "s1-btn-appear 0.22s cubic-bezier(0.22,1,0.36,1) both" : "none",
      }}>
        <button
          type="button"
          className="s1-next-btn"
          onClick={() => {
            onAdvance?.();
          }}
          disabled={!hasSelection}
          style={{
            width: "100%",
            height: 54,
            borderRadius: 99,
            background: hasSelection
              ? `linear-gradient(135deg,${V} 0%,${V2} 100%)`
              : "rgba(139,92,246,0.14)",
            border: "none",
            color: hasSelection ? "white" : "rgba(139,92,246,0.40)",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: -0.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.20s, color 0.20s, box-shadow 0.20s",
            animation: hasSelection ? "s1-btn-pulse 2.5s ease-in-out infinite" : "none",
            cursor: hasSelection ? "pointer" : "default",
          }}
        >
          {hasSelection ? (
            <>
              Weiter
              <span style={{ fontSize: 20, lineHeight: 1, marginLeft: 2 }}>→</span>
            </>
          ) : (
            "Kategorie w\u00e4hlen"
          )}
        </button>

        {/* Micro-Hint */}
        {hasSelection && (
          <div style={{
            textAlign: "center",
            fontSize: 12,
            color: MUT,
            marginTop: 10,
            animation: "s1-btn-appear 0.18s 0.10s ease both",
          }}>
            Du hast gew\u00e4hlt: <strong style={{ color: V }}>{
              CONNECTION_TYPES.find(t => t.key === value)?.label
            }</strong>
          </div>
        )}
      </div>
    </div>
  );
}
