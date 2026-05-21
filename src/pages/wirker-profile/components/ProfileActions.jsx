// components/ProfileActions.jsx
// Follow-Button + Chat-Button + Book-CTA
// REGEL: Kein direkter Supabase-Write — alles via Props/Callbacks

import React from "react";

const C = {
  teal:     "#16D7C5",
  teal2:    "#11C5B7",
  tealPale: "#E6FAF8",
  coral:    "#FF8A6B",
  ink:      "#1A1A1A",
  muted:    "#888",
};

/**
 * @param {{
 *   isOwner:       boolean,
 *   followed:      boolean,
 *   followLoading: boolean,
 *   bookable:      boolean,
 *   onFollow:      fn,
 *   onChat:        fn,
 *   onBook:        fn,
 * }} props
 */
export function ProfileActions({
  isOwner, followed, followLoading, bookable,
  onFollow, onChat, onBook,
}) {
  if (isOwner) return null;

  return (
    <div style={{
      display: "flex", gap: 8,
      padding: "0 20px 16px",
    }}>
      {/* Follow */}
      <button
        onClick={onFollow}
        disabled={followLoading}
        style={{
          flex: 1,
          height: 44,
          borderRadius: 16,
          border: followed
            ? `1.5px solid rgba(22,215,197,0.35)`
            : "none",
          background: followed
            ? "rgba(22,215,197,0.08)"
            : `linear-gradient(135deg, rgba(22,215,197,0.90) 0%, rgba(17,197,183,0.90) 100%)`,
          color: followed ? C.teal2 : "#fff",
          fontSize: 14, fontWeight: 600,
          cursor: followLoading ? "default" : "pointer",
          opacity: followLoading ? 0.7 : 1,
          transition: "all 0.35s ease",
          boxShadow: followed ? "none" : "0 4px 18px rgba(22,215,197,0.22)",
          backdropFilter: followed ? "blur(8px)" : "none",
        }}
      >
        {followLoading ? "…" : followed ? "Verbunden ✦" : "Verbinden"}
      </button>

      {/* Chat */}
      <button
        onClick={onChat}
        style={{
          width: 42, height: 42,
          borderRadius: 14,
          background: "rgba(248,247,255,0.9)",
          border: "1px solid rgba(0,0,0,0.06)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
          transition: "background 0.15s",
        }}
        aria-label="Nachricht senden"
      >
        💬
      </button>

      {/* Book */}
      {bookable && (
        <button
          onClick={onBook}
          style={{
            width: 42, height: 42,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${C.coral} 0%, #ff6b4a 100%)`,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 4px 14px rgba(255,138,107,0.30)",
          }}
          aria-label="Anfragen"
        >
          📅
        </button>
      )}
    </div>
  );
}
