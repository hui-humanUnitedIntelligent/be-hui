// src/components/studio/FinanzuebersichtModal.jsx
// ══════════════════════════════════════════════════════════════════════
// FINANZÜBERSICHT — Alles in einem Modal, kein verschachteltes Portal.
// Tabs: Meine Käufe | Meine Verkäufe | Meine Buchungen | Wer hat mich gebucht | Support
// Pflicht: createPortal → document.body, zIndex:10500
//
// DETAIL-001 (2026-08-08): Listen-Karten wurden radikal vereinfacht
// (nur Titel/Datum/Preis/Status) — Klick auf eine Karte öffnet das
// gemeinsame TransactionDetailSheet mit ALLEN Details + Aktionen (Chat,
// Beleg, Empfehlung, Ware bestätigen, Profil ansehen). Vorher waren
// bis zu 4 Buttons direkt auf jeder Karte gestapelt ("unübersichtlich").
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import RecommendModal from "../profile/RecommendModal.jsx";
import { RecommendationService } from "../../services/db.js";
import TransactionDetailSheet from "./TransactionDetailSheet.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";
import { generateReceipt } from "../../lib/generateReceipt.js";
import BelegViewerModal from "../notifications/BelegViewerModal.jsx";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
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

// ── FIX (2026-08-16, RAW-NETWORK-ERROR-BUG): Bei DNS-/Netzwerkfehlern (z.B.
// "Unable to resolve host ...: No address associated with hostname" auf
// Android, oder "Failed to fetch" im Browser) zeigte der Alert bisher die
// rohe Java-/Fetch-Exception. Für den Nutzer sah das aus wie "Button
// reagiert nicht" bzw. ein kaputtes Feature — tatsächlich war es eine
// temporäre Verbindungsstörung auf dem Gerät (kein Supabase-Ausfall).
// Diese Funktion erkennt bekannte Netzwerkfehler-Muster und ersetzt sie
// durch eine verständliche, beruhigende deutsche Meldung (Geld ist sicher
// in Treuhand, bitte Verbindung prüfen + erneut versuchen).
function friendlyErrorMessage(rawMessage, t) {
  const msg = String(rawMessage || "");
  const networkPatterns = [
    /unable to resolve host/i,
    /no address associated with hostname/i,
    /failed to fetch/i,
    /networkerror/i,
    /net::err_/i,
    /timeout/i,
    /timed out/i,
    /connection.*(refused|reset|closed)/i,
    /unreachable/i,
    /offline/i,
  ];
  if (networkPatterns.some((re) => re.test(msg))) {
    return t("fz.errNetwork");
  }
  return msg || t("fz.errUnknown");
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
  const { t } = useTranslation();
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
            {needsAction && <StatusChip label={t("fz.actionNeeded")} color={T.teal} bg={T.tealSoft} />}
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
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmDone, setConfirmDone] = useState({});
  const [disputingId, setDisputingId] = useState(null);
  const [disputeDone, setDisputeDone] = useState({});
  const [recModal, setRecModal] = useState(null); // { sellerId, sellerName, orderId }
  const [sellerMap, setSellerMap] = useState({});
  const [detail, setDetail] = useState(null);
  // BUGFIX (2026-08-25): persistente "bereits empfohlen"-Markierung pro
  // order_id — überlebt Reload, im Gegensatz zum vorherigen rein lokalen
  // confirmDone-State. Siehe RecommendationService.getRecommendedTransactionIds.
  const [recommendedOrderIds, setRecommendedOrderIds] = useState(new Set());
  const [receiptPreview, setReceiptPreview] = useState(null);
  const actions = useHuiActions();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, state, total_eur, created_at, contact_name, escrow_status, buyer_confirmed_at, auto_confirm_at, delivery_status, dispute_open, buyer_confirmed, shipped_at, delivered_at, shipping_address, tracking_number, purchase_status, order_items(id, snapshot, unit_price_eur, payout_eur, shipping_eur, impact_eur, seller_id, work_id, variant_id, variant_name)")
      .eq("customer_id", userId)
      .in("state", ["paid", "completed"])
      .order("created_at", { ascending: false });
    setOrders(data || []);

    // Seller-Profile nachladen für Chat
    const sellerIds = [...new Set((data || []).map(o => o.order_items?.[0]?.seller_id).filter(Boolean))];
    if (sellerIds.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, display_name, username, avatar_url, email, website")
        .in("id", sellerIds);
      const map = {};
      (profs || []).forEach(p => {
        map[p.id] = { name: p.display_name || p.username || t("fz.seller"), avatar: p.img || p.avatar_url || null, website: p.website || null, username: p.username || null };
      });
      setSellerMap(map);
    }

    // BUGFIX (2026-08-25): welche dieser Bestellungen wurden vom Käufer
    // bereits mit einer Empfehlung versehen? → Button in TransactionDetailSheet
    // dauerhaft (nicht nur bis zum nächsten Reload) auf "abgegeben" umschalten.
    const orderIds = (data || []).map(o => o.id);
    if (orderIds.length) {
      const { orderIds: doneIds } = await RecommendationService.getRecommendedTransactionIds(userId, { orderIds });
      setRecommendedOrderIds(doneIds);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ── HANDLE CONFIRM: Edge Function confirm-and-transfer (Stripe + DB) ──
  // FIX (2026-08-16, DUPLICATE-NOTIF-BUG + BROKEN-TRANSFER-BUG):
  // 1) Reentry-Guard: Ein zweiter Klick waehrend ein Request noch laeuft wird
  //    sofort ignoriert (vorher konnte ein sehr schneller Doppelklick VOR dem
  //    naechsten React-Render den Handler zweimal ausloesen).
  // 2) Die Notification an den Verkaeufer wird jetzt AUSSCHLIESSLICH serverseitig
  //    in der Edge Function confirm-and-transfer erzeugt (exakt einmal, durch die
  //    jetzt idempotente RPC + DB-Unique-Index abgesichert) -- der fruehere
  //    Client-seitige Insert hier ist entfernt, das war die zweite Notification-
  //    Quelle und lief zudem mit falschem Spalten-Schema (text/entity_type ohne
  //    title/body/is_read) komplett ins Leere.
  const handleConfirm = async (orderId) => {
    if (confirmingId) return; // Reentry-Guard — verhindert Doppelklick
    setConfirmingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // SAFETY (2026-08-16): 30s Timeout — falls Edge Function hangt,
      // fällt der catch-Block auf direkte RPC zurück statt 150s zu warten.
      const _ac1 = new AbortController();
      const _to1 = setTimeout(() => _ac1.abort(), 30000);
      const res = await fetch(`${supabaseUrl}/functions/v1/confirm-and-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: orderId }),
        signal: _ac1.signal,
      });
      clearTimeout(_to1);
      const result = await res.json();

      // FIX (2026-08-16, FAKE-SUCCESS-BUG): Vorher wurde bei jedem Fehler
      // (sowohl HTTP-Error als auch Catch) trotzdem confirmDone[orderId]=true
      // gesetzt — die UI zeigte "Erhalten ✓ / Zahlung freigegeben", aber in der
      // DB blieb buyer_confirmed=false und escrow_status='holding'. Der Käufer
      // glaubte er hätte bestätigt, aber nichts war passiert.
      // Jetzt: Nur bei echtem Erfolg (res.ok && result.ok) oder idempotentem
      // "skipped" (bereits vorher bestätigt) wird confirmDone gesetzt.
      // Bei Fehler: Fehler anzeigen, NICHT als bestätigt markieren.
      if (res.ok && result?.ok) {
        // Erfolg oder skipped (idempotent — bereits bestätigt)
        setConfirmDone(p => ({ ...p, [orderId]: true }));
        setDetail(null);
        load();
      } else {
        // Echter Fehler — KEIN Fake-Erfolg
        console.warn("[ESCROW] confirm-and-transfer error:", result?.error);
        // Nur die reine DB-Bestätigung versuchen (ohne Transfer) als Notfall-Fallback,
        // aber nur wenn die Edge Function komplett unerreichbar war (Netzwerkfehler).
        // Wenn die Edge Function reachable war aber einen Fehler gemeldet hat
        // (z.B. order_not_found), darf kein Fallback erfolgen.
        // In beiden Fällen: NICHT als "done" markieren.
        {
        const friendly = friendlyErrorMessage(result?.error);
        const isNetwork = friendly !== (result?.error || t("fz.errUnknown"));
        alert(isNetwork ? friendly : t("fz.errConfirmFailed", { msg: friendly }) + ".");
      }
      }
    } catch (e) {
      // Netzwerkfehler — Edge Function nicht erreichbar
      console.warn("[ESCROW] confirm-and-transfer network error:", e);
      // Fallback: direkte RPC (nur DB-Bestätigung, kein Stripe-Transfer)
      const { data: rpcResult, error: rpcErr } = await supabase.rpc("rpc_buyer_confirm_receipt", { p_order_id: orderId });
      if (rpcResult?.success) {
        // RPC hat funktioniert — Bestätigung ok, aber Stripe-Transfer fehlt
        setConfirmDone(p => ({ ...p, [orderId]: true }));
        setDetail(null);
        load();
      } else {
        {
        const friendly = friendlyErrorMessage(rpcErr?.message);
        const isNetwork = friendly !== (rpcErr?.message || t("fz.errUnknown"));
        alert(isNetwork ? friendly : t("fz.errConfirmFailed", { msg: friendly }) + ".");
      }
      }
    } finally {
      setConfirmingId(null);
    }
  };

  // ── HANDLE DISPUTE: Käufer meldet "Nicht erhalten" ──
  const handleDispute = async (orderId, note) => {
    setDisputingId(orderId);
    try {
      const { data, error } = await supabase.rpc("rpc_buyer_open_dispute", {
        p_order_id: orderId,
        p_note: note || null,
      });
      if (data?.ok || error) {
        setDisputeDone(p => ({ ...p, [orderId]: true }));
        setDetail(null);
        load();
      }
    } catch (e) {
      console.warn("[ESCROW] dispute error:", e);
    } finally {
      setDisputingId(null);
    }
  };

  const buildTx = (o) => {
    const item = o.order_items?.[0];
    const title = item?.snapshot?.title || item?.snapshot?.name || t("fz.work");
    const variantName = item?.variant_name || null;
    const titleWithVariant = variantName ? `${title} · ${variantName}` : title;
    const image = item?.snapshot?.cover_url || null;
    const confirmed = confirmDone[o.id] || !!o.buyer_confirmed_at || !!o.buyer_confirmed;
    const isDisputed = disputeDone[o.id] || !!o.dispute_open || o.escrow_status === "disputed";
    const needsConfirm = (o.escrow_status === "holding" || !o.escrow_status) && !confirmed && !isDisputed;
    const sellerId = item?.seller_id;
    const sInfo = sellerId ? sellerMap[sellerId] : null;

    const statusChips = [];
    if (o.escrow_status === "released" || confirmed) statusChips.push({ label: t("fz.statusReleased"), color: T.green, bg: T.greenSoft });
    if (o.escrow_status === "holding") statusChips.push({ label: t("fz.statusHolding"), color: T.amber, bg: T.amberSoft });
    if (o.escrow_status === "disputed" || isDisputed) statusChips.push({ label: t("fz.statusDisputed"), color: T.amber, bg: T.amberSoft });
    if (confirmed) statusChips.push({ label: t("fz.statusReceived"), color: T.teal, bg: T.tealSoft });

    // FIX (2026-08-26, Michael): Vorherige Version zeigte "Werk-Preis 10 +
    // Plattformgebühr 2 = 12" während "Gesamt bezahlt" 13 anzeigte — die
    // Rechnung ging nicht auf, weil Versandkosten (hier 3€) komplett fehlten
    // UND weil die Plattformgebühr wie ein Aufpreis für den Käufer wirkte,
    // obwohl sie NICHT zusätzlich bezahlt wird, sondern vom Werk-Preis
    // zwischen Verkäufer und Plattform aufgeteilt wird (Käufer zahlt nur
    // Werk-Preis + Versand — siehe commerceUtils.js: "Plattformgebühr wird
    // von HUI getragen, kein Abzug für den Käufer").
    //
    // Block 1 — was der Käufer tatsächlich bezahlt hat (muss exakt aufgehen):
    const priceEur = item?.snapshot?.price_eur ?? item?.unit_price_eur ?? 0;
    const shippingEur = Number(item?.shipping_eur ?? 0);
    const breakdown = [];
    breakdown.push({ label: t("fz.detailWorkPrice"), value: eur(priceEur) });
    if (shippingEur > 0) breakdown.push({ label: t("fz.detailShippingCost"), value: eur(shippingEur) });
    breakdown.push({ label: t("fz.detailTotalPaid"), value: eur(o.total_eur) });

    // Block 2 — separate Transparenz-Anzeige: wie sich der Werk-Preis
    // (NICHT der Versand) zwischen Verkäufer und Plattform aufteilt.
    // Kein zusätzlicher Käufer-Cent — nur Aufschlüsselung des bereits
    // gezahlten Werk-Preises.
    const itemFee = (item?.unit_price_eur || 0) - (item?.payout_eur || 0);
    const impactEurBuyer = item?.snapshot?.impact_eur ?? item?.impact_eur ?? null;
    const revenueSplit = itemFee > 0 ? [
      { label: t("fz.detailSellerShare"), value: eur(item?.payout_eur || 0) },
      { label: t("fz.detailPlatformShare"), value: eur(itemFee) },
      ...(impactEurBuyer != null ? [{ label: t("fz.detailImpactPoolShare"), value: eur(impactEurBuyer) }] : []),
    ] : [];

    return {
      id: o.id, kindLabel: t("fz.detailPurchase"), title: titleWithVariant, image,
      amount: o.total_eur, amountLabel: t("fz.detailPaid"),
      dateLabel: dt(o.created_at), statusChips, breakdown, revenueSplit, needsConfirm,
      meta: [
        ...(o.shipped_at ? [{ label: t("fz.metaShippedAt"), value: dt(o.shipped_at) }] : []),
        ...(o.delivered_at ? [{ label: t("fz.metaDeliveredAt"), value: dt(o.delivered_at) }] : []),
        ...((o.delivery_status === "shipped" && !o.delivered_at) ? [{ label: t("fz.metaStatus"), value: t("fz.statusUnderway") }] : []),
        ...(o.shipping_address ? [{ label: t("fz.metaShippingAddress"), value: (o.shipping_address.full || "").replace(/\n/g, ", ") }] : []),
        ...(o.tracking_number ? [{ label: t("fz.metaTracking"), value: o.tracking_number }] : []),
      ],
      person: sInfo ? { name: sInfo.name, avatar: sInfo.avatar, website: sInfo.website, roleLabel: t("fz.seller") } : null,
      actions: {
        onConfirmReceipt: needsConfirm ? () => handleConfirm(o.id) : null,
        confirmingReceipt: confirmingId === o.id,
        receiptConfirmed: confirmed,
        onDispute: needsConfirm ? (note) => handleDispute(o.id, note) : null,
        disputing: disputingId === o.id,
        disputeOpen: isDisputed,
        onChat: (sellerId && sInfo) ? () => actions[A.OPEN_CHAT]?.({ recipient: { id: sellerId, display_name: sInfo.name, avatar_url: sInfo.avatar }, source: S.SYSTEM }) : null,
        canRecommend: !!(confirmed && sellerId && !recommendedOrderIds.has(o.id)),
        recommendationGiven: recommendedOrderIds.has(o.id),
        onRecommend: (confirmed && sellerId && !recommendedOrderIds.has(o.id)) ? () => { setDetail(null); setRecModal({ sellerId, sellerName: o.contact_name || t("fz.seller"), orderId: o.id }); } : null,
        onDownloadReceipt: async () => {
          try {
            const result = await generateReceipt({
              offerTitle: title,
              sellerName: sInfo?.name || t("fz.seller"),
              // BELEG-013: sellerEmail entfernt — generateReceipt.js zeigt
              // immer support@be-hui.com (SSOT, Datenschutz).
              sellerWebsite: sInfo?.website || null,
              sellerUsername: sInfo?.username || null,
              amountEur: o.total_eur,
              bookingId: o.id,
              offerId: item?.work_id || null,
              offerType: "werk",
            });
            // BUGFIX (2026-08-26): Nach dem Speichern die Beleg-Vorschau mit
            // "Teilen"-Button oeffnen (analog NotificationPanel.jsx) — vorher
            // wurde das result komplett verworfen, kein Share war moeglich.
            if (result) setReceiptPreview(result);
          } catch (e) { console.warn("Receipt failed:", e); }
        },
        onViewProfile: sellerId ? () => window.__HUI_OPEN_PROFILE__?.(sellerId) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!orders.length) return <EmptyState text={t("fz.noPurchases")} />;

  const total = orders.reduce((s, o) => s + (o.total_eur || 0), 0);

  return (
    <div>
      <SummaryRow label={t("fz.totalSpent")} value={eur(total)} />
      {orders.map(o => {
        const item = o.order_items?.[0];
        const title = item?.snapshot?.title || item?.snapshot?.name || t("fz.work");
        const variantName = item?.variant_name || null;
        const titleWithVariant = variantName ? `${title} · ${variantName}` : title;
        const image = item?.snapshot?.cover_url || null;
        const confirmed = confirmDone[o.id] || !!o.buyer_confirmed_at || !!o.buyer_confirmed;
        const isDisputed = disputeDone[o.id] || !!o.dispute_open || o.escrow_status === "disputed";
        const needsConfirm = (o.escrow_status === "holding" || !o.escrow_status) && !confirmed && !isDisputed;
        const statusChips = [];
        if (o.escrow_status === "released" || confirmed) statusChips.push({ label: t("fz.statusReleased"), color: T.green, bg: T.greenSoft });
        if (o.escrow_status === "holding") statusChips.push({ label: t("fz.statusHolding"), color: T.amber, bg: T.amberSoft });
        if (o.escrow_status === "disputed" || isDisputed) statusChips.push({ label: t("fz.statusDisputed"), color: T.amber, bg: T.amberSoft });
        return (
          <TxCard
            key={o.id}
            image={image}
            title={titleWithVariant}
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
          onSubmitted={() => {
            // BUGFIX (2026-08-25): sofortige UI-Aktualisierung, kein Warten
            // auf den nächsten load() — Button zeigt direkt "abgegeben".
            if (recModal.orderId) {
              setRecommendedOrderIds(prev => new Set(prev).add(recModal.orderId));
            }
            setRecModal(null);
          }}
        />
      )}

      <BelegViewerModal result={receiptPreview} onClose={() => setReceiptPreview(null)} />
    </div>
  );
}
function MeineVerkaeufe({ userId }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerMap, setBuyerMap] = useState({});
  const [detail, setDetail] = useState(null);
  const [shippingId, setShippingId] = useState(null);
  const actions = useHuiActions();

  // FIX (2026-08-16, DUPLICATE-NOTIF-BUG): Reentry-Guard ergaenzt + Notification
  // wird jetzt NUR bei result.ok && !result.skipped ausgeloest. Die RPC selbst
  // ist jetzt idempotent (delivery_status/shipped_at-Guard, siehe Migration) --
  // ein zweiter Aufruf liefert result.skipped=true zurueck statt erneut ok:true,
  // wodurch vorher bei jedem Doppelklick eine zusaetzliche Notification entstand
  // (belegt: 3 identische "order_shipped"-Einträge fuer dieselbe Bestellung).
  const handleShip = async (orderId) => {
    if (!orderId || shippingId) return; // Reentry-Guard
    setShippingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/rpc_seller_mark_shipped`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ p_order_id: orderId }),
        }
      );
      const result = await res.json();
      if (result.ok && !result.skipped) {
        const { data: order } = await supabase
          .from("orders").select("customer_id").eq("id", orderId).maybeSingle();
        if (order?.customer_id) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const { error: notifErr } = await supabase.from("notifications").insert({
            user_id:     order.customer_id,
            type:        "order_shipped",
            title:       t("fz.notifShippedTitle"),
            body:        t("fz.notifShippedBody"),
            is_read:     false,
            read:        false,
            actor_id:    authUser?.id || null,
            entity_id:   orderId,
            entity_type: "order",
          });
          // 23505 = unique_violation (DB-Sicherheitsnetz griff) -- unkritisch
          if (notifErr && notifErr.code !== "23505") console.warn("[SHIP] notify:", notifErr.message);
        }
      }
      if (result.ok) { load(); setDetail(null); }
    } catch (e) {
      console.warn("[SHIP] error:", e);
    } finally {
      setShippingId(null);
    }
  };

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("order_items")
      .select("id, order_id, snapshot, unit_price_eur, payout_eur, fulfillment_status, payout_status, created_at, variant_id, variant_name, orders!inner(id, state, total_eur, customer_id, escrow_status, delivery_status, buyer_confirmed_at, buyer_confirmed, dispute_open, payout_requested_at, auto_confirm_at, shipped_at, delivered_at, shipping_address, tracking_number, purchase_status)")
      .eq("seller_id", userId)
      .eq("orders.state", "paid")
      .order("created_at", { ascending: false });
    setItems(data || []);

    // Buyer-Profile nachladen für Chat
    const buyerIds = [...new Set((data || []).map(i => i.orders?.customer_id).filter(Boolean))];
    if (buyerIds.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, display_name, username, avatar_url, email, website")
        .in("id", buyerIds);
      const map = {};
      (profs || []).forEach(p => {
        map[p.id] = { name: p.display_name || p.username || t("fz.buyer"), avatar: p.img || p.avatar_url || null };
      });
      setBuyerMap(map);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const buildTx = (s) => {
    const title = s.snapshot?.title || s.snapshot?.name || t("fz.work");
    const image = s.snapshot?.cover_url || null;
    const escrow = s.orders?.escrow_status;
    const payoutReq = !!s.orders?.payout_requested_at;
    const buyerId = s.orders?.customer_id;
    const bInfo = buyerId ? buyerMap[buyerId] : null;

    const statusChips = [];
    if (escrow === "holding" && !payoutReq) statusChips.push({ label: t("fz.statusPaymentOpen"), color: T.amber, bg: T.amberSoft });
    if (escrow === "holding" && payoutReq) statusChips.push({ label: t("fz.statusPayoutRequested"), color: T.teal, bg: T.tealSoft });
    // FIX (2026-08-16): Bei escrow='released' unterscheiden ob der
    // Stripe-Transfer wirklich stattfand (payout_status='transferred')
    // oder ob der Verkäufer keine Bankdaten hat (payout_status='manual_required').
    const payoutStatus = s.payout_status;
    if (escrow === "released" && payoutStatus === "transferred") statusChips.push({ label: t("fz.statusPaidOut"), color: T.green, bg: T.greenSoft });
    else if (escrow === "released" && payoutStatus === "manual_required") statusChips.push({ label: t("fz.statusBankMissing"), color: T.amber, bg: T.amberSoft });
    else if (escrow === "released") statusChips.push({ label: t("fz.statusApproved"), color: T.teal, bg: T.tealSoft });
    if (escrow === "disputed") statusChips.push({ label: t("fz.statusDisputed"), color: T.red, bg: T.redSoft });
    if (s.orders?.buyer_confirmed_at) statusChips.push({ label: t("fz.statusBuyerConfirmed"), color: T.teal, bg: T.tealSoft });

    // FIX (2026-08-16): Balanced-Growth-v1 — Impact = echter Impact-Anteil
    // aus snapshot (6% des Verkaufspreises = 30% der 20%-Gebühr), nicht die
    // gesamte Plattformgebühr (20%). payout_eur = 80% = Talent-Anteil.
    // platformFee = unit_price - payout = 20% Gesamtgebühr.
    // impact_eur = snapshot.impact_eur oder order_items.impact_eur (6%).
    const platformFee = (s.unit_price_eur || 0) - (s.payout_eur || 0);
    const impactEur   = s.snapshot?.impact_eur ?? s.impact_eur ?? 0;
    // escrow_status kann "none" sein (ältere Orders) — dann als "holding" behandeln
    // solange die Order paid ist und noch nicht versendet wurde.
    const escrowHolding = s.orders?.escrow_status === "holding" || (!s.orders?.shipped_at && (s.orders?.escrow_status === "none" || !s.orders?.escrow_status));
    // FIX (2026-08-16): Lieferadresse wird als prominente grüne Section angezeigt
    // (tx.shippingAddress → TransactionDetailSheet) — nicht mehr als MetaRow verstecken.
    const addrParts = [];
    return {
      id: s.id, kindLabel: t("fz.detailSale"), title: (s.snapshot?.title || s.snapshot?.name || t("fz.work")) + (s.variant_name ? " · " + s.variant_name : ""), image,
      amount: s.payout_eur, amountLabel: t("fz.detailEarned"),
      dateLabel: dt(s.created_at), statusChips,
      breakdown: [
        { label: t("fz.detailSalePrice"), value: eur(s.unit_price_eur) },
        { label: t("fz.detailPlatformFee"), value: eur(platformFee) },
        { label: t("fz.detailImpactShare"), value: eur(impactEur) },
        { label: t("fz.detailYourPayout"), value: eur(s.payout_eur) },
      ],
      meta: [
        ...(s.orders?.shipped_at ? [{ label: t("fz.metaShippedAt"), value: dt(s.orders.shipped_at) }] : []),
        ...(s.orders?.delivered_at ? [{ label: t("fz.metaDeliveredAt"), value: dt(s.orders.delivered_at) }] : []),
        ...addrParts,
        ...(s.orders?.tracking_number ? [{ label: t("fz.metaTracking"), value: s.orders.tracking_number }] : []),
      ],
      person: (buyerId && bInfo) ? { name: bInfo.name, avatar: bInfo.avatar, roleLabel: t("fz.buyer") } : null,
      shippingAddress: s.orders?.shipping_address || null,
      actions: {
        onChat: (buyerId && bInfo) ? () => actions[A.OPEN_CHAT]?.({ recipient: { id: buyerId, display_name: bInfo.name, avatar_url: bInfo.avatar }, source: S.SYSTEM }) : null,
        onViewProfile: buyerId ? () => window.__HUI_OPEN_PROFILE__?.(buyerId) : null,
        onMarkShipped: (!s.orders?.shipped_at && escrowHolding) ? () => handleShip(s.orders?.id) : null,
        shipping: shippingId === s.orders?.id,
        shipped: !!s.orders?.shipped_at,
        shippedAt: s.orders?.shipped_at ? dt(s.orders.shipped_at) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!items.length) return <EmptyState text={t("fz.noSales")} />;

  const totalVerdient   = items.reduce((s, i) => s + (i.payout_eur || 0), 0);
  const totalUmsatz     = items.reduce((s, i) => s + (i.unit_price_eur || 0), 0);
  // Impact-Anteil = 6% des Verkaufspreises (30% der 20%-Gebühr)
  const totalImpact     = items.reduce((s, i) => s + (i.snapshot?.impact_eur ?? i.impact_eur ?? 0), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <MiniStat label={t("fz.totalEarned")} value={eur(totalVerdient)} color={T.green} />
        <MiniStat label={t("fz.totalRevenue")} value={eur(totalUmsatz)} />
        <MiniStat label={t("fz.totalImpactPool")} value={eur(totalImpact)} color={T.teal} />
        <MiniStat label={t("fz.totalSales")} value={items.length} />
      </div>
      {items.map(s => {
        const title = s.snapshot?.title || s.snapshot?.name || t("fz.work");
        const variantName = s.variant_name || null;
        const titleWithVariant = variantName ? `${title} · ${variantName}` : title;
        const image = s.snapshot?.cover_url || null;
        const escrow = s.orders?.escrow_status;
        const payoutReq = !!s.orders?.payout_requested_at;
        const statusChips = [];
        if (escrow === "holding" && !payoutReq) statusChips.push({ label: t("fz.statusPaymentOpen"), color: T.amber, bg: T.amberSoft });
        if (escrow === "holding" && payoutReq) statusChips.push({ label: t("fz.statusPayoutRequested"), color: T.teal, bg: T.tealSoft });
        if (escrow === "released" && s.payout_status === "transferred") statusChips.push({ label: t("fz.statusPaidOut"), color: T.green, bg: T.greenSoft });
        else if (escrow === "released" && s.payout_status === "manual_required") statusChips.push({ label: t("fz.statusBankMissing"), color: T.amber, bg: T.amberSoft });
        else if (escrow === "released") statusChips.push({ label: t("fz.statusApproved"), color: T.teal, bg: T.tealSoft });
        if (escrow === "disputed") statusChips.push({ label: t("fz.statusDisputed"), color: T.red, bg: T.redSoft });
        return (
          <TxCard
            key={s.id}
            image={image}
            title={titleWithVariant}
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
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDone, setConfirmDone] = useState({});
  const [recModal, setRecModal] = useState(null);
  const [showChatConfirm, setShowChatConfirm] = useState(null); // bookingId or null
  const [detail, setDetail] = useState(null);
  // BUGFIX (2026-08-25): persistente "bereits empfohlen"-Markierung pro
  // booking_id — überlebt Reload (siehe MeineKaeufe für dieselbe Logik).
  const [recommendedBookingIds, setRecommendedBookingIds] = useState(new Set());
  const [receiptPreview, setReceiptPreview] = useState(null);
  const actions = useHuiActions();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("talent_bookings")
      .select("id, talent_id, seller_id, selected_date, selected_time_slot, participants, status, amount_eur, created_at, cancelled_at, escrow_status, delivery_status, buyer_confirmed_at, buyer_confirmed, dispute_open, purchase_status, talents(title, images, category, location_type, location_address)")
      .eq("customer_id", userId)
      .order("selected_date", { ascending: false });

    // Seller-Namen nachladen
    const sellerIds = [...new Set((data || []).map(b => b.seller_id).filter(Boolean))];
    let nameMap = {};
    if (sellerIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, username, email, website").in("id", sellerIds);
      nameMap = Object.fromEntries((profs || []).map(p => [p.id, { name: p.display_name || p.username || t("fz.provider"), website: p.website || null, username: p.username || null }]));
    }
    setBookings((data || []).map(b => { const sm = nameMap[b.seller_id] || { name: t("fz.provider") }; return { ...b, seller_name: sm.name || t("fz.provider"), seller_website: sm.website || null, seller_username: sm.username || null }; }));

    // BUGFIX (2026-08-25): welche dieser Buchungen wurden vom Kunden bereits
    // mit einer Empfehlung versehen?
    const bookingIds = (data || []).map(b => b.id);
    if (bookingIds.length) {
      const { bookingIds: doneIds } = await RecommendationService.getRecommendedTransactionIds(userId, { bookingIds });
      setRecommendedBookingIds(doneIds);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ── ESCROW: Buchungs-Bestätigung via Edge Function ──
  const [confirmingBooking, setConfirmingBooking] = useState(null);
  const [disputingBooking, setDisputingBooking] = useState(null);

  const handleConfirmBooking = async (bookingId) => {
    if (confirmingBooking) return; // FIX (2026-08-16): Reentry-Guard, analog handleConfirm
    setConfirmingBooking(bookingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const _ac2 = new AbortController();
      const _to2 = setTimeout(() => _ac2.abort(), 30000);
      const res = await fetch(`${supabaseUrl}/functions/v1/confirm-and-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ booking_id: bookingId }),
        signal: _ac2.signal,
      });
      clearTimeout(_to2);
      const result = await res.json();
      // FIX (2026-08-16, FAKE-SUCCESS-BUG): Analog handleConfirm — kein
      // Fake-Erfolg bei Fehler. Nur bei echtem Erfolg oder idempotentem
      // "skipped" als bestätigt markieren.
      if (res.ok && result?.ok) {
        setConfirmDone(p => ({ ...p, [bookingId]: true }));
        setDetail(null);
        load();
      } else {
        console.warn("[ESCROW] booking confirm error:", result?.error);
        {
        const friendly = friendlyErrorMessage(result?.error);
        const isNetwork = friendly !== (result?.error || t("fz.errUnknown"));
        alert(isNetwork ? friendly : t("fz.errConfirmFailed", { msg: friendly }) + ".");
      }
      }
    } catch (e) {
      console.warn("[ESCROW] booking confirm network error:", e);
      // Fallback: direkte RPC (nur DB-Bestätigung, kein Stripe-Transfer)
      const { data: rpcResult, error: rpcErr } = await supabase.rpc("rpc_buyer_confirm_receipt", { p_booking_id: bookingId });
      if (rpcResult?.success) {
        setConfirmDone(p => ({ ...p, [bookingId]: true }));
        setDetail(null);
        load();
      } else {
        {
        const friendly = friendlyErrorMessage(rpcErr?.message);
        const isNetwork = friendly !== (rpcErr?.message || t("fz.errUnknown"));
        alert(isNetwork ? friendly : t("fz.errConfirmFailed", { msg: friendly }) + ".");
      }
      }
    } finally {
      setConfirmingBooking(null);
    }
  };

  const handleDisputeBooking = async (bookingId, note) => {
    setDisputingBooking(bookingId);
    try {
      const { data } = await supabase.rpc("rpc_buyer_open_dispute", {
        p_booking_id: bookingId,
        p_note: note || null,
      });
      setConfirmDone(p => ({ ...p, [bookingId]: true }));
      setDetail(null);
      load();
    } catch (e) {
      console.warn("[ESCROW] booking dispute error:", e);
    } finally {
      setDisputingBooking(null);
    }
  };

  const buildTx = (b) => {
    const title = b.talents?.title || t("fz.talentOffer");
    const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
    const done = b.status === "completed" || b.status === "confirmed";
    const alreadyRecommended = recommendedBookingIds.has(b.id);
    const canRec = done && b.seller_id && !alreadyRecommended;
    const location = b.talents?.location_type === "online" ? t("fz.online") : (b.talents?.location_address || null);
    const timeStr = b.selected_time_slot?.start ? b.selected_time_slot.start + (b.selected_time_slot.end ? " – " + b.selected_time_slot.end : "") : null;

    const bConfirmed = confirmDone[b.id] || !!b.buyer_confirmed_at || !!b.buyer_confirmed;
    const bDisputed = !!b.dispute_open || b.escrow_status === "disputed";
    const bNeedsConfirm = (b.escrow_status === "holding" || (b.status === "confirmed" && !b.escrow_status)) && !bConfirmed && !bDisputed;

    const statusChips = [];
    if (b.status === "pending_payment") statusChips.push({ label: t("fz.statusPaymentPending"), color: T.amber, bg: T.amberSoft });
    if (b.status === "confirmed" && !bConfirmed && !bDisputed) statusChips.push({ label: t("fz.statusConfirmedCheck"), color: T.green, bg: T.greenSoft });
    if (b.status === "completed" || (b.escrow_status === "released" && bConfirmed)) statusChips.push({ label: t("fz.statusReceived"), color: T.green, bg: T.greenSoft });
    if (b.escrow_status === "holding") statusChips.push({ label: t("fz.statusHolding"), color: T.amber, bg: T.amberSoft });
    if (b.escrow_status === "disputed" || bDisputed) statusChips.push({ label: t("fz.statusDisputed"), color: T.amber, bg: T.amberSoft });
    if (b.status === "cancelled") statusChips.push({ label: t("fz.statusCancelled"), color: T.red, bg: T.redSoft });

    return {
      id: b.id, kindLabel: t("fz.detailBooking"), title, image,
      amount: b.amount_eur, amountLabel: t("fz.detailBookedFor"),
      dateLabel: dt(b.selected_date), statusChips,
      meta: [
        { label: t("fz.metaDate"), value: dt(b.selected_date) },
        { label: t("fz.metaTime"), value: timeStr },
        { label: t("fz.metaLocation"), value: location },
        { label: t("fz.metaParticipants"), value: b.participants || null },
        { label: t("fz.metaCategory"), value: b.talents?.category || null },
      ],
      person: { name: b.seller_name, website: b.seller_website, roleLabel: t("fz.provider") },
      actions: {
        onConfirmReceipt: bNeedsConfirm ? () => handleConfirmBooking(b.id) : null,
        confirmingReceipt: confirmingBooking === b.id,
        receiptConfirmed: bConfirmed,
        onDispute: bNeedsConfirm ? (note) => handleDisputeBooking(b.id, note) : null,
        disputing: disputingBooking === b.id,
        disputeOpen: bDisputed,
        onChat: (b.seller_id && b.status !== "cancelled") ? () => setShowChatConfirm(b.id) : null,
        canRecommend: !!(canRec && !confirmDone[b.id]),
        recommendationGiven: alreadyRecommended,
        onRecommend: (canRec && !confirmDone[b.id]) ? () => { setConfirmDone(p => ({ ...p, [b.id]: true })); setDetail(null); setRecModal({ sellerId: b.seller_id, sellerName: b.seller_name, bookingId: b.id }); } : null,
        onDownloadReceipt: b.status !== "cancelled" ? async () => {
          try {
            const result = await generateReceipt({
              offerTitle: title,
              sellerName: b.seller_name,
              // BELEG-013: sellerEmail entfernt — generateReceipt.js zeigt
              // immer support@be-hui.com (SSOT, Datenschutz).
              sellerWebsite: b.seller_website || null,
              sellerUsername: b.seller_username || null,
              date: b.selected_date,
              time: timeStr,
              location,
              amountEur: b.amount_eur,
              participants: b.participants,
              bookingId: b.id,
              offerId: b.talent_id,
              offerType: "talent",
            });
            // BUGFIX (2026-08-26): Beleg-Vorschau mit "Teilen"-Button oeffnen
            // (analog NotificationPanel.jsx) — vorher wurde result verworfen.
            if (result) setReceiptPreview(result);
          } catch (e) { console.warn("Receipt failed:", e); }
        } : null,
        onViewProfile: b.talent_id ? () => window.__HUI_OPEN_PROFILE__?.(b.seller_id) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!bookings.length) return <EmptyState text={t("fz.noBookings")} />;

  const total = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.amount_eur || 0), 0);

  return (
    <div>
      <SummaryRow label={t("fz.totalBooked")} value={eur(total)} />
      {bookings.map(b => {
        const title = b.talents?.title || t("fz.talentOffer");
        const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
        const statusChips = [];
        const bConfirmed2 = !!b.buyer_confirmed_at || !!b.buyer_confirmed;
        const bDisputed2 = !!b.dispute_open || b.escrow_status === "disputed";
        const bNeedsConfirm2 = (b.escrow_status === "holding" || (b.status === "confirmed" && !b.escrow_status)) && !bConfirmed2 && !bDisputed2;
        if (b.status === "pending_payment") statusChips.push({ label: t("fz.statusPaymentPending"), color: T.amber, bg: T.amberSoft });
        if (b.status === "confirmed" && !bConfirmed2 && !bDisputed2) statusChips.push({ label: t("fz.statusConfirmed"), color: T.green, bg: T.greenSoft });
        if (b.status === "completed" || (b.escrow_status === "released" && bConfirmed2)) statusChips.push({ label: t("fz.statusReceived"), color: T.green, bg: T.greenSoft });
        if (b.escrow_status === "holding") statusChips.push({ label: t("fz.statusHolding"), color: T.amber, bg: T.amberSoft });
        if (bDisputed2) statusChips.push({ label: t("fz.statusDisputed"), color: T.amber, bg: T.amberSoft });
        if (b.status === "cancelled") statusChips.push({ label: t("fz.statusCancelled"), color: T.red, bg: T.redSoft });
        return (
          <TxCard
            key={b.id}
            image={image}
            title={title}
            subtitle={b.seller_name}
            dateLabel={dt(b.selected_date)}
            amount={b.amount_eur}
            statusChips={statusChips}
            needsAction={bNeedsConfirm2}
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
          onSubmitted={() => {
            // BUGFIX (2026-08-25): sofortige UI-Aktualisierung analog MeineKaeufe.
            if (recModal.bookingId) {
              setRecommendedBookingIds(prev => new Set(prev).add(recModal.bookingId));
            }
            setRecModal(null);
          }}
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
              <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 8 }}>{t("fz.chatWithSeller", { name: b.seller_name })}</div>
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>{t("fz.chatWithSellerDesc")}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowChatConfirm(null)} style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: `1.5px solid ${T.border}`, background: "transparent", color: T.inkSoft, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{t("fz.chatNo")}</button>
                <button
                  onClick={() => {
                    setShowChatConfirm(null);
                    setDetail(null);
                    actions[A.OPEN_CHAT]?.({ recipient: { id: b.seller_id, display_name: b.seller_name, avatar_url: null }, source: S.SYSTEM });
                  }}
                  style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: "none", background: T.teal, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                >{t("fz.chatYes")}</button>
              </div>
            </div>
          </div>
        );
      })()}

      <BelegViewerModal result={receiptPreview} onClose={() => setReceiptPreview(null)} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TAB 4: Wer hat mich gebucht
// ──────────────────────────────────────────────────────────────────────
function WerHatMichGebucht({ userId }) {
  const { t } = useTranslation();
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
      nameMap = Object.fromEntries((profs || []).map(p => [p.id, p.display_name || p.username || t("fz.customer")]));
    }
    setBookings((data || []).map(b => ({ ...b, customer_name: nameMap[b.customer_id] || t("fz.customer") })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const buildTx = (b) => {
    const title = b.talents?.title || t("fz.talentOffer");
    const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
    const timeStr = b.selected_time_slot?.start ? b.selected_time_slot.start + (b.selected_time_slot.end ? " – " + b.selected_time_slot.end : "") : null;

    const statusChips = [];
    if (b.status === "pending_payment") statusChips.push({ label: t("fz.statusPaymentPending"), color: T.amber, bg: T.amberSoft });
    if (b.status === "confirmed") statusChips.push({ label: t("fz.statusConfirmedCheck"), color: T.green, bg: T.greenSoft });
    if (b.status === "completed") statusChips.push({ label: t("fz.statusCompleted"), color: T.green, bg: T.greenSoft });
    if (b.status === "cancelled") statusChips.push({ label: t("fz.statusCancelled"), color: T.red, bg: T.redSoft });

    return {
      id: b.id, kindLabel: t("fz.detailBooked"), title, image,
      amount: b.amount_eur, amountLabel: t("fz.detailIncome"),
      dateLabel: dt(b.selected_date), statusChips,
      meta: [
        { label: t("fz.metaDate"), value: dt(b.selected_date) },
        { label: t("fz.metaTime"), value: timeStr },
        { label: t("fz.metaParticipants"), value: b.participants || null },
        { label: t("fz.metaCategory"), value: b.talents?.category || null },
      ],
      person: { name: b.customer_name, roleLabel: t("fz.customer") },
      actions: {
        onChat: (b.customer_id && b.status !== "cancelled") ? () => setShowChatConfirm(b.id) : null,
        onViewProfile: b.customer_id ? () => window.__HUI_OPEN_PROFILE__?.(b.customer_id) : null,
      },
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!bookings.length) return <EmptyState text={t("fz.noBookedYou")} />;

  const totalEarned = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.amount_eur || 0), 0);

  return (
    <div>
      <SummaryRow label={t("fz.totalEarnings")} value={eur(totalEarned)} color={T.green} />
      {bookings.map(b => {
        const title = b.talents?.title || t("fz.talentOffer");
        const image = Array.isArray(b.talents?.images) && b.talents.images[0]?.url ? b.talents.images[0].url : null;
        const statusChips = [];
        if (b.status === "pending_payment") statusChips.push({ label: t("fz.statusPaymentPending"), color: T.amber, bg: T.amberSoft });
        if (b.status === "confirmed") statusChips.push({ label: t("fz.statusConfirmedCheck"), color: T.green, bg: T.greenSoft });
        if (b.status === "completed") statusChips.push({ label: t("fz.statusCompleted"), color: T.green, bg: T.greenSoft });
        if (b.status === "cancelled") statusChips.push({ label: t("fz.statusCancelled"), color: T.red, bg: T.redSoft });
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
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>{t("fz.chatWithBuyerDesc")}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowChatConfirm(null)} style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: `1.5px solid ${T.border}`, background: "transparent", color: T.inkSoft, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{t("fz.chatNo")}</button>
                <button
                  onClick={() => {
                    setShowChatConfirm(null);
                    setDetail(null);
                    actions[A.OPEN_CHAT]?.({ recipient: { id: b.customer_id, display_name: b.customer_name, avatar_url: null }, source: S.SYSTEM });
                  }}
                  style={{ flex: 1, padding: "14px 0", borderRadius: 13, border: "none", background: T.teal, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                >{t("fz.chatYes")}</button>
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
  const { t } = useTranslation();
  return (
    <div style={{ padding: "40px 0", textAlign: "center", color: T.inkFaint, fontSize: 13 }}>
      {t("fz.loading")}
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
const getTabs = (t) => [
  { id: "kaeufe",   label: t("fz.tabKaeufe") },
  { id: "verkaeufe",label: t("fz.tabVerkaeufe") },
  { id: "buchungen",label: t("fz.tabBuchungen") },
  { id: "gebucht",  label: t("fz.tabGebucht") },
  // "Support"-Tab entfernt (2026-08-15, auf Wunsch von Michael) — in Käufe/Verkäufe
  // nicht benötigt. MeineSupports-Komponente bleibt im Code erhalten
  // (No-Regression-Protection), ist aber hier nicht mehr erreichbar.
];


// ──────────────────────────────────────────────────────────────────────
// TAB 5: Support — Gegebene und erhaltene Unterstützungen
// ──────────────────────────────────────────────────────────────────────
function MeineSupports({ userId }) {
  const { t } = useTranslation();
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
        .select("id, amount, status, payment_type, description, metadata, created_at")
        .eq("user_id", userId)
        .eq("payment_type", "support")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("stripe_payments")
        .select("id, user_id, amount, status, payment_type, description, metadata, created_at")
        // [archived: ambassador commission filter removed]
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
    const statusLabel = item.status === "succeeded" ? t("fz.statusSucceeded") : item.status === "pending" ? t("fz.statusPending") : item.status === "failed" ? t("fz.statusFailed") : item.status;
    const statusColor = item.status === "succeeded" ? T.green : item.status === "pending" ? T.amber : T.red;
    const statusBg    = item.status === "succeeded" ? T.greenSoft : item.status === "pending" ? T.amberSoft : T.redSoft;
    return {
      id: item.id, kindLabel: view === "given" ? t("fz.supportGiven") : t("fz.supportReceived"),
      title: item.description || t("fz.support"),
      image: null,
      amount: item.amount, amountLabel: t("fz.supportAmount"),
      dateLabel: dt(item.created_at),
      statusChips: [{ label: statusLabel, color: statusColor, bg: statusBg }],
      description: typeof msg === "string" ? msg : null,
      person: null,
      actions: {},
    };
  };

  if (loading) return <LoadingPlaceholder />;
  if (!given.length && !received.length)
    return <EmptyState text={t("fz.noSupports")} />;

  const items = view === "given" ? given : received;
  const otherIdKey = view === "given" ? "seller_id" : "user_id";

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
        <EmptyState text={view === "given" ? t("fz.noSupportGiven") : t("fz.noSupportReceived")} />
      )}

      {items.map((item) => {
        const statusLabel = item.status === "succeeded" ? t("fz.statusSucceeded") : item.status === "pending" ? t("fz.statusPending") : item.status === "failed" ? t("fz.statusFailed") : item.status;
        const statusColor = item.status === "succeeded" ? T.green : item.status === "pending" ? T.amber : T.red;
        const statusBg    = item.status === "succeeded" ? T.greenSoft : item.status === "pending" ? T.amberSoft : T.redSoft;
        return (
          <TxCard
            key={item.id}
            image={null}
            title={item.description || t("fz.support")}
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
            {view === "given" ? t("fz.totalGiven") : t("fz.totalReceived")}
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: T.teal, whiteSpace: "nowrap" }}>
            {eur(items.filter(i => i.status === "succeeded").reduce((sum, i) => sum + Number(i.amount), 0))}
          </span>
          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>
            {t("fz.supportCount", { count: items.filter(i => i.status === "succeeded").length })}
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
  const { t } = useTranslation();
  const TABS = getTabs(t);
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
              {t("fz.headerTitle")}
            </div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>
              {t("fz.headerSubtitle")}
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
          padding: "14px 16px calc(88px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
        }}>
          {tab === "kaeufe"    && <MeineKaeufe userId={userId} />}
          {tab === "verkaeufe" && <MeineVerkaeufe userId={userId} />}
          {tab === "buchungen" && <MeineBuchungen userId={userId} />}
          {tab === "gebucht"   && <WerHatMichGebucht userId={userId} />}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
