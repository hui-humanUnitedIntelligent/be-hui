// src/system/flows/experience/ExperienceFlow.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Erlebnis öffnen Flow v2
// Kein Eventbrite. Kein Fiverr. Creator-first, menschlich, warm.
//
// Step 1: Fähigkeit vorstellen   (Titel, Beschreibung, Medien)
// Step 2: Angebotsdetails        (Preis, Dauer, Ort, Verfügbarkeit)
// Step 3: Veröffentlichung       (Vorschau, Sichtbarkeit, Publish)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { ExperienceCreateStep }  from "./ExperienceCreateStep.jsx";
import { ExperienceDetailsStep } from "./ExperienceDetailsStep.jsx";
import { ExperiencePublishStep } from "./ExperiencePublishStep.jsx";
import { supabase }              from "../../../lib/supabaseClient.js";
import { useAuth }               from "../../../lib/AuthContext.jsx";
import { publishExperience }      from "../../../lib/factories/experienceContract.js";
import { assertSupabaseResult, emitFeedRefresh, reportSupabaseFailure } from "../../../lib/supabaseDiagnostics.js";

/* ── Design Tokens (identisch zu WorkFlow / WT) ─────────────── */
export const ET = {
  teal:    "#0ABFB8",  tealD:  "#0891B2",
  coral:   "#FB923C",  coralD: "#EA580C",
  violet:  "#8B5CF6",  violetD:"#7C3AED",
  gold:    "#F59E0B",  goldD:  "#D97706",
  ink:     "#1A1A2E",
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.38)",
  ink4:    "rgba(26,26,46,0.20)",
  bg:      "#F8F7FF",
  card:    "#FFFFFF",
  border:  "rgba(26,26,46,0.08)",
  glass:   "rgba(255,255,255,0.90)",
};

/* ── Shared Input Style (exportiert für Sub-Steps) ───────────── */
export const EInput = {
  width:"100%", padding:"13px 14px", borderRadius:14,
  border:"1.5px solid rgba(26,26,46,0.09)",
  background:"rgba(248,247,255,0.70)",
  fontSize:15, color:"#1A1A2E",
  outline:"none", fontFamily:"inherit", boxSizing:"border-box",
  transition:"border-color 0.18s ease",
};

export const ESelect = {
  ...EInput,
  padding:"12px 34px 12px 14px",
  appearance:"none", WebkitAppearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231A1A2E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat", backgroundPosition:"right 13px center",
  cursor:"pointer",
};

/* ── Progress Bar ────────────────────────────────────────────── */
function ProgressBar({ step }) {
  return (
    <div style={{ display:"flex", gap:6, flex:1 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:2,
          background: i <= step
            ? `linear-gradient(90deg, ${ET.teal}, ${ET.coral})`
            : "rgba(26,26,46,0.10)",
          transition:"background 0.35s ease",
        }}/>
      ))}
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────────── */
export function ExpHeader({ step, onBack, onClose }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12,
      padding:"16px 20px 0" }}>
      <button onClick={onBack} style={{
        width:32, height:32, borderRadius:"50%",
        background:"rgba(26,26,46,0.05)", border:"none",
        cursor:"pointer", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:16, color:ET.ink2, flexShrink:0,
      }}>‹</button>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ fontSize:11, color:ET.ink3, fontWeight:600,
          letterSpacing:0.3, textAlign:"center" }}>
          ❖ {["Idee","Details","Freigabe"][step]}
        </div>
        <ProgressBar step={step} />
      </div>
      <button onClick={onClose} style={{
        width:32, height:32, borderRadius:"50%",
        background:"rgba(26,26,46,0.05)", border:"none",
        cursor:"pointer", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:15, color:ET.teal, flexShrink:0,
      }}>✦</button>
    </div>
  );
}

/* ── Haupt-Flow ─────────────────────────────────────────────── */
export default function ExperienceFlow({ onClose }) {
  const { user, profile } = useAuth();
  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState(null);

  const [form, setForm] = useState({
    title:       "",
    description: "",
    // Preis
    priceMode:   "hourly",   // "free" | "hourly" | "fixed" | "inquiry"
    price:       "",
    // Dauer
    duration:    "1 Stunde",
    durationCustom: "",
    // Ort
    locationType: "online",  // "online" | "onsite" | "hybrid"
    locationText: "",
    // Verfügbarkeit
    availDays:   [],         // ["mon","tue",...]
    availTimes:  "flexibel", // "morgens"|"mittags"|"abends"|"flexibel"
    maxParticipants: "",
    bookingMode: "direct",   // "direct"|"request"
    // Sichtbarkeit
    visibility:  "public",
    category:    "",
  });
  const [mediaFiles, setMediaFiles] = useState([]);

  const update = useCallback(patch => setForm(f => ({...f,...patch})), []);

  const goNext = useCallback(() => setStep(s => Math.min(s+1, 2)), []);
  const goBack = useCallback(() => {
    if (step === 0) onClose?.();
    else setStep(s => s-1);
  }, [step, onClose]);

  /* ── Publish — via Schema Contract Layer (Phase 4E) ─────────── */
  const handlePublish = useCallback(async () => {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const authUid = sessionData?.session?.user?.id || user.id;
      if (sessionError || !authUid) {
        await reportSupabaseFailure({
          title: "SUPABASE INSERT FAILED",
          source: "ExperienceFlow.handlePublish",
          operation: "auth.session",
          table: "experiences",
          payload: form,
          error: sessionError || { message: "Keine Supabase Auth Session oder uid vorhanden", code: "AUTH_SESSION_MISSING" },
          authUid,
        });
        throw new Error("Nicht eingeloggt.");
      }
      // 1. Medien hochladen → kanonisches [{ url, type, alt }] Format
      const uploadedUrls = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const { file } = mediaFiles[i];
        const ext  = file.name.split(".").pop();
        const path = `experiences/${authUid}/${Date.now()}_${i}.${ext}`;
        const uploadResult = await supabase.storage
          .from("media").upload(path, file, { contentType: file.type });
        await assertSupabaseResult(uploadResult, {
          title: "SUPABASE UPLOAD FAILED",
          source: "ExperienceFlow.mediaUpload",
          operation: "storage.upload",
          bucket: "media",
          path,
          payload: { file, index: i },
          authUid,
        });
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
        await assertSupabaseResult(
          { data: publicUrl ? { publicUrl } : null, error: publicUrl ? null : { message: "Storage upload returned no publicUrl", code: "STORAGE_PUBLIC_URL_MISSING" } },
          {
            title: "SUPABASE UPLOAD FAILED",
            source: "ExperienceFlow.storagePublicUrl",
            operation: "storage.getPublicUrl",
            bucket: "media",
            path,
            payload: { uploadPath: path },
            authUid,
          },
          { requireData: true }
        );
        uploadedUrls.push(publicUrl); // normalizeImages() wandelt zu { url, type, alt } um
      }
      // 2. Contract Layer: normalize → validate → insert (Phase 4E)
      const { data: expData, error: contractErr } = await publishExperience(
        supabase, form, authUid, uploadedUrls
      );
      if (contractErr) throw new Error(contractErr.message);
      console.log("[HUI_REALITY] ✓ experience published:", expData?.id);
      emitFeedRefresh({ source: "ExperienceFlow", table: "experiences", id: expData?.id });
      setDone(true);
      setTimeout(() => onClose?.(), 2200);
    } catch(e) {
      setError(e.message || "Fehler beim Veröffentlichen");
    } finally { setSaving(false); }
  }, [user, form, mediaFiles, onClose]);

  /* ── Success Screen ────────────────────────────────────────── */
  if (done) return (
    <div style={{
      position:"fixed", inset:0, zIndex:9200,
      background:`linear-gradient(135deg, ${ET.teal} 0%, ${ET.violet} 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", gap:16,
      animation:"efFadeIn 0.35s ease both",
    }}>
      <style>{`
        @keyframes efFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes efPop{0%{transform:scale(.5)}65%{transform:scale(1.15)}100%{transform:scale(1)}}
      `}</style>
      <div style={{ fontSize:66, animation:"efPop 0.55s cubic-bezier(0.34,1.4,0.64,1) both" }}>
        ✨
      </div>
      <div style={{ fontSize:22, fontWeight:900, color:"#fff", letterSpacing:-0.5 }}>
        Erlebnis ist live!
      </div>
      <div style={{ fontSize:14, color:"rgba(255,255,255,0.75)" }}>
        Deine Community kann dich jetzt buchen.
      </div>
    </div>
  );

  /* ── Overlay ───────────────────────────────────────────────── */
  const isTablet = window.innerWidth >= 1200; // Desktop: zentriertes Sheet
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9200,
      background:"rgba(26,26,46,0.22)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems: isTablet ? "center" : "flex-end",
      justifyContent:"center",
    }}
    onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}
    >
      <style>{`
        @keyframes efSlideUp{
          from{opacity:0;transform:translateY(40px) scale(0.97)}
          to  {opacity:1;transform:translateY(0)    scale(1)}
        }
        @keyframes efFadeStep{
          from{opacity:0;transform:translateY(10px)}
          to  {opacity:1;transform:translateY(0)}
        }
        .ef-scroll::-webkit-scrollbar{display:none}
        .ef-scroll{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <div style={{
        width:"100%", maxWidth: isTablet ? 440 : "100%",
        background:ET.card,
        borderRadius: isTablet ? 28 : "28px 28px 0 0",
        overflow:"hidden", maxHeight:"92vh",
        display:"flex", flexDirection:"column",
        boxShadow:"0 24px 80px rgba(26,26,46,0.18)",
        animation:"efSlideUp 0.38s cubic-bezier(0.32,0.72,0,1) both",
      }}>
        <ExpHeader step={step} onBack={goBack} onClose={onClose} />

        <div className="ef-scroll" style={{ flex:1, overflowY:"auto" }}>
          {step === 0 && (
            <ExperienceCreateStep
              form={form} mediaFiles={mediaFiles}
              onFormChange={update} onMediaChange={setMediaFiles}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <ExperienceDetailsStep
              form={form} onFormChange={update} onNext={goNext}
            />
          )}
          {step === 2 && (
            <ExperiencePublishStep
              form={form} mediaFiles={mediaFiles} profile={profile}
              onFormChange={update}
              onPublish={handlePublish} saving={saving} error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
