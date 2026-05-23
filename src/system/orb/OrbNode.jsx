import { IX } from "../../design/hui.interaction.js";
// src/system/orb/OrbNode.jsx
// ═══════════════════════════════════════════════════════════════
// HUI ORB — Einzelner Node
//
// Position: via posLeft/posTop Props — NIEMALS über CSS-Variablen.
// SIZE: immer 62px — kein Größensprung bei active-State.
// Active: nur visuell (glow + border) — kein layout-shift.
// Decorator-Layer: alle pointer-events:none.
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { Z, T, NODE_SIZE } from "./OrbConfig.js";

export function OrbNode({
  node,
  idx,
  active   = false,
  dimmed   = false,
  locked   = false,
  isTransitioning = false,
  posLeft  = 0,
  posTop   = 0,
  onTap,
}) {
  const SIZE = NODE_SIZE; // 62px — konstant, niemals ändern
  const FONT = 23;

  const canInteract = !locked && !isTransitioning;

  return (
    <div
      className="orb-tap"
      onClick={() => canInteract && onTap?.(node)}
      style={{
        position:"absolute",
        // Direkte pixel-genaue Position — kein CSS-Var-Konflikt
        left:`calc(50% + ${posLeft}px)`,
        top: `calc(50% + ${posTop}px)`,
        width:SIZE, height:SIZE,
        // Entry: einfaches ease-out, kein Bounce
        // Float: nur translateY — Position wird nie verändert
        animation:[
          `huiOrbNodeIn 0.38s ease-out ${node.delay}s both`,
          `${node.floatAnim} ${3.8 + idx * 0.4}s ease-in-out ${node.delay + 0.5}s infinite`,
        ].join(", "),
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"flex-start",
        zIndex: active ? Z.activeNode : Z.nodes,
        opacity: locked ? 0.28 : dimmed ? 0.20 : 1,
        filter:  locked ? "grayscale(0.55)" : "none",
        transition:"opacity 0.22s ease",
        // Pointer-Events: nur wenn interaktiv
        pointerEvents: canInteract ? "auto" : "none",
      }}
    >
      {/* Glow-Halo — dekorativ, kein pointer-events */}
      <div style={{
        position:"absolute", inset:-10, borderRadius:"50%",
        background:`radial-gradient(circle, ${node.glow}${active ? "0.18" : "0.04"}) 0%, transparent 68%)`,
        transition:"background 0.22s ease",
        pointerEvents:"none",
        zIndex:Z.background,
      }}/>

      {/* Glass-Kreis — feste Größe, nur visueller State */}
      <div style={{
        width:SIZE, height:SIZE, borderRadius:"50%", flexShrink:0,
        // Active: subtiler farbiger Gradient
        background: active
          ? `linear-gradient(145deg, ${node.color}1a 0%, ${node.color}08 100%)`
          : T.glass,
        backdropFilter:"blur(20px) saturate(1.3)",
        WebkitBackdropFilter:"blur(20px) saturate(1.3)",
        border: active
          ? `2px solid ${node.color}60`
          : `1.5px solid ${T.glassBorder}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:FONT,
        // Nur shadow + border transitionen — kein scale, kein layout
        boxShadow: active
          ? [
              `0 0 0 3px ${node.glow}0.09)`,
              `0 7px 22px ${node.glow}0.20)`,
              `inset 0 1px 0 rgba(255,255,255,0.92)`,
            ].join(",")
          : [
              `0 4px 14px rgba(0,0,0,0.05)`,
              `inset 0 1px 0 rgba(255,255,255,0.95)`,
            ].join(","),
        transition:"background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
        position:"relative", zIndex:1,
      }}>
        {node.icon}
        {/* Glass-Highlight — dekorativ */}
        <div style={{
          position:"absolute", top:8, left:10, width:15, height:7,
          borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(255,255,255,0.62) 0%, transparent 100%)",
          filter:"blur(2px)", transform:"rotate(-18deg)",
          pointerEvents:"none",
        }}/>
      </div>

      {/* Label */}
      <div style={{
        marginTop:6, fontSize:10, fontWeight:700, lineHeight:1.25,
        color: active ? node.color : T.ink2,
        textAlign:"center",
        transition:"color 0.22s ease",
        whiteSpace:"nowrap",
        letterSpacing:0.15,
        pointerEvents:"none",
        userSelect:"none",
      }}>
        {node.label}
        {locked && (
          <div style={{ fontSize:9, color:T.ink3, fontWeight:500, marginTop:1 }}>
            Talent
          </div>
        )}
      </div>
    </div>
  );
}
