// ══════════════════════════════════════════════════════════
// src/lib/otaUpdate.js — OTA Update System v3 (2026-08-20)
// ══════════════════════════════════════════════════════════
// Over-the-Air Updates für JS/CSS/HTML Änderungen.
//
// ROOT-CAUSE-FIX (2026-08-20, OTA-UPDATE-LOOP-001):
// capacitor.config.json hat "CapacitorUpdater.autoUpdate: true" gesetzt.
// Laut offizieller Capgo-Doku (https://capgo.app/docs/plugins/updater/settings/,
// https://github.com/Cap-go/capacitor-updater) bedeutet autoUpdate:true:
// Das native Plugin lädt und setzt neue Bundles VOLLSTÄNDIG SELBST — auf
// Basis von updateUrl im capacitor.config.json. Der offizielle "manuelle"
// Modus (eigener JS-Code ruft CapacitorUpdater.download()/.set() auf) ist
// NUR für autoUpdate:false vorgesehen ("Manually control the entire update
// process — set autoUpdate to false").
//
// Vorher liefen HIER GLEICHZEITIG drei Update-Pfade:
// 1. Nativer Plugin-Auto-Update (capacitor.config.json autoUpdate:true)
// 2. autoCheckOTA() — JS-Code rief ZUSÄTZLICH manuell download()+set() auf
// 3. OTAUpdatePopup.jsx installNow() — rief bei Tap NOCHMAL download()+set() auf
//
// Diese Doppel/Dreifach-Steuerung hat denselben nativen Update-Storage
// gleichzeitig beschrieben → Race Condition. Symptom (bestätigt von Michael,
// 2026-08-20): App blieb dauerhaft auf v2.1.310 hängen, obwohl der Server
// bereits v2.1.313 auslieferte — das Plugin fiel nach der korrupten
// Doppel-Installation auf das letzte saubere "known good" Bundle zurück.
//
// FIX: JS-seitiges manuelles download()/set() komplett entfernt. Die
// Bundle-Verwaltung (Download, Set, Rollback-Schutz) liegt jetzt exklusiv
// beim nativen Plugin (autoUpdate:true). JS ruft NUR NOCH notifyAppReady()
// (Pflicht — sonst Rollback nach 3 Crashes) und liest optional den Status
// für die Settings-Anzeige (rein informativ, keine Bundle-Mutation mehr).
// ══════════════════════════════════════════════════════════

import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { APP_VERSION } from "../version.js";

const UPDATE_URL = "https://be-hui.vercel.app/app-version.json";

// ── 1. initOTA — MUSS als Erstes nach App-Start gerufen werden ──
// Sagt dem Plugin: "Diese Version lebt, kein Rollback nötig."
// Nach 3 Crashes ohne notifyAppReady → automatischer Rollback.
// UNVERÄNDERT KRITISCH — bleibt der einzige Pflicht-Call.
export async function initOTA() {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, current: APP_VERSION };
  }

  try {
    await CapacitorUpdater.notifyAppReady();

    const current = await CapacitorUpdater.current();

    return { available: false, current: APP_VERSION, bundleId: current.bundle?.id };
  } catch (err) {
    console.error("[OTA] notifyAppReady fehlgeschlagen:", err);
    return { available: false, current: APP_VERSION, error: err?.message };
  }
}

// ── 2. checkForUpdateInfo — REIN INFORMATIV für Settings-Anzeige ──
// Liest NUR app-version.json + native Plugin-Status. Löst NIE mehr
// download()/set() aus (das übernimmt jetzt exklusiv autoUpdate:true).
// Zeigt an, ob der Server eine neuere Version hat, informiert den Nutzer
// aber, dass die Installation automatisch im Hintergrund läuft.
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

// Rückwärtskompatibler Alias für bestehende Aufrufer (SettingsModal.jsx) —
// gleiche Signatur wie vorher, aber ohne Bundle-Mutation.
export const checkForUpdate = checkForUpdateInfo;

// ── 3. Versions-Vergleich (semver) ──
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

// ── 4. Rollback (Notfall) ──
export async function rollbackToBuiltin() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.reset();
  } catch (err) {
    console.error("[OTA] Rollback fehlgeschlagen:", err);
  }
}

// ── 5. Status abrufen (informativ, keine Mutation) ──
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
