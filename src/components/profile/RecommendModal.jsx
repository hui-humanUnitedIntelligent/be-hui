// src/components/profile/RecommendModal.jsx
// ══════════════════════════════════════════════════════════════════════
// RECOMMEND MODAL — "Empfehlung schreiben"
// Wird angezeigt wenn ein Nutzer eine Kauf/Buchung beim Profilinhaber hatte.
// Direkt public — keine Freigabe nötig.
// Pflicht: createPortal → document.body, zIndex >= 10500
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RecommendationService } from "../../services/db";
import { supabase } from "../../lib/supabaseClient";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealDark: "#0DBBAF",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.32)",
  border:   "rgba(26,26,24,0.08)",
  r16:      16,
  r12:      12,
  r99:      99,
  ff:       "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

export default function RecommendModal({
  toUserId      = "",
  toUserName    = "",
  orderId       = null,
  bookingId     = null,
  onClose       = () => {},
  onSubmitted   = () => {},

}) {
  useModalRegistration(true, onClose, "RecommendModal");
  const [text, setText]              = useState("");
  const [submitting, setSubmitting]  = useState(false);
  const [error, setError]            = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setCurrentUserId(data.user.id);
    });
  }, []);

  const canSubmit = text.trim().length >= 10 && currentUserId && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await RecommendationService.create(
        currentUserId,
        toUserId,
        text.trim(),
        { orderId, bookingId }
      );
      if (result.error) throw result.error;
      onSubmitted?.();
      onClose?.();
    } catch (e) {
      setError(e.message || "Empfehlung konnte nicht gesendet werden.");
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10500,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          width: "100%",
          maxHeight: "85vh",
          background: T.bg,
          borderRadius: `${T.r16}px ${T.r16}px 0 0`,
          padding: "20px 20px calc(88px + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: T.ff,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
            Empfehlung schreiben
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(26,26,24,0.07)",
              border: "none",
              borderRadius: T.r99,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 18,
              color: T.inkSoft,
              fontFamily: T.ff,
            }}
          >
            ✕
          </button>
        </div>

        {/* Info: für wen */}
        <div
          style={{
            background: T.bgCard,
            borderRadius: T.r12,
            padding: "12px 14px",
            border: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(14,196,184,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ❝
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
              Empfehlung für {toUserName || "dieses Mitglied"}
            </div>
            <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>
              Sichtbar im Profil unter "Kundenstimmen"
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Wie war deine Erfahrung? Was hat dir besonders gefallen?"
            maxLength={500}
            style={{
              width: "100%",
              minHeight: 120,
              padding: "14px 16px",
              borderRadius: T.r12,
              border: `1px solid ${T.border}`,
              background: T.bgCard,
              fontSize: 14,
              lineHeight: 1.5,
              color: T.ink,
              fontFamily: T.ff,
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
            autoFocus
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <div style={{ fontSize: 11, color: error ? "#DC2626" : T.inkFaint }}>
              {error || "Mindestens 10 Zeichen"}
            </div>
            <div style={{ fontSize: 11, color: T.inkFaint }}>{text.length}/500</div>
          </div>
        </div>

        {/* Submit-Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: "14px 24px",
            borderRadius: T.r99,
            border: "none",
            background: canSubmit ? `linear-gradient(135deg, ${T.teal}, ${T.tealDark})` : "rgba(26,26,24,0.08)",
            color: canSubmit ? "white" : T.inkFaint,
            fontSize: 15,
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "default",
            fontFamily: T.ff,
            transition: "opacity .15s ease",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Wird gesendet…" : "Empfehlung veröffentlichen"}
        </button>
      </div>
    </div>,
    document.body
  );
}
