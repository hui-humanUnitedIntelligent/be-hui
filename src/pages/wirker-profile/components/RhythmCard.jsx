// components/RhythmCard.jsx
// Zeigt kreativen Rhythmus (Phase 6G: nicht "consistent")
// REGEL: Nur rendern wenn shouldShowRhythm === true

import React from "react";

/**
 * @param {{ rhythm: { icon: string, label: string } | null }} props
 */
export function RhythmCard({ rhythm }) {
  if (!rhythm) return null;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, color: "rgba(0,0,0,0.42)",
      background: "rgba(0,0,0,0.04)",
      borderRadius: 50, padding: "3px 9px",
      border: "1px solid rgba(0,0,0,0.07)",
    }}>
      <span style={{ fontSize: 10 }}>{rhythm.icon}</span>
      {rhythm.label}
    </span>
  );
}
