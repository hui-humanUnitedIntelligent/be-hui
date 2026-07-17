/**
 * HUIBottomNavigation — shared geometry constants
 * Single source of truth for nav dimensions, SVG path, and clearance height.
 *
 * REFERENZ: HUI Tabbar Design-System v1.0
 * Ziel: leichte, elegante Pill-Tabbar mit organisch integriertem Orb.
 */

export const NAV_GEOMETRY = Object.freeze({
  TAB_H:    58,    // -6px — filigraner, weniger Fläche, mehr Feed sichtbar (vorher 64)
  MARGIN_H: 16,    // Referenz: mehr Seitenluft → Pill wirkt schwebend
  // SAFE_B: Fallback-Höhe wenn env(safe-area-inset-bottom)=0 (z.B. ältere Android-Geräte
  // ohne Edge-to-Edge oder wenn Capacitor overlaysWebView noch nicht aktiv).
  // Geräte MIT aktiver System-Nav (Android Soft-Buttons ~48px, iOS Home-Indikator ~34px)
  // liefern via env() automatisch den korrekten Wert — SAFE_B ist nur der Minimum-Puffer.
  SAFE_B:   16,
  ORB_D:    102,   // LOCKED — HUI Living Design System v1.0 (Durchmesser unverändert)
  GAP:      6,     // Luftfuge Orb ↔ Einbuchtungs-Spitze (bewusstes Design-Element)
  CORNER_R: 40,    // wird via min(CORNER_R, H/2) ohnehin auf volle Pill-Rundung gekappt
  /** 50 % des Orbs sitzt in der Einbuchtung — Orb-Position bleibt unverändert
   *  (nur TAB_H schrumpft → weniger reservierte Fläche unterhalb des Orbs). */
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
export const NOTCH_HALF_WIDTH = 80;  // halbe Breite — UNVERÄNDERT (nicht breiter, wie gefordert)
export const NOTCH_DEPTH      = 40;  // etwas tiefer (36→40) — Logo sitzt natürlicher in der Wölbung
export const NOTCH_HANDLE_R   = 52;  // Bezier-Handle-Radius — unverändert, Kurve bleibt weich

/** Visible orb height above the bar surface */
export const ORB_OVERHANG = ORB_D - SINK;   // 57px

/** Total nav block height excluding safe-area (orb overhang + bar) */
export const NAV_BLOCK_HEIGHT = ORB_OVERHANG + TAB_H;   // 57 + 64 = 121px

/** CSS value for feed clearance — used by scroll container and fixed overlays */
export const NAV_CLEARANCE_CSS =
  `calc(${NAV_BLOCK_HEIGHT}px + max(${NAV_GEOMETRY.SAFE_B}px, env(safe-area-inset-bottom, ${NAV_GEOMETRY.SAFE_B}px)))`;

/** CSS value for nav container total height (Orb-Überhang + Tabbar + Safe-Area) —
 *  weiterhin exportiert für Konsumenten, die die VOLLE optische Nav-Zone
 *  brauchen (z.B. WerkeKorb-Button-Clearance), aber NICHT mehr für die
 *  eigene reservierte Layout-Box der Navigation verwendet (siehe unten). */
export const NAV_CONTAINER_HEIGHT_CSS =
  `calc(${NAV_BLOCK_HEIGHT}px + max(${NAV_GEOMETRY.SAFE_B}px, env(safe-area-inset-bottom, ${NAV_GEOMETRY.SAFE_B}px)))`;

/** CSS value for the nav's OWN reserved flex-layout height — bewusst OHNE
 *  den Orb-Überhang. Der Überhang-Bereich war im Code zwar schon transparent,
 *  hat aber als reservierte Layout-Fläche unnötig Platz vom Feed abgezogen und
 *  wirkte durch die farbliche Nähe zum Feed-Hintergrund wie ein durchgehender
 *  weißer Block. Tabbar-Höhe, Safe-Area, Notch und Orb-Geometrie bleiben dabei
 *  alle unverändert — nur der reservierte Layout-Platz oberhalb der Tabbar
 *  entfällt, der Orb schwebt stattdessen optisch unverändert über den (jetzt
 *  wieder sichtbaren) Feed hinweg (siehe Orb-top-Kompensation in
 *  HUIBottomNavigation.jsx). */
export const NAV_RESERVED_HEIGHT_CSS =
  `calc(${TAB_H}px + max(${NAV_GEOMETRY.SAFE_B}px, env(safe-area-inset-bottom, ${NAV_GEOMETRY.SAFE_B}px)))`;

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
