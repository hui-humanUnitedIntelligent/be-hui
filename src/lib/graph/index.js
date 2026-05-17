// src/lib/graph/index.js
// HUI — Human Graph Engine V1 — Phase 5D
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Kein Follower-Graph. Kein Influencer-Ranking.
// HUI versteht kreative Resonanz zwischen Menschen.
//
// Das Netzwerk misst:
// — wie stark zwei Personen verbunden sind (relationshipStrength)
// — wie tief ihre Zusammenarbeit geht (collaborationDepth)
// — wie weit Vertrauen reicht (trustDistance)
// — wie wohl Menschen in einem Cluster fühlen (communityAffinity)
// — wer Brücken zwischen Welten baut (creatorBridgeScore)
//
// ALLE FUNKTIONEN: pure, testbar, erklärbar, auditierbar.
// KEINE Blackbox. KEINE Hidden Weights.
//
// GRAPH-STRUKTUR:
// Knoten = Creator (Profil)
// Kanten = Beziehung (gewichtet 0–1, gerichtet oder ungerichtet)
// Cluster = weiche Zugehörigkeit (0–1, mehrfach möglich)
// ═══════════════════════════════════════════════════════════════

// ── Kantengewichte — dokumentiert und transparent ──────────────
export const EDGE_WEIGHTS = {
  mutual_recommendation: 1.00,  // Höchste Qualität: beide haben sich empfohlen
  repeat_booking:        0.90,  // Wiederholtes Zusammenarbeiten
  completed_booking:     0.80,  // Abgeschlossene Transaktion + Vertrauen
  collaboration_chat:    0.75,  // Kreative Kollaboration
  recommendation_given:  0.65,  // Verifizierte Empfehlung
  repeat_chat:           0.55,  // Anhaltende Kommunikation
  mutual_follow:         0.45,  // Gegenseitiges Interesse
  booking_sent:          0.35,  // Aktive Anfrage
  chat_opened:           0.25,  // Erster Kontakt
  follow_one_way:        0.20,  // Passives Interesse
  profile_visit:         0.05,  // Schwaches Signal
};

// ── Cluster-Definitionen — weich, überlappend ─────────────────
const MOOD_CLUSTERS = {
  kreativ:       ['kreativ', 'schöpferisch', 'handwerk', 'gestaltung', 'design', 'kunst', 'illustration'],
  ruhig:         ['ruhig', 'kontemplativ', 'still', 'minimal', 'meditativ', 'fokus', 'besonnen'],
  warm:          ['warm', 'herzlich', 'menschlich', 'verbindung', 'gemeinschaft', 'fürsorge', 'empathie'],
  professionell: ['professionell', 'präzise', 'qualität', 'handwerk', 'erfahren', 'zuverlässig', 'kompetent'],
  authentisch:   ['authentisch', 'ehrlich', 'echt', 'persönlich', 'unverfälscht', 'direkt', 'transparent'],
  inspirierend:  ['inspirierend', 'vision', 'energie', 'möglichkeiten', 'wachstum', 'mut', 'aufbruch'],
  abenteuerlich: ['abenteuer', 'natur', 'outdoor', 'erlebnis', 'entdecken', 'reisen', 'exploration'],
  nachhaltig:    ['nachhaltig', 'bewusst', 'ökologisch', 'verantwortung', 'zukunft', 'regional', 'lokal'],
};

// Mood-Affinitäten: welche Cluster ergänzen sich gut?
const MOOD_AFFINITY_GRAPH = {
  kreativ:       ['inspirierend', 'authentisch', 'warm', 'nachhaltig'],
  ruhig:         ['authentisch', 'nachhaltig', 'warm', 'professionell'],
  warm:          ['authentisch', 'inspirierend', 'ruhig', 'kreativ'],
  professionell: ['authentisch', 'kreativ', 'nachhaltig', 'ruhig'],
  authentisch:   ['warm', 'ruhig', 'kreativ', 'professionell', 'nachhaltig'],  // universeller Brücken-Mood
  inspirierend:  ['kreativ', 'warm', 'abenteuerlich', 'authentisch'],
  abenteuerlich: ['inspirierend', 'nachhaltig', 'kreativ', 'authentisch'],
  nachhaltig:    ['ruhig', 'authentisch', 'warm', 'abenteuerlich'],
};

// ── Helper ─────────────────────────────────────────────────────
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

function textScore(text = '', keywords = []) {
  if (!text || !keywords.length) return 0;
  const t = text.toLowerCase();
  return keywords.filter(k => t.includes(k.toLowerCase())).length / keywords.length;
}

// ── 5D.2.1 — RELATIONSHIP STRENGTH ────────────────────────────
/**
 * Gesamtstärke der Verbindung zwischen zwei Personen.
 * Kombiniert alle bekannten Interaktions-Signale.
 *
 * @param {Object} interactionHistory — {
 *   completedBookings: number,
 *   repeatBookings:    boolean,
 *   recommendationsGiven: number,  // A→B
 *   recommendationsReceived: number, // B→A
 *   collaborations:    number,
 *   chatMessages:      number,
 *   mutualFollow:      boolean,
 *   followsA:          boolean,
 *   followsB:          boolean,
 * }
 * @returns {{ strength: number, tier: string, signals: string[] }}
 */
export function relationshipStrength(interactionHistory = {}) {
  const {
    completedBookings = 0,
    repeatBookings = false,
    recommendationsGiven = 0,
    recommendationsReceived = 0,
    collaborations = 0,
    chatMessages = 0,
    mutualFollow = false,
    followsA = false,
    followsB = false,
  } = interactionHistory;

  const signals = [];
  let score = 0;

  // Verifizierte Signale (höchste Qualität)
  const hasMutualRec = recommendationsGiven > 0 && recommendationsReceived > 0;
  if (hasMutualRec) {
    score += EDGE_WEIGHTS.mutual_recommendation * 0.35;
    signals.push('gegenseitige Empfehlung');
  }

  if (repeatBookings) {
    score += EDGE_WEIGHTS.repeat_booking * 0.25;
    signals.push('wiederholte Zusammenarbeit');
  }

  if (completedBookings > 0) {
    const bookingScore = clamp(completedBookings / 5) * EDGE_WEIGHTS.completed_booking;
    score += bookingScore * 0.20;
    if (!repeatBookings) signals.push('abgeschlossene Buchung');
  }

  if (collaborations > 0) {
    score += clamp(collaborations / 3) * EDGE_WEIGHTS.collaboration_chat * 0.15;
    signals.push('kreative Kollaboration');
  }

  if (chatMessages > 10) {
    score += EDGE_WEIGHTS.repeat_chat * 0.08;
    signals.push('aktiver Austausch');
  }

  if (mutualFollow) {
    score += EDGE_WEIGHTS.mutual_follow * 0.05;
    if (!hasMutualRec) signals.push('gegenseitiges Interesse');
  } else if (followsA || followsB) {
    score += EDGE_WEIGHTS.follow_one_way * 0.02;
  }

  // Einzelne Empfehlung (ohne Gegenseitigkeit)
  if (!hasMutualRec && (recommendationsGiven + recommendationsReceived) > 0) {
    score += EDGE_WEIGHTS.recommendation_given * 0.10;
    signals.push('Empfehlung');
  }

  const strength = clamp(score);

  // Tier-Klassifikation (für UI — falls benötigt)
  const tier =
    strength >= 0.8 ? 'partner'     :  // Vertrauenspartnerschaft
    strength >= 0.6 ? 'collaborator':  // Aktive Zusammenarbeit
    strength >= 0.4 ? 'connected'   :  // Klare Verbindung
    strength >= 0.2 ? 'acquainted'  :  // Bekanntschaft
                      'distant';       // Loser Kontakt

  return { strength, tier, signals: signals.slice(0, 3) };
}

// ── 5D.2.2 — CREATIVE RESONANCE ───────────────────────────────
/**
 * Wie stark resonieren zwei Creators kreativ?
 * Misst strukturelle kreative Kompatibilität.
 *
 * @param {Object} creatorA
 * @param {Object} creatorB
 * @returns {{ resonance: number, dimensions: Object }}
 */
export function creativeResonance(creatorA, creatorB) {
  if (!creatorA || !creatorB) return { resonance: 0, dimensions: {} };

  const dimensions = {};

  // 1. DNA-Tag Überlappung (kreative Sprache)
  const tagSim = cosineSim(creatorA.dna_tags, creatorB.dna_tags);
  dimensions.tagSimilarity = tagSim;

  // 2. Mood-Cluster Kompatibilität
  const moodA = (creatorA.mood || '').toLowerCase();
  const moodB = (creatorB.mood || '').toLowerCase();
  let moodScore = 0;
  if (moodA === moodB && moodA) {
    moodScore = 0.8;  // Gleiches Cluster: gut aber nicht perfekt
  } else if (MOOD_AFFINITY_GRAPH[moodA]?.includes(moodB)) {
    moodScore = 0.9;  // Verwandtes Cluster: oft besser als identisch
  } else {
    // Teilüberlappung via Keywords
    const clusterA = MOOD_CLUSTERS[moodA] || [];
    const clusterB = MOOD_CLUSTERS[moodB] || [];
    moodScore = cosineSim(clusterA, clusterB) * 0.5;
  }
  dimensions.moodCompatibility = moodScore;

  // 3. Focus-Type Komplementarität
  const focusA = creatorA.focus_type;
  const focusB = creatorB.focus_type;
  let focusScore = 0;
  if (focusA !== focusB) {
    focusScore = 0.8;   // Verschiedene Focus-Types ergänzen sich
  } else if (focusA === 'hybrid') {
    focusScore = 0.6;   // Beide hybrid: flexible Zusammenarbeit
  } else {
    focusScore = 0.4;   // Gleiche Ausrichtung: ok aber weniger ergänzend
  }
  dimensions.focusComplement = focusScore;

  // 4. Nischen-Tiefe (spezifische Tags → tiefere Resonanz)
  const depthA = (creatorA.dna_tags?.length || 0);
  const depthB = (creatorB.dna_tags?.length || 0);
  const depthScore = clamp(Math.min(depthA, depthB) / 5);
  dimensions.nicheDepth = depthScore;

  // Gewichtete Kombination
  const resonance = clamp(
    tagSim     * 0.35 +
    moodScore  * 0.30 +
    focusScore * 0.25 +
    depthScore * 0.10
  );

  return { resonance, dimensions };
}

// ── 5D.2.3 — TRUST DISTANCE ────────────────────────────────────
/**
 * Wie weit ist Vertrauen im Graphen entfernt?
 * 0 = direktes Vertrauen | 1 = sehr entfernt
 *
 * Direkt: abgeschlossene Buchungen + Empfehlungen
 * Indirekt: über gemeinsame Vertrauenspersonen
 */
export function trustDistance(creatorA, creatorB, sharedConnections = []) {
  if (!creatorA || !creatorB) return 1.0;

  let proximity = 0;

  // Direkte Signale
  if (creatorA.has_completed_booking_with_b) proximity += 0.5;
  if (creatorA.has_recommendation_from_b)    proximity += 0.4;
  if (creatorA.has_recommendation_to_b)      proximity += 0.3;

  // Indirekte Signale (gemeinsame Vertrauenspersonen)
  if (sharedConnections.length > 0) {
    const sharedTrust = sharedConnections.reduce((acc, conn) => {
      // Je vertrauenswürdiger die Brücke, desto mehr zählt sie
      const connTrust = clamp((conn.total_bookings_completed || 0) / 20);
      return acc + connTrust;
    }, 0);
    proximity += clamp(sharedTrust / 5) * 0.3;
  }

  // Strukturelle Nähe (gleiche Cluster → geringere psychologische Distanz)
  const { resonance } = creativeResonance(creatorA, creatorB);
  proximity += resonance * 0.1;

  // Distanz = Umkehrung der Nähe
  return clamp(1 - proximity);
}

// ── 5D.2.4 — COLLABORATION DEPTH ──────────────────────────────
/**
 * Wie tief geht die kreative Zusammenarbeit?
 * Nicht nur ob — sondern wie intensiv und nachhaltig.
 */
export function collaborationDepth(history = {}) {
  const {
    totalCollaborations   = 0,
    completedCollabs      = 0,
    mutualRecommendations = 0,
    longestCollabDays     = 0,
    repeatCollabs         = 0,
    currentlyActive       = false,
  } = history;

  let depth = 0;

  // Quantität (cap bei 10)
  depth += clamp(totalCollaborations / 10) * 0.20;

  // Abschlussrate (Qualität)
  const completionRate = totalCollaborations > 0
    ? completedCollabs / totalCollaborations : 0;
  depth += completionRate * 0.25;

  // Gegenseitige Empfehlungen (höchstes Zeichen von Tiefe)
  depth += clamp(mutualRecommendations / 3) * 0.25;

  // Wiederholung (langfristig)
  depth += clamp(repeatCollabs / 5) * 0.15;

  // Dauer der längsten Kollaboration
  depth += clamp(longestCollabDays / 90) * 0.10;

  // Aktiv gerade
  if (currentlyActive) depth += 0.05;

  return clamp(depth);
}

// ── 5D.2.5 — COMMUNITY AFFINITY (Soft Cluster) ────────────────
/**
 * Wie stark gehört ein Creator zu einem Cluster?
 * Gibt weiche Mitgliedschaftswerte zurück (0–1 pro Cluster).
 * Ein Creator kann mehreren Clustern angehören.
 *
 * @param {Object} creator
 * @returns {Object} — { clusterName: score, ... }
 */
export function communityAffinity(creator) {
  if (!creator) return {};

  const affinities = {};
  const creatorText = [
    creator.bio || '',
    creator.talent || '',
    ...(creator.dna_tags || []),
    creator.mood || '',
  ].join(' ').toLowerCase();

  for (const [cluster, keywords] of Object.entries(MOOD_CLUSTERS)) {
    // Direkte Keyword-Übereinstimmung
    const directScore = textScore(creatorText, keywords);

    // Mood-Match (primäre Zugehörigkeit)
    const moodMatch = (creator.mood || '').toLowerCase() === cluster ? 0.4 : 0;

    // Focus-Type Bonus (z.B. "works" → kreativ-Bonus)
    const focusBonus =
      cluster === 'kreativ'       && creator.focus_type === 'works'       ? 0.1 :
      cluster === 'inspirierend'  && creator.focus_type === 'experiences' ? 0.1 :
      cluster === 'authentisch'   && creator.focus_type === 'hybrid'      ? 0.05 : 0;

    const score = clamp(directScore * 0.5 + moodMatch + focusBonus);
    if (score > 0.05) affinities[cluster] = Math.round(score * 100) / 100;
  }

  // Lokaler Cluster (immer vorhanden wenn location_label gesetzt)
  if (creator.location_label) {
    affinities[`lokal:${creator.location_label}`] = 1.0;
  }

  return affinities;
}

// ── 5D.2.6 — MUTUAL ENERGY ────────────────────────────────────
/**
 * Die „gegenseitige kreative Energie" zweier Personen.
 * Kombiniert Beziehungsstärke + Kreative Resonanz + Vertrauen.
 *
 * Das ist die Kerngröße für „würden diese zwei Menschen
 * kreativ gut zusammenarbeiten?"
 */
export function mutualEnergy(creatorA, creatorB, interactionHistory = {}) {
  if (!creatorA || !creatorB) return { energy: 0, breakdown: {} };

  const { strength, tier, signals } = relationshipStrength(interactionHistory);
  const { resonance, dimensions }   = creativeResonance(creatorA, creatorB);
  const distance                    = trustDistance(creatorA, creatorB);
  const collab                      = collaborationDepth(interactionHistory);

  const breakdown = {
    relationshipStrength: strength,
    creativeResonance:    resonance,
    trustProximity:       1 - distance,
    collaborationDepth:   collab,
    tier,
    signals,
  };

  // Gewichtete Energie
  const energy = clamp(
    strength  * 0.35 +
    resonance * 0.30 +
    (1 - distance) * 0.20 +
    collab    * 0.15
  );

  return { energy, breakdown };
}

// ── 5D.5 — CREATOR BRIDGE SCORE ────────────────────────────────
/**
 * Kernprinzip von HUI: Wer verbindet kreative Welten?
 *
 * Bridge-Creators sind NICHT die lautesten.
 * Sie sind die VERBINDENDSTEN.
 *
 * Ein Bridge-Creator:
 * — gehört mehreren verschiedenen Clustern an
 * — hat Verbindungen in verschiedenen kreativen Gemeinschaften
 * — vermittelt zwischen Nischen
 * — reduziert Isolation
 * — schafft kreative Übergänge
 *
 * @param {Object} creator         — Profil des Creators
 * @param {Array}  connections     — Profil-Objekte aller Connections
 * @param {Object} clusterMemberships — { clusterName: score, ... }
 * @returns {{ bridgeScore: number, bridgeDimensions: Object, bridgeType: string }}
 */
export function creatorBridgeScore(creator, connections = [], clusterMemberships = {}) {
  if (!creator) return { bridgeScore: 0, bridgeDimensions: {}, bridgeType: 'none' };

  const dimensions = {};

  // 1. Cluster-Diversität (gehört zu mehreren Clustern)
  const strongClusters = Object.entries(clusterMemberships)
    .filter(([k, v]) => v > 0.3 && !k.startsWith('lokal:'));
  const clusterDiversity = clamp(strongClusters.length / 4);
  dimensions.clusterDiversity = clusterDiversity;

  // 2. Cross-Cluster-Verbindungen (kennt Menschen aus verschiedenen Clustern)
  const connectionClusters = new Set();
  for (const conn of connections) {
    const connAffinity = communityAffinity(conn);
    for (const [cluster, score] of Object.entries(connAffinity)) {
      if (score > 0.3 && !cluster.startsWith('lokal:')) {
        connectionClusters.add(cluster);
      }
    }
  }
  const ownClusters = new Set(strongClusters.map(([k]) => k));
  const bridgedClusters = [...connectionClusters].filter(c => !ownClusters.has(c));
  const crossClusterScore = clamp(bridgedClusters.length / 4);
  dimensions.crossClusterConnections = crossClusterScore;
  dimensions.bridgedClusters = bridgedClusters;

  // 3. Verbindungs-Diversität (verschiedene Typen von Connections)
  const hasWorks    = connections.some(c => c.focus_type === 'works');
  const hasExp      = connections.some(c => c.focus_type === 'experiences');
  const hasHybrid   = connections.some(c => c.focus_type === 'hybrid');
  const focusDiversity = [hasWorks, hasExp, hasHybrid].filter(Boolean).length / 3;
  dimensions.focusDiversity = focusDiversity;

  // 4. Geografische Reichweite (verbindet lokale Szenen)
  const connectionLocations = new Set(
    connections.map(c => c.location_label).filter(Boolean)
  );
  const geoReach = clamp(connectionLocations.size / 5);
  dimensions.geographicReach = geoReach;

  // 5. Stärke der bestehenden Verbindungen (Brücken müssen stabil sein)
  const avgConnectionStrength = connections.length > 0
    ? connections.reduce((acc, conn) => {
        const { strength } = relationshipStrength({
          completedBookings: conn.shared_bookings || 0,
          mutualFollow: conn.is_mutual_follow || false,
        });
        return acc + strength;
      }, 0) / connections.length
    : 0;
  dimensions.connectionStrength = avgConnectionStrength;

  // Gewichteter Bridge Score
  const bridgeScore = clamp(
    clusterDiversity      * 0.30 +
    crossClusterScore     * 0.30 +
    focusDiversity        * 0.20 +
    geoReach              * 0.10 +
    avgConnectionStrength * 0.10
  );

  // Bridge-Typ (für UI)
  const bridgeType =
    bridgeScore >= 0.7 ? 'major_bridge'  :  // Verbindet viele Welten
    bridgeScore >= 0.5 ? 'local_bridge'  :  // Verbindet 2-3 Cluster
    bridgeScore >= 0.3 ? 'emerging'      :  // Wächst zur Brücke
                         'none';            // Noch kein Bridge-Effekt

  return { bridgeScore, bridgeDimensions: dimensions, bridgeType };
}

// ── 5D.3 — CLUSTER DETECTION ──────────────────────────────────
/**
 * Erkennt soft Cluster-Zugehörigkeit für eine Liste von Creators.
 * Gibt für jeden Creator seine Cluster-Memberships zurück.
 *
 * WICHTIG: Keine harten Gruppen. Menschen gehören mehreren an.
 *
 * @param {Array} creators
 * @returns {Map<id, Object>} — creatorId → { clusterName: score }
 */
export function detectSoftClusters(creators) {
  const result = new Map();

  for (const creator of creators) {
    if (!creator?.id) continue;
    const affinities = communityAffinity(creator);
    result.set(creator.id, affinities);
  }

  return result;
}

/**
 * Findet Creators die einem bestimmten Cluster angehören.
 * Sortiert nach Cluster-Stärke (stärkste Mitglieder zuerst).
 *
 * @param {Map}    clusterMap   — aus detectSoftClusters()
 * @param {string} clusterName
 * @param {number} minScore     — Mindest-Zugehörigkeit (default: 0.3)
 * @returns {Array<{id, score}>}
 */
export function getClusterMembers(clusterMap, clusterName, minScore = 0.3) {
  const members = [];
  for (const [id, affinities] of clusterMap.entries()) {
    const score = affinities[clusterName] || 0;
    if (score >= minScore) members.push({ id, score });
  }
  return members.sort((a, b) => b.score - a.score);
}

// ── 5D.4 — NETWORK HEALTH ─────────────────────────────────────
/**
 * Analysiert die Gesundheit des gesamten Netzwerks.
 *
 * Prüft auf:
 * - Popularity Runaway (ein Creator dominiert)
 * - Cluster Isolation (Cluster verbinden sich nicht)
 * - Newcomer Starvation (neue Creators haben keine Connections)
 * - Bridge Collapse (zu wenige Bridge-Creators)
 * - Trust Monopoly (Vertrauen konzentriert sich)
 * - Empfehlungs-Inzucht (Empfehlungen nur innerhalb kleiner Kreise)
 */
export function analyzeNetworkHealth(creators, connections, clusterMap) {
  if (!creators?.length) return { healthy: false, issues: ['no_creators'] };

  const issues   = [];
  const warnings = [];
  const metrics  = {};

  // 1. Popularity Distribution
  const connectionCounts = {};
  for (const conn of (connections || [])) {
    const { from, to } = conn;
    connectionCounts[from] = (connectionCounts[from] || 0) + 1;
    connectionCounts[to]   = (connectionCounts[to]   || 0) + 1;
  }
  const counts = Object.values(connectionCounts);
  if (counts.length > 0) {
    const maxCount = Math.max(...counts);
    const avgCount = counts.reduce((a,b) => a+b,0) / counts.length;
    metrics.popularityGini = maxCount / (avgCount * creators.length);

    if (metrics.popularityGini > 0.7) issues.push('popularity_runaway');
    else if (metrics.popularityGini > 0.5) warnings.push('concentration_risk');
  }

  // 2. Newcomer Exposure
  const newCreators = creators.filter(c => {
    const days = c.created_at
      ? (Date.now() - new Date(c.created_at).getTime()) / (86400000)
      : 999;
    return days < 30;
  });
  const newWithConnections = newCreators.filter(c => connectionCounts[c.id] > 0);
  metrics.newcomerExposureRate = newCreators.length > 0
    ? newWithConnections.length / newCreators.length : 1;

  if (metrics.newcomerExposureRate < 0.3 && newCreators.length > 3) {
    issues.push('newcomer_starvation');
  }

  // 3. Cluster Diversity
  if (clusterMap?.size > 0) {
    const clusterCounts = {};
    for (const affinities of clusterMap.values()) {
      for (const [cluster, score] of Object.entries(affinities)) {
        if (score > 0.3 && !cluster.startsWith('lokal:')) {
          clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
        }
      }
    }
    metrics.activeClusterCount = Object.keys(clusterCounts).length;
    if (metrics.activeClusterCount < 3) warnings.push('low_cluster_diversity');
  }

  // 4. Bridge Creator Presence
  metrics.bridgeCreatorCount = creators.filter(c => c._bridgeScore > 0.4).length;
  const bridgeRatio = metrics.bridgeCreatorCount / creators.length;
  if (bridgeRatio < 0.05 && creators.length > 10) {
    warnings.push('insufficient_bridges');
  }

  // 5. Trust Distribution
  const trustScores = creators.map(c => c.trust_score || 0).filter(Boolean);
  if (trustScores.length > 5) {
    const topTrust = trustScores.filter(t => t > 0.7).length / trustScores.length;
    if (topTrust < 0.05) warnings.push('trust_desert');  // Fast niemand hat Trust
    if (topTrust > 0.50) warnings.push('trust_monopoly'); // Zu viele mit hohem Trust
  }

  return {
    healthy: issues.length === 0,
    issues,
    warnings,
    metrics,
    timestamp: new Date().toISOString(),
  };
}

// ── 5D.6 — SOCIAL DISCOVERY INTEGRATION ───────────────────────
/**
 * Erweitert Discovery um Graph-Signale.
 * Gibt für jeden Creator einen Graph-basierten Bonus zurück.
 *
 * Berücksichtigt:
 * - Soziale Nähe im Graphen
 * - Bridge-Qualität
 * - Cluster-Komplementarität
 */
export function graphDiscoveryBonus(creator, userContext = {}) {
  if (!creator || !userContext) return 0;

  const {
    userClusterMemberships = {},
    userConnections        = new Set(),
    networkBridges         = [],
  } = userContext;

  let bonus = 0;

  // 1. Cluster-Komplementarität (ergänzt den User)
  const creatorClusters = communityAffinity(creator);
  let clusterComplement = 0;
  for (const [cluster, userScore] of Object.entries(userClusterMemberships)) {
    const creatorScore = creatorClusters[cluster] || 0;
    // Ergänzend wenn User schwach im Cluster, Creator stark
    if (userScore < 0.4 && creatorScore > 0.5) {
      clusterComplement += (creatorScore - userScore) * 0.2;
    }
  }
  bonus += clamp(clusterComplement) * 0.35;

  // 2. Bridge-Bonus (verbindende Creators bevorzugen)
  if (creator._bridgeScore > 0) {
    bonus += creator._bridgeScore * 0.30;
  }

  // 3. Gemeinsame Connections (zweite Grad)
  const creatorConnectionIds = new Set(creator._connectionIds || []);
  const mutualCount = [...userConnections].filter(id => creatorConnectionIds.has(id)).length;
  bonus += clamp(mutualCount / 5) * 0.20;

  // 4. Lokale Resonanz
  const sameLocation = creator.location_label &&
    Object.keys(userClusterMemberships).includes(`lokal:${creator.location_label}`);
  if (sameLocation) bonus += 0.15;

  return clamp(bonus);
}
