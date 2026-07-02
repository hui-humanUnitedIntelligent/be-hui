// src/architecture/semantic/explainEngine.js
// Natural-language explain engine for architecture questions.

import { createQueryApi } from './queryApi.js';
import { SEMANTIC_NODE_TYPES } from '../graph/schema.js';

/**
 * @param {import('../graph/graphStore.js').GraphStore} store
 */
export function createExplainEngine(store) {
  const api = createQueryApi(store);

  return {
    /** Answer structured questions */
    ask(question) {
      const q = question.toLowerCase();

      if (/warum existiert (\w+)/i.test(question)) {
        const m = question.match(/warum existiert (\S+)/i);
        return formatWhy(api.whyDoesThisExist(m[1]));
      }

      if (/welche constitution.*schützen (\w+)/i.test(question)) {
        const m = question.match(/schützen (\w+)/i);
        return formatProtects(api.whatProtects(m[1]));
      }

      if (/welche features.*unterstützen (\w+)/i.test(question)) {
        const m = question.match(/unterstützen (\w+)/i);
        return formatFeaturesForCapability(store, m[1]);
      }

      if (/welche komponenten.*unterstützen (\w+)/i.test(question)) {
        const m = question.match(/unterstützen (\w+)/i);
        return formatComponentsForCapability(store, m[1]);
      }

      if (/welche capabilities.*realisiert (\w+)/i.test(question)) {
        const m = question.match(/realisiert (\w+)/i);
        return formatServiceCapabilities(store, m[1]);
      }

      if (/welche architekturentscheidung.*(\S+\.\w+)/i.test(question)) {
        const m = question.match(/(\S+\.\w+)/);
        return formatDecisionTrace(store, m[1]);
      }

      if (/dateien.*ausschließlich.*impact/i.test(q)) {
        return formatImpactOnlyFiles(store);
      }

      return { answer: 'Frage nicht erkannt. Verfügbare Methoden: explainNode, whyDoesThisExist, whatProtects, getWhy.', question };
    },

    explainNode: api.explainNode,
    explainFeature: api.explainFeature,
    whyDoesThisExist: api.whyDoesThisExist,
    whatProtects: api.whatProtects,
    whatWouldBreak: api.whatWouldBreak,
    getWhy: api.getWhy,
    getMeaning: api.getMeaning,
  };
}

function formatWhy(result) {
  if (result.error) return { answer: result.error };
  return {
    answer: `${result.subject.label} existiert, weil: ${result.existsBecause}. Realisiert: ${result.realizesCapabilities.join(', ') || '—'}. Confidence: ${result.confidence}.`,
    ...result,
  };
}

function formatProtects(result) {
  if (result.error) return { answer: result.error };
  const names = result.protectors.map(p => `${p.node.label} (${p.confidence})`);
  return {
    answer: `${result.target.label} wird geschützt von: ${names.join(', ') || 'keine expliziten Regeln gefunden'}.`,
    ...result,
  };
}

function formatFeaturesForCapability(store, capName) {
  const capId = `capability:${capName.toLowerCase()}`;
  const cap = store.getNode(capId);
  if (!cap) return { answer: `Capability ${capName} nicht gefunden.` };

  const realizers = store.getNeighbors(capId, ['REALIZES', 'IMPLEMENTS', 'ENABLES'], 'in');
  const features = realizers
    .map(r => r.node)
    .filter(n => n.type === SEMANTIC_NODE_TYPES.FEATURE || n.type === 'File');

  return {
    answer: `Features/Komponenten für ${cap.label}: ${features.map(f => f.label).join(', ') || '—'}.`,
    features,
  };
}

function formatComponentsForCapability(store, concept) {
  const capId = `capability:${concept.toLowerCase()}`;
  const signalId = `signal:${concept.toLowerCase()}`;
  const target = store.getNode(capId) || store.getNode(signalId);
  if (!target) return { answer: `${concept} nicht im Graph gefunden.` };

  const components = store.getNeighbors(target.id, 'REALIZES', 'in')
    .filter(n => n.node.type === 'Component' || n.node.type === 'File');

  return {
    answer: `Komponenten für ${target.label}: ${components.map(c => c.node.label).join(', ') || '—'}.`,
    components: components.map(c => c.node),
  };
}

function formatServiceCapabilities(store, serviceName) {
  const matches = [...store.nodes.values()].filter(n =>
    n.label?.toLowerCase().includes(serviceName.toLowerCase())
    || n.meta?.path?.toLowerCase().includes(serviceName.toLowerCase()),
  );

  if (matches.length === 0) return { answer: `Service ${serviceName} nicht gefunden.` };

  const caps = matches.flatMap(m =>
    store.getNeighbors(m.id, 'REALIZES', 'out').map(c => c.node.label),
  );

  return {
    answer: `${serviceName} realisiert Capabilities: ${[...new Set(caps)].join(', ') || '—'}.`,
    capabilities: caps,
  };
}

function formatDecisionTrace(store, fileName) {
  const file = [...store.nodes.values()].find(n =>
    n.meta?.path?.endsWith(fileName) || n.label === fileName,
  );
  if (!file) return { answer: `Datei ${fileName} nicht gefunden.` };

  const decisions = store.getNeighbors(file.id, ['JUSTIFIED_BY', 'DERIVED_FROM', 'GOVERNS'], 'in');
  return {
    answer: `Architektur-Kontext für ${fileName}: ${decisions.map(d => d.node.label).join(' → ') || '—'}.`,
    trace: decisions.map(d => d.node),
  };
}

function formatImpactOnlyFiles(store) {
  const impactCap = store.getNode('capability:impact');
  if (!impactCap) return { answer: 'Impact Capability nicht gefunden.' };

  const impactFiles = store.getNeighbors(impactCap.id, 'REALIZES', 'in')
    .map(n => n.node)
    .filter(n => n.type === 'File');

  const exclusive = impactFiles.filter(f => {
    const otherCaps = store.getNeighbors(f.id, 'REALIZES', 'out')
      .filter(c => c.node.id !== impactCap.id);
    return otherCaps.length === 0;
  });

  return {
    answer: `Dateien ausschließlich für Impact: ${exclusive.map(f => f.meta?.path || f.label).join(', ') || 'keine exklusiven Dateien (inferred)'}.`,
    files: exclusive,
  };
}
