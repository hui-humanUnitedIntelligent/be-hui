// src/lib/discovery/index.js
// HUI — Discovery Engine V1 — Phase 5C.2
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Keine Black-Box-KI. Kein ML. Keine Dopamin-Optimierung.
// Stattdessen: gewichtete menschliche Relevanz.
//
// ZIEL:
// Menschen verbinden die kreativ resonieren — nicht viral sein.
// Qualität über Lautstärke. Vertrauen über Zahlen.
//
// ARCHITEKTUR:
// Alle Scoring-Funktionen sind PURE FUNCTIONS.
// Testbar, transparent, erklärbar.
//
// GEWICHTUNG (V1):
//   Vertrauen    40%  (Empfehlungen, Abschlüsse, Verifizierung)
//   Kreative Fit 30%  (DNA-Tags, Focus-Type, Mood)
//   Soziale Nähe 18%  (gemeinsame Follows, Kollaborationen)
//   Frische      12%  (Recency, Velocity, Verfügbarkeit)
// ═══════════════════════════════════════════════════════════════

// ── Konstanten ─────────────────────────────────────────────────

/** Wie weit zurück gilt etwas als "frisch"? (Millisekunden) */
const FRESHNESS_WINDOW = {
  hot:    3  * 24 * 60 * 60 * 1000,  //  3 Tage
  recent: 14 * 24 * 60 * 60 * 1000,  // 14 Tage
  warm:   60 * 24 * 60 * 60 * 1000,  // 60 Tage
};

/** Mood-Cluster: verwandte Stimmungen und ihre Überlappung */
const MOOD_CLUSTERS = {
  kreativ:        ['kreativ', 'schöpferisch', 'handwerk', 'gestaltung', 'design', 'kunst'],
  ruhig:          ['ruhig', 'kontemplativ', 'still', 'minimal', 'meditativ', 'fokus'],
  warm:           ['warm', 'herzlich', 'menschlich', 'verbindung', 'gemeinschaft', 'fürsorge'],
  professionell:  ['professionell', 'präzise', 'qualität', 'handwerk', 'erfahren', 'zuverlässig'],
  authentisch:    ['authentisch', 'ehrlich', 'echt', 'persönlich', 'unverfälscht', 'direkt'],
  inspirierend:   ['inspirierend', 'vision', 'energie', 'möglichkeiten', 'wachstum', 'mut'],
  abenteuerlich:  ['abenteuer', 'natur', 'outdoor', 'erlebnis', 'entdecken', 'reisen'],
  nachhaltig:     ['nachhaltig', 'bewusst', 'ökologisch', 'verantwortung', 'zukunft', 'regional'],
};

/** Verwandte Cluster-Paare (ergänzen sich statt zu überlappen) */
const MOOD_AFFINITY = {
  kreativ:       ['inspirierend', 'authentisch', 'warm'],
  ruhig:         ['kontemplativ', 'authentisch', 'nachhaltig'],
  warm:          ['authentisch', 'inspirierend', 'ruhig'],
  professionell: ['authentisch', 'kreativ', 'nachhaltig'],
  authentisch:   ['warm', 'ruhig', 'kreativ'],
  inspirierend:  ['kreativ', 'warm', 'abenteuerlich'],
  abenteuerlich: ['inspirierend', 'nachhaltig', 'kreativ'],
  nachhaltig:    ['ruhig', 'authentisch', 'warm'],
};

/** Max-Werte für Normalisierung */
const MAX_BOOKINGS     = 50;
const MAX_RECS         = 20;
const MAX_FOLLOWS      = 500;

// ── Helper ─────────────────────────────────────────────────────

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function cosineSimilarity(tagsA, tagsB) {
  if (!tagsA?.length || !tagsB?.length) return 0;
  const setA = new Set(tagsA.map(t => t.toLowerCase().trim()));
  const setB = new Set(tagsB.map(t => t.toLowerCase().trim()));
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

function textIncludes(text, keywords) {
  if (!text) return 0;
  const t = text.toLowerCase();
  return keywords.filter(k => t.includes(k)).length / keywords.length;
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

// ── 5C.2.1 — FRESHNESS WEIGHT ──────────────────────────────────
/**
 * Berechnet Frische-Score (0–1).
 * Exponentiell fallend — sehr alte Inhalte bekommen Minimum, nicht 0.
 * Minimum 0.05 — alte Qualitäts-Inhalte verschwinden nicht komplett.
 */
export function freshnessWeight(createdAt, updatedAt) {
  const refDate = updatedAt || createdAt;
  const age = daysSince(refDate);

  if (age <= 3)  return 1.0;
  if (age <= 14) return 0.85;
  if (age <= 30) return 0.65;
  if (age <= 60) return 0.45;
  if (age <= 180) return 0.25;
  return 0.10;  // Alt aber nie 0 — Qualität verblasst langsam
}

// ── 5C.2.2 — TRUST WEIGHT ─────────────────────────────────────
/**
 * Vertrauens-Score eines Creators (0–1).
 * Inputs: Empfehlungen, Buchungsabschlüsse, Verifikation, Response-Rate.
 * Kein einzelner Faktor dominiert — composite.
 */
export function trustWeight(creator) {
  if (!creator) return 0;

  const recScore = clamp((creator.recommendation_count || 0) / MAX_RECS);
  const bookScore = clamp((creator.total_bookings_completed || 0) / MAX_BOOKINGS);
  const verifiedBonus = creator.is_verified ? 0.2 : 0;
  const responseScore = clamp((creator.response_rate || 0) / 100) * 0.15;
  const repeatBonus   = creator.has_repeat_client ? 0.1 : 0;

  // Composite: Empfehlungen am wichtigsten (verifiziert nach Buchung)
  const raw = (
    recScore   * 0.40 +
    bookScore  * 0.25 +
    verifiedBonus     +
    responseScore     +
    repeatBonus
  );

  return clamp(raw);
}

// ── 5C.2.3 — MOOD SIMILARITY ──────────────────────────────────
/**
 * Wie gut passt ein Creator/Item zum gewählten Mood?
 * Arbeitet auf Mood-Cluster — nicht nur exakter String-Match.
 */
export function moodSimilarity(item, targetMood) {
  if (!targetMood) return 0.5;  // kein Mood → neutral

  const targetCluster = MOOD_CLUSTERS[targetMood] || [targetMood];
  const itemMoods = [
    item.mood,
    ...(item.dna_tags || []),
    item.talent,
    item.bio,
    item.title,
    item.description,
    item.caption,
  ].filter(Boolean).join(' ').toLowerCase();

  // Direkter Cluster-Match
  const directMatch = textIncludes(itemMoods, targetCluster);

  // Affinity-Match (verwandte Moods ergänzen)
  const affineModels = MOOD_AFFINITY[targetMood] || [];
  const affineClusters = affineModels.flatMap(m => MOOD_CLUSTERS[m] || [m]);
  const affineMatch = textIncludes(itemMoods, affineClusters) * 0.4;

  return clamp(directMatch + affineMatch);
}

// ── 5C.2.4 — CREATIVE DISTANCE ────────────────────────────────
/**
 * Kreative Ergänzung (nicht Gleichheit).
 * Optimal: ähnlicher Stil, aber andere Nische → maximale kreative Bereicherung.
 * Zu gleich → Bubble. Zu verschieden → keine Resonanz.
 */
export function creativeDistance(creatorA, creatorB) {
  if (!creatorA || !creatorB) return 0.5;

  const tagsA = creatorA.dna_tags || [];
  const tagsB = creatorB.dna_tags || [];

  const similarity = cosineSimilarity(tagsA, tagsB);
  const focusSame  = creatorA.focus_type === creatorB.focus_type ? 0.1 : 0;
  const talentSame = creatorA.talent === creatorB.talent ? -0.05 : 0.05; // leichte Verschiedenheit = gut

  // Goldene Mitte: ~40-60% Überlappung ist ideal
  // Zu gleich (>80%) oder zu verschieden (<20%) → niedrigerer Score
  const idealSimilarity = 1 - Math.abs(similarity - 0.5) * 2;

  return clamp(idealSimilarity + focusSame + talentSame);
}

// ── 5C.2.5 — SOCIAL CLOSENESS ─────────────────────────────────
/**
 * Soziale Nähe zwischen User und Creator.
 * Je näher im sozialen Graph, desto relevanter.
 * Berechnet auf Follow-Überlappungen.
 */
export function socialCloseness(userFollows, creatorFollowers) {
  if (!userFollows?.size || !creatorFollowers?.length) return 0;

  // Wie viele der Follows des Users folgen auch diesem Creator?
  const mutuals = creatorFollowers.filter(f => userFollows.has(f)).length;
  const ratio   = mutuals / Math.min(userFollows.size, 50);  // cap bei 50

  return clamp(ratio * 2);  // 25% Overlap → score 0.5
}

// ── 5C.2.6 — COLLABORATION AFFINITY ──────────────────────────
/**
 * Hat dieser Creator mit ähnlichen Creators kollaboriert?
 * Collaboration-History als Qualitätssignal.
 */
export function collaborationAffinity(creator, userContext) {
  if (!creator || !userContext) return 0;

  let score = 0;

  // Hat verifizierte Empfehlungen von Collaborations?
  if (creator.collaboration_count > 0)
    score += clamp(creator.collaboration_count / 5) * 0.4;

  // Ist in ähnlichen Netzwerken wie der User?
  if (creator.mutual_follows > 0)
    score += clamp(creator.mutual_follows / 3) * 0.3;

  // Hat positive Chat-Qualität (viele Booking-Chats)
  if (creator.booking_chat_count > 0)
    score += 0.15;

  // Repeat-Clients (tiefes Vertrauen)
  if (creator.has_repeat_client)
    score += 0.15;

  return clamp(score);
}

// ── 5C.2.7 — RELEVANCE SCORE (Haupt-Score) ───────────────────
/**
 * Haupt-Relevanz-Score für Discovery-Ranking.
 * Kombiniert alle Sub-Scores gewichtet.
 *
 * @param {Object} item         — Work, Creator, Experience oder Story
 * @param {Object} context      — { userFollows, mood, userProfile, userTags }
 * @param {Object} creator      — Creator-Profil des Items
 * @returns {number}            — Score 0–1
 */
export function relevanceScore(item, context = {}, creator = null) {
  const { mood, userFollows = new Set(), userProfile } = context;
  const c = creator || item;  // Falls item selbst ein Creator ist

  // ── Sub-Scores ──────────────────────────────────────────────
  const trust     = trustWeight(c);
  const moodFit   = moodSimilarity(item, mood);
  const fresh     = freshnessWeight(item.created_at, item.updated_at);
  const social    = socialCloseness(userFollows, c.followers || []);
  const collab    = collaborationAffinity(c, { userFollows });

  // Kreative Fit (User-Profil vs Creator-Profil)
  const creative  = userProfile
    ? creativeDistance(userProfile, c) * 0.5 + moodFit * 0.5
    : moodFit;

  // ── Gewichtete Kombination ───────────────────────────────────
  const raw = (
    trust    * 0.40 +   // Vertrauen: wichtigster Faktor
    creative * 0.30 +   // Kreative Relevanz
    social   * 0.18 +   // Soziale Nähe
    fresh    * 0.12     // Frische
  );

  // Bonus: verfügbar & buchbar
  const availableBonus = c.is_available ? 0.04 : 0;

  // Bonus: verifiziert (darf nicht zu dominant werden)
  const verifiedBonus  = c.is_verified  ? 0.03 : 0;

  return clamp(raw + availableBonus + verifiedBonus);
}

// ── 5C.8 — DIVERSITY GUARD ────────────────────────────────────
/**
 * Stellt sicher dass kein Creator den Feed dominiert
 * und neue Creators fair Exposure bekommen.
 *
 * @param {Array} rankedItems    — bereits nach Score sortiert
 * @param {Object} opts
 * @param {number} opts.maxPerCreator    — max gleicher Creator (default: 2)
 * @param {number} opts.explorationRatio — Anteil neue/unbekannte Creators (default: 0.2)
 * @param {number} opts.freshCreatorDays — Neu = jünger als N Tage (default: 30)
 * @returns {Array} — diversifizierter Feed
 */
export function diversityGuard(rankedItems, opts = {}) {
  const {
    maxPerCreator    = 2,
    explorationRatio = 0.20,
    freshCreatorDays = 30,
  } = opts;

  const creatorCount  = {};
  const mainFeed      = [];
  const overflowItems = [];
  const explorations  = [];

  for (const item of rankedItems) {
    const creatorId = item.user_id || item.creator_id || item.id;
    const count     = creatorCount[creatorId] || 0;

    // Cold-Start: Neue Creators (frisch auf der Plattform)
    const isNewCreator = daysSince(item.creator_joined_at || item.created_at) < freshCreatorDays;

    if (isNewCreator && explorations.length < Math.ceil(rankedItems.length * explorationRatio)) {
      explorations.push(item);
      continue;
    }

    if (count < maxPerCreator) {
      creatorCount[creatorId] = count + 1;
      mainFeed.push(item);
    } else {
      overflowItems.push(item);  // Für Paginierung
    }
  }

  // Exploration-Items gleichmäßig in Feed einstreuen (jedes 5. Item)
  const result = [...mainFeed];
  const step   = Math.max(3, Math.floor(result.length / Math.max(explorations.length, 1)));
  explorations.forEach((item, i) => {
    const insertAt = Math.min((i + 1) * step, result.length);
    result.splice(insertAt, 0, item);
  });

  return result;
}

// ── 5C.8 — ANTI-REPETITION ────────────────────────────────────
/**
 * Verhindert dass derselbe Creator in kurzer Zeit mehrfach angezeigt wird.
 * Nutzt sessionStorage als leichten Client-Cache.
 */
export function antiRepetition(items, sessionKey = 'hui_seen_creators') {
  try {
    const seen = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
    const now  = Date.now();
    const WINDOW_MS = 4 * 60 * 60 * 1000;  // 4 Stunden

    // Cleanup expired
    for (const id of Object.keys(seen)) {
      if (now - seen[id] > WINDOW_MS) delete seen[id];
    }

    const result = items.filter(item => {
      const id = item.user_id || item.creator_id || item.id;
      return !seen[id];
    });

    // Update seen (nur neue die durchgekommen sind)
    result.slice(0, 10).forEach(item => {
      const id = item.user_id || item.creator_id || item.id;
      if (id) seen[id] = now;
    });

    sessionStorage.setItem(sessionKey, JSON.stringify(seen));
    return result.length > 3 ? result : items;  // Fallback: nie leeren Feed
  } catch (_) {
    return items;  // sessionStorage nicht verfügbar → ignorieren
  }
}

// ── 5C.5 — SEMANTIC TAG MATCHING ──────────────────────────────
/**
 * Fuzzy + Semantic Tag-Suche.
 * Findet Tags die ähnlich klingen oder im gleichen Cluster sind.
 */
export function semanticTagMatch(query, tags = []) {
  if (!query || !tags.length) return 0;
  const q = query.toLowerCase().trim();

  let maxScore = 0;

  for (const tag of tags) {
    const t = tag.toLowerCase().trim();
    if (t === q) { maxScore = Math.max(maxScore, 1.0); continue; }
    if (t.includes(q) || q.includes(t)) { maxScore = Math.max(maxScore, 0.8); continue; }

    // Cluster-Match
    for (const [cluster, keywords] of Object.entries(MOOD_CLUSTERS)) {
      if (keywords.includes(q) && keywords.includes(t)) {
        maxScore = Math.max(maxScore, 0.6); break;
      }
    }

    // Levenshtein-Approximation (Typo-Toleranz, max 1 Zeichen)
    if (Math.abs(t.length - q.length) <= 1) {
      let diff = 0;
      const len = Math.max(t.length, q.length);
      for (let i = 0; i < len; i++) {
        if (t[i] !== q[i]) diff++;
      }
      if (diff <= 1) maxScore = Math.max(maxScore, 0.7);
    }
  }

  return maxScore;
}

// ── 5C.4 — CREATOR AFFINITY ───────────────────────────────────
/**
 * „Warum passen diese zwei Menschen kreativ zusammen?"
 * Keine Follower-Zahlen. Kreative Kompatibilität.
 *
 * @param {Object} creatorA
 * @param {Object} creatorB
 * @returns {{ score: number, reasons: string[] }}
 */
export function creatorAffinity(creatorA, creatorB) {
  if (!creatorA || !creatorB) return { score: 0, reasons: [] };

  const reasons = [];
  let score     = 0;

  // 1. DNA-Tag-Überlappung (kreative Sprache)
  const tagSimilarity = cosineSimilarity(creatorA.dna_tags, creatorB.dna_tags);
  if (tagSimilarity > 0.3) {
    score += tagSimilarity * 0.35;
    reasons.push('ähnliche kreative Sprache');
  }

  // 2. Ergänzende Focus-Types (works+experiences = ideal)
  const focusComplement = (
    creatorA.focus_type !== creatorB.focus_type &&
    ['works','experiences','hybrid'].includes(creatorA.focus_type) &&
    ['works','experiences','hybrid'].includes(creatorB.focus_type)
  );
  if (focusComplement) {
    score += 0.20;
    reasons.push('ergänzende kreative Ausrichtung');
  }

  // 3. Mood-Affinität (verwandte aber nicht gleiche Stimmung)
  const moodA = (creatorA.mood || creatorA.primary_mood || '').toLowerCase();
  const moodB = (creatorB.mood || creatorB.primary_mood || '').toLowerCase();
  if (moodA && moodB) {
    const affineMoods = MOOD_AFFINITY[moodA] || [];
    if (affineMoods.includes(moodB)) {
      score += 0.20;
      reasons.push('resonante Stimmung');
    }
  }

  // 4. Trust-Parität (ähnlich vertrauenswürdig → gute Zusammenarbeit)
  const trustA = trustWeight(creatorA);
  const trustB = trustWeight(creatorB);
  const trustDiff = Math.abs(trustA - trustB);
  if (trustDiff < 0.3) {
    score += (1 - trustDiff) * 0.15;
    reasons.push('ähnliche Qualitätsstufe');
  }

  // 5. Verfügbarkeit (beide buchbar)
  if (creatorA.is_available && creatorB.is_available) {
    score += 0.05;
    reasons.push('beide kreativ aktiv');
  }

  // 6. Gegenseitige Empfehlungen (existierende Verbindung)
  if (creatorA.has_mutual_recommendation || creatorB.has_mutual_recommendation) {
    score += 0.05;
    reasons.push('verifizierte Verbindung');
  }

  return {
    score:   clamp(score),
    reasons: reasons.slice(0, 3),  // Max 3 Reasons anzeigen
  };
}

// ── 5C.3 — FEED RANKER ────────────────────────────────────────
/**
 * Vollständiger Feed-Ranking-Algorithmus.
 * Input: rohe Feed-Items + User-Kontext
 * Output: ranked + diversifizierter Feed
 *
 * Garantien:
 * - Kein Creator dominiert (maxPerCreator=2)
 * - Neue Creators bekommen Exposure (20% exploration)
 * - Frische Items werden leicht bevorzugt
 * - Mood wird berücksichtigt wenn gewählt
 * - Minimale Zufälligkeit (±2%) gegen Filter-Bubbles
 */
export function rankFeed(items, context = {}) {
  if (!Array.isArray(items) || !items.length) return [];

  const { mood, userFollows, userProfile, debugMode = false } = context;

  // 1. Score berechnen
  const scored = items.map(item => {
    if (!item) return null;
    const score = relevanceScore(item, { mood, userFollows, userProfile });

    // Minimale Zufälligkeit (±2%) — verhindert statische Reihenfolge
    const jitter = (Math.random() - 0.5) * 0.04;

    return { item, score: clamp(score + jitter), _debug: debugMode ? { score, mood } : undefined };
  }).filter(Boolean);

  // 2. Sortieren (höchster Score zuerst)
  scored.sort((a, b) => b.score - a.score);

  // 3. Diversity Guard anwenden
  const rawItems    = scored.map(s => s.item);
  const diversified = diversityGuard(rawItems, {
    maxPerCreator:    2,
    explorationRatio: 0.20,
  });

  return diversified;
}

// ── 5C.6 — STORY INTELLIGENCE ─────────────────────────────────
/**
 * Bewertet Story-Qualität basierend auf qualitativen Signalen.
 * Nicht Views — sondern Tiefe.
 */
export function storyQualityScore(story) {
  if (!story) return 0;
  let score = 0;

  // Hat Tags (kreative Selbstbeschreibung)
  if (story.tags?.length > 0)     score += 0.2;
  if (story.tags?.length > 2)     score += 0.1;

  // Hat Caption (narrative Tiefe)
  if (story.caption?.length > 10) score += 0.15;
  if (story.caption?.length > 50) score += 0.10;

  // Frische
  score += freshnessWeight(story.created_at) * 0.3;

  // Saves nach View (wenn erfasst)
  if (story.save_count > 0) score += clamp(story.save_count / 5) * 0.15;

  return clamp(score);
}

// ── 5C.8 — OBSERVABILITY ──────────────────────────────────────
/**
 * Analysiert Feed-Gesundheit.
 * Warnt vor: Popularity-Runaway, Creator-Starvation, Feed-Collapse.
 */
export function analyzeDiscoveryHealth(rankedFeed) {
  if (!rankedFeed?.length) return { healthy: false, issues: ['empty_feed'] };

  const issues   = [];
  const warnings = [];

  // Creator-Verteilung
  const creatorCounts = {};
  for (const item of rankedFeed) {
    const id = item.user_id || item.creator_id;
    if (id) creatorCounts[id] = (creatorCounts[id] || 0) + 1;
  }

  const counts       = Object.values(creatorCounts);
  const maxCount     = Math.max(...counts);
  const totalCreators = Object.keys(creatorCounts).length;
  const ratio        = totalCreators / rankedFeed.length;

  // Popularity Runaway: Ein Creator dominiert
  if (maxCount > rankedFeed.length * 0.3) {
    issues.push('popularity_runaway');
  }

  // Creator Starvation: Zu wenig verschiedene Creators
  if (ratio < 0.3) {
    warnings.push('low_creator_diversity');
  }

  // Feed Collapse: Zu wenige Items
  if (rankedFeed.length < 5) {
    issues.push('feed_collapse');
  }

  // Score-Verteilung: Sind alle Scores sehr ähnlich?
  const scores = rankedFeed.map(i => i._score || 0).filter(Boolean);
  if (scores.length > 5) {
    const avg = scores.reduce((a,b) => a+b,0) / scores.length;
    const variance = scores.reduce((a,b) => a + Math.pow(b-avg,2), 0) / scores.length;
    if (variance < 0.01) warnings.push('low_score_variance');
  }

  return {
    healthy:        issues.length === 0,
    issues,
    warnings,
    stats: {
      totalItems:     rankedFeed.length,
      uniqueCreators: totalCreators,
      diversityRatio: ratio.toFixed(2),
      topCreatorShare: (maxCount / rankedFeed.length).toFixed(2),
    },
  };
}
