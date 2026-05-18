// navigation/BottomNav.jsx — HUI Bottom Navigation (modular)
// Eigenständige Komponente — kein State aus Home.jsx

import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";

const BN_CSS = `
  .hui-bn-pill {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    pointer-events: none;
  }
  .hui-bn-inner {
    margin: 0 10px;
    margin-bottom: max(10px, env(safe-area-inset-bottom, 10px));
    background: rgba(255,251,248,0.90);
    backdrop-filter: blur(36px) saturate(1.8);
    -webkit-backdrop-filter: blur(36px) saturate(1.8);
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.65);
    box-shadow:
      0 2px 4px rgba(0,0,0,0.03),
      0 8px 28px rgba(0,0,0,0.09),
      0 1px 0 rgba(255,255,255,0.92) inset;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px;
    height: 66px;
    pointer-events: auto;
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
    box-shadow: 0 4px 20px rgba(22,215,197,0.45), 0 2px 8px rgba(0,0,0,0.12);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; position: relative; flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.28s cubic-bezier(0.34,1.3,0.64,1),
                box-shadow 0.28s ease;
  }
  .hui-orb-btn:active { transform: scale(0.92); }
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
  onProfile   = null,
}) {
  const [orbPulse, setOrbPulse] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setOrbPulse(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{BN_CSS}</style>
      <div className="hui-bn-pill" style={{
        opacity:    (orbActive ?? false) ? 0 : 1,
        transform:  (orbActive ?? false) ? "translateY(120%)" : "translateY(0)",
        transition: "opacity 0.40s cubic-bezier(0.4,0,0.2,1), transform 0.40s cubic-bezier(0.4,0,0.2,1)",
        willChange: "opacity, transform",
      }}>
        <div className="hui-bn-inner">
          {NAV_ITEMS.map((item, i) => {

            /* Orb Slot */
            if (!item) return (
              <button
                key="orb"
                className="hui-orb-btn"
                onClick={() => onOrbAction?.("create")}
                aria-label={orbActive ? "Schließen" : "Kreativ werden"}
                aria-expanded={orbActive ?? false}
                style={{
                  transform: orbActive ? "scale(0.88) rotate(45deg)" : "scale(1) rotate(0deg)",
                  transition:"transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
                }}
              >
                {/* Logo */}
                <div style={{
                  position:"absolute",
                  opacity:   (orbActive ?? false) ? 0 : 1,
                  transform: (orbActive ?? false) ? "scale(0.78) rotate(12deg)" : "scale(1) rotate(0deg)",
                  transition:"opacity 0.28s ease, transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
                }}>
                  <img src="/hui-logo.jpg" alt="HUI" loading="eager" decoding="async"
                    style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover" }}
                    onError={e => { e.target.style.display="none"; }}/>
                </div>
                {/* ✕ wenn offen */}
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
                  style={{
                    position:"absolute",
                    opacity:   (orbActive ?? false) ? 1 : 0,
                    transform: (orbActive ?? false) ? "rotate(0deg) scale(1)" : "rotate(-45deg) scale(0.5)",
                    transition:"opacity 0.24s ease, transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
                  }}>
                  <line x1="2.5" y1="7.5" x2="12.5" y2="7.5" stroke="#16D7C5" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="7.5" y1="2.5" x2="7.5" y2="12.5" stroke="#16D7C5" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {/* Notif-Dot */}
                {!(orbActive ?? false) && (notifCount ?? 0) > 0 && (
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

            /* Standard Tab */
            const isActive = tab === item.key;
            const badge    = item.key === "profile" ? 0 : 0;

            return (
              <NavItem
                key={item.key}
                item={item}
                isActive={isActive}
                onPress={(key) => {
                  if (key === "profile") {
                    // Profile → via onTab handler (Home.jsx orchestriert)
                    onTab?.(key);
                  } else {
                    onTab?.(key);
                  }
                }}
                badge={badge}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
