// ── Design Tokens ─────────────────────────────────────────────
export const T = {
  teal:     "#16D7C5",
  tealDeep: "#0AADA3",
  tealSoft: "rgba(22,215,197,0.10)",
  coral:    "#FF8A6B",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.55)",
  inkFaint: "rgba(26,26,24,0.35)",
  cream:    "#F9F7F4",
  card:     "#FFFFFF",
  border:   "rgba(26,26,24,0.08)",
  r12:      12,
  r16:      16,
  r20:      20,
};

// ── Kategorie-Regeln ──────────────────────────────────────────
// type → { tab, icon, color }
export const TYPE_META = {
  // WICHTIG
  order:          { tab:"wichtig", icon:"🎨", color:"#FF8A6B", label:"Bestellung" },
  booking:        { tab:"wichtig", icon:"📅", color:"#22C55E", label:"Buchung" },
  connection_req: { tab:"wichtig", icon:"🤝", color:T.teal,   label:"Verbindungsanfrage" },
  message:        { tab:"wichtig", icon:"💬", color:T.teal,   label:"Nachricht" },
  booking_change: { tab:"wichtig", icon:"⚠️", color:"#F59E0B", label:"Buchungsänderung" },
  experience_soon:{ tab:"wichtig", icon:"📅", color:"#22C55E", label:"Erlebnis morgen" },
  // RELEVANT
  like:           { tab:"relevant", icon:"❤️", color:"#EF4444", label:"Favorisiert" },
  save:           { tab:"relevant", icon:"⭐", color:"#F59E0B", label:"Gespeichert" },
  profile_visit:  { tab:"relevant", icon:"👀", color:"#8B5CF6", label:"Profilbesuch" },
  participant:    { tab:"relevant", icon:"🙌", color:T.teal,   label:"Neue Teilnehmer" },
  watcher:        { tab:"relevant", icon:"🌱", color:"#22C55E", label:"Neue Beobachter" },
  interest:       { tab:"relevant", icon:"🎯", color:T.coral,  label:"Interesse" },
  follow:         { tab:"relevant", icon:"👤", color:T.teal,   label:"Neuer Follower" },
  // INFORMATIV
  milestone:      { tab:"info", icon:"📈", color:T.teal,   label:"Meilenstein" },
  impact:         { tab:"info", icon:"🌿", color:"#22C55E", label:"Neue Wirkung" },
  share:          { tab:"info", icon:"🎨", color:"#8B5CF6", label:"Werk geteilt" },
  connection_new: { tab:"info", icon:"🤝", color:T.teal,   label:"Neue Verbindung" },
  achievement:    { tab:"info", icon:"🏆", color:"#F59E0B", label:"Meilenstein" },
  admin_broadcast:{ tab:"info", icon:"📣", color:"#8B5CF6", label:"HUI Team" },
  referral_joined:{ tab:"info", icon:"🎉", color:"#22C55E", label:"Empfehlung" },
  // FREIGABEN — Werke
  work_approved:       { tab:"info", icon:"✅", color:"#22C55E", label:"Werk freigegeben" },
  work_rejected:       { tab:"info", icon:"❌", color:"#EF4444", label:"Werk abgelehnt" },
  talent_approved:     { tab:"info", icon:"✅", color:"#22C55E", label:"Talent freigegeben" },
  talent_rejected:     { tab:"info", icon:"❌", color:"#EF4444", label:"Talent abgelehnt" },
  impact_project_rejected:  { tab:"info", icon:"📋", color:"#EF4444", label:"Herzensprojekt abgelehnt" },
  content_approved:    { tab:"info", icon:"✅", color:"#22C55E", label:"Inhalt freigegeben" },
  content_rejected:    { tab:"info", icon:"❌", color:"#EF4444", label:"Inhalt abgelehnt" },
  // FREIGABEN — Erlebnisse
  experience_approved: { tab:"info", icon:"✅", color:"#22C55E", label:"Erlebnis freigegeben" },
  experience_rejected: { tab:"info", icon:"❌", color:"#EF4444", label:"Erlebnis abgelehnt" },
  // FREIGABEN — Projekte
  project_approved:    { tab:"info", icon:"✅", color:"#22C55E", label:"Projekt freigegeben" },
  project_rejected:    { tab:"info", icon:"❌", color:"#EF4444", label:"Projekt abgelehnt" },
  // Default
  default:        { tab:"info", icon:"✦",  color:T.teal,   label:"Aktivität" },
};

export function getMeta(type) {
  return TYPE_META[type] || TYPE_META.default;
}
