// ══════════════════════════════════════════════════════════
// src/lib/otaUpdate.js — OTA Auto-Update System (2026-08-08)
// ══════════════════════════════════════════════════════════
// Nutzt @capgo/capacitor-updater für Over-the-Air Updates.
// Neue Web-Bundles werden automatisch im Hintergrund heruntergeladen
// und beim nächsten App-Start angewendet — KEINE APK-Neuinstallation nötig.
//
// Workflow:
// 1. App-Start → notifyAppReady() (sagt dem Plugin: "Ich lebe, kein Rollback nötig")
// 2. Plugin prüft updateUrl (https://be-hui.vercel.app/app-version.json)
// 3. Wenn neuere Version → Download im Hintergrund → beim nächsten Start aktiv
// 4. Wenn App 3x crasht → automatischer Rollback zum letzten stabilen Bundle
//
// app-version.json Format (wird von release.sh generiert):
// { "version": "1.4.6", "url": "https://be-hui.vercel.app/bundle.zip" }
// ══════════════════════════════════════════════════════════

import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { APP_VERSION } from "../version.js";

// ── 1. notifyAppReady — MUSS als Erstes nach App-Start gerufen werden ──
// Ohne das rollt das Plugin nach 3 Crashes zurück. Sagt: "Diese Version läuft."
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

// ── 2. Manuelles Update-Check — für Settings "Nach Updates suchen" ──
export async function checkForUpdate() {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, reason: "web", current: APP_VERSION };
  }

  try {
    const resp = await fetch("https://be-hui.vercel.app/app-version.json", {
      cache: "no-store",
    });
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

// ── 3. Versions-Vergleich (semver) ──
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

// ── 4. Rollback (Notfall) ──
export async function rollbackToBuiltin() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.reset();
    console.log("[OTA] Rollback zum eingebauten Bundle");
  } catch (err) {
    console.error("[OTA] Rollback fehlgeschlagen:", err);
  }
}

// ── 5. Status abrufen ──
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
