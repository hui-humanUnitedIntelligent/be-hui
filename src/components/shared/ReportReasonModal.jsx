// src/components/shared/ReportReasonModal.jsx — MELDE-FLOW-002
// 2-stufiger Melde-Dialog: 1) Sicherheitsabfrage (Ja/Nein) 2) Kategorie-Auswahl.
// Erweitert die bestehende "einmal melden"-Funktion (MOMENTE-REPORTS-001) —
// ersetzt NICHT die zugrundeliegende Logik, liefert nur den ausgewählten
// Grund an den Aufrufer zurück (onSubmit(reasonKey)).
//
// Pflicht laut Portal-Charta: createPortal(document.body) + zIndex >= 10500.
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const CORAL = "#C47A65";
const INK   = "#1A1A2E";
const MUTED = "rgba(26,26,46,0.55)";
const BORDER = "rgba(26,26,46,0.10)";

// ── Melde-Kategorien (SSOT) — Reihenfolge = Anzeige-Reihenfolge ─────────
// key wird 1:1 als `reason` in momente_reports.reason gespeichert und von
// SADB (MomenteView) zur Anzeige der Melde-Gründe genutzt.
export const REPORT_REASONS = [
  { key: "sexueller_inhalt",     label: "Sexueller Inhalt" },
  { key: "rassismus",            label: "Rassismus / Diskriminierung" },
  { key: "politik",              label: "Politik / Extremismus" },
  { key: "gewalt",               label: "Gewalt oder Bedrohung" },
  { key: "belaestigung",         label: "Belästigung / Mobbing" },
  { key: "spam",                 label: "Spam oder Werbung" },
  { key: "falschinformation",    label: "Falschinformation" },
  { key: "urheberrecht",         label: "Urheberrechtsverletzung" },
  { key: "unangemessen",         label: "Unangemessener Inhalt" },
  { key: "sonstiges",            label: "Sonstiges" },
];

export default function ReportReasonModal({
  open = false,
  onClose = () => {},
  onSubmit = () => {},
  submitting = false,
}) {
  // step: "confirm" → "categories"
  const [step, setStep] = useState("confirm");

  // Bei jedem Öffnen zurück auf Schritt 1
  useEffect(() => {
    if (open) setStep("confirm");
  }, [open]);

  if (!open) return null;

  const handleSelectReason = (key) => {
    onSubmit?.(key);
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10500,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(20,20,34,0.45)",
        backdropFilter: "blur(2px)",
      }}
      onClick={() => onClose?.()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#FFFFFF",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px calc(24px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 32px rgba(20,20,34,0.18)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Griff-Indikator */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "rgba(26,26,46,0.15)",
          margin: "0 auto 20px",
        }} />

        {step === "confirm" && (
          <>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: INK,
              margin: "0 0 8px", textAlign: "center",
            }}>
              Beitrag wirklich melden?
            </h2>
            <p style={{
              fontSize: 14, color: MUTED, lineHeight: 1.5,
              margin: "0 0 24px", textAlign: "center",
            }}>
              Deine Meldung wird an unser Team weitergeleitet und geprüft.
              Diese Aktion kann nicht zurückgenommen werden.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => setStep("categories")}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 14,
                  border: "none", background: CORAL, color: "#FFFFFF",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}
              >
                Ja, melden
              </button>
              <button
                onClick={() => onClose?.()}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 14,
                  border: `1px solid ${BORDER}`, background: "transparent",
                  color: INK, fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
            </div>
          </>
        )}

        {step === "categories" && (
          <>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: INK,
              margin: "0 0 4px", textAlign: "center",
            }}>
              Worum geht es?
            </h2>
            <p style={{
              fontSize: 13, color: MUTED, margin: "0 0 18px", textAlign: "center",
            }}>
              Wähle den Grund, der am besten passt.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.key}
                  disabled={submitting}
                  onClick={() => handleSelectReason(r.key)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "13px 16px", borderRadius: 12,
                    border: `1px solid ${BORDER}`, background: "#FAF7F2",
                    color: INK, fontSize: 14.5, fontWeight: 600,
                    cursor: submitting ? "default" : "pointer",
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("confirm")}
              disabled={submitting}
              style={{
                width: "100%", padding: "13px 0", marginTop: 14,
                borderRadius: 14, border: "none", background: "transparent",
                color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Zurück
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
