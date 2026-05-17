// src/hooks/useProgressiveDiscovery.js
// HUI — Progressive Discovery Delivery — Phase 6B.3
// ═══════════════════════════════════════════════════════════════
//
// PROBLEM GELÖST:
// Discovery wartete bisher auf alle 8 Pipeline-Stages.
// User sah nichts bis alles berechnet war.
//
// LÖSUNG:
// 3 progressive Wellen — User sieht sofort etwas.
//
// WELLE 1 (< 200ms): Rohe Supabase-Daten, minimal verarbeitet
// WELLE 2 (< 600ms): + Graph + Context
// WELLE 3 (< 1200ms): + Health + Diversity + Calmness (final)
//
// PHILOSOPHIE:
// "Lieber sofort etwas Unvollkommenes
//  als lang auf etwas Perfektes warten."
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import { cacheOrFetch } from '@/lib/cache/index';
import {
  buildPipelineContext,
  stage1_candidateCollection,
  stage2_trustFilter,
  stage3_graphEnrichment,
  stage4_contextEnrichment,
  stage5_healthAdjustment,
  stage6_diversityPass,
  stage7_calmnessPass,
  stage8_finalRanking,
} from '@/lib/pipeline/index';
import { relevanceScore } from '@/lib/discovery/index';
import { SessionContext } from '@/lib/contextual/index';
import { detectSoftClusters, creatorBridgeScore } from '@/lib/graph/index';
import { selfHealingBalancer } from '@/lib/communityHealth/integration';

const CREATOR_FIELDS = `
  id, display_name, talent, focus_type, dna_tags, bio,
  is_available, is_verified, avatar_url, header_img,
  total_bookings_completed, response_rate, created_at,
  updated_at, mood, location_label, has_talent_profile
`.trim();

const CONTENT_FIELDS = `
  id, user_id, title, description, caption, cover_url,
  media_url, category, type, price, status, created_at,
  updated_at, mood, tags
`.trim();

export function useProgressiveDiscovery({
  userProfile,
  userFollows,
  activeMood,
  sessionSignals = {},
  healthReport   = null,
  enabled        = true,
}) {
  // ── 3 Progressive Zustände ─────────────────────────────────
  const [wave1, setWave1] = useState([]);   // Sofort: Roh-Items
  const [wave2, setWave2] = useState([]);   // ~600ms: + Graph + Context
  const [wave3, setWave3] = useState([]);   // ~1200ms: Final (Health + Diversity)

  const [wave,     setWave]     = useState(0);   // Aktuell angezeigte Welle
  const [loading,  setLoading]  = useState(true);
  const [bridges,  setBridges]  = useState([]);
  const [pipelineAudit, setPipelineAudit] = useState(null);
  const mountedRef = useRef(true);
  const t0Ref      = useRef(0);

  // Feed = beste verfügbare Welle
  const feed = wave >= 3 ? wave3 : wave >= 2 ? wave2 : wave1;

  const load = useCallback(async () => {
    if (!enabled) return;
    t0Ref.current = performance.now();
    setLoading(true);

    const moodKey = activeMood?.key || activeMood || null;

    // ── WELLE 1: Rohe Daten (~100-200ms) ────────────────────
    const [worksRes, expRes, storyRes, creatorsRes] = await Promise.all([
      safeQuery(supabase.from('works')
        .select(`${CONTENT_FIELDS}, profiles:user_id(${CREATOR_FIELDS})`)
        .eq('status', 'published').order('updated_at', { ascending: false }).limit(22)),
      safeQuery(supabase.from('experiences')
        .select(`${CONTENT_FIELDS}, profiles:user_id(${CREATOR_FIELDS})`)
        .eq('status', 'published').order('updated_at', { ascending: false }).limit(10)),
      safeQuery(supabase.from('stories')
        .select(`id, user_id, caption, tags, created_at, updated_at, profiles:user_id(${CREATOR_FIELDS})`)
        .order('created_at', { ascending: false }).limit(8)),
      safeQuery(supabase.from('profiles')
        .select(CREATOR_FIELDS).eq('has_talent_profile', true).limit(40)),
    ]);

    if (!mountedRef.current) return;

    const creators    = creatorsRes.data || [];
    const rawData     = {
      works:       worksRes.data  || [],
      experiences: expRes.data    || [],
      stories:     storyRes.data  || [],
      creators,
    };

    // Welle 1: Stage 1+2 — sofort rendern
    const stage1 = stage1_candidateCollection(rawData);
    const stage2 = stage2_trustFilter(stage1, {});

    // Simples Basis-Ranking (kein Graph, nur Freshness)
    const w1sorted = stage2
      .map(i => ({ ...i, _score: relevanceScore(i, { mood: moodKey, userProfile }) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 16);

    if (mountedRef.current) {
      setWave1(w1sorted);
      setWave(1);
    }

    // ── WELLE 2: + Graph + Context (~400-600ms) ──────────────
    // Micro-Delay um Welle 1 rendern zu lassen
    await new Promise(r => setTimeout(r, 50));
    if (!mountedRef.current) return;

    const clusterMap = detectSoftClusters(creators);
    const healingParams = healthReport
      ? selfHealingBalancer(healthReport).params
      : { explorationRatio: 0.20, maxPerCreator: 2 };

    const ctx = buildPipelineContext({
      userProfile, userFollows, activeMood,
      sessionSignals, healthReport, clusterMap,
    });

    const stage3 = stage3_graphEnrichment(stage2, ctx);
    const stage4 = stage4_contextEnrichment(stage3, ctx);

    const w2sorted = stage4
      .map(i => ({
        ...i,
        _score: relevanceScore(i, { mood: moodKey, userProfile }) * 0.75
               + (i._graphBonus || 0) * 0.10
               + (i._ctxMod    || 0),
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 18);

    if (mountedRef.current) {
      setWave2(w2sorted);
      setWave(2);
    }

    // ── WELLE 3: Final — Health + Diversity + Calmness ───────
    await new Promise(r => setTimeout(r, 50));
    if (!mountedRef.current) return;

    const stage5 = stage5_healthAdjustment(stage4, ctx);
    const stage6 = stage6_diversityPass(stage5, ctx);
    const { items: stage7, breathingPoints, isCalmMode } = stage7_calmnessPass(stage6, ctx);
    const { items: final, guardsPass } = stage8_finalRanking(stage7, ctx);

    const topBridges = final
      .filter(i => (i._bridgeScore || 0) > 0.38)
      .sort((a, b) => b._bridgeScore - a._bridgeScore)
      .slice(0, 5);

    const audit = {
      timing: { total: Math.round(performance.now() - t0Ref.current) },
      stages: {
        s1_candidates: stage1.length,
        s2_afterTrust: stage2.length,
        s8_final:      final.length,
      },
      meta: { isCalmMode, breathingPoints },
      guardsPass,
    };

    if (mountedRef.current) {
      setWave3(final);
      setWave(3);
      setBridges(topBridges);
      setPipelineAudit(audit);
      setLoading(false);
    }
  }, [
    userProfile?.id,
    activeMood?.key || activeMood,
    healthReport?.overallScore,
    enabled,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    SessionContext.init();
    setWave1([]); setWave2([]); setWave3([]); setWave(0);
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return {
    feed,          // Beste verfügbare Welle
    wave,          // 1, 2 oder 3 (für Debug/UI)
    bridges,
    loading:       wave < 3,
    finalLoading:  wave < 3,
    pipelineAudit,
    reload:        load,
  };
}
