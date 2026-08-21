// ══════════════════════════════════════════════════════════
// src/lib/otaUpdate.js — OTA Update System v4 (2026-08-21)
// ══════════════════════════════════════════════════════════
// Over-the-Air Updates für JS/CSS/HTML Änderungen.
//
// HYBRID-MODELL (v4, 2026-08-21):
// v3 hatte den JS-seitigen download()/set() komplett entfernt und sich
// ausschließlich auf autoUpdate:true im native Plugin verlassen. ABER:
// Michaels Phone hat einen alten APK (gebaut vor Aug 18, als autoUpdate
// noch false war). v2.1.313 OTA hat die v3-JS-Code geladen → kein
// manueller download/set mehr → native autoUpdate=false → NICHTS zieht.
//
// v4 FIX: autoCheckOTA() WIEDERHERGESTELLT als JS-Fallback.
// - Wenn native autoUpdate:true → Plugin macht es selbst, JS-Check ist
//   idempotent (current bundle == server version → skip)
// - Wenn native autoUpdate:false (alte APKs) → JS macht download()+set()
// - Race-Condition-Schutz: vor download() prüfen ob current bundle
//   bereits die server version hat → skip
// ══════════════════════════════════════════════════════════

import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { APP_VERSION } from "../version.js";

const UPDATE_URL = "https://be-hui.vercel.app/app-version.json";

// ── 1. initOTA — Initialisiert Plugin, aber KEIN notifyAppReady! ──
// OTA v5 CRASH-RECOVERY (2026-08-21):
// notifyAppReady() wird NICHT mehr hier gerufen — stattdessen in
// confirmAppReady() nach erfolgreichem React-Render (siehe App.jsx useEffect).
// Grund: Wenn notifyAppReady() VOR React-Render gerufen wird und React
// crasht → Plugin denkt "Version ist stabil" → kein Rollback → White-Screen-Loop.
// Mit v5: React crash → useEffect läuft nie → kein notifyAppReady →
// Plugin rollt nach 3 Crashes automatisch zur letzten funktionierenden Version zurück.
export async function initOTA() {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, current: APP_VERSION };
  }

  try {
    // NUR Plugin initialisieren — KEIN notifyAppReady!
    const current = await CapacitorUpdater.current();
    return { available: false, current: APP_VERSION, bundleId: current.bundle?.id };
  } catch (err) {
    console.error("[OTA] Init fehlgeschlagen:", err);
    return { available: false, current: APP_VERSION, error: err?.message };
  }
}

// ── 1b. confirmAppReady — ERST nach erfolgreichem React-Render rufen! ──
// Wird aus App.jsx useEffect nach erstem Render gerufen.
// Sagt dem Plugin: "React lebt, kein Rollback nötig."
export async function confirmAppReady() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await CapacitorUpdater.notifyAppReady();
  } catch (err) {
    console.error("[OTA] confirmAppReady fehlgeschlagen:", err);
  }
}

// ── 2. autoCheckOTA — Automatischer Background-Check nach App-Start ──
// Läuft nach 3s Verzögerung (UI ist bereits gerendert).
// Blockiert NICHT den App-Start. Lädt nur herunter wenn serverVersion > APP_VERSION.
// Race-Condition-Schutz: prüft current bundle — wenn bereits aktualisiert, skip.
// Dispatched CustomEvent 'ota:update-ready' wenn ein Update heruntergeladen wurde.
export async function autoCheckOTA() {
  if (!Capacitor.isNativePlatform()) return;

  // 3s Verzögerung — UI zuerst rendern lassen
  await new Promise(r => setTimeout(r, 3000));

  try {
    const resp = await fetch(UPDATE_URL, { cache: "no-store" });
    if (!resp.ok) {
      return;
    }
    const data = await resp.json();
    const serverVersion = data.version;
    const bundleUrl = data.url;

    if (!serverVersion || !bundleUrl) {
      return;
    }

    // KRITISCH: Nur herunterladen wenn serverVersion > APP_VERSION
    const isNewer = compareVersions(serverVersion, APP_VERSION) > 0;

    if (!isNewer) {
      return;
    }

    // RACE-CONDITION-SCHUTZ: Prüfe ob das native Plugin (autoUpdate:true)
    // das Bundle bereits heruntergeladen+gesetzt hat.
    // Wenn current bundle version == serverVersion → Plugin war schneller → skip
    try {
      const currentBundle = await CapacitorUpdater.current();
      const activeVersion = currentBundle?.bundle?.version;
      if (activeVersion && compareVersions(activeVersion, serverVersion) >= 0) {
        // Native Plugin hat bereits aktualisiert — nichts zu tun
        return;
      }
    } catch (e) {
      // current() fehlgeschlagen → weiter mit manuellem Download
    }

    // Download im Hintergrund
    const update = await CapacitorUpdater.download({
      url: bundleUrl,
      version: serverVersion,
    });

    // Set als aktives Bundle für den nächsten Start
    await CapacitorUpdater.set({ id: update.id });

    // UI informieren
    window.dispatchEvent(new CustomEvent("ota:update-ready", {
      detail: { version: serverVersion, current: APP_VERSION }
    }));
  } catch (err) {
    console.error("[OTA] Auto-Check fehlgeschlagen:", err);
  }
}

// ── 3. Manuelles Update-Check — für Settings "Nach Updates suchen" ──
// Lädt herunter und setzt das Bundle sofort.
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

    // Race-Condition-Schutz: prüfe current bundle
    try {
      const currentBundle = await CapacitorUpdater.current();
      const activeVersion = currentBundle?.bundle?.version;
      if (activeVersion && compareVersions(activeVersion, serverVersion) >= 0) {
        return {
          available: false,
          current: APP_VERSION,
          latest: serverVersion,
          message: "Update bereits installiert — beim nächsten Start aktiv.",
        };
      }
    } catch (e) {
      // weiter mit Download
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

// ── 4. checkForUpdateInfo — REIN INFORMATIV (ohne Download) ──
// Für Settings-Anzeige: zeigt an ob ein Update verfügbar ist.
export async function checkForUpdateInfo() {
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

    if (!serverVersion) {
      return { available: false, reason: "invalid_response", current: APP_VERSION };
    }

    const isNewer = compareVersions(serverVersion, APP_VERSION) > 0;

    if (!isNewer) {
      return { available: false, current: APP_VERSION, latest: serverVersion };
    }

    return {
      available: true,
      downloaded: false,
      current: APP_VERSION,
      latest: serverVersion,
      message: "Update v" + serverVersion + " verfügbar — wird automatisch im Hintergrund installiert.",
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

// ── 5. Versions-Vergleich (semver) ──
// Gibt zurück: 1 wenn a > b, -1 wenn a < b, 0 wenn gleich
function compareVersions(a, b) {
  const clean = (v) => String(v).replace(/^v/i, "");
  const pa = clean(a).split(".").map(Number);
  const pb = clean(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = Number.isFinite(pa[i]) ? pa[i] : 0;
    const vb = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

// ── 6. Rollback (Notfall) ──
export async function rollbackToBuiltin() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.reset();
  } catch (err) {
    console.error("[OTA] Rollback fehlgeschlagen:", err);
  }
}

// ── 7. Status abrufen (informativ) ──
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
