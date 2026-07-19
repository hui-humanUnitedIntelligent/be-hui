// src/components/profile/sections/AboutSection.jsx
// ══════════════════════════════════════════════════════════════════════
// ABOUT SECTION — "Über dich" / Bio
// Owner: Inline-Edit mit Char-Counter
// Visitor: Read-only, italic. Empty-State statt null.
// ══════════════════════════════════════════════════════════════════════
import React, { useState } from "react";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)",
  tealSoft:"rgba(14,196,184,0.08)", glowTeal:"0 3px 12px rgba(14,196,184,0.22)",
  border:"rgba(26,26,24,0.08)", r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};
const MAX_BIO = 220;

function SectionTitle({ title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>{title}</div>
    </div>
  );
}

export function AboutSection({ profile, isOwner = false, loading = false, onSave }) {
  const bio = profile?.bio || "";
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(bio);

  const handleSave = () => {
    onSave?.(draft.trim());
    setEditing(false);
  };

  if (loading) {
    return (
      <div style={{ padding:`0 ${T.px}px` }}>
        <SectionTitle title="Über dich"/>
        <div style={{ background:T.bgCard, borderRadius:T.r16, padding:"14px 16px", border:`1px solid ${T.border}` }}>
          {[100, 90, 70].map((w,i) => (
            <div key={i} style={{
              width:`${w}%`, height:13, borderRadius:6, marginBottom:i < 2 ? 8 : 0,
              background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
              backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite",
            }}/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Titel außerhalb der Kachel */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>Über dich</div>
        {isOwner && !editing && (
          <button onClick={() => { setDraft(bio); setEditing(true); }}
            style={{ background:"none", border:"none", padding:0, fontSize:12, color:T.teal,
              fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Bearbeiten ›
          </button>
        )}
      </div>

      {/* Kachel ohne eigenen Titel */}
      <div style={{
        background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${editing ? T.tealMid : T.border}`,
        padding:"14px 16px",
        boxShadow: editing ? `0 0 0 3px ${T.tealSoft}, ${T.card}` : T.card,
        transition:"all .2s ease",
      }}>
        {editing ? (
          <>
            <textarea autoFocus value={draft}
              onChange={e => setDraft(e.target.value.slice(0, MAX_BIO))}
              style={{
                width:"100%", minHeight:80, border:"none", outline:"none",
                background:"transparent", fontSize:14, color:T.ink,
                lineHeight:1.68, resize:"none", fontFamily:"inherit", fontStyle:"italic",
                boxSizing:"border-box",
              }}
              placeholder="Erzähl etwas über dich…"
            />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
              <span style={{ fontSize:11, color:T.inkFaint }}>{draft.length} / {MAX_BIO}</span>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setEditing(false)}
                  style={{ padding:"6px 14px", borderRadius:T.r99, border:`1px solid ${T.border}`,
                    background:"transparent", fontSize:12, fontWeight:600, color:T.inkSoft,
                    cursor:"pointer", fontFamily:"inherit" }}>Abbrechen</button>
                <button onClick={handleSave}
                  style={{ padding:"6px 16px", borderRadius:T.r99, border:"none",
                    background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
                    fontSize:12, fontWeight:700, color:"white",
                    cursor:"pointer", fontFamily:"inherit", boxShadow:T.glowTeal }}>Speichern</button>
              </div>
            </div>
          </>
        ) : bio ? (
          <p style={{ fontSize:14, lineHeight:1.68, color:T.inkSoft, margin:0,
            fontFamily:"-apple-system,'Georgia',serif", fontStyle:"italic" }}>
            {bio}
          </p>
        ) : isOwner ? (
          <button onClick={() => { setDraft(""); setEditing(true); }}
            style={{ background:"none", border:"none", padding:0, cursor:"pointer",
              fontFamily:"inherit", textAlign:"left", width:"100%" }}>
            <p style={{ fontSize:14, lineHeight:1.68, color:T.inkFaint, margin:0, fontStyle:"italic" }}>
              Erzähl etwas über dich — was dich antreibt, was du liebst.
            </p>
            <div style={{ fontSize:12, color:T.teal, fontWeight:700, marginTop:6 }}>
              Jetzt hinzufügen ›
            </div>
          </button>
        ) : (
          <p style={{ fontSize:14, lineHeight:1.68, color:T.inkFaint, margin:0, fontStyle:"italic" }}>
            Dieses Mitglied hat noch keine Beschreibung hinterlegt.
          </p>
        )}
      </div>
    </div>
  );
}
export default AboutSection;
