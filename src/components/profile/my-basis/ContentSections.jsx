// src/components/profile/my-basis/ContentSections.jsx
// TalentAngeboteSection, MeineWerkeSection, ErlebnisseSection
// Extracted from MyBasisProfile.jsx — no logic changes.
import React from "react";
import { deleteTalent } from "../../../hooks/useTalents.js";
import { formatDateDE } from "../../../lib/formatters.js";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx";
import { supabase } from "../../../lib/supabaseClient.js";
import { toast } from "../../../lib/useToast.jsx";
import { optimizeCard } from "../../../lib/perfUtils.js";
import { DraftActionSheet, ItemActionChoiceSheet, DeleteWerkConfirm, DeleteTalentConfirm, DeleteConfirmSheet } from "./ActionSheets.jsx";
import { T } from "./constants.js";
import { HUILogo } from "../../brand/HUILogo.jsx";
import { useTranslation } from "../../../hooks/useTranslation.js";

export function TalentAngeboteSection({ talents = [], onTalentWizard, onDeleteTalent = () => {} }) {
  const { t } = useTranslation();
  const [confirmTalent, setConfirmTalent] = React.useState(null);
  const [choiceTalent, setChoiceTalent] = React.useState(null); // ITEM-ACTION-CHOICE (2026-08-16)
  const { openRef } = useContentPreview();

  const handleDeleteClick = (e, t) => {
    e.stopPropagation();
    setConfirmTalent(t);
  };

  const handleConfirmDelete = async () => {
    const t = confirmTalent;
    setConfirmTalent(null);
    if (!t?.id) return;
    try {
      // UNWIDERRUFLICH LOESCHEN (2026-08-17): HARD DELETE nur wenn keine
      // Buchungen existieren. talent_bookings_talent_id_fkey ist ON DELETE
      // CASCADE (DB-Check 2026-08-17) — ein ungeprueftes Hard-Delete wuerde
      // bestehende (auch bezahlte) Buchungen samt Zahlungshistorie mitloeschen.
      // Schutz: vorher zaehlen, bei Treffern Soft-Delete (status='deleted')
      // statt Hard-Delete — Talent verschwindet trotzdem sofort aus
      // Feed/Entdecken (beide filtern strikt auf status='approved'), die
      // Buchungs-/Zahlungshistorie bleibt aber vollstaendig erhalten.
      const { count, error: countErr } = await supabase
        .from("talent_bookings")
        .select("id", { count: "exact", head: true })
        .eq("talent_id", t.id);
      if (!countErr && count > 0) {
        console.warn(`Talent Hard-Delete blockiert — ${count} bestehende Buchung(en) gefunden. Fallback Soft-Delete.`);
        await supabase.from("talents").update({ status: "deleted" }).eq("id", t.id);
        toast.success(t("cs.toast.talentDeletedProtected"), { duration: 3000 });
      } else {
        await deleteTalent(t.id);
        toast.success(t("cs.toast.talentDeleted"), { duration: 3000 });
      }
      onDeleteTalent(t.id);
    } catch(e) { console.error(t("cs.deleteTalent"), e); }
  };

  return (
    <>
    {confirmTalent && (
      <DeleteTalentConfirm
        talent={confirmTalent}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTalent(null)}
      />
    )}
    {choiceTalent && (
      <ItemActionChoiceSheet
        label={t("cs.label.talent")}
        onEdit={() => { const t = choiceTalent; setChoiceTalent(null); onTalentWizard?.(t); }}
        onView={() => { const t = choiceTalent; setChoiceTalent(null); openRef({ type:"talent", id:t.id }); }}
        onDelete={() => { const t = choiceTalent; setChoiceTalent(null); setConfirmTalent(t); }}
        onCancel={() => setChoiceTalent(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      {talents.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          gap:10, marginBottom:12 }}>
          {talents.map((tal, i) => {
            const isApproved = tal.status === "approved";
            const isPending  = tal.status === "pending";
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? t("cs.badge.live") : isPending ? t("cs.badge.pruefung") : t("cs.badge.abgelehnt");
            // VIDEO-THUMBNAIL-001 (2026-08-31): thumbnail_url hat Prioritaet
            const cover = tal.thumbnail_url || (Array.isArray(tal.images) && tal.images[0]?.url);
            return (
              <div key={tal.id || i}
                onClick={() => setChoiceTalent(tal)}
                style={{
                  width:"100%", aspectRatio:"1/1",
                  borderRadius:12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : "0 0 0 2px #ff5050",
                }}>
                {cover
                  ? <img loading="lazy" decoding="async" src={optimizeCard(cover)} alt={tal.title||""}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:24 }}>💼</div>
                }
                <button
                  onClick={(e) => handleDeleteClick(e, tal)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight: 600,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight: 600, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  {badgeText}
                </div>
                {tal.title && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0,
                    background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                    padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {tal.title}
                  </div>
                )}
                {/* Preis-Hinweis (Master-Prompt 2026-07-05) — nur eine kompakte Zeile,
                    Sichtbarkeit fuer Dritte ohnehin ueber RLS (approved-only) geregelt */}
                {(tal.price_per_hour || tal.price_per_session) && (
                  <div style={{
                    position:"absolute", bottom:18, left:0, right:0,
                    background:"rgba(0,0,0,0.35)", fontSize:8.5, color:"#fff",
                    padding:"2px 5px", textAlign:"center", fontWeight:600,
                  }}>
                    {tal.price_per_hour ? `${tal.price_per_hour}€/${t("common.perHour")}` : `${tal.price_per_session}€/${t("common.perSession")}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button className="mbp-press-light" onClick={() => onTalentWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:T.r12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:12.5, fontWeight: 600, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight: 600,
          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
        }}>+</span>
        {t("cs.addTalent")}
      </button>
    </div>
    </>
  );
}

export function MeineWerkeSection({ works, onWerkWizard, onDeleteWerk = () => {} }) {
  const { t } = useTranslation();
  const [confirmWork, setConfirmWork] = React.useState(null);
  const [choiceWork, setChoiceWork] = React.useState(null); // ITEM-ACTION-CHOICE (2026-08-16)
  const [draftWork, setDraftWork] = React.useState(null); // DRAFT-ACTION (2026-08-20)
  const { openRef } = useContentPreview();

  const handleDeleteClick = (e, w) => {
    e.stopPropagation();
    setConfirmWork(w);
  };

  const handleConfirmDelete = async () => {
    const w = confirmWork;
    setConfirmWork(null);
    if (!w?.id) return;
    try {
      // UNWIDERRUFLICH LOESCHEN (2026-08-17): primaer HARD DELETE — die Zeile
      // verschwindet komplett aus der DB, damit garantiert nichts mehr in
      // Feed/Entdecken/Profil auftaucht. FK-Schutz (order_items_work_id_fkey,
      // bookings_work_id_fkey, work_sales_work_id_fkey — alle NO ACTION/RESTRICT,
      // DB-Check 2026-08-17) verhindert das Hard-Delete automatisch wenn das
      // Werk bereits bestellt/gebucht/verkauft wurde (schuetzt Bestell- und
      // Zahlungshistorie vor Datenverlust). In diesem Fall Fallback auf
      // Soft-Delete (status='deleted') — verschwindet trotzdem sofort aus
      // Feed/Entdecken, die beide strikt auf status='published' filtern.
      const { error } = await supabase.from("works").delete().eq("id", w.id);
      if (error) {
        console.warn("Werk Hard-Delete blockiert (vermutlich bestehende Bestellung/Buchung) — Fallback Soft-Delete:", error);
        await supabase.from("works").update({ status: "deleted", visibility: "private" }).eq("id", w.id);
        toast.success(t("cs.toast.werkDeletedProtected"), { duration: 3000 });
      } else {
        toast.success(t("cs.toast.werkDeleted"), { duration: 3000 });
      }
      onDeleteWerk(w.id);
    } catch(e) { console.error(t("cs.deleteWork"), e); }
  };

  // DRAFT-PUBLISH (2026-08-20): Entwurf zur Prüfung einreichen — setzt
  // status auf pending_review und schickt es an den SADB.
  const publishDraft = async (w) => {
    if (!w?.id) return;
    try {
      const { error } = await supabase.from("works").update({
        status: "pending_review",
        approval_status: "pending",
        last_submitted_at: new Date().toISOString(),
        is_update: false,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("id", w.id);
      if (error) throw error;
      toast.success(t("cs.toast.werkSubmitted"), { duration: 3000 });
      onDeleteWerk(); // triggert reload im Parent
    } catch(e) {
      console.error("Draft publish:", e);
      toast.error(t("cs.toast.submitFailed"), { duration: 3000 });
    }
  };

  return (
    <>
    {confirmWork && (
      <DeleteWerkConfirm
        werk={confirmWork}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmWork(null)}
      />
    )}
    {draftWork && (
      <DraftActionSheet
        label="Werk"
        onPublish={() => { const w = draftWork; setDraftWork(null); publishDraft(w); }}
        onEdit={() => { const w = draftWork; setDraftWork(null); onWerkWizard?.(w); }}
        onDelete={() => { const w = draftWork; setDraftWork(null); setConfirmWork(w); }}
        onCancel={() => setDraftWork(null)}
      />
    )}
    {choiceWork && (
      <ItemActionChoiceSheet
        label="Werk"
        onEdit={() => { const w = choiceWork; setChoiceWork(null); onWerkWizard?.(w); }}
        onView={() => { const w = choiceWork; setChoiceWork(null); openRef({ type:"work", id:w.id }); }}
        onDelete={() => { const w = choiceWork; setChoiceWork(null); setConfirmWork(w); }}
        onCancel={() => setChoiceWork(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      {works.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          gap:10, marginBottom:12 }}>
          {works.map((w, i) => {
            const isApproved = w.approval_status === "approved";
            const isDraft    = w.status === "draft";
            // ENTWURF-BADGE-FIX (2026-08-20, Michael-Report "wird NICHT als
            // Entwurf gekennzeichnet"): works.approval_status ist NOT NULL +
            // CHECK IN ('pending','approved','rejected') -- kann bei einem
            // Entwurf (status='draft') NIE leer/eigenständig sein, sondern
            // steht durch den DB-Spalten-Default technisch immer auf
            // 'pending', auch wenn der Entwurf nie eingereicht wurde. isDraft
            // (status, die einzig verlässliche Quelle) muss deshalb VOR
            // isPending geprüft werden -- sonst gewinnt fälschlich "⏳ Prüfung".
            const isPending  = !isDraft && (w.approval_status === "pending" || w.status === "pending_review");
            const isRejected = !isDraft && (w.approval_status === "rejected" || w.status === "rejected");
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)"
              : isPending  ? "rgba(234,179,8,0.92)"
              : isDraft    ? "rgba(120,120,128,0.85)"
              : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? t("cs.badge.live")
              : isPending  ? t("cs.badge.pruefung")
              : isDraft    ? t("cs.badge.entwurf")
              : t("impact.abgelehnt");
            return (
              <div key={w.id || i}
                onClick={() => isDraft ? setDraftWork(w) : setChoiceWork(w)}
                style={{
                  width:"100%", aspectRatio:"1/1",
                  borderRadius:T.r12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : isDraft ? "0 0 0 2px rgba(120,120,128,0.5)" : "0 0 0 2px #ff5050",
                }}>
                {(w.thumbnail_url || w.cover_url)
                  ? <img loading="lazy" decoding="async" src={optimizeCard(w.thumbnail_url || w.cover_url)} alt={w.title||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none"; const sib=e.target.nextSibling; if(sib) sib.style.display="flex";}}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><HUILogo size={36} style={{opacity:0.5}} /></div>
                }
                {/* X-Löschen-Button oben rechts */}
                <button
                  onClick={(e) => handleDeleteClick(e, w)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight: 600,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                {/* Status-Badge */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight: 600, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  {badgeText}
                </div>
                {/* Titel */}
                {w.title && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0,
                    background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                    padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {w.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button className="mbp-press-light" onClick={() => onWerkWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:T.r12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:12.5, fontWeight: 600, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight: 600,
          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
        }}>+</span>
        {t("cs.addWerk")}
      </button>
    </div>
    </>
  );
}

export function ErlebnisseSection({ experiences, onErlebnisWizard, onDeleteErlebnis = () => {} }) {
  const { t } = useTranslation();
  const [confirmExp, setConfirmExp] = React.useState(null);
  const [choiceExp, setChoiceExp] = React.useState(null); // ITEM-ACTION-CHOICE (2026-08-16)
  const [draftExp, setDraftExp] = React.useState(null); // DRAFT-ACTION-FIX (2026-08-20, Michael-Report)
  const { openRef } = useContentPreview();

  // DRAFT-PUBLISH (2026-08-20, analog zu MeineWerkeSection.publishDraft):
  // Entwurf zur Prüfung einreichen — setzt status auf pending_review und
  // schickt es an den SADB. Zuvor gab es dafür keinen Pfad im Erlebnis-
  // Bereich, ein Entwurf blieb für immer status='draft' + approval_status
  // 'pending' (DB-Default) hängen und wurde faelschlich als "⏳ Prüfung"
  // angezeigt statt als "📝 Entwurf" — siehe Badge-Logik unten.
  const publishDraftExp = async (exp) => {
    if (!exp?.id) return;
    try {
      const { error } = await supabase.from("experiences").update({
        status: "pending_review",
        approval_status: "pending",
        last_submitted_at: new Date().toISOString(),
        is_update: false,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("id", exp.id);
      if (error) throw error;
      toast.success(t("cs.toast.expSubmitted"), { duration: 3000 });
      onDeleteErlebnis(); // triggert reload im Parent (identisch zu Werke-Muster)
    } catch(e) {
      console.error("Draft publish (Erlebnis):", e);
      toast.error(t("cs.toast.submitFailed"), { duration: 3000 });
    }
  };

  const handleDeleteClick = (e, exp) => {
    e.stopPropagation();
    setConfirmExp(exp);
  };

  const handleConfirmDelete = async () => {
    const exp = confirmExp;
    setConfirmExp(null);
    if (!exp?.id) return;
    try {
      const table = exp._source === "projects" ? "projects" : "experiences";
      // Hard-Delete: Zeile vollständig aus DB entfernen
      // → Realtime triggert Admin-Dashboard, Zeile verschwindet dort sofort
      const { error } = await supabase.from(table).delete().eq("id", exp.id);
      if (!error) {
        toast.success(t("cs.toast.expDeleted"), { duration: 3000 });
        onDeleteErlebnis(exp.id);
      } else {
        console.error(t("cs.deleteExperience"), error);
        // Fallback: soft-delete wenn Hard-Delete nicht erlaubt (RLS)
        await supabase.from(table).update({ status: "deleted" }).eq("id", exp.id);
        toast.success(t("cs.toast.expDeletedSoft"), { duration: 3000 });
        onDeleteErlebnis(exp.id);
      }
    } catch(e) { console.error("Erlebnis löschen:", e); }
  };

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return formatDateDE(dt, { month:"short", year:"numeric" });
  }
  return (
    <>
    {confirmExp && (
      <DeleteConfirmSheet
        title={t("cs.delete.expTitle")}
        body={<strong>{t("cs.delete.expBody", { title: confirmExp.title || t("cs.delete.expFallback") })}</strong>}
        confirmLabel={t("cs.delete.confirm")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmExp(null)}
      />
    )}
    {draftExp && (
      <DraftActionSheet
        label={t("cs.label.erlebnis")}
        onPublish={() => { const exp = draftExp; setDraftExp(null); publishDraftExp(exp); }}
        onEdit={() => { const exp = draftExp; setDraftExp(null); onErlebnisWizard?.(exp); }}
        onDelete={() => { const exp = draftExp; setDraftExp(null); setConfirmExp(exp); }}
        onCancel={() => setDraftExp(null)}
      />
    )}
    {choiceExp && (
      <ItemActionChoiceSheet
        label={t("cs.label.erlebnis")}
        onEdit={() => { const exp = choiceExp; setChoiceExp(null); onErlebnisWizard?.(exp); }}
        onView={() => {
          const exp = choiceExp; setChoiceExp(null);
          // Projekte (Impact) und Erlebnisse liegen in unterschiedlichen Tabellen/Loadern
          openRef({ type: exp._source === "projects" ? "project" : "experience", id: exp.id });
        }}
        onDelete={() => { const exp = choiceExp; setChoiceExp(null); setConfirmExp(exp); }}
        onCancel={() => setChoiceExp(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ fontSize:12, color:"#8C8C85", marginBottom:12 }}>{t("cs.momentsHint")}</div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        gap:10, marginBottom:12 }}>
        {experiences.map((exp, i) => {
          // ── Badge-System identisch zu Meine Werke ──────────────
          const isApproved = exp.approval_status === "approved" || exp.status === "published";
          const isDraft     = !isApproved && exp.status === "draft";
          // ENTWURF-BADGE-FIX (2026-08-20, Michael-Report "als Entwurf
          // speichern hat nicht geklappt"): identisch zum WERK-Fix von
          // heute — experiences.approval_status ist NOT NULL mit Default
          // 'pending' und wird bei einem Entwurf (status='draft', save()
          // schickt approval_status:undefined) NIE explizit gesetzt, bleibt
          // also technisch immer auf 'pending' stehen, obwohl der Entwurf
          // nie eingereicht wurde. isDraft (status, die einzig verlässliche
          // Quelle) muss deshalb VOR isPending geprüft werden — sonst
          // gewinnt fälschlich "⏳ Prüfung" statt "📝 Entwurf".
          const isPending  = !isApproved && !isDraft && (exp.approval_status === "pending" || exp.status === "pending_review" || exp.status === "pending");
          const isRejected = !isApproved && !isDraft && !isPending && (exp.approval_status === "rejected" || exp.status === "rejected");
          const badgeBg    = isApproved
            ? "rgba(14,196,184,0.92)"
            : isPending
              ? "rgba(234,179,8,0.92)"
              : isDraft
                ? "rgba(120,120,128,0.85)"
                : isRejected
                  ? "rgba(255,80,80,0.92)"
                  : "rgba(14,196,184,0.92)";
          const badgeText  = isApproved
            ? t("cs.badge.live")
            : isPending
              ? t("cs.badge.pruefung")
              : isDraft
                ? t("cs.badge.entwurf")
                : isRejected
                  ? t("impact.abgelehnt")
                  : t("cs.badge.live");
          const borderCol  = isApproved ? "#0EC4B8" : isPending ? "#D4A800" : isDraft ? "rgba(120,120,128,0.5)" : isRejected ? "#ff5050" : "#0EC4B8";
          return (
            <div key={exp.id || i}
              onClick={() => isDraft ? setDraftExp(exp) : setChoiceExp(exp)}
              style={{
                width:"100%", aspectRatio:"1/1",
                borderRadius:T.r12, overflow:"hidden",
                background:"#e8e4de", position:"relative", cursor:"pointer",
                boxShadow: `0 0 0 2px ${borderCol}`,
              }}>
              {(exp.thumbnail_url || exp.cover_url)
                ? <img loading="lazy" decoding="async" src={optimizeCard(exp.thumbnail_url || exp.cover_url)} alt={exp.title||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none"; const sib=e.target.nextSibling; if(sib) sib.style.display="flex";}}/>
                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><HUILogo size={36} style={{opacity:0.5}} /></div>
              }
              {/* X-Löschen-Button oben rechts */}
              <button
                onClick={(e) => handleDeleteClick(e, exp)}
                style={{
                  position:"absolute", top:4, right:4,
                  width:20, height:20, borderRadius:"50%",
                  background:"rgba(0,0,0,0.65)", border:"none",
                  color:"#fff", fontSize:11, fontWeight: 600,
                  cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  lineHeight:1, padding:0, zIndex:2,
                }}
              >✕</button>
              {/* Status-Badge unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background: badgeBg,
                fontSize:9, fontWeight: 600, color:"#fff",
                padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
              }}>
                {badgeText}
              </div>
              {/* Titel oben */}
              {exp.title && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0,
                  background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                  padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {exp.title}
                </div>
              )}
              {/* Ablehnungsgrund Overlay + "Anpassen"-CTA */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0, bottom:0,
                  background:"rgba(255,80,80,0.08)",
                  pointerEvents:"none",
                }}/>
              )}
              {/* Anpassen-Hinweis bei abgelehnten Erlebnissen */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:"50%", left:0, right:0,
                  transform:"translateY(-50%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  pointerEvents:"none",
                }}>
                  <span style={{
                    background:"rgba(0,0,0,0.72)", color:"#fff",
                    fontSize:8, fontWeight: 600, padding:"2px 7px",
                    borderRadius:20, letterSpacing:"0.3px",
                  }}>{t("cs.badge.anpassen")}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    {/* ── Add-Button — EXAKT identisch zu "+ {t("cs.addWerk")}" ── */}
    <div style={{ padding:`0 ${T.px}px` }}>
      <button className="mbp-press-light" onClick={() => onErlebnisWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:T.r12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:12.5, fontWeight: 600, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight: 600,
          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
        }}>+</span>
        {t("cs.addErlebnis")}
      </button>
    </div>
    </>
  );
}


// ══════════════════════════════════════════════════════════════
// IMPACT PROJEKTE TAB — Zeigt die Impact-Projekte des Users
// Fragt impact_applications per user_id ab.
// Für bewilligte Projekte: "+ Update hinzufügen" Button.
// ══════════════════════════════════════════════════════════════
