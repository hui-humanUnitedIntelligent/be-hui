// navigation/navConfig.js — HUI Navigation v2 (NAV-001)
// TAB STRUCTURE: Entdecken / Home / Mein HUI (Orb) / Impact / Profil
// NAV.1A Audit: discover = strukturierter Sektions-Browse → Label "Entdecken" (Position 1)
//               feed     = globaler Community-Stream     → Label "Home"       (Position 2)
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
//   creator  → openCreatorDashboard()      — ProfileLauncher Overlay, Tab=creator
//
// HINWEIS: "creator" ist der interne State-Key für den "Profil"-Tab.
// HINWEIS: hui_mein_hui_open (sessionStorage) = Legacy-Key, zeigt creator-Overlay-State.

import { createNavItem } from "../../../lib/factories/createNavItem.js";
import { filterValidPages } from "../../../lib/factories/createTabPage.js";

export const NAV_ITEMS = filterValidPages([
  createNavItem({ key: "discover",  label: "Entdecken" }),
  createNavItem({ key: "feed",      label: "Home"      }),
  createNavItem({ key: "orb",       label: "Mein HUI",  isOrb: true }),  // Persönlicher HUI-Bereich
  createNavItem({ key: "impact",    label: "Impact"    }),
  createNavItem({ key: "creator",   label: "Profil"    }),       // Persönlicher Bereich (Profil, Werke, Buchungen, …)
]);

// Tabs die im Keep-Alive Modus bleiben
export const KEEP_ALIVE_TABS = ["feed", "discover", "impact"];

// Tabs die echte Seiten sind
export const PAGE_TABS = ["feed", "discover", "impact"];

// Overlay-Tabs (öffnen eigene Systeme, kein Tab-Switch)
export const OVERLAY_TABS = ["creator"];
