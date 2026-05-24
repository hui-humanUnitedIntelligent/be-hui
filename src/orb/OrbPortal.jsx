/**
 * OrbPortal.jsx — Phase 4G
 *
 * Das emotionale Portal.
 * Kein Modal. Kein Menü. Kein Floating Action Button.
 *
 * FLOW:
 *   Tap auf Orb →
 *   Hintergrund dimmt weich →
 *   Feed bleibt spürbar dahinter →
 *   Orb expandiert organisch →
 *   Content-Optionen erscheinen ruhig, gestaffelt →
 *   Hover verändert die Atmosphäre →
 *   Tap öffnet den kreativen Raum
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { OrbAtmosphereLayer }   from "./OrbAtmosphere.jsx";
import {
  CONTENT_DNA,
  CONTENT_TYPE_ORDER,
  ORB_PORTAL_CSS,
  MOTION,
} from "./OrbMotionSystem.js";

// ─── HUI Logo Orb (Zentrum) ───────────────────────────────────────────────────
function PortalOrb({ activeType, onClose }) {
  const dna = activeType ? CONTENT_DNA[activeType] : null;

  return (
    <button
      className="orb-portal-close"
      onClick={onClose}
      aria-label="Portal schließen"
      style={{
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        width:         64, height: 64,
        borderRadius:  "50%",
        flexShrink:    0,
        border:        `2px solid ${dna ? `${dna.accentColor}40` : "rgba(13,196,181,0.30)"}`,
        background:    dna
          ? `radial-gradient(circle, ${dna.accentColor}18 0%, rgba(13,196,181,0.08) 100%)`
          : "radial-gradient(circle, rgba(13,196,181,0.18) 0%, rgba(13,196,181,0.06) 100%)",
        backdropFilter:       "blur(20px) saturate(1.5)",
        WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        animation:     `orbPortalExpand ${MOTION.orbExpand} both, orbPortalBreath 5s 0.8s ease-in-out infinite`,
        cursor:        "pointer",
        outline:       "none",
        WebkitTapHighlightColor: "transparent",
        transition:    `border-color ${MOTION.atmosShift}, background ${MOTION.atmosShift}`,
      }}
    >
      <span style={{
        fontFamily:    "'SF Pro Display', system-ui, sans-serif",
        fontSize:      13,
        fontWeight:    700,
        letterSpacing: "0.12em",
        background:    dna ? dna.accentGrad : "linear-gradient(135deg, #0DC4B5, #16D7C5)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor:  "transparent",
        userSelect:    "none",
        transition:    `all ${MOTION.atmosShift}`,
      }}>
        HUI
      </span>
    </button>
  );
}

// ─── Einzelne Content-Karte ───────────────────────────────────────────────────
function ContentCard({ dna, idx, hoveredKey, onHover, onLeave, onSelect, isLocked }) {
  const isHovered = hoveredKey === dna.key;
  const isDimmed  = hoveredKey !== null && !isHovered;
  const delay     = `${MOTION.staggerStart + idx * MOTION.staggerBase}s`;

  return (
    <button
      className="orb-portal-card"
      onMouseEnter={() => !isLocked && onHover(dna.key)}
      onMouseLeave={onLeave}
      onTouchStart={() => !isLocked && onHover(dna.key)}
      onFocus={() => !isLocked && onHover(dna.key)}
      onBlur={onLeave}
      onClick={() => !isLocked && onSelect(dna)}
      disabled={isLocked}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           14,
        width:         "100%",
        padding:       "15px 18px",
        borderRadius:  20,
        border:        `1.5px solid ${isHovered ? dna.cardBorder : "rgba(255,252,248,0.10)"}`,
        cursor:        isLocked ? "not-allowed" : "pointer",
        background:    isHovered ? dna.cardBg : "rgba(249,247,244,0.03)",
        backdropFilter:       "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        boxShadow:     isHovered
          ? `0 8px 32px ${dna.glow}, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 2px 10px rgba(0,0,0,0.03)",
        animation:     `orbCardReveal ${MOTION.cardReveal} ${delay} both`,
        transform:     isDimmed ? "scale(0.975)" : "scale(1)",
        opacity:       isLocked ? 0.30 : isDimmed ? 0.40 : 1,
        transition:    [
          `opacity 0.40s ease`,
          `transform 0.40s ease`,
          `box-shadow 0.32s ease`,
          `background 0.32s ease`,
          `border-color 0.32s ease`,
        ].join(", "),
        textAlign:     "left",
        outline:       "none",
        WebkitTapHighlightColor: "transparent",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Pulse Ring */}
      {isHovered && (
        <div style={{
          position:     "absolute",
          inset:        -2,
          borderRadius: 22,
          border:       `1.5px solid ${dna.accentColor}50`,
          animation:    "orbPortalRingPulse 2.4s ease-in-out infinite",
          pointerEvents:"none",
        }} />
      )}

      {/* Icon */}
      <div style={{
        flexShrink:    0,
        width:         48, height: 48,
        borderRadius:  14,
        background:    isHovered
          ? `linear-gradient(145deg, ${dna.accentColor}22 0%, ${dna.accentColor}08 100%)`
          : "rgba(255,252,248,0.05)",
        border:        `1.5px solid ${isHovered ? dna.cardBorder : "rgba(255,252,248,0.08)"}`,
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        transition:    "all 0.32s ease",
        boxShadow:     isHovered ? `0 4px 16px ${dna.glow}` : "none",
      }}>
        <span style={{
          fontSize:      22,
          fontWeight:    300,
          background:    isHovered ? dna.accentGrad : "rgba(255,252,248,0.65)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor:  "transparent",
          display:       "block",
          lineHeight:    1,
          transition:    "all 0.32s ease",
        }}>
          {dna.icon}
        </span>
      </div>

      {/* Text Block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:      15,
          fontWeight:    600,
          color:         isHovered ? dna.accentColor : "rgba(255,252,248,0.88)",
          letterSpacing: "-0.02em",
          lineHeight:    1.2,
          marginBottom:  3,
          transition:    "color 0.28s ease",
        }}>
          {dna.label}
        </div>
        <div style={{
          fontSize:      12,
          color:         isHovered
            ? `${dna.accentColor}99`
            : "rgba(255,252,248,0.38)",
          letterSpacing: "-0.005em",
          lineHeight:    1.38,
          transition:    "color 0.28s ease",
        }}>
          {dna.tagline}
        </div>
        {/* Energie — nur bei Hover */}
        <div style={{
          fontSize:      10,
          color:         `${dna.accentColor}80`,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight:    500,
          marginTop:     4,
          opacity:       isHovered ? 1 : 0,
          transform:     isHovered ? "translateY(0)" : "translateY(5px)",
          transition:    "opacity 0.28s ease, transform 0.28s ease",
        }}>
          {dna.energy}
        </div>
      </div>

      {/* Locked Badge */}
      {isLocked && (
        <div style={{
          fontSize:      10,
          color:         "rgba(255,252,248,0.30)",
          border:        "1px solid rgba(255,252,248,0.12)",
          borderRadius:  6,
          padding:       "2px 7px",
          letterSpacing: "0.04em",
          fontWeight:    500,
        }}>
          Wirker
        </div>
      )}

      {/* Chevron */}
      {!isLocked && (
        <div style={{
          flexShrink:  0,
          fontSize:    14,
          color:       isHovered ? dna.accentColor : "rgba(255,252,248,0.18)",
          opacity:     isHovered ? 1 : 0.5,
          transform:   isHovered ? "translateX(3px)" : "translateX(0)",
          transition:  "all 0.28s ease",
          fontWeight:  300,
        }}>
          ›
        </div>
      )}
    </button>
  );
}

// ─── OrbPortal Hauptkomponente ────────────────────────────────────────────────
export function OrbPortal({
  visible  = false,
  onSelect,
  onClose,
  isTalent = false,
}) {
  const [hoveredKey,  setHoveredKey]  = useState(null);
  const [activeKey,   setActiveKey]   = useState(null);
  const [closing,     setClosing]     = useState(false);
  const closeTimerRef = useRef(null);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setHoveredKey(null);
      setActiveKey(null);
      setClosing(false);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    setClosing(true);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => onClose?.(), 300);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && visible) handleClose(); };
    window.addEventListener("keydown", fn);
    return () => {
      window.removeEventListener("keydown", fn);
      clearTimeout(closeTimerRef.current);
    };
  }, [visible, handleClose]);

  const handleSelect = useCallback((dna) => {
    setActiveKey(dna.key);
    setTimeout(() => {
      onSelect?.(dna.action);
      handleClose();
    }, 200);
  }, [onSelect, handleClose]);

  // Effektiver Atmosphären-Typ: hover hat Vorrang
  const effectiveType = hoveredKey || activeKey || null;

  if (!visible && !closing) return null;

  const animIn  = `orbPortalBackdropIn ${MOTION.backdropIn} both`;
  const animOut = `orbPortalBackdropOut ${MOTION.closeFade} both`;

  return (
    <>
      <style>{ORB_PORTAL_CSS}</style>

      {/* Backdrop — Feed bleibt spürbar dahinter */}
      <div
        onClick={handleClose}
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          9000,
          background:      "rgba(12,12,20,0.68)",
          backdropFilter:  "blur(20px) saturate(0.82)",
          WebkitBackdropFilter: "blur(20px) saturate(0.82)",
          animation:       closing ? animOut : animIn,
          transition:      `background ${MOTION.atmosShift}`,
        }}
      />

      {/* Atmosphären-Blobs */}
      <div style={{
        position:     "fixed",
        inset:        0,
        zIndex:       9001,
        pointerEvents:"none",
        overflow:     "hidden",
      }}>
        <OrbAtmosphereLayer activeType={effectiveType} />
      </div>

      {/* Portal Panel — bottom sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:    "fixed",
          bottom:      0,
          left:        0,
          right:       0,
          zIndex:      9002,
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          paddingLeft:  12,
          paddingRight: 12,
          animation:   closing
            ? `orbCardReveal ${MOTION.closeFade} reverse both`
            : `orbCardReveal 0.54s cubic-bezier(0.16,1,0.3,1) 0.06s both`,
        }}
      >
        <div style={{
          maxWidth:    500,
          margin:      "0 auto",
          background:  "rgba(16,16,26,0.68)",
          backdropFilter:       "blur(44px) saturate(1.7)",
          WebkitBackdropFilter: "blur(44px) saturate(1.7)",
          borderRadius:"28px 28px 22px 22px",
          border:      "1px solid rgba(255,252,248,0.09)",
          boxShadow:   [
            "0 -4px 40px rgba(0,0,0,0.28)",
            "0 0 0 0.5px rgba(255,252,248,0.05)",
            effectiveType
              ? `0 -1px 60px ${CONTENT_DNA[effectiveType].glow}`
              : "none",
          ].filter(Boolean).join(", "),
          overflow:    "hidden",
          transition:  `box-shadow ${MOTION.atmosShift}`,
        }}>
          <div style={{ padding: "22px 18px 18px" }}>

            {/* Header Row: Orb + Titel */}
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          15,
              marginBottom: 20,
            }}>
              <PortalOrb activeType={effectiveType} onClose={handleClose} />

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize:      10,
                  fontWeight:    600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color:         effectiveType
                    ? `${CONTENT_DNA[effectiveType].accentColor}88`
                    : "rgba(255,252,248,0.28)",
                  marginBottom:  5,
                  transition:    `color ${MOTION.atmosShift}`,
                }}>
                  {effectiveType ? CONTENT_DNA[effectiveType].label : "Erschaffe"}
                </div>
                <div style={{
                  fontSize:      16,
                  fontWeight:    600,
                  letterSpacing: "-0.025em",
                  color:         "rgba(255,252,248,0.90)",
                  lineHeight:    1.3,
                  minHeight:     42,
                  display:       "flex",
                  alignItems:    "center",
                  transition:    `all 0.32s ease`,
                }}>
                  {effectiveType
                    ? CONTENT_DNA[effectiveType].tagline
                    : "Was möchtest du in die Welt bringen?"}
                </div>
              </div>
            </div>

            {/* Content Type Cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {CONTENT_TYPE_ORDER.map((key, idx) => {
                const dna    = CONTENT_DNA[key];
                const locked = !isTalent && (key === "experience" || key === "work");
                return (
                  <ContentCard
                    key={key}
                    dna={dna}
                    idx={idx}
                    hoveredKey={hoveredKey}
                    onHover={setHoveredKey}
                    onLeave={() => setHoveredKey(null)}
                    onSelect={handleSelect}
                    isLocked={locked}
                  />
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              marginTop:     14,
              paddingTop:    14,
              borderTop:     "1px solid rgba(255,252,248,0.06)",
              display:       "flex",
              justifyContent:"center",
            }}>
              <button
                onClick={handleClose}
                style={{
                  fontSize:      12,
                  color:         "rgba(255,252,248,0.30)",
                  background:    "none",
                  border:        "none",
                  cursor:        "pointer",
                  letterSpacing: "-0.01em",
                  padding:       "4px 12px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Schließen
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
