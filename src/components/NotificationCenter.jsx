// NotificationCenter.jsx — HUI
// ════════════════════════════════════════════════════════════════
// SINGLE-OWNER ARCHITECTURE:
//   Notification-Realtime-Channel gehört exklusiv AppStateContext.
//   NotificationCenter + useNotifCount lesen NUR aus dem Context.
//   Kein eigener supabase.channel() hier.
// ════════════════════════════════════════════════════════════════
import React, { useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAppState } from "../lib/AppStateContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#10B981", greenPale:"#ECFDF5",
  cream:"#F9F6F2", card:"#FFFFFF",
  ink:"#1A1A1A", muted:"#888", border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes ncFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ncPulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes ncDot{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}
  .nc-scroll::-webkit-scrollbar{display:none}
  .nc-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .nc-tap{-webkit-tap-highlight-color:transparent;transition:all .15s}
  .nc-tap:active{opacity:.65}
`;

const TYPE_CONFIG = {
  booking_request:  { icon:"📅", label:"Buchungsanfrage",   color:C.teal,  bg:C.tealPale  },
  booking_confirmed:{ icon:"✅", label:"Buchung bestätigt",  color:C.green, bg:C.greenPale },
  booking_declined: { icon:"❌", label:"Buchung abgelehnt",  color:C.coral, bg:C.coralPale },
  new_message:      { icon:"💬", label:"Neue Nachricht",     color:C.teal,  bg:C.tealPale  },
  new_recommendation:{ icon:"⭐",label:"Neue Empfehlung",   color:C.gold,  bg:C.goldPale  },
  new_follower:     { icon:"👤", label:"Neuer Follower",     color:C.teal,  bg:C.tealPale  },
  payment_received: { icon:"💰", label:"Zahlung erhalten",   color:C.green, bg:C.greenPale },
  impact_vote:      { icon:"🌱", label:"Impact Pool",        color:C.teal,  bg:C.tealPale  },
  story_view:       { icon:"👁",  label:"Story angesehen",   color:C.coral, bg:C.coralPale },
};

function groupByDay(notifications) {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const groups    = { today:[], yesterday:[], older:[] };
  notifications.forEach(n => {
    const d = new Date(n.created_at); d.setHours(0,0,0,0);
    if (d >= today)          groups.today.push(n);
    else if (d >= yesterday) groups.yesterday.push(n);
    else                     groups.older.push(n);
  });
  return groups;
}

function NotifItem({ n, onAction }) {
  const cfg = TYPE_CONFIG[n.type] || { icon:"🔔", label:"Benachrichtigung", color:C.teal, bg:C.tealPale };
  const timeStr = new Date(n.created_at).toLocaleTimeString("de-DE",
    { hour:"2-digit", minute:"2-digit" });

  return (
    <div className="nc-tap" onClick={() => onAction(n)}
      style={{ display:"flex", gap:12, padding:"14px 20px",
        background: n.read ? "transparent" : `${C.teal}05`,
        borderBottom:`1px solid ${C.border}`, cursor:"pointer",
        animation:"ncFade .25s ease both" }}>
      <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0,
        background:cfg.bg, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:18, position:"relative" }}>
        {cfg.icon}
        {!n.read && (
          <div style={{ position:"absolute", top:0, right:0,
            width:10, height:10, borderRadius:"50%",
            background:cfg.color, border:"2px solid white",
            animation:"ncDot 2s ease-in-out infinite" }} />
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"baseline", marginBottom:2 }}>
          <div style={{ fontWeight: n.read ? 600 : 800, fontSize:13,
            color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize:10, color:C.muted, flexShrink:0 }}>{timeStr}</div>
        </div>
        <div style={{ fontSize:13, color:C.ink, lineHeight:1.5,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {n.message || n.body || n.title || ""}
        </div>
        {n.action_label && (
          <div style={{ marginTop:6 }}>
            <span style={{ fontSize:11, fontWeight:700, color:cfg.color,
              background:cfg.bg, borderRadius:50, padding:"3px 10px" }}>
              {n.action_label} →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hook: unread count für Header-Badge ──────────────────────────
// Liest aus AppStateContext — KEIN eigener Realtime-Channel.
// AppStateContext ist Single-Owner des notification channels.
export function useNotifCount() {
  const { unreadNotifCount } = useAppState();
  return unreadNotifCount ?? 0;
}

// ── Main Component ───────────────────────────────────────────────
// Liest notifications aus AppStateContext — kein eigener Channel.
export default function NotificationCenter({ onClose, onNavigate }) {
  const {
    notifications,
    unreadNotifCount,
    markNotifsRead,
    loadNotifications,
  } = useAppState();

  const unread = unreadNotifCount ?? 0;

  // Reload beim Öffnen — holt frische Daten via AppState
  React.useEffect(() => {
    loadNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markAllRead() {
    await supabase.from("notifications")
      .update({ read: true })
      .eq("read", false);
    // AppState via markNotifsRead updaten
    markNotifsRead();
  }

  async function handleAction(n) {
    if (!n.read) {
      await supabase.from("notifications")
        .update({ read: true }).eq("id", n.id);
      // lokales Update über loadNotifications (refetch)
      loadNotifications();
    }
    if (n.action_url && onNavigate) onNavigate(n.action_url);
  }

  const groups    = groupByDay(notifications || []);
  const GROUP_LABELS = { today:"Heute", yesterday:"Gestern", older:"Früher" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:C.cream, display:"flex", flexDirection:"column" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:C.card, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {onClose && (
            <button className="nc-tap" onClick={onClose}
              style={{ background:"rgba(0,0,0,0.06)", border:"none", borderRadius:"50%",
                width:38, height:38, fontSize:17, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:900, color:C.ink }}>
              Benachrichtigungen
            </div>
            <div style={{ fontSize:12, color:C.muted }}>
              {unread > 0 ? `${unread} ungelesen` : "Alles gelesen ✓"}
            </div>
          </div>
          {unread > 0 && (
            <button className="nc-tap" onClick={markAllRead}
              style={{ background:"none", border:"none", fontSize:12,
                fontWeight:700, color:C.teal, cursor:"pointer",
                padding:"8px 12px", borderRadius:10,
                background:`${C.teal}10` }}>
              Alle lesen
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="nc-scroll" style={{ flex:1, overflowY:"auto" }}>
        {(!notifications || notifications.length === 0) ? (
          <div style={{ display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            height:"60vh", gap:12 }}>
            <div style={{ fontSize:40 }}>🔔</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.ink }}>
              Noch keine Benachrichtigungen
            </div>
            <div style={{ fontSize:13, color:C.muted }}>
              Hier erscheinen Anfragen, Nachrichten & Neuigkeiten
            </div>
          </div>
        ) : (
          Object.entries(groups).map(([key, items]) =>
            items.length > 0 && (
              <div key={key}>
                <div style={{ padding:"10px 20px 4px",
                  fontSize:11, fontWeight:800, color:C.muted,
                  letterSpacing:1.2 }}>
                  {GROUP_LABELS[key]?.toUpperCase()}
                </div>
                {items.map(n => (
                  <NotifItem key={n.id} n={n} onAction={handleAction} />
                ))}
              </div>
            )
          )
        )}
        <div style={{ height:"max(80px,env(safe-area-inset-bottom,80px))" }} />
      </div>
    </div>
  );
}
