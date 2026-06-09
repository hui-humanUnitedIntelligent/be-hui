// src/components/profile/sections/WorksSection.jsx
// ══════════════════════════════════════════════════════════════════════
// WORKS SECTION — Meine Werke
// Owner: Scroller + approval_status Badge + Löschen + WerkWizard
// Visitor: Scroller read-only. Empty-State statt null.
// Filter: Visitor sieht nur approved/published. Owner sieht alle.
// ══════════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient.js";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)", borderMid:"rgba(26,26,24,0.14)",
  border:"rgba(26,26,24,0.08)", r12:12, r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

function Sk({ w, h, r=8 }) {
  return <div style={{ width:w, height:h, borderRadius:r, flexShrink:0,
    background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
    backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>;
}

function DeleteConfirm({ werk, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position:"fixed", inset:0, zIndex:9999,
      background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16,
        padding:"24px 20px 20px", maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}>🗑️</div>
        <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:T.ink }}>
          Werk unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{werk.title || "Dieses Werk"}"</strong> wird dauerhaft gelöscht.
        </div>
        <button onClick={onConfirm} style={{ width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff", fontSize:14, fontWeight:700,
          cursor:"pointer", fontFamily:"inherit", marginBottom:8 }}>
          Ja, endgültig löschen
        </button>
        <button onClick={onCancel} style={{ width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444", fontSize:14, fontWeight:600,
          cursor:"pointer", fontFamily:"inherit" }}>Abbrechen</button>
      </div>
    </div>
  );
}

export function WorksSection({
  works      = [],
  profile    = null,
  isOwner    = false,
  loading    = false,
  onAddWork  = null,   // () => void  — öffnet WerkWizard
  onDeleteWork = null, // (id) => void
  onShowAll  = null,   // () => void
}) {
  const [confirmWork, setConfirmWork] = useState(null);
  // ── SPRINT E.3 TRACE ──────────────────────────────────────────
  console.log('[E3] BEFORE FILTER — works eingehend:', works?.length, '| isOwner:', isOwner);
  if (works?.length > 0) {
    console.log('[E3] BEFORE FILTER — alle status+approval_status:', works.map(w => ({ id: w.id, status: w.status, approval_status: w.approval_status })));
  }
  // ── END E.3 TRACE ─────────────────────────────────────────────

  // Visitor: nur freigegebene Werke
  const visible = isOwner
    ? works
    : works.filter(w => w.approval_status === "approved" || w.status === "published" || w.status === "approved");

  // ── SPRINT E.3 TRACE ──────────────────────────────────────────
  console.log('[E3] AFTER FILTER — visible:', visible?.length);
  if (visible?.length === 0 && works?.length > 0) {
    console.warn('[E3] ⚠ VERLUST-PUNKT WorksSection Filter — alle', works.length, 'Werke eliminiert!');
    console.log('[E3] VERLUST-DETAIL:', works.map(w => ({ id: w.id, status: w.status, approval_status: w.approval_status })));
  }
  // ── END E.3 TRACE ─────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    const w = confirmWork;
    setConfirmWork(null);
    if (!w?.id) return;
    try {
      await supabase.from("works").update({ status:"deleted", visibility:"private" }).eq("id", w.id);
      onDeleteWork?.(w.id);
    } catch(e) { console.error("[WorksSection] delete:", e); }
  };

  if (loading) {
    return (
      <div>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.ws-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.ws-hscroll::-webkit-scrollbar{display:none}`}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`0 ${T.px}px`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>Meine Werke</div>
        </div>
        <div className="ws-hscroll" style={{ display:"flex", gap:10, padding:`0 ${T.px}px 4px` }}>
          {[1,2,3,4,5].map(i => <Sk key={i} w={100} h={100} r={T.r16}/>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.ws-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.ws-hscroll::-webkit-scrollbar{display:none}.ws-press{-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}.ws-press:active{opacity:.65}`}</style>

      {confirmWork && (
        <DeleteConfirm werk={confirmWork} onConfirm={handleConfirmDelete} onCancel={() => setConfirmWork(null)}/>
      )}

      <div>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`0 ${T.px}px`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
            Meine Werke
          </div>
          {visible.length > 0 && onShowAll && (
            <button onClick={onShowAll} style={{ background:"none", border:"none", padding:0,
              fontSize:12, fontWeight:600, color:T.teal, cursor:"pointer", fontFamily:"inherit" }}>
              Alle ansehen ›
            </button>
          )}
        </div>

        {/* Content */}
        {visible.length === 0 ? (
          isOwner ? (
            /* Owner Empty State */
            <div style={{ margin:`0 ${T.px}px` }}>
              <button onClick={onAddWork} style={{
                width:"100%", padding:"20px 16px", borderRadius:T.r16,
                background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
                display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
              }}>
                <span style={{ fontSize:24 }}>🎨</span>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>Erstes Werk veröffentlichen</div>
                <div style={{ fontSize:12, color:T.inkFaint }}>Teile deine Arbeit mit der Gemeinschaft</div>
              </button>
            </div>
          ) : (
            /* Visitor Empty State */
            <div style={{ margin:`0 ${T.px}px`, padding:"20px 16px", borderRadius:T.r16,
              background:T.bgCard, border:`1px solid ${T.border}`, textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:6 }}>🎨</div>
              <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic" }}>
                Dieses Talent hat noch keine Werke veröffentlicht.
              </div>
            </div>
          )
        ) : (
          <div className="ws-hscroll" style={{ display:"flex", gap:10, padding:`0 ${T.px}px 4px` }}>
            {visible.slice(0,8).map((w, i) => {
              const isApproved = w.approval_status === "approved";
              const isPending  = w.approval_status === "pending" || w.status === "pending_review";
              const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending
                ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
              const badgeLabel = isApproved ? "✓ Freigegeben" : isPending ? "⏳ Prüfung" : "⚠️";

              return (
                <div key={w.id || i} className="ws-press" style={{
                  flexShrink:0, width:100, position:"relative", cursor: isOwner ? "pointer" : "default",
                }}>
                  <div style={{ width:100, height:100, borderRadius:T.r16, overflow:"hidden",
                    background:"linear-gradient(135deg,#2C3B2D,#4A6741)", boxShadow:T.card }}>
                    {w.cover_url
                      ? <img src={w.cover_url} alt={w.title||""} style={{ width:"100%",height:"100%",objectFit:"cover" }}
                          onError={e=>e.target.style.display="none"}/>
                      : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",
                          justifyContent:"center",fontSize:24 }}>🎨</div>}
                  </div>

                  {/* approval Badge — nur Owner */}
                  {isOwner && (
                    <div style={{ position:"absolute", top:4, left:4,
                      background:badgeBg, color:"white",
                      fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:99,
                      backdropFilter:"blur(4px)" }}>
                      {badgeLabel}
                    </div>
                  )}

                  {/* Löschen-Button — nur Owner */}
                  {isOwner && (
                    <button className="ws-press"
                      onClick={e => { e.stopPropagation(); setConfirmWork(w); }}
                      style={{ position:"absolute", top:4, right:4,
                        width:22, height:22, borderRadius:"50%",
                        background:"rgba(26,26,24,0.55)", border:"none",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, cursor:"pointer", color:"white" }}>
                      ×
                    </button>
                  )}

                  <div style={{ fontSize:11, fontWeight:600, color:T.ink, marginTop:5,
                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                    {w.title || "Werk"}
                  </div>
                </div>
              );
            })}

            {/* Hinzufügen — nur Owner */}
            {isOwner && (
              <div style={{ flexShrink:0, width:100, display:"flex", flexDirection:"column",
                alignItems:"center" }}>
                <button className="ws-press" onClick={onAddWork} style={{
                  width:100, height:100, borderRadius:T.r16,
                  background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
                  display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", gap:4, cursor:"pointer", fontFamily:"inherit",
                }}>
                  <span style={{ fontSize:22, color:T.inkFaint }}>+</span>
                </button>
                <div style={{ fontSize:10.5, color:T.inkFaint, textAlign:"center", marginTop:5 }}>
                  Werk hinzufügen
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
export default WorksSection;
