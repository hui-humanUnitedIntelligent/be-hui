// components/ProfileHeader.jsx
// Sticky Top-Bar: Back-Button, Share, More-Menu
// REGEL: Kein State, rein presentational

import React from "react";
import { HUI } from "../../../design/hui.design.js";

const C = {
  teal: HUI.COLOR.teal,
  ink:  HUI.COLOR.ink,
  card: "#FFFFFF",
};

/**
 * @param {{ onClose: fn, onMore: fn, isOwner: boolean, heroLoaded: boolean }} props
 */
export function ProfileHeader({ onClose, onMore, isOwner, heroLoaded }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      background: heroLoaded
        ? "rgba(255,255,255,0.0)"
        : "rgba(254,252,250,0.95)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      transition: "background 0.3s ease",
    }}>
      {/* Back */}
      <button
        onClick={onClose}
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(8px)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: C.ink,
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        }}
        aria-label="Zurück"
      >
        ‹
      </button>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: C.ink,
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          }}
          aria-label="Teilen"
        >
          ↑
        </button>
        <button
          onClick={onMore}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: C.ink,
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          }}
          aria-label="Mehr"
        >
          ···
        </button>
      </div>
    </div>
  );
}
