// src/components/publishing/PublishingHub.jsx
// Phase 4 — Zentraler Publishing-Einstiegspunkt
// Wird vom Orb/Action Engine aufgerufen
// Zeigt Auswahl: Werk | Erlebnis | Beitrag (Text/Bild)

import React, { useState } from "react";
import PublishWorkFlow       from "./PublishWorkFlow.jsx";
import PublishExperienceFlow from "./PublishExperienceFlow.jsx";

const C = {
  teal:"#16D7C5", coral:"#FF8A6B", cream:"#F9F7F4",
  ink:"#1A1A2E", muted:"rgba(80,80,80,0.55)",
};

const MODES = [
  {
    key:   "work",
    icon:  "🎨",
    label: "Werk veröffentlichen",
    desc:  "Foto, Video oder Text — dein kreatives Werk",
    glow:  C.teal,
  },
  {
    key:   "experience",
    icon:  "✨",
    label: "Erlebnis erstellen",
    desc:  "Workshop, Session, Atelier-Abend — eine gemeinsame Erfahrung",
    glow:  C.coral,
  },
];

export default function PublishingHub({ onClose, onPublished }) {
  const [mode, setMode] = useState(null); // null | "work" | "experience"

  if (mode === "work") {
    return <PublishWorkFlow onClose={onClose} onPublished={onPublished}/>;
  }
  if (mode === "experience") {
    return <PublishExperienceFlow onClose={onClose} onPublished={onPublished}/>;
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:11900,
      background:"rgba(0,0,0,0.70)", backdropFilter:"blur(20px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <div style={{
        width:"100%", maxWidth:480, background:C.cream,
        borderRadius:"24px 24px 0 0",
        padding:"0 0 env(safe-area-inset-bottom,24px)",
      }}>
        <div style={{ padding:"12px 0 0", display:"flex", justifyContent:"center" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px 6px" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:C.ink }}>Was moechtest du teilen?</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.muted }}>x</button>
        </div>
        <div style={{ padding:"12px 20px 24px", display:"flex", flexDirection:"column", gap:12 }}>
          {MODES.map(m => (
            <button key={m.key} onClick={() => setMode(m.key)} style={{
              display:"flex", alignItems:"center", gap:16,
              padding:"18px 20px", borderRadius:18,
              background:"rgba(255,255,255,0.85)",
              border:`1.5px solid ${m.glow}30`,
              cursor:"pointer", textAlign:"left",
              boxShadow:`0 2px 12px ${m.glow}12`,
              transition:"transform 0.15s ease",
            }}>
              <div style={{
                width:48, height:48, borderRadius:14, flexShrink:0,
                background:`linear-gradient(135deg,${m.glow}25,${m.glow}10)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22,
              }}>{m.icon}</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.ink, marginBottom:3 }}>{m.label}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.4 }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
