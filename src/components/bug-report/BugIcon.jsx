// BugIcon.jsx — Bug-Käfer Icon für Fehlermeldungs-System (2026-08-19)
// SVG Bug-Symbol, ~25px, matching WerkeKorb-Button sizing
import React from "react";

export default function BugIcon({ size = 25, color = "#5B6B7D", opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <ellipse cx="16" cy="18" rx="7" ry="9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="9" r="3.5" fill="none" stroke={color} strokeWidth="2" />
      <path d="M13 6.5 L10 3 M19 6.5 L22 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 14 L4 11 M9 18 L3 18 M9 22 L4 25" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M23 14 L28 11 M23 18 L29 18 M23 22 L28 25" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 12 L16 27" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
