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
  work_approved:             { emoji:"✅", label:"Werk freigegeben" },
  work_rejected:             { emoji:"❌", label:"Werk abgelehnt" },
  experience_approved:       { emoji:"✅", label:"Erlebnis freigegeben" },
  experience_rejected:       { emoji:"❌", label:"Erlebnis abgelehnt" },
  project_approved:          { emoji:"✅", label:"Projekt freigegeben" },
  project_rejected:          { emoji:"❌", label:"Projekt abgelehnt" },
  impact_project_approved:   { emoji:"💚", label:"Herzensprojekt angenommen" },
  impact_project_rejected:   { emoji:"📋", label:"Herzensprojekt abgelehnt" },
  impact_project_submitted:  { emoji:"💚", label:"Herzensprojekt eingereicht" },
  admin_broadcast:    { emoji:"📣", label:"HUI Team" },
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


// ── RejectionModal — dynamisch für Werk / Erlebnis / Projekt ───────────────
function RejectionModal({ n, onClose }) {
const meta   = n.metadata || {};
const reason = meta.rejection_reason || meta.reason || "(Kein Grund angegeben)";

// Typ-spezifische Labels
const typeMap = {
  work_rejected:       { label:"Werk",     emoji:"🎨", hint:"Du kannst dein Werk überarbeiten und erneut einreichen." },
  content_rejected:    { label:"Inhalt",   emoji:"📝", hint:"Du kannst den Inhalt überarbeiten und erneut einreichen." },
  experience_rejected: { label:"Erlebnis", emoji:"🌿", hint:"Du kannst dein Erlebnis überarbeiten und erneut einreichen." },
  project_rejected:         { label:"Projekt",          emoji:"📌", hint:"Du kannst dein Projekt überarbeiten und erneut einreichen." },
  impact_project_rejected:  { label:"Herzensprojekt",   emoji:"💚", hint:"Du kannst dein Projekt überarbeiten und erneut einreichen." },
};
const tm      = typeMap[n.type] || { label:"Eintrag", emoji:"📋", hint:"Du kannst den Eintrag überarbeiten und erneut einreichen." };
const entryTitle = meta.entry_title || meta.project_name || meta.werk_title || meta.werk_id || `Dein ${tm.label}`;

return (
  <div
    onClick={onClose}
    style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"rgba(0,0,0,0.6)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:20,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background:"#fff", borderRadius:18, padding:"24px 20px 20px",
        maxWidth:340, width:"100%",
        boxShadow:"0 12px 50px rgba(0,0,0,0.22)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:36, marginBottom:6 }}>❌</div>
        <div style={{ fontSize:16, fontWeight:800, color:"#1a1a18" }}>
          {tm.label} abgelehnt
        </div>
      </div>

      {/* Eintrag-Name */}
      <div style={{
        background:"#f5f4f1", borderRadius:10, padding:"10px 14px",
        marginBottom:12, display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontSize:18 }}>{tm.emoji}</span>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.5px" }}>
            {tm.label}
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a1a18" }}>
            „{entryTitle}"
          </div>
        </div>
      </div>

      {/* Ablehnungsgrund */}
      <div style={{ marginBottom:20 }}>
        <div style={{
          fontSize:11, fontWeight:700, color:"#DC2626",
          textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8,
        }}>
          Nachricht vom Admin
        </div>
        <div style={{
          background:"rgba(239,68,68,0.06)",
          border:"1px solid rgba(239,68,68,0.22)",
          borderRadius:10, padding:"12px 14px",
          fontSize:14, color:"#1a1a18", lineHeight:1.6,
        }}>
          {reason}
        </div>
      </div>

      {/* Hinweis */}
      <div style={{
        fontSize:12, color:"#888", textAlign:"center",
        lineHeight:1.5, marginBottom:16,
      }}>
        {tm.hint}
      </div>

      {/* Schließen */}
      <button
        onClick={onClose}
        style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"#0EC4B8", border:"none", color:"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
        }}
      >
        Verstanden
      </button>
    </div>
  </div>
);
}

// ── ApprovalModal — für Herzensprojekt-Annahme ────────────────────────────────
function ApprovalModal({ n, onClose }) {
const meta       = n.metadata || {};
const projectName = meta.project_name || meta.entry_title || "Dein Herzensprojekt";

return (
  <div
    onClick={onClose}
    style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"rgba(0,0,0,0.6)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:20,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background:"#fff", borderRadius:18, padding:"24px 20px 20px",
        maxWidth:340, width:"100%",
        boxShadow:"0 12px 50px rgba(0,0,0,0.22)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:36, marginBottom:6 }}>💚</div>
        <div style={{ fontSize:16, fontWeight:800, color:"#1a1a18" }}>
          Herzlichen Glückwunsch!
        </div>
      </div>

      {/* Projekt-Name */}
      <div style={{
        background:"#f0fdf4", borderRadius:10, padding:"10px 14px",
        marginBottom:12, display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontSize:18 }}>💚</span>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.5px" }}>
            Herzensprojekt
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a1a18" }}>
            „{projectName}"
          </div>
        </div>
      </div>

      {/* Nachricht */}
      <div style={{ marginBottom:20 }}>
        <div style={{
          fontSize:11, fontWeight:700, color:"#0EC4B8",
          textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8,
        }}>
          Nachricht vom Admin
        </div>
        <div style={{
          background:"rgba(14,196,184,0.07)",
          border:"1px solid rgba(14,196,184,0.3)",
          borderRadius:10, padding:"12px 14px",
          fontSize:14, color:"#1a1a18", lineHeight:1.6,
        }}>
          Glückwunsch! 🎉 Dein Projekt wurde angenommen. Ein Admin wird sich innerhalb von
          <strong> 14 Tagen</strong> persönlich bei dir melden — per E-Mail, Telefon oder persönlich.
        </div>
      </div>

      {/* Schließen */}
      <button
        onClick={onClose}
        style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"#0EC4B8", border:"none", color:"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
        }}
      >
        Super, danke!
      </button>
    </div>
  </div>
);
}

function NotifCard({ n, meta, onRead, onAction = () => {} }) {
const [showModal,         setShowModal]         = React.useState(false);
const [showApprovalModal, setShowApprovalModal] = React.useState(false);

const isRejection = n.type === "work_rejected" || n.type === "content_rejected"
  || n.type === "experience_rejected" || n.type === "project_rejected"
  || n.type === "impact_project_rejected";

const isImpactApproval = n.type === "impact_project_approved";

const handleCardClick = () => {
  if (!n.is_read) onRead?.(n.id);
  if (isRejection)     { setShowModal(true);         return; }
  if (isImpactApproval){ setShowApprovalModal(true);  return; }
  onAction(n);
};

const handleDetailBtn = (e) => {
  e.stopPropagation();
  if (!n.is_read) onRead?.(n.id);
  setShowModal(true);
};

const handleApprovalBtn = (e) => {
  e.stopPropagation();
  if (!n.is_read) onRead?.(n.id);
  setShowApprovalModal(true);
};

return (
  <>
    {showModal && isRejection && (
      <RejectionModal n={n} onClose={() => setShowModal(false)} />
    )}
    {showApprovalModal && isImpactApproval && (
      <ApprovalModal n={n} onClose={() => setShowApprovalModal(false)} />
    )}
    <div
      onClick={handleCardClick}
      style={{
        borderRadius:T.r12, marginBottom:8, overflow:"hidden",
        background: n.is_read ? T.bgCard : T.tealSoft,
        border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
        cursor:"pointer", transition:"background .15s",
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px" }}>
        {/* Icon */}
        <div style={{
          width:38, height:38, borderRadius:"50%", flexShrink:0,
          background: n.is_read ? "rgba(26,26,24,0.05)" : T.tealSoft,
          border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
        }}>{meta.emoji}</div>

        {/* Inhalt */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
            <span style={{ fontSize:11, fontWeight:700, color: n.is_read ? T.inkFaint : T.teal }}>
              {meta.label}
            </span>
            {!n.is_read && (
              <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block" }}/>
            )}
          </div>
          {n.title && (
            <div style={{ fontSize:13, fontWeight: n.is_read ? 500 : 700, color:T.ink, marginBottom:2, lineHeight:1.4 }}>
              {n.title}
            </div>
          )}
          {n.body && (
            <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.55 }}>
              {n.body}
            </div>
          )}

          {/* Detail-Button für Ablehnungen — immer sichtbar */}
          {isRejection && (
            <button
              onClick={handleDetailBtn}
              style={{
                marginTop:8, padding:"5px 12px",
                borderRadius:99, border:"1.5px solid rgba(239,68,68,0.4)",
                background:"rgba(239,68,68,0.08)", color:"#DC2626",
                fontSize:11, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit", display:"inline-flex",
                alignItems:"center", gap:5,
              }}
            >
              <span>📋</span> Grund lesen
            </button>
          )}

          {/* Detail-Button für Impact-Annahmen */}
          {isImpactApproval && (
            <button
              onClick={handleApprovalBtn}
              style={{
                marginTop:8, padding:"5px 12px",
                background:"rgba(14,196,184,0.10)",
                border:"1px solid rgba(14,196,184,0.4)",
                borderRadius:99, cursor:"pointer",
                fontSize:12, fontWeight:600, color:"#0EC4B8",
                display:"flex", alignItems:"center", gap:5,
              }}
            >
              <span>💚</span> Details lesen
            </button>
          )}

          <div style={{ fontSize:11, color:T.inkFaint, marginTop:6 }}>
            {fmtTime(n.created_at)}
          </div>
        </div>
      </div>
    </div>
  </>
);
}


export default function NotificationPanel({ userId, onClose, onUnreadChange, onAction = () => {} }) {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all"); // all | unread

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
              <NotifCard
                key={n.id}
                n={n}
                meta={meta}
                onRead={markRead}
                onAction={onAction}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
