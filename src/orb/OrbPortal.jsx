/**
 * OrbPortal.jsx — Phase 4H "Die Bühne"
 *
 * PHILOSOPHIE:
 *   Kein Menü. Kein FAB-Popup. Keine herumfliegenden Buttons.
 *
 *   Der Orb öffnet eine Bühne.
 *   Der Nutzer öffnet seinen Ausdruck zur Welt.
 *
 * STRUKTUR:
 *   - Heller, sanft geblurrter Backdrop (App bleibt sichtbar)
 *   - Bottom Sheet steigt auf — warm, glasartig, luftig
 *   - Orb-Signet oben im Sheet (klein, atmet)
 *   - 5 Bereiche in organischer Komposition:
 *       Moment, Werk, Erlebnis, Veranstaltung, Projekt
 *   - Projekt = besonders, visuell hervorgehoben
 *
 * KEIN:
 *   radiales Menü, floating bubbles, neon, dark UI, gaming
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";

// ─── Farb-Tokens ─────────────────────────────────────────────────────────────
const C = {
  teal:       "#0DC4B5",
  tealLight:  "#22DDD0",
  tealPale:   "#E8FAF8",
  tealGlow:   "rgba(13,196,181,0.14)",
  coral:      "#F47355",
  coralPale:  "#FFF0EB",
  coralGlow:  "rgba(244,115,85,0.14)",
  gold:       "#D4952A",
  goldPale:   "#FDF6E3",
  violet:     "#7264D6",
  violetPale: "#F0EEFF",
  violetGlow: "rgba(114,100,214,0.14)",
  sage:       "#6BAE8F",
  sagePale:   "#EEF7F2",
  sageGlow:   "rgba(107,174,143,0.13)",
  ink:        "#141422",
  ink2:       "rgba(20,20,34,0.62)",
  ink3:       "rgba(20,20,34,0.38)",
  cream:      "#FAF7F2",
  white:      "#FFFFFF",
};

// ─── 5 Bereiche Definition ────────────────────────────────────────────────────
const AREAS = [
  {
    key:       "moment",
    action:    "story",
    icon:      "✦",
    label:     "Moment",
    sub:       "Teile was dich gerade bewegt",
    color:     C.teal,
    pale:      C.tealPale,
    glow:      C.tealGlow,
    // Emotionale Energie
    energy:    "spontan · menschlich · direkt",
    weight:    "normal",  // visuelle Gewichtung
  },
  {
    key:       "werk",
    action:    "werk",
    icon:      "◈",
    label:     "Werk",
    sub:       "Zeige deine kreative Arbeit",
    color:     C.coral,
    pale:      C.coralPale,
    glow:      C.coralGlow,
    energy:    "Kunst · Musik · Design · Projekte",
    weight:    "normal",
  },
  {
    key:       "erlebnis",
    action:    "experience",
    icon:      "◎",
    label:     "Erlebnis",
    sub:       "Öffne einen echten menschlichen Raum",
    color:     C.sage,
    pale:      C.sagePale,
    glow:      C.sageGlow,
    energy:    "Treffen · Workshops · gemeinsam",
    weight:    "normal",
  },
  {
    key:       "veranstaltung",
    action:    "veranstaltung",
    icon:      "⬡",
    label:     "Veranstaltung",
    sub:       "Bring Menschen zusammen",
    color:     C.gold,
    pale:      C.goldPale,
    glow:      "rgba(212,149,42,0.13)",
    energy:    "Community · Events · öffentlich",
    weight:    "normal",
  },
  {
    key:       "projekt",
    action:    "impact",
    icon:      "◐",
    label:     "Projekt",
    sub:       "Reiche deine Vision beim HUI-Team ein",
    color:     C.violet,
    pale:      C.violetPale,
    glow:      C.violetGlow,
    energy:    "ImpactPool · Förderung · Zukunft",
    weight:    "featured",  // visuell besonders
  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes huiStageBackdropIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes huiStageBackdropOut {
    from { opacity:1; }
    to   { opacity:0; }
  }
  @keyframes huiStageSheetUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes huiStageSheetDown {
    from { opacity:1; transform:translateY(0); }
    to   { opacity:0; transform:translateY(20px); }
  }
  @keyframes huiStageOrbPulse {
    0%,100% {
      box-shadow:
        0 0 0 0 rgba(13,196,181,0),
        0 4px 18px rgba(13,196,181,0.32),
        0 0 0 0 rgba(244,115,85,0);
    }
    50% {
      box-shadow:
        0 0 0 7px rgba(13,196,181,0.07),
        0 4px 28px rgba(13,196,181,0.45),
        0 0 30px rgba(244,115,85,0.10);
    }
  }
  @keyframes huiStageAreaIn {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes huiStageFeaturedGlow {
    0%,100% { box-shadow: 0 2px 16px rgba(114,100,214,0.14), 0 0 0 1px rgba(114,100,214,0.12); }
    50%     { box-shadow: 0 4px 28px rgba(114,100,214,0.22), 0 0 0 1px rgba(114,100,214,0.20); }
  }
  .hui-stage-area {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hui-stage-area:active {
    transform: scale(0.975) !important;
    transition: transform 100ms cubic-bezier(0.22,1,0.36,1) !important;
  }
  .hui-stage-close {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
`;

// ─── Normaler Bereich (4 von 5) ───────────────────────────────────────────────
function AreaNormal({ area, idx, hoveredKey, onHover, onLeave, onSelect }) {
  const isHov    = hoveredKey === area.key;
  const isDimmed = hoveredKey !== null && !isHov;
  const delay    = `${0.08 + idx * 0.05}s`;

  return (
    <button
      className="hui-stage-area"
      onMouseEnter={() => onHover(area.key)}
      onMouseLeave={onLeave}
      onTouchStart={() => onHover(area.key)}
      onTouchEnd={onLeave}
      onClick={() => onSelect(area)}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            14,
        width:          "100%",
        padding:        "13px 16px",
        borderRadius:   16,
        border:         `1px solid ${isHov ? area.color + "30" : "rgba(20,20,34,0.07)"}`,
        background:     isHov ? area.pale : C.white,
        cursor:         "pointer",
        outline:        "none",
        textAlign:      "left",
        animation:      `huiStageAreaIn 0.44s cubic-bezier(0.16,1,0.3,1) ${delay} both`,
        opacity:        isDimmed ? 0.46 : 1,
        transform:      isDimmed ? "scale(0.99)" : "scale(1)",
        transition:     [
          "opacity 0.32s ease",
          "transform 0.32s ease",
          "background 0.28s ease",
          "border-color 0.28s ease",
          "box-shadow 0.28s ease",
        ].join(", "),
        boxShadow:      isHov
          ? `0 4px 20px ${area.glow}, 0 1px 4px rgba(0,0,0,0.04)`
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Icon Pill */}
      <div style={{
        flexShrink:    0,
        width:         42, height: 42,
        borderRadius:  12,
        background:    isHov
          ? `linear-gradient(145deg, ${area.color}22 0%, ${area.color}0a 100%)`
          : `${area.pale}`,
        border:        `1px solid ${area.color}28`,
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        fontSize:      17,
        color:         area.color,
        transition:    "all 0.28s ease",
        fontWeight:    300,
      }}>
        {area.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:      14,
          fontWeight:    600,
          color:         isHov ? area.color : C.ink,
          letterSpacing: "-0.022em",
          lineHeight:    1.2,
          marginBottom:  2,
          transition:    "color 0.24s ease",
        }}>
          {area.label}
        </div>
        <div style={{
          fontSize:      11.5,
          color:         isDimmed ? C.ink3 : isHov ? area.color + "aa" : C.ink3,
          letterSpacing: "-0.005em",
          lineHeight:    1.3,
          transition:    "color 0.24s ease",
        }}>
          {area.sub}
        </div>
      </div>

      {/* Chevron */}
      <div style={{
        flexShrink: 0,
        width:      20, height: 20,
        borderRadius: "50%",
        background:  isHov ? area.color : "rgba(20,20,34,0.06)",
        display:     "flex",
        alignItems:  "center",
        justifyContent:"center",
        transition:  "all 0.24s ease",
      }}>
        <span style={{
          fontSize:   9,
          color:      isHov ? C.white : C.ink3,
          lineHeight: 1,
          marginLeft: 1,
          fontWeight: 600,
        }}>›</span>
      </div>
    </button>
  );
}

// ─── Featured Bereich: Projekt ────────────────────────────────────────────────
function AreaFeatured({ area, idx, hoveredKey, onHover, onLeave, onSelect }) {
  const isHov    = hoveredKey === area.key;
  const isDimmed = hoveredKey !== null && !isHov;
  const delay    = `${0.08 + idx * 0.05}s`;

  return (
    <button
      className="hui-stage-area"
      onMouseEnter={() => onHover(area.key)}
      onMouseLeave={onLeave}
      onTouchStart={() => onHover(area.key)}
      onTouchEnd={onLeave}
      onClick={() => onSelect(area)}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          14,
        width:        "100%",
        padding:      "16px 16px",
        borderRadius: 18,
        border:       `1px solid ${isHov ? area.color + "45" : area.color + "20"}`,
        background:   isHov
          ? `linear-gradient(135deg, ${area.pale} 0%, rgba(255,255,255,0.95) 100%)`
          : `linear-gradient(135deg, ${area.pale} 0%, rgba(255,255,255,0.8) 100%)`,
        cursor:       "pointer",
        outline:      "none",
        textAlign:    "left",
        animation:    `huiStageAreaIn 0.44s cubic-bezier(0.16,1,0.3,1) ${delay} both,
                       huiStageFeaturedGlow 5s 1s ease-in-out infinite`,
        opacity:      isDimmed ? 0.46 : 1,
        transform:    isDimmed ? "scale(0.99)" : "scale(1)",
        transition:   [
          "opacity 0.32s ease",
          "transform 0.32s ease",
          "background 0.28s ease",
          "border-color 0.28s ease",
        ].join(", "),
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      {/* Subtiler Hintergrundschimmer */}
      <div style={{
        position:     "absolute",
        top:          0, right: 0,
        width:        120, height: "100%",
        background:   `linear-gradient(90deg, transparent, ${area.color}08)`,
        pointerEvents:"none",
        borderRadius: "0 18px 18px 0",
      }} />

      {/* Icon Pill — größer als normal */}
      <div style={{
        flexShrink:    0,
        width:         46, height: 46,
        borderRadius:  14,
        background:    `linear-gradient(145deg, ${area.color}22 0%, ${area.color}12 100%)`,
        border:        `1.5px solid ${area.color}35`,
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        fontSize:      19,
        color:         area.color,
        boxShadow:     `0 3px 12px ${area.glow}`,
        position:      "relative",
        zIndex:        1,
      }}>
        {area.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          7,
          marginBottom: 3,
        }}>
          <span style={{
            fontSize:      14,
            fontWeight:    700,
            color:         area.color,
            letterSpacing: "-0.024em",
            lineHeight:    1.2,
          }}>
            {area.label}
          </span>
          {/* Badge */}
          <span style={{
            fontSize:      9,
            fontWeight:    600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color:         area.color,
            background:    area.color + "18",
            border:        `1px solid ${area.color}30`,
            borderRadius:  5,
            padding:       "2px 6px",
          }}>
            ImpactPool
          </span>
        </div>
        <div style={{
          fontSize:      11.5,
          color:         area.color + "99",
          letterSpacing: "-0.005em",
          lineHeight:    1.3,
        }}>
          {area.sub}
        </div>
        {/* Energie-Text */}
        <div style={{
          fontSize:      10,
          color:         area.color + "70",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontWeight:    500,
          marginTop:     5,
        }}>
          {area.energy}
        </div>
      </div>

      {/* Chevron — größer */}
      <div style={{
        flexShrink:    0,
        width:         24, height: 24,
        borderRadius:  "50%",
        background:    `linear-gradient(135deg, ${area.color}25, ${area.color}15)`,
        border:        `1px solid ${area.color}30`,
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        position:      "relative",
        zIndex:        1,
      }}>
        <span style={{
          fontSize: 10, color: area.color,
          lineHeight: 1, marginLeft: 1, fontWeight: 700,
        }}>›</span>
      </div>
    </button>
  );
}

// ─── Orb Signet (oben im Sheet) ───────────────────────────────────────────────
function OrbSignet({ onClose }) {
  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      justifyContent:"space-between",
      marginBottom:  20,
    }}>
      {/* Links: Orb + Titel */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {/* Mini-Orb */}
        <div style={{
          width:         42, height: 42,
          borderRadius:  "50%",
          background:    `linear-gradient(145deg, #FFFFFF 0%, #F5FFFE 50%, #FFF5F2 100%)`,
          border:        "2px solid rgba(255,255,255,0.90)",
          boxShadow:     "0 2px 12px rgba(13,196,181,0.22), 0 0 0 0 rgba(13,196,181,0)",
          animation:     "huiStageOrbPulse 4s ease-in-out infinite",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          overflow:      "hidden",
          flexShrink:    0,
        }}>
          <img
            src="/hui-logo-real.jpg"
            alt="HUI"
            style={{ width:"88%", height:"88%", objectFit:"cover", borderRadius:"50%" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.querySelector(".orb-fallback").style.display = "block";
            }}
          />
          <span
            className="orb-fallback"
            style={{
              display:    "none",
              fontSize:   13, fontWeight:800,
              background: "linear-gradient(135deg, #0DC4B5, #F47355)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >HUI</span>
        </div>

        {/* Titel */}
        <div>
          <div style={{
            fontSize:      15, fontWeight:700,
            color:         C.ink,
            letterSpacing: "-0.03em",
            lineHeight:    1.2,
          }}>
            Hier beginnt dein Einfluss.
          </div>
          <div style={{
            fontSize:      11.5,
            color:         C.ink3,
            letterSpacing: "-0.01em",
            marginTop:     1,
          }}>
            Was möchtest du in die Welt bringen?
          </div>
        </div>
      </div>

      {/* Schließen */}
      <button
        className="hui-stage-close"
        onClick={onClose}
        aria-label="Schließen"
        style={{
          width:         36, height:36,
          borderRadius:  "50%",
          background:    "rgba(20,20,34,0.05)",
          border:        "1px solid rgba(20,20,34,0.08)",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          cursor:        "pointer",
          outline:       "none",
          flexShrink:    0,
          transition:    "background 0.2s ease",
        }}
      >
        <span style={{ fontSize:15, color:C.ink2, lineHeight:1, fontWeight:300 }}>×</span>
      </button>
    </div>
  );
}

// ─── Trennlinie zwischen normalen und featured ────────────────────────────────
function Divider() {
  return (
    <div style={{
      display:     "flex",
      alignItems:  "center",
      gap:         10,
      margin:      "4px 0",
    }}>
      <div style={{ flex:1, height:1, background:"rgba(20,20,34,0.06)" }} />
      <span style={{
        fontSize:      9.5,
        color:         "rgba(20,20,34,0.28)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight:    500,
      }}>Vision</span>
      <div style={{ flex:1, height:1, background:"rgba(20,20,34,0.06)" }} />
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
  const closeTimerRef = useRef(null);

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
    return () => {
      window.removeEventListener("keydown", fn);
      clearTimeout(closeTimerRef.current);
    };
  }, [visible, handleClose]);

  const handleSelect = useCallback((area) => {
    setTimeout(() => {
      onSelect?.(area.action);
      handleClose();
    }, 140);
  }, [onSelect, handleClose]);

  if (!visible && !closing) return null;

  const normal   = AREAS.filter(a => a.weight !== "featured");
  const featured = AREAS.find(a => a.weight === "featured");

  const animBD  = closing
    ? "huiStageBackdropOut 0.28s ease both"
    : "huiStageBackdropIn 0.36s ease both";
  const animSH  = closing
    ? "huiStageSheetDown 0.26s ease both"
    : "huiStageSheetUp 0.44s cubic-bezier(0.16,1,0.3,1) both";

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop — hell, soft blur, App bleibt sichtbar */}
      <div
        onClick={handleClose}
        style={{
          position:             "fixed",
          inset:                0,
          zIndex:               9000,
          background:           "rgba(245,242,236,0.68)",
          backdropFilter:       "blur(16px) saturate(1.08)",
          WebkitBackdropFilter: "blur(16px) saturate(1.08)",
          animation:            animBD,
        }}
      />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:     "fixed",
          bottom:       0,
          left:         0,
          right:        0,
          zIndex:       9001,
          paddingLeft:  12,
          paddingRight: 12,
          paddingBottom:"max(16px, env(safe-area-inset-bottom))",
          animation:    animSH,
        }}
      >
        <div style={{
          maxWidth:             500,
          margin:               "0 auto",
          background:           "rgba(252,250,247,0.97)",
          backdropFilter:       "blur(40px) saturate(1.5)",
          WebkitBackdropFilter: "blur(40px) saturate(1.5)",
          borderRadius:         "24px 24px 20px 20px",
          border:               "1px solid rgba(255,255,255,0.85)",
          boxShadow:            [
            "0 -2px 40px rgba(0,0,0,0.08)",
            "0 -1px 0 rgba(255,255,255,0.95)",
            "0 0 0 0.5px rgba(20,20,34,0.06)",
          ].join(", "),
          overflow:             "hidden",
        }}>
          <div style={{ padding:"20px 16px 16px" }}>

            {/* Header: Orb Signet */}
            <OrbSignet onClose={handleClose} />

            {/* 4 normale Bereiche */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
              {normal.map((area, idx) => (
                <AreaNormal
                  key={area.key}
                  area={area}
                  idx={idx}
                  hoveredKey={hoveredKey}
                  onHover={setHoveredKey}
                  onLeave={() => setHoveredKey(null)}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {/* Vision-Trennlinie */}
            <Divider />

            {/* Featured: Projekt */}
            {featured && (
              <div style={{ marginTop:10 }}>
                <AreaFeatured
                  area={featured}
                  idx={4}
                  hoveredKey={hoveredKey}
                  onHover={setHoveredKey}
                  onLeave={() => setHoveredKey(null)}
                  onSelect={handleSelect}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
