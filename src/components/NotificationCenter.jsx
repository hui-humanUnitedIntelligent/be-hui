// NotificationCenter.jsx — HUI Phase 8
// Echte Notifications aus Supabase. Realtime-Badge im Header.
import React, { useState, useEffect, useCallback } from "react";
import { safeQuery } from "../lib/perfUtils";
import { supabase } from ".../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

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
  booking_request:  { icon:"📅", label:"Buchungsanfrage",  color:C.teal,  bg:C.tealPale },
  booking_confirmed:{ icon:"✅", label:"Buchung bestätigt", color:C.green, bg:C.greenPale },
  booking_declined: { icon:"❌", label:"Buchung abgelehnt", color:C.coral, bg:C.coralPale },
  new_message:      { icon:"💬", label:"Neue Nachricht",    color:C.teal,  bg:C.tealPale },
  new_recommendation:{ icon:"⭐", label:"Neue Empfehlung",  color:C.gold,  bg:C.goldPale },
  new_follower:     { icon:"👤", label:"Neuer Follower",    color:C.teal,  bg:C.tealPale },
  payment_received: { icon:"💰", label:"Zahlung erhalten",  color:C.green, bg:C.greenPale },
  impact_vote:      { icon:"🌱", label:"Impact Pool",       color:C.teal,  bg:C.tealPale },
  story_view:       { icon:"👁",  label:"Story angesehen",  color:C.coral, bg:C.coralPale },
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
          {n.message}
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

// ── Hook: unread count for header badge ──────────────────────────────
export function useNotifCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    async function load() {
      const { count: c } = await supabase
        .from("notifications")
        .select("id", { count:"exact" })
        .eq("user_id", user.id)
        .eq("read", false);
      if (mounted) setCount(c || 0);
    }
    load();

    const channel = supabase.channel("notif_count:" + user.id)
      .on("postgres_changes", {
        event: "*", schema:"public", table:"notifications",
        filter:`user_id=eq.${user.id}`
      }, () => { if (mounted) load(); })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  return count;
}

// ── Main Component ───────────────────────────────────────────────────
export default function NotificationCenter({ onClose, onNavigate }) {
  const { user } = useAuth();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const unread = notifs.filter(n => !n.read).length;

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,user_id,type,title,body,read,data,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    setNotifs(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    load().catch(() => {});
    return () => { mounted = false; };
  }, [load]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel("notifs:" + user.id)
      .on("postgres_changes", {
        event: "INSERT", schema:"public", table:"notifications",
        filter:`user_id=eq.${user.id}`
      }, (payload) => {
        // Only update if component still mounted (channel cleanup handles this,
        // but explicit guard prevents stale closure issues)
        setNotifs(n => [payload.new, ...n]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  async function markAllRead() {
    await supabase.from("notifications")
      .update({ read: true })
      .eq("user_id", user.id).eq("read", false);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  }

  async function handleAction(n) {
    // Mark as read
    if (!n.read) {
      await supabase.from("notifications")
        .update({ read: true }).eq("id", n.id);
      setNotifs(prev => prev.map(x => x.id===n.id ? {...x, read:true} : x));
    }
    // Navigate based on type
    if (n.action_url && onNavigate) onNavigate(n.action_url);
  }

  const groups = groupByDay(notifs);
  const GROUP_LABELS = {
    today: "Heute", yesterday: "Gestern", older: "Früher"
  };

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
                fontFamily:"inherit" }}>
              Alle lesen
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="nc-scroll" style={{ flex:1, overflowY:"auto" }}>
        {loading ? (
          [0,1,2,3].map(i => (
            <div key={i} style={{ display:"flex", gap:12, padding:"14px 20px",
              borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:42, height:42, borderRadius:"50%",
                background:"rgba(0,0,0,0.07)", animation:"ncPulse 1.4s infinite", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ height:13, width:"45%", borderRadius:6, marginBottom:8,
                  background:"rgba(0,0,0,0.07)", animation:"ncPulse 1.4s infinite" }} />
                <div style={{ height:11, width:"85%", borderRadius:5,
                  background:"rgba(0,0,0,0.05)", animation:"ncPulse 1.4s infinite" }} />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 32px" }}>
            <div style={{ fontSize:40, marginBottom:14 }}>🔔</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:8 }}>
              Alles ruhig hier
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
              Buchungen, Nachrichten und<br/>Empfehlungen erscheinen hier.
            </div>
          </div>
        ) : (
          Object.entries(groups).map(([key, items]) =>
            items.length === 0 ? null : (
              <div key={key}>
                <div style={{ padding:"10px 20px 6px",
                  fontSize:11, fontWeight:800, color:C.muted,
                  letterSpacing:.6, textTransform:"uppercase",
                  background:C.cream, position:"sticky", top:0, zIndex:1 }}>
                  {GROUP_LABELS[key]}
                </div>
                {items.map(n => (
                  <NotifItem key={n.id} n={n} onAction={handleAction} />
                ))}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
