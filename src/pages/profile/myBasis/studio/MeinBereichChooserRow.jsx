import React from "react";
export function MeinBereichChooserRow({ icon, label, desc, onPress }) {
  return (
    <button onClick={onPress} className="mbp-press-light" style={{
      width:"100%", display:"flex", alignItems:"center", gap:14,
      padding:"15px 20px", background:"none", border:"none", cursor:"pointer",
      fontFamily:"inherit", textAlign:"left", borderBottom:"1px solid rgba(26,26,24,0.06)",
      WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
    }}>
      <span style={{
        width:38, height:38, borderRadius:11, flexShrink:0,
        background:"rgba(14,196,184,0.10)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"rgba(14,196,184,0.85)",
      }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18" }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:"rgba(26,26,24,0.5)", marginTop:1 }}>{desc}</div>}
      </div>
      <span style={{ color:"rgba(26,26,24,0.32)", fontSize:17 }}>›</span>
    </button>
  );
}
