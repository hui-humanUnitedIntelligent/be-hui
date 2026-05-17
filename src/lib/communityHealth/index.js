// src/lib/communityHealth/index.js
// HUI — Community Health Engine V1 — Phase 5G
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// HUI optimiert nicht für Aktivität — sondern für Gesundheit.
// Diese Engine überwacht das kreative Ökosystem.
//
// PRINZIPIEN:
// 1. Soft Influence Only — nie erzwingend, nie strafend
// 2. Transparent — jede Funktion erklärt was sie misst
// 3. Creator-schützend — Burnout-Risiken werden erkannt
// 4. Fairness-first — Newcomer und kleine Cluster geschützt
// 5. Diversity-first — kreative Vielfalt ist systemkritisch
//
// INTEGRATION:
// Läuft als Background-Analyse, nicht im kritischen Render-Pfad.
// Ergebnisse beeinflussen Discovery sanft (max ±15%).
// ═══════════════════════════════════════════════════════════════

// ── Gesundheits-Schwellenwerte ─────────────────────────────────

/**
 * Alle Schwellenwerte sind dokumentiert und erklärbar.
 * Keine Hidden Magic Numbers.
 */
export const HEALTH_THRESHOLDS = {
  // Network Health
  MIN_BRIDGE_DENSITY:        0.05,   // mind. 5% Bridge-Creators
  MIN_MUTUAL_FOLLOW_RATE:    0.15,   // mind. 15% gegenseitige Follows
  MAX_CLUSTER_ISOLATION:     3,      // max. 3 völlig isolierte Cluster
  MIN_NEWCOMER_INTEGRATION:  0.30,   // mind. 30% neue Creators bekommen Verbindungen
  MAX_FOLLOW_CONCENTRATION:  0.40,   // Top-10 Creators < 40% aller Follows

  // Discovery Health
  MAX_POPULARITY_GINI:       0.60,   // Exposure-Ungleichheit
  MAX_REPETITION_RATE:       0.25,   // max. 25% Wiederholungen im Feed
  MIN_EXPLORATION_RATIO:     0.20,   // mind. 20% unbekannte Creator
  MAX_SINGLE_CREATOR_SHARE:  0.15,   // max. 15% Feed für einen Creator

  // Creator Health (per Creator)
  MAX_FEED_SHARE_7D:         0.10,   // max. 10% aller Feeds in 7 Tagen
  MAX_BOOKING_SATURATION:    0.80,   // > 80% Kapazität → Warnung
  MAX_RESPONSE_DECLINE:      0.20,   // Response-Rate < 20% → Rückzug-Signal
  MAX_DAILY_NOTIF:           2,      // max. 2 Notifications pro Tag

  // Community Energy
  MIN_RESONANCE_RATE:        0.20,   // mind. 20% Buchungen enden in Empfehlung
  MIN_RETURN_RATE:           0.40,   // mind. 40% Creator kommen zurück
  MIN_LONGTERM_RETENTION:    0.25,   // mind. 25% aktiv nach 6 Monaten

  // Diversity
  MAX_DOMINANT_CLUSTER:      0.60,   // kein Cluster > 60% des Feeds
  MIN_CLUSTER_COUNT:         4,      // mind. 4 verschiedene Cluster sichtbar
  MIN_MINORITY_EXPOSURE:     0.05,   // kleine Cluster mind. 5% Slot

  // Calmness
  MAX_FEED_VELOCITY:         30,     // max. 30 neue Items pro Stunde
  MAX_SESSION_PUSH:          3,      // max. 3 aktive Pushes pro Session
  BREATHING_INTERVAL:        4,      // Atemraum nach je 4 Items
};

// ── Helper ─────────────────────────────────────────────────────

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Gini-Koeffizient — misst Ungleichverteilung (0=gleich, 1=maximal ungleich)
 */
function giniCoefficient(values) {
  if (!values?.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  if (sum === 0) return 0;
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sorted[i];
  }
  return numerator / (n * sum);
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

// ── 5G.2.1 — CREATOR SATURATION ────────────────────────────────
/**
 * Wie stark ist ein Creator bereits ausgelastet/exponiert?
 *
 * Erkennt Überexposition BEVOR es zum Burnout kommt.
 * Reagiert: sanfte Sichtbarkeits-Drosselung — keine Strafe.
 *
 * @param {Object} creator
 * @param {Object} exposureData — { feedShareLast7d, bookingRate, responseRateTrend }
 * @returns {{ saturation: number, level: string, signals: string[] }}
 */
export function creatorSaturation(creator, exposureData = {}) {
  if (!creator) return { saturation: 0, level: 'healthy', signals: [] };

  const {
    feedShareLast7d    = 0,    // Anteil am Gesamt-Feed der letzten 7 Tage (0–1)
    bookingRate        = 0,    // Buchungen / maximale Kapazität (0–1)
    responseRateTrend  = 0,   // positiv = steigt, negativ = sinkt
    activeBookings     = 0,
    unreadMessages     = 0,
  } = exposureData;

  const signals = [];
  let saturation = 0;

  // Feed-Überexposition
  if (feedShareLast7d > HEALTH_THRESHOLDS.MAX_FEED_SHARE_7D) {
    saturation += (feedShareLast7d / HEALTH_THRESHOLDS.MAX_FEED_SHARE_7D - 1) * 0.35;
    signals.push('hohe Feed-Präsenz');
  }

  // Buchungs-Auslastung
  if (bookingRate > HEALTH_THRESHOLDS.MAX_BOOKING_SATURATION) {
    saturation += (bookingRate - HEALTH_THRESHOLDS.MAX_BOOKING_SATURATION) * 0.30;
    signals.push('hohe Buchungsauslastung');
  }

  // Sinkende Response-Rate (Rückzugs-Signal)
  if (responseRateTrend < -0.10) {
    saturation += Math.abs(responseRateTrend) * 0.20;
    signals.push('sinkende Antwortrate');
  }

  // Viele offene Bookings + ungelesene Nachrichten
  if (activeBookings > 5 && unreadMessages > 10) {
    saturation += 0.15;
    signals.push('hohe Kommunikationslast');
  }

  const level =
    saturation > 0.7 ? 'critical'  :   // Dringend reduzieren
    saturation > 0.4 ? 'high'      :   // Sanfte Drosselung
    saturation > 0.2 ? 'moderate'  :   // Beobachten
                       'healthy';      // Kein Handlungsbedarf

  return { saturation: clamp(saturation), level, signals };
}

// ── 5G.2.2 — BURNOUT RISK ──────────────────────────────────────
/**
 * Erkennt strukturelle Burnout-Risiken für Creator.
 *
 * WICHTIG: Kein Algorithmus entscheidet für Creator.
 * Nur: System-seitige Überexposition wird sanft reduziert.
 * Creator kann immer manuell mehr Sichtbarkeit aktivieren.
 */
export function burnoutRisk(creator, historyData = {}) {
  if (!creator) return { risk: 0, category: 'low', protective: [] };

  const {
    weeksActive          = 0,
    bookingsCompleted    = 0,
    avgResponseTimeH     = 0,
    hasTakenBreak        = false,
    collaborationCount   = 0,
    receivedRecommendations = 0,
    givenRecommendations = 0,
  } = historyData;

  const protective = [];  // Schützende Faktoren
  let risk = 0;

  // Risiko-Faktoren
  // Sehr lange aktiv ohne Pause
  if (weeksActive > 52 && !hasTakenBreak) {
    risk += 0.20;
  } else if (weeksActive > 26 && !hasTakenBreak) {
    risk += 0.10;
  }

  // Hohe Buchungsrate ohne ausreichend Empfehlungen
  const recRate = bookingsCompleted > 0
    ? receivedRecommendations / bookingsCompleted : 0;
  if (bookingsCompleted > 10 && recRate < 0.15) {
    risk += 0.15;  // Viel Arbeit, wenig Rückmeldung
  }

  // Sehr kurze Response-Zeit (immer erreichbar = Burnout-Risiko)
  if (avgResponseTimeH < 0.5 && bookingsCompleted > 5) {
    risk += 0.10;  // < 30min Response-Zeit durchgehend
  }

  // Gibt viel, bekommt wenig zurück
  const recImbalance = givenRecommendations - receivedRecommendations;
  if (recImbalance > 5) {
    risk += 0.10;
  }

  // Schützende Faktoren (reduzieren Risiko)
  if (hasTakenBreak) {
    risk -= 0.10;
    protective.push('hat bereits Pausen gemacht');
  }
  if (collaborationCount > 3) {
    risk -= 0.05;
    protective.push('kollaboriert mit anderen');
  }
  if (recRate > 0.40) {
    risk -= 0.10;
    protective.push('hohe Empfehlungsrate');
  }
  if (!creator.is_available) {
    risk -= 0.15;  // Hat aktiv Verfügbarkeit reduziert
    protective.push('hat Verfügbarkeit selbst reduziert');
  }

  const category =
    risk > 0.5  ? 'high'    :
    risk > 0.25 ? 'moderate':
                  'low';

  return { risk: clamp(risk), category, protective };
}

// ── 5G.2.3 — EXPOSURE FAIRNESS ─────────────────────────────────
/**
 * Misst die Fairness der Sichtbarkeits-Verteilung.
 *
 * Gut: alle Creators bekommen faire Chancen.
 * Schlecht: wenige dominieren, viele werden unsichtbar.
 *
 * @param {Array} exposureData — [{ creatorId, feedImpressions, joinedDaysAgo }]
 * @returns {{ gini: number, fairness: number, issues: string[] }}
 */
export function exposureFairness(exposureData = []) {
  if (!exposureData.length) return { gini: 0, fairness: 1, issues: [] };

  const issues = [];
  const impressions = exposureData.map(d => d.feedImpressions || 0);
  const gini = giniCoefficient(impressions);

  // Newcomer-Check
  const newcomers = exposureData.filter(d => d.joinedDaysAgo < 30);
  const newcomerWithImpressions = newcomers.filter(d => (d.feedImpressions || 0) > 0);
  const newcomerRate = newcomers.length > 0
    ? newcomerWithImpressions.length / newcomers.length : 1;

  // Top-Creator-Konzentration
  const sorted = [...impressions].sort((a, b) => b - a);
  const total  = sorted.reduce((a, b) => a + b, 0);
  const top10Share = sorted.slice(0, 10).reduce((a, b) => a + b, 0) / (total || 1);

  if (gini > HEALTH_THRESHOLDS.MAX_POPULARITY_GINI) {
    issues.push('high_concentration');
  }
  if (newcomerRate < HEALTH_THRESHOLDS.MIN_NEWCOMER_INTEGRATION) {
    issues.push('newcomer_starvation');
  }
  if (top10Share > HEALTH_THRESHOLDS.MAX_FOLLOW_CONCENTRATION) {
    issues.push('top10_monopoly');
  }

  const fairness = clamp(
    1 - gini * 0.5 +
    newcomerRate * 0.3 +
    (1 - top10Share) * 0.2
  );

  return { gini: Math.round(gini * 100) / 100, fairness, newcomerRate, top10Share, issues };
}

// ── 5G.2.4 — DIVERSITY BALANCE ─────────────────────────────────
/**
 * Misst kreative Diversität im Feed/Netzwerk.
 *
 * Prüft: Cluster-Verteilung, Mood-Vielfalt, Focus-Type-Mix,
 * Newcomer-Anteil, Bridge-Creator-Präsenz.
 *
 * @param {Array} feedItems — Items im aktuellen Feed
 * @returns {{ score: number, breakdown: Object, recommendations: string[] }}
 */
export function diversityBalance(feedItems = []) {
  if (!feedItems.length) return { score: 0, breakdown: {}, recommendations: [] };

  const recommendations = [];
  const breakdown = {};

  // 1. Mood-Diversität
  const moodCounts = {};
  for (const item of feedItems) {
    const mood = (item.mood || 'unbekannt').toLowerCase();
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  }
  const moodVariety = Object.keys(moodCounts).length;
  const moodGini = giniCoefficient(Object.values(moodCounts));
  breakdown.moodVariety = moodVariety;
  breakdown.moodGini    = Math.round(moodGini * 100) / 100;

  if (moodGini > 0.6) recommendations.push('mehr Mood-Vielfalt einbringen');

  // 2. Focus-Type-Mix (works/experiences/stories)
  const typeCounts = {};
  for (const item of feedItems) {
    const type = item._type || item.type || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const typeVariety = Object.keys(typeCounts).length;
  breakdown.typeVariety = typeVariety;
  breakdown.typeDistribution = typeCounts;

  if (typeVariety < 2) recommendations.push('verschiedene Content-Typen mischen');

  // 3. Newcomer-Anteil (< 30 Tage)
  const newcomerCount = feedItems.filter(item =>
    daysSince(item.created_at) < 30 || daysSince(item.creator_joined_at) < 30
  ).length;
  const newcomerRatio = newcomerCount / feedItems.length;
  breakdown.newcomerRatio = Math.round(newcomerRatio * 100) / 100;

  if (newcomerRatio < HEALTH_THRESHOLDS.MIN_EXPLORATION_RATIO) {
    recommendations.push('mehr neue Creators einstreuen');
  }

  // 4. Bridge-Creator-Präsenz
  const bridgeCount = feedItems.filter(item => (item._bridgeScore || 0) > 0.3).length;
  const bridgeRatio = bridgeCount / feedItems.length;
  breakdown.bridgeRatio = Math.round(bridgeRatio * 100) / 100;

  if (bridgeRatio < 0.08) recommendations.push('Bridge-Creators bevorzugen');

  // 5. Creator-Wiederholung (max. 2× gleicher Creator)
  const creatorCount = {};
  let repetitions = 0;
  for (const item of feedItems) {
    const id = item.user_id || item.creator_id;
    if (id) {
      creatorCount[id] = (creatorCount[id] || 0) + 1;
      if (creatorCount[id] > 2) repetitions++;
    }
  }
  const repetitionRate = repetitions / feedItems.length;
  breakdown.repetitionRate = Math.round(repetitionRate * 100) / 100;

  if (repetitionRate > HEALTH_THRESHOLDS.MAX_REPETITION_RATE) {
    recommendations.push('Wiederholungen reduzieren');
  }

  // Gesamt-Score
  const score = clamp(
    (1 - moodGini)     * 0.25 +
    (typeVariety / 3)  * 0.20 +
    newcomerRatio      * 0.20 +
    bridgeRatio        * 0.15 +
    (1 - repetitionRate) * 0.20
  );

  return { score: Math.round(score * 100) / 100, breakdown, recommendations };
}

// ── 5G.2.5 — BRIDGE HEALTH ─────────────────────────────────────
/**
 * Prüft die Gesundheit des Bridge-Creator-Systems.
 *
 * Bridge-Creators sind systemkritisch — verbinden Cluster.
 * Wenn sie ausbrennen oder verschwinden → Cluster-Isolation.
 */
export function bridgeHealth(creators = [], networkEdges = []) {
  if (!creators.length) return { score: 0, issues: [], bridgeCount: 0 };

  const issues = [];

  // Bridge-Creators identifizieren
  const bridges = creators.filter(c => (c._bridgeScore || 0) > 0.35);
  const bridgeCount = bridges.length;
  const bridgeDensity = bridgeCount / creators.length;

  // Bridge-Diversität (verschiedene Cluster-Paare)
  const bridgedClusterPairs = new Set();
  for (const bridge of bridges) {
    const dims = bridge._bridgeDimensions || {};
    (dims.bridgedClusters || []).forEach(c => bridgedClusterPairs.add(c));
  }

  // Sind Bridges gesund (nicht saturiert)?
  const saturatedBridges = bridges.filter(b => (b._saturation || 0) > 0.5);
  const saturatedRatio = bridges.length > 0
    ? saturatedBridges.length / bridges.length : 0;

  if (bridgeDensity < HEALTH_THRESHOLDS.MIN_BRIDGE_DENSITY) {
    issues.push('insufficient_bridges');
  }
  if (saturatedRatio > 0.3) {
    issues.push('bridges_overloaded');
  }
  if (bridgedClusterPairs.size < 3) {
    issues.push('low_cluster_connectivity');
  }

  const score = clamp(
    (bridgeDensity / HEALTH_THRESHOLDS.MIN_BRIDGE_DENSITY) * 0.40 +
    (bridgedClusterPairs.size / 5) * 0.35 +
    (1 - saturatedRatio) * 0.25
  );

  return {
    score:          Math.round(score * 100) / 100,
    bridgeCount,
    bridgeDensity:  Math.round(bridgeDensity * 100) / 100,
    connectedClusters: bridgedClusterPairs.size,
    saturatedBridges:  saturatedBridges.length,
    issues,
  };
}

// ── 5G.2.6 — NEWCOMER PROTECTION ───────────────────────────────
/**
 * Schützt neue Creators vor Unsichtbarkeit.
 *
 * Gibt für einen Feed an, wie viel Exploration-Raum
 * für neue Creators reserviert werden soll.
 *
 * @param {Array}  feedItems
 * @param {number} totalCreators — Gesamt-Creator-Zahl der Plattform
 * @returns {{ protectionNeeded: boolean, boostSlots: number, reason: string }}
 */
export function newcomerProtection(feedItems = [], totalCreators = 100) {
  // Newcomers im Feed
  const newcomerItems = feedItems.filter(item =>
    daysSince(item.created_at) < 30 ||
    daysSince(item.creator_joined_at) < 30
  );
  const currentRatio = feedItems.length > 0
    ? newcomerItems.length / feedItems.length : 0;

  // Wie viele Newcomers gibt es auf der Plattform?
  const expectedNewcomerRatio = 0.10;  // ~10% der Creator sind neu (<30d)
  const targetFeedRatio = Math.max(
    HEALTH_THRESHOLDS.MIN_EXPLORATION_RATIO,  // mind. 20%
    expectedNewcomerRatio * 1.5               // 1.5× ihres natürlichen Anteils
  );

  const gap = targetFeedRatio - currentRatio;
  const boostSlots = Math.max(0, Math.ceil(gap * feedItems.length));

  return {
    protectionNeeded: gap > 0.05,
    boostSlots,
    currentRatio:  Math.round(currentRatio * 100) / 100,
    targetRatio:   Math.round(targetFeedRatio * 100) / 100,
    reason: gap > 0.05
      ? `Newcomer-Anteil ${Math.round(currentRatio*100)}% unter Ziel ${Math.round(targetFeedRatio*100)}%`
      : 'Newcomer-Schutz aktiv — kein Boost nötig',
  };
}

// ── 5G.2.7 — RESONANCE QUALITY ─────────────────────────────────
/**
 * Misst die Qualität der Resonanz im Netzwerk.
 *
 * Resonanz ≠ Aktivität.
 * Resonanz = wie viele Interaktionen führen zu echten Verbindungen.
 *
 * @param {Object} platformMetrics — aggregierte Plattform-Daten
 * @returns {{ quality: number, signals: Object }}
 */
export function resonanceQuality(platformMetrics = {}) {
  const {
    totalBookings          = 0,
    bookingsWithRec        = 0,  // Buchungen die in Empfehlung endeten
    totalCollaborations    = 0,
    repeatCollaborations   = 0,
    totalFollows           = 0,
    mutualFollows          = 0,
    totalChats             = 0,
    chatsLeadingToBooking  = 0,
  } = platformMetrics;

  const signals = {};

  // Empfehlungsrate nach Buchung (wichtigstes Signal)
  const recRate = totalBookings > 0 ? bookingsWithRec / totalBookings : 0;
  signals.recommendationRate = Math.round(recRate * 100) / 100;

  // Wiederholungs-Kollaborationsrate
  const repeatRate = totalCollaborations > 0
    ? repeatCollaborations / totalCollaborations : 0;
  signals.repeatCollaborationRate = Math.round(repeatRate * 100) / 100;

  // Gegenseitigkeits-Follow-Rate
  const mutualRate = totalFollows > 0 ? (mutualFollows * 2) / totalFollows : 0;
  signals.mutualFollowRate = Math.round(mutualRate * 100) / 100;

  // Chat-Konversionsrate (Chat → Buchung)
  const chatConversion = totalChats > 0 ? chatsLeadingToBooking / totalChats : 0;
  signals.chatConversionRate = Math.round(chatConversion * 100) / 100;

  // Gesamt-Resonanz-Qualität
  const quality = clamp(
    recRate    * 0.40 +
    repeatRate * 0.25 +
    mutualRate * 0.20 +
    chatConversion * 0.15
  );

  const level =
    quality > 0.6 ? 'excellent' :
    quality > 0.4 ? 'good'      :
    quality > 0.2 ? 'developing':
                    'early';

  return { quality: Math.round(quality * 100) / 100, level, signals };
}

// ── 5G.2.8 — CALMNESS HEALTH ────────────────────────────────────
/**
 * Misst die "Ruhe-Gesundheit" der Plattform.
 *
 * Prüft: Notification-Dichte, Feed-Velocity, Push-Häufigkeit.
 * Garantiert dass HUI ruhig bleibt — auch wenn die Community wächst.
 */
export function calmnessHealth(platformSignals = {}) {
  const {
    avgNotifsPerUserPerDay = 0,
    avgFeedItemsPerHour    = 0,
    activePushCampaigns    = 0,
    avgSessionPushes       = 0,
  } = platformSignals;

  const issues = [];
  let calmness = 1.0;

  if (avgNotifsPerUserPerDay > HEALTH_THRESHOLDS.MAX_DAILY_NOTIF) {
    const excess = avgNotifsPerUserPerDay / HEALTH_THRESHOLDS.MAX_DAILY_NOTIF;
    calmness -= (excess - 1) * 0.30;
    issues.push(`Notifications zu hoch: ${avgNotifsPerUserPerDay.toFixed(1)}/Tag`);
  }

  if (avgFeedItemsPerHour > HEALTH_THRESHOLDS.MAX_FEED_VELOCITY) {
    calmness -= 0.20;
    issues.push('Feed-Velocity zu hoch');
  }

  if (activePushCampaigns > 0) {
    calmness -= activePushCampaigns * 0.10;
    issues.push('aktive Push-Kampagnen detected');
  }

  if (avgSessionPushes > HEALTH_THRESHOLDS.MAX_SESSION_PUSH) {
    calmness -= 0.15;
    issues.push('zu viele Pushes pro Session');
  }

  return {
    calmness: clamp(calmness),
    level: calmness > 0.8 ? 'calm' : calmness > 0.5 ? 'moderate' : 'noisy',
    issues,
  };
}

// ── 5G.3 — HEALTHY EXPOSURE DISTRIBUTION ───────────────────────
/**
 * Modifiziert Feed-Ranking für gesunde Exposure-Verteilung.
 *
 * Soft influence: max ±15% auf Basis-Score.
 * Keine Bestrafung erfolgreicher Creator.
 * Nur: sanfte Ausbalancierung.
 *
 * @param {Array}  rankedItems    — bereits gerankte Items
 * @param {Object} healthContext  — { exposureMap, bridgeIds, newcomerIds }
 * @returns {Array}               — sanft re-balanced Items
 */
export function healthyExposureDistribution(rankedItems, healthContext = {}) {
  if (!rankedItems?.length) return rankedItems;

  const {
    exposureMap  = new Map(),  // creatorId → exposureScore (0–1)
    bridgeIds    = new Set(),  // Creators die Bridge-Funktion haben
    newcomerIds  = new Set(),  // Creator < 30 Tage
  } = healthContext;

  return rankedItems.map(item => {
    const creatorId = item.user_id || item.creator_id || item.id;
    let healthMod   = 0;

    // Sanfte Drosselung bei Überexposition
    const currentExposure = exposureMap.get(creatorId) || 0;
    if (currentExposure > HEALTH_THRESHOLDS.MAX_FEED_SHARE_7D) {
      const excess = currentExposure / HEALTH_THRESHOLDS.MAX_FEED_SHARE_7D;
      healthMod -= clamp((excess - 1) * 0.10, 0, 0.15);  // max -15%
    }

    // Bridge-Amplification
    if (bridgeIds.has(creatorId)) {
      healthMod += 0.08;  // +8% für Bridge-Creators
    }

    // Newcomer-Boost
    if (newcomerIds.has(creatorId)) {
      healthMod += 0.10;  // +10% für neue Creators
    }

    return {
      ...item,
      _healthMod:    Math.round(healthMod * 100) / 100,
      _healthScore:  clamp((item._score || item._totalScore || 0.5) + healthMod),
    };
  }).sort((a, b) => b._healthScore - a._healthScore);
}

// ── 5G.8 — SAFETY GUARDS ─────────────────────────────────────────
/**
 * Hard Caps: Diese Limits sind nicht verhandelbar.
 * Schützen die Community vor algorithmischen Extremen.
 */
export const SAFETY_GUARDS = {
  /**
   * Max. Anteil eines Creators im Feed.
   * Verhindert dass ein Creator den Feed monopolisiert.
   */
  maxCreatorFeedShare(feedItems, maxShare = 0.15) {
    const counts = {};
    for (const item of feedItems) {
      const id = item.user_id || item.creator_id;
      if (id) counts[id] = (counts[id] || 0) + 1;
    }
    const n = feedItems.length;
    return Object.entries(counts).every(([, c]) => c / n <= maxShare);
  },

  /**
   * Diversity Minimum: mind. N verschiedene Cluster im Feed.
   */
  diversityMinimum(feedItems, minClusters = HEALTH_THRESHOLDS.MIN_CLUSTER_COUNT) {
    const moods = new Set(feedItems.map(i => (i.mood || '').toLowerCase()).filter(Boolean));
    return moods.size >= minClusters;
  },

  /**
   * Newcomer Floor: mind. X% neue Creators im Feed.
   */
  newcomerFloor(feedItems, minRatio = HEALTH_THRESHOLDS.MIN_EXPLORATION_RATIO) {
    const newcomerCount = feedItems.filter(i => daysSince(i.created_at) < 30).length;
    return feedItems.length > 0 ? newcomerCount / feedItems.length >= minRatio : true;
  },

  /**
   * Anti-Runaway: kein einzelner Creator erhält dauerhaft Top-Slot.
   */
  antiRunaway(feedItems) {
    if (feedItems.length < 3) return true;
    const topId = feedItems[0]?.user_id;
    const topCount = feedItems.filter(i => i.user_id === topId).length;
    return topCount / feedItems.length <= HEALTH_THRESHOLDS.MAX_SINGLE_CREATOR_SHARE;
  },
};

// ── 5G.9 — ANALYZE COMMUNITY HEALTH (Master) ───────────────────
/**
 * Vollständige Community-Gesundheits-Analyse.
 *
 * Aggregiert alle Sub-Scores zu einem Gesamt-Score.
 * Gibt actionable Issues + Recommendations zurück.
 *
 * @param {Object} data — alle verfügbaren Plattform-Daten
 * @returns {Object}    — vollständiger Health-Report
 */
export function analyzeCommunityHealth(data = {}) {
  const {
    creators        = [],
    feedItems       = [],
    networkEdges    = [],
    exposureData    = [],
    platformMetrics = {},
    platformSignals = {},
  } = data;

  const issues        = [];
  const warnings      = [];
  const scores        = {};

  // 1. Exposure Fairness
  const fairness = exposureFairness(exposureData);
  scores.fairness = fairness.fairness;
  issues.push(...fairness.issues);

  // 2. Diversity Balance
  const diversity = diversityBalance(feedItems);
  scores.diversity = diversity.score;
  if (diversity.score < 0.5) warnings.push('low_diversity');

  // 3. Bridge Health
  const bridge = bridgeHealth(creators, networkEdges);
  scores.bridge = bridge.score;
  issues.push(...bridge.issues);

  // 4. Resonance Quality
  const resonance = resonanceQuality(platformMetrics);
  scores.resonance = resonance.quality;

  // 5. Calmness Health
  const calmness = calmnessHealth(platformSignals);
  scores.calmness = calmness.calmness;
  issues.push(...calmness.issues);

  // 6. Newcomer Protection Check
  const newcomer = newcomerProtection(feedItems, creators.length);
  scores.newcomer = newcomer.currentRatio;
  if (newcomer.protectionNeeded) warnings.push('newcomer_protection_needed');

  // 7. Creator Wellbeing (aggregiert)
  const saturatedCreators = creators.filter(c =>
    creatorSaturation(c, c._exposureData || {}).level === 'critical'
  ).length;
  scores.creatorWellbeing = creators.length > 0
    ? 1 - (saturatedCreators / creators.length) : 1;

  // Gesamt Community Health Score
  const overallScore = clamp(
    scores.fairness        * 0.25 +
    scores.diversity       * 0.25 +
    scores.bridge          * 0.15 +
    scores.resonance       * 0.10 +
    scores.calmness        * 0.10 +
    (scores.newcomer / 0.2)* 0.10 +
    scores.creatorWellbeing* 0.05
  );

  const healthLevel =
    overallScore > 0.80 ? 'thriving'   :
    overallScore > 0.65 ? 'healthy'    :
    overallScore > 0.50 ? 'developing' :
    overallScore > 0.35 ? 'concerning' :
                          'critical';

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    healthLevel,
    scores,
    issues,
    warnings,
    recommendations: diversity.recommendations,
    timestamp: new Date().toISOString(),
  };
}
