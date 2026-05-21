// src/system/flows/impact/ImpactTokens.js
// Design-Tokens + Style-Objekte + shared Komponenten für den Impact-Flow.
// GETRENNT von ImpactFlow.jsx um zirkuläre Importe zu brechen.

import React from "react";

export const IT = {
  teal:   "#0ABFB8",  tealD:  "#0891B2",
  coral:  "#FB923C",  coralD: "#EA580C",
  green:  "#10B981",  greenD: "#059669",
  violet: "#8B5CF6",
  ink:    "#1A1A2E",
  ink2:   "rgba(26,26,46,0.60)",
  ink3:   "rgba(26,26,46,0.38)",
  ink4:   "rgba(26,26,46,0.16)",
  bg:     "#F8F7FF",
  card:   "#FFFFFF",
  border: "rgba(26,26,46,0.08)",
  glass:  "rgba(255,255,255,0.88)",
};

export const IInput = {
  width:"100%", padding:"13px 14px", borderRadius:14,
  border:"1.5px solid rgba(26,26,46,0.09)",
  background:"rgba(248,247,255,0.70)",
  fontSize:15, color:IT.ink,
  outline:"none", fontFamily:"inherit",
};

export const ITextarea = {
  ...IInput,
  resize:"none", lineHeight:1.6, paddingBottom:12,
};

export function ImpactNextBtn({ label="Weiter \u2192", onClick, disabled }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width:"100%", padding:"16px",
        borderRadius:18,
        background: disabled
          ? "rgba(26,26,46,0.08)"
          : `linear-gradient(135deg, ${IT.teal} 0%, ${IT.coral} 100%)`,
        color: disabled ? IT.ink3 : "#fff",
        border:"none", fontWeight:800, fontSize:16,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: pressed && !disabled ? "scale(0.97)" : "scale(1)",
        transition:"all 0.18s ease",
        boxShadow: disabled ? "none"
          : `0 6px 24px rgba(10,191,184,0.28)`,
      }}
    >
      {label}
    </button>
  );
}
