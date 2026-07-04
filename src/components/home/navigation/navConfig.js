// navigation/navConfig.js — HUI Navigation v2 (NAV-001)
// TAB STRUCTURE: Entdecken / Home / Mein HUI (Orb) / Impact / Profil
// NAV.1A Audit: feed = globaler Community-Stream → Label "Entdecken"
//               discover = strukturierter Sektions-Browse → Label "Home"
//
// NAVIGATION CONTRACTS (NAV-001):
//   Tab-Keys sind unveränderlich (Analytics, sessionStorage, Deep Links).
//   Label-Änderungen erfolgen ausschließlich hier.
//   Tab-Logik liegt ausschließlich in HomeShell.handleTab().
//
// TAB-KEY → VERHALTEN:
//   feed     → switchTab("feed")           — UnifiedFeed, schließt Overlays
//   discover → switchTab("discover")       — DiscoverPage, schließt Overlays
//   orb      → onOrbAction("create")       — OrbCompass Overlay, kein Tab-Switch
//   impact   → _setTab("impact")           — ImpactPage, schließt Overlays NICHT
//   creator  → switchTab("creator")        — ProfilePage (AppShell-Tab)
//
// HINWEIS: "creator" ist der interne State-Key für den "Profil"-Tab.

import { createNavItem } from "../../../lib/factories/createNavItem.js";
import { filterValidPages } from "../../../lib/factories/createTabPage.js";

export const NAV_ITEMS = filterValidPages([
  createNavItem({ key: "feed",      label: "Entdecken" }),
  createNavItem({ key: "discover",  label: "Home"      }),
  createNavItem({ key: "orb",       label: "Mein HUI",  isOrb: true }),  // Persönlicher HUI-Bereich
  createNavItem({ key: "impact",    label: "Impact"    }),
  createNavItem({ key: "creator",   label: "Profil"    }),
]);

// Tabs die im Keep-Alive Modus bleiben
export const KEEP_ALIVE_TABS = ["feed", "discover", "impact", "creator"];

// Tabs die echte AppShell-Seiten sind
export const PAGE_TABS = ["feed", "discover", "impact", "creator"];
