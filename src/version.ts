// ══════════════════════════════════════════════════════════
// src/version.ts — Zentrale App-Versions-Quelle (SSOT)
// ══════════════════════════════════════════════════════════
// Liest die Version DYNAMISCH aus package.json zur Build-Zeit.
// Vite resolved den Import beim Bauen automatisch.
//
// package.json = einzige Quelle der Wahrheit.
// version.sh / release.sh synct build.gradle + strings.xml.
// version.ts braucht NICHT manuell aktualisiert zu werden.
// ══════════════════════════════════════════════════════════

import { version } from '../package.json';

export const APP_VERSION: string = version;

/**
 * Android versionCode — wird von release.sh aus build.gradle synchronisiert.
 * Im Web-Kontext irrelevant, aber für Capacitor/Android-Sync.
 */
export const APP_VERSION_CODE: number = 10;

/**
 * Zentrale Utility-Funktion für die App-Version.
 * Überall verwenden: getAppVersion() statt hardcodierter Strings.
 */
export function getAppVersion(): string {
  return APP_VERSION;
}

/**
 * Formatierte Version für UI-Anzeige, z.B. "v1.0.1"
 */
export function getFormattedVersion(): string {
  return `v${APP_VERSION}`;
}

export default APP_VERSION;
