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
import { submitBuyerRating } from "../../lib/chatContext.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";

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
  ff:       "Inter,sans-serif",
};

export default function RecommendModal({
  toUserId      = "",
  toUserName    = "",
  orderId       = null,
  bookingId     = null,
  onClose       = () => {},
  onSubmitted   = () => {},

}) {
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  useModalRegistration(true, onClose, "RecommendModal");
  const [text, setText]              = useState("");
  const [submitting, setSubmitting]  = useState(false);
  const [error, setError]            = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setCurrentUserId(data.user.id);
    });
  }, []);

  // 3-Sekunden Success-Popup, dann schließen
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => {
      onSubmitted?.();
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

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

      // CHAT-LOGIK v2 (Michael-Vorgabe 2026-08-22, Punkt 5): "Bei positiver
      // Empfehlung + Ware versendet + Ware erhalten + Geld überwiesen →
      // Chat wird archiviert/geschlossen." BUGFIX (2026-08-25, Michael-Report
      // "Chat mit Michelle sollte geschlossen werden"): Dieser Finanzübersicht-
      // Pfad (RecommendModal, aufgerufen aus TransactionDetailSheet) schrieb
      // die Empfehlung bisher NUR in die recommendations-Tabelle, ohne den
      // zugehörigen Chat zu schliessen — anders als der parallele In-Chat-
      // Bewertungspfad (ConversationRoom.jsx → submitBuyerRating() →
      // rpc_chat_submit_rating), der genau das schon korrekt tut. Da hier
      // NUR positive Empfehlungen möglich sind (kein Dispute-Zweig in diesem
      // Modal — der läuft separat über EmpfehlenModal "Nicht empfehlen"),
      // ist jede erfolgreiche Submission hier gleichbedeutend mit "recommend".
      // Fix: erweitert bestehende, bereits getestete RPC-Logik (rpc_chat_
      // submit_rating) statt eigene Close-Logik zu duplizieren (Architektur-
      // Charta Prinzip 1 "Erweitern statt duplizieren").
      try {
        const txId = orderId || bookingId;
        if (txId && currentUserId && toUserId) {
          const { data: matchingChat } = await supabase
            .from("chats")
            .select("id")
            .eq("booking_id", txId)
            .contains("participant_ids", [currentUserId, toUserId])
            .neq("state", "deleted")
            .maybeSingle();
          if (matchingChat?.id) {
            const closeResult = await submitBuyerRating(matchingChat.id, currentUserId, "recommend");
            if (closeResult?.error) {
              console.warn("[RECOMMEND-MODAL] Chat-Schliessung fehlgeschlagen:", closeResult.error);
            }
          }
        }
      } catch (chatErr) {
        // Empfehlung ist bereits gespeichert — Chat-Schliessung ist Zusatz-
        // Effekt, darf den Erfolg der Empfehlung selbst nicht blockieren.
        console.warn("[RECOMMEND-MODAL] Chat-Lookup/Close Fehler:", chatErr?.message);
      }

      setSubmitting(false);
      setShowSuccess(true);
    } catch (e) {
      setError(e.message || "Empfehlung konnte nicht gesendet werden.");
      setSubmitting(false);
    }
  };

  // ── Success-Popup (3 Sekunden) ──
  if (showSuccess) {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10600,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: T.bgCard,
            borderRadius: 20,
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 12px 48px rgba(20,20,34,0.25)",
            animation: "recPopIn 0.35s ease",
            maxWidth: 320,
            width: "85%",
          }}
        >
          {/* Checkmark Circle */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div style={{ fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 6, letterSpacing: "-0.02em" }}>
            Empfehlung gesendet
          </div>
          <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.5 }}>
            Danke! Deine Empfehlung ist jetzt im Profil von {toUserName || "diesem Mitglied"} sichtbar.
          </div>
        </div>

        <style>{`
          @keyframes recPopIn {
            0% { opacity: 0; transform: scale(0.85); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>,
      document.body
    );
  }

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
        data-hui-kbd-self-managed
        style={{
          width: "100%",
          // KEYBOARD-SCROLL-FIX (2026-08-18): Sheet schrumpft jetzt mit der Tastatur
          // (analog ProfilBearbeitenModal.jsx) UND ist selbst scrollbar — vorher
          // fixes maxHeight:85vh ohne overflowY:auto → Textarea+Button landeten
          // hinter der Tastatur, ohne Möglichkeit hinzuscrollen (Nutzer-Report).
          maxHeight: "calc(85vh - var(--hui-keyboard-inset, 0px))",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          background: T.bg,
          borderRadius: `${T.r16}px ${T.r16}px 0 0`,
          padding: "20px 20px calc(88px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: T.ff,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
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
            fontWeight: 600,
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
