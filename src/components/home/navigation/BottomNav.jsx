// BottomNav.jsx v3 — Debug-hardened, alle pointer-events inline
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";

const C = { teal: "#16D7C5", coral: "#FF8A6B" };

const ORB_CSS = `
  @keyframes hui-orb-pulse {
    0%,100% { box-shadow: 0 4px 20px rgba(22,215,197,0.45), 0 2px 8px rgba(0,0,0,0.12); }
    50%      { box-shadow: 0 4px 28px rgba(22,215,197,0.70), 0 2px 8px rgba(0,0,0,0.12); }
  }
`;

export default function BottomNav({
  tab          = "feed",
  onTab,
  onOrbAction,
  notifCount   = 0,
  orbActive    = false,
  authProfile  = null,
  hasTalent    = false,
  msgCount     = 0,
}) {
  /* Mount-Log: Prüft ob Props ankommen */
  React.useEffect(() => {
    console.log("[HUI-BN] BottomNav mounted. onTab type:", typeof onTab, "tab:", tab);
  }, []);

  function handleTabPress(key) {
    console.log("[HUI-BN] Tab pressed:", key, "| onTab:", typeof onTab);
    if (typeof onTab === "function") {
      onTab(key);
    } else {
      console.error("[HUI-BN] onTab ist keine Funktion!", typeof onTab);
    }
  }

  const isSliding = orbActive ?? false;

  return (
    <>
      <style>{ORB_CSS}</style>

      {/* Äußerer Pill-Wrapper: pointerEvents:none (nur Glasspill klickbar) */}
      <div style={{
        position:   "fixed",
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     100,
        pointerEvents: "none",
        opacity:    isSliding ? 0 : 1,
        transform:  isSliding ? "translateY(120%)" : "translateY(0)",
        transition: "opacity 0.40s cubic-bezier(0.4,0,0.2,1), transform 0.40s cubic-bezier(0.4,0,0.2,1)",
        willChange: "opacity, transform",
      }}>
        {/* Innerer Glasspill: pointerEvents:auto */}
        <div style={{
          margin:       "0 10px",
          marginBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
          background:   "rgba(255,251,248,0.92)",
          backdropFilter:       "blur(36px) saturate(1.8)",
          WebkitBackdropFilter: "blur(36px) saturate(1.8)",
          borderRadius: 28,
          border:       "1px solid rgba(255,255,255,0.65)",
          boxShadow:    "0 2px 4px rgba(0,0,0,0.03), 0 8px 28px rgba(0,0,0,0.09)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "space-between",
          padding:      "4px 6px",
          height:       66,
          pointerEvents: "auto",   /* KRITISCH */
        }}>

          {NAV_ITEMS.map((item, idx) => {

            /* Orb-Slot: null im Array */
            if (!item) return (
              <button
                key="orb"
                type="button"
                onClick={() => {
                  console.log("[HUI-BN] Orb clicked");
                  onOrbAction?.("create");
                }}
                aria-label="Kreativ werden"
                style={{
                  width:          56,
                  height:         56,
                  borderRadius:   "50%",
                  background:     "linear-gradient(135deg,#16D7C5,#11C5B7)",
                  border:         "3px solid rgba(255,255,255,0.9)",
                  boxShadow:      "0 4px 20px rgba(22,215,197,0.45)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  cursor:         "pointer",
                  position:       "relative",
                  flexShrink:     0,
                  WebkitTapHighlightColor: "transparent",
                  animation:      "hui-orb-pulse 3s ease-in-out infinite",
                  transform:      isSliding ? "scale(0.88) rotate(45deg)" : "scale(1) rotate(0deg)",
                  transition:     "transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
                  pointerEvents:  "auto",
                }}
              >
                <img src="/hui-logo.jpg" alt="HUI"
                  style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", pointerEvents:"none" }}
                  onError={e => { e.target.style.display = "none"; }}/>
                {!isSliding && notifCount > 0 && (
                  <div style={{
                    position:"absolute", top:3, right:3,
                    width:7, height:7, borderRadius:"50%",
                    background:"linear-gradient(135deg,#FF8A6B,#FF5F5F)",
                    border:"1.5px solid rgba(255,251,248,0.95)",
                    pointerEvents:"none",
                  }}/>
                )}
              </button>
            );

            /* Standard-Tab */
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
