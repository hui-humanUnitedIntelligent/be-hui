// src/components/commerce/ExperienceBookingFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
// Kanonischer Checkout: WerkeKorb → UnterstuetzenFlow → StripePaymentStep
// ═══════════════════════════════════════════════════════════════════
// Bottom-Sheet: Erlebnis buchen → bookingService.create() → Notification → Bestätigung
// Keine neuen Systeme. Kein Stripe. booking_status = "pending" für Beta.
import React, { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { bookingService } from "../../services/creatorEconomy";
import { supabase } from "../../lib/supabaseClient";

const TEAL = "#16D7C5";

export default function ExperienceBookingFlow({ experience, onClose }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [phase,   setPhase]   = useState("form"); // form | loading | success | error
  const [errMsg,  setErrMsg]  = useState("");

  if (!experience) return null;

  // Normalisiere Experience-Daten aus Feed- und HuiAction-Shapes
  // Shape A (Feed): experience = unified feed item { id, title, author, _raw }
  // Shape B (Action): experience = { experience: {...}, creator: {...} }
  const expObj    = experience?.experience || experience;
  const crObj     = experience?.creator    || experience?.author || null;

  const expId     = expObj?.id || expObj?._raw?.id;
  const creatorId = crObj?.id  || expObj?.author?.id
                  || expObj?._raw?.creator_id || expObj?._raw?.user_id
                  || expObj?.creator_id;
  const title     = expObj?.title || expObj?._raw?.title || "Erlebnis";
  const creatorName = crObj?.display_name || crObj?.name || expObj?.author?.name || "Creator";
  const rawPrice  = expObj?._raw?.price ?? expObj?.price ?? null;
  const amount    = typeof rawPrice === "number" ? rawPrice
                  : typeof rawPrice === "string"
                    ? parseFloat(rawPrice.replace(/[^0-9.,]/g,"").replace(",","."))
                    : 0;
  const priceStr  = amount > 0 ? `${amount.toFixed(2).replace(".",",")} €` : null;

  async function handleBuchen() {
    if (!user?.id)    return setErrMsg("Nicht eingeloggt.");
    if (!expId)       return setErrMsg("Erlebnis-ID fehlt.");
    if (!creatorId)   return setErrMsg("Creator-ID fehlt.");
    if (user.id === creatorId) return setErrMsg("Du kannst dein eigenes Erlebnis nicht buchen.");

    setPhase("loading");
    setErrMsg("");

    const { data, error } = await bookingService.create({
      experienceId: expId,
      creatorId,
      userId:   user.id,
      seats:    1,
      amount:   amount > 0 ? amount : 0,
      message:  message.trim() || "",
    });

    if (error) {
      setErrMsg(error);
      setPhase("error");
      return;
    }

    // Notification an Creator
    await supabase.from("notifications").insert({
      user_id:    creatorId,
      type:       "booking_request",
      text:       `Neue Buchungsanfrage für "${title}".`,
      read:       false,
      actor_id:   user.id,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    setPhase("success");
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500, /* >BottomNav(10000) — Footer-Overlap-Fix 2026-07-05 */
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div style={{
        background: "#FDFCFA", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 480,
        padding: "28px 24px 40px",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "ebfSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
      }}>
        <style>{`
          @keyframes ebfSlideUp {
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
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
              Anfrage gesendet
            </div>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", marginBottom: 8, lineHeight: 1.5 }}>
              {creatorName} wurde benachrichtigt und meldet sich bei dir.
            </div>
            <div style={{ fontSize: 12, color: "rgba(26,26,46,0.38)", marginBottom: 28 }}>
              Status: Ausstehend
            </div>
            <button onClick={onClose} style={{
              background: TEAL, color: "#fff", border: "none",
              borderRadius: 14, padding: "12px 32px",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
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
                Erlebnis anfragen
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3 }}>
                {title}
              </div>
              {creatorName && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.45)", marginTop: 3 }}>
                  bei {creatorName}
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
                cursor: "pointer",
              }}>
                Abbrechen
              </button>
              <button
                onClick={handleBuchen}
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
    </div>
  );
}
