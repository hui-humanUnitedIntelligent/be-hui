// src/lib/calendarExport.js — KAL-001 (2026-08-17)
// Exportiert einen Termin (Talent-Buchung / Erlebnis) als .ics-Datei, die sowohl
// Google Kalender als auch Apple Kalender per "Öffnen mit"/Share-Sheet importieren
// können. Kein Google/Apple-spezifischer Code nötig — das .ics-Format (RFC 5545)
// wird von beiden nativ unterstützt, das Betriebssystem entscheidet welche App
// die Datei öffnet.
//
// Muster 1:1 übernommen von generateReceipt.js (BELEG-004/006/007):
// - registerPlugin() statt npm-Import (vite.config.js externalisiert @capacitor/*,
//   ein bare-module-specifier "@capacitor/filesystem" würde im WebView zur Laufzeit
//   nicht aufgelöst werden können).
// - isFilesystemPluginAvailable() Check VOR dem Schreibversuch — kein alarmierender
//   Fehler-Toast, wenn das native Plugin auf diesem Gerät nicht registriert ist,
//   sondern stiller Fallback auf Blob-Download.
// - "Share canceled" (Nutzer wischt Share-Sheet weg) ist KEIN Fehler.

import { toast } from "./useToast.jsx";
import { registerPlugin } from "@capacitor/core";

const Filesystem = registerPlugin("Filesystem", {});
const Share = registerPlugin("Share", {});
const DIRECTORY_CACHE = "CACHE";

function isNative() {
  try {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch {
    return false;
  }
}

function isFilesystemPluginAvailable() {
  try {
    return !!(
      window.Capacitor &&
      typeof window.Capacitor.isPluginAvailable === "function" &&
      window.Capacitor.isPluginAvailable("Filesystem")
    );
  } catch {
    return false;
  }
}

// ── ICS-Hilfsfunktionen ──────────────────────────────────────────

// RFC 5545: Sonderzeichen escapen (Komma, Semikolon, Backslash, Zeilenumbruch)
function icsEscape(str) {
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Formatiert ein Date-Objekt als UTC "YYYYMMDDTHHMMSSZ" (RFC 5545)
function icsDateUTC(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

// Zerlegt "13:00" / "13:00-14:00" / "13:00 Uhr" in Start-Stunden/Minuten
function parseTimeSlot(timeSlot) {
  if (!timeSlot) return { h: 10, m: 0 }; // Default: 10:00, falls keine Uhrzeit vorhanden
  const str = typeof timeSlot === "string" ? timeSlot : (timeSlot.start || timeSlot.label || "");
  const match = String(str).match(/(\d{1,2}):(\d{2})/);
  if (match) return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
  return { h: 10, m: 0 };
}

/**
 * Baut den .ics-Dateiinhalt für einen HUI-Termin (Talent-Buchung oder Erlebnis).
 * @param {object} app - { title, date, timeSlot, durationMinutes, location, otherName, type }
 */
export function buildICSContent(app) {
  const { h, m } = parseTimeSlot(app.timeSlot);
  const startDate = new Date(app.date + "T00:00:00");
  startDate.setHours(h, m, 0, 0);

  const durationMin = app.durationMinutes && Number(app.durationMinutes) > 0 ? Number(app.durationMinutes) : 60;
  const endDate = new Date(startDate.getTime() + durationMin * 60000);

  const uid = "hui-" + (app.id || Date.now()) + "@hui.app";
  const now = new Date();
  const summary = icsEscape(app.title || "HUI Termin");
  const descriptionParts = [];
  if (app.type) descriptionParts.push(app.type);
  if (app.otherName) descriptionParts.push("mit " + app.otherName);
  descriptionParts.push("Gebucht über HUI (Human United Intelligence)");
  const description = icsEscape(descriptionParts.join(" — "));
  const location = icsEscape(app.location || "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HUI//HUI App//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTAMP:" + icsDateUTC(now),
    "DTSTART:" + icsDateUTC(startDate),
    "DTEND:" + icsDateUTC(endDate),
    "SUMMARY:" + summary,
    "DESCRIPTION:" + description,
  ];
  if (location) lines.push("LOCATION:" + location);
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");

  // RFC 5545 verlangt CRLF-Zeilenumbrüche
  return lines.join("\r\n");
}

function blobDownloadFallback(icsContent, fileName) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Exportiert einen Termin in den Kalender des Nutzers (Google Kalender / Apple
 * Kalender / jede andere .ics-fähige Kalender-App — das Betriebssystem entscheidet).
 * Native (Android/iOS): schreibt .ics in den Cache und öffnet das Share-Sheet
 * ("Öffnen mit" → Kalender-App wählen). Web: normaler Blob-Download.
 */
export async function exportAppointmentToCalendar(app) {
  const icsContent = buildICSContent(app);
  const safeTitle = String(app.title || "termin").replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, "").trim().replace(/\s+/g, "_") || "termin";
  const fileName = `hui_${safeTitle}_${app.date || "termin"}.ics`;

  if (!isNative()) {
    try {
      blobDownloadFallback(icsContent, fileName);
      toast.success("Termin als Kalenderdatei heruntergeladen.");
    } catch (err) {
      console.error("[calendarExport] Web-Download fehlgeschlagen:", err);
      toast.error("Termin konnte nicht exportiert werden.");
    }
    return;
  }

  if (!isFilesystemPluginAvailable()) {
    console.warn("[calendarExport] Filesystem-Plugin nicht registriert — nutze Download-Fallback.");
    try {
      blobDownloadFallback(icsContent, fileName);
      toast.success("Termin als Kalenderdatei heruntergeladen.");
    } catch (err) {
      console.error("[calendarExport] Fallback fehlgeschlagen:", err);
      toast.error("Termin konnte nicht exportiert werden.");
    }
    return;
  }

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: icsContent,
      directory: DIRECTORY_CACHE,
      encoding: "utf8",
      recursive: true,
    });

    const uriResult = await Filesystem.getUri({
      directory: DIRECTORY_CACHE,
      path: fileName,
    });

    await Share.share({
      title: "Termin zum Kalender hinzufügen",
      text: app.title || "HUI Termin",
      url: uriResult.uri,
      dialogTitle: "Mit Kalender-App öffnen",
    });
  } catch (err) {
    const msg = (err && (err.message || err.errorMessage)) ? String(err.message || err.errorMessage).toLowerCase() : "";
    // Nutzer-Abbruch (Share-Sheet weggewischt) ist kein Fehler.
    if (msg.includes("cancel")) return;
    console.error("[calendarExport] Native Export fehlgeschlagen:", err);
    try {
      blobDownloadFallback(icsContent, fileName);
      toast.warn("Direkter Kalender-Export fehlgeschlagen. Download-Fallback genutzt.");
    } catch (err2) {
      console.error("[calendarExport] Fallback auch fehlgeschlagen:", err2);
      toast.error("Termin konnte nicht in den Kalender exportiert werden.");
    }
  }
}
