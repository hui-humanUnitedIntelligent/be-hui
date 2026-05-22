// navigation/navConfig.js — HUI Bottom Navigation Config
// Alle Items über createNavItem Factory — typsicher, normalisiert, crash-proof

import { createNavItem } from "../../../lib/factories/createNavItem.js";

export const NAV_ITEMS = [
  createNavItem({ key: "feed",     label: "Home"       }),
  createNavItem({ key: "impact",   label: "Impact"     }),
  createNavItem({ key: "orb",      label: "",   isOrb: true }),   // Orb-Slot
  createNavItem({ key: "discover", label: "Entdecken"  }),
  createNavItem({ key: "profile",  label: "Profil"     }),
];

// Tabs die im Keep-Alive Modus bleiben (nie unmounten)
export const KEEP_ALIVE_TABS = ["feed", "discover", "impact", "favorites"];

// Tabs die "echte" Seiten sind (nicht Overlays)
export const PAGE_TABS = ["feed", "discover", "impact", "favorites"];

// "profile" ist kein echter Tab — öffnet Overlay
export const OVERLAY_TABS = ["profile"];
