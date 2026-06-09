import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  bg:"#0A0F1E", card:"#111827", card2:"#1A2235", border:"#1E2D45",
  text:"#F1F5F9", sub:"#94A3B8", muted:"#475569",
  orange:"#F97316", green:"#10B981", red:"#EF4444",
  teal:"#2ABFAC", coral:"#FF6B5B", gold:"#F5A623",
  yellow:"#FBBF24", purple:"#A78BFA",
};

// ─────────────────────────────────────────────────────────────────
// Notification helper
// ─────────────────────────────────────────────────────────────────
async function sendNotification({ userId, type, title, body, actionUrl, metadata={} }) {
  if (!userId) return;
  const { error } = await supabase.from("notifications").insert({
    user_id: userId, type, title, body,
    action_url: actionUrl || null,
    metadata, is_read: false,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[NOTIF]", error.message);
}

// ─────────────────────────────────────────────────────────────────
// Typ-Konfiguration — ein Eintrag pro Content-Typ
// ─────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  werk: {
    label:"WERK", emoji:"🎨",
    badgeBg:"rgba(245,166,35,0.92)",
    table:"works",
    pendingStatus:"pending_review",
    approveStatus:"published",
    rejectStatus:"rejected",
    approveExtra: { published:true, visible:true },
    rejectExtra:  { published:false, visible:false },
    notifApproveTitle: (t) => `Dein Werk wurde freigegeben ✅`,
    notifApproveBody:  (t) => `„${t}" ist jetzt öffentlich im Feed.`,
    notifRejectTitle:  (t) => `Dein Werk wurde abgelehnt`,
    notifRejectBody:   (t) => `„${t}" konnte nicht freigegeben werden.`,
    actionUrl:"/studio",
  },
  experience: {
    label:"ERLEBNIS", emoji:"🎟",
    badgeBg:"rgba(42,191,172,0.92)",
    table:"experiences",
    pendingStatus:"pending_review",
    approveStatus:"published",
    rejectStatus:"rejected",
    approveExtra: { published:true, visible:true },
    rejectExtra:  { published:false, visible:false },
    notifApproveTitle: (t) => `Dein Erlebnis wurde freigegeben ✅`,
    notifApproveBody:  (t) => `„${t}" ist jetzt öffentlich im Feed.`,
    notifRejectTitle:  (t) => `Dein Erlebnis wurde abgelehnt`,
    notifRejectBody:   (t) => `„${t}" konnte nicht freigegeben werden.`,
    actionUrl:"/studio",
  },
  project: {
    label:"PROJEKT", emoji:"🌍",
    badgeBg:"rgba(167,139,250,0.92)",
    table:"impact_applications",
    pendingStatus:"pending",
    approveStatus:"approved",
    rejectStatus:"rejected",
    approveExtra:{},
    rejectExtra:{},
    notifApproveTitle: (t) => `Dein Projekt wurde angenommen ✅`,
    notifApproveBody:  (t) => `„${t}" ist jetzt Teil der HUI Impact-Projekte.`,
    notifRejectTitle:  (t) => `Dein Projekt wurde abgelehnt`,
    notifRejectBody:   (t) => `„${t}" konnte leider nicht angenommen werden.`,
    actionUrl:"/impact",
  },
};

// ─────────────────────────────────────────────────────────────────
// Status-Badge
// ─────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending_review: { label:"Ausstehend", color:"#FBBF24", bg:"rgba(251,191,36,0.12)" },
  pending:        { label:"Ausstehend", color:"#FBBF24", bg:"rgba(251,191,36,0.12)" },
  published:      { label:"Freigegeben", color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  approved:       { label:"Freigegeben", color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  rejected:       { label:"Abgelehnt",  color:"#EF4444", bg:"rgba(239,68,68,0.12)"  },
  draft:          { label:"Entwurf",    color:"#94A3B8", bg:"rgba(148,163,184,0.12)" },
};
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span style={{
      padding:"2px 8px", borderRadius:99,
      background:s.bg, color:s.color,
      fontSize:10, fontWeight:700,
    }}>{s.label}</span>
  );
}

// ─────────────────────────────────────────────────────────────────
// FreigabenTab — Ausstehend / Freigegeben / Abgelehnt
// ─────────────────────────────────────────────────────────────────
function FreigabenTab({ onPendingChange }) {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [subTab,    setSubTab]    = useState("pending"); // pending|approved|rejected
  const [typeFilter,setTypeFilter]= useState("all");
  const [actioning, setActioning] = useState(null);
  const [toast,     setToast]     = useState(null);
  const [rejectDlg, setRejectDlg] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [commentDlg, setCommentDlg] = useState(null);
  const [commentText, setCommentText] = useState("");

  // ── Daten laden ─────────────────────────────────────────────
  const load = useCallback(async (tab = subTab) => {
    setLoading(true);
    const isApproved = tab === "approved";
    const isRejected = tab === "rejected";

    const wStatus = isApproved ? "published" : isRejected ? "rejected" : "pending_review";
    const eStatus = isApproved ? "published" : isRejected ? "rejected" : "pending_review";
    const pStatus = isApproved ? "approved"  : isRejected ? "rejected" : "pending";

    const [wRes, eRes, pRes] = await Promise.all([
      supabase.from("works")
        .select([
          "id","user_id","creator_id","title","description","cover_url",
          "category","status","created_at","reviewed_at","rejected_at",
          "admin_comment","review_note","rejection_reason",
          "profiles(display_name,username,avatar_url)",
        ].join(","))
        .eq("status", wStatus)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("experiences")
        .select([
          "id","user_id","title","description","cover_url",
          "category","experience_type","status","created_at","reviewed_at","rejected_at",
          "admin_comment","review_note","rejection_reason",
          "profiles(display_name,username,avatar_url)",
        ].join(","))
        .eq("status", eStatus)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("impact_applications")
        .select([
          "id","user_id","project_name","short_desc","cover_url",
          "status","submitted_at","reviewed_at","rejected_at",
          "admin_comment","review_note","rejection_reason",
          "profiles(display_name,username,avatar_url)",
        ].join(","))
        .eq("status", pStatus)
        .order("submitted_at", { ascending: false }).limit(100),
    ]);

    const w = (wRes.data||[]).map(x => ({...x, _type:"werk",       _title:x.title}));
    const e = (eRes.data||[]).map(x => ({...x, _type:"experience", _title:x.title}));
    const p = (pRes.data||[]).map(x => ({
      ...x, _type:"project", _title:x.project_name,
      title:x.project_name, description:x.short_desc,
      created_at:x.submitted_at,
    }));

    const all = [...w,...e,...p].sort(
      (a,b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setItems(all);

    // Pending-Count für Badge
    if (tab === "pending") onPendingChange?.(all.length);
    setLoading(false);
  }, [subTab, onPendingChange]);

  useEffect(() => { load(subTab); }, [subTab]);

  function showToast(msg, ok=true) {
    setToast({msg,ok});
    setTimeout(() => setToast(null), 3000);
  }

  // ── Freigeben ────────────────────────────────────────────────
  async function approve(item) {
    const cfg = TYPE_CFG[item._type];
    const uid = item.user_id || item.creator_id;
    setActioning(item.id);
    const now = new Date().toISOString();
    const { error } = await supabase.from(cfg.table)
      .update({
        status:      cfg.approveStatus,
        ...cfg.approveExtra,
        reviewed_at: now,
        updated_at:  now,
      })
      .eq("id", item.id);
    if (error) { showToast("Fehler: "+error.message, false); }
    else {
      await sendNotification({
        userId: uid, type:"content_approved",
        title: cfg.notifApproveTitle(item._title),
        body:  cfg.notifApproveBody(item._title),
        actionUrl: cfg.actionUrl,
        metadata: { content_type:item._type, content_id:item.id, content_title:item._title },
      });
      showToast(`✅ ${cfg.label} freigegeben`);
      setItems(p => p.filter(x => x.id !== item.id));
      onPendingChange?.(p => Math.max(0, (p||1)-1));
    }
    setActioning(null);
  }

  // ── Ablehnen ─────────────────────────────────────────────────
  async function rejectConfirm() {
    if (!rejectDlg) return;
    const cfg    = TYPE_CFG[rejectDlg._type];
    const uid    = rejectDlg.user_id || rejectDlg.creator_id;
    const reason = rejectReason.trim();
    setActioning(rejectDlg.id);
    setRejectDlg(null);
    const now = new Date().toISOString();
    const { error } = await supabase.from(cfg.table)
      .update({
        status:           cfg.rejectStatus,
        ...cfg.rejectExtra,
        rejection_reason: reason || null,
        rejected_at:      now,
        reviewed_at:      now,
        updated_at:       now,
      })
      .eq("id", rejectDlg.id);
    if (error) { showToast("Fehler: "+error.message, false); }
    else {
      await sendNotification({
        userId: uid, type:"content_rejected",
        title: cfg.notifRejectTitle(rejectDlg._title),
        body:  cfg.notifRejectBody(rejectDlg._title),
        actionUrl: cfg.actionUrl,
        metadata: {
          content_type:rejectDlg._type, content_id:rejectDlg.id,
          content_title:rejectDlg._title, rejection_reason:reason||null,
        },
      });
      showToast(`❌ ${cfg.label} abgelehnt & Nutzer benachrichtigt`);
      setItems(p => p.filter(x => x.id !== rejectDlg.id));
      onPendingChange?.(p => Math.max(0, (p||1)-1));
    }
    setRejectReason(""); setActioning(null);
  }

  // ── Kommentar speichern ───────────────────────────────────────
  async function saveComment() {
    if (!commentDlg) return;
    const cfg = TYPE_CFG[commentDlg._type];
    const { error } = await supabase.from(cfg.table)
      .update({ admin_comment: commentText.trim() || null,
                updated_at: new Date().toISOString() })
      .eq("id", commentDlg.id);
    if (error) { showToast("Fehler: "+error.message, false); }
    else {
      showToast("💬 Kommentar gespeichert");
      setItems(p => p.map(x =>
        x.id === commentDlg.id ? {...x, admin_comment:commentText.trim()||null} : x
      ));
    }
    setCommentDlg(null); setCommentText("");
  }

  // ── Gefilterte Items ─────────────────────────────────────────
  const visible = items.filter(x =>
    typeFilter === "all" ||
    (typeFilter==="works"       && x._type==="werk") ||
    (typeFilter==="experiences" && x._type==="experience") ||
    (typeFilter==="projects"    && x._type==="project")
  );

  const card = { background:C.card, borderRadius:16, padding:20,
                  border:`1px solid ${C.border}`, marginBottom:16 };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"11px 22px", borderRadius:99,
          background:toast.ok?C.green:C.red, color:"#fff",
          fontSize:13, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          pointerEvents:"none",
        }}>{toast.msg}</div>
      )}

      {/* Ablehnungs-Dialog */}
      {rejectDlg && (
        <div style={{position:"fixed",inset:0,zIndex:9900,
          background:"rgba(0,0,0,0.72)",backdropFilter:"blur(4px)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.card,borderRadius:20,padding:24,
            width:"100%",maxWidth:460,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:4}}>
              ❌ {TYPE_CFG[rejectDlg._type]?.label} ablehnen
            </div>
            <div style={{fontSize:12,color:C.sub,marginBottom:14}}>„{rejectDlg._title}"</div>
            <div style={{fontSize:12,fontWeight:600,color:C.sub,marginBottom:6}}>
              Ablehnungsgrund (sichtbar für den Nutzer):
            </div>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
              placeholder="z.B. Bilder zu unscharf, Beschreibung fehlt…" rows={3}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,
                background:C.card2,border:`1px solid ${C.border}`,
                color:C.text,fontSize:12,fontFamily:"inherit",
                resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
            <div style={{fontSize:10,color:C.muted,marginTop:3,marginBottom:14}}>
              Optional — kann leer gelassen werden.
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setRejectDlg(null);setRejectReason("");}}
                style={{flex:1,padding:"10px",borderRadius:10,
                  border:`1px solid ${C.border}`,background:"none",
                  color:C.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                Abbrechen
              </button>
              <button onClick={rejectConfirm}
                style={{flex:2,padding:"10px",borderRadius:10,border:"none",
                  background:C.red,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                ✕ Ablehnen & benachrichtigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kommentar-Dialog */}
      {commentDlg && (
        <div style={{position:"fixed",inset:0,zIndex:9900,
          background:"rgba(0,0,0,0.72)",backdropFilter:"blur(4px)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.card,borderRadius:20,padding:24,
            width:"100%",maxWidth:460,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:4}}>
              💬 Admin-Kommentar
            </div>
            <div style={{fontSize:12,color:C.sub,marginBottom:14}}>„{commentDlg._title}"</div>
            <textarea value={commentText} onChange={e=>setCommentText(e.target.value)}
              placeholder="Interner Hinweis oder Feedback für den Ersteller…" rows={3}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,
                background:C.card2,border:`1px solid ${C.border}`,
                color:C.text,fontSize:12,fontFamily:"inherit",
                resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button onClick={()=>{setCommentDlg(null);setCommentText("");}}
                style={{flex:1,padding:"10px",borderRadius:10,
                  border:`1px solid ${C.border}`,background:"none",
                  color:C.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                Abbrechen
              </button>
              <button onClick={saveComment}
                style={{flex:2,padding:"10px",borderRadius:10,border:"none",
                  background:C.teal,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                💬 Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab-Leiste */}
      <div style={{...card, display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:8}}>
        <div style={{display:"flex",gap:6}}>
          {[
            ["pending",  "⏳ Ausstehend"],
            ["approved", "✅ Freigegeben"],
            ["rejected", "❌ Abgelehnt"],
          ].map(([k,l]) => (
            <button key={k} onClick={()=>setSubTab(k)} style={{
              padding:"6px 14px", borderRadius:99, border:"none", cursor:"pointer",
              background: subTab===k ? C.teal : C.card2,
              color: subTab===k ? "#fff" : C.sub,
              fontSize:12, fontWeight:600,
            }}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:5}}>
          {[
            ["all","Alle"],
            ["works","Werke"],
            ["experiences","Erlebnisse"],
            ["projects","Projekte"],
          ].map(([k,l]) => (
            <button key={k} onClick={()=>setTypeFilter(k)} style={{
              padding:"4px 10px", borderRadius:99, border:`1px solid ${C.border}`,
              cursor:"pointer",
              background: typeFilter===k ? C.card2 : "none",
              color: typeFilter===k ? C.text : C.muted,
              fontSize:11, fontWeight:600,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40,color:C.sub}}>
          <div style={{fontSize:28,marginBottom:8}}>🔍</div>Lade…
        </div>
      ) : visible.length === 0 ? (
        <div style={{...card,textAlign:"center",padding:44,color:C.sub}}>
          <div style={{fontSize:36,marginBottom:10}}>✨</div>
          <div style={{fontSize:14,fontWeight:600}}>
            {subTab==="pending" ? "Keine Einträge zur Prüfung" :
             subTab==="approved" ? "Noch keine freigegebenen Inhalte" :
             "Keine abgelehnten Inhalte"}
          </div>
        </div>
      ) : visible.map(item => {
        const cfg     = TYPE_CFG[item._type];
        const profile = item.profiles || {};
        const uid     = item.user_id || item.creator_id;
        const acting  = actioning === item.id;
        const dateStr = item.created_at
          ? new Date(item.created_at).toLocaleDateString("de-DE",
              {day:"2-digit",month:"2-digit",year:"numeric"}) : "—";

        return (
          <div key={item.id} style={{
            background:C.card, borderRadius:14,
            border:`1px solid ${C.border}`, marginBottom:10, overflow:"hidden",
          }}>
            <div style={{display:"flex"}}>
              {/* Cover */}
              <div style={{width:84,flexShrink:0,minHeight:84,
                background:"#1A2235",position:"relative"}}>
                {item.cover_url
                  ? <img src={item.cover_url} alt=""
                      style={{width:"100%",height:"100%",objectFit:"cover",
                              position:"absolute",inset:0}}/>
                  : <div style={{position:"absolute",inset:0,display:"flex",
                      alignItems:"center",justifyContent:"center",fontSize:24}}>
                      {cfg.emoji}
                    </div>
                }
                <div style={{position:"absolute",top:5,left:5,
                  padding:"2px 6px",borderRadius:99,background:cfg.badgeBg,
                  fontSize:8,fontWeight:800,color:"#fff",letterSpacing:0.4}}>
                  {cfg.label}
                </div>
              </div>

              {/* Content */}
              <div style={{flex:1,padding:"10px 12px"}}>
                {/* Autor + Datum + Status */}
                <div style={{display:"flex",alignItems:"center",
                  gap:6,marginBottom:6}}>
                  {profile.avatar_url && (
                    <img src={profile.avatar_url} alt=""
                      style={{width:18,height:18,borderRadius:"50%",objectFit:"cover"}}/>
                  )}
                  <span style={{fontSize:10.5,color:C.sub,fontWeight:600}}>
                    {profile.display_name||profile.username||uid?.slice(0,8)}
                  </span>
                  <span style={{fontSize:9.5,color:C.muted,marginLeft:"auto"}}>
                    {dateStr}
                  </span>
                  <StatusBadge status={item.status}/>
                </div>

                {/* Titel */}
                <div style={{fontSize:13,fontWeight:800,color:C.text,
                  marginBottom:3,lineHeight:1.3}}>
                  {item.title||"Kein Titel"}
                </div>

                {/* Beschreibung */}
                {item.description && (
                  <div style={{fontSize:11,color:C.sub,lineHeight:1.4,
                    marginBottom:6,overflow:"hidden",
                    display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                    {item.description}
                  </div>
                )}

                {/* Admin-Kommentar / Ablehnungsgrund anzeigen */}
                {item.rejection_reason && (
                  <div style={{fontSize:10.5,color:C.red,
                    background:"rgba(239,68,68,0.07)",
                    border:"1px solid rgba(239,68,68,0.18)",
                    borderRadius:7,padding:"5px 8px",marginBottom:6}}>
                    <b>Grund:</b> {item.rejection_reason}
                  </div>
                )}
                {item.admin_comment && (
                  <div style={{fontSize:10.5,color:C.sub,
                    background:C.card2,borderRadius:7,
                    padding:"5px 8px",marginBottom:6}}>
                    <b>Kommentar:</b> {item.admin_comment}
                  </div>
                )}
                {item.reviewed_at && subTab !== "pending" && (
                  <div style={{fontSize:10,color:C.muted,marginBottom:6}}>
                    Geprüft am {new Date(item.reviewed_at).toLocaleDateString("de-DE")}
                  </div>
                )}

                {/* Kategorie */}
                {item.category && (
                  <div style={{display:"inline-block",padding:"2px 8px",borderRadius:99,
                    background:C.card2,border:`1px solid ${C.border}`,
                    fontSize:10,color:C.sub,marginBottom:8}}>
                    {item.category}
                  </div>
                )}

                {/* Actions — nur bei ausstehend */}
                {subTab === "pending" && (
                  <div style={{display:"flex",gap:6}}>
                    <button disabled={acting}
                      onClick={()=>approve(item)}
                      style={{flex:2,padding:"7px 0",borderRadius:8,border:"none",
                        background:acting?"rgba(16,185,129,0.28)":C.green,
                        color:"#fff",fontSize:11.5,fontWeight:700,
                        cursor:acting?"not-allowed":"pointer"}}>
                      {acting?"…":"✓ Freigeben"}
                    </button>
                    <button disabled={acting}
                      onClick={()=>{setRejectReason("");setRejectDlg(item);}}
                      style={{flex:1,padding:"7px 0",borderRadius:8,
                        background:"none",color:acting?C.muted:C.red,
                        fontSize:11,fontWeight:600,cursor:acting?"not-allowed":"pointer",
                        border:`1px solid ${acting?C.border:C.red}`}}>
                      {acting?"…":"✕ Ablehnen"}
                    </button>
                    <button
                      onClick={()=>{setCommentText(item.admin_comment||"");setCommentDlg(item);}}
                      title="Kommentar"
                      style={{width:34,padding:"7px 0",borderRadius:8,
                        background:C.card2,border:`1px solid ${C.border}`,
                        color:C.sub,fontSize:13,cursor:"pointer"}}>
                      💬
                    </button>
                  </div>
                )}

                {/* Bei freigegebenen/abgelehnten: nur Kommentar-Button */}
                {subTab !== "pending" && (
                  <button
                    onClick={()=>{setCommentText(item.admin_comment||"");setCommentDlg(item);}}
                    style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,
                      background:"none",color:C.sub,fontSize:11,cursor:"pointer"}}>
                    💬 Kommentar {item.admin_comment?"bearbeiten":"hinzufügen"}
                  </button>
                )}
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
          .order("created_at",{ascending:false}).limit(100),
        supabase.from("payments")
          .select("id,user_id,wirker_name,amount_eur,impact_eur,status,payment_status,created_at")
          .order("created_at",{ascending:false}).limit(200),
        supabase.from("impact_projects")
          .select("id,name,category,description,votes,status,goal_eur,awarded_eur,month")
          .order("votes",{ascending:false}).limit(50),
        supabase.from("works")
          .select("id",{count:"exact",head:true}).eq("status","pending_review"),
        supabase.from("experiences")
          .select("id",{count:"exact",head:true}).eq("status","pending_review"),
        supabase.from("impact_applications")
          .select("id",{count:"exact",head:true}).eq("status","pending"),
      ]);
      setWirker(wirkerRes.data     || []);
      setPayments(paymentsRes.data || []);
      setProjects(projectsRes.data || []);
      setPending((wPend.count||0)+(ePend.count||0)+(pPend.count||0));
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = payments.filter(p=>p.payment_status==="paid")
    .reduce((s,p)=>s+(p.amount_eur||0),0);
  const totalImpact  = payments.filter(p=>p.payment_status==="paid")
    .reduce((s,p)=>s+(p.impact_eur||0),0);

  const s    = {minHeight:"100vh",background:C.bg,color:C.text,
                 fontFamily:"-apple-system,sans-serif",padding:24};
  const card = {background:C.card,borderRadius:16,padding:20,
                 border:`1px solid ${C.border}`,marginBottom:16};
  const tabBtn = (active,badge) => ({
    padding:"8px 18px",borderRadius:20,border:"none",cursor:"pointer",
    background:active?C.teal:C.card2,
    color:active?"#fff":C.sub,
    fontWeight:600,fontSize:13,position:"relative",
    ...(badge>0?{paddingRight:28}:{}),
  });

  if (loading) return (
    <div style={{...s,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>🌱</div>
        <div style={{color:C.teal}}>Lade Admin-Daten…</div>
      </div>
    </div>
  );

  return (
    <div style={s}>
      <div style={{marginBottom:24}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:800}}>
          HUI Admin <span style={{color:C.teal}}>Dashboard</span>
        </h1>
        <div style={{color:C.sub,fontSize:13,marginTop:4}}>Echtzeit-Daten aus Supabase</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {[
          {key:"dashboard",label:"Dashboard"},
          {key:"content",  label:"Freigaben", badge:pending},
          {key:"wirker",   label:"Wirker"},
          {key:"payments", label:"Payments"},
          {key:"projekte", label:"Projekte"},
        ].map(({key,label,badge=0}) => (
          <button key={key} onClick={()=>setTab(key)} style={tabBtn(tab===key,badge)}>
            {label}
            {badge>0 && (
              <span style={{position:"absolute",top:-6,right:-6,
                minWidth:18,height:18,borderRadius:99,
                background:C.coral,color:"#fff",
                fontSize:10,fontWeight:800,
                display:"flex",alignItems:"center",justifyContent:"center",
                padding:"0 4px"}}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab==="dashboard" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",
            gap:12,marginBottom:16}}>
            {[
              {label:"Wirker",      value:wirker.length,                 icon:"✨",color:C.teal,  onClick:null},
              {label:"Buchungen",   value:payments.length,               icon:"📋",color:C.orange,onClick:null},
              {label:"Umsatz",      value:`${totalRevenue.toFixed(0)} €`,icon:"💰",color:C.green, onClick:null},
              {label:"Impact Pool", value:`${totalImpact.toFixed(2)} €`, icon:"🌱",color:C.coral, onClick:null},
              {label:"Zur Prüfung", value:pending,                       icon:"📝",color:C.yellow,onClick:()=>setTab("content")},
            ].map(kpi => (
              <div key={kpi.label} onClick={kpi.onClick||undefined}
                style={{...card,marginBottom:0,cursor:kpi.onClick?"pointer":"default"}}>
                <div style={{fontSize:24,marginBottom:6}}>{kpi.icon}</div>
                <div style={{fontSize:22,fontWeight:800,color:kpi.color}}>{kpi.value}</div>
                <div style={{fontSize:12,color:C.sub}}>{kpi.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{fontWeight:700,marginBottom:12}}>🌍 Impact Projekte ({projects.length})</div>
            {projects.slice(0,3).map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",
                padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13}}>{p.name||p.title}</span>
                <span style={{color:C.teal,fontSize:12,fontWeight:600}}>{p.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="content"  && <FreigabenTab onPendingChange={setPending}/>}

      {tab==="wirker" && (
        <div style={card}>
          <div style={{fontWeight:700,marginBottom:12}}>✨ Alle Wirker ({wirker.length})</div>
          {(wirker||[]).filter(w=>w&&typeof w==="object").map(w=>(
            <div key={w.id} style={{display:"flex",alignItems:"center",gap:12,
              padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:36,height:36,borderRadius:"50%",
                background:C.teal+"30",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:16}}>✨</div>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{w.name}</div>
                <div style={{color:C.sub,fontSize:12}}>{w.talent} · {w.location}</div>
              </div>
              <div style={{marginLeft:"auto",color:C.gold,fontSize:13,fontWeight:700}}>
                {w.hourly_rate} €/h
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="payments" && (
        <div style={card}>
          <div style={{fontWeight:700,marginBottom:12}}>💳 Buchungen ({payments.length})</div>
          {(payments||[]).filter(p=>p&&typeof p==="object").map(p=>(
            <div key={p.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:600}}>{p.wirker_name||p.item_name}</span>
                <span style={{color:p.payment_status==="paid"?C.green:C.orange,
                  fontSize:12,fontWeight:700}}>{p.payment_status}</span>
              </div>
              <div style={{color:C.sub,fontSize:12,marginTop:2}}>
                {p.amount_eur} € · Impact: {p.impact_eur} €
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="projekte" && (
        <div style={card}>
          <div style={{fontWeight:700,marginBottom:12}}>🌍 Impact Projekte ({projects.length})</div>
          {(projects||[]).filter(p=>p&&typeof p==="object").map(p=>(
            <div key={p.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontWeight:600,fontSize:14}}>{p.name||p.title}</div>
              <div style={{color:C.sub,fontSize:12,marginTop:2}}>
                {p.category} · {p.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
