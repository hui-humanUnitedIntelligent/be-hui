// MeineVerkaeufeModal.jsx — "Meine Verkäufe" (Studio-Bereich)
// ══════════════════════════════════════════════════════════
// Verschoben aus MyBasisProfile.jsx (Profil-Sektion T3b) in den Studio-Bereich,
// unter "Einnahmen & Statistiken" — Nutzeranfrage 2026-07-06.
// Liest unverändert die Commerce-2.0-SSOT (orders/order_items) über useMySales.js,
// keine neue Tabelle, keine neue Logik — nur der Anzeigeort hat sich geändert.
// Gleiches Bottom-Sheet-Muster wie StatistikenModal/EinAusgabenModal
// (createPortal → document.body, zIndex:10500 — Pflichtregel footer-navbar-zindex).
// ══════════════════════════════════════════════════════════

import { createPortal } from "react-dom";
import { useMySales } from "../../hooks/useMySales.js";
import { useState } from "react";
import EscrowStatusBadge from "../commerce/EscrowStatusBadge.jsx";
import SellerPayoutRequestSheet from "../commerce/SellerPayoutRequestSheet.jsx";

// ── Design Tokens (identisch zu den anderen Studio-Modals) ─────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.32)",
  border:   "rgba(26,26,24,0.08)",
  r16: 16, r12: 12, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
  ff: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

function fmtDate(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export default function MeineVerkaeufeModal({ profile, onClose = () => {} }) {
  const { sales, totalEarned, loading } = useMySales(profile?.id);
  const [payoutItem, setPayoutItem] = useState(null);

  const modal = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(26,26,24,0.52)", display: "flex", alignItems: "flex-end",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: T.bg, borderRadius: "24px 24px 0 0",
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 32px rgba(26,26,24,0.18)",
        fontFamily: T.ff,
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
              🛍️ Meine Verkäufe
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
              Abgeschlossene Käufe deiner Werke
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.inkSoft,
          }}>✕</button>
        </div>

        {/* Scroll-Content */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "0 20px 100px",
          WebkitOverflowScrolling: "touch",
        }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: T.inkSoft }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>🛍️</div>
              <div style={{ fontSize: 14 }}>Verkäufe werden geladen…</div>
            </div>
          )}

          {!loading && (
            <>
              {totalEarned > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, ${T.teal}18, ${T.teal}08)`,
                  borderRadius: T.r16, border: `1px solid rgba(14,196,184,0.22)`,
                  padding: "14px 16px", marginBottom: 16,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>Gesamt verdient</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.teal }}>
                    {totalEarned.toFixed(2)}€
                  </div>
                </div>
              )}

              {sales.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sales.map((s) => {
                    const cover = s.snapshot?.cover_url;
                    const title = s.snapshot?.title || "Werk";
                    return (
                      <div key={s.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: T.r12,
                        background: T.bgCard, border: `1px solid ${T.border}`,
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 9, overflow: "hidden",
                          flexShrink: 0, background: "#e8e4de",
                        }}>
                          {cover
                            ? <img loading="lazy" decoding="async" src={cover} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛍️</div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {title}
                          </div>
                          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>
                            {fmtDate(s.orders?.created_at || s.created_at)}
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: T.teal }}>
                            +{Number(s.payout_eur || 0).toFixed(2)}€
                          </div>
                          {s.orders?.escrow_status === 'holding' && (
                            <EscrowStatusBadge
                              escrowStatus={s.orders.escrow_status}
                              deliveryStatus={s.orders.delivery_status}
                              size="sm"
                            />
                          )}
                          {s.orders?.escrow_status === 'holding' && !s.orders?.payout_requested_at && (
                            <button
                              onClick={() => setPayoutItem({ id: s.orders.id, type: 'order', title: s.snapshot?.title })}
                              style={{ fontSize:10, fontWeight:700, color:'#FF8A6B', background:'rgba(255,138,107,0.1)',
                                border:'1px solid rgba(255,138,107,0.25)', borderRadius:8, padding:'3px 8px',
                                cursor:'pointer', whiteSpace:'nowrap', touchAction:'manipulation' }}>
                              Auszahlung beantragen
                            </button>
                          )}
                          {s.orders?.escrow_status === 'holding' && s.orders?.payout_requested_at && (
                            <span style={{ fontSize:10, color:'#F59E0B', fontWeight:600 }}>In Prüfung</span>
                          )}
                          {s.orders?.escrow_status === 'released' && (
                            <span style={{ fontSize:10, color:'#16D7C5', fontWeight:600 }}>✓ Freigegeben</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  padding: "14px 16px", borderRadius: T.r12,
                  background: T.bgCard, border: `1px solid ${T.border}`,
                  fontSize: 12.5, color: T.inkFaint, textAlign: "center",
                }}>
                  Noch keine Verkäufe — sobald jemand eines deiner Werke kauft, erscheint es hier.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modal, document.body)}
      {payoutItem && (
        <SellerPayoutRequestSheet
          item={payoutItem}
          onClose={() => setPayoutItem(null)}
          onSuccess={() => setPayoutItem(null)}
        />
      )}
    </>
  );
}
