import { createProfileItem } from "../../lib/factories/createProfileItem.js";
// components/creator-profile/CreatorHero.jsx
// Cinematic fullscreen hero — Creator identity + atmosphere
// NO legacy imports. Pure presentational.

import React, { useState } from "react";
import { profileAtmosphereFromWorld } from "../../lib/intelligence/worldPolish.js";
import { HUI } from "../../design/hui.design.js";

const C = {
  teal:   HUI.COLOR.teal,
  coral:  HUI.COLOR.coral,
  cream:  HUI.COLOR.cream,
  ink:    HUI.COLOR.ink,
};

const MOODS = [
  "Gerade im Atelier",
  "Im kreativen Flow",
  "Arbeitet an neuen Werken",
  "Zwischen Projekten",
  "Offen für Begegnungen",
];

export default function CreatorHero({ profile, onClose, onEdit, worldState = null }) {
  const atmosTokens = profileAtmosphereFromWorld(worldState, profile);
  const p = (profile && profile.displayName) ? profile : createProfileItem(profile || {});
  const [imgError, setImgError] = useState(false);
  const heroUrl  = p?.banner  || null;
  const avatarUrl= p?.avatar  || null;
  const name     = p?.displayName || "Du";
  const talent   = p?.talent || "Kreative:r";
  const location = p?.location || null;
  const mood     = p?.currentMood || MOODS[0];

  return (
    <div style={{ position:"relative", width:"100%", height:300, flexShrink:0 }}>

      {/* ── Hintergrundbild ── */}
      <div style={{
        position:"absolute", inset:0,
        background: heroUrl && !imgError
          ? `url(${heroUrl}) center/cover no-repeat`
          : "linear-gradient(135deg,#1a2a2a 0%,#2d4040 40%,#16D7C525 100%)",
        borderRadius: 0,
      }}>
        {heroUrl && !imgError && (
          <img src={heroUrl} alt="" onError={() => setImgError(true)}
            style={{ display:"none" }}/>
        )}
      </div>

      {/* ── Cinematic gradient overlay ── */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 30%, rgba(249,247,244,0) 55%, rgba(249,247,244,0.85) 80%, rgba(249,247,244,1) 100%)",
      }}/>

      {/* ── Ambient atmosphere glow — world-temperature aware ── */}
      <div style={{
        position:"absolute", bottom:0, left:"50%",
        transform:"translateX(-50%)",
        width:320, height:180,
        background: atmosTokens.ambientGlow || "radial-gradient(ellipse, rgba(22,215,197,0.10) 0%, transparent 70%)",
        pointerEvents:"none",
        transition:"background 1.2s ease",
      }}/>

      {/* ── Nav: Zurück + Mehr ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"52px 20px 0",
      }}>
        <button onClick={onClose} style={{
          width:38, height:38, borderRadius:"50%",
          background:"rgba(0,0,0,0.35)",
          backdropFilter:"blur(12px)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"white", fontSize:18,
        }}>←</button>
        <button onClick={onEdit} style={{
          width:38, height:38, borderRadius:"50%",
          background:"rgba(0,0,0,0.35)",
          backdropFilter:"blur(12px)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"white", fontSize:16,
        }}>···</button>
      </div>

      {/* ── Avatar — schwebt über Hero ── */}
      <div style={{
        position:"absolute", bottom:-48, left:20,
        width:88, height:88, borderRadius:"50%",
        border:"3.5px solid white",
        boxShadow:"0 8px 32px rgba(22,215,197,0.28), 0 2px 12px rgba(0,0,0,0.18)",
        background: avatarUrl
          ? `url(${avatarUrl}) center/cover no-repeat`
          : "linear-gradient(135deg,#16D7C5,#FF8A6B)",
        flexShrink:0,
        zIndex:2,
      }}/>
    </div>
  );
}
