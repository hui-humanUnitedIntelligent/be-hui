// src/lib/events/index.js
// ═══════════════════════════════════════════════════════════════
// HUI PLATFORM EVENT LAYER v1.0
//
// Alle wichtigen Aktionen erzeugen Events.
// Diese Events sind das Nervensystem der Plattform.
//
// Events beeinflussen:
//   → Discovery (welche Inhalte werden vorgeschlagen)
//   → Trust (wie vertrauenswürdig ist ein Akteur)
//   → Resonanz (welche Objekte haben echte Wirkung)
//   → Community Health (gesunde Muster erkennen)
//
// Prinzip: Fire-and-forget aus UI-Perspektive.
// Niemals User-Flow blockieren für ein Event.
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../supabaseClient';
import { sentryCapture } from '../sentry.js';

// ── Event-Typen ───────────────────────────────────────────────
export const PLATFORM_EVENTS = {
  // Resonanz
  RESONANCE_CREATED:      'resonance_created',
  RESONANCE_REMOVED:      'resonance_removed',

  // Verbindung
  CONNECTION_OPENED:      'connection_opened',
  CONNECTION_ACCEPTED:    'connection_accepted',
  CONNECTION_DEEPENED:    'connection_deepened',  // Nach 3+ Interaktionen

  // Erlebnis
  EXPERIENCE_CREATED:     'experience_created',
  EXPERIENCE_JOINED:      'experience_joined',
  EXPERIENCE_COMPLETED:   'experience_completed',

  // Werk
  WORK_PUBLISHED:         'work_published',
  WORK_RESONATED:         'work_resonated',

  // Story
  STORY_PUBLISHED:        'story_published',
  STORY_VIEWED:           'story_viewed',

  // Community
  COMMUNITY_JOINED:       'community_joined',
  COMMUNITY_CONTRIBUTED:  'community_contributed',

  // Empfehlung
  RECOMMENDATION_GIVEN:   'recommendation_given',

  // Impact
  IMPACT_SUPPORTED:       'impact_supported',
  IMPACT_CREATED:         'impact_created',

  // Booking/Begegnung
  BOOKING_REQUESTED:      'booking_requested',
  BOOKING_COMPLETED:      'booking_completed',
  BOOKING_CANCELLED:      'booking_cancelled',

  // Profil
  PROFILE_COMPLETED:      'profile_completed',
  TALENT_ACTIVATED:       'talent_activated',
  MEMBER_JOINED:          'member_joined',

  // Health (intern)
  SPAM_DETECTED:          'spam_detected',
  CONTENT_FLAGGED:        'content_flagged',
};

// ── emit ──────────────────────────────────────────────────────
// Zentraler Event-Emitter. Fire-and-forget.
// Usage:
//   emit(PLATFORM_EVENTS.EXPERIENCE_JOINED, {
//     actorId: user.id,
//     targetId: experience.id,
//     targetType: 'experience',
//   })
export async function emit(eventType, {
  actorId,
  targetId    = null,
  targetType  = null,
  recipientId = null,   // z.B. Creator bei Booking
  metadata    = {},
} = {}) {
  try {
    if (!actorId) return;  // Kein anonymes Event

    await supabase.from('platform_events').insert({
      event_type:   eventType,
      actor_id:     actorId,
      target_id:    targetId,
      target_type:  targetType,
      recipient_id: recipientId,
      metadata:     metadata || {},
    });
  } catch (err) {
    // Silently fail — Events blockieren nie den User-Flow
    if (process.env.NODE_ENV === 'development') {
      console.warn('[EventLayer] emit failed:', eventType, err.message);
    }
    sentryCapture(err, { context: 'platform_events.emit', eventType });
  }
}

// ── emitAfterBooking ──────────────────────────────────────────
// Convenience für Booking-Abschluss (mehrere Events gleichzeitig).
export async function emitAfterBooking(booking, userId) {
  try {
    await Promise.all([
      emit(PLATFORM_EVENTS.BOOKING_COMPLETED, {
        actorId:     userId,
        targetId:    booking.id,
        targetType:  'booking',
        recipientId: booking.creator_id || booking.wirker_id,
        metadata:    { amount: booking.amount },
      }),
    ]);
  } catch { /* silent */ }
}

// ── emitAfterConnection ───────────────────────────────────────
export async function emitAfterConnection(connection, userId) {
  try {
    await emit(PLATFORM_EVENTS.CONNECTION_OPENED, {
      actorId:     userId,
      targetId:    connection.id,
      targetType:  'connection',
      recipientId: connection.target_user_id,
    });
  } catch { /* silent */ }
}

// ── getRecentEvents ───────────────────────────────────────────
// Für interne Analyse / Admin Dashboard.
// NIEMALS im öffentlichen Feed anzeigen.
export async function getRecentEvents({
  actorId   = null,
  eventType = null,
  limit     = 50,
} = {}) {
  try {
    let q = supabase
      .from('platform_events')
      .select('id, event_type, actor_id, target_type, target_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (actorId)   q = q.eq('actor_id', actorId);
    if (eventType) q = q.eq('event_type', eventType);

    const { data, error } = await q;
    if (error) throw error;
    return { data: data || [] };
  } catch (err) {
    sentryCapture(err, { context: 'getRecentEvents' });
    return { data: [] };
  }
}
