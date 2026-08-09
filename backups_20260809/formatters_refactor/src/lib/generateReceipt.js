// src/lib/generateReceipt.js — QUITTUNG-001 (2026-08-08)
// Generiert eine PDF-Quittung fuer Talent-Buchungen, Erlebnis-Buchungen und Werk-Kaeufe.
// Nutzung: generateReceipt(bookingData) -> laedt jsPDF lazy -> oeffnet PDF.

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
  doc.setTextColor(26, 26, 24);
  doc.text("Quittung", M, y);
  y += 8;

  // Buchungs-ID + Datum
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const now = new Date();
  const dateStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  doc.text("Erstellt am: " + dateStr, M, y);
  if (data.bookingId) {
    doc.text("Buchungs-ID: " + String(data.bookingId).substring(0, 8) + "\u2026", W - M - 50, y);
  }
  y += 12;

  // Gebucht bei / Verkauft von
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 24);
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
  doc.setTextColor(26, 26, 24);
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
    doc.setTextColor(26, 26, 24);
    doc.text("Termin:", M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    if (data.date) {
      var dStr = typeof data.date === "string" && data.date.length >= 10
        ? new Date(data.date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
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
    doc.setTextColor(26, 26, 24);
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
    doc.setTextColor(26, 26, 24);
    doc.text("Teilnehmer: " + data.participants, M, y);
    y += 8;
  }

  // Link zum Angebot
  if (data.offerId && data.offerType) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 24);
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
  doc.setTextColor(26, 26, 24);
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
  doc.text("Du kannst den Anbieter uber HUI kontaktieren – in der App unter Finanzübersicht > Buchungen.", M, y);
  y += 6;

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(M, 270, W - M, 270);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("HUI \u2014 Human United Intelligence", M, 275);
  doc.text("be-hui.vercel.app", W - M - 35, 275);

  // Download
  var fileName = "HUI_Quittung_" + (data.offerTitle ? data.offerTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_") : "Buchung") + ".pdf";
  doc.save(fileName);
  return fileName;
}
