/**
 * HUIBottomNavigation — shared geometry constants
 * Single source of truth for nav dimensions, SVG path, and clearance height.
 *
 * REFERENZ: HUI Tabbar Design-System v1.0
 * Ziel: leichte, elegante Pill-Tabbar mit organisch integriertem Orb.
 */

export const NAV_GEOMETRY = Object.freeze({
  TAB_H:    64,    // Referenz: flache, elegante Tabbar
  MARGIN_H: 16,    // Referenz: mehr Seitenluft → Pill wirkt schwebend
  SAFE_B:   14,
  ORB_D:    102,   // LOCKED — HUI Living Design System v1.0
  GAP:      6,     // Luftfuge Orb ↔ Einbuchtungs-Spitze (bewusstes Design-Element)
  CORNER_R: 40,    // Referenz: stark gerundete Pill-Form
  /** 44 % of the orb sits inside the organic notch — 56 % visible above */
  SINK_RATIO: 0.44,
});

const { TAB_H, GAP, CORNER_R, SINK_RATIO, ORB_D: _ORB_D } = NAV_GEOMETRY;

export const ORB_D   = NAV_GEOMETRY.ORB_D;
export const ORB_R   = ORB_D / 2;
export const SINK    = Math.round(ORB_D * SINK_RATIO);   // 45px in Einbuchtung

// NOTCH_R: Bogen-Radius der Einbuchtung
// nd = NOTCH_R - GAP = Einbuchtungstiefe im SVG
// nd muss >= SINK (Orb passt rein) und < TAB_H (kein Durchbruch)
export const NOTCH_R = SINK + GAP + GAP;  // 45 + 6 + 6 = 57px → nd = 51px

/** Visible orb height above the bar surface */
export const ORB_OVERHANG = ORB_D - SINK;   // 57px

/** Total nav block height excluding safe-area (orb overhang + bar) */
export const NAV_BLOCK_HEIGHT = ORB_OVERHANG + TAB_H;   // 57 + 64 = 121px

/** CSS value for feed clearance — used by scroll container and fixed overlays */
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
 * Referenz: breite, flache U-Form — kein V, keine aggressive Kurve.
 */
export function buildTabbarPath(W, H) {
  const R  = Math.min(CORNER_R, H / 2);
  const cx = W / 2;
  // bw: halbe Breite der Einbuchtungs-Öffnung — breiter als NOTCH_R für organische Weichheit
  const bw = NOTCH_R * 1.25;
  // nd: Tiefe der Einbuchtung im SVG (y-Position des tiefsten Punktes)
  const nd = NOTCH_R - GAP;   // 51px

  // Bezier-Tangenten: lange flache Einlaufkurve → weicher U-Bogen (kein V, kein Knick)
  // t1 = Einlauf-Tangente (lang = flacher Einlauf)
  // t2 = Auslauf-Tangente (kurz = sanfter Abschluss am Tiefpunkt)
  const t1 = 0.70;
  const t2 = 0.28;

  return [
    `M ${R} 0`,
    `L ${cx - bw} 0`,
    `C ${cx - bw + NOTCH_R * t1} 0, ${cx - NOTCH_R * t2} ${nd}, ${cx} ${nd}`,
    `C ${cx + NOTCH_R * t2} ${nd}, ${cx + bw - NOTCH_R * t1} 0, ${cx + bw} 0`,
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
