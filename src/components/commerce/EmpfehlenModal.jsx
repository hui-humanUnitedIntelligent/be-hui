// src/components/commerce/EmpfehlenModal.jsx
// ══════════════════════════════════════════════════════════════════════
// EMPFEHLEN MODAL — Öffnet sich nach "Ware erhalten" (Michael, 2026-08-19)
// Zeigt zwei Optionen: "Empfehlen" (positive Bewertung + Auszahlung freigeben)
// oder "Nicht empfehlen" (Dispute mit Begründung + Geld blockiert)
// Pflicht: createPortal → document.body, zIndex >= 10500 (footer-navbar-zindex)
// ══════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.30)",
  border:   "rgba(26,26,24,0.08)",
  green:    "#10B981",
  greenSoft:"rgba(16,185,129,0.10)",
  red:      "#E83A3A",
  redMid:   "#DC2626",
  redSoft:  "rgba(232,58,58,0.08)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.10)",
  ff:       "Inter,sans-serif",
  r16: 16, r12: 12, r99: 99, r8: 8,
};

// DISPUTE_REASONS moved inside component (needs t())

export default function EmpfehlenModal({
  orderId = null,
  bookingId = null,
  itemTitle = "",
  onClose = () => {},
  onSuccess = () => {},
}) {
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  useModalRegistration(true, () => onClose?.(), "EmpfehlenModal");
  useWizardBodyLock();

  const { t } = useTranslation();

  const DISPUTE_REASONS = [
    { code: "damaged",         label: t('rec.reasonDamaged') },
    { code: "not_as_described", label: t('rec.reasonNotAsDescribed') },
    { code: "not_delivered",    label: t('rec.reasonNotDelivered') },
    { code: "wrong_item",       label: t('rec.reasonWrongItem') },
    { code: "poor_quality",     label: t('rec.reasonPoorQuality') },
  ];

  const [step, setStep] = useState("choose"); // "choose" | "recommend" | "dispute" | "submitting" | "done_recommended" | "done_disputed"
  const [reviewText, setReviewText] = useState("");
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  const handleRecommend = async () => {
    if (!reviewText.trim()) {
      setError(t('rec.errorNeedReview'));
      return;
    }
    setStep("submitting");
    setError("");
    try {
      // 1. Review + Events + Notifications speichern (ohne escrow_status zu setzen)
      const { data: reviewData, error: rpcErr } = await supabase.rpc("rpc_buyer_confirm_with_review", {
        p_order_id: orderId || null,
        p_booking_id: bookingId || null,
        p_review_text: reviewText.trim(),
      });
      if (rpcErr) throw rpcErr;
      if (reviewData && !reviewData.ok) throw new Error(reviewData.error || t('rec.errorReview'));
      if (reviewData?.skipped) {
        // Bereits bestätigt — idempotent
        setResultMsg(t('rec.alreadyRecommendedMsg'));
        setStep("done_recommended");
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 2500);
        return;
      }

      // 2. Stripe-Transfer + DB-Bestätigung über bestehende Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const body = orderId ? { order_id: orderId } : { booking_id: bookingId };

      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 30000);
      const res = await fetch(`${supabaseUrl}/functions/v1/confirm-and-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      clearTimeout(to);
      const result = await res.json();

      // Erfolg — egal ob res.ok oder skipped (bereits vom ersten RPC bestätigt)
      if (res.ok && (result?.ok || result?.skipped)) {
        setResultMsg(t('rec.successReleased'));
        setStep("done_recommended");
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 2800);
      } else {
        // Edge Function Fehler — aber Review wurde bereits gespeichert
        console.warn("[EMPFEHLEN] confirm-and-transfer error:", result?.error);
        setResultMsg(t('rec.successPending'));
        setStep("done_recommended");
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 2800);
      }
    } catch (e) {
      // Wenn Edge Function nicht erreichbar: Review ist schon gespeichert,
      // aber Stripe-Transfer fehlt. Dem Nutzer sagen dass es geprüft wird.
      if (e?.name === "AbortError") {
        console.warn("[EMPFEHLEN] confirm-and-transfer timeout");
        setResultMsg(t('rec.successPending'));
        setStep("done_recommended");
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 2800);
      } else {
        setError(e?.message || t('rec.errorSend'));
        setStep("recommend");
      }
    }
  };

  const handleDispute = async () => {
    const reasonCode = selectedReason || "custom";
    const reasonText = customReason.trim() || (selectedReason ? DISPUTE_REASONS.find(r => r.code === selectedReason)?.label : "");

    if (!reasonCode && !reasonText) {
      setError(t("rec.errorNeedReason"));
      return;
    }
    setStep("submitting");
    setError("");
    try {
      const { data, error: rpcErr } = await supabase.rpc("rpc_buyer_dispute_with_reason", {
        p_order_id: orderId || null,
        p_booking_id: bookingId || null,
        p_reason_code: reasonCode,
        p_reason_text: reasonText,
      });
      if (rpcErr) throw rpcErr;
      if (data && !data.ok) throw new Error(data.error || t('rec.errorSubmit'));

      setResultMsg(t("rec.problemReviewing"));
      setStep("done_disputed");
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 2800);
    } catch (e) {
      setError(e?.message || t('rec.errorSend'));
      setStep("dispute");
    }
  };

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && step !== "submitting") onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(26,26,24,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: T.bg, borderRadius: "24px 24px 0 0",
        transform: sheetTransform, transition: sheetTransition,
        maxHeight: "92dvh", display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 32px rgba(26,26,24,0.18)",
        fontFamily: T.ff,
        animation: "emSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
      }}>
        <style>{`@keyframes emSlideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>

        {/* Handle */}
        <div {...dragHandlers} style={{ touchAction:"none", cursor:"grab", width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,24,0.12)", margin: "12px auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "10px 20px 8px", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>
            {t("rec.itemReceived")}
          </div>
          {itemTitle && (
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>
              {itemTitle}
            </div>
          )}
        </div>

        {/* Scroll-Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px", WebkitOverflowScrolling: "touch" }}>

          {/* ── STEP: CHOOSE (Empfehlen / Nicht empfehlen) ── */}
          {step === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.6, marginBottom: 4 }}>
                {t('rec.confirmPrompt')}
              </div>

              {/* Option A: Empfehlen */}
              <button
                onClick={() => { setStep("recommend"); setError(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px", borderRadius: T.r16,
                  background: T.greenSoft, border: `1.5px solid ${T.green}`,
                  cursor: "pointer", touchAction: "manipulation",
                  fontFamily: T.ff, textAlign: "left",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: T.green, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>✓</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>Empfehlen</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
                    {t('rec.recommendHint')}
                  </div>
                </div>
              </button>

              {/* Option B: Nicht empfehlen */}
              <button
                onClick={() => { setStep("dispute"); setError(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px", borderRadius: T.r16,
                  background: T.redSoft, border: `1.5px solid ${T.redMid}`,
                  cursor: "pointer", touchAction: "manipulation",
                  fontFamily: T.ff, textAlign: "left",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: T.red, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>✕</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>Nicht empfehlen</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
                    Du gibst einen Grund an. Das HUI-Team prüft den Fall.
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* ── STEP: RECOMMEND (Empfehlen → Bewertung schreiben) ── */}
          {step === "recommend" && (
            <div style={{ paddingTop: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.green, marginBottom: 8 }}>
                {t("rec.writeReview")}
              </div>
              <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>
                {t('rec.reviewBody')}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={t('rec.reviewPlaceholder')}
                rows={5}
                data-hui-kbd-self-managed
                style={{
                  width: "100%", resize: "none", border: `1.5px solid ${T.border}`,
                  borderRadius: T.r12, padding: "12px 14px", fontSize: 14, color: T.ink,
                  background: T.bgCard, outline: "none", marginBottom: 8,
                  fontFamily: T.ff, lineHeight: 1.5, boxSizing: "border-box",
                }}
              />
              {error && (
                <div style={{ fontSize: 13, color: T.red, padding: "10px 12px", borderRadius: T.r8, background: T.redSoft, marginBottom: 8 }}>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setStep("choose"); setError(""); setReviewText(""); }}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: T.r99,
                    background: T.bgCard, color: T.inkSoft,
                    border: `1.5px solid ${T.border}`, fontSize: 14, fontWeight: 600,
                    cursor: "pointer", touchAction: "manipulation", fontFamily: T.ff,
                  }}
                >{t("rec.back")}</button>
                <button
                  onClick={handleRecommend}
                  disabled={!reviewText.trim()}
                  style={{
                    flex: 2, padding: "13px 0", borderRadius: T.r99,
                    background: !reviewText.trim() ? "rgba(16,185,129,0.35)" : `linear-gradient(135deg, ${T.green}, #059669)`,
                    color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
                    cursor: !reviewText.trim() ? "not-allowed" : "pointer",
                    touchAction: "manipulation", fontFamily: T.ff,
                  }}
                >{t('rec.submitReview')}</button>
              </div>
            </div>
          )}

          {/* ── STEP: DISPUTE (Nicht empfehlen → Gründe) ── */}
          {step === "dispute" && (
            <div style={{ paddingTop: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.red, marginBottom: 8 }}>
                Nicht empfehlen
              </div>
              <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>
                Wähle einen Grund oder beschreibe das Problem. Das Geld bleibt blockiert. Das HUI-Team prüft den Fall.
              </div>

              {/* 5 vorgefertigte Gründe */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {DISPUTE_REASONS.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => setSelectedReason(r.code === selectedReason ? null : r.code)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", borderRadius: T.r12,
                      background: selectedReason === r.code ? T.redSoft : T.bgCard,
                      border: `1.5px solid ${selectedReason === r.code ? T.redMid : T.border}`,
                      cursor: "pointer", touchAction: "manipulation",
                      fontFamily: T.ff, textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `2px solid ${selectedReason === r.code ? T.redMid : T.border}`,
                      flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: selectedReason === r.code ? T.redMid : "transparent",
                    }}>
                      {selectedReason === r.code && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 14, color: T.ink, fontWeight: 500 }}>{r.label}</div>
                  </button>
                ))}
              </div>

              {/* Freies Textfeld */}
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
                Eigene Begründung (optional)
              </div>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t("rec.describePlaceholder")}
                rows={3}
                data-hui-kbd-self-managed
                style={{
                  width: "100%", resize: "none", border: `1.5px solid ${T.border}`,
                  borderRadius: T.r12, padding: "12px 14px", fontSize: 14, color: T.ink,
                  background: T.bgCard, outline: "none", marginBottom: 8,
                  fontFamily: T.ff, lineHeight: 1.5, boxSizing: "border-box",
                }}
              />
              {error && (
                <div style={{ fontSize: 13, color: T.red, padding: "10px 12px", borderRadius: T.r8, background: T.redSoft, marginBottom: 8 }}>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setStep("choose"); setError(""); setSelectedReason(null); setCustomReason(""); }}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: T.r99,
                    background: T.bgCard, color: T.inkSoft,
                    border: `1.5px solid ${T.border}`, fontSize: 14, fontWeight: 600,
                    cursor: "pointer", touchAction: "manipulation", fontFamily: T.ff,
                  }}
                >{t("rec.back")}</button>
                <button
                  onClick={handleDispute}
                  disabled={!selectedReason && !customReason.trim()}
                  style={{
                    flex: 2, padding: "13px 0", borderRadius: T.r99,
                    background: (!selectedReason && !customReason.trim()) ? "rgba(232,58,58,0.35)" : T.red,
                    color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
                    cursor: (!selectedReason && !customReason.trim()) ? "not-allowed" : "pointer",
                    touchAction: "manipulation", fontFamily: T.ff,
                  }}
                >Meldung absenden</button>
              </div>
            </div>
          )}

          {/* ── STEP: SUBMITTING ── */}
          {step === "submitting" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${T.teal}33`, borderTopColor: T.teal, borderRadius: "50%", margin: "0 auto 16px", animation: "emSpin 0.8s linear infinite" }} />
              <style>{`@keyframes emSpin { to { transform: rotate(360deg) } }`}</style>
              <div style={{ fontSize: 14, color: T.inkSoft }}>Wird gesendet…</div>
            </div>
          )}

          {/* ── STEP: DONE RECOMMENDED ── */}
          {step === "done_recommended" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <span style={{ fontSize: 28, color: T.green }}>✓</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 8 }}>Ware empfohlen</div>
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.6, padding: "0 16px" }}>
                {resultMsg}
              </div>
            </div>
          )}

          {/* ── STEP: DONE DISPUTED ── */}
          {step === "done_disputed" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <span style={{ fontSize: 28, color: T.amber }}>⚠</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 8 }}>{t("notif.problemReported")}</div>
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.6, padding: "0 16px" }}>
                {resultMsg}
              </div>
            </div>
          )}

        </div>

        {/* Close button — nur in choose/dispute/recommend Schritten */}
        {(step === "choose" || step === "recommend" || step === "dispute") && (
          <div style={{
            flexShrink: 0, padding: `12px 20px calc(max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 16px), 16px) + 12px)`,
            background: T.bg, borderTop: `1px solid ${T.border}`, display: "flex",
          }}>
            <button
              onClick={() => onClose?.()}
              style={{
                flex: 1, padding: "12px 0", borderRadius: T.r99,
                background: T.bgCard, color: T.inkSoft,
                border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600,
                cursor: "pointer", touchAction: "manipulation", fontFamily: T.ff,
              }}
            >Später</button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
