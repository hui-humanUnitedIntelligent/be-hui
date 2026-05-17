// src/lib/deviceProfile/index.js
// HUI — Device Profile & Mobile Protection — Phase 6B.6
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Erkennt schwache Devices und passt Pipeline-Tiefe an.
// Schwache Devices → weniger Berechnungen → flüssigere UX.
//
// PRINZIP:
// Nicht: "schwache Geräte bekommen schlechtere Inhalte."
// Sondern: "schwache Geräte bekommen gleich gute Inhalte,
//           nur mit weniger Aufwand berechnet."
//
// DEVICE TIERS:
//   POWERFUL:  modernes Gerät, viel RAM → volle Pipeline
//   CAPABLE:   normales Gerät         → Standard Pipeline
//   MODEST:    älteres/schwaches Gerät → reduzierte Pipeline
//   LOW:       sehr schwaches Gerät    → minimale Pipeline
// ═══════════════════════════════════════════════════════════════

/**
 * Erkennt Device-Tier aus verfügbaren Browser-Signals.
 * Alle Checks sind passive, permission-free.
 */
export function detectDeviceTier() {
  const signals = {};

  // 1. Hardware Concurrency (CPU-Kerne)
  signals.cpuCores = navigator.hardwareConcurrency || 2;

  // 2. Device Memory (GB, wenn verfügbar)
  signals.memoryGB = navigator.deviceMemory || null;

  // 3. Connection Type
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  signals.connectionType = conn?.effectiveType || 'unknown';
  signals.saveData       = conn?.saveData || false;

  // 4. Battery (wenn verfügbar) — async, ignorieren wenn nicht
  signals.lowPower = false;  // Wird async gesetzt wenn verfügbar

  // 5. Screen (Proxy für Device-Klasse)
  signals.screenWidth  = window.screen?.width  || 375;
  signals.pixelRatio   = window.devicePixelRatio || 1;
  signals.isMobile     = signals.screenWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  signals.isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Tier-Berechnung
  let points = 0;

  if (signals.cpuCores >= 8)   points += 3;
  else if (signals.cpuCores >= 4) points += 2;
  else if (signals.cpuCores >= 2) points += 1;

  if (signals.memoryGB >= 4)   points += 3;
  else if (signals.memoryGB >= 2) points += 2;
  else if (signals.memoryGB >= 1) points += 1;
  else if (signals.memoryGB === null) points += 1;  // Unbekannt → neutral

  if (signals.connectionType === '4g')    points += 2;
  else if (signals.connectionType === '3g') points += 1;
  else if (signals.connectionType === '2g') points -= 1;

  if (signals.saveData) points -= 2;

  const tier =
    points >= 7 ? 'POWERFUL' :
    points >= 4 ? 'CAPABLE'  :
    points >= 2 ? 'MODEST'   :
                  'LOW';

  return { tier, signals, points };
}

// ── Pipeline-Konfiguration per Tier ──────────────────────────

const PIPELINE_CONFIGS = {
  POWERFUL: {
    candidateLimit:    40,   // Viele Kandidaten → präziseres Ranking
    graphDepth:       'full',
    healthPasses:     'full',
    workerEnabled:    true,
    cacheAggressive:  false,
    maxFeedItems:     18,
    description:      'Vollständige Pipeline',
  },
  CAPABLE: {
    candidateLimit:   30,
    graphDepth:       'standard',
    healthPasses:     'full',
    workerEnabled:    true,
    cacheAggressive:  false,
    maxFeedItems:     16,
    description:      'Standard Pipeline',
  },
  MODEST: {
    candidateLimit:   20,   // Weniger Kandidaten → weniger Berechnungen
    graphDepth:       'basic',
    healthPasses:     'basic',
    workerEnabled:    false,  // Worker-Overhead vermeiden
    cacheAggressive:  true,   // Aggressiver cachen
    maxFeedItems:     12,
    description:      'Reduzierte Pipeline (Mobile-Schutz)',
  },
  LOW: {
    candidateLimit:   12,
    graphDepth:       'none',  // Kein Graph
    healthPasses:     'none',  // Kein Health-Pass
    workerEnabled:    false,
    cacheAggressive:  true,
    maxFeedItems:     8,
    description:      'Minimale Pipeline (Low-Power-Modus)',
  },
};

export function getPipelineConfig(tier = null) {
  const { tier: detected } = tier ? { tier } : detectDeviceTier();
  return PIPELINE_CONFIGS[detected] || PIPELINE_CONFIGS.CAPABLE;
}

// ── Low Power Mode (Battery API) ──────────────────────────────

let _batteryLow = false;

if (navigator.getBattery) {
  navigator.getBattery().then(battery => {
    _batteryLow = battery.level < 0.15 && !battery.charging;
    battery.addEventListener('levelchange', () => {
      _batteryLow = battery.level < 0.15 && !battery.charging;
    });
    battery.addEventListener('chargingchange', () => {
      _batteryLow = battery.level < 0.15 && !battery.charging;
    });
  }).catch(() => {});
}

export function isBatteryLow() { return _batteryLow; }

// ── Hook: useDeviceProfile ────────────────────────────────────

import { useMemo } from 'react';

export function useDeviceProfile() {
  return useMemo(() => {
    const { tier, signals } = detectDeviceTier();
    const config = getPipelineConfig(tier);
    const batteryLow = isBatteryLow();

    // Extra-Reduktion bei Low Power
    if (batteryLow && tier !== 'LOW') {
      return {
        tier:   'MODEST',
        signals,
        config: PIPELINE_CONFIGS.MODEST,
        batteryLow: true,
        isMobile: signals.isMobile,
      };
    }

    return { tier, signals, config, batteryLow: false, isMobile: signals.isMobile };
  }, []);
}
