// components/wirker-profile/WirkerConnectionCard.jsx
// Public Actions: Nachricht + Herz + Folgen + Buchen
// Screenshot: großer Teal-Button + Herz-Icon rechts

import React, { useState } from "react";

const C = {
  teal: "#16D7C5", teal2: "#11C5B7",
  coral: "#FF8A6B", ink: "#1A1A1A",
  muted: "rgba(80,80,80,0.55)",
};

export default function WirkerConnectionCard({
  profile, followed, followLoading,
  onChat, onFollow, onBook,
}) {
  const [resonated, setResonated] = useState(false);

  return (
    <div style={{ padding:"0 20px 16px" }}>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>

        {/* ── Nachricht Button — dominant teal ── */}
        <button
          onClick={onChat}
          style={{
            flex:1, height:48,
            background:`linear-gradient(135deg,${C.teal} 0%,${C.teal2} 100%)`,
            border:"none", borderRadius:99,
            color:"white", fontSize:15.5, fontWeight:700,
            cursor:"pointer",
            boxShadow:`0 6px 20px rgba(22,215,197,0.32)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            gap:8,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            transition:"transform 0.25s ease, box-shadow 0.25s ease",
          }}
          onTouchStart={e => e.currentTarget.style.transform="scale(0.984)"}
          onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Nachricht
        </button>

        {/* ── Herz Button ── */}
        <button
          onClick={() => setResonated(l => !l)}
          style={{
            width:48, height:48, borderRadius:"50%",
            background:"white",
            border:"1px solid rgba(0,0,0,0.10)",
            boxShadow:"0 2px 8px rgba(0,0,0,0.07)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer",
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            transition:"transform 0.25s ease",
            flexShrink:0,
          }}
          onTouchStart={e => e.currentTarget.style.transform="scale(0.94)"}
          onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={resonated ? C.coral : "none"}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke={resonated ? C.coral : "rgba(80,80,80,0.5)"} strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
