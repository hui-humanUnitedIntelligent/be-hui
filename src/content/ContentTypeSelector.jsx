// src/content/ContentTypeSelector.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Content Type Selector
// Phase 4B: "Welche Energie möchtest du teilen?"
//
// Öffnet sich wenn + Button / Orb getippt wird.
// 4 klare Content-Typen — kein generischer Monster-Composer.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";
import { HUI } from "../design/hui.design.js";

/* ── Design ─────────────────────────────────────────────────── */
const T = {
  teal:    HUI.COLOR.teal,
  coral:   HUI.COLOR.coral,
  violet:  HUI.COLOR.violet,
  gold:    HUI.COLOR.gold,
  ink:     HUI.COLOR.ink,
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.38)",
  cream:   HUI.COLOR.cream,
  bg:      "rgba(249,247,244,0.98)",
  glass:   "rgba(255,255,255,0.90)",
};

const CSS = `
  @keyframes cts-up    { from{opacity:0;transform:translateY(32px) scale(.97)} to{opacity:1;transform:none} }
  @keyframes cts-fade  { from{opacity:0} to{opacity:1} }
  @keyframes cts-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  .cts-tap { cursor:pointer; -webkit-tap-highlight-color:transparent; transition:transform .14s, opacity .14s; }
  .cts-tap:active { transform:scale(.95) !important; opacity:.80; }
  .cts-card { transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
  .cts-card:hover { transform:translateY(-2px); }
`;

/* ── Content Typen ──────────────────────────────────────────── */
const CONTENT_TYPES = [
  {
    key:     "moment",
    icon:    "🌿",
    label:   "Moment",
    sub:     "Gedanken · Fotos · Stimmung",
    desc:    "Spontan, authentisch, menschlich.",
    color:   HUI.COLOR.teal,
    glow:    "rgba(10,191,184,0.15)",
    border:  "rgba(10,191,184,0.22)",
    bg:      "rgba(10,191,184,0.06)",
  },
  {
    key:     "experience",
    icon:    "📅",
    label:   "Erlebnis",
    sub:     "Workshop · Session · Treffen",
    desc:    "Eine Begegnung die verbindet.",
    color:   "#38BDF8",
    glow:    "rgba(56,189,248,0.15)",
    border:  "rgba(56,189,248,0.22)",
    bg:      "rgba(56,189,248,0.06)",
  },
  {
    key:     "work",
    icon:    "🎨",
    label:   "Werk",
    sub:     "Kunst · Design · Portfolio",
    desc:    "Deine Schöpfung verdient einen Raum.",
    color:   HUI.COLOR.coral,
    glow:    "rgba(251,146,60,0.15)",
    border:  "rgba(251,146,60,0.22)",
    bg:      "rgba(251,146,60,0.06)",
  },
  {
    key:     "invitation",
    icon:    "👥",
    label:   "Einladung",
    sub:     "Spontan · Jetzt · Lokal",
    desc:    "Wer hat Lust auf heute?",
    color:   HUI.COLOR.violet,
    glow:    "rgba(139,92,246,0.15)",
    border:  "rgba(139,92,246,0.22)",
    bg:      "rgba(139,92,246,0.06)",
  },
];

/* ── TypeCard ───────────────────────────────────────────────── */
function TypeCard({ type, idx, onSelect }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      className="cts-tap cts-card"
      onClick={() => onSelect(type.key)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            16,
        width:          "100%",
        padding:        "16px 18px",
        borderRadius:   20,
        border:         `1.5px solid ${pressed ? type.color + "55" : type.border}`,
        background:     pressed ? type.glow : type.bg,
        cursor:         "pointer",
        textAlign:      "left",
        boxShadow:      pressed
          ? `0 4px 20px ${type.glow}, 0 1px 4px rgba(0,0,0,0.06)`
          : "0 1px 4px rgba(0,0,0,0.04)",
        animation:      `cts-up ${0.28 + idx * 0.06}s cubic-bezier(.22,1,.36,1) both`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Icon */}
      <div style={{
        width:     52,
        height:    52,
        borderRadius: 16,
        background:   type.glow,
        border:       `1.5px solid ${type.border}`,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        fontSize:     26,
        flexShrink:   0,
      }}>
        {type.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:   16,
          fontWeight: 700,
          color:      T.ink,
          letterSpacing: -0.3,
          marginBottom: 2,
        }}>
          {type.label}
        </div>
        <div style={{
          fontSize:   12.5,
          color:      type.color,
          fontWeight: 600,
          marginBottom: 3,
          letterSpacing: -0.1,
        }}>
          {type.sub}
        </div>
        <div style={{
          fontSize:   12,
          color:      T.ink3,
          lineHeight: 1.3,
        }}>
          {type.desc}
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        fontSize:   18,
        color:      type.color,
        opacity:    0.7,
        flexShrink: 0,
      }}>›</div>
    </button>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function ContentTypeSelector({ onSelect, onClose, visible = true }) {
  const overlayRef = useRef(null);

  // Close on backdrop tap
  const handleBackdropTap = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  // Close on swipe down
  const startY = useRef(null);
  const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const handleTouchEnd   = (e) => {
    if (startY.current != null) {
      const delta = e.changedTouches[0].clientY - startY.current;
      if (delta > 80) onClose?.();
    }
    startY.current = null;
  };

  if (!visible) return null;

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleBackdropTap}
        style={{
          position:   "fixed",
          inset:      0,
          zIndex:     9100,
          background: "rgba(15,15,25,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          animation:  "cts-fade 0.22s ease both",
        }}
      />

      {/* Bottom Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position:     "fixed",
          bottom:       0,
          left:         0,
          right:        0,
          zIndex:       9101,
          background:   T.bg,
          borderRadius: "28px 28px 0 0",
          padding:      "0 0 env(safe-area-inset-bottom,24px)",
          maxHeight:    "88vh",
          overflowY:    "auto",
          boxShadow:    "0 -8px 48px rgba(0,0,0,0.18)",
          animation:    "cts-up 0.32s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        {/* Handle */}
        <div style={{
          width:      40,
          height:     4,
          borderRadius: 2,
          background: "rgba(0,0,0,0.12)",
          margin:     "12px auto 0",
        }}/>

        {/* Header */}
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}>
            <div style={{
              fontSize:     21,
              fontWeight:   800,
              color:        T.ink,
              letterSpacing: -0.5,
              lineHeight:   1.15,
            }}>
              Was möchtest du<br />
              <span style={{ color: T.teal }}>teilen?</span>
            </div>
            <button
              className="cts-tap"
              onClick={onClose}
              style={{
                background: "rgba(0,0,0,0.06)",
                border:     "none",
                borderRadius: 50,
                width:      34,
                height:     34,
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:     "pointer",
                fontSize:   18,
                color:      T.ink2,
                flexShrink: 0,
              }}
            >×</button>
          </div>
          <div style={{
            fontSize:   13,
            color:      T.ink3,
            letterSpacing: -0.1,
          }}>
            Welche Art von Energie möchtest du in die Welt senden?
          </div>
        </div>

        {/* Type Cards */}
        <div style={{
          display:       "flex",
          flexDirection: "column",
          gap:           10,
          padding:       "12px 16px 20px",
        }}>
          {CONTENT_TYPES.map((type, idx) => (
            <TypeCard
              key={type.key}
              type={type}
              idx={idx}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign:  "center",
          fontSize:   11.5,
          color:      T.ink3,
          paddingBottom: 8,
          letterSpacing: "0.02em",
        }}>
          ✦ Jede Energie zählt
        </div>
      </div>
    </>
  );
}
