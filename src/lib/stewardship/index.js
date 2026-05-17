// src/lib/stewardship/index.js
// HUI — Stewardship Engine — Phase 7G
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Stewardship = Pflege. Nicht Kontrolle.
// HUI ist Hüter — nicht Besitzer — seiner Gemeinschaft.
//
// ALLE FUNKTIONEN:
//   governanceHealth()       → Wie gesund ist die Plattform-Governance?
//   communityTrust()         → Wie viel Vertrauen hat die Gemeinschaft?
//   stewardshipBalance()     → Machtbalance zwischen Plattform und Community
//   culturalTransparency()   → Wie transparent sind Entscheidungen?
//   decisionImpact()         → Welchen kulturellen Impact hat eine Entscheidung?
//   communityRepresentation()→ Werden alle Stimmen gehört?
//   softModerationHealth()   → Ist Moderation restaurativ statt strafend?
//   powerBalanceCheck()      → Erkennt Machtkonzentration
//   stewardshipScore()       → Gesamter Governance-Score
// ═══════════════════════════════════════════════════════════════

import { antiEliteDrift }   from '@/lib/culturalEvolution/index';
import { econSafetyCheck }  from '@/lib/economics/index';
import { getSeason }        from '@/lib/culture/index';

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
function daysSince(d) { return d ? (Date.now() - new Date(d).getTime()) / 86400000 : 0; }

// ── Governance-Grundsätze (technisch verankert) ─────────────────
export const STEWARDSHIP_PRINCIPLES = {
  transparency: {
    label:       'Transparenz',
    description: 'Alle relevanten Plattformänderungen werden öffentlich erklärt.',
    technically: 'PLATFORM_CHANGELOG + decisionImpact()',
  },
  accountability: {
    label:       'Verantwortung',
    description: 'Fehler werden anerkannt — nicht minimiert oder begraben.',
    technically: 'Öffentliche Post-Mortems bei kritischen Fehlern',
  },
  participation: {
    label:       'Partizipation',
    description: 'Gemeinschaft wird gehört — nicht nur informiert.',
    technically: 'communityRepresentation() + saisonale Konsultationen',
  },
  longevity: {
    label:       'Langfristigkeit',
    description: 'Entscheidungen werden für Jahr 7 gemessen — nicht für Quartal 3.',
    technically: 'longTermHealthScore() als primäre Governance-Metrik',
  },
};

// Moderation-Grundsätze
export const MODERATION_PRINCIPLES = {
  restorativeFirst:   true,    // Wiederherstellung vor Bestrafung
  deescalationFirst:  true,    // Deeskalation vor Enforcement
  contextualReview:   true,    // Kontext vor Regelanwendung
  humanReviewPref:    true,    // Mensch vor Algorithmus bei Zweifelsfällen
  culturalSensitivity:true,    // Kulturelle Vielfalt berücksichtigen
  // Was NIE passiert
  never: {
    shadowBanning:          false,  // Schatten-Bans: nie
    silentRemoval:          false,  // Stille Entfernung: nie
    automatedPermanentBan:  false,  // Automatischer Permanent-Ban: nie
    punishmentWithoutContext:false, // Strafe ohne Erklärung: nie
  },
};

// ── 7G.2 — governanceHealth() ──────────────────────────────────
/**
 * Wie gesund ist die aktuelle Plattform-Governance?
 * Misst: Transparenz-Rate, Konsultations-Tiefe, Moderation-Qualität.
 */
export function governanceHealth(governanceData = {}) {
  const {
    changelogEntries30d       = 0,   // Öffentliche Changelog-Einträge letzte 30 Tage
    consultationsHeld90d      = 0,   // Community-Konsultationen letzte 90 Tage
    moderationAppealRate      = 0.05,// % Moderationsentscheidungen die angefochten werden
    moderationOverturnRate    = 0.20,// % angefochtene die umgekehrt werden (gesunde Rate)
    algorithmChangesExplained = 1.0, // % Algo-Änderungen die erklärt wurden
    communityFeedbackActed    = 0.30,// % Community-Feedback das zu Änderungen führte
  } = governanceData;

  // Transparenz-Score
  const transparencyScore = clamp(
    Math.min(changelogEntries30d / 4, 1) * 0.40 +  // Mind. 4 Einträge/Monat
    algorithmChangesExplained            * 0.60
  );

  // Partizipations-Score
  const participationScore = clamp(
    Math.min(consultationsHeld90d / 3, 1) * 0.50 +  // Mind. 3/Quartal
    Math.min(communityFeedbackActed / 0.3, 1) * 0.50
  );

  // Moderation-Qualität
  // Gesunde Appeal-Rate: 3-10% (zu niedrig = Angst, zu hoch = Chaos)
  const appealHealthy = moderationAppealRate >= 0.03 && moderationAppealRate <= 0.15;
  // Gesunde Overturn-Rate: 15-35% (zu niedrig = rigide, zu hoch = inkonsistent)
  const overturnHealthy = moderationOverturnRate >= 0.15 && moderationOverturnRate <= 0.40;
  const moderationScore = clamp(
    (appealHealthy ? 0.5 : 0.2) + (overturnHealthy ? 0.5 : 0.2)
  );

  const health = clamp(
    transparencyScore  * 0.40 +
    participationScore * 0.35 +
    moderationScore    * 0.25
  );

  const warnings = [];
  if (changelogEntries30d === 0)       warnings.push('no_public_changelog');
  if (consultationsHeld90d === 0)      warnings.push('no_community_consultation');
  if (algorithmChangesExplained < 0.8) warnings.push('unexplained_algorithm_changes');

  return {
    health:         Math.round(health            * 100) / 100,
    transparencyScore:Math.round(transparencyScore * 100) / 100,
    participationScore:Math.round(participationScore * 100) / 100,
    moderationScore:Math.round(moderationScore   * 100) / 100,
    level:
      health > 0.75 ? 'gesund'    :
      health > 0.55 ? 'stabil'    :
      health > 0.35 ? 'fragil'    : 'kritisch',
    warnings,
  };
}

// ── 7G.2 — communityTrust() ────────────────────────────────────
/**
 * Wie viel Vertrauen hat die Gemeinschaft in die Plattform?
 * Basiert auf: Feedback-Rate, Retention, Moderation-Akzeptanz, Transparenz-Signale.
 */
export function communityTrust(signals = {}) {
  const {
    newcomerRetention30d    = 0.60,  // % Newcomer nach 30 Tagen noch aktiv
    feedbackSubmissionRate  = 0.15,  // % Nutzer die Feedback geben (Proxy für Engagement)
    moderationSatisfaction  = 0.70,  // % Moderation-Entscheidungen die akzeptiert werden
    transparencyRating      = 0.70,  // Subjektiver Transparenz-Score aus Community
    returnRate60d           = 0.55,  // % die nach 60 Tagen zurückkehren
    conflictRate            = 0.05,  // % Interaktionen mit Konflikt-Signal
  } = signals;

  const trust = clamp(
    newcomerRetention30d    * 0.25 +
    feedbackSubmissionRate  * 0.15 +  // Menschen geben nur Feedback wenn sie vertrauen
    moderationSatisfaction  * 0.20 +
    transparencyRating      * 0.20 +
    returnRate60d           * 0.15 +
    (1 - conflictRate)      * 0.05
  );

  return {
    trust: Math.round(trust * 100) / 100,
    level:
      trust > 0.75 ? 'hohes Vertrauen'    :
      trust > 0.55 ? 'stabiles Vertrauen' :
      trust > 0.35 ? 'angespannt'         : 'kritisches Vertrauen-Defizit',
    signals: {
      newcomerRetention30d, feedbackSubmissionRate, moderationSatisfaction,
      transparencyRating, returnRate60d,
    },
    // Wichtigster Einzelindikator
    keySignal: newcomerRetention30d < 0.40
      ? 'Newcomer-Schwund — mögliches Vertrauens-Problem'
      : moderationSatisfaction < 0.50
      ? 'Moderation-Unzufriedenheit — Review nötig'
      : trust > 0.70
      ? 'Solides Community-Vertrauen'
      : 'Beobachten',
  };
}

// ── 7G.2 — stewardshipBalance() ────────────────────────────────
/**
 * Balance zwischen Plattform-Macht und Community-Einfluss.
 * Misst: in welche Richtung driftet die Macht?
 */
export function stewardshipBalance(data = {}) {
  const {
    platformDecisions30d   = 0,    // Entscheidungen die Plattform allein trifft
    communityInputed30d    = 0,    // davon: Community hatte Input
    creatorEarningsGini    = 0.40, // Einkommens-Gini (aus economicDiversity)
    topCreatorFeedShare    = 0.25, // Top-10% Feed-Anteil
    moderationTransparency = 0.70, // % Moderations-Gründe erklärt
  } = data;

  // Entscheidungs-Balance
  const communityInputRate = platformDecisions30d > 0
    ? communityInputed30d / platformDecisions30d : 0;

  // Macht-Konzentration
  const powerConcentration = clamp(
    topCreatorFeedShare * 0.40 +
    creatorEarningsGini * 0.35 +
    (1 - moderationTransparency) * 0.25
  );

  const balance = clamp(
    communityInputRate      * 0.40 +
    (1 - powerConcentration)* 0.40 +
    moderationTransparency  * 0.20
  );

  return {
    balance:          Math.round(balance            * 100) / 100,
    communityInputRate:Math.round(communityInputRate * 100) / 100,
    powerConcentration:Math.round(powerConcentration * 100) / 100,
    level:
      balance > 0.70 ? 'ausgewogen'        :
      balance > 0.50 ? 'leicht Plattform-lastig' :
      balance > 0.30 ? 'Plattform-dominiert'     : 'kritisch zentralisiert',
    recommendation: balance < 0.50
      ? 'Mehr Community-Input in Entscheidungen einbauen. Saisonale Konsultation starten.'
      : null,
  };
}

// ── 7G.3 — culturalTransparency() ──────────────────────────────
/**
 * Wie transparent sind Plattform-Entscheidungen?
 * Misst: Changelog-Qualität, Algorithmus-Erklärungen, Impact-Kommunikation.
 */
export function culturalTransparency(changelogData = []) {
  if (!changelogData.length) {
    return { transparency: 0, level: 'keine Daten', missingItems: ['Öffentlicher Changelog fehlt'] };
  }

  // Changelog-Qualität
  const last90d = changelogData.filter(e => daysSince(e.date) < 90);
  const hasCulturalNotes  = last90d.filter(e => e.cultural_impact).length;
  const hasAlgoChanges    = last90d.filter(e => e.type === 'algorithm').length;
  const hasAlgoExplained  = last90d.filter(e => e.type === 'algorithm' && e.explanation).length;

  const coverageScore = clamp(last90d.length / 6);  // Mind. 6 Einträge / 90 Tage
  const qualityScore  = clamp(
    (hasCulturalNotes / Math.max(last90d.length, 1)) * 0.50 +
    (hasAlgoChanges > 0 ? hasAlgoExplained / hasAlgoChanges : 1) * 0.50
  );

  const transparency = clamp(coverageScore * 0.40 + qualityScore * 0.60);

  const missingItems = [];
  if (last90d.length < 3)         missingItems.push('Zu wenig Changelog-Einträge');
  if (hasCulturalNotes === 0)     missingItems.push('Keine kulturellen Impact-Notizen');
  if (hasAlgoChanges > hasAlgoExplained) missingItems.push('Algorithmus-Änderungen nicht vollständig erklärt');

  return {
    transparency: Math.round(transparency * 100) / 100,
    entriesLast90d: last90d.length,
    qualityScore:   Math.round(qualityScore   * 100) / 100,
    missingItems,
    level:
      transparency > 0.75 ? 'sehr transparent' :
      transparency > 0.55 ? 'transparent'      :
      transparency > 0.35 ? 'teilweise'        : 'opak',
  };
}

// ── 7G.3 — decisionImpact() ────────────────────────────────────
/**
 * Bewertet den kulturellen Impact einer geplanten Plattform-Entscheidung.
 * Vor der Umsetzung: kulturelle Folgenabschätzung.
 *
 * @param {Object} decision — { type, scope, affectedSystems, reversible }
 */
export function decisionImpact(decision = {}) {
  const {
    type         = 'feature',    // 'algorithm', 'feature', 'moderation', 'economic', 'governance'
    scope        = 'minor',      // 'minor', 'moderate', 'major', 'critical'
    affectedSystems = [],        // Welche Systeme betroffen?
    reversible   = true,         // Ist die Entscheidung rückgängig machbar?
    communityConsulted = false,  // Wurde Community vorher gehört?
  } = decision;

  // Impact-Score
  const SCOPE_WEIGHTS = { minor: 0.2, moderate: 0.4, major: 0.7, critical: 1.0 };
  const TYPE_WEIGHTS  = {
    algorithm:   1.0,  // Höchster Impact — betrifft alle
    economic:    0.9,  // Sehr hoher Impact
    moderation:  0.8,
    governance:  0.7,
    feature:     0.4,
  };

  const baseImpact  = (SCOPE_WEIGHTS[scope] || 0.4) * (TYPE_WEIGHTS[type] || 0.4);
  const systemCount = Math.min(affectedSystems.length / 5, 1);
  const reversBonus = reversible ? 0 : 0.2;  // Irreversibel = höherer Impact

  const impact = clamp(baseImpact * 0.70 + systemCount * 0.20 + reversBonus * 0.10);

  // Empfehlung für Prozess
  const REQUIRED_PROCESS = {
    0.70: 'Community-Konsultation + öffentliche Ankündigung 30 Tage vorher',
    0.50: 'Community-Ankündigung 14 Tage vorher + kulturelle Impact-Notiz',
    0.30: 'Öffentlicher Changelog-Eintrag + kurze Erklärung',
    0.00: 'Öffentlicher Changelog-Eintrag',
  };

  const requiredProcess = Object.entries(REQUIRED_PROCESS)
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
    .find(([threshold]) => impact >= parseFloat(threshold))?.[1]
    || 'Changelog-Eintrag';

  const warnings = [];
  if (impact > 0.70 && !communityConsulted) warnings.push('Hoher Impact ohne Community-Konsultation');
  if (!reversible && scope === 'major')     warnings.push('Irreversible Major-Änderung — besondere Sorgfalt');

  return {
    impact:         Math.round(impact * 100) / 100,
    level:
      impact > 0.70 ? 'kritisch'  :
      impact > 0.50 ? 'hoch'      :
      impact > 0.30 ? 'mittel'    : 'niedrig',
    requiredProcess,
    warnings,
    affectedSystemCount: affectedSystems.length,
    recommendation: communityConsulted
      ? `Community bereits konsultiert. ${requiredProcess}.`
      : `${requiredProcess} empfohlen.`,
  };
}

// ── 7G.4 — communityRepresentation() ───────────────────────────
/**
 * Werden alle Stimmen gehört?
 * Misst: Diversität der Konsultations-Teilnehmer vs. Plattform-Demografie.
 */
export function communityRepresentation(consultationData = {}, creatorDemographics = {}) {
  const {
    participantCities     = [],
    participantDomains    = [],
    participantTenure     = {},  // { fresh: n, growing: n, established: n, veteran: n }
    consultationCount90d  = 0,
  } = consultationData;

  const {
    allCities    = [],
    allDomains   = [],
  } = creatorDemographics;

  // Geografische Repräsentation
  const cityCoverage = allCities.length > 0
    ? participantCities.filter(c => allCities.includes(c)).length / allCities.length
    : 0;

  // Domain-Repräsentation
  const domainCoverage = allDomains.length > 0
    ? participantDomains.filter(d => allDomains.includes(d)).length / allDomains.length
    : 0;

  // Generationen-Repräsentation
  const totalParticipants = Object.values(participantTenure).reduce((a, b) => a + b, 0) || 1;
  const freshRatio       = (participantTenure.fresh || 0) / totalParticipants;
  const veteranRatio     = (participantTenure.veteran || 0) / totalParticipants;
  const generationBalance= freshRatio > 0.10 && veteranRatio < 0.70 ? 1 : 0.4;

  const representation = clamp(
    cityCoverage      * 0.30 +
    domainCoverage    * 0.30 +
    generationBalance * 0.25 +
    Math.min(consultationCount90d / 3, 1) * 0.15
  );

  const gaps = [];
  if (freshRatio < 0.10)         gaps.push('Zu wenig Newcomer-Stimmen');
  if (veteranRatio > 0.70)       gaps.push('Veteran-Dominanz in Konsultationen');
  if (cityCoverage < 0.30)       gaps.push('Geografische Unterrepräsentation');
  if (consultationCount90d < 2)  gaps.push('Zu wenige Konsultationen — mind. 1/Monat');

  return {
    representation:  Math.round(representation * 100) / 100,
    cityCoverage:    Math.round(cityCoverage    * 100) / 100,
    domainCoverage:  Math.round(domainCoverage  * 100) / 100,
    freshRatio:      Math.round(freshRatio      * 100) / 100,
    level:
      representation > 0.70 ? 'breit vertreten'   :
      representation > 0.50 ? 'mäßig vertreten'   :
      representation > 0.30 ? 'eingeschränkt'     : 'nicht repräsentativ',
    gaps,
    suggestion: gaps.length > 0
      ? `Nächste Konsultation explizit für ${gaps[0].split(' ').slice(-1)[0]} öffnen.`
      : 'Repräsentation ist ausgewogen.',
  };
}

// ── 7G.5 — softModerationHealth() ──────────────────────────────
/**
 * Ist Moderation restaurativ statt strafend?
 * Misst: de-escalation rate, human review rate, cultural sensitivity.
 */
export function softModerationHealth(moderationData = {}) {
  const {
    totalActions30d       = 0,
    warningsVsRemoval     = 0.70,  // % Warnungen vs. Entfernungen (gesund: > 60% Warnungen)
    humanReviewedRate     = 0.80,  // % die von Menschen geprüft wurden
    contextConsideredRate = 0.75,  // % mit Kontext-Überprüfung
    deescalatedRate       = 0.60,  // % Konflikte de-eskaliert statt eskaliert
    appealOverturnRate    = 0.20,  // % angefochtene Entscheidungen umgekehrt
  } = moderationData;

  if (totalActions30d === 0) {
    return { health: 1.0, level: 'keine Moderation-Daten', isRestorativ: true };
  }

  const health = clamp(
    warningsVsRemoval     * 0.25 +
    humanReviewedRate     * 0.25 +
    contextConsideredRate * 0.20 +
    deescalatedRate       * 0.20 +
    Math.min(appealOverturnRate / 0.30, 1) * 0.10  // Bis 30% Overturn = gesund
  );

  const isRestorativ = warningsVsRemoval > 0.60 && deescalatedRate > 0.50;

  const warnings = [];
  if (warningsVsRemoval < 0.50) warnings.push('Zu viele Entfernungen — mehr Warnungen/Dialog statt Bestrafung');
  if (humanReviewedRate < 0.60) warnings.push('Zu viel automatische Moderation — mehr menschliche Überprüfung');
  if (deescalatedRate < 0.40)   warnings.push('Niedrige De-Eskalations-Rate — Prozess überdenken');

  return {
    health:          Math.round(health              * 100) / 100,
    isRestorativ,
    warningsVsRemoval:Math.round(warningsVsRemoval  * 100) / 100,
    humanReviewedRate:Math.round(humanReviewedRate  * 100) / 100,
    deescalatedRate:  Math.round(deescalatedRate    * 100) / 100,
    level:
      health > 0.75 ? 'restaurativ'   :
      health > 0.55 ? 'ausgewogen'    :
      health > 0.35 ? 'strafzentriert':
                      'hart',
    warnings,
    principles: MODERATION_PRINCIPLES,
  };
}

// ── 7G.6 — powerBalanceCheck() ─────────────────────────────────
/**
 * Erkennt Machtkonzentration auf der Plattform.
 * Aggregiert: wirtschaftliche + algorithmische + governance Macht.
 */
export function powerBalanceCheck(data = {}) {
  const {
    creators = [], feedItems = [], collaborations = [],
    governanceData = {}, moderationData = {},
  } = data;

  // Wirtschaftliche Macht (aus economics)
  const ecoSafety   = econSafetyCheck({ creators, feedItems: feedItems || [], collaborations });

  // Kreative Macht (aus culturalEvolution)
  const eliteDrift  = antiEliteDrift(creators, feedItems || [], collaborations);

  // Governance-Macht
  const govHealth   = governanceHealth(governanceData);

  // Moderations-Macht
  const modHealth   = softModerationHealth(moderationData);

  // Gesamt-Machtbalance
  const powerBalance = clamp(
    (1 - eliteDrift.eliteDrift)  * 0.30 +
    (ecoSafety.safe ? 0.25 : 0.10) * 1 +
    govHealth.health               * 0.25 +
    modHealth.health               * 0.20
  );

  const concentrations = [];
  if (!eliteDrift.safe)           concentrations.push('Creator-Elitenbildung');
  if (!ecoSafety.safe)            concentrations.push('Wirtschaftliche Konzentration');
  if (govHealth.health < 0.40)    concentrations.push('Governance-Zentralisierung');
  if (!modHealth.isRestorativ)    concentrations.push('Strafzentrierte Moderation');

  return {
    powerBalance:  Math.round(powerBalance    * 100) / 100,
    level:
      powerBalance > 0.75 ? 'gut verteilt'   :
      powerBalance > 0.55 ? 'leicht konzentriert' :
      powerBalance > 0.35 ? 'konzentriert'   : 'kritisch konzentriert',
    concentrations,
    dimensions: { eliteDrift, ecoSafety, govHealth, modHealth },
    urgentAction: concentrations.length > 2
      ? 'Mehrere Machtkonzentrations-Signale — Community-Konsultation einleiten.'
      : null,
  };
}

// ── 7G.8 — stewardshipScore() ──────────────────────────────────
/**
 * Gesamter Stewardship-Gesundheits-Score.
 * Aggregiert alle Governance-Dimensionen.
 */
export function stewardshipScore(data = {}) {
  const {
    governanceData = {}, trustSignals = {},
    balanceData = {}, changelogData = [],
    moderationData = {}, consultationData = {},
    creatorDemographics = {},
  } = data;

  const gov     = governanceHealth(governanceData);
  const trust   = communityTrust(trustSignals);
  const balance = stewardshipBalance(balanceData);
  const transp  = culturalTransparency(changelogData);
  const modH    = softModerationHealth(moderationData);
  const repr    = communityRepresentation(consultationData, creatorDemographics);

  const score = clamp(
    gov.health     * 0.20 +
    trust.trust    * 0.25 +
    balance.balance* 0.20 +
    transp.transparency * 0.15 +
    modH.health    * 0.10 +
    repr.representation * 0.10
  );

  const allWarnings = [
    ...gov.warnings,
    ...transp.missingItems,
    ...modH.warnings,
    ...repr.gaps,
  ].filter(Boolean);

  return {
    score:   Math.round(score * 100) / 100,
    level:
      score > 0.80 ? 'verantwortungsvolle Stewardship' :
      score > 0.65 ? 'solide Governance'               :
      score > 0.45 ? 'fragile Governance'              : 'Governance-Krise',
    dimensions: { gov, trust, balance, transp, modH, repr },
    allWarnings: [...new Set(allWarnings)],
    // Saisonaler Kontext — Governance reflektiert mit der Jahreszeit
    seasonalNote: getSeason().key === 'herbst'
      ? 'Herbst: Zeit für Governance-Reflexion und Community-Konsultation.'
      : getSeason().key === 'winter'
      ? 'Winter: Stille Governance-Überprüfung — was wurde versprochen, was gehalten?'
      : null,
    timestamp: new Date().toISOString(),
    _isInternal: true,
  };
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useStewardship() {
  const [creators,   setCreators]   = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorsRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('id, dna_tags, mood, location_label, is_available, created_at, bridge_score, follower_count, subscription_tier').limit(300),
        supabase.from('bookings').select('id, wirker_user_id, client_user_id, status, amount_eur, created_at').limit(300),
      ]);
      setCreators(creatorsRes.data || []);
      setBookings(bookingsRes.data  || []);
    } catch (err) {
      console.error('[Stewardship]', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Power Balance mit verfügbaren Daten
  const powerBalance = useMemo(() =>
    powerBalanceCheck({ creators, collaborations: bookings }),
    [creators, bookings]
  );

  return { powerBalance, creators, bookings, loading, reload: load };
}
