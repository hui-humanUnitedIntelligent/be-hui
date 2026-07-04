/**
 * BottomSurface — AppShell chrome layer behind HUIBottomNavigation
 *
 * Renders the light cream background strip that the tab bar sits on.
 * Lives exactly once in the AppShell (Home.jsx) — never per-page.
 *
 * All main tabs (Entdecken, Home, Impact, Profil) share this surface
 * automatically via the shell layout; individual pages must not draw
 * their own bottom strip.
 */
import React from "react";
import { HUI } from "../../../design/hui.design.js";
import { NAV_CLEARANCE_CSS } from "./navigationGeometry.js";

export default function BottomSurface() {
  return (
    <div
      data-hui-bottom-surface=""
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: NAV_CLEARANCE_CSS,
        background: HUI.COLOR.creamSoft,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
