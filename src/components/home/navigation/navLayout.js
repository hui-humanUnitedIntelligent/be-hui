/**
 * navLayout.js — Single source of truth for BottomNav layout geometry.
 * Used by BottomNav (in-flow footer) and floating elements that sit above the nav.
 */

export const NAV_TAB_H = 96;
export const NAV_MARGIN_H = 12;
export const NAV_SAFE_B = 14;
export const NAV_ORB_D = 102;
export const NAV_ORB_R = NAV_ORB_D / 2;
export const NAV_GAP = 7;
export const NAV_SINK = 24;
export const NAV_NOTCH_R = NAV_ORB_R + NAV_GAP + 24;
export const NAV_CORNER_R = 28;

/** Portion of the Orb that extends above the tab bar top edge. */
export const NAV_ORB_PROTRUSION = NAV_ORB_R + NAV_GAP - NAV_SINK;

/** Total reserved height of the bottom-nav footer in the page layout. */
export const NAV_LAYOUT_HEIGHT_CSS =
  `calc(${NAV_ORB_PROTRUSION}px + ${NAV_TAB_H}px + max(${NAV_SAFE_B}px, env(safe-area-inset-bottom, ${NAV_SAFE_B}px)))`;
