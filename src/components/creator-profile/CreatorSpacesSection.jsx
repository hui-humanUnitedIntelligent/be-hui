// components/creator-profile/CreatorSpacesSection.jsx
// Creative Worlds — horizontal scroll bubbles

import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B", ink:"#1A1A1A", muted:"rgba(80,80,80,0.55)" };

const DEFAULT_SPACES = [
  { key:"atelier",    label:"Atelier",    emoji:"🏺", color:"#16D7C5" },
  { key:"projekte",   label:"Projekte",   emoji:"✦",  color:"#FF8A6B" },
  { key:"natur",      label:"Natur",      emoji:"🌿", color:"#4CAF50" },
  { key:"momente",    label:"Momente",    emoji:"✨", color:"#A78BFA" },
  { key:"community",  label:"Community",  emoji:"🫂", color:"#FF8A6B" },
  { key:"reisen",     label:"Reisen",     emoji:"🗺️", color:"#16D7C5" },
  { key:"musik",      label:"Klang",      emoji:"🎵", color:"#FFB347" },
];

function SpaceBubble({ space, images }) {
  const img = images?.[space.key] || null;
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      gap:7, flexShrink:0, cursor:"pointer",
    }}>
      <div style={{
        width:68, height:68, borderRadius:"50%",
        background: img
          ? `url(${img}) center/cover no-repeat`
          : `linear-gradient(135deg,${space.color}30,${space.color}15)`,
        border:`2px solid ${space.color}35`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:26,
        boxShadow:`0 4px 16px ${space.color}22`,
        transition:"transform 0.2s ease",
      }}
      onMouseEnter={e => e.currentTarget.style.transform="scale(1.06)"}
      onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
      >
        {!img && space.emoji}
      </div>
      <span style={{ fontSize:11.5, color:C.ink, fontWeight:500 }}>{space.label}</span>
    </div>
  );
}

export default function CreatorSpacesSection({ profile, spaces, images }) {
  const items = spaces || DEFAULT_SPACES;
  return (
    <div style={{ marginTop:20 }}>
      <div
        className="hui-scroll"
        style={{
          display:"flex", gap:16,
          overflowX:"auto", overflowY:"hidden",
          padding:"4px 20px 16px",
          WebkitOverflowScrolling:"touch",
        }}
      >
        {items.map(s => (
          <SpaceBubble key={s.key} space={s} images={images}/>
        ))}
      </div>
    </div>
  );
}
