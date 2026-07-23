import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import {
  HUIWarnIcon, HUIImpactIcon, HUISupportIcon, HUINachrichtIcon,
  HUIProfilIcon, HUIBenachrichtigungIcon,
} from '../../design/icons/HuiSystemIcons.jsx';
import { HUIHeartIcon } from '../../design/icons/HuiInteractionIcons.jsx';
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";

// ══════════════════════════════════════════════════════════════
// NOTIFICATION PANEL  — Side-Drawer, alle Modals inline (kein createPortal)
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

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1)  return "gerade eben";
  if (diff < 60) return `vor ${diff} Min`;
  const h = Math.floor(diff / 60);
  if (h < 24)   return `vor ${h} Std`;
  const days = Math.floor(h / 24);
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString("de-DE", { day:"numeric", month:"short" });
}

// ── Universelles Inline-Modal (kein createPortal!) ────────────────────────────
function InlineModal({ onClose, icon, title, subtitle, accentColor = "#0EC4B8", children, btnLabel = "Verstanden" }) {
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
          <div style={{ fontSize:17, fontWeight:800, color:"#1a1a18" }}>{title}</div>
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
            fontSize:15, fontWeight:700, cursor:"pointer",
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
const META = {
  work_approved:          { emoji:"✅", label:"Werk freigegeben"      },
  work_rejected:          { emoji:"❌", label:"Werk abgelehnt"         },
  content_rejected:       { emoji:"❌", label:"Inhalt abgelehnt"       },
  experience_approved:    { emoji:"✅", label:"Erlebnis freigegeben"   },
  experience_rejected:    { emoji:"❌", label:"Erlebnis abgelehnt"     },
  project_approved:       { emoji:"✅", label:"Projekt freigegeben"    },
  project_rejected:       { emoji:"❌", label:"Projekt abgelehnt"      },
  impact_project_approved:{ emoji:"💚", label:"Herzensprojekt angenommen" },
  impact_project_rejected:{ emoji:"💔", label:"Herzensprojekt abgelehnt" },
  admin_broadcast:        { emoji:"📢", label:"Nachricht vom Admin"    },
  broadcast:              { emoji:"📢", label:"Nachricht vom Admin"    },
  support_ticket_reply:   { emoji:"🎧", label:"Support hat geantwortet"},
  support_ticket:         { emoji:"🎧", label:"Support-Nachricht"      },
  work_sensitive:         { emoji:"⚠️", label:"Inhalt gemeldet"        },
  work_deleted:           { emoji:"🗑", label:"Werk entfernt"          },
  meldung_aufgehoben:     { emoji:"✅", label:"Meldung aufgehoben"     },
  new_follower:           { emoji:<HUIProfilIcon size={18}/>, label:"Neuer Follower"         },
  new_booking:            { emoji:"📅", label:"Neue Buchung"           },
  // MERKEN.6 (2026-07-08): zusammengefasste Merken-Digests (taeglich/
  // woechentlich), NIE eine Notification pro einzelnem Speichervorgang.
  save_digest:            { emoji:"🔖", label:"Gemerkt-Zusammenfassung" },
  // KOMMENTAR.1 (2026-07-09): Kommentar/Antwort auf eigenen Beitrag.
  comment:                { emoji:"💬", label:"Neuer Kommentar"        },
  comment_reply:          { emoji:"💬", label:"Antwort auf deinen Kommentar" },
  // RESONANZ.3 (2026-07-16): Resonanz auf eigenen Beitrag.
  resonanz:               { emoji:<HUIHeartIcon size={18}/>,            label:"Resonanz"               },
  like:                   { emoji:"✦",  label:"Gefällt jemandem"       },
  default:                { emoji:<HUIBenachrichtigungIcon size={18}/>, label:"Benachrichtigung"       },
};

function getMeta(type) { return META[type] || META.default; }

function parseMeta(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

function NotifCard({ n, onRead, onDelete, onAction = () => {} }) {
  const { openCreatorProfile } = useProfileLauncher();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const meta = getMeta(n.type);

  const isRejection  = n.type?.includes("_rejected");
  const isApproval   = n.type?.includes("_approved");
  const isSupport    = n.type === "support_ticket_reply" || n.type === "support_ticket";
  const isBroadcast  = n.type === "admin_broadcast" || n.type === "broadcast";
  const hasDetail    = isRejection || isApproval || isSupport || isBroadcast;

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!n.is_read) onRead?.(n.id);
    setOpen(true);
  };

  // ── Modal-Inhalt je Typ ────────────────────────────────────
  function ModalContent() {
    const md = parseMeta(n.metadata);

    if (isRejection) {
      const reason = md.rejection_reason || md.reason
        || (n.body?.match(/Grund[:：]\s*(.+)/s)?.[1]?.trim())
        || n.body
        || "(Kein Grund angegeben)";
      const typeMap = {
        work_rejected:       { label:"Werk",           emoji:"🎨" },
        content_rejected:    { label:"Inhalt",         emoji:"📝" },
        talent_rejected:     { label:"Talent",         emoji:"⭐" },
        experience_rejected: { label:"Erlebnis",       emoji:"🌿" },
        project_rejected:    { label:"Projekt",        emoji:"📌" },
        impact_project_rejected:{ label:"Herzensprojekt", emoji:"💚" },
      };
      const tm = typeMap[n.type] || { label:"Eintrag", emoji:"📋" };
      const entryTitle = md.entry_title || md.project_name || md.werk_title || `Dein ${tm.label}`;
      return (
        <InlineModal onClose={() => setOpen(false)} icon={<HUIWarnIcon size={20}/>}
          title={`${tm.label} abgelehnt`} accentColor="#DC2626"
          btnLabel="Verstanden">
          <div style={{ background:"#f5f4f1", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:20 }}>{tm.emoji}</span>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.5px" }}>{tm.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#1a1a18" }}>„{entryTitle}"</div>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#DC2626", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Nachricht vom Admin</div>
            <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:10, padding:"12px 14px", fontSize:14, color:"#1a1a18", lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{reason}</div>
          </div>
          <div style={{ fontSize:12, color:"#888", textAlign:"center", marginBottom:12, lineHeight:1.5 }}>Du kannst den Eintrag überarbeiten und erneut einreichen.</div>
        </InlineModal>
      );
    }

    if (isApproval) {
      const projectName = md.project_name || md.entry_title || n.title || "Dein Projekt";
      const msg = md.message || md.admin_note || n.body || "Herzlichen Glückwunsch!";
      return (
        <InlineModal onClose={() => setOpen(false)} icon={<HUIImpactIcon size={20}/>}
          title="Projekt angenommen!" subtitle={projectName} accentColor="#0EC4B8"
          btnLabel="Super, danke!">
          <div style={{ background:"rgba(14,196,184,0.06)", border:"1px solid rgba(14,196,184,0.22)", borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:14, color:"#1a1a18", lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{msg}</div>
        </InlineModal>
      );
    }

    if (isSupport) {
      const text = md.admin_reply || md.message || md.body || n.body || "(Keine Nachricht)";
      const ticketId = md.ticket_id || md.ticket_number || "";
      const subject  = md.subject || n.title || "Support-Antwort";
      return (
        <InlineModal onClose={() => setOpen(false)} icon={<HUISupportIcon size={20}/>}
          title="Support hat geantwortet"
          subtitle={ticketId || null}
          accentColor="#0EC4B8" btnLabel="Verstanden">
          {subject && subject !== "Support-Antwort" && (
            <div style={{ background:"#f5f4f1", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13, fontWeight:600, color:"#1a1a18" }}>{subject}</div>
          )}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#0EC4B8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Nachricht vom Support</div>
            <div style={{ background:"rgba(14,196,184,0.06)", border:"1px solid rgba(14,196,184,0.22)", borderRadius:10, padding:"12px 14px", fontSize:14, color:"#1a1a18", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{text}</div>
          </div>
        </InlineModal>
      );
    }

    if (isBroadcast) {
      const text  = md.message || md.body || n.body || "(Keine Nachricht)";
      const title = md.title || n.title || "Nachricht vom Admin";
      return (
        <InlineModal onClose={() => setOpen(false)} icon={<HUINachrichtIcon size={20}/>}
          title={title}
          subtitle="Nachricht vom Admin"
          accentColor="#0EC4B8" btnLabel="Verstanden">
          <div style={{ background:"rgba(14,196,184,0.06)", border:"1px solid rgba(14,196,184,0.22)", borderRadius:10, padding:"14px 16px", marginBottom:16, fontSize:14, color:"#1a1a18", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{text}</div>
        </InlineModal>
      );
    }

    return null;
  }

  const btnLabel = isRejection ? "Grund lesen"
    : isApproval              ? "Details lesen"
    : isSupport               ? "Antwort lesen"
    : isBroadcast             ? "Nachricht lesen"
    : "";

  const btnColor = isRejection ? { bg:"rgba(239,68,68,0.08)", border:"1.5px solid rgba(239,68,68,0.4)", color:"#DC2626" }
    : { bg:"rgba(14,196,184,0.08)", border:"1.5px solid rgba(14,196,184,0.35)", color:"#0EC4B8" };

  return (
    <>
      {open && <ModalContent />}
      <div
        onClick={hasDetail ? handleOpen : () => { if (!n.is_read) onRead?.(n.id); onAction(n); }}
        style={{
          borderRadius:T.r12, marginBottom:8, overflow:"hidden",
          background: n.is_read ? T.bgCard : T.tealSoft,
          border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
          cursor:"pointer", transition:"background .15s",
        }}
      >
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px" }}>
          <div style={{
            width:38, height:38, borderRadius:"50%", flexShrink:0,
            background: n.is_read ? "rgba(26,26,24,0.05)" : T.tealSoft,
            border:`1px solid ${n.is_read ? T.border : T.tealMid}`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
            cursor: n.actor_id ? "pointer" : "default",
            WebkitTapHighlightColor:"transparent",
          }}
          onClick={n.actor_id ? e => { e.stopPropagation(); openCreatorProfile(n.actor_id); } : undefined}
          >{meta.emoji}</div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <span style={{ fontSize:11, fontWeight:700, color: n.is_read ? T.inkFaint : T.teal }}>{meta.label}</span>
              {!n.is_read && <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block" }}/>}
            </div>
            {n.title && (
              <div style={{ fontSize:13, fontWeight: n.is_read ? 500 : 700, color:T.ink, marginBottom:2, lineHeight:1.4 }}>{n.title}</div>
            )}
            {n.body && (
              <div style={{ fontSize:12, color: isRejection ? "#DC2626" : T.inkSoft, lineHeight:1.55,
                overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2,
                WebkitBoxOrient:"vertical", wordBreak:"break-word" }}>
                {n.body}
              </div>
            )}

            {hasDetail && (
              <button
                onClick={handleOpen}
                style={{
                  marginTop:8, padding:"5px 12px",
                  borderRadius:99, border:btnColor.border,
                  background:btnColor.bg, color:btnColor.color,
                  fontSize:11, fontWeight:700, cursor:"pointer",
                  fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:5,
                }}
              >
                {isRejection ? "📋" : isApproval ? "💚" : isSupport ? "🎧" : "📢"} {btnLabel}
              </button>
            )}

            <div style={{ fontSize:11, color:T.inkFaint, marginTop:6 }}>{fmtTime(n.created_at)}</div>

            {/* Löschen-Button */}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                style={{
                  marginTop:6, padding:"3px 10px", borderRadius:99,
                  background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.20)",
                  color:"#DC2626", fontSize:11, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit",
                  display:"inline-flex", alignItems:"center", gap:4,
                }}
              >
                ✕ Löschen
              </button>
            )}
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
            <div style={{fontSize:16, fontWeight:800, color:"#1a1a18", marginBottom:8}}>Nachricht löschen?</div>
            <div style={{fontSize:13, color:"#888", marginBottom:20, lineHeight:1.5}}>
              Diese Benachrichtigung wird dauerhaft entfernt.
            </div>
            <div style={{display:"flex", gap:10}}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex:1, padding:"12px", borderRadius:99,
                  background:"rgba(26,26,24,0.07)", border:"none",
                  color:"#1a1a18", fontSize:13, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); onDelete?.(n.id); }}
                style={{
                  flex:1, padding:"12px", borderRadius:99,
                  background:"#DC2626", border:"none",
                  color:"#fff", fontSize:13, fontWeight:700,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── NotificationPanel (Side-Drawer) ────────────────────────────────────────
export default function NotificationPanel({ userId, onClose, onUnreadChange, onAction = () => {} }) {
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
          () => load())
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

  // ── Tab-Definitionen (3 Tabs): Alle / Relevant / Informativ ───────────────
  // "Relevant" = nutzer-bezogene Ereignisse (Werke, Talente, Projekte, Interaktionen)
  // "Informativ" = ausschließlich SADB-Broadcast-Nachrichten
  const BROADCAST_TYPES = ["admin_broadcast", "broadcast"];
  const RELEVANT_TYPES  = [
    // Werke
    "work_approved", "work_rejected", "content_rejected", "work_sensitive", "work_deleted",
    "meldung_aufgehoben",
    // Erlebnisse
    "experience_approved", "experience_rejected",
    // Projekte / Impact
    "project_approved", "project_rejected",
    "impact_project_approved", "impact_project_rejected",
    // Talente
    "talent_approved", "talent_rejected",
    // Interaktionen
    "new_follower", "new_booking", "support_ticket_reply", "support_ticket",
    "like", "resonanz", "comment", "comment_reply", "save_digest",
  ];

  const TAB_FILTERS = {
    all:       () => true,
    relevant:  n => RELEVANT_TYPES.includes(n.type),
    info:      n => BROADCAST_TYPES.includes(n.type),
  };

  const TABS = [
    { key:"all",      label:"Alle"      },
    { key:"relevant", label:"Relevant"  },
    { key:"info",     label:"Informativ"},
  ];

  const visible = notifs.filter(TAB_FILTERS[tab] || (() => true));
  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,0.35)" }} />

      {/* Drawer */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0,
        width:"min(420px, 100vw)", zIndex:10001,
        display:"flex", flexDirection:"column",
        background:T.bg, boxShadow:"-4px 0 32px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 12px", borderBottom:`1px solid ${T.border}`, background:T.bgCard }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <HUIBenachrichtigungIcon size={20} />
            <span style={{ fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>Resonanzzentrum</span>
            {unreadCount > 0 && (
              <span style={{ background:T.teal, color:"white", borderRadius:T.r99, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{unreadCount}</span>
            )}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, background:T.bgCard, padding:"0 20px", overflowX:"auto" }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:"10px 14px", border:"none", background:"none", cursor:"pointer",
              fontSize:12, fontWeight: tab === key ? 700 : 500,
              color: tab === key ? T.teal : T.inkSoft,
              borderBottom: tab === key ? `2px solid ${T.teal}` : "2px solid transparent",
              whiteSpace:"nowrap",
            }}>{label}</button>
          ))}
        </div>

        {/* Alle gelesen — nur im Tab "Alle" + wenn ungelesene vorhanden */}
        {tab === "all" && unreadCount > 0 && (
          <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"flex-end" }}>
            <button onClick={markAllRead} style={{
              fontSize:11, color:T.teal, background:"none", border:"none",
              cursor:"pointer", fontWeight:600, fontFamily:"inherit",
              padding:"4px 10px", borderRadius:99,
              border:`1px solid ${T.tealMid}`,
            }}>
              Alle gelesen ✓
            </button>
          </div>
        )}

        {/* Liste */}
        <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 24px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:T.inkFaint, fontSize:13 }}>Lädt…</div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ marginBottom:8, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIBenachrichtigungIcon size={36}/></div>
              <div style={{ fontSize:14, color:T.inkFaint }}>Keine Benachrichtigungen</div>
            </div>
          ) : (
            visible.map(n => (
              <NotifCard key={n.id} n={n} onRead={markRead} onDelete={deleteNotif} onAction={onAction} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
