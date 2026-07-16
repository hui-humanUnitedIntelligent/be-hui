import { HUI } from "../../../design/hui.design.js";

export const T = {
  teal:      "#0DC4B5",
  tealL:     "#22DDD0",
  tealGlow:  "rgba(13,196,181,0.20)",
  coral:     "#F4714F",
  coralGlow: "rgba(244,113,79,0.18)",
  gold:      "#D4952A",
  goldGlow:  "rgba(212,149,42,0.16)",
  violet:    "#7264D6",
  violetGlow:"rgba(114,100,214,0.16)",
  page:      "#F9F7F4",
  surface:   "#FDFAF5",
  surfaceHi: "#FFFFFF",
  hero:      "#FBF1E0",
  ink:       "#141422",
  ink2:      "#38384F",
  muted:     "#898998",
  faint:     "#C2C2D0",
  line:      "rgba(0,0,0,0.045)",
  ff:        HUI?.FONT?.family || "-apple-system,'SF Pro Display',sans-serif",
};

export const S = {
  card:  "0 2px 20px rgba(0,0,0,0.055), 0 1px 4px rgba(0,0,0,0.030)",
  cardH: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.038)",
  glass: "0 4px 24px rgba(0,0,0,0.06), 0 1px 6px rgba(0,0,0,0.03)",
  btn:   (c) => `0 4px 18px ${c}38, 0 1px 4px ${c}28`,
};

// Konstanten
export const CYCLE_STEPS = [
  { icon:"📝", label:"Projekt einreichen"          },
  { icon:"🔍", label:"HUI-Team prüft"              },
  { icon:"🌿", label:"3 Projekte nominiert"         },
  { icon:"🩷", label:"Community stimmt ab"          },
  { icon:"🏆", label:"Sieger erhält volle Summe"   },
  { icon:"🌱", label:"Restbetrag wird verteilt"     },
];

export const POOL_SLICES = [
  { pct:40, emoji:"🗳", label:"Community-Fonds",      color:T.teal   },
  { pct:30, emoji:"🚀", label:"Wirkungsbudget",        color:T.coral  },
  { pct:20, emoji:"💡", label:"Innovationsbudget",     color:T.gold   },
  { pct:10, emoji:"🛡", label:"Kurationsbudget",       color:T.violet },
];

// SEED_PROJECTS deaktiviert — nur echte Projekte aus impact_applications (status=approved)
export const SEED_PROJECTS = [];
