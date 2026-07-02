/**
 * AppShell Layout — Single Source of Truth
 *
 * Zentrale Konstanten für alle fünf Hauptbereiche:
 * Entdecken · Home · Mein HUI · Impact · Profil
 *
 * Änderungen an Safe Area, Hintergrund, Abständen oder Nav-Clearance
 * wirken automatisch auf alle Bereiche.
 */
import {
  NAV_RESERVED_HEIGHT_CSS,
  NAV_CLEARANCE_CSS,
  NAV_SAFE_BOTTOM_CSS,
} from "../navigation/navigationGeometry.js";

/** Seitenhintergrund — identisch für Shell und alle Hauptbereiche */
export const APP_SHELL_PAGE_BG = "#F9F7F4";

/** Safe-Area: oben (Header nutzt env direkt, Overlays nutzen Padding-Variante) */
export const SAFE_AREA_TOP_CSS = "env(safe-area-inset-top, 0px)";

/** Safe-Area Top-Padding für Overlay-Bereiche (Mein HUI, Profil) */
export const OVERLAY_SAFE_TOP_CSS =
  "max(14px, env(safe-area-inset-top, 14px))";

/** Safe-Area Top-Padding für Profil-Seite (ersetzt Header-Zone) */
export const PROFILE_SAFE_TOP_CSS =
  "max(52px, calc(48px + env(safe-area-inset-top, 0px)))";

/** Safe-Area unten — innerhalb der Bottom Navigation */
export const SAFE_AREA_BOTTOM_CSS = NAV_SAFE_BOTTOM_CSS;

/** Scroll-Clearance oberhalb der Bottom Navigation (In-Flow-Tabs) */
export const CONTENT_NAV_CLEARANCE_CSS = NAV_RESERVED_HEIGHT_CSS;

/** Scroll-Clearance für Fullscreen-Overlays (Mein HUI, Profil) */
export const OVERLAY_NAV_CLEARANCE_CSS = NAV_RESERVED_HEIGHT_CSS;

/** Volle optische Nav-Zone inkl. Orb-Überhang (Floating-Elemente) */
export const FULL_NAV_CLEARANCE_CSS = NAV_CLEARANCE_CSS;

/** Standard horizontales Seiten-Padding */
export const CONTENT_PADDING_X = 20;

/** AppShell Root — 100dvh Flex-Säule */
export const APP_SHELL_ROOT_STYLE = {
  height: "100dvh",
  display: "flex",
  flexDirection: "column",
  background: APP_SHELL_PAGE_BG,
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
};

/** AppShell Scroll-Container — flex:1, Touch-Scroll */
export const APP_SHELL_SCROLL_STYLE = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  position: "relative",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
};

/** Overlay-Scroll-Inhalt — Standard-Padding für Overlay-Bereiche */
export const overlayContentStyle = (variant = "default") => ({
  paddingTop: variant === "profile" ? PROFILE_SAFE_TOP_CSS : OVERLAY_SAFE_TOP_CSS,
  paddingBottom: OVERLAY_NAV_CLEARANCE_CSS,
  width: "100%",
});
