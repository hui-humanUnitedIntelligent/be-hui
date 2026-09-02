// src/components/admin/StartphaseTab.jsx
// HUI Startphase — Bewerbungen Verwaltung
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const C = {
  bg:"#0A0F1E", card:"#111827", card2:"#1A2235", border:"#1E2D45",
  text:"#F1F5F9", sub:"#94A3B8", muted:"#475569",
  orange:"#F97316", green:"#10B981", red:"#EF4444",
  teal:"#2ABFAC", coral:"#FF6B5B", gold:"#F5A623",
  yellow:"#FBBF24", purple:"#A78BFA", blue:"#3B82F6",
};

const STATUS_CFG = {
  new:           { label: "Neu",              color: C.teal,   bg: "rgba(42,191,172,0.12)" },
  reviewing:     { label: "In Pruefung",       color: C.yellow, bg: "rgba(251,191,36,0.12)" },
  query:         { label: "Rueckfrage",        color: C.blue,  bg: "rgba(59,130,246,0.12)" },
  accepted:      { label: "Angenommen",        color: C.green, bg: "rgba(16,185,129,0.12)" },
  not_selected:  { label: "Nicht ausgewaehlt", color: C.red,   bg: "rgba(239,68,68,0.12)" },
  completed:     { label: "Abgeschlossen",    color: C.sub,   bg: "rgba(148,163,184,0.12)" },
};

const CONTRIBUTION_LABELS = {
  project: "Projekt", work: "Werk", experience: "Erlebnis",
  talent: "Talent", pioneer: "Pionier", idea: "Idee",
  connector: "Verbinden", explore: "Kennenlernen", other: "Sonstiges",
};

const PIONEER_WISH_LABELS = {
  test_features: "Funktionen testen", give_feedback: "Feedback geben",
  report_bugs: "Fehler melden", try_content: "Inhalte ausprobieren",
  invite_people: "Menschen einladen", test_projects: "Projekte testen",
  try_new_features: "Neue Funktionen", contribute_ideas: "Ideen einbringen",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.new;
  return (
    <span style={{
      padding:"3px 10px", borderRadius:99,
      background:cfg.bg, color:cfg.color,
      fontSize:11, fontWeight:600, whiteSpace:"nowrap",
    }}>{cfg.label}</span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day:"2-digit", month:"short", year:"numeric" }) +
    " " + d.toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" });
}

export default function StartphaseTab({ onNewCountChange }) {
  const { t } = useTranslation();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterContribution, setFilterContribution] = useState("all");
  const [filterPioneer, setFilterPioneer] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const card = { background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}`, marginBottom:16 };
  const inputStyle = { width:"100%", padding:"10px 14px", background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:13, outline:"none", fontFamily:"inherit" };

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null), 3000); };

  const loadApps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("startphase_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[StartphaseTab] load error:", error);
      showToast("Fehler beim Laden: " + error.message, false);
    } else {
      setApps(data || []);
      const newCount = (data || []).filter(a => a.status === "new").length;
      onNewCountChange?.(newCount);
    }
    setLoading(false);
  }, [onNewCountChange]);

  useEffect(() => { loadApps(); }, [loadApps]);

  useEffect(() => {
    if (!selectedId) { setSelectedApp(null); setCommunications([]); return; }
    (async () => {
      const [appRes, commRes] = await Promise.all([
        supabase.from("startphase_applications").select("*").eq("id", selectedId).single(),
        supabase.from("startphase_communications").select("*").eq("application_id", selectedId).order("sent_at", { ascending: true }),
      ]);
      setSelectedApp(appRes.data);
      setCommunications(commRes.data || []);
    })();
  }, [selectedId]);

  const filtered = apps.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterContribution !== "all" && !(a.contributions || []).includes(filterContribution)) return false;
    if (filterPioneer === "yes" && !(a.contributions || []).includes("pioneer")) return false;
    if (filterPioneer === "no" && (a.contributions || []).includes("pioneer")) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${a.first_name} ${a.last_name}`.toLowerCase();
      if (!name.includes(q) && !(a.email || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function updateStatus(newStatus) {
    if (!selectedApp) return;
    setStatusUpdating(true);
    const { error } = await supabase
      .from("startphase_applications")
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq("id", selectedApp.id);
    if (error) { showToast("Fehler: " + error.message, false); }
    else {
      setSelectedApp({ ...selectedApp, status: newStatus });
      setApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      const newCount = apps.filter(a => a.status === "new" && a.id !== selectedApp.id).length;
      onNewCountChange?.(newCount);
      showToast("Status aktualisiert");
    }
    setStatusUpdating(false);
  }

  async function sendReply() {
    if (!selectedApp || !replyText.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("full_name,name").eq("id", user.id).single();
      const adminName = profile?.full_name || profile?.name || "HUI Team";

      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/startphase-reply`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId: selectedApp.id,
            to: selectedApp.email,
            subject: replySubject || "Deine Bewerbung fuer die HUI Startphase",
            message: replyText,
            adminName,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      // Communication is saved server-side by the edge function.
      // Just re-fetch the updated communications list.
      const { data: commData } = await supabase
        .from("startphase_communications")
        .select("*")
        .eq("application_id", selectedApp.id)
        .order("sent_at", { ascending: true });
      setCommunications(commData || []);

      setReplyText("");
      setReplySubject("");
      showToast("Antwort gesendet");
    } catch (err) {
      console.error("[StartphaseTab] reply error:", err);
      showToast("Fehler beim Senden: " + err.message, false);
    }
    setSending(false);
  }

  if (selectedApp) {
    const contributions = (selectedApp.contributions || []).map(c => CONTRIBUTION_LABELS[c] || c).join(", ") || "—";
    const wishes = (selectedApp.pioneer_wishes || []).map(w => PIONEER_WISH_LABELS[w] || w).join(", ") || "—";

    const fieldRow = (label, value) => (
      <div style={{ display:"flex", gap:16, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ flex:"0 0 180px", color:C.sub, fontSize:13, fontWeight:500 }}>{label}</div>
        <div style={{ flex:1, color:C.text, fontSize:13, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{value || "—"}</div>
      </div>
    );

    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button onClick={() => setSelectedId(null)} style={{ ...inputStyle, width:"auto", cursor:"pointer", padding:"8px 16px" }}>&larr; Zurueck</button>
          <h2 style={{ fontSize:18, fontWeight:600, color:C.text, margin:0 }}>
            {selectedApp.first_name} {selectedApp.last_name}
          </h2>
          <StatusBadge status={selectedApp.status} />
          <span style={{ color:C.sub, fontSize:12, marginLeft:"auto" }}>{formatDate(selectedApp.created_at)}</span>
        </div>

        <div style={{ ...card, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:13, color:C.sub, marginRight:4 }}>Status aendern:</span>
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <button key={key} onClick={() => updateStatus(key)} disabled={statusUpdating || selectedApp.status === key}
              style={{
                padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
                background: selectedApp.status === key ? cfg.color : cfg.bg,
                color: selectedApp.status === key ? "#fff" : cfg.color,
                fontSize:12, fontWeight:600, opacity: statusUpdating ? 0.5 : 1,
              }}>
              {cfg.label}
            </button>
          ))}
        </div>

        <div style={card}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:8, color:C.teal }}>Persoenliche Angaben</div>
          {fieldRow("Name", `${selectedApp.first_name} ${selectedApp.last_name}`)}
          {fieldRow("E-Mail", selectedApp.email)}
          {fieldRow("Land / Region", selectedApp.country_region)}
          {fieldRow("Aktuelle Taetigkeit", selectedApp.current_role)}
          {fieldRow("Ueber sich", selectedApp.about_you)}
        </div>

        <div style={card}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:8, color:C.teal }}>Beitraege</div>
          {fieldRow("Beitraege", contributions)}
          {fieldRow("Faehigkeiten", selectedApp.skills)}
        </div>

        <div style={card}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:8, color:C.teal }}>Projekt</div>
          {fieldRow("Projektname", selectedApp.project_name)}
          {fieldRow("Angebot", selectedApp.project_offering)}
          {fieldRow("Zielgruppe", selectedApp.project_audience)}
          {fieldRow("Wirkung", selectedApp.project_impact)}
          {fieldRow("Bedarf", selectedApp.project_needs)}
          {fieldRow("Was fehlt", selectedApp.project_missing)}
        </div>

        <div style={card}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:8, color:C.teal }}>Pionier-Interesse</div>
          {fieldRow("Warum Pionier", selectedApp.pioneer_reason)}
          {fieldRow("Wuensche an HUI", wishes)}
          {fieldRow("Erste Aktion", selectedApp.pioneer_first_action)}
        </div>

        <div style={card}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:8, color:C.teal }}>Abschlussfragen</div>
          {fieldRow("Warum HUI", selectedApp.why_hui)}
          {fieldRow("Beitrag", selectedApp.what_contribute)}
        </div>

        {communications.length > 0 && (
          <div style={card}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:12, color:C.teal }}>Kommunikationshistorie</div>
            {communications.map(comm => (
              <div key={comm.id} style={{ padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:600, color: comm.direction === "outbound" ? C.teal : C.sub }}>
                    {comm.direction === "outbound" ? "Gesendet" : "Eingehend"} - {comm.admin_name || "System"}
                  </span>
                  <span style={{ fontSize:11, color:C.muted }}>{formatDate(comm.sent_at)}</span>
                </div>
                {comm.subject && <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:4 }}>{comm.subject}</div>}
                <div style={{ fontSize:13, color:C.sub, whiteSpace:"pre-wrap", lineHeight:1.6 }}>{comm.message_body}</div>
              </div>
            ))}
          </div>
        )}

        <div style={card}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:12, color:C.teal }}>Antwort an Bewerber</div>
          <input type="text" placeholder="Betreff (optional)" value={replySubject} onChange={e => setReplySubject(e.target.value)} style={{ ...inputStyle, marginBottom:12 }} />
          <textarea placeholder="Schreibe eine persoenliche Antwort..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ ...inputStyle, minHeight:140, resize:"vertical", marginBottom:12, lineHeight:1.6 }} />
          <button onClick={sendReply} disabled={!replyText.trim() || sending} style={{ padding:"12px 28px", borderRadius:20, border:"none", cursor:"pointer", background: C.teal, color:"#fff", fontSize:13, fontWeight:600, opacity: (!replyText.trim() || sending) ? 0.5 : 1 }}>
            {sending ? "Wird gesendet..." : "Antwort senden"}
          </button>
        </div>

        {toast && <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:12, background: toast.ok ? C.green : C.red, color:"#fff", fontSize:13, fontWeight:600, zIndex:1000 }}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <input type="text" placeholder="Name oder E-Mail suchen..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex:1, minWidth:200 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width:"auto" }}>
          <option value="all">Alle Status</option>
          {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterContribution} onChange={e => setFilterContribution(e.target.value)} style={{ ...inputStyle, width:"auto" }}>
          <option value="all">Alle Beitraege</option>
          {Object.entries(CONTRIBUTION_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPioneer} onChange={e => setFilterPioneer(e.target.value)} style={{ ...inputStyle, width:"auto" }}>
          <option value="all">Pionier: Alle</option>
          <option value="yes">Pionier: Ja</option>
          <option value="no">Pionier: Nein</option>
        </select>
      </div>

      <div style={{ fontSize:13, color:C.sub, marginBottom:12 }}>
        {filtered.length} {filtered.length === 1 ? "Bewerbung" : "Bewerbungen"}
      </div>

      {loading ? (
        <div style={{ ...card, textAlign:"center", color:C.sub }}>Laedt...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign:"center", color:C.sub }}>Noch keine Bewerbungen.</div>
      ) : (
        <div style={card}>
          {filtered.map(app => {
            const contribs = (app.contributions || []).map(c => CONTRIBUTION_LABELS[c] || c);
            const isPioneer = (app.contributions || []).includes("pioneer");
            return (
              <div key={app.id} onClick={() => setSelectedId(app.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 12px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", borderRadius:8, marginLeft:-12, marginRight:-12, transition:"background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.card2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, background: C.teal + "20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:600, color:C.teal }}>
                  {(app.first_name?.[0] || "?").toUpperCase()}{(app.last_name?.[0] || "").toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:C.text }}>
                    {app.first_name} {app.last_name}
                    {app.status === "new" && <span style={{ marginLeft:8, padding:"1px 6px", borderRadius:4, background:C.coral, color:"#fff", fontSize:9, fontWeight:700 }}>NEU</span>}
                  </div>
                  <div style={{ color:C.sub, fontSize:12, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {app.email} - {contribs.join(", ") || "—"}
                  </div>
                </div>
                {isPioneer && <span style={{ padding:"2px 8px", borderRadius:6, background:"rgba(167,139,250,0.15)", color:C.purple, fontSize:10, fontWeight:600, whiteSpace:"nowrap" }}>Pionier</span>}
                <StatusBadge status={app.status} />
                <span style={{ color:C.muted, fontSize:11, whiteSpace:"nowrap", minWidth:80, textAlign:"right" }}>{formatDate(app.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}

      {toast && <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:12, background: toast.ok ? C.green : C.red, color:"#fff", fontSize:13, fontWeight:600, zIndex:1000 }}>{toast.msg}</div>}
    </div>
  );
}
