/**
 * OrbPortal.jsx — Phase 4G v2 (Screenshot-exact)
 *
 * DESIGN REFERENZ: Screenshot HUI App
 *
 * Was der Screenshot zeigt:
 *  - HELLER Hintergrund (App bleibt sichtbar, nur soft blur)
 *  - Zentraler großer Logo-Orb mit warmem Lichtschein
 *  - 4 organische schwebende Action-Nodes (unterschiedliche Farben + Icons)
 *  - Nodes radial um den Orb positioniert
 *  - X-Button unten
 *  - Keine Karten, keine Textkisten — nur schwebende Kreise
 *
 * FARBWELT:
 *  - Moment:       Teal/Cyan Glow (oben)
 *  - Werk:         Coral/Orange (rechts oben)
 *  - Erlebnis:     Blau (rechts unten)
 *  - Veranstaltung: Coral/Red (links unten)
 *  - Zentrum:      HUI Logo — Türkis + Coral Gradient
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  /* Backdrop: hell, soft blur — App bleibt sichtbar */
  @keyframes huiOrbBackdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes huiOrbBackdropOut {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* Zentraler Orb: expandiert organisch */
  @keyframes huiOrbExpand {
    0%   { transform: scale(0.45); opacity: 0; }
    55%  { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }

  /* Logo-Orb atmet */
  @keyframes huiOrbBreath {
    0%,100% {
      box-shadow:
        0 0 0 0   rgba(13,196,181,0.00),
        0 0 60px  rgba(13,196,181,0.28),
        0 0 120px rgba(13,196,181,0.14),
        0 8px 40px rgba(244,115,85,0.12);
    }
    50% {
      box-shadow:
        0 0 0 14px rgba(13,196,181,0.06),
        0 0 80px  rgba(13,196,181,0.40),
        0 0 160px rgba(13,196,181,0.18),
        0 8px 60px rgba(244,115,85,0.18);
    }
  }

  /* Node Entry: von Orb-Mitte nach außen */
  @keyframes huiNodeReveal {
    0%   { opacity: 0; transform: translate(var(--nx), var(--ny)) scale(0.3); }
    60%  { transform: translate(var(--tx), var(--ty)) scale(1.05); opacity: 1; }
    100% { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1); }
  }

  /* Node Float: sanftes Schweben */
  @keyframes huiNodeFloatA { 0%,100%{margin-top:0}     50%{margin-top:-6px} }
  @keyframes huiNodeFloatB { 0%,100%{margin-top:3px}   50%{margin-top:-4px} }
  @keyframes huiNodeFloatC { 0%,100%{margin-top:-3px}  50%{margin-top:4px}  }
  @keyframes huiNodeFloatD { 0%,100%{margin-top:2px}   50%{margin-top:-5px} }

  /* Glow Pulse für Nodes */
  @keyframes huiNodeGlowPulse {
    0%,100% { opacity: 0.55; transform: scale(1);    }
    50%     { opacity: 0.85; transform: scale(1.08); }
  }

  /* Zentraler Lichtschein unter dem Orb */
  @keyframes huiOrbGroundGlow {
    0%,100% { opacity: 0.45; transform: translate(-50%,-50%) scale(1);    }
    50%     { opacity: 0.65; transform: translate(-50%,-50%) scale(1.08); }
  }

  /* X-Button Entry */
  @keyframes huiCloseIn {
    0%   { opacity:0; transform:scale(0.6); }
    100% { opacity:1; transform:scale(1);   }
  }

  /* Label fade */
  @keyframes huiLabelIn {
    0%   { opacity:0; transform:translateY(5px); }
    100% { opacity:1; transform:translateY(0);   }
  }

  .hui-orb-node:active {
    transform: scale(0.93) !important;
    transition: transform 120ms cubic-bezier(0.22,1,0.36,1) !important;
  }
  .hui-orb-close:active {
    transform: scale(0.88) !important;
    transition: transform 100ms ease !important;
  }
`;

// ─── Action Nodes Definition ──────────────────────────────────────────────────
// Screenshot-exakt: 4 Nodes, radial um den Zentral-Orb
// Positionen: oben (Moment), rechts-oben (Werk), rechts-unten (Erlebnis), links-unten (Veranstaltung)
const NODES = [
  {
    key:       "moment",
    label:     "Spontaner\nMoment",
    icon:      "⚡",
    action:    "story",
    // Position relativ zum Zentrum: oben-mittig, leicht links
    angle:     -90,   // oben
    dist:      0.42,  // Abstand als % des kleineren Viewports
    size:      70,
    // Teal/Cyan wie im Screenshot
    bg:        "linear-gradient(145deg, #16D7C5 0%, #0DC4B5 100%)",
    glow:      "rgba(13,196,181,0.45)",
    glowBig:   "rgba(13,196,181,0.18)",
    float:     "huiNodeFloatA",
    floatDur:  "3.8s",
    delay:     0.12,
    priority:  true,  // größer im Screenshot
  },
  {
    key:       "werk",
    label:     "Werk\nveröffentlichen",
    icon:      "✏️",
    action:    "werk",
    // Rechts oben
    angle:     -22,
    dist:      0.38,
    size:      62,
    // Coral/Orange
    bg:        "linear-gradient(145deg, #F47355 0%, #E05C3C 100%)",
    glow:      "rgba(244,115,85,0.45)",
    glowBig:   "rgba(244,115,85,0.18)",
    float:     "huiNodeFloatB",
    floatDur:  "4.2s",
    delay:     0.20,
    priority:  false,
  },
  {
    key:       "erlebnis",
    label:     "Erlebnis\nveröffentlichen",
    icon:      "👥",
    action:    "experience",
    // Rechts unten
    angle:     42,
    dist:      0.38,
    size:      62,
    // Blau wie im Screenshot
    bg:        "linear-gradient(145deg, #4FB8F0 0%, #2A9FE0 100%)",
    glow:      "rgba(42,159,224,0.45)",
    glowBig:   "rgba(42,159,224,0.18)",
    float:     "huiNodeFloatC",
    floatDur:  "4.6s",
    delay:     0.28,
    priority:  false,
  },
  {
    key:       "veranstaltung",
    label:     "Veranstaltung\nerstellen",
    icon:      "📅",
    action:    "event",
    // Links unten
    angle:     210,
    dist:      0.38,
    size:      62,
    // Coral/Red wie im Screenshot
    bg:        "linear-gradient(145deg, #F47355 0%, #C94A2A 100%)",
    glow:      "rgba(244,115,85,0.45)",
    glowBig:   "rgba(244,115,85,0.18)",
    float:     "huiNodeFloatD",
    floatDur:  "5.0s",
    delay:     0.36,
    priority:  false,
  },
];

// ─── Polar → Pixel ────────────────────────────────────────────────────────────
function polarPx(angleDeg, dist, vw, vh) {
  const minDim = Math.min(vw, vh);
  const r      = minDim * dist;
  const rad    = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: Math.cos(rad) * r,
    y: Math.sin(rad) * r,
  };
}

// ─── Einzelner Node ───────────────────────────────────────────────────────────
function OrbNode({ node, idx, orbCx, orbCy, vw, vh, hoveredKey, onHover, onLeave, onSelect }) {
  const pos      = polarPx(node.angle, node.dist, vw, vh);
  const SIZE     = node.size;
  const isHov    = hoveredKey === node.key;
  const isDimmed = hoveredKey !== null && !isHov;
  const delay    = `${node.delay}s`;

  // Finale Position: Orb-Zentrum + polar offset
  const tx = orbCx + pos.x - SIZE / 2;
  const ty = orbCy + pos.y - SIZE / 2;

  return (
    <div
      style={{
        position:   "absolute",
        left:       0,
        top:        0,
        // Entry animation von Orb-Mitte nach außen
        "--nx": `${orbCx - SIZE / 2}px`,
        "--ny": `${orbCy - SIZE / 2}px`,
        "--tx": `${tx}px`,
        "--ty": `${ty}px`,
        animation:  `huiNodeReveal 0.55s cubic-bezier(0.16,1,0.3,1) ${delay} both`,
        // Float nach Entry
        willChange: "transform",
        zIndex:     20,
      }}
    >
      {/* Float-Wrapper */}
      <div style={{
        animation:  `${node.float} ${node.floatDur} ${parseFloat(node.delay) + 0.6}s ease-in-out infinite`,
      }}>
        {/* Glow-Halo hinter dem Node */}
        <div
          aria-hidden="true"
          style={{
            position:     "absolute",
            left:         "50%",
            top:          "50%",
            width:        SIZE + 40,
            height:       SIZE + 40,
            transform:    "translate(-50%,-50%)",
            borderRadius: "50%",
            background:   `radial-gradient(circle, ${node.glowBig} 0%, transparent 70%)`,
            animation:    `huiNodeGlowPulse ${node.floatDur} ease-in-out infinite`,
            opacity:      isHov ? 1 : isDimmed ? 0.2 : 0.6,
            transition:   "opacity 0.35s ease",
            pointerEvents:"none",
          }}
        />

        {/* Node-Kreis */}
        <button
          className="hui-orb-node"
          onMouseEnter={() => onHover(node.key)}
          onMouseLeave={onLeave}
          onTouchStart={() => onHover(node.key)}
          onTouchEnd={onLeave}
          onClick={() => onSelect(node)}
          aria-label={node.label.replace("\n", " ")}
          style={{
            position:      "relative",
            width:         SIZE,
            height:        SIZE,
            borderRadius:  "50%",
            background:    node.bg,
            border:        isHov
              ? `2.5px solid rgba(255,255,255,0.85)`
              : `2px solid rgba(255,255,255,0.50)`,
            boxShadow: isHov
              ? `0 0 0 6px ${node.glow.replace("0.45", "0.12")}, 0 8px 32px ${node.glow}, 0 2px 8px rgba(0,0,0,0.14)`
              : `0 4px 20px ${node.glow}, 0 2px 8px rgba(0,0,0,0.12)`,
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            fontSize:      node.priority ? 26 : 22,
            cursor:        "pointer",
            opacity:       isDimmed ? 0.38 : 1,
            transform:     isHov ? "scale(1.10)" : "scale(1)",
            transition:    [
              "opacity 0.32s ease",
              "transform 0.32s cubic-bezier(0.34,1.56,0.64,1)",
              "box-shadow 0.32s ease",
              "border-color 0.28s ease",
            ].join(", "),
            padding:       0,
            outline:       "none",
            WebkitTapHighlightColor: "transparent",
            touchAction:   "manipulation",
            // Highlight shimmer on top
            overflow:      "hidden",
          }}
        >
          {/* Inner highlight (glass-shimmer) */}
          <div style={{
            position:     "absolute",
            top:          0, left: "8%",
            width:        "84%",
            height:       "46%",
            borderRadius: "50% 50% 0 0 / 55% 55% 0 0",
            background:   "linear-gradient(180deg, rgba(255,255,255,0.36) 0%, transparent 100%)",
            pointerEvents:"none",
          }} />
          <span style={{ position: "relative", zIndex: 1 }}>{node.icon}</span>
        </button>

        {/* Label unter dem Node */}
        <div
          aria-hidden="true"
          style={{
            position:      "absolute",
            top:           SIZE + 8,
            left:          "50%",
            transform:     "translateX(-50%)",
            whiteSpace:    "nowrap",
            textAlign:     "center",
            fontSize:      11,
            fontWeight:    600,
            lineHeight:    1.35,
            color:         isDimmed ? "rgba(20,20,34,0.28)" : "rgba(20,20,34,0.72)",
            letterSpacing: "-0.01em",
            animation:     `huiLabelIn 0.38s ease ${parseFloat(node.delay) + 0.25}s both`,
            transition:    "color 0.32s ease",
            pointerEvents: "none",
            // Label-Zeilenumbruch via \n
            whiteSpace:    "pre",
          }}
        >
          {node.label}
        </div>
      </div>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export function OrbPortal({
  visible  = false,
  onSelect,
  onClose,
  isTalent = false,
}) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [closing,    setClosing]    = useState(false);
  const [vw,         setVw]         = useState(
    () => window.visualViewport?.width  ?? window.innerWidth
  );
  const [vh,         setVh]         = useState(
    () => window.visualViewport?.height ?? window.innerHeight
  );
  const closeTimerRef = useRef(null);
  const containerRef  = useRef(null);

  // Viewport tracking
  useEffect(() => {
    const update = () => {
      setVw(window.visualViewport?.width  ?? window.innerWidth);
      setVh(window.visualViewport?.height ?? window.innerHeight);
    };
    const vvp = window.visualViewport;
    if (vvp) { vvp.addEventListener("resize", update); return () => vvp.removeEventListener("resize", update); }
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset
  useEffect(() => {
    if (!visible) { setHoveredKey(null); setClosing(false); }
  }, [visible]);

  const handleClose = useCallback(() => {
    setClosing(true);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => onClose?.(), 320);
  }, [onClose]);

  // Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && visible) handleClose(); };
    window.addEventListener("keydown", fn);
    return () => { window.removeEventListener("keydown", fn); clearTimeout(closeTimerRef.current); };
  }, [visible, handleClose]);

  const handleSelect = useCallback((node) => {
    // Kurzer visueller Moment bevor Action
    setTimeout(() => {
      onSelect?.(node.action);
      handleClose();
    }, 160);
  }, [onSelect, handleClose]);

  if (!visible && !closing) return null;

  // Orb-Zentrum: Mitte des Viewports, leicht nach oben (wie im Screenshot)
  // Der Orb sitzt in der Mitte des verfügbaren Bereichs über der BottomNav
  const NAV_H   = 80;    // BottomNav Höhe
  const SAFE    = 20;    // safe area
  const ORB_SIZE= 120;   // Zentral-Orb Durchmesser
  // Zentrum des verfügbaren Bereichs
  const orbCx   = vw / 2;
  const orbCy   = (vh - NAV_H - SAFE) * 0.52;  // 52% von oben = leicht Mitte-unten

  const anim = closing
    ? "huiOrbBackdropOut 0.30s ease both"
    : "huiOrbBackdropIn 0.40s ease both";

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop: HELL, soft blur, App bleibt sichtbar */}
      <div
        onClick={handleClose}
        style={{
          position:             "fixed",
          inset:                0,
          zIndex:               9000,
          // Hell, nicht dunkel — wie im Screenshot
          background:           "rgba(249,247,242,0.72)",
          backdropFilter:       "blur(12px) saturate(1.05)",
          WebkitBackdropFilter: "blur(12px) saturate(1.05)",
          animation:            anim,
        }}
      />

      {/* Portal Container: absolut positioniert über Backdrop */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position:     "fixed",
          inset:        0,
          zIndex:       9001,
          pointerEvents:"none",
          overflow:     "hidden",
          animation:    anim,
        }}
      >
        {/* ── Zentral-Orb Bodenglow ──────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position:     "absolute",
            left:         orbCx,
            top:          orbCy,
            width:        280,
            height:       180,
            transform:    "translate(-50%,-30%)",
            borderRadius: "50%",
            background:   "radial-gradient(ellipse, rgba(13,196,181,0.22) 0%, rgba(244,115,85,0.08) 50%, transparent 72%)",
            filter:       "blur(32px)",
            animation:    "huiOrbGroundGlow 4s ease-in-out infinite",
            pointerEvents:"none",
          }}
        />

        {/* ── Logo-Orb (Zentrum) ─────────────────────────────── */}
        <button
          onClick={handleClose}
          aria-label="Portal schließen"
          style={{
            position:      "absolute",
            left:          orbCx,
            top:           orbCy,
            width:         ORB_SIZE,
            height:        ORB_SIZE,
            marginLeft:    -(ORB_SIZE / 2),
            marginTop:     -(ORB_SIZE / 2),
            borderRadius:  "50%",
            border:        "3px solid rgba(255,255,255,0.75)",
            background:    "linear-gradient(145deg, #FFFFFF 0%, #F5FFFE 40%, #FFF5F2 100%)",
            boxShadow:     [
              "0 0 0 0 rgba(13,196,181,0)",
              "0 8px 40px rgba(13,196,181,0.30)",
              "0 2px 12px rgba(0,0,0,0.10)",
              "0 0 80px rgba(13,196,181,0.18)",
            ].join(", "),
            animation:     closing
              ? "huiOrbBackdropOut 0.28s ease both"
              : `huiOrbExpand 0.65s cubic-bezier(0.16,1,0.3,1) both, huiOrbBreath 5s 0.8s ease-in-out infinite`,
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            cursor:        "pointer",
            outline:       "none",
            WebkitTapHighlightColor: "transparent",
            touchAction:   "manipulation",
            pointerEvents: "auto",
            overflow:      "hidden",
            zIndex:        30,
          }}
        >
          {/* Inner glass shimmer */}
          <div style={{
            position:     "absolute",
            top: 0, left: "6%",
            width: "88%", height: "48%",
            borderRadius: "50% 50% 0 0 / 55% 55% 0 0",
            background:   "linear-gradient(180deg, rgba(255,255,255,0.80) 0%, transparent 100%)",
            pointerEvents:"none",
          }} />
          {/* Logo */}
          <img
            src="/hui-logo-real.jpg"
            alt="HUI"
            style={{
              width:        "78%",
              height:       "78%",
              objectFit:    "cover",
              borderRadius: "50%",
              position:     "relative",
              zIndex:       1,
            }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          {/* Fallback Wordmark */}
          <span style={{
            display:       "none",
            fontFamily:    "'SF Pro Display', system-ui, sans-serif",
            fontSize:      20,
            fontWeight:    800,
            letterSpacing: "-0.04em",
            background:    "linear-gradient(135deg, #0DC4B5, #F47355)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            position:      "relative",
            zIndex:        1,
          }}>
            HUI
          </span>
        </button>

        {/* ── Action Nodes ───────────────────────────────────── */}
        {NODES.map((node, idx) => (
          <OrbNode
            key={node.key}
            node={node}
            idx={idx}
            orbCx={orbCx}
            orbCy={orbCy}
            vw={vw}
            vh={vh}
            hoveredKey={hoveredKey}
            onHover={setHoveredKey}
            onLeave={() => setHoveredKey(null)}
            onSelect={handleSelect}
          />
        ))}

        {/* ── X-Close Button ────────────────────────────────── */}
        <button
          className="hui-orb-close"
          onClick={handleClose}
          aria-label="Schließen"
          style={{
            position:      "absolute",
            left:          orbCx,
            top:           orbCy + ORB_SIZE / 2 + 36,
            marginLeft:    -22,
            width:         44,
            height:        44,
            borderRadius:  "50%",
            background:    "rgba(255,255,255,0.92)",
            border:        "1.5px solid rgba(0,0,0,0.08)",
            boxShadow:     "0 2px 16px rgba(0,0,0,0.10)",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            cursor:        "pointer",
            outline:       "none",
            WebkitTapHighlightColor: "transparent",
            touchAction:   "manipulation",
            pointerEvents: "auto",
            animation:     `huiCloseIn 0.38s ease 0.42s both`,
            zIndex:        30,
          }}
        >
          <span style={{
            fontSize:   18,
            color:      "rgba(20,20,34,0.45)",
            lineHeight: 1,
            fontWeight: 300,
          }}>×</span>
        </button>
      </div>
    </>
  );
}
