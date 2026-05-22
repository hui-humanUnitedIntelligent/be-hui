// src/components/guidance/GuidanceLayer.jsx — HUI Guidance Layer v1
//
// The top-level container for guidance-system elements.
// Wraps any flow/screen that needs:
//   • visual priority management
//   • readability protection
//   • focus mode application
//   • Orb reduction (during flows)
//
// Usage:
//   <GuidanceLayer flowType="membership" onExit={handleClose}>
//     <YourFlowContent />
//     <GuidanceFooter cta="Weiter" onCta={next} />
//   </GuidanceLayer>
//
// The layer:
//   1. Registers with GuidanceContext (enterFlow / exitFlow)
//   2. Applies CSS custom properties for the focus mode
//   3. Provides bottom-screen vignette for CTA protection
//   4. Never replaces routing — it is always an overlay

import React, { useEffect, useRef } from "react";
import { useGuidance } from "./GuidanceContext.jsx";
import { focusModeToCSS } from "../../lib/guidance/focusSystem.js";
import { Z_GUIDANCE }  from "../../lib/guidance/visualPriority.js";
import { G_MOTION } from "./guidanceTokens.js";

const GUIDANCE_CSS = `
  @keyframes guidanceFocusShift {
    from { opacity:0.88; }
    to   { opacity:1; }
  }
  @keyframes guidanceSettle {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .guidance-layer-enter {
    animation: guidanceFocusShift ${G_MOTION.focusShift} cubic-bezier(0.22,1,0.36,1) both;
  }
`;

/**
 * @param {object} props
 * @param {string}   props.flowType   — "membership"|"creation"|"talent"|"publishing"|etc.
 * @param {Function} [props.onExit]   — called when layer wants to close (pass-through)
 * @param {boolean}  [props.noPadding]— skip bottom padding for GuidanceFooter
 * @param {children} props.children
 */
export default function GuidanceLayer({
  flowType   = "membership",
  onExit,
  noPadding  = false,
  children,
}) {
  const { enterFlow, exitFlow, focusMode, readAdj } = useGuidance();

  // Register with guidance system
  useEffect(() => {
    enterFlow(flowType);
    return () => exitFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowType]);

  // Apply focus mode CSS vars to container
  const cssVars = focusModeToCSS(focusMode);

  // Bottom vignette — protects CTA from atmospheric bleed-through
  const vignetteAlpha = 0.18 + (readAdj?.vignetteStrength ?? 0) * 0.4;

  return (
    <>
      <style>{GUIDANCE_CSS}</style>
      <div
        className="guidance-layer-enter"
        style={{
          position:       "relative",
          width:          "100%",
          height:         "100%",
          display:        "flex",
          flexDirection:  "column",
          contain:        "layout paint",
          isolation:      "isolate",
        }}
      >
        {/* Content fills flex, pushing footer to bottom */}
        <div style={{ flex:1, position:"relative", zIndex:1 }}>
          {children}
        </div>

        {/* Bottom vignette — separates atmospheric bg from guidance footer */}
        <div
          aria-hidden="true"
          style={{
            position:      "absolute",
            bottom:        0,
            left:          0,
            right:         0,
            height:        220,
            background:    `linear-gradient(to top, rgba(6,10,20,${vignetteAlpha + 0.55}) 0%, transparent 100%)`,
            pointerEvents: "none",
            zIndex:        Z_GUIDANCE.guidanceVignette,
          }}
        />
      </div>
    </>
  );
}
