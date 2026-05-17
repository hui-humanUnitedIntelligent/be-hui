// src/lib/atmosphere/ui.js
// HUI — Atmospheric UI System — Phase 6G.6 + 6G.7
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// UI transportiert Atmosphäre durch:
//   → Farbe statt Text (atmosphärische Farbflächen)
//   → Langsamkeit statt Hektik (ruhige Rhythmik)
//   → Stille statt Lautstärke (subtile Signale)
//
// QUIET SOCIAL DESIGN (6G.7):
//   Sozial ohne sozialen Druck.
//   Präsenz ohne Hektik.
//   Verbindung ohne Angst.
//
// DESIGN-REGELN:
//   ✅ transform + opacity bevorzugen (GPU-beschleunigt)
//   ✅ cubic-bezier für organische Kurven
//   ✅ > 200ms für Haupt-Transitions (nie hektisch)
//   ❌ keine abrupten Erscheinungen
//   ❌ keine attention-seeking Animationen
// ═══════════════════════════════════════════════════════════════

// ── Presence-Indikator ──────────────────────────────────────────
// Ruhig, nicht-invasiv — kein "Online jetzt!"-Alarm
export const PRESENCE_INDICATORS = {
  // Was wir zeigen — wie und wann
  active:   { dot: '#3DB87A', opacity: 0.8, pulse: true,  text: 'kreativ aktiv' },
  recently: { dot: '#F5A623', opacity: 0.6, pulse: false, text: 'heute da' },
  quiet:    { dot: '#BBBBBB', opacity: 0.4, pulse: false, text: null },  // Kein Text
  resting:  { dot: '#DDDDDD', opacity: 0.3, pulse: false, text: null },  // Unsichtbar
  // 'offline' wird NIE gezeigt — keine Abwesenheitssignalisierung
};

// Presence aus Aktivitätsdaten ableiten (nicht aus realtime socket)
export function derivePresenceIndicator(lastActiveAt) {
  if (!lastActiveAt) return PRESENCE_INDICATORS.quiet;
  const minutes = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (minutes < 30)   return PRESENCE_INDICATORS.active;
  if (minutes < 1440) return PRESENCE_INDICATORS.recently;  // < 24h
  return PRESENCE_INDICATORS.quiet;
}

// ── Atmospheric Color System ────────────────────────────────────
// Hintergrundtöne die Präsenz transportieren (niemals weiß oder neutral)
export const ATMOSPHERIC_BACKGROUNDS = {
  // Zeit-basiert
  morning:   'linear-gradient(160deg, #FFF8F2 0%, #FFF5EE 100%)',
  midday:    'linear-gradient(160deg, #FAFAF8 0%, #F7F5F2 100%)',
  afternoon: 'linear-gradient(160deg, #FDF6F2 0%, #FAF2EE 100%)',
  evening:   'linear-gradient(160deg, #F6F4F0 0%, #F2EEE8 100%)',
  night:     'linear-gradient(160deg, #1E1A2E 0%, #16121F 100%)',

  // Mood-basiert
  kreativ:       'linear-gradient(160deg, #FFF5F0 0%, #FFF0EB 100%)',
  ruhig:         'linear-gradient(160deg, #F0F8FA 0%, #EBF5F8 100%)',
  warm:          'linear-gradient(160deg, #FFF8F0 0%, #FFF3E8 100%)',
  professionell: 'linear-gradient(160deg, #F5F5F7 0%, #F0F0F3 100%)',
  authentisch:   'linear-gradient(160deg, #F5F2EE 0%, #F0EDE8 100%)',
  inspirierend:  'linear-gradient(160deg, #F0FAF5 0%, #EBF7F0 100%)',
  nachhaltig:    'linear-gradient(160deg, #F2F5F0 0%, #EDF0EA 100%)',
};

// ── Quiet Social CSS ────────────────────────────────────────────
// Sanfte Sichtbarkeit ohne sozialen Druck
export const QUIET_SOCIAL_CSS = `
  /* Presence Dot — atmet statt blinkt */
  @keyframes hui-breathe-soft {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50%       { opacity: 0.85; transform: scale(1.15); }
  }

  /* Signature Fade — erscheint langsam */
  @keyframes hui-signature-appear {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Presence Layer — sanft einblenden */
  @keyframes hui-presence-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* Hover — ruhig, kein Abschreck-Effekt */
  .hui-presence-chip {
    transition: background 300ms ease, border-color 300ms ease;
  }
  .hui-presence-chip:hover {
    background: rgba(0,0,0,0.06) !important;
  }

  /* Resonance Block — subtile Einrahmung */
  .hui-resonance-block {
    animation: hui-presence-fade 600ms ease both;
    animation-delay: 200ms;
    opacity: 0;
  }

  /* Signature Text — erscheint nach Profil-Load */
  .hui-signature-text {
    animation: hui-signature-appear 500ms cubic-bezier(0.23,1,0.32,1) both;
    animation-delay: 300ms;
    opacity: 0;
  }

  /* Presence Dot */
  .hui-presence-active {
    animation: hui-breathe-soft 3s ease-in-out infinite;
  }
`;

// ── Feed Card Presence-Tönung ───────────────────────────────────
// Sehr subtile Hintergrundtönung für Werke/Creator-Cards
export function getCardAtmosphere(item = {}) {
  const mood = item.mood || item.mood_tags?.[0] || null;

  const CARD_TONES = {
    kreativ:       { border: 'rgba(255,138,107,0.10)', glow: 'rgba(255,138,107,0.04)' },
    ruhig:         { border: 'rgba(107,188,196,0.10)', glow: 'rgba(107,188,196,0.04)' },
    warm:          { border: 'rgba(232,168,124,0.10)', glow: 'rgba(232,168,124,0.04)' },
    professionell: { border: 'rgba(107,127,196,0.10)', glow: 'rgba(107,127,196,0.04)' },
    authentisch:   { border: 'rgba(139,115,85,0.10)',  glow: 'rgba(139,115,85,0.04)'  },
    inspirierend:  { border: 'rgba(90,170,126,0.10)',  glow: 'rgba(90,170,126,0.04)'  },
    nachhaltig:    { border: 'rgba(106,139,90,0.10)',  glow: 'rgba(106,139,90,0.04)'  },
  };

  return CARD_TONES[mood] || { border: 'rgba(0,0,0,0.06)', glow: 'transparent' };
}

// ── Collaboration Feeling Renderer ──────────────────────────────
// Zeigt wie eine Zusammenarbeit sich anfühlen könnte
export function renderCollaborationFeeling(presence, name = '') {
  if (!presence?.collaboration) return null;

  const { style, pacing, communicationTexture } = presence.collaboration;
  if (!style) return null;

  return {
    headline: style.label,
    body:     style.description,
    tags:     [
      pacing && `Tempo: ${pacing}`,
      communicationTexture && communicationTexture,
    ].filter(Boolean),
  };
}

// ── Quiet Notification Design ───────────────────────────────────
// Benachrichtigungen ohne Druck
export const QUIET_NOTIFICATION_RULES = {
  // Was NICHT gezeigt wird
  suppress: [
    'x_liked_your_work',        // Kein Like-Alarm
    'x_followed_you',           // Kein Follow-Alarm
    'new_view_on_profile',      // Kein View-Alarm
    'x_saved_your_work',        // Kein Save-Alarm
  ],
  // Was gezeigt wird (bedeutsam)
  show: [
    'new_booking_request',      // Buchungsanfrage — wichtig
    'booking_confirmed',        // Bestätigung — wichtig
    'new_recommendation',       // Empfehlung — bedeutsam
    'collab_message',           // Nachricht im Kontext — relevant
    'project_space_update',     // Project-Space-Aktivität
  ],
  // Timing — keine sofortigen Push-Benachrichtigungen für alles
  batching: {
    likes_saves: 'never',       // Nie
    follows:     'never',       // Nie (einzeln)
    messages:    'immediate',   // Sofort — wichtig
    bookings:    'immediate',   // Sofort — wichtig
    summaries:   'daily',       // Tägliche ruhige Zusammenfassung
  },
};
