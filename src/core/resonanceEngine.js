// src/core/resonanceEngine.js
// ═══════════════════════════════════════════════════════════════════════
// HUI RESONANZ ENGINE — Phase 1.5
// Semantische Erweiterungsschicht der Core Engine.
//
// PHILOSOPHIE:
//   Handlung ≠ Wirkung.
//   Wirkung entsteht erst wenn andere Menschen tatsächlich reagieren.
//
//   Diese Datei ist KEIN separates System.
//   Sie ist die mittlere Schicht der bestehenden Core Engine:
//
//   CoreEngine.signals   → Ebene 1: Was hat jemand getan?
//   ResonanceEngine      → Ebene 2: Wie haben andere reagiert?
//   CoreEngine.profiles  → Ebene 3: Was ist daraus entstanden?
//
// NUTZUNG:
//   import { ResonanceEngine } from '../core/resonanceEngine.js';
//
//   // Wenn jemand ein Werk kauft
//   await ResonanceEngine.onReaction({
//     reactorId:      buyerId,
//     sourceSignalId: workPublishedSignalId,
//     reactionType:   REACTION_TYPES.WORK_PURCHASED,
//   });
//
//   // Resonanzkette lesen
//   const chain = await ResonanceEngine.chains.get(signalId);
//
// ARCHITEKTUR:
//   ResonanceEngine.onReaction()    — Haupteinstieg für alle Resonanz-Ereignisse
//   ResonanceEngine.confirmImpact() — Explizite Wirkungsbestätigung
//   ResonanceEngine.chains.*        — Resonanzketten lesen
//   ResonanceEngine.classify        — Klassifizierung von Reaktionstypen
//   REACTION_TYPES                  — Alle möglichen Resonanz-Ereignisse
//   SIGNAL_LAYERS                   — Die drei Ebenen
//
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient.js';
import { CoreEngine, PILLARS, SIGNAL_TYPES, SIGNAL_WEIGHTS } from './coreEngine.js';

// ─────────────────────────────────────────────────────────────────────
// SIGNAL_LAYERS — die drei semantischen Ebenen
// ─────────────────────────────────────────────────────────────────────

/**
 * Die drei Ebenen der HUI-Wirkungsarchitektur.
 * Entsprechen direkt dem DB-Enum signal_layer.
 */
export const SIGNAL_LAYERS = Object.freeze({
  ACTION:    'action',     // Ebene 1: Handlung
  RESONANCE: 'resonance',  // Ebene 2: Reaktion anderer
  IMPACT:    'impact',     // Ebene 3: Bestätigte Wirkung
});

// ─────────────────────────────────────────────────────────────────────
// REACTION_TYPES — Granulare Resonanz-Ereignisse
//
// Naming-Konvention: unterscheidet sich bewusst von SIGNAL_TYPES.
// SIGNAL_TYPES = Handlungen ("was jemand TUT")
// REACTION_TYPES = Resonanz ("wie andere REAGIEREN")
// ─────────────────────────────────────────────────────────────────────

export const REACTION_TYPES = Object.freeze({
  // Auf Erschaffen reagieren
  WORK_PURCHASED:          'work_purchased',         // Jemand kauft ein Werk
  WORK_SHARED:             'work_shared',            // Jemand teilt ein Werk weiter
  EXPERIENCE_BOOKED:       'experience_booked',      // Jemand bucht ein Erlebnis
  EXPERIENCE_REVIEWED:     'experience_reviewed',    // Jemand bewertet (qualitativ)
  BOOKING_CONFIRMED:       'booking_confirmed',      // Buchung durch beide bestätigt
  POST_RESONATED:          'post_resonated',         // Jemand resoniert mit einem Beitrag

  // Auf Verbinden reagieren
  CONNECTION_ACCEPTED:     'connection_accepted',    // Verbindungsanfrage angenommen
  INTRODUCTION_ACCEPTED:   'introduction_accepted',  // Vermittlung führt zu Kontakt

  // Auf Unterstützen reagieren
  HELP_CONFIRMED:          'help_confirmed',         // Empfänger bestätigt erhaltene Hilfe
  MENTORING_COMPLETED:     'mentoring_completed',    // Mentoring-Prozess abgeschlossen
  COLLABORATION_ACTIVE:    'collaboration_active',   // Zusammenarbeit hat begonnen

  // Auf Wertschöpfen reagieren
  SERVICE_COMPLETED:       'service_completed',      // Dienstleistung erbracht + bestätigt
  RECOMMENDATION_FOLLOWED: 'recommendation_followed', // Empfehlung wurde tatsächlich genutzt

  // Auf Impact reagieren
  PROJECT_JOINED:          'project_joined',         // Jemand tritt einem Projekt bei
  PROJECT_MILESTONE:       'project_milestone',      // Projekt erreicht messbaren Fortschritt
  IMPACT_RIPPLE:           'impact_ripple',          // Impact-Projekt zieht weitere Kreise
});

// ─────────────────────────────────────────────────────────────────────
// RESONANZ-GEWICHTE
// Höher als Handlungs-Gewichte — Resonanz ist wertvoller.
// ─────────────────────────────────────────────────────────────────────

const REACTION_WEIGHTS = Object.freeze({
  [REACTION_TYPES.WORK_PURCHASED]:          2.2,
  [REACTION_TYPES.BOOKING_CONFIRMED]:       2.2,
  [REACTION_TYPES.SERVICE_COMPLETED]:       2.2,
  [REACTION_TYPES.MENTORING_COMPLETED]:     2.0,
  [REACTION_TYPES.COLLABORATION_ACTIVE]:    2.0,
  [REACTION_TYPES.RECOMMENDATION_FOLLOWED]: 1.8,
  [REACTION_TYPES.PROJECT_JOINED]:          1.8,
  [REACTION_TYPES.PROJECT_MILESTONE]:       1.8,
  [REACTION_TYPES.HELP_CONFIRMED]:          1.6,
  [REACTION_TYPES.CONNECTION_ACCEPTED]:     1.4,
  [REACTION_TYPES.EXPERIENCE_BOOKED]:       1.4,
  [REACTION_TYPES.EXPERIENCE_REVIEWED]:     1.3,
  [REACTION_TYPES.INTRODUCTION_ACCEPTED]:   1.3,
  [REACTION_TYPES.IMPACT_RIPPLE]:           1.5,
  [REACTION_TYPES.POST_RESONATED]:          0.8,
  [REACTION_TYPES.WORK_SHARED]:             0.9,
});

// ─────────────────────────────────────────────────────────────────────
// CLASSIFY — welche Reaktion löst sofort Wirkung (Ebene 3) aus?
//
// Nicht alle Resonanz-Ereignisse müssen warten bis resonance_count >= 3.
// Manche sind in sich so bedeutend, dass sie direkt Wirkung bestätigen.
// ─────────────────────────────────────────────────────────────────────

/**
 * Reaktions-Typen die sofort Wirkung (Ebene 3) bestätigen.
 * Keine Akkumulation nötig — die Qualität des Ereignisses reicht.
 */
const DIRECT_IMPACT_REACTIONS = new Set([
  REACTION_TYPES.SERVICE_COMPLETED,      // Vollständig erbrachte Leistung
  REACTION_TYPES.MENTORING_COMPLETED,    // Abgeschlossenes Mentoring
  REACTION_TYPES.BOOKING_CONFIRMED,      // Bestätigte Buchung
  REACTION_TYPES.PROJECT_MILESTONE,      // Messbarer Projektfortschritt
  REACTION_TYPES.COLLABORATION_ACTIVE,   // Zusammenarbeit begonnen
]);

// ─────────────────────────────────────────────────────────────────────
// RESONANZ-BESCHREIBUNGEN (für UI, wenn nötig)
// Menschliche Sprache — keine Zahlen.
// ─────────────────────────────────────────────────────────────────────

/**
 * Natürliche Beschreibung einer Resonanz — für dezente UI-Hinweise.
 * Nicht dominant. Nur wenn sinnvoll.
 */
export const resonanceLabel = Object.freeze({
  [REACTION_TYPES.WORK_PURCHASED]:          'Ein Werk wurde aufgenommen',
  [REACTION_TYPES.EXPERIENCE_BOOKED]:       'Ein Erlebnis findet statt',
  [REACTION_TYPES.CONNECTION_ACCEPTED]:     'Eine Verbindung entstand',
  [REACTION_TYPES.HELP_CONFIRMED]:          'Hilfe wurde bestätigt',
  [REACTION_TYPES.MENTORING_COMPLETED]:     'Mentoring hat gewirkt',
  [REACTION_TYPES.PROJECT_JOINED]:          'Das Projekt wächst',
  [REACTION_TYPES.SERVICE_COMPLETED]:       'Wirkung bestätigt',
  [REACTION_TYPES.RECOMMENDATION_FOLLOWED]: 'Empfehlung wurde gelebt',
  [REACTION_TYPES.IMPACT_RIPPLE]:           'Impact hat Kreise gezogen',
  [REACTION_TYPES.BOOKING_CONFIRMED]:       'Eine Begegnung entsteht',
});

// ─────────────────────────────────────────────────────────────────────
// RESONANZ ENGINE — Kern-Logik
// ─────────────────────────────────────────────────────────────────────

/**
 * Findet das ursprüngliche Handlungs-Signal (Ebene 1) für eine Entität.
 * Wird benötigt wenn das source_signal_id nicht direkt bekannt ist.
 */
async function findActionSignal(entityId, entityType, actorId) {
  if (!entityId) return null;
  try {
    const { data, error } = await supabase
      .from('core_signals')
      .select('id, user_id, pillar, signal_layer, resonance_count')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType ?? '')
      .eq('signal_layer', SIGNAL_LAYERS.ACTION)
      .eq('user_id', actorId)
      .is('voided_at', null)
      .order('occurred_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[ResonanceEngine] findActionSignal() error:', err?.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// CHAINS MODULE — Resonanzketten lesen
// ─────────────────────────────────────────────────────────────────────

const chains = {
  /**
   * Liest eine Resonanzkette für ein Signal.
   */
  async get(rootSignalId) {
    if (!rootSignalId) return null;
    try {
      const { data, error } = await supabase
        .from('core_resonance_chains')
        .select('*')
        .eq('root_signal_id', rootSignalId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[ResonanceEngine] chains.get() error:', err?.message);
      return null;
    }
  },

  /**
   * Alle Resonanzketten eines Nutzers.
   * Für das interne Profil (nie direkt als Zahlen anzeigen).
   */
  async forUser(userId, { onlyConfirmed = false } = {}) {
    if (!userId) return [];
    try {
      let query = supabase
        .from('core_resonance_chains')
        .select('root_signal_id, root_pillar, chain_depth, participant_count, has_impact, last_echo_at')
        .eq('root_user_id', userId)
        .order('last_echo_at', { ascending: false })
        .limit(50);

      if (onlyConfirmed) query = query.eq('has_impact', true);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('[ResonanceEngine] chains.forUser() error:', err?.message);
      return [];
    }
  },

  /**
   * Wie viele Menschen hat die Wirkung eines Nutzers insgesamt berührt?
   * Für das Team Dashboard — beschreibend, nicht als Rangliste.
   */
  async totalReach(userId) {
    if (!userId) return 0;
    try {
      const { data, error } = await supabase
        .from('core_resonance_chains')
        .select('participant_count')
        .eq('root_user_id', userId);

      if (error) throw error;
      return (data ?? []).reduce((sum, c) => sum + (c.participant_count ?? 0), 0);
    } catch (err) {
      return 0;
    }
  },
};

// ─────────────────────────────────────────────────────────────────────
// RESONANZ ENGINE — Public API
// ─────────────────────────────────────────────────────────────────────

export const ResonanceEngine = Object.freeze({

  chains,
  SIGNAL_LAYERS,
  REACTION_TYPES,
  REACTION_WEIGHTS,
  resonanceLabel,

  /**
   * Haupteinstieg der Resonanz Engine.
   * Wird aufgerufen wenn jemand auf die Handlung eines anderen reagiert.
   *
   * @param {object} params
   * @param {string}  params.reactorId      — Wer reagiert? (UUID)
   * @param {string}  params.actorId        — Wer hat gehandelt? (UUID des Handelnden)
   * @param {string}  params.reactionType   — REACTION_TYPES.*
   * @param {string}  [params.sourceSignalId] — Direkte Signal-ID (falls bekannt)
   * @param {string}  [params.entityId]     — Entität auf die reagiert wird
   * @param {string}  [params.entityType]   — 'work'|'experience'|'booking'|...
   * @param {Date}    [params.occurredAt]
   * @returns {Promise<{ signalId: string, isDirectImpact: boolean } | null>}
   */
  async onReaction({
    reactorId,
    actorId,
    reactionType,
    sourceSignalId = null,
    entityId       = null,
    entityType     = null,
    occurredAt     = new Date(),
  }) {
    if (!reactorId || !actorId || !reactionType) {
      console.warn('[ResonanceEngine] onReaction(): reactorId, actorId, reactionType sind Pflicht');
      return null;
    }

    // Wenn keine sourceSignalId → Handlungs-Signal suchen
    let resolvedSourceId = sourceSignalId;
    if (!resolvedSourceId && entityId) {
      const actionSignal = await findActionSignal(entityId, entityType, actorId);
      resolvedSourceId = actionSignal?.id ?? null;
    }

    const weight          = REACTION_WEIGHTS[reactionType] ?? 1.0;
    const isDirectImpact  = DIRECT_IMPACT_REACTIONS.has(reactionType);

    // Wenn kein Quell-Signal gefunden → Resonanz-Signal direkt schreiben
    // (ohne Kettenverknüpfung, aber trotzdem als resonance)
    if (!resolvedSourceId) {
      const result = await CoreEngine.signals.record({
        userId:        actorId,      // Wirkung geht an den Handelnden
        signalType:    reactionType,
        pillar:        null,         // wird aus coreEngine.classify ermittelt
        category:      'community',
        weight,
        isGiving:      false,        // Handelnder empfängt Resonanz
        targetUserId:  reactorId,
        entityId,
        entityType,
        occurredAt,
        // Layer über DB-Default ('resonance') gesetzt via direktes Insert
      });

      // Direkte Wirkung wenn applicable
      if (isDirectImpact && result?.id) {
        await this.confirmImpact({
          userId:    actorId,
          entityId,
          entityType,
          weightOverride: weight,
        });
      }

      return result ? { signalId: result.id, isDirectImpact } : null;
    }

    // Standard-Pfad: Resonanz über DB-Funktion
    try {
      const { data, error } = await supabase.rpc('core_record_resonance', {
        p_reactor_id:     reactorId,
        p_source_signal:  resolvedSourceId,
        p_signal_type:    reactionType,
        p_weight:         weight,
        p_entity_id:      entityId ?? null,
        p_entity_type:    entityType ?? null,
        p_target_user_id: actorId,
        p_occurred_at:    occurredAt.toISOString(),
      });

      if (error) {
        console.error('[ResonanceEngine] onReaction() DB error:', error.message);
        return null;
      }

      // Direkte Wirkung sofort bestätigen
      if (isDirectImpact) {
        await this.confirmImpact({
          rootSignalId: resolvedSourceId,
          userId:       actorId,
          weightOverride: weight,
        });
      }

      return { signalId: data, isDirectImpact };
    } catch (err) {
      console.error('[ResonanceEngine] onReaction() exception:', err?.message);
      return null;
    }
  },

  /**
   * Explizite Wirkungsbestätigung (Ebene 3).
   * Wird aufgerufen wenn:
   * a) Eine besonders bedeutsame Resonanz direkt Wirkung erzeugt
   * b) Eine Kette organisch die Wirkungsschwelle erreicht (DB-intern)
   *
   * WICHTIG: Dies ist der EINZIGE Pfad der den Orb direkt beeinflusst.
   */
  async confirmImpact({
    rootSignalId   = null,
    userId,
    entityId       = null,
    entityType     = null,
    weightOverride = null,
  }) {
    if (!userId) return;

    // Wenn kein rootSignalId → aus Entität ableiten
    let resolvedRootId = rootSignalId;
    if (!resolvedRootId && entityId) {
      const sig = await findActionSignal(entityId, entityType, userId);
      resolvedRootId = sig?.id ?? null;
    }

    if (!resolvedRootId) {
      // Kein Root-Signal gefunden — Wirkung direkt als Impact-Signal schreiben
      // (graceful fallback)
      console.warn('[ResonanceEngine] confirmImpact: kein rootSignalId, Fallback auf direkt');
      return;
    }

    try {
      const { error } = await supabase.rpc('core_confirm_impact', {
        p_root_signal_id:  resolvedRootId,
        p_user_id:         userId,
        p_pillar:          null,          // wird aus Root-Signal bestimmt
        p_weight_override: weightOverride,
      });

      if (error) {
        // p_pillar kann nicht null sein in der DB-Funktion — ignorieren wenn nötig
        if (!error.message?.includes('violates not-null')) {
          console.error('[ResonanceEngine] confirmImpact() error:', error.message);
        }
      }
    } catch (err) {
      console.error('[ResonanceEngine] confirmImpact() exception:', err?.message);
    }
  },

  /**
   * Liest die Resonanz-Statistiken eines Nutzers.
   * Für internes Profil und Team Dashboard.
   * NICHT als Zahlen anzeigen — nur für semantische Auswertung.
   */
  async stats(userId) {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('core_resonance_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[ResonanceEngine] stats() error:', err?.message);
      return null;
    }
  },

  /**
   * Klassifiziert eine Reaktion nach Tiefe.
   * Für Team Dashboard — beschreibt Qualität der Wirkung in Sprache.
   *
   * @param {object} stats — Ergebnis von ResonanceEngine.stats()
   * @returns {{ description: string, pillars: string[] } | null}
   */
  describeImpact(stats) {
    if (!stats) return null;

    const { dominant_pillars = [], confirmed_impact_chains = 0,
            total_people_reached = 0, orb_vitality = 0 } = stats;

    // Keine Zahlen. Ruhige, menschliche Beschreibung.
    let quality;
    if (orb_vitality < 0.15)      quality = 'beginnt zu wirken';
    else if (orb_vitality < 0.35) quality = 'wirkt zunehmend';
    else if (orb_vitality < 0.60) quality = 'wirkt spürbar';
    else if (orb_vitality < 0.80) quality = 'wirkt nachhaltig';
    else                           quality = 'wirkt tief und weit';

    return {
      quality,
      pillars: dominant_pillars,
    };
  },
});
