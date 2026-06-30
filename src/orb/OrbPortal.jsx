/**
 * OrbPortal.jsx — Phase 4H v4 "Die lebendige Bühne"
 *
 * DESIGN-REFERENZ: Screenshot IMG_2607.jpg (EXAKTE VORLAGE)
 *
 * Screenshot-Analyse:
 *   - Dunkler semi-transparenter Backdrop — App bleibt sichtbar
 *   - Großer glasiger Kreis-Ring (Orb-Aura, ~320px Ø) mit Funken/Sternen
 *   - Zentraler Orb: ~90px, Teal, weißes H-Symbol, starker Glow
 *   - 5 Nodes im perfekten Kreis um den Orb:
 *       oben (ca. 12 Uhr):       Teilen       — Mint/Sage  — Blatt-Icon
 *       oben-rechts (ca. 2 Uhr): Werk         — Orange     — Palette-Icon
 *       unten-rechts (ca. 4 Uhr):Erlebnis     — Soft Blue  — Kalender-Icon
 *       unten-links (ca. 8 Uhr): Wirkung      — Coral/Red  — Herz-Icon
 *       links (ca. 10 Uhr):      Verbindung   — Soft Violet— People-Icon
 *   - Jeder Node: ~64px Kreis, weißes Icon, Label+Beschreibung außen
 *   - X-Button: weiß, unten mittig (unter dem Ring)
 *   - Verbindungslinien: sanft glühend, von Nodes zum Zentrum
 *   - Funken/Sterne im Aura-Ring
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";

// ─── 5 Nodes — exakt wie Screenshot ──────────────────────────────────────────
const NODES = [
  {
    key:    "teilen",
    action: "story",
    label:  "Teilen",
    desc:   "Zeige etwas, das\ndich bewegt.",
    // Mint/Sage — oben, ~12 Uhr
    bg:     "linear-gradient(145deg, #7ECBA8 0%, #5BB892 100%)",
    glow:   "rgba(94,184,146,",
    angle:  0,      // 0° = oben (12 Uhr)
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeOpacity="0"/>
        <path d="M12 22V12M12 12l-4-4M12 12l4-4" />
        <circle cx="12" cy="5" r="2" fill="white" stroke="none"/>
        <path d="M5 19c1.5-2 3.5-3 7-3s5.5 1 7 3" />
      </svg>
    ),
  },
  {
    key:    "werk",
    action: "werk",
    label:  "Werk\nerschaffen",
    desc:   "Biete deine Kunst,\ndein Handwerk\noder Design an.",
    // Warm Orange — rechts-oben, ~2 Uhr
    bg:     "linear-gradient(145deg, #F0A855 0%, #E08830 100%)",
    glow:   "rgba(230,148,65,",
    angle:  72,     // 72° im Uhrzeigersinn von oben
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <circle cx="12" cy="12" r="3" fill="white" stroke="none" fillOpacity="0.9"/>
        <circle cx="12" cy="12" r="6" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeOpacity="0.5"/>
        <path d="M7 7l1.5 1.5M15.5 15.5L17 17M17 7l-1.5 1.5M8.5 15.5L7 17" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  {
    key:    "erlebnis",
    action: "experience",
    label:  "Erlebnis\nöffnen",
    desc:   "Lade Menschen in\neinen besonderen\nMoment ein.",
    // Soft Blue — rechts-unten, ~4–5 Uhr
    bg:     "linear-gradient(145deg, #6AB8E8 0%, #4498CC 100%)",
    glow:   "rgba(90,168,220,",
    angle:  144,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <rect x="8" y="13" width="3" height="3" rx="1" fill="white" stroke="none" fillOpacity="0.85"/>
        <rect x="13" y="13" width="3" height="3" rx="1" fill="white" stroke="none" fillOpacity="0.85"/>
      </svg>
    ),
  },
  {
    key:    "wirkung",
    action: "impact",
    label:  "Wirkung\nstarten",
    desc:   "Starte ein Projekt\nund bewege\ngemeinsam etwas.",
    // Coral/Warm Red — links-unten, ~7–8 Uhr
    bg:     "linear-gradient(145deg, #F07878 0%, #D85858 100%)",
    glow:   "rgba(220,100,100,",
    angle:  216,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <path d="M12 21C12 21 4 14 4 9a8 8 0 0 1 16 0c0 5-8 12-8 12z"
          fill="white" fillOpacity="0.18"/>
        <path d="M12 21C12 21 4 14 4 9a8 8 0 0 1 16 0c0 5-8 12-8 12z"/>
        <path d="M12 9v4M12 15h.01" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key:    "verbindung",
    action: "connect",
    label:  "Verbindung\nsuchen",
    desc:   "Finde kreative\nMenschen und\nkollaboriere.",
    // Soft Violet/Purple — links, ~10 Uhr
    bg:     "linear-gradient(145deg, #B090E8 0%, #9070CC 100%)",
    glow:   "rgba(160,120,220,",
    angle:  288,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <circle cx="9"  cy="7"  r="3"/>
        <circle cx="15" cy="7"  r="3"/>
        <path d="M3 20c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6"/>
      </svg>
    ),
  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes huiOrbBdIn  { from{opacity:0} to{opacity:1} }
  @keyframes huiOrbBdOut { from{opacity:1} to{opacity:0} }

  @keyframes huiOrbCenterExpand {
    0%   { transform:translate(-50%,-50%) scale(0.30); opacity:0; }
    55%  { transform:translate(-50%,-50%) scale(1.07); opacity:1; }
    100% { transform:translate(-50%,-50%) scale(1);    opacity:1; }
  }
  @keyframes huiOrbCenterBreath {
    0%,100% {
      box-shadow:
        0 0 0   0  rgba(13,196,181,0),
        0 0 40px   rgba(13,196,181,0.55),
        0 0 90px   rgba(13,196,181,0.25),
        0 0 160px  rgba(13,196,181,0.10);
    }
    50% {
      box-shadow:
        0 0 0  16px rgba(13,196,181,0.08),
        0 0 60px   rgba(13,196,181,0.70),
        0 0 120px  rgba(13,196,181,0.35),
        0 0 200px  rgba(13,196,181,0.15);
    }
  }

  /* Aura-Ring: großer glasiger Kreis */
  @keyframes huiOrbAuraIn {
    0%   { transform:translate(-50%,-50%) scale(0.2); opacity:0; }
    60%  { transform:translate(-50%,-50%) scale(1.03); opacity:1; }
    100% { transform:translate(-50%,-50%) scale(1); opacity:1; }
  }
  @keyframes huiOrbAuraPulse {
    0%,100% { opacity:0.30; transform:translate(-50%,-50%) scale(1); }
    50%     { opacity:0.45; transform:translate(-50%,-50%) scale(1.015); }
  }

  /* Funken im Aura-Ring */
  @keyframes huiOrbSparkle {
    0%,100% { opacity:0; transform:translate(-50%,-50%) scale(0.5); }
    40%,60% { opacity:1; transform:translate(-50%,-50%) scale(1); }
  }
  @keyframes huiOrbSparkleOrbit {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* Node Erscheinen */
  @keyframes huiOrbNodeIn {
    0%   { opacity:0; transform:translate(-50%,-50%) scale(0.25); }
    62%  { opacity:1; transform:translate(-50%,-50%) scale(1.06); }
    100% { opacity:1; transform:translate(-50%,-50%) scale(1); }
  }

  /* Node Float */
  @keyframes huiOrbFloat0 { 0%,100%{margin-top:0}    50%{margin-top:-7px} }
  @keyframes huiOrbFloat1 { 0%,100%{margin-top:3px}  50%{margin-top:-5px} }
  @keyframes huiOrbFloat2 { 0%,100%{margin-top:-2px} 50%{margin-top:5px}  }
  @keyframes huiOrbFloat3 { 0%,100%{margin-top:2px}  50%{margin-top:-6px} }
  @keyframes huiOrbFloat4 { 0%,100%{margin-top:-3px} 50%{margin-top:4px}  }

  /* Glow Halo */
  @keyframes huiOrbHaloPulse {
    0%,100%{ opacity:0.45; transform:translate(-50%,-50%) scale(1);    }
    50%    { opacity:0.72; transform:translate(-50%,-50%) scale(1.10); }
  }

  /* Label */
  @keyframes huiOrbLabelIn {
    from { opacity:0; transform:translateY(5px); }
    to   { opacity:1; transform:translateY(0);   }
  }

  /* Close */
  @keyframes huiOrbCloseIn {
    from { opacity:0; transform:translate(-50%,8px) scale(0.6); }
    to   { opacity:1; transform:translate(-50%,0) scale(1);     }
  }

  /* Verbindungslinien */
  @keyframes huiOrbLineIn {
    from { opacity:0; stroke-dashoffset: 1; }
    to   { opacity:1; stroke-dashoffset: 0; }
  }

  .hui-orb-node-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    border: none;
    padding: 0;
    background: transparent;
    outline: none;
  }
  .hui-orb-node-btn:active .hui-orb-circle {
    transform: scale(0.88) !important;
    transition: transform 100ms cubic-bezier(0.22,1,0.36,1) !important;
  }
  .hui-orb-x-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hui-orb-x-btn:active {
    transform: translate(-50%,0) scale(0.85) !important;
    transition: transform 90ms ease !important;
  }
  .hui-orb-center-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
`;

// ─── Polarkoordinaten ─────────────────────────────────────────────────────────
// angle: 0 = oben (12 Uhr), im Uhrzeigersinn
function polar(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

// ─── Funken im Aura-Ring ──────────────────────────────────────────────────────
function AuraSparkles({ cx, cy, R }) {
  const sparks = [0, 40, 80, 140, 200, 260, 310];
  return (
    <>
      {sparks.map((a, i) => {
        const p = polar(a, R);
        return (
          <div key={i} style={{
            position:   "absolute",
            left:       cx + p.x,
            top:        cy + p.y,
            width:      4, height: 4,
            borderRadius:"50%",
            background: `rgba(255,255,255,0.90)`,
            transform:  "translate(-50%,-50%)",
            animation:  `huiOrbSparkle ${2.2 + i*0.4}s ${i*0.3}s ease-in-out infinite`,
            pointerEvents:"none",
            zIndex:     5,
          }} />
        );
      })}
      {/* Kleinere Sterne */}
      {[20, 65, 110, 170, 230, 280, 340].map((a, i) => {
        const p = polar(a, R * 0.96);
        return (
          <div key={`s${i}`} style={{
            position:   "absolute",
            left:       cx + p.x,
            top:        cy + p.y,
            width:      2.5, height: 2.5,
            borderRadius:"50%",
            background: "rgba(200,240,235,0.85)",
            transform:  "translate(-50%,-50%)",
            animation:  `huiOrbSparkle ${1.8 + i*0.35}s ${0.15 + i*0.25}s ease-in-out infinite`,
            pointerEvents:"none",
            zIndex:     5,
          }} />
        );
      })}
    </>
  );
}

// ─── SVG Verbindungslinien ────────────────────────────────────────────────────
function OrbLines({ nodes, cx, cy, auraR, orbR }) {
  return (
    <svg style={{
      position:"absolute", inset:0,
      width:"100%", height:"100%",
      pointerEvents:"none", zIndex:3,
      animation:"huiOrbBdIn 0.5s ease 0.25s both",
    }}>
      <defs>
        {nodes.map(n => (
          <linearGradient key={n.key} id={`g-${n.key}`}
            gradientUnits="userSpaceOnUse"
            x1={cx} y1={cy}
            x2={cx + polar(n.angle, auraR * 0.75).x}
            y2={cy + polar(n.angle, auraR * 0.75).y}
          >
            <stop offset="0%"   stopColor={`rgba(13,196,181,0)`} />
            <stop offset="35%"  stopColor={`rgba(13,196,181,0.20)`} />
            <stop offset="100%" stopColor={n.glow + "0.10)"} />
          </linearGradient>
        ))}
      </defs>
      {nodes.map(n => {
        const end = polar(n.angle, auraR * 0.75);
        return (
          <line key={n.key}
            x1={cx} y1={cy}
            x2={cx + end.x} y2={cy + end.y}
            stroke={`url(#g-${n.key})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        );
      })}
    </svg>
  );
}

// ─── Label-Position berechnen ─────────────────────────────────────────────────
// Schaut wohin der Node zeigt und platziert Label entsprechend außen
function getLabelPos(angle, nodeR) {
  // Quadrant bestimmen
  const a = ((angle % 360) + 360) % 360;
  const isRight  = a > 315 || a < 135;  // ~rechts
  const isTop    = a < 60 || a > 300;   // ~oben
  const isBottom = a > 120 && a < 240;  // ~unten

  // top/bottom/left/right relativ zum Node-Kreis
  const PAD = nodeR * 0.5 + 10;
  const W = 120;

  if (a > 300 || a < 60) {
    // Oben: Label darunter zentriert
    return { top: nodeR + 8, left: -(W - nodeR) / 2, width: W, align: "center" };
  }
  if (a >= 60 && a <= 120) {
    // Rechts-oben: Label links daneben
    return { top: -10, left: nodeR + 8, width: W, align: "left" };
  }
  if (a > 120 && a < 180) {
    // Rechts-unten: Label links daneben, etwas nach unten
    return { top: 10, left: nodeR + 8, width: W, align: "left" };
  }
  if (a >= 180 && a <= 240) {
    // Unten-links: Label rechts daneben
    return { top: 10, right: nodeR + 8, left: "auto", width: W, align: "right" };
  }
  if (a > 240 && a <= 300) {
    // Links: Label rechts daneben
    return { top: -10, right: nodeR + 8, left: "auto", width: W, align: "right" };
  }
  return { top: nodeR + 8, left: -(W - nodeR) / 2, width: W, align: "center" };
}

// ─── Einzelner Node ───────────────────────────────────────────────────────────
function OrbNode({ node, idx, cx, cy, auraR, NODE_R, hoveredKey, onHover, onLeave, onSelect }) {
  const pos    = polar(node.angle, auraR * 0.80);
  const nx     = cx + pos.x;
  const ny     = cy + pos.y;
  const isHov  = hoveredKey === node.key;
  const isDim  = hoveredKey !== null && !isHov;
  const delay  = `${0.18 + idx * 0.07}s`;
  const floatDur = `${3.8 + idx * 0.45}s`;
  const floatDel = `${0.5 + idx * 0.1}s`;
  const labelPos = getLabelPos(node.angle, NODE_R);

  return (
    <button
      className="hui-orb-node-btn"
      onMouseEnter={() => onHover(node.key)}
      onMouseLeave={onLeave}
      onTouchStart={() => onHover(node.key)}
      onTouchEnd={() => setTimeout(onLeave, 350)}
      onClick={() => onSelect(node)}
      aria-label={node.label.replace("\n", " ")}
      style={{
        position: "absolute",
        left: nx, top: ny,
        width: NODE_R, height: NODE_R,
        animation: `huiOrbNodeIn 0.58s cubic-bezier(0.16,1,0.3,1) ${delay} both`,
        opacity:   isDim ? 0.36 : 1,
        transform: "translate(-50%,-50%)",
        transition:"opacity 0.30s ease",
        zIndex:    15,
      }}
    >
      {/* Float */}
      <div style={{
        animation: `huiOrbFloat${idx} ${floatDur} ${floatDel} ease-in-out infinite`,
        position: "relative",
        width: NODE_R, height: NODE_R,
      }}>
        {/* Glow Halo */}
        <div style={{
          position:     "absolute",
          left: "50%",  top: "50%",
          width:  NODE_R + 46,
          height: NODE_R + 46,
          borderRadius: "50%",
          background:   `radial-gradient(circle, ${node.glow}0.28) 0%, ${node.glow}0) 65%)`,
          animation:    `huiOrbHaloPulse ${floatDur} ease-in-out infinite`,
          pointerEvents:"none",
          zIndex:        0,
        }} />

        {/* Kreis */}
        <div
          className="hui-orb-circle"
          style={{
            position:       "absolute",
            inset:          0,
            borderRadius:   "50%",
            background:     node.bg,
            border:         `2px solid rgba(255,255,255,${isHov ? "0.88" : "0.55"})`,
            boxShadow:      isHov
              ? `0 0 0 5px ${node.glow}0.18), 0 8px 28px ${node.glow}0.52), 0 2px 8px rgba(0,0,0,0.18)`
              : `0 4px 20px ${node.glow}0.42), 0 2px 6px rgba(0,0,0,0.14)`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            overflow:       "hidden",
            transform:      isHov ? "scale(1.11)" : "scale(1)",
            transition:     [
              "transform 0.30s cubic-bezier(0.34,1.56,0.64,1)",
              "box-shadow 0.28s ease",
              "border-color 0.24s ease",
            ].join(","),
            zIndex: 1,
          }}
        >
          {/* Glasschimmer */}
          <div style={{
            position:     "absolute",
            top: 0, left: "4%",
            width: "92%", height: "48%",
            borderRadius: "50% 50% 0 0 / 55% 55% 0 0",
            background:   "linear-gradient(180deg,rgba(255,255,255,0.38) 0%,transparent 100%)",
            pointerEvents:"none",
          }} />
          {/* Icon */}
          <div style={{ position:"relative", zIndex:2 }}>
            {node.icon}
          </div>
        </div>

        {/* Label außen */}
        <div style={{
          position:   "absolute",
          pointerEvents:"none",
          animation:  `huiOrbLabelIn 0.38s ease ${parseFloat(delay) + 0.22}s both`,
          zIndex:     5,
          ...labelPos,
          textAlign:  labelPos.align,
        }}>
          <div style={{
            fontSize:      12.5,
            fontWeight:    700,
            color:         isDim ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.95)",
            letterSpacing: "-0.018em",
            lineHeight:    1.28,
            marginBottom:  3,
            whiteSpace:    "pre-line",
            textShadow:    "0 1px 6px rgba(0,0,0,0.35)",
            transition:    "color 0.25s ease",
          }}>
            {node.label}
          </div>
          <div style={{
            fontSize:      10.5,
            color:         isDim ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.58)",
            letterSpacing: "-0.005em",
            lineHeight:    1.38,
            whiteSpace:    "pre-line",
            textShadow:    "0 1px 4px rgba(0,0,0,0.30)",
            transition:    "color 0.25s ease",
          }}>
            {node.desc}
          </div>
        </div>
      </div>
    </button>
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
  const closeRef = useRef(null);

  // Viewport
  const gvw = () => window.visualViewport?.width  ?? window.innerWidth;
  const gvh = () => window.visualViewport?.height ?? window.innerHeight;
  const [vw, setVw] = useState(gvw);
  const [vh, setVh] = useState(gvh);
  useEffect(() => {
    const fn = () => { setVw(gvw()); setVh(gvh()); };
    const vp = window.visualViewport;
    if (vp) { vp.addEventListener("resize", fn); return () => vp.removeEventListener("resize", fn); }
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    if (!visible) { setHoveredKey(null); setClosing(false); }
  }, [visible]);

  const handleClose = useCallback(() => {
    setClosing(true);
    clearTimeout(closeRef.current);
    closeRef.current = setTimeout(() => onClose?.(), 300);
  }, [onClose]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && visible) handleClose(); };
    window.addEventListener("keydown", fn);
    return () => { window.removeEventListener("keydown", fn); clearTimeout(closeRef.current); };
  }, [visible, handleClose]);

  const handleSelect = useCallback((node) => {
    // WICHTIG: onSelect ZUERST, dann close OHNE onClose-Callback aufzurufen.
    // onClose würde closeOrbWorld/cleanupOrbEnvironment triggern —
    // das resetzt body pointer-events und killt den gerade geöffneten Flow.
    // Der Parent (Home.jsx) schliesst das Sheet über setShowPlusSheet(false)
    // — das ist genug. onClose() hier weglassen.
    setTimeout(() => {
      onSelect?.(node.action);
      // Nur visuell schliessen (setClosing → Animation), NICHT onClose() callen
      setClosing(true);
    }, 150);
  }, [onSelect]);

  if (!visible && !closing) return null;

  // ── Layout ────────────────────────────────────────────────
  const NAV_H  = 82;
  const availH = vh - NAV_H;
  const cx     = vw / 2;
  // Orb sitzt etwas über der Mitte des verfügbaren Bereichs
  const cy     = availH * 0.48;
  // Aura-Ring Radius: basiert auf Viewport
  const auraR  = Math.min(vw * 0.38, availH * 0.38, 155);
  // Orb-Radius (Zentrum)
  const ORB_R  = Math.min(46, auraR * 0.30);
  // Node-Radius
  const NODE_R = Math.min(58, auraR * 0.38);

  const bdAnim = closing
    ? "huiOrbBdOut 0.28s ease both"
    : "huiOrbBdIn  0.38s ease both";

  return (
    <>
      <style>{CSS}</style>

      {/* ── Backdrop: dunkel semi-transparent, App sichtbar ── */}
      <div
        onClick={handleClose}
        style={{
          position:             "fixed",
          inset:                0,
          zIndex:               9000,
          // Dunkler Schleier wie im Screenshot — App bleibt erkennbar
          background:           "rgba(18,18,30,0.72)",
          backdropFilter:       "blur(18px) saturate(0.9)",
          WebkitBackdropFilter: "blur(18px) saturate(0.9)",
          animation:            bdAnim,
        }}
      />

      {/* ── Bühne ─────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:      "fixed",
          inset:         0,
          zIndex:        9001,
          pointerEvents: "none",
          animation:     bdAnim,
        }}
      >

        {/* ─ Verbindungslinien (hinter allem) */}
        <OrbLines
          nodes={NODES}
          cx={cx} cy={cy}
          auraR={auraR}
          orbR={ORB_R}
        />

        {/* ─ Aura-Ring: großer glasiger Kreis */}
        <div style={{
          position:     "absolute",
          left: cx, top: cy,
          width:  auraR * 2,
          height: auraR * 2,
          borderRadius: "50%",
          // Glasiger Kreis — wie im Screenshot
          border:       "1.5px solid rgba(255,255,255,0.18)",
          background:   [
            "radial-gradient(circle at 50% 40%,",
            "  rgba(13,196,181,0.08) 0%,",
            "  rgba(255,255,255,0.04) 40%,",
            "  rgba(13,196,181,0.05) 65%,",
            "  transparent 78%",
            ")",
          ].join(""),
          boxShadow:    [
            "inset 0 0 60px rgba(13,196,181,0.06)",
            "0 0 80px rgba(13,196,181,0.10)",
          ].join(","),
          animation:    closing
            ? "huiOrbBdOut 0.26s ease both"
            : "huiOrbAuraIn 0.72s cubic-bezier(0.16,1,0.3,1) both, huiOrbAuraPulse 5s 0.9s ease-in-out infinite",
          transform:    "translate(-50%,-50%)",
          pointerEvents:"none",
          zIndex:       4,
        }} />

        {/* ─ Funken / Sterne auf dem Aura-Ring */}
        <AuraSparkles cx={cx} cy={cy} R={auraR} />

        {/* ─ Zentraler Orb */}
        <button
          className="hui-orb-center-btn"
          onClick={handleClose}
          aria-label="Portal schließen"
          style={{
            position:  "absolute",
            left: cx,  top: cy,
            width:  ORB_R * 2, height: ORB_R * 2,
            borderRadius: "50%",
            background:   "linear-gradient(145deg, #1ECEC0 0%, #0DB5A8 60%, #16C4B8 100%)",
            border:       "3px solid rgba(255,255,255,0.72)",
            animation:    closing
              ? "huiOrbBdOut 0.24s ease both"
              : `huiOrbCenterExpand 0.70s cubic-bezier(0.16,1,0.3,1) both,
                 huiOrbCenterBreath 5s 1s ease-in-out infinite`,
            transform:    "translate(-50%,-50%)",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"center",
            cursor:       "pointer",
            outline:      "none",
            padding:      0,
            overflow:     "hidden",
            zIndex:       20,
            pointerEvents:"auto",
            WebkitTapHighlightColor:"transparent",
            touchAction:  "manipulation",
          }}
        >
          {/* Glasschimmer */}
          <div style={{
            position:     "absolute",
            top: 0, left: "3%",
            width: "94%", height: "52%",
            borderRadius: "50% 50% 0 0 / 58% 58% 0 0",
            background:   "linear-gradient(180deg,rgba(255,255,255,0.42) 0%,transparent 100%)",
            pointerEvents:"none",
          }} />
          {/* H-Symbol (weißes H auf tealem Grund, wie Screenshot) */}
          <div style={{
            position:   "relative",
            zIndex:     2,
            display:    "flex",
            alignItems: "center",
            justifyContent:"center",
          }}>
            <img
              src="/assets/brand/hui-logo-light.svg"
              alt="HUI"
              style={{
                width:        ORB_R * 1.42,
                height:       ORB_R * 1.42,
                objectFit:    "cover",
                borderRadius: "50%",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            {/* H Fallback — exakt wie Screenshot */}
            <div style={{
              display:       "none",
              alignItems:    "center",
              justifyContent:"center",
            }}>
              <span style={{
                fontFamily:   "'SF Pro Display',system-ui,sans-serif",
                fontSize:     ORB_R * 0.88,
                fontWeight:   700,
                color:        "rgba(255,255,255,0.96)",
                letterSpacing:"-0.03em",
                lineHeight:   1,
              }}>H</span>
            </div>
          </div>
        </button>

        {/* ─ 5 Nodes */}
        {NODES.map((node, idx) => (
          <div key={node.key} style={{
            position:"absolute", inset:0, pointerEvents:"auto",
          }}>
            <OrbNode
              node={node}
              idx={idx}
              cx={cx} cy={cy}
              auraR={auraR}
              NODE_R={NODE_R}
              hoveredKey={hoveredKey}
              onHover={setHoveredKey}
              onLeave={() => setHoveredKey(null)}
              onSelect={handleSelect}
            />
          </div>
        ))}

        {/* ─ X-Button */}
        <button
          className="hui-orb-x-btn"
          onClick={handleClose}
          aria-label="Schließen"
          style={{
            position:     "absolute",
            left:         cx,
            top:          cy + auraR + 14,
            transform:    "translate(-50%,0)",
            width:  42, height: 42,
            borderRadius: "50%",
            background:   "rgba(255,255,255,0.92)",
            border:       "1.5px solid rgba(255,255,255,0.70)",
            boxShadow:    "0 2px 14px rgba(0,0,0,0.18)",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"center",
            cursor:       "pointer",
            outline:      "none",
            pointerEvents:"auto",
            animation:    `huiOrbCloseIn 0.36s ease 0.50s both`,
            zIndex:       20,
            padding:      0,
            WebkitTapHighlightColor:"transparent",
            touchAction:  "manipulation",
          }}
        >
          <span style={{
            fontSize: 19, fontWeight: 300,
            color: "rgba(20,20,34,0.42)", lineHeight: 1,
          }}>×</span>
        </button>

      </div>
    </>
  );
}
