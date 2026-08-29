import { useTranslation } from '../../hooks/useTranslation.js';
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import {
  HUIWarnIcon, HUIImpactIcon, HUISupportIcon, HUINachrichtIcon,
  HUIProfilIcon, HUIBenachrichtigungIcon,
} from '../../design/icons/HuiSystemIcons.jsx';
import { HUIHeartIcon } from '../../design/icons/HuiInteractionIcons.jsx';
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { generateReceipt } from "../../lib/generateReceipt.js";
import BelegViewerModal from "./BelegViewerModal.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { formatDateDE } from "../../lib/formatters.js";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

// ══════════════════════════════════════════════════════════════
// NOTIFICATION PANEL  — Side-Drawer, via createPortal(document.body) gerendert
// RESONANZ-001 (2026-08-08): Portal-Pflicht (siehe footer-navbar-zindex.md) —
// vorher fehlte createPortal, wodurch das Panel in einem Ancestor-Stacking-
// Context der Kopfzeile gefangen war (Bug: Panel erschien als kleine Box
// statt Vollbild-Drawer, kein sichtbares Backdrop).
// ══════════════════════════════════════════════════════════════

// ── Design-Tokens ─────────────────────────────────────────────
const T = {
  bg:       "#f8f7f4",
  bgCard:   "#ffffff",
  border:   "rgba(26,26,24,0.10)",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.08)",
  tealMid:  "rgba(14,196,184,0.22)",
  ink:      "#1a1a18",
  inkSoft:  "#555550",
  inkFaint: "#999990",
  r12:      12,
  r99:      99,
};

function fmtTime(iso, t) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1)  return t ? t("common.justNow") : "gerade eben";
  if (diff < 60) return t ? t("common.minsAgoShort", {n: diff}) : `vor ${diff} Min`;
  const h = Math.floor(diff / 60);
  if (h < 24)   return t ? t("common.hoursAgoShort", {n: h}) : `vor ${h} Std`;
  const days = Math.floor(h / 24);
  if (days < 7) return t ? t("common.daysAgoShort", {n: days}) : `vor ${days} Tagen`;
  return formatDateDE(d, { day:"numeric", month:"short" });
}

// ── Universelles Inline-Modal (kein createPortal!) ────────────────────────────
function InlineModal({ onClose, icon, title, subtitle, accentColor = "#0EC4B8", children, btnLabel }) {
  const { t } = useTranslation();
  const resolvedBtnLabel = btnLabel || t("notif.understood");
  if (!btnLabel) btnLabel = t("notif.understood");
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:2147483647,
        background:"rgba(0,0,0,0.65)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:20, WebkitTapHighlightColor:"transparent",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:20, padding:"24px 20px 20px",
          maxWidth:360, width:"100%",
          boxShadow:"0 20px 60px rgba(0,0,0,0.30)",
          maxHeight:"80vh", overflowY:"auto",
        }}
      >
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:40, marginBottom:8, lineHeight:1 }}>{icon}</div>
          <div style={{ fontSize:17, fontWeight: 600, color:"#1a1a18" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize:12, fontWeight:600, color:accentColor, marginTop:4 }}>{subtitle}</div>
          )}
        </div>
        {children}
        <button
          onClick={onClose}
          style={{
            width:"100%", padding:"14px", borderRadius:99,
            background:accentColor, border:"none", color:"#fff",
            fontSize:15, fontWeight: 600, cursor:"pointer",
            fontFamily:"inherit", marginTop:4,
          }}
        >
          {btnLabel}
        </button>
      </div>
    </div>
  );
}

// ── NotifCard ────────────────────────────────────────────────────────────────
function getMetaMap(t) {
  return {
  work_sensitive:         { emoji:"⚠️", label:t("notif.metaLabel.workSensitive")        },
  work_deleted:           { emoji:"🗑", label:t("notif.metaLabel.workDeleted")          },
  meldung_aufgehoben:     { emoji:"✅", label:t("notif.metaLabel.meldungAufgehoben")     },
  new_follower:           { emoji:<HUIProfilIcon size={18}/>, label:t("notif.metaLabel.newFollower")         },
  new_booking:            { emoji:"📅", label:t("notif.metaLabel.newBooking")           },
  // RESONANZ-BUCHUNG-001 (2026-08-08): Talent- + Erlebnis-Buchungen
  talent_booking_paid:        { emoji:"📅", label:t("notif.metaLabel.talentBookingPaid")        },
  talent_booking_confirmed:   { emoji:"📅", label:t("notif.metaLabel.talentBookingConfirmed")   },
  talent_booking_cancelled:   { emoji:"⚠️", label:t("notif.metaLabel.talentBookingCancelled")   },
  experience_booking_paid:      { emoji:"🌿", label:t("notif.metaLabel.experienceBookingPaid")      },
  experience_booking_confirmed: { emoji:"🌿", label:t("notif.metaLabel.experienceBookingConfirmed") },
  experience_booking_cancelled: { emoji:"⚠️", label:t("notif.metaLabel.experienceBookingCancelled") },
  new_order:              { emoji:"🎨", label:t("notif.metaLabel.newOrder")        },
  // MERKEN.6 (2026-07-08): zusammengefasste Merken-Digests (taeglich/
  // woechentlich), NIE eine Notification pro einzelnem Speichervorgang.
  save_digest:            { emoji:"🔖", label:t("notif.metaLabel.saveDigest") },
  // KOMMENTAR.1 (2026-07-09): Kommentar/Antwort auf eigenen Beitrag.
  comment:                { emoji:"💬", label:t("notif.metaLabel.comment")        },
  comment_reply:          { emoji:"💬", label:t("notif.metaLabel.commentReply") },
  // RESONANZ.3 (2026-07-16): Resonanz auf eigenen Beitrag.
  resonanz:               { emoji:<HUIHeartIcon size={18}/>,            label:t("notif.metaLabel.resonanz")               },
  like:                   { emoji:"✦",  label:t("notif.metaLabel.like")       },
  // RESONANZ.5 (2026-07-30): Save + Share Notifications
  save:                   { emoji:"🔖", label:t("notif.metaLabel.save")    },
  share:                  { emoji:"↗",  label:t("notif.metaLabel.share")        },
  order_confirmed:        { emoji:"✓",   label:t("notif.metaLabel.orderConfirmed")     },
  impact_project_submitted:{ emoji:"💚",  label:t("notif.metaLabel.impactProjectSubmitted")  },
  impact_project_deleted:  { emoji:"🗑",  label:t("notif.metaLabel.impactProjectDeleted")     },
  impact_project_completed:{ emoji:"💚",  label:t("notif.metaLabel.impactProjectCompleted")           },
  work_flagged:            { emoji:"⚠️", label:t("notif.metaLabel.workFlagged")              },
  content_deleted:         { emoji:"🗑",  label:t("notif.metaLabel.contentDeleted")             },
  content_approved:        { emoji:"✅",  label:t("notif.metaLabel.contentApproved")          },
    default:                { emoji:<HUIBenachrichtigungIcon size={18}/>, label:t("notif.metaLabel.notification")       },
  };
}

function getMeta(type, t) { const m = getMetaMap(t); return m[type] || m.default; }


function parseMeta(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}


// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSELLES RESONANZ-MODAL-SYSTEM  (RESONANZ.4 — 2026-07-22)
// Jede Nachricht öffnet ein Modal mit allen Details.
// Kein createPortal nötig (zIndex 2147483647 übertrifft alles).
// ══════════════════════════════════════════════════════════════════════════════

// ── Universal Detail-Modal ────────────────────────────────────────────────────
function DetailModal({ n, onClose, onAction }) {
  const { t } = useTranslation();
  const md = parseMeta(n.metadata);
  const meta = getMeta(n.type, t);
  // BELEG-006 (2026-08-14): Beleg-Vorschau nach Speichern -- ersetzt das automatische
  // Share-Sheet, siehe BelegViewerModal.jsx fuer die Begruendung.
  const [receiptPreview, setReceiptPreview] = useState(null);

  // ── BACK-BUTTON-STACK-FIX (2026-08-15, Michael-Report) ──────────────────
  // Vorher: Beim Klick auf "Werk ansehen" wurde dieses Modal SOFORT via
  // onClose() geschlossen, danach das Panel selbst (siehe NotificationButton.
  // handleAction). Die System-Zurueck-Taste hatte danach nichts mehr zum
  // Zurueckkehren -- sie sprang direkt aus dem gesamten Resonanzzentrum.
  // Fix: Dieses Modal registriert sich jetzt selbst im globalen Back-Button-
  // Stack (wie jedes andere Modal/Sheet in der App). "Werk ansehen" schliesst
  // dieses Modal NICHT mehr aktiv -- es bleibt "logisch offen" (State bleibt
  // erhalten), wird aber ausgeblendet solange eine Werk/Erlebnis/Talent-
  // Vorschau (ContentPreviewSheet) darueber offen ist (verhindert doppelte,
  // zu dunkle Backdrops). Schliesst der Nutzer die Vorschau (X oder System-
  // Zurueck-Taste), erscheint dieses Modal automatisch wieder -- exakt die
  // "Auswahl, wo man Werk ansehen anklicken kann", die Michael zurueck will.
  useModalRegistration(true, onClose, "NotificationDetailModal");
  const { item: previewItem } = useContentPreview();

  // ── Typ-spezifische Konfiguration ─────────────────────────────────────────
  const cfg = (() => {
    const nType = n.type || "";

    // Ablehnungen
    if (nType.includes("_rejected") || nType === "content_rejected") {
      const typeMap = {
        talent_rejected:         { label:"Talent",           emoji:"⭐" },
      };
      const tm = typeMap[nType] || { label:t("notif.meta.entry"), emoji:"📋" };
      const reason = md.rejection_reason || md.reason
        || (n.body?.match(/Grund[:：]\s*(.+)/s)?.[1]?.trim())
        || n.body || t("notif.meta.noReason");
      const entryTitle = md.entry_title || md.project_name || md.werk_title || t("notif.meta.yourEntry", {type: tm.label});
      // entity_type-Mapping: impact_project_rejected → "project"
      const rejectedEntityType = n.entity_type === "impact_project" ? "project" : (n.entity_type || null);
      // Werk/Erlebnis/Talent: nur wenn entity_type=work|experience|talent (nicht gelöscht)
      const canPreviewRejected = rejectedEntityType && ["work","experience","talent"].includes(rejectedEntityType);
      return {
        accentColor: "#DC2626",
        headerIcon: "❌",
        headerTitle: t("notif.meta.entryRejected", {type: tm.label}),
        headerSubtitle: `„${entryTitle}"`,
        blocks: [
          { type:"label-text", label:t("notif.meta.adminMessage"), text: reason, color:"#DC2626", bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.22)" },
          { type:"info", text: t("notif.meta.reviseResubmit") },
        ],
        entityId:   canPreviewRejected ? (n.entity_id || md.werk_id || null) : null,
        entityType: canPreviewRejected ? rejectedEntityType : null,
        actionLabel: canPreviewRejected ? t("notif.meta.entryViewAction", {type: tm.label}) : null,
      };
    }

    // Freigaben / Annahmen
    if (nType.includes("_approved")) {
      const approvalMap = {
        talent_approved:         { label:"Talent",         emoji:"⭐" },
      };
      const am = approvalMap[nType] || { label:"Inhalt", emoji:"✅" };
      const entryTitle = md.entry_title || md.project_name || md.werk_title || n.title || `Dein ${am.label}`;
      const msg = md.message || md.admin_note || n.body || t("notif.meta.congrats");
      // entity_type-Mapping für openRef: impact_project_approved → "project"
      const approvedEntityType = n.entity_type === "impact_project" ? "project" : (n.entity_type || null);
      return {
        accentColor: "#0EC4B8",
        headerIcon: "✅",
        headerTitle: `${am.label} freigegeben`,
        headerSubtitle: `„${entryTitle}"`,
        blocks: [
          { type:"label-text", label:"Nachricht", text: msg, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
        // entity_id aus DB (alle work/experience/impact haben sie)
        entityId:   n.entity_id   || md.werk_id   || md.entry_id   || null,
        entityType: approvedEntityType,
        actionUrl:  n.action_url  || md.action_url || null,
        actionLabel: "Direkt ansehen →",
      };
    }

    // Support
    if (nType === "support_ticket_reply" || nType === "support_ticket") {
      const text     = md.admin_reply || md.message || md.body || n.body || "(Keine Nachricht)";
      const subject  = md.subject || n.title || "Support-Antwort";
      const ticketId = md.ticket_id || md.ticket_number || "";
      return {
        accentColor: "#0EC4B8",
        headerIcon: "🎧",
        headerTitle: "Support hat geantwortet",
        headerSubtitle: ticketId ? `Ticket #${ticketId}` : subject,
        blocks: [
          { type:"label-text", label:"Nachricht vom Support", text, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
      };
    }

    // Admin-Broadcast
    if (nType === "admin_broadcast" || nType === "broadcast") {
      const text  = md.message || md.body || n.body || "(Keine Nachricht)";
      const title = md.title   || n.title || "Nachricht vom Admin";
      return {
        accentColor: "#0EC4B8",
        headerIcon: "📢",
        headerTitle: title,
        headerSubtitle: "Nachricht vom Admin",
        blocks: [
          { type:"label-text", label:"Inhalt", text, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
      };
    }

    // HUI Share (interne Weiterleitungen)
    if (nType === "share") {
      const sharePost  = md.post_title || md.entity_title || null;
      const shareType  = md.post_type || md.entity_type || n.entity_type || "";
      const typeLabel  = {
        work:"Werk", talent:"Talent-Angebot", moment:"Beitrag", beitrag:"Beitrag",
        experience:t("notif.meta.experience"), project:t("notif.meta.project"), event:t("notif.meta.event"),
      }[shareType] || t("notif.meta.content");
      // Unterscheide: hat diese Notif entity_id? → Autor-Sicht (Beitrag geteilt)
      //               ohne entity_id → Empfänger-Sicht (jemand schickt dir was)
      const isAuthorView = !!(n.entity_id || md.post_id);
      if (isAuthorView) {
        return {
          accentColor: "#0EC4B8",
          headerIcon: "↗",
          headerTitle: n.title || t("notif.meta.someoneShared"),
          headerSubtitle: sharePost ? `„${sharePost}"` : null,
          blocks: [],
          entityId:   n.entity_id || md.post_id || null,
          entityType: n.entity_type || md.post_type || null,
          actionLabel: t("notif.meta.openAction", {type: typeLabel}),
        };
      }
      // Legacy: Empfänger-Sicht
      const senderName = md.sender_name || t("notif.meta.someone");
      const contentTitle = sharePost || n.body || t("notif.meta.contentGeneric");
      return {
        accentColor: "#0EC4B8",
        headerIcon: "↗",
        headerTitle: t("notif.meta.showContent", {sender: senderName}),
        headerSubtitle: typeLabel ? `${typeLabel}: „${contentTitle}"` : contentTitle,
        blocks: [
          md.message && { type:"label-text", label:"Nachricht", text: md.message, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ].filter(Boolean),
        actionUrl: n.action_url || md.entity_url || null,
        actionLabel: t("notif.meta.viewAction", {type: typeLabel || t("notif.meta.content")}),
        entityId:   n.entity_id   || md.entity_id   || null,
        entityType: n.entity_type || md.entity_type || shareType || null,
      };
    }

    // Meldung / Sensitiver Inhalt
    if (nType === "work_sensitive" || nType === "content_flagged") {
      return {
        accentColor: "#F59E0B",
        headerIcon: "⚠️",
        headerTitle: t("notif.contentFlagged"),
        headerSubtitle: md.entry_title || n.title || null,
        blocks: [
          { type:"label-text", label:t("notif.meta.details"), text: md.reason || n.body || t("notif.meta.contentReported"), color:"#F59E0B", bg:"rgba(245,158,11,0.06)", border:"rgba(245,158,11,0.22)" },
        ],
      };
    }

    // Meldung aufgehoben / Inhalt wiederhergestellt
    if (nType === "meldung_aufgehoben" || nType === "content_restored") {
      return {
        accentColor: "#0EC4B8",
        headerIcon: "✅",
        headerTitle: "Meldung aufgehoben",
        headerSubtitle: md.entry_title || n.title || null,
        blocks: [
          { type:"label-text", label:"Details", text: n.body || "Dein Inhalt ist wieder sichtbar.", color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
      };
    }

    // Werk entfernt
    if (nType === "work_deleted") {
      return {
        accentColor: "#DC2626",
        headerIcon: "🗑",
        headerTitle: "Werk entfernt",
        headerSubtitle: md.entry_title || n.title || null,
        blocks: [
          { type:"label-text", label:t("notif.reason"), text: md.reason || n.body || t("notif.workRemovedAdmin"), color:"#DC2626", bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.22)" },
        ],
      };
    }

    // ── RESONANZ-BUCHUNG-001 + BELEG-001 (2026-08-08): Strukturiertes
//    Buchungsdetail mit echten Daten, Link zum Angebot, Kontaktdaten
//    (E-Mail/Webseite wenn vorhanden), Chat-Option + Beleg-Download ──
    if (["talent_booking_paid","talent_booking_confirmed","experience_booking_paid","experience_booking_confirmed"].includes(nType)) {
      const isSellerView = nType === "talent_booking_paid" || nType === "experience_booking_paid";
      const isTalent = nType.startsWith("talent_booking");
      const otherUserId = md.other_user_id || null;
      const otherUserLabel = isSellerView
        ? (md.buyer_name || "Der Kunde")
        : (md.seller_name || "Der Anbieter");
      const offerTitle = md.offer_title || (md.item_titles || []).join(", ") || "dein Angebot";
      const dateStr = md.date
        ?formatDateDE(new Date(md.date), { weekday:"short", day:"numeric", month:"long" })
        : null;

      // BELEG-001: Kontaktdaten nur in der Kaeufer-Sicht anzeigen
      const sellerEmail = !isSellerView ? (md.seller_email || null) : null;
      const sellerWebsite = !isSellerView ? (md.seller_website || null) : null;
      const offerId = md.offer_id || null;
      const offerType = md.offer_type || (isTalent ? "talent" : "experience");

      return {
        accentColor: "#22C55E",
        headerIcon: isTalent ? "📅" : "🌿",
        headerTitle: isSellerView ? t("notif.meta.newBookingSeller") : t("notif.meta.bookingConfirmed2"),
        headerSubtitle: `„${offerTitle}"`,
        blocks: [
          { type:"stat", label: isSellerView ? "Gebucht von" : "Gebucht bei", value: otherUserLabel },
          { type:"stat", label:"Was", value: offerTitle },
          dateStr && { type:"stat", label:"Wann", value: md.time ? `${dateStr}, ${md.time} Uhr` : dateStr },
          md.location && { type:"stat", label:"Wo", value: md.location },
          md.amount_eur != null && { type:"stat", label:"Betrag", value: `${Number(md.amount_eur).toFixed(2).replace(".", ",")} €` },
          md.participants > 1 && { type:"stat", label:"Teilnehmer", value: String(md.participants) },
          // Kontaktdaten (nur Kaeufer-Sicht, nur wenn vorhanden)
          sellerEmail && { type:"label-text", label:"E-Mail", text: sellerEmail, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
          sellerWebsite && { type:"label-text", label:"Webseite", text: sellerWebsite, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ].filter(Boolean),
        chatUserId: otherUserId,
        chatUserName: otherUserLabel,
        // BELEG-001: Beleg-Button nur in der Kaeufer-Sicht
        receiptData: !isSellerView ? {
          offerTitle,
          sellerName: md.seller_name || null,
          sellerEmail,
          sellerWebsite,
          date: md.date || null,
          time: md.time || null,
          location: md.location || null,
          amountEur: md.amount_eur || null,
          participants: md.participants || null,
          bookingId: md.booking_id || n.entity_id || null,
          offerId,
          offerType,
        } : null,
        // Link zum Angebot (nur Kaeufer-Sicht)
        offerLinkId: !isSellerView ? offerId : null,
        offerLinkType: !isSellerView ? offerType : null,
        actionLabel: null,
      };
    }

    // Neue Bestellung (Verkäufer-Sicht) — BELEG-001: strukturiert wie Buchungen
    if (nType === "new_order" || nType === "new_booking" || nType === "purchase") {
      const offerTitle = md.offer_title || (md.item_titles || []).join(", ") || md.werk_title || md.title || "dein Werk";
      const buyerName = md.buyer_name || "Jemand";
      const amount = md.amount_eur != null ? `${Number(md.amount_eur).toFixed(2).replace(".", ",")} €` : null;
      const workId = md.work_id || n.entity_id || null;
      return {
        accentColor: "#0EC4B8",
        headerIcon: "🛍",
        headerTitle: n.title || "Neue Bestellung 🎉",
        headerSubtitle: `„${offerTitle}"`,
        blocks: [
          { type:"stat", label:"Gekauft von", value: buyerName },
          { type:"stat", label:"Was", value: offerTitle },
          amount && { type:"stat", label:"Betrag", value: amount },
        ].filter(Boolean),
        chatUserId: md.other_user_id || null,
        chatUserName: buyerName,
        entityId: workId,
        entityType: "work",
        actionLabel: t("np.viewWerk"),
      };
    }

    // Zahlung bestätigt / Unterstützung bestätigt
    if (nType === "payment_confirmed" || nType === "support_confirmed") {
      const amount = md.amount_eur ? `${Number(md.amount_eur).toFixed(2)} €` : "";
      return {
        accentColor: "#0EC4B8",
        headerIcon: "✓",
        headerTitle: n.title || t("notif.meta.paymentConfirmed"),
        headerSubtitle: null,
        blocks: [
          amount && { type:"stat", label:"Betrag", value: amount },
          { type:"label-text", label:"Details", text: n.body || "Deine Zahlung war erfolgreich.", color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ].filter(Boolean),
      };
    }

    // Follower
    if (nType === "new_follower" || nType === "follow" || nType === "follow_request") {
      return {
        accentColor: "#0EC4B8",
        headerIcon: "✦",
        headerTitle: n.title || "Neuer Follower",
        headerSubtitle: null,
        blocks: [
          { type:"label-text", label:"Details", text: n.body || "Jemand folgt dir jetzt.", color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
      };
    }

    // Kommentar / Antwort
    if (nType === "comment" || nType === "comment_reply") {
      const cmEntityId   = md.post_id   || n.entity_id   || null;
      const cmEntityType = md.post_type || n.entity_type || null;
      const typeLabel = { work:"Werk", moment:"Beitrag", experience:"Erlebnis" }[cmEntityType] || "Beitrag";
      return {
        accentColor: "#0EC4B8",
        headerIcon: "💬",
        headerTitle: n.title || (nType === "comment_reply" ? "Antwort auf deinen Kommentar" : "Neuer Kommentar"),
        headerSubtitle: cmEntityType ? `auf deinen ${typeLabel}` : null,
        blocks: [
          md.comment_text && { type:"label-text", label:"Kommentar", text: md.comment_text, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
          !md.comment_text && n.body && { type:"label-text", label:"Details", text: n.body, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ].filter(Boolean),
        entityId:   cmEntityId,
        entityType: cmEntityType,
        actionLabel: t("notif.meta.openAction", {type: typeLabel}),
      };
    }

    // Resonanz / Like
    if (nType === "resonanz" || nType === "like") {
      // body enthält oft den Titel des Werks/Beitrags — als Subtitle zeigen
      const resonanzTitle = n.body?.replace(/^["„“]+|["“”]+$/g, "").trim() || null;
      const typeLabel = { work:"Werk", moment:"Beitrag", experience:"Erlebnis" }[n.entity_type] || "Inhalt";
      return {
        accentColor: "#0EC4B8",
        headerIcon: "♡",
        headerTitle: n.title || "Jemand mag deinen Inhalt",
        headerSubtitle: resonanzTitle ? `„${resonanzTitle}"` : null,
        blocks: [],
        entityId:   n.entity_id   || md.post_id   || null,
        entityType: n.entity_type || md.post_type || null,
        actionLabel: t("notif.meta.openAction", {type: typeLabel}),
      };
    }

    // Merken-Digest
    // Beitrag gespeichert (RESONANZ.5 — Autor bekommt Notification wenn jemand speichert)
    if (nType === "save") {
      const saveTitle  = md.post_title || n.body?.replace(/^[""]+|[""]+$/g,"").trim() || null;
      const saveType   = md.post_type || n.entity_type || null;
      const typeLabel  = { work:"Werk", moment:"Beitrag", experience:"Erlebnis", beitrag:"Beitrag" }[saveType] || "Beitrag";
      return {
        accentColor: "#F59E0B",
        headerIcon: "🔖",
        headerTitle: n.title || "Jemand hat deinen Beitrag gespeichert",
        headerSubtitle: saveTitle ? `„${saveTitle}"` : null,
        blocks: [],
        entityId:   n.entity_id || md.post_id || null,
        entityType: n.entity_type || md.post_type || null,
        actionLabel: t("notif.meta.openAction", {type: typeLabel}),
      };
    }

    if (nType === "save_digest") {
      return {
        accentColor: "#0EC4B8",
        headerIcon: "🔖",
        headerTitle: n.title || "Gemerkt-Zusammenfassung",
        headerSubtitle: null,
        blocks: [
          { type:"label-text", label:"Details", text: n.body || md.message || "", color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
      };
    }


    // ── Bestellung bestätigt (Käufer-Seite) — BELEG-001: voll strukturiert ──
    if (nType === "order_confirmed") {
      const offerTitle = md.offer_title || (md.item_titles || []).join(", ") || null;
      const sellerName = md.seller_name || "Der Anbieter";
      const amount = md.amount_eur != null ? `${Number(md.amount_eur).toFixed(2).replace(".", ",")} €` : null;
      const workId = md.work_id || n.entity_id || null;
      return {
        accentColor: "#0EC4B8",
        headerIcon: "✓",
        headerTitle: n.title || t("notif.meta.supportConfirmed"),
        headerSubtitle: offerTitle ? `„${offerTitle}"` : null,
        blocks: [
          { type:"stat", label:"Gekauft bei", value: sellerName },
          offerTitle && { type:"stat", label:"Was", value: offerTitle },
          amount && { type:"stat", label:"Betrag", value: amount },
        ].filter(Boolean),
        chatUserId: md.other_user_id || null,
        chatUserName: sellerName,
        entityId: workId,
        entityType: "work",
        actionLabel: t("np.viewWerk"),
        // BELEG-001: Beleg-Download für den Käufer
        receiptData: {
          offerTitle,
          sellerName: md.seller_name || null,
          sellerEmail: md.seller_email || null,
          sellerWebsite: md.seller_website || null,
          amountEur: md.amount_eur || null,
          offerId: workId,
          offerType: "werk",
          bookingId: md.order_id || n.entity_id || null,
        },
        // BELEG-005 (2026-08-14): offerLinkId/offerLinkType hier ENTFERNT — Michael-Feedback:
        // "Werk ansehen" UND "Angebot ansehen" standen doppelt im selben Panel und
        // zeigten exakt auf dasselbe Ziel (workId + "werk", identisch zu entityId/entityType
        // oben, die bereits den "Werk ansehen →"-Button rendern). Ein Button reicht.
      };
    }

    // ── Impact-Projekt vollständig finanziert (BELEG-001) ───────────────────
    if (nType === "impact_project_completed") {
      const projectName = md.project_name || n.title || "Dein Projekt";
      const funded = md.funded_amount != null ? `${Number(md.funded_amount).toFixed(2).replace(".", ",")} €` : null;
      const goal = md.goal != null ? `${Number(md.goal).toFixed(2).replace(".", ",")} €` : null;
      return {
        accentColor: "#22C55E",
        headerIcon: "💚",
        headerTitle: n.title || t("notif.meta.projectFunded"),
        headerSubtitle: `„${projectName}"`,
        blocks: [
          funded && { type:"stat", label:"Erreicht", value: funded },
          goal && { type:"stat", label:"Ziel", value: goal },
          { type:"info", text: t("notif.meta.projectFundedBody") },
        ].filter(Boolean),
        entityId: md.project_id || n.entity_id || null,
        entityType: "project",
        actionLabel: "Projekt ansehen →",
      };
    }

    // ── Impact-Projekt eingereicht ─────────────────────────────────────────
    if (nType === "impact_project_submitted") {
      const projectName = md.project_name || md.entry_title || n.title || "Dein Projekt";
      return {
        accentColor: "#0EC4B8",
        headerIcon: "💚",
        headerTitle: "Herzensprojekt eingereicht",
        headerSubtitle: `„${projectName}"`,
        blocks: [
          { type:"label-text", label:t("notif.meta.status"), text: n.body || t("notif.meta.adminReview"), color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
        actionUrl: n.action_url || "/impact",
        actionLabel: "Zum Impactbereich →",
      };
    }

    // ── Impact-Projekt gelöscht ────────────────────────────────────────────
    if (nType === "impact_project_deleted") {
      const projectName = md.project_name || md.entry_title || n.title || "Dein Projekt";
      const reason = md.reason || md.rejection_reason || n.body || "Dein Projekt wurde entfernt.";
      return {
        accentColor: "#DC2626",
        headerIcon: "🗑",
        headerTitle: "Herzensprojekt entfernt",
        headerSubtitle: `„${projectName}"`,
        blocks: [
          { type:"label-text", label:t("notif.reason"), text: reason, color:"#DC2626", bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.22)" },
          { type:"info", text: t("notif.contactSupport") },
        ],
      };
    }

    // ── Inhalt gemeldet (work_flagged — SADB-Meldung) ─────────────────────
    if (nType === "work_flagged" || nType === "content_flagged") {
      const entryTitle = md.entry_title || md.work_title || n.body?.match(/„(.+?)"/)?.[1] || "";
      return {
        accentColor: "#F59E0B",
        headerIcon: "⚠️",
        headerTitle: t("notif.contentFlagged"),
        headerSubtitle: entryTitle ? `„${entryTitle}"` : null,
        blocks: [
          { type:"label-text", label:t("notif.meta.details"), text: n.body || t("notif.meta.contentReported"), color:"#F59E0B", bg:"rgba(245,158,11,0.06)", border:"rgba(245,158,11,0.22)" },
        ],
      };
    }

    // ── Inhalt gelöscht (content_deleted) ─────────────────────────────────
    if (nType === "content_deleted") {
      const entryTitle = md.entry_title || n.body?.match(/„(.+?)"/)?.[1] || "";
      const entityLabel = { work:"Werk", experience:"Erlebnis", talent:"Talent", moment:"Beitrag" }[n.entity_type] || "Inhalt";
      return {
        accentColor: "#DC2626",
        headerIcon: "🗑",
        headerTitle: t("notif.meta.contentDeleted2", {type: entityLabel}),
        headerSubtitle: entryTitle ? `„${entryTitle}"` : null,
        blocks: [
          { type:"label-text", label:"Details", text: md.reason || n.body || "Dein Inhalt wurde entfernt.", color:"#DC2626", bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.22)" },
        ],
      };
    }

    // ── Moment entfernt durch Admin ──────────────────────────────────────
    if (nType === "moment_removed") {
      const reason = md.reason || n.body || t("notif.momentAdminRemoved");
      const preview = md.moment_preview || md.entry_title || "";
      return {
        accentColor: "#DC2626",
        headerIcon: "🗑",
        headerTitle: t("notif.momentRemovedAdmin"),
        headerSubtitle: preview ? `„${preview.substring(0,60)}"` : null,
        blocks: [
          { type:"label-text", label:t("notif.meta.adminReason"), text: reason, color:"#DC2626", bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.22)" },
          { type:"info", text: t("notif.contactSupport") },
        ],
      };
    }

    // ── Moment gemeldet (1 Meldung) ──────────────────────────────────────
    if (nType === "moment_reported") {
      const preview = md.moment_preview || md.entry_title || "";
      return {
        accentColor: "#F59E0B",
        headerIcon: "⚠️",
        headerTitle: t("notif.momentFlagged"),
        headerSubtitle: preview ? `„${preview.substring(0,60)}"` : null,
        blocks: [
          { type:"label-text", label:t("notif.meta.hint"), text: n.body || t("notif.meta.momentReported"), color:"#F59E0B", bg:"rgba(245,158,11,0.06)", border:"rgba(245,158,11,0.22)" },
          { type:"info", text: t("notif.meta.noActionNeeded") },
        ],
      };
    }

    // ── Moment durch mehrfache Meldungen entfernt ──────────────────────────
    if (nType === "moment_reported_removed") {
      const reason = md.reason || n.body || t("notif.momentReportedRemoved");
      const preview = md.moment_preview || md.entry_title || "";
      return {
        accentColor: "#DC2626",
        headerIcon: "🚫",
        headerTitle: t("notif.momentRemovedReports"),
        headerSubtitle: preview ? `„${preview.substring(0,60)}"` : null,
        blocks: [
          { type:"label-text", label:t("notif.reason"), text: reason, color:"#DC2626", bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.22)" },
          { type:"info", text: t("notif.momentAutoRemoved") },
        ],
      };
    }

    // ── Moment / Talent / Erlebnis / Projekt aktualisiert ─────────────────
    if (nType === "moment_updated" || nType === "talent_updated" || nType === "experience_updated" || nType === "project_updated") {
      const labelMap = { moment_updated:"Moment", talent_updated:"Talent-Angebot", experience_updated:"Erlebnis", project_updated:"Projekt" };
      const emojiMap = { moment_updated:"✏️", talent_updated:"⭐", experience_updated:"🌿", project_updated:"📌" };
      const entityLabel = labelMap[nType];
      const entryTitle = md.entry_title || md.title || "";
      return {
        accentColor: "#6366F1",
        headerIcon: emojiMap[nType],
        headerTitle: `${entityLabel} aktualisiert`,
        headerSubtitle: entryTitle ? `„${entryTitle}"` : null,
        blocks: [
          { type:"label-text", label:"Details", text: md.message || n.body || `Dein ${entityLabel} wurde aktualisiert.`, color:"#6366F1", bg:"rgba(99,102,241,0.06)", border:"rgba(99,102,241,0.22)" },
        ],
        entityId:   n.entity_id   || null,
        entityType: n.entity_type || null,
        actionLabel: `${entityLabel} ansehen →`,
      };
    }

    // ── Inhalt freigegeben (content_approved — Generic für experience etc.) ─
    if (nType === "content_approved") {
      const entryTitle = md.entry_title || n.body?.match(/„(.+?)"/)?.[1] || "";
      const entityLabel = { work:"Werk", experience:"Erlebnis", talent:"Talent", moment:"Beitrag" }[n.entity_type] || "Inhalt";
      return {
        accentColor: "#0EC4B8",
        headerIcon: "✅",
        headerTitle: `${entityLabel} freigegeben`,
        headerSubtitle: entryTitle ? `„${entryTitle}"` : null,
        blocks: [
          { type:"label-text", label:"Details", text: n.body || "Dein Inhalt ist jetzt live!", color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
        ],
        entityId:   n.entity_id   || null,
        entityType: n.entity_type || null,
        actionLabel: "Inhalt ansehen →",
      };
    }

    // ── BANKDATEN-LINK (2026-08-16): "Bankdaten fehlen" — Zahlung
    //    freigegeben aber Verkäufer hat keine Bankdaten hinterlegt.
    //    Button öffnet direkt Settings → Bankdaten-Modal. ──
    if (nType === "payout_bank_details_needed") {
      return {
        accentColor: "#F59E0B",
        headerIcon: "🏦",
        headerTitle: n.title || "Zahlung freigegeben — Bankdaten fehlen",
        headerSubtitle: null,
        blocks: [
          { type:"label-text", label:t("notif.meta.message"), text: n.body || t("notif.meta.bankDataHint"), color:"#F59E0B", bg:"rgba(245,158,11,0.06)", border:"rgba(245,158,11,0.22)" },
        ],
        bankdatenLink: true,
      };
    }

    // ── buyer_confirmed (Zahlung erfolgreich überwiesen) — Info nur ──
    if (nType === "buyer_confirmed") {
      return {
        accentColor: "#22C55E",
        headerIcon: "✓",
        headerTitle: n.title || "Zahlung freigegeben ✓",
        headerSubtitle: null,
        blocks: [
          { type:"label-text", label:t("notif.meta.details"), text: n.body || t("notif.meta.payoutReleased"), color:"#22C55E", bg:"rgba(34,197,94,0.06)", border:"rgba(34,197,94,0.22)" },
        ],
      };
    }

        // System / Info / Default
    return {
      accentColor: "#0EC4B8",
      headerIcon: typeof meta.emoji === "string" ? meta.emoji : "✦",
      headerTitle: n.title || meta.label || "Benachrichtigung",
      headerSubtitle: null,
      blocks: [
        n.body && { type:"label-text", label:"Details", text: n.body, color:"#0EC4B8", bg:"rgba(14,196,184,0.06)", border:"rgba(14,196,184,0.22)" },
      ].filter(Boolean),
      actionUrl: n.action_url || null,
    };
  })();

  const hasEntityAction = cfg.entityId && cfg.entityType;
  const hasUrlAction    = cfg.actionUrl;

  // Ausblenden solange eine Entity-Vorschau (Werk/Erlebnis/Talent) darueber
  // offen ist -- siehe Kommentar oben bei useModalRegistration. Modal bleibt
  // im React-Tree (State/Registration lebt weiter), rendert aber nichts.
  if (previewItem) return null;

  return (
    <>
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:2147483647,
        background:"rgba(0,0,0,0.65)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"20px 16px",
        WebkitTapHighlightColor:"transparent",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:20, padding:"24px 20px 20px",
          maxWidth:380, width:"100%",
          boxShadow:"0 20px 60px rgba(0,0,0,0.30)",
          maxHeight:"82vh", overflowY:"auto",
          display:"flex", flexDirection:"column", gap:0,
        }}
      >
        {/* ── Header ── */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{
            width:52, height:52, borderRadius:"50%", margin:"0 auto 12px",
            background: cfg.accentColor + "15",
            border:`2px solid ${cfg.accentColor}30`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24,
          }}>
            {cfg.headerIcon}
          </div>
          <div style={{ fontSize:17, fontWeight: 600, color:"#1a1a18", lineHeight:1.3, marginBottom:cfg.headerSubtitle ? 4 : 0 }}>
            {cfg.headerTitle}
          </div>
          {cfg.headerSubtitle && (
            <div style={{ fontSize:12, fontWeight:600, color: cfg.accentColor, lineHeight:1.4 }}>
              {cfg.headerSubtitle}
            </div>
          )}
        </div>

        {/* ── Zeitstempel ── */}
        <div style={{ fontSize:11, color:"#999", textAlign:"center", marginBottom:16 }}>
          {fmtTime(n.created_at, t)}
        </div>

        {/* ── Content-Blöcke ── */}
        {cfg.blocks?.map((block, i) => {
          if (!block) return null;
          if (block.type === "label-text") return (
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight: 600, color: block.color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>
                {block.label}
              </div>
              <div style={{
                background: block.bg,
                border:`1px solid ${block.border}`,
                borderRadius:10, padding:"12px 14px",
                fontSize:14, color:"#1a1a18", lineHeight:1.7,
                whiteSpace:"pre-wrap", wordBreak:"break-word",
              }}>
                {block.text}
              </div>
            </div>
          );
          if (block.type === "stat") return (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"rgba(14,196,184,0.05)", borderRadius:10, marginBottom:10 }}>
              <span style={{ fontSize:12, color:"#888", fontWeight:600 }}>{block.label}</span>
              <span style={{ fontSize:16, fontWeight: 600, color:"#1a1a18" }}>{block.value}</span>
            </div>
          );
          if (block.type === "info") return (
            <div key={i} style={{ fontSize:12, color:"#888", textAlign:"center", marginBottom:12, lineHeight:1.5 }}>
              {block.text}
            </div>
          );
          return null;
        })}

        {/* ── Action-Button (Inhalt öffnen) ── */}
        {(hasEntityAction || hasUrlAction) && cfg.actionLabel && (
          <button
            onClick={() => {
              // FIX (2026-08-15): Bei Entity-Vorschau (Werk/Erlebnis/Talent)
              // dieses Modal NICHT schliessen -- es bleibt "logisch offen" im
              // Hintergrund (wird oben via previewItem-Check ausgeblendet) und
              // erscheint automatisch wieder, wenn die Vorschau schliesst.
              // Bei URL-Navigation (hasUrlAction, z.B. navigate()) schliesst
              // sich das Modal wie bisher -- das ist ein echter Seitenwechsel,
              // kein gestapeltes Overlay.
              if (hasEntityAction) {
                onAction({ ...n, _openRef: true });
              } else if (hasUrlAction) {
                onClose();
                onAction({ ...n, _openUrl: cfg.actionUrl });
              }
            }}
            style={{
              width:"100%", padding:"13px", borderRadius:99,
              background:"rgba(14,196,184,0.08)",
              border:`1.5px solid rgba(14,196,184,0.35)`,
              color:"#0EC4B8", fontSize:14, fontWeight: 600,
              cursor:"pointer", fontFamily:"inherit",
              marginBottom:10,
            }}
          >
            {cfg.actionLabel}
          </button>
        )}

        {/* ── Chat-Button (Buchungsdetail: "Mit Nutzer chatten") ── */}
        {cfg.chatUserId && (
          <button
            onClick={() => {
              onClose();
              onAction({ ...n, _openChat: { id: cfg.chatUserId, display_name: cfg.chatUserName || null } });
            }}
            style={{
              width:"100%", padding:"13px", borderRadius:99,
              background:"rgba(14,196,184,0.08)",
              border:`1.5px solid rgba(14,196,184,0.35)`,
              color:"#0EC4B8", fontSize:14, fontWeight: 600,
              cursor:"pointer", fontFamily:"inherit",
              marginBottom:10,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}
          >
            💬 Mit Nutzer chatten
          </button>
        )}

        {/* ── QUITTUNG-001: Link zum Angebot ── */}
        {cfg.offerLinkId && cfg.offerLinkType && (
          <button
            onClick={() => {
              // FIX (2026-08-15): analog zum "Werk ansehen"-Button oben --
              // Modal bleibt logisch offen, damit die System-Zurueck-Taste
              // nach dem Schliessen der Vorschau hierher zurueckkehrt.
              onAction({ ...n, _openRef: true, _refType: cfg.offerLinkType, _refId: cfg.offerLinkId });
            }}
            style={{
              width:"100%", padding:"13px", borderRadius:99,
              background:"rgba(14,196,184,0.08)",
              border:`1.5px solid rgba(14,196,184,0.35)`,
              color:"#0EC4B8", fontSize:14, fontWeight: 600,
              cursor:"pointer", fontFamily:"inherit",
              marginBottom:10,
            }}
          >
            Angebot ansehen →
          </button>
        )}

        {/* ── BANKDATEN-LINK (2026-08-16): "Bankdaten hinterlegen" Button ── */}
        {cfg.bankdatenLink && (
          <button
            onClick={() => {
              onClose();
              onAction({ ...n, _openBankdaten: true });
            }}
            style={{
              width:"100%", padding:"13px", borderRadius:99,
              background:"rgba(245,158,11,0.10)",
              border:"1.5px solid rgba(245,158,11,0.40)",
              color:"#B8860B", fontSize:14, fontWeight: 600,
              cursor:"pointer", fontFamily:"inherit",
              marginBottom:10,
            }}
          >
            🏦 Bankdaten hinterlegen →
          </button>
        )}

        {/* ── BELEG-001: Beleg herunterladen ── */}
        {cfg.receiptData && (
          <button
            onClick={async () => {
              try {
                const result = await generateReceipt(cfg.receiptData);
                setReceiptPreview(result);
              } catch (e) {
                console.warn("Receipt generation failed:", e);
              }
            }}
            style={{
              width:"100%", padding:"13px", borderRadius:99,
              background:"rgba(34,197,94,0.08)",
              border:`1.5px solid rgba(34,197,94,0.35)`,
              color:"#22C55E", fontSize:14, fontWeight: 600,
              cursor:"pointer", fontFamily:"inherit",
              marginBottom:10,
            }}
          >
            📄 Beleg herunterladen
          </button>
        )}


        {/* ── Schließen ── */}
        <button
          onClick={onClose}
          style={{
            width:"100%", padding:"13px", borderRadius:99,
            background: cfg.accentColor, border:"none",
            color:"#fff", fontSize:15, fontWeight: 600,
            cursor:"pointer", fontFamily:"inherit",
          }}
        >
          Schließen
        </button>
      </div>
    </div>
    {receiptPreview && (
      <BelegViewerModal result={receiptPreview} onClose={() => setReceiptPreview(null)} />
    )}
    </>
  );
}

// ── NotifCard ──────────────────────────────────────────────────────────────
// Jede Karte öffnet beim Klick das universelle DetailModal.
function NotifCard({ n, onRead, onDelete, onAction = () => {} }) {
  const { t } = useTranslation();
  const { openCreatorProfile } = useProfileLauncher();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const meta = getMeta(n.type, t);

  const handleOpen = (e) => {
    e?.stopPropagation?.();
    if (!n.is_read) onRead?.(n.id);
    setOpen(true);
  };

  const handleAction = (notif) => {
    // _openRef → Entity-Preview via onAction (MyBasisProfile wertet aus)
    // _openUrl → URL-Navigation
    onAction(notif);
  };

  // KOMPAKT.1 (2026-08-08, Nutzer-Feedback): Wenn die kleine Kategorie-
  // Kennung (meta.label, z.B. "Buchung bestätigt") inhaltlich identisch mit
  // dem fett gedruckten Titel ist (z.B. n.title === "Buchung bestätigt ✓"),
  // wuerde derselbe Text zweimal untereinander stehen -- "einmal reicht".
  // Vergleich ignoriert Häkchen/Satzzeichen am Ende sowie Groß-/Kleinschreibung.
  const normLabel = (s) => (s || "").replace(/[✓✔️.!]+$/g, "").trim().toLowerCase();
  const labelDuplicatesTitle = !!(n.title && meta.label && normLabel(n.title) === normLabel(meta.label));

  return (
    <>
      {open && <DetailModal n={n} onClose={() => setOpen(false)} onAction={handleAction} />}

      <div
        onClick={handleOpen}
        style={{
          borderRadius:T.r12, marginBottom:6, overflow:"hidden",
          background: n.is_read ? T.bgCard : T.tealSoft,
          border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
          cursor:"pointer", transition:"background .15s",
          WebkitTapHighlightColor:"transparent",
        }}
      >
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 11px" }}>
          {/* Avatar / Icon */}
          <div style={{
            width:32, height:32, borderRadius:"50%", flexShrink:0,
            background: n.is_read ? "rgba(26,26,24,0.05)" : T.tealSoft,
            border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
            cursor: n.actor_id ? "pointer" : "default",
            WebkitTapHighlightColor:"transparent",
          }}
          onClick={n.actor_id ? e => { e.stopPropagation(); openCreatorProfile(n.actor_id); } : undefined}
          >
            <span className="hui-emoji" style={{fontFamily:'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif'}}>{meta.emoji}</span>
          </div>

          {/* Inhalt */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* KOMPAKT.1: Kategorie-Zeile nur wenn sie NICHT dasselbe sagt wie der Titel */}
            {!labelDuplicatesTitle && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:1 }}>
                <span style={{ fontSize:10.5, fontWeight: 600, color: n.is_read ? T.inkFaint : T.teal }}>
                  {meta.label}
                </span>
                {!n.is_read && (
                  <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block" }}/>
                )}
              </div>
            )}
            {n.title && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:1 }}>
                <div style={{ fontSize:13, fontWeight: n.is_read ? 500 : 600, color:T.ink, lineHeight:1.35 }}>
                  {n.title}
                </div>
                {labelDuplicatesTitle && !n.is_read && (
                  <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block", flexShrink:0 }}/>
                )}
              </div>
            )}
            {n.body && (
              <div style={{
                fontSize:12, lineHeight:1.42,
                color: n.type?.includes("_rejected") ? "#DC2626" : T.inkSoft,
                overflow:"hidden", display:"-webkit-box",
                WebkitLineClamp:2, WebkitBoxOrient:"vertical", wordBreak:"break-word",
              }}>
                {n.body}
              </div>
            )}

            {/* Ablehnung: "Grund lesen"-Chip */}
            {n.type?.includes("_rejected") && (
              <span style={{
                display:"inline-flex", alignItems:"center", gap:4,
                marginTop:5, padding:"3px 9px", borderRadius:99,
                background:"rgba(239,68,68,0.08)", border:"1.5px solid rgba(239,68,68,0.35)",
                color:"#DC2626", fontSize:11, fontWeight: 600,
              }}>
                📋 Grund lesen
              </span>
            )}

            {/* KOMPAKT.1: Löschen-Button in dieselbe Fußzeile wie Zeitstempel
                verschoben (spart eine ganze Zeile pro Karte, statt eigener
                Reihe darunter). */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:5 }}>
              <span style={{ fontSize:10.5, color:T.inkFaint }}>{fmtTime(n.created_at, t)}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {onDelete && (
                  <button
                    onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    style={{
                      padding:"2px 8px", borderRadius:99,
                      background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.20)",
                      color:"#DC2626", fontSize:10, fontWeight:600,
                      cursor:"pointer", fontFamily:"inherit",
                      display:"inline-flex", alignItems:"center", gap:3,
                    }}
                  >
                    {t("notif.deleteBtn")}
                  </button>
                )}
                {/* Pfeil-Indikator */}
                <span style={{ fontSize:13, color: n.is_read ? T.inkFaint : T.teal, opacity:0.6 }}>›</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Löschen-Bestätigung */}
      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position:"fixed", inset:0, zIndex:99999,
            background:"rgba(10,26,26,0.60)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:16, padding:"22px 20px 18px",
              maxWidth:300, width:"100%",
              boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ fontSize:16, fontWeight: 600, color:"#1a1a18", marginBottom:8 }}>{t("notif.deleteConfirmTitle")}</div>
            <div style={{ fontSize:13, color:"#888", marginBottom:20, lineHeight:1.5 }}>
              {t("notif.deleteConfirmBody")}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex:1, padding:"12px", borderRadius:99, background:"rgba(26,26,24,0.07)", border:"none", color:"#1a1a18", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
              >{t("notif.cancel")}</button>
              <button
                onClick={() => { setShowDeleteConfirm(false); onDelete?.(n.id); }}
                style={{ flex:1, padding:"12px", borderRadius:99, background:"#DC2626", border:"none", color:"#fff", fontSize:13, fontWeight: 600, cursor:"pointer", fontFamily:"inherit" }}
              >{t("notif.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── NotificationPanel (Side-Drawer) ────────────────────────────────────────
export default function NotificationPanel({ userId, onClose, onUnreadChange, onAction = () => {} }) {
  const { t } = useTranslation();
  useModalRegistration(true, () => onClose?.(), "NotificationPanel");
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title,body,is_read,action_url,entity_id,entity_type,sender_id,created_at,actor_id,metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(60);
      if (!error && data) {
        setNotifs(data);
        onUnreadChange?.(data.filter(n => !n.is_read).length);
      }
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = `notifs-${userId}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let ch = existing;
    let createdHere = false;
    if (!existing) {
      ch = supabase.channel(topic)
        .on("postgres_changes", { event:"INSERT", schema:"public", table:"notifications", filter:`user_id=eq.${userId}` },
          (payload) => {
            setNotifs(prev => [payload.new, ...prev]);
            onUnreadChange?.(c => (c || 0) + 1);
          })
        .on("postgres_changes", { event:"UPDATE", schema:"public", table:"notifications", filter:`user_id=eq.${userId}` },
          // RESONANZ-DBLCLICK-FIX (2026-08-10): Statt vollem load() (das
          // loading=true setzt und die komplette Liste inkl. offener Detail-
          // Modals kurz unmountet -> "1. Klick öffnet+schliesst, 2. Klick
          // bleibt offen") wird die betroffene Notification NUR lokal
          // gepatcht. Kein Loading-Flackern, kein Unmount, State bleibt.
          (payload) => {
            setNotifs(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n));
          })
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(ch); };
  }, [userId, load]);

  async function markAllRead() {
    if (!userId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    onUnreadChange?.(0);
    window.dispatchEvent(new CustomEvent("hui:notif:read"));
  }

  async function markRead(id) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    // Badge im Header sofort aktualisieren
    window.dispatchEvent(new CustomEvent("hui:notif:read"));
    setNotifs(cur => {
      const unread = cur.filter(n => !n.is_read).length;
      onUnreadChange?.(unread);
      return cur;
    });
  }

  async function deleteNotif(id) {
    if (!userId) return;
    // Optimistic: sofort aus UI entfernen
    setNotifs(prev => {
      const removed = prev.find(n => n.id === id);
      const next = prev.filter(n => n.id !== id);
      const newUnread = next.filter(n => !n.is_read).length;
      onUnreadChange?.(newUnread);
      return next;
    });
    try {
      await supabase.from("notifications").delete().eq("id", id).eq("user_id", userId);
      window.dispatchEvent(new CustomEvent("hui:notif:read"));
    } catch { /* silent */ }
  }

  // ── Tab-Definitionen (4 Tabs, RESONANZ-BUCHUNG-001 2026-08-08) ────────────
  // Alle / Buchungen / Kauf & Verkauf / Informativ.
  // SSOT-Spiegel von fn_notification_category() in der DB (muss synchron
  // gehalten werden, siehe auch TYPE_META in useNotifications.jsx).
  const BUCHUNGEN_TYPES = [
    "talent_booking_paid", "talent_booking_confirmed", "talent_booking_cancelled",
    "experience_booking_paid", "experience_booking_confirmed", "experience_booking_cancelled",
    "booking", "booking_change", "experience_soon", "new_booking",
  ];
  const KAUF_VERKAUF_TYPES = [
    "new_order", "order_confirmed", "order", "purchase",
  "impact_project_completed",
    "support_received", "support_succeeded",
  ];

  const TAB_FILTERS = {
    all:          () => true,
    buchungen:    n => BUCHUNGEN_TYPES.includes(n.type),
    kauf_verkauf: n => KAUF_VERKAUF_TYPES.includes(n.type),
    // Informativ = alles was nicht explizit Buchung oder Kauf/Verkauf ist
    informativ:   n => !BUCHUNGEN_TYPES.includes(n.type) && !KAUF_VERKAUF_TYPES.includes(n.type),
  };

  const TABS = [
    { key:"all",          label:t("notif.tab.all")          },
    { key:"buchungen",    label:t("notif.tab.buchungen")     },
    { key:"kauf_verkauf", label:t("notif.tab.kaufVerkauf")},
    { key:"informativ",   label:t("notif.tab.informativ")    },
  ];

  const visible = notifs.filter(TAB_FILTERS[tab] || (() => true));
  const unreadCount = notifs.filter(n => !n.is_read).length;
  // Live-Zähler pro Tab (verschwindet automatisch, sobald 0 = alles gelesen)
  const unreadByTab = Object.fromEntries(
    TABS.map(({ key }) => [key, notifs.filter(n => !n.is_read && (TAB_FILTERS[key]?.(n) ?? true)).length])
  );

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:10500, background:"rgba(0,0,0,0.35)" }} role="button" tabIndex={0} />

      {/* Drawer */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0,
        width:"100vw", zIndex:10500,
        display:"flex", flexDirection:"column",
        background:T.bg,
      }}>
        {/* Header — padding-top respektiert Status-Bar (Uhr/Akku/Signal), analog ChatHeader.jsx */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"max(var(--hui-safe-top, 0px),50px,env(safe-area-inset-top,50px)) 20px 12px",
          borderBottom:`1px solid ${T.border}`, background:T.bgCard,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <HUIBenachrichtigungIcon size={20} />
            <span style={{ fontSize:17, fontWeight: 600, color:T.ink, letterSpacing:"-0.02em" }}>{t("notif.center")}</span>
            {unreadCount > 0 && (
              <span style={{ background:T.teal, color:"white", borderRadius:T.r99, padding:"2px 8px", fontSize:11, fontWeight: 600 }}>{unreadCount}</span>
            )}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, background:T.bgCard, padding:"0 20px", overflowX:"auto" }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:"10px 14px", border:"none", background:"none", cursor:"pointer",
              fontSize:12, fontWeight: tab === key ? 600 : 500,
              color: tab === key ? T.teal : T.inkSoft,
              borderBottom: tab === key ? `2px solid ${T.teal}` : "2px solid transparent",
              whiteSpace:"nowrap",
              display:"flex", alignItems:"center", gap:5,
            }}>
              {label}
              {unreadByTab[key] > 0 && (
                <span style={{
                  background: tab === key ? T.teal : "rgba(26,26,24,0.15)",
                  color: tab === key ? "#fff" : T.inkSoft,
                  borderRadius:99, padding:"1px 6px", fontSize:10, fontWeight: 600,
                  minWidth:16, textAlign:"center", lineHeight:1.5,
                }}>{unreadByTab[key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Alle gelesen — nur im Tab "Alle" + wenn ungelesene vorhanden */}
        {tab === "all" && unreadCount > 0 && (
          <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"flex-end" }}>
            <button onClick={markAllRead} style={{
              fontSize:11, color:T.teal, background:"none",
              cursor:"pointer", fontWeight:600, fontFamily:"inherit",
              padding:"4px 10px", borderRadius:99,
              border:`1px solid ${T.tealMid}`,
            }}>
              {t("notif.markAllRead")}
            </button>
          </div>
        )}

        {/* Liste */}
        <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 24px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:T.inkFaint, fontSize:13 }}>{t("notif.loading")}</div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ marginBottom:8, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIBenachrichtigungIcon size={36}/></div>
              <div style={{ fontSize:14, color:T.inkFaint }}>{t("notif.empty")}</div>
            </div>
          ) : (
            visible.map(n => (
              <NotifCard key={n.id} n={n} onRead={markRead} onDelete={deleteNotif} onAction={onAction} />
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
