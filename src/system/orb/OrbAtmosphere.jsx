// src/system/orb/OrbAtmosphere.jsx
// ═══════════════════════════════════════════════════════════════
// HUI ORB — Atmosphäre-Layer
//
// Rein dekorativ. KEIN pointer-events. KEIN State.
// Blobs: langsam, subtil, lebendig.
// Partikel: sehr zart, kaum wahrnehmbar.
// ═══════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { Z } from "./OrbConfig.js";
import { SAFE_MODE } from "../../config/safeMode.js";

/* ── Hintergrund-Blobs ──────────────────────────────────────── */
function OrbAtmosphere({ ambientColor }) {
  return (
    <>
      {/* Mint blob — oben links */}
      <div style={{
        position:"absolute", left:"20%", top:"18%",
        width:320, height:280,
        borderRadius:"62% 38% 55% 45% / 50% 60% 40% 50%",
        background:"radial-gradient(ellipse, rgba(22,215,197,0.09) 0%, transparent 70%)",
        filter:"blur(52px)",
        animation:"orbBlobA 15s ease-in-out infinite",
        pointerEvents:"none",
        transform:"translate(-50%,-50%)",
        zIndex:Z.atmosphere,
      }}/>

      {/* Lavender blob — rechts */}
      <div style={{
        position:"absolute", left:"78%", top:"35%",
        width:260, height:240,
        borderRadius:"45% 55% 40% 60% / 55% 45% 60% 40%",
        background:"radial-gradient(ellipse, rgba(245,166,35,0.07) 0%, transparent 70%)",
        filter:"blur(58px)",
        animation:"orbBlobB 20s ease-in-out 2s infinite",
        pointerEvents:"none",
        transform:"translate(-50%,-50%)",
        zIndex:Z.atmosphere,
      }}/>

      {/* Peach blob — unten */}
      <div style={{
        position:"absolute", left:"50%", top:"74%",
        width:340, height:220,
        borderRadius:"55% 45% 60% 40% / 45% 60% 40% 55%",
        background:"radial-gradient(ellipse, rgba(255,138,107,0.07) 0%, transparent 70%)",
        filter:"blur(62px)",
        animation:"orbBlobC 25s ease-in-out 5s infinite",
        pointerEvents:"none",
        transform:"translate(-50%,-50%)",
        zIndex:Z.atmosphere,
      }}/>

      {/* Active-Node ambient glow — folgt aktiver Farbe */}
      {ambientColor && (
        <div style={{
          position:"absolute", left:"50%", top:"42%",
          transform:"translate(-50%,-50%)",
          width:460, height:360,
          background:`radial-gradient(ellipse, ${ambientColor}07 0%, transparent 65%)`,
          pointerEvents:"none",
          zIndex:Z.atmosphere,
          transition:"background 0.70s ease",
        }}/>
      )}
    </>
  );
}

/* ── Partikel ─────────────────────────────────────────────────── */
function OrbParticles({ color }) {
  const items = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x:   (Math.random() - 0.5) * 300,
    y:   (Math.random() - 0.5) * 300,
    dx:  (Math.random() - 0.5) * 160,
    dy:  (Math.random() - 0.5) * 160,
    s:   1.5 + Math.random() * 3,
    dur: 3 + Math.random() * 4,
    del: Math.random() * 3,
  })), []);

  return (
    <div style={{
      position:"absolute", left:"50%", top:"44%",
      width:0, height:0,
      pointerEvents:"none",
      zIndex:Z.atmosphere,
    }}>
      {(items||[]).filter(p=>p&&typeof p==='object').map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:p.x, top:p.y,
          width:p.s, height:p.s,
          borderRadius:"50%",
          background:color,
          "--pdx":`${p.dx}px`,
          "--pdy":`${p.dy}px`,
          animation:`orbParticle ${p.dur}s ${p.del}s ease-out infinite`,
          pointerEvents:"none",
        }}/>
      ))}
    </div>
  );
}


/* ── SAFE_MODE Export Wrapper ─────────────────────────────────── */
const _OrbAtmosphereRaw = OrbAtmosphere;
function OrbAtmosphereSafe(props) {
  React.useEffect(() => {
    console.log('[HUI Render Debug] OrbAtmosphere mounted');
    return () => console.log('[HUI Render Debug] OrbAtmosphere unmounted');
  }, []);
  if (!SAFE_MODE.ambient) {
    console.info('[HUI SafeMode] OrbAtmosphere deaktiviert');
    return null;
  }
  try {
    return <_OrbAtmosphereRaw {...props} />;
  } catch (e) {
    console.error('[HUI Render Debug] OrbAtmosphere failed', e);
    return null;
  }
}
export { OrbAtmosphereSafe as OrbAtmosphere };

/* ── OrbParticles SafeMode Wrapper ──────────────────────────── */
const _OrbParticlesRaw = OrbParticles;
function OrbParticlesSafe(props) {
  React.useEffect(() => {
    console.log('[HUI Render Debug] OrbParticles mounted');
    return () => console.log('[HUI Render Debug] OrbParticles unmounted');
  }, []);
  if (!SAFE_MODE.particles) {
    console.info('[HUI SafeMode] OrbParticles deaktiviert');
    return null;
  }
  try {
    return <_OrbParticlesRaw {...props} />;
  } catch (e) {
    console.error('[HUI Render Debug] OrbParticles failed', e);
    return null;
  }
}
export { OrbParticlesSafe as OrbParticles };
