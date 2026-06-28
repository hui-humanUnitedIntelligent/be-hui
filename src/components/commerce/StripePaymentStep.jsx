// src/components/commerce/StripePaymentStep.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Stripe Payment Element (Sprint C2: AKTIV)
// ═══════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { STRIPE_APPEARANCE, COMMERCE_CONFIG } from "../../services/commerceEngine.js";
import { C, haptic } from "../commerce/commerceUtils.js";
import stripePublishableKey from "../../config/stripe-publishable-key.json";

function resolveStripeKey(publishableKey) {
  return publishableKey
    || import.meta.env.VITE_STRIPE_PUBLIC_KEY
    || stripePublishableKey.key
    || "";
}

// ─────────────────────────────────────────────────────────────────
// Inner Form — innerhalb von <Elements> gemountet
// ─────────────────────────────────────────────────────────────────
function StripeForm({ total, impact, orderId, onSuccess, onError }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error,      setError     ] = useState(null);

  // DEBUG — zeigt ob stripe geladen ist
  console.log("[STRIPE] StripeForm mounted — stripe:", !!stripe, "elements:", !!elements);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    haptic("light");
    setProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL nur bei Redirect-Zahlungsarten (SEPA etc.)
        return_url: `${window.location.origin}/?hui_order=${orderId}&status=success`,
      },
      redirect: "if_required", // kein Redirect bei Karte/Apple Pay/Google Pay
    });

    if (stripeError) {
      const msg = stripeError.type === "card_error" || stripeError.type === "validation_error"
        ? stripeError.message
        : "Zahlung fehlgeschlagen. Bitte erneut versuchen.";
      setError(msg);
      setProcessing(false);
      onError?.(stripeError);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      haptic("success");
      onSuccess?.({ orderId, paymentIntentId: paymentIntent.id });
    } else if (paymentIntent?.status === "requires_action") {
      // 3D Secure — Stripe übernimmt den Redirect
      setProcessing(false);
    } else {
      setError("Unbekannter Zahlungsstatus. Bitte Support kontaktieren.");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>

      {/* Inhalt — Parent-Sheet scrollt (kein verschachtelter Clip) */}
      <div style={{ padding: "4px 24px 0" }}>

        {/* Stripe Payment Element */}
        <div style={{ marginBottom: 20 }}>
          <PaymentElement
            options={{
              layout:           "tabs",
              defaultValues:    { billingDetails: { address: { country: "AT" } } },
              fields:           { billingDetails: { address: { country: "never" } } },
              wallets:          { applePay: "auto", googlePay: "auto" },
            }}
            onReady={() => console.log("[STRIPE] PaymentElement onReady ✅")}
            onLoadError={(e) => console.error("[STRIPE] PaymentElement onLoadError ❌", e)}
            onChange={(e) => console.log("[STRIPE] PaymentElement onChange", e.complete, e.value?.type)}
          />
        </div>

        {/* Betrag-Zusammenfassung */}
        <div style={{
          padding: "14px 16px", borderRadius: 14,
          background: C.creamSoft, border: "1px solid rgba(20,20,34,0.05)",
          marginBottom: 16,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginBottom: 8, alignItems: "center",
          }}>
            <span style={{ fontSize: 13, color: C.muted }}>Unterstützung</span>
            <span style={{ fontSize: 13, color: C.inkMid, fontVariantNumeric: "tabular-nums" }}>
              {total.toFixed(2).replace(".", ",")} €
            </span>
          </div>
          {impact > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 8,
            }}>
              <span style={{ fontSize: 12, color: C.sage }}>🌱 Impact Pool</span>
              <span style={{ fontSize: 12, color: C.sage }}>
                {impact.toFixed(2).replace(".", ",")} € (intern)
              </span>
            </div>
          )}
          <div style={{
            display: "flex", justifyContent: "space-between",
            paddingTop: 8, borderTop: "1px solid rgba(20,20,34,0.06)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Gesamt</span>
            <span style={{
              fontSize: 16, fontWeight: 800, color: C.ink,
              fontVariantNumeric: "tabular-nums", letterSpacing: -0.3,
            }}>
              {total.toFixed(2).replace(".", ",")} €
            </span>
          </div>
        </div>

        {/* Fehler-Anzeige */}
        {error && (
          <div style={{
            padding: "12px 14px", borderRadius: 12,
            background: `${C.coral}11`, border: `1px solid ${C.coral}33`,
            fontSize: 13, color: C.coral, marginBottom: 12, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {/* Bezahlen-Button — scrollt mit, Clearance via Parent paddingBottom */}
      <div style={{
        padding: "16px 24px",
        paddingBottom: `calc(16px + env(safe-area-inset-bottom, 0px))`,
        flexShrink: 0,
      }}>
        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            width: "100%", height: "48px", borderRadius: 16, border: "none",
            background: processing
              ? "rgba(20,20,34,0.07)"
              : `linear-gradient(135deg, ${C.teal} 0%, #14CEC2 100%)`,
            color:     processing ? C.muted : "#fff",
            fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
            cursor:    processing ? "default" : "pointer",
            outline:   "none",
            boxShadow: processing ? "none" : "0 4px 16px rgba(13,196,181,0.18)",
            transition: "all 240ms ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {processing ? "Wird verarbeitet…" : "Jetzt unterstützen"}
        </button>
        <div style={{
          textAlign: "center", marginTop: 10, fontSize: 11,
          color: C.faint, lineHeight: 1.5,
        }}>
          Verschlüsselt · Gesichert durch Stripe
        </div>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Export — wrapped in <Elements>
// ─────────────────────────────────────────────────────────────────
export default function StripePaymentStep({
  total    = 0,
  impact   = 0,
  clientSecret,
  publishableKey = null,
  orderId  = null,
  onSuccess,
  onError,
  onBack,
  hideHeader = false,  // C2.1: Header wird vom UnterstutzenFlow gesteuert
}) {
  const stripeKey = resolveStripeKey(publishableKey);
  const stripePromise = useMemo(
    () => (stripeKey ? loadStripe(stripeKey) : null),
    [stripeKey],
  );

  console.log("[STRIPE] StripePaymentStep mounted — clientSecret:", clientSecret ? clientSecret.slice(0,20)+"..." : "NULL");
  console.log("[STRIPE] loadStripe key:", stripeKey ? stripeKey.slice(0,20)+"..." : "LEER/FEHLEND");

  if (!stripePromise) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", height: "100%",
        alignItems: "center", justifyContent: "center", padding: "40px 24px",
      }}>
        <div style={{ fontSize: 14, color: C.coral, textAlign: "center", lineHeight: 1.6 }}>
          Stripe Publishable Key fehlt. Bitte VITE_STRIPE_PUBLIC_KEY in Vercel setzen.
        </div>
      </div>
    );
  }

  // clientSecret fehlt noch (Edge Function liefert ihn)
  if (!clientSecret) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", height: "100%",
        alignItems: "center", justifyContent: "center", padding: "40px 24px",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `3px solid ${C.tealGlow}`,
          borderTopColor: C.teal,
          animation: "spin 0.8s linear infinite",
          marginBottom: 16,
        }} />
        <div style={{ fontSize: 14, color: C.muted }}>Zahlung wird vorbereitet…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: STRIPE_APPEARANCE,
    locale: "de",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* Header — nur wenn nicht eingebettet */}
      {!hideHeader && (
        <div style={{ padding: "28px 24px 16px", flexShrink: 0 }}>
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: 13, padding: 0, marginBottom: 16,
            WebkitTapHighlightColor: "transparent",
          }}>
            ← Zurück
          </button>
          <div style={{
            fontSize: 24, fontWeight: 800, color: C.ink,
            letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 6,
          }}>
            Zahlung
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            Sichere Zahlung via Stripe
          </div>
        </div>
      )}

      {/* Stripe Elements Context */}
      <Elements stripe={stripePromise} options={options}>
        <StripeForm
          total={total}
          impact={impact}
          orderId={orderId}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
}
