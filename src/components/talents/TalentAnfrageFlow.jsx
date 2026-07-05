// src/components/talents/TalentAnfrageFlow.jsx
// ══════════════════════════════════════════════════════════════════════
// TALENT-DISCOVERY-001 (2026-07-05) — Anfrage-Modal für ein Talent-Angebot
// aus der neuen "Talente entdecken"-Sektion (DiscoverPage.jsx).
//
// Analog zu ExperienceBookingFlow.jsx (Bottom-Sheet: Nachricht → Notification
// an den Anbieter → Bestätigung), aber bewusst als eigene, neue Komponente
// gebaut statt der LEGACY-Datei angepasst — kein Umbau von Commerce-2.0-Code.
//
// PFLICHT (.agents/rules/footer-navbar-zindex.md): React Portal zu document.body
// + zIndex >= 10500, plus useWizardBodyLock() für dieses Bottom-Sheet mit
// Formular/Absenden-Button.
//
// Auth ist hier KEINE Voraussetzung mehr innerhalb dieser Komponente — der
// Aufrufer (DiscoverPage.handleTalentPress) gated bereits über useAuthGate()
// vor dem Öffnen. Diese Komponente geht davon aus, dass ein Nutzer eingeloggt ist.
// ══════════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";

const TEAL = "#16D7C5";

export default function TalentAnfrageFlow({ talent, onClose }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [phase,   setPhase]   = useState("form"); // form | loading | success | error
  const [errMsg,  setErrMsg]  = useState("");

  useWizardBodyLock();

  if (!talent) return null;

  const title       = talent.title || "Talent-Angebot";
  const providerId  = talent.user_id;
  const providerName= talent.author || "HUI Talent";
  const priceStr = talent.price_per_hour != null
    ? `${parseFloat(talent.price_per_hour).toLocaleString("de-DE",{minimumFractionDigits:0})} €/Std`
    : talent.price_per_session != null
      ? `${parseFloat(talent.price_per_session).toLocaleString("de-DE",{minimumFractionDigits:0})} €/Termin`
      : null;

  async function handleSenden() {
    if (!user?.id)   return setErrMsg("Nicht eingeloggt.");
    if (!talent?.id) return setErrMsg("Talent-Angebot nicht gefunden.");
    if (!providerId) return setErrMsg("Anbieter nicht gefunden.");
    if (user.id === providerId) return setErrMsg("Du kannst dein eigenes Angebot nicht anfragen.");

    setPhase("loading");
    setErrMsg("");

    const { error } = await supabase.from("notifications").insert({
      user_id:    providerId,
      type:       "talent_inquiry",
      text:       `Neue Anfrage für dein Talent-Angebot "${title}".` + (message.trim() ? ` Nachricht: "${message.trim()}"` : ""),
      read:       false,
      actor_id:   user.id,
      created_at: new Date().toISOString(),
    });

    if (error) {
      setErrMsg(error.message || "Anfrage konnte nicht gesendet werden.");
      setPhase("error");
      return;
    }

    setPhase("success");
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500, /* >BottomNav(10000) — Pflichtregel footer-navbar-zindex.md */
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div style={{
        position: "relative", background: "#FDFCFA", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 480,
        padding: "28px 24px calc(env(safe-area-inset-bottom,16px) + 40px)",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "tafSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        boxSizing: "border-box",
      }}>
        <style>{`
          @keyframes tafSlideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)",
          margin: "0 auto 24px" }} />

        {phase === "success" ? (
          /* ── Bestätigung ── */
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
              Anfrage gesendet
            </div>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", marginBottom: 8, lineHeight: 1.5 }}>
              {providerName} wurde benachrichtigt und meldet sich bei dir.
            </div>
            <div style={{ fontSize: 12, color: "rgba(26,26,46,0.38)", marginBottom: 28 }}>
              Status: Ausstehend
            </div>
            <button onClick={onClose} style={{
              background: TEAL, color: "#fff", border: "none",
              borderRadius: 14, padding: "12px 32px",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              touchAction: "manipulation",
            }}>
              Schließen
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEAL,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Talent anfragen
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3 }}>
                {title}
              </div>
              {providerName && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.45)", marginTop: 3 }}>
                  bei {providerName}
                </div>
              )}
            </div>

            {/* ── Preis ── */}
            {priceStr && (
              <div style={{
                background: "rgba(22,215,197,0.08)",
                border: "1px solid rgba(22,215,197,0.18)",
                borderRadius: 14, padding: "10px 16px",
                marginBottom: 18,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "rgba(26,26,46,0.55)" }}>Preis</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: TEAL }}>{priceStr}</span>
              </div>
            )}

            {/* ── Nachricht ── */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deine Nachricht (optional) — z.B. Wunschtermin, Fragen…"
              rows={3}
              style={{
                width: "100%", resize: "none",
                border: "1.5px solid rgba(26,26,46,0.12)",
                borderRadius: 14, padding: "12px 14px",
                fontSize: 14, color: "#1A1A2E",
                background: "#fff",
                outline: "none", marginBottom: 16,
                fontFamily: "inherit", lineHeight: 1.5,
                boxSizing: "border-box",
              }}
            />

            {/* ── Fehler ── */}
            {phase === "error" && errMsg && (
              <div style={{
                fontSize: 13, color: "#E83A3A", marginBottom: 14,
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(232,58,58,0.07)",
              }}>
                {errMsg}
              </div>
            )}

            {/* ── Buttons ── */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{
                flex: 1, background: "transparent",
                border: "1.5px solid rgba(26,26,46,0.15)",
                borderRadius: 14, padding: "12px 0",
                fontSize: 14, fontWeight: 600, color: "rgba(26,26,46,0.55)",
                cursor: "pointer", touchAction: "manipulation",
              }}>
                Abbrechen
              </button>
              <button
                onClick={handleSenden}
                disabled={phase === "loading"}
                style={{
                  flex: 2,
                  background: phase === "loading"
                    ? "rgba(22,215,197,0.4)"
                    : `linear-gradient(135deg,${TEAL},#0AB8B2)`,
                  color: "#fff", border: "none",
                  borderRadius: 14, padding: "12px 0",
                  fontSize: 15, fontWeight: 700,
                  cursor: phase === "loading" ? "not-allowed" : "pointer",
                  touchAction: "manipulation",
                }}
              >
                {phase === "loading" ? "Wird gesendet…" : "Anfrage senden"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
