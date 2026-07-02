// src/core/coreEngine.js
// @domain CORE
// @owner core/coreEngine.js
// @responsibility Single Source of Truth für Wirkungsdaten
// @violation V-061 TODO(ADR-0001): DB persistence → CorePersistenceService
//
// PHILOSOPHIE:
//   Die Core Engine erfasst Wirkungssignale — echte menschliche Handlungen.
//   Sie verwaltet KEINE Punkte, XP, Badges oder Scores.
//   Sie ist vollständig unabhängig vom UI.
//   Alle anderen Module (Orb, Feed, Empfehlungen, Projekte) lesen von hier.
//
// NUTZUNG:
//   import { CoreEngine } from '../core/coreEngine.js';
//
//   // Signal aufzeichnen
//   await CoreEngine.signals.record({
//     userId:     'uuid',
//     pillar:     PILLARS.ERSCHAFFEN,
//     category:   SIGNAL_CATEGORIES.CREATION,
//     signalType: SIGNAL_TYPES.WORK_PUBLISHED,
//   });
//
//   // Wirkungsstand lesen
//   const profile = await CoreEngine.profiles.get(userId);
//   // → { dominant_pillars: ['erschaffen', 'verbinden'], orb_vitality: 0.72, ... }
//
// ARCHITEKTUR:
//   CoreEngine.signals    — Rohe Wirkungssignale
//   CoreEngine.profiles   — Aggregierte Wirkungsprofile
//   CoreEngine.connections — Wirkungsverbindungen zwischen Menschen
//   CoreEngine.content    — Grundpfeiler-Zuordnung für Inhalte
//   CoreEngine.classify   — Helfer zur automatischen Klassifizierung
//
// ═══════════════════════════════════════════════════════════════════════
//
// CONSTITUTION
//   Diese Engine ist Ausdruck der HUI Constitution.
//   Grundpfeiler, Sprache und Semantik kommen aus der HUI Registry.
//
//   Verfassung:   HUI_CONSTITUTION.md
//   Registry:     src/registry/HuiRegistry.js
//   Index:        docs/ARCHITECTURE_INDEX.md
//
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient.js';

// ─────────────────────────────────────────────────────────────────────
// KONSTANTEN — einzige Wahrheitsquelle für alle Werte
// ─────────────────────────────────────────────────────────────────────

/**
 * Die fünf HUI-Grundpfeiler.
 * Entsprechen direkt dem DB-Enum hui_pillar.
 * Interne Bezeichner — NIEMALS direkt als UI-Label verwenden.
 */
export const PILLARS = Object.freeze({
  VERBINDEN:      'verbinden',
  UNTERSTUETZEN:  'unterstuetzen',
  ERSCHAFFEN:     'erschaffen',
  WERTSCHOEPFEN:  'wertschoepfen',
  IMPACT:         'impact',
});

/**
 * Signal-Kategorien — rohe Klassifizierung.
 * Ein Signal gehört immer zu genau einer Kategorie.
 */
export const SIGNAL_CATEGORIES = Object.freeze({
  CONNECTION:    'connection',
  SUPPORT:       'support',
  CREATION:      'creation',
  TRANSACTION:   'transaction',
  IMPACT_ACTION: 'impact_action',
  COLLABORATION: 'collaboration',
  COMMUNITY:     'community',
});

/**
 * Signal-Typen — granulare Ereignisse.
 * Werden vom classify()-Modul auf Grundpfeiler gemappt.
 *
 * Naming-Konvention: ENTITÄT_AKTION
 */
export const SIGNAL_TYPES = Object.freeze({
  // Verbinden
  CONNECTION_CREATED:        'connection_created',
  CONNECTION_ACCEPTED:       'connection_accepted',
  INVITATION_SENT:           'invitation_sent',
  INTRODUCTION_MADE:         'introduction_made',

  // Unterstützen
  SUPPORT_GIVEN:             'support_given',         // Direktzahlung an jemanden
  MENTORING_OFFERED:         'mentoring_offered',
  COLLABORATION_JOINED:      'collaboration_joined',
  HELP_OFFERED:              'help_offered',

  // Erschaffen
  WORK_PUBLISHED:            'work_published',
  EXPERIENCE_PUBLISHED:      'experience_published',
  STORY_SHARED:              'story_shared',
  PROJECT_CREATED:           'project_created',
  POST_CREATED:              'post_created',

  // Wertschöpfen
  WORK_SOLD:                 'work_sold',
  EXPERIENCE_BOOKED:         'experience_booked',
  BOOKING_COMPLETED:         'booking_completed',
  SERVICE_DELIVERED:         'service_delivered',

  // Impact
  IMPACT_PROJECT_SUPPORTED:  'impact_project_supported',
  IMPACT_PROJECT_CREATED:    'impact_project_created',
  IMPACT_VOTE_GIVEN:         'impact_vote_given',
  IMPACT_CONTRIBUTION:       'impact_contribution',

  // Community / Cross-Pillar
  RESONANCE_GIVEN:           'resonance_given',
  RECOMMENDATION_GIVEN:      'recommendation_given',
  PROFILE_VISITED:           'profile_visited',        // schwaches Signal (weight 0.3)
  AMBASSADOR_REFERRED:       'ambassador_referred',
});

/**
 * Signal-Gewichte — qualitative Tiefe.
 * 1.0 = Standard-Aktion
 * 2.0+ = tiefe, bedeutsame Wirkung
 * 0.3–0.5 = leichtes, passives Signal
 */
export const SIGNAL_WEIGHTS = Object.freeze({
  // Starke Signale (echte, dauerhafte Wirkung)
  [SIGNAL_TYPES.BOOKING_COMPLETED]:         2.5,
  [SIGNAL_TYPES.SERVICE_DELIVERED]:         2.5,
  [SIGNAL_TYPES.PROJECT_CREATED]:           2.0,
  [SIGNAL_TYPES.IMPACT_PROJECT_CREATED]:    2.0,
  [SIGNAL_TYPES.RECOMMENDATION_GIVEN]:      2.0,
  [SIGNAL_TYPES.INTRODUCTION_MADE]:         2.0,
  [SIGNAL_TYPES.AMBASSADOR_REFERRED]:       2.0,
  [SIGNAL_TYPES.WORK_SOLD]:                 1.8,
  [SIGNAL_TYPES.EXPERIENCE_BOOKED]:         1.8,
  [SIGNAL_TYPES.MENTORING_OFFERED]:         1.8,
  [SIGNAL_TYPES.COLLABORATION_JOINED]:      1.8,
  [SIGNAL_TYPES.IMPACT_PROJECT_SUPPORTED]:  1.5,
  [SIGNAL_TYPES.SUPPORT_GIVEN]:             1.5,
  [SIGNAL_TYPES.CONNECTION_CREATED]:        1.2,
  [SIGNAL_TYPES.WORK_PUBLISHED]:            1.2,
  [SIGNAL_TYPES.EXPERIENCE_PUBLISHED]:      1.2,

  // Standard-Signale
  [SIGNAL_TYPES.IMPACT_VOTE_GIVEN]:         1.0,
  [SIGNAL_TYPES.IMPACT_CONTRIBUTION]:       1.0,
  [SIGNAL_TYPES.CONNECTION_ACCEPTED]:       1.0,
  [SIGNAL_TYPES.INVITATION_SENT]:           1.0,
  [SIGNAL_TYPES.HELP_OFFERED]:              1.0,
  [SIGNAL_TYPES.POST_CREATED]:              0.8,
  [SIGNAL_TYPES.STORY_SHARED]:              0.8,
  [SIGNAL_TYPES.RESONANCE_GIVEN]:           0.7,

  // Schwache Signale (passiv)
  [SIGNAL_TYPES.PROFILE_VISITED]:           0.3,
});

/**
 * Automatisches Mapping: Signal-Typ → Grundpfeiler + Kategorie.
 * Zentrale Klassifizierungs-Tabelle — einmal pflegen, überall gültig.
 */
const SIGNAL_MAP = Object.freeze({
  // Verbinden
  [SIGNAL_TYPES.CONNECTION_CREATED]:       { pillar: PILLARS.VERBINDEN,     category: SIGNAL_CATEGORIES.CONNECTION    },
  [SIGNAL_TYPES.CONNECTION_ACCEPTED]:      { pillar: PILLARS.VERBINDEN,     category: SIGNAL_CATEGORIES.CONNECTION    },
  [SIGNAL_TYPES.INVITATION_SENT]:          { pillar: PILLARS.VERBINDEN,     category: SIGNAL_CATEGORIES.CONNECTION    },
  [SIGNAL_TYPES.INTRODUCTION_MADE]:        { pillar: PILLARS.VERBINDEN,     category: SIGNAL_CATEGORIES.CONNECTION    },

  // Unterstützen
  [SIGNAL_TYPES.SUPPORT_GIVEN]:            { pillar: PILLARS.UNTERSTUETZEN, category: SIGNAL_CATEGORIES.SUPPORT       },
  [SIGNAL_TYPES.MENTORING_OFFERED]:        { pillar: PILLARS.UNTERSTUETZEN, category: SIGNAL_CATEGORIES.COLLABORATION },
  [SIGNAL_TYPES.COLLABORATION_JOINED]:     { pillar: PILLARS.UNTERSTUETZEN, category: SIGNAL_CATEGORIES.COLLABORATION },
  [SIGNAL_TYPES.HELP_OFFERED]:             { pillar: PILLARS.UNTERSTUETZEN, category: SIGNAL_CATEGORIES.SUPPORT       },

  // Erschaffen
  [SIGNAL_TYPES.WORK_PUBLISHED]:           { pillar: PILLARS.ERSCHAFFEN,    category: SIGNAL_CATEGORIES.CREATION      },
  [SIGNAL_TYPES.EXPERIENCE_PUBLISHED]:     { pillar: PILLARS.ERSCHAFFEN,    category: SIGNAL_CATEGORIES.CREATION      },
  [SIGNAL_TYPES.STORY_SHARED]:             { pillar: PILLARS.ERSCHAFFEN,    category: SIGNAL_CATEGORIES.CREATION      },
  [SIGNAL_TYPES.PROJECT_CREATED]:          { pillar: PILLARS.ERSCHAFFEN,    category: SIGNAL_CATEGORIES.CREATION      },
  [SIGNAL_TYPES.POST_CREATED]:             { pillar: PILLARS.ERSCHAFFEN,    category: SIGNAL_CATEGORIES.CREATION      },

  // Wertschöpfen
  [SIGNAL_TYPES.WORK_SOLD]:                { pillar: PILLARS.WERTSCHOEPFEN, category: SIGNAL_CATEGORIES.TRANSACTION   },
  [SIGNAL_TYPES.EXPERIENCE_BOOKED]:        { pillar: PILLARS.WERTSCHOEPFEN, category: SIGNAL_CATEGORIES.TRANSACTION   },
  [SIGNAL_TYPES.BOOKING_COMPLETED]:        { pillar: PILLARS.WERTSCHOEPFEN, category: SIGNAL_CATEGORIES.COLLABORATION },
  [SIGNAL_TYPES.SERVICE_DELIVERED]:        { pillar: PILLARS.WERTSCHOEPFEN, category: SIGNAL_CATEGORIES.COLLABORATION },

  // Impact
  [SIGNAL_TYPES.IMPACT_PROJECT_SUPPORTED]: { pillar: PILLARS.IMPACT,        category: SIGNAL_CATEGORIES.IMPACT_ACTION },
  [SIGNAL_TYPES.IMPACT_PROJECT_CREATED]:   { pillar: PILLARS.IMPACT,        category: SIGNAL_CATEGORIES.IMPACT_ACTION },
  [SIGNAL_TYPES.IMPACT_VOTE_GIVEN]:        { pillar: PILLARS.IMPACT,        category: SIGNAL_CATEGORIES.IMPACT_ACTION },
  [SIGNAL_TYPES.IMPACT_CONTRIBUTION]:      { pillar: PILLARS.IMPACT,        category: SIGNAL_CATEGORIES.IMPACT_ACTION },

  // Community
  [SIGNAL_TYPES.RESONANCE_GIVEN]:          { pillar: PILLARS.UNTERSTUETZEN, category: SIGNAL_CATEGORIES.COMMUNITY     },
  [SIGNAL_TYPES.RECOMMENDATION_GIVEN]:     { pillar: PILLARS.VERBINDEN,     category: SIGNAL_CATEGORIES.COMMUNITY     },
  [SIGNAL_TYPES.PROFILE_VISITED]:          { pillar: PILLARS.VERBINDEN,     category: SIGNAL_CATEGORIES.CONNECTION    },
  [SIGNAL_TYPES.AMBASSADOR_REFERRED]:      { pillar: PILLARS.VERBINDEN,     category: SIGNAL_CATEGORIES.CONNECTION    },
});

// ─────────────────────────────────────────────────────────────────────
// CLASSIFY MODULE
// Automatische Klassifizierung von Signal-Typen.
// Separates Modul — kann unabhängig getestet werden.
// ─────────────────────────────────────────────────────────────────────
export const classify = Object.freeze({
  /**
   * Bestimmt Grundpfeiler + Kategorie aus dem Signal-Typ.
   * @param {string} signalType — einer der SIGNAL_TYPES-Werte
   * @returns {{ pillar: string, category: string } | null}
   */
  fromSignalType(signalType) {
    return SIGNAL_MAP[signalType] ?? null;
  },

  /**
   * Bestimmt das Standardgewicht für einen Signal-Typ.
   * @param {string} signalType
   * @returns {number} weight (0.3–2.5)
   */
  weightFor(signalType) {
    return SIGNAL_WEIGHTS[signalType] ?? 1.0;
  },

  /**
   * Bestimmt die Grundpfeiler für einen Inhaltstyp.
   * Wird beim Publish neuer Inhalte aufgerufen.
   * @param {'work'|'experience'|'post'|'impact_project'} entityType
   * @param {object} metadata — optionale Zusatz-Infos (tags, price, category...)
   * @returns {string[]} — Array von hui_pillar-Werten
   */
  pillarsForContent(entityType, metadata = {}) {
    const base = {
      work:           [PILLARS.ERSCHAFFEN, PILLARS.WERTSCHOEPFEN],
      experience:     [PILLARS.ERSCHAFFEN, PILLARS.WERTSCHOEPFEN, PILLARS.VERBINDEN],
      post:           [PILLARS.ERSCHAFFEN],
      story:          [PILLARS.ERSCHAFFEN],
      impact_project: [PILLARS.IMPACT, PILLARS.VERBINDEN],
      project:        [PILLARS.ERSCHAFFEN, PILLARS.VERBINDEN],
    };

    let pillars = base[entityType] ?? [PILLARS.ERSCHAFFEN];

    // Erweitere basierend auf Metadaten
    if (metadata.is_free || metadata.price === 0) {
      // Kostenlose Inhalte → stärkeres Unterstützen-Signal
      if (!pillars.includes(PILLARS.UNTERSTUETZEN)) {
        pillars = [...pillars, PILLARS.UNTERSTUETZEN];
      }
    }

    if (metadata.is_collaborative) {
      if (!pillars.includes(PILLARS.VERBINDEN)) {
        pillars = [...pillars, PILLARS.VERBINDEN];
      }
    }

    return pillars;
  },

  /**
   * Berechnet die Tiefe eines Inhalts (0.0–1.0).
   * Interner Wert — nie als Zahl anzeigen.
   */
  depthScore(entityType, metadata = {}) {
    const base = { work: 0.7, experience: 0.8, impact_project: 0.9, post: 0.4, story: 0.3 };
    let score = base[entityType] ?? 0.5;

    if (metadata.price > 0)          score = Math.min(score + 0.1, 1.0);
    if (metadata.is_collaborative)   score = Math.min(score + 0.15, 1.0);
    if (metadata.has_media)          score = Math.min(score + 0.05, 1.0);

    return score;
  },
});

// ─────────────────────────────────────────────────────────────────────
// SIGNALS MODULE
// Schreibt und liest Wirkungssignale.
// ─────────────────────────────────────────────────────────────────────
const signals = {
  /**
   * Zeichnet ein Wirkungssignal auf.
   * Haupteinstieg der Core Engine.
   *
   * @param {object} params
   * @param {string}  params.userId       — Nutzer-UUID
   * @param {string}  params.signalType   — SIGNAL_TYPES.*
   * @param {string}  [params.pillar]     — Überschreiben des auto-Grundpfeilers
   * @param {string}  [params.category]   — Überschreiben der auto-Kategorie
   * @param {number}  [params.weight]     — Überschreiben des auto-Gewichts
   * @param {boolean} [params.isGiving]   — true = ich gebe (default), false = ich empfange
   * @param {string}  [params.targetUserId] — Ziel-Nutzer (für Verbindungssignale)
   * @param {string}  [params.entityId]   — UUID des referenzierten Objekts
   * @param {string}  [params.entityType] — Typ des referenzierten Objekts
   * @param {Date}    [params.occurredAt] — Zeitpunkt (default: jetzt)
   * @returns {Promise<{id: string} | null>}
   */
  async record({
    userId,
    signalType,
    pillar,
    category,
    weight,
    isGiving    = true,
    targetUserId = null,
    entityId    = null,
    entityType  = null,
    occurredAt  = new Date(),
  }) {
    if (!userId || !signalType) {
      console.warn('[CoreEngine] record(): userId und signalType sind Pflicht');
      return null;
    }

    // Auto-Klassifizierung
    const classified = classify.fromSignalType(signalType);
    const finalPillar   = pillar   ?? classified?.pillar;
    const finalCategory = category ?? classified?.category;
    const finalWeight   = weight   ?? classify.weightFor(signalType);

    if (!finalPillar || !finalCategory) {
      console.warn('[CoreEngine] record(): unbekannter signalType:', signalType);
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('core_record_signal', {
        p_user_id:     userId,
        p_pillar:      finalPillar,
        p_category:    finalCategory,
        p_signal_type: signalType,
        p_weight:      finalWeight,
        p_is_giving:   isGiving,
        p_target_user: targetUserId,
        p_entity_id:   entityId || null,
        p_entity_type: entityType,
        p_occurred_at: occurredAt.toISOString(),
      });

      if (error) {
        console.error('[CoreEngine] record() error:', error.message);
        return null;
      }

      return { id: data };
    } catch (err) {
      console.error('[CoreEngine] record() exception:', err?.message);
      return null;
    }
  },

  /**
   * Liest die letzten N Signale eines Nutzers.
   * Für interne Auswertungen — nie direkt im UI anzeigen.
   */
  async recent(userId, limit = 50) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('core_signals')
        .select('id, pillar, category, signal_type, weight, is_giving, occurred_at, entity_type')
        .eq('user_id', userId)
        .is('voided_at', null)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('[CoreEngine] signals.recent() error:', err?.message);
      return [];
    }
  },
};

// ─────────────────────────────────────────────────────────────────────
// PROFILES MODULE
// Liest und aktualisiert Wirkungsprofile.
// ─────────────────────────────────────────────────────────────────────
const profiles = {
  /**
   * Liest den Wirkungsstand eines Nutzers.
   * Enthält: dominant_pillars, orb_* Werte.
   * NICHT für die direkte UI-Anzeige als Zahlen gedacht.
   */
  async get(userId) {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('core_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[CoreEngine] profiles.get() error:', err?.message);
      return null;
    }
  },

  /**
   * Liest die dominanten Grundpfeiler eines Nutzers.
   * Wird im öffentlichen Profil angezeigt (als menschliche Sprache, KEINE Zahlen).
   * @returns {string[]} — Array von hui_pillar-Werten (max. 3)
   */
  async dominantPillars(userId) {
    const profile = await this.get(userId);
    return profile?.dominant_pillars ?? [];
  },

  /**
   * Löst eine Neuberechnung des Wirkungsprofils aus.
   * Aufgerufen z.B. periodisch, nicht bei jedem Signal.
   */
  async compute(userId) {
    if (!userId) return;
    try {
      const { error } = await supabase.rpc('core_compute_profile', {
        p_user_id: userId,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[CoreEngine] profiles.compute() error:', err?.message);
    }
  },

  /**
   * Batch-Lesen mehrerer Profile (für Feed / Empfehlungen).
   * Gibt nur Orb-relevante Felder zurück.
   */
  async getMany(userIds) {
    if (!userIds?.length) return [];
    try {
      const { data, error } = await supabase
        .from('core_profiles')
        .select('user_id, dominant_pillars, orb_vitality, orb_breadth, orb_warmth')
        .in('user_id', userIds);

      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('[CoreEngine] profiles.getMany() error:', err?.message);
      return [];
    }
  },
};

// ─────────────────────────────────────────────────────────────────────
// CONNECTIONS MODULE
// Wirkungsverbindungen zwischen Menschen.
// ─────────────────────────────────────────────────────────────────────
const connections = {
  /**
   * Liest die stärksten Wirkungsverbindungen eines Nutzers.
   * Wird vom Empfehlungssystem genutzt.
   */
  async strongest(userId, limit = 20) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('core_connections')
        .select('user_a, user_b, bond_strength, shared_pillars, complementarity')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('bond_strength', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(c => ({
        ...c,
        otherUserId: c.user_a === userId ? c.user_b : c.user_a,
      }));
    } catch (err) {
      console.error('[CoreEngine] connections.strongest() error:', err?.message);
      return [];
    }
  },

  /**
   * Sucht komplementäre Menschen — solche die andere Grundpfeiler leben.
   * Grundlage für das HUI-Empfehlungssystem.
   * "Diese Menschen ergänzen deine Wirkung."
   */
  async complementary(userId, userPillars, limit = 10) {
    // Welche Grundpfeiler fehlen diesem Nutzer?
    const allPillars = Object.values(PILLARS);
    const missingPillars = allPillars.filter(p => !userPillars.includes(p));

    if (!missingPillars.length) return [];

    try {
      const { data, error } = await supabase
        .from('core_profiles')
        .select('user_id, dominant_pillars, orb_vitality')
        .neq('user_id', userId)
        .order('orb_vitality', { ascending: false })
        .limit(limit * 3); // Mehr holen, dann filtern

      if (error) throw error;

      // Filtere nach Komplementarität
      return (data ?? [])
        .filter(p => p.dominant_pillars?.some(dp => missingPillars.includes(dp)))
        .slice(0, limit);
    } catch (err) {
      console.error('[CoreEngine] connections.complementary() error:', err?.message);
      return [];
    }
  },
};

// ─────────────────────────────────────────────────────────────────────
// CONTENT MODULE
// Verbindet Inhalte mit Grundpfeilern.
// Wird beim Publish und vom Feed-Engine verwendet.
// ─────────────────────────────────────────────────────────────────────
const content = {
  /**
   * Registriert einen neuen Inhalt mit seinen Grundpfeilern.
   * Wird beim Publish (work, experience, post, impact_project) aufgerufen.
   */
  async register({ entityId, entityType, creatorId, metadata = {} }) {
    if (!entityId || !entityType || !creatorId) return null;

    const pillars = classify.pillarsForContent(entityType, metadata);
    const depth   = classify.depthScore(entityType, metadata);

    try {
      const { data, error } = await supabase
        .from('core_content_signals')
        .upsert({
          entity_id:      entityId,
          entity_type:    entityType,
          creator_id:     creatorId,
          pillars:        pillars,
          primary_pillar: pillars[0] ?? null,
          depth_score:    depth,
        }, { onConflict: 'entity_id,entity_type' })
        .select('id')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[CoreEngine] content.register() error:', err?.message);
      return null;
    }
  },

  /**
   * Liest Inhalte nach Grundpfeiler (für Feed-Kuratierung).
   * "Diese Inhalte unterstützen Erschaffen."
   */
  async byPillar(pillar, limit = 12) {
    if (!pillar) return [];
    try {
      const { data, error } = await supabase
        .from('core_content_signals')
        .select('entity_id, entity_type, creator_id, pillars, depth_score')
        .contains('pillars', [pillar])
        .order('depth_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('[CoreEngine] content.byPillar() error:', err?.message);
      return [];
    }
  },

  /**
   * Liest den primären Grundpfeiler eines Inhalts.
   * Wird im Feed dezent angezeigt: "🍃 Unterstützt Erschaffen"
   */
  async getPillar(entityId, entityType) {
    if (!entityId) return null;
    try {
      const { data, error } = await supabase
        .from('core_content_signals')
        .select('primary_pillar, pillars')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .maybeSingle();

      if (error) throw error;
      return data?.primary_pillar ?? null;
    } catch (err) {
      return null;
    }
  },
};

// ─────────────────────────────────────────────────────────────────────
// CORE ENGINE — Public API
// ─────────────────────────────────────────────────────────────────────
export const CoreEngine = Object.freeze({
  signals,
  profiles,
  connections,
  content,
  classify,

  // Convenience-Konstanten direkt auf CoreEngine
  PILLARS,
  SIGNAL_TYPES,
  SIGNAL_CATEGORIES,
  SIGNAL_WEIGHTS,
});
