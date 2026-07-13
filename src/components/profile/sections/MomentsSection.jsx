// src/components/profile/sections/MomentsSection.jsx
// ══════════════════════════════════════════════════════════════════════
// MOMENTS SECTION — Momente (beitraege / Grid)
// Owner: Grid + Hinzufügen-Button
// Visitor: Read-only Grid. Empty-State statt null.
// ══════════════════════════════════════════════════════════════════════
import React from "react";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx"; // OPEN.2 2026-07-08
import { normalizePostForPreview } from "../../../lib/previewNormalizers.js";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkFaint:"#8C8C85", teal:"#0EC4B8",
  borderMid:"rgba(26,26,24,0.14)", border:"rgba(26,26,24,0.08)",
  r12:12, r16:16, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

function Sk({ w, h, r=8 }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
    backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>;
}

export function MomentsSection({
  moments    = [],
  isOwner    = false,
  loading    = false,
  onAddMoment = null,
}) {
  const { open: openPreview } = useContentPreview();
  if (loading) {
    return (
      <div style={{ padding:`0 ${T.px}px` }}>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, marginBottom:10 }}>Momente</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
          {[1,2,3,4,5,6].map(i => <Sk key={i} w="100%" h={90} r={T.r12}/>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.ms-press{-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}.ms-press:active{opacity:.65}`}</style>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>Momente</div>
        {isOwner && (
          <button onClick={onAddMoment} style={{ background:"none", border:"none", padding:0,
            fontSize:12, color:T.teal, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Hinzufügen ›
          </button>
        )}
      </div>

      {moments.length === 0 ? (
        isOwner ? (
          <button onClick={onAddMoment} style={{
            width:"100%", padding:"20px 16px", borderRadius:T.r16,
            background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
            display:"flex", flexDirection:"column", alignItems:"center", gap:6,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          }}>
            <span style={{ fontSize:24 }}>📸</span>
            <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>Ersten Moment teilen</div>
            <div style={{ fontSize:12, color:T.inkFaint }}>Bilder, die dein Wirken zeigen</div>
          </button>
        ) : (
          <div style={{ padding:"20px 16px", borderRadius:T.r16,
            background:T.bgCard, border:`1px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>📸</div>
            <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic" }}>
              Noch keine Momente geteilt.
            </div>
          </div>
        )
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
          {moments.slice(0,9).map((m,i) => (
            <div key={m.id||i} className="ms-press"
              onClick={() => { const item = normalizePostForPreview(m, "moment"); if (item) openPreview(item); }}
              style={{
              aspectRatio:"1", borderRadius:T.r12, overflow:"hidden",
              background:"#e8e4de", position:"relative", cursor:"pointer",
            }}>
              {m.src || m.media_url
                ? <img loading="lazy" decoding="async" src={m.src||m.media_url} alt=""
                    style={{ width:"100%",height:"100%",objectFit:"cover" }}
                    onError={e=>e.target.style.display="none"}/>
                : <div style={{ width:"100%",height:"100%",display:"flex",
                    alignItems:"center",justifyContent:"center",fontSize:20 }}>📸</div>
              }
            </div>
          ))}
          {/* Hinzufügen-Kachel — Owner */}
          {isOwner && moments.length < 9 && (
            <button className="ms-press" onClick={onAddMoment} style={{
              aspectRatio:"1", borderRadius:T.r12,
              background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:4, cursor:"pointer",
            }}>
              <span style={{ fontSize:18, color:T.inkFaint }}>+</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export default MomentsSection;
