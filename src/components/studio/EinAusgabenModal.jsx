// EinAusgabenModal.jsx — "Ein-/Ausgaben Übersicht"
// ══════════════════════════════════════════════════
// Quellen:
//   Ausgaben: payments (als payer_id)  + orders (customer_id) + bookings (customer_id)
//   Einnahmen: payments (als recipient_id) + bookings (wirker_id) + order_items (seller_id)
// Vorbereitet für Quittungs-Download (receipt_url / generiert)
// ══════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";

// ── Design Tokens ──────────────────────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  coral:     "#FF6B6B",
  coralSoft: "rgba(255,107,107,0.10)",
  coralMid:  "rgba(255,107,107,0.22)",
  green:     "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  greenMid:  "rgba(16,185,129,0.22)",
  amber:     "#F59E0B",
  amberSoft: "rgba(245,158,11,0.10)",
  violet:    "#7C3AED",
  violetSoft:"rgba(124,58,237,0.10)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.08)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
  ff: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

// ── Helpers ────────────────────────────────────────────────────────
const fmtEur = (n) => {
  if (n == null || n === "") return "—";
  return `€${Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// Typen-Labels & Icons
const TYPE_META = {
  werk:           { label: "Werk",           icon: "🎨", color: T.violet   },
  dienstleistung: { label: "Dienstleistung", icon: "🤝", color: T.teal     },
  produkt:        { label: "Produkt",        icon: "📦", color: T.amber     },
  booking:        { label: "Buchung",        icon: "📅", color: T.teal     },
  experience:     { label: "Experience",     icon: "✨", color: T.coral     },
  order:          { label: "Bestellung",     icon: "🛒", color: T.amber     },
  other:          { label: "Sonstiges",      icon: "💳", color: T.inkSoft  },
};

function getTypeMeta(type) {
  const key = (type || "").toLowerCase();
  return TYPE_META[key] || TYPE_META[
    key.includes("werk") ? "werk" :
    key.includes("book") ? "booking" :
    key.includes("prod") ? "produkt" :
    key.includes("exp")  ? "experience" :
    "other"
  ];
}

// Status-Badge
const STATUS_META = {
  completed:  { label: "Abgeschlossen", color: T.green,  bg: T.greenSoft  },
  released:   { label: "Abgeschlossen", color: T.green,  bg: T.greenSoft  },
  paid:       { label: "Bezahlt",       color: T.green,  bg: T.greenSoft  },
  confirmed:  { label: "Bestätigt",     color: T.teal,   bg: T.tealSoft   },
  pending:    { label: "Ausstehend",    color: T.amber,  bg: T.amberSoft  },
  cancelled:  { label: "Storniert",     color: T.coral,  bg: T.coralSoft  },
  refunded:   { label: "Erstattet",     color: T.coral,  bg: T.coralSoft  },
};
function getStatus(s) {
  return STATUS_META[(s||"").toLowerCase()] || { label: s || "—", color: T.inkSoft, bg: T.border };
}

// ── Haupt-Komponente ───────────────────────────────────────────────
export default function EinAusgabenModal({ profile, onClose }) {
  const [tab,      setTab]      = useState("ausgaben"); // "ausgaben" | "einnahmen"
  const [filter,   setFilter]   = useState("all");      // "all" | typ-key
  const [ausgaben, setAusgaben] = useState([]);
  const [einnahmen,setEinnahmen]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);       // expanded row id

  // ── Daten laden ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const uid = profile.id;
    try {
      // ── AUSGABEN ────────────────────────────────────────────────
      const ausgabenList = [];

      // 1. payments als Käufer (payer_id)
      const { data: pOut } = await supabase
        .from("payments")
        .select("id,created_at,paid_at,item_name,item_type,amount_eur,impact_eur,status,payment_status,state,wirker_name,wirker_id,stripe_session_id")
        .eq("payer_id", uid)
        .order("created_at", { ascending: false });
      (pOut || []).forEach(p => {
        ausgabenList.push({
          id:       `pay-out-${p.id}`,
          rawId:    p.id,
          source:   "payment",
          date:     p.paid_at || p.created_at,
          title:    p.item_name || "Zahlung",
          type:     p.item_type || "other",
          betrag:   p.amount_eur,
          impact:   p.impact_eur,
          status:   p.state || p.payment_status || p.status,
          von:      null,
          an:       p.wirker_name || "—",
          anId:     p.wirker_id,
          stripeId: p.stripe_session_id,
          raw:      p,
        });
      });

      // 2. bookings als Käufer (customer_id)
      const { data: bOut } = await supabase
        .from("bookings")
        .select("id,created_at,scheduled_at,completed_at,service_title,work_title,total_eur,subtotal_eur,state,status,wirker_name,wirker_id,payment_id")
        .eq("customer_id", uid)
        .order("created_at", { ascending: false });
      (bOut || []).forEach(b => {
        ausgabenList.push({
          id:    `book-out-${b.id}`,
          rawId: b.id,
          source:"booking",
          date:  b.completed_at || b.scheduled_at || b.created_at,
          title: b.service_title || b.work_title || "Buchung",
          type:  "booking",
          betrag: b.total_eur || b.subtotal_eur,
          impact: null,
          status: b.state || b.status,
          von:   null,
          an:    b.wirker_name || "—",
          anId:  b.wirker_id,
          stripeId: null,
          raw:   b,
        });
      });

      // 3. orders als Kunde (customer_id) inkl. order_items
      const { data: oOut } = await supabase
        .from("orders")
        .select("id,created_at,state,total_eur,commission_eur,impact_eur,tracking_number,shipped_at")
        .eq("customer_id", uid)
        .order("created_at", { ascending: false });
      (oOut || []).forEach(o => {
        ausgabenList.push({
          id:    `ord-out-${o.id}`,
          rawId: o.id,
          source:"order",
          date:  o.shipped_at || o.created_at,
          title: `Bestellung`,
          type:  "order",
          betrag: o.total_eur,
          impact: o.impact_eur,
          status: o.state,
          von:   null,
          an:    "—",
          anId:  null,
          tracking: o.tracking_number,
          stripeId: null,
          raw:   o,
        });
      });

      // Sortieren nach Datum desc
      ausgabenList.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
      setAusgaben(ausgabenList);

      // ── EINNAHMEN ───────────────────────────────────────────────
      const einnahmenList = [];

      // 1. payments als Empfänger (recipient_id)
      const { data: pIn } = await supabase
        .from("payments")
        .select("id,created_at,paid_at,released_at,item_name,item_type,payout_eur,amount_eur,commission_eur,impact_eur,status,payment_status,state,stripe_session_id,booking_id")
        .eq("recipient_id", uid)
        .order("created_at", { ascending: false });
      (pIn || []).forEach(p => {
        einnahmenList.push({
          id:       `pay-in-${p.id}`,
          rawId:    p.id,
          source:   "payment",
          date:     p.released_at || p.paid_at || p.created_at,
          title:    p.item_name || "Einnahme",
          type:     p.item_type || "other",
          betrag:   p.payout_eur ?? p.amount_eur,
          brutto:   p.amount_eur,
          provision:p.commission_eur,
          impact:   p.impact_eur,
          status:   p.state || p.payment_status || p.status,
          von:      "—",    // payer_name nicht direkt verfügbar → ID reicht
          vonId:    null,
          stripeId: p.stripe_session_id,
          bookingId:p.booking_id,
          raw:      p,
        });
      });

      // 2. bookings als Anbieter (wirker_id)
      const { data: bIn } = await supabase
        .from("bookings")
        .select("id,created_at,scheduled_at,completed_at,service_title,work_title,total_eur,subtotal_eur,commission_rate,state,status,payment_id,client_name,customer_id")
        .eq("wirker_id", uid)
        .order("created_at", { ascending: false });
      (bIn || []).forEach(b => {
        const brutto   = b.total_eur || b.subtotal_eur || 0;
        const commRate = b.commission_rate || 0;
        const provision= Math.round(brutto * commRate * 100) / 100;
        const netto    = Math.round((brutto - provision) * 100) / 100;
        einnahmenList.push({
          id:       `book-in-${b.id}`,
          rawId:    b.id,
          source:   "booking",
          date:     b.completed_at || b.scheduled_at || b.created_at,
          title:    b.service_title || b.work_title || "Buchungseinnahme",
          type:     "booking",
          betrag:   netto > 0 ? netto : brutto,
          brutto:   brutto,
          provision:provision,
          impact:   null,
          status:   b.state || b.status,
          von:      b.client_name || "—",
          vonId:    b.customer_id,
          stripeId: null,
          bookingId:b.id,
          raw:      b,
        });
      });

      // 3. order_items als Verkäufer (seller_id)
      const { data: oiIn } = await supabase
        .from("order_items")
        .select("id,order_id,work_id,quantity,unit_price_eur")
        .eq("seller_id", uid);
      // Werk-Namen nachladen wenn nötig (Batch)
      const workIds = [...new Set((oiIn||[]).map(i=>i.work_id).filter(Boolean))];
      let workMap = {};
      if (workIds.length > 0) {
        const { data: works } = await supabase
          .from("works")
          .select("id,title")
          .in("id", workIds);
        (works||[]).forEach(w => { workMap[w.id] = w.title; });
      }
      (oiIn || []).forEach(oi => {
        einnahmenList.push({
          id:       `oi-in-${oi.id}`,
          rawId:    oi.id,
          source:   "order_item",
          date:     null,  // über order_id nachladen nicht nötig für jetzt
          title:    workMap[oi.work_id] || "Werkverkauf",
          type:     "werk",
          betrag:   (oi.unit_price_eur || 0) * (oi.quantity || 1),
          brutto:   (oi.unit_price_eur || 0) * (oi.quantity || 1),
          provision:null,
          impact:   null,
          status:   "completed",
          von:      "—",
          vonId:    null,
          qty:      oi.quantity,
          raw:      oi,
        });
      });

      einnahmenList.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
      setEinnahmen(einnahmenList);

    } catch(e) {
      console.warn("[EinAusgaben] load:", e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Berechnungen ─────────────────────────────────────────────────
  const totalAusgaben  = ausgaben.reduce((s,r)  => s + (r.betrag || 0), 0);
  const totalEinnahmen = einnahmen.reduce((s,r) => s + (r.betrag || 0), 0);
  const saldo          = totalEinnahmen - totalAusgaben;

  // Filter-Typen aus vorhandenen Daten ableiten
  const currentList   = tab === "ausgaben" ? ausgaben : einnahmen;
  const availableTypes= [...new Set(currentList.map(r => r.type).filter(Boolean))];
  const filteredList  = filter === "all" ? currentList
    : currentList.filter(r => r.type === filter);

  // ── Modal ─────────────────────────────────────────────────────────
  const modal = (
    <div
      style={{ position:"fixed", inset:0, zIndex:9999,
        background:"rgba(26,26,24,0.52)", display:"flex", alignItems:"flex-end" }}
      onClick={e => { if (e.target===e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width:"100%", maxWidth:480, margin:"0 auto",
        background:T.bg, borderRadius:"24px 24px 0 0",
        maxHeight:"94vh", overflow:"hidden",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -4px 32px rgba(26,26,24,0.18)",
        fontFamily: T.ff,
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
              💶 Ein-/Ausgaben
            </div>
            <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>
              Seit der Registrierung · alle Transaktionen
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
            borderRadius:"50%", width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.inkSoft,
          }}>✕</button>
        </div>

        {/* ── Zusammenfassung ── */}
        <div style={{ padding:"0 20px 16px", display:"flex", gap:10 }}>
          {/* Einnahmen */}
          <div style={{
            flex:1, background:T.greenSoft, borderRadius:T.r12,
            border:`1px solid ${T.greenMid}`, padding:"12px 14px",
          }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.green, letterSpacing:"0.04em", marginBottom:4 }}>
              ↑ EINNAHMEN
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:T.green }}>
              {fmtEur(totalEinnahmen)}
            </div>
            <div style={{ fontSize:11, color:T.inkSoft, marginTop:2 }}>
              {einnahmen.length} Transakt.
            </div>
          </div>

          {/* Ausgaben */}
          <div style={{
            flex:1, background:T.coralSoft, borderRadius:T.r12,
            border:`1px solid ${T.coralMid}`, padding:"12px 14px",
          }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.coral, letterSpacing:"0.04em", marginBottom:4 }}>
              ↓ AUSGABEN
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:T.coral }}>
              {fmtEur(totalAusgaben)}
            </div>
            <div style={{ fontSize:11, color:T.inkSoft, marginTop:2 }}>
              {ausgaben.length} Transakt.
            </div>
          </div>

          {/* Saldo */}
          <div style={{
            flex:1,
            background: saldo >= 0 ? T.tealSoft : T.coralSoft,
            borderRadius:T.r12,
            border:`1px solid ${saldo >= 0 ? T.tealMid : T.coralMid}`,
            padding:"12px 14px",
          }}>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:"0.04em", marginBottom:4,
              color: saldo >= 0 ? T.teal : T.coral,
            }}>
              ⚖ SALDO
            </div>
            <div style={{ fontSize:18, fontWeight:800, color: saldo >= 0 ? T.teal : T.coral }}>
              {saldo >= 0 ? "+" : ""}{fmtEur(saldo)}
            </div>
            <div style={{ fontSize:11, color:T.inkSoft, marginTop:2 }}>
              Netto gesamt
            </div>
          </div>
        </div>

        {/* ── Tab-Bar ── */}
        <div style={{
          display:"flex", gap:0, margin:"0 20px 12px",
          background:"rgba(26,26,24,0.06)", borderRadius:T.r12, padding:3,
        }}>
          {[
            { key:"einnahmen", label:"↑ Einnahmen",  color:T.green },
            { key:"ausgaben",  label:"↓ Ausgaben",   color:T.coral },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setFilter("all"); setExpanded(null); }} style={{
              flex:1, padding:"8px 0", borderRadius:T.r12-2,
              border:"none", cursor:"pointer", fontFamily:T.ff,
              fontSize:13, fontWeight:700,
              background: tab===t.key ? T.bgCard : "transparent",
              color: tab===t.key ? t.color : T.inkSoft,
              boxShadow: tab===t.key ? "0 1px 4px rgba(26,26,24,0.10)" : "none",
              transition:"all .15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Typ-Filter (Chips) ── */}
        {availableTypes.length > 1 && (
          <div style={{
            display:"flex", gap:6, padding:"0 20px 12px",
            overflowX:"auto", scrollbarWidth:"none",
          }}>
            <FilterChip label="Alle" active={filter==="all"} onClick={() => setFilter("all")} />
            {availableTypes.map(type => {
              const m = getTypeMeta(type);
              return (
                <FilterChip key={type} label={`${m.icon} ${m.label}`}
                  active={filter===type} onClick={() => setFilter(type)} />
              );
            })}
          </div>
        )}

        {/* ── Scroll-Content (Tabelle) ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 20px 100px",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>

          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0", color:T.inkSoft, fontSize:14 }}>
              Wird geladen…
            </div>
          )}

          {!loading && filteredList.length === 0 && (
            <EmptyState
              icon={tab === "einnahmen" ? "💰" : "💸"}
              title={tab === "einnahmen" ? "Noch keine Einnahmen" : "Noch keine Ausgaben"}
              desc={tab === "einnahmen"
                ? "Sobald du etwas verkaufst oder eine Buchung abgeschlossen wird, erscheint es hier."
                : "Käufe, Buchungen und Bestellungen erscheinen hier."}
            />
          )}

          {!loading && filteredList.map((item, idx) => (
            <TransactionRow
              key={item.id}
              item={item}
              isIncome={tab === "einnahmen"}
              isExpanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            />
          ))}

        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Filter-Chip ───────────────────────────────────────────────────
function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flexShrink:0, padding:"5px 12px", borderRadius:T.r99,
      border: active ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
      background: active ? T.tealSoft : T.bgCard,
      color: active ? T.teal : T.inkSoft,
      fontSize:12, fontWeight:600, cursor:"pointer",
      fontFamily:T.ff, whiteSpace:"nowrap",
      WebkitTapHighlightColor:"transparent",
      transition:"all .12s",
    }}>
      {label}
    </button>
  );
}

// ── Transaction Row ───────────────────────────────────────────────
function TransactionRow({ item, isIncome, isExpanded, onToggle }) {
  const typeMeta  = getTypeMeta(item.type);
  const statusMeta= getStatus(item.status);

  // Quittungs-Download (Stripe Session Link als Fallback)
  const receiptUrl = item.stripeId
    ? `https://dashboard.stripe.com/payments/${item.stripeId}`
    : null;

  return (
    <div style={{
      background:T.bgCard, borderRadius:T.r16,
      border:`1px solid ${T.border}`, marginBottom:8,
      boxShadow:T.card, overflow:"hidden",
    }}>
      {/* ── Haupt-Zeile ── */}
      <button
        onClick={onToggle}
        style={{
          display:"flex", alignItems:"center", gap:12,
          width:"100%", padding:"13px 14px",
          background:"none", border:"none", cursor:"pointer",
          textAlign:"left", fontFamily:T.ff,
          WebkitTapHighlightColor:"transparent",
        }}
      >
        {/* Typ-Icon */}
        <span style={{
          width:40, height:40, borderRadius:"50%", flexShrink:0,
          background:`${typeMeta.color}18`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, border:`1px solid ${typeMeta.color}30`,
        }}>
          {typeMeta.icon}
        </span>

        {/* Titel + Datum */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:14, fontWeight:700, color:T.ink,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            {item.title}
          </div>
          <div style={{ fontSize:11, color:T.inkSoft, marginTop:2, display:"flex", gap:6, alignItems:"center" }}>
            <span>{fmtDate(item.date)}</span>
            <span style={{
              fontSize:10, fontWeight:700,
              color:typeMeta.color,
              background:`${typeMeta.color}12`,
              borderRadius:T.r99, padding:"1px 7px",
            }}>
              {typeMeta.label}
            </span>
          </div>
        </div>

        {/* Betrag + Status */}
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{
            fontSize:15, fontWeight:800,
            color: isIncome ? T.green : T.coral,
          }}>
            {isIncome ? "+" : "−"}{fmtEur(item.betrag)}
          </div>
          <div style={{
            fontSize:10, fontWeight:700,
            color:statusMeta.color, background:statusMeta.bg,
            borderRadius:T.r99, padding:"2px 7px", marginTop:3,
          }}>
            {statusMeta.label}
          </div>
        </div>

        {/* Chevron */}
        <span style={{
          fontSize:14, color:T.inkFaint, flexShrink:0,
          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
          transition:"transform .18s",
        }}>›</span>
      </button>

      {/* ── Detail-Bereich ── */}
      {isExpanded && (
        <div style={{
          borderTop:`1px solid ${T.border}`,
          padding:"12px 14px 14px",
          background:"rgba(26,26,24,0.015)",
        }}>
          {/* Detail-Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 14px", marginBottom:12 }}>

            {/* Gegenseite (Von / An) */}
            {isIncome && item.von !== undefined && (
              <DetailCell label="Von" value={item.von || "—"} />
            )}
            {!isIncome && item.an !== undefined && (
              <DetailCell label="An" value={item.an || "—"} />
            )}

            {/* Brutto (nur bei Einnahmen) */}
            {isIncome && item.brutto != null && item.brutto !== item.betrag && (
              <DetailCell label="Brutto" value={fmtEur(item.brutto)} />
            )}

            {/* Provision */}
            {isIncome && item.provision != null && (
              <DetailCell label="HUI-Provision" value={`−${fmtEur(item.provision)}`} accent={T.coral} />
            )}

            {/* Impact-Anteil */}
            {item.impact != null && item.impact > 0 && (
              <DetailCell label="Impact-Anteil" value={fmtEur(item.impact)} accent={T.teal} />
            )}

            {/* Menge (order_items) */}
            {item.qty != null && (
              <DetailCell label="Menge" value={`${item.qty}×`} />
            )}

            {/* Tracking (orders) */}
            {item.tracking && (
              <DetailCell label="Tracking" value={item.tracking} />
            )}

            {/* Datum exakt */}
            <DetailCell label="Datum" value={fmtDate(item.date)} />

            {/* Quelle */}
            <DetailCell label="Typ" value={getTypeMeta(item.type).label} />

          </div>

          {/* Quittung / Download */}
          <div style={{ display:"flex", gap:8 }}>
            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"10px 14px", borderRadius:T.r12,
                  background:T.tealSoft, border:`1px solid ${T.tealMid}`,
                  fontSize:13, fontWeight:700, color:T.teal,
                  textDecoration:"none", fontFamily:T.ff,
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                🧾 Quittung ansehen
              </a>
            )}
            {!receiptUrl && (
              <div style={{
                flex:1, padding:"10px 14px", borderRadius:T.r12,
                background:"rgba(26,26,24,0.04)", border:`1px solid ${T.border}`,
                fontSize:12, color:T.inkFaint, textAlign:"center",
              }}>
                🧾 Quittung wird vorbereitet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail-Cell ────────────────────────────────────────────────────
function DetailCell({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:600, color:T.inkFaint, letterSpacing:"0.04em", marginBottom:2 }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontSize:13, fontWeight:600,
        color: accent || T.ink,
        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
      }}>
        {value}
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────
function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.55 }}>{desc}</div>
    </div>
  );
}
