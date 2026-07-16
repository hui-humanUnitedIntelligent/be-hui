import React from "react";
export function MeinBereichTile({ icon, label, onPress }) {
  return (
    <button
      onClick={onPress}
      className="mbp-press-light"
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
        background:"none", border:"none", cursor:"pointer", fontFamily:"inherit",
        padding:"4px 2px", WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}
    >
      <span style={{
        width:52, height:52, borderRadius:"50%",
        background:"rgba(14,196,184,0.10)", border:"1px solid rgba(14,196,184,0.22)",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0, color:"rgba(14,196,184,0.85)",
      }}>{icon}</span>
      <span style={{
        fontSize:11.5, fontWeight:600, color:"rgba(26,26,24,0.75)",
        textAlign:"center", lineHeight:1.25, maxWidth:76,
      }}>{label}</span>
    </button>
  );
}
