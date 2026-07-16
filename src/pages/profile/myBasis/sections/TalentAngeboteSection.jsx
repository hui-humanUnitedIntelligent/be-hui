import React from "react";
import { T } from "../tokens.js";
import { deleteTalent } from "../../../../hooks/useTalents.js";
import { SectionRow } from "../components/primitives.jsx";
import { DeleteTalentConfirm } from "../dialogs/DeleteTalentConfirm.jsx";
export function TalentAngeboteSection({ talents = [], onTalentWizard, onDeleteTalent = () => {} }) {
  const [confirmTalent, setConfirmTalent] = React.useState(null);

  const handleDeleteClick = (e, t) => {
    e.stopPropagation();
    setConfirmTalent(t);
  };

  const handleConfirmDelete = async () => {
    const t = confirmTalent;
    setConfirmTalent(null);
    if (!t?.id) return;
    try {
      await deleteTalent(t.id);
      onDeleteTalent(t.id);
    } catch(e) { console.error("Talent-Angebot löschen:", e); }
  };

  return (
    <>
    {confirmTalent && (
      <DeleteTalentConfirm
        talent={confirmTalent}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTalent(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Talent-Angebote" sub="Deine buchbaren Leistungen & Dienstleistungen"/>
      {talents.length > 0 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none",
          paddingBottom:4, marginBottom:8 }}>
          {talents.map((t, i) => {
            const isApproved = t.status === "approved";
            const isPending  = t.status === "pending";
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? "✅ Live" : isPending ? "⏳ Prüfung" : "❌ Abgelehnt";
            const cover = Array.isArray(t.images) && t.images[0]?.url;
            return (
              <div key={t.id || i}
                onClick={() => onTalentWizard?.(t)}
                style={{
                  flexShrink:0, width:88, height:88,
                  borderRadius:12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : "0 0 0 2px #ff5050",
                }}>
                {cover
                  ? <img loading="lazy" decoding="async" src={cover} alt={t.title||""}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:24 }}>💼</div>
                }
                <button
                  onClick={(e) => handleDeleteClick(e, t)}
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
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight:700, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  {badgeText}
                </div>
                {t.title && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0,
                    background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                    padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {t.title}
                  </div>
                )}
                {/* Preis-Hinweis (Master-Prompt 2026-07-05) — nur eine kompakte Zeile,
                    Sichtbarkeit fuer Dritte ohnehin ueber RLS (approved-only) geregelt */}
                {(t.price_per_hour || t.price_per_session) && (
                  <div style={{
                    position:"absolute", bottom:18, left:0, right:0,
                    background:"rgba(0,0,0,0.35)", fontSize:8.5, color:"#fff",
                    padding:"2px 5px", textAlign:"center", fontWeight:600,
                  }}>
                    {t.price_per_hour ? `${t.price_per_hour}€/Std` : `${t.price_per_session}€/Termin`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button className="mbp-press-light" onClick={() => onTalentWizard?.()} style={{
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
        Talent-Angebot hinzufügen
      </button>
    </div>
    </>
  );
}
