// src/components/commerce/WerkKaufFlow.jsx — COMMERCE-01
// Bottom-Sheet: Werk kaufen → salesService.createSale() → Notification → Bestätigung
// Keine neuen Systeme. Kein Stripe. payment_status bleibt "pending" für Beta.
import React, { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { salesService } from "../../services/creatorEconomy";
import { supabase } from "../../lib/supabaseClient";

const CORAL = "#FF8A6B";
const TEAL  = "#16D7C5";

export default function WerkKaufFlow({ werk, onClose }) {
  const { user } = useAuth();
  const [phase,   setPhase]   = useState("confirm"); // confirm | loading | success | error
  const [errMsg,  setErrMsg]  = useState("");

  if (!werk) return null;

  // Normalisiere Werk-Daten aus verschiedenen Feed-Shapes
  const workId    = werk.id || werk._raw?.id;
  const creatorId = werk.author?.id || werk._raw?.user_id || werk._raw?.creator_id || werk.creator_id;
  const title     = werk.title || werk._raw?.title || werk.name || "Werk";
  const coverUrl  = werk.author?.avatar || werk._raw?.cover_url || werk.cover_url || werk.img;
  const rawPrice  = werk._raw?.price ?? werk.price ?? null;
  const amount    = typeof rawPrice === "string"
    ? parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", "."))
    : typeof rawPrice === "number" ? rawPrice : 0;
  const priceStr  = amount > 0 ? `${amount.toFixed(2).replace(".", ",")} €` : null;

  async function handleKauf() {
    if (!user?.id)    return setErrMsg("Nicht eingeloggt.");
    if (!workId)      return setErrMsg("Werk-ID fehlt.");
    if (!creatorId)   return setErrMsg("Creator-ID fehlt.");
    if (user.id === creatorId) return setErrMsg("Du kannst dein eigenes Werk nicht kaufen.");

    setPhase("loading");
    setErrMsg("");

    const { data, error } = await salesService.createSale({
      workId,
      creatorId,
      buyerId: user.id,
      amount:  amount > 0 ? amount : 0,
    });

    if (error) {
      setErrMsg(error);
      setPhase("error");
      return;
    }

    // Notification an Creator
    await supabase.from("notifications").insert({
      user_id:    creatorId,
      type:       "work_sold",
      text:       `Dein Werk "${title}" wurde angefragt.`,
      read:       false,
      actor_id:   user.id,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    setPhase("success");
  }

  // ── Overlay-Backdrop ────────────────────────────────────────────
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
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
      }}>
        <style>{`
          @keyframes wkfSlideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)",
          margin: "0 auto 24px" }} />

        {phase === "success" ? (
          /* ── Bestätigung ── */
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
              Anfrage gesendet
            </div>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", marginBottom: 28, lineHeight: 1.5 }}>
              Der Creator wurde benachrichtigt und meldet sich bei dir.
            </div>
            <button onClick={onClose} style={{
              background: TEAL, color: "#fff", border: "none",
              borderRadius: 14, padding: "12px 32px",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>
              Schließen
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
              {coverUrl && (
                <img src={coverUrl} alt={title} style={{
                  width: 56, height: 56, borderRadius: 14,
                  objectFit: "cover", flexShrink: 0,
                  border: "1px solid rgba(26,26,46,0.08)",
                }} />
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: CORAL,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Werk kaufen
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3 }}>
                  {title}
                </div>
              </div>
            </div>

            {/* ── Preis ── */}
            {priceStr && (
              <div style={{
                background: "rgba(255,138,107,0.08)",
                border: "1px solid rgba(255,138,107,0.18)",
                borderRadius: 14, padding: "12px 16px",
                marginBottom: 20,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "rgba(26,26,46,0.55)" }}>Preis</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: CORAL }}>{priceStr}</span>
              </div>
            )}

            {/* ── Beta-Hinweis ── */}
            <div style={{
              fontSize: 12, color: "rgba(26,26,46,0.45)",
              marginBottom: 20, lineHeight: 1.5,
              padding: "10px 12px",
              background: "rgba(22,215,197,0.06)",
              borderRadius: 10,
              border: "1px solid rgba(22,215,197,0.15)",
            }}>
              🌱 Beta: Deine Anfrage wird direkt an den Creator übermittelt.
              Die Zahlung wird separat abgewickelt.
            </div>

            {/* ── Fehler ── */}
            {phase === "error" && errMsg && (
              <div style={{
                fontSize: 13, color: "#E83A3A", marginBottom: 16,
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(232,58,58,0.07)",
              }}>
                {errMsg}
              </div>
            )}

            {/* ── Buttons ── */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{
                flex: 1, background: "transparent",
                border: "1.5px solid rgba(26,26,46,0.15)",
                borderRadius: 14, padding: "12px 0",
                fontSize: 14, fontWeight: 600, color: "rgba(26,26,46,0.55)",
                cursor: "pointer",
              }}>
                Abbrechen
              </button>
              <button
                onClick={handleKauf}
                disabled={phase === "loading"}
                style={{
                  flex: 2,
                  background: phase === "loading"
                    ? "rgba(255,138,107,0.4)"
                    : "linear-gradient(135deg,#FF8A6B,#E8613A)",
                  color: "#fff", border: "none",
                  borderRadius: 14, padding: "12px 0",
                  fontSize: 15, fontWeight: 700,
                  cursor: phase === "loading" ? "not-allowed" : "pointer",
                  touchAction: "manipulation",
                }}
              >
                {phase === "loading" ? "Wird gesendet…" : `Anfrage senden${priceStr ? ` · ${priceStr}` : ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
