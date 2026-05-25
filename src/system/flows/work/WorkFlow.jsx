// src/system/flows/work/WorkFlow.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Werk erschaffen Flow v2
// 3 separate Screens exakt wie Screenshot:
//   Step 1: Werk erstellen   (Titel, Beschreibung, Medien)
//   Step 2: Werk Informationen (Preis, Versand, Details)
//   Step 3: Veröffentlichung   (Sichtbarkeit, Live-Vorschau)
//
// Design: Hell, galerieartig, Creator-first.
// Kein Shop-Look. Kein Cyberpunk. Soft White + Mint + Peach.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { WorkMediaStep }   from "./WorkMediaStep.jsx";
import { WorkDetailsStep } from "./WorkDetailsStep.jsx";
import { WorkPublishStep } from "./WorkPublishStep.jsx";
import { supabase }        from "../../../lib/supabaseClient.js";
import { useAuth }         from "../../../lib/AuthContext.jsx";
import { reportInsertFailure } from "../../../lib/runtimeDebug.js";

/* ── Design Tokens ──────────────────────────────────────────── */
export const WT = {
  teal:    "#0ABFB8",  tealD:  "#0891B2",
  coral:   "#FB923C",  coralD: "#EA580C",
  violet:  "#8B5CF6",
  ink:     "#1A1A2E",
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.38)",
  ink4:    "rgba(26,26,46,0.20)",
  bg:      "#F8F7FF",
  card:    "#FFFFFF",
  border:  "rgba(26,26,46,0.08)",
  glass:   "rgba(255,255,255,0.90)",
};

/* ── Progress Bar (exakt wie Screenshot) ───────────────────── */
function ProgressBar({ step }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:2,
          background: i <= step
            ? `linear-gradient(90deg,${WT.teal},${WT.coral})`
            : "rgba(26,26,46,0.10)",
          transition:"background 0.38s ease",
        }}/>
      ))}
    </div>
  );
}

/* ── Header (nav + progress + icon) ────────────────────────── */
export function WorkHeader({ step, onBack, onClose }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"16px 20px 0",
    }}>
      {/* Zurück */}
      <button
        onClick={onBack}
        style={{
          width:32, height:32, borderRadius:"50%",
          background:"rgba(26,26,46,0.05)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, color:WT.ink2, flexShrink:0,
        }}
      >‹</button>

      {/* Progress */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ fontSize:11, color:WT.ink3, fontWeight:600,
          letterSpacing:0.3, textAlign:"center" }}>
          Schritt {step+1} von 3
        </div>
        <ProgressBar step={step} />
      </div>

      {/* Close / Icon */}
      <button
        onClick={onClose}
        style={{
          width:32, height:32, borderRadius:"50%",
          background:"rgba(26,26,46,0.05)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:15, color:WT.teal, flexShrink:0,
        }}
      >✦</button>
    </div>
  );
}

/* ── Haupt-Flow ─────────────────────────────────────────────── */
export default function WorkFlow({ onClose }) {
  const { user, profile } = useAuth();
  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);

  // ── Formular-State ───────────────────────────────────────────
  const [form, setForm] = useState({
    title:        "",
    description:  "",
    // Preis
    priceMode:    "free",        // "free" | "fixed" | "inquiry"
    price:        "",
    // Versand
    shipping:     false,
    shippingCost: "",
    shippingTime: "3–5 Werktage",
    shippingCountries: "Deutschland, Österreich, Schweiz",
    // Details
    category:     "",
    fileFormat:   "",
    size:         "",
    materials:    "",
    condition:    "Neu",
    // Veröffentlichung
    visibility:   "public",     // "public" | "community" | "private"
  });
  const [mediaFiles, setMediaFiles] = useState([]); // [{file, preview, type}]

  const updateForm = useCallback((patch) => {
    setForm(f => ({ ...f, ...patch }));
  }, []);

  // ── Navigation ───────────────────────────────────────────────
  const goNext = useCallback(() => setStep(s => Math.min(s+1, 2)), []);
  const goBack = useCallback(() => {
    if (step === 0) onClose?.();
    else setStep(s => s-1);
  }, [step, onClose]);

  // ── Publish ─────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!user) {
      const message = "Nicht eingeloggt. Werk kann nicht gespeichert werden.";
      setError(message);
      reportInsertFailure({ flow:"work-publish", step:"auth", entity:"works", message });
      return;
    }
    let failedStep = "publish";
    setSaving(true);
    setError(null);
    try {
      // 1. Medien hochladen
      const imageUrls = [];
      let coverUrl = null;
      for (let i = 0; i < mediaFiles.length; i++) {
        failedStep = "storage-upload";
        const { file } = mediaFiles[i];
        const ext  = file.name.split(".").pop();
        const path = `works/${user.id}/${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
        imageUrls.push(publicUrl);
        if (i === 0) coverUrl = publicUrl;
      }
      failedStep = "insert";
      // 2. DB Insert
      // FIX: works-Tabelle nutzt 'creator_id' nicht 'user_id'
      // FIX: visibility muss explizit 'public' sein wenn nicht gesetzt
      // ── Schema-korrekter Insert (works-Tabelle) ──────────────────
      // Bekannte Spalten: user_id, creator_id, title, description, category,
      //   cover_url, media_url, media_type, caption, price, for_sale,
      //   location_text, tags, mood_tags, atmosphere_tags, visibility, status
      // NICHT in Schema: sale_mode, shipping_*, file_format, size, materials,
      //   condition, images (JSONB-Spalte existiert aber images[] nicht)
      const workPayload = {
        user_id:     user.id,          // RLS INSERT: auth.uid() = user_id
        creator_id:  user.id,          // Doppelt gesetzt — beide Spalten vorhanden
        title:       form.title.trim() || "Werk",
        description: form.description ? form.description.trim() : null,
        category:    form.category     || null,
        cover_url:   coverUrl          || null,
        media_url:   imageUrls[0]      || coverUrl || null,
        media_type:  (mediaFiles[0]?.file?.type?.startsWith("video")) ? "video" : "image",
        caption:     form.description  ? form.description.trim().slice(0,500) : null,
        price:       form.price        ? parseFloat(form.price) : null,
        for_sale:    form.priceMode !== "free",
        visibility:  form.visibility   || "public",
        status:      "published",
      };
      console.info("[HUI_PUBLISH] works payload:", {
        user_id:    workPayload.user_id,
        creator_id: workPayload.creator_id,
        title:      workPayload.title,
        status:     workPayload.status,
        visibility: workPayload.visibility,
        cover_url:  workPayload.cover_url ? "✅" : "❌ leer",
        media_url:  workPayload.media_url  ? "✅" : "❌ leer",
      });
      const { data: workData, error: dbErr } = await supabase.from("works")
        .insert(workPayload)
        .select("id, status, visibility, user_id")
        .single();
      if (dbErr) {
        console.error("[HUI_PUBLISH_ERROR] works INSERT fehlgeschlagen:", {
          code:    dbErr.code,
          message: dbErr.message,
          hint:    dbErr.hint,
          details: dbErr.details,
          payload: workPayload,
        });
        throw new Error(`Werk konnte nicht gespeichert werden: ${dbErr.message} (${dbErr.code})`);
      }
      console.info("[HUI_REALITY] work published ✓", workData?.id, workData);
      setDone(true);
      setTimeout(() => onClose?.(), 2200);
    } catch(e) {
      const message = e.message || "Fehler beim Veröffentlichen";
      setError(message);
      reportInsertFailure({
        category: "publish",
        flow: "work-publish",
        step: failedStep,
        entity: "works",
        error: e,
        message,
      });
    } finally {
      setSaving(false);
    }
  }, [user, form, mediaFiles, onClose]);

  // ── Success Screen ───────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:9200,
        background:`linear-gradient(135deg, ${WT.teal} 0%, ${WT.coral} 100%)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        flexDirection:"column", gap:16,
        animation:"wfFadeIn 0.35s ease both",
      }}>
        <style>{`@keyframes wfFadeIn{from{opacity:0}to{opacity:1}}
          @keyframes wfPop{0%{transform:scale(.6)}65%{transform:scale(1.12)}100%{transform:scale(1)}}`}
        </style>
        <div style={{
          fontSize:64,
          animation:"wfPop 0.55s cubic-bezier(0.34,1.4,0.64,1) both",
        }}>✨</div>
        <div style={{ fontSize:22, fontWeight:900, color:"#fff",
          letterSpacing:-0.5 }}>Werk veröffentlicht!</div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.75)" }}>
          Deine Community sieht es jetzt.
        </div>
      </div>
    );
  }

  // ── Overlay Wrapper ──────────────────────────────────────────
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9200,
      background:"rgba(26,26,46,0.22)",
      backdropFilter:"blur(8px)",
      WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      // iPad: zentriert
      ...(window.innerWidth >= 1200 && {  // Desktop: zentriertes Sheet
        alignItems:"center",
      }),
    }}
    onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}
    >
      {/* Card-Container */}
      <div style={{
        width:"100%",
        maxWidth: window.innerWidth >= 1200 ? 440 : "100%",
        background:WT.card,
        borderRadius: window.innerWidth >= 1200 ? 28 : "28px 28px 0 0",
        overflow:"hidden",
        maxHeight:"92vh",
        display:"flex", flexDirection:"column",
        boxShadow:"0 24px 80px rgba(26,26,46,0.18), 0 4px 16px rgba(26,26,46,0.08)",
        animation:"wfSlideUp 0.38s cubic-bezier(0.32,0.72,0,1) both",
      }}>
        <style>{`
          @keyframes wfSlideUp {
            from { opacity:0; transform:translateY(40px) scale(0.97); }
            to   { opacity:1; transform:translateY(0)    scale(1); }
          }
          @keyframes wfFadeStep {
            from { opacity:0; transform:translateY(12px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>

        {/* Header */}
        <WorkHeader step={step} onBack={goBack} onClose={onClose} />

        {/* Step Content */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}
          className="wf-scroll">
          <style>{`.wf-scroll::-webkit-scrollbar{display:none}
            .wf-scroll{-ms-overflow-style:none;scrollbar-width:none}`}
          </style>

          {step === 0 && (
            <WorkMediaStep
              form={form}
              mediaFiles={mediaFiles}
              onFormChange={updateForm}
              onMediaChange={setMediaFiles}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <WorkDetailsStep
              form={form}
              onFormChange={updateForm}
              onNext={goNext}
            />
          )}
          {step === 2 && (
            <WorkPublishStep
              form={form}
              mediaFiles={mediaFiles}
              profile={profile}
              onFormChange={updateForm}
              onPublish={handlePublish}
              saving={saving}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
