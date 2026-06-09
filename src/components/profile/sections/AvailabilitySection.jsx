// src/components/profile/sections/AvailabilitySection.jsx
// ══════════════════════════════════════════════════════════════════════
// AVAILABILITY SECTION — Verfügbarkeit
// Owner: Bearbeiten-Button (schaltet focus_type um)
// Visitor: Read-only Status-Badge
// ══════════════════════════════════════════════════════════════════════
import React, { useState } from "react";

const T = {
  bgCard:"#FFFFFF", ink:"#1A1A18", inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)", tealSoft:"rgba(14,196,184,0.08)",
  border:"rgba(26,26,24,0.08)", r12:12, r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

export function AvailabilitySection({
  profile    = null,
  isOwner    = false,
  loading    = false,
  onSave     = null,   // (focus_type: string) => void
}) {
  const isOpen = profile?.focus_type !== "private";
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    const next = isOpen ? "private" : "open";
    setSaving(true);
    await onSave?.(next);
    setSaving(false);
  };

  if (loading) return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ background:T.bgCard, borderRadius:T.r16, height:80,
        border:`1px solid ${T.border}`, boxShadow:T.card,
        background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
        backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${T.border}`, padding:"14px", boxShadow:T.card }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>Verfügbarkeit</div>
          {isOwner && (
            <button onClick={handleToggle} disabled={saving}
              style={{ background:"none", border:"none", padding:0, fontSize:11,
                color: saving ? T.inkFaint : T.teal, fontWeight:700,
                cursor: saving ? "default" : "pointer", fontFamily:"inherit" }}>
              {saving ? "Speichert…" : isOpen ? "Als ausgelastet markieren ›" : "Als offen markieren ›"}
            </button>
          )}
        </div>
        <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:8 }}>
          Für neue Anfragen und Begegnungen offen.
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 10px", borderRadius:T.r12,
          background: isOpen ? T.tealSoft : "rgba(26,26,24,0.04)",
          border:`1px solid ${isOpen ? T.tealMid : T.border}` }}>
          <span style={{ width:7, height:7, borderRadius:"50%",
            background: isOpen ? T.teal : T.inkFaint,
            display:"inline-block", flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color: isOpen ? T.teal : T.inkSoft }}>
              {isOpen ? "Offen für neue Anfragen" : "Momentan ausgelastet"}
            </div>
            <div style={{ fontSize:10, color:T.inkFaint }}>Antwortzeit: innerhalb von 24h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AvailabilitySection;
