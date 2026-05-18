// navigation/BottomNav.jsx — HUI Bottom Navigation v2
// HOTFIX: pointer-events inline (kein className-Bug), Profile-Button stabil

import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";

const BN_CSS = `
  @keyframes hui-orb-pulse {
    0%,100% { box-shadow: 0 4px 20px rgba(22,215,197,0.45), 0 2px 8px rgba(0,0,0,0.12); }
    50%      { box-shadow: 0 4px 28px rgba(22,215,197,0.70), 0 2px 8px rgba(0,0,0,0.12); }
  }
  .hui-bn-btn {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 2px; border: none; background: none;
    cursor: pointer; padding: 6px 4px; border-radius: 18px;
    position: relative; min-height: 54px;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s ease;
  }
  .hui-orb-btn {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #16D7C5, #11C5B7);
    border: 3px solid rgba(255,255,255,0.9);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; position: relative; flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.28s cubic-bezier(0.34,1.3,0.64,1),
                box-shadow 0.28s ease;
    animation: hui-orb-pulse 3s ease-in-out infinite;
  }
  .hui-orb-btn:active { transform: scale(0.92) !important; }
`;

export default function BottomNav({
  tab,
  onTab,
  onOrbAction,
  notifCount  = 0,
  msgCount    = 0,
  hasTalent   = false,
  authProfile = null,
  orbActive   = false,
}) {
  return (
    <>
      <style>{BN_CSS}</style>

      {/* ── Pill-Wrapper — VOLLSTÄNDIG INLINE um CSS-Klassen-Bug zu umgehen ── */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        /* pointer-events MUSS inline stehen — className-Fallback nicht zuverlässig */
        pointerEvents:"none",
        opacity:    (orbActive ?? false) ? 0 : 1,
        transform:  (orbActive ?? false) ? "translateY(120%)" : "translateY(0)",
        transition: "opacity 0.40s cubic-bezier(0.4,0,0.2,1), transform 0.40s cubic-bezier(0.4,0,0.2,1)",
        willChange: "opacity, transform",
      }}>
        {/* ── Innerer Container — pointer-events:auto damit Clicks durchkommen ── */}
        <div style={{
          margin:"0 10px",
          marginBottom:"max(10px, env(safe-area-inset-bottom, 10px))",
          background:"rgba(255,251,248,0.90)",
          backdropFilter:"blur(36px) saturate(1.8)",
          WebkitBackdropFilter:"blur(36px) saturate(1.8)",
          borderRadius:28,
          border:"1px solid rgba(255,255,255,0.65)",
          boxShadow:"0 2px 4px rgba(0,0,0,0.03), 0 8px 28px rgba(0,0,0,0.09), 0 1px 0 rgba(255,255,255,0.92) inset",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"4px 6px", height:66,
          /* KRITISCH: Auto damit der innere Container Clicks empfängt */
          pointerEvents:"auto",
        }}>

          {NAV_ITEMS.map((item, i) => {

            /* ── Orb Slot (null in Array) ── */
            if (!item) return (
              <button
                key="orb"
                className="hui-orb-btn"
                onClick={() => onOrbAction?.("create")}
                aria-label={orbActive ? "Schließen" : "Kreativ werden"}
                style={{
                  transform: orbActive ? "scale(0.88) rotate(45deg)" : "scale(1) rotate(0deg)",
                }}
              >
                <div style={{
                  position:"absolute",
                  opacity:(orbActive??false)?0:1,
                  transition:"opacity 0.28s ease, transform 0.38s ease",
                  transform:(orbActive??false)?"scale(0.78)":"scale(1)",
                }}>
                  <img src="/hui-logo.jpg" alt="HUI"
                    style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover" }}
                    onError={e=>{e.target.style.display="none";}}/>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{
                    position:"absolute",
                    opacity:(orbActive??false)?1:0,
                    transition:"opacity 0.24s ease",
                  }}>
                  <line x1="2" y1="7" x2="12" y2="7" stroke="#16D7C5" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="7" y1="2" x2="7"  y2="12" stroke="#16D7C5" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {!(orbActive??false) && (notifCount??0) > 0 && (
                  <div style={{
                    position:"absolute", top:3, right:3,
                    width:7, height:7, borderRadius:"50%",
                    background:"linear-gradient(135deg,#FF8A6B,#FF5F5F)",
                    border:"1.5px solid rgba(255,251,248,0.95)",
                    boxShadow:"0 0 5px rgba(255,138,107,0.7)",
                  }}/>
                )}
              </button>
            );

            /* ── Standard Tab ── */
            const isActive = tab === item.key;

            return (
              <NavItem
                key={item.key}
                item={item}
                isActive={isActive}
                onPress={(key) => {
                  // Direkt onTab aufrufen — kein branching, kein undefined
                  onTab?.(key);
                }}
                badge={0}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
