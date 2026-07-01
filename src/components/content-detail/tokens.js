import { HUI } from "../../design/hui.design.js";

export const C = {
  teal: HUI.COLOR.teal,
  teal2: HUI.COLOR.tealDeep,
  tealPale: HUI.COLOR.tealPale,
  tealGlow: "rgba(22,215,197,0.22)",
  coral: HUI.COLOR.coral,
  coral2: HUI.COLOR.coral,
  coralPale: HUI.COLOR.coralPale,
  coralGlow: "rgba(255,138,107,0.22)",
  gold: HUI.COLOR.gold,
  goldGlow: "rgba(245,166,35,0.18)",
  warm: HUI.COLOR.cream,
  card: "#FFFFFF",
  ink: HUI.COLOR.ink,
  ink2: HUI.COLOR.ink2,
  muted: "#888",
  muted2: "#BBB",
  border: "rgba(0,0,0,0.07)",
};

export const CSS = `
  @keyframes cdFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cdSkel { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes cdPop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .cd-tap:active { opacity: 0.72; transition: opacity 0.1s; }
  .cd-scroll::-webkit-scrollbar { display: none; }
  .cd-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  .cd-swipe { touch-action: pan-y; user-select: none; }
`;
