// header/MoodOrbButton.jsx — HUI Zauber/Mood Tuner Button
// Runder Gold/Coral Button der das MoodSheet öffnet

import React from "react";

export default function MoodOrbButton({ activeMood, isOpen, onToggle }) {
  const mc  = activeMood?.color || null;
  const has = !!activeMood;

  return (
    <button
      onClick={onToggle}
      aria-label="Stimmung wählen"
      style={{
        flexShrink:0, width:38, height:38, borderRadius:"50%",
        background: has
          ? `linear-gradient(135deg,${mc},${mc}BB)`
          : "linear-gradient(135deg,#F5A623,#FF8A6B)",
        border:`1.5px solid ${has ? mc+"44" : "rgba(245,166,35,0.32)"}`,
        boxShadow: has
          ? `0 0 0 3px ${mc}1E, 0 5px 16px ${mc}38`
          : "0 0 0 3px rgba(245,166,35,0.16), 0 5px 16px rgba(255,138,107,0.30)",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", WebkitTapHighlightColor:"transparent",
        transition:"transform 0.18s ease, box-shadow 0.22s ease",
        transform: isOpen ? "scale(0.90) rotate(20deg)" : "scale(1) rotate(0deg)",
      }}
    >
      {has
        ? <span style={{ fontSize:16, lineHeight:1 }}>{activeMood.emoji}</span>
        : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1 L9.5 5.5 H14.5 L10.5 8.5 L12 13 L8 10 L4 13 L5.5 8.5 L1.5 5.5 H6.5 Z"
              fill="white" opacity="0.94"/>
          </svg>
        )
      }
    </button>
  );
}
