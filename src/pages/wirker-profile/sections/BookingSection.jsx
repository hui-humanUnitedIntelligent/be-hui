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
      padding: "10px 20px 28px",
      background: "rgba(254,252,250,0.97)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(0,0,0,0.05)",
    }}>
      {/* Subtiles Vertrauenssignal */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:5,
        marginBottom:8,
        fontSize:11, color:"rgba(80,80,80,0.50)", fontWeight:500,
      }}>
        <span style={{ color:"rgba(22,215,197,0.70)" }}>✦</span>
        <span>Sicher begleitet durch HUI</span>
        <span style={{ color:"rgba(22,215,197,0.70)" }}>✦</span>
      </div>
      <button
        onClick={onBook}
        style={{
          width: "100%", height: 52,
          borderRadius: 18,
          background: `linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
          color: "#fff", border: "none",
          fontSize: 15, fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 5px 18px rgba(22,215,197,0.22)",
          letterSpacing: -0.2,
        }}
      >
        Begegnung mit {name} öffnen ❖
      </button>
    </div>
  );
}
