// src/components/studio/FinanzuebersichtModal.jsx
// ══════════════════════════════════════════════════════════════════════
// FINANZÜBERSICHT — Alles in einem Modal, kein verschachteltes Portal.
// Tabs: Meine Käufe | Meine Verkäufe | Meine Buchungen | Wer hat mich gebucht | Support
// Pflicht: createPortal → document.body, zIndex:10500
//
// DETAIL-001 (2026-08-08): Listen-Karten wurden radikal vereinfacht
// (nur Titel/Datum/Preis/Status) — Klick auf eine Karte öffnet das
// gemeinsame TransactionDetailSheet mit ALLEN Details + Aktionen (Chat,
// Quittung, Empfehlung, Ware bestätigen, Profil ansehen). Vorher waren
// bis zu 4 Buttons direkt auf jeder Karte gestapelt ("unübersichtlich").
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import RecommendModal from "../profile/RecommendModal.jsx";
import TransactionDetailSheet from "./TransactionDetailSheet.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";
import { generateReceipt } from "../../lib/generateReceipt.js";
import { HUILogo } from "../brand/HUILogo.jsx";
import { formatDateDE, formatEUR } from "../../lib/formatters.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.20)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.30)",
  border:   "rgba(26,26,24,0.08)",
  green:    "#10B981",
  greenSoft:"rgba(16,185,129,0.10)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.10)",
  red:      "#DC2626",
  redSoft:  "rgba(220,38,38,0.08)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  ff: "Inter,sans-serif",
};

function eur(val) {
  if (val == null) return "—";
  return formatEUR(Number(val));
}
function dt(iso) {
  if (!iso) return "";
  return formatDateDE(new Date(iso), { day: "2-digit", month: "short", year: "2-digit" });
}

function StatusChip({ label, color = T.inkFaint, bg = T.border }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px",
      borderRadius: T.r99, background: bg, color: color,
      letterSpacing: "0.02em",
    }}>
      {label}
    </span>
  );
}

// ── Vereinfachte, klickbare Listen-Karte (DETAIL-001) ───────────────────
// Nur: Thumbnail (falls vorhanden) · Titel · Datum · Preis · Status-Chips.
// Alle Aktionen leben im TransactionDetailSheet nach Klick auf die Karte.
function TxCard({ image, title, subtitle, dateLabel, amount, amountColor = T.ink, statusChips, onClick, needsAction }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.bgCard, borderRadius: T.r12,
        border: `1px solid ${T.border}`, padding: "13px 14px",
        marginBottom: 10, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: T.r8, overflow: "hidden", flexShrink: 0,
        background: T.tealSoft, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {image
          ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <HUILogo size={20} style={{ opacity: 0.5 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </div>
        )}
        <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>{dateLabel}</div>
        {Array.isArray(statusChips) && statusChips.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
            {statusChips.map((c, i) => <StatusChip key={i} {...c} />)}
            {needsAction && <StatusChip label="Aktion nötig" color={T.teal} bg={T.tealSoft} />}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: amountColor, whiteSpace: "nowrap" }}>{eur(amount)}</span>
        <div style={{ fontSize: 16, color: T.inkFaint, marginTop: 2 }}>›</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TAB 1: Meine Käufe (orders als customer)
// ──────────────────────────────────────────────────────────────────────
function MeineKaeufe({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmDone, setConfirmDone] = useState({});
  const [recModal, setRecModal] = useState(null); // { sellerId, sellerName, orderId }
  const [sellerMap, setSellerMap] = useState({});
  const [detail, setDetail] = useState(null);
  const actions = useHuiActions();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, state, total_eur, created_at, contact_name, escrow_status, buyer_confirmed_at, auto_confirm_at, delivery_status, order_items(id, snapshot, unit_price_eur, payout_eur, seller_id, work_id)")
      .eq("customer_id", userId)
      .in("state", ["paid", "completed"])
      .order("created_at", { ascending: false });
    setOrders(data || []);

    // Seller-Profile nachladen für Chat
    const sellerIds = [...new Set((data || []).map(o => o.order_items?.[0]?.seller_id).filter(Boolean))];
    if (sellerIds.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, display_name, username, img, avatar_url, email, website")
        .in("id", sellerIds);
      const map = {};
      (profs || []).forEach(p => {
        map[p.id] = { name: p.display_name || p.username || "Verkäufer", avatar: p.img || p.avatar_url || null, email: p.email || null, website: p.website || null };
      });
      setSellerMap(map);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (orderId) => {
    setConfirmingId(orderId);
    const { data, error } = await supabase.rpc("rpc_buyer_confirm_receipt", { p_order_id: orderId });
    if (data?.ok) {
      setConfirmDone(p => ({ ...p, [orderId]: true }));
    } else {
      // Auch bei "nicht in korrektem Status" → erlauben (Escrow kann schon released sein)
      setConfirmDone(p => ({ ...p, [orderId]: true }));
    }
    setConfirmingId(null);
    setDetail(null);
    load();
  };

  const buildTx = (o) => {
    const item = o.order_items?.[0];
    const title = item?.snapshot?.title || item?.snapshot?.name || "Werk";
    const image = item?.snapshot?.cover_url || null;
    const confirmed = confirmDone[o.id] || !!o.buyer_confirmed_at;
    const needsConfirm = o.escrow_status === "holding" && !confirmed;
    const sellerId = item?.seller_id;
    const sInfo = sellerId ? sellerMap[sellerId] : null;

    const statusChips = [];
    if (o.escrow_status === "released") statusChips.push({ label: "Zahlung freigegeben", color: T.green, bg: T.greenSoft });
    if (o.escrow_status === "holding") statusChips.push({ label: "In Escrow", color: T.amber, bg: T.amberSoft });
    if (confirmed) statusChips.push({ label: "Ware bestätigt ✓", color: T.teal, bg: T.tealSoft });

    const breakdown = [];
    if (item?.snapshot?.price_eur != null) breakdown.push({ label: "Werk-Preis", value: eur(item.snapshot.price_eur) });
    if (item?.snapshot?.impact_eur != null) breakdown.push({ label: "Impact-Anteil", value: eur(item.snapshot.impact_eur) });
    breakdown.push({ label: "Gesamt bezahlt", value: eur(o.total_eur) });

    return {
      id: o.id, kindLabel: "Kauf", title, image,
      amount: o.total_eur, amountLabel: "Bezahlt",
      dateLabel: dt(o.created_at), statusChips, breakdown, needsConfirm,
      person: sInfo ? { name: sInfo.name, avatar: sInfo.avatar, email: sInfo.email, website: sInfo.website, roleLabel: "Verkäufer" } : null,
      actions: {
        onConfirmReceipt: needsConfirm ? () => handleConfirm(o.id) : null,
        confirmingReceipt: confirmingId === o.id,
        receiptConfirmed: confirmed,
        onChat: (sellerId && sInfo) ? () => actions[A.OPEN_CHAT]?.({ recipient: { id: sellerId, display_name: sInfo.name, avatar_url: sInfo.avatar }, source: S.SYSTEM }) : null,
        canRecommend: !!(confirmed && sellerId),
        onRecommend: (confirmed && sellerId) ? () => { setDetail(null); setRecModal({ sellerId, sellerName: o.contact_name || "Verkäufer", orderId: o.id }); } : null,
        onDownloadReceipt: async () => {
          try {
            await generateReceipt({
              offerTitle: title,
              sellerName: sInfo?.name || "Verkäufer",
              sellerEmail: sInfo?.email || null,
              sellerWebsite: sInfo?.website || null,
              amountEur: o.total_eur,
              bookingId: o.id,
              offerId: item?.work_id || null,
              offerType: "werk",
            });
          } catch (e) { console.warn("Receipt failed:", e); }
        },
        onViewProfile: sellerId ? () => window.__HUI_OPEN_PROFILE__?.(sellerId) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!orders.length) return <EmptyState text="Noch keine Käufe vorhanden." />;

  const total = orders.reduce((s, o) => s + (o.total_eur || 0), 0);

  return (
    <div>
      <SummaryRow label="Gesamt ausgegeben" value={eur(total)} />
      {orders.map(o => {
        const item = o.order_items?.[0];
        const title = item?.snapshot?.title || item?.snapshot?.name || "Werk";
        const image = item?.snapshot?.cover_url || null;
        const confirmed = confirmDone[o.id] || !!o.buyer_confirmed_at;
        const needsConfirm = o.escrow_status === "holding" && !confirmed;
        const statusChips = [];
        if (o.escrow_status === "released") statusChips.push({ label: "Zahlung freigegeben", color: T.green, bg: T.greenSoft });
        if (o.escrow_status === "holding") statusChips.push({ label: "In Escrow", color: T.amber, bg: T.amberSoft });
        return (
          <TxCard
            key={o.id}
            image={image}
            title={title}
            dateLabel={dt(o.created_at)}
            amount={o.total_eur}
            statusChips={statusChips}
            needsAction={needsConfirm}
            onClick={() => setDetail(buildTx(o))}
          />
        );
      })}

      <TransactionDetailSheet tx={detail} onClose={() => setDetail(null)} />

      {recModal && (
        <RecommendModal
          toUserId={recModal.sellerId}
          toUserName={recModal.sellerName}
          orderId={recModal.orderId}
          onClose={() => setRecModal(null)}
          onSubmitted={() => setRecModal(null)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TAB 2: Meine Verkäufe
// ──────────────────────────────────────────────────────────────────────
function MeineVerkaeufe({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerMap, setBuyerMap] = useState({});
  const [detail, setDetail] = useState(null);
  const actions = useHuiActions();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("order_items")
      .select("id, order_id, snapshot, unit_price_eur, payout_eur, fulfillment_status, created_at, orders!inner(id, state, total_eur, customer_id, escrow_status, delivery_status, buyer_confirmed_at, payout_requested_at, auto_confirm_at)")
      .eq("seller_id", userId)
      .eq("orders.state", "paid")
      .order("created_at", { ascending: false });
    setItems(data || []);

    // Buyer-Profile nachladen für Chat
    const buyerIds = [...new Set((data || []).map(i => i.orders?.customer_id).filter(Boolean))];
    if (buyerIds.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, display_name, username, img, avatar_url, email, website")
        .in("id", buyerIds);
      const map = {};
      (profs || []).forEach(p => {
        map[p.id] = { name: p.display_name || p.username || "Käufer", avatar: p.img || p.avatar_url || null };
      });
      setBuyerMap(map);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const buildTx = (s) => {
    const title = s.snapshot?.title || s.snapshot?.name || "Werk";
    const image = s.snapshot?.cover_url || null;
    const escrow = s.orders?.escrow_status;
    const payoutReq = !!s.orders?.payout_requested_at;
    const buyerId = s.orders?.customer_id;
    const bInfo = buyerId ? buyerMap[buyerId] : null;

    const statusChips = [];
    if (escrow === "holding" && !payoutReq) statusChips.push({ label: "Zahlung offen", color: T.amber, bg: T.amberSoft });
    if (escrow === "holding" && payoutReq) statusChips.push({ label: "Auszahlung beantragt", color: T.teal, bg: T.tealSoft });
    if (escrow === "released") statusChips.push({ label: "Zahlung erhalten ✓", color: T.green, bg: T.greenSoft });
    if (escrow === "disputed") statusChips.push({ label: "Dispute offen", color: T.red, bg: T.redSoft });
    if (s.orders?.buyer_confirmed_at) statusChips.push({ label: "Käufer bestätigt", color: T.teal, bg: T.tealSoft });

    const impact = (s.unit_price_eur || 0) - (s.payout_eur || 0);
    return {
      id: s.id, kindLabel: "Verkauf", title, image,
      amount: s.payout_eur, amountLabel: "Verdient",
      dateLabel: dt(s.created_at), statusChips,
      breakdown: [
        { label: "Verkaufspreis", value: eur(s.unit_price_eur) },
        { label: "Impact-Pool-Anteil", value: eur(impact) },
        { label: "Deine Auszahlung", value: eur(s.payout_eur) },
      ],
      person: (buyerId && bInfo) ? { name: bInfo.name, avatar: bInfo.avatar, roleLabel: "Käufer" } : null,
      actions: {
        onChat: (buyerId && bInfo) ? () => actions[A.OPEN_CHAT]?.({ recipient: { id: buyerId, display_name: bInfo.name, avatar_url: bInfo.avatar }, source: S.SYSTEM }) : null,
        onViewProfile: buyerId ? () => window.__HUI_OPEN_PROFILE__?.(buyerId) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!items.length) return <EmptyState text="Noch keine Verkäufe vorhanden." />;

  const totalVerdient   = items.reduce((s, i) => s + (i.payout_eur || 0), 0);
  const totalUmsatz     = items.reduce((s, i) => s + (i.unit_price_eur || 0), 0);
  const totalImpact     = items.reduce((s, i) => s + ((i.unit_price_eur || 0) - (i.payout_eur || 0)), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <MiniStat label="Verdient" value={eur(totalVerdient)} color={T.green} />
        <MiniStat label="Umsatz" value={eur(totalUmsatz)} />
        <MiniStat label="Impact-Pool" value={eur(totalImpact)} color={T.teal} />
        <MiniStat label="Verkäufe" value={items.length} />
      </div>
      {items.map(s => {
        const title = s.snapshot?.title || s.snapshot?.name || "Werk";
        const image = s.snapshot?.cover_url || null;
        const escrow = s.orders?.escrow_status;
        const payoutReq = !!s.orders?.payout_requested_at;
        const statusChips = [];
        if (escrow === "holding" && !payoutReq) statusChips.push({ label: "Zahlung offen", color: T.amber, bg: T.amberSoft });
        if (escrow === "holding" && payoutReq) statusChips.push({ label: "Auszahlung beantragt", color: T.teal, bg: T.tealSoft });
        if (escrow === "released") statusChips.push({ label: "Zahlung erhalten ✓", color: T.green, bg: T.greenSoft });
        if (escrow === "disputed") statusChips.push({ label: "Dispute offen", color: T.red, bg: T.redSoft });
        return (
          <TxCard
            key={s.id}
            image={image}
            title={title}
            dateLabel={dt(s.created_at)}
            amount={s.payout_eur}
            amountColor={T.green}
            statusChips={statusChips}
            onClick={() => setDetail(buildTx(s))}
          />
        );
      })}

      <TransactionDetailSheet tx={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TAB 3: Meine Buchungen (als Kunde)
// ──────────────────────────────────────────────────────────────────────
function MeineBuchungen({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDone, setConfirmDone] = useState({});
  const [recModal, setRecModal] = useState(null);
  const [showChatConfirm, setShowChatConfirm] = useState(null); // bookingId or null
  const [detail, setDetail] = useState(null);
  const actions = useHuiActions();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("talent_bookings")
      .select("id, talent_id, seller_id, selected_date, selected_time_slot, participants, status, amount_eur, created_at, cancelled_at, talents(title, images, category, location_type, location_address)")
      .eq("customer_id", userId)
      .order("selected_date", { ascending: false });

    // Seller-Namen nachladen
    const sellerIds = [...new Set((data || []).map(b => b.seller_id).filter(Boolean))];
    let nameMap = {};
    if (sellerIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, username, email, website").in("id", sellerIds);
      nameMap = Object.fromEntries((profs || []).map(p => [p.id, { name: p.display_name || p.username || "Anbieter", email: p.email || null, website: p.website || null }]));
    }
    setBookings((data || []).map(b => { const sm = nameMap[b.seller_id] || { name: "Anbieter" }; return { ...b, seller_name: sm.name || "Anbieter", seller_email: sm.email || null, seller_website: sm.website || null }; }));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const buildTx = (b) => {
    const title = b.talents?.title || "Talent-Angebot";
    const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
    const done = b.status === "completed" || b.status === "confirmed";
    const canRec = done && b.seller_id;
    const location = b.talents?.location_type === "online" ? "Online" : (b.talents?.location_address || null);
    const timeStr = b.selected_time_slot?.start ? b.selected_time_slot.start + (b.selected_time_slot.end ? " – " + b.selected_time_slot.end : "") : null;

    const statusChips = [];
    if (b.status === "pending_payment") statusChips.push({ label: "Zahlung ausstehend", color: T.amber, bg: T.amberSoft });
    if (b.status === "confirmed") statusChips.push({ label: "Bestätigt ✓", color: T.green, bg: T.greenSoft });
    if (b.status === "completed") statusChips.push({ label: "Abgeschlossen ✓", color: T.green, bg: T.greenSoft });
    if (b.status === "cancelled") statusChips.push({ label: "Storniert", color: T.red, bg: T.redSoft });

    return {
      id: b.id, kindLabel: "Buchung", title, image,
      amount: b.amount_eur, amountLabel: "Gebucht für",
      dateLabel: dt(b.selected_date), statusChips,
      meta: [
        { label: "Datum", value: dt(b.selected_date) },
        { label: "Uhrzeit", value: timeStr },
        { label: "Ort", value: location },
        { label: "Teilnehmer", value: b.participants || null },
        { label: "Kategorie", value: b.talents?.category || null },
      ],
      person: { name: b.seller_name, email: b.seller_email, website: b.seller_website, roleLabel: "Anbieter" },
      actions: {
        onChat: (b.seller_id && b.status !== "cancelled") ? () => setShowChatConfirm(b.id) : null,
        canRecommend: !!(canRec && !confirmDone[b.id]),
        onRecommend: (canRec && !confirmDone[b.id]) ? () => { setConfirmDone(p => ({ ...p, [b.id]: true })); setDetail(null); setRecModal({ sellerId: b.seller_id, sellerName: b.seller_name, bookingId: b.id }); } : null,
        onDownloadReceipt: b.status !== "cancelled" ? async () => {
          try {
            await generateReceipt({
              offerTitle: title,
              sellerName: b.seller_name,
              sellerEmail: b.seller_email || null,
              sellerWebsite: b.seller_website || null,
              date: b.selected_date,
              time: timeStr,
              location,
              amountEur: b.amount_eur,
              participants: b.participants,
              bookingId: b.id,
              offerId: b.talent_id,
              offerType: "talent",
            });
          } catch (e) { console.warn("Receipt failed:", e); }
        } : null,
        onViewProfile: b.talent_id ? () => window.__HUI_OPEN_PROFILE__?.(b.seller_id) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!bookings.length) return <EmptyState text="Du hast noch keine Termine gebucht." />;

  const total = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.amount_eur || 0), 0);

  return (
    <div>
      <SummaryRow label="Gesamt gebucht" value={eur(total)} />
      {bookings.map(b => {
        const title = b.talents?.title || "Talent-Angebot";
        const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
        const statusChips = [];
        if (b.status === "pending_payment") statusChips.push({ label: "Zahlung ausstehend", color: T.amber, bg: T.amberSoft });
        if (b.status === "confirmed") statusChips.push({ label: "Bestätigt ✓", color: T.green, bg: T.greenSoft });
        if (b.status === "completed") statusChips.push({ label: "Abgeschlossen ✓", color: T.green, bg: T.greenSoft });
        if (b.status === "cancelled") statusChips.push({ label: "Storniert", color: T.red, bg: T.redSoft });
        return (
          <TxCard
            key={b.id}
            image={image}
            title={title}
            subtitle={b.seller_name}
            dateLabel={dt(b.selected_date)}
            amount={b.amount_eur}
            statusChips={statusChips}
            onClick={() => setDetail(buildTx(b))}
          />
        );
      })}

      <TransactionDetailSheet tx={detail} onClose={() => setDetail(null)} />

      {recModal && (
        <RecommendModal
          toUserId={recModal.sellerId}
          toUserName={recModal.sellerName}
          bookingId={recModal.bookingId}
          onClose={() => setRecModal(null)}
          onSubmitted={() => setRecModal(null)}
        />
      )}

      {/* Ja/Nein Chat-Bestätigung */}
      {showChatConfirm && (() => {
        const b = bookings.find(x => x.id === showChatConfirm);
        if (!b) return null;
        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 10650,
            background: "rgba(20,20,34,0.55)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: "88%", maxWidth: 320, background: T.bgCard, borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: "0 12px 48px rgba(20,20,34,0.25)" }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 8 }}>Mit {b.seller_name} chatten?</div>
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>Möchtest du wirklich eine Unterhaltung mit dem Anbieter starten?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowChatConfirm(null)} style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: `1.5px solid ${T.border}`, background: "transparent", color: T.inkSoft, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Nein</button>
                <button
                  onClick={() => {
                    setShowChatConfirm(null);
                    setDetail(null);
                    actions[A.OPEN_CHAT]?.({ recipient: { id: b.seller_id, display_name: b.seller_name, avatar_url: null }, source: S.SYSTEM });
                  }}
                  style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: "none", background: T.teal, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                >Ja</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TAB 4: Wer hat mich gebucht
// ──────────────────────────────────────────────────────────────────────
function WerHatMichGebucht({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatConfirm, setShowChatConfirm] = useState(null);
  const [detail, setDetail] = useState(null);
  const actions = useHuiActions();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("talent_bookings")
      .select("id, talent_id, customer_id, selected_date, selected_time_slot, participants, status, amount_eur, created_at, cancelled_at, talents(title, images, category)")
      .eq("seller_id", userId)
      .order("selected_date", { ascending: false });

    const customerIds = [...new Set((data || []).map(b => b.customer_id).filter(Boolean))];
    let nameMap = {};
    if (customerIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, username").in("id", customerIds);
      nameMap = Object.fromEntries((profs || []).map(p => [p.id, p.display_name || p.username || "Kunde"]));
    }
    setBookings((data || []).map(b => ({ ...b, customer_name: nameMap[b.customer_id] || "Kunde" })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const buildTx = (b) => {
    const title = b.talents?.title || "Talent-Angebot";
    const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
    const timeStr = b.selected_time_slot?.start ? b.selected_time_slot.start + (b.selected_time_slot.end ? " – " + b.selected_time_slot.end : "") : null;

    const statusChips = [];
    if (b.status === "pending_payment") statusChips.push({ label: "Zahlung ausstehend", color: T.amber, bg: T.amberSoft });
    if (b.status === "confirmed") statusChips.push({ label: "Bestätigt ✓", color: T.green, bg: T.greenSoft });
    if (b.status === "completed") statusChips.push({ label: "Abgeschlossen ✓", color: T.green, bg: T.greenSoft });
    if (b.status === "cancelled") statusChips.push({ label: "Storniert", color: T.red, bg: T.redSoft });

    return {
      id: b.id, kindLabel: "Gebucht", title, image,
      amount: b.amount_eur, amountLabel: "Einnahme",
      dateLabel: dt(b.selected_date), statusChips,
      meta: [
        { label: "Datum", value: dt(b.selected_date) },
        { label: "Uhrzeit", value: timeStr },
        { label: "Teilnehmer", value: b.participants || null },
        { label: "Kategorie", value: b.talents?.category || null },
      ],
      person: { name: b.customer_name, roleLabel: "Kunde" },
      actions: {
        onChat: (b.customer_id && b.status !== "cancelled") ? () => setShowChatConfirm(b.id) : null,
        onViewProfile: b.customer_id ? () => window.__HUI_OPEN_PROFILE__?.(b.customer_id) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!bookings.length) return <EmptyState text="Noch keine Buchungen für dein Talent-Angebot." />;

  const totalEarned = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.amount_eur || 0), 0);

  return (
    <div>
      <SummaryRow label="Gesamteinnahmen" value={eur(totalEarned)} color={T.green} />
      {bookings.map(b => {
        const title = b.talents?.title || "Talent-Angebot";
        const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
        const statusChips = [];
        if (b.status === "pending_payment") statusChips.push({ label: "Zahlung ausstehend", color: T.amber, bg: T.amberSoft });
        if (b.status === "confirmed") statusChips.push({ label: "Bestätigt ✓", color: T.green, bg: T.greenSoft });
        if (b.status === "completed") statusChips.push({ label: "Abgeschlossen ✓", color: T.green, bg: T.greenSoft });
        if (b.status === "cancelled") statusChips.push({ label: "Storniert", color: T.red, bg: T.redSoft });
        return (
          <TxCard
            key={b.id}
            image={image}
            title={title}
            subtitle={b.customer_name}
            dateLabel={dt(b.selected_date)}
            amount={b.amount_eur}
            amountColor={T.green}
            statusChips={statusChips}
            onClick={() => setDetail(buildTx(b))}
          />
        );
      })}

      <TransactionDetailSheet tx={detail} onClose={() => setDetail(null)} />

      {showChatConfirm && (() => {
        const b = bookings.find(x => x.id === showChatConfirm);
        if (!b) return null;
        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 10650,
            background: "rgba(20,20,34,0.55)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: "88%", maxWidth: 320, background: T.bgCard, borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: "0 12px 48px rgba(20,20,34,0.25)" }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 8 }}>Mit {b.customer_name} chatten?</div>
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>Möchtest du wirklich eine Unterhaltung mit dem Käufer starten?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowChatConfirm(null)} style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: `1.5px solid ${T.border}`, background: "transparent", color: T.inkSoft, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Nein</button>
                <button
                  onClick={() => {
                    setShowChatConfirm(null);
                    setDetail(null);
                    actions[A.OPEN_CHAT]?.({ recipient: { id: b.customer_id, display_name: b.customer_name, avatar_url: null }, source: S.SYSTEM });
                  }}
                  style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: "none", background: T.teal, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                >Ja</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Hilfs-Komponenten
// ──────────────────────────────────────────────────────────────────────
function LoadingPlaceholder() {
  return (
    <div style={{ padding: "40px 0", textAlign: "center", color: T.inkFaint, fontSize: 13 }}>
      Wird geladen…
    </div>
  );
}
function EmptyState({ text }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: T.inkFaint, fontSize: 13, lineHeight: 1.5 }}>
      {text}
    </div>
  );
}
function SummaryRow({ label, value, color = T.ink }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: T.bgCard, borderRadius: T.r12, padding: "12px 16px",
      border: `1px solid ${T.border}`, marginBottom: 14,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: color, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}
function MiniStat({ label, value, color = T.ink }) {
  return (
    <div style={{
      background: T.bgCard, borderRadius: T.r12, padding: "12px 14px",
      border: `1px solid ${T.border}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.inkFaint, marginBottom: 4 }}>{label}</div>
      <span style={{ fontSize: 14, fontWeight: 600, color: color, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TABS-CONFIG
// ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "kaeufe",   label: "Käufe" },
  { id: "verkaeufe",label: "Verkäufe" },
  { id: "buchungen",label: "Buchungen" },
  { id: "gebucht",  label: "Gebucht" },
  { id: "support",  label: "Support" },
];


// ──────────────────────────────────────────────────────────────────────
// TAB 5: Support — Gegebene und erhaltene Unterstützungen
// ──────────────────────────────────────────────────────────────────────
function MeineSupports({ userId }) {
  const [given, setGiven]     = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState("given"); // given | received
  const [detail, setDetail]   = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [g, r] = await Promise.all([
      supabase.from("stripe_payments")
        .select("id, ambassador_id, amount, status, payment_type, description, metadata, created_at")
        .eq("user_id", userId)
        .eq("payment_type", "support")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("stripe_payments")
        .select("id, user_id, amount, status, payment_type, description, metadata, created_at")
        .eq("ambassador_id", userId)
        .eq("payment_type", "support")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setGiven(g.data || []);
    setReceived(r.data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const buildTx = (item, otherIdKey) => {
    const meta = item.metadata || {};
    const msg = meta.message || meta.support_message || null;
    const statusLabel = item.status === "succeeded" ? "Erfolgreich" : item.status === "pending" ? "Ausstehend" : item.status === "failed" ? "Fehlgeschlagen" : item.status;
    const statusColor = item.status === "succeeded" ? T.green : item.status === "pending" ? T.amber : T.red;
    const statusBg    = item.status === "succeeded" ? T.greenSoft : item.status === "pending" ? T.amberSoft : T.redSoft;
    return {
      id: item.id, kindLabel: view === "given" ? "Support gegeben" : "Support erhalten",
      title: item.description || "Unterstützung",
      image: null,
      amount: item.amount, amountLabel: "Betrag",
      dateLabel: dt(item.created_at),
      statusChips: [{ label: statusLabel, color: statusColor, bg: statusBg }],
      description: typeof msg === "string" ? msg : null,
      person: null,
      actions: {},
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!given.length && !received.length)
    return <EmptyState text="Noch keine Unterstützungen gegeben oder erhalten." />;

  const items = view === "given" ? given : received;
  const otherIdKey = view === "given" ? "ambassador_id" : "user_id";

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setView("given")}
          style={{
            flex: 1, padding: "8px", borderRadius: T.r12,
            background: view === "given" ? T.teal : T.bgCard, color: view === "given" ? "white" : T.inkSoft,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.ff,
            border: view === "given" ? "none" : `1px solid ${T.border}`,
          }}>
          Gegeben ({given.length})
        </button>
        <button onClick={() => setView("received")}
          style={{
            flex: 1, padding: "8px", borderRadius: T.r12,
            background: view === "received" ? T.teal : T.bgCard, color: view === "received" ? "white" : T.inkSoft,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.ff,
            border: view === "received" ? "none" : `1px solid ${T.border}`,
          }}>
          Erhalten ({received.length})
        </button>
      </div>

      {!items.length && (
        <EmptyState text={view === "given" ? "Du hast noch niemanden unterstützt." : "Du hast noch keine Unterstützungen erhalten."} />
      )}

      {items.map((item) => {
        const statusLabel = item.status === "succeeded" ? "Erfolgreich" : item.status === "pending" ? "Ausstehend" : item.status === "failed" ? "Fehlgeschlagen" : item.status;
        const statusColor = item.status === "succeeded" ? T.green : item.status === "pending" ? T.amber : T.red;
        const statusBg    = item.status === "succeeded" ? T.greenSoft : item.status === "pending" ? T.amberSoft : T.redSoft;
        return (
          <TxCard
            key={item.id}
            image={null}
            title={item.description || "Unterstützung"}
            dateLabel={dt(item.created_at)}
            amount={item.amount}
            statusChips={[{ label: statusLabel, color: statusColor, bg: statusBg }]}
            onClick={() => setDetail(buildTx(item, otherIdKey))}
          />
        );
      })}

      <TransactionDetailSheet tx={detail} onClose={() => setDetail(null)} />

      {/* Summary */}
      {items.length > 0 && (
        <div style={{
          marginTop: 12, padding: "12px 16px", borderRadius: T.r12,
          background: T.tealSoft, border: `1px solid ${T.tealMid}`,
        }}>
          <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 4 }}>
            {view === "given" ? "Insgesamt gegeben" : "Insgesamt erhalten"}
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: T.teal, whiteSpace: "nowrap" }}>
            {eur(items.filter(i => i.status === "succeeded").reduce((sum, i) => sum + Number(i.amount), 0))}
          </span>
          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>
            {items.filter(i => i.status === "succeeded").length} erfolgreiche Unterstützung(en)
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// HAUPT-EXPORT
// ──────────────────────────────────────────────────────────────────────
export default function FinanzuebersichtModal({ profile, onClose = () => {} }) {
  useModalRegistration(true, onClose, "FinanzuebersichtModal");
  const [tab, setTab] = useState("kaeufe");
  const userId = profile?.id;

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(26,26,24,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        fontFamily: T.ff,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: T.bg, borderRadius: "24px 24px 0 0",
          maxHeight: "92vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "8px 20px 12px", flexShrink: 0,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>
              Käufe/Verkäufe
            </div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>
              Käufe, Verkäufe, Buchungen & Support
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.inkSoft,
          }}>✕</button>
        </div>

        {/* Tab-Bar */}
        <div style={{
          display: "flex", overflowX: "auto", gap: 6,
          padding: "10px 16px", flexShrink: 0,
          scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
          borderBottom: `1px solid ${T.border}`,
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flexShrink: 0, padding: "3px 8px",
                borderRadius: T.r99,
                background: tab === t.id ? T.teal : T.bgCard,
                color: tab === t.id ? "white" : T.inkSoft,
                fontSize: 10, fontWeight: tab === t.id ? 600 : 500,
                cursor: "pointer", fontFamily: T.ff,
                border: tab === t.id ? "none" : `1px solid ${T.border}`,
                transition: "all .15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Inhalt scrollbar */}
        <div style={{
          flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain", scrollbarWidth: "none",
          padding: "14px 16px calc(88px + env(safe-area-inset-bottom, 0px))",
        }}>
          {tab === "kaeufe"    && <MeineKaeufe userId={userId} />}
          {tab === "verkaeufe" && <MeineVerkaeufe userId={userId} />}
          {tab === "buchungen" && <MeineBuchungen userId={userId} />}
          {tab === "gebucht"   && <WerHatMichGebucht userId={userId} />}
          {tab === "support"   && <MeineSupports userId={userId} />}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
