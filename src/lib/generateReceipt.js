import { formatDateDE } from "./formatters.js";
// src/lib/generateReceipt.js — QUITTUNG-001 (2026-08-08)
// Generiert eine PDF-Quittung fuer Talent-Buchungen, Erlebnis-Buchungen und Werk-Kaeufe.
// Desktop: doc.save() (Browser-Download)
// Android (Capacitor): Filesystem.writeFile → Share Sheet (Downloads/Teilen)
// iOS (Capacitor): Filesystem.writeFile → Share Sheet (Teilen/Speichern)

let _isNative = null;
function isNative() {
  if (_isNative !== null) return _isNative;
  try {
    _isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch { _isNative = false; }
  return _isNative;
}

export async function generateReceipt(data) {
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
  doc.text("Quittung", M, y);
  y += 8;

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
  if (data.sellerEmail) {
    doc.setFontSize(9);
    doc.setTextColor(14, 196, 184);
    doc.text("E-Mail: " + data.sellerEmail, M, y);
    y += 5;
  }
  if (data.sellerWebsite) {
    doc.setFontSize(9);
    doc.setTextColor(14, 196, 184);
    doc.text("Webseite: " + data.sellerWebsite, M, y);
    y += 5;
  }
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

  // Link zum Angebot
  if (data.offerId && data.offerType) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text("Angebot ansehen:", M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(14, 196, 184);
    var offerPath = data.offerType === "talent" ? "talent"
      : data.offerType === "experience" ? "erlebnis"
      : data.offerType === "werk" ? "werk"
      : "angebot";
    var offerUrl = "https://be-hui.vercel.app/" + offerPath + "?id=" + data.offerId;
    doc.text(offerUrl, M, y);
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
    ? "\u2713 Zahlung bestaetigt \u2014 Werk erworben"
    : "\u2713 Zahlung bestaetigt \u2014 Termin reserviert";
  doc.text(statusText, M, y);
  y += 10;

  // Chat-Hinweis
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Du kannst den Anbieter uber HUI kontaktieren \u2013 in der App unter Finanz\u00fcbersicht > Buchungen.", M, y);
  y += 6;

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(M, 270, W - M, 270);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("HUI \u2014 Human United Intelligence", M, 275);
  doc.text("be-hui.vercel.app", W - M - 35, 275);

  // ── Dateiname ──────────────────────────────────────────────
  var fileName = "HUI_Quittung_" + (data.offerTitle ? data.offerTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_") : "Buchung") + ".pdf";

  // ── Plattform-spezifischer Download ──────────────────────────
  if (isNative()) {
    // Android/iOS: Datei ins Filesystem schreiben, dann Share-Sheet öffnen
    return await saveNative(doc, fileName);
  } else {
    // Web/Desktop: klassischer Browser Download
    doc.save(fileName);
    return fileName;
  }
}

/**
 * Speichert die PDF auf dem Gerät (Android/iOS) und öffnet die Share-Sheet,
 * damit der Nutzer die Datei herunterladen, teilen oder in einer App öffnen kann.
 */
async function saveNative(doc, fileName) {
  try {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    // PDF als Base64 holen (ohne Data-URL-Präfix)
    const dataUri = doc.output("datauristring"); // "data:application/pdf;base64,XXXX"
    const base64 = dataUri.split(",")[1];

    // In das Documents-Verzeichnis schreiben
    const writeResult = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });

    // URI der geschriebenen Datei holen
    const uriResult = await Filesystem.getUri({
      directory: Directory.Documents,
      path: fileName,
    });

    // Share-Sheet öffnen — Nutzer kann speichern, teilen, per Mail senden etc.
    await Share.share({
      title: "HUI Quittung",
      text: "Deine HUI-Quittung: " + fileName,
      url: uriResult.uri,
      dialogTitle: "Quittung speichern oder teilen",
    });

    return fileName;
  } catch (err) {
    console.error("[generateReceipt] Native save failed:", err);
    // Fallback: versuche Blob-Download (funktioniert evtl. auf manchen WebViews)
    try {
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return fileName;
    } catch (err2) {
      console.error("[generateReceipt] Fallback also failed:", err2);
      throw err2;
    }
  }
}
