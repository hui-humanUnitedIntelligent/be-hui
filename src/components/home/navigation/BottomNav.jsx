// BottomNav.jsx v4 — iOS Safari Final Fix
// KRITISCH: Kein pointerEvents:none am Outer-Div
// iOS Safari blockiert touch-events auf position:fixed innerhalb pointer-events:none
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";

const ORB_PULSE_CSS = `
  @keyframes hui-orb-pulse {
    0%,100% { box-shadow: 0 4px 20px rgba(22,215,197,0.45), 0 2px 8px rgba(0,0,0,0.12); }
    50%      { box-shadow: 0 4px 28px rgba(22,215,197,0.70), 0 2px 8px rgba(0,0,0,0.12); }
  }
`;

export default function BottomNav({
  tab         = "feed",
  onTab,
  onOrbAction,
  notifCount  = 0,
  orbActive   = false,
  authProfile = null,
  hasTalent   = false,
  msgCount    = 0,
}) {
  React.useEffect(() => {
  }, []);

  function handleTabPress(key) {
    if (typeof onTab === "function") {
      onTab(key);
    } else {
      console.error("[HUI-BN] onTab kein function!", typeof onTab);
    }
  }

  const isHidden = orbActive ?? false;

  return (
    <>
      <style>{ORB_PULSE_CSS}</style>

      {/*
        SAFARI-FIX: Outer-Div hat pointerEvents:auto (NICHT none)
        Das "none" am Outer verursachte den Bug auf iOS/iPad Safari.
        Stattdessen: Der Outer-Div ist transparent für Klicks durch
        background:transparent + nur der Glasspill-Bereich fängt Events.
      */}
      <div style={{
        position:   "fixed",
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     9999,            /* Hoch genug über allem */
        /* KEIN pointerEvents:none — Safari Bug */
        pointerEvents: "none",       /* Transparent-Bereich drumherum */
        opacity:    isHidden ? 0 : 1,
        transform:  isHidden ? "translateY(120%)" : "translateY(0)",
        transition: "opacity 0.40s cubic-bezier(0.4,0,0.2,1), transform 0.40s cubic-bezier(0.4,0,0.2,1)",
        willChange: "opacity, transform",
      }}>
        {/* Glasspill — der einzige klickbare Bereich */}
        <div style={{
          margin:               "0 10px",
          marginBottom:         "max(12px, env(safe-area-inset-bottom, 12px))",
          background:           "rgba(255,251,248,0.94)",
          backdropFilter:       "blur(36px) saturate(1.8)",
          WebkitBackdropFilter: "blur(36px) saturate(1.8)",
          borderRadius:         28,
          border:               "1px solid rgba(255,255,255,0.70)",
          boxShadow:            "0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
          display:              "flex",
          alignItems:           "center",
          justifyContent:       "space-between",
          padding:              "4px 8px",
          height:               66,
          /* KRITISCH: auto damit dieser Bereich Touches empfängt */
          pointerEvents:        "auto",
          touchAction:          "manipulation",
        }}>

          {NAV_ITEMS.map((item, idx) => {

            /* Orb-Slot */
            if (!item) return (
              <button
                key="orb"
                type="button"
                aria-label="Kreativ werden"
                onTouchEnd={(e) => {
                  e.preventDefault();
                  onOrbAction?.("create");
                }}
                onClick={() => {
                  onOrbAction?.("create");
                }}
                style={{
                  width:          56,
                  height:         56,
                  borderRadius:   "50%",
                  background:     "linear-gradient(135deg,#16D7C5,#11C5B7)",
                  border:         "3px solid rgba(255,255,255,0.92)",
                  boxShadow:      "0 4px 20px rgba(22,215,197,0.48)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  cursor:         "pointer",
                  position:       "relative",
                  flexShrink:     0,
                  WebkitTapHighlightColor: "transparent",
                  touchAction:    "manipulation",
                  pointerEvents:  "auto",
                  animation:      "hui-orb-pulse 3s ease-in-out infinite",
                  transform:      isHidden ? "scale(0.88) rotate(45deg)" : "scale(1) rotate(0deg)",
                  transition:     "transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
                  outline:        "none",
                }}
              >
                <img
                  src="/hui-logo.jpg"
                  alt="HUI"
                  style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", pointerEvents:"none" }}
                  onError={e => { e.target.style.display = "none"; }}
                />
                {!isHidden && notifCount > 0 && (
                  <div style={{
                    position:"absolute", top:2, right:2,
                    width:8, height:8, borderRadius:"50%",
                    background:"linear-gradient(135deg,#FF8A6B,#FF5F5F)",
                    border:"1.5px solid rgba(255,251,248,0.95)",
                    pointerEvents:"none",
                  }}/>
                )}
              </button>
            );

            /* Standard Tab */
            return (
              <NavItem
                key={item.key}
                item={item}
                isActive={tab === item.key}
                onPress={handleTabPress}
                badge={0}
              />
            );
          })}

        </div>
      </div>
    </>
  );
}