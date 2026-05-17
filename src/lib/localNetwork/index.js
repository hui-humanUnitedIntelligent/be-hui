// src/lib/localNetwork/index.js
// HUI — Local Creative Networks — Phase 6E.5
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Reale lokale Verbindungen sind wertvoller als globale Reichweite.
// HUI stärkt regionale kreative Ökosysteme — ruhig.
// Keine aggressive Geo-Plattform.
//
// LOKAL bedeutet:
//   Nicht: "User in deiner Nähe tracken."
//   Sondern: "Kreative in deiner Stadt sichtbarer machen."
//
// DATENSCHUTZ:
//   Kein genaues GPS. Nur: Stadt/Region.
//   Opt-in: Creator gibt Standort freiwillig an.
//   Ruhige lokale Sichtbarkeit — kein aggressives Matching.
// ═══════════════════════════════════════════════════════════════

// ── Lokale Kreativ-Cluster ──────────────────────────────────────
/**
 * Findet lokale kreative Cluster in einer Stadt.
 * Basiert auf location_label aus Profilen — kein GPS.
 */
export function detectLocalClusters(creators = []) {
  const cityMap = new Map();  // city → creators[]

  for (const creator of creators) {
    const city = creator.location_label?.trim().toLowerCase();
    if (!city) continue;
    if (!cityMap.has(city)) cityMap.set(city, []);
    cityMap.get(city).push(creator);
  }

  // Nur Städte mit min. 2 Creators
  const clusters = [];
  for (const [city, members] of cityMap.entries()) {
    if (members.length < 2) continue;

    // Kreative Vielfalt der Stadt
    const allTags = members.flatMap(c => c.dna_tags || []);
    const uniqueTags = new Set(allTags).size;
    const diversity  = Math.min(uniqueTags / 10, 1);

    // Bridge Creators in der Stadt
    const localBridges = members.filter(c => (c._bridgeScore || 0) > 0.3);

    clusters.push({
      city:           city.charAt(0).toUpperCase() + city.slice(1),
      memberCount:    members.length,
      diversity,
      localBridges:   localBridges.slice(0, 3),
      dominantMoods:  _topMoods(members),
      vitality:       _clusterVitality(members),
    });
  }

  return clusters.sort((a, b) => b.vitality - a.vitality);
}

function _topMoods(creators) {
  const moodCount = {};
  for (const c of creators) {
    const m = c.mood || c.focus_type;
    if (m) moodCount[m] = (moodCount[m] || 0) + 1;
  }
  return Object.entries(moodCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([mood]) => mood);
}

function _clusterVitality(creators) {
  const avgAvailability = creators.filter(c => c.is_available).length / creators.length;
  const avgCompletions  = creators.reduce((a, c) =>
    a + (c.total_bookings_completed || 0), 0) / creators.length;
  const verified        = creators.filter(c => c.is_verified).length / creators.length;

  return Math.min(
    avgAvailability * 0.4 + Math.min(avgCompletions / 10, 1) * 0.4 + verified * 0.2,
    1.0
  );
}

// ── Lokale Discovery Modifier ───────────────────────────────────
/**
 * Gibt einem Creator aus derselben Stadt einen kleinen Discovery-Boost.
 * Sanft — kein aggressives lokales Silo.
 */
export function localProximityModifier(creatorLocation, userLocation) {
  if (!creatorLocation || !userLocation) return 0;

  const cLoc = creatorLocation.trim().toLowerCase();
  const uLoc = userLocation.trim().toLowerCase();

  // Exakte Stadt-Übereinstimmung
  if (cLoc === uLoc) return 0.08;  // +8% — merkbar aber nicht dominant

  // Region-Übereinstimmung (z.B. "Bayern" in beiden)
  const cWords = new Set(cLoc.split(/[\s,]+/));
  const uWords = new Set(uLoc.split(/[\s,]+/));
  const sharedWords = [...cWords].filter(w => uWords.has(w) && w.length > 3);
  if (sharedWords.length > 0) return 0.04;  // +4%

  return 0;
}

// ── Nearby Resonance ────────────────────────────────────────────
/**
 * Findet Creators in derselben Stadt, die thematisch resonieren.
 * Qualitäts-basiert — nicht distanz-basiert.
 */
export function findNearbyResonance(creator, allCreators = []) {
  const location = creator.location_label?.trim().toLowerCase();
  if (!location) return [];

  const nearby = allCreators.filter(c =>
    c.id !== creator.id &&
    c.location_label?.trim().toLowerCase() === location
  );

  // Thematische Resonanz prüfen
  const creatorTags = new Set(creator.dna_tags || []);

  return nearby.map(c => {
    const cTags = new Set(c.dna_tags || []);
    const shared = [...creatorTags].filter(t => cTags.has(t)).length;
    const total  = new Set([...creatorTags, ...cTags]).size || 1;
    const resonance = shared / total;

    // Mood-Nähe
    const moodMatch = creator.mood && c.mood && creator.mood === c.mood ? 0.3 : 0;

    return {
      ...c,
      _localResonance: Math.min(resonance + moodMatch, 1),
      _sharedTags:     [...creatorTags].filter(t => cTags.has(t)),
    };
  })
  .filter(c => c._localResonance > 0.1)
  .sort((a, b) => b._localResonance - a._localResonance)
  .slice(0, 8);
}

// ── Local Circle ────────────────────────────────────────────────
/**
 * Erstellt einen lokalen Kreativkreis.
 * Dauerhaft aber ruhig — keine tägliche Aktivität nötig.
 */
export function createLocalCircle({
  cityName,
  description = '',
  createdBy,
  focusTags   = [],
  mood        = null,
  isOpen      = true,   // Offen für alle in der Stadt
}) {
  return {
    id:          null,
    type:        'local_circle',
    city:        cityName?.trim(),
    description: description?.trim() || '',
    created_by:  createdBy,
    members:     [createdBy],
    focus_tags:  focusTags.slice(0, 5),
    mood,
    is_open:     isOpen,
    // Kein aggressiver Aktivitäts-Druck
    activity_pace: 'ruhig',   // 'ruhig' | 'aktiv' | 'temporär'
    created_at:  new Date().toISOString(),
  };
}

// ── React Hook ──────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cacheOrFetch } from '@/lib/cache/index';

export function useLocalNetwork(userLocation) {
  const [clusters,       setClusters]      = useState([]);
  const [nearbyCreators, setNearbyCreators] = useState([]);
  const [loading,        setLoading]        = useState(false);

  const load = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const { data: allCreators } = await cacheOrFetch(
        'graph_data',
        `local_${userLocation.slice(0, 10)}`,
        async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, display_name, talent, dna_tags, mood, location_label, is_available, is_verified, total_bookings_completed, avatar_url, focus_type')
            .eq('has_talent_profile', true)
            .not('location_label', 'is', null)
            .limit(200);
          return data || [];
        },
        { ttl: 300_000 }  // 5min
      );

      const creators = allCreators || [];
      const clusters = detectLocalClusters(creators);
      const nearby   = findNearbyResonance(
        { location_label: userLocation, dna_tags: [] },
        creators
      );

      setClusters(clusters);
      setNearbyCreators(nearby);
    } catch (err) {
      console.error('[LocalNetwork]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => { load(); }, [load]);

  return { clusters, nearbyCreators, loading, reload: load };
}
