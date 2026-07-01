/**
 * navGeometry.js — Single source of truth for Bottom Navigation layout.
 * Used by BottomNav (rendering) and Home (feed padding).
 */

export const TAB_H    = 96;
export const MARGIN_H = 12;
export const SAFE_B   = 14;
export const ORB_D    = 102;
export const ORB_R    = ORB_D / 2;
export const GAP      = 7;
export const NOTCH_R  = ORB_R + GAP + 24;
export const CORNER_R = 28;
export const SINK     = 24;

/** Orb protrusion above tab-bar top edge (px). */
export const ORB_PROTRUSION = ORB_R + GAP - SINK;

/** Total navigation content height above safe-area (px). */
export const NAV_CONTENT_H = TAB_H + ORB_PROTRUSION;

/** Breathing room between feed content and orb top edge (px). */
export const FEED_BOTTOM_GAP = 8;

/** CSS value for scroll-container padding-bottom. */
export const FEED_PADDING_BOTTOM = `calc(max(${SAFE_B}px, env(safe-area-inset-bottom, ${SAFE_B}px)) + ${NAV_CONTENT_H + FEED_BOTTOM_GAP}px)`;

/** Orb bottom offset from nav inner container bottom (px). */
export const ORB_BOTTOM = TAB_H - ORB_R + GAP - SINK;
