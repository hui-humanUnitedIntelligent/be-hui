import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";

// ══════════════════════════════════════════════════════════════
// NOTIFICATION PANEL
// Live-Verbindung zur Supabase notifications Tabelle
// Zeigt ungelesene + gelesene Nachrichten aus dem Resonanzzentrum
// ══════════════════════════════════════════════════════════════

const T = {
  teal:"#0EC4B8", tealSoft:"rgba(14,196,184,0.08)",
  tealMid:"rgba(14,196,184,0.2)", ink:"#1A1A18",
  inkSoft:"#555552", inkFaint:"#888885",
  bg:"#F7F7F5", bgCard:"#FFFFFF",
  border:"rgba(26,26,24,0.09)",
  r12:"12px", r16:"16px", r99:"99px",
  card:"0 1px 6px rgba(0,0,0,0.07)",
};

const TYPE_META = {
  admin_broadcast:    { emoji:"📢", label:"Ankündigung" },
  ambassador_approved:{ emoji:"🌟", label:"Ambassador" },
  ambassador_rejected:{ emoji:"❌", label:"Ambassador" },
  ambassador_revoked: { emoji:"⚠️", label:"Ambassador" },
  new_follower:       { emoji:"👥", label:"Verbindung" },
  new_message:        { emoji:"💬", label:"Nachricht" },
  work_like:          { emoji:"❤️", label:"Werk" },
  booking_request:    { emoji:"📅", label:"Buchung" },
  booking_confirmed:  { emoji:"✅", label:"Buchung" },
  impact_vote:        { emoji:"🗳️", label:"Impact" },
  referral_joined:    { emoji:"🎉", label:"Empfehlung" },
  content_approved:   { emoji:"✅", label:"Freigegeben" },
  content_rejected:   { emoji:"❌", label:"Abgelehnt" },
  content_pending:    { emoji:"🔍", label:"In Prüfung" },
  default:            { emoji:"🔔", label:"Benachrichtigung" },
};

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)  return "Gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff/60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std.`;
  if (diff < 604800) return `vor ${Math.floor(diff/86400)} Tag(en)`;
  return d.toLocaleDateString("de-DE", { day:"numeric", month:"short" });
}

export default function NotificationPanel({ userId, onClose, onUnreadChange }) {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("unread"); // unread | all

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title,body,is_read,action_url,created_at,actor_id,metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setNotifs(data);
        const unread = data.filter(n => !n.is_read).length;
        onUnreadChange?.(unread);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Realtime-Subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifs-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifs(prev => [payload.new, ...prev]);
        onUnreadChange?.(c => (c || 0) + 1);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  async function markAllRead() {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    onUnreadChange?.(0);
  }

  async function markRead(id) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    onUnreadChange?.(prev => Math.max(0, (prev || 0) - 1));
  }

  const unread   = notifs.filter(n => !n.is_read);
  const visible  = tab === "unread" ? unread : notifs;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10000,
      display:"flex", flexDirection:"column",
      background:T.bg,
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 20px 12px",
        borderBottom:`1px solid ${T.border}`,
        background:T.bgCard,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{fontSize:20}}>🔔</span>
          <span style={{fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.02em"}}>
            Benachrichtigungen
          </span>
          {unread.length > 0 && (
            <span style={{
              background:T.teal, color:"white",
              borderRadius:T.r99, padding:"2px 8px",
              fontSize:11, fontWeight:700,
            }}>{unread.length}</span>
          )}
        </div>
        <button onClick={onClose} style={{
          width:32, height:32, borderRadius:"50%",
          background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
          fontSize:16, cursor:"pointer", display:"flex",
          alignItems:"center", justifyContent:"center",
        }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{
        display:"flex", gap:0,
        borderBottom:`1px solid ${T.border}`,
        background:T.bgCard, padding:"0 20px",
      }}>
        {[["unread","Ungelesen"], ["all","Alle"]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            padding:"10px 16px", border:"none", background:"none",
            fontSize:13, fontWeight: tab===val ? 700 : 500,
            color: tab===val ? T.teal : T.inkFaint,
            borderBottom: tab===val ? `2px solid ${T.teal}` : "2px solid transparent",
            cursor:"pointer", fontFamily:"inherit",
          }}>{label}{val==="unread" && unread.length > 0 ? ` (${unread.length})` : ""}</button>
        ))}
        {unread.length > 0 && (
          <button onClick={markAllRead} style={{
            marginLeft:"auto", padding:"10px 0",
            border:"none", background:"none",
            fontSize:12, color:T.teal, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
          }}>Alle gelesen</button>
        )}
      </div>

      {/* Liste */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:T.inkFaint, fontSize:13 }}>
            Lädt…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{fontSize:32, marginBottom:10}}>🔔</div>
            <div style={{fontSize:14, color:T.inkFaint}}>
              {tab === "unread" ? "Keine ungelesenen Benachrichtigungen" : "Noch keine Benachrichtigungen"}
            </div>
          </div>
        ) : (
          visible.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.default;
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id); }}
                style={{
                  display:"flex", alignItems:"flex-start", gap:12,
                  padding:"12px 14px", borderRadius:T.r12,
                  background: n.is_read ? T.bgCard : T.tealSoft,
                  border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
                  marginBottom:8, cursor: n.is_read ? "default" : "pointer",
                  transition:"background .15s",
                }}
              >
                <div style={{
                  width:38, height:38, borderRadius:"50%",
                  background: n.is_read ? "rgba(26,26,24,0.05)" : T.tealSoft,
                  border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, flexShrink:0,
                }}>{meta.emoji}</div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:11, fontWeight:700, color: n.is_read ? T.inkFaint : T.teal }}>
                      {meta.label}
                    </span>
                    {!n.is_read && (
                      <span style={{
                        width:6, height:6, borderRadius:"50%",
                        background:T.teal, display:"inline-block",
                      }}/>
                    )}
                  </div>
                  {n.title && (
                    <div style={{
                      fontSize:13, fontWeight: n.is_read ? 500 : 700,
                      color:T.ink, marginBottom:2, lineHeight:1.4,
                    }}>{n.title}</div>
                  )}
                  {n.body && (
                    <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.55 }}>
                      {n.body}
                    </div>
                  )}
                  {/* Ablehnungsgrund bei content_rejected */}
                  {n.type === "content_rejected" && n.metadata?.rejection_reason && (
                    <div style={{
                      marginTop:5, padding:"6px 10px", borderRadius:"8px",
                      background:"rgba(239,68,68,0.07)",
                      border:"1px solid rgba(239,68,68,0.18)",
                      fontSize:11.5, color:"#DC2626", lineHeight:1.5,
                    }}>
                      <span style={{fontWeight:700}}>Grund: </span>
                      {n.metadata.rejection_reason}
                    </div>
                  )}
                  <div style={{ fontSize:11, color:T.inkFaint, marginTop:4 }}>
                    {fmtTime(n.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
