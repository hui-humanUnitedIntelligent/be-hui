// src/lib/deviceTier.js
// HUI Device-Tier-Detection — bestimmt Geräte-Performance-Klasse
// Wird beim App-Start einmalig ausgewertet.

// Tier-Werte: "low" | "mid" | "high"
let _tier = null;

export function getDeviceTier() {
  if (_tier) return _tier;

  // Hardware Concurrency (CPU-Kerne)
  const cores = navigator.hardwareConcurrency || 2;
  
  // Speicher (nur Chrome)
  const memGb = navigator.deviceMemory || 4;

  // Verbindung (nur Chrome)
  const conn = navigator.connection;
  const isSlowNetwork = conn && (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g");

  // Reduzierten Modus (Accessibility-Setting)
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced || isSlowNetwork || cores <= 2 || memGb <= 2) {
    _tier = "low";
  } else if (cores >= 6 && memGb >= 6) {
    _tier = "high";
  } else {
    _tier = "mid";
  }

  if (import.meta.env.DEV) {
    console.debug(`[HUI DeviceTier] cores=${cores} mem=${memGb}GB tier=${_tier}`);
  }

  return _tier;
}

export function isLowEndDevice() { return getDeviceTier() === "low"; }
export function isHighEndDevice() { return getDeviceTier() === "high"; }

// Gibt optimale Pagination-Größe für das Gerät zurück
export function getOptimalPageSize(defaultSize = 12) {
  const tier = getDeviceTier();
  if (tier === "low")  return Math.min(defaultSize, 6);
  if (tier === "high") return Math.min(defaultSize * 2, 24);
  return defaultSize;
}
