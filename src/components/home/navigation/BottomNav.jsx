/**
 * BottomNav v7 — HUI Design System
 *
 * Glassmorphism Nav Pill — Apple-level
 * Licht: rgba(253,251,248,0.93) + blur(36px) + saturate(1.9)
 *
 * v7: Mein HUI-Orb schwebt mit Luftspalt über der Tabbar.
 *     Der Orb berührt die Tabbar-Linie NICHT.
 *     Weicher Schatten erzeugt Materialtiefe (organisch, premium, ruhig).
 *     Vier übrige Tabs: dezenter, kleiner, zurückhaltend.
 */
import React from "react";
import NavItem from "./NavItem.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { validateNavItem } from "../../../lib/factories/createNavItem.js";
import { HUI } from "../../../design/hui.design.js";
import { useHuiActions, A } from "../../../core/hui.actions.js";

const CSS = `
  /* Orb: sanfte Press-Reaktion — Constitution-konform (am Container, nicht am Logo) */
  .bn-orb-btn:active .bn-orb-inner {
    transform: scale(0.93) translateY(1px) !important;
    transition: transform 110ms cubic-bezier(0.22,1,0.36,1) !important;
  }

  /* WerkWizard fullscreen: BottomNav ausblenden */
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
  const isOrbActive = tab === "orb" || creatorOpen === false && orbActive;

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
        position:      "fixed",
        bottom:        0,
        left:          0,
        right:         0,
        zIndex:        10000,
        pointerEvents: "none",
        contain:       "layout paint",
        isolation:     "isolate",
        opacity:       navDrift ? navDrift.opacity   : (isHidden ? 0 : 1),
        transform:     navDrift ? navDrift.transform : (isHidden ? "translateY(130%)" : "translateY(0)"),
        transition:    navDrift ? navDrift.transition
          : "opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)",
      }}>

        {/* ── Orb: schwebt ÜBER der Tabbar, kein Kontakt ─────────────────── */}
        {/* Position: absolut zentriert, bottom = Tabbar-Höhe + Luftspalt     */}
        <div style={{
          position:      "absolute",
          bottom:        "calc(max(14px, env(safe-area-inset-bottom, 14px)) + 66px + 6px)",
          left:          "50%",
          transform:     "translateX(-50%)",
          zIndex:        10001,
          pointerEvents: "auto",
        }}>
          <button
            className="bn-orb-btn"
            onClick={() => {
              if (!hasTalent) {
                onOrbAction?.("create");
                return;
              }
              actions[A.OPEN_ORB]?.();
              onOrbAction?.("create");
            }}
            aria-label="Mein HUI"
            style={{
              width:           64,
              height:          64,
              borderRadius:    "50%",
              border:          "none",
              padding:         0,
              cursor:          "pointer",
              background:      "transparent",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              WebkitTapHighlightColor: "transparent",
              touchAction:     "manipulation",
              // Elevation-Transition am Button-Container (Constitution-konform)
              transition:      "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
              transform:       isOrbActive ? "scale(1.06) translateY(-2px)" : "scale(1) translateY(0)",
              willChange:      "transform",
            }}
            onPointerDown={e => {
              e.currentTarget.querySelector('.bn-orb-inner').style.transform =
                "scale(0.93) translateY(1px)";
              e.currentTarget.querySelector('.bn-orb-inner').style.transition =
                "transform 110ms cubic-bezier(0.22,1,0.36,1)";
            }}
            onPointerUp={e => {
              const inner = e.currentTarget.querySelector('.bn-orb-inner');
              if (inner) {
                inner.style.transform  = "scale(1) translateY(0)";
                inner.style.transition = "transform 200ms cubic-bezier(0.16,1,0.30,1)";
              }
            }}
            onPointerLeave={e => {
              const inner = e.currentTarget.querySelector('.bn-orb-inner');
              if (inner) {
                inner.style.transform  = "scale(1) translateY(0)";
                inner.style.transition = "transform 200ms cubic-bezier(0.16,1,0.30,1)";
              }
            }}
          >
            {/* ── Orb-Inner: Logo freistehend, kein Hintergrund ────────────
                Constitution: kein weißer Kreis, kein Container, keine Umrandung.
                Weicher Schatten am Inner-Container (nicht am Logo-Bild selbst).
                Der Schatten erzeugt organische Materialtiefe.               */}
            <div
              className="bn-orb-inner"
              style={{
                width:      62,
                height:     62,
                borderRadius: "50%",
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                // Organischer Premium-Schatten — warm, weich, mehrschichtig
                filter: [
                  "drop-shadow(0 4px 12px rgba(212,120,30,0.28))",
                  "drop-shadow(0 1px 4px rgba(0,0,0,0.12))",
                  "drop-shadow(0 8px 24px rgba(13,196,150,0.15))",
                ].join(" "),
                transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1), filter 220ms ease",
              }}
            >
              {/* Das offizielle HUI-Logo — freistehend, transparent, unverändert */}
              <img
                src="/assets/brand/hui-logo.png"
                alt="Mein HUI"
                width={62}
                height={62}
                draggable={false}
                style={{
                  width:      62,
                  height:     62,
                  objectFit:  "contain",
                  display:    "block",
                  userSelect: "none",
                  // CONSTITUTION: kein background, border, borderRadius, boxShadow, transform, filter
                  // Der Schatten liegt am Container-Div, nicht am Logo-Bild
                }}
              />
            </div>
          </button>
        </div>

        {/* ── Glass Pill — Tabbar ──────────────────────────────────────────── */}
        <div style={{
          margin:               "0 12px",
          marginBottom:         "max(14px, env(safe-area-inset-bottom, 14px))",
          background:           "rgba(253,251,248,0.93)",
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
          height:         66,
          contain:        "layout paint",
          isolation:      "isolate",
          pointerEvents:  "auto",
          WebkitTapHighlightColor: "transparent",
          touchAction:    "manipulation",
        }}>

          {(NAV_ITEMS || []).map(validateNavItem).filter(Boolean).map((item) => {
            if (item.isOrb === true) {
              // Orb-Platzhalter in der Tabbar — transparente Lücke für den schwebenden Orb
              return (
                <div
                  key="orb-spacer"
                  style={{
                    width:      64,
                    height:     66,
                    flexShrink: 0,
                    // Transparente Lücke — kein Hintergrund, keine Umrandung
                    background: "transparent",
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
