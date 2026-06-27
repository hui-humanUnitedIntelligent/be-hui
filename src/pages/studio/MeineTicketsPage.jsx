// src/pages/studio/MeineTicketsPage.jsx
// Zeigt alle Support-Tickets des Nutzers mit Verlauf
import React, { useState, useEffect } from "react";
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
  open:    { label:"Offen",        color:C.red,   bg:"rgba(239,68,68,0.08)",     icon:"🔴" },
  replied: { label:"Beantwortet",  color:C.gold,  bg:"rgba(245,158,11,0.08)",    icon:"🟡" },
  closed:  { label:"Geschlossen",  color:C.green, bg:"rgba(16,185,129,0.08)",    icon:"🟢" },
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

function TicketCard({ ticket, onOpen }) {
  const sc = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
  const d  = ticket.data ?? {};
  return (
    <button onClick={() => onOpen(ticket)} style={{
      width:"100%", textAlign:"left", background:"white",
      border:`1px solid ${C.border}`, borderRadius:14,
      padding:"14px 16px", cursor:"pointer",
      boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
      transition:"box-shadow 0.15s",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700,
          color:C.teal, background:"rgba(22,215,197,0.08)",
          padding:"2px 8px", borderRadius:5 }}>
          {d.ticket_number ?? "HUI-???"}
        </span>
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
        {d.message?.slice(0, 80)}…
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

function TicketDetail({ ticket, onBack }) {
  const d  = ticket.data ?? {};
  const sc = STATUS_CFG[d.status] ?? STATUS_CFG.open;
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
          <div style={{ display:"flex", gap:6, marginTop:3 }}>
            <span style={{ fontFamily:"monospace", fontSize:11, color:C.teal }}>
              {d.ticket_number}
            </span>
            <span style={{ fontSize:11, fontWeight:700, padding:"1px 6px", borderRadius:4,
              background:sc.bg, color:sc.color }}>{sc.icon} {sc.label}</span>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 40px",
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
              ⏳ Dein Ticket wird bearbeitet. Du erhältst eine E-Mail sobald wir geantwortet haben.
            </p>
          </div>
        )}

        {/* Kontakt */}
        <p style={{ textAlign:"center", fontSize:12, color:C.muted, margin:"4px 0" }}>
          Fragen? <a href="mailto:support@be-hui.com" style={{ color:C.teal }}>support@be-hui.com</a>
        </p>
      </div>
    </div>
  );
}

export default function MeineTicketsPage({ onBack, userId }) {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    async function load() {
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
    }
    load();
  }, [userId]);

  if (selected) {
    return <TicketDetail ticket={selected} onBack={() => setSelected(null)} />;
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
