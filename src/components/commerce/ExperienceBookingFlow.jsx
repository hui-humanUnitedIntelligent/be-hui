// src/components/commerce/ExperienceBookingFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Erlebnis Buchen (Single-Item Stripe Checkout)
// ═══════════════════════════════════════════════════════════════════
// Ersetzt das Legacy bookingService.create() (kein Stripe) durch
// einen echten Stripe PaymentIntent über die create-payment-intent
// Edge Function + StripePaymentStep.
//
// Ablauf:
//   1. form → User sieht Erlebnis + Preis, schreibt optionale Nachricht, klickt "Buchen"
//   2. loading → create-payment-intent Edge Function → clientSecret
//   3. payment → StripePaymentStep (Stripe Elements)
//   4. success → Bestätigung + Notification an Creator
//   5. error → Fehlermeldung
//
// PFLICHT: createPortal → document.body, zIndex >= 10500
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { IMPACT_RATE } from "./commerceUtils.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { getStripe } from "../../lib/stripe.js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentStep from "./StripePaymentStep.jsx";
import { useSavedPostsContext } from "../../context/SavedPostsContext.jsx";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";

const TEAL = "#16D7C5";

export default function ExperienceBookingFlow({ experience, onClose = () => {} }) {
  const { user } = useAuth();
  useModalRegistration(true, onClose, "ExperienceBookingFlow");
  useWizardBodyLock();
  const { isSaved, toggleSave } = useSavedPostsContext();

  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState("form"); // form | loading | payment | success | error
  const [errMsg, setErrMsg] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [publishableKey, setPublishableKey] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [showChatConfirm, setShowChatConfirm] = useState(false);
  const actions = useHuiActions();

  const stripePromise = useMemo(() => getStripe(), []);

  if (!experience) return null;

  // Normalisiere Experience-Daten aus Feed- und HuiAction-Shapes
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
  const coverUrl  = expObj?._raw?.cover_url || expObj?.cover_url || expObj?.img;

  const saved = isSaved(expId);
  const handleSave = () => {
    if (!expId) return;
    toggleSave(expId, "experience", { title, cover_url: coverUrl, author_name: creatorName });
  };

  async function handleBuchen() {
    if (!user?.id)    { setErrMsg("Nicht eingeloggt."); setPhase("error"); return; }
    if (!expId)       { setErrMsg("Erlebnis-ID fehlt."); setPhase("error"); return; }
    if (!creatorId)   { setErrMsg("Creator-ID fehlt."); setPhase("error"); return; }
    if (user.id === creatorId) { setErrMsg("Du kannst dein eigenes Erlebnis nicht buchen."); setPhase("error"); return; }
    if (amount <= 0)  { setErrMsg("Dieses Erlebnis hat keinen Preis."); setPhase("error"); return; }

    setPhase("loading");
    setErrMsg("");

    try {
      // ── Sichtbarkeit-Gate: Verbindungen/Privat-Profile sind nicht buchbar
      // (server-seitig ohnehin über commerce_price_authority-View geblockt,
      // hier nur für eine klare, verständliche Fehlermeldung) ──
      const { data: sellerProfile } = await supabase
        .from("profiles").select("focus_type").eq("id", creatorId).maybeSingle();
      if (sellerProfile && sellerProfile.focus_type && sellerProfile.focus_type !== "public") {
        setErrMsg("Dieses Profil ist nicht öffentlich — Buchungen sind aktuell deaktiviert.");
        setPhase("error");
        return;
      }

      // ── Stripe PaymentIntent über Edge Function ──
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { setErrMsg("Sitzung abgelaufen — bitte neu anmelden."); setPhase("error"); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const efUrl = `${supabaseUrl}/functions/v1/create-payment-intent`;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(efUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": supabaseAnonKey ?? "",
        },
        body: JSON.stringify({
          orderItems: [{
            item_id: expId,
            item_type: "experience",
            quantity: 1,
          }],
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
      setOrderId(result.orderId ?? null);
      setPhase("payment");
    } catch (e) {
      setErrMsg(e?.message || "Verbindungsfehler beim Starten der Zahlung.");
      setPhase("error");
    }
  }

  async function handleStripeSuccess({ orderId: oid, paymentIntentId }) {
    // Notification an Creator
    if (message.trim()) {
      await supabase.from("notifications").insert({
        user_id:    creatorId,
        type:       "experience_booked",
        text:       `Erlebnis "${title}" wurde gebucht. Nachricht: ${message.trim().slice(0, 100)}`,
        read:       false,
        actor_id:   user.id,
        created_at: new Date().toISOString(),
        entity_id:  expId,
        entity_type: "experience",
      }).catch(() => {});
    } else {
      await supabase.from("notifications").insert({
        user_id:    creatorId,
        type:       "experience_booked",
        text:       `Dein Erlebnis "${title}" wurde gebucht.`,
        read:       false,
        actor_id:   user.id,
        created_at: new Date().toISOString(),
        entity_id:  expId,
        entity_type: "experience",
      }).catch(() => {});
    }

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
        background: "#FDFCFA", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 480,
        padding: "28px 24px 40px",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "ebfSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        <style>{`@keyframes ebfSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)", margin: "0 auto 24px" }} />

        {/* ── FORM ── */}
        {phase === "form" && (
          <>
            {/* Cover */}
            {coverUrl && (
              <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                <img src={coverUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 16 }}>von {creatorName}</div>
            {priceStr && (
              <div style={{ fontSize: 22, fontWeight: 800, color: TEAL, marginBottom: 20 }}>{priceStr}</div>
            )}

            {/* Nachricht an Creator */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>
                Nachricht an {creatorName} (optional)
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="z.B. Terminwünsche, Fragen zum Erlebnis…"
                maxLength={500}
                style={{
                  width: "100%", minHeight: 80, padding: "12px 14px",
                  borderRadius: 12, border: "1px solid rgba(26,26,46,0.12)",
                  fontSize: 14, fontFamily: "inherit", resize: "none",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{
              background: "rgba(22,215,197,0.06)", borderRadius: 12, padding: "14px 16px",
              marginBottom: 24, fontSize: 13, color: "rgba(26,26,46,0.65)", lineHeight: 1.6,
            }}>
              Deine Zahlung ist sicher bei HUI hinterlegt. Nach dem Erlebnis bestätigst du
              den Erhalt in deinem Profil — erst dann erhält der Creator die Auszahlung.
            </div>

            <button
              onClick={handleBuchen}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                background: TEAL, color: "#fff", fontSize: 16, fontWeight: 700,
                cursor: "pointer", transition: "opacity 0.2s",
              }}
            >
              {priceStr ? `Buchen für ${priceStr}` : "Buchen"}
            </button>
          </>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${TEAL}33`, borderTopColor: TEAL,
              borderRadius: "50%", animation: "ebfSpin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <style>{`@keyframes ebfSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)" }}>Zahlung wird vorbereitet…</div>
          </div>
        )}

        {/* ── PAYMENT (Stripe) ── */}
        {phase === "payment" && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <StripePaymentStep
              total={amount}
              impact={+(amount * IMPACT_RATE).toFixed(2)}
              orderId={orderId}
              onSuccess={handleStripeSuccess}
              onError={() => setPhase("error")}
            />
          </Elements>
        )}

        {/* ── SUCCESS ── */}
        {phase === "success" && (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(22,215,197,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M7 14L12 19L21 9" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>Buchung erfolgreich</div>
            {/* Detaillierte Buchungsinfo */}
            <div style={{
              background: "rgba(22,215,197,0.06)", border: "1px solid rgba(22,215,197,0.15)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Anbieter:</span> {creatorName}
              </div>
              {amount > 0 && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Betrag:</span> {amount.toFixed(2).replace(".", ",")} €
                </div>
              )}
              {message.trim() && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Nachricht:</span> {message.trim().length > 80 ? message.trim().slice(0, 80) + "…" : message.trim()}
                </div>
              )}
              <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(22,215,197,0.12)" }}>
                Deine Zahlung ist sicher bei HUI hinterlegt. {creatorName} wurde benachrichtigt.
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: TEAL, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Fertig
            </button>
            {creatorId && (
              <button
                onClick={() => setShowChatConfirm(true)}
                style={{
                  width: "100%", marginTop: 10, padding: "14px 0",
                  borderRadius: 14, border: "1.5px solid rgba(20,20,34,0.10)",
                  background: "transparent", color: "rgba(26,26,46,0.65)",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                  outline: "none", WebkitTapHighlightColor: "transparent",
                }}
              >
                Verkäufer kontaktieren
              </button>
            )}
          </div>
        )}

        {/* Ja/Nein-Bestätigung für Chat mit dem Anbieter */}
        {showChatConfirm && creatorId && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 10600,
            background: "rgba(20,20,34,0.55)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "88%", maxWidth: 320,
              background: "#FDFCFA", borderRadius: 20,
              padding: "24px 20px", textAlign: "center",
              boxShadow: "0 12px 48px rgba(20,20,34,0.25)",
            }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
                Mit {creatorName} chatten?
              </div>
              <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
                Möchtest du wirklich eine Unterhaltung mit dem Verkäufer starten?
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowChatConfirm(false)}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 13,
                    border: "1.5px solid rgba(20,20,34,0.10)",
                    background: "transparent", color: "rgba(26,26,46,0.65)",
                    fontSize: 15, fontWeight: 600, cursor: "pointer",
                    outline: "none", WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Nein
                </button>
                <button
                  onClick={() => {
                    setShowChatConfirm(false);
                    actions[A.OPEN_CHAT]?.({
                      recipient: {
                        id: creatorId,
                        display_name: creatorName,
                        avatar_url: crObj?.avatar_url || crObj?.avatar || null,
                      },
                      source: S.SYSTEM,
                    });
                    onClose();
                  }}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 13,
                    border: "none",
                    background: TEAL, color: "#fff",
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    outline: "none", WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Ja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#FF5B5B", marginBottom: 8 }}>Fehler</div>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", marginBottom: 28, lineHeight: 1.5 }}>
              {errMsg || "Etwas ist schiefgegangen."}
            </div>
            <button
              onClick={() => { setErrMsg(""); setPhase("form"); }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: "rgba(26,26,46,0.08)", color: "#1A1A2E", fontSize: 15, fontWeight: 600, cursor: "pointer",
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
