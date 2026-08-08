// ═══════════════════════════════════════════════════════════════
// src/components/shared/EmojiIcon.jsx — Consistent Emoji Rendering (2026-08-08)
// ═══════════════════════════════════════════════════════════════
// Löst: Emojis rendern unterschiedlich auf iOS/Android/older devices.
// Manche Emojis erschenen als leere Boxen oder unvollständig.
//
// Lösung: Wrapt Emojis in ein span mit expliziter Emoji-Font-Familie
// und sizing. Für kritische UI-Emojis können SVG-Icons als Fallback dienen.
//
// Usage:
//   <EmojiIcon emoji="✅" size={18} />
//   <EmojiIcon emoji="🗑" size={16} fallback={<TrashIcon size={16}/>} />
// ═══════════════════════════════════════════════════════════════

import React from "react";

export function EmojiIcon({ emoji = "", size = 18, fallback = null, style = {} }) {
  return (
    <span
      className="hui-emoji"
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif',
        fontVariantEmoji: "emoji",
        ...style,
      }}
    >
      {emoji || fallback}
    </span>
  );
}

// ── Pre-configured UI emojis with safe fallbacks ──────────────
// These emojis are commonly used in HUI UI and may not render on all devices
import { HUIMailIcon } from "../design/icons/HuiSystemIcons.jsx";

export function SafeEmoji({ type = "", size = 18, style = {} }) {
  const map = {
    // Status emojis
    approved: { emoji: "✅", color: "#0DC4B5" },
    rejected: { emoji: "❌", color: "#F47355" },
    deleted:  { emoji: "🗑", color: "#898998" },
    // Category emojis
    art:      { emoji: "🎨", color: "#F5A623" },
    nature:   { emoji: "🌿", color: "#0DC4B5" },
    seedling: { emoji: "🌱", color: "#0DC4B5" },
    earth:    { emoji: "🌍", color: "#3B82F6" },
    heart:    { emoji: "💚", color: "#0DC4B5" },
    vote:     { emoji: "🗳", color: "#0DC4B5" },
    calendar: { emoji: "📅", color: "#898998" },
    refresh:  { emoji: "🔄", color: "#0DC4B5" },
    clipboard:{ emoji: "📋", color: "#898998" },
    paperclip:{ emoji: "📎", color: "#898998" },
    location: { emoji: "📍", color: "#F47355" },
    star:     { emoji: "⭐", color: "#F5A623" },
    warning:  { emoji: "⚠", color: "#F47355" },
    people:   { emoji: "👥", color: "#3B82F6" },
    handshake:{ emoji: "🤝", color: "#0DC4B5" },
    search:   { emoji: "🔍", color: "#898998" },
  };
  
  const cfg = map[type] || { emoji: type, color: "inherit" };
  
  return (
    <span
      className="hui-emoji"
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif',
        fontVariantEmoji: "emoji",
        ...style,
      }}
    >
      {cfg.emoji}
    </span>
  );
}
