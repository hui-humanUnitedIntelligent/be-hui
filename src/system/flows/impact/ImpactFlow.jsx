// src/system/flows/impact/ImpactFlow.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Wirkung starten Flow
// 4 separate Fenster / Steps:
//   Step 0: Projekt vorstellen  (Name, Beschreibung, Medien)
//   Step 1: Vision & Finanzierung
//   Step 2: Kontakt & Online Präsenz
//   Step 3: Bewerbung prüfen & absenden
//
// Design: Hell, luftig, Glassmorphism, Pastell, creator-first.
// Kein dunkler Look. Kein Cyberpunk. Soft White + Mint + Peach.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { ImpactStep1Projekt }     from "./ImpactStep1Projekt.jsx";
import { ImpactStep2Vision }      from "./ImpactStep2Vision.jsx";
import { ImpactStep3Kontakt }     from "./ImpactStep3Kontakt.jsx";
import { ImpactStep4Review }      from "./ImpactStep4Review.jsx";
import { supabase }               from "../../../lib/supabaseClient.js";
import { useAuth }                from "../../../lib/AuthContext.jsx";
import { validatePublishEntity }  from "../../../contracts/entityContract.js";

/* ── Design Tokens ──────────────────────────────────────────── */
export const IT = {
  teal:   "#0ABFB8",  tealD:  "#0891B2",
  coral:  "#FB923C",  coralD: "#EA580C",
  green:  "#10B981",  greenD: "#059669",
  violet: "#8B5CF6",
  ink:    "#1A1A2E",
  ink2:   "rgba(26,26,46,0.60)",
  ink3:   "rgba(26,26,46,0.38)",
  ink4:   "rgba(26,26,46,0.16)",
  bg:     "#F8F7FF",
  card:   "#FFFFFF",
  border: "rgba(26,26,46,0.08)",
};

/* ── Shared Input ────────────────────────────────────────────── */
export const IInput = {
  width:"100%", padding:"13px 14px", borderRadius:14,
  border:"1.5px solid rgba(26,26,46,0.09)",
  background:"rgba(248,247,255,0.75)",
  fontSize:15, color:"#1A1A2E",
  outline:"none", fontFamily:"inherit",
  boxSizing:"border-box", transition:"border-color 0.18s",
};

export const ITextarea = {
  ...IInput,
  resize:"none", lineHeight:1.6, paddingBottom:28,
};

/* ── Progress Bar (4 Steps) ─────────────────────────────────── */
function ProgressBar({ step }) {
  return (
    <div style={{ display:"flex", gap:5, flex:1 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:2,
          background: i <= step
            ? `linear-gradient(90deg, ${IT.teal}, ${IT.coral})`
            : "rgba(26,26,46,0.10)",
          transition:"background 0.35s ease",
        }}/>
      ))}
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────────── */
export function ImpactHeader({ step, onBack, onClose }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12,
      padding:"16px 20px 0", flexShrink:0 }}>
      <button onClick={onBack} style={{
        width:32, height:32, borderRadius:"50%",
        background:"rgba(26,26,46,0.05)", border:"none",
        cursor:"pointer", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:16, color:IT.ink2,
      }}>‹</button>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ fontSize:11, color:IT.ink3, fontWeight:600,
          letterSpacing:0.3, textAlign:"center" }}>
          Schritt {step+1} von 4
        </div>
        <ProgressBar step={step} />
      </div>
      <button onClick={onClose} style={{
        width:32, height:32, borderRadius:"50%",
        background:"rgba(26,26,46,0.05)", border:"none",
        cursor:"pointer", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:16, color:IT.ink2,
      }}>✕</button>
    </div>
  );
}

/* ── Weiter CTA (geteilt) ─────────────────────────────────────── */
export function ImpactNextBtn({ label="Weiter →", onClick, disabled }) {
  const handleClick = () => {
    if (!disabled && onClick) onClick();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchEnd={e => { e.preventDefault(); handleClick(); }}
      style={{
        width:"100%", height:54, borderRadius:18, border:"none",
        background: disabled
          ? "rgba(26,26,46,0.08)"
          : `linear-gradient(135deg, ${IT.teal} 0%, #06B6D4 100%)`,
        color: disabled ? IT.ink4 : "#fff",
        fontSize:16, fontWeight:800,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 8px 24px rgba(10,191,184,0.26)",
        transition:"all 0.22s ease",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        touchAction:"manipulation",
        WebkitTapHighlightColor:"transparent",
        userSelect:"none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

/* ── Haupt-Orchestrator ─────────────────────────────────────── */
export default function ImpactFlow({ onClose }) {
  const { user, profile } = useAuth();
  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);

  /* ── Formular-State ─────────────────────────────────────────── */
  const [form, setForm] = useState({
    // Step 1
    projectName:  "",
    shortDesc:    "",
    // Step 2
    problem:      "",
    vision:       "",
    why:          "",
    funding:      "",
    fundingUse:   "",
    // Step 3
    contactName:  "",
    email:        "",
    phone:        "",
    location:     "",
    website:      "",
    instagram:    "",
    linkedin:     "",
    youtube:      "",
    otherLinks:   "",
  });
  const [mediaFiles, setMediaFiles] = useState([]);

  const update = useCallback(patch => setForm(f => ({...f, ...patch})), []);

  /* ── Navigation ─────────────────────────────────────────────── */
  const goNext = useCallback(() => setStep(s => Math.min(s+1, 3)), []);
  const goBack = useCallback(() => {
    if (step === 0) onClose?.();
    else setStep(s => s-1);
  }, [step, onClose]);

  /* ── Publish ─────────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      // Medien hochladen
      const mediaUrls = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const { file } = mediaFiles[i];
        const ext  = file.name.split(".").pop();
        const path = `impact/${user.id}/${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
        mediaUrls.push(publicUrl);
      }
      // DB Insert
      const payload = {
        user_id:       user.id,
        project_name:  form.projectName.trim(),
        short_desc:    form.shortDesc.trim(),
        problem:       form.problem.trim(),
        vision:        form.vision.trim(),
        why_support:   form.why.trim(),
        funding_goal:  form.funding ? parseFloat(form.funding.replace(/\./g,"").replace(",",".")) : null,
        funding_use:   form.fundingUse.trim(),
        contact_name:  form.contactName.trim(),
        contact_email: form.email.trim(),
        contact_phone: form.phone.trim(),
        location:      form.location.trim(),
        website:       form.website.trim(),
        instagram:     form.instagram.trim(),
        linkedin:      form.linkedin.trim(),
        youtube:       form.youtube.trim(),
        other_links:   form.otherLinks.trim(),
        media_urls:    mediaUrls,
        cover_url:     mediaUrls[0] || null,
        status:        "pending",
        submitted_at:  new Date().toISOString(),
      };
      const validation = validatePublishEntity(payload, {
        entityType: "impact_application",
        sourceTable: "impact_applications",
        mediaInput: mediaUrls,
      });
      if (!validation.valid) throw new Error(`Impact-Vertrag ungueltig: ${validation.errors[0]}`);

      const { error: dbErr } = await supabase.from("impact_applications").insert(payload);
      if (dbErr) throw dbErr;
      setDone(true);
      setTimeout(() => onClose?.(), 2800);
    } catch(e) {
      setError(e.message || "Fehler beim Absenden");
    } finally { setSaving(false); }
  }, [user, form, mediaFiles, onClose]);

  /* ── Success Screen ─────────────────────────────────────────── */
  if (done) return (
    <div style={{
      position:"fixed", inset:0, zIndex:9300,
      background:`linear-gradient(135deg, ${IT.green} 0%, ${IT.teal} 50%, ${IT.coral} 100%)`,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:18,
      animation:"ifFadeIn 0.35s ease both",
    }}>
      <style>{`
        @keyframes ifFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes ifPop{0%{transform:scale(.4)}65%{transform:scale(1.12)}100%{transform:scale(1)}}
      `}</style>
      <div style={{ fontSize:72,
        animation:"ifPop 0.6s cubic-bezier(0.34,1.4,0.64,1) both" }}>🌱</div>
      <div style={{ fontSize:23, fontWeight:900, color:"#fff",
        letterSpacing:-0.5, textAlign:"center", padding:"0 24px" }}>
        Bewerbung erfolgreich!
      </div>
      <div style={{ fontSize:14, color:"rgba(255,255,255,0.80)",
        textAlign:"center", padding:"0 32px", lineHeight:1.6 }}>
        Dein Projekt wurde für den HUI ImpactPool eingereicht.<br/>
        Wir melden uns bald bei dir.
      </div>
    </div>
  );

  /* ── Overlay Shell ───────────────────────────────────────────── */
  const isTablet = window.innerWidth >= 1200; // Desktop: zentriertes Sheet
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9300,
      background:"rgba(26,26,46,0.20)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      display:"flex",
      alignItems: isTablet ? "center" : "flex-end",
      justifyContent:"center",
    }}
    onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}
    >
      <style>{`
        @keyframes ifSlideUp{
          from{opacity:0;transform:translateY(44px) scale(0.97)}
          to  {opacity:1;transform:translateY(0)    scale(1)}
        }
        @keyframes ifFadeStep{
          from{opacity:0;transform:translateY(10px)}
          to  {opacity:1;transform:translateY(0)}
        }
        .if-scroll::-webkit-scrollbar{display:none}
        .if-scroll{-ms-overflow-style:none;scrollbar-width:none}
        .if-input:focus{border-color:rgba(10,191,184,0.50)!important;
          background:rgba(255,255,255,0.95)!important}
      `}</style>

      <div style={{
        width:"100%", maxWidth: isTablet ? 460 : "100%",
        background:IT.card,
        borderRadius: isTablet ? 28 : "28px 28px 0 0",
        maxHeight:"93vh",
        display:"flex", flexDirection:"column",
        boxShadow:"0 28px 80px rgba(26,26,46,0.16), 0 4px 16px rgba(26,26,46,0.08)",
        animation:"ifSlideUp 0.38s cubic-bezier(0.32,0.72,0,1) both",
        overflow:"hidden",
      }}>
        {/* Header — fixiert */}
        <ImpactHeader step={step} onBack={goBack} onClose={onClose} />

        {/* Step Content — scrollbar */}
        <div className="if-scroll" style={{ flex:1, overflowY:"auto" }}>
          {step === 0 && (
            <ImpactStep1Projekt
              form={form} mediaFiles={mediaFiles}
              onFormChange={update} onMediaChange={setMediaFiles}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <ImpactStep2Vision
              form={form} onFormChange={update} onNext={goNext}
            />
          )}
          {step === 2 && (
            <ImpactStep3Kontakt
              form={form} onFormChange={update} onNext={goNext}
            />
          )}
          {step === 3 && (
            <ImpactStep4Review
              form={form} mediaFiles={mediaFiles} profile={profile}
              onSubmit={handleSubmit} saving={saving} error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
