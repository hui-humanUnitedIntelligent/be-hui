// src/content/ContentTypeSelector.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Content Type Selector
// Phase 4B: "Welche Energie möchtest du teilen?"
//
// Öffnet sich wenn + Button / Orb getippt wird.
// 4 klare Content-Typen — kein generischer Monster-Composer.
//
// ORB-REWIRE (2026-09-15, Michael-Spec "Orb-Button — Talent-Upgrade &
// Quick-Upload Hub"): Dieser Selector war seit Phase 4B fertig gebaut,
// aber nie verdrahtet (setShowContentSelector(true) wurde nirgends
// aufgerufen — toter Code). Jetzt live über den Nav-Orb (Talent-User).
// Änderungen im Zuge der Aktivierung:
//   (1) Portal auf document.body + zIndex 10500 (Pflicht-Regel für ALLE
//       Modals — war 9100/9101, UNTER der Navbar(10000); nie aufgefallen,
//       weil der Selector nie live ging).
//   (2) 4. Karte ist jetzt TALENT (statt Einladung) — Spec verlangt
//       Werk/Talent/Erlebnis/Moment. Talent-Karte öffnet den
//       TalentAngebotWizard (identisch zu Mein Bereich). Der
//       InvitationFlow-Zweig in Home.jsx bleibt unangetastet.
//   (3) Alle Texte via i18n (useTranslation) statt hartkodiertem Deutsch.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HUI } from "../design/hui.design.js";
import { useTranslation } from "../hooks/useTranslation.js";

/* ── Design ─────────────────────────────────────────────────── */
const T = {
  teal:    HUI.COLOR.teal,
  coral:   HUI.COLOR.coral,
  violet:  HUI.COLOR.violet,
  gold:    HUI.COLOR.gold,
  ink:     HUI.COLOR.ink,
  ink2:    "#55556B",
  ink3:    "#808098",
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

/* ── Content Typen — ORB-REWIRE: i18n + Talent statt Einladung ── */
function getContentTypes(t) {
  return [
    {
      key:     "moment",
      icon:    "🌿",
      label:   t("orb.moment"),
      sub:     t("cts.sub.moment"),
      desc:    t("cts.desc.moment"),
      color:   HUI.COLOR.teal,
      glow:    "rgba(10,191,184,0.15)",
      border:  "rgba(10,191,184,0.22)",
      bg:      "rgba(10,191,184,0.06)",
    },
    {
      key:     "experience",
      icon:    "📅",
      label:   t("orb.erlebnis"),
      sub:     t("cts.sub.experience"),
      desc:    t("cts.desc.experience"),
      color:   "#38BDF8",
      glow:    "rgba(56,189,248,0.15)",
      border:  "rgba(56,189,248,0.22)",
      bg:      "rgba(56,189,248,0.06)",
    },
    {
      key:     "work",
      icon:    "🎨",
      label:   t("orb.werk"),
      sub:     t("cts.sub.work"),
      desc:    t("cts.desc.work"),
      color:   HUI.COLOR.coral,
      glow:    "rgba(251,146,60,0.15)",
      border:  "rgba(251,146,60,0.22)",
      bg:      "rgba(251,146,60,0.06)",
    },
    {
      // ORB-REWIRE: 4. Karte = Talent (Spec: Werk/Talent/Erlebnis/Moment),
      // helles Mint (#34D399) wie von Michael gewünscht. Ersetzt „Einladung".
      key:     "talent",
      icon:    "⭐",
      label:   t("orb.talent"),
      sub:     t("cts.sub.talent"),
      desc:    t("cts.desc.talent"),
      color:   "#34D399",
      glow:    "rgba(52,211,153,0.15)",
      border:  "rgba(52,211,153,0.22)",
      bg:      "rgba(52,211,153,0.06)",
    },
  ];
}

/* ── TypeCard ───────────────────────────────────────────────── */
function TypeCard({ type, idx, onSelect }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      className="cts-tap cts-card"
      aria-label={`${type.label} — ${type.sub}`}
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
          fontWeight: 600,
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
  const { t } = useTranslation();
  const contentTypes = getContentTypes(t);
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

  // ORB-REWIRE: createPortal auf document.body — escaped jeden Ancestor-
  // Stacking-Context (Pflicht-Regel für alle Modals/Sheets, siehe
  // footer-navbar-zindex.md). zIndex 10500 > Navbar (10000).
  return createPortal(
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleBackdropTap}
        style={{
          position:   "fixed",
          inset:      0,
          zIndex:     10500,
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
          zIndex:       10501,
          background:   T.bg,
          borderRadius: "28px 28px 0 0",
          padding:      "0 0 max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 24px), 24px)",
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
              fontWeight: 600,
              color:        T.ink,
              letterSpacing: -0.5,
              lineHeight:   1.15,
            }}>
              {t("cts.title")}
            </div>
            <button
              className="cts-tap"
              aria-label={t("cts.close")}
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
            {t("cts.subtitle")}
          </div>
        </div>

        {/* Type Cards */}
        <div style={{
          display:       "flex",
          flexDirection: "column",
          gap:           10,
          padding:       "12px 16px 20px",
        }}>
          {contentTypes.map((type, idx) => (
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
          {t("cts.footer")}
        </div>
      </div>
    </>,
    document.body
  );
}
