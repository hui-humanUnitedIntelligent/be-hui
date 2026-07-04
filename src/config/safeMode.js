// src/config/safeMode.js
// ═══════════════════════════════════════════════════════════════
// HUI SAFE MODE — Production Runtime Isolation
//
// ZWECK:
//   Cinematic/Visual-Systeme einzeln ein- und ausschalten,
//   um den exakten Crash-Verursacher zu isolieren.
//
// WORKFLOW:
//   1. Alle cinematic Flags auf false → App muss stabil laufen
//   2. Flags einzeln auf true setzen + deploy
//   3. Sobald Crash zurückkommt → letztes Flag ist der Täter
//
// REGEL:
//   Shell, Navigation, Feed, Onboarding = IMMER true
//   Cinematic-Layer starten auf false
//
// ═══════════════════════════════════════════════════════════════

export const SAFE_MODE = {
  // Shell & Navigation — NIEMALS ausschalten
  huiBottomNavigation: true,
  homeShell:     true,
  hero:          true,

  // Feed & Content — Kern-UX
  homeFeed:      true,
  discoverFeed:  true,
  impactPage:    true,
  creatorProfile: true,
  onboarding:    true,

  // Cinematic Layer — isoliert deaktivierbar
  orb:           true,    // Phase 15.3: FIXED — was false → Ghost State
  particles:     true,    // Phase 15.3: re-enabled (orb depends on this)
  ambient:       true,    // Phase 15.3: re-enabled (orb atmosphere)
  motion:        false,

  // Overlay-Systeme — bei Bedarf isolierbar
  matchOverlay:  true,
  chatCenter:    true,
  storyViewer:   true,
  notifications: true,
  membership:    true,
  liveMap:       true,
  connectFlow:   true,
  createFlow:    true,
  werkFlow:      true,
  experienceFlow:true,
  impactFlow:    true,
  teilenFlow:    true,
  storyComposer: true,
  talentFlow:    true,
};

// Debug Log beim Start
const disabled = Object.entries(SAFE_MODE).filter(([,v]) => !v).map(([k]) => k);
if (disabled.length > 0) {
  console.warn('[HUI SafeMode] SAFE MODE AKTIV — deaktivierte Systeme:', disabled.join(', '));
} else {
  console.info('[HUI SafeMode] Alle Systeme aktiv — Full Mode');
}

export default SAFE_MODE;
