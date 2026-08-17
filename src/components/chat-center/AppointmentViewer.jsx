// AppointmentViewer.jsx v1 (2026-08-17)
// Zeigt vorhandene Talent-Buchungen + Erlebnis-Käufe mit dem Chat-Partner.
// "Aktuell": Termine mit Datum >= heute
// "Vergangen": Termine mit Datum < heute (archiviert)

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HUI } from "../../design/hui.design.js";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { getFullDisplayName } from "../../lib/profileUtils.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.55)" };

const STATUS_LABELS = {
  pending_payment: "Ausstehend",
  confirmed:        "Bestätigt",
  completed:        "Abgeschlossen",
  cancelled:        "Storniert",
  holding:          "In Escrow",
  released:         "Ausgezahlt",
  new:              "Neu",
  pending:          "Ausstehend",
  shipped:          "Versendet",
  delivered:        "Geliefert",
  executed:         "Durchgeführt",
};

function formatDateDE(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { weekday:"short", day:"numeric", month:"long", year:"numeric" });
}

export default function AppointmentViewer({ otherUserId, otherName = "", onClose = () => {} }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !otherUserId) { setLoading(false); return; }
    loadAppointments();
  }, [user?.id, otherUserId]);

  async function loadAppointments() {
    try {
      // 1. Talent-Buchungen: ich als customer, other als seller
      const { data: talentBookings } = await supabase
        .from("talent_bookings")
        .select(`
          id, selected_date, selected_time_slot, participants, status,
          amount_eur, currency, confirmed_at, created_at,
          talent_id
        `)
        .eq("customer_id", user.id)
        .eq("seller_id", otherUserId)
        .order("selected_date", { ascending: false });

      // Talent-Titel laden
      const talentIds = (talentBookings || []).map(b => b.talent_id).filter(Boolean);
      let talentMap = {};
      if (talentIds.length > 0) {
        const { data: talents } = await supabase
          .from("talents")
          .select("id, title")
          .in("id", talentIds);
        (talents || []).forEach(t => { talentMap[t.id] = t.title; });
      }

      const talentApps = (talentBookings || []).map(b => ({
        id:           b.id,
        type:         "Talent",
        title:        talentMap[b.talent_id] || "Talent-Buchung",
        date:         b.selected_date,
        timeSlot:     b.selected_time_slot,
        participants: b.participants,
        status:       b.status,
        amount:       b.amount_eur,
        currency:     b.currency || "EUR",
        confirmedAt:  b.confirmed_at,
        createdAt:    b.created_at,
      }));

      // 2. Erlebnis-Käufe: order_items mit item_type='experience', seller = otherUserId
      const { data: orders } = await supabase
        .from("orders")
        .select("id, created_at")
        .eq("customer_id", user.id);

      const orderIds = (orders || []).map(o => o.id);
      let experienceApps = [];
      if (orderIds.length > 0) {
        const { data: expItems } = await supabase
          .from("order_items")
          .select(`
            id, order_id, item_type, item_id, snapshot,
            unit_price_eur, quantity, fulfillment_status,
            escrow_status, created_at
          `)
          .in("order_id", orderIds)
          .eq("item_type", "experience")
          .eq("seller_id", otherUserId);

        experienceApps = (expItems || []).map(oi => ({
          id:           oi.id,
          type:         "Erlebnis",
          title:        oi.snapshot?.title || oi.snapshot?.name || "Erlebnis",
          date:         oi.snapshot?.date || oi.created_at?.slice(0, 10),
          timeSlot:     oi.snapshot?.time_slot || null,
          participants: oi.quantity || 1,
          status:       oi.fulfillment_status || oi.escrow_status || "pending",
          amount:       oi.unit_price_eur * (oi.quantity || 1),
          currency:     "EUR",
          confirmedAt:  null,
          createdAt:    oi.created_at,
        }));
      }

      const all = [...talentApps, ...experienceApps].sort((a, b) =>
        new Date(b.date || 0) - new Date(a.date || 0)
      );
      setAppointments(all);
    } catch (e) {
      console.warn("[AppointmentViewer] load error:", e?.message);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(a => (a.date || "") >= today);
  const past     = appointments.filter(a => (a.date || "") < today);

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(0,0,0,0.4)",
      display:"flex", flexDirection:"column",
      justifyContent:"flex-end",
      fontFamily:"Inter, sans-serif",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#F2F4F8",
          borderRadius:"24px 24px 0 0",
          maxHeight:"85vh", overflow:"hidden",
          display:"flex", flexDirection:"column",
          paddingBottom:"calc(88px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Header */}
        <div style={{
          padding:"max(env(safe-area-inset-top, 0px), 20px) 20px 16px",
          background:"rgba(255,255,255,0.90)",
          backdropFilter:"blur(28px) saturate(1.8)",
          WebkitBackdropFilter:"blur(28px) saturate(1.8)",
          borderBottom:"1px solid rgba(22,215,197,0.10)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:C.ink, letterSpacing:-0.3 }}>
              Termine mit {otherName || "dieser Person"}
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
              {appointments.length} {appointments.length === 1 ? "Termin" : "Termine"} insgesamt
            </div>
          </div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none",
            fontSize:16, color:C.muted, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent",
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{
          flex:1, overflowY:"auto",
          padding:"16px 20px",
          scrollbarWidth:"none",
        }} className="hui-scroll">

          {loading ? (
            <div style={{
              display:"flex", justifyContent:"center", alignItems:"center",
              padding:"60px 0",
            }}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                border:"3px solid rgba(22,215,197,0.2)",
                borderTopColor:C.teal,
                animation:"hui-spin 0.7s linear infinite",
              }}/>
            </div>
          ) : appointments.length === 0 ? (
            <div style={{
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              padding:"60px 0", gap:14,
            }}>
              <div style={{
                width:56, height:56, borderRadius:"50%",
                background:"linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
              }}>🗓</div>
              <div style={{
                fontSize:14, textAlign:"center", lineHeight:1.7,
                color:"rgba(80,80,80,0.42)", maxWidth:240,
              }}>
                Noch keine Termine mit dieser Person.
                <br/>
                <span style={{ color:"rgba(22,215,197,0.65)", fontWeight:600 }}>
                  Buch ein Talent oder Erlebnis im Profil.
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Aktuelle Termine */}
              {upcoming.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{
                    fontSize:12, fontWeight:600, color:C.muted,
                    textTransform:"uppercase", letterSpacing:0.8,
                    marginBottom:10,
                  }}>Aktuell</div>
                  {upcoming.map(app => (
                    <AppointmentCard key={app.id} app={app} />
                  ))}
                </div>
              )}

              {/* Vergangene Termine (archiviert) */}
              {past.length > 0 && (
                <div>
                  <div style={{
                    fontSize:12, fontWeight:600, color:C.muted,
                    textTransform:"uppercase", letterSpacing:0.8,
                    marginBottom:10,
                  }}>Vergangen</div>
                  {past.map(app => (
                    <AppointmentCard key={app.id} app={app} archived />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function AppointmentCard({ app, archived = false }) {
  const statusLabel = STATUS_LABELS[app.status] || app.status || "";
  const timeStr = app.timeSlot
    ? (typeof app.timeSlot === "string" ? app.timeSlot : (app.timeSlot?.start || app.timeSlot?.label || ""))
    : "";

  return (
    <div style={{
      background: archived ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.90)",
      borderRadius:14, padding:"16px",
      marginBottom:10,
      border: archived ? "1px solid rgba(0,0,0,0.04)" : "1px solid rgba(22,215,197,0.10)",
      opacity: archived ? 0.72 : 1,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:14.5, fontWeight:600, color:C.ink,
            letterSpacing:-0.2, lineHeight:1.3,
          }}>{app.title}</div>
          <div style={{
            fontSize:11, color: app.type === "Talent" ? C.teal : "rgba(255,138,107,0.85)",
            fontWeight:600, marginTop:3, textTransform:"uppercase", letterSpacing:0.5,
          }}>{app.type}</div>
        </div>
        {statusLabel && (
          <div style={{
            fontSize:11, fontWeight:600,
            padding:"4px 10px", borderRadius:8,
            background: archived ? "rgba(0,0,0,0.06)" : "rgba(22,215,197,0.12)",
            color: archived ? C.muted : C.teal,
            flexShrink:0, marginLeft:8,
          }}>{statusLabel}</div>
        )}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 16px", fontSize:12.5, color:C.muted }}>
        <span>📅 {formatDateDE(app.date)}</span>
        {timeStr && <span>🕐 {timeStr}</span>}
        {app.participants > 1 && <span>👥 {app.participants}</span>}
        {app.amount != null && (
          <span style={{ fontWeight:600, color:C.ink }}>
            {parseFloat(app.amount).toFixed(2).replace(".", ",")} {app.currency || "€"}
          </span>
        )}
      </div>
    </div>
  );
}
