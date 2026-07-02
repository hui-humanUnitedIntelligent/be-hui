// src/architecture/ownership.js
// ══════════════════════════════════════════════════════════════
// HUI File-Level Ownership Registry — CORE-001
// Jede wichtige Datei: Domäne, Owner-Typ, Verantwortlichkeit
// ══════════════════════════════════════════════════════════════

/**
 * @typedef {'owner'|'service'|'consumer'|'engine'|'guard'} OwnerRole
 * @typedef {{ domain: import('./domains.js').HuiDomain, role: OwnerRole, responsibility: string, dependencies?: string[], deprecated?: boolean }} OwnershipMeta
 */

/** @type {Record<string, OwnershipMeta>} */
export const FILE_OWNERSHIP = {
  // ─── CORE ───────────────────────────────────────────────
  'src/registry/HuiRegistry.js': {
    domain: 'CORE', role: 'owner',
    responsibility: 'Single Source of Meaning — Sprache, Texte, Semantik',
  },
  'src/core/coreEngine.js': {
    domain: 'CORE', role: 'engine',
    responsibility: 'Single Source of Truth für Wirkungsdaten',
    dependencies: ['src/registry/HuiRegistry.js'],
  },
  'src/core/resonanceEngine.js': {
    domain: 'CORE', role: 'engine',
    responsibility: 'Resonanz-Signale, Tiefe der Begegnung',
  },
  'src/core/orbEngine.js': {
    domain: 'CORE', role: 'engine',
    responsibility: 'Wirkungsdaten → Orb-Parameter',
  },
  'src/core/hui.actions.js': {
    domain: 'CORE', role: 'engine',
    responsibility: 'Action Engine — zentrale Interaktions-Dispatch-Schicht',
  },
  'src/core/hui.contracts.js': {
    domain: 'CORE', role: 'engine',
    responsibility: 'Action-Verträge und Payload-Validierung',
  },
  'src/core/HuiConnectionEngine.jsx': {
    domain: 'CORE', role: 'engine',
    responsibility: 'Connection Engine — Follow/Connect Logik',
    dependencies: ['SOCIAL domain service (target)'],
  },

  // ─── IDENTITY ───────────────────────────────────────────
  'src/lib/AuthContext.jsx': {
    domain: 'IDENTITY', role: 'owner',
    responsibility: 'Auth-State, Session, Profile-Upsert bei Login',
  },
  'src/lib/AppStateContext.jsx': {
    domain: 'IDENTITY', role: 'owner',
    responsibility: 'Globaler App-State: Profile, Follows, Notifications, Works',
    dependencies: ['src/services/db.js'],
  },

  // ─── SOCIAL ─────────────────────────────────────────────
  'src/lib/chatContext.js': {
    domain: 'SOCIAL', role: 'owner',
    responsibility: 'Chat-Liste, Thread, Messages — Single Owner',
  },
  'src/lib/bookingContext.js': {
    domain: 'COMMERCE', role: 'owner',
    responsibility: 'Creator Bookings — Confirm/Decline/Complete',
  },
  'src/lib/trustContext.js': {
    domain: 'TRUST', role: 'owner',
    responsibility: 'Trust & Reputation State',
  },
  'src/lib/sessionHooks.js': {
    domain: 'SOCIAL', role: 'owner',
    responsibility: 'Session, Presence, Story-Refresh-Key',
  },

  // ─── SERVICES ───────────────────────────────────────────
  'src/services/db.js': {
    domain: 'CORE', role: 'service',
    responsibility: 'Legacy Monolith DB Service — alle Domänen',
    deprecated: true,
    dependencies: ['TODO(ADR-0001): Split into domain services'],
  },
  'src/services/content.js': {
    domain: 'CONTENT', role: 'service',
    responsibility: 'Feed-Posts, Works CRUD, Media Upload',
  },
  'src/services/commerceEngine.js': {
    domain: 'COMMERCE', role: 'service',
    responsibility: 'Commerce Events, Checkout, Order Status',
  },
  'src/services/creatorEconomy.js': {
    domain: 'COMMERCE', role: 'service',
    responsibility: 'Creator Wallets, Supports, Bookings, Sales',
  },

  // ─── DISCOVERY ──────────────────────────────────────────
  'src/feed/useFeedStream.js': {
    domain: 'DISCOVERY', role: 'engine',
    responsibility: 'Living Feed Infrastructure',
  },
  'src/feed/feedRhythmEngine.js': {
    domain: 'DISCOVERY', role: 'engine',
    responsibility: 'Feed-Rhythmus und Energie-Balance',
  },
  'src/lib/discovery/index.js': {
    domain: 'DISCOVERY', role: 'service',
    responsibility: 'Discovery-Suche und Empfehlungen',
  },

  // ─── COMMUNITY ──────────────────────────────────────────
  'src/lib/community/index.js': {
    domain: 'COMMUNITY', role: 'service',
    responsibility: 'Community Members, Guardian Actions',
  },

  // ─── PLATFORM ───────────────────────────────────────────
  'src/lib/events/index.js': {
    domain: 'PLATFORM', role: 'service',
    responsibility: 'Platform Events Logging',
  },
  'src/lib/notificationService.js': {
    domain: 'PLATFORM', role: 'service',
    responsibility: 'Notification Insert Helper',
  },

  // ─── INFRASTRUCTURE ─────────────────────────────────────
  'src/lib/supabaseClient.js': {
    domain: 'CORE', role: 'guard',
    responsibility: 'Einzelne Supabase-Client-Instanz',
  },
  'src/architecture/guards.js': {
    domain: 'CORE', role: 'guard',
    responsibility: 'Architecture Dev-Warnings und Assertions',
  },
  'src/architecture/violations.js': {
    domain: 'CORE', role: 'guard',
    responsibility: 'Bekannte Architektur-Verstöße Registry',
  },
};

/**
 * @param {string} filePath
 * @returns {OwnershipMeta|undefined}
 */
export function getOwnership(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return FILE_OWNERSHIP[normalized];
}

/**
 * @param {string} filePath
 * @param {import('./domains.js').HuiDomain} expectedDomain
 * @returns {boolean}
 */
export function assertDomain(filePath, expectedDomain) {
  const meta = getOwnership(filePath);
  if (!meta) return false;
  return meta.domain === expectedDomain;
}
