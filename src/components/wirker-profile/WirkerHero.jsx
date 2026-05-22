import { createProfileItem } from "../../lib/factories/createProfileItem.js";
// components/wirker-profile/WirkerHero.jsx
// Cinematic Hero — Screenshot-exact nach Mia Kern Design
// Public View only — keine Owner-Actions

import React, { useState } from "react";
import { profileAtmosphereFromWorld } from "../../lib/intelligence/worldPolish.js";

const C = {
  teal: "#16D7C5", coral: "#FF8A6B",
  ink: "#1A1A1A", cream: "#F9F7F4",
};

export default function WirkerHero({ profile, onClose, onMore }) {
  const [imgErr, setImgErr] = useState(false);
  const heroUrl   = profile?.header_img || profile?.bg_url || null;
  const avatarUrl = profile?.avatar_url || profile?.img   || null;

  return (
    <div style={{ position:"relative", width:"100%", height:260, flexShrink:0 }}>

      {/* ── Cover Image ── */}
      <div style={{
        position:"absolute", inset:0,
        background: heroUrl && !imgErr
          ? `url(${heroUrl}) center/cover no-repeat`
          : "linear-gradient(160deg,#1c2e2e 0%,#2a4040 50%,rgba(22,215,197,0.18) 100%)",
      }}>
        {heroUrl && <img src={heroUrl} alt="" onError={() => setImgErr(true)} style={{display:"none"}}/>}
      </div>

      {/* ── Cinematic gradient overlay — dunkler unten ── */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 40%, rgba(249,247,244,0) 60%, rgba(249,247,244,0.9) 82%, rgba(249,247,244,1) 100%)",
        pointerEvents:"none",
      }}/>

      {/* ── Ambient teal glow am Boden ── */}
      <div style={{
        position:"absolute", bottom:-20, left:"50%",
        transform:"translateX(-50%)",
        width:280, height:160,
        background:"radial-gradient(ellipse, rgba(22,215,197,0.10) 0%, transparent 70%)",
        pointerEvents:"none",
      }}/>

      {/* ── Nav Buttons ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0,
        display:"flex", justifyContent:"space-between",
        padding:"52px 20px 0",
      }}>
        <button onClick={onClose} style={{
          width:38, height:38, borderRadius:"50%",
          background:"rgba(0,0,0,0.32)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"white", fontSize:18, fontWeight:500,
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        }}>←</button>

        <button onClick={onMore} style={{
          width:38, height:38, borderRadius:"50%",
          background:"rgba(0,0,0,0.32)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"white", fontSize:18, letterSpacing:1,
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        }}>···</button>
      </div>

      {/* ── Avatar — schwebt über Hero ── */}
      <div style={{
        position:"absolute", bottom:-44, left:20,
        width:84, height:84, borderRadius:"50%",
        border:"3px solid white",
        background: avatarUrl
          ? `url(${avatarUrl}) center/cover no-repeat`
          : `linear-gradient(135deg,${C.teal},${C.coral})`,
        boxShadow:"0 6px 24px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.10)",
        zIndex:2, flexShrink:0,
      }}/>
    </div>
  );
}
