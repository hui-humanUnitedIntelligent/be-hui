// src/architecture/semantic/extractors/capabilityExtractor.js
// Automatic capability inference from paths, modules, routes, and actions.

import { SEMANTIC_NODE_TYPES, SEMANTIC_EDGE_TYPES, TECHNICAL_NODE_TYPES, TECHNICAL_EDGE_TYPES } from '../../graph/schema.js';

/** Canonical capabilities — presence inferred from codebase signals */
export const CANONICAL_CAPABILITIES = Object.freeze([
  'Identity', 'Discovery', 'Feed', 'Stories', 'Works', 'Experiences',
  'Messaging', 'Booking', 'Payments', 'Commerce', 'Impact', 'Trust',
  'Orb', 'Presence', 'Community', 'Moderation', 'Notifications', 'Search',
  'Profile', 'Creator Economy', 'Creator Studio', 'Guardian', 'Administration',
  'Analytics', 'Settings', 'Authentication', 'Media', 'Storage', 'Matching',
  'Recommendations', 'Navigation', 'Localization',
]);

/** Path/filename/action patterns → capability */
const CAPABILITY_SIGNALS = Object.freeze([
  { cap: 'Identity', patterns: [/auth/i, /identity/i, /login/i, /session/i] },
  { cap: 'Discovery', patterns: [/discover/i, /search/i, /PeopleSearch/i, /userSearch/i] },
  { cap: 'Feed', patterns: [/feed/i, /FeedStream/i, /useFeed/i] },
  { cap: 'Stories', patterns: [/stor(y|ies)/i, /StoryComposer/i] },
  { cap: 'Works', patterns: [/work/i, /Werk/i, /portfolio/i] },
  { cap: 'Experiences', patterns: [/experience/i, /Experience/i] },
  { cap: 'Messaging', patterns: [/chat/i, /message/i, /Messaging/i] },
  { cap: 'Booking', patterns: [/booking/i, /Booking/i] },
  { cap: 'Payments', patterns: [/payment/i, /stripe/i, /checkout/i] },
  { cap: 'Commerce', patterns: [/commerce/i, /cart/i, /shop/i] },
  { cap: 'Impact', patterns: [/impact/i, /Impact/i, /resonance/i] },
  { cap: 'Trust', patterns: [/trust/i, /Trust/i, /verified/i] },
  { cap: 'Orb', patterns: [/orb/i, /Orb/i, /orbLayer/i, /orbEngine/i] },
  { cap: 'Presence', patterns: [/presence/i, /online/i, /world/i] },
  { cap: 'Community', patterns: [/community/i, /Community/i, /local\.js/i] },
  { cap: 'Moderation', patterns: [/moderat/i, /guardian/i, /report/i] },
  { cap: 'Notifications', patterns: [/notif/i, /Notification/i] },
  { cap: 'Search', patterns: [/search/i, /Search/i] },
  { cap: 'Profile', patterns: [/profile/i, /Profile/i, /creator/i] },
  { cap: 'Creator Economy', patterns: [/creatorEconomy/i, /creator-economy/i] },
  { cap: 'Creator Studio', patterns: [/CreatorStudio/i, /studio/i] },
  { cap: 'Guardian', patterns: [/guardian/i, /Guardian/i] },
  { cap: 'Administration', patterns: [/admin/i, /Admin/i] },
  { cap: 'Analytics', patterns: [/analytics/i, /metrics/i, /tracking/i] },
  { cap: 'Settings', patterns: [/settings/i, /Settings/i, /preferences/i] },
  { cap: 'Authentication', patterns: [/AuthContext/i, /auth\//i, /supabase.*auth/i] },
  { cap: 'Media', patterns: [/media/i, /upload/i, /image/i, /video/i] },
  { cap: 'Storage', patterns: [/storage/i, /bucket/i, /upload/i] },
  { cap: 'Matching', patterns: [/match/i, /Match/i, /matching/i] },
  { cap: 'Recommendations', patterns: [/recommend/i, /Recommend/i] },
  { cap: 'Navigation', patterns: [/nav/i, /Nav/i, /routing/i, /routes/i] },
  { cap: 'Localization', patterns: [/i18n/i, /locale/i, /LANG/i, /localization/i] },
]);

function capId(name) {
  return `capability:${name.toLowerCase().replace(/\s+/g, '-')}`;
}

export { capId };

/**
 * @param {import('../../graph/graphStore.js').GraphStore} store
 * @param {import('../../scanner/fileScanner.js').FileScanResult[]} scanResults
 */
export function extractCapabilities(store, scanResults) {
  // Create all canonical capability nodes
  for (const cap of CANONICAL_CAPABILITIES) {
    store.upsertNode({
      id: capId(cap),
      type: SEMANTIC_NODE_TYPES.CAPABILITY,
      label: cap,
      description: `Plattform-Capability: ${cap}`,
      confidence: 'confirmed',
      source: 'ARCH-002.1 capability registry',
    });
  }

  const capabilityEvidence = new Map();
  for (const cap of CANONICAL_CAPABILITIES) {
    capabilityEvidence.set(cap, { files: new Set(), actions: new Set(), services: new Set() });
  }

  // Infer from file paths
  for (const r of scanResults) {
    const pathStr = r.path;
    const fileName = r.path.split('/').pop();
    for (const { cap, patterns } of CAPABILITY_SIGNALS) {
      const matched = patterns.some(p => p.test(pathStr) || p.test(fileName));
      if (matched) {
        capabilityEvidence.get(cap).files.add(r.path);
        const fid = `file:${r.path}`;
        store.addEdge({
          type: SEMANTIC_EDGE_TYPES.REALIZES,
          source: fid,
          target: capId(cap),
          confidence: 'inferred',
          sourceRef: 'path-pattern',
        });
      }
    }
  }

  // Infer from actions
  for (const actionNode of store.getNodesByType(TECHNICAL_NODE_TYPES.ACTION)) {
    const label = actionNode.label;
    for (const { cap, patterns } of CAPABILITY_SIGNALS) {
      if (patterns.some(p => p.test(label))) {
        capabilityEvidence.get(cap).actions.add(label);
        store.addEdge({
          type: SEMANTIC_EDGE_TYPES.ENABLES,
          source: actionNode.id,
          target: capId(cap),
          confidence: 'inferred',
          sourceRef: 'action-name',
        });
      }
    }
  }

  // Service files → capabilities
  for (const r of scanResults) {
    if (!r.path.includes('services/') && !r.path.includes('lib/')) continue;
    const baseName = r.path.split('/').pop().replace(/\.[jt]sx?$/, '');
    for (const { cap, patterns } of CAPABILITY_SIGNALS) {
      if (patterns.some(p => p.test(baseName))) {
        capabilityEvidence.get(cap).services.add(r.path);
        store.addEdge({
          type: SEMANTIC_EDGE_TYPES.IMPLEMENTS,
          source: `file:${r.path}`,
          target: capId(cap),
          confidence: 'inferred',
          sourceRef: 'service-filename',
        });
      }
    }
  }

  // Mark capabilities with no evidence as inferred-only (still present per spec)
  for (const cap of CANONICAL_CAPABILITIES) {
    const ev = capabilityEvidence.get(cap);
    const hasEvidence = ev.files.size > 0 || ev.actions.size > 0 || ev.services.size > 0;
    const node = store.getNode(capId(cap));
    if (node && !hasEvidence) {
      store.upsertNode({
        ...node,
        confidence: 'inferred',
        description: `${cap} — definiert im Capability-Register, noch ohne Code-Signale im Scan.`,
        meta: { ...node.meta, noCodeSignals: true },
      });
    } else if (node) {
      store.upsertNode({
        ...node,
        meta: {
          ...node.meta,
          fileCount: ev.files.size,
          actionCount: ev.actions.size,
          serviceCount: ev.services.size,
        },
      });
    }
  }

  // Link capabilities to platform goals (inferred)
  const GOAL_MAP = {
    'verbinden': ['Discovery', 'Messaging', 'Community', 'Profile', 'Matching'],
    'unterstuetzen': ['Booking', 'Trust', 'Recommendations', 'Creator Economy'],
    'erschaffen': ['Works', 'Experiences', 'Stories', 'Creator Studio', 'Media'],
    'wertschoepfen': ['Commerce', 'Payments', 'Creator Economy'],
    'impact': ['Impact', 'Trust', 'Orb'],
  };
  for (const [goal, caps] of Object.entries(GOAL_MAP)) {
    const goalId = `platform-goal:${goal}`;
    if (!store.getNode(goalId)) continue;
    for (const cap of caps) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.CONTRIBUTES_TO,
        source: capId(cap),
        target: goalId,
        confidence: 'inferred',
        sourceRef: 'pillar→capability heuristic',
      });
    }
  }

  return store;
}
