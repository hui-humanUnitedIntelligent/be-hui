// src/components/org/OrgProfileCreateFlow.jsx
// ══════════════════════════════════════════════════════════════════════
// OrgProfileCreateFlow — Account-Switcher: Organisation erstellen
// 3 Schritte: Typ wählen → Daten eingeben → Bestätigung
// Migration 132 (2026-08-30)
// ══════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { useWizardBodyLock } from "../../lib/wizardBodyLock";
import { useTranslation } from "../../hooks/useTranslation";
import { HUI } from "../../design/hui.design.js";
import { HUILogo } from "../brand/HUILogo.jsx";

const T = {
  teal:    HUI.COLOR.teal,
  coral:   HUI.COLOR.coral,
  gold:    HUI.COLOR.gold,
  card:    "#FFFFFF",
  ink:     HUI.COLOR.ink,
  ink2:    HUI.COLOR.ink2,
  muted:   HUI.COLOR.muted,
  border:  "rgba(0,0,0,0.07)",
  cream:   HUI.COLOR.cream,
};

const CSS = `
  @keyframes org-toUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes org-toIn{from{opacity:0}to{opacity:1}}
  @keyframes org-toPop{0%{transform:scale(0.85)}60%{transform:scale(1.05)}100%{transform:scale(1)}}
  .org-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .22s ease,opacity .2s ease}
  .org-tap:active{transform:scale(0.97) translateY(1px)!important;opacity:.85}
  .org-scroll::-webkit-scrollbar{display:none}
  .org-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

// ── Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ step }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:24 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          height:3, borderRadius:2,
          width: i === step ? 28 : 10,
          background: i <= step
            ? `linear-gradient(90deg,${T.teal},${T.coral})`
            : "rgba(0,0,0,0.10)",
          transition:"all .4s cubic-bezier(.34,1.4,.64,1)"
        }}/>
      ))}
    </div>
  );
}

// ── Haupt-Komponente ────────────────────────────────────────────────
export default function OrgProfileCreateFlow({ open, onClose }) {
  const { t } = useTranslation();
  const { user, profile, loadOrgProfiles, switchProfile } = useAuth();
  useWizardBodyLock(open);

  const [step, setStep]         = useState(0);
  const [orgType, setOrgType]   = useState(null);
  const [orgName, setOrgName]   = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState(null);
  const fileInputRef = useRef(null);

  // ── Reset beim Schließen ──────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (creating) return;
    setStep(0);
    setOrgType(null);
    setOrgName("");
    setOrgNumber("");
    setOrgDescription("");
    setAvatarUrl(null);
    setError(null);
    onClose?.();
  }, [creating, onClose]);

  // ── Avatar Upload ─────────────────────────────────────────────────
  const handleAvatarSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("org.avatarError"));
      return;
    }
    // Lokale Blob-URL für Instant-Preview
    const blobUrl = URL.createObjectURL(file);
    setAvatarUrl(blobUrl);
    setError(null);

    // Upload zu Supabase Storage
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const path = `org-avatars/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600" });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(path);
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.warn("[HUI] Org avatar upload:", err.message);
      // Behalte Blob-URL — besser als gar kein Avatar
    }
  }, [t]);

  // ── Organisation erstellen ────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!orgName.trim()) {
      setError(t("org.nameRequired"));
      return;
    }
    if (!user?.id) {
      setError(t("org.notLoggedIn"));
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const orgId = crypto.randomUUID();
      const ownerName = profile?.display_name || profile?.username || user.email?.split("@")[0] || "Unbekannt";

      const { data, error: insertErr } = await supabase
        .from("profiles")
        .insert({
          id: orgId,
          account_type: "organization",
          owner_user_id: user.id,
          org_name: orgName.trim(),
          org_type: orgType,
          org_number: orgNumber.trim() || null,
          org_description: orgDescription.trim() || null,
          display_name: orgName.trim(),
          managed_by: ownerName,
          is_talent: true,
          role: "talent",
          avatar_url: avatarUrl && avatarUrl.startsWith("http") ? avatarUrl : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id, org_name, org_type, avatar_url, account_type, display_name, username")
        .single();

      if (insertErr) throw insertErr;

      // Org-Profile neu laden und zum neuen Profil wechseln
      if (loadOrgProfiles) {
        await loadOrgProfiles(user.id);
      }
      if (switchProfile) {
        switchProfile(orgId);
      }

      handleClose();
    } catch (err) {
      console.error("[HUI] Org profile creation:", err);
      setError(err.message || t("org.createError"));
    } finally {
      setCreating(false);
    }
  }, [orgName, orgType, orgNumber, orgDescription, avatarUrl, user, profile, loadOrgProfiles, switchProfile, handleClose, t]);

  if (!open) return null;

  const ownerName = profile?.display_name || profile?.username || user?.email?.split("@")[0] || "";

  // ── Step 0: Typ wählen ────────────────────────────────────────────
  const renderStep0 = () => (
    <div style={{ animation:"org-toUp .4s ease" }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:T.ink, margin:"0 0 8px", textAlign:"center" }}>
        {t("org.step1.title")}
      </h2>
      <p style={{ fontSize:14, color:T.muted, textAlign:"center", margin:"0 0 28px" }}>
        {t("org.step1.subtitle")}
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:8 }}>
        {/* Verein */}
        <div
          className="org-tap"
          onClick={() => { setOrgType("verein"); setStep(1); }}
          style={{
            display:"flex", alignItems:"center", gap:16,
            padding:"18px 20px", borderRadius:14,
            background:T.card, border:`1.5px solid ${T.border}`,
          }}
        >
          <div style={{
            width:48, height:48, borderRadius:12, flexShrink:0,
            background:"rgba(22,215,197,0.10)", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24,
          }}>
            🤝
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:T.ink }}>{t("org.type.verein")}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:2 }}>{t("org.type.vereinDesc")}</div>
          </div>
        </div>

        {/* Unternehmen */}
        <div
          className="org-tap"
          onClick={() => { setOrgType("unternehmen"); setStep(1); }}
          style={{
            display:"flex", alignItems:"center", gap:16,
            padding:"18px 20px", borderRadius:14,
            background:T.card, border:`1.5px solid ${T.border}`,
          }}
        >
          <div style={{
            width:48, height:48, borderRadius:12, flexShrink:0,
            background:"rgba(245,166,35,0.10)", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24,
          }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:T.ink }}>{t("org.type.unternehmen")}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:2 }}>{t("org.type.unternehmenDesc")}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Daten eingeben ────────────────────────────────────────
  const renderStep1 = () => (
    <div style={{ animation:"org-toSlide .4s ease" }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:T.ink, margin:"0 0 8px", textAlign:"center" }}>
        {t("org.step2.title")}
      </h2>
      <p style={{ fontSize:14, color:T.muted, textAlign:"center", margin:"0 0 24px" }}>
        {orgType === "verein" ? t("org.type.verein") : t("org.type.unternehmen")}
      </p>

      {/* Avatar */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
        <div
          className="org-tap"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width:80, height:80, borderRadius:"50%", overflow:"hidden",
            border:`2px solid ${T.border}`, position:"relative",
            display:"flex", alignItems:"center", justifyContent:"center",
            background: avatarUrl ? "transparent" : "rgba(0,0,0,0.03)",
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <HUILogo size={28} style={{ opacity:0.4 }} />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
          style={{ display:"none" }}
        />
      </div>

      {/* org_name (Pflicht) */}
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.ink2, marginBottom:6 }}>
        {t("org.step2.name")} *
      </label>
      <input
        type="text"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder={orgType === "verein" ? t("org.step2.namePlaceholderVerein") : t("org.step2.namePlaceholderUnternehmen")}
        style={{
          width:"100%", padding:"12px 14px", fontSize:15, borderRadius:10,
          border:`1.5px solid ${T.border}`, outline:"none", marginBottom:16,
          fontFamily:"inherit", color:T.ink,
        }}
      />

      {/* org_number (optional) */}
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.ink2, marginBottom:6 }}>
        {t("org.step2.number")} ({t("org.optional")})
      </label>
      <input
        type="text"
        value={orgNumber}
        onChange={(e) => setOrgNumber(e.target.value)}
        placeholder={orgType === "verein" ? t("org.step2.numberPlaceholderVerein") : t("org.step2.numberPlaceholderUnternehmen")}
        style={{
          width:"100%", padding:"12px 14px", fontSize:15, borderRadius:10,
          border:`1.5px solid ${T.border}`, outline:"none", marginBottom:16,
          fontFamily:"inherit", color:T.ink,
        }}
      />

      {/* org_description (optional) */}
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.ink2, marginBottom:6 }}>
        {t("org.step2.description")} ({t("org.optional")})
      </label>
      <textarea
        value={orgDescription}
        onChange={(e) => setOrgDescription(e.target.value)}
        placeholder={t("org.step2.descriptionPlaceholder")}
        rows={3}
        style={{
          width:"100%", padding:"12px 14px", fontSize:15, borderRadius:10,
          border:`1.5px solid ${T.border}`, outline:"none", marginBottom:20,
          fontFamily:"inherit", color:T.ink, resize:"none",
        }}
      />
    </div>
  );

  // ── Step 2: Bestätigung ────────────────────────────────────────────
  const renderStep2 = () => (
    <div style={{ animation:"org-toUp .4s ease" }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:T.ink, margin:"0 0 8px", textAlign:"center" }}>
        {t("org.step3.title")}
      </h2>
      <p style={{ fontSize:14, color:T.muted, textAlign:"center", margin:"0 0 24px" }}>
        {t("org.step3.subtitle")}
      </p>

      {/* Zusammenfassung */}
      <div style={{
        background:T.card, borderRadius:14, padding:20,
        border:`1.5px solid ${T.border}`, marginBottom:24,
      }}>
        {/* Avatar + Name */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
          <div style={{
            width:56, height:56, borderRadius:"50%", overflow:"hidden",
            display:"flex", alignItems:"center", justifyContent:"center",
            background: avatarUrl ? "transparent" : "rgba(0,0,0,0.03)",
            flexShrink:0,
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            ) : (
              <HUILogo size={24} style={{ opacity:0.4 }} />
            )}
          </div>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:T.ink }}>{orgName}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:2 }}>
              {orgType === "verein" ? t("org.type.verein") : t("org.type.unternehmen")}
            </div>
          </div>
        </div>

        {/* Details */}
        {orgNumber && (
          <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${T.border}` }}>
            <span style={{ fontSize:14, color:T.muted }}>{t("org.step2.number")}</span>
            <span style={{ fontSize:14, color:T.ink, fontWeight:500 }}>{orgNumber}</span>
          </div>
        )}
        {orgDescription && (
          <div style={{ padding:"8px 0", borderTop:`1px solid ${T.border}` }}>
            <span style={{ fontSize:14, color:T.muted }}>{t("org.step2.description")}</span>
            <p style={{ fontSize:14, color:T.ink, marginTop:4 }}>{orgDescription}</p>
          </div>
        )}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${T.border}` }}>
          <span style={{ fontSize:14, color:T.muted }}>{t("org.step3.managedBy")}</span>
          <span style={{ fontSize:14, color:T.ink, fontWeight:500 }}>{ownerName}</span>
        </div>
      </div>

      {error && (
        <div style={{
          padding:"10px 14px", borderRadius:8,
          background:"rgba(255,99,99,0.08)", color:"#E53E3E",
          fontSize:13, marginBottom:16, textAlign:"center",
        }}>
          {error}
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(0,0,0,0.55)",
      display:"flex", alignItems:"flex-end",
      animation:"org-toIn .3s ease",
    }}>
      <style>{CSS}</style>
      <div style={{
        width:"100%", maxWidth:480, margin:"0 auto",
        background:T.cream, borderRadius:"24px 24px 0 0",
        padding:"24px 20px calc(88px + env(safe-area-inset-bottom, 0px))",
        maxHeight:"92dvh", overflowY:"auto",
        className:"org-scroll",
      }}
      className="org-scroll">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          {/* Back / Close */}
          {step > 0 ? (
            <button
              className="org-tap"
              onClick={() => setStep(step - 1)}
              disabled={creating}
              style={{
                background:"none", border:"none", fontSize:14, color:T.teal,
                fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              }}
            >
              ← {t("org.back")}
            </button>
          ) : (
            <button
              className="org-tap"
              onClick={handleClose}
              disabled={creating}
              style={{
                background:"none", border:"none", fontSize:24, color:T.muted,
                cursor:"pointer", lineHeight:1, fontFamily:"inherit",
              }}
            >
              ✕
            </button>
          )}
          <span style={{ fontSize:13, color:T.muted, fontWeight:500 }}>
            {t("org.title")}
          </span>
          <div style={{ width:24 }} />
        </div>

        <ProgressBar step={step} />

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}

        {/* Footer-Buttons */}
        {step === 1 && (
          <button
            className="org-tap"
            onClick={() => {
              if (!orgName.trim()) { setError(t("org.nameRequired")); return; }
              setError(null);
              setStep(2);
            }}
            disabled={!orgName.trim()}
            style={{
              width:"100%", padding:"14px", borderRadius:12,
              background: orgName.trim() ? T.teal : "rgba(0,0,0,0.08)",
              color: orgName.trim() ? "#fff" : T.muted,
              fontSize:15, fontWeight:600, border:"none",
              fontFamily:"inherit", cursor:"pointer",
            }}
          >
            {t("org.continue")}
          </button>
        )}

        {step === 2 && (
          <button
            className="org-tap"
            onClick={handleCreate}
            disabled={creating}
            style={{
              width:"100%", padding:"14px", borderRadius:12,
              background: creating ? T.muted : T.teal,
              color:"#fff", fontSize:15, fontWeight:600,
              border:"none", fontFamily:"inherit", cursor:"pointer",
            }}
          >
            {creating ? t("org.creating") : t("org.step3.create")}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
