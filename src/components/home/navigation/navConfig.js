// navigation/navConfig.js — HUI Navigation v2
// TAB STRUCTURE: Home / Entdecken / HUI Orb / Impact / Creator
// "Creator" replaces "Profil" — this is YOUR center, not just your profile

import { createNavItem } from "../../../lib/factories/createNavItem.js";
import { filterValidPages } from "../../../lib/factories/createTabPage.js";

export const NAV_ITEMS = filterValidPages([
  createNavItem({ key: "feed",      label: "Home"      }),
  createNavItem({ key: "discover",  label: "Entdecken" }),
  createNavItem({ key: "orb",       label: "",  isOrb: true }),  // Create orb
  createNavItem({ key: "impact",    label: "Impact"    }),
  createNavItem({ key: "creator",   label: "Creator"   }),       // Creator Dashboard (not "Profil")
]);

// Tabs die im Keep-Alive Modus bleiben
export const KEEP_ALIVE_TABS = ["feed", "discover", "impact"];

// Tabs die echte Seiten sind
export const PAGE_TABS = ["feed", "discover", "impact"];

// Overlay-Tabs (öffnen eigene Systeme, kein Tab-Switch)
export const OVERLAY_TABS = ["creator"];
