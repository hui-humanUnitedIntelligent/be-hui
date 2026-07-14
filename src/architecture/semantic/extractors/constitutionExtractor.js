// src/architecture/semantic/extractors/constitutionExtractor.js
// Parses HUI_CONSTITUTION.md into semantic graph nodes.

import { readFileSync } from 'fs';
import { SEMANTIC_NODE_TYPES, SEMANTIC_EDGE_TYPES } from '../../graph/schema.js';

/**
 * @param {string} constitutionPath
 * @param {import('../../graph/graphStore.js').GraphStore} store
 */
export function extractConstitution(constitutionPath, store) {
  const content = readFileSync(constitutionPath, 'utf8');

  // Mission
  const missionMatch = content.match(/## I\. Mission\s+([\s\S]*?)(?=\n---|\n## II\.)/);
  if (missionMatch) {
    const text = missionMatch[1].trim().replace(/\n+/g, ' ').slice(0, 500);
    store.upsertNode({
      id: 'mission:hui',
      type: SEMANTIC_NODE_TYPES.MISSION,
      label: 'HUI Mission',
      description: text,
      confidence: 'confirmed',
      source: 'HUI_CONSTITUTION.md §I',
    });
  }

  // Golden Rules → Constitution Principles
  const goldenSection = content.match(/## III\. Die zehn Goldenen Regeln\s+([\s\S]*?)(?=\n---|\n## IV\.)/);
  if (goldenSection) {
    const ruleBlocks = goldenSection[1].split(/### \d+ — /).slice(1);
    ruleBlocks.forEach((block, i) => {
      const titleEnd = block.indexOf('\n');
      const title = block.slice(0, titleEnd).trim();
      const body = block.slice(titleEnd).trim().replace(/\n+/g, ' ').slice(0, 400);
      const id = `constitution-rule:${i + 1}`;
      store.upsertNode({
        id,
        type: SEMANTIC_NODE_TYPES.CONSTITUTION_PRINCIPLE,
        label: `Regel ${i + 1}: ${title}`,
        description: body,
        confidence: 'confirmed',
        source: `HUI_CONSTITUTION.md §III.${i + 1}`,
        meta: { ruleNumber: i + 1, title },
      });
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.DERIVED_FROM,
        source: id,
        target: 'mission:hui',
        confidence: 'confirmed',
        sourceRef: 'constitution-structure',
      });
    });
  }

  // Architecture Principles
  const archSection = content.match(/### Unveränderliche Architekturregeln\s+([\s\S]*?)(?=\n---|\n## V\.)/);
  if (archSection) {
    const rules = archSection[1].match(/- \*\*([^*]+)\*\*\s+([\s\S]*?)(?=\n- \*\*|\n---|$)/g) || [];
    rules.forEach((rule, i) => {
      const m = rule.match(/- \*\*([^*]+)\*\*\s+([\s\S]*)/);
      if (!m) return;
      const id = `architecture-principle:${i + 1}`;
      store.upsertNode({
        id,
        type: SEMANTIC_NODE_TYPES.ARCHITECTURE_PRINCIPLE,
        label: m[1].trim(),
        description: m[2].trim().replace(/\n+/g, ' '),
        confidence: 'confirmed',
        source: 'HUI_CONSTITUTION.md §IV',
      });
    });
  }

  // Layer invariants
  const layerModel = content.match(/### Schichtenmodell[\s\S]*?```([\s\S]*?)```/);
  if (layerModel) {
    store.upsertNode({
      id: 'invariant:unidirectional-dataflow',
      type: SEMANTIC_NODE_TYPES.INVARIANT,
      label: 'Unidirektionaler Datenfluss',
      description: 'Constitution → Registry → Core Engine → Resonance → Engines → UI. Nie umgekehrt.',
      confidence: 'confirmed',
      source: 'HUI_CONSTITUTION.md §IV',
    });
    store.upsertNode({
      id: 'invariant:no-ui-impact-logic',
      type: SEMANTIC_NODE_TYPES.INVARIANT,
      label: 'Keine UI-Wirkungslogik',
      description: 'Keine UI-Komponente besitzt eigene Wirkungslogik.',
      confidence: 'confirmed',
      source: 'HUI_CONSTITUTION.md §IV',
    });
    store.upsertNode({
      id: 'invariant:registry-single-meaning',
      type: SEMANTIC_NODE_TYPES.INVARIANT,
      label: 'Registry ist Single Source of Meaning',
      description: 'Kein Text wird doppelt definiert.',
      confidence: 'confirmed',
      source: 'HUI_CONSTITUTION.md §IV',
    });
  }

  // Design / Human Principles
  const designSection = content.match(/## V\. Designprinzipien\s+([\s\S]*?)(?=\n---|\n## VI\.)/);
  if (designSection) {
    const props = designSection[1].match(/\| \*\*([^*]+)\*\* \| ([^|]+) \|/g) || [];
    props.forEach(row => {
      const m = row.match(/\| \*\*([^*]+)\*\* \| ([^|]+) \|/);
      if (!m) return;
      const key = m[1].trim().toLowerCase();
      store.upsertNode({
        id: `human-principle:${key}`,
        type: SEMANTIC_NODE_TYPES.HUMAN_PRINCIPLE,
        label: m[1].trim(),
        description: m[2].trim(),
        confidence: 'confirmed',
        source: 'HUI_CONSTITUTION.md §V',
      });
    });
  }

  // Orb Behaviour
  store.upsertNode({
    id: 'behaviour:orb',
    type: SEMANTIC_NODE_TYPES.ORB_BEHAVIOUR,
    label: 'Orb Verhalten',
    description: 'Stilles organisches Symbol — keine Gamification, kein Leistungsindikator, langsame organische Entwicklung.',
    confidence: 'confirmed',
    source: 'HUI_CONSTITUTION.md §VI',
  });

  // AI / Discovery principles → behaviours
  const aiSection = content.match(/## VII\. KI-Prinzipien\s+([\s\S]*?)(?=\n---|\n## VIII\.)/);
  if (aiSection) {
    store.upsertNode({
      id: 'behaviour:discovery',
      type: SEMANTIC_NODE_TYPES.DISCOVERY_BEHAVIOUR,
      label: 'Discovery Verhalten',
      description: 'KI verbindet Menschen deren Wirkung sich ergänzt — nicht Popularität.',
      confidence: 'confirmed',
      source: 'HUI_CONSTITUTION.md §VII',
    });
  }

  // Platform Goals from pillars table
  const pillarsSection = content.match(/## II\. Die fünf unveränderlichen Grundpfeiler\s+([\s\S]*?)(?=\n---|\n## III\.)/);
  if (pillarsSection) {
    const rows = pillarsSection[1].match(/\| \d+ \| [^|]+ \*\*([^*]+)\*\* \| ([^|]+) \|/g) || [];
    rows.forEach(row => {
      const m = row.match(/\*\*([^*]+)\*\* \| ([^|]+)/);
      if (!m) return;
      const key = m[1].trim().toLowerCase().replace(/\s+/g, '-');
      store.upsertNode({
        id: `platform-goal:${key}`,
        type: SEMANTIC_NODE_TYPES.PLATFORM_GOAL,
        label: m[1].trim(),
        description: m[2].trim(),
        confidence: 'confirmed',
        source: 'HUI_CONSTITUTION.md §II',
      });
      store.upsertNode({
        id: `value:${key}`,
        type: SEMANTIC_NODE_TYPES.VALUE,
        label: m[1].trim(),
        description: m[2].trim(),
        confidence: 'confirmed',
        source: 'HUI_CONSTITUTION.md §II',
      });
    });
  }

  // Decision rules → Policy nodes
  const decisionSection = content.match(/## IX\. Entscheidungsregel\s+([\s\S]*?)(?=\n---|\n## X\.)/);
  if (decisionSection) {
    const questions = decisionSection[1].match(/### Frage \d+ — ([^\n]+)\s+>\s+([^\n]+)/g) || [];
    questions.forEach((q, i) => {
      const m = q.match(/### Frage \d+ — ([^\n]+)\s+>\s+([^\n]+)/);
      if (!m) return;
      store.upsertNode({
        id: `policy:decision-${i + 1}`,
        type: SEMANTIC_NODE_TYPES.POLICY,
        label: `Entscheidungsregel: ${m[1].trim()}`,
        description: m[2].trim(),
        confidence: 'confirmed',
        source: 'HUI_CONSTITUTION.md §IX',
      });
    });
  }

  // Quality attributes from design
  for (const qa of ['Vertrauen', 'Resonanz', 'Wirkung', 'Bestand', 'Menschlichkeit']) {
    store.upsertNode({
      id: `quality:${qa.toLowerCase()}`,
      type: SEMANTIC_NODE_TYPES.QUALITY_ATTRIBUTE,
      label: qa,
      description: `Qualitätsmerkmal abgeleitet aus Constitution Design- und Mission-Prinzipien.`,
      confidence: 'inferred',
      source: 'HUI_CONSTITUTION.md (inferred)',
    });
  }

  // Anti-patterns from forbidden list
  const forbidden = content.match(/### Was niemals umgesetzt wird:([\s\S]*?)(?=\n---|\n## )/);
  if (forbidden) {
    const items = forbidden[1].match(/- ([^\n]+)/g) || [];
    items.forEach((item, i) => {
      const text = item.replace(/^- /, '').trim();
      store.upsertNode({
        id: `anti-pattern:${i + 1}`,
        type: SEMANTIC_NODE_TYPES.ANTI_PATTERN,
        label: text.slice(0, 60),
        description: text,
        confidence: 'confirmed',
        source: 'HUI_CONSTITUTION.md §V',
      });
    });
  }

  // ADR reference from routes
  store.upsertNode({
    id: 'decision:adr-001',
    type: SEMANTIC_NODE_TYPES.DECISION,
    label: 'ADR-001: Route Authority',
    description: 'Zentrale Route Registry im Shadow Mode — dokumentiert in src/routes/registry.js',
    confidence: 'confirmed',
    source: 'src/routes/registry.js header',
  });

  return store;
}

/** Link constitution rules to architecture layers and domains */
export function linkConstitutionProtection(store) {
  const layers = ['REGISTRY', 'CORE', 'SERVICES', 'SYSTEM', 'FEATURES', 'COMPONENTS'];
  const constitutionRules = store.getNodesByType(SEMANTIC_NODE_TYPES.CONSTITUTION_PRINCIPLE);

  for (const layer of layers) {
    const layerId = `domain:${layer}`;
    if (!store.getNode(layerId)) continue;
    for (const rule of constitutionRules) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.PROTECTS,
        source: rule.id,
        target: layerId,
        confidence: 'inferred',
        sourceRef: 'constitution→layer chain',
      });
    }
  }
}
