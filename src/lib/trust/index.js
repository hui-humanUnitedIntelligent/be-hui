// src/lib/trust/index.js
// ═══════════════════════════════════════════════════════════════
// HUI TRUST-SYSTEM v1.0
//
// PHILOSOPHIE:
// Trust ist intern, schützend und nie öffentlich als Zahl sichtbar.
// Keine Sterne. Keine Ratings. Keine Reputation-Zahlen.
//
// Trust entsteht durch:
//   - respektvolle Begegnungen
//   - echte Weiterempfehlungen
//   - langfristige Resonanz
//   - zuverlässige Begleitungen
//   - gesundes Community-Verhalten
//
// Trust beeinflusst intern:
//   - Discovery-Priorisierung (subtil)
//   - Empfehlungen (welche Profile vorgeschlagen)
//   - Sichtbarkeit (organisch, nicht käuflich)
//   - Schutz (low-trust Accounts werden verlangsamt)
//
// Trust-Scores bleiben VERSTECKT — nur das System sieht sie.
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../supabaseClient';
import { sentryCapture } from '../sentry.js';

// ── Trust-Signal-Typen ────────────────────────────────────────
export const TRUST_SIGNALS = {
  // Positive Signale
  booking_completed:      { delta: +8,  label: 'Begegnung abgeschlossen'         },
  recommendation_given:   { delta: +12, label: 'Weiterempfehlung erhalten'        },
  experience_attended:    { delta: +6,  label: 'Erlebnis begleitet'              },
  long_term_connection:   { delta: +15, label: 'Langfristige Verbindung'          },
  community_contribution: { delta: +4,  label: 'Community-Beitrag'               },
  identity_verified:      { delta: +20, label: 'Identität bestätigt'             },
  impact_supported:       { delta: +5,  label: 'Wirkung unterstützt'             },
  profile_complete:       { delta: +3,  label: 'Profil vollständig'              },

  // Negative Signale (intern, keine Strafe sichtbar)
  booking_cancelled_late: { delta: -5,  label: 'Kurzfristige Absage'             },
  message_flagged:        { delta: -8,  label: 'Nachricht gemeldet'              },
  spam_detected:          { delta: -15, label: 'Spam-Muster erkannt'             },
  no_show:                { delta: -10, label: 'Nicht erschienen'                },
};

// ── Trust-Schwellen (intern) ──────────────────────────────────
export const TRUST_LEVELS = {
  new:        { min: 0,   max: 20,  key: 'new',        desc: 'Neues Mitglied'       },
  growing:    { min: 21,  max: 60,  key: 'growing',    desc: 'Wächst in Gemeinschaft'},
  trusted:    { min: 61,  max: 120, key: 'trusted',    desc: 'Vertrauenswürdig'      },
  deep:       { min: 121, max: 250, key: 'deep',       desc: 'Tiefe Präsenz'         },
  guardian:   { min: 251, max: 999, key: 'guardian',   desc: 'Gemeinschafts-Hüter'   },
};

// ── getTrustLevel ─────────────────────────────────────────────
export function getTrustLevel(score) {
  for (const [, level] of Object.entries(TRUST_LEVELS)) {
    if (score >= level.min && score <= level.max) return level;
  }
  return TRUST_LEVELS.new;
}

// ── recordTrustSignal ─────────────────────────────────────────
// Zeichnet ein Trust-Ereignis auf. Fire-and-forget aus UI-Sicht.
// Die tatsächliche Score-Berechnung läuft serverseitig (DB Function).
export async function recordTrustSignal({
  userId,
  signalType,
  contextId   = null,  // z.B. booking_id, connection_id
  contextType = null,  // z.B. 'booking', 'recommendation'
  note        = null,
}) {
  try {
    if (!TRUST_SIGNALS[signalType]) {
      console.warn('[TrustSystem] Unbekannter Signal-Typ:', signalType);
      return;
    }

    await supabase.from('trust_signals').insert({
      user_id:      userId,
      signal_type:  signalType,
      delta:        TRUST_SIGNALS[signalType].delta,
      context_id:   contextId,
      context_type: contextType,
      note,
    });
  } catch (err) {
    // Trust-Fehler sind nicht kritisch — niemals User-Flow blockieren
    sentryCapture(err, { context: 'recordTrustSignal', signalType });
  }
}

// ── getUserTrustSignals ───────────────────────────────────────
// Nur für interne Verwaltung (Moderatoren/Admins).
// NIEMALS direkt im öffentlichen Profil anzeigen.
export async function getUserTrustSignals(userId, { limit = 50 } = {}) {
  try {
    const { data, error } = await supabase
      .from('trust_signals')
      .select('id, signal_type, delta, context_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [] };
  } catch (err) {
    sentryCapture(err, { context: 'getUserTrustSignals' });
    return { data: [] };
  }
}

// ── getPublicTrustSignals ─────────────────────────────────────
// Gibt NUR menschliche, positive Signale zurück — für Profil-Anzeige.
// KEINE Scores, KEINE Zahlen — nur qualitative Labels.
export async function getPublicTrustSignals(userId) {
  try {
    const { data, error } = await supabase
      .from('trust_signals')
      .select('signal_type, created_at')
      .eq('user_id', userId)
      .in('signal_type', [
        'booking_completed',
        'recommendation_given',
        'experience_attended',
        'long_term_connection',
        'identity_verified',
      ])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Aggregiere zu qualitativen Signalen — max. 3 sichtbar
    const counts = {};
    (data || []).forEach(s => {
      counts[s.signal_type] = (counts[s.signal_type] || 0) + 1;
    });

    const signals = Object.entries(counts||{})
      .filter(([type, count]) => {
        // Mindest-Schwellen für Sichtbarkeit
        if (type === 'booking_completed'    && count < 1) return false;
        if (type === 'recommendation_given' && count < 1) return false;
        return true;
      })
      .map(([type]) => TRUST_SIGNALS[type]?.label)
      .filter(Boolean)
      .slice(0, 3);

    return { signals };
  } catch (err) {
    sentryCapture(err, { context: 'getPublicTrustSignals' });
    return { signals: [] };
  }
}

// ── isTrustedEnough ───────────────────────────────────────────
// Prüft ob User genug Trust für eine Aktion hat.
// Wird vom Orb Router / Feature-Gating verwendet.
export async function isTrustedEnough(userId, requiredLevel = 'growing') {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('trust_score')
      .eq('id', userId)
      .maybeSingle();

    const score = data?.trust_score || 0;
    const level = getTrustLevel(score);
    const required = TRUST_LEVELS[requiredLevel];

    return score >= (required?.min || 0);
  } catch {
    return false;
  }
}
