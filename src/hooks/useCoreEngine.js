// src/hooks/useCoreEngine.js
// ═══════════════════════════════════════════════════════════════════════
// HUI CORE ENGINE — React Integration
// Hooks für die Nutzung der Core Engine in React-Komponenten.
//
// DESIGN-PRINZIP:
//   Alle Hooks sind read-only aus Komponenten-Sicht.
//   Schreiben erfolgt ausschließlich über CoreEngine.signals.record().
//   Keine direkten DB-Zugriffe in Komponenten.
//
// NUTZUNG:
//   // Eigenes Wirkungsprofil
//   const { dominantPillars, orbParams, isLoading } = useCoreProfile(userId);
//
//   // Signal aufzeichnen
//   const { record } = useCoreSignal();
//   await record({ signalType: SIGNAL_TYPES.WORK_PUBLISHED, userId, entityId });
//
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { CoreEngine, SIGNAL_TYPES, PILLARS } from '../core/coreEngine.js';
import { ResonanceEngine, REACTION_TYPES, SIGNAL_LAYERS, resonanceLabel }
  from '../core/resonanceEngine.js';
import { OrbEngine } from '../core/orbEngine.js';

// ─────────────────────────────────────────────────────────────────────
// useCoreProfile
// Liest den Wirkungsstand + Orb-Parameter eines Nutzers.
// Cached — kein unnötiger DB-Zugriff.
// ─────────────────────────────────────────────────────────────────────

/**
 * Liest das Core-Profil und die Orb-Parameter eines Nutzers.
 * @param {string | null} userId
 * @returns {{
 *   coreProfile: object | null,
 *   orbParams: object,
 *   dominantPillars: string[],
 *   pillarLabels: Array<{label, icon, description}>,
 *   isLoading: boolean,
 *   refresh: () => void,
 * }}
 */
export function useCoreProfile(userId) {
  const [coreProfile, setCoreProfile] = useState(null);
  const [orbParams,   setOrbParams]   = useState(() => OrbEngine.defaultParams());
  const [isLoading,   setIsLoading]   = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      // Parallel: Core Profile + Orb Parameter
      const [profile, params] = await Promise.all([
        CoreEngine.profiles.get(userId),
        OrbEngine.computeParams(userId),
      ]);

      if (!mountedRef.current) return;
      setCoreProfile(profile);
      setOrbParams(params);
    } catch (err) {
      console.error('[useCoreProfile] error:', err?.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const dominantPillars = coreProfile?.dominant_pillars ?? [];
  const pillarLabels    = OrbEngine.pillarLabels(dominantPillars);

  return {
    coreProfile,
    orbParams,
    dominantPillars,
    pillarLabels,
    isLoading,
    refresh: load,
  };
}

// ─────────────────────────────────────────────────────────────────────
// useCoreSignal
// Hook zum Aufzeichnen von Wirkungssignalen.
// Verhindert doppeltes Aufzeichnen (deduplication).
// ─────────────────────────────────────────────────────────────────────

/**
 * Stellt die record()-Funktion zur Verfügung.
 * Automatisch deduplication (dasselbe Signal nicht 2x in 5s).
 */
export function useCoreSignal() {
  const recentRef = useRef(new Set());

  const record = useCallback(async (params) => {
    if (!params?.userId || !params?.signalType) return null;

    // Deduplication — verhindert doppelte Signals bei mehrfachen Klicks
    const dedupKey = `${params.userId}:${params.signalType}:${params.entityId ?? ''}`;
    if (recentRef.current.has(dedupKey)) return null;

    recentRef.current.add(dedupKey);
    setTimeout(() => recentRef.current.delete(dedupKey), 5000);

    return CoreEngine.signals.record(params);
  }, []);

  return { record, SIGNAL_TYPES, PILLARS };
}

// ─────────────────────────────────────────────────────────────────────
// useOrbParams
// Nur die visuellen Orb-Parameter — ohne Core-Profile-Overhead.
// Für Tabbar / BottomNav — schnell und leichtgewichtig.
// ─────────────────────────────────────────────────────────────────────

/**
 * Schneller Hook für visuelle Orb-Parameter.
 * Nutzt 5-Minuten-Cache.
 */
const _orbCache = new Map();  // Modul-Level Cache

export function useOrbParams(userId) {
  const [params, setParams] = useState(() => OrbEngine.defaultParams());
  const [ready,  setReady]  = useState(false);

  useEffect(() => {
    if (!userId) { setReady(true); return; }

    // Cache prüfen (5 Minuten TTL)
    const cached = _orbCache.get(userId);
    if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
      setParams(cached.params);
      setReady(true);
      return;
    }

    let active = true;
    OrbEngine.computeParams(userId).then(p => {
      if (!active) return;
      _orbCache.set(userId, { params: p, ts: Date.now() });
      setParams(p);
      setReady(true);
    }).catch(() => {
      if (active) setReady(true);
    });

    return () => { active = false; };
  }, [userId]);

  return { params, ready };
}

// ─────────────────────────────────────────────────────────────────────
// useContentPillar
// Liest den Grundpfeiler eines Inhalts (für dezente Feed-Hinweise).
// ─────────────────────────────────────────────────────────────────────

/**
 * Gibt den primären Grundpfeiler und den Feed-Hinweis für einen Inhalt.
 * @param {string} entityId
 * @param {'work'|'experience'|'post'|'impact_project'} entityType
 */
export function useContentPillar(entityId, entityType) {
  const [pillar, setPillar] = useState(null);
  const [hint,   setHint]   = useState(null);

  useEffect(() => {
    if (!entityId || !entityType) return;
    let active = true;

    CoreEngine.content.getPillar(entityId, entityType).then(p => {
      if (!active) return;
      setPillar(p);
      setHint(p ? OrbEngine.feedHint(p) : null);
    }).catch(() => {});

    return () => { active = false; };
  }, [entityId, entityType]);

  return { pillar, hint };
}

// ─────────────────────────────────────────────────────────────────────
// SIGNAL HELPERS
// Convenience-Funktionen für häufige Signal-Typen.
// Werden von anderen Services aufgerufen — nicht direkt in UI-Komponenten.
// ─────────────────────────────────────────────────────────────────────

/**
 * Hilfsfunktionen für häufige Signal-Typen.
 * Importierbar ohne Hook (für Services).
 */
export const signalHelpers = Object.freeze({

  /** Wird aufgerufen wenn ein Werk veröffentlicht wird.
   *  Ebene 1 (Handlung) — beeinflusst den Orb NICHT direkt.
   *  Wirkung entsteht erst wenn jemand kauft (→ resonanceHelpers.onWorkPurchased). */
  async onWorkPublished(userId, workId) {
    await Promise.all([
      CoreEngine.signals.record({
        userId, signalType: SIGNAL_TYPES.WORK_PUBLISHED,
        entityId: workId, entityType: 'work',
        // signal_layer: 'action' ist der Default — kein Orb-Einfluss
      }),
      CoreEngine.content.register({
        entityId: workId, entityType: 'work',
        creatorId: userId, metadata: {},
      }),
    ]);
  },

  /** Wird aufgerufen wenn ein Erlebnis gebucht wurde. */
  async onExperienceBooked(buyerId, sellerId, experienceId) {
    await Promise.all([
      // Käufer: Verbindungs-Signal (trifft neuen Menschen)
      CoreEngine.signals.record({
        userId: buyerId, signalType: SIGNAL_TYPES.EXPERIENCE_BOOKED,
        targetUserId: sellerId, entityId: experienceId, entityType: 'experience',
        isGiving: true,
      }),
      // Verkäufer: Wertschöpfungs-Signal
      CoreEngine.signals.record({
        userId: sellerId, signalType: SIGNAL_TYPES.EXPERIENCE_BOOKED,
        targetUserId: buyerId, entityId: experienceId, entityType: 'experience',
        isGiving: false,
      }),
    ]);
  },

  /** Wird aufgerufen wenn eine Buchung erfolgreich abgeschlossen ist. */
  async onBookingCompleted(providerId, clientId, bookingId) {
    await Promise.all([
      CoreEngine.signals.record({
        userId: providerId, signalType: SIGNAL_TYPES.BOOKING_COMPLETED,
        targetUserId: clientId, entityId: bookingId, entityType: 'booking',
        isGiving: true,
      }),
      CoreEngine.signals.record({
        userId: clientId, signalType: SIGNAL_TYPES.BOOKING_COMPLETED,
        targetUserId: providerId, entityId: bookingId, entityType: 'booking',
        isGiving: false,
      }),
    ]);
  },

  /** Wird aufgerufen wenn jemand ein Impact-Projekt unterstützt. */
  async onImpactProjectSupported(userId, projectId) {
    return CoreEngine.signals.record({
      userId, signalType: SIGNAL_TYPES.IMPACT_PROJECT_SUPPORTED,
      entityId: projectId, entityType: 'impact_project',
      isGiving: true,
    });
  },

  /** Wird aufgerufen wenn eine Verbindung hergestellt wird. */
  async onConnectionCreated(initiatorId, targetId) {
    return CoreEngine.signals.record({
      userId: initiatorId, signalType: SIGNAL_TYPES.CONNECTION_CREATED,
      targetUserId: targetId, isGiving: true,
    });
  },

  /** Wird aufgerufen wenn ein Impact-Projekt erstellt wird. */
  async onImpactProjectCreated(userId, projectId) {
    await Promise.all([
      CoreEngine.signals.record({
        userId, signalType: SIGNAL_TYPES.IMPACT_PROJECT_CREATED,
        entityId: projectId, entityType: 'impact_project',
        isGiving: true,
      }),
      CoreEngine.content.register({
        entityId: projectId, entityType: 'impact_project',
        creatorId: userId, metadata: {},
      }),
    ]);
  },

  /** Wird aufgerufen wenn ein Ambassador einen neuen Nutzer wirbt. */
  async onAmbassadorReferral(ambassadorId, newUserId) {
    return CoreEngine.signals.record({
      userId: ambassadorId, signalType: SIGNAL_TYPES.AMBASSADOR_REFERRED,
      targetUserId: newUserId, isGiving: true,
    });
  },

  /** Wird aufgerufen wenn ein Werk verkauft wird. */
  async onWorkSold(sellerId, buyerId, workId) {
    await Promise.all([
      CoreEngine.signals.record({
        userId: sellerId, signalType: SIGNAL_TYPES.WORK_SOLD,
        targetUserId: buyerId, entityId: workId, entityType: 'work',
        isGiving: true,
      }),
      CoreEngine.signals.record({
        userId: buyerId, signalType: SIGNAL_TYPES.SUPPORT_GIVEN,
        targetUserId: sellerId, entityId: workId, entityType: 'work',
        isGiving: true,
      }),
    ]);
  },
});

// ─────────────────────────────────────────────────────────────────────
// RESONANZ HELPERS
// Convenience-Funktionen für Resonanz-Ereignisse.
// Werden von anderen Services aufgerufen — nicht direkt in UI-Komponenten.
// ─────────────────────────────────────────────────────────────────────

/**
 * Resonanz-Helfer für häufige Reaktions-Ereignisse.
 * Diese sind Ebene 2 (Resonanz) und bestätigen je nach Typ direkt Wirkung (Ebene 3).
 */
export const resonanceHelpers = Object.freeze({

  /** Werk wurde gekauft → Resonanz für Creator */
  async onWorkPurchased(buyerId, creatorId, workId) {
    return ResonanceEngine.onReaction({
      reactorId:  buyerId,
      actorId:    creatorId,
      reactionType: REACTION_TYPES.WORK_PURCHASED,
      entityId:   workId,
      entityType: 'work',
    });
  },

  /** Erlebnis wurde gebucht → Resonanz für Anbieter */
  async onExperienceBooked(buyerId, providerId, experienceId) {
    return ResonanceEngine.onReaction({
      reactorId:  buyerId,
      actorId:    providerId,
      reactionType: REACTION_TYPES.EXPERIENCE_BOOKED,
      entityId:   experienceId,
      entityType: 'experience',
    });
  },

  /** Buchung vollständig abgeschlossen → direkte Wirkung (Ebene 3) */
  async onBookingConfirmed(clientId, providerId, bookingId) {
    return ResonanceEngine.onReaction({
      reactorId:  clientId,
      actorId:    providerId,
      reactionType: REACTION_TYPES.BOOKING_CONFIRMED,
      entityId:   bookingId,
      entityType: 'booking',
    });
    // BOOKING_CONFIRMED ist in DIRECT_IMPACT_REACTIONS → erzeugt sofort Ebene 3
  },

  /** Dienstleistung abgeschlossen + bestätigt → direkte Wirkung */
  async onServiceCompleted(clientId, providerId, bookingId) {
    return ResonanceEngine.onReaction({
      reactorId:  clientId,
      actorId:    providerId,
      reactionType: REACTION_TYPES.SERVICE_COMPLETED,
      entityId:   bookingId,
      entityType: 'booking',
    });
  },

  /** Verbindungsanfrage angenommen → Resonanz für Initiator */
  async onConnectionAccepted(acceptorId, initiatorId) {
    return ResonanceEngine.onReaction({
      reactorId:  acceptorId,
      actorId:    initiatorId,
      reactionType: REACTION_TYPES.CONNECTION_ACCEPTED,
    });
  },

  /** Hilfe wurde vom Empfänger bestätigt → Resonanz für Helfer */
  async onHelpConfirmed(receiverId, helperId, entityId) {
    return ResonanceEngine.onReaction({
      reactorId:  receiverId,
      actorId:    helperId,
      reactionType: REACTION_TYPES.HELP_CONFIRMED,
      entityId,
      entityType: 'help',
    });
  },

  /** Mentoring abgeschlossen → direkte Wirkung */
  async onMentoringCompleted(menteeId, mentorId) {
    return ResonanceEngine.onReaction({
      reactorId:  menteeId,
      actorId:    mentorId,
      reactionType: REACTION_TYPES.MENTORING_COMPLETED,
    });
  },

  /** Jemand tritt einem Impact-Projekt bei → Resonanz für Projektersteller */
  async onProjectJoined(joinerId, creatorId, projectId) {
    return ResonanceEngine.onReaction({
      reactorId:  joinerId,
      actorId:    creatorId,
      reactionType: REACTION_TYPES.PROJECT_JOINED,
      entityId:   projectId,
      entityType: 'impact_project',
    });
  },

  /** Zusammenarbeit hat aktiv begonnen → direkte Wirkung */
  async onCollaborationActive(collaboratorId, initiatorId) {
    return ResonanceEngine.onReaction({
      reactorId:  collaboratorId,
      actorId:    initiatorId,
      reactionType: REACTION_TYPES.COLLABORATION_ACTIVE,
    });
  },

  /** Impact breitet sich aus (z.B. Projekt erreicht Meilenstein) */
  async onImpactRipple(triggeredById, projectCreatorId, projectId) {
    return ResonanceEngine.onReaction({
      reactorId:  triggeredById,
      actorId:    projectCreatorId,
      reactionType: REACTION_TYPES.IMPACT_RIPPLE,
      entityId:   projectId,
      entityType: 'impact_project',
    });
  },

  /** Ambassador-Referral führt zu aktivem Nutzer → Resonanz */
  async onAmbassadorActivation(newUserId, ambassadorId) {
    return ResonanceEngine.onReaction({
      reactorId:  newUserId,
      actorId:    ambassadorId,
      reactionType: REACTION_TYPES.CONNECTION_ACCEPTED,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────
// useResonanceProfile
// Hook für Resonanz-Statistiken — für internes Profil und Team Dashboard.
// ─────────────────────────────────────────────────────────────────────

/**
 * Resonanz-Statistiken für einen Nutzer.
 * Enthält: Wirkungstiefe, Resonanz-Ketten, beschreibende Qualität.
 * NICHT als Zahlen im UI anzeigen — nur für semantische Auswertung.
 */
export function useResonanceProfile(userId) {
  const [stats,       setStats]   = useState(null);
  const [description, setDesc]    = useState(null);
  const [chains,      setChains]  = useState([]);
  const [isLoading,   setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        ResonanceEngine.stats(userId),
        ResonanceEngine.chains.forUser(userId, { onlyConfirmed: false }),
      ]);
      if (s) {
        setStats(s);
        setDesc(ResonanceEngine.describeImpact(s));
      }
      setChains(c ?? []);
    } catch (err) {
      console.error('[useResonanceProfile]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, description, chains, isLoading, refresh: load };
}

// Re-export für einfachen Import
export { ResonanceEngine, REACTION_TYPES, SIGNAL_LAYERS, resonanceLabel };
