// src/components/profile/my-basis/ImpactProjectEditSheet.jsx
// IMPACT-PROJECT-EDIT-001 (2026-09-14, Michael-Feature-Request):
// "Wenn jemand ein Projekt postet und es angenommen wird sollte man es auch
//  bearbeiten können. Z.B. Preis oder Texte oder Bilder.. diese Funktion
//  unter 'mein Bereich' fehlt noch.. wenn das gemacht wird, wird
//  automatisch ein neuer Antrag ins SADB gesendet und wenn angenommen
//  einfach frisch gepostet mit alle bereits vergebenen Stimmen
//  (Stimmen müssen zwingend erhalten bleiben)."
//
// ── Funktionsweise ──────────────────────────────────────────────
// 1. Nur für genehmigte (status='approved'), nicht abgeschlossene
//    (is_completed=false) Projekte — gleiche Schutzschwelle wie beim
//    Löschblock für approved-Projekte im ImpactProjekteTab.
// 2. Beim Speichern: UPDATE der Inhalt-Felder auf derselben Row
//    (project_name, short_desc, problem, vision + funding_use [SSOT-
//    Spiegel der Vision, exakt wie im ImpactFlow-Einreichungs-Wizard,
//    der beide Felder aus form.umsetzung setzt], funding_goal,
//    cover_url, media_urls) + status='pending' + submitted_at=now.
//    Der Antrag erscheint dadurch automatisch neu im SADB
//    (ImpactApplicationsView Filter 'pending'/'all', Dashboard-Count
//    applicationsPending, Realtime-Badge via usePendingCounts).
// 3. STIMMEN-BELASSUNG: impact_votes referenzieren project_id und
//    werden von diesem Update NIEMALS berührt (gleiche Governance wie
//    beim Soft-Delete: status='deleted' schützt Voting-Historie).
//    SADB-Freigabe (pending→approved ist in ALLOWED_STATUS_TRANSITIONS
//    erlaubt) macht das Projekt wieder live — mit allen bisherigen
//    Stimmen. rank/current_amount_eur werden nicht angefasst.
// 4. Während der Prüfung (status='pending') ist das Projekt öffentlich
//    unsichtbar (ImpactPage-Queries filtern status='approved') und der
//    Bearbeiten-Button verschwindet (kein Doppel-Edit).
// 5. IMPACT-EDIT-SNAPSHOT-001 (2026-09-16): Vor dem Update wird der
//    serverseitige Vor-Zustand (== letzter genehmigter Stand) als
//    edit_snapshot JSONB mitgeschrieben (nur falls noch keiner existiert —
//    die SADB-Freigabe leert das Feld, damit der naechste Edit-Zyklus
//    wieder frisch snapshottet). Optionaler edit_reason fuer den Admin.
//    Ermöglicht die Diff-Ansicht im SADB ohne neue Tabelle
//    (Architektur-Charta: Erweitern statt duplizieren).
// ────────────────────────────────────────────────────────────────
import React from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabaseClient.js";
import { useTranslation } from "../../../hooks/useTranslation.js";
import { useModalRegistration } from "../../../hooks/useModalRegistration.js";
import { toast } from "../../../lib/useToast.jsx";
import { uploadMediaFile, processFileSelection, isVideoUrl } from "../../../lib/uploadUtils.js";
import { HUILogo } from "../../brand/HUILogo.jsx";

const LABEL_STYLE = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#1A1A18", marginBottom: 6, marginTop: 14,
};
const INPUT_STYLE = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff",
  fontSize: 14, color: "#1A1A18", fontFamily: "inherit",
  outline: "none",
};
const TEXTAREA_STYLE = {
  ...INPUT_STYLE, resize: "vertical", minHeight: 70, lineHeight: 1.5,
};

export default function ImpactProjectEditSheet({ projectId, onClose, onSaved }) {
  const { t } = useTranslation();
  const [row, setRow] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);

  // Form-State
  const [name, setName] = React.useState("");
  const [shortDesc, setShortDesc] = React.useState("");
  const [problem, setProblem] = React.useState("");
  const [vision, setVision] = React.useState("");
  const [funding, setFunding] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState(null);
  const [coverErr, setCoverErr] = React.useState(null);
  const [coverUploading, setCoverUploading] = React.useState(false);
  const [mediaUrls, setMediaUrls] = React.useState([]);
  const [imagesUploading, setImagesUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState(null);
  const [editReason, setEditReason] = React.useState("");

  const coverRef = React.useRef();
  const imagesRef = React.useRef();

  useModalRegistration(true, onClose, "ImpactProjectEditSheet");

  // ── Volle Row laden (der Tab uebergibt nur ein reduziertes Objekt) ──
  React.useEffect(() => {
    let dead = false;
    (async () => {
      const { data, error } = await supabase
        .from("impact_applications")
        .select("id,user_id,project_name,short_desc,problem,vision,funding_goal,cover_url,media_urls,status,is_completed,edit_snapshot")
        .eq("id", projectId)
        .maybeSingle();
      if (dead) return;
      if (error || !data) {
        setLoadError(true);
        return;
      }
      // Defense-in-Depth: Edit nur fuer genehmigte, nicht abgeschlossene
      // Projekte (Button-Guard im Tab ist die erste Schwelle).
      if (data.status !== "approved" || data.is_completed) {
        setLoadError(true);
        return;
      }
      setRow(data);
      setName(data.project_name || "");
      setShortDesc(data.short_desc || "");
      setProblem(data.problem || "");
      setVision(data.vision || "");
      setFunding(data.funding_goal != null ? String(data.funding_goal) : "");
      setCoverUrl(data.cover_url || null);
      setMediaUrls(Array.isArray(data.media_urls) ? [...data.media_urls] : []);
    })();
    return () => { dead = true; };
  }, [projectId]);

  // ── Titelbild-Upload (SSOT uploadMediaFile, Ordner wie ImpactFlow) ──
  const handleCoverFile = async (file) => {
    if (!file || !row?.user_id) return;
    if (file.type && file.type.startsWith("video/")) {
      setCoverErr(t("ipt.editCoverImageOnly"));
      return;
    }
    setCoverUploading(true); setCoverErr(null);
    try {
      const res = await uploadMediaFile(file, row.user_id, "covers");
      setCoverUrl(res.url);
    } catch {
      setCoverErr(t("ipt.editUploadError"));
    }
    setCoverUploading(false);
  };

  // ── Galerie-Bilder-Upload (SSOT processFileSelection + uploadMediaFile) ──
  const handleImagesFiles = async (files) => {
    if (!files || !row?.user_id) return;
    const { accepted } = processFileSelection(files, mediaUrls.length);
    if (!accepted.length) return;
    setImagesUploading(true);
    const urls = [...mediaUrls];
    for (const file of accepted) {
      try {
        const res = await uploadMediaFile(file, row.user_id, "extras");
        urls.push(res.url);
      } catch { /* einzelne Datei skippen (Muster ImpactFlow.uploadExtras) */ }
    }
    setMediaUrls(urls);
    setImagesUploading(false);
  };

  const removeImage = (idx) => setMediaUrls(prev => prev.filter((_, i) => i !== idx));

  // ── Speichern: Inhalt-Update + status 'pending' (neuer SADB-Antrag) ──
  const handleSave = async () => {
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) { setFormError(t("ipt.editNameRequired")); return; }

    // Foerdersumme: leer = null; sonst min 100 / max 50.000
    // (ImpactFlow-Grenzen, Fehler-Keys wiederverwendet)
    let fundingGoal = null;
    if (funding.trim()) {
      const parsed = parseInt(funding.replace(/[^\d]/g, ""), 10);
      if (!Number.isFinite(parsed) || parsed < 100) {
        setFormError(t("impact.fundingMinError")); return;
      }
      if (parsed > 50000) {
        setFormError(t("impact.fundingMaxError")); return;
      }
      fundingGoal = parsed;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      // IMPACT-EDIT-SNAPSHOT-001: Server-Vorzustand (letzter genehmigter
      // Stand) als Diff-Basis fuer den Admin. Nur schreiben, wenn noch kein
      // Snapshot existiert (SADB-Freigabe leert edit_snapshot + edit_reason,
      // -> jeder neue Edit-Zyklus snapshottet wieder den frisch genehmigten
      // Stand).
      const snapshotUpdate = row.edit_snapshot ? {} : {
        edit_snapshot: {
          project_name: row.project_name || null,
          short_desc:    row.short_desc    || null,
          problem:       row.problem       || null,
          vision:        row.vision       || null,
          funding_goal:  row.funding_goal  ?? null,
          cover_url:     row.cover_url    || null,
          media_urls:    row.media_urls   || null,
        },
      };
      const { error: updateErr } = await supabase
        .from("impact_applications")
        .update({
          project_name: trimmedName,
          short_desc:    shortDesc.trim() || null,
          problem:       problem.trim() || null,
          vision:        vision.trim() || null,
          funding_use:   vision.trim() || null,
          funding_goal:  fundingGoal,
          cover_url:     coverUrl || null,
          media_urls:    mediaUrls.length ? mediaUrls : null,
          status:        "pending",
          submitted_at:  now,
          ...snapshotUpdate,
          edit_reason:   editReason.trim() || null,
        })
        .eq("id", projectId);
      if (updateErr) throw updateErr;

      // Resonanzzentrum-Bestätigung (gleicher Typ wie bei der Einreichung —
      // impact_project_submitted wird dort bereits gerendert; Titel/Body
      // edit-spezifisch, metadata.edited=true fuer spaetere Auswertung)
      try {
        await supabase.from("notifications").insert({
          user_id:     row.user_id,
          type:        "impact_project_submitted",
          title:       t("ipt.editNotifTitle"),
          body:        t("ipt.editNotifBody", { name: trimmedName }),
          entity_type: "impact_project",
          action_url:  "/impact",
          is_read:     false,
          read:        false,
          created_at:  now,
          metadata:    { project_name: trimmedName, edited: true },
        });
      } catch (notifErr) {
        console.warn("[ImpactProjectEditSheet] notification failed:", notifErr);
        // Kein throw — Update war erfolgreich
      }

      toast.success(t("ipt.editSaved"), { duration: 4000 });
      onSaved?.({
        ...row,
        project_name: trimmedName,
        short_desc: shortDesc.trim() || null,
        funding_goal: fundingGoal,
        cover_url: coverUrl || null,
        status: "pending",
      });
      onClose?.();
    } catch (e) {
      console.error("[ImpactProjectEditSheet] save:", e);
      setFormError(t("ipt.editSaveError"));
    }
    setSaving(false);
  };

  // ── Render ───────────────────────────────────────────────────
  const content = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500, /* >BottomNav(10000) — Portal-Pflicht */
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "24px",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: "20px",
        maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)", fontFamily: "inherit",
      }}>
        {/* Titel + Hinweis */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A18" }}>
            {t("ipt.editProject")}
          </div>
          <button onClick={onClose} aria-label={t("common.cancel")} style={{
            background: "none", border: "none", fontSize: 16, color: "#999",
            cursor: "pointer", padding: 4, lineHeight: 1,
          }}>✕</button>
        </div>
        <div style={{
          fontSize: 12, color: "#55556B", lineHeight: 1.5, marginBottom: 4,
          background: "rgba(14,196,184,0.06)", border: "1px solid rgba(14,196,184,0.18)",
          borderRadius: 10, padding: "8px 10px",
        }}>
          {t("ipt.editHint")}
        </div>

        {loadError && (
          <div style={{ fontSize: 13, color: "#e74c3c", padding: "24px 0", textAlign: "center" }}>
            {t("ipt.editLoadError")}
          </div>
        )}

        {!row && !loadError && (
          <div style={{ fontSize: 13, color: "#888", padding: "24px 0", textAlign: "center" }}>
            {t("impact.laden")}…
          </div>
        )}

        {row && (
          <>
            {/* Titelbild */}
            <label style={LABEL_STYLE}>{t("ipt.editCoverLabel")}</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                width: 84, height: 84, borderRadius: 12, overflow: "hidden",
                background: "#f2f2ef", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {coverUrl
                  ? <img src={coverUrl} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  : <HUILogo size={30} style={{ opacity: 0.5 }} />}
              </div>
              <button
                onClick={() => coverRef.current?.click()}
                disabled={coverUploading}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  border: "1.5px dashed #0DC4B5", background: "transparent",
                  color: "#0DC4B5", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  opacity: coverUploading ? 0.6 : 1,
                }}
              >
                {coverUploading ? t("impact.laden") + "…" : t("ipt.editCoverChange")}
              </button>
              <input ref={coverRef} type="file" accept="image/*" hidden
                onChange={(e) => { handleCoverFile(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            {coverErr && <div style={{ fontSize: 11.5, color: "#e74c3c", marginTop: 4 }}>{coverErr}</div>}

            {/* Projektname */}
            <label style={LABEL_STYLE}>{t("ipt.editNameLabel")}</label>
            <input type="text" value={name} maxLength={120}
              onChange={(e) => setName(e.target.value)} style={INPUT_STYLE} />

            {/* Kurzbeschreibung */}
            <label style={LABEL_STYLE}>{t("ipt.editShortLabel")}</label>
            <textarea value={shortDesc} maxLength={280} rows={2}
              onChange={(e) => setShortDesc(e.target.value)} style={TEXTAREA_STYLE} />

            {/* Problem */}
            <label style={LABEL_STYLE}>{t("impact.dasProblem")}</label>
            <textarea value={problem} maxLength={2000} rows={3}
              onChange={(e) => setProblem(e.target.value)} style={TEXTAREA_STYLE} />

            {/* Vision */}
            <label style={LABEL_STYLE}>{t("impact.visionLoesung")}</label>
            <textarea value={vision} maxLength={2000} rows={3}
              onChange={(e) => setVision(e.target.value)} style={TEXTAREA_STYLE} />

            {/* Fördersumme */}
            <label style={LABEL_STYLE}>{t("ipt.editFundingLabel")}</label>
            <input type="text" inputMode="numeric" value={funding}
              placeholder="2.000"
              onChange={(e) => setFunding(e.target.value)} style={INPUT_STYLE} />

            {/* Änderungsgrund (optional, für den Admin im SADB) */}
            <label style={LABEL_STYLE}>{t("ipt.editReasonLabel")}</label>
            <input type="text" value={editReason} maxLength={300}
              placeholder={t("ipt.editReasonPlaceholder")}
              onChange={(e) => setEditReason(e.target.value)} style={INPUT_STYLE} />

            {/* Bilder */}
            <label style={LABEL_STYLE}>{t("ipt.editImagesLabel")}</label>
            {mediaUrls.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 8 }}>
                {mediaUrls.map((url, idx) => (
                  <div key={idx} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 8, overflow: "hidden", background: "#f2f2ef" }}>
                    {isVideoUrl(url)
                      ? <video src={url} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <img src={url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                    <button onClick={() => removeImage(idx)} aria-label={t("ipt.editRemoveImage")} style={{
                      position: "absolute", top: 2, right: 2, width: 18, height: 18,
                      borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "none",
                      color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1, padding: 0,
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => imagesRef.current?.click()}
              disabled={imagesUploading}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 10,
                border: "1.5px dashed rgba(0,0,0,0.25)", background: "transparent",
                color: "#55556B", fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                opacity: imagesUploading ? 0.6 : 1,
              }}
            >
              {imagesUploading ? t("impact.laden") + "…" : `+ ${t("ipt.editAddImages")}`}
            </button>
            <input ref={imagesRef} type="file" accept="image/*,video/*" multiple hidden
              onChange={(e) => { handleImagesFiles(e.target.files); e.target.value = ""; }} />

            {formError && (
              <div style={{ fontSize: 12.5, color: "#e74c3c", marginTop: 12, lineHeight: 1.4 }}>{formError}</div>
            )}

            {/* Aktionen */}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={onClose} disabled={saving} style={{
                flex: 1, padding: "12px 0", borderRadius: 99,
                background: "#f0f0ee", border: "none", color: "#444",
                fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                {t("common.cancel")}
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: "12px 0", borderRadius: 99,
                background: saving ? "rgba(14,196,184,0.5)" : "#0EC4B8", border: "none",
                color: "#fff", fontSize: 13.5, fontWeight: 600,
                cursor: saving ? "wait" : "pointer", fontFamily: "inherit",
              }}>
                {saving ? t("ipt.editSubmitting") : t("ipt.editSubmit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
