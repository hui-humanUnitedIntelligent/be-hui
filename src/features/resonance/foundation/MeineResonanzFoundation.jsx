// src/features/resonance/foundation/MeineResonanzFoundation.jsx
// ─────────────────────────────────────────────────────────────────
// HUI Release Phase 1.6 — Offizieller Einstieg „Meine Resonanz"
// Persönliche Erlebniswelt — kein Dashboard, kein Konto.
// ─────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  RESONANCE_SECTIONS,
  DEFAULT_SECTION_ID,
  getSectionById,
  isValidSectionId,
} from "./resonanceSections.js";

const T = {
  page:     "#F7F5F0",
  card:     "#FFFFFF",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.50)",
  inkFaint: "rgba(26,26,24,0.30)",
  border:   "rgba(26,26,24,0.07)",
  teal:     "#0EC4B8",
  ff:       "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  px:       20,
};

const CSS = `
  .mr-foundation-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mr-foundation-scroll::-webkit-scrollbar { display:none; }
  .mr-foundation-chips { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mr-foundation-chips::-webkit-scrollbar { display:none; }
  .mr-foundation-chip { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:all .16s ease; border:none; font-family:inherit; }
  .mr-foundation-chip:active { transform:scale(.93); }
  .mr-foundation-press { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:opacity .14s ease; border:none; background:none; font-family:inherit; }
  .mr-foundation-press:active { opacity:.7; }
`;

export default function MeineResonanzFoundation() {
  const navigate = useNavigate();
  const { section: sectionParam } = useParams();

  const activeSectionId = useMemo(() => {
    if (sectionParam && isValidSectionId(sectionParam)) return sectionParam;
    return DEFAULT_SECTION_ID;
  }, [sectionParam]);

  const activeSection = useMemo(
    () => getSectionById(activeSectionId),
    [activeSectionId]
  );

  const ActiveComponent = activeSection.component;

  const handleSectionChange = useCallback((id) => {
    if (id === DEFAULT_SECTION_ID) {
      navigate("/resonanz", { replace: true });
    } else {
      navigate(`/resonanz/${id}`, { replace: true });
    }
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate("/Home");
  }, [navigate]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 11000,
      background: T.page, display: "flex", flexDirection: "column",
      fontFamily: T.ff, WebkitFontSmoothing: "antialiased",
    }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(247,245,240,0.95)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${T.border}`,
        paddingTop: "max(52px, env(safe-area-inset-top, 52px))",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: `14px ${T.px}px 10px` }}>
          <button onClick={handleBack} className="mr-foundation-press" style={{
            fontSize: 24, color: T.inkSoft, padding: "2px 10px 2px 0", lineHeight: 1,
          }}>
            ‹
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Meine Resonanz
            </div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3, lineHeight: 1.4 }}>
              Alles, was HUI bei mir bewegt.
            </div>
          </div>
        </div>

        {/* Section Navigation — flexibel erweiterbar */}
        <div className="mr-foundation-chips" style={{
          display: "flex", gap: 8, padding: `0 ${T.px}px 14px`,
        }}>
          {RESONANCE_SECTIONS.map(s => {
            const active = s.id === activeSectionId;
            return (
              <button
                key={s.id}
                className="mr-foundation-chip"
                onClick={() => handleSectionChange(s.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "7px 13px", borderRadius: 99,
                  background: active ? T.ink : T.card,
                  border: active ? "none" : `1px solid ${T.border}`,
                  color: active ? "#FFFFFF" : T.inkSoft,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  whiteSpace: "nowrap", flexShrink: 0,
                  boxShadow: active ? "0 2px 10px rgba(26,26,24,0.2)" : "none",
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Section */}
      <div className="mr-foundation-scroll" style={{ flex: 1 }}>
        <ActiveComponent key={activeSectionId} />
      </div>
    </div>
  );
}
