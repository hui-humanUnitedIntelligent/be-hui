import React from "react";
import { supabase } from "../../../../lib/supabaseClient.js";
import { T } from "../tokens.js";
import { SectionRow } from "../components/primitives.jsx";
export function ErlebnisseSection({ experiences, onErlebnisWizard, onDeleteErlebnis = () => {} }) {
  const [confirmExp, setConfirmExp] = React.useState(null);

  const handleDeleteClick = (e, exp) => {
    e.stopPropagation();
    setConfirmExp(exp);
  };

  const handleConfirmDelete = async () => {
    const exp = confirmExp;
    setConfirmExp(null);
    if (!exp?.id) return;
    try {
      const table = exp._source === "projects" ? "projects" : "experiences";
      // Hard-Delete: Zeile vollständig aus DB entfernen
      // → Realtime triggert Admin-Dashboard, Zeile verschwindet dort sofort
      const { error } = await supabase.from(table).delete().eq("id", exp.id);
      if (!error) {
        onDeleteErlebnis(exp.id);
      } else {
        console.error("Erlebnis löschen:", error);
        // Fallback: soft-delete wenn Hard-Delete nicht erlaubt (RLS)
        await supabase.from(table).update({ status: "deleted" }).eq("id", exp.id);
        onDeleteErlebnis(exp.id);
      }
    } catch(e) { console.error("Erlebnis löschen:", e); }
  };

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString("de-DE", { month:"short", year:"numeric" });
  }
  return (
    <>
    {confirmExp && (
      <div style={{
        position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
        background:"rgba(0,0,0,0.55)", display:"flex",
        alignItems:"center", justifyContent:"center", padding:"24px",
      }} onClick={() => setConfirmExp(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:16, padding:"24px 20px 20px",
          maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        }}>
          <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
            Erlebnis unwiderruflich löschen?
          </div>
          <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
            <strong>„{confirmExp.title || 'Dieses Erlebnis'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
          </div>
          <button onClick={handleConfirmDelete} style={{
            width:"100%", padding:"12px", borderRadius:99,
            background:"#ff3b3b", border:"none", color:"#fff",
            fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", marginBottom:8,
          }}>
            Ja, endgültig löschen
          </button>
          <button onClick={() => setConfirmExp(null)} style={{
            width:"100%", padding:"12px", borderRadius:99,
            background:"#f0f0ee", border:"none", color:"#444",
            fontSize:14, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit",
          }}>
            Abbrechen
          </button>
        </div>
      </div>
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Erlebnisse & Projekte"
        sub="Momente, die mein Wirken zeigen."/>

      <div style={{ display:"flex", gap:8, overflowX:"auto",
        WebkitOverflowScrolling:"touch", scrollbarWidth:"none", paddingBottom:4, marginBottom:8 }}>
        {experiences.map((exp, i) => {
          // ── Badge-System identisch zu Meine Werke ──────────────
          const isApproved = exp.approval_status === "approved" || exp.status === "published";
          const isPending  = !isApproved && (exp.approval_status === "pending" || exp.status === "pending_review" || exp.status === "pending");
          const isRejected = !isApproved && !isPending && (exp.approval_status === "rejected" || exp.status === "rejected");
          const badgeBg    = isApproved
            ? "rgba(14,196,184,0.92)"
            : isPending
              ? "rgba(234,179,8,0.92)"
              : isRejected
                ? "rgba(255,80,80,0.92)"
                : "rgba(14,196,184,0.92)";
          const badgeText  = isApproved
            ? "✅ Live"
            : isPending
              ? "⏳ Prüfung"
              : isRejected
                ? "❌ Abgelehnt"
                : "✅ Live";
          const borderCol  = isApproved ? "#0EC4B8" : isPending ? "#D4A800" : isRejected ? "#ff5050" : "#0EC4B8";
          return (
            <div key={exp.id || i}
              onClick={() => onErlebnisWizard?.(exp)}
              style={{
                flexShrink:0, width:88, height:88,
                borderRadius:T.r12, overflow:"hidden",
                background:"#e8e4de", position:"relative", cursor:"pointer",
                boxShadow: `0 0 0 2px ${borderCol}`,
              }}>
              {exp.cover_url
                ? <img loading="lazy" decoding="async" src={exp.cover_url} alt={exp.title||""}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:24 }}>🎟</div>
              }
              {/* X-Löschen-Button oben rechts */}
              <button
                onClick={(e) => handleDeleteClick(e, exp)}
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
              {/* Status-Badge unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background: badgeBg,
                fontSize:9, fontWeight:700, color:"#fff",
                padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
              }}>
                {badgeText}
              </div>
              {/* Titel oben */}
              {exp.title && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0,
                  background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                  padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {exp.title}
                </div>
              )}
              {/* Ablehnungsgrund Overlay + "Anpassen"-CTA */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0, bottom:0,
                  background:"rgba(255,80,80,0.08)",
                  pointerEvents:"none",
                }}/>
              )}
              {/* Anpassen-Hinweis bei abgelehnten Erlebnissen */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:"50%", left:0, right:0,
                  transform:"translateY(-50%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  pointerEvents:"none",
                }}>
                  <span style={{
                    background:"rgba(0,0,0,0.72)", color:"#fff",
                    fontSize:8, fontWeight:700, padding:"2px 7px",
                    borderRadius:20, letterSpacing:"0.3px",
                  }}>Anpassen</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    {/* ── Add-Button — EXAKT identisch zu "+ Werk hinzufügen" ── */}
    <div style={{ padding:`0 ${T.px}px` }}>
      <button className="mbp-press-light" onClick={() => onErlebnisWizard?.()} style={{
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
        Erlebnis &amp; Projekte hinzufügen
      </button>
    </div>
    </>
  );
}
