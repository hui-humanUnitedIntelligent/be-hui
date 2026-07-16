import React from "react";
import { T, S } from "../tokens.js";
import { fmtEur, safeNum } from "../utils.js";

export function GemeinsamErmoegicht({ finanziert, transp }) {
  return (
    <div style={{ padding:"20px 16px 0" }}>
      {/* Titel + Link */}
      <div style={{ display:"flex", alignItems:"baseline",
        justifyContent:"space-between", marginBottom:4 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:T.ink,
          letterSpacing:"-0.02em" }}>Gemeinsam ermöglicht</h2>
        {finanziert.length > 0 && (
          <span style={{ fontSize:11, color:T.teal, fontWeight:700, cursor:"pointer",
            flexShrink:0, marginLeft:8 }}>
            Alle {finanziert.length} ansehen →
          </span>
        )}
      </div>
      <p style={{ margin:"0 0 14px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
        Echte Projekte. Echte Wirkung. Durch euch.
      </p>

      {/* Transparenz-Zahlen */}
      {!transp.loading && (transp.eur > 0 || transp.projekte > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
          gap:10, marginBottom:20 }}>
          {[
            { emoji:"💰", val:fmtEur(transp.eur),  label:"in Projekte geflossen" },
            { emoji:"📋", val:transp.projekte,       label:"Projekte finanziert"   },
            { emoji:"👥", val:transp.menschen,       label:"Unterstützer aktiv"    },
          ].map((st, i) => (
            <div key={i} style={{
              background:T.surfaceHi, borderRadius:16, padding:"14px 10px",
              boxShadow:S.card, border:`1px solid ${T.line}`, textAlign:"center",
            }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{st.emoji}</div>
              <div style={{ fontSize:16, fontWeight:900, color:T.teal,
                letterSpacing:"-0.02em" }}>{st.val}</div>
              <div style={{ fontSize:9, color:T.muted, marginTop:3, lineHeight:1.3 }}>{st.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Finanzierte Projekte */}
      {finanziert.length === 0 ? (
        <div style={{
          background:`linear-gradient(135deg,${T.teal}10,${T.teal}04)`,
          border:`1.5px solid ${T.teal}22`,
          borderRadius:20, padding:"24px 20px",
        }}>
          <div style={{ fontSize:32, marginBottom:10, textAlign:"center" }}>💚</div>
          <div style={{ fontSize:14, fontWeight:800, color:T.ink, marginBottom:10, textAlign:"center" }}>
            Die ersten Projekte werden bald gemeinsam finanziert.
          </div>
          {/* Beispiel-Wirkungskarten (Vorschau wie es aussehen wird) */}
          {[
            { name:"Repair Café Altona", month:"März 2026",
              lines:["340 Geräte repariert","120 Menschen geholfen","18 Ehrenamtliche aktiv"], icon:"🔧" },
            { name:"Musik verbindet", month:"Februar 2026",
              lines:["42 Kinder erhalten Unterricht","3 neue Kurse gestartet","Selbstvertrauen gestärkt"], icon:"🎵" },
          ].map((ex, ei) => (
            <div key={ei} style={{
              background:"rgba(255,255,255,0.55)", backdropFilter:"blur(6px)",
              borderRadius:14, padding:"12px 14px", marginBottom:8,
              border:`1px solid ${T.teal}15`, opacity:0.72,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:20 }}>{ex.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>{ex.name}</div>
                  <div style={{ fontSize:10, color:T.muted }}>Finanziert im {ex.month} · Beispiel</div>
                </div>
              </div>
              {ex.lines.map((l, li) => (
                <div key={li} style={{ display:"flex", gap:6, fontSize:11, color:T.ink2,
                  marginBottom:3, alignItems:"center" }}>
                  <span style={{ color:T.teal, fontSize:10 }}>✔</span><span>{l}</span>
                </div>
              ))}
            </div>
          ))}
          <p style={{ fontSize:11, color:T.muted, lineHeight:1.6, margin:"10px 0 0",
            textAlign:"center" }}>
            So sehen finanzierte Wirkungsprojekte später aus.
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {finanziert.map((p, i) => (
            <div key={p.id} style={{
              background:T.surfaceHi, borderRadius:20,
              boxShadow:S.card, border:`1px solid ${T.line}`,
              display:"flex", alignItems:"center", gap:0, overflow:"hidden",
              animation:"ipFade 0.32s ease both", animationDelay:`${i*0.05}s`,
            }}>
              {/* Bild */}
              <div style={{ width:80, height:80, flexShrink:0,
                background:`${p.color||T.teal}12`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:34 }}>
                {p.img_url
                  ? <img loading="lazy" decoding="async" src={p.img_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  : (p.icon || "🌱")
                }
              </div>
              {/* Info */}
              <div style={{ flex:1, padding:"12px 16px" }}>
                {/* Titel + Datum */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:T.ink, lineHeight:1.3,
                    marginBottom:1 }}>{p.name}</div>
                  {p.distributed_at && (
                    <div style={{ fontSize:10, color:T.muted }}>
                      Finanziert {fmtMonth(p.distributed_at?.slice(0,7))}
                    </div>
                  )}
                </div>
                {/* Wirkungszeilen aus impact_report oder Fallback */}
                {Array.isArray(p.impact_report) && p.impact_report.length > 0
                  ? p.impact_report.slice(0, 3).map((line, li) => (
                    <div key={li} style={{ display:"flex", alignItems:"center", gap:5,
                      fontSize:11, color:T.ink2, lineHeight:1.45, marginBottom:2 }}>
                      <span style={{ color:T.teal, fontSize:10, flexShrink:0 }}>✔</span>
                      <span>{line}</span>
                    </div>
                  ))
                  : (
                    <div style={{ fontSize:12, fontWeight:700, color:T.teal, lineHeight:1.4 }}>
                      Gemeinsam ermöglicht
                      {p.awarded_eur > 0 && (
                        <span style={{ fontSize:10, color:T.muted, fontWeight:500,
                          marginLeft:6 }}>
                          {fmtEur(p.awarded_eur)}
                        </span>
                      )}
                    </div>
                  )
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. HERZENSPROJEKT — EMOTIONAL
// ════════════════════════════════════════════════════════════════
