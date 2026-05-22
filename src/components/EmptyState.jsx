// src/components/EmptyState.jsx — HUI World Polish v1
// Every empty area feels intentional — never "broken".
// Atmospheric stillness, not a UI error state.

import React from "react";
import { emptyStateFromWorld, WORLD_CSS } from "../lib/intelligence/worldPolish.js";

/**
 * @param {object} props
 * @param {string}      props.icon       — emoji or symbol
 * @param {string}      props.label      — short atmospheric text (overrides world default)
 * @param {string}      [props.sub]      — secondary text
 * @param {string}      [props.context]  — "feed" | "discover" | "profile" | "spaces"
 * @param {WorldState}  [props.worldState]
 */
function EmptyState({ icon, label, sub, context = "feed", worldState = null }) {
  const tokens = emptyStateFromWorld(worldState, context);

  const displayLabel = label || tokens.text;
  const displaySub   = sub   || tokens.subText;

  return (
    <>
      <style>{`
        @keyframes worldStillness {
          0%,100% { opacity:var(--still-lo,0.20); transform:scale(1);    }
          50%     { opacity:var(--still-hi,0.32); transform:scale(1.04); }
        }
      `}</style>
      <div style={{
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        justifyContent:"center",
        padding:       "60px 28px",
        textAlign:     "center",
        position:      "relative",
        overflow:      "hidden",
        background:    tokens.bgGradient,
      }}>
        {/* Ambient glow — barely visible atmospheric field */}
        <div style={{
          position:     "absolute",
          top:"50%", left:"50%",
          transform:    "translate(-50%,-60%)",
          width:        280, height:200,
          borderRadius: "50%",
          background:   `radial-gradient(ellipse, ${tokens.accentGlow} 0%, transparent 70%)`,
          pointerEvents:"none",
          zIndex:0,
        }}/>

        {/* Icon — breathes slowly */}
        {icon && (
          <div style={{
            fontSize:    40,
            opacity:     tokens.iconOpacity,
            marginBottom:16,
            position:    "relative", zIndex:1,
            animation:   `worldStillness ${tokens.floatPeriod} ease-in-out infinite`,
            "--still-lo":"0.18",
            "--still-hi":"0.28",
          }}>
            {icon}
          </div>
        )}

        {/* Label */}
        <div style={{
          fontWeight:   600,
          fontSize:     15,
          color:        "rgba(30,30,30,0.62)",
          lineHeight:   1.4,
          marginBottom: displaySub ? 8 : 0,
          position:     "relative", zIndex:1,
          letterSpacing:"-0.01em",
        }}>
          {displayLabel}
        </div>

        {/* Sub — very quiet */}
        {displaySub && (
          <div style={{
            fontSize:     12.5,
            color:        "rgba(80,80,80,0.40)",
            lineHeight:   1.6,
            maxWidth:     240,
            position:     "relative", zIndex:1,
            fontWeight:   400,
          }}>
            {displaySub}
          </div>
        )}
      </div>
    </>
  );
}

export default EmptyState;
