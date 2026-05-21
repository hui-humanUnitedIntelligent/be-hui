// src/system/flows/experience/ExperienceTokens.js
// Design-Tokens + Style-Objekte für den Experience-Flow.
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

export const ESelect = {
  ...EInput,
  padding:"12px 34px 12px 14px",
  appearance:"none", WebkitAppearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%231A1A2E' stroke-opacity='0.4' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat",
  backgroundPosition:"right 12px center",
  cursor:"pointer",
};
