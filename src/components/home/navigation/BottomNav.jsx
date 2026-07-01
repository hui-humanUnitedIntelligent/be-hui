/**
 * BottomNav v11 — Layout-based navigation (no overlay)
 *
 * GEOMETRIE:
 *   SVG-Path als Tabbar-Form mit organischer Einbuchtung in der Mitte.
 *   Der Orb sitzt in der Einbuchtung — Bestandteil des Layout-Footers.
 *   Luftspalt = 7px — permanent, nie geschlossen.
 *
 * LAYOUT:
 *   Footer reserviert eigenen Platz im Flex-Layout (flexShrink: 0).
 *   Feed endet oberhalb — kein Scrollen hinter der Navigation.
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import {
  NAV_TAB_H,
  NAV_MARGIN_H,
  NAV_SAFE_B,
  NAV_ORB_D,
  NAV_ORB_R,
  NAV_GAP,
  NAV_NOTCH_R,
  NAV_CORNER_R,
  NAV_SINK,
  NAV_ORB_PROTRUSION,
} from "./navLayout.js";

/* Re-export layout constants for consumers */
export {
  NAV_LAYOUT_HEIGHT_CSS,
  NAV_ORB_PROTRUSION,
  NAV_TAB_H,
} from "./navLayout.js";

const TAB_H    = NAV_TAB_H;
const MARGIN_H = NAV_MARGIN_H;
const SAFE_B   = NAV_SAFE_B;
const ORB_D    = NAV_ORB_D;
const ORB_R    = NAV_ORB_R;
const GAP      = NAV_GAP;
const NOTCH_R  = NAV_NOTCH_R;
const CORNER_R = NAV_CORNER_R;
const SINK     = NAV_SINK;

/* ── SVG-Path generieren ───────────────────────────────────── */
function buildPath(W, H) {
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

/* ── TabbarSVG ─────────────────────────────────────────────── */
function TabbarSVG({ width, height }) {
  if (!width || !height) return null;
  const path = buildPath(width, height);
  return (
    <svg
      aria-hidden="true"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%",
               display:"block", overflow:"visible", pointerEvents:"none" }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path d={path} fill="rgba(253,251,248,0.96)" />
      <path d={path} fill="none"
        stroke="rgba(255,255,255,0.82)" strokeWidth="1.4"
        vectorEffect="non-scaling-stroke" />
      <path d={path} fill="none"
        stroke="rgba(0,0,0,0.055)" strokeWidth="0.8"
        vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ── BottomNav ─────────────────────────────────────────────── */
export default function BottomNav({
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
}) {
  const [wizardOpen, setWizardOpen] = React.useState(
    () => document.body.classList.contains("hui-wizard-open")
  );
  React.useEffect(() => {
    const obs = new MutationObserver(() =>
      setWizardOpen(document.body.classList.contains("hui-wizard-open"))
    );
    obs.observe(document.body, { attributes:true, attributeFilter:["class"] });
    return () => obs.disconnect();
  }, []);

  const barRef = React.useRef(null);
  const [barW, setBarW] = React.useState(
    () => (typeof window !== "undefined"
      ? window.innerWidth - MARGIN_H * 2
      : 360)
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
    opacity:    navDrift ? navDrift.opacity   : (isHidden ? 0 : 1),
    transform:  navDrift ? navDrift.transform : (isHidden ? "translateY(130%)" : "translateY(0)"),
    transition: navDrift ? navDrift.transition
      : "opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)",
    pointerEvents: navDrift?.pointerEvents ?? (isHidden ? "none" : "auto"),
  };

  function handleTabPress(key) {
    if (key === "creator") { actions[A.OPEN_OWN_PROFILE]?.(); return; }
    actions[A.GO_TO_TAB]?.(key);
    if (typeof onTab === "function") onTab(key);
  }

  function handleOrbPress() {
    if (!hasTalent) { onOrbAction?.("create"); return; }
    actions[A.OPEN_ORB]?.();
    onOrbAction?.("create");
  }

  const navItems = (NAV_ITEMS || []).map(validateNavItem).filter(Boolean);

  const safeBottom = `max(${SAFE_B}px, env(safe-area-inset-bottom, ${SAFE_B}px))`;

  /* Orb bottom offset within the layout footer (relative to footer bottom) */
  const orbBottom = `calc(${safeBottom} + ${TAB_H}px - ${ORB_R}px + ${GAP}px - ${SINK}px)`;

  return (
    <footer
      data-bottom-nav-root=""
      style={{
        flexShrink:    0,
        position:      "relative",
        width:         "100%",
        paddingTop:    NAV_ORB_PROTRUSION,
        paddingBottom: safeBottom,
        willChange:    "opacity, transform",
        ...sharedVis,
      }}
    >
      {/* ── ORB — absolut innerhalb des Layout-Footers ── */}
      <div
        data-orbroot=""
        style={{
          position:      "absolute",
          bottom:        orbBottom,
          left:          "50%",
          transform:     "translateX(-50%)",
          zIndex:        2,
          pointerEvents: "none",
        }}
      >
        <button
          onClick={handleOrbPress}
          aria-label="Mein HUI"
          style={{
            display:       "block",
            width:         ORB_D,
            height:        ORB_D,
            borderRadius:  "50%",
            border:        "none",
            padding:       0,
            cursor:        "pointer",
            background:    "transparent",
            pointerEvents: "auto",
            WebkitTapHighlightColor: "transparent",
            touchAction:   "manipulation",
            transition:    "transform 240ms cubic-bezier(0.34,1.56,0.64,1)",
            transform:     isOrbActive
              ? "scale(1.04) translateY(-2px)"
              : "scale(1) translateY(0)",
          }}
          onPointerDown={e => {
            e.currentTarget.style.transform  = "scale(0.94) translateY(1px)";
            e.currentTarget.style.transition = "transform 100ms cubic-bezier(0.22,1,0.36,1)";
          }}
          onPointerUp={e => {
            e.currentTarget.style.transform  = isOrbActive
              ? "scale(1.04) translateY(-2px)" : "scale(1) translateY(0)";
            e.currentTarget.style.transition = "transform 220ms cubic-bezier(0.34,1.56,0.64,1)";
          }}
          onPointerLeave={e => {
            e.currentTarget.style.transform  = isOrbActive
              ? "scale(1.04) translateY(-2px)" : "scale(1) translateY(0)";
            e.currentTarget.style.transition = "transform 220ms cubic-bezier(0.34,1.56,0.64,1)";
          }}
        >
          <div style={{
            width:          ORB_D,
            height:         ORB_D,
            borderRadius:   "50%",
            background:     "transparent",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            filter: [
              "drop-shadow(0 4px 12px rgba(190,100,20,0.22))",
              "drop-shadow(0 8px 28px rgba(190,100,20,0.14))",
              "drop-shadow(0 18px 48px rgba(13,196,150,0.10))",
              "drop-shadow(0 2px 4px rgba(0,0,0,0.08))",
            ].join(" "),
          }}>
            <img
              src="/assets/brand/hui-logo.png"
              alt=""
              width={ORB_D}
              height={ORB_D}
              draggable={false}
              style={{
                width:      ORB_D,
                height:     ORB_D,
                objectFit:  "contain",
                display:    "block",
                userSelect: "none",
              }}
            />
          </div>
        </button>
      </div>

      {/* ── TABBAR — im Layout-Flow ── */}
      <div
        data-bnroot=""
        style={{
          position:     "relative",
          margin:       `0 ${MARGIN_H}px`,
          height:       TAB_H,
        }}
      >
        <div
          ref={barRef}
          style={{
            position: "relative",
            height:   TAB_H,
          }}
        >
          <div style={{
            position:             "absolute",
            inset:                0,
            borderRadius:         CORNER_R,
            backdropFilter:       "blur(36px) saturate(1.9)",
            WebkitBackdropFilter: "blur(36px) saturate(1.9)",
            overflow:             "hidden",
            boxShadow: [
              "0 2px 8px rgba(0,0,0,0.05)",
              "0 12px 40px rgba(0,0,0,0.10)",
              "0 1px 2px rgba(0,0,0,0.06)",
            ].join(", "),
          }} />

          <TabbarSVG width={barW} height={TAB_H} />

          <div style={{
            position:       "absolute",
            inset:          0,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "4px 10px",
            pointerEvents:  "auto",
            WebkitTapHighlightColor: "transparent",
            touchAction:    "manipulation",
          }}>
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
                  badge={item.key === "notifs" ? notifCount : item.key === "chat" ? msgCount : 0}
                  onPress={() => handleTabPress(item.key)}
                  authProfile={authProfile}
                />
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
