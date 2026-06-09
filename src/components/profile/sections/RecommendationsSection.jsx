// src/components/profile/sections/RecommendationsSection.jsx
// ══════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS SECTION — Kundenstimmen / Empfehlungen
// Owner: + Weitere hinzufügen. Empty-State mit Hinweis.
// Visitor: Sterne-Rating + work_title. Empty-State statt null.
// ══════════════════════════════════════════════════════════════════════
import React from "react";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)", borderMid:"rgba(26,26,24,0.14)",
  border:"rgba(26,26,24,0.08)", r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

function Sk({ w, h, r=8 }) {
  return <div style={{ width:w, height:h, borderRadius:r, flexShrink:0,
    background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
    backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>;
}

function Stars({ rating }) {
  const r = Math.min(5, Math.max(0, Math.round(rating || 0)));
  return (
    <div style={{ fontSize:11, color:"#F59E0B", marginBottom:4, letterSpacing:"1px" }}>
      {"★".repeat(r)}{"☆".repeat(5 - r)}
    </div>
  );
}

export function RecommendationsSection({
  recommendations = [],
  isOwner         = false,
  loading         = false,
  onAddRec        = null,
  onShowAll       = null,
}) {
  if (loading) {
    return (
      <div>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.rs-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.rs-hscroll::-webkit-scrollbar{display:none}`}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`0 ${T.px}px`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>Kundenstimmen</div>
        </div>
        <div className="rs-hscroll" style={{ display:"flex", gap:12, padding:`0 ${T.px}px 4px` }}>
          <Sk w={210} h={110} r={T.r16}/>
          <Sk w={210} h={110} r={T.r16}/>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.rs-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.rs-hscroll::-webkit-scrollbar{display:none}.rs-press{-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}.rs-press:active{opacity:.65}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:`0 ${T.px}px`, marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
          Kundenstimmen
        </div>
        {recommendations.length > 0 && onShowAll && (
          <button onClick={onShowAll} style={{ background:"none", border:"none", padding:0,
            fontSize:12, fontWeight:600, color:T.teal, cursor:"pointer", fontFamily:"inherit" }}>
            Alle anzeigen ›
          </button>
        )}
      </div>

      {recommendations.length === 0 ? (
        isOwner ? (
          <div style={{ margin:`0 ${T.px}px` }}>
            <div style={{ padding:"16px", borderRadius:T.r16,
              background:T.bgCard, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic", marginBottom:10 }}>
                Noch keine Empfehlungen von anderen Mitgliedern.
              </div>
              <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.5 }}>
                Empfehlungen entstehen, wenn andere Mitglieder deine Arbeit weiterempfehlen.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ margin:`0 ${T.px}px`, padding:"20px 16px", borderRadius:T.r16,
            background:T.bgCard, border:`1px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>💬</div>
            <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic" }}>
              Dieses Talent hat noch keine Kundenstimmen erhalten.
            </div>
          </div>
        )
      ) : (
        <div className="rs-hscroll" style={{ display:"flex", gap:12, padding:`0 ${T.px}px 4px` }}>
          {recommendations.slice(0,5).map((rec,i) => (
            <div key={rec.id||i} style={{ flexShrink:0, width:210,
              background:T.bgCard, borderRadius:T.r16,
              border:`1px solid ${T.border}`, padding:"14px 16px", boxShadow:T.card }}>
              {rec.rating > 0 && <Stars rating={rec.rating}/>}
              <div style={{ fontSize:22, color:T.teal, marginBottom:6 }}>❝</div>
              <div style={{ fontSize:13, color:T.ink, lineHeight:1.55, fontStyle:"italic", marginBottom:10 }}>
                {rec.text || rec.message || ""}
              </div>
              {rec.work_title && (
                <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:6 }}>
                  zum Werk: {rec.work_title}
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {rec.avatar_url && (
                  <img src={rec.avatar_url} alt="" style={{ width:24, height:24,
                    borderRadius:"50%", objectFit:"cover" }}/>
                )}
                <div style={{ fontSize:11.5, color:T.inkFaint, fontWeight:600 }}>
                  — {rec.reviewer_name || rec.recommender_name || "Mitglied"}
                </div>
              </div>
            </div>
          ))}

          {/* Hinzufügen — Owner */}
          {isOwner && (
            <div className="rs-press" onClick={onAddRec} style={{
              flexShrink:0, display:"flex", alignItems:"center", gap:6,
              padding:"10px 16px", borderRadius:T.r16,
              background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
              fontSize:12.5, fontWeight:600, color:T.inkSoft,
              cursor:"pointer", touchAction:"manipulation", alignSelf:"flex-start",
            }}>
              <span style={{ fontSize:16 }}>+</span> Weitere hinzufügen
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default RecommendationsSection;
