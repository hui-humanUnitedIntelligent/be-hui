// src/lib/culturalEvolution/index.js
// HUI — Cultural Evolution Engine — Phase 7E
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Plattformen altern. Kulturen verhärten.
// Dieses System erkennt kulturelle Drift — und antwortet sanft.
//
// KEIN ALGORITHMUS ERZWINGT VIELFALT.
// Aber: stille Korrekturen sorgen für Offenheit.
//
// ALLE FUNKTIONEN:
//   culturalDiversity()      → Gesamte kreative Vielfalt
//   aestheticDrift()         → Ästhetische Verengung erkennen
//   newcomerIntegration()    → Wie warm werden Neue empfangen?
//   bridgeVitality()         → Leben kreative Brücken noch?
//   creativePlurality()      → Viele verschiedene Stimmen?
//   localCulturalBalance()   → Balance zwischen Städten
//   generationalContinuity() → Übergabe von Erfahrung
//   culturalFlexibility()    → Offenheit für Überraschungen
//   antiEliteDrift()         → Verhindert Creator-Kasten
//   culturalFatigue()        → Erkennt Erschöpfung
//   longTermHealthScore()    → Gesamter Langzeit-Score
// ═══════════════════════════════════════════════════════════════

import { diversityBalance, bridgeHealth, exposureFairness, newcomerProtection }
  from '@/lib/communityHealth/index';
import { creativeResonance, creatorBridgeScore, analyzeNetworkHealth }
  from '@/lib/graph/index';
import { getSeason } from '@/lib/culture/index';

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
function daysSince(d) { return d ? (Date.now() - new Date(d).getTime()) / 86400000 : 999; }

// ── Langfristige Schwellenwerte ─────────────────────────────────
export const EVOLUTION_THRESHOLDS = {
  // Ästhetische Vielfalt
  MIN_MOOD_DIVERSITY:        0.40,  // Mind. 40% verschiedene Moods
  MAX_DOMINANT_MOOD_SHARE:   0.35,  // Keine Mood > 35%
  MIN_DOMAIN_DIVERSITY:      0.50,  // Mind. 50% der Domain-Familien vertreten
  // Newcomer-Integration
  MIN_NEWCOMER_RETENTION:    0.55,  // 55% der Newcomer nach 30 Tagen noch aktiv
  MIN_NEWCOMER_COLLAB_RATE:  0.25,  // 25% der Newcomer haben mind. 1 Collab
  // Bridge-Gesundheit
  MIN_BRIDGE_VITALITY:       0.30,  // 30% Bridge-Creator nicht saturiert
  MIN_BRIDGE_GENERATIVITY:   0.20,  // 20% der Bridges generieren neue Verbindungen
  // Generationsbalance
  MAX_VETERAN_DOMINANCE:     0.60,  // Max 60% Feed von Creators > 2 Jahre
  MIN_NEW_VOICE_RATIO:       0.20,  // Mind. 20% Stimmen < 6 Monate
  // Flexibilität
  MIN_SURPRISE_RATE:         0.15,  // Mind. 15% unerwartete Entdeckungen im Feed
  // Anti-Elite
  MAX_TOP_CREATOR_SHARE:     0.25,  // Top 10% Creator max 25% Feed
};

// ── 7E.2 — culturalDiversity() ─────────────────────────────────
/**
 * Gesamte kreative Vielfalt — der wichtigste Langzeit-Indikator.
 * Kombiniert: Domain, Mood, Stil, Herkunft, Generationen.
 */
export function culturalDiversity(creators = [], feedItems = []) {
  if (!creators.length) return { diversity: 0, level: 'unbekannt' };

  // 1. Domain-Vielfalt
  const DOMAIN_FAMILIES = {
    visual:['foto','design','video'], sonic:['musik','sound'], crafted:['keramik','textil'],
    written:['text','lyrik'], digital:['code','web'], body:['tanz','theater'],
  };
  const domainsPresent = new Set();
  for (const c of creators) {
    const text = [...(c.dna_tags||[]), c.talent||''].join(' ').toLowerCase();
    for (const [fam, kws] of Object.entries(DOMAIN_FAMILIES)) {
      if (kws.some(k => text.includes(k))) domainsPresent.add(fam);
    }
  }
  const domainDiversity = domainsPresent.size / Object.keys(DOMAIN_FAMILIES).length;

  // 2. Mood-Vielfalt
  const moodCount = {};
  for (const c of creators) {
    const moods = [...(c.mood_tags||[]), c.mood].filter(Boolean);
    for (const m of moods) moodCount[m] = (moodCount[m] || 0) + 1;
  }
  const totalMoodSignals = Object.values(moodCount).reduce((a, b) => a + b, 0);
  const dominantMoodShare = totalMoodSignals > 0
    ? Math.max(...Object.values(moodCount)) / totalMoodSignals : 0;
  const moodDiversity = clamp(1 - dominantMoodShare);

  // 3. Geografische Vielfalt
  const cities = new Set(creators.map(c => c.location_label?.toLowerCase().trim()).filter(Boolean));
  const geoDiversity = clamp(cities.size / 10);

  // 4. Alters-Mix (Plattform-Alter des Creators)
  const ageGroups = { fresh: 0, growing: 0, established: 0, veteran: 0 };
  for (const c of creators) {
    const days = daysSince(c.created_at);
    if (days < 30)        ageGroups.fresh++;
    else if (days < 180)  ageGroups.growing++;
    else if (days < 730)  ageGroups.established++;
    else                  ageGroups.veteran++;
  }
  const total = creators.length;
  const ageDiversity = clamp(
    (ageGroups.fresh / total > 0.10 ? 0.25 : 0) +
    (ageGroups.growing / total > 0.15 ? 0.25 : 0) +
    (ageGroups.established / total > 0.20 ? 0.25 : 0) +
    (ageGroups.veteran / total > 0.10 ? 0.25 : 0)
  );

  // Gesamtdiversität
  const diversity = clamp(
    domainDiversity * 0.35 + moodDiversity * 0.25 +
    geoDiversity    * 0.20 + ageDiversity  * 0.20
  );

  const level =
    diversity > 0.75 ? 'reich vielfältig' :
    diversity > 0.55 ? 'vielfältig'       :
    diversity > 0.35 ? 'mäßig vielfältig' : 'eingeschränkt';

  const warnings = [];
  if (domainDiversity < EVOLUTION_THRESHOLDS.MIN_DOMAIN_DIVERSITY)
    warnings.push('domain_monoculture_risk');
  if (dominantMoodShare > EVOLUTION_THRESHOLDS.MAX_DOMINANT_MOOD_SHARE)
    warnings.push('aesthetic_convergence');
  if (ageGroups.fresh / total < 0.08)
    warnings.push('newcomer_shortage');

  return {
    diversity:      Math.round(diversity * 100) / 100,
    level,
    warnings,
    breakdown: {
      domain:    Math.round(domainDiversity * 100) / 100,
      mood:      Math.round(moodDiversity   * 100) / 100,
      geo:       Math.round(geoDiversity    * 100) / 100,
      age:       Math.round(ageDiversity    * 100) / 100,
    },
    domainsPresent:    [...domainsPresent],
    dominantMoodShare: Math.round(dominantMoodShare * 100) / 100,
    ageGroups,
  };
}

// ── 7E.3 — aestheticDrift() ────────────────────────────────────
/**
 * Erkennt ästhetische Verengung — wenn ein Stil dominanter wird.
 * Monatlicher oder quartalsweiser Check.
 *
 * @param {Object} currentSnapshot   — { moodDist, domainDist }
 * @param {Object} previousSnapshot  — gleiche Struktur, 3 Monate vorher
 */
export function aestheticDrift(currentSnapshot = {}, previousSnapshot = null) {
  const { moodDist = {}, domainDist = {} } = currentSnapshot;

  // Dominanz-Analyse aktuell
  const totalMoods   = Object.values(moodDist).reduce((a, b) => a + b, 0) || 1;
  const moodEntries  = Object.entries(moodDist).sort(([, a], [, b]) => b - a);
  const topMoodShare = moodEntries[0]?.[1] / totalMoods || 0;
  const top3Share    = moodEntries.slice(0, 3).reduce((a, [, v]) => a + v, 0) / totalMoods;

  const totalDomains  = Object.values(domainDist).reduce((a, b) => a + b, 0) || 1;
  const domainEntries = Object.entries(domainDist).sort(([, a], [, b]) => b - a);
  const topDomainShare= domainEntries[0]?.[1] / totalDomains || 0;

  // Drift gegenüber Vormonat/Vorquartal
  let driftSignal = 0;
  let driftDescription = 'Keine Vergleichsdaten.';

  if (previousSnapshot) {
    const prevMoodDist   = previousSnapshot.moodDist   || {};
    const prevTotalMoods = Object.values(prevMoodDist).reduce((a, b) => a + b, 0) || 1;
    const prevTopShare   = Object.values(prevMoodDist).sort((a, b) => b - a)[0] / prevTotalMoods;

    driftSignal = topMoodShare - prevTopShare;  // Positiv = Verengung
    driftDescription = driftSignal > 0.05
      ? `Ästhetische Verengung: dominante Stimmung wächst (+${Math.round(driftSignal * 100)}%).`
      : driftSignal < -0.03
      ? 'Ästhetische Öffnung: mehr Vielfalt als zuvor.'
      : 'Ästhetische Stabilität — keine signifikante Drift.';
  }

  const hasDrift =
    topMoodShare   > EVOLUTION_THRESHOLDS.MAX_DOMINANT_MOOD_SHARE ||
    topDomainShare > EVOLUTION_THRESHOLDS.MAX_DOMINANT_MOOD_SHARE;

  const recommendations = [];
  if (hasDrift) {
    recommendations.push(`Stimmung "${moodEntries[0]?.[0]}" dominiert — andere Stimmungen sichtbarer machen.`);
    recommendations.push('Bridge-Creators mit anderem Stil stärker in Feed aufnehmen.');
  }

  return {
    topMoodShare:    Math.round(topMoodShare    * 100) / 100,
    top3MoodShare:   Math.round(top3Share       * 100) / 100,
    topDomainShare:  Math.round(topDomainShare  * 100) / 100,
    hasDrift,
    driftSignal:     Math.round(driftSignal     * 100) / 100,
    driftDescription,
    recommendations,
    // Aktuelle Top-Moods zur Dokumentation
    topMoods:        moodEntries.slice(0, 3).map(([m]) => m),
    topDomains:      domainEntries.slice(0, 3).map(([d]) => d),
  };
}

// ── 7E.2 — newcomerIntegration() ───────────────────────────────
/**
 * Wie warm werden neue Creators empfangen?
 * Misst: Retentionsrate, erste Kollaborationen, Resonanz-Tiefe.
 */
export function newcomerIntegration(creators = [], collaborations = []) {
  const now      = Date.now();
  const newcomers= creators.filter(c => daysSince(c.created_at) < 60);

  if (!newcomers.length) return { integration: 0, level: 'unknown', warnings: [] };

  // Retentionsrate (noch aktiv nach 30 Tagen)
  const still30 = newcomers.filter(c => {
    const age = daysSince(c.created_at);
    return age > 30 && age < 60 && c.is_available !== false;
  }).length;
  const retention30 = newcomers.filter(c => daysSince(c.created_at) > 30).length > 0
    ? still30 / newcomers.filter(c => daysSince(c.created_at) > 30).length
    : 1.0;

  // Erste Kollaboration
  const newcomerIds = new Set(newcomers.map(c => c.id));
  const newcomerCollabs = collaborations.filter(c =>
    newcomerIds.has(c.wirker_user_id) || newcomerIds.has(c.client_user_id)
  ).length;
  const collabRate = newcomers.length > 0 ? newcomerCollabs / newcomers.length : 0;

  // Resonanz mit bestehenden Creators
  const veterans = creators.filter(c => daysSince(c.created_at) > 180);
  let resonanceSum = 0; let pairs = 0;
  for (const n of newcomers.slice(0, 8)) {
    for (const v of veterans.slice(0, 8)) {
      const { resonance } = creativeResonance(n, v);
      resonanceSum += resonance; pairs++;
    }
  }
  const avgResonance = pairs > 0 ? resonanceSum / pairs : 0;

  const integration = clamp(
    retention30   * 0.40 +
    collabRate    * 0.35 +
    avgResonance  * 0.25
  );

  const warnings = [];
  if (retention30 < EVOLUTION_THRESHOLDS.MIN_NEWCOMER_RETENTION)
    warnings.push('newcomer_churn_risk');
  if (collabRate < EVOLUTION_THRESHOLDS.MIN_NEWCOMER_COLLAB_RATE)
    warnings.push('newcomer_isolation_risk');

  return {
    integration:  Math.round(integration * 100) / 100,
    level:
      integration > 0.70 ? 'warm und einladend' :
      integration > 0.50 ? 'offen'              :
      integration > 0.30 ? 'zurückhaltend'      : 'kalt',
    newcomerCount:newcomers.length,
    retention30:  Math.round(retention30  * 100) / 100,
    collabRate:   Math.round(collabRate   * 100) / 100,
    avgResonance: Math.round(avgResonance * 100) / 100,
    warnings,
    // Sanfte Empfehlung — nie als Alarm
    suggestion:  warnings.includes('newcomer_isolation_risk')
      ? 'Newcomer brauchen mehr Möglichkeiten zur Verbindung — Bridge-Creators als Brücke nutzen.'
      : null,
  };
}

// ── 7E.2 — bridgeVitality() ────────────────────────────────────
/**
 * Leben kreative Brücken noch?
 * Bridge Creators sind das Herzstück kultureller Offenheit.
 * Wenn sie saturiert oder inaktiv sind: Kultur verhärtet.
 */
export function bridgeVitality(creators = [], collaborations = []) {
  const bridges = creators.filter(c => (c._bridgeScore || c.bridge_score || 0) > 0.30);

  if (!bridges.length) return { vitality: 0, level: 'kritisch', bridgeCount: 0 };

  // Aktivitätsstatus der Bridges
  const activeBridges   = bridges.filter(c => c.is_available !== false);
  const saturatedBridges= bridges.filter(c => (c._saturation || 0) > 0.5);
  const freshBridges    = bridges.filter(c => daysSince(c.created_at) < 180);

  const activityRate    = activeBridges.length   / bridges.length;
  const saturationRate  = saturatedBridges.length / bridges.length;
  const freshnessRate   = freshBridges.length     / bridges.length;

  // Generativität: erzeugen Bridges neue Verbindungen?
  const bridgeIds = new Set(bridges.map(b => b.id));
  const bridgeCollabs = collaborations.filter(c =>
    bridgeIds.has(c.wirker_user_id) || bridgeIds.has(c.client_user_id)
  );
  const generativityRate = clamp(bridgeCollabs.length / Math.max(bridges.length, 1) / 3);

  const vitality = clamp(
    activityRate    * 0.30 +
    (1 - saturationRate) * 0.25 +
    freshnessRate   * 0.25 +
    generativityRate* 0.20
  );

  const warnings = [];
  if (vitality < EVOLUTION_THRESHOLDS.MIN_BRIDGE_VITALITY)
    warnings.push('bridge_decay');
  if (saturationRate > 0.5)
    warnings.push('bridges_overloaded');
  if (bridges.length / Math.max(creators.length, 1) < 0.05)
    warnings.push('insufficient_bridges');

  return {
    vitality:        Math.round(vitality      * 100) / 100,
    level:
      vitality > 0.70 ? 'lebendig'   :
      vitality > 0.50 ? 'stabil'     :
      vitality > 0.30 ? 'schwächer'  : 'kritisch',
    bridgeCount:     bridges.length,
    activeBridges:   activeBridges.length,
    saturatedBridges:saturatedBridges.length,
    generativityRate:Math.round(generativityRate * 100) / 100,
    warnings,
  };
}

// ── 7E.2 — creativePlurality() ─────────────────────────────────
/**
 * Viele verschiedene Stimmen hörbar?
 * Misst ob der Feed wirklich plural ist — nicht nur vielfältig auf dem Papier.
 */
export function creativePlurality(feedItems = [], creators = []) {
  if (!feedItems.length) return { plurality: 0, level: 'leer' };

  // Wie viele verschiedene Creators im Feed?
  const creatorIds     = new Set(feedItems.map(i => i.creator_id || i.wirker_user_id));
  const feedCreatorCount = creatorIds.size;
  const totalCreators  = creators.length || feedCreatorCount;

  // Top-Creator-Dominanz
  const creatorFreq = {};
  for (const item of feedItems) {
    const id = item.creator_id || item.wirker_user_id;
    if (id) creatorFreq[id] = (creatorFreq[id] || 0) + 1;
  }
  const frequencies = Object.values(creatorFreq).sort((a, b) => b - a);
  const top10Count  = Math.ceil(feedCreatorCount * 0.1);
  const top10Share  = frequencies.slice(0, top10Count).reduce((a, b) => a + b, 0) / feedItems.length;

  // Stimmungsbreite
  const moods = feedItems.map(i => i.mood || (i.mood_tags || [])[0]).filter(Boolean);
  const uniqueMoods = new Set(moods).size;
  const moodBreadth = clamp(uniqueMoods / 7);  // 7 Mood-Cluster

  // Newcomer-Anteil
  const newcomerItems = feedItems.filter(i => {
    const creator = creators.find(c => c.id === (i.creator_id || i.wirker_user_id));
    return creator && daysSince(creator.created_at) < 90;
  });
  const newcomerRatio = newcomerItems.length / feedItems.length;

  const plurality = clamp(
    (1 - top10Share)  * 0.40 +
    moodBreadth        * 0.30 +
    newcomerRatio      * 0.30
  );

  const warnings = [];
  if (top10Share > EVOLUTION_THRESHOLDS.MAX_TOP_CREATOR_SHARE)
    warnings.push('concentration_risk');
  if (newcomerRatio < EVOLUTION_THRESHOLDS.MIN_NEW_VOICE_RATIO)
    warnings.push('new_voices_suppressed');

  return {
    plurality:      Math.round(plurality    * 100) / 100,
    level:
      plurality > 0.70 ? 'plural'        :
      plurality > 0.50 ? 'mäßig plural'  :
      plurality > 0.30 ? 'eingeschränkt' : 'konzentriert',
    top10Share:     Math.round(top10Share  * 100) / 100,
    moodBreadth:    Math.round(moodBreadth * 100) / 100,
    newcomerRatio:  Math.round(newcomerRatio * 100) / 100,
    uniqueCreators: feedCreatorCount,
    warnings,
  };
}

// ── 7E.2 — localCulturalBalance() ──────────────────────────────
/**
 * Balance zwischen lokalen Kulturen.
 * Verhindert dass eine Stadt die Plattform dominiert.
 */
export function localCulturalBalance(creators = []) {
  const cityCount = {};
  for (const c of creators) {
    const city = c.location_label?.toLowerCase().trim() || 'unbekannt';
    cityCount[city] = (cityCount[city] || 0) + 1;
  }

  const total    = creators.length || 1;
  const entries  = Object.entries(cityCount).sort(([, a], [, b]) => b - a);
  const topCity  = entries[0];
  const topShare = topCity ? topCity[1] / total : 0;

  // Gini für geografische Verteilung
  const values = entries.map(([, v]) => v).sort((a, b) => a - b);
  const n = values.length;
  const gini = n > 1
    ? values.reduce((s, v, i) => s + (2 * i - n - 1) * v, 0) / (n * values.reduce((a, b) => a + b, 0))
    : 0;

  const balance = clamp(1 - gini);

  return {
    balance:     Math.round(balance   * 100) / 100,
    gini:        Math.round(gini      * 100) / 100,
    topCityShare:Math.round(topShare  * 100) / 100,
    topCity:     topCity?.[0] || null,
    cityCount:   entries.length,
    level:
      balance > 0.70 ? 'gut verteilt'  :
      balance > 0.50 ? 'mäßig'         :
      balance > 0.30 ? 'konzentriert'  : 'sehr konzentriert',
    warning: topShare > 0.50 ? `${topCity?.[0]} dominiert — lokale Diversifizierung empfohlen.` : null,
  };
}

// ── 7E.4 — generationalContinuity() ────────────────────────────
/**
 * Übergabe von Erfahrung zwischen Creator-Generationen.
 * Nicht: "Top Creator". Sondern: Wissen das weitergeht.
 */
export function generationalContinuity(creators = [], collaborations = []) {
  const veterans   = creators.filter(c => daysSince(c.created_at) > 365);
  const newcomers  = creators.filter(c => daysSince(c.created_at) < 90);
  const middleGen  = creators.filter(c => {
    const d = daysSince(c.created_at); return d >= 90 && d <= 365;
  });

  if (!veterans.length || !newcomers.length) {
    return { continuity: 0, level: 'noch nicht messbar' };
  }

  // Cross-generationale Kollaborationen
  const veteranIds  = new Set(veterans.map(c => c.id));
  const newcomerIds = new Set(newcomers.map(c => c.id));

  const crossGenCollabs = collaborations.filter(c => {
    const aIsVet = veteranIds.has(c.wirker_user_id);
    const bIsNew = newcomerIds.has(c.client_user_id);
    const bIsVet = veteranIds.has(c.client_user_id);
    const aIsNew = newcomerIds.has(c.wirker_user_id);
    return (aIsVet && bIsNew) || (bIsVet && aIsNew);
  }).length;

  const crossGenRate = crossGenCollabs / Math.max(newcomers.length, 1);

  // Resonanz zwischen Generationen
  let genResonance = 0; let pairs = 0;
  for (const v of veterans.slice(0, 6)) {
    for (const n of newcomers.slice(0, 6)) {
      const { resonance } = creativeResonance(v, n);
      genResonance += resonance; pairs++;
    }
  }
  const avgGenResonance = pairs > 0 ? genResonance / pairs : 0;

  const continuity = clamp(crossGenRate * 0.60 + avgGenResonance * 0.40);

  return {
    continuity:     Math.round(continuity      * 100) / 100,
    crossGenCollabs,
    crossGenRate:   Math.round(crossGenRate    * 100) / 100,
    avgGenResonance:Math.round(avgGenResonance * 100) / 100,
    generations: {
      veterans:  veterans.length,
      middleGen: middleGen.length,
      newcomers: newcomers.length,
    },
    level:
      continuity > 0.60 ? 'reich'         :
      continuity > 0.40 ? 'vorhanden'     :
      continuity > 0.20 ? 'beginnend'     : 'fehlend',
    description:
      continuity > 0.60
        ? 'Erfahrung fließt reich zwischen den Generationen.'
        : continuity > 0.40
        ? 'Generationsübergänge entstehen.'
        : 'Wenig Verbindung zwischen erfahrenen und neuen Creators.',
  };
}

// ── 7E.6 — antiEliteDrift() ────────────────────────────────────
/**
 * Erkennt und verhindert Creator-Kasten-Bildung.
 * Misst ob eine kleine Gruppe unverhältnismäßig dominiert.
 */
export function antiEliteDrift(creators = [], feedItems = [], collaborations = []) {
  if (!creators.length) return { eliteDrift: 0, safe: true };

  // Konzentrations-Analyse
  const bookingCount = {};
  for (const c of collaborations) {
    const id = c.wirker_user_id;
    if (id) bookingCount[id] = (bookingCount[id] || 0) + 1;
  }

  const sortedByBookings = Object.entries(bookingCount).sort(([, a], [, b]) => b - a);
  const total = Object.values(bookingCount).reduce((a, b) => a + b, 0) || 1;
  const top10 = Math.max(1, Math.ceil(creators.length * 0.10));
  const top10Bookings = sortedByBookings.slice(0, top10).reduce((a, [, v]) => a + v, 0);
  const eliteShare = top10Bookings / total;

  // Follower-Konzentration
  const followerCount = {};
  for (const c of creators) {
    if (c.follower_count) followerCount[c.id] = c.follower_count;
  }
  const totalFollows = Object.values(followerCount).reduce((a, b) => a + b, 0) || 1;
  const sortedFollowers = Object.values(followerCount).sort((a, b) => b - a);
  const top10FollowerShare = sortedFollowers.slice(0, top10).reduce((a, b) => a + b, 0) / totalFollows;

  const eliteDrift = clamp((eliteShare + top10FollowerShare) / 2);

  const safe = eliteDrift < EVOLUTION_THRESHOLDS.MAX_TOP_CREATOR_SHARE;

  return {
    eliteDrift:          Math.round(eliteDrift          * 100) / 100,
    bookingConcentration:Math.round(eliteShare           * 100) / 100,
    followerConcentration:Math.round(top10FollowerShare  * 100) / 100,
    safe,
    level:
      eliteDrift < 0.20 ? 'gesund'         :
      eliteDrift < 0.35 ? 'beobachten'     :
      eliteDrift < 0.50 ? 'Warnung'        : 'kritisch',
    recommendation: !safe
      ? 'Discovery-Boost für nicht-dominante Creators erhöhen. Newcomer aktiver in Feed einbeziehen.'
      : null,
  };
}

// ── 7E.6 — culturalFatigue() ───────────────────────────────────
/**
 * Erkennt kulturelle Erschöpfung — wenn alles sich gleich anfühlt.
 */
export function culturalFatigue(platformSignals = {}) {
  const {
    avgSessionDuration   = 10,    // Minuten — sinkend = Fatigue
    returnRate30d        = 0.50,  // Wiederkehrrate
    contentRepetitionRate= 0.20,  // Wie viel ist "schon gesehen"?
    surpriseRate         = 0.15,  // Wie oft etwas Unerwartetes?
    newConnectionRate    = 0.05,  // Neue Verbindungen pro Woche
  } = platformSignals;

  // Fatigue-Signale
  const fatigue = clamp(
    (1 - Math.min(returnRate30d / 0.60, 1)) * 0.25 +
    contentRepetitionRate                   * 0.25 +
    (1 - Math.min(surpriseRate / 0.15, 1))  * 0.30 +
    (1 - Math.min(newConnectionRate / 0.08, 1)) * 0.20
  );

  const antidotes = [];
  if (contentRepetitionRate > 0.25) antidotes.push('Exploration Floor erhöhen');
  if (surpriseRate < 0.10)          antidotes.push('Mehr Bridge-Creators in Feed');
  if (newConnectionRate < 0.03)     antidotes.push('Sanfte Verbindungsvorschläge aktivieren');
  if (returnRate30d < 0.35)         antidotes.push('Kulturelle Rituale aktivieren');

  return {
    fatigue:   Math.round(fatigue * 100) / 100,
    level:
      fatigue < 0.20 ? 'frisch'           :
      fatigue < 0.35 ? 'mild'             :
      fatigue < 0.55 ? 'merkbar'          : 'hoch',
    antidotes,
    signals: { returnRate30d, contentRepetitionRate, surpriseRate, newConnectionRate },
  };
}

// ── 7E.8 — culturalFlexibility() ───────────────────────────────
/**
 * Ist die Plattform noch offen für Überraschungen?
 * Misst: Entdeckungs-Offenheit, Exploration-Rate, Neue-Verbindungen.
 */
export function culturalFlexibility(creators = [], feedItems = [], platformSignals = {}) {
  const { surpriseRate = 0.15, explorationRate = 0.20 } = platformSignals;

  // Unbekannte Verbindungen
  const bridgeCreators = creators.filter(c => (c._bridgeScore || 0) > 0.30);
  const bridgeRatio    = creators.length > 0 ? bridgeCreators.length / creators.length : 0;

  // Feed-Exploration
  const feedBridgeRatio = feedItems.length > 0
    ? feedItems.filter(i => (i._bridgeScore || 0) > 0.2).length / feedItems.length
    : 0;

  const flexibility = clamp(
    Math.min(surpriseRate   / 0.15, 1) * 0.30 +
    Math.min(explorationRate/ 0.20, 1) * 0.25 +
    Math.min(bridgeRatio    / 0.10, 1) * 0.25 +
    Math.min(feedBridgeRatio/ 0.08, 1) * 0.20
  );

  return {
    flexibility:  Math.round(flexibility    * 100) / 100,
    bridgeRatio:  Math.round(bridgeRatio    * 100) / 100,
    level:
      flexibility > 0.75 ? 'sehr offen'  :
      flexibility > 0.55 ? 'offen'       :
      flexibility > 0.35 ? 'mäßig'       : 'starr',
    recommendation: flexibility < 0.40
      ? 'Kulturelle Frische einladen: saisonale Themen, neue Rituale, Bridge-Förderung.'
      : null,
  };
}

// ── 7E.5 — culturalMemorySnapshot() ────────────────────────────
/**
 * Kulturelle Erinnerung — monatlicher Snapshot.
 * Nicht "Best of". Sondern: was hat diese Periode geprägt?
 */
export function culturalMemorySnapshot(creators = [], collaborations = [], works = []) {
  const season = getSeason();

  // Dominante Themen dieser Periode
  const allTags = works.flatMap(w => w.tags || w.dna_tags || []);
  const tagFreq = {};
  for (const t of allTags) tagFreq[t] = (tagFreq[t] || 0) + 1;
  const topThemes = Object.entries(tagFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  // Neue kreative Verbindungen (diese Periode)
  const newConnections = collaborations.filter(c => daysSince(c.created_at) < 30).length;

  // Aufkommende Bridge-Creators
  const emergingBridges = creators
    .filter(c => (c._bridgeScore || 0) > 0.25 && daysSince(c.created_at) < 180)
    .length;

  return {
    period:          `${season.name} ${new Date().getFullYear()}`,
    season:          season.key,
    topThemes,
    newConnections,
    emergingBridges,
    creatorCount:    creators.length,
    description:     `${season.name}: ${topThemes.slice(0, 2).join(', ')} prägten diese Periode.`,
    // Privat — nie als "Best of" verwenden
    _isArchival:     true,
  };
}

// ── 7E.8 — longTermHealthScore() ───────────────────────────────
/**
 * Gesamter Langzeit-Kulturgesundheits-Score.
 * Aggregiert alle Evolution-Dimensionen.
 */
export function longTermHealthScore(data = {}) {
  const {
    creators = [], feedItems = [], collaborations = [],
    platformSignals = {}, snapshots = {},
  } = data;

  const diversity     = culturalDiversity(creators, feedItems);
  const integration   = newcomerIntegration(creators, collaborations);
  const bridges       = bridgeVitality(creators, collaborations);
  const plurality     = creativePlurality(feedItems, creators);
  const balance       = localCulturalBalance(creators);
  const generations   = generationalContinuity(creators, collaborations);
  const elite         = antiEliteDrift(creators, feedItems, collaborations);
  const fatigue       = culturalFatigue(platformSignals);
  const flexibility   = culturalFlexibility(creators, feedItems, platformSignals);

  // Drift falls Snapshots verfügbar
  const drift = snapshots.current && snapshots.previous
    ? aestheticDrift(snapshots.current, snapshots.previous)
    : null;

  const score = clamp(
    diversity.diversity     * 0.20 +
    integration.integration * 0.15 +
    bridges.vitality        * 0.15 +
    plurality.plurality     * 0.15 +
    generations.continuity  * 0.10 +
    (1 - elite.eliteDrift)  * 0.10 +
    (1 - fatigue.fatigue)   * 0.10 +
    flexibility.flexibility * 0.05
  );

  // Alle Warnungen aggregieren
  const allWarnings = [
    ...diversity.warnings,
    ...integration.warnings,
    ...bridges.warnings,
    ...plurality.warnings,
    elite.recommendation ? ['elite_concentration'] : [],
  ].flat().filter(Boolean);

  return {
    score:   Math.round(score * 100) / 100,
    level:
      score > 0.75 ? 'kulturell vital'    :
      score > 0.60 ? 'kulturell stabil'   :
      score > 0.45 ? 'kulturell fragil'   : 'kulturell krisenhaft',
    dimensions: { diversity, integration, bridges, plurality, balance, generations, elite, fatigue, flexibility },
    drift,
    allWarnings: [...new Set(allWarnings)],
    timestamp: new Date().toISOString(),
    _isInternal: true,  // Nie öffentlich zeigen
  };
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCulturalEvolution() {
  const [creators,       setCreators]       = useState([]);
  const [feedItems,      setFeedItems]      = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading,        setLoading]        = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorsRes, collabsRes, worksRes] = await Promise.all([
        supabase.from('profiles').select('id, dna_tags, talent, mood, mood_tags, location_label, is_available, created_at, bridge_score, follower_count').limit(300),
        supabase.from('bookings').select('id, wirker_user_id, client_user_id, status, created_at').eq('status', 'completed').limit(200),
        supabase.from('works').select('id, creator_id, tags, mood, created_at, bridge_score:_bridgeScore').limit(200),
      ]);
      setCreators(creatorsRes.data   || []);
      setCollaborations(collabsRes.data || []);
      setFeedItems(worksRes.data     || []);
    } catch (err) {
      console.error('[CulturalEvolution]', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const healthScore = useMemo(() =>
    longTermHealthScore({ creators, feedItems, collaborations }),
    [creators, feedItems, collaborations]
  );

  return { healthScore, creators, loading, reload: load };
}
