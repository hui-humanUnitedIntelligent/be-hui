// navigation/navConfig.js — HUI Bottom Navigation Config

export const NAV_ITEMS = [
  { key:"feed",     label:"Home"      },
  { key:"impact",   label:"Impact"    },
  null,                                  // Orb-Slot
  { key:"discover", label:"Entdecken" },
  { key:"profile",  label:"Profil"    },
];

// Tabs die im Keep-Alive Modus bleiben (nie unmounten)
export const KEEP_ALIVE_TABS = ["feed", "discover",         "impact", "favorites"];

// Tabs die "echte" Seiten sind (nicht Overlays)
export const PAGE_TABS = ["feed", "discover", "impact", "favorites"];

// "profile" ist kein echter Tab — öffnet Overlay
export const OVERLAY_TABS = ["profile"];
