// src/lib/discovery/index.js
// ═══════════════════════════════════════════════════════════════
// HUI DISCOVERY INTELLIGENCE v1.0
//
// PHILOSOPHIE:
// Discovery ist resonanzbasiert — nicht viral, nicht engagement-getrieben.
// Menschen entdecken Resonanzwege, keine Algorithmus-Feeds.
//
// Priorisierung nach:
//   1. Echte menschliche Resonanz (Weiterempfehlungen, Begegnungen)
//   2. Gemeinschaft & lokale Nähe
//   3. Vertrauen (Trust-Signale)
//   4. Positive Wirkung
//
// NICHT priorisiert:
//   ✗ Klick-Raten / CTR
//   ✗ Verweildauer / Watch-Time
//   ✗ Virales Teilen
//   ✗ Kommentar-Volumen
//   ✗ Paid Visibility
//
// RESONANZPFAD:
//   Werk → Mensch → Resonanzraum → Erlebnis → Wirkung
//
// Jede Entdeckung soll natürlich in den nächsten Schritt führen.
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../supabaseClient';
import { sentryCapture } from '../sentry.js';
import { cachedQuery } from '../perfUtils.js';

// ── Discovery-Signale (Gewichtung) ───────────────────────────
export const DISCOVERY_SIGNALS = {
  recommendation_score: 4.0,   // Wurde weiterempfohlen?
  resonance_depth:      3.0,   // Tiefe Resonanz-Events
  trust_level:          2.5,   // Trust des Creators
  local_proximity:      2.0,   // Geografische Nähe
  community_growth:     1.5,   // Community wächst gesund?
  recent_activity:      1.0,   // Kürzlich aktiv (nicht viral, nur lebendig)
  experience_count:     0.8,   // Hat echte Begegnungen geboten
  impact_connection:    1.2,   // Verbunden mit Impact-Projekten
};

// ── getResonanceDiscovery ─────────────────────────────────────
// Hauptfunktion: Resonanzbasierte Entdeckung.
// Gibt eine kuratierte, ruhige Auswahl zurück — kein Infinite-Feed.
export async function getResonanceDiscovery({
  userId,
  location       = null,   // { lat, lng } optional
  category       = null,
  limit          = 12,     // Bewusst klein — Qualität über Quantität
  excludeIds     = [],
} = {}) {
  try {
    // Parallele Queries für verschiedene Resonanzwege
    const [profilesRes, worksRes, experiencesRes] = await Promise.all([

      // Profil-Discovery: Talente mit echten Empfehlungen
      supabase
        .from('profiles')
        .select('id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views') // Identity Contract v1.0
        .eq('has_talent_profile', true)
        .not('id', 'in', `(${excludeIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .limit(limit),

      // Work-Discovery: Werke mit Resonanz
      supabase
        .from('works')
        .select('id, user_id, title, cover_url, price, category, medium, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit),

      // Experience-Discovery: Begegnungen in der Nähe
      supabase
        .from('experiences')
        .select('id, user_id, title, cover_url, price, duration, location_text, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 2)),
    ]);

    return {
      profiles:    profilesRes.data    || [],
      works:       worksRes.data       || [],
      experiences: experiencesRes.data || [],
    };
  } catch (err) {
    sentryCapture(err, { context: 'getResonanceDiscovery' });
    return { profiles: [], works: [], experiences: [] };
  }
}

// ── getResonancePath ──────────────────────────────────────────
// Resonanzpfad: Ausgehend von einem Objekt, was kommt als nächstes?
// Werk → Mensch → Resonanzraum → Erlebnis → Wirkung
export async function getResonancePath(fromType, fromId, userId = null) {
  const paths = {
    work: async () => {
      // Von Werk → zum Schöpfer (Mensch)
      const { data: work } = await supabase
        .from('works').select('user_id, category').eq('id', fromId).maybeSingle();

      if (!work) return { next: null, nextType: null };

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, talent, bio')
        .eq('id', work.user_id).maybeSingle();

      return {
        nextType:  'profile',
        next:      profile,
        hint:      'Den Menschen hinter diesem Werk entdecken',
        hintEmoji: '✦',
      };
    },

    profile: async () => {
      // Von Mensch → zu Erlebnissen (Begegnung)
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title, cover_url, price, location_text, duration')
        .eq('user_id', fromId)
        .eq('status', 'published')
        .limit(3);

      return {
        nextType:  'experiences',
        next:      experiences || [],
        hint:      'Begegnungen mit diesem Menschen',
        hintEmoji: '🌱',
      };
    },

    experience: async () => {
      // Von Erlebnis → zu Wirkung (Impact)
      const { data: impacts } = await supabase
        .from('impact_projects')
        .select('id, name, description, icon, color, category')
        .eq('status', 'active')
        .limit(3);

      return {
        nextType:  'impact',
        next:      impacts || [],
        hint:      'Wirkung die durch Begegnungen entsteht',
        hintEmoji: '🌿',
      };
    },

    community: async () => {
      // Von Community → zu verwandten Erlebnissen
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, title, cover_url, price, location_text')
        .eq('status', 'published')
        .limit(4);

      return {
        nextType:  'experiences',
        next:      experiences || [],
        hint:      'Begegnungen in dieser Gemeinschaft',
        hintEmoji: '👥',
      };
    },
  };

  try {
    const pathFn = paths[fromType];
    if (!pathFn) return { nextType: null, next: null };
    return await pathFn();
  } catch (err) {
    sentryCapture(err, { context: 'getResonancePath', fromType });
    return { nextType: null, next: null };
  }
}

// ── getLocalResonance ─────────────────────────────────────────
// Lokale Gemeinschaft entdecken — ruhig, ohne aggressive Geo-UX.
export async function getLocalResonance(locationLabel, { limit = 6 } = {}) {
  if (!locationLabel) return { profiles: [], experiences: [] };

  try {
    const like = `%${locationLabel.split(',')[0].trim()}%`;

    const [profilesRes, expRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, avatar_url, talent, location')
        .eq('has_talent_profile', true)
        .ilike('location', like)
        .limit(limit),
      supabase
        .from('experiences')
        .select('id, title, cover_url, location_text, price')
        .eq('status', 'published')
        .ilike('location_text', like)
        .limit(limit),
    ]);

    return {
      profiles:    profilesRes.data || [],
      experiences: expRes.data      || [],
    };
  } catch (err) {
    sentryCapture(err, { context: 'getLocalResonance' });
    return { profiles: [], experiences: [] };
  }
}