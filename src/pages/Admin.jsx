import { HUIAnalyticsIcon, HUIImpactIcon, HUIStatistikIcon, HUIWarnIcon, HUIWerkeIcon } from '../design/icons/HuiSystemIcons.jsx';
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { formatDateDE } from "../lib/formatters.js";
import { useTranslation } from "../hooks/useTranslation.js";
import StartphaseTab from '../components/admin/StartphaseTab.jsx';

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
    label: (t) => t("adm.labelWerk"), emoji:"🎨",
    badgeBg:"rgba(245,166,35,0.92)",
    table:"works",
    pendingStatus:"pending_review",
    approveStatus:"published",
    rejectStatus:"rejected",
    approveExtra: { published_at: new Date().toISOString() },
    rejectExtra:  { published_at: null },
    notifApproveTitle: (title, t) => t("adm.notifWerkApproveTitle"),
    notifApproveBody:  (title, t) => t("adm.notifWerkApproveBody", { title }),
    notifRejectTitle:  (title, t) => t("adm.notifWerkRejectTitle"),
    notifRejectBody:   (title, t) => t("adm.notifWerkRejectBody", { title }),
    actionUrl:"/studio",
  },
  experience: {
    label: (t) => t("adm.labelErlebnis"), emoji:"🎟",
    badgeBg:"rgba(42,191,172,0.92)",
    table:"experiences",
    pendingStatus:"pending_review",
    approveStatus:"published",
    rejectStatus:"rejected",
    approveExtra: { published_at: new Date().toISOString() },
    rejectExtra:  { published_at: null },
    notifApproveTitle: (title, t) => t("adm.notifExpApproveTitle"),
    notifApproveBody:  (title, t) => t("adm.notifWerkApproveBody", { title }),
    notifRejectTitle:  (title, t) => t("adm.notifExpRejectTitle"),
    notifRejectBody:   (title, t) => t("adm.notifWerkRejectBody", { title }),
    actionUrl:"/studio",
  },
  project: {
    label: (t) => t("adm.labelProjekt"), emoji:"🌍",
    badgeBg:"rgba(167,139,250,0.92)",
    table:"impact_applications",
    pendingStatus:"pending",
    approveStatus:"approved",
    rejectStatus:"rejected",
    approveExtra:{},
    rejectExtra:{},
    notifApproveTitle: (title, t) => t("adm.notifProjApproveTitle"),
    notifApproveBody:  (title, t) => t("adm.notifProjApproveBody", { title }),
    notifRejectTitle:  (title, t) => t("adm.notifProjRejectTitle"),
    notifRejectBody:   (title, t) => t("adm.notifProjRejectBody", { title }),
    actionUrl:"/impact",
  },
};

// ─────────────────────────────────────────────────────────────────
// Status-Badge
// ─────────────────────────────────────────────────────────────────
const getStatusStyle = (t) => ({
  pending_review: { label: t("adm.statusPending"), color:"#FBBF24", bg:"rgba(251,191,36,0.12)" },
  pending:        { label: t("adm.statusPending"), color:"#FBBF24", bg:"rgba(251,191,36,0.12)" },
  published:      { label: t("adm.statusApproved"), color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  approved:       { label: t("adm.statusApproved"), color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  rejected:       { label: t("adm.statusRejected"), color:"#EF4444", bg:"rgba(239,68,68,0.12)"  },
  draft:          { label: t("adm.statusDraft"), color:"#94A3B8", bg:"rgba(148,163,184,0.12)" },
});
function StatusBadge({ status }) {
  const { t } = useTranslation();
  const STATUS_STYLE = getStatusStyle(t);
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span style={{
      padding:"2px 8px", borderRadius:99,
      background:s.bg, color:s.color,
      fontSize:10, fontWeight: 600,
    }}>{s.label}</span>
  );
}

// ─────────────────────────────────────────────────────────────────
// KommentarMeldungenTab (KOMMENTAR.1, 2026-07-09) — Melde-Queue fuer
// post_comments/comment_reports (Migration 073). Bestandsanalyse:
// es gab bisher appweit KEIN Report-/Moderationssystem fuer Inhalte
// (siehe Migrationskommentar), daher echte Neuentwicklung, keine
// Dopplung eines bestehenden Admin-Bereichs.
// ─────────────────────────────────────────────────────────────────
function KommentarMeldungenTab({ onCountChange }) {
  const { t } = useTranslation();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId,  setBusyId]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: reports, error } = await supabase
      .from("comment_reports")
      .select("id,comment_id,reporter_id,reason,status,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !reports) { setRows([]); setLoading(false); onCountChange?.(0); return; }

    const commentIds  = [...new Set(reports.map(r => r.comment_id))];
    const reporterIds = [...new Set(reports.map(r => r.reporter_id))];

    const { data: cmts } = commentIds.length
      ? await supabase.from("post_comments").select("id,text,user_id,post_id,post_type,deleted_at").in("id", commentIds)
      : { data: [] };
    const authorIds = [...new Set((cmts || []).map(c => c.user_id))];
    const profileIds = [...new Set([...reporterIds, ...authorIds])];

    const { data: profiles } = profileIds.length
      ? await supabase.from("profiles").select("id,display_name,username").in("id", profileIds)
      : { data: [] };

    const cmtMap  = new Map((cmts || []).map(c => [c.id, c]));
    const profMap = new Map((profiles || []).map(p => [p.id, p]));

    const merged = reports.map(r => {
      const cmt = cmtMap.get(r.comment_id);
      return {
        ...r,
        comment: cmt || null,
        commentAuthor: cmt ? profMap.get(cmt.user_id) : null,
        reporter: profMap.get(r.reporter_id),
      };
    });

    setRows(merged);
    onCountChange?.(merged.length);
    setLoading(false);
  }, [onCountChange]);

  useEffect(() => { load(); }, [load]);

  async function handleDeleteComment(row) {
    setBusyId(row.id);
    // Soft-Delete (identisches Muster wie commentsService.deleteComment) --
    // kein Hard-DELETE, damit Realtime-Konsumenten (payload.old nur id bei
    // DELETE, siehe MERKEN.3-Lehre) sauber ueber UPDATE informiert werden.
    await supabase.from("post_comments").update({ deleted_at: new Date().toISOString(), text: "" }).eq("id", row.comment_id);
    await supabase.from("comment_reports").update({ status: "reviewed", reviewed_at: new Date().toISOString() }).eq("id", row.id);
    setRows(prev => { const next = prev.filter(r => r.id !== row.id); onCountChange?.(next.length); return next; });
    setBusyId(null);
  }

  async function handleDismiss(row) {
    setBusyId(row.id);
    await supabase.from("comment_reports").update({ status: "dismissed", reviewed_at: new Date().toISOString() }).eq("id", row.id);
    setRows(prev => { const next = prev.filter(r => r.id !== row.id); onCountChange?.(next.length); return next; });
    setBusyId(null);
  }

  const card = { background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18 };

  if (loading) return <div style={card}>{t("adm.loadingReports")}</div>;

  return (
    <div style={card}>
      <div style={{ fontWeight: 600, marginBottom:14 }}>{t("adm.reportedComments", { count: rows.length })}</div>
      {rows.length === 0 ? (
        <div style={{ color:C.sub, fontSize:13 }}>{t("adm.noReports")}</div>
      ) : rows.map(row => (
        <div key={row.id} style={{
          padding:"14px 0", borderBottom:`1px solid ${C.border}`,
          display:"flex", flexDirection:"column", gap:8,
        }}>
          <div style={{ fontSize:12, color:C.sub }}>
            {t("adm.reportedBy")} <b style={{ color:C.text }}>{row.reporter?.display_name || t("adm.unknown")}</b>
            {" · "}{t("adm.reason")} <span style={{ color:C.coral, fontWeight:600 }}>{row.reason}</span>
            {" · "}{formatDateDE(new Date(row.created_at), { day:"numeric", month:"short", year:"numeric" })}
          </div>
          <div style={{
            background:C.card2, borderRadius:10, padding:"10px 12px",
            fontSize:13.5, color:C.text, lineHeight:1.5,
          }}>
            {row.comment?.deleted_at
              ? <span style={{ color:C.sub, fontStyle:"italic" }}>{t("adm.commentDeleted")}</span>
              : (row.comment?.text || <span style={{ color:C.sub, fontStyle:"italic" }}>{t("adm.commentNotFound")}</span>)}
          </div>
          <div style={{ fontSize:11.5, color:C.muted }}>
            von {row.commentAuthor?.display_name || t("adm.unknown")} · {row.comment?.post_type || "?"} #{row.comment?.post_id?.slice(0,8) || "?"}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button disabled={busyId===row.id || row.comment?.deleted_at} onClick={() => handleDeleteComment(row)} style={{
              padding:"7px 14px", borderRadius:20, border:"none", cursor:"pointer",
              background:C.red, color:"#fff", fontWeight:600, fontSize:12.5,
              opacity: (busyId===row.id || row.comment?.deleted_at) ? 0.5 : 1,
            }}>
              Kommentar löschen
            </button>
            <button disabled={busyId===row.id} onClick={() => handleDismiss(row)} style={{
              padding:"7px 14px", borderRadius:20, border:`1px solid ${C.border}`, cursor:"pointer",
              background:"transparent", color:C.sub, fontWeight:600, fontSize:12.5,
              opacity: busyId===row.id ? 0.5 : 1,
            }}>
              Meldung abweisen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FreigabenTab — Ausstehend / Freigegeben / Abgelehnt
// ─────────────────────────────────────────────────────────────────
function FreigabenTab({ onPendingChange }) {
  const { t } = useTranslation();
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
          "last_submitted_at","is_update",
          ].join(","))
        .eq("status", wStatus)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("experiences")
        .select([
          "id","user_id","title","description","cover_url",
          "category","experience_type","status","created_at","reviewed_at","rejected_at",
          "admin_comment","review_note","rejection_reason",
        ].join(","))
        .eq("status", eStatus)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("impact_applications")
        .select([
          "id","user_id","project_name","short_desc","cover_url",
          "status","submitted_at","reviewed_at","rejected_at",
          "admin_comment","review_note","rejection_reason",
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
        last_submitted_at: null,
        is_update: false,
      })
      .eq("id", item.id);
    if (error) { showToast(t("adm.errorPrefix")+error.message, false); }
    else {
      await sendNotification({
        userId: uid, type:"content_approved",
        title: cfg.notifApproveTitle(item._title, t),
        body:  cfg.notifApproveBody(item._title, t),
        actionUrl: cfg.actionUrl,
        metadata: { content_type:item._type, content_id:item.id, content_title:item._title },
      });
      showToast(`✅ ${cfg.label(t)} ` + t("adm.statusApproved"));
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
        last_submitted_at: null,
        is_update: false,
      })
      .eq("id", rejectDlg.id);
    if (error) { showToast(t("adm.errorPrefix")+error.message, false); }
    else {
      await sendNotification({
        userId: uid, type:"content_rejected",
        title: cfg.notifRejectTitle(rejectDlg._title, t),
        body:  cfg.notifRejectBody(rejectDlg._title, t),
        actionUrl: cfg.actionUrl,
        metadata: {
          content_type:rejectDlg._type, content_id:rejectDlg.id,
          content_title:rejectDlg._title, rejection_reason:reason||null,
        },
      });
      showToast(t("adm.rejectedToast", { label: cfg.label(t) }));
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
    if (error) { showToast(t("adm.errorPrefix")+error.message, false); }
    else {
      showToast(t("adm.commentSaved"));
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
          fontSize:13, fontWeight: 600, boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
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
            <div style={{fontSize:16,fontWeight: 600,color:C.text,marginBottom:4}}>
              {t("adm.rejectTitle", { label: TYPE_CFG[rejectDlg._type]?.label(t) })}
            </div>
            <div style={{fontSize:12,color:C.sub,marginBottom:14}}>„{rejectDlg._title}"</div>
            <div style={{fontSize:12,fontWeight:600,color:C.sub,marginBottom:6}}>
              {t("adm.rejectReasonLabel")}
            </div>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
              placeholder={t("adm.rejectPlaceholder")} rows={3}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,
                background:C.card2,border:`1px solid ${C.border}`,
                color:C.text,fontSize:12,fontFamily:"inherit",
                resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
            <div style={{fontSize:10,color:C.muted,marginTop:3,marginBottom:14}}>
              {t("adm.rejectOptional")}
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
                  background:C.red,color:"#fff",fontSize:12,fontWeight: 600,cursor:"pointer"}}>
                {t("adm.rejectConfirm")}
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
            <div style={{fontSize:16,fontWeight: 600,color:C.text,marginBottom:4}}>
              {t("adm.commentTitle")}
            </div>
            <div style={{fontSize:12,color:C.sub,marginBottom:14}}>„{commentDlg._title}"</div>
            <textarea value={commentText} onChange={e=>setCommentText(e.target.value)}
              placeholder={t("adm.commentPlaceholder")} rows={3}
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
                  background:C.teal,color:"#fff",fontSize:12,fontWeight: 600,cursor:"pointer"}}>
                {t("adm.saveComment")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner: Pending-Hinweis für Werke */}
      {subTab === "pending" && items.filter(x => x._type==="werk").length > 0 && (
        <div style={{...card, background:"rgba(251,191,36,0.09)",
          border:"1px solid rgba(251,191,36,0.30)", marginBottom:8,
          display:"flex", alignItems:"center", gap:10}}>
          <HUIWarnIcon size={20} style={{color:'#F59E0B'}} />
          <div>
            <div style={{fontSize:13,fontWeight: 600,color:C.yellow}}>
              {t("adm.pendingBanner", { count: items.filter(x=>x._type==="werk").length })}
            </div>
            <div style={{fontSize:11,color:C.sub,marginTop:1}}>
              {t("adm.pendingBannerSub")}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab-Leiste */}
      <div style={{...card, display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:8}}>
        <div style={{display:"flex",gap:6}}>
          {[
            ["pending",  t("adm.tabPending")],
            ["approved", t("adm.tabApproved")],
            ["rejected", t("adm.tabRejected")],
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
            ["all", t("adm.filterAll")],
            ["works", t("adm.filterWorks")],
            ["experiences", t("adm.filterExperiences")],
            ["projects", t("adm.filterProjects")],
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
            {subTab==="pending" ? t("adm.emptyPending") :
             subTab==="approved" ? t("adm.emptyApproved") :
             t("adm.emptyRejected")}
          </div>
        </div>
      ) : visible.map(item => {
        const cfg     = TYPE_CFG[item._type];
        const profile = item.profiles || {};
        const uid     = item.user_id || item.creator_id;
        const acting  = actioning === item.id;
        const submittedAt = item._type==="werk" ? (item.last_submitted_at || item.created_at) : item.created_at;
        const dateStr = submittedAt
          ?formatDateDE(new Date(submittedAt), {day:"2-digit",month:"2-digit",year:"numeric"}) : "—";

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
                  ? <img loading="lazy" decoding="async" src={item.cover_url} alt=""
                      style={{width:"100%",height:"100%",objectFit:"cover",
                              position:"absolute",inset:0}}/>
                  : <div style={{position:"absolute",inset:0,display:"flex",
                      alignItems:"center",justifyContent:"center",fontSize:24}}>
                      {cfg.emoji}
                    </div>
                }
                <div style={{position:"absolute",top:5,left:5,
                  padding:"2px 6px",borderRadius:99,background:cfg.badgeBg,
                  fontSize:8,fontWeight: 600,color:"#fff",letterSpacing:0.4}}>
                  {cfg.label}
                </div>
              </div>

              {/* Content */}
              <div style={{flex:1,padding:"10px 12px"}}>
                {/* Autor + Datum + Status */}
                <div style={{display:"flex",alignItems:"center",
                  gap:6,marginBottom:6}}>
                  {profile.avatar_url && (
                    <img loading="lazy" decoding="async" src={profile.avatar_url} alt=""
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

                {/* Titel + NEU/AKTUALISIERT Badge */}
                <div style={{fontSize:13,fontWeight: 600,color:C.text,
                  marginBottom:3,lineHeight:1.3,display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                  <span>{item._title||item.title||t("adm.noTitle")}</span>
                  {item._type==="werk" && subTab==="pending" && (
                    item.is_update
                      ? <span style={{padding:"1px 6px",borderRadius:99,fontSize:8,fontWeight: 600,
                          background:"rgba(168,139,250,0.20)",color:"#A78BFA",flexShrink:0}}>{t("adm.updated")}</span>
                      : <span style={{padding:"1px 6px",borderRadius:99,fontSize:8,fontWeight: 600,
                          background:"rgba(42,191,172,0.20)",color:"#2ABFAC",flexShrink:0}}>{t("adm.new")}</span>
                  )}
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
                    <b>{t("adm.grundLabel")}</b> {item.rejection_reason}
                  </div>
                )}
                {item.admin_comment && (
                  <div style={{fontSize:10.5,color:C.sub,
                    background:C.card2,borderRadius:7,
                    padding:"5px 8px",marginBottom:6}}>
                    <b>{t("adm.commentLabel")}</b> {item.admin_comment}
                  </div>
                )}
                {item.reviewed_at && subTab !== "pending" && (
                  <div style={{fontSize:10,color:C.muted,marginBottom:6}}>
                    {t("adm.reviewedAt", { date: formatDateDE(new Date(item.reviewed_at)) })}
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
                        color:"#fff",fontSize:11.5,fontWeight: 600,
                        cursor:acting?"not-allowed":"pointer"}}>
                      {acting?"…":t("adm.btnApprove")}
                    </button>
                    <button disabled={acting}
                      onClick={()=>{setRejectReason("");setRejectDlg(item);}}
                      style={{flex:1,padding:"7px 0",borderRadius:8,
                        background:"none",color:acting?C.muted:C.red,
                        fontSize:11,fontWeight:600,cursor:acting?"not-allowed":"pointer",
                        border:`1px solid ${acting?C.border:C.red}`}}>
                      {acting?"…":t("adm.btnReject")}
                    </button>
                    <button
                      onClick={()=>{setCommentText(item.admin_comment||"");setCommentDlg(item);}}
                      title={t("adm.commentTitle")}
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
                    💬 {t("adm.commentEdit", { action: item.admin_comment ? t("adm.commentEditAction") : t("adm.commentAdd") })}
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
// ErlebnisseProjekteTab — Struktur bereit, Supabase-Anbindung folgt
// Tabellen: experiences, projects, initiatives (später)
// ─────────────────────────────────────────────────────────────────
function ErlebnisseProjekteTab() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("alle");

  const FILTERS = [
    { key:"alle",       label: t("adm.epFilterAll")       },
    { key:"published",  label: t("adm.epFilterPublished")  },
    { key:"draft",      label: t("adm.epFilterDraft")      },
    { key:"gemeldet",   label: t("adm.epFilterReported")   },
    { key:"geloescht",  label: t("adm.epFilterDeleted")   },
    { key:"sensitiv",   label: t("adm.epFilterSensitive")   },
  ];

  const STATS = [
    { label: t("adm.epStatTotal"),    value:"—", icon:"📊", color:C.teal   },
    { label: t("adm.epStatPublished"), value:"—", icon:"✅", color:C.green  },
    { label: t("adm.epStatDraft"),     value:"—", icon:"✏️", color:C.sub    },
    { label: t("adm.epStatReported"),  value:"—", icon:"⚠️", color:C.yellow },
    { label: t("adm.epStatDeleted"),  value:"—", icon:"🗑️", color:C.coral  },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        background:C.card, borderRadius:16, padding:20,
        border:`1px solid ${C.border}`, marginBottom:12,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <HUIImpactIcon size={22} style={{color:'rgba(14,196,184,0.7)'}} />
          <div>
            <div style={{fontSize:16,fontWeight: 600,color:C.text}}>
              {t("adm.epTitle")}
            </div>
            <div style={{fontSize:12,color:C.sub,marginTop:2}}>
              {t("adm.epSubtitle")}
            </div>
          </div>
          <div style={{
            marginLeft:"auto", padding:"4px 10px", borderRadius:99,
            background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.30)",
            color:C.yellow, fontSize:10, fontWeight: 600, letterSpacing:"0.08em",
          }}>{t("adm.epComingSoon", { default: "COMING SOON" })}</div>
        </div>
      </div>

      {/* Statistik-Kacheln */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(5,1fr)",
        gap:10, marginBottom:12,
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background:C.card, borderRadius:12, padding:"14px 12px",
            border:`1px solid ${C.border}`, textAlign:"center",
          }}>
            <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight: 600,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:C.sub,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filterleiste */}
      <div style={{
        background:C.card, borderRadius:14, padding:"12px 16px",
        border:`1px solid ${C.border}`, marginBottom:12,
        display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
      }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding:"5px 14px", borderRadius:99, border:`1px solid ${C.border}`,
            cursor:"pointer",
            background: filter===f.key ? C.teal : C.card2,
            color:       filter===f.key ? "#fff" : C.sub,
            fontSize:12, fontWeight:600,
          }}>{f.label}</button>
        ))}
      </div>

      {/* Tabelle */}
      <div style={{
        background:C.card, borderRadius:14,
        border:`1px solid ${C.border}`, overflow:"hidden",
      }}>
        {/* Tabellen-Header */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr",
          gap:0, padding:"10px 16px",
          borderBottom:`1px solid ${C.border}`,
          background:C.card2,
        }}>
          {[t("adm.epTableTitle"), t("adm.epTableCategory"), t("adm.epTableStatus"), t("adm.epTablePrice"), t("adm.epTableEngagement"), t("adm.epTableCreated"), t("adm.epTableActions")].map(h => (
            <div key={h} style={{fontSize:11,fontWeight: 600,color:C.sub,
              letterSpacing:"0.06em",textTransform:"uppercase"}}>{h}</div>
          ))}
        </div>

        {/* Leerer Zustand */}
        <div style={{textAlign:"center",padding:"60px 20px",color:C.sub}}>
          <div style={{marginBottom:12, display:'flex', justifyContent:'center'}}><HUIImpactIcon size={40} style={{color:'rgba(14,196,184,0.5)'}} /></div>
          <div style={{fontSize:15,fontWeight: 600,color:C.text,marginBottom:6}}>
            {t("adm.epEmpty")}
          </div>
          <div style={{fontSize:12,color:C.sub,maxWidth:320,margin:"0 auto",lineHeight:1.6}}>
            {t("adm.epEmptyDesc")}
          </div>
          <div style={{
            marginTop:16, display:"inline-flex", gap:8, flexWrap:"wrap",
            justifyContent:"center",
          }}>
            {["experiences","projects","initiatives"].map(t => (
              <span key={t} style={{
                padding:"4px 12px", borderRadius:99,
                background:"rgba(42,191,172,0.10)",
                border:"1px solid rgba(42,191,172,0.25)",
                color:C.teal, fontSize:11, fontWeight:600,
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Admin
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// FEED.12D — FeedAnalyticsTab
// Zeigt Feed-Impressions (creator_analytics) +
// Scroll-Tiefe (platform_events) für den eingeloggten Admin.
// Kein Service-Role nötig — nutzt bestehende RLS-Policies.
// ─────────────────────────────────────────────────────────────────
function FeedAnalyticsTab() {
  const { t } = useTranslation();
  const [loading,   setLoading]   = useState(true);
  const [impress,   setImpress]   = useState({ total:0, works:0, exps:0, topWorks:[], topExps:[] });
  const [depth,     setDepth]     = useState({ d5:0, d10:0, d20:0, end:0, sessions:0 });
  const [invisible, setInvisible] = useState({ works:[], exps:[] });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        analyticsRes,
        depthRes,
        worksRes,
        expsRes,
      ] = await Promise.all([
        // creator_analytics: alle work_view + experience_view die dieser Creator erhalten hat
        supabase.from("creator_analytics")
          .select("event_type, source_id, created_at")
          .in("event_type", ["work_view","experience_view"])
          .order("created_at", { ascending: false })
          .limit(1000),
        // platform_events: eigene Scroll-Tiefe (als Test des eigenen Accounts)
        supabase.from("platform_events")
          .select("event_type, metadata, created_at")
          .in("event_type", ["feed_depth_5","feed_depth_10","feed_depth_20","feed_end_reached"])
          .order("created_at", { ascending: false })
          .limit(500),
        // Works ohne Views ermitteln (öffentlich lesbar)
        supabase.from("works")
          .select("id, title, media_url")
          .eq("status","published")
          .limit(100),
        // Experiences ohne Views ermitteln (öffentlich lesbar)
        supabase.from("experiences")
          .select("id, title, cover_url")
          .eq("status","published")
          .limit(100),
      ]);

      const analytics = analyticsRes.data || [];
      const wViews = analytics.filter(a => a.event_type === "work_view");
      const eViews = analytics.filter(a => a.event_type === "experience_view");

      // Top Works nach Impression-Häufigkeit
      const workCounts = {};
      wViews.forEach(a => { workCounts[a.source_id] = (workCounts[a.source_id]||0)+1; });
      const topWorks = Object.entries(workCounts)
        .sort((a,b)=>b[1]-a[1]).slice(0,5)
        .map(([id,count]) => ({ id, count }));

      // Top Experiences
      const expCounts = {};
      eViews.forEach(a => { expCounts[a.source_id] = (expCounts[a.source_id]||0)+1; });
      const topExps = Object.entries(expCounts)
        .sort((a,b)=>b[1]-a[1]).slice(0,5)
        .map(([id,count]) => ({ id, count }));

      setImpress({
        total: analytics.length,
        works: wViews.length,
        exps:  eViews.length,
        topWorks,
        topExps,
      });

      // Scroll-Tiefe
      const depthData = depthRes.data || [];
      const d5   = depthData.filter(d => d.event_type === "feed_depth_5").length;
      const d10  = depthData.filter(d => d.event_type === "feed_depth_10").length;
      const d20  = depthData.filter(d => d.event_type === "feed_depth_20").length;
      const end  = depthData.filter(d => d.event_type === "feed_end_reached").length;
      const sessions = Math.max(d5, d10, d20, end, 1);
      setDepth({ d5, d10, d20, end, sessions });

      // Unsichtbare Inhalte
      const seenWorkIds  = new Set(Object.keys(workCounts));
      const seenExpIds   = new Set(Object.keys(expCounts));
      const invisWorks = (worksRes.data||[]).filter(w => !seenWorkIds.has(w.id));
      const invisExps  = (expsRes.data||[]).filter(e => !seenExpIds.has(e.id));
      setInvisible({ works: invisWorks, exps: invisExps });

      setLoading(false);
    }
    load();
  }, []);

  const card = { background:C.card, borderRadius:16, padding:20,
                 border:`1px solid ${C.border}`, marginBottom:16 };
  const kpiGrid = { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:16 };

  const pct = (n, base) => base > 0 ? Math.round((n/base)*100) : 0;

  if (loading) return (
    <div style={{textAlign:"center",padding:40}}>
      <div style={{marginBottom:8,display:"flex",justifyContent:"center",color:"rgba(14,196,184,0.5)"}}><HUIStatistikIcon size={32}/></div>
      <div style={{color:C.sub}}>{t("adm.faLoading")}</div>
    </div>
  );

  return (
    <div>
      {/* ── Impressions ── */}
      <div style={{...card}}>
        <div style={{fontWeight: 600,marginBottom:14,fontSize:15,display:'flex',alignItems:'center',gap:6}}><HUIAnalyticsIcon size={16}/>{t("adm.faImpressions")}</div>
        <div style={kpiGrid}>
          {[
            { label: t("adm.faTotal"),    value: impress.total, color: C.teal,   icon:"👁" },
            { label: t("adm.faWorkViews"), value: impress.works, color: C.purple, icon:"🎨" },
            { label: t("adm.faExpViews"),  value: impress.exps,  color: C.orange, icon:"🗓" },
            { label: t("adm.faInvisibleWorks"), value: invisible.works.length, color: invisible.works.length > 0 ? C.coral : C.green, icon:"⚠️" },
          ].map(kpi => (
            <div key={kpi.label} style={{background:C.card2,borderRadius:12,padding:14,
              border:`1px solid ${C.border}`}}>
              <div style={{fontSize:20,marginBottom:4}}>{kpi.icon}</div>
              <div style={{fontSize:22,fontWeight: 600,color:kpi.color}}>{kpi.value}</div>
              <div style={{fontSize:11,color:C.sub,marginTop:2}}>{kpi.label}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:4}}>
          ℹ️ Zeigt {t("adm.faImpressions")} für deinen Creator-Account (RLS-begrenzt).
          Plattform-weite Aggregation erfordert RPC-Erweiterung.
        </div>
      </div>

      {/* ── Scroll-Tiefe / Feed-Funnel ── */}
      <div style={card}>
        <div style={{fontWeight: 600,marginBottom:14,fontSize:15}}>📉 Scroll-Tiefe (eigener Account)</div>
        {depth.sessions === 1 && depth.d5 === 0 ? (
          <div style={{color:C.sub,fontSize:13,padding:"12px 0"}}>
            Noch keine Scroll-Tiefe-Daten vorhanden.
            Scrolle durch den Feed um erste Daten zu erzeugen.
          </div>
        ) : (
          <>
            {[
              { label: t("adm.faCard5"),     value:depth.d5,  base:depth.sessions, color:C.green  },
              { label: t("adm.faCard10"),    value:depth.d10, base:depth.sessions, color:C.teal   },
              { label: t("adm.faCard20"),    value:depth.d20, base:depth.sessions, color:C.gold   },
              { label: t("adm.faFeedEnd"),   value:depth.end, base:depth.sessions, color:C.purple },
            ].map(row => (
              <div key={row.label} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",
                  fontSize:12,marginBottom:4}}>
                  <span style={{color:C.sub}}>{row.label}</span>
                  <span style={{color:row.color,fontWeight: 600}}>
                    {row.value}× ({pct(row.value, row.base)}%)
                  </span>
                </div>
                <div style={{height:6,borderRadius:99,background:C.card2,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:99,background:row.color,
                    width:`${pct(row.value, row.base)}%`,
                    transition:"width 0.6s ease"}} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Top Works ── */}
      {impress.topWorks.length > 0 && (
        <div style={card}>
          <div style={{fontWeight: 600,marginBottom:12,fontSize:15,display:'flex',alignItems:'center',gap:6}}><HUIWerkeIcon size={16}/>{t("adm.faTopWorks")}</div>
          {impress.topWorks.map((w,i) => (
            <div key={w.id} style={{display:"flex",justifyContent:"space-between",
              padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.sub,fontSize:12}}>#{i+1} {w.id.slice(0,8)}…</span>
              <span style={{color:C.teal,fontWeight: 600,fontSize:13}}>{w.count}×</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Top Experiences ── */}
      {impress.topExps.length > 0 && (
        <div style={card}>
          <div style={{fontWeight: 600,marginBottom:12,fontSize:15}}>🗓 Top Experiences (nach Impressions)</div>
          {impress.topExps.map((e,i) => (
            <div key={e.id} style={{display:"flex",justifyContent:"space-between",
              padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.sub,fontSize:12}}>#{i+1} {e.id.slice(0,8)}…</span>
              <span style={{color:C.orange,fontWeight: 600,fontSize:13}}>{e.count}×</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Unsichtbare Inhalte ── */}
      {(invisible.works.length > 0 || invisible.exps.length > 0) && (
        <div style={card}>
          <div style={{fontWeight: 600,marginBottom:12,fontSize:15}}>
            {t("adm.faInvisible", { count: invisible.works.length + invisible.exps.length })} ({invisible.works.length + invisible.exps.length})
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>
            Published, aber 0 {t("adm.faImpressions")} erhalten
          </div>
          {invisible.works.slice(0,5).map(w => (
            <div key={w.id} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}`,
              fontSize:12}}>
              <span style={{color:C.coral,display:"flex",alignItems:"center",gap:3}}><HUIWerkeIcon size={12}/>{t("cps.typeWork")}</span>
              <span style={{color:C.sub,marginLeft:8}}>{w.title || w.id.slice(0,12)}</span>
            </div>
          ))}
          {invisible.exps.slice(0,5).map(e => (
            <div key={e.id} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}`,
              fontSize:12}}>
              <span style={{color:C.gold}}>🗓 Experience</span>
              <span style={{color:C.sub,marginLeft:8}}>{e.title || e.id.slice(0,12)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── SQL-Referenz ── */}
      <div style={{...card,background:C.bg}}>
        <div style={{fontWeight: 600,marginBottom:10,fontSize:13,color:C.sub}}>
          {t("adm.faSqlRef")}
        </div>
        {[
          [t("adm.faSqlImpressions"),
           `SELECT COUNT(*) FROM creator_analytics
WHERE event_type IN ('work_view','experience_view')`],
          [t("adm.faSqlCard5"),
           `SELECT COUNT(DISTINCT actor_id) FROM platform_events
WHERE event_type = 'feed_depth_5'`],
          [t("adm.faSqlFeedEnd"),
           `SELECT
  COUNT(DISTINCT CASE WHEN event_type='feed_depth_5' THEN actor_id END) as d5,
  COUNT(DISTINCT CASE WHEN event_type='feed_end_reached' THEN actor_id END) as end_reached
FROM platform_events`],
          [t("adm.faSqlInvisible"),
           `SELECT w.id, w.title FROM works w
LEFT JOIN creator_analytics ca
  ON ca.source_id = w.id AND ca.event_type='work_view'
WHERE w.status='published' AND ca.id IS NULL`],
        ].map(([label, sql]) => (
          <div key={label} style={{marginBottom:12}}>
            <div style={{color:C.teal,fontSize:11,fontWeight: 600,marginBottom:4}}>{label}</div>
            <pre style={{background:C.card2,borderRadius:8,padding:"8px 12px",
              fontSize:10,color:C.sub,overflowX:"auto",margin:0,whiteSpace:"pre-wrap"}}>
              {sql}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const { t } = useTranslation();
  const [wirker,   setWirker]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pending,  setPending]  = useState(0);
  const [commentReports, setCommentReports] = useState(0); // KOMMENTAR.1
  const [startphaseNew, setStartphaseNew] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("dashboard");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [wirkerRes, paymentsRes, projectsRes,
             wPend, ePend, pPend, cReportsPend] = await Promise.all([
        supabase.from("wirker")
          .select("id,name,full_name,talent,location,img,verified,bookings,impact_eur,created_at")
          .order("created_at",{ascending:false}).limit(100),
        // Legacy-Hinweis: Diese Stelle liest aus der alten Tabelle 'payments'.
        // Die Tabelle wurde nie befuellt und hat kein SSOT-Mapping (SYS-LegacyMark-024).
        // UI zeigt korrekt leer/0 an. Kein Ersatz vorhanden.

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
        // KOMMENTAR.1: offene Kommentar-Meldungen fuer den Tab-Badge.
        // .catch() -- Migration 073 evtl. noch nicht ausgefuehrt, Dashboard
        // darf dadurch nicht abstuerzen (Tabelle existiert dann noch nicht).
        supabase.from("comment_reports")
          .select("id",{count:"exact",head:true}).eq("status","open")
          .then(r => r, () => ({ count:0 })).catch(() => ({ count:0 })),
      ]);
      setWirker(wirkerRes.data     || []);
      setPayments(paymentsRes.data || []);
      setProjects(projectsRes.data || []);
      setPending((wPend.count||0)+(ePend.count||0)+(pPend.count||0));
      setCommentReports(cReportsPend?.count || 0);
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = payments.filter(p=>p.payment_status==="paid")
    .reduce((s,p)=>s+(p.amount_eur||0),0);
  const totalImpact  = payments.filter(p=>p.payment_status==="paid")
    .reduce((s,p)=>s+(p.impact_eur||0),0);

  const s    = {minHeight:"100vh",background:C.bg,color:C.text,
                 fontFamily:"Inter,sans-serif",padding:24};
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
        <div style={{marginBottom:12,display:"flex",justifyContent:"center",color:"rgba(14,196,184,0.5)"}}><HUIImpactIcon size={40}/></div>
        <div style={{color:C.teal}}>{t("adm.loadingAdmin")}</div>
      </div>
    </div>
  );

  return (
    <div style={s}>
      <div style={{marginBottom:24}}>
        <h1 style={{margin:0,fontSize:22,fontWeight: 600}}>
          HUI Admin <span style={{color:C.teal}}>{t("adm.dashboard")}</span>
        </h1>
        <div style={{color:C.sub,fontSize:13,marginTop:4}}>{t("adm.realtimeData")}</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {[
          {key:"dashboard",label: t("adm.tabDashboard")},
          {key:"content",  label: t("adm.tabContent"), badge:pending},
          {key:"kommentare", label: t("adm.tabKommentare"), badge:commentReports},
          {key:"feed",     label: t("adm.tabFeed")},
          {key:"erl_proj", label: t("adm.tabErlProj")},
          {key:"wirker",   label: t("adm.tabWirker")},
          {key:"payments", label: t("adm.tabPayments")},
          {key:"projekte", label: t("adm.tabProjekte")},
        ].map(({key,label,badge=0}) => (
          <button key={key} onClick={()=>setTab(key)} style={tabBtn(tab===key,badge)}>
            {label}
            {badge>0 && (
              <span style={{position:"absolute",top:-6,right:-6,
                minWidth:18,height:18,borderRadius:99,
                background:C.coral,color:"#fff",
                fontSize:10,fontWeight: 600,
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
              {label: t("adm.kpiWirker"),      value:wirker.length,                 icon:"✨",color:C.teal,  onClick:null},
              {label: t("adm.kpiBuchungen"),   value:payments.length,               icon:"📋",color:C.orange,onClick:null},
              {label: t("adm.kpiUmsatz"),      value:`${totalRevenue.toFixed(0)} €`,icon:"💰",color:C.green, onClick:null},
              {label: t("adm.kpiImpactPool"), value:`${totalImpact.toFixed(2)} €`, icon:"🌱",color:C.coral, onClick:null},
              {label: "Startphase Bewerbungen", value:startphaseNew, icon:"🌟",color:C.purple,onClick:()=>setTab("startphase")},
            {label: t("adm.kpiPending"), value:pending,                       icon:"📝",color:C.yellow,onClick:()=>setTab("content")},
            ].map(kpi => (
              <div key={kpi.label} onClick={kpi.onClick||undefined}
                style={{...card,marginBottom:0,cursor:kpi.onClick?"pointer":"default"}}>
                <div style={{fontSize:24,marginBottom:6}}>{kpi.icon}</div>
                <div style={{fontSize:22,fontWeight: 600,color:kpi.color}}>{kpi.value}</div>
                <div style={{fontSize:12,color:C.sub}}>{kpi.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{fontWeight: 600,marginBottom:12}}>{t("adm.impactProjects", { count: projects.length })}</div>
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

      {tab==="content"  && <FreigabenTab onPendingChange={setPending}/>

      }
      {tab==="kommentare" && <KommentarMeldungenTab onCountChange={setCommentReports} />}
      {tab==="feed" && <FeedAnalyticsTab />}
      {tab==="erl_proj" && <ErlebnisseProjekteTab />}

      {tab==="wirker" && (
        <div style={card}>
          <div style={{fontWeight: 600,marginBottom:12}}>{t("adm.wirkerList", { count: wirker.length })}</div>
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
              <div style={{marginLeft:"auto",color:C.gold,fontSize:13,fontWeight: 600}}>
                {w.hourly_rate} €/h
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="payments" && (
        <div style={card}>
          <div style={{fontWeight: 600,marginBottom:12}}>{t("adm.paymentsList", { count: payments.length })}</div>
          {(payments||[]).filter(p=>p&&typeof p==="object").map(p=>(
            <div key={p.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:600}}>{p.wirker_name||p.item_name}</span>
                <span style={{color:p.payment_status==="paid"?C.green:C.orange,
                  fontSize:12,fontWeight: 600}}>{p.payment_status}</span>
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
          <div style={{fontWeight: 600,marginBottom:12}}>{t("adm.impactProjects", { count: projects.length })}</div>
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

      {/* HUI STARTPHASE */}
      {tab==="startphase" && <StartphaseTab onNewCountChange={setStartphaseNew} />}

    </div>
  );
}
