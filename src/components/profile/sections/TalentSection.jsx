// src/components/profile/sections/TalentSection.jsx
// ══════════════════════════════════════════════════════════════════════
// TALENT SECTION — Talente & Angebote
// Owner: Pills + Sheet-Editor zum Hinzufügen/Entfernen
// Visitor: Read-only Pills. Empty-State statt null.
// Daten: profile.skills_final (aus useProfileData) oder profile.skills
// ══════════════════════════════════════════════════════════════════════
import React, { useState } from "react";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)",
  tealSoft:"rgba(14,196,184,0.08)", glowTeal:"0 3px 12px rgba(14,196,184,0.22)",
  border:"rgba(26,26,24,0.08)", borderMid:"rgba(26,26,24,0.14)",
  r12:12, r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

const TALENT_KATEGORIEN = [
  {icon:"🎨",label:"Malerei"},{icon:"✏️",label:"Illustration"},
  {icon:"📸",label:"Fotografie"},{icon:"🎵",label:"Musik"},
  {icon:"🎤",label:"Gesang"},{icon:"🪡",label:"Handwerk"},
  {icon:"💻",label:"Programmierung"},{icon:"📐",label:"Design"},
  {icon:"📚",label:"Bildung"},{icon:"🎭",label:"Theater"},
  {icon:"🧘",label:"Coaching"},{icon:"🌿",label:"Naturführung"},
  {icon:"🍳",label:"Kochen"},{icon:"🎬",label:"Film"},
  {icon:"✍️",label:"Schreiben"},{icon:"🏺",label:"Töpfern"},
  {icon:"🎸",label:"Workshops"},{icon:"⭐",label:"Kunstberatung"},
  {icon:"🖼️",label:"Auftragskunst"},{icon:"🎁",label:"Weitere Angebote"},
];

function normalizeSkills(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(s => typeof s === "string" ? { icon:"✨", label:s } : s).filter(s => s?.label);
}

export function TalentSection({ profile, isOwner = false, loading = false, onChange }) {
  // skills_final aus useProfileData bevorzugen, Fallback auf profile.skills
  const skills = normalizeSkills(profile?.skills_final ?? profile?.skills ?? []);
  // ── SPRINT D.2 TRACE
  // ── END TRACE
  const [showSheet, setShowSheet] = useState(false);

  const currentLabels = skills.map(s => s.label);

  const toggle = (label) => {
    const next = currentLabels.includes(label)
      ? currentLabels.filter(x => x !== label)
      : [...currentLabels, label];
    onChange?.(next);
  };

  if (loading) {
    return (
      <div style={{ padding:`0 ${T.px}px` }}>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, marginBottom:10 }}>Meine Talente & Angebote</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {[100,80,110,90,70].map((w,i) => (
            <div key={i} style={{ width:w, height:32, borderRadius:T.r99,
              background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
              backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
          Meine Talente & Angebote
        </div>
        {isOwner && (
          <button onClick={() => setShowSheet(true)}
            style={{ background:"none", border:"none", padding:0, fontSize:12, color:T.teal,
              fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Bearbeiten ›
          </button>
        )}
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {skills.length === 0 ? (
          isOwner ? (
            <button onClick={() => setShowSheet(true)} style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"10px 16px", borderRadius:T.r99,
              background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
              fontSize:13, fontWeight:600, color:T.inkSoft,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            }}>
              <span style={{ fontSize:16 }}>+</span> Talente hinzufügen
            </button>
          ) : (
            <div style={{
              width:"100%", padding:"16px", borderRadius:T.r16,
              background:T.bgCard, border:`1px solid ${T.border}`, textAlign:"center",
            }}>
              <div style={{ fontSize:20, marginBottom:6 }}>✨</div>
              <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic" }}>
                Dieses Talent hat noch keine Angebote hinterlegt.
              </div>
            </div>
          )
        ) : (
          <>
            {skills.slice(0,10).map((sk,i) => (
              <div key={i} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"7px 14px", borderRadius:T.r99,
                background:T.bgCard, border:`1px solid ${T.tealMid}`,
                fontSize:13, fontWeight:600, color:T.ink, boxShadow:T.card,
              }}>
                <span style={{ fontSize:13 }}>{sk.icon || "✨"}</span>{sk.label}
              </div>
            ))}
            {isOwner && (
              <button onClick={() => setShowSheet(true)} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"7px 14px", borderRadius:T.r99,
                background:"transparent", border:`1.5px dashed ${T.borderMid}`,
                fontSize:12.5, fontWeight:600, color:T.inkSoft,
                cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
              }}>
                <span style={{ fontSize:14 }}>+</span> Weiteres hinzufügen
              </button>
            )}
          </>
        )}
      </div>

      {/* Sheet-Editor */}
      {showSheet && (
        <div onClick={() => setShowSheet(false)} style={{
          position:"fixed", inset:0, zIndex:9800,
          background:"rgba(26,26,24,0.45)", display:"flex", alignItems:"flex-end",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"100%", background:"#FDFCFB",
            borderRadius:"24px 24px 0 0",
            padding:"20px 20px max(36px,calc(20px + env(safe-area-inset-bottom,0px)))",
            maxHeight:"80vh", overflowY:"auto",
          }}>
            <div style={{ width:36, height:4, borderRadius:99,
              background:"rgba(26,26,24,0.12)", margin:"0 auto 20px" }}/>
            <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>
              Meine Talente & Angebote
            </div>
            <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>
              Was kannst du? Was bietest du an?
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
              {TALENT_KATEGORIEN.map((t,i) => {
                const active = currentLabels.includes(t.label);
                return (
                  <button key={i} onClick={() => toggle(t.label)} style={{
                    display:"inline-flex", alignItems:"center", gap:6,
                    padding:"9px 16px", borderRadius:T.r99,
                    background: active ? T.tealSoft : T.bgCard,
                    border:`1px solid ${active ? T.tealMid : T.border}`,
                    fontSize:13.5, fontWeight:600,
                    color: active ? T.teal : T.ink,
                    cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                    boxShadow: active ? T.glowTeal : T.card,
                  }}>
                    <span style={{ fontSize:15 }}>{t.icon}</span>{t.label}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowSheet(false)} style={{
              width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
              background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
              color:"white", fontSize:15, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            }}>Fertig</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default TalentSection;
