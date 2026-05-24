/**
 * OrbAtmosphere.jsx — Phase 4G
 *
 * Lebt hinter den Cards.
 * Reagiert auf den aktiven Content-Type:
 *   → Blob-Farbe, Dichte, Wärme shifts ruhig.
 *
 * Pure Visual — kein State, kein Pointer-Events.
 */

import React, { useMemo } from "react";
import { CONTENT_DNA }    from "./OrbMotionSystem.js";

// ─── Partikel ─────────────────────────────────────────────────────────────────
function Particles({ color }) {
  const ps = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id:  i,
    x:   (Math.random() - 0.5) * 320,
    y:   (Math.random() - 0.5) * 320,
    dx:  (Math.random() - 0.5) * 180,
    dy:  (Math.random() - 0.5) * 180,
    s:   1.5 + Math.random() * 2.5,
    dur: 3.5 + Math.random() * 4,
    del: Math.random() * 3.5,
  })), []);

  return (
    <div style={{
      position:"absolute", left:"50%", top:"44%",
      width:0, height:0, pointerEvents:"none", zIndex:1,
    }}>
      {ps.map(p => (
        <div key={p.id} style={{
          position:    "absolute",
          left:        p.x, top: p.y,
          width:       p.s, height: p.s,
          borderRadius:"50%",
          background:  color || "rgba(13,196,181,0.5)",
          "--pdx":     `${p.dx}px`,
          "--pdy":     `${p.dy}px`,
          animation:   `orbPortalParticle ${p.dur}s ${p.del}s ease-out infinite`,
          pointerEvents:"none",
        }} />
      ))}
    </div>
  );
}

// ─── Atmosphären-Blobs ────────────────────────────────────────────────────────
export function OrbAtmosphereLayer({ activeType = null }) {
  const dna   = activeType ? CONTENT_DNA[activeType] : null;
  const color = dna?.blobColor || "rgba(13,196,181,";

  return (
    <div style={{
      position:     "absolute",
      inset:        0,
      pointerEvents:"none",
      overflow:     "hidden",
      borderRadius: "inherit",
    }}>
      {/* Blob A — oben links */}
      <div style={{
        position:     "absolute",
        left:         "22%",   top: "16%",
        width:        340,     height: 280,
        borderRadius: "62% 38% 55% 45% / 50% 60% 40% 50%",
        background:   `radial-gradient(ellipse, ${color}0.07) 0%, transparent 72%)`,
        filter:       "blur(64px)",
        animation:    "orbPortalBlobA 20s ease-in-out infinite",
        transform:    "translate(-50%,-50%)",
        transition:   "background 0.80s ease",
      }} />

      {/* Blob B — rechts, warm */}
      <div style={{
        position:     "absolute",
        left:         "78%",   top: "36%",
        width:        280,     height: 250,
        borderRadius: "45% 55% 40% 60% / 55% 45% 60% 40%",
        background:   `radial-gradient(ellipse, ${color}0.055) 0%, transparent 70%)`,
        filter:       "blur(70px)",
        animation:    "orbPortalBlobB 26s ease-in-out 3s infinite",
        transform:    "translate(-50%,-50%)",
        transition:   "background 0.80s ease",
      }} />

      {/* Blob C — unten, peach/warm */}
      <div style={{
        position:     "absolute",
        left:         "50%",   top: "76%",
        width:        360,     height: 220,
        borderRadius: "55% 45% 60% 40% / 45% 60% 40% 55%",
        background:   "radial-gradient(ellipse, rgba(255,138,107,0.045) 0%, transparent 72%)",
        filter:       "blur(76px)",
        animation:    "orbPortalBlobA 32s ease-in-out 6s infinite",
        transform:    "translate(-50%,-50%)",
      }} />

      {/* Active Type Glow — zentral, reagiert auf Auswahl */}
      {dna && (
        <div style={{
          position:   "absolute",
          left:       "50%", top: "42%",
          transform:  "translate(-50%,-50%)",
          width:      500,   height: 400,
          background: `radial-gradient(ellipse, ${color}0.08) 0%, transparent 68%)`,
          pointerEvents:"none",
          transition: "background 0.75s ease",
          filter:     "blur(40px)",
        }} />
      )}

      {/* Partikel */}
      <Particles color={dna ? `${color}0.55)` : "rgba(13,196,181,0.4)"} />
    </div>
  );
}
