
// ─── Cache TTL Konstanten ───────────────────────────────────────
export const CACHE_TTL = {
  profiles:     60_000,   // 60 Sekunden
  works:        30_000,   // 30 Sekunden
  experiences:  30_000,
  feed:         20_000,   // 20 Sekunden — Feed ist dynamisch
  discover:     60_000,
  notifications: 15_000,
};

// hui-perf-utils.js — HUI Performance Utilities
// Zentrale Helfer für Queries, Lazy Images, Virtualisierung
// Kein visuelles Design — nur Technik

// ─── 1. Query-Cache (in-memory, session-scoped) ──────────────────────
const _queryCache = new Map();

export function clearQueryCache(prefix) {
  if (!prefix) { _queryCache.clear(); return; }
  for (const k of _queryCache.keys()) {
    if (k.startsWith(prefix)) _queryCache.delete(k);
  }
}

/**
 * Cached Supabase query.
 * Usage: cachedQuery('profiles-abc', () => supabase.from('profiles').select('id,display_name').eq('id','abc').single(), 60000)
 */
export async function cachedQuery(key, queryFn, ttlMs = 30000) {
  const hit = _queryCache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return hit.data;
  const result = await queryFn();
  if (!result.error) _queryCache.set(key, { data: result, ts: Date.now() });
  return result;
}


// ── Stale-While-Revalidate ────────────────────────────────────────
// Gibt sofort gecachte Daten zurück, aktualisiert im Hintergrund.
// Usage: const data = await staleWhileRevalidate('key', fetchFn, ttlMs)
const _swrPending = new Map(); // Verhindert parallele Requests für denselben Key

export async function staleWhileRevalidate(key, fetchFn, ttlMs = 30000, onUpdate = null) {
  const hit = _queryCache.get(key);
  const now = Date.now();
  const isStale = !hit || (now - hit.ts > ttlMs);

  // Sofortige Antwort mit gecachten Daten (auch wenn stale)
  if (hit && !hit.data.error) {
    if (isStale && !_swrPending.has(key)) {
      // Background-Revalidation — kein await
      _swrPending.set(key, true);
      fetchFn().then(result => {
        if (!result.error) {
          _queryCache.set(key, { data: result, ts: Date.now() });
          onUpdate?.(result); // Callback für State-Update
        }
        _swrPending.delete(key);
      }).catch(() => _swrPending.delete(key));
    }
    return hit.data; // Stale Daten sofort zurückgeben
  }

  // Kein Cache vorhanden — warte auf erste Ladung
  // Dedup: Parallele Requests für denselben Key werden zusammengeführt
  if (_swrPending.has(key)) {
    // Warte auf das laufende Request
    while (_swrPending.has(key)) {
      await new Promise(r => setTimeout(r, 50));
    }
    const freshHit = _queryCache.get(key);
    return freshHit?.data ?? { data: null, error: 'Cache miss after wait' };
  }

  _swrPending.set(key, true);
  try {
    const result = await fetchFn();
    if (!result.error) _queryCache.set(key, { data: result, ts: Date.now() });
    return result;
  } finally {
    _swrPending.delete(key);
  }
}

// ── Visibility-aware Fetch ────────────────────────────────────────
// Verzögert Fetches wenn Tab hidden ist.
export async function visibilityAwareFetch(fetchFn, timeoutMs = 30_000) {
  if (!document.hidden) return fetchFn();

  // Tab hidden — warte auf visibility-change
  // FIX: Timeout nach 30s → kein ewiger Memory-Leak
  return new Promise((resolve) => {
    let resolved = false;
    let fallbackTimer = null;

    function cleanup() {
      document.removeEventListener('visibilitychange', handler);
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    }

    const handler = () => {
      if (document.hidden || resolved) return;
      resolved = true;
      cleanup();
      fetchFn().then(resolve).catch(() => resolve({ data: null, error: 'fetch failed' }));
    };

    // Absoluter Fallback: nach timeoutMs auflösen statt ewig hängen
    fallbackTimer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({ data: null, error: 'visibilityAwareFetch timeout' });
    }, timeoutMs);

    document.addEventListener('visibilitychange', handler, { passive: true });
  });
}

// ─── 2. Batchable Promise.all helper ────────────────────────────────
/**
 * Run multiple queries in parallel, catch individual failures.
 * Returns array of { data, error } — never throws.
 */
export async function batchQueries(...promises) {
  return Promise.all(
    (promises||[]).filter(p=>p&&typeof p.then==='function').map(p => p.catch(e => ({ data: null, error: { message: e.message } })))
  );
}

// ─── 3. Pagination helper ────────────────────────────────────────────
export const PAGE_SIZE = 20;

export function buildPage(query, page = 0, size = PAGE_SIZE) {
  return query.range(page * size, (page + 1) * size - 1);
}

// ─── 4. Debounce ─────────────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── 5. Safe Supabase query (with timeout + error normalization) ──────
export async function safeQuery(promise, timeoutMs = 8000) {
  let timer;
  const timeout = new Promise(resolve =>
    timer = setTimeout(() =>
      resolve({ data: null, error: { message: 'timeout', code: 'TIMEOUT' } }), timeoutMs)
  );
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timer); }
}

// ─── 6. Intersection Observer for lazy sections ───────────────────────
// Returns observer — caller MUST call .disconnect() in useEffect cleanup
export function createLazyObserver(callback, options = {}) {
  if (typeof IntersectionObserver === 'undefined') {
    callback(true); // SSR fallback
    return { observe: () => {}, disconnect: () => {}, unobserve: () => {} };
  }
  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      callback(true);
      obs.disconnect(); // auto-disconnect after first intersection (one-shot)
    }
  }, { rootMargin: '200px', threshold: 0.01, ...options });
  return obs;
}

// ─── 6b. React hook helper for IO — auto-cleanup ─────────────────────
// Usage: const ref = useIntersectionRef(() => setVisible(true));
export function useIntersectionRef(onVisible, options = {}) {
  // Note: import { useEffect, useRef } from 'react' in consumer
  // This is a placeholder — use createLazyObserver directly in useEffect
  return null;
}

// ─── 7. Image URL optimizer (Unsplash + Supabase Storage) ────────────
export function optimizeImg(url, { w = 800, q = 80, fm = 'webp' } = {}) {
  if (!url) return url;
  // Unsplash
  if (url.includes('unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?w=${w}&q=${q}&fm=${fm}&fit=crop&auto=format`;
  }
  // Supabase Storage (add transform if supported)
  if (url.includes('supabase.co/storage')) {
    return `${url}?width=${w}&quality=${q}`;
  }
  return url;
}

// ─── 8. Realtime channel registry (prevent duplicate subscriptions) ───
const _channels = new Map();

export function getOrCreateChannel(supabase, channelId, setupFn) {
  if (_channels.has(channelId)) return _channels.get(channelId);
  const channel = setupFn(supabase.channel(channelId));
  channel.subscribe();
  _channels.set(channelId, channel);
  return channel;
}

export function removeChannel(supabase, channelId) {
  const ch = _channels.get(channelId);
  if (ch) {
    supabase.removeChannel(ch);
    _channels.delete(channelId);
  }
}

// ─── 9. Retry with exponential backoff ───────────────────────────────
export async function withRetry(fn, { maxRetries = 3, baseDelayMs = 500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr;
}

// ─── 10. Selective fields helper ─────────────────────────────────────
// Use instead of select('*') everywhere
export const FIELDS = {
  profile:  'id,display_name,username,avatar_url,header_img,bio,is_wirker,has_talent_profile,focus_type,location,is_available,created_at,dna_tags,role',
  wirker:   'id,user_id,slug,talent,categories,location_label,avatar_url,header_img,hourly_rate,is_verified',
  work:     'id,user_id,title,cover_url,media_url,price,category,medium,status,created_at',
  experience:'id,user_id,title,cover_url,price,duration,spots_available,location_label,status',
  booking:  'id,user_id,wirker_id,work_id,amount,status,created_at',
  message:  'id,chat_id,sender_id,text,created_at,read',
  feedItem: 'id,user_id,type,media_url,caption,created_at,likes_count,expires_at',
  impact:   'id,name,category,description,votes,status,awarded_eur,month',
};

// ─── 11. Zentrales Profil-Feld-Set für alle public profile queries ────
// Exakt dieselben Felder die WirkerProfilePage erwartet.
// Deckt profiles-Tabelle vollständig ab (keine imaginären Felder).
export const PROFILE_FIELDS =
  // Alle Felder die Profile-Anzeige + EditProfile schreiben/lesen
  // Vorsicht: nur Felder selektieren die in DB existieren (kein select *)
  'id,display_name,username,avatar_url,header_img,bio,' +
  'is_wirker,has_talent_profile,focus_type,' +
  'location,is_available,created_at,' +
  'dna_tags,role,membership_type,' +
  // Optionale Felder — kein Fehler wenn nicht in DB (Supabase ignoriert unknown gracefully)
  'talent,location_label,website,hourly_rate,is_member,member_since,trust_score,is_moderator,is_impact_team,is_guardian,' +
  'categories,mood_tags,languages,instagram,tiktok,linkedin';

// ─── 12. Normalisierung: beliebiges Rohobjekt → WirkerProfilePage-Input ──
// Gleicht alle historisch unterschiedlichen Feldnamen an:
//   name / display_name / full_name → display_name
//   img / avatar_url / creatorImg   → avatar_url
//   bg / header_img / cover_url     → header_img
//   city / location / location_label → location_label
//   hourly / hourly_rate             → hourly_rate
//   recs / recommendations           → recommendations_count
//   user_id / id                     → user_id + id (beide gesetzt)
export function normalizeProfileInput(raw) {
  if (!raw) return null;
  return {
    // Identity — wichtigste Felder zuerst
    id:               raw.id          || raw.user_id    || null,
    user_id:          raw.user_id     || raw.id         || null,
    username:         raw.username                      || null,
    display_name:     raw.display_name || raw.name      || raw.full_name || null,
    // Visuals
    avatar_url:       raw.avatar_url  || raw.img        || raw.creatorImg || null,
    header_img:       raw.header_img  || raw.bg         || raw.cover_url  || null,
    // Info
    bio:              raw.bio         || raw.quote       || null,
    talent:           raw.talent      || raw.has_talent_profile || null,  // talent kommt aus wirker_profiles, nicht profiles
    location_label:   raw.location_label || raw.city    || raw.location   || null,
    focus_type:       raw.focus_type                    || "hybrid",
    // Stats
    hourly_rate:      raw.hourly_rate || raw.hourly      || null,
    impact_eur:       raw.impact_eur  || raw.impactEur   || 0,
    followers_count:  raw.followers_count || raw.followers || 0,
    recommendations_count: raw.recommendations_count || raw.recs || raw.recommendations || 0,
    works_count:      raw.works_count || raw.works        || 0,
    // Arrays
    dna_tags:         raw.dna_tags    || raw.skills      || [],
    profile_modules:  raw.profile_modules                || {},
    // Booleans
    is_available:     raw.is_available ?? raw.available  ?? true,
    is_wirker:        raw.is_wirker   || raw.has_talent_profile || false,
    // Dates
    created_at:       raw.created_at                    || null,
  };
}