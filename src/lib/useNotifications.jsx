// src/lib/useNotifications.jsx — Phase 4B
// ══════════════════════════════════════════════════════════════
// Notification hook + Inbox component.
// Real data from Supabase + realtime subscription.
// Badge count, mark-as-read, all-read.
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient.js";
import { useAuth }  from "./AuthContext.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const INK   = "#1A1A2E";
const CREAM = "#F9F7F4";

// ── Hook ─────────────────────────────────────────────────────
export function useNotifications() {
  const { user } = useAuth();
  const [items,    setItems]   = useState([]);
  const [unread,   setUnread]  = useState(0);
  const [loading,  setLoading] = useState(false);
  const subRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,title,body,read,created_at,sender_id,entity_id,entity_type,icon,data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setItems(data);
        setUnread(data.filter(n => !n.read).length);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.id]);

  // Initial load + realtime sub
  useEffect(() => {
    if (!user?.id) { setItems([]); setUnread(0); return; }
    load();

    // Realtime: new notification for this user
    const ch = supabase.channel(`notif:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setItems(prev => [payload.new, ...prev]);
        setUnread(prev => prev + 1);
      })
      .subscribe();
    subRef.current = ch;

    return () => {
      ch.unsubscribe();
    };
  }, [user?.id, load]);

  const markRead = useCallback(async (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
  }, [user?.id]);

  const markAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    await supabase.from("notifications")
      .update({ read: true }).eq("user_id", user.id).eq("read", false);
  }, [user?.id]);

  return { items, unread, loading, markRead, markAllRead, reload: load };
}

// ── Icon map ─────────────────────────────────────────────────
const TYPE_CONFIG = {
  follow:   { icon: "👤", color: TEAL,  label: "Neuer Follower" },
  like:     { icon: "✦",  color: CORAL, label: "Mag deinen Beitrag" },
  inspire:  { icon: "✨",  color: "#A78BFA", label: "Inspiration" },
  save:     { icon: "🔖", color: "#F59E0B", label: "Gespeichert" },
  message:  { icon: "✉️", color: TEAL,  label: "Neue Nachricht" },
  booking:  { icon: "📅", color: "#22C55E", label: "Buchung" },
  resonanz: { icon: "⚡", color: "#A78BFA", label: "Resonanz" },
  system:   { icon: "ℹ️", color: "rgba(26,26,46,0.4)", label: "System" },
  default:  { icon: "✦",  color: TEAL,  label: "Aktivität" },
};

function fmtTime(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return "Gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff/60)} Min`;
  if (diff < 86400)return `vor ${Math.floor(diff/3600)} Std`;
  return `vor ${Math.floor(diff/86400)} Tagen`;
}

// ── EmptyState ────────────────────────────────────────────────
function NotifEmpty() {
  return (
    <div style={{
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"48px 24px",gap:16,
    }}>
      <div style={{
        width:72,height:72,borderRadius:24,
        background:"linear-gradient(135deg,rgba(22,215,197,0.10),rgba(255,138,107,0.08))",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:32,
      }}>✦</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:700,color:INK,marginBottom:6}}>
          Noch ruhig hier
        </div>
        <div style={{fontSize:13.5,color:"rgba(26,26,46,0.45)",lineHeight:1.6,maxWidth:220}}>
          Wenn jemand deinem Werk folgt, reagiert oder sich von dir inspirieren lässt — erscheint es hier.
        </div>
      </div>
    </div>
  );
}

// ── Notification Item ─────────────────────────────────────────
function NotifItem({ n, onRead }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
  return (
    <button
      onClick={() => { onRead(n.id); }}
      style={{
        display:"flex",alignItems:"flex-start",gap:13,
        padding:"14px 18px",
        background: n.read ? "transparent" : "rgba(22,215,197,0.05)",
        border:"none",borderBottom:"1px solid rgba(26,26,46,0.06)",
        cursor:"pointer",width:"100%",textAlign:"left",
        transition:"background 0.2s",
        touchAction:"manipulation",
      }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(26,26,46,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(22,215,197,0.05)"}
    >
      {/* Icon bubble */}
      <div style={{
        width:40,height:40,borderRadius:14,flexShrink:0,
        background:`linear-gradient(135deg,${cfg.color}22,${cfg.color}11)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:18,
        border:`1.5px solid ${cfg.color}30`,
      }}>{n.icon || cfg.icon}</div>

      <div style={{flex:1,minWidth:0}}>
        <div style={{
          fontSize:13.5,fontWeight: n.read ? 500 : 700,
          color: n.read ? "rgba(26,26,46,0.6)" : INK,
          lineHeight:1.4,marginBottom:2,
        }}>{n.title || cfg.label}</div>
        {n.body && (
          <div style={{
            fontSize:12.5,color:"rgba(26,26,46,0.45)",
            lineHeight:1.5,
            overflow:"hidden",display:"-webkit-box",
            WebkitLineClamp:2,WebkitBoxOrient:"vertical",
          }}>{n.body}</div>
        )}
        <div style={{fontSize:11,color:"rgba(26,26,46,0.3)",marginTop:4}}>
          {fmtTime(n.created_at)}
        </div>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <div style={{
          width:8,height:8,borderRadius:"50%",
          background:TEAL,flexShrink:0,marginTop:6,
        }}/>
      )}
    </button>
  );
}

// ── NotificationInbox component ───────────────────────────────
const CSS = `
@keyframes notifIn {
  from { opacity:0; transform:translateY(-10px) scale(0.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}`;
let _css = false;
function injectCSS() {
  if (_css || typeof document==="undefined") return;
  _css = true;
  const s = document.createElement("style"); s.textContent = CSS;
  document.head.appendChild(s);
}

export function NotificationInbox({ onClose, anchorRect }) {
  injectCSS();
  const { items, unread, loading, markRead, markAllRead } = useNotifications();

  // Smart position: below anchor button
  const top  = anchorRect ? anchorRect.bottom + 8 : 64;
  const right = anchorRect ? Math.max(8, window.innerWidth - anchorRect.right) : 12;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed",inset:0,zIndex:19500,
        background:"rgba(0,0,0,0.08)",
      }}/>
      {/* Panel */}
      <div style={{
        position:"fixed",
        top, right,
        zIndex:19600,
        width: Math.min(360, window.innerWidth - 16),
        maxHeight:"70vh",
        background:"#fff",
        borderRadius:22,
        boxShadow:"0 8px 40px rgba(26,26,46,0.14), 0 2px 8px rgba(26,26,46,0.06)",
        animation:"notifIn 0.22s cubic-bezier(.22,1,.36,1) both",
        display:"flex",flexDirection:"column",
        overflow:"hidden",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}>
        {/* Header */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 18px 12px",
          borderBottom:"1px solid rgba(26,26,46,0.07)",
          flexShrink:0,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:15,fontWeight:800,color:INK}}>Aktivität</span>
            {unread > 0 && (
              <div style={{
                background:TEAL,color:"#fff",
                fontSize:11,fontWeight:800,
                padding:"1px 7px",borderRadius:20,
                minWidth:20,textAlign:"center",
              }}>{unread}</div>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{
              background:"none",border:"none",
              color:TEAL,fontSize:12.5,fontWeight:600,
              cursor:"pointer",touchAction:"manipulation",
            }}>Alle gelesen</button>
          )}
        </div>

        {/* List */}
        <div style={{overflowY:"auto",flex:1}}>
          {loading && items.length === 0 ? (
            <div style={{padding:"32px",textAlign:"center"}}>
              <div style={{
                width:24,height:24,borderRadius:"50%",margin:"0 auto",
                border:"2.5px solid rgba(22,215,197,0.2)",
                borderTop:`2.5px solid ${TEAL}`,
                animation:"notifSpin 0.8s linear infinite",
              }}/>
              <style>{`@keyframes notifSpin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : items.length === 0 ? (
            <NotifEmpty />
          ) : (
            items.map(n => <NotifItem key={n.id} n={n} onRead={markRead} />)
          )}
        </div>
      </div>
    </>
  );
}

// ── NotificationBadge — für Header Button ────────────────────
export function NotificationBadge({ count }) {
  if (!count || count < 1) return null;
  return (
    <div style={{
      position:"absolute", top:-4, right:-4,
      minWidth:17, height:17,
      background: "linear-gradient(135deg,#FF8A6B,#FF6B4A)",
      borderRadius:10,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:10, fontWeight:800, color:"#fff",
      border:"2px solid #fff",
      padding:"0 4px",
      lineHeight:1,
      pointerEvents:"none",
    }}>{count > 99 ? "99+" : count}</div>
  );
}
