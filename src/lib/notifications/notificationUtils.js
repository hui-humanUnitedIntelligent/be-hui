// ── Zeit-Formatter ────────────────────────────────────────────
export function fmtTime(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "Gerade eben";
  if (diff < 3600)  return `vor ${Math.floor(diff/60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std`;
  if (diff < 172800)return "gestern";
  return `vor ${Math.floor(diff/86400)} Tagen`;
}

export const PANEL_CSS = `
@keyframes rz-slide-in {
  from { transform: translateX(100%); opacity: 0.6; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes rz-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.rz-panel {
  animation: rz-slide-in 0.32s cubic-bezier(0.22,1,0.36,1) both;
}
.rz-backdrop {
  animation: rz-fade-in 0.22s ease both;
}
.rz-tab { transition: all 0.18s ease; }
.rz-tab:active { transform: scale(0.95); }
`;

let _css = false;
export function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const el = document.createElement("style");
  el.textContent = PANEL_CSS;
  document.head.appendChild(el);
}
