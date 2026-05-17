// src/hooks/useHealthDashboard.js
// HUI — Health Dashboard Hook — Phase 5H.7
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Aggregiert alle Health-Metriken für das interne Dashboard.
// Nutzt: Community Health (5G) + Graph Health (5D.1) + Feed Health (5H)
//
// KEINE Vanity-Metrics:
// ❌ Screen Time, DAU/MAU, Scroll-Tiefe
//
// NUR Gesundheits-Metriken:
// ✅ Netzwerk-Vitalität, Fairness, Creator-Wellbeing, Diversität
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCommunityHealth } from './useCommunityHealth';
import { useGraphHealth } from './useGraphHealth';
import { selfHealingBalancer } from '@/lib/communityHealth/integration';
import { HEALTH_THRESHOLDS } from '@/lib/communityHealth/index';

export function useHealthDashboard({ autoRefresh = false } = {}) {
  const {
    health:    communityHealth,
    loading:   chLoading,
    lastUpdated,
    refresh:   refreshCommunity,
  } = useCommunityHealth({ refreshInterval: autoRefresh ? 300000 : 0 });

  const { health: graphHealth, loading: ghLoading, runHealthCheck } = useGraphHealth();

  const loading = chLoading || ghLoading;

  // Self-Healing Status
  const healingStatus = communityHealth
    ? selfHealingBalancer(communityHealth)
    : null;

  // Aggregierter Dashboard-Report
  const dashboardData = communityHealth ? {
    // Overall Score
    overallScore:    communityHealth.overallScore,
    healthLevel:     communityHealth.healthLevel,

    // Dimension Scores
    dimensions: {
      fairness:        communityHealth.scores?.fairness,
      diversity:       communityHealth.scores?.diversity,
      bridge:          communityHealth.scores?.bridge,
      resonance:       communityHealth.scores?.resonance,
      calmness:        communityHealth.scores?.calmness,
      newcomer:        communityHealth.scores?.newcomer,
      creatorWellbeing:communityHealth.scores?.creatorWellbeing,
    },

    // Issues & Warnings
    issues:          communityHealth.issues || [],
    warnings:        communityHealth.warnings || [],
    recommendations: communityHealth.recommendations || [],

    // Bridge-Creators
    topBridges:      communityHealth.topBridges || [],

    // Safety Guards
    safetyGuards:    communityHealth.safetyGuards || {},
    allGuardsPass:   communityHealth.safetyGuards
      ? Object.values(communityHealth.safetyGuards).every(Boolean)
      : null,

    // Graph Health (wenn verfügbar)
    graph: graphHealth ? {
      totalEdges:    graphHealth.metrics?.totalEdges,
      mutualRate:    graphHealth.metrics?.mutualRate,
      growthLast7d:  graphHealth.metrics?.followsLast7Days,
    } : null,

    // Self-Healing
    healing: healingStatus ? {
      severity:      healingStatus.severity,
      activeActions: healingStatus.actions,
      params:        healingStatus.params,
    } : null,

    // Meta
    lastUpdated,

    // Thresholds (für UI-Anzeige)
    thresholds: {
      minBridgeDensity:      HEALTH_THRESHOLDS.MIN_BRIDGE_DENSITY,
      minMutualFollowRate:   HEALTH_THRESHOLDS.MIN_MUTUAL_FOLLOW_RATE,
      minNewcomerIntegration:HEALTH_THRESHOLDS.MIN_NEWCOMER_INTEGRATION,
      maxPopularityGini:     HEALTH_THRESHOLDS.MAX_POPULARITY_GINI,
      targetScore:           0.75,  // Ziel: Healthy
    },
  } : null;

  const refresh = useCallback(async () => {
    await Promise.all([refreshCommunity(), runHealthCheck()]);
  }, [refreshCommunity, runHealthCheck]);

  // Initial laden
  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return { dashboardData, loading, refresh };
}
