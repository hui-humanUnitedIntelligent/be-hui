// src/components/profile/sections/WorksSection.jsx
// ══════════════════════════════════════════════════════════════════════
// WORKS SECTION — Meine Werke
// Owner: Scroller + approval_status Badge + Löschen + WerkWizard
// Visitor: Scroller read-only. Empty-State statt null.
// Filter: Visitor sieht nur approved/published. Owner sieht alle.
// ══════════════════════════════════════════════════════════════════════
import { HUIWerkeIcon, HUIWarnIcon } from '../../../design/icons/HuiSystemIcons.jsx';
import { HUILogo } from '../../brand/HUILogo.jsx';
import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient.js";
import { toast } from "../../../lib/useToast.jsx";
import { optimizeCard } from "../../../lib/perfUtils.js";
import { createPortal } from "react-dom";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx"; // OPEN.2 2026-07-08
import { normalizePostForPreview } from "../../../lib/previewNormalizers.js";
import { useModalRegistration } from "../../../hooks/useModalRegistration.js";

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
  return createPortal(
    <div onClick={onCancel} style={{ position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16,
        padding:"24px 20px 20px", maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ textAlign:"center", marginBottom:8, display:"flex", justifyContent:"center", color:"#F59E0B" }}><HUIWarnIcon size={36}/></div>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:T.ink }}>
          Werk unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{werk.title || "Dieses Werk"}"</strong> wird dauerhaft gelöscht.
        </div>
        <button onClick={onConfirm} style={{ width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff", fontSize:14, fontWeight: 600,
          cursor:"pointer", fontFamily:"inherit", marginBottom:8 }}>
          Ja, endgültig löschen
        </button>
        <button onClick={onCancel} style={{ width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444", fontSize:14, fontWeight:600,
          cursor:"pointer", fontFamily:"inherit" }}>Abbrechen</button>
      </div>
    </div>,
    document.body
  );
}

export function WorksSection({
  works      = [],
  profile    = null,
  isOwner    = false,
  loading    = false,
  saleStatus = {},   // WORK-SALE-STATUS-001: {workId: "verkauft"|"reserviert"}
  onAddWork  = null,   // () => void  — öffnet WerkWizard
  onDeleteWork = null, // (id) => void
  onShowAll  = null,   // () => void
}) {
  const [confirmWork, setConfirmWork] = useState(null);
  useModalRegistration(!!confirmWork, () => setConfirmWork(null), "WorksSection-DeleteConfirm");
  const { open: openPreview } = useContentPreview();
  // Visitor: nur freigegebene Werke
  const visible = isOwner
    ? works
    : works.filter(w => w.approval_status === "approved");

  const handleConfirmDelete = async () => {
    const w = confirmWork;
    setConfirmWork(null);
    if (!w?.id) return;
    try {
      // UNWIDERRUFLICH LOESCHEN (2026-08-18): HARD DELETE nur wenn keine
      // Käufe existieren. order_items referenziert item_id=work.id — ein
      // ungeprueftes Hard-Delete wuerde die Kaufshistorie (auch bezahlte
      // Werke) verwaisten lassen. Schutz: vorher zaehlen, bei Treffern
      // Soft-Delete (status='deleted', visibility='private') — Werk
      // verschwindet trotzdem sofort aus Feed/Entdecken (beide filtern
      // auf status != 'deleted'), die Kaufshistorie bleibt erhalten.
      const { count, error: countErr } = await supabase
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("item_id", w.id)
        .eq("item_type", "work");
      if (!countErr && count > 0) {
        console.warn(`Werk Hard-Delete blockiert — ${count} bestehende Kauf/Käufe gefunden. Fallback Soft-Delete.`);
        await supabase.from("works").update({ status: "deleted", visibility: "private" }).eq("id", w.id);
        toast.success("Werk wurde gelöscht (Kaufdaten geschützt).", { duration: 3000 });
      } else {
        // Hard-Delete: Zeile vollständig aus DB entfernen
        await supabase.from("works").delete().eq("id", w.id);
        toast.success("Werk wurde unwiderruflich gelöscht.", { duration: 3000 });
      }
      onDeleteWork?.(w.id);
    } catch(e) { console.error("[WorksSection] delete:", e); }
  };

  if (loading) {
    return (
      <div>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.ws-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.ws-hscroll::-webkit-scrollbar{display:none}`}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`0 ${T.px}px`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight: 600, color:T.ink }}>Meine Werke</div>
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
          <div style={{ fontSize:15, fontWeight: 600, color:T.ink, letterSpacing:"-0.02em" }}>
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
                <HUIWerkeIcon size={24} style={{color:"rgba(14,196,184,0.6)"}} />
                <div style={{ fontSize:13, fontWeight: 600, color:T.ink }}>Erstes Werk veröffentlichen</div>
                <div style={{ fontSize:12, color:T.inkFaint }}>Teile deine Arbeit mit der Gemeinschaft</div>
              </button>
            </div>
          ) : (
            /* Visitor Empty State */
            <div style={{ margin:`0 ${T.px}px`, padding:"20px 16px", borderRadius:T.r16,
              background:T.bgCard, border:`1px solid ${T.border}`, textAlign:"center" }}>
              <div style={{ marginBottom:6, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIWerkeIcon size={20}/></div>
              <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic" }}>
                Dieses Talent hat noch keine Werke veröffentlicht.
              </div>
            </div>
          )
        ) : (
          <div className="ws-hscroll" style={{ display:"flex", gap:10, padding:`0 ${T.px}px 4px` }}>
            {visible.slice(0,8).map((w, i) => {
              const isApproved  = w.approval_status === "approved";
              const isUpdate   = w.is_update === true && (w.approval_status === "pending" || w.status === "pending_review");
              const isPending  = !isUpdate && (w.approval_status === "pending" || w.status === "pending_review");
              const isRejected = w.approval_status === "rejected" || w.status === "rejected";
              const badgeBg    = isApproved ? "rgba(14,196,184,0.92)"
                : isUpdate   ? "rgba(99,102,241,0.92)"
                : isPending  ? "rgba(234,179,8,0.92)"
                : isRejected ? "rgba(255,80,80,0.92)"
                : "rgba(120,120,120,0.92)";
              const badgeLabel = isApproved ? "✅ Live"
                : isUpdate   ? "🔄 Update"
                : isPending  ? "⏳ Prüfung"
                : isRejected ? "❌ Abgelehnt"
                : "Entwurf";

              return (
                <div key={w.id || i} className="ws-press"
                  onClick={() => { const item = normalizePostForPreview(w, "work"); if (item) openPreview(item); }}
                  style={{
                  flexShrink:0, width:100, position:"relative", cursor:"pointer",
                }}>
                  {(() => {
                    const ss = saleStatus[w.id];
                    const isVerkauft   = ss === "verkauft";
                    const isReserviert = ss === "reserviert";
                    return (
                      <div style={{ width:100, height:100, borderRadius:T.r16, overflow:"hidden",
                        position:"relative", background:"linear-gradient(135deg,#2C3B2D,#4A6741)", boxShadow:T.card }}>
                        {w.cover_url
                          ? <img loading="lazy" decoding="async" src={optimizeCard(w.cover_url)} alt={w.title||""} style={{
                              width:"100%",height:"100%",objectFit:"cover",
                              // VERKAUFT-BILD-STEMPEL (2026-08-25, Michael-Feedback): Werk-Bild
                              // leicht gräulich + blurry, sobald verkauft — statt nur einer
                              // kleinen Ecken-Pille, damit auf den ersten Blick klar ist:
                              // dieses Werk ist nicht mehr verfügbar.
                              filter: isVerkauft ? "grayscale(0.55) blur(1.1px) brightness(0.8)" : "none",
                              transition:"filter 0.2s ease",
                            }}
                              onError={e=>{ e.target.style.display="none"; e.target.nextSibling?.style?.setProperty("display","flex"); }}/>
                          : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",
                              justifyContent:"center" }}><HUILogo size={36} style={{opacity:0.5}} /></div>}

                        {/* approval Badge — nur Owner */}
                        {isOwner && (
                          <div style={{ position:"absolute", top:4, left:4,
                            background:badgeBg, color:"white",
                            fontSize:9, fontWeight: 600, padding:"2px 6px", borderRadius:99,
                            backdropFilter:"blur(4px)" }}>
                            {badgeLabel}
                          </div>
                        )}

                        {/* WORK-SALE-STATUS-001: "Verkauft" direkt ins Bild gestempelt */}
                        {isVerkauft && (
                          <div style={{
                            position:"absolute", inset:0,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            background:"rgba(26,26,46,0.28)",
                          }}>
                            <span style={{
                              color:"#fff", fontSize:13, fontWeight:800,
                              letterSpacing:1.2, textTransform:"uppercase",
                              textShadow:"0 1px 4px rgba(0,0,0,0.55)",
                              border:"1.5px solid rgba(255,255,255,0.85)",
                              padding:"4px 10px", borderRadius:6,
                              transform:"rotate(-8deg)",
                            }}>
                              Verkauft
                            </span>
                          </div>
                        )}

                        {/* Reserviert-Badge bleibt als kleine Ecken-Pille (Kauf noch offen) */}
                        {isReserviert && (
                          <div style={{
                            position:"absolute", bottom:4, left:4,
                            background:"rgba(245,166,35,0.85)", color:"#fff",
                            fontSize:8.5, fontWeight:700, padding:"2px 7px", borderRadius:99,
                            letterSpacing:0.3, whiteSpace:"nowrap",
                            backdropFilter:"blur(4px)",
                          }}>
                            Reserviert
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
                      </div>
                    );
                  })()}

                  <div style={{ fontSize:11, fontWeight:600, color:T.ink, marginTop:5,
                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                    {w.title || "Werk"}
                  </div>
                  {saleStatus[w.id] === "reserviert" && (
                    <div style={{
                      fontSize:9.5, fontWeight:600,
                      color:"rgba(245,166,35,0.95)",
                      marginTop:1,
                    }}>
                      Reserviert
                    </div>
                  )}
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
