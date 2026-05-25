/**
 * OrbPortal.jsx — Phase 4H v3 "Die Bühne" (Screenshot-exakt)
 *
 * DESIGN-REFERENZ: Screenshot IMG_2606.jpg
 *
 * Was der Screenshot zeigt:
 *   - App bleibt vollständig sichtbar, nur warm-heller Schleier
 *   - Zentraler großer HUI-Logo-Orb (~110px) mit warmem Glow
 *   - 5 Nodes in organischer Kreiskomposition:
 *       oben:         Projekt einreichen (Coral, Document)
 *       links-mitte:  Moment teilen (Teal/Cyan, Blitz)
 *       rechts-mitte: Werk zeigen (Orange, Pinsel)
 *       links-unten:  Erlebnis öffnen (Blau, People)
 *       rechts-unten: Veranstaltung starten (Lila, Kalender)
 *   - Jeder Node: Icon-Kreis + fetter Label + Kurzbeschreibung
 *   - Zarte Verbindungslinien (Glow-Strahlen) zwischen Orb und Nodes
 *   - X-Button unten mittig
 *   - KEIN Panel, KEIN Sheet — alles schwebt frei
 *   - Hintergrund: warm-hell, soft blur, App sichtbar
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  teal:       "#0DC4B5",
  tealLight:  "#22DDD0",
  coral:      "#F47355",
  orange:     "#F0A030",
  blue:       "#4AADE8",
  violet:     "#9B7FE0",
  ink:        "#141422",
  ink2:       "rgba(20,20,34,0.68)",
  ink3:       "rgba(20,20,34,0.42)",
  white:      "#FFFFFF",
};

// ─── 5 Nodes (Screenshot-exakt) ───────────────────────────────────────────────
// Winkel: 0° = oben, im Uhrzeigersinn
// Screenshot: oben=Projekt, links=Moment, rechts=Werk, links-unten=Erlebnis, rechts-unten=Veranstaltung
const NODES = [
  {
    key:    "projekt",
    action: "impact",
    label:  "Projekt einreichen",
    desc:   "Reiche deine Vision beim HUI-Team ein und werde Teil des ImpactPools.",
    icon:   "📋",
    color:  "#F47355",   // Coral/Red wie Screenshot
    glow:   "rgba(244,115,85,",
    bg:     "linear-gradient(145deg, #FF7B5C 0%, #F05030 100%)",
    angle:  -90,   // oben mittig
    dist:   0.36,  // 36% des kleineren Viewports
    size:   68,
    featured: true,
  },
  {
    key:    "moment",
    action: "story",
    label:  "Moment teilen",
    desc:   "Teile, was dich gerade bewegt. Ein Gedanke, ein Bild, ein Gefühl.",
    icon:   "⚡",
    color:  "#0DC4B5",   // Teal/Cyan
    glow:   "rgba(13,196,181,",
    bg:     "linear-gradient(145deg, #22DDD0 0%, #0AB5A8 100%)",
    angle:  -155, // links-mitte (Screenshot: ca. 10 Uhr)
    dist:   0.36,
    size:   62,
  },
  {
    key:    "werk",
    action: "werk",
    label:  "Werk zeigen",
    desc:   "Präsentiere deine kreative Arbeit der Community.",
    icon:   "✏️",
    color:  "#F0A030",   // Orange/Gold
    glow:   "rgba(240,160,48,",
    bg:     "linear-gradient(145deg, #F5B84A 0%, #E89020 100%)",
    angle:  -25,   // rechts-mitte (Screenshot: ca. 2 Uhr)
    dist:   0.36,
    size:   62,
  },
  {
    key:    "erlebnis",
    action: "experience",
    label:  "Erlebnis öffnen",
    desc:   "Öffne einen Raum für echte Begegnungen und Erfahrungen.",
    icon:   "👥",
    color:  "#4AADE8",   // Blau
    glow:   "rgba(74,173,232,",
    bg:     "linear-gradient(145deg, #62BEF0 0%, #3898D8 100%)",
    angle:  155,   // links-unten (Screenshot: ca. 7-8 Uhr)
    dist:   0.36,
    size:   62,
  },
  {
    key:    "veranstaltung",
    action: "veranstaltung",
    label:  "Veranstaltung starten",
    desc:   "Bringe Menschen zusammen und erschaffe gemeinsame Momente.",
    icon:   "📅",
    color:  "#9B7FE0",   // Lila/Violet
    glow:   "rgba(155,127,224,",
    bg:     "linear-gradient(145deg, #B090F0 0%, #8868CC 100%)",
    angle:  25,    // rechts-unten (Screenshot: ca. 4-5 Uhr)
    dist:   0.36,
    size:   62,
  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  /* Backdrop: heller warm-weißer Schleier — App BLEIBT sichtbar */
  @keyframes huiBühneBackdropIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes huiBühneBackdropOut {
    from { opacity:1; }
    to   { opacity:0; }
  }

  /* Zentraler Orb: expandiert organisch aus der BottomNav heraus */
  @keyframes huiBühneOrbExpand {
    0%   { transform: translate(-50%,-50%) scale(0.35); opacity:0; }
    55%  { transform: translate(-50%,-50%) scale(1.06); opacity:1; }
    100% { transform: translate(-50%,-50%) scale(1);    opacity:1; }
  }

  /* Orb atmet warm */
  @keyframes huiBühneOrbBreath {
    0%,100% {
      box-shadow:
        0 0 0  0   rgba(13,196,181,0.00),
        0 0 50px   rgba(13,196,181,0.30),
        0 0 100px  rgba(244,115,85,0.12),
        0 6px 30px rgba(0,0,0,0.12);
    }
    50% {
      box-shadow:
        0 0 0  12px rgba(13,196,181,0.06),
        0 0 70px   rgba(13,196,181,0.42),
        0 0 130px  rgba(244,115,85,0.18),
        0 6px 40px rgba(0,0,0,0.14);
    }
  }

  /* Node: fliegt von Orb-Mitte nach außen */
  @keyframes huiBühneNodeOut {
    0%   { opacity:0; transform:scale(0.3); }
    60%  { opacity:1; transform:scale(1.05); }
    100% { opacity:1; transform:scale(1);   }
  }

  /* Node schwebt sanft */
  @keyframes huiBühneFloat0 { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-5px)} }
  @keyframes huiBühneFloat1 { 0%,100%{transform:translateY(2px)} 50%{transform:translateY(-4px)} }
  @keyframes huiBühneFloat2 { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(3px)} }
  @keyframes huiBühneFloat3 { 0%,100%{transform:translateY(1px)} 50%{transform:translateY(-5px)} }
  @keyframes huiBühneFloat4 { 0%,100%{transform:translateY(-2px)} 50%{transform:translateY(4px)} }

  /* Node Glow pulsiert */
  @keyframes huiBühneGlow {
    0%,100% { opacity:0.50; transform:scale(1);    }
    50%     { opacity:0.80; transform:scale(1.09); }
  }

  /* Label + Beschreibung einblenden */
  @keyframes huiBühneLabelIn {
    from { opacity:0; transform:translateY(4px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* Verbindungslinie erscheint */
  @keyframes huiBühneLineIn {
    from { opacity:0; }
    to   { opacity:1; }
  }

  /* X-Button */
  @keyframes huiBühneCloseIn {
    from { opacity:0; transform:translate(-50%,0) scale(0.6); }
    to   { opacity:1; transform:translate(-50%,0) scale(1);   }
  }

  /* Glaschimmer auf Nodes */
  @keyframes huiBühneShimmer {
    0%,100% { opacity:0.36; }
    50%     { opacity:0.55; }
  }

  .hui-bühne-node {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    outline: none;
  }
  .hui-bühne-node:active .hui-bühne-circle {
    transform: scale(0.90) !important;
    transition: transform 100ms cubic-bezier(0.22,1,0.36,1) !important;
  }
  .hui-bühne-close {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hui-bühne-close:active {
    transform: translate(-50%,0) scale(0.86) !important;
  }
`;

// ─── Polarkoordinaten → Pixel ─────────────────────────────────────────────────
function toPx(angleDeg, dist, cx, cy) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  const r   = Math.min(cx * 2, cy * 2) * 0.5 * dist;
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
}

// ─── SVG Verbindungslinien ────────────────────────────────────────────────────
function ConnectionLines({ nodes, cx, cy, vw, vh, orbR }) {
  return (
    <svg
      style={{
        position:     "absolute",
        inset:        0,
        width:        "100%",
        height:       "100%",
        pointerEvents:"none",
        zIndex:       2,
        animation:    "huiBühneLineIn 0.6s ease 0.3s both",
      }}
    >
      <defs>
        {nodes.map((node) => (
          <radialGradient key={node.key} id={`lg-${node.key}`} cx="0%" cy="0%" r="100%">
            <stop offset="0%"   stopColor={node.color} stopOpacity="0.0" />
            <stop offset="40%"  stopColor={node.color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={node.color} stopOpacity="0.08" />
          </radialGradient>
        ))}
      </defs>
      {nodes.map((node) => {
        const pos  = toPx(node.angle, node.dist, cx, cy);
        const dist = Math.sqrt((pos.x-cx)**2 + (pos.y-cy)**2);
        // Linie beginnt am Rand des Orbs
        const startR = orbR * 0.5 + 6;
        const ratio  = startR / dist;
        const sx = cx + (pos.x - cx) * ratio;
        const sy = cy + (pos.y - cy) * ratio;
        // Linie endet am Rand des Nodes
        const endR = node.size * 0.5 + 2;
        const ratio2 = (dist - endR) / dist;
        const ex = cx + (pos.x - cx) * ratio2;
        const ey = cy + (pos.y - cy) * ratio2;

        return (
          <line
            key={node.key}
            x1={sx} y1={sy} x2={ex} y2={ey}
            stroke={`url(#lg-${node.key})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

// ─── Einzelner Node ───────────────────────────────────────────────────────────
function OrbNode({ node, floatIdx, cx, cy, vw, vh, hoveredKey, onHover, onLeave, onSelect }) {
  const pos     = toPx(node.angle, node.dist, cx, cy);
  const SIZE    = node.size;
  const isHov   = hoveredKey === node.key;
  const isDim   = hoveredKey !== null && !isHov;
  const entryDelay = `${0.15 + floatIdx * 0.07}s`;
  const floatDur   = `${3.8 + floatIdx * 0.5}s`;
  const floatDel   = `${0.4 + floatIdx * 0.12}s`;

  // Label-Position: außen vom Node
  // Wir leiten aus dem Winkel ab wo das Label hin soll
  const ang    = node.angle;
  const isLeft = ang < -90 || ang > 90;
  const isTop  = ang < 0 && ang > -180;

  // Label-Offset relativ zum Node-Zentrum
  const labelStyle = {
    position:  "absolute",
    width:     140,
    textAlign: isLeft ? "right" : "left",
    top:       isTop
      ? "auto"
      : SIZE + 10,
    bottom:    isTop ? SIZE + 10 : "auto",
    left:      isLeft
      ? "auto"
      : SIZE / 2 - (isLeft ? 140 : 0),
    right:     isLeft ? SIZE / 2 : "auto",
    pointerEvents:"none",
    animation: `huiBühneLabelIn 0.40s ease ${parseFloat(entryDelay) + 0.18}s both`,
  };

  // Für die 5 spezifischen Positionen im Screenshot:
  // Label immer zwischen Node und Bildschirmmitte ausgerichtet
  const labelAlign = (() => {
    if (Math.abs(ang) < 30) return "left";   // rechts-mitte → Label links
    if (ang < -60 && ang > -120) return "center"; // oben → zentriert
    if (ang < -120) return "right";          // links → Label rechts
    if (ang > 120) return "right";           // links-unten → Label rechts
    return "left";
  })();

  const labelLeft = (() => {
    if (ang < -60 && ang > -120) return -(140 - SIZE) / 2; // oben: zentriert
    if (ang < -120 || ang > 120) return -(140 - SIZE / 2); // links: nach rechts
    return SIZE / 2;                                        // rechts: nach rechts
  })();

  const labelTop = (() => {
    if (ang < -60 && ang > -120) return -(70 + 10);        // oben: über Node
    if (ang > -60 && ang < 60)   return SIZE * 0.4;        // mitte: neben Node
    return SIZE + 8;                                        // unten: unter Node
  })();

  return (
    <button
      className="hui-bühne-node"
      onMouseEnter={() => onHover(node.key)}
      onMouseLeave={onLeave}
      onTouchStart={() => onHover(node.key)}
      onTouchEnd={onLeave}
      onClick={() => onSelect(node)}
      aria-label={node.label}
      style={{
        position:  "absolute",
        // Zentrum des Nodes
        left:      pos.x - SIZE / 2,
        top:       pos.y - SIZE / 2,
        width:     SIZE,
        height:    SIZE,
        padding:   0,
        border:    "none",
        background:"transparent",
        // Entry Animation
        animation: `huiBühneNodeOut 0.55s cubic-bezier(0.16,1,0.3,1) ${entryDelay} both`,
        opacity:   isDim ? 0.38 : 1,
        transition:"opacity 0.30s ease",
        zIndex:    10,
      }}
    >
      {/* Float-Wrapper */}
      <div style={{
        animation: `huiBühneFloat${floatIdx} ${floatDur} ${floatDel} ease-in-out infinite`,
        position:  "relative",
        width:     SIZE, height: SIZE,
      }}>
        {/* Glow Halo */}
        <div style={{
          position:     "absolute",
          left:         "50%", top: "50%",
          width:        SIZE + 44, height: SIZE + 44,
          transform:    "translate(-50%,-50%)",
          borderRadius: "50%",
          background:   `radial-gradient(circle, ${node.glow}0.22) 0%, ${node.glow}0) 68%)`,
          animation:    `huiBühneGlow ${floatDur} ease-in-out infinite`,
          pointerEvents:"none",
        }} />

        {/* Kreis */}
        <div
          className="hui-bühne-circle"
          style={{
            position:      "absolute",
            inset:         0,
            borderRadius:  "50%",
            background:    node.bg,
            border:        `2.5px solid rgba(255,255,255,${isHov ? "0.90" : "0.60"})`,
            boxShadow:     isHov
              ? `0 0 0 5px ${node.glow}0.15), 0 8px 28px ${node.glow}0.45), 0 2px 8px rgba(0,0,0,0.14)`
              : `0 4px 18px ${node.glow}0.38), 0 2px 6px rgba(0,0,0,0.12)`,
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            fontSize:      node.featured ? 24 : 22,
            overflow:      "hidden",
            transition:    "box-shadow 0.28s ease, border-color 0.28s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
            transform:     isHov ? "scale(1.12)" : "scale(1)",
          }}
        >
          {/* Glasschimmer */}
          <div style={{
            position:     "absolute",
            top:0, left:"5%",
            width:"90%", height:"48%",
            borderRadius: "50% 50% 0 0 / 55% 55% 0 0",
            background:   "linear-gradient(180deg,rgba(255,255,255,0.40) 0%,transparent 100%)",
            animation:    "huiBühneShimmer 5s ease-in-out infinite",
            pointerEvents:"none",
          }} />
          <span style={{ position:"relative", zIndex:1 }}>{node.icon}</span>
        </div>

        {/* Label + Beschreibung */}
        <div style={{
          position:  "absolute",
          width:     148,
          left:      labelLeft,
          top:       labelTop,
          textAlign: labelAlign,
          animation: `huiBühneLabelIn 0.38s ease ${parseFloat(entryDelay) + 0.20}s both`,
          pointerEvents:"none",
        }}>
          <div style={{
            fontSize:      12.5,
            fontWeight:    700,
            color:         isDim ? "rgba(20,20,34,0.35)" : C.ink,
            letterSpacing: "-0.02em",
            lineHeight:    1.25,
            marginBottom:  2,
            transition:    "color 0.25s ease",
          }}>
            {node.label}
          </div>
          <div style={{
            fontSize:      10.5,
            color:         isDim
              ? "rgba(20,20,34,0.22)"
              : "rgba(20,20,34,0.48)",
            letterSpacing: "-0.005em",
            lineHeight:    1.35,
            transition:    "color 0.25s ease",
          }}>
            {node.desc}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Zentraler Orb ────────────────────────────────────────────────────────────
function CenterOrb({ cx, cy, orbR, onClose, closing }) {
  return (
    <button
      onClick={onClose}
      aria-label="Schließen"
      style={{
        position:      "absolute",
        left:          cx, top: cy,
        width:         orbR * 2, height: orbR * 2,
        borderRadius:  "50%",
        border:        "3px solid rgba(255,255,255,0.82)",
        background:    "linear-gradient(145deg,#FFFFFF 0%,#F6FFFE 45%,#FFF4F0 100%)",
        animation:     closing
          ? "huiBühneBackdropOut 0.26s ease both"
          : `huiBühneOrbExpand 0.68s cubic-bezier(0.16,1,0.3,1) both,
             huiBühneOrbBreath 5s 0.9s ease-in-out infinite`,
        transform:     "translate(-50%,-50%)",
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        cursor:        "pointer",
        outline:       "none",
        WebkitTapHighlightColor: "transparent",
        touchAction:   "manipulation",
        pointerEvents: "auto",
        overflow:      "hidden",
        zIndex:        20,
        padding:       0,
      }}
    >
      {/* Inneres Glaslicht */}
      <div style={{
        position:     "absolute",
        top:0, left:"5%",
        width:"90%", height:"50%",
        borderRadius: "50% 50% 0 0 / 55% 55% 0 0",
        background:   "linear-gradient(180deg,rgba(255,255,255,0.75) 0%,transparent 100%)",
        pointerEvents:"none",
      }} />
      {/* Äußerer Wärme-Ring */}
      <div style={{
        position:     "absolute",
        inset:        -8,
        borderRadius: "50%",
        background:   "radial-gradient(circle,rgba(13,196,181,0.08) 0%,rgba(244,115,85,0.05) 60%,transparent 80%)",
        pointerEvents:"none",
      }} />
      {/* Logo */}
      <img
        src="/hui-logo-real.jpg"
        alt="HUI"
        style={{
          width:"76%", height:"76%",
          objectFit:"cover",
          borderRadius:"50%",
          position:"relative",
          zIndex:1,
        }}
        onError={(e) => {
          e.target.style.display="none";
          e.target.nextSibling.style.display="flex";
        }}
      />
      {/* Fallback */}
      <div style={{
        display:"none",
        position:"relative", zIndex:1,
        alignItems:"center",justifyContent:"center",
        width:"76%", height:"76%",
        borderRadius:"50%",
        background:"linear-gradient(135deg,#0DC4B5,#F47355)",
      }}>
        <span style={{
          fontFamily:"system-ui,sans-serif",
          fontSize:22, fontWeight:800,
          color:"#fff",
          letterSpacing:"-0.04em",
        }}>HUI</span>
      </div>
    </button>
  );
}

// ─── X-Button ─────────────────────────────────────────────────────────────────
function CloseButton({ cx, cy, orbR, onClose }) {
  return (
    <button
      className="hui-bühne-close"
      onClick={onClose}
      aria-label="Schließen"
      style={{
        position:      "absolute",
        left:          cx,
        top:           cy + orbR + 24,
        transform:     "translate(-50%,0)",
        width:         40, height:40,
        borderRadius:  "50%",
        background:    "rgba(255,255,255,0.88)",
        border:        "1.5px solid rgba(20,20,34,0.09)",
        boxShadow:     "0 2px 12px rgba(0,0,0,0.09)",
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        cursor:        "pointer",
        outline:       "none",
        animation:     "huiBühneCloseIn 0.36s ease 0.45s both",
        zIndex:        20,
        padding:       0,
        WebkitTapHighlightColor:"transparent",
        touchAction:   "manipulation",
      }}
    >
      <span style={{ fontSize:17, color:"rgba(20,20,34,0.40)", lineHeight:1, fontWeight:300 }}>
        ×
      </span>
    </button>
  );
}

// ─── Haupt-Export ─────────────────────────────────────────────────────────────
export function OrbPortal({
  visible  = false,
  onSelect,
  onClose,
  isTalent = false,
}) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [closing,    setClosing]    = useState(false);
  const closeTimerRef = useRef(null);

  // Viewport
  const getVw = () => window.visualViewport?.width  ?? window.innerWidth;
  const getVh = () => window.visualViewport?.height ?? window.innerHeight;
  const [vw, setVw] = useState(getVw);
  const [vh, setVh] = useState(getVh);
  useEffect(() => {
    const fn = () => { setVw(getVw()); setVh(getVh()); };
    const vvp = window.visualViewport;
    if (vvp) { vvp.addEventListener("resize", fn); return () => vvp.removeEventListener("resize", fn); }
    window.addEventListener("resize", fn, { passive:true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    if (!visible) { setHoveredKey(null); setClosing(false); }
  }, [visible]);

  const handleClose = useCallback(() => {
    setClosing(true);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => onClose?.(), 300);
  }, [onClose]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && visible) handleClose(); };
    window.addEventListener("keydown", fn);
    return () => { window.removeEventListener("keydown", fn); clearTimeout(closeTimerRef.current); };
  }, [visible, handleClose]);

  const handleSelect = useCallback((node) => {
    setTimeout(() => {
      onSelect?.(node.action);
      handleClose();
    }, 150);
  }, [onSelect, handleClose]);

  if (!visible && !closing) return null;

  // ── Layout Kalkulation ───────────────────────────────────────
  // BottomNav: 66px + safe area (~14px) = ~80px
  // Orb-Zentrum: vertikal gesehen im oberen 55% des verfügbaren Raums
  const NAV_HEIGHT = 82;
  const availH     = vh - NAV_HEIGHT;
  const cx         = vw / 2;
  const cy         = availH * 0.52;   // leicht unter Mitte verfügbarer Fläche
  const ORB_R      = Math.min(56, vw * 0.14);  // Orb-Radius ~56px

  const animBD = closing
    ? "huiBühneBackdropOut 0.28s ease both"
    : "huiBühneBackdropIn 0.36s ease both";

  return (
    <>
      <style>{CSS}</style>

      {/* ── Backdrop: warm-hell, App sichtbar ───────────────── */}
      <div
        onClick={handleClose}
        style={{
          position:             "fixed",
          inset:                0,
          zIndex:               9000,
          // Warm-weißer Schleier wie im Screenshot — App bleibt sichtbar
          background:           "rgba(248,245,240,0.72)",
          backdropFilter:       "blur(14px) saturate(1.06) brightness(1.04)",
          WebkitBackdropFilter: "blur(14px) saturate(1.06) brightness(1.04)",
          animation:            animBD,
        }}
      />

      {/* ── Bühne: alles frei schwebend, kein Panel ─────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:     "fixed",
          inset:        0,
          zIndex:       9001,
          pointerEvents:"none",
          animation:    animBD,
        }}
      >
        {/* Verbindungslinien (SVG, hinter Nodes) */}
        <ConnectionLines
          nodes={NODES}
          cx={cx}
          cy={cy}
          vw={vw}
          vh={vh}
          orbR={ORB_R}
        />

        {/* Zentraler Orb */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"auto" }}>
          <CenterOrb
            cx={cx}
            cy={cy}
            orbR={ORB_R}
            onClose={handleClose}
            closing={closing}
          />
        </div>

        {/* 5 Nodes */}
        {NODES.map((node, idx) => (
          <div key={node.key} style={{ position:"absolute", inset:0, pointerEvents:"auto" }}>
            <OrbNode
              node={node}
              floatIdx={idx}
              cx={cx}
              cy={cy}
              vw={vw}
              vh={vh}
              hoveredKey={hoveredKey}
              onHover={setHoveredKey}
              onLeave={() => setHoveredKey(null)}
              onSelect={handleSelect}
            />
          </div>
        ))}

        {/* X-Button */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"auto" }}>
          <CloseButton cx={cx} cy={cy} orbR={ORB_R} onClose={handleClose} />
        </div>
      </div>
    </>
  );
}
