// src/lib/economics/index.js
// HUI — Economic Balance Engine — Phase 7F
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Ökonomie soll kreative Kultur ermöglichen — nicht aushöhlen.
// HUI-Ökonomie basiert auf: fair · ruhig · nicht-extraktiv.
//
// WAS DIESES SYSTEM SCHÜTZT:
//   ✅ Sichtbarkeit bleibt kauffreiisch (nie bezahlbar)
//   ✅ Booking-Pacing schützt vor Burnout
//   ✅ ökonomische Fairness wird kontinuierlich gemessen
//   ✅ kulturelle Integrität hat Vorrang vor Umsatz
//
// WAS DIESES SYSTEM VERHINDERT:
//   ❌ Pay-to-Rank: Discovery nie Umsatz-basiert
//   ❌ Visibility-for-Payment: Sichtbarkeit nie käuflich
//   ❌ Hustle-Ökonomie: Burnout-Signale werden erkannt
//   ❌ Ökonomische Elitenbildung: Konzentrations-Checks
//   ❌ Kulturelle Kommerzialisierung: Impact-Projekte bleiben frei
//
// FUNKTIONEN:
//   economicPressure()          → Wie viel ökonomischer Druck liegt an?
//   creatorSustainability()     → Burnout-aware Creator-Ökonomie
//   healthyMonetization()       → Plattform-Umsatz vs. Kultur-Gesundheit
//   visibilityFairness()        → Sichtbarkeit nie durch Geld beeinflusst
//   economicDiversity()         → Einkommensvielfalt der Creators
//   collaborationAccessibility()→ Sind Zusammenarbeiten für alle zugänglich?
//   econSafetyCheck()           → Warnt vor Monetarisierungs-Drift
//   gentleEconomyScore()        → Gesamter Gesundheits-Score
// ═══════════════════════════════════════════════════════════════

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
function daysSince(d) { return d ? (Date.now() - new Date(d).getTime()) / 86400000 : 0; }

// ── 7F.3 — Non-Extractive Principles (technisch erzwungen) ──────

export const NON_EXTRACTIVE_RULES = {
  // Was auf HUI NIEMALS passiert
  forbidden: {
    paidVisibility:       true,   // Bezahlte Sichtbarkeit: nie
    payToRank:            true,   // Pay-to-Rank: nie
    reachThrottling:      true,   // Künstliche Reichweitenverknappung: nie
    dataMonetization:     true,   // Nutzerdaten verkaufen: nie
    verifiedForSale:      true,   // Verified-Badge käuflich: nie
    adTargeting:          true,   // Verhaltens-Targeting: nie
    discoveryBias:        true,   // Discovery nach Umsatz: nie
  },
  // Was erlaubt ist
  allowed: {
    bookingCommission:    0.10,   // Max. 10% Provision auf Buchungen
    voluntaryMembership:  true,   // Freiwillige Mitgliedschaft ohne Sichtbarkeits-Vorteil
    localCultureFunds:    true,   // Lokale Kulturförderung
    creatorTools:         true,   // Premium-Tools (nie Reichweite)
    communityFunds:       true,   // Gemeinschafts-Fonds (opt-in)
  },
  // Discovery-Garantie: was NIE die Sichtbarkeit beeinflusst
  discoveryNeverAffectedBy: [
    'payment_history',
    'booking_volume',
    'subscription_tier',
    'verified_status',    // Verified ≠ mehr Sichtbarkeit
    'platform_spending',
    'referral_revenue',
  ],
};

// ── 7F.2 — economicPressure() ───────────────────────────────────
/**
 * Misst wie viel ökonomischer Druck auf der Plattform liegt.
 * Hoher Druck = kulturelle Gefahr.
 *
 * Signale: Booking-Häufigkeit, Ablehungsrate, Burnout-Proxies, Pricing-Drift.
 */
export function economicPressure(creators = [], collaborations = []) {
  if (!creators.length) return { pressure: 0, level: 'unbekannt' };

  // Booking-Dichte (Buchungen pro Creator pro Woche)
  const recentCollabs = collaborations.filter(c => daysSince(c.created_at) < 30);
  const bookingDensity = recentCollabs.length / Math.max(creators.length, 1) / 4.3; // /Woche

  // Überlastungs-Proxies: Creators die > 3 aktive Bookings haben
  const overloadedCreators = creators.filter(c => (c.active_booking_count || 0) > 3).length;
  const overloadRate = overloadedCreators / Math.max(creators.length, 1);

  // Ablehnungsrate (hoch = Creators wählen selektiv)
  const declinedCollabs = collaborations.filter(c => c.status === 'declined').length;
  const totalCollabs    = collaborations.length || 1;
  const rejectionRate   = declinedCollabs / totalCollabs;

  // Preis-Drift: steigen Preise schnell?
  const avgPrice = collaborations.reduce((a, c) => a + (c.amount_eur || 0), 0) / Math.max(collaborations.length, 1);

  const pressure = clamp(
    bookingDensity  * 0.35 +
    overloadRate    * 0.40 +
    (1 - rejectionRate) * 0.15 +   // Niedrige Ablehnungsrate = hoher Druck (niemand lehnt ab)
    Math.min(avgPrice / 500, 1) * 0.10
  );

  const warnings = [];
  if (overloadRate > 0.20) warnings.push('creator_overload_risk');
  if (bookingDensity > 2)  warnings.push('booking_velocity_high');
  if (rejectionRate < 0.05) warnings.push('low_rejection_may_signal_desperation');

  return {
    pressure:      Math.round(pressure * 100) / 100,
    level:
      pressure < 0.25 ? 'gesund'      :
      pressure < 0.45 ? 'moderat'     :
      pressure < 0.65 ? 'erhöht'      : 'kritisch',
    overloadRate:  Math.round(overloadRate * 100) / 100,
    bookingDensity:Math.round(bookingDensity * 10) / 10,
    rejectionRate: Math.round(rejectionRate * 100) / 100,
    avgPrice:      Math.round(avgPrice),
    warnings,
  };
}

// ── 7F.2 + 7F.4 — creatorSustainability() ──────────────────────
/**
 * Burnout-aware Creator-Ökonomie.
 * Misst: Pacing, Erholung, ökonomische Sicherheit.
 * Schützt: kreative Praxis über kurzfristigen Umsatz.
 */
export function creatorSustainability(creator = {}, bookings = []) {
  if (!creator?.id) return null;

  const creatorBookings = bookings.filter(b =>
    b.wirker_user_id === creator.id || b.creator_id === creator.id
  );

  // Pacing: durchschnittliche Zeit zwischen abgeschlossenen Buchungen
  const completedBookings = creatorBookings
    .filter(b => b.status === 'completed')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let avgDaysBetweenBookings = 30;  // Default: 30 Tage
  if (completedBookings.length >= 2) {
    const gaps = completedBookings.slice(1).map((b, i) =>
      daysSince(b.created_at) - daysSince(completedBookings[i].created_at)
    );
    avgDaysBetweenBookings = Math.abs(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }

  // Aktive Buchungen gleichzeitig
  const activeNow = creatorBookings.filter(b =>
    ['accepted', 'scheduled', 'in_progress'].includes(b.status)
  ).length;

  // Erholungs-Phasen (Tage ohne Buchung in letzten 90 Tagen)
  const last90Days = creatorBookings.filter(b => daysSince(b.created_at) < 90);
  const busyDays   = new Set(last90Days.map(b =>
    new Date(b.created_at).toDateString()
  )).size;
  const restDaysRatio = Math.max(0, (90 - busyDays) / 90);

  // Ökonomische Basis: hat Creator genug um ruhig zu schaffen?
  const avgEarnings = completedBookings.slice(0, 10)
    .reduce((a, b) => a + (b.amount_eur || 0), 0) / Math.max(completedBookings.slice(0, 10).length, 1);

  // Nachhaltigkeits-Score
  const sustainability = clamp(
    Math.min(avgDaysBetweenBookings / 14, 1) * 0.30 +  // Raum zwischen Projekten
    Math.max(0, 1 - activeNow / 3)           * 0.30 +  // Nicht überladen
    restDaysRatio                             * 0.25 +  // Erholung
    Math.min(avgEarnings / 300, 1)            * 0.15    // Faire Bezahlung
  );

  // Pacing-Empfehlung
  const HEALTHY_PACING = {
    max_active:       3,   // Max 3 aktive Projekte gleichzeitig
    min_rest_days:    7,   // Mind. 7 Tage Pause zwischen abgeschlossenen Projekten
    max_per_month:    4,   // Max 4 Buchungen/Monat für gesunde Praxis
  };

  const pacingIssues = [];
  if (activeNow >= HEALTHY_PACING.max_active)
    pacingIssues.push(`${activeNow} aktive Projekte — vielleicht ist eine Pause angebracht.`);
  if (avgDaysBetweenBookings < HEALTHY_PACING.min_rest_days)
    pacingIssues.push('Sehr kurze Abstände zwischen Projekten — Erholung ist auch kreative Zeit.');

  return {
    sustainability:        Math.round(sustainability       * 100) / 100,
    level:
      sustainability > 0.70 ? 'nachhaltig'   :
      sustainability > 0.50 ? 'ausgewogen'   :
      sustainability > 0.30 ? 'angespannt'   : 'erschöpfend',
    activeNow,
    avgDaysBetweenBookings:Math.round(avgDaysBetweenBookings),
    restDaysRatio:         Math.round(restDaysRatio        * 100) / 100,
    avgEarnings:           Math.round(avgEarnings),
    pacingIssues,
    healthyPacing:         HEALTHY_PACING,
    // Sanfte Hinweise — nie Druck
    suggestion: pacingIssues.length > 0
      ? pacingIssues[0]
      : null,
  };
}

// ── 7F.2 — healthyMonetization() ───────────────────────────────
/**
 * Plattform-Umsatz vs. kulturelle Gesundheit.
 * Stellt sicher: mehr Umsatz ≠ weniger Kultur.
 *
 * @param {Object} platformData — { totalRevenue, bookingCount, avgBookingValue,
 *                                  creatorBurnoutRate, newcomerRetention, diversity }
 */
export function healthyMonetization(platformData = {}) {
  const {
    totalRevenue        = 0,
    bookingCount        = 0,
    avgBookingValue     = 0,
    creatorBurnoutRate  = 0,    // % Creators die inaktiv werden nach intensiver Phase
    newcomerRetention   = 0.60, // % Newcomer die nach 30 Tagen noch aktiv
    culturalDiversity   = 0.60, // aus culturalEvolution
    avgCollabQuality    = 0.70, // subjektiv — aus Empfehlungsrate
  } = platformData;

  // Gesundheits-Indikatoren
  const burnoutPenalty = creatorBurnoutRate * 0.4;
  const retentionScore = newcomerRetention;
  const qualityScore   = avgCollabQuality;
  const diversityScore = culturalDiversity;

  // Monetarisierungs-Gesundheit
  const monetizationHealth = clamp(
    retentionScore   * 0.30 +
    qualityScore     * 0.25 +
    diversityScore   * 0.25 +
    (1 - burnoutPenalty) * 0.20
  );

  // Umsatz-Effizienz: Umsatz pro gesundem Creator (nicht pro Creator total)
  const healthyRevEfficiency = totalRevenue > 0 && bookingCount > 0
    ? (totalRevenue / bookingCount) * monetizationHealth
    : 0;

  const issues = [];
  if (creatorBurnoutRate > 0.15) issues.push('creator_burnout_risk');
  if (newcomerRetention < 0.40)  issues.push('newcomer_loss_risk');
  if (culturalDiversity < 0.40)  issues.push('cultural_homogenization_risk');

  return {
    health:       Math.round(monetizationHealth * 100) / 100,
    level:
      monetizationHealth > 0.75 ? 'kulturell gesund'  :
      monetizationHealth > 0.55 ? 'ausgewogen'        :
      monetizationHealth > 0.35 ? 'angespannt'        : 'kritisch',
    issues,
    // Revenue-Metriken (intern — nie öffentlich als Wachstums-Ziel)
    _private: {
      totalRevenue,
      bookingCount,
      avgBookingValue:      Math.round(avgBookingValue),
      healthyRevEfficiency: Math.round(healthyRevEfficiency),
    },
    recommendation: issues.length > 0
      ? 'Kulturelle Gesundheit vor Umsatzwachstum priorisieren.'
      : null,
  };
}

// ── 7F.2 + 7F.7 — visibilityFairness() ────────────────────────
/**
 * Sichtbarkeit nie durch Geld beeinflusst.
 * Überprüft: ist die Discovery wirklich unabhängig von Zahlungsfähigkeit?
 *
 * @param {Array} creators    — mit payment_history
 * @param {Array} feedItems   — aktuelle Discovery-Slots
 */
export function visibilityFairness(creators = [], feedItems = []) {
  if (!creators.length || !feedItems.length) return { fair: true, score: 1 };

  // Korrelations-Check: bezahlende Creators vs. Discovery-Slots
  const paidCreatorIds = new Set(
    creators.filter(c => c.subscription_tier && c.subscription_tier !== 'free').map(c => c.id)
  );

  const feedPaidShare = feedItems.filter(i =>
    paidCreatorIds.has(i.creator_id || i.wirker_user_id)
  ).length / feedItems.length;

  const platformPaidShare = paidCreatorIds.size / Math.max(creators.length, 1);

  // Wenn bezahlende Creators > 15% mehr Discovery als ihr Anteil: Warnung
  const biasRatio = platformPaidShare > 0
    ? feedPaidShare / platformPaidShare
    : 1;

  const fair  = biasRatio <= 1.15;  // Max 15% relativer Vorteil erlaubt
  const score = clamp(1 - Math.max(0, biasRatio - 1));

  return {
    fair,
    score:            Math.round(score         * 100) / 100,
    biasRatio:        Math.round(biasRatio     * 100) / 100,
    feedPaidShare:    Math.round(feedPaidShare  * 100) / 100,
    platformPaidShare:Math.round(platformPaidShare * 100) / 100,
    status:  fair ? '✅ Sichtbarkeit ist kauffreiisch' : '⚠ Ökonomischer Bias erkannt',
    action:  !fair
      ? 'Discovery-Algorithmus auf Umsatz-Unabhängigkeit prüfen. Paid-Creator-Anteil im Feed drosseln.'
      : null,
  };
}

// ── 7F.2 — economicDiversity() ─────────────────────────────────
/**
 * Einkommensvielfalt der Creators.
 * Verhindert: wenige verdienen alles, viele verdienen nichts.
 */
export function economicDiversity(bookings = [], creators = []) {
  if (!bookings.length || !creators.length) return { diversity: 0, gini: 0, level: 'unbekannt' };

  // Einnahmen pro Creator
  const earnings = {};
  for (const b of bookings.filter(b => b.status === 'completed')) {
    const id = b.wirker_user_id;
    if (id) earnings[id] = (earnings[id] || 0) + (b.amount_eur || 0);
  }

  // Creators ohne Einnahmen
  const creatorIds = creators.map(c => c.id);
  const earningsArray = creatorIds.map(id => earnings[id] || 0);

  // Gini-Koeffizient
  const sorted = [...earningsArray].sort((a, b) => a - b);
  const n = sorted.length;
  const totalEarnings = sorted.reduce((a, b) => a + b, 0) || 1;
  const gini = sorted.reduce((s, v, i) => s + (2 * i - n - 1) * v, 0) / (n * totalEarnings);

  // Anteil Creators ohne jegliche Einnahmen
  const zeroEarningsRate = earningsArray.filter(e => e === 0).length / n;

  const diversity = clamp(
    (1 - Math.abs(gini)) * 0.60 +
    (1 - zeroEarningsRate) * 0.40
  );

  return {
    diversity:       Math.round(diversity         * 100) / 100,
    gini:            Math.round(Math.abs(gini)    * 100) / 100,
    zeroEarningsRate:Math.round(zeroEarningsRate  * 100) / 100,
    level:
      diversity > 0.70 ? 'fair verteilt'   :
      diversity > 0.50 ? 'mäßig verteilt'  :
      diversity > 0.30 ? 'ungleich'        : 'stark konzentriert',
    warning: gini > 0.50
      ? 'Einkommens-Konzentration hoch — Discovery für neue und mittlere Creators stärken.'
      : null,
    // Intern — nie als öffentliche Ungleichheits-Karte
    _isInternal: true,
  };
}

// ── 7F.2 — collaborationAccessibility() ────────────────────────
/**
 * Sind Zusammenarbeiten für alle zugänglich — nicht nur für Gut-Betuchte?
 * Misst: Preis-Verteilung, Zugangshürden, ökonomische Barrieren.
 */
export function collaborationAccessibility(bookings = [], creators = []) {
  const completed = bookings.filter(b => b.status === 'completed' && b.amount_eur > 0);
  if (!completed.length) return { accessibility: 1, level: 'offen' };

  const prices    = completed.map(b => b.amount_eur).sort((a, b) => a - b);
  const medianPrice = prices[Math.floor(prices.length / 2)] || 0;
  const minPrice    = prices[0] || 0;
  const maxPrice    = prices[prices.length - 1] || 0;

  // Preisband-Breite: viele verschiedene Preispunkte = zugänglicher
  const priceRange  = maxPrice - minPrice;
  const spreadScore = clamp(priceRange / 500);  // 500€ Spanne = gut

  // Freie/günstige Angebote vorhanden?
  const affordableShare = prices.filter(p => p < 100).length / prices.length;

  // Kollaborationen unter 50€ (Community-Niveau)
  const communityBookings = completed.filter(b => b.amount_eur < 50).length;
  const communityRate = communityBookings / completed.length;

  const accessibility = clamp(
    spreadScore     * 0.30 +
    affordableShare * 0.40 +
    communityRate   * 0.30
  );

  return {
    accessibility:  Math.round(accessibility * 100) / 100,
    medianPrice:    Math.round(medianPrice),
    priceRange:     Math.round(priceRange),
    affordableShare:Math.round(affordableShare  * 100) / 100,
    communityRate:  Math.round(communityRate    * 100) / 100,
    level:
      accessibility > 0.70 ? 'sehr offen'   :
      accessibility > 0.50 ? 'offen'        :
      accessibility > 0.30 ? 'eingeschränkt':
                             'elitär',
    warning: accessibility < 0.30
      ? 'Zugangshürde zu hoch — Community-Angebote und günstigere Formate fördern.'
      : null,
  };
}

// ── 7F.7 — econSafetyCheck() ───────────────────────────────────
/**
 * Warnt vor Monetarisierungs-Drift.
 * Kombiniert alle ökonomischen Signale zu einem Sicherheits-Check.
 *
 * @returns {{ safe, issues, urgency, recommendations }}
 */
export function econSafetyCheck(data = {}) {
  const {
    creators = [], bookings = [], feedItems = [],
    platformData = {},
  } = data;

  const issues       = [];
  const urgent       = [];
  const recommendations = [];

  // 1. Visibility Fairness
  const visibility = visibilityFairness(creators, feedItems);
  if (!visibility.fair) {
    issues.push('visibility_bias');
    urgent.push('SOFORT: Discovery-Algorithmus auf Umsatz-Unabhängigkeit prüfen.');
  }

  // 2. Booking Velocity
  const recentBooks = bookings.filter(b => daysSince(b.created_at) < 7).length;
  const bookingVelocity = recentBooks / Math.max(creators.length, 1);
  if (bookingVelocity > 0.5) {
    issues.push('booking_velocity_risk');
    recommendations.push('Sanftes Booking-Pacing einführen — max 3 aktive Projekte pro Creator.');
  }

  // 3. Economic Diversity
  const ecoDiv = economicDiversity(bookings, creators);
  if (ecoDiv.gini > 0.50) {
    issues.push('economic_concentration');
    recommendations.push('Einkommens-Konzentration: Bridge Creators und Newcomer in Discovery stärken.');
  }

  // 4. Collaboration Accessibility
  const access = collaborationAccessibility(bookings, creators);
  if (access.accessibility < 0.30) {
    issues.push('accessibility_barrier');
    urgent.push('Zugangshürde zu hoch: günstigere Kollaborations-Formate ermöglichen.');
  }

  // 5. Monetization Health
  const monHealth = healthyMonetization(platformData);
  if (monHealth.health < 0.40) {
    issues.push('monetization_culture_conflict');
    urgent.push('Ökonomischer Druck gefährdet kulturelle Gesundheit.');
  }

  return {
    safe:          issues.length === 0,
    issues:        [...new Set(issues)],
    urgentActions: urgent,
    recommendations,
    urgency:
      urgent.length > 0 ? 'hoch'    :
      issues.length > 2 ? 'mittel'  :
      issues.length > 0 ? 'niedrig' : 'keine',
    visibility,
    economicDiversity: ecoDiv,
    accessibility:     access,
    monetizationHealth:monHealth,
  };
}

// ── 7F.9 — gentleEconomyScore() ────────────────────────────────
/**
 * Gesamter Gentle Economy Score.
 * Misst: wie gut schützt die Plattform kreative Kultur trotz Ökonomie?
 */
export function gentleEconomyScore(data = {}) {
  const {
    creators = [], bookings = [], feedItems = [],
    platformData = {},
  } = data;

  const pressure  = economicPressure(creators, bookings);
  const visibility= visibilityFairness(creators, feedItems);
  const ecoDiv    = economicDiversity(bookings, creators);
  const access    = collaborationAccessibility(bookings, creators);
  const monHealth = healthyMonetization(platformData);

  const score = clamp(
    (1 - pressure.pressure) * 0.20 +
    visibility.score         * 0.25 +
    ecoDiv.diversity         * 0.20 +
    access.accessibility     * 0.20 +
    monHealth.health         * 0.15
  );

  const allIssues = [
    ...pressure.warnings,
    ...(visibility.fair ? [] : ['visibility_bias']),
    ...(ecoDiv.warning  ? ['economic_concentration'] : []),
    ...(access.warning  ? ['accessibility_barrier']  : []),
    ...(monHealth.issues),
  ].filter(Boolean);

  return {
    score:   Math.round(score * 100) / 100,
    level:
      score > 0.80 ? 'sanfte Ökonomie'     :
      score > 0.65 ? 'ausgewogen'          :
      score > 0.45 ? 'kulturelle Spannung' : 'kritisch',
    dimensions: { pressure, visibility, economicDiversity: ecoDiv, access, monHealth },
    allIssues: [...new Set(allIssues)],
    timestamp: new Date().toISOString(),
    _isInternal: true,
  };
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useGentleEconomy() {
  const [creators, setCreators] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorsRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('id, subscription_tier, active_booking_count, is_available, created_at').limit(300),
        supabase.from('bookings').select('id, wirker_user_id, client_user_id, status, amount_eur, created_at').limit(500),
      ]);
      setCreators(creatorsRes.data || []);
      setBookings(bookingsRes.data  || []);
    } catch (err) {
      console.error('[GentleEconomy]', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const score = useMemo(() =>
    gentleEconomyScore({ creators, bookings }),
    [creators, bookings]
  );

  const safety = useMemo(() =>
    econSafetyCheck({ creators, bookings }),
    [creators, bookings]
  );

  return { score, safety, creators, bookings, loading, reload: load };
}
