// src/architecture/semantic/extractors/registryExtractor.js

import { readFileSync } from 'fs';
import { TECHNICAL_NODE_TYPES, SEMANTIC_NODE_TYPES, SEMANTIC_EDGE_TYPES, TECHNICAL_EDGE_TYPES } from '../../graph/schema.js';

/**
 * @param {string} registryPath
 * @param {import('../../graph/graphStore.js').GraphStore} store
 */
export function extractRegistry(registryPath, store) {
  const content = readFileSync(registryPath, 'utf8');

  // Pillars
  const pillarRe = /\[PILLARS\.(\w+)\]:\s*'(\w+)'/g;
  let m;
  while ((m = pillarRe.exec(content)) !== null) {
    const key = m[2];
    const pid = `pillar:${key}`;
    store.upsertNode({
      id: pid,
      type: TECHNICAL_NODE_TYPES.PILLAR,
      label: key,
      confidence: 'confirmed',
      source: 'HuiRegistry.js PILLARS',
    });
    store.upsertNode({
      id: `platform-goal:${key}`,
      type: SEMANTIC_NODE_TYPES.PLATFORM_GOAL,
      label: key,
      confidence: 'confirmed',
      source: 'HuiRegistry.js',
    });
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.EXPRESSES,
      source: pid,
      target: `platform-goal:${key}`,
      confidence: 'confirmed',
    });
  }

  // Pillar titles and descriptions from REGISTRY_DATA
  const titleRe = /\[PILLARS\.\w+\]:\s*Object\.freeze\(\{[\s\S]*?id:\s*'(\w+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'/g;
  while ((m = titleRe.exec(content)) !== null) {
    const [, id, title, description] = m;
    store.upsertNode({
      id: `pillar:${id}`,
      type: TECHNICAL_NODE_TYPES.PILLAR,
      label: title,
      description,
      confidence: 'confirmed',
      source: 'HuiRegistry.js REGISTRY',
      meta: { id },
    });
  }

  // Orb traits per pillar
  const orbRe = /orb:\s*Object\.freeze\(\{[\s\S]*?trait:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'/g;
  let orbIdx = 0;
  while ((m = orbRe.exec(content)) !== null) {
    store.upsertNode({
      id: `orb-trait:${orbIdx}`,
      type: SEMANTIC_NODE_TYPES.ORB_BEHAVIOUR,
      label: m[1],
      description: m[2],
      confidence: 'confirmed',
      source: 'HuiRegistry.js orb.*',
    });
    orbIdx++;
  }

  // LANG forbidden terms → constraints
  const langSection = content.match(/export const LANG = Object\.freeze\(\{([\s\S]*?)\}\);/);
  if (langSection) {
    const entries = langSection[1].match(/(\w+):\s*'([^']+)'/g) || [];
    entries.forEach(entry => {
      const em = entry.match(/(\w+):\s*'([^']+)'/);
      if (!em) return;
      store.upsertNode({
        id: `constraint:lang-${em[1]}`,
        type: SEMANTIC_NODE_TYPES.CONSTRAINT,
        label: `Sprache: ${em[1]} → ${em[2]}`,
        description: `HUI-Terminologie aus LANG.${em[1]}`,
        confidence: 'confirmed',
        source: 'HuiRegistry.js LANG',
      });
    });
  }

  // Resonance signals
  store.upsertNode({
    id: 'signal:resonance',
    type: SEMANTIC_NODE_TYPES.RESONANCE_SIGNAL,
    label: 'Resonanz',
    description: 'Tiefe Wirkungssignale — keine Like-Logik (Constitution + Registry)',
    confidence: 'confirmed',
    source: 'HuiRegistry.js + Constitution',
  });

  store.upsertNode({
    id: 'signal:trust',
    type: SEMANTIC_NODE_TYPES.TRUST_SIGNAL,
    label: 'Vertrauen',
    description: 'Trust-Signale aus Booking und Collaboration Kontexten',
    confidence: 'inferred',
    source: 'bookingContext.js (inferred)',
  });

  return store;
}

/**
 * @param {string} actionsPath
 * @param {string} contractsPath
 * @param {string} semanticsPath
 * @param {import('../../graph/graphStore.js').GraphStore} store
 */
export function extractActionsAndSemantics(actionsPath, contractsPath, semanticsPath, store) {
  const actionsContent = readFileSync(actionsPath, 'utf8');
  const contractsContent = readFileSync(contractsPath, 'utf8');
  const semanticsContent = readFileSync(semanticsPath, 'utf8');

  // Actions from A = { ... }
  const actionBlock = actionsContent.match(/export const A = \{([\s\S]*?)\};/);
  if (actionBlock) {
    const actionRe = /(\w+):\s*"(\w+)"/g;
    let am;
    while ((am = actionRe.exec(actionBlock[1])) !== null) {
      const [, name, value] = am;
      const aid = `action:${value}`;
      store.upsertNode({
        id: aid,
        type: TECHNICAL_NODE_TYPES.ACTION,
        label: value,
        description: `Action constant A.${name}`,
        confidence: 'confirmed',
        source: 'hui.actions.js',
        meta: { constant: name },
      });
    }
  }

  // Contracts
  const contractRe = /(\w+):\s*\{[\s\S]*?description:\s*"([^"]+)"/g;
  let cm;
  while ((cm = contractRe.exec(contractsContent)) !== null) {
    const [, actionName, description] = cm;
    const cid = `contract:${actionName}`;
    store.upsertNode({
      id: cid,
      type: TECHNICAL_NODE_TYPES.CONTRACT,
      label: actionName,
      description,
      confidence: 'confirmed',
      source: 'hui.contracts.js',
    });
    const aid = `action:${actionName}`;
    if (store.getNode(aid)) {
      store.addEdge({
        type: TECHNICAL_EDGE_TYPES.HAS_CONTRACT,
        source: aid,
        target: cid,
        confidence: 'confirmed',
      });
    }
  }

  // INTENT constants
  const intentBlock = semanticsContent.match(/export var INTENT = Object\.freeze\(\{([\s\S]*?)\}\);/);
  if (intentBlock) {
    const intentRe = /(\w+):\s*"(\w+)"[\s\S]*?\/\/\s*([^\n]+)/g;
    let im;
    while ((im = intentRe.exec(intentBlock[1])) !== null) {
      const [, name, value, comment] = im;
      const iid = `intent:${value}`;
      store.upsertNode({
        id: iid,
        type: SEMANTIC_NODE_TYPES.INTENT,
        label: value,
        description: comment.trim(),
        confidence: 'confirmed',
        source: 'hui.semantics.js INTENT',
        meta: { constant: name },
      });
    }
  }

  // Map actions to intents (inferred from naming)
  const ACTION_INTENT_MAP = {
    OPEN_CHAT: 'message', SEND_MESSAGE: 'message', FOLLOW_CREATOR: 'connect',
    OPEN_PROFILE: 'discover', GO_DISCOVER: 'discover', OPEN_EXPERIENCE: 'explore',
    BOOK_EXPERIENCE: 'book', CREATE_EXPERIENCE: 'create', OPEN_IMPACT: 'impact',
    SEND_RESONANCE: 'resonate', SHARE_MOMENT: 'share', OPEN_STORY_COMPOSER: 'create',
    OPEN_CREATE_FLOW: 'create', OPEN_ORB: 'orient', GO_HOME: 'orient',
  };
  for (const [action, intent] of Object.entries(ACTION_INTENT_MAP)) {
    const aid = `action:${action}`;
    const iid = `intent:${intent}`;
    if (store.getNode(aid) && store.getNode(iid)) {
      store.addEdge({
        type: TECHNICAL_EDGE_TYPES.EXPRESSES_INTENT,
        source: aid,
        target: iid,
        confidence: 'inferred',
        sourceRef: 'action→intent heuristic',
      });
    }
  }

  return store;
}

/**
 * @param {string} routesPath
 * @param {import('../../graph/graphStore.js').GraphStore} store
 */
export function extractRoutes(routesPath, store) {
  const content = readFileSync(routesPath, 'utf8');
  const routeRe = /\{\s*id:\s*"([^"]+)"[\s\S]*?path:\s*"([^"]+)"[\s\S]*?owner:\s*OWNER\.(\w+)/g;
  let m;
  while ((m = routeRe.exec(content)) !== null) {
    const [, id, path, owner] = m;
    const rid = `route:${id}`;
    store.upsertNode({
      id: rid,
      type: TECHNICAL_NODE_TYPES.ROUTE,
      label: path,
      description: `Route ${id}`,
      confidence: 'confirmed',
      source: 'routes/registry.js',
      meta: { path, owner },
    });
    const ownerId = `route-owner:${owner.toLowerCase()}`;
    store.upsertNode({
      id: ownerId,
      type: SEMANTIC_NODE_TYPES.FEATURE,
      label: owner,
      description: `Route owner from ADR-001`,
      confidence: 'confirmed',
      source: 'routes/registry.js OWNER',
    });
    store.addEdge({
      type: TECHNICAL_EDGE_TYPES.OWNS,
      source: ownerId,
      target: rid,
      confidence: 'confirmed',
    });
  }
  return store;
}
