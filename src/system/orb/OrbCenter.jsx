import { IX } from "../../design/hui.interaction.js";
// src/system/orb/OrbCenter.jsx
// ═══════════════════════════════════════════════════════════════
// HUI ORB — Zentrale Logo-Sphäre
//
// Nur visuelle Darstellung. Interaktion via onClick-Prop.
// Glass-Sphere: weißes Glas mit softem Teal-Aura.
// Orbit-Ringe: dekorativ, pointer-events:none.
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { Z, T } from "./OrbConfig.js";
import { orbAtmosphereFromWorld } from "../../lib/intelligence/worldPolish.js";

export function OrbCenter({ size = 100, activeColor, onClick, worldState = null }) {
  const glowColor   = activeColor || T.teal;
  const isCoralMode = activeColor === T.coral;
  // World-aware atmosphere tokens (null-safe — defaults built in)
  const orbAtm = orbAtmosphereFromWorld(worldState);

  return (
    <div
      className="orb-tap"
      onClick={onClick}
      style={{
        position:"relative", zIndex:Z.center,
        width:size, height:size,
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"huiScaleIn 0.55s cubic-bezier(0.16,1,0.30,1) 0.06s both",
        // Pointer-Events nur auf diesem Element (nicht auf Ringen)
        pointerEvents:"auto",
      }}
    >
      {/* ── Orbit-Ringe — dekorativ, kein pointer-events ─── */}
      <div style={{
        position:"absolute", inset:-22, borderRadius:"50%",
        border:`1.5px solid ${glowColor}`,
        opacity:orbAtm.ringOpacity1,
        animation:orbAtm.ring1Anim,
        pointerEvents:"none",
        zIndex:Z.rings,
      }}/>
      <div style={{
        position:"absolute", inset:-42, borderRadius:"50%",
        border:`1px solid ${glowColor}`,
        opacity:orbAtm.ringOpacity2,
        animation:orbAtm.ring2Anim,
        pointerEvents:"none",
        zIndex:Z.rings,
      }}/>
      <div style={{
        position:"absolute", inset:-64, borderRadius:"50%",
        border:`1px solid ${glowColor}`,
        opacity:orbAtm.ringOpacity3,
        animation:orbAtm.ring3Anim,
        pointerEvents:"none",
        zIndex:Z.rings,
      }}/>

      {/* ── Logo-Sphäre ─────────────────────────────────── */}
      <div style={{
        width:size, height:size, borderRadius:"50%", overflow:"hidden",
        animation: isCoralMode ? `huiOrbBreathCoral ${orbAtm.breathDuration} ease-in-out infinite`
                                : orbAtm.breathAnim,
        background:"linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(240,252,250,0.78) 100%)",
        boxShadow:[
          `0 0 0 2px ${glowColor}28`,
          `0 10px 32px ${glowColor}20`,
          `inset 0 2px 8px rgba(255,255,255,0.92)`,
          `inset 0 -3px 10px ${glowColor}12`,
        ].join(","),
        transition:"box-shadow 0.60s ease",
        flexShrink:0, position:"relative",
        zIndex:Z.center,
      }}>
        <img
          src="/assets/brand/hui-logo-light.svg"
          alt="HUI"
          loading="eager"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e => {
            e.target.style.display = "none";
            const fb = document.createElement("div");
            fb.style.cssText = [
              "width:100%", "height:100%", "display:flex",
              "align-items:center", "justify-content:center",
              `background:linear-gradient(135deg,${T.teal},${T.violet})`,
            ].join(";");
            const sp = document.createElement("span");
            sp.style.cssText = "font-size:42px;font-weight:900;color:#fff;font-family:system-ui";
            sp.textContent = "H";
            fb.appendChild(sp);
            e.target.parentNode.replaceChild(fb, e.target);
          }}
        />
        {/* Glass-Highlight */}
        <div style={{
          position:"absolute", top:8, left:12, width:26, height:12,
          borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(255,255,255,0.78) 0%, transparent 100%)",
          filter:"blur(3px)", transform:"rotate(-18deg)",
          pointerEvents:"none",
        }}/>
      </div>
    </div>
  );
}
