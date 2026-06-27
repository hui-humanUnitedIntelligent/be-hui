import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";

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
  admin_broadcast:           { emoji:"📣", label:"HUI Team" },
  broadcast:                 { emoji:"📣", label:"HUI Team" },
  ambassador_approved:       { emoji:"🌟", label:"Ambassador" },
  ambassador_rejected:       { emoji:"❌", label:"Ambassador" },
  ambassador_revoked:        { emoji:"⚠️", label:"Ambassador" },
  new_follower:              { emoji:"👥", label:"Verbindung" },
  new_message:               { emoji:"💬", label:"Nachricht" },
  work_like:                 { emoji:"❤️", label:"Werk" },
  booking_request:           { emoji:"📅", label:"Buchung" },
  booking_confirmed:         { emoji:"✅", label:"Buchung" },
  impact_vote:               { emoji:"🗳️", label:"Impact" },
  referral_joined:           { emoji:"🎉", label:"Empfehlung" },
  content_approved:          { emoji:"✅", label:"Freigegeben" },
  content_rejected:          { emoji:"❌", label:"Abgelehnt" },
  content_pending:           { emoji:"🔍", label:"In Prüfung" },
  work_approved:             { emoji:"✅", label:"Werk freigegeben" },
  work_rejected:             { emoji:"❌", label:"Werk abgelehnt" },
  experience_approved:       { emoji:"✅", label:"Erlebnis freigegeben" },
  experience_rejected:       { emoji:"❌", label:"Erlebnis abgelehnt" },
  project_approved:          { emoji:"✅", label:"Projekt freigegeben" },
  project_rejected:          { emoji:"❌", label:"Projekt abgelehnt" },
  impact_project_approved:   { emoji:"💚", label:"Herzensprojekt angenommen" },
  impact_project_rejected:   { emoji:"📋", label:"Herzensprojekt abgelehnt" },
  impact_project_submitted:  { emoji:"💚", label:"Herzensprojekt eingereicht" },
  support_reply:             { emoji:"🎫", label:"Support-Antwort" },
  default:                   { emoji:"🔔", label:"Benachrichtigung" },
};

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)    return "Gerade eben";
  if (diff < 3600)  return `vor ${Math.floor(diff/60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std.`;
  if (diff < 604800)return `vor ${Math.floor(diff/86400)} Tag(en)`;
  return d.toLocaleDateString("de-DE", { day:"numeric", month:"short" });
}

// ── Universelles Detail-Modal ─────────────────────────────────────────────────
function DetailModal({ n, meta, onClose }) {
  const parseMeta = (raw) => {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  };
  const md = parseMeta(n.metadata);

  const isRejection = n.type?.includes("rejected");
  const isApproval  = n.type?.includes("approved");

  const accentColor = isRejection ? "#DC2626" : isApproval ? "#16a34a" : "#0EC4B8";
  const accentBg    = isRejection ? "rgba(239,68,68,0.06)" : isApproval ? "rgba(22,163,74,0.06)" : "rgba(14,196,184,0.06)";
  const accentBorder= isRejection ? "rgba(239,68,68,0.2)" : isApproval ? "rgba(22,163,74,0.2)" : "rgba(14,196,184,0.2)";

  // Extra-Infos aus Metadata
  const extras = [];
  if (md.rejection_reason || md.reason) extras.push({ label: "Grund", value: md.rejection_reason || md.reason });
  if (md.entry_title || md.project_name || md.werk_title) extras.push({ label: "Betreff", value: md.entry_title || md.project_name || md.werk_title });
  if (md.ticket_id) extras.push({ label: "Ticket", value: md.ticket_id });
  if (md.sender_name) extras.push({ label: "Von", value: md.sender_name });

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:999999,
        background:"rgba(0,0,0,0.55)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        padding:"0 0 0 0",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff",
          borderRadius:"20px 20px 0 0",
          padding:"24px 20px 32px",
          width:"100%", maxWidth:480,
          boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
          maxHeight:"85vh", overflowY:"auto",
        }}
      >
        {/* Drag Handle */}
        <div style={{ width:36, height:4, borderRadius:99, background:"#e0e0e0", margin:"0 auto 20px" }} />

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{
            width:44, height:44, borderRadius:"50%",
            background: accentBg, border:`1px solid ${accentBorder}`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0,
          }}>{meta.emoji}</div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color: accentColor, textTransform:"uppercase", letterSpacing:"0.5px" }}>
              {meta.label}
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:"#1a1a18", lineHeight:1.3 }}>
              {n.title || meta.label}
            </div>
          </div>
        </div>

        {/* Hauptinhalt */}
        {n.body && (
          <div style={{
            background: accentBg,
            border:`1px solid ${accentBorder}`,
            borderRadius:12, padding:"14px 16px",
            fontSize:14, color:"#1a1a18", lineHeight:1.7,
            marginBottom:16, whiteSpace:"pre-wrap", wordBreak:"break-word",
          }}>
            {n.body}
          </div>
        )}

        {/* Extra Metadata */}
        {extras.length > 0 && (
          <div style={{ marginBottom:16 }}>
            {extras.map(({ label, value }) => (
              <div key={label} style={{
                display:"flex", gap:8, padding:"8px 0",
                borderBottom:"1px solid rgba(26,26,24,0.07)",
              }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#999", minWidth:60 }}>{label}</span>
                <span style={{ fontSize:13, color:"#1a1a18", lineHeight:1.5, flex:1 }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Zeitstempel */}
        <div style={{ fontSize:12, color:"#aaa", marginBottom:20 }}>
          {n.created_at ? new Date(n.created_at).toLocaleString("de-DE", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) : ""}
        </div>

        {/* Schließen */}
        <button
          onClick={onClose}
          style={{
            width:"100%", padding:"14px",
            borderRadius:99, border:"none",
            background: accentColor, color:"#fff",
            fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}
        >
          Schließen
        </button>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}

// ── RejectionModal (behalten für Kompatibilität, nutzt jetzt DetailModal) ────
function RejectionModal({ n, onClose }) {
  const meta = TYPE_META[n.type] || TYPE_META.default;
  return <DetailModal n={n} meta={meta} onClose={onClose} />;
}

function ApprovalModal({ n, onClose }) {
  const meta = TYPE_META[n.type] || TYPE_META.default;
  return <DetailModal n={n} meta={meta} onClose={onClose} />;
}

// ── NotifCard ─────────────────────────────────────────────────────────────────
function NotifCard({ n, meta, onRead, onAction = () => {} }) {
  const [showDetail, setShowDetail] = useState(false);

  const isRejection    = n.type?.includes("rejected");
  const isApproval     = n.type?.includes("approved");
  const d              = (n.data && typeof n.data === "object") ? n.data : {};
  const fullText       = d.admin_reply || d.message || d.reason || n.body || "";
  const hasLongBody    = fullText.length > 30;
  const showDetailBtn  = true; // immer Detail-Button

  const handleCardClick = () => {
    if (!n.is_read) onRead?.(n.id);
    if (showDetailBtn) { setShowDetail(true); return; }
    onAction(n);
  };

  const handleDetailBtn = (e) => {
    e.stopPropagation();
    if (!n.is_read) onRead?.(n.id);
    setShowDetail(true);
  };

  // Farben je nach Typ
  const isRed   = isRejection;
  const isGreen = isApproval;
  const btnColor  = isRed ? "#DC2626" : isGreen ? "#16a34a" : "#0EC4B8";
  const btnBg     = isRed ? "rgba(239,68,68,0.08)" : isGreen ? "rgba(22,163,74,0.08)" : "rgba(14,196,184,0.08)";
  const btnBorder = isRed ? "rgba(239,68,68,0.35)" : isGreen ? "rgba(22,163,74,0.35)" : "rgba(14,196,184,0.35)";
  const btnLabel  = isRed ? "📋 Grund lesen" : isGreen ? "💚 Details" : "Details lesen";

  // Body-Preview aus fullText (data.admin_reply, data.message, n.body)
  const bodyPreview = fullText ? (fullText.length > 80 ? fullText.slice(0, 80) + "…" : fullText) : null;

  return (
    <>
      {showDetail && (
        <DetailModal n={{...n, body: fullText || n.body}} meta={meta} onClose={() => setShowDetail(false)} />
      )}
      <div
        onClick={handleCardClick}
        style={{
          borderRadius: T.r12, marginBottom:8, overflow:"hidden",
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

            {/* Body-Preview immer anzeigen */}
            {bodyPreview && (
              <div style={{ fontSize:12, color: isRed ? "#DC2626" : T.inkSoft, lineHeight:1.55, fontStyle: isRed ? "italic" : "normal" }}>
                {bodyPreview}
              </div>
            )}

            {/* Details-Button — für alle mit Inhalt */}
            {showDetailBtn && (
              <button
                onClick={handleDetailBtn}
                style={{
                  marginTop:8, padding:"5px 12px",
                  borderRadius:99,
                  border:`1.5px solid ${btnBorder}`,
                  background: btnBg,
                  color: btnColor,
                  fontSize:11, fontWeight:700, cursor:"pointer",
                  fontFamily:"inherit",
                  display:"inline-flex", alignItems:"center", gap:4,
                }}
              >
                {btnLabel}
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

// ── Kategorisierung ───────────────────────────────────────────────────────────
const WICHTIG = new Set(["booking_request","booking_confirmed","impact_project_approved","impact_project_rejected","work_rejected","experience_rejected","project_rejected","content_rejected","ambassador_approved","ambassador_rejected"]);
const INFORMATIV = new Set(["admin_broadcast","broadcast","referral_joined","new_follower","work_approved","experience_approved","project_approved","content_approved","impact_project_submitted"]);
function getCategory(type) {
  if (WICHTIG.has(type))   return "Wichtig";
  if (INFORMATIV.has(type)) return "Informativ";
  return "Relevant";
}

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
        .select("id,type,title,body,is_read,action_url,created_at,actor_id,metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80);
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

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifs-${userId}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"notifications", filter:`user_id=eq.${userId}` },
        (payload) => {
          setNotifs(prev => [payload.new, ...prev]);
          onUnreadChange?.(c => (c || 0) + 1);
        })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"notifications", filter:`user_id=eq.${userId}` },
        () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  async function markAllRead() {
    if (!userId) return;
    await supabase.from("notifications").update({ is_read:true }).eq("user_id", userId).eq("is_read", false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read:true })));
    onUnreadChange?.(0);
  }

  async function markRead(id) {
    await supabase.from("notifications").update({ is_read:true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read:true } : n));
    onUnreadChange?.(prev => Math.max(0, (prev || 0) - 1));
  }

  const unread  = notifs.filter(n => !n.is_read);
  const visible = tab === "Wichtig"    ? notifs.filter(n => getCategory(n.type) === "Wichtig")
                : tab === "Relevant"   ? notifs.filter(n => getCategory(n.type) === "Relevant")
                : tab === "Informativ" ? notifs.filter(n => getCategory(n.type) === "Informativ")
                : notifs;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000, display:"flex", flexDirection:"column", background:T.bg }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 20px 12px", borderBottom:`1px solid ${T.border}`, background:T.bgCard,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{fontSize:20}}>🔔</span>
          <span style={{fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.02em"}}>Resonanzzentrum</span>
          {unread.length > 0 && (
            <span style={{ background:T.teal, color:"white", borderRadius:T.r99, padding:"2px 8px", fontSize:11, fontWeight:700 }}>
              {unread.length}
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {unread.length > 0 && (
            <button onClick={markAllRead} style={{ padding:"5px 12px", border:"none", background:"none", fontSize:12, color:T.teal, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Alle gelesen
            </button>
          )}
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, background:T.bgCard, padding:"0 16px", overflowX:"auto" }}>
        {[
          ["all", `Alle ${notifs.length}`],
          ["Wichtig", "Wichtig"],
          ["Relevant", "Relevant"],
          ["Informativ", "Informativ"],
        ].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            padding:"10px 14px", border:"none", background:"none", whiteSpace:"nowrap",
            fontSize:12, fontWeight: tab===val ? 700 : 500,
            color: tab===val ? T.teal : T.inkFaint,
            borderBottom: tab===val ? `2px solid ${T.teal}` : "2px solid transparent",
            cursor:"pointer", fontFamily:"inherit",
          }}>{label}</button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:T.inkFaint, fontSize:13 }}>Lädt…</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{fontSize:32, marginBottom:10}}>🔔</div>
            <div style={{fontSize:14, color:T.inkFaint}}>Keine Benachrichtigungen</div>
          </div>
        ) : (
          visible.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.default;
            return <NotifCard key={n.id} n={n} meta={meta} onRead={markRead} onAction={onAction} />;
          })
        )}
      </div>
    </div>
  );
}
