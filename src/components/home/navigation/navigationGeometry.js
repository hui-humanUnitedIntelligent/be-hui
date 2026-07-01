/**
 * HUIBottomNavigation — shared geometry constants
 * Single source of truth for nav dimensions, SVG path, and clearance height.
 */

export const NAV_GEOMETRY = Object.freeze({
  TAB_H:    96,
  MARGIN_H: 12,
  SAFE_B:   14,
  ORB_D:    102,
  GAP:      7,
  CORNER_R: 28,
  /** ~30 % of orb sits inside the organic notch */
  SINK_RATIO: 0.30,
});

const { TAB_H, GAP, CORNER_R, SINK_RATIO } = NAV_GEOMETRY;

export const ORB_D   = NAV_GEOMETRY.ORB_D;
export const ORB_R   = ORB_D / 2;
export const SINK    = Math.round(ORB_D * SINK_RATIO);
export const NOTCH_R = ORB_R + GAP + 24;

/** Visible orb height above the bar surface */
export const ORB_OVERHANG = ORB_D - SINK;

/** Total nav block height excluding safe-area (orb overhang + bar) */
export const NAV_BLOCK_HEIGHT = ORB_OVERHANG + TAB_H;

/** CSS value for feed clearance — used by fixed overlays (WerkeKorb, toasts) */
export const NAV_CLEARANCE_CSS =
  `calc(${NAV_BLOCK_HEIGHT}px + max(${NAV_GEOMETRY.SAFE_B}px, env(safe-area-inset-bottom, ${NAV_GEOMETRY.SAFE_B}px)))`;

/** CSS value for nav container total height */
export const NAV_CONTAINER_HEIGHT_CSS =
  `calc(${NAV_BLOCK_HEIGHT}px + max(${NAV_GEOMETRY.SAFE_B}px, env(safe-area-inset-bottom, ${NAV_GEOMETRY.SAFE_B}px)))`;

/** CSS value for safe-area bottom padding inside nav */
export const NAV_SAFE_BOTTOM_CSS =
  `max(${NAV_GEOMETRY.SAFE_B}px, env(safe-area-inset-bottom, ${NAV_GEOMETRY.SAFE_B}px))`;

/**
 * Build organic SVG tabbar path with center notch.
 * The notch is part of the SVG geometry — no border-radius or clip-path hacks.
 */
export function buildTabbarPath(W, H) {
  const R  = Math.min(CORNER_R, H / 2);
  const cx = W / 2;
  const bw = NOTCH_R * 1.1;
  const nd = NOTCH_R - GAP;

  return [
    `M ${R} 0`,
    `L ${cx - bw} 0`,
    `C ${cx - bw + NOTCH_R * 0.62} 0, ${cx - NOTCH_R * 0.32} ${nd}, ${cx} ${nd}`,
    `C ${cx + NOTCH_R * 0.32} ${nd}, ${cx + bw - NOTCH_R * 0.62} 0, ${cx + bw} 0`,
    `L ${W - R} 0`,
    `Q ${W} 0 ${W} ${R}`,
    `L ${W} ${H - R}`,
    `Q ${W} ${H} ${W - R} ${H}`,
    `L ${R} ${H}`,
    `Q 0 ${H} 0 ${H - R}`,
    `L 0 ${R}`,
    `Q 0 0 ${R} 0`,
    `Z`,
  ].join(" ");
}
