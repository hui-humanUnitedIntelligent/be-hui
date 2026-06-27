// src/pages/studio/MeineTicketsPage.jsx
// Support-Ticket-Verlauf mit Antworten-Funktion
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient.js";

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

function timeAgo(iso) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1)    return "Gerade eben";
  if (d < 60)   return `Vor ${d} Min.`;
  if (d < 1440) return `Vor ${Math.floor(d / 60)} Std.`;
  return new Date(iso).toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" });
}

// ── Reply-Sheet (Bottom Drawer) ───────────────────────────────────────────────
function ReplySheet({ ticket, onClose, onSent }) {
  const d         = ticket.data ?? {};
  const [text, setText]       = useState("");
  const [files, setFiles]     = useState([]);
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
      // Anhänge hochladen
      const attachments = [];
      for (const file of files) {
        try {
          const ext  = file.name.split(".").pop();
          const path = `support/${d.ticket_number}/reply-${Date.now()}.${ext}`;
          const { data: up, error: upErr } = await supabase.storage
            .from("media").upload(path, file, { cacheControl:"3600", upsert:false });
          if (!upErr && up) {
            const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
            attachments.push({ name:file.name, url:urlData.publicUrl, type:file.type, size:file.size });
          }
        } catch { /* optional */ }
      }

      // Neue Notification mit gleicher Ticket-Nummer, status=open, als Folge-Ticket
      const followUpData = {
        ticket_number:   d.ticket_number,           // GLEICHE Nummer
        name:            d.name,
        email:           d.email,
        phone:           d.phone,
        category:        d.category,
        priority:        d.priority ?? "normal",
        subject:         `RE: ${d.subject}`,        // "RE:" Prefix
        message:         text.trim(),
        status:          "open",
        attachments,
        admin_reply:     null,
        replied_at:      null,
        read_by_admin:   false,
        is_followup:     true,                       // als Folge-Nachricht markieren
        original_ticket: ticket.id,                  // Referenz auf Original
      };

      const { error } = await supabase.from("notifications").insert({
        user_id:  ticket.user_id,
        type:     "support_ticket",
        title:    `[${d.ticket_number}] RE: ${d.subject}`,
        body:     text.trim().slice(0, 200),
        data:     followUpData,
        is_read:  false,
      });

      if (error) throw error;
      setSent(true);
      setTimeout(() => { onSent(); onClose(); }, 1800);
    } catch (err) {
      alert("Fehler beim Senden. Bitte versuche es erneut.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:20,
      }} />

      {/* Sheet */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:21,
        background:"white",
        borderRadius:"20px 20px 0 0",
        padding:"0 0 max(24px,env(safe-area-inset-bottom,24px))",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
        animation:"slideUp 0.28s cubic-bezier(.32,1,.5,1) both",
      }}>
        <style>{`@keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }`}</style>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 20px 14px", borderBottom:`1px solid ${C.border}` }}>
          <div>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:C.ink }}>Antwort an Support</p>
            <p style={{ margin:0, fontSize:11, color:C.muted }}>
              Ticket {d.ticket_number} · {d.subject}
            </p>
          </div>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8, background:"rgba(0,0,0,0.06)",
            border:"none", cursor:"pointer", fontSize:16, color:C.muted,
          }}>×</button>
        </div>

        <div style={{ padding:"14px 20px 0" }}>

          {/* Vorherige Antwort als Zitat */}
          {d.admin_reply && (
            <div style={{
              background:"rgba(22,215,197,0.05)", border:`1px solid rgba(22,215,197,0.2)`,
              borderLeft:`3px solid ${C.teal}`, borderRadius:"0 8px 8px 0",
              padding:"8px 12px", marginBottom:12,
            }}>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color:C.teal,
                textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>
                Support-Antwort (Zitat)
              </p>
              <p style={{ margin:0, fontSize:12, color:C.muted, lineHeight:1.5,
                overflow:"hidden", maxHeight:56,
                display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
                {d.admin_reply}
              </p>
            </div>
          )}

          {/* Textarea */}
          {sent ? (
            <div style={{ textAlign:"center", padding:"24px 0 8px" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:C.green }}>
                Nachricht gesendet!
              </p>
              <p style={{ margin:"4px 0 0", fontSize:12, color:C.muted }}>
                Der Support wird sich bald melden.
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Deine Antwort an den Support…"
                rows={5}
                autoFocus
                style={{
                  width:"100%", padding:"12px 14px", borderRadius:12,
                  border:`1.5px solid ${text.trim() ? C.teal : C.border}`,
                  background:"rgba(0,0,0,0.02)", color:C.ink,
                  fontSize:14, lineHeight:1.55, resize:"none",
                  outline:"none", fontFamily:"inherit", boxSizing:"border-box",
                  transition:"border-color 0.15s",
                }}
              />
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginTop:6, marginBottom:12 }}>
                <p style={{ margin:0, fontSize:11, color:C.muted }}>{text.length} Zeichen</p>

                {/* Datei-Anhang */}
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {files.map((f, i) => (
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
                  <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFiles} style={{ display:"none" }} />
                  <button onClick={() => fileRef.current?.click()}
                    style={{ padding:"4px 10px", borderRadius:7,
                      border:`1px solid ${C.border}`, background:"transparent",
                      color:C.muted, fontSize:12, cursor:"pointer" }}>
                    📎
                  </button>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                style={{
                  width:"100%", padding:"14px", borderRadius:13, border:"none",
                  background: (!text.trim() || sending)
                    ? "rgba(22,215,197,0.3)"
                    : C.teal,
                  color:"white", fontSize:15, fontWeight:700,
                  cursor: (!text.trim() || sending) ? "default" : "pointer",
                  letterSpacing:0.2,
                }}>
                {sending ? "⏳ Wird gesendet…" : "📨 Antwort senden"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Ticket Detail ─────────────────────────────────────────────────────────────
function TicketDetail({ ticket, onBack }) {
  const d  = ticket.data ?? {};
  const sc = STATUS_CFG[d.status ?? "open"] ?? STATUS_CFG.open;
  const [showReply, setShowReply] = useState(false);
  const [toastMsg, setToastMsg]   = useState(null);

  const handleSent = () => {
    setToastMsg("✅ Deine Antwort wurde gesendet!");
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:C.cream, display:"flex",
      flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      zIndex:10 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:"white", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:10,
          background:"rgba(0,0,0,0.05)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", fontSize:16 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {d.subject ?? "Ticket"}
          </p>
          <div style={{ display:"flex", gap:6, marginTop:3, alignItems:"center" }}>
            <span style={{ fontFamily:"monospace", fontSize:11, color:C.teal }}>
              {d.ticket_number}
            </span>
            <span style={{ fontSize:11, fontWeight:700, padding:"1px 6px", borderRadius:4,
              background:sc.bg, color:sc.color }}>{sc.icon} {sc.label}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 160px",
        WebkitOverflowScrolling:"touch", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Meta */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:C.muted, background:"white",
            border:`1px solid ${C.border}`, padding:"3px 8px", borderRadius:5 }}>
            📅 {new Date(ticket.created_at).toLocaleString("de-DE")}
          </span>
          <span style={{ fontSize:11, color:C.muted, background:"white",
            border:`1px solid ${C.border}`, padding:"3px 8px", borderRadius:5 }}>
            {CATEGORY_ICONS[d.category] ?? "📝"} {d.category}
          </span>
        </div>

        {/* Deine Nachricht */}
        <div style={{ background:"white", borderRadius:12, padding:"14px 16px",
          border:`1px solid ${C.border}` }}>
          <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:C.muted,
            textTransform:"uppercase", letterSpacing:"0.06em" }}>Deine Nachricht</p>
          <p style={{ margin:0, fontSize:13, color:C.ink, lineHeight:1.6,
            whiteSpace:"pre-wrap" }}>{d.message}</p>
        </div>

        {/* Anhänge */}
        {d.attachments?.length > 0 && (
          <div style={{ background:"white", borderRadius:12, padding:"12px 16px",
            border:`1px solid ${C.border}` }}>
            <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:C.muted,
              textTransform:"uppercase", letterSpacing:"0.06em" }}>
              📎 Anhänge ({d.attachments.length})
            </p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {d.attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:6,
                    padding:"5px 9px", borderRadius:6, border:`1px solid ${C.border}`,
                    textDecoration:"none", color:C.ink, fontSize:12, background:"rgba(0,0,0,0.02)" }}>
                  <span>{a.type?.startsWith("image") ? "🖼" : a.type?.startsWith("video") ? "🎬" : "📄"}</span>
                  <span style={{ maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {a.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Admin-Antwort */}
        {d.admin_reply ? (
          <div style={{ background:"rgba(22,215,197,0.06)",
            border:"1.5px solid rgba(22,215,197,0.25)", borderRadius:12, padding:"14px 16px" }}>
            <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:C.teal,
              textTransform:"uppercase", letterSpacing:"0.06em" }}>
              ✅ Antwort vom HUI-Support
              {d.replied_at && (
                <span style={{ fontWeight:400, color:C.muted, marginLeft:8 }}>
                  · {new Date(d.replied_at).toLocaleString("de-DE")}
                </span>
              )}
            </p>
            <p style={{ margin:0, fontSize:13, color:C.ink, lineHeight:1.6,
              whiteSpace:"pre-wrap" }}>{d.admin_reply}</p>
          </div>
        ) : (
          <div style={{ background:"rgba(245,158,11,0.05)",
            border:"1px solid rgba(245,158,11,0.2)", borderRadius:12,
            padding:"14px 16px", textAlign:"center" }}>
            <p style={{ margin:0, fontSize:13, color:C.gold }}>
              ⏳ Dein Ticket wird bearbeitet — wir melden uns per E-Mail.
            </p>
          </div>
        )}

        <p style={{ textAlign:"center", fontSize:12, color:C.muted, margin:"4px 0" }}>
          Fragen? <a href="mailto:support@be-hui.com" style={{ color:C.teal }}>support@be-hui.com</a>
        </p>
      </div>

      {/* Sticky Antworten-Button */}
      {(d.status === "open" || d.status === "replied" || !d.status) && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0,
          padding:"12px 16px max(96px,calc(80px + env(safe-area-inset-bottom,0px)))",
          background:"linear-gradient(to top, white 80%, transparent)",
          zIndex:15,
        }}>
          <button onClick={() => setShowReply(true)} style={{
            width:"100%", padding:"14px", borderRadius:13, border:"none",
            background:C.teal, color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", letterSpacing:0.2,
            boxShadow:"0 4px 16px rgba(22,215,197,0.35)",
          }}>
            ↩ Antworten
          </button>
        </div>
      )}

      {/* Reply Sheet */}
      {showReply && (
        <ReplySheet
          ticket={ticket}
          onClose={() => setShowReply(false)}
          onSent={handleSent}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position:"fixed", bottom:100, left:"50%", transform:"translateX(-50%)",
          background:C.ink, color:"white", padding:"10px 20px", borderRadius:10,
          fontSize:13, fontWeight:600, zIndex:50, whiteSpace:"nowrap",
          boxShadow:"0 4px 16px rgba(0,0,0,0.3)",
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// ── Ticket Card (Übersicht) ───────────────────────────────────────────────────
function TicketCard({ ticket, onOpen }) {
  const d  = ticket.data ?? {};
  const sc = STATUS_CFG[d.status ?? "open"] ?? STATUS_CFG.open;
  const isFollowup = d.is_followup === true;
  return (
    <button onClick={() => onOpen(ticket)} style={{
      width:"100%", textAlign:"left", background:"white",
      border:`1px solid ${isFollowup ? "rgba(22,215,197,0.25)" : C.border}`,
      borderLeft: isFollowup ? `3px solid ${C.teal}` : `1px solid ${C.border}`,
      borderRadius:14, padding:"14px 16px", cursor:"pointer",
      boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700,
            color:C.teal, background:"rgba(22,215,197,0.08)",
            padding:"2px 8px", borderRadius:5 }}>
            {d.ticket_number ?? "HUI-???"}
          </span>
          {isFollowup && (
            <span style={{ fontSize:10, fontWeight:700, color:C.teal,
              background:"rgba(22,215,197,0.08)", padding:"1px 6px", borderRadius:4 }}>
              RE
            </span>
          )}
        </div>
        <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:5,
          background:sc.bg, color:sc.color }}>
          {sc.icon} {sc.label}
        </span>
      </div>
      <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:600, color:C.ink,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {CATEGORY_ICONS[d.category] ?? "📝"} {d.subject ?? "—"}
      </p>
      <p style={{ margin:0, fontSize:12, color:C.muted,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {(d.message ?? "").slice(0, 80)}{d.message?.length > 80 ? "…" : ""}
      </p>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
        <span style={{ fontSize:11, color:C.muted }}>{timeAgo(ticket.created_at)}</span>
        {d.admin_reply && (
          <span style={{ fontSize:11, color:C.teal, fontWeight:600 }}>✉ Antwort erhalten</span>
        )}
      </div>
    </button>
  );
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────
export default function MeineTicketsPage({ onBack, userId }) {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "support_ticket")
      .order("created_at", { ascending: false })
      .limit(50);
    setTickets(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  if (selected) {
    return <TicketDetail ticket={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  return (
    <div style={{ position:"fixed", inset:0, background:C.cream, display:"flex",
      flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:"white", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:10,
          background:"rgba(0,0,0,0.05)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", fontSize:16 }}>←</button>
        <div>
          <p style={{ margin:0, fontSize:17, fontWeight:700, color:C.ink }}>Meine Tickets</p>
          <p style={{ margin:0, fontSize:12, color:C.muted }}>Dein Support-Verlauf</p>
        </div>
        <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700,
          color:C.muted, background:"rgba(0,0,0,0.05)",
          padding:"3px 9px", borderRadius:6 }}>{tickets.length}</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch",
        padding:"16px 16px 48px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:C.muted, fontSize:13 }}>
            ⏳ Lade Tickets…
          </div>
        ) : tickets.length === 0 ? (
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
            {tickets.map(t => (
              <TicketCard key={t.id} ticket={t} onOpen={setSelected} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
