// src/lib/points/index.js
// ═══════════════════════════════════════════════════════════════
// HUI PUNKTE-SYSTEM v1.0 — VORBEREITUNG
//
// PHILOSOPHIE:
// Keine Krypto. Kein Trading. Keine Spekulation.
// Kein Gamification. Keine Leaderboards.
//
// HUI Punkte entstehen durch:
//   ✦ Echte Begegnungen
//   ✦ Tiefe Resonanz
//   ✦ Gemeinschaftliche Unterstützung
//   ✦ Langfristige Beteiligung
//   ✦ Positive Wirkung
//
// HUI Punkte entstehen NICHT durch:
//   ✗ Spam-Aktionen
//   ✗ Massen-Likes
//   ✗ Täglich-Login-Streaks
//   ✗ Kaufen
//   ✗ Teilen auf Social Media
//
// Punkte-Verwendung (geplant, noch nicht aktiv):
//   → Zusätzliche Impact-Stimmen
//   → Gemeinschaftliche Unterstützung
//   → Resonanzverbreitung
//   → Mögliche spätere Erweiterungen (flexibel)
//
// WICHTIG: Dieses System ist VORBEREITUNG.
// Keine Punkte werden aktuell vergeben oder angezeigt.
// Struktur ist flexibel für spätere Entscheidungen.
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../supabaseClient';
import { sentryCapture } from '../sentry.js';

// ── Punkte-Quellen ────────────────────────────────────────────
// Alle definierten Wege um Punkte zu verdienen.
// Werte können später angepasst werden — kein hardcoding in DB.
export const POINTS_SOURCES = {
  // Tiefe Begegnungen (hoher Wert)
  booking_completed:       { points: 50,  label: 'Begegnung abgeschlossen',     category: 'connection' },
  experience_attended:     { points: 40,  label: 'Erlebnis erlebt',             category: 'connection' },
  deep_recommendation:     { points: 35,  label: 'Tiefe Empfehlung gegeben',    category: 'trust'      },
  long_term_connection:    { points: 60,  label: 'Langfristige Verbindung',      category: 'connection' },

  // Gemeinschaft (mittlerer Wert)
  community_contribution:  { points: 15,  label: 'Gemeinschaft gestärkt',       category: 'community'  },
  impact_supported:        { points: 20,  label: 'Wirkung unterstützt',          category: 'impact'     },
  work_resonated:          { points: 10,  label: 'Werk hat resoniert',           category: 'creation'   },

  // Erste Schritte (niedriger Wert — einmalig)
  profile_completed:       { points: 25,  label: 'Profil vervollständigt',      category: 'onboarding' },
  first_work:              { points: 30,  label: 'Erstes Werk geteilt',          category: 'creation'   },
  first_experience:        { points: 30,  label: 'Erste Begegnung geöffnet',     category: 'creation'   },
  member_joined:           { points: 10,  label: 'Mitglied geworden',            category: 'onboarding' },
};

// ── Punkte-Kategorien ─────────────────────────────────────────
export const POINTS_CATEGORIES = {
  connection: { label: 'Verbindung',   color: '#16D7C5' },
  trust:      { label: 'Vertrauen',    color: '#A78BFA' },
  community:  { label: 'Gemeinschaft', color: '#10B981' },
  impact:     { label: 'Wirkung',      color: '#F5A623' },
  creation:   { label: 'Schöpfung',   color: '#FB923C' },
  onboarding: { label: 'Ankommen',     color: '#38BDF8' },
};

// ── awardPoints ───────────────────────────────────────────────
// Vergibt Punkte. Fire-and-forget — niemals User-Flow blockieren.
// VORBEREITUNG: schreibt in hui_points_ledger für spätere Nutzung.
export async function awardPoints({
  userId,
  source,       // POINTS_SOURCES key
  contextId   = null,
  contextType = null,
  oneTimeKey  = null,   // Verhindert doppelte Vergabe für same Key
}) {
  try {
    const sourceDef = POINTS_SOURCES[source];
    if (!sourceDef) {
      console.warn('[PointsSystem] Unbekannte Quelle:', source);
      return;
    }

    // Einmalige Vergabe prüfen
    if (oneTimeKey) {
      const { data: existing } = await supabase
        .from('hui_points_ledger')
        .select('id')
        .eq('user_id', userId)
        .eq('one_time_key', oneTimeKey)
        .maybeSingle();

      if (existing) return; // Bereits vergeben
    }

    await supabase.from('hui_points_ledger').insert({
      user_id:      userId,
      source,
      points:       sourceDef.points,
      category:     sourceDef.category,
      context_id:   contextId,
      context_type: contextType,
      one_time_key: oneTimeKey,
    });
  } catch (err) {
    // Punkte-Fehler sind NIEMALS kritisch — silent fail
    sentryCapture(err, { context: 'awardPoints', source });
  }
}

// ── getUserPoints ─────────────────────────────────────────────
// Gibt den aktuellen Punktestand zurück (für spätere Nutzung).
// Aktuell noch nicht öffentlich angezeigt.
export async function getUserPoints(userId) {
  try {
    const { data, error } = await supabase
      .from('hui_points_ledger')
      .select('points, category, source, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const total = (data || []).reduce((sum, r) => sum + (r.points || 0), 0);
    const byCategory = {};
    (data || []).forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + r.points;
    });

    return { total, byCategory, history: data || [] };
  } catch (err) {
    sentryCapture(err, { context: 'getUserPoints' });
    return { total: 0, byCategory: {}, history: [] };
  }
}

// ── getResonancePoints (zukünftig: Impact-Stimmen) ────────────
// Punkte die für Impact-Stimmen verwendet werden könnten.
// Aktuell noch nicht aktiv.
export async function getAvailableImpactPoints(userId) {
  const { total } = await getUserPoints(userId);
  // Formel: Jede 50 Punkte = 1 mögliche Impact-Stimme (Beispiel)
  // Wird später fein-kalibriert.
  return {
    available:   Math.floor(total / 50),
    totalPoints: total,
    note:        'Noch nicht aktiv — Vorbereitung',
  };
}
