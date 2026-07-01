/**
 * BottomNav v10 — HUI Design System
 * Senior-UI-Engineer Konstruktion
 *
 * GEOMETRIE:
 *   SVG-Path als Tabbar-Form mit organischer Einbuchtung in der Mitte.
 *   Der Orb sitzt in einem eigenen fixed-Wrapper (data-orbroot) DARÜBER.
 *   Luftspalt = 8px — permanent, nie geschlossen.
 *
 * FIXES v10:
 *   - barW initialisiert mit window.innerWidth - 2*MARGIN_H (kein Flash)
 *   - backdrop-filter via separates div HINTER dem SVG
 *   - SVG hat overflow:visible damit Schatten nicht geclipt werden
 *   - kein contain:paint auf Ancestor des Orbs
 *
 * LAYER-STACK:
 *   z=10000  Tabbar (SVG-Form + backdrop + Items)
 *   z=10002  Orb (eigener fixed-Root)
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { useHuiActions, A } from "../../../core/hui.actions.js";

/* ── Geometrie ─────────────────────────────────────────────── */
const TAB_H    = 72;    // mehr Höhe — Einbuchtung schneidet nicht in Items
const MARGIN_H = 12;
const SAFE_B   = 14;
const ORB_D    = 88;    // Mittelpunkt der Navigation — hochwertiger, klar dominant
const ORB_R    = ORB_D / 2;
const GAP      = 7;        // Luftfuge Orb ↔ Einbuchtungs-Spitze (bewusstes Design-Element)
const NOTCH_R  = ORB_R + GAP + 5;  // Bogen-Radius: exakt proportioniert zum 88px Orb
const CORNER_R = 28;

/* ── SVG-Path generieren ───────────────────────────────────── */
function buildPath(W, H) {
  const R  = Math.min(CORNER_R, H / 2);
  const cx = W / 2;
  const bw = NOTCH_R * 1.1;   // Blend-Breite beidseitig

  // Notch-Tiefe: Einbuchtung reicht von Oberkante (y=0) bis y=NOTCH_R+GAP
  const nd = NOTCH_R - GAP;   // wie tief geht die Einbuchtung (px)

  return [
    `M ${R} 0`,
    `L ${cx - bw} 0`,
    // Linke Einbuchtungs-Flanke: sanfte Bezier
    `C ${cx - bw + NOTCH_R * 0.5} 0, ${cx - NOTCH_R * 0.4} ${nd}, ${cx} ${nd}`,
    // Rechte Einbuchtungs-Flanke: symmetrisch
    `C ${cx + NOTCH_R * 0.4} ${nd}, ${cx + bw - NOTCH_R * 0.5} 0, ${cx + bw} 0`,
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
      {/* Füllung */}
      <path d={path} fill="rgba(253,251,248,0.96)" />
      {/* Highlight-Linie oben (Glassgefühl) */}
      <path d={path} fill="none"
        stroke="rgba(255,255,255,0.82)" strokeWidth="1.4"
        vectorEffect="non-scaling-stroke" />
      {/* Äußerer Schatten-Rand */}
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
  /* Wizard-Observer */
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

  /* barW: sofort initialisiert mit window-Breite → kein Flash */
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

  /* Orb-marginBottom: Unterkante des Orbs liegt GAP px über Tabbar-Oberkante */
  // GEOMETRIE: Orb-Mitte liegt auf Tabbar-Oberkante.
  // Orb-Unterkante = Tabbar-Oberkante - ORB_R (halber Orb ragt in Einbuchtung)
  // + GAP = Luftfuge zwischen Orb-Unterkante und Einbuchtungs-Spitze
  // marginBottom = distance from screen-bottom to orb-button-bottom
  //   = safe-area + TAB_H (Tabbar-Oberkante) - ORB_R (halb eingetaucht) + GAP
  const orbMB = `calc(max(${SAFE_B}px, env(safe-area-inset-bottom, ${SAFE_B}px)) + ${TAB_H}px - ${ORB_R}px + ${GAP}px)`;

  return (
    <>
      {/* ══════════════════════════════════════════════════
          LAYER 3 — ORB
          Eigener fixed-Root, kein contain, kein overflow:hidden auf Ancestor.
          Orb wird NIEMALS geclipt.
          ══════════════════════════════════════════════════ */}
      <div
        data-orbroot=""
        style={{
          position:      "fixed",
          bottom:        0,
          left:          "50%",
          transform:     "translateX(-50%)",
          zIndex:        10002,
          pointerEvents: "none",
          willChange:    "opacity, transform",
          ...sharedVis,
        }}
      >
        <button
          onClick={handleOrbPress}
          aria-label="Mein HUI"
          style={{
            marginBottom:  orbMB,
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
          {/* Schatten-Shell — drop-shadow am Container, NICHT am Logo */}
          <div style={{
            width:          ORB_D,
            height:         ORB_D,
            borderRadius:   "50%",
            background:     "transparent",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            filter: [
              "drop-shadow(0 6px 18px rgba(212,120,30,0.30))",
              "drop-shadow(0 2px 6px rgba(0,0,0,0.14))",
              "drop-shadow(0 12px 32px rgba(13,196,150,0.12))",
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

      {/* ══════════════════════════════════════════════════
          LAYER 1+2 — TABBAR
          SVG-Hintergrund (organische Form) + Tab-Items
          ══════════════════════════════════════════════════ */}
      <div
        data-bnroot=""
        style={{
          position:      "fixed",
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        10000,
          pointerEvents: "none",
          willChange:    "opacity, transform",
          ...sharedVis,
        }}
      >
        <div
          ref={barRef}
          style={{
            position:     "relative",
            margin:       `0 ${MARGIN_H}px`,
            marginBottom: `max(${SAFE_B}px, env(safe-area-inset-bottom, ${SAFE_B}px))`,
            height:       TAB_H,
          }}
        >
          {/* Backdrop-blur: separates div, liegt unter dem SVG */}
          <div style={{
            position:             "absolute",
            inset:                0,
            borderRadius:         CORNER_R,
            backdropFilter:       "blur(36px) saturate(1.9)",
            WebkitBackdropFilter: "blur(36px) saturate(1.9)",
            overflow:             "hidden",   /* nur hier: für backdrop-clip */
            /* Schatten der Tabbar selbst */
            boxShadow: [
              "0 2px 8px rgba(0,0,0,0.05)",
              "0 12px 40px rgba(0,0,0,0.10)",
              "0 1px 2px rgba(0,0,0,0.06)",
            ].join(", "),
          }} />

          {/* SVG: organische Einbuchtung + Glassfüllung */}
          <TabbarSVG width={barW} height={TAB_H} />

          {/* Tab-Items */}
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
    </>
  );
}
