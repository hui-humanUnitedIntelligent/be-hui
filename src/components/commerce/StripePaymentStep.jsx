// src/components/commerce/StripePaymentStep.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Stripe Payment Step (Sprint C1: Foundation)
// ═══════════════════════════════════════════════════════════════════
//
// Sprint C1: Komponente ist vorbereitet, aber noch nicht produktiv.
//   - STRIPE_APPEARANCE ist hinterlegt (HUI Design)
//   - loadStripe Import ist vorbereitet
//   - PaymentElement Mount-Logik ist als Kommentar dokumentiert
//   - Schritt 3 im UnterstutzenFlow nutzt noch die bestehende UI
//
// Sprint C2 Aktivierung:
//   1. VITE_STRIPE_PUBLIC_KEY in .env setzen
//   2. Den "AKTIV_SPRINT_C2" Block einkommentieren
//   3. "DEMO_MODE" Block auskommentieren
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { STRIPE_APPEARANCE, COMMERCE_CONFIG } from "../../services/commerceEngine.js";
import { C, haptic } from "../commerce/commerceUtils.js";

// Sprint C2: Diese Imports aktivieren wenn Stripe-Schlüssel vorhanden
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

/**
 * StripePaymentStep — ersetzt Schritt 2+3 im UnterstutzenFlow
 *
 * Props:
 *   items          — Cart-Items
 *   total          — Gesamtbetrag (EUR)
 *   impact         — Impact-Betrag (EUR)
 *   clientSecret   — von create-payment-intent Edge Function
 *   orderId        — von create-payment-intent Edge Function
 *   onSuccess      — Callback nach erfolgreicher Zahlung
 *   onBack         — Zurück zum WerkeKorb
 *
 * Sprint C1: Demo-Modus (kein echter Stripe-Mount)
 * Sprint C2: Echter Stripe Payment Element
 */
export default function StripePaymentStep({
  items = [],
  total = 0,
  impact = 0,
  clientSecret = null,
  orderId = null,
  onSuccess,
  onBack,
  loading: externalLoading = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  // ─── DEMO_MODE (Sprint C1) ──────────────────────────────────────
  // Zeigt das HUI-Design ohne echten Stripe-Mount.
  // Wird in Sprint C2 durch den echten Payment Element ersetzt.
  const isDemoMode = !clientSecret || clientSecret === null;

  async function handleDemoConfirm() {
    haptic("success");
    setLoading(true);
    // Simuliert eine 1.2s Zahlungsverarbeitung
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onSuccess?.({ orderId, demoMode: true });
  }

  // ─── AKTIV_SPRINT_C2 ────────────────────────────────────────────
  // Wenn clientSecret vorhanden: echten Stripe Payment Element mounten.
  // Diese Funktion ersetzt handleDemoConfirm() ab Sprint C2.
  //
  // function StripeForm({ onSuccess, orderId }) {
  //   const stripe   = useStripe();
  //   const elements = useElements();
  //   const [processing, setProcessing] = useState(false);
  //   const [error, setError] = useState(null);
  //
  //   async function handleSubmit(e) {
  //     e.preventDefault();
  //     if (!stripe || !elements) return;
  //     setProcessing(true);
  //     setError(null);
  //     const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
  //       elements,
  //       confirmParams: { return_url: window.location.origin + "/?hui_order=" + orderId },
  //       redirect: "if_required",
  //     });
  //     if (stripeError) {
  //       setError(stripeError.message);
  //       setProcessing(false);
  //       return;
  //     }
  //     if (paymentIntent?.status === "succeeded") {
  //       onSuccess?.({ orderId, paymentIntentId: paymentIntent.id });
  //     }
  //     setProcessing(false);
  //   }
  //   return (
  //     <form onSubmit={handleSubmit}>
  //       <PaymentElement options={{ layout: "tabs" }} />
  //       <button type="submit" disabled={processing}>
  //         {processing ? "Verarbeitung..." : "Jetzt unterstützen"}
  //       </button>
  //       {error && <div style={{ color: C.coral, fontSize: 13 }}>{error}</div>}
  //     </form>
  //   );
  // }
  // ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
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
          {isDemoMode
            ? "Demo-Modus — Stripe noch nicht aktiviert"
            : "Sichere Zahlung via Stripe"}
        </div>
      </div>

      {/* Scroll-Bereich */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "4px 24px 0",
        WebkitOverflowScrolling: "touch",
      }}>

        {/* Demo-Mode Hinweis */}
        {isDemoMode && (
          <div style={{
            padding: "14px 16px", borderRadius: 14,
            background: C.goldPale, border: `1px solid ${C.gold}33`,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: C.gold, fontWeight: 600, marginBottom: 4 }}>
              🔧 Sprint C1 — Demo-Modus
            </div>
            <div style={{ fontSize: 12, color: C.inkMid, lineHeight: 1.5 }}>
              Stripe-Schlüssel noch nicht konfiguriert.
              Der Payment Element wird in Sprint C2 aktiviert.
            </div>
          </div>
        )}

        {/* Stripe Payment Element Placeholder */}
        {/* Sprint C2: Wird durch <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}><StripeForm .../></Elements> ersetzt */}
        <div style={{
          borderRadius: 14, border: `1.5px solid rgba(20,20,34,0.08)`,
          background: C.creamSoft, padding: "20px 16px", marginBottom: 16,
          minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ textAlign: "center", color: C.faint }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              Stripe Payment Element<br />
              <span style={{ fontSize: 11, color: C.faint }}>
                Apple Pay · Google Pay · Kreditkarte · SEPA · Link
              </span>
            </div>
          </div>
        </div>

        {/* Betrag-Zusammenfassung */}
        <div style={{
          padding: "14px 16px", borderRadius: 14,
          background: C.creamSoft, border: `1px solid rgba(20,20,34,0.05)`,
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
              <span style={{ fontSize: 12, color: C.sage, fontVariantNumeric: "tabular-nums" }}>
                aus {COMMERCE_CONFIG.IMPACT_RATE * 100}% Plattformgebühr
              </span>
            </div>
          )}
          <div style={{
            display: "flex", justifyContent: "space-between",
            paddingTop: 8, borderTop: `1px solid rgba(20,20,34,0.06)`,
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

        {error && (
          <div style={{
            padding: "12px 14px", borderRadius: 12,
            background: `${C.coral}11`, border: `1px solid ${C.coral}33`,
            fontSize: 13, color: C.coral, marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {/* Footer — Sticky Button */}
      <div style={{
        padding: "16px 24px",
        paddingBottom: `calc(16px + max(0px, env(safe-area-inset-bottom, 0px)))`,
        flexShrink: 0,
      }}>
        <button
          onClick={isDemoMode ? handleDemoConfirm : undefined}
          disabled={loading || externalLoading}
          style={{
            width: "100%", height: "48px", borderRadius: 16, border: "none",
            background: loading
              ? "rgba(20,20,34,0.07)"
              : `linear-gradient(135deg, ${C.teal} 0%, #14CEC2 100%)`,
            color: loading ? C.muted : "#fff",
            fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
            cursor: loading ? "default" : "pointer",
            outline: "none",
            boxShadow: loading ? "none" : `0 4px 16px rgba(13,196,181,0.18)`,
            transition: "all 240ms ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {loading ? "Wird verarbeitet…" : "Jetzt unterstützen"}
        </button>
        <div style={{
          textAlign: "center", marginTop: 10, fontSize: 11,
          color: C.faint, lineHeight: 1.5,
        }}>
          {isDemoMode
            ? "Demo — keine echte Zahlung"
            : "Verschlüsselt · Gesichert durch Stripe"}
        </div>
      </div>
    </div>
  );
}
