// src/pages/studio/MeineTicketsPage.jsx
// Support-Tickets als E-Mail-Thread-Verlauf
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { toast } from "../../lib/useToast.jsx";

const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  cream:  "#F9F7F4",
  ink:    "#1A1A1A",
  muted:  "rgba(80,80,80,0.55)",
  border: "rgba(0,0,0,0.08)",
  red:    "#EF4444",
  green:  "#10B981",
  gold:   "#F59E0B",
};

const STATUS_CFG = {
  open:    { label:"Offen",       color:C.red,   bg:"rgba(239,68,68,0.08)",  icon:"🔴" },
  replied: { label:"Beantwortet", color:C.gold,  bg:"rgba(245,158,11,0.08)", icon:"🟡" },
  closed:  { label:"Geschlossen", color:C.green, bg:"rgba(16,185,129,0.08)", icon:"🟢" },
};
const CATEGORY_ICONS = {
  fehler:"🐛", verbesserung:"💡", anfrage:"📋", hilfe:"🆘",
  passwort:"🔐", konto:"◎", zahlung:"💳", sonstiges:"📝", system:"⚙️",
};

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("de-DE", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}
function timeAgo(iso) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1)    return "Gerade eben";
  if (d < 60)   return `Vor ${d} Min.`;
  if (d < 1440) return `Vor ${Math.floor(d / 60)} Std.`;
  return new Date(iso).toLocaleDateString("de-DE");
}

// ── Reply Compose (Bottom Sheet) ─────────────────────────────────────────────
function ReplySheet({ ticketNumber, subject, adminReply, userId, userEmail, userName, onClose, onSent }) {
  const [text,    setText]    = useState("");
  const [files,   setFiles]   = useState([]);
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const fileRef = useRef(null);

  const handleFiles = e => {
    const sel = Array.from(e.target.files || []).slice(0, 3);
    setFiles(prev => [...prev, ...sel].slice(0, 3));
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const attachments = [];
      for (const file of files) {
        try {
          const ext  = file.name.split(".").pop();
          const path = `support/${ticketNumber}/reply-${Date.now()}.${ext}`;
          const { data: up, error: upErr } = await supabase.storage
            .from("media").upload(path, file, { cacheControl:"3600", upsert:false });
          if (!upErr && up) {
            const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
            attachments.push({ name:file.name, url:urlData.publicUrl, type:file.type, size:file.size });
          }
        } catch { /* optional */ }
      }

      // Direkt via Supabase insert (RLS WITH CHECK erlaubt user eigene Einträge)
      const { error } = await supabase.from("notifications").insert({
        user_id:  userId,
        type:     "support_ticket",
        title:    `[${ticketNumber}] RE: ${subject}`,
        body:     text.trim().slice(0, 200),
        data: {
          ticket_number:    ticketNumber,
          name:             userName ?? "",
          email:            userEmail ?? "",
          category:         "anfrage",
          priority:         "normal",
          subject:          `RE: ${subject}`,
          message:          text.trim(),
          status:           "open",
          attachments,
          admin_reply:      null,
          replied_at:       null,
          read_by_admin:    false,
          is_followup:      true,
          original_subject: subject,
        },
        is_read: false,
        read:    false,
      });
      if (error) { console.error("Supabase insert error:", error); throw new Error(error.message || JSON.stringify(error)); }
      setSent(true);
      setTimeout(() => { onSent(); onClose(); }, 1600);
    } catch (err) {
      console.error("ReplySheet send error:", err);
      toast.error("Fehler beim Senden: " + (err?.message || String(err)));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:9998,
      }} />
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:9999,
        background:"white", borderRadius:"20px 20px 0 0",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
        paddingBottom:"max(100px,calc(80px + env(safe-area-inset-bottom,0px)))",
        animation:"slideUp 0.28s cubic-bezier(.32,1,.5,1) both",
      }}>
        <style>{`@keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }`}</style>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)" }} />
        </div>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"6px 20px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:C.ink }}>Antwort an Support</p>
            <p style={{ margin:0, fontSize:11, color:C.muted }}>
              Ticket {ticketNumber}
            </p>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8,
            background:"rgba(0,0,0,0.06)", border:"none", cursor:"pointer",
            fontSize:16, color:C.muted }}>×</button>
        </div>

        <div style={{ padding:"14px 20px 0" }}>
          {/* Zitat */}
          {adminReply && (
            <div style={{ background:"rgba(22,215,197,0.05)", borderLeft:`3px solid ${C.teal}`,
              borderRadius:"0 8px 8px 0", padding:"8px 12px", marginBottom:12 }}>
              <p style={{ margin:"0 0 3px", fontSize:10, fontWeight:700, color:C.teal,
                textTransform:"uppercase", letterSpacing:"0.06em" }}>Support-Antwort (Zitat)</p>
              <p style={{ margin:0, fontSize:12, color:C.muted, lineHeight:1.5,
                overflow:"hidden", maxHeight:52,
                display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
                {adminReply}
              </p>
            </div>
          )}

          {sent ? (
            <div style={{ textAlign:"center", padding:"24px 0 8px" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:C.green }}>Gesendet!</p>
            </div>
          ) : (
            <>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Deine Antwort…" rows={5} autoFocus
                style={{ width:"100%", padding:"12px 14px", borderRadius:12,
                  border:`1.5px solid ${text.trim() ? C.teal : C.border}`,
                  background:"rgba(0,0,0,0.02)", color:C.ink, fontSize:14,
                  lineHeight:1.55, resize:"none", outline:"none",
                  fontFamily:"inherit", boxSizing:"border-box",
                  transition:"border-color 0.15s" }} />
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginTop:6, marginBottom:12 }}>
                <p style={{ margin:0, fontSize:11, color:C.muted }}>{text.length} Zeichen</p>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {files.map((f,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:4,
                      padding:"3px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)",
                      border:`1px solid ${C.border}`, fontSize:11 }}>
                      <span>{f.type?.startsWith("image") ? "🖼" : "📄"}</span>
                      <span style={{ maxWidth:60, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {f.name}
                      </span>
                      <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))}
                        style={{ background:"none", border:"none", cursor:"pointer",
                          color:C.muted, fontSize:12, padding:0 }}>×</button>
                    </div>
                  ))}
                  <input ref={fileRef} type="file" multiple
                    accept="image/*,.pdf,.doc,.docx" onChange={handleFiles}
                    style={{ display:"none" }} />
                  <button onClick={() => fileRef.current?.click()}
                    style={{ padding:"4px 10px", borderRadius:7,
                      border:`1px solid ${C.border}`, background:"transparent",
                      color:C.muted, fontSize:12, cursor:"pointer" }}>📎</button>
                </div>
              </div>
              <button onClick={handleSend} disabled={!text.trim() || sending}
                style={{ width:"100%", padding:"14px", borderRadius:13, border:"none",
                  background:(!text.trim() || sending) ? "rgba(22,215,197,0.35)" : C.teal,
                  color:"white", fontSize:15, fontWeight:700,
                  cursor:(!text.trim() || sending) ? "default" : "pointer" }}>
                {sending ? "⏳ Wird gesendet…" : "📨 Antwort senden"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Thread-Nachricht Bubble ───────────────────────────────────────────────────
function MessageBubble({ role, text, time, attachments }) {
  const isUser    = role === "user";
  const isSupport = role === "support";
  return (
    <div style={{ display:"flex", flexDirection:"column",
      alignItems: isUser ? "flex-end" : "flex-start",
      marginBottom:2 }}>
      {/* Absender-Label */}
      <p style={{ margin:"0 0 4px", fontSize:10, fontWeight:700,
        color: isUser ? C.muted : C.teal,
        textTransform:"uppercase", letterSpacing:"0.06em",
        paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0 }}>
        {isUser ? "Du" : "✅ HUI-Support"}
      </p>
      {/* Bubble */}
      <div style={{
        maxWidth:"85%",
        background: isUser
          ? "white"
          : "rgba(22,215,197,0.08)",
        border: isUser
          ? `1px solid ${C.border}`
          : "1.5px solid rgba(22,215,197,0.25)",
        borderRadius: isUser
          ? "16px 4px 16px 16px"
          : "4px 16px 16px 16px",
        padding:"10px 14px",
      }}>
        <p style={{ margin:0, fontSize:13, color:C.ink, lineHeight:1.6,
          whiteSpace:"pre-wrap", wordBreak:"break-word", overflowWrap:"anywhere" }}>{text}</p>
        {/* Anhänge */}
        {attachments?.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
            {attachments.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:5,
                  padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`,
                  textDecoration:"none", color:C.ink, fontSize:11,
                  background:"rgba(0,0,0,0.03)" }}>
                <span>{a.type?.startsWith("image") ? "🖼" : "📄"}</span>
                <span style={{ maxWidth:100, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
      {/* Zeit */}
      <p style={{ margin:"3px 0 0", fontSize:10, color:C.muted,
        paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0 }}>
        {time}
      </p>
    </div>
  );
}

// ── Thread-Ansicht — alle Nachrichten einer Ticket-Nummer ────────────────────
function TicketThread({ ticketNumber, subject, allTickets, profile, onBack }) {
  const [showReply, setShowReply] = useState(false);
  const bottomRef = useRef(null);

  // Alle Notifications dieser Ticket-Nummer chronologisch sortieren
  const thread = allTickets
    .filter(t => (t.data?.ticket_number ?? "") === ticketNumber)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Status des neuesten Tickets
  const latest = thread[thread.length - 1];
  const latestData = latest?.data ?? {};
  const sc = STATUS_CFG[latestData.status ?? "open"] ?? STATUS_CFG.open;
  const isClosed = latestData.status === "closed";
  // Letzte Admin-Antwort für Zitat
  const lastAdminReply = [...thread].reverse().find(t => t.data?.admin_reply)?.data?.admin_reply ?? null;

  // Nachrichten-Bubbles aufbauen
  const messages = [];
  thread.forEach(t => {
    const d = t.data ?? {};
    // User-Nachricht
    messages.push({
      id:          t.id + "_user",
      role:        "user",
      text:        d.message ?? "",
      time:        fmt(t.created_at),
      attachments: d.attachments ?? [],
    });
    // Support-Antwort falls vorhanden
    if (d.admin_reply) {
      messages.push({
        id:   t.id + "_support",
        role: "support",
        text: d.admin_reply,
        time: fmt(d.replied_at),
        attachments: [],
      });
    }
  });

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
  }, []);

  const handleSent = () => {
    // reload via onBack + re-open
    onBack(true);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:C.cream, display:"flex",
      flexDirection:"column",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      zIndex:10 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 14px",
        background:"white", borderBottom:`1px solid ${C.border}`,
        flexShrink:0 }}>
        <button onClick={() => onBack(false)} style={{ width:36, height:36, borderRadius:10,
          background:"rgba(0,0,0,0.05)", border:"none", cursor:"pointer", fontSize:16,
          display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:C.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {subject}
          </p>
          <div style={{ display:"flex", gap:6, marginTop:2, alignItems:"center" }}>
            <span style={{ fontFamily:"monospace", fontSize:11, color:C.teal }}>
              {ticketNumber}
            </span>
            <span style={{ fontSize:11, fontWeight:700, padding:"1px 6px", borderRadius:4,
              background:sc.bg, color:sc.color }}>{sc.icon} {sc.label}</span>
          </div>
        </div>
      </div>

      {/* Thread-Verlauf */}
      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch",
        padding:"16px 16px 160px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Kategorie-Meta einmalig oben */}
        {thread[0] && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:C.muted, background:"white",
              border:`1px solid ${C.border}`, padding:"3px 8px", borderRadius:5 }}>
              📅 {fmt(thread[0].created_at)}
            </span>
            {thread[0].data?.category && (
              <span style={{ fontSize:11, color:C.muted, background:"white",
                border:`1px solid ${C.border}`, padding:"3px 8px", borderRadius:5 }}>
                {CATEGORY_ICONS[thread[0].data.category] ?? "📝"} {thread[0].data.category}
              </span>
            )}
          </div>
        )}

        {/* Nachrichten */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} {...msg} />
        ))}

        {/* Warte-Hinweis wenn letzte Nachricht von User */}
        {messages[messages.length - 1]?.role === "user" && !isClosed && (
          <div style={{ textAlign:"center", padding:"8px 0" }}>
            <span style={{ fontSize:11, color:C.muted, background:"rgba(245,158,11,0.07)",
              border:"1px solid rgba(245,158,11,0.2)", padding:"4px 12px", borderRadius:12 }}>
              ⏳ Wird bearbeitet — wir melden uns per E-Mail
            </span>
          </div>
        )}

        <p style={{ textAlign:"center", fontSize:12, color:C.muted, margin:"4px 0" }}>
          Fragen? <a href="mailto:support@be-hui.com" style={{ color:C.teal }}>
            support@be-hui.com
          </a>
        </p>
        <div ref={bottomRef} />
      </div>

      {/* Antworten-Button */}
      {!isClosed && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:15,
          padding:"12px 16px max(96px,calc(80px + env(safe-area-inset-bottom,0px)))",
          background:"linear-gradient(to top, white 80%, transparent)" }}>
          <button onClick={() => setShowReply(true)} style={{
            width:"100%", padding:"14px", borderRadius:13, border:"none",
            background:C.teal, color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", boxShadow:"0 4px 16px rgba(22,215,197,0.35)" }}>
            ↩ Antworten
          </button>
        </div>
      )}

      {/* Reply Sheet */}
      {showReply && (
        <ReplySheet
          ticketNumber={ticketNumber}
          subject={subject}
          adminReply={lastAdminReply}
          userId={profile?.id}
          userEmail={profile?.email}
          userName={profile?.display_name || profile?.full_name}
          onClose={() => setShowReply(false)}
          onSent={handleSent}
        />
      )}
    </div>
  );
}

// ── Ticket-Kachel (Übersicht — 1 pro Ticket-Nummer) ──────────────────────────
function ThreadCard({ ticketNumber, tickets, onOpen }) {
  // Neuestes Ticket dieser Nummer
  const sorted  = [...tickets].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  const latest  = sorted[0];
  const d       = latest?.data ?? {};
  const subject = tickets.find(t => !t.data?.is_followup)?.data?.subject ?? d.subject ?? "—";
  const sc      = STATUS_CFG[d.status ?? "open"] ?? STATUS_CFG.open;
  const hasReply = tickets.some(t => t.data?.admin_reply);
  const msgCount = tickets.length;

  return (
    <button onClick={() => onOpen(ticketNumber, subject)} style={{
      width:"100%", textAlign:"left", background:"white",
      border:`1px solid ${C.border}`, borderRadius:14,
      padding:"14px 16px", cursor:"pointer",
      boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", marginBottom:8 }}>
        <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700,
          color:C.teal, background:"rgba(22,215,197,0.08)",
          padding:"2px 8px", borderRadius:5 }}>
          {ticketNumber}
        </span>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {msgCount > 1 && (
            <span style={{ fontSize:10, fontWeight:700, color:C.muted,
              background:"rgba(0,0,0,0.05)", padding:"1px 7px", borderRadius:10 }}>
              {msgCount} Nachrichten
            </span>
          )}
          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:5,
            background:sc.bg, color:sc.color }}>{sc.icon} {sc.label}</span>
        </div>
      </div>
      <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:600, color:C.ink,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {CATEGORY_ICONS[d.category] ?? "📝"} {subject}
      </p>
      <p style={{ margin:0, fontSize:12, color:C.muted,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {d.message?.slice(0, 80)}{(d.message?.length ?? 0) > 80 ? "…" : ""}
      </p>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
        <span style={{ fontSize:11, color:C.muted }}>{timeAgo(latest?.created_at)}</span>
        {hasReply && (
          <span style={{ fontSize:11, color:C.teal, fontWeight:600 }}>✉ Antwort erhalten</span>
        )}
      </div>
    </button>
  );
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────
export default function MeineTicketsPage({ onBack, userId, profile }) {
  const [tickets,       setTickets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeThread,  setActiveThread]  = useState(null); // { ticketNumber, subject }

  const load = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "support_ticket")
      .order("created_at", { ascending: false })
      .limit(100);
    setTickets(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  // Tickets nach Ticket-Nummer gruppieren
  const grouped = {};
  tickets.forEach(t => {
    const nr = t.data?.ticket_number ?? "unbekannt";
    if (!grouped[nr]) grouped[nr] = [];
    grouped[nr].push(t);
  });
  const threadNumbers = Object.keys(grouped).sort((a, b) => {
    const latestA = Math.max(...grouped[a].map(t => new Date(t.created_at).getTime()));
    const latestB = Math.max(...grouped[b].map(t => new Date(t.created_at).getTime()));
    return latestB - latestA;
  });

  const handleThreadBack = (reload) => {
    setActiveThread(null);
    if (reload) load();
  };

  if (activeThread) {
    return (
      <TicketThread
        ticketNumber={activeThread.ticketNumber}
        subject={activeThread.subject}
        allTickets={tickets.filter(t => (t.data?.ticket_number ?? "") === activeThread.ticketNumber)}
        profile={profile}
        onBack={handleThreadBack}
      />
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:C.cream, display:"flex",
      flexDirection:"column",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:"white", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:10,
          background:"rgba(0,0,0,0.05)", border:"none", cursor:"pointer", fontSize:16,
          display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
        <div>
          <p style={{ margin:0, fontSize:17, fontWeight:700, color:C.ink }}>Meine Tickets</p>
          <p style={{ margin:0, fontSize:12, color:C.muted }}>Dein Support-Verlauf</p>
        </div>
        <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700,
          color:C.muted, background:"rgba(0,0,0,0.05)",
          padding:"3px 9px", borderRadius:6 }}>{threadNumbers.length}</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch",
        padding:"16px 16px 48px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:C.muted, fontSize:13 }}>
            ⏳ Lade Tickets…
          </div>
        ) : threadNumbers.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎟</div>
            <p style={{ fontSize:14, fontWeight:600, color:C.ink, margin:"0 0 6px" }}>
              Noch keine Tickets
            </p>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>
              Wenn du den Support kontaktierst, erscheinen deine Tickets hier.
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {threadNumbers.map(nr => (
              <ThreadCard
                key={nr}
                ticketNumber={nr}
                tickets={grouped[nr]}
                onOpen={(ticketNumber, subject) => setActiveThread({ ticketNumber, subject })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
