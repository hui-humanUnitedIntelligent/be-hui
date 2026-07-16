// ── Helpers ──────────────────────────────────────────────────
export const safeArr = (v) => Array.isArray(v) ? v : [];
export const safeNum = (v) => (typeof v === "number" && isFinite(v)) ? v : 0;
export const fmtEur  = (n) =>
  `€${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;

export function relTime(ts) {
  if (!ts) return "";
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60)    return "vor 1 Min.";
  if (d < 3600)  return `vor ${Math.round(d / 60)} Min.`;
  if (d < 86400) return `vor ${Math.round(d / 3600)} Std.`;
  return `vor ${Math.round(d / 86400)} Tg.`;
}

export function fmtMonth(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  const N = ["","Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  return `${N[parseInt(m, 10)]} ${y}`;
}
