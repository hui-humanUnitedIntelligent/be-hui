// src/system/orb/OrbHintCard.jsx
// ═══════════════════════════════════════════════════════════════
// HUI ORB — Cards & Sheets
//
// Drei Komponenten:
//   OrbHintBar    — erscheint wenn Node aktiv, zeigt Quick-CTA
//   OrbDetailCard — Bottom-Sheet mit Sub-Items für Werk/Erlebnis
//   OrbImpactDetail — zeremonielle Impact-Einreichung
//
// Alle haben: pointer-events:auto nur auf interaktiven Elementen.
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { Z, T, IMPACT_STEPS } from "./OrbConfig.js";

/* ── Hint Bar ─────────────────────────────────────────────────── */
export function OrbHintBar({ node, onOpen }) {
  if (!node) return null;
  return (
    <div style={{
      position:"fixed",
      bottom:"calc(max(32px,env(safe-area-inset-bottom,32px)) + 8px)",
      left:"50%",
      transform:"translateX(-50%)",
      zIndex:Z.hints,
      background:"rgba(255,255,255,0.90)",
      backdropFilter:"blur(24px) saturate(1.6)",
      WebkitBackdropFilter:"blur(24px) saturate(1.6)",
      borderRadius:22,
      padding:"12px 18px",
      border:`1.5px solid ${node.color}28`,
      boxShadow:[
        "0 8px 28px rgba(0,0,0,0.07)",
        `0 0 0 1px ${node.glow}0.10)`,
      ].join(","),
      display:"flex", alignItems:"center", gap:12,
      animation:"orbHintIn 0.26s ease-out both",
      whiteSpace:"nowrap",
      pointerEvents:"auto",
    }}>
      <span style={{ fontSize:18, pointerEvents:"none" }}>{node.icon}</span>
      <div style={{ pointerEvents:"none" }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:T.ink,
          letterSpacing:-0.3 }}>{node.label}</div>
        <div style={{ fontSize:11, color:T.ink3, marginTop:1 }}>{node.desc}</div>
      </div>
      <button className="orb-tap" onClick={onOpen} style={{
        background:`linear-gradient(135deg, ${node.color}, ${node.dark})`,
        border:"none", borderRadius:14, padding:"8px 15px",
        fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer",
        boxShadow:`0 4px 12px ${node.glow}0.28)`,
        marginLeft:4,
        pointerEvents:"auto",
      }}>
        Öffnen →
      </button>
    </div>
  );
}

/* ── Detail Card (Bottom Sheet) ─────────────────────────────── */
export function OrbDetailCard({ node, isTalent, onAction, onClose }) {
  if (!node) return null;
  const locked = !node.forAll && !isTalent;
  return (
    <div
      style={{
        position:"fixed", inset:0, zIndex:Z.overlays,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"flex-end",
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(245,243,255,0.70)",
        backdropFilter:"blur(16px) saturate(1.4)",
        WebkitBackdropFilter:"blur(16px) saturate(1.4)",
        pointerEvents:"none",
      }}/>

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:460, position:"relative",
          background:"rgba(255,255,255,0.98)",
          borderRadius:"30px 30px 0 0",
          padding:"0 0 max(30px,env(safe-area-inset-bottom,30px))",
          boxShadow:"0 -10px 44px rgba(0,0,0,0.07), 0 -2px 10px rgba(0,0,0,0.03)",
          animation:"orbSheetUp 0.36s cubic-bezier(0.32,0.72,0,1) both",
          overflow:"hidden",
          border:`1.5px solid ${node.color}18`,
          borderBottom:"none",
        }}
      >
        {/* Header */}
        <div style={{
          height:110, position:"relative",
          background:`linear-gradient(160deg, ${node.color}0d 0%, rgba(255,255,255,0) 100%)`,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:6,
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:`radial-gradient(circle at 50% 100%, ${node.glow}0.10) 0%, transparent 65%)`,
            pointerEvents:"none",
          }}/>
          <button className="orb-tap" onClick={onClose} style={{
            position:"absolute", top:14, right:18,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color:T.ink3, cursor:"pointer",
          }}>✕</button>
          <div style={{
            width:50, height:50, borderRadius:"50%",
            background:`linear-gradient(145deg, ${node.color}, ${node.dark})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, position:"relative", zIndex:2,
            boxShadow:`0 5px 18px ${node.glow}0.28)`,
          }}>{node.icon}</div>
          <div style={{ fontSize:16, fontWeight:900, color:T.ink,
            letterSpacing:-0.4, zIndex:2 }}>{node.label}</div>
          <div style={{ fontSize:11.5, color:T.ink2, zIndex:2,
            textAlign:"center", padding:"0 28px", lineHeight:1.5 }}>
            {node.desc}
          </div>
        </div>

        {/* Locked Badge */}
        {locked && (
          <div style={{
            margin:"14px 20px 0",
            background:"rgba(245,158,11,0.07)",
            borderRadius:14, padding:"10px 14px",
            border:"1px solid rgba(245,158,11,0.20)",
            display:"flex", gap:8, alignItems:"center",
          }}>
            <span style={{ fontSize:18 }}>🌱</span>
            <div style={{ fontSize:12, color:"#92400E", lineHeight:1.5 }}>
              Werde HUI Wirker, um diesen Bereich zu nutzen.
            </div>
          </div>
        )}

        {/* Sub-Items */}
        <div style={{ padding:"12px 20px 0" }}>
          {node.sub.map((item, i) => (
            <button key={item.key} className="orb-tap"
              onClick={() => !locked && onAction(item.key)}
              disabled={locked}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:12,
                padding:"10px 12px", borderRadius:13, border:"none",
                background: i % 2 === 0 ? `${node.color}06` : "transparent",
                cursor: locked ? "default" : "pointer",
                opacity: locked ? 0.38 : 1, marginBottom:3,
              }}>
              <div style={{
                width:35, height:35, borderRadius:10, flexShrink:0,
                background:`${node.color}12`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
              }}>{item.icon}</div>
              <span style={{ fontSize:13.5, fontWeight:600,
                color:T.ink, textAlign:"left" }}>{item.label}</span>
              <span style={{ marginLeft:"auto", fontSize:14, color:T.ink4 }}>›</span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding:"14px 20px 0" }}>
          {locked ? (
            <button className="orb-tap"
              onClick={() => onAction("membership")}
              style={{
                width:"100%", height:50, borderRadius:17, border:"none",
                background:`linear-gradient(135deg,${T.teal},${T.tealD})`,
                color:"#fff", fontSize:14.5, fontWeight:800, cursor:"pointer",
                boxShadow:`0 6px 20px rgba(10,191,184,0.26)`,
              }}>Wirker werden →</button>
          ) : (
            <button className="orb-tap"
              onClick={() => onAction(node.action)}
              style={{
                width:"100%", height:50, borderRadius:17, border:"none",
                background:`linear-gradient(135deg,${node.color},${node.dark})`,
                color:"#fff", fontSize:14.5, fontWeight:800, cursor:"pointer",
                boxShadow:`0 6px 20px ${node.glow}0.26)`,
              }}>{node.ctaLabel} →</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Impact Detail ──────────────────────────────────────────── */
export function OrbImpactDetail({ onAction, onClose }) {
  return (
    <div
      style={{
        position:"fixed", inset:0, zIndex:Z.overlays,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"flex-end",
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(255,248,242,0.78)",
        backdropFilter:"blur(20px) saturate(1.5)",
        WebkitBackdropFilter:"blur(20px) saturate(1.5)",
        pointerEvents:"none",
      }}/>
      {/* Coral glow */}
      <div style={{
        position:"absolute", left:"50%", top:"38%",
        transform:"translate(-50%,-50%)",
        width:340, height:260,
        background:"radial-gradient(ellipse, rgba(251,146,60,0.13) 0%, transparent 68%)",
        animation:"orbImpactGlow 4s ease-in-out infinite",
        filter:"blur(20px)",
        pointerEvents:"none",
      }}/>

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:480, position:"relative",
          background:"rgba(255,255,255,0.98)",
          borderRadius:"32px 32px 0 0",
          padding:"0 0 max(32px,env(safe-area-inset-bottom,32px))",
          border:"1.5px solid rgba(251,146,60,0.14)",
          borderBottom:"none",
          boxShadow:"0 -14px 52px rgba(251,146,60,0.09), 0 -3px 16px rgba(0,0,0,0.05)",
          animation:"orbSheetUp 0.40s cubic-bezier(0.32,0.72,0,1) both",
          overflow:"hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding:"24px 24px 16px",
          borderBottom:"1px solid rgba(251,146,60,0.07)",
          textAlign:"center", position:"relative",
          background:"linear-gradient(180deg, rgba(251,146,60,0.04) 0%, transparent 100%)",
        }}>
          <button className="orb-tap" onClick={onClose} style={{
            position:"absolute", top:18, right:20,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, color:T.ink3, cursor:"pointer",
          }}>✕</button>
          <div style={{
            width:62, height:62, borderRadius:"50%",
            background:`linear-gradient(135deg,${T.coral},${T.coralD})`,
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            fontSize:28, marginBottom:10,
            boxShadow:`0 7px 24px rgba(251,146,60,0.32)`,
          }}>❤️</div>
          <div style={{ fontSize:20, fontWeight:900, color:T.ink,
            letterSpacing:-0.5, marginBottom:5 }}>Wirkung starten</div>
          <div style={{ fontSize:12.5, color:T.ink2,
            lineHeight:1.6, padding:"0 20px" }}>
            Reiche eine Vision ein, die Menschen und die Welt bewegt.
          </div>
        </div>

        {/* HUI Hinweis */}
        <div style={{
          margin:"12px 22px 0",
          background:"rgba(251,146,60,0.06)",
          borderRadius:13, padding:"10px 14px",
          border:"1px solid rgba(251,146,60,0.12)",
          display:"flex", gap:10, alignItems:"center",
        }}>
          <span style={{ fontSize:16 }}>🌿</span>
          <div style={{ fontSize:11.5, color:T.ink2, lineHeight:1.5 }}>
            Einreichungen werden vom HUI Team geprüft. Creator mit echter Wirkung erhalten schneller Zugang.
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding:"12px 22px 0" }}>
          {IMPACT_STEPS.map((s, i) => (
            <div key={i} style={{ display:"flex", gap:11, marginBottom:11 }}>
              <div style={{
                width:33, height:33, borderRadius:10, flexShrink:0,
                background:"rgba(251,146,60,0.09)",
                border:"1px solid rgba(251,146,60,0.16)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>{s.title}</div>
                <div style={{ fontSize:11.5, color:T.ink3, lineHeight:1.4, marginTop:1 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ padding:"12px 22px 0", display:"flex", flexDirection:"column", gap:9 }}>
          <button className="orb-tap" onClick={() => onAction("idee")} style={{
            width:"100%", height:50, borderRadius:17, border:"none",
            background:`linear-gradient(135deg,${T.coral},${T.coralD})`,
            color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
            boxShadow:`0 7px 24px rgba(251,146,60,0.32)`,
          }}>
            Vision einreichen →
          </button>
          <button className="orb-tap" onClick={() => onAction("wirkraum")} style={{
            width:"100%", height:43, borderRadius:13, border:"none",
            background:"rgba(251,146,60,0.06)",
            color:T.ink2, fontSize:13, fontWeight:600, cursor:"pointer",
          }}>
            Wirkungsraum entdecken
          </button>
        </div>
      </div>
    </div>
  );
}
