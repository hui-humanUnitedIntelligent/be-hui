// src/features/resonance/foundation/ResonanceSectionShell.jsx
// Gemeinsamer Rahmen für Foundation-Sektionen — kein Dashboard, sondern Raum.

import React from "react";

const T = {
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.50)",
  inkFaint: "rgba(26,26,24,0.30)",
  border:   "rgba(26,26,24,0.07)",
  px:       20,
};

export default function ResonanceSectionShell({ title, tagline, icon, children }) {
  return (
    <section style={{ paddingBottom: 24 }}>
      <div style={{ padding: `8px ${T.px}px 20px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
          <h2 style={{
            margin: 0, fontSize: 20, fontWeight: 800, color: T.ink,
            letterSpacing: "-0.03em", lineHeight: 1.2,
          }}>
            {title}
          </h2>
        </div>
        {tagline && (
          <p style={{
            margin: 0, fontSize: 13, color: T.inkSoft, lineHeight: 1.55,
            paddingLeft: icon ? 32 : 0,
          }}>
            {tagline}
          </p>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${T.border}` }}>
        {children}
      </div>
    </section>
  );
}
