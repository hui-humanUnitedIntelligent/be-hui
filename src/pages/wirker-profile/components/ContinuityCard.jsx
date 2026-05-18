// components/ContinuityCard.jsx
// Zeigt Bridge-Creator Domain-Kontinuität (Phase 6G)
// REGEL: Nur rendern wenn shouldShowBridge === true

import React from "react";

const C = { teal: "#16D7C5" };

/**
 * @param {{ continuity: { isBridge: boolean, domains: string[], label: string } | null }} props
 */
export function ContinuityCard({ continuity }) {
  if (!continuity?.isBridge) return null;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, color: "rgba(0,0,0,0.42)",
      background: "rgba(0,0,0,0.04)",
      borderRadius: 50, padding: "3px 9px",
      border: "1px solid rgba(0,0,0,0.07)",
    }}>
      <span style={{ fontSize: 10, color: C.teal }}>⬡</span>
      {continuity.label}
    </span>
  );
}
