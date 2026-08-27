// src/components/shared/VerbindenModal.jsx
// MOMENT-CONNECT (2026-08-25, Michael-Vorgabe)
// Modal das beim Klick auf "Verbinden" unter einem Moment-Post erscheint.
// Zeigt einen Info-Text und öffnet bei Bestätigung einen direkten Chat.
// NUR für Momente — wird von MomentContent.jsx gerendert.
//
// Architektur-Regeln:
// - createPortal zu document.body (Stacking-Context-Fix, siehe footer-navbar-zindex.md)
// - zIndex >= 10500 (über BottomNav), via Prop konfigurierbar — Aufrufer
//   ÜBER anderen Overlays (z.B. PostFullscreenView, zIndex 15000) MÜSSEN
//   einen höheren Wert übergeben, sonst rendert das Modal unsichtbar
//   dahinter (BUGFIX 2026-08-25: genau dieser Fall bei Verbinden-Button
//   im Post-Modal — Klick tat scheinbar nichts, Modal war nur verdeckt).
// - padding-bottom: 88px (Navbar + Luft)
// - Keine Beeinflussung von Kauf-/Verkaufs-Chats

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext.jsx";
import { createMomentChat } from "../../lib/chatContext.js";
import { haptic } from "../commerce/commerceUtils.js";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "../../hooks/useTranslation.js";

// ── Farben (Design System) ────────────────────────────────────
const T = {
  tealDeep: "#0AA89B",
  teal:     "#0DC4B5",
  ink:      "#1A1A2E",
  inkSoft:  "rgba(26,26,46,0.50)",
  bg:       "#FFFFFF",
  border:   "rgba(26,26,46,0.08)",
  overlay:  "rgba(0,0,0,0.45)",
  r20:      20,
  r99:      99,
};

// ── Verbinden-Icon (zwei Pfeile die sich treffen) ──────────────
function VerbindenIcon({ size = 22, color = T.tealDeep }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 12h8" />
      <path d="M12 8l4 4-4 4" />
      <path d="M4 8v8" />
      <path d="M20 8v8" />
    </svg>
  );
}

export default function VerbindenModal({
  open       = false,
  onClose    = () => {},
  otherUser  = null,   // { id, display_name, avatar_url }
  momentId   = null,
  onChatOpened = () => {},  // Callback nach erfolgreicher Chat-Erstellung
  zIndex     = 10500,   // BUGFIX 2026-08-25: konfigurierbar — muss höher sein
                         // als jedes Overlay, aus dem das Modal geöffnet wird
                         // (z.B. 15600 aus PostFullscreenView, das selbst 15000 ist)
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const displayName = otherUser?.display_name || otherUser?.name || "diese Person";

  async function handleConnect() {
    if (!user?.id || !otherUser?.id) return;
    if (connecting) return;
    setConnecting(true);
    setError(null);
    haptic("light");

    try {
      const result = await createMomentChat({
        userId:      user.id,
        otherUserId: otherUser.id,
        momentId:    momentId,
      });

      if (result?.ok) {
        // SADB-Event: moment_connect_clicked (bereits beim Klick geloggt,
        // aber hier loggen wir auch moment_chat_opened)
        try {
          await supabase.from("moment_events").insert({
            event_type: "moment_chat_opened",
            moment_id:  momentId,
            chat_id:    result.chat_id,
            user_id:    user.id,
            other_user_id: otherUser.id,
            created_at: new Date().toISOString(),
          });
        } catch { /* silent */ }

        onChatOpened?.(result);
        onClose?.();
      } else {
        setError(t("verb.errConnectFailed"));
      }
    } catch (e) {
      setError("Ein Fehler ist aufgetreten: " + (e?.message || "unbekannt"));
    } finally {
      setConnecting(false);
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        background: T.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bg,
          borderRadius: T.r20,
          width: "100%",
          maxWidth: 380,
          padding: "28px 24px 32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          animation: "huiVerbindenIn 0.22s ease-out",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(13,196,181,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          flexShrink: 0,
        }}>
          <VerbindenIcon size={28} color={T.tealDeep} />
        </div>

        {/* Titel */}
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: T.ink,
          margin: 0,
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}>
          Mit {displayName} verbinden
        </h2>

        {/* Info-Text */}
        <p style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: T.inkSoft,
          margin: 0,
          marginBottom: 24,
          maxWidth: 280,
        }}>
          Hier kannst du direkt mit diesem Nutzer chatten, um euch auszutauschen.
        </p>

        {/* Error */}
        {error && (
          <p style={{
            fontSize: 13,
            color: "#C47A65",
            marginBottom: 16,
            margin: "0 0 16px 0",
          }}>
            {error}
          </p>
        )}

        {/* Chat öffnen Button */}
        <button
          onClick={handleConnect}
          disabled={connecting}
          style={{
            width: "100%",
            height: 48,
            borderRadius: T.r99,
            border: "none",
            background: connecting ? "rgba(13,196,181,0.6)" : T.tealDeep,
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            cursor: connecting ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
            touchAction: "manipulation",
            opacity: connecting ? 0.7 : 1,
            transition: "all 0.18s ease",
          }}
        >
          {connecting ? (
            <>
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#FFFFFF",
                animation: "huiSpin 0.6s linear infinite",
              }} />
              Verbinden...
            </>
          ) : (
            <>
              <VerbindenIcon size={18} color="#FFFFFF" />
              Chat öffnen
            </>
          )}
        </button>

        {/* Abbrechen */}
        <button
          onClick={onClose}
          disabled={connecting}
          style={{
            marginTop: 12,
            background: "transparent",
            border: "none",
            color: T.inkSoft,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            padding: "8px 16px",
            fontFamily: "inherit",
          }}
        >
          Abbrechen
        </button>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes huiVerbindenIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes huiSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
}
