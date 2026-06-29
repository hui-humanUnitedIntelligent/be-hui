// src/core/hui.pillars.js
// ═══════════════════════════════════════════════════════════════════════
// HUI PILLARS — Re-Export der HUI Registry
//
// Diese Datei war früher die primäre Quelle für Pillar-Definitionen.
// Sie ist jetzt ein sauberer Re-Export der HUI Registry.
//
// Bestehende Imports funktionieren weiterhin ohne Änderung:
//   import { PILLARS, PILLAR_UI, pillarHint, HUI_LANGUAGE } from '../core/hui.pillars.js';
//
// Neue Module sollen direkt aus der Registry importieren:
//   import { HuiRegistry, R, PILLARS, LANG } from '../registry/HuiRegistry.js';
//
// ═══════════════════════════════════════════════════════════════════════

export {
  // Kern-Exports (unverändert)
  PILLARS,
  PILLAR_LIST,

  // Registry
  HuiRegistry,
  R,
  LANG,
  CONTENT_PILLARS,
  ORB_TRAITS,

  // Legacy-Kompatibilität (deprecated aber funktionsfähig)
  PILLAR_UI,
  HUI_LANGUAGE,
  CONTENT_PILLAR_MAP,

  // Helfer-Funktionen
  pillarHint,
  dominantPillarLabels,
  inferPillarFromType,
  projectNeedsLabel,
} from '../registry/HuiRegistry.js';
