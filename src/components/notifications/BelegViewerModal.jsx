// src/components/notifications/BelegViewerModal.jsx — BELEG-006 (2026-08-14)
//
// Michael-Feedback: "ich möchte es nicht nur versenden oder teilen ich möchte
// lokal auf meinem Smartphone haben ... und das PDF in der Ansicht gezeigt wird".
//
// FAKT (Truth over Assumption — HUI Engineering Constitution): Der Android-System-
// WebView, in dem die HUI-App läuft, hat KEINEN eingebauten PDF-Renderer (anders als
// Desktop-Chrome). Ein "echtes" eingebettetes PDF (Byte-für-Byte gerendert) würde
// entweder ein neues natives Capacitor-Plugin (Reinstall der APK nötig, nicht per OTA
// möglich) oder eine pdf.js-Integration (zusätzliche Komplexität/Bundle-Größe/Worker-
// Risiken in einer Capacitor-WebView) erfordern.
//
// GEWÄHLTE LÖSUNG (pragmatisch, 100% OTA-fähig, kein Reinstall nötig): Diese Ansicht
// zeigt exakt dieselben Beleg-Inhalte, die auch im PDF stehen (Titel, Anbieter, Betrag,
// Datum, Beleg-Nr, Angebotstyp) — als natives App-UI statt als PDF-Rendering. Die
// eigentliche PDF-Datei liegt dauerhaft lokal auf dem Gerät (Directory.External, siehe
// generateReceipt.js) und kann über den "Teilen"-Button bei Bedarf weitergegeben werden.
//
// Falls Michael später einen Byte-genauen PDF-Viewer will: pdf.js-Integration als
// separate Folgeaufgabe möglich (Canvas-Rendering, offline-fähig, kein natives Plugin).

import React from "react";
import { createPortal } from "react-dom";
import { formatDateDE } from "../../lib/formatters.js";
import { shareReceiptFile } from "../../lib/generateReceipt.js";

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
  if (!result) return null;
  const { fileName, uri, native, receiptData: d = {} } = result;

  const sellerLabel = d.offerType === "werk" ? "Verkauft von" : "Gebucht bei";
  const offerLabel = d.offerType === "werk" ? "Gekauftes Werk" : "Gebuchtes Angebot";
  const typeLabel = d.offerType === "talent" ? "Talent-Angebot"
    : d.offerType === "experience" ? "Erlebnis"
    : d.offerType === "werk" ? "Werk"
    : "Angebot";
  const amountStr = d.amountEur != null ? Number(d.amountEur).toFixed(2).replace(".", ",") + " €" : null;
  const dateStr = formatDateDE(new Date(), { day: "2-digit", month: "long", year: "numeric" });
  const bookingShort = d.bookingId ? String(d.bookingId).substring(0, 8) + "…" : null;

  const [sharing, setSharing] = React.useState(false);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      await shareReceiptFile(uri, fileName);
    } finally {
      setSharing(false);
    }
  }

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
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
          padding: "24px 20px calc(24px + env(safe-area-inset-bottom, 0px))",
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

        {/* Teilen (optional, sekundär) */}
        {native && uri && (
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
        )}

        {/* Schließen */}
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "14px", borderRadius: 99,
            background: "#0EC4B8", border: "none",
            color: "#fff", fontSize: 15, fontWeight: 700,
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
