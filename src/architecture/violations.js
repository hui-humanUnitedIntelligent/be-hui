// src/architecture/violations.js
// ══════════════════════════════════════════════════════════════
// HUI Architecture Violations Registry — CORE-001
// Vollständige Liste aller bekannten Domain-Ownership-Verstöße
// ══════════════════════════════════════════════════════════════

/**
 * @typedef {'P0'|'P1'|'P2'|'P3'} ViolationPriority
 * @typedef {'direct_db_write'|'core_bypass'|'action_bypass'|'duplicate_owner'|'hook_business_logic'|'cross_domain'|'service_violation'} ViolationType
 *
 * @typedef {Object} ArchitectureViolation
 * @property {string} id
 * @property {string} file
 * @property {import('./domains.js').HuiDomain} responsibleDomain
 * @property {ViolationType} type
 * @property {string} description
 * @property {string[]} [tables]
 * @property {string} violatedAdr
 * @property {string} violatedRule
 * @property {ViolationPriority} priority
 * @property {'open'|'accepted'|'migrating'|'resolved'} status
 * @property {string} risk
 * @property {string} migration
 */

/** @type {ArchitectureViolation[]} */
export const VIOLATIONS = [
  // ─── P0: Kritische direkte DB-Writes in UI ──────────────
  {
    id: 'V-001',
    file: 'src/components/WorkDetailPage.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes INSERT in comments, UPDATE in works',
    tables: ['comments', 'works'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Constitution IV — Keine UI-Komponente besitzt eigene Wirkungslogik',
    priority: 'P0',
    status: 'open',
    risk: 'Doppelter State mit AppStateContext, inkonsistente work_likes/saves',
    migration: 'Alle Writes über AppStateContext oder ContentService',
  },
  {
    id: 'V-002',
    file: 'src/components/StoryBar.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes UPSERT story_views, INSERT messages',
    tables: ['story_views', 'messages'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3 — UI → DB verboten',
    priority: 'P0',
    status: 'open',
    risk: 'Cross-Domain: CONTENT schreibt SOCIAL (messages)',
    migration: 'StoryService.recordView() + ChatContext.sendMessage()',
  },
  {
    id: 'V-003',
    file: 'src/pages/TalentProfilePage.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'direct_db_write',
    description: 'Direkte profile UPDATEs, watchers INSERT/DELETE',
    tables: ['profiles', 'profile_watchers'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Single Owner: AppStateContext/ProfileService',
    priority: 'P0',
    status: 'open',
    risk: '19 duplizierte Profile-States, Race Conditions',
    migration: 'ProfileService + AppStateContext delegation',
  },
  {
    id: 'V-004',
    file: 'src/pages/MyBasisProfile.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes works UPDATE/DELETE, experiences DELETE',
    tables: ['works', 'experiences'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3 — UI → DB verboten',
    priority: 'P0',
    status: 'open',
    risk: '11 duplizierte Works-States',
    migration: 'WorkService.archive() / ContentService',
  },
  {
    id: 'V-005',
    file: 'src/pages/ImpactPage.jsx',
    responsibleDomain: 'IMPACT',
    type: 'direct_db_write',
    description: 'Direktes impact_votes INSERT, impact_monthly_results UPSERT',
    tables: ['impact_votes', 'impact_monthly_results'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'ImpactService als Single Owner',
    priority: 'P0',
    status: 'accepted',
    risk: 'Standalone Page — akzeptiert aber nicht ideal',
    migration: 'ImpactService.castVote() + ImpactService.recordResult()',
  },

  // ─── P1: Direkte DB-Writes in UI (nicht-kritisch) ───────
  {
    id: 'V-010',
    file: 'src/components/NotificationCenter.jsx',
    responsibleDomain: 'PLATFORM',
    type: 'direct_db_write',
    description: 'Direktes notifications UPDATE, payments SELECT',
    tables: ['notifications', 'payments'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'AppStateContext ist Notification Owner',
    priority: 'P1',
    status: 'open',
    risk: 'Notification-State Divergenz',
    migration: 'AppStateContext.markRead() / useNotifications',
  },
  {
    id: 'V-011',
    file: 'src/components/auth/ProfileCompletionFlow.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'direct_db_write',
    description: 'Direktes profiles UPDATE',
    tables: ['profiles'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Single Owner Prinzip',
    priority: 'P1',
    status: 'accepted',
    risk: 'Niedrig — legitimer Onboarding-Flow',
    migration: 'AuthContext.updateProfile() wrapper',
  },
  {
    id: 'V-012',
    file: 'src/components/studio/ProfilBearbeitenModal.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'direct_db_write',
    description: 'Direktes profiles/wirker_profiles UPDATE/INSERT',
    tables: ['profiles', 'wirker_profiles'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'EditProfile ist einziger legitimer Schreibpfad',
    priority: 'P1',
    status: 'open',
    risk: 'Profil-Inkonsistenz zwischen Modal und AppState',
    migration: 'ProfileService.update() + WirkerService.update()',
  },
  {
    id: 'V-013',
    file: 'src/components/settings/SettingsModal.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'direct_db_write',
    description: 'Direktes profiles UPDATE (email, settings)',
    tables: ['profiles'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Single Owner Prinzip',
    priority: 'P1',
    status: 'open',
    risk: 'Settings nicht in AppState reflektiert',
    migration: 'ProfileService.update()',
  },
  {
    id: 'V-014',
    file: 'src/components/works/WerkWizard.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes works INSERT/UPDATE',
    tables: ['works'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §7 — Create-Flow Ausnahme greift teilweise',
    priority: 'P1',
    status: 'accepted',
    risk: 'Niedrig — isolierter Create-Flow',
    migration: 'WorkService.create() / WorkService.update()',
  },
  {
    id: 'V-015',
    file: 'src/components/experiences/ExperienceWizard.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes experiences INSERT/UPDATE',
    tables: ['experiences'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'experienceContract.js fordert Service-Layer',
    priority: 'P1',
    status: 'open',
    risk: 'Widerspricht experienceContract.js Regel',
    migration: 'experienceContract.publishExperience()',
  },
  {
    id: 'V-016',
    file: 'src/components/HuiMomentSheet.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes beitraege INSERT',
    tables: ['beitraege'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3',
    priority: 'P1',
    status: 'open',
    risk: 'Content nicht im Feed-State',
    migration: 'ContentService.createBeitrag()',
  },
  {
    id: 'V-017',
    file: 'src/components/teilen/TeilenFlow.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes beitraege INSERT',
    tables: ['beitraege'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3',
    priority: 'P1',
    status: 'open',
    risk: 'Content-State Divergenz',
    migration: 'ContentService.createBeitrag()',
  },
  {
    id: 'V-018',
    file: 'src/components/SupportSheet.jsx',
    responsibleDomain: 'IMPACT',
    type: 'cross_domain',
    description: 'Direktes project_support INSERT + impact_projects UPDATE',
    tables: ['project_support', 'impact_projects'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000 §3 — Cross-Domain Write',
    priority: 'P1',
    status: 'open',
    risk: 'Impact-Daten ohne Service-Validierung',
    migration: 'ImpactService.supportProject()',
  },
  {
    id: 'V-019',
    file: 'src/components/connection-create/ConnectionCreatePage.jsx',
    responsibleDomain: 'SOCIAL',
    type: 'direct_db_write',
    description: 'Direktes connections INSERT',
    tables: ['connections'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3',
    priority: 'P1',
    status: 'open',
    risk: 'Connection-State nicht in AppState',
    migration: 'SocialService.createConnection()',
  },
  {
    id: 'V-020',
    file: 'src/pages/wirker-profile/index.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'direct_db_write',
    description: 'Direktes profile_watchers INSERT/DELETE',
    tables: ['profile_watchers'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Single Owner Prinzip',
    priority: 'P1',
    status: 'open',
    risk: 'Watch-State Divergenz',
    migration: 'ProfileService.toggleWatch()',
  },
  {
    id: 'V-021',
    file: 'src/pages/BasisProfilePage.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'direct_db_write',
    description: 'Direktes profiles UPDATE (bio, location, availability)',
    tables: ['profiles'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Single Owner Prinzip',
    priority: 'P1',
    status: 'open',
    risk: 'Profil-State Divergenz',
    migration: 'ProfileService.update()',
  },
  {
    id: 'V-022',
    file: 'src/components/profile/sections/WorksSection.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes works UPDATE (soft delete)',
    tables: ['works'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3',
    priority: 'P1',
    status: 'open',
    risk: 'Works-State Divergenz',
    migration: 'WorkService.archive()',
  },
  {
    id: 'V-023',
    file: 'src/components/studio/ImpactStimmenModal.jsx',
    responsibleDomain: 'IMPACT',
    type: 'direct_db_write',
    description: 'Direktes impact_votes INSERT',
    tables: ['impact_votes'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'ImpactService als Owner',
    priority: 'P1',
    status: 'open',
    risk: 'Vote-State Divergenz',
    migration: 'ImpactService.castVote()',
  },
  {
    id: 'V-024',
    file: 'src/components/notifications/NotificationPanel.jsx',
    responsibleDomain: 'PLATFORM',
    type: 'direct_db_write',
    description: 'Direktes notifications UPDATE',
    tables: ['notifications'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'AppStateContext Notification Owner',
    priority: 'P1',
    status: 'open',
    risk: 'Doppelter Notification-State',
    migration: 'useNotifications.markRead()',
  },
  {
    id: 'V-025',
    file: 'src/pages/Admin.jsx',
    responsibleDomain: 'PLATFORM',
    type: 'direct_db_write',
    description: 'Admin notifications INSERT, content moderation UPDATE',
    tables: ['notifications'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §7 — Admin Ausnahme',
    priority: 'P1',
    status: 'accepted',
    risk: 'Niedrig — Admin-Tool by design',
    migration: 'AdminService wrapper (optional)',
  },

  // ─── P1: Feed-Komponenten ───────────────────────────────
  {
    id: 'V-030',
    file: 'src/feed/StoryViewer.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes story_views UPSERT',
    tables: ['story_views'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'StoryService als Owner',
    priority: 'P1',
    status: 'open',
    risk: 'View-Count Divergenz',
    migration: 'StoryService.recordView()',
  },
  {
    id: 'V-031',
    file: 'src/feed/StoryReactionTray.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes story_reactions UPSERT',
    tables: ['story_reactions'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'StoryService als Owner',
    priority: 'P1',
    status: 'open',
    risk: 'Reaction-State Divergenz',
    migration: 'StoryService.addReaction()',
  },
  {
    id: 'V-032',
    file: 'src/feed/StoryCreator.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Direktes stories INSERT',
    tables: ['stories'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §7 — Create-Flow Ausnahme',
    priority: 'P1',
    status: 'accepted',
    risk: 'Niedrig — isolierter Create-Flow',
    migration: 'StoryService.create()',
  },

  // ─── P1: Commerce UI ────────────────────────────────────
  {
    id: 'V-040',
    file: 'src/components/commerce/WerkKaufFlow.jsx',
    responsibleDomain: 'COMMERCE',
    type: 'direct_db_write',
    description: 'Direktes notifications INSERT nach Kauf',
    tables: ['notifications'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Cross-Domain: COMMERCE → PLATFORM',
    priority: 'P1',
    status: 'open',
    risk: 'Notification ohne Service-Validierung',
    migration: 'notificationService.notify()',
  },
  {
    id: 'V-041',
    file: 'src/components/commerce/ExperienceBookingFlow.jsx',
    responsibleDomain: 'COMMERCE',
    type: 'direct_db_write',
    description: 'Direktes notifications INSERT nach Buchung',
    tables: ['notifications'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Cross-Domain: COMMERCE → PLATFORM',
    priority: 'P1',
    status: 'open',
    risk: 'Notification ohne Service-Validierung',
    migration: 'notificationService.notify() + bookingContext',
  },

  // ─── P1: Hook Business Logic ────────────────────────────
  {
    id: 'V-050',
    file: 'src/lib/useReactions.jsx',
    responsibleDomain: 'SOCIAL',
    type: 'hook_business_logic',
    description: 'DB Writes für post_reactions und saved_posts',
    tables: ['post_reactions', 'saved_posts'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3 — Hook → DB write verboten',
    priority: 'P1',
    status: 'open',
    risk: 'Reaction-State nicht zentralisiert',
    migration: 'SocialService.toggleReaction()',
  },
  {
    id: 'V-051',
    file: 'src/lib/usePresence.jsx',
    responsibleDomain: 'SOCIAL',
    type: 'hook_business_logic',
    description: 'DB UPSERT user_presence',
    tables: ['user_presence'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'sessionHooks ist Presence Owner',
    priority: 'P1',
    status: 'open',
    risk: 'Doppelter Presence-Hook (usePresence.js + usePresence.jsx)',
    migration: 'sessionHooks.usePresence() konsolidieren',
  },
  {
    id: 'V-052',
    file: 'src/lib/usePresence.js',
    responsibleDomain: 'SOCIAL',
    type: 'hook_business_logic',
    description: 'DB UPDATE user_presence — Duplikat von usePresence.jsx',
    tables: ['user_presence'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Duplicate Owner',
    priority: 'P1',
    status: 'open',
    risk: 'Zwei Presence-Implementierungen',
    migration: 'Deprecated — nur sessionHooks nutzen',
  },
  {
    id: 'V-053',
    file: 'src/lib/useNotifications.jsx',
    responsibleDomain: 'PLATFORM',
    type: 'hook_business_logic',
    description: 'DB UPDATE notifications + profile_relations',
    tables: ['notifications', 'profile_relations'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'AppStateContext ist Notification Owner',
    priority: 'P1',
    status: 'open',
    risk: 'Doppelter Notification-State',
    migration: 'AppStateContext delegation',
  },
  {
    id: 'V-054',
    file: 'src/hooks/useAmbassador.js',
    responsibleDomain: 'IDENTITY',
    type: 'hook_business_logic',
    description: 'DB INSERT ambassador + profiles UPDATE',
    tables: ['ambassador_applications', 'profiles'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §3 — Hook → DB write',
    priority: 'P1',
    status: 'open',
    risk: 'Ambassador-State nicht zentralisiert',
    migration: 'IdentityService.applyAmbassador()',
  },
  {
    id: 'V-055',
    file: 'src/hooks/useProfileData.js',
    responsibleDomain: 'IDENTITY',
    type: 'service_violation',
    description: 'Direkte DB Reads — umgeht ProfileService',
    tables: ['wirker_profiles', 'works', 'experiences', 'projects'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'Services als einziger DB-Zugang',
    priority: 'P2',
    status: 'open',
    risk: 'Fieldset-Inkonsistenz (kein IDENTITY_CONTRACT)',
    migration: 'ProfileService + WorkService delegation',
  },

  // ─── P1: Core Bypasses ──────────────────────────────────
  {
    id: 'V-060',
    file: 'src/core/HuiConnectionEngine.jsx',
    responsibleDomain: 'CORE',
    type: 'cross_domain',
    description: 'CORE Engine schreibt direkt in follows (SOCIAL domain)',
    tables: ['follows'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'CORE Domain Charter — keine domänen-spezifischen DB-Writes',
    priority: 'P0',
    status: 'open',
    risk: 'Architekturgrenze CORE/SOCIAL verletzt',
    migration: 'SocialService.toggleFollow() via AppStateContext',
  },
  {
    id: 'V-061',
    file: 'src/core/coreEngine.js',
    responsibleDomain: 'CORE',
    type: 'direct_db_write',
    description: 'Core Engine UPSERT in DB (Wirkungsdaten)',
    tables: ['hui_core_profiles'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'CORE soll aggregieren, nicht direkt persistieren',
    priority: 'P1',
    status: 'open',
    risk: 'Persistence-Logik in Engine statt Service',
    migration: 'CorePersistenceService extrahieren',
  },

  // ─── P2: Action Engine Bypasses ─────────────────────────
  {
    id: 'V-070',
    file: 'src/components/HuiMatchOverlay.jsx',
    responsibleDomain: 'DISCOVERY',
    type: 'action_bypass',
    description: 'Direkte Navigation/State ohne Action Engine',
    violatedAdr: 'ADR-0001 §4',
    violatedRule: 'hui.actions.js — Alle Interaktionen über A.*',
    priority: 'P2',
    status: 'open',
    risk: 'Flow-Memory fehlt, Return-Navigation bricht',
    migration: 'useHuiActions() für Profile/Chat/Experience Opens',
  },
  {
    id: 'V-071',
    file: 'src/pages/DiscoverPage.jsx',
    responsibleDomain: 'DISCOVERY',
    type: 'action_bypass',
    description: 'Direkte setState für Profile-Overlay',
    violatedAdr: 'ADR-0001 §4',
    violatedRule: 'Action Engine Pflicht',
    priority: 'P2',
    status: 'open',
    risk: 'Flow-Context fehlt',
    migration: 'A.OPEN_PROFILE via useHuiActions()',
  },
  {
    id: 'V-072',
    file: 'src/components/WorkDetailPage.jsx',
    responsibleDomain: 'CONTENT',
    type: 'action_bypass',
    description: 'Direkte Navigation ohne Action Engine',
    violatedAdr: 'ADR-0001 §4',
    violatedRule: 'Action Engine Pflicht',
    priority: 'P2',
    status: 'open',
    risk: 'Return-Flow nicht trackbar',
    migration: 'A.OPEN_PROFILE / A.OPEN_CHAT',
  },

  // ─── P1: Duplicate State Owners ─────────────────────────
  {
    id: 'V-080',
    file: 'src/lib/AppStateContext.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'duplicate_owner',
    description: 'Co-Owner für bookings (8 Duplikate), works (11), profile (19)',
    violatedAdr: 'ADR-0001 §2',
    violatedRule: 'RFC-000A §4 — Single Owner pro Datensystem',
    priority: 'P1',
    status: 'open',
    risk: 'State-Divergenz bei parallelen Updates',
    migration: 'Strikte Owner-Trennung: bookingContext für bookings',
  },
  {
    id: 'V-081',
    file: 'src/services/db.js',
    responsibleDomain: 'CORE',
    type: 'service_violation',
    description: 'Monolith-Service ohne eindeutige Domänenzuordnung',
    violatedAdr: 'ADR-0001 §2',
    violatedRule: 'RFC-000 §4 — Service-Zuordnung',
    priority: 'P1',
    status: 'open',
    risk: 'Alle Domänen an einem Service gekoppelt',
    migration: 'Split: identityService, contentService, socialService, etc.',
  },

  // ─── P1: Accepted Create-Flows ───────────────────────────
  {
    id: 'V-090',
    file: 'src/components/HuiCreateFlow.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Create-Flow: stories/works INSERT',
    tables: ['stories', 'works'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §7 — Ausnahme Create-Flows',
    priority: 'P3',
    status: 'accepted',
    risk: 'Niedrig — isolierte Transaktion',
    migration: 'ContentService.create() (optional)',
  },
  {
    id: 'V-091',
    file: 'src/components/WerkPublisher.jsx',
    responsibleDomain: 'CONTENT',
    type: 'direct_db_write',
    description: 'Create-Flow: works INSERT',
    tables: ['works'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §7 — Ausnahme Create-Flows',
    priority: 'P3',
    status: 'accepted',
    risk: 'Niedrig — isolierte Transaktion',
    migration: 'WorkService.create() (optional)',
  },
  {
    id: 'V-092',
    file: 'src/pages/LoginPage.jsx',
    responsibleDomain: 'IDENTITY',
    type: 'direct_db_write',
    description: 'Auth-Flow: profiles UPSERT',
    tables: ['profiles'],
    violatedAdr: 'ADR-0001 §3',
    violatedRule: 'RFC-000A §7 — Auth Ausnahme',
    priority: 'P3',
    status: 'accepted',
    risk: 'Niedrig — Auth by design',
    migration: 'AuthContext.upsertProfile() (bereits teilweise)',
  },
];

/**
 * @param {ViolationPriority} [priority]
 * @returns {ArchitectureViolation[]}
 */
export function getViolationsByPriority(priority) {
  if (!priority) return VIOLATIONS;
  return VIOLATIONS.filter((v) => v.priority === priority);
}

/**
 * @param {string} file
 * @returns {ArchitectureViolation[]}
 */
export function getViolationsForFile(file) {
  const normalized = file.replace(/\\/g, '/');
  return VIOLATIONS.filter((v) => v.file.includes(normalized) || normalized.includes(v.file));
}

/**
 * @returns {ArchitectureViolation[]}
 */
export function getOpenViolations() {
  return VIOLATIONS.filter((v) => v.status === 'open');
}

/**
 * Priorisierte Migrationsliste — sortiert P0 → P3, open vor accepted.
 * @returns {ArchitectureViolation[]}
 */
export function getMigrationList() {
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const statusOrder = { open: 0, migrating: 1, accepted: 2, resolved: 3 };
  return [...VIOLATIONS].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

/** Summary stats for reporting. */
export function getViolationStats() {
  const stats = { total: VIOLATIONS.length, open: 0, accepted: 0, byPriority: {}, byType: {} };
  for (const v of VIOLATIONS) {
    if (v.status === 'open') stats.open++;
    if (v.status === 'accepted') stats.accepted++;
    stats.byPriority[v.priority] = (stats.byPriority[v.priority] || 0) + 1;
    stats.byType[v.type] = (stats.byType[v.type] || 0) + 1;
  }
  return stats;
}
