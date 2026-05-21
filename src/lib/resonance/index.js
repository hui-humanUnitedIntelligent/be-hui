// src/lib/resonance/index.js
// ═══════════════════════════════════════════════════════════════
// HUI RESONANZ-SYSTEM v1.0
//
// PHILOSOPHIE:
// Keine Like-Logik. Keine Engagement-Metriken.
// Resonanz entsteht durch echte menschliche Verbindung.
//
// TYPEN (gewichtet nach Tiefe der Begegnung):
//   inspired        → leicht    (1)  — etwas hat mich berührt
//   saved           → leicht    (1)  — ich kehre dazu zurück
//   connected       → mittel    (3)  — echte Verbindung entstanden
//   recommended     → mittel    (3)  — ich empfehle weiter
//   supported       → mittel    (3)  — ich unterstütze aktiv
//   participated    → hoch      (7)  — ich war dabei
//   deep_resonance  → sehr hoch (12) — langfristige Wirkung
//
// WICHTIG:
// Resonanz ist NICHT öffentlich als Zahl sichtbar.
// Sie beeinflusst Discovery und Trust intern.
// Kein Gamification. Kein Score-Display.
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../supabaseClient';
import { assertAuthenticated } from '../security/index.js';
import { sentryCapture } from '../sentry.js';

// ── Resonanz-Typen mit Gewichtung ────────────────────────────
export const RESONANCE_TYPES = {
  inspired:       { weight: 1,  label: 'Berührt',          desc: 'Etwas hat mich bewegt.'                    },
  saved:          { weight: 1,  label: 'Gespeichert',       desc: 'Ich kehre dazu zurück.'                    },
  connected:      { weight: 3,  label: 'Verbunden',         desc: 'Eine echte Verbindung ist entstanden.'     },
  recommended:    { weight: 3,  label: 'Empfohlen',         desc: 'Ich teile das weiter.'                     },
  supported:      { weight: 3,  label: 'Unterstützt',       desc: 'Ich unterstütze aktiv.'                    },
  participated:   { weight: 7,  label: 'Dabei gewesen',     desc: 'Ich war Teil dieser Erfahrung.'            },
  deep_resonance: { weight: 12, label: 'Tiefe Resonanz',   desc: 'Eine langfristige Verbindung entsteht.'    },
};

// ── Target-Typen (worauf sich Resonanz bezieht) ───────────────
export const RESONANCE_TARGETS = {
  work:        'work',
  experience:  'experience',
  profile:     'profile',
  community:   'community',
  impact:      'impact_project',
  story:       'story',
  connection:  'connection',
};

// ── createResonance ───────────────────────────────────────────
// Erstellt einen Resonanz-Eintrag (kein doppelter Eintrag).
// Gibt { data, error, alreadyExists } zurück.
export async function createResonance({
  user,
  targetType,   // RESONANCE_TARGETS.*
  targetId,     // UUID
  resonanceType // RESONANCE_TYPES key
}) {
  try {
    assertAuthenticated(user);

    if (!RESONANCE_TYPES[resonanceType]) {
      return { error: `Unbekannter Resonanz-Typ: ${resonanceType}` };
    }
    if (!RESONANCE_TARGETS[targetType]) {
      return { error: `Unbekannter Target-Typ: ${targetType}` };
    }

    const weight = RESONANCE_TYPES[resonanceType].weight;

    // Idempotent: kein Doppel-Eintrag für gleichen User+Target+Typ
    const { data: existing } = await supabase
      .from('resonances')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('resonance_type', resonanceType)
      .maybeSingle();

    if (existing) return { data: existing, alreadyExists: true };

    const { data, error } = await supabase
      .from('resonances')
      .insert({
        user_id:        user.id,
        target_type:    targetType,
        target_id:      targetId,
        resonance_type: resonanceType,
        weight,
      })
      .select('id, resonance_type, weight, created_at')
      .single();

    if (error) throw error;

    // Async: Event erzeugen (fire-and-forget — kein await)
    emitResonanceEvent(user.id, targetType, targetId, resonanceType, weight);

    return { data };
  } catch (err) {
    sentryCapture(err, { context: 'createResonance', resonanceType, targetType });
    return { error: err.message };
  }
}

// ── removeResonance ───────────────────────────────────────────
export async function removeResonance({ user, targetType, targetId, resonanceType }) {
  try {
    assertAuthenticated(user);
    const { error } = await supabase
      .from('resonances')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('resonance_type', resonanceType);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    sentryCapture(err, { context: 'removeResonance' });
    return { error: err.message };
  }
}

// ── getResonanceScore ─────────────────────────────────────────
// Berechnet internen Resonanz-Score für ein Target.
// NICHT für öffentliche Anzeige — nur für Discovery/Trust intern.
export async function getResonanceScore(targetType, targetId) {
  try {
    const { data, error } = await supabase
      .from('resonances')
      .select('weight, resonance_type')
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) throw error;

    const score = (data || []).reduce((sum, r) => sum + (r.weight || 1), 0);
    const breakdown = {};
    (data || []).forEach(r => {
      breakdown[r.resonance_type] = (breakdown[r.resonance_type] || 0) + 1;
    });

    return { score, breakdown, count: data?.length || 0 };
  } catch (err) {
    sentryCapture(err, { context: 'getResonanceScore' });
    return { score: 0, breakdown: {}, count: 0 };
  }
}

// ── getUserResonances ─────────────────────────────────────────
// Alle Resonanzen eines Users (für "Gespeichert", "Inspiriert" etc.)
export async function getUserResonances(userId, targetType = null) {
  try {
    let q = supabase
      .from('resonances')
      .select('id, target_type, target_id, resonance_type, weight, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (targetType) q = q.eq('target_type', targetType);

    const { data, error } = await q;
    if (error) throw error;
    return { data: data || [] };
  } catch (err) {
    sentryCapture(err, { context: 'getUserResonances' });
    return { data: [] };
  }
}

// ── hasResonance ──────────────────────────────────────────────
// Prüft ob User bereits resoniert hat (für UI-State).
export async function hasResonance({ userId, targetType, targetId, resonanceType }) {
  const { data } = await supabase
    .from('resonances')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('resonance_type', resonanceType)
    .maybeSingle();
  return !!data;
}

// ── emitResonanceEvent (intern, fire-and-forget) ──────────────
async function emitResonanceEvent(userId, targetType, targetId, resonanceType, weight) {
  try {
    await supabase.from('platform_events').insert({
      event_type:  'resonance_created',
      actor_id:    userId,
      target_type: targetType,
      target_id:   targetId,
      metadata:    { resonance_type: resonanceType, weight },
    });
  } catch {
    // Silently fail — Event ist nicht kritisch
  }
}

// ── useResonance (React Hook) ─────────────────────────────────
// Leichtgewichtiger Hook für Komponenten.
import { useState, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';

export function useResonance(targetType, targetId) {
  const { user } = useAuth();
  const [resonances, setResonances] = useState(new Set());
  const [loading, setLoading]       = useState(false);

  const toggle = useCallback(async (resonanceType) => {
    if (!user?.id) return;
    const key = resonanceType;
    const isActive = resonances.has(key);

    // Optimistic update
    setResonances(prev => {
      const next = new Set(prev);
      if (isActive) next.delete(key); else next.add(key);
      return next;
    });

    const fn = isActive ? removeResonance : createResonance;
    const { error } = await fn({ user, targetType, targetId, resonanceType });

    if (error) {
      // Rollback bei Fehler
      setResonances(prev => {
        const next = new Set(prev);
        if (isActive) next.add(key); else next.delete(key);
        return next;
      });
    }
  }, [user, targetType, targetId, resonances]);

  const has = useCallback((type) => resonances.has(type), [resonances]);

  return { toggle, has, resonances, loading };
}
