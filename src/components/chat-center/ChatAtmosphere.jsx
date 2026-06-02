// chat-center/ChatAtmosphere.jsx
// Cinematic ambient background — sehr subtil, nie kitschig
// Teal/Midnight floating light fields

import React from "react";

const CSS = `
  @keyframes ca-drift-a {
    0%,100%{transform:translate(0,0) scale(1);}
    33%{transform:translate(18px,-12px) scale(1.06);}
    66%{transform:translate(-10px,8px) scale(0.97);}
  }
  @keyframes ca-drift-b {
    0%,100%{transform:translate(0,0) scale(1);}
    40%{transform:translate(-14px,16px) scale(1.04);}
    70%{transform:translate(10px,-6px) scale(0.98);}
  }
  @keyframes ca-drift-c {
    0%,100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(8px,14px) scale(1.05);}
  }
`;

export default function ChatAtmosphere({ dark = false }) {
  const base = dark
    ? { bg: "#0D1117", teal: "rgba(22,215,197,0.09)", coral: "rgba(255,138,107,0.06)" }
    : { bg: "#F2F4F7", teal: "rgba(22,215,197,0.11)", coral: "rgba(255,138,107,0.07)" };

  return (
    <div style={{
      position:"absolute", inset:0, zIndex:0, pointerEvents:"none",
      background: dark
        ? "linear-gradient(160deg,#0D1117 0%,#111820 50%,#0e1a18 100%)"
        : "linear-gradient(160deg,#F2F4F8 0%,#EEF0F5 50%,#F0F5F4 100%)",
      overflow:"hidden",
    }}>
      <style>{CSS}</style>
      {/* Teal Aura — oben links */}
      <div style={{
        position:"absolute", top:"-15%", left:"-10%",
        width:"55%", height:"55%", borderRadius:"50%",
        background:`radial-gradient(ellipse,${base.teal} 0%,transparent 68%)`,
        filter:"blur(40px)",
        animation:"ca-drift-a 14s ease-in-out infinite",
      }}/>
      {/* Coral Aura — unten rechts */}
      <div style={{
        position:"absolute", bottom:"-10%", right:"-8%",
        width:"45%", height:"45%", borderRadius:"50%",
        background:`radial-gradient(ellipse,${base.coral} 0%,transparent 68%)`,
        filter:"blur(35px)",
        animation:"ca-drift-b 18s ease-in-out infinite",
      }}/>
      {/* Teal Aura — Mitte */}
      <div style={{
        position:"absolute", top:"35%", right:"20%",
        width:"30%", height:"30%", borderRadius:"50%",
        background:`radial-gradient(ellipse,${base.teal} 0%,transparent 70%)`,
        filter:"blur(28px)",
        animation:"ca-drift-c 22s ease-in-out infinite",
      }}/>
    </div>
  );
}
