import { IX } from "../../../design/hui.interaction.js";
import { SAFE_MODE } from "../../../config/safeMode.js";

export const C = { cream: "#F9F7F4" };

export const SAFE_MOTION_CSS = SAFE_MODE.motion ? '' : `
  /* SafeMode.motion=false: Alle Animationen deaktiviert */
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
`;

export const GLOBAL_CSS = IX.CSS + `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  html, body { margin: 0; padding: 0; background: #F9F7F4; }
  #root { width: 100%; max-width: 100%; overflow-x: hidden; background: #F9F7F4; }
  /* Phase 22: Keine Text-Select beim Tap */
  button, [role="button"] { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
`;
