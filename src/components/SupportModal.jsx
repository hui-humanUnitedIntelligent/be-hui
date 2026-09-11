// src/components/SupportModal.jsx
// ════════════════════════════════════════════════════════════════════
// SUPPORT-PROJECT-MODAL (2026-09-09, Michaels Prompt: "Unterstützen"-
// Button + Modal für Projekt-Profile):
// Zeigt 4 Schnellbetrag-Optionen + Custom-Betrag-Eingabe für
// Projekt-Direktunterstützung. Aktuell noch OHNE echte Zahlungsanbindung
// (Stripe-Checkout für Projekt-Direktunterstützung existiert noch nicht,
// im Unterschied zu UnterstutzenFlow.jsx, das der Werk-Kauf-Checkout ist)
// — jeder Klick zeigt bewusst nur den support.notYetActive-Hinweis-Toast.
//
// Pflicht-Muster (analog FollowListModal.jsx, gleicher Tag gebaut):
// createPortal(document.body) + zIndex 10500 + useWizardBodyLock() OHNE
// Flag (sicher, da diese Komponente ausschließlich conditional gemountet
// wird: {showSupport && <SupportModal .../>} in PublicProfilePage.jsx —
// NAVBAR-REGRESSION-LEHRE gilt nur bei PERMANENT gemounteten Komponenten).
//
// Wortregel (Michaels Vorgabe): das Wort "Spende"/"donation" darf NIEMALS
// vorkommen — ausschließlich "Unterstützen"/"Support" in allen Texten.
// ════════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useWizardBodyLock } from "../lib/wizardBodyLock.js";
import { useTranslation } from "../hooks/useTranslation.js";
import { toast } from "../lib/useToast.jsx";

const T = {
  teal:     "#0EC4B8",
  tealDeep: "#0A9E94",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:      "#1A3530",
  inkSoft:  "#55556B",
  inkFaint: "#808098",
  border:   "rgba(26,53,48,0.08)",
};

const QUICK_AMOUNTS = [5, 20, 50, 100];

export default function SupportModal({ onClose }) {
  const { t } = useTranslation();
  const [customAmount, setCustomAmount] = useState("");

  // Referenzgezählter Body-Lock — sicher ohne Flag, da conditional gemountet
  useWizardBodyLock();

  function handleSupport(_amount) {
    // Noch keine echte Zahlungsanbindung fuer Projekt-Direktunterstuetzung —
    // bewusst nur Hinweis-Toast, dann schliessen (Anforderung 3+4).
    toast.info(t("support.notYetActive"));
    onClose?.();
  }

  function handleCustomSubmit() {
    const val = parseFloat(String(customAmount).replace(",", "."));
    if (!val || val <= 0) return; // kein Toast bei leerer/ungueltiger Eingabe
    handleSupport(val);
  }

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        background: "rgba(26,53,48,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "supm-fade .18s ease both",
        WebkitTapHighlightColor: "transparent",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes supm-fade { from{opacity:0;} to{opacity:1;} }
        @keyframes supm-in   { from{transform:translateY(60px);opacity:0.4;} to{transform:translateY(0);opacity:1;} }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          display: "flex", flexDirection: "column",
          animation: "supm-in .22s cubic-bezier(.22,1,.36,1) both",
          boxShadow: "0 -10px 40px rgba(26,53,48,0.18)",
          paddingTop: "max(10px, env(safe-area-inset-top, 10px) * 0)", // 10px-Regel
          paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))", // Navbar-Abstand-Pflicht
        }}
      >
        {/* Grabber */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(26,53,48,0.12)" }} />
        </div>

        {/* Titel + Close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 18px 4px", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>
            {t("support.modal.title")}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(26,53,48,0.05)", color: T.inkSoft, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}
          >×</button>
        </div>

        {/* Beschreibung */}
        <div style={{ padding: "0 18px 16px", fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>
          {t("support.modal.desc")}
        </div>

        {/* Schnellbeträge */}
        <div style={{ padding: "0 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
            {t("support.modal.quickAmounts")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleSupport(amount)}
                className="ppp-press"
                style={{
                  height: 52, borderRadius: 14,
                  background: T.tealSoft, border: `1.5px solid ${T.teal}33`,
                  color: T.tealDeep, fontWeight: 700, fontSize: 15,
                  cursor: "pointer", fontFamily: "inherit",
                  touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
                  transition: "all .15s ease",
                }}
              >
                {amount}&nbsp;€
              </button>
            ))}
          </div>
        </div>

        {/* Custom-Betrag */}
        <div style={{ padding: "0 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
            {t("support.modal.customAmount")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={t("support.modal.placeholder")}
              style={{
                flex: 1, height: 48, borderRadius: 14,
                border: `1.5px solid ${T.border}`, background: "#FBFAF8",
                padding: "0 14px", fontSize: 15, fontWeight: 600, color: T.ink,
                fontFamily: "inherit", outline: "none",
              }}
            />
            <button
              onClick={handleCustomSubmit}
              className="ppp-press"
              style={{
                height: 48, minWidth: 110, borderRadius: 14,
                background: T.tealDeep, border: "none",
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit",
                touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {t("support.modal.btn")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
