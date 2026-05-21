// src/lib/community/rhythm.js
// ═══════════════════════════════════════════════════════════════
// HUI RHYTHMUS-SYSTEM v1.0 — Phase C
//
// PHILOSOPHIE:
// HUI soll atmen dürfen — Menschen auch.
// Die Plattform erzwingt keine Aktivität.
// Keine FOMO. Keine Streaks. Keine künstlichen Trigger.
//
// NOTIFICATION-PHILOSOPHIE:
//   Nur senden wenn: echte Begegnung, echte Antwort, echte Einladung.
//   Niemals senden: "X Leute haben gerade...", "Du fehlst uns", Streak-Erinnerungen.
//
// RHYTHMUS-RESPEKT:
//   - Stille ist erlaubt und gut
//   - Abwesenheit ist kein Problem
//   - Menschen entscheiden selbst wann sie kommen
//   - Keine Algorithmen die zurücklocken
// ═══════════════════════════════════════════════════════════════

import { supabase }      from '../supabaseClient';
import { sentryCapture } from '../sentry.js';

// ── Notification-Typen (was wir senden DÜRFEN) ───────────────
export const ALLOWED_NOTIFICATION_TYPES = {
  // Echte Begegnungen
  direct_message:       { label: 'Direkte Nachricht',        urgent: true  },
  booking_confirmed:    { label: 'Begegnung bestätigt ✦',    urgent: true  },
  booking_reminder:     { label: 'Deine Begegnung morgen',   urgent: false },  // max 1x, 24h vorher
  recommendation_given: { label: 'Jemand empfiehlt dich ✦', urgent: false },

  // Echte Einladungen
  experience_invite:    { label: 'Einladung zu Erlebnis',    urgent: false },
  connection_request:   { label: 'Verbindungsanfrage',       urgent: false },
  guardian_welcome:     { label: 'Guardian begrüßt dich',    urgent: false },

  // Impact (selten, bedeutungsvoll)
  impact_distribution:  { label: 'Wirkung verteilt ✦',      urgent: false },  // max 1x/Monat
  impact_supported:     { label: 'Deine Vision wird sichtbar', urgent: false },
};

// ── VERBOTENE Notification-Typen ─────────────────────────────
// Diese darf HUI NIEMALS senden.
export const FORBIDDEN_NOTIFICATION_TYPES = [
  'you_are_missed',         // "Du fehlst uns" — FOMO, manipulativ
  'streak_reminder',        // Streak-Alarm — Gamification-Druck
  'trending_content',       // "X ist gerade beliebt" — Viral-Energie
  'social_proof_ping',      // "17 Leute schauen gerade..." — Druck
  'daily_login_prompt',     // Täglicher Login-Trigger
  'inactivity_warning',     // "Du warst 5 Tage nicht da" — Schuld-Energie
  'mass_community_ping',    // Community-Rundpings für Aktivität
];

// ── NotificationRhythm: Gibt zurück ob eine Notif erlaubt ist
export function isNotificationAllowed(type, { lastSentAt = null, urgent = false } = {}) {
  // Verbotene Typen immer ablehnen
  if (FORBIDDEN_NOTIFICATION_TYPES.includes(type)) return false;

  // Erlaubte Typen prüfen
  const allowed = ALLOWED_NOTIFICATION_TYPES[type];
  if (!allowed) return false;  // Unbekannter Typ → ablehnen (fail-safe)

  // Urgent (direkte Nachricht) → immer erlaubt
  if (allowed.urgent) return true;

  // Rate-Limit: min. 4 Stunden zwischen Nicht-Urgent-Notifications
  if (lastSentAt) {
    const hoursSince = (Date.now() - new Date(lastSentAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 4) return false;
  }

  return true;
}

// ── getNotificationSummary ────────────────────────────────────
// Bündelt nicht-urgente Notifications zu einem ruhigen Überblick.
// Verhindert Notification-Spam durch Zusammenfassen.
export function bundleNotifications(notifications) {
  const urgent   = notifications.filter(n => ALLOWED_NOTIFICATION_TYPES[n.type]?.urgent);
  const nonUrgent = notifications.filter(n => !ALLOWED_NOTIFICATION_TYPES[n.type]?.urgent);

  // Nicht-urgente: max 3 bündeln
  const bundled = [];
  if (nonUrgent.length > 0) {
    bundled.push({
      type:    'bundle',
      count:   nonUrgent.length,
      message: nonUrgent.length === 1
        ? nonUrgent[0].message
        : `${nonUrgent.length} Resonanzmomente warten auf dich ✦`,
      items:   nonUrgent.slice(0, 3),
    });
  }

  return [...urgent, ...bundled];
}

// ── getRhythmReport ───────────────────────────────────────────
// Interne Analyse: Wie oft senden wir einem User Notifications?
// Für Selbst-Audit — wir wollen nicht zu viel senden.
export async function getRhythmReport(userId, { days = 7 } = {}) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .select('type, created_at, read')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total     = data?.length || 0;
    const read      = data?.filter(n => n.read).length || 0;
    const perDay    = total / days;
    const readRate  = total > 0 ? read / total : 0;

    return {
      total,
      perDay:       Math.round(perDay * 10) / 10,
      readRate:     Math.round(readRate * 100),
      tooMany:      perDay > 3,   // Mehr als 3/Tag ist zu viel
      recommendation: perDay > 3
        ? 'Notification-Frequenz reduzieren — Users brauchen Ruhe.'
        : 'Guter Rhythmus ✦',
    };
  } catch (err) {
    sentryCapture(err, { context: 'getRhythmReport' });
    return { total: 0, perDay: 0, readRate: 0, tooMany: false };
  }
}

// ── silentHoursCheck ─────────────────────────────────────────
// Prüft ob es "stille Stunden" sind (20:00 - 08:00 Uhr lokal).
// Non-urgente Notifications werden nicht in dieser Zeit gesendet.
export function isInSilentHours(userTimezone = 'Europe/Berlin') {
  try {
    const now = new Date();
    const hour = parseInt(
      now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: userTimezone })
    );
    return hour >= 20 || hour < 8;
  } catch {
    return false;
  }
}
