/**
 * BottomNav v5 — HUI Design System
 *
 * Glassmorphism Nav Pill — Apple-level
 * Licht: rgba(255,251,248,0.94) + blur(36px) + saturate(1.8)
 * Safari-Fix: pointerEvents:none auf Outer, auto auf Pill
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { SAFE_MODE } from "../../../config/safeMode.js";
import { HUI } from "../../../design/hui.design.js";

const CSS = `
  @keyframes bn-orb-pulse {
    0%,100% { box-shadow:
      0 0 0 0px rgba(22,215,197,0.00),
      0 4px 18px rgba(13,196,181,0.38),
      0 2px 6px rgba(0,0,0,0.14); }
    50%     { box-shadow:
      0 0 0 6px rgba(22,215,197,0.08),
      0 4px 26px rgba(22,215,197,0.60),
      0 2px 6px rgba(0,0,0,0.14); }
  }
  @keyframes bn-orb-idle {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.03); }
  }
  .bn-orb-btn {
    animation: bn-orb-pulse 3.5s ease-in-out infinite,
               bn-orb-idle  4.0s ease-in-out infinite;
  }
`;

export default function BottomNav({
  tab         = "feed",
  onTab,
  onOrbAction,
  notifCount  = 0,
  orbActive   = false,
  navDrift    = null,    // OrbWorldContext drift tokens (opacity/transform)
  authProfile = null,
  hasTalent   = false,
  msgCount    = 0,
}) {
  // orbActive: legacy — still controls hard hide for non-world-layer use cases
  // navDrift: world-layer drift — soft opacity + translateY (nav stays mounted)
  const isHidden = (orbActive && !navDrift) ?? false;


  function handleTabPress(key) {
    if (typeof onTab === "function") onTab(key);
  }

  return (
    <>
      <style>{CSS}</style>

      {/* Outer — pointerEvents:none damit Inhalte dahinter klickbar bleiben */}
      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 9999,
        pointerEvents: "none",
        contain: "layout paint",
        isolation: "isolate",
        // World-layer drift: nav softens + drifts down when Orb opens (stays visible)
        opacity:    navDrift ? navDrift.opacity   : (isHidden ? 0 : 1),
        transform:  navDrift ? navDrift.transform : (isHidden ? "translateY(130%)" : "translateY(0)"),
        transition: navDrift ? navDrift.transition
          : "opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* Glass Pill — einziger klickbarer Bereich */}
        <div style={{
          margin:       "0 12px",
          marginBottom: "max(14px, env(safe-area-inset-bottom, 14px))",

          /* Glas-Optik — warm, matt, hochwertig */
          background:           "rgba(253,251,248,0.93)",
          backdropFilter:       "blur(36px) saturate(1.9)",
          WebkitBackdropFilter: "blur(36px) saturate(1.9)",
          borderRadius: 28,

          /* Mehrstufige Border + Shadow für Tiefe */
          border:     "1px solid rgba(255,255,255,0.72)",
          boxShadow:  [
            "0 1px 0 rgba(255,255,255,0.95) inset",   /* top highlight */
            "0 -1px 0 rgba(0,0,0,0.03) inset",        /* bottom inner shadow */
            "0 2px 6px rgba(0,0,0,0.04)",             /* tight drop */
            "0 10px 40px rgba(0,0,0,0.10)",           /* soft ambient */
            "0 1px 2px rgba(0,0,0,0.06)",             /* definition */
          ].join(", "),

          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "4px 10px",
          height:         66,
          contain:        "layout paint",
          isolation:      "isolate",

          /* WICHTIG: auto damit Pill Touches empfängt */
          pointerEvents: "auto",
          touchAction:   "manipulation",
        }}>


          {(NAV_ITEMS || []).map(validateNavItem).filter(Boolean).map((item) => {
            const isOrb = item.isOrb === true;

            if (isOrb) {
              return (
                <button
                  key="orb"
                  className="bn-orb-btn"
                  onClick={() => onOrbAction?.("create")}
                  style={{
                    width: 52, height: 52,
                    borderRadius: "50%",
                    border: "none",
                    padding: 0, cursor: "pointer",
                    flexShrink: 0,
                    overflow: "hidden",
                    /* Teal → Coral gradient */
                    background: `linear-gradient(135deg, ${HUI.COLOR.teal} 0%, ${HUI.COLOR.coral} 100%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    transition: "transform 0.14s ease",
                  }}
                  onPointerDown={e => { e.currentTarget.style.transform = "scale(0.93)"; }}
                  onPointerUp={e   => { e.currentTarget.style.transform = "scale(1)"; }}
                  onPointerLeave={e=> { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <img
                    src="/hui-logo-real.jpg"
                    alt="HUI"
                    style={{
                      width: "100%", height: "100%",
                      objectFit: "cover", display: "block",
                      borderRadius: "50%",
                    }}
                    onError={e => { e.target.src = "/hui-logo.jpg"; }}
                  />
                </button>
              );
            }

            const isActive = tab === item.key;
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
