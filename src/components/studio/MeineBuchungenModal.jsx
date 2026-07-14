import { HUIKalenderIcon, HUIWarnIcon } from '../../design/icons/HuiSystemIcons.jsx';
// MeineBuchungenModal.jsx — "Meine Buchungen" (Studio-Bereich)
// ══════════════════════════════════════════════════════════
// Verschoben aus MyBasisProfile.jsx (Profil-Sektion T2c) in den Studio-Bereich,
// unter "Einnahmen & Statistiken" — Nutzeranfrage 2026-07-06 (gleiches Muster
// wie MeineVerkaeufeModal.jsx).
// Liest unverändert über useTalentBookings.js (talent_bookings SSOT, siehe
// TALENT-BOOKING-PAYMENT-001 / Memory #536) — keine neue Tabelle, keine neue
// Logik, Stornieren weiterhin ausschließlich über rpc_cancel_talent_booking.
// Gleiches Bottom-Sheet-Muster wie StatistikenModal/EinAusgabenModal/
// MeineVerkaeufeModal (createPortal → document.body, zIndex:10500 —
// Pflichtregel footer-navbar-zindex).
// ══════════════════════════════════════════════════════════

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTalentBookings } from "../../hooks/useTalentBookings.js";

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

function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day:"2-digit", month:"short", year:"numeric" }); }
  catch { return d; }
}

function statusBadge(status) {
  const map = {
    confirmed:       { label:"Bestätigt",        bg:T.tealSoft, color:T.teal },
    pending_payment: { label:"Zahlung offen",     bg:"rgba(217,119,6,0.10)", color:"#D97706" },
    cancelled:       { label:"Storniert",         bg:"rgba(26,26,24,0.06)", color:T.inkFaint },
    completed:       { label:"Abgeschlossen",     bg:"rgba(26,26,24,0.06)", color:T.inkSoft },
  };
  const s = map[status] || { label:status, bg:"rgba(26,26,24,0.06)", color:T.inkFaint };
  return (
    <span style={{
      fontSize:10.5, fontWeight:700, color:s.color, background:s.bg,
      padding:"3px 8px", borderRadius:T.r99, whiteSpace:"nowrap",
    }}>
      {s.label}
    </span>
  );
}

function BookingRow({ b, forSeller, onCancelClick }) {
  const cover = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
  const title = b.talents?.title || "Talent-Angebot";
  const canCancel = b.status === "confirmed" || b.status === "pending_payment";
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"8px 10px", borderRadius:T.r12,
      background:T.bgCard, border:`1px solid ${T.border}`,
    }}>
      <div style={{
        width:38, height:38, borderRadius:9, overflow:"hidden",
        flexShrink:0, background:"#e8e4de",
      }}>
        {cover
          ? <img loading="lazy" decoding="async" src={cover} alt={title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"rgba(14,196,184,0.7)" }}>HUI</div>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {title}
        </div>
        <div style={{ fontSize:11, color:T.inkFaint, marginTop:1 }}>
          {fmtDate(b.selected_date)}{b.selected_time_slot ? ` · ${b.selected_time_slot.start}–${b.selected_time_slot.end}` : ""}
          {" · "}{forSeller ? `Kunde: ${b.other_name}` : `bei ${b.other_name}`}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
        {statusBadge(b.status)}
        <div style={{ fontSize:12, fontWeight:800, color:T.ink }}>
          {Number(b.amount_eur || 0).toFixed(2)}€
        </div>
      </div>
      {canCancel && (
        <button
          onClick={() => onCancelClick({ id:b.id, title })}
          className="mbp-press-light"
          style={{
            marginLeft:4, flexShrink:0, background:"transparent", border:"none",
            color:"#E83A3A", fontSize:11, fontWeight:700, cursor:"pointer",
            padding:"6px 4px", touchAction:"manipulation",
          }}
        >
          Stornieren
        </button>
      )}
    </div>
  );
}

export default function MeineBuchungenModal({ profile, onClose }) {
  const { asCustomer: myBookings, asSeller: bookingRequests, cancelBooking, loading } = useTalentBookings(profile?.id);

  const [confirmBooking, setConfirmBooking] = useState(null); // { id, title }
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState("");
  const [lastCancelResult, setLastCancelResult] = useState(null);

  async function handleConfirmCancel() {
    if (!confirmBooking) return;
    setCancelling(true);
    setCancelErr("");
    const res = await cancelBooking(confirmBooking.id);
    setCancelling(false);
    if (res?.ok) {
      setConfirmBooking(null);
      setLastCancelResult(res);
      setTimeout(() => setLastCancelResult(null), 7000);
    } else {
      setCancelErr(res?.error || "Stornieren fehlgeschlagen.");
    }
  }

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
              
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
              Talent-Termine & Anfragen für deine Angebote
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
              <div style={{marginBottom:10, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)"}}><HUIKalenderIcon size={24}/></div>
              <div style={{ fontSize: 14 }}>Buchungen werden geladen…</div>
            </div>
          )}

          {!loading && (
            <>
              {lastCancelResult && (
                <div style={{
                  padding:"10px 14px", borderRadius:T.r12, marginBottom:14,
                  background: lastCancelResult.refundApplicable && lastCancelResult.refundOk === false
                    ? "rgba(232,58,58,0.10)" : T.tealSoft,
                  color: lastCancelResult.refundApplicable && lastCancelResult.refundOk === false
                    ? "#E83A3A" : T.teal,
                  fontSize:12.5, fontWeight:600, lineHeight:1.4,
                }}>
                  {lastCancelResult.refundApplicable
                    ? (lastCancelResult.refundOk
                        ? "Storniert — dein Geld wird automatisch zurückerstattet."
                        : `Storniert, aber die automatische Rückerstattung ist fehlgeschlagen (${lastCancelResult.refundError || "unbekannter Fehler"}). Bitte Support kontaktieren.`)
                    : "Storniert."}
                </div>
              )}

              {myBookings.length === 0 && bookingRequests.length === 0 ? (
                <div style={{
                  padding: "14px 16px", borderRadius: T.r12,
                  background: T.bgCard, border: `1px solid ${T.border}`,
                  fontSize: 12.5, color: T.inkFaint, textAlign: "center",
                }}>
                  Noch keine Buchungen — hier erscheinen deine gebuchten Termine und Anfragen für deine Talent-Angebote.
                </div>
              ) : (
                <>
                  {myBookings.length > 0 && (
                    <div style={{ marginBottom: bookingRequests.length > 0 ? 18 : 0 }}>
                      <div style={{ padding:"0 0 10px" }}>
                        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>Meine Buchungen</div>
                        <div style={{ fontSize:11, color:T.inkFaint, marginTop:2, fontWeight:400 }}>Termine, die du gebucht hast</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {myBookings.slice(0, 8).map(b => (
                          <BookingRow key={b.id} b={b} forSeller={false}
                            onCancelClick={(info) => setConfirmBooking(info)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {bookingRequests.length > 0 && (
                    <div>
                      <div style={{ padding:"0 0 10px" }}>
                        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>Anfragen für meine Angebote</div>
                        <div style={{ fontSize:11, color:T.inkFaint, marginTop:2, fontWeight:400 }}>Buchungen anderer für deine Talent-Angebote</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {bookingRequests.slice(0, 8).map(b => (
                          <BookingRow key={b.id} b={b} forSeller={true}
                            onCancelClick={(info) => setConfirmBooking(info)} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
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

      {confirmBooking && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget && !cancelling) setConfirmBooking(null); }}
          style={{
            position:"fixed", inset:0, zIndex:10510, /* über dem Buchungen-Sheet (10500) — Pflichtregel footer-navbar-zindex.md */
            background:"rgba(0,0,0,0.55)", display:"flex",
            alignItems:"center", justifyContent:"center", padding:"24px",
          }}
        >
          <div style={{
            background:"#fff", borderRadius:16, padding:"24px 20px 20px",
            maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
          }}>
            <div style={{ textAlign:"center", marginBottom:8, display:"flex", justifyContent:"center", color:"#F59E0B" }}><HUIWarnIcon size={36}/></div>
            <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
              Buchung stornieren?
            </div>
            <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:16 }}>
              <strong>„{confirmBooking.title}"</strong> wird storniert. Bereits bezahlte Beträge werden automatisch zurückerstattet.
            </div>
            {cancelErr && (
              <div style={{ fontSize:12, color:"#E83A3A", textAlign:"center", marginBottom:12 }}>{cancelErr}</div>
            )}
            <button onClick={handleConfirmCancel} disabled={cancelling} style={{
              width:"100%", padding:"12px", borderRadius:99,
              background: cancelling ? "rgba(232,58,58,0.5)" : "#E83A3A", border:"none", color:"#fff",
              fontSize:14, fontWeight:700, cursor: cancelling ? "not-allowed" : "pointer",
              fontFamily:"inherit", marginBottom:8,
            }}>
              {cancelling ? "Wird storniert…" : "Ja, stornieren"}
            </button>
            <button onClick={() => setConfirmBooking(null)} disabled={cancelling} style={{
              width:"100%", padding:"12px", borderRadius:99,
              background:"#f0f0ee", border:"none", color:"#444",
              fontSize:14, fontWeight:600, cursor:"pointer",
              fontFamily:"inherit",
            }}>
              Zurück
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
