// src/lib/community/guardian.js
// ═══════════════════════════════════════════════════════════════
// HUI GUARDIAN-SYSTEM v1.0 — Phase C
//
// PHILOSOPHIE:
// Guardians sind Gastgeber — keine Moderatoren im klassischen Sinn.
// Sie begrüßen, begleiten, beruhigen.
// KEINE Strafe. KEINE öffentliche Bloßstellung.
// KEINE Polizei-Energie.
//
// GUARDIAN-ENERGIE:
//   Warm        — Begrüßen, Einladen
//   Steady      — Raum halten, Sicherheit geben
//   Gentle      — Sanft beruhigen, Reflexion einladen
//   Careful     — Sichtbarkeit reduzieren (intern, unsichtbar)
//   Joyful      — Resonanzmomente feiern
//
// GUARDIAN-INTERFACE PRINZIPIEN:
//   - Keine "Ban"- oder "Block"-Buttons
//   - Keine öffentlichen Warnungen
//   - Kein Punktsystem für Verstöße
//   - Alles intern, schützend, menschlich
// ═══════════════════════════════════════════════════════════════

import { supabase }      from '../supabaseClient';
import { sentryCapture } from '../sentry.js';
import { emit, PLATFORM_EVENTS } from '../events/index.js';

// ── Guardian-Begrüßungsvorlagen ───────────────────────────────
// Werden vom Guardian personalisiert — nie vom System automatisch gesendet
export const GUARDIAN_GREETINGS = [
  'Willkommen. Schön, dass du da bist ✦',
  'Dieser Raum freut sich über deine Anwesenheit.',
  'Nimm dir Zeit. Hier ist Platz für dich.',
  'Ich bin der Guardian hier. Bei Fragen bin ich da.',
  'Herzlich willkommen in unserem Resonanzraum.',
];

// ── Beruhigungs-Interventionen (ruhig, nicht konfrontativ) ────
export const CALMING_APPROACHES = {
  visible_tension: {
    label:    'Spannung im Raum',
    guardian_hint: 'Vielleicht hilft ein ruhiges Wort — oder einfach Stille.',
    action:   'invite_reflection',
    energy:   'gentle',
  },
  spam_pattern: {
    label:    'Wiederholende Muster',
    guardian_hint: 'Manchmal hilft es, den Raum kurz zu verlangsamen.',
    action:   'reduce_visibility',
    energy:   'careful',
  },
  attention_seeking: {
    label:    'Aufmerksamkeitssuche',
    guardian_hint: 'Diese Person sucht vielleicht etwas Echtes. Vorsicht mit Reaktionen.',
    action:   'pause_voice',
    energy:   'careful',
  },
  new_member_lost: {
    label:    'Neues Mitglied orientierungslos',
    guardian_hint: 'Eine kurze Begrüßung kann viel bewirken.',
    action:   'welcome_member',
    energy:   'warm',
  },
  beautiful_moment: {
    label:    'Schöner Resonanzmoment',
    guardian_hint: 'Darf gerne sichtbarer gemacht werden ✦',
    action:   'celebrate_moment',
    energy:   'joyful',
  },
};

// ── getCommunityHealthHints ───────────────────────────────────
// Gibt dem Guardian subtile interne Hinweise — nie dem normalen User sichtbar.
// Keine Alarm-Energie. Nur ruhige Orientierung.
export async function getCommunityHealthHints(communityId) {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Letzte Aktivitäten
    const { data: events } = await supabase
      .from('platform_events')
      .select('actor_id, event_type, created_at, metadata')
      .eq('target_id', communityId)
      .eq('target_type', 'community')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!events?.length) {
      return [{
        situation: 'quiet_room',
        hint:       'Dieser Raum ist gerade still — das ist gut so.',
        energy:     'steady',
        action:     null,
      }];
    }

    const hints = [];

    // Dominanz-Analyse: Ein User > 60% der Aktionen?
    const actorCounts = {};
    events.forEach(e => { actorCounts[e.actor_id] = (actorCounts[e.actor_id] || 0) + 1; });
    const maxActor = Math.max(...Object.values(actorCounts));
    if (maxActor / events.length > 0.6 && events.length > 5) {
      hints.push({
        situation: 'dominant_voice',
        hint:      'Eine Stimme dominiert gerade. Andere einladen könnte den Raum öffnen.',
        energy:    'gentle',
        action:    'invite_reflection',
      });
    }

    // Neue Mitglieder ohne Begrüßung?
    const joinEvents = events.filter(e => e.event_type === 'community_joined');
    if (joinEvents.length > 0) {
      hints.push({
        situation: 'new_members',
        hint:      `${joinEvents.length} neue Mensch${joinEvents.length > 1 ? 'en' : ''} ist dem Raum beigetreten. Eine Begrüßung wäre schön ✦`,
        energy:    'warm',
        action:    'welcome_member',
      });
    }

    // Keine Flags vorhanden → positiver Hinweis
    const { data: flags } = await supabase
      .from('content_flags')
      .select('id')
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .limit(5);

    if (!flags?.length) {
      hints.push({
        situation: 'healthy_space',
        hint:      'Dieser Raum fühlt sich gerade gesund an ✦',
        energy:    'joyful',
        action:    null,
      });
    }

    return hints.length ? hints : [{
      situation: 'stable',
      hint:      'Alles ruhig. Gute Energie hier.',
      energy:    'steady',
      action:    null,
    }];
  } catch (err) {
    sentryCapture(err, { context: 'getCommunityHealthHints' });
    return [];
  }
}

// ── reduceVisibility ──────────────────────────────────────────
// Sichtbarkeit eines Beitrags sanft reduzieren.
// Unsichtbar für den Autor — kein harter Block.
export async function reduceVisibility({ guardianId, contentId, contentType, communityId }) {
  try {
    await supabase.from('visibility_reductions').insert({
      reduced_by:   guardianId,
      content_id:   contentId,
      content_type: contentType,
      community_id: communityId,
      reason:       'guardian_decision',
      is_permanent: false,  // immer reversibel
    });
    return { success: true };
  } catch (err) {
    sentryCapture(err, { context: 'reduceVisibility' });
    return { error: err.message };
  }
}

// ── inviteReflection ──────────────────────────────────────────
// Sanfte persönliche Nachricht vom Guardian.
// Keine öffentliche Warnung — private, menschliche Kommunikation.
export async function inviteReflection({ guardianId, memberId, communityId, note }) {
  try {
    // Interne Protokollierung
    await supabase.from('guardian_actions').insert({
      guardian_id:      guardianId,
      community_id:     communityId,
      target_member_id: memberId,
      action:           'invite_reflection',
      note,
      energy:           'gentle',
    });

    // Optional: Direkte Nachricht im ResonanzCenter öffnen
    // (wird vom Guardian manuell gesendet — kein Automat)
    return {
      success: true,
      suggestion: 'Öffne das ResonanzCenter und schreibe dieser Person direkt.',
    };
  } catch (err) {
    sentryCapture(err, { context: 'inviteReflection' });
    return { error: err.message };
  }
}
