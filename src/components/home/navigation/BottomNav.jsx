/**
 * BottomNav v8 — HUI Design System
 *
 * Glassmorphism Nav + schwebender Mein-HUI Orb
 *
 * ARCHITEKTUR:
 *   Zwei getrennte fixed-Elemente auf gleichem zIndex-Level:
 *   1. Tabbar (Glass Pill) — enthält 4 Tabs + Lücke für den Orb
 *   2. Orb-Wrapper — eigener fixed-Container, ZIndex +1, zentriert,
 *      sitzt mit Luftspalt ÜBER der Tabbar
 *
 *   Kein `contain:paint` auf dem Orb-Wrapper →
 *   kein Clipping des schwebenden Elements.
 *
 * v8: Organische Einbuchtung in der Tabbar-Mitte (SVG-Clip).
 *     Orb berührt die Einbuchtung NICHT — 6px Luftspalt.
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { useHuiActions, A } from "../../../core/hui.actions.js";

// ── Konstanten ──────────────────────────────────────────────────────────────
const TAB_H        = 66;   // Tabbar-Höhe px
const SAFE_B       = 14;   // safe-area fallback px
const ORB_SIZE     = 64;   // Orb-Durchmesser px
const NOTCH_DEPTH  = 14;   // Einbuchtungstiefe px
const GAP          = 8;    // Luftspalt Orb ↔ Einbuchtung px

const CSS = `
  /* Press-Feedback NUR am Container-Div — nie am Logo-Bild */
  .hui-orb-btn:active .hui-orb-shell {
    transform: scale(0.93) translateY(1px) !important;
    transition: transform 100ms cubic-bezier(0.22,1,0.36,1) !important;
  }

  /* WerkWizard fullscreen: beide Nav-Elemente ausblenden */
  body.hui-wizard-open [data-bnroot],
  body.hui-wizard-open [data-orbroot] {
    opacity: 0 !important;
    transform: translateY(120%) !important;
    pointer-events: none !important;
    transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1) !important;
  }
`;

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
  /* ── Wizard-Open Observer ── */
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

  const isHidden    = wizardOpen || ((orbActive && !navDrift) ?? false);
  const actions     = useHuiActions();
  const isOrbActive = !creatorOpen && (tab === "orb" || orbActive);

  /* ── Shared transition für navDrift und hide/show ── */
  const sharedStyle = {
    opacity:   navDrift ? navDrift.opacity   : (isHidden ? 0 : 1),
    transform: navDrift ? navDrift.transform : (isHidden ? "translateY(130%)" : "translateY(0)"),
    transition: navDrift ? navDrift.transition
      : "opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)",
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
    if (!hasTalent) { onOrbAction?.("create"); return; }
    actions[A.OPEN_ORB]?.();
    onOrbAction?.("create");
  }

  /* ── Orb-Bottom: Unterkante des Orbs liegt auf Tabbar-Oberkante + GAP ── */
  /* safe-area wird via CSS env() gehandelt — JS-Fallback = SAFE_B          */
  const orbBottom = `calc(${TAB_H}px + max(${SAFE_B}px, env(safe-area-inset-bottom, ${SAFE_B}px)) + ${GAP}px)`;

  /* ── NavItems ohne Orb ── */
  const navItems = (NAV_ITEMS || []).map(validateNavItem).filter(Boolean);

  return (
    <>
      <style>{CSS}</style>

      {/* ════════════════════════════════════════════════════════════════════
          ORB — eigener fixed Wrapper, kein contain:paint → kein Clipping
          ════════════════════════════════════════════════════════════════════ */}
      <div
        data-orbroot=""
        style={{
          position:      "fixed",
          bottom:        0,
          left:          "50%",
          transform:     "translateX(-50%)",
          zIndex:        10002,       /* über der Tabbar */
          pointerEvents: "none",      /* Wrapper selbst: durch-klickbar */
          ...sharedStyle,
        }}
      >
        <button
          className="hui-orb-btn"
          onClick={handleOrbPress}
          aria-label="Mein HUI"
          style={{
            /* Abstand zur Bildschirm-Unterkante = Tabbar-Höhe + safe-area + GAP */
            marginBottom:  orbBottom,
            display:       "block",
            width:         ORB_SIZE,
            height:        ORB_SIZE,
            borderRadius:  "50%",
            border:        "none",
            padding:       0,
            cursor:        "pointer",
            background:    "transparent",
            pointerEvents: "auto",
            WebkitTapHighlightColor: "transparent",
            touchAction:   "manipulation",
            /* Sanfte Elevation wenn aktiv — am Button-Wrapper (Constitution) */
            transition:    "transform 240ms cubic-bezier(0.34,1.56,0.64,1)",
            transform:     isOrbActive
              ? "scale(1.07) translateY(-3px)"
              : "scale(1)   translateY(0)",
          }}
        >
          {/*
           * Orb Shell — Schatten liegt hier, NICHT am Logo-Bild
           * Constitution: kein Hintergrund, kein Container, keine Umrandung
           * Organischer Premium-Schatten: warm (Orange), kühl (Teal), neutral
           */}
          <div
            className="hui-orb-shell"
            style={{
              width:          ORB_SIZE,
              height:         ORB_SIZE,
              borderRadius:   "50%",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              background:     "transparent",
              filter: [
                `drop-shadow(0 6px 16px rgba(212,120,30,0.30))`,
                `drop-shadow(0 2px 6px  rgba(0,0,0,0.14))`,
                `drop-shadow(0 10px 30px rgba(13,196,150,0.14))`,
              ].join(" "),
              transition:     "transform 240ms cubic-bezier(0.34,1.56,0.64,1), filter 240ms ease",
            }}
          >
            {/* Offizielles HUI-Logo — freistehend, transparent, unverändert */}
            <img
              src="/assets/brand/hui-logo.png"
              alt="Mein HUI"
              width={ORB_SIZE}
              height={ORB_SIZE}
              draggable={false}
              style={{
                width:      ORB_SIZE,
                height:     ORB_SIZE,
                objectFit:  "contain",
                display:    "block",
                userSelect: "none",
                /* CONSTITUTION: KEIN background, border, borderRadius,
                   boxShadow, transform, filter direkt am Logo-Bild */
              }}
            />
          </div>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TABBAR — Glass Pill mit organischer Mitte-Einbuchtung
          ════════════════════════════════════════════════════════════════════ */}
      <div
        data-bnroot=""
        style={{
          position:      "fixed",
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        10000,
          pointerEvents: "none",
          ...sharedStyle,
        }}
      >
        {/* Einbuchtungs-Overlay — SVG-Maske über der Tabbar-Oberkante */}
        {/* Erzeugt den organischen Bogen ohne die Tabbar zu clippen    */}
        <NotchOverlay
          tabH={TAB_H}
          orbSize={ORB_SIZE}
          depth={NOTCH_DEPTH}
          safeB={SAFE_B}
        />

        {/* Glass Pill */}
        <div
          style={{
            margin:               "0 12px",
            marginBottom:         `max(${SAFE_B}px, env(safe-area-inset-bottom, ${SAFE_B}px))`,
            background:           "rgba(253,251,248,0.94)",
            backdropFilter:       "blur(36px) saturate(1.9)",
            WebkitBackdropFilter: "blur(36px) saturate(1.9)",
            borderRadius:         28,
            border:               "1px solid rgba(255,255,255,0.72)",
            boxShadow: [
              "0 1px 0 rgba(255,255,255,0.95) inset",
              "0 -1px 0 rgba(0,0,0,0.03) inset",
              "0 2px 6px rgba(0,0,0,0.04)",
              "0 10px 40px rgba(0,0,0,0.10)",
              "0 1px 2px rgba(0,0,0,0.06)",
            ].join(", "),
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "4px 10px",
            height:         TAB_H,
            pointerEvents:  "auto",
            WebkitTapHighlightColor: "transparent",
            touchAction:    "manipulation",
            position:       "relative",
          }}
        >
          {navItems.map((item) => {
            /* Orb-Position: transparenter Platzhalter in der Mitte */
            if (item.isOrb === true) {
              return (
                <div
                  key="orb-spacer"
                  aria-hidden="true"
                  style={{
                    width:      ORB_SIZE,
                    flexShrink: 0,
                    pointerEvents: "none",
                  }}
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
                  : item.key === "chat"  ? msgCount
                  : 0
                }
                onPress={() => handleTabPress(item.key)}
                authProfile={authProfile}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Organische Einbuchtung über der Tabbar-Mitte ────────────────────────────
   SVG-Bogen der den Orb "aufnimmt" ohne ihn zu berühren.
   Liegt ÜBER dem Glass-Pill, erzeugt die weiche Aussparung.           */
function NotchOverlay({ tabH, orbSize, depth, safeB }) {
  const W      = 120;           // Breite der Einbuchtungszone px
  const H      = depth + 4;     // Höhe des SVG-Streifens px
  const cx     = W / 2;
  const r      = orbSize / 2 + 6; // Einbuchtungs-Radius = Orb-Radius + Puffer

  /* Sanfter Cosinus-Bogen via kubische Bezier */
  const path = `
    M 0,${H}
    L ${cx - r - 18},${H}
    C ${cx - r - 6},${H} ${cx - r},${H - depth} ${cx},${H - depth}
    C ${cx + r},${H - depth} ${cx + r + 6},${H} ${cx + r + 18},${H}
    L ${W},${H}
    L ${W},0
    L 0,0
    Z
  `;

  return (
    <div style={{
      position:       "absolute",
      top:            -(H - 1),          /* 1px overlap um Lücken zu vermeiden */
      left:           "50%",
      transform:      "translateX(-50%)",
      width:          W,
      height:         H,
      pointerEvents:  "none",
      zIndex:         1,
    }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {/* Füllung: gleiche Farbe wie die Glass-Pill → nahtloser Übergang */}
        <path d={path} fill="rgba(253,251,248,0.94)" />
        {/* Subtile Randlinie oben für den organischen Bogen */}
        <path
          d={`M ${cx - r - 18},0
              C ${cx - r - 6},0 ${cx - r},${depth} ${cx},${depth}
              C ${cx + r},${depth} ${cx + r + 6},0 ${cx + r + 18},0`}
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}
