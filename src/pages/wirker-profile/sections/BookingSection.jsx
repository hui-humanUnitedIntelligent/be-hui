// sections/BookingSection.jsx
// Floating Booking CTA am unteren Rand
// REGEL: Nur sichtbar wenn !isOwner && bookable

import React from "react";

const C = {
  teal:  "#16D7C5",
  teal2: "#11C5B7",
  coral: "#FF8A6B",
  ink:   "#1A1A1A",
};

/**
 * @param {{
 *   isOwner:  boolean,
 *   bookable: boolean,
 *   profile:  object|null,
 *   onBook:   fn,
 * }} props
 */
export function BookingSection({ isOwner, bookable, profile, onBook }) {
  if (isOwner || !bookable) return null;

  const name = profile?.display_name?.split(" ")[0] || "Creator";

  return (
    <div style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      zIndex: 80,
      padding: "12px 20px 28px",
      background: "rgba(254,252,250,0.95)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(0,0,0,0.07)",
    }}>
      <button
        onClick={onBook}
        style={{
          width: "100%", height: 50,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
          color: "#fff", border: "none",
          fontSize: 15, fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 6px 22px rgba(22,215,197,0.35)",
          letterSpacing: -0.2,
        }}
      >
        Anfrage an {name} senden
      </button>
    </div>
  );
}
