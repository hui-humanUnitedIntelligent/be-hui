/**
 * FeedSoftHydrationBadge — Phase 4F
 *
 * Erscheint ruhig oben im Feed wenn neue Items warten.
 * Kein hektischer Pop. Kein Auto-Refresh.
 * User entscheidet: Tap → sanfter Insert.
 *
 * Atmosphäre: subtile Pille, dezentes Glow — nicht laut.
 */

import { useEffect, useRef } from "react";

export function FeedSoftHydrationBadge({ count, onFlush }) {
  const prevCount = useRef(0);

  useEffect(() => {
    prevCount.current = count;
  }, [count]);

  if (count === 0) return null;

  const label = count === 1
    ? "1 neuer Moment"
    : `${count} neue Inhalte`;

  return (
    <div
      onClick={onFlush}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onFlush?.()}
      style={{
        position:        "sticky",
        top:             12,
        zIndex:          200,
        display:         "flex",
        justifyContent:  "center",
        pointerEvents:   "all",
        marginBottom:    8,
        // Sanftes Einblenden
        animation:       "huiFadeSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <div style={{
        display:         "flex",
        alignItems:      "center",
        gap:             7,
        padding:         "9px 18px",
        borderRadius:    40,
        background:      "rgba(13,196,181,0.12)",
        backdropFilter:  "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border:          "1px solid rgba(13,196,181,0.25)",
        boxShadow:       "0 4px 20px rgba(13,196,181,0.12)",
        cursor:          "pointer",
        userSelect:      "none",
        WebkitTapHighlightColor: "transparent",
      }}>
        {/* Pulsierender Dot */}
        <span style={{
          display:      "block",
          width:        7,
          height:       7,
          borderRadius: "50%",
          background:   "linear-gradient(135deg, #0DC4B5, #16D7C5)",
          animation:    "huiSoftPulse 2s ease-in-out infinite",
        }} />
        <span style={{
          fontSize:    13,
          fontWeight:  600,
          color:       "#0DC4B5",
          letterSpacing: -0.2,
        }}>
          {label}
        </span>
        {/* Pfeil nach unten */}
        <span style={{
          fontSize: 11,
          color:    "rgba(13,196,181,0.7)",
          marginLeft: 2,
        }}>↓</span>
      </div>

      <style>{`
        @keyframes huiFadeSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes huiSoftPulse {
          0%,100% { opacity: 1;   transform: scale(1);    }
          50%      { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
