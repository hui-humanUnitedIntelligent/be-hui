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

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { invalidateOrbStageCache } from "../../hooks/useOrbGrowthStage.js";
import { autoCreateOrReopenChat } from "../../lib/chatContext.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { IMPACT_RATE } from "./commerceUtils.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import StripePaymentStep from "./StripePaymentStep.jsx";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";
import { toast } from "../../lib/useToast.jsx";
import { generateReceipt } from "../../lib/generateReceipt.js";
import { optimizeCard } from "../../lib/perfUtils.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";
import { resolveShippingStrategy } from "../../services/commerceEngine.js";

let _resonanceHelpers = null;
async function getResonanceHelpers() {
  if (_resonanceHelpers) return _resonanceHelpers;
  try { const m = await import("../../hooks/useCoreEngine.js"); _resonanceHelpers = m.resonanceHelpers; return _resonanceHelpers; }
  catch { return null; }
}

import ShippingAddressModal from "./ShippingAddressModal.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";

export default function WerkKaufFlow({ werk, onClose = () => {} }) {
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
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
  const [selectedVariant, setSelectedVariant] = useState(null); // VARIANTS-001
  const [shippingAddress, setShippingAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const actions = useHuiActions();

  if (!werk) return null;

  const workId    = werk.id || werk._raw?.id;
  const creatorId = werk.author?.id || werk._raw?.user_id || werk._raw?.creator_id || werk.creator_id || werk.user_id;
  const title     = werk.title || werk._raw?.title || werk.name || t("wkf.fallbackWerk");
  const coverUrl  = werk.author?.avatar || werk._raw?.cover_url || werk.cover_url || werk.img;
  const rawPrice  = werk._raw?.price ?? werk.price ?? null;
  const amount    = typeof rawPrice === "string"
    ? parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", "."))
    : typeof rawPrice === "number" ? rawPrice : 0;
  const priceStr  = amount > 0 ? `${amount.toFixed(2).replace(".", ",")} €` : null;

  // VARIANTS-001: Varianten aus dem Werk extrahieren
  const variants = werk?._raw?.variants || werk?.variants || null;
  const hasVariants = werk?._raw?.has_variants || werk?.has_variants || false;
  const availableVariants = (hasVariants && Array.isArray(variants))
    ? variants.filter(v => (v.stock_available || 0) > 0)
    : [];
  const activeVariant = availableVariants.find(v => v.id === selectedVariant) || null;
  const variantPrice = activeVariant?.price != null && activeVariant.price > 0
    ? activeVariant.price
    : null;
  const displayPrice = variantPrice != null ? variantPrice : amount;
  const displayPriceStr = displayPrice > 0 ? `${displayPrice.toFixed(2).replace(".", ",")} €` : priceStr;

  // BUGFIX (2026-08-16): resolveShippingStrategy statt hartem Adress-Zwang —
  // digitale Werke/Services brauchen keine Lieferadresse.
  const shippingStrategy = resolveShippingStrategy([{ id: workId, type: "work", _raw: werk?._raw || werk }]);
  const needsAddress = shippingStrategy.needsShippingAddress;

  const isUnique    = werk?._raw?.is_unique !== false;
  const stockTotal   = werk?._raw?.stock_total ?? 1;
  const stockAvail   = werk?._raw?.stock_available ?? 1;
  const canSelectQty = !isUnique && !hasVariants && stockAvail > 1;
  const maxQty       = Math.min(stockAvail, 99);
  const shippingCost = werk?._raw?.shipping_cost ?? 0;
  const hasShipping  = (werk?._raw?.shipping_available || werk?._raw?.shipping) && shippingCost > 0;
  const totalPrice   = displayPrice * quantity;
  const totalShipping = hasShipping ? shippingCost * quantity : 0;
  const grandTotal   = totalPrice + totalShipping;

  async function handleKauf(addressOverride = null) {
    const address = addressOverride || shippingAddress;
    // Adressabfrage: Physisches Werk ohne Adresse -> erst AdressModal anzeigen
    if (needsAddress && !address) {
      setShowAddressModal(true);
      return;
    }
    if (!user?.id)    { setErrMsg(t("wkf.errNotLoggedIn")); setPhase("error"); return; }
    if (!workId)      { setErrMsg(t("wkf.errWerkId")); setPhase("error"); return; }
    if (!creatorId)   { setErrMsg(t("wkf.errCreatorId")); setPhase("error"); return; }
    if (user.id === creatorId) { setErrMsg(t("wkf.errSelfBuy")); setPhase("error"); return; }
    if (amount <= 0)  { setErrMsg(t("wkf.errNoPrice")); setPhase("error"); return; }

    setPhase("loading");
    setErrMsg("");

    try {
      // COMMERCE-VIEW-FIX (2026-08-16): focus_type-Gate entfernt.
      // commerce_price_authority View filtert bereits korrekt.
      // Das focus_type='public'-Filter blockierte legitime Verkaeufer mit hybrid.

      // ── Stripe PaymentIntent über Edge Function erstellen ──
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { setErrMsg(t("wkf.errSession")); setPhase("error"); return; }

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
            quantity: Math.min(quantity, maxQty),
            // VARIANTS-001: Varianten-Auswahl mitsenden
            variant_id: activeVariant?.id || null,
            variant_name: activeVariant?.name || null,
          }],
          // BUGFIX (2026-08-16): Lieferadresse wurde erfasst, aber nie an die
          // Edge Function gesendet — orders.shipping_address blieb immer leer.
          shipping_address: address || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        const msg = result.code === "STRIPE_NOT_CONFIGURED"
          ? t("wkf.errStripeNotConfigured")
          : (result.error || t("wkf.errPaymentStart"));
        setErrMsg(msg);
        setPhase("error");
        return;
      }

      if (!result.clientSecret) {
        setErrMsg(t("wkf.errNoSecret"));
        setPhase("error");
        return;
      }

      setClientSecret(result.clientSecret);
      setPublishableKey(result.publishableKey ?? null);
      setOrderId(result.orderId ?? null);
      setPhase("payment");
    } catch (e) {
      setErrMsg(e?.message || t("wkf.errConnection"));
      setPhase("error");
    }
  }

  async function handleStripeSuccess({ orderId: oid, paymentIntentId }) {
    // Notification an Creator
    // FIX (2026-08-16): text/read → title/body/is_read (gleicher Bug wie
    // order_shipped) — useNotifications.jsx select() liest title,body,is_read.
    await supabase.from("notifications").insert({
      user_id:    creatorId,
      type:       "work_sold",
      title:      t("wkf.notifSold", { title }),
      body:       `Dein Werk "${title}" wurde gekauft.`,
      is_read:    false,
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

    // FIX (2026-08-13): Kauf zaehlt in rpc_get_orb_growth_stage als
    // Aktivitaet -> Cache invalidieren, sonst haengt der Orb bis zu
    // 5 Min. auf altem Wert.
    invalidateOrbStageCache(user?.id);

    // CHAT-LOGIK v2 (2026-08-22): Automatisch Chat mit Verkäufer erstellen/öffnen
    if (user?.id && creatorId && user.id !== creatorId) {
      autoCreateOrReopenChat({
        userId:       user.id,
        otherUserId:  creatorId,
        bookingId:    oid || workId,
        bookingType:  "werk",
        bookingTitle: title || werk?.title || t("wkf.werkKaufTitle"),
      }).catch((e) => console.warn("[CHAT-V2] autoCreateOrReopenChat:", e?.message));
    }

    setPhase("success");
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
    {createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div style={{
        background: "#FDFCFA", borderRadius: "24px 24px 0 0", transform: sheetTransform, transition: sheetTransition,
        width: "100%", maxWidth: 480,
        padding: "28px 24px 40px",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "wkfSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        <style>{`@keyframes wkfSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* Handle */}
        <div {...dragHandlers} style={{ touchAction:"none", cursor:"grab", width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)", margin: "0 auto 24px" }} />

        {/* ── CONFIRM ── */}
        {phase === "confirm" && (
          <>
            {/* Cover */}
            {coverUrl && (
              <div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                <img src={optimizeCard(coverUrl)} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>{title}</div>
            {displayPriceStr && !hasVariants && (
              <div style={{ fontSize: 22, fontWeight: 600, color: TEAL, marginBottom: 8 }}>{displayPriceStr}</div>
            )}

            {/* COMMERCE-QTY-001 (2026-08-16): Stock-Anzeige + Mengenauswahl */}
            {!hasVariants && (
              <div style={{ marginBottom: 20 }}>
                {/* Stock-Badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 12, fontWeight: 600,
                  color: stockAvail > 0 ? TEAL : "rgba(26,26,46,0.35)",
                  background: stockAvail > 0 ? "rgba(22,215,197,0.08)" : "rgba(26,26,46,0.05)",
                  border: "1px solid rgba(22,215,197,0.18)",
                  borderRadius: 99, padding: "4px 10px", marginBottom: 12,
                }}>
                  {stockAvail} von {stockTotal} verfugbar
                </div>

                {/* Mengenauswahl — nur bei Massenware */}
                {canSelectQty && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{t("wkf.labelQuantity")}</span>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(26,26,46,0.10)",
                        background: quantity <= 1 ? "rgba(26,26,46,0.03)" : "#fff",
                        fontSize: 18, fontWeight: 600, color: "#1A1A2E",
                        cursor: quantity <= 1 ? "not-allowed" : "pointer",
                        opacity: quantity <= 1 ? 0.4 : 1, fontFamily: "inherit",
                      }}
                    >-</button>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E", minWidth: 30, textAlign: "center" }}>{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                      disabled={quantity >= maxQty}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(26,26,46,0.10)",
                        background: quantity >= maxQty ? "rgba(26,26,46,0.03)" : "#fff",
                        fontSize: 18, fontWeight: 600, color: "#1A1A2E",
                        cursor: quantity >= maxQty ? "not-allowed" : "pointer",
                        opacity: quantity >= maxQty ? 0.4 : 1, fontFamily: "inherit",
                      }}
                    >+</button>
                    <span style={{ fontSize: 11, color: "rgba(26,26,46,0.40)" }}>max. {maxQty}</span>
                  </div>
                )}

                {/* Versandkosten-Anzeige */}
                {hasShipping && (
                  <div style={{
                    fontSize: 12, color: "rgba(26,26,46,0.55)", marginBottom: 4,
                  }}>
                    Versand: {shippingCost.toFixed(2).replace(".", ",")} EUR
                    {quantity > 1 && ` x ${quantity} = ${totalShipping.toFixed(2).replace(".", ",")} EUR`}
                  </div>
                )}
              </div>
            )}

            {/* Preis-Zusammenfassung bei Mengenauswahl > 1 */}
            {canSelectQty && quantity > 1 && !hasVariants && (
              <div style={{
                background: "rgba(22,215,197,0.06)", borderRadius: 12, padding: "10px 14px",
                marginBottom: 16, fontSize: 13, color: "rgba(26,26,46,0.65)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>{t("wkf.subtotal")}</span>
                  <span style={{ fontWeight: 600 }}>{totalPrice.toFixed(2).replace(".", ",")} EUR</span>
                </div>
                {totalShipping > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>{t("wkf.shipping")}</span>
                    <span style={{ fontWeight: 600 }}>{totalShipping.toFixed(2).replace(".", ",")} EUR</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid rgba(22,215,197,0.15)" }}>
                  <span style={{ fontWeight: 600 }}>{t("wkf.total")}</span>
                  <span style={{ fontWeight: 600, color: TEAL, fontSize: 15 }}>{grandTotal.toFixed(2).replace(".", ",")} EUR</span>
                </div>
              </div>
            )}

            {/* VARIANTS-001: Varianten-Auswahl */}
            {hasVariants && availableVariants.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 10 }}>
                  Variante auswählen
                </div>
                {availableVariants.map((v, i) => {
                  const isSelected = selectedVariant === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 12,
                        border: isSelected ? `1.5px solid ${TEAL}` : "1px solid rgba(26,26,46,0.08)",
                        background: isSelected ? "rgba(22,215,197,0.06)" : "#fff",
                        marginBottom: 8, cursor: "pointer", fontFamily: "inherit",
                        textAlign: "left", transition: "all 0.15s",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{v.name}</div>
                        {v.description && (
                          <div style={{ fontSize: 12, color: "rgba(26,26,46,0.45)", marginTop: 2 }}>{v.description}</div>
                        )}
                        <div style={{ fontSize: 11.5, color: TEAL, fontWeight: 600, marginTop: 3 }}>
                          {t("wkf.variantStock", { avail: v.stock_available, total: v.stock_total })}
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: TEAL }}>
                        {v.price != null && v.price > 0 ? `${parseFloat(v.price).toFixed(2).replace(".", ",")} €` : priceStr || ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {hasVariants && availableVariants.length === 0 && (
              <div style={{ fontSize: 14, color: "rgba(26,26,46,0.45)", marginBottom: 20, textAlign: "center" }}>
                Alle Varianten sind ausverkauft.
              </div>
            )}

            {/* Preisanzeige bei Varianten-Auswahl */}
            {hasVariants && activeVariant && (
              <div style={{ fontSize: 22, fontWeight: 600, color: TEAL, marginBottom: 20 }}>
                {displayPriceStr}
              </div>
            )}

            <div style={{
              background: "rgba(22,215,197,0.06)", borderRadius: 12, padding: "14px 16px",
              marginBottom: 24, fontSize: 13, color: "rgba(26,26,46,0.65)", lineHeight: 1.6,
            }}>
            {shippingAddress && (
              <div style={{
                background: "rgba(22,215,197,0.04)", borderRadius: 12, padding: "12px 14px",
                marginBottom: 14, fontSize: 13, color: "rgba(26,26,46,0.65)", lineHeight: 1.5,
                border: "1px solid rgba(22,215,197,0.12)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEAL, marginBottom: 4 }}>
                  LIEFERADRESSE
                </div>
                {shippingAddress.full.split("\n").map((line, i) => (
                  <div key={i} style={{ fontSize: 13, color: "rgba(26,26,46,0.55)" }}>{line}</div>
                ))}
                <button
                  onClick={() => setShowAddressModal(true)}
                  style={{
                    marginTop: 6, fontSize: 12, color: TEAL, fontWeight: 600,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    fontFamily: "inherit",
                  }}
                >
                  Adresse ändern
                </button>
              </div>
            )}
                          {t("wkf.escrowInfo")}
            </div>

            <button
              onClick={handleKauf}
              disabled={hasVariants && !activeVariant}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                background: (hasVariants && !activeVariant) ? "rgba(22,215,197,0.3)" : TEAL,
                color: "#fff", fontSize: 16, fontWeight: 600,
                cursor: (hasVariants && !activeVariant) ? "not-allowed" : "pointer",
                transition: "opacity 0.2s", opacity: (hasVariants && !activeVariant) ? 0.6 : 1,
              }}
            >
              {hasVariants && !activeVariant
                ? t("wkf.btnPleaseVariant")
                : shippingAddress
                  ? (grandTotalStr ? t("wkf.btnBuyFor", { price: grandTotalStr }) : t("wkf.btnBuy"))
                  : (displayPriceStr ? t("wkf.btnNext", { price: displayPriceStr }) : t("wkf.btnNextShipping"))}
            </button>
          </>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${TEAL}33`, borderTopColor: TEAL,
              borderRadius: "50%", animation: "wkfSpin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <style>{`@keyframes wkfSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)" }}>{t("wkf.loadingPayment")}</div>
          </div>
        )}

        {/* ── PAYMENT (Stripe) ── */}
        {/* StripePaymentStep verwaltet seinen eigenen <Elements>-Kontext intern
            (siehe UnterstutzenFlow.jsx als Referenz-Implementierung) — hier NICHT
            nochmal in <Elements> wrappen, das erzeugte einen doppelten/leeren
            Stripe-Kontext und einen Hook-Order-Crash (React #310). */}
        {phase === "payment" && clientSecret && (
          <StripePaymentStep
            total={grandTotal}
            impact={+(grandTotal * IMPACT_RATE).toFixed(2)}
            clientSecret={clientSecret}
            publishableKey={publishableKey}
            orderId={orderId}
            hideHeader
            onSuccess={handleStripeSuccess}
            onError={() => setPhase("error")}
            onBack={() => setPhase("confirm")}
          />
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
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>{t("wkf.successTitle")}</div>
            {/* Detaillierte Kaufinfo */}
            <div style={{
              background: "rgba(22,215,197,0.06)", border: "1px solid rgba(22,215,197,0.15)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A2E", marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{t("wkf.labelSeller")}</span> {werk.author?.name || werk.author?.displayName || t("wkf.fallbackCreator")}
              </div>
              {quantity > 1 && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{t("wkf.labelQuantity")}</span> {quantity} x {displayPrice.toFixed(2).replace(".", ",")} EUR
                </div>
              )}
              {totalShipping > 0 && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{t("wkf.labelShipping")}</span> {totalShipping.toFixed(2).replace(".", ",")} EUR
                </div>
              )}
              {grandTotal > 0 && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{t("wkf.labelTotal")}</span> {grandTotal.toFixed(2).replace(".", ",")} EUR
                </div>
              )}
              <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(22,215,197,0.12)" }}>
                {t("wkf.escrowInfoShort")}
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginBottom: 2 }}>
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
                    fontSize: 13, fontWeight: 600, border: "none",
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
                  <div style={{ fontSize: 17, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>
                    Mit {werk.author?.name || werk.author?.displayName || t("wkf.fallbackCreator")} chatten?
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
                    {t("wkf.chatDesc")}
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
                            display_name: werk.author?.name || werk.author?.displayName || t("wkf.fallbackCreator"),
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
                        fontSize: 15, fontWeight: 600, cursor: "pointer",
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
                  toast.info(t("wkf.sellerHint"));
                }
                onClose();
              }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: TEAL, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              Fertig
            </button>
            <button
              onClick={async () => {
                try {
                  const { data: prof } = await supabase.from("profiles")
                    .select("email, website").eq("id", creatorId).maybeSingle();
                  await generateReceipt({
                    offerTitle: title || t("wkf.fallbackWerk"),
                    sellerName: werk.author?.name || werk.author?.displayName || t("wkf.fallbackCreator"),
                    sellerEmail: prof?.email || null,
                    sellerWebsite: prof?.website || null,
                    amountEur: amount,
                    bookingId: orderId || null,
                    offerId: workId || null,
                    offerType: "werk",
                  });
                } catch (e) { console.warn("Receipt failed:", e); }
              }}
              style={{
                width: "100%", marginTop: 10, padding: "14px 0",
                borderRadius: 14, border: "1.5px solid rgba(34,197,94,0.35)",
                background: "transparent", color: "#22C55E",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Beleg herunterladen
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#FF5B5B", marginBottom: 8 }}>{t("wkf.errTitle")}</div>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", marginBottom: 28, lineHeight: 1.5 }}>
              {errMsg || t("wkf.errGeneric")}
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
    )}
    {/* BUGFIX (2026-08-16): ShippingAddressModal war importiert + State vorhanden,
        wurde aber nie gerendert — Adressabfrage vor Kauf fehlte komplett im UI. */}
    {showAddressModal && (
      <ShippingAddressModal
        onConfirm={(address) => {
          setShippingAddress(address);
          setShowAddressModal(false);
          handleKauf(address);
        }}
        onCancel={() => setShowAddressModal(false)}
      />
    )}
    </>
  );
}
