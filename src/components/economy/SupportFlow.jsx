// src/components/economy/SupportFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Talent Unterstützen (Stripe Checkout)
// ═══════════════════════════════════════════════════════════════════
// Ersetzt das Legacy supportService (kein Stripe) durch echten
// Stripe PaymentIntent über die create-support-payment Edge Function
// + StripePaymentStep.
//
// Ablauf:
//   1. form → User wählt Betrag + optionale Nachricht
//   2. loading → create-support-payment Edge Function → clientSecret
//   3. payment → StripePaymentStep (Stripe Elements)
//   4. success → Bestätigung + Notification an Creator
//   5. error → Fehlermeldung
//
// PFLICHT: createPortal → document.body, zIndex >= 10500
// ═══════════════════════════════════════════════════════════════════

import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import StripePaymentStep from "../commerce/StripePaymentStep.jsx";
import { IMPACT_RATE } from "../commerce/commerceUtils.js";

const T = {
  bg:"#FAFAF8", ink:"#1A1A2E", soft:"rgba(26,26,46,0.55)",
  teal:"#16D7C5", coral:"#FF8A6B", border:"rgba(26,26,46,0.08)",
};
const QUICK_AMOUNTS = [3, 5, 10, 20];

let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return; _css = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes sf-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    @keyframes sf-glow{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
    @keyframes sf-success{0%{opacity:0;transform:scale(0.8)}60%{transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
    .sf-tap{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
  `;
  document.head.appendChild(s);
}

export default function SupportFlow({ creator, visible, onClose, sourceType="profile", sourceId=null }) {
  const { t } = useTranslation();
  injectCSS();
  const { user } = useAuth();
  const [amount, setAmount] = useState(5);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState("form"); // form | loading | payment | success | error
  const [errMsg, setErrMsg] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [publishableKey, setPublishableKey] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  if (!visible || !creator) return null;

  const creatorId = creator.id || creator.user_id;
  const creatorName = creator.display_name || creator.name || "dieses Talent";
  const finalAmount = custom ? parseFloat(custom.replace(",", ".")) : amount;

  async function handleSupport() {
    if (!user?.id)    { setErrMsg("Nicht eingeloggt."); setPhase("error"); return; }
    if (!creatorId)   { setErrMsg("Creator-ID fehlt."); setPhase("error"); return; }
    if (user.id === creatorId) { setErrMsg("Du kannst dich nicht selbst unterstützen."); setPhase("error"); return; }
    if (!finalAmount || finalAmount < 0.50) { setErrMsg("Mindestbetrag 0,50 €."); setPhase("error"); return; }

    setPhase("loading");
    setErrMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { setErrMsg("Sitzung abgelaufen — bitte neu anmelden."); setPhase("error"); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const efUrl = `${supabaseUrl}/functions/v1/create-support-payment`;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(efUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": supabaseAnonKey ?? "",
        },
        body: JSON.stringify({
          creator_id: creatorId,
          amount_eur: finalAmount,
          message: message.trim() || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        const msg = result.code === "STRIPE_NOT_CONFIGURED"
          ? "Stripe ist noch nicht konfiguriert. Bitte später versuchen."
          : (result.error || "Zahlung konnte nicht gestartet werden.");
        setErrMsg(msg);
        setPhase("error");
        return;
      }

      if (!result.clientSecret) {
        setErrMsg("Zahlungsgeheimnis fehlt.");
        setPhase("error");
        return;
      }

      setClientSecret(result.clientSecret);
      setPublishableKey(result.publishableKey ?? null);
      setPaymentIntentId(result.paymentIntentId ?? null);
      setPhase("payment");
    } catch (e) {
      setErrMsg(e?.message || "Verbindungsfehler beim Starten der Zahlung.");
      setPhase("error");
    }
  }

  async function handleStripeSuccess({ paymentIntentId: piId }) {
    // Notification an Creator
    await supabase.from("notifications").insert({
      user_id:    creatorId,
      type:       "support_received",
      text:       `${finalAmount.toFixed(2).replace(".", ",")} € Unterstützung von ${user?.display_name || "einem Mitglied"}`,
      read:       false,
      actor_id:   user.id,
      created_at: new Date().toISOString(),
      entity_id:  sourceId || null,
      entity_type: sourceType || null,
      ...(message.trim() ? { metadata: { message: message.trim().slice(0, 500) } } : {}),
    }).catch(() => {});

    setPhase("success");
  }

  // ── Render ──────────────────────────────────────────────────────
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div style={{
        background: T.bg, borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 480,
        padding: "28px 24px 40px",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "sf-rise 0.3s cubic-bezier(.32,1.2,.55,1) both",
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)", margin: "0 auto 24px" }} />

        {/* ── FORM ── */}
        {phase === "form" && (
          <>
            <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 4, textAlign: "center" }}>
              {creatorName} unterstützen
            </div>
            <div style={{ fontSize: 14, color: T.soft, textAlign: "center", marginBottom: 24 }}>
              Eine menschliche Geste — nicht spenden, unterstützen.
            </div>

            {/* Quick Amounts */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setAmount(amt); setCustom(""); }}
                  className="sf-tap"
                  style={{
                    padding: "10px 20px", borderRadius: 14, border: "none",
                    background: amount === amt && !custom ? T.teal : "rgba(26,26,46,0.06)",
                    color: amount === amt && !custom ? "#fff" : T.ink,
                    fontSize: 16, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {amt}€
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  if (e.target.value) setAmount(0);
                }}
                placeholder={t("support.customAmount")}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: `1px solid ${T.border}`, fontSize: 16,
                  textAlign: "center", outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 24 }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("support.personalMessage")}
                maxLength={300}
                style={{
                  width: "100%", minHeight: 70, padding: "12px 14px",
                  borderRadius: 12, border: `1px solid ${T.border}`,
                  fontSize: 14, fontFamily: "inherit", resize: "none",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Impact Info */}
            <div style={{
              background: "rgba(22,215,197,0.06)", borderRadius: 12, padding: "14px 16px",
              marginBottom: 24, fontSize: 13, color: T.soft, lineHeight: 1.6,
            }}>
              <strong style={{ color: T.ink }}>
                {(finalAmount || 0).toFixed(2).replace(".", ",")} €
              </strong> gehen an {creatorName}.
              15% Gebühr für HUI-Plattform, davon fließt ein Teil in den Impact-Pool.
            </div>

            <button
              onClick={handleSupport}
              className="sf-tap"
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
                color: "#fff", fontSize: 16, fontWeight: 600,
                cursor: "pointer", transition: "opacity 0.2s",
                animation: "sf-glow 2.5s ease infinite",
              }}
            >
              {(finalAmount || 0).toFixed(2).replace(".", ",")} € unterstützen
            </button>
          </>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${T.teal}33`, borderTopColor: T.teal,
              borderRadius: "50%", animation: "wkfSpin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <style>{`@keyframes wkfSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: T.soft }}>Zahlung wird vorbereitet…</div>
          </div>
        )}

        {/* ── PAYMENT (Stripe) ── */}
        {/* StripePaymentStep verwaltet seinen eigenen <Elements>-Kontext intern
            (siehe UnterstutzenFlow.jsx/TalentBookingFlow.jsx) — hier NICHT nochmal
            in <Elements> wrappen, das erzeugte einen doppelten/leeren Stripe-
            Kontext und einen Hook-Order-Crash (React #310). */}
        {phase === "payment" && clientSecret && (
          <StripePaymentStep
            total={finalAmount}
            impact={+(finalAmount * IMPACT_RATE).toFixed(2)}
            clientSecret={clientSecret}
            publishableKey={publishableKey}
            orderId={paymentIntentId}
            hideHeader
            onSuccess={handleStripeSuccess}
            onError={() => setPhase("error")}
            onBack={() => setPhase("confirm")}
          />
        )}

        {/* ── SUCCESS ── */}
        {phase === "success" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "48px 32px",
            animation: "sf-success 0.5s cubic-bezier(0.34,1.4,0.64,1) both",
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              background: `radial-gradient(circle at 38% 35%, ${T.teal}, ${T.coral})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24, animation: "sf-glow 2s ease infinite",
              boxShadow: "0 0 48px rgba(22,215,197,0.40)", fontSize: 36,
            }}>✦</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.ink, textAlign: "center", marginBottom: 10 }}>
              Deine Geste ist angekommen
            </div>
            <div style={{ fontSize: 15, color: T.soft, textAlign: "center", lineHeight: 1.6 }}>
              {finalAmount.toFixed(2).replace(".", ",")}€ gehen an<br />
              <strong style={{ color: T.ink }}>{creatorName}</strong>
            </div>
            <button
              onClick={onClose}
              className="sf-tap"
              style={{
                marginTop: 28, padding: "12px 32px", borderRadius: 14, border: "none",
                background: T.teal, color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Fertig
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#FF5B5B", marginBottom: 8 }}>Fehler</div>
            <div style={{ fontSize: 14, color: T.soft, marginBottom: 28, lineHeight: 1.5 }}>
              {errMsg || "Etwas ist schiefgegangen."}
            </div>
            <button
              onClick={() => { setErrMsg(""); setPhase("form"); }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: "rgba(26,26,46,0.08)", color: T.ink, fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Close button */}
        {phase !== "payment" && phase !== "loading" && (
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(26,26,46,0.06)", color: "rgba(26,26,46,0.45)",
              fontSize: 16, cursor: "pointer", lineHeight: 1,
            }}
          >✕</button>
        )}
      </div>
    </div>,
    document.body
  );
}
