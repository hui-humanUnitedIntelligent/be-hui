// src/lib/atmosphere/index.js
// HUI — Atmospheric Experience Layer — Phase 6E.7
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// HUI ist nicht nur funktional — es hat Atmosphäre.
// Atmosphäre ist nicht Dekoration.
// Atmosphäre ist das Gefühl, das entsteht wenn alles stimmt.
//
// WAS IST ATMOSPHÄRE IN HUI:
//   → Stimmungen die sich auf den Feed übertragen
//   → Sanfte Übergänge die Raum geben
//   → Interaktionen die atmen statt hetzen
//   → Räume die eine eigene Energie haben
//   → Emotionale Kontinuität zwischen Sessions
//
// ATMOSPHÄRE IST:
//   ✅ subtil — sie drängt sich nicht auf
//   ✅ responsive — sie reagiert auf Kontext
//   ✅ ruhig — nie hektisch
//   ✅ ehrlich — nicht manipulativ
//   ✅ individuell — jede Situation hat ihre eigene
// ═══════════════════════════════════════════════════════════════

// ── Atmosphären-Palette ─────────────────────────────────────────
// Jeder kreative Moment hat eine atmosphärische Qualität
export const ATMOSPHERES = {
  // Tageszeit-basiert
  fruehmorgen: {
    label:       'Frühmorgen',
    hours:       [5, 8],
    colors:      { bg: '#FFF8F0', accent: '#E8B89A', text: '#3A2A1A' },
    feeling:     'Stille vor dem Tag. Kreative Möglichkeit.',
    pacing:      'slow',
    transitions: 'soft',
  },
  vormittag: {
    label:       'Vormittag',
    hours:       [8, 12],
    colors:      { bg: '#F9F7F4', accent: '#16D7C5', text: '#1A1A1A' },
    feeling:     'Klarheit. Fokus. Handwerk.',
    pacing:      'measured',
    transitions: 'clean',
  },
  mittag: {
    label:       'Mittag',
    hours:       [12, 15],
    colors:      { bg: '#FAFAF8', accent: '#F5A623', text: '#2A2A2A' },
    feeling:     'Pause. Atem. Neustart.',
    pacing:      'relaxed',
    transitions: 'gentle',
  },
  nachmittag: {
    label:       'Nachmittag',
    hours:       [15, 19],
    colors:      { bg: '#F7F5F2', accent: '#FF8A6B', text: '#1A1A1A' },
    feeling:     'Wärme. Verbindung. Austausch.',
    pacing:      'social',
    transitions: 'warm',
  },
  abend: {
    label:       'Abend',
    hours:       [19, 22],
    colors:      { bg: '#F4F2EF', accent: '#9B8EC4', text: '#1A1A1A' },
    feeling:     'Reflexion. Tiefe. Resonanz.',
    pacing:      'contemplative',
    transitions: 'deep',
  },
  nacht: {
    label:       'Nacht',
    hours:       [22, 5],
    colors:      { bg: '#1A1A2E', accent: '#9B8EC4', text: '#E8E8F0' },
    feeling:     'Stille. Experiment. Freiheit.',
    pacing:      'nocturnal',
    transitions: 'mysterious',
  },
};

// ── Mood-Atmosphären ────────────────────────────────────────────
export const MOOD_ATMOSPHERES = {
  kreativ:       { bg: '#FFF5F0', accent: '#FF8A6B', glow: 'rgba(255,138,107,0.15)' },
  ruhig:         { bg: '#F0F8FA', accent: '#6BBCC4', glow: 'rgba(107,188,196,0.15)' },
  warm:          { bg: '#FFF8F0', accent: '#E8A87C', glow: 'rgba(232,168,124,0.15)' },
  professionell: { bg: '#F5F5F7', accent: '#6B7FC4', glow: 'rgba(107,127,196,0.15)' },
  authentisch:   { bg: '#F5F2EE', accent: '#8B7355', glow: 'rgba(139,115,85,0.15)' },
  inspirierend:  { bg: '#F0FAF5', accent: '#5AAA7E', glow: 'rgba(90,170,126,0.15)' },
  nachhaltig:    { bg: '#F2F5F0', accent: '#6A8B5A', glow: 'rgba(106,139,90,0.15)' },
};

// ── Zeitbasierte Atmosphäre ─────────────────────────────────────
export function getCurrentAtmosphere() {
  const hour = new Date().getHours();
  for (const [key, atm] of Object.entries(ATMOSPHERES)) {
    const [start, end] = atm.hours;
    if (start < end) {
      if (hour >= start && hour < end) return { key, ...atm };
    } else {
      // Wrap-around (z.B. 22-5)
      if (hour >= start || hour < end) return { key, ...atm };
    }
  }
  return { key: 'vormittag', ...ATMOSPHERES.vormittag };
}

// ── Transition Timing ───────────────────────────────────────────
// Sanfte Übergänge — nie hektisch
export const TRANSITION_TIMINGS = {
  instant:       { duration: '0ms',   easing: 'linear' },
  tap:           { duration: '120ms', easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
  soft:          { duration: '220ms', easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
  breathe:       { duration: '380ms', easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  slow:          { duration: '600ms', easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  verySlow:      { duration: '1000ms',easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  overlay:       { duration: '300ms', easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
};

// ── Ambient Creative States ─────────────────────────────────────
// Zustände in denen sich ein Creator befindet
export const AMBIENT_STATES = {
  flowing: {
    label:       'Im Flow',
    description: 'Tief in der Arbeit. Nicht stören.',
    signal:      'recently_created_work',
    pacing:      'focused',
    visibility:  'gentle_presence',
  },
  open: {
    label:       'Offen',
    description: 'Bereit für Verbindungen und Aufträge.',
    signal:      'is_available',
    pacing:      'social',
    visibility:  'visible',
  },
  resting: {
    label:       'Pause',
    description: 'Bewusst nicht erreichbar. Kreative Stille.',
    signal:      'not_available',
    pacing:      'slow',
    visibility:  'dim',
  },
  exploring: {
    label:       'Erkundend',
    description: 'Neue Impulse suchen. Offen für Inspiration.',
    signal:      'browsing_feed',
    pacing:      'curious',
    visibility:  'soft_glow',
  },
  collaborating: {
    label:       'In Zusammenarbeit',
    description: 'Aktives Projekt. Fokussiert.',
    signal:      'active_booking',
    pacing:      'engaged',
    visibility:  'connected',
  },
};

// ── Pacing-basierte Interaktion ─────────────────────────────────
/**
 * Gibt die empfohlene Interaktions-Geschwindigkeit für einen Kontext.
 * "Slow pacing" = längere Delays, ruhigere Animationen.
 */
export function getInteractionPacing(atmosphere, ambientState = 'open') {
  const atm   = atmosphere?.pacing || 'measured';
  const state = AMBIENT_STATES[ambientState]?.pacing || 'social';

  // Ruhigster Zustand gewinnt
  const pacing = [atm, state].includes('slow') || [atm, state].includes('nocturnal')
    ? 'slow'
    : [atm, state].includes('focused')
    ? 'focused'
    : [atm, state].includes('contemplative')
    ? 'contemplative'
    : 'normal';

  return {
    pacing,
    scrollDelay:    pacing === 'slow' ? 200 : 0,
    animDuration:   pacing === 'slow' ? 600 : pacing === 'focused' ? 200 : 380,
    feedItemDelay:  pacing === 'slow' ? 150 : 60,
    tapResponse:    TRANSITION_TIMINGS.tap,
    transition:     pacing === 'slow'
      ? TRANSITION_TIMINGS.breathe
      : TRANSITION_TIMINGS.soft,
  };
}

// ── Emotionale Kontinuität ──────────────────────────────────────
/**
 * Speichert den atmosphärischen Zustand einer Session
 * für emotionale Kontinuität beim nächsten Besuch.
 */
export function saveAtmosphericState(state = {}) {
  try {
    const toSave = {
      mood:        state.mood     || null,
      atmosphere:  state.key      || null,
      lastVisit:   new Date().toISOString(),
    };
    sessionStorage.setItem('hui_atmosphere', JSON.stringify(toSave));
  } catch (_) {}
}

export function loadAtmosphericState() {
  try {
    const raw = sessionStorage.getItem('hui_atmosphere');
    if (!raw) return null;
    const state  = JSON.parse(raw);
    const hoursSince = state.lastVisit
      ? (Date.now() - new Date(state.lastVisit).getTime()) / 3600000
      : 999;
    // Nur wenn letzte Session < 4h zurück → emotionale Kontinuität
    if (hoursSince > 4) return null;
    return state;
  } catch (_) { return null; }
}

// ── CSS Variables für Atmosphäre ────────────────────────────────
/**
 * Setzt CSS Custom Properties für aktuelle Atmosphäre.
 * Ermöglicht atmosphärisches Theming ohne JS-Overhead in Komponenten.
 */
export function applyAtmosphere(atmosphere, mood = null) {
  if (typeof document === 'undefined') return;

  const atm    = atmosphere?.colors || ATMOSPHERES.vormittag.colors;
  const moodAtm= mood && MOOD_ATMOSPHERES[mood] ? MOOD_ATMOSPHERES[mood] : null;

  const vars = {
    '--hui-atm-bg':      moodAtm?.bg      || atm.bg,
    '--hui-atm-accent':  moodAtm?.accent  || atm.accent,
    '--hui-atm-glow':    moodAtm?.glow    || 'rgba(0,0,0,0.05)',
    '--hui-atm-text':    atm.text,
    '--hui-atm-feeling': `"${atmosphere?.feeling || ''}"`,
  };

  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

// React Hook
import { useState, useEffect, useMemo } from 'react';

export function useAtmosphere(userMood = null, ambientState = 'open') {
  const [atmosphere, setAtmosphere] = useState(getCurrentAtmosphere);

  // Update jede Stunde
  useEffect(() => {
    const iv = setInterval(() => setAtmosphere(getCurrentAtmosphere()), 3600_000);
    return () => clearInterval(iv);
  }, []);

  const pacing     = useMemo(() => getInteractionPacing(atmosphere, ambientState), [atmosphere, ambientState]);
  const moodColors = useMemo(() => userMood && MOOD_ATMOSPHERES[userMood] ? MOOD_ATMOSPHERES[userMood] : null, [userMood]);

  useEffect(() => {
    applyAtmosphere(atmosphere, userMood);
    saveAtmosphericState({ ...atmosphere, mood: userMood });
  }, [atmosphere, userMood]);

  return {
    atmosphere,
    pacing,
    moodColors,
    colors:    moodColors || atmosphere?.colors,
    feeling:   atmosphere?.feeling,
    ambientState: AMBIENT_STATES[ambientState] || AMBIENT_STATES.open,
  };
}
