// src/system/flows/experience/ExperienceTokens.js
// Design-Tokens + EInput-Style für den Experience-Flow.
// GETRENNT von ExperienceFlow.jsx um zirkuläre Importe zu brechen:
//   ExperienceFlow → ExperienceCreateStep → ExperienceFlow (❌ Zyklus)
//   ExperienceFlow → ExperienceCreateStep → ExperienceTokens (✅ kein Zyklus)

export const ET = {
  teal:    "#0ABFB8",  tealD:  "#0891B2",
  coral:   "#FB923C",  coralD: "#EA580C",
  violet:  "#8B5CF6",  violetD:"#7C3AED",
  gold:    "#F59E0B",  goldD:  "#D97706",
  ink:     "#1A1A2E",
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.38)",
  ink4:    "rgba(26,26,46,0.20)",
  bg:      "#F8F7FF",
  card:    "#FFFFFF",
  border:  "rgba(26,26,46,0.08)",
  glass:   "rgba(255,255,255,0.90)",
};

export const EInput = {
  width:"100%", padding:"13px 14px", borderRadius:14,
  border:"1.5px solid rgba(26,26,46,0.09)",
  background:"rgba(248,247,255,0.70)",
  fontSize:15, color:"#1A1A2E",
  outline:"none", fontFamily:"inherit",
};
