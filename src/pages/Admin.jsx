import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  bg: "#0A0F1E", card: "#111827", card2: "#1A2235", border: "#1E2D45",
  text: "#F1F5F9", sub: "#94A3B8", muted: "#475569",
  orange: "#F97316", green: "#10B981", red: "#EF4444",
  teal: "#2ABFAC", coral: "#FF6B5B", gold: "#F5A623", yellow: "#FBBF24",
  purple: "#A78BFA",
};

// ─────────────────────────────────────────────────────────────────
// Notification senden — wiederverwendbar für alle Content-Typen
// ─────────────────────────────────────────────────────────────────
async function sendNotification({ userId, type, title, body, actionUrl, metadata = {} }) {
  if (!userId) return;
  const { error } = await supabase.from("notifications").insert({
    user_id:    userId,
    type,
    title,
    body,
    action_url: actionUrl || null,
    metadata,
    is_read:    false,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[NOTIF send error]", error.message);
}

// ─────────────────────────────────────────────────────────────────
// Typ-Konfiguration — einmal definiert, überall genutzt
// ─────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  werk: {
    label:      "WERK",
    emoji:      "🎨",
    badgeBg:    "rgba(245,166,35,0.92)",
    table:      "works",
    // Freigabe: works braucht published+visible
    approveExtra: { published: true, visible: true },
    // Ablehnung: works braucht published+visible=false
    rejectExtra:  { published: false, visible: false },
    approveStatus: "published",
    rejectStatus:  "rejected",
    // Status in DB der auf "warte auf Prüfung" zeigt
    pendingStatus: "pending_review",
    notifApproveTitle: (t) => `Dein Werk wurde freigegeben ✅`,
    notifApproveBody:  (t) => `„${t}" ist jetzt öffentlich sichtbar und im Feed.`,
    notifRejectTitle:  (t) => `Dein Werk wurde abgelehnt`,
    notifRejectBody:   (t) => `„${t}" konnte nicht freigegeben werden.`,
    actionUrl: "/mein-hui",
  },
  experience: {
    label:      "ERLEBNIS",
    emoji:      "🎟",
    badgeBg:    "rgba(42,191,172,0.92)",
    table:      "experiences",
    approveExtra: { published: true, visible: true },
    rejectExtra:  { published: false, visible: false },
    approveStatus: "published",
    rejectStatus:  "rejected",
    pendingStatus: "pending_review",
    notifApproveTitle: (t) => `Dein Erlebnis wurde freigegeben ✅`,
    notifApproveBody:  (t) => `„${t}" ist jetzt öffentlich sichtbar und im Feed.`,
    notifRejectTitle:  (t) => `Dein Erlebnis wurde abgelehnt`,
    notifRejectBody:   (t) => `„${t}" konnte nicht freigegeben werden.`,
    actionUrl: "/mein-hui",
  },
  project: {
    label:      "PROJEKT",
    emoji:      "🌍",
    badgeBg:    "rgba(167,139,250,0.92)",
    table:      "impact_applications",
    // impact_applications hat kein published/visible — nur status
    approveExtra: {},
    rejectExtra:  {},
    approveStatus: "approved",
    rejectStatus:  "rejected",
    pendingStatus: "pending",
    notifApproveTitle: (t) => `Dein Projekt wurde genehmigt ✅`,
    notifApproveBody:  (t) => `„${t}" ist jetzt Teil der HUI Impact-Projekte.`,
    notifRejectTitle:  (t) => `Dein Projekt wurde abgelehnt`,
    notifRejectBody:   (t) => `„${t}" konnte nicht angenommen werden.`,
    actionUrl: "/impact",
  },
};

// ─────────────────────────────────────────────────────────────────
// FreigabenTab — works + experiences + impact_applications
// ─────────────────────────────────────────────────────────────────
function FreigabenTab({ onCountChange }) {
  const [works,     setWorks]     = useState([]);
  const [exps,      setExps]      = useState([]);
  const [projs,     setProjs]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [actioning, setActioning] = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [toast,     setToast]     = useState(null);
  const [rejectDlg, setRejectDlg] = useState(null); // { type, id, userId, title }
  const [rejectReason, setRejectReason] = useState("");

  // ── Daten laden ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const [wRes, eRes, pRes] = await Promise.all([
      supabase.from("works")
        .select([
          "id", "user_id", "creator_id", "title", "description",
          "cover_url", "category", "status", "created_at",
          "admin_comment", "rejection_reason",
          "profiles(display_name,username,avatar_url)",
        ].join(","))
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("experiences")
        .select([
          "id", "user_id", "title", "description",
          "cover_url", "category", "experience_type", "status", "created_at",
          "admin_comment", "rejection_reason",
          "profiles(display_name,username,avatar_url)",
        ].join(","))
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("impact_applications")
        .select([
          "id", "user_id", "project_name", "short_desc",
          "cover_url", "status", "submitted_at",
          "admin_comment", "rejection_reason",
          "profiles(display_name,username,avatar_url)",
        ].join(","))
        .eq("status", "pending")
        .order("submitted_at", { ascending: false })
        .limit(100),
    ]);
    const w = wRes.data || [];
    const e = eRes.data || [];
    const p = pRes.data || [];
    setWorks(w);
    setExps(e);
    setProjs(p);
    onCountChange?.(w.length + e.length + p.length);
    setLoading(false);
  }, [onCountChange]);

  useEffect(() => { load(); }, [load]);

  // ── Toast ────────────────────────────────────────────────────
  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  // ── Freigeben ────────────────────────────────────────────────
  async function approve(type, id, userId, itemTitle) {
    setActioning(id);
    const cfg = TYPE_CFG[type];
    const { error } = await supabase.from(cfg.table)
      .update({
        status:      cfg.approveStatus,
        ...cfg.approveExtra,
        reviewed_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      showToast("Fehler: " + error.message, false);
    } else {
      await sendNotification({
        userId,
        type:      "content_approved",
        title:     cfg.notifApproveTitle(itemTitle),
        body:      cfg.notifApproveBody(itemTitle),
        actionUrl: cfg.actionUrl,
        metadata:  { content_type: type, content_id: id, content_title: itemTitle },
      });
      showToast(`✅ ${cfg.label} freigegeben`);
      removeItem(type, id);
    }
    setActioning(null);
  }

  // ── Ablehnen — Dialog öffnen ─────────────────────────────────
  function openReject(type, id, userId, title) {
    setRejectReason("");
    setRejectDlg({ type, id, userId, title });
  }

  // ── Ablehnen — bestätigen ────────────────────────────────────
  async function rejectConfirm() {
    if (!rejectDlg) return;
    const { type, id, userId, title } = rejectDlg;
    const reason = rejectReason.trim();
    const cfg    = TYPE_CFG[type];
    setActioning(id);
    setRejectDlg(null);

    const { error } = await supabase.from(cfg.table)
      .update({
        status:           cfg.rejectStatus,
        ...cfg.rejectExtra,
        rejection_reason: reason || null,
        reviewed_at:      new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      showToast("Fehler: " + error.message, false);
    } else {
      await sendNotification({
        userId,
        type:      "content_rejected",
        title:     cfg.notifRejectTitle(title),
        body:      cfg.notifRejectBody(title),
        actionUrl: cfg.actionUrl,
        metadata: {
          content_type:     type,
          content_id:       id,
          content_title:    title,
          rejection_reason: reason || null,
        },
      });
      showToast(`❌ ${cfg.label} abgelehnt & Nutzer benachrichtigt`);
      removeItem(type, id);
    }
    setRejectReason("");
    setActioning(null);
  }

  // ── Item aus Liste entfernen ─────────────────────────────────
  function removeItem(type, id) {
    if (type === "werk")       setWorks(p => p.filter(x => x.id !== id));
    else if (type === "experience") setExps(p  => p.filter(x => x.id !== id));
    else if (type === "project")    setProjs(p => p.filter(x => x.id !== id));
    onCountChange?.(prev => Math.max(0, (prev || 1) - 1));
  }

  // ── Items zusammenstellen + filtern ─────────────────────────
  const allItems = [
    ...works.map(w => ({ ...w, _type:"werk",       _title: w.title })),
    ...exps.map(e  => ({ ...e, _type:"experience", _title: e.title })),
    ...projs.map(p => ({ ...p, _type:"project",    _title: p.project_name,
                                title: p.project_name, description: p.short_desc,
                                created_at: p.submitted_at })),
  ]
  .filter(x =>
    filter === "all" ||
    (filter === "works"       && x._type === "werk") ||
    (filter === "experiences" && x._type === "experience") ||
    (filter === "projects"    && x._type === "project")
  )
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = works.length + exps.length + projs.length;
  const card  = { background:C.card, borderRadius:16, padding:20,
                   border:`1px solid ${C.border}`, marginBottom:16 };

  if (loading) return (
    <div style={{ textAlign:"center", padding:40, color:C.sub }}>
      <div style={{fontSize:32, marginBottom:8}}>🔍</div>
      Lade Inhalte zur Prüfung…
    </div>
  );

  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"12px 24px", borderRadius:99,
          background: toast.ok ? C.green : C.red,
          color:"white", fontSize:14, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          pointerEvents:"none",
        }}>{toast.msg}</div>
      )}

      {/* ── Ablehnungs-Dialog ── */}
      {rejectDlg && (
        <div style={{
          position:"fixed", inset:0, zIndex:9900,
          background:"rgba(0,0,0,0.72)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:24,
        }}>
          <div style={{
            background:C.card, borderRadius:20, padding:24,
            width:"100%", maxWidth:460,
            border:`1px solid ${C.border}`,
            boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{fontSize:17, fontWeight:800, color:C.text, marginBottom:4}}>
              ❌ {TYPE_CFG[rejectDlg.type]?.label} ablehnen
            </div>
            <div style={{fontSize:13, color:C.sub, marginBottom:16}}>
              „{rejectDlg.title}"
            </div>
            <div style={{fontSize:12, fontWeight:600, color:C.sub, marginBottom:6}}>
              Ablehnungsgrund (sichtbar für den Nutzer):
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="z.B. Bilder zu unscharf, Beschreibung unvollständig…"
              rows={4}
              style={{
                width:"100%", padding:"11px 13px", borderRadius:11,
                background:C.card2, border:`1px solid ${C.border}`,
                color:C.text, fontSize:13, fontFamily:"inherit",
                resize:"vertical", outline:"none", boxSizing:"border-box",
                lineHeight:1.5,
              }}
            />
            <div style={{fontSize:11, color:C.muted, marginTop:4, marginBottom:16}}>
              Optional — kann leer gelassen werden.
            </div>
            <div style={{display:"flex", gap:10}}>
              <button
                onClick={() => { setRejectDlg(null); setRejectReason(""); }}
                style={{
                  flex:1, padding:"11px", borderRadius:11,
                  border:`1px solid ${C.border}`, background:"none",
                  color:C.sub, fontSize:13, fontWeight:600, cursor:"pointer",
                }}>
                Abbrechen
              </button>
              <button
                onClick={rejectConfirm}
                style={{
                  flex:2, padding:"11px", borderRadius:11, border:"none",
                  background:C.red, color:"white",
                  fontSize:13, fontWeight:700, cursor:"pointer",
                }}>
                ✕ Ablehnen & benachrichtigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header + Filter ── */}
      <div style={{...card, display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16}}>
        <div>
          <div style={{fontSize:17, fontWeight:800, color:C.text}}>📋 Freigaben</div>
          <div style={{fontSize:12, color:C.sub, marginTop:3}}>
            {total === 0
              ? "Keine Einträge zur Prüfung"
              : `${total} Eintrag${total !== 1 ? "e" : ""} warten auf Freigabe`}
          </div>
        </div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {[
            ["all",         "Alle"],
            ["works",       `Werke (${works.length})`],
            ["experiences", `Erlebnisse (${exps.length})`],
            ["projects",    `Projekte (${projs.length})`],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding:"5px 12px", borderRadius:99, border:"none", cursor:"pointer",
              background: filter === k ? C.teal : C.card2,
              color: filter === k ? "#fff" : C.sub,
              fontSize:12, fontWeight:600,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Leerlauf ── */}
      {allItems.length === 0 && (
        <div style={{...card, textAlign:"center", padding:44, color:C.sub}}>
          <div style={{fontSize:38, marginBottom:10}}>✨</div>
          <div style={{fontSize:14, fontWeight:600}}>Alles geprüft!</div>
          <div style={{fontSize:12, marginTop:4}}>Keine offenen Einträge.</div>
        </div>
      )}

      {/* ── Item-Liste ── */}
      {allItems.map(item => {
        const cfg    = TYPE_CFG[item._type];
        const profile = item.profiles || {};
        const uid    = item.user_id || item.creator_id;
        const acting = actioning === item.id;
        const dateStr = item.created_at
          ? new Date(item.created_at).toLocaleDateString("de-DE",
              {day:"2-digit", month:"2-digit", year:"numeric"})
          : "—";

        return (
          <div key={item.id} style={{
            background:C.card, borderRadius:14,
            border:`1px solid ${C.border}`,
            marginBottom:10, overflow:"hidden",
          }}>
            <div style={{display:"flex"}}>
              {/* Cover */}
              <div style={{
                width:86, flexShrink:0, minHeight:86,
                background:"#1A2235", position:"relative",
              }}>
                {item.cover_url
                  ? <img src={item.cover_url} alt=""
                      style={{width:"100%", height:"100%", objectFit:"cover",
                              position:"absolute", inset:0}}/>
                  : <div style={{
                      position:"absolute", inset:0, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:26,
                    }}>{cfg.emoji}</div>
                }
                {/* Typ-Badge */}
                <div style={{
                  position:"absolute", top:5, left:5,
                  padding:"2px 6px", borderRadius:99,
                  background: cfg.badgeBg,
                  fontSize:8, fontWeight:800, color:"#fff", letterSpacing:0.4,
                }}>
                  {cfg.label}
                </div>
              </div>

              {/* Inhalt */}
              <div style={{flex:1, padding:"11px 13px"}}>
                {/* Autor + Datum */}
                <div style={{
                  display:"flex", alignItems:"center",
                  gap:6, marginBottom:6,
                }}>
                  {profile.avatar_url && (
                    <img src={profile.avatar_url} alt=""
                      style={{width:18, height:18, borderRadius:"50%",
                              objectFit:"cover", flexShrink:0}}/>
                  )}
                  <span style={{fontSize:11, color:C.sub, fontWeight:600}}>
                    {profile.display_name || profile.username || uid?.slice(0,8)}
                  </span>
                  <span style={{fontSize:10, color:C.muted, marginLeft:"auto"}}>
                    {dateStr}
                  </span>
                </div>

                {/* Titel */}
                <div style={{
                  fontSize:13.5, fontWeight:800, color:C.text,
                  marginBottom:3, lineHeight:1.3,
                }}>
                  {item.title || "Kein Titel"}
                </div>

                {/* Beschreibung */}
                {item.description && (
                  <div style={{
                    fontSize:11, color:C.sub, lineHeight:1.45,
                    marginBottom:7, overflow:"hidden",
                    display:"-webkit-box", WebkitLineClamp:2,
                    WebkitBoxOrient:"vertical",
                  }}>
                    {item.description}
                  </div>
                )}

                {/* Kategorie */}
                {item.category && (
                  <div style={{
                    display:"inline-block", padding:"2px 8px", borderRadius:99,
                    background:C.card2, border:`1px solid ${C.border}`,
                    fontSize:10, color:C.sub, marginBottom:9,
                  }}>
                    {item.category}
                  </div>
                )}

                {/* Aktions-Buttons */}
                <div style={{display:"flex", gap:7}}>
                  <button
                    disabled={acting}
                    onClick={() => approve(item._type, item.id, uid, item.title)}
                    style={{
                      flex:2, padding:"8px 0", borderRadius:8, border:"none",
                      background: acting ? "rgba(16,185,129,0.28)" : C.green,
                      color:"#fff", fontSize:12, fontWeight:700,
                      cursor: acting ? "not-allowed" : "pointer",
                    }}>
                    {acting ? "…" : "✓ Freigeben"}
                  </button>
                  <button
                    disabled={acting}
                    onClick={() => openReject(item._type, item.id, uid, item.title)}
                    style={{
                      flex:1, padding:"8px 0", borderRadius:8,
                      background:"none",
                      color: acting ? C.muted : C.red,
                      fontSize:12, fontWeight:600,
                      cursor: acting ? "not-allowed" : "pointer",
                      border:`1px solid ${acting ? C.border : C.red}`,
                    }}>
                    {acting ? "…" : "✕ Ablehnen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Admin
// ─────────────────────────────────────────────────────────────────
export default function Admin() {
  const [wirker,   setWirker]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pending,  setPending]  = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("dashboard");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [wirkerRes, paymentsRes, projectsRes,
             wPend, ePend, pPend] = await Promise.all([
        supabase.from("wirker")
          .select("id,name,full_name,talent,location,img,verified,bookings,impact_eur,created_at")
          .order("created_at", { ascending: false }).limit(100),
        supabase.from("payments")
          .select("id,user_id,wirker_name,amount_eur,impact_eur,status,payment_status,created_at")
          .order("created_at", { ascending: false }).limit(200),
        supabase.from("impact_projects")
          .select("id,name,category,description,votes,status,goal_eur,awarded_eur,month")
          .order("votes", { ascending: false }).limit(50),
        // Pending-Counts für Badge
        supabase.from("works")
          .select("id", { count:"exact", head:true })
          .eq("status", "pending_review"),
        supabase.from("experiences")
          .select("id", { count:"exact", head:true })
          .eq("status", "pending_review"),
        supabase.from("impact_applications")
          .select("id", { count:"exact", head:true })
          .eq("status", "pending"),
      ]);
      setWirker(wirkerRes.data     || []);
      setPayments(paymentsRes.data || []);
      setProjects(projectsRes.data || []);
      setPending(
        (wPend.count || 0) +
        (ePend.count || 0) +
        (pPend.count || 0)
      );
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = payments
    .filter(p => p.payment_status === "paid")
    .reduce((s, p) => s + (p.amount_eur || 0), 0);
  const totalImpact  = payments
    .filter(p => p.payment_status === "paid")
    .reduce((s, p) => s + (p.impact_eur || 0), 0);

  const s    = { minHeight:"100vh", background:C.bg, color:C.text,
                  fontFamily:"-apple-system, sans-serif", padding:24 };
  const card = { background:C.card, borderRadius:16, padding:20,
                  border:`1px solid ${C.border}`, marginBottom:16 };

  const tabBtn = (active, badge) => ({
    padding:"8px 18px", borderRadius:20, border:"none", cursor:"pointer",
    background: active ? C.teal : C.card2,
    color: active ? "#fff" : C.sub,
    fontWeight:600, fontSize:13,
    position:"relative",
    ...(badge > 0 ? { paddingRight:28 } : {}),
  });

  if (loading) return (
    <div style={{...s, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40, marginBottom:12}}>🌱</div>
        <div style={{color:C.teal}}>Lade Admin-Daten…</div>
      </div>
    </div>
  );

  return (
    <div style={s}>
      {/* Titel */}
      <div style={{marginBottom:24}}>
        <h1 style={{margin:0, fontSize:22, fontWeight:800}}>
          HUI Admin <span style={{color:C.teal}}>Dashboard</span>
        </h1>
        <div style={{color:C.sub, fontSize:13, marginTop:4}}>
          Echtzeit-Daten aus Supabase
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex", gap:8, marginBottom:24, flexWrap:"wrap"}}>
        {[
          { key:"dashboard", label:"Dashboard" },
          { key:"content",   label:"Freigaben", badge: pending },
          { key:"wirker",    label:"Wirker" },
          { key:"payments",  label:"Payments" },
          { key:"projekte",  label:"Projekte" },
        ].map(({ key, label, badge=0 }) => (
          <button key={key} onClick={() => setTab(key)}
            style={tabBtn(tab === key, badge)}>
            {label}
            {badge > 0 && (
              <span style={{
                position:"absolute", top:-6, right:-6,
                minWidth:18, height:18, borderRadius:99,
                background:C.coral, color:"#fff",
                fontSize:10, fontWeight:800,
                display:"flex", alignItems:"center", justifyContent:"center",
                padding:"0 4px",
              }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && (
        <>
          <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)",
            gap:12, marginBottom:16}}>
            {[
              { label:"Wirker",      value:wirker.length,
                icon:"✨", color:C.teal,   onClick:null },
              { label:"Buchungen",   value:payments.length,
                icon:"📋", color:C.orange, onClick:null },
              { label:"Umsatz",      value:`${totalRevenue.toFixed(0)} €`,
                icon:"💰", color:C.green,  onClick:null },
              { label:"Impact Pool", value:`${totalImpact.toFixed(2)} €`,
                icon:"🌱", color:C.coral,  onClick:null },
              { label:"Zur Prüfung", value:pending,
                icon:"📝", color:C.yellow, onClick:() => setTab("content") },
            ].map(kpi => (
              <div key={kpi.label}
                onClick={kpi.onClick || undefined}
                style={{...card, marginBottom:0,
                  cursor:kpi.onClick ? "pointer" : "default"}}>
                <div style={{fontSize:24, marginBottom:6}}>{kpi.icon}</div>
                <div style={{fontSize:22, fontWeight:800, color:kpi.color}}>
                  {kpi.value}
                </div>
                <div style={{fontSize:12, color:C.sub}}>{kpi.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{fontWeight:700, marginBottom:12}}>
              🌍 Impact Projekte ({projects.length})
            </div>
            {projects.slice(0,3).map(p => (
              <div key={p.id} style={{
                display:"flex", justifyContent:"space-between",
                padding:"8px 0", borderBottom:`1px solid ${C.border}`,
              }}>
                <span style={{fontSize:13}}>{p.name || p.title}</span>
                <span style={{color:C.teal, fontSize:12, fontWeight:600}}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── FREIGABEN ── */}
      {tab === "content" && (
        <FreigabenTab onCountChange={setPending} />
      )}

      {/* ── WIRKER ── */}
      {tab === "wirker" && (
        <div style={card}>
          <div style={{fontWeight:700, marginBottom:12}}>
            ✨ Alle Wirker ({wirker.length})
          </div>
          {(wirker || []).filter(w => w && typeof w === "object").map(w => (
            <div key={w.id} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 0", borderBottom:`1px solid ${C.border}`,
            }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:C.teal+"30",
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:16,
              }}>✨</div>
              <div>
                <div style={{fontWeight:600, fontSize:14}}>{w.name}</div>
                <div style={{color:C.sub, fontSize:12}}>
                  {w.talent} · {w.location}
                </div>
              </div>
              <div style={{marginLeft:"auto", color:C.gold, fontSize:13, fontWeight:700}}>
                {w.hourly_rate} €/h
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <div style={card}>
          <div style={{fontWeight:700, marginBottom:12}}>
            💳 Alle Buchungen ({payments.length})
          </div>
          {(payments || []).filter(p => p && typeof p === "object").map(p => (
            <div key={p.id} style={{
              padding:"10px 0", borderBottom:`1px solid ${C.border}`,
            }}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <span style={{fontSize:13, fontWeight:600}}>
                  {p.wirker_name || p.item_name}
                </span>
                <span style={{
                  color: p.payment_status === "paid" ? C.green : C.orange,
                  fontSize:12, fontWeight:700,
                }}>
                  {p.payment_status}
                </span>
              </div>
              <div style={{color:C.sub, fontSize:12, marginTop:2}}>
                {p.amount_eur} € · Impact: {p.impact_eur} €
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PROJEKTE (Übersicht, nicht Freigabe) ── */}
      {tab === "projekte" && (
        <div style={card}>
          <div style={{fontWeight:700, marginBottom:12}}>
            🌍 Impact Projekte ({projects.length})
          </div>
          {(projects || []).filter(p => p && typeof p === "object").map(p => (
            <div key={p.id} style={{
              padding:"10px 0", borderBottom:`1px solid ${C.border}`,
            }}>
              <div style={{fontWeight:600, fontSize:14}}>
                {p.name || p.title}
              </div>
              <div style={{color:C.sub, fontSize:12, marginTop:2}}>
                {p.category} · {p.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
