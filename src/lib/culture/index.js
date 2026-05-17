// src/lib/culture/index.js
// HUI — Cultural Layer — Phase 6H.2 + 6H.3 + 6H.6
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Kultur entsteht durch wiederkehrende Erfahrungen — nicht durch Regeln.
// Rituale sind freiwillig, langsam und nicht gamifiziert.
// Kulturelles Gedächtnis ehrt Tiefe, nicht Lautstärke.
// Saisonale Atmosphäre macht die Plattform lebendig.
//
// WAS DIESES SYSTEM NICHT IST:
//   ❌ FOMO-Events
//   ❌ Pflicht-Teilnahme
//   ❌ Badge-getriebene Rituale
//   ❌ "Top Contributor" Rankings
//
// WAS DIESES SYSTEM IST:
//   ✅ Einladungen — keine Verpflichtungen
//   ✅ Stille gemeinsame Erfahrungen
//   ✅ Kulturelles Gedächtnis das Tiefe ehrt
//   ✅ Saisonale Atmosphäre die die Plattform atmen lässt
// ═══════════════════════════════════════════════════════════════

// ── 6H.2 — Community Rituals ───────────────────────────────────

export const RITUAL_TYPES = {
  // Täglich — optional, sehr leise
  nightly_resonance: {
    id:          'nightly_resonance',
    name:        'Nächtliche Resonanz',
    frequency:   'daily',
    time:        '22:00',
    duration:    '2 Stunden',
    description: 'Eine stille gemeinsame Zeit. Wer mag, schafft — allein, aber zusammen.',
    atmosphere:  'naechtlich',
    participation: 'invisible', // Niemand sieht wer dabei ist
    gamification:  false,
    fomo:          false,
  },

  // Wöchentlich — einmal pro Woche
  slow_week: {
    id:          'slow_week',
    name:        'Woche der Ruhe',
    frequency:   'monthly',
    duration:    '1 Woche',
    description: 'Eine Woche bewusst langsamer Kreativität. Kein Druck. Kein Ziel.',
    atmosphere:  'still',
    participation:'silent',
    gamification:  false,
    fomo:          false,
  },

  local_walk: {
    id:          'local_walk',
    name:        'Kreativer Spaziergang',
    frequency:   'weekly',
    description: 'Wer mag, geht in seiner Stadt los — offen für kreative Eindrücke.',
    atmosphere:  'erdverbunden',
    participation: 'local_only',  // Nur in der eigenen Stadt sichtbar
    gamification:  false,
    fomo:          false,
  },

  // Monatlich
  interdisciplinary_exchange: {
    id:          'interdisciplinary_exchange',
    name:        'Interdisziplinärer Austausch',
    frequency:   'monthly',
    duration:    '1 Woche',
    description: 'Ein Thema — viele kreative Zugänge. Klang trifft Bild. Code trifft Ton.',
    atmosphere:  'tief',
    participation: 'open',
    gamification:  false,
    fomo:          false,
  },

  seasonal_theme: {
    id:          'seasonal_theme',
    name:        'Saisonales Thema',
    frequency:   'quarterly',
    description: 'Ein atmosphärisches Thema für die Jahreszeit. Nicht verpflichtend.',
    atmosphere:  'warm',
    participation: 'open',
    gamification:  false,
    fomo:          false,
  },

  quiet_sharing: {
    id:          'quiet_sharing',
    name:        'Stille Werkschau',
    frequency:   'monthly',
    duration:    '3 Tage',
    description: 'Wer mag, teilt einen Einblick — ohne Erklärung. Ohne Bewertung.',
    atmosphere:  'still',
    participation: 'open',
    gamification:  false,
    fomo:          false,
  },
};

/**
 * Aktives Ritual für heute ermitteln.
 * Ruhige Logik — kein Alarm wenn kein Ritual aktiv.
 */
export function getActiveRitual(date = new Date()) {
  const hour    = date.getHours();
  const dow     = date.getDay();   // 0=So, 6=Sa
  const dom     = date.getDate();
  const month   = date.getMonth(); // 0-11

  // Nächtliche Resonanz: täglich 22-24 Uhr
  if (hour >= 22) return RITUAL_TYPES.nightly_resonance;

  // Kreativer Spaziergang: Samstag Morgen
  if (dow === 6 && hour >= 9 && hour < 14) return RITUAL_TYPES.local_walk;

  // Interdisziplinärer Austausch: erste Woche des Monats
  if (dom <= 7) return RITUAL_TYPES.interdisciplinary_exchange;

  // Stille Werkschau: 15.-17. jeden Monats
  if (dom >= 15 && dom <= 17) return RITUAL_TYPES.quiet_sharing;

  // Saisonales Thema: Quartalsbeginn (Jan, Apr, Jul, Okt)
  if ([0, 3, 6, 9].includes(month) && dom <= 7) return RITUAL_TYPES.seasonal_theme;

  return null; // Kein aktives Ritual — normal
}

/**
 * Einladungstext für ein Ritual.
 * Weich, niemals imperative.
 */
export function getRitualInvitation(ritual) {
  if (!ritual) return null;
  const invitations = {
    nightly_resonance:         'Wer mag — diese Nacht gemeinsam schaffen.',
    local_walk:                'Ein Spaziergang durch die Stadt, offen für Eindrücke.',
    interdisciplinary_exchange:'Diese Woche: ein Thema, viele kreative Welten.',
    slow_week:                 'Eine Woche Ruhe. Kein Druck. Kein Ziel.',
    seasonal_theme:            'Das Thema dieser Jahreszeit wartet auf deine Auslegung.',
    quiet_sharing:             'Wer mag, teilt einen Einblick — still, ohne Bewertung.',
  };
  return invitations[ritual.id] || null;
}

// ── 6H.3 — Cultural Memory ─────────────────────────────────────

export const MEMORY_TYPES = {
  milestone_collab:  'Erste bedeutsame Zusammenarbeit',
  long_term:         'Langfristige kreative Partnerschaft',
  bridge_moment:     'Kreative Brücke zwischen Welten',
  local_connection:  'Lokale kreative Begegnung',
  newcomer_welcome:  'Willkommen in der Gemeinschaft',
  mentorship_given:  'Kreatives Wissen weitergegeben',
  seasonal_creation: 'Werk einer besonderen Jahreszeit',
  ritual_joined:     'An einem gemeinsamen Moment teilgenommen',
};

/**
 * Kulturelles Gedächtnis-Objekt erstellen.
 * Wird privat gespeichert — nie öffentlich ausgestellt.
 */
export function createCulturalMemory({
  type,
  creatorId,
  partnerId     = null,
  note          = '',
  mood          = null,
  season        = null,
  ritualId      = null,
  city          = null,
}) {
  const SEASONS = getSeason();
  return {
    id:           `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    label:        MEMORY_TYPES[type] || type,
    creator_id:   creatorId,
    partner_id:   partnerId,
    note:         note?.trim() || '',
    mood,
    season:       season || SEASONS.current,
    ritual_id:    ritualId,
    city,
    is_private:   true,   // IMMER privat — kein öffentliches Kulturgedächtnis
    created_at:   new Date().toISOString(),
  };
}

/**
 * Kultureller Meilenstein — automatisch erkannt.
 * Wird als stilles Signal gesetzt — kein Pop-up.
 */
export function detectCulturalMilestone(profile = {}, history = {}) {
  const {
    completedCollabs = 0,
    uniquePartners   = 0,
    monthsActive     = 0,
    hasBridged       = false,
    hasMentored      = false,
    localCollabs     = 0,
  } = history;

  const milestones = [];

  if (completedCollabs === 1)  milestones.push('first_collaboration');
  if (completedCollabs === 5)  milestones.push('five_collaborations');
  if (completedCollabs === 20) milestones.push('twenty_collaborations');
  if (uniquePartners >= 5)     milestones.push('five_unique_partners');
  if (monthsActive >= 12)      milestones.push('one_year');
  if (hasBridged)              milestones.push('first_bridge');
  if (hasMentored)             milestones.push('first_mentorship');
  if (localCollabs >= 3)       milestones.push('local_roots');

  // Meilensteine werden NICHT öffentlich angezeigt
  // Sie leben im privaten Cultural Memory
  return milestones;
}

// ── 6H.6 — Seasonal & Community Atmosphere ─────────────────────

const SEASONAL_ATMOSPHERES = {
  fruehling: {
    name:        'Frühling',
    months:      [2, 3, 4],  // März-Mai
    colors:      { bg: '#F5FBF2', accent: '#68B84F', glow: 'rgba(104,184,79,0.12)' },
    themes:      ['Aufbruch', 'Neubeginn', 'Wachstum', 'Helligkeit', 'Draußen'],
    mood:        'lebendig',
    description: 'Die kreative Energie erwacht. Neue Projekte wachsen.',
    rituals:     ['local_walk', 'interdisciplinary_exchange'],
  },
  sommer: {
    name:        'Sommer',
    months:      [5, 6, 7],  // Juni-Aug
    colors:      { bg: '#FFFBF0', accent: '#E8A82A', glow: 'rgba(232,168,42,0.12)' },
    themes:      ['Intensität', 'Draußen', 'Gemeinschaft', 'Leichtigkeit', 'Begegnung'],
    mood:        'warm',
    description: 'Lange Tage. Begegnungen. Kreativität im Außen.',
    rituals:     ['local_walk', 'quiet_sharing'],
  },
  herbst: {
    name:        'Herbst',
    months:      [8, 9, 10], // Sep-Nov
    colors:      { bg: '#FDF6EE', accent: '#C4783A', glow: 'rgba(196,120,58,0.12)' },
    themes:      ['Tiefe', 'Ernte', 'Innen', 'Reflexion', 'Wandel'],
    mood:        'erdverbunden',
    description: 'Rückzug nach innen. Vertiefung. Reife Zusammenarbeit.',
    rituals:     ['slow_week', 'interdisciplinary_exchange', 'nightly_resonance'],
  },
  winter: {
    name:        'Winter',
    months:      [11, 0, 1], // Dez-Feb
    colors:      { bg: '#F0F4F8', accent: '#7BA3C4', glow: 'rgba(123,163,196,0.12)' },
    themes:      ['Stille', 'Konzentration', 'Handwerk', 'Licht', 'Gemeinschaft'],
    mood:        'still',
    description: 'Die kreative Stille. Tiefes Handwerk. Gemeinschaft im Innen.',
    rituals:     ['nightly_resonance', 'slow_week', 'quiet_sharing'],
  },
};

/**
 * Aktuelle Jahreszeit bestimmen.
 */
export function getSeason(date = new Date()) {
  const month = date.getMonth();
  for (const [key, s] of Object.entries(SEASONAL_ATMOSPHERES)) {
    if (s.months.includes(month)) {
      return {
        key,
        ...s,
        current: key,
        themeOfMonth: s.themes[date.getDate() % s.themes.length],
      };
    }
  }
  return { key: 'herbst', ...SEASONAL_ATMOSPHERES.herbst, current: 'herbst' };
}

/**
 * Community Atmosphären-Signal.
 * Kombiniert Jahreszeit + aktives Ritual + Tageszeit.
 */
export function getCommunityAtmosphere(date = new Date()) {
  const season  = getSeason(date);
  const ritual  = getActiveRitual(date);
  const hour    = date.getHours();

  // Stimmungs-Override durch Ritual
  const mood = ritual?.atmosphere || season.mood;

  // Tageszeit-Modifikator
  const timeQuality =
    hour < 6  ? 'nächtlich ruhig' :
    hour < 10 ? 'morgens klar'    :
    hour < 14 ? 'mittags präsent' :
    hour < 18 ? 'nachmittags warm':
    hour < 22 ? 'abends tief'     :
                'nächtlich kreativ';

  return {
    season,
    ritual,
    mood,
    timeQuality,
    colors:      season.colors,
    description: ritual
      ? `${season.name} · ${ritual.name}`
      : `${season.name} · ${timeQuality}`,
    invitation:  getRitualInvitation(ritual),
  };
}

// React Hook
import { useState, useEffect, useMemo } from 'react';

export function useCommunityAtmosphere() {
  const [now, setNow] = useState(new Date());

  // Stündlich aktualisieren
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 3600_000);
    return () => clearInterval(iv);
  }, []);

  const atmosphere = useMemo(() => getCommunityAtmosphere(now), [now]);

  return atmosphere;
}
