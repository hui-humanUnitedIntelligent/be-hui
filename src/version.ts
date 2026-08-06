// ══════════════════════════════════════════════════════════
// src/version.ts — Zentrale App-Versions-Quelle (SSOT)
// ══════════════════════════════════════════════════════════
// Liest die Version DYNAMISCH aus package.json zur Build-Zeit.
// Keine hardcodierte Version mehr — Vite resolved den Import
// beim Bauen automatisch.
//
// version.sh setzt nur noch build.gradle + package.json.
// version.ts folgt automatisch — kein manuelles Schreiben nötig.
// ══════════════════════════════════════════════════════════

import { version } from '../package.json';

export const APP_VERSION: string = version;

/**
 * Android versionCode — wird aus build.gradle von version.sh gesetzt.
 * Im Web-Kontext irrelevant, aber für Capacitor/Android-Sync.
 */
export const APP_VERSION_CODE: number = 2;

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
