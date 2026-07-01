/**
 * BottomNav v6 — HUI Design System
 *
 * Glassmorphism Nav Pill — Apple-level
 * Licht: rgba(255,251,248,0.94) + blur(36px) + saturate(1.8)
 * Safari-Fix: pointerEvents:none auf Outer, auto auf Pill
 *
 * v6: Tabbar zeigt immer das offizielle statische HUI-Logo.
 *     Der Orb ist KEIN Tabbar-Icon. Er lebt im persönlichen HUI-Bereich.
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { HUI } from "../../../design/hui.design.js";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { HUILogoNav } from '../../brand/HUILogo.jsx';


const CSS = `
  .bn-orb-btn:active {
    transform: scale(0.930) translateY(0.5px) !important;
    transition: transform 120ms cubic-bezier(0.22,1,0.36,1) !important;
  }

  /* ── WerkWizard fullscreen: BottomNav ausblenden ── */
  body.hui-wizard-open [data-bnroot] {
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
  const [wizardOpen, setWizardOpen] = React.useState(
    () => document.body.classList.contains("hui-wizard-open")
  );

  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setWizardOpen(document.body.classList.contains("hui-wizard-open"));
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const isHidden = wizardOpen || ((orbActive && !navDrift) ?? false);
  const actions  = useHuiActions();

  function handleTabPress(key) {
    if (key === "creator") {
      actions[A.OPEN_OWN_PROFILE]?.();
      return;
    }
    actions[A.GO_TO_TAB]?.(key);
    if (typeof onTab === "function") onTab(key);
  }

  return (
    <>
      <style>{CSS}</style>

      <div data-bnroot="" style={{
        position:   "fixed",
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     10000,
        pointerEvents: "none",
        contain:    "layout paint",
        isolation:  "isolate",
        opacity:    navDrift ? navDrift.opacity   : (isHidden ? 0 : 1),
        transform:  navDrift ? navDrift.transform : (isHidden ? "translateY(130%)" : "translateY(0)"),
        transition: navDrift ? navDrift.transition
          : "opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* Glass Pill */}
        <div style={{
          margin:       "0 12px",
          marginBottom: "max(14px, env(safe-area-inset-bottom, 14px))",
          background:           "rgba(253,251,248,0.93)",
          backdropFilter:       "blur(36px) saturate(1.9)",
          WebkitBackdropFilter: "blur(36px) saturate(1.9)",
          borderRadius: 28,
          border:     "1px solid rgba(255,255,255,0.72)",
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
          height:         66,
          contain:        "layout paint",
          isolation:      "isolate",
          pointerEvents:  "auto",
          WebkitTapHighlightColor: "transparent",
          touchAction:    "manipulation",
        }}>

          {(NAV_ITEMS || []).map(validateNavItem).filter(Boolean).map((item) => {
            const isOrb = item.isOrb === true;

            if (isOrb) {
              // ── HUI-Logo Button — öffnet persönlichen HUI-Bereich ──────────
              return (
                <button
                  key="hui-logo"
                  className="bn-orb-btn"
                  onClick={() => {
                    // Öffnet den persönlichen HUI-Bereich (Orb-Erfahrung beginnt dort)
                    if (!hasTalent) {
                      onOrbAction?.("create");
                      return;
                    }
                    actions[A.OPEN_ORB]?.();
                    onOrbAction?.("create");
                  }}
                  style={{
                    width:        56,
                    height:       56,
                    borderRadius: "50%",
                    border:       "none",
                    padding:      0,
                    cursor:       "pointer",
                    flexShrink:   0,
                    marginTop:    -10,
                    background:   "transparent",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                    touchAction:  "manipulation",
                    transition:   "transform 0.14s ease",
                  }}
                  onPointerDown={e => {
                    e.currentTarget.style.transform = "scale(0.94) translateY(1px)";
                    e.currentTarget.style.transition = "transform 120ms cubic-bezier(0.22,1,0.36,1)";
                  }}
                  onPointerUp={e => {
                    e.currentTarget.style.transform = "scale(1) translateY(0)";
                    e.currentTarget.style.transition = "transform 200ms cubic-bezier(0.16,1,0.30,1)";
                  }}
                  onPointerLeave={e => {
                    e.currentTarget.style.transform = "scale(1) translateY(0)";
                    e.currentTarget.style.transition = "transform 200ms cubic-bezier(0.16,1,0.30,1)";
                  }}
                aria-label={item.label}
                >
                  {/* HUILogoNav: schwebend, eleganter Mittelpunkt, Constitution-konform */}
                  <HUILogoNav size={46} active={tab === item.key} />
                </button>
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
    </>
  );
}
