// src/lib/community/local.js
// ═══════════════════════════════════════════════════════════════
// HUI LOKALE WELT v1.0 — Phase C
//
// PHILOSOPHIE:
// Lokale Gemeinschaft soll spürbar sein — ohne Karten-Overload.
// Menschen entdecken echte Orte, keine Pin-Cluster.
//
// ENERGIE:
//   "Hier entsteht echte Gemeinschaft."
//
// NICHT:
//   Eventplattform-Energie
//   Karten mit 200 Pins
//   Algorithmische Geodaten-Exploitation
//
// LOCAL DISCOVERY PRINZIPIEN:
//   - Weiche Stadt-/Regions-Ebene (nicht GPS-Punkte)
//   - Menschen vor Orten
//   - Begegnungen vor Events
//   - Qualität vor Quantität
// ═══════════════════════════════════════════════════════════════

import { supabase }      from '../supabaseClient';
import { sentryCapture } from '../sentry.js';

// ── Lokale Resonanzebene ──────────────────────────────────────
// HUI arbeitet auf Stadt/Region-Ebene — nicht auf GPS-Koordinaten.
// Menschen geben ihre Stadt an, keine Adresse.
export const LOCAL_SCALES = {
  city:   { label: 'In deiner Stadt',   radiusKm: 25  },
  region: { label: 'In deiner Region',  radiusKm: 80  },
  nearby: { label: 'In der Nähe',       radiusKm: 150 },
};

// ── getLocalCommunity ─────────────────────────────────────────
// Gibt lokale Inhalte zurück — ruhig, nicht aggressiv.
// Basis: location_label (Stadt) — kein GPS-Tracking.
export async function getLocalCommunity(locationLabel, { limit = 8, scale = 'city' } = {}) {
  if (!locationLabel) return { profiles: [], experiences: [], communities: [] };

  try {
    const city = locationLabel.split(',')[0].trim();
    const like = `%${city}%`;

    const [profilesRes, expRes, commRes] = await Promise.all([
      // Lokale Talente
      supabase.from('profiles')
        .select('id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views') // Identity Contract v1.0
        .eq('has_talent_profile', true)
        .ilike('location_label', like) // Identity Contract v1.0
        .limit(limit),

      // Lokale Begegnungen
      supabase.from('experiences')
        .select('id, title, cover_url, price, location_text, duration, user_id')
        .eq('status', 'published')
        .ilike('location_text', like)
        .limit(limit),

      // Lokale Communities
      supabase.from('communities')
        .select('id, name, description, type, location_label, member_count, avatar_url')
        .ilike('location_label', like)
        .eq('is_public', true)
        .order('member_count', { ascending: false })
        .limit(Math.ceil(limit / 2)),
    ]);

    return {
      city,
      profiles:     profilesRes.data    || [],
      experiences:  expRes.data         || [],
      communities:  commRes.data        || [],
      isEmpty:      !(profilesRes.data?.length || expRes.data?.length || commRes.data?.length),
    };
  } catch (err) {
    sentryCapture(err, { context: 'getLocalCommunity', locationLabel });
    return { profiles: [], experiences: [], communities: [], isEmpty: true };
  }
}

// ── getLocalResonanceMoments ──────────────────────────────────
// Aktuelle Resonanzmomente in der Region — ruhig, keine Echtzeit-Hektik.
// Wird max. 1x pro Stunde aktualisiert (gecacht).
export async function getLocalResonanceMoments(city, { limit = 5 } = {}) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Kürzlich erstellte Werke/Erlebnisse in der Region
    const [worksRes, expRes] = await Promise.all([
      supabase.from('works')
        .select('id, title, cover_url, category, user_id, created_at')
        .eq('status', 'published')
        .gte('created_at', since)
        .limit(limit),
      supabase.from('experiences')
        .select('id, title, cover_url, location_text, created_at, user_id')
        .eq('status', 'published')
        .ilike('location_text', `%${city}%`)
        .gte('created_at', since)
        .limit(limit),
    ]);

    const moments = [
      ...(worksRes.data || []).map(w => ({ ...w, momentType: 'work' })),
      ...(expRes.data   || []).map(e => ({ ...e, momentType: 'experience' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
     .slice(0, limit);

    return { moments, city };
  } catch (err) {
    sentryCapture(err, { context: 'getLocalResonanceMoments' });
    return { moments: [], city };
  }
}

// ── formatLocalLabel ──────────────────────────────────────────
// Gibt einen ruhigen, lesbaren Orts-Label zurück.
// "München, Bayern, Deutschland" → "München"
export function formatLocalLabel(location) {
  if (!location) return null;
  return location.split(',')[0].trim();
}

// ── localResonanceHint ────────────────────────────────────────
// Gibt einen atmosphärischen Text für die lokale Entdeckung.
// Keine Marketing-Energie — ruhige Einladung.
export function localResonanceHint(city) {
  const hints = [
    `Echte Gemeinschaft in ${city} ✦`,
    `Menschen in ${city} die resonieren`,
    `Begegnungen in deiner Nähe`,
    `${city} — Kreativität trifft Menschlichkeit`,
    `Was in ${city} gerade entsteht`,
  ];
  return hints[Math.floor(Math.random() * hints.length)];
}
