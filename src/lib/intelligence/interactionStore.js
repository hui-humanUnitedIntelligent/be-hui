// src/lib/intelligence/interactionStore.js — HUI Interaction Store v1
//
// Philosophy: "privacy-safe, lightweight, local-first"
//
// Stores aggregated interaction signals per creator in localStorage.
// RAW events are NEVER stored — only incrementing counters + timestamps.
// The store is the only persistence layer for relationship memory.
//
// ── Privacy guarantees ─────────────────────────────────────────────────────
//   • Only counts (integers) and dates — no content, no text, no metadata
//   • Keys are creator IDs (UUIDs) — not names, not profiles
//   • Viewer ID is the localStorage key prefix — isolated per browser
//   • Data never leaves the device — no server, no analytics
//   • Automatic pruning: entries older than 90 days removed on read
//   • Safe to clear: app degrades gracefully to zero-signal state
// ─────────────────────────────────────────────────────────────────────────

const STORE_PREFIX    = "hui_rm_";        // hui_rm_{viewerId}
const MAX_CREATORS    = 200;              // prune oldest when exceeded
const MAX_AGE_DAYS    = 90;              // max age before automatic pruning
const STORE_VERSION   = 1;

// ─── Safe localStorage helpers ────────────────────────────────────────────

function storageGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* quota exceeded — fail silently */ }
}

// ─── Store key per viewer ─────────────────────────────────────────────────

function storeKey(viewerId) {
  if (!viewerId) return null;
  return `${STORE_PREFIX}${String(viewerId).slice(0, 36)}`;
}

// ─── Empty interaction record ─────────────────────────────────────────────

function emptyRecord(now = Date.now()) {
  return {
    v:                  STORE_VERSION,
    firstSeenAt:        now,
    lastSeenAt:         now,
    profileViewCount:   0,
    cardExpandCount:    0,
    resonanzGiven:      0,
    berührtGiven:       0,
    inspiredGiven:      0,
    savedWorks:         0,
    begleitetGiven:     0,
    eventsShared:       0,
    commentsWritten:    0,
    messagesSent:       0,
  };
}

// ─── Read entire store for a viewer ──────────────────────────────────────

function readStore(viewerId) {
  const key = storeKey(viewerId);
  if (!key) return {};
  return storageGet(key) || {};
}

// ─── Write entire store for a viewer ─────────────────────────────────────

function writeStore(viewerId, data) {
  const key = storeKey(viewerId);
  if (!key) return;
  storageSet(key, data);
}

// ─── Prune expired + overflow entries ────────────────────────────────────

function pruneStore(store) {
  const now     = Date.now();
  const maxAge  = MAX_AGE_DAYS * 86_400_000;

  // Remove entries older than MAX_AGE_DAYS
  const entries = Object.entries(store)
    .filter(([, rec]) => rec && (now - (rec.lastSeenAt || 0)) < maxAge);

  // If still too many — keep most recently seen
  const pruned = entries
    .sort(([, a], [, b]) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0))
    .slice(0, MAX_CREATORS);

  return Object.fromEntries(pruned);
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record a single interaction event.
 * Increments the appropriate counter and updates lastSeenAt.
 *
 * @param {string} viewerId
 * @param {string} creatorId
 * @param {string} eventType  — one of the keys in emptyRecord()
 */
export function recordInteraction(viewerId, creatorId, eventType) {
  if (!viewerId || !creatorId || !eventType) return;
  if (viewerId === creatorId) return; // never track self-interactions

  const store   = readStore(viewerId);
  const now     = Date.now();
  const current = store[creatorId] || emptyRecord(now);

  // Increment counter (only known fields — never arbitrary data)
  const allowed = Object.keys(emptyRecord());
  if (allowed.includes(eventType)) {
    current[eventType] = (current[eventType] || 0) + 1;
  }

  current.lastSeenAt = now;
  if (!current.firstSeenAt) current.firstSeenAt = now;

  store[creatorId] = current;

  // Prune + write
  const pruned = pruneStore(store);
  writeStore(viewerId, pruned);
}

/**
 * Read interaction signals for a specific creator.
 * Returns an object compatible with buildRelationshipMemory(interactions).
 *
 * @param {string} viewerId
 * @param {string} creatorId
 * @returns {object} — interaction signals with daysSinceLastSeen
 */
export function readInteractions(viewerId, creatorId) {
  if (!viewerId || !creatorId) return emptyRecord();

  const store  = readStore(viewerId);
  const record = store[creatorId];
  if (!record) return emptyRecord();

  const now            = Date.now();
  const daysSinceLastSeen = Math.floor((now - (record.lastSeenAt || now)) / 86_400_000);
  const firstInteractionAt = record.firstSeenAt ? new Date(record.firstSeenAt) : null;
  const lastInteractionAt  = record.lastSeenAt  ? new Date(record.lastSeenAt)  : null;

  return {
    ...record,
    daysSinceLastSeen,
    firstInteractionAt,
    lastInteractionAt,
  };
}

/**
 * Build a Map<creatorId, interactions> for a list of creator IDs.
 * Efficient bulk read for feed curation.
 *
 * @param {string}   viewerId
 * @param {string[]} creatorIds
 * @returns {Map<string, object>}
 */
export function buildInteractionMap(viewerId, creatorIds = []) {
  if (!viewerId || creatorIds.length === 0) return new Map();

  const store = readStore(viewerId);
  const now   = Date.now();
  const map   = new Map();

  for (const creatorId of creatorIds) {
    const record = store[creatorId];
    if (!record) continue;

    const daysSinceLastSeen  = Math.floor((now - (record.lastSeenAt || now)) / 86_400_000);
    const firstInteractionAt = record.firstSeenAt ? new Date(record.firstSeenAt) : null;
    const lastInteractionAt  = record.lastSeenAt  ? new Date(record.lastSeenAt)  : null;

    map.set(creatorId, {
      ...record,
      daysSinceLastSeen,
      firstInteractionAt,
      lastInteractionAt,
    });
  }

  return map;
}

/**
 * Get all creator IDs that have any interaction signal for a viewer.
 * Used to pre-build relationship maps for feed curation.
 *
 * @param {string} viewerId
 * @returns {string[]}
 */
export function getKnownCreatorIds(viewerId) {
  const store = readStore(viewerId);
  return Object.keys(store);
}

/**
 * Clear all interaction data for a viewer (e.g. on signout).
 * @param {string} viewerId
 */
export function clearInteractionStore(viewerId) {
  const key = storeKey(viewerId);
  if (key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
