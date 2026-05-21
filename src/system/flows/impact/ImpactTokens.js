// src/system/flows/impact/ImpactTokens.js
// Design-Tokens für den Impact-Flow.
// GETRENNT von ImpactFlow.jsx um zirkuläre Importe zu brechen:
//   ImpactFlow → ImpactStep1 → ImpactFlow (❌ Zyklus)
//   ImpactFlow → ImpactStep1 → ImpactTokens (✅ kein Zyklus)

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
