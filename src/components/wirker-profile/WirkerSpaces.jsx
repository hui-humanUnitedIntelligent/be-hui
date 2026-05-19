// components/wirker-profile/WirkerSpaces.jsx
// Kreativ-Welten — horizontal scrollende runde Bubbles
// Screenshot-exact: Atelier, Projekte, Natur, Momente, Community

import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B", ink:"#1A1A1A" };

const DEFAULT_SPACES = [
  { key:"atelier",   label:"Atelier",   emoji:"🏺", color:"#16D7C5" },
  { key:"projekte",  label:"Projekte",  emoji:"✦",  color:"#FF8A6B" },
  { key:"natur",     label:"Natur",     emoji:"🌿", color:"#4CAF50" },
  { key:"momente",   label:"Momente",   emoji:"✨", color:"#A78BFA" },
  { key:"community", label:"Community", emoji:"🫂", color:"#FF8A6B" },
];

function Bubble({ space }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      gap:7, flexShrink:0, cursor:"pointer",
    }}>
      <div style={{
        width:70, height:70, borderRadius:"50%",
        background: space.img
          ? `url(${space.img}) center/cover no-repeat`
          : `linear-gradient(135deg,${space.color}28,${space.color}14)`,
        border:`1.5px solid ${space.color}30`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:28,
        boxShadow:`0 4px 14px ${space.color}20`,
        overflow:"hidden",
        transition:"transform 0.2s ease",
      }}
      onTouchStart={e => e.currentTarget.style.transform="scale(0.93)"}
      onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
      >
        {!space.img && space.emoji}
      </div>
      <span style={{
        fontSize:12, color:C.ink, fontWeight:500,
        textAlign:"center", whiteSpace:"nowrap",
      }}>{space.label}</span>
    </div>
  );
}

export default function WirkerSpaces({ spaces }) {
  const items = spaces?.length ? spaces : DEFAULT_SPACES;
  return (
    <div
      className="hui-scroll"
      style={{
        display:"flex", gap:18,
        overflowX:"auto", overflowY:"hidden",
        padding:"6px 20px 18px",
        WebkitOverflowScrolling:"touch",
      }}
    >
      {items.map(s => <Bubble key={s.key} space={s}/>)}
    </div>
  );
}
