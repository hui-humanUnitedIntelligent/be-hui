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
 *   • HUI Orb (integrated, not floating over feed)
 *   • Four nav entries (Entdecken, Home, Impact, Profil)
 *   • Safe area
 *   • Own layout container
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import {
  NAV_GEOMETRY,
  ORB_D,
  ORB_OVERHANG,
  NAV_CONTAINER_HEIGHT_CSS,
  NAV_SAFE_BOTTOM_CSS,
  buildTabbarPath,
} from "./navigationGeometry.js";

const { TAB_H, MARGIN_H, CORNER_R } = NAV_GEOMETRY;

/* ── SVG Tabbar Background ─────────────────────────────────── */
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
      }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path d={path} fill="rgba(253,251,248,0.96)" />
      <path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.82)"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.055)"
        strokeWidth="0.8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ── HUI Orb (part of navigation, not overlay) ─────────────── */
/* Soft Transition: nur normales Press-Feedback — keine Zwischenphasen am Orb selbst */
function NavigationOrb({ active, onPress }) {
  const [pressed, setPressed] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label="Mein HUI"
      onPointerDown={(e) => {
        e.currentTarget.style.transform = "scale(0.94) translateY(1px)";
        e.currentTarget.style.transition = "transform 100ms ease-in-out";
        setPressed(true);
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = active
          ? "scale(1.04) translateY(-2px)"
          : "scale(1) translateY(0)";
        e.currentTarget.style.transition = "transform 220ms ease-in-out";
        setPressed(false);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = active
          ? "scale(1.04) translateY(-2px)"
          : "scale(1) translateY(0)";
        e.currentTarget.style.transition = "transform 220ms ease-in-out";
        setPressed(false);
      }}
      style={{
        display: "block",
        width: ORB_D,
        height: ORB_D,
        borderRadius: "50%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: "transparent",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        transition: "transform 220ms ease-in-out",
        transform: pressed
          ? "scale(0.94) translateY(1px)"
          : active
            ? "scale(1.04) translateY(-2px)"
            : "scale(1) translateY(0)",
      }}
    >
      <div
        style={{
          width: ORB_D,
          height: ORB_D,
          borderRadius: "50%",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: [
            "drop-shadow(0 3px 10px rgba(190,100,20,0.19))",
            "drop-shadow(0 7px 24px rgba(190,100,20,0.12))",
            "drop-shadow(0 14px 40px rgba(13,196,150,0.08))",
            "drop-shadow(0 1px 3px rgba(0,0,0,0.07))",
          ].join(" "),
        }}
      >
        <img
          src="/assets/brand/hui-logo.png"
          alt=""
          width={ORB_D}
          height={ORB_D}
          draggable={false}
          style={{
            width: ORB_D,
            height: ORB_D,
            objectFit: "contain",
            display: "block",
            userSelect: "none",
          }}
        />
      </div>
    </button>
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
  // Orb-Kontinuität: "idle" | "exiting" | "entering"
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

  const isHidden    = wizardOpen || ((orbActive && !navDrift) ?? false);
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

  function handleOrbPress() {
    if (!hasTalent) {
      onOrbAction?.("create");
      return;
    }
    actions[A.OPEN_ORB]?.();
    onOrbAction?.("create");
  }

  const navItems = (NAV_ITEMS || []).map(validateNavItem).filter(Boolean);

  return (
    <nav
      data-hui-bottom-navigation=""
      aria-label="Hauptnavigation"
      style={{
        flexShrink: 0,
        position: "relative",
        width: "100%",
        height: NAV_CONTAINER_HEIGHT_CSS,
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
        }}
      >
        {/* ── Orb: top of nav container, centered ─────────── */}
        {/* Soft Transition — orbTransition-Zustände:
             idle     → Normalzustand, tappable
             exiting  → Öffnen: Nav-Orb blendet sanft aus (opacity→0, scale→94%)
             hidden   → MeinHUI vollständig offen, Nav-Orb unsichtbar
             entering → Schließen: Nav-Orb blendet sanft wieder ein (scale 94%→100%)
             Nur opacity + minimaler scale, ease-in-out — keine Bounce/Overshoot-Kurven. */}
        <div
          data-hui-nav-orb=""
          style={{
            position: "absolute",
            top: 9,
            left: "50%",
            transform: (orbTransition === "exiting" || orbTransition === "hidden")
              ? "translateX(-50%) scale(0.94)"
              : "translateX(-50%) scale(1)",
            opacity: (orbTransition === "exiting" || orbTransition === "hidden") ? 0 : 1,
            transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
            width: ORB_D,
            height: ORB_D,
            zIndex: 3,
            pointerEvents: orbTransition !== "idle" ? "none" : "auto",
          }}
        >
          <NavigationOrb active={isOrbActive} onPress={handleOrbPress} />
        </div>

        {/* ── Tabbar: sits below orb overlap ──────────────── */}
        <div
          ref={barRef}
          data-hui-nav-bar=""
          style={{
            position: "absolute",
            top: ORB_OVERHANG,
            left: MARGIN_H,
            right: MARGIN_H,
            height: TAB_H,
            paddingBottom: NAV_SAFE_BOTTOM_CSS,
            boxSizing: "content-box",
          }}
        >
          {/* Backdrop blur layer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: CORNER_R,
              backdropFilter: "blur(36px) saturate(1.9)",
              WebkitBackdropFilter: "blur(36px) saturate(1.9)",
              overflow: "hidden",
              boxShadow: [
                "0 2px 8px rgba(0,0,0,0.05)",
                "0 12px 40px rgba(0,0,0,0.10)",
                "0 1px 2px rgba(0,0,0,0.06)",
              ].join(", "),
            }}
          />

          {/* SVG: organic notch is part of the geometry */}
          <NavigationSVG width={barW} height={TAB_H} />

          {/* Navigation entries */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "2px 10px",  // v1.0 FINAL: 1px weniger oben/unten — leichter, eleganter
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
                <NavItem
                  key={item.key}
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
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

/** Re-export geometry for consumers that need clearance values */
export { NAV_CLEARANCE_CSS, NAV_BLOCK_HEIGHT, ORB_D, SINK } from "./navigationGeometry.js";
