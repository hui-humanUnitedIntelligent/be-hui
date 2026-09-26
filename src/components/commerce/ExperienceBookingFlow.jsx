// src/components/commerce/ExperienceBookingFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Erlebnis Buchen (Single-Item Stripe Checkout)
// ═══════════════════════════════════════════════════════════════════
// Ersetzt das Legacy bookingService.create() (kein Stripe) durch
// einen echten Stripe PaymentIntent über die create-payment-intent
// Edge Function + StripePaymentStep.
//
// Ablauf:
// EBF-NACHRICHT-DEADEND-001 (2026-09-22, Michael-Report + Screenshot): Das
// "Nachricht an Creator (optional)"-Feld wurde entfernt. Die Nachricht landete
// nur als Rohtext-Suffix in notifications.text -- NotificationPanel.jsx liest
// aber ausschliesslich n.title/n.body (kein Handler fuer "experience_booked",
// Fallback-Block filtert n.body, das Feld hiess nie so) -- die eingetippte
// Nachricht wurde dem Creator NIRGENDS angezeigt. Root Cause verifiziert, kein
// bestehender Anzeige-Pfad reparierbar ohne neue Notification-Infrastruktur;
// Michaels Entscheidung: Feld ganz raus statt eine Anzeige nachzuruesten.
//   1. form → User sieht Erlebnis + Preis, klickt "Buchen"
//   2. loading → create-payment-intent Edge Function → clientSecret
//   3. payment → StripePaymentStep (Stripe Elements)
//   4. success → Bestätigung + Notification an Creator
//   5. error → Fehlermeldung
//
// PFLICHT: createPortal → document.body, zIndex >= 10500
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/useTranslation.js";
import { postToEdgeFunction } from "../../lib/authFetch.js";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { invalidateOrbStageCache } from "../../hooks/useOrbGrowthStage.js";
import { autoCreateOrReopenChat } from "../../lib/chatContext.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { IMPACT_RATE, notifyPurchasedItems } from "./commerceUtils.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import StripePaymentStep from "./StripePaymentStep.jsx";
import { useSavedPostsContext } from "../../context/SavedPostsContext.jsx";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";
import { generateReceipt } from "../../lib/generateReceipt.js";
import BelegViewerModal from "../notifications/BelegViewerModal.jsx";
import { toast } from "../../lib/useToast.jsx";
import { optimizeCard } from "../../lib/perfUtils.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";

const TEAL = "#16D7C5";

export default function ExperienceBookingFlow({ experience, onClose = () => {} }) {
  const { t } = useTranslation();
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  const { user } = useAuth();
  useModalRegistration(true, onClose, "ExperienceBookingFlow");
  useWizardBodyLock();
  const { isSaved, toggleSave } = useSavedPostsContext();

  const [phase, setPhase] = useState("form"); // form | loading | payment | success | error
  const [errMsg, setErrMsg] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [publishableKey, setPublishableKey] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [showChatConfirm, setShowChatConfirm] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptGenerating, setReceiptGenerating] = useState(false);
  // PARTICIPANT-COUNT-001 (2026-09-22, Michael-Report): Teilnehmerzahl war
  // im Buchungsvorgang fest auf 1 verdrahtet (orderItems quantity:1,
  // receiptData.participants:1) -- Nutzer konnten fuer mehrere Personen
  // buchen wollen, hatten aber keine Auswahl. create-payment-intent
  // unterstuetzt quantity 1-99 inkl. serverseitiger stock_available-Prüfung
  // bereits vollstaendig (COMMERCE-STOCK-001) -- reine Frontend-Ergaenzung.
  const [quantity, setQuantity] = useState(1);
  const actions = useHuiActions();

  if (!experience) return null;

  // Normalisiere Experience-Daten aus Feed- und HuiAction-Shapes
  const expObj    = experience?.experience || experience;
  const crObj     = experience?.creator    || experience?.author || null;

  const expId     = expObj?.id || expObj?._raw?.id;
  // BOOKING-CREATORID-002 (2026-09-22, Michael-Report + Screenshot "Creator-ID
  // fehlt" beim Buchen von Saschas Erlebnis aus dem Home-Feed): Home.jsx und
  // DiscoverPage rufen setShowBookingFlow(item) mit der ROHEN experiences-
  // Datenzeile auf (Supabase .select(...user_id...)) -- diese Zeile hat den
  // Ersteller ausschliesslich als TOP-LEVEL `user_id`, NIE als `.creator_id`
  // oder `._raw.user_id`. Die bisherige Kette prüfte genau diese beiden nie
  // vorhandenen Felder und liess den einzigen tatsächlich befüllten Fall
  // (expObj.user_id direkt) komplett aus -- jede Buchung aus Feed/Discover
  // war dadurch blockiert, nicht nur Saschas Erlebnis. ContentPreviewSheet
  // funktionierte weiterhin (übergibt ein normalisiertes Preview-Item mit
  // .author + ._raw.user_id). Fix: expObj?.user_id zusätzlich prüfen.
  const creatorId = crObj?.id  || expObj?.author?.id
                  || expObj?._raw?.creator_id || expObj?._raw?.user_id
                  || expObj?.creator_id       || expObj?.user_id;
  const title     = expObj?.title || expObj?._raw?.title || t("ebf.defaultTitle");
  const creatorName = crObj?.full_name || crObj?.display_name || crObj?.name || expObj?.author?.name || t("ebf.defaultCreator");
  const rawPrice  = expObj?._raw?.price ?? expObj?.price ?? null;
  const amount    = typeof rawPrice === "number" ? rawPrice
                  : typeof rawPrice === "string"
                    ? parseFloat(rawPrice.replace(/[^0-9.,]/g,"").replace(",","."))
                    : 0;
  const priceStr  = amount > 0 ? `${amount.toFixed(2).replace(".",",")} €` : null;
  const coverUrl  = expObj?._raw?.cover_url || expObj?.cover_url || expObj?.img;
  const rawExp    = expObj?._raw || expObj || {};

  // PARTICIPANT-COUNT-001: stock_total/stock_available sind seit
  // OTA 2.1.611 die SSOT-Kapazitätsfelder für Erlebnisse (ExperienceWizard
  // schreibt max_participants dorthin, siehe TEILNEHMERZAHL-IN-WANNWO-001).
  const spotsTotalRaw     = rawExp?.stock_total;
  const spotsAvailableRaw = rawExp?.stock_available;
  const hasSpotsInfo   = spotsAvailableRaw != null && spotsTotalRaw != null;
  const spotsAvailable = hasSpotsInfo ? Math.max(0, Number(spotsAvailableRaw)) : null;
  const spotsTotal      = hasSpotsInfo ? Math.max(0, Number(spotsTotalRaw)) : null;
  const soldOut = spotsAvailable !== null && spotsAvailable <= 0;
  const maxQty  = spotsAvailable !== null ? Math.max(1, Math.min(99, spotsAvailable)) : 99;
  const safeQty = Math.min(Math.max(1, quantity), maxQty);
  const totalAmount = +(amount * safeQty).toFixed(2);
  const totalPriceStr = totalAmount > 0 ? `${totalAmount.toFixed(2).replace(".",",")} €` : null;
  const receiptData = {
    offerTitle: title || t("ebf.defaultOfferTitle"),
    sellerName: creatorName || t("ebf.defaultSellerName"),
    sellerWebsite: crObj?.website || null,
    // PARTICIPANT-COUNT-001: generateReceipt.js erwartet in amountEur den
    // GESAMTBETRAG (rechnet "Pro Teilnehmer" selbst per amountEur/participants
    // aus) -- amount ist nur der Einzelpreis pro Person, totalAmount ist korrekt.
    amountEur: totalAmount,
    bookingId: orderId || null,
    offerId: expId || null,
    offerType: "experience",
    date: rawExp.date || null,
    time: rawExp.time_start
      ? `${rawExp.time_start}${rawExp.time_end ? ` – ${rawExp.time_end}` : ""}`
      : null,
    location: rawExp.location_text || rawExp.meeting_point || null,
    participants: safeQty,
    lineItems: [{
      title: title || t("ebf.defaultOfferTitle"),
      quantity: safeQty,
      unitPriceEur: amount,
      totalEur: totalAmount,
    }],
  };

  async function openReceiptPreview(bookingIdOverride = null) {
    if (receiptGenerating) return;
    setReceiptGenerating(true);
    try {
      const result = await generateReceipt({
        ...receiptData,
        bookingId: bookingIdOverride || receiptData.bookingId,
      }, { autoDownload: false });
      setReceiptPreview(result);
    } catch (e) {
      console.warn("[CHECKOUT-SMOOTH-001] Receipt preview failed:", e);
    } finally {
      setReceiptGenerating(false);
    }
  }

  const saved = isSaved(expId);
  const handleSave = () => {
    if (!expId) return;
    toggleSave(expId, "experience", { title, cover_url: coverUrl, author_name: creatorName });
  };

  async function handleBuchen() {
    if (!user?.id)    { setErrMsg(t("ebf.errNotLoggedIn")); setPhase("error"); return; }
    if (!expId)       { setErrMsg(t("ebf.errExpId")); setPhase("error"); return; }
    if (!creatorId)   { setErrMsg(t("ebf.errCreatorId")); setPhase("error"); return; }
    if (user.id === creatorId) { setErrMsg(t("ebf.errSelfBook")); setPhase("error"); return; }
    if (amount <= 0)  { setErrMsg(t("ebf.errNoPrice")); setPhase("error"); return; }
    if (safeQty < 1)  { setErrMsg(t("ebf.errMinParticipants")); setPhase("error"); return; }
    if (spotsAvailable !== null && safeQty > spotsAvailable) {
      setErrMsg(t("ebf.errNotEnoughSpots")); setPhase("error"); return;
    }

    setPhase("loading");
    setErrMsg("");

    try {
      // COMMERCE-VIEW-FIX-EBF (2026-09-26, Bugreport 426b507e, Lars Platin,
      // 24.09., Mac Web, v2.1.612: "Wenn ich ein Erlebnis buchen möchte,
      // dann klappt es mit dem buchen nicht") ──────────────────────────
      // focus_type-Gate entfernt — exakt derselbe Fix wie im WerkKaufFlow
      // (COMMERCE-VIEW-FIX, 2026-08-16, Commit-Kommentar dort: "Das
      // focus_type='public'-Filter blockierte legitime Verkäufer mit
      // hybrid"). Beide Gates stammen aus demselben Commit a973d15d
      // (Sichtbarkeits-System), aber der 16.08.-Fix wurde nur auf den
      // WerkKaufFlow angewendet und hier nie nachgezogen.
      // DB-Beweis: Lars versuchte Kays Erlebnis "Fest der Menschen"
      // (b765bfd1, published, approved, in commerce_price_authority) zu
      // buchen → Kay hat focus_type="hybrid" → Gate blockierte mit
      // "Dieses Profil ist nicht öffentlich". 7 Minuten später kaufte er
      // problemlos Kays Werk (WerkKaufFlow ohne Gate, Order 009a0c72,
      // paid). focus_type-Verteilung: 21/29 Profile sind "hybrid" — das
      // Gate blockierte damit fast JEDEN Erlebnis-Anbieter.
      // commerce_price_authority View (status published/approved) bleibt
      // die serverseitige Preis-/Verfügbarkeits-Autorität.

      // ── Stripe PaymentIntent über Edge Function ──
      // AUTH-401-RECOVERY-001 (2026-08-28): postToEdgeFunction versucht bei
      // 401 automatisch einen Session-Refresh + Retry (schuetzt gegen durch
      // JWT-Key-Rotation ungueltig gewordene Access-Tokens).
      const { res, result, sessionExpired } = await postToEdgeFunction("create-payment-intent", {
        orderItems: [{
          item_id: expId,
          item_type: "experience",
          quantity: safeQty,
        }],
      });

      if (sessionExpired) {
        setErrMsg(t("common.sessionExpiredReauth"));
        try { await supabase.auth.signOut(); } catch {}
        setPhase("error");
        return;
      }

      if (!res.ok || result.error) {
        const msg = result.code === "STRIPE_NOT_CONFIGURED"
          ? t("ebf.errStripeNotConfigured")
          : (result.error || t("ebf.errPaymentStart"));
        setErrMsg(msg);
        setPhase("error");
        return;
      }

      if (!result.clientSecret) {
        setErrMsg(t("ebf.errNoSecret"));
        setPhase("error");
        return;
      }

      setClientSecret(result.clientSecret);
      setPublishableKey(result.publishableKey ?? null);
      setOrderId(result.orderId ?? null);
      setPhase("payment");
    } catch (e) {
      setErrMsg(e?.message || t("ebf.errConnection"));
      setPhase("error");
    }
  }

  async function handleStripeSuccess({ orderId: oid, paymentIntentId }) {
    // PURCHASED-CART-CLEANUP-001: Entfernt nur die bezahlte Position aus
    // einem eventuell typoffenen persistenten Warenkorb. Das Erlebnis selbst
    // bleibt im Feed und in der DB sichtbar/buchbar.
    notifyPurchasedItems([{ id: expId, type: "experience" }]);

    // CHECKOUT-SMOOTH-001: Stripe hat die Zahlung bereits final bestätigt.
    // Sofort sichtbare Resonanz geben, statt erst auf Notification/Chat/DB-
    // Nebenarbeiten zu warten. Der Beleg wird direkt als Vorschau erzeugt.
    setPhase("success");
    toast.success("Zahlung erfolgreich. Dein Beleg ist bereit.", { duration: 4500 });
    const receiptPromise = openReceiptPreview(oid || orderId || null);

    // Notification an Creator
    await supabase.from("notifications").insert({
      user_id:    creatorId,
      type:       "experience_booked",
      text:       safeQty > 1
        ? `Dein Erlebnis "${title}" wurde für ${safeQty} Personen gebucht.`
        : `Dein Erlebnis "${title}" wurde gebucht.`,
      read:       false,
      actor_id:   user.id,
      created_at: new Date().toISOString(),
      entity_id:  expId,
      entity_type: "experience",
    }).catch(() => {});

    // FIX (2026-08-13): Buchung zaehlt in rpc_get_orb_growth_stage als
    // Aktivitaet -> Cache invalidieren, sonst haengt der Orb bis zu
    // 5 Min. auf altem Wert.
    invalidateOrbStageCache(user?.id);

    // CHAT-LOGIK v2 (2026-08-22): Automatisch Chat mit Erlebnis-Ersteller erstellen/öffnen
    if (user?.id && creatorId && user.id !== creatorId) {
      autoCreateOrReopenChat({
        userId:       user.id,
        otherUserId:  creatorId,
        bookingId:    String(expId || experience?.id || ""),
        bookingType:  "erlebnis",
        bookingTitle: title || expObj?.title || t("ebf.defaultBookingTitle"),
      }).catch((e) => console.warn("[CHAT-V2] autoCreateOrReopenChat:", e?.message));
    }

    // Das Stripe-Formular darf erst entsperren, wenn die lokale Belegvorschau
    // fertig erzeugt oder kontrolliert fehlgeschlagen ist.
    await receiptPromise;
  }

  // ── Render ──────────────────────────────────────────────────────
  return createPortal(
    <div
      data-hui-kbd-self-managed
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        /* STRIPESHEET-KBD-FIX (2026-09-15, Report 6e15f95c): Keyboard selbst gemanagt */
        paddingBottom: "var(--hui-keyboard-inset, 0px)",
      }}
    >
      <div style={{
        background: "#FDFCFA", borderRadius: "24px 24px 0 0", transform: sheetTransform, transition: sheetTransition,
        width: "100%", maxWidth: 480,
        padding: "28px 24px 40px",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "ebfSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        maxHeight: "calc(92dvh - var(--hui-keyboard-inset, 0px))", overflowY: "auto",
      }}>
        <style>{`@keyframes ebfSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* Handle */}
        <div {...dragHandlers} style={{ touchAction:"none", cursor:"grab", display:"flex", justifyContent:"center", padding:"12px 0 20px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)" }} />
        </div>

        {/* ── FORM ── */}
        {phase === "form" && (
          <>
            {/* Cover */}
            {coverUrl && (
              <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                <img src={optimizeCard(coverUrl)} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: "#55556B", marginBottom: 16 }}>von {creatorName}</div>
            {priceStr && (
              <div style={{ fontSize: 22, fontWeight: 600, color: TEAL, marginBottom: 4 }}>
                {totalPriceStr}
                {safeQty > 1 && (
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#55556B", marginLeft: 8 }}>
                    ({priceStr} {t("ebf.perPerson")})
                  </span>
                )}
              </div>
            )}

            {/* PARTICIPANT-COUNT-001 (2026-09-22, Michael-Report): Teilnehmerzahl
                waehlbar direkt im Buchungsvorgang, gedeckelt durch die echten
                freien Plaetze (stock_available), gleiches Stepper-Muster wie
                WerkeKorb.jsx (−/Zahl/+, Teal-Akzent, disabled an den Grenzen). */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>
                {t("ebf.participants")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={safeQty <= 1}
                  aria-label={t("wk.less")}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "1px solid rgba(22,215,197,0.30)",
                    background: "rgba(22,215,197,0.06)",
                    color: safeQty <= 1 ? "rgba(26,26,46,0.25)" : TEAL,
                    fontSize: 18, fontWeight: 400, cursor: safeQty <= 1 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                  }}
                >−</button>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E", minWidth: 24, textAlign: "center" }}>
                  {safeQty}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  disabled={safeQty >= maxQty}
                  aria-label={t("wk.more")}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "1px solid rgba(22,215,197,0.30)",
                    background: "rgba(22,215,197,0.06)",
                    color: safeQty >= maxQty ? "rgba(26,26,46,0.25)" : TEAL,
                    fontSize: 18, fontWeight: 400, cursor: safeQty >= maxQty ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                  }}
                >+</button>
                {hasSpotsInfo && (
                  <span style={{ fontSize: 12.5, color: soldOut ? "#E24C4C" : "#55556B", marginLeft: 4 }}>
                    {t("feed.slotsAvailable", { avail: spotsAvailable, total: spotsTotal })}
                  </span>
                )}
              </div>
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
              disabled={soldOut}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                background: soldOut ? "rgba(26,26,46,0.15)" : TEAL,
                color: "#fff", fontSize: 16, fontWeight: 600,
                cursor: soldOut ? "default" : "pointer", transition: "opacity 0.2s",
              }}
            >
              {soldOut ? t("ebf.errNotEnoughSpots") : (totalPriceStr ? `${totalPriceStr}  ${t("tbf.btn.book")}` : t("tbf.btn.book"))}
            </button>
          </>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${TEAL}33`, borderTopColor: TEAL,
              borderRadius: "50%", animation: "ebfSpin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <style>{`@keyframes ebfSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: "#55556B" }}>Zahlung wird vorbereitet…</div>
          </div>
        )}

        {/* ── PAYMENT (Stripe) ── */}
        {/* StripePaymentStep verwaltet seinen eigenen <Elements>-Kontext intern
            (siehe UnterstutzenFlow.jsx/TalentBookingFlow.jsx) — hier NICHT nochmal
            in <Elements> wrappen, das erzeugte einen doppelten/leeren Stripe-
            Kontext und einen Hook-Order-Crash (React #310). */}
        {phase === "payment" && clientSecret && (
            <StripePaymentStep
              total={totalAmount}
              impact={+(totalAmount * IMPACT_RATE).toFixed(2)}
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
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Buchung erfolgreich</div>
            {/* Detaillierte Buchungsinfo */}
            <div style={{
              background: "rgba(22,215,197,0.06)", border: "1px solid rgba(22,215,197,0.15)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A2E", marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#55556B", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Anbieter:</span> {creatorName}
              </div>
              {safeQty > 1 && (
                <div style={{ fontSize: 13, color: "#55556B", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{t("ebf.participants")}:</span> {safeQty}
                </div>
              )}
              {totalAmount > 0 && (
                <div style={{ fontSize: 13, color: "#55556B", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Betrag:</span> {totalAmount.toFixed(2).replace(".", ",")} €
                </div>
              )}
              <div style={{ fontSize: 13, color: "#55556B", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(22,215,197,0.12)" }}>
                Deine Zahlung ist sicher bei HUI hinterlegt. {creatorName} wurde benachrichtigt.
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: TEAL, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              Fertig
            </button>
            <button
              onClick={() => openReceiptPreview(orderId)}
              disabled={receiptGenerating}
              style={{
                width: "100%", marginTop: 10, padding: "14px 0",
                borderRadius: 14, border: "1.5px solid rgba(34,197,94,0.35)",
                background: "transparent", color: "#22C55E",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {receiptGenerating ? "Beleg wird erstellt …" : "Beleg anzeigen"}
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
              <div style={{ fontSize: 17, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>
                Mit {creatorName} chatten?
              </div>
              <div style={{ fontSize: 14, color: "#55556B", lineHeight: 1.5, marginBottom: 20 }}>
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

        {receiptPreview && (
          <BelegViewerModal
            result={receiptPreview}
            onClose={() => setReceiptPreview(null)}
          />
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#FF5B5B", marginBottom: 8 }}>Fehler</div>
            <div style={{ fontSize: 14, color: "#55556B", marginBottom: 28, lineHeight: 1.5 }}>
              {errMsg || t("ebf.errGeneric")}
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
              background: "rgba(26,26,46,0.06)", color: "#55556B",
              fontSize: 16, cursor: "pointer", lineHeight: 1,
            }}
          >✕</button>
        )}
      </div>
    </div>,
    document.body
  );
}
