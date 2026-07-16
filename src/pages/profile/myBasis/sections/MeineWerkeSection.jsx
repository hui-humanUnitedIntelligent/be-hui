import React from "react";
import { supabase } from "../../../../lib/supabaseClient.js";
import { T } from "../tokens.js";
import { SectionRow } from "../components/primitives.jsx";
import { DeleteWerkConfirm } from "../dialogs/DeleteWerkConfirm.jsx";
export function MeineWerkeSection({ works, onWerkWizard, onDeleteWerk = () => {} }) {
  const [confirmWork, setConfirmWork] = React.useState(null);

  const handleDeleteClick = (e, w) => {
    e.stopPropagation();
    setConfirmWork(w);
  };

  const handleConfirmDelete = async () => {
    const w = confirmWork;
    setConfirmWork(null);
    if (!w?.id) return;
    try {
      await supabase.from("works").update({ status: "deleted", visibility: "private" }).eq("id", w.id);
      onDeleteWerk(w.id);
    } catch(e) { console.error("Werk löschen:", e); }
  };

  return (
    <>
    {confirmWork && (
      <DeleteWerkConfirm
        werk={confirmWork}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmWork(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Meine Werke" sub="Deine veröffentlichten Kreationen."/>
      {works.length > 0 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none",
          paddingBottom:4, marginBottom:8 }}>
          {works.map((w, i) => {
            const isApproved = w.approval_status === "approved";
            const isPending  = w.approval_status === "pending" || w.status === "pending_review";
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? "✅ Live" : isPending ? "⏳ Prüfung" : "❌ Abgelehnt";
            return (
              <div key={w.id || i}
                onClick={() => onWerkWizard?.(w)}
                style={{
                  flexShrink:0, width:88, height:88,
                  borderRadius:T.r12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : "0 0 0 2px #ff5050",
                }}>
                {w.cover_url
                  ? <img loading="lazy" decoding="async" src={w.cover_url} alt={w.title||""}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:24 }}>🎨</div>
                }
                {/* X-Löschen-Button oben rechts */}
                <button
                  onClick={(e) => handleDeleteClick(e, w)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight:700,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                {/* Status-Badge */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight:700, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  {badgeText}
                </div>
                {/* Titel */}
                {w.title && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0,
                    background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                    padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {w.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button className="mbp-press-light" onClick={() => onWerkWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:T.r12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:12.5, fontWeight:700, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
        }}>+</span>
        Werk hinzufügen
      </button>
    </div>
    </>
  );
}
