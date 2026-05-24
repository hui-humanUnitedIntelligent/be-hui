/**
 * ContentTypeSelector.jsx — Phase 4G
 *
 * 4 schwebende, energetische Karten.
 * Jede trägt ihre eigene Atmosphäre.
 * Hover/Tap verändert die gesamte Welt dahinter.
 *
 * Kein Grid. Kein harter Button. Kein Menü.
 * Ein Portal zu kreativer sozialer Energie.
 */

import React, { useState, useCallback } from "react";
import {
  CONTENT_DNA,
  CONTENT_TYPE_ORDER,
  MOTION,
} from "./OrbMotionSystem.js";

// ─── Einzelne Content-Karte ───────────────────────────────────────────────────
function ContentCard({
  dna,
  idx,
  hoveredKey,
  onHover,
  onLeave,
  onSelect,
  isLocked = false,
}) {
  const isHovered = hoveredKey === dna.key;
  const isDimmed  = hoveredKey !== null && hoveredKey !== dna.key;
  const delay     = `${MOTION.staggerStart + idx * MOTION.staggerBase}s`;

  return (
    <button
      className="orb-portal-card"
      onMouseEnter={() => !isLocked && onHover(dna.key)}
      onMouseLeave={() => onLeave()}
      onFocus={() => !isLocked && onHover(dna.key)}
      onBlur={() => onLeave()}
      onClick={() => !isLocked && onSelect(dna)}
      disabled={isLocked}
      style={{
        // Layout
        display:      "flex",
        alignItems:   "center",
        gap:          14,
        width:        "100%",
        padding:      "15px 18px",
        borderRadius: 20,
        border:       `1.5px solid ${isHovered ? dna.cardBorder : "rgba(255,252,248,0.14)"}`,
        cursor:       isLocked ? "not-allowed" : "pointer",
        // Background
        background:   isHovered
          ? dna.cardBg
          : "rgba(249,247,244,0.04)",
        backdropFilter:       "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        // Shadows
        boxShadow: isHovered
          ? `0 8px 32px ${dna.glow}, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 2px 12px rgba(0,0,0,0.04)",
        // Motion
        animation:  `orbCardReveal ${MOTION.cardReveal} ${delay} both`,
        transform:  isDimmed ? "scale(0.97)" : "scale(1)",
        opacity:    isLocked ? 0.32 : isDimmed ? 0.42 : 1,
        transition: [
          `opacity ${MOTION.atmosShift}`,
          `transform ${MOTION.atmosShift}`,
          `box-shadow 0.32s ease`,
          `background 0.32s ease`,
          `border-color 0.32s ease`,
        ].join(", "),
        // Reset button styles
        textAlign:  "left",
        outline:    "none",
        WebkitTapHighlightColor: "transparent",
        position:   "relative",
        overflow:   "hidden",
      }}
    >
      {/* Pulse Ring bei Hover */}
      {isHovered && (
        <div style={{
          position:     "absolute",
          inset:        -2,
          borderRadius: 22,
          border:       `1.5px solid ${dna.accentColor}`,
          animation:    "orbPortalRingPulse 2.4s ease-in-out infinite",
          pointerEvents:"none",
        }} />
      )}

      {/* Icon Container */}
      <div style={{
        flexShrink:   0,
        width:        48, height: 48,
        borderRadius: 14,
        background:   isHovered
          ? `linear-gradient(145deg, ${dna.accentColor}22 0%, ${dna.accentColor}0a 100%)`
          : "rgba(255,252,248,0.06)",
        border:       `1.5px solid ${isHovered ? dna.cardBorder : "rgba(255,252,248,0.10)"}`,
        display:      "flex",
        alignItems:   "center",
        justifyContent:"center",
        fontSize:     21,
        transition:   `all 0.32s ease`,
        boxShadow:    isHovered
          ? `0 4px 16px ${dna.glow}`
          : "none",
      }}>
        <span style={{
          background:   isHovered ? dna.accentGrad : "rgba(255,252,248,0.7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: isHovered ? "transparent" : "rgba(255,252,248,0.7)",
          fontSize:     22,
          fontWeight:   300,
          letterSpacing:"-0.01em",
          display:      "block",
          lineHeight:   1,
          transition:   "all 0.32s ease",
        }}>
          {dna.icon}
        </span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:      15,
          fontWeight:    600,
          color:         isHovered ? dna.accentColor : "rgba(255,252,248,0.90)",
          letterSpacing: "-0.02em",
          lineHeight:    1.2,
          marginBottom:  3,
          transition:    "color 0.28s ease",
        }}>
          {dna.label}
        </div>
        <div style={{
          fontSize:      12,
          color:         isHovered
            ? `${dna.accentColor}aa`
            : "rgba(255,252,248,0.40)",
          letterSpacing: "-0.01em",
          lineHeight:    1.35,
          transition:    "color 0.28s ease",
          fontStyle:     "normal",
        }}>
          {dna.tagline}
        </div>
        {/* Energie-Label — erscheint nur bei Hover */}
        <div style={{
          fontSize:   10,
          color:      `${dna.accentColor}88`,
          letterSpacing: "0.04em",
          marginTop:  4,
          fontWeight: 500,
          opacity:    isHovered ? 1 : 0,
          transform:  isHovered ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
          textTransform:"uppercase",
        }}>
          {dna.energy}
        </div>
      </div>

      {/* Chevron */}
      <div style={{
        flexShrink: 0,
        fontSize:   12,
        color:      isHovered ? dna.accentColor : "rgba(255,252,248,0.22)",
        opacity:    isHovered ? 1 : 0.5,
        transform:  isHovered ? "translateX(2px)" : "translateX(0)",
        transition: "all 0.28s ease",
      }}>
        ›
      </div>
    </button>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export function ContentTypeSelector({ onSelect, isTalent = false }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  const handleHover  = useCallback((key) => setHoveredKey(key), []);
  const handleLeave  = useCallback(()    => setHoveredKey(null), []);
  const handleSelect = useCallback((dna) => onSelect?.(dna), [onSelect]);

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      gap:           10,
      width:         "100%",
      padding:       "0 4px",
    }}>
      {CONTENT_TYPE_ORDER.map((key, idx) => {
        const dna    = CONTENT_DNA[key];
        const locked = !isTalent && (key === "experience" || key === "work");
        return (
          <ContentCard
            key={key}
            dna={dna}
            idx={idx}
            hoveredKey={hoveredKey}
            onHover={handleHover}
            onLeave={handleLeave}
            onSelect={handleSelect}
            isLocked={locked}
          />
        );
      })}
    </div>
  );
}
