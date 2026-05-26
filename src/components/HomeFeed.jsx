// HomeFeed.jsx — LEGACY STUB (Phase 2B: Legacy Purge)
// ═══════════════════════════════════════════════════════════════
// ALL rendering has moved to:
//   src/feed/UnifiedFeed.jsx
//   src/feed/FeedStoriesBar.jsx
//   src/feed/FeedEventsSection.jsx
//   src/feed/cards/FeedRouter.jsx
//
// This file is kept ONLY to avoid breaking any import that
// might still reference it. It renders NOTHING.
//
// DO NOT RE-ACTIVATE any component in this file.
// ═══════════════════════════════════════════════════════════════

import React from "react";

// ── LEGACY GUARD ─────────────────────────────────────────────
// If this component ever mounts, it means a legacy path is active.
// It will render a visible warning instead of the old feed.

export default function HomeFeed(props) {
  console.warn("[LEGACY_RENDER_ATTEMPT] HomeFeed mounted — this is a bug. Switch to UnifiedFeed.", props);
  if (process.env.NODE_ENV === "development") {
    return (
      <div style={{
        padding: 24,
        margin: 16,
        background: "rgba(255,107,107,0.10)",
        border: "2px dashed #FF6B6B",
        borderRadius: 16,
        color: "#FF6B6B",
        fontSize: 13,
        fontWeight: 700,
        textAlign: "center",
      }}>
        ⛔ LEGACY: HomeFeed — Migrate to &lt;UnifiedFeed /&gt;
      </div>
    );
  }
  // In production: render nothing — silent
  return null;
}

// Named exports that other files might import
// All return null silently
export function StepTwoFeed()   {
  console.warn("[LEGACY_RENDER_ATTEMPT] StepTwoFeed mounted");
  return null;
}
export function RhythmicFeed()  {
  console.warn("[LEGACY_RENDER_ATTEMPT] RhythmicFeed mounted");
  return null;
}
export function RhythmCard()    {
  console.warn("[LEGACY_RENDER_ATTEMPT] RhythmCard (HomeFeed) mounted");
  return null;
}
export function StoryLeiste()   {
  console.warn("[LEGACY_RENDER_ATTEMPT] StoryLeiste mounted");
  return null;
}
