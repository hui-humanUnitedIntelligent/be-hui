import React from "react";
export function ViewToggle({ view, onChange }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:2,
      background:"rgba(26,53,48,0.06)",
      borderRadius:12, padding:3,
      backdropFilter:"blur(8px)",
    }}>
      {[
        { key:"cards", icon:(
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="1" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )},
        { key:"list", icon:(
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        )},
      ].map(btn => {
        const active = view === btn.key;
        return (
          <button key={btn.key} onClick={() => onChange(btn.key)} style={{
            width:30, height:28, borderRadius:9, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            background: active ? "white" : "transparent",
            color: active ? "#0EC4B8" : "rgba(26,53,48,0.45)",
            boxShadow: active ? "0 1px 6px rgba(26,53,48,0.10), 0 0 0 1px rgba(14,196,184,0.18)" : "none",
            transition:"background .16s, color .16s, box-shadow .16s",
            WebkitTapHighlightColor:"transparent",
            touchAction:"manipulation",
          }}>
            {btn.icon}
          </button>
        );
      })}
    </div>
  );
}
