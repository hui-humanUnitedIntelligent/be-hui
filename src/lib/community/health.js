// src/lib/community/health.js
// ═══════════════════════════════════════════════════════════════
// HUI COMMUNITY HEALTH SYSTEM v1.0
//
// PHILOSOPHIE:
// Communities sollen Resonanzräume bleiben — keine toxischen Muster.
// Das System erkennt Probleme subtil und schützend.
// KEINE öffentlichen "Gesundheits-Scores".
// KEIN aggressives Moderations-UI.
//
// Signale für gesunde Community:
//   + Respektvolle Kommunikation
//   + Echte Beteiligung (nicht Masse)
//   + Langfristige Aktivität
//   + Hohe Resonanzqualität
//   + Diverse Beteiligung
//
// Warnsignale (intern):
//   - Gleicher User dominiert alle Beiträge
//   - Kurze, bedeutungslose Interaktionen
//   - Plötzlicher Massen-Zustrom
//   - Wiederholt gemeldete Inhalte
//   - Inaktivität nach Spike
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../supabaseClient';
import { sentryCapture } from '../sentry.js';
import { emit, PLATFORM_EVENTS } from '../events/index.js';

// ── Health-Dimensionen ────────────────────────────────────────
export const HEALTH_DIMENSIONS = {
  resonance_quality:   'Resonanzqualität',    // Tiefe der Interaktionen
  participation_depth: 'Beteiligung',          // Echte vs. oberflächlich
  activity_diversity:  'Vielfalt',             // Diverse Stimmen beteiligt?
  long_term_presence:  'Langfristigkeit',      // Bleibt die Community aktiv?
  safety:              'Sicherheit',           // Keine Toxizität
};

// ── detectSpamPattern ─────────────────────────────────────────
// Erkennt auffällige Muster (intern, nie dem User angezeigt).
// Gibt { isSpam, confidence, reason } zurück.
export function detectSpamPattern(events, { windowMs = 60_000 } = {}) {
  if (!events?.length) return { isSpam: false, confidence: 0 };

  const now = Date.now();
  const recentEvents = events.filter(e => {
    const age = now - new Date(e.created_at).getTime();
    return age < windowMs;
  });

  // Signal 1: Zu viele Events in kurzer Zeit
  if (recentEvents.length > 15) {
    return { isSpam: true, confidence: 0.85, reason: 'rate_limit_exceeded' };
  }

  // Signal 2: Identische Aktionen (copy-paste Resonanz)
  const types = recentEvents.map(e => e.event_type);
  const uniqueTypes = new Set(types).size;
  if (types.length > 5 && uniqueTypes === 1) {
    return { isSpam: true, confidence: 0.7, reason: 'repetitive_actions' };
  }

  return { isSpam: false, confidence: 0 };
}

// ── evaluateCommunityHealth ───────────────────────────────────
// Bewertet die Gesundheit eines Resonanzraums.
// Nur für interne Nutzung / Admin Dashboard.
export async function evaluateCommunityHealth(communityId) {
  try {
    // Letzte 30 Tage
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [membersRes, eventsRes, flagsRes] = await Promise.all([
      supabase
        .from('community_members')
        .select('user_id, joined_at')
        .eq('community_id', communityId),
      supabase
        .from('platform_events')
        .select('actor_id, event_type, created_at')
        .eq('target_id', communityId)
        .eq('target_type', 'community')
        .gte('created_at', since),
      supabase
        .from('content_flags')
        .select('id, severity')
        .eq('community_id', communityId)
        .gte('created_at', since),
    ]);

    const members  = membersRes.data  || [];
    const events   = eventsRes.data   || [];
    const flags    = flagsRes.data    || [];

    // Metriken berechnen
    const uniqueActors    = new Set(events.map(e => e.actor_id)).size;
    const participationRate = members.length > 0 ? uniqueActors / members.length : 0;
    const flagRate          = events.length > 0 ? flags.length / events.length : 0;

    // Health-Score (intern, 0-100)
    let score = 70; // Basis
    if (participationRate > 0.3) score += 10;
    if (participationRate > 0.6) score += 10;
    if (flagRate < 0.02)         score += 10;
    if (flagRate > 0.1)          score -= 20;
    if (members.length > 50)     score += 5;

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      memberCount:       members.length,
      activeParticipants: uniqueActors,
      participationRate: Math.round(participationRate * 100),
      flagRate:          Math.round(flagRate * 100),
      needsAttention:    score < 50 || flagRate > 0.1,
    };
  } catch (err) {
    sentryCapture(err, { context: 'evaluateCommunityHealth', communityId });
    return { score: 0, needsAttention: false };
  }
}

// ── flagContent ───────────────────────────────────────────────
// User meldet einen Inhalt (ruhig, kein Drama-Interface).
// KEINE öffentliche Anzeige — geht direkt ins interne Review.
export async function flagContent({
  reporterId,
  contentId,
  contentType,  // 'message' | 'work' | 'story' | 'profile'
  reason,       // 'disrespectful' | 'spam' | 'inappropriate' | 'other'
  note = null,
}) {
  try {
    // Idempotent: gleicher Reporter kann gleichen Content nicht doppelt melden
    const { data: existing } = await supabase
      .from('content_flags')
      .select('id')
      .eq('reporter_id', reporterId)
      .eq('content_id', contentId)
      .maybeSingle();

    if (existing) return { alreadyFlagged: true };

    await supabase.from('content_flags').insert({
      reporter_id:  reporterId,
      content_id:   contentId,
      content_type: contentType,
      reason,
      note,
      status: 'pending',
    });

    // Intern: Event erzeugen für Monitoring
    await emit(PLATFORM_EVENTS.CONTENT_FLAGGED, {
      actorId:    reporterId,
      targetId:   contentId,
      targetType: contentType,
      metadata:   { reason },
    });

    return { success: true };
  } catch (err) {
    sentryCapture(err, { context: 'flagContent' });
    return { error: err.message };
  }
}


// ─────────────────────────────────────────────────────────────
// PHASE C: LIVE-ERLEBNIS QUALITÄTS-SIGNALE
// ─────────────────────────────────────────────────────────────

// isExperienceTrustworthy — prüft ob ein Erlebnis vertrauenswürdig wirkt
// Keine harte Blockierung — nur Hinweis an Creator wenn etwas fehlt.
export function isExperienceTrustworthy(experience, creatorProfile) {
  const signals = [];
  const missing = [];

  // Positive Signale
  if (experience.cover_url)          signals.push('Bild vorhanden');
  if (experience.description?.length > 100) signals.push('Ausführliche Beschreibung');
  if (experience.location_text)      signals.push('Ort angegeben');
  if (experience.duration)           signals.push('Dauer bekannt');
  if (creatorProfile?.has_talent_profile)   signals.push('Verifizierter Creator');
  if ((creatorProfile?.booking_count || 0) > 0) signals.push('Erfahrener Gastgeber');

  // Fehlende Signale (ruhige Hinweise — keine Fehlermeldungen)
  if (!experience.description)       missing.push('Beschreibung könnte helfen');
  if (!experience.cover_url)         missing.push('Ein Bild schafft Vertrauen');
  if (!experience.max_participants)  missing.push('Teilnehmerzahl klärt Erwartungen');

  const trustworthy = signals.length >= 3;
  return { trustworthy, signals, missing };
}

// liveExperienceRhythm — stellt sicher dass Live-Erlebnisse ruhig bleiben
// Verhindert "Event-Plattform"-Energie: keine Countdown-Stress-UX
export const LIVE_EXPERIENCE_PRINCIPLES = {
  no_countdown_pressure: true,       // Kein Countdown-Timer der Druck erzeugt
  no_spots_left_spam:    true,       // Kein "Nur noch 2 Plätze!" Spam
  clear_cancellation:    true,       // Klare, menschliche Stornierungslogik
  human_confirmation:    true,       // Bestätigung klingt menschlich, nicht transaktional
  safety_first:          true,       // Sicherheitsgefühl vor Konversionsoptimierung
};

// getCommunityResonanceProfile — qualitatives Profil eines Resonanzraums
// Für interne Analyse und Guardian-Hinweise
export async function getCommunityResonanceProfile(communityId) {
  try {
    const [membersRes, eventsRes] = await Promise.all([
      supabase.from('community_members')
        .select('user_id, role, joined_at')
        .eq('community_id', communityId),
      supabase.from('platform_events')
        .select('event_type, actor_id, created_at')
        .eq('target_id', communityId)
        .eq('target_type', 'community')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(200),
    ]);

    const members  = membersRes.data  || [];
    const events   = eventsRes.data   || [];
    const guardians = members.filter(m => m.role === 'guardian');
    const uniqueActors = new Set(events.map(e => e.actor_id)).size;
    const ageInDays = members.length > 0
      ? Math.floor((Date.now() - new Date(Math.min(...members.map(m => new Date(m.joined_at)))).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const participationRate = members.length > 0 ? uniqueActors / members.length : 0;

    const { getResonanceQuality } = await import('./index.js');
    const qualityScore = getResonanceQuality({
      memberCount:        members.length,
      participationRate,
      avgResonanceDepth:  events.length > 0 ? events.length / uniqueActors : 0,
      hasGuardian:        guardians.length > 0,
      ageInDays,
    });

    return {
      memberCount:     members.length,
      guardianCount:   guardians.length,
      eventCount:      events.length,
      uniqueActors,
      participationRate: Math.round(participationRate * 100),
      ageInDays,
      qualityScore,
      isHealthy:       qualityScore >= 60,
      isQuiet:         events.length < 5,  // Stille ist OK — nicht pathologisch
      needsGuardian:   guardians.length === 0 && members.length > 10,
    };
  } catch (err) {
    sentryCapture(err, { context: 'getCommunityResonanceProfile' });
    return { qualityScore: 50, isHealthy: true, isQuiet: false };
  }
}
