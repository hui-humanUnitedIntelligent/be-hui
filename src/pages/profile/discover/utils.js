export const INTEREST_POOLS = ["Natur","Musik","Kunst","Gemeinschaft","Spiritualität","Nachhaltigkeit","Fotografie","Design","Bildung","Umwelt"];

export const safeStr = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
export const safeNum = (v, fb=0)  => (typeof v === "number" && isFinite(v) ? v : fb);
export const safeArr = (v)         => (Array.isArray(v) ? v : []);
export const fmtImpact = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000 / 3600;
  if (diff < 1) return "vor " + Math.round(diff*60) + " Min";
  if (diff < 24) return "vor " + Math.round(diff) + " Std";
  return "vor " + Math.round(diff/24) + " Tagen";
}

export function personTags(person, max=2) {
  if (person.interests?.length) return person.interests.slice(0,max);
  const code = String(person.name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const start = code % INTEREST_POOLS.length;
  return [INTEREST_POOLS[start % INTEREST_POOLS.length], INTEREST_POOLS[(start+3) % INTEREST_POOLS.length]];
}
