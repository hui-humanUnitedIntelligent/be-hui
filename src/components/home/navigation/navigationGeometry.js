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
  ORB_D:    102,   // LOCKED — HUI Living Design System v1.0 (Durchmesser unverändert)
  GAP:      6,     // Luftfuge Orb ↔ Einbuchtungs-Spitze (bewusstes Design-Element)
  CORNER_R: 40,    // Referenz: stark gerundete Pill-Form
  /** 50 % des Orbs sitzt in der Einbuchtung — reduziert den "leeren" Bereich
   *  oberhalb der Tabbar (vorher 44 %), Logo sitzt wenige Pixel tiefer. */
  SINK_RATIO: 0.50,
});

const { TAB_H, GAP, CORNER_R, SINK_RATIO, ORB_D: _ORB_D } = NAV_GEOMETRY;

export const ORB_D   = NAV_GEOMETRY.ORB_D;
export const ORB_R   = ORB_D / 2;
export const SINK    = Math.round(ORB_D * SINK_RATIO);   // 45px in Einbuchtung

// ── Notch-Kosmetik ──────────────────────────────────────────────────
// Die Notch-Tiefe orientiert sich bewusst locker an SINK (wie tief der Orb
// einsinkt), damit die Aussparung den unteren Orb-Bereich auch tatsächlich
// freilegt (sonst liegt der untere Orb-Rand optisch auf massivem Weiß statt
// in der Vertiefung). Breite bewusst großzügiger als die Tiefe → weicher,
// organischer Bogen statt steiler V-Form.
export const NOTCH_HALF_WIDTH = 80;  // halbe Breite der Notch-Öffnung
export const NOTCH_DEPTH      = 36;  // Tiefe — deckt den Großteil des Orb-Einsinkens ab
export const NOTCH_HANDLE_R   = 52;  // Bezier-Handle-Radius für den weichen Bogen

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
  const bw = NOTCH_HALF_WIDTH;   // halbe Breite der Öffnung
  const nd = NOTCH_DEPTH;        // Tiefe — flach & organisch, kein Trichter

  // Bezier-Tangenten: lange flache Einlaufkurve → weicher, harmonischer Bogen
  // t1 = Einlauf-Tangente (lang = flacher Einlauf)
  // t2 = Auslauf-Tangente (kurz = sanfter Abschluss am Tiefpunkt)
  const t1 = 0.66;
  const t2 = 0.30;

  return [
    `M ${R} 0`,
    `L ${cx - bw} 0`,
    `C ${cx - bw + NOTCH_HANDLE_R * t1} 0, ${cx - NOTCH_HANDLE_R * t2} ${nd}, ${cx} ${nd}`,
    `C ${cx + NOTCH_HANDLE_R * t2} ${nd}, ${cx + bw - NOTCH_HANDLE_R * t1} 0, ${cx + bw} 0`,
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
