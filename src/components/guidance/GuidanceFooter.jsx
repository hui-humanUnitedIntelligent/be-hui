// src/components/guidance/GuidanceFooter.jsx — HUI Guidance Footer v1
//
// The CTA lives in its own Guidance Layer.
// It never competes with atmosphere, never sits on images.
// It IS the "quiet next step."
//
// Usage:
//   <GuidanceFooter
//     cta="Weiter"
//     onCta={handleNext}
//     disabled={!ready}
//     hint="Du kannst jederzeit anpassen"  // optional quiet sub-text
//     secondary={{ label:"Zurück", onClick:handleBack }}
//   />

import React, { useState } from "react";
import { useGuidance } from "./GuidanceContext.jsx";
import { guidanceFooterStyle, ctaButtonStyle } from "../../lib/guidance/visualPriority.js";
import { G_MOTION } from "./guidanceTokens.js";

const CSS = `
  @keyframes guidanceReveal {
    from { opacity:0; transform:translateY(24px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes guidanceBreathe {
    0%,100% { box-shadow: 0 8px 30px rgba(22,215,197,0.22), 0 0 18px rgba(22,215,197,0.16); }
    50%     { box-shadow: 0 10px 36px rgba(22,215,197,0.32), 0 0 24px rgba(22,215,197,0.22); }
  }
  @keyframes guidanceFloat {
    0%,100% { transform:translateY(0px); }
    50%     { transform:translateY(-1.5px); }
  }
  .guidance-cta-breathe {
    animation: guidanceBreathe ${G_MOTION.breathe} ease-in-out infinite,
               guidanceFloat   ${G_MOTION.float}   ease-in-out infinite;
  }
  .guidance-cta-breathe:disabled { animation:none; }
  .guidance-tap {
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
  }
`;

/**
 * @param {object} props
 * @param {string}   props.cta        — primary CTA label
 * @param {Function} props.onCta      — primary CTA handler
 * @param {boolean}  [props.disabled] — CTA disabled state
 * @param {boolean}  [props.loading]  — shows spinner
 * @param {string}   [props.hint]     — quiet sub-text beneath CTA
 * @param {object}   [props.secondary]— { label, onClick } optional secondary action
 * @param {string}   [props.animDelay]— animation delay for staggered reveal
 * @param {number}   [props.noiseOverride] — manual noise score (0–1)
 */
export default function GuidanceFooter({
  cta,
  onCta,
  disabled   = false,
  loading    = false,
  hint       = null,
  secondary  = null,
  animDelay  = "0ms",
  noiseOverride = null,
}) {
  const { readAdj, focusMode } = useGuidance();
  const [isActive, setIsActive] = useState(false);

  // Allow components to override noise score (e.g. when they know their bg is bright)
  const effectiveReadAdj = noiseOverride != null
    ? { ...readAdj, ctaBoost: Math.max(readAdj.ctaBoost, noiseOverride * 0.3) }
    : readAdj;

  const footerStyle = guidanceFooterStyle(effectiveReadAdj);
  const btnStyle    = ctaButtonStyle({ focusMode, disabled, isActive, readAdj: effectiveReadAdj });

  function handlePress() {
    if (disabled || loading) return;
    onCta?.();
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        // GuidanceFooter: position-agnostic — parent controls sticky vs fixed
        // Only visual styles from footerStyle (background, blur, border, shadow, radius)
        minHeight:            footerStyle.minHeight,
        display:              footerStyle.display,
        alignItems:           footerStyle.alignItems,
        justifyContent:       footerStyle.justifyContent,
        padding:              footerStyle.padding,
        borderRadius:         footerStyle.borderRadius,
        background:           footerStyle.background,
        backdropFilter:       footerStyle.backdropFilter,
        WebkitBackdropFilter: footerStyle.WebkitBackdropFilter,
        border:               footerStyle.border,
        boxShadow:            footerStyle.boxShadow,
        isolation:            footerStyle.isolation,
        contain:              footerStyle.contain,
        width:                "100%",
        boxSizing:            "border-box",
        animation: `guidanceReveal ${G_MOTION.reveal} ${animDelay} cubic-bezier(0.22,1,0.36,1) both`,
        flexDirection:"column",
        gap:12,
      }}>

        {/* ── Primary CTA ────────────────────────────────── */}
        <button
          className={`guidance-tap ${!disabled ? "guidance-cta-breathe" : ""}`}
          style={btnStyle}
          onClick={handlePress}
          onPointerDown={() => setIsActive(true)}
          onPointerUp={()   => setIsActive(false)}
          onPointerLeave={() => setIsActive(false)}
          disabled={disabled}
          aria-busy={loading}
        >
          {loading ? (
            <LoadingDots />
          ) : (
            <>
              <span>{cta}</span>
              {!disabled && <span style={{ opacity:0.60, fontSize:14 }}>→</span>}
            </>
          )}
        </button>

        {/* ── Secondary action ───────────────────────────── */}
        {secondary && (
          <button
            className="guidance-tap"
            onClick={secondary.onClick}
            style={{
              background:"none",
              border:"none",
              fontFamily:"inherit",
              fontSize:13.5,
              fontWeight:500,
              color:"rgba(255,255,255,0.42)",
              padding:"6px 16px",
              cursor:"pointer",
              letterSpacing:"-0.01em",
              transition:`color ${G_MOTION.focusShift} cubic-bezier(0.22,1,0.36,1)`,
            }}
          >
            {secondary.label}
          </button>
        )}

        {/* ── Quiet hint text ────────────────────────────── */}
        {hint && (
          <div style={{
            fontSize:11.5,
            color:"rgba(255,255,255,0.26)",
            textAlign:"center",
            letterSpacing:"0.01em",
            lineHeight:1.5,
            marginTop:-4,
          }}>
            {hint}
          </div>
        )}
      </div>
    </>
  );
}

// ── Loading indicator — 3 breathing dots ──────────────────────
function LoadingDots() {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:6, height:6, borderRadius:"50%",
          background:"rgba(7,17,20,0.55)",
          animation:`guidanceDot 1.2s ease-in-out ${i * 0.18}s infinite`,
        }}/>
      ))}
      <style>{`
        @keyframes guidanceDot {
          0%,100%{ opacity:0.35; transform:scale(1);   }
          50%    { opacity:0.80; transform:scale(1.42); }
        }
      `}</style>
    </div>
  );
}
