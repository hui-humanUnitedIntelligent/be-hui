// MeinHuiNav — Navigation im persönlichen Mein-HUI-Bereich
// Meine Resonanz gehört hierher, nicht ins HUI Studio.

import React from "react";

const T = {
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  ink:      "#1A1A18",
  inkFaint: "rgba(26,26,24,0.28)",
  inkSoft:  "rgba(26,26,24,0.52)",
  border:   "rgba(26,26,24,0.08)",
  px:       20,
  r12: 12, r16: 16, r20: 20,
  card: "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
};

function NavRow({ icon, label, sub, onPress, last = false }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "none",
        border: "none",
        borderBottom: last ? "none" : `1px solid ${T.border}`,
        cursor: "pointer",
        touchAction: "manipulation",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: T.ink }}>{label}</span>
        {sub && (
          <span style={{ display: "block", fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{sub}</span>
        )}
      </span>
      <span style={{ fontSize: 16, color: T.inkFaint, flexShrink: 0 }}>›</span>
    </button>
  );
}

export default function MeinHuiNav({
  onOpenResonanz,
  onOpenSettings,
  onOpenStudio,
}) {
  return (
    <div style={{ padding: `0 ${T.px}px`, marginBottom: 32 }}>
      <div style={{ height: 1, background: T.border, marginBottom: 24 }} />

      <div style={{
        background: T.bgCard,
        borderRadius: T.r20,
        border: `1px solid ${T.border}`,
        boxShadow: T.card,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌿</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
              Mein HUI
            </div>
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>
              Deine persönliche Resonanz und Verwaltung
            </div>
          </div>
        </div>

        <div style={{
          background: T.bgCard,
          borderRadius: T.r16,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}>
          <NavRow
            icon="✨"
            label="Meine Resonanz"
            sub="Buchungen, Stimmen und erworbene Werke"
            onPress={onOpenResonanz}
            last
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onOpenSettings}
            style={{
              flex: 1,
              padding: "12px 10px",
              borderRadius: T.r16,
              background: `linear-gradient(135deg,${T.teal},#0DBBAF)`,
              border: "none",
              cursor: "pointer",
              touchAction: "manipulation",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 4px 14px rgba(14,196,184,0.25)",
            }}
          >
            <span style={{ fontSize: 20 }}>⚙️</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "white" }}>Einstellungen</span>
          </button>

          <button
            type="button"
            onClick={onOpenStudio}
            style={{
              flex: 1,
              padding: "12px 10px",
              borderRadius: T.r16,
              background: T.bgCard,
              border: `1.5px solid ${T.border}`,
              cursor: "pointer",
              touchAction: "manipulation",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              boxShadow: T.card,
            }}
          >
            <span style={{ fontSize: 20 }}>🎛️</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.ink }}>HUI Studio</span>
          </button>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: T.r12,
          background: "rgba(14,196,184,0.06)",
          border: "1px solid rgba(14,196,184,0.15)",
        }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.45 }}>
            Meine Resonanz ist privat. HUI Studio verwaltet Creator-Funktionen und Account.
          </span>
        </div>
      </div>
    </div>
  );
}
