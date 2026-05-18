// utils/profileFormatters.js
// Alle Formatierungs-Hilfsfunktionen für WirkerProfile

export function formatLocation(profile) {
  return profile?.location || profile?.location_label || null;
}

export function formatDisplayName(profile) {
  return profile?.display_name || profile?.full_name || profile?.username || "Creator";
}

export function formatTalent(profile) {
  return profile?.talent || profile?.focus_type || "Creator";
}

export function formatMemberSince(profile) {
  if (!profile?.created_at) return null;
  return new Date(profile.created_at).getFullYear();
}

export function formatImpact(profile) {
  const eur = profile?.impact_eur || 0;
  if (eur >= 1000) return `${(eur/1000).toFixed(1)}k€`;
  return eur > 0 ? `${eur}€` : null;
}

export function formatStat(val, fallback = 0) {
  const n = Number(val) || fallback;
  if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
  return String(n);
}

export function formatRhythm(creativePresence) {
  if (!creativePresence?.rhythm?.key) return null;
  if (creativePresence.rhythm.key === "consistent") return null;
  return {
    icon:  creativePresence.rhythm.icon  || "✦",
    label: creativePresence.rhythm.label || creativePresence.rhythm.key,
  };
}

export function formatContinuity(creativePresence) {
  if (!creativePresence?.continuity?.isBridge) return null;
  const domains = creativePresence?.continuity?.domainFamilies || [];
  return {
    isBridge: true,
    domains: domains.slice(0, 2),
    label: domains.slice(0, 2).join(" × "),
  };
}

export function formatAvatarUrl(profile, fallbackSeed) {
  const url = profile?.avatar_url || profile?.img;
  if (!url) return `https://i.pravatar.cc/120?img=${fallbackSeed || 1}`;
  if (url.startsWith("http")) return url;
  return url;
}

export function formatHeroUrl(profile) {
  return profile?.header_img || profile?.hero_img || null;
}

export function formatCategories(profile) {
  const tags  = profile?.dna_tags   || profile?.mood_tags   || [];
  const cats  = profile?.categories || profile?.focus_areas  || [];
  return [...new Set([...tags, ...cats])].slice(0, 6);
}
