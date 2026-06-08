// src/lib/perfUtils.js — HUI Performance Utils
// VERIFIZIERT: Nur Spalten die in profiles wirklich existieren (Stand 2026-06-08)
// Verboten: membership_type, has_talent_profile, is_wirker, wirkerProfile,
//           ambassador_level, ref_link, referred_users_count, impact_revenue,
//           profile_complete

// ─── Cache TTL ─────────────────────────────────────────────────
export const CACHE_TTL = {
  profiles:     60_000,
  works:        30_000,
  experiences:  30_000,
  feed:         20_000,
  discover:     60_000,
  notifications: 15_000,
};

// ─── Verifizierte Profile-Spalten ─────────────────────────────
// Genau die Spalten die in Supabase profiles-Tabelle existieren.
// NICHT ändern ohne DB-Prüfung!
export const PROFILE_FIELDS =
  'id,display_name,username,avatar_url,bio,' +
  'is_talent,talent_since,is_ambassador,' +
  'referred_by,referred_by_ambassador_id,' +
  'blocked,profile_modules,skills,dna_tags,' +
  'location,header_img,focus_type,' +
  'created_at,updated_at';

// ─── Legacy-FIELDS (für alte Komponenten die FIELDS.profile benutzen) ──
export const FIELDS = {
  profile: PROFILE_FIELDS,
};

// ─── Normalisierung ────────────────────────────────────────────
export function normalizeProfile(raw) {
  if (!raw) return null;
  return {
    id:                       raw.id,
    display_name:             raw.display_name   || null,
    username:                 raw.username        || null,
    avatar_url:               raw.avatar_url      || null,
    bio:                      raw.bio             || null,
    is_talent:                raw.is_talent       === true,
    talent_since:             raw.talent_since    || null,
    is_ambassador:            raw.is_ambassador   === true,
    referred_by:              raw.referred_by     || null,
    referred_by_ambassador_id:raw.referred_by_ambassador_id || null,
    blocked:                  raw.blocked         === true,
    profile_modules:          raw.profile_modules || {},
    skills:                   Array.isArray(raw.skills)   ? raw.skills   : [],
    dna_tags:                 Array.isArray(raw.dna_tags) ? raw.dna_tags : [],
    location:                 raw.location        || null,
    header_img:               raw.header_img      || null,
    focus_type:               raw.focus_type      || null,
    created_at:               raw.created_at      || null,
    updated_at:               raw.updated_at      || null,
  };
}

// ── Legacy Exports (von db.js, content.js, discovery/index.js benötigt) ──────
export const PAGE_SIZE = 20;

// Query-Cache (in-memory)
const _queryCache = new Map();

export async function safeQuery(fn) {
  try {
    const result = await fn();
    return result;
  } catch (e) {
    console.warn("[HUI safeQuery] Fehler:", e?.message);
    return { data: null, error: e };
  }
}

export async function cachedQuery(key, fn, ttl = 30_000) {
  const now = Date.now();
  const cached = _queryCache.get(key);
  if (cached && now - cached.ts < ttl) return cached.data;
  const result = await fn();
  if (!result?.error) {
    _queryCache.set(key, { data: result, ts: now });
  }
  return result;
}

export function clearQueryCache(keyPrefix) {
  if (!keyPrefix) { _queryCache.clear(); return; }
  for (const k of _queryCache.keys()) {
    if (k.startsWith(keyPrefix)) _queryCache.delete(k);
  }
}

export function buildPage(query, page = 0, pageSize = PAGE_SIZE) {
  const from = page * pageSize;
  const to   = from + pageSize - 1;
  return query.range(from, to);
}
