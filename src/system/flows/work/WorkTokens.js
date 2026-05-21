// src/system/flows/work/WorkTokens.js
// Design-Tokens für den Work-Flow.
// GETRENNT von WorkFlow.jsx um zirkuläre Importe zu brechen:
//   WorkFlow → WorkDetailsStep → WorkFlow (❌ Zyklus)
//   WorkFlow → WorkDetailsStep → WorkTokens (✅ kein Zyklus)

export const WT = {
  teal:    "#0ABFB8",  tealD:  "#0891B2",
  coral:   "#FB923C",  coralD: "#EA580C",
  violet:  "#8B5CF6",
  ink:     "#1A1A2E",
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.38)",
  ink4:    "rgba(26,26,46,0.20)",
  bg:      "#F8F7FF",
  card:    "#FFFFFF",
  border:  "rgba(26,26,46,0.08)",
  glass:   "rgba(255,255,255,0.90)",
};
