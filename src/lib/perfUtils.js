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

// ─── 2. Batchable Promise.all helper ────────────────────────────────
/**
 * Run multiple queries in parallel, catch individual failures.
 * Returns array of { data, error } — never throws.
 */
export async function batchQueries(...promises) {
  return Promise.all(
    promises.map(p => p.catch(e => ({ data: null, error: { message: e.message } })))
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
export function createLazyObserver(callback, options = {}) {
  if (typeof IntersectionObserver === 'undefined') {
    callback(true); // SSR fallback
    return { observe: () => {}, disconnect: () => {} };
  }
  return new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) callback(true);
  }, { rootMargin: '200px', threshold: 0.01, ...options });
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
  profile:  'id,display_name,username,avatar_url,header_img,bio,is_wirker,has_talent_profile,focus_type,talent,location_label,is_available,impact_eur,created_at',
  wirker:   'id,user_id,slug,talent,categories,location_label,avatar_url,header_img,hourly_rate,is_verified',
  work:     'id,user_id,title,cover_url,media_url,price,category,medium,status,created_at',
  experience:'id,user_id,title,cover_url,price,duration,spots_available,location_label,status',
  booking:  'id,user_id,wirker_id,work_id,amount,status,created_at',
  message:  'id,chat_id,sender_id,text,created_at,read',
  feedItem: 'id,user_id,type,media_url,caption,created_at,likes_count,expires_at',
  impact:   'id,name,category,description,votes,status,awarded_eur,month',
};
