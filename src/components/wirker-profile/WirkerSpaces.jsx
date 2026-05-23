// components/wirker-profile/WirkerSpaces.jsx
// Resonanzräume — horizontal scrollende runde Bubbles
// HUI: menschliche Räume statt kreative Kategorien

import React from "react";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, coral:HUI.COLOR.coral, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.55)" };

// Resonanzräume statt Kategorien-Labels
const DEFAULT_SPACES = [
  { key:"atelier",    label:"Atelier",        emoji:"🏺", color:HUI.COLOR.teal },
  { key:"begegnungen",label:"Begegnungen",    emoji:"🫂",  color:HUI.COLOR.coral },
  { key:"natur",      label:"Natur & Stille", emoji:"🌿", color:"#4CAF50" },
  { key:"momente",    label:"Momente",        emoji:"✦",  color:HUI.COLOR.violetLight },
  { key:"wirkung",    label:"Wirkung",        emoji:"🌱", color:"#10B981" },
];

function Bubble({ space }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      gap:7, flexShrink:0, cursor:"pointer",
    }}>
      <div style={{
        width:72, height:72, borderRadius:"50%",
        background: space.img
          ? `url(${space.img}) center/cover no-repeat`
          : `linear-gradient(135deg,${space.color}22,${space.color}10)`,
        border:`1.5px solid ${space.color}28`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:28,
        boxShadow:`0 4px 16px ${space.color}18`,
        overflow:"hidden",
        transition:"transform 0.28s ease, box-shadow 0.28s ease",
      }}
      onTouchStart={e => {
        e.currentTarget.style.transform="scale(0.92)";
        e.currentTarget.style.boxShadow=`0 2px 8px ${space.color}18`;
      }}
      onTouchEnd={e => {
        e.currentTarget.style.transform="scale(1)";
        e.currentTarget.style.boxShadow=`0 4px 16px ${space.color}18`;
      }}
      >
        {!space.img && space.emoji}
      </div>
      <span style={{
        fontSize:11.5, color:C.muted, fontWeight:500,
        textAlign:"center", whiteSpace:"nowrap", lineHeight:1.3,
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
        display:"flex", gap:20,
        overflowX:"auto", overflowY:"hidden",
        padding:"8px 20px 20px",
        WebkitOverflowScrolling:"touch",
        scrollbarWidth:"none",
        msOverflowStyle:"none",
      }}
    >
      {(items || []).filter(s => s && s.key).map(s => <Bubble key={s.key} space={s}/>)}
    </div>
  );
}
