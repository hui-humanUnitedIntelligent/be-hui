// ══════════════════════════════════════════════════════════
// src/lib/otaUpdate.js — OTA Update System v2 (2026-08-08)
// ══════════════════════════════════════════════════════════
// Over-the-Air Updates für JS/CSS/HTML Änderungen.
// Neue Web-Bundles werden im Hintergrund heruntergeladen und
// beim nächsten App-Start angewendet — KEINE APK-Neuinstallation nötig.
//
// ARCHITEKTUR (v2):
// - autoUpdate: false im native Plugin (kein unkontrolliertes Download)
// - initOTA(): notifyAppReady() — MUSS als Erstes nach Start gerufen werden
// - autoCheckOTA(): Background-Check nach 3s Verzögerung (nicht blockierend)
//   → Vergleicht serverVersion > APP_VERSION (unsere eigene Logik)
//   → Wenn neuer: Download im Hintergrund + "Update bereit" Event
//   → Beim nächsten Start aktiv (kein mid-session reload!)
// - checkForUpdate(): Manueller Check für Settings-Button
//
// WORKFLOW:
// 1. release.sh patch → Version 1.4.7 → APK gebaut, bundle.zip + app-version.json auf Vercel
// 2. Nutzer startet App (v1.4.7) → autoCheckOTA nach 3s
// 3. Server sagt v1.4.8 → compareVersions(1.4.8, 1.4.7) > 0 → TRUE
// 4. Download bundle.zip im Hintergrund → CapacitorUpdater.set()
// 5. Kleines Banner: "Update v1.4.8 bereit — wird beim nächsten Start aktiv"
// 6. Nutzer schließt App, öffnet wieder → v1.4.8 ist aktiv
//
// app-version.json Format (wird von generate-ota-bundle.sh generiert):
// { "version": "1.4.7", "url": "https://be-hui.vercel.app/bundle.zip", "checksum": "..." }
// ══════════════════════════════════════════════════════════

import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { APP_VERSION } from "../version.js";

const UPDATE_URL = "https://be-hui.vercel.app/app-version.json";

// ── 1. initOTA — MUSS als Erstes nach App-Start gerufen werden ──
// Sagt dem Plugin: "Diese Version lebt, kein Rollback nötig."
// Nach 3 Crashes ohne notifyAppReady → automatischer Rollback.
export async function initOTA() {
  if (!Capacitor.isNativePlatform()) {
    console.log("[OTA] Web-Plattform — OTA nicht nötig");
    return { available: false, current: APP_VERSION };
  }

  try {
    await CapacitorUpdater.notifyAppReady();
    console.log("[OTA] notifyAppReady gesendet — Version", APP_VERSION, "ist stabil");

    const current = await CapacitorUpdater.current();
    console.log("[OTA] Aktuelles Bundle:", current.bundle?.version || APP_VERSION);

    return { available: false, current: APP_VERSION, bundleId: current.bundle?.id };
  } catch (err) {
    console.error("[OTA] notifyAppReady fehlgeschlagen:", err);
    return { available: false, current: APP_VERSION, error: err?.message };
  }
}

// ── 2. autoCheckOTA — Automatischer Background-Check nach App-Start ──
// Läuft nach 3s Verzögerung (UI ist bereits gerendert).
// Blockiert NICHT den App-Start. Lädt nur herunter wenn serverVersion > APP_VERSION.
// Dispatched CustomEvent 'ota:update-ready' wenn ein Update heruntergeladen wurde.
export async function autoCheckOTA() {
  if (!Capacitor.isNativePlatform()) return;

  // 3s Verzögerung — UI zuerst rendern lassen
  await new Promise(r => setTimeout(r, 3000));

  try {
    const resp = await fetch(UPDATE_URL, { cache: "no-store" });
    if (!resp.ok) {
      console.log("[OTA] Auto-Check: Server nicht erreichbar");
      return;
    }
    const data = await resp.json();
    const serverVersion = data.version;
    const bundleUrl = data.url;

    if (!serverVersion || !bundleUrl) {
      console.log("[OTA] Auto-Check: Ungültige Antwort");
      return;
    }

    // KRITISCH: Nur herunterladen wenn serverVersion > APP_VERSION
    // (nicht >=, nicht == — nur strikt größer)
    const isNewer = compareVersions(serverVersion, APP_VERSION) > 0;

    if (!isNewer) {
      console.log("[OTA] Auto-Check: Aktuell — App:", APP_VERSION, "Server:", serverVersion);
      return;
    }

    console.log("[OTA] Auto-Check: Update gefunden! Server:", serverVersion, "Aktuell:", APP_VERSION);

    // Download im Hintergrund
    const update = await CapacitorUpdater.download({
      url: bundleUrl,
      version: serverVersion,
    });

    // Set als aktives Bundle für den nächsten Start
    await CapacitorUpdater.set({ id: update.id });

    console.log("[OTA] Update v" + serverVersion + " heruntergeladen — aktiv beim nächsten Start");

    // UI informieren (InAppNotificationBanner oder ähnliches kann darauf hören)
    window.dispatchEvent(new CustomEvent("ota:update-ready", {
      detail: { version: serverVersion, current: APP_VERSION }
    }));
  } catch (err) {
    console.error("[OTA] Auto-Check fehlgeschlagen:", err);
  }
}

// ── 3. Manuelles Update-Check — für Settings "Nach Updates suchen" ──
export async function checkForUpdate() {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, reason: "web", current: APP_VERSION };
  }

  try {
    const resp = await fetch(UPDATE_URL, { cache: "no-store" });
    if (!resp.ok) {
      return { available: false, reason: "server_unreachable", current: APP_VERSION };
    }
    const data = await resp.json();
    const serverVersion = data.version;
    const bundleUrl = data.url;

    if (!serverVersion || !bundleUrl) {
      return { available: false, reason: "invalid_response", current: APP_VERSION };
    }

    const isNewer = compareVersions(serverVersion, APP_VERSION) > 0;

    if (!isNewer) {
      return { available: false, current: APP_VERSION, latest: serverVersion };
    }

    const update = await CapacitorUpdater.download({
      url: bundleUrl,
      version: serverVersion,
    });

    await CapacitorUpdater.set({ id: update.id });

    return {
      available: true,
      downloaded: true,
      current: APP_VERSION,
      latest: serverVersion,
      bundleId: update.id,
      message: "Update v" + serverVersion + " heruntergeladen — wird beim nächsten Start aktiv.",
    };
  } catch (err) {
    console.error("[OTA] Update-Check fehlgeschlagen:", err);
    return {
      available: false,
      current: APP_VERSION,
      error: err?.message || "Unbekannter Fehler",
    };
  }
}

// ── 4. Versions-Vergleich (semver) ──
// Gibt zurück: 1 wenn a > b, -1 wenn a < b, 0 wenn gleich
function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

// ── 5. Rollback (Notfall) ──
export async function rollbackToBuiltin() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.reset();
    console.log("[OTA] Rollback zum eingebauten Bundle");
  } catch (err) {
    console.error("[OTA] Rollback fehlgeschlagen:", err);
  }
}

// ── 6. Status abrufen ──
export async function getOTAStatus() {
  if (!Capacitor.isNativePlatform()) {
    return { current: APP_VERSION, native: false };
  }
  try {
    const current = await CapacitorUpdater.current();
    const latest = await CapacitorUpdater.getLatest();
    return {
      current: current.bundle?.version || APP_VERSION,
      latest: latest?.version || APP_VERSION,
      native: true,
      bundleId: current.bundle?.id,
    };
  } catch (err) {
    return { current: APP_VERSION, native: true, error: err?.message };
  }
}
