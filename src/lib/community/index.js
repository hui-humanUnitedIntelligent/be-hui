// src/lib/community/index.js
// ═══════════════════════════════════════════════════════════════
// HUI COMMUNITY-SYSTEM v1.0 — Phase C
//
// PHILOSOPHIE:
// Communities sind Resonanzräume — keine Gruppen, keine Foren.
// Menschen treten ein wie in einen Raum, nicht bei wie bei einem Verein.
//
// GUARDIAN-ENERGIE: Gastgeber, nicht Polizei.
// ONBOARDING:       Sanfter Eintritt, kein Cold-Join.
// RHYTHMUS:         Atmen dürfen — kein Aktivitätsdruck.
// QUALITÄT:         Kleine stille Räume werden nicht benachteiligt.
//
// ═══════════════════════════════════════════════════════════════

import { supabase }         from '../supabaseClient';
import { sentryCapture }    from '../sentry.js';
import { emit, PLATFORM_EVENTS } from '../events/index.js';
import { recordTrustSignal, TRUST_SIGNALS } from '../trust/index.js';

// ─────────────────────────────────────────────────────────────
// COMMUNITY-TYPEN
// ─────────────────────────────────────────────────────────────
export const COMMUNITY_TYPES = {
  resonance_space: { label: 'Resonanzraum',        emoji: '✦',  desc: 'Ein offener Raum für gemeinsame Schwingung.'       },
  creative_space:  { label: 'Kreativer Raum',       emoji: '🎨', desc: 'Menschen schaffen und entdecken gemeinsam.'        },
  local_space:     { label: 'Lokale Gemeinschaft',  emoji: '🌿', desc: 'Verbindung in deiner Nähe.'                        },
  impact_space:    { label: 'Wirkungsraum',          emoji: '🌱', desc: 'Gemeinsam echte Veränderung gestalten.'            },
  quiet_space:     { label: 'Stiller Raum',          emoji: '○',  desc: 'Für tiefe, ruhige Begegnungen.'                   },
};

// ─────────────────────────────────────────────────────────────
// COMMUNITY ONBOARDING
// Sanfter Eintritt — kein kalter "Beitreten"-Button
// ─────────────────────────────────────────────────────────────

// Willkommensnachrichten je Community-Typ (vom Guardian, nie vom System)
export const WELCOME_TONES = {
  resonance_space: [
    'Du bist angekommen. Nimm dir Zeit.',
    'Dieser Raum freut sich, dass du da bist ✦',
    'Kein Druck. Keine Erwartungen. Nur du.',
  ],
  creative_space: [
    'Teile, was dich gerade beschäftigt.',
    'Hier entsteht gemeinsam etwas Schönes.',
    'Deine kreative Energie ist willkommen ✦',
  ],
  local_space: [
    'Schön, dass du in der Nähe bist.',
    'Hier kennen sich Menschen — und es ist gut so.',
    'Gemeinschaft entsteht im Kleinen ✦',
  ],
  impact_space: [
    'Wirkung entsteht, wenn Menschen zusammenkommen.',
    'Dein Beitrag zählt — egal wie groß.',
    'Willkommen in diesem Wirkungsraum ✦',
  ],
  quiet_space: [
    'Hier ist Stille erlaubt.',
    'Kein Lärm. Kein Druck. Nur echte Begegnung.',
    'Du musst nichts. Du darfst sein ✦',
  ],
};

// Gibt eine ruhige Willkommensnachricht (zufällig, nie repetitiv)
export function getWelcomeMessage(communityType, guardianName = null) {
  const tones = WELCOME_TONES[communityType] || WELCOME_TONES.resonance_space;
  const msg   = tones[Math.floor(Math.random() * tones.length)];
  if (guardianName) return `${guardianName}: „${msg}"`;
  return msg;
}

// joinCommunity — sanfter Eintritt
export async function joinCommunity({ userId, communityId, communityType = 'resonance_space' }) {
  try {
    // Idempotent: kein Doppel-Join
    const { data: existing } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .maybeSingle();

    if (existing) return { alreadyMember: true, role: existing.role };

    const { data, error } = await supabase
      .from('community_members')
      .insert({
        user_id:        userId,
        community_id:   communityId,
        role:           'member',
        joined_at:      new Date().toISOString(),
      })
      .select('id, role')
      .single();

    if (error) throw error;

    // Event + Trust (fire-and-forget)
    emit(PLATFORM_EVENTS.COMMUNITY_JOINED, {
      actorId:    userId,
      targetId:   communityId,
      targetType: 'community',
    });

    return { data, welcomeMsg: getWelcomeMessage(communityType) };
  } catch (err) {
    sentryCapture(err, { context: 'joinCommunity' });
    return { error: err.message };
  }
}

// leaveCommunity — ruhig, kein Drama
export async function leaveCommunity({ userId, communityId }) {
  try {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', userId)
      .eq('community_id', communityId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    sentryCapture(err, { context: 'leaveCommunity' });
    return { error: err.message };
  }
}

// getCommunityMembers — mit Guardian-Markierung
export async function getCommunityMembers(communityId, { limit = 50 } = {}) {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('user_id, role, joined_at, profiles:user_id(id, display_name, avatar_url, talent, location)')
      .eq('community_id', communityId)
      .order('role', { ascending: false }) // guardians first
      .order('joined_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const guardians = (data || []).filter(m => m.role === 'guardian');
    const members   = (data || []).filter(m => m.role !== 'guardian');
    return { guardians, members, total: data?.length || 0 };
  } catch (err) {
    sentryCapture(err, { context: 'getCommunityMembers' });
    return { guardians: [], members: [], total: 0 };
  }
}

// ─────────────────────────────────────────────────────────────
// GUARDIAN-SYSTEM — Gastgeber-Energie, keine Polizei
// ─────────────────────────────────────────────────────────────

// Guardian-Aktionen (ruhig, nicht aggressiv)
export const GUARDIAN_ACTIONS = {
  welcome_member:   { label: 'Mitglied begrüßen',     energy: 'warm'     },
  reduce_visibility:{ label: 'Sichtbarkeit reduzieren', energy: 'quiet'    },
  pause_voice:      { label: 'Stimme vorübergehend beruhigen', energy: 'careful' },
  invite_reflection:{ label: 'Zur Reflexion einladen', energy: 'gentle'   },
  celebrate_moment: { label: 'Resonanzmoment teilen',  energy: 'joyful'   },
  protect_space:    { label: 'Raum schützen',           energy: 'steady'   },
};

// applyGuardianAction — ruhige Eingriffslogik
export async function applyGuardianAction({
  guardianId,
  communityId,
  targetMemberId = null,
  action,        // GUARDIAN_ACTIONS key
  note  = null,
}) {
  try {
    // Prüfen: Ist der Actor wirklich Guardian dieser Community?
    const { data: gRole } = await supabase
      .from('community_members')
      .select('role')
      .eq('user_id', guardianId)
      .eq('community_id', communityId)
      .maybeSingle();

    if (!gRole || !['guardian', 'moderator'].includes(gRole.role)) {
      return { error: 'Keine Guardian-Berechtigung' };
    }

    if (!GUARDIAN_ACTIONS[action]) {
      return { error: `Unbekannte Aktion: ${action}` };
    }

    // Aktion intern protokollieren — nie öffentlich sichtbar
    await supabase.from('guardian_actions').insert({
      guardian_id:      guardianId,
      community_id:     communityId,
      target_member_id: targetMemberId,
      action,
      note,
      energy:           GUARDIAN_ACTIONS[action].energy,
    });

    // Trust-Signal für verantwortungsvolles Guardian-Handeln
    recordTrustSignal({
      userId:      guardianId,
      signalType:  'community_contribution',
      contextType: 'guardian_action',
      note:        action,
    });

    return { success: true, action: GUARDIAN_ACTIONS[action] };
  } catch (err) {
    sentryCapture(err, { context: 'applyGuardianAction', action });
    return { error: err.message };
  }
}

// promoteToGuardian — bewusste Einladung, keine automatische Belohnung
export async function promoteToGuardian({ adminId, userId, communityId, note = null }) {
  try {
    const { error } = await supabase
      .from('community_members')
      .update({ role: 'guardian', promoted_at: new Date().toISOString(), promotion_note: note })
      .eq('user_id', userId)
      .eq('community_id', communityId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    sentryCapture(err, { context: 'promoteToGuardian' });
    return { error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// RESONANZRAUM-QUALITÄT
// Kleine stille Communities werden NICHT benachteiligt
// ─────────────────────────────────────────────────────────────

// getResonanceQuality — bewertet Tiefe, nicht Größe
export function getResonanceQuality({ memberCount, participationRate, avgResonanceDepth, hasGuardian, ageInDays }) {
  let quality = 50; // Basis

  // Qualitative Faktoren (nicht Größe)
  if (participationRate > 0.4)    quality += 15;  // Echte Beteiligung
  if (avgResonanceDepth > 3)      quality += 20;  // Tiefe Interaktionen
  if (hasGuardian)                quality += 10;  // Betreute Räume
  if (ageInDays > 30)             quality += 5;   // Langfristig gewachsen
  if (memberCount < 10)           quality += 5;   // Kleiner Kreis = intimer

  // Größe wirkt sich NICHT positiv aus — Quality over Quantity
  if (memberCount > 500)          quality -= 5;   // Große Räume können unintimer werden

  return Math.min(100, Math.max(0, quality));
}

// ─────────────────────────────────────────────────────────────
// RHYTHMUS-SCHUTZ
// Plattform soll atmen — kein Aktivitätsdruck
// ─────────────────────────────────────────────────────────────
export const RHYTHM_RULES = {
  // Maximale Notifications pro Tag (intern begrenzt)
  maxNotifsPerDay:       3,
  // Mindestabstand zwischen Community-Pings (in Stunden)
  minPingIntervalHours:  8,
  // Keine Aktivitäts-Benachrichtigung für stille Räume (< 5 Aktionen/Woche)
  silentRoomThreshold:   5,
  // Keine "du fehlst uns" / FOMO-Nachrichten
  noFomoMessages:        true,
  // Keine Streaks, keine Tages-Triggers
  noStreaks:             true,
  // Keine "X Personen haben gerade..." Notifications
  noSocialProofPings:   true,
};

// shouldSendCommunityNotif — Rhythmus-Check
export function shouldSendCommunityNotif(userId, communityId, lastNotifAt) {
  if (!lastNotifAt) return true;
  const hoursSince = (Date.now() - new Date(lastNotifAt).getTime()) / (1000 * 60 * 60);
  return hoursSince >= RHYTHM_RULES.minPingIntervalHours;
}
