import { HUIVerkaufIcon } from '../../design/icons/HuiSystemIcons.jsx';
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
import { supabase } from "../../lib/supabaseClient.js";
import { useState } from "react";
import EscrowStatusBadge from "../commerce/EscrowStatusBadge.jsx";
import SellerPayoutRequestSheet from "../commerce/SellerPayoutRequestSheet.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { formatDateDE } from "../../lib/formatters.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";

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
  ff: "Inter,sans-serif",
};

function fmtDate(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  return formatDateDE(dt, { day: "2-digit", month: "short" });
}

export default function MeineVerkaeufeModal({ profile, onClose = () => {} }) {
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  useModalRegistration(true, onClose, "MeineVerkaeufeModal");
  const { sales, totalEarned, loading } = useMySales(profile?.id);
  const [payoutItem, setPayoutItem] = useState(null);
  const [shippingId, setShippingId] = useState(null);
  const [shipTracking, setShipTracking] = useState("");
  const [shipCarrier, setShipCarrier] = useState("");
  const [shipError, setShipError] = useState("");

  const handleShip = async (orderId) => {
    setShipError("");
    try {
      const { data, error } = await supabase.rpc("rpc_seller_mark_shipped_v2", {
        p_order_id: orderId,
        p_tracking_number: shipTracking.trim() || null,
        p_carrier: shipCarrier.trim() || null,
      });
      if (error) throw error;
      if (data && !data.ok && !data.skipped) throw new Error(data.error || "Fehler");
      setShippingId(null);
      setShipTracking("");
      setShipCarrier("");
      // Reload via hook
      window.dispatchEvent(new CustomEvent("hui:sales:reload"));
    } catch (e) {
      setShipError(e?.message || "Fehler beim Versenden");
    }
  };

  const formatAddr = (addr) => {
    if (!addr || typeof addr !== "object") return "";
    const parts = [
      [addr.first_name, addr.last_name].filter(Boolean).join(" "),
      addr.street,
      [addr.zip, addr.city].filter(Boolean).join(" "),
      addr.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

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
        background: T.bg, borderRadius: "24px 24px 0 0", transform: sheetTransform, transition: sheetTransition,
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 32px rgba(26,26,24,0.18)",
        fontFamily: T.ff,
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div {...dragHandlers} style={{ touchAction:"none", cursor:"grab", width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>
              
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
              <div style={{marginBottom:10, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.6)"}}><HUIVerkaufIcon size={24}/></div>
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
                  <div style={{ fontSize: 18, fontWeight: 600, color: T.teal }}>
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
                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIVerkaufIcon size={24}/></div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {title}
                          </div>
                          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>
                            {fmtDate(s.orders?.created_at || s.created_at)}
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.teal }}>
                            +{Number(s.payout_eur || 0).toFixed(2)}€
                          </div>
                          {s.orders?.escrow_status === 'holding' && (
                            <EscrowStatusBadge
                              escrowStatus={s.orders.escrow_status}
                              deliveryStatus={s.orders.delivery_status}
                              size="sm"
                            />
                          )}
                          {s.orders?.escrow_status === 'holding' && !s.orders?.shipped_at && (
                            <button
                              onClick={() => setShippingId(s.orders.id)}
                              style={{ fontSize:10, fontWeight: 600, color:'#0EC4B8', background:'rgba(14,196,184,0.1)',
                                border:'1px solid rgba(14,196,184,0.25)', borderRadius:8, padding:'3px 8px',
                                cursor:'pointer', whiteSpace:'nowrap', touchAction:'manipulation' }}>
                              Versendet
                            </button>
                          )}
                          {s.orders?.escrow_status === 'holding' && !s.orders?.payout_requested_at && s.orders?.shipped_at && (
                            <button
                              onClick={() => setPayoutItem({ id: s.orders.id, type: 'order', title: s.snapshot?.title })}
                              style={{ fontSize:10, fontWeight: 600, color:'#FF8A6B', background:'rgba(255,138,107,0.1)',
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
      {shippingId && (
        createPortal(
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setShippingId(null); }}
            style={{ position:"fixed", inset:0, zIndex:10500, background:"rgba(26,26,24,0.52)",
              display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div style={{ width:"100%", maxWidth:420, background:T.bg, borderRadius:"24px 24px 0 0",
              maxHeight:"80dvh", display:"flex", flexDirection:"column", fontFamily:T.ff,
              boxShadow:"0 -4px 32px rgba(26,26,24,0.18)",
              animation:"shipSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both" }}>
              <style>{`@keyframes shipSlideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
              <div style={{ touchAction:"none", cursor:"grab", width:40, height:4, borderRadius:2,
                background:"rgba(26,26,24,0.12)", margin:"12px auto 0", flexShrink:0 }} />
              <div style={{ padding:"10px 20px 8px", flexShrink:0 }}>
                <div style={{ fontSize:18, fontWeight:600, color:T.ink, letterSpacing:"-0.02em" }}>
                  Ware versenden
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"0 20px 16px" }}>
                {(() => {
                  const sale = sales.find(s => s.orders?.id === shippingId);
                  const addr = sale?.orders?.shipping_address;
                  return addr ? (
                    <div style={{ background:T.bgCard, borderRadius:T.r12, border:`1px solid ${T.border}`,
                      padding:"12px 14px", marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T.inkSoft, textTransform:"uppercase",
                        letterSpacing:"0.04em", marginBottom:6 }}>Lieferadresse</div>
                      <div style={{ fontSize:14, color:T.ink, lineHeight:1.6 }}>
                        {formatAddr(addr)}
                      </div>
                    </div>
                  ) : null;
                })()}
                <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:6 }}>
                  Tracking-Nummer (optional)
                </div>
                <input
                  value={shipTracking}
                  onChange={(e) => setShipTracking(e.target.value)}
                  placeholder="z.B. DHL 123456789"
                  data-hui-kbd-self-managed
                  style={{ width:"100%", border:`1.5px solid ${T.border}`, borderRadius:T.r12,
                    padding:"12px 14px", fontSize:14, color:T.ink, background:T.bgCard,
                    outline:"none", marginBottom:10, fontFamily:T.ff, boxSizing:"border-box" }}
                />
                <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:6 }}>
                  Versanddienst (optional)
                </div>
                <input
                  value={shipCarrier}
                  onChange={(e) => setShipCarrier(e.target.value)}
                  placeholder="z.B. DHL, Hermes, UPS"
                  data-hui-kbd-self-managed
                  style={{ width:"100%", border:`1.5px solid ${T.border}`, borderRadius:T.r12,
                    padding:"12px 14px", fontSize:14, color:T.ink, background:T.bgCard,
                    outline:"none", marginBottom:10, fontFamily:T.ff, boxSizing:"border-box" }}
                />
                {shipError && (
                  <div style={{ fontSize:13, color:T.red || "#E83A3A", padding:"10px 12px", borderRadius:T.r8,
                    background:"rgba(232,58,58,0.07)", marginBottom:10 }}>{shipError}</div>
                )}
              </div>
              <div style={{ flexShrink:0, padding:`12px 20px calc(max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 16px), 16px) + 12px)`,
                background:T.bg, borderTop:`1px solid ${T.border}`, display:"flex", gap:10 }}>
                <button
                  onClick={() => { setShippingId(null); setShipTracking(""); setShipCarrier(""); setShipError(""); }}
                  style={{ flex:1, padding:"13px 0", borderRadius:T.r99,
                    background:T.bgCard, color:T.inkSoft, border:`1px solid ${T.border}`,
                    fontSize:14, fontWeight:600, cursor:"pointer", touchAction:"manipulation", fontFamily:T.ff }}>
                  Abbrechen
                </button>
                <button
                  onClick={() => handleShip(shippingId)}
                  style={{ flex:2, padding:"13px 0", borderRadius:T.r99,
                    background:`linear-gradient(135deg, ${T.teal}, #0EC4B8)`, color:"#fff",
                    border:"none", fontSize:14, fontWeight:600, cursor:"pointer",
                    touchAction:"manipulation", fontFamily:T.ff }}>
                  Als versendet markieren
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </>
  );
}
