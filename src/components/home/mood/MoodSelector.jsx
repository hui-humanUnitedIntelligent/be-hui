// mood/MoodSelector.jsx — HUI Mood Grid
// Reine Darstellung: 10 Mood-Bubbles in 5x2 Grid

import React from "react";
import { MOODS } from "./moodConfig.js";

export default function MoodSelector({ activeMood, onSelect }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
      {MOODS.map(m => {
        const on = activeMood?.key === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onSelect(on ? null : m)}
            style={{
              background: on ? `${m.color}18` : "rgba(255,255,255,0.7)",
              border:`1.5px solid ${on ? m.color+"44" : "rgba(0,0,0,0.06)"}`,
              borderRadius:16, padding:"10px 4px 8px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
              transition:"transform 0.12s, box-shadow 0.12s",
              boxShadow: on ? `0 4px 14px ${m.color}28` : "0 1px 3px rgba(0,0,0,0.04)",
              transform: on ? "scale(1.05)" : "scale(1)",
            }}
          >
            <span style={{ fontSize:18, lineHeight:1 }}>{m.emoji}</span>
            <span style={{
              fontSize:9.5, fontWeight:600, lineHeight:1.2, textAlign:"center",
              color: on ? m.color : "rgba(40,40,40,0.62)", letterSpacing:0.1,
            }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
