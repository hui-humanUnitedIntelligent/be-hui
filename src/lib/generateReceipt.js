import { formatDateDE } from "./formatters.js";
import { toast } from "./useToast.jsx";
import { registerPlugin } from "@capacitor/core";

// BELEG-004 (2026-08-14): Wir importieren @capacitor/filesystem und @capacitor/share
// NICHT als npm-Paket. In vite.config.js sind beide Pakete bewusst als
// `rollupOptions.external` markiert (gleicher Grund wie bei push-notifications/app —
// siehe pushNotificationService.js) — das führt dazu, dass ein `import("@capacitor/filesystem")`
// im ausgelieferten Bundle ALS LITERALER bare-module-specifier stehen bleibt, den der
// Android-WebView zur Laufzeit nicht auflösen kann:
//   "Failed to resolve module specifier '@capacitor/filesystem'"
// Das war der ECHTE Root Cause hinter dem gesamten Beleg-Download-Problem (BELEG-002/003
// haben nur Symptome behoben, nie die eigentliche Fehlerursache). Fix: registerPlugin()
// aus @capacitor/core nutzen — exakt das Muster, das @capacitor/filesystem/share intern
// selbst verwenden, nur ohne den npm-Paket-Import. @capacitor/core wird überall im Projekt
// bereits normal gebündelt, also kein Resolve-Fehler.
const Filesystem = registerPlugin("Filesystem", {});
const Share = registerPlugin("Share", {});
// Directory-Enum-Werte von Capacitor (string constants, siehe
// node_modules/@capacitor/filesystem/dist/esm/definitions.js)
// BELEG-006 (2026-08-14): EXTERNAL statt CACHE -- Michael will den Beleg DAUERHAFT
// lokal auf dem Handy haben. CACHE (getExternalCacheDir()) kann vom Android-System
// JEDERZEIT automatisch geleert werden (Speicherplatz-Druck) -- fuer einen Beleg, den
// man spaeter wiederfinden soll, ist das semantisch falsch. EXTERNAL (getExternalFilesDir(null))
// bleibt bis zur App-Deinstallation erhalten, braucht keine Laufzeit-Berechtigung (App-
// scoped external storage) und ist bereits in file_paths.xml als <external-path> deklariert
// (FileProvider-Voraussetzung, seit 2026-07-09 im APK -- kein Reinstall noetig).
const DIRECTORY_EXTERNAL = "EXTERNAL";
// src/lib/generateReceipt.js — BELEG-001 (2026-08-11) + BELEG-002 (2026-08-14)
// Generiert einen PDF-Beleg (Wirkungsbeleg / Beitragsnachweis) fuer Talent-Buchungen,
// Erlebnis-Buchungen UND Werk-Kaeufe (offerType: "talent" | "experience" | "werk").
// Desktop: doc.save() (Browser-Download)
// Android (Capacitor): Filesystem.writeFile → Share Sheet (Downloads/Teilen)
// iOS (Capacitor): Filesystem.writeFile → Share Sheet (Teilen/Speichern)
//
// BELEG-002 (2026-08-14): Michael meldete "Beleg-Download geht auf dem Handy nicht".
// Root Cause: Alle Fehler wurden bisher nur mit console.warn() verschluckt — auf dem
// Handy sieht man KEINE console.warn(). Wenn Filesystem/Share auf einem bestimmten
// Geraet/Android-Version fehlschlug, passierte für den Nutzer optisch schlicht NICHTS.
// Fix: (1) toast.info() sofort bei Klick (native), damit sichtbar ist dass etwas passiert.
// (2) toast.error() bei jedem Fehlschlag (inkl. Fallback-Fehlschlag) — nie mehr stiller Fail.
// (3) Directory.Cache statt Directory.Documents — zuverlässiger für "Datei erzeugen und
//     sofort teilen"-Flow, kein Abhängigkeit von Documents-Verzeichnis-Semantik auf Android.

let _isNative = null;
function isNative() {
  if (_isNative !== null) return _isNative;
  try {
    _isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch { _isNative = false; }
  return _isNative;
}

// BELEG-007 (2026-08-15): Nutzer-Report — orangene Fehlermeldung "Speichern
// fehlgeschlagen (\"Filesystem\" plugin is not implemented on android)" beim
// Beleg-Download im Talent-Profil, trotz vorheriger BELEG-004-Fixes. Root Cause:
// dieser exakte Fehlertext kommt AUSSCHLIESSLICH aus @capacitor/core's generischem
// registerPlugin()-Proxy, wenn `window.Capacitor.PluginHeaders` (vom nativen Bridge
// beim App-Start injiziert) KEINEN Eintrag fuer "Filesystem" enthaelt — d.h. der
// gerade installierte native Android-Shell hat die Filesystem-Plugin-Klasse zur
// Laufzeit nicht registriert (unabhaengig davon ob der JS-Code korrekt ist).
// Das kann nach jedem OTA-Update passieren, bei dem der Nutzer eine AELTERE APK
// installiert hat, ODER wenn die Bridge aus irgendeinem Grund die Registrierung
// verpasst hat — OTA kann das NICHT nachtraeglich fixen (native Plugin-Registrierung
// ist Java-Bridge-Zustand, kein WWW-Bundle-Inhalt).
// FIX: Verfuegbarkeit proaktiv PRUEFEN statt blind zu versuchen + Fehler zu fangen.
// Ist Filesystem nicht verfuegbar, wird direkt (ohne Zwischen-Fehlversuch und ohne
// alarmierende orangene Fehler-Toast) der Blob-Download-Fallback genutzt — der
// funktioniert unabhaengig vom Capacitor-Plugin-Status und liefert dem Nutzer die
// Datei trotzdem zuverlaessig aus.
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

export async function generateReceipt(data) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const W = 210;
    const M = 20;
    let y = 20;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(14, 196, 184);
    doc.text("HUI", M, y);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Human United Intelligence", M + 14, y - 1);
    y += 6;
    doc.setDrawColor(14, 196, 184);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 10;

    // Titel
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(26, 26, 26);
    // BELEG-001: "Beleg" statt "Quittung" + Untertitel
    var docTitle = data.offerType === "werk" ? "Beitragsnachweis" : "Dein Wirkungsbeleg";
    doc.text(docTitle, M, y);
    y += 7;

    // Buchungs-ID + Datum
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const now = new Date();
    const dateStr = formatDateDE(now, { day: "2-digit", month: "long", year: "numeric" });
    doc.text("Erstellt am: " + dateStr, M, y);
    if (data.bookingId) {
      doc.text("Buchungs-ID: " + String(data.bookingId).substring(0, 8) + "\u2026", W - M - 50, y);
    }
    y += 12;

    // Gebucht bei / Verkauft von
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    var sellerLabel = data.offerType === "werk" ? "Verkauft von:" : "Gebucht bei:";
    doc.text(sellerLabel, M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(data.sellerName || "Anbieter", M, y);
    y += 6;
    y += 6;

    // Gebuchtes Angebot / Gekauftes Werk
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    var offerLabel = data.offerType === "werk" ? "Gekauftes Werk:" : "Gebuchtes Angebot:";
    doc.text(offerLabel, M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    var offerLines = doc.splitTextToSize(data.offerTitle || "Angebot", W - 2 * M);
    doc.text(offerLines, M, y);
    y += offerLines.length * 6 + 3;

    // Angebotstyp
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    var typeLabel = data.offerType === "talent" ? "Talent-Angebot"
      : data.offerType === "experience" ? "Erlebnis"
      : data.offerType === "werk" ? "Werk"
      : "Angebot";
    doc.text("Typ: " + typeLabel, M, y);
    y += 8;

    // Termin (nur fuer Buchungen, nicht fuer Werk-Kauf)
    if (data.offerType !== "werk" && (data.date || data.time)) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text("Termin:", M, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      if (data.date) {
        var dStr = typeof data.date === "string" && data.date.length >= 10
          ? formatDateDE(new Date(data.date), { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
          : String(data.date);
        doc.text(dStr, M, y);
        y += 6;
      }
      if (data.time) {
        doc.text("Uhrzeit: " + data.time, M, y);
        y += 6;
      }
      y += 4;
    }

    // Ort
    if (data.location) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text("Ort:", M, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      var locLines = doc.splitTextToSize(String(data.location), W - 2 * M);
      doc.text(locLines, M, y);
      y += locLines.length * 6 + 6;
    }

    // Teilnehmer
    if (data.participants && data.participants > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text("Teilnehmer: " + data.participants, M, y);
      y += 8;
    }

    // Trennlinie
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 10;

    // Betrag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text("Betrag:", M, y);
    var amountStr = Number(data.amountEur || 0).toFixed(2).replace(".", ",") + " \u20AC";
    doc.text(amountStr, W - M - 40, y);
    y += 10;

    y += 8;

    // Status
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(14, 196, 184);
    var statusText = data.offerType === "werk"
      ? "\u2713 Beitrag erfasst \u2014 Werk erworben"
      : "\u2713 Beitrag erfasst \u2014 Termin reserviert";
    doc.text(statusText, M, y);
    y += 10;

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(M, 270, W - M, 270);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("HUI \u2014 Human United Intelligence", M, 275);
    doc.text("www.be-hui.app", W - M - 35, 275);

    // ── Dateiname ──────────────────────────────────────────────
    var fileName = "HUI_Beleg_" + (data.offerTitle ? data.offerTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_") : "Buchung") + ".pdf";

    // ── Plattform-spezifischer Download ──────────────────────────
    // BELEG-006 (2026-08-14): Michael-Feedback — "nicht nur versenden/teilen, ich will
    // es lokal auf dem Handy haben und danach die Beleg-Ansicht sehen". Rueckgabewert
    // ist jetzt ein Objekt { fileName, uri, native, receiptData }, das der Aufrufer
    // (NotificationPanel) nutzt, um eine In-App-Beleg-Ansicht zu oeffnen — OHNE
    // automatisches Share-Sheet. Teilen bleibt als OPTIONALE Aktion in der Ansicht
    // erhalten (siehe BelegViewerModal.jsx), wird aber nicht mehr erzwungen.
    if (isNative()) {
      // BELEG-002: sofortiges Feedback — sonst wirkt der Tap "totes" auf dem Handy,
      // waehrend jsPDF-Chunk laedt + Filesystem im Hintergrund arbeitet.
      toast.info("Beleg wird gespeichert …", { duration: 2500 });

      // FIX (2026-08-26, Michael): Vorherige Version speicherte in den
      // app-privaten Speicher (/Android/data/com.hui.app/files/) — den
      // findet man im normalen Dateimanager NICHT. Jetzt: native
      // DownloadInterface nutzen, die den Beleg direkt in den
      // öffentlichen Downloads-Ordner (Download/HUI/) schreibt.
      // Das erfordert KEINE Laufzeit-Berechtigung (MediaStore API).
      const base64 = doc.output("datauristring").split(",")[1];

      if (window.__HUI_DOWNLOAD && typeof window.__HUI_DOWNLOAD.saveToDownloads === "function") {
        const result = window.__HUI_DOWNLOAD.saveToDownloads(base64, fileName, "application/pdf");
        if (result && !result.startsWith("ERROR")) {
          // Erfolg — Datei ist jetzt in Downloads/HUI/ sichtbar
          toast.info("Beleg in Downloads gespeichert ✓ (Ordner: Download/HUI)", { duration: 3500 });
          // Optional: Share-Sheet anbieten, falls Nutzer teilen möchte
          try {
            await Share.share({
              title: "HUI Beleg",
              text: "Dein HUI-Beleg: " + fileName,
              url: result,
              dialogTitle: "Beleg teilen?",
            });
          } catch (shareErr) {
            const msg = String(shareErr?.message || shareErr?.errorMessage || "").toLowerCase();
            if (!msg.includes("cancel")) {
              console.warn("[generateReceipt] Share failed (file still in Downloads):", shareErr);
            }
          }
          return { fileName, uri: result, native: true, receiptData: data };
        } else {
          console.warn("[generateReceipt] Native download failed:", result);
          // Fallback: Filesystem + Share
          const saved = await saveNative(doc, fileName);
          toast.info("Beleg gespeichert — im Share-Menü 'In Dateien speichern' wählen", { duration: 4000 });
          return { fileName, uri: saved.uri, native: true, receiptData: data };
        }
      } else {
        // DownloadInterface nicht verfügbar (alte APK) — Fallback
        console.warn("[generateReceipt] __HUI_DOWNLOAD not available — using Filesystem fallback");
        const saved = await saveNative(doc, fileName);
        if (saved.method === "filesystem" && saved.uri) {
          toast.info("Beleg gespeichert — tippe zum Speichern/Teilen ✓", { duration: 3000 });
          try {
            await Share.share({
              title: "HUI Beleg",
              text: "Dein HUI-Beleg: " + fileName,
              url: saved.uri,
              dialogTitle: "Beleg speichern oder teilen",
            });
          } catch (shareErr) {
            const msg = String(shareErr?.message || shareErr?.errorMessage || "").toLowerCase();
            if (!msg.includes("cancel")) {
              console.warn("[generateReceipt] Share failed (file still saved):", shareErr);
            }
          }
        } else {
          toast.info("Beleg heruntergeladen ✓", { duration: 2000 });
        }
        return { fileName, uri: saved.uri, native: true, receiptData: data };
      }
    } else {
      // Web/Desktop: klassischer Browser Download
      doc.save(fileName);
      return { fileName, uri: null, native: false, receiptData: data };
    }
  } catch (err) {
    console.error("[generateReceipt] Failed:", err);
    toast.error("Beleg konnte nicht erstellt werden. Bitte nochmal versuchen.");
    throw err;
  }
}

/**
 * Speichert die PDF dauerhaft im App-externen Speicherbereich des Geraets (Android/iOS).
 * KEIN automatisches Share-Sheet mehr (BELEG-006) — reine Speicherung. Gibt { uri } zurueck.
 *
 * BELEG-006 (2026-08-14): Directory.External statt Directory.Cache — der Cache-Ordner
 * kann vom System jederzeit automatisch geleert werden, was fuer einen dauerhaft
 * aufzubewahrenden Beleg falsch ist. External (getExternalFilesDir(null)) bleibt bis zur
 * App-Deinstallation erhalten und ist bereits als <external-path> in file_paths.xml
 * deklariert (FileProvider-Voraussetzung, seit 2026-07-09 im APK compiliert).
 */
function blobDownloadFallback(doc, fileName) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function saveNative(doc, fileName) {
  // BELEG-007: Erst PRUEFEN ob das native Filesystem-Plugin auf diesem Geraet
  // ueberhaupt registriert ist, statt es blind zu versuchen. Fehlt es, ist das
  // KEIN unerwarteter Fehler (der Blob-Fallback liefert die Datei trotzdem
  // zuverlaessig aus) — also keine alarmierende Fehler-Toast, sondern direkt
  // und ruhig der Fallback-Pfad mit ehrlichem method-Flag fuer den Aufrufer.
  if (!isFilesystemPluginAvailable()) {
    console.warn("[generateReceipt] Filesystem-Plugin auf diesem Geraet nicht registriert — nutze Download-Fallback.");
    try {
      blobDownloadFallback(doc, fileName);
      return { uri: null, method: "fallback" };
    } catch (err2) {
      console.error("[generateReceipt] Fallback failed (no Filesystem plugin):", err2);
      toast.error("Beleg konnte nicht gespeichert werden. Bitte Speicher-Zugriff für HUI prüfen.");
      throw err2;
    }
  }

  try {
    // BELEG-004: Filesystem ist ein Modul-Level registerPlugin()-Proxy (siehe Dateikopf).

    // PDF als Base64 holen (ohne Data-URL-Präfix)
    const dataUri = doc.output("datauristring"); // "data:application/pdf;base64,XXXX"
    const base64 = dataUri.split(",")[1];

    // BELEG-003: KEIN `encoding` Parameter bei Base64-Binärdaten! Wuerde Capacitor
    // veranlassen, `data` als reinen UTF8-Text statt Base64 zu behandeln -> korrupte Datei.
    await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: DIRECTORY_EXTERNAL,
      recursive: true,
    });

    // URI der geschriebenen Datei holen (fuer optionales Teilen aus der Beleg-Ansicht)
    const uriResult = await Filesystem.getUri({
      directory: DIRECTORY_EXTERNAL,
      path: fileName,
    });

    return { uri: uriResult.uri, method: "filesystem" };
  } catch (err) {
    console.error("[generateReceipt] Native save failed:", err);
    const errMsg = (err && (err.message || err.errorMessage)) ? String(err.message || err.errorMessage) : "Unbekannter Fehler";
    // Fallback: Blob-Download versuchen (funktioniert evtl. auf manchen WebViews)
    try {
      blobDownloadFallback(doc, fileName);
      toast.warn("Speichern fehlgeschlagen (" + errMsg.substring(0, 60) + "). Download-Fallback genutzt.");
      return { uri: null, method: "fallback" };
    } catch (err2) {
      console.error("[generateReceipt] Fallback also failed:", err2);
      // BELEG-002: nie mehr stiller Fail — Nutzer bekommt IMMER eine Rückmeldung.
      toast.error("Beleg konnte nicht gespeichert werden. Bitte Speicher-Zugriff für HUI prüfen.");
      throw err2;
    }
  }
}

/**
 * BELEG-006 (2026-08-14): Optionales Teilen aus der Beleg-Ansicht heraus (nicht mehr
 * automatisch bei jedem Download). "Share canceled" (Nutzer hat das Share-Sheet einfach
 * weggewischt/X gedrueckt) ist KEIN Fehler und darf NIE eine Fehler-Toast zeigen — das
 * war der "orangene Fehler", den Michael nach dem Schliessen des Share-Sheets sah.
 */
export async function shareReceiptFile(uri, fileName) {
  if (!uri) {
    toast.error("Beleg-Datei nicht verfügbar zum Teilen.");
    return;
  }
  try {
    await Share.share({
      title: "HUI Beleg",
      text: "Dein HUI-Beleg: " + fileName,
      url: uri,
      dialogTitle: "Beleg teilen",
    });
  } catch (err) {
    const msg = (err && (err.message || err.errorMessage)) ? String(err.message || err.errorMessage).toLowerCase() : "";
    // Nutzer-Abbruch (Android: "Share canceled") ist normales Verhalten, kein Fehler.
    if (msg.includes("cancel")) return;
    console.error("[shareReceiptFile] Failed:", err);
    toast.error("Teilen ist fehlgeschlagen. Bitte nochmal versuchen.");
  }
}
