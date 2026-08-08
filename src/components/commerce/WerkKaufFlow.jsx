// src/components/commerce/WerkKaufFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Werk Kaufen (Single-Item Stripe Checkout)
// ═══════════════════════════════════════════════════════════════════
// Ersetzt das Legacy salesService.createSale() (kein Stripe) durch
// einen echten Stripe PaymentIntent über die create-payment-intent
// Edge Function + StripePaymentStep.
//
// Ablauf:
//   1. confirm → User sieht Werk + Preis, klickt "Kaufen"
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
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { getStripe } from "../../lib/stripe.js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentStep from "./StripePaymentStep.jsx";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";
import { toast } from "../../lib/useToast.jsx";

let _resonanceHelpers = null;
async function getResonanceHelpers() {
  if (_resonanceHelpers) return _resonanceHelpers;
  try { const m = await import("../../hooks/useCoreEngine.js"); _resonanceHelpers = m.resonanceHelpers; return _resonanceHelpers; }
  catch { return null; }
}

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";

export default function WerkKaufFlow({ werk, onClose = () => {} }) {
  const { user } = useAuth();
  useModalRegistration(true, onClose, "WerkKaufFlow");
  useWizardBodyLock();

  const [phase, setPhase] = useState("confirm"); // confirm | loading | payment | success | error
  const [errMsg, setErrMsg] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [publishableKey, setPublishableKey] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [hasChatted, setHasChatted] = useState(false);
  const [showChatConfirm, setShowChatConfirm] = useState(false);
  const actions = useHuiActions();

  const stripePromise = useMemo(() => getStripe(), []);

  if (!werk) return null;

  const workId    = werk.id || werk._raw?.id;
  const creatorId = werk.author?.id || werk._raw?.user_id || werk._raw?.creator_id || werk.creator_id || werk.user_id;
  const title     = werk.title || werk._raw?.title || werk.name || "Werk";
  const coverUrl  = werk.author?.avatar || werk._raw?.cover_url || werk.cover_url || werk.img;
  const rawPrice  = werk._raw?.price ?? werk.price ?? null;
  const amount    = typeof rawPrice === "string"
    ? parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", "."))
    : typeof rawPrice === "number" ? rawPrice : 0;
  const priceStr  = amount > 0 ? `${amount.toFixed(2).replace(".", ",")} €` : null;

  async function handleKauf() {
    if (!user?.id)    { setErrMsg("Nicht eingeloggt."); setPhase("error"); return; }
    if (!workId)      { setErrMsg("Werk-ID fehlt."); setPhase("error"); return; }
    if (!creatorId)   { setErrMsg("Creator-ID fehlt."); setPhase("error"); return; }
    if (user.id === creatorId) { setErrMsg("Du kannst dein eigenes Werk nicht kaufen."); setPhase("error"); return; }
    if (amount <= 0)  { setErrMsg("Dieses Werk hat keinen Preis."); setPhase("error"); return; }

    setPhase("loading");
    setErrMsg("");

    try {
      // ── Sichtbarkeit-Gate: Verbindungen/Privat-Profile sind nicht kaufbar
      // (server-seitig ohnehin über commerce_price_authority-View geblockt,
      // hier nur für eine klare, verständliche Fehlermeldung statt generischem
      // "Item nicht verfügbar") ──
      const { data: sellerProfile } = await supabase
        .from("profiles").select("focus_type").eq("id", creatorId).maybeSingle();
      if (sellerProfile && sellerProfile.focus_type && sellerProfile.focus_type !== "public") {
        setErrMsg("Dieses Profil ist nicht öffentlich — Käufe sind aktuell deaktiviert.");
        setPhase("error");
        return;
      }

      // ── Stripe PaymentIntent über Edge Function erstellen ──
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
            item_id: workId,
            item_type: "work",
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
    await supabase.from("notifications").insert({
      user_id:    creatorId,
      type:       "work_sold",
      text:       `Dein Werk "${title}" wurde gekauft.`,
      read:       false,
      actor_id:   user.id,
      created_at: new Date().toISOString(),
      entity_id:  workId,
      entity_type: "work",
    }).catch(() => {});

    // HUI Core Engine: Kauf-Resonanz aufzeichnen
    if (user?.id && creatorId && workId) {
      getResonanceHelpers()
        .then(rh => rh?.onWorkPurchased?.(user.id, creatorId, workId))
        .catch(() => {});
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
        animation: "wkfSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        <style>{`@keyframes wkfSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)", margin: "0 auto 24px" }} />

        {/* ── CONFIRM ── */}
        {phase === "confirm" && (
          <>
            {/* Cover */}
            {coverUrl && (
              <div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                <img src={coverUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>{title}</div>
            {priceStr && (
              <div style={{ fontSize: 22, fontWeight: 800, color: TEAL, marginBottom: 20 }}>{priceStr}</div>
            )}

            <div style={{
              background: "rgba(22,215,197,0.06)", borderRadius: 12, padding: "14px 16px",
              marginBottom: 24, fontSize: 13, color: "rgba(26,26,46,0.65)", lineHeight: 1.6,
            }}>
              Deine Zahlung ist sicher bei HUI hinterlegt. Sobald du das Werk erhältst,
              bestätige den Erhalt in deinem Profil — erst dann erhält der Creator seine Auszahlung.
            </div>

            <button
              onClick={handleKauf}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                background: TEAL, color: "#fff", fontSize: 16, fontWeight: 700,
                cursor: "pointer", transition: "opacity 0.2s",
              }}
            >
              {priceStr ? `Kaufen für ${priceStr}` : "Kaufen"}
            </button>
          </>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${TEAL}33`, borderTopColor: TEAL,
              borderRadius: "50%", animation: "wkfSpin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <style>{`@keyframes wkfSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)" }}>Zahlung wird vorbereitet…</div>
          </div>
        )}

        {/* ── PAYMENT (Stripe) ── */}
        {phase === "payment" && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <StripePaymentStep
              total={amount}
              impact={amount * 0.0225}
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
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>Kauf erfolgreich</div>
            {/* Detaillierte Kaufinfo */}
            <div style={{
              background: "rgba(22,215,197,0.06)", border: "1px solid rgba(22,215,197,0.15)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Verkäufer:</span> {werk.author?.name || werk.author?.displayName || "Creator"}
              </div>
              {amount > 0 && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Betrag:</span> {amount.toFixed(2).replace(".", ",")} €
                </div>
              )}
              <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(22,215,197,0.12)" }}>
                Deine Zahlung ist sicher bei HUI hinterlegt. Bestätige den Erhalt in deinem Profil.
              </div>
            </div>

            {/* Chat CTA — mit Ja/Nein-Bestätigung */}
            {creatorId && user?.id && creatorId !== user.id && (
              <div style={{
                marginBottom: 20, padding: "14px 16px", borderRadius: 14,
                background: "rgba(22,215,197,0.06)",
                border: "1.5px solid rgba(22,215,197,0.20)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 2 }}>
                    Mit Verkäufer schreiben
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(26,26,46,0.55)", lineHeight: 1.5 }}>
                    Tausch dich über das Werk aus.
                  </div>
                </div>
                <button
                  onClick={() => setShowChatConfirm(true)}
                  style={{
                    padding: "10px 18px", borderRadius: 12,
                    background: TEAL, color: "#fff",
                    fontSize: 13, fontWeight: 700, border: "none",
                    cursor: "pointer", flexShrink: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Chat
                </button>
              </div>
            )}

            {/* Ja/Nein-Bestätigung für Chat */}
            {showChatConfirm && creatorId && (
              <div style={{
                position: "fixed", inset: 0, zIndex: 10600,
                background: "rgba(20,20,34,0.55)",
                backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "88%", maxWidth: 320,
                  background: "#FAF9F7", borderRadius: 20,
                  padding: "24px 20px", textAlign: "center",
                  boxShadow: "0 12px 48px rgba(20,20,34,0.25)",
                }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
                    Mit {werk.author?.name || werk.author?.displayName || "Verkäufer"} chatten?
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
                    Möchtest du eine Unterhaltung mit dem Verkäufer starten?
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
                        setHasChatted(true);
                        setShowChatConfirm(false);
                        actions[A.OPEN_CHAT]?.({
                          recipient: {
                            id: creatorId,
                            display_name: werk.author?.name || werk.author?.displayName || "Verkäufer",
                            avatar_url: werk.author?.avatar || null,
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

            <button
              onClick={() => {
                if (!hasChatted) {
                  toast.info("Du findest den Verkäufer unter 'Mein Bereich' \u2192 'Käufe/Verkäufe' in deinem Profil.");
                }
                onClose();
              }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: TEAL, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Fertig
            </button>
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
              onClick={() => { setErrMsg(""); setPhase("confirm"); }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: "rgba(26,26,46,0.08)", color: "#1A1A2E", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Close button (nicht im Payment/Loading-Step) */}
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
