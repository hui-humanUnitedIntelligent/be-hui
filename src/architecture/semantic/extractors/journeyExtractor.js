// src/architecture/semantic/extractors/journeyExtractor.js

import { readFileSync } from 'fs';
import { SEMANTIC_NODE_TYPES, SEMANTIC_EDGE_TYPES } from '../../graph/schema.js';
import { capId } from './capabilityExtractor.js';

/**
 * @param {string} journeyContextPath
 * @param {import('../../graph/graphStore.js').GraphStore} store
 */
export function extractJourneys(journeyContextPath, store) {
  let content = '';
  try { content = readFileSync(journeyContextPath, 'utf8'); } catch { /* optional */ }

  // From journeyContext JOURNEY_STAGES
  const stagesBlock = content.match(/export const JOURNEY_STAGES = \{([\s\S]*?)\};/);
  const stages = [];
  if (stagesBlock) {
    const stageRe = /(\w+):\s*\{\s*label:\s*"([^"]+)"/g;
    let m;
    while ((m = stageRe.exec(stagesBlock[1])) !== null) {
      stages.push({ key: m[1], label: m[2] });
    }
  }

  // Primary creator journey
  const creatorJourneyId = 'journey:creator-onboarding';
  store.upsertNode({
    id: creatorJourneyId,
    type: SEMANTIC_NODE_TYPES.USER_JOURNEY,
    label: 'Creator Onboarding → Wirkung',
    description: 'Onboarding → Profil → Wirker → Werk → Buchung → Chat → Bezahlung → Bewertung → Impact',
    confidence: 'inferred',
    source: 'journeyContext + action flow (inferred)',
  });

  const creatorSteps = [
    { id: 'step:onboarding', label: 'Onboarding', cap: 'Authentication' },
    { id: 'step:profile-create', label: 'Profil erstellen', cap: 'Profile' },
    { id: 'step:become-wirker', label: 'Wirker werden', cap: 'Identity' },
    { id: 'step:publish-work', label: 'Werk veröffentlichen', cap: 'Works' },
    { id: 'step:receive-booking', label: 'Buchung erhalten', cap: 'Booking' },
    { id: 'step:chat', label: 'Chat', cap: 'Messaging' },
    { id: 'step:payment', label: 'Bezahlung', cap: 'Payments' },
    { id: 'step:rating', label: 'Bewertung', cap: 'Trust' },
    { id: 'step:impact', label: 'Impact', cap: 'Impact' },
  ];

  let prevStep = creatorJourneyId;
  for (const step of creatorSteps) {
    store.upsertNode({
      id: step.id,
      type: SEMANTIC_NODE_TYPES.BUSINESS_PROCESS,
      label: step.label,
      confidence: 'inferred',
      source: 'ARCH-002.1 journey model',
    });
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.ENABLES,
      source: prevStep,
      target: step.id,
      confidence: 'inferred',
    });
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.REQUIRES,
      source: step.id,
      target: capId(step.cap),
      confidence: 'inferred',
      sourceRef: 'journey→capability',
    });
    prevStep = step.id;
  }

  // Discovery journey
  const discoveryJourneyId = 'journey:discovery-to-resonance';
  store.upsertNode({
    id: discoveryJourneyId,
    type: SEMANTIC_NODE_TYPES.USER_JOURNEY,
    label: 'Feed → Resonanz',
    description: 'Feed → Story → Profil → Werk → Kauf → Community → Resonanz',
    confidence: 'inferred',
    source: 'ARCH-002.1 journey model',
  });

  const discoverySteps = [
    { id: 'step:feed', label: 'Feed', cap: 'Feed' },
    { id: 'step:story', label: 'Story', cap: 'Stories' },
    { id: 'step:visit-profile', label: 'Profil', cap: 'Profile' },
    { id: 'step:view-work', label: 'Werk', cap: 'Works' },
    { id: 'step:purchase', label: 'Kauf', cap: 'Commerce' },
    { id: 'step:community', label: 'Community', cap: 'Community' },
    { id: 'step:resonance', label: 'Resonanz', cap: 'Impact' },
  ];

  prevStep = discoveryJourneyId;
  for (const step of discoverySteps) {
    if (!store.getNode(step.id)) {
      store.upsertNode({
        id: step.id,
        type: SEMANTIC_NODE_TYPES.BUSINESS_PROCESS,
        label: step.label,
        confidence: 'inferred',
        source: 'ARCH-002.1 journey model',
      });
    }
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.ENABLES,
      source: prevStep,
      target: step.id,
      confidence: 'inferred',
    });
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.REQUIRES,
      source: step.id,
      target: capId(step.cap),
      confidence: 'inferred',
    });
    prevStep = step.id;
  }

  // Journey stages from code
  if (stages.length > 0) {
    const codeJourneyId = 'journey:creator-stages';
    store.upsertNode({
      id: codeJourneyId,
      type: SEMANTIC_NODE_TYPES.USER_JOURNEY,
      label: 'Creator Journey Stages (Code)',
      description: 'Aus journeyContext.js JOURNEY_STAGES extrahiert',
      confidence: 'confirmed',
      source: 'journeyContext.js',
    });
    let prev = codeJourneyId;
    for (const stage of stages) {
      const sid = `journey-stage:${stage.key}`;
      store.upsertNode({
        id: sid,
        type: SEMANTIC_NODE_TYPES.BUSINESS_PROCESS,
        label: stage.label,
        confidence: 'confirmed',
        source: 'journeyContext.js',
        meta: { stageKey: stage.key },
      });
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.ENABLES,
        source: prev,
        target: sid,
        confidence: 'confirmed',
      });
      prev = sid;
    }
  }

  // Behaviour nodes from module comments
  const behaviours = [
    { file: 'bookingContext.js', type: SEMANTIC_NODE_TYPES.COMMERCE_BEHAVIOUR, id: 'behaviour:commerce', cap: 'Booking' },
    { file: 'chatContext.js', type: SEMANTIC_NODE_TYPES.SOCIAL_BEHAVIOUR, id: 'behaviour:social', cap: 'Messaging' },
    { file: 'trustContext.js', type: SEMANTIC_NODE_TYPES.TRUST_SIGNAL, id: 'behaviour:trust-context', cap: 'Trust' },
    { file: 'orbEngine.js', type: SEMANTIC_NODE_TYPES.ORB_BEHAVIOUR, id: 'behaviour:orb-engine', cap: 'Orb' },
    { file: 'resonanceEngine.js', type: SEMANTIC_NODE_TYPES.IMPACT_BEHAVIOUR, id: 'behaviour:impact-engine', cap: 'Impact' },
  ];

  for (const b of behaviours) {
    store.upsertNode({
      id: b.id,
      type: b.type,
      label: b.file.replace('.js', ''),
      confidence: 'inferred',
      source: `src/**/${b.file}`,
    });
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.EXPRESSES,
      source: b.id,
      target: capId(b.cap),
      confidence: 'inferred',
    });
  }

  return store;
}
