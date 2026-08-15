/**
 * HUIBottomNavigation — HUI Design System
 *
 * Complete bottom navigation rebuilt from scratch.
 * In-flow layout component — NOT fixed, NOT overlay.
 *
 * Structure:
 *   App → Header → Feed (scroll) → HUIBottomNavigation
 *
 * Parts:
 *   • SVG background with organic center notch
 *   • HUI Logo (static, centered — replaces former growth Orb)
 *   • Four nav entries (Entdecken, Home, Impact, Profil)
 *   • Safe area
 *   • Own layout container
 *
 * 2026-08-15: Orb-Wachstumsfunktion DEAKTIVIERT. Das dynamische 6-Stufen-
 * Wachstum (useOrbGrowthStage, stage-1 bis stage-6 Bilder) wurde durch das
 * statische HUI-Logo ersetzt. Klick auf den Button löst nichts aus.
 * Die Orb-Stage-Bilder und der Hook wurden archiviert, nicht gelöscht.
 *   — Archive: public/assets/brand/orb-stages-archive/
 *   — Hook backup: backup_20260815_useOrbGrowthStage.js
 *   — Nav backup:  backup_20260815_HUIBottomNavigation.jsx
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { HUI } from "../../../design/hui.design.js";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import {
  NAV_GEOMETRY,
  ORB_D,
  ORB_OVERHANG,
  NAV_RESERVED_HEIGHT_CSS,
  NAV_SAFE_BOTTOM_CSS,
  buildTabbarPath,
} from "./navigationGeometry.js";
import { HUILogo } from "../../brand/HUILogo.jsx";

const { TAB_H, MARGIN_H, CORNER_R } = NAV_GEOMETRY;

/* ── SVG Tabbar Background ─────────────────────────────────────
   Vollständig deckende Füllung (HUI-Design-System Off-White) — KEIN
   Glassmorphism, KEIN Blur, KEIN Durchscheinen des Hintergrunds. Sieht
   dadurch auf JEDEM Screen (Feed/Profil/etc.) identisch aus, da die
   Füllung nicht mehr von dahinterliegendem Content beeinflusst wird.
   Der weiche, schwebende Schatten kommt über CSS drop-shadow, der der
   exakten Pill+Notch-Silhouette folgt (kein rechteckiger Clip-Umweg
   mehr nötig — das war nur für den früheren Blur-Layer erforderlich). */
const TABBAR_FILL = HUI.COLOR.creamSoft || "#FDFBF8";

function NavigationSVG({ width, height }) {
  if (!width || !height) return null;
  const path = buildTabbarPath(width, height);
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "visible",
        pointerEvents: "none",
        filter: [
          "drop-shadow(0 1px 3px rgba(0,0,0,0.05))",
          "drop-shadow(0 6px 20px rgba(0,0,0,0.08))",
        ].join(" "),
      }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path d={path} fill={TABBAR_FILL} />
      <path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.04)"
        strokeWidth="0.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ── Static HUI Logo (replaces former growth Orb) ──────────── */
/* 2026-08-15: Das 6-stufige Wachstums-Orb wurde deaktiviert.
   An seiner Stelle zeigt die Navbar jetzt das statische HUI-Logo,
   zentriert über der Tabbar-Schnitt. Klick löst nichts aus
   (pointerEvents:none). Die originalen Orb-Stage-Bilder und der
   useOrbGrowthStage-Hook wurden archiviert, nicht gelöscht. */
function NavigationLogo() {
  return (
    <div
      aria-label="HUI"
      style={{
        width: ORB_D,
        height: ORB_D,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: [
          "drop-shadow(0 3px 10px rgba(190,100,20,0.12))",
          "drop-shadow(0 7px 24px rgba(190,100,20,0.08))",
          "drop-shadow(0 1px 3px rgba(0,0,0,0.05))",
        ].join(" "),
      }}
    >
      <HUILogo size={ORB_D} alt="HUI" />
    </div>
  );
}

/* ── HUIBottomNavigation ─────────────────────────────────────── */
export default function HUIBottomNavigation({
  tab         = "feed",
  onTab,
  onOrbAction,
  notifCount  = 0,
  orbActive   = false,
  navDrift    = null,
  authProfile = null,
  hasTalent   = false,
  msgCount    = 0,
  creatorOpen = false,
  // Orb-Kontinuität: "idle" | "exiting" | "entering" — wird nicht mehr
  // verwendet da der Button keine Aktion auslöst, aber prop bleibt für
  // Kompatibilität mit Aufrufern.
  orbTransition = "idle",
}) {
  const [wizardOpen, setWizardOpen] = React.useState(
    () => document.body.classList.contains("hui-wizard-open")
  );

  React.useEffect(() => {
    const obs = new MutationObserver(() =>
      setWizardOpen(document.body.classList.contains("hui-wizard-open"))
    );
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const barRef = React.useRef(null);
  const [barW, setBarW] = React.useState(
    () => (typeof window !== "undefined" ? window.innerWidth - MARGIN_H * 2 : 360)
  );

  React.useEffect(() => {
    if (!barRef.current) return;
    const ro = new ResizeObserver(([e]) => setBarW(Math.round(e.contentRect.width)));
    ro.observe(barRef.current);
    return () => ro.disconnect();
  }, []);

  // Nav ist IMMER sichtbar außer bei wizardOpen
  const isHidden    = wizardOpen;
  const isOrbActive = !creatorOpen && (tab === "orb" || orbActive);
  const actions     = useHuiActions();

  const sharedVis = {
    opacity: navDrift ? navDrift.opacity : (isHidden ? 0 : 1),
    transform: navDrift
      ? navDrift.transform
      : (isHidden ? "translateY(130%)" : "translateY(0)"),
    transition: navDrift
      ? navDrift.transition
      : "opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)",
    pointerEvents: navDrift?.pointerEvents ?? (isHidden ? "none" : "auto"),
  };

  function handleTabPress(key) {
    if (key === "creator") {
      actions[A.OPEN_OWN_PROFILE]?.();
      return;
    }
    actions[A.GO_TO_TAB]?.(key);
    if (typeof onTab === "function") onTab(key);
  }

  // 2026-08-15: Orb-Klick löst nichts mehr aus.
  // Der Button bleibt sichtbar als statisches HUI-Logo, hat aber keine Aktion.
  function handleOrbPress() {
    // No-op — Logo ist rein dekorativ
  }

  const navItems = (NAV_ITEMS || []).map(validateNavItem).filter(Boolean);

  return (
    <nav
      data-hui-bottom-navigation=""
      aria-label="Hauptnavigation"
      style={{
        flexShrink: 0,
        position: "relative",
        overflow: "visible",
        width: "100%",
        height: NAV_RESERVED_HEIGHT_CSS,
        // ⚠️ PFLICHTREGEL: JEDES fixed-position Modal/Sheet/Overlay in dieser App MUSS
        // zIndex >= 10500 haben, sonst wird es von dieser Bar überdeckt (siehe
        // .agents/rules/footer-navbar-zindex.md — Bugfund 2026-07-04/05, 16 betroffene Stellen gefixt).
        zIndex: 10000,
        willChange: "opacity, transform",
        ...sharedVis,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        {/* NAV-BACKDROP (2026-07-05): Garantiert auf ALLEN vier Tabs
            denselben soliden Cream-Ruhebereich hinter der Tabbar-Pille. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: TABBAR_FILL,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* ── HUI Logo: top of nav container, centered ─────────── */}
        {/* 2026-08-15: Statisches HUI-Logo ersetzt den Wachstums-Orb.
             Kein Press-Feedback, keine Aktion, rein dekorativ.
             Position und Größe (ORB_D = 102px) bleiben identisch zum
             ehemaligen Orb, damit die Tabbar-Notch und das Layout
             unverändert bleiben. */}
        <div
          data-hui-nav-orb=""
          style={{
            position: "absolute",
            top: 12 - ORB_OVERHANG,  // = -39, Logo-Position unveraendert
            left: "50%",
            transform: "translateX(-50%)",
            width: ORB_D,
            height: ORB_D,
            zIndex: 10002,  /* über Nav(10000) und Backdrop(0), unter Modals(10500) */
            pointerEvents: "none",  /* Logo ist rein dekorativ — keine Klicks */
          }}
        >
          <NavigationLogo />
        </div>

        {/* ── Tabbar: sits below logo overlap ──────────────── */}
        <div
          ref={barRef}
          data-hui-nav-bar=""
          style={{
            position: "absolute",
            top: 0,
            left: MARGIN_H,
            right: MARGIN_H,
            height: TAB_H,
            paddingBottom: NAV_SAFE_BOTTOM_CSS,
            boxSizing: "content-box",
          }}
        >
          <NavigationSVG width={barW} height={TAB_H} />

          {/* Navigation entries */}
          <div
            style={{
              position: "absolute",
              top: -4,
              left: 0,
              right: 0,
              height: TAB_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "2px 10px",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {navItems.map((item) => {
              if (item.isOrb === true) {
                return (
                  <div
                    key="orb-spacer"
                    aria-hidden="true"
                    style={{ width: ORB_D, flexShrink: 0, pointerEvents: "none" }}
                  />
                );
              }
              const isActive = creatorOpen
                ? item.key === "creator"
                : tab === item.key;
              return (
                <div
                  key={item.key}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <NavItem
                    item={item}
                    active={isActive}
                    badge={
                      item.key === "notifs" ? notifCount
                        : item.key === "chat" ? msgCount
                          : 0
                    }
                    onPress={() => handleTabPress(item.key)}
                    authProfile={authProfile}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

/** Re-export geometry for consumers that need clearance values */
export { NAV_CLEARANCE_CSS, NAV_CONTENT_SPACER_CSS, NAV_BLOCK_HEIGHT, ORB_D, SINK } from "./navigationGeometry.js";
