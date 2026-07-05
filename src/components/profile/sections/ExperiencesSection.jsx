// src/components/profile/sections/ExperiencesSection.jsx
// ══════════════════════════════════════════════════════════════════════
// EXPERIENCES SECTION — Erlebnisse & Projekte
// Owner: + ExperienceWizard CTA. Empty-State mit Aufforderung.
// Visitor: Read-only. Empty-State statt null.
// Filter: Visitor sieht nur published/active/approved.
// ══════════════════════════════════════════════════════════════════════
import React from "react";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", borderMid:"rgba(26,26,24,0.14)",
  border:"rgba(26,26,24,0.08)", r12:12, r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

const CAT_MAP = {
  workshop:"Workshop", kurs:"Workshop", malen:"Workshop",
  event:"Event", festival:"Event", konzert:"Event",
  ausstellung:"Ausstellung", galerie:"Ausstellung",
  projekt:"Projekt", community:"Projekt",
};
function catLabel(cat) {
  if (!cat) return "Projekt";
  const k = cat.toLowerCase();
  for (const [key, val] of Object.entries(CAT_MAP)) { if (k.includes(key)) return val; }
  return "Projekt";
}
function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("de-DE", { month:"short", year:"numeric" }); }
  catch { return ""; }
}

function Sk({ w, h, r=8 }) {
  return <div style={{ width:w, height:h, borderRadius:r, flexShrink:0,
    background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
    backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>;
}

export function ExperiencesSection({
  experiences = [],
  isOwner     = false,
  loading     = false,
  onAddExperience = null,
  onShowAll       = null,
  onExperiencePress = null,
}) {
  const visible = isOwner
    ? experiences
    : experiences.filter(e => ["published","active","approved"].includes(e.status));

  if (loading) {
    return (
      <div>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.es-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.es-hscroll::-webkit-scrollbar{display:none}`}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`0 ${T.px}px`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>Erlebnisse & Projekte</div>
        </div>
        <div className="es-hscroll" style={{ display:"flex", gap:10, padding:`0 ${T.px}px 4px` }}>
          {[1,2,3,4].map(i => <Sk key={i} w={110} h={130} r={T.r16}/>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.es-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.es-hscroll::-webkit-scrollbar{display:none}.es-press{-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}.es-press:active{opacity:.65}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:`0 ${T.px}px`, marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
          Erlebnisse & Projekte
        </div>
        {visible.length > 0 && onShowAll && (
          <button onClick={onShowAll} style={{ background:"none", border:"none", padding:0,
            fontSize:12, fontWeight:600, color:T.teal, cursor:"pointer", fontFamily:"inherit" }}>
            Alle anzeigen ›
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        isOwner ? (
          <div style={{ margin:`0 ${T.px}px` }}>
            <button onClick={onAddExperience} style={{
              width:"100%", padding:"20px 16px", borderRadius:T.r16,
              background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
              display:"flex", flexDirection:"column", alignItems:"center", gap:6,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            }}>
              <span style={{ fontSize:24 }}>🎟</span>
              <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>Erstes Erlebnis erstellen</div>
              <div style={{ fontSize:12, color:T.inkFaint }}>Workshops, Events, Begegnungen</div>
            </button>
          </div>
        ) : (
          <div style={{ margin:`0 ${T.px}px`, padding:"20px 16px", borderRadius:T.r16,
            background:T.bgCard, border:`1px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>🎟</div>
            <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic" }}>
              Dieses Talent plant aktuell keine Erlebnisse.
            </div>
          </div>
        )
      ) : (
        <div className="es-hscroll" style={{ display:"flex", gap:10, padding:`0 ${T.px}px 4px` }}>
          {visible.slice(0,6).map((ex,i) => (
            <div
              key={ex.id||i}
              className="es-press"
              onClick={() => onExperiencePress?.(ex)}
              style={{ flexShrink:0, width:110, cursor: onExperiencePress ? "pointer" : "default" }}
            >
              <div style={{ width:110, height:100, borderRadius:T.r16, overflow:"hidden",
                background:"linear-gradient(135deg,#2C3B2D,#8B7355)", marginBottom:6 }}>
                {ex.cover_url
                  ? <img src={ex.cover_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}
                      onError={e=>e.target.style.display="none"}/>
                  : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:28 }}>🎭</div>}
              </div>
              <div style={{ fontSize:11.5, fontWeight:700, color:T.ink, lineHeight:1.3,
                marginBottom:2, overflow:"hidden", display:"-webkit-box",
                WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                {ex.title || "Erlebnis"}
              </div>
              <div style={{ fontSize:10.5, color:T.inkFaint }}>{catLabel(ex.category)}</div>
              <div style={{ fontSize:10, color:T.inkFaint }}>{fmtDate(ex.date || ex.created_at)}</div>
            </div>
          ))}

          {/* Hinzufügen — Owner */}
          {isOwner && (
            <div style={{ flexShrink:0, width:80 }}>
              <button className="es-press" onClick={onAddExperience} style={{
                width:80, height:100, borderRadius:T.r16,
                background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
                display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:4, cursor:"pointer",
              }}>
                <span style={{ fontSize:20, color:T.inkFaint }}>+</span>
              </button>
              <div style={{ fontSize:10.5, color:T.inkFaint, textAlign:"center", marginTop:4, lineHeight:1.3 }}>
                Erlebnis<br/>hinzufügen
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default ExperiencesSection;
