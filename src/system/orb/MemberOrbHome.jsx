// src/system/orb/MemberOrbHome.jsx
// Phase 15.3 — Member Orb Home Screen
//
// Gerendert wenn: membershipType !== "basis" UND Orb öffnet.
// Garantiert: IMMER gültiger Content. Niemals leerer Zustand.
// Design: ruhig, atmosphärisch, kein Marketplace-Gefühl.

import React from "react";
import { T } from "./OrbConfig.js";

const SHORTCUTS = [
  { key: "resonanz",  icon: "◎", label: "Resonanzräume",  color: T.teal,  action: "connect"    },
  { key: "werk",      icon: "✦", label: "Werk erschaffen", color: T.coral, action: "werk"       },
  { key: "impact",    icon: "◈", label: "Wirkung starten", color: "#FF8A6B", action: "impact"   },
  { key: "discover",  icon: "⊙", label: "Entdecken",       color: "#9B8EF5", action: "discover" },
];

export default function MemberOrbHome({ membershipType = "member", onAction, onClose }) {
  const greeting = membershipType === "creator" ? "Willkommen zurück, Kreativer."
    : membershipType === "guide"   ? "Willkommen zurück, Guide."
    : "Willkommen zurück.";

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 9000,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: T.bgGrad,
      padding: "0 24px",
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Schließen"
        style={{
          position: "absolute",
          top: "max(44px, env(safe-area-inset-top, 44px))",
          right: 20,
          width: 40, height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1.5px solid rgba(0,0,0,0.07)",
          fontSize: 16, color: T.ink3,
          cursor: "pointer",
        }}
      >✕</button>

      {/* Greeting */}
      <div style={{
        textAlign: "center",
        marginBottom: 40,
      }}>
        <div style={{
          fontSize: 22, fontWeight: 800,
          color: T.ink, letterSpacing: -0.6,
          lineHeight: 1.2, marginBottom: 8,
        }}>{greeting}</div>
        <div style={{
          fontSize: 13, color: T.ink3,
          letterSpacing: 0.1, lineHeight: 1.5,
        }}>
          Was möchtest du heute erschaffen?
        </div>
      </div>

      {/* Shortcuts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        width: "100%",
        maxWidth: 340,
      }}>
        {SHORTCUTS.map(sc => (
          <button
            key={sc.key}
            onClick={() => { onAction?.(sc.action); }}
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: `1.5px solid rgba(0,0,0,0.06)`,
              borderRadius: 20,
              padding: "18px 14px",
              cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "flex-start", gap: 8,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
            onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: `${sc.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: sc.color,
            }}>{sc.icon}</div>
            <div style={{
              fontSize: 12.5, fontWeight: 700,
              color: T.ink, lineHeight: 1.2,
              textAlign: "left",
            }}>{sc.label}</div>
          </button>
        ))}
      </div>

      {/* Mantra */}
      <div style={{
        position: "absolute",
        bottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        left: 0, right: 0,
        textAlign: "center",
        fontSize: 10.5, color: T.ink4,
        letterSpacing: 0.5,
        pointerEvents: "none",
      }}>
        HUI — Human United Intelligent
      </div>
    </div>
  );
}
