// src/lib/community/spam.js
// ═══════════════════════════════════════════════════════════════
// HUI SPAM-SCHUTZ v1.0 — Phase C
//
// PHILOSOPHIE:
// Keine harte Bestrafung. Keine öffentliche Bloßstellung.
// Resonanzräume werden geschützt — subtil und menschlich.
//
// REAKTIONS-PRINZIPIEN:
//   1. Sichtbarkeit reduzieren (nicht löschen)
//   2. Verlangsamung (nicht Sperre)
//   3. Guardian benachrichtigen (nicht automatisch reagieren)
//   4. Reflexion einladen (nicht konfrontieren)
//   5. Eskalation nur intern (nie öffentlich)
//
// KEIN:
//   - Öffentliches "Gesperrt"-Banner
//   - Automatische Konten-Sperrungen
//   - Aggressive Pop-ups
//   - Beschämungs-Energie
// ═══════════════════════════════════════════════════════════════

import { supabase }      from '../supabaseClient';
import { sentryCapture } from '../sentry.js';
import { emit, PLATFORM_EVENTS } from '../events/index.js';
import { recordTrustSignal } from '../trust/index.js';

// ── Spam-Typen ────────────────────────────────────────────────
export const SPAM_PATTERNS = {
  rate_exceeded: {
    label:     'Hohe Aktivitätsrate',
    response:  'slow_down',    // Verlangsamung, keine Sperre
    severity:  'low',
  },
  repetitive_content: {
    label:     'Wiederholende Inhalte',
    response:  'reduce_reach', // Weniger Discovery-Sichtbarkeit
    severity:  'medium',
  },
  attention_seeking: {
    label:     'Aufmerksamkeits-Muster',
    response:  'guardian_hint', // Guardian bekommt Hinweis
    severity:  'low',
  },
  toxic_language: {
    label:     'Verletzende Sprache',
    response:  'hide_content', // Inhalt ausblenden, Guardian informieren
    severity:  'high',
  },
  identity_spam: {
    label:     'Identitäts-Spam',
    response:  'platform_review', // Plattform-Review (intern)
    severity:  'critical',
  },
};

// ── RESPONSE-METHODEN ─────────────────────────────────────────

// slowDown — verlangsamt Aktionen, kein offensichtliches Feedback
export async function slowDown(userId, { durationMs = 60_000 } = {}) {
  try {
    await supabase.from('rate_limits').upsert({
      user_id:    userId,
      limited_until: new Date(Date.now() + durationMs).toISOString(),
      reason:    'spam_protection',
    }, { onConflict: 'user_id' });
    // User merkt nichts — Aktionen werden leise gedämpft
    return { applied: true };
  } catch (err) {
    sentryCapture(err, { context: 'slowDown' });
    return { applied: false };
  }
}

// reduceReach — weniger Discovery-Sichtbarkeit für X Tage
export async function reduceReach(userId, { days = 3 } = {}) {
  try {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('profiles')
      .update({ reduced_reach_until: until })
      .eq('id', userId);
    return { applied: true, until };
  } catch (err) {
    sentryCapture(err, { context: 'reduceReach' });
    return { applied: false };
  }
}

// isRateLimited — prüft ob User verlangsamt ist
export async function isRateLimited(userId) {
  try {
    const { data } = await supabase
      .from('rate_limits')
      .select('limited_until')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data?.limited_until) return false;
    return new Date(data.limited_until) > new Date();
  } catch {
    return false; // Im Zweifel: nicht limitieren
  }
}

// ── detectAndRespond ──────────────────────────────────────────
// Hauptfunktion: Erkennt Muster und reagiert proportional.
// NIEMALS automatisch sperren — immer nur verlangsamen/dämpfen.
export async function detectAndRespond({ userId, recentEvents = [], communityId = null }) {
  try {
    const { detectSpamPattern } = await import('./health.js');
    const { isSpam, confidence, reason } = detectSpamPattern(recentEvents);

    if (!isSpam || confidence < 0.6) return { action: 'none' };

    const pattern = {
      rate_limit_exceeded: SPAM_PATTERNS.rate_exceeded,
      repetitive_actions:  SPAM_PATTERNS.repetitive_content,
    }[reason] || SPAM_PATTERNS.attention_seeking;

    let appliedAction = 'none';

    if (pattern.response === 'slow_down') {
      await slowDown(userId);
      appliedAction = 'slow_down';
    } else if (pattern.response === 'reduce_reach') {
      await reduceReach(userId, { days: 1 });
      appliedAction = 'reduce_reach';
    } else if (pattern.response === 'guardian_hint') {
      // Guardian wird informiert — keine automatische Aktion
      appliedAction = 'guardian_notified';
    }

    // Trust-Signal (intern, negativ)
    if (confidence > 0.8) {
      recordTrustSignal({
        userId,
        signalType:  'spam_detected',
        contextType: 'auto_detection',
        note:        reason,
      });
    }

    // Platform-Event für Monitoring
    emit(PLATFORM_EVENTS.SPAM_DETECTED, {
      actorId:    userId,
      targetId:   communityId,
      targetType: communityId ? 'community' : null,
      metadata:   { pattern: reason, confidence, action: appliedAction },
    });

    return { action: appliedAction, confidence, pattern: pattern.label };
  } catch (err) {
    sentryCapture(err, { context: 'detectAndRespond' });
    return { action: 'none' };
  }
}
