// src/feed/StoryReactionTray.jsx — Phase 3D
// ══════════════════════════════════════════════════════════════
// Floating reaction tray at bottom of StoryViewer.
// 5 emojis. Tap = burst animation + DB write.
// Realtime: owner sees reactions arrive live.
// Isolated — crash = null.
// ══════════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";

const EMOJIS = ["❤️","🔥","🙌","✨","🫶"];

const CSS = `
@keyframes rxnBurst {
  0%   { transform:translate(-50%,-50%) scale(0.4); opacity:1; }
  50%  { transform:translate(-50%,-50%) scale(1.6); opacity:1; }
  100% { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
}
@keyframes rxnBtnPop {
  0%,100% { transform:scale(1); }
  40%     { transform:scale(1.32); }
  70%     { transform:scale(0.92); }
}
@keyframes rxnTrayIn {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
`;
let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const s = document.createElement("style"); s.textContent = CSS;
  document.head.appendChild(s);
}

export default function StoryReactionTray({ storyId, userId, onReact }) {
  injectCSS();
  const [bursts,  setBursts]  = useState([]);  // { id, emoji, x, y }
  const [sent,    setSent]    = useState({});   // emoji → true
  const counterRef = useRef(0);

  const fire = useCallback(async (emoji, e) => {
    e.stopPropagation();

    // Particle burst
    const rect = e.currentTarget.getBoundingClientRect();
    const bid  = counterRef.current++;
    setBursts(prev => [...prev, {
      id:    bid,
      emoji,
      x:     rect.left + rect.width / 2,
      y:     rect.top  - 20,
    }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== bid)), 700);

    // Optimistic
    setSent(prev => ({ ...prev, [emoji]: true }));
    onReact?.(emoji);

    // DB
    try {
      if (storyId && userId) {
        await supabase.from("story_reactions").upsert(
          { story_id: storyId, user_id: userId, emoji },
          { onConflict: "story_id,user_id,emoji", ignoreDuplicates: true }
        );
      }
    } catch { /* silent */ }
  }, [storyId, userId, onReact]);

  return (
    <>
      {/* Reaction tray */}
      <div style={{
        position: "absolute",
        bottom:   "calc(env(safe-area-inset-bottom,20px) + 16px)",
        left:     0, right: 0,
        display:  "flex",
        justifyContent: "center",
        gap:      10,
        zIndex:   22,
        animation:"rxnTrayIn 0.28s cubic-bezier(.22,1,.36,1) both",
        pointerEvents: "all",
      }}>
        {EMOJIS.map(em => (
          <button
            key={em}
            onClick={e => fire(em, e)}
            style={{
              background: sent[em]
                ? "rgba(255,255,255,0.30)"
                : "rgba(255,255,255,0.14)",
              border: sent[em]
                ? "1.5px solid rgba(255,255,255,0.55)"
                : "1.5px solid rgba(255,255,255,0.22)",
              borderRadius: "50%",
              width:  46, height: 46,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: 22, cursor:"pointer",
              touchAction:"manipulation",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition:"all 0.16s ease",
              animation: sent[em] ? "rxnBtnPop 0.35s ease" : "none",
              willChange: "transform",
              transform: sent[em] ? "scale(1.08)" : "scale(1)",
            }}
          >{em}</button>
        ))}
      </div>

      {/* Burst particles — rendered at fixed viewport position */}
      {bursts.map(b => (
        <div
          key={b.id}
          style={{
            position: "fixed",
            left: b.x, top: b.y,
            zIndex: 23000,
            fontSize: 38,
            lineHeight: 1,
            pointerEvents: "none",
            animation: "rxnBurst 0.65s cubic-bezier(.22,1,.36,1) forwards",
            willChange: "transform, opacity",
            filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))",
          }}
        >{b.emoji}</div>
      ))}
    </>
  );
}
