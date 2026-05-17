// src/lib/culture/health.js
// HUI — Cultural Health Engine — Phase 6H.5 + 6H.8
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Kulturelle Gesundheit ist mehr als technische Stabilität.
// Wir messen: Wärme, Großzügigkeit, Offenheit, Vitalität.
//
// NEUE DIMENSIONEN über communityHealth hinaus:
//   cultural_warmth         → fühlt sich die Plattform warm an?
//   collaboration_generosity → teilen Menschen ohne Gegenrechnung?
//   local_vitality          → lebt die lokale kreative Szene?
//   interdisciplinary_openness → begegnen sich verschiedene Felder?
//   ritual_participation    → nehmen Menschen an Ritualen teil?
//   creative_sustainability  → schaffen Menschen langfristig?
//   emotional_atmosphere    → ist die Stimmung positiv-ruhig?
//
// KEINE VANITY METRICS.
// KEINE AKTIVITÄTS-MAXIMIERUNG.
// ═══════════════════════════════════════════════════════════════

// ── Kulturelle Gesundheits-Schwellenwerte ───────────────────────
export const CULTURAL_HEALTH_THRESHOLDS = {
  warmth: {
    healthy:     0.70,  // 70% der Interaktionen sind "warm" (keine Ablehnung)
    warning:     0.50,
    critical:    0.30,
  },
  generosity: {
    healthy:     0.40,  // 40% der Creators haben Empfehlungen gegeben (ohne Pflicht)
    warning:     0.20,
    critical:    0.05,
  },
  local_vitality: {
    healthy:     0.30,  // 30% der Projekte haben lokale Verbindung
    warning:     0.10,
    critical:    0.02,
  },
  interdisciplinary: {
    healthy:     0.25,  // 25% der Verbindungen sind interdisziplinär
    warning:     0.10,
    critical:    0.03,
  },
  sustainability: {
    healthy:     0.60,  // 60% der Creators sind noch nach 6 Monaten aktiv
    warning:     0.35,
    critical:    0.15,
  },
};

// ── Cultural Warmth ─────────────────────────────────────────────
/**
 * Wie warm fühlt sich die Plattform an?
 * Basiert auf: positive Empfehlungen, keine Konflikte,
 * freiwillige Hilfe, konstruktive Kommunikation.
 */
export function culturalWarmth(platformData = {}) {
  const {
    recommendationsGiven    = 0,  // Empfehlungen die Creator aktiv geschrieben haben
    positiveInteractions    = 0,
    totalInteractions       = 1,
    conflictsReported       = 0,
    helpfulResponses        = 0,
  } = platformData;

  const positiveRate = positiveInteractions / totalInteractions;
  const conflictRate = Math.min(conflictsReported / Math.max(totalInteractions, 1), 1);
  const helpRate     = Math.min(helpfulResponses / Math.max(totalInteractions, 1), 1);
  const recRate      = Math.min(recommendationsGiven / Math.max(totalInteractions * 0.1, 1), 1);

  const warmth = Math.min(
    positiveRate * 0.40 + helpRate * 0.30 + recRate * 0.20 - conflictRate * 0.10,
    1.0
  );

  return {
    warmth: Math.max(0, Math.round(warmth * 100) / 100),
    level:  warmth > CULTURAL_HEALTH_THRESHOLDS.warmth.healthy   ? 'warm'  :
            warmth > CULTURAL_HEALTH_THRESHOLDS.warmth.warning    ? 'neutral':
            warmth > CULTURAL_HEALTH_THRESHOLDS.warmth.critical   ? 'kühl'  : 'kalt',
    signals: [
      positiveRate > 0.8 && 'überwiegend positive Begegnungen',
      helpRate > 0.3     && 'gegenseitige Unterstützung erkennbar',
      conflictRate > 0.1 && 'Spannungen vorhanden — aufmerksam bleiben',
    ].filter(Boolean),
  };
}

// ── Collaboration Generosity ────────────────────────────────────
/**
 * Teilen Menschen ihre Erfahrungen ohne Gegenrechnung?
 * Basiert auf: Empfehlungen ohne Buchungshistorie,
 * Mentorships, freiwillige Weitergabe.
 */
export function collaborationGenerosity(platformData = {}) {
  const {
    totalCreators           = 1,
    creatorsWhoRecommended  = 0,  // Haben eine Empfehlung gegeben
    creatorsWhoMentored     = 0,
    unpaidHelpInstances     = 0,
  } = platformData;

  const recRate     = creatorsWhoRecommended / totalCreators;
  const mentorRate  = creatorsWhoMentored / totalCreators;
  const helpDensity = Math.min(unpaidHelpInstances / totalCreators, 1);

  const generosity = Math.min(
    recRate * 0.50 + mentorRate * 0.30 + helpDensity * 0.20,
    1.0
  );

  return {
    generosity: Math.round(generosity * 100) / 100,
    level:  generosity > CULTURAL_HEALTH_THRESHOLDS.generosity.healthy  ? 'großzügig':
            generosity > CULTURAL_HEALTH_THRESHOLDS.generosity.warning   ? 'ausgewogen':
            generosity > CULTURAL_HEALTH_THRESHOLDS.generosity.critical  ? 'transaktional':
            'geschlossen',
    signals: [
      recRate > 0.4    && 'Empfehlungskultur lebt',
      mentorRate > 0.1 && 'Wissen wird weitergegeben',
      generosity < 0.2 && 'Wenig Großzügigkeit — Newcomer könnten sich isoliert fühlen',
    ].filter(Boolean),
  };
}

// ── Local Vitality ──────────────────────────────────────────────
/**
 * Wie vital sind die lokalen kreativen Szenen?
 */
export function localVitality(locationData = []) {
  if (!locationData.length) return { vitality: 0, level: 'unknown', activeCities: 0 };

  const citiesWithMultiple = locationData.filter(c => c.memberCount >= 2).length;
  const avgLocalCollabs    = locationData.reduce((a, c) =>
    a + (c.localCollabCount || 0), 0) / Math.max(locationData.length, 1);

  const vitality = Math.min(
    (citiesWithMultiple / Math.max(locationData.length, 1)) * 0.6 +
    Math.min(avgLocalCollabs / 5, 1) * 0.4,
    1.0
  );

  return {
    vitality:    Math.round(vitality * 100) / 100,
    activeCities:citiesWithMultiple,
    level:  vitality > CULTURAL_HEALTH_THRESHOLDS.local_vitality.healthy  ? 'lebendig'  :
            vitality > CULTURAL_HEALTH_THRESHOLDS.local_vitality.warning   ? 'erwachend' :
            vitality > CULTURAL_HEALTH_THRESHOLDS.local_vitality.critical  ? 'still'     : 'kaum',
  };
}

// ── Interdisciplinary Openness ──────────────────────────────────
/**
 * Begegnen sich verschiedene kreative Felder?
 */
export function interdisciplinaryOpenness(graphData = {}) {
  const {
    totalEdges          = 1,
    crossDomainEdges    = 0,  // Verbindungen zwischen verschiedenen Feldern
    bridgeCreatorRatio  = 0,
  } = graphData;

  const crossRate   = crossDomainEdges / totalEdges;
  const openness    = Math.min(
    crossRate * 0.70 + bridgeCreatorRatio * 0.30,
    1.0
  );

  return {
    openness:  Math.round(openness * 100) / 100,
    level: openness > CULTURAL_HEALTH_THRESHOLDS.interdisciplinary.healthy  ? 'offen'     :
           openness > CULTURAL_HEALTH_THRESHOLDS.interdisciplinary.warning   ? 'gemischt'  :
           openness > CULTURAL_HEALTH_THRESHOLDS.interdisciplinary.critical  ? 'begrenzt'  : 'geschlossen',
  };
}

// ── Creative Sustainability ─────────────────────────────────────
/**
 * Schaffen Menschen langfristig ohne auszubrennen?
 */
export function creativeSustainability(retentionData = {}) {
  const {
    creators6MonthsAgo     = 1,
    stillActiveAfter6Months= 0,
    burnoutSignals         = 0,  // z.B. lange Pause nach Intensivphase
    avgMonthsBeforeChurn   = 0,
  } = retentionData;

  const retentionRate = stillActiveAfter6Months / creators6MonthsAgo;
  const burnoutRate   = Math.min(burnoutSignals / Math.max(creators6MonthsAgo, 1), 1);
  const avgLongevity  = Math.min(avgMonthsBeforeChurn / 24, 1);  // 24 Monate = sehr gut

  const sustainability = Math.min(
    retentionRate * 0.50 + avgLongevity * 0.30 - burnoutRate * 0.20,
    1.0
  );

  return {
    sustainability: Math.max(0, Math.round(sustainability * 100) / 100),
    retentionRate:  Math.round(retentionRate * 100) / 100,
    level: sustainability > CULTURAL_HEALTH_THRESHOLDS.sustainability.healthy  ? 'nachhaltig'     :
           sustainability > CULTURAL_HEALTH_THRESHOLDS.sustainability.warning   ? 'fragil'         :
           sustainability > CULTURAL_HEALTH_THRESHOLDS.sustainability.critical  ? 'problematisch'  : 'kritisch',
    signals: [
      burnoutRate > 0.2 && 'Burnout-Signale erhöht — Wellbeing-System prüfen',
      retentionRate < 0.35 && 'Viele verlassen die Plattform früh',
      sustainability > 0.7 && 'Creators bleiben langfristig aktiv',
    ].filter(Boolean),
  };
}

// ── Cultural Health Report ──────────────────────────────────────
/**
 * 6H.8 — Vollständiger kultureller Gesundheits-Report.
 * Aggregiert alle Dimensionen.
 */
export function getCulturalHealthReport(data = {}) {
  const warmth       = culturalWarmth(data.platform || {});
  const generosity   = collaborationGenerosity(data.platform || {});
  const local        = localVitality(data.locations || []);
  const interdiscip  = interdisciplinaryOpenness(data.graph || {});
  const sustain      = creativeSustainability(data.retention || {});

  // Kultureller Gesundheits-Score
  const culturalScore = Math.min(
    warmth.warmth       * 0.25 +
    generosity.generosity * 0.20 +
    local.vitality      * 0.15 +
    interdiscip.openness * 0.15 +
    sustain.sustainability * 0.25,
    1.0
  );

  const allSignals = [
    ...warmth.signals,
    ...generosity.signals,
    ...sustain.signals,
  ].filter(Boolean);

  return {
    score:  Math.round(culturalScore * 100) / 100,
    level:  culturalScore > 0.75 ? 'kulturell lebendig'  :
            culturalScore > 0.55 ? 'kulturell stabil'    :
            culturalScore > 0.35 ? 'kulturell fragil'    : 'kulturell krisenhaft',
    dimensions: {
      warmth,
      generosity,
      local,
      interdisciplinary: interdiscip,
      sustainability: sustain,
    },
    signals:   allSignals,
    timestamp: new Date().toISOString(),
  };
}

// React Hook
import { useState, useEffect, useCallback } from 'react';

export function useCulturalHealth() {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Mock-Daten bis Supabase-Views verfügbar
      const mockData = {
        platform: {
          recommendationsGiven: 45, positiveInteractions: 800,
          totalInteractions: 1000, conflictsReported: 3,
          helpfulResponses: 120, totalCreators: 80,
          creatorsWhoRecommended: 35, creatorsWhoMentored: 8,
        },
        locations: [
          { city: 'Hamburg',   memberCount: 12, localCollabCount: 4 },
          { city: 'Berlin',    memberCount: 18, localCollabCount: 7 },
          { city: 'München',   memberCount: 9,  localCollabCount: 3 },
          { city: 'Stuttgart', memberCount: 5,  localCollabCount: 1 },
        ],
        graph: { totalEdges: 200, crossDomainEdges: 60, bridgeCreatorRatio: 0.12 },
        retention: {
          creators6MonthsAgo: 50, stillActiveAfter6Months: 35,
          burnoutSignals: 4, avgMonthsBeforeChurn: 14,
        },
      };
      setReport(getCulturalHealthReport(mockData));
    } catch (err) {
      console.error('[CulturalHealth]', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { report, loading, reload: load };
}
