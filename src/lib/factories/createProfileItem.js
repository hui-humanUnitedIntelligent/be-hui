// src/lib/factories/createProfileItem.js
// Profile Data Normalization Layer — Phase 4
//
// REGEL: Supabase-Profil-Objekte NIEMALS direkt rendern.
//        Immer zuerst durch createProfileItem() normalisieren.

// ── Interne Hilfsfunktionen ───────────────────────────────────────────────

const safeStr  = (v, fb = '') => (v != null && v !== '') ? String(v).trim() : fb;
const safeNum  = (v, fb = 0)  => { const n = Number(v); return isNaN(n) ? fb : n; };
const safeBool = (v)           => Boolean(v);
const safeArr  = (v)           => Array.isArray(v) ? v.filter(Boolean) : [];
const safeUrl  = (v)           => (typeof v === 'string' && v.startsWith('http')) ? v : null;

const normalizeMemberType = (raw) => {
  const mt = raw?.memberType || raw?.member_type || raw?.role || '';
  if (!mt) {
    if (raw?.has_talent_profile || raw?.is_wirker) return 'wirker';
    return 'basis';
  }
  const map = {
    wirker: 'wirker', talent: 'wirker', creator: 'wirker',
    admin: 'admin',
    basis: 'basis', user: 'basis', member: 'basis',
  };
  return map[String(mt).toLowerCase()] || 'basis';
};

const normalizeStats = (raw) => Object.freeze({
  followers:   safeNum(raw?.stats?.followers   || raw?.followers_count  || raw?.followers),
  following:   safeNum(raw?.stats?.following   || raw?.following_count  || raw?.following),
  works:       safeNum(raw?.stats?.works       || raw?.works_count      || raw?.works),
  experiences: safeNum(raw?.stats?.experiences || raw?.experiences_count|| raw?.experiences),
  resonance:   safeNum(raw?.stats?.resonance   || raw?.impact_eur       || raw?.resonance),
  connections: safeNum(raw?.stats?.connections || raw?.connections_count),
  bookings:    safeNum(raw?.stats?.bookings    || raw?.bookings_count   || raw?.bookings),
});

// ── Haupt-Factory ─────────────────────────────────────────────────────────

export const createProfileItem = (raw = {}) => {

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    console.warn('[HUI INVALID PROFILE]', raw);
    return null;
  }

  const id = raw.id || raw.user_id
    ? String(raw.id || raw.user_id)
    : (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2));

  const displayName = safeStr(
    raw.displayName  || raw.display_name ||
    raw.full_name    || raw.name         || raw.username,
    'Unbekannt'
  );

  const avatar = safeUrl(
    raw.avatar    || raw.avatar_url  ||
    raw.img       || raw.creatorImg  || raw.photoURL
  );

  const banner = safeUrl(
    raw.banner    || raw.banner_url  ||
    raw.header_img|| raw.bg          || raw.bg_url || raw.cover_url
  );

  return Object.freeze({
    // Core Identity
    id,
    username:    safeStr(raw.username || raw.handle),
    displayName,

    // Visuals
    avatar,
    banner,

    // Content
    bio:         safeStr(raw.bio      || raw.quote      || raw.tagline),
    location:    safeStr(raw.location || raw.location_label || raw.city),
    website:     safeStr(raw.website  || raw.url),
    talent:      safeStr(raw.talent   || raw.focus_type || raw.category),
    currentMood: safeStr(raw.currentMood || raw.current_mood, 'Gerade im Atelier'),

    // Membership
    memberType:  normalizeMemberType(raw),
    isVerified:  safeBool(raw.isVerified || raw.is_verified || raw.is_wirker || raw.has_talent_profile),
    isAvailable: safeBool(raw.isAvailable ?? raw.is_available ?? true),
    isLive:      safeBool(raw.isLive || raw.is_live),

    // Arrays
    skills:      safeArr(raw.skills   || raw.dna_tags  || raw.tags),
    interests:   safeArr(raw.interests || raw.interest_tags),

    // Stats
    stats: normalizeStats(raw),

    // Commerce
    hourlyRate: (raw.hourly_rate != null || raw.hourly != null)
      ? safeNum(raw.hourly_rate || raw.hourly)
      : null,

    // Timestamps
    createdAt: raw.createdAt || raw.created_at || null,
    updatedAt: raw.updatedAt || raw.updated_at || null,

    // Escape hatch
    _raw: raw,
  });
};

export const filterValidProfiles = (items = []) =>
  (items || [])
    .map(createProfileItem)
    .filter(Boolean);

/**
 * Kompatibilitäts-Bridge: ProfileItem → Legacy normalizeProfileInput Format.
 * Nur für Übergangsphase bis alle Consumer ProfileItems direkt konsumieren.
 */
export const profileItemToLegacy = (item) => {
  if (!item || !item.id) return null;
  return {
    id:                   item.id,
    user_id:              item.id,
    username:             item.username,
    display_name:         item.displayName,
    avatar_url:           item.avatar,
    header_img:           item.banner,
    bio:                  item.bio,
    talent:               item.talent,
    location_label:       item.location,
    current_mood:         item.currentMood,
    focus_type:           item.talent,
    is_wirker:            item.memberType === 'wirker',
    has_talent_profile:   item.memberType === 'wirker',
    is_available:         item.isAvailable,
    is_live:              item.isLive,
    dna_tags:             item.skills,
    hourly_rate:          item.hourlyRate,
    followers_count:      item.stats.followers,
    following_count:      item.stats.following,
    works_count:          item.stats.works,
    experiences_count:    item.stats.experiences,
    impact_eur:           item.stats.resonance,
    connections_count:    item.stats.connections,
    created_at:           item.createdAt,
    updated_at:           item.updatedAt,
  };
};
