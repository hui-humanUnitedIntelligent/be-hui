// src/lib/intelligence/persistence/interactionMemoryStore.js
// HUI Living Memory — Persistent Interaction Store v2
//
// Philosophy: "the world remembers who has wandered through it"
//
// Privacy: ONLY aggregated counters + timestamps. Never text, never content.
// Memory fades naturally (120-day max age, 300 creator limit).
// Throttled writes (800ms), debounced (400ms). Flushed on visibilitychange.

const SCHEMA_VERSION = 2;
const KEY_PREFIX     = "hui_mem_v2_";
const MAX_CREATORS   = 300;
const MAX_AGE_MS     = 120 * 86_400_000;
const WRITE_THROTTLE = 800;
const DEBOUNCE_DELAY = 400;

const _pendingWrites = new Map();
const _lastWrite     = new Map();
const _memoryCache   = new Map();

// ── Safe localStorage ────────────────────────────────────────────────────
function safeRead(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) {
    if (e?.name === "QuotaExceededError" || e?.code === 22) {
      try {
        const p = safeRead(key);
        if (p?.creators) {
          const pruned = pruneCreators(p.creators, 100);
          localStorage.setItem(key, JSON.stringify({ ...p, creators: pruned }));
        }
      } catch {}
    }
    return false;
  }
}

function storeKey(vid) { return `${KEY_PREFIX}${String(vid || "").slice(0,36)}`; }

// ── Empty records ─────────────────────────────────────────────────────────
function emptyCreator(now = Date.now()) {
  return {
    profileVisits: 0, feedDwellMs: 0, cardExpands: 0, revisitCount: 0,
    resonanzGiven: 0, berührtGiven: 0, inspiredGiven: 0,
    savedWorks: 0, follows: 0, eventJoins: 0, messagesSent: 0, commentsWritten: 0,
    firstSeenAt: now, lastSeenAt: now,
    lastProfileVisitAt: null, lastResonanceAt: null,
    sessionCount: 0,
  };
}

function emptyStore() {
  return { schema: SCHEMA_VERSION, created: Date.now(), updated: Date.now(), creators: {} };
}

// ── Prune ─────────────────────────────────────────────────────────────────
function pruneCreators(creators, limit = MAX_CREATORS) {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(creators)
      .filter(([, r]) => r && (now - (r.lastSeenAt || 0)) < MAX_AGE_MS)
      .sort(([, a], [, b]) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0))
      .slice(0, limit)
  );
}

// ── Read (cached) ─────────────────────────────────────────────────────────
function readStore(viewerId) {
  if (!viewerId) return emptyStore();
  if (_memoryCache.has(viewerId)) return _memoryCache.get(viewerId);

  const raw = safeRead(storeKey(viewerId));
  let store = (!raw || raw.schema !== SCHEMA_VERSION)
    ? { ...emptyStore(), creators: raw?.creators || {} }
    : raw;

  if (Object.keys(store.creators || {}).length > MAX_CREATORS * 1.2) {
    store.creators = pruneCreators(store.creators);
  }

  _memoryCache.set(viewerId, store);
  return store;
}

// ── Write (throttled + debounced) ─────────────────────────────────────────
function flushWrite(viewerId) {
  const store = _memoryCache.get(viewerId);
  if (!store) return;
  store.updated = Date.now();
  safeWrite(storeKey(viewerId), store);
  _lastWrite.set(viewerId, Date.now());
}

function scheduleWrite(viewerId) {
  if (_pendingWrites.has(viewerId)) clearTimeout(_pendingWrites.get(viewerId));
  const since = Date.now() - (_lastWrite.get(viewerId) || 0);
  if (since > WRITE_THROTTLE) {
    flushWrite(viewerId);
  } else {
    const h = setTimeout(() => { flushWrite(viewerId); _pendingWrites.delete(viewerId); }, DEBOUNCE_DELAY);
    _pendingWrites.set(viewerId, h);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export function recordMemory(viewerId, creatorId, field, amount = 1) {
  if (!viewerId || !creatorId || !field || viewerId === creatorId) return;
  const store   = readStore(viewerId);
  const now     = Date.now();
  const rec     = store.creators[creatorId] || emptyCreator(now);
  const intKeys = Object.keys(emptyCreator()).filter(k => typeof emptyCreator()[k] === "number" && !k.endsWith("At"));
  if (intKeys.includes(field)) rec[field] = Math.max(0, (rec[field] || 0) + amount);
  rec.lastSeenAt = now;
  if (!rec.firstSeenAt) rec.firstSeenAt = now;
  if (field === "profileVisits")    rec.lastProfileVisitAt = now;
  if (["resonanzGiven","berührtGiven","inspiredGiven"].includes(field)) rec.lastResonanceAt = now;
  store.creators[creatorId] = rec;
  scheduleWrite(viewerId);
}

export function recordDwell(viewerId, creatorId, ms) {
  if (!viewerId || !creatorId || !ms || ms < 200 || viewerId === creatorId) return;
  const MAX_DAY = 30 * 60_000;
  const store   = readStore(viewerId);
  const rec     = store.creators[creatorId] || emptyCreator();
  rec.feedDwellMs = Math.min((rec.feedDwellMs || 0) + Math.min(ms, MAX_DAY), MAX_DAY * 30);
  rec.lastSeenAt  = Date.now();
  if (!rec.firstSeenAt) rec.firstSeenAt = Date.now();
  store.creators[creatorId] = rec;
  scheduleWrite(viewerId);
}

export function readCreatorMemory(viewerId, creatorId) {
  if (!viewerId || !creatorId) return { ...emptyCreator(), _unknown: true };
  const store  = readStore(viewerId);
  const rec    = store.creators[creatorId];
  if (!rec) return { ...emptyCreator(), _unknown: true };
  const now               = Date.now();
  const daysSinceLastSeen = Math.floor((now - (rec.lastSeenAt || now)) / 86_400_000);
  return {
    profileViewCount:  rec.profileVisits  || 0,
    cardExpandCount:   rec.cardExpands    || 0,
    resonanzGiven:     rec.resonanzGiven  || 0,
    berührtGiven:      rec.berührtGiven   || 0,
    inspiredGiven:     rec.inspiredGiven  || 0,
    savedWorks:        rec.savedWorks     || 0,
    begleitetGiven:    rec.follows        || 0,
    eventsShared:      rec.eventJoins     || 0,
    messagesSent:      rec.messagesSent   || 0,
    commentsWritten:   rec.commentsWritten|| 0,
    feedDwellMs:       rec.feedDwellMs    || 0,
    revisitCount:      rec.revisitCount   || 0,
    sessionCount:      rec.sessionCount   || 0,
    daysSinceLastSeen,
    firstInteractionAt: rec.firstSeenAt  ? new Date(rec.firstSeenAt)  : null,
    lastInteractionAt:  rec.lastSeenAt   ? new Date(rec.lastSeenAt)   : null,
    _unknown: false,
  };
}

export function buildMemoryMap(viewerId, creatorIds = []) {
  if (!viewerId || !creatorIds.length) return new Map();
  const store = readStore(viewerId);
  const now   = Date.now();
  const map   = new Map();
  for (const id of creatorIds) {
    const rec = store.creators[id];
    if (!rec) continue;
    map.set(id, {
      profileViewCount:  rec.profileVisits  || 0,
      cardExpandCount:   rec.cardExpands    || 0,
      resonanzGiven:     rec.resonanzGiven  || 0,
      berührtGiven:      rec.berührtGiven   || 0,
      inspiredGiven:     rec.inspiredGiven  || 0,
      savedWorks:        rec.savedWorks     || 0,
      begleitetGiven:    rec.follows        || 0,
      eventsShared:      rec.eventJoins     || 0,
      messagesSent:      rec.messagesSent   || 0,
      commentsWritten:   rec.commentsWritten|| 0,
      feedDwellMs:       rec.feedDwellMs    || 0,
      revisitCount:      rec.revisitCount   || 0,
      daysSinceLastSeen: Math.floor((now - (rec.lastSeenAt||now)) / 86_400_000),
      firstInteractionAt: rec.firstSeenAt ? new Date(rec.firstSeenAt) : null,
      lastInteractionAt:  rec.lastSeenAt  ? new Date(rec.lastSeenAt)  : null,
    });
  }
  return map;
}

export function hydrateStore(viewerId) {
  if (!viewerId) return { knownCreators: [], totalSignals: 0, storeAge: 0 };
  const store = readStore(viewerId);
  store.creators = pruneCreators(store.creators);
  _memoryCache.set(viewerId, store);
  safeWrite(storeKey(viewerId), store);
  const known = Object.keys(store.creators);
  const sigs  = known.reduce((a, id) => {
    const r = store.creators[id];
    return a + (r.resonanzGiven||0) + (r.berührtGiven||0) + (r.profileVisits||0)
             + (r.savedWorks||0) + (r.messagesSent||0) + (r.eventJoins||0);
  }, 0);
  return {
    knownCreators: known,
    totalSignals: sigs,
    storeAge: store.created ? Math.floor((Date.now() - store.created) / 86_400_000) : 0,
  };
}

export function clearMemoryStore(viewerId) {
  if (!viewerId) return;
  try {
    localStorage.removeItem(storeKey(viewerId));
    _memoryCache.delete(viewerId);
    if (_pendingWrites.has(viewerId)) clearTimeout(_pendingWrites.get(viewerId));
    _pendingWrites.delete(viewerId);
    _lastWrite.delete(viewerId);
  } catch {}
}

export function flushAllPending() {
  for (const [vid, h] of _pendingWrites) {
    clearTimeout(h);
    flushWrite(vid);
    _pendingWrites.delete(vid);
  }
}

// Flush on page hide (iOS Safari + Chrome)
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAllPending();
  }, { passive: true });
  window?.addEventListener?.("pagehide", flushAllPending, { passive: true });
}
