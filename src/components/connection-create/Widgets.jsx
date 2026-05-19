// connection-create/Widgets.jsx
// ParticipantStepper, LocationPicker, MediaAttachmentBar

import React, { useState } from "react";

const C = {
  violet:"#8B5CF6", teal:"#16D7C5",
  ink:"#1A1A1A", muted:"rgba(80,80,80,0.52)",
  border:"rgba(0,0,0,0.08)",
};

/* ── Participant Stepper ── */
export function ParticipantStepper({ value, onChange, max=200 }) {
  function dec() { onChange(Math.max(2, value - 1)); }
  function inc() { onChange(Math.min(max, value + 1)); }

  const BtnStyle = (side) => ({
    width:36, height:36, borderRadius:10,
    background:"rgba(139,92,246,0.09)",
    border:"1.5px solid rgba(139,92,246,0.20)",
    color:C.violet, fontSize:18, fontWeight:700,
    display:"flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer",
    WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
    transition:"background 0.15s",
  });

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:14,
      padding:"10px 14px",
      background:"rgba(255,255,255,0.80)",
      border:`1.5px solid ${C.border}`,
      borderRadius:14,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, color:C.muted, fontSize:13 }}>
        <span style={{ fontSize:16 }}>👥</span>
        <span>Maximale Anzahl (optional)</span>
      </div>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={dec} style={BtnStyle("left")}>−</button>
        <span style={{ fontSize:17, fontWeight:800, color:C.ink, minWidth:28, textAlign:"center" }}>
          {value}
        </span>
        <button onClick={inc} style={BtnStyle("right")}>+</button>
      </div>
    </div>
  );
}

/* ── Location Picker ── */
export function LocationPicker({ value, onChange }) {
  return (
    <div style={{
      display:"flex", gap:10, alignItems:"stretch",
    }}>
      {/* Input */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", gap:10,
        padding:"10px 14px",
        background:"rgba(255,255,255,0.80)",
        border:`1.5px solid ${C.border}`,
        borderRadius:14,
      }}>
        <span style={{ fontSize:16, flexShrink:0 }}>📍</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Ort eingeben\u2026"
          style={{
            flex:1, border:"none", background:"none", outline:"none",
            fontSize:14, color:C.ink, fontFamily:"inherit",
          }}
        />
      </div>
      {/* Map Preview */}
      <div style={{
        width:76, height:48, borderRadius:14,
        background:"linear-gradient(135deg,rgba(139,92,246,0.12),rgba(22,215,197,0.10))",
        border:`1.5px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        overflow:"hidden", flexShrink:0, cursor:"pointer",
      }}>
        <div style={{
          fontSize:22, opacity:0.7,
          filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
        }}>🗺️</div>
      </div>
    </div>
  );
}

/* ── Media Attachment Bar ── */
export function MediaAttachmentBar({ onImage, onMusic, onLink }) {
  const BtnS = {
    flex:1, display:"flex", alignItems:"center", justifyContent:"center",
    gap:7, padding:"11px 10px",
    background:"rgba(255,255,255,0.80)",
    border:`1.5px solid ${C.border}`,
    borderRadius:14,
    fontSize:13, color:C.muted, fontWeight:600,
    cursor:"pointer",
    WebkitTapHighlightColor:"transparent",
    transition:"all 0.15s",
  };
  return (
    <div style={{ display:"flex", gap:10 }}>
      <button onClick={onImage} style={BtnS}
        onMouseEnter={e => e.currentTarget.style.borderColor="rgba(139,92,246,0.30)"}
        onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
        <span style={{ fontSize:16 }}>🖼</span> Bild hinzuf\u00fcgen
      </button>
      <button onClick={onMusic} style={BtnS}
        onMouseEnter={e => e.currentTarget.style.borderColor="rgba(139,92,246,0.30)"}
        onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
        <span style={{ fontSize:16 }}>🎵</span> Musik hinzuf\u00fcgen
      </button>
      <button onClick={onLink} style={BtnS}
        onMouseEnter={e => e.currentTarget.style.borderColor="rgba(139,92,246,0.30)"}
        onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
        <span style={{ fontSize:16 }}>🔗</span> Link hinzuf\u00fcgen
      </button>
    </div>
  );
}
