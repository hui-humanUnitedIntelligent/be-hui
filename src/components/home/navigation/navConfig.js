// navigation/navConfig.js — HUI Navigation v2
// TAB STRUCTURE: Entdecken / Home / HUI Orb / Impact / Mein HUI
// NAV.1A Audit: feed = globaler Community-Stream → Label "Entdecken"
//               discover = strukturierter Sektions-Browse → Label "Home"
// KEYS bleiben unverändert (Analytics, Deep Links, sessionStorage unberührt)

import { createNavItem } from "../../../lib/factories/createNavItem.js";
import { filterValidPages } from "../../../lib/factories/createTabPage.js";

export const NAV_ITEMS = filterValidPages([
  createNavItem({ key: "feed",      label: "Entdecken" }),
  createNavItem({ key: "discover",  label: "Home"      }),
  createNavItem({ key: "orb",       label: "",  isOrb: true }),  // Create orb
  createNavItem({ key: "impact",    label: "Impact"    }),
  createNavItem({ key: "creator",   label: "Mein HUI"  }),       // Persönlicher Bereich (Profil, Werke, Buchungen, …)
]);

// Tabs die im Keep-Alive Modus bleiben
export const KEEP_ALIVE_TABS = ["feed", "discover", "impact"];

// Tabs die echte Seiten sind
export const PAGE_TABS = ["feed", "discover", "impact"];

// Overlay-Tabs (öffnen eigene Systeme, kein Tab-Switch)
export const OVERLAY_TABS = ["creator"];
