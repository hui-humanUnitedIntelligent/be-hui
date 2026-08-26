import { formatDateDE } from "./formatters.js";
import { toast } from "./useToast.jsx";
import { registerPlugin } from "@capacitor/core";

// BELEG-004: registerPlugin statt npm-Import (siehe BELEG-004 Kommentar in altem Code)
const Filesystem = registerPlugin("Filesystem", {});
const Share = registerPlugin("Share", {});
const DIRECTORY_EXTERNAL = "EXTERNAL";

let _isNative = null;
function isNative() {
  if (_isNative !== null) return _isNative;
  try {
    _isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch { _isNative = false; }
  return _isNative;
}

function isFilesystemPluginAvailable() {
  try {
    return !!(
      window.Capacitor &&
      typeof window.Capacitor.isPluginAvailable === "function" &&
      window.Capacitor.isPluginAvailable("Filesystem")
    );
  } catch { return false; }
}

// BELEG-009 (2026-08-26): Native Download-Schnittstelle prüfen.
// Die Java-Seite (MainActivity.java) registriert window.__HUI_DOWNLOAD.saveToDownloads(),
// die über MediaStore direkt in den öffentlichen Downloads/HUI/ Ordner schreibt.
// Das ist der ZUVERLÄSSIGSTE Weg auf Android — der Capacitor Filesystem-Plugin
// schreibt nur in den app-privaten Speicher (nicht im Dateimanager sichtbar),
// und Blob-Download (<a download>) funktioniert in WebViews nicht.
function isNativeDownloadAvailable() {
  try {
    return !!(window.__HUI_DOWNLOAD && typeof window.__HUI_DOWNLOAD.saveToDownloads === "function");
  } catch { return false; }
}

export async function generateReceipt(data) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const W = 210;
    const M = 20;
    let y = 20;

    // Header — HUI Text links, HUI-Logo rechts
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(14, 196, 184);
    doc.text("HUI", M, y);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Human United Intelligence", M + 14, y - 1);

    // HUI-Logo oben rechts
    try {
      var logoUrl = (typeof window !== "undefined" && window.location)
        ? window.location.origin + "/assets/brand/hui-logo.png"
        : "/assets/brand/hui-logo.png";
      var logoResp = await fetch(logoUrl);
      if (logoResp.ok) {
        var logoBlob = await logoResp.blob();
        var logoReader = new FileReader();
        var logoBase64 = await new Promise(function(resolve, reject) {
          logoReader.onload = function() { resolve(logoReader.result); };
          logoReader.onerror = reject;
          logoReader.readAsDataURL(logoBlob);
        });
        var logoSize = 22;
        var logoX = W - M - logoSize;
        var logoY = y - 14;
        doc.addImage(logoBase64, "PNG", logoX, logoY, logoSize, logoSize);
      }
    } catch (logoErr) {
      console.warn("[generateReceipt] Logo konnte nicht geladen werden:", logoErr);
    }

    y += 6;
    doc.setDrawColor(14, 196, 184);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 10;

    // Titel
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(26, 26, 26);
    var docTitle = data.offerType === "werk" ? "Beitragsnachweis" : "Dein Wirkungsbeleg";
    doc.text(docTitle, M, y);
    y += 7;

    // Untertitel / Intro-Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    var introText = "Deine Transaktion wurde erfolgreich erfasst. Damit wird sichtbar, was durch deinen Beitrag ermöglicht wurde.";
    var introLines = doc.splitTextToSize(introText, W - 2 * M);
    doc.text(introLines, M, y);
    y += introLines.length * 5 + 6;

    // Buchungs-ID + Datum
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const now = new Date();
    const dateStr = formatDateDE(now, { day: "2-digit", month: "long", year: "numeric" });
    doc.text("Erstellt am: " + dateStr, M, y);
    // BELEG-012 (2026-08-26): Michael-Feedback — volle UUID (36 Zeichen) ist zu lang
    // und unpraktisch fuer Support/Admin-Suche. Gekuerzt auf die ersten 8 Hex-Zeichen
    // (Grossbuchstaben) — identische Kuerzungslogik wie SADB BookingsView.jsx (shortBookingCode),
    // damit Admin per kurzer Nummer aus dem Beleg im SADB-Suchfeld wiederfinden kann.
    if (data.bookingId) {
      const shortBookingId = String(data.bookingId).replace(/^(tb_|bos_)/, "").slice(0, 8).toUpperCase();
      doc.text("Buchungs-ID: " + (shortBookingId || "\u2013"), W - M - 70, y);
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
    if (data.sellerEmail) {
      doc.setFontSize(9);
      doc.setTextColor(14, 196, 184);
      doc.text("E-Mail: " + data.sellerEmail, M, y);
      y += 5;
    }
    doc.setFontSize(9);
    doc.setTextColor(14, 196, 184);
    doc.text("Webseite: " + (data.sellerWebsite || "\u2013"), M, y);
    y += 5;
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

    // Termin
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

    // Link zum öffentlichen Profil des Verkäufers
    if (data.sellerUsername) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text("Anbieter-Profil:", M, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(14, 196, 184);
      var profileUrl = "https://www.be-hui.app/profile/" + data.sellerUsername;
      doc.text(profileUrl, M, y);
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

    if (data.participants && data.participants > 1 && data.amountEur) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      var perPerson = (Number(data.amountEur) / data.participants).toFixed(2).replace(".", ",");
      doc.text("Pro Teilnehmer: " + perPerson + " \u20AC", M, y);
      y += 6;
    }
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

    // Chat-Hinweis
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Du kannst den Anbieter uber HUI kontaktieren \u2013 in der App unter Finanz\u00fcbersicht.", M, y);
    y += 6;

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

    // ── Base64 + Blob-URL immer erzeugen ────────────────────────
    const dataUri = doc.output("datauristring");
    const base64 = dataUri.split(",")[1];
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    // ── Plattform-spezifischer Download ──────────────────────────
    // BELEG-009 (2026-08-26): Priority chain:
    // 1. window.__HUI_DOWNLOAD.saveToDownloads() — native Java interface,
    //    schreibt direkt in öffentlichen Downloads/HUI/ Ordner (MediaStore).
    //    ZUVERLÄSSIGST: funktioniert immer, wenn das APK die Interface hat.
    // 2. Capacitor Filesystem plugin — schreibt in app-privaten Speicher
    //    (nicht im Dateimanager sichtbar, aber Datei existiert + kann geteilt werden).
    // 3. Blob-Download Fallback — funktioniert nur im Browser, nicht in WebView.
    if (isNative()) {
      toast.info("Beleg wird gespeichert …", { duration: 2500 });
      const saved = await saveNative(base64, fileName);
      if (saved.method === "native") {
        toast.info("Beleg gespeichert ✓ — im Downloads/HUI Ordner", { duration: 3000 });
      } else if (saved.method === "filesystem") {
        toast.info("Beleg gespeichert ✓", { duration: 2000 });
      } else {
        toast.info("Beleg heruntergeladen ✓", { duration: 2000 });
      }
      return { fileName, uri: saved.uri, blobUrl, base64, native: true, receiptData: data };
    } else {
      doc.save(fileName);
      return { fileName, uri: null, blobUrl, base64, native: false, receiptData: data };
    }
  } catch (err) {
    console.error("[generateReceipt] Failed:", err);
    toast.error("Beleg konnte nicht erstellt werden. Bitte nochmal versuchen.");
    throw err;
  }
}

function blobDownloadFallback(doc, fileName) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function saveNative(base64, fileName) {
  // BELEG-009 (2026-08-26): 1. Versuch — Native __HUI_DOWNLOAD Interface
  // (Java MainActivity.java, MediaStore.Downloads). Schreibt direkt in den
  // öffentlichen Downloads/HUI/ Ordner — im Dateimanager sichtbar.
  if (isNativeDownloadAvailable()) {
    try {
      const result = window.__HUI_DOWNLOAD.saveToDownloads(base64, fileName, "application/pdf");
      if (result && !result.startsWith("ERROR:")) {
        return { uri: result, method: "native" };
      }
      console.warn("[generateReceipt] Native download returned error:", result);
    } catch (err) {
      console.warn("[generateReceipt] Native download failed:", err);
    }
  }

  // 2. Versuch — Capacitor Filesystem Plugin (app-privater Speicher)
  if (isFilesystemPluginAvailable()) {
    try {
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: DIRECTORY_EXTERNAL,
        recursive: true,
      });
      const uriResult = await Filesystem.getUri({
        directory: DIRECTORY_EXTERNAL,
        path: fileName,
      });
      return { uri: uriResult.uri, method: "filesystem" };
    } catch (err) {
      console.error("[generateReceipt] Filesystem save failed:", err);
    }
  }

  // 3. Versuch — Blob Download Fallback (nur Browser, nicht WebView)
  try {
    const { default: jsPDF } = await import("jspdf");
    // Wir haben kein doc mehr hier — base64 direkt als Blob
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return { uri: null, method: "fallback" };
  } catch (err) {
    console.error("[generateReceipt] All save methods failed:", err);
    toast.error("Beleg konnte nicht gespeichert werden.");
    throw err;
  }
}

/**
 * BELEG-009 (2026-08-26): "Auf Handy speichern" aus dem BelegViewerModal.
 * Priority: Native Interface → Share Sheet → Blob Download
 */
export async function downloadReceiptFile(result) {
  if (!result) return;
  const { uri, blobUrl, base64, fileName, native } = result;

  // 1. Native __HUI_DOWNLOAD Interface (direkt in Downloads/HUI/)
  if (native && base64 && isNativeDownloadAvailable()) {
    try {
      const dlResult = window.__HUI_DOWNLOAD.saveToDownloads(base64, fileName || "HUI_Beleg.pdf", "application/pdf");
      if (dlResult && !dlResult.startsWith("ERROR:")) {
        toast.info("Beleg gespeichert ✓ — im Downloads/HUI Ordner", { duration: 3000 });
        return;
      }
      console.warn("[downloadReceiptFile] Native download error:", dlResult);
    } catch (err) {
      console.warn("[downloadReceiptFile] Native download failed:", err);
    }
  }

  // 2. Share Sheet (wenn Datei-URI vorhanden)
  if (native && uri) {
    try {
      await Share.share({
        title: "HUI Beleg",
        text: "Dein HUI-Beleg: " + (fileName || "Beleg.pdf"),
        url: uri,
        dialogTitle: "Beleg speichern",
      });
      return;
    } catch (err) {
      const msg = (err && (err.message || err.errorMessage)) ? String(err.message || err.errorMessage).toLowerCase() : "";
      if (msg.includes("cancel")) return;
      console.warn("[downloadReceiptFile] Share failed, trying blob:", err);
    }
  }

  // 3. Blob Download (Browser/Web)
  if (blobUrl) {
    try {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "HUI_Beleg.pdf";
      a.click();
      toast.info("Beleg heruntergeladen ✓", { duration: 2000 });
    } catch (err) {
      console.error("[downloadReceiptFile] Blob download failed:", err);
      toast.error("Download fehlgeschlagen. Bitte nochmal versuchen.");
    }
    return;
  }

  toast.error("Beleg-Datei nicht verfügbar.");
}

/**
 * BELEG-006: Optionales Teilen aus der Beleg-Ansicht heraus.
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
    if (msg.includes("cancel")) return;
    console.error("[shareReceiptFile] Failed:", err);
    toast.error("Teilen ist fehlgeschlagen. Bitte nochmal versuchen.");
  }
}
