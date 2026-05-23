// WirkerSpaces.jsx — Phase 24: Räume & Welten (Portal Circles)
// Circular world portals — entering another universe
import React, { useState } from "react";
import { useTap, useScrollEntry } from "../../design/hui.hooks.js";

const safeArr = (v) => (Array.isArray(v) ? v : []);

const DEFAULT_WORLDS = [
  { id: "atelier",   icon: "🎨", label: "Atelier",   sub: "Kreative Räume",     color: "#FF8A6B", img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75" },
  { id: "projekte",  icon: "✨", label: "Projekte",  sub: "Wirkung schaffen",   color: "#6366F1", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&q=75" },
  { id: "natur",     icon: "🌿", label: "Natur",     sub: "Meine Quelle",       color: "#22C55E", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=75" },
  { id: "reisen",    icon: "✈️", label: "Reisen",    sub: "Unterwegs",          color: "#0DC4B5", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=75" },
  { id: "momente",   icon: "📸", label: "Momente",   sub: "Geteilte Augenblicke", color: "#F59E0B", img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=75" },
  { id: "musik",     icon: "🎵", label: "Musik",     sub: "Klang & Ausdruck",   color: "#EC4899", img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&q=75" },
  { id: "gedanken",  icon: "💭", label: "Gedanken",  sub: "Impulse & Texte",    color: "#8B5CF6", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&q=75" },
  { id: "community", icon: "👥", label: "Community", sub: "Gemeinschaft",       color: "#0EA5E9", img: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=200&q=75" },
];

function WorldPortal({ world, onEnter }) {
  const [hovered, setHovered] = useState(false);
  const tap = useTap();

  return (
    <div
      {...tap}
      onClick={() => onEnter?.(world)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, cursor: "pointer",
        width: 76,
      }}
    >
      {/* Portal Circle */}
      <div style={{
        width: 68, height: 68,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        border: `2.5px solid ${hovered ? world.color : "rgba(0,0,0,0.08)"}`,
        boxShadow: hovered
          ? `0 0 0 4px ${world.color}20, 0 8px 24px ${world.color}30`
          : "0 3px 12px rgba(0,0,0,0.10)",
        transition: "all 0.35s ease",
        transform: hovered ? "scale(1.08)" : "scale(1)",
      }}>
        <img
          src={world.img}
          alt={world.label}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => {
            e.target.style.display = "none";
            e.target.parentNode.style.background = world.color + "30";
          }}
        />
        {/* Icon overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at center, ${world.color}55 0%, ${world.color}22 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}>{world.icon}</div>
      </div>

      {/* Label */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: hovered ? world.color : "#1A1A1A",
          transition: "color 0.3s ease",
          letterSpacing: "-0.01em",
        }}>{world.label}</div>
        <div style={{ fontSize: 9, color: "#999", lineHeight: 1.3, marginTop: 1 }}>
          {world.sub}
        </div>
      </div>
    </div>
  );
}

export default function WirkerSpaces({ spaces, onEnterSpace }) {
  const entry = useScrollEntry();
  const worlds = safeArr(spaces).length > 0 ? safeArr(spaces) : DEFAULT_WORLDS;

  return (
    <div
      ref={entry.ref}
      style={{
        width: "100%",
        background: "#F9F7F4",
        padding: "24px 0 20px",
        opacity: entry.visible ? 1 : 0,
        transform: entry.visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "0 20px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.025em" }}>
            Räume & Welten
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Tauche ein in meine verschiedenen Welten.
          </div>
        </div>
        <span style={{ fontSize: 12, color: "#0DC4B5", fontWeight: 700, cursor: "pointer" }}>
          Alle Räume →
        </span>
      </div>

      {/* Portals horizontal scroll */}
      <div style={{
        display: "flex", gap: 14,
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "4px 20px 8px",
        WebkitOverflowScrolling: "touch",
      }}>
        {worlds.map(w => (
          <WorldPortal key={w.id} world={w} onEnter={onEnterSpace} />
        ))}
        <div style={{ flexShrink: 0, width: 4 }} />
      </div>
    </div>
  );
}
