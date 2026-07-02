// src/components/commerce/CreatorSupportSheet.jsx
// Commerce 2.0 — Creator-Unterstützung (Phase 2.4)
// Betrag wählen → WerkeKorb → UnterstützenFlow → Stripe
import React, { useState, useCallback, useEffect } from "react";
import { buildSupportCartItem, haptic } from "./commerceUtils.js";

const T = {
  bg: "#FAFAF8", ink: "#1A1A2E", soft: "rgba(26,26,46,0.55)",
  teal: "#16D7C5", coral: "#FF8A6B", border: "rgba(26,26,46,0.08)",
};
const QUICK_AMOUNTS = [3, 5, 10, 20];

let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes cs-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    .cs-tap{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
  `;
  document.head.appendChild(s);
}

/**
 * Commerce 2.0 Support-Einstieg: Betrag wählen, dann in den WerkeKorb.
 * @param {{ creator, visible, onClose, onAddToCart: (item) => void, onOpenKorb?: () => void }} props
 */
export default function CreatorSupportSheet({
  creator,
  visible,
  onClose,
  onAddToCart,
  onOpenKorb,
}) {
  injectCSS();
  const [amount, setAmount] = useState(5);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) {
      setAmount(5);
      setCustom("");
      setMessage("");
      setError(null);
    }
  }, [visible]);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleContinue = useCallback(() => {
    if (!creator?.id && !creator?.user_id) {
      setError("Creator nicht gefunden.");
      return;
    }
    if (!finalAmount || finalAmount < 1) {
      setError("Mindestbetrag: 1 €");
      return;
    }
    const item = buildSupportCartItem(creator, finalAmount, message.trim());
    if (!item) {
      setError("Konnte nicht zum Korb hinzugefügt werden.");
      return;
    }
    haptic("success");
    onAddToCart?.(item);
    onOpenKorb?.();
    onClose?.();
  }, [creator, finalAmount, message, onAddToCart, onOpenKorb, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9600,
        background: "rgba(6,10,20,0.65)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, background: T.bg,
        borderRadius: "28px 28px 0 0",
        padding: `0 0 max(24px, env(safe-area-inset-bottom, 24px))`,
        animation: "cs-rise 0.38s cubic-bezier(0.22,1,0.36,1) both",
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)" }} />
        </div>
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, overflow: "hidden",
              background: "rgba(22,215,197,0.10)", border: `2px solid ${T.teal}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {creator?.avatar_url || creator?.img
                ? <img src={creator.avatar_url || creator.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 18, fontWeight: 700, color: T.teal }}>
                    {(creator?.display_name || creator?.name || "T")[0].toUpperCase()}
                  </span>}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>
                {creator?.display_name || creator?.name || "Dieses Talent"} unterstützen
              </div>
              <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>
                Wird in deinen WerkeKorb gelegt ✦
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.soft, letterSpacing: 0.5, marginBottom: 9 }}>
              BETRAG WÄHLEN
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {QUICK_AMOUNTS.map(v => (
                <button
                  key={v}
                  className="cs-tap"
                  onClick={() => { setAmount(v); setCustom(""); setError(null); }}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 14,
                    border: !custom && amount === v ? "none" : `1.5px solid ${T.border}`,
                    background: !custom && amount === v
                      ? `linear-gradient(135deg,${T.teal},${T.coral})`
                      : "white",
                    color: !custom && amount === v ? "white" : T.ink,
                    fontSize: 15, fontWeight: !custom && amount === v ? 700 : 500,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {v} €
                </button>
              ))}
            </div>
          </div>

          <div style={{
            marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
            padding: "12px 16px", borderRadius: 14,
            border: `1.5px solid ${custom ? T.teal : T.border}`,
            background: "white",
          }}>
            <span style={{ fontSize: 16, color: T.soft }}>€</span>
            <input
              type="number"
              placeholder="Eigener Betrag"
              value={custom}
              onChange={e => { setCustom(e.target.value); setError(null); }}
              min={1}
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontSize: 15, color: T.ink, fontFamily: "inherit",
              }}
            />
          </div>

          <textarea
            placeholder="Eine kleine Nachricht (optional) ✦"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={200}
            rows={2}
            style={{
              width: "100%", borderRadius: 14, border: `1.5px solid ${T.border}`,
              background: "white", padding: "12px 16px", fontSize: 14, color: T.ink,
              lineHeight: 1.6, fontFamily: "inherit", resize: "none", outline: "none",
              boxSizing: "border-box", marginBottom: 16,
            }}
          />

          {error && (
            <div style={{
              marginBottom: 14, padding: "10px 14px", borderRadius: 12,
              background: "rgba(255,138,107,0.10)", border: "1px solid rgba(255,138,107,0.25)",
              fontSize: 13, color: T.coral,
            }}>
              {error}
            </div>
          )}

          <button
            className="cs-tap"
            onClick={handleContinue}
            disabled={!finalAmount}
            style={{
              width: "100%", padding: "17px", borderRadius: 18, border: "none",
              background: `linear-gradient(135deg,${T.teal},${T.coral})`,
              color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            In den WerkeKorb · {finalAmount || "…"} € ✦
          </button>
        </div>
      </div>
    </div>
  );
}
