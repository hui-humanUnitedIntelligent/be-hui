// src/lib/creativeJourney/index.js
// HUI — Creative Journeys & Collaboration Memory — Phase 6E.4 + 6E.6
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Eine Creative Journey ist kein Level-System.
// Sie ist das ehrliche Gedächtnis eines kreativen Lebens.
//
// Keine XP. Keine Level. Keine Badges.
// Nur: was jemand wirklich getan hat, mit wem, wie tief.
//
// COLLABORATION MEMORY:
// HUI erinnert sich an kreative Beziehungen — ruhig, ehrend.
// Nicht als Feed-Algorithmus-Futter.
// Als persönliches Gedächtnis.
// ═══════════════════════════════════════════════════════════════

// ── Journey Dimensionen ─────────────────────────────────────────
// Nicht: Level. Sondern: wie sich jemand entwickelt hat.
export const JOURNEY_DIMENSIONS = {
  resonance: {
    label:       'Resonanz',
    description: 'Wie viele Menschen haben deine Arbeit wirklich berührt?',
    signal:      'recommendations_received',
    quality:     true,  // Qualität zählt mehr als Menge
  },
  collaboration: {
    label:       'Zusammenarbeit',
    description: 'Mit wem hast du gemeinsam etwas geschaffen?',
    signal:      'completed_collaborations',
    quality:     true,
  },
  breadth: {
    label:       'Breite',
    description: 'In wie vielen verschiedenen Feldern bist du aktiv?',
    signal:      'creative_domains',
    quality:     false,
  },
  depth: {
    label:       'Tiefe',
    description: 'Wie sehr vertiefst du dich in deine Praxis?',
    signal:      'long_term_projects',
    quality:     true,
  },
  bridge: {
    label:       'Brückenbau',
    description: 'Verbindest du kreative Welten, die sich sonst nicht begegnen?',
    signal:      'bridge_score',
    quality:     true,
  },
  local: {
    label:       'Lokale Verwurzelung',
    description: 'Wie sehr bist du in deiner Region kreativ präsent?',
    signal:      'local_collaborations',
    quality:     false,
  },
};

// ── Journey Phasen ──────────────────────────────────────────────
// Beschreibend — nicht hierarchisch
export const JOURNEY_PHASES = {
  emerging:      { label: 'Entstehend',    description: 'Gerade angekommen in der kreativen Welt.' },
  finding:       { label: 'Suchend',       description: 'Auf der Suche nach der eigenen Stimme.' },
  deepening:     { label: 'Vertiefend',    description: 'In die Tiefe gehend, die eigene Praxis ausformend.' },
  connecting:    { label: 'Verbindend',    description: 'Andere einladend, gemeinsam schaffend.' },
  bridging:      { label: 'Brückenbauend', description: 'Zwischen Welten stehend, Brücken bauend.' },
  resonating:    { label: 'Resonierend',   description: 'Die Arbeit trägt sich selbst durch Resonanz.' },
  passing_on:    { label: 'Weitergeben',   description: 'Wissen und Erfahrung weitergeben.' },
};

// ── Collaboration Memory ────────────────────────────────────────

/**
 * Erkennt die kreative Phase aus Signalen.
 * Nicht gamifiziert — nur beschreibend.
 */
export function detectJourneyPhase(signals = {}) {
  const {
    completedCollabs = 0,
    recommendations  = 0,
    bridgeScore      = 0,
    localCollabs     = 0,
    monthsActive     = 0,
    hasMentored      = false,
  } = signals;

  if (hasMentored && completedCollabs > 10)   return JOURNEY_PHASES.passing_on;
  if (bridgeScore > 0.5 && completedCollabs > 5) return JOURNEY_PHASES.bridging;
  if (recommendations > 5 && completedCollabs > 3) return JOURNEY_PHASES.resonating;
  if (completedCollabs > 2)                   return JOURNEY_PHASES.connecting;
  if (monthsActive > 6)                       return JOURNEY_PHASES.deepening;
  if (monthsActive > 2)                       return JOURNEY_PHASES.finding;
  return JOURNEY_PHASES.emerging;
}

/**
 * Berechnet einen ruhigen, qualitativen Journey-Score.
 * KEIN Ranking. Nur für persönliche Reflexion.
 * Wird nie öffentlich als Zahl gezeigt.
 */
export function computeJourneyDepth(signals = {}) {
  const {
    completedCollabs    = 0,
    recommendations     = 0,
    bridgeScore         = 0,
    uniqueCollaborators = 0,
    creativeDomainsCount= 1,
    longTermProjects    = 0,
  } = signals;

  // Qualitative Gewichtung — Tiefe > Menge
  const resonanceDepth    = Math.min(recommendations / 3, 1) * 0.30;
  const collaborationDepth= Math.min(uniqueCollaborators / 5, 1) * 0.25;
  const bridgeDepth       = bridgeScore * 0.20;
  const breadthBonus      = Math.min(creativeDomainsCount / 4, 1) * 0.10;
  const longevity         = Math.min(longTermProjects / 3, 1) * 0.15;

  return Math.min(
    resonanceDepth + collaborationDepth + bridgeDepth + breadthBonus + longevity,
    1.0
  );
}

/**
 * Erzeugt eine Collaboration Memory — das geteilte Gedächtnis
 * einer kreativen Zusammenarbeit.
 */
export function createCollaborationMemory({
  projectId   = null,
  creatorA,
  creatorB,
  projectName,
  outcome     = '',
  mood        = null,
  duration    = null,
  artefacts   = [],  // Was entstand? (URLs, Beschreibungen)
  resonance   = '',  // Was war besonders?
}) {
  return {
    id:             `collab_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    project_id:     projectId,
    participants:   [creatorA, creatorB].filter(Boolean),
    project_name:   projectName?.trim() || 'Gemeinsames Werk',
    outcome:        outcome?.trim() || '',
    mood,
    duration_days:  duration,
    artefacts:      artefacts.slice(0, 5),
    resonance_note: resonance?.trim() || '',
    // Kein öffentliches Rating — nur privates Gedächtnis
    is_private:     true,
    created_at:     new Date().toISOString(),
  };
}

/**
 * Erzeugt einen Resonance Moment — ein bedeutsamer Moment
 * in der kreativen Geschichte zweier Creators.
 */
export function createResonanceMoment({
  type,    // 'first_collab' | 'deep_session' | 'recommendation' | 'bridge'
  creatorId,
  targetId = null,
  note     = '',
  mood     = null,
}) {
  const MOMENT_TYPES = {
    first_collab:   'Erste Zusammenarbeit',
    deep_session:   'Tiefe gemeinsame Session',
    recommendation: 'Empfehlung ausgesprochen',
    bridge:         'Kreative Brücke gebaut',
    long_project:   'Langfristiges Projekt abgeschlossen',
    local_meeting:  'Lokale Begegnung',
    mentorship:     'Weitergabe und Lernen',
  };

  return {
    id:           `moment_${Date.now()}`,
    type,
    label:        MOMENT_TYPES[type] || type,
    creator_id:   creatorId,
    target_id:    targetId,
    note:         note?.trim() || '',
    mood,
    is_private:   true,  // Gehört dem Creator — nicht dem Algorithmus
    created_at:   new Date().toISOString(),
  };
}

// ── Interdisciplinary Transition Tracker ───────────────────────
/**
 * Erkennt wenn ein Creator kreative Grenzen überschreitet.
 * Bridge-Moment: wenn jemand in einem neuen Feld aktiv wird.
 */
export function detectInterdisciplinaryTransition(currentDomains = [], newDomain) {
  if (currentDomains.includes(newDomain)) return null;

  const DOMAIN_FAMILIES = {
    visual:   ['fotografie', 'illustration', 'malerei', 'design', 'video'],
    sonic:    ['musik', 'sound', 'podcast', 'hörspiel', 'gesang'],
    crafted:  ['keramik', 'schmuck', 'textil', 'holz', 'metall', 'glas'],
    body:     ['tanz', 'yoga', 'bewegung', 'theater', 'performance'],
    written:  ['text', 'lyrik', 'storytelling', 'journalismus', 'blog'],
    space:    ['architektur', 'innenarchitektur', 'garten', 'urban design'],
    digital:  ['code', 'web', 'app', 'interactive', 'generative art'],
  };

  const currentFamilies = new Set(
    Object.entries(DOMAIN_FAMILIES)
      .filter(([, domains]) => domains.some(d => currentDomains.includes(d)))
      .map(([family]) => family)
  );

  const newFamily = Object.entries(DOMAIN_FAMILIES)
    .find(([, domains]) => domains.includes(newDomain))?.[0];

  const isBridge = newFamily && !currentFamilies.has(newFamily);

  return {
    detected:    isBridge,
    fromFamilies:[...currentFamilies],
    toFamily:    newFamily || 'unknown',
    newDomain,
    moment:      isBridge
      ? createResonanceMoment({ type: 'bridge', creatorId: null })
      : null,
  };
}

// ── React Hook ──────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCreativeJourney(userId) {
  const [journey,  setJourney]  = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const [profileRes, collabRes, recRes] = await Promise.all([
        supabase.from('profiles').select(
          'created_at, dna_tags, talent, focus_type, total_bookings_completed'
        ).eq('id', userId).single(),
        supabase.from('bookings').select('id, status, created_at, client_user_id')
          .eq('wirker_user_id', userId).eq('status', 'completed').limit(50),
        supabase.from('recommendations').select('id, created_at')
          .eq('recipient_id', userId).limit(50),
      ]);

      const profile    = profileRes.data || {};
      const collabs    = collabRes.data  || [];
      const recs       = recRes.data     || [];
      const monthsActive = profile.created_at
        ? Math.round((Date.now() - new Date(profile.created_at).getTime()) / 2592000000)
        : 0;

      const uniqueCollabs = new Set(collabs.map(c => c.client_user_id)).size;
      const signals = {
        completedCollabs:     collabs.length,
        recommendations:      recs.length,
        uniqueCollaborators:  uniqueCollabs,
        creativeDomainsCount: (profile.dna_tags || []).length,
        monthsActive,
      };

      const phase = detectJourneyPhase(signals);
      const depth = computeJourneyDepth(signals);

      setJourney({
        phase,
        depth,
        signals,
        domains:   profile.dna_tags || [],
        monthsActive,
      });

      // Collaboration Memories (letzte 5)
      const recentCollabs = collabs.slice(0, 5).map(c =>
        createCollaborationMemory({
          projectId: c.id,
          creatorA:  userId,
          creatorB:  c.client_user_id,
          projectName: 'Gemeinsames Werk',
          duration:  Math.round(
            (new Date(c.created_at).getTime() - Date.now()) / -86400000
          ),
        })
      );
      setMemories(recentCollabs);

    } catch (err) {
      console.error('[CreativeJourney]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { journey, memories, loading, reload: load };
}
