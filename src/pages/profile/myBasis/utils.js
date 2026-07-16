export const s = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
export const a = (v) => Array.isArray(v) ? v : [];
