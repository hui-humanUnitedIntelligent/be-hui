// src/components/profile/sections/LocationSection.jsx
// ══════════════════════════════════════════════════════════════════════
// LOCATION SECTION — Standort
// Owner: Inline-Edit
// Visitor: Read-only. Empty-State statt null.
// Daten: profile.location_final (aus useProfileData) oder profile.location
// ══════════════════════════════════════════════════════════════════════
import React, { useState } from "react";

const T = {
  bgCard:"#FFFFFF", ink:"#1A1A18", inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)",
  border:"rgba(26,26,24,0.08)", r12:12, r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

export function LocationSection({
  profile  = null,
  isOwner  = false,
  loading  = false,
  onSave   = null,   // (location: string) => void
}) {
  // location_final aus useProfileData bevorzugen
  const location = profile?.location_final || profile?.location || "";
  // ── SPRINT D.2 TRACE
  // ── END TRACE
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState(location);
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave?.(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  if (loading) return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ height:72, borderRadius:T.r16, border:`1px solid ${T.border}`,
        background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
        backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${editing ? T.tealMid : T.border}`,
        padding:"14px", boxShadow:T.card, transition:"border-color .2s ease" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>Standort</div>
          {isOwner && !editing && (
            <button onClick={() => { setDraft(location); setEditing(true); }}
              style={{ background:"none", border:"none", padding:0, fontSize:11,
                color:T.teal, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Bearbeiten ›
            </button>
          )}
        </div>

        {editing ? (
          <div>
            <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
              placeholder="z.B. Berlin, Deutschland"
              style={{ width:"100%", padding:"8px 10px", borderRadius:T.r12,
                border:`1.5px solid ${T.teal}`, outline:"none",
                fontSize:12, color:T.ink, fontFamily:"inherit", boxSizing:"border-box" }}/>
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <button onClick={() => setEditing(false)}
                style={{ flex:1, padding:"7px", borderRadius:T.r99,
                  border:`1px solid ${T.border}`, background:"none",
                  fontSize:11, color:T.inkSoft, cursor:"pointer", fontFamily:"inherit" }}>
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:2, padding:"7px", borderRadius:T.r99, border:"none",
                  background:T.teal, fontSize:11, fontWeight:700, color:"white",
                  cursor: saving ? "default" : "pointer", fontFamily:"inherit" }}>
                {saving ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>
        ) : location ? (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px",
            borderRadius:T.r12, background:"rgba(26,26,24,0.03)", border:`1px solid ${T.border}` }}>
            <span style={{ fontSize:14 }}>📍</span>
            <span style={{ fontSize:11.5, color:T.ink, fontWeight:500 }}>{location}</span>
          </div>
        ) : isOwner ? (
          <button onClick={() => { setDraft(""); setEditing(true); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px",
              borderRadius:T.r12, background:"rgba(26,26,24,0.03)", border:`1px solid ${T.border}`,
              cursor:"pointer", width:"100%", fontFamily:"inherit" }}>
            <span style={{ fontSize:14 }}>📍</span>
            <span style={{ fontSize:11.5, color:T.inkFaint }}>Standort hinzufügen</span>
          </button>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px",
            borderRadius:T.r12, background:"rgba(26,26,24,0.03)", border:`1px solid ${T.border}` }}>
            <span style={{ fontSize:14 }}>📍</span>
            <span style={{ fontSize:11.5, color:T.inkFaint }}>Standort nicht angegeben</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default LocationSection;
