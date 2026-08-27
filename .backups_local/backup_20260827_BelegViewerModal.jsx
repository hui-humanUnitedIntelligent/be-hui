// src/components/notifications/BelegViewerModal.jsx — BELEG-006 (2026-08-14) + BELEG-008 (2026-08-26)
//
// BELEG-008 (2026-08-26): Michael-Feedback — "ich dachte du hast es eingebaut das der
// Beleg als Download direkt lokal auf dem Handy gespeichert wird". Der vorherige
// BelegViewerModal hatte nur einen "Teilen"-Button, der bedingt auf `native && uri`
// war — wenn das Filesystem-Plugin nicht verfügbar ist (BELEG-007), war der Button
// UNSICHTBAR und es gab gar keinen Weg, den Beleg aus der Ansicht heraus zu speichern.
//
// Fix: Zwei Buttons, beide IMMER sichtbar:
// 1. "Auf Handy speichern" (primär) — nutzt downloadReceiptFile(), die bei vorhandener
//    Datei-URI das Share-Sheet öffnet (mit "In Downloads speichern" Option) und sonst
//    einen direkten Blob-Download auslöst (funktioniert IMMER).
// 2. "Beleg teilen" (sekundär) — nutzt shareReceiptFile(), öffnet das Share-Sheet.

// BELEG-011 (2026-08-26): Michael-Feedback — "das modal ist hinter dem fenster
// versteckt. wenn man auf Beleg Herunterladen klickt soll das Modal angezeigt werden".
// Root Cause: BelegViewerModal wird aus TransactionDetailSheet.jsx heraus geöffnet
// (Button "Beleg herunterladen"). TransactionDetailSheet läuft selbst als Portal mit
// zIndex:10550 (bewusst höher als Standard-10500, siehe Kommentar dort). Da beide
// Elemente per createPortal auf document.body rendern, gewinnt bei zIndex 10500 vs
// 10550 IMMER TransactionDetailSheet — das BelegViewerModal lag optisch dahinter.
// Fix: zIndex auf 10600 angehoben (> 10550 des Elternfensters). Gilt als weitere
// gestapelte Ebene gemäß footer-navbar-zindex.md — bei künftigen Modals, die AUS
// TransactionDetailSheet (10550) heraus geöffnet werden, IMMER zIndex >= 10600 setzen.

import React from "react";
import { createPortal } from "react-dom";
import { formatDateDE } from "../../lib/formatters.js";
import { shareReceiptFile, downloadReceiptFile } from "../../lib/generateReceipt.js";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      gap: 12, padding: "10px 14px", background: "rgba(14,196,184,0.05)",
      borderRadius: 10, marginBottom: 8,
    }}>
      <span style={{ fontSize: 12, color: "#888", fontWeight: 600, flexShrink: 0, fontFamily: "Inter, sans-serif" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a18", textAlign: "right", fontFamily: "Inter, sans-serif" }}>{value}</span>
    </div>
  );
}

export default function BelegViewerModal({ result, onClose = () => {} }) {
  const [downloading, setDownloading] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  if (!result) return null;
  const { fileName, uri, blobUrl, native, receiptData: d = {} } = result;

  const sellerLabel = d.offerType === "werk" ? "Verkauft von" : "Gebucht bei";
  const offerLabel = d.offerType === "werk" ? "Gekauftes Werk" : "Gebuchtes Angebot";
  const typeLabel = d.offerType === "talent" ? "Talent-Angebot"
    : d.offerType === "experience" ? "Erlebnis"
    : d.offerType === "werk" ? "Werk"
    : "Angebot";
  const amountStr = d.amountEur != null ? Number(d.amountEur).toFixed(2).replace(".", ",") + " €" : null;
  const dateStr = formatDateDE(new Date(), { day: "2-digit", month: "long", year: "numeric" });
  const bookingShort = d.bookingId ? String(d.bookingId).substring(0, 8) + "…" : null;

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadReceiptFile(result);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      // Wenn uri vorhanden, direkt shareReceiptFile nutzen
      if (uri) {
        await shareReceiptFile(uri, fileName);
      } else if (blobUrl) {
        // Kein uri → blob download als "Teilen"-Ersatz
        await downloadReceiptFile(result);
      }
    } finally {
      setSharing(false);
    }
  }

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10600,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        fontFamily: "Inter, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, maxHeight: "88vh", overflowY: "auto",
          background: "#fff", borderRadius: 20,
          padding: "24px 20px calc(24px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(14,196,184,0.12)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 10px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#0EC4B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9.5" stroke="#0EC4B8" strokeWidth="1.6" />
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a18" }}>Dein Beleg</div>
          {d.offerTitle && (
            <div style={{ fontSize: 14, color: "#0EC4B8", fontWeight: 600, marginTop: 2 }}>
              „{d.offerTitle}"
            </div>
          )}
        </div>

        {/* Inhalt (spiegelt PDF-Felder) */}
        <Row label={sellerLabel} value={d.sellerName} />
        <Row label={offerLabel} value={d.offerTitle} />
        <Row label="Typ" value={typeLabel} />
        <Row label="Betrag" value={amountStr} />
        <Row label="Erstellt am" value={dateStr} />
        {bookingShort && <Row label="Buchungs-ID" value={bookingShort} />}

        {/* Speicher-Hinweis */}
        <div style={{
          fontSize: 12, color: "#888", textAlign: "center", lineHeight: 1.5,
          marginTop: 12, marginBottom: 16, padding: "10px 12px",
          background: "rgba(0,0,0,0.03)", borderRadius: 10,
        }}>
          {native
            ? <>PDF gespeichert in den App-Dateien deines Geräts:<br /><span style={{ fontWeight: 600, color: "#555" }}>{fileName}</span></>
            : <>PDF wurde in deinen Download-Ordner heruntergeladen:<br /><span style={{ fontWeight: 600, color: "#555" }}>{fileName}</span></>
          }
        </div>

        {/* "Auf Handy speichern" — IMMER sichtbar (BELEG-008) */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            width: "100%", padding: "14px", borderRadius: 99,
            background: "#0EC4B8", border: "none",
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: downloading ? "default" : "pointer", fontFamily: "inherit",
            marginBottom: 10, opacity: downloading ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {downloading ? "Speichern …" : "Auf Handy speichern"}
        </button>

        {/* "Beleg teilen" — IMMER sichtbar (BELEG-008) */}
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            width: "100%", padding: "13px", borderRadius: 99,
            background: "rgba(14,196,184,0.08)",
            border: "1.5px solid rgba(14,196,184,0.35)",
            color: "#0EC4B8", fontSize: 14, fontWeight: 600,
            cursor: sharing ? "default" : "pointer", fontFamily: "inherit",
            marginBottom: 10, opacity: sharing ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
            <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          {sharing ? "Teilen …" : "Beleg teilen"}
        </button>

        {/* Schließen */}
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "12px", borderRadius: 99,
            background: "transparent", border: "none",
            color: "#888", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Schließen
        </button>
      </div>
    </div>,
    document.body
  );
}
