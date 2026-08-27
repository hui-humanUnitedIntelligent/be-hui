/**
 * PullToRefreshIndicator — dezenter Refresh-Spinner oben
 *
 * Zeigt sich nur wenn pullDistance > 0 oder isRefreshing.
 * Transformiert sich mit dem Pull mit (translateY) → natives Feeling.
 */
import React from "react";

const MAX_PULL     = 110;
const THRESHOLD    = 72;
const TEAL         = "#0EC4B8";

export function PullToRefreshIndicator({ pullDistance, isRefreshing, isTriggered }) {
  const visible    = pullDistance > 0 || isRefreshing;
  if (!visible) return null;

  // Fortschritt 0→1 während des Pullens
  const progress   = Math.min(pullDistance / THRESHOLD, 1);
  // Kreis-Stroke-Dash — füllt sich während des Pullens
  const circumference = 2 * Math.PI * 11; // r=11
  const strokeDash    = circumference * progress;

  // Indikator bewegt sich mit dem Pull
  const translateY = isRefreshing
    ? 16                        // fixierte Position während Refresh
    : Math.max(0, pullDistance - 20); // folgt dem Finger

  const opacity = isRefreshing ? 1 : Math.min(progress * 1.4, 1);
  const scale   = isRefreshing ? 1 : 0.7 + 0.3 * progress;

  return (
    <div
      aria-hidden="true"
      style={{
        position:        "absolute",
        top:             0,
        left:            0,
        right:           0,
        display:         "flex",
        justifyContent:  "center",
        pointerEvents:   "none",
        zIndex:          9000,
        transform:       `translateY(${translateY}px)`,
        transition:      isRefreshing
          ? "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)"
          : "none",
      }}
    >
      <div style={{
        width:           36,
        height:          36,
        borderRadius:    "50%",
        background:      "rgba(249,247,244,0.95)",
        boxShadow:       "0 2px 12px rgba(0,0,0,0.12)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        opacity,
        transform:       `scale(${scale})`,
        transition:      isRefreshing
          ? "opacity 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)"
          : "none",
      }}>
        {isRefreshing ? (
          /* Spinning Ring während Refresh läuft */
          <>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle
                cx="11" cy="11" r="9"
                stroke="rgba(14,196,184,0.18)"
                strokeWidth="2.5"
              />
              <circle
                cx="11" cy="11" r="9"
                stroke={TEAL}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="20 48"
                style={{ animation: "ptr-spin 0.75s linear infinite" }}
              />
            </svg>
            <style>{`
              @keyframes ptr-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
              circle { transform-origin: 11px 11px; }
            `}</style>
          </>
        ) : (
          /* Fortschritts-Ring während des Pullens */
          <svg
            width="22" height="22" viewBox="0 0 22 22" fill="none"
            style={{
              transform:  `rotate(${-90 + 360 * progress}deg)`,
              transition: "none",
            }}
          >
            <circle
              cx="11" cy="11" r="11"
              stroke="rgba(14,196,184,0.12)"
              strokeWidth="2"
            />
            <circle
              cx="11" cy="11" r="11"
              stroke={isTriggered ? "#0aada3" : TEAL}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeDashoffset="0"
              transform="rotate(-90 11 11)"
              style={{ transition: "stroke 0.15s" }}
            />
            {/* Pfeil nach unten → zeigt an "loslassen zum Laden" */}
            {progress >= 0.9 && (
              <path
                d="M11 7 L11 15 M7.5 11.5 L11 15 L14.5 11.5"
                stroke={TEAL}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
