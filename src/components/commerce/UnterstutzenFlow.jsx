// src/components/commerce/UnterstutzenFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Unterstützen Flow (Sprint C2.1)
// ═══════════════════════════════════════════════════════════════════
// Checkout: 2 Schritte
//   0 → Stripe Payment Element  (inkl. kompakter Impact-Karte)
//   1 → Danke Screen
//
// Entfernt (Sprint C2.1):
//   - Schritt 1 "Deine Unterstützung" (Zusammenfassung)
//   - Schritt 2 Kontaktformular
//   - Schritt 3 Zahlungsart-Picker
//   - ProgressDots (unnötig bei 2 Schritten)
//   - Dead-Code: HuiInput, PaymentCard, PositionZeile, Schritt1–3
//   - Ungenutzte States: form, paymentMethod, loading
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from "react";
import { EASE, DUR } from "../../design/hui.interaction.js";
import {
  C, TYPE_META,
  haptic, calcTotalWithQty, calcImpact,
  uniquePeople, clearCartAfterSuccess,
} from "./commerceUtils.js";
import StripePaymentStep from "./StripePaymentStep.jsx";
import { resolveShippingStrategy, orderService } from "../../services/commerceEngine.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";

// ─────────────────────────────────────────────────────────────────
// ImpactKarte — kompakt, oberhalb des Stripe Elements
// ─────────────────────────────────────────────────────────────────
function ImpactKarte({ impactEur }) {
  if (!impactEur || impactEur <= 0) return null;
  const str = impactEur.toFixed(2).replace(".", ",");
  return (
    <div style={{
      borderRadius:         14,
      background:           "rgba(238,247,242,0.82)",
      backdropFilter:       "blur(12px) saturate(1.2)",
      WebkitBackdropFilter: "blur(12px) saturate(1.2)",
      border:               "1px solid rgba(107,174,143,0.22)",
      padding:              "14px 16px",
      display:              "flex",
      gap:                  12,
      alignItems:           "flex-start",
      marginBottom:         20,
    }}>
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <path d="M14 4C14 4 6 8 6 16C6 20.4 9.6 24 14 24C18.4 24 22 20.4 22 16C22 8 14 4 14 4Z"
          fill="rgba(107,174,143,0.18)" stroke="#6BAE8F" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 24V14" stroke="#6BAE8F" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.sage, marginBottom: 3 }}>
          Gemeinsam Wirkung schaffen
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          Von deiner Unterstützung investiert HUI zusätzlich{" "}
          <span style={{ fontWeight: 700, color: C.sage }}>{str}\u202F€</span>{" "}
          in den gemeinsamen Impact Pool.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PrimaryButton
// ─────────────────────────────────────────────────────────────────
function PrimaryButton({ label, onClick, loading = false, disabled = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onPointerDown={() => { setPressed(true); haptic("light"); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width:        "100%",
        padding:      "18px 0",
        borderRadius: 18,
        border:       "none",
        background:   (disabled || loading)
          ? "rgba(20,20,34,0.07)"
          : `linear-gradient(130deg, ${C.teal} 0%, #1ADDD0 55%, ${C.coral} 150%)`,
        color:        (disabled || loading) ? C.muted : "#fff",
        fontWeight:   700,
        fontSize:     17,
        letterSpacing: 0.1,
        cursor:       (disabled || loading) ? "default" : "pointer",
        outline:      "none",
        boxShadow:    (disabled || loading) ? "none"
          : pressed ? "0 4px 16px rgba(13,196,181,0.20)"
          : "0 10px 32px rgba(13,196,181,0.28), 0 2px 8px rgba(13,196,181,0.15)",
        transform:    pressed ? "scale(0.985)" : "scale(1)",
        transition:   "transform 120ms ease, box-shadow 200ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {loading ? "Einen Moment \u2026" : label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// TealPartikel — Danke-Screen Hintergrundanimation
// ─────────────────────────────────────────────────────────────────
function TealPartikel() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left:  `${10 + i * 11}%`,
    delay: `${i * 0.3}s`,
    size:  3 + (i % 3),
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(100%) scale(0); opacity: 0; }
          20%  { opacity: 0.6; }
          100% { transform: translateY(-120%) scale(1); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: 0, left: p.left,
          width: p.size, height: p.size, borderRadius: "50%",
          background: C.teal, opacity: 0,
          animation: `floatUp 3s ${p.delay} ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Danke Screen
// ─────────────────────────────────────────────────────────────────
function DankeScreen({ items, impact, total, onDiscover, onResonanz }) {
  const pCount = uniquePeople(items);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fade = (delay = "0ms") => ({
    opacity:   visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 500ms ${delay} ease, transform 500ms ${delay} ease`,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%",
      position: "relative", overflow: "hidden" }}>
      <TealPartikel />

      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
        alignItems: "center", padding: "52px 24px 24px", textAlign: "center",
        WebkitOverflowScrolling: "touch",
      }}>
        {/* Checkmark */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.tealPale} 0%, ${C.cream} 80%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 28,
          boxShadow: `0 0 0 16px rgba(13,196,181,0.06), 0 0 0 32px rgba(13,196,181,0.03)`,
          ...fade("0ms"),
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16L12 22L26 8" stroke={C.teal} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 40, fontWeight: 800, color: C.ink,
          letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 16,
          ...fade("100ms"),
        }}>
          Danke.
        </div>

        <div style={{
          fontSize: 16, color: C.muted, lineHeight: 1.65,
          maxWidth: 280, marginBottom: 28,
          ...fade("200ms"),
        }}>
          Deine Unterstützung ist unterwegs.
        </div>

        {/* Menschen */}
        <div style={{
          padding: "16px 20px", borderRadius: 16,
          background: C.creamSoft, border: "1px solid rgba(20,20,34,0.05)",
          width: "100%", marginBottom: 24, textAlign: "left",
          ...fade("300ms"),
        }}>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>Du hast heute</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink,
            letterSpacing: -0.3, lineHeight: 1.3, marginTop: 2 }}>
            {pCount} {pCount === 1 ? "Menschen" : "Menschen"}
          </div>
          {items.length > pCount && (
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              mit {items.length} {items.length === 1 ? "Werk" : "Werken"}
            </div>
          )}
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>unterstützt.</div>
        </div>

        {/* Impact */}
        <div style={{ width: "100%", marginBottom: 32, ...fade("400ms") }}>
          <ImpactKarte impactEur={impact} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "16px 24px",
        paddingBottom: `calc(16px + max(0px, env(safe-area-inset-bottom, 0px)))`,
        flexShrink: 0, ...fade("500ms"),
      }}>
        <PrimaryButton label="Weiter entdecken" onClick={onDiscover} />
        <button onClick={onResonanz} style={{
          width: "100%", marginTop: 10, padding: "14px 0",
          borderRadius: 14, border: "1.5px solid rgba(20,20,34,0.10)",
          background: "transparent", color: C.inkMid,
          fontSize: 15, fontWeight: 600, cursor: "pointer",
          outline: "none", WebkitTapHighlightColor: "transparent",
        }}>
          Zum Resonanz Center
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  HAUPT-KOMPONENTE
// ═══════════════════════════════════════════════════════════════════
export default function UnterstutzenFlow({
  items = [],
  onClose,
  onUnterstuetzen,
  onDiscover,
  onClearCart,
  onResonanzCenter,
}) {
  const { user } = useAuth();

  // 0 = Stripe Payment  |  1 = Danke
  const [step,         setStep]         = useState(0);
  const [visible,      setVisible]      = useState(false);
  const [slideDir,     setSlideDir]     = useState(1);
  const [animating,    setAnimating]    = useState(false);

  // Stripe
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId,      setOrderId]      = useState(null);
  const [stripeError,  setStripeError]  = useState(null);
  const [piLoading,    setPiLoading]    = useState(false);

  const total  = calcTotalWithQty(items);
  const impact = calcImpact(total);

  // Slide-Animation
  function goTo(nextStep, dir = 1) {
    if (animating) return;
    setSlideDir(dir);
    setAnimating(true);
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
      setTimeout(() => setAnimating(false), 350);
    }, 200);
  }

  // Einblenden beim Öffnen
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Payment Intent erstellen (direkt beim Öffnen des Flows)
  useEffect(() => {
    if (clientSecret || piLoading || !user || !items.length) return;
    createPaymentIntent();
  }, [user]);

  async function createPaymentIntent() {
    setPiLoading(true);
    setStripeError(null);
    try {
      const shippingStrategy = resolveShippingStrategy(items);
      const payload          = orderService.buildOrderPayload(items, shippingStrategy, user?.id);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Payment Intent fehlgeschlagen");
      }
      if (result.code === "STRIPE_NOT_CONFIGURED") {
        throw new Error("Stripe ist noch nicht aktiviert. Bitte den Administrator kontaktieren.");
      }

      setClientSecret(result.clientSecret);
      setOrderId(result.orderId || null);
    } catch (e) {
      console.error("[UnterstutzenFlow] PI Fehler:", e);
      setStripeError(e?.message || "Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setPiLoading(false);
    }
  }

  async function handleStripeSuccess({ orderId: oid, paymentIntentId }) {
    haptic("success");
    try { await onUnterstuetzen?.(items, {}, "stripe"); } catch {}
    goTo(1);
  }

  function handleStripeError(err) {
    setStripeError(err?.message || "Zahlung fehlgeschlagen.");
  }

  const isSuccess = step === 1;

  // Slide-Keyframes
  const slideIn = {
    opacity:   visible ? 1 : 0,
    transform: visible
      ? "translateX(0)"
      : `translateX(${slideDir > 0 ? "28px" : "-28px"})`,
    transition: `opacity 280ms ${EASE?.smooth ?? "ease"}, transform 280ms ${EASE?.smooth ?? "ease"}`,
  };

  return (
    <div style={{
      position:        "fixed",
      inset:           0,
      zIndex:          9100,
      background:      "rgba(20,20,34,0.52)",
      backdropFilter:  "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display:         "flex",
      alignItems:      "flex-end",
      WebkitTapHighlightColor: "transparent",
    }}>
      <div style={{
        width:           "100%",
        maxWidth:        480,
        margin:          "0 auto",
        background:      C.cream,
        borderRadius:    "28px 28px 0 0",
        boxShadow:       "0 -8px 48px rgba(20,20,34,0.18)",
        overflow:        "hidden",
        display:         "flex",
        flexDirection:   "column",
        maxHeight:       "92dvh",
        minHeight:       "60dvh",
      }}>
        {/* Header */}
        {!isSuccess && (
          <div style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "20px 20px 0",
            flexShrink:     0,
          }}>
            {/* Leer — kein Zurück-Button (kein vorheriger Schritt) */}
            <div style={{ width: 36 }} />

            {/* Titel */}
            <div style={{ fontSize: 15, fontWeight: 700, color: C.inkMid, letterSpacing: -0.2 }}>
              Zahlung
            </div>

            {/* Schließen */}
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "none", background: "rgba(20,20,34,0.06)",
                color: C.inkMid, fontSize: 18, fontWeight: 400,
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                outline: "none", WebkitTapHighlightColor: "transparent",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div style={{ ...slideIn, height: "100%" }}>

            {/* Step 0: Stripe Payment */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "55dvh" }}>

                {/* Impact-Karte (kompakt, oberhalb Stripe) */}
                <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
                  <ImpactKarte impactEur={impact} />
                </div>

                {/* Stripe Payment Step */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  {stripeError ? (
                    /* Fehler-Zustand */
                    <div style={{
                      display: "flex", flexDirection: "column", height: "100%",
                      padding: "20px 24px",
                    }}>
                      <div style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 16,
                      }}>
                        <div style={{ fontSize: 28 }}>⚠️</div>
                        <div style={{
                          padding: "14px 16px", borderRadius: 14,
                          background: `rgba(244,115,85,0.08)`,
                          border: `1px solid rgba(244,115,85,0.25)`,
                          fontSize: 14, color: C.coral, lineHeight: 1.6,
                          textAlign: "center", maxWidth: 280,
                        }}>
                          {stripeError}
                        </div>
                        <button
                          onClick={createPaymentIntent}
                          disabled={piLoading}
                          style={{
                            padding: "12px 28px", borderRadius: 14,
                            border: `1.5px solid ${C.teal}`,
                            background: "transparent", color: C.teal,
                            fontSize: 14, fontWeight: 600, cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          {piLoading ? "Moment …" : "Erneut versuchen"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Stripe Payment Element */
                    <StripePaymentStep
                      total={total}
                      impact={impact}
                      clientSecret={clientSecret}
                      orderId={orderId}
                      onSuccess={handleStripeSuccess}
                      onError={handleStripeError}
                      onBack={onClose}
                      hideHeader={true}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Danke */}
            {step === 1 && (
              <DankeScreen
                items={items}
                impact={impact}
                total={total}
                onDiscover={() => { onClearCart?.(); onClose?.(); onDiscover?.(); }}
                onResonanz={() => { onClearCart?.(); onClose?.(); onResonanzCenter?.(); }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
