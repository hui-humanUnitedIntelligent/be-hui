// src/lib/workers/graphWorker.js
// HUI — Graph Background Worker — Phase 6A.4
// ═══════════════════════════════════════════════════════════════
//
// PROBLEM GELÖST:
// Graph-Berechnungen (detectSoftClusters, creatorBridgeScore,
// relevanceScore für 60 Creators) blockierten den Main Thread
// für 50-200ms → sichtbarer Jank auf Mobile.
//
// LÖSUNG:
// Web Worker — läuft in separatem Thread.
// Main Thread bleibt frei für UI-Rendering.
//
// PROTOCOL:
//   { type: 'ENRICH_CREATORS', payload: { creators, userProfile, moodKey } }
//   → { type: 'ENRICHED', payload: { creators, bridges } }
//
//   { type: 'RUN_PIPELINE_STAGE', payload: { stage, items, context } }
//   → { type: 'STAGE_DONE', payload: { items, audit } }
//
// SICHERHEIT:
//   Worker hat KEINEN Zugriff auf: DOM, supabase, localStorage.
//   Nur pure Berechnungen auf übergebenen Daten.
// ═══════════════════════════════════════════════════════════════

/* eslint-disable no-restricted-globals */

// ── Inline: Graph-Funktionen (kopiert, kein Import möglich in Worker) ──

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function cosineSim(setA, setB) {
  if (!setA?.length || !setB?.length) return 0;
  const a = new Set(setA.map(s => String(s).toLowerCase().trim()));
  const b = new Set(setB.map(s => String(s).toLowerCase().trim()));
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

const MOOD_CLUSTERS = {
  kreativ:       ['kreativ','schöpferisch','handwerk','gestaltung','design','kunst'],
  ruhig:         ['ruhig','kontemplativ','still','minimal','meditativ','fokus'],
  warm:          ['warm','herzlich','menschlich','verbindung','gemeinschaft','empathie'],
  professionell: ['professionell','präzise','qualität','handwerk','zuverlässig'],
  authentisch:   ['authentisch','ehrlich','echt','persönlich','direkt','transparent'],
  inspirierend:  ['inspirierend','vision','energie','möglichkeiten','wachstum','mut'],
  nachhaltig:    ['nachhaltig','bewusst','ökologisch','verantwortung','regional'],
};

const MOOD_AFFINITY = {
  kreativ:       ['inspirierend','authentisch','warm'],
  ruhig:         ['authentisch','nachhaltig','warm'],
  warm:          ['authentisch','inspirierend','ruhig'],
  professionell: ['authentisch','kreativ','nachhaltig'],
  authentisch:   ['warm','ruhig','kreativ','professionell','nachhaltig'],
  inspirierend:  ['kreativ','warm','authentisch'],
  nachhaltig:    ['ruhig','authentisch','warm'],
};

function communityAffinityWorker(creator) {
  if (!creator) return {};
  const text = [creator.bio || '', creator.talent || '',
    ...(creator.dna_tags || []), creator.mood || ''].join(' ').toLowerCase();
  const affinities = {};
  for (const [cluster, keywords] of Object.entries(MOOD_CLUSTERS)) {
    const match = keywords.filter(k => text.includes(k)).length / keywords.length;
    const moodMatch = (creator.mood || '').toLowerCase() === cluster ? 0.4 : 0;
    const score = clamp(match * 0.5 + moodMatch);
    if (score > 0.05) affinities[cluster] = Math.round(score * 100) / 100;
  }
  if (creator.location_label) affinities[`lokal:${creator.location_label}`] = 1.0;
  return affinities;
}

function bridgeScoreWorker(creator, clusters) {
  if (!creator) return 0;
  const strong = Object.entries(clusters).filter(([k,v]) => v > 0.3 && !k.startsWith('lokal:'));
  const diversity = clamp(strong.length / 4);
  return clamp(diversity * 0.7);  // Vereinfacht ohne Verbindungsnetz
}

function moodSimWorker(moodA, moodB) {
  if (!moodA || !moodB) return 0.3;
  if (moodA === moodB) return 0.8;
  if (MOOD_AFFINITY[moodA]?.includes(moodB)) return 0.9;
  return 0.2;
}

function relevanceScoreWorker(item, opts = {}) {
  const { mood, userProfile } = opts;
  let score = 0;

  // Trust (30%)
  const trust = clamp(((item.total_bookings_completed || 0) / 50) * 0.6 +
    ((item.response_rate || 0) / 100) * 0.2 + (item.is_verified ? 0.2 : 0));
  score += trust * 0.30;

  // Mood Fit (25%)
  const moodFit = moodSimWorker(
    (mood || '').toLowerCase(),
    (item.mood || '').toLowerCase()
  );
  score += moodFit * 0.25;

  // Tag Similarity (20%)
  const tagSim = cosineSim(
    userProfile?.dna_tags || [],
    item.dna_tags || []
  );
  score += tagSim * 0.20;

  // Freshness (15%)
  const daysSince = item.updated_at
    ? (Date.now() - new Date(item.updated_at).getTime()) / 86400000 : 30;
  const freshness = Math.exp(-daysSince / 14) * 0.8 + 0.1;
  score += freshness * 0.15;

  // Availability (10%)
  if (item.is_available) score += 0.10;

  return clamp(score);
}

// ── Worker Message Handler ─────────────────────────────────────
self.onmessage = function(e) {
  const { type, payload, id } = e.data;

  try {
    if (type === 'ENRICH_CREATORS') {
      const { creators = [], userProfile, moodKey } = payload;
      const t0 = performance.now();

      const enriched = creators.map(creator => {
        const clusters    = communityAffinityWorker(creator);
        const bridgeScore = bridgeScoreWorker(creator, clusters);
        const relScore    = relevanceScoreWorker(creator, {
          mood: moodKey, userProfile
        });

        return {
          ...creator,
          _clusters:    clusters,
          _bridgeScore: bridgeScore,
          _relScore:    relScore,
        };
      });

      const bridges = enriched
        .filter(c => c._bridgeScore > 0.35)
        .sort((a, b) => b._bridgeScore - a._bridgeScore)
        .slice(0, 6);

      self.postMessage({
        type: 'ENRICHED',
        id,
        payload: {
          creators: enriched,
          bridges,
          timing:   Math.round(performance.now() - t0),
        },
      });
    }

    else if (type === 'SCORE_ITEMS') {
      const { items = [], userProfile, moodKey } = payload;
      const t0 = performance.now();

      const scored = items.map(item => ({
        ...item,
        _workerScore: relevanceScoreWorker(item, { mood: moodKey, userProfile }),
      })).sort((a, b) => b._workerScore - a._workerScore);

      self.postMessage({
        type: 'SCORED',
        id,
        payload: { items: scored, timing: Math.round(performance.now() - t0) },
      });
    }

    else if (type === 'PING') {
      self.postMessage({ type: 'PONG', id });
    }

  } catch (err) {
    self.postMessage({ type: 'ERROR', id, payload: { message: err?.message } });
  }
};
