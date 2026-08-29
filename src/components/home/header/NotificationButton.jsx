// header/NotificationButton.jsx — Resonanzzentrum Trigger
// RESONANZ-001 (2026-08-08): Verwendet jetzt NotificationPanel (neu, 4-Tab)
// statt des alten ResonanzzentrumPanel aus useNotifications.jsx.
// Tabs: Alle / Buchungen / Kauf & Verkauf / Informativ
import React, { useState, useCallback, useEffect } from "react";
import NotificationPanel from "../../notifications/NotificationPanel.jsx";
import { NotificationBadge } from "../../../lib/useNotifications.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx";
import { useNavigate } from "react-router-dom";
import { S } from "../../../core/hui.sources.js";

// WICHTIG: kein useNotifications() hier — würde Channel notif:X doppelt öffnen.
// unread kommt als Prop von HomeHeader (notifCount).
export default function NotificationButton({ count = 0, userId = "" }) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(count);

  // FIX (2026-08-13): useState(count) liest das Prop NUR beim ersten Mount.
  // Wenn AppStateContext.fetchNotifCount() (Polling alle 60s) den echten
  // Wert erst NACH diesem Mount liefert (Standardfall, da async), blieb
  // unreadCount permanent auf dem initialen Wert (meist 0) haengen — die
  // Badge zeigte NIE eine Zahl, obwohl das Resonanzzentrum selbst (eigener
  // Fetch beim Oeffnen) korrekt zaehlte. Fix: State synchron mit jeder
  // Aenderung des count-Props halten.
  useEffect(() => {
    setUnreadCount(count);
  }, [count]);

  const actions = useHuiActions();
  const { openRef } = useContentPreview();
  const navigate = useNavigate();

  function handlePress() {
    setOpen(prev => !prev);
  }

  // ── onAction: identische Logik wie MyBasisProfile.handleNotifAction ──
  //
  // BACK-BUTTON-STACK-FIX (2026-08-15, Michael-Report): Vorher stand hier
  // ein unbedingtes setOpen(false) VOR dem gesamten Switch -- das schloss
  // das komplette Resonanzzentrum-Panel (inkl. dem darin liegenden
  // DetailModal) IMMER, auch wenn nur eine Werk/Erlebnis/Talent-Vorschau
  // (openRef) darueber geoeffnet wurde. Ergebnis: die System-Zurueck-Taste
  // hatte nach dem Schliessen der Vorschau nichts mehr zum Zurueckkehren --
  // sie sprang direkt zur Startseite statt zur "Neue Bestellung"-Auswahl.
  // Fix: setOpen(false) wird jetzt NUR noch bei echten Seitenwechseln
  // aufgerufen (Chat oeffnen, Profil oeffnen, Impact/Discover navigieren,
  // URL-Navigation) -- bei openRef(...) (Entity-Vorschau) bleibt das Panel
  // (und das DetailModal darin, siehe NotificationPanel.jsx previewItem-
  // Check) im Hintergrund bestehen.
  const handleAction = useCallback((n) => {
    if (!n) return;
    const meta = n.metadata || {};
    const targetId = meta.target_id || meta.actor_id || n.actor_id || null;
    const werkId  = meta.werk_id   || null;

    // ── "Mit Nutzer chatten" aus Buchungsdetail-Modal (typunabhängig, Vorrang) ──
    if (n._openChat) {
      setOpen(false);
      const chatId = typeof n._openChat === "object" ? n._openChat.id : n._openChat;
      actions?.[A.OPEN_CHAT]?.({ recipientId: chatId, name: typeof n._openChat === "object" ? n._openChat.display_name : null, source: S.HOME });
      return;
    }
    // BANKDATEN-LINK (2026-08-16): "Bankdaten hinterlegen" aus
    // payout_bank_details_needed Notification → Settings → Bankdaten
    if (n._openBankdaten) {
      setOpen(false);
      if (typeof window !== "undefined" && typeof window.__HUI_OPEN_BANKDATEN__ === "function") {
        window.__HUI_OPEN_BANKDATEN__();
      }
      return;
    }

    // BELEG-002: Angebot-Link aus DetailModal — Vorschau bleibt im Panel-Kontext
    if (n._openRef && n._refType && n._refId) {
      openRef({ type: n._refType, id: n._refId });
      return;
    }

    switch (n.type) {
      case "talent_booking_paid":
      case "talent_booking_confirmed":
      case "talent_booking_cancelled":
      case "experience_booking_paid":
      case "experience_booking_confirmed":
      case "experience_booking_cancelled":
        break;

      case "follow":
      case "follow_request":
      case "new_follower":
        setOpen(false);
        if (targetId) actions?.[A.OPEN_PROFILE]?.({ creatorId: targetId, source: S.HOME });
        break;

      case "begegnung":
      case "buchung":
      case "booking":
      case "message":
      case "new_message":
        setOpen(false);
        if (targetId) actions?.[A.OPEN_CHAT]?.({ recipientId: targetId, source: S.HOME });
        break;

      case "impact":
      case "project_update":
      case "impact_update":
      case "impact_project_submitted":
      case "impact_project_deleted":
      case "impact_project_completed":
        setOpen(false);
        actions?.[A.GO_IMPACT]?.();
        break;

      case "community":
      case "community_update":
      case "inspiration":
      case "discover":
        setOpen(false);
        actions?.[A.GO_DISCOVER]?.();
        break;

      case "work_approved": {
        if (n._openRef && n.entity_id) {
          openRef({ type: n.entity_type || "work", id: n.entity_id });
        } else if (werkId) {
          setOpen(false);
          navigate(`/work/${werkId}`);
        }
        break;
      }

      case "comment":
      case "comment_reply": {
        const cmId   = meta.post_id   || n.entity_id   || null;
        const cmType = meta.post_type || n.entity_type || null;
        if (cmId && cmType) openRef({ type: cmType, id: cmId });
        break;
      }

      case "work_rejected":
      case "content_rejected": {
        if (n._openRef && n.entity_id && n.entity_type) {
          const rejectType = n.entity_type === "impact_project" ? "project" : n.entity_type;
          if (["work","experience","talent"].includes(rejectType)) {
            openRef({ type: rejectType, id: n.entity_id });
          }
        }
        break;
      }

      case "experience_approved":
      case "experience_rejected": {
        if (n._openRef && n.entity_id) openRef({ type: "experience", id: n.entity_id });
        break;
      }

      case "impact_project_approved":
      case "impact_project_rejected":
        break;

      case "resonanz":
      case "like":
      case "save":
      case "share": {
        const rEntityId   = n.entity_id   || meta.post_id   || null;
        const rEntityType = n.entity_type || meta.post_type || null;
        if (n._openRef && rEntityId && rEntityType) {
          openRef({ type: rEntityType, id: rEntityId });
        }
        break;
      }

      case "work_flagged":
      case "content_flagged":
      case "content_deleted":
      case "content_approved": {
        const cEntityId   = n.entity_id   || meta.entity_id   || null;
        const cEntityType = n.entity_type || meta.entity_type || null;
        if (n._openRef && cEntityId && cEntityType) {
          openRef({ type: cEntityType, id: cEntityId });
        }
        break;
      }

      case "admin":
      case "admin_broadcast":
      case "broadcast":
      case "system":
      case "info":
      case "save_digest":
      case "support_ticket":
      case "support_ticket_reply":
      case "new_order":
      case "order_confirmed": {
        const oEntityId = n.entity_id || meta.work_id || null;
        const oEntityType = n.entity_type || "work";
        if (n._openRef && oEntityId) {
          openRef({ type: oEntityType, id: oEntityId });
        }
        break;
      }

      default: {
        if (n._openRef && n.entity_id && n.entity_type) {
          openRef({ type: n.entity_type, id: n.entity_id });
        } else if (n._openUrl) {
          setOpen(false);
          const path = n._openUrl.startsWith("http")
            ? new URL(n._openUrl).pathname
            : n._openUrl;
          navigate(path);
        } else if (n.action_url) {
          setOpen(false);
          const path = n.action_url.startsWith("http")
            ? new URL(n.action_url).pathname
            : n.action_url;
          navigate(path);
        }
        break;
      }
    }
  }, [actions, openRef, navigate]);

  return (
    <>
      <button
        onClick={handlePress}
        aria-label="Resonanzzentrum"
        data-tutorial="nav-resonanz"
        style={{
          flexShrink:0, width:36, height:36, borderRadius:"50%",
          background:"rgba(255,255,255,0.80)",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          border:"1.5px solid rgba(22,215,197,0.18)",
          boxShadow:"0 1px 8px rgba(0,0,0,0.06), 0 0 0 2.5px rgba(22,215,197,0.06)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", position:"relative",
          WebkitTapHighlightColor:"transparent",
          transform: pressed ? "scale(0.93) translateY(0.5px)" : "scale(1)",
          transition:"transform 0.22s ease",
        }}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        {/* Glocken-Icon */}
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M9 2 C6.2 2 4.5 4.2 4.5 6.5 L4.5 10 L3 11.5 L15 11.5 L13.5 10 L13.5 6.5 C13.5 4.2 11.8 2 9 2Z"
            fill="rgba(22,215,197,0.10)" stroke="#16D7C5" strokeWidth="1.35" strokeLinejoin="round"/>
          <path d="M7.2 12 Q7.6 13.5 9 13.5 Q10.4 13.5 10.8 12"
            stroke="#16D7C5" strokeWidth="1.25" strokeLinecap="round"/>
          <path d="M6.5 3 Q9 1.5 11.5 3"
            stroke="#FF8A6B" strokeWidth="1" strokeLinecap="round" opacity="0.55"/>
        </svg>
        <NotificationBadge count={unreadCount} />
      </button>

      {open && userId && (
        <NotificationPanel
          userId={userId}
          onClose={() => setOpen(false)}
          onUnreadChange={setUnreadCount}
          onAction={handleAction}
        />
      )}
    </>
  );
}
